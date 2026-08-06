/**
 * BomSpecsView — the cross-cloud SPECS evidence hero for VM-BoM mode on the
 * Compare → Specs page (section 3 of the frozen S66 page grammar).
 *
 * Each committed BoM line renders as a card whose mini spec-showdown table uses
 * the SAME grammar as the VM-sizes SpecShowdown hero — provider-toned headers
 * (dot + uppercase label + bold SKU), the shared MatchPill, the shared
 * ui/CaveatChip for comparability flags, best-in-row highlighting and
 * delta-vs-base — so both modes read as one product. Per-cloud detail (ratio
 * bars, how-it-scored) stays folded behind a Disclosure.
 *
 * S66 line focus: the ACTIVE line renders expanded FIRST; every other line is a
 * collapsed one-line row (Line pill · base SKU · qty · per-cloud match pills)
 * that expands on click, capped at 5 with a "Show N more" (the >5 rule). When
 * no line is focused (activeRow < 0) the first line is expanded locally without
 * mutating the dock's stepper.
 *
 * Data comes STRICTLY from the shared `BomPortResult` (`ported.baseScenario.
 * lines[i]` zipped with `ported.targetScenarios[j].lines[i]` by index — every
 * scenario is built from the same `bom` array so indices align) plus `userVms`
 * lookups to resolve the CatalogEntry behind each matched SKU. No engine
 * re-run, no external analog table.
 */
import { useMemo, useState } from 'react';
import type { BomEntry, CatalogEntry } from '../../types';
import type { BomPortResult, PortedLine } from '../../utils/bomPort';
import { SpecRatioBars } from './charts/SpecRatioBars';
import { MatchMethodology, type CaveatsFor } from './MatchMethodology';
import { Disclosure } from '../Disclosure';
import { buildShowdownRows, canonicalProvider, type ShowdownColumnInput } from './specShowdownMath';
import { providerTone } from './ui/tokens'; // S66-SPECS
import { CaveatChip } from './ui/CaveatChip'; // S66-SPECS
import { MatchPill } from './SpecShowdown'; // S66-SPECS

// S66-SPECS — provider tone/label come from the ONE shared source (ui/tokens
// via canonicalProvider); the private PROVIDER_COLOR/PROVIDER_LABEL copies are
// deleted so BoM cards can never drift from the SpecShowdown hero again.
function providerColor(p: string) {
  return providerTone(canonicalProvider(p));
}
function providerLabel(p: string): string {
  return canonicalProvider(p);
}

const fmtInt = (n: number): string => Math.round(n).toLocaleString('en-US');

// S66-SPECS — `caveatsFor` returns MatchMethodology's caveat shape (optional
// `tone`), while the live objects from utils/matchCaveats carry `severity`.
// Normalize both honestly: warn-severity OR amber-tone → the amber chip.
type AnyCaveat = { label: string; detail: string; tone?: 'amber' | 'neutral'; severity?: 'warn' | 'info' };
const caveatToneOf = (c: AnyCaveat): 'amber' | 'neutral' =>
  c.tone === 'amber' || c.severity === 'warn' ? 'amber' : 'neutral';
const worstOf = (cs: AnyCaveat[]): AnyCaveat | null =>
  cs.length === 0 ? null : (cs.find((c) => caveatToneOf(c) === 'amber') ?? cs[0]);

const sameProvider = (vm: CatalogEntry, provider: string): boolean =>
  (vm.provider ?? '').toLowerCase() === provider.toLowerCase();

/** Resolve the CatalogEntry for a SKU on a provider (region-agnostic).
 *  S66-FIX-C — takes an optional memoized `${provider}|${vmSizeName}` index
 *  (built once from the deduped catalog in CompetitivePage) so per-line
 *  resolution is O(1); falls back to the linear scan when the index misses
 *  (e.g. a provider-casing mismatch) so behavior is unchanged. */
function lookupVm(
  userVms: CatalogEntry[],
  provider: string,
  vmSizeName: string | null,
  lookup?: Map<string, CatalogEntry>,
): CatalogEntry | null {
  if (!vmSizeName) return null;
  const hit = lookup?.get(`${provider}|${vmSizeName}`);
  if (hit) return hit;
  return userVms.find((v) => sameProvider(v, provider) && v.vmSizeName === vmSizeName) ?? null;
}

