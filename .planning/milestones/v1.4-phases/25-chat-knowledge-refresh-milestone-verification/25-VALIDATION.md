---
phase: 25
slug: chat-knowledge-refresh-milestone-verification
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-14
last_validated: 2026-07-14
---

# Phase 25 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from 25-RESEARCH.md `## Validation Architecture`. Task IDs finalized by the planner.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 (`vitest run`) |
| **Config file** | `vitest.config.*` at repo root (test scripts in `package.json`) |
| **Quick run command** | `pnpm exec vitest run tests/build/chat-context-integrity.test.ts tests/build/chat-knowledge-voice.test.ts tests/api/chat-voice-split.test.ts tests/api/prompt-injection.test.ts` |
| **Full suite command** | `pnpm test` (`vitest run`) |
| **Corpus regen + drift gate** | `pnpm build:chat-context` then `pnpm build:chat-context:check` |
| **Estimated runtime** | ~30 seconds (full suite) |

---

## Sampling Rate

- **After every task commit:** Run the quick 4-file chat test set + `pnpm build:chat-context` (the `checkFirstPersonLeaks` leak guard runs here, exit 2 on leak).
- **After every plan wave:** Run `pnpm test` (full suite) + `pnpm exec astro check`.
- **Before `/gsd-verify-work`:** `pnpm build` end-to-end green + full suite green + `pnpm build:chat-context:check` clean + dependency-block byte-identical + the live chat UAT ask (D-12).
- **Max feedback latency:** ~30 seconds.

---

## Per-Task Verification Map

> Requirement→test map from research. Task IDs (`25-NN-NN`) are bound by the planner; Wave/Plan columns filled at plan time.

| Requirement | Behavior | Test Type | Automated Command | Exists? |
|-------------|----------|-----------|-------------------|---------|
| CHAT-10 | #7 present in corpus (7 slugs, non-empty caseStudy + extendedReference) | build/integration | `vitest run tests/build/chat-context-integrity.test.ts` | ✅ edit 6→7 + drop #7-ban |
| CHAT-10 | Structured `experience` array (Holloway + Balfour), third person | build | `vitest run tests/build/chat-knowledge-voice.test.ts` | ✅ edit string→array walk |
| CHAT-10 | Education wired from `education.ts` (WGU May 2026 + VT + LPI) | build | `vitest run tests/build/parse-education.test.ts` + integrity SSoT assertion | ✅ delivered 25-01/25-03 |
| CHAT-11 | No first-person leak in any chat-bound field incl. new experience block | build guard | `checkFirstPersonLeaks` (exit 2) via `pnpm build:chat-context` | ✅ walk extended |
| CHAT-11 | System prompt no longer bans #7; grounded anchors match new positioning | api | `vitest run tests/api/prompt-injection.test.ts` | ✅ edit ban + count + anchors |
| CHAT-11 | Corpus asserts #7 + Holloway presence (floor, not substitute for UAT) | build | `vitest run tests/build/chat-context-integrity.test.ts` presence assertion | ✅ delivered 25-01/25-03 |
| CHAT-11 | Live chat answers Holloway + Multi-Chain EVM accurately in 3rd person | manual UAT | `/gsd-verify-work`-style ask against running dev chat (D-12) | manual-only |
| QA-01 | D-26 BaseLayout / chat-surface anchors intact | build | `vitest run tests/build/chat-surface-untouched.test.ts` | ✅ passes untouched |
| QA-01 | D-15 SSE bytes/headers byte-identical | api | `vitest run tests/api/sse-snapshot.test.ts` | ✅ passes untouched |
| QA-02 | `astro check` 0/0/0 | typecheck | `pnpm exec astro check` | ✅ |
| QA-02 | Zero new runtime deps | invariant | `node scripts/verify-phase25-invariants.mjs` (normalized deps == baseline, exit 0) | ✅ verifier exit 0 |
| QA-02 | Corpus no-drift after regen | CI gate | `pnpm build:chat-context:check` (exit 1 on drift) | ✅ |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/build/chat-context-integrity.test.ts` — retarget to 7 slugs (incl. `multi-chain-evm`), remove/invert the #7-leak block. *(25-01 `678cbef`; green 25-03)*
- [x] `tests/build/chat-knowledge-voice.test.ts` — walk `experience` as an array (not a string). *(25-01 `b357b3a`; green 25-03)*
- [x] `tests/api/prompt-injection.test.ts` — drop the multi-dex-ban assertion; project count 6→7. *(25-01 `9389878`; green 25-03)*
- [x] `tests/fixtures/chat-eval-dataset.ts` — update "current" groundedQA anchors to the new positioning (drop "entry-level"). *(25-01 `9389878`)*
- [x] New: education-wiring assertion (WGU May 2026 + VT transfer + LPI cert present in `education`). *(integrity SSoT test 25-01 + `tests/build/parse-education.test.ts` 9 unit tests, 25-03 `d85a38e`)*
- [x] New (recommended): experience-block presence assertion (Holloway company + Balfour present, reverse-chronological). *(chat-context-integrity, 25-01/25-03)*

*Existing Vitest infrastructure covers the framework; all per-requirement gaps were delivered and are green (116/116 targeted tests pass this validation run).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live chat answers accurately in third person | CHAT-11 (D-12) | LLM output quality is not deterministically assertable; the automated leak guard is a floor, not a substitute | Start dev, ask the running chat "What did Jack do at Holloway?" and "Tell me about the Multi-Chain EVM trader." Confirm third-person, specifics correct, no returns/profit claims for #7, no first-person leak. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (25-01 retargets the four pinned tests + adds the education/experience assertions)
- [x] No watch-mode flags (`vitest run`, not watch)
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-07-14 (plan-checker VERIFICATION PASSED). `wave_0_complete` flipped to `true` on 2026-07-14 post-execution audit — 25-01 wrote the Wave 0 retargets and 25-03 turned them green.

---

## Validation Audit 2026-07-14

Retroactive Nyquist audit (State A) of the completed phase against the live tree. No gaps found — every automated requirement has a passing test/gate; the single manual-only item (CHAT-11 D-12 live chat accuracy) was signed off in 25-04.

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
| Tests generated | 0 (all delivered during execution) |

**Verification commands re-run this audit (all green):**

| Command | Result |
|---------|--------|
| `vitest run` (7 mapped files: chat-context-integrity, chat-knowledge-voice, chat-voice-split, prompt-injection, parse-education, chat-surface-untouched, sse-snapshot) | 116/116 passed |
| `node scripts/verify-phase25-invariants.mjs` (QA-01/QA-02 hash + dep lock) | exit 0 |
| `node scripts/build-chat-context.mjs --check` (QA-02 drift gate) | exit 0 — projects=7, #7 untruncated, corpus unchanged |
| `pnpm exec astro check` (QA-02 typecheck) | 0 errors / 0 warnings / 0 hints (140 files) |

**Verdict:** Phase 25 is Nyquist-compliant. Every requirement (CHAT-10, CHAT-11, QA-01, QA-02) has automated verification that exists and runs green, with the LLM-accuracy leg covered by the recorded live UAT.
