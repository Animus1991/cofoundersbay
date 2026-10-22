/**
 * The expertise chips on /mentoring: the areas the listed mentors name, most
 * common first, each with how many mentors name it (docs §70). The chips were
 * a fixed list of six, five of which matched none of the mentors on screen.
 */
export type ExpertiseFacet = { label: string; n: number };

const key = (area: string) => area.trim().toLocaleLowerCase();

export function expertiseFacets(
  mentors: ReadonlyArray<{ expertise: readonly string[] }>,
  selected: string,
  max = 8,
): ExpertiseFacet[] {
  const byKey = new Map<string, ExpertiseFacet>();
  for (const m of mentors) {
    for (const area of new Set(m.expertise.map((e) => e.trim()).filter(Boolean))) {
      const entry = byKey.get(key(area));
      if (entry) entry.n += 1;
      else byKey.set(key(area), { label: area, n: 1 });
    }
  }
  const facets = [...byKey.values()]
    .sort((a, b) => b.n - a.n || a.label.localeCompare(b.label))
    .slice(0, max);
  // A chosen area stays a chip when a search has narrowed it away, so it can
  // be seen and cleared.
  if (selected !== 'All' && !facets.some((f) => key(f.label) === key(selected))) {
    facets.push({ label: selected, n: 0 });
  }
  return facets;
}

/** Mentors who name the area, matched as the cards print it (case aside). */
export function withExpertise<T extends { expertise: readonly string[] }>(mentors: readonly T[], selected: string): T[] {
  if (selected === 'All') return [...mentors];
  return mentors.filter((m) => m.expertise.some((e) => key(e) === key(selected)));
}
