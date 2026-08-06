/**
 * Region Equivalency audit table (v2.26.1) — a numbered, line-by-line view of
 * which AWS / GCP / Azure regions are considered equivalent, and WHY, so the
 * logic can be eyeballed for mistakes.
 *
 * Equivalency rule (from utils/equivalence + data/regionGeo): regions are
 * equivalent when they sit in the SAME COUNTRY (data-residency / sovereignty is
 * the dominant driver) and are geographically close enough to serve the same
 * customers. This table makes that concrete: every catalog region is clustered
 * by country + proximity (single-linkage within `CLUSTER_KM`), and each cluster
 * is one numbered row showing the peer region on each cloud. A row missing a
 * cloud is a real coverage gap (that cloud has no nearby same-country region).
 */
import { useMemo, useState } from 'react';
import { useApp } from '../state/AppContext';
import { regionGeo, haversineKm, type RegionGeo } from '../data/regionGeo';

type Provider = 'AWS' | 'GCP' | 'Azure';
const COLS: Provider[] = ['AWS', 'GCP', 'Azure']; // column order per request
const TONE: Record<Provider, string> = { AWS: '#FBBF24', GCP: '#FCA5A5', Azure: '#60A5FA' };

/** Same-country regions within this many km cluster into one equivalency row. */
const CLUSTER_KM = 400;

interface Ref {
  provider: Provider;
  region: string;
  geo: RegionGeo;
}
interface Row {
  n: number;
  cc: string;
  country: string;
  cells: Record<Provider, Ref[]>;
  cities: string[];
  maxKm: number;
  cloudsPresent: number;
  gov: boolean;
}

