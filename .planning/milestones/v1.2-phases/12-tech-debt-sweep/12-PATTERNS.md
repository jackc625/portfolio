# Phase 12: Tech Debt Sweep — Pattern Map

**Mapped:** 2026-04-15
**Files analyzed:** 11 (10 modified + 1 new test + 1 already-created VALIDATION.md)
**Analogs found:** 10 / 11 (all changed files have an in-repo analog; the new `tests/client/chat-copy-button.test.ts` follows the `tests/client/markdown.test.ts` skeleton)

---

## File Classification

| File | New/Modified | Role | Data Flow |
|------|--------------|------|-----------|
| `src/scripts/chat.ts` | modified | script (client DOM) | event-driven (DOM imperative render + click handler) |
| `src/components/primitives/MobileMenu.astro` | modified | primitive (Astro + scoped script) | event-driven (open/close DOM attribute toggle) |
| `src/components/primitives/Container.astro` | modified | primitive (Astro) | transform (wrapper component, no data flow) |
| `src/styles/global.css` | modified | style (CSS tokens + Tailwind bridge) | transform (CSS authoring) |
| `wrangler.jsonc` | modified | config (Cloudflare Workers) | transform (build-time config) |
| `eslint.config.mjs` | modified | config (ESLint flat config) | transform (lint config) |
| `package.json` | modified | config (devDep version bump) | transform (manifest) |
| `design-system/MASTER.md` | modified | doc (design-system contract) | transform (doc authoring) |
| `.planning/milestones/v1.1-MILESTONE-AUDIT.md` | modified | doc (audit log) | transform (audit close-out) |
| `src/layouts/BaseLayout.astro` | verification-only | layout (wrapper) | request-response (SSR meta emission) |
| `tests/client/chat-copy-button.test.ts` | new | test (vitest + jsdom) | request-response (unit test) |

---

## Pattern Assignments

### `src/scripts/chat.ts` — add `createCopyButton(getContent)` helper + 2 call-site swaps

**Role:** script (client DOM, imperative rendering).
**Closest analog:** itself — `createBotMessageEl` (lines 266-310), `createUserMessageEl` (lines 245-263), and the already-canonical replay-path block (lines 553-569). Helper lives adjacent to `createBotMessageEl`.

**Module-scope-function signature pattern** (`chat.ts:266` — canonical shape for new helper):

```ts
function createBotMessageEl(content: string): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "chat-message-wrapper";
  wrapper.style.cssText = "display: flex; justify-content: flex-start; margin-bottom: 8px; position: relative;";
  // …
  return wrapper;
}
```

New helper follows the same shape (no export, lowercase-factory name, returns a DOM node, sets `className` then `style.cssText`, wires listener before return).

**Canonical markup to emit** — lifted verbatim from replay path (`chat.ts:553-569`):

```ts
const copyBtn = document.createElement("button");
copyBtn.className = "chat-copy-btn label-mono";
copyBtn.textContent = "COPY";
copyBtn.setAttribute("aria-label", "Copy message");
copyBtn.type = "button";
copyBtn.style.cssText = "position: absolute; top: -4px; right: 0; background: none; border: none; cursor: pointer;";
const capturedContent = msg.content;
copyBtn.addEventListener("click", () => {
  copyToClipboard(capturedContent, copyBtn);
  copyBtn.textContent = "COPIED";
  copyBtn.style.color = "var(--accent)";
  setTimeout(() => {
    copyBtn.textContent = "COPY";
    copyBtn.style.color = "var(--ink-faint)";
  }, 1000);
});
wrapper.appendChild(copyBtn);
```

**Deprecated (to be deleted) — live-stream SVG block** (`chat.ts:285-308`):

```ts
const copyBtn = document.createElement("button");
copyBtn.className = "chat-copy-btn";
copyBtn.setAttribute("aria-label", "Copy message");
copyBtn.style.cssText = `
  position: absolute;
  top: -4px;
  right: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 4px;
