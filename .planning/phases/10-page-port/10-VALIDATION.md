---
phase: 10
slug: page-port
status: audited
nyquist_compliant: false
wave_0_complete: true
created: 2026-04-12
audited: 2026-04-13
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.0 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm run build` |
| **Full suite command** | `pnpm run build && pnpm run lint && pnpm run check && pnpm run test` |
| **Estimated runtime** | ~15 seconds |
| **Test files** | 6 files, 64 tests |

---

## Sampling Rate

- **After every task commit:** Run `pnpm run build`
- **After every plan wave:** Run `pnpm run build && pnpm run lint && pnpm run check && pnpm run test`
- **Before `/gsd-verify-work`:** Full suite green + manual chat smoke + manual persistence test + manual visual parity check
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-T1 | 01 | 1 | WORK-03 | grep | `grep "Status indicators" design-system/MASTER.md` | n/a | ✅ green |
| 01-T2 | 01 | 1 | WORK-03 | build+grep | `pnpm run build && grep "year: z.string" src/content.config.ts` | n/a | ✅ green |
| 02-T1 | 02 | 2 | CONTACT-01, CONTACT-02 | unit | `pnpm run test` | `tests/client/contact-data.test.ts` | ✅ green |
| 02-T2 | 02 | 2 | CONTACT-01, CONTACT-02 | grep | `grep "GET IN TOUCH" src/components/ContactSection.astro` | n/a | ✅ green |
| 02-T3 | 02 | 2 | CONTACT-01 | grep | `grep "CONTACT.github" src/components/primitives/Footer.astro` | n/a | ✅ green |
| 03-T1 | 03 | 3 | HOME-01, HOME-02, HOME-03, HOME-04 | build+grep | `pnpm run build && grep -c 'href="/projects/' dist/index.html` | n/a | ✅ green |
| 03-T2 | 03 | 3 | ABOUT-01, ABOUT-02 | unit | `pnpm run test` | `tests/client/about-data.test.ts` | ✅ green |
| 03-T3 | 03 | 3 | CONTACT-01 | grep | `grep "ContactSection" src/pages/contact.astro` | n/a | ✅ green |
| 04-T1 | 04 | 3 | WORK-01, WORK-03 | build+grep | `pnpm run build && grep -c 'href="/projects/' dist/projects/index.html` | n/a | ✅ green |
| 04-T2 | 04 | 3 | WORK-02, WORK-03 | build | `pnpm run build` (generates 6 detail routes) | n/a | ✅ green |
| 05-T1 | 05 | 4 | CHAT-02 | grep | `grep -c "chat-panel" src/components/chat/ChatWidget.astro` (11 IDs) | n/a | ✅ green |
| 05-T2 | 05 | 4 | CHAT-02 | grep | `grep -c "typing-bounce" src/styles/global.css` | n/a | ✅ green |
| 06-T1 | 06 | 5 | CHAT-01 | grep | `grep -c "STORAGE_KEY" src/scripts/chat.ts` | n/a | ✅ green |
| 06-T2 | 06 | 5 | CHAT-01 | grep | `grep "stored locally" src/components/chat/ChatWidget.astro` | n/a | ✅ green |
| 07-T1 | 07 | 6 | ALL | gate | `pnpm run build && pnpm run lint && pnpm run check && pnpm run test` | n/a | ✅ green |
| 07-T2 | 07 | 6 | ALL | manual | Human UAT (chat smoke + persistence + visual parity) | n/a | ✅ green |
| 08-T1 | 08 | 1* | CONTACT-01 | build | `pnpm run build` | n/a | ✅ green |
| 08-T2 | 08 | 1* | CHAT-02 | build+lint | `pnpm run build && pnpm run lint` | n/a | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*
*Wave 1\* = gap-closure wave added after initial verification gate*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Two new test files added during Nyquist audit:

- `vitest.config.ts` — exists
- `tests/client/markdown.test.ts` — 12 tests: markdown sanitization (CHAT-01 replay path)
- `tests/api/security.test.ts` — 12 tests: prompt injection defense, CORS
- `tests/api/chat.test.ts` — 7 tests: API contract, SSE format, streaming
- `tests/api/validation.test.ts` — 11 tests: input validation, history limits
- `tests/client/about-data.test.ts` — **NEW** 5 tests: about copy word count ≤80 per paragraph (ABOUT-02)
- `tests/client/contact-data.test.ts` — **NEW** 7 tests: contact data integrity, resume path (CONTACT-02)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Homepage hero renders correctly | HOME-01 | Astro page rendering — no E2E framework | Visual check at desktop/tablet/mobile widths against mockup.html |
| Work list renders featured projects | HOME-02 | Content collection query in page template | Check 3 featured projects render as numbered rows on homepage |
| About preview section renders | HOME-03 | Visual layout verification | Check § 02 section on homepage |
| Contact section renders | HOME-04 | Visual layout verification | Check § 03 section on homepage |
| About page editorial structure | ABOUT-01 | Visual layout verification | Verify intro + 3 paragraphs, no icons/progress bars |
| Projects index numbered list | WORK-01 | Visual layout verification | All 6 projects as numbered rows, no card grid |
| Case study editorial layout | WORK-02 | Visual layout verification | Mono metadata, large title, body column on each detail page |
| Minimal contact layout | CONTACT-01 | Visual layout verification | GET IN TOUCH label + mono links, no icons/form |
| Chat functionality + persistence | CHAT-01 | Interactive behavior (persistence functions not exported — would need impl change or Playwright E2E to test) | Open chat, send message, navigate away, reopen, verify history persisted; verify no duplication on repeated open/close; verify survives hard refresh |
| Chat visual restyle | CHAT-02 | Visual verification | Flat rectangle panel, no shadows/gradients, accent bubble only round surface |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** partial (2/3 gaps resolved, 1 marked manual-only)

---

## Validation Audit 2026-04-13

| Metric | Count |
|--------|-------|
| Gaps found | 3 |
| Resolved | 2 |
| Escalated (manual-only) | 1 |

### Resolved Gaps

| Requirement | Gap | Resolution | Test File |
|-------------|-----|------------|-----------|
| ABOUT-02 | No word count validation | Unit tests for ≤80 words per paragraph | `tests/client/about-data.test.ts` |
| CONTACT-02 | No data integrity check | Unit tests for email, URLs, resume path, x:null | `tests/client/contact-data.test.ts` |

### Escalated to Manual-Only

| Requirement | Gap | Reason |
|-------------|-----|--------|
| CHAT-01 | Persistence logic untested | `saveChatHistory`, `loadChatHistory`, TTL, cap, version check are module-private in `chat.ts` — cannot unit test without exporting or adding Playwright E2E. Existing coverage: `markdown.test.ts` covers the DOMPurify sanitization path used in replay. Manual test instructions added above. |
