"use client";

import { useStore } from "@/lib/store";
import { ReadinessMeter } from "./ReadinessMeter";
import { Check, ChevronLeft } from "./icons";

export function SubmittedPanel({ onBack }: { onBack: () => void }) {
  const { ref, scorecard } = useStore();
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="rounded-xl border border-line bg-paper p-6 shadow-sm sm:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ready text-white">
          <Check className="h-7 w-7" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold text-ink">Inspection submitted</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          A branded Bond It PDF would now be generated and emailed to the evaluator and Bond It, and
          offered for download. (PDF + email are out of scope for this prototype.)
        </p>
        <p className="readout mt-4 rounded-lg bg-mist px-3 py-2 text-sm text-ink-soft">
          Reference <span className="font-semibold text-ink">{ref}</span>
        </p>
        <div className="mt-5">
          <ReadinessMeter card={scorecard} />
        </div>
        <button
          type="button"
          onClick={onBack}
          className="mt-6 inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-line px-4 text-sm font-semibold text-ink-soft hover:bg-mist"
        >
          <ChevronLeft className="h-4 w-4" /> Back to form
        </button>
      </div>
    </div>
  );
}
