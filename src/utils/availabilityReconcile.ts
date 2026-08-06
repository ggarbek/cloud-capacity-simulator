/**
 * Availability reconciliation — pure helpers that diff a cloud's PUBLISHED
 * per-region family availability (parsed from the vendor docs) against the
 * curated tables the live catalog injects from (AWS_REGION_FAMILIES /
 * GCP_REGION_FAMILIES).
 *
 * WHY THIS EXISTS: region availability is decoupled from pricing
 * the catalog injects an
 * availability row for every (region, family) the curated tables list. That's
 * only correct while the curated tables stay in sync with the docs. If a weekly
 * doc refresh adds a family/region and the table isn't updated, the family goes
 * missing again. `reconcileCoverage` is the guard: a unit test fails the build
 * when the curated table falls behind the doc, and the refresh Action prints the
 * same report so pricing gaps (family in doc, no rate in the feed) are visible.
 *
 * Pure + dependency-free (string in, structured diff out) so it runs in both
 * vitest and a plain node script.
 */

export type FamilyTable = Record<string, ReadonlySet<string>>;

/** Parse `docs/aws/instance-regions.md` → region slug → set of family slugs
 *  (lowercased). Sections are `## … — \`<slug>\``; family lines are
 *  `+ **<Category>:** Fam \| Fam \| …`. All categories union into one set. */
export function parseAwsDoc(md: string): FamilyTable {
  const out: Record<string, Set<string>> = {};
  let cur: string | null = null;
  for (const line of md.split('\n')) {
    const h = line.match(/^##\s+.*—\s+`([a-z0-9-]+)`/);
    if (h) {
      cur = h[1];
      out[cur] = new Set();
      continue;
    }
    if (cur && /^\+\s+\*\*/.test(line)) {
      const fams = line
        .replace(/^\+\s+\*\*[^:]+:\*\*/, '')
        .split('\\|')
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean);
      for (const f of fams) out[cur].add(f);
    }
  }
  return out;
}

/** Parse `docs/gcp/regions-and-machine-types.md` → region slug → set of series
 *  slugs (lowercased). Lines are `- **<slug>** (city): E2, N2, …`. */
export function parseGcpDoc(md: string): FamilyTable {
  const out: Record<string, Set<string>> = {};
  for (const line of md.split('\n')) {
    const m = line.match(/^-\s+\*\*([a-z0-9-]+)\*\*[^:]*:\s*(.+)$/);
    if (m) {
      out[m[1]] = new Set(
        m[2]
          .split(',')
          .map((x) => x.trim().toLowerCase())
          .filter(Boolean),
      );
    }
  }
  return out;
}

export interface CoverageDiff {
  /** Regions the doc lists that the curated table lacks entirely. */
  regionsMissingFromCurated: string[];
  /** (region, family) pairs the doc lists but the curated table omits — these
   *  would go MISSING from availability (the recurrence we guard against). */
  familyGaps: { region: string; family: string }[];
  /** Total doc (region,family) pairs checked. */
  totalDocPairs: number;
}

/**
 * Every (region, family) the doc publishes MUST be present in the curated table
 * (the table may hold EXTRA legacy families — that's fine). Anything the doc has
 * but the table lacks is a coverage gap that would drop that family from
 * availability on the next catalog build.
 */
export function reconcileCoverage(doc: FamilyTable, curated: FamilyTable): CoverageDiff {
  const regionsMissingFromCurated: string[] = [];
  const familyGaps: { region: string; family: string }[] = [];
  let totalDocPairs = 0;
  for (const [region, docFams] of Object.entries(doc)) {
    const curatedFams = curated[region];
    if (!curatedFams) {
      regionsMissingFromCurated.push(region);
      for (const f of docFams) familyGaps.push({ region, family: f });
      totalDocPairs += docFams.size;
      continue;
    }
    for (const f of docFams) {
      totalDocPairs += 1;
      if (!curatedFams.has(f)) familyGaps.push({ region, family: f });
    }
  }
  return {
    regionsMissingFromCurated: regionsMissingFromCurated.sort(),
    familyGaps: familyGaps.sort((a, b) => a.region.localeCompare(b.region) || a.family.localeCompare(b.family)),
    totalDocPairs,
  };
}
