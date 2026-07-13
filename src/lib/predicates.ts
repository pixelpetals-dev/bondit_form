// Shared conditional-logic predicates. Referenced by schema `showIf` and by
// the calc engine. Keeping them here means the rules live in one place.

import type { Answers } from "./types";

export const num = (a: Answers, id: string): number => {
  const v = a[id];
  if (v === "" || v === null || v === undefined) return NaN;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};

export const yes = (a: Answers, id: string): boolean => a[id] === "Yes";
export const no = (a: Answers, id: string): boolean => a[id] === "No";

export const isMetal = (a: Answers): boolean => a.existingRoofSystem === "Metal";
export const isCoating = (a: Answers): boolean =>
  a.existingRoofSystem === "Coating";
export const hasInsulation = (a: Answers): boolean => yes(a, "insulation");

/** One captured photo (name + kind); mirrors uploads.Attachment. */
export interface RowPhoto {
  name: string;
  kind: "image" | "video" | "file";
}

/** Adhesion tests captured on the active roof. */
export interface AdhesionTest {
  location?: string;
  substrate?: string;
  psi?: string | number;
  failureMode?: string; // "A — Adhesive (FAIL)" | "C — Cohesive (PASS)" | "S — Substrate (PASS)"
  photoBefore?: RowPhoto;
  photoAfter?: RowPhoto;
  photoPsi?: RowPhoto;
}
export const adhesionTests = (a: Answers): AdhesionTest[] =>
  Array.isArray(a.adhesionTests) ? (a.adhesionTests as AdhesionTest[]) : [];

export const testPassed = (t: AdhesionTest): boolean =>
  typeof t.failureMode === "string" && !t.failureMode.startsWith("A");

/** Parapet walls captured on the active roof. */
export interface ParapetWall {
  height?: string | number; // inches
  lf?: string | number; // linear feet
}
export const parapetWalls = (a: Answers): ParapetWall[] =>
  Array.isArray(a.parapetWalls) ? (a.parapetWalls as ParapetWall[]) : [];

/**
 * Minimum required adhesion tests:
 *   3 (base) + 1 per 10k SF beyond the first 10k + 1 per distinct substrate
 *   change (each additional substrate type entered across the tests).
 */
export const requiredAdhesionTests = (a: Answers): number => {
  const sf = num(a, "totalSf");
  const areaExtra = Number.isFinite(sf) ? Math.max(0, Math.ceil(sf / 10000) - 1) : 0;
  const substrates = new Set(
    adhesionTests(a)
      .map((t) => (t.substrate || "").trim().toLowerCase())
      .filter(Boolean),
  );
  const substrateExtra = Math.max(0, substrates.size - 1);
  return 3 + areaExtra + substrateExtra;
};
