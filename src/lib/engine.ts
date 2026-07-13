// Visibility + completion helpers, derived purely from the schema and current
// answers.

import { SCHEMA } from "./schema";
import type { Answers, FieldDef, GroupDef, SectionDef } from "./types";

export const SHARED_IDS = new Set(
  SCHEMA.flatMap((s) => s.groups).flatMap((g) => g.fields).filter((f) => f.shared).map((f) => f.id),
);

export const isGroupVisible = (g: GroupDef, a: Answers) => !g.showIf || g.showIf(a);
export const isFieldVisible = (f: FieldDef, a: Answers) => !f.showIf || f.showIf(a);

/** True when every real field in the group is project-level (shared across roofs). */
export function isSharedGroup(g: GroupDef): boolean {
  const real = g.fields.filter((f) => f.type !== "note" && f.type !== "calc");
  return real.length > 0 && real.every((f) => f.shared);
}

/** Which section + group a field id lives in — powers the checklist jump-back. */
export function locateField(fieldId: string): { section: SectionDef; group: GroupDef } | null {
  for (const s of SCHEMA) {
    for (const g of s.groups) {
      if (g.fields.some((f) => f.id === fieldId)) return { section: s, group: g };
    }
  }
  return null;
}

export const visibleGroups = (s: SectionDef, a: Answers) =>
  s.groups.filter((g) => isGroupVisible(g, a));

export const visibleFields = (g: GroupDef, a: Answers) =>
  g.fields.filter((f) => isFieldVisible(f, a));

/** Is this field considered "filled" for progress/validation purposes? */
export function isFilled(f: FieldDef, value: unknown): boolean {
  if (f.type === "note" || f.type === "calc") return true;
  if (
    f.type === "parapets" ||
    f.type === "adhesion" ||
    f.type === "photos" ||
    f.type === "photo" ||
    f.type === "video" ||
    f.type === "file"
  ) {
    return Array.isArray(value) && value.length > 0;
  }
  if (f.type === "multiselect") return Array.isArray(value) && value.length > 0;
  if (f.type === "textlist") {
    return Array.isArray(value) && value.some((v) => typeof v === "string" && v.trim() !== "");
  }
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim() !== "";
  return true;
}

/** Required visible fields that still need a value in this group. */
export function groupProgress(g: GroupDef, a: Answers) {
  if (!isGroupVisible(g, a)) return { done: 0, total: 0, complete: true };
  const req = visibleFields(g, a).filter((f) => f.required);
  const done = req.filter((f) => isFilled(f, a[f.id])).length;
  return { done, total: req.length, complete: done === req.length };
}

export function sectionProgress(s: SectionDef, a: Answers) {
  return visibleGroups(s, a).reduce(
    (acc, g) => {
      const p = groupProgress(g, a);
      return { done: acc.done + p.done, total: acc.total + p.total };
    },
    { done: 0, total: 0 },
  );
}

/** How many of the 3 sections are fully complete — powers the section-based ticker. */
export function sectionsCompleted(a: Answers) {
  const done = SCHEMA.filter((s) => {
    const p = sectionProgress(s, a);
    return p.total > 0 && p.done === p.total;
  }).length;
  return { done, total: SCHEMA.length };
}

/** Required (or capture-required) visible fields still missing — powers submit gating. */
export interface MissingField {
  section: SectionDef;
  group: GroupDef;
  field: FieldDef;
}
export function missingRequired(a: Answers): MissingField[] {
  const out: MissingField[] = [];
  for (const s of SCHEMA) {
    for (const g of visibleGroups(s, a)) {
      for (const f of visibleFields(g, a)) {
        if ((f.required || f.captureRequired) && !isFilled(f, a[f.id])) {
          out.push({ section: s, group: g, field: f });
        }
      }
    }
  }
  return out;
}

export function overallProgress(a: Answers) {
  const t = SCHEMA.reduce(
    (acc, s) => {
      const p = sectionProgress(s, a);
      return { done: acc.done + p.done, total: acc.total + p.total };
    },
    { done: 0, total: 0 },
  );
  return { ...t, pct: t.total === 0 ? 0 : Math.round((t.done / t.total) * 100) };
}

/** Every required capture (photo/video/file) still missing — powers the checklist. */
export function missingCaptures(a: Answers) {
  const out: { section: string; group: string; field: FieldDef }[] = [];
  for (const s of SCHEMA) {
    for (const g of visibleGroups(s, a)) {
      for (const f of visibleFields(g, a)) {
        if (f.captureRequired && !isFilled(f, a[f.id])) {
          out.push({ section: s.title, group: g.title, field: f });
        }
      }
    }
  }
  return out;
}

export function completedCaptures(a: Answers) {
  let done = 0;
  let total = 0;
  for (const s of SCHEMA) {
    for (const g of visibleGroups(s, a)) {
      for (const f of visibleFields(g, a)) {
        if (f.captureRequired) {
          total++;
          if (isFilled(f, a[f.id])) done++;
        }
      }
    }
  }
  return { done, total };
}
