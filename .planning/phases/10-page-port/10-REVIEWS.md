---
phase: 10
reviewers: [gemini, codex]
reviewed_at: 2026-04-12T12:00:00Z
plans_reviewed: [10-01-PLAN.md, 10-02-PLAN.md, 10-03-PLAN.md, 10-04-PLAN.md, 10-05-PLAN.md, 10-06-PLAN.md, 10-07-PLAN.md]
---

# Cross-AI Plan Review -- Phase 10

## Gemini Review

### Summary
The Phase 10 plan is a comprehensive and well-sequenced strategy to transition the portfolio from its v1.0 "card-based" design to a v1.1 "editorial-first" aesthetic. It logically separates the foundational data/schema updates (Wave 1-2) from the visual porting of pages (Wave 3) and the more complex behavioral updates to the Chat system (Wave 4-5). The use of centralized data files (`contact.ts`, `about.ts`) is a professional touch that ensures consistency across the Homepage, About page, and Contact page while simplifying future maintenance.

### Strengths
- **Clear Dependency Chain:** The waves are ordered to ensure that components always have the data they need before they are rendered.
- **Source of Truth (SoT) Architecture:** Moving copy and contact details into dedicated TypeScript files prevents "stale" content across different pages.
- **Strict Verification Gate:** Including manual "Human-UAT" for the Chat persistence and visual parity ensures that subtle UX regressions (like focus traps or layout shifts) are caught.
- **Resilient Chat Restyle:** Explicitly calling out the preservation of 11 element IDs in Plan 05 demonstrates an understanding of the tight coupling between the existing `chat.ts` logic and the DOM.
- **Security Awareness:** Using `DOMPurify` for replaying stored chat messages and `textContent` for user-generated content addresses XSS risks inherent in `localStorage` persistence.

### Concerns
- **MDX Scoped Style Collisions (MEDIUM):** Plan 04 relies on `:global()` overrides for MDX body tags. Astro's scoped CSS can sometimes be tricky with MDX-generated content depending on how the wrapper is implemented.
- **Chat Replay Performance (LOW):** Replaying up to 50 messages from `localStorage` on page load/panel open could cause a brief "flash of empty chat" or a slight layout jank if the DOM injection isn't handled efficiently.
- **Zod Schema Strictness (LOW):** The regex `^\d{4}$` for the `year` field is excellent, but Plan 01 assumes the user (Jack) will provide all values immediately. If any project is missing a year, the build will fail due to the schema change.
- **XSS via LocalStorage (MEDIUM):** While `DOMPurify` is planned for the bot messages, any direct injection of stored strings into the DOM is a risk. Ensure `DOMPurify` is configured strictly, especially since bot messages often contain Markdown/HTML.

### Suggestions
- **Chat Loading State:** In Plan 06, consider adding a brief "loading" state or using a `DocumentFragment` to batch the 50-message injection to avoid multiple layout repaints.
- **MDX Wrapper Class:** Instead of relying solely on `:global(h2)`, use a specific utility class like `.prose-editorial` on the wrapper and target children. This makes the intent clearer and avoids global CSS pollution.
- **Schema Default:** Consider allowing `year: z.string().regex(/^\d{4}$/).optional()` or providing a fallback value during the Wave 1 backfill to prevent build breakage if a file is missed.
- **CSS Variable for Typing Dots:** For the `typing-bounce` animation in Plan 05, use CSS variables for the delay and color to keep the "Editorial" theme easily adjustable.
- **Download Attribute Verification:** In Plan 02, ensure the resume link actually has a valid `href` pointing to the public folder version of the PDF.

### Risk Assessment
**LOW-MEDIUM** -- The majority of the plan involves "porting" existing content into new containers, which is a low-logic, high-visibility task. The Chat Widget persistence (Plan 06) introduces new state management logic and security considerations (XSS), and the visual restyle of the chat has the potential to break the existing SSE integration if IDs or container structures are altered too aggressively.

---

## Codex Review

### Plan 01: Docs Amendments + Content Schema + Shiki Theme

**Summary:** Strong foundation wave with correct dependency placement. Handles the schema change early, aligns docs with locked decisions, and sets up syntax-highlighting before page ports depend on it. Main risk is the year backfill and Shiki theme swap are assumed trivial but both can introduce build-breaking regressions.

**Strengths:**
- Starts with contract/documentation updates before implementation, matching D-31
- Puts the `year` schema change early, correctly unblocking downstream templates
- Explicitly backfills all 6 MDX files, avoiding a schema migration gap
- Keeps scope narrow and phase-aligned

