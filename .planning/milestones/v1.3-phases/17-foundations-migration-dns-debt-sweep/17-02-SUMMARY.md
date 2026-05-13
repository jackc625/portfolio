---
phase: 17-foundations-migration-dns-debt-sweep
plan: 02
subsystem: infra
tags: [cloudflare, workers-static-assets, migration, wrangler, custom-domain, cors, phase-17]

# Dependency graph
requires:
  - phase: 17-01
    provides: D-15 SSE byte-identical snapshot fixture + 3-test vitest battery (tests/api/sse-snapshot.test.ts, tests/fixtures/sse-snapshot-frames.bin, tests/fixtures/sse-snapshot-headers.json) — the canonical pre-migration ground truth this cutover preserves
  - phase: 16-motion-layer
    provides: D-26 chat regression battery (117/117 GREEN) and untouched src/pages/api/chat.ts SSE surface
provides:
  - Single Cloudflare Worker (jack-cutrara-portfolio) at https://jack-cutrara-portfolio.jackcutrara.workers.dev serving static assets + /api/chat + scheduled() stub from one binding
  - src/worker.ts — custom Worker entrypoint exporting { fetch, scheduled } satisfying ExportedHandler<Env> with Phase 19 forward-compat ctx.waitUntil scheduled stub
  - wrangler.jsonc — Workers Static Assets target shape (main → ./src/worker.ts, [assets], kv_namespaces=CHAT_KV with real IDs, triggers.crons=[], preview_urls=true)
  - CHAT_KV namespace provisioned (production id eaa30fef259e4a6b9505b41bbf3f8f01; preview id 115f3c1b0f8a4a1da9fee78c48dcb749)
  - jackcutrara.com + www.jackcutrara.com Custom Domains attached to the new Worker; D-15 byte-identical verified on both
  - WORKERS_PREVIEW_SUFFIX = ".jackcutrara.workers.dev" replacing PAGES_PREVIEW_SUFFIX in src/lib/validation.ts (account-subdomain-scoped CORS preserved byte-identical to Phase 7 D-9 invariant)
  - Sharpened security.test.ts including explicit reject-https://attacker.workers.dev foreign-account-subdomain test case
  - tests/build/worker-entrypoint.test.ts + tests/build/wrangler-shape.test.ts + tests/build/no-mdx-in-worker-bundle.test.ts (3 new build-time gates verifying FOUND-02 + FOUND-04 forward)
  - Workers Builds Git connection established (push-to-main now triggers Worker build; replaces Pages auto-deploy per D-03)
affects: [17-03, 17-04, 17-05, 17-06, 18, 19, 20]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Custom Worker entrypoint pattern (src/worker.ts) re-exporting Astro adapter handle() — replaces @astrojs/cloudflare/entrypoints/server because the bundled adapter entrypoint exports only { fetch }, blocking a scheduled() handler (Phase 19 forward-compat)"
    - "Account-subdomain-scoped CORS suffix (WORKERS_PREVIEW_SUFFIX) — preserves the exactly-one-non-empty-label-before-suffix invariant from Phase 7 D-9 byte-for-byte; foreign Workers on *.workers.dev cannot bypass because the suffix is the SPECIFIC <account>.workers.dev, not a generic .workers.dev"
    - "Pages-as-warm-rollback cutover (D-02): detach Custom Domain from Pages → attach to Worker; Pages deployment stays live (domain-less) until 24h clean window AND no open regressions"
    - "MDX-bundle audit pattern (tests/build/no-mdx-in-worker-bundle.test.ts): scan dist/**/*.js excluding dist/client/ for a known MDX literal — proves content-collection .mdx files compile to static HTML, never embed in Worker SSR bundle"

key-files:
  created:
    - src/worker.ts
    - tests/build/worker-entrypoint.test.ts
    - tests/build/wrangler-shape.test.ts
    - tests/build/no-mdx-in-worker-bundle.test.ts
  modified:
    - wrangler.jsonc
    - package.json
    - src/lib/validation.ts
    - tests/api/security.test.ts
  deleted:
    - scripts/pages-compat.mjs

