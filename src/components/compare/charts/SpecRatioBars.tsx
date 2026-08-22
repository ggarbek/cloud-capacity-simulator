/**
 * SpecRatioBars — four pure-CSS horizontal ratio bars comparing a CONTENDER
 * VM against a BASE reference on the four dimensions that actually separate
 * sizes: vCPU, memory, network, and local disk. The base is the 100% tick;
 * the contender's bar is its ratio to the base, capped at 2× with a "+"
 * overflow marker so a 5× outlier doesn't blow out the row. Numeric value
 * labels are ALWAYS shown in full (wrap-don't-truncate) so the bar is a
 * legend, not the source of truth.
 *
 * Colors are semantic-only from tokens: at-or-above parity reads
 * `var(--interactive)`; under-parity (the contender is smaller than the base
 * on that dimension) reads `var(--accent-amber)` as a soft "you're giving
 * something up here" cue. No new accent colors.
 *
 * The `specRatios` helper is a PURE function exported from this file (unit-
 * tested in SpecRatioBars.test.ts). It is deliberately local — the shared
 * chart-math module is owned by a sibling; keeping the helper here avoids a
 * merge collision while still being testable in isolation.
 */
import type { CatalogEntry } from '../../../types';

/** One dimension's comparison result. `ratio` is null when the dimension is
 *  not comparable (either side missing / the base is zero) — so network and
 *  local disk gracefully drop out for sizes that don't report them. */
export interface SpecRatio {
  key: 'vcpu' | 'mem' | 'net' | 'disk';
  label: string;
  /** The unit suffix shown after each numeric value (e.g. 'vCPU', 'GiB'). */
  unit: string;
  baseValue: number;
  contenderValue: number;
  /** contenderValue / baseValue, or null when not comparable. */
  ratio: number | null;
}

/** Safe numeric read — non-finite / negative coerce to 0. */
const num = (n: number | undefined | null): number =>
  typeof n === 'number' && isFinite(n) && n > 0 ? n : 0;

/**
 * PURE — the four spec ratios for a (base, contender) pair. A dimension whose
 * base is 0 (the size doesn't report it) yields `ratio: null`; the caller then
 * renders it muted / skips the bar. vCPU and memory always compute (guaranteed
 * ≥ 1 / ≥ 0.5 by the catalog), network and disk are the ones that go null-ish.
 */
export function specRatios(base: CatalogEntry, contender: CatalogEntry): SpecRatio[] {
  const dims: { key: SpecRatio['key']; label: string; unit: string; b: number; c: number }[] = [
    { key: 'vcpu', label: 'vCPU', unit: 'vCPU', b: num(base.vcpus), c: num(contender.vcpus) },
    { key: 'mem', label: 'Memory', unit: 'GiB', b: num(base.memoryGib), c: num(contender.memoryGib) },
    { key: 'net', label: 'Network', unit: 'Mbps', b: num(base.networkMbps), c: num(contender.networkMbps) },
    { key: 'disk', label: 'Local disk', unit: 'GiB', b: num(base.localDiskGib), c: num(contender.localDiskGib) },
  ];
  return dims.map(({ key, label, unit, b, c }) => ({
    key,
    label,
    unit,
    baseValue: b,
    contenderValue: c,
    ratio: b > 0 ? c / b : null,
  }));
}

/** Format a spec value compactly but never lossily for small numbers. */
function fmtVal(n: number, unit: string): string {
  if (n <= 0) return `—`;
  let s: string;
  if (unit === 'Mbps' && n >= 1000) s = `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)} Gbps`;
  else if (n >= 1000) s = Math.round(n).toLocaleString('en-US');
  else if (Number.isInteger(n)) s = String(n);
  else s = n.toFixed(1);
  if (unit === 'Mbps' && n >= 1000) return s; // already carries the unit
  return `${s} ${unit}`;
}

const CAP = 2; // ratio bars cap at 2× the base; beyond that shows a "+" overflow.

function RatioRow({ r, compact }: { r: SpecRatio; compact?: boolean }): JSX.Element {
  const comparable = r.ratio != null && r.baseValue > 0;
  const capped = comparable ? Math.min(r.ratio as number, CAP) : 0;
  const overflow = comparable && (r.ratio as number) > CAP;
  const under = comparable && (r.ratio as number) < 1;
  // Fill % of the track: base parity sits at 50% (the reference tick), so the
  // contender bar scales 0..CAP across the full width with parity at the tick.
  const fillPct = comparable ? (capped / CAP) * 100 : 0;
  const barColor = under ? 'var(--accent-amber)' : 'var(--interactive)';
  const barH = compact ? 5 : 7;
  return (
    <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
      <span
        className="text-text-muted"
        style={{ fontSize: compact ? 9 : 10, width: compact ? 58 : 68, flexShrink: 0 }}
      >
        {r.label}
      </span>
      <div
        className="relative"
        style={{
          flex: 1,
          minWidth: 0,
          height: barH,
          borderRadius: 999,
          background: 'var(--surface-2)',
          overflow: 'hidden',
        }}
        title={
          comparable
            ? `${r.label}: ${fmtVal(r.contenderValue, r.unit)} vs base ${fmtVal(r.baseValue, r.unit)} (${(r.ratio as number).toFixed(2)}×)`
            : `${r.label}: not reported for this pairing`
        }
      >
        {/* Base parity tick at 50%. */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: -1,
            bottom: -1,
            width: 1,
            background: 'var(--border-strong)',
          }}
        />
        {comparable && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${fillPct}%`,
              background: barColor,
              borderRadius: 999,
              transition: 'width 220ms var(--ease-out, ease-out)',
            }}
          />
        )}
      </div>
      {/* Numeric labels — ALWAYS visible in full, never truncated. */}
      <span
        className="tabular-nums"
        style={{
          fontSize: compact ? 9 : 10,
          color: comparable ? 'var(--text-secondary)' : 'var(--text-muted)',
          textAlign: 'right',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {comparable ? fmtVal(r.contenderValue, r.unit) : 'n/a'}
        {overflow && (
          <span style={{ color: 'var(--interactive)', marginLeft: 3 }} title="More than 2× the base">
            +
          </span>
        )}
      </span>
    </div>
  );
}

export function SpecRatioBars({
  base,
  contender,
  compact,
}: {
  base: CatalogEntry;
  contender: CatalogEntry;
  compact?: boolean;
}): JSX.Element {
  const rows = specRatios(base, contender);
  return (
    <div className="space-y-1" style={{ minWidth: 0 }}>
      {rows.map((r) => (
        <RatioRow key={r.key} r={r} compact={compact} />
      ))}
    </div>
  );
}
