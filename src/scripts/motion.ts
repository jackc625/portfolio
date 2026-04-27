// Motion layer — Phase 16 D-04 / D-09 / D-13 / D-17 / D-23 / D-25
// Handles: scroll-reveal (MOTN-02) on .h1-section / .work-row / .prose-editorial paragraphs / .about-body paragraphs;
// word-stagger (MOTN-07) on .h1-section only (.display NEVER wrapped per D-08 / D-12);
// reduced-motion gate — bails entirely when matchMedia reduce matches (MOTN-08 / D-25).
// Consumes the shared makeRevealObserver factory from Plan 02 (D-17 / D-18).
// See design-system/MOTION.md for the v1.2 motion canonical doc.

import { makeRevealObserver } from "./lib/observer";

export {};

// Selector list per D-04 — `.display` deliberately excluded (D-08 homepage hero untouched).
// .h1-section: SectionHeader.astro outputs <h2 class="h1-section">.
// .work-row: home page work list rows (verified at src/components/primitives/WorkRow.astro).
// .prose-editorial p: project detail prose blocks (src/pages/projects/[id].astro:69).
// .about-body p: About page paragraphs (src/pages/about.astro:12).
const REVEAL_SELECTOR =
  ".h1-section, .work-row, .prose-editorial p, .about-body p";

/**
 * Reads matchMedia for the reduce preference. Exported for unit testing.
 * Returns false in non-browser environments (SSR safety).
 */
export function shouldReduceMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Wraps each whitespace-separated word in textContent with a
 * <span class="word" style="--i: N">word</span> element. Idempotent — guarded
 * by `data-stagger-split="true"` attribute (D-13). Uses textContent only (XSS safe).
 * Exported for unit testing.
 */
export function wrapWordsInPlace(el: HTMLElement): void {
  if (el.dataset.staggerSplit === "true") return;
  const text = (el.textContent ?? "").trim();
  if (!text) return;
  const words = text.split(/\s+/);
  el.textContent = ""; // clear children
  words.forEach((word, i) => {
    const span = document.createElement("span");
    span.className = "word";
    span.style.setProperty("--i", String(i));
    span.textContent = word; // textContent only — never raw HTML assignment, XSS safe
    el.appendChild(span);
    if (i < words.length - 1) {
      el.appendChild(document.createTextNode(" "));
    }
  });
  el.dataset.staggerSplit = "true";
}

/**
 * One observer entry handler. Adds .reveal-on class; if target is .h1-section
 * (and NOT .display per D-08), splits words via wrapWordsInPlace; calls
 * observer.unobserve(target) for one-shot per element (D-07).
 * Exported for unit testing.
 */
export function handleRevealEntry(
  entry: IntersectionObserverEntry,
  observer: IntersectionObserver
): void {
  if (!entry.isIntersecting) return;
  const target = entry.target as HTMLElement;
  target.classList.add("reveal-on");
  // D-08 / D-12: .display is NEVER word-stagger-wrapped. The selector list at
  // REVEAL_SELECTOR already excludes .display, but defensive check matches the
  // semantic intent (a future selector edit shouldn't accidentally wrap .display).
  if (target.matches(".h1-section") && !target.matches(".display")) {
    wrapWordsInPlace(target);
  }
  observer.unobserve(entry.target);
}

let motionInitialized = false;

export function initMotion(): void {
  if (motionInitialized) return;
  // D-25 / MOTN-08: reduce bails early — no observer, no DOM mutation, no
  // .reveal-init class application, no word pre-wrap. This early-return MUST
  // remain the first DOM-touching gate. The CSS rules for .reveal-init /
  // .reveal-on / .word all live inside @media (prefers-reduced-motion:
  // no-preference), so even if .reveal-init were applied under reduce it
  // would be inert — but skipping the DOM mutation under reduce is the
  // contractual behavior asserted by tests/client/motion.test.ts.
  if (shouldReduceMotion()) return;

  // CR-01 fix: apply .reveal-init to all reveal targets at init time so they
  // render at the keyframe `from` state (opacity 0, translateY(12px)) from
  // the first paint. Without this, targets render at opacity 1 then snap to
  // the keyframe `from` state when .reveal-on is added — visible flicker.
  // CR-02 fix: pre-wrap .h1-section words at init time (excluding .display)
  // so the heading already renders as <span class="word"> children at
  // opacity 0 from the first paint. Without this, the heading paints as
  // plain text at opacity 1, then the IntersectionObserver clears its
  // textContent and rebuilds with opacity-0 spans — visible "blank gap"
  // flash. Pre-wrapping makes the resting state match the rendered DOM.
  const revealTargets = document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR);
  revealTargets.forEach((el) => {
    el.classList.add("reveal-init");
    if (el.matches(".h1-section") && !el.matches(".display")) {
      wrapWordsInPlace(el);
    }
  });

  const observer = makeRevealObserver({
    selector: REVEAL_SELECTOR,
    // D-05: -10% bottom rootMargin — reveals as user "arrives" at section,
    // not the first pixel of overlap. Editorial standard cadence.
    rootMargin: "0px 0px -10% 0px",
    threshold: 0,
    onIntersect: handleRevealEntry,
    // D-07: one-shot per element. handleRevealEntry calls observer.unobserve
    // itself, so oneShot here is false (default) to avoid double-unobserve
    // (idempotent in spec but cleaner with single call site). Mirrors
    // scroll-depth.ts D-19 byte-equivalence pattern.
    oneShot: false,
  });
  if (!observer) return;
  motionInitialized = true;
  if (import.meta.env.DEV) {
    console.log("[motion] observer attached for selectors:", REVEAL_SELECTOR);
  }
}

// Module-evaluation guard — protects against re-import during HMR / test
// reset cycles (vi.resetModules() within a single jsdom session). Production
// cross-document navigation reloads the module fresh, so the module-level
// state (motionBootstrapped, motionInitialized) resets naturally on every
// navigation; this guard is not a runtime hot path.
// Why both listeners: <ClientRouter /> is prohibited (MASTER.md §8 / MOTION.md §9),
// so astro:page-load does not fire on its own — DOMContentLoaded is the actual
// init hook today. Both wired for forward-compat.
let motionBootstrapped = false;
if (typeof document !== "undefined" && !motionBootstrapped) {
  motionBootstrapped = true;
  document.addEventListener("astro:page-load", initMotion);
  if (document.readyState !== "loading") {
    initMotion();
  } else {
    document.addEventListener("DOMContentLoaded", initMotion);
  }
}
