/**
 * UAT Gap #1 (BLOCKER) — chat-API voice-split regression tripwire.
 *
 * Asserts the LIVE system block (output of buildChatRequestArgs) contains
 * no first-person leak. Distinct from tests/build/chat-knowledge-voice.test.ts
 * (which asserts the JSON artifact alone) — this test exercises the actual
 * call shape Anthropic receives, including the <role> instruction context
 * and the JSON-stringified <knowledge> payload.
 *
 * B2 fix: load portfolio-context.json via readFileSync + JSON.parse rather
 * than `import ... as any` — type-system independent + fails loud if the
 * file is missing or malformed (e.g. someone deletes it before running
 * tests; the `import as any` form would silently typecheck and crash at
 * runtime with a less-helpful message).
 *
 * See .planning/debug/chat-voice-split-regression.md for full diagnosis.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildChatRequestArgs } from "../../src/prompts/chat-request-shape";

const projectRoot = resolve(__dirname, "../..");
const portfolioContext = JSON.parse(
  readFileSync(resolve(projectRoot, "src/data/portfolio-context.json"), "utf8")
);

// Same BROADENED canonical regex as tests/build/chat-knowledge-voice.test.ts
// AND scripts/build-chat-context.mjs (FIRST_PERSON_LEAK_RE). Keep all three
// BYTE-IDENTICAL in sync. Plan 17-07 revision B1, hardened by WR-02
// quick-260513-hqk (curly apostrophe + extra verbs/possessives + British "favourite").
const FIRST_PERSON_LEAK =
  /\b(I(?:['’]|\s)(?:m\b|d\b|ll\b|ve\b|re\b|am\b)|I\s+(?:build|built|like|liked|wonder|wanted|reach|reached|read|architected|chose|haven|wrote|run|set|shipped|added|prefer|care|watch|track|love|hate|made|created|developed|implemented|designed|think|learned|noticed|tried|tested|interned|coordinated)|My\s+(?:approach|favorite|favourite|projects|code|work|background|stack|version|first|implementation|solution|design|team|experience))\b/i;

describe("UAT Gap #1: chat-API system block voice-split tripwire (CHAT-06)", () => {
  const args = buildChatRequestArgs(portfolioContext, [
    { role: "user", content: "hi" },
  ]);

  it("system block (full serialized payload) contains no first-person leading clauses", () => {
    const systemText = JSON.stringify(args.system);
    const m = FIRST_PERSON_LEAK.exec(systemText);
    if (m) {
      const idx = systemText.indexOf(m[0]);
      const excerpt = systemText.slice(Math.max(0, idx - 40), idx + 80);
      throw new Error(
        `First-person leak in system block: matched "${m[0]}" near "${excerpt}"`
      );
    }
    expect(systemText).not.toMatch(FIRST_PERSON_LEAK);
  });

  it("system block contains the third-person biographer instruction (defense-in-depth)", () => {
    const systemText = JSON.stringify(args.system);
    // <role> block opens with this canonical phrase — guards against accidental deletion.
    expect(systemText).toContain("third-person biographer");
    // Defense-in-depth callout from Plan 17-07 Task 3 — guards against
    // accidental deletion. Phrase chosen to avoid first-person literal
    // examples (which would themselves trip the FIRST_PERSON_LEAK regex).
    expect(systemText).toContain("rewrite Jack's first-person voice");
  });
});