// ── Pure line-zip: assemble one comparable card model per BoM line ───────────

/** One cloud's cell within a line card. */
export interface BomLineCell {
  provider: string;
  isBase: boolean;
  line: PortedLine;
  /** The resolved CatalogEntry behind the matched SKU (for spec bars), or null
   *  when unmatched / not in the catalog. */
  vm: CatalogEntry | null;
}

/** One BoM line, base cell + one cell per target cloud, plus the base VM. */
export interface BomLineModel {
  index: number;
  baseVmSizeName: string;
  quantity: number;
  region?: string;
  baseVm: CatalogEntry | null;
  cells: BomLineCell[];
}

/**
 * PURE — zip `ported.baseScenario.lines` with each target scenario's lines by
 * index into a per-line card model, resolving the CatalogEntry for every SKU.
 * Indices align because every scenario is built from the same `bom` array; we
 * still guard with a length check so a short scenario can't throw.
 */
export function buildBomLineModels(
  ported: BomPortResult,
  userVms: CatalogEntry[],
  lookup?: Map<string, CatalogEntry>,
): BomLineModel[] {
  const baseLines = ported.baseScenario.lines;
  return baseLines.map((baseLine, i) => {
    const baseVm = lookupVm(userVms, ported.baseProvider, baseLine.matchVmSizeName ?? baseLine.baseVmSizeName, lookup);
    const cells: BomLineCell[] = [
      { provider: ported.baseProvider, isBase: true, line: baseLine, vm: baseVm },
    ];
    for (const target of ported.targetScenarios) {
      const line = target.lines[i];
      if (!line) continue;
      cells.push({
        provider: target.provider,
        isBase: false,
        line,
        vm: lookupVm(userVms, target.provider, line.matchVmSizeName, lookup),
      });
    }
    return {
      index: i,
      baseVmSizeName: baseLine.baseVmSizeName,
      quantity: baseLine.quantity,
      region: baseLine.region,
      baseVm,
      cells,
    };
  });
}

/** "no equivalent" pill for an unmatched cloud (MatchPill needs a %). */
function NoEquivalentPill(): JSX.Element {
  return (
    <span
      className="text-[10px]"
      style={{
        padding: '1px 7px',
        borderRadius: 'var(--radius-pill)',
        border: '1px solid var(--border)',
        color: 'var(--text-muted)',
        whiteSpace: 'nowrap',
      }}
    >
      no equivalent
    </span>
  );
}

/** Monospace SKU that wraps rather than truncating inside a card. */
function Sku({ name }: { name: string | null }): JSX.Element {
  return (
    <span
      style={{
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 11,
        color: name ? 'var(--text-primary)' : 'var(--text-muted)',
        wordBreak: 'break-word',
      }}
    >
      {name ?? '—'}
    </span>
  );
}

// ── Mini spec showdown for one BoM line (rows = spec, cols = cloud) ──────────
/** The hero-table treatment in miniature: a compact side-by-side of every cloud's
 *  matched SKU on one line, base first, best value per row tinted. Reuses the
 *  shared `buildShowdownRows` math AND the SpecShowdown header grammar (dot +
 *  uppercase provider + bold SKU + MatchPill + CaveatChip) so it agrees with the
 *  VM-sizes hero cell for cell. */
