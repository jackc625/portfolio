---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Polish
status: executing
stopped_at: Phase 13 Plan 06 complete — SolSniper (899 words) and Optimize AI (900 words) case studies authored in source fenced blocks, synced into MDX bodies in 5-H2 D-01 shape; 2 additional shape-test cases flipped RED → GREEN (cumulative 4 of 6 case studies shipped); voice judgment calls flagged for Jack's review before Plan 07
last_updated: "2026-04-19T14:30:00.000Z"
last_activity: 2026-04-19 -- Phase 13 Plan 06 complete (case studies batch B: SolSniper + Optimize AI, 2 atomic commits, 2 tests RED→GREEN, full suite 147/149)
progress:
  total_phases: 5
  completed_phases: 1
  total_plans: 15
  completed_plans: 12
  percent: 80
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-15)

**Core value:** Recruiters and hiring managers who visit this site should immediately see Jack as someone worth interviewing
**Current focus:** Phase 13 — content-pass-projects-sync

## Current Position

Phase: 13 (content-pass-projects-sync) — EXECUTING
Plan: 6 of 9 complete
Status: Wave 4 batch B complete (13-06 SolSniper + Optimize AI case studies landed, 899 + 900 words, both in 5-H2 D-01 shape, 2 more shape tests flipped RED → GREEN for a cumulative 4 of 6 case studies shipped). Only 13-07 (Clipify + Daytrade body) remains to close the final 2 case studies. Jack should review Voice Judgment Calls in 13-05-SUMMARY.md and 13-06-SUMMARY.md before Plan 07 runs.
Last activity: 2026-04-19 -- Phase 13 Plan 06 complete
Branch: main

Progress: [██████░░░░] 66% (6 / 9 plans)

## Performance Metrics

**Velocity (cumulative through v1.1):**

- Total plans completed: 55 (v1.0: 27 + v1.1: 27 + Phase 7: 5 — counted per SUMMARY.md history)
- Total execution time: ~100 minutes tracked across v1.0; v1.1 added ~150 commits over 9 days

**v1.2 baseline:**

- Starting source LOC: ~3,859 (src/)
- Starting Lighthouse: Performance 100 / A11y 95 / BP 100 / SEO 100
- Target Lighthouse gate: Performance ≥99 / A11y ≥95 / BP 100 / SEO 100 (every phase)

*Full per-phase timing retained in milestones/v1.1-STATE.md archive.*

## Accumulated Context

### Decisions

All decisions logged in PROJECT.md Key Decisions table.

**Phase 13 decisions (Plan 06):**

- [Phase 13-06]: Used first-person past tense consistently across SolSniper and Optimize AI ("I architected", "I wanted", "I chose", "I built") — matching Plan 05's voice choice. D-09 site voice is first person; the chat widget is the third-person surface (CHAT-06). This stays in lockstep with 13-05 while Voice Judgment Call #6 from that SUMMARY remains open for Jack's review.
- [Phase 13-06]: SolSniper body required 11 surgical trim passes (1115 → 1043 → 993 → 960 → 953 → 934 → 928 → 912 → 905 → 903 → 899) to land inside 600-900 band. Every trim preserved named systems and quantified numbers; compression was prose-level only. No structural content removed (all 8 safety checks, 3 tiers, 6 sell-ladder steps, Token-2022 balance lesson, and structuredClone rollback lesson retained). Source README is exceptionally dense — 310 lines of technical detail — which explains the overshoot.
- [Phase 13-06]: Optimize AI body required 15 surgical trim passes (1083 → 1035 → 995 → 974 → 964 → 957 → 949 → 933 → 928 → 919 → 907 → 902 → 901 → 900). Landed exactly at 900 (band ceiling). All 9 RLS-enforced tables enumerated by name; Mifflin-St Jeor pipeline retained with concrete numbers (+5/−161 offsets, 1.2×/1.55×/1.9× multipliers, −400/+250/0 goal offsets); streak-bug learning + child-table-RLS learning both preserved.
- [Phase 13-06]: SolSniper Outcome dropped a full detail-listing of Vitest file counts by subsystem (ten safety + nine execution + etc.) that was in the first draft, in favor of a compressed list. Retained the "thirty-nine `.test.ts` files" headline number and the Nyquist-validation pattern callout (HTTP 409 on concurrent force-sell). Flagged in SUMMARY voice judgment calls.
- [Phase 13-06]: Optimize AI Outcome dropped "five fitness domains (workouts, nutrition, habits, weight, profile)" list from the test-coverage paragraph (kept it in the opening sentence). Dropped "canvas-confetti on habit completion" mention to save words — the source README flags it twice as a feature, so flagged in SUMMARY.
- [Phase 13-06]: SolSniper architecture paragraph enumerated 8 subsystems (Config, Detection, Safety, Execution, Position, Persistence, Recovery, Dashboard) in the exact order `src/index.ts` initializes them per README line 33 (`Order: Config → Detection → Safety → Execution → Position → Persistence → Recovery → Dashboard → Monitoring`). Dropped "Monitoring" from the enumeration during trim (it would have made nine, not eight); the source README lists it as subordinate to Dashboard so this is technically accurate but flagged for Jack's verification.
- [Phase 13-06]: Optimize AI "cookie-bridge pattern" phrasing is drawn from README §"Authentication & Session Management" ("Middleware-protected dashboard routes via cookie bridge pattern") — matches source. The `startsWith("/") && !startsWith("//")` open-redirect check is quoted verbatim from README §"Security & Production Considerations" line 191. Both passes are 1:1 source traceable.
- [Phase 13-06]: S6 sync idempotency verified after both tasks: `pnpm sync:projects` reports both slugs as `unchanged` on re-run. Frontmatter byte-preserved on both MDX (verified by diff scope). `pnpm check` clean. Full suite: 22/23 files GREEN, 147/149 tests GREEN (+2 vs Plan 05).

