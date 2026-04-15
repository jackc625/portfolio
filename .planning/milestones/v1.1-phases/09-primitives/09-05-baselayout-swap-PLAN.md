---
phase: 09-primitives
plan: 05
type: execute
wave: 5
depends_on: [09-04]
files_modified:
  - src/layouts/BaseLayout.astro
  - src/components/Header.astro
  - src/components/Footer.astro
  - src/components/MobileMenu.astro
autonomous: true
requirements: []

must_haves:
  truths:
    - "BaseLayout.astro imports Header, Footer, and MobileMenu from src/components/primitives/ — not from src/components/"
    - "Old src/components/Header.astro, src/components/Footer.astro, and src/components/MobileMenu.astro are deleted from the working tree"
    - "Stub pages render the new editorial chrome (Header + MobileMenu + Footer) when visited at any route"
    - "ChatWidget import and render is untouched — chat still functions after the swap (D-26 regression gate)"
    - "pnpm run build succeeds with the new primitives wired into BaseLayout"
  artifacts:
    - path: src/layouts/BaseLayout.astro
      provides: Wires new primitives into the app shell
      contains: "../components/primitives/Header.astro"
  key_links:
    - from: src/layouts/BaseLayout.astro
      to: src/components/primitives/Header.astro
      via: import Header from "../components/primitives/Header.astro"
      pattern: "components/primitives/Header"
    - from: src/layouts/BaseLayout.astro
      to: src/components/primitives/Footer.astro
      via: import Footer from "../components/primitives/Footer.astro"
      pattern: "components/primitives/Footer"
    - from: src/layouts/BaseLayout.astro
      to: src/components/primitives/MobileMenu.astro
      via: import MobileMenu from "../components/primitives/MobileMenu.astro"
      pattern: "components/primitives/MobileMenu"
---

<objective>
Swap `src/layouts/BaseLayout.astro` to import Header, Footer, and MobileMenu from `src/components/primitives/` instead of `src/components/`, then delete the v1.0 versions from `src/components/`. This is the integration point: after this plan lands, every stub page inherits the new editorial chrome and the chat regression gate is evaluated immediately.

**Purpose:** Per D-11, the old chrome files are deleted in Phase 9 rather than kept as `.v1` backups. Front-loading the integration risk means BaseLayout swap bugs surface now (small scope, fresh context) rather than on top of Phase 10's page rewrites.

**Output:** One commit that updates 3 import paths in BaseLayout.astro, removes the old `pt-14` top padding hack from `<main>` (the new Header is sticky with `height: 72px`, not fixed), and deletes the 3 old component files.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/09-primitives/09-CONTEXT.md
@src/layouts/BaseLayout.astro
@src/components/primitives/Header.astro
@src/components/primitives/Footer.astro
@src/components/primitives/MobileMenu.astro

<interfaces>
<!-- Current BaseLayout import block (lines 2–9): -->
// import { Font } from "astro:assets";
// import { SEO } from "astro-seo";
// import SkipToContent from "../components/SkipToContent.astro";
// import Header from "../components/Header.astro";              ← will change to primitives/Header.astro
// import MobileMenu from "../components/MobileMenu.astro";       ← will change to primitives/MobileMenu.astro
// import Footer from "../components/Footer.astro";               ← will change to primitives/Footer.astro
// import ChatWidget from "../components/chat/ChatWidget.astro"; ← UNCHANGED (D-26 hands-off)
// import "../styles/global.css";

<!-- Current BaseLayout main tag (line 81):
<main id="main-content" class="flex-1 pt-14">

The pt-14 (56px) offset existed because the v1.0 Header was fixed with height 56px
(h-14 in Tailwind). The new primitives/Header.astro is position:sticky with height:72px,
which means sibling <main> content flows naturally below it — no top padding needed.
Remove the pt-14 utility. Keep flex-1 (it participates in the flex-column layout).
-->
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Swap BaseLayout.astro imports to primitives/ and remove pt-14</name>
  <files>src/layouts/BaseLayout.astro</files>
  <read_first>
    - src/layouts/BaseLayout.astro (entire file — 88 lines — you must see the current structure before editing)
    - src/components/primitives/Header.astro (to confirm default export + prop signature; Header takes no props per task 1 of plan 04 + D-27)
    - src/components/primitives/Footer.astro (to confirm default export; no props)
    - src/components/primitives/MobileMenu.astro (to confirm default export; no props)
    - .planning/phases/09-primitives/09-CONTEXT.md D-11 (delete old files) and D-26 (chat hands-off)
  </read_first>
  <action>
EDIT `src/layouts/BaseLayout.astro` with these three changes:

1. **Lines 5–7** — Update the three import paths from `../components/` to `../components/primitives/`:

```astro
// BEFORE (current lines 5–7):
import Header from "../components/Header.astro";
import MobileMenu from "../components/MobileMenu.astro";
import Footer from "../components/Footer.astro";

// AFTER:
import Header from "../components/primitives/Header.astro";
import MobileMenu from "../components/primitives/MobileMenu.astro";
import Footer from "../components/primitives/Footer.astro";
```

