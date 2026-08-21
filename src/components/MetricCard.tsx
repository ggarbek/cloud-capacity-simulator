/**
 * MetricCard — the "Distance from Ideal" primitive (S26).
 *
 * One visual idiom, reused across all four Simple-track metric families:
 * a headline value, a horizontal track with the current position + one or
 * more target ticks ("where you want to be"), and a gap callout naming the
 * distance to ideal. Users learn the language once and read every metric the
 * same way.
 *
 * Design: flat card, sentence-case, big value, semantic tone (green good /
 * amber caution / red bad / indigo neutral). No glass, no glow.
 */
import type { ReactNode } from 'react';

export type Tone = 'good' | 'warn' | 'bad' | 'neutral';

const toneVar: Record<Tone, string> = {
  good: 'var(--status-good)',
  warn: 'var(--status-warn)',
  bad: 'var(--status-bad)',
  neutral: 'var(--interactive)',
};

export interface MetricCardProps {
  /** Family name, e.g. "Profitability". */
  title: string;
  /** The plain-English question this family answers. */
  question: string;
  /** Formatted headline value, e.g. "−12.5%" or "$215K/mo" or "96%". */
  value: string;
  tone: Tone;
  /** Track domain + current position. `current` null = no data (empty track). */
  trackMin: number;
  trackMax: number;
  current: number | null;
  /** Target ticks ("ideal"): position on the track + a short label. */
  targets?: { at: number; label: string }[];
  /** The distance-from-ideal sentence + its tone. */
  gap?: { text: string; tone: Tone };
  /** Up to ~4 supporting figures shown beneath the track. */
  supporting?: { label: string; value: string }[];
  /** Optional trailing note (e.g. an unpriced-data caveat). */
  footnote?: ReactNode;
}

function clampPct(v: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
}

export function MetricCard({
  title,
  question,
  value,
  tone,
  trackMin,
  trackMax,
  current,
  targets = [],
  gap,
  supporting = [],
  footnote,
}: MetricCardProps) {
  const accent = toneVar[tone];
  const hasData = current != null && Number.isFinite(current);
  const fillPct = hasData ? clampPct(current as number, trackMin, trackMax) : 0;

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Header: title + question */}
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            color: 'var(--text-primary)',
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
          {question}
        </div>
      </div>

      {/* Headline value */}
      <div
        style={{
          fontSize: 40,
          fontWeight: 600,
          lineHeight: 1.0,
          letterSpacing: '-0.025em',
          color: hasData ? accent : 'var(--text-dim)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {hasData ? value : '—'}
      </div>

      {/* Track: neutral rail + toned fill + target ticks + current marker */}
      <div style={{ paddingTop: 14, paddingBottom: targets.length ? 14 : 2 }}>
        <div
          style={{
            position: 'relative',
            height: 8,
            borderRadius: 'var(--radius-pill)',
            background: 'var(--tint-soft-2)',
            border: '1px solid var(--border)',
          }}
        >
          {/* Toned fill to current */}
          {hasData && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '100%',
                transformOrigin: 'left',
                transform: `scaleX(${fillPct / 100})`,
                transition: 'transform 320ms var(--ease-out)',
                background: accent,
                opacity: 0.85,
                borderRadius: 'var(--radius-pill)',
              }}
            />
          )}
          {/* Current marker dot */}
          {hasData && (
            <div
              style={{
                position: 'absolute',
                left: `${fillPct}%`,
                top: '50%',
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: accent,
                border: '2px solid var(--surface)',
                transform: 'translate(-50%, -50%)',
                boxShadow: 'var(--shadow-card)',
              }}
            />
          )}
          {/* Target ticks */}
          {targets.map((t, i) => {
            const left = clampPct(t.at, trackMin, trackMax);
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${left}%`,
                  top: -3,
                  bottom: -3,
                  width: 2,
                  background: 'var(--text-dim)',
                  transform: 'translateX(-1px)',
                }}
                aria-hidden="true"
              />
            );
          })}
          {/* Target labels under the ticks — collision-aware so close ticks
              (e.g. break-even at 0% + healthy at 20%) don't overprint. When two
              centered labels would overlap, the earlier anchors right (text
              grows left of its tick) and the later anchors left (grows right). */}
          {(() => {
            const lbls = targets
              .map((t, i) => ({ t, i, left: clampPct(t.at, trackMin, trackMax) }))
              .sort((a, b) => a.left - b.left);
            const anchor: ('center' | 'start' | 'end')[] = lbls.map(() => 'center');
            const COLLIDE_PCT = 18; // within this track-% gap, centered labels collide
            for (let k = 0; k < lbls.length - 1; k++) {
              if (lbls[k + 1].left - lbls[k].left < COLLIDE_PCT) {
                anchor[k] = 'end';
                anchor[k + 1] = 'start';
              }
            }
            return lbls.map((l, k) => {
              const transform =
                anchor[k] === 'center'
                  ? 'translateX(-50%)'
                  : anchor[k] === 'end'
                    ? 'translateX(calc(-100% - 3px))'
                    : 'translateX(3px)';
              return (
                <div
                  key={`l-${l.i}`}
                  style={{
                    position: 'absolute',
                    left: `${l.left}%`,
                    top: 12,
                    transform,
                    fontSize: 10,
                    color: 'var(--text-dim)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {l.t.label}
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Gap callout */}
      {gap && (
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: toneVar[gap.tone],
          }}
        >
          {gap.text}
        </div>
      )}

      {/* Supporting figures */}
      {supporting.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(supporting.length, 2)}, minmax(0, 1fr))`,
            gap: '8px 16px',
            paddingTop: 4,
            borderTop: '1px solid var(--border)',
          }}
        >
          {supporting.map((s, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</span>
              <span
                style={{
                  fontSize: 14,
                  color: 'var(--text-primary)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {s.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {footnote && (
        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{footnote}</div>
      )}
    </div>
  );
}
