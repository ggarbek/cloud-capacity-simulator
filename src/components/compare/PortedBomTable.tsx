/**
 * PortedBomTable — cross-cloud comparison of the user's committed VM-demand
 * Bill of Materials (BoM), rendered as a table with NO region/zone columns.
 *
 * The base cloud's SKUs sit alongside the best-match equivalent SKU on each
 * other selected cloud, at the SAME quantities. This is the "port my demand"
 * view: "your Azure BoM, line-for-line, on AWS / GCP" — SKU + spec-match only,
 * not pricing.
 *
 * Pure presentation + a single `portBom` call (term 'payg', estimate off — we
 * only consume the SKU matches + match%, never the priced totals). Everything
 * else arrives via props; no `useApp` / state / dispatch / side effects.
 *
 * Visual language follows the app + the Compare surfaces: `.glass` surfaces,
 * `var(--radius-md)`, `var(--text-*)` tokens, 10–12px type, rounded pills, and
 * the three provider hexes (Azure blue / AWS gold / GCP red) mirrored from the
 * CompetitivePage `PROVIDER_TONE` map (local-only there, so re-declared here to
 * keep this component self-contained). Tables truncate long SKU names WITH a
 * `title=` tooltip per the project's wrap-vs-truncate rule.
 */
import { useMemo } from 'react';
import type { BomEntry, CatalogEntry, VmCategory } from '../../types';
import { portBom, type BomPortResult, type PortedLine } from '../../utils/bomPort';
import { pctTone } from './ui/tokens'; // S66 FIX-A — the ONE match-% tone
import { CaveatChip } from './ui/CaveatChip'; // S66 FIX-A — exclusion chips

/** Provider foreground / tint / border hexes — mirrors CompetitivePage's
 *  `PROVIDER_TONE` (which is local + unexported there). No new accent colours:
 *  Azure blue, AWS gold, GCP red, Custom = the indigo interactive token. */
const PROVIDER_COLOR: Record<string, { fg: string; bg: string; border: string }> = {
  Azure: { fg: '#93C5FD', bg: 'rgba(96, 165, 250, 0.10)', border: 'rgba(96, 165, 250, 0.30)' },
  AWS: { fg: '#FCD34D', bg: 'rgba(251, 191, 36, 0.10)', border: 'rgba(251, 191, 36, 0.30)' },
  GCP: { fg: '#FCA5A5', bg: 'rgba(239, 68, 68, 0.10)', border: 'rgba(239, 68, 68, 0.30)' },
  Custom: { fg: 'var(--interactive)', bg: 'rgba(129, 140, 248, 0.10)', border: 'var(--border-glow)' },
};

function providerColor(p: string) {
  return PROVIDER_COLOR[p] ?? PROVIDER_COLOR.Custom;
}

const sameProvider = (vm: CatalogEntry, provider: string): boolean =>
  (vm.provider ?? '').toLowerCase() === provider.toLowerCase();

/** Thousands-separated integer. */
const fmtInt = (n: number): string => Math.round(n).toLocaleString('en-US');

/** Monospace SKU pill that truncates with a tooltip. */
function SkuPill({ name }: { name: string }): JSX.Element {
  return (
    <span
      title={name}
      style={{
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 11,
        color: 'var(--text-primary)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        display: 'block',
        maxWidth: '100%',
      }}
    >
      {name}
    </span>
  );
}

/** "× {qty}" muted suffix. */
function QtyTag({ qty }: { qty: number }): JSX.Element {
  return (
    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>× {fmtInt(qty)}</span>
  );
}

/** "≈{pct}%" match tag. S66 FIX-A — tones via the shared `pctTone` (≥85 green /
 *  ≥65 amber / red), so the dock's pills agree with every other S66 match pill
 *  instead of the old private ≥90-green/muted band. */
function MatchTag({ pct }: { pct: number }): JSX.Element {
  const tone = pctTone(pct);
  return (
    <span
      style={{
        fontSize: 10,
        padding: '1px 6px',
        borderRadius: 'var(--radius-pill)',
        color: tone,
        background: `${tone}1F`,
        border: `1px solid ${tone}47`,
        whiteSpace: 'nowrap',
      }}
    >
      ≈{Math.round(pct)}%
    </span>
  );
}

