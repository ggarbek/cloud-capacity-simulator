/**
 * Dashboard-wide progress bar — the default primitive for any quantity.
 * Line + end-of-fill dot. Green normally; red when `binding`.
 * Optional `preview` shows a hypothetical "what-if" state with a hatched ghost
 * segment between the current value and the preview value, and the dot moves
 * to the preview position. Used by StatDetailPanel (hover-to-preview backfill
 * impact) and NodeDetailPanel.
 */

interface Props {
  label: string;
  used: number;
  total: number;
  unit: string;
  pct: number;
  binding?: boolean;
  disabled?: boolean;
  /** Wrapper class to control bottom margin from caller (so caller decides spacing). */
  className?: string;
  /**
   * Optional hypothetical state. When provided, the label flips to "base → preview / total · preview%"
   * and the bar renders a hatched ghost segment between basePct and previewPct.
   * Decreasing preview (previewPct < pct) is rendered in green hatching (recovery),
   * increasing preview (previewPct > pct) in same-family hatching (consumption).
   */
  preview?: { used: number; pct: number };
}

export function ProgressBar({
  label,
  used,
  total,
  unit,
  pct,
  binding = false,
  disabled = false,
  className = 'mb-5',
  preview,
}: Props) {
  const fillFrom = binding ? '#EF4444' : '#22C55E';
  const fillTo = binding ? '#F87171' : '#6EE7B7';
  const baseDot = binding ? '#FCA5A5' : '#86EFAC';
  const baseGlow = binding
    ? 'none'
    : 'none';

  const previewing = !!preview && !disabled;
  const previewPct = preview?.pct ?? pct;
  const dotPct = previewing ? previewPct : pct;
  const overflow = previewing && previewPct > 100;
  const decreasing = previewing && previewPct < pct;
  // Ghost segment color: green when previewing recovery (decrease), same family
  // as the bar when previewing consumption (increase).
  const ghostColor = decreasing ? '#86EFAC' : binding ? '#F87171' : '#86EFAC';
  const dotColor = overflow ? '#EF4444' : decreasing ? '#86EFAC' : baseDot;

  const lo = previewing ? Math.min(pct, previewPct) : pct;
  const hi = previewing ? Math.max(pct, previewPct) : pct;

  return (
    <div className={className} style={{ opacity: disabled ? 0.4 : 1 }}>
      <div className="flex justify-between text-[10px] font-mono">
        <span
          className="tracking-[0.04em]"
          style={{ color: binding ? 'var(--node-full)' : 'var(--text-muted)' }}
        >
          {label}
          {binding && ' ●'}
        </span>
        <span className="text-text-secondary">
          {disabled ? (
            'not configured'
          ) : previewing ? (
            <>
              <span className="text-text-muted">{Math.round(used).toLocaleString()}</span>
              {' → '}
              <span className={overflow ? 'text-rose-300' : 'text-interactive'}>
                {Math.round(preview!.used).toLocaleString()}
              </span>
              {' / '}
              {total.toLocaleString()} {unit} · {previewPct.toFixed(1)}%
            </>
          ) : (
            `${Math.round(used).toLocaleString()} / ${total.toLocaleString()} ${unit} · ${pct.toFixed(1)}%`
          )}
        </span>
      </div>
      <div
        className="relative mt-1.5"
        style={{
          height: 8,
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-pill)',
          overflow: 'visible',
        }}
      >
        {/* Solid base fill — when previewing a decrease, only fill up to the
            preview (the area beyond becomes the recovery ghost). */}
        <div
          className="h-full absolute left-0 top-0"
          style={{
            width: `${Math.min(100, decreasing ? previewPct : pct)}%`,
            background: `linear-gradient(90deg, ${fillFrom}, ${fillTo})`,
            boxShadow: baseGlow,
            borderRadius: 'var(--radius-pill)',
            transition: 'width 200ms ease',
          }}
        />
        {/* Hatched ghost segment between lo..hi when previewing */}
        {previewing && hi > lo && (
          <div
            className="h-full absolute top-0"
            style={{
              left: `${Math.min(100, lo)}%`,
              width: `${Math.min(100, hi) - Math.min(100, lo)}%`,
              background: `repeating-linear-gradient(45deg, ${ghostColor}55, ${ghostColor}55 4px, transparent 4px, transparent 7px)`,
              borderRadius: 'var(--radius-pill)',
              transition: 'left 160ms ease, width 160ms ease',
            }}
          />
        )}
        {/* End-of-fill dot — slides to preview position when previewing */}
        {!disabled && dotPct > 0 && (
          <span
            className="absolute top-1/2"
            style={{
              left: `calc(${Math.min(100, dotPct)}% - 6px)`,
              transform: 'translateY(-50%)',
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: dotColor,
              border: '2px solid var(--bg-deep)',
              boxShadow:
                binding || overflow
                  ? '0 0 4px rgba(239, 68, 68, 0.35)'
                  : '0 0 4px rgba(34, 197, 94, 0.3)',
              transition: 'left 200ms ease',
            }}
          />
        )}
      </div>
    </div>
  );
}
