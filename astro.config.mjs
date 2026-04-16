// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: "https://jackcutrara.com",
  markdown: {
    shikiConfig: {
      theme: 'github-light',
    },
  },
  // Astro 6 removed output:"hybrid" — static is now the default with per-route SSR.
  // Individual API routes opt into SSR via `export const prerender = false`.
  adapter: cloudflare(),
  integrations: [
    mdx(),
    sitemap(),
  ],
  vite: {
    plugins: [tailwindcss()],
    // Prewarm deps that are otherwise discovered lazily on first SSR/client
    // request; without this, the first `pnpm dev` load triggers a re-bundle
    // race with `@cloudflare/vite-plugin`'s miniflare loopback and logs a
    // spurious "file does not exist in optimize deps directory" error.
    optimizeDeps: { include: ["astro-seo", "marked", "dompurify"] },
    ssr: { optimizeDeps: { include: ["astro-seo"] } },
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
