---
phase: quick/260407-hop
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - mockup.html
autonomous: true
requirements:
  - QUICK-260407-hop
must_haves:
  truths:
    - "A file named mockup.html exists at the repo root"
    - "Opening mockup.html in a browser renders the full portfolio design: sticky header, hero with JACK / CUTRARA· display, §01 WORK list (4 rows), §02 ABOUT, §03 CONTACT, footer"
    - "The mockup uses Geist + Geist Mono loaded from fonts.googleapis.com (exact href from spec)"
    - "The mockup contains no JavaScript, no images, no SVGs, no emoji, no gradients, no box-shadow, and no border-radius except on the status circle"
    - "The mockup is committed to git on the feat/ui-redesign branch"
  artifacts:
    - path: "mockup.html"
      provides: "Static HTML+CSS mockup of the new portfolio design"
      contains: "<!doctype html>, <header>, <main>, <footer>, <style>, JACK, CUTRARA, § 01 — WORK, § 02 — ABOUT, § 03 — CONTACT"
  key_links:
    - from: "mockup.html <head>"
      to: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap"
      via: "<link rel=\"stylesheet\">"
      pattern: "fonts\\.googleapis\\.com/css2\\?family=Geist"
    - from: "<nav> links"
      to: "sections #works, #about, #contact"
      via: "href=\"#works|#about|#contact\""
      pattern: "href=\"#(works|about|contact)\""
---

<objective>
Build a single static HTML/CSS mockup file at the repo root (`mockup.html`) that validates the locked portfolio design direction visually — before any changes land in the real Astro codebase. The file is fully self-contained: HTML + one inlined `<style>` block + Geist/Geist Mono via Google Fonts CDN. No JavaScript. No images. No Astro files touched.

Purpose: Let Jack open one file in a browser and see the full design — header, hero, works list, about, contact, footer — at desktop and mobile widths, so he can approve (or reject) the direction before investing in the Astro implementation.

Output: `mockup.html` at the repo root, committed to the current branch (`feat/ui-redesign`).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

<!-- The full locked design spec lives in this PLAN.md <tasks> block below. -->
<!-- The executor does not need to read any other file in the repo — this is a -->
<!-- brand-new standalone file with no dependencies on existing code. -->
</context>

<tasks>

<task type="auto">
  <name>Task 1: Write mockup.html at repo root and commit</name>
  <files>mockup.html</files>
  <action>
Create `mockup.html` at the repository root (`C:/Users/jackc/Code/portfolio/mockup.html`). The file is a single self-contained HTML document: one `<head>` with metadata + Google Fonts link + one `<style>` block, and one `<body>` containing `<header>`, `<main>` (three `<section>`s), and `<footer>`. No JavaScript. No external CSS. No images, SVGs, icons, or emoji characters in markup.

## 1. Document skeleton

```
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Jack Cutrara — Software Engineer</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap">
  <style>
    /* design tokens + reset + layout + components */
  </style>
</head>
<body>
  <header>...</header>
  <main>
    <section id="hero">...</section>
    <section id="works">...</section>
    <section id="about">...</section>
    <section id="contact">...</section>
  </main>
  <footer>...</footer>
</body>
</html>
```

Use this EXACT Google Fonts href (the verify step greps for it):
`https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap`

## 2. Design tokens (inside `<style>`, on `:root`)

```
:root {
  --bg: #FAFAF7;
  --ink: #0A0A0A;
  --ink-muted: #52525B;
  --ink-faint: #A1A1AA;
  --rule: #E4E4E7;
  --accent: #E63946;
  --container-max: 1200px;
  --pad-desktop: 48px;
  --pad-tablet: 32px;
  --pad-mobile: 24px;
}
```

## 3. Reset + base

- `*, *::before, *::after { box-sizing: border-box; }`
- `html { scroll-behavior: smooth; }` (native CSS — no JS)
- `body { margin: 0; background: var(--bg); color: var(--ink); font-family: "Geist", system-ui, -apple-system, sans-serif; font-feature-settings: "ss01", "cv11"; -webkit-font-smoothing: antialiased; }`
- `a { color: inherit; text-decoration: none; }`
- `h1, h2, h3, p { margin: 0; }`
- A `.container` helper: `max-width: var(--container-max); margin: 0 auto; padding-left: var(--pad-desktop); padding-right: var(--pad-desktop);`

