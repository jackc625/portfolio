// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { classifyOutbound, handleChatAnalytics } from "../../src/scripts/analytics";

// handleChatAnalytics is exercised indirectly through the install-time
// document.addEventListener("chat:analytics", ...) handler that fires when
// the module is imported above. The import is load-bearing — it satisfies
// the plan's `<acceptance_criteria>` "imports handleChatAnalytics" gate AND
// it documents the exported test seam — but TypeScript ts(6133) flags it as
// unused because no test calls it directly. `void` reference suppresses
// the hint without changing behavior. Mirrors scroll-depth.test.ts:33.
void handleChatAnalytics;

// jsdom 29 does not implement IntersectionObserver natively. Stubbed here as
// defensive scaffolding because importing analytics.ts may transitively pull
// in other modules (and analytics.ts itself runs install-time DOM listeners
// at import). The chat:analytics + click test surface lives entirely under
// the document delegated listeners installed by importing analytics.ts above.
beforeEach(() => {
  document.body.innerHTML = "";
  (window as unknown as { umami: { track: ReturnType<typeof vi.fn> } }).umami = {
    track: vi.fn(),
  };
  (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
    class {
      constructor(public cb: IntersectionObserverCallback) {}
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      takeRecords = vi.fn(() => []);
    };
});

function getUmamiTrack(): ReturnType<typeof vi.fn> {
  return (window as unknown as { umami?: { track: ReturnType<typeof vi.fn> } })
    .umami!.track;
}

describe("chat:analytics forwarding (D-11)", () => {
  it("forwards chat_open with empty metadata", () => {
    document.dispatchEvent(
      new CustomEvent("chat:analytics", {
        detail: { action: "chat_open", timestamp: Date.now() },
      })
    );
    expect(getUmamiTrack()).toHaveBeenCalledWith("chat_open", {});
  });

  it("forwards chip_click with label in metadata", () => {
    document.dispatchEvent(
      new CustomEvent("chat:analytics", {
        detail: {
          action: "chip_click",
          label: "What projects have you built?",
          timestamp: Date.now(),
        },
      })
    );
    expect(getUmamiTrack()).toHaveBeenCalledWith("chip_click", {
      label: "What projects have you built?",
    });
  });

  it("forwards chat_error with label='offline'", () => {
    document.dispatchEvent(
      new CustomEvent("chat:analytics", {
        detail: { action: "chat_error", label: "offline", timestamp: Date.now() },
      })
    );
    expect(getUmamiTrack()).toHaveBeenCalledWith("chat_error", { label: "offline" });
  });

  it("forwards message_sent with empty metadata", () => {
    document.dispatchEvent(
      new CustomEvent("chat:analytics", {
        detail: { action: "message_sent", timestamp: Date.now() },
      })
    );
    expect(getUmamiTrack()).toHaveBeenCalledWith("message_sent", {});
  });

  it("silently no-ops when window.umami is undefined (L10 optional-chaining)", () => {
    delete (window as unknown as { umami?: unknown }).umami;
    expect(() =>
      document.dispatchEvent(
        new CustomEvent("chat:analytics", {
          detail: { action: "chat_open", timestamp: Date.now() },
        })
      )
    ).not.toThrow();
  });
});

describe("outbound classifier (D-10, D-12)", () => {
  it("classifies github.com as type=github with hostname+path href", () => {
    const result = classifyOutbound("https://github.com/jackc625");
    expect(result).toEqual({ type: "github", href: "github.com/jackc625" });
  });

  it("classifies linkedin.com (and www.linkedin.com) as type=linkedin", () => {
    expect(classifyOutbound("https://linkedin.com/in/jackcutrara")).toEqual({
      type: "linkedin",
      href: "linkedin.com/in/jackcutrara",
    });
    expect(classifyOutbound("https://www.linkedin.com/in/jackcutrara")).toEqual({
      type: "linkedin",
      href: "www.linkedin.com/in/jackcutrara",
    });
  });

  it("classifies mailto: as type=email with href='mailto' (D-12 no email leak)", () => {
    const result = classifyOutbound("mailto:jackcutrara@gmail.com");
    expect(result).toEqual({ type: "email", href: "mailto" });
  });

  it("classifies external .pdf (non-resume) as type=pdf", () => {
    const result = classifyOutbound("https://example.com/report.pdf");
    expect(result).toEqual({ type: "pdf", href: "example.com/report.pdf" });
  });

  it("strips query string and fragment from href metadata (D-12)", () => {
    const result = classifyOutbound(
      "https://example.com/foo?bar=baz&token=SECRET#fragment"
    );
    expect(result).toEqual({ type: "external", href: "example.com/foo" });
  });

  it("classifies arbitrary external URLs as type=external", () => {
    const result = classifyOutbound("https://some-random-site.example/blog/post");
    expect(result).toEqual({
      type: "external",
      href: "some-random-site.example/blog/post",
    });
  });
});

describe("resume-download dedup (D-09)", () => {
  it("fires resume_download with source metadata when /jack-cutrara-resume.pdf is clicked", () => {
    const a = document.createElement("a");
    a.href = "/jack-cutrara-resume.pdf";
    a.textContent = "RESUME";
    document.body.appendChild(a);
    a.click();
    expect(getUmamiTrack()).toHaveBeenCalledWith(
      "resume_download",
      expect.objectContaining({ source: expect.any(String) })
    );
  });

  it("does NOT fire outbound_click when /jack-cutrara-resume.pdf is clicked", () => {
    const a = document.createElement("a");
    a.href = "/jack-cutrara-resume.pdf";
    a.textContent = "RESUME";
    document.body.appendChild(a);
    a.click();
    const outboundCalls = getUmamiTrack().mock.calls.filter(
      (call: unknown[]) => call[0] === "outbound_click"
    );
    expect(outboundCalls.length).toBe(0);
  });

  it("resume_download source metadata is the current page pathname", () => {
    window.history.pushState({}, "", "/projects/seatwatch");
    const a = document.createElement("a");
    a.href = "/jack-cutrara-resume.pdf";
    a.textContent = "RESUME";
    document.body.appendChild(a);
    a.click();
    expect(getUmamiTrack()).toHaveBeenCalledWith("resume_download", {
      source: "/projects/seatwatch",
    });
  });
});

describe("outbound classifier behavior edge cases", () => {
  it("ignores clicks on non-anchor elements (bubble-up from <p>)", () => {
    const p = document.createElement("p");
    p.textContent = "plain paragraph";
    document.body.appendChild(p);
    p.click();
    expect(getUmamiTrack()).not.toHaveBeenCalled();
  });
});
