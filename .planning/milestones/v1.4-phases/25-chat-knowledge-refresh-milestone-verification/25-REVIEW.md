---
phase: 25-chat-knowledge-refresh-milestone-verification
reviewed: 2026-07-14T20:26:36Z
depth: deep
files_reviewed: 16
files_reviewed_list:
  - scripts/build-chat-context.mjs
  - scripts/verify-phase25-invariants.mjs
  - src/content/experience/balfour-beatty.mdx
  - src/content/experience/holloway.mdx
  - src/content/projects/multi-chain-evm.mdx
  - src/data/about-chat.ts
  - src/data/portfolio-context.json
  - src/data/portfolio-context.static.json
  - src/prompts/portfolio-context-types.ts
  - src/prompts/system-prompt.ts
  - tests/api/chat-voice-split.test.ts
  - tests/api/prompt-injection.test.ts
  - tests/build/chat-context-integrity.test.ts
  - tests/build/chat-knowledge-voice.test.ts
  - tests/build/parse-education.test.ts
  - tests/fixtures/chat-eval-dataset.ts
findings:
  critical: 0
  warning: 4
  info: 2
  total: 6
status: issues_found
---

# Phase 25: Code Review Report

**Reviewed:** 2026-07-14T20:26:36Z
**Depth:** deep
**Files Reviewed:** 16
**Status:** issues_found

## Summary

Phase 25 refreshes the chat knowledge corpus: it ingests project #7 (Multi-Chain
EVM Trader), moves education to a single source (`education.ts`), converts
`experience` into a reverse-chronological structured array read from a new MDX
collection, splits about-copy voice via `about-chat.ts`, removes the #7 topic ban
from the system prompt, and adds a phase-invariant SHA-256 verifier.

The implementation is careful and unusually well-tested. I traced the build
pipeline (`build-chat-context.mjs`) end-to-end against its generated artifact
(`portfolio-context.json`), the type contract, the system prompt, and every
supplied test. Core correctness holds: the 7 project slugs match, experience is
reverse-chron with Holloway first, education deep-equals the `education.ts` SSoT,
the `<security>` golden-block test aligns byte-for-byte with the shipped prompt,
Projects/7 is ingested untruncated (the tail-phrase assertion resolves), and the
three copies of the first-person leak regex are byte-identical.

No BLOCKER-class defects (no incorrect behavior, security hole, or data-loss
risk) were found. The findings below are quality/robustness issues: dead code
left behind by the `about.ts` -> `about-chat.ts` switch, coverage gaps in the
voice-leak tripwire, and stale documentation. None block shipping, but the
voice-tripwire gaps (WR-02/WR-03) weaken the automated guard that is the whole
point of the CHAT-06 voice-split contract and should be addressed.

## Warnings

### WR-01: Dead exported function `parseAboutExports` (+ `ABOUT_TS_PATH`) after the about-chat.ts switch

**File:** `scripts/build-chat-context.mjs:325-353` (also `:49`, `:317`)
**Issue:** `main()` now sources chat about-copy exclusively from `about-chat.ts`
via `parseAboutChatExports` (line 662). `parseAboutExports` — which reads
`ABOUT_INTRO`/`ABOUT_P1`/`ABOUT_P2`/`ABOUT_P3` from `about.ts` — is exported but
never called anywhere in the reviewed scope (a repo-wide grep finds only the
declaration, its own doc references, and a `.bg-shell/` scratch file). Its sole
consumer of the module-level constant `ABOUT_TS_PATH` (line 49) is this dead
function. This is a maintenance hazard: it still references `ABOUT_P2`, which was
deliberately cut from the chat corpus this phase, so a future reader may believe
P2 still flows into chat.
**Fix:** Remove `parseAboutExports` and `ABOUT_TS_PATH` (and drop the ABOUT_P2
references), or, if intentionally retained for the website surface, move it to a
shared module with a comment stating it is website-only and not part of the chat
build. Do not leave a `P2`-aware reader in the chat generator.

### WR-02: First-person leak regex is a finite verb allowlist with material coverage gaps

