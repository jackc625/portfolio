# Phase 24: Positioning Shift & Home Teaser - Research

**Researched:** 2026-07-11
**Domain:** Astro static-site copy/metadata refactor + one new page-scoped UI element (Home Experience teaser) + schema.org JSON-LD enrichment + Nyquist validation design
**Confidence:** HIGH (all claims grounded in read source; schema.org shape is CITED)

## Summary

Phase 24 is a COPY / METADATA phase with exactly one genuinely new visual element (the Home `01 EXPERIENCE` teaser). The WHAT and most of the HOW are already locked by `24-CONTEXT.md` (D-01..D-20) and the APPROVED `24-UI-SPEC.md`. This research does NOT re-derive those decisions. It answers what PLANNING still needs: (1) a concrete, mostly-automatable `## Validation Architecture` that turns the manual guardrails (em-dash, register, section renumber, JSON-LD validity, chat-surface invariants) into Vitest gates using this repo's exact existing patterns; (2) the verified schema.org shape for the enriched Person schema; (3) the `src/data/education.ts` module shape; (4) landmines.

The single most important planning insight: **the repo's automated voice/em-dash/banlist gates scan ONLY project + experience MDX — they do NOT scan `src/data/*.ts`, `index.astro`, or `about.astro`, which is exactly where every Phase 24 string lives** (verified: `tests/content/voice-em-dash.test.ts:5-13` and `experience-voice-em-dash.test.ts:26-34` hardcode MDX paths). D-18 currently mitigates this with "manual verification." Planning should instead ship a NEW `tests/content/site-copy-em-dash.test.ts` gate so the landmine is caught by CI, not by eyeballs. This is the primary Nyquist deliverable of the phase.

Second insight, which REMOVES a feared pitfall: editing `src/data/about.ts` (first-person) **cannot** trip the `checkFirstPersonLeaks` build guard. That guard lives in `scripts/build-chat-context.mjs` and reads `src/data/about-chat.ts` (third-person) + MDX, never `about.ts` (verified: `about-chat.ts:1-16` header + `chat-knowledge-voice.test.ts:22-24` reads `portfolio-context.json`, not `about.ts`). Phase 24 touches no chat-context input, so the regenerated `portfolio-context.json` stays byte-identical and the chat gates stay green with no chat edits.

**Primary recommendation:** Build `src/data/education.ts` as the single source of truth exporting both display facts AND ready-made schema.org fragments (`alumniOfSchema`, `hasCredentialSchema`); spread those into the inline `personSchema` in `index.astro`. Add three new Vitest gates (site-copy em-dash/register source scan; Home section-number render gate; JSON-LD rendered-parse gate) and extend `about-data.test.ts` awareness of the revised copy. Keep every edit page-scoped — do not touch `BaseLayout.astro` or `global.css`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Positioning copy (About intro/P1/P3, hero) | Content data (`src/data/about.ts`) | Static page render (`index.astro`, `about.astro`) | Copy is centralized data consumed by two pages; changing the string changes both surfaces (D-06) |
| Home Experience teaser | Static page (`index.astro`, page-scoped CSS) | Content collection (`getCollection("experience")`) | Build-time render of collection data; no client JS, no runtime tier (D-05) |
| Education facts | Content data (`src/data/education.ts`, NEW) | Static render + JSON-LD | Single voice-neutral module feeds the `/about` block AND the Person schema; Phase 25 later adds chat consumer (D-11) |
| SEO description | Static page prop (`description=` on `<BaseLayout>`) | — | Per-page prop; no `BaseLayout.astro` edit needed (D-15/D-19) |
| Person JSON-LD | Static page (`index.astro` frontmatter) → `JsonLd.astro` | Education module | Schema object built at page-module scope, serialized at build time; no runtime (D-14) |
| Section numbering | Static markup (`index.astro` + `ContactSection.astro`) | `SectionHeader` primitive | Presentational; the primitive takes a `number` prop, but CONTACT hardcodes its own literal (see Pitfall 3) |
| OG social card | Static asset (`public/og-default.png`) | — | Pure asset swap; already referenced by `BaseLayout` default (D-16) |

## User Constraints

*(Copied from `24-CONTEXT.md`. The planner MUST honor these — they are locked. Full text and rationale live in CONTEXT; condensed here.)*

