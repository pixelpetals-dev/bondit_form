"use client";

// Live scorecard — reads the store, shows the readiness meter plus the A/B/C/D
// breakdown with the exact deductions applied. Fully auto-calculated.

import { useStore } from "@/lib/store";
import type { Scorecard } from "@/lib/types";
import { ReadinessMeter } from "./ReadinessMeter";

function CategoryRow({ c }: { c: Scorecard["categories"][number] }) {
  const pct = (c.score / c.max) * 100;
  return (
    <div className="rounded-lg border border-line bg-paper p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-mist-deep font-display text-xs font-bold text-ink-soft">{c.key}</span>
          <span className="text-sm font-semibold text-ink">{c.label}</span>
        </div>
        <span className="readout text-sm font-semibold text-ink">
          {c.score}<span className="text-ink-faint"> / {c.max}</span>
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-mist-deep">
        <div className="h-full rounded-full bg-bond" style={{ width: `${pct}%` }} />
      </div>
      {c.deductions.length > 0 ? (
        <ul className="mt-2 space-y-0.5">
          {c.deductions.map((d, i) => (
            <li key={i} className="text-[11px] leading-snug text-ink-faint">— {d}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function ScorecardPanel() {
  const { scorecard, roofScores, roofs } = useStore();
  return (
    <div className="flex flex-col gap-4">
      <ReadinessMeter card={scorecard} />
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {scorecard.categories.map((c) => (
          <CategoryRow key={c.key} c={c} />
        ))}
      </div>
      {roofs.length > 1 ? (
        <div className="rounded-lg border border-line bg-mist p-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Per-roof summary</p>
          <ul className="divide-y divide-line">
            {roofScores.map(({ roof, card }) => (
              <li key={roof.id} className="flex items-center justify-between py-1.5 text-sm">
                <span className="font-medium text-ink">{roof.name}</span>
                <span className="flex items-center gap-2">
                  <span className="readout text-ink-soft">{card.total}/50</span>
                  <span className="text-xs font-semibold uppercase text-ink-faint">{card.bandLabel}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
