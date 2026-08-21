/**
 * MatchMethodology — a visible, honest strip that explains HOW the Specs page
 * decides two VMs are "equivalent". Cross-cloud size matching used to be an
 * opaque number; this surface names the three stages in plain language and,
 * on expand, shows the actual per-pairing breakdown (`describeMatch` + the top
 * spec-distance drivers as chips) so the % is legible instead of mysterious.
 *
 * Two variants:
 *   - 'strip'  — full-width header on the Specs page. Collapsed = one glass row
 *     with the pipeline sentence + a Disclosure "Details" that unpacks every
 *     picked pairing.
 *   - 'inline' — compact, embedded inside a BoM line card. A single expander
 *     ("How this match scored") for one base→analog pairing, no outer glass.
 *
 * Pure derived render over the equivalence engine (`vmFeatures`,
 * `explainVmDistance`, `describeMatch`) — no state, no new data.
 *
 * CAVEAT SLOT: the optional `caveatsFor` prop is a hook for a later wave to
 * inject per-pairing caveats (e.g. "no local NVMe analog"). When undefined
 * (the default) nothing extra renders. The prop type is declared locally on
 * purpose so this component stays independent of the caveats module.
 */
import type { CatalogEntry } from '../../types';
import { vmFeatures, explainVmDistance, describeMatch } from '../../utils/equivalence';
import { Disclosure } from '../Disclosure';

/** Local caveat shape — mirrors the future caveats module without importing it,
 *  so C1 stays independent. A later wave wires a real `caveatsFor`. */
export interface MatchCaveat {
  label: string;
  detail: string;
  tone?: 'amber' | 'neutral';
}
export type CaveatsFor = (
  base: CatalogEntry,
  analog: CatalogEntry,
) => MatchCaveat[];

const PROVIDER_FG: Record<string, string> = {
  azure: '#93C5FD',
  aws: '#FCD34D',
  gcp: '#FCA5A5',
};
function providerFg(provider: string | undefined): string {
  return PROVIDER_FG[(provider || '').trim().toLowerCase()] ?? 'var(--text-primary)';
}

/** A min-px-2 driver chip: one spec dimension + its share of the gap. */
function DriverChip({ dimension, share }: { dimension: string; share: number }): JSX.Element {
  return (
    <span
      className="text-[10px] text-text-secondary"
      title={`${dimension} accounts for ~${Math.round(share * 100)}% of the spec gap`}
      style={{
        padding: '2px 8px',
        borderRadius: 'var(--radius-pill)',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid var(--border)',
        whiteSpace: 'nowrap',
      }}
    >
      {dimension} {Math.round(share * 100)}%
    </span>
  );
}

/** A caveat chip — amber tone flags a real spec compromise. */
function CaveatChip({ caveat }: { caveat: MatchCaveat }): JSX.Element {
  const amber = caveat.tone === 'amber';
  return (
    <span
      className="text-[10px]"
      title={caveat.detail}
      style={{
        padding: '2px 8px',
        borderRadius: 'var(--radius-pill)',
        background: amber ? 'rgba(251, 191, 36, 0.12)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${amber ? 'rgba(251, 191, 36, 0.35)' : 'var(--border)'}`,
        color: amber ? 'var(--accent-amber)' : 'var(--text-secondary)',
        whiteSpace: 'nowrap',
      }}
    >
      {caveat.label}
    </span>
  );
}

/** The three-stage pipeline, one sentence each — the same words in strip +
 *  inline so the mental model is consistent across surfaces. */
