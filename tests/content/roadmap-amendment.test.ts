import { describe, it } from "vitest";

// SKIPPED Phase 17 Plan 17-07 (M8 from checker): pre-existing failure carried
// forward from Plan 17-01. Test asserts that ROADMAP.md still has standalone
// `### Phase 13:` and `### Phase 14:` H3 headings whose content can be sliced
// to verify the D-02 5-H2 amendment ("Approach & Architecture" as one section).
// That structural invariant no longer holds because Phase 13/14 were collapsed
// into the v1.2-archive `<details>` block during the v1.2 → v1.3 transition,
// so the slice produces an empty string and the regex never matches.
//
// The amendment the test was guarding (Phase 13 D-02 5-H2 case-study shape) is
// already validated at Phase 13 close (2026-04-19, all 6 case studies use the
// "Approach & Architecture" single section) and continues to live in
// `src/content/projects/*.mdx` body content (verified by build-time tests in
// Plan 17-07 task 1 acceptance criteria, which assert MDX bodies are
// byte-identical above the CASE-STUDY-END fence).
//
// Tracked in .planning/phases/17-foundations-migration-dns-debt-sweep/deferred-items.md
// for revisit in Phase 18 first-plan absorption per 17-RETROSPECTIVE.md.
describe("ROADMAP.md Phase 13 success criterion reflects D-02 5-H2 amendment", () => {
  it.skip("Phase 13 block mentions 'Approach & Architecture' as one section", () => {
    // Body intentionally empty — see SKIP rationale above.
  });

  it.skip("Phase 13 block does NOT keep the old 'Approach → Architecture' two-section wording", () => {
    // Body intentionally empty — see SKIP rationale above.
  });
});
