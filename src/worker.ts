// Phase 17 FOUND-02 — custom Worker entrypoint.
// Source pattern: https://docs.astro.build/en/guides/integrations-guide/cloudflare
// (Standard Cloudflare Worker Export Handler — Context7 verified 2026-05-10)
//
// Replaces "main": "@astrojs/cloudflare/entrypoints/server" — the bundled
// adapter entrypoint exports only { fetch }, which cannot host a scheduled()
// handler. Phase 19 (cron sweep) lives here as the scheduled() dispatch site.

import { handle } from "@astrojs/cloudflare/handler";
import { deliverDue } from "./lib/chat-delivery";

export interface Env {
  ASSETS: Fetcher;                // Workers Static Assets binding (wrangler.jsonc [assets])
  CHAT_KV: KVNamespace;           // Phase 17 declared, Phase 18 binds + writes
  ANTHROPIC_API_KEY: string;      // Existing secret — re-add to new Worker
  // WR-04 (Phase 19 code review) — these three Phase 17-introduced secrets/vars
  // are dashboard-bound (RESEND_API_KEY) or wrangler-vars-bound and may not be
  // present on every deployment surface (preview deploys without .dev.vars,
  // branch-deploy environments, local wrangler dev without the secrets seeded).
  // Marking them optional surfaces missing-binding bugs at the access site
  // rather than letting TypeScript silently lie about a possibly-undefined
  // value being a guaranteed string. DeliveryEnv already types these optional;
  // worker.ts is the mismatch this aligns.
  RESEND_API_KEY?: string;        // Phase 17 D-05 — set via dashboard secret
  CHAT_RECIPIENT_EMAIL?: string;  // Phase 17 D-06 — wrangler.jsonc vars
  CHAT_SENDER_EMAIL?: string;     // Phase 17 D-06 — wrangler.jsonc vars
  CHAT_REPLY_TO_EMAIL?: string;   // WR-02 (Phase 19 code review) — envelope reply_to: field; sourced from wrangler.jsonc vars (optional)
  // DRY_RUN narrowed to the wrangler-generated literal "1" so the local Env
  // interface assigns cleanly to the global `Env extends Cloudflare.Env` (with
  // `DRY_RUN: "1"`) at the handle(request, env, ctx) call site. The wider
  // `string` declaration (Plan 19-01) produced ts(2345) at worker.ts:25
  // because `string` is not assignable to the literal `"1"`. Narrowing to
  // `"1"` is the carry-forward absorption per Plan 19-03 deferred-items.md
  // closure path option 2 — couples the source-of-truth to wrangler's
  // generated type (the value lives in wrangler.jsonc vars and only ever
  // equals "1" in Phase 19). DeliveryEnv.DRY_RUN: string still accepts the
  // "1" literal because "1" is a subtype of string.
  DRY_RUN: "1";
  // Phase 7 carry-forward (DEBT-01: Free-tier acceptable; Workers Paid v1.4+).
  CHAT_RATE_LIMITER?: RateLimit;
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    return handle(request, env, ctx);
  },
  async scheduled(controller, env, ctx): Promise<void> {
    // Phase 19 CRON-01 — scheduled() dispatch to deliverDue (Plan 19-03 wire).
    //
    // Pattern inherits Phase 18 D-09 / D-10 / D-11 (RESEARCH § Pattern 1):
    //   • ctx.waitUntil keeps the cron-tick promise alive past handler return
    //   • .catch chained INSIDE the promise BEFORE the pass-in (ctx.waitUntil
    //     returns void, so chaining .catch AFTER would be a type error and
    //     silently swallow rejections at runtime).
    //   • Per-session failures live INSIDE deliverDue with chat.delivery.failed;
    //     worker.scheduled.failed is catastrophic-only (entire sweep aborted).
    //   • Only error_class (constructor name) is logged — not message, not
    //     stack — per the Phase 18 chat.transcript.write_failed convention.
    //
    // controller.scheduledTime is the canonical nowMs for inactivity comparisons
    // (OQ-6 — tick-as-batch consistency, deterministic across the per-tick batch).
    ctx.waitUntil(
      deliverDue(env, controller.scheduledTime).catch((err: unknown) => {
        console.error("worker.scheduled.failed", {
          error_class: err instanceof Error ? err.constructor.name : "Error",
        });
      })
    );
  },
} satisfies ExportedHandler<Env>;
