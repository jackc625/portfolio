---
phase: 25
slug: chat-knowledge-refresh-milestone-verification
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-07-14
---

# Phase 25 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

Register origin: **authored at plan time** (all 5 PLAN files carried a `<threat_model>` block). ASVS L1 grep-depth verification; `threats_open: 0` with `register_authored_at_plan_time: true` → auditor short-circuit applied. All mitigations independently re-confirmed against `25-VERIFICATION.md` (17/17 must-haves, HEAD `c393a9e`).

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| visitor → chat API | Untrusted user messages reach `buildSystemPrompt`; the prompt-injection battery + system-prompt `<security>` block are the guard | User-supplied chat text (untrusted) |
| build sources → cached `<knowledge>`/`<security>` blocks | Corpus + prompt template become the cached, model-visible system blocks | Public portfolio content, SSoT education/experience |
| authored copy → cached `<role>`/`<knowledge>` | chatSummary + about-chat + static identity become cached positioning; the voice-split leak guard enforces third-person | Third-person chat copy (public) |
| phase-start tree → committed baseline | SHA-256 fingerprint of the four D-14 gated files + normalized deps is the tamper anchor the capstone verifier compares against | File hashes, dependency manifest |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-25-00 | Tampering | Four D-14 gated chat-surface files (`BaseLayout.astro`/`global.css`/`chat.ts`/`api/chat.ts`) | medium | mitigate | Phase-start SHA-256 baseline (`25-BASELINE.json`) + `scripts/verify-phase25-invariants.mjs` capstone verifier catches ANY committed drift across 25-01..25-03 (committed-drift-proof, not a working-tree diff). Verifier exits 0; `git diff` across full 25-00..25-04 range touches zero bytes of the four files (VERIFICATION items 3, 5, 6). | closed |
| T-25-01 | Information disclosure (prompt injection) | `src/prompts/system-prompt.ts` `<security>` block + prompt-injection battery | medium | mitigate | Only the over-broad #7 topic-ban sentence removed (a reduction of a content restriction, not a security weakening); tiered-refusal, attack-pattern list, PII/resume tiers, and framing-tag suppression preserved byte-intact. Normalized `<security>`-block byte-intact snapshot proves the edit is EXACTLY the one sentence; live exfiltration + PII probes refused cleanly (VERIFICATION items 9, 11; 25-04 SUMMARY security probes). | closed |
| T-25-02 | Tampering (voice break) | `FIRST_PERSON_LEAK_RE` + structured experience-array walk (`build-chat-context.mjs`, about-chat/chatSummary) | medium | mitigate | 4-field leak-walk sweeps every serialized experience field + never-begins-I/My guard; `FIRST_PERSON_LEAK_RE` extended (interned/coordinated) byte-identical across all 3 sites; recursive reader fails CLOSED (exit 2); `build:chat-context` exit 2 hard-fails the build on any leak. B1 samples ("I interned"/"I coordinated") match (VERIFICATION items 8, 15). | closed |
| T-25-03 | Repudiation / accuracy | #7 (Multi-Chain EVM) chatSummary — returns/profit claims | medium | mitigate | No-returns discipline carried into chat copy; #7 `caseStudy` explicitly states "Jack makes no claims about returns or profit here"; human-reviewed at the 25-02 checkpoint and re-confirmed in live UAT (VERIFICATION item 10; 25-04 human sign-off). | closed |
| T-25-05 | Spoofing / Info disclosure (SSE regression) | `api/chat.ts` SSE frames | low | mitigate | `tests/api/sse-snapshot.test.ts` asserts byte-identical SSE frames + headers (3/3 pass); the 25-00 hash verifier proves `api/chat.ts` is byte-identical to the phase-start baseline (D-15/D-14 — no api/chat.ts change) (VERIFICATION item 3). | closed |
| T-25-SC | Tampering (supply chain) | `package.json` dependencies | low | mitigate | QA-02 dep-lock: the 25-00 hash verifier asserts the normalized dependencies object is byte-identical to the phase-start baseline (committed-drift-proof); zero packages installed this phase; no `[ASSUMED]`/`[SUS]` packages; verifier is dep-free (Node built-ins only) (VERIFICATION items 4, 6). | closed |
| T-25-04 | Denial of service (token blowup) | Chat corpus token budget | low | accept | D-10: accept corpus growth to ~48-49k est_tokens; INFO/WARN/CAP observability prints it. Measured est_tokens = 48,735 — under the 60k WARN threshold and above the 4,096 Haiku cache floor (VERIFICATION item 16). See Accepted Risks Log. | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on (high) count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-25-01 | T-25-04 | Corpus token growth to ~48.7k est_tokens (from #7 + experience array + SSoT education) is bounded well under the 60k WARN threshold and above the 4,096 Haiku cache floor; INFO/WARN/CAP observability surfaces it. Revisit only if a future estimate crosses WARN. | Jack Cutrara | 2026-07-14 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-07-14 | 7 | 7 | 0 | gsd-secure-phase (L1 grep-depth, auditor short-circuit) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-07-14
