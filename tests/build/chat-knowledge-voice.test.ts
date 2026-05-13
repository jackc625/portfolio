/**
 * UAT Gap #1 (BLOCKER) — chat-knowledge JSON voice-split regression.
 *
 * Asserts the GENERATED artifact (src/data/portfolio-context.json) contains
 * only third-person prose in chat-bound fields. Mirrors the leak-guard in
 * scripts/build-chat-context.mjs (defense in depth — a future regression
 * could land if someone hand-edits the JSON, bypassing the build script).
 *
 * BROADENED regex per Plan 17-07 revision (B1): covers present-tense
 * "I build", "I like", "My favorite", contractions ("I'd"/"I'll"/"I've"),
 * and "I wonder". Includes a B1 SELF-TEST that proves the regex catches
 * known first-person tokens — not just whatever happens to be in the
 * post-fix artifact.
 *
 * See .planning/debug/chat-voice-split-regression.md for full diagnosis.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(__dirname, "../..");
const ctx = JSON.parse(
  readFileSync(resolve(projectRoot, "src/data/portfolio-context.json"), "utf8")
);

// BROADENED canonical regex (Plan 17-07 revision B1, hardened by WR-02 quick-260513-hqk).
// Covers:
//   - I'm / I'd / I'll / I've / I am (ASCII U+0027 ' OR curly U+2019 ’ — WR-02)
//   - I build / built / like / liked / wonder / wanted / reach / reached / read /
//     architected / chose / haven / wrote / run / set / shipped / added / prefer /
//     care / watch / track / love / hate /
//     made / created / developed / implemented / designed / think / learned /
//     noticed / tried / tested  (WR-02 verb extensions)
//   - My approach / favorite / favourite (British, WR-02) / projects / code /
//     work / background / stack / version / first /
//     implementation / solution / design / team / experience  (WR-02 possessives)
// MUST stay BYTE-IDENTICAL to FIRST_PERSON_LEAK_RE in scripts/build-chat-context.mjs
// AND FIRST_PERSON_LEAK in tests/api/chat-voice-split.test.ts.
const FIRST_PERSON_LEAK =
  /\b(I(?:['’]|\s)(?:m\b|d\b|ll\b|ve\b|re\b|am\b)|I\s+(?:build|built|like|liked|wonder|wanted|reach|reached|read|architected|chose|haven|wrote|run|set|shipped|added|prefer|care|watch|track|love|hate|made|created|developed|implemented|designed|think|learned|noticed|tried|tested)|My\s+(?:approach|favorite|favourite|projects|code|work|background|stack|version|first|implementation|solution|design|team|experience))\b/i;

describe("UAT Gap #1: B1 self-test — regex catches known first-person tokens", () => {
  // SELF-TEST: prove the regex catches what it SHOULD catch, not just whatever
  // happens to be in the post-fix portfolio-context.json. If a future regex
  // weakening lets these tokens through, this test fails before the artifact
  // sweep tests have a chance to silently pass.
  const KNOWN_LEAKS = [
    "I'm Jack",
    "I built SeatWatch",
    "I architected the system",
    "I chose Postgres",
    "I wanted a faster path",
    "I reach for the boring tool",
    "I read the spec",
    "I build small services",
    "I like tests that fail loudly",
    "I wonder how that actually works",
    "I haven't touched that yet",
    "I'd be comfortable handing off",
    "I'll push to main",
    "I've shipped 6 projects",
    "My approach is",
    "My favorite bug reports",
    // WR-02 (quick-260513-hqk) — newly covered verbs
    "I made a small CLI",
    "I created the build script",
    "I developed the parser",
    "I implemented the cache",
    "I designed the schema",
    "I think the boring path wins",
    "I learned the hard way",
    "I noticed the race",
    "I tried the new flag",
    "I tested with vitest",
    // WR-02 — newly covered possessives
    "My implementation uses...",
    "My solution was...",
    "My design philosophy",
    "My team shipped...",
    "My experience tells me...",
    // WR-02 — British spelling
    "My favourite tool",
    // WR-02 — curly apostrophe (U+2019)
    "I’m Jack",
    "I’d like to ship",
    "I’ve added tests",
  ];

  for (const sample of KNOWN_LEAKS) {
    it(`regex catches: "${sample}"`, () => {
      expect(sample).toMatch(FIRST_PERSON_LEAK);
    });
  }

  it("regex does NOT match third-person variants (negative control)", () => {
    const SAFE = [
      "Jack is a junior software engineer",
      "Jack builds small services",
      "Jack likes tests that fail loudly",
      "His favorite bug reports",
      "Jack's approach is",
      "Jack reaches for the boring tool",
    ];
    for (const sample of SAFE) {
      expect(sample, `false-positive for "${sample}"`).not.toMatch(FIRST_PERSON_LEAK);
    }
  });
});

describe("UAT Gap #1: chat-knowledge JSON voice contract (CHAT-06)", () => {
  it("about.intro is third-person (starts with 'Jack', not 'I')", () => {
    expect(ctx.about?.intro).toBeTypeOf("string");
    expect(ctx.about.intro).not.toMatch(/^I[' ]/);
    expect(ctx.about.intro).toMatch(/^Jack/);
  });

  it("no first-person leak in about.{intro,p1,p2,p3} or experience", () => {
    const fields: Array<[string, string | undefined]> = [
      ["about.intro", ctx.about?.intro],
      ["about.p1", ctx.about?.p1],
      ["about.p2", ctx.about?.p2],
      ["about.p3", ctx.about?.p3],
      ["experience", ctx.experience],
    ];
    for (const [name, value] of fields) {
      expect(value, `${name} should be a string`).toBeTypeOf("string");
      expect(value, `${name} contains first-person leak`).not.toMatch(
        FIRST_PERSON_LEAK
      );
    }
  });

  it("every project has a non-empty caseStudy and no first-person leak", () => {
    expect(Array.isArray(ctx.projects)).toBe(true);
    expect(ctx.projects.length).toBeGreaterThan(0);
    for (const p of ctx.projects) {
      expect(p.caseStudy, `${p.page}.caseStudy is empty`).toBeTruthy();
      expect(typeof p.caseStudy).toBe("string");
      expect(
        p.caseStudy.length,
        `${p.page}.caseStudy too short`
      ).toBeGreaterThan(40);
      expect(
        p.caseStudy,
        `${p.page}.caseStudy contains first-person leak`
      ).not.toMatch(FIRST_PERSON_LEAK);
    }
  });
});