key-decisions:
  - "Account-subdomain-scoped WORKERS_PREVIEW_SUFFIX captured AFTER first deploy — the *.workers.dev value is not knowable pre-deploy (RESEARCH Pitfall 4). Captured suffix '.jackcutrara.workers.dev' is account-specific (jackcutrara is the account subdomain); foreign Cloudflare accounts cannot register colliding Worker names that would bypass the allow-list."
  - "Parking-page CNAME on www blocked Custom Domain attach AND caused initial SSL 525 — leftover www → parkingpage.namecheap.com CNAME from Namecheap's parking page had to be deleted before www.jackcutrara.com could attach to the new Worker. Once removed, attach succeeded and Cloudflare auto-provisioned SSL within seconds. (Logged for future migrations to check ALL existing CNAMEs at the apex AND www before flipping Custom Domains.)"
  - "Astro auto-provisioned a SESSION KV namespace (5d7c7a5749e24383a4eb256dd39a4ff4) at build time — declared in dist/server/wrangler.json by the Astro Cloudflare adapter for its session driver, NOT in our checked-in wrangler.jsonc. This is internal to @astrojs/cloudflare and is invisible to FOUND-04 verification. CHAT_KV remains the only KV namespace our code reads/writes; the SESSION namespace is adapter-internal and out of scope for Phases 17-20."
  - "Pre-existing Resend records found on send.jackcutrara.com subdomain (MX send, TXT _dmarc, TXT resend._domainkey, TXT send 'v=spf1 include:amazon...') — but Plan 17-06 expects mail.jackcutrara.com per D-06. Triage decision (re-use send.* vs add fresh mail.*) deferred to Plan 17-06 execution time; outside scope for this plan."
  - "Cloudflare Access policy audit (Q2 RESOLVED) confirmed assumption — Zero Trust was never enabled on this account, so 0 Access policies on portfolio-5wl.pages.dev. Worker preview URLs are public per Cloudflare default, matching prior Pages posture byte-identical. No replication needed before Custom Domain flip."
  - "Sharpened security.test.ts beyond the plan's minimal rename — added an explicit test asserting https://attacker.workers.dev is REJECTED. This guards the foreign-account-subdomain attack vector (T-17-02). The base allow-list logic was unchanged (rename only, no semantic shift), but the test surface is now stronger than pre-migration."
  - "RESEND_API_KEY explicitly NOT re-added in Task 3 per plan D-05 — Resend account creation lives in Plan 17-06. Three secrets re-added: ANTHROPIC_API_KEY (re-keyed from Pages), CHAT_RECIPIENT_EMAIL (jackcutrara@gmail.com), CHAT_SENDER_EMAIL ('Portfolio Chat' <transcripts@mail.jackcutrara.com>)."

patterns-established:
  - "Custom-entrypoint Worker (src/worker.ts re-exporting Astro's handle()) — survives Phase 19's cron addition with a single ./worker.ts edit (no entrypoint change). Future phases that add new exported handlers (queue consumers, durable objects) edit src/worker.ts in place."
  - "Build-time wrangler-shape assertion (tests/build/wrangler-shape.test.ts) — JSONC-aware parsing + 5 structural assertions on wrangler.jsonc. Future phases adding bindings (KV in Phase 18, Phase 20 Resend env-vars) extend the assertion list rather than re-validating ad-hoc."
  - "Build-time MDX-bundle audit (tests/build/no-mdx-in-worker-bundle.test.ts) — content-collection files MUST compile to dist/client HTML and MUST NOT leak into dist/**/*.js SSR bundle. Guards against Astro misconfiguration that would balloon Worker bundle size."
  - "Pages-as-warm-rollback (24h gated window per D-02) — Custom Domain detach from Pages happens FIRST; Pages deployment stays live (domain-less) as instant-rollback path. Production-cutover plans should preserve this pattern for any future migration."

requirements-completed: [FOUND-01, FOUND-02, FOUND-03, FOUND-04, TEST-01, TEST-02]

# Metrics
duration: ~33min (implementation, Task 1 → Task 4) + ~2h (manual checkpoints, Tasks 3 + 5)
completed: 2026-05-10
---

# Phase 17 Plan 02: Pages → Workers Static Assets Migration Summary

**Single Cloudflare Worker (`jack-cutrara-portfolio`) replaced the Pages project as the production deploy target — custom src/worker.ts entrypoint with Phase 19-ready scheduled() stub, wrangler.jsonc rewritten to Workers Static Assets shape with real CHAT_KV namespace IDs, jackcutrara.com + www.jackcutrara.com Custom Domains reattached, D-15 byte-identical SSE verified on BOTH hostnames, D-26 117/117 chat-regression battery still GREEN, parking-page CNAME pitfall identified and fixed inline, Pages deployment kept warm for 24h rollback window.**

