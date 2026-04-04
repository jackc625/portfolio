# Quick Task: Rebrand Seated to SeatWatch - Research

**Researched:** 2026-04-04
**Domain:** Astro content collection rename + text rebrand
**Confidence:** HIGH

## Summary

This is a straightforward content rename affecting exactly 2 source files. The Astro 6 glob loader derives `project.id` from the MDX filename, so renaming `seated.mdx` to `seatwatch.mdx` automatically updates all dynamic routes (`/projects/seated` becomes `/projects/seatwatch`) with zero code changes to components or pages. No images, no hardcoded slug references, and no external domain references exist in the codebase.

**Primary recommendation:** Rename the file, update the frontmatter title, swap "Seated" for "SeatWatch" in body text, add `demoUrl`, rename the untracked reference file. That is the complete scope.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Rename `seated.mdx` to `seatwatch.mdx` -- URL changes from `/projects/seated` to `/projects/seatwatch`
- Also rename `Projects/1 - SEATED.md` reference file
- Keep current tagline and description text as-is -- only swap "Seated" to "SeatWatch" where the project name appears
- Do NOT rewrite tagline or description copy
- Add `seat.watch` as `demoUrl` in frontmatter: `demoUrl: "https://seat.watch"`

### Claude's Discretion
- Handle casing variations (Seated, seated, SEATED) appropriately per context
- `Projects/1 - SEATED.md` is untracked -- rename it for consistency

### Deferred Ideas (OUT OF SCOPE)
None specified.
</user_constraints>

## Codebase Audit: "Seated" References

Complete grep of the repository for `(?i)seated`:

| File | Occurrences | What Needs Changing |
|------|-------------|---------------------|
| `src/content/projects/seated.mdx` | 5 | Rename file, update `title` frontmatter, replace 3 body text instances |
| `Projects/1 - SEATED.md` | 3 | Rename file to `1 - SEATWATCH.md`, update heading and body references |

**No references found in:**
- Components (`ProjectCard.astro`, `FeaturedProjectItem.astro`, `NextProject.astro`)
- Pages (`projects.astro`, `[id].astro`, `index.astro`)
- Layouts, configs, or any other source files
- Public assets directory
- `astro.config.mjs` or `content.config.ts`

**Image assets:** No `seated`-named images exist in `src/assets/` or `public/`. The project has no `thumbnail` set in frontmatter.

**Old domain `getseated.app`:** Confirmed absent from entire codebase (verified via grep).

## Slug Derivation in Astro 6

The content config uses the glob loader:

```typescript
loader: glob({ pattern: "**/*.mdx", base: "./src/content/projects" })
```

With this loader, `project.id` is derived from the filename without extension. Renaming `seated.mdx` to `seatwatch.mdx` changes `project.id` from `"seated"` to `"seatwatch"`. All components use `project.id` dynamically:

- `[id].astro` line 15: `params: { id: project.id }` -- generates `/projects/seatwatch`
- `ProjectCard.astro` line 13: `` href={`/projects/${project.id}`} ``
- `FeaturedProjectItem.astro` line 12: `` href={`/projects/${slug}`} `` (slug passed as `project.id`)
- `NextProject.astro` line 13: `` href={`/projects/${project.id}`} ``
- JSON-LD in `[id].astro` line 32: `` url: `https://jackcutrara.com/projects/${project.id}` ``

**No hardcoded slugs anywhere.** The rename is fully automatic via the filename.

Confidence: HIGH -- verified by reading every component that renders project links.

## demoUrl Rendering

The `demoUrl` field is already wired end-to-end:

1. **Schema** (`content.config.ts` line 16): `demoUrl: z.string().url().optional()`
2. **Case study page** (`[id].astro` lines 100-121): Renders a "Live Demo" link when `demoUrl` is present
3. **JSON-LD** (`[id].astro` lines 43-47): Overrides the `url` field with `demoUrl` when present

Adding `demoUrl: "https://seat.watch"` to frontmatter will immediately render a "Live Demo" link on the project page with no code changes.

## Exact Changes Required

### File 1: `src/content/projects/seated.mdx` (rename to `seatwatch.mdx`)

Frontmatter changes:
- `title: "Seated"` --> `title: "SeatWatch"`
- Add: `demoUrl: "https://seat.watch"`

Body text replacements (3 occurrences):
- Line 28: "I architected Seated as a Turborepo..." --> "I architected SeatWatch as a Turborepo..."
- Line 54: "Seated handles approximately fifty..." --> "SeatWatch handles approximately fifty..."
- (No other body occurrences)

Tagline and description: Keep as-is per user decision (they do not contain the word "Seated").

### File 2: `Projects/1 - SEATED.md` (rename to `1 - SEATWATCH.md`)

This is an untracked reference file. Changes:
- Filename: `1 - SEATED.md` --> `1 - SEATWATCH.md`
- Line 1 heading: `# Seated` --> `# SeatWatch`
- Line 3 body: "Seated monitors a third-party..." --> "SeatWatch monitors a third-party..."
- Line 294 directory reference: `seated/` --> `seatwatch/` (if present)

## Common Pitfalls

### Pitfall 1: Forgetting the Astro content cache
**What goes wrong:** After renaming the MDX file, the dev server may still serve the old `/projects/seated` route from cache.
**How to avoid:** Restart the dev server after the rename. Astro's content layer will re-index on startup.

### Pitfall 2: Case sensitivity in "SeatWatch"
**What goes wrong:** Inconsistent casing (Seatwatch vs SeatWatch vs seatWatch).
**How to avoid:** The canonical form is "SeatWatch" (capital S, capital W) in all display contexts. The filename/slug uses all-lowercase `seatwatch`.

## Sources

### Primary (HIGH confidence)
- Direct codebase grep and file reads -- all findings verified against source files
- `src/content.config.ts` -- schema definition for demoUrl field
- `src/pages/projects/[id].astro` -- dynamic route and demoUrl rendering logic
- Astro 6 glob loader documentation -- slug derived from filename (verified in project's own config)
