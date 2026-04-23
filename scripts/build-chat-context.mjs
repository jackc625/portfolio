#!/usr/bin/env node
/**
 * @fileoverview Build-time knowledge generator for the chat widget.
 *
 * Reads 4 sources and writes a single merged JSON the chat API consumes:
 *   1. src/content/projects/*.mdx              — case-study bodies (D-01)
 *   2. Projects/<n> - <NAME>.md                — below-fence extended references (D-02)
 *   3. src/data/about.ts                       — ABOUT_INTRO, ABOUT_P1..P3 (D-03)
 *   4. src/data/portfolio-context.static.json  — hand-curated identity (D-08)
 *
 * Projects/7 MULTI-DEX CRYPTO TRADER.md is EXCLUDED (D-04) — the MDX
 * `source:` allow-list is the exclusion mechanism: any Projects/*.md not
 * referenced by an MDX source: field is ignored.
 *
 * Resume PDF text is NOT extracted (D-05) — persona prompt directs
 * visitors to /jack-cutrara-resume.pdf for resume-level questions.
 *
 * Usage:
 *   node scripts/build-chat-context.mjs            (write mode; D-10)
 *   node scripts/build-chat-context.mjs --check    (CI mode; exit 1 on drift)
 *
 * Exit codes (D-24):
 *   0 — success (write mode: all writes completed; --check: no drift)
 *   1 — drift detected in --check mode (CI gate)
 *   2 — hard failure (missing MDX source:, missing Projects/*.md, malformed fence, path escape)
 */

import { readFile, writeFile, glob } from "node:fs/promises";
import { basename, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  readSourceField,
  sliceFrontmatter,
  wordCount,
} from "./sync-projects.mjs";

const CHECK_MODE = process.argv.includes("--check");
const PROJECT_ROOT = process.cwd();
const MDX_GLOB = "src/content/projects/*.mdx";
const STATIC_JSON_PATH = "src/data/portfolio-context.static.json";
const ABOUT_TS_PATH = "src/data/about.ts";
const OUTPUT_JSON_PATH = "src/data/portfolio-context.json";
const FENCE_END = "<!-- CASE-STUDY-END -->";
const README_WORD_CAP = 5000; // D-06
const MIN_TOKEN_FLOOR = 4096; // AI-SPEC §3 pitfall #1 (Haiku 4.5 cache minimum)
// Multi-threshold budget observability (REVIEWS.md MEDIUM — per-project visibility as content grows)
const TOKEN_BUDGET_INFO = 40000; // info log
const TOKEN_BUDGET_WARN = 60000; // warn to stderr
const TOKEN_BUDGET_CAP = 80000; // D-07 sanity cap (revisit D-06 per-project cap at this point)
const TRUNCATION_MARKER_TEMPLATE = (slug) =>
  `… see /projects/${slug} for the full technical reference`; // D-06, planner-locked per RESEARCH §5 option 1

/** CRLF → LF normalization (mirrors sync-projects line 48; L7 landmine mitigation). */
const normalize = (s) => s.replace(/\r\n/g, "\n");

/** Char-based token estimator (Anthropic's conservative char/4 rule). */
export const estimateTokens = (str) => Math.ceil(str.length / 4);

/**
 * Read a quoted OR unquoted single-line string field from a frontmatter block.
 * Accepts:  field: "value"   OR   field: value
 * Returns null when absent or malformed.
 */
export function readStringField(frontmatterBlock, fieldName) {
  const escaped = fieldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re =
    new RegExp(`^${escaped}:\\s*"([^"\\n]+)"\\s*$`, "m").exec(frontmatterBlock) ??
    new RegExp(`^${escaped}:\\s*([^"\\n]+?)\\s*$`, "m").exec(frontmatterBlock);
  return re ? re[1].trim() : null;
}

/**
 * Read an array field from frontmatter. Supports three layouts:
 *   techStack: ["A", "B", "C"]       (single-line inline)
 *   techStack:                       (multi-line inline bracket — actual shape of 5/6 MDX)
 *     [
 *       "A",
 *       "B",
 *     ]
 *   techStack:                       (block list — YAML style)
 *     - A
 *     - B
 * Returns [] when absent.
 */
