/**
 * SpecShowdown — the at-a-glance HERO of the Compare → Specs page.
 *
 * A single side-by-side table: columns are clouds (base first, provider-toned
 * header carrying SKU + family + match% + worst-caveat), rows are the spec
 * dimensions that actually separate sizes (vCPU · Memory · GiB/vCPU · Network ·
 * Local NVMe · Processor · GPU) plus a $/mo anchor row at the active term. Per
 * numeric row the best value is tinted and every non-base cell shows its signed
 * delta vs base — so a shopper reads the differences in one glance instead of
 * hunting through prose columns.
 *
 * Pure-ish presentation over `buildShowdownRows` (the tested math module) — it
 * takes already-resolved per-cloud picks + monthly costs + match% and renders.
 * No engine, no data fetch.
 */
import type { CatalogEntry } from '../../types';
import type { MatchCaveat } from '../../utils/matchCaveats';
import { vmFamily } from '../../utils/vmTaxonomy';
import {
  buildShowdownRows,
  canonicalProvider,
  type ShowdownColumnInput,
  type ShowdownCell,
  type ShowdownInsight,
} from './specShowdownMath';
import { providerTone, pctTone } from './ui/tokens'; // S66-SPECS
import { CaveatChip } from './ui/CaveatChip'; // S66-SPECS

// S66-SPECS — provider tone/label come from the ONE shared source (ui/tokens
// via canonicalProvider); the private PROVIDER_TONE/PROVIDER_LABEL copies that
// had drifted from CompetitivePage's are deleted.
function tone(p: string) {
  return providerTone(canonicalProvider(p));
}
function providerLabel(p: string): string {
  return canonicalProvider(p);
}

// ── Public column shape the page assembles ───────────────────────────────────
export interface ShowdownColumn {
  provider: string;
  vm: CatalogEntry;
  isBase: boolean;
  monthlyUsd?: number | null;
  matchPct?: number | null;
  /** Worst comparability caveat vs the base (for the header chip). */
  worstCaveat?: MatchCaveat | null;
}

export interface SpecShowdownProps {
  columns: ShowdownColumn[];
  /** Applied pricing-term label for the $/mo row caption (e.g. "PAYG", "3y RI"). */
  termLabel?: string;
  /** Called when the user wants to add equivalents (empty/partial state CTA). */
  onGoToSetup?: () => void;
}

// ── Match % pill (S66-SPECS: exported — BomSpecsView reuses the SAME pill so
//    both Specs modes share one match-grammar; tone from ui/tokens pctTone) ───
export function MatchPill({
  pct,
  isBase = false,
  suffix,
}: {
  pct: number | null | undefined;
  isBase?: boolean;
  /** Optional quality suffix (e.g. " · close") appended after the %. */
  suffix?: string;
}): JSX.Element | null {
  if (isBase) {
    return (
      <span
        className="text-[9px] font-semibold uppercase"
        style={{
          padding: '1px 6px',
          borderRadius: 'var(--radius-pill)',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)',
          letterSpacing: '0.05em',
          whiteSpace: 'nowrap',
        }}
      >
        base
      </span>
    );
  }
  if (pct == null) return null;
  const p = Math.round(pct);
  const color = pctTone(p);
  return (
    <span
      className="text-[9px] font-semibold"
      title="Similarity to the base pick"
      style={{
        padding: '1px 6px',
        borderRadius: 'var(--radius-pill)',
        background: `${color}1F`,
        border: `1px solid ${color}`,
        color,
        whiteSpace: 'nowrap',
      }}
    >
      ≈{p}%{suffix ?? ''}
    </span>
  );
}

function caveatChip(c: MatchCaveat | null | undefined): JSX.Element | null {
  if (!c) return null;
  // S66-SPECS — the ONE shared amber pill (ui/CaveatChip) replaces the private
  // ⚠-prefixed copy that had drifted from the other surfaces.
  return <CaveatChip label={c.label} detail={c.detail} />;
}

