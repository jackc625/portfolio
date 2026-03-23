# Phase 2: Site Shell & Navigation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-23
**Phase:** 02-site-shell-navigation
**Areas discussed:** Navigation style, Mobile menu, Footer design, Identity display

---

## Navigation Style

| Option | Description | Selected |
|--------|-------------|----------|
| Transparent overlay | Nav floats over page content, background fades in on scroll. Matches reference sites. | ✓ |
| Solid bar | Subtle bg-secondary background from the start, clear separation. | |
| Glassmorphism | Semi-transparent blur effect, modern but complex. | |

**User's choice:** Transparent overlay
**Notes:** Matches dark editorial aesthetic of reference sites (andrewreff.com, artemshcherban.com)

| Option | Description | Selected |
|--------|-------------|----------|
| Sticky with scroll reveal | Hides on scroll down, reappears on scroll up. | ✓ |
| Always sticky | Fixed at top at all times. | |
| Static (scroll away) | Scrolls out of view. | |

**User's choice:** Sticky with scroll reveal

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal text links | Clean text in body font, subtle hover effect. | ✓ |
| Monospace accent links | Nav links in monospace font for dev feel. | |
| Uppercase tracking | Small uppercase with wide letter-spacing. | |

**User's choice:** Minimal text links

| Option | Description | Selected |
|--------|-------------|----------|
| Accent color highlight | Active link uses teal accent color. | |
| Underline indicator | Subtle underline on active link. | |
| You decide | Claude picks via frontend-design skill. | ✓ |

**User's choice:** You decide (Claude's discretion)

---

## Mobile Menu

| Option | Description | Selected |
|--------|-------------|----------|
| Full-screen overlay | Menu takes over entire screen, links large and centered. | ✓ |
| Slide-in drawer | Panel slides in from right side. | |
| Dropdown panel | Menu drops down from header. | |

**User's choice:** Full-screen overlay

| Option | Description | Selected |
|--------|-------------|----------|
| Nav links only | Just the 5 page links, clean and focused. | ✓ |
| Nav links + social icons | Page links plus GitHub/LinkedIn/email icons. | |
| Nav links + tagline + socials | Full treatment with links, tagline, and socials. | |

**User's choice:** Nav links only

| Option | Description | Selected |
|--------|-------------|----------|
| Animated hamburger-to-X | Three lines morph into X with CSS transition. | |
| Simple toggle icon | Standard swap with no animation. | |
| You decide | Claude picks via frontend-design skill. | ✓ |

**User's choice:** You decide (Claude's discretion)

| Option | Description | Selected |
|--------|-------------|----------|
| md (768px) | Standard Tailwind md breakpoint. | ✓ |
| lg (1024px) | Switch to hamburger earlier. | |
| You decide | Claude determines based on spacing. | |

**User's choice:** md (768px)

---

## Footer Design

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal + contact links | Name, copyright, social/contact icons. | ✓ |
| Rich multi-column | Columns with nav links, contact info, socials. | |
| Ultra-minimal | Just copyright text. | |

**User's choice:** Minimal + contact links

| Option | Description | Selected |
|--------|-------------|----------|
| Subtle border line | Thin border-top using existing border token. | |
| Background color shift | Footer uses bg-secondary. | |
| You decide | Claude picks via frontend-design skill. | ✓ |

**User's choice:** You decide (Claude's discretion)

---

## Identity Display

| Option | Description | Selected |
|--------|-------------|----------|
| Text namemark | "Jack Cutrara" in display/heading font. | ✓ |
| Initials mark | "JC" as compact monogram. | |
| First name only | Just "Jack" — casual, approachable. | |

**User's choice:** Text namemark

| Option | Description | Selected |
|--------|-------------|----------|
| Software Engineer | Simple, direct role title. | ✓ |
| Aspiring Software Engineer | Honest about junior level. | |
| I build things for the web | Casual, action-oriented tagline. | |

**User's choice:** Software Engineer

| Option | Description | Selected |
|--------|-------------|----------|
| Home hero only | Full identity on home hero, nav shows just name. | ✓ |
| Nav subtitle on all pages | Role as small subtitle under name in nav. | |
| Nav + hero both | Role in both nav and home hero. | |

**User's choice:** Home hero only

| Option | Description | Selected |
|--------|-------------|----------|
| astro-seo component | Drop-in component for meta/OG/Twitter tags. | ✓ |
| Hand-written meta tags | Raw meta tags in layout. | |
| You decide | Claude picks. | |

**User's choice:** astro-seo component

---

## Claude's Discretion

- Active page indication style in nav
- Hamburger menu icon animation style
- Footer visual separator treatment
- All specific visual decisions via frontend-design skill

## Deferred Ideas

None — discussion stayed within phase scope
