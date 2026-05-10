/**
 * FOUND-04 — MDX content collections must NOT bundle into the Worker bundle.
 *
 * The Worker bundle is whatever Astro emits as server-side JS (under
 * dist/server/ — the SSR entry + chunks the Cloudflare adapter ships).
 * Static MDX content lives in src/content/projects/*.mdx and should compile
 * to dist/client/ HTML at build time. If MDX modules compile INTO Worker
 * chunks, the Worker bundle balloons and ships content already inlined as
 * static HTML elsewhere.
 *
 * What this test catches (Astro/Rollup default chunk-naming behavior):
 *   - Worker chunks whose filenames are derived from project MDX files,
 *     e.g. dist/server/chunks/clipify_*.mjs, nfl-predict_*.mjs. This is
 *     the structural signature of MDX modules being rolled into the SSR
 *     bundle.
 *   - Worker chunks containing the @mdx-js/mdx runtime marker
 *     `_createMdxContent` (the function name compiled MDX modules export).
 *
 * What this test deliberately does NOT catch:
 *   - Chat-context JSON (built by scripts/build-chat-context.mjs and
 *     intentionally imported by src/pages/api/chat.ts). That JSON contains
 *     MDX-derived PROSE because the chat assistant needs project context
 *     to function. The prose is data, not compiled MDX.
 *
 * This test depends on `dist/` existing — run AFTER `pnpm build`. If `dist/`
 * is missing, the first assertion surfaces the dependency cleanly rather
 * than failing opaquely on file reads.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, sep, basename } from "node:path";

function listJsFiles(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) listJsFiles(full, acc);
    else if (entry.endsWith(".js") || entry.endsWith(".mjs")) acc.push(full);
  }
  return acc;
}

describe("FOUND-04: MDX content does not bundle into the Worker bundle", () => {
  // Project MDX filenames (without extension) become the chunk-name prefix
  // when Rollup bundles compiled MDX into the SSR output. Update in lockstep
  // with src/content/projects/.
  const mdxStems = [
    "clipify",
    "daytrade",
    "nfl-predict",
    "optimize-ai",
    "seatwatch",
    "solsniper",
  ];

  // @mdx-js/mdx runtime signature emitted into every compiled MDX module.
  // If this appears in a Worker JS file, an MDX module rolled into SSR.
  const mdxRuntimeMarker = "_createMdxContent";

  let workerJsFiles: string[] = [];
  let distExists = false;

  beforeAll(() => {
    const distRoot = join(process.cwd(), "dist");
    distExists = existsSync(distRoot);
    if (!distExists) return;

    // Scan dist/**/*.js — exclude dist/client/ (the static-asset tree,
    // which intentionally contains compiled MDX HTML; that is correct).
    // Use platform-agnostic path-segment match so both POSIX and Windows
    // paths are filtered correctly.
    const clientSeg = `${sep}client${sep}`;
    const all = listJsFiles(distRoot);
    workerJsFiles = all.filter((p) => !p.includes(clientSeg));
  });

  it("dist contains some Worker bundle JS to inspect (run after `pnpm build`)", () => {
    expect(distExists, "dist/ does not exist — run `pnpm build` first").toBe(true);
    expect(workerJsFiles.length).toBeGreaterThan(0);
  });

  it("no Worker chunk is named after a project MDX file and no chunk contains the MDX runtime marker", () => {
    if (!distExists) return;

    // Structural check: chunk filenames derived from MDX source filenames.
    const namedFromMdx = workerJsFiles.filter((p) => {
      const name = basename(p).toLowerCase();
      return mdxStems.some((stem) => name.startsWith(`${stem}_`) || name.startsWith(`${stem}.`));
    });

    // Runtime-marker check: @mdx-js/mdx-compiled content emits `_createMdxContent`.
    const containsRuntimeMarker = workerJsFiles.filter((p) =>
      readFileSync(p, "utf8").includes(mdxRuntimeMarker),
    );

    expect(namedFromMdx, "Worker chunks must not be named after MDX source files").toEqual([]);
    expect(
      containsRuntimeMarker,
      "Worker chunks must not contain the @mdx-js/mdx runtime marker `_createMdxContent`",
    ).toEqual([]);
  });
});
