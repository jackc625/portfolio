// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: "https://jackcutrara.com",
  // Astro 6 removed output:"hybrid" — static is now the default with per-route SSR.
  // Individual API routes opt into SSR via `export const prerender = false`.
  adapter: cloudflare(),
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Geist",
      cssVariable: "--font-display-src",
      weights: [400, 500, 600, 700],
      styles: ["normal"],
      fallbacks: ["system-ui", "-apple-system", "sans-serif"],
    },
    {
      provider: fontProviders.google(),
      name: "Geist",
      cssVariable: "--font-body-src",
      weights: [400, 500, 600, 700],
      styles: ["normal"],
      fallbacks: ["system-ui", "-apple-system", "sans-serif"],
    },
    {
      provider: fontProviders.google(),
      name: "Geist Mono",
      cssVariable: "--font-mono-src",
      weights: [400, 500],
      styles: ["normal"],
      fallbacks: ["ui-monospace", "monospace"],
    },
  ],
});
