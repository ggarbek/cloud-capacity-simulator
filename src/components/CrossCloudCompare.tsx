/**
 * Cross-Cloud Compare (v2.26.0) — the frictionless apples-to-apples surface.
 *
 * Pick ONE product (any VM size on any cloud) and instantly see:
 *   • its closest EQUIVALENT on the other two clouds (algorithmic — category
 *     gate + size/arch/memory-tier, via utils/equivalence), and
 *   • a country-by-country availability table for that product + its
 *     equivalents, sorted so the DIFFERENCES surface first — i.e. exactly
 *     where one cloud serves a market the others don't.
 *
 * For a PM this answers "is a competitor expanding into markets we aren't?" and
 * "where is this class of VM actually offered?" at a glance, from the live
 * catalog (real specs + regions, refreshed weekly).
 */
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../state/AppContext';
import type { UserVm } from '../types';
import { categorize } from '../utils/vmCategory';
import { bestVmMatch, vmFeatures, type MatchQuality } from '../utils/equivalence';
import { regionGeo } from '../data/regionGeo';
import { screenContext } from '../terminal/screenContext';

type Provider = 'Azure' | 'AWS' | 'GCP';
const PROVIDERS: Provider[] = ['Azure', 'AWS', 'GCP'];
const TONE: Record<Provider, string> = { Azure: '#60A5FA', AWS: '#FBBF24', GCP: '#FCA5A5' };
const QUALITY_TONE: Record<MatchQuality, string> = {
  exact: 'var(--status-good)',
  close: '#FBBF24',
  loose: 'var(--text-muted)',
};

interface ProviderIndex {
  specs: UserVm[]; // distinct by vmSizeName (specs are region-independent)
  regionsBySku: Map<string, Set<string>>;
}

function fmtMem(g: number): string {
  return g >= 1024 ? `${(g / 1024).toLocaleString(undefined, { maximumFractionDigits: 1 })} TiB` : `${g} GiB`;
}