export function readArrayField(frontmatterBlock, fieldName) {
  const escaped = fieldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Try multi-line inline bracket form first (spans newlines). Uses [\s\S] to cross lines.
  // Matches: `techStack:` newline whitespace `[` ... `]` as a non-greedy block.
  const bracket = new RegExp(
    `^${escaped}:\\s*\\n?\\s*\\[([\\s\\S]+?)\\]`,
    "m"
  ).exec(frontmatterBlock);
  if (bracket) {
    return bracket[1]
      .split(",")
      .map((s) => s.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }

  // YAML block list form.
  const block = new RegExp(
    `^${escaped}:\\s*\\n((?:\\s*-\\s*.+\\n)+)`,
    "m"
  ).exec(frontmatterBlock);
  if (block) {
    return block[1]
      .split("\n")
      .map((line) => line.replace(/^\s*-\s*/, "").trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }
  return [];
}

/**
 * Return content AFTER the <!-- CASE-STUDY-END --> marker in a Projects/*.md file.
 * Mirrors extractFence's error-class semantics (throws on missing fence — exit 2).
 */
export function sliceReadmeBelowFence(sourceContent, sourceLabel) {
  const prefix = sourceLabel ? `${sourceLabel}: ` : "";
  const endCount = sourceContent.split(FENCE_END).length - 1;
  if (endCount === 0) {
    throw new Error(`${prefix}missing ${FENCE_END}`);
  }
  if (endCount > 1) {
    throw new Error(`${prefix}${FENCE_END} must appear exactly once (found ${endCount})`);
  }
  const endIdx = sourceContent.indexOf(FENCE_END);
  return sourceContent.slice(endIdx + FENCE_END.length).trim();
}

/**
 * Truncate markdown text at paragraph-boundary after word cap.
 * Returns { content, truncated }. When truncated, content ends at the first
 * \n\n boundary past the cap (or at the cap if no paragraph break remains).
 */
export function truncateReadme(readmeText, wordCap) {
  const totalWords = wordCount(readmeText);
  if (totalWords <= wordCap) return { content: readmeText, truncated: false };

  // Walk char-by-char, counting whitespace-delimited words.
  let charIdx = 0;
  let words = 0;
  while (charIdx < readmeText.length && words < wordCap) {
    // Advance past whitespace
    while (charIdx < readmeText.length && /\s/.test(readmeText[charIdx])) charIdx++;
    // Consume one word
    if (charIdx < readmeText.length) {
      while (charIdx < readmeText.length && /\S/.test(readmeText[charIdx])) charIdx++;
      words++;
    }
  }

  // Past word cap — advance to next \n\n (paragraph break).
  const breakIdx = readmeText.indexOf("\n\n", charIdx);
  const cutAt = breakIdx === -1 ? charIdx : breakIdx;
  return {
    content: readmeText.slice(0, cutAt).trimEnd(),
    truncated: true,
  };
}

/**
 * Extract ABOUT_INTRO, ABOUT_P1, ABOUT_P2, ABOUT_P3 string values from about.ts source.
 * Uses regex because about.ts is TypeScript and we don't want to spin up a TS loader.
 * Preserves Unicode escapes (\\u2014 etc.) by eval-style string decoding via JSON.parse.
 *
 * Throws on any missing export with a named, actionable error:
 *   "about.ts: export const ABOUT_P1 not in single-line double-quoted form —
 *    either normalize the export OR extend parseAboutExports() to handle template literals"
 */
export function parseAboutExports(sourceContent) {
  const names = ["ABOUT_INTRO", "ABOUT_P1", "ABOUT_P2", "ABOUT_P3"];
  const result = {};
  for (const name of names) {
    // Match `export const NAME = "..."` (single-line double-quoted string only).
    // The RHS may span onto the next line after `=` (common style: `export const NAME =\n  "..."`).
    const re = new RegExp(
      `export const ${name}\\s*=\\s*("(?:[^"\\\\]|\\\\.)*")`,
      "m"
    );
    const m = re.exec(sourceContent);
    if (!m) {
      // Check whether the export exists at all (was the name renamed?) vs exists in a form we don't support.
      const existsAtAll = new RegExp(`export const ${name}\\b`, "m").test(sourceContent);
      if (!existsAtAll) {
        throw new Error(
          `${ABOUT_TS_PATH}: missing export const ${name} — add it to about.ts`
        );
      }
      throw new Error(
        `${ABOUT_TS_PATH}: export const ${name} not in single-line double-quoted form — ` +
          `either normalize back to a \`"..."\` literal OR extend parseAboutExports() to handle template literals`
      );
    }
    // JSON.parse decodes —, \n, etc.
    result[name] = JSON.parse(m[1]);
  }
  return result;
}

/**
 * Build one per-project knowledge block.
 * @param {object} args
 * @param {string} args.mdxPath
 * @param {string} args.mdxRaw           — LF-normalized MDX source
 * @param {string} args.sourceAbs        — absolute path to Projects/*.md
 * @param {string} args.sourceRel        — MDX's source: field value (for error messages)
 */
export async function buildProjectBlock({ mdxPath, mdxRaw, sourceAbs, sourceRel }) {
  const slug = basename(mdxPath, ".mdx");
  const { frontmatterBlock, body } = sliceFrontmatter(mdxRaw);

  const title = readStringField(frontmatterBlock, "title");
  const description = readStringField(frontmatterBlock, "description");
  const tech = readArrayField(frontmatterBlock, "techStack");
  const demoUrl = readStringField(frontmatterBlock, "demoUrl");
  if (!title) throw new Error(`${basename(mdxPath)}: missing title`);
  if (!description) throw new Error(`${basename(mdxPath)}: missing description`);

  const sourceRaw = normalize(await readFile(sourceAbs, "utf8"));
  const belowFence = sliceReadmeBelowFence(sourceRaw, sourceRel);
  const { content, truncated } = truncateReadme(belowFence, README_WORD_CAP);

  const block = {
    name: title,
    description,
    tech,
    page: `/projects/${slug}`,
    caseStudy: body.trimEnd(), // MDX body verbatim; NEVER truncated per D-06
    extendedReference: {
      content,
      truncated,
    },
  };
  if (demoUrl) block.url = demoUrl;
  if (truncated) {
    block.extendedReference.truncationMarker = TRUNCATION_MARKER_TEMPLATE(slug);
  }
  return block;
}

async function main() {
  // 1. Glob MDX files (deterministic sort)
  const mdxFiles = [];
  for await (const f of glob(MDX_GLOB)) mdxFiles.push(f);
  mdxFiles.sort();
  if (mdxFiles.length === 0) {
    process.stderr.write("ERROR: no MDX files matched " + MDX_GLOB + "\n");
    process.exit(2);
  }

  // 2. Build per-project blocks; Projects/7 excluded IMPLICITLY via allow-list
  //    + duplicate-source / duplicate-slug detection (REVIEWS.md MEDIUM)
  const projects = [];
  const seenSlugs = new Set();
  const seenSources = new Set();
  const perProjectTokens = []; // [{ slug, tokens, truncated }] — REVIEWS.md MEDIUM (per-project observability)
  let errorCount = 0;
  let totalWords = 0;
  for (const mdxPath of mdxFiles) {
    try {
      const mdxRaw = normalize(await readFile(mdxPath, "utf8"));
      const { frontmatterBlock } = sliceFrontmatter(mdxRaw);
      const sourceRel = readSourceField(frontmatterBlock);
      if (!sourceRel) throw new Error(`${basename(mdxPath)}: missing source: field`);

      const sourceAbs = resolve(PROJECT_ROOT, sourceRel);
      // Path-escape guard (mirrors sync-projects lines 163-170)
      if (
        !sourceAbs.startsWith(PROJECT_ROOT + sep) &&
        sourceAbs !== PROJECT_ROOT
      ) {
        throw new Error(
          `${basename(mdxPath)}: source path escapes project root: ${sourceRel}`
        );
      }
      // Defensive regex — D-04 reinforcement. Even if a contributor adds
      // a multi-dex-trader.mdx with source: "Projects/7 ...", refuse.
      if (/MULTI[- ]?DEX|multi[- ]?dex/i.test(sourceRel)) {
        throw new Error(
          `${basename(mdxPath)}: Projects/7 excluded per D-04 — remove MDX or change source:`
        );
      }

      // Duplicate detection (REVIEWS.md MEDIUM — duplicate slug or duplicate source: must hard-fail)
      const slug = basename(mdxPath, ".mdx");
      if (seenSlugs.has(slug)) {
        throw new Error(`duplicate slug: ${slug} appeared in multiple MDX files`);
      }
      if (seenSources.has(sourceRel)) {
        throw new Error(
          `duplicate source: ${sourceRel} referenced by multiple MDX files`
        );
      }
      seenSlugs.add(slug);
      seenSources.add(sourceRel);

      const block = await buildProjectBlock({ mdxPath, mdxRaw, sourceAbs, sourceRel });
      projects.push(block);
      const caseStudyWords = wordCount(block.caseStudy);
      const extRefWords = wordCount(block.extendedReference.content);
      const projectWords = caseStudyWords + extRefWords;
      totalWords += projectWords;
      // Per-project token contribution for the summary breakdown (REVIEWS.md MEDIUM)
      const perProjectBlockTokens = estimateTokens(JSON.stringify(block));
      perProjectTokens.push({
        slug,
        tokens: perProjectBlockTokens,
        truncated: block.extendedReference.truncated,
      });
      process.stdout.write(
        `  ${basename(mdxPath).padEnd(24)} caseStudy=${caseStudyWords
          .toString()
          .padStart(4)}w  extRef=${extRefWords
          .toString()
          .padStart(5)}w  tokens=${perProjectBlockTokens
          .toString()
          .padStart(5)}  truncated=${block.extendedReference.truncated ? "yes" : "no "}\n`
      );
    } catch (err) {
      process.stderr.write(`ERROR ${basename(mdxPath)}: ${err.message}\n`);
      errorCount += 1;
    }
  }

  if (errorCount > 0) process.exit(2);

  // 3. Read static identity file
  let staticJson;
  try {
    staticJson = JSON.parse(await readFile(STATIC_JSON_PATH, "utf8"));
  } catch (err) {
    process.stderr.write(`ERROR ${STATIC_JSON_PATH}: ${err.message}\n`);
    process.exit(2);
  }

  // 4. Read about.ts and extract exports
  let aboutBlock;
  try {
    const aboutRaw = normalize(await readFile(ABOUT_TS_PATH, "utf8"));
    const parsed = parseAboutExports(aboutRaw);
    aboutBlock = {
      intro: parsed.ABOUT_INTRO,
      p1: parsed.ABOUT_P1,
      p2: parsed.ABOUT_P2,
      p3: parsed.ABOUT_P3,
    };
  } catch (err) {
    process.stderr.write(`ERROR ${ABOUT_TS_PATH}: ${err.message}\n`);
    process.exit(2);
  }

  // 5. Compose experience summary from about.ts.
  //    REVIEWS.md LOW — role + rationale for this field going forward:
  //    - `experience` stays as a backward-compat one-liner. Every call site today expects
  //      a string here (current portfolio-context.json ships one). Dropping it would be a
  //      breaking change — the TypeScript interface still types it and chat.ts still
  //      reads it via JSON.stringify(context).
  //    - The NEW `about` object is the canonical structured source (intro + p1 + p2 + p3).
  //      Future phases that want richer "experience" content should read `about.*`, not
  //      extend this one-liner. No follow-up work needed in Phase 14 — just documentation
  //      so future contributors don't confuse the two fields.
  //    - Synthesis formula is deterministic (same inputs → same output) so it does not
  //      break the cache-stability invariant above the cache breakpoint.
  const experience = `${aboutBlock.intro} ${aboutBlock.p1} ${aboutBlock.p3}`
    .replace(/\s+/g, " ")
    .trim();

  // 6. Shallow merge (static wins for static keys; generated wins for generated keys — D-08)
  //    Deterministic alphabetical project ordering for stable cache keys + diff review (REVIEWS.md MEDIUM).
  projects.sort((a, b) => a.page.localeCompare(b.page));
  const merged = {
    ...staticJson,
    projects,
    experience,
    about: aboutBlock,
  };

  // 7. Token-floor + multi-threshold budget observability (REVIEWS.md MEDIUM — per-project visibility + tiered warnings)
  const serialized = JSON.stringify(merged, null, 2) + "\n";
  const estTokens = estimateTokens(serialized);

  // Per-project breakdown (descending by token contribution)
  perProjectTokens.sort((a, b) => b.tokens - a.tokens);
  process.stdout.write(`  BREAKDOWN (per-project tokens, descending):\n`);
  for (const { slug, tokens, truncated } of perProjectTokens) {
    process.stdout.write(
      `    ${slug.padEnd(12)} ${tokens.toString().padStart(5)} tokens${truncated ? "  (truncated)" : ""}\n`
    );
  }
  process.stdout.write(
    `  TOTAL: projects=${projects.length}  words=${totalWords}  est_tokens=${estTokens}\n`
  );

  if (estTokens < MIN_TOKEN_FLOOR) {
    process.stderr.write(
      `WARN: estimated ${estTokens} tokens is below Haiku 4.5 cache minimum ${MIN_TOKEN_FLOOR}; cache would silently disable\n`
    );
  } else if (estTokens >= TOKEN_BUDGET_CAP) {
    process.stderr.write(
      `WARN: estimated ${estTokens} tokens exceeds sanity cap ${TOKEN_BUDGET_CAP}; revisit D-06 per-project cap\n`
    );
  } else if (estTokens >= TOKEN_BUDGET_WARN) {
    process.stderr.write(
      `WARN: estimated ${estTokens} tokens exceeds warn threshold ${TOKEN_BUDGET_WARN}; consider tightening case-study length or extended-ref cap\n`
    );
  } else if (estTokens >= TOKEN_BUDGET_INFO) {
    process.stdout.write(
      `INFO: estimated ${estTokens} tokens crossed info threshold ${TOKEN_BUDGET_INFO}; monitor growth\n`
    );
  }

  // 8. Write-or-check
  const existing = await readFile(OUTPUT_JSON_PATH, "utf8").catch(() => "");
  if (existing === serialized) {
    process.stdout.write(`  ${OUTPUT_JSON_PATH}: unchanged\n`);
    process.exit(0);
  }
  if (CHECK_MODE) {
    process.stderr.write(
      `drift detected in ${OUTPUT_JSON_PATH}; re-run: pnpm build:chat-context\n`
    );
    process.exit(1);
  }
  await writeFile(OUTPUT_JSON_PATH, serialized, "utf8");
  process.stdout.write(`  ${OUTPUT_JSON_PATH}: written\n`);
  process.exit(0);
}

// CLI guard (mirrors sync-projects line 239) — allows test-time imports without triggering main().
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
