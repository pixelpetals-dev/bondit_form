"use client";

// Whether the user has attempted to submit — after that, missing required
// fields are flagged in red wherever they render.

import { createContext, useContext, type ReactNode } from "react";

const AttemptedContext = createContext<boolean>(false);

export function AttemptedProvider({ attempted, children }: { attempted: boolean; children: ReactNode }) {
  return <AttemptedContext.Provider value={attempted}>{children}</AttemptedContext.Provider>;
}

export function useAttempted(): boolean {
  return useContext(AttemptedContext);
}