Do NOT touch:
- Line 2: `import { Font } from "astro:assets";`
- Line 3: `import { SEO } from "astro-seo";`
- Line 4: `import SkipToContent from "../components/SkipToContent.astro";` (D-24 verify-only)
- Line 8: `import ChatWidget from "../components/chat/ChatWidget.astro";` (D-26 hands-off)
- Line 9: `import "../styles/global.css";`

2. **Line 81** — Remove the `pt-14` utility from `<main>` because the new Header is sticky (not fixed) and no longer requires a top offset:

```astro
// BEFORE:
<main id="main-content" class="flex-1 pt-14">

// AFTER:
<main id="main-content" class="flex-1">
```

3. **No other changes.** Specifically:
- Do NOT change the order of `<Header />`, `<MobileMenu />`, `<Footer />`, `<ChatWidget />` in the `<body>`
- Do NOT touch the `<body class="bg-bg text-ink font-body flex min-h-screen flex-col antialiased">` class list — those Tailwind utilities are on the BODY ELEMENT (not inside a primitive) so D-03 does not apply
- Do NOT touch the SEO component or its props
- Do NOT touch the `<Font>` tags in `<head>`
- Do NOT add or remove any children
  </action>
  <verify>
    <automated>rtk pnpm run check</automated>
  </verify>
  <acceptance_criteria>
    - src/layouts/BaseLayout.astro contains the literal string `import Header from "../components/primitives/Header.astro"`
    - src/layouts/BaseLayout.astro contains the literal string `import MobileMenu from "../components/primitives/MobileMenu.astro"`
    - src/layouts/BaseLayout.astro contains the literal string `import Footer from "../components/primitives/Footer.astro"`
    - src/layouts/BaseLayout.astro does NOT contain the literal string `import Header from "../components/Header.astro"` (old path)
    - src/layouts/BaseLayout.astro does NOT contain the literal string `import MobileMenu from "../components/MobileMenu.astro"` (old path)
    - src/layouts/BaseLayout.astro does NOT contain the literal string `import Footer from "../components/Footer.astro"` (old path)
    - src/layouts/BaseLayout.astro still contains the literal string `import SkipToContent from "../components/SkipToContent.astro"` (D-24 verify-only, untouched)
    - src/layouts/BaseLayout.astro still contains the literal string `import ChatWidget from "../components/chat/ChatWidget.astro"` (D-26 hands-off)
    - src/layouts/BaseLayout.astro contains the literal string `<main id="main-content" class="flex-1">`
    - src/layouts/BaseLayout.astro does NOT contain the literal string `pt-14` anywhere
    - src/layouts/BaseLayout.astro still renders `<Header />`, `<MobileMenu />`, `<Footer />`, `<ChatWidget />` in that order inside `<body>`
    - **BLOCKER 3 negative criteria — bare self-closing tags, no silent prop drilling:**
    - src/layouts/BaseLayout.astro does NOT contain the literal string `currentPath={` anywhere (regex `currentPath\s*=` — D-27 locks Header/MobileMenu to reading `Astro.url.pathname` internally; a `currentPath={Astro.url.pathname}` drill would pass the old criteria but violate D-27)
    - `rtk grep -c '<Header ' src/layouts/BaseLayout.astro` returns exactly 1 AND the single match equals the bare self-closing form `<Header />` (verify the entire line is `    <Header />` — no `class=`, no `currentPath=`, no other attributes)
    - `rtk grep -c '<Footer ' src/layouts/BaseLayout.astro` returns exactly 1 AND the single match equals `<Footer />` (bare self-closing, no attributes)
    - `rtk grep -c '<MobileMenu ' src/layouts/BaseLayout.astro` returns exactly 1 AND the single match equals `<MobileMenu />` (bare self-closing, no attributes)
    - `rtk pnpm run check` passes
  </acceptance_criteria>
  <done>BaseLayout imports swapped to primitives/ paths, pt-14 removed, all three primitives rendered as bare self-closing tags with zero props, check passes</done>
</task>

