/**
 * About page copy -- single source of truth.
 * Consumed by: index.astro (ABOUT_INTRO + ABOUT_P1), about.astro (INTRO + P1 + P3).
 * ABOUT_INTRO / ABOUT_P1 / ABOUT_P3 revised for the Phase 24 positioning shift
 * (POS-01/02): honest new-grad register with shipped production experience, no
 * self-applied seniority qualifier. The former ABOUT_P2 ("boring tool first")
 * was removed at the Phase 24 UAT gate per owner copy review (reverses D-06).
 * Voice: first person. Zero em dashes (U+2014).
 */
/* Phase 24 draft: positioning shift (POS-01/02) */
export const ABOUT_INTRO =
  "I'm Jack, a software engineer who likes building systems that don't break at 3 a.m.";

/* Phase 24 draft: positioning shift (POS-01/02/D-12) */
export const ABOUT_P1 =
  "These days I build and stabilize production systems for real users. I’m currently the solo contract engineer on Holloway Connect, a live operations platform, and I’m finishing my B.S. in Computer Science. Most of my projects start as “I wonder how that actually works” and end as something I’d be comfortable handing off to a team.";

/* Phase 24 draft: positioning shift (POS-02/D-13) */
export const ABOUT_P3 =
  "Alongside the contract work, I’m looking for a full-time software engineering role on a team that cares about correctness, reliability, and performance, ideally one that will push me to get better at the parts of the stack I haven’t touched yet.";
