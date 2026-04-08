// Chat client-side controller — Phase 7
// Handles: bubble toggle, GSAP animations, starter chips, input handling,
// SSE streaming with AbortController timeout, markdown rendering with
// DOMPurify sanitization, copy-to-clipboard, typing indicator, error messages,
// nudge system, auto-scroll, and reduced-motion support.

import { marked } from "marked";
import DOMPurify, { type Config } from "dompurify";

// ============================================
// Markdown Rendering Pipeline (D-21, D-25, D-38)
// ============================================

// Configure marked for limited subset
// CRITICAL: Use { async: false } — marked v17 parse() returns Promise without it.
// Addresses review concern: Claude flagged as HIGH — DOMPurify.sanitize(Promise)
// returns empty string, silently breaking XSS protection while tests pass falsely.
marked.use({ breaks: true, gfm: true, async: false });

// Complete DOMPurify configuration — addresses review concern from all 3 reviewers:
// Codex flagged as HIGH that allowlisting tags alone is insufficient.
// Must specify allowed attributes, forbid style, enforce safe URL protocols.
const PURIFY_CONFIG: Config = {
  ALLOWED_TAGS: ["b", "strong", "em", "i", "code", "a", "ul", "ol", "li", "p", "br"],
  ALLOWED_ATTR: ["href", "target", "rel"],
  FORBID_ATTR: ["style"],
  ALLOW_DATA_ATTR: false,
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  RETURN_TRUSTED_TYPE: false,
};

// DOMPurify hook: add target="_blank" and rel="noopener noreferrer" to all links
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A") {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }
});

/**
 * Render raw markdown text to sanitized HTML.
 * Pipeline: raw -> marked.parse() -> DOMPurify.sanitize()
 * Exported for testing.
 */
export function renderMarkdown(raw: string): string {
  // marked.parse() with { async: false } configured above — returns string, not Promise
  const html = marked.parse(raw) as string;
  return DOMPurify.sanitize(html, PURIFY_CONFIG);
}

// ============================================
// State Management (D-26)
// ============================================

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const messages: ChatMessage[] = [];
let isStreaming = false;
let messageCount = 0;

// Module-level initialization guard — prevents duplicate handlers
// across view transition navigations where transition:persist preserves
// the DOM but astro:page-load re-fires the script.
// Addresses review concern: Claude MEDIUM, Codex MEDIUM — duplicate handler risk.
let chatInitialized = false;

// Focus trap cleanup reference — stored at module level so
// astro:before-preparation can clean up even if panel scope is lost.
let cleanupFocusTrap: (() => void) | null = null;

// ============================================
// SSE Streaming with AbortController (D-11)
// ============================================

// Addresses review concern: all 3 reviewers flagged missing stream abort/error handling.
// Client-side AbortController timeout prevents stuck "typing" state on connection drops.
async function streamChat(
  chatMessages: ChatMessage[],
  onToken: (text: string) => void,
  onDone: () => void,
  onError: (type: string) => void
): Promise<void> {
  // AbortController with 30-second timeout to prevent stuck "typing" state
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: chatMessages }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.status === 429) {
      onError("rate_limited");
      return;
    }
    if (!response.ok) {
      onError("api_error");
      return;
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") {
          onDone();
          return;
        }
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            onError("api_error");
            return;
          }
          onToken(parsed.text);
        } catch {
          /* skip malformed SSE line */
        }
      }
    }
    onDone();
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof DOMException && err.name === "AbortError") {
      onError("timeout");
    } else {
      onError("api_error");
    }
  }
}

// ============================================
// DOM Helpers
// ============================================

function scrollToBottom(el: HTMLElement): void {
  el.scrollTop = el.scrollHeight;
}

function autoGrowTextarea(textarea: HTMLTextAreaElement): void {
  textarea.style.height = "auto";
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
}

// ============================================
// Copy to Clipboard (D-30)
// ============================================

// MUST wrap in try/catch — navigator.clipboard.writeText() fails on non-HTTPS
// Addresses review concern: Claude flagged clipboard API needing try/catch as MEDIUM
async function copyToClipboard(text: string, button: HTMLElement): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    button.classList.add("copy-success");
    setTimeout(() => button.classList.remove("copy-success"), 2000);
  } catch {
    // Silently fail — no user-visible error for copy failure on non-HTTPS
  }
}

