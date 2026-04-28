---
phase: 14-chat-knowledge-upgrade
reviewed: 2026-04-23T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - package.json
  - scripts/build-chat-context.mjs
  - src/components/chat/ChatWidget.astro
  - src/data/portfolio-context.json
  - src/data/portfolio-context.static.json
  - src/lib/validation.ts
  - src/pages/api/chat.ts
  - src/prompts/chat-request-shape.ts
  - src/prompts/portfolio-context-types.ts
  - src/prompts/system-prompt.ts
  - tests/api/chat.test.ts
  - tests/api/prompt-injection.test.ts
  - tests/api/security.test.ts
  - tests/build/chat-context-integrity.test.ts
  - tests/fixtures/chat-eval-dataset.ts
findings:
  critical: 0
  warning: 4
  info: 6
  total: 10
status: issues_found
---

# Phase 14: Code Review Report

**Reviewed:** 2026-04-23
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

Phase 14 replaces the hard-coded profile blob with a build-time-generated retrieval context (`portfolio-context.json`) and hardens the system prompt with a third-person biographer persona, tiered refusals, an attack-pattern banlist, and explicit projects-7 exclusion. The CORS whitelist was extended to accept preview subdomains of `*.portfolio-5wl.pages.dev` via suffix-match on a parsed URL hostname (not raw string `endsWith`, preserving the hardening from Phase 7). Cache control and `max_tokens: 768` are wired through `buildChatRequestArgs` in a pure helper that is unit-tested structurally. The build-time generator is defensive — it guards path escapes, rejects Projects/7 by regex, detects duplicate slugs and duplicate sources, and implements a tiered token-budget observability regime.

Overall the implementation is solid. No critical bugs, no XSS/injection regressions, no secret leaks. Phase 7 invariants (CORS, rate-limit, SSE framing, `Content-Encoding: none`) are preserved. The four warnings below are correctness edge cases in the content-builder generator and one CORS suffix-match subtlety that only matters if Cloudflare ever issues a hostname ending in the same suffix; the info items are maintainability nits. None of these should block Phase 14 close-out.

## Warnings

### WR-01: CORS preview-suffix match still accepts unrelated hostnames that happen to end with `.portfolio-5wl.pages.dev`

**File:** `src/lib/validation.ts:80`
**Issue:** The check `url.hostname.endsWith(PAGES_PREVIEW_SUFFIX)` (with `PAGES_PREVIEW_SUFFIX = ".portfolio-5wl.pages.dev"`) is correct for the 99.99% case: the leading `.` means `evil.portfolio-5wl.pages.dev.attacker.com` is rejected (tested at `tests/api/security.test.ts:95-99`). However, a hostname like `portfolio-5wl.pages.dev` (the apex with no preview subdomain) is not accepted because it does not have a leading `.` match — which is correctly tested at line 85-87. But `x.portfolio-5wl.pages.dev` matches even when `x` is the empty label segment (e.g. `..portfolio-5wl.pages.dev` — a URL with an empty label) because `new URL()` in Node lowercases and normalizes but may or may not reject empty labels consistently. In practice the existing tests cover the real attack classes. The subtler issue is that Cloudflare Pages project-hostname squatting is mitigated by the `-5wl` random suffix, but this is an assumption worth documenting in the code comment so future contributors don't shorten it during a rename.

**Fix:** Add a comment documenting why the `-5wl` suffix is load-bearing (it prevents a different Cloudflare Pages user from registering `portfolio.pages.dev` and bypassing the check). Optionally tighten the hostname check to require exactly one label between the suffix and the protocol:

```ts
// Allow preview subdomains of the project's pages.dev hostname (https only)
// The "-5wl" random suffix is Cloudflare-assigned and prevents squatting —
// another user cannot register "portfolio-5wl.pages.dev". If this project
// is ever renamed, update this constant in lockstep.
if (url.protocol === "https:" && url.hostname.endsWith(PAGES_PREVIEW_SUFFIX)) {
  // Require at least one non-empty label before the suffix (no apex, no empty label).
  const prefix = url.hostname.slice(0, -PAGES_PREVIEW_SUFFIX.length);
  if (prefix.length > 0 && !prefix.endsWith(".")) return true;
}
```

---

### WR-02: `parseInt(contentLength)` accepts negative and non-integer values, silently bypassing body-size limit

