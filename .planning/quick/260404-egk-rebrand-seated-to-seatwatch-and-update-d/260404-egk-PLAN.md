---
phase: quick
plan: 260404-egk
type: execute
wave: 1
depends_on: []
files_modified:
  - src/content/projects/seatwatch.mdx
  - Projects/1 - SEATWATCH.md
autonomous: true
requirements: [rebrand-seated-seatwatch, add-demourl]

must_haves:
  truths:
    - "Project displays as 'SeatWatch' (not 'Seated') on the projects listing page and project detail page"
    - "The project URL is /projects/seatwatch (not /projects/seated)"
    - "The project detail page shows a 'Live Demo' link pointing to https://seat.watch"
    - "All body text references use 'SeatWatch' instead of 'Seated'"
  artifacts:
    - path: "src/content/projects/seatwatch.mdx"
      provides: "Rebranded project content with SeatWatch name and seat.watch demoUrl"
      contains: "title: \"SeatWatch\""
    - path: "Projects/1 - SEATWATCH.md"
      provides: "Renamed untracked reference file with SeatWatch branding"
      contains: "# SeatWatch"
  key_links:
    - from: "src/content/projects/seatwatch.mdx"
      to: "src/pages/projects/[id].astro"
      via: "Astro glob loader derives project.id from filename — seatwatch.mdx produces id 'seatwatch'"
      pattern: "seatwatch"
    - from: "src/content/projects/seatwatch.mdx frontmatter demoUrl"
      to: "src/pages/projects/[id].astro lines 100-121"
      via: "demoUrl field renders 'Live Demo' link when present"
      pattern: "demoUrl.*seat\\.watch"
---

<objective>
Rebrand the "Seated" project to "SeatWatch" across all content files and add the new domain as a live demo link.

Purpose: The project has been renamed from Seated to SeatWatch with a new domain (seat.watch). The portfolio must reflect the current branding.
Output: Renamed MDX content file with updated title, body text, and demoUrl; renamed reference file with updated content.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/quick/260404-egk-rebrand-seated-to-seatwatch-and-update-d/260404-egk-CONTEXT.md
@.planning/quick/260404-egk-rebrand-seated-to-seatwatch-and-update-d/260404-egk-RESEARCH.md

<interfaces>
<!-- Astro glob loader in content.config.ts derives project.id from filename -->
<!-- No hardcoded slugs exist — renaming the file automatically updates all routes -->

From src/content.config.ts:
```typescript
loader: glob({ pattern: "**/*.mdx", base: "./src/content/projects" })
// demoUrl: z.string().url().optional()
```

From src/pages/projects/[id].astro:
```typescript
// Line 15: params: { id: project.id }  — generates /projects/{filename}
// Lines 100-121: Renders "Live Demo" link when demoUrl is present
// Lines 43-47: JSON-LD overrides url with demoUrl when present
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Rename and update seated.mdx to seatwatch.mdx</name>
  <files>src/content/projects/seated.mdx, src/content/projects/seatwatch.mdx</files>
  <action>
1. Rename `src/content/projects/seated.mdx` to `src/content/projects/seatwatch.mdx` using `git mv` so git tracks the rename.

2. In the renamed `seatwatch.mdx`, update frontmatter:
   - Change `title: "Seated"` to `title: "SeatWatch"` (line 2)
   - Add `demoUrl: "https://seat.watch"` as a new frontmatter field (add after the `order: 1` line, before the closing `---`)

3. In the body text, replace exactly 2 occurrences of "Seated" with "SeatWatch":
   - Line 28: "I architected Seated as a Turborepo" -> "I architected SeatWatch as a Turborepo"
   - Line 54: "Seated handles approximately fifty" -> "SeatWatch handles approximately fifty"

4. Do NOT modify the tagline or description — they do not contain "Seated" and must remain as-is per user decision.

Casing rule: The canonical display form is "SeatWatch" (capital S, capital W). The filename/slug is all-lowercase `seatwatch`.
  </action>
  <verify>
    <automated>rtk grep -r -i "seated" src/content/projects/ && echo "FAIL: seated references still exist" || echo "PASS: no seated references in content"; test -f src/content/projects/seatwatch.mdx && echo "PASS: seatwatch.mdx exists" || echo "FAIL: seatwatch.mdx missing"; rtk grep "demoUrl" src/content/projects/seatwatch.mdx && echo "PASS: demoUrl present" || echo "FAIL: demoUrl missing"</automated>
  </verify>
  <done>
- File renamed from seated.mdx to seatwatch.mdx (git-tracked rename)
- Title in frontmatter reads "SeatWatch"
- demoUrl field set to "https://seat.watch"
- Both body text occurrences updated to "SeatWatch"
- No occurrences of "Seated" remain in the file
- Tagline and description unchanged
  </done>
</task>

<task type="auto">
  <name>Task 2: Rename and update reference file Projects/1 - SEATED.md</name>
  <files>Projects/1 - SEATED.md, Projects/1 - SEATWATCH.md</files>
  <action>
1. Rename `Projects/1 - SEATED.md` to `Projects/1 - SEATWATCH.md`. This file is untracked, so use a plain `mv` (not git mv).

2. In the renamed file, update these occurrences:
   - Line 1: `# Seated` -> `# SeatWatch`
   - Line 5: "Seated monitors a third-party" -> "SeatWatch monitors a third-party"
   - Line 294 (project structure section): `seated/` -> `seatwatch/`

3. Do NOT modify any other content in this file — it is a reference document describing the project's technical details.

Casing rule: Use "SeatWatch" (capital S, capital W) in all display/prose contexts.
  </action>
  <verify>
    <automated>rtk grep -r -i "seated" Projects/ && echo "FAIL: seated references still exist in Projects/" || echo "PASS: no seated references in Projects/"; test -f "Projects/1 - SEATWATCH.md" && echo "PASS: SEATWATCH.md exists" || echo "FAIL: SEATWATCH.md missing"; test ! -f "Projects/1 - SEATED.md" && echo "PASS: old SEATED.md removed" || echo "FAIL: old SEATED.md still exists"</automated>
  </verify>
  <done>
- File renamed from "1 - SEATED.md" to "1 - SEATWATCH.md"
- Heading updated to "# SeatWatch"
- Body text reference updated to "SeatWatch monitors..."
- Directory reference updated from "seated/" to "seatwatch/"
- No occurrences of "Seated" or "SEATED" remain in the file
  </done>
</task>

</tasks>

<verification>
1. Run `rtk grep -r -i "seated" src/ Projects/` — must return zero matches
2. Confirm `src/content/projects/seatwatch.mdx` exists with correct frontmatter (title: "SeatWatch", demoUrl: "https://seat.watch")
3. Confirm `Projects/1 - SEATWATCH.md` exists with heading "# SeatWatch"
4. Run `rtk next build` — build must succeed (Astro content layer re-indexes on build and will validate the renamed file against the Zod schema)
</verification>

<success_criteria>
- Zero occurrences of "Seated", "seated", or "SEATED" remain in any content file
- Project renders as "SeatWatch" on the site
- URL resolves to /projects/seatwatch (automatic via filename-based slug)
- "Live Demo" link appears on project detail page pointing to https://seat.watch
- Build passes without errors
</success_criteria>

<output>
After completion, create `.planning/quick/260404-egk-rebrand-seated-to-seatwatch-and-update-d/260404-egk-SUMMARY.md`
</output>
