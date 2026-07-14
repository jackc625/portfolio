---
status: complete
phase: 24-positioning-shift-home-teaser
source: [24-01-SUMMARY.md, 24-02-SUMMARY.md, 24-03-SUMMARY.md, 24-04-SUMMARY.md]
started: 2026-07-14T13:03:00Z
updated: 2026-07-14T13:21:00Z
---

## Current Test

[testing complete — 13 passed, 1 issue found + fixed inline (P2 removal, verified green)]

## Tests

### 1. Home experience teaser + positioning shift
expected: Home opens with the 01 EXPERIENCE Holloway teaser (role/company/dates + 1,400 metric + "See the experience →" to /experience); sections read 01/02/03/04; Home ABOUT preview shows the revised intro + P1. Overall the page leads with software-engineer-with-production-experience positioning.
result: pass

### 2. /about copy register (POS-01/02 — human judgment)
expected: /about copy reads as an honest new-grad software engineer with shipped production experience — first person, positions production work + Holloway + a recently-finished B.S. + a full-time-search close. No self-applied "junior" / "senior" / "5+ years" label.
result: pass
history: |
  Reviewed as an issue first — Jack asked to remove the second body paragraph
  ("I reach for the boring tool first...", ABOUT_P2). Change applied + verified
  inline during this UAT (see Gaps: change_requested → resolved). After the
  removal the /about register reads as Jack wants, so this checkpoint passes.
severity: minor

### 3. OG social card (POS-04 / D-16 — human judgment)
expected: public/og-default.png is a real 1200×630 editorial card in true Geist / Geist Mono on the six-token palette — "Jack Cutrara." with the accent-red period, "SOFTWARE ENGINEER", "Reliable, production-grade software.", JACKCUTRARA.COM / PORTFOLIO / 2026 rules. Reads on-brand, not a placeholder or Arial fallback.
result: pass

### 4. education.ts SSoT + derived schema fragments (24-01 D1)
expected: src/data/education.ts is the single source of truth (EDUCATION facts + CREDENTIALS + derived alumniOf/hasCredential schema); VT is alumniOf only, never a credential.
result: pass
source: automated
coverage_id: 24-01-D1

### 5. Zero em dashes in education.ts (24-01 D2)
expected: education.ts contains zero U+2014 em dashes.
result: pass
source: automated
coverage_id: 24-01-D2

### 6. Gate E chat-surface tripwire strengthened (24-01 D3)
expected: chat-surface-untouched gate pins 11 anchors over BaseLayout.astro (SEO + ChatWidget + client scripts).
result: pass
source: automated
coverage_id: 24-01-D3

### 7. Phase-start invariant baseline + verifier (24-01 D4)
expected: node scripts/verify-phase24-invariants.mjs exits 0 (8 protected files + dependencies byte-identical to the phase-start baseline).
result: pass
source: automated
coverage_id: 24-01-D4

### 8. Home teaser structure render gate (24-02 HOME-01)
expected: Home opens with the concise 01 EXPERIENCE Holloway teaser (role/company/dates + 1,400 metric + /experience link). Verified via home-teaser-render gate AND live DOM snapshot.
result: pass
source: automated
coverage_id: 24-02-HOME-01

### 9. Section sequence 01/02/03/04 + em-dash-clean ContactSection (24-02 POS-01)
expected: Section labels read the exact 01 EXPERIENCE / 02 WORK / 03 ABOUT / 04 CONTACT sequence; ContactSection.astro em-dash-clean. Verified via render gate AND live DOM snapshot.
result: pass
source: automated
coverage_id: 24-02-POS-01

### 10. personSchema enrichment + sharpened SEO description (24-02 POS-04)
expected: personSchema carries jobTitle + alumniOf (WGU + VT) + hasCredential (LPI); rendered meta description non-empty, em-dash-free, distinct from the hero lead.
result: pass
source: automated
coverage_id: 24-02-POS-04

