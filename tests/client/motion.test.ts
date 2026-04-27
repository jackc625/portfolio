// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Phase 16 Motion Layer — behavior tests for src/scripts/motion.ts.
 *
 * Wave 0 RED stubs. Plan 04 lands the motion.ts module; ALL tests here are
 * RED until then because the dynamic imports resolve to a missing module.
 *
 * The FIRST describe block is the prefers-reduced-motion negative case
 * (per ROADMAP "Reduced-Motion Contract" gate — every motion feature's
 * first test must be the reduced-motion bail-out path).
 */

// matchMedia mock — drives reduce vs no-preference branches
type MMResult = {
  matches: boolean;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
};
let matchMediaResult: MMResult = {
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

let observeMock: ReturnType<typeof vi.fn>;
let unobserveMock: ReturnType<typeof vi.fn>;
let latestObserverCallback: IntersectionObserverCallback | null = null;

beforeEach(() => {
  document.body.innerHTML = "";
  observeMock = vi.fn();
  unobserveMock = vi.fn();
  latestObserverCallback = null;
  matchMediaResult = {
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (_query: string) => matchMediaResult,
  });
  (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
    class {
      constructor(cb: IntersectionObserverCallback) {
        latestObserverCallback = cb;
      }
      observe = observeMock;
      unobserve = unobserveMock;
      disconnect = vi.fn();
      takeRecords = vi.fn(() => []);
    };
  // Reset module state for each test by re-importing
  vi.resetModules();
});

function makeEntry(target: HTMLElement, isIntersecting = true): IntersectionObserverEntry {
  return {
    target,
    isIntersecting,
    intersectionRatio: isIntersecting ? 1 : 0,
    boundingClientRect: target.getBoundingClientRect(),
    intersectionRect: target.getBoundingClientRect(),
    rootBounds: null,
    time: Date.now(),
  } as IntersectionObserverEntry;
}

// `latestObserverCallback` is captured for any future test that needs to drive
// the constructed observer directly. Marked load-bearing to silence TS6133.
void latestObserverCallback;

// Module is authored by Plan 16-04 (Wave 2). RED stub: dynamic import resolves
// to a missing module today; await throws and vitest reports a suite-level
// failure — the intentional Wave 0 RED signal. The `@ts-expect-error` flips to
// a TS error when 16-04 lands the module so the executor of 16-04 must remove
// this helper (or the directive) in the same diff as src/scripts/motion.ts —
// drift signal locked.
type MotionModule = {
  initMotion: () => void;
  handleRevealEntry: (entry: IntersectionObserverEntry, observer: IntersectionObserver) => void;
  wrapWordsInPlace: (el: HTMLElement) => void;
};
async function importMotion(): Promise<MotionModule> {
  // Plan 16-04 landed src/scripts/motion.ts — the @ts-expect-error directive
  // that flagged the missing module pre-Plan-04 has been removed (drift signal
  // documented in Plan 16-01 SUMMARY).
  return (await import("../../src/scripts/motion")) as MotionModule;
}

// FIRST DESCRIBE BLOCK = reduced-motion negative case (per ROADMAP gate)
describe("motion.ts — prefers-reduced-motion: reduce (MOTN-08 / D-23, D-25)", () => {
  it("reduce bails — no observer constructed, no DOM mutation", async () => {
    matchMediaResult.matches = true; // reduce
    document.body.innerHTML = `<h2 class="h1-section">Lorem ipsum dolor</h2>`;
    const { initMotion } = await importMotion();
    initMotion();
    expect(observeMock).not.toHaveBeenCalled();
    const heading = document.querySelector<HTMLElement>(".h1-section")!;
    expect(heading.hasAttribute("data-stagger-split")).toBe(false);
    expect(heading.children.length).toBe(0);
    expect(heading.textContent).toBe("Lorem ipsum dolor");
  });

  it("reduce reads matchMedia('(prefers-reduced-motion: reduce)') (call shape lock)", async () => {
    const calls: string[] = [];
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: (q: string) => {
        calls.push(q);
        return matchMediaResult;
      },
    });
    matchMediaResult.matches = true;
    document.body.innerHTML = `<h2 class="h1-section">Hello world</h2>`;
    const { initMotion } = await importMotion();
    initMotion();
    expect(calls).toContain("(prefers-reduced-motion: reduce)");
  });
});

