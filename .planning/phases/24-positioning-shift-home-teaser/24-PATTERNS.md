# Phase 24: Positioning Shift & Home Teaser - Pattern Map

**Mapped:** 2026-07-11
**Files analyzed:** 8 (4 new, 4 modified) + 1 asset swap
**Analogs found:** 8 / 8 (all have strong in-repo analogs)

> Every file this phase touches has a close, tested analog already in the repo. This is a copy/metadata phase with one net-new visual element (the Home teaser) assembled from existing idioms. There are three landmines flagged inline (CONTACT literal, em-dash-unscanned data files, JSON-LD escaping) — see the marked ⚠️ callouts.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/data/education.ts` (NEW) | data-module | transform (facts → display + schema fragments) | `src/data/contact.ts` (`CONTACT` const) + `src/data/about.ts` | exact (data-module SSoT) |
| `src/pages/index.astro` (MOD) | page/route | request-response (build-time render) | itself (`.see-all-work` idiom) + `src/pages/experience.astro` `.featured` block | exact |
| `src/pages/about.astro` (MOD) | page/route | request-response | itself + `experience.astro` `.earlier-divider` idiom | exact |
| `src/data/about.ts` (MOD) | data-module | transform (copy strings) | itself (existing convention) | exact |
| `src/components/ContactSection.astro` (MOD) | component (composite) | request-response | itself (line 28 literal) | exact |
| `public/og-default.png` (ASSET) | asset | file-I/O | existing placeholder (already wired) | asset swap only |
| `tests/content/site-copy-em-dash.test.ts` (NEW — Gate A) | test | file-I/O (source scan) | `tests/content/experience-voice-em-dash.test.ts` + `voice-banlist.test.ts` | exact (readFileSync scan) |
| `tests/build/home-teaser-render.test.ts` (NEW — Gates B+C) | test | file-I/O (jsdom DOM parse) | `tests/build/featured-tier-render.test.ts` | exact (jsdom render gate) |
| `tests/content/education-module.test.ts` (NEW — Gate D) | test | unit (module import) | `tests/client/about-data.test.ts` | exact (import + assert) |

## Pattern Assignments

### `src/data/education.ts` (NEW — data-module, transform)

**Analog:** `src/data/contact.ts` (whole file) + `src/data/about.ts` header convention.

`contact.ts:1-17` is the template for a typed, voice-neutral single-source-of-truth module with a doc header naming its consumers:
```ts
/**
 * Single source of truth for contact information.
 * Consumed by: ContactSection.astro, Footer.astro, MobileMenu.astro, JsonLd.astro
 * Null entries are skipped silently by every consumer.
 */
export const CONTACT = {
  email: "jackcutrara@gmail.com",
  github: "https://github.com/jackc625",
  ...
} as const;
```
**Clone this shape.** Add a doc header naming consumers (`about.astro` block, `index.astro` personSchema, Phase 25 chat) and export `EDUCATION` / `CREDENTIALS` display facts plus the `alumniOfSchema` / `hasCredentialSchema` JSON-LD fragments. Full recommended shape is in RESEARCH Pattern 2 (lines 138-179). Keep `as const` on the facts object like `contact.ts:6`. ⚠️ **EM-DASH LANDMINE (D-18):** this file is NOT gate-scanned by any existing test — Gate D + Gate A must cover it; zero `—`, en dash `–` permitted.

---

### `src/pages/index.astro` (MOD — page, multiple edits)

Four distinct edits in one file. Each has an in-file or sibling analog.

**Edit 1 — Teaser section (new `01 EXPERIENCE`, placed FIRST).**
**Analog A (structure):** `src/pages/experience.astro:51-69` `.featured` article — clone trimmed:
```astro
<article class="featured">
  <p class="meta-mono featured-eyebrow">{holloway.data.role} &middot; {holloway.data.dateRange}</p>
  <h2 class="h2-project featured-title">{holloway.data.company}</h2>
  <p class="featured-stack">{hollowayStack}</p>   {/* OMIT this line — D-05 */}
  <p class="lead featured-summary">{holloway.data.summary}</p>
  <ul class="highlights">
    {holloway.data.highlights.map((h) => (<li class="body highlight">{h}</li>))}  {/* trim to highlights[0] only — D-02/D-03 */}
  </ul>
  <a class="label-mono deep-link" href="/experience/holloway">...</a>  {/* retarget href="/experience" — D-04 */}
