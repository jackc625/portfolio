import { z } from "zod";

export const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z
    .string()
    .min(1)
    .max(500)
    .transform((s) => s.trim())
    .pipe(z.string().min(1)),
});

export const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(30),
});

export type ValidatedMessage = z.infer<typeof MessageSchema>;
export type ValidatedRequest = z.infer<typeof RequestSchema>;

export function validateRequest(
  body: unknown
): { success: true; data: ValidatedRequest } | { success: false; error: string } {
  const result = RequestSchema.safeParse(body);
  if (!result.success) {
    return { success: false, error: "invalid_request" };
  }
  return { success: true, data: result.data };
}

export function sanitizeMessages(messages: ValidatedMessage[]): ValidatedMessage[] {
  // Filter to only user/assistant (already enforced by schema, belt-and-suspenders)
  const filtered = messages.filter(
    (m) => m.role === "user" || m.role === "assistant"
  );
  // Trim to last 20 entries (10 conversation turns)
  return filtered.slice(-20);
}

// Exact origin whitelist for CORS — addresses review concern: all 3 reviewers flagged
// endsWith() as bypassable (e.g., "evil-jackcutrara.com" would pass).
// Uses URL parsing for safe comparison.
const ALLOWED_ORIGINS = [
  "https://jackcutrara.com",
  "https://www.jackcutrara.com",
];

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true; // No origin header = same-origin or non-browser
  // Allow localhost for development
  try {
    const url = new URL(origin);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return true;
  } catch {
    return false; // Malformed origin
  }
  return ALLOWED_ORIGINS.includes(origin);
}

// Body size limit constant (32KB)
export const MAX_BODY_SIZE = 32768;