## 4. Typography utility classes (match the spec EXACTLY)

- `.display` — Geist 700, `font-size: clamp(4rem, 9vw, 8rem)`, `line-height: 0.92`, `letter-spacing: -0.035em`, color `var(--ink)`
- `.h1-section` — Geist 600, `clamp(2.5rem, 5vw, 3.5rem)`, lh 1.05, tracking -0.02em
- `.h2-project` — Geist 500, `1.75rem`, lh 1.2, tracking -0.01em
- `.lead` — Geist 400, `clamp(1.25rem, 2vw, 1.625rem)`, lh 1.4
- `.body` — Geist 400, `1.125rem`, lh 1.6, `max-width: 68ch`
- `.label-mono` — `font-family: "Geist Mono", ui-monospace, monospace`, weight 500, `0.75rem`, `text-transform: uppercase`, `letter-spacing: 0.12em`
- `.meta-mono` — `font-family: "Geist Mono", ...`, weight 400, `0.8125rem`, `letter-spacing: 0.02em`
- Apply `font-variant-numeric: tabular-nums` to number / year / count elements (use a `.tabular` helper or apply directly).

## 5. Header (sticky)

```
<header class="site-header">
  <div class="container header-inner">
    <span class="wordmark">JACK CUTRARA</span>
    <nav class="site-nav">
      <a href="#works" class="nav-link is-active">works</a>
      <a href="#about" class="nav-link">about</a>
      <a href="#contact" class="nav-link">contact</a>
    </nav>
  </div>
</header>
```

- `.site-header { position: sticky; top: 0; z-index: 50; height: 72px; background: var(--bg); border-bottom: 1px solid var(--rule); }`
- `.header-inner { display: flex; justify-content: space-between; align-items: center; height: 100%; }`
- `.wordmark` — Geist Mono 500, uppercase, `0.875rem`, letter-spacing 0.12em, color `var(--ink)`
- `.site-nav { display: flex; gap: 32px; }`
- `.nav-link` — Geist Mono 500, uppercase, `0.75rem`, letter-spacing 0.12em, color `var(--ink-muted)`
- `.nav-link.is-active { color: var(--ink); text-decoration: underline; text-decoration-color: var(--accent); text-decoration-thickness: 1.5px; text-underline-offset: 6px; }`
- NO pill, NO background fill, NO bold change on active. "works" is active in this mockup.

## 6. Hero section

```
<section id="hero" class="hero">
  <div class="container hero-grid">
    <div class="hero-content">
      <h1 class="display">
        JACK<br>CUTRARA<span class="accent-dot">·</span>
      </h1>
      <p class="lead hero-lead">Software engineer building reliable, production-grade systems.</p>
    </div>
    <aside class="hero-meta">
      <div class="status-line">
        <span class="status-dot" aria-hidden="true"></span>
        <span class="label-mono">AVAILABLE FOR WORK</span>
      </div>
      <div class="meta-mono meta-location">EST. 2024 · OAKLAND, CA</div>
    </aside>
  </div>
</section>
```

- `.hero { padding-top: 96px; padding-bottom: 0; }`
- `.hero-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 24px; align-items: start; }`
- `.hero-content { grid-column: 1 / span 8; }`
- `.hero-meta { grid-column: 9 / span 4; display: flex; flex-direction: column; gap: 8px; }`
- `.hero-lead { margin-top: 32px; max-width: 40ch; color: var(--ink); }`
- `.accent-dot { color: var(--accent); }` — the trailing `·` after CUTRARA
- `.status-line { display: inline-flex; align-items: center; }`
- `.status-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--accent); margin-right: 8px; }` — THIS is the only `border-radius` allowed in the entire file. Do NOT use the `●` character in markup.
- `.meta-location { color: var(--ink-muted); }`

## 7. Section gap spacing

Apply a utility: `.section { margin-top: 160px; }` at desktop. The hero is the first section and uses its own padding-top instead of margin-top (so the 160px gap is applied to the sections AFTER hero).

## 8. § 01 — WORK

