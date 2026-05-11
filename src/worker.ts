// Phase 17 FOUND-02 — custom Worker entrypoint.
// Source pattern: https://docs.astro.build/en/guides/integrations-guide/cloudflare
// (Standard Cloudflare Worker Export Handler — Context7 verified 2026-05-10)
//
// Replaces "main": "@astrojs/cloudflare/entrypoints/server" — the bundled
// adapter entrypoint exports only { fetch }, which cannot host a scheduled()
// handler. Phase 19 (cron sweep) is blocked without this file.

import { handle } from "@astrojs/cloudflare/handler";

export interface Env {
  ASSETS: Fetcher;                // Workers Static Assets binding (wrangler.jsonc [assets])
  CHAT_KV: KVNamespace;           // Phase 17 declared, Phase 18 binds + writes
  ANTHROPIC_API_KEY: string;      // Existing secret — re-add to new Worker
  RESEND_API_KEY: string;         // Phase 17 D-05 — added during cutover
  CHAT_RECIPIENT_EMAIL: string;   // Phase 17 D-06 — added during cutover
  CHAT_SENDER_EMAIL: string;      // Phase 17 D-06 — added during cutover
  // Phase 7 carry-forward (DEBT-01: Free-tier acceptable; Workers Paid v1.4+).
  CHAT_RATE_LIMITER?: RateLimit;
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    return handle(request, env, ctx);
  },
  async scheduled(_controller, _env, ctx): Promise<void> {
    // Phase 19 will replace with: ctx.waitUntil(deliverDue(_env, _controller.scheduledTime));
    // Stub kept here so wrangler.jsonc triggers.crons declaration is wireable
    // in Phase 19 with a single ./worker.ts edit (no entrypoint change needed).
    //
    // WR-05 (Phase 17 review): emit a structured warn line so an accidental
    // cron wiring (a contributor adds triggers.crons in wrangler.jsonc before
    // Phase 19's deliverDue lands) is visible in Workers Logs. Without this
    // breadcrumb the stub would fire on schedule with zero operational
    // visibility. The wrangler-shape test accepts a non-empty triggers.crons
    // array, so the guardrail is the log line, not the test.
    console.warn("worker.scheduled.stub", {
      note: "Phase 19 will replace with deliverDue(env, controller.scheduledTime)",
      scheduledTime: _controller.scheduledTime,
      cron: _controller.cron,
    });
    ctx.waitUntil(Promise.resolve());
  },
} satisfies ExportedHandler<Env>;
