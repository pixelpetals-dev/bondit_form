"use client";

// Presentational field controls — value in, onChange out. No store coupling,
// so the same controls render identically in every concept.

import { useEffect, useId, useState } from "react";
import type { FieldDef, CalcOutput } from "@/lib/types";
import { Check, X, Minus, Plus, Warn, Clock } from "./icons";

const pad = (n: number) => String(n).padStart(2, "0");

/** Current date/time as input-ready strings — client-only to avoid SSR drift. */
function useNow() {
  const [now, setNow] = useState<{ date: string; time: string } | null>(null);
  useEffect(() => {
    const d = new Date();
    // Client-only: intentionally null on the server so date/time buttons and
    // the max attribute don't cause a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow({
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    });
  }, []);
  return now;
}

const inputBase =
  "w-full rounded-lg border border-line bg-paper px-3.5 min-h-12 text-[15px] text-ink placeholder:text-ink-faint transition-colors hover:border-line-strong";

export function FieldShell({
  field,
  htmlFor,
  children,
}: {
  field: FieldDef;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {field.label ? (
        <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
          {field.label}
          {field.required ? <span className="text-bond-deep" aria-hidden> *</span> : null}
        </label>
      ) : null}
      {children}
      {field.help ? <p className="text-xs leading-snug text-ink-faint">{field.help}</p> : null}
    </div>
  );
}

export function TextControl({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (v: string) => void;
}) {
  const id = useId();
  const now = useNow();
  const isDate = field.type === "date";
  const isTime = field.type === "time";
  const type = field.type === "email" ? "email" : field.type === "tel" ? "tel" : isDate ? "date" : isTime ? "time" : "text";

  if (field.type === "textarea") {
    return (
      <textarea
        id={id}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        rows={3}
        className={`${inputBase} py-2.5 resize-y min-h-[84px]`}
      />
    );
  }

  if (isDate || isTime) {
    return (
      <div className="flex flex-col gap-1.5">
        <input
          id={id}
          type={type}
          value={(value as string) ?? ""}
          // block future inspection dates, per brief
          max={isDate ? now?.date : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputBase} h-12`}
        />
        {now ? (
          <button
            type="button"
            onClick={() => onChange(isDate ? now.date : now.time)}
            className="inline-flex min-h-9 w-fit items-center gap-1.5 rounded-lg border border-line bg-mist px-2.5 text-xs font-semibold text-bond-deep transition-colors hover:border-bond hover:bg-bond/[0.05]"
          >
            <Clock className="h-3.5 w-3.5" />
            {isDate ? "Set to today" : "Set to now"}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <input
      id={id}
      type={type}
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      className={`${inputBase} h-12`}
    />
  );
}

export function NumberControl({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (v: string) => void;
}) {
  const step = field.step ?? 1;
  const cur = value === "" || value === undefined || value === null ? NaN : Number(value);
  const bump = (dir: 1 | -1) => {
    const next = (Number.isFinite(cur) ? cur : 0) + dir * step;
    const clamped = field.min !== undefined ? Math.max(field.min, next) : next;
    onChange(String(field.max !== undefined ? Math.min(field.max, clamped) : clamped));
  };
  return (
    <div className="flex items-stretch gap-1.5">
      <button type="button" aria-label="Decrease" onClick={() => bump(-1)}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-line bg-mist text-ink-soft hover:bg-mist-deep active:scale-95">
        <Minus />
      </button>
      <div className="relative flex-1">
        <input
          type="number"
          inputMode="decimal"
          value={(value as string) ?? ""}
          min={field.min}
          max={field.max}
          step={step}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? "0"}
          className={`${inputBase} h-12 text-center readout ${field.unit ? "pr-12" : ""}`}
        />
        {field.unit ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ink-faint readout">
            {field.unit}
          </span>
        ) : null}
      </div>
      <button type="button" aria-label="Increase" onClick={() => bump(1)}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-line bg-mist text-ink-soft hover:bg-mist-deep active:scale-95">
        <Plus />
      </button>
    </div>
  );
}

export function SelectControl({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputBase} h-12 appearance-none pr-10 ${value ? "" : "text-ink-faint"}`}
      >
        <option value="" disabled>Select…</option>
        {field.options?.map((o) => (
          <option key={o} value={o} className="text-ink">{o}</option>
        ))}
      </select>
      <svg aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
    </div>
  );
}

