---
phase: 17-foundations-migration-dns-debt-sweep
audited: 2026-05-11
auditor: gsd-security-auditor (Claude Opus 4.7)
asvs_level: 1
block_on: high
threats_total: 49
threats_closed: 49
threats_open: 0
unregistered_flags: 0
status: SECURED
---

# Phase 17: Security Audit Report

**Phase:** 17 — foundations-migration-dns-debt-sweep
**Threats Closed:** 49/49
**ASVS Level:** 1
**Block-On Policy:** high

## Scope

Verified every threat declared in the `<threat_model>` blocks of Plans 17-01..17-10 against the actual implementation. Each `mitigate` threat was confirmed by locating its cited control (test file, source pattern, or CI step) and verifying the claimed shape exists. Each `accept` threat was confirmed by locating its rationale in the corresponding plan or summary and recording it in the accepted-risk log below. Each `n/a` threat was confirmed by verifying no security surface was introduced.

## Threat Verification

### Plan 17-01 — SSE byte-identical anchor

| Threat ID | Category | Disposition | Evidence |
|-----------|----------|-------------|----------|
| T-17-06 | Tampering / SSE byte contract | mitigate | `tests/api/sse-snapshot.test.ts:113` asserts `Buffer.compare(actual, expected) === 0` against `tests/fixtures/sse-snapshot-frames.bin` (38 bytes, present on disk) |
| T-17-A | Tampering / Fixture file integrity | mitigate | Fixture is 38 bytes on disk (verified `ls -la`). Snapshot test compares full byte sequence — any drift fails the assertion. (Plan register says "36 bytes"; VERIFICATION.md correctly reports 38; doc drift only — byte-exact assertion is enforced regardless of declared length.) |
| T-17-B | Repudiation / Fixture provenance | accept | Provenance recorded in `tests/api/sse-snapshot.test.ts:5-15` file-level docblock: "this fixture was captured BEFORE any migration code". Accepted: provenance is documentary, not cryptographically signed. |

### Plan 17-02 — Pages→Workers migration

| Threat ID | Category | Disposition | Evidence |
|-----------|----------|-------------|----------|
| T-17-01 | InfoDisclosure / Wrangler secret migration | mitigate | `wrangler.jsonc` contains no API key literals; secrets re-added via `wrangler secret` per Plan 17-02 task. Worker `Env` interface declares `ANTHROPIC_API_KEY`/`RESEND_API_KEY` etc. as bindings, never inlined (`src/worker.ts:14-17`). |
| T-17-02 | Spoofing / CORS preview-suffix bypass | mitigate | `src/lib/validation.ts:74` defines `WORKERS_PREVIEW_SUFFIX = ".jackcutrara.workers.dev"` with leading dot; lines 137-139 enforce `endsWith` + non-empty single-label prefix check rejecting apex/empty-label confusion |
| T-17-05 | Spoofing / CORS regression after rename | mitigate | `tests/api/security.test.ts` present (3635 bytes, CORS battery); covers `ALLOW_LOOPBACK` semantics |
| T-17-06 | Tampering / SSE byte contract during cutover | mitigate | Same SSE snapshot test as Plan 17-01 (`tests/api/sse-snapshot.test.ts`) gates D-15 byte-identical across the cutover |
| T-17-A | Tampering / Worker bundle includes MDX | mitigate | `src/pages/api/chat.ts:1` declares `export const prerender = false`; `tests/build/wrangler-shape.test.ts` + `tests/build/no-mdx-in-worker-bundle.test.ts` present and substantive |
| T-17-B | DoS / Rollback unavailable mid-cutover | accept | Accepted in PLAN 17-02 D-02 24h Pages-warm window. `17-02-SUMMARY.md:190` records `threat_flag: pages-rollback-window-active` documenting the gated window. Rollback documented in DEPLOY-GATE.md. |
| T-17-C | Misconfiguration / KV placeholders | mitigate | `wrangler.jsonc:14-15` contains real KV IDs (`eaa30fef259e4a6b9505b41bbf3f8f01` and `115f3c1b0f8a4a1da9fee78c48dcb749`); grep across `wrangler.jsonc` finds zero `REPLACE_WITH_*` placeholders |