/** A coloured provider column header cell. */
function ProviderHead({ provider, isBase }: { provider: string; isBase: boolean }): JSX.Element {
  const tone = providerColor(provider);
  return (
    <th
      style={{
        textAlign: 'left',
        padding: '8px 12px',
        background: tone.bg,
        borderBottom: `1px solid ${tone.border}`,
        position: 'sticky',
        top: 0,
      }}
    >
      <span style={{ color: tone.fg, fontSize: 12, fontWeight: 600 }}>{provider}</span>
      {isBase && (
        <span style={{ color: 'var(--text-muted)', fontSize: 10, marginLeft: 6 }}>· base</span>
      )}
    </th>
  );
}

export interface PortedBomTableProps {
  bom: BomEntry[];
  userVms: CatalogEntry[];
  /** Base provider name, e.g. 'Azure'. */
  base: string;
  /** Other selected providers in display order, e.g. ['AWS','GCP']. */
  targets: string[];
  /** The BoM line currently being drilled below (0-based). `< 0` = "All" (no
   *  single line highlighted). Drives the row highlight so the selection is
   *  visible IN the table, not just on the dock's VIEW LINE pills. */
  activeRow?: number;
  /** Select a line by clicking its row — mirrors the dock's VIEW LINE pills. */
  onSelectRow?: (row: number) => void;
  /** Pre-computed cross-cloud port (from the shared `useBomPort` hook). When
   *  supplied, the table reuses it instead of running its own memoized port —
   *  so a caller that already ported the BoM at the user's term (e.g. the Specs
   *  page) doesn't pay for a second, PAYG-only port. When omitted, the table
   *  falls back to its own internal PAYG port (the SKU matches + match% it
   *  renders are term-independent, so PAYG is a safe fallback basis). */
  ported?: BomPortResult;
}

