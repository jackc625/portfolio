import eslintPluginAstro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [".astro/", "dist/", ".claude/", ".ship-safe/"],
  },
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  {
    rules: {
      // Allow intentionally-unused identifiers prefixed with underscore.
      // Required by chat.ts no-op functions retained for API stability after
      // GSAP removal (Plan 03) — `_el` and `_bubble` are kept so call sites
      // continue to compile while motion is dormant until Phase 10 CHAT-02.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
];