```
<section id="works" class="section works">
  <div class="container">
    <div class="section-header">
      <span class="label-mono">§ 01 — WORK</span>
      <span class="meta-mono count tabular">4 / 4</span>
    </div>
    <div class="section-rule"></div>
    <div class="work-list">
      <a class="work-row" href="#">
        <span class="work-num meta-mono tabular">01</span>
        <div class="work-body">
          <h2 class="h2-project work-title">Portfolio System</h2>
          <div class="work-stack">ASTRO · TAILWIND · GSAP</div>
        </div>
        <div class="work-meta">
          <span class="meta-mono tabular work-year">2026</span>
          <span class="work-arrow" aria-hidden="true">→</span>
        </div>
      </a>
      <!-- row 02 … -->
    </div>
  </div>
</section>
```

- `.section-header { display: flex; justify-content: space-between; align-items: baseline; }` — left = label mono `var(--ink)`, right = meta mono `var(--ink-faint)` with tabular-nums
- `.section-rule { height: 1px; background: var(--rule); margin-top: 16px; }` — the 1px rule below the section header. 24px margin between the rule and the first row: give the first `.work-row` `margin-top: 24px` OR add `margin-bottom: 24px` on `.section-rule`.
- `.work-row { display: grid; grid-template-columns: 56px 1fr auto; gap: 24px; padding: 28px 0; border-bottom: 1px solid var(--rule); color: inherit; text-decoration: none; cursor: pointer; align-items: start; }`
- `.work-list .work-row:last-child { border-bottom: none; }`
- `.work-num { color: var(--ink-muted); font-size: 1rem; font-weight: 500; }` (Geist Mono 500 1rem)
- `.work-title { color: var(--ink); margin-bottom: 12px; }`
- `.work-stack { font-family: "Geist Mono", ui-monospace, monospace; font-weight: 400; font-size: 0.8125rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--ink-faint); }`
- `.work-meta { display: flex; align-items: baseline; gap: 8px; color: var(--ink-faint); }`
- `.work-arrow { color: var(--accent); opacity: 0; transition: opacity 120ms ease; }`
- Hover state:
  - `.work-row:hover .work-title { text-decoration: underline; text-decoration-color: var(--accent); text-decoration-thickness: 1.5px; text-underline-offset: 4px; }`
  - `.work-row:hover .work-arrow { opacity: 1; }`
  - NO `transform` on hover. NO other transitions.

Four rows (use EXACTLY these strings — the verify step greps for them):
1. `01` — `Portfolio System` — `2026` — `ASTRO · TAILWIND · GSAP`
2. `02` — `Distributed Cache` — `2025` — `RUST · TOKIO · REDIS`
3. `03` — `Compiler Toy` — `2025` — `OCAML · LLVM`
4. `04` — `Notes Sync Engine` — `2024` — `TYPESCRIPT · SQLITE · CRDT`

## 9. § 02 — ABOUT

```
<section id="about" class="section about">
  <div class="container">
    <div class="section-header">
      <span class="label-mono">§ 02 — ABOUT</span>
    </div>
    <div class="section-rule"></div>
    <div class="about-body">
      <p class="about-intro">I'm Jack — a junior software engineer who likes building systems that don't break at 3 a.m.</p>
      <p>I build small, production-grade services and the plumbing around them: caches, compilers, sync engines, APIs. Most of my projects start as "I wonder how that actually works" and end as something I'd be comfortable handing off to a team.</p>
      <p>I reach for the boring tool first. I read the spec before I read the blog post. I like tests that fail loudly and code review comments that start with "why." My favorite bug reports are the ones that come with a reproduction.</p>
      <p>Right now I'm looking for a junior or entry-level role on a team that cares about correctness, reliability, and performance — ideally one that will push me to get better at the parts of the stack I haven't touched yet.</p>
    </div>
  </div>
</section>
```

- `.about-body { max-width: 68ch; margin-top: 24px; }` — enforce the `1-8` grid column look via `max-width` (acceptable here since about is just prose; the 68ch already constrains it visually)
- `.about-intro` — Geist 500, `1.375rem`, color `var(--ink)`, line-height 1.4, `margin-bottom: 24px`
- All three trailing paragraphs: Geist 400, `1.125rem`, lh 1.6, color `var(--ink)`, `margin-bottom: 16px` (last one: 0). Each paragraph ≤80 words (copy above is within budget — do not shorten further, do not pad).

## 10. § 03 — CONTACT

