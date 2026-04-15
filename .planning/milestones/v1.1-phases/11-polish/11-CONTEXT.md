# Phase 11: Polish - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 11 delivers the **quality verification and cleanup sweep** that confirms the editorial redesign meets every v1.0 quality bar. The phase has three workstreams:

1. **Audit & fix** — Run Lighthouse CLI audits (homepage + 1 project detail), verify WCAG AA contrast on all text/background combinations, tab-through every page for keyboard accessibility, and test responsive layouts at 4 breakpoints (375, 768, 1024, 1440). Fix any issues found to meet thresholds.
2. **Deferred tech debt cleanup** — Fix lightning-css warnings, clean up BaseLayout noindex pattern, investigate Phase 9 TS hints, delete `mockup.html` and `/dev/primitives` preview page.
3. **Milestone closeout** — Merge `feat/ui-redesign` to `main`, deploy to Cloudflare Pages, update all project documentation (PROJECT.md, CLAUDE.md, REQUIREMENTS.md, STATE.md).

After Phase 11, the v1.1 Editorial Redesign milestone is complete and the site is live at jackcutrara.com with the new editorial design.

</domain>

<decisions>
## Implementation Decisions

### Audit artifacts (how to capture results)

- **D-01:** Lighthouse audits captured as **CLI JSON reports + markdown summary**. Run `lighthouse` CLI against homepage and one project detail page. JSON files checked into the phase directory. Markdown summary extracts key metrics (Performance, Accessibility, Best Practices, SEO scores, LCP, CLS) with pass/fail per QUAL requirement.
- **D-02:** Lighthouse audits run on **homepage + 1 project detail page only** — matches SC#1 exactly. Not all 5 pages.
- **D-03:** Responsive QA documented as a **markdown table** — breakpoints (375, 768, 1024, 1440) as columns, pages as rows, pass/fail + notes per cell.
- **D-04:** WCAG AA contrast verification documented as a **contrast table in the audit file** — each text/background combination listed with hex values, computed ratio, and pass/fail. Body text on `#FAFAF7`, muted text (`#52525B`, `#A1A1AA`) on `#FAFAF7`, accent links (`#E63946`), status labels.

### Deferred tech debt cleanup

- **D-05:** **Fix lightning-css warnings** — grep `src/` for literal `var(--token-*)` and `var(--token-text-*)` strings that trigger 4x "Unexpected token Delim('*')" warnings. Remove or escape the offending strings. Build should be warning-free after.
- **D-06:** **Fix BaseLayout noindex pattern** — add an optional `noindex` prop to `BaseLayout.astro` that conditionally emits `<meta name="robots" content="noindex, nofollow">`. Replaces the slot-based injection workaround from Phase 9. Cleaner API for dev pages (though `/dev/primitives` is being deleted in this phase anyway — the prop is a forward-compatible improvement).
- **D-07:** **Investigate and fix JsonLd `is:inline` advisory + Container Props `ts(6196)` hint** if they're trivial one-liners. Skip if they require architectural changes. These were advisory notes from Phase 9 verification, not blocking issues.

### Fix depth (how aggressively to fix)

- **D-08:** Lighthouse target is **≥90 on all 4 categories**, stop there. No diminishing-returns chasing past the threshold. This is a portfolio — 90+ signals competence; 98 vs 92 doesn't move the needle.
- **D-09:** LCP < 2s and CLS < 0.1 are hard requirements per QUAL-02. If either fails, fix until they pass.
- **D-10:** Responsive issues: **fix all visible issues**. If it looks broken or janky at any of the 4 breakpoints, fix it. The portfolio must look polished at every width — this is what recruiters see.

### Keyboard accessibility

- **D-11:** Tab-through audit covers **every page** (homepage, about, projects index, project detail, contact) plus the chat widget open state. Document every interactive element's focus visibility.
- **D-12:** Focus ring styling must **match the editorial system** — use `--ink` or `--accent` tokens. If the default browser outline clashes with the warm off-white `#FAFAF7` palette, restyle it. Focus rings should look intentional, not accidental.

### mockup.html parity sign-off

