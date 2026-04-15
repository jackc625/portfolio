---
phase: 10-page-port
reviewed: 2026-04-13T17:10:00Z
depth: standard
files_reviewed: 22
files_reviewed_list:
  - astro.config.mjs
  - design-system/MASTER.md
  - src/components/ContactSection.astro
  - src/components/chat/ChatWidget.astro
  - src/components/primitives/Footer.astro
  - src/components/primitives/MobileMenu.astro
  - src/content.config.ts
  - src/content/projects/clipify.mdx
  - src/content/projects/crypto-breakout-trader.mdx
  - src/content/projects/nfl-predict.mdx
  - src/content/projects/optimize-ai.mdx
  - src/content/projects/seatwatch.mdx
  - src/content/projects/solsniper.mdx
  - src/data/about.ts
  - src/data/contact.ts
  - src/pages/about.astro
  - src/pages/contact.astro
  - src/pages/index.astro
  - src/pages/projects.astro
  - src/pages/projects/[id].astro
  - src/scripts/chat.ts
  - src/styles/global.css
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 10: Code Review Report

**Reviewed:** 2026-04-13T17:10:00Z
**Depth:** standard
**Files Reviewed:** 22
**Status:** issues_found

## Summary

Reviewed the full Phase 10 page port: Astro config, content collections, all 6 project MDX files, data modules (about.ts, contact.ts), all 5 page routes, the chat controller script, global CSS, and key primitives (Footer, MobileMenu, ContactSection, ChatWidget). Build passes with zero errors and zero warnings (`astro check`). No security vulnerabilities found -- DOMPurify sanitization pipeline is correctly configured, no hardcoded secrets, and all innerHTML usage goes through the marked + DOMPurify pipeline. Three warnings relate to SEO title double-branding and a visual inconsistency between live and restored chat messages. Three info items cover minor code quality observations.

## Warnings

### WR-01: Homepage title double-brands as "Jack Cutrara | Jack Cutrara"

**File:** `src/pages/index.astro:35`
**Issue:** The homepage passes `title="Jack Cutrara"` to BaseLayout, which applies `titleTemplate="%s | Jack Cutrara"`, producing `<title>Jack Cutrara | Jack Cutrara</title>`. This was documented as a known pitfall in Phase 2 research (02-RESEARCH.md line 428) with the solution being to pass an empty/null title so `titleDefault` is used. The fix was not applied.
**Fix:**
```astro
<!-- index.astro line 35: pass empty string so titleDefault kicks in -->
<BaseLayout title="" description="Software engineer building reliable, production-grade systems.">
```
Or alternatively, pass the full desired title and have BaseLayout conditionally skip the template for the homepage.

### WR-02: Project detail page title double-brands as "{Title} - Jack Cutrara | Jack Cutrara"

**File:** `src/pages/projects/[id].astro:32`
**Issue:** The project detail page passes `title={`${project.data.title} - Jack Cutrara`}` which with the layout's `titleTemplate="%s | Jack Cutrara"` produces titles like "SeatWatch - Jack Cutrara | Jack Cutrara". The ` - Jack Cutrara` suffix in the page-level title is redundant since the template already appends it.
**Fix:**
```astro
<!-- [id].astro line 32: let titleTemplate handle the branding -->
<BaseLayout title={project.data.title} description={project.data.description}>
```

### WR-03: Restored chat user messages use old rounded bubble style, live messages use editorial flat style

**File:** `src/scripts/chat.ts:541`
**Issue:** The `createUserMessageEl` function (line 251) renders user bubbles with `border-radius: 0` (matching the Phase 10 editorial flat-rectangle design from D-15). However, the localStorage restoration path (line 541) hardcodes `border-radius: 12px 12px 4px 12px` -- the old v1.0 rounded bubble style. When a user returns to the site and chat history is restored from localStorage, their previous messages will have rounded corners while new messages will be flat rectangles, creating a visible style mismatch within the same conversation.
**Fix:**
```typescript
// line 541: match createUserMessageEl's border-radius: 0
el.style.cssText = "max-width: 85%; background: var(--rule); border-radius: 0; padding: 8px 16px; color: var(--ink); font-size: 1rem; word-break: break-word;";
```

## Info

### IN-01: Copy button rendering inconsistency between live and restored bot messages

**File:** `src/scripts/chat.ts:302` vs `src/scripts/chat.ts:554-555`
**Issue:** Live bot messages (via `createBotMessageEl`) render the copy button as an SVG clipboard icon (line 302). Restored bot messages from localStorage render the copy button as a text label "COPY" with `label-mono` class (line 554-555). While both are functional, the visual presentation differs between the two code paths. Consider extracting a shared `createCopyButton(content)` helper to ensure identical rendering.
**Fix:** Extract copy button creation into a shared helper function used by both `createBotMessageEl` and the restoration loop.

### IN-02: console.log in analytics tracking function

**File:** `src/scripts/chat.ts:376`
**Issue:** The `trackChatEvent` function includes `console.log` output guarded by `import.meta.env.DEV`. This is intentional for dev debugging and correctly gated behind the DEV check, so it will not appear in production builds. Noting for completeness -- no action needed.
**Fix:** No action required. The DEV guard correctly strips this in production.

### IN-03: Projects page count shows redundant "N / N" format

**File:** `src/pages/projects.astro:21`
**Issue:** The SectionHeader count prop is ``${projects.length} / ${projects.length}`` which always renders as "6 / 6" -- the same number on both sides. On the homepage, this pattern makes sense ("3 / 6" = featured / total). On the all-projects page it provides no information. Consider omitting the count or showing just the total.
**Fix:**
```astro
<!-- Option A: just the count -->
count={`${projects.length}`}
<!-- Option B: omit entirely -->
<!-- remove count prop -->
```

---

_Reviewed: 2026-04-13T17:10:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