```
<section id="contact" class="section contact">
  <div class="container">
    <div class="section-header">
      <span class="label-mono">§ 03 — CONTACT</span>
    </div>
    <div class="section-rule"></div>
    <div class="contact-body">
      <div class="label-mono contact-label">GET IN TOUCH</div>
      <a class="contact-email" href="mailto:jack@cutrara.dev">jack@cutrara.dev</a>
      <div class="contact-links">
        <a class="contact-link" href="#">GitHub</a> · <a class="contact-link" href="#">LinkedIn</a> · <a class="contact-link" href="#">X</a>
      </div>
    </div>
  </div>
</section>
```

- `.contact-body { margin-top: 24px; }`
- `.contact-label { color: var(--ink-muted); margin-bottom: 16px; display: block; }`
- `.contact-email` — Geist 500, `1.75rem`, color `var(--ink)`, no underline default. Hover: `text-decoration: underline; text-decoration-color: var(--accent); text-decoration-thickness: 1.5px; text-underline-offset: 4px;` — color stays `var(--ink)`.
- `.contact-links { margin-top: 24px; font-family: "Geist Mono", ui-monospace, monospace; font-weight: 500; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--ink-muted); }`
- `.contact-link:hover { color: var(--accent); }`
- NO icons of any kind. Literal text `·` between link names (Unicode MIDDLE DOT is a text character, not an emoji — the "no emoji" rule targets pictographs).

## 11. Footer

```
<footer class="site-footer">
  <div class="container footer-inner">
    <span class="meta-mono footer-copy">© 2026 JACK CUTRARA</span>
    <span class="meta-mono footer-built">BUILT WITH ASTRO · TAILWIND · GEIST</span>
  </div>
</footer>
```

- `.site-footer { margin-top: 96px; border-top: 1px solid var(--rule); height: 64px; }`
- `.footer-inner { display: flex; justify-content: space-between; align-items: center; height: 100%; }`
- `.footer-copy, .footer-built { color: var(--ink-faint); }`
- `.footer-built { text-transform: uppercase; }`

## 12. Responsive

```
@media (max-width: 1023px) {
  .container { padding-left: 32px; padding-right: 32px; }
  .hero { padding-top: 72px; }
  .hero-grid { grid-template-columns: 1fr; }
  .hero-content, .hero-meta { grid-column: auto; }
  .hero-meta { width: 100%; margin-top: 32px; }
  .section { margin-top: 96px; }
}

@media (max-width: 767px) {
  .container { padding-left: 24px; padding-right: 24px; }
  .hero { padding-top: 48px; }
  .section { margin-top: 72px; }
}

@media (prefers-reduced-motion: reduce) {
  /* No animations in this mockup — stub retained intentionally. */
}
```

## 13. Hard rules — verify your output against this list before finishing

- [ ] Zero `<script>` tags (search the string `<script`)
- [ ] Zero `<img>`, `<svg>`, `<picture>`, `<i class`, `<use ` tags
- [ ] Zero emoji / pictograph characters in markup. Allowed non-pictograph text characters: `§`, `·`, `—`, `→`, `©`
- [ ] No `●` character in markup — the status dot is the CSS `.status-dot` element
- [ ] Zero `linear-gradient(` or `radial-gradient(` in the `<style>` block
- [ ] Zero `box-shadow` declarations
- [ ] Exactly one `border-radius` declaration in the whole file — on `.status-dot` (50%)
- [ ] Zero `transform:` on hover (no scale, no translate)
- [ ] All `<a>` tags render with `cursor: pointer` (native for inline links; explicit on `.work-row`)
- [ ] `font-variant-numeric: tabular-nums` applied to `.tabular` / number / year / count elements
- [ ] Exactly one `<style>` block
- [ ] `<html lang="en">`, charset + viewport meta, `<title>Jack Cutrara — Software Engineer</title>`
- [ ] Sections have `id="works"`, `id="about"`, `id="contact"` (the hero section id="hero" is fine but not required by the spec)
- [ ] Google Fonts href matches exactly the spec URL
- [ ] All four work row titles + years + stacks match the spec EXACTLY
- [ ] Headers: `§ 01 — WORK`, `§ 02 — ABOUT`, `§ 03 — CONTACT` (with em-dashes, not hyphens)

## 14. Commit

After writing the file and passing the self-check above, commit it:

```
rtk git add mockup.html
rtk git commit -m "feat(mockup): add static HTML/CSS portfolio design mockup"
```