// ── One value cell ───────────────────────────────────────────────────────────
function Cell({ cell, moreIsBetter }: { cell: ShowdownCell; moreIsBetter: boolean | null }): JSX.Element {
  const isNumeric = moreIsBetter !== null;
  const best = cell.best;
  return (
    <td
      style={{
        padding: '7px 12px',
        borderTop: '1px solid var(--border)',
        background: best ? 'rgba(34,197,94,0.07)' : cell.isBase ? 'rgba(255,255,255,0.02)' : 'transparent',
        verticalAlign: 'top',
        minWidth: 0,
      }}
    >
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span
          className="text-[12px] tabular-nums"
          style={{
            fontWeight: best ? 700 : 500,
            color: best ? 'var(--status-good)' : 'var(--text-primary)',
            wordBreak: isNumeric ? 'normal' : 'break-word',
          }}
        >
          {cell.display}
        </span>
        {cell.marker && (
          <span className="text-[9px]" style={{ color: 'var(--text-muted)' }} title="Not a vendor-published value — treat as directional">
            {cell.marker}
          </span>
        )}
      </div>
      {cell.deltaPct && (
        <div
          className="text-[9px] tabular-nums"
          style={{ color: 'var(--text-muted)', marginTop: 1 }}
          title="Difference vs the base column"
        >
          {cell.deltaPct} vs base
        </div>
      )}
    </td>
  );
}

// ── Header cell ──────────────────────────────────────────────────────────────
function HeaderCell({ col }: { col: ShowdownColumn }): JSX.Element {
  const t = tone(col.provider);
  const fam = vmFamily(col.vm) || col.vm.family || col.vm.series;
  return (
    <th
      scope="col"
      style={{
        padding: '10px 12px',
        textAlign: 'left',
        background: col.isBase ? t.bg : 'transparent',
        borderBottom: `2px solid ${t.border}`,
        verticalAlign: 'top',
        minWidth: 132,
      }}
    >
      <div className="flex items-center gap-1.5" style={{ marginBottom: 3 }}>
        <span aria-hidden style={{ width: 7, height: 7, borderRadius: 999, background: t.fg, flexShrink: 0 }} />
        <span
          className="text-[10px] font-semibold uppercase"
          style={{ color: t.fg, letterSpacing: '0.06em' }}
        >
          {providerLabel(col.provider)}
        </span>
      </div>
      <div
        className="text-[12px] font-bold leading-snug"
        style={{ color: 'var(--text-primary)', wordBreak: 'break-word' }}
        title={col.vm.vmSizeName}
      >
        {col.vm.vmSizeName}
      </div>
      {fam && (
        <div className="text-[10px]" style={{ color: 'var(--text-muted)', marginTop: 1 }}>
          {fam}
        </div>
      )}
      <div className="flex items-center gap-1 flex-wrap" style={{ marginTop: 5 }}>
        <MatchPill pct={col.matchPct} isBase={col.isBase} />
        {caveatChip(col.worstCaveat)}
      </div>
    </th>
  );
}