`;
copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" …>…</svg>`;
copyBtn.addEventListener("click", () => {
  copyToClipboard(content, copyBtn);
});
```

Replace both call sites with `createCopyButton(() => content)` (live) and `createCopyButton(() => msg.content)` (replay). `getContent` is a function (not a string) so the live-stream path can read the final `botContent` at click-time without the `cloneNode` dance.

**`copyToClipboard` signature to pass the button through** (`chat.ts:231-239` — unchanged, shows the contract the helper must honor):

```ts
async function copyToClipboard(text: string, button: HTMLElement): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    button.classList.add("copy-success");
    setTimeout(() => button.classList.remove("copy-success"), 2000);
  } catch {
    // Silently fail — no user-visible error for copy failure on non-HTTPS
  }
}
```

**Clipboard idempotency `cloneNode` rewire — PRESERVE** (`chat.ts:822-832`):

```ts
// Update copy button to use final content
const copyBtn = botEl?.querySelector(".chat-copy-btn");
if (copyBtn) {
  copyBtn.replaceWith(copyBtn.cloneNode(true));
  const newCopyBtn = botEl?.querySelector(".chat-copy-btn") as HTMLElement;
  if (newCopyBtn) {
    newCopyBtn.addEventListener("click", () => {
      copyToClipboard(botContent, newCopyBtn);
    });
  }
}
```

Per RESEARCH.md A2: do NOT simplify this rewire in Phase 12. Keeping it means the helper's closure-over-function-content design is additive, not replacing. If the planner elects to simplify, D-26 gate MUST cover clipboard double-click idempotency.

---

### `src/components/primitives/MobileMenu.astro` — extend inert set/remove to ChatWidget

**Role:** primitive (Astro component with scoped `<script>`).
**Closest analog:** the same file — the existing `<header>`/`<main>`/`<footer>` inert block inside `openMenu()` / `closeMenu()` at lines 261-291.

**Exact pattern to extend** (`MobileMenu.astro:261-291`):

```ts
function openMenu() {
  menu.classList.add("is-open");
  menu.setAttribute("aria-hidden", "false");
  trigger!.setAttribute("aria-expanded", "true");
  trigger!.setAttribute("aria-label", "Close menu");
  document.body.style.overflow = "hidden";
  // WR-01: Make the rest of the page inert while the dialog is open so
  // header/main/footer elements are removed from the tab order and the
  // a11y tree. `inert` has 95%+ browser support in 2026 and is the
  // canonical modal-dialog pattern per ARIA authoring practices.
  document.querySelector("header")?.setAttribute("inert", "");
  document.querySelector("main")?.setAttribute("inert", "");
  document.querySelector("footer")?.setAttribute("inert", "");
  // Focus the close button first so keyboard users land inside the dialog
  closeBtn!.focus();
  document.addEventListener("keydown", handleKeyDown);
}