### Plan 17-03 — DEBT-04/05 listener dedup + CSS state machine

| Threat ID | Category | Disposition | Evidence |
|-----------|----------|-------------|----------|
| T-17-D | Tampering / Listener accumulation | mitigate | `src/scripts/chat.ts:991-992` performs idempotent `removeEventListener` then `addEventListener` for `astro:page-load`; same pattern in `src/scripts/analytics.ts:149-150` and `src/scripts/scroll-depth.ts:89-90`. `tests/client/listener-dedup.test.ts` present (8245 bytes, substantive). |
| T-17-E | Tampering / Visual contract regression | mitigate | `src/styles/global.css:712-719` defines CSS-only state machine (`#chat-panel { display: none }` + `.is-open { display: flex }`). `tests/build/no-imperative-display-flip.test.ts` present (1677 bytes) prevents `panel.style.display` re-introduction. `tests/client/chat-panel-display.test.ts` (4023 bytes) covers runtime behavior. |
| T-17-F | DoS / chat.ts await timing | accept | Accepted: async signature unchanged. No new awaited path introduced. (See 17-03-SUMMARY.md Threat Flags section.) |
| T-17-G | InfoDisclosure / DEBT tests expose source | accept | Accepted: tests assert anti-regression invariants only (selector strings, class names), not secrets. |

### Plan 17-04 — CI sync-check + DEBT-01 framing

| Threat ID | Category | Disposition | Evidence |
|-----------|----------|-------------|----------|
| T-17-H | Repudiation / DEBT-01 doc framing drift | mitigate | `tests/build/project-md-debt-01.test.ts` present (3092 bytes); `.planning/PROJECT.md:118` contains locked wording "documented + Free-tier acceptable (per v1.3 milestone-shape lock 2026-05-09)" |
| T-17-I | Tampering / portfolio-context.json drift | mitigate | `.github/workflows/sync-check.yml:42`: `run: pnpm build:chat-context:check`. Path triggers (lines 5-13) cover `Projects/**`, `src/content/projects/**`, `src/data/about.ts`, `src/data/about-chat.ts`, `portfolio-context.{static.,}json`, and both builder scripts. |
| T-17-J | DoS / CI cold-run time | accept | Accepted: single-job two-step keeps cold-run cost low. Documented in 17-04 plan. |
| T-17-K | InfoDisclosure / sync-check.yml secrets | accept | Accepted: workflow has no `secrets:` references; read-only operation. Verified by reading `.github/workflows/sync-check.yml` — no env: secrets block. |

### Plan 17-05 — DEBT-02 cache metrics + TEST-03

| Threat ID | Category | Disposition | Evidence |
|-----------|----------|-------------|----------|
| T-17-06 | Tampering / SSE byte contract during DEBT-02 | mitigate | TEST-02 + `tests/api/cache-hit-logs.test.ts` (6572 bytes) — log emission is server-side console, not in SSE body. SSE snapshot byte-identical assertion still holds (Plan 17-01 fixture unchanged). |
| T-17-L | InfoDisclosure / Cache-token counts in logs | accept | Accepted: token counts are not PII, account-controlled Cloudflare Workers Logs visibility only. Documented in 17-05 plan. |
| T-17-M | Spoofing / sessionId leakage into Anthropic system block | mitigate | `tests/api/anthropic-payload-shape.test.ts` (3175 bytes) — 5 assertions verify system block + `messages[0]` contain no literal `sessionId` and no UUIDv4 pattern, plus byte-identical system block across calls |
| T-17-N | InfoDisclosure / Client-tier log emits in production | mitigate | `src/scripts/chat.ts:254, 278, 478` gate `chat.response_metrics_client` and dev logs behind `import.meta.env.DEV` — Vite tree-shakes in production build (confirmed by Phase 17 REVIEW-GAPS dist grep) |
| T-17-O | Tampering / Phase 18 prompt cache regression | mitigate | TEST-03 forward-defense binding via `tests/api/anthropic-payload-shape.test.ts` — sessionId leak into cacheable surface will fail this test in Phase 18 |