**Phase 13 decisions (Plan 05):**

- [Phase 13-05]: Used first-person past tense ("I built", "I wanted", "I trained", "I accepted") throughout both case studies, matching VOICE-GUIDE.md D-09 + D-11 Rule 3 + the canonical post-rewrite seatwatch.mdx exemplar. The executor prompt mentioned "third-person, past tense" as a voice rule but VOICE-GUIDE.md, D-09, D-11, the existing seatwatch.mdx exemplar, and the test acceptance criteria all mandate FIRST person for MDX case studies (chat widget is the third-person surface per CHAT-06, Phase 14). Plan contract wins — flagged explicitly in SUMMARY Voice Judgment Calls #6 so Jack can override before Plans 06/07.
- [Phase 13-05]: NFL Prediction body initially drafted at 921 words (over 900 band). Two surgical trim passes landed at 898: (a) Problem paragraph compressed from 175 → ~155 by tightening the two-hazard framing; (b) Outcome removed the literal artifact hashes (wp_20260327_114739, ats_20260326_163724, ou_20260326_163930, blend_20260324_023118) because they consumed 24 words on specificity readers cannot act on. Zero structural content loss, all named systems and quantified claims preserved. D-16 is soft warning only; the plan's success criteria still wanted in-band compliance, which is why the trim was pursued.
- [Phase 13-05]: SeatWatch Outcome uses 64,400 lines / 419 files (from current SEATWATCH.md Codebase Metrics table) instead of the pre-rewrite MDX's 48,000 lines / 329 files. The README is the authoritative source per D-12; Jack should confirm the 64,400 figure reflects his current project state (flagged in SUMMARY Voice Judgment Calls #2).
- [Phase 13-05]: Relabeled SeatWatch's existing `## Architecture` to `## Architecture (FULL TECHNICAL REFERENCE)` per RESEARCH §2 disambiguation so the case-study `## Approach & Architecture` H2 does not collide inside the same file. NFL_PREDICT.md kept its existing `## Overview` heading unchanged since it does not collide with any D-01 heading.
- [Phase 13-05]: Flagged 6 voice judgment calls in SUMMARY for Jack's review: (1) SeatWatch "roughly 5× clock-time variance" Poisson qualifier is my inference not source quote; (2) 48K → 64,400 LOC update needs his verification; (3) "yet to produce a double-book in production" claim lacks measurement window; (4) NFL market-edge framing compressed to 1 sentence (room to re-expand ~40 words in Problem); (5) "UIAP-01 is the architectural lesson I am most proud of" is editorial elevation not source quote; (6) first-person voice choice (vs executor-prompt third-person framing) — all six documented with actionable redline suggestions.
- [Phase 13-05]: Fence placement in NFL_PREDICT.md went AFTER the v1.0 ship-date paragraph and BEFORE the `---` horizontal rule that introduces `## Overview`. Ensures fence is above the large ASCII-art architecture diagram (which lives in a triple-backtick code fence) per Pitfall 3 (fence must precede any code fence). SeatWatch fence went between intro paragraphs and the existing (relabeled) `## Architecture` section — same rule.