**File:** `src/pages/api/chat.ts:24`
**Issue:** `parseInt(contentLength, 10) > MAX_BODY_SIZE` treats malformed `Content-Length` headers (e.g., `"abc"` → `NaN`, `"-1"` → `-1`, `"32768.5"` → `32768`) as "within limits" because `NaN > 32768` is `false` and `-1 > 32768` is `false`. A crafted client could also send `Content-Length: 0` and then stream a large body, bypassing this guard. The downstream `request.json()` call in Workers enforces its own body-size limit (100MB by default), so this is not a critical vulnerability — but the intent of this guard is to fail fast before the body is read, and a `NaN` or negative value circumvents that intent.

**Fix:** Require the header to parse as a non-negative integer, and treat unparseable values as "reject":

```ts
// Body size check — reject before parsing JSON to prevent memory abuse
const contentLength = request.headers.get("Content-Length");
if (contentLength) {
  const parsed = Number(contentLength); // Number() returns NaN for "abc", -1 for "-1"
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > MAX_BODY_SIZE) {
    return new Response(JSON.stringify({ error: "payload_too_large" }), {
      status: 413,
      headers: { "Content-Type": "application/json" },
    });
  }
}
```

Note: this is a hardening nit, not a live vulnerability — Cloudflare Workers enforces its own body cap upstream.

---

### WR-03: `readStringField` unquoted regex can swallow a trailing YAML comment into the value

**File:** `scripts/build-chat-context.mjs:68`
**Issue:** The unquoted fallback regex `^${escaped}:\s*([^"\n]+?)\s*$` does not strip inline YAML comments. If a contributor writes `title: SeatWatch # TODO rename`, the captured value becomes `SeatWatch # TODO rename` (the `#` starts a YAML comment but the regex does not know). All six current MDX files use quoted form so this is not a live bug, but it is a latent failure mode that will surface silently — the title propagates into the system prompt's knowledge block with the comment attached.

