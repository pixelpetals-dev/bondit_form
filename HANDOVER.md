# Bond It — Pre-Coating Inspection · Handover

_Last updated: 2026-07-04_

- **Repo:** https://github.com/pixelpetals-dev/bondit_form (branch `main`)
- **Live demo:** https://bonditdemo.everythingpla.net (Dokploy on VPS `72.61.233.43`)
- **Status:** interactive prototype — 3 UX concepts, complete field coverage, deployed.

## What this is

A mobile/tablet-first web form that approved roofing contractors complete on a
roof, **before** any silicone coating job carried under a Bond It warranty. The
completed form is both the warranty record and a brand piece. It replaces a
12-section Word document (`Form_1_Pre-Coating_Inspection`), regrouped — per the
client brief — into **3 sections**.

**Current phase:** an interactive, clickable **design prototype** presenting
**three UX concepts** over one shared form engine, for Bond It to pick a
direction before the production build. This is the "prototype to approve before
build" deliverable from the brief.

## Tech stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript**
- **Tailwind CSS v4** (CSS `@theme` tokens in `src/app/globals.css`)
- Fonts via `next/font`: **Space Grotesk** (display), **IBM Plex Sans** (body),
  **IBM Plex Mono** (calculated "instrument" readouts)
- **No backend.** State lives in React context + `localStorage`.
- Ships as a **static export** (`output: "export"`) → see `DEPLOY.md`.

> ⚠️ Next 16 has breaking changes vs older versions. Read the bundled docs in
> `node_modules/next/dist/docs/` before changing framework-level code (there's an
> `AGENTS.md` note about this).

## Run it

```bash
npm ci
npm run dev        # http://localhost:3000  (redirects to /wizard)
npm run build      # static export → ./out
npm run lint       # eslint (clean)
npx tsc --noEmit   # typecheck (clean)
```

Routes: `/` → redirects to `/wizard`. Concepts: `/wizard` (1), `/scroll` (2),
`/dashboard` (3). A switcher in the header flips between them; answers carry
across all three (shared store).

## The three concepts

All share the exact same fields, logic, and calculations — only the *flow/chrome*
differs. All grounded in a clean-corporate brand ("Field Instrument" design:
white surfaces, Bond It blue `#1E9BD7`, mono readouts, a readiness gauge).

| Route | Concept | Flow |
|-------|---------|------|
| `/wizard` | 1 · Guided Wizard | one group per screen, Next/Back, required-field gating |
| `/scroll` | 2 · Document Scroll | long record + sticky section rail + jump links |
| `/dashboard` | 3 · Section Dashboard | collapsible cards, completion ticks, sticky live score |

## Architecture — the shared engine (`src/lib/`)

Everything is **schema-driven**: define a field once, all three concepts render
and validate it identically.

- **`types.ts`** — `FieldDef`, `GroupDef`, `SectionDef`, `Scorecard`, etc.
- **`schema.ts`** — the entire form: 3 sections → groups → fields, with
  `showIf` (conditional visibility) and `compute` (calculated readouts). **This
  is the single source of truth for the field list.**
- **`predicates.ts`** — shared logic helpers (`isMetal`, `humidityHigh`,
  `requiredAdhesionTests`, etc.).
- **`calc.ts`** — pure calculators: gallons (SF×.15/.20/.25), parapet coated SF,
  SMACNA gutter adequacy (+ rainfall adjustment), and the weighted **/50
  scorecard** (A/10 · B/20 · C/10 · D/10 → READY / PREP NEEDED / NOT READY).
- **`engine.ts`** — visibility + progress + capture-checklist helpers, plus
  `locateField` / `isSharedGroup`.
- **`store.tsx`** — React context + reducer, `localStorage` autosave, unique
  reference number, and **multi-roof** (per-roof answers + shared project fields).

## UI components (`src/components/`)

- **`FieldRenderer.tsx`** — maps a schema field to the right control; `FieldGrid`
  lays out a group.
- **`controls.tsx`** — text/number/select/multiselect/toggle/calc-readout/note
  controls (+ date/time "Set to today / now" buttons).
- **`uploads.tsx`**, **`SignaturePad.tsx`**, **`repeaters.tsx`** (parapet walls;
  adhesion tests with 3 photos each).
- **`ReadinessMeter.tsx`** — the signature gauge · **`ScorecardPanel.tsx`** ·
  **`ChecklistPanel.tsx`** (auto media check with jump-back).
