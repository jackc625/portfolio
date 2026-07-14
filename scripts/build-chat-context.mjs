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
 * Projects/7 MULTI-DEX CRYPTO TRADER.md is now INGESTED (Phase 25 / CHAT-10
 * lifted the former D-04 / D-15 exclusion). The #7 case study has its own MDX
 * (slug `multi-chain-evm`) with a third-person chatSummary, so it enters the
 * chat corpus as the 7th project block (voice-split, untruncated below-fence
 * reference). The former slug-skip is gone; a belt-and-suspenders reservation
 * (isReservedProjects7Source) still hard-fails if some OTHER slug tries to
 * claim the Projects/7 source.
 *
 * Experience is read recursively from src/content/experience/**\/*.mdx into a
 * reverse-chron {role,company,dateRange,summary} array, and education is
 * single-sourced from src/data/education.ts (D-07) via parseEducation.
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
const ABOUT_CHAT_TS_PATH = "src/data/about-chat.ts";
const EDUCATION_TS_PATH = "src/data/education.ts"; // D-07 SSoT (Phase 25 / CHAT-10)
const OUTPUT_JSON_PATH = "src/data/portfolio-context.json";
// Recursive glob — parity with content.config.ts:26 + sync-experience.mjs:35.
// A single-level `*.mdx` would silently skip a nested entry from the corpus.
const EXPERIENCE_GLOB = "src/content/experience/**/*.mdx";
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
 * BROADENED first-person leak regex (Plan 17-07 revision B1, hardened by
 * WR-02 quick-260513-hqk).
 *
 * Closes UAT Gap #1 (BLOCKER) — the chat <knowledge> block must speak ABOUT
 * Jack, never AS Jack. The original Plan 17-07-spec'd regex
 *   /\b(I'?m |I built |I architected |I chose |I wanted |I reach |I read |My approach )\b/
 * MISSED present-tense ("I build"), additional contractions ("I'd", "I'll",
 * "I've"), and the "My favorite" / "I wonder" / "I like" tokens that are
 * currently present in the pre-fix portfolio-context.json. The broadened
 * regex catches:
 *   - I'm / I'd / I'll / I've / I am (with ASCII U+0027 ' OR curly U+2019 ’
 *     in the contraction — WR-02 close)
 *   - I build / built / like / liked / wonder / wanted / reach / reached / read /
 *     architected / chose / haven / wrote / run / set / shipped / added / prefer /
 *     care / watch / track / love / hate /
 *     made / created / developed / implemented / designed / think / learned /
 *     noticed / tried / tested  (WR-02 verb extensions)
 *   - My approach / favorite / favourite (British, WR-02) / projects / code /
 *     work / background / stack / version / first /
 *     implementation / solution / design / team / experience  (WR-02 possessives)
 *
 * The same canonical regex is used in
 *   tests/build/chat-knowledge-voice.test.ts (B1 self-test + artifact sweep)
 *   tests/api/chat-voice-split.test.ts        (live system-block tripwire)
 * — keep all three sites BYTE-IDENTICAL in sync. Triplicated string literal is
 * accepted per 17-REVIEW-GAPS.md WR-02 (shared-module extraction deferred).
 * See .planning/debug/chat-voice-split-regression.md.
 */
const FIRST_PERSON_LEAK_RE = /\b(I(?:['’]|\s)(?:m\b|d\b|ll\b|ve\b|re\b|am\b)|I\s+(?:build|built|like|liked|wonder|wanted|reach|reached|read|architected|chose|haven|wrote|run|set|shipped|added|prefer|care|watch|track|love|hate|made|created|developed|implemented|designed|think|learned|noticed|tried|tested|interned|coordinated)|My\s+(?:approach|favorite|favourite|projects|code|work|background|stack|version|first|implementation|solution|design|team|experience))\b/i;

/**
 * WR-02 (25-REVIEW) structural backstop for the finite FIRST_PERSON_LEAK_RE
 * allowlist. Flags ANY sentence that BEGINS with a standalone first-person
 * clause (I / My / We / Our) — at string start OR after sentence-ending
 * punctuation — regardless of the following verb. This closes the allowlist's
 * coverage gaps for verbs it does not enumerate (e.g. "I fixed", "I traced",
 * "I recovered", "I re-scoped", "I stood up"), which appear verbatim in this
 * project's first-person source prose and could otherwise slip into a
 * chat-bound field via a future hand-edit and silently pass the guard.
 *
 * Case-sensitive by design: third-person prose ("Jack built…") never opens a
 * sentence with a capitalized I/My/We/Our, so this does not false-positive on
 * the current corpus. Unlike FIRST_PERSON_LEAK_RE this is build-guard-only and
 * is intentionally NOT part of the triplicated byte-identical regex contract.
 */
const NEVER_BEGINS_FIRST_PERSON = /(?:^|[.!?]\s+)(I|My|We|Our)\b/;

/**
 * First-person leak guard — exits 2 if any chat-bound field contains a
 * first-person leading clause. Closes UAT Gap #1 root cause.
 *
 * Scope: about.intro/p1/p2/p3, experience, projects[].caseStudy. Does NOT
 * walk extendedReference.content — that's technical reference material from
 * below-the-fence Projects/*.md, not voice-bearing prose authored for either
 * surface, and the chat <role> handles voice translation when citing it.
 */
function checkFirstPersonLeaks(merged) {
  // D-09: experience is now an ARRAY of {role,company,dateRange,summary}. Walk
  // ALL FOUR serialized string fields of every entry (Codex MEDIUM) — each one
  // enters the model-visible prompt via wholesale JSON.stringify, not just the
  // summary. Fall back to a single string entry if some future shape reverts.
  const experienceTargets = Array.isArray(merged.experience)
    ? merged.experience.flatMap((e, i) => {
        const label = e && e.company ? ` (${e.company})` : "";
        return [
          [`experience[${i}].role${label}`, e?.role],
          [`experience[${i}].company`, e?.company],
          [`experience[${i}].dateRange`, e?.dateRange],
          [`experience[${i}].summary${label}`, e?.summary],
        ];
      })
    : [["experience", merged.experience]];
  const targets = [
    ["about.intro", merged.about?.intro],
    ["about.p1", merged.about?.p1],
    ["about.p3", merged.about?.p3],
    ...experienceTargets,
    ...merged.projects.map((p, i) => [
      `projects[${i}].caseStudy (${p.page})`,
      p.caseStudy,
    ]),
  ];
  const leaks = [];
  for (const [field, value] of targets) {
    if (typeof value !== "string") continue;
    // Two-layer guard (WR-02): the finite verb allowlist first, then the
    // structural sentence-initial backstop for verbs the allowlist omits.
    const m = FIRST_PERSON_LEAK_RE.exec(value) || NEVER_BEGINS_FIRST_PERSON.exec(value);
    if (m) {
      leaks.push({
        field,
        match: m[0],
        excerpt: value.slice(Math.max(0, m.index - 20), m.index + 60),
      });
    }
  }
  if (leaks.length > 0) {
    process.stderr.write(
      `ERROR first-person voice leak in chat-knowledge JSON (CHAT-06 contract violation):\n`
    );
    for (const { field, match, excerpt } of leaks) {
      process.stderr.write(`  ${field}: matched "${match}" near "...${excerpt}..."\n`);
    }
    process.stderr.write(
      `Fix: edit src/data/about-chat.ts or the matching MDX chatSummary frontmatter; voice MUST be third person ("Jack built X", "Jack chose Y"). See .planning/debug/chat-voice-split-regression.md.\n`
    );
    process.exit(2);
  }
}

/**
 * Read a quoted OR unquoted single-line string field from a frontmatter block.
 * Accepts:  field: "value"   OR   field: value
 * Returns null when absent or malformed.
 *
 * Unquoted branch strips YAML inline comments (`field: foo # TODO` → `foo`) to
 * match YAML semantics (REVIEW.md WR-03). All current MDX files use quoted
 * form, so this is latent-defect hardening, not a live-bug fix.
 *
 * WR-03 (17-REVIEW-GAPS.md, quick-260513-hqk): the quoted-body regex
 * `[^"\n]+` stops at the first internal `"` — escaped quotes (`\"`) would
 * silently truncate the field. Rather than upgrade the regex to support YAML
 * `\"` escapes, we throw explicitly on detection (parallel to the comma-in-
 * array guard at readArrayField lines 187-193). No current chatSummary value
 * uses embedded quotes; the throw is hardening for forward compatibility.
 */
export function readStringField(frontmatterBlock, fieldName) {
  const escaped = fieldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const quoted = new RegExp(
    `^${escaped}:\\s*"([^"\\n]+)"\\s*$`,
    "m"
  ).exec(frontmatterBlock);
  if (quoted) {
    // WR-03: reject escaped quotes explicitly — the regex would silently
    // truncate at the first internal `"`. Mirrors the comma-in-array guard
    // pattern at readArrayField (line ~187-193): hard-fail rather than
    // silently mis-parse. If support for `\"` is needed in the future,
    // upgrade the regex to `"((?:[^"\\\n]|\\.)*)"` consistent with
    // parseAboutChatExports.
    if (quoted[1].includes('\\"')) {
      throw new Error(
        `${fieldName}: escaped quote (\\") inside quoted string is not supported by readStringField; use a different phrasing or update readStringField to handle YAML escapes`
      );
    }
    return quoted[1].trim();
  }
  const unquoted = new RegExp(
    `^${escaped}:\\s*([^"\\n]+?)\\s*$`,
    "m"
  ).exec(frontmatterBlock);
  if (!unquoted) return null;
  // Strip inline YAML comment — `#` preceded by whitespace starts a comment.
  return unquoted[1].replace(/\s+#.*$/, "").trim() || null;
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
    // Defensive: refuse commas inside quoted entries. Our `split(",")` below is
    // a naive splitter that would mis-split `"Postgres, with advisory locks"`
    // into two entries (REVIEW.md WR-04). No current MDX exercises this shape,
    // so this hard-fails rather than silently mis-parses.
    // Match each fully-quoted token (`"..."` with no embedded `"`) and check
    // for commas inside it. Using the /g flag + exec loop isolates each
    // entry so adjacent entries don't form a spurious "cross-entry" match.
    const tokenRe = /"([^"]*)"/g;
    let tokenMatch;
    while ((tokenMatch = tokenRe.exec(bracket[1])) !== null) {
      if (tokenMatch[1].includes(",")) {
        throw new Error(
          `${fieldName}: comma inside quoted array entry is not supported by readArrayField`
        );
      }
    }
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
 * Extract ABOUT_CHAT_INTRO, ABOUT_CHAT_P1..P3 from src/data/about-chat.ts.
 * Same regex shape and error contract as the education/experience readers below.
 * The source file is the third-person variant the chat widget consumes;
 * the first-person originals in about.ts continue to feed the website
 * surface (homepage, about page).
 *
 * See .planning/debug/chat-voice-split-regression.md for the gap this closes
 * (UAT Gap #1, Plan 17-07).
 */
export function parseAboutChatExports(sourceContent) {
  const names = ["ABOUT_CHAT_INTRO", "ABOUT_CHAT_P1", "ABOUT_CHAT_P3"];
  const result = {};
  for (const name of names) {
    const re = new RegExp(
      `export const ${name}\\s*=\\s*("(?:[^"\\\\]|\\\\.)*")`,
      "m"
    );
    const m = re.exec(sourceContent);
    if (!m) {
      const existsAtAll = new RegExp(`export const ${name}\\b`, "m").test(sourceContent);
      if (!existsAtAll) {
        throw new Error(
          `${ABOUT_CHAT_TS_PATH}: missing export const ${name} — add it to about-chat.ts`
        );
      }
      throw new Error(
        `${ABOUT_CHAT_TS_PATH}: export const ${name} not in single-line double-quoted form — ` +
          `either normalize back to a \`"..."\` literal OR extend parseAboutChatExports() to handle template literals`
      );
    }
    result[name] = JSON.parse(m[1]);
  }
  return result;
}

/**
 * Read the chat-education object from src/data/education.ts source (D-07 SSoT).
 *
 * Dep-free per-key regex reader (mirrors parseAboutChatExports): rather than
 * spin up a TS loader or the rejected --experimental-strip-types path, slice
 * the `export const EDUCATION = { … } as const;` and `export const CREDENTIALS
 * … ];` blocks first, then run per-key `m`-flag regexes BOUNDED to those blocks
 * so they never match comments or fragments elsewhere in the file (Antigravity
 * LOW). Throws a NAMED error per missing key.
 *
 * Returns { degree, school, graduation, transferredFrom, certifications } where
 *   degree          = EDUCATION.degree
 *   school          = EDUCATION.institution
 *   graduation      = EDUCATION.date
 *   transferredFrom = EDUCATION.transferredFrom
 *   certifications  = CREDENTIALS.map(c => c.name)
 */
export function parseEducation(sourceContent) {
  const eduBlockMatch =
    /export const EDUCATION\s*=\s*\{([\s\S]*?)\}\s*as const;/m.exec(
      sourceContent
    );
  if (!eduBlockMatch) {
    throw new Error(
      `${EDUCATION_TS_PATH}: missing \`export const EDUCATION = { … } as const;\` block`
    );
  }
  const eduBlock = eduBlockMatch[1];
  const readEduKey = (key) => {
    const m = new RegExp(`^\\s*${key}:\\s*"([^"\\n]+)"`, "m").exec(eduBlock);
    if (!m) {
      throw new Error(
        `${EDUCATION_TS_PATH}: missing key \`${key}\` in the EDUCATION block`
      );
    }
    return m[1];
  };
  const degree = readEduKey("degree");
  const institution = readEduKey("institution");
  const date = readEduKey("date");
  const transferredFrom = readEduKey("transferredFrom");

  const credBlockMatch =
    /export const CREDENTIALS[^=]*=\s*\[([\s\S]*?)\];/m.exec(sourceContent);
  if (!credBlockMatch) {
    throw new Error(
      `${EDUCATION_TS_PATH}: missing \`export const CREDENTIALS … ];\` block`
    );
  }
  const certifications = [];
  const nameRe = /name:\s*"([^"\n]+)"/g;
  let cm;
  while ((cm = nameRe.exec(credBlockMatch[1])) !== null) {
    certifications.push(cm[1]);
  }
  if (certifications.length === 0) {
    throw new Error(
      `${EDUCATION_TS_PATH}: no \`name:\` entries found in the CREDENTIALS block`
    );
  }

  return {
    degree,
    school: institution,
    graduation: date,
    transferredFrom,
    certifications,
  };
}

/**
 * Validate + read one experience entry's frontmatter into the chat-corpus shape
 * (D-09). Fail-closed: throws a NAMED error on ANY missing schema-required field
 * (role/company/dateRange/chatSummary/startDate) so the build hard-fails (exit 2
 * via the caller's errorCount mechanism) rather than silently emitting undefined.
 *
 * summary is the third-person chatSummary (CHAT-06 voice-split), NOT the
 * first-person `summary` field that feeds the /experience site surface.
 * startDate is returned for reverse-chron sorting and dropped from the emitted
 * object by the caller.
 */
export function parseExperienceEntry(frontmatterBlock, slug) {
  const role = readStringField(frontmatterBlock, "role");
  const company = readStringField(frontmatterBlock, "company");
  const dateRange = readStringField(frontmatterBlock, "dateRange");
  const chatSummary = readStringField(frontmatterBlock, "chatSummary");
  const startDate = readStringField(frontmatterBlock, "startDate");
  for (const [field, value] of [
    ["role", role],
    ["company", company],
    ["dateRange", dateRange],
    ["chatSummary", chatSummary],
    ["startDate", startDate],
  ]) {
    if (!value) throw new Error(`${slug}.mdx: missing ${field}`);
  }
  return { role, company, dateRange, summary: chatSummary, startDate };
}

/**
 * Belt-and-suspenders #7 reservation predicate (D-04). True when a MDX `source:`
 * points at the Projects/7 MULTI-DEX file AND the slug is NOT the canonical
 * `multi-chain-evm` — i.e. some OTHER slug is trying to claim #7's source, which
 * must still hard-fail. The canonical slug is now ingested (Phase 25 / CHAT-10).
 */
export function isReservedProjects7Source(sourceRel, slug) {
  return (
    /MULTI[- ]?DEX|multi[- ]?dex/i.test(sourceRel) && slug !== "multi-chain-evm"
  );
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
  // CHAT-06 voice-split: chat consumes a third-person summary, NOT the
  // first-person MDX body (which is correct for the /projects/[slug] surface).
  // Plan 17-07 closes UAT Gap #1 — see .planning/debug/chat-voice-split-regression.md.
  // Suppress unused-var lint for `body` since we deliberately stop reading it.
  void body;
  const chatSummary = readStringField(frontmatterBlock, "chatSummary");
  if (!title) throw new Error(`${basename(mdxPath)}: missing title`);
  if (!description) throw new Error(`${basename(mdxPath)}: missing description`);
  if (!chatSummary) {
    throw new Error(
      `${basename(mdxPath)}: missing chatSummary: frontmatter field — required for chat-voice-split (CHAT-06). See .planning/debug/chat-voice-split-regression.md`
    );
  }

  const sourceRaw = normalize(await readFile(sourceAbs, "utf8"));
  const belowFence = sliceReadmeBelowFence(sourceRaw, sourceRel);
  const { content, truncated } = truncateReadme(belowFence, README_WORD_CAP);

  const block = {
    name: title,
    description,
    tech,
    page: `/projects/${slug}`,
    // CHAT-06 voice-split (Plan 17-07): third-person chatSummary replaces the
    // first-person MDX body. The body itself remains the source of truth for
    // the /projects/[slug] case-study page render.
    caseStudy: chatSummary,
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
      const slug = basename(mdxPath, ".mdx");
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
      // Belt-and-suspenders #7 reservation (Phase 25 / CHAT-10): the canonical
      // `multi-chain-evm` slug is now ingested, but if some OTHER slug tries to
      // claim the Projects/7 MULTI-DEX source, refuse (reuses the single `slug`
      // binding above).
      if (isReservedProjects7Source(sourceRel, slug)) {
        throw new Error(
          `${basename(mdxPath)}: Projects/7 source is reserved for the multi-chain-evm slug — change source: or rename the slug`
        );
      }

      // Duplicate detection (REVIEWS.md MEDIUM — duplicate slug or duplicate source: must hard-fail)
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

  // 4. Read about-chat.ts and extract third-person variants for the chat
  //    <knowledge> block. The first-person about.ts continues to feed the
  //    website surface (homepage, about page) -- per CHAT-06 voice-split
  //    contract, the two surfaces consume DIFFERENT sources. Plan 17-07
  //    closes UAT Gap #1; see .planning/debug/chat-voice-split-regression.md.
  let aboutBlock;
  try {
    const aboutChatRaw = normalize(await readFile(ABOUT_CHAT_TS_PATH, "utf8"));
    const parsed = parseAboutChatExports(aboutChatRaw);
    aboutBlock = {
      intro: parsed.ABOUT_CHAT_INTRO,
      p1: parsed.ABOUT_CHAT_P1,
      p3: parsed.ABOUT_CHAT_P3,
    };
  } catch (err) {
    process.stderr.write(`ERROR ${ABOUT_CHAT_TS_PATH}: ${err.message}\n`);
    process.exit(2);
  }

  // 5. Read the experience collection recursively into a reverse-chron array
  //    (D-09). Each entry is validated by parseExperienceEntry (fail-closed on
  //    any missing required field) and FAILS CLOSED via the same catch/errorCount/
  //    exit-2 mechanism as the projects loop — a raw throw would not guarantee
  //    exit 2. summary = the third-person chatSummary (CHAT-06 voice-split).
  const experienceFiles = [];
  for await (const f of glob(EXPERIENCE_GLOB)) experienceFiles.push(f);
  experienceFiles.sort();
  const experienceEntries = [];
  let expErrorCount = 0;
  for (const expPath of experienceFiles) {
    const slug = basename(expPath, ".mdx");
    try {
      const expRaw = normalize(await readFile(expPath, "utf8"));
      const { frontmatterBlock } = sliceFrontmatter(expRaw);
      experienceEntries.push(parseExperienceEntry(frontmatterBlock, slug));
    } catch (err) {
      process.stderr.write(`ERROR ${basename(expPath)}: ${err.message}\n`);
      expErrorCount += 1;
    }
  }
  if (expErrorCount > 0) process.exit(2);
  // Reverse-chronological: most recent startDate first (Holloway before Balfour).
  experienceEntries.sort((a, b) => b.startDate.localeCompare(a.startDate));
  // Emit only the chat-bound fields; startDate was sort-only.
  const experience = experienceEntries.map(({ role, company, dateRange, summary }) => ({
    role,
    company,
    dateRange,
    summary,
  }));

  // 5b. Education — single-sourced from src/data/education.ts (D-07). The static
  //     identity file no longer carries an education object; parseEducation is
  //     the sole source. REJECTS the --experimental-strip-types import path.
  let educationBlock;
  try {
    const educationRaw = normalize(await readFile(EDUCATION_TS_PATH, "utf8"));
    educationBlock = parseEducation(educationRaw);
  } catch (err) {
    process.stderr.write(`ERROR ${EDUCATION_TS_PATH}: ${err.message}\n`);
    process.exit(2);
  }

  // 6. Shallow merge (static wins for static keys; generated wins for generated keys — D-08)
  //    Deterministic alphabetical project ordering for stable cache keys + diff review (REVIEWS.md MEDIUM).
  projects.sort((a, b) => a.page.localeCompare(b.page));
  const merged = {
    ...staticJson,
    projects,
    experience,
    education: educationBlock,
    about: aboutBlock,
  };

  // 6b. CHAT-06 voice-split leak guard (Plan 17-07, UAT Gap #1).
  //     Hard-fails the build if any first-person prose slips into chat-bound
  //     fields. The leak guard is the third tripwire (after the source-text
  //     authoring discipline + the DEBT-03 sync-check.yml CI job).
  checkFirstPersonLeaks(merged);

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