describe("motion.ts — handleRevealEntry / .reveal-on (MOTN-02)", () => {
  it("intersect adds .reveal-on class", async () => {
    matchMediaResult.matches = false;
    const { handleRevealEntry } = await importMotion();
    document.body.innerHTML = `<section class="h1-section reveal-init">A B C</section>`;
    const target = document.querySelector<HTMLElement>(".h1-section")!;
    const observer = { unobserve: unobserveMock } as unknown as IntersectionObserver;
    handleRevealEntry(makeEntry(target, true), observer);
    expect(target.classList.contains("reveal-on")).toBe(true);
  });

  it("non-intersecting entry is a no-op (no class, no unobserve)", async () => {
    matchMediaResult.matches = false;
    const { handleRevealEntry } = await importMotion();
    document.body.innerHTML = `<section class="h1-section reveal-init">A B C</section>`;
    const target = document.querySelector<HTMLElement>(".h1-section")!;
    const observer = { unobserve: unobserveMock } as unknown as IntersectionObserver;
    handleRevealEntry(makeEntry(target, false), observer);
    expect(target.classList.contains("reveal-on")).toBe(false);
    expect(unobserveMock).not.toHaveBeenCalled();
  });

  it("one-shot — calls observer.unobserve(target) after intersect (D-07)", async () => {
    matchMediaResult.matches = false;
    const { handleRevealEntry } = await importMotion();
    document.body.innerHTML = `<div class="work-row reveal-init"></div>`;
    const target = document.querySelector<HTMLElement>(".work-row")!;
    const observer = { unobserve: unobserveMock } as unknown as IntersectionObserver;
    handleRevealEntry(makeEntry(target, true), observer);
    expect(unobserveMock).toHaveBeenCalledWith(target);
  });
});

describe("motion.ts — splitWords (MOTN-07 / D-09, D-10, D-13)", () => {
  it("wraps each word in `<span class=\"word\" style=\"--i: N\">`", async () => {
    const { wrapWordsInPlace } = await importMotion();
    const el = document.createElement("h2");
    el.className = "h1-section";
    el.textContent = "Lorem ipsum dolor";
    document.body.appendChild(el);
    wrapWordsInPlace(el);
    const wordSpans = el.querySelectorAll<HTMLElement>("span.word");
    expect(wordSpans.length).toBe(3);
    expect(wordSpans[0].textContent).toBe("Lorem");
    expect(wordSpans[1].textContent).toBe("ipsum");
    expect(wordSpans[2].textContent).toBe("dolor");
    expect(wordSpans[0].style.getPropertyValue("--i")).toBe("0");
    expect(wordSpans[1].style.getPropertyValue("--i")).toBe("1");
    expect(wordSpans[2].style.getPropertyValue("--i")).toBe("2");
  });

  it("idempotent — second call does not re-wrap (D-13 data-stagger-split guard)", async () => {
    const { wrapWordsInPlace } = await importMotion();
    const el = document.createElement("h2");
    el.className = "h1-section";
    el.textContent = "Hello world";
    document.body.appendChild(el);
    wrapWordsInPlace(el);
    const firstHTML = el.innerHTML;
    expect(el.dataset.staggerSplit).toBe("true");
    wrapWordsInPlace(el);
    expect(el.innerHTML).toBe(firstHTML);
  });

  it("wraps text with no leakage of `<` characters (XSS textContent safety)", async () => {
    const { wrapWordsInPlace } = await importMotion();
    const el = document.createElement("h2");
    el.className = "h1-section";
    el.textContent = "<script>alert(1)</script>";
    document.body.appendChild(el);
    wrapWordsInPlace(el);
    // textContent is browser-decoded; the `<` will be present as text but inside
    // span.textContent — never as parsed markup. Assert no <script> child element.
    expect(el.querySelector("script")).toBeNull();
  });

  it("triggered through handleRevealEntry on .h1-section target", async () => {
    matchMediaResult.matches = false;
    const { handleRevealEntry } = await importMotion();
    document.body.innerHTML = `<h2 class="h1-section reveal-init">Foo bar baz</h2>`;
    const target = document.querySelector<HTMLElement>(".h1-section")!;
    const observer = { unobserve: unobserveMock } as unknown as IntersectionObserver;
    handleRevealEntry(makeEntry(target, true), observer);
    expect(target.querySelectorAll("span.word").length).toBe(3);
    expect(target.dataset.staggerSplit).toBe("true");
  });

  it("never wraps `.display` headings (D-08 / D-12 — homepage hero excluded)", async () => {
    matchMediaResult.matches = false;
    const { handleRevealEntry } = await importMotion();
    document.body.innerHTML = `<h1 class="display">Jack Cutrara</h1>`;
    const target = document.querySelector<HTMLElement>(".display")!;
    const observer = { unobserve: unobserveMock } as unknown as IntersectionObserver;
    handleRevealEntry(makeEntry(target, true), observer);
    expect(target.querySelectorAll("span.word").length).toBe(0);
    expect(target.dataset.staggerSplit).toBeUndefined();
    expect(target.textContent).toBe("Jack Cutrara");
  });
});

describe("motion.ts — initMotion bootstrap (MOTN-02 / D-04)", () => {
  it("no-preference instantiates observer for REVEAL_SELECTOR targets", async () => {
    matchMediaResult.matches = false;
    document.body.innerHTML = `
      <h2 class="h1-section">A B</h2>
      <div class="work-row"></div>
    `;
    const { initMotion } = await importMotion();
    initMotion();
    expect(observeMock).toHaveBeenCalled();
  });

  it("init guard prevents double-observation across page-load events", async () => {
    matchMediaResult.matches = false;
    document.body.innerHTML = `<h2 class="h1-section">A B</h2>`;
    const { initMotion } = await importMotion();
    initMotion();
    const callsAfterFirst = observeMock.mock.calls.length;
    initMotion();
    expect(observeMock.mock.calls.length).toBe(callsAfterFirst);
  });
});