## Performance

- **Implementation duration:** ~33 min (Task 1 commit 17:16 EDT → Task 4 commit 17:49 EDT)
- **Total plan duration:** ~5h including manual checkpoints (KV namespace creation, secret re-adds, first wrangler deploy, Workers Builds Git connection, parking-page CNAME removal, Custom Domain attaches, SSL provisioning, end-to-end smoke tests)
- **Started:** 2026-05-10T17:16:07-04:00 (Task 1 commit)
- **Closed out:** 2026-05-10T22:10:21Z
- **Tasks:** 5 total — 3 autonomous code commits + 2 human-action checkpoints (both PASSED)
- **Files created:** 4 (src/worker.ts + 3 build tests)
- **Files modified:** 4 (wrangler.jsonc, package.json, src/lib/validation.ts, tests/api/security.test.ts)
- **Files deleted:** 1 (scripts/pages-compat.mjs)

## Accomplishments

- **FOUND-01 (single-Worker deploy target):** `wrangler deploy` ships static + /api/chat + scheduled handler from a single Worker binding. Pages deployment stays warm as rollback (24h window in progress; user retires manually after clean window per D-02).
- **FOUND-02 (custom Worker entrypoint):** src/worker.ts re-exports Astro's `handle()` for fetch + adds Phase 19-ready scheduled() with ctx.waitUntil wrapper. Replaces the bundled `@astrojs/cloudflare/entrypoints/server` which exports only { fetch } and could not host the scheduled handler Phase 19 requires.
- **FOUND-03 (custom domain reattach):** jackcutrara.com + www.jackcutrara.com both attached from the old Pages project to the new Worker. D-15 byte-identical verified on BOTH hostnames via curl post-flip — headers `content-type: text/event-stream`, `cache-control: no-cache, no-transform`, `connection: keep-alive`, `content-encoding: none` match Plan 17-01 sse-snapshot fixture; frame shape `data: {"text":"..."}` terminated by `data: [DONE]` matches.
- **FOUND-04 (wrangler.jsonc declarations):** [assets] binding="ASSETS" directory="./dist/client", kv_namespaces declares CHAT_KV with real prod ID (`eaa30fef259e4a6b9505b41bbf3f8f01`) + preview ID (`115f3c1b0f8a4a1da9fee78c48dcb749`), triggers.crons=[] (Phase 19 wires schedule), preview_urls=true. New `tests/build/no-mdx-in-worker-bundle.test.ts` verifies MDX content collections compile to static HTML and do NOT leak into the Worker SSR bundle.
- **TEST-01 (D-26 117/117):** Chat regression battery 117/117 GREEN at every checkpoint (post-Task 1, post-Task 2, post-Task 4, post-Task 5). Full pnpm test = 353/354 GREEN with the 1 failure being the pre-existing `tests/content/roadmap-amendment.test.ts` (documented in 17-01 deferred-items.md, NOT a chat-surface regression).
- **TEST-02 (D-15 SSE byte-identical):** Plan 17-01's sse-snapshot battery (3/3 GREEN) held through every Plan 17-02 commit AND end-to-end against the live Worker post-flip — verified via curl on both jackcutrara.com and www.jackcutrara.com.
- **Workers Builds Git connection live:** Push-to-main now triggers a Workers Build (replaces Pages auto-deploy per D-03). User confirmed via Cloudflare dashboard; trial push triggered build successfully within seconds.
- **WORKERS_PREVIEW_SUFFIX rename complete + sharpened:** PAGES_PREVIEW_SUFFIX→WORKERS_PREVIEW_SUFFIX byte-identical logic preservation (rename only per D-14); 5 preview-suffix tests updated to the captured value `.jackcutrara.workers.dev`; sharpened with an explicit `https://attacker.workers.dev REJECTED` test guarding the foreign-account-subdomain attack vector (T-17-02).

## Task Commits

Each task was committed atomically per the plan's `<done>` blocks:

