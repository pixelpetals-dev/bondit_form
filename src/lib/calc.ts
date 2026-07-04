// The calculation engine — gallons, parapet area, SMACNA gutter check, and the
// weighted /50 scorecard. Pure functions over an answers object; identical for
// all three concepts.

import type { Answers, Scorecard, ReadinessBand } from "./types";
import {
  num,
  yes,
  isMetal,
  adhesionTests,
  testPassed,
  parapetWalls,
  requiredAdhesionTests,
} from "./predicates";

// ---- Gallons required ------------------------------------------------------
export function gallons(a: Answers) {
  const sf = num(a, "totalSf");
  if (!Number.isFinite(sf) || sf <= 0) return null;
  return {
    g15: Math.round(sf * 0.15),
    g20: Math.round(sf * 0.2),
    g25: Math.round(sf * 0.25),
  };
}

// ---- Parapet coated area: Σ (LF × height_in ÷ 12) --------------------------
export function parapetSf(a: Answers): number {
  return parapetWalls(a).reduce((sum, w) => {
    const h = Number(w.height);
    const lf = Number(w.lf);
    if (!Number.isFinite(h) || !Number.isFinite(lf)) return sum;
    return sum + (lf * h) / 12;
  }, 0);
}

// ---- SMACNA gutter adequacy (K-style, downspouts @ 40ft) -------------------
const GUTTER_BASE: Record<string, number> = {
  '5"': 2500,
  '6"': 3840,
  '7"': 5500,
  '8"': 7960,
  '10"+ box / commercial': 12000,
};
const RAINFALL_FACTOR: Record<string, number> = {
  "Low (Pacific NW / Interior West, ~5 in/hr)": 1.6,
  "National average (~8 in/hr)": 1.0,
  "High (Gulf Coast / Florida / SE, ~10 in/hr)": 0.8,
};

export function gutterCheck(a: Answers): {
  adequate: boolean | null;
  capacity: number | null;
  draining: number | null;
  note: string;
} {
  if (!yes(a, "gutters")) return { adequate: null, capacity: null, draining: null, note: "" };
  const size = a.gutterSize as string;
  const region = (a.rainfallRegion as string) || "National average (~8 in/hr)";
  const base = GUTTER_BASE[size];
  const draining = num(a, "roofSfToGutter");
  if (base === undefined || !Number.isFinite(draining)) {
    return { adequate: null, capacity: null, draining: null, note: "Enter gutter size and drained area." };
  }
  const capacity = Math.round(base * (RAINFALL_FACTOR[region] ?? 1));
  const adequate = draining <= capacity;
  return {
    adequate,
    capacity,
    draining,
    note: adequate
      ? `Within capacity for ${size} at this rainfall.`
      : `Undersized — ${size} handles ~${capacity.toLocaleString()} SF here; move to the next size up.`,
  };
}

// ---- Scorecard -------------------------------------------------------------
function band(total: number): { band: ReadinessBand; label: string; rec: string } {
  if (total >= 40) return { band: "ready", label: "READY", rec: "Coating candidate — minor prep only." };
  if (total >= 25) return { band: "prep", label: "PREP NEEDED", rec: "Coating candidate after prep scope is completed and verified." };
  return { band: "notready", label: "NOT READY", rec: "Not a coating candidate yet — major repairs or replacement required." };
}

