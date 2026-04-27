---
phase: 15-analytics-instrumentation
audit_date: 2026-04-26
auditor: gsd-security-auditor
asvs_level: baseline
block_on: high
threats_total: 19
threats_closed: 19
threats_open: 0
verdict: SECURED
---

# Phase 15 — Security Audit (Analytics Instrumentation)

Verifies every threat in the cumulative Phase 15 register (5 plans, 19 entries) against the implemented code. Each `mitigate` disposition is verified by grep against the cited file/line. Each `accept` disposition is recorded in the Accepted Risks Log below. The phase is **client-only by design (D-15)**; the server file `src/pages/api/chat.ts` is byte-identical phase-wide.

## Audit Scope

- **Plans audited:** 15-01, 15-02, 15-03, 15-04, 15-05
- **Implementation files (read-only):** `src/scripts/analytics.ts`, `src/scripts/scroll-depth.ts`, `src/scripts/chat.ts` (lines 195-202 only — Phase 15 diff site), `src/layouts/BaseLayout.astro`, `src/pages/api/chat.ts` (integrity check), `src/pages/projects/[id].astro`
- **Threat register source:** PLAN.md `<threat_model>` blocks across 15-01..15-05, plus the cumulative retirement table in 15-VERIFICATION.md §8 / 15-05-SUMMARY.md
- **Method:** grep evidence, git history evidence, scope/route inventory; documentation alone is not accepted as evidence for `mitigate` items

## Threat Verification

| Threat ID | Category | Disposition | Verdict | Evidence |
|-----------|----------|-------------|---------|----------|
| T-15-01 | Information Disclosure (chat payload drift) | mitigate | CLOSED | `src/scripts/analytics.ts:82-85` — `handleChatAnalytics(detail)` reads only `detail.action` + optional `detail.label`; `timestamp` is dropped at the type signature level (no `timestamp` reference in body) |
| T-15-02 | Integrity (Umami loading on non-prod) | mitigate | CLOSED | `src/layouts/BaseLayout.astro:93` — `{import.meta.env.PROD && (` static-replacement gate; line 94 includes `data-domains="jackcutrara.com"` (vendor-side hostname allow-list, second filter) |
| T-15-03 | Tampering (SSE truncated frame injection) | mitigate | CLOSED | `src/scripts/chat.ts:199` — strict equality `if (parsed.truncated === true) {` (NOT truthy coercion); grep returns exactly 1 match. Followed by `continue` (line 201) to skip undefined-token render path |
| T-15-04 | Information Disclosure (href query/fragment leak) | mitigate | CLOSED | `src/scripts/analytics.ts:54, 59, 72` — all three return paths assemble `${hostname}${pathname}` only; `url.search` and `url.hash` are never read in the module |
| T-15-04b | Information Disclosure (mailto: email leak) | mitigate | CLOSED | `src/scripts/analytics.ts:31` — hardcoded literal `return { type: "email", href: "mailto" };` BEFORE any URL parse. `grep -c "jackcutrara@gmail.com" src/scripts/analytics.ts` = 0 (verified) |
| T-15-05 | Information Disclosure (resume double-count) | mitigate | CLOSED | `src/scripts/analytics.ts:117-120` — `if (url.pathname.toLowerCase() === "/jack-cutrara-resume.pdf")` early-return BEFORE `classifyOutbound(href)` call at line 126. Branch ordering verified by reading code |
| T-15-06 | Tampering (Umami JS supply-chain) | accept | CLOSED | Documented in Accepted Risks Log §A1. `grep -c "integrity=" src/layouts/BaseLayout.astro` = 0 (no SRI hash; expected per acceptance) |
| T-15-07 | Information Disclosure (CF auto-inject silent fail) | accept | CLOSED | Documented in Accepted Risks Log §A2. Fallback path pre-approved; post-deploy curl check pending (15-VERIFICATION.md §5.1) |
| T-15-07b | Repudiation (truncated message correlation) | accept | CLOSED | Documented in Accepted Risks Log §A3. Phase 7 D-36 content-free contract preserved by `handleChatAnalytics` not forwarding any user-content fields |
| T-15-08 | Spoofing (sentinel injection pollution) | accept | CLOSED | Documented in Accepted Risks Log §A4. Same-origin DOM access; no security boundary |
| T-15-09 | Information Disclosure (slug leaking private routes) | mitigate | CLOSED | Sentinel inventory: `grep -r "scroll-sentinel" src/` returns matches in only 2 files: `src/scripts/scroll-depth.ts` (CSS selector strings — observer code) and `src/pages/projects/[id].astro` (4 markup occurrences at lines 84-87). Zero draft/admin/internal routes carry sentinels |
| T-15-10 | Denial of Service (observer leak) | mitigate | CLOSED | `src/scripts/scroll-depth.ts:37` `let scrollDepthInitialized = false`; line 40 guard check; line 43 set-true; line 34 `observer.unobserve(entry.target)` on fire. Recent WR-01 fix commits (1ecd516, 70b42d5, 8da5134) added bootstrap-level guards too |
| T-15-11 | Denial of Service (chat_truncated flood, same-origin) | accept | CLOSED | Documented in Accepted Risks Log §A5. Subsumed by T-15-spoof same-origin class |
| T-15-D15-integrity | Integrity (accidental server edit) | mitigate | CLOSED | `git log --since="2026-04-20" --name-only -- src/pages/api/chat.ts` returns nothing. Most recent commit touching `src/pages/api/chat.ts` is `7726fb2` (Phase 14-07, pre-Phase-15). Zero Phase 15 commits modified the server file. D-15 hard gate held |
| T-15-12 | Repudiation (Umami UUID swap missed) | mitigate | CLOSED | `src/layouts/BaseLayout.astro:47` — `const WEBSITE_ID = "32f8fdf4-1f21-4895-9e4c-938285c08240";` (literal UUID present, no placeholder). Grep confirms 1 match for the UUID; 0 matches for `TODO_PHASE_15_UMAMI_ID` |
| T-15-13 | Integrity (pre-marked sign-off) | accept | CLOSED | Documented in Accepted Risks Log §A6. Solo-dev/Claude workflow; empty-checkbox scaffold integrity at commit time confirmed in 15-VERIFICATION.md (sign-off boxes for §§4-7, 9 still `[ ]` at audit time) |
| T-15-spoof | Spoofing (fake chat:analytics events) | accept | CLOSED | Documented in Accepted Risks Log §A7. Same-origin script execution is not a security boundary; no PII or credential surface at risk |
| T-15-input | Input Validation (malformed href crashes classifier) | mitigate | CLOSED | `src/scripts/analytics.ts:36-43` — `new URL(href, ...)` wrapped in `try { } catch { return null; }`. Click listener at lines 115-123 also wraps the resume-pdf URL parse in try/catch. Degrades gracefully; no exception propagates |
| T-15-xss | XSS (sentinel divs) | n/a | CLOSED | `src/pages/projects/[id].astro:84-87` — sentinel divs are empty: `<div class="scroll-sentinel" data-percent="N" aria-hidden="true"></div>`. No content surface; no user data flows through them. No XSS surface to defend |