1. **Task 1: src/worker.ts custom entrypoint + Wave-0 build tests (FOUND-02 + FOUND-04 RED gates)** — `54cc8e7` (feat)
   - Commit message: `feat(17-02): add src/worker.ts custom entrypoint + FOUND-02/04 build tests`
   - Files: `src/worker.ts` (+32), `tests/build/worker-entrypoint.test.ts` (+44), `tests/build/wrangler-shape.test.ts` (+57)
   - State at commit: worker-entrypoint 5/5 GREEN; wrangler-shape 4/5 INTENTIONALLY RED (gates Task 2 — the 1 GREEN test is the byte-identical [assets] block preserved from pre-migration).
2. **Task 2: wrangler.jsonc Workers Static Assets shape + delete pages-compat.mjs + audit astro.config + no-mdx-in-worker-bundle test** — `e056619` (feat)
   - Commit message: `feat(17-02): switch wrangler.jsonc to Workers Static Assets, delete pages-compat.mjs`
   - Files: `wrangler.jsonc` (rewrite, +15/-2), `package.json` (build script + dev:worker, +3/-2), `scripts/pages-compat.mjs` (-56, DELETED), `tests/build/no-mdx-in-worker-bundle.test.ts` (+103)
   - State at commit: `pnpm build` succeeds without pages-compat (~12s); `wrangler deploy --dry-run` succeeds (8 modules, 960 KiB); wrangler-shape 5/5 GREEN (RED gate closed); no-mdx-in-worker-bundle 2/2 GREEN; pnpm test 352/353 GREEN (1 pre-existing deferred failure).
3. **Task 3: Manual checkpoint — wrangler secret re-adds + first wrangler deploy + Workers Builds Git connection + Access audit** — *no code commit; manual checkpoint*
   - 3 secrets re-added: ANTHROPIC_API_KEY (re-keyed from Pages), CHAT_RECIPIENT_EMAIL (jackcutrara@gmail.com), CHAT_SENDER_EMAIL (`"Portfolio Chat" <transcripts@mail.jackcutrara.com>`). RESEND_API_KEY deferred to Plan 17-06 per D-05.
   - First `wrangler deploy` succeeded; captured production URL `https://jack-cutrara-portfolio.jackcutrara.workers.dev`; account subdomain = `jackcutrara`; WORKERS_PREVIEW_SUFFIX value = `.jackcutrara.workers.dev`.
   - Workers Builds Git connection established and verified via trial push.
   - Cloudflare Access audit (Step 3b): 0 Access policies — Zero Trust was never enabled on this account; proceeding with Workers preview public per Cloudflare default (matches prior Pages posture).
4. **Task 4: WORKERS_PREVIEW_SUFFIX rename + sharpened security tests + re-deploy + end-to-end SSE verification** — `792dd76` (refactor)
   - Commit message: `refactor(17-02): rename PAGES_PREVIEW_SUFFIX → WORKERS_PREVIEW_SUFFIX (D-14)`
   - Files: `src/lib/validation.ts` (+15/-13), `tests/api/security.test.ts` (+13/-7)
   - State at commit: pnpm test 353/354 GREEN; preview Worker re-deployed with updated CORS; end-to-end curl against `https://jack-cutrara-portfolio.jackcutrara.workers.dev/api/chat` with Origin `https://jackcutrara.com` returned byte-identical SSE headers vs Plan 17-01 fixture.
5. **Task 5: Manual cutover — Custom Domain detach from Pages → attach to Worker + production smoke + 24h warm window opened** — *no code commit; manual checkpoint*
   - jackcutrara.com + www.jackcutrara.com detached from Pages, attached to Worker.
   - Pre-flip pitfall caught: leftover `www → parkingpage.namecheap.com` CNAME (Namecheap parking-page residue) blocked the www Custom Domain attach with "domain already in use" error AND caused initial 525 SSL handshake fail. Deleted parking-page CNAME → www attached cleanly → SSL provisioned automatically within seconds.
   - D-15 byte-identical verified post-flip on BOTH `https://jackcutrara.com/api/chat` and `https://www.jackcutrara.com/api/chat` via curl: `content-type: text/event-stream`, `cache-control: no-cache, no-transform`, `connection: keep-alive`, `content-encoding: none` — all byte-match Plan 17-01 fixture.
   - 24h warm window opened 2026-05-10 ~22:00 UTC; Pages deployment domain-less but live (rollback path per D-02). User retires Pages manually after clean window.

**Plan metadata commit:** *(this commit — SUMMARY.md + STATE.md + ROADMAP.md + REQUIREMENTS.md)*

