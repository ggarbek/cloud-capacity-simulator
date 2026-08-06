/**
 * VerdictBand — S66 shared answer band. THE one visual grammar for "the answer,
 * smack in front of your face" on every CMA page (Exec Summary / Specs /
 * Pricing) in BOTH Comparison and VM-BoM modes.
 *
 * Generalizes S65's ExecBriefVerdict + PriceVerdict presentation (which had
 * drifted apart — different paddings, tints, chip styles) into one component:
 *   — headline: one sentence with the number in it (built by the caller from
 *     tested selector math; <strong> + provider fg inline)
 *   — support: one quieter follow-up line (parity phrase / caveat / lever)
 *   — dataStrip: optional inline key data points (label · value pairs)
 *   — chips: amber comparability flags (estimated rates / stretch match)
 *
 * Tones: 'action' (indigo tint — a confident answer), 'warn' (amber tint —
 * honest missing-datum / caveated answer), 'neutral' (no tint — nothing to
 * decide yet). Callers NEVER restyle the band; if a page looks different from
 * another page, that's a bug per the S66 consistency doctrine.
 *
 * FROZEN during the S66 waves — wave agents consume, never edit.
 */
import { CaveatChip } from './CaveatChip';

export type VerdictTone = 'action' | 'warn' | 'neutral';

export interface VerdictDataPoint {
  label: string;
  value: string;
  /** Optional accent (e.g. provider fg) for the value. */
  fg?: string;
}

export function VerdictBand({
  tone = 'action',
  eyebrow,
  headline,
  support,
  dataStrip,
  chips,
}: {
  tone?: VerdictTone;
  /** Tiny context label above the headline (e.g. "Cost verdict · 3-year reserved"). */
  eyebrow?: string;
  headline: React.ReactNode;
  support?: React.ReactNode;
  dataStrip?: VerdictDataPoint[];
  chips?: { label: string; detail?: string }[];
}) {
  const accent =
    tone === 'warn' ? 'var(--accent-amber)' : tone === 'neutral' ? 'var(--border)' : 'var(--interactive)';
  const tint =
    tone === 'warn'
      ? 'rgba(245,158,11,0.06)'
      : tone === 'neutral'
        ? undefined
        : 'rgba(129,140,248,0.05)';

  return (
    <section
      className="glass"
      style={{
        padding: 16,
        borderRadius: 'var(--radius-md)',
        borderLeft: `3px solid ${accent}`,
        background: tint,
      }}
    >
      {eyebrow && (
        <div
          className="text-[9px] tracking-[0.05em] font-semibold uppercase mb-1"
          style={{ color: 'var(--text-muted)' }}
        >
          {eyebrow}
        </div>
      )}
      <p className="text-[14px] font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
        {headline}
      </p>
      {support && (
        <p className="text-[11px] mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {support}
        </p>
      )}
      {dataStrip && dataStrip.length > 0 && (
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mt-2.5">
          {dataStrip.map((d) => (
            <span key={d.label} className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {d.label}{' '}
              <strong
                className="text-[11px] tabular-nums"
                style={{ color: d.fg ?? 'var(--text-primary)' }}
              >
                {d.value}
              </strong>
            </span>
          ))}
        </div>
      )}
      {chips && chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-2.5">
          {chips.map((c) => (
            <CaveatChip key={c.label} label={c.label} detail={c.detail} />
          ))}
        </div>
      )}
    </section>
  );
}
