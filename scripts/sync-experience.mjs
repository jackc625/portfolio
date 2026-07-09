#!/usr/bin/env node
/**
 * Source-of-truth sync: extracts the fenced case-study block from
 * Experience/<n>-<NAME>.md and writes it as the body of the
 * src/content/experience/<slug>.mdx file pointed to by frontmatter `source:`.
 *
 * The @astrojs/mdx collection loader consumes the MDX bodies at build time.
 * This script keeps the case-study prose authored inside the fenced block in
 * each Experience/*.md file, and replaces the MDX body only (frontmatter is
 * preserved byte-for-byte per Pattern S1 / D-12).
 *
 * Usage:
 *   node scripts/sync-experience.mjs            (write mode)
 *   node scripts/sync-experience.mjs --check    (CI mode, exit 1 on drift)
 *
 * Exit codes:
 *   0 -- success (write mode: all writes completed; --check mode: no drift)
 *   1 -- drift detected in --check mode (CI gate)
 *   2 -- hard failure (missing fence, Zod-ineligible frontmatter, path escape)
 *
 * Failure modes: see docs/CONTENT-SCHEMA.md.
 */

import { readFile, writeFile, access, glob } from "node:fs/promises";
import { join, basename, sep } from "node:path";
import { fileURLToPath } from "node:url";

const CHECK_MODE = process.argv.includes("--check");
const PROJECT_ROOT = process.cwd();
const MDX_GLOB = "src/content/experience/*.mdx";
const FENCE_START = "<!-- CASE-STUDY-START -->";
const FENCE_END = "<!-- CASE-STUDY-END -->";

/**
 * Normalize CRLF to LF (S2 / Pitfall 4).
 */
export const normalize = (s) => s.replace(/\r\n/g, "\n");

/**
 * Parse just the `source:` field from a frontmatter block.
 *
 * Accepts either a fully-quoted value (`source: "Experience/1 - SAMPLE.md"`)
 * or a fully-unquoted value (`source: Experience/1 - SAMPLE.md`) and
 * returns the inner string. Returns null when the field is absent, blank,
 * or has mismatched quotes (opening quote with no close, or vice versa).
 *
 * Mismatched-quote rejection is intentional: a partial regex that permitted
 * an optional close quote would silently accept frontmatter that is likely
 * malformed, surfacing later as "source file not found" rather than the
 * clearer "frontmatter syntax" class of error.
 */
export function readSourceField(frontmatterBlock) {
  const m =
    frontmatterBlock.match(/^source:\s*"([^"\n]+)"\s*$/m) ??
    frontmatterBlock.match(/^source:\s*([^"\n]+?)\s*$/m);
  return m ? m[1].trim() : null;
}

/**
 * Slice a MDX file into { frontmatterBlock, body }.
 * frontmatterBlock includes the leading and trailing `---\n` lines.
 * Throws if no opening or closing `---` delimiter is found.
 */
export function sliceFrontmatter(mdx) {
  if (!mdx.startsWith("---\n")) {
    throw new Error("MDX missing opening frontmatter delimiter");
  }
  const closeIdx = mdx.indexOf("\n---\n", 4);
  if (closeIdx === -1) {
    throw new Error("MDX missing closing frontmatter delimiter");
  }
  const fmEnd = closeIdx + 5; // include "\n---\n"
  return {
    frontmatterBlock: mdx.slice(0, fmEnd),
    body: mdx.slice(fmEnd),
  };
}

/**
 * Extract content between fence markers from an Experience/*.md source.
 * Throws if either marker is missing, appears more than once, or appears
 * out-of-order.
 *
 * @param {string} sourceContent  raw (LF-normalized) source file contents
 * @param {string} [sourceLabel]  optional label to prefix error messages (sync flow passes the source path)
 */
export function extractFence(sourceContent, sourceLabel) {
  const prefix = sourceLabel ? `${sourceLabel}: ` : "";
  const startCount = sourceContent.split(FENCE_START).length - 1;
  const endCount = sourceContent.split(FENCE_END).length - 1;
  if (startCount === 0) {
    throw new Error(`${prefix}missing ${FENCE_START}`);
  }
  if (endCount === 0) {
    throw new Error(`${prefix}missing ${FENCE_END}`);
  }
  if (startCount > 1 || endCount > 1) {
    throw new Error(
      `${prefix}fence markers must each appear exactly once (found start=${startCount} end=${endCount})`,
    );
  }
  const startIdx = sourceContent.indexOf(FENCE_START) + FENCE_START.length;
  const endIdx = sourceContent.indexOf(FENCE_END);
  if (endIdx < startIdx) {
    throw new Error(`${prefix}${FENCE_END} appears before ${FENCE_START}`);
  }
  return sourceContent.slice(startIdx, endIdx).trim();
}

async function syncOne(mdxPath) {
  const slug = basename(mdxPath, ".mdx");
  const mdxRaw = normalize(await readFile(mdxPath, "utf8"));
  const { frontmatterBlock } = sliceFrontmatter(mdxRaw);

  const sourcePath = readSourceField(frontmatterBlock);
  if (!sourcePath) {
    throw new Error(
      `${slug}.mdx: frontmatter missing required \`source:\` field`,
    );
  }

  const absSource = join(PROJECT_ROOT, sourcePath);

  // S3 / T-21-01: path-traversal guard. `source:` is author-controlled but
  // defensive coding here is one line and prevents future typos from reading
  // arbitrary files on disk.
  if (
    !absSource.startsWith(PROJECT_ROOT + sep) &&
    absSource !== PROJECT_ROOT
  ) {
    throw new Error(
      `${slug}.mdx: source path escapes project root: ${sourcePath}`,
    );
  }

  try {
    await access(absSource);
  } catch {
    throw new Error(`${slug}.mdx: source file not found at ${sourcePath}`);
  }

  const sourceContent = normalize(await readFile(absSource, "utf8"));
  const newBody = extractFence(sourceContent, sourcePath);

  // Assemble: frontmatter (verbatim) + newline + extracted body + trailing newline.
  const newMdx = frontmatterBlock + "\n" + newBody + "\n";

  // S6 / Pattern 2 -- idempotent diff-then-write. Compare BEFORE writing.
  if (mdxRaw === newMdx) {
    return { slug, changed: false };
  }

  if (CHECK_MODE) {
    process.stderr.write(`drift detected in ${slug}.mdx\n`);
    return { slug, changed: true, drift: true };
  }

  await writeFile(mdxPath, newMdx, "utf8");
  return { slug, changed: true };
}

async function main() {
  const mdxFiles = [];
  for await (const f of glob(MDX_GLOB)) mdxFiles.push(f);
  mdxFiles.sort();

  let driftFound = false;
  let errorCount = 0;

  for (const mdxPath of mdxFiles) {
    try {
      const r = await syncOne(mdxPath);
      const verb = r.changed
        ? CHECK_MODE
          ? "would update"
          : "updated"
        : "unchanged";
      process.stdout.write(`${r.slug}.mdx: ${verb}\n`);
      if (r.drift) driftFound = true;
    } catch (err) {
      process.stderr.write(`ERROR ${basename(mdxPath)}: ${err.message}\n`);
      errorCount += 1;
    }
  }

  if (errorCount > 0) process.exit(2);
  if (CHECK_MODE && driftFound) process.exit(1);
  process.exit(0);
}

// Run main only when invoked as CLI, not when imported as a module.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
