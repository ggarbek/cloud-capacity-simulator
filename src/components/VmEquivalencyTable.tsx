/**
 * VM Equivalency audit table (v2.27.1) — the VM-level sibling of
 * RegionEquivalencyTable: a numbered, line-by-line view of which VM SIZES are
 * considered equivalent across AWS / GCP / Azure, and WHY, so the matching
 * logic can be eyeballed for mistakes the same way the region table is.
 *
 * Why anchor-based (not symmetric clustering like the region table): there are
 * ~90k catalog VMs vs ~600 regions, so an all-pairs cluster is intractable and
 * unreadable. Instead we pick a REFERENCE cloud and, for each of its sizes,
 * show the closest equivalent on the other two clouds — exactly the question a
 * PM asks ("for each Azure size, what's the AWS/GCP equivalent?"). The match is
 * the shared `bestVmMatch` engine (utils/equivalence): same product CATEGORY is
 * a hard gate, then nearest by vCPU / memory / mem-per-vCPU with an
 * architecture (Intel/AMD/Arm) preference. A cloud with no same-category match
 * is a real product gap (rendered "— none").
 */
import { useMemo, useState } from 'react';
import { useApp } from '../state/AppContext';
import type { CatalogEntry } from '../types';
import { categorize } from '../utils/vmCategory';
import { vmFamily } from '../utils/vmTaxonomy';
import {
  bestVmMatch,
  vmFeatures,
  matchPct,
  type VmMatch,
} from '../utils/equivalence';
import { matchCaveats, worstCaveat, type MatchCaveat } from '../utils/matchCaveats';

type Provider = 'AWS' | 'GCP' | 'Azure';
const COLS: Provider[] = ['AWS', 'GCP', 'Azure'];
const TONE: Record<Provider, string> = { AWS: '#FBBF24', GCP: '#FCA5A5', Azure: '#60A5FA' };
/** Tone for a 0–100 similarity score — green ≥85 / amber ≥65 / red below. */
function pctTone(pct: number): string {
  return pct >= 85 ? '#34D399' : pct >= 65 ? '#FBBF24' : '#F87171';
}
/** Cap on displayed rows — keep the table readable; filtering narrows below it. */
const MAX_ROWS = 200;

interface Row {
  n: number;
  ref: CatalogEntry;
  refProvider: Provider;
  category: string;
  matches: Record<Provider, VmMatch | null>; // ref's own column holds null
  cloudsPresent: number; // ref + clouds with a same-category match
}

function cat(v: CatalogEntry): string {
  return v.category ?? categorize(v.provider, v.family);
}

