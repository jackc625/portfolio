# Quick Task 260404-egk: Rebrand Seated to SeatWatch - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Task Boundary

Rebrand the project "Seated" to "SeatWatch" across the portfolio site. Update all occurrences of the name, rename the content file, and add the new domain.

</domain>

<decisions>
## Implementation Decisions

### File & Slug Renaming
- Rename `seated.mdx` to `seatwatch.mdx` — URL changes from `/projects/seated` to `/projects/seatwatch`
- Also rename `Projects/1 - SEATED.md` reference file if appropriate

### Tagline & Description
- Keep current tagline and description text as-is — only swap "Seated" → "SeatWatch" where the project name appears
- Do NOT rewrite tagline or description copy

### Live URL / Link Addition
- Add `seat.watch` as a `demoUrl` in the frontmatter (schema already supports `demoUrl: z.string().url().optional()`)
- Format: `demoUrl: "https://seat.watch"`

### Claude's Discretion
- Handle casing variations (Seated, seated, SEATED) appropriately per context
- `Projects/1 - SEATED.md` is untracked — rename it for consistency

</decisions>

<specifics>
## Specific Ideas

- Old domain `getseated.app` does NOT appear anywhere in codebase (confirmed via grep)
- Only 2 files contain "Seated": `src/content/projects/seated.mdx` and `Projects/1 - SEATED.md`
- Body text references like "I architected Seated as..." should become "I architected SeatWatch as..."

</specifics>

<canonical_refs>
## Canonical References

- Content schema: `src/content.config.ts` — defines `demoUrl` field as `z.string().url().optional()`

</canonical_refs>
