// Shared IntersectionObserver factory — Phase 16 D-17 / D-18
// Consumed by:
//   - src/scripts/scroll-depth.ts (D-19 byte-equivalence: oneShot omitted = caller-managed unobserve)
//   - src/scripts/motion.ts        (Plan 04: oneShot: true for one-shot reveal targets)
// Why a factory: deduplicate the new IntersectionObserver(...) + querySelectorAll +
// forEach observe pattern that scroll-depth.ts pioneered in Phase 15. motion.ts in
// Plan 04 reuses the same kernel.

export type RevealObserverOptions = {
  selector: string;
  rootMargin: string;
  threshold: number;
  onIntersect: (entry: IntersectionObserverEntry, observer: IntersectionObserver) => void;
  /**
   * When true, the factory calls `observer.unobserve(entry.target)` automatically
   * after `onIntersect` for each intersecting target. Use for one-shot reveal patterns
   * (e.g., motion.ts MOTN-02). Default: false (caller manages unobserve, e.g.,
   * scroll-depth.ts handleScrollEntry already calls observer.unobserve internally).
   */
  oneShot?: boolean;
};

export function makeRevealObserver(
  options: RevealObserverOptions
): IntersectionObserver | null {
  const { selector, rootMargin, threshold, onIntersect, oneShot = false } = options;
  if (typeof document === "undefined") return null;
  const targets = document.querySelectorAll<HTMLElement>(selector);
  if (targets.length === 0) return null;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        onIntersect(entry, observer);
        if (oneShot) {
          observer.unobserve(entry.target);
        }
      }
    },
    { rootMargin, threshold }
  );

  targets.forEach((el) => observer.observe(el));
  return observer;
}