// ============================================
// Message Rendering
// ============================================

function createUserMessageEl(content: string): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "chat-message-wrapper";
  wrapper.style.cssText = "display: flex; justify-content: flex-end; margin-bottom: 8px;";

  const bubble = document.createElement("div");
  bubble.style.cssText = `
    max-width: 85%;
    background: var(--rule);
    border-radius: 12px 12px 4px 12px;
    padding: 8px 16px;
    color: var(--ink);
    font-size: 1rem;
    word-break: break-word;
  `;
  bubble.textContent = content;

  wrapper.appendChild(bubble);
  return wrapper;
}

function createBotMessageEl(content: string): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "chat-message-wrapper";
  wrapper.style.cssText = "display: flex; justify-content: flex-start; margin-bottom: 8px; position: relative;";

  const bubble = document.createElement("div");
  bubble.className = "chat-bot-message";
  bubble.style.cssText = `
    max-width: 90%;
    border-left: 2px solid var(--rule);
    padding: 8px 0 8px 12px;
    color: var(--ink-muted);
    font-size: 1rem;
    word-break: break-word;
  `;
  // Sanitized HTML — safe to use innerHTML after marked + DOMPurify pipeline
  bubble.innerHTML = renderMarkdown(content);

  // Copy button
  const copyBtn = document.createElement("button");
  copyBtn.className = "chat-copy-btn";
  copyBtn.setAttribute("aria-label", "Copy message");
  copyBtn.style.cssText = `
    position: absolute;
    top: -4px;
    right: 0;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    border-radius: 4px;
  `;
  copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-faint)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
  copyBtn.addEventListener("click", () => {
    copyToClipboard(content, copyBtn);
  });

  wrapper.appendChild(bubble);
  wrapper.appendChild(copyBtn);
  return wrapper;
}

function createErrorMessageEl(text: string): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "display: flex; justify-content: flex-start; margin-bottom: 8px;";

  const bubble = document.createElement("div");
  bubble.style.cssText = `
    max-width: 90%;
    border-left: 2px solid var(--rule);
    padding: 8px 0 8px 12px;
    color: var(--ink-faint);
    font-size: 1rem;
    font-style: italic;
  `;
  bubble.textContent = text;

  wrapper.appendChild(bubble);
  return wrapper;
}

function createNudgeMessageEl(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "display: flex; justify-content: center; margin-bottom: 8px;";

  const text = document.createElement("span");
  text.style.cssText = `
    font-size: 0.875rem;
    color: var(--ink-faint);
    font-style: italic;
    padding: 8px 16px;
  `;
  text.textContent = "For more details, check out my projects page or reach out directly.";

  wrapper.appendChild(text);
  return wrapper;
}

// ============================================
// Error Messages (D-12)
// ============================================

const ERROR_MESSAGES: Record<string, string> = {
  api_error: "Sorry, I'm having trouble right now. Try again in a moment.",
  rate_limited: "You've sent a lot of messages. Please wait a moment before trying again.",
  offline: "It looks like you're offline. Check your connection and try again.",
  timeout: "Sorry, I'm having trouble right now. Try again in a moment.",
};

// ============================================
// Anonymous Analytics Event Dispatching (D-36)
// ============================================

// Fire-and-forget analytics via CustomEvent on document.
// Framework-agnostic — can be consumed by any analytics provider later.
// No conversation content is included in events (D-36).
// Error tracking added per review feedback: Claude LOW — error frequency is
// valuable operational data.

function trackChatEvent(action: string, label?: string): void {
  document.dispatchEvent(new CustomEvent("chat:analytics", {
    detail: { action, label, timestamp: Date.now() },
  }));

  // Also log to console in development for debugging
  if (import.meta.env.DEV) {
    console.log(`[chat:analytics] ${action}`, label ?? "");
  }
}

// ============================================
// Focus Trap with Dynamic Re-querying (D-33)
// ============================================

// Addresses review concern: Claude MEDIUM — focus trap must re-query focusable
// elements on EACH Tab keypress because bot messages dynamically add <a> links
// and copy buttons. Static query at panel-open time would miss these elements.

