---
phase: 17
slug: foundations-migration-dns-debt-sweep
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-10
updated: 2026-05-11
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.0 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm test` |
| **Full suite command** | `pnpm test && pnpm build` |
| **Estimated runtime** | ~7 seconds (test) + ~25 seconds (build) |
| **Current count** | 419 PASS / 2 SKIP (51 files) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test`
- **After every plan wave:** Run `pnpm test && pnpm build`
- **Before `/gsd-verify-work`:** Full suite + 117/117 D-26 chat regression battery must be green
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Plan | Wave | Requirement | Test Type | Test File | Automated Command | Status |
|------|------|-------------|-----------|-----------|-------------------|--------|
| 17-01 | 0 | TEST-02 | snapshot | tests/api/sse-snapshot.test.ts | `pnpm vitest run tests/api/sse-snapshot.test.ts` | ✅ green |
| 17-02 | 1 | FOUND-01 | build | tests/build/wrangler-shape.test.ts | `pnpm vitest run tests/build/wrangler-shape.test.ts` | ✅ green |
| 17-02 | 1 | FOUND-02 | build | tests/build/worker-entrypoint.test.ts | `pnpm vitest run tests/build/worker-entrypoint.test.ts` | ✅ green |
| 17-02 | 1 | FOUND-03 | manual | — | Cloudflare dashboard (custom domain reattach + Pages retirement) | ✅ green (verified 2026-05-11) |
| 17-02 | 1 | FOUND-04 | build | tests/build/no-mdx-in-worker-bundle.test.ts | `pnpm vitest run tests/build/no-mdx-in-worker-bundle.test.ts` | ✅ green |
| 17-02 | 1 | TEST-01 (cross-phase) | api | tests/api/security.test.ts | `pnpm vitest run tests/api/security.test.ts` | ✅ green |
| 17-02 | 1 | TEST-02 (re-verify) | snapshot | tests/api/sse-snapshot.test.ts | `pnpm vitest run tests/api/sse-snapshot.test.ts` | ✅ green |
| 17-03 | 2 | DEBT-04 | client | tests/client/listener-dedup.test.ts | `pnpm vitest run tests/client/listener-dedup.test.ts` | ✅ green |
| 17-03 | 2 | DEBT-05 | client+build | tests/client/chat-panel-display.test.ts, tests/build/no-imperative-display-flip.test.ts | `pnpm vitest run tests/client/chat-panel-display.test.ts tests/build/no-imperative-display-flip.test.ts` | ✅ green |
| 17-03 | 2 | TEST-01 | client | tests/client/chat-pulse-coordination.test.ts (D-26 battery) | `pnpm test` | ✅ green |
| 17-04 | 3 | DEBT-01 | build | tests/build/project-md-debt-01.test.ts | `pnpm vitest run tests/build/project-md-debt-01.test.ts` | ✅ green |
| 17-04 | 3 | DEBT-03 | manual | — | `.github/workflows/sync-check.yml` job runs on PR (verified on first post-Phase-17 PR) | ✅ green (CI live) |
| 17-05 | 4 | DEBT-02 | api | tests/api/cache-hit-logs.test.ts | `pnpm vitest run tests/api/cache-hit-logs.test.ts` | ✅ green |
| 17-05 | 4 | TEST-01 | client | D-26 battery | `pnpm test` | ✅ green |
| 17-05 | 4 | TEST-03 | api | tests/api/anthropic-payload-shape.test.ts | `pnpm vitest run tests/api/anthropic-payload-shape.test.ts` | ✅ green |
| 17-06 | 5 | DNS-01 | manual | — | `nslookup -type=TXT _dmarc.mail.jackcutrara.com` (Windows) / `dig TXT _dmarc.mail.jackcutrara.com` (POSIX) | ✅ green (verified 2026-05-11 on 1.1.1.1 + 8.8.8.8) |
| 17-06 | 5 | DNS-02 | manual | — | Google Postmaster Tools enrollment + 5–10 warmup sends marked "Not Spam" | ✅ green (verified 2026-05-11) |
| 17-07 | 7 | DEBT-02 (voice-split) | build+api | tests/build/chat-knowledge-voice.test.ts, tests/api/chat-voice-split.test.ts | `pnpm vitest run tests/build/chat-knowledge-voice.test.ts tests/api/chat-voice-split.test.ts` | ✅ green |
| 17-07 | 7 | TEST-01 | client | D-26 battery | `pnpm test` | ✅ green |
| 17-08 | 10 | DEBT-05 | client+build | tests/client/chat-panel-display.test.ts, tests/build/no-inline-display-on-chat-panel.test.ts | `pnpm vitest run tests/client/chat-panel-display.test.ts tests/build/no-inline-display-on-chat-panel.test.ts` | ✅ green |
| 17-08 | 10 | UAT-GAP-02 | client+manual | tests/client/chat-panel-display.test.ts + DEPLOY-GATE.md operator confirmation | `pnpm vitest run tests/client/chat-panel-display.test.ts` + manual smoke | ✅ green (verified 2026-05-11) |
| 17-08 | 10 | TEST-01 | client | D-26 battery | `pnpm test` | ✅ green |
| 17-08 | 10 | TEST-02 | snapshot | tests/api/sse-snapshot.test.ts | `pnpm vitest run tests/api/sse-snapshot.test.ts` | ✅ green |
| 17-09 | 8 | DEBT-05 (copy-feedback) | client | tests/client/chat-copy-button.test.ts | `pnpm vitest run tests/client/chat-copy-button.test.ts` | ✅ green |
| 17-09 | 8 | UAT-GAP-03 | client+manual | tests/client/chat-copy-button.test.ts + manual smoke | `pnpm vitest run tests/client/chat-copy-button.test.ts` + manual smoke | ✅ green (verified 2026-05-11) |
| 17-09 | 8 | TEST-01 | client | D-26 battery | `pnpm test` | ✅ green |
| 17-10 | 9 | UAT-GAP-04 | build+manual | tests/build/view-transition-handler.test.ts + manual smoke (no console AbortError on rapid nav) | `pnpm vitest run tests/build/view-transition-handler.test.ts` + manual smoke | ✅ green (verified 2026-05-11) |
| 17-10 | 9 | TEST-01 | client | D-26 battery | `pnpm test` | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

