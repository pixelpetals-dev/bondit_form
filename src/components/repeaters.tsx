"use client";

// Repeating composites: parapet walls (feeds the coated-area calc) and adhesion
// tests (derives pass/fail). Both store an array of row objects.

import { useRef, useState } from "react";
import type { FieldDef } from "@/lib/types";
import type { ParapetWall, AdhesionTest, RowPhoto } from "@/lib/predicates";
import { testPassed } from "@/lib/predicates";
import { Plus, Trash, Check, X, Ruler, Camera } from "./icons";

/** Compact single-photo capture used inside a repeater row. */
function MiniPhoto({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: RowPhoto;
  onChange: (v: RowPhoto | undefined) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>();
  const has = !!value;
  return (
    <div className="flex flex-col gap-1">
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            setPreview(URL.createObjectURL(f));
            onChange({ name: f.name || label, kind: "image" });
          }
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className={`relative flex h-16 flex-col items-center justify-center gap-1 overflow-hidden rounded-md border text-center text-[10px] font-medium transition-colors ${
          has ? "border-bond bg-bond/[0.05] text-bond-deep" : "border-dashed border-line-strong text-ink-faint hover:border-bond"
        }`}
      >
        {has && preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={label} className="h-full w-full object-cover" />
        ) : (
          <>
            {has ? <Check className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
            <span className="px-1 leading-tight">{label}</span>
          </>
        )}
      </button>
    </div>
  );
}

const cell =
  "w-full rounded-md border border-line bg-paper px-2.5 h-11 text-sm text-ink readout placeholder:font-sans placeholder:text-ink-faint";

const FAILURE_MODE = ["A — Adhesive (FAIL)", "C — Cohesive (PASS)", "S — Substrate (PASS)"];

export function ParapetRepeater({
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (v: ParapetWall[]) => void;
}) {
  const walls = Array.isArray(value) ? (value as ParapetWall[]) : [];
  const update = (i: number, patch: Partial<ParapetWall>) =>
    onChange(walls.map((w, idx) => (idx === i ? { ...w, ...patch } : w)));
  const add = () => onChange([...walls, { height: "", lf: "" }]);
  const remove = (i: number) => onChange(walls.filter((_, idx) => idx !== i));

  return (
    <div className="flex flex-col gap-2">
      {walls.map((w, i) => {
        const sf = Number(w.lf) && Number(w.height) ? Math.round((Number(w.lf) * Number(w.height)) / 12) : null;
        return (
          <div key={i} className="rounded-lg border border-line bg-mist p-2.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                <Ruler className="h-3.5 w-3.5 text-bond-deep" /> Wall {i + 1}
              </span>
              <button type="button" onClick={() => remove(i)} aria-label={`Remove wall ${i + 1}`}
                className="text-ink-faint hover:text-notready"><Trash className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-[11px] font-medium text-ink-faint">
                Avg height (in)
                <input className={cell} inputMode="decimal" value={String(w.height ?? "")} placeholder="0"
                  onChange={(e) => update(i, { height: e.target.value })} />
              </label>
              <label className="flex flex-col gap-1 text-[11px] font-medium text-ink-faint">
                Length (LF)
                <input className={cell} inputMode="decimal" value={String(w.lf ?? "")} placeholder="0"
                  onChange={(e) => update(i, { lf: e.target.value })} />
              </label>
            </div>
            <div className="mt-2 flex items-center justify-end gap-1.5 text-xs text-ink-faint">
              Coated area
              <span className="readout font-semibold text-ink">{sf !== null ? sf.toLocaleString() : "—"}</span> SF
            </div>
          </div>
        );
      })}
      <button type="button" onClick={add}
        className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-dashed border-line-strong bg-paper text-sm font-semibold text-bond-deep hover:border-bond hover:bg-bond/[0.04]">
        <Plus className="h-4 w-4" /> Add parapet wall
      </button>
    </div>
  );
}

export function AdhesionRepeater({
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (v: AdhesionTest[]) => void;
}) {
  const tests = Array.isArray(value) ? (value as AdhesionTest[]) : [];
  const update = (i: number, patch: Partial<AdhesionTest>) =>
    onChange(tests.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  const add = () => onChange([...tests, { location: "", substrate: "", psi: "", failureMode: "" }]);
  const remove = (i: number) => onChange(tests.filter((_, idx) => idx !== i));

  return (
    <div className="flex flex-col gap-2.5">
      {tests.map((t, i) => {
        const pass = t.failureMode ? testPassed(t) : null;
        return (
          <div key={i} className="rounded-lg border border-line bg-mist p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Test {i + 1}</span>
              <div className="flex items-center gap-2">
                {pass !== null ? (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${pass ? "bg-ready-tint text-ready" : "bg-notready-tint text-notready"}`}>
                    {pass ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    {pass ? "Pass" : "Fail"}
                  </span>
                ) : null}
                <button type="button" onClick={() => remove(i)} aria-label={`Remove test ${i + 1}`}
                  className="text-ink-faint hover:text-notready"><Trash className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="col-span-2 flex flex-col gap-1 text-[11px] font-medium text-ink-faint">
                Location
                <input className={`${cell} placeholder:font-sans`} value={t.location ?? ""} placeholder="e.g. NW corner, 10ft from parapet"
                  onChange={(e) => update(i, { location: e.target.value })} />
              </label>
              <label className="flex flex-col gap-1 text-[11px] font-medium text-ink-faint">
                Substrate
                <input className={cell} value={t.substrate ?? ""} placeholder="—"
                  onChange={(e) => update(i, { substrate: e.target.value })} />
              </label>
              <label className="flex flex-col gap-1 text-[11px] font-medium text-ink-faint">
                PSI
                <input className={cell} inputMode="decimal" value={String(t.psi ?? "")} placeholder="0"
                  onChange={(e) => update(i, { psi: e.target.value })} />
              </label>
              <label className="col-span-2 flex flex-col gap-1 text-[11px] font-medium text-ink-faint">
                Failure mode
                <select className={`${cell} font-sans`} value={t.failureMode ?? ""}
                  onChange={(e) => update(i, { failureMode: e.target.value })}>
                  <option value="" disabled>Select…</option>
                  {FAILURE_MODE.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </label>
            </div>
            <div className="mt-2">
              <p className="mb-1 text-[11px] font-medium text-ink-faint">Required photos</p>
              <div className="grid grid-cols-3 gap-2">
                <MiniPhoto label="Dolly before" value={t.photoBefore} onChange={(v) => update(i, { photoBefore: v })} />
                <MiniPhoto label="Dolly after" value={t.photoAfter} onChange={(v) => update(i, { photoAfter: v })} />
                <MiniPhoto label="PSI reading" value={t.photoPsi} onChange={(v) => update(i, { photoPsi: v })} />
              </div>
            </div>
          </div>
        );
      })}
      <button type="button" onClick={add}
        className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-dashed border-line-strong bg-paper text-sm font-semibold text-bond-deep hover:border-bond hover:bg-bond/[0.04]">
        <Plus className="h-4 w-4" /> Add test result
      </button>
    </div>
  );
}
