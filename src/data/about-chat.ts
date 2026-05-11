/**
 * About-page copy in THIRD PERSON for the chat widget surface (CHAT-06).
 * Consumed ONLY by scripts/build-chat-context.mjs when generating
 * src/data/portfolio-context.json. The site surface (homepage, about page)
 * reads from src/data/about.ts (first-person) -- DO NOT swap them.
 *
 * Voice rule: third-person, present tense for ongoing state, past tense for
 * shipped work. Never first person -- see .planning/debug/chat-voice-split-regression.md
 * for the regression these constants close. Avoid the broadened first-person
 * leak regex tokens (build-chat-context.mjs checkFirstPersonLeaks):
 *   - I'm / I'd / I'll / I've / I am
 *   - I build / built / like / liked / wonder / wanted / reach / reached / read /
 *     architected / chose / haven / wrote / run / set / shipped / added / prefer /
 *     care / watch / track / love / hate
 *   - My approach / favorite / projects / code / work / background / stack / version / first
 */

/* Verified: 2026-05-11 */
export const ABOUT_CHAT_INTRO =
  "Jack is a junior software engineer who enjoys building systems that don't break at 3 a.m.";

/* Verified: 2026-05-11 */
export const ABOUT_CHAT_P1 =
  "Jack builds small, production-grade services and the plumbing around them: caches, compilers, sync engines, APIs. Most of his projects start as “how does that actually work?” and end as something he would be comfortable handing off to a team.";

/* Verified: 2026-05-11 */
export const ABOUT_CHAT_P2 =
  "Jack reaches for the boring tool first. He reads the spec before the blog post. He gravitates toward tests that fail loudly and code-review comments that start with “why.” His favourite bug reports are the ones that come with a reproduction.";

/* Verified: 2026-05-11 */
export const ABOUT_CHAT_P3 =
  "Jack is currently looking for a junior or entry-level role on a team that values correctness, reliability, and performance — ideally one that will push him to get better at the parts of the stack he has not touched yet.";