function closeMenu(returnFocus = true) {
  menu.classList.remove("is-open");
  menu.setAttribute("aria-hidden", "true");
  trigger!.setAttribute("aria-expanded", "false");
  trigger!.setAttribute("aria-label", "Open menu");
  document.body.style.overflow = "";
  // WR-01: Restore the rest of the page to the tab order / a11y tree.
  document.querySelector("header")?.removeAttribute("inert");
  document.querySelector("main")?.removeAttribute("inert");
  document.querySelector("footer")?.removeAttribute("inert");
  document.removeEventListener("keydown", handleKeyDown);
  if (returnFocus) trigger!.focus();
}
```

**Extension (identical idiom, add beside the existing three selectors):**

```ts
document.querySelector(".chat-widget")?.setAttribute("inert", "");   // in openMenu
document.querySelector(".chat-widget")?.removeAttribute("inert");   // in closeMenu
```

ChatWidget root selector confirmed at `src/components/chat/ChatWidget.astro:9` — `<div class="chat-widget" data-no-print>`. No id; use `.chat-widget`.

**Focus-trap handler — PRESERVE as-is (D-10)** (`MobileMenu.astro:293-317`):

```ts
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    closeMenu();
    return;
  }
  if (e.key !== "Tab") return;

  // D-08: re-query focusable elements on EVERY Tab keypress — matches
  // src/scripts/chat.ts setupFocusTrap so dynamically-rendered descendants
  // (if any are added in later phases) are always included.
  const focusable = menu.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  // …first/last boundary bounce…
}
```

Keep per D-10 — belt-and-suspenders; D-08 per-Tab re-query invariant shared with `chat.ts setupFocusTrap` must not diverge.

---

### `src/components/primitives/Container.astro` — delete stale eslint-disable at :18

**Role:** primitive (Astro).
**Closest analog:** any other primitive that consumes `Props` directly (e.g., elsewhere in this same file — compare to how other `src/components/primitives/*.astro` declare props). The current file is the only repo example of the eslint-disable + alias pattern.

**Current (to be removed)** (`Container.astro:14-20`):

```astro
interface Props {
  as?: keyof HTMLElementTagNameMap;
  class?: string;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- consumed by Astro's type system
const _props: Props = Astro.props;
const { as: Tag = "div", class: className } = _props;
```

**Target pattern (planner selects whichever restores 0 lint warnings):**

Option A — direct destructure from `Astro.props` with inline type:

```astro
const { as: Tag = "div", class: className } = Astro.props as Props;
```

Option B — drop the `_props` alias but keep `Props` interface for the type annotation at destructure:

```astro
const { as: Tag = "div", class: className }: Props = Astro.props;
```

Both eliminate the `no-unused-vars` trigger so the disable-directive is genuinely unused. Decision rationale: the disable comment triggers `unused-disable-directive` after some flat-config / typescript-eslint version bump — the underscore-prefix rule in `eslint.config.mjs:16-23` now exempts `_props` automatically, making the directive redundant.

---

### `src/styles/global.css` — rewrite comment at :34 to remove bracket-syntax literals

**Role:** style.
**Closest analog:** the comment block immediately above (`global.css:23-28`) — prose-only, no bracket literals:

```css
/* ============================================
 * LAYER 2: Tailwind @theme Bridge
 * Maps CSS custom properties to Tailwind utility classes.
 * All color values reference the editorial :root tokens so palette
 * changes propagate automatically (RESEARCH.md Pitfall 4).
 * ============================================ */
```

**Current (load-bearing literal)** (`global.css:32-40`):

```css
/* Scope Tailwind class detection to source files only.
 * Tailwind v4 auto-detects template files in the repo. The .planning/ directory
 * contains v1.0 plan artifacts with literal class examples like px-[var(--token-*)]
 * that generate lightning-css parse warnings. The @source not directives exclude
 * .planning/ and design-system/ from Tailwind's detection surface. */
@source "../**/*.{astro,html,js,jsx,ts,tsx,md,mdx}";
@source not "../../.planning/**";
@source not "../../design-system/**";
```

**Rewrite goal (D-06):** strip the `px-[var(--token-*)]` literal so the `@source not` exclusion isn't load-bearing for this file's own comment. Replace with prose description (e.g., "literal class examples using bracket syntax"). Preserve all three `@source` directives verbatim — they are load-bearing.

**Print-stylesheet `#666` location (verification target only, no code change per D-15)** (`global.css:196-201`):

```css
a[href^="http"]::after {
  content: " (" attr(href) ")";
  font-size: 9pt;
  color: #666;
  font-family: var(--font-body);
}
```

No inline CSS comment. The exception is documented in MASTER.md §2.4 only.

---

### `wrangler.jsonc` — fix `rate_limits` → `ratelimits` schema OR delete block

**Role:** config (Cloudflare Workers).
**Closest analog:** the `assets` block in the same file (`wrangler.jsonc:7-10`) as a canonical one-off nested binding shape:

```jsonc
"assets": {
  "binding": "ASSETS",
  "directory": "./dist/client"
},
```

**Current block (schema-wrong, emits ×6 "Unexpected fields" warnings)** (`wrangler.jsonc:11-26`):

