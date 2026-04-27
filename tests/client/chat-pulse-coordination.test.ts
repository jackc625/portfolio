// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Phase 16 Motion Layer — D-15 ordering tests + .is-open class assertions
 * for src/scripts/chat.ts.
 *
 * Wave 0 RED stubs. Plan 05 lands the chat.ts diff that introduces
 * data-pulse-paused attribute toggling and the .is-open class on
 * #chat-panel; the display-toggle tests are the Phase 7 regression guard
 * and are GREEN at baseline by design.
 */

// Defensive IntersectionObserver stub — chat.ts may transitively touch it via imports
beforeEach(() => {
  document.body.innerHTML = "";
  (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
    class {
      constructor(public cb: IntersectionObserverCallback) {}
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      takeRecords = vi.fn(() => []);
    };
  // matchMedia mock — chat.ts may probe it
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  });
  // Stub fetch — chat.ts may attach listeners but won't call fetch in these tests
  (globalThis as unknown as { fetch: unknown }).fetch = vi.fn();
});

function buildChatDOM(): {
  bubble: HTMLElement;
  panel: HTMLElement;
  close: HTMLElement;
  input: HTMLTextAreaElement;
  send: HTMLElement;
} {
  document.body.innerHTML = `
    <button id="chat-bubble" aria-label="Open chat" aria-expanded="false">
      <span id="chat-bubble-icon"></span>
      <span id="chat-bubble-close-icon" style="display:none"></span>
    </button>
    <div id="chat-panel" style="display: none;" role="dialog" aria-modal="true">
      <button id="chat-close" aria-label="Close chat">×</button>
      <div id="chat-messages" aria-live="polite" role="log">
        <div id="chat-starters"></div>
        <div id="chat-typing" style="display:none"></div>
      </div>
      <textarea id="chat-input" maxlength="500"></textarea>
      <button id="chat-send"></button>
      <div id="chat-char-count" style="display:none"></div>
    </div>
  `;
  return {
    bubble: document.getElementById("chat-bubble")!,
    panel: document.getElementById("chat-panel")!,
    close: document.getElementById("chat-close")!,
    input: document.getElementById("chat-input") as HTMLTextAreaElement,
    send: document.getElementById("chat-send")!,
  };
}

async function bootChat(): Promise<void> {
  vi.resetModules();
  await import("../../src/scripts/chat");
  // Trigger init via astro:page-load (mirrors production lifecycle)
  document.dispatchEvent(new Event("astro:page-load"));
  // Allow microtasks to flush
  await Promise.resolve();
}

describe("chat.ts — D-15 pulse pause-on-open ordering (MOTN-04)", () => {
  it("openPanel sets data-pulse-paused on #chat-bubble BEFORE setupFocusTrap registers a keydown listener", async () => {
    const { bubble, panel } = buildChatDOM();
    const order: string[] = [];

    const realSetAttribute = bubble.setAttribute.bind(bubble);
    vi.spyOn(bubble, "setAttribute").mockImplementation(((name: string, value: string) => {
      if (name === "data-pulse-paused") {
        order.push("setAttribute:data-pulse-paused");
      }
      realSetAttribute(name, value);
    }) as unknown as typeof bubble.setAttribute);
    const realAddEventListener = panel.addEventListener.bind(panel);
    vi.spyOn(panel, "addEventListener").mockImplementation(
      (evt: string, handler: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
        if (evt === "keydown") order.push("addEventListener:keydown");
        realAddEventListener(evt, handler, options);
      },
    );

    await bootChat();
    bubble.click();
    await Promise.resolve();

    const pulseIdx = order.indexOf("setAttribute:data-pulse-paused");
    const keydownIdx = order.indexOf("addEventListener:keydown");
    expect(pulseIdx).toBeGreaterThanOrEqual(0);
    expect(keydownIdx).toBeGreaterThanOrEqual(0);
    expect(pulseIdx).toBeLessThan(keydownIdx);
  });

  it("openPanel sets `data-pulse-paused` attribute on #chat-bubble", async () => {
    const { bubble } = buildChatDOM();
    await bootChat();
    bubble.click();
    await Promise.resolve();
    expect(bubble.hasAttribute("data-pulse-paused")).toBe(true);
  });
});

describe("chat.ts — D-15 pulse resume-on-close ordering (MOTN-04)", () => {
  it("closePanel removes data-pulse-paused AFTER #chat-bubble.focus() is called", async () => {
    const { bubble } = buildChatDOM();
    const order: string[] = [];

    vi.spyOn(bubble, "focus").mockImplementation(() => {
      order.push("focus:bubble");
    });
    const realRemoveAttribute = bubble.removeAttribute.bind(bubble);
    vi.spyOn(bubble, "removeAttribute").mockImplementation(((name: string) => {
      if (name === "data-pulse-paused") {
        order.push("removeAttribute:data-pulse-paused");
      }
      realRemoveAttribute(name);
    }) as unknown as typeof bubble.removeAttribute);

    await bootChat();
    bubble.click(); // open
    await Promise.resolve();
    bubble.click(); // close
    // Allow animatePanelClose().then() chain to resolve
    await Promise.resolve();
    await Promise.resolve();

    const focusIdx = order.indexOf("focus:bubble");
    const removeIdx = order.indexOf("removeAttribute:data-pulse-paused");
    expect(focusIdx).toBeGreaterThanOrEqual(0);
    expect(removeIdx).toBeGreaterThanOrEqual(0);
    expect(focusIdx).toBeLessThan(removeIdx);
  });

  it("closePanel results in #chat-bubble NOT having data-pulse-paused attribute", async () => {
    const { bubble } = buildChatDOM();
    await bootChat();
    bubble.click(); // open
    await Promise.resolve();
    bubble.click(); // close
    await Promise.resolve();
    await Promise.resolve();
    expect(bubble.hasAttribute("data-pulse-paused")).toBe(false);
  });
});

describe("chat.ts — MOTN-05 .is-open class on #chat-panel", () => {
  it("openPanel adds .is-open class to #chat-panel", async () => {
    const { bubble, panel } = buildChatDOM();
    await bootChat();
    bubble.click();
    await Promise.resolve();
    expect(panel.classList.contains("is-open")).toBe(true);
  });

  it("closePanel removes .is-open class from #chat-panel", async () => {
    const { bubble, panel } = buildChatDOM();
    await bootChat();
    bubble.click(); // open
    await Promise.resolve();
    bubble.click(); // close
    await Promise.resolve();
    await Promise.resolve();
    expect(panel.classList.contains("is-open")).toBe(false);
  });
});

describe("chat.ts — D-26 regression-adjacent (#chat-panel display toggle preserved)", () => {
  it("openPanel still toggles #chat-panel.style.display = 'flex' (Phase 7 invariant)", async () => {
    const { bubble, panel } = buildChatDOM();
    await bootChat();
    bubble.click();
    await Promise.resolve();
    expect(panel.style.display).toBe("flex");
  });

  it("closePanel still toggles #chat-panel.style.display = 'none' (Phase 7 invariant)", async () => {
    const { bubble, panel } = buildChatDOM();
    await bootChat();
    bubble.click(); // open
    await Promise.resolve();
    bubble.click(); // close
    await Promise.resolve();
    await Promise.resolve();
    expect(panel.style.display).toBe("none");
  });
});
