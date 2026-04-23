---
created: 2026-04-23T17:55:00.000Z
title: Configure CHAT_RATE_LIMITER Cloudflare binding (Production + Preview)
area: security / infra
files:
  - src/pages/api/chat.ts:31-45
  - wrangler.jsonc
---

## Problem

The `/api/chat` endpoint has rate-limiter code (5 msg / 60s per IP) that is byte-identical
to what shipped in Phase 7 v1.0, but the `CHAT_RATE_LIMITER` Cloudflare binding was never
configured on either Production or Preview. The code path at `src/pages/api/chat.ts:33-45`
uses a defensive `if (rateLimiter)` guard and silently skips limiting when the binding is
absent — so no chat traffic has been rate-limited in production since launch.

Surfaced during Phase 14 D-26 verification (Task 3 of Plan 14-06): a 7-request curl loop
against the preview deploy returned seven consecutive `200`s with no `429`, confirming the
binding is absent. Row 3 of `.planning/phases/14-chat-knowledge-upgrade/14-VERIFICATION.md`
is marked NOTE (byte-identical code preserved; pre-existing gap, not a Phase 14 regression).

Risk: without rate limiting the chat endpoint is exposed to naive abuse — a single bot can
burn through Anthropic credits by flooding `/api/chat`. Low traffic today keeps this academic,
but it belongs closed before any analytics / referral traffic lands in Phase 15.

## Solution

Cloudflare Pages dashboard → Pages project `portfolio-5wl` (or `jack-cutrara-portfolio`)
→ Settings → Functions → Bindings → Rate Limiting → Add binding:
- Variable name: `CHAT_RATE_LIMITER`
- Key: IP (from `CF-Connecting-IP` header)
- Limit: 5 requests / 60s
- Add binding to BOTH Production and Preview environments

Alternate (wrangler-native) path: add a `rate_limiters` section to `wrangler.jsonc`, commit,
deploy. The `wrangler.jsonc` path keeps config in source control but requires re-deploy to change.

After configuring:
1. Rebuild a preview branch (or redeploy main).
2. Re-run the curl loop from Plan 14-06 `<how-to-verify>` Step 2 against the preview URL:
   ```bash
   PREVIEW=https://<branch>.portfolio-5wl.pages.dev
   for i in $(seq 1 7); do
     curl -sS -o /dev/null -w "%{http_code}\n" -X POST \
       -H "Origin: $PREVIEW" -H "Content-Type: application/json" \
       -d '{"messages":[{"role":"user","content":"hi"}]}' $PREVIEW/api/chat
   done
   ```
   Expected: `200 200 200 200 200 429 429`.
3. Update `.planning/phases/14-chat-knowledge-upgrade/14-VERIFICATION.md` Row 3 Status
   to `PASS` with the new curl output pasted.

## Context

- Phase 7 originally specified the rate limiter as part of the D-26 regression battery
  (Item 3). The test suite `tests/api/security.test.ts` does not exercise the binding because
  Cloudflare bindings are only available inside the Workers runtime, not Vitest/node.
- Adding `rate_limiters` to `wrangler.jsonc` also generates the type in `worker-configuration.d.ts`
  so `env.CHAT_RATE_LIMITER` is strongly typed instead of the current `(env as unknown as ...)` cast.
- Low urgency (no abuse observed at portfolio traffic levels) but should land before Phase 15
  Analytics Instrumentation ships — public analytics may surface the endpoint to broader traffic.
