// The full form definition — 3 streamlined sections, every field, group, and
// conditional rule. This is the single source of truth the UI renders from.
// Auto-calculated values use `compute`; conditional fields use `showIf`.

import type { SectionDef } from "./types";
import {
  isMetal,
  isCoating,
  hasInsulation,
  humidityHigh,
  yes,
  num,
  requiredAdhesionTests,
  adhesionTests,
} from "./predicates";
import { gallons, parapetSf, gutterCheck } from "./calc";

const WEATHER = ["Sunny", "Cloudy", "Light rain", "Heavy rain", "Fog"];
// Placeholder catalogue — replace with the Bond It product list / feed.
const PRODUCTS = [
  "Bond It Silicone Roof Coating",
  "Bond It High-Solids Silicone",
  "Bond It Roof Primer / Basecoat",
  "Other",
];
const WARRANTY_TIER = ["10-year", "15-year", "20-year", "Other"];
const BUILDING = ["Warehouse", "Retail", "Office", "Industrial", "Other"];
const ROOF_SYSTEM = ["Modified Bitumen", "Metal", "Single Ply", "Built-up", "Coating", "Other"];
const DECK = ["Metal", "Wood", "Concrete", "Other"];
const SEVERITY = ["Minor", "Moderate", "Severe"];
const COATING_TYPE = ["Silicone", "Acrylic", "Asphalt Emulsion", "Aluminium", "Unknown"];
const COATING_COND = ["Excellent", "Good", "Fair", "Poor", "Failing"];
const DRAIN_COND = ["Working", "Clogged", "Damaged"];
const GUTTER_SIZE = ['5"', '6"', '7"', '8"', '10"+ box / commercial'];
const RAINFALL = [
  "Low (Pacific NW / Interior West, ~5 in/hr)",
  "National average (~8 in/hr)",
  "High (Gulf Coast / Florida / SE, ~10 in/hr)",
];
const PANEL_TYPE = ["R-Panel", "Standing Seam", "Corrugated", "Other"];
const PANEL_FINISH = ["Galvalume", "Painted", "Other"];
const RUST_SEVERITY = ["Surface", "Active", "Penetrating"];

