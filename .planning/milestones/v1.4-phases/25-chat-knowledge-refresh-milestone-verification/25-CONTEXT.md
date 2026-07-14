# Phase 25: Chat Knowledge Refresh & Milestone Verification - Context

**Gathered:** 2026-07-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Two jobs, both scoped to the **chat knowledge layer + cross-cutting quality gates** — no site UI, no new features:

1. **Chat knowledge refresh (CHAT-10, CHAT-11).** Regenerate the build-time chat corpus (`src/data/portfolio-context.json`) so the widget's grounded knowledge includes the **Holloway engagement**, the **Balfour Beatty internship**, and **project #7 (Multi-Chain EVM trader)** — all in third person per the CHAT-06 voice split — and so the chat's identity/positioning matches the Phase 24 repositioned site.

2. **Milestone verification (QA-01, QA-02).** Run the v1.4 cross-cutting quality gates that Phase 25 owns: the D-26 chat-surface regression battery, the D-15 SSE byte-identical anchor, `astro check` 0/0/0, the zero-new-runtime-dependency lock, and the first-person leak guard — plus a live chat-answer UAT check. This is the **last phase of v1.4**.

**In scope:**
- Lift the `multi-chain-evm` exclusion in `scripts/build-chat-context.mjs` (the slug-skip **and** the defensive `MULTI-DEX` source regex) so #7 enters the corpus.
- Author a third-person `chatSummary` for `multi-chain-evm.mdx` (the only project missing one), engineering-invariants-framed, no returns claims.
- Teach the build script to read the `experience` collection and emit a **structured third-person experience block** (Holloway rich summary + Balfour one-liner), replacing the old about-derived one-liner `experience` string.
- Author third-person `chatSummary` content for `holloway.mdx` (rich summary + themes, ~150-220 words) and a one-liner for `balfour-beatty.mdx`.
- **Full positioning sync of `src/data/about-chat.ts`** to third-person-mirror the Phase 24 site copy (drop "junior"; new-grad with shipped production experience; currently solo contract engineer on Holloway + seeking a full-time SWE role).
- Wire the chat **education** object to the `src/data/education.ts` SSoT (WGU B.S. CS completed May 2026, Virginia Tech transfer, LPI Linux Essentials cert), replacing the stale `graduation: "2026"` object in `portfolio-context.static.json`.
- Refresh the stale `personal.summary` blurb in `portfolio-context.static.json` to the new-grad-with-production-experience framing.
- Light, honest refresh of the chat `skills` list to add genuinely-used tech (Deno, TanStack Query, Vitest, Ethers.js).
- Update `checkFirstPersonLeaks` + the TypeScript context interface to walk the new structured experience block.
- The verification gate pass (local gates + live chat UAT).

**Explicitly NOT in scope (deferred / out of scope):**
- **Production deploy + production-edge Lighthouse gate + `/gsd-complete-milestone`** → handled at `/gsd-ship` (D-11). Phase 25 verifies everything verifiable pre-deploy.
- **Any site UI / copy change** — Phase 24 finished the site surfaces; this phase touches only chat-consumed sources + the build script + verification.
- **Rewriting the existing 6 project case studies or the Holloway/#7 case-study bodies** — content is authored; this is chat ingestion + voice translation.
- **Reconciling the pre-existing curated skills list** (Java / Spring Boot / Next.js / FastAPI / Prisma / Stripe accuracy) — additive refresh only, not an audit of the existing entries.
- New runtime dependencies, new design system, chat-code changes to `chat.ts` / `api/chat.ts` (unless a gate forces it — see D-14).

</domain>

<decisions>
## Implementation Decisions

