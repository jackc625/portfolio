/**
 * Post-build script: restructure Astro Cloudflare adapter output for Pages.
 *
 * The @astrojs/cloudflare v13 adapter outputs:
 *   dist/client/  — static assets (HTML, CSS, JS)
 *   dist/server/  — worker entry + chunks
 *
 * Cloudflare Pages expects a single output directory with:
 *   _worker.js    — the worker entry (enables SSR)
 *   _routes.json  — tells Pages which routes hit the worker vs static
 *   ...static files
 *
 * This script copies the server worker into dist/client/ so Pages
 * can find it when the build output directory is set to "dist/client".
 */

import { cpSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const CLIENT = join("dist", "client");
const SERVER = join("dist", "server");

if (!existsSync(SERVER) || !existsSync(CLIENT)) {
  console.log("pages-compat: dist/server or dist/client missing, skipping");
  process.exit(0);
}

// Copy server chunks into client directory
cpSync(join(SERVER, "chunks"), join(CLIENT, "chunks"), { recursive: true });

// Copy middleware if it exists
const middleware = join(SERVER, "virtual_astro_middleware.mjs");
if (existsSync(middleware)) {
  cpSync(middleware, join(CLIENT, "virtual_astro_middleware.mjs"));
}

// Copy the worker entry as _worker.js (Pages magic filename)
cpSync(join(SERVER, "entry.mjs"), join(CLIENT, "_worker.js"));

// Generate _routes.json so Pages knows which routes need the worker
// "exclude" = routes served as static files (skip worker)
// "include" = routes that MUST hit the worker (SSR/API)
writeFileSync(
  join(CLIENT, "_routes.json"),
  JSON.stringify(
    {
      version: 1,
      include: ["/api/*"],
      exclude: [],
    },
    null,
    2,
  ),
);

console.log("pages-compat: restructured dist/client/ for Cloudflare Pages");
