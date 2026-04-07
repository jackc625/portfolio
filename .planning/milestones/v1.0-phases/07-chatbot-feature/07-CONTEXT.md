# Phase 7: Chatbot Feature - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Add an AI-powered chatbot to the portfolio that answers questions about Jack's background, projects, and technical experience. The chatbot uses curated portfolio data as its knowledge source and provides concise, factual, professional responses. It is scoped strictly to portfolio content — not a general-purpose AI assistant.

</domain>

<decisions>
## Implementation Decisions

### Chat UI Placement & Style
- **D-01:** Floating widget — persistent chat bubble in bottom-right corner, available on every page
- **D-02:** Bottom-right drawer panel (~400px wide, ~500px tall) when expanded, overlays page content, can be minimized back to bubble
- **D-03:** Collapsed state is an icon button (message bubble SVG) with a subtle pulse animation to draw attention
- **D-04:** Matches existing design system — uses OKLCH tokens, Inter font, existing border-radius/shadow patterns, dark/light theme-aware
- **D-05:** Full-screen takeover on mobile — standard mobile chat UX with keyboard pushing content up
- **D-06:** Scale + fade open/close animation from the bubble position, consistent with GSAP animation language
- **D-07:** Chat persists across page navigation using Astro's `transition:persist` — user can browse while chatting

### LLM Provider & Infrastructure
- **D-08:** Claude API (Anthropic) — Haiku model for fast, cheap responses ideal for short grounded Q&A
- **D-09:** Astro hybrid SSR with `@astrojs/cloudflare` adapter — server route at `src/pages/api/chat.ts`, rest of site stays static, API key stored as Cloudflare environment variable
- **D-10:** Per-IP rate limiting (~20 messages/hour) using Cloudflare's built-in rate limiting
- **D-11:** Streaming responses — tokens stream in real-time via SSE/ReadableStream from the API route
- **D-12:** Friendly inline error messages in the chat — "Sorry, I'm having trouble right now. Try again in a moment." No technical details exposed

### Knowledge Delivery
- **D-13:** Static JSON context file at `src/data/portfolio-context.json` — curated data covering projects & tech stacks, skills & experience, education & background, contact & links, and the portfolio site's own tech stack
- **D-14:** Context file injected into the system prompt at request time
- **D-15:** Polite redirect for out-of-scope questions — "I can only answer questions about Jack's work and background. Try asking about his projects or experience!"
- **D-16:** Professional but approachable tone — concise, slightly casual, represents Jack well to recruiters without being stiff

### Prompt Engineering (RESEARCH MANDATE)
- **D-17:** Phase researcher MUST investigate structured prompting best practices before the system prompt is authored — grounding techniques, output formatting constraints, jailbreak/injection resistance patterns, Anthropic's official prompt engineering guidelines
- **D-18:** System prompt must be structured and explicit — not a single paragraph of instructions but a well-organized prompt with clear sections for role, constraints, knowledge, tone, and boundary behavior
- **D-19:** Prompt must enforce grounded responses only — the bot cannot invent, exaggerate, or speculate beyond what's in the context file

### Security Hardening (RESEARCH MANDATE)
- **D-20:** Phase researcher MUST investigate every security vector and planner MUST create explicit tasks for each — no security item left to "figure it out later"
- **D-21:** XSS prevention — all bot responses sanitized before rendering to DOM, markdown rendering must not execute scripts
- **D-22:** Prompt injection defense — input validation and normalization before sending to LLM, structured output enforcement so model responses stay within expected format
- **D-23:** Input validation — max 500 characters per message, character count shown near limit, strip/escape dangerous characters
- **D-24:** Rate limiting — per-IP limits at Cloudflare level (D-10) plus application-level validation
- **D-25:** Output sanitization — structured output from LLM parsed and validated before rendering, no raw HTML passed through

### Conversation Design
- **D-26:** Multi-turn conversation with session memory — maintains history within session, resets on refresh/close
- **D-27:** 3-4 clickable starter question chips shown when chat opens (e.g., "What projects have you built?", "What's your tech stack?")
- **D-28:** Animated three-dot typing indicator shown until first streaming token arrives
- **D-29:** Soft message limit with nudge after ~15 messages — "For more details, check out my projects page or reach out directly." Still allows continued chatting
- **D-30:** Copy button appears on hover/tap for each bot message
- **D-31:** Minimal header — "Ask Jack's AI" label + close button

