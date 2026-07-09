import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const projects = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/projects" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      tagline: z.string().max(80),
      description: z.string(),
      techStack: z.array(z.string()).min(1),
      featured: z.boolean().default(false),
      status: z.enum(["completed", "in-progress"]),
      githubUrl: z.url().optional(),
      demoUrl: z.url().optional(),
      thumbnail: image().optional(),
      category: z.enum(["web-app", "cli-tool", "library", "api", "other"]),
      order: z.number().int().min(1),
      year: z.string().regex(/^\d{4}$/),
      source: z.string(), // D-15. File existence validated by sync script, not Zod (Pitfall 7).
    }),
});

const experience = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/experience" }),
  schema: z.object({
    role: z.string(),
    company: z.string(),
    location: z.string(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(), // absence ⇒ present (D-01); OMIT from Holloway, do not use ""
    dateRange: z.string(), // display-only, decoupled from sort (D-05)
    techStack: z.array(z.string()), // NO .min(1) — Balfour is [] (D-10)
    summary: z.string(), // first-person site voice (on-page .lead tagline)
    description: z.string().optional(), // WR-02: short recruiter-facing meta/OG description; detail route falls back to summary when absent (Balfour has none)
    highlights: z.array(z.string()).max(5), // .max(5), NO hard min (A1) so Balfour validates
    engagementType: z.enum(["contract", "internship"]),
    hasCaseStudy: z.boolean(),
    chatSummary: z.string().optional(), // content deferred to Phase 25 (D-02)
    source: z.string(), // existence validated by sync script, not Zod
  }),
});

export const collections = { projects, experience };
