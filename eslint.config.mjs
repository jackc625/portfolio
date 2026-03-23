import eslintPluginAstro from "eslint-plugin-astro";

export default [
  {
    ignores: [".astro/", "dist/"],
  },
  ...eslintPluginAstro.configs.recommended,
  {
    rules: {},
  },
];