### Chat content — Holloway / #7 / Balfour
- **D-01: Holloway = rich summary + themes.** Author a third-person `chatSummary` on `holloway.mdx` (~150-220 words) carrying the headline (solo contract engineer on a live production operations platform) plus the ~5 strongest specifics condensed: test suite 0 → ~1,400 passing checks, cross-tenant RLS across all 47 entities (customer portal re-scoped server-side, 223 → 1 jobs), 91 wrongly-archived jobs recovered, idempotent geofenced payroll time-clock, data-access consolidation killing silent truncations + a React Query cache-key collision. Deep enough to answer "what did Jack do at Holloway" with real specifics without duplicating the full on-site case study. **Claude drafts, Jack reviews.**
- **D-02: #7 = engineering-invariants framing.** Author a third-person `chatSummary` on `multi-chain-evm.mdx` mirroring the case study's own discipline: the eight-stage token-safety pipeline (sell-simulation hard gate), pluggable per-chain MEV transport (Flashbots / bloXroute / public RPC), restart-safe volatility-adaptive exits persisted to SQLite (WAL), idempotent no-double-sell state machine. **Carry the explicit NO returns/profit claims** into chat (the MDX says "I deliberately make no claims about returns"). Keeps the chat honest + engineering-focused on a reputationally sensitive project. **Claude drafts, Jack reviews.**
- **D-03: Balfour = one-liner in the corpus.** Include the lightweight Balfour Beatty 2023 PM internship (role / company / dates + 1 line) so the chat can answer "what's Jack's full work history" honestly and completely. No case-study depth; tiny token cost. Balfour's `hasCaseStudy: false` + empty `techStack` must not break ingestion.
- **D-04: #7 gets the SAME full treatment as its 6 siblings** — `chatSummary` + the full below-fence `extendedReference` from `Projects/7 - MULTI-DEX CRYPTO TRADER.md` (fenced, 3,378 words below `<!-- CASE-STUDY-END -->`, within the 5,000-word cap → no truncation). No tighter per-item cap.

### Positioning sync (CHAT-11)
- **D-05: Full positioning sync of `src/data/about-chat.ts`.** Rewrite the third-person ABOUT_CHAT_* constants to mirror the Phase 24 site register: **drop "junior"** (currently "Jack is a junior software engineer"), present Jack as a new-grad software engineer with shipped production experience, and update the availability line (currently "looking for a junior or entry-level role") to match the Phase 24 About P3 — currently the solo contract engineer on Holloway Connect **and** looking for a full-time software engineering role on a team that values correctness/reliability/performance. Chat must stop contradicting the repositioned site. **Voice stays strictly third person** (leak guard, D-13). **Claude drafts, Jack reviews.**
- **D-06: Refresh the stale `personal.summary`** in `portfolio-context.static.json` ("Software engineer who builds real systems, not tutorials…") to the new-grad-with-production-experience framing, consistent with D-05. Keep `personal.title: "Software Engineer"`.

### Education wiring (POS-03 carry-over / Phase 24 D-11)
- **D-07: Wire chat education to the `src/data/education.ts` SSoT.** Replace the stale `education: { degree, school, graduation: "2026" }` object in `portfolio-context.static.json` with facts derived from `education.ts`: WGU B.S. Computer Science **completed May 2026**, **Virginia Tech transfer** (attended, never a credential — D-10 from Phase 24), and the **LPI Linux Essentials** certification. `education.ts` is TypeScript and the build script is plain `.mjs`; the planner/researcher decides the mechanism (regex-parse like `parseAboutExports`, or another dep-free path) — the DECISION here is that the chat education must be single-sourced from `education.ts`, include the cert + VT transfer, and never drift from the site.

