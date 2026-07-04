"use client";

// Renders one group's body. Two groups are special (a checklist and the
// scorecard); everything else is a field grid. Shared by all concepts.

import type { GroupDef } from "@/lib/types";
import { FieldGrid } from "./FieldRenderer";
import { ChecklistPanel } from "./ChecklistPanel";
import { ScorecardPanel } from "./ScorecardPanel";

export function GroupBody({ group }: { group: GroupDef }) {
  if (group.id === "checklist") return <ChecklistPanel />;
  if (group.id === "scorecard") return <ScorecardPanel />;
  return <FieldGrid group={group} />;
}