Do NOT push. Do NOT amend. Do NOT touch any other file in the commit. No Astro files, no package.json, no config files.
  </action>
  <verify>
    <automated>test -f mockup.html &amp;&amp; node -e "const fs=require('fs');const h=fs.readFileSync('mockup.html','utf8');const must=['&lt;!doctype html&gt;','lang=\"en\"','&lt;title&gt;Jack Cutrara — Software Engineer&lt;/title&gt;','fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&amp;family=Geist+Mono:wght@400;500&amp;display=swap','JACK','CUTRARA','§ 01 — WORK','§ 02 — ABOUT','§ 03 — CONTACT','Portfolio System','Distributed Cache','Compiler Toy','Notes Sync Engine','ASTRO · TAILWIND · GSAP','RUST · TOKIO · REDIS','OCAML · LLVM','TYPESCRIPT · SQLITE · CRDT','2026','2025','2024','id=\"works\"','id=\"about\"','id=\"contact\"','jack@cutrara.dev','© 2026 JACK CUTRARA','BUILT WITH ASTRO · TAILWIND · GEIST','AVAILABLE FOR WORK','EST. 2024 · OAKLAND, CA'];for(const s of must){if(!h.includes(s)){console.error('MISSING:',s);process.exit(1);}}const forbid=[['&lt;script','script tag'],['&lt;img','img tag'],['&lt;svg','svg tag'],['&lt;picture','picture tag'],['linear-gradient(','linear-gradient'],['radial-gradient(','radial-gradient'],['box-shadow','box-shadow'],['●','bullet char in markup']];for(const [s,name] of forbid){if(h.includes(s)){console.error('FORBIDDEN:',name);process.exit(1);}}const styleCount=(h.match(/&lt;style[\s&gt;]/g)||[]).length;if(styleCount!==1){console.error('Expected exactly 1 &lt;style&gt; block, got',styleCount);process.exit(1);}const brMatches=h.match(/border-radius\s*:/g)||[];if(brMatches.length!==1){console.error('Expected exactly 1 border-radius, got',brMatches.length);process.exit(1);}console.log('mockup.html OK');" &amp;&amp; rtk git log --oneline -1 mockup.html</automated>
  </verify>
  <done>
- `mockup.html` exists at the repo root
- All required strings present (display text, section headers, project titles, years, stacks, contact info, footer copy)
- Zero `<script>`, `<img>`, `<svg>`, `<picture>` tags
- Zero `linear-gradient` / `radial-gradient` / `box-shadow`
- Zero `●` character in markup
- Exactly one `<style>` block
- Exactly one `border-radius` declaration
- File committed to git on `feat/ui-redesign` (single commit touching only `mockup.html`)
- Opening the file in a browser shows the complete design: sticky header with active "works" link, JACK/CUTRARA· hero with red accent dot, status indicator + location metadata, 4-row work list with hover states, about section with intro + 3 paragraphs, contact section with email + social links, and footer
  </done>
</task>

</tasks>

<verification>
Run the automated verify command from Task 1. It confirms:
1. File exists at repo root
2. All required content strings are present (doctype, lang, title, Google Fonts URL, display text, all 4 project rows with exact titles/years/stacks, all 3 section headers, contact info, footer text, section ids)
3. All forbidden patterns absent (script, img, svg, picture, gradients, box-shadow, `●` in markup)
4. Exactly one `<style>` block
5. Exactly one `border-radius` declaration (the status dot)
6. File has at least one commit in git history

Then manually: open `mockup.html` in a browser at desktop (≥1024px), tablet (768-1023px), and mobile (<768px) widths. Visually confirm the design matches the spec at each breakpoint.
</verification>

<success_criteria>
- `mockup.html` exists at repo root and renders the full locked design in any modern browser
- Automated verify passes (all required content, no forbidden patterns, structural invariants hold)
- Single commit on `feat/ui-redesign` touching only `mockup.html`
- Jack can open one file and decide whether to proceed with implementing this design in the real Astro codebase
- No Astro files, no package.json, no config files modified
</success_criteria>

<output>
After completion, create `.planning/quick/260407-hop-build-static-html-css-mockup-of-new-port/260407-hop-SUMMARY.md` documenting:
- What was built (mockup.html)
- Any deviations from the spec and why
- Commit SHA
- Next step (user review of the mockup in a browser)
</output>