**Verification totals:** 19/19 threats resolved. 12 mitigated by code, 7 accepted (documented below), 0 open.

## Accepted Risks Log

### A1. T-15-06 — Umami JS supply-chain

- **Source plan:** 15-01
- **Risk:** Compromise of `cloud.umami.is/script.js` (auto-updating vendor tracker) could inject malicious JS into every page load. SRI hash not feasible because Umami rolls fixes without coordinated hash rotation (15-RESEARCH.md §1.7).
- **Mitigating factors:** (1) Free-tier portfolio — low-value target. (2) No auth surface (no login, no payment, no PII). (3) Umami is owned by an active maintainer (Umami Software); a compromise would affect thousands of sites simultaneously and surface industry-wide. (4) Tag is PROD-only — local/preview builds carry no risk.
- **Code verification:** `grep -c "integrity=" src/layouts/BaseLayout.astro` = 0 (confirms no accidental SRI hash addition that would break tracker auto-updates).
- **Owner:** Jack
- **Re-evaluation trigger:** Add SRI if vendor announces stable hash rotation policy, OR site adds auth/payment/PII surface.

### A2. T-15-07 — CF Web Analytics auto-inject silent fail

- **Source plan:** 15-01
- **Risk:** Cloudflare Web Analytics auto-inject has community-reported regressions (15-RESEARCH.md §4.5, MEDIUM confidence) — beacon may not appear on the production HTML.
- **Mitigation path:** D-04 fallback path (explicit `<script>` in BaseLayout with same PROD gate) is pre-approved. 15-VERIFICATION.md §5.1 provides the post-deploy `curl -s https://jackcutrara.com/ | grep -c 'static.cloudflareinsights.com'` check; §5.2 documents fallback activation steps.
- **Owner:** Jack (post-deploy verification).
- **Status at audit:** awaiting production deploy + curl verification (verifier marked `[ ]` for §5.1 in 15-VERIFICATION.md sign-off table).

### A3. T-15-07b — Truncated message repudiation

- **Source plan:** 15-04
- **Risk:** A user could deny having sent the message that was truncated by the model.
- **Acceptance rationale:** `chat_truncated` is an operational metric (did a response hit the 1500-token cap?), not an audit log. Phase 7 D-36 content-free discipline means no user message text reaches Umami; correlating `chat_truncated` to a specific user session is not possible by design. No repudiation boundary crossed.
- **Code verification:** `handleChatAnalytics` at `src/scripts/analytics.ts:82-85` forwards only `action` + optional `label`; `chat.ts:200` dispatches `trackChatEvent("chat_truncated")` with no user-content arguments.

