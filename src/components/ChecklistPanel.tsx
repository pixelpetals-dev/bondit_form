"use client";

// Self-completing photo & document checklist. Auto-ticks required uploads that
// are done; lists what's still missing so it can be resolved before scoring.

import { useStore } from "@/lib/store";
import { completedCaptures, missingCaptures } from "@/lib/engine";
import { useJump } from "./jump";
import { Check, Camera, ChevronRight } from "./icons";

export function ChecklistPanel() {
  const { answers } = useStore();
  const jump = useJump();
  const { done, total } = completedCaptures(answers);
  const missing = missingCaptures(answers);
  const complete = missing.length === 0;

  return (
    <div className="flex flex-col gap-3">
      <div className={`flex items-center justify-between rounded-lg border p-3.5 ${complete ? "border-ready/30 bg-ready-tint" : "border-line bg-mist"}`}>
        <div className="flex items-center gap-2.5">
          <span className={`flex h-9 w-9 items-center justify-center rounded-full ${complete ? "bg-ready text-white" : "bg-paper text-ink-soft border border-line"}`}>
            {complete ? <Check className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">
              {complete ? "All required media uploaded" : "Required media outstanding"}
            </p>
            <p className="text-xs text-ink-faint">Auto-checked from every required photo, video, and document.</p>
          </div>
        </div>
        <span className="readout text-lg font-bold text-ink">{done}<span className="text-ink-faint">/{total}</span></span>
      </div>

      {!complete ? (
        <ul className="divide-y divide-line rounded-lg border border-line bg-paper">
          {missing.map(({ section, group, field }) => {
            const content = (
              <>
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-line-strong" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{field.label}</p>
                  <p className="truncate text-[11px] text-ink-faint">{section} · {group}</p>
                </div>
                {jump ? <ChevronRight className="h-4 w-4 shrink-0 text-bond-deep" /> : null}
              </>
            );
            return (
              <li key={field.id}>
                {jump ? (
                  <button
                    type="button"
                    onClick={() => jump(field.id)}
                    className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-mist"
                  >
                    {content}
                  </button>
                ) : (
                  <div className="flex items-center gap-3 p-3">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
