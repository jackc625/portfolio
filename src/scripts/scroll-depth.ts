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

// Skeleton — Task 2 fills in the body. Keep signature stable for the test file.
export function handleScrollEntry(
  entry: IntersectionObserverEntry,
  observer: IntersectionObserver
): void {
  // TODO(Task 2): fire scroll_depth event + unobserve
  void entry;
  void observer;
}

let scrollDepthInitialized = false;

export function initScrollDepth(): void {
  if (scrollDepthInitialized) return;
  const sentinels = document.querySelectorAll<HTMLElement>(".scroll-sentinel");
  if (sentinels.length === 0) return; // Not on a /projects/[id] route — no-op
  scrollDepthInitialized = true;
  // TODO(Task 2): construct observer + observe each sentinel
}

if (typeof document !== "undefined") {
  document.addEventListener("astro:page-load", initScrollDepth);
  if (document.readyState !== "loading") {
    initScrollDepth();
  } else {
    document.addEventListener("DOMContentLoaded", initScrollDepth);
  }
}
