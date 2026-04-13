# Phase 7: Chatbot Feature - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-04
**Phase:** 07-chatbot-feature
**Areas discussed:** Chat UI placement & style, LLM provider & infrastructure, Knowledge delivery, Conversation design, Prompt engineering, Security hardening, Accessibility, Analytics & observability, Input handling

---

## Chat UI Placement & Style

| Option | Description | Selected |
|--------|-------------|----------|
| Floating widget | Persistent chat bubble in bottom-right, available on every page | ✓ |
| Dedicated /chat page | Full-page chat experience at /chat | |
| Inline section on homepage | Chat embedded as a section on the home page | |

**User's choice:** Floating widget
**Notes:** Standard pattern recruiters will recognize

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom-right drawer panel | Fixed panel ~400x500px anchored to bottom-right, overlays content | ✓ |
| Side sheet | Slides in from right, full-height | |
| Modal/dialog | Centered overlay with backdrop | |

**User's choice:** Bottom-right drawer panel

| Option | Description | Selected |
|--------|-------------|----------|
| Icon button with pulse | Chat icon SVG with subtle pulse animation | ✓ |
| Icon + label | Chat icon with text label that collapses after first interaction | |
| Minimal icon only | Clean circular button, no animation | |

**User's choice:** Icon button with pulse

| Option | Description | Selected |
|--------|-------------|----------|
| Match design system | Uses OKLCH tokens, Inter font, existing patterns, theme-aware | ✓ |
| Subtle distinction | Uses tokens but with accent-colored header bar | |

**User's choice:** Match design system

| Option | Description | Selected |
|--------|-------------|----------|
| Full-screen takeover | Fills screen on mobile, keyboard pushes content up | ✓ |
| Bottom sheet | Slides up covering ~75% of screen | |
| Same as desktop | Same drawer panel, just smaller | |

**User's choice:** Full-screen takeover

| Option | Description | Selected |
|--------|-------------|----------|
| Scale + fade from bubble | Panel scales up and fades in from bubble position | ✓ |
| Slide up from bottom | Panel slides up from bottom edge | |
| Instant toggle | No animation | |

**User's choice:** Scale + fade from bubble

---

## LLM Provider & Infrastructure

| Option | Description | Selected |
|--------|-------------|----------|
| Claude API | Anthropic's Claude, strong at system prompt constraints | ✓ |
| OpenAI API | GPT-4o-mini, fast and cheap | |
| You decide | Let Claude pick during implementation | |

**User's choice:** Claude API

| Option | Description | Selected |
|--------|-------------|----------|
| Astro hybrid SSR + Cloudflare | Enable hybrid mode with @astrojs/cloudflare adapter, server route | ✓ |
| Separate Cloudflare Worker | Standalone Worker as chat API | |
| Client-side with proxy service | Managed proxy like Cloudflare AI Gateway | |

**User's choice:** Astro hybrid SSR + Cloudflare

| Option | Description | Selected |
|--------|-------------|----------|
| Haiku | Fastest/cheapest Claude model, ~$0.25/1M input tokens | ✓ |
| Sonnet | Mid-tier, better reasoning but 4x more expensive | |
| You decide | Let Claude pick based on quality testing | |

**User's choice:** Haiku

| Option | Description | Selected |
|--------|-------------|----------|
| Per-IP rate limits | ~20 messages/hour per IP via Cloudflare rate limiting | ✓ |
| Session-based limits | 30 messages per browser session | |
| No rate limiting | Trust it won't be abused | |

**User's choice:** Per-IP rate limits

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, streaming | Tokens stream in real-time via SSE/ReadableStream | ✓ |
| No, wait for full response | Show loading then display complete response | |

**User's choice:** Streaming

| Option | Description | Selected |
|--------|-------------|----------|
| Friendly inline message | Styled error in chat, no technical details | ✓ |
| Retry automatically | Silent retry once, then friendly error | |
| You decide | Let Claude handle error UX | |

**User's choice:** Friendly inline message

---

## Knowledge Delivery

| Option | Description | Selected |
|--------|-------------|----------|
| Static JSON context file | Curated JSON at src/data/portfolio-context.json | ✓ |
| Build-time extraction from MDX | Auto-extract from MDX content collections | |
| Inline in system prompt | Hardcode context in system prompt string | |

**User's choice:** Static JSON context file

**User's choice (multi-select):** Projects & tech stacks, Skills & experience, Education & background, Contact & links — all selected

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, include site tech details | Portfolio itself is a project worth discussing | ✓ |
| No, only career/project content | Don't discuss site implementation | |

