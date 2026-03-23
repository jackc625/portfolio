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
      githubUrl: z.string().url().optional(),
      demoUrl: z.string().url().optional(),
      thumbnail: image(),
      category: z.enum(["web-app", "cli-tool", "library", "api", "other"]),
      order: z.number().int().min(1),
    }),
});

export const collections = { projects };
