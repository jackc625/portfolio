/**
 * Reusable reverse-chronological ordering contract for experience entries
 * (SC3 / EXP-06, D-04).
 *
 * Structural generic only — imports nothing from `astro:content` so it stays
 * Vitest-testable in the node environment while remaining consumable by
 * Phase 22 as `sortExperienceEntries(await getCollection("experience"))`.
 *
 * Returns a NEW array sorted by `data.startDate` descending (most recent
 * first). The input array is not mutated.
 */
export function sortExperienceEntries<T extends { data: { startDate: Date } }>(
  entries: T[],
): T[] {
  return [...entries].sort(
    (a, b) => b.data.startDate.valueOf() - a.data.startDate.valueOf(),
  );
}