```jsonc
// D-10 specifies ~20 messages/hour, but Cloudflare rate limit bindings
// only support periods of 10 or 60 seconds — hourly windows are not available.
// Using limit:5/period:60 (5 requests per 60 seconds) as a UX-friendly
// implementation that allows small bursts (e.g., recruiter asking follow-ups)
// while still preventing abuse (~300 requests/hour theoretical max).
// Addresses review concern: 3/60s was too aggressive for UX per Claude+Codex feedback.
"rate_limits": [
  {
    "binding": "CHAT_RATE_LIMITER",
    "namespace_id": "1001",
    "simple": {
      "limit": 5,
      "period": 60
    }
  }
]
```

**Planner decision gate (per RESEARCH.md §Q1 + Open Question 1):** grep `src/pages/api/chat.ts` for `CHAT_RATE_LIMITER`. Already verified:

```ts
// src/pages/api/chat.ts:33-45
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
```

The call exists and is guarded by `if (rateLimiter)` — if the binding is undefined at runtime (which it currently is — schema is wrong so Wrangler never registered it), the branch is a silent no-op. **Recommendation per RESEARCH.md §Q1:** rename to the correct schema so the binding goes live. Canonical schema from Cloudflare docs (RESEARCH.md §Q1):

```jsonc
"ratelimits": [
  {
    "name": "CHAT_RATE_LIMITER",
    "namespace_id": "1001",
    "simple": {
      "limit": 5,
      "period": 60
    }
  }
]
```

Note: top-level key loses the underscore (`ratelimits`); inner field renames `binding` → `name`. Planner may alternatively delete the block — only if the app-layer rate-limit is to remain the sole enforcement tier. Document the choice in the plan.

---

### `eslint.config.mjs` — add `worker-configuration.d.ts` to ignores array

**Role:** config (ESLint flat config, ESLint 10.1.0).
**Closest analog:** the existing `ignores` entry in the same file, line 6.

**Current shape** (`eslint.config.mjs:4-10`):

```js
export default [
  {
    ignores: [".astro/", "dist/", ".claude/", ".ship-safe/"],
  },
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  {
```

**One-liner change (append the generated `wrangler types` output file):**

```js
ignores: [".astro/", "dist/", ".claude/", ".ship-safe/", "worker-configuration.d.ts"],
```

Per RESEARCH.md §Q3: a config object with only `ignores` (no `rules`, no `files`) is a global ignore in flat config; bare filename matches the repo-root generated file. Do **not** use `globalIgnores()` / `defineConfig` helper — adds dependency without benefit.

---

### `package.json` — bump wrangler devDep to 4.83+

**Role:** config (manifest).
**Closest analog:** the existing devDependencies block (`package.json:34-47`).

**Current** (`package.json:46`):

```json
"wrangler": "^4.80.0"
```

**Target:**

```json
"wrangler": "^4.83.0"
```

Caret range keeps forward compat within major 4. Run `pnpm install` post-edit. Per RESEARCH.md §Risks row 2: after upgrade, run `pnpm types` (regenerates `worker-configuration.d.ts`) + `pnpm check` (TS) before the build; if TS surfaces errors, pin to 4.82 or 4.81 incrementally.

---

### `design-system/MASTER.md` — insert §2.4 Accepted token exceptions

**Role:** doc (design-system contract).
**Closest analog:** §10 Chat Bubble Exception at line 783 (prose shape) + §2.1/§2.2 tables at lines 32-50 (table shape). §2.4 adopts the **table shape** because it documents multiple entries with repeated schema, matching existing §2.1/§2.2/§3.1 patterns.

**Structural template — §10 Chat Bubble Exception (prose anchor for the "this is a documented exception" pattern)** (`MASTER.md:783-787`):

```markdown
## 10. Chat Bubble Exception

The round accent chat bubble (48x48px, background: var(--accent), border-radius: 50%) is the only round surface in the editorial system. This is a deliberate exception to the flat-rectangle grammar -- the bubble serves as the accent-red beacon signaling the chatbot exists.

Every other surface in the system uses `border-radius: 0` (work rows, chat panel, chips, textarea, send button). The bubble's roundness is a functional signal — it communicates "this is a different kind of UI element" at a glance. Without it, the chat entry point would be indistinguishable from the editorial chrome.
```