Separately, the regex uses a lazy quantifier `[^"\n]+?` with `\s*$` anchoring, which means on input `title: foo  ` (with trailing spaces) the capture correctly strips the trailing whitespace. Good. But on `title: foo:bar` (colon in value) it captures `foo:bar` — correct for the unquoted case, but the quoted branch should be preferred and is (it's tried first via `??`). No issue there.

**Fix:** Strip inline comments in the unquoted branch, matching YAML semantics:

```js
return re ? re[1].replace(/\s+#.*$/, "").trim() : null;
```

Or document the invariant in a comment that all current MDX files use quoted form, and add an error path if the captured value contains an un-escaped `#`. The current defensive posture elsewhere in the file (hard-fail on any ambiguity) argues for the explicit rejection path.

---

### WR-04: `readArrayField` bracket-form regex does not handle trailing commas or mixed quote styles cleanly

**File:** `scripts/build-chat-context.mjs:90-99`
**Issue:** The multi-line inline bracket branch splits on `,` then strips surrounding quotes: `s.trim().replace(/^["']|["']$/g, "")`. This works for the current shapes but silently drops one failure mode: a trailing comma like `["A", "B",]` produces an empty string after split, filtered out by `filter(Boolean)` — correct. But an entry with a comma inside the value (e.g., `"Postgres, with advisory locks"`) would be split into two tokens (`"Postgres` and ` with advisory locks"`) and the first would retain a leading `"` after the strip. The strip regex `^["']|["']$` is two alternations applied once, so a value with a trailing `",` after split becomes `with advisory locks"` → stripped to `with advisory locks`. So the quotes ARE stripped, but the semantics are wrong: one logical array entry has been silently split into two.

No current MDX uses commas inside tech-stack entries, so this is latent. A proper YAML/JSON parse would be more robust; alternatively, a comment can make the invariant explicit.

**Fix:** Either parse the bracket block as JSON after quoting keys (overkill), or add an invariant check that rejects `,` inside any quoted string in the bracket form:

```js
// Defensive: refuse commas inside quoted entries (parser would mis-split them).
if (/"[^"]*,[^"]*"/.test(bracket[1])) {
  throw new Error(`${fieldName}: comma inside quoted array entry is not supported`);
}
```

Or document that the generator assumes no embedded commas in array entries.

## Info

### IN-01: `ChatWidget.astro` inline styles proliferate; hard to maintain motion-restraint contract

**File:** `src/components/chat/ChatWidget.astro:13-180`
**Issue:** Every positioning/visual concern is an inline `style="..."` attribute. This is acceptable Astro convention, but the editorial motion-restraint and hover-state rules from `design-system/MASTER.md` are not enforceable via inline styles alone — a future contributor can add `transition: all 0.3s` in a single-element `style` attribute and no linter will catch it.

**Fix:** No action required; consider extracting the dialog chrome to a scoped `<style>` block in a follow-up, which would centralize the design-system touchpoints for this widget.

---

### IN-02: `experience` field is a deterministic derivation of `about.intro + about.p1 + about.p3` but skips `about.p2` without explanation in the field itself

**File:** `scripts/build-chat-context.mjs:366-368`
**Issue:** The computed `experience` string concatenates `intro + p1 + p3` but omits `p2`. The docstring above does not say why — a future reader would assume `p2` is intentionally off-tone for a one-liner, but that invariant is not locked in a test. If `about.p2` is ever rewritten to carry a career-summary sentence, this one-liner will silently be wrong.

**Fix:** Add a comment at the assembly site explaining why `p2` is skipped (p2 is philosophy/values — "I reach for the boring tool first" — which belongs in long-form, not a bio summary). Example:

```js
// p2 is philosophy/values ("I reach for the boring tool first"), skipped intentionally
// from the one-liner — p1 is what, p3 is seeking, intro is identity.
const experience = `${aboutBlock.intro} ${aboutBlock.p1} ${aboutBlock.p3}`
```

---

### IN-03: Duplicate CLI guards across `sync-projects.mjs` and `build-chat-context.mjs`

**File:** `scripts/build-chat-context.mjs:432`, `scripts/sync-projects.mjs:239`
**Issue:** Both generator scripts replicate the `if (process.argv[1] === fileURLToPath(import.meta.url))` idiom with the same comment pattern. Minor duplication; would DRY naturally if a shared `./_cli-guard.mjs` helper emerged.

**Fix:** No action. Noted for consolidation if a third script appears.

---

### IN-04: `parseAboutExports` error message mentions `template literals` as a future extension path but no test locks the invariant

**File:** `scripts/build-chat-context.mjs:172-200`
**Issue:** The parser only handles `export const NAME = "..."` (double-quoted single-line). The error message is actionable ("normalize back to a literal OR extend parseAboutExports()"), but there is no test that asserts a single-quoted or template-literal form is rejected with the named error. A contributor moving `about.ts` to backtick templates would get a confusing build failure.

**Fix:** Add a unit test (in a new file or the existing chat-context integrity test) that exercises both the happy path and one malformed-form path, asserting the named error.

---

### IN-05: `system-prompt.ts` emits `JSON.stringify(context, null, 2)` for the knowledge block; 2-space indent inflates tokens ~5% vs no-space

**File:** `src/prompts/system-prompt.ts:58`
**Issue:** `JSON.stringify(context, null, 2)` produces human-readable JSON with newlines and 2-space indents. The model tokenizes those whitespace runs. For a 50 KB knowledge block this is ~5% overhead on the cached portion. Because the system prompt is cached, the cost is amortized, so this is a deliberate tradeoff — readable knowledge helps the model cite specific fields.

**Fix:** No change needed. If token budget ever gets tight (it's currently well above the 4096 floor and below the 40 000 info threshold), switching to `JSON.stringify(context)` recovers ~3-5 KB of tokens. Document this tradeoff with a comment so it is a conscious choice.

---

### IN-06: Test redundancy — `tests/api/chat.test.ts` reads `chat.ts` source with `readFileSync` as a secondary guard; duplicates the structural assertions above it

**File:** `tests/api/chat.test.ts:237-266`
**Issue:** The structural assertions on `buildChatRequestArgs` (lines 194-234) are the primary guard and are introspectable. The source-text `readFileSync` checks (lines 237-266) are a belt-and-suspenders regression guard against a future refactor that inlines the literal. The file-level comment explains this. The pattern is load-bearing — removing the source-text checks is OK, but the comment needs to travel with the removal to avoid the inline-literal drift silently disabling cache.

**Fix:** No action. Noted so a future refactor does not blindly delete these as "duplicate tests."

---

_Reviewed: 2026-04-23_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
