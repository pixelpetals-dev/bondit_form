"use client";

// Form state: shared project answers + per-roof answers, with localStorage
// auto-save and a reference number. One store powers all three concepts.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { Answers, Roof, Scorecard } from "./types";
import { SHARED_IDS } from "./engine";
import { scorecard } from "./calc";

const STORAGE_KEY = "bondit-inspection-v1";

interface State {
  ref: string;
  shared: Answers;
  roofs: Roof[];
  activeRoofId: string;
}

type Action =
  | { type: "set"; id: string; value: unknown }
  | { type: "addRoof" }
  | { type: "removeRoof"; roofId: string }
  | { type: "setActiveRoof"; roofId: string }
  | { type: "hydrate"; state: State }
  | { type: "setRef"; ref: string }
  | { type: "reset" };

const ROOF_LETTERS = "ABCDEFGH".split("");

function newRoof(index: number): Roof {
  return { id: `roof-${index}-${ROOF_LETTERS[index] ?? index}`, name: `Roof ${ROOF_LETTERS[index] ?? index + 1}`, answers: {} };
}

function makeRef(): string {
  // Client-only demo reference; real build assigns this server-side.
  const n = String((Math.floor(Date.now() / 1000) % 9000) + 1000);
  return `BIT-2025-${n}`;
}

// Deterministic placeholder so SSR and first client render match; a real
// reference is assigned on mount (client-only) to avoid hydration mismatch.
function initialState(): State {
  const first = newRoof(0);
  return { ref: "BIT-2025-…", shared: {}, roofs: [first], activeRoofId: first.id };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "set": {
      if (SHARED_IDS.has(action.id)) {
        return { ...state, shared: { ...state.shared, [action.id]: action.value } };
      }
      return {
        ...state,
        roofs: state.roofs.map((r) =>
          r.id === state.activeRoofId ? { ...r, answers: { ...r.answers, [action.id]: action.value } } : r,
        ),
      };
    }
    case "addRoof": {
      const roof = newRoof(state.roofs.length);
      return { ...state, roofs: [...state.roofs, roof], activeRoofId: roof.id };
    }
    case "removeRoof": {
      if (state.roofs.length <= 1) return state;
      const roofs = state.roofs.filter((r) => r.id !== action.roofId);
      const activeRoofId = state.activeRoofId === action.roofId ? roofs[0].id : state.activeRoofId;
      return { ...state, roofs, activeRoofId };
    }
    case "setActiveRoof":
      return { ...state, activeRoofId: action.roofId };
    case "hydrate":
      return action.state;
    case "setRef":
      return { ...state, ref: action.ref };
    case "reset":
      return initialState();
    default:
      return state;
  }
}

interface StoreValue {
  ref: string;
  hydrated: boolean;
  roofs: Roof[];
  activeRoof: Roof;
  activeRoofId: string;
  /** Merged view (shared + active roof) for showIf / compute / rendering. */
  answers: Answers;
  scorecard: Scorecard;
  set: (id: string, value: unknown) => void;
  get: (id: string) => unknown;
  addRoof: () => void;
  removeRoof: (roofId: string) => void;
  setActiveRoof: (roofId: string) => void;
  reset: () => void;
  /** Per-roof scorecards for the multi-roof summary. */
  roofScores: { roof: Roof; card: Scorecard }[];
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  // hydrate from localStorage after mount to avoid SSR mismatch
  const [hydrated, setHydrated] = useReducer(() => true, false);

  useEffect(() => {
    let hasDate = false;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as State;
        if (parsed && parsed.roofs?.length) {
          dispatch({ type: "hydrate", state: parsed });
          hasDate = !!parsed.shared?.inspectionDate;
        } else {
          dispatch({ type: "setRef", ref: makeRef() });
        }
      } else {
        dispatch({ type: "setRef", ref: makeRef() });
      }
    } catch {
      dispatch({ type: "setRef", ref: makeRef() });
    }
    // Default the inspection date to today (client-only avoids SSR mismatch).
    if (!hasDate) {
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      dispatch({ type: "set", id: "inspectionDate", value: today });
    }
    setHydrated();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota / private mode — ignore */
    }
  }, [state, hydrated]);

  const value = useMemo<StoreValue>(() => {
    const activeRoof = state.roofs.find((r) => r.id === state.activeRoofId) ?? state.roofs[0];
    const answers: Answers = { ...state.shared, ...activeRoof.answers };
    return {
      ref: state.ref,
      hydrated,
      roofs: state.roofs,
      activeRoof,
      activeRoofId: state.activeRoofId,
      answers,
      scorecard: scorecard(answers),
      set: (id, v) => dispatch({ type: "set", id, value: v }),
      get: (id) => answers[id],
      addRoof: () => dispatch({ type: "addRoof" }),
      removeRoof: (roofId) => dispatch({ type: "removeRoof", roofId }),
      setActiveRoof: (roofId) => dispatch({ type: "setActiveRoof", roofId }),
      reset: () => dispatch({ type: "reset" }),
      roofScores: state.roofs.map((roof) => ({ roof, card: scorecard({ ...state.shared, ...roof.answers }) })),
    };
  }, [state, hydrated]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
