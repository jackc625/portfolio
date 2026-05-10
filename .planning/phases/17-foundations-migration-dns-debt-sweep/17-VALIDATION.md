---
phase: 17
slug: foundations-migration-dns-debt-sweep
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-10
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm test` |
| **Full suite command** | `pnpm test && pnpm build` |
| **Estimated runtime** | ~30 seconds (test) + ~25 seconds (build) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test`
- **After every plan wave:** Run `pnpm test && pnpm build`
- **Before `/gsd-verify-work`:** Full suite + 117/117 D-26 chat regression battery must be green
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| _to be filled by gsd-planner_ | | | | | | | | | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

_To be filled by gsd-planner per RESEARCH.md §Validation Architecture (Wave-0 test gaps enumerated)._

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `dig TXT _dmarc.mail.jackcutrara.com` returns valid DMARC | DNS-01 | DNS propagation external to repo | `dig TXT _dmarc.mail.jackcutrara.com` shows `v=DMARC1; p=none ...` |
| 5–10 warmup sends land in Gmail Inbox (not Spam) after "Not Spam" feedback | DNS-02 | Gmail spam classification cannot be unit-tested | Run `node scripts/resend-warmup.mjs` 5–10x, mark each as "Not Spam" if bucketed, enroll Postmaster Tools |
| Custom domain `jackcutrara.com` reattached to Worker, Pages preview retired after 24h clean traffic | FOUND-03 | Cloudflare dashboard operation | Cloudflare Pages dashboard → custom domain detached + reattached to Worker |
| Cloudflare Workers Builds Git integration replaces Pages auto-deploy | FOUND-03 / D-03 | Dashboard configuration | Cloudflare dashboard → Workers project → Connect Git → push to main triggers build |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