<task type="auto">
  <name>Task 2: Delete old v1.0 Header.astro, Footer.astro, MobileMenu.astro</name>
  <files>src/components/Header.astro, src/components/Footer.astro, src/components/MobileMenu.astro</files>
  <read_first>
    - src/components/Header.astro (confirm it's the v1.0 version before deletion — last line should be around 88; contains `id="site-header"`, `.hamburger-line`)
    - src/components/Footer.astro (confirm it's the v1.0 version — around 88 lines with SVG icons)
    - src/components/MobileMenu.astro (confirm it's the v1.0 version — 233 lines with `@keyframes menuLinkIn` and DOMContentLoaded fallback)
    - .planning/phases/09-primitives/09-CONTEXT.md D-11 (delete, not rename to .v1)
  </read_first>
  <action>
**BLOCKER 3 pre-flight check — verify the three v1.0 files exist BEFORE `git rm`:**

Run this check FIRST. If any of the three files is missing, `git rm` will fail mid-command and leave the working tree in a partially-deleted state. Fail loudly if any file is missing — do NOT silently skip.

```bash
# Preflight: all three must exist before we delete them
test -f src/components/Header.astro && test -f src/components/Footer.astro && test -f src/components/MobileMenu.astro
echo "Preflight OK — all three v1.0 files exist, proceeding with git rm"
```

If the preflight command returns non-zero, STOP and investigate. A missing v1.0 file means an earlier plan (or a manual edit) already moved/deleted it, and the task assumptions no longer hold.

ONCE PREFLIGHT PASSES, delete the three v1.0 files in a single git operation:

```bash
rtk git rm src/components/Header.astro src/components/Footer.astro src/components/MobileMenu.astro
```

(Equivalent: use the Write tool or Bash `rm` + `rtk git add -u`, but `git rm` records the deletion in one atomic step.)

Do NOT:
- Rename them to `.v1.astro` or similar — D-11 explicitly says delete, not keep as backup
- Move them anywhere
- Delete `src/components/NextProject.astro` (that's plan 06's responsibility to restyle)
- Delete `src/components/JsonLd.astro`, `src/components/SkipToContent.astro`, `src/components/ArticleImage.astro` (D-23/D-24/D-25 verify-only)
- Delete anything under `src/components/chat/` (D-26 hands-off)

After deletion, verify no other file in the repo imports the deleted files:

```bash
rtk grep -rn 'from "../components/Header.astro\\|from "../components/Footer.astro\\|from "../components/MobileMenu.astro' src/
rtk grep -rn 'from "../../components/Header.astro\\|from "../../components/Footer.astro\\|from "../../components/MobileMenu.astro' src/
```

Both commands should return zero matches. If any match surfaces, the consuming file is a bug — the only importer of these three files should have been `src/layouts/BaseLayout.astro`, which plan task 1 just updated.
  </action>
  <verify>
    <automated>rtk pnpm run build</automated>
  </verify>
  <acceptance_criteria>
    - **BLOCKER 3 preflight proof:** task action executed the `test -f` preflight check successfully BEFORE running `git rm` (the preflight's "Preflight OK" echo should appear in the task log)
    - `rtk git status --porcelain` shows exactly three ` D ` (deleted, staged) entries for `src/components/Header.astro`, `src/components/Footer.astro`, and `src/components/MobileMenu.astro` (confirms `git rm` staged the deletions atomically)
    - File `src/components/Header.astro` does NOT exist (test: `test ! -f src/components/Header.astro`)
    - File `src/components/Footer.astro` does NOT exist
    - File `src/components/MobileMenu.astro` does NOT exist
    - File `src/components/primitives/Header.astro` DOES exist (the replacement from plan 04)
    - File `src/components/primitives/Footer.astro` DOES exist
    - File `src/components/primitives/MobileMenu.astro` DOES exist
    - File `src/components/NextProject.astro` still exists (plan 06 restyle target)
    - File `src/components/JsonLd.astro` still exists (D-23)
    - File `src/components/SkipToContent.astro` still exists (D-24)
    - File `src/components/ArticleImage.astro` still exists (D-25)
    - File `src/components/chat/ChatWidget.astro` still exists (D-26)
    - `rtk grep -rn "from \"../components/Header.astro\"" src/` returns zero matches (no stale imports)
    - `rtk grep -rn "from \"../components/Footer.astro\"" src/` returns zero matches
    - `rtk grep -rn "from \"../components/MobileMenu.astro\"" src/` returns zero matches
    - `rtk pnpm run build` exits 0 (full build succeeds with new primitives wired)
    - `rtk pnpm run check` exits 0 (astro check green)
    - `rtk pnpm run lint` exits 0 (ESLint clean)
  </acceptance_criteria>
  <done>Three v1.0 files deleted, no stale imports remain, full build passes</done>
</task>

</tasks>

<verification>
- BaseLayout.astro imports from primitives/
- Three v1.0 chrome files deleted from src/components/
- No stale imports anywhere in src/
- Full build + check + lint pass
- Chat widget still imported and rendered (D-26 regression gate automated portion)
</verification>

<success_criteria>
- The app shell renders new editorial chrome on every stub page route
- pnpm run build, check, lint all pass
- No Phase 9 plan accidentally touched chat files
- Ready for plan 06 (kept-component audit) and plan 07 (/dev/primitives preview)
</success_criteria>

<output>
After completion, create `.planning/phases/09-primitives/09-05-SUMMARY.md` recording:
- The three import paths updated in BaseLayout
- The pt-14 removal (and reasoning: sticky > fixed)
- The three deleted files
- Confirmation that build/check/lint all pass
- Any stale import discoveries (should be zero)
- Commit SHA
</output>
