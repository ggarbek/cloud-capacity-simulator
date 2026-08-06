/**
 * CostCalculator — interactive cross-cloud cost estimator for the
 * Compare → Pricing page.
 *
 * v2.46.1 — the per-cloud VM (category / family / size) is LOCKED from the
 * Comparison setup; this page does not re-pick it. The only editable per-cloud
 * field is the BASE cloud's quantity, which the other clouds mirror (you're
 * pricing the SAME workload size across clouds). Region is auto-resolved to the
 * VM's first available region. Shared run-duration + commitment-term knobs drive
 * the cost scenario. "Run" prices it via `computeCost`; a second tool ports the
 * committed VM-demand BoM across clouds via `portBom`.
 *
 * Heavy compute is gated behind the explicit Run / Port buttons. Visual language
 * follows the app + the Comparison-setup filter: `.section-h` headers, `.glass`
 * surfaces, `var(--*)` tokens, the three provider hexes, vertical per-cloud cards
 * with a tinted name + BASE badge.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CatalogEntry, BomEntry } from '../../types';
import { HOURS_PER_MONTH } from '../../types';
import {
  computeCost,
  comparableRegionsFor,
  type CostLine,
  type CostResult,
  type Term,
  type DurationSpec,
} from '../../utils/costCalculator';
import {
  portBom,
  type BomPortResult,
  type PortedScenario,
  type PortedLine,
} from '../../utils/bomPort';
import { vmFamily } from '../../utils/vmTaxonomy';
import { categorize } from '../../utils/vmCategory';
import { regionRefs, bestRegionMatch } from '../../utils/equivalence';

/** A cross-cloud region peer counts as "good" if it's in the same country, or
 *  within ~1000 km of the base region (neighbouring metro / country). Beyond
 *  that we DON'T guess — the cloud is left blank with a "no comparable region"
 *  alert, per the user's explicit preference. */
const REGION_MATCH_KM = 1000;

type Provider = 'Azure' | 'AWS' | 'GCP';

export interface CostCalculatorProps {
  userVms: CatalogEntry[];
  providers: Provider[];
  base: Provider;
  /** LOCKED VM size per cloud, carried over from the Comparison setup. Read-only
   *  here — the only editable field is the base cloud's quantity. */
  lockedSizeByProvider: Partial<Record<string, string | null>>;
  /** The committed VM-demand BoM, for the "port my BoM" scenario. */
  bom: BomEntry[];
  /** Route the user back to Set up to pick the comparison VMs. */
  onGoToSetup?: () => void;
  /** Route the user to the simulator's VM Demand tab to edit the BoM. */
  onGoToVmDemand?: () => void;
  /** When the dock is in VM BoM mode, the per-cloud QTY editor is redundant (the
   *  BoM already fixes the counts) — collapse the estimator to just the run
   *  controls + a BoM-aware Run estimate, and let "Port your VM demand" carry the
   *  results. */
  bomMode?: boolean;
  /** The active VM-BoM line being viewed (from the dock's VIEW LINE pills).
   *  `< 0` = "All" → price the WHOLE BoM (total of every VM); `>= 0` → price just
   *  that one line. Only consulted in BoM mode. */
  bomActiveRow?: number;
  /** Controlled commitment term. When provided, the toggle is driven by the parent
   *  so the sibling cross-cloud cost matrix reprices with it. Omit for standalone
   *  (uncontrolled) use. */
  term?: Term;
  onTermChange?: (term: Term) => void;
  /** S65 — the region the rate bars / cost matrix price the base at
   *  (`equivalents.baseline.region`). When provided and available, the
   *  calculator DEFAULTS to it so all three pricing surfaces agree; the user's
   *  explicit region pick still wins until the default itself changes. */
  defaultBaseRegion?: string;
}

/** Provider foreground hexes (local map — no new tokens). */
const PROVIDER_FG: Record<string, string> = {
  Azure: '#93C5FD',
  AWS: '#FCD34D',
  GCP: '#FCA5A5',
};

const TERMS: { value: Term; label: string }[] = [
  { value: 'payg', label: 'PAYG' },
  { value: '1y', label: '1-yr' },
  { value: '3y', label: '3-yr' },
];

/** Whole-dollar USD with thousands separators. */
const fmtUsd = (n: number): string => `$${Math.round(n).toLocaleString('en-US')}`;
/** One-decimal percent. */
const fmtPct = (n: number): string => `${(Math.round(n * 10) / 10).toFixed(1)}%`;

