# Phase 14: Chat Knowledge Upgrade - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in 14-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-19
**Phase:** 14-chat-knowledge-upgrade
**Areas discussed:** Knowledge depth, Static/generated split, Persona + refusal posture, Injection test battery, Generated file git-tracking, D-26 regression verification, max_tokens response length, Build script error behavior

---

## Knowledge depth

### Q1 — What goes into the generated knowledge block?

| Option | Description | Selected |
|--------|-------------|----------|
| MDX-only (lean) | Just 5-H2 case-study bodies. ~5.4k words. Smallest cache block, fastest reads, matches Phase 13's single-audience principle. Gap: deep technical questions get generic answers. | |
| MDX + Projects README (deep) | Case studies AND full technical READMEs below the fence. ~35k words. Cache block ~7x larger. Chat can answer concrete architectural questions. Risk: more surface for hallucination. | ✓ |
| MDX + curated extended | Case studies + hand-curated 2–3 paragraph "extended notes" per project. ~10–12k words. Preserves human-authored discipline; keeps cache block manageable. | |

**User's choice:** MDX + Projects README (deep).
**Notes:** User confirmed cost was not a driver; depth of technical answering was the priority.

### Q2 — How is the knowledge block structured internally?

| Option | Description | Selected |
|--------|-------------|----------|
| Per-project blocks | Case-study + "Extended technical reference" grouped per project. SeatWatch content lives together, then NFL_PREDICT, etc. | ✓ |
| Two flat layers | All 6 case studies concatenated, then all 6 READMEs concatenated. Mirrors Phase 13 fenced / below-fence separation one-to-one. | |
| Per-project + shared sections | Per-project blocks plus a site-wide "About / Skills / Contact" section authored separately. | |

**User's choice:** Per-project blocks.
**Notes:** Keeps each project's content coherent for the model; reduces cross-project bleed.

### Q3 — Which source files feed the generator? (multiSelect)