export function RegionEquivalencyTable() {
  const { state } = useApp();
  const userVms = state.userVms;
  const [query, setQuery] = useState('');
  const [gapsOnly, setGapsOnly] = useState(false);

  const rows = useMemo<Row[]>(() => {
    // Catalog regions actually offered, per provider → geo refs (skip edge/unmapped).
    const refs: Ref[] = [];
    const seen = new Set<string>();
    for (const v of userVms) {
      const p = v.provider as Provider;
      if (!COLS.includes(p) || !v.region) continue;
      const key = `${p}|${v.region}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const geo = regionGeo(p, v.region);
      if (geo && !geo.edge) refs.push({ provider: p, region: v.region, geo });
    }

    // Union-find: same country AND within CLUSTER_KM (and same gov/non-gov).
    const parent = refs.map((_, i) => i);
    const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
    const union = (i: number, j: number) => {
      parent[find(i)] = find(j);
    };
    for (let i = 0; i < refs.length; i++) {
      for (let j = i + 1; j < refs.length; j++) {
        const a = refs[i].geo;
        const b = refs[j].geo;
        if (a.cc !== b.cc || !!a.gov !== !!b.gov) continue;
        if (haversineKm(a, b) <= CLUSTER_KM) union(i, j);
      }
    }

    const groups = new Map<number, Ref[]>();
    refs.forEach((r, i) => {
      const root = find(i);
      (groups.get(root) ?? groups.set(root, []).get(root)!).push(r);
    });

    const built: Omit<Row, 'n'>[] = [];
    for (const g of groups.values()) {
      const cells: Record<Provider, Ref[]> = { AWS: [], GCP: [], Azure: [] };
      for (const r of g) cells[r.provider].push(r);
      // Distinct cities, longest-distance pair for the "within X km" note.
      const cities = [...new Set(g.map((r) => r.geo.city))];
      let maxKm = 0;
      for (let i = 0; i < g.length; i++)
        for (let j = i + 1; j < g.length; j++) maxKm = Math.max(maxKm, haversineKm(g[i].geo, g[j].geo));
      const cloudsPresent = COLS.filter((p) => cells[p].length > 0).length;
      built.push({ cc: g[0].geo.cc, country: g[0].geo.country, cells, cities, maxKm, cloudsPresent, gov: !!g[0].geo.gov });
    }

    // Sort: country A→Z, then full-trio rows first, then west→east.
    built.sort(
      (a, b) =>
        a.country.localeCompare(b.country) ||
        b.cloudsPresent - a.cloudsPresent ||
        minLon(a.cells) - minLon(b.cells),
    );
    return built.map((r, i) => ({ ...r, n: i + 1 }));
  }, [userVms]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (gapsOnly && r.cloudsPresent === 3) return false;
      if (!q) return true;
      const hay = [r.country, ...r.cities, ...COLS.flatMap((p) => r.cells[p].map((c) => c.region))]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query, gapsOnly]);

  const fullTrio = rows.filter((r) => r.cloudsPresent === 3).length;

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px', marginBottom: 18 }}>
      <div className="section-h" style={{ marginBottom: 2 }}>
        Region equivalency — line by line
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginBottom: 10 }}>
        Every catalog region, clustered into equivalency rows by <strong>country first</strong> (data
        residency), then proximity (≤ {CLUSTER_KM} km serve the same customers). The <em>why</em> column
        states the rationale — scan it for mismatches. {rows.length} rows · {fullTrio} where all three clouds
        line up.
      </div>

      <div className="flex items-center" style={{ gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
        <input
          className="glass-input font-mono"
          placeholder="Filter by country or region…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ padding: '6px 10px', fontSize: 11.5, flex: 1, minWidth: 200 }}
        />
        <label className="flex items-center text-[11px]" style={{ gap: 5, color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <input type="checkbox" checked={gapsOnly} onChange={(e) => setGapsOnly(e.target.checked)} />
          Only show gaps (not all three)
        </label>
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <div className="grid" style={{ gridTemplateColumns: '34px repeat(3, 1.05fr) 1.7fr', fontSize: 9.5, letterSpacing: '0.04em', color: 'var(--text-muted)', background: 'var(--tint-soft)', padding: '7px 10px' }}>
          <div>#</div>
          {COLS.map((p) => (
            <div key={p} style={{ color: TONE[p], fontWeight: 700 }}>{p}</div>
          ))}
          <div>WHY EQUIVALENT</div>
        </div>
        <div style={{ maxHeight: 560, overflowY: 'auto' }}>
          {filtered.map((r) => (
            <div
              key={r.n}
              className="grid"
              style={{
                gridTemplateColumns: '34px repeat(3, 1.05fr) 1.7fr',
                padding: '7px 10px',
                borderTop: '1px solid var(--border)',
                background: r.cloudsPresent < 3 ? 'color-mix(in srgb, #FBBF24 4%, transparent)' : 'transparent',
                alignItems: 'start',
              }}
            >
              <div className="text-[10px] font-mono" style={{ color: 'var(--text-muted)', paddingTop: 1 }}>{r.n}</div>
              {COLS.map((p) => (
                <div key={p} style={{ paddingRight: 6 }}>
                  {r.cells[p].length > 0 ? (
                    r.cells[p].map((c) => (
                      <div key={c.region} className="text-[10.5px]" style={{ color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                        <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{c.region}</span>
                        <span style={{ color: 'var(--text-muted)' }}> · {c.geo.city}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-[11px]" style={{ color: '#FBBF24', opacity: 0.8 }}>— none</span>
                  )}
                </div>
              ))}
              <div className="text-[10.5px]" style={{ color: 'var(--text-dim)', lineHeight: 1.4 }}>
                {whyText(r)}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-[11px] italic" style={{ color: 'var(--text-muted)', padding: '14px', textAlign: 'center' }}>
              No rows match “{query}”.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function minLon(cells: Record<Provider, Ref[]>): number {
  let m = 180;
  for (const p of COLS) for (const c of cells[p]) m = Math.min(m, c.geo.lon);
  return m;
}

function whyText(r: Row): string {
  const missing = COLS.filter((p) => r.cells[p].length === 0);
  const govNote = r.gov ? ' · government cloud (matches only gov regions)' : '';
  if (r.cloudsPresent === 3) {
    const prox = r.maxKm > 0 ? ` — all within ${r.maxKm} km of each other` : ' — same metro';
    return `Same country (${r.country})${prox}. Metros: ${r.cities.join(', ')}.${govNote}`;
  }
  if (r.cloudsPresent === 2) {
    const have = COLS.filter((p) => r.cells[p].length > 0).join(' + ');
    const prox = r.maxKm > 0 ? `, ${r.maxKm} km apart` : '';
    return `${have} are equivalent — same country (${r.country})${prox}. ${missing.join(' & ')} has no nearby region here.${govNote}`;
  }
  const only = COLS.find((p) => r.cells[p].length > 0)!;
  return `Only ${only} serves ${r.country} (${r.cities.join(', ')}). No same-country region on ${missing.join(' or ')} — a market gap.${govNote}`;
}