## Files Created/Modified

| Path | Status | Purpose |
|------|--------|---------|
| `src/worker.ts` | created (+32) | Custom Worker entrypoint exporting `{ fetch, scheduled }` satisfying `ExportedHandler<Env>` (FOUND-02). Imports Astro's `handle()` for fetch; Phase 19-ready scheduled() stub uses `ctx.waitUntil(Promise.resolve())` placeholder with comment naming `deliverDue` substitution target. |
| `wrangler.jsonc` | modified (+15/-2) | Workers Static Assets target shape: `main` → `./src/worker.ts`, `kv_namespaces` declares CHAT_KV (prod `eaa30fef259e4a6b9505b41bbf3f8f01` + preview `115f3c1b0f8a4a1da9fee78c48dcb749`), `triggers.crons: []` (Phase 19 wires schedule), `preview_urls: true`. `$schema`, `name`, `compatibility_date`, `compatibility_flags`, `[assets]` preserved byte-identical from pre-migration. |
| `package.json` | modified (+3/-2) | `build` script trimmed: removed trailing `&& node scripts/pages-compat.mjs`. Added `"dev:worker": "wrangler dev"` after the `dev` script. |
| `scripts/pages-compat.mjs` | deleted (-56) | Pages-coupling shim; Workers Static Assets reads `dist/client/` directly per RESEARCH §"State of the Art". |
| `src/lib/validation.ts` | modified (+15/-13) | Rename `PAGES_PREVIEW_SUFFIX` → `WORKERS_PREVIEW_SUFFIX`. Constant value flipped from `.portfolio-5wl.pages.dev` to `.jackcutrara.workers.dev` (account-subdomain-scoped). Suffix-match logic byte-identical (rename only per D-14). Phase 7 D-9 exactly-one-non-empty-label-before-suffix invariant preserved. |
| `tests/api/security.test.ts` | modified (+13/-7) | 4 preview-suffix tests updated to the `.jackcutrara.workers.dev` value. NEW test added: `https://attacker.workers.dev` REJECTED — guards foreign-account-subdomain attack (T-17-02). |
| `tests/build/worker-entrypoint.test.ts` | created (+44) | 5 build-time assertions on src/worker.ts shape: file exists, imports `handle` from `@astrojs/cloudflare/handler`, exports default with fetch + scheduled, uses `ctx.waitUntil`, names Phase 19 deliverDue substitution target. |
| `tests/build/wrangler-shape.test.ts` | created (+57) | 5 build-time assertions on wrangler.jsonc Workers Static Assets shape: main is `./src/worker.ts`, [assets] preserved, CHAT_KV declared in kv_namespaces, triggers.crons array exists, `preview_urls: true`. JSONC-aware parsing strips comments before `JSON.parse`. |
| `tests/build/no-mdx-in-worker-bundle.test.ts` | created (+103) | 2 build-time assertions verifying MDX content collections do NOT bundle into Worker SSR JS. Scans `dist/**/*.js` excluding `dist/client/` for a known MDX literal (`Problem:`). Skips with clear message if `dist/` absent (post-build dependency surfaced cleanly rather than failing opaquely). |

## Decisions Made

- **Account-subdomain-scoped CORS captured AFTER first deploy** — the `*.workers.dev` value is account-specific and not knowable pre-deploy (RESEARCH Pitfall 4). The captured `.jackcutrara.workers.dev` is the load-bearing scope: foreign Cloudflare accounts cannot register a colliding Worker name on the same suffix and bypass the allow-list.
- **Sharpened security test surface beyond the plan minimum** — added explicit `https://attacker.workers.dev REJECTED` test. The base allow-list logic was preserved byte-identical (rename only, no semantic shift per D-14), but the test surface is now stronger than pre-migration. T-17-02 mitigation is now provably tested rather than provably documented.
- **Pages-as-warm-rollback per D-02** — Custom Domains detached from Pages FIRST, attached to Worker SECOND. Pages deployment stays live (domain-less) for 24h gated window. Retire only after clean window AND no open regressions (NOT a timer per CONTEXT.md A3).
- **Parking-page CNAME inline fix** — encountered during Task 5 step 3, fixed inline (deleted CNAME), proceeded. Documented in Deviations §1 below and lifted into STATE.md decisions for future migration pattern.
- **RESEND_API_KEY explicitly deferred to Plan 17-06** — per D-05, Resend account creation lives in Plan 17-06. Three of four secrets re-added in Task 3; RESEND_API_KEY skipped intentionally with documented forward-pointer.
- **CHAT_KV is our namespace; SESSION KV is adapter-internal** — Astro auto-provisions a SESSION KV namespace (`5d7c7a5749e24383a4eb256dd39a4ff4`) at build time, declared in `dist/server/wrangler.json` by the `@astrojs/cloudflare` adapter for its session driver. This is invisible to FOUND-04 verification (which audits checked-in `wrangler.jsonc`). Phase 18 KV-01 binds CHAT_KV; SESSION is out of scope.
- **No code refactor for "rename only" semantic** — D-14 explicitly required rename only, no logic change. The 8 lines around lines 84-91 in `src/lib/validation.ts` were updated mechanically (string replacement in 3 places + constant rename). Adding any logic was rejected even when tempting (e.g., the sharpened attacker.workers.dev test was added at the TEST surface, not the validation logic).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Parking-page CNAME blocked Custom Domain attach + caused initial SSL 525 on www**

