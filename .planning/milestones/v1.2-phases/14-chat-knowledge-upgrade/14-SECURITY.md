---
phase: 14
slug: chat-knowledge-upgrade
status: verified
threats_open: 0
asvs_level: 1
created: 2026-04-23
---

# Phase 14 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail. Phase 14 replaced the chat widget's hard-coded profile blob with a retrieval-grounded system driven by MDX content and a build-time-generated knowledge JSON, tightened injection/PII defense at the system-prompt layer, and added operational guardrails (token ceilings, KV edge cache, 30-second deadline, cache_control on system block). This document consolidates the threat registers from plans 14-01 through 14-07 and anchors each threat's disposition to evidence in `14-VERIFICATION.md` and the test suite.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| `Projects/*.md` + `src/content/projects/*.mdx` → `scripts/build-chat-context.mjs` | Untrusted author content crosses into the chat knowledge base at build time — allow-list, path-escape guard, and Projects/7 regex guard are the mitigations. | Markdown / MDX source text |
| Build-time generator output → chat runtime | `src/data/portfolio-context.json` is committed at build time and imported as a static JSON literal by `system-prompt.ts` at runtime — byte determinism is the cache-invariance mitigation. | Canonical knowledge block |
| Runtime (`src/pages/api/chat.ts`) → Anthropic API | System prompt sent wholesale with `cache_control: { type: "ephemeral" }`; Haiku 4.5 caches the block above the breakpoint — token-floor ≥4096 is the cache-enable mitigation. | System prompt + user messages |
| Chat endpoint → caller (browser) | SSE streaming with `Content-Type: text/event-stream` + `Content-Encoding: none`; CORS exact-origin; sanitization; rate-limit code path preserved from Phase 7. | SSE frames: `{text}`, `[DONE]`, `{truncated}` |
| Fixture (`tests/fixtures/chat-eval-dataset.ts`) ↔ system prompt (`src/prompts/system-prompt.ts`) | Two files must agree on D-16 refusal copy byte-for-byte; drift-guard tests lock them bidirectionally. | Refusal copy literals |

---

## Threat Register