function StageList(): JSX.Element {
  return (
    <ol className="space-y-1" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {[
        {
          n: 1,
          t: 'Category gate',
          d: 'Only VMs in the same workload category (General Purpose, Memory Optimized, …) are eligible — a database size never matches a GPU size.',
        },
        {
          n: 2,
          t: 'Weighted spec distance',
          d: 'Eligible candidates are scored on vCPU, memory, mem-per-vCPU shape, CPU arch/gen, network, local disk and GPU traits — each weighted by how much it distinguishes sizes.',
        },
        {
          n: 3,
          t: '% similarity',
          d: 'The closest candidate wins; its distance is mapped to a 0–100 similarity so you can see how faithful the analog is.',
        },
      ].map((s) => (
        <li key={s.n} className="flex gap-2" style={{ alignItems: 'baseline' }}>
          <span
            className="text-[10px] font-semibold"
            style={{ color: 'var(--interactive)', flexShrink: 0, width: 12 }}
          >
            {s.n}
          </span>
          <span className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{s.t}.</strong> {s.d}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** One base→analog pairing breakdown: the plain-language verdict, the top
 *  drivers as chips, and any caveats. */
function PairingBreakdown({
  base,
  match,
  caveatsFor,
}: {
  base: CatalogEntry;
  match: { provider: string; vm: CatalogEntry };
  caveatsFor?: CaveatsFor;
}): JSX.Element {
  const baseFeat = vmFeatures(base);
  const feat = vmFeatures(match.vm);
  const { drivers } = explainVmDistance(baseFeat, feat);
  const sentence = describeMatch(baseFeat, feat);
  const caveats = caveatsFor?.(base, match.vm) ?? [];
  const topDrivers = drivers.slice(0, 3);
  return (
    <div className="space-y-1.5">
      <div className="text-[11px]" style={{ color: 'var(--text-primary)' }}>
        <span style={{ color: providerFg(base.provider), fontWeight: 600 }}>{base.vmSizeName}</span>
        <span style={{ color: 'var(--text-muted)' }}> → </span>
        <span style={{ color: providerFg(match.vm.provider), fontWeight: 600 }}>
          {match.vm.vmSizeName}
        </span>
      </div>
      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {sentence}
      </p>
      {(topDrivers.length > 0 || caveats.length > 0) && (
        <div className="flex flex-wrap gap-x-2 gap-y-1" style={{ alignItems: 'center' }}>
          {topDrivers.map((d) => (
            <DriverChip key={d.dimension} dimension={d.dimension} share={d.share} />
          ))}
          {caveats.map((c, i) => (
            <CaveatChip key={`cv-${i}`} caveat={c} />
          ))}
        </div>
      )}
    </div>
  );
}

export interface MatchMethodologyProps {
  /** The base VM every analog is scored against. Null → strip renders only the
   *  pipeline explainer (no pairings yet). */
  base: CatalogEntry | null;
  /** The picked analogs — one per non-base cloud. */
  matches: { provider: string; vm: CatalogEntry }[];
  /** 'strip' — full-width header. 'footer' — same content, quieter framing for
   *  the BOTTOM of the page (S65): a muted one-liner + a collapsed "Details".
   *  'inline' — a single BoM-line pairing expander. */
  variant?: 'strip' | 'inline' | 'footer';
  /** Optional per-pairing caveats. Undefined (default) → nothing extra. */
  caveatsFor?: CaveatsFor;
}

export function MatchMethodology({
  base,
  matches,
  variant = 'strip',
  caveatsFor,
}: MatchMethodologyProps): JSX.Element {
  // Only score analogs that are a DIFFERENT provider from the base (the base's
  // own size is a trivial 100% and adds no signal).
  const pairings = base
    ? matches.filter(
        (m) =>
          (m.vm.provider ?? '').toLowerCase() !== (base.provider ?? '').toLowerCase() ||
          m.vm.vmSizeName !== base.vmSizeName,
      )
    : [];

  if (variant === 'inline') {
    // Compact expander for a single BoM-line pairing. `matches[0]` is the one
    // cloud this line card row is about.
    const m = matches[0];
    if (!base || !m) return <></>;
    return (
      <Disclosure title="How this match scored">
        <div style={{ paddingTop: 6 }}>
          <PairingBreakdown base={base} match={m} caveatsFor={caveatsFor} />
        </div>
      </Disclosure>
    );
  }

  // footer — the same pipeline explainer, quietly parked at the bottom of the
  // page. No glass card; a muted one-liner with an inline "Details" disclosure.
  if (variant === 'footer') {
    return (
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <div className="flex items-center gap-1.5 flex-wrap" style={{ marginBottom: 6 }}>
          <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
            How we match
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            same category gate → weighted spec distance → % similarity
          </span>
        </div>
        <Disclosure
          title="Details"
          subtitle={pairings.length ? `${pairings.length} pairing${pairings.length === 1 ? '' : 's'}` : undefined}
        >
          <div className="space-y-3" style={{ paddingTop: 6 }}>
            <StageList />
            {pairings.length > 0 && (
              <div className="space-y-3" style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                {pairings.map((m) => (
                  <PairingBreakdown
                    key={`${m.provider}::${m.vm.vmSizeName}`}
                    base={base as CatalogEntry}
                    match={m}
                    caveatsFor={caveatsFor}
                  />
                ))}
              </div>
            )}
          </div>
        </Disclosure>
      </div>
    );
  }

  // strip
  return (
    <div className="glass" style={{ padding: 14, borderRadius: 'var(--radius-md)' }}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          How we match
        </span>
        <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
          same category gate
          <span style={{ color: 'var(--text-muted)' }}> → </span>
          weighted spec distance
          <span style={{ color: 'var(--text-muted)' }}> → </span>% similarity
        </span>
      </div>
      <div style={{ marginTop: 10 }}>
        <Disclosure title="Details" subtitle={pairings.length ? `${pairings.length} pairing${pairings.length === 1 ? '' : 's'}` : undefined}>
          <div className="space-y-3" style={{ paddingTop: 6 }}>
            <StageList />
            {pairings.length > 0 && (
              <div
                className="space-y-3"
                style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}
              >
                {pairings.map((m) => (
                  <PairingBreakdown
                    key={`${m.provider}::${m.vm.vmSizeName}`}
                    base={base as CatalogEntry}
                    match={m}
                    caveatsFor={caveatsFor}
                  />
                ))}
              </div>
            )}
          </div>
        </Disclosure>
      </div>
    </div>
  );
}
