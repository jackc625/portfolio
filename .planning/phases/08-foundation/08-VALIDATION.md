---
phase: 8
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-04-07
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 (devDep, confirmed in package.json) |
| **Config file** | `vitest.config.ts` (root) — `include: ["tests/**/*.test.ts"]`, `environment: "node"`, `globals: true` |
| **Quick run command** | `npm run check` (astro check — fast typecheck only) |
| **Full suite command** | `npm run build && npm run lint && npm run test` |
| **Estimated runtime** | ~30s quick / ~90s full suite |

---

## Sampling Rate

- **After every task commit:** Run `npm run check`
- **After every plan wave:** Run `npm run build && npm run lint && npm run test`
- **Before `/gsd-verify-work`:** Full suite must be green + manual chat smoke test (D-26)
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

> Populated by gsd-planner during plan creation. Each task gets at least one automated verification command (or grep assertion).

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 8-XX-XX | TBD  | TBD  | DSGN-XX     | —          | N/A             | TBD       | TBD               | ✅          | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- **None.** Existing test infrastructure covers all phase requirements:
  - `tests/api/chat.test.ts` — chat API SSE/CORS/sanitization
  - `tests/api/validation.test.ts` — zod schemas
  - `tests/api/security.test.ts` — security
  - `tests/client/markdown.test.ts` — imports `renderMarkdown` from `src/scripts/chat.ts`; serves as a compile-time canary that chat.ts edits don't break the module

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Chat widget single-page round-trip (open → send → SSE stream → Geist Mono `<code>` render → focus trap → close) | CHAT-01 (Phase 7 carry-over) | SSE streaming + visual rendering + focus trap not covered by vitest | Per D-26 gate step 4 — full smoke test checklist in 08-RESEARCH.md "Smoke test fingerprint" |
| MASTER.md content review | DSGN-05 | Subjective quality of design contract | Read `design-system/MASTER.md` end-to-end against mockup.html |
| Stub pages render against new tokens | DSGN-02 | Visual confirmation tokens applied | Open each `/`, `/about`, `/projects`, `/contact`, `/projects/[id]` route in dev |
| `/resume` returns 404 | CONTACT-03 | Negative test | Visit `localhost:4321/resume` — expect 404 |
| Geist + Geist Mono visually present | DSGN-01 | Font rendering verification | Inspect any rendered page; `<h1>` is Geist 700, `<code>` is Geist Mono |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify (`npm run check` minimum) or grep assertion
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (none required for Phase 8)
- [ ] No watch-mode flags (`vitest run`, not `vitest`)
- [ ] Feedback latency < 30s for per-task, < 90s for per-wave
- [ ] Manual chat smoke test scripted in PLAN.md verification steps
- [ ] `nyquist_compliant: true` set in frontmatter after planner sign-off

**Approval:** pending