**Plan 17-01 (Wave 0)** authored the D-15 SSE byte-identical snapshot fixture **BEFORE** any migration code landed, per CONTEXT.md D-04 and D-11. This is the pre-migration ground truth every downstream plan validates against.

| Artifact | Captured Against | Why Wave 0 |
|----------|------------------|------------|
| tests/api/sse-snapshot.test.ts | Live Pages /api/chat (pre-migration) | Without it, migration validates the new Worker against itself (circular) |
| tests/fixtures/sse-snapshot-headers.json | Live Pages SSE response headers | 4-key byte fixture (Content-Type, Cache-Control, Connection, Content-Encoding) |
| tests/fixtures/sse-snapshot-frames.bin | Live Pages SSE frame stream | 38-byte canonical fixture; Buffer.compare equality |

Wave-0 gate: ✅ committed at d6c2f0e + a4d5db6 prior to Plan 17-02 cutover.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions | Verification |
|----------|-------------|------------|-------------------|--------------|
| `dig TXT _dmarc.mail.jackcutrara.com` returns valid DMARC | DNS-01 | DNS propagation external to repo | `dig TXT _dmarc.mail.jackcutrara.com` shows `v=DMARC1; p=none ...` | ✅ 2026-05-11 (1.1.1.1 + 8.8.8.8) |
| 5–10 warmup sends land in Gmail Inbox (not Spam) after "Not Spam" feedback | DNS-02 | Gmail spam classification cannot be unit-tested | Run `node scripts/resend-warmup.mjs` 5–10x, mark each as "Not Spam" if bucketed, enroll Postmaster Tools | ✅ 2026-05-11 |
| Custom domain `jackcutrara.com` reattached to Worker, Pages preview retired after 24h clean traffic | FOUND-03 | Cloudflare dashboard operation | Cloudflare Pages dashboard → custom domain detached + reattached to Worker | ✅ 2026-05-11 |
| Cloudflare Workers Builds Git integration replaces Pages auto-deploy | FOUND-03 / D-03 | Dashboard configuration | Cloudflare dashboard → Workers project → Connect Git → push to main triggers build | ✅ 2026-05-11 |
| `build:chat-context:check` CI job runs on PR | DEBT-03 | Workflow trigger requires a GitHub PR event | First post-Phase-17 PR exercises the workflow | ✅ CI live |
| Post-deploy smoke: panel opens, COPY→COPIED, no AbortError on rapid nav | UAT-GAP-02/03/04 | Real-browser end-to-end behaviour | DEPLOY-GATE.md checklist signed off pre-`git push origin main` | ✅ 2026-05-11 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or are listed in Manual-Only with operator verification
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (D-15 SSE snapshot landed before migration)
- [x] No watch-mode flags
- [x] Feedback latency < 60s (vitest run completes in ~7s)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** signed-off — 2026-05-11

---

## Validation Audit 2026-05-11

| Metric | Count |
|--------|-------|
| Plans audited | 10 |
| Requirements mapped | 28 |
| Automated coverage | 22 |
| Manual-only (with operator verification) | 6 |
| Gaps found | 0 |
| Resolved | n/a |
| Escalated | 0 |
| Test files referenced | 14 |
| Test suite status | 419 PASS / 2 SKIP (pre-existing roadmap-amendment skips) |
