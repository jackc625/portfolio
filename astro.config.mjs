// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://jackcutrara.com",
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Inter",
      cssVariable: "--font-heading",
      weights: [400, 500, 600, 700],
      styles: ["normal"],
    },
    {
      provider: fontProviders.google(),
      name: "Inter",
      cssVariable: "--font-sans",
      weights: [400, 500, 600],
      styles: ["normal", "italic"],
    },
    {
      provider: fontProviders.google(),
      name: "IBM Plex Mono",
      cssVariable: "--font-code",
      weights: [400, 500],
      styles: ["normal"],
    },
  ],
});
