// Scroll-depth client-side tracker — Phase 15
// Handles: IntersectionObserver on .scroll-sentinel elements; fires
// scroll_depth events at 25/50/75/100% of <article> height on project
// detail pages only (D-05 scope). Observer construction is gated by
// sentinel presence in the DOM — no-op on non-project routes.
// See 15-CONTEXT.md D-05..D-08 and 15-RESEARCH.md §2.
// Phase 16 D-19: refactored to consume the shared makeRevealObserver factory
// (src/scripts/lib/observer.ts). Behavior is byte-equivalent — handleScrollEntry
// preserves its own per-target unobserve call, oneShot is omitted
// (defaults to false) so the factory does NOT auto-unobserve.

import { makeRevealObserver } from "./lib/observer";

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, unknown>) => void;
    };
  }
}

export {};

// Handle a single observer entry: fire umami scroll_depth event and unobserve target.
// Exported for unit testing — driven synthetically with mock IntersectionObserverEntry.
export function handleScrollEntry(
  entry: IntersectionObserverEntry,
  observer: IntersectionObserver
): void {
  if (!entry.isIntersecting) return;
  const percentAttr = (entry.target as HTMLElement).getAttribute("data-percent");
  if (!percentAttr) return;
  const percent = Number(percentAttr);
  const pathname = typeof location !== "undefined" ? location.pathname : "";
  const slug = pathname.split("/").pop() || "unknown";
  // Optional-chaining guards the L10 load-race window where Umami's <script>
  // hasn't loaded yet — silent no-op rather than thrown error.
  window.umami?.track("scroll_depth", { percent, slug });
  // D-08: one-shot per page-view; reloads refire (matches GA4 semantics).
  observer.unobserve(entry.target);
}

let scrollDepthInitialized = false;

export function initScrollDepth(): void {
  if (scrollDepthInitialized) return;
  // Phase 16 D-19: refactored to consume the shared makeRevealObserver factory.
  // oneShot is omitted (defaults to false) — handleScrollEntry calls
  // unobserve on its own entry.target, preserving Phase 15 D-08
  // per-page-view dedup behavior byte-equivalent. tests/client/scroll-depth.test.ts
  // 7 tests stay GREEN with zero source edits to that test file.
  // D-06: single IntersectionObserver watches all 4 sentinels.
  // D-07: threshold 0 + sentinel-top-enters-viewport semantics.
  const observer = makeRevealObserver({
    selector: ".scroll-sentinel",
    rootMargin: "0px",
    threshold: 0,
    onIntersect: handleScrollEntry,
  });
  if (!observer) return; // Not on a /projects/[id] route (D-05 scope gate)
  scrollDepthInitialized = true;

  if (import.meta.env.DEV) {
    const count = document.querySelectorAll(".scroll-sentinel").length;
    console.log("[scroll-depth] observer attached to", count, "sentinels");
  }
}

// WR-01: bootstrap-level guard prevents document listener pile-up if this
// module is re-evaluated across Astro view transitions. The internal
// scrollDepthInitialized guard already prevents duplicate observer creation,
// so this is purely a slow-GC hygiene fix for long sessions.
let scrollDepthBootstrapped = false;
if (typeof document !== "undefined" && !scrollDepthBootstrapped) {
  scrollDepthBootstrapped = true;
  document.addEventListener("astro:page-load", initScrollDepth);
  if (document.readyState !== "loading") {
    initScrollDepth();
  } else {
    document.addEventListener("DOMContentLoaded", initScrollDepth);
  }
}