**File:** `scripts/build-chat-context.mjs:101` (mirrored in
`tests/build/chat-knowledge-voice.test.ts:40`, `tests/api/chat-voice-split.test.ts:33`)
**Issue:** `FIRST_PERSON_LEAK_RE` matches `I <verb>` only for an enumerated verb
list. Many common first-person verbs that appear verbatim in this project's own
source prose are NOT in the list — e.g. `fixed`, `traced`, `recovered`, `grew`,
`closed`, `wrapped`, `owned`, `managed`, `stood`, `authored`, `diagnosed`,
`delivered`. The Holloway/first-person `summary` field and the first-person
Projects/7 MDX body use several of these ("I stood up", "I re-scoped", "I traced",
"I recovered"). Today those first-person sources are not consumed by chat (the
build reads third-person `chatSummary` and `void body`s the MDX body), so there
is no live leak. But this regex is the automated tripwire for the CHAT-06 voice
contract; a future hand-edit to `about-chat.ts` or a `chatSummary` that used
"I fixed…" / "I traced…" would silently pass the guard.
**Fix:** Either broaden the allowlist to cover the project's actual verb
vocabulary, or (more robust) add a structural rule that flags any chat-bound
prose sentence beginning with a standalone `I`/`My`/`We`/`Our` clause regardless
of verb — the `NEVER_BEGINS_FIRST_PERSON = /^\s*(I|My|We|Our)\b/` pattern already
present in `chat-knowledge-voice.test.ts:164` is a good model to port into
`checkFirstPersonLeaks`. Keep all three regex copies byte-identical if you edit.

### WR-03: Leak guard scope excludes `personal.summary`, which is chat-bound prose

**File:** `scripts/build-chat-context.mjs:112-137`
**Issue:** `checkFirstPersonLeaks` walks `about.{intro,p1,p3}`, `experience[]`, and
`projects[].caseStudy`, but not `merged.personal.summary`. `personal.summary`
(from `portfolio-context.static.json`) is full sentence prose that is serialized
verbatim into the `<knowledge>` block and thus reaches the model. It is currently
third-person ("Software engineer who builds… Jack is the solo contract
engineer…"), so there is no live leak, but a first-person edit to the static file
would bypass the tripwire entirely.
**Fix:** Add `["personal.summary", merged.personal?.summary]` to the `targets`
array so the hand-curated identity file is covered by the same guard as the
other prose surfaces.

### WR-04: Stale / self-contradictory file-header docstring in the build generator

**File:** `scripts/build-chat-context.mjs:5-8` (and scope comment `:108`)
**Issue:** The `@fileoverview` "Reads 4 sources" list still names
`src/data/about.ts — ABOUT_INTRO, ABOUT_P1..P3 (D-03)` as source #3, but `main()`
actually reads `about-chat.ts` (third-person variant) and additionally reads
`education.ts` and the `src/content/experience/**` collection — neither of which
appears in the numbered list. The `checkFirstPersonLeaks` scope comment (line 108)
also still says "about.intro/p1/p2/p3" though `p2` no longer exists. A reader
trusting the header would look in the wrong file when debugging chat about-copy.
**Fix:** Update the numbered source list to reflect the real inputs
(`about-chat.ts`, `education.ts`, `experience/**/*.mdx`, `portfolio-context.static.json`,
project MDX + below-fence `Projects/*.md`) and drop the `p2` reference on line 108.

## Info

### IN-01: Type comment mis-attributes `education` to the static JSON

**File:** `src/prompts/portfolio-context-types.ts:15-23`
**Issue:** `education` is grouped under the comment "STATIC keys (from
portfolio-context.static.json -- D-08)", but as of this phase `education` is
sourced from `src/data/education.ts` via `parseEducation` and injected during the
shallow merge; `portfolio-context.static.json` no longer carries an `education`
object. The type shape is still correct — only the provenance comment is stale.
**Fix:** Move the `education` field under a "GENERATED / single-sourced from
education.ts (D-07)" comment, or annotate it inline as sourced from `education.ts`.

### IN-02: Invariant verifier's dependency check is broader than its stated intent

**File:** `scripts/verify-phase25-invariants.mjs:67-79, 129-135`
**Issue:** `normDeps` sorts keys and compares the full stringified object, so the
check trips on any dependency version change or removal, not only additions. The
doc comment says QA-02 "is about detecting ADDED dependencies, not key order." A
legitimate patch-version bump during a later phase task would false-fail the
capstone even though no dependency was added. This is stricter (fail-safe) rather
than incorrect, so it is informational — but the comment should match behavior.
**Fix:** Either narrow the comparison to added keys only (compare key sets), or
update the comment to state that any add/remove/version-change is treated as
drift.

---

_Reviewed: 2026-07-14T20:26:36Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