export function MultiSelectControl({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (v: string[]) => void;
}) {
  const selected = Array.isArray(value) ? (value as string[]) : [];
  const toggle = (o: string) =>
    onChange(selected.includes(o) ? selected.filter((s) => s !== o) : [...selected, o]);
  return (
    <div className="flex flex-wrap gap-2">
      {field.options?.map((o) => {
        const on = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => toggle(o)}
            aria-pressed={on}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors ${
              on
                ? "border-bond bg-bond/10 text-bond-ink"
                : "border-line bg-paper text-ink-soft hover:border-line-strong"
            }`}
          >
            {on ? <Check className="h-4 w-4 text-bond-deep" /> : null}
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function ToggleControl({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (v: string) => void;
}) {
  const opts: { v: string; icon: React.ReactNode }[] = [
    { v: "Yes", icon: <Check className="h-4 w-4" /> },
    { v: "No", icon: <X className="h-4 w-4" /> },
  ];
  return (
    <div role="radiogroup" className="grid grid-cols-2 gap-2 max-w-xs">
      {opts.map(({ v, icon }) => {
        const on = value === v;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(v)}
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 text-sm font-semibold transition-all ${
              on
                ? v === "Yes"
                  ? "border-bond bg-bond text-white shadow-sm"
                  : "border-ink bg-ink text-white shadow-sm"
                : "border-line bg-paper text-ink-soft hover:border-line-strong"
            }`}
          >
            {icon}
            {v}
          </button>
        );
      })}
    </div>
  );
}

// The signature move: auto-calculated values as an instrument readout ---------
export function CalcReadout({ field, output }: { field: FieldDef; output: CalcOutput }) {
  const tone = output.status?.tone;
  return (
    <div className="relative overflow-hidden rounded-lg border border-bond/25 bg-bond/[0.04]">
      <div className="blueprint absolute inset-0 opacity-60" aria-hidden />
      <div className="relative p-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-bond-deep">
            {field.label || "Auto-calculated"}
          </span>
          {output.status ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                tone === "warn"
                  ? "bg-prep-tint text-prep"
                  : tone === "ok"
                    ? "bg-ready-tint text-ready"
                    : "bg-mist-deep text-ink-soft"
              }`}
            >
              {tone === "warn" ? <Warn className="h-3 w-3" /> : tone === "ok" ? <Check className="h-3 w-3" /> : null}
              {output.status.text}
            </span>
          ) : null}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1.5">
          {output.lines.map((l) => (
            <div key={l.label} className="flex items-baseline gap-1.5">
              <span className="readout text-2xl font-semibold text-ink">{l.value}</span>
              {l.unit ? <span className="readout text-sm text-ink-faint">{l.unit}</span> : null}
              <span className="ml-1 text-xs text-ink-faint">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function NotePanel({ field }: { field: FieldDef }) {
  const warn = (field.body ?? "").startsWith("⚠");
  return (
    <div
      className={`flex gap-2.5 rounded-lg border px-3.5 py-3 text-sm leading-relaxed ${
        warn ? "border-prep-accent/40 bg-prep-tint text-prep" : "border-line bg-mist text-ink-soft"
      }`}
      role={warn ? "alert" : undefined}
    >
      {warn ? <Warn className="mt-0.5 h-4 w-4 shrink-0" /> : null}
      <p className="whitespace-pre-line">{warn ? (field.body ?? "").replace(/^⚠\s*/, "") : field.body}</p>
    </div>
  );
}
