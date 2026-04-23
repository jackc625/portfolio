/**
 * PortfolioContext -- shape of the merged chat-knowledge JSON consumed by the chat API.
 *
 * This type is the data contract between:
 *   - scripts/build-chat-context.mjs (Plan 14-02 producer)
 *   - src/data/portfolio-context.json (Plan 14-02 artifact)
 *   - src/prompts/system-prompt.ts (Plan 14-04 consumer -- imports this type)
 *   - src/pages/api/chat.ts (runtime consumer via buildSystemPrompt)
 *
 * Keeping this file narrowly scoped (type-only, no logic) lets Plan 14-02 own
 * the shape and Plan 14-04 own the prompt body without cross-plan coupling.
 */

export interface PortfolioContext {
  // STATIC keys (from portfolio-context.static.json -- D-08)
  personal: { name: string; title: string; location: string; summary: string };
  education: { degree: string; school: string; graduation: string };
  skills: {
    languages: string[];
    frameworks: string[];
    databases: string[];
    tools: string[];
  };
  contact: {
    email: string;
    github: string;
    linkedin: string;
    website: string;
  };
  siteStack: string[];

  // GENERATED keys (produced by build-chat-context.mjs -- D-01..D-03)
  projects: Array<{
    name: string;
    description: string;
    tech: string[];
    url?: string;
    page: string;
    caseStudy: string;
    extendedReference: {
      content: string;
      truncated: boolean;
      truncationMarker?: string;
    };
  }>;
  /**
   * Short one-liner composed from about.ts (backward-compat for today's shape).
   * Future callers should prefer the structured `about` field below.
   */
  experience: string;
  about: {
    intro: string;
    p1: string;
    p2: string;
    p3: string;
  };
}
