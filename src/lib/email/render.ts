// render.ts — Wave 0 stub. Task 2 of Plan 20-01 lands the real implementation.
//
// This stub exists ONLY to satisfy `pnpm exec astro check` 0/0/0 for the
// sibling test files (tests/api/email-render.test.ts +
// tests/api/email-render.adversarial.test.ts) while keeping the Wave 0 RED
// state intact at runtime — every call to renderEmail throws.
//
// Decision IDs honored by Task 2: D-05, D-06, D-07, D-08, D-09, D-10, D-11, D-12.

import type { ChatTranscript } from "../chat-transcripts";

export interface RenderEnv {
  CHAT_RECIPIENT_EMAIL: string;
  CHAT_SENDER_EMAIL: string;
  CHAT_REPLY_TO_EMAIL: string;
}

export interface ResendPayload {
  from: string;
  to: string;
  reply_to: string;
  subject: string;
  text: string;
  idempotency_key: string;
}

export function renderEmail(
  _env: RenderEnv,
  _transcript: ChatTranscript,
): ResendPayload {
  throw new Error("renderEmail not implemented — Plan 20-01 Task 2 lands this");
}
