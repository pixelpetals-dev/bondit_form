"use client";

// Floating roof control — keeps the "add another roof section" affordance
// visible after the top roof bar scrolls away, so multi-roof stays discoverable.

import { useStore } from "@/lib/store";
import { Plus, Building } from "./icons";

export function RoofFab() {
  const { roofs, activeRoof, addRoof, setActiveRoof } = useStore();
  const multi = roofs.length > 1;

  return (
    <div className="fixed bottom-20 left-3 z-40 flex items-center gap-1.5 rounded-full border border-line bg-paper/95 py-1.5 pl-1.5 pr-1.5 shadow-lg backdrop-blur">
      {multi ? (
        // Compact roof switcher when several roofs exist.
        <div className="flex items-center gap-1">
          {roofs.map((r) => {
            const on = r.id === activeRoof.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setActiveRoof(r.id)}
                className={`h-7 rounded-full px-2.5 text-xs font-bold transition-colors ${
                  on ? "bg-bond text-white" : "text-ink-soft hover:bg-mist"
                }`}
                title={`Switch to ${r.name}`}
              >
                {r.name.replace("Roof ", "")}
              </button>
            );
          })}
        </div>
      ) : (
        <span className="inline-flex items-center gap-1.5 pl-1.5 text-xs font-semibold text-ink-soft">
          <Building className="h-3.5 w-3.5 text-ink-faint" />
          1 roof
        </span>
      )}
      <button
        type="button"
        onClick={addRoof}
        title="Add another roof section (Roof A, B, C…)"
        className="inline-flex items-center gap-1 rounded-full bg-bond px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#1888bd]"
      >
        <Plus className="h-3.5 w-3.5" />
        Add roof
      </button>
    </div>
  );
}