export function scorecard(a: Answers): Scorecard {
  // A — Adhesion /10
  const aDed: string[] = [];
  let A = 10;
  const tests = adhesionTests(a);
  const required = requiredAdhesionTests(a);
  const performedEnough = tests.length >= required && tests.every((t) => t.failureMode);
  if (a.adhesionPerformed === "No" || (tests.length > 0 && !performedEnough && a.adhesionPerformed === "No")) {
    A = 0;
    aDed.push("Testing not performed when required (−10, automatic fail)");
  } else {
    const failed = tests.filter((t) => t.failureMode && !testPassed(t)).length;
    if (failed > 0) {
      A -= failed * 3;
      aDed.push(`${failed} failed test${failed > 1 ? "s" : ""} (−${failed * 3})`);
    }
  }
  A = Math.max(0, A);

  // B — Condition /20
  const bDed: string[] = [];
  let B = 20;
  if (yes(a, "activeLeaks")) {
    const locs = Math.min(4, Math.max(0, num(a, "leakLocations") || 0));
    if (locs > 0) { B -= locs * 2; bDed.push(`${locs} leak location${locs > 1 ? "s" : ""} (−${locs * 2}, cap −8)`); }
  }
  if (yes(a, "ponding")) {
    const pond = Math.min(3, Math.max(0, num(a, "pondingAreas") || 0));
    if (pond > 0 && num(a, "pondingSf") > 100) { B -= pond * 2; bDed.push(`Ponding areas >100 SF (−${pond * 2}, cap −6)`); }
  }
  if (yes(a, "cracks") && num(a, "widestCrack") > 0.08) {
    const c = Math.min(2, Math.max(0, num(a, "crackCount") || 0));
    if (c > 0) { B -= c * 2; bDed.push(`${c} structural crack${c > 1 ? "s" : ""} >2mm (−${c * 2}, cap −4)`); }
  }
  const wetPct = num(a, "wetAreaPct");
  if (Number.isFinite(wetPct)) {
    if (wetPct > 25) { B -= 10; bDed.push("Wet insulation >25% of roof (−10)"); }
    else if (wetPct > 10) { B -= 4; bDed.push("Wet insulation >10% of roof (−4)"); }
  }
  if (num(a, "substrateDamageSf") > 50) { B -= 3; bDed.push("Substrate damage >50 SF (−3)"); }
  if (num(a, "coatingPeelingPct") > 20) { B -= 4; bDed.push("Existing coating peeling >20% (−4)"); }
  B = Math.max(0, B);

  // C — Preparation /10
  const cDed: string[] = [];
  let C = 10;
  if (yes(a, "heavyDirt")) { C -= 2; cDed.push("Biological growth requiring biocide (−2)"); }
  if (a.drainCondition === "Clogged" || a.drainCondition === "Damaged") { C -= 2; cDed.push("Drains clogged or damaged (−2)"); }
  const sf = num(a, "totalSf");
  if (yes(a, "repairsNeeded") && Number.isFinite(sf) && num(a, "damagedSf") > sf * 0.1) { C -= 3; cDed.push("Repair scope >10% of roof (−3)"); }
  if (yes(a, "greasePresent")) { C -= 3; cDed.push("Grease-trap area requiring extra prep (−3)"); }
  C = Math.max(0, C);

  // D — Metal /10
  const dDed: string[] = [];
  let D = 10;
  if (isMetal(a)) {
    const rustPct = num(a, "rustSf");
    if (Number.isFinite(sf) && Number.isFinite(rustPct) && rustPct > sf * 0.1) { D -= 3; dDed.push("Rust covering >10% (−3)"); }
    if (a.rustSeverity === "Penetrating") { D -= 3; dDed.push("Penetrating rust present (−3)"); }
    if (yes(a, "panelReplacement")) { D -= 2; dDed.push("Panel replacement required (−2)"); }
    if (num(a, "looseSeamLf") > 50) { D -= 2; dDed.push("Loose seams >50 LF (−2)"); }
    D = Math.max(0, D);
  } else {
    dDed.push("Not a metal roof — full 10/10");
  }

  const total = A + B + C + D;
  const b = band(total);
  return {
    categories: [
      { key: "A", label: "Adhesion", score: A, max: 10, deductions: aDed },
      { key: "B", label: "Condition", score: B, max: 20, deductions: bDed },
      { key: "C", label: "Preparation", score: C, max: 10, deductions: cDed },
      { key: "D", label: "Metal", score: D, max: 10, deductions: dDed },
    ],
    total,
    max: 50,
    band: b.band,
    bandLabel: b.label,
    recommendation: b.rec,
  };
}