export function CrossCloudCompare() {
  const { state } = useApp();
  const userVms = state.userVms;

  // ── Per-provider indexes (distinct specs + sku→regions), built once. ──────
  const index = useMemo(() => {
    const out: Record<Provider, ProviderIndex> = {
      Azure: { specs: [], regionsBySku: new Map() },
      AWS: { specs: [], regionsBySku: new Map() },
      GCP: { specs: [], regionsBySku: new Map() },
    };
    const seen: Record<Provider, Set<string>> = { Azure: new Set(), AWS: new Set(), GCP: new Set() };
    for (const v of userVms) {
      const p = v.provider as Provider;
      if (!out[p]) continue;
      if (!seen[p].has(v.vmSizeName)) {
        seen[p].add(v.vmSizeName);
        out[p].specs.push(v);
      }
      if (v.region) {
        let s = out[p].regionsBySku.get(v.vmSizeName);
        if (!s) out[p].regionsBySku.set(v.vmSizeName, (s = new Set()));
        s.add(v.region);
      }
    }
    return out;
  }, [userVms]);

  // ── Source selection. ─────────────────────────────────────────────────────
  const [srcProvider, setSrcProvider] = useState<Provider>('Azure');
  const [query, setQuery] = useState('');
  const [srcSku, setSrcSku] = useState<string>('Standard_D8s_v5');

  const srcVm = useMemo(
    () => index[srcProvider].specs.find((v) => v.vmSizeName === srcSku) ?? null,
    [index, srcProvider, srcSku],
  );

  const searchMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = index[srcProvider].specs;
    if (!q) return list.slice(0, 0);
    return list.filter((v) => v.vmSizeName.toLowerCase().includes(q)).slice(0, 12);
  }, [index, srcProvider, query]);

  // ── Equivalents on the OTHER two clouds. ─────────────────────────────────
  const equivalents = useMemo(() => {
    if (!srcVm) return [];
    return PROVIDERS.filter((p) => p !== srcProvider).map((p) => ({
      provider: p,
      match: bestVmMatch(srcVm, index[p].specs),
    }));
  }, [srcVm, srcProvider, index]);

  // Publish the picked VM (+ its cross-cloud equivalents) as the Terminal's
  // on-screen focus, so "this VM" resolves to it. Data-only; cleared on unmount.
  useEffect(() => {
    if (!srcVm) {
      screenContext.publish(null);
      return;
    }
    screenContext.publish({
      label: `Comparing ${srcVm.vmSizeName} across clouds`,
      detail: `${srcProvider} · ${srcVm.vcpus} vCPU / ${srcVm.memoryGib} GiB`,
      data: {
        source: {
          provider: srcProvider,
          vmSizeName: srcVm.vmSizeName,
          vcpus: srcVm.vcpus,
          memoryGib: srcVm.memoryGib,
          category: srcVm.category,
          hourlyUsd: srcVm.hourlyUsd,
          riOneYrHourlyUsd: srcVm.riOneYrHourlyUsd,
          riThreeYrHourlyUsd: srcVm.riThreeYrHourlyUsd,
        },
        equivalents: equivalents.map((e) => ({
          provider: e.provider,
          vmSizeName: e.match?.vm?.vmSizeName ?? null,
          quality: e.match?.quality ?? 'none',
        })),
      },
    });
    return () => screenContext.publish(null);
  }, [srcVm, srcProvider, equivalents]);

  // ── Country availability for source + each equivalent. ────────────────────
  // countriesByProvider: provider → Map<countryCode, {country, regions[]}>
  const comparison = useMemo(() => {
    if (!srcVm) return null;
    const triple: { provider: Provider; vm: UserVm | null }[] = [
      { provider: srcProvider, vm: srcVm },
      ...equivalents.map((e) => ({ provider: e.provider, vm: e.match?.vm ?? null })),
    ];
    const byProvider = new Map<Provider, Map<string, { country: string; regions: string[] }>>();
    for (const { provider, vm } of triple) {
      const m = new Map<string, { country: string; regions: string[] }>();
      if (vm) {
        const regions = index[provider].regionsBySku.get(vm.vmSizeName) ?? new Set<string>();
        for (const r of regions) {
          const geo = regionGeo(provider, r);
          if (!geo || geo.edge) continue; // edge zones aren't a market
          const e = m.get(geo.cc) ?? { country: geo.country, regions: [] };
          e.regions.push(geo.city);
          m.set(geo.cc, e);
        }
      }
      byProvider.set(provider, m);
    }
    // Union of all countries, each row carrying per-provider presence.
    const allCC = new Set<string>();
    for (const m of byProvider.values()) for (const cc of m.keys()) allCC.add(cc);
    const rows = [...allCC].map((cc) => {
      const cells = triple.map(({ provider }) => byProvider.get(provider)!.get(cc) ?? null);
      const present = cells.filter(Boolean).length;
      const country = cells.find(Boolean)?.country ?? cc;
      return { cc, country, cells, gap: present < triple.length };
    });
    // Differences first (gaps), then alphabetical by country.
    rows.sort((a, b) => Number(b.gap) - Number(a.gap) || a.country.localeCompare(b.country));
    return { triple, rows };
  }, [srcVm, srcProvider, equivalents, index]);

  // ── Market-gap summary (who reaches countries the others don't). ──────────
  const gapSummary = useMemo(() => {
    if (!comparison) return [];
    const { triple, rows } = comparison;
    return triple.map((t, i) => {
      const only = rows.filter((r) => r.cells[i] && r.cells.filter(Boolean).length === 1).length;
      const total = rows.filter((r) => r.cells[i]).length;
      return { provider: t.provider, total, only, hasVm: !!t.vm };
    });
  }, [comparison]);

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '18px 20px',
        marginBottom: 18,
      }}
    >
      <div className="section-h" style={{ marginBottom: 2 }}>
        Compare a product across clouds
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginBottom: 14 }}>
        Pick any VM size — see its closest equivalent on the other two clouds, and exactly which
        countries each one is offered in. Differences sort to the top.
      </div>

      {/* Source picker */}
      <div className="flex items-center" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <div className="inline-flex p-0.5" style={{ gap: 2, border: '1px solid var(--border)', borderRadius: 'var(--radius-pill)', background: 'var(--tint-soft)' }}>
          {PROVIDERS.map((p) => {
            const on = srcProvider === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => { setSrcProvider(p); setQuery(''); }}
                style={{
                  padding: '4px 12px', fontSize: 11.5, fontWeight: on ? 700 : 500,
                  borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer',
                  background: on ? TONE[p] : 'transparent', color: on ? '#0b1020' : 'var(--text-secondary)',
                }}
              >
                {p}
              </button>
            );
          })}
        </div>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <input
            className="glass-input w-full font-mono"
            placeholder={`Search ${index[srcProvider].specs.length.toLocaleString()} ${srcProvider} sizes…  (current: ${srcSku})`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ padding: '7px 11px', fontSize: 12 }}
          />
          {searchMatches.length > 0 && (
            <div
              style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, marginTop: 4,
                background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                maxHeight: 260, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              }}
            >
              {searchMatches.map((v) => (
                <button
                  key={v.vmSizeName}
                  type="button"
                  onClick={() => { setSrcSku(v.vmSizeName); setQuery(''); }}
                  className="w-full text-left transition-colors"
                  style={{ padding: '6px 11px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'baseline' }}
                >
                  <span className="font-mono" style={{ fontSize: 11.5, color: 'var(--text-primary)' }}>{v.vmSizeName}</span>
                  <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {v.vcpus} vCPU · {fmtMem(v.memoryGib)} · {v.category ?? categorize(v.provider, v.family)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {!srcVm ? (
        <div className="text-[11.5px] italic" style={{ color: 'var(--text-muted)' }}>
          Pick a {srcProvider} VM size to compare.
        </div>
      ) : (
        <>
          {/* Equivalent cards */}
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', marginBottom: 16 }}>
            <EquivCard provider={srcProvider} vm={srcVm} source />
            {equivalents.map((e) => (
              <EquivCard key={e.provider} provider={e.provider} vm={e.match?.vm ?? null} quality={e.match?.quality} />
            ))}
          </div>

          {/* Market-gap summary */}
          {gapSummary.length > 0 && (
            <div className="flex flex-wrap" style={{ gap: 10, marginBottom: 12 }}>
              {gapSummary.map((g) => (
                <div key={g.provider} className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                  <span style={{ color: TONE[g.provider], fontWeight: 700 }}>{g.provider}</span>{' '}
                  {g.hasVm ? (
                    <>
                      offers it in <strong>{g.total}</strong> countries
                      {g.only > 0 && <> · <span style={{ color: 'var(--status-warn, #FBBF24)' }}>{g.only} that neither other cloud serves</span></>}
                    </>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>has no equivalent</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Country availability matrix */}
          {comparison && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <div className="grid" style={{ gridTemplateColumns: '1.4fr repeat(3, 1fr)', fontSize: 9.5, letterSpacing: '0.04em', color: 'var(--text-muted)', background: 'var(--tint-soft)', padding: '7px 12px' }}>
                <div>COUNTRY</div>
                {comparison.triple.map((t) => (
                  <div key={t.provider} style={{ color: TONE[t.provider], fontWeight: 700, textAlign: 'center' }}>{t.provider}</div>
                ))}
              </div>
              <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                {comparison.rows.map((r) => (
                  <div
                    key={r.cc}
                    className="grid items-center"
                    style={{
                      gridTemplateColumns: '1.4fr repeat(3, 1fr)', padding: '6px 12px',
                      borderTop: '1px solid var(--border)',
                      background: r.gap ? 'color-mix(in srgb, #FBBF24 5%, transparent)' : 'transparent',
                    }}
                  >
                    <div className="text-[11.5px]" style={{ color: 'var(--text-primary)' }}>
                      {r.country}
                      {r.gap && <span className="ml-1.5 text-[9px]" style={{ color: '#FBBF24' }}>● differs</span>}
                    </div>
                    {r.cells.map((cell, i) => (
                      <div key={i} className="text-center" style={{ fontSize: 10.5 }}>
                        {cell ? (
                          <span style={{ color: 'var(--text-secondary)' }} title={cell.regions.join(', ')}>
                            <span style={{ color: 'var(--status-good)' }}>✓</span> {cell.regions[0]}
                            {cell.regions.length > 1 && <span style={{ color: 'var(--text-muted)' }}> +{cell.regions.length - 1}</span>}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}>—</span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EquivCard({
  provider,
  vm,
  quality,
  source,
}: {
  provider: Provider;
  vm: UserVm | null;
  quality?: MatchQuality;
  source?: boolean;
}) {
  return (
    <div style={{ border: `1px solid ${TONE[provider]}55`, borderRadius: 'var(--radius-md)', padding: '10px 12px', background: `${TONE[provider]}0d` }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
        <span className="text-[10px]" style={{ color: TONE[provider], fontWeight: 700, letterSpacing: '0.04em' }}>{provider}</span>
        {source ? (
          <span className="text-[8.5px]" style={{ color: 'var(--text-muted)', letterSpacing: '0.04em' }}>YOUR PICK</span>
        ) : quality ? (
          <span className="text-[8.5px]" style={{ color: QUALITY_TONE[quality], letterSpacing: '0.04em', fontWeight: 700 }}>{quality.toUpperCase()} MATCH</span>
        ) : null}
      </div>
      {vm ? (
        <>
          <div className="font-mono text-[12px]" style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{vm.vmSizeName}</div>
          <div className="font-mono text-[10px]" style={{ color: 'var(--text-muted)', marginTop: 2 }}>
            {vm.vcpus} vCPU · {fmtMem(vm.memoryGib)}
          </div>
          <div className="text-[9.5px]" style={{ color: 'var(--text-dim)', marginTop: 1 }}>
            {vmFeatures(vm).category} · {vmFeatures(vm).arch === 'other' ? '—' : vmFeatures(vm).arch}
          </div>
        </>
      ) : (
        <div className="text-[11px] italic" style={{ color: 'var(--text-muted)' }}>No equivalent in this category</div>
      )}
    </div>
  );
}
