// @vitest-environment jsdom
/**
 * DEBT-04 — astro:page-load listener idempotency.
 *
 * Three chat-surface client modules register an astro:page-load listener at
 * module-eval time (chat.ts, analytics.ts, scroll-depth.ts). Pre-DEBT-04, the
 * registration was guarded by a module-level *Bootstrapped flag — which
 * resets on every module re-evaluation, so HMR / vi.resetModules() in a long
 * session could accumulate listeners with NO mechanism to remove them. The
 * fix per RESEARCH §"Pattern 3" is remove-then-add at the document level:
 * removeEventListener is a no-op when the handler reference is not in the
 * document's internal listener registry, idempotent when it is, so calling
 * remove BEFORE add is a safe identity operation that converges to "this
 * handler reference is in the registry exactly once."
 *
 * Two-prong validation:
 *
 *   1. SOURCE-LEVEL ASSERTION — each module's source contains a
 *      `removeEventListener("astro:page-load", initX)` call paired with the
 *      `addEventListener("astro:page-load", initX)` call. This is the
 *      anti-regression invariant: future edits that drop the remove half
 *      would silently re-open the accumulation bug, so the test reads the
 *      source text and asserts the pattern is present.
 *
 *   2. BEHAVIORAL ASSERTION (single-evaluation) — when each module is
 *      evaluated under jsdom, document.removeEventListener("astro:page-load")
 *      is called at least once during bootstrap and document.addEventListener
 *      ("astro:page-load") is called at least once. Confirms the bootstrap
 *      hits both branches at runtime, not just that the source contains the
 *      string.
 *
 * Note on cross-evaluation behavior: vi.resetModules() re-evaluates each
 * module fresh, which creates a NEW handler reference (initX_v2). The
 * removeEventListener on v2 does not remove v1's prior registration because
 * the handler references differ — the new evaluation's remove is a no-op
 * against v1. This is a fundamental constraint of the browser
 * EventTarget API: the (target, type, handler) tuple identity is reference-
 * based, and module re-evaluation breaks the reference identity.
 *
 * In production, this constraint does NOT bite: Astro re-runs astro:page-load
 * across view transitions WITHOUT re-evaluating the module (the module
 * remains in the same JS realm; the listener fires repeatedly against the
 * stable handler reference from the original evaluation). HMR triggers a
 * full page reload for these scripts in the current setup, also avoiding
 * cross-evaluation reference drift. The remove-then-add pattern's value is
 * therefore concentrated in:
 *   - Idempotent within a single evaluation (multiple bootstrap re-entries)
 *   - Future-proofing against Astro / Vite changes that introduce module
 *     re-evaluation without page reload — the pattern is the lowest-cost
 *     defense available without a global handler-slot.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const CHAT_SURFACE_MODULES = [
  {
    label: "src/scripts/analytics.ts",
    importPath: "../../src/scripts/analytics",
    fsPath: "src/scripts/analytics.ts",
    handlerName: "initAnalytics",
  },
  {
    label: "src/scripts/scroll-depth.ts",
    importPath: "../../src/scripts/scroll-depth",
    fsPath: "src/scripts/scroll-depth.ts",
    handlerName: "initScrollDepth",
  },
  {
    label: "src/scripts/chat.ts",
    importPath: "../../src/scripts/chat",
    fsPath: "src/scripts/chat.ts",
    handlerName: "initChat",
  },
] as const;

describe("DEBT-04: idempotent astro:page-load listener registration", () => {
  describe("source-level — remove-then-add pattern present", () => {
    it.each(CHAT_SURFACE_MODULES)(
      "$label calls removeEventListener('astro:page-load', $handlerName) before addEventListener",
      ({ fsPath, handlerName }) => {
        const src = readFileSync(join(process.cwd(), fsPath), "utf8");
        // Anchor on the bootstrap block — match remove-then-add of the same
        // handler reference, allowing any whitespace between the two calls.
        const removePattern = new RegExp(
          `removeEventListener\\(\\s*["']astro:page-load["']\\s*,\\s*${handlerName}\\s*\\)`,
        );
        const addPattern = new RegExp(
          `addEventListener\\(\\s*["']astro:page-load["']\\s*,\\s*${handlerName}\\s*\\)`,
        );
        expect(src).toMatch(removePattern);
        expect(src).toMatch(addPattern);

        // The remove must precede the add — order matters for the dedup
        // invariant.
        const removeIdx = src.search(removePattern);
        const addIdx = src.search(addPattern);
        expect(removeIdx).toBeGreaterThan(-1);
        expect(addIdx).toBeGreaterThan(-1);
        expect(removeIdx).toBeLessThan(addIdx);
      },
    );

    it.each(CHAT_SURFACE_MODULES)(
      "$label does NOT contain the legacy *Bootstrapped flag",
      ({ fsPath, handlerName }) => {
        const src = readFileSync(join(process.cwd(), fsPath), "utf8");
        // Derive the legacy flag name from the handler name:
        //   initAnalytics    → analyticsBootstrapped
        //   initScrollDepth  → scrollDepthBootstrapped
        //   initChat         → chatBootstrapped
        const base = handlerName.replace(/^init/, "");
        const flagName =
          base.charAt(0).toLowerCase() + base.slice(1) + "Bootstrapped";
        expect(src).not.toContain(flagName);
      },
    );
  });

  describe("behavioral — bootstrap fires remove+add at runtime", () => {
    let addSpy: ReturnType<typeof vi.spyOn>;
    let removeSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      (
        window as unknown as { IntersectionObserver: unknown }
      ).IntersectionObserver = class {
        constructor(public cb: IntersectionObserverCallback) {}
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = vi.fn();
        takeRecords = vi.fn(() => []);
      };
      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        writable: true,
        value: () => ({
          matches: false,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }),
      });
      (globalThis as unknown as { fetch: unknown }).fetch = vi.fn();

      addSpy = vi.spyOn(document, "addEventListener");
      removeSpy = vi.spyOn(document, "removeEventListener");
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.resetModules();
    });

    it.each(CHAT_SURFACE_MODULES)(
      "evaluating $label calls both removeEventListener and addEventListener for astro:page-load",
      async ({ importPath }) => {
        vi.resetModules();
        await import(importPath);

        // Rule 3 fix (Plan 17-08): annotate the filter callback param to
        // resolve ts(7006) implicit-any errors carried forward from Plan 17-03.
        // Plan 17-08 is the deploy gate and CANNOT push to main with a failing
        // build; pnpm build runs astro check && astro build, and astro check
        // failed on these two filters until this fix landed. The annotation is
        // narrow (only the lexical type for the callback param), preserves the
        // runtime behavior byte-identically, and is the smallest possible
        // closure path. The mock.calls element type is the spied function's
        // parameter tuple — for document.removeEventListener / addEventListener
        // it's [type, listener, options?].
        const removes = removeSpy.mock.calls.filter(
          (c: unknown[]) => c[0] === "astro:page-load",
        );
        const adds = addSpy.mock.calls.filter(
          (c: unknown[]) => c[0] === "astro:page-load",
        );

        expect(removes.length).toBeGreaterThanOrEqual(1);
        expect(adds.length).toBeGreaterThanOrEqual(1);

        // The handler reference passed to remove must equal the reference
        // passed to add — proves the dedup invariant is sound (same reference
        // converges to exactly-one in the document's listener registry).
        expect(removes[0][1]).toBe(adds[0][1]);
      },
    );
  });
});