**Concerns:**
- MEDIUM: "Jack supplies values" is an external dependency; wave is not self-contained
- MEDIUM: No explicit validation that all content collection entries pass the new schema
- MEDIUM: Shiki theme change may affect existing MDX/code styling globally without visual regression checks
- LOW: Docs amendments don't mention keeping requirement wording synchronized beyond X/resume changes

**Risk Assessment:** MEDIUM

### Plan 02: Data Files + ContactSection Composite + Footer/MobileMenu Refactor

**Summary:** Clean consolidation wave that improves maintainability without over-engineering. Centralizing contact and about copy into data files fits locked decisions. Main issues are around hidden coupling from deleting ContactChannel.astro and refactoring shared primitives.

**Strengths:**
- Establishes single source of truth for contact data (D-23 through D-29)
- Separates editorial copy from page templates
- Introduces reusable ContactSection composite where reuse is justified
- Avoids unnecessary abstraction on work lists (D-01)

**Concerns:**
- MEDIUM: Deleting ContactChannel.astro may break imports if not fully audited
- MEDIUM: contact.ts shape is underspecified; link labels, URLs, and resume asset path conventions not described
- MEDIUM: ContactSection showSectionHeader prop ownership of heading levels not defined
- LOW: No guardrails for ABOUT-02 paragraph length requirement
- LOW: No explicit statement that x:null must never render

**Risk Assessment:** LOW-MEDIUM

### Plan 03: Homepage + About + Contact Page Rewrites

**Summary:** Directionally correct, maps well to requirements, but is the first wave where implementation detail matters enough that omissions can undermine mockup parity. Biggest risk is focusing on layout composition without explicitly defining data selection rules, accessibility behavior, or responsive content constraints.

**Strengths:**
- Covers all three page rewrites in a coherent batch
- Homepage structure maps directly to Phase 10 success criteria
- Uses Phase 9 primitives instead of inventing new abstractions
- Correctly reuses ContactSection

**Concerns:**
- HIGH: Homepage plan says "3 featured WorkRows" but does not define selection rule (D-02)
- MEDIUM: No explicit mention of rendering real content collection data for homepage
- MEDIUM: About page uses 4 paragraphs from about.ts vs requirement of intro + 3 paragraphs; mapping must be exact
- MEDIUM: Contact page may accidentally duplicate headings
- MEDIUM: No accessibility notes for hero semantics, heading hierarchy, or landmarks

**Risk Assessment:** MEDIUM

### Plan 04: Projects Index + Project Detail Rewrites

**Summary:** Most important content-rendering wave and generally the best-specified plan in the set. Addresses core work pages, uses content collection properly, includes project-detail rendering concerns. Biggest risks are content-order assumptions and broad MDX style overrides.

**Strengths:**
- Directly addresses WORK-01 through WORK-03
- Uses getStaticPaths and render() in the correct Astro/MDX model
- Includes next-project wrap-around behavior explicitly
- Metadata/header/body split aligned with D-05 through D-14
- ArticleImage integration via MDX components map

**Concerns:**
- HIGH: Sorting rule is "sorted by order" but if schema/order assumptions are inconsistent across pages, homepage and /projects can diverge
- MEDIUM: No explicit handling for malformed or missing frontmatter fields beyond year
- MEDIUM: next-project wrap-around needs deterministic ordering
- MEDIUM: Broad :global() MDX overrides can unintentionally affect nested components
- MEDIUM: External links row absence cases not defined; empty wrappers possible

**Risk Assessment:** MEDIUM

### Plan 05: Chat Widget Visual Restyle

**Summary:** Disciplined visual-restyle plan that correctly treats chat behavior preservation as the main constraint. Preserving element IDs and keeping work in CSS/template layers is the right instinct. Main risk is that even small markup/class changes can silently break Phase 7 behavior.

**Strengths:**
- Explicitly preserves all 11 element IDs
- Matches locked design decisions closely
- Keeps visual changes mostly in ChatWidget.astro and global.css
- Updates privacy note alongside UI change

**Concerns:**
- HIGH: "All 11 element IDs preserved" is necessary but not sufficient; class, DOM hierarchy, button types, and aria/state hooks may also matter to chat.ts
- MEDIUM: Rewriting global .chat-* block can create site-wide collisions
- MEDIUM: No focus management, keyboard interaction, or contrast checks after visual simplification
- MEDIUM: Mobile full-screen restyle can break safe-area behavior or body-scroll locking

**Risk Assessment:** MEDIUM

### Plan 06: Chat localStorage Persistence + JsonLd Update

**Summary:** Thoughtful about XSS by replaying bot messages through existing sanitized markdown path. Highest risk is lifecycle correctness: persistence tied to panel-open replay can produce duplication, stale TTL behavior, or partial-history bugs.

