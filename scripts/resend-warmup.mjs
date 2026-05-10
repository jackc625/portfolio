#!/usr/bin/env node
/**
 * @fileoverview Phase 17 D-07 throwaway warmup-sends script.
 *
 * Reuses Phase 20's locked fetch() shape (REST against api.resend.com,
 * NOT the Resend npm SDK) so this script doubles as a Phase 20 dry-run.
 * If this script can't get a 200 from Resend's REST endpoint, Phase 20's
 * src/lib/email/resend.ts won't either.
 *
 * Sender locked by Phase 17 CONTEXT.md D-06:
 *   From:     "Portfolio Chat" <transcripts@mail.jackcutrara.com>
 *   Reply-To: jackcutrara@gmail.com
 *
 * API key is read from process.env.RESEND_API_KEY ONLY — never hardcoded
 * in source (Threat T-17-04).
 *
 * Usage:
 *   RESEND_API_KEY=... node scripts/resend-warmup.mjs
 *   RESEND_API_KEY=... node scripts/resend-warmup.mjs --to jackcutrara@gmail.com --count 5
 *
 * Exit codes:
 *   0 — all sends accepted (HTTP 2xx)
 *   1 — RESEND_API_KEY env var missing OR any send returned non-2xx
 */

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, arg, i, arr) => {
    if (arg.startsWith("--")) acc.push([arg.slice(2), arr[i + 1]]);
    return acc;
  }, [])
);
const to = args.to ?? "jackcutrara@gmail.com";
const count = Number(args.count ?? 5);

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error("RESEND_API_KEY env var is required (do NOT hardcode in this script)");
  process.exit(1);
}

for (let i = 1; i <= count; i++) {
  const sessionId = crypto.randomUUID();
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `warmup/${sessionId}`,
    },
    body: JSON.stringify({
      from: '"Portfolio Chat" <transcripts@mail.jackcutrara.com>',
      to,
      reply_to: "jackcutrara@gmail.com",
      subject: `[Portfolio chat] warmup ${i}/${count} — ${sessionId.slice(0, 8)}`,
      text: `This is a deliverability warmup send (${i} of ${count}).\nFrom: chat widget on jackcutrara.com — domain warming, no visitor message.`,
    }),
  });
  if (!res.ok) {
    console.error(`warmup ${i}: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  const body = await res.json();
  console.log(`warmup ${i}: id=${body.id} idempotency=warmup/${sessionId}`);
}
