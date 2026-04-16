---
status: diagnosed
trigger: "On fresh pnpm dev, Vite dep optimizer throws 'file does not exist in optimize deps directory' errors on first requests before settling. Site still renders. Production builds clean."
created: 2026-04-15T17:50:00Z
updated: 2026-04-15T17:55:00Z
---

## Current Focus

hypothesis: Vite dep-optimizer cold-start race — SSR pipeline (via @cloudflare/vite-plugin loopback) serves requests with stale hashed chunk URLs that were invalidated when the optimizer re-ran and rewrote `.vite/deps_ssr/` with new hashes after discovering new deps (astro-seo, marked, dompurify).
test: log trace analysis + timestamp ordering + known Vite behavior + Cloudflare adapter runnerObject in stack.
expecting: Error timestamps align with "new dependencies optimized" + "reloading" messages; stack frames show loopback fetch path; issue is cosmetic (dev-only).
next_action: return diagnosis, do NOT apply fix.

## Symptoms

expected: clean `pnpm dev` output with no stack-traced errors on cold start
actual: 2 [ERROR] + 1 [WARN] emitted in first ~20s on `chunk-7VRFT6OE.js`, `chunk-FW4QRCOW.js`, `audit-GII5XVTN.js` — all under `.vite/deps_ssr/` or `.vite/deps/`. Site still returns 200 after each error.
errors: |
  "The file does not exist at .../node_modules/.vite/deps_ssr/chunk-XXXX.js?v=YYYY which is in the optimize deps directory. The dependency might be incompatible with the dep optimizer. Try adding it to optimizeDeps.exclude."
reproduction: 1) rm -rf node_modules/.vite  2) pnpm dev  3) load http://localhost:4321/ immediately
started: first observed this session (Phase 12). Production builds clean.

## Evidence

- timestamp: 17:41:10
  checked: LOGS.txt line 20-22
  found: astro/zod optimized, reload triggered — no error yet.
  implication: first optimizer pass succeeds; reload is clean.

- timestamp: 17:41:12
  checked: LOGS.txt line 23-34
  found: astro-seo discovered as new dep → optimizer re-runs → rewrites `.vite/deps_ssr/` with new `?v=becb2245` hashes → a still-in-flight SSR request tries to load `chunk-7VRFT6OE.js?v=becb2245` → file path already rewritten, ENOENT → Vite throws throwFileNotFoundInOptimizedDep.
  implication: The served URL hash and the on-disk hash are the same `?v=becb2245`, but the specific chunk filenames (chunk-7VRFT6OE, chunk-FW4QRCOW) were discarded/renamed during the rewrite. Classic race between dep discovery and in-flight SSR module graph resolution.

- timestamp: 17:41:12
  checked: LOGS.txt line 41-43 (stack trace)
  found: Error originates in `@cloudflare/vite-plugin/.../index.mjs:29872 __VITE_INVOKE_MODULE__` → miniflare loopback `#handleLoopbackCustomFetchService`. The Cloudflare worker runtime proxies module loads back to Vite via fetch.
  implication: Every SSR module resolution is an async loopback fetch — widens the race window compared to standard Node SSR. The Cloudflare dev environment is the amplifier, not the root cause.

- timestamp: 17:41:16
  checked: LOGS.txt line 46-48
  found: `marked, dompurify` optimized → reload → [WARN] for `audit-GII5XVTN.js`. Lower severity (warn not error) — request was client-side (`.vite/deps/` not `.vite/deps_ssr/`) and Vite handled it more gracefully.
  implication: Same mechanism, different environment (client vs ssr). Confirms pattern is generic dep-optimizer churn, not a bad dep.

- timestamp: 17:41:15, 17:41:17
  checked: LOGS.txt line 45, 49
  found: `[200] / 127ms` then `[200] / 21ms` — requests succeed after optimizer settles.
  implication: Not a real failure. Errors are transient, self-healing. Production (`pnpm build`) never runs the dev optimizer — Phase 12 VERIFICATION.md clean.

- timestamp: now
  checked: BaseLayout.astro:3, chat.ts:7-8
  found: `astro-seo` imported in SSR layout (server-rendered on every page); `marked`, `dompurify` imported in `src/scripts/chat.ts` (client-only widget).
  implication: astro-seo is an SSR dep discovered lazily (not in Astro's default prebundle list). marked/dompurify are client deps. Both are safe, real deps — not incompatible. The "Try adding it to optimizeDeps.exclude" message is Vite's generic suggestion; it is misleading here because the deps ARE compatible — they just got caught mid-rewrite.

## Resolution

root_cause: Vite dep-optimizer cold-start race. On first `pnpm dev`, Vite does not yet know which deps the code graph imports. It discovers them as requests arrive (astro/zod → astro-seo → marked/dompurify), and each discovery triggers a full optimizer re-bundle + reload. SSR requests already in flight through the Cloudflare vite-plugin loopback hold URLs pointing at chunk filenames that no longer exist after the rewrite. `@cloudflare/vite-plugin` widens the race because module resolution runs through miniflare's async loopback fetch. Once all three dep sets are optimized (~6s in), the graph stabilizes and errors stop. This is dev-only; production is a single clean build with no optimizer.

fix: (recommended, minimal) add `vite.optimizeDeps.include` to prewarm the late-discovered deps so the optimizer finishes its passes before the first request:
```js
// astro.config.mjs
vite: {
  plugins: [tailwindcss()],
  optimizeDeps: {
    include: ["astro-seo", "marked", "dompurify"],
  },
  ssr: {
    optimizeDeps: {
      include: ["astro-seo"],
    },
  },
},
```
Alternative: `server.warmup.ssrFiles: ["./src/layouts/BaseLayout.astro"]` + `server.warmup.clientFiles: ["./src/scripts/chat.ts"]` to force Vite to crawl these entrypoints eagerly. `include` is preferred because it directly targets the racing deps without pulling full modules through the transform pipeline.

Do NOT use `optimizeDeps.exclude` despite Vite's error message suggesting it. Exclude is for deps the optimizer cannot handle (e.g. native binaries, ESM-only quirks). These three deps are CJS/ESM compatible and benefit from prebundling. Excluding would slow cold starts and potentially break SSR resolution through the Cloudflare loopback.

verification: user to run `rm -rf node_modules/.vite && pnpm dev` after applying; expect no [ERROR]/[WARN] on cold start.

risk:
- Production: **zero**. `optimizeDeps` is a dev-server-only concern. `astro build` does not consult it. No runtime behavior change.
- Masking real incompatibilities: **low**. If a listed dep were genuinely incompatible, `include` would surface a different error (parse/transform failure) at prewarm time — sooner and louder, not hidden. The current error is structurally a missing-file race, not a compat failure.
- Brittleness: adding a dep later that transitively pulls a new optimizer target could resurface the warning. Acceptable maintenance cost.

files_changed: []

verdict: **Ship the fix this session.** It is a 6-line config change with zero production impact, zero behavior change, and directly addresses the root cause. The alternative (document as benign) leaves a noisy dev experience that will cause confusion on every fresh clone. Fix cost < documentation cost over project lifetime.
