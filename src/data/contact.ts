/**
 * Single source of truth for contact information.
 * Consumed by: ContactSection.astro, Footer.astro, MobileMenu.astro, JsonLd.astro
 * Null entries are skipped silently by every consumer.
 */
export const CONTACT = {
  /** Display: "jackcutrara@gmail.com", rendered as mailto: link */
  email: "jackcutrara@gmail.com",
  /** Label: "GITHUB", opens in new tab with rel="noopener noreferrer" */
  github: "https://github.com/jackc625",
  /** Label: "LINKEDIN", opens in new tab with rel="noopener noreferrer" */
  linkedin: "https://linkedin.com/in/jackcutrara",
  /** Label: "X" -- null means skip rendering. One-line edit to activate. */
  x: null as string | null,
  /** Label: "RESUME", rendered as <a download href={resume}>. Path relative to public/. */
  resume: "/jack-cutrara-resume.pdf",
} as const;
