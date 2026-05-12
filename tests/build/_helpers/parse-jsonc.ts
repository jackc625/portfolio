/**
 * Shared JSONC helper for build-time source-text tests.
 *
 * WR-05 / WR-06 (Phase 19 code review) — extracts the parseJsonc helper
 * previously duplicated verbatim across wrangler-shape.test.ts and
 * wrangler-cron-shape.test.ts into a single source of truth, and replaces
 * the naive `(^|[^:"])\/\/.*$` regex with a small per-character state
 * machine that correctly skips `//` sequences appearing inside string
 * literals (e.g., `"foo // bar"` no longer truncates at the first `//`).
 *
 * The previous regex required the character immediately before `//` to be
 * either start-of-line or NOT `:` and NOT `"`. This correctly handled
 * `https://` (preceded by `:`) and `"// not a comment"` (preceded by `"`)
 * but mishandled string values containing `//` preceded by whitespace --
 * the closing `"` would be stripped along with the comment-looking
 * substring, producing invalid JSON and an opaque SyntaxError. Adding a
 * value with embedded `//` to wrangler.jsonc would have triggered this
 * latent fragility.
 *
 * Note: we deliberately avoid adding the `jsonc-parser` npm dependency
 * (zero-new-runtime-deps preferred path per CLAUDE.md project conventions).
 * The state machine below is ~30 LOC, has no external surface, and is
 * tested implicitly by every test that imports it (which is two today).
 *
 * Supported JSONC features:
 *   - // line comments (to end of line)
 *   - block comments
 *   - String literals (with backslash escapes — including escaped quotes)
 *
 * NOT supported (intentionally): trailing commas, multi-line strings.
 * These would be added if any future JSONC consumer needs them.
 */

/**
 * Strip JSONC line + block comments while respecting string literals.
 *
 * @param src - JSONC source text
 * @returns parsed JSON value (calls JSON.parse internally for consistency
 *          with the prior helper's contract — callers receive `unknown`).
 */
export function parseJsonc(src: string): unknown {
  let out = "";
  let i = 0;
  const n = src.length;

  while (i < n) {
    const ch = src[i];
    const next = i + 1 < n ? src[i + 1] : "";

    // String literal — copy verbatim until the closing quote. Handle
    // escapes so an escaped quote (\") doesn't terminate the string.
    if (ch === '"') {
      out += ch;
      i++;
      while (i < n) {
        const c = src[i];
        out += c;
        if (c === "\\" && i + 1 < n) {
          // Copy the escape sequence's next char (any char including ")
          out += src[i + 1];
          i += 2;
          continue;
        }
        i++;
        if (c === '"') break;
      }
      continue;
    }

    // Block comment — skip until */
    if (ch === "/" && next === "*") {
      i += 2;
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) i++;
      i += 2; // skip the closing */ (if not found we run off the end harmlessly)
      continue;
    }

    // Line comment — skip until end of line (do NOT consume the newline,
    // it stays in the output so line numbers in error messages survive).
    if (ch === "/" && next === "/") {
      i += 2;
      while (i < n && src[i] !== "\n") i++;
      continue;
    }

    out += ch;
    i++;
  }

  return JSON.parse(out);
}
