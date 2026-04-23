// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleScrollEntry } from "../../src/scripts/scroll-depth";

// Stub IntersectionObserver globally — jsdom 29 does not implement it natively.
// Store the latest callback so tests can invoke it with synthetic entries.
let latestObserverCallback: IntersectionObserverCallback | null = null;
let observeMock: ReturnType<typeof vi.fn>;
let unobserveMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  document.body.innerHTML = "";
  (window as unknown as { umami: { track: ReturnType<typeof vi.fn> } }).umami = {
    track: vi.fn(),
  };
  observeMock = vi.fn();
  unobserveMock = vi.fn();
  latestObserverCallback = null;
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
});

afterEach(() => {
  latestObserverCallback = null;
  void latestObserverCallback; // captured for future tests that drive the constructed observer
});

function makeSentinel(percent: "25" | "50" | "75" | "100"): HTMLElement {
  const div = document.createElement("div");
  div.className = "scroll-sentinel";
  div.setAttribute("data-percent", percent);
  div.setAttribute("aria-hidden", "true");
  document.body.appendChild(div);
  return div;
}

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

describe("scroll-depth observer (D-05, D-06, D-07, D-08)", () => {
  it("fires scroll_depth with percent=25 and slug when sentinel at 25% enters viewport", () => {
    const s = makeSentinel("25");
    const mockObserver = { unobserve: unobserveMock } as unknown as IntersectionObserver;
    handleScrollEntry(makeEntry(s), mockObserver);
    const umamiTrack = (window as unknown as { umami: { track: ReturnType<typeof vi.fn> } })
      .umami.track;
    expect(umamiTrack).toHaveBeenCalledWith(
      "scroll_depth",
      expect.objectContaining({ percent: 25 })
    );
  });

  it("fires scroll_depth with percent=50", () => {
    const s = makeSentinel("50");
    const mockObserver = { unobserve: unobserveMock } as unknown as IntersectionObserver;
    handleScrollEntry(makeEntry(s), mockObserver);
    const umamiTrack = (window as unknown as { umami: { track: ReturnType<typeof vi.fn> } })
      .umami.track;
    expect(umamiTrack).toHaveBeenCalledWith(
      "scroll_depth",
      expect.objectContaining({ percent: 50 })
    );
  });

  it("fires scroll_depth with percent=75", () => {
    const s = makeSentinel("75");
    const mockObserver = { unobserve: unobserveMock } as unknown as IntersectionObserver;
    handleScrollEntry(makeEntry(s), mockObserver);
    const umamiTrack = (window as unknown as { umami: { track: ReturnType<typeof vi.fn> } })
      .umami.track;
    expect(umamiTrack).toHaveBeenCalledWith(
      "scroll_depth",
      expect.objectContaining({ percent: 75 })
    );
  });

  it("fires scroll_depth with percent=100", () => {
    const s = makeSentinel("100");
    const mockObserver = { unobserve: unobserveMock } as unknown as IntersectionObserver;
    handleScrollEntry(makeEntry(s), mockObserver);
    const umamiTrack = (window as unknown as { umami: { track: ReturnType<typeof vi.fn> } })
      .umami.track;
    expect(umamiTrack).toHaveBeenCalledWith(
      "scroll_depth",
      expect.objectContaining({ percent: 100 })
    );
  });

  it("calls observer.unobserve on the fired entry target (D-08 one-shot)", () => {
    const s = makeSentinel("50");
    const mockObserver = { unobserve: unobserveMock } as unknown as IntersectionObserver;
    handleScrollEntry(makeEntry(s), mockObserver);
    expect(unobserveMock).toHaveBeenCalledWith(s);
  });

  it("does NOT fire umami.track when entry.isIntersecting is false", () => {
    const s = makeSentinel("50");
    const mockObserver = { unobserve: unobserveMock } as unknown as IntersectionObserver;
    handleScrollEntry(makeEntry(s, false), mockObserver);
    const umamiTrack = (window as unknown as { umami: { track: ReturnType<typeof vi.fn> } })
      .umami.track;
    expect(umamiTrack).not.toHaveBeenCalled();
  });

  it("uses location.pathname's last segment as slug (e.g., /projects/seatwatch -> 'seatwatch')", () => {
    window.history.pushState({}, "", "/projects/seatwatch");
    const s = makeSentinel("75");
    const mockObserver = { unobserve: unobserveMock } as unknown as IntersectionObserver;
    handleScrollEntry(makeEntry(s), mockObserver);
    const umamiTrack = (window as unknown as { umami: { track: ReturnType<typeof vi.fn> } })
      .umami.track;
    expect(umamiTrack).toHaveBeenCalledWith("scroll_depth", { percent: 75, slug: "seatwatch" });
  });
});

describe("observer construction gate", () => {
  it("handleScrollEntry is safe to call with window.umami undefined (L10)", () => {
    delete (window as unknown as { umami?: unknown }).umami;
    const s = makeSentinel("25");
    const mockObserver = { unobserve: unobserveMock } as unknown as IntersectionObserver;
    expect(() => handleScrollEntry(makeEntry(s), mockObserver)).not.toThrow();
  });
});