**Strengths:**
- Persistence design matches D-22: localStorage, 50-message cap, 24h TTL
- Security posture is mostly sound: user content via textContent, bot content through sanitize path
- Hooks save on both user-send and bot-complete

**Concerns:**
- HIGH: Replay-on-panel-open can duplicate messages if panel opened multiple times without hydration guard
- HIGH: Persistence model underspecified for interrupted SSE streams; partial bot messages may be saved incorrectly
- MEDIUM: No explicit handling for localStorage unavailability, quota errors, or private-browsing failures
- MEDIUM: No schema versioning for stored payloads
- MEDIUM: JsonLd update depends on contact.ts; dependency on Plan 02 should be explicit, not only Plan 05

**Risk Assessment:** MEDIUM-HIGH

### Plan 07: Verification Gate

**Summary:** Correct final gate aligned with D-32, but more of a checklist than a verification plan. Does not specify pass/fail expectations for the highest-risk behaviors introduced in Phase 10.

**Strengths:**
- Correctly defers verification until all implementation waves complete
- Includes both automated and manual checks

**Concerns:**
- HIGH: No explicit validation that all 6 project detail routes build and render without errors
- MEDIUM: Manual chat smoke checklist omits repeated open/close cycles and restore-after-refresh
- MEDIUM: Visual parity check underspecified; no page list and criteria
- MEDIUM: No explicit check that homepage shows exactly 3 featured items and /projects shows all 6

**Risk Assessment:** MEDIUM

### Overall Codex Assessment

**MEDIUM** -- The sequence is coherent and likely to achieve Phase 10, but there are enough underspecified behavioral and verification details that regressions are plausible unless contracts are tightened before implementation.

---

## Consensus Summary

### Agreed Strengths
- **Well-sequenced wave dependency chain** -- Both reviewers praised the docs-first, data-second, pages-third, chat-last ordering (Gemini: "Clear Dependency Chain"; Codex: "dependency placement is mostly correct")
- **Single source of truth architecture** -- Both highlighted contact.ts and about.ts as good patterns for preventing content drift
- **Chat element ID preservation** -- Both recognized the explicit 11-ID preservation contract as critical for chat.ts compatibility
- **DOMPurify sanitization for localStorage replay** -- Both called out the security-aware replay path as a strength
- **Appropriate scope control** -- Neither reviewer flagged over-engineering; both noted the plans avoid unnecessary abstractions

### Agreed Concerns
- **Chat persistence lifecycle edge cases (HIGH)** -- Both flagged risks around message duplication on repeated panel opens (Codex: "replay-on-panel-open can duplicate messages"; Gemini: implied via "chat replay performance"). Codex also flagged interrupted SSE streams and partial bot messages.
- **Chat restyle DOM contract broader than IDs alone (HIGH)** -- Both noted that preserving IDs is necessary but not sufficient. Class names, DOM hierarchy, aria attributes, and event targets also matter to chat.ts.
- **MDX scoped style bleed via :global() (MEDIUM)** -- Both flagged that broad :global() overrides in the MDX body wrapper could affect other components or future embeds.
- **Underspecified featured-project selection rule (MEDIUM-HIGH)** -- Codex flagged this as HIGH for Plan 03; the rule is actually defined in D-02 and CONTEXT.md but the plan text should reference it explicitly.
- **Verification gate lacks specific assertions (MEDIUM)** -- Both noted Plan 07 is a checklist rather than a concrete test plan (Codex: "no explicit check that homepage shows exactly 3 featured items"; Gemini: "visual parity check is sanity, not Lighthouse").
- **localStorage failure handling (MEDIUM)** -- Both flagged that private browsing, quota exceeded, and disabled localStorage scenarios need try/catch (Gemini: "access any file directly"; Codex: "no explicit handling for localStorage unavailability").

### Divergent Views
- **Schema strictness** -- Gemini suggested making `year` optional with a fallback; Codex treated the strict schema as correct but wanted validation after backfill. The locked decision D-03 specifies required, so Codex's position aligns better with the design contract.
- **Plan 06 dependency graph** -- Codex flagged that Plan 06's JsonLd update depends on Plan 02's contact.ts (not just Plan 05). Gemini did not mention this. Codex is correct -- the dependency chain in the frontmatter should be [02, 05], not just [05].
- **Privacy note timing** -- Codex noted the privacy note changes in Plan 05 (before persistence ships in Plan 06), creating a temporary mismatch. Gemini did not flag this. This is worth noting but acceptable since the plans execute sequentially in one session.
- **Risk severity** -- Gemini rated overall as LOW-MEDIUM; Codex rated overall as MEDIUM. The difference reflects Codex's deeper attention to chat persistence lifecycle edge cases.
