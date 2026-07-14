// Deterministic OG-card source generator (Node built-ins only; zero new deps).
//
// Emits a fully self-contained scripts/og-card.html: an editorial 1200x630 social
// card whose text is rendered in the REAL self-hosted Geist / Geist Mono webfonts,
// embedded as base64 data URIs so the file renders identically offline and in any
// browser. The final public/og-default.png is produced by rendering this HTML at a
// 1200x630 viewport and screenshotting it (the plan's sanctioned "screenshot of a
// page-scoped HTML card" mechanism) -- browsers honor woff2 @font-face, so the card
// gets true Geist glyphs, unlike librsvg (sharp) which ignores @font-face entirely.
//
// Six-token palette only (bg/ink/ink-muted/ink-faint/rule/accent), no icons, no
// gradients, honest non-inflated tagline, zero U+2014 em dashes.
//
// Usage: node scripts/generate-og-card.mjs   ->  writes scripts/og-card.html

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const fontsDir = join(root, ".astro", "fonts");

// Resolve each self-hosted Geist face by its STABLE Astro Fonts API prefix
// rather than a pinned content-hash filename. Astro emits multiple content-hash
// variants per weight and those hashes change whenever the font set/config
// changes, so a hardcoded hash goes stale silently and throws an opaque ENOENT.
// Fail with a clear, actionable message instead.
function findFont(prefix) {
  let entries;
  try {
    entries = readdirSync(fontsDir);
  } catch (err) {
    throw new Error(
      `OG generator: cannot read fonts dir ${fontsDir} (${err.code ?? err.message}); run a build first?`,
    );
  }
  const hit = entries.find(
    (f) => f.startsWith(prefix) && f.endsWith(".woff2"),
  );
  if (!hit) {
    throw new Error(
      `OG generator: no woff2 matching "${prefix}" in ${fontsDir} (run a build first?)`,
    );
  }
  return hit;
}

// The self-hosted Geist faces the site serves (Astro Fonts API output),
// resolved by stable prefix.
const FONTS = {
  display700: findFont("font-display-src-700-normal-latin-"),
  body400: findFont("font-body-src-400-normal-latin-"),
  mono400: findFont("font-mono-src-400-normal-latin-"),
};

function b64(file) {
  return readFileSync(join(fontsDir, file)).toString("base64");
}

const dataUri = (file) => `data:font/woff2;base64,${b64(file)}`;

// Six design tokens (single source of truth: design-system/MASTER.md).
const TOKEN = {
  bg: "#FAFAF7",
  ink: "#0A0A0A",
  inkMuted: "#52525B",
  inkFaint: "#A1A1AA",
  rule: "#E4E4E7",
  accent: "#E63946",
};

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  @font-face {
    font-family: "Geist";
    font-weight: 700;
    font-style: normal;
    font-display: block;
    src: url("${dataUri(FONTS.display700)}") format("woff2");
  }
  @font-face {
    font-family: "Geist";
    font-weight: 400;
    font-style: normal;
    font-display: block;
    src: url("${dataUri(FONTS.body400)}") format("woff2");
  }
  @font-face {
    font-family: "Geist Mono";
    font-weight: 400;
    font-style: normal;
    font-display: block;
    src: url("${dataUri(FONTS.mono400)}") format("woff2");
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; }
  #card {
    width: 1200px;
    height: 630px;
    background: ${TOKEN.bg};
    color: ${TOKEN.ink};
    padding: 84px 88px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    -webkit-font-smoothing: antialiased;
    text-rendering: geometricPrecision;
  }
  .mono {
    font-family: "Geist Mono", monospace;
    font-weight: 400;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }
  .eyebrow { font-size: 21px; color: ${TOKEN.inkFaint}; }
  .rule { height: 1px; background: ${TOKEN.rule}; width: 100%; }
  .top .rule { margin-top: 24px; }
  .wordmark {
    font-family: "Geist", sans-serif;
    font-weight: 700;
    font-size: 132px;
    line-height: 1.0;
    letter-spacing: -0.03em;
    color: ${TOKEN.ink};
  }
  .wordmark .dot { color: ${TOKEN.accent}; }
  .role { font-size: 27px; color: ${TOKEN.ink}; margin-top: 40px; }
  .tagline {
    font-family: "Geist", sans-serif;
    font-weight: 400;
    font-size: 33px;
    letter-spacing: -0.01em;
    color: ${TOKEN.inkMuted};
    margin-top: 20px;
  }
  .bottom .rule { margin-bottom: 22px; }
  .foot { display: flex; justify-content: space-between; }
  .foot span { font-size: 20px; color: ${TOKEN.inkFaint}; }
</style>
</head>
<body>
  <div id="card">
    <div class="top">
      <div class="mono eyebrow">jackcutrara.com</div>
      <div class="rule"></div>
    </div>
    <div class="mid">
      <div class="wordmark">Jack Cutrara<span class="dot">.</span></div>
      <div class="mono role">Software Engineer</div>
      <div class="tagline">Reliable, production-grade software.</div>
    </div>
    <div class="bottom">
      <div class="rule"></div>
      <div class="foot mono">
        <span>Portfolio</span>
        <span>2026</span>
      </div>
    </div>
  </div>
</body>
</html>
`;

const outPath = join(__dirname, "og-card.html");
writeFileSync(outPath, html, "utf8");
console.log(`Wrote ${outPath} (${(html.length / 1024).toFixed(0)} KB, Geist embedded)`);