**Phase 13 decisions (Plan 04):**

- [Phase 13-04]: daytrade.mdx description kept byte-identical to the pre-rename "Crypto Breakout Trader" value. DAYTRADE.md confirms every phrase in the existing description is a real feature; DAYTRADE.md additionally describes a walk-forward validation / promotion-gate dimension, but that is case-study body content (Plan 07 scope), not structural frontmatter. Byte-preservation also satisfies D-26 lockstep trivially — daytrade.mdx description and portfolio-context.json description stayed byte-identical across the rename.
- [Phase 13-04]: `source:` field placed as the LAST frontmatter line before closing `---` in all 6 MDX for consistency. Zod is order-agnostic, but one consistent placement minimizes future diff noise. For seatwatch.mdx this meant source: AFTER demoUrl:; for the other 5 it meant source: AFTER year:.
- [Phase 13-04]: portfolio-context.json diff is exactly 2+2 (only `name` and `page` changed; description and tech preserved byte-for-byte). This is the minimum diff satisfying D-26 chat-context lockstep — the chat system prompt serialization stays deterministic across the rename.
- [Phase 13-04]: about.ts D-18 annotations use the actual execute-time date (2026-04-19 from `date +%Y-%m-%d`), NOT the planning date (2026-04-16). Per D-18, "git blame on the annotation is the durable evidence" — the timestamp must reflect when verification happened, not when the plan was authored.
- [Phase 13-04]: D-26 early-warning chat smoke check DEFERRED to Plan 09 per plan text authorization. The plan's Task 3 `<action>` block contains an embedded `checkpoint:human-verify` sub-step, but the plan text itself labels the smoke advisory-only and names Plan 09 Task 1 as the authoritative D-26 gate. Subagent cannot drive the manual browser smoke; Plan 09 orchestrator runs the full Phase 7 chat regression battery.
- [Phase 13-04]: git mv rename recorded at 99% similarity (`rename src/content/projects/{crypto-breakout-trader.mdx => daytrade.mdx} (99%)`). Git's rename detection survived the post-move frontmatter edit (2 lines changed out of 46); git blame on the body still resolves to the original authoring commits.

**Phase 13 decisions (Plan 03):**

- [Phase 13-03]: docs/CONTENT-SCHEMA.md Section 1 heading stripped parenthetical "(Zod)" from the RESEARCH.md skeleton to match the plan's acceptance-criteria grep exactly (`^## 1\. Frontmatter Schema`). Test regex matches either form; kept the minimal form to avoid future regex drift.
- [Phase 13-03]: docs/CONTENT-SCHEMA.md Section 2 received one additive clarification not in the RESEARCH.md skeleton — a 4-bullet "Fence conventions:" subsection enumerating the literal-HTML-comment, each-once, before-any-code-fence, and start-before-end invariants explicitly. Rule 2 (missing critical documentation functionality). The sync script enforces these, but a reader landing on Section 2 without reading sync-projects.mjs previously had no paper trail.
- [Phase 13-03]: docs/VOICE-GUIDE.md includes two references to seatwatch.mdx — the RESEARCH.md skeleton's "canonical example" line plus the plan-mandated "See src/content/projects/seatwatch.mdx — its 5 H2s..." cross-reference after the Engineering-Journal bullets. Both match /seatwatch\\.mdx/; test is satisfied either way; keeping both because they answer different questions (which file vs. what to study in it).
- [Phase 13-03]: Resume PDF external-source location (D-19) kept abstract in CONTENT-SCHEMA.md per T-13-DOC-01 disposition ("executor instructed not to invent a URL"). Current wording: "Jack maintains the actual source separately (Google Doc / LaTeX template)." Jack can fill in the real URL during execution of a later plan if a paper trail inside the repo becomes useful.
- [Phase 13-03]: ROADMAP amendment diff is exactly 1+1 (one deletion, one insertion), no collateral whitespace or punctuation drift. Used Edit tool with the OLD string copied from the file's current bytes (preserving en-dash "–" in "600–900" and em-dash " — " at end of line) rather than retyping Unicode by hand.

**Phase 13 decisions (Plan 02):**

