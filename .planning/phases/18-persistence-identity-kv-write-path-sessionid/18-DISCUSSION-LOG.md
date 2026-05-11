# Phase 18: Persistence + Identity — KV Write Path + sessionId - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-11
**Phase:** 18-persistence-identity-kv-write-path-sessionid
**Areas discussed:** sessionId lifecycle, 30-turn cap trim policy, KV write failure handling, Anthropic prompt-cache live verification

---

## sessionId lifecycle

### Q1: When should the client mint the sessionId — what does 'first chat open' mean in IDENT-01?

| Option | Description | Selected |
|--------|-------------|----------|
| On bubble click | Generate + persist BEFORE the panel opens; matches literal IDENT-01 phrasing | ✓ |
| On first message send | Lazy mint at submit; no orphan UUIDs for window-shoppers | |
| On script init (every page-load) | Mint at module load; simplest code path | |

**User's choice:** On bubble click
**Notes:** Locked as D-01 in CONTEXT.md. Window-shoppers get a UUID but no KV write fires (appendTurn only on real messages). Cross-visit continuity within 24h preserved.

---

### Q2: Where does the sessionId live in localStorage?

| Option | Description | Selected |
|--------|-------------|----------|
| Same blob (chat-history) | Extend ChatStorage to { version: 2, sessionId, messages, lastActive } | ✓ |
| Separate key (chat-session-id) | sessionId persists longer than 24h chat-history TTL | |
| sessionStorage (per-tab) | Per-tab mint, wipes on tab close | |

**User's choice:** Same blob
**Notes:** Locked as D-02. STORAGE_VERSION 1→2 wipe is the existing auto-clear path. Atomic state, one TTL clock.

---

### Q3: When same-blob 24h TTL expires, does the previous live:{old-sid} get special treatment?

| Option | Description | Selected |
|--------|-------------|----------|
| Nothing — 30d KV TTL is the only cleanup | Phase 19 cron sweep handles 2h inactivity; KV expirationTtl fires at 30d | ✓ |
| Client sends a 'session-ended' signal | New endpoint surface marks metadata as ended_by_client | |
| Client passes both old and new sid for one turn | Server could merge them | |

**User's choice:** Nothing — 30d KV TTL + Phase 19 sweep
**Notes:** Locked as D-03. Clean separation: client owns recent UI state, server owns transcript durability.

---

### Q4: Mint/persist failure — what happens?

| Option | Description | Selected |
|--------|-------------|----------|
| Silent fail — chat works, no transcript | Try/catch around mint; missing sessionId → server skips appendTurn, still serves stream | ✓ |
| Server-side mint fallback | Server mints if client omits; doesn't echo back | |
| Hard reject — require sessionId or 400 | Server returns 400 if missing | |

**User's choice:** Silent fail
**Notes:** Locked as D-04 — this is a SPEC AMENDMENT to IDENT-02. Original IDENT-02 said "rejects malformed" — now extended to "missing = allowed (skip appendTurn), malformed = 400." Chat surface always wins per D-26 invariant.

---

## 30-turn cap trim policy

### Q1: At turn 31 (cap exceeded), what should appendTurn do?

| Option | Description | Selected |
|--------|-------------|----------|
| Freeze at 30; set truncated=true; new turns dropped | Preserves opener; transcript immutable at cap | |
| Drop-oldest sliding window; truncated=true once ever dropped | Most-recent 30 preserved; truncated never unset | ✓ |
| Hybrid — preserve first 5, sliding-window the rest | Two trim modes; over-engineered | |

**User's choice:** Drop-oldest sliding window
**Notes:** Locked as D-05/D-06. Recent context wins; truncated=true is one-way.

---

### Q2: Cap counts individual messages or pairs?

| Option | Description | Selected |
|--------|-------------|----------|
| 30 individual messages — visitor + assistant separate | Matches validation.ts RequestSchema (max 30) | ✓ |
| 30 exchange-pairs | Requires pair-aggregator; doesn't match IDENT-01 | |
| 30 visitor messages — assistant turns uncounted | Lopsided; cap loses intent | |

**User's choice:** 30 individual messages
**Notes:** Locked as D-07. Cap matches Anthropic messages[] convention + existing schema.

---

