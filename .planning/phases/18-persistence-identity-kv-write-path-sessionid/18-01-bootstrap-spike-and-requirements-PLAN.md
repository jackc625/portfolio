---
phase: 18-persistence-identity-kv-write-path-sessionid
plan: 01
type: execute
wave: 0
depends_on: []
files_modified:
  - .planning/REQUIREMENTS.md
  - .planning/phases/18-persistence-identity-kv-write-path-sessionid/SPIKE-ctx-access-path.md
autonomous: true
requirements: [KV-05]
must_haves:
  truths:
    - "REQUIREMENTS.md contains KV-05 (per-sessionId write quota, 100 writes / rolling 1h, inline metadata) with B6 sub-version changelog entry"
    - "REQUIREMENTS.md IDENT-02 text amended with D-04 missing-tolerance branch language"
    - "REQUIREMENTS.md Traceability table lists KV-05 → Phase 18 → Pending"
    - "SPIKE-ctx-access-path.md records the verified Astro adapter binding path (e.g., locals.runtime.ctx) for ctx.waitUntil access in api/chat.ts"
  artifacts:
    - path: ".planning/REQUIREMENTS.md"
      provides: "KV-05 requirement entry + amended IDENT-02 + KV-05 row in Traceability table"
      contains: "KV-05"
    - path: ".planning/phases/18-persistence-identity-kv-write-path-sessionid/SPIKE-ctx-access-path.md"
      provides: "Plan-time resolution of Pitfall 8 — exact path to ExecutionContext from Astro APIRoute locals"
  key_links:
    - from: "REQUIREMENTS.md KV-05 requirement"
      to: "Phase 18 plans implementing KV-05"
      via: "shared requirement ID in plan frontmatter `requirements:` field"
      pattern: "KV-05"
    - from: "SPIKE-ctx-access-path.md verified binding name"
      to: "Plan 18-05 api/chat.ts wiring task"
      via: "literal binding-path string copied into 18-05 task action"
      pattern: "locals\\.runtime\\.ctx|locals\\.cfContext|executionContext"
---

<objective>
Land two prerequisites that every downstream Phase 18 plan depends on:
1. Add NEW REQUIREMENT KV-05 (per-sessionId write quota) to `.planning/REQUIREMENTS.md` per D-12, including parameters chosen at plan-time from RESEARCH.md (100 writes per sessionId per rolling 1-hour window, stored inline in KV metadata as `{ window_started_at, window_count }`). Amend IDENT-02 text per D-04 to record the missing-tolerance branch. Both edits land with the B6 sub-version changelog convention.
2. Resolve RESEARCH § Pitfall 8 / Open Question Q1 — the exact path used in Astro APIRoute `locals` for the Cloudflare ExecutionContext (`ctx.waitUntil` access). Verify against `@astrojs/cloudflare@13.1.7` source by reading `node_modules/@astrojs/cloudflare/dist` types and/or running a 5-line `console.log(Object.keys(locals.runtime ?? {}))` against `astro dev`. Record the resolution in `SPIKE-ctx-access-path.md` so Plan 18-05 (api/chat.ts wiring) copies a known-good path string instead of guessing.

Purpose: Eliminates Phase 18 plan ambiguity. Every plan after this one references KV-05 in `requirements:` frontmatter, and the api/chat.ts wiring uses the exact binding path verified here. Skipping the spike pushes risk into Plan 18-05 where the cost of being wrong is a D-26 chat-surface regression at the most-watched commit of the phase.

Output: Updated REQUIREMENTS.md with KV-05 + IDENT-02 amendment + Traceability row + B6 changelog footer; new `SPIKE-ctx-access-path.md` recording the verified path.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/REQUIREMENTS.md
@.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-CONTEXT.md
@.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-RESEARCH.md
@.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-PATTERNS.md
@.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-VALIDATION.md
</context>

<interfaces>
<!-- KV-05 parameters locked at plan-time from RESEARCH § KV-05 quota recommendation -->
<!-- Inline-metadata storage shape — no sibling key -->

KV-05 quota state shape (recorded in KV metadata alongside last_activity_at / msg_count):

  type KVMetadata = {
    last_activity_at: string;     // ISO 8601
    msg_count: number;            // current transcript message count
    window_started_at: string;    // ISO 8601 — start of the current rolling 1h window
    window_count: number;         // appendTurn calls observed in current window
  };