- **Found during:** Task 5 step 3 (Attach Custom Domain to new Worker — `www.jackcutrara.com`)
- **Issue:** Cloudflare dashboard returned "domain already in use" error when attempting to attach `www.jackcutrara.com` to the new Worker. Investigation showed a leftover CNAME record `www → parkingpage.namecheap.com` from Namecheap's parking page (pre-Cloudflare-DNS state). The CNAME was hidden in the DNS zone but Cloudflare's Custom Domain attach treats any existing record at the target hostname as a conflict. After attempting attach (which created a tentative CNAME-style record), the conflicting parking-page CNAME caused initial SSL handshake to fail with HTTP 525 (Cloudflare ↔ Origin SSL handshake failure) because the connection was routing to the wrong target.
- **Why it matters:** Without this catch, www subdomain would have been broken post-flip while jackcutrara.com apex worked — a half-flipped state. D-26 chat regression battery would have surfaced www-specific regressions; D-15 byte-identical verification on www would have failed with handshake errors instead of byte-comparable response.
- **Fix:** Deleted the `www → parkingpage.namecheap.com` CNAME via Cloudflare DNS panel. Retried Custom Domain attach for `www.jackcutrara.com` → success within seconds. Cloudflare auto-provisioned SSL certificate for www automatically. Re-ran D-15 byte-identical curl smoke against `https://www.jackcutrara.com/api/chat` → headers byte-match Plan 17-01 fixture.
- **Files modified:** Cloudflare DNS zone (out-of-repo); no code changes.
- **Verification:** `curl -i https://www.jackcutrara.com/` returns HTTP 200 with `cf-ray` header. `curl -i -X POST https://www.jackcutrara.com/api/chat -H 'Content-Type: application/json' -H 'Origin: https://jackcutrara.com' -d '{"messages":[{"role":"user","content":"Hello"}]}' --no-buffer` returns byte-identical SSE shape vs Plan 17-01 fixture.
- **Committed in:** N/A — manual DNS operation; no code commit.
- **Future-migration impact:** Documented in STATE.md decisions block. Future Custom Domain reattach operations should audit ALL existing CNAMEs at apex AND www (AND any other subdomain being flipped) BEFORE initiating the attach, not after. Parking-page residues are a known class of pitfall when migrating from registrars with parking pages enabled by default.

**2. [Rule 2 - Missing Critical] Sharpened security.test.ts with explicit foreign-account-subdomain reject test**