### Q3: truncated=true surface in Phase 20 email?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — surface in subject prefix '(truncated)' | At-a-glance signal in Gmail list view | ✓ |
| Yes — surface in body header only | In-thread but not Gmail-list visible | |
| No — keep truncated metadata server-only | Phase 20 ignores; revisit in v1.4+ | |

**User's choice:** Subject prefix '(truncated)'
**Notes:** Locked as D-08. Locks Phase 20 subject contract here so its plan-phase doesn't re-decide.

---

### Q4: Concurrent-write race handling?

| Option | Description | Selected |
|--------|-------------|----------|
| Accept last-writer-wins for v1.3 | KV eventual consistency; log race_suspected warn | ✓ |
| Per-session in-memory mutex | Only helps same-Worker race; adds state | |
| Conditional write with optimistic lock | Doubles reads; over-engineered for v1.3 | |

**User's choice:** Last-writer-wins
**Notes:** Locked as D-13. Observability-only via `chat.transcript.race_suspected` log; don't fight KV's consistency model at portfolio scale.

---

## KV write failure handling

### Q1: ctx.waitUntil(appendTurn(...)) throws — user-visible behavior?

| Option | Description | Selected |
|--------|-------------|----------|
| Silent + structured error log | console.error('chat.transcript.write_failed', ...) | ✓ |
| Silent + log + best-effort retry inside waitUntil | Single retry with backoff | |
| Surface to client — stream a diagnostic frame | D-15 anchor concerns | |

**User's choice:** Silent + structured error log
**Notes:** Locked as D-09. Chat surface byte-identical; D-26 preserved.

---

### Q2: User-turn write failure — short-circuit or serve stream?

| Option | Description | Selected |
|--------|-------------|----------|
| Serve the stream anyway | ctx.waitUntil fire-and-forget | ✓ |
| Block stream on user-turn write success | Adds KV latency to TTFB | |
| Optimistic accumulator: write both turns post-stream | Loses durability anchor | |

**User's choice:** Serve the stream anyway
**Notes:** Locked as D-10. If user-turn write fails AND assistant succeeds, transcript has assistant role first — recoverable in Phase 20 render.

---

### Q3: Assistant-turn write failure handling?

| Option | Description | Selected |
|--------|-------------|----------|
| Same silent + structured error log | Adds content_length field for log queryability | ✓ |
| Single retry with 1s backoff inside waitUntil | Transient-5xx-in-<1s is rare | |
| Write to in-memory 'dead-letter' map for cron sweep | Worker invocations short-lived; misleading | |

**User's choice:** Same silent + structured log
**Notes:** Locked as D-11. content_length field helps spot whether failures cluster on long replies.

---

### Q4: Per-sessionId write spam guard?

| Option | Description | Selected |
|--------|-------------|----------|
| No — rely on Workers Free tier ceiling | Locked-deferred per-IP rate limit as the only protection | |
| Yes — hard cap on appendTurn writes per sessionId per hour | New KV-05 requirement | ✓ |
| Yes — light defense via existing 30-turn cap reframe | Use cap as the only guard | |

**User's choice:** Hard cap per sessionId per hour
**Notes:** Triggered clarification follow-up Q5 below.

---

### Q5 (clarification): Spam guard intent?

| Option | Description | Selected |
|--------|-------------|----------|
| New Phase 18 requirement KV-05 'per-sid write quota' | Planner adds entry to REQUIREMENTS.md | ✓ |
| Use existing 30-turn cap as the defense | Reframe KV-04 to do double duty | |
| Defer to v1.4+ alongside per-IP rate limit | Ship v1.3 with 30-turn cap only | |

**User's choice:** New KV-05 requirement
**Notes:** Locked as D-12. Adds explicit scope to Phase 18 — planner picks specific cap value + storage shape (KV metadata vs sibling counter) from research. Distinct from the locked-deferred per-IP rate limit; per-sid forges a different defense surface.

---

## Anthropic prompt-cache live verification

### Q1: How to verify live cache hits after sessionId is introduced?

| Option | Description | Selected |
|--------|-------------|----------|
| One-time manual UAT at phase close | 3× identical POSTs within 5min; verify via wrangler tail + DEBT-02 log | ✓ |
| Automated vitest live test (real Anthropic, paid network) | CI cost; flaky on regional cache misses | |
| Skip — trust the DEBT-02 production log retrospectively | Operational vigilance only | |

