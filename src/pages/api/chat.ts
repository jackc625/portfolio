export const prerender = false;

import type { APIRoute } from "astro";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "cloudflare:workers";
import portfolioContext from "../../data/portfolio-context.json";
import { buildSystemPrompt } from "../../prompts/system-prompt";
import {
  validateRequest,
  sanitizeMessages,
  isAllowedOrigin,
  MAX_BODY_SIZE,
} from "../../lib/validation";

export const POST: APIRoute = async ({ request }) => {
  // S9: CORS check — exact origin whitelist, NOT endsWith()
  const origin = request.headers.get("Origin");
  if (!isAllowedOrigin(origin)) {
    return new Response("Forbidden", { status: 403 });
  }

  // Body size check — reject before parsing JSON to prevent memory abuse
  const contentLength = request.headers.get("Content-Length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
    return new Response(JSON.stringify({ error: "payload_too_large" }), {
      status: 413,
      headers: { "Content-Type": "application/json" },
    });
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
        const response = await client.messages.create({
          model: "claude-haiku-4-5",
          max_tokens: 512,
          system: buildSystemPrompt(portfolioContext),
          messages,
          stream: true,
        });

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
          }
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