</article>
```
**Analog B (collection query + guard):** `experience.astro:6,10-21` — reuse verbatim, change the throw message to `index.astro:`:
```ts
import { sortExperienceEntries } from "../lib/experience";
const entries = sortExperienceEntries(await getCollection("experience"));
const holloway = entries.find((e) => e.data.hasCaseStudy);
if (!holloway) { throw new Error("index.astro: no experience entry has hasCaseStudy: true ..."); }
```
Do NOT inline a `.sort()` — `sortExperienceEntries` sorts by `startDate` desc (anti-pattern per RESEARCH line 202).

**Analog C (deep-link + reduced-motion CSS):** the in-file `.see-all-work` block is the exact twin to clone — `index.astro:72-75` markup + `index.astro:114-129` CSS:
```astro
<a class="label-mono see-all-work" href="/projects">
  See all work
  <span class="see-all-arrow" aria-hidden="true">&rarr;</span>
</a>
```
```css
.see-all-work { display: inline-block; margin-top: 24px; color: var(--ink-muted); text-decoration: none; transition: color 120ms ease; }
.see-all-arrow { color: var(--accent); opacity: 0; transition: opacity 120ms ease; }
.see-all-work:hover, .see-all-work:focus-visible { color: var(--accent); }
.see-all-work:hover .see-all-arrow, .see-all-work:focus-visible .see-all-arrow { opacity: 1; }
.see-all-work:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  .see-all-work, .see-all-arrow { transition: none; }
  .see-all-work:hover .see-all-arrow, .see-all-work:focus-visible .see-all-arrow { opacity: 0; }
}
```
Rename to a teaser-distinct selector (e.g. `.experience-link` / `.experience-arrow`) so selectors don't collide with the WORK section's `.see-all-work`. Target `href="/experience"` (D-04).

**Edit 2 — Renumber section headers.** `index.astro:60` WORK `number="01"→"02"`; `index.astro:82` ABOUT `number="02"→"03"`. These are `SectionHeader` prop-value changes only — do NOT edit `SectionHeader.astro`.

**Edit 3 — Enrich `personSchema`.** Current object `index.astro:21-32`:
```ts
const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Jack Cutrara",
  url: "https://jackcutrara.com",
  email: CONTACT.email,
  sameAs: [CONTACT.github, CONTACT.linkedin, CONTACT.x].filter(Boolean),
};
```
Add `jobTitle: "Software Engineer"` (D-07/D-14) and spread `alumniOf: alumniOfSchema` + `hasCredential: hasCredentialSchema` imported from `../data/education` (D-14). Rendering path unchanged: `<JsonLd schema={personSchema} />` (`index.astro:37`).

**Edit 4 — Sharpen `description` prop.** `index.astro:35` `<BaseLayout title="" description="Software engineer building reliable, production-grade systems.">` — revise the string per D-15 draft (UI-SPEC line 210). Per-page prop; no `BaseLayout.astro` edit (D-19). ⚠️ zero `—`.

---

### `src/pages/about.astro` (MOD — page)

**Analog A (education block markup):** RESEARCH Code Examples (lines 270-284) + the `.earlier-divider` hairline-rule idiom from `experience.astro:170-189`:
```css
/* experience.astro:170-189 — clone for .education-rule */
.earlier-divider { display: flex; align-items: center; gap: 12px; margin-top: 48px; margin-bottom: 24px; }
.earlier-label { color: var(--ink-faint); flex: 0 0 auto; }
.earlier-rule { flex: 1 1 auto; height: 1px; background: var(--rule); }
```
Place the block after the four `<p>` paragraphs, inside the existing `Container`, page-scoped `<style>`. Reads `EDUCATION` / `CREDENTIALS` from `../data/education`. Colors per UI-SPEC §Color (degree `--ink`, org `--ink-muted`, VT sub-note `--ink-faint`); NO accent (non-interactive). frontend-design finalizes form (D-09/D-20).

**Analog B (revised copy render):** `about.astro:13-16` already renders `ABOUT_INTRO/P1/P2/P3` — no render change needed, the revised strings come from `about.ts`.

**Edit — description prop.** `about.astro:8` currently `description="Jack Cutrara -- junior software engineer building production-grade systems."` — drop "junior" (D-07); optional sharpen per UI-SPEC line 214. ⚠️ this string contains the register landmine ("junior") that Gate A must catch.

---

### `src/data/about.ts` (MOD — data-module)

**Analog:** itself. Existing convention (`about.ts:1-20`): curly quotes `“ ” ’`, non-breaking space ` `, per-string `/* Verified */` comment, ZERO em dashes.
- Rework `ABOUT_INTRO` (`about.ts:7-8` — currently contains "junior" to drop) and `ABOUT_P1` (`:11-12`).
- Keep `ABOUT_P2` (`:15-16`) VERBATIM (D-06).
- Update `ABOUT_P3` (`:19-20` — currently "junior or entry-level", to replace with contract + full-time framing, D-13).
- ⚠️ **Word-count landmine (Pitfall 2):** `about-data.test.ts:22-35` caps `ABOUT_P1/P2/P3` at ≤80 words. UI-SPEC drafts comply (P1 ≈57, P3 ≈41) but re-count if Jack edits. `ABOUT_INTRO` is only truthy-checked (no cap).
- ⚠️ **EM-DASH + register landmine (D-18):** NOT gate-scanned today. Match `about.ts`'s existing escapes; zero `—`; no "junior"/"senior". Gate A closes this.

---

### `src/components/ContactSection.astro` (MOD — component) ⚠️ LANDMINE

**Analog:** itself, line 28. This is the phase's #1 renumber trap. CONTACT does NOT use the `SectionHeader` primitive — the number is a **hardcoded HTML literal**:
```astro
<div class="section-header"><span id="section-contact" class="label-mono">&sect; 03 &middot; CONTACT</span></div>
```
Change `03` → `04` in this literal (`ContactSection.astro:28`). The doc comments at `:3` and `:10` also say "§ 03" — cosmetic, update for consistency. The literal only renders on Home (`showSectionHeader` default false on `/contact`, `:23`), so the change is Home-only in effect. **If you renumber only the `SectionHeader number=` props in `index.astro` and forget this literal, Home ships `... 03 ABOUT / 03 CONTACT`** (Gate B catches it).

---

### `public/og-default.png` (ASSET — swap only)

Already referenced by `BaseLayout.astro` default (`ogImage="/og-default.png"`, 1200×630 declared). Pure asset write, no source/wiring edit (D-16/D-19). Optional existence+dimension gate can mirror `resume-asset.test.ts`; visual content is a frontend-design + human checkpoint.

---

### `tests/content/site-copy-em-dash.test.ts` (NEW — Gate A)

**Analog:** `tests/content/experience-voice-em-dash.test.ts` (readFileSync source-scan) + `tests/content/voice-banlist.test.ts` (regex banlist array). Headline Nyquist win — closes the D-18 gap.

Em-dash idiom (`experience-voice-em-dash.test.ts:23,70-82`):
```ts
const EM_DASH = /—/g;
const count = (src.match(EM_DASH) ?? []).length;
expect(count, `unexpected em dash in ${relPath} — use an en dash`).toBe(0);
```
Register banlist idiom (`voice-banlist.test.ts:15-30`):
```ts
const BANLIST: Array<{ name: string; pattern: RegExp }> = [
  { name: "junior", pattern: /\bjunior\b/i },   // NEW — D-07
  { name: "senior", pattern: /\bsenior\b/i },
  { name: "5+ years", pattern: /\b5\+\s*years\b/i },
];
```
Scan set (RESEARCH Gate A): `src/data/about.ts`, `src/data/education.ts`, `src/pages/index.astro`, `src/pages/about.astro` (add `ContactSection.astro` if the CONTACT literal counts as copy). Assert em-dash count 0 per file; assert register banlist 0 on `about.ts` + `about.astro`.

---

### `tests/build/home-teaser-render.test.ts` (NEW — Gates B+C)

**Analog:** `tests/build/featured-tier-render.test.ts` (whole file). Clone the `// @vitest-environment jsdom` header + `existsSync` guard + DOMParser idiom (`:1,20-43`):
```ts
// @vitest-environment jsdom
import { readFileSync, existsSync } from "node:fs";
const HOME_HTML = join(process.cwd(), "dist", "client", "index.html");  // Cloudflare adapter path
beforeAll(() => {
  distExists = existsSync(HOME_HTML);
  if (!distExists) return;
  doc = new DOMParser().parseFromString(readFileSync(HOME_HTML, "utf8"), "text/html");
});
it("built HTML exists (run after `pnpm build`)", () => {
  expect(distExists, `${HOME_HTML} does not exist — run \`pnpm build\` first`).toBe(true);
});
```
**Gate B assertions:** map section-label spans → expect `["§ 01 · EXPERIENCE","§ 02 · WORK","§ 03 · ABOUT","§ 04 · CONTACT"]` (normalize whitespace; `SectionHeader` renders `§ {number} · {title}`, CONTACT literal renders the same shape). Assert an `<a href="/experience">` (NOT `/experience/holloway`, D-04) in the teaser section containing metric substring `1,400`.
**Gate C (JSON-LD, same file or own):** ⚠️ **escaping landmine (Pitfall 5)** — `JsonLd.astro:9-14` escapes `<`→`<`, `>`→`>`, `&`→`&`. Do NOT substring-match; extract `script[type="application/ld+json"]` `textContent` and `JSON.parse` it (the `<` escapes are valid JSON). Assert `@type==="Person"`, `jobTitle==="Software Engineer"`, `alumniOf` names include WGU + Virginia Tech, `hasCredential` includes `LPI Linux Essentials`, and VT is NOT in `hasCredential` (D-10).

---

### `tests/content/education-module.test.ts` (NEW — Gate D)

**Analog:** `tests/client/about-data.test.ts` (import-and-assert unit, node env):
```ts
import { describe, it, expect } from "vitest";
import { EDUCATION, CREDENTIALS, hasCredentialSchema, alumniOfSchema } from "../../src/data/education";
```
Assert `EDUCATION.institution === "Western Governors University"`, `.date === "May 2026"`, `.transferredFrom === "Virginia Tech"`; `CREDENTIALS` contains `LPI Linux Essentials`; every `hasCredentialSchema` entry `@type === "EducationalOccupationalCredential"` and no `recognizedBy.name === "Virginia Tech"` (VT not a credential, D-10); `alumniOfSchema` DOES include VT. Build-free — the fragment-in-module design exists to make this unit-testable.

## Shared Patterns

### Deep-link + reduced-motion contract
**Source:** `src/pages/index.astro:114-129` (`.see-all-work`) ≡ `src/pages/experience.astro:141-168` (`.deep-link`)
**Apply to:** the new Home teaser link. Keeps color-change affordance under `prefers-reduced-motion`, drops only the arrow opacity reveal. Focus ring `outline: 2px solid var(--accent); outline-offset: 2px`.

### Data-module single source of truth
**Source:** `src/data/contact.ts` (doc header naming consumers + typed `as const` export)
**Apply to:** `src/data/education.ts`.

### JSON-LD XSS-safe serialization (DO NOT bypass)
**Source:** `src/components/JsonLd.astro:9-17`
**Apply to:** all schema data. Education fields flow through the existing `<JsonLd schema={personSchema} />` call — never hand-roll a `<script type="application/ld+json">` (V5.3 output encoding, RESEARCH Security).

### Hairline `--rule` divider
**Source:** `src/pages/experience.astro:170-189` (`.earlier-divider` / `.earlier-rule`)
**Apply to:** the `/about` education block divider.

### Section renumber = prop change, not primitive edit
**Source:** `index.astro:60,82` (`SectionHeader number=` props)
**Apply to:** WORK/ABOUT renumber. Exception: CONTACT is a literal (see below).

## Landmines (planner/executor MUST heed)

| # | Landmine | Location | Mitigation |
|---|----------|----------|------------|
| 1 | CONTACT number is a hardcoded literal, not a `SectionHeader` prop | `ContactSection.astro:28` | Edit the `&sect; 03` literal → `04`; Gate B catches a miss |
| 2 | Em-dash + register (`junior`/`senior`) land in files NO existing gate scans | `about.ts`, `education.ts`, `index.astro`, `about.astro` copy + `about.astro:8` / `about.ts:8,20` "junior" | Ship Gate A (source scan) — the phase's headline Nyquist deliverable |
| 3 | JSON-LD rendered bytes are `<`-escaped by `JsonLd.astro` | Gate C | Parse (`JSON.parse` on `<script>` textContent), never substring-match |
| 4 | `about-data.test.ts:22-35` caps P1/P2/P3 at ≤80 words | `about.ts` revision | Re-count drafts before commit (P1≈57, P3≈41 today) |
| 5 | `about.ts` edits CANNOT trip `checkFirstPersonLeaks` (NON-issue) | — | Do not add chat gates/edits (Phase 25, D-17); just confirm chat gates stay green post-build |
| 6 | OG swap must not touch `BaseLayout.astro` | `public/og-default.png` | Asset write only; already wired |

## No Analog Found

None. Every file maps to a concrete, tested in-repo analog. The only MEDIUM-confidence element is the schema.org shape inside `education.ts` (validity beyond `JSON.parse` is a human Google Rich Results checkpoint, per RESEARCH A1) — but its module + test structure both have exact analogs.

## Metadata

**Analog search scope:** `src/pages/`, `src/data/`, `src/components/`, `tests/content/`, `tests/build/`, `tests/client/`
**Files read for excerpts:** `index.astro`, `experience.astro`, `about.astro`, `about.ts`, `contact.ts`, `JsonLd.astro`, `ContactSection.astro`, `experience-voice-em-dash.test.ts`, `voice-banlist.test.ts`, `featured-tier-render.test.ts`, `about-data.test.ts`
**Pattern extraction date:** 2026-07-11
</content>
</invoke>