**Table shape (from §2.1)** — canonical column headers and alignment:

```markdown
| Token         | Value     | Usage                                                            |
| ------------- | --------- | ---------------------------------------------------------------- |
| `--bg`        | `#FAFAF7` | Page background (warm off-white)                                 |
| `--ink`       | `#0A0A0A` | Primary text (near-black) — body, headings, hovered nav links   |
```

**Insertion site:** immediately after §2.3 Lock contract (ends at `MASTER.md:84`), before the `---` separator at `:86`. Use the full §2.4 skeleton from `RESEARCH.md §Q6` (lines 291-320) — two table entries, Status = "Permanent-accepted — will not be addressed in v1.x".

**Changelog entry (append to §11 at line 791-794 area)** — matches existing changelog line shape:

```markdown
- 2026-04-15 — Phase 12 amendment: §2.4 Accepted token exceptions added (`--ink-faint` contrast + print `#666`)
```

Existing changelog lines for reference (`MASTER.md:793-794`):

```markdown
- 2026-04-13 — Phase 10 head-of-phase amendment: §6.1 typing-dot carve-out, §5.2/§5.8 X drop from social rows, §10 chat bubble exception
- 2026-04-07 — v1.1 initial lock (Phase 8)
```

---

### `.planning/milestones/v1.1-MILESTONE-AUDIT.md` — update 7 carried items to closed/accepted

**Role:** doc (audit log, frontmatter + prose).
**Closest analog:** existing audit entry prose in the same file — lines 162-171 (Tech Debt section per-phase bullets).

**Current per-phase bullets (to be amended)** (`v1.1-MILESTONE-AUDIT.md:161-171`):

```markdown
### Phase 9: Primitives
- **4 lightning-css warnings** (`Unexpected token Delim('*')`) from literal `var(--token-*)` example strings in template detection surface. Build exits 0. Tracked in `.planning/phases/09-primitives/deferred-items.md`. Originally deferred to Phase 11 but not closed.
- **WR-01:** MobileMenu focus trap catches only first/last tab boundary — middle elements behind backdrop remain in tab order.
- **WR-03:** `BaseLayout.astro:49,67` OG image URL builder corrupts already-absolute URLs. No current call site hits this path.
- **IN-06:** `#666` hex in `global.css:174` print stylesheet outside the 6-token palette (print-only).

### Phase 10: Page Port
- **Live bot copy button inconsistency:** `chat.ts:302` assigns `copyBtn.innerHTML = '<svg…>'` for live streaming messages while history replay at `chat.ts:555` uses `copyBtn.textContent = "COPY"`. …

### Phase 11: Polish
- **`--ink-faint` contrast (2.5:1 on `--bg`)** fails WCAG AA 4.5:1 for normal text. Intentionally accepted for tertiary/decorative metadata only …
```

**Annotation pattern (per D-19):** each bullet gets an inline status tag + close/accept reference. Suggested shape (adopt project-local convention when planner writes the diff):

```markdown
- **WR-01:** MobileMenu focus trap … — **closed** in Phase 12 (DEBT-02, commit `<sha>`).
- **WR-03:** `BaseLayout.astro:49,67` OG image URL builder … — **closed** in Phase 11 (resolveOg guard at `BaseLayout.astro:38-39`); verified in Phase 12 (DEBT-03).
- **WR-04:** `/dev/primitives.astro` `previewYears[i]` — **closed by Phase 11** (route deleted).
- **IN-06:** `#666` hex in print stylesheet — **accepted trade-off** (MASTER.md §2.4, Phase 12 DEBT-05).
- **--ink-faint contrast** — **accepted trade-off** (MASTER.md §2.4, Phase 12 DEBT-05).
```

**Frontmatter update** (`v1.1-MILESTONE-AUDIT.md:15-29`): the `tech_debt:` block remains historical but a closing note in the frontmatter or a new top-of-file "Phase 12 close-out" paragraph should record the sweep. The frontmatter schema itself (see lines 1-14) shows the existing YAML shape — do not mutate frontmatter keys; append prose to the narrative body instead.

---

### `src/layouts/BaseLayout.astro` — verification-only

**Role:** layout (wrapper, emits SEO meta via `astro-seo`).
**Closest analog:** itself — the already-shipped `resolveOg` guard.

**Already-shipped pattern (no code change unless verification surfaces a regression)** (`BaseLayout.astro:34-40`):

```astro
// WR-03: Pass-through absolute URLs (e.g., CDN OG images) unchanged. Only
// prepend siteUrl for root-relative paths like "/og-default.png". Without
// this guard, `${siteUrl}${ogImage}` would corrupt absolute URLs into
// `https://jackcutrara.comhttps://cdn.example.com/hero.png`.
const resolveOg = (img: string) =>
  /^https?:\/\//i.test(img) ? img : `${siteUrl}${img}`;