**User's choice:** Include site tech details

| Option | Description | Selected |
|--------|-------------|----------|
| Polite redirect | Redirect with suggestion of what to ask | ✓ |
| Strict refusal | "I don't have that information." | |
| Gentle deflection with suggestions | Longer helpful redirect | |

**User's choice:** Polite redirect

| Option | Description | Selected |
|--------|-------------|----------|
| Professional but approachable | Concise, slightly casual, represents well to recruiters | ✓ |
| Strictly professional | Formal business tone only | |
| You decide | Let Claude craft the tone | |

**User's choice:** Professional but approachable

---

## Conversation Design

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-turn with session memory | History within session, resets on refresh/close | ✓ |
| Single-turn Q&A | Each message independent | |
| Multi-turn with persistence | Survives page refresh via localStorage | |

**User's choice:** Multi-turn with session memory

| Option | Description | Selected |
|--------|-------------|----------|
| 3-4 starter chips | Clickable question chips when chat opens | ✓ |
| Just a welcome message | Greeting only, user types own question | |
| Welcome + starters | Both greeting and chips | |

**User's choice:** Starter chips

| Option | Description | Selected |
|--------|-------------|----------|
| Animated dots | Three-dot bounce until first streaming token | ✓ |
| No indicator | Streaming starts directly | |

**User's choice:** Animated dots

| Option | Description | Selected |
|--------|-------------|----------|
| Soft limit with nudge | Gentle note after ~15 messages, still allows chatting | ✓ |
| Hard limit | Cap at ~20, disable input | |
| No limit | Unlimited within rate limit | |

**User's choice:** Soft limit with nudge

| Option | Description | Selected |
|--------|-------------|----------|
| Copy button on hover | Small copy icon per bot message | ✓ |
| No copy feature | Standard text selection only | |

**User's choice:** Copy button on hover

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal header | "Ask Jack's AI" + close button | ✓ |
| Detailed header | Bot name, avatar, description | |
| No header | Jump straight into chat | |

**User's choice:** Minimal header

| Option | Description | Selected |
|--------|-------------|----------|
| Render markdown | Bold, links, bullet lists in responses | ✓ |
| Plain text only | All responses plain text | |

**User's choice:** Render markdown

| Option | Description | Selected |
|--------|-------------|----------|
| Persist across navigation | Chat survives page transitions via transition:persist | ✓ |
| Reset on navigation | Chat closes/resets on page change | |

**User's choice:** Persist across navigation

---

## Prompt Engineering (added by user)

**User's directive:** Explicit research mandate — structured prompting best practices must be researched before the system prompt is authored. Safety, quality, and grounding are non-negotiable.

---

## Security Hardening (added by user)

**User's directive:** Research + implement all security vectors — XSS, prompt injection, input validation/normalization, output sanitization, rate limiting, structured output. Every vector gets a dedicated research topic and implementation task.

---

## Accessibility

| Option | Description | Selected |
|--------|-------------|----------|
| Live region announcements | aria-live='polite' on message container | ✓ |
| You decide | Let Claude implement | |

**User's choice:** Live region announcements

| Option | Description | Selected |
|--------|-------------|----------|
| Full keyboard support | Escape closes, Tab cycles, focus trapped | ✓ |
| You decide | Let Claude implement | |

**User's choice:** Full keyboard support

---

## Analytics & Observability

| Option | Description | Selected |
|--------|-------------|----------|
| Basic anonymous metrics | Track opens, messages, chip clicks. No content logged | ✓ |
| Full conversation logging | Log all conversations server-side | |
| No analytics | Don't track usage | |

**User's choice:** Basic anonymous metrics

| Option | Description | Selected |
|--------|-------------|----------|
| Small privacy note | "Conversations are not stored." in panel | ✓ |
| No privacy note | Keep UI clean | |

**User's choice:** Privacy note in panel

---

## Input Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Enter to send | Shift+Enter for newline, send button visible, input disabled while streaming | ✓ |
| Send button only | Enter creates newline, must click Send | |
| You decide | Let Claude pick | |

**User's choice:** Enter to send

| Option | Description | Selected |
|--------|-------------|----------|
| 500 characters | Character count shown near limit | ✓ |
| No limit | Accept any length | |
| You decide | Let Claude determine | |

**User's choice:** 500 characters

---

## Claude's Discretion

- Exact starter question wording
- Typing indicator animation timing
- Loading skeleton for initial panel render
- Markdown rendering library choice

## Deferred Ideas

None — discussion stayed within phase scope