### A4. T-15-08 — Sentinel-injection scroll pollution

- **Source plan:** 15-03
- **Risk:** A malicious script with same-origin access could inject extra `.scroll-sentinel` elements to inflate the `scroll_depth` metric.
- **Acceptance rationale:** Same-origin script execution already grants full DOM access (cookies, localStorage, form inputs, all listeners). Planting fake sentinels is no worse than dispatching fake `chat_open` events. Recruiter dashboard trust assumes DOM integrity — no auth-bearing surface. Defense-in-depth: Umami dashboard event-flood detection would surface anomalous rates.
- **Owner:** Jack (dashboard observation).

### A5. T-15-11 — Same-origin chat_truncated flood

- **Source plan:** 15-04
- **Risk:** Same-origin script repeatedly dispatches `chat:analytics` with `action='chat_truncated'` to flood the dashboard.
- **Acceptance rationale:** Same class as T-15-spoof (any of the 6 chat actions). Not a new surface introduced by Phase 15.

### A6. T-15-13 — Pre-marked verification sign-off

- **Source plan:** 15-05
- **Risk:** Future contributor accidentally marks `15-VERIFICATION.md` sign-off without actually running checks.
- **Acceptance rationale:** Solo-dev + Claude workflow; no multi-author adversary model. Empty-checkbox-at-commit integrity is the bar — a reviewer sees `[ ]` and knows verification has not occurred.
- **Verification at audit time:** 15-VERIFICATION.md §10 sign-off has `[x]` only for items the verifier actually evidenced (§2 tests GREEN, §3 D-26 PASS, §1 UUID committed, §8 codebase-level threat retirement). All post-deploy checks (§§4-7, 9) remain `[ ]` — invariant holds.

### A7. T-15-spoof — Same-origin event spoofing

- **Source plan:** 15-02
- **Risk:** Malicious same-origin script dispatches fake `chat:analytics` events or synthetic clicks to pollute Umami.
- **Acceptance rationale:** Same-origin JS already has full DOM access — fake events in Umami are operational noise, not a security boundary. Phase 7 D-36 documented this as a loose contract by design. No PII or credential surface at risk.

## Unregistered Flags

The Phase 15 SUMMARYs (15-02-SUMMARY.md "Threat Surface Confirmation", 15-04-SUMMARY.md "Threat Surface Confirmation", 15-05-SUMMARY.md "Threat Surface Confirmation" + cumulative retirement table) enumerate all threat IDs already in the register. **No unregistered attack surface flags found.**

The 15-VERIFICATION.md §8 cumulative retirement table accounts for all 13 cardinal T-15 IDs (T-15-01..T-15-13 plus T-15-04b, T-15-D15-integrity). The plan-local IDs T-15-spoof, T-15-input, and T-15-xss are also accounted for above and explicitly mapped (T-15-xss is the empty-sentinel-divs n/a case).

## D-15 Server Byte-Identical Hard Gate

`git log --since="2026-04-20" --name-only -- src/pages/api/chat.ts` returns no commits. The most recent modification to `src/pages/api/chat.ts` is commit `7726fb2` (Phase 14-07, dated pre-Phase-15). The full Phase 15 commit set (15-01..15-05 plus the orchestrator UUID swap and WR-01 hygiene fixes) introduced zero touches to the server file. D-15 hard gate **HELD** phase-wide.

## Audit Notes

- **WR-01 hygiene fixes (commits 1ecd516, 70b42d5, 74ce54b, 8da5134) reinforce T-15-10:** these recent commits added bootstrap-level guards (`scrollDepthBootstrapped`, `analyticsBootstrapped`, `chatBootstrapped`) that prevent document listener pile-up across Astro view-transition lifecycle. Strengthens but does not change the disposition of T-15-10 (which is already CLOSED via the internal `scrollDepthInitialized` guard + `observer.unobserve` on fire).
- **T-15-12 production live verification still pending:** the UUID `32f8fdf4-1f21-4895-9e4c-938285c08240` is committed at the source and bakes into prerendered HTML (verified via dist artifact in 15-05-SUMMARY.md). The post-deploy Umami dashboard event-presence check (15-VERIFICATION.md §4) is human-required and remains `[ ]` — but this is a verification gap, not a code gap. The mitigation (UUID committed at the single source location) is verified.
- **No implementation modifications made by this audit.** Implementation files were read-only inspected; only `SECURITY.md` was created.

## Final Verdict

**Phase 15 — SECURED.** All 19 threat entries resolve to closed status (12 mitigated by code, 7 accepted with documented rationale). No open threats. No unregistered attack surface flags. Phase is cleared for production deploy from a security perspective; remaining `[ ]` items in 15-VERIFICATION.md are operational/post-deploy verification activities, not security gaps.

---

*Audit performed: 2026-04-26*
*Auditor: gsd-security-auditor*
*Method: grep + git history evidence; documentation alone not accepted as proof for `mitigate` dispositions*