const resolvedOgImage = resolveOg(ogImage);
```

Verification is a 5-URL curl sweep against production (see RESEARCH.md §Q4) — table of results lands in `12-VALIDATION.md`, no edit here unless a regression is found.

---

### `tests/client/chat-copy-button.test.ts` — new vitest + jsdom test

**Role:** test (unit, client DOM).
**Closest analog:** `tests/client/markdown.test.ts` — same env directive, same `describe/it/expect` shape, same import from `src/scripts/chat.ts`.

**Skeleton pattern from `markdown.test.ts:1-15`:**

```ts
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderMarkdown } from "../../src/scripts/chat";

describe("Markdown Rendering + XSS Sanitization (D-21, D-25)", () => {
  it("renders bold markdown to strong tags", () => {
    const result = renderMarkdown("**bold**");
    expect(result).toContain("<strong>bold</strong>");
  });
  // …
});
```

**Secondary analog — `tests/client/focus-visible.test.ts:1-44`** — shows file-read test assertions (not applicable here, but demonstrates the project's preference for direct `expect(…).toContain(…)` over heavy matchers). Use the `markdown.test.ts` shape — import the helper, instantiate, assert DOM attributes.

**New test structure (derived from RESEARCH.md §Validation Architecture line 400):**

```ts
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { createCopyButton } from "../../src/scripts/chat";

