"use client";

// Shared chrome: brand header (logo + reference) and the roof switcher.

import Image from "next/image";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { sectionsCompleted } from "@/lib/engine";
import { Plus, Trash } from "./icons";

export function BrandLogo({ className = "h-6" }: { className?: string }) {
  return (
    <Image
      src="/bond-it-logo.png"
      alt="Bond It"
      width={2786}
      height={786}
      priority
      // height comes from className; width scales to keep aspect ratio
      className={`w-auto ${className}`}
    />
  );
}

export function BrandHeader() {
  const { ref } = useStore();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5">
        <Link href="/" className="flex items-center gap-3">
          <BrandLogo className="h-6" />
          <span className="hidden border-l border-line pl-3 text-[11px] font-semibold uppercase tracking-widest text-ink-faint sm:inline">
            Pre-Coating Inspection
          </span>
        </Link>
        <span className="readout text-[11px] text-ink-faint">{ref}</span>
      </div>
    </header>
  );
}

export function RoofBar() {
  const { roofs, activeRoofId, setActiveRoof, addRoof, removeRoof, answers } = useStore();
  const sections = sectionsCompleted(answers);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {roofs.map((r) => {
          const active = r.id === activeRoofId;
          return (
            <span key={r.id} className="inline-flex items-center">
              <button
                type="button"
                onClick={() => setActiveRoof(r.id)}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-l-lg border px-3 text-sm font-semibold transition-colors ${
                  active ? "border-bond bg-bond text-white" : "border-line bg-paper text-ink-soft hover:border-line-strong"
                } ${roofs.length > 1 ? "" : "rounded-r-lg"}`}
              >
                {r.name}
              </button>
              {roofs.length > 1 ? (
                <button
                  type="button"
                  aria-label={`Remove ${r.name}`}
                  onClick={() => removeRoof(r.id)}
                  className={`inline-flex min-h-9 items-center rounded-r-lg border border-l-0 px-1.5 ${
                    active ? "border-bond bg-bond text-white/80 hover:text-white" : "border-line bg-paper text-ink-faint hover:text-notready"
                  }`}
                >
                  <Trash className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </span>
          );
        })}
        <button
          type="button"
          onClick={addRoof}
          className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-dashed border-line-strong px-2.5 text-sm font-semibold text-bond-deep hover:border-bond hover:bg-bond/[0.04]"
        >
          <Plus className="h-4 w-4" /> Roof
        </button>
      </div>
      <span className="readout text-xs text-ink-faint">
        {sections.done} of {sections.total} sections complete
      </span>
    </div>
  );
}

/** A section header block: index chip, title, blurb, swoosh rule. */
export function SectionHead({ index, title, blurb }: { index: number; title: string; blurb: string }) {
  return (
    <div>
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 items-center rounded-md bg-bond/10 px-2 font-display text-sm font-bold text-bond-deep">
          {String(index).padStart(2, "0")}
        </span>
        <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">{title}</h2>
      </div>
      <p className="mt-1.5 text-sm text-ink-soft">{blurb}</p>
      <div className="swoosh-rule mt-3 w-24" />
    </div>
  );
}

/** Small chip naming the roof profile currently being filled (2+ roofs only). */
export function ActiveRoofChip() {
  const { roofs, activeRoof } = useStore();
  if (roofs.length <= 1) return null;
  return (
    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-bond/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-bond-deep">
      Filling: {activeRoof.name}
    </span>
  );
}