KV-05 enforcement:
- Cap: 100 writes per sessionId per rolling 1-hour window.
- Storage: inline in `metadata` (1024-byte cap; the four fields above serialize to ~130 bytes — comfortable margin).
- On overflow (window_count >= 100): emit `console.warn("chat.transcript.quota_exceeded", { sessionId, count_in_window })` and RETURN before put(); caller (ctx.waitUntil) sees a resolved promise, no error.
- On window expiry (current_time - window_started_at >= 1h): reset window_started_at = now, window_count = 1.
- Race policy (Pitfall 7): lossy increment accepted per D-13 last-writer-wins — quota is a guard, not a precise threshold.

IDENT-02 amendment per D-04:
- Old text: "Server validates sessionId as UUIDv4 regex in `src/lib/validation.ts`. Rejects malformed."
- Amended language: server validates sessionId as UUIDv4 IF PRESENT; ABSENT sessionId is acceptable (server skips appendTurn entirely while still serving the SSE stream); PRESENT-but-malformed sessionId → 400 invalid_request.

B6 sub-version changelog convention:
- Add a date-stamped footer entry: "v1.3-B6 (2026-05-11) — Plan 18-01: added KV-05 (per-sessionId write quota, 100 writes / rolling 1h, inline metadata); amended IDENT-02 to record D-04 missing-tolerance branch."
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Run ExecutionContext access path spike — record verified binding location</name>
  <files>.planning/phases/18-persistence-identity-kv-write-path-sessionid/SPIKE-ctx-access-path.md</files>
  <read_first>
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-RESEARCH.md (§ Pitfall 8 — "Astro APIRoute `locals.runtime.ctx` binding name versions"; § Component Responsibilities row for SSE chat endpoint)
    - src/pages/api/chat.ts (existing `({ request })` destructure on line 15 — Phase 18 will add `locals`)
    - node_modules/@astrojs/cloudflare/dist/index.d.ts (adapter type surface — confirm `Runtime` / `Locals` shape)
    - node_modules/@astrojs/cloudflare/dist/entrypoints/server.js (or equivalent — confirm how the runtime object is hung off locals)
  </read_first>
  <action>
Resolve RESEARCH § Pitfall 8. Read `node_modules/@astrojs/cloudflare/dist/index.d.ts` and any exported runtime/types files (use Grep for `runtime`, `ExecutionContext`, `waitUntil`, `cfContext` across `node_modules/@astrojs/cloudflare/dist`). Identify which property hangs `ExecutionContext` off `locals`:
  - Candidate A: `locals.runtime.ctx` (current adapter convention)
  - Candidate B: `locals.cfContext` (architectural research naming)
  - Candidate C: `locals.runtime` IS the ExecutionContext directly
  - Candidate D: import `executionContext` from `cloudflare:workers` virtual module

If types alone do not unambiguously identify the path, write a temporary 5-line dev probe in `src/pages/api/chat.ts` (BEFORE the existing `isAllowedOrigin` check) of the form: `console.log("ctx-access-spike", { locals_keys: Object.keys(locals ?? {}), runtime_keys: locals?.runtime ? Object.keys(locals.runtime) : "absent" });` — run `pnpm dev:worker` (worker dev — `astro dev` does not mount the @astrojs/cloudflare runtime per CONTEXT.md). Hit POST /api/chat once with curl or via the chat bubble, capture the log output, then REVERT the probe.

Write `.planning/phases/18-persistence-identity-kv-write-path-sessionid/SPIKE-ctx-access-path.md` with these sections (use exact markdown headings):
  1. `## Verified path` — the literal TypeScript expression Plan 18-05 should use (e.g., `const ctx = locals.runtime.ctx;`). Include the full TypeScript type annotation if the adapter provides one.
  2. `## Evidence` — the snippet from the d.ts file OR the dev-probe log output that proves the path. Reference the source-file path and line numbers.
  3. `## Alternative if primary unavailable` — fallback option (typically Candidate D: virtual-module `executionContext` import) plus a one-line cost statement.
  4. `## Plan 18-05 import & destructure pattern` — the exact APIRoute signature change ready to copy: `export const POST: APIRoute = async ({ request, locals }) => { const ctx = <verified-path>; ... };`.

If a temporary dev probe was written, the same task MUST also delete the probe before completing (verify with `git diff src/pages/api/chat.ts` — output must be empty).
  </action>
  <verify>
    <automated>node -e "const fs = require('fs'); const f = fs.readFileSync('.planning/phases/18-persistence-identity-kv-write-path-sessionid/SPIKE-ctx-access-path.md', 'utf8'); if (!/## Verified path/.test(f)) process.exit(1); if (!/## Evidence/.test(f)) process.exit(1); if (!/## Plan 18-05 import & destructure pattern/.test(f)) process.exit(1); if (!/locals|executionContext/.test(f)) process.exit(1); process.exit(0);" && git diff --exit-code src/pages/api/chat.ts</automated>
  </verify>
  <done>SPIKE-ctx-access-path.md exists at the phase-dir path with all 4 required sections. The ## Verified path section names a concrete TypeScript expression Plan 18-05 can copy verbatim. `git diff --exit-code src/pages/api/chat.ts` exits 0 (no leftover probe code).</done>