// ── Empty / partial state ────────────────────────────────────────────────────
function OnlyBaseHint({ onGoToSetup }: { onGoToSetup?: () => void }): JSX.Element {
  return (
    <div
      className="text-[11px] flex items-center gap-2 flex-wrap"
      style={{
        padding: '10px 12px',
        borderTop: '1px solid var(--border)',
        color: 'var(--text-secondary)',
      }}
    >
      <span>Only the base is picked — add cross-cloud equivalents to compare side by side.</span>
      {onGoToSetup && (
        <button
          type="button"
          onClick={onGoToSetup}
          className="text-[11px] font-semibold"
          style={{
            padding: '3px 10px',
            background: 'var(--interactive-muted)',
            color: 'var(--interactive)',
            border: '1px solid var(--border-glow)',
            borderRadius: 'var(--radius-pill)',
            cursor: 'pointer',
          }}
        >
          Pick equivalents in Set up →
        </button>
      )}
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────
export function SpecShowdown({ columns, termLabel, onGoToSetup }: SpecShowdownProps): JSX.Element | null {
  if (columns.length === 0) return null;
  const inputs: ShowdownColumnInput[] = columns.map((c) => ({
    provider: c.provider,
    vm: c.vm,
    isBase: c.isBase,
    monthlyUsd: c.monthlyUsd,
    matchPct: c.matchPct,
  }));
  const rows = buildShowdownRows(inputs);
  const onlyBase = columns.length === 1;

  return (
    <section className="space-y-2">
      <div className="flex items-baseline gap-2 flex-wrap">
        <h2 className="section-h">Spec showdown</h2>
        <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
          side-by-side, base first — best value in each row is highlighted
        </span>
      </div>
      <div
        className="glass"
        style={{ borderRadius: 'var(--radius-lg)', overflowX: 'auto', overflowY: 'hidden' }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            tableLayout: 'auto',
            minWidth: Math.min(columns.length, 4) * 150 + 120,
          }}
        >
          <thead>
            <tr>
              <th
                scope="col"
                style={{
                  padding: '10px 12px',
                  textAlign: 'left',
                  borderBottom: '2px solid var(--border)',
                  minWidth: 96,
                  position: 'sticky',
                  left: 0,
                  background: 'var(--surface)',
                  zIndex: 1,
                }}
              >
                <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                  Spec
                </span>
              </th>
              {columns.map((col) => (
                <HeaderCell key={`${col.provider}-${col.vm.vmSizeName}`} col={col} />
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <th
                  scope="row"
                  style={{
                    padding: '7px 12px',
                    textAlign: 'left',
                    borderTop: '1px solid var(--border)',
                    fontWeight: 600,
                    position: 'sticky',
                    left: 0,
                    background: 'var(--surface)',
                    zIndex: 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                    {row.label}
                    {row.key === 'cost' && termLabel ? (
                      <span className="text-[9px]" style={{ color: 'var(--text-muted)', marginLeft: 4 }}>
                        at {termLabel}
                      </span>
                    ) : null}
                  </span>
                </th>
                {row.cells.map((cell) => (
                  <Cell key={`${row.key}-${cell.provider}`} cell={cell} moreIsBetter={row.moreIsBetter} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {onlyBase && <OnlyBaseHint onGoToSetup={onGoToSetup} />}
      </div>
    </section>
  );
}

// ── Insight chips strip (Stands-out / Trails-on, compact) ────────────────────
// S66 FIX-A — the ShowdownInsight interface moved to specShowdownMath (pure
// math must not import from a component file); re-exported here so existing
// importers keep working unchanged.
export type { ShowdownInsight } from './specShowdownMath';

/** A compact strip: one line per cloud — its ★ Stands-out chip (green; the
 *  LEADING cloud(s) only, per the "Best at, not Top pick" doctrine), a plain
 *  informational note (no star) for the rest, and a Trails-on (amber) chip.
 *  Sits directly under the hero table. Renders nothing when no pick carries
 *  any signal. */
export function SpecShowdownInsights({ insights }: { insights: ShowdownInsight[] }): JSX.Element | null {
  const meaningful = insights.filter((i) => i.standout || i.note || i.weakness);
  if (meaningful.length === 0) return null;
  return (
    <div
      className="glass space-y-2"
      style={{ padding: 12, borderRadius: 'var(--radius-md)' }}
    >
      {meaningful.map((i) => {
        const t = tone(i.provider);
        return (
          <div key={`${i.provider}-${i.displayName}`} className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[11px] font-semibold"
              style={{ color: t.fg, minWidth: 92, flexShrink: 0 }}
            >
              {i.displayName}
            </span>
            {i.standout && (
              <span
                className="text-[10px]"
                style={{
                  padding: '2px 9px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'rgba(34,197,94,0.10)',
                  border: '1px solid rgba(34,197,94,0.30)',
                  color: 'var(--status-good)',
                }}
              >
                <span style={{ fontWeight: 600 }}>★ </span>
                {i.standout}
              </span>
            )}
            {/* S66 FIX-A — non-leading clouds get their stat as a plain pill
                (no ★): informative, but not crowned. */}
            {i.note && (
              <span
                className="text-[10px]"
                style={{
                  padding: '2px 9px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}
              >
                {i.note}
              </span>
            )}
            {i.weakness && (
              <span
                className="text-[10px]"
                style={{
                  padding: '2px 9px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'rgba(251,191,36,0.08)',
                  border: '1px solid rgba(251,191,36,0.30)',
                  color: 'var(--accent-amber)',
                }}
              >
                <span style={{ fontWeight: 600 }}>▼ </span>
                {i.weakness}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