### Accessibility
- **D-32:** aria-live='polite' on message container for screen reader announcements of new messages
- **D-33:** Full keyboard support — Escape closes panel, Tab cycles interactive elements, focus trapped inside panel when open

### Input Handling
- **D-34:** Enter to send, Shift+Enter for newline, send button visible for mouse/touch users, input disabled while bot is streaming
- **D-35:** 500 character max per message with character count indicator

### Analytics & Privacy
- **D-36:** Basic anonymous metrics — chat opens, messages sent, starter chip clicks. No conversation content logged
- **D-37:** Small privacy note in chat panel: "Conversations are not stored."

### Markdown Rendering
- **D-38:** Bot responses render markdown (bold, links, bullet lists) — enables linking to project pages and structuring longer answers

### Claude's Discretion
- Exact starter question wording
- Typing indicator animation timing
- Loading skeleton for initial panel render
- Exact markdown rendering library choice (research phase can recommend)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Feature Specification
- `.planning/phases/07-chatbot-feature/FEATURE.md` — Core feature definition, behavior rules, scope boundaries, what the chatbot is and is not

### Existing Codebase (integration points)
- `src/layouts/BaseLayout.astro` — Main layout where chat widget will be injected, has existing view transition setup and GSAP lifecycle
- `astro.config.mjs` — Currently pure static config, needs hybrid SSR + Cloudflare adapter added
- `src/styles/global.css` — OKLCH design tokens and theme system the chat UI must integrate with
- `src/scripts/animations.ts` — GSAP animation patterns to align chat open/close animation with

### Research Topics (for phase researcher)
- Anthropic prompt engineering best practices — structured system prompts, grounding, jailbreak resistance
- Cloudflare Pages + Astro hybrid SSR — `@astrojs/cloudflare` adapter setup for server routes
- Chat UI security — XSS prevention in markdown rendering, prompt injection defense, input sanitization patterns
- Streaming responses — SSE/ReadableStream patterns in Astro server routes with Claude API

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `BaseLayout.astro` — Layout with view transitions (`ClientRouter`), theme system, GSAP lifecycle hooks. Chat widget goes here with `transition:persist`
- `src/styles/global.css` — OKLCH color tokens (`--color-*`), design tokens (`--token-*`), theme switching via `data-theme` attribute
- `src/scripts/animations.ts` — GSAP initialization/cleanup pattern — chat animations should follow the same `astro:page-load` / `astro:before-preparation` lifecycle
- `ThemeToggle.astro` — Example of a small interactive component with dark/light awareness

### Established Patterns
- Astro components (`.astro` files) for static markup, vanilla `<script>` tags for client-side interactivity
- No React/Vue islands — all interactivity is vanilla JS + GSAP. Chat widget should follow this pattern
- Tailwind v4 utility classes with OKLCH custom properties
- View transitions with `ClientRouter` — components can use `transition:persist` to survive navigation

### Integration Points
- `BaseLayout.astro` — Chat widget component injected before `</body>`, after Footer, with `transition:persist`
- `astro.config.mjs` — Add `@astrojs/cloudflare` adapter, switch output to `hybrid`
- New `src/pages/api/chat.ts` — Server endpoint (new pattern for this codebase)
- New `src/data/portfolio-context.json` — Structured knowledge file (new `src/data/` directory)

</code_context>

<specifics>
## Specific Ideas

- Chat must feel native to the portfolio — not a third-party widget bolted on. Uses the same tokens, fonts, and visual language as the rest of the site
- The chatbot is a demonstration of technical ability itself — it should be well-engineered enough that an engineer reviewing the code would be impressed
- System prompt must be a first-class artifact — structured, well-researched, explicit. Not a quick paragraph
- Security is non-negotiable — every input/output boundary must be validated. This is a public-facing AI endpoint

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-chatbot-feature*
*Context gathered: 2026-04-04*