- [Phase 13-02]: `extractFence(sourceContent, sourceLabel?)` — made `sourceLabel` optional to satisfy Plan 01 tests that call `extractFence(src)` with one argument. Label (when present, as in `syncOne`) prefixes error messages; when absent, errors read `missing <!-- CASE-STUDY-START -->` directly. Handler preserves both call sites without branching.
- [Phase 13-02]: CLI guard uses `process.argv[1] === fileURLToPath(import.meta.url)` so the test file can `import` helpers without triggering `main()` (which would hit the real `src/content/projects/*.mdx` and blow up on missing `source:`). Module-entry detection is the standard Node 22 pattern.
- [Phase 13-02]: Current repo is intentionally RED on `pnpm check` AND `pnpm sync:check` after this plan — both reject all 6 existing MDX files for missing `source:` frontmatter. This is the correct contract boundary; Plan 13-04 closes it by adding 6 `source:` fields (5 existing + 1 new daytrade).
- [Phase 13-02]: GitHub Actions workflow pinned to `pull_request` (not `pull_request_target`) — T-13-03 mitigation so untrusted PR fork code cannot abuse repo secrets. All action versions locked to `@v4`; pnpm 10; node 22; `--frozen-lockfile` preserves S8 (zero-new-deps gate).
- [Phase 13-02]: `.gitattributes` created with `* text=auto eol=lf` for the entire repo — not just the sync script's target files. Rationale: the sync script uses `normalize()` (S2) on every read, but other content (tests, scripts, content) would still churn if authored CRLF on Windows. One line for repo-wide hygiene.

**v1.2 roadmap decisions:**

- [Roadmap v1.2]: 5-phase shape adopted (Tech Debt → Content → Chat Knowledge → Analytics → Motion) — all 4 research agents converged on this ordering. Tech debt first because every subsequent phase touches debt files; motion last because it layers on a stable base
- [Roadmap v1.2]: Content (Phase 13) must precede Chat (Phase 14) — chat's build-time context generation pulls real MDX content. Wrong order would bake placeholder prose into the cached system prompt
- [Roadmap v1.2]: Analytics (Phase 15) ships before Motion (Phase 16) so Phase 16's engagement impact is measurable against a real-content baseline
- [Roadmap v1.2]: Zero new runtime dependencies is the preferred path — native 2026 platform (`@starting-style`, cross-document `@view-transition`, `inert`, IntersectionObserver) covers every motion need; Anthropic prompt caching + context stuffing beats RAG for ~10–20k token corpus
- [Roadmap v1.2]: D-26 Chat Regression Gate elevated to milestone-level cross-phase constraint — applies to Phase 12 (DEBT-02, DEBT-04), Phase 14 (all CHAT-0x), Phase 15 (ANAL-01, ANAL-03), Phase 16 (MOTN-04, MOTN-05, MOTN-06)
- [Roadmap v1.2]: Lighthouse CI gate applied to every phase (homepage + one project detail) — Performance ≥99 / A11y ≥95 / BP 100 / SEO 100 / TBT ≤150ms / CLS ≤0.01
- [Roadmap v1.2]: MASTER.md amendments in Phase 16 are additive only — §5/§6 carve-outs for motion property whitelist, duration bands, easing defaults; §8 anti-pattern list stays intact (GSAP and `<ClientRouter />` remain prohibited)

**Carry-over from v1.1 (relevant to v1.2 execution):**