export function PortedBomTable({
  bom,
  userVms,
  base,
  targets,
  activeRow,
  onSelectRow,
  ported: portedProp,
}: PortedBomTableProps): JSX.Element {
  // ── Engine: one portBom call → base + target scenarios. Reuse the caller's
  // pre-computed port when provided; otherwise run our own (payg, estimate off).
  // We only consume the SKU matches + match% here, never the priced totals, so
  // the PAYG fallback basis is term-independent. Each scenario's `.lines` is in
  // the SAME order as `bom`, so we zip by index.
  const portedOwn = useMemo(
    () => portBom(bom, userVms, base, targets, 'payg', false),
    [bom, userVms, base, targets],
  );
  const ported = portedProp ?? portedOwn;

  // ── Resolve each base line's CatalogEntry once (for specs + category). The
  // base scenario's lines[i] ↔ bom[i] ↔ each target scenario's lines[i].
  const lines = useMemo(() => {
    return bom.map((entry, i) => {
      const baseVm =
        userVms.find((v) => sameProvider(v, base) && v.vmSizeName === entry.vmSizeName) ?? null;
      const category: VmCategory = (baseVm?.category as VmCategory) ?? ('Custom' as VmCategory);
      const baseLine: PortedLine | undefined = ported.baseScenario.lines[i];
      const targetLines: Array<{ provider: string; line: PortedLine | undefined }> =
        ported.targetScenarios.map((s) => ({ provider: s.provider, line: s.lines[i] }));
      return {
        // Original BoM index — drives the visible line number + the row
        // highlight, so the dock's "VIEW LINE 2" maps to the row labelled "2"
        // even though rows are re-ordered into category groups below.
        bomIndex: i,
        vmSizeName: entry.vmSizeName,
        quantity: entry.quantity,
        baseVm,
        category,
        baseLine,
        targetLines,
      };
    });
  }, [bom, userVms, base, ported]);

  // ── Summary header metrics (computed off the BASE cloud's catalog rows). ────
  const summary = useMemo(() => {
    const skus = new Set<string>();
    let vms = 0;
    let vcpu = 0;
    let gib = 0;
    for (const l of lines) {
      skus.add(l.vmSizeName);
      vms += l.quantity;
      if (l.baseVm) {
        vcpu += l.quantity * l.baseVm.vcpus;
        gib += l.quantity * l.baseVm.memoryGib;
      }
    }
    return { skus: skus.size, vms, vcpu, gib };
  }, [lines]);

  // ── Group rows by category (display order = first-seen). ───────────────────
  const groups = useMemo(() => {
    const order: VmCategory[] = [];
    const byCat = new Map<VmCategory, typeof lines>();
    for (const l of lines) {
      if (!byCat.has(l.category)) {
        byCat.set(l.category, []);
        order.push(l.category);
      }
      byCat.get(l.category)!.push(l);
    }
    return order.map((cat) => ({ cat, rows: byCat.get(cat)! }));
  }, [lines]);

  const targetProviders = ported.targetScenarios.map((s) => s.provider);
  const colCount = 1 + targetProviders.length;

  // S66 FIX-A — per-cloud excluded-line chips: unmatched lines (no analog —
  // term-independent, always shown) and matched-but-UNPRICED lines (no
  // resolvable rate — only when the caller supplied its term-priced port, so
  // the internal PAYG fallback can't mislabel a term-specific gap). These are
  // the same lines every $ total on the page silently excludes.
  const exclusionChips = useMemo(() => {
    const chips: { key: string; label: string; detail: string }[] = [];
    for (const s of [ported.baseScenario, ...ported.targetScenarios]) {
      if (s.unmatchedLines > 0 && s.provider !== base) {
        chips.push({
          key: `${s.provider}-unmatched`,
          label: `${s.unmatchedLines} line${s.unmatchedLines === 1 ? ' has' : 's have'} no analog on ${s.provider}`,
          detail: `${s.unmatchedLines} BoM line${s.unmatchedLines === 1 ? ' has' : 's have'} no equivalent on ${s.provider} — excluded from its totals everywhere on this page.`,
        });
      }
      const unpriced = s.matchedLines - s.pricedLines;
      if (portedProp != null && unpriced > 0) {
        chips.push({
          key: `${s.provider}-unpriced`,
          label: `${unpriced} line${unpriced === 1 ? '' : 's'} unpriced on ${s.provider} — excluded from its total`,
          detail: `${unpriced} BoM line${unpriced === 1 ? '' : 's'} did not resolve to a priced ${s.provider} SKU at the selected term — excluded from its monthly total.`,
        });
      }
    }
    return chips;
  }, [ported, portedProp, base]);

  // ── Empty state (after hooks, to keep hook order stable). ──────────────────
  if (bom.length === 0) {
    return (
      <div
        className="glass"
        style={{
          borderRadius: 'var(--radius-md)',
          padding: 16,
          fontSize: 12,
          color: 'var(--text-muted)',
          lineHeight: 1.5,
        }}
      >
        No committed VM demand yet — build a Bill of Materials on the VM Demand tab, then it
        ports here automatically.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Summary header line */}
      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          {fmtInt(summary.skus)}
        </span>{' '}
        SKUs
        <span style={{ color: 'var(--text-muted)' }}> · </span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          {fmtInt(summary.vms)}
        </span>{' '}
        VMs
        <span style={{ color: 'var(--text-muted)' }}> · </span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          {fmtInt(summary.vcpu)}
        </span>{' '}
        vCPU
        <span style={{ color: 'var(--text-muted)' }}> · </span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          {fmtInt(summary.gib)}
        </span>{' '}
        GiB
      </div>

      {/* S66 FIX-A — excluded-line disclosure (unmatched / unpriced per cloud). */}
      {exclusionChips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {exclusionChips.map((c) => (
            <CaveatChip key={c.key} label={c.label} detail={c.detail} tone="amber" />
          ))}
        </div>
      )}

      {/* Comparison table — capped at ~4 visible rows; the rest scrolls so a long
          BoM never dominates the page. The sticky header stays pinned while the
          body scrolls (the `#` + provider `th`s carry `position: sticky; top: 0`). */}
      <div
        className="glass"
        style={{
          borderRadius: 'var(--radius-md)',
          overflowY: 'auto',
          overflowX: 'hidden',
          // Isolate this scroll from the page so it can't drive the dock's
          // scroll-linked collapse (which used to reset scrollTop mid-scroll).
          overscrollBehavior: 'contain',
          maxHeight: 268,
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            tableLayout: 'fixed',
          }}
        >
          <colgroup>
            {/* Narrow leading line-number column, then base (wider) + targets. */}
            <col style={{ width: 38 }} />
            <col style={{ width: `${100 / (colCount + 0.5)}%` }} />
            {targetProviders.map((p) => (
              <col key={p} style={{ width: `${100 / (colCount + 0.5)}%` }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th
                style={{
                  textAlign: 'center',
                  padding: '8px 6px',
                  borderBottom: '1px solid var(--border)',
                  position: 'sticky',
                  top: 0,
                  background: 'var(--bg)',
                }}
              >
                <span
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                  }}
                >
                  #
                </span>
              </th>
              <ProviderHead provider={base} isBase />
              {targetProviders.map((p) => (
                <ProviderHead key={p} provider={p} isBase={false} />
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <CategoryGroup
                key={g.cat}
                category={g.cat}
                rows={g.rows}
                colCount={colCount}
                activeRow={activeRow}
                onSelectRow={onSelectRow}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** One category sub-header + its BoM rows. */
function CategoryGroup({
  category,
  rows,
  colCount,
  activeRow,
  onSelectRow,
}: {
  category: VmCategory;
  rows: Array<{
    bomIndex: number;
    vmSizeName: string;
    quantity: number;
    baseLine: PortedLine | undefined;
    targetLines: Array<{ provider: string; line: PortedLine | undefined }>;
  }>;
  colCount: number;
  activeRow?: number;
  onSelectRow?: (row: number) => void;
}): JSX.Element {
  return (
    <>
      <tr>
        <td
          colSpan={colCount + 1}
          style={{
            padding: '7px 12px 4px',
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            borderTop: '1px solid var(--border)',
          }}
        >
          {category}
        </td>
      </tr>
      {rows.map((r, i) => {
        const active = activeRow != null && activeRow >= 0 && activeRow === r.bomIndex;
        const clickable = !!onSelectRow;
        const cellBg = active ? 'rgba(129, 140, 248, 0.10)' : undefined;
        return (
          <tr
            key={`${r.vmSizeName}-${i}`}
            onClick={clickable ? () => onSelectRow!(r.bomIndex) : undefined}
            style={{ cursor: clickable ? 'pointer' : undefined }}
            title={clickable ? `View BoM line ${r.bomIndex + 1}` : undefined}
            aria-selected={active}
          >
            {/* Line-number cell — maps to the dock's VIEW LINE pill. */}
            <td
              style={{
                padding: '8px 6px',
                borderTop: '1px solid var(--border)',
                verticalAlign: 'top',
                textAlign: 'center',
                background: cellBg,
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 18,
                  height: 18,
                  padding: '0 5px',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                  color: active ? '#04111A' : 'var(--text-muted)',
                  background: active ? 'var(--interactive)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${active ? 'var(--interactive)' : 'var(--border)'}`,
                }}
              >
                {r.bomIndex + 1}
              </span>
            </td>
            {/* Base cell */}
            <td
              style={{
                padding: '8px 12px',
                borderTop: '1px solid var(--border)',
                verticalAlign: 'top',
                background: cellBg,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <SkuPill name={r.baseLine?.matchVmSizeName ?? r.vmSizeName} />
                <QtyTag qty={r.quantity} />
              </div>
            </td>
            {/* Target cells */}
            {r.targetLines.map((t) => {
              const matched = t.line?.matchVmSizeName ?? null;
              return (
                <td
                  key={t.provider}
                  style={{
                    padding: '8px 12px',
                    borderTop: '1px solid var(--border)',
                    verticalAlign: 'top',
                    background: cellBg,
                  }}
                >
                  {matched == null ? (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>— no match</span>
                  ) : (
                    <div
                      style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}
                    >
                      <SkuPill name={matched} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <QtyTag qty={r.quantity} />
                        {t.line?.matchPct != null && <MatchTag pct={t.line.matchPct} />}
                      </div>
                    </div>
                  )}
                </td>
              );
            })}
          </tr>
        );
      })}
    </>
  );
}
