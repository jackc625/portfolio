// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeRevealObserver } from "../../src/scripts/lib/observer";

/**
 * Phase 16 Motion Layer — contract tests for src/scripts/lib/observer.ts.
 *
 * Wave 0 RED stubs. Plan 02 lands the factory module; ALL tests here are
 * RED until then because the import resolves to a missing module.
 *
 * The factory is the foundation for both motion.ts (one-shot reveal) and
 * scroll-depth.ts (caller-managed unobserve preserved byte-equivalent under
 * D-19). Tests pin both code paths.
 */

let latestObserverCallback: IntersectionObserverCallback | null = null;
let latestObserverInit: IntersectionObserverInit | null = null;
let observeMock: ReturnType<typeof vi.fn>;
let unobserveMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  document.body.innerHTML = "";
  observeMock = vi.fn();
  unobserveMock = vi.fn();
  latestObserverCallback = null;
  latestObserverInit = null;
  (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
    class {
      constructor(cb: IntersectionObserverCallback, init?: IntersectionObserverInit) {
        latestObserverCallback = cb;
        latestObserverInit = init ?? null;
      }
      observe = observeMock;
      unobserve = unobserveMock;
      disconnect = vi.fn();
      takeRecords = vi.fn(() => []);
    };
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

describe("makeRevealObserver — empty selector gate (D-17)", () => {
  it("returns null when empty", () => {
    const result = makeRevealObserver({
      selector: ".does-not-exist",
      rootMargin: "0px 0px -10% 0px",
      threshold: 0,
      onIntersect: vi.fn(),
    });
    expect(result).toBeNull();
  });
});

describe("makeRevealObserver — observer construction (MOTN-02 / D-05)", () => {
  it("rootMargin/threshold pass-through", () => {
    document.body.innerHTML = `<div class="reveal-target"></div>`;
    makeRevealObserver({
      selector: ".reveal-target",
      rootMargin: "0px 0px -10% 0px",
      threshold: 0,
      onIntersect: vi.fn(),
    });
    expect(latestObserverInit).toEqual(
      expect.objectContaining({ rootMargin: "0px 0px -10% 0px", threshold: 0 }),
    );
  });

  it("observes each matched element", () => {
    document.body.innerHTML = `
      <div class="reveal-target" id="a"></div>
      <div class="reveal-target" id="b"></div>
      <div class="reveal-target" id="c"></div>
    `;
    makeRevealObserver({
      selector: ".reveal-target",
      rootMargin: "0px",
      threshold: 0,
      onIntersect: vi.fn(),
    });
    expect(observeMock).toHaveBeenCalledTimes(3);
  });
});

describe("makeRevealObserver — onIntersect callback contract", () => {
  it("invokes onIntersect for each intersecting target", () => {
    document.body.innerHTML = `<div class="reveal-target" id="a"></div>`;
    const onIntersect = vi.fn();
    const observer = makeRevealObserver({
      selector: ".reveal-target",
      rootMargin: "0px",
      threshold: 0,
      onIntersect,
    });
    expect(observer).not.toBeNull();
    const target = document.querySelector<HTMLElement>(".reveal-target")!;
    latestObserverCallback?.([makeEntry(target, true)], observer!);
    expect(onIntersect).toHaveBeenCalledTimes(1);
    expect(onIntersect).toHaveBeenCalledWith(expect.objectContaining({ target }), observer);
  });

  it("does NOT auto-unobserve when oneShot is false (D-19 byte-equivalence path)", () => {
    document.body.innerHTML = `<div class="reveal-target" id="a"></div>`;
    const onIntersect = vi.fn();
    const observer = makeRevealObserver({
      selector: ".reveal-target",
      rootMargin: "0px",
      threshold: 0,
      onIntersect,
      oneShot: false,
    });
    expect(observer).not.toBeNull();
    const target = document.querySelector<HTMLElement>(".reveal-target")!;
    latestObserverCallback?.([makeEntry(target, true)], observer!);
    expect(unobserveMock).not.toHaveBeenCalled();
  });

  it("default behavior (oneShot omitted) does NOT auto-unobserve — caller-managed (D-19 default preserves scroll-depth behavior)", () => {
    document.body.innerHTML = `<div class="reveal-target" id="a"></div>`;
    const onIntersect = vi.fn();
    const observer = makeRevealObserver({
      selector: ".reveal-target",
      rootMargin: "0px",
      threshold: 0,
      onIntersect,
    });
    const target = document.querySelector<HTMLElement>(".reveal-target")!;
    latestObserverCallback?.([makeEntry(target, true)], observer!);
    // Default = caller-managed; scroll-depth.ts handleScrollEntry calls observer.unobserve internally.
    // Factory does not preempt that call.
    expect(unobserveMock).not.toHaveBeenCalled();
  });

  it("oneShot=true auto-unobserves the target after intersect (motion.ts MOTN-02 path)", () => {
    document.body.innerHTML = `<div class="reveal-target" id="a"></div>`;
    const onIntersect = vi.fn();
    const observer = makeRevealObserver({
      selector: ".reveal-target",
      rootMargin: "0px",
      threshold: 0,
      onIntersect,
      oneShot: true,
    });
    const target = document.querySelector<HTMLElement>(".reveal-target")!;
    latestObserverCallback?.([makeEntry(target, true)], observer!);
    expect(unobserveMock).toHaveBeenCalledWith(target);
  });

  it("does NOT invoke onIntersect when entry is non-intersecting", () => {
    document.body.innerHTML = `<div class="reveal-target" id="a"></div>`;
    const onIntersect = vi.fn();
    const observer = makeRevealObserver({
      selector: ".reveal-target",
      rootMargin: "0px",
      threshold: 0,
      onIntersect,
    });
    const target = document.querySelector<HTMLElement>(".reveal-target")!;
    latestObserverCallback?.([makeEntry(target, false)], observer!);
    expect(onIntersect).not.toHaveBeenCalled();
    expect(unobserveMock).not.toHaveBeenCalled();
  });
});
