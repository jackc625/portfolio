---
phase: 25
slug: chat-knowledge-refresh-milestone-verification
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-14
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
| CHAT-10 | Education wired from `education.ts` (WGU May 2026 + VT + LPI) | build | new education-wiring assertion | ❌ Wave 0 |
| CHAT-11 | No first-person leak in any chat-bound field incl. new experience block | build guard | `checkFirstPersonLeaks` (exit 2) via `pnpm build:chat-context` | ✅ walk extended |
| CHAT-11 | System prompt no longer bans #7; grounded anchors match new positioning | api | `vitest run tests/api/prompt-injection.test.ts` | ✅ edit ban + count + anchors |
| CHAT-11 | Corpus asserts #7 + Holloway presence (floor, not substitute for UAT) | build | new presence assertion | ❌ Wave 0 |
| CHAT-11 | Live chat answers Holloway + Multi-Chain EVM accurately in 3rd person | manual UAT | `/gsd-verify-work`-style ask against running dev chat (D-12) | manual-only |
| QA-01 | D-26 BaseLayout / chat-surface anchors intact | build | `vitest run tests/build/chat-surface-untouched.test.ts` | ✅ passes untouched |
| QA-01 | D-15 SSE bytes/headers byte-identical | api | `vitest run tests/api/sse-snapshot.test.ts` | ✅ passes untouched |
| QA-02 | `astro check` 0/0/0 | typecheck | `pnpm exec astro check` | ✅ |
| QA-02 | Zero new runtime deps | invariant | `git diff package.json` dependencies block byte-identical | baseline |
| QA-02 | Corpus no-drift after regen | CI gate | `pnpm build:chat-context:check` (exit 1 on drift) | ✅ |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/build/chat-context-integrity.test.ts` — retarget to 7 slugs (incl. `multi-chain-evm`), remove/invert the #7-leak block.
- [ ] `tests/build/chat-knowledge-voice.test.ts` — walk `experience` as an array (not a string).
- [ ] `tests/api/prompt-injection.test.ts` — drop the multi-dex-ban assertion; project count 6→7.
- [ ] `tests/fixtures/chat-eval-dataset.ts` — update "current" groundedQA anchors to the new positioning (drop "entry-level").
- [ ] New: education-wiring assertion (WGU May 2026 + VT transfer + LPI cert present in `education`).
- [ ] New (recommended): experience-block presence assertion (Holloway company + Balfour present, reverse-chronological).

*Existing Vitest infrastructure covers the framework; these are the per-requirement gaps.*

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

**Approval:** approved 2026-07-14 (plan-checker VERIFICATION PASSED). `wave_0_complete` stays false until execution (25-01) actually writes the Wave 0 test retargets.