function setupFocusTrap(panel: HTMLElement, onEscape: () => void): () => void {
  const handler = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onEscape();
      return;
    }
    if (e.key !== "Tab") return;

    // Re-query focusable elements on EACH Tab keypress — bot messages
    // dynamically add <a> links and copy buttons that must be included.
    const focusable = panel.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  panel.addEventListener("keydown", handler);
  return () => panel.removeEventListener("keydown", handler);
}

// ============================================
// Animation Helpers (Phase 8: GSAP removed — no-op stubs)
// Chat motion restoration deferred to Phase 10 CHAT-02 per D-27.
// ============================================

async function animatePanelOpen(panel: HTMLElement): Promise<void> {
  panel.style.display = "flex";
}

async function animatePanelClose(panel: HTMLElement): Promise<void> {
  panel.style.display = "none";
}

async function animateMessageAppear(_el: HTMLElement): Promise<void> {
  // No-op: no entrance animation (chat motion restoration deferred to Phase 10 CHAT-02 per D-27)
}

async function startPulse(_bubble: HTMLElement): Promise<void> {
  // No-op: no pulse (chat motion restoration deferred to Phase 10 CHAT-02 per D-27)
}

function stopPulse(): void {
  // No-op: there is no pulse to stop
}

async function startTypingDots(container: HTMLElement): Promise<void> {
  // Use CSS-based opacity fallback (no GSAP bounce — Phase 10 CHAT-02 may restore via @keyframes)
  const dots = container.querySelectorAll<HTMLElement>(".typing-dot");
  dots.forEach((dot) => {
    dot.style.animation = "none";
    dot.style.opacity = "0.5";
  });
}

// ============================================
// Initialization (astro:page-load)
// ============================================