- **`chrome.tsx`** — header, concept switcher, RoofBar, `GroupScopeBadge`
  (Shared vs Roof-only) · **`RoofFab.tsx`** — floating add/switch-roof control.
- **`jump.tsx`** — checklist → field jump-back (per-concept implementations).

## Multi-roof model

`+ Roof` (top bar or the floating pill) adds Roof A/B/C…. **Project-level fields**
(warranty, job details, weather, property, owner, evaluator, sign-off) are
entered **once and shared**. **Roof-specific fields** (measurements, condition,
metal/coating, drainage, testing) **duplicate per roof**, each with its own
scorecard; the scorecard panel shows a per-roof + aggregate summary. Groups are
badged **"Shared · all roofs"** or **"Roof X only"** when 2+ roofs exist. A
floating roof control (`RoofFab.tsx`) lets you add/switch roofs after the top bar
scrolls away — it appears **only on roof-specific content** and hides on shared
groups (warranty, job details, sign-off), driven by `roofscope.tsx` (each concept
computes "is the current view roof-relevant": wizard = current step's group,
scroll = the group in view via IntersectionObserver, dashboard = a roof-relevant
section is open).

## What's implemented (matches the brief's full field list)

3-section form · **complete field coverage** audited against the Agency Brief
(incl. all leak/ponding/substrate/crack descriptions, equipment detail fields,
drip lines, flashings, gutter/scupper damage, full metal-panel detail, moisture
core-marking, etc.) · full conditional logic (metal/coating/parapet/leaks/ponding/
grease/skylights/…) · live calcs (gallons, parapet SF, SMACNA gutter, /50 score) ·
multi-roof · adhesion testing (ASTM D4541, min-test count guide incl. +1/substrate,
auto pass/fail, **3 photos per test**) · self-checking media checklist with
**clickable jump-back** · e-signatures (**signed once**, shared) · auto today's
date + "Set to today/now" · warranty & product pre-form · **Bond It favicon**
(`src/app/icon.png`, the swoosh mark) · WCAG 2.1 AA · mobile single-column.

## Out of scope this phase (later work)

- **Offline / PWA** — explicitly dropped by the client.
- **PDF generation, email delivery, admin portal, real upload storage/DB, PIN
  access.** Uploads preview in-session only. Answers are per-device
  (`localStorage`), not a shared datastore.

When these land, flip `output: "export"` off in `next.config.ts` and run as a
Node server (PM2/Docker) with an API + database.

## Decisions & gotchas

- **Empty form reads 50/50 READY** — scoring deducts from a perfect score
  (faithful to the Form 1 scoring key). If Bond It prefers "incomplete until
  filled," gate the readiness banner on completion.
- **Product list is a placeholder** (`schema.ts` → `PRODUCTS`) — swap in Bond It's
  real catalogue.
- **Brand colours/fonts** live in one place (`src/app/globals.css` `@theme`).
- Logo at `public/bond-it-logo.png` (source `.ai` in the parent `branding/` dir).

## Deploy

- **Static export** (`output: "export"` → `out/`), served by nginx. No runtime Node.
- **Live on Dokploy** from GitHub `main`, Build Type **Dockerfile** (multi-stage
  node build → nginx, port **80**), domain `bonditdemo.everythingpla.net` with
  Traefik auto-HTTPS. Enable auto-deploy so each push to `main` redeploys.
- **CI:** `.github/workflows/ci.yml` runs lint + typecheck + build on every push/PR.
- Verified: `docker build` + container run serve all routes (root redirect,
  deep-links) with correct trailing-slash routing.
- Full runbook (Dokploy + manual nginx + Node fallback) in **`DEPLOY.md`**.

### Redeploy loop
```bash
git add -A && git commit -m "…" && git push origin main   # → Dokploy auto-builds
```

### Commands
```bash
npm ci · npm run dev · npm run build · npm run lint · npx tsc --noEmit
```

## Source documents (not in repo)

Parent folder `bond it form/`: `brief.docx` (streamlined 3-section brief we
followed), `Bond_It_Web_Form_Agency_Brief.docx` (detailed field list),
`Bond_It_Proposal.docx`, `Form_1_Pre-Coating_Inspection-draft.docx`, and
`docs and ref/` (SMACNA / adhesion / graph-paper references).
