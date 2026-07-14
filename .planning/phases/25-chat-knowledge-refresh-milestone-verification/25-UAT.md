---
status: complete
phase: 25-chat-knowledge-refresh-milestone-verification
source: [25-00-SUMMARY.md, 25-01-SUMMARY.md, 25-02-SUMMARY.md, 25-03-SUMMARY.md, 25-04-SUMMARY.md]
started: 2026-07-14T20:48:17Z
updated: 2026-07-14T20:49:53Z
---

## Current Test

[testing complete]

## Tests

### 1. Invariant hash proof — D-14 gated chat surface untouched (QA-01/QA-02)
expected: verify-phase25-invariants.mjs exits 0 — the four gated files (BaseLayout.astro, global.css, chat.ts, api/chat.ts) plus normalized dependencies are byte-identical to the 25-BASELINE.json phase-start fingerprint (zero new runtime deps)
result: pass
source: automated
coverage_id: 25-00/D1, 25-00/D2, 25-04/D2
note: re-run this session — "Phase 25 invariants OK: 4 protected files + dependencies match the phase-start baseline." exit 0

### 2. Chat-context drift gate — committed corpus == fresh regen (D-11)
expected: pnpm build:chat-context:check exits 0 — the committed portfolio-context.json equals a fresh regeneration (projects=7, est_tokens=48735, corpus unchanged)
result: pass
source: automated
coverage_id: 25-04/D1
note: re-run this session — "src/data/portfolio-context.json: unchanged" exit 0

### 3. Corpus contract — 7 projects incl. Multi-Chain EVM untruncated (CHAT-10)
expected: portfolio-context.json ships exactly 7 projects including "Multi-Chain EVM Trader" (#7 exclusion lifted), ingested fully untruncated
result: pass
source: automated
coverage_id: 25-01/D1, 25-03
note: inspected corpus this session — 7 projects; Multi-Chain EVM Trader present; late-source tail anchor "a secured local control plane with a SPA and WebSocket feed" found → untruncated

### 4. Corpus contract — experience array + SSoT education + additive skills (CHAT-10)
expected: experience is a reverse-chron structured array (Holloway first, Balfour second); education single-sourced from education.ts (degree/school/graduation/transferredFrom/certifications); additive D-08 skills present (Deno, TanStack Query, Vitest, Ethers.js); about block is intro/p1/p3 (no p2)
result: pass
source: automated
coverage_id: 25-01/D2, 25-03
note: inspected corpus this session — experience=[Holloway (May 2026 – Present), Balfour Beatty (May 2023 – Aug 2023)]; education 5-field from education.ts; all four additive skills present; about keys intro,p1,p3

### 5. Full behavior battery + type gate — D-26 / D-15 SSE / mocked injection (CHAT-11 floor)
expected: pnpm exec vitest run passes (D-26 chat-surface behavior battery, CHAT-10 corpus contract, D-15 byte-identical SSE anchor, mocked prompt-injection: #7 ban absent + byte-intact <security> snapshot + count 7); astro check 0/0/0
result: pass
source: automated
coverage_id: 25-01/D3, 25-04/D1
note: re-run this session — vitest 692 passed / 2 skipped / 0 failed (78 files); astro check 0 errors / 0 warnings / 0 hints (140 files)

### 6. Live chat accuracy — Holloway + Multi-Chain EVM in third person (CHAT-11)
expected: Live chat answers Holloway + Multi-Chain EVM accurately in third person, no returns/profit claims, no first-person leak; exfiltration + PII probes refuse cleanly
result: pass
source: human
coverage_id: 25-04/D3
note: Jack confirmed 2026-07-14 (re-confirms the 25-04 live UAT sign-off — Holloway + Multi-Chain EVM answer accurately in third person, no returns claims, no first-person leak, security probes refuse cleanly)

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
