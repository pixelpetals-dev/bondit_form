"use client";

// The signature element — the /50 score resolved onto a readiness gauge.
// Colour is never the only signal: band label + icon carry the same meaning.

import type { Scorecard } from "@/lib/types";
import { Check, Warn, X, Gauge } from "./icons";

const BANDS = [
  { key: "notready", label: "NOT READY", from: 0, to: 24, color: "var(--color-notready)" },
  { key: "prep", label: "PREP NEEDED", from: 25, to: 39, color: "var(--color-prep-accent)" },
  { key: "ready", label: "READY", from: 40, to: 50, color: "var(--color-ready)" },
] as const;

const TONE = {
  ready: { text: "text-ready", tint: "bg-ready-tint", border: "border-ready/30", Icon: Check },
  prep: { text: "text-prep", tint: "bg-prep-tint", border: "border-prep-accent/40", Icon: Warn },
  notready: { text: "text-notready", tint: "bg-notready-tint", border: "border-notready/30", Icon: X },
};

export function ReadinessMeter({ card, compact = false }: { card: Scorecard; compact?: boolean }) {
  const pct = Math.max(0, Math.min(100, (card.total / card.max) * 100));
  const tone = TONE[card.band];

  return (
    <div className={`rounded-xl border ${tone.border} ${tone.tint} ${compact ? "p-4" : "p-5"}`}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-ink-faint">
            <Gauge className="h-3.5 w-3.5" /> Readiness
          </div>
          <div className={`mt-1 inline-flex items-center gap-2 font-display text-2xl font-bold ${tone.text}`}>
            <tone.Icon className="h-6 w-6" />
            {card.bandLabel}
          </div>
        </div>
        <div className="text-right leading-none">
          <span className="readout text-4xl font-bold text-ink">{card.total}</span>
          <span className="readout text-lg text-ink-faint"> / {card.max}</span>
        </div>
      </div>

      {/* Gauge track */}
      <div className="relative mt-4">
        <div className="flex h-3 overflow-hidden rounded-full">
          {BANDS.map((b) => (
            <div
              key={b.key}
              style={{ width: `${((b.to - b.from + 1) / (card.max + 1)) * 100}%`, background: b.color, opacity: card.band === b.key ? 1 : 0.28 }}
            />
          ))}
        </div>
        {/* Marker */}
        <div className="absolute -top-1 -translate-x-1/2" style={{ left: `${pct}%` }} aria-hidden>
          <div className="h-5 w-1 rounded-full bg-ink shadow" />
        </div>
        <div className="mt-1.5 flex justify-between">
          {BANDS.map((b) => (
            <span key={b.key} className={`text-[10px] font-semibold uppercase tracking-wide ${card.band === b.key ? tone.text : "text-ink-faint"}`}>
              {b.label}
            </span>
          ))}
        </div>
      </div>

      {!compact ? (
        <p className={`mt-3 text-sm font-medium ${tone.text}`}>{card.recommendation}</p>
      ) : null}
    </div>
  );
}