</task>

<task type="auto">
  <name>Task 2: Add KV-05 to REQUIREMENTS.md with locked parameters (per D-12) + B6 changelog</name>
  <files>.planning/REQUIREMENTS.md</files>
  <read_first>
    - .planning/REQUIREMENTS.md (current KV-01..04 block at lines 23-28; IDENT-01..02 block at lines 30-33; Traceability table at lines 120-156; existing footer changelog convention near line 165+)
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-CONTEXT.md (D-12 — KV-05 lives, planner picks parameters; D-04 — IDENT-02 amendment)
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-RESEARCH.md (§ KV-05 quota storage shape recommendation — 100 writes / rolling 1h / inline metadata)
  </read_first>
  <action>
Per D-12, add NEW REQUIREMENT KV-05 to `.planning/REQUIREMENTS.md` in the `### Persistence — KV Write Path (KV-)` section, immediately after the existing KV-04 entry (around line 28). Use this exact text (RESEARCH-recommended parameters: 100 writes per sessionId per rolling 1-hour window, stored inline in KV metadata):

```
- [ ] **KV-05** — Per-sessionId write quota: `appendTurn` call count tracked in KV `metadata` as `{ window_started_at, window_count }` (inline, NOT a sibling key — cheaper, more cohesive). Hard cap of 100 writes per sessionId per rolling 1-hour window. On overflow, server emits `console.warn("chat.transcript.quota_exceeded", { sessionId, count_in_window })` and continues serving the SSE stream silently (same UX posture as D-09 silent-fail). Race policy: last-writer-wins per D-13 — lossy concurrent-write counter is acceptable at v1.3 scale. Distinct from the locked-deferred per-IP rate limit (v1.4+); KV-05 protects against scripted resubmits within an authenticated session.
```

Per D-04, AMEND the existing IDENT-02 text at line 33. Read the current line 33 text first. Replace its entire content with this exact text (rephrases per D-04, retains the "NEVER threaded into Anthropic" critical invariant):

```
- [ ] **IDENT-02** — Server validates sessionId as UUIDv4 in `src/lib/validation.ts` (`z.uuidv4().optional()` per Zod v4 — version-specific match for IDENT-02's "UUIDv4 regex" wording). **Missing-tolerance branch (D-04 amendment):** absent sessionId is acceptable — server skips `ctx.waitUntil(appendTurn(...))` calls entirely and still serves the Anthropic SSE stream (chat UX preserved per D-26). Present-but-malformed sessionId → 400 invalid_request (original IDENT-02 contract). **sessionId is NEVER threaded into the Anthropic message payload** — preserves prompt cache hit rate. Lives on the HTTP envelope only. *Amended 2026-05-11 (v1.3-B6 / Plan 18-01) per CONTEXT.md D-04.*
```

In the Traceability table (around line 120-156), insert a new row immediately after the KV-04 row (between lines 140 and 141):

```
| KV-05 | Phase 18 | Pending |
```

Update the `**Coverage:**` line (around line 158) — increment the count from `35 / 35` to `36 / 36`. Update the parenthetical to read: `(29 v1.3 baseline requirements + 4 UAT-GAP gap-closure requirements + 3 cross-phase TEST gates)`.

Append a new B6 sub-version changelog entry to the footer history below the `*Last updated:*` paragraph. Place it as the NEW first item directly under `*Last updated: 2026-05-11 — ...*`. Use this exact text:

```

v1.3-B6 (2026-05-11) — Plan 18-01 amendment: added KV-05 (per-sessionId write quota; 100 writes per rolling 1-hour window; storage inline in KV metadata as `{ window_started_at, window_count }`; overflow → silent log + skip put per D-09 posture); amended IDENT-02 to record the D-04 missing-tolerance branch (absent sessionId acceptable; malformed sessionId still → 400). No other requirement text changed.
```

