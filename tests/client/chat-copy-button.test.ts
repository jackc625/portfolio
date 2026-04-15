// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCopyButton } from "../../src/scripts/chat";

describe("createCopyButton (DEBT-04)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("emits canonical COPY label markup", () => {
    const btn = createCopyButton(() => "hello");
    expect(btn.tagName).toBe("BUTTON");
    expect(btn.className).toContain("chat-copy-btn");
    expect(btn.className).toContain("label-mono");
    expect(btn.type).toBe("button");
    expect(btn.textContent).toBe("COPY");
    expect(btn.getAttribute("aria-label")).toBe("Copy message");
    expect(btn.style.cssText).toContain("position: absolute");
    expect(btn.style.cssText).toContain("top: -4px");
    expect(btn.style.cssText).toContain("right: 0");
  });

  it("markup identical between invocations (live + replay parity)", () => {
    const live = createCopyButton(() => "msg");
    const replay = createCopyButton(() => "msg");
    expect(live.outerHTML).toBe(replay.outerHTML);
  });

  it("flips to COPIED + accent on click, reverts after 1s", async () => {
    vi.useFakeTimers();
    const btn = createCopyButton(() => "payload");
    document.body.appendChild(btn);
    btn.click();
    await Promise.resolve(); // drain clipboard microtask
    expect(btn.textContent).toBe("COPIED");
    expect(btn.style.color).toBe("var(--accent)");
    vi.advanceTimersByTime(1000);
    expect(btn.textContent).toBe("COPY");
    expect(btn.style.color).toBe("var(--ink-faint)");
    vi.useRealTimers();
  });

  it("invokes getContent at click-time, not creation-time (live-stream parity)", () => {
    let current = "v1";
    const btn = createCopyButton(() => current);
    document.body.appendChild(btn);
    current = "v2";
    btn.click();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("v2");
  });

  it("cloneNode dance strips listeners (idempotency guard compat)", () => {
    const btn = createCopyButton(() => "x");
    document.body.appendChild(btn);
    btn.replaceWith(btn.cloneNode(true));
    const clone = document.querySelector(".chat-copy-btn") as HTMLElement;
    expect(clone).not.toBeNull();
    clone.click();
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
  });
});
