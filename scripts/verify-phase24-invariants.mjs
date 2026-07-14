/**
 * Phase 24 invariant verifier (review fix #4).
 *
 * The AUTHORITATIVE phase-wide D-19/D-17 proof: compares the current on-disk
 * SHA-256 of every protected chat-surface / config file, plus the package.json
 * `dependencies` object, against the phase-start fingerprint recorded in
 * .planning/phases/24-positioning-shift-home-teaser/24-BASELINE.json.
 *
 * Unlike a working-tree `git diff`, this catches drift COMMITTED in any task of
 * 24-01..24-04, not just uncommitted edits. The 24-04 capstone runs this to
 * assert nothing in the protected set moved across the whole phase.
 *
 * public/og-default.png is deliberately EXCLUDED from the unchanged set (it is
 * replaced in 24-04). Instead the capstone imports ogPlaceholderHash() +
 * currentOgHash() to assert the current OG hash DIFFERS from the baseline.
 *
 * Node built-ins only (node:fs, node:crypto, node:path, node:url) — zero new
 * dependencies (QA-02 / D-19).
 */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE_PATH = join(
  REPO_ROOT,
  ".planning",
  "phases",
  "24-positioning-shift-home-teaser",
  "24-BASELINE.json",
);

/** D-19 chat-surface + D-17 config files that must not change during Phase 24. */
export const PROTECTED_FILES = [
  "src/layouts/BaseLayout.astro",
  "src/styles/global.css",
  "src/scripts/chat.ts",
  "src/pages/api/chat.ts",
  "src/data/about-chat.ts",
  "src/data/portfolio-context.json",
  "src/data/portfolio-context.static.json",
  "scripts/build-chat-context.mjs",
];

const OG_PLACEHOLDER = "public/og-default.png";

/** SHA-256 of a repo-relative file's raw bytes. */
export function sha256File(relPath) {
  return createHash("sha256")
    .update(readFileSync(join(REPO_ROOT, relPath)))
    .digest("hex");
}

/** The current package.json `dependencies` object, stringified verbatim. */
export function currentDependencies() {
  const pkg = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8"));
  return pkg.dependencies ?? {};
}

/** Baseline OG placeholder hash (what the capstone expects to have CHANGED). */
export function ogPlaceholderHash() {
  const baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
  return baseline.og_placeholder_hash;
}

/** Current on-disk hash of public/og-default.png. */
export function currentOgHash() {
  return sha256File(OG_PLACEHOLDER);
}

/**
 * Compare current protected-file hashes + dependencies against the baseline.
 * @returns {{ ok: boolean, mismatches: string[] }}
 */
export function verifyInvariants() {
  const baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
  const mismatches = [];

  for (const rel of PROTECTED_FILES) {
    const recorded = baseline.protected_file_hashes?.[rel];
    if (!recorded) {
      mismatches.push(`baseline missing hash for protected file: ${rel}`);
      continue;
    }
    const current = sha256File(rel);
    if (current !== recorded) {
      mismatches.push(
        `protected file drifted: ${rel}\n    baseline ${recorded}\n    current  ${current}`,
      );
    }
  }

  const currentDeps = JSON.stringify(currentDependencies());
  const baselineDeps = JSON.stringify(baseline.dependencies ?? {});
  if (currentDeps !== baselineDeps) {
    mismatches.push(
      `package.json dependencies changed (QA-02 no-new-deps)\n    baseline ${baselineDeps}\n    current  ${currentDeps}`,
    );
  }

  return { ok: mismatches.length === 0, mismatches };
}

// CLI entry: run the verification and exit nonzero on any drift.
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("verify-phase24-invariants.mjs")) {
  const { ok, mismatches } = verifyInvariants();
  if (ok) {
    console.log(
      `Phase 24 invariants OK: ${PROTECTED_FILES.length} protected files + dependencies match the phase-start baseline.`,
    );
    process.exit(0);
  }
  console.error("Phase 24 invariant drift detected:");
  for (const m of mismatches) console.error(`  - ${m}`);
  process.exit(1);
}
