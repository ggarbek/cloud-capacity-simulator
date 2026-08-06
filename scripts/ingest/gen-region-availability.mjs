// gen-region-availability.mjs — regenerate the curated per-region family tables
// (src/data/awsRegionAvailability.ts + gcpRegionAvailability.ts) FROM the vendor
// availability docs, so they can never silently drift out of sync.
//
// WHY: region availability is decoupled from pricing — the live catalog injects
// an availability row for every (region, family) these tables list. If a doc
// refresh adds a family/region and the hand-maintained table isn't updated, that
// family goes missing from availability again (exactly the S62 gap). Making the
// tables GENERATED from the docs removes the drift: update the doc, re-run this.
//
// Usage:
//   node scripts/ingest/gen-region-availability.mjs           # rewrite the tables
//   node scripts/ingest/gen-region-availability.mjs --check   # exit 1 if stale (CI/refresh guard)
//
// The doc parsers here MIRROR src/utils/availabilityReconcile.ts (kept in sync);
// that module powers the vitest guard, this script the (re)generation.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const CHECK = process.argv.includes('--check');

function parseAwsDoc(md) {
  const out = {};
  let cur = null;
  for (const line of md.split('\n')) {
    const h = line.match(/^##\s+.*—\s+`([a-z0-9-]+)`/);
    if (h) { cur = h[1]; out[cur] = new Set(); continue; }
    if (cur && /^\+\s+\*\*/.test(line)) {
      for (const f of line.replace(/^\+\s+\*\*[^:]+:\*\*/, '').split('\\|').map((x) => x.trim().toLowerCase()).filter(Boolean)) {
        out[cur].add(f);
      }
    }
  }
  return out;
}
function parseGcpDoc(md) {
  const out = {};
  for (const line of md.split('\n')) {
    const m = line.match(/^-\s+\*\*([a-z0-9-]+)\*\*[^:]*:\s*(.+)$/);
    if (m) out[m[1]] = new Set(m[2].split(',').map((x) => x.trim().toLowerCase()).filter(Boolean));
  }
  return out;
}

const emit = ({ constName, table, docPath, cloudLabel, helperPrefix, allName }) => {
  const regions = Object.keys(table).sort();
  const body = regions
    .map((r) => {
      const fams = [...table[r]].sort();
      return `  '${r}': new Set([${fams.map((f) => `'${f}'`).join(', ')}]),`;
    })
    .join('\n');
  return `/**
 * ${cloudLabel} per-region instance-family availability.
 *
 * GENERATED from ${docPath} by scripts/ingest/gen-region-availability.mjs —
 * DO NOT hand-edit. Update the doc and re-run the generator (a vitest guard
 * fails the build if this file drifts from the doc). Region availability is
 * injected from this table (decoupled from pricing), so keeping it in lockstep
 * with the published doc is what stops families going silently missing.
 */

/** Region slug → set of family slugs (lowercase) the doc lists as available. */
export const ${constName}: Record<string, ReadonlySet<string>> = {
${body}
};

/** Canonical ordered list of every region present in the doc. */
export const ${allName}: readonly string[] = Object.keys(${constName});

/** True iff the doc publishes the family in the region (case-insensitive). */
export function ${helperPrefix}FamilyInRegion(family: string, region: string): boolean {
  const set = ${constName}[region];
  if (!set) return false;
  return set.has(family.toLowerCase());
}
`;
};

const targets = [
  {
    file: 'src/data/awsRegionAvailability.ts',
    docPath: 'docs/aws/instance-regions.md',
    parse: parseAwsDoc,
    constName: 'AWS_REGION_FAMILIES',
    allName: 'AWS_ALL_REGIONS',
    helperPrefix: 'aws',
    cloudLabel: 'AWS EC2',
  },
  {
    file: 'src/data/gcpRegionAvailability.ts',
    docPath: 'docs/gcp/regions-and-machine-types.md',
    parse: parseGcpDoc,
    constName: 'GCP_REGION_FAMILIES',
    allName: 'GCP_ALL_REGIONS',
    helperPrefix: 'gcp',
    cloudLabel: 'GCP Compute Engine',
  },
];

let stale = 0;
for (const t of targets) {
  const table = t.parse(readFileSync(resolve(ROOT, t.docPath), 'utf8'));
  const next = emit({ ...t, table });
  const cur = (() => { try { return readFileSync(resolve(ROOT, t.file), 'utf8'); } catch { return ''; } })();
  const regions = Object.keys(table).length;
  const pairs = Object.values(table).reduce((n, s) => n + s.size, 0);
  if (cur === next) {
    console.log(`✓ ${t.file} up to date (${regions} regions, ${pairs} family-region pairs)`);
    continue;
  }
  stale += 1;
  if (CHECK) {
    console.error(`✗ ${t.file} is STALE vs ${t.docPath} — run: node scripts/ingest/gen-region-availability.mjs`);
  } else {
    writeFileSync(resolve(ROOT, t.file), next);
    console.log(`↻ regenerated ${t.file} (${regions} regions, ${pairs} family-region pairs)`);
  }
}
if (CHECK && stale) process.exit(1);