| Option | Description | Selected |
|--------|-------------|----------|
| 6 active MDX case studies | src/content/projects/*.mdx — Phase 13 case studies | ✓ |
| 6 active Projects READMEs | Projects/1–6 .md — Projects/7 MULTI-DEX CRYPTO TRADER explicitly excluded (not in v1.2 per Phase 13 D-04) | ✓ |
| Resume PDF text | Extract text from public/jack-cutrara-resume.pdf at build time (pdf-parse or similar) | ✓ (initial) |
| About.ts exports | ABOUT_INTRO + ABOUT_P1..P3 folded into site-voice knowledge block | ✓ |

**User's choice:** All four initially.
**Notes:** Resume PDF was later reversed in Q4 — resume text NOT extracted, replaced with persona link to /jack-cutrara-resume.pdf.

### Q4 — Resume PDF PII handling

| Option | Description | Selected |
|--------|-------------|----------|
| Extract + redact at build | Parse PDF text, strip PII patterns before embedding. Model never sees phone/address. | |
| Extract full, refuse at runtime | Full resume enters knowledge block; rely on persona refusal for PII. Failure mode is PII leak. | |
| Skip resume text entirely | Don't extract the PDF. Persona points visitors to /jack-cutrara-resume.pdf for resume questions. Strongest PII guarantee. | ✓ |

**User's choice:** Skip resume text entirely.
**Notes:** Strongest PII guarantee; resume stays a download-only resource. Feeds into tiered refusal catalogue.

### Q5 — Size bounding

| Option | Description | Selected |
|--------|-------------|----------|
| No cap, monitor | Ship whatever the generator produces. Print word/token counts at build, warn on sanity threshold. | |
| Soft cap per project | Truncate each project's README at ~5k words with marker. Case study always intact. DAYTRADE (7.2k words) would be truncated. | ✓ |
| Hard cap total | Build fails if total exceeds a token budget. | |

**User's choice:** Soft cap per project (case study intact, README truncated at ~5k words).
**Notes:** User explicitly asked for a recommendation. Reasoning accepted: cost isn't the driver at portfolio traffic, balance is — DAYTRADE's 25% share of the knowledge block would skew model attention. Truncation marker doubles as CTA to the project page.

---

## Static/generated split

### Q6 — Where's the split seam?

| Option | Description | Selected |
|--------|-------------|----------|
| Identity static, projects generated | Static = {personal, education, skills, contact, siteStack}. Generated = {projects[], experience, about}. Matches today's portfolio-context.json shape. | ✓ |
| Identity + project metadata static, prose generated | Static = identity + per-project metadata. Generated = prose bodies only. Tighter separation, more files. | |
| Everything generated, static is a fallback | Static = last-known-good snapshot only. More aggressive; removes the hand-curated slot. | |

**User's choice:** Identity static, projects generated.

### Q7 — Build pipeline integration

| Option | Description | Selected |
|--------|-------------|----------|
| Prebuild npm script | Chain build:chat-context into existing "build" string. Matches sync-projects/pages-compat pattern. | ✓ |
| Astro integration hook | Wire as astro:config:setup / astro:build:start. Tighter coupling; regenerates on dev-server restart. | |
| CI-only + check gate | Runs only in GitHub Actions + manual trigger. --check flag fails CI if stale. | |

**User's choice:** Prebuild npm script.

### Q8 — File layout (chat.ts import shape)

| Option | Description | Selected |
|--------|-------------|----------|
| Two files, merged at runtime | Keep both files separate; chat.ts imports + merges. chat.ts grows. | |
| Two files, merged at build | build-chat-context.mjs produces single portfolio-context.json. chat.ts unchanged. | ✓ |
| Two files, both imported separately | chat.ts imports both, passes as two knowledge blocks with independent cache breakpoints. | |

**User's choice:** Two files, merged at build.
**Notes:** User asked for a recommendation. Accepted: minimal chat.ts diff preserves D-26 regression surface; matches sync-projects pattern; static identity <1024 tokens so separate cache block wasn't viable anyway.

### Q9 — Cache breakpoint placement

| Option | Description | Selected |
|--------|-------------|----------|
| Knowledge block only | cache_control on final knowledge block. Simplest, matches CHAT-05 wording. | |
| Entire system prompt | Cache whole system prompt as one unit. Same runtime cost; simpler mental model. | ✓ |
| Role + knowledge, not security | Cache role+knowledge, leave security/constraints outside for dev velocity. | |

**User's choice:** Entire system prompt.
**Notes:** Simplest mental model; cost difference negligible; knowledge block dominates so "cached portion" is effectively identical to knowledge-only.

---

## Persona + refusal posture

### Q10 — Third-person voice shape

| Option | Description | Selected |
|--------|-------------|----------|
| Warm colleague | Personable, slightly casual, speaks about Jack the way a coworker would. Matches current D-16 tone shifted to third person. | |
| Neutral biographer | Factual, restrained, mirrors engineering-journal voice of MDX case studies. Prioritizes credibility over warmth. | ✓ |
| Technical guide | Front-loads technical specifics; pushes toward project pages. Optimized for engineer readers. | |

**User's choice:** Neutral biographer.
**Notes:** User asked for a recommendation. Accepted: voice cohesion across site surfaces is itself a credibility signal; "warm colleague" is the ChatGPT default tone flagged in memory as what to avoid; "technical guide" too cold for soft questions.

### Q11 — Steering behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Answer-only, links when natural | Stick to what's asked. Drop links when relevant; no CTA closer. | |
| Light steering at end | Optionally append ONE contextual next step. Prompt enforces hard cap. | ✓ |
| Aggressive steering | Every response ends in a clear next-action. | |

**User's choice:** Light steering at end.
**Notes:** Answer-only wastes the project-page click funnel; aggressive steering trips the AI-marketing detector recruiters scan for.

### Q12 — Refusal posture

| Option | Description | Selected |
|--------|-------------|----------|
| Single unified refusal | One line for every refusal category. Simpler; loses resume-download redirect. | |
| Tiered by category | Three distinct refusal lines (resume/PII, off-scope, injection). | |
| Tiered + explicit hardening | Tiered lines PLUS system prompt explicitly names common attack patterns. Few-hundred-token cost for stronger CHAT-08 resistance. | ✓ |

**User's choice:** Tiered + explicit hardening.

### Q13 — Widget header name

| Option | Description | Selected |
|--------|-------------|----------|
| Keep "Ask Jack's AI" (D-31 baseline) | No change. "Jack's AI" personifies the bot as belonging to Jack. | |
| Rename to "Ask about Jack" | Aligns with third-person biographer framing — chat is ABOUT Jack, not OF Jack. | ✓ |
| Rename to "Portfolio Q&A" | Most neutral; removes AI branding entirely. | |

**User's choice:** Rename to "Ask about Jack".

---

## Injection test battery

### Q14 — Live Claude or mocked LLM?

| Option | Description | Selected |
|--------|-------------|----------|
| Mocked LLM | Vitest tests verify prompt construction only. Fast, deterministic, free. Doesn't prove actual injection resistance. | ✓ |
| Live Claude, gated separately | Mocked in CI + separate live suite for manual/release verification. ~$1–2/full run. | |
| Live in CI, always | Highest fidelity; cost + flakiness make this overkill for a portfolio. | |

**User's choice:** Mocked LLM.
**Notes:** Live-API battery logged as deferred idea for manual verification.

### Q15 — Pass/fail gate

| Option | Description | Selected |
|--------|-------------|----------|
| Regex / banned-phrase gates | Assert response does NOT contain banned substrings. | |
| Banned-phrase + required-phrase gates | Assert NO leak AND assert correct refusal line present. Stricter; catches refusal-copy regressions. | ✓ |
| Snapshot with manual review | Capture response, commit snapshot, re-review on drift. Maintenance burden. | |

**User's choice:** Banned-phrase + required-phrase gates.

### Q16 — Test file scope

| Option | Description | Selected |
|--------|-------------|----------|
| One file, core vectors | tests/api/prompt-injection.test.ts with ~10 attack vectors. | ✓ |
| One file, extended catalogue | ~20–25 vectors drawing from OWASP LLM Top 10 + Anthropic injection guide. | |
| Split across test files | Security, scope, PII each in own file. | |

**User's choice:** One file, core vectors.

---

## Round 2 — Additional gray areas

### Q17 — Git-track the generated file?

| Option | Description | Selected |
|--------|-------------|----------|
| Git-tracked (Recommended) | Commit portfolio-context.json. Matches sync-projects pattern. PR diffs reviewable. Fresh-clone DX intact. | ✓ |
| Gitignored | Pure build-artifact discipline. Fresh clones need preflight script run. | |

**User's choice:** Git-tracked.

### Q18 — CHAT-09 verification shape

| Option | Description | Selected |
|--------|-------------|----------|
| Vitest suite + verification checklist (Recommended) | 14-VERIFICATION.md with explicit 9-item D-26 checklist. Matches Phase 12 / Phase 13 pattern. | ✓ |
| Vitest suite only | Relies on existing tests; skips non-unit-testable items. | |

**User's choice:** Vitest suite + verification checklist.

### Q19 — Response length with max_tokens 768

| Option | Description | Selected |
|--------|-------------|----------|
| Tiered, modestly (Recommended) | 1–3 paragraphs for bio questions; 2–4 for technical deep-dives; "never padding" clause. | ✓ |
| Strict, ceiling as buffer | Persona stays at 1–3 paragraphs max; 768 is only truncation safety. | |

**User's choice:** Tiered, modestly.

### Q20 — Build script error behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Hard-fail on missing source, warn on soft issues (Recommended) | Mirrors sync-projects: data-integrity errors fatal, quality issues advisory. | ✓ |
| Hard-fail on everything | Maximal strictness; cosmetic issues stall the build. | |
| Warn + fallback to static | Prod silently ships with no project context. Rejected: defeats CHAT-09. | |

**User's choice:** Hard-fail on missing source, warn on soft issues.

---

## Claude's Discretion

- Exact truncation-marker copy wording
- Exact tiered refusal-line wording (planner drafts; user reviews at UAT)
- Exact attack-pattern phrasing inside system-prompt hardening section
- Whether README truncation cuts at H2 boundary or mid-paragraph
- Exact attack prompts for the 10 test vectors
- Whether `build-chat-context.mjs` also supports a `--check` CI drift flag
- Whether the static file gets its own Zod schema

## Deferred Ideas

- Live-API injection test suite (manual verification only, not CI)
- Cache-hit-rate observability (Phase 15 Analytics candidate)
- Extended caching (1-hour TTL) — not justified at current traffic
- Projects/7 MULTI-DEX CRYPTO TRADER inclusion (v1.3+)
- Zod schema for the static identity file
- `build-chat-context.mjs --check` flag (recommended but not required)
- Longer `max_tokens` for power-user deep-dives