export function CostCalculator(props: CostCalculatorProps): JSX.Element {
  const { userVms, providers, base, lockedSizeByProvider, bom, onGoToSetup, onGoToVmDemand } =
    props;
  const bomMode = !!props.bomMode && bom.length > 0;
  // In BoM mode, "All" (-1) prices every line; a 0-based index prices just that
  // one. Clamp defensively so an out-of-range index falls back to "All".
  const bomActiveRow = props.bomActiveRow ?? -1;
  const scopedLineIndex =
    bomMode && bomActiveRow >= 0 && bomActiveRow < bom.length ? bomActiveRow : -1;
  const scopedBom = scopedLineIndex >= 0 ? [bom[scopedLineIndex]] : bom;
  const scopedLine = scopedLineIndex >= 0 ? bom[scopedLineIndex] : null;

  // ── C (v2.52.7) — Region picker for the BASE cloud only; the other clouds
  // auto-match the region-equivalent. The base size's available regions feed a
  // <select>; default to the first. (BoM mode locks region per BoM line instead,
  // so this is non-BoM only.)
  const baseSize = lockedSizeByProvider[base] ?? null;
  const baseRegions = useMemo(
    () => (baseSize ? comparableRegionsFor(userVms, base, baseSize) : []),
    [userVms, base, baseSize],
  );
  const [baseRegion, setBaseRegion] = useState<string>('');
  // S65 — pricing-surface consistency: the bars + cost matrix price the base at
  // `equivalents.baseline.region`; the calculator used to default to the
  // alphabetical-first region instead, so its cards could disagree with the
  // charts above them. Now the calculator follows the shared default until the
  // user explicitly picks a region (their pick wins until the default changes).
  const userPickedRegionRef = useRef(false);
  useEffect(() => {
    userPickedRegionRef.current = false; // a new shared default resets overrides
  }, [props.defaultBaseRegion]);
  useEffect(() => {
    const shared = props.defaultBaseRegion;
    if (
      shared &&
      baseRegions.includes(shared) &&
      !userPickedRegionRef.current &&
      baseRegion !== shared
    ) {
      setBaseRegion(shared);
      return;
    }
    // Default / repair the base region whenever the available set changes.
    if (baseRegions.length > 0 && !baseRegions.includes(baseRegion)) {
      setBaseRegion(baseRegions[0]);
    }
  }, [baseRegions, baseRegion, props.defaultBaseRegion]);

  // ── Per-cloud LOCKED rows (size + specs + RESOLVED region). The base cloud
  // uses the picked region; every other cloud auto-matches it to its nearest
  // equivalent — or, when there's no good peer, leaves it BLANK + alerts.
  const rows = useMemo(
    () =>
      providers.map((p) => {
        const size = lockedSizeByProvider[p] ?? null;
        const entry = size
          ? userVms.find((v) => (v.provider ?? '') === p && v.vmSizeName === size) ?? null
          : null;
        const fam = entry ? vmFamily(entry) : null;
        const cat = entry ? entry.category ?? categorize(entry.provider, entry.family) : null;
        const avail = size ? comparableRegionsFor(userVms, p, size) : [];

        let region = '';
        let matchedFrom: string | null = null; // base region this was matched to
        let matchKm: number | null = null;
        let noMatch = false; // no good cross-cloud peer → left blank + alert
        if (size) {
          if (p === base) {
            region = baseRegion || avail[0] || '';
          } else if (baseRegion) {
            const src = regionRefs(base, [baseRegion])[0] ?? null;
            const cands = regionRefs(p, avail);
            const m = src ? bestRegionMatch(src, cands) : null;
            if (m && (m.sameCountry || m.distanceKm <= REGION_MATCH_KM)) {
              region = m.region;
              matchedFrom = baseRegion;
              matchKm = m.distanceKm;
            } else {
              noMatch = true; // don't guess — exclude from the region-scoped price
            }
          } else {
            region = avail[0] || '';
          }
        }
        return { p, size, entry, region, fam, cat, matchedFrom, matchKm, noMatch };
      }),
    [providers, lockedSizeByProvider, userVms, base, baseRegion],
  );
  const anyLocked = rows.some((r) => !!r.size);

  // The ONLY editable per-cloud input — the base quantity; every cloud mirrors it
  // (string-backed so it can be cleared; commits 1 on blur).
  const [baseQty, setBaseQty] = useState('1');
  const qty = useMemo(() => {
    const n = parseInt(baseQty, 10);
    return Number.isFinite(n) && n >= 1 ? n : 1;
  }, [baseQty]);
  const onBaseQtyBlur = () => {
    const n = parseInt(baseQty, 10);
    setBaseQty(Number.isFinite(n) && n >= 1 ? String(n) : '1');
  };

  // Run duration — a value + a unit toggle (months ⇄ hours). The cost engine's
  // DurationSpec accepts either; switching the unit resets to that unit's default.
  const [durationUnit, setDurationUnit] = useState<'months' | 'hours'>('months');
  const [durationValue, setDurationValue] = useState<number>(12);
  const durationChips = durationUnit === 'months' ? [1, 12, 36] : [1, 24, 730];
  const switchDurationUnit = (u: 'months' | 'hours') => {
    if (u === durationUnit) return;
    setDurationUnit(u);
    setDurationValue(u === 'months' ? 12 : 730);
  };
  // Term is controlled when the parent passes `term` (so the sibling cross-cloud
  // matrix reprices in lock-step); otherwise it falls back to local state.
  const [termInternal, setTermInternal] = useState<Term>('payg');
  const term = props.term ?? termInternal;
  const setTerm = (t: Term) => {
    if (props.onTermChange) props.onTermChange(t);
    else setTermInternal(t);
  };

  const [result, setResult] = useState<CostResult | null>(null);
  const [ran, setRan] = useState(false);
  const [portResult, setPortResult] = useState<BomPortResult | null>(null);

  const runEstimate = () => {
    const lines: CostLine[] = rows
      .map((r): CostLine | null =>
        r.size && r.region
          ? { provider: r.p, vmSizeName: r.size, region: r.region, quantity: qty, term }
          : null,
      )
      .filter((l): l is CostLine => l != null);
    const duration: DurationSpec =
      durationUnit === 'hours' ? { hours: durationValue } : { months: durationValue };
    setResult(computeCost(userVms, lines, duration));
    setRan(true);
  };

  // v2.52.20 — In VM-BoM mode the ported cross-cloud cost is REACTIVE: it recomputes
  // whenever the BoM scope (All ⇄ a single line), term, or committed BoM changes, so
  // the displayed cost ALWAYS matches the Comparison ⇄ VM-BoM toggle — no separate
  // "Port" button, no stale totals. In Comparison mode the BoM port is cleared.
  useEffect(() => {
    if (!bomMode) {
      setPortResult(null);
      return;
    }
    const sb = scopedLineIndex >= 0 ? [bom[scopedLineIndex]] : bom;
    if (sb.length === 0 || !sb[0]) {
      setPortResult(null);
      return;
    }
    const targets = providers.filter((p) => p !== base);
    // Pass the run duration so each scenario carries a duration-total (Fix A).
    const duration: DurationSpec =
      durationUnit === 'hours' ? { hours: durationValue } : { months: durationValue };
    setPortResult(portBom(sb, userVms, base, targets, term, true, duration));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bomMode, scopedLineIndex, bom, base, providers, userVms, term, durationUnit, durationValue]);

  // Max provider total for the relative bar basis.
  const maxTotal = useMemo(() => {
    if (!result) return 0;
    return Math.max(0, ...result.perProvider.map((p) => p.totalUsd));
  }, [result]);

  // Human-readable run-duration + term labels, shared by the BoM-mode summary +
  // SKU table captions so they always describe the active scenario.
  const durationLabel =
    durationUnit === 'months'
      ? `${durationValue} month${durationValue === 1 ? '' : 's'}`
      : `${durationValue} hour${durationValue === 1 ? '' : 's'}`;
  const termLabel = TERMS.find((t) => t.value === term)?.label ?? term;

  return (
    <div className="space-y-8">
      {/* ── 1. Cost estimator ────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="section-h">Cost estimator</h2>

        {/* Shared duration + term controls */}
        <div
          className="glass space-y-3"
          style={{ padding: 16, borderRadius: 'var(--radius-md)' }}
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span
              className="text-[10px] uppercase tracking-[0.12em]"
              style={{ color: 'var(--text-muted)' }}
            >
              Run duration
            </span>
            {durationChips.map((v) => {
              const on = durationValue === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setDurationValue(v)}
                  className="text-[11px]"
                  style={{
                    padding: '4px 12px',
                    border: `1px solid ${on ? 'var(--interactive)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-pill)',
                    color: on ? 'var(--interactive)' : 'var(--text-secondary)',
                    background: on ? 'rgba(129, 140, 248, 0.10)' : 'transparent',
                  }}
                >
                  {v} {durationUnit === 'months' ? 'mo' : 'hr'}
                </button>
              );
            })}
            <input
              type="number"
              min={1}
              value={durationValue}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (Number.isFinite(n) && n >= 1) setDurationValue(n);
              }}
              className="text-[11px] glass-input"
              style={{ width: 64, padding: '6px 10px', borderRadius: 'var(--radius-pill)' }}
            />
            {/* months ⇄ hours unit toggle */}
            <div
              role="group"
              aria-label="Duration unit"
              className="inline-flex items-center"
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-pill)',
                overflow: 'hidden',
              }}
            >
              {(['months', 'hours'] as const).map((u) => {
                const on = durationUnit === u;
                return (
                  <button
                    key={u}
                    type="button"
                    onClick={() => switchDurationUnit(u)}
                    className="text-[10px]"
                    style={{
                      padding: '5px 10px',
                      background: on ? 'var(--interactive)' : 'transparent',
                      color: on ? '#04111A' : 'var(--text-muted)',
                      fontWeight: on ? 600 : 500,
                    }}
                  >
                    {u}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span
              className="text-[10px] uppercase tracking-[0.12em]"
              style={{ color: 'var(--text-muted)' }}
            >
              Commitment term
            </span>
            {TERMS.map((t) => {
              const on = term === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTerm(t.value)}
                  className="text-[11px]"
                  style={{
                    padding: '4px 12px',
                    border: `1px solid ${on ? 'var(--interactive)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-pill)',
                    color: on ? 'var(--interactive)' : 'var(--text-secondary)',
                    background: on ? 'rgba(129, 140, 248, 0.10)' : 'transparent',
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* VM BoM mode — quantities come from the committed BoM, so the per-cloud
            QTY editor is dropped; just run the estimate over the ported BoM. */}
        {bomMode && (
          <>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {scopedLine ? (
                <>
                  Pricing <strong>BoM line {scopedLineIndex + 1}</strong> (
                  <strong>{scopedLine.vmSizeName}</strong> ×{' '}
                  {scopedLine.quantity.toLocaleString('en-US')}) — pick{' '}
                  <strong>All</strong> on the dock above to total every line.
                </>
              ) : (
                <>
                  Pricing <strong>all {bom.length}</strong> VM-BoM line
                  {bom.length === 1 ? '' : 's'} — the total cost of deploying every VM.
                </>
              )}{' '}
              Each line prices at the <strong>region set in the BoM</strong> (locked per line).
              Set the run duration &amp; term — the cross-cloud cost updates automatically. Edit the BoM in{' '}
              {onGoToVmDemand ? (
                <button
                  type="button"
                  onClick={onGoToVmDemand}
                  className="underline underline-offset-2"
                  style={{ color: 'var(--interactive)' }}
                >
                  VM Demand →
                </button>
              ) : (
                'VM Demand'
              )}
              .
            </p>

            {/* v2.52.23 — the ported cross-cloud cost is REACTIVE (no Port button):
                it always reflects the VM-BoM selection + duration/term.
                  · BomCostSummary  — per-cloud TOTAL over the selected timeframe+term
                    (relative bars + Δ-vs-cheapest) + a $/hr·$/day·$/mo·$/yr breakdown.
                  · BomSkuCostTable — scalable per-SKU cross-cloud cost table covering
                    the whole BoM (or the single active line) with a TOTALS row. */}
            {portResult ? (
              <>
                <BomCostSummary
                  result={portResult}
                  durationLabel={durationLabel}
                  termLabel={termLabel}
                />
                <BomSkuCostTable
                  result={portResult}
                  durationLabel={durationLabel}
                  termLabel={termLabel}
                  showingAll={scopedLineIndex < 0}
                  lineCount={bom.length}
                />
              </>
            ) : (
              <p className="text-[11px] italic" style={{ color: 'var(--text-muted)' }}>
                Add VM-BoM lines in VM Demand to see the ported cross-cloud cost.
              </p>
            )}
          </>
        )}

        {!bomMode && (
          <>
        {/* Locked-from-setup note */}
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          VM category, family & size are locked from{' '}
          <button
            type="button"
            onClick={onGoToSetup}
            className="underline underline-offset-2"
            style={{ color: 'var(--interactive)' }}
          >
            Comparison setup
          </button>
          . Set the base quantity — the other clouds price the same count.
        </p>

        {/* C — Base-cloud region picker; other clouds auto-match the equivalent. */}
        {baseRegions.length > 0 && (
          <div
            className="glass flex flex-wrap items-center gap-x-3 gap-y-2"
            style={{ padding: 12, borderRadius: 'var(--radius-md)' }}
          >
            <span
              className="text-[10px] uppercase tracking-[0.12em]"
              style={{ color: 'var(--text-muted)' }}
            >
              Base region
            </span>
            <select
              value={baseRegion}
              onChange={(e) => {
                userPickedRegionRef.current = true; // explicit pick wins over the shared default
                setBaseRegion(e.target.value);
              }}
              className="text-[11px] glass-input"
              style={{ padding: '6px 10px', borderRadius: 'var(--radius-pill)', maxWidth: 260 }}
            >
              {baseRegions.map((rg) => (
                <option key={rg} value={rg}>
                  {rg}
                </option>
              ))}
            </select>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              the other clouds auto-match the nearest equivalent region
            </span>
          </div>
        )}

        {/* Per-provider LOCKED rows (vertical, one card per cloud) — compact:
            slim padding + tight gap so the three clouds read as a dense stack,
            not three tall cards (user: "takes up way more space than it needs"). */}
        {anyLocked ? (
          <div className="space-y-1.5">
            {rows.map((r) => {
              const fg = PROVIDER_FG[r.p] ?? 'var(--text-primary)';
              const isBase = r.p === base;
              return (
                <div
                  key={r.p}
                  className="glass"
                  style={{
                    padding: '7px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${isBase ? `${fg}55` : 'var(--border)'}`,
                    background: isBase ? `${fg}0F` : undefined,
                  }}
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span
                      className="text-[13px] font-semibold flex items-center gap-x-2"
                      style={{ color: fg, minWidth: 56 }}
                    >
                      {r.p}
                      {isBase && (
                        <span
                          className="text-[8px] font-semibold tracking-[0.05em] px-1.5 py-0.5"
                          style={{
                            color: fg,
                            background: 'rgba(255,255,255,0.07)',
                            borderRadius: 999,
                          }}
                        >
                          BASE
                        </span>
                      )}
                    </span>

                    {/* Locked VM identity */}
                    <div style={{ flex: '1 1 220px', minWidth: 160 }}>
                      {r.size ? (
                        <>
                          <span
                            className="block text-[12px] font-medium"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {r.size}
                          </span>
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {[r.cat, r.fam].filter(Boolean).join(' · ')}
                            {r.region && (
                              <>
                                {' · '}
                                {r.region}
                                {!isBase && r.matchedFrom && (
                                  <span
                                    style={{ color: 'var(--interactive)' }}
                                    title={`Auto-matched to your base region ${r.matchedFrom}${
                                      r.matchKm != null ? ` (~${Math.round(r.matchKm)} km away)` : ''
                                    }`}
                                  >
                                    {' '}
                                    · ≈ match
                                  </span>
                                )}
                              </>
                            )}
                            {!isBase && r.noMatch && (
                              <span style={{ color: '#FBBF24' }}>
                                {' · '}no comparable region — excluded from this price
                              </span>
                            )}
                          </span>
                        </>
                      ) : (
                        <span className="text-[11px] italic" style={{ color: 'var(--text-muted)' }}>
                          No pick — choose a {r.p} VM in Set up
                        </span>
                      )}
                    </div>

                    {/* Qty — editable on the base only; others mirror it. Label
                        inlines with the control so the row stays single-height. */}
                    <div
                      className="flex items-center gap-x-2"
                      style={{ width: isBase ? 132 : 'auto', minWidth: 88 }}
                    >
                      <span
                        className="text-[9px] uppercase tracking-[0.1em]"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Qty
                      </span>
                      {isBase ? (
                        <input
                          type="number"
                          min={1}
                          value={baseQty}
                          onChange={(e) => setBaseQty(e.target.value)}
                          onBlur={onBaseQtyBlur}
                          className="text-[12px] glass-input flex-1 min-w-0"
                          style={{ padding: '4px 12px', borderRadius: 'var(--radius-pill)' }}
                        />
                      ) : (
                        <span
                          className="inline-flex items-center gap-x-1 text-[12px]"
                          style={{ color: 'var(--text-secondary)' }}
                          title="Mirrors the base quantity"
                        >
                          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                            ×{qty}
                          </span>
                          <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                            matches base
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className="glass text-[11px] text-text-secondary italic"
            style={{ padding: 14, borderRadius: 'var(--radius-md)' }}
          >
            Pick the VMs to compare in{' '}
            <button
              type="button"
              onClick={onGoToSetup}
              className="underline underline-offset-2 not-italic"
              style={{ color: 'var(--interactive)' }}
            >
              Comparison setup
            </button>{' '}
            — the estimator prices exactly those, side by side.
          </div>
        )}

        <button
          type="button"
          onClick={runEstimate}
          disabled={!anyLocked}
          className="text-[12px] font-semibold"
          style={{
            padding: '8px 18px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--interactive)',
            background: 'rgba(129, 140, 248, 0.12)',
            color: 'var(--interactive)',
            opacity: anyLocked ? 1 : 0.4,
            cursor: anyLocked ? 'pointer' : 'not-allowed',
          }}
        >
          Run estimate
        </button>

        {/* Results */}
        {ran && result && (
          <div className="space-y-4">
            {/* Verdict */}
            <div
              className="glass space-y-2"
              style={{ padding: 16, borderRadius: 'var(--radius-md)' }}
            >
              <p
                className="text-[13px] font-semibold leading-snug"
                style={{ color: 'var(--text-primary)' }}
              >
                {result.verdict.headline}
              </p>
              {result.verdict.insights.length > 0 && (
                <ul className="space-y-1.5" style={{ listStyle: 'none', paddingLeft: 0 }}>
                  {result.verdict.insights.map((ins, i) => (
                    <li
                      key={i}
                      className="text-[11px] leading-snug flex gap-2"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <span style={{ color: 'var(--interactive)' }}>·</span>
                      <span>{ins}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Per-provider totals as relative bars. The caption + per-bar suffix
                make the time basis explicit — the bars are a TOTAL over the chosen
                run duration at the chosen term, not a monthly or hourly figure. */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between gap-x-3 flex-wrap">
                <span
                  className="text-[10px] uppercase tracking-[0.12em]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Total cost per cloud
                </span>
                <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                  over{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {durationValue} {durationUnit === 'months'
                      ? `month${durationValue === 1 ? '' : 's'}`
                      : `hour${durationValue === 1 ? '' : 's'}`}
                  </strong>{' '}
                  · {TERMS.find((t) => t.value === term)?.label ?? term}
                </span>
              </div>
              {result.perProvider.map((pt) => {
                const fg = PROVIDER_FG[pt.provider] ?? 'var(--text-primary)';
                const isCheapest = result.verdict.cheapestProvider === pt.provider;
                const pct = maxTotal > 0 ? (pt.totalUsd / maxTotal) * 100 : 0;
                return (
                  <div
                    key={pt.provider}
                    className="glass"
                    style={{
                      padding: 14,
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${isCheapest ? 'var(--interactive)' : 'var(--border)'}`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-x-3 mb-2">
                      <span
                        className="text-[13px] font-semibold flex items-center gap-x-2"
                        style={{ color: fg }}
                      >
                        {pt.provider}
                        {isCheapest && (
                          <span
                            className="text-[9px] uppercase tracking-[0.08em]"
                            style={{ color: 'var(--interactive)' }}
                          >
                            ★ lowest
                          </span>
                        )}
                        {pt.anyEstimated && (
                          <span
                            className="text-[9px]"
                            style={{ color: 'var(--text-muted)' }}
                            title="Some rates were estimated"
                          >
                            est.
                          </span>
                        )}
                      </span>
                      <span
                        className="text-[15px] font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {fmtUsd(pt.totalUsd)}
                        <span className="text-[10px] font-normal" style={{ color: 'var(--text-muted)' }}>
                          {' / '}
                          {durationValue}
                          {durationUnit === 'months' ? 'mo' : 'h'}
                        </span>
                      </span>
                    </div>
                    {/* Relative-cost bar (tinted; lower = cheaper). */}
                    <div
                      className="relative"
                      style={{
                        height: 8,
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-pill)',
                      }}
                    >
                      <div
                        className="h-full absolute left-0 top-0"
                        style={{
                          width: `${Math.max(2, Math.min(100, pct))}%`,
                          background: fg,
                          opacity: 0.55,
                          borderRadius: 'var(--radius-pill)',
                        }}
                      />
                    </div>
                    {pt.anyMissing && (
                      <p className="text-[10px] mt-2" style={{ color: '#FBBF24' }}>
                        Missing rate for one or more lines — excluded from total.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
          </>
        )}
      </section>
    </div>
  );
}


/** HOURS_PER_MONTH is 730; derive day/year multipliers from the same hourly basis. */
const HOURS_PER_DAY = 24;
const HOURS_PER_YEAR = 8760;

/** A small dollar formatter for the dense breakdown / table cells: keeps cents on
 *  sub-$100 figures (so $/hr reads meaningfully) and rounds bigger ones. */
const fmtUsdFine = (n: number): string => {
  if (Math.abs(n) < 100) return `$${n.toFixed(2)}`;
  return `$${Math.round(n).toLocaleString('en-US')}`;
};

/** The custom-timeframe total for a scenario: the duration-aware total when the
 *  port was given a DurationSpec, else fall back to the plain monthly total. */
function scenarioCustomTotal(s: PortedScenario): number {
  return s.durationTotalUsd != null ? s.durationTotalUsd : s.monthlyTotalUsd;
}

/**
 * B (v2.52.23) — BomCostSummary. Per cloud (base first):
 *   · the TOTAL over the selected custom timeframe + term, as relative bars with
 *     the % / $ delta vs the cheapest cloud (the user's "deltas between clouds"),
 *   · a compact $/hr · $/day · $/month · $/year breakdown derived from the
 *     scenario's summed hourly rate (day = hr×24, month = hr×730, year = hr×8760).
 * The caption names the active scenario ("over {duration} · {term}"). Keeps the
 * ★ lowest + base + est. chips.
 */
function BomCostSummary({
  result,
  durationLabel,
  termLabel,
}: {
  result: BomPortResult;
  durationLabel: string;
  termLabel: string;
}): JSX.Element | null {
  const scenarios: { s: PortedScenario; isBase: boolean }[] = [
    { s: result.baseScenario, isBase: true },
    ...result.targetScenarios.map((s) => ({ s, isBase: false })),
  ];
  const rows = scenarios.map(({ s, isBase }) => ({
    provider: s.provider,
    isBase,
    total: scenarioCustomTotal(s),
    hourly: s.hourlyTotalUsd,
    estimated: s.anyEstimated,
    priced: s.matchedLines > 0 && scenarioCustomTotal(s) > 0,
  }));
  const priced = rows.filter((r) => r.priced);
  if (priced.length === 0) return null;
  const cheapest = Math.min(...priced.map((r) => r.total));
  const max = Math.max(...priced.map((r) => r.total));
  const cheapestProvider = priced.find((p) => p.total === cheapest)?.provider;

  // Which region(s) is this priced at? Each BoM line carries its own base region;
  // surface the single region when the whole BoM shares one, else "N regions".
  const regionSet = Array.from(
    new Set(result.baseScenario.lines.map((l) => l.region).filter((r): r is string => !!r)),
  );
  const regionLabel =
    regionSet.length === 1
      ? regionSet[0]
      : regionSet.length > 1
      ? `${regionSet.length} regions`
      : null;

  return (
    <div className="glass space-y-2" style={{ padding: 14, borderRadius: 'var(--radius-md)' }}>
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <span
          className="text-[11px] font-semibold tracking-[0.04em]"
          style={{ color: 'var(--text-primary)' }}
        >
          BoM total · per cloud
        </span>
        <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
          {regionLabel && (
            <>
              at{' '}
              <strong
                style={{ color: 'var(--text-secondary)' }}
                title={
                  regionSet.length > 1
                    ? `Priced across ${regionSet.join(', ')} — each BoM line uses the region set on it. Competitor clouds price at their nearest available region.`
                    : `Every BoM line is priced at ${regionLabel} (the region set in VM Demand). Competitor clouds price at their nearest available region.`
                }
              >
                {regionLabel}
              </strong>{' '}
              ·{' '}
            </>
          )}
          over <strong style={{ color: 'var(--text-secondary)' }}>{durationLabel}</strong> · {termLabel} · Δ vs cheapest
        </span>
      </div>
      <div className="space-y-2.5">
        {rows.map((r) => {
          const fg = PROVIDER_FG[r.provider] ?? 'var(--text-primary)';
          const has = r.priced;
          const isCheapest = has && r.total === cheapest;
          const pct = max > 0 ? Math.max(2, (r.total / max) * 100) : 0;
          const dUsd = r.total - cheapest;
          const dPct = cheapest > 0 ? (dUsd / cheapest) * 100 : 0;
          return (
            <div key={r.provider} className="space-y-1">
              <div className="flex items-center justify-between gap-x-3">
                <span
                  className="text-[12px] font-semibold flex items-center gap-x-2"
                  style={{ color: fg }}
                >
                  {r.provider}
                  {r.isBase && (
                    <span
                      className="text-[8px] uppercase tracking-[0.06em]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      base
                    </span>
                  )}
                  {isCheapest && (
                    <span
                      className="text-[9px] uppercase tracking-[0.06em]"
                      style={{ color: 'var(--interactive)' }}
                    >
                      ★ lowest
                    </span>
                  )}
                  {r.estimated && (
                    <span
                      className="text-[9px]"
                      style={{ color: 'var(--text-muted)' }}
                      title="Includes estimated reserved rates"
                    >
                      est.
                    </span>
                  )}
                </span>
                <span
                  className="text-[13px] font-semibold tabular-nums"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {has ? fmtUsd(r.total) : '—'}
                </span>
              </div>
              {/* relative bar */}
              <div
                className="relative"
                style={{
                  height: 8,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-pill)',
                }}
              >
                {has && (
                  <div
                    className="absolute left-0 top-0 h-full"
                    style={{
                      width: `${Math.min(100, pct)}%`,
                      background: fg,
                      opacity: 0.55,
                      borderRadius: 'var(--radius-pill)',
                    }}
                  />
                )}
              </div>
              {/* delta vs cheapest */}
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {!has ? (
                  <span style={{ color: '#FBBF24' }}>no priced lines</span>
                ) : isCheapest ? (
                  <span style={{ color: 'var(--interactive)' }}>cheapest of the priced clouds</span>
                ) : (
                  <span>
                    <span style={{ color: '#FBBF24' }}>
                      +{fmtUsd(dUsd)} ({fmtPct(dPct)})
                    </span>{' '}
                    more than {cheapestProvider}
                  </span>
                )}
              </div>
              {/* standard-basis breakdown derived from the summed hourly rate */}
              {has && (
                <div
                  className="flex flex-wrap gap-x-3 gap-y-0.5 text-[9.5px] tabular-nums"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span>{fmtUsdFine(r.hourly)}/hr</span>
                  <span>{fmtUsdFine(r.hourly * HOURS_PER_DAY)}/day</span>
                  <span>{fmtUsdFine(r.hourly * HOURS_PER_MONTH)}/mo</span>
                  <span>{fmtUsdFine(r.hourly * HOURS_PER_YEAR)}/yr</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * C (v2.52.23) — BomSkuCostTable. The headline scalable per-SKU cross-cloud cost
 * table. One row per BoM line (or just the single active line when the dock's
 * VIEW LINE stepper scopes to one), plus a TOTALS row summing every cost column.
 *
 * Column → user-spec mapping:
 *   1. "SKU & VM qty"           → base SKU + "× qty"
 *   2. "Azure (base)"           → base cloud's cost for the row at the custom
 *                                  timeframe+term (shows the base SKU). Header is
 *                                  the actual base provider name.
 *   3. "AWS"                    → AWS's matched like-sized SKU + its custom-
 *                                  timeframe cost (+ match %).
 *   4. "GCP"                    → same as AWS, for GCP.
 *   5. "Custom timeframe cost"  → the CHEAPEST cloud's custom-timeframe cost for
 *                                  the row (labeled with which cloud). Columns 2-4
 *                                  already ARE each cloud's custom-timeframe cost,
 *                                  so this column is the cross-cloud takeaway.
 *   6. "1 hr cost"              → the row's $/hr (base cloud's, labeled).
 *   7. "1 month cost"          → the row's $/mo (base cloud's).
 *   8. "1 year cost"           → the row's $/yr (base cloud's).
 *
 * Judgment call (documented per the brief): provider columns 2-4 are the cross-
 * cloud comparison AT the selected timeframe; the time-basis columns 6-8 + the
 * custom column 5 are the standard-scenario reference. Cols 6-8 use the BASE
 * cloud's per-row hourly (the BoM is authored on the base, so its standard basis
 * is the natural reference); col 5 surfaces the cheapest cloud so the table reads
 * "here's your base SKU's hr/mo/yr, and here's the cheapest way to run it over
 * your chosen window." Always compares against each cloud's most like-sized
 * matched VM via PortedLine.matchVmSizeName / matchPct.
 */
function BomSkuCostTable({
  result,
  durationLabel,
  termLabel,
  showingAll,
  lineCount,
}: {
  result: BomPortResult;
  durationLabel: string;
  termLabel: string;
  showingAll: boolean;
  lineCount: number;
}): JSX.Element | null {
  const baseProvider = result.baseScenario.provider;
  const awsScenario = result.targetScenarios.find((s) => s.provider === 'AWS') ?? null;
  const gcpScenario = result.targetScenarios.find((s) => s.provider === 'GCP') ?? null;
  // Any extra (non-AWS/GCP) target — keep it out of the fixed 3-column layout but
  // still feed it into the per-row "cheapest" comparison so col 5 stays honest.
  const otherScenarios = result.targetScenarios.filter(
    (s) => s.provider !== 'AWS' && s.provider !== 'GCP',
  );

  const lineCustomTotal = (l: PortedLine | undefined): number | null => {
    if (!l) return null;
    return l.durationTotalUsd != null ? l.durationTotalUsd : l.monthlyUsd;
  };

  const nLines = result.baseScenario.lines.length;
  if (nLines === 0) return null;

  // Build one display row per BoM line, gathering each provider's matched SKU +
  // custom-timeframe cost and the base cloud's hr/mo/yr standard basis.
  const rows = result.baseScenario.lines.map((baseLine, i) => {
    const aws = awsScenario?.lines[i];
    const gcp = gcpScenario?.lines[i];
    const baseCustom = lineCustomTotal(baseLine);
    const awsCustom = lineCustomTotal(aws);
    const gcpCustom = lineCustomTotal(gcp);
    // Cheapest custom-timeframe cost across every priced cloud for this row.
    const candidates: { provider: string; usd: number }[] = [];
    if (baseCustom != null) candidates.push({ provider: baseProvider, usd: baseCustom });
    if (awsCustom != null) candidates.push({ provider: 'AWS', usd: awsCustom });
    if (gcpCustom != null) candidates.push({ provider: 'GCP', usd: gcpCustom });
    for (const os of otherScenarios) {
      const ol = lineCustomTotal(os.lines[i]);
      if (ol != null) candidates.push({ provider: os.provider, usd: ol });
    }
    candidates.sort((a, b) => a.usd - b.usd);
    const cheapest = candidates[0] ?? null;
    // Base cloud's standard time-basis (hr/mo/yr) for this row.
    const hourly = baseLine.hourlyUsd ?? null;
    return {
      baseSku: baseLine.baseVmSizeName,
      quantity: baseLine.quantity,
      region: baseLine.region ?? null,
      baseCustom,
      aws: { sku: aws?.matchVmSizeName ?? null, pct: aws?.matchPct ?? null, custom: awsCustom },
      gcp: { sku: gcp?.matchVmSizeName ?? null, pct: gcp?.matchPct ?? null, custom: gcpCustom },
      cheapest,
      hr: hourly,
      mo: hourly != null ? hourly * HOURS_PER_MONTH : null,
      yr: hourly != null ? hourly * HOURS_PER_YEAR : null,
    };
  });

  // Column totals across all rows (each independently summed, null-safe).
  const sum = (pick: (r: (typeof rows)[number]) => number | null): number | null => {
    let acc = 0;
    let any = false;
    for (const r of rows) {
      const v = pick(r);
      if (v != null) {
        acc += v;
        any = true;
      }
    }
    return any ? acc : null;
  };
  const totals = {
    baseCustom: sum((r) => r.baseCustom),
    awsCustom: sum((r) => r.aws.custom),
    gcpCustom: sum((r) => r.gcp.custom),
    cheapest: sum((r) => r.cheapest?.usd ?? null),
    hr: sum((r) => r.hr),
    mo: sum((r) => r.mo),
    yr: sum((r) => r.yr),
  };

  const cell = (n: number | null): string => (n != null ? fmtUsdFine(n) : '—');
  const baseFg = PROVIDER_FG[baseProvider] ?? 'var(--text-primary)';
  const awsFg = PROVIDER_FG['AWS'];
  const gcpFg = PROVIDER_FG['GCP'];

  const th = {
    padding: '6px 8px',
    textAlign: 'left' as const,
    fontWeight: 600,
    color: 'var(--text-muted)',
    borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap' as const,
  };
  const td = {
    padding: '6px 8px',
    color: 'var(--text-secondary)',
    borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap' as const,
  };

  return (
    <div className="glass space-y-2" style={{ padding: 14, borderRadius: 'var(--radius-md)' }}>
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <span
          className="text-[11px] font-semibold tracking-[0.04em]"
          style={{ color: 'var(--text-primary)' }}
        >
          Per-SKU cross-cloud cost
        </span>
        <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
          custom = over <strong style={{ color: 'var(--text-secondary)' }}>{durationLabel}</strong> · {termLabel}
        </span>
      </div>
      {showingAll && lineCount > 1 && (
        <p className="text-[9.5px]" style={{ color: 'var(--text-muted)' }}>
          Showing all {lineCount} BoM lines · pick a line in the dock to drill.
        </p>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table className="text-[10px] tabular-nums" style={{ borderCollapse: 'collapse', width: '100%', minWidth: 640 }}>
          <thead>
            <tr>
              <th style={th}>SKU &amp; VM qty</th>
              <th style={{ ...th, color: baseFg }}>{baseProvider} (base)</th>
              <th style={{ ...th, color: awsFg }}>AWS</th>
              <th style={{ ...th, color: gcpFg }}>GCP</th>
              <th style={th}>Custom timeframe</th>
              <th style={th}>1 hr</th>
              <th style={th}>1 month</th>
              <th style={th}>1 year</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={{ ...td, color: 'var(--text-primary)', fontWeight: 500 }}>
                  {r.baseSku}{' '}
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                    × {r.quantity.toLocaleString('en-US')}
                  </span>
                  {r.region && (
                    <span
                      className="block text-[8.5px]"
                      style={{ color: 'var(--text-muted)', fontWeight: 400 }}
                      title={`This line is priced at ${r.region} (the region set on the BoM line). Competitor clouds price at their nearest available region.`}
                    >
                      {r.region}
                    </span>
                  )}
                </td>
                {/* Base cloud — its own SKU at the custom timeframe */}
                <td style={td}>
                  <span style={{ color: 'var(--text-primary)' }}>{cell(r.baseCustom)}</span>
                </td>
                {/* AWS — matched like-sized SKU + custom-timeframe cost + match % */}
                <td style={td}>
                  {r.aws.sku ? (
                    <>
                      <span style={{ color: 'var(--text-primary)' }}>{cell(r.aws.custom)}</span>
                      <span style={{ color: 'var(--text-muted)' }} className="block text-[8.5px]">
                        {r.aws.sku}
                        {r.aws.pct != null ? ` · ${Math.round(r.aws.pct)}%` : ''}
                      </span>
                    </>
                  ) : (
                    <span style={{ color: '#FBBF24' }}>no match</span>
                  )}
                </td>
                {/* GCP — same as AWS */}
                <td style={td}>
                  {r.gcp.sku ? (
                    <>
                      <span style={{ color: 'var(--text-primary)' }}>{cell(r.gcp.custom)}</span>
                      <span style={{ color: 'var(--text-muted)' }} className="block text-[8.5px]">
                        {r.gcp.sku}
                        {r.gcp.pct != null ? ` · ${Math.round(r.gcp.pct)}%` : ''}
                      </span>
                    </>
                  ) : (
                    <span style={{ color: '#FBBF24' }}>no match</span>
                  )}
                </td>
                {/* Custom timeframe — the cheapest cloud's cost for this row */}
                <td style={td}>
                  {r.cheapest ? (
                    <>
                      <span style={{ color: 'var(--interactive)' }}>{cell(r.cheapest.usd)}</span>
                      <span style={{ color: 'var(--text-muted)' }} className="block text-[8.5px]">
                        cheapest · {r.cheapest.provider}
                      </span>
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                {/* Standard time-basis — base cloud's per-row hr / mo / yr */}
                <td style={td}>{cell(r.hr)}</td>
                <td style={td}>{cell(r.mo)}</td>
                <td style={td}>{cell(r.yr)}</td>
              </tr>
            ))}
            {/* TOTALS row summing every cost column across all shown BoM rows. */}
            <tr>
              <td style={{ ...td, color: 'var(--text-primary)', fontWeight: 600, borderBottom: 'none' }}>
                Total ({rows.length} line{rows.length === 1 ? '' : 's'})
              </td>
              <td style={{ ...td, color: 'var(--text-primary)', fontWeight: 600, borderBottom: 'none' }}>
                {cell(totals.baseCustom)}
              </td>
              <td style={{ ...td, color: 'var(--text-primary)', fontWeight: 600, borderBottom: 'none' }}>
                {cell(totals.awsCustom)}
              </td>
              <td style={{ ...td, color: 'var(--text-primary)', fontWeight: 600, borderBottom: 'none' }}>
                {cell(totals.gcpCustom)}
              </td>
              <td style={{ ...td, color: 'var(--interactive)', fontWeight: 600, borderBottom: 'none' }}>
                {cell(totals.cheapest)}
              </td>
              <td style={{ ...td, color: 'var(--text-primary)', fontWeight: 600, borderBottom: 'none' }}>
                {cell(totals.hr)}
              </td>
              <td style={{ ...td, color: 'var(--text-primary)', fontWeight: 600, borderBottom: 'none' }}>
                {cell(totals.mo)}
              </td>
              <td style={{ ...td, color: 'var(--text-primary)', fontWeight: 600, borderBottom: 'none' }}>
                {cell(totals.yr)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