Do NOT touch the rest of the file — every other line stays byte-identical. Verify with `git diff .planning/REQUIREMENTS.md` and confirm the changes are confined to the four sites above.
  </action>
  <verify>
    <automated>node -e "const fs = require('fs'); const f = fs.readFileSync('.planning/REQUIREMENTS.md', 'utf8'); const checks = [/\*\*KV-05\*\*.*per-sessionId write quota/i.test(f), /\*\*KV-05\*\*.*100 writes/i.test(f), /\*\*KV-05\*\*.*window_started_at/i.test(f), /\*\*IDENT-02\*\*.*Missing-tolerance branch \(D-04 amendment\)/i.test(f), /\| KV-05 \| Phase 18 \| Pending \|/i.test(f), /Coverage:\*\*\s*36\s*\/\s*36/i.test(f), /v1\.3-B6/.test(f), /29 v1\.3 baseline requirements/.test(f)]; const failedIdx = checks.findIndex(c => !c); if (failedIdx >= 0) { console.error('Check ' + failedIdx + ' failed'); process.exit(1); } process.exit(0);"</automated>
  </verify>
  <done>REQUIREMENTS.md contains KV-05 with locked parameters (100/1h/inline metadata), amended IDENT-02 with D-04 missing-tolerance language, new traceability row `| KV-05 | Phase 18 | Pending |`, Coverage updated to 36/36 with "29 v1.3 baseline requirements" parenthetical, and a new v1.3-B6 footer changelog entry.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| filesystem (no runtime crossing) | This plan only touches planning docs + writes one spike report. No runtime code path is added. No new trust boundary crossed; existing api/chat.ts trust posture unchanged. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-18-01-01 | Tampering | REQUIREMENTS.md / SPIKE-ctx-access-path.md edits | accept | Plan operates on planning artifacts only; no runtime trust surface added. Git history is the audit trail per B6 sub-version changelog convention. |
| T-18-01-02 | Information Disclosure | Temporary dev probe (`console.log("ctx-access-spike", ...)`) | mitigate | Task 1 mandates probe REVERT before task completion + `git diff --exit-code src/pages/api/chat.ts` automated verify. If probe stays in source, automated verify fails → task incomplete. No secrets in probe (just key names of `locals.runtime`). |
| T-18-01-03 | Repudiation | KV-05 / IDENT-02 amendment provenance | mitigate | B6 sub-version changelog entry timestamps the amendment with plan ID. Forward-defense test for KV-05 / IDENT-02 amendment text presence COULD be added under tests/build/requirements-shape.test.ts (per PATTERNS.md "Optional" — planner declines for this plan; the changelog footer is sufficient durable signal since /gsd-plan-phase / /gsd-execute-phase both read REQUIREMENTS.md by reference). |

ASVS L1 mapping for this plan: V14 Configuration (planning-doc amendment provenance) — entire scope. V3/V5/V6/V7/V13 — NOT EXERCISED by this plan (planning-doc-only).
</threat_model>

<verification>
**Plan-end checks (both must pass):**

1. `node -e "const fs = require('fs'); ['./.planning/REQUIREMENTS.md', './.planning/phases/18-persistence-identity-kv-write-path-sessionid/SPIKE-ctx-access-path.md'].forEach(p => fs.statSync(p));"` — both files present.
2. `git diff --exit-code src/pages/api/chat.ts src/scripts/chat.ts src/lib/validation.ts src/lib/chat-transcripts.ts tests/ wrangler.jsonc` exits 0 — Plan 18-01 must NOT touch any runtime / test / config files.

D-26 chat regression battery + `pnpm exec astro check` 0/0/0 — informational only for this plan (no chat-surface code touched). Carry-forward baseline: 419 PASS / 0 FAIL / 2 SKIP.
</verification>

<success_criteria>
- REQUIREMENTS.md committed with KV-05 entry, amended IDENT-02 text, new Traceability row, Coverage = 36/36, and v1.3-B6 changelog footer.
- SPIKE-ctx-access-path.md committed with `## Verified path` / `## Evidence` / `## Alternative if primary unavailable` / `## Plan 18-05 import & destructure pattern` sections.
- Source tree untouched (no leftover dev probe, no runtime edits — Plan 18-01 is planning-doc-and-spike-only).
- Plan 18-05 (api/chat.ts wiring) can copy the verified `ctx` access expression verbatim from the spike file.
</success_criteria>

<output>
After completion, create `.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-01-SUMMARY.md` recording:
- Verified ctx-access path (exact TypeScript expression)
- The KV-05 parameter values committed (100 / 1h / inline metadata as `{ window_started_at, window_count }`)
- IDENT-02 amendment language committed (D-04 missing-tolerance branch)
- B6 changelog entry text
- Test count baseline carry-forward (419 PASS / 0 FAIL / 2 SKIP — unchanged; this plan touches no runtime / test code)
- `astro check` baseline carry-forward (0/0/0 — unchanged)
- Confirmation `git diff --exit-code src/pages/api/chat.ts` exits 0 at plan close
</output>