**User's choice:** One-time manual UAT
**Notes:** Locked as D-14. Zero ongoing CI cost; relies on Plan 17-05 DEBT-02 log seam.

---

### Q2: UAT target — preview, production, or both?

| Option | Description | Selected |
|--------|-------------|----------|
| Preview *.workers.dev FIRST, production AFTER deploy | Two-touch verification mirrors Plan 17-02 pattern | ✓ |
| Production only | Faster phase-close; deploy-time discovery risk | |
| Preview only | Misses production-only failure modes | |

**User's choice:** Preview FIRST, then production
**Notes:** Locked as D-14. Workers Builds spins a preview per push (Phase 17 D-03).

---

### Q3: Cache-miss escalation?

| Option | Description | Selected |
|--------|-------------|----------|
| Block phase close — root-cause before any other Phase 18 work merges | TEST-03 is milestone-level gate | ✓ |
| Warn-and-continue — ship + file follow-up task | Deferred-fix tends to defer indefinitely | |
| Surface to client as banner during Phase 18 only | Cosmetic; doesn't fix anything | |

**User's choice:** Block phase close
**Notes:** Locked as D-15. A passing forward-defense + failing live test means forward-defense has a blind spot; closing that blind spot becomes a sub-task of the same plan.

---

### Q4: Extend tests/api/anthropic-payload-shape.test.ts with sessionId-on-envelope assertions?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — extend the existing test with new assertions | Belt-and-suspenders + template-string-leak catch | ✓ |
| No — trust the existing forward-defense alone + live UAT | Pattern-grep alone | |
| Replace with runtime-mocked Anthropic SDK test | Loses byte-equality property | |

**User's choice:** Yes — extend the existing test
**Notes:** Locked as D-16. New assertions: sessionId IS on request body, NOT in args.system / args.messages[0]; system byte-equal across sessionId-bearing vs no-sessionId calls.

---

## Claude's Discretion

User left to planner / executor (documented in CONTEXT.md Claude's Discretion subsection):
- Exact `src/lib/chat-transcripts.ts` internal shape (function signature locked, internals are planner's call)
- KV-05 quota storage shape — KV metadata vs sibling counter key
- KV-05 specific cap value + time window — suggestions 50–200/hour, round value fine
- Per-turn token accumulator placement inside `start(controller)` closure
- Field ordering in `chat.transcript.*` log lines (names locked, ordering presentational)
- referrer source — server `Referer` header (first-turn-pin) vs client `document.referrer` in body; default to server first-turn-pin if unclear
- user_agent capture — every turn vs first-turn-pin (latter cleaner; UA shouldn't change mid-session)
- Test fixture sessionId values — hard-coded UUIDv4-shaped constants are fine
- D-26 chat regression battery EXPANSION targets — Phase 18 adds: UUIDv4 validation tests, missing-sid tolerance test, chat-transcripts.ts unit tests with mock KV, source-text appendTurn call-site forward-defense, STORAGE_VERSION 1→2 auto-clear test, sse-snapshot re-baseline if needed

## Deferred Ideas

- Per-IP rate limit (transcript spam prevention) — deferred to v1.4+ per STATE.md `/gsd-roadmap-phase` lock
- Workers Paid plan upgrade to bind `CHAT_RATE_LIMITER` — v1.4+ per Plan 17-04 DEBT-01 closure
- Automated vitest live test against real Anthropic for prompt-cache hits — rejected for Phase 18 (per-CI cost; flaky); revisit in v1.4+
- Per-session in-memory mutex / optimistic-lock retry — rejected as last-writer-wins acceptable at v1.3 scale; revisit if Workers Logs show clustered race_suspected warns post-launch
- Client-side `session-ended` signal at TTL boundary — rejected (new endpoint surface, no operator value)
- Cross-session sessionId merge (client passes old+new sid for one turn) — rejected (contradicts "each transcript is one logical conversation")
- Server-side mint fallback when client cannot mint — rejected (noisy KV + broken multi-turn for affected clients; silent-no-transcript cleaner)
- HTML email body — locked-deferred per STATE.md v1.3 roadmap (plaintext-only is v1.3 contract)
- `/api/resend-webhook` with Svix HMAC — locked-deferred to v1.4+ per STATE.md
- Phase 21 (Observability + Hardening) — locked-deferred to v1.4+ per STATE.md
