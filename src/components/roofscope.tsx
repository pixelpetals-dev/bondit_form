"use client";

// Lets the page tell the floating roof control whether the content the user
// is currently on is roof-specific (show the FAB) or shared/common (hide it).

import { createContext, useContext, type ReactNode } from "react";

const RoofScopeContext = createContext<boolean>(true);

export function RoofScopeProvider({
  relevant,
  children,
}: {
  relevant: boolean;
  children: ReactNode;
}) {
  return <RoofScopeContext.Provider value={relevant}>{children}</RoofScopeContext.Provider>;
}

export function useRoofRelevant(): boolean {
  return useContext(RoofScopeContext);
}
