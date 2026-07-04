"use client";

// Concept A — Guided Wizard. One group per screen, top progress, Next/Back,
// required-field gating, and a submission summary.

import { useMemo, useState } from "react";
import { SCHEMA } from "@/lib/schema";
import { useStore } from "@/lib/store";
import { visibleGroups, groupProgress } from "@/lib/engine";
import { GroupBody } from "@/components/GroupBlock";
import { RoofBar, GroupScopeBadge } from "@/components/chrome";
import { RoofFab } from "@/components/RoofFab";
import { ReadinessMeter } from "@/components/ReadinessMeter";
import { JumpProvider, flashField } from "@/components/jump";
import { ChevronLeft, ChevronRight, Check, Warn } from "@/components/icons";

export default function WizardPage() {
  const { answers, scorecard, ref, hydrated } = useStore();
  const [step, setStep] = useState(0);
  const [attempted, setAttempted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const steps = useMemo(
    () => SCHEMA.flatMap((s) => visibleGroups(s, answers).map((g) => ({ section: s, group: g }))),
    [answers],
  );
  const total = steps.length;
  const idx = Math.min(step, total - 1);
  const current = steps[idx];

  const goto = (i: number) => {
    setStep(Math.max(0, Math.min(total - 1, i)));
    setAttempted(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const jump = (fieldId: string) => {
    const to = steps.findIndex((s) => s.group.fields.some((f) => f.id === fieldId));
    if (to >= 0) {
      setStep(to);
      setAttempted(false);
      window.setTimeout(() => flashField(fieldId), 120);
    }
  };

  if (!hydrated || !current) {
    return <div className="mx-auto max-w-3xl px-4 py-10 text-ink-faint">Loading…</div>;
  }

  const prog = groupProgress(current.group, answers);
  const isLast = idx === total - 1;
  const remaining = prog.total - prog.done;

  const next = () => {
    if (!prog.complete) {
      setAttempted(true);
      return;
    }
    if (isLast) {
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    goto(idx + 1);
  };

  if (submitted) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-10">
        <div className="rounded-xl border border-line bg-paper p-6 shadow-sm sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ready text-white">
            <Check className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-ink">Inspection submitted</h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            A branded PDF would now be generated and emailed to the evaluator and Bond It, and offered for
            download. (PDF + email are out of scope for this prototype.)
          </p>
          <p className="readout mt-4 rounded-lg bg-mist px-3 py-2 text-sm text-ink-soft">
            Reference <span className="font-semibold text-ink">{ref}</span>
          </p>
          <div className="mt-5">
            <ReadinessMeter card={scorecard} />
          </div>
          <button
            type="button"
            onClick={() => { setSubmitted(false); setStep(0); }}
            className="mt-6 inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-line px-4 text-sm font-semibold text-ink-soft hover:bg-mist"
          >
            <ChevronLeft className="h-4 w-4" /> Back to form
          </button>
        </div>
      </main>
    );
  }

  return (
    <JumpProvider jump={jump}>
    <RoofFab />
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-28 pt-4">
      <RoofBar />

      {/* Step progress */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-semibold text-ink-faint">
          <span className="uppercase tracking-wide text-bond-deep">
            Section {current.section.index} · {current.section.title}
          </span>
          <span className="readout">Step {idx + 1} / {total}</span>
        </div>
        <div className="mt-2 flex gap-1">
          {steps.map((s, i) => (
            <span
              key={`${s.section.id}-${s.group.id}`}
              className={`h-1.5 flex-1 rounded-full transition-colors ${i < idx ? "bg-bond" : i === idx ? "bg-bond/50" : "bg-mist-deep"}`}
            />
          ))}
        </div>
      </div>

      {/* Current group card */}
      <div className="mt-5 flex-1 rounded-xl border border-line bg-paper p-5 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-bold text-ink">{current.group.title}</h2>
              <GroupScopeBadge group={current.group} />
            </div>
            {current.group.note ? <p className="mt-1 text-sm text-ink-soft">{current.group.note}</p> : null}
          </div>
          {prog.total > 0 ? (
            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${prog.complete ? "bg-ready-tint text-ready" : "bg-mist-deep text-ink-soft"}`}>
              {prog.complete ? <Check className="h-3.5 w-3.5" /> : null}
              {prog.done}/{prog.total}
            </span>
          ) : null}
        </div>
        <div className="swoosh-rule mt-3 w-16" />
        <div className="mt-5">
          <GroupBody group={current.group} />
        </div>

        {attempted && !prog.complete ? (
          <div role="alert" className="mt-5 flex items-center gap-2 rounded-lg border border-prep-accent/40 bg-prep-tint px-3.5 py-2.5 text-sm font-medium text-prep">
            <Warn className="h-4 w-4 shrink-0" />
            Complete {remaining} more required field{remaining > 1 ? "s" : ""} to continue.
          </div>
        ) : null}
      </div>

      {/* Sticky nav */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => goto(idx - 1)}
            disabled={idx === 0}
            className="inline-flex min-h-12 items-center gap-1.5 rounded-lg border border-line px-4 text-sm font-semibold text-ink-soft transition-colors hover:bg-mist disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <button
            type="button"
            onClick={next}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-lg bg-bond px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1888bd] sm:flex-none sm:px-8"
          >
            {isLast ? "Submit inspection" : "Save & continue"}
            {isLast ? <Check className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </main>
    </JumpProvider>
  );
}