### Skills
- **D-08: Light, honest skills refresh.** Add genuinely-used tech now backed by real work to the chat `skills` list: **Deno, TanStack Query, Vitest, Ethers.js** (the Holloway/#7 stacks). Honest, additive only — do not audit or prune the existing curated entries this phase (that's out of scope). The per-item `techStack` blocks already carry the full stacks; this just makes the top-level list current.

### Chat corpus structure
- **D-09: Replace the about-derived `experience` one-liner with a real structured experience block.** Today `merged.experience` is a string synthesized from `about-chat` intro+p1+p3 and contains nothing about Holloway. Drop it; build the `experience` field from the `experience` collection — Holloway (rich third-person `chatSummary`, D-01) + Balfour (one-liner, D-03) — leak-guarded. The `about` block already answers "who is Jack", so the synthesized line is now redundant/stale. **Planner finalizes the exact JSON shape** (array of roles vs. object), updates `checkFirstPersonLeaks` to walk the new structure, and updates the TypeScript context interface (`chat.ts` reads via `JSON.stringify(context)`, so serialization won't break — but the type must match).

### Token budget
- **D-10: Accept corpus growth; rely on existing thresholds.** Ingesting #7 (~4.5k tokens) + Holloway (~300) + Balfour (~50) lands the corpus around **~47-48k tokens**, up from ~42k — over the 40k INFO line but comfortably under the 60k WARN and 80k CAP. Keep the build's existing multi-threshold observability (INFO 40k / WARN 60k / CAP 80k); no new per-item cap. Revisit only if a future estimate crosses WARN. Corpus must stay ≥ the 4,096-token Haiku cache floor (it does, by a wide margin).

### Verification & ship boundary (QA-01, QA-02)
- **D-11: Local gates in Phase 25; production Lighthouse + milestone completion at `/gsd-ship`.** Phase 25 runs: `pnpm build`, the full test suite (incl. the D-26 chat-surface battery + the D-15 SSE byte-identical anchor + the chat-voice-split tests), `pnpm exec astro check` 0/0/0, the zero-new-runtime-dependency lock (QA-02), the `build:chat-context:check` drift gate, and the first-person leak guard. The **production-on-Cloudflare-edge canonical Lighthouse gate** (SC4) + `/gsd-complete-milestone` require the production deploy and run at ship — matching the v1.2/v1.3 canonical-gate precedent (localhost Lighthouse is a non-representative upstream artifact).
- **D-12: Chat-answer accuracy = automated guard + live UAT ask (CHAT-11 SC2).** Keep the build-time `checkFirstPersonLeaks` guard (automated, hard-fails on first-person leakage) AND do a live `/gsd-verify-work`-style ask against the running chat ("what did Jack do at Holloway?", "tell me about the Multi-Chain EVM trader") to confirm the widget answers accurately in third person before ship. A corpus-presence assertion test is a floor, not a substitute for the live ask.

### Cross-phase invariants (carried forward — do not re-litigate)
- **D-13: CHAT-06 voice split is LOCKED.** All chat-bound fields are third person; `checkFirstPersonLeaks` hard-fails the build (exit 2) on first-person leading clauses in `about.*`, `experience`, and `projects[].caseStudy`. Every new/edited string (about-chat, holloway/#7/balfour chatSummary, the new experience block) must pass the broadened leak regex. **The chat pipeline is exempt from the site-wide zero-em-dash ban** — en dashes are fine in chat copy; the site data/MDX em-dash gates do not scan chat sources.
- **D-14: Chat-surface gates (QA-01).** This phase should touch only `scripts/build-chat-context.mjs`, `src/data/*` (about-chat, static.json), `src/content/**/*.mdx` chatSummary frontmatter, and test files — **NOT** `BaseLayout.astro` / `global.css` / `chat.ts` / `api/chat.ts`. The corpus JSON is consumed by `api/chat.ts` as the cached system block; changing corpus content changes the cached prompt but not the SSE code, so D-15 SSE byte-identical should hold trivially. If any change does touch the four gated files (e.g. the TS interface lives in a gated file), run the full D-26 battery + D-15 anchor. `chat.ts` reads the context via `JSON.stringify` — confirm the TS interface location before assuming it's out of the gated set.

### Claude's Discretion (planner/researcher decides)
- Exact mechanism for reading `education.ts` from the `.mjs` build script (dep-free) — D-07.
- Exact JSON shape of the structured experience block (array vs. object) + the `checkFirstPersonLeaks` walk + the TS interface update — D-09.
- Whether Balfour needs a `chatSummary` frontmatter field or is emitted from `summary`/`highlights` — D-03 (the experience schema already has optional `chatSummary`).
- How to lift the #7 exclusion cleanly (remove the slug-skip + relax/scope the defensive `MULTI-DEX` regex without weakening it for genuinely-unwanted sources) — the researcher should map both hard-fail sites in `build-chat-context.mjs` (the line-449 slug-skip and the line-468 defensive regex).
- Final wording of all third-person copy (Holloway/#7/Balfour chatSummary, about-chat rewrite, personal.summary) — Claude drafts, **Jack reviews** as a human checkpoint (mirrors the Phase 24 copy-review pattern).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & scope
- `.planning/ROADMAP.md` — Phase 25 goal + Success Criteria SC1-SC4; v1.4 sequencing (25 is the terminal phase; depends on 22/23/24).
- `.planning/REQUIREMENTS.md` — CHAT-10, CHAT-11, QA-01, QA-02 (this phase); the Out-of-Scope table (no senior framing, no new runtime deps, no case-study rewrites).
- `.planning/STATE.md` Accumulated Context — v1.4 roadmap-level notes: voice split (CHAT-06), the #7 chat-exclusion-must-be-lifted note, the `checkFirstPersonLeaks` guard, D-26/D-15 chat-surface invariants.

### The build script (heart of this phase)
- `scripts/build-chat-context.mjs` — the chat corpus generator. Key sites: the **line-449 `multi-chain-evm` slug-skip** and the **line-468 defensive `MULTI-DEX` regex** (both D-04/D-15 exclusions to lift); `checkFirstPersonLeaks` (D-13, must be extended for the new experience block — D-09); `parseAboutChatExports` (reads `about-chat.ts`); the `experience` field synthesis at ~line 558 (to be replaced — D-09); the token thresholds (D-10); `--check` drift mode (CI gate). Currently reads only `src/content/projects/*.mdx` — must be extended to read `src/content/experience/*.mdx` (D-01/D-09).
- `scripts/sync-projects.mjs` — exports `readSourceField`, `sliceFrontmatter`, `wordCount` reused by the chat build; the fenced-block + path-escape patterns to mirror.

### Chat-consumed sources (what changes)
- `src/data/about-chat.ts` — third-person ABOUT_CHAT_* constants. **Full rewrite** (D-05); currently stale ("junior"). Voice rule + leak-regex token list documented in its header comment.
- `src/data/portfolio-context.static.json` — hand-curated identity: `personal.summary` (refresh, D-06), `education` (replace from `education.ts`, D-07), `skills` (additive refresh, D-08).
- `src/data/education.ts` — the education SSoT (Phase 24). `EDUCATION` object + `CREDENTIALS` array; voice-neutral facts. Chat education derives from here (D-07); the schema fragments (`alumniOfSchema`/`hasCredentialSchema`) are site-only.
- `src/data/about.ts` — the first-person site copy (Phase 24, already updated). **Read-only reference** for the register to third-person-mirror in `about-chat.ts` (D-05). Note ABOUT_P2 was removed in Phase 24 24-UAT (commit c1c2022).
- `src/data/portfolio-context.json` — the generated output (do not hand-edit; regenerated by the build).

### Content collections (what gets ingested)
- `src/content/experience/holloway.mdx` — author the rich third-person `chatSummary` here (D-01); source of the highlights to condense. First-person `summary`/`highlights`/body stay for the site.
- `src/content/experience/balfour-beatty.mdx` — the one-liner source (D-03); `hasCaseStudy: false`, `techStack: []`.
- `src/content/projects/multi-chain-evm.mdx` — author #7's third-person `chatSummary` here (D-02); the ONLY project without one. `source: "Projects/7 - MULTI-DEX CRYPTO TRADER.md"` (matches the defensive regex — D-04).
- `Projects/7 - MULTI-DEX CRYPTO TRADER.md` — #7's below-fence extended reference (fenced, 3,378 words — D-04).
- `src/content.config.ts` — schemas. The `experience` schema **already has `chatSummary: z.string().optional()`** (line 40, "content deferred to Phase 25"). The `projects` schema does NOT type `chatSummary` (read via `readStringField`, not Zod) — no schema change needed for #7's chatSummary.

### Voice-split regression history
- `.planning/debug/chat-voice-split-regression.md` — the UAT Gap #1 regression the voice split + leak guard close; the canonical first-person leak regex is triplicated across the build script + two test files (keep byte-identical).

### Quality gates & tests
- `tests/build/chat-knowledge-voice.test.ts` — B1 self-test + artifact sweep (leak regex).
- `tests/api/chat-voice-split.test.ts` — live system-block tripwire.
- The D-26 chat-surface regression battery + the D-15 SSE byte-identical anchor tests (milestone gate, D-14).
- Prior-phase context for lineage: `.planning/phases/24-positioning-shift-home-teaser/24-CONTEXT.md` (the SITE positioning + education.ts creation + D-17 "Phase 25 owns chat"), `.planning/phases/23-projects-reconciliation-featured-tier/23-CONTEXT.md` (the D-15 chat-skip re-plumb that Phase 25 lifts).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`build-chat-context.mjs` per-project pipeline** (`buildProjectBlock`, `sliceReadmeBelowFence`, `truncateReadme`, `readStringField`/`readArrayField`): #7 flows through the existing pipeline once the exclusion is lifted and its `chatSummary` exists — minimal new code for the #7 path.
- **`parseAboutChatExports`**: the regex-parse pattern for `about-chat.ts`; a parallel `parseEducation`-style helper can read `education.ts` dep-free (D-07).
- **`checkFirstPersonLeaks` + the broadened first-person regex**: the guard already scans `about.*`, `experience`, `projects[].caseStudy`; extend the `experience` target to walk the new structured block (D-09/D-13).
- **The multi-threshold token observability** (INFO/WARN/CAP + per-project breakdown): already prints the growth; D-10 relies on it as-is.

### Established Patterns
- **Voice split (CHAT-06):** site = first person (`about.ts`, MDX bodies), chat = third person (`about-chat.ts`, MDX `chatSummary`). The build hard-fails on first-person leakage (D-13).
- **Fenced-source ingestion:** `<!-- CASE-STUDY-END -->` separates the site case study (above) from the chat extended reference (below); `sliceReadmeBelowFence` throws (exit 2) on a missing/duplicate fence. #7's fence is present (D-04).
- **SSoT data modules:** `education.ts` (facts) and `about.ts`/`about-chat.ts` (copy) centralize content; the chat build reads them so there's one source per fact (D-05/D-07).
- **Exclusion via explicit slug-skip + defensive regex:** #7 is blocked at two sites (D-04); both must be lifted together, and the regex should be scoped (not deleted) so it still guards against genuinely-unwanted `Projects/7` re-adds by other paths.

### Integration Points
- `scripts/build-chat-context.mjs` — the central change: lift #7 exclusion, read the experience collection, restructure the `experience` field, extend the leak guard, wire education from `education.ts`.
- `src/content/{experience,projects}/*.mdx` — new/edited `chatSummary` frontmatter (Holloway, #7, optionally Balfour).
- `src/data/about-chat.ts` + `portfolio-context.static.json` — positioning + identity + education + skills copy.
- `src/data/portfolio-context.json` — regenerated artifact; the `build:chat-context:check` CI drift gate must pass.
- The chat context TypeScript interface (confirm its file location for the D-14 gated-file check) — extend for the structured experience block.
- `api/chat.ts` — consumes the corpus as the cached system block; **no code change expected** (D-14), but the D-26/D-15 gates confirm it.

</code_context>

<specifics>
## Specific Ideas

- **Holloway chat depth (user-chosen):** rich summary + themes — ~5 strongest specifics (0→~1,400 tests, RLS 223→1 across 47 entities, 91-job recovery, idempotent payroll clock, data-access consolidation), ~150-220 words. Not the full 9-highlight ledger, not a tight blurb.
- **#7 chat framing (user-chosen):** engineering-invariants framing carrying the explicit no-returns-claims discipline from the case study.
- **Balfour (user-chosen):** include as a one-liner for a complete, honest work-history answer.
- **Positioning (user-chosen):** full sync — drop "junior" from `about-chat.ts`, mirror the Phase 24 new-grad-with-production-experience register + the "contracting on Holloway AND seeking full-time SWE" availability line, refresh `personal.summary`.
- **Education (user-chosen):** single-source from `education.ts` including the LPI cert + VT transfer; kill the stale `graduation: "2026"`.
- **Skills (user-chosen):** light, honest additive refresh (Deno, TanStack Query, Vitest, Ethers.js); no audit of existing entries.
- **Experience field (user-chosen):** replace the about-derived one-liner with a real structured experience block.
- **Token posture (user-chosen):** accept growth (~47-48k tokens), rely on existing thresholds; #7 gets full sibling treatment.
- **Verification (user-chosen):** local gates in-phase; production Lighthouse + milestone completion at `/gsd-ship`; chat accuracy via automated guard + a live UAT ask.
- **Copy review (pattern):** Claude drafts all third-person copy; Jack reviews as a human checkpoint (mirrors the Phase 24 copy-review sign-off).

</specifics>

<deferred>
## Deferred Ideas

- **Production-edge Lighthouse gate + `/gsd-complete-milestone`** → `/gsd-ship` (D-11), not this phase.
- **Auditing/pruning the pre-existing curated chat skills list** (accuracy of Java / Spring Boot / Next.js / FastAPI / Prisma / Stripe) → out of scope; a standalone cleanup if ever wanted (D-08 is additive only).
- **Per-project/per-page OG images** → not this milestone (noted in Phase 24 deferred).

### Reviewed Todos (not folded)
The four keyword-matched todos are the same recurring false positives Phases 23-24 reviewed and declined — none touch the chat knowledge base or the milestone gates:
- *"Design and ship a real og-default.png"* (`2026-04-15-design-and-ship-og-default-image.md`) — **already shipped in Phase 24 (24-04)**; stale todo.
- *"Change mobile menu breakpoint 380px→768px"* (`2026-04-15-change-mobile-menu-breakpoint-from-380px-to-768px.md`) — orthogonal nav-behavior change; standalone `/gsd-quick`.
- *"Chat cache-hit-rate observability"* (`2026-04-23-chat-cache-hit-rate-observability.md`) — chat instrumentation, not the knowledge base; v1.3+ deferred.
- *"Configure CHAT_RATE_LIMITER Cloudflare binding"* (`2026-04-23-configure-chat-rate-limiter-binding.md`) — infra/security; unrelated to chat knowledge.

</deferred>

---

*Phase: 25-chat-knowledge-refresh-milestone-verification*
*Context gathered: 2026-07-14*