### 11. About revision propagates to Home ABOUT preview (24-03 D2)
expected: Revised ABOUT_INTRO + ABOUT_P1 propagate to the Home ABOUT preview via the shared about.ts SSoT (no index.astro copy edit). Auto-verified via live DOM snapshot of the Home § 03 ABOUT region.
result: pass
source: automated
coverage_id: 24-03-D2

### 12. /about Education block — four facts, non-interactive (24-03 D3)
expected: /about shows a compact EDUCATION block with all four visible facts (B.S. Computer Science · Western Governors University · May 2026, "Transferred from Virginia Tech" sub-note, LPI Linux Essentials), no accent affordance. Auto-verified via /about screenshot + render gate.
result: pass
source: automated
coverage_id: 24-03-D3

### 13. Gate A — site-copy em-dash + register banlist (24-04 D2)
expected: Zero U+2014 em dashes across all five voice-gate-unscanned files; zero self-applied seniority register words (junior/senior/5+ years) in about.ts / about.astro / index.astro.
result: pass
source: automated
coverage_id: 24-04-D2

### 14. Phase-wide invariants + Person JSON-LD hold (24-04 D3)
expected: node scripts/verify-phase24-invariants.mjs exit 0; standalone Person schema validates (jobTitle Software Engineer, alumniOf WGU + Virginia Tech, hasCredential WGU B.S. + LPI; VT never a credential). Validator.schema.org sign-off recorded during execution.
result: pass
source: automated
coverage_id: 24-04-D3

## Summary

total: 14
passed: 14
issues: 0
pending: 0
skipped: 0
blocked: 0
note: Test 2 was reviewed as an issue (P2 removal) and resolved inline; final result pass. Full history retained under Gaps + Test 2 history.

## Gaps

- truth: "/about body reads as Jack wants it (P2 'boring tool first' paragraph removed)"
  status: resolved
  reason: "User reported: I don't like the second paragraph. Can you just remove it altogether. Confirmed target = ABOUT_P2 ('I reach for the boring tool first...')."
  severity: minor
  test: 2
  root_cause: "Owner copy preference (not a defect). ABOUT_P2 was kept verbatim per D-06; owner now chooses to drop it."
  artifacts:
    - path: "src/data/about.ts"
      issue: "Delete the ABOUT_P2 export; update the D-06 doc-comment line"
    - path: "src/pages/about.astro"
      issue: "Remove ABOUT_P2 from the import + the <p>{ABOUT_P2}</p> render"
    - path: "tests/client/about-data.test.ts"
      issue: "Remove ABOUT_P2 import, its truthy assertion, and the P2 word-count test"
  missing:
    - "Delete ABOUT_P2 (src/data/about.ts) + fix doc comment"
    - "Remove P2 import + render (src/pages/about.astro)"
    - "Remove P2 assertions/test (tests/client/about-data.test.ts)"
    - "Re-run about-data + about-education-render + Gate A + astro check"
  debug_session: ""
  resolution: |
    RESOLVED (applied inline during UAT — trivial known fix, no planner needed).
    Edited src/data/about.ts (removed ABOUT_P2 export + updated doc comment),
    src/pages/about.astro (removed P2 import + <p>{ABOUT_P2}</p>), and
    tests/client/about-data.test.ts (removed P2 import, truthy assertion, and the
    P2 word-count test; "all four exports" -> "all three exports").
    NOT touched: scripts/build-chat-context.mjs (phase-24 protected file; its
    parseAboutExports still lists ABOUT_P2 but is dead code — the chat about block
    is built from about-chat.ts, so portfolio-context.json is byte-identical and
    the chat surface is untouched, D-19 preserved).
    Verification (all green): pnpm build OK; astro check 0/0/0; full suite 676
    passed / 2 skipped (one fewer than pre-fix = the removed P2 word-count test);
    verify-phase24-invariants exit 0 (portfolio-context.json byte-identical);
    verify-phase24-og exit 0; /about re-screenshotted (P2 gone, clean flow).
    Status: applied + verified in working tree; NOT yet committed (on main; awaiting
    Jack's go-ahead per commit policy).
