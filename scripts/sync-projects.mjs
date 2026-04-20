#!/usr/bin/env node
/**
 * Source-of-truth sync: extracts the fenced case-study block from
 * Projects/<n>-<NAME>.md and writes it as the body of the
 * src/content/projects/<slug>.mdx file pointed to by frontmatter `source:`.
 *
 * The @astrojs/mdx collection loader consumes the MDX bodies at build time.
 * This script keeps the 600-900 word case-study prose authored inside the
 * fenced block in each Projects/*.md file, and replaces the MDX body only
 * (frontmatter is preserved byte-for-byte per Pattern S1 / D-12).
 *
 * Usage:
 *   node scripts/sync-projects.mjs            (write mode; D-13)
 *   node scripts/sync-projects.mjs --check    (CI mode; D-14, exit 1 on drift)
 *
 * Exit codes:
 *   0 -- success (write mode: all writes completed; --check mode: no drift)
 *   1 -- drift detected in --check mode (CI gate, D-14)
 *   2 -- hard failure (missing fence, Zod-ineligible frontmatter, path escape)
 *
 * Word count is printed for each file (D-16, soft warning at <600 or >900).
 *
 * Failure modes (D-17 §4): see docs/CONTENT-SCHEMA.md.
 */

import { readFile, writeFile, access, glob } from "node:fs/promises";
import { join, basename, sep } from "node:path";
import { fileURLToPath } from "node:url";

const CHECK_MODE = process.argv.includes("--check");
const PROJECT_ROOT = process.cwd();
const MDX_GLOB = "src/content/projects/*.mdx";
const FENCE_START = "<!-- CASE-STUDY-START -->";
const FENCE_END = "<!-- CASE-STUDY-END -->";
const EXPECTED_H2S = [
  "Problem",
  "Approach & Architecture",
  "Tradeoffs",
  "Outcome",
  "Learnings",
];
const WORD_TARGET_MIN = 600;
const WORD_TARGET_MAX = 900;

/**
 * Normalize CRLF to LF (S2 / Pitfall 4).
 */
const normalize = (s) => s.replace(/\r\n/g, "\n");

/**
 * Parse just the `source:` field from a frontmatter block.
 *
 * Accepts either a fully-quoted value (`source: "Projects/1 - SEATWATCH.md"`)
 * or a fully-unquoted value (`source: Projects/1 - SEATWATCH.md`) and
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
 * Extract content between fence markers from a Projects/*.md source.
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

/**
 * Count whitespace-separated words, excluding fenced code blocks.
 */
export function wordCount(body) {
  const stripped = body.replace(/```[\s\S]*?```/g, "");
  return stripped.split(/\s+/).filter(Boolean).length;
}

/**
 * Soft H2 shape check (Pattern 4). Emits stderr warning on mismatch; never
 * fails the run (word-count and heading-shape are D-16 soft signals).
 */
export function checkH2Shape(body, slug) {
  const matches = body.match(/^## (.+)$/gm);
  const actual = matches ? matches.map((s) => s.slice(3).trim()) : [];
  const ok =
    actual.length === EXPECTED_H2S.length &&
    EXPECTED_H2S.every((e, i) => actual[i] === e);
  if (!ok) {
    process.stderr.write(
      `${slug}.mdx: H2 shape mismatch.\n  expected=${JSON.stringify(EXPECTED_H2S)}\n  actual=${JSON.stringify(actual)}\n`,
    );
  }
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

  // S3 / T-13-01: path-traversal guard. `source:` is author-controlled but
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

  const words = wordCount(newBody);
  checkH2Shape(newBody, slug);

  // S6 / Pattern 2 -- idempotent diff-then-write. Compare BEFORE writing.
  if (mdxRaw === newMdx) {
    return { slug, changed: false, words };
  }

  if (CHECK_MODE) {
    process.stderr.write(`drift detected in ${slug}.mdx\n`);
    return { slug, changed: true, drift: true, words };
  }

  await writeFile(mdxPath, newMdx, "utf8");
  return { slug, changed: true, words };
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
      const wordTag =
        r.words >= WORD_TARGET_MIN && r.words <= WORD_TARGET_MAX
          ? "OK"
          : r.words < WORD_TARGET_MIN
            ? `under ${WORD_TARGET_MIN}`
            : `exceeds ${WORD_TARGET_MAX}`;
      const verb = r.changed
        ? CHECK_MODE
          ? "would update"
          : "updated"
        : "unchanged";
      process.stdout.write(
        `${r.slug}.mdx: ${verb}, ${r.words} words (${wordTag})\n`,
      );
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