function initChat(): void {
  const panel = document.getElementById("chat-panel") as HTMLElement | null;
  if (!panel) return; // Widget not in DOM yet

  // Idempotency: if already initialized AND the same DOM elements exist,
  // skip re-initialization. The transition:persist keeps our state alive.
  if (chatInitialized && panel.dataset.chatBound === "true") {
    // Panel already initialized — but if panel is open after navigation,
    // re-attach focus trap (it was cleaned up on astro:before-preparation)
    if (panel.style.display !== "none") {
      const closeFn = () => {
        const bubble = document.getElementById("chat-bubble") as HTMLButtonElement | null;
        if (bubble) bubble.click(); // Trigger close via existing handler
      };
      cleanupFocusTrap = setupFocusTrap(panel, closeFn);
    }
    return;
  }

  const bubble = document.getElementById("chat-bubble") as HTMLButtonElement | null;
  const closeBtn = document.getElementById("chat-close") as HTMLButtonElement | null;
  const input = document.getElementById("chat-input") as HTMLTextAreaElement | null;
  const sendBtn = document.getElementById("chat-send") as HTMLButtonElement | null;
  const messagesArea = document.getElementById("chat-messages") as HTMLElement | null;
  const starters = document.getElementById("chat-starters") as HTMLElement | null;
  const typingIndicator = document.getElementById("chat-typing") as HTMLElement | null;
  const charCount = document.getElementById("chat-char-count") as HTMLElement | null;
  const bubbleIcon = document.getElementById("chat-bubble-icon") as HTMLElement | null;
  const bubbleCloseIcon = document.getElementById("chat-bubble-close-icon") as HTMLElement | null;

  if (!bubble || !closeBtn || !input || !sendBtn || !messagesArea || !starters || !typingIndicator || !charCount) {
    return; // Elements not yet in DOM
  }

  // Re-bind for closure safety — TypeScript narrows these as non-null after the guard,
  // and the new const bindings carry the narrowed type into nested closures.
  const $panel = panel;
  const $bubble = bubble;
  const $closeBtn = closeBtn;
  const $input = input;
  const $sendBtn = sendBtn;
  const $messagesArea = messagesArea;
  const $starters = starters;
  const $typingIndicator = typingIndicator;
  const $charCount = charCount;

  // Mark as initialized
  chatInitialized = true;
  panel.dataset.chatBound = "true";

  let panelOpen = false;

  // Start bubble pulse animation
  startPulse($bubble);

  // ---- Bubble Toggle (D-01, D-03, D-06) ----

  function openPanel(): void {
    panelOpen = true;
    stopPulse();
    trackChatEvent("chat_open");
    $bubble.setAttribute("aria-expanded", "true");
    $bubble.setAttribute("aria-label", "Close chat");
    if (bubbleIcon) bubbleIcon.style.display = "none";
    if (bubbleCloseIcon) bubbleCloseIcon.style.display = "block";

    // Mobile: add full-screen class
    if (window.innerWidth < 768) {
      $panel.classList.add("chat-panel-mobile");
    }

    // Set up focus trap — Escape handled inside, Tab cycles with dynamic re-query
    cleanupFocusTrap = setupFocusTrap($panel, closePanel);

    animatePanelOpen($panel).then(() => {
      $input.focus();
    });
  }

  function closePanel(): void {
    panelOpen = false;
    $bubble.setAttribute("aria-expanded", "false");
    $bubble.setAttribute("aria-label", "Open chat");
    if (bubbleIcon) bubbleIcon.style.display = "block";
    if (bubbleCloseIcon) bubbleCloseIcon.style.display = "none";
    $panel.classList.remove("chat-panel-mobile");

    // Clean up focus trap
    if (cleanupFocusTrap) {
      cleanupFocusTrap();
      cleanupFocusTrap = null;
    }

    animatePanelClose($panel).then(() => {
      $bubble.focus();
      startPulse($bubble);
    });
  }

  $bubble.addEventListener("click", () => {
    if (panelOpen) {
      closePanel();
    } else {
      openPanel();
    }
  });

  $closeBtn.addEventListener("click", () => {
    closePanel();
  });

  // ---- Input Handling (D-34, D-35) ----

  function updateCharCount(): void {
    const len = $input.value.length;
    if (len === 0) {
      $charCount.style.display = "none";
      return;
    }
    $charCount.style.display = "block";
    $charCount.textContent = `${len}/500`;

    if (len >= 500) {
      $charCount.style.color = "var(--accent)";
      $charCount.style.fontWeight = "600";
    } else if (len > 450) {
      $charCount.style.color = "var(--accent)";
      $charCount.style.fontWeight = "600";
    } else {
      $charCount.style.color = "var(--ink-faint)";
      $charCount.style.fontWeight = "400";
    }
  }

  function updateSendButton(): void {
    const hasContent = $input.value.trim().length > 0;
    if (hasContent && !isStreaming) {
      $sendBtn.disabled = false;
      $sendBtn.style.opacity = "1";
      $sendBtn.style.cursor = "pointer";
    } else {
      $sendBtn.disabled = true;
      $sendBtn.style.opacity = "0.4";
      $sendBtn.style.cursor = "not-allowed";
    }
  }

  function setInputDisabled(disabled: boolean): void {
    if (disabled) {
      $input.style.opacity = "0.5";
      $input.style.pointerEvents = "none";
      $sendBtn.style.opacity = "0.5";
      $sendBtn.style.pointerEvents = "none";
    } else {
      $input.style.opacity = "1";
      $input.style.pointerEvents = "auto";
      updateSendButton();
    }
  }

  $input.addEventListener("input", () => {
    // Prevent input beyond 500 characters
    if ($input.value.length > 500) {
      $input.value = $input.value.slice(0, 500);
    }
    autoGrowTextarea($input);
    updateCharCount();
    updateSendButton();
  });

  // Enter sends, Shift+Enter adds newline (D-34)
  $input.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if ($input.value.trim() && !isStreaming) {
        sendMessage($input.value.trim());
      }
    }
  });

  $sendBtn.addEventListener("click", () => {
    if ($input.value.trim() && !isStreaming) {
      sendMessage($input.value.trim());
    }
  });

  // ---- Starter Chips (D-27) ----

  const chipButtons = $starters.querySelectorAll<HTMLButtonElement>(".chat-starter-chip");
  chipButtons.forEach((chip) => {
    chip.addEventListener("click", () => {
      const text = chip.textContent?.trim();
      if (text) {
        trackChatEvent("chip_click", text);
        sendMessage(text);
      }
    });
    // Support Enter key on chips
    chip.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        chip.click();
      }
    });
  });

  // ---- Send Message ----

  function hideStarters(): void {
    $starters.style.display = "none";
  }

  function showTyping(): void {
    $typingIndicator.style.display = "flex";
    startTypingDots($typingIndicator);
    scrollToBottom($messagesArea);
  }

  function hideTyping(): void {
    $typingIndicator.style.display = "none";
  }

  async function sendMessage(content: string): Promise<void> {
    if (isStreaming) return;

    // Check offline (D-12)
    if (!navigator.onLine) {
      trackChatEvent("chat_error", "offline");
      const errorEl = createErrorMessageEl(ERROR_MESSAGES.offline);
      $messagesArea.insertBefore(errorEl, $typingIndicator);
      scrollToBottom($messagesArea);
      return;
    }

    // Track message sent (no content logged — D-36)
    trackChatEvent("message_sent");

    // Add user message
    messages.push({ role: "user", content });
    const userEl = createUserMessageEl(content);
    $messagesArea.insertBefore(userEl, $typingIndicator);
    animateMessageAppear(userEl);

    // Clear input
    $input.value = "";
    autoGrowTextarea($input);
    updateCharCount();
    updateSendButton();

    // Hide starters
    hideStarters();

    // Show typing indicator
    isStreaming = true;
    setInputDisabled(true);
    showTyping();

    // Track message count for nudge (D-29)
    messageCount++;

    // Accumulate bot response
    let botContent = "";
    let botEl: HTMLElement | null = null;
    let botBubble: HTMLElement | null = null;

    await streamChat(
      messages,
      // onToken
      (text: string) => {
        // Hide typing on first token
        if (!botEl) {
          hideTyping();
          botEl = createBotMessageEl("");
          botBubble = botEl.querySelector(".chat-bot-message");
          $messagesArea.insertBefore(botEl, $typingIndicator);
          animateMessageAppear(botEl);
        }
        botContent += text;
        if (botBubble) {
          botBubble.innerHTML = renderMarkdown(botContent);
        }
        scrollToBottom($messagesArea);
      },
      // onDone
      () => {
        hideTyping();
        isStreaming = false;
        setInputDisabled(false);
        $input.focus();

        // If no tokens received, create empty bot message
        if (!botEl) {
          botEl = createBotMessageEl(botContent || "...");
          $messagesArea.insertBefore(botEl, $typingIndicator);
        }

        // Store final bot message
        if (botContent) {
          messages.push({ role: "assistant", content: botContent });
        }

        // Update copy button to use final content
        const copyBtn = botEl?.querySelector(".chat-copy-btn");
        if (copyBtn) {
          copyBtn.replaceWith(copyBtn.cloneNode(true));
          const newCopyBtn = botEl?.querySelector(".chat-copy-btn") as HTMLElement;
          if (newCopyBtn) {
            newCopyBtn.addEventListener("click", () => {
              copyToClipboard(botContent, newCopyBtn);
            });
          }
        }

        // Nudge after ~15 messages (D-29)
        if (messageCount === 15) {
          const nudgeEl = createNudgeMessageEl();
          $messagesArea.insertBefore(nudgeEl, $typingIndicator);
          scrollToBottom($messagesArea);
        }

        scrollToBottom($messagesArea);
      },
      // onError
      (type: string) => {
        hideTyping();
        isStreaming = false;
        setInputDisabled(false);
        $input.focus();

        trackChatEvent("chat_error", type);
        const errorMessage = ERROR_MESSAGES[type] || ERROR_MESSAGES.api_error;
        const errorEl = createErrorMessageEl(errorMessage);
        $messagesArea.insertBefore(errorEl, $typingIndicator);
        scrollToBottom($messagesArea);
      }
    );
  }
}

// ============================================
// Lifecycle: Astro View Transitions (D-07)
// ============================================

// Listen to astro:page-load for (re)initialization
// Idempotency guard in initChat() prevents duplicate handlers
// when transition:persist preserves the DOM across navigations.
document.addEventListener("astro:page-load", initChat);

// Also initialize on DOMContentLoaded as fallback
if (document.readyState !== "loading") {
  initChat();
} else {
  document.addEventListener("DOMContentLoaded", initChat);
}