export const SCHEMA: SectionDef[] = [
  // ========================================================================
  {
    id: "profile",
    index: 1,
    title: "Project & Roof Profile",
    blurb: "Set up the job and measure the roof in one pass.",
    groups: [
      {
        id: "warranty",
        title: "Warranty & product",
        note: "Links this inspection to the Bond It product and warranty it supports.",
        fields: [
          { id: "productName", label: "Bond It product", type: "select", options: PRODUCTS, required: true, shared: true, span: 2, help: "Sample list — to be replaced with the Bond It catalogue." },
          { id: "productSku", label: "Product SKU", type: "text", required: true, shared: true, span: 1, help: "As printed on the packaging." },
          { id: "batchNumber", label: "Batch / lot number", type: "text", required: true, shared: true, span: 1, help: "As printed on the packaging." },
          { id: "warrantyTier", label: "Warranty tier / duration", type: "select", options: WARRANTY_TIER, required: true, shared: true, span: 2 },
        ],
      },
      {
        id: "job",
        title: "Job details",
        note: "Who, where, and the conditions on the day.",
        fields: [
          { id: "inspectionDate", label: "Date of inspection", type: "date", required: true, shared: true, help: "Cannot be a future date." },
          { id: "startTime", label: "Inspection start time", type: "time", required: true, shared: true },
          { id: "temperature", label: "Temperature", type: "number", unit: "°F", min: 0, max: 140, required: true, shared: true, span: 1 },
          { id: "wind", label: "Wind speed", type: "number", unit: "mph", min: 0, max: 150, required: true, shared: true, span: 1 },
          { id: "humidity", label: "Relative humidity", type: "number", unit: "%", min: 0, max: 100, required: true, shared: true, span: 1, help: "Warns above 85% — silicone cure risk." },
          { id: "dewPoint", label: "Dew point", type: "number", unit: "°F", required: true, shared: true, span: 1 },
          {
            id: "humidityWarn", label: "", type: "note", shared: true,
            showIf: (a) => humidityHigh(a),
            body: "⚠ High humidity (>85%). Silicone may not cure properly — confirm conditions are acceptable before proceeding.",
          },
          { id: "conditions", label: "Weather conditions", type: "multiselect", options: WEATHER, required: true, shared: true, span: 2 },
          { id: "weatherNotes", label: "Weather notes", type: "textarea", shared: true, span: 2, placeholder: "Optional — anything unusual about site conditions." },
          { id: "projectName", label: "Project name", type: "text", required: true, shared: true, span: 2 },
          { id: "addrStreet", label: "Street address", type: "text", required: true, shared: true, span: 2 },
          { id: "addrCity", label: "City", type: "text", required: true, shared: true, span: 1 },
          { id: "addrState", label: "State", type: "text", required: true, shared: true, span: 1 },
          { id: "addrZip", label: "ZIP", type: "text", required: true, shared: true, span: 1 },
          { id: "buildingType", label: "Building type", type: "select", options: BUILDING, required: true, shared: true, span: 1 },
          { id: "ownerName", label: "Property owner name", type: "text", required: true, shared: true, span: 1 },
          { id: "ownerPhone", label: "Owner phone", type: "tel", required: true, shared: true, span: 1 },
          { id: "ownerEmail", label: "Owner email", type: "email", required: true, shared: true, span: 2, help: "A copy of the PDF is sent here." },
          { id: "contactName", label: "On-site contact name", type: "text", shared: true, span: 1 },
          { id: "contactPhone", label: "On-site contact phone", type: "tel", shared: true, span: 1 },
          { id: "contractorCompany", label: "Contractor company", type: "text", required: true, shared: true, span: 1 },
          { id: "evaluatorName", label: "Evaluator name", type: "text", required: true, shared: true, span: 1 },
          { id: "evaluatorEmail", label: "Evaluator email", type: "email", required: true, shared: true, span: 2, help: "PDF is sent here on submission." },
          { id: "additionalNotes", label: "Additional notes", type: "textarea", shared: true, span: 2, placeholder: "Optional — anything else about the project." },
          { id: "roofSketch", label: "Roof sketch", type: "file", required: true, captureRequired: true, shared: true, span: 2, help: "Print the graph-paper sketch, draw the roof, upload as PDF or photo." },
        ],
      },
      {
        id: "measure",
        title: "Roof measurements",
        note: "Measured, not estimated. Gallons and parapet area calculate as you type.",
        fields: [
          { id: "totalSf", label: "Total roof area", type: "number", unit: "SF", min: 1, required: true, span: 1, help: "Field area to be coated." },
          { id: "perimeter", label: "Perimeter", type: "number", unit: "LF", min: 0, required: true, span: 1 },
          {
            id: "gallonsCalc", label: "Coating required", type: "calc", span: 2,
            compute: (a) => {
              const g = gallons(a);
              if (!g) return { lines: [{ label: "Enter total roof area", value: "—" }] };
              return {
                lines: [
                  { label: "@ 1.5 gal / sq", value: g.g15.toLocaleString(), unit: "gal" },
                  { label: "@ 2.0 gal / sq", value: g.g20.toLocaleString(), unit: "gal" },
                  { label: "@ 2.5 gal / sq", value: g.g25.toLocaleString(), unit: "gal" },
                ],
              };
            },
          },
          { id: "parapets", label: "Parapet walls present?", type: "toggle", required: true, span: 2 },
          {
            id: "parapetWalls", label: "Parapet walls", type: "parapets", span: 2,
            showIf: (a) => yes(a, "parapets"),
            help: "Add each wall — coated area totals automatically (LF × height ÷ 12).",
          },
          {
            id: "parapetSfCalc", label: "Total parapet coated area", type: "calc", span: 2,
            showIf: (a) => yes(a, "parapets"),
            compute: (a) => ({
              lines: [{ label: "All walls", value: Math.round(parapetSf(a)).toLocaleString(), unit: "SF" }],
            }),
          },
          { id: "parapetPhotos", label: "Parapet photos", type: "photos", captureRequired: true, span: 2, showIf: (a) => yes(a, "parapets"), help: "One photo per wall face, end to end." },
          { id: "slope", label: "Roof slope", type: "number", unit: "/12", step: 0.5, required: true, span: 1, help: "Use a slope app on your device." },
          { id: "slopeShot", label: "Slope app screenshot", type: "photo", captureRequired: true, span: 1 },
          { id: "roofAge", label: "Roof age", type: "number", unit: "yrs", min: 0, required: true, span: 1 },
          { id: "yearInstalled", label: "Year installed", type: "number", span: 1, help: "Optional if age is known." },
          { id: "existingRoofSystem", label: "Existing roof system", type: "select", options: ROOF_SYSTEM, required: true, span: 2, help: "Metal or Coating opens the matching checks in Section 2." },
          { id: "insulation", label: "Insulation present?", type: "toggle", required: true, span: 1, help: "Opens the moisture survey in Section 2." },
          { id: "roofDeck", label: "Roof deck type", type: "select", options: DECK, required: true, span: 1 },
          { id: "deckPhoto", label: "Deck photo", type: "photo", captureRequired: true, span: 2, help: "At a drain, scupper, or core-cut location." },
        ],
      },
    ],
  },

  // ========================================================================
  {
    id: "condition",
    index: 2,
    title: "Roof Condition",
    blurb: "The core check of whether the roof is sound enough to coat, and the prep it needs.",
    groups: [
      {
        id: "problems",
        title: "Condition problems",
        note: "Leaks, ponding, damage, cracks, and repairs.",
        fields: [
          { id: "activeLeaks", label: "Active leaks reported?", type: "toggle", required: true, span: 2 },
          { id: "leakLocations", label: "Number of leak locations", type: "number", min: 0, span: 1, showIf: (a) => yes(a, "activeLeaks") },
          { id: "leakSeverity", label: "Leak severity", type: "select", options: SEVERITY, span: 1, showIf: (a) => yes(a, "activeLeaks") },
          { id: "leakLocated", label: "Leak sources located on roof?", type: "toggle", span: 1, showIf: (a) => yes(a, "activeLeaks") },
          { id: "leakRepaired", label: "Leak sources repaired?", type: "toggle", span: 1, showIf: (a) => yes(a, "activeLeaks") },
          { id: "leakDesc", label: "Leak description", type: "textarea", span: 2, showIf: (a) => yes(a, "activeLeaks"), placeholder: "Optional — brief description of the leaks." },
          { id: "leakPhotos", label: "Leak photos (roof)", type: "photos", captureRequired: true, span: 2, showIf: (a) => yes(a, "activeLeaks"), help: "One per location; mark with chalk + roof-map letter." },
          { id: "leakPhotosInterior", label: "Leak photos (interior)", type: "photos", span: 2, showIf: (a) => yes(a, "activeLeaks"), help: "Optional — ceiling stains / drip locations if accessible." },

          { id: "ponding", label: "Ponding observed?", type: "toggle", required: true, span: 2 },
          { id: "pondingAreas", label: "Number of ponding areas", type: "number", min: 0, span: 1, showIf: (a) => yes(a, "ponding") },
          { id: "pondingSf", label: "Total ponding area", type: "number", unit: "SF", span: 1, showIf: (a) => yes(a, "ponding") },
          { id: "pondingDepth", label: "Deepest depth", type: "number", unit: "in", step: 0.25, span: 1, showIf: (a) => yes(a, "ponding") },
          { id: "pondingDesc", label: "Ponding description", type: "textarea", span: 2, showIf: (a) => yes(a, "ponding"), placeholder: "Optional — brief description of the ponding." },
          { id: "pondingPhotos", label: "Ponding photos", type: "photos", captureRequired: true, span: 2, showIf: (a) => yes(a, "ponding"), help: "One per area — or the staining ring if dry." },
          { id: "pondingVideo", label: "Ponding video", type: "video", captureRequired: true, span: 2, showIf: (a) => yes(a, "ponding"), help: "15-sec pan across the area." },

          { id: "substrateDamage", label: "Substrate damage present?", type: "toggle", required: true, span: 2 },
          { id: "substrateDamageSf", label: "Damaged area", type: "number", unit: "SF", span: 1, showIf: (a) => yes(a, "substrateDamage") },
          { id: "repairableNoTearoff", label: "Repairable without tear-off?", type: "toggle", span: 1, showIf: (a) => yes(a, "substrateDamage") },
          { id: "substrateDesc", label: "Substrate damage description", type: "textarea", span: 2, showIf: (a) => yes(a, "substrateDamage"), placeholder: "Optional — brief description of the damage." },
          { id: "substratePhotos", label: "Substrate damage photos", type: "photos", captureRequired: true, span: 2, showIf: (a) => yes(a, "substrateDamage"), help: "Close-up + wide establishing shot." },

          { id: "cracks", label: "Structural cracks observed?", type: "toggle", required: true, span: 2 },
          { id: "crackCount", label: "Number of cracks", type: "number", min: 0, span: 1, showIf: (a) => yes(a, "cracks") },
          { id: "longestCrack", label: "Longest crack", type: "number", unit: "ft", step: 0.5, span: 1, showIf: (a) => yes(a, "cracks") },
          { id: "widestCrack", label: "Widest crack", type: "number", unit: "in", step: 0.05, span: 1, showIf: (a) => yes(a, "cracks"), help: "Deductions apply above 2mm (~0.08 in)." },
          { id: "crackDesc", label: "Crack description", type: "textarea", span: 2, showIf: (a) => yes(a, "cracks"), placeholder: "Optional — brief description of the cracks." },
          { id: "crackPhotos", label: "Crack photos", type: "photos", captureRequired: true, span: 2, showIf: (a) => yes(a, "cracks"), help: "Ruler or coin in frame for scale." },

          { id: "repairsNeeded", label: "Repairs needed before coating?", type: "toggle", required: true, span: 2 },
          { id: "damagedSf", label: "Total repair area", type: "number", unit: "SF", span: 1, showIf: (a) => yes(a, "repairsNeeded"), help: ">10% of roof area affects the score." },
          { id: "coatOverRepairs", label: "Can contractor coat over repairs?", type: "toggle", span: 1, showIf: (a) => yes(a, "repairsNeeded") },
          { id: "repairDesc", label: "Repair description", type: "textarea", span: 2, showIf: (a) => yes(a, "repairsNeeded"), placeholder: "Describe each repair." },
          { id: "repairPhotos", label: "Repair area photos", type: "photos", captureRequired: true, span: 2, showIf: (a) => yes(a, "repairsNeeded"), help: "One per repair area." },
        ],
      },
      {
        id: "coating",
        title: "Existing coating",
        note: "Shown because the existing roof system is a coating.",
        showIf: (a) => isCoating(a),
        fields: [
          { id: "prevCoating", label: "Previous coating present?", type: "toggle", required: true, span: 2 },
          { id: "coatingType", label: "Coating type", type: "select", options: COATING_TYPE, span: 1, showIf: (a) => yes(a, "prevCoating") },
          { id: "coatingAge", label: "Coating age", type: "number", unit: "yrs", span: 1, showIf: (a) => yes(a, "prevCoating") },
          { id: "coatingCondition", label: "Coating condition", type: "select", options: COATING_COND, span: 1, showIf: (a) => yes(a, "prevCoating") },
          { id: "coatingPeelingPct", label: "% peeling / delaminating", type: "number", unit: "%", min: 0, max: 100, span: 1, showIf: (a) => yes(a, "prevCoating"), help: ">20% affects the score." },
          { id: "coatingPhotos", label: "Coating condition photos", type: "photos", captureRequired: true, span: 2, showIf: (a) => yes(a, "prevCoating") },
        ],
      },
      {
        id: "equipment",
        title: "Equipment & penetrations",
        note: "Every penetration becomes a detail-work line item.",
        fields: [
          { id: "hvacCount", label: "HVAC units", type: "number", min: 0, span: 1 },
          { id: "ventCount", label: "Plumbing vents / pipes", type: "number", min: 0, span: 1 },
          { id: "antennaCount", label: "Antennas / dishes", type: "number", min: 0, span: 1 },
          { id: "greaseCount", label: "Grease traps / hoods", type: "number", min: 0, span: 1, help: "Grease checks appear if above zero." },
          { id: "hatchCount", label: "Roof hatches", type: "number", min: 0, span: 1 },
          { id: "skylightCount", label: "Skylights", type: "number", min: 0, span: 1 },
          { id: "equipmentGood", label: "All equipment in good condition?", type: "toggle", required: true, span: 2 },
          { id: "equipmentRepairNote", label: "Equipment needing repair / third party?", type: "textarea", span: 2, placeholder: "Optional — list any equipment needing repair or a third party." },
          { id: "reflashNeeded", label: "Equipment needing re-flashing?", type: "toggle", span: 1 },
          { id: "greasePresent", label: "Grease present around traps / hoods?", type: "toggle", span: 1, showIf: (a) => num(a, "greaseCount") > 0 },
          { id: "degreaser", label: "Degreaser required?", type: "toggle", span: 1, showIf: (a) => yes(a, "greasePresent") },
          { id: "skylightDimensions", label: "Skylight dimensions", type: "text", span: 1, showIf: (a) => num(a, "skylightCount") > 0, placeholder: "e.g. 24×36 in" },
          { id: "skylightCondition", label: "Skylight condition", type: "select", options: ["Good", "Repair needed", "Replace", "Other"], span: 1, showIf: (a) => num(a, "skylightCount") > 0 },
          { id: "pitchPans", label: "Pitch pans present?", type: "toggle", span: 1 },
          { id: "pitchPanCondition", label: "Pitch pan condition", type: "select", options: ["Good", "Repair", "Replace", "Other"], span: 1, showIf: (a) => yes(a, "pitchPans") },
          { id: "solarPanels", label: "Solar panels present?", type: "toggle", span: 1 },
          { id: "otherEquipment", label: "Other equipment", type: "textarea", span: 2, placeholder: "Optional — describe + count anything not listed above." },
          { id: "dripLines", label: "Condensate drip lines present?", type: "toggle", span: 2 },
          { id: "dripLineLf", label: "Drip line length", type: "number", unit: "LF", span: 1, showIf: (a) => yes(a, "dripLines") },
          { id: "dripLineDamaged", label: "Damaged / missing drip line sections?", type: "toggle", span: 1, showIf: (a) => yes(a, "dripLines") },
          { id: "mechContractor", label: "Mechanical contractor needed?", type: "toggle", span: 1, showIf: (a) => yes(a, "dripLines") },
          { id: "dripLinePhotos", label: "Drip line photos", type: "photos", captureRequired: true, span: 2, showIf: (a) => yes(a, "dripLines"), help: "Wide shot + close-ups of any damage." },
          { id: "flashingsPresent", label: "Flashings present?", type: "toggle", span: 2 },
          { id: "flashingsDamaged", label: "Flashings damaged or missing?", type: "toggle", span: 1, showIf: (a) => yes(a, "flashingsPresent") },
          { id: "flashingDamagedCount", label: "Number damaged / missing", type: "number", min: 0, span: 1, showIf: (a) => yes(a, "flashingsDamaged") },
          { id: "flashingNotes", label: "Flashing notes", type: "textarea", span: 2, showIf: (a) => yes(a, "flashingsPresent"), placeholder: "Optional." },
          { id: "flashingPhotos", label: "Flashing photos", type: "photos", captureRequired: true, span: 2, showIf: (a) => yes(a, "flashingsPresent"), help: "Close-up of each damaged flashing." },
          { id: "equipmentPhotos", label: "Equipment photos", type: "photos", captureRequired: true, span: 2, help: "One photo per item counted above." },
        ],
      },
      {
        id: "drainage",
        title: "Drainage",
        note: "Drains, gutters with an automatic size check, and scuppers.",
        fields: [
          { id: "drains", label: "Interior drains present?", type: "toggle", required: true, span: 2 },
          { id: "drainCount", label: "Number of drains", type: "number", min: 0, span: 1, showIf: (a) => yes(a, "drains") },
          { id: "drainCondition", label: "Overall drain condition", type: "select", options: DRAIN_COND, span: 1, showIf: (a) => yes(a, "drains") },
          { id: "drainPhotos", label: "Drain photos", type: "photos", captureRequired: true, span: 2, showIf: (a) => yes(a, "drains"), help: "Strainer + bowl visible." },
          { id: "drainVideo", label: "Drain flow video", type: "video", span: 2, showIf: (a) => yes(a, "drains"), help: "Optional — 15-sec clip of water poured into one drain, confirming flow." },

          { id: "gutters", label: "Gutters present?", type: "toggle", required: true, span: 2 },
          { id: "gutterLf", label: "Total gutter length", type: "number", unit: "LF", span: 1, showIf: (a) => yes(a, "gutters") },
          { id: "gutterSize", label: "Gutter size", type: "select", options: GUTTER_SIZE, span: 1, showIf: (a) => yes(a, "gutters") },
          { id: "gutterDamaged", label: "Damaged gutter sections?", type: "toggle", span: 1, showIf: (a) => yes(a, "gutters") },
          { id: "gutterDamagedLf", label: "Damaged gutter length", type: "number", unit: "LF", span: 1, showIf: (a) => yes(a, "gutterDamaged") },
          { id: "roofSfToGutter", label: "Roof area draining to gutter", type: "number", unit: "SF", span: 1, showIf: (a) => yes(a, "gutters") },
          { id: "rainfallRegion", label: "Rainfall region", type: "select", options: RAINFALL, span: 1, showIf: (a) => yes(a, "gutters"), help: "Adjusts the SMACNA capacity." },
          {
            id: "gutterCheckCalc", label: "Gutter adequacy (SMACNA)", type: "calc", span: 2,
            showIf: (a) => yes(a, "gutters"),
            compute: (a) => {
              const g = gutterCheck(a);
              if (g.adequate === null) return { lines: [{ label: "Enter gutter size and drained area", value: "—" }] };
              return {
                lines: [
                  { label: "Draining", value: (g.draining ?? 0).toLocaleString(), unit: "SF" },
                  { label: "Capacity", value: (g.capacity ?? 0).toLocaleString(), unit: "SF" },
                ],
                status: { tone: g.adequate ? "ok" : "warn", text: g.adequate ? "Adequate" : "Undersized" },
              };
            },
          },
          { id: "gutterPhotos", label: "Gutter photos", type: "photos", captureRequired: true, span: 2, showIf: (a) => yes(a, "gutters") },

          { id: "scuppers", label: "Scuppers / through-wall openings?", type: "toggle", required: true, span: 2 },
          { id: "scupperCount", label: "Number of scuppers", type: "number", min: 0, span: 1, showIf: (a) => yes(a, "scuppers") },
          { id: "scupperDamaged", label: "Any scuppers damaged?", type: "toggle", span: 1, showIf: (a) => yes(a, "scuppers") },
          { id: "scupperCoatable", label: "Scuppers coatable?", type: "toggle", span: 1, showIf: (a) => yes(a, "scuppers") },
          { id: "scupperPhotos", label: "Scupper photos", type: "photos", captureRequired: true, span: 2, showIf: (a) => yes(a, "scuppers"), help: "One per scupper." },
        ],
      },
      {
        id: "cleanliness",
        title: "Cleanliness & surface prep",
        fields: [
          { id: "vegetation", label: "Vegetation / sediment / grime present?", type: "toggle", required: true, span: 2 },
          { id: "vegetationSf", label: "Area with vegetation", type: "number", unit: "SF", span: 1, showIf: (a) => yes(a, "vegetation") },
          { id: "heavyDirt", label: "Heavy dirt / algae / mildew?", type: "toggle", span: 1, showIf: (a) => yes(a, "vegetation"), help: "Requiring biocide affects the score." },
          { id: "cleanDesc", label: "Description", type: "textarea", span: 2, showIf: (a) => yes(a, "vegetation"), placeholder: "Optional — describe the contamination." },
          { id: "cleanPhotos", label: "Affected-area photos", type: "photos", captureRequired: true, span: 2, showIf: (a) => yes(a, "vegetation") },
        ],
      },
      {
        id: "metal",
        title: "Metal roof",
        note: "Shown because the existing roof system is metal.",
        showIf: (a) => isMetal(a),
        fields: [
          { id: "panelType", label: "Metal panel type", type: "select", options: PANEL_TYPE, required: true, span: 1 },
          { id: "panelGauge", label: "Panel gauge", type: "text", span: 1, placeholder: "If known" },
          { id: "panelFinish", label: "Panel finish", type: "select", options: PANEL_FINISH, span: 1 },
          { id: "panelPhoto", label: "Panel profile photo", type: "photo", captureRequired: true, span: 1, help: "Close-up of one panel." },
          { id: "closureStrips", label: "Closure strips present?", type: "toggle", span: 1 },
          { id: "closureIntact", label: "Closure strips intact?", type: "toggle", span: 1, showIf: (a) => yes(a, "closureStrips") },
          { id: "closureNeedReplace", label: "Closure strips need replacing?", type: "toggle", span: 1, showIf: (a) => yes(a, "closureStrips") },
          { id: "closureLf", label: "Closure strips to replace", type: "number", unit: "LF", span: 1, showIf: (a) => yes(a, "closureNeedReplace") },
          { id: "seamsTight", label: "Seams tight?", type: "toggle", required: true, span: 1 },
          { id: "seamsRefasten", label: "Seams re-fastenable?", type: "toggle", span: 1, showIf: (a) => a.seamsTight === "No" },
          { id: "looseSeamLf", label: "Open / loose seams", type: "number", unit: "LF", span: 1, showIf: (a) => a.seamsTight === "No", help: ">50 LF affects the score." },
          { id: "seamPhotos", label: "Seam photos", type: "photos", captureRequired: true, span: 1, showIf: (a) => a.seamsTight === "No", help: "One good + one failing sample." },
          { id: "fastenersOk", label: "All fasteners properly attached?", type: "toggle", span: 2 },
          { id: "looseFasteners", label: "Loose fasteners", type: "number", min: 0, span: 1, showIf: (a) => a.fastenersOk === "No" },
          { id: "missingFasteners", label: "Missing fasteners", type: "number", min: 0, span: 1, showIf: (a) => a.fastenersOk === "No" },
          { id: "oversizeFasteners", label: "Needing oversized replacement", type: "number", min: 0, span: 1, showIf: (a) => a.fastenersOk === "No" },
          { id: "fastenerPhotos", label: "Fastener photos", type: "photos", captureRequired: true, span: 1, showIf: (a) => a.fastenersOk === "No", help: "Wide pattern + close-up of each failing fastener." },
          { id: "rust", label: "Rust present?", type: "toggle", required: true, span: 2 },
          { id: "rustSeverity", label: "Rust severity", type: "select", options: RUST_SEVERITY, span: 1, showIf: (a) => yes(a, "rust"), help: "Penetrating rust affects the score." },
          { id: "rustSf", label: "Rust area", type: "number", unit: "SF", span: 1, showIf: (a) => yes(a, "rust"), help: ">10% of roof affects the score." },
          { id: "rustDesc", label: "Rust description", type: "textarea", span: 2, showIf: (a) => yes(a, "rust"), placeholder: "Optional." },
          { id: "rustPhotos", label: "Rust photos", type: "photos", captureRequired: true, span: 2, showIf: (a) => yes(a, "rust"), help: "Wide shot + close-up of worst area." },
          { id: "panelReplacement", label: "Panel replacement required?", type: "toggle", span: 2 },
          { id: "panelsToReplace", label: "Number of panels", type: "number", min: 0, span: 1, showIf: (a) => yes(a, "panelReplacement") },
          { id: "panelDimensions", label: "Panel dimensions", type: "text", span: 1, showIf: (a) => yes(a, "panelReplacement"), placeholder: "e.g. 3ft × 20ft" },
          { id: "panelReplacePhotos", label: "Panel replacement photos", type: "photos", captureRequired: true, span: 2, showIf: (a) => yes(a, "panelReplacement"), help: "One per panel marked." },
          { id: "metalPhotos", label: "Metal overview photos", type: "photos", captureRequired: true, span: 2, help: "General condition — panels, closures." },
        ],
      },
      {
        id: "moisture",
        title: "Moisture survey",
        note: "Shown because insulation is present. Per ASTM D7954 / C1153.",
        showIf: (a) => hasInsulation(a),
        fields: [
          { id: "moisturePerformed", label: "Moisture survey performed?", type: "toggle", required: true, span: 2 },
          { id: "surveyorName", label: "Surveyor name", type: "text", span: 1, showIf: (a) => yes(a, "moisturePerformed") },
          { id: "surveyDate", label: "Survey date", type: "date", span: 1, showIf: (a) => yes(a, "moisturePerformed") },
          { id: "wetInsulation", label: "Wet insulation found?", type: "toggle", span: 2, showIf: (a) => yes(a, "moisturePerformed") },
          { id: "wetAreaSf", label: "Total wet area", type: "number", unit: "SF", span: 1, showIf: (a) => yes(a, "wetInsulation") },
          { id: "wetAreaPct", label: "Wet area as % of roof", type: "number", unit: "%", min: 0, max: 100, span: 1, showIf: (a) => yes(a, "wetInsulation"), help: ">10% and >25% carry deductions." },
          { id: "coreSamples", label: "Core samples taken", type: "number", min: 0, span: 1, showIf: (a) => yes(a, "moisturePerformed") },
          { id: "coreLocationsMarked", label: "Core locations marked on roof map?", type: "toggle", span: 1, showIf: (a) => yes(a, "moisturePerformed") },
          { id: "moistureReport", label: "Moisture survey report", type: "file", captureRequired: true, span: 2, showIf: (a) => yes(a, "moisturePerformed") },
        ],
      },
    ],
  },

  // ========================================================================
  {
    id: "signoff",
    index: 3,
    title: "Testing, Scorecard & Sign-off",
    blurb: "Adhesion testing, the automatic score, and signatures.",
    groups: [
      {
        id: "adhesion",
        title: "Adhesion testing",
        note: "ASTM D4541. Minimum 3 tests, +1 per 10,000 SF beyond the first.",
        fields: [
          {
            id: "adhesionKey", label: "", type: "note", span: 2,
            body: "Failure-mode key —\nA = Adhesive: coating peels from surface (poor bond, FAIL)\nC = Cohesive: material tears apart (strong bond, PASS)\nS = Substrate: substrate itself fails (strong bond, PASS)",
          },
          { id: "adhesionPerformed", label: "Adhesion testing performed?", type: "toggle", required: true, span: 2, help: "Skipping when required is an automatic −10." },
          {
            id: "adhesionGuide", label: "Minimum tests for this roof", type: "calc", span: 2,
            showIf: (a) => a.adhesionPerformed === "Yes",
            compute: (a) => {
              const req = requiredAdhesionTests(a);
              const done = adhesionTests(a).length;
              return {
                lines: [
                  { label: "minimum required", value: String(req), unit: "tests" },
                  { label: "entered", value: String(done), unit: "tests" },
                ],
                status: done >= req ? { tone: "ok", text: "Met" } : { tone: "warn", text: `${req - done} more` },
              };
            },
          },
          {
            id: "adhesionTests", label: "Test results", type: "adhesion", span: 2,
            showIf: (a) => a.adhesionPerformed === "Yes",
            help: "Each test: location, substrate, PSI, failure mode, and 3 photos — pass/fail is derived for you.",
          },
        ],
      },
      {
        id: "checklist",
        title: "Photo & document check",
        note: "A running check of every required upload before scoring.",
        fields: [],
      },
      {
        id: "scorecard",
        title: "Scorecard & recommendation",
        note: "Calculated automatically from Sections 1 and 2. Read-only.",
        fields: [],
      },
      {
        id: "signatures",
        title: "Sign-off",
        note: "Signed once for the whole inspection. Captured on screen and embedded in the PDF with a timestamp.",
        fields: [
          { id: "finalComments", label: "Final comments", type: "textarea", shared: true, span: 2, placeholder: "Evaluator notes on overall findings." },
          { id: "sigEvaluatorName", label: "Evaluator name", type: "text", required: true, shared: true, span: 1 },
          { id: "sigEvaluator", label: "Evaluator signature", type: "signature", required: true, shared: true, span: 1 },
          { id: "sigContractorName", label: "Contractor name", type: "text", required: true, shared: true, span: 1 },
          { id: "sigContractor", label: "Contractor signature", type: "signature", required: true, shared: true, span: 1 },
          { id: "sigOwnerName", label: "Property owner name", type: "text", required: true, shared: true, span: 1 },
          { id: "sigOwner", label: "Owner signature", type: "signature", required: true, shared: true, span: 1 },
        ],
      },
    ],
  },
];

// Flat helpers -------------------------------------------------------------
export const SECTION_IDS = SCHEMA.map((s) => s.id);
export function getSection(id: string) {
  return SCHEMA.find((s) => s.id === id);
}