### Locked Decisions (D-01..D-20)
- **D-01:** Home renumbers to `01 EXPERIENCE / 02 WORK / 03 ABOUT / 04 CONTACT`. New EXPERIENCE section placed FIRST. Renumber every Home `SectionHeader number=` (WORK `01→02`, ABOUT `02→03`) and the CONTACT header (`03→04`, which lives in `ContactSection.astro`).
- **D-02:** Teaser = headline + ONE metric + link. Not the full 5-highlight ledger.
- **D-03:** Lead metric = the test-suite growth ("0 to ~1,400 passing checks", holloway highlight #1).
- **D-04:** Teaser link target = `/experience` (the listing), NOT `/experience/holloway`.
- **D-05:** Teaser = compact reuse of the `experience.astro` `.featured` treatment; page-scoped CSS in `index.astro`; reuse `getCollection("experience")` + `sortExperienceEntries` + the `hasCaseStudy` Holloway entry; likely OMIT the stack line.
- **D-06:** Targeted `about.ts` revision — rework `ABOUT_INTRO` + `ABOUT_P1`, keep `ABOUT_P2` VERBATIM, update `ABOUT_P3`. Propagates to BOTH `/about` and the Home ABOUT preview.
- **D-07:** Self-label = "Software engineer" (drop "junior"/"new-grad" qualifier). New-grad register via content, never a self-diminishing label, never senior.
- **D-08:** Home hero lead stays AS-IS.
- **D-09:** Dedicated compact Education/credentials block on `/about` only. NO education block on Home.
- **D-10:** Education fields — WGU B.S. CS (May 2026) primary + "transferred from Virginia Tech" sub-note + "LPI Linux Essentials" line. No GPA/honors. Do NOT imply a VT credential.
- **D-11:** Shared `src/data/education.ts` module = single source of truth. Phase 24 wires the SITE only.
- **D-12:** Present-tense / current Holloway framing.
- **D-13:** `ABOUT_P3` = currently contracting + seeking full-time.
- **D-14:** Enrich Home `personSchema` — `jobTitle` + `alumniOf` + `hasCredential`, sourced from `education.ts`.
- **D-15:** Sharpen the Home/default SEO `description=` prop. Zero em dashes.
- **D-16:** Ship a real 1200×630 `public/og-default.png` (folded todo). Asset swap only.
- **D-17:** SITE surfaces only. Do NOT touch `about-chat.ts`, `portfolio-context.json`/`.static.json`, or `scripts/build-chat-context.mjs`.
- **D-18:** EM-DASH LANDMINE — `src/data/*` copy is NOT gate-scanned. Zero em dashes; en dashes permitted.
- **D-19:** Chat-surface invariants — keep changes OUT of `BaseLayout.astro`/`global.css`; if touched, run the D-26 battery + D-15 SSE anchor. `astro check` stays 0/0/0; no new runtime deps.
- **D-20:** frontend-design routing MANDATORY for teaser form, education block, OG card, `/about` layout.

### Claude's / frontend-design's Discretion
- OG card concept (D-16); teaser component shape + show/omit stack line (D-05, recommend omit); education block form (D-09); copy drafting (Claude drafts, Jack reviews).

### Deferred Ideas (OUT OF SCOPE)
- All chat-side positioning refresh (`about-chat.ts`, `portfolio-context.json` education object, chat-context build wiring) → Phase 25 (CHAT-10/11).
- OG per-project/per-page images.
- Senior/lead/"5+ years" framing; new design system; dark mode; new runtime deps.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| POS-01 | Home + About present Jack as new-grad engineer with production experience (first-person) | `about.ts` targeted revision (D-06); drafts in UI-SPEC lines 198-207; register gate proposed in Validation Architecture |
| POS-02 | About narrative reflects professional experience + graduation, honest new-grad register | Same `about.ts` edits + the education block; `about-data.test.ts:22-35` already caps P1/P3 at ≤80 words (drafts verified compliant below) |
| POS-03 | Education status (WGU B.S. CS May 2026, VT transfer, LPI cert) surfaced on the visible site | New `src/data/education.ts` module + `/about` block; module shape specified below |
| POS-04 | Metadata (SEO title/desc + JSON-LD Person) reflects positioning + job title | `personSchema` enrichment in `index.astro:21-32`; verified schema.org shape below; rendered-parse gate proposed |
| HOME-01 | Home surfaces a concise Holloway teaser linking to the Experience page | Teaser reuses `experience.astro` `.featured` idiom + `getCollection("experience")` guard (lines 10-40); render gate proposed |

## Standard Stack

No new dependencies. Everything is already installed (verified `package.json:29-55`):

| Library | Version (installed) | Purpose this phase | Notes |
|---------|--------------------|--------------------|-------|
| astro | ^6.0.8 | Static render of pages, content collections, `astro:content` `getCollection` | `index.astro` already imports it (line 2) |
| astro-seo | ^1.1.0 | `<SEO>` title/description/OG in `BaseLayout.astro:56-87` | `description=` is a per-page prop — no lib change |
| zod (via astro/zod) | ^4.3.6 | `experience` collection schema (`content.config.ts:25-43`) | No schema change; teaser reads existing fields |
| vitest | ^4.1.0 | All validation gates (`pnpm test` = `vitest run`) | node env default; jsdom via per-file `// @vitest-environment jsdom` |
| @astrojs/check | ^0.9.8 | `pnpm exec astro check` 0/0/0 typecheck gate | Runs in `pnpm build` too (`package.json:13`) |

**Installation:** none. `## Package Legitimacy Audit` is intentionally omitted — this phase installs zero external packages (D-19: "no new runtime dependencies"). If the planner finds a reason to add one, STOP: it violates a locked decision.

## Architecture Patterns

### System Architecture Diagram

```
                         ┌───────────────────────────────────────┐
  src/data/about.ts ─────┤ (revised: intro/P1/P3; P2 verbatim)    │
   (first person)        └───────────────┬───────────────────────┘
                                         │ import
              ┌──────────────────────────┼──────────────────────────┐
              ▼                          ▼                           │
        index.astro                 about.astro                      │
   (Home ABOUT preview)         (/about full copy)                   │
                                                                     │
  src/data/education.ts (NEW, voice-neutral) ────────┬──────────────┘
        │  EDUCATION, CREDENTIALS (display facts)     │ import
        │  alumniOfSchema, hasCredentialSchema        │
        ├───────────────► about.astro  ── renders ──► Education block (/about only)
        └───────────────► index.astro  ── spread ──►  personSchema ──► JsonLd.astro
                                                                          │ set:html (escaped)
                                                                          ▼
                                                          <script type="application/ld+json">
  getCollection("experience") ──► sortExperienceEntries ──► holloway (hasCaseStudy find + guard)
        │                                                       │
        └──────────────────────────► index.astro EXPERIENCE teaser (role/company/dateRange/highlight[0]/link → /experience)

  NOT TOUCHED (D-17): about-chat.ts, portfolio-context.json, build-chat-context.mjs
  NOT TOUCHED (D-19): BaseLayout.astro, global.css
```

### Pattern 1: Teaser = compact clone of the `.featured` block (D-05)
**What:** Mirror `experience.astro:51-69` structure, trimmed, page-scoped CSS in `index.astro`.
**When:** The new `01 EXPERIENCE` section.
**Grounded reuse — `index.astro` frontmatter must add (mirroring `experience.astro:6,10-40`):**
```ts
// Source: src/pages/experience.astro:6,10-21 (verified)
import { sortExperienceEntries } from "../lib/experience";
const experience = sortExperienceEntries(await getCollection("experience"));
const holloway = experience.find((e) => e.data.hasCaseStudy);
if (!holloway) {
  throw new Error(
    "index.astro: no experience entry has hasCaseStudy: true -- expected the Holloway teaser.",
  );
}
```
- Reuse fields: `holloway.data.role`, `.company`, `.dateRange`, `.summary`, `.highlights[0]`. Do NOT re-map all highlights (D-02: one metric only). OMIT `techStack` (D-05).
- Link idiom: clone the in-file `.see-all-work` block (`index.astro:114-129`) — it is the exact twin of `experience.astro`'s `.deep-link` and already ships the reduced-motion contract. Rename to a teaser class (e.g. `.experience-link` / `.experience-arrow`) to keep selectors distinct. Target `href="/experience"` (D-04).

### Pattern 2: Data module as single source of truth (D-11)
**What:** `education.ts` follows the `about.ts` / `contact.ts` convention (verified `about.ts:1-20`, `contact.ts`): typed exports, voice-neutral facts, curly quotes + ` ` where needed, ZERO em dashes.
**Recommended shape** (facts + schema fragments in one module so both consumers stay in sync):
```ts
// src/data/education.ts (NEW)
export interface Credential {
  name: string;
  issuer?: string;      // "Linux Professional Institute"
}

export const EDUCATION = {
  degree: "B.S. Computer Science",
  institution: "Western Governors University",
  date: "May 2026",
  transferredFrom: "Virginia Tech",
} as const;

export const CREDENTIALS: Credential[] = [
  { name: "LPI Linux Essentials", issuer: "Linux Professional Institute" },
];

// schema.org fragments consumed by index.astro personSchema (D-14).
// alumniOf = *attended* (VT transfer is honest here); hasCredential = *earned*
// (VT is NOT a credential — D-10). WGU degree IS a credential.
export const alumniOfSchema = [
  { "@type": "CollegeOrUniversity", name: "Western Governors University" },
  { "@type": "CollegeOrUniversity", name: "Virginia Tech" },
];

export const hasCredentialSchema = [
  {
    "@type": "EducationalOccupationalCredential",
    credentialCategory: "degree",
    name: "Bachelor of Science in Computer Science",
    recognizedBy: { "@type": "Organization", name: "Western Governors University" },
    validFrom: "2026-05",
  },
  ...CREDENTIALS.map((c) => ({
    "@type": "EducationalOccupationalCredential",
    credentialCategory: "certificate",
    name: c.name,
    ...(c.issuer ? { recognizedBy: { "@type": "Organization", name: c.issuer } } : {}),
  })),
];
```
**Why fragments in the module, not inline in `index.astro`:** keeps the schema unit-testable in the node vitest env (no build needed) and guarantees the `/about` block and the JSON-LD never drift (D-11). Phase 25 later imports `EDUCATION`/`CREDENTIALS` for chat — the schema fragments are site-only.

### Pattern 3: Person schema enrichment (D-14)
**What:** Spread the fragments into the existing inline object (`index.astro:21-32`).
```ts
// Source: src/pages/index.astro:21-32 (verified current shape) + D-14
import { alumniOfSchema, hasCredentialSchema } from "../data/education";
const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Jack Cutrara",
  url: "https://jackcutrara.com",
  jobTitle: "Software Engineer",            // NEW (D-14, D-07)
  email: CONTACT.email,
  sameAs: [CONTACT.github, CONTACT.linkedin, CONTACT.x].filter(Boolean),
  alumniOf: alumniOfSchema,                 // NEW (D-14)
  hasCredential: hasCredentialSchema,       // NEW (D-14)
};
```
Rendering path is unchanged: `<JsonLd schema={personSchema} />` (`index.astro:37`). `JsonLd.astro:9-14` escapes `<`/`>`/`&` to `<`/`>`/`&` — these are valid JSON escapes, so a rendered-HTML `JSON.parse` gate still works (see Validation Architecture).

### Anti-Patterns to Avoid
- **Duplicating the experience collection query.** Reuse `sortExperienceEntries` + the `hasCaseStudy` find guard (D-05). Do not inline a `.sort()` — experience orders by `startDate`, not `order` (`experience.ts:12-18`).
- **Editing `SectionHeader.astro` to renumber.** The primitive takes a `number` prop; renumbering is a prop-value change in `index.astro`, not a primitive edit. But CONTACT is different (Pitfall 3).
- **Putting the education block or any education copy on Home.** D-09: `/about` only; Home gets education solely via JSON-LD.
- **Adding `alumniOf` for a VT *credential*.** VT is `alumniOf` (attended) only; the degree credential is WGU (D-10).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Reverse-chron experience ordering | A new `.sort()` in `index.astro` | `sortExperienceEntries` (`src/lib/experience.ts`) | Already the tested contract; sorts by `startDate` desc, not `order` |
| Holloway teaser data | A hardcoded copy of role/company/metric | `getCollection("experience")` + `hasCaseStudy` find guard | No drift from the MDX source; build fails loud if the entry is renamed |
| JSON-LD script escaping | Manual `JSON.stringify` in `index.astro` | `JsonLd.astro` (`set:html` with `<`/`>`/`&`/U+2028/U+2029 escaping) | XSS-safe serialization already solved (lines 9-14) |
| Deep-link hover/reduced-motion | New keyframes | Clone the `.see-all-work` block (`index.astro:114-129`) | Ships the accent-color-keeps / arrow-reveal-drops reduced-motion contract already |
| OG meta wiring | New `<meta>` tags | `public/og-default.png` asset swap | `BaseLayout.astro:23` already defaults `ogImage="/og-default.png"` — no wiring |

**Key insight:** Almost nothing in this phase is net-new logic — it is copy + one teaser assembled from primitives and idioms that already exist and are already tested.

## Common Pitfalls

### Pitfall 1: The em-dash / register landmine lands in UNSCANNED files (D-18)
**What goes wrong:** An em dash (or a lingering "junior"/"senior") slips into `about.ts`, `education.ts`, a page-scoped teaser string, or a `description=` prop and ships, because CI never scans those files.
**Why it happens:** `voice-em-dash.test.ts:5-13`, `voice-banlist.test.ts:5-13`, and `experience-voice-em-dash.test.ts:26-34` hardcode MDX slugs / experience-page paths. None enumerate `src/data/*.ts`, `index.astro`, or `about.astro`.
**How to avoid:** Ship the new source-scan gate (Validation Architecture, Gate A). Match the existing `about.ts` convention: curly quotes `“ ” ’`, ` `, en dash `–` for date ranges, ZERO `—` (verified `about.ts:7-20` uses no em dashes).
**Warning signs:** Any literal `—` in a diff to those files; the word "junior" surviving in `about.ts:8`/`about.ts:20` or `about.astro:8`.

### Pitfall 2: `about-data.test.ts` word-count cap silently constrains the rewrite
**What goes wrong:** A revised `ABOUT_P1`/`ABOUT_P3` over 80 words turns an existing GREEN test RED.
**Why it happens:** `about-data.test.ts:22-35` asserts `ABOUT_P1`/`ABOUT_P2`/`ABOUT_P3` each `.split(/\s+/).length <= 80`. `ABOUT_INTRO` is only truthy-checked (no word cap).
**How to avoid:** Keep drafts ≤80 words. The UI-SPEC drafts comply: `ABOUT_P1` draft ≈ 57 words, `ABOUT_P3` draft ≈ 41 words (counted). `ABOUT_P2` is kept verbatim (D-06) so its count is unchanged. Note `\s` in JS matches ` `, so nbsp does not inflate the count.
**Warning signs:** Adding a long clause to P1/P3 without re-counting.

### Pitfall 3: CONTACT renumber is a LITERAL string, not a `SectionHeader` prop
**What goes wrong:** The planner renumbers Home `SectionHeader number=` props but the CONTACT header stays `03`.
**Why it happens:** `ContactSection.astro:28` hardcodes `<span id="section-contact" class="label-mono">&sect; 03 &middot; CONTACT</span>` — it does NOT use the `SectionHeader` primitive. WORK/ABOUT use `SectionHeader` (`index.astro:60,82`); CONTACT does not.
**How to avoid:** Renumber `03 → 04` by editing that literal in `ContactSection.astro:28`. Confirm `ContactSection` renders identically on `/contact` (it uses `showSectionHeader` default false there — the header only shows on Home, so the literal change is Home-only in effect; verified `ContactSection.astro:23,26-31`).
**Warning signs:** The Home section-number render gate (Gate B) shows `01 EXPERIENCE / 02 WORK / 03 ABOUT / 03 CONTACT`.

### Pitfall 4: Assuming `about.ts` edits can leak into chat / trip `checkFirstPersonLeaks`
**What goes wrong (actually a NON-issue, documented to save planning cycles):** Someone gates the `about.ts` rewrite behind a chat-voice concern.
**Reality:** `checkFirstPersonLeaks` is in `scripts/build-chat-context.mjs` and consumes `about-chat.ts` (third person) + MDX, NOT `about.ts` (verified `about-chat.ts:1-16` header; `chat-knowledge-voice.test.ts:22-24` reads the generated `portfolio-context.json`). Phase 24 changes no chat-context input, so `pnpm build`'s `build:chat-context` step regenerates a byte-identical `portfolio-context.json` and `chat-context-integrity` + `chat-knowledge-voice` stay green with zero chat edits. First-person copy in `about.ts` is correct and cannot leak.
**How to use this:** Do NOT add chat gates or chat edits to Phase 24 (that is Phase 25, D-17). Just confirm the chat gates remain green post-build as a regression check.

### Pitfall 5: JSON-LD rendered bytes are escaped — parse, don't substring-match
**What goes wrong:** A gate substring-searches the built HTML for `"jobTitle"` and fails because the serializer emitted escaped forms, or matches the `<script>` in a scoped `<style>`.
**Why it happens:** `JsonLd.astro:9-14` replaces `<`→`<` etc. The `@type` value `"CollegeOrUniversity"` etc. survive as plain text, but structural `<`/`>`/`&` are escaped.
**How to avoid:** In the gate, extract the `<script type="application/ld+json">` text and `JSON.parse` it (the `<` escapes are valid JSON), then assert on the parsed object. See Gate C.

### Pitfall 6: OG card must stay a pure asset swap (D-16/D-19)
**What goes wrong:** Editing `BaseLayout.astro` OG wiring while swapping the image, tripping the D-26 chat-surface battery + D-15 SSE anchor.
**How to avoid:** Write only `public/og-default.png` (1200×630). `BaseLayout.astro:23,73-78` already references it and declares width/height 1200×630. No source edit. The existing `resume-asset.test.ts` pattern (asset existence gate) can be mirrored for the OG file if a gate is wanted, but the card is a folded todo and its content is a human/design deliverable (checkpoint).

## Runtime State Inventory

> This is a copy/metadata/UI phase, not a rename/refactor/migration. No stored runtime state is keyed on any changed string. Categories checked explicitly:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no DB/datastore keys on any Phase 24 string. `portfolio-context.json` education object exists but is DEFERRED to Phase 25 (D-17). | None this phase |
| Live service config | None — no external service config references the changed copy. | None |
| OS-registered state | None. | None |
| Secrets/env vars | None — no env var names change. | None |
| Build artifacts | `dist/` is regenerated by `pnpm build`; `portfolio-context.json` is regenerated by `build:chat-context` from UNCHANGED inputs → byte-identical (see Pitfall 4). | Rebuild only; verify byte-identical json |

**Nothing found requiring migration.** The only "state" is the generated `portfolio-context.json`, which is intentionally frozen this phase (Phase 25 refreshes it).

## Code Examples

### `/about` education block render (page-scoped in `about.astro`, after the 4 paragraphs)
```astro
---
// Source pattern: src/pages/about.astro:1-6 + src/pages/experience.astro earlier-divider idiom
import { EDUCATION, CREDENTIALS } from "../data/education";
---
<div class="education">
  <span class="label-mono education-label">EDUCATION</span>
  <div class="education-rule" aria-hidden="true"></div>
  <p class="body education-degree">{EDUCATION.degree}</p>
  <p class="meta-mono education-org">{EDUCATION.institution} &middot; {EDUCATION.date}</p>
  <p class="meta-mono education-transfer">Transferred from {EDUCATION.transferredFrom}</p>
  {CREDENTIALS.map((c) => (
    <p class="meta-mono education-cred">{c.name}</p>
  ))}
</div>
```
- Reuse the `experience.astro:171-189` `earlier-divider` hairline-rule idiom for `.education-rule` (1px `var(--rule)`). Colors per UI-SPEC §Color: degree `--ink`, org `--ink-muted`, transfer `--ink-faint`. NO accent (non-interactive). frontend-design finalizes exact form (D-09/D-20).

### Home teaser render (page-scoped in `index.astro`, new section placed FIRST)
```astro
{/* Source: mirror of src/pages/experience.astro:46-69, trimmed (D-02/D-05) */}
<section class="section experience-teaser" aria-labelledby="section-experience">
  <Container>
    <SectionHeader number="01" title="EXPERIENCE" id="section-experience" />
    <article class="featured-teaser">
      <p class="meta-mono teaser-eyebrow">{holloway.data.role} &middot; {holloway.data.dateRange}</p>
      <h2 class="h2-project teaser-title">{holloway.data.company}</h2>
      <p class="lead teaser-summary">{holloway.data.summary}</p>
      <p class="body teaser-highlight">{holloway.data.highlights[0]}</p>
      <a class="label-mono experience-link" href="/experience">
        See the experience
        <span class="experience-arrow" aria-hidden="true">&rarr;</span>
      </a>
    </article>
  </Container>
</section>
```
- `holloway.data.highlights[0]` is the gate-scanned MDX metric ("Grew the test suite from 0 to ~1,400 passing checks, pinning all money and payroll math to the penny before refactoring it into shared modules" — `holloway.mdx:22`). If Jack prefers the trimmed UI-SPEC draft instead ("...pinning money and payroll math to the penny."), that string becomes page-scoped and is covered by Gate A (em-dash) — either is valid; reusing `highlights[0]` avoids drift.
- Same for `teaser-summary`: reusing `holloway.data.summary` keeps it inside gate-scanned MDX; a page-scoped one-liner (UI-SPEC draft) is covered by Gate A.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `alumniOf` as bare string | `alumniOf` as `CollegeOrUniversity` object (or `OrganizationRole` wrapper for dates) | schema.org current | Richer entity for knowledge-panel eligibility; use the object form |
| Credentials implied in prose | `hasCredential` → `EducationalOccupationalCredential` with `credentialCategory` + `recognizedBy` | schema.org 13.0+ | Google/structured-data consumers can parse the degree + cert distinctly |

**Deprecated/outdated:** none relevant. No library version churn this phase.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The `EducationalOccupationalCredential` `credentialCategory` values `"degree"` / `"certificate"` and `recognizedBy` shape are the current schema.org best practice | education.ts module / schema.org shape | LOW — schema.org is permissive; malformed values degrade rich-result eligibility, don't break the page. Confirm via Google Rich Results Test (human checkpoint). |
| A2 | `validFrom: "2026-05"` (ISO) is an acceptable date for a graduation credential | education.ts | LOW — cosmetic; can drop the field |
| A3 | Reusing `holloway.data.highlights[0]` verbatim reads acceptably as the single teaser metric (vs the trimmed draft) | teaser | LOW — Jack reviews copy; both options documented |
| A4 | Draft `ABOUT_P1`/`ABOUT_P3` word counts (≈57 / ≈41) stay ≤80 after Jack's edits | about.ts revision | MEDIUM — if Jack expands the copy past 80 words, `about-data.test.ts` goes RED; re-count before commit |

## Open Questions

1. **Teaser metric: reuse MDX `highlights[0]` verbatim, or the trimmed UI-SPEC draft?**
   - Known: both are em-dash-free and legible; `highlights[0]` is gate-scanned (no drift), the draft is punchier but page-scoped.
   - Recommendation: default to `holloway.data.highlights[0]`; let Jack swap to the draft at copy review. Either is covered by a gate.

2. **Represent the WGU degree in BOTH `alumniOf` and `hasCredential`?**
   - Known: schema.org allows a school in `alumniOf` and its degree in `hasCredential` simultaneously (the search-confirmed "Sarah Johnson" example does exactly this).
   - Recommendation: yes — WGU in `alumniOf` (attended) + WGU B.S. as a `hasCredential` degree; VT in `alumniOf` only (D-10 honesty).

3. **Does the OG card need an automated gate?**
   - Known: it is a folded todo with human/design content; `resume-asset.test.ts` shows an asset-existence gate pattern.
   - Recommendation: optional existence + dimension gate; the card's visual content is a human checkpoint, not automatable.

## Environment Availability

> All tooling is local project tooling already used by prior phases. No external services.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| pnpm | test/build scripts | ✓ (repo uses it phase-wide) | — | — |
| vitest | validation gates | ✓ | ^4.1.0 | — |
| @astrojs/check | `astro check` 0/0/0 | ✓ | ^0.9.8 | — |
| jsdom | built-HTML DOM parse gates | ✓ | ^29.0.1 (devDep) | — |
| Google Rich Results Test (external) | one-time JSON-LD schema.org validation | manual/online | — | Structural in-test shape assertion (Gate C) covers the automatable part; live validation is a human checkpoint |

**Missing dependencies:** none blocking. Live schema.org validation is external-only and is a human checkpoint, not a CI gate.

## Validation Architecture

> Nyquist validation is ENABLED (no `workflow.nyquist_validation: false` in config). This section is the PRIMARY research deliverable. It converts the D-18/D-19 manual guardrails into automated Vitest gates using the repo's exact existing patterns.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.0 (`vitest.config.ts`: `globals: true`, `environment: "node"`, `include: ["tests/**/*.test.ts"]`) |
| Config file | `vitest.config.ts` (node default; jsdom opted-in per file via `// @vitest-environment jsdom`) |
| Quick run command | `pnpm test` (= `vitest run`) — full suite is fast (623+ tests today per STATE) |
| Focused run | `pnpm exec vitest run tests/content/site-copy-em-dash.test.ts` (single new gate) |
| Typecheck gate | `pnpm exec astro check` → must stay 0/0/0 |
| Build (for render gates) | `pnpm build` → emits `dist/client/index.html`, `dist/client/about/index.html` (Cloudflare adapter path, verified `featured-tier-render.test.ts:25`) |

### Two observed test tiers (reuse both)
1. **Source-text invariant** (node env, `readFileSync`): scans `.astro`/`.ts` source for patterns. Examples: `motion-css-rules.test.ts`, `work-arrow-motion.test.ts:13-17`, `experience-voice-em-dash.test.ts`. Fast; no build.
2. **Built-HTML DOM parse** (`// @vitest-environment jsdom`, reads `dist/client/.../index.html`, `new DOMParser()`): asserts real rendered elements. Example: `featured-tier-render.test.ts:20-66`. Runs after `pnpm build`; degrades cleanly if `dist/` absent (`existsSync` guard).

### Phase Requirements → Test Map
| Req / Guardrail | Behavior to prove | Tier | Command / File | Exists? |
|-----------------|-------------------|------|----------------|---------|
| POS-01/02 (register) | No "junior"/"senior"/"5+ years" in `about.ts`, `about.astro`, `index.astro` copy | source-scan | Gate A (NEW `tests/content/site-copy-em-dash.test.ts`) | ❌ Wave 0 |
| D-18 (em-dash) | Zero `—` in `about.ts`, `education.ts`, `index.astro`, `about.astro` | source-scan | Gate A (same file) | ❌ Wave 0 |
| POS-02 (copy length) | `ABOUT_P1`/`P2`/`P3` ≤ 80 words; all four exports truthy | unit | `tests/client/about-data.test.ts:9-36` (EXISTING — will re-run against revised copy) | ✅ extend awareness |
| HOME-01 + D-01 | Home renders `§ 01 EXPERIENCE / 02 WORK / 03 ABOUT / 04 CONTACT` in order; teaser links to `/experience` | render (jsdom) | Gate B (NEW `tests/build/home-teaser-render.test.ts`) | ❌ Wave 0 |
| POS-04 (JSON-LD) | Rendered `ld+json` parses; `@type=Person`, `jobTitle`, `alumniOf` (WGU+VT), `hasCredential` (LPI + WGU degree) present | render (jsdom) + unit | Gate C (NEW) + Gate D (NEW unit on `education.ts` fragments) | ❌ Wave 0 |
| POS-03 (education module) | `education.ts` exports facts + fragments; VT NOT in `hasCredential` | unit | Gate D (NEW `tests/content/education-module.test.ts`) | ❌ Wave 0 |
| D-19 (chat-surface) | `BaseLayout.astro` + `global.css` unchanged; if changed, D-26 battery + SSE anchor green; `portfolio-context.json` byte-identical | source/regression | Gate E (git-diff assertion) + existing `sse-snapshot.test.ts` + `chat-context-integrity.test.ts` | partial ✅ / ❌ Gate E |
| D-19 (motion) | Teaser deep-link keeps reduced-motion contract | source-scan | Extend the `.see-all-work`-style assertion to the teaser link (Gate B or a source check mirroring `work-arrow-motion.test.ts`) | ❌ Wave 0 |
| QA (typecheck) | `astro check` 0/0/0 | typecheck | `pnpm exec astro check` (phase gate) | ✅ |

### Gate specifications (Wave 0 authoring targets)

**Gate A — `tests/content/site-copy-em-dash.test.ts` (source-scan; the D-18 automation).**
- Reads: `src/data/about.ts`, `src/data/education.ts`, `src/pages/index.astro`, `src/pages/about.astro`. (Add `src/components/ContactSection.astro` if the CONTACT literal is considered copy.)
- Assert per file: `(src.match(/—/g) ?? []).length === 0` (en dash `–` allowed). Mirror `experience-voice-em-dash.test.ts:23,78-80`.
- Register assertions on `about.ts` + `about.astro` post-phase: `/\bjunior\b/i` count 0, `/\bsenior\b/i` count 0, `/\b5\+\s*years\b/i` count 0 (D-07). Optional: extend the `voice-banlist.test.ts:15-30` BANLIST array against these files.
- This is the phase's headline Nyquist win — it closes the exact gap D-18 flags.

**Gate B — `tests/build/home-teaser-render.test.ts` (jsdom render gate).**
- `// @vitest-environment jsdom`; read `dist/client/index.html`; `existsSync` guard + "run `pnpm build` first" message (copy `featured-tier-render.test.ts:31-43`).
- Assert section-label sequence: `querySelectorAll` on the section-label spans (`.section-header .label-mono`, which covers both the `SectionHeader` primitive output and the `ContactSection` literal), map `textContent`, expect `["§ 01 · EXPERIENCE", "§ 02 · WORK", "§ 03 · ABOUT", "§ 04 · CONTACT"]` (normalize whitespace; the primitive renders `§ {number} · {title}` per `SectionHeader.astro`).
- Assert the teaser link: an `<a>` in the experience section with `href="/experience"` (NOT `/experience/holloway`, D-04) and containing the metric text substring `1,400`.

**Gate C — JSON-LD rendered-parse (jsdom; can live in Gate B's file or its own).**
- Read `dist/client/index.html`; select `script[type="application/ld+json"]`; `JSON.parse(textContent)` (the `<` escapes from `JsonLd.astro` are valid JSON — Pitfall 5).
- Assert: `obj["@type"] === "Person"`, `obj.jobTitle === "Software Engineer"`, `obj.alumniOf` names include `"Western Governors University"` + `"Virginia Tech"`, `obj.hasCredential` includes an entry named `"LPI Linux Essentials"`. Assert VT does NOT appear in `hasCredential` (D-10 honesty).
- schema.org *validity* beyond JSON.parse + shape is NOT fully automatable offline — assert structural shape here; run the Google Rich Results Test once as a `checkpoint:human-verify` (see Env Availability). Do not claim automated schema.org validation.

**Gate D — `tests/content/education-module.test.ts` (unit, node env).**
- Import from `../../src/data/education`; assert `EDUCATION.institution === "Western Governors University"`, `.date === "May 2026"`, `.transferredFrom === "Virginia Tech"`; `CREDENTIALS` contains `LPI Linux Essentials`.
- Assert `hasCredentialSchema` every entry `@type === "EducationalOccupationalCredential"` and NO entry's `recognizedBy.name` is `"Virginia Tech"` (VT is not a credential — D-10). Assert `alumniOfSchema` DOES include VT.
- Fast, build-free — the fragment-in-module design (Pattern 2) exists precisely to make this unit-testable.

**Gate E — `tests/build/chat-surface-untouched.test.ts` (D-19 tripwire; optional but recommended).**
- Source-text guard mirroring the repo's readFileSync idiom: assert `BaseLayout.astro` still contains its canonical anchors (e.g. `ogImage = "/og-default.png"`, the `<SEO` block, the pageswap handler) so an accidental structural edit is caught. This is a lightweight proxy; the authoritative D-19 fallback remains: if `BaseLayout.astro`/`global.css` change, run the existing D-26 chat battery + `sse-snapshot.test.ts` (D-15 byte-identical anchor, verified `sse-snapshot.test.ts:74-127`). Also confirm `chat-context-integrity.test.ts` + `chat-knowledge-voice.test.ts` stay green post-build (byte-identical `portfolio-context.json`, Pitfall 4).

### Sampling Rate
- **Per task commit:** `pnpm exec vitest run tests/content/site-copy-em-dash.test.ts tests/content/education-module.test.ts tests/client/about-data.test.ts` (fast source/unit gates — catch em-dash/register/word-count/module regressions immediately).
- **Per wave merge / after any page edit:** `pnpm build` then `pnpm test` (runs the jsdom render gates B/C against fresh `dist/`) + `pnpm exec astro check`.
- **Phase gate:** full `pnpm test` green (incl. the untouched D-26 chat battery + SSE snapshot), `astro check` 0/0/0, `pnpm build` succeeds, `git diff` shows no `BaseLayout.astro`/`global.css` change (or the D-19 fallback battery ran), `package.json` dependencies byte-identical, then `/gsd-verify-work` + the frontend-design 6-pillar sign-off (D-20) + Jack's copy review.

### Wave 0 Gaps
- [ ] `tests/content/site-copy-em-dash.test.ts` — Gate A (em-dash + register on unscanned files) — covers D-18, POS-01/02
- [ ] `tests/build/home-teaser-render.test.ts` — Gates B + C (section-number sequence + teaser link + JSON-LD parse) — covers HOME-01, D-01, POS-04
- [ ] `tests/content/education-module.test.ts` — Gate D (education module + schema fragments) — covers POS-03, POS-04
- [ ] (Optional) `tests/build/chat-surface-untouched.test.ts` — Gate E (D-19 tripwire)
- [ ] `src/data/education.ts` — the module itself must exist before Gate D can pass (Wave 0 RED until built)
- Framework install: none needed (vitest + jsdom present).

*Existing infra reused as-is: `about-data.test.ts` (word-count/truthy), `sse-snapshot.test.ts` (D-15), `chat-context-integrity.test.ts` + `chat-knowledge-voice.test.ts` (chat regression), the full D-26 battery.*

## Security Domain

> `security_enforcement` is not disabled in config. This phase adds no auth, no user input, no new data flow, and no runtime code — it edits static copy, one static teaser, static JSON-LD, and one image asset. STRIDE surface is effectively unchanged.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | Marginal | No user input on these surfaces; content is build-time only |
| V5.3 Output Encoding | Yes (already solved) | JSON-LD is serialized via `JsonLd.astro:9-14` which escapes `<`/`>`/`&`/U+2028/U+2029 — the education fields flow through this same XSS-safe path. Do NOT bypass `JsonLd.astro` with a hand-rolled `<script>`. |
| V6 Cryptography | No | n/a |
| V2/V3/V4 Auth/Session/Access | No | Static public pages |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Untrusted string breaking out of the `ld+json` `<script>` | Tampering/XSS | Already mitigated: all schema data routes through `JsonLd.astro`'s escaping. Education strings are author-controlled constants, but keep them flowing through `JsonLd.astro` regardless. |
| Chat-surface regression via shared layout edit | Tampering (invariant break) | D-19: keep edits out of `BaseLayout.astro`/`global.css`; Gate E + D-26 battery + SSE snapshot as the tripwire. |

## Sources

### Primary (HIGH confidence — read this session)
- `src/pages/index.astro` (lines 2-96, 98-141) — current Home structure, `personSchema:21-32`, section numbers `01`/`02`, `.see-all-work` idiom `114-129`
- `src/pages/experience.astro` (lines 1-234) — `.featured` treatment, `hasCaseStudy` find guard `16-37`, `.deep-link`/reduced-motion `141-233`
- `src/pages/about.astro` (1-27) — 4-paragraph render, `description=` prop with "junior" (line 8)
- `src/data/about.ts` (1-20) — copy source; "junior" at lines 8, 20; curly-quote/nbsp convention; zero em dashes
- `src/data/about-chat.ts` (1-32) — third-person chat variant (confirms `about.ts` is NOT a chat-context input)
- `src/components/JsonLd.astro` (1-17) — escaping serializer
- `src/components/ContactSection.astro` (26-31) — CONTACT header as a LITERAL `§ 03 · CONTACT`, not `SectionHeader`
- `src/components/primitives/SectionHeader.astro` — renders `§ {number} · {title}` + `.section-label`
- `src/content/experience/holloway.mdx` (1-31) — teaser fields; highlight #1 at line 22; dateRange en dash
- `src/lib/experience.ts` (12-18) — `sortExperienceEntries` (startDate desc)
- `src/content.config.ts` (25-43) — experience Zod schema
- `src/layouts/BaseLayout.astro` (20-87) — `ogImage` default, `<SEO>` per-page `description`
- `package.json` (9-55) — scripts + deps (no new deps)
- `vitest.config.ts` — node env, `tests/**/*.test.ts`
- Tests: `about-data.test.ts` (≤80-word cap), `voice-em-dash.test.ts` + `voice-banlist.test.ts` + `experience-voice-em-dash.test.ts` (MDX-only scan scope), `featured-tier-render.test.ts` (jsdom render-gate pattern), `sse-snapshot.test.ts` (D-15 anchor), `chat-knowledge-voice.test.ts` (chat regression reads generated json), `work-arrow-motion.test.ts` + `motion-css-rules.test.ts` (source-invariant reduced-motion pattern)

### Secondary (MEDIUM confidence — CITED)
- schema.org Person + `alumniOf` (`CollegeOrUniversity`) + `hasCredential` (`EducationalOccupationalCredential`) shape — [schema.org/EducationalOccupationalCredential](https://schema.org/EducationalOccupationalCredential), [schema.org/CollegeOrUniversity](https://schema.org/CollegeOrUniversity), [jsonld.com/person](https://jsonld.com/person/) (web search, confirmed the `credentialCategory`/`recognizedBy`/`validFrom` example shape)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — read `package.json`; no new deps by decision (D-19)
- Architecture / reuse patterns: HIGH — every reuse claim cites read source with line numbers
- Validation architecture: HIGH — gates modeled on existing, read test files; scan-scope gap verified directly
- schema.org shape: MEDIUM (CITED) — web-search-confirmed but not validated against a live Rich Results run (A1, human checkpoint)
- Pitfalls: HIGH — each grounded in a specific file:line

**Research date:** 2026-07-11
**Valid until:** 2026-08-10 (stable; copy/metadata phase, no fast-moving deps). schema.org shape stable indefinitely.
