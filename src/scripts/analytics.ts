// Analytics client-side forwarder — Phase 15
// Handles: chat:analytics forwarding to Umami (D-11), delegated outbound-link
// classification (D-10), resume-download dedup (D-09), href content-free metadata
// policy (D-12). Content-free discipline (Phase 7 D-36) preserved verbatim.
// No runtime imports — window.umami is loaded externally via BaseLayout.astro
// is:inline script tag (Plan 15-01). See 15-CONTEXT.md and 15-RESEARCH.md §1.

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, unknown>) => void;
    };
  }
}

export {}; // ensure module scope

/**
 * Classify an outbound anchor's href into an event type + metadata.
 * Returns null if the URL is same-origin (internal link) and NOT a .pdf download.
 * Exported for testing.
 *
 * D-10: type ∈ { github, linkedin, email, external, pdf }
 * D-12: href metadata = hostname + pathname only (strip query + fragment);
 *       mailto: stored as literal "mailto" (not email address)
 * D-09: /jack-cutrara-resume.pdf is handled by the delegated click listener
 *       BEFORE reaching this function (early return to resume_download event)
 */
export function classifyOutbound(href: string): { type: string; href: string } | null {
  if (href.startsWith("mailto:")) {
    return { type: "email", href: "mailto" };
  }

  // Parse relative + absolute URLs consistently; new URL normalizes both.
  let url: URL;
  try {
    url = new URL(
      href,
      typeof location !== "undefined" ? location.origin : "http://localhost"
    );
  } catch {
    return null; // malformed href
  }

  const hostname = url.hostname.toLowerCase();
  const pathname = url.pathname;

  // Same-origin non-pdf links are not outbound.
  if (typeof location !== "undefined" && hostname === location.hostname) {
    if (!pathname.toLowerCase().endsWith(".pdf")) return null;
    // Same-origin .pdf other than /jack-cutrara-resume.pdf — resume is handled
    // in the click listener before classifyOutbound is called; this branch is
    // defensive for a hypothetical future same-origin .pdf.
    return { type: "pdf", href: `${hostname}${pathname}` };
  }

  // External .pdf
  if (pathname.toLowerCase().endsWith(".pdf")) {
    return { type: "pdf", href: `${hostname}${pathname}` };
  }

  // Hostname-based classification.
  let type: string;
  if (hostname === "github.com" || hostname.endsWith(".github.com")) {
    type = "github";
  } else if (hostname === "linkedin.com" || hostname === "www.linkedin.com") {
    type = "linkedin";
  } else {
    type = "external";
  }

  return { type, href: `${hostname}${pathname}` };
}

/**
 * Handle a chat:analytics CustomEvent detail payload by forwarding to Umami.
 * Preserves Phase 7 D-36 content-free discipline: only `action` + optional
 * `label` are forwarded; the `timestamp` in the detail is dropped (Umami
 * timestamps events server-side).
 * Exported for testing.
 */
export function handleChatAnalytics(detail: { action: string; label?: string }): void {
  const payload = detail.label ? { label: detail.label } : {};
  window.umami?.track(detail.action, payload);
}

let analyticsInitialized = false;

function initAnalytics(): void {
  if (analyticsInitialized) return;
  analyticsInitialized = true;

  // D-11: forward every chat:analytics CustomEvent to Umami.
  document.addEventListener("chat:analytics", (event) => {
    const detail = (event as CustomEvent<{ action: string; label?: string }>).detail;
    if (!detail || typeof detail.action !== "string") return;
    handleChatAnalytics(detail);
  });

  // D-10 / D-09: delegated document-level click listener.
  // Passive listener (we never intercept navigation — observational only).
  document.addEventListener(
    "click",
    (event) => {
      const target = event.target as Element | null;
      if (!target) return;
      const anchor = target.closest<HTMLAnchorElement>("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;

      // D-09: /jack-cutrara-resume.pdf FIRES resume_download ONLY — early return
      // BEFORE reaching classifyOutbound. Lowercase pathname compare is defensive
      // (CONTACT.resume is committed lowercase but contributors may type variants).
      try {
        const url = new URL(href, location.origin);
        if (url.pathname.toLowerCase() === "/jack-cutrara-resume.pdf") {
          window.umami?.track("resume_download", { source: location.pathname });
          return;
        }
      } catch {
        // malformed href — fall through to classifier's own try/catch
      }

      // D-10: everything else — outbound_click (or no-op for same-origin non-pdf).
      const classification = classifyOutbound(href);
      if (classification === null) return;
      window.umami?.track("outbound_click", classification);
    },
    { passive: true }
  );

  if (import.meta.env.DEV) {
    console.log("[analytics] listeners registered");
  }
}

// Bootstrap (matches 15-PATTERNS.md Shared Pattern — Bootstrap on
// astro:page-load + DOMContentLoaded; mirrors scroll-depth.ts and chat.ts).
if (typeof document !== "undefined") {
  document.addEventListener("astro:page-load", initAnalytics);
  if (document.readyState !== "loading") {
    initAnalytics();
  } else {
    document.addEventListener("DOMContentLoaded", initAnalytics);
  }
}
