export const prerender = false;

import type { APIRoute } from "astro";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "cloudflare:workers";
import portfolioContext from "../../data/portfolio-context.json";
import { buildChatRequestArgs } from "../../prompts/chat-request-shape";
import {
  validateRequest,
  sanitizeMessages,
  isAllowedOrigin,
  MAX_BODY_SIZE,
} from "../../lib/validation";
import { appendTurn, type AppendTurnMeta } from "../../lib/chat-transcripts";

/**
 * META-01 first-turn metadata snapshot — Plan 18-05 / D-08 / Pitfall 4.
 *
 * Snapshots referrer + user_agent (HTTP headers) and country + region + colo
 * (Cloudflare request.cf injection at the edge — null in `wrangler dev` per
 * RESEARCH § Pitfall 4). chat-transcripts.appendTurn pins these on the first
 * turn and preserves them on subsequent turns (META-01 first-turn-only-pin
 * convention per CONTEXT.md Claude's Discretion default).
 */
function captureRequestMeta(request: Request): AppendTurnMeta {
  const cf = (request as unknown as { cf?: { country?: string; region?: string; colo?: string } }).cf;
  return {
    referrer: request.headers.get("Referer"),
    user_agent: request.headers.get("User-Agent"),
    country: cf?.country ?? null,
    region: cf?.region ?? null,
    colo: cf?.colo ?? null,
  };
}

export const POST: APIRoute = async ({ request, locals }) => {
  // Plan-time-resolved path to Workers ExecutionContext for ctx.waitUntil(appendTurn(...)).
  // RESEARCH § Open Questions Q1 (RESOLVED): Astro v6 / @astrojs/cloudflare 13.1.7 exposes ExecutionContext at
  // locals.cfContext (locals.runtime.ctx was REMOVED in v6 — confirmed via direct read of
  // node_modules/@astrojs/cloudflare/dist/utils/handler.js:64-91). RESEARCH § Pitfall 1: NEVER destructure
  // ctx — loses `this` binding ("Illegal invocation" runtime error).
  // Defensive fallback (D-26 anti-regression): vitest tests invoke POST({ request } as never) without a
  // real Workers locals object. The no-op waitUntil keeps chat surface bytes byte-identical in those tests;
  // production Workers runtime ALWAYS supplies locals.cfContext per the adapter handler.
  const ctx = (locals as { cfContext?: { waitUntil: (p: Promise<unknown>) => void } } | undefined)?.cfContext
    ?? { waitUntil: (_p: Promise<unknown>) => {} };

  // S9: CORS check — exact origin whitelist, NOT endsWith()
  const origin = request.headers.get("Origin");
  if (!isAllowedOrigin(origin)) {
    return new Response("Forbidden", { status: 403 });
  }

  // Body size check — reject before parsing JSON to prevent memory abuse.
  // Uses Number() (not parseInt) so malformed values are explicitly rejected:
  //   "abc"     → NaN       → reject
  //   "-1"      → -1        → reject (negative)
  //   "32768.5" → 32768.5   → reject (non-integer)
  // parseInt would treat these as "within limits" (NaN > limit is false,
  // -1 > limit is false, fractional → floor), silently bypassing the guard.
  // Cloudflare Workers enforces its own body cap upstream, so this is
  // defense-in-depth — the intent is fail-fast before body is read.
  const contentLength = request.headers.get("Content-Length");
  if (contentLength) {
    const parsed = Number(contentLength);
    if (
      !Number.isFinite(parsed) ||
      !Number.isInteger(parsed) ||
      parsed < 0 ||
      parsed > MAX_BODY_SIZE
    ) {
      return new Response(JSON.stringify({ error: "payload_too_large" }), {
        status: 413,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // S5/D-10/D-24: Rate limiting via Cloudflare binding (skipped in local dev
  // where the binding doesn't exist)
  const rateLimiter = (env as unknown as Record<string, unknown>).CHAT_RATE_LIMITER as
    | { limit: (opts: { key: string }) => Promise<{ success: boolean }> }
    | undefined;
  if (rateLimiter) {
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const { success: withinLimit } = await rateLimiter.limit({ key: ip });
    if (!withinLimit) {
      return new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Parse JSON body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // S1/D-22/D-23: Input validation
  const validation = validateRequest(body);
  if (!validation.success) {
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // S7: Sanitize history
  const messages = sanitizeMessages(validation.data.messages);

  // D-08/D-11: Stream response from Claude Haiku
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "server_error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  const client = new Anthropic({ apiKey });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let truncated = false;
        // CR-01 (Phase 17 review): Anthropic's streaming protocol delivers the
        // FINAL output_tokens in `message_delta.usage`, NOT in `message_start`.
        // At message_start, output_tokens is typically 1-3 (initial preamble
        // accounting). Capture cache-token fields from message_start (those
        // ARE accurate there) and defer the chat.cache_metrics log emission
        // until message_delta arrives with the real final output_tokens.
        let cacheUsage: {
          cache_read_input_tokens: number;
          cache_creation_input_tokens: number;
          input_tokens: number;
        } | null = null;
        const response = await client.messages.create(
          buildChatRequestArgs(portfolioContext, messages)
        );

        for await (const event of response) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ text: event.delta.text })}\n\n`
              )
            );
          } else if (event.type === "message_delta") {
            // Anthropic signals final stop reason here. "max_tokens" means the model
            // hit the output-token ceiling mid-generation and the reply is clipped.
            // Log server-side for observability and emit a diagnostic SSE frame so
            // the client can surface a truncation hint (Phase 15 ANAL-03 will wire
            // the log line to the observability backend).
            if (event.delta.stop_reason === "max_tokens") {
              truncated = true;
              console.warn("chat.truncated", { stop_reason: "max_tokens" });
            }
            // DEBT-02 (Phase 17 / Plan 17-05) + CR-01 (Phase 17 review):
            // Emit the canonical chat.cache_metrics log line here — message_delta
            // carries the FINAL output_tokens. Merge with cache-token fields
            // captured from message_start. Structured JSON log — Cloudflare
            // Workers Logs + wrangler tail parse the second arg as JSON for
            // query/filter. Flat primitive fields only (per RESEARCH §"Pattern 5").
            // NO SSE frame enqueue — D-15 byte-identical anchor forbids it; the
            // SSE stream is consumer contract, not telemetry.
            if (cacheUsage && event.usage) {
              console.log("chat.cache_metrics", {
                ...cacheUsage,
                output_tokens: event.usage.output_tokens,
              });
            }
          } else if (event.type === "message_start") {
            // CR-01: Capture only the cache-related fields (these ARE accurate
            // at message_start). output_tokens is deferred to message_delta.
            const usage = event.message.usage;
            cacheUsage = {
              cache_read_input_tokens: usage.cache_read_input_tokens ?? 0,
              cache_creation_input_tokens: usage.cache_creation_input_tokens ?? 0,
              input_tokens: usage.input_tokens,
            };
          }
        }

        if (truncated) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ truncated: true })}\n\n`
            )
          );
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch {
        // Addresses review concern: mid-stream error handling
        // If error occurs after stream starts, send error event so client
        // can recover from "typing" state instead of hanging forever
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: true })}\n\n`)
          );
          controller.close();
        } catch {
          // Controller may already be closed — safe to ignore
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Encoding": "none",
    },
  });
};
