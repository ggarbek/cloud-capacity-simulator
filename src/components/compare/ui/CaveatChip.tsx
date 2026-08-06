/**
 * CaveatChip — S66 shared comparability-flag chip. The ONE amber pill used for
 * "includes estimated rates" / "closest alternative — not a true equivalent" /
 * worst-caveat labels across every CMA surface, replacing the 5+ private
 * AmberChip copies that had drifted (different paddings, alphas, radii).
 *
 * tone 'amber' = warn-severity comparability flags (default).
 * tone 'neutral' = info-severity notes (arch difference, via-category etc.).
 *
 * `detail` renders as a hover tooltip (title=) per the truncate-with-title
 * doctrine — chips stay one short label, the long explanation is on hover.
 *
 * FROZEN during the S66 waves — wave agents consume, never edit.
 */
export function CaveatChip({
  label,
  detail,
  tone = 'amber',
}: {
  label: string;
  detail?: string;
  tone?: 'amber' | 'neutral';
}) {
  const style =
    tone === 'amber'
      ? {
          color: 'var(--accent-amber)',
          background: 'rgba(251, 191, 36, 0.10)',
          border: '1px solid rgba(251, 191, 36, 0.30)',
        }
      : {
          color: 'var(--text-muted)',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border)',
        };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold whitespace-nowrap"
      style={style}
      title={detail}
    >
      {label}
    </span>
  );
}