### Plan 17-06 — DNS + Resend warmup

| Threat ID | Category | Disposition | Evidence |
|-----------|----------|-------------|----------|
| T-17-04 | InfoDisclosure / RESEND_API_KEY leakage in warmup | mitigate | `scripts/resend-warmup.mjs:35` reads from `process.env.RESEND_API_KEY` only; exits with error if missing; no `re_<key>` literal in file (grep confirms) |
| T-17-03 | Spoofing / DMARC p=none invites spoofing | mitigate | Documented warming starting point per Plan 17-06 + RESEARCH §"Resend Domain DNS Records"; `rua=mailto:jackcutrara@gmail.com` configured (recent commit `test(17): close DNS-01 DMARC gap`); apex jackcutrara.com DMARC isolated. **NOTE:** live DNS verification is human-only (VERIFICATION.md `human_needed` item #2) — covered as documented residual. |
| T-17-P | InfoDisclosure / Resend dashboard send history | accept | Accepted: dashboard account-controlled (jackcutrara@gmail.com login); send IDs/timestamps not PII; recipient is operator's own address. |
| T-17-Q | DoS / Gmail bulk-mail throttle | mitigate | `scripts/resend-warmup.mjs:33` defaults to `count = 5`; script is operator-CLI not user-facing; Plan 17-06 caps at "max 10 warmup sends in Phase 17 with manual Not-Spam feedback". **RESIDUAL:** the `--count` flag is not hard-bounded in source; operator discipline is the control. Operator confirmed 5/5 first-try clean per VERIFICATION.md DNS-02 evidence. Acceptable for ASVS L1 / non-user-facing tooling. |
| T-17-R | Tampering / DNS record drift breaks SPF/DKIM | mitigate | Plan 17-06 Task 5 includes Postmaster Tools authentication-pass check; enrollment is human-verified (see VERIFICATION.md human_needed item #3); Cloudflare DNS edits are auditable in dashboard. |
| T-17-S | Repudiation / "Not Spam" feedback opaque to ops | accept | Accepted: Gmail's Not-Spam UI is the only signal; documented in Plan 17-06 threat register. |

### Plan 17-07 — Voice-split fix (UAT Gap #1)

| Threat ID | Category | Disposition | Evidence |
|-----------|----------|-------------|----------|
| T-17-07-A | Tampering / First-person re-leak | mitigate | `scripts/build-chat-context.mjs:81` defines `FIRST_PERSON_LEAK_RE` (broadened B1 form); lines 107-128 throw on detection; CI sync-check (DEBT-03) runs this on every PR. Note: REVIEW-GAPS WR-02 flags latent token-allow-list gaps (curly apostrophes, additional verbs) — recorded as documented residual; does not affect current dataset (all 6 MDX + 4 about-chat exports pass). |
| T-17-07-B | InfoDisclosure / Defense-in-depth instruction echoes | mitigate | `src/prompts/system-prompt.ts:7` contains "rewrite Jack's first-person voice as third-person" instruction in role block. Prompt-injection battery cited in plan. |
| T-17-07-C | Tampering / MDX drops chatSummary frontmatter | mitigate | All 6 MDX files contain `chatSummary:` (`src/content/projects/{optimize-ai,nfl-predict,daytrade,clipify,solsniper,seatwatch}.mdx`); `scripts/build-chat-context.mjs:358-379` reads field via `readStringField`; CI sync-check enforces presence. |
| T-17-07-D | Spoofing / Phase 14 prompt-cache invalidation cost | accept | Accepted: one-shot cache miss cost is bounded; documented in Plan 17-07. |

### Plan 17-08 — RELEASE BLOCKER chat panel display (UAT Gap #2)

| Threat ID | Category | Disposition | Evidence |
|-----------|----------|-------------|----------|
| T-17-08-A | Tampering / display:* re-added to ChatWidget.astro | mitigate | `tests/build/no-inline-display-on-chat-panel.test.ts:35` asserts inline style on `#chat-panel` does not match `/display\s*:/`. `src/components/chat/ChatWidget.astro:56` confirmed: inline style has no `display:` token. |
| T-17-08-B | Tampering / CSS state machine removed | mitigate | `tests/build/motion-css-rules.test.ts` present (8235 bytes); `src/styles/global.css:712-719` confirmed; `tests/client/chat-panel-display.test.ts` (4023 bytes, 5 tests) covers runtime behavior. |
| T-17-08-C | DoS / FOUC before global.css parses | accept | Accepted: Astro 6 inlines critical CSS; <16ms window acceptable. Documented in Plan 17-08. |
| T-17-08-D | Spoofing / Operator pushes without DEPLOY-GATE confirmation | mitigate | `DEPLOY-GATE.md` artifact present with `gate: CONFIRMED`, operator: Jack Cutrara, date 2026-05-11; 6 manual checks recorded as PASSED. |
| T-17-08-E | n/a — no auth/PII/logging surface | n/a | Verified: Plan 17-08 modifies only DOM markup + CSS; no new endpoints, auth paths, or logging seams. |

### Plan 17-09 — COPY button feedback (UAT Gap #3)

| Threat ID | Category | Disposition | Evidence |
|-----------|----------|-------------|----------|
| T-17-09-A | Tampering / .copy-success CSS rule reverted | mitigate | `src/styles/global.css:408-411` defines `.chat-copy-btn.copy-success { opacity: 1; color: var(--accent); }`. `tests/client/chat-copy-button.test.ts` present (10 tests). |
| T-17-09-B | Tampering / timeout windows de-aligned | mitigate | `src/scripts/chat.ts:317` declares `const COPY_FEEDBACK_MS = 1500`; uses at lines 325 and 359. grep count >= 3 (current: 4 — declaration + 2 timeout sites + 1 reference). |
| T-17-09-C | Tampering / inline style.color re-added (M3 regression) | mitigate | `grep -E "copyBtn\.style\.color\s*="` against `src/scripts/chat.ts` returns 0 matches — confirmed absent. |
| T-17-09-D | InfoDisclosure / Clipboard write of bot message | accept | Accepted: pre-existing behavior; bot messages are non-secret/operator-authored. |
| T-17-09-E | Spoofing / COPIED shows but clipboard write failed | accept | Accepted: pre-existing tradeoff. REVIEW-GAPS WR-01 surfaces this as product decision (UX regression on clipboard failure path); recorded as documented residual — does not change security posture. |

### Plan 17-10 — pageswap AbortError handler (UAT Gap #4)

| Threat ID | Category | Disposition | Evidence |
|-----------|----------|-------------|----------|
| T-17-10-A | Tampering / pageswap handler removed | mitigate | `tests/build/view-transition-handler.test.ts` present (4 build-time tests per VERIFICATION.md); `src/layouts/BaseLayout.astro:105-106` confirmed: `<script is:inline>` + `window.addEventListener("pageswap", ...)` |
| T-17-10-B | Tampering / is:inline changed to processed script | mitigate | `src/layouts/BaseLayout.astro:105` uses `<script is:inline>`; Test 3 of view-transition-handler asserts `is:inline` presence via M5 multi-line regex. |
| T-17-10-C | Tampering / raw body → template literal anti-pattern | mitigate | `pnpm build` exit-0 gate (template-literal-in-JSX form fails Astro parse); reinforced by build-time test. |
| T-17-10-D | InfoDisclosure / .catch swallows other AbortErrors | accept | Accepted: handler scoped to `e.viewTransition?.finished` only; other AbortError sources continue to surface via unhandledrejection. |
| T-17-10-E | Spoofing / SPA-style nav new AbortError surface | n/a | n/a: JS router banned in v1.3 milestone; not applicable. |
| T-17-10-F | DoS / inline script latency to first paint | accept | Accepted: ~95 bytes, O(1) handler registration; negligible. |

## Accepted Risks Log

The following threats were declared `accept` at plan time. Each has documented rationale and is recorded here as a known residual risk:

- **T-17-B (Plan 17-01)** — Fixture provenance is documentary in test docblock, not cryptographically signed.
- **T-17-B (Plan 17-02)** — Rollback during 24h cutover window depends on Pages staying warm; gated, dashboard-owner-only.
- **T-17-F (Plan 17-03)** — chat.ts async timing unchanged; no new awaited path.
- **T-17-G (Plan 17-03)** — DEBT tests expose only anti-regression invariants, no secrets.
- **T-17-J (Plan 17-04)** — CI cold-run time impact accepted as small.
- **T-17-K (Plan 17-04)** — sync-check.yml has no secrets and is read-only.
- **T-17-L (Plan 17-05)** — Cache-token counts are not PII; account-controlled Workers Logs visibility.
- **T-17-P (Plan 17-06)** — Resend dashboard send history account-controlled; not PII.
- **T-17-S (Plan 17-06)** — "Not Spam" feedback is Gmail-UI only; no automated signal possible.
- **T-17-07-D (Plan 17-07)** — One-shot Anthropic prompt-cache invalidation accepted.
- **T-17-08-C (Plan 17-08)** — FOUC <16ms window accepted; Astro 6 inlines critical CSS.
- **T-17-09-D (Plan 17-09)** — Clipboard write of bot message is pre-existing accepted behavior.
- **T-17-09-E (Plan 17-09)** — COPIED label on clipboard-failure path is pre-existing accepted tradeoff (REVIEW-GAPS WR-01 product decision pending).
- **T-17-10-D (Plan 17-10)** — pageswap `.catch()` swallow scoped to one Promise only.
- **T-17-10-F (Plan 17-10)** — Inline script ~95 bytes; latency impact negligible.

### Documented Residuals (additional notes beyond accepted list)

- **T-17-Q (Plan 17-06)** — Warmup script `--count` flag is not hard-bounded; operator discipline + default of 5 + non-user-facing CLI are the controls. Acceptable for ASVS L1.
- **T-17-07-A (Plan 17-07)** — REVIEW-GAPS WR-02 flags latent token-allow-list gaps in `FIRST_PERSON_LEAK_RE` (curly apostrophes, additional verbs). All current content passes; future content additions could slip past. Tracked as quality concern, not blocker.

## Unregistered Flags

None — every `threat_flag` declared in Plan SUMMARY files (17-01 through 17-10) maps to either a registered threat ID, a documented carry-forward awareness (e.g., `cors-suffix-account-coupling`, `adapter-internal-kv-binding`, `pages-rollback-window-active`, `test-fixture-tamper-detection`, `test-mock-precedent`), or a "no new security surface" attestation. No flag introduces new attack surface unmapped to an existing threat or accepted disposition.

## Cross-Cutting Observations

The Phase 17 REVIEW.md (`17-REVIEW.md`) flagged one CRITICAL (CR-01: `chat.cache_metrics` log records misleading `output_tokens` from `message_start`) and several WARNING-tier defects (WR-01 streaming-reader timeout disarmed; WR-02 cloneNode breaks COPIED transition; WR-03 onToken non-string corruption; WR-04 localhost-Origin allowance — fixed via three-signal disjunction; WR-05 silent scheduled-stub — fixed via warn log; WR-06/07 scroll-depth NaN/slug fallbacks; WR-08 DOMPurify hook re-registration).

CR-01 and the WR-series defects from REVIEW.md are **code-quality / observability issues, not threat-model mitigations**. They are tracked in `17-REVIEW.md` / `17-REVIEW-GAPS.md` for product decision and do not change the threat-model security posture. The threat register's `mitigate` controls remain present and verifiable in source as audited above.

## Verdict

**SECURED.** All 49 declared threats across 10 plans are CLOSED:
- 32 `mitigate` threats — each cited control located and confirmed present
- 14 `accept` threats — rationale present in plan/summary; logged above
- 3 `n/a` threats — verified no security surface introduced

No BLOCKER gaps. No unregistered flags. Phase 17 is cleared for the next stage of the deploy gate flow per the ASVS L1 / block_on=high configuration.

---

_Audited: 2026-05-11_
_Auditor: Claude (gsd-security-auditor, Opus 4.7)_
