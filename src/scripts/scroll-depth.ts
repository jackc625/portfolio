// Scroll-depth client-side tracker — Phase 15
// Handles: IntersectionObserver on .scroll-sentinel elements; fires
// scroll_depth events at 25/50/75/100% of <article> height on project
// detail pages only (D-05 scope). Observer construction is gated by
// sentinel presence in the DOM — no-op on non-project routes.
// See 15-CONTEXT.md D-05..D-08 and 15-RESEARCH.md §2.

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
  const sentinels = document.querySelectorAll<HTMLElement>(".scroll-sentinel");
  if (sentinels.length === 0) return; // Not on a /projects/[id] route (D-05 scope gate)
  scrollDepthInitialized = true;

  // D-06: single IntersectionObserver watches all 4 sentinels.
  // D-07: threshold 0 + sentinel-top-enters-viewport semantics.
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        handleScrollEntry(entry, observer);
      }
    },
    { threshold: 0, rootMargin: "0px" }
  );

  sentinels.forEach((el) => observer.observe(el));

  if (import.meta.env.DEV) {
    console.log("[scroll-depth] observer attached to", sentinels.length, "sentinels");
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
