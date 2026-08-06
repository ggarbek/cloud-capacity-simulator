/**
 * ExecBriefAssumptions — the amber assumptions footer (S65 EXEC). A compact one-
 * liner naming every assumption in play (estimated rates, assumed processors,
 * stretch analogs) so the reader treats the brief's figures as directional where
 * they must. Renders nothing when the comparison is clean. Lines are collected by
 * the pure `collectAssumptions` selector.
 */
export function ExecBriefAssumptions({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null;
  return (
    <p
      className="text-[10px] leading-relaxed"
      style={{ color: 'var(--accent-amber)' }}
    >
      <span className="font-semibold uppercase tracking-[0.05em]">Assumptions</span> ·{' '}
      {lines.join(' · ')}.
    </p>
  );
}
