"use client";

// Lets the photo/document checklist jump back to a missing field. The page
// provides the jump (scroll-to + flash); the checklist just calls jump(fieldId).

import { createContext, useContext, type ReactNode } from "react";

type JumpFn = (fieldId: string) => void;

const JumpContext = createContext<JumpFn | null>(null);

export function JumpProvider({ jump, children }: { jump: JumpFn; children: ReactNode }) {
  return <JumpContext.Provider value={jump}>{children}</JumpContext.Provider>;
}

export function useJump(): JumpFn | null {
  return useContext(JumpContext);
}

/** Scroll a field into view and flash it — used by the scroll & dashboard jumps. */
export function flashField(fieldId: string) {
  const el = document.getElementById(`field-${fieldId}`);
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.add("field-flash");
  window.setTimeout(() => el.classList.remove("field-flash"), 1600);
  return true;
}