- [Phase 11]: Lighthouse Performance 100 / A11y 95 / BP 100 / SEO 100 is the v1.2 starting baseline — every phase ends with a re-run
- [Phase 07]: 15+ load-bearing invariants on chat.ts + api/chat.ts (async:false marked, exact-origin CORS, DOMPurify strict, 30s AbortController, 5/60s rate limit, focus-trap re-query, dual idempotency) — Phase 7 regression battery gates any phase that touches those files
- [Phase 10]: localStorage chat persistence (50-msg cap, 24h TTL) replaced `transition:persist` — reintroducing `<ClientRouter />` would break it
- [Phase 12-tech-debt-sweep]: 12-01: Chose DELETE path for wrangler.jsonc rate_limits block (D-05 default) — activating a new Cloudflare rate-limiter binding would double-count against app-layer limiter without explicit authorization
- [Phase 12-tech-debt-sweep]: 12-01: Container.astro refactor used PATTERNS.md Option B (typed destructure) over Option A (inline cast)
- [Phase 12-tech-debt-sweep]: 12-02: Single .chat-widget selector covers both bubble-only and panel-open states for inert (Claude's-discretion resolution per CONTEXT.md D-12); handleKeyDown preserved byte-for-byte per D-10 belt-and-suspenders for Safari <15.5 / Firefox <112
- [Phase 12-tech-debt-sweep]: 12-03: createCopyButton(getContent: () => string) — closure over callback (not captured string) so live-stream can read final botContent at click-time; keeps chat.ts:817-827 cloneNode idempotency guard byte-identical and additive.
- [Phase 12-tech-debt-sweep]: 12-03: jsdom in vitest env does not round-trip style.cssText via setter — canonical-markup test uses toBeInstanceOf + outerHTML parity instead; real-browser inline style verified in D-26 manual smoke.
- [Phase 12-tech-debt-sweep]: 12-04: Curl-captured string evidence is sufficient to close DEBT-03; Task 2 human eyeball + Facebook Sharing Debugger deferred to phase-end consolidated review (same pattern as 12-03)
- [Phase 12-tech-debt-sweep]: 12-05: §2.4 inserted after §2.3 with two | Property | Value | entries; no inline CSS comments at usage sites (D-15)
- [Phase 12-tech-debt-sweep]: 12-06: WR-04 added to body-prose bullet list (was frontmatter-only) so all 7 carried items are grep-resolvable in audit body; frontmatter keys preserved byte-for-byte per PATTERNS.md
- [Phase 12-tech-debt-sweep]: 12-06: 'Phase 12 Close-out' summary paragraph uses plain closed/accepted prose (no bold markers) so phrase-count acceptance criteria target only the per-bullet annotations

### Pending Todos

None tracked at roadmap creation. Capture via `/gsd-add-todo` during execution.

### Blockers/Concerns

**Open questions for Jack (flagged in research/SUMMARY.md, not gates):**

1. Analytics budget: Umami Cloud free (chosen per ANAL-01) vs Plausible $9/mo — accepted as Umami per REQUIREMENTS.md
2. DEBT-05 `--ink-faint` contrast: documented trade-off path chosen (not darken) per requirement wording
3. CONT-06 `sync-projects.mjs`: confirmed build in this milestone
4. Chat persona voice: third-person default ("Jack built this...") confirmed for CHAT-06
5. Scope cap: ship 80% of Phase 16 Motion acceptable if Lighthouse gate would otherwise break

### Roadmap Evolution

- v1.2 milestone added: Polish (Phases 12-16)

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Chat | RAG / vector DB | Deferred to v1.3+ (corpus too small) | v1.2 planning |
| Chat | Function-calling chat tools | Deferred to v1.3+ (SSE complexity) | v1.2 planning |
| Chat | Keyword routing | Deferred (only if $/mo > $5) | v1.2 planning |
| Motion | Signature hero moment | User-excluded for v1.2 | v1.2 planning |
| Motion | Project → project view-transition-name morph | Deferred to v1.3+ | v1.2 planning |
| Phase 12-tech-debt-sweep P01-build-warnings-sweep | 8min | 6 tasks | 6 files |
| Phase 12-tech-debt-sweep P02-mobilemenu-chatwidget-inert | 6min | 2 tasks | 2 files |
| Phase 12-tech-debt-sweep P03-chat-copy-button-parity | 8min | 3 tasks | 4 files |
| Phase 12-tech-debt-sweep P04-og-url-production-verify | 3min | 2 tasks | 1 files |
| Phase 12-tech-debt-sweep P05 | 5min | 1 tasks | 1 files |
| Phase 12-tech-debt-sweep P06 | 15 minutes | 2 tasks | 1 files |

## Session Continuity

Last session: 2026-04-19T14:30:00.000Z
Stopped at: Phase 13 Plan 06 complete — SolSniper (899 words, commit bd1db92) and Optimize AI (900 words, commit 00c6406) case studies authored from scratch in each source file's fenced block, then synced into the MDX bodies. Both bodies in 5-H2 D-01 shape, zero D-11 banlist words, first-person past tense, named systems cited, quantified numbers pulled from source READMEs. `pnpm check` 0 errors; `pnpm sync:projects` reports all 4 completed slugs (seatwatch/nfl-predict/solsniper/optimize-ai) `unchanged` on re-run (S6 idempotency verified); frontmatter byte-preserved on both MDX. case-studies-shape.test.ts flipped 2 more slugs RED → GREEN (solsniper, optimize-ai); cumulative 4 of 6. Full suite: 22/23 files GREEN, 147/149 tests GREEN (+2 vs Plan 05). Remaining 2 RED slugs (clipify, daytrade) are Plan 07's scope. Voice judgment calls flagged in 13-06-SUMMARY.md for Jack's review before Plan 07 runs.
Resume file: .planning/phases/13-content-pass-projects-sync/13-07-case-studies-batch-c-PLAN.md
