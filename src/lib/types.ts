// Shared form-engine types the whole UI renders from.

export type Answers = Record<string, unknown>;

export type FieldType =
  | "text"
  | "textarea"
  | "email"
  | "tel"
  | "date"
  | "time"
  | "number"
  | "select"
  | "multiselect"
  | "textlist" // repeatable free-text entries (e.g. batch numbers)
  | "matchtext" // free text matched against hidden preset options
  | "toggle" // Yes / No
  | "photo" // single image
  | "photos" // multiple images
  | "video"
  | "file"
  | "signature"
  | "calc" // read-only, auto-computed "instrument readout"
  | "note" // static guidance / reference panel
  | "parapets" // repeating per-wall composite
  | "adhesion"; // repeating adhesion-test composite

export interface CalcOutput {
  /** Lines shown in the readout, e.g. [{ label: "@ 1.5 gal/sq", value: "600", unit: "gal" }] */
  lines: { label: string; value: string; unit?: string }[];
  /** Optional status pill: adequate / warning */
  status?: { tone: "ok" | "warn" | "info"; text: string };
}

export interface FieldDef {
  id: string;
  label: string;
  type: FieldType;
  /** Project-level fields (weather, property) stored once, not per roof. */
  shared?: boolean;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  help?: string;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  /** Layout hint on wider screens: how many columns to span (of 2). */
  span?: 1 | 2;
  /** Conditional visibility. Receives the resolved answers for the active roof. */
  showIf?: (a: Answers) => boolean;
  /** For type "calc": derive the readout from current answers. */
  compute?: (a: Answers) => CalcOutput;
  /** For type "note": the body text (supports \n). */
  body?: string;
  /** Marks a photo/video/file field whose absence blocks the checklist. */
  captureRequired?: boolean;
  /** For type "signature": field id whose value is the signee's name. */
  sourceId?: string;
}

export interface GroupDef {
  id: string;
  title: string;
  /** One-line orientation shown under the group title. */
  note?: string;
  showIf?: (a: Answers) => boolean;
  fields: FieldDef[];
}

export interface SectionDef {
  id: string;
  index: number; // 1-based
  title: string;
  blurb: string;
  groups: GroupDef[];
}

export interface Roof {
  id: string;
  name: string; // "Roof A"
  answers: Answers;
}

export type ReadinessBand = "ready" | "prep" | "notready";

export interface CategoryScore {
  key: "A" | "B" | "C" | "D";
  label: string;
  score: number;
  max: number;
  deductions: string[]; // human-readable reasons, for transparency
}

export interface Scorecard {
  categories: CategoryScore[];
  total: number;
  max: number;
  band: ReadinessBand;
  bandLabel: string;
  recommendation: string;
}