- **Found during:** Task 4 (security.test.ts rename)
- **Issue:** The plan called for mechanical PAGES→WORKERS suffix substitution in 4 baseline tests but did NOT mandate an explicit test for the foreign-account-subdomain attack vector (`https://attacker.workers.dev` — a Worker on someone else's Cloudflare account). The CORS suffix logic implicitly rejects this (the suffix is account-specific `.jackcutrara.workers.dev` not generic `.workers.dev`), but it was not provably tested.
- **Why it matters:** T-17-02 mitigation in the threat model relied on the suffix-confusion test, but that test asserts `https://evil.<account>.workers.dev.attacker.com` (a domain-confusion attack ending elsewhere). A separate attack vector — a *real* foreign Cloudflare account-subdomain — was untested. Rule 2 applies: security correctness requirement absent from the implementation/test surface.
- **Fix:** Added explicit test case `rejects https://attacker.workers.dev (foreign account-subdomain attack)` asserting `isAllowedOrigin("https://attacker.workers.dev") === false`. Logic unchanged (the existing suffix-check already rejects it because `attacker.workers.dev` does not end with `.jackcutrara.workers.dev`); the test makes the mitigation provable.
- **Files modified:** `tests/api/security.test.ts` (+1 test case, +5 lines).
- **Verification:** `pnpm test tests/api/security.test.ts` → all preview-suffix tests GREEN including the new foreign-account test.
- **Committed in:** `792dd76` (Task 4 commit).

---

**Total deviations:** 2 auto-fixed (1 Rule 3 blocking — parking-page CNAME conflict; 1 Rule 2 missing critical — sharpened security test). Plus 1 pre-existing deferred test failure (NOT caused by Plan 17-02) carried forward from Plan 17-01's deferred-items.md.
**Impact on plan:** Deviation §1 was a real-world DNS pitfall surfaced during manual cutover and resolved inline; documented for future migration patterns. Deviation §2 hardens the test surface beyond the plan minimum without changing production logic. Neither was scope creep; both were correctness requirements.

## Issues Encountered

- **Astro auto-provisioned SESSION KV namespace observed in dist/server/wrangler.json:** Discovered during `wrangler deploy --dry-run` output review — the deployed bundle declared a `SESSION` KV binding (`5d7c7a5749e24383a4eb256dd39a4ff4`) NOT declared in our checked-in `wrangler.jsonc`. Investigation: `@astrojs/cloudflare` adapter auto-injects a SESSION binding for its session-driver feature; the namespace ID is auto-generated at build time and lives in `dist/server/wrangler.json` (which wrangler reads in preference to the source `wrangler.jsonc` because the adapter's emitted file is the "compiled" config). This is adapter-internal and out of scope for Plan 17-02. Future plans that bind their own SESSION-named KV would conflict; CHAT_KV (Phase 18) is safe. Documented in STATE.md decisions for downstream phases.
- **Pre-existing Resend records found on send.jackcutrara.com subdomain:** When auditing DNS pre-flip, observed existing records on the `send.` subdomain (MX `send.`, TXT `_dmarc`, TXT `resend._domainkey`, TXT `send "v=spf1 include:amazon..."`). These appear to be pre-existing Resend SES setup on the `send.` subdomain — but Plan 17-06 D-06 spec'd `mail.jackcutrara.com` as the canonical sending subdomain. Mismatch flagged for triage at Plan 17-06 time (re-use existing send.* records vs add fresh mail.* records). Out of scope for Plan 17-02; logged to STATE.md decisions for Plan 17-06 to handle.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: cors-suffix-account-coupling | src/lib/validation.ts | `WORKERS_PREVIEW_SUFFIX = ".jackcutrara.workers.dev"` is now coupled to Cloudflare account subdomain `jackcutrara`. If the account is ever renamed (Cloudflare allows account subdomain changes), the constant breaks silently — preview hostnames would 403 with `cors_origin_not_allowed`. Mitigation: comment in validation.ts states "VALUE captured from first *.workers.dev preview deploy on 2026-05-10" and "If the Worker is ever renamed, update this constant in lockstep." Future account-rename runbook should include this constant. |
| threat_flag: adapter-internal-kv-binding | dist/server/wrangler.json (Astro emits) | Astro Cloudflare adapter auto-injects SESSION KV binding (id `5d7c7a5749e24383a4eb256dd39a4ff4`). Not in checked-in wrangler.jsonc. Future plans MUST NOT name their own KV binding `SESSION` — would conflict. CHAT_KV (Phase 18) is safe; pattern: prefix custom bindings with CHAT_*. |
| threat_flag: pages-rollback-window-active | jackcutrara.com Custom Domain | Pages deployment stays warm (domain-less but live) until manual retire. During the 24h gated window, an accidental re-attach to Pages from the Cloudflare dashboard would silently roll back. Mitigation: dashboard access is owner-only; D-02 explicitly tracks the window as gated-not-timer. User retires manually after clean window AND no open regressions. |

## Self-Check

Verifications performed before recording PASS:

- File `.planning/phases/17-foundations-migration-dns-debt-sweep/17-02-SUMMARY.md` — EXISTS (this file).
- Commit `54cc8e7` (Task 1 — feat src/worker.ts + build tests): `git log --oneline --all | grep 54cc8e7` → FOUND.
- Commit `e056619` (Task 2 — feat wrangler.jsonc + delete pages-compat): `git log --oneline --all | grep e056619` → FOUND.
- Commit `792dd76` (Task 4 — refactor WORKERS_PREVIEW_SUFFIX rename): `git log --oneline --all | grep 792dd76` → FOUND.
- File `src/worker.ts` EXISTS (created in Task 1).
- File `scripts/pages-compat.mjs` DOES NOT exist (deleted in Task 2).
- File `tests/build/worker-entrypoint.test.ts` EXISTS (created in Task 1).
- File `tests/build/wrangler-shape.test.ts` EXISTS (created in Task 1).
- File `tests/build/no-mdx-in-worker-bundle.test.ts` EXISTS (created in Task 2).
- Production Worker URL `https://jack-cutrara-portfolio.jackcutrara.workers.dev` — verified via curl (Task 4 step 5).
- Production Custom Domains `https://jackcutrara.com` + `https://www.jackcutrara.com` — verified via curl (Task 5 step 4) — both return D-15 byte-identical SSE.
- Workers Builds Git connection — verified by user via Cloudflare dashboard + trial push (Task 3 step 3).
- 3 secrets present in Worker — verified via `npx wrangler secret list` (Task 3 step 1): ANTHROPIC_API_KEY, CHAT_RECIPIENT_EMAIL, CHAT_SENDER_EMAIL.
- D-26 117/117 chat-regression battery — GREEN at every checkpoint (post-Task 1, post-Task 2, post-Task 4, post-Task 5).
- D-15 SSE byte-identical (Plan 17-01 fixture) — GREEN on `*.workers.dev` preview Worker AND on production `jackcutrara.com` + `www.jackcutrara.com` post-flip.

## Self-Check: PASSED

## Next Phase Readiness

- **Plan 17-03 (Wave 2 — Chat-surface tech debt: DEBT-04 idempotent astro:page-load listeners + DEBT-05 CSS-only #chat-panel state machine) is unblocked.** It can now mutate `src/scripts/chat.ts`, `src/scripts/analytics.ts`, `src/scripts/scroll-depth.ts`, and global.css against the live Worker. Each Plan 17-03 commit must re-verify D-26 117/117 (unchanged from pre-migration — chat-surface tests run against unit-test mocks, not the Worker runtime).
- **Pages retirement is PENDING** — 24h warm window opened ~2026-05-10 22:00 UTC. User retires manually after clean window AND no open regressions (NOT a timer per CONTEXT.md A3). FOUND-03's "Pages retired" sub-goal is `pending — 24h warm window in progress` in REQUIREMENTS.md.
- **Phase 18 (KV write path) forward-readiness:** CHAT_KV is provisioned and bound (prod id `eaa30fef259e4a6b9505b41bbf3f8f01`, preview id `115f3c1b0f8a4a1da9fee78c48dcb749`). Phase 18 KV-01 will declare the binding usage in code (`src/lib/chat-transcripts.ts`); the namespace itself is ready. SESSION KV (adapter-internal) is documented as out-of-scope for our code; future bindings must NOT name themselves SESSION.
- **Phase 19 (cron sweep) forward-readiness:** `src/worker.ts` scheduled() handler is wired with `ctx.waitUntil(Promise.resolve())` placeholder + comment naming the Phase 19 `deliverDue` substitution target. `wrangler.jsonc` triggers.crons is `[]` ready to be set to `["0 * * * *"]` in Phase 19.
- **Phase 20 (Resend integration) forward-pointer:** RESEND_API_KEY explicitly deferred to Plan 17-06 per D-05 — not blocked. CHAT_RECIPIENT_EMAIL + CHAT_SENDER_EMAIL secrets are pre-set on the Worker so Plan 17-06 only adds RESEND_API_KEY.
- **Plan 17-06 DNS triage open:** Pre-existing Resend records on `send.jackcutrara.com` subdomain conflict with the D-06 spec'd `mail.jackcutrara.com`. Decision (re-use vs add fresh) deferred to Plan 17-06 execution time.

---
*Phase: 17-foundations-migration-dns-debt-sweep*
*Plan: 17-02*
*Completed: 2026-05-10*
