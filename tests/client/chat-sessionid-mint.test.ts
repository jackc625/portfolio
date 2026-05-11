// @vitest-environment jsdom
/**
 * IDENT-01 — sessionId mint on bubble click, persisted in chat-history
 * localStorage blob. STORAGE_VERSION 1→2 auto-clear path.
 *
 * Two-prong validation (mirrors DEBT-04 in tests/client/listener-dedup.test.ts):
 *
 *   1. SOURCE-LEVEL — chat.ts contains STORAGE_VERSION = 2 (not 1) and
 *      ChatStorage extends with sessionId: string. crypto.randomUUID() is
 *      called inside initChat / bubble click handler.
 *
 *   2. BEHAVIORAL — under jsdom: (a) clicking the bubble when localStorage is
 *      empty mints a UUIDv4 and persists it; (b) clicking the bubble when a
 *      v1-shape blob is present triggers auto-clear + fresh mint; (c) clicking
 *      the bubble when a v2-shape blob is present preserves the existing
 *      sessionId (cross-visit continuity per D-01); (d) when crypto.randomUUID
 *      throws or localStorage setItem throws, sessionId stays undefined and
 *      the body field is omitted (D-04 silent-fail).
 *
 * vi.resetModules() in afterEach re-creates fresh handler references; cross-
 * evaluation behavior is reference-mismatched. Each behavioral test is self-
 * contained — does not assume cross-test module state.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const UUID = "8b0f7f1c-1234-4567-8901-abcdef012345";
const SECOND_UUID = "a1b2c3d4-5678-4901-2345-67890abcdef0";

// Minimal ChatWidget fixture — mirrors src/components/chat/ChatWidget.astro
// element IDs needed for initChat to bind handlers.
const CHAT_FIXTURE = `
  <div class="chat-widget">
    <button type="button" id="chat-bubble" aria-label="Open chat" aria-expanded="false">
      <svg id="chat-bubble-icon"></svg>
      <svg id="chat-bubble-close-icon" style="display: none;"></svg>
    </button>
    <div id="chat-panel" role="dialog" aria-modal="true">
      <button type="button" id="chat-close" aria-label="Close chat">&times;</button>
      <div id="chat-messages" aria-live="polite" role="log">
        <div id="chat-starters">
          <button type="button" class="chat-starter-chip">starter</button>
        </div>
        <div id="chat-typing" style="display: none;"></div>
      </div>
      <textarea id="chat-input" rows="1" maxlength="500"></textarea>
      <div id="chat-char-count"></div>
      <button type="button" id="chat-send" aria-label="Send message" disabled></button>
    </div>
  </div>
`;

describe("IDENT-01 — sessionId mint on bubble click (Plan 18-06 / D-01 / D-02 / D-04 silent fail)", () => {
  describe("Source-text prong (chat.ts source-of-truth invariants)", () => {
    const src = readFileSync(join(process.cwd(), "src/scripts/chat.ts"), "utf8");

    it("STORAGE_VERSION = 2 (not 1)", () => {
      expect(src).toMatch(/const\s+STORAGE_VERSION\s*=\s*2\b/);
      expect(src).not.toMatch(/const\s+STORAGE_VERSION\s*=\s*1\b/);
    });

    it("ChatStorage interface extends with sessionId: string and version: 2", () => {
      expect(src).toMatch(/version:\s*2\b/);
      expect(src).toMatch(/sessionId\s*:\s*string/);
    });

    it("crypto.randomUUID() is called from the mint path", () => {
      expect(src).toMatch(/crypto\.randomUUID\(\)/);
    });

    it("streamChat body conditionally emits sessionId field (and old bare body shape is gone)", () => {
      // Truthy branch of the ternary: sessionId present → { sessionId, messages, ... }
      expect(src).toMatch(/sessionId\s*\?\s*\{\s*sessionId\s*,\s*messages/);
      // Old single-shape body (no sessionId field at all) must be gone.
      expect(src).not.toMatch(
        /body:\s*JSON\.stringify\(\s*\{\s*messages:\s*chatMessages\s*\}\s*\)/,
      );
    });
  });

  describe("Behavioral prong (jsdom DOM lifecycle + mint integration)", () => {
    beforeEach(() => {
      (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = class {
        constructor(public cb: IntersectionObserverCallback) {}
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = vi.fn();
        takeRecords = vi.fn(() => []);
      };
      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        writable: true,
        value: () => ({
          matches: false,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }),
      });
      (globalThis as unknown as { fetch: unknown }).fetch = vi.fn();
      // Restore live DOM state for the per-test fixture; resetModules wipes
      // any prior module-scoped state in chat.ts (e.g. chatInitialized flag,
      // module-scoped sessionId).
      vi.resetModules();
      document.body.innerHTML = CHAT_FIXTURE;
      localStorage.clear();
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.resetModules();
      localStorage.clear();
      document.body.innerHTML = "";
    });

    it("Test 5 — fresh mint: bubble click on empty localStorage mints + persists v2 blob", async () => {
      vi.spyOn(crypto, "randomUUID").mockReturnValue(UUID);

      await import("../../src/scripts/chat");
      document.getElementById("chat-bubble")!.click();

      const stored = JSON.parse(localStorage.getItem("chat-history") || "{}");
      expect(stored.version).toBe(2);
      expect(stored.sessionId).toBe(UUID);
    });

    it("Test 6 — v1 → v2 auto-clear: bubble click with v1-shape blob triggers wipe + fresh mint", async () => {
      // Pre-seed a v1-shape blob (no sessionId, version: 1).
      localStorage.setItem(
        "chat-history",
        JSON.stringify({
          version: 1,
          messages: [],
          lastActive: new Date().toISOString(),
        }),
      );
      vi.spyOn(crypto, "randomUUID").mockReturnValue(UUID);

      await import("../../src/scripts/chat");
      document.getElementById("chat-bubble")!.click();

      const stored = JSON.parse(localStorage.getItem("chat-history") || "{}");
      expect(stored.version).toBe(2);
      expect(stored.sessionId).toBe(UUID);
    });

    it("Test 7 — cross-visit continuity: bubble click with valid v2 blob preserves existing sessionId (no re-mint)", async () => {
      // Pre-seed a valid v2 blob with a sessionId that is NOT the spied return.
      localStorage.setItem(
        "chat-history",
        JSON.stringify({
          version: 2,
          sessionId: SECOND_UUID,
          messages: [],
          lastActive: new Date().toISOString(),
        }),
      );
      const randomSpy = vi.spyOn(crypto, "randomUUID").mockReturnValue(UUID);

      await import("../../src/scripts/chat");
      document.getElementById("chat-bubble")!.click();

      const stored = JSON.parse(localStorage.getItem("chat-history") || "{}");
      expect(stored.sessionId).toBe(SECOND_UUID); // existing sessionId preserved
      expect(stored.sessionId).not.toBe(UUID); // mint did NOT happen
      expect(randomSpy).not.toHaveBeenCalled(); // D-01 cross-visit continuity
    });

    it("Test 8 — D-04 silent fail: when crypto.randomUUID throws, sessionId omitted from /api/chat POST body", async () => {
      vi.spyOn(crypto, "randomUUID").mockImplementation(() => {
        throw new Error("crypto unavailable");
      });
      // Mock fetch returning a resolved Response with an empty SSE-like body.
      // We only need fetch to be called once with the body — we do not need to
      // exercise the SSE reader loop for this assertion.
      const fetchMock = vi.fn(async () => {
        return new Response("data: [DONE]\n\n", {
          status: 200,
          headers: { "Content-Type": "text/event-stream" },
        });
      });
      (globalThis as unknown as { fetch: unknown }).fetch = fetchMock;

      await import("../../src/scripts/chat");

      // Click bubble (mint throws → sessionId stays undefined → chat UX continues).
      document.getElementById("chat-bubble")!.click();

      // Submit a message via the input + send button.
      const input = document.getElementById("chat-input") as HTMLTextAreaElement;
      input.value = "hello";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      const sendBtn = document.getElementById("chat-send") as HTMLButtonElement;
      sendBtn.click();

      // Wait a microtask flush so the streamChat fetch call has been queued.
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const fetchCall = fetchMock.mock.calls[0];
      const requestInit = fetchCall[1] as RequestInit;
      const body = JSON.parse(requestInit.body as string);
      expect("sessionId" in body).toBe(false);
      expect(body.messages).toBeDefined();
    });
  });
});