- **D-13:** **Trust Phase 10 verification + quick eyeball** during responsive QA. Phase 10 already verified visual parity at 1440px and 375px as part of its manual gate (SC#8 in Phase 10 verification). No formal side-by-side comparison needed — just a sanity check during the responsive sweep, then delete.

### Chat widget regression

- **D-14:** **Same smoke test as Phase 9/10 gates** — open chat, send a message, verify SSE streaming, focus trap works, copy button works, persistence across navigation (send → navigate → reopen → see history). No extended testing unless Phase 11 changes touch chat code.

### Artifact cleanup

- **D-15:** Delete `mockup.html` from repo root after parity eyeball (D-13).
- **D-16:** Delete `/dev/primitives` preview page (`src/pages/dev/primitives.astro` and `src/pages/dev/` directory if empty after).

### Milestone closeout

- **D-17:** **Merge `feat/ui-redesign` to `main`** after all QUAL requirements pass and sign-off is complete.
- **D-18:** **Deploy to Cloudflare Pages** — the editorial site goes live at jackcutrara.com.
- **D-19:** Update **PROJECT.md** — Current State, validate requirements, log Phase 11 key decisions.
- **D-20:** Update **CLAUDE.md** Technology Stack section — reflect actual v1.1 stack (Geist fonts, no GSAP, no dark mode, editorial design system).
- **D-21:** Update **REQUIREMENTS.md** traceability — mark QUAL-01..06 as complete.
- **D-22:** Update **STATE.md** — record milestone v1.1 as complete, clear current position.

### Claude's Discretion

- `prefers-reduced-motion` verification approach (QUAL-04) — trivially satisfied since there is effectively no motion to reduce; Claude documents the verification note
- Specific Lighthouse CLI flags and configuration
- Order of operations within the audit sweep
- Whether to create separate plans for audit vs. cleanup vs. closeout or combine them

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design system
- `design-system/MASTER.md` — The locked v1.1 design contract. Tokens, typography, layout, components, motion rules, accent usage, anti-patterns. All quality checks validate against this spec.

### Requirements & project
- `.planning/REQUIREMENTS.md` — QUAL-01..06 acceptance criteria (the requirements this phase delivers)
- `.planning/PROJECT.md` — Current state, constraints, key decisions
- `.planning/ROADMAP.md` — Phase 11 success criteria (8 items)

### Prior phase context
- `.planning/phases/08-foundation/08-CONTEXT.md` — Foundation decisions (tokens, fonts, motion kill scope)
- `.planning/phases/09-primitives/09-CONTEXT.md` — Primitives decisions (component library, noindex pattern, deferred items)
- `.planning/phases/10-page-port/10-CONTEXT.md` — Page port decisions (editorial layouts, chat restyle, contact section)

### Deferred items
- `.planning/phases/09-primitives/deferred-items.md` — lightning-css warnings details and likely source
- `.planning/phases/09-primitives/09-08-verification-gate-SUMMARY.md` — Phase 9 verification backlog (JsonLd, Container Props, noindex, mockup.html)

### Reference artifacts
- `mockup.html` — Visual reference (to be deleted after parity sign-off in this phase)
- `src/pages/dev/primitives.astro` — Preview page (to be deleted in this phase)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/primitives/` — 8 editorial primitives (Header, Footer, Container, SectionHeader, WorkRow, MetaLabel, StatusDot, MobileMenu) — focus ring audit targets
- `src/components/chat/ChatWidget.astro` — Chat widget with focus trap, streaming, persistence — regression gate target
- `src/components/ContactSection.astro` — Shared contact section (homepage + /contact) — interactive links to audit
- `src/layouts/BaseLayout.astro` — Layout shell with `<slot name="head" />` for noindex injection — D-06 cleanup target

### Established Patterns
- Phase 9/10 regression gate pattern: build succeeds + chat smoke test + manual visual check
- Editorial design tokens in `src/styles/global.css`: `--bg`, `--ink`, `--ink-muted`, `--ink-faint`, `--rule`, `--accent`
- Scoped styles in primitives (not Tailwind utilities) per Phase 9 D-03
- Container query on Header for mobile menu visibility (Phase 9 D-06)

### Integration Points
- `BaseLayout.astro` — noindex prop addition (D-06)
- `src/styles/global.css` — potential focus ring styling, lightning-css warning source
- `astro.config.mjs` — Lighthouse CLI may need dev server or build output
- Cloudflare Pages — deployment target for D-18

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches within the decisions above.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 11-polish*
*Context gathered: 2026-04-13*
