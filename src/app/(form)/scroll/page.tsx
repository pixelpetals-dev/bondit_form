"use client";

// Document Scroll — the concept the client locked in. The whole inspection as
// one readable document with a sticky section rail, jump links, live
// per-section progress, and a persistent save bar. Reads like the official
// warranty record it becomes.

import { useEffect, useReducer, useState } from "react";
import { SCHEMA } from "@/lib/schema";
import { useStore } from "@/lib/store";
import { visibleGroups, sectionProgress, overallProgress, isSharedGroup } from "@/lib/engine";
import { GroupBody } from "@/components/GroupBlock";
import { RoofBar, SectionHead, GroupScopeBadge } from "@/components/chrome";
import { RoofFab } from "@/components/RoofFab";
import { RoofScopeProvider } from "@/components/roofscope";
import { SubmittedPanel } from "@/components/SubmittedPanel";
import { JumpProvider, flashField } from "@/components/jump";
import { Check } from "@/components/icons";

// --- Per-section save (UI only — needs backend wiring) ----------------------
// TODO(backend): the client wants saves tied to the contractor's login/session
// so an inspection started onsite can be resumed out of order, hours later, or
// on another device (client rep 1307). Until auth + an API exist, "Save" only
// records a timestamp in localStorage beside the auto-saved answers — i.e. it
// persists per device, not per account. Replace `saveSection` with a real API
// call once the backend lands.
const SECTION_SAVES_KEY = "bondit:sectionSaves";

type Saves = Record<string, string>;
type SavesAction = { type: "hydrate"; saves: Saves } | { type: "save"; sectionId: string; at: string };

function savesReducer(state: Saves, action: SavesAction): Saves {
  return action.type === "hydrate" ? action.saves : { ...state, [action.sectionId]: action.at };
}

function useSectionSaves() {
  const [saves, dispatch] = useReducer(savesReducer, {});
  // hydrate from localStorage after mount to avoid SSR mismatch (same as store.tsx)
  const [hydrated, setHydrated] = useReducer(() => true, false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SECTION_SAVES_KEY);
      if (raw) dispatch({ type: "hydrate", saves: JSON.parse(raw) as Saves });
    } catch {
      /* corrupt storage — start clean */
    }
    setHydrated();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(SECTION_SAVES_KEY, JSON.stringify(saves));
    } catch {
      /* quota / private mode — ignore */
    }
  }, [saves, hydrated]);

  const saveSection = (sectionId: string) =>
    dispatch({ type: "save", sectionId, at: new Date().toISOString() });
  return { saves, saveSection };
}

function SectionSaveRow({ savedAt, onSave }: { savedAt?: string; onSave: () => void }) {
  const time = savedAt
    ? new Date(savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;
  return (
    <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
      {time ? (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ready">
          <Check className="h-3.5 w-3.5" /> Saved <span className="readout">{time}</span>
        </span>
      ) : null}
      <button
        type="button"
        onClick={onSave}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-bond px-4 text-sm font-semibold text-bond-deep transition-colors hover:bg-bond/[0.06]"
      >
        {time ? "Save again" : "Save section"}
      </button>
    </div>
  );
}

export default function ScrollPage() {
  const { answers, hydrated } = useStore();
  const [active, setActive] = useState(SCHEMA[0].id);
  const [roofRelevant, setRoofRelevant] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { saves, saveSection } = useSectionSaves();
  const overall = overallProgress(answers);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    SCHEMA.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [hydrated]);

  // Track whether the group currently in view is roof-specific, to toggle the FAB.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setRoofRelevant(vis[0].target.getAttribute("data-group-scope") === "roof");
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    document.querySelectorAll("[data-group-scope]").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [hydrated, answers]);

  if (submitted) return <main className="flex-1"><SubmittedPanel onBack={() => setSubmitted(false)} /></main>;

  return (
    <JumpProvider jump={(id) => flashField(id)}>
    <RoofScopeProvider relevant={roofRelevant}>
    <RoofFab />
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-4">
      <RoofBar />

      {/* Mobile section pills */}
      <nav aria-label="Sections" className="sticky top-[53px] z-20 -mx-4 mt-3 flex gap-2 overflow-x-auto border-b border-line bg-mist/95 px-4 py-2 backdrop-blur md:hidden">
        {SCHEMA.map((s) => (
          <a key={s.id} href={`#${s.id}`}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${active === s.id ? "border-bond bg-bond text-white" : "border-line bg-paper text-ink-soft"}`}>
            {s.index}. {s.title}
          </a>
        ))}
      </nav>

      <div className="mt-4 flex gap-8">
        {/* Desktop rail */}
        <aside className="sticky top-20 hidden h-fit w-60 shrink-0 md:block">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-ink-faint">Inspection record</p>
          <ol className="space-y-1">
            {SCHEMA.map((s) => {
              const p = sectionProgress(s, answers);
              const done = p.total > 0 && p.done === p.total;
              const on = active === s.id;
              return (
                <li key={s.id}>
                  <a href={`#${s.id}`}
                    className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors ${on ? "border-bond/40 bg-bond/[0.05]" : "border-transparent hover:bg-mist-deep"}`}>
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-display text-xs font-bold ${done ? "bg-ready text-white" : on ? "bg-bond text-white" : "bg-mist-deep text-ink-soft"}`}>
                      {done ? <Check className="h-3.5 w-3.5" /> : String(s.index).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">
                      <span className={`block truncate text-sm font-semibold ${on ? "text-ink" : "text-ink-soft"}`}>{s.title}</span>
                      {p.total > 0 ? <span className="readout text-[11px] text-ink-faint">{p.done}/{p.total} fields</span> : null}
                    </span>
                  </a>
                </li>
              );
            })}
          </ol>
          <div className="mt-4 rounded-lg border border-line bg-paper p-3">
            <div className="flex items-center justify-between text-xs font-semibold text-ink-soft">
              <span>Overall</span><span className="readout">{overall.pct}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-mist-deep">
              <div className="h-full rounded-full bg-bond" style={{ width: `${overall.pct}%` }} />
            </div>
          </div>
        </aside>

        {/* Document body */}
        <div className="min-w-0 flex-1 space-y-10">
          {SCHEMA.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-32">
              <SectionHead index={s.index} title={s.title} blurb={s.blurb} />
              <div className="mt-5 space-y-5">
                {visibleGroups(s, answers).map((g) => (
                  <div key={g.id} data-group-scope={isSharedGroup(g) ? "shared" : "roof"} className="rounded-xl border border-line bg-paper p-5 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-bold text-ink">{g.title}</h3>
                      <GroupScopeBadge group={g} />
                    </div>
                    {g.note ? <p className="mt-0.5 text-sm text-ink-soft">{g.note}</p> : null}
                    <div className="mt-4">
                      <GroupBody group={g} />
                    </div>
                  </div>
                ))}
                <SectionSaveRow savedAt={saves[s.id]} onSave={() => saveSection(s.id)} />
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Save bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="hidden h-2 w-32 overflow-hidden rounded-full bg-mist-deep sm:block">
              <div className="h-full rounded-full bg-bond" style={{ width: `${overall.pct}%` }} />
            </div>
            <span className="readout text-xs text-ink-faint">Auto-saved · {overall.pct}%</span>
          </div>
          <button
            type="button"
            onClick={() => setSubmitted(true)}
            className="inline-flex min-h-12 items-center gap-1.5 rounded-lg bg-bond px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1888bd]"
          >
            Submit inspection <Check className="h-4 w-4" />
          </button>
        </div>
      </div>
    </main>
    </RoofScopeProvider>
    </JumpProvider>
  );
}