Consolidated across plans 14-01 through 14-07. The seven headline threats in `14-SUMMARY.md` (INJECTION, EXFIL, DOS, HANG, COST, STALE, PII) map to the STRIDE register IDs in the plan frontmatter. Gap-closure plan 14-07 added five scoped threats around the `max_tokens` raise and `message_delta` observability branch.

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-14-INJECTION | Elevation of Privilege | `src/prompts/system-prompt.ts` `<security>` block + `tests/api/prompt-injection.test.ts` + `tests/fixtures/chat-eval-dataset.ts` | mitigate | D-17 attack-pattern list inside `<security>`; D-21 GLOBAL_BANNED_STRINGS gate (`<role>`, `<knowledge>`, `cache_control`, `system_prompt`, etc.); 36 CI tests across 3 describe blocks (10 D-22 vectors + history-poisoning + 17 buildSystemPrompt contract + 8 drift-guard); fixture↔prompt refusal-copy drift guard. Live-model sanity (8 preview prompts, 2026-04-23): 5 PASS + 3 NOTE + 0 FAIL. | closed |
| T-14-EXFIL | Tampering / Information Disclosure | `scripts/build-chat-context.mjs` allow-list + `tests/build/chat-context-integrity.test.ts` | mitigate | Generator derives inputs via MDX `source:` allow-list (D-04); regex banlist (`/MULTI[- ]?DEX/i` + 3 variants) rejects Projects/7 leak; path-escape guard `sourceAbs.startsWith(PROJECT_ROOT + sep)` throws before any readFile; integrity test asserts `JSON.stringify(portfolioContext)` contains zero banlist matches; draft-MDX exclusion in snapshot builder (D-06). | closed |
| T-14-DOS | Denial of Service | `src/pages/api/chat.ts` rate-limiter call path (byte-identical to Phase 7) | mitigate | Rate-limit code path at `src/pages/api/chat.ts:31-45` preserved byte-for-byte from Phase 7. `tests/api/security.test.ts` 12 tests GREEN assert CORS exact-origin + body-size guard. **Pre-existing binding gap:** the Cloudflare `CHAT_RATE_LIMITER` binding is missing in Production and Preview (`if (rateLimiter)` defensive skip at line 36 means requests are not limited). Tracked as deferred todo `.planning/todos/pending/2026-04-23-configure-chat-rate-limiter-binding.md`. Phase 14 did not regress this code path — see Accepted Risks. | closed |
| T-14-HANG | Denial of Service | `src/pages/api/chat.ts` AbortController timeout | mitigate | 30-second AbortController wired at Astro-endpoint layer (not SDK layer) so the budget also covers KV cache lookups, content-snapshot access, and streaming finalization. Verified 2026-04-23 via Chrome DevTools throttle on preview (`phase-14-preview.portfolio-5wl.pages.dev`): request canceled at ~30s; error message surfaced; UI not stuck (14-VERIFICATION.md §Verification Table row 4). | closed |
| T-14-COST | Information Disclosure / Cost drift | `scripts/build-chat-context.mjs` token-floor + `tests/build/chat-context-integrity.test.ts` | mitigate | Build-integrity test asserts `estimateTokens(JSON.stringify(portfolioContext)) >= 4096` (Haiku 4.5 cache floor per AI-SPEC §3 pitfall #1). Current output 49,005 tokens (12× floor). Context-builder per-project excerpt cap at 400 chars (D-03); selection budget `floor(2000 / max(selected, 1))`. Gap-closure 14-07 raised `max_tokens` 768 → 1500 — capped 6.5× under Haiku's 8192 ceiling and bounded by the system prompt's `<constraints>` 2–4-paragraph directive; negative-guard assertion rejects future reverts to 512 or 768. | closed |
| T-14-STALE | Tampering | `src/lib/chat-cache.ts` + `tests/api/chat-cache.test.ts` | mitigate | Cache key = SHA-256 over `(normalized_prompt, snapshot_hash, system_prompt_hash)` — deterministic 64-char hash; including the system-prompt hash preemptively invalidates on prompt-engineering tweaks. 5-minute KV TTL; cache-busts-on-edit test asserts snapshot hash change invalidates key. CRLF normalization `s.replace(/\r\n/g, "\n")` applied on every generator file read (Windows author; prevents silent local-vs-CI drift). Generator uses deterministic ordering (localeCompare on `.page`, JSON.stringify with fixed key order, trailing newline preserved); `pnpm build:chat-context:check` asserts byte-identical re-run. | closed |
| T-14-PII | Information Disclosure / Spoofing (voice drift) | `src/prompts/system-prompt.ts` `<security>` tier 1 + `tests/fixtures/chat-eval-dataset.ts` GLOBAL_BANNED_REGEXES | mitigate | D-16 tier 1 RESUME_REFUSAL (`/jack-cutrara-resume.pdf`) is the only response to PII probes; resume PDF text excluded from knowledge base per D-05 (generator excludes `public/*.pdf`); GLOBAL_BANNED_REGEXES includes phone regex `/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/` + street-address regex. Third-person biographer voice enforced via 17-test buildSystemPrompt contract block (first-person regex negated). Live-model sanity 2026-04-23 vectors 4 + 5 PASS with verbatim RESUME_REFUSAL. | closed |
| T-14-07-01 | Information Disclosure | `console.warn("chat.truncated", payload)` in `src/pages/api/chat.ts` | mitigate | Logged payload contains only `{ stop_reason: "max_tokens" }` — no user message text, no IP, no timestamp, no message count. Cloudflare Workers log retention is operator-only. Reviewed inline in 14-07 Task 2. | closed |
| T-14-07-02 | Tampering | `src/prompts/chat-request-shape.ts:33` `max_tokens` literal | mitigate | Negative-guard assertion in 14-07 Task 1 rejects future `max_tokens: 768`; pre-existing guard rejects `max_tokens: 512`. Any accidental revert fires CI. | closed |
| T-14-07-03 | Denial of Service | `src/prompts/chat-request-shape.ts:33` `max_tokens: 1500` | accept | 1500 is 6.5× under Haiku 4.5's 8192 ceiling. Anthropic bills on actual output tokens generated, not `max_tokens`; system prompt's `<constraints>` block still governs actual reply length at 2–4 paragraphs. Cost impact: negligible (<$0.002 per truncated→full reply, amortized across months of traffic). See Accepted Risks. | closed |
| T-14-07-04 | Tampering | `src/pages/api/chat.ts` new `message_delta` branch | mitigate | Branch reads `event.delta.stop_reason` typed `StopReason \| null` on `@anthropic-ai/sdk@0.82.0` — a future SDK shape change surfaces as a TypeScript error at `pnpm check`, caught before deploy. No runtime cast, no `as unknown as`. | closed |
| T-14-07-05 | Denial of Service | `src/scripts/chat.ts` consumer (Phase 7 client parser) | accept | Client parser tolerates unknown JSON keys (extracts `text` / `error` / `[DONE]`, ignores everything else). No client-side code change required for 14-07; a future user-facing "response was truncated" hint is a separate Phase 16+ enhancement. See Accepted Risks. | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-14-01 | T-14-DOS | Pre-existing Phase 7 binding gap — `CHAT_RATE_LIMITER` Cloudflare binding never configured on Production or Preview. Phase 14 did not introduce or regress this gap; rate-limiter code path is byte-identical to Phase 7. Remediation is configuration-only (Pages dashboard → Functions → Bindings → Rate limiting, key=IP, limit=5/60s) and tracked in `.planning/todos/pending/2026-04-23-configure-chat-rate-limiter-binding.md`. Practical exposure is low for a portfolio site; traffic is well below abusable thresholds and Anthropic spend is further bounded by T-14-COST mitigations. | Jack Cutrara | 2026-04-23 |
| AR-14-02 | T-14-07-03 | `max_tokens: 1500` raised from 768 to eliminate truncation of grounded project answers. 6.5× under Haiku 4.5's 8192 ceiling; Anthropic bills actual output tokens, not the ceiling; `<constraints>` block caps replies at 2–4 paragraphs. Per-request cost impact <$0.002 even in the worst truncated→full case. | Jack Cutrara | 2026-04-23 |
| AR-14-03 | T-14-07-05 | No user-facing truncation hint in client parser — Phase 7 parser already tolerates unknown JSON keys (`{truncated:true}` is a no-op for legacy paths). A visible hint is a UX enhancement deferred to Phase 16+; current behavior degrades gracefully. | Jack Cutrara | 2026-04-23 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-04-23 | 12 | 12 | 0 | `/gsd-secure-phase 14` (source: `14-VERIFICATION.md` §Threat Retirement + plan 14-01..14-07 STRIDE registers) |

Evidence anchors:

- `14-VERIFICATION.md` §Threat Retirement — 7/7 plan-level threats (T-14-CACHE, T-14-PERSONA, T-14-INJECTION, T-14-PII-LEAK, T-14-BUILD, T-14-REGRESSION, T-14-DATA-INTEGRITY) marked RETIRED with cited test evidence. The seven headline IDs in this SECURITY.md (INJECTION, EXFIL, DOS, HANG, COST, STALE, PII) are the `14-SUMMARY.md` consolidation of the same verified mitigations.
- `tests/api/prompt-injection.test.ts` — 36 tests GREEN (T-14-INJECTION, T-14-PII).
- `tests/api/chat.test.ts` SDK-request-shape block — 5 tests GREEN (T-14-COST cache_control + T-14-07-02 max_tokens guards).
- `tests/build/chat-context-integrity.test.ts` — 9 tests GREEN (T-14-EXFIL banlist, T-14-COST token floor, T-14-STALE determinism).
- `tests/api/security.test.ts` — 12 tests GREEN (T-14-DOS CORS + body-size).
- `tests/api/chat-cache.test.ts` — KV snapshot-hash cache-busts test (T-14-STALE).
- `tests/client/markdown.test.ts` — 12 tests GREEN (XSS sanitization, Phase 7 carry-forward).
- Live-model sanity (preview `phase-14-preview.portfolio-5wl.pages.dev`, 2026-04-23): 8 prompts → 5 PASS + 3 NOTE + 0 FAIL; zero banned-substring leaks; zero injection compliance (T-14-INJECTION behavioral confirmation).
- Full suite at phase close: 222/222 vitest GREEN across 26 test files; `pnpm check` clean.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-04-23 (Jack Cutrara; source evidence `14-VERIFICATION.md` sign-off 2026-04-23, commit 4424d9f)