function LineShowdown({
  model,
  caveatsFor,
}: {
  model: BomLineModel;
  caveatsFor?: CaveatsFor;
}): JSX.Element | null {
  const withVm = model.cells.filter((c) => c.vm);
  const cols: ShowdownColumnInput[] = withVm.map((c) => ({
    provider: c.provider,
    vm: c.vm as CatalogEntry,
    isBase: c.isBase,
  }));
  if (cols.length === 0) return null;
  const rows = buildShowdownRows(cols);
  return (
    <div style={{ overflowX: 'auto', overflowY: 'hidden', marginBottom: 8 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
        <thead>
          <tr>
            <th
              style={{
                padding: '4px 8px',
                textAlign: 'left',
                borderBottom: '1px solid var(--border)',
              }}
            />
            {withVm.map((c) => {
              const tone = providerColor(c.provider);
              const worst =
                !c.isBase && caveatsFor && model.baseVm && c.vm
                  ? worstOf(caveatsFor(model.baseVm, c.vm))
                  : null;
              return (
                <th
                  key={c.provider}
                  scope="col"
                  style={{
                    padding: '6px 8px',
                    textAlign: 'left',
                    background: c.isBase ? tone.bg : 'transparent',
                    borderBottom: `2px solid ${tone.border}`,
                    verticalAlign: 'top',
                    minWidth: 96,
                  }}
                >
                  <div className="flex items-center gap-1.5" style={{ marginBottom: 2 }}>
                    <span
                      aria-hidden
                      style={{ width: 7, height: 7, borderRadius: 999, background: tone.fg, flexShrink: 0 }}
                    />
                    <span
                      className="text-[10px] font-semibold uppercase"
                      style={{ color: tone.fg, letterSpacing: '0.06em' }}
                    >
                      {providerLabel(c.provider)}
                    </span>
                  </div>
                  <div
                    className="text-[11px] font-bold leading-snug"
                    style={{ color: 'var(--text-primary)', wordBreak: 'break-word' }}
                    title={c.vm!.vmSizeName}
                  >
                    {c.vm!.vmSizeName}
                  </div>
                  <div className="flex items-center gap-1 flex-wrap" style={{ marginTop: 4 }}>
                    <MatchPill pct={c.line.matchPct} isBase={c.isBase} />
                    {worst && <CaveatChip label={worst.label} detail={worst.detail} />}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <th
                scope="row"
                style={{
                  padding: '4px 8px',
                  textAlign: 'left',
                  borderTop: '1px solid var(--border)',
                  whiteSpace: 'nowrap',
                }}
              >
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {row.label}
                </span>
              </th>
              {row.cells.map((cell) => (
                <td
                  key={`${row.key}-${cell.provider}`}
                  style={{
                    padding: '4px 8px',
                    borderTop: '1px solid var(--border)',
                    background: cell.best
                      ? 'rgba(34,197,94,0.07)'
                      : cell.isBase
                        ? 'rgba(255,255,255,0.02)'
                        : 'transparent',
                    verticalAlign: 'top',
                  }}
                >
                  <span
                    className="text-[11px] tabular-nums"
                    style={{
                      fontWeight: cell.best ? 700 : 500,
                      color: cell.best ? 'var(--status-good)' : 'var(--text-primary)',
                      wordBreak: row.moreIsBetter === null ? 'break-word' : 'normal',
                    }}
                  >
                    {cell.display}
                  </span>
                  {cell.marker && (
                    <span
                      className="text-[9px]"
                      style={{ color: 'var(--text-muted)', marginLeft: 3 }}
                      title="Not a vendor-published value — treat as directional"
                    >
                      {cell.marker}
                    </span>
                  )}
                  {cell.deltaPct && (
                    <span
                      className="text-[9px] tabular-nums"
                      style={{ color: 'var(--text-muted)', marginLeft: 4 }}
                      title="Difference vs the base column"
                    >
                      {cell.deltaPct}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── One cloud row inside a line card ─────────────────────────────────────────
function CloudRow({
  cell,
  baseVm,
  base,
  caveatsFor,
}: {
  cell: BomLineCell;
  baseVm: CatalogEntry | null;
  base: CatalogEntry;
  caveatsFor?: CaveatsFor;
}): JSX.Element {
  const tone = providerColor(cell.provider);
  const caveats = cell.vm && !cell.isBase && caveatsFor ? caveatsFor(base, cell.vm) : [];
  return (
    <div
      style={{
        padding: '8px 10px',
        borderRadius: 'var(--radius-sm, 10px)',
        background: cell.isBase ? tone.bg : 'var(--surface)',
        border: `1px solid ${cell.isBase ? tone.border : 'var(--border)'}`,
      }}
    >
      <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 6 }}>
        <span className="text-[11px] font-semibold" style={{ color: tone.fg }}>
          {providerLabel(cell.provider)}
        </span>
        <Sku name={cell.line.matchVmSizeName} />
        {cell.isBase ? (
          <MatchPill pct={100} isBase />
        ) : cell.line.matchPct == null ? (
          <NoEquivalentPill />
        ) : (
          <MatchPill
            pct={cell.line.matchPct}
            suffix={cell.line.matchQuality ? ` · ${cell.line.matchQuality}` : undefined}
          />
        )}
      </div>
      {/* Spec-ratio bars — needs both the base line's VM and this cloud's VM. */}
      {cell.isBase ? (
        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          Reference — other clouds are scored against this line.
        </div>
      ) : baseVm && cell.vm ? (
        <SpecRatioBars base={baseVm} contender={cell.vm} compact />
      ) : (
        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {cell.vm ? 'Base line specs unavailable' : 'No in-category equivalent in the catalog.'}
        </div>
      )}
      {/* Caveat chips — the ONE shared ui/CaveatChip grammar. */}
      {caveats.length > 0 && (
        <div className="flex flex-wrap gap-x-2 gap-y-1" style={{ marginTop: 6 }}>
          {caveats.map((c, i) => (
            <CaveatChip key={i} label={c.label} detail={c.detail} tone={caveatToneOf(c)} />
          ))}
        </div>
      )}
      {/* Per-pairing methodology expander. */}
      {!cell.isBase && baseVm && cell.vm && (
        <div style={{ marginTop: 8 }}>
          <MatchMethodology
            variant="inline"
            base={baseVm}
            matches={[{ provider: cell.provider, vm: cell.vm }]}
            caveatsFor={caveatsFor}
          />
        </div>
      )}
    </div>
  );
}

// ── Line header (shared by expanded card + collapsed row) ────────────────────
function LineHeader({ model }: { model: BomLineModel }): JSX.Element {
  return (
    <>
      <span
        className="text-[10px] font-semibold"
        style={{
          color: 'var(--interactive)',
          background: 'var(--interactive-muted)',
          border: '1px solid var(--border-glow)',
          borderRadius: 'var(--radius-pill)',
          padding: '1px 8px',
          flexShrink: 0,
        }}
      >
        Line {model.index + 1}
      </span>
      <span
        className="text-[12px] font-semibold"
        style={{ color: 'var(--text-primary)', wordBreak: 'break-word' }}
      >
        {model.baseVmSizeName}
      </span>
      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
        × {fmtInt(model.quantity)}
        {model.region ? ` · ${model.region}` : ''}
      </span>
    </>
  );
}

// ── One BoM line card (expanded) ─────────────────────────────────────────────
function LineCard({
  model,
  active,
  onSelect,
  caveatsFor,
}: {
  model: BomLineModel;
  active: boolean;
  onSelect?: (row: number) => void;
  caveatsFor?: CaveatsFor;
}): JSX.Element {
  return (
    <div
      className="glass"
      style={{
        padding: 12,
        borderRadius: 'var(--radius-md)',
        border: active ? '1px solid var(--border-glow)' : '1px solid var(--border)',
      }}
    >
      <button
        type="button"
        onClick={onSelect ? () => onSelect(model.index) : undefined}
        className="w-full flex items-center gap-2 flex-wrap text-left"
        style={{
          background: 'transparent',
          border: 'none',
          cursor: onSelect ? 'pointer' : 'default',
          padding: 0,
          marginBottom: 8,
        }}
      >
        <LineHeader model={model} />
      </button>
      {/* Hero-in-miniature: the at-a-glance side-by-side for this line, in the
          SAME grammar as the VM-sizes SpecShowdown. */}
      <LineShowdown model={model} caveatsFor={caveatsFor} />
      {/* Per-cloud detail (match band, ratio bars, how-it-scored) folded away —
          the mini-showdown above already carries the numbers at a glance. */}
      <Disclosure title="Per-cloud detail & match scoring">
        <div className="space-y-1.5" style={{ paddingTop: 6 }}>
          {model.cells.map((cell) => (
            <CloudRow
              key={`${cell.provider}::${cell.line.matchVmSizeName ?? 'none'}`}
              cell={cell}
              baseVm={model.baseVm}
              base={model.baseVm ?? (cell.vm as CatalogEntry)}
              caveatsFor={caveatsFor}
            />
          ))}
        </div>
      </Disclosure>
    </div>
  );
}

// ── Collapsed one-line row — Line pill · SKU · qty · per-cloud pills ───
function CollapsedLineRow({
  model,
  onSelect,
}: {
  model: BomLineModel;
  onSelect: (row: number) => void;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={() => onSelect(model.index)}
      className="glass w-full flex items-center gap-2 flex-wrap text-left"
      title={`Expand line ${model.index + 1} (${model.baseVmSizeName})`}
      style={{
        padding: '8px 12px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        cursor: 'pointer',
      }}
    >
      <LineHeader model={model} />
      <span className="flex items-center gap-x-3 gap-y-1 flex-wrap" style={{ marginLeft: 'auto' }}>
        {model.cells
          .filter((c) => !c.isBase)
          .map((c) => (
            <span key={c.provider} className="inline-flex items-center gap-1">
              <span
                className="text-[9px] font-semibold uppercase"
                style={{ color: providerColor(c.provider).fg, letterSpacing: '0.05em' }}
              >
                {providerLabel(c.provider)}
              </span>
              {c.line.matchPct == null ? <NoEquivalentPill /> : <MatchPill pct={c.line.matchPct} />}
            </span>
          ))}
      </span>
    </button>
  );
}

// ── Public component ─────────────────────────────────────────────────────────
export interface BomSpecsViewProps {
  ported: BomPortResult;
  bom: BomEntry[];
  userVms: CatalogEntry[];
  /** S66-FIX-C — optional memoized `${provider}|${vmSizeName}` catalog index
   *  (from the parent's deduped-catalog memo) for O(1) per-line resolution;
   *  omitted → the linear `userVms` scan (unchanged behavior). */
  lookup?: Map<string, CatalogEntry>;
  /** Base provider name (e.g. 'Azure'). */
  base: string;
  /** Active BoM line (0-based). < 0 = "All" (first line expands locally). */
  activeRow: number;
  onSelectRow: (row: number) => void;
  /** Optional per-pairing caveats — undefined (default) renders nothing. */
  caveatsFor?: CaveatsFor;
}

const COLLAPSE_AFTER = 5;

export function BomSpecsView({
  ported,
  userVms,
  lookup,
  activeRow,
  onSelectRow,
  caveatsFor,
}: BomSpecsViewProps): JSX.Element {
  const models = useMemo(() => buildBomLineModels(ported, userVms, lookup), [ported, userVms, lookup]);
  const [showAll, setShowAll] = useState(false);

  if (models.length === 0) {
    return (
      <div className="glass" style={{ padding: 16, borderRadius: 'var(--radius-md)' }}>
        <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
          No committed VM-demand lines to compare. Add lines in Set up to port your BoM across clouds.
        </p>
      </div>
    );
  }

  // S66 — ONE skeleton for every focus state: the active line (first line when
  // the dock says "All") expands at the top; every other line is a collapsed
  // row below it, capped at COLLAPSE_AFTER with a "Show N more".
  const expandedIndex = activeRow >= 0 ? Math.min(activeRow, models.length - 1) : 0;
  const expanded = models[expandedIndex];
  const rest = models.filter((m) => m.index !== expandedIndex);
  const shownRest = showAll ? rest : rest.slice(0, COLLAPSE_AFTER);
  const hidden = rest.length - shownRest.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          VM BoM line {expandedIndex + 1} of {models.length}
        </span>
        <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
          each line's base SKU vs its best-match analog on every cloud — click a line to expand it.
        </span>
      </div>
      <LineCard model={expanded} active onSelect={onSelectRow} caveatsFor={caveatsFor} />
      {shownRest.map((model) => (
        <CollapsedLineRow key={model.index} model={model} onSelect={onSelectRow} />
      ))}
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="text-[11px] font-semibold"
          style={{
            padding: '6px 12px',
            background: 'var(--interactive-muted)',
            color: 'var(--interactive)',
            border: '1px solid var(--border-glow)',
            borderRadius: 'var(--radius-pill)',
            cursor: 'pointer',
          }}
        >
          Show {hidden} more line{hidden === 1 ? '' : 's'}
        </button>
      )}
    </div>
  );
}
