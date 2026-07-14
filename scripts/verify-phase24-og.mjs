/**
 * Phase 24 OG-card verifier (POS-04, D-16; review fix #5).
 *
 * Proves public/og-default.png is a REAL, deterministically-produced 1200x630
 * editorial card that is NOT the phase-start placeholder. A plain dimension
 * check is insufficient: the placeholder is itself 1200x630, so the dimension
 * check alone passes on it. This verifier therefore asserts four things and
 * exits nonzero on any failure:
 *
 *   1. PNG signature  — first 8 bytes are 89 50 4E 47 0D 0A 1A 0A.
 *   2. IHDR geometry  — width x height (readUInt32BE at offsets 16 / 20) is
 *                       exactly 1200 x 630.
 *   3. Size cap       — file is <= 512 KB (a corrupt/oversized asset fails).
 *   4. Distinctness   — SHA-256 DIFFERS from baseline.og_placeholder_hash
 *                       captured at phase start (24-01), proving it is not the
 *                       placeholder.
 *
 * Node built-ins only (node:fs, node:crypto, node:path, node:url) — zero new
 * dependencies (QA-02 / D-19).
 */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OG_PATH = join(REPO_ROOT, "public", "og-default.png");
const BASELINE_PATH = join(
  REPO_ROOT,
  ".planning",
  "phases",
  "24-positioning-shift-home-teaser",
  "24-BASELINE.json",
);

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const EXPECTED_WIDTH = 1200;
const EXPECTED_HEIGHT = 630;
const MAX_BYTES = 512 * 1024; // 512 KB editorial-card cap.

/** @returns {{ ok: boolean, failures: string[] }} */
export function verifyOgCard() {
  const failures = [];
  const buf = readFileSync(OG_PATH);

  // 1. PNG signature.
  if (!buf.subarray(0, 8).equals(PNG_SIGNATURE)) {
    failures.push(
      `PNG signature invalid: got ${buf.subarray(0, 8).toString("hex")}, expected ${PNG_SIGNATURE.toString("hex")}`,
    );
  }

  // Length guard: a truncated/corrupt file must yield a clean failure entry,
  // not an uncaught RangeError from the readUInt32BE calls below (which read
  // the IHDR width/height at offsets 16/20, i.e. require >= 24 bytes).
  if (buf.length < 24) {
    failures.push(
      `file too small (${buf.length} bytes) to be a valid PNG`,
    );
    return { ok: false, failures };
  }

  // 2. IHDR geometry (width at offset 16, height at offset 20).
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  if (width !== EXPECTED_WIDTH || height !== EXPECTED_HEIGHT) {
    failures.push(
      `dimensions ${width}x${height}, expected ${EXPECTED_WIDTH}x${EXPECTED_HEIGHT}`,
    );
  }

  // 3. Size cap.
  if (buf.length > MAX_BYTES) {
    failures.push(
      `file size ${buf.length} bytes exceeds cap ${MAX_BYTES} bytes`,
    );
  }

  // 4. Distinctness from the phase-start placeholder.
  const baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
  const placeholderHash = baseline.og_placeholder_hash;
  const currentHash = createHash("sha256").update(buf).digest("hex");
  if (!placeholderHash) {
    failures.push("baseline missing og_placeholder_hash");
  } else if (currentHash === placeholderHash) {
    failures.push(
      `og-default.png is STILL the placeholder (SHA-256 ${currentHash} matches baseline.og_placeholder_hash)`,
    );
  }

  return { ok: failures.length === 0, failures };
}

if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("verify-phase24-og.mjs")
) {
  const { ok, failures } = verifyOgCard();
  if (ok) {
    console.log(
      "Phase 24 OG card OK: real 1200x630 PNG, size within cap, distinct from the phase-start placeholder.",
    );
    process.exit(0);
  }
  console.error("Phase 24 OG card verification failed:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