describe("createCopyButton (DEBT-04)", () => {
  it("emits canonical COPY label markup", () => {
    const btn = createCopyButton(() => "hello");
    expect(btn.tagName).toBe("BUTTON");
    expect(btn.className).toContain("chat-copy-btn");
    expect(btn.className).toContain("label-mono");
    expect(btn.type).toBe("button");
    expect(btn.textContent).toBe("COPY");
    expect(btn.getAttribute("aria-label")).toBe("Copy message");
  });

  it("markup identical between invocations (live + replay parity)", () => {
    const live = createCopyButton(() => "msg");
    const replay = createCopyButton(() => "msg");
    expect(live.outerHTML).toBe(replay.outerHTML);
  });

  it("flips to COPIED + accent on click, reverts after 1s", async () => {
    vi.useFakeTimers();
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    const btn = createCopyButton(() => "payload");
    document.body.appendChild(btn);
    btn.click();
    // tick past the clipboard microtask
    await Promise.resolve();
    expect(btn.textContent).toBe("COPIED");
    expect(btn.style.color).toBe("var(--accent)");
    vi.advanceTimersByTime(1000);
    expect(btn.textContent).toBe("COPY");
    vi.useRealTimers();
  });
});
```

The helper must be exported from `src/scripts/chat.ts` for the test to import. Only the helper gets exported — other internal functions stay module-scoped. Alternatively, co-locate the helper in a separate module and re-import; planner's call.

**Test run command:** `pnpm test` (defined at `package.json:18` as `"test": "vitest run"`). No separate `vitest.config.*` needed (defaults apply; test discovery via file glob — the new file must match `tests/**/*.test.ts`).

---

## Shared Patterns

### Inert set/remove idiom
**Source:** `src/components/primitives/MobileMenu.astro:271-273, 286-288`
**Apply to:** MobileMenu.astro only (one edit site; additive for ChatWidget)

```ts
document.querySelector("header")?.setAttribute("inert", "");
// …
document.querySelector("header")?.removeAttribute("inert");
```

One-liner per element, optional-chained, no null handling. Extension to `.chat-widget` is a single pair of lines in `openMenu` + `closeMenu`.

### Focus-trap re-query (D-08 invariant)
**Source:** `src/components/primitives/MobileMenu.astro:303-305` (and mirror in `src/scripts/chat.ts setupFocusTrap`)
**Apply to:** any new focus-management code (none in Phase 12 — invariant is preserved, not extended)

```ts
const focusable = menu.querySelectorAll<HTMLElement>(
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
);
```

Re-query on every Tab keypress — not cached at open-time. Any future focus-trap author must follow the same shape.

### Design-token consumption
**Source:** `src/styles/global.css:7-14`
**Apply to:** any new CSS color / any JS-authored inline style in `chat.ts`

```css
:root {
  --bg: #FAFAF7;
  --ink: #0A0A0A;
  --ink-muted: #52525B;
  --ink-faint: #A1A1AA;
  --rule: #E4E4E7;
  --accent: #E63946;
}
```

Accessed via `var(--token)` in CSS and inline JS style strings (e.g., `copyBtn.style.color = "var(--accent)"`). No hex literals outside the §2.4 documented exceptions (print `#666`).

### Vitest + jsdom test skeleton
**Source:** `tests/client/markdown.test.ts:1-15`
**Apply to:** new `tests/client/chat-copy-button.test.ts`

```ts
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { <helper> } from "../../src/scripts/chat";

describe("<capability> (<REQ-ID>)", () => {
  it("<behavior>", () => {
    // …
  });
});
```

Path convention: `../../src/scripts/chat` (two-up + source path). No custom reporter config. `pnpm test` runs via `vitest run`.

### Audit close-out annotation
**Source:** `v1.1-MILESTONE-AUDIT.md:162-168` (existing Tech Debt bullets)
**Apply to:** the same file (Phase 12 close-out)

Each bullet is prose Markdown with a **bold ID prefix** (WR-01, WR-03, IN-06) and trailing context. Phase 12 amendment adds an inline `— **closed** in Phase 12 (DEBT-NN, commit <sha>)` or `— **accepted trade-off** (MASTER.md §2.4)` tag at the end of each bullet. Do not delete the original bullet text — append only.

### MASTER.md section amendment
**Source:** `design-system/MASTER.md:791-794` (§11 Changelog)
**Apply to:** §11 changelog update + §2.4 insertion

Changelog is a reverse-chronological bullet list. Each entry starts with `- YYYY-MM-DD — <phase-scope> amendment: <summary>`. Phase 12 entry follows verbatim.

---

## No Analog Found

None. Every file in Phase 12 scope has a direct or near-direct analog in the codebase. The new `tests/client/chat-copy-button.test.ts` re-uses the `tests/client/markdown.test.ts` skeleton; the new helper in `chat.ts` re-uses the `createBotMessageEl` factory shape + the replay-path canonical markup; the MASTER.md §2.4 entries re-use the §2.1 table shape; the audit close-out re-uses the existing Tech Debt bullet shape; everything else (config, docs) is a surgical edit with an obvious analog in the same file.

---

## Metadata

**Analog search scope:** `src/scripts/`, `src/components/primitives/`, `src/components/chat/`, `src/layouts/`, `src/styles/`, `src/pages/api/`, `tests/`, `design-system/`, `.planning/milestones/`, repo root config files.
**Files scanned:** 9 source files + 4 config files + 2 docs + 3 existing test files (for skeleton patterns).
**Pattern extraction date:** 2026-04-15