export function VmEquivalencyTable() {
  const { state } = useApp();
  const userVms = state.userVms;
  const [refProvider, setRefProvider] = useState<Provider>('Azure');
  const [query, setQuery] = useState('');
  const [gapsOnly, setGapsOnly] = useState(false);

  // Distinct specs per provider (region-independent), deduped by size name.
  const specsByProvider = useMemo(() => {
    const out: Record<Provider, CatalogEntry[]> = { AWS: [], GCP: [], Azure: [] };
    const seen: Record<Provider, Set<string>> = { AWS: new Set(), GCP: new Set(), Azure: new Set() };
    for (const v of userVms) {
      const p = v.provider as Provider;
      if (!COLS.includes(p)) continue;
      if (seen[p].has(v.vmSizeName)) continue;
      seen[p].add(v.vmSizeName);
      out[p].push(v);
    }
    return out;
  }, [userVms]);

  // Anchor list = reference cloud's distinct specs, filtered by the search,
  // sorted (category → family → vCPU), capped, THEN matched (so we only run
  // bestVmMatch for rows we actually display).
  const { rows, totalAnchors } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const targets = COLS.filter((p) => p !== refProvider);
    let anchors = specsByProvider[refProvider];
    if (q) {
      anchors = anchors.filter((v) => {
        const hay = `${v.vmSizeName} ${vmFamily(v) ?? ''} ${cat(v)}`.toLowerCase();
        return hay.includes(q);
      });
    }
    const total = anchors.length;
    const sorted = [...anchors].sort(
      (a, b) =>
        cat(a).localeCompare(cat(b)) ||
        (vmFamily(a) ?? '').localeCompare(vmFamily(b) ?? '') ||
        a.vcpus - b.vcpus ||
        a.memoryGib - b.memoryGib,
    );
    const capped = sorted.slice(0, MAX_ROWS);
    const built: Row[] = capped.map((ref, i) => {
      const matches: Record<Provider, VmMatch | null> = { AWS: null, GCP: null, Azure: null };
      let present = 1; // the reference cloud itself
      for (const t of targets) {
        const m = bestVmMatch(ref, specsByProvider[t]);
        matches[t] = m;
        if (m) present += 1;
      }
      return { n: i + 1, ref, refProvider, category: cat(ref), matches, cloudsPresent: present };
    });
    return { rows: built, totalAnchors: total };
  }, [specsByProvider, refProvider, query]);

  const filtered = useMemo(
    () => (gapsOnly ? rows.filter((r) => r.cloudsPresent < 3) : rows),
    [rows, gapsOnly],
  );

  const fullTrio = rows.filter((r) => r.cloudsPresent === 3).length;
  const capped = totalAnchors > MAX_ROWS;

  // v2.27.9 — Base cloud leads the columns (the model of comparison), the
  // other two follow. Mirrors the Region Availability base-cloud ordering.
  const orderedCols: Provider[] = [refProvider, ...COLS.filter((p) => p !== refProvider)];

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px', marginBottom: 18 }}>
      <div className="section-h" style={{ marginBottom: 2 }}>
        VM equivalency — line by line
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginBottom: 10 }}>
        <strong>{refProvider}</strong> is the base of comparison: for each of its sizes, the closest
        equivalent on the other clouds — same product <strong>category</strong> (a hard gate), then
        nearest by vCPU, memory & memory-per-vCPU with a CPU-architecture preference. Equivalents are
        <em> similar, not exact</em>; the <strong>≈% match</strong> on each cell scores how close it is to
        the base size. A cloud with no same-category match is a product gap.
      </div>

      <div className="flex items-center" style={{ gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
        <div className="flex items-center" style={{ gap: 4 }}>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Base cloud:</span>
          {COLS.map((p) => (
            <button
              key={p}
              onClick={() => setRefProvider(p)}
              className="text-[11px] font-semibold"
              style={{
                padding: '3px 10px',
                borderRadius: 'var(--radius-pill)',
                border: `1px solid ${refProvider === p ? TONE[p] : 'var(--border)'}`,
                background: refProvider === p ? `color-mix(in srgb, ${TONE[p]} 16%, transparent)` : 'transparent',
                color: refProvider === p ? TONE[p] : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {p}
            </button>
          ))}
        </div>
        <input
          className="glass-input font-mono"
          placeholder="Filter by size, family or category…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ padding: '6px 10px', fontSize: 11.5, flex: 1, minWidth: 180 }}
        />
        <label className="flex items-center text-[11px]" style={{ gap: 5, color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <input type="checkbox" checked={gapsOnly} onChange={(e) => setGapsOnly(e.target.checked)} />
          Only show gaps (not all three)
        </label>
      </div>

      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginBottom: 8 }}>
        {filtered.length} row{filtered.length === 1 ? '' : 's'} · {fullTrio} with a match on all three
        {capped && <> · showing the first {MAX_ROWS} of {totalAnchors.toLocaleString()} {refProvider} sizes — filter to narrow</>}
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <div className="grid" style={{ gridTemplateColumns: '34px repeat(3, 1fr) 1.9fr', fontSize: 9.5, letterSpacing: '0.04em', color: 'var(--text-muted)', background: 'var(--tint-soft)', padding: '7px 10px' }}>
          <div>#</div>
          {orderedCols.map((p) => (
            <div key={p} style={{ color: TONE[p], fontWeight: 700 }}>
              {p}{p === refProvider ? ' · base' : ''}
            </div>
          ))}
          <div>WHY EQUIVALENT</div>
        </div>
        <div style={{ maxHeight: 560, overflowY: 'auto' }}>
          {filtered.map((r) => (
            <div
              key={r.n}
              className="grid"
              style={{
                gridTemplateColumns: '34px repeat(3, 1fr) 1.9fr',
                padding: '7px 10px',
                borderTop: '1px solid var(--border)',
                background: r.cloudsPresent < 3 ? 'color-mix(in srgb, #FBBF24 4%, transparent)' : 'transparent',
                alignItems: 'start',
              }}
            >
              <div className="text-[10px] font-mono" style={{ color: 'var(--text-muted)', paddingTop: 1 }}>{r.n}</div>
              {orderedCols.map((p) => (
                <div key={p} style={{ paddingRight: 6 }}>
                  {p === r.refProvider ? (
                    <Cell name={r.ref.vmSizeName} sub={`${r.ref.vcpus} vCPU · ${r.ref.memoryGib} GiB`} isRef />
                  ) : r.matches[p] ? (
                    <Cell
                      name={r.matches[p]!.vm.vmSizeName}
                      sub={`${r.matches[p]!.vm.vcpus} vCPU · ${r.matches[p]!.vm.memoryGib} GiB`}
                      pct={matchPct(r.matches[p]!.distance)}
                      caveats={matchCaveats(r.ref, r.matches[p]!.vm, {
                        distance: r.matches[p]!.distance,
                      })}
                    />
                  ) : (
                    <span className="text-[11px]" style={{ color: '#FBBF24', opacity: 0.85 }}>— none</span>
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
              {gapsOnly ? 'No gaps in the current scope — every shown size matches on all three clouds.' : `No ${refProvider} sizes match “${query}”.`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** ONE comparability chip for a match cell — the single worst caveat, amber for
 *  a warning / neutral for info; the FULL caveat list is the hover tooltip. */
function CaveatChip({ caveats }: { caveats: MatchCaveat[] }) {
  const worst = worstCaveat(caveats);
  if (!worst) return null;
  const warn = worst.severity === 'warn';
  return (
    <span
      className="text-[8.5px] font-semibold shrink-0"
      style={{
        padding: '0 5px',
        lineHeight: '13px',
        borderRadius: 999,
        whiteSpace: 'nowrap',
        color: warn ? '#FBBF24' : 'var(--text-muted)',
        background: warn ? 'rgba(251,191,36,0.10)' : 'var(--tint-soft)',
        border: `1px solid ${warn ? 'rgba(251,191,36,0.32)' : 'var(--border)'}`,
      }}
      title={caveats.map((c) => `${c.label}: ${c.detail}`).join('\n')}
    >
      {warn ? '⚠ ' : ''}{worst.label}
    </span>
  );
}

function Cell({
  name,
  sub,
  pct,
  isRef,
  caveats,
}: {
  name: string;
  sub: string;
  pct?: number;
  isRef?: boolean;
  caveats?: MatchCaveat[];
}) {
  return (
    <div className="text-[10.5px]" style={{ lineHeight: 1.35 }}>
      <div className="flex items-center flex-wrap" style={{ gap: 5 }}>
        <span className="font-mono" style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{name}</span>
        {pct != null && (
          <span
            className="text-[9px] font-semibold"
            style={{ color: pctTone(pct), flexShrink: 0 }}
            title="Similarity to the base size (specs · performance · hardware)"
          >
            ≈{pct}%
          </span>
        )}
        {caveats && caveats.length > 0 && <CaveatChip caveats={caveats} />}
        {isRef && (
          <span
            className="text-[8.5px] font-semibold uppercase"
            style={{ color: 'var(--interactive)', flexShrink: 0 }}
            title="The base cloud — the model of comparison"
          >
            base
          </span>
        )}
      </div>
      <div style={{ color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  );
}

function deltaPhrase(ref: CatalogEntry, m: CatalogEntry): string {
  const parts: string[] = [];
  if (ref.vcpus !== m.vcpus) parts.push(`${m.vcpus} vs ${ref.vcpus} vCPU`);
  if (ref.memoryGib !== m.memoryGib) parts.push(`${m.memoryGib} vs ${ref.memoryGib} GiB`);
  const ra = vmFeatures(ref).arch;
  const ma = vmFeatures(m).arch;
  if (ra !== ma && ra !== 'other' && ma !== 'other') parts.push(`${ma} vs ${ra}`);
  return parts.length ? ` (${parts.join(', ')})` : ' (identical spec)';
}

function whyText(r: Row): string {
  const targets = COLS.filter((p) => p !== r.refProvider);
  const have = targets.filter((p) => r.matches[p]);
  const miss = targets.filter((p) => !r.matches[p]);
  const famNote = vmFamily(r.ref) ? `${r.refProvider} ${vmFamily(r.ref)}` : r.refProvider;
  const segs: string[] = [`Same category (${r.category}).`];
  for (const p of have) {
    const m = r.matches[p]!;
    segs.push(`${p}: ${m.vm.vmSizeName} — ${m.quality}${deltaPhrase(r.ref, m.vm)}.`);
  }
  if (miss.length) {
    segs.push(`No ${r.category} equivalent on ${miss.join(' or ')} — a product gap for ${famNote}.`);
  }
  return segs.join(' ');
}
