"use client";

// Concept C — Section Dashboard. Collapsible section cards with completion
// ticks and an always-visible live score. Built for experienced evaluators who
// jump around and re-enter quickly.

import { useState } from "react";
import { SCHEMA } from "@/lib/schema";
import { useStore } from "@/lib/store";
import { visibleGroups, sectionProgress, groupProgress, overallProgress, locateField } from "@/lib/engine";
import { GroupBody } from "@/components/GroupBlock";
import { RoofBar, AccordionChevron, GroupScopeBadge } from "@/components/chrome";
import { RoofFab } from "@/components/RoofFab";
import { ReadinessMeter } from "@/components/ReadinessMeter";
import { SubmittedPanel } from "@/components/SubmittedPanel";
import { JumpProvider, flashField } from "@/components/jump";
import { Check } from "@/components/icons";

function Tick({ done, total }: { done: number; total: number }) {
  const complete = total > 0 && done === total;
  if (total === 0) return <span className="h-5 w-5" aria-hidden />;
  return complete ? (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ready text-white" aria-label="Complete">
      <Check className="h-3.5 w-3.5" />
    </span>
  ) : (
    <span className="readout flex h-5 items-center rounded-full bg-mist-deep px-1.5 text-[10px] font-semibold text-ink-soft" aria-label={`${done} of ${total} done`}>
      {done}/{total}
    </span>
  );
}

export default function DashboardPage() {
  const { answers, scorecard } = useStore();
  const [open, setOpen] = useState<Record<string, boolean>>({ [SCHEMA[0].id]: true });
  const [submitted, setSubmitted] = useState(false);
  const overall = overallProgress(answers);

  const toggle = (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  const jump = (fieldId: string) => {
    const loc = locateField(fieldId);
    if (loc) setOpen((o) => ({ ...o, [loc.section.id]: true }));
    window.setTimeout(() => flashField(fieldId), 90);
  };

  if (submitted) return <main className="flex-1"><SubmittedPanel onBack={() => setSubmitted(false)} /></main>;

  return (
    <JumpProvider jump={jump}>
    <RoofFab />
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-10 pt-4">
      <RoofBar />

      {/* Mobile score bar */}
      <div className="sticky top-[53px] z-20 -mx-4 mt-3 border-b border-line bg-mist/95 px-4 py-2 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-ink">
            <span className={`h-2.5 w-2.5 rounded-full ${scorecard.band === "ready" ? "bg-ready" : scorecard.band === "prep" ? "bg-prep-accent" : "bg-notready"}`} />
            {scorecard.bandLabel}
          </span>
          <span className="readout text-sm text-ink-soft">{scorecard.total}/50 · {overall.pct}%</span>
        </div>
      </div>

      <div className="mt-4 flex gap-6">
        {/* Accordion column */}
        <div className="min-w-0 flex-1 space-y-3">
          {SCHEMA.map((s) => {
            const p = sectionProgress(s, answers);
            const isOpen = !!open[s.id];
            const groups = visibleGroups(s, answers);
            return (
              <section key={s.id} className="overflow-hidden rounded-xl border border-line bg-paper shadow-sm">
                <button
                  type="button"
                  onClick={() => toggle(s.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-mist/60"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bond/10 font-display text-sm font-bold text-bond-deep">
                    {String(s.index).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-base font-bold text-ink">{s.title}</span>
                    <span className="block truncate text-xs text-ink-faint">{s.blurb}</span>
                  </span>
                  <Tick done={p.done} total={p.total} />
                  <span className="text-ink-faint"><AccordionChevron open={isOpen} /></span>
                </button>

                {isOpen ? (
                  <div className="space-y-4 border-t border-line px-4 py-4">
                    {groups.map((g) => {
                      const gp = groupProgress(g, answers);
                      return (
                        <div key={g.id} className="rounded-lg border border-line bg-mist/40 p-4">
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-bold uppercase tracking-wide text-ink-soft">{g.title}</h3>
                                <GroupScopeBadge group={g} />
                              </div>
                              {g.note ? <p className="mt-0.5 text-xs text-ink-faint">{g.note}</p> : null}
                            </div>
                            <Tick done={gp.done} total={gp.total} />
                          </div>
                          <GroupBody group={g} />
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </section>
            );
          })}

          <button
            type="button"
            onClick={() => setSubmitted(true)}
            className="inline-flex min-h-12 w-full items-center justify-center gap-1.5 rounded-lg bg-bond px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1888bd] lg:hidden"
          >
            Submit inspection <Check className="h-4 w-4" />
          </button>
        </div>

        {/* Sticky score sidebar (desktop) */}
        <aside className="sticky top-20 hidden h-fit w-72 shrink-0 lg:block">
          <ReadinessMeter card={scorecard} compact />
          <div className="mt-3 rounded-xl border border-line bg-paper p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-ink-soft">
              <span>Overall completion</span><span className="readout">{overall.pct}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-mist-deep">
              <div className="h-full rounded-full bg-bond" style={{ width: `${overall.pct}%` }} />
            </div>
            <button
              type="button"
              onClick={() => setSubmitted(true)}
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-1.5 rounded-lg bg-bond px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1888bd]"
            >
              Submit inspection <Check className="h-4 w-4" />
            </button>
          </div>
        </aside>
      </div>
    </main>
    </JumpProvider>
  );
}
