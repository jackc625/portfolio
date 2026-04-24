---
id: 2026-04-23-chat-cache-hit-rate-observability
created: 2026-04-23
priority: low
context: phase-14-deferred + phase-15-deferred → v1.3+
effort: medium (1-2 plans — server SDK hook + client SSE frame + Umami event + D-26 full-surface regression)
tags: [chat, observability, anthropic, prompt-caching, v1.3]
---

# Chat cache-hit-rate observability

## Context

Anthropic's prompt caching (enabled in Phase 14-03 via `cache_control: { type: "ephemeral" }`) emits two usage fields on every `message_start` streaming event:
- `cache_creation_input_tokens` — tokens written to cache on this request (cache MISS)
- `cache_read_input_tokens` — tokens read from cache on this request (cache HIT)

Hit rate = `cache_read / (cache_read + cache_creation)` per request. Surface this in a Umami dashboard event so we can see cache efficiency over time.

## Why deferred (twice)

**Phase 14 D-13 (2026-04-23):** Deferred to Phase 15 as part of the ANAL-03 observability hook. Designed as the natural home for content-free cache telemetry alongside `chat:analytics`.

**Phase 15 D-13 (2026-04-23):** Re-deferred to v1.3+. At portfolio-scale traffic (~dozens of chats per week), cache-hit-rate is a cost signal, not a performance signal; the cost is already bounded by Anthropic rate-limits. Wiring it requires net-new server chat.ts code (intercept SDK `message_start` event), a new SSE diagnostic frame, a client-side parser (mirrors Plan 04's truncated-frame work), and a full D-26 regression (server surface changes — cannot ride the D-15 client-only shortcut).

**Out of proportion for v1.2.** The Phase 14 claim that `chat-cache.ts` + `content-snapshot.ts` carry log seams was overstated — those files don't exist in src/. No partially-shipped scaffolding to wire up.

## Scope sketch (when activated in v1.3+)

### Server side
- `src/pages/api/chat.ts` — intercept Anthropic SDK's streaming `message_start` event, extract `usage.cache_read_input_tokens` + `usage.cache_creation_input_tokens`, emit new SSE diagnostic frame: `data: {"cache":{"read":N,"created":M}}\n\n` before the first text delta
- Preserve existing `data: [DONE]` terminator and `data: {"truncated":true}` (Phase 15 D-14) frames
- D-26 full regression required (server surface changes — CORS + rate limit + 30s timeout + SSE streaming + body-size + validation invariants must all re-run)

### Client side
- `src/scripts/chat.ts` — SSE parse loop gains a `parsed.cache` branch (mirrors Plan 15-04 `parsed.truncated` pattern exactly): `if (parsed.cache) { trackChatEvent("chat_cache", JSON.stringify(parsed.cache)); continue; }` — or dispatch with structured detail.cache
- Plan 15-02 `analytics.ts` D-11 forwarder auto-routes `chat_cache` to `window.umami?.track("chat_cache", {read, created, hitRate})` if the detail schema is extended to pass `label` object — but more likely adds a dedicated handler that keeps payload structured

### Dashboard
- Umami metric: "cache hit rate = sum(chat_cache.read) / sum(chat_cache.read + chat_cache.created) over 7 days"
- Expected healthy values: ≥60% hit rate at steady-state (system prompt cache TTL = 5 min per Phase 14 D-14)

## Trigger conditions (when to ship)

Revisit when any of these fire:

1. **Anthropic spend exceeds $5/mo steady-state** (per REQUIREMENTS.md Future Requirements threshold — same threshold as keyword routing for chat)
2. **Jack wants to evaluate raising cache TTL from 5 min → 1 hour** (deferred in Phase 14-05; requires hit-rate data to justify)
3. **A chat performance regression is suspected** and cache behavior is the suspected variable
4. **Portfolio traffic exceeds ~500 chats/week** (point at which "dozens per week" scale heuristic no longer holds)

## Acceptance (v1.3+)

- `chat_cache` event visible in Umami dashboard with read + created + hitRate metadata
- Server `api/chat.ts` SDK-stream interception survives D-26 full regression (all 9 items PASS)
- Computed hit-rate stable across a 7-day window with ≥90% signal coverage
- Lighthouse CI holds: Performance ≥99 / A11y ≥95 / BP 100 / SEO 100
