---
phase: 25-chat-knowledge-refresh-milestone-verification
fixed_at: 2026-07-14T16:38:00Z
review_path: .planning/phases/25-chat-knowledge-refresh-milestone-verification/25-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
---

# Phase 25: Code Review Fix Report

**Fixed at:** 2026-07-14T16:38:00Z
**Source review:** .planning/phases/25-chat-knowledge-refresh-milestone-verification/25-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 6 (fix_scope: all — includes Info)
- Fixed: 6
- Skipped: 0

## Verification

Because the fixes touch the chat-knowledge build guard and its type/verifier
docs, I ran the affected pipeline and tests after applying them:

- `node scripts/build-chat-context.mjs --check` → exit 0, artifact unchanged
  (the new structural guard + `personal.summary` target do not false-positive
  on the current third-person corpus).
- `vitest run` over `tests/build/chat-knowledge-voice.test.ts`,
  `tests/api/chat-voice-split.test.ts`, `tests/build/chat-context-integrity.test.ts`,
  `tests/build/parse-education.test.ts` → **64 passed**. The integrity test
  (which asserts the three `FIRST_PERSON_LEAK_RE` copies are byte-identical)
  passes — none of the three regex copies were touched.

## Fixed Issues

### WR-01: Dead exported function `parseAboutExports` (+ `ABOUT_TS_PATH`)

**Files modified:** `scripts/build-chat-context.mjs`
**Commit:** 42848c0
**Applied fix:** Removed the dead `parseAboutExports` function (its sole
consumer of `ABOUT_TS_PATH`) and the `ABOUT_TS_PATH` constant. This also drops
the last `ABOUT_P2`-aware reader from the chat generator, removing the
maintenance hazard that a reader would believe P2 still flows into chat. Verified
no live consumers first (repo-wide grep + `git grep` over `tests/` — only the
declaration, planning docs, graphify output, and an untracked `.bg-shell/`
scratch file referenced it). The `about-chat.ts` path (`parseAboutChatExports`)
is the sole about-copy source and is untouched.

### WR-02: First-person leak regex is a finite verb allowlist with coverage gaps

**Files modified:** `scripts/build-chat-context.mjs`
**Commit:** ef6acf2
**Applied fix:** Chose the reviewer's "more robust" structural option. Added a
build-guard-only `NEVER_BEGINS_FIRST_PERSON = /(?:^|[.!?]\s+)(I|My|We|Our)\b/`
that flags any sentence beginning with a standalone first-person clause
regardless of the following verb, and wired it into `checkFirstPersonLeaks`
alongside the existing allowlist. This closes the enumerated gaps (`I fixed`,
`I traced`, `I recovered`, `I re-scoped`, `I stood up`, etc.) without editing the
three byte-identical `FIRST_PERSON_LEAK_RE` copies — deliberately keeping the
triplicated regex contract intact (integrity test still passes). Case-sensitive
so third-person prose never false-positives; confirmed by a clean `--check` run.

### WR-03: Leak guard scope excludes `personal.summary` (chat-bound prose)

**Files modified:** `scripts/build-chat-context.mjs`
**Commit:** b77cb06
**Applied fix:** Added `["personal.summary", merged.personal?.summary]` to the
`targets` array so the hand-curated identity file (serialized verbatim into
`<knowledge>`) is covered by the same guard, and updated the scope docstring to
list `personal.summary` (and drop the stale `p2` reference on the old line 108).
`--check` still exits 0 with the current third-person summary.

### WR-04: Stale / self-contradictory `@fileoverview` docstring

**Files modified:** `scripts/build-chat-context.mjs`
**Commit:** 0a4005b
**Applied fix:** Rewrote the numbered source list to reflect the real inputs:
project MDX `chatSummary`, below-fence `Projects/*.md`, `about-chat.ts`,
`education.ts`, `experience/**/*.mdx`, and `portfolio-context.static.json`.
(The related `p2` scope-comment reference was corrected under WR-03, which
rewrote that same comment.)

### IN-01: Type comment mis-attributes `education` to the static JSON

**Files modified:** `src/prompts/portfolio-context-types.ts`
**Commit:** eb00c8e
**Applied fix:** Added a provenance comment above the `education` field marking
it as GENERATED / single-sourced from `src/data/education.ts` (D-07) via
`parseEducation`, injected during the shallow merge, and noting the static JSON
no longer carries an education object. Type shape unchanged (comment-only).

### IN-02: Invariant verifier's dependency check broader than stated intent

**Files modified:** `scripts/verify-phase25-invariants.mjs`
**Commit:** 1cb5ef8
**Applied fix:** Chose the "update the comment" option (behavior is stricter but
fail-safe, so no code change is warranted). The `normDeps` docstring now states
that key order is normalized away but ANY add, removal, or version-string change
is treated as drift — not only additions — and that a legitimate patch bump will
false-fail until the baseline is re-recorded.

---

_Fixed: 2026-07-14T16:38:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
