import { useApp } from '../state/AppContext';
import { useRunSimulation } from '../utils/useRunSimulation';

/**
 * v2.21 — The Run action, promoted to the top bar.
 *
 * Dashboard doctrine: the top of the page carries the important page
 * actions. Run is THE action of the Advanced workspace, so it is always
 * visible — never buried at the bottom of a setup tab. States:
 *
 *   · runnable        — solid primary button
 *   · running         — spinner label, disabled
 *   · blocked         — disabled with the reason in the tooltip
 *   · stale result    — amber dot on the button ("inputs changed")
 *   · re-run          — label flips to "Re-run" once a result exists
 *
 * The fungibility-gap nudge (BoM × cluster pairs with no authored rule)
 * renders as a compact amber count chip next to the button; clicking it
 * deep-links to the Fungibility setup page. The heavyweight banner the old
 * RunFooter showed lives on in the tab alert dots + auto-route flows.
 */
export function RunControl() {
  const { state, dispatch } = useApp();
  const { run, canRun, blockedReason, isRunning, stale, fungibilityGap } =
    useRunSimulation();
  const hasResult = state.result !== null;

  return (
    <div className="flex items-center gap-2 flex-shrink-0 whitespace-nowrap">
      {fungibilityGap && (
        <button
          type="button"
          onClick={() =>
            dispatch({ type: 'UI_SET', ui: { activeSidebarTab: 'fungibility' } })
          }
          className="flex items-center gap-1 transition-colors"
          style={{
            padding: '3px 10px',
            borderRadius: 'var(--radius-pill)',
            background: 'rgba(251, 191, 36, 0.10)',
            border: '1px solid rgba(251, 191, 36, 0.45)',
            color: 'var(--status-warn)',
            fontSize: 11,
            fontWeight: 600,
            lineHeight: 1.2,
            cursor: 'pointer',
          }}
          title={`${fungibilityGap.vmCount} VM size${
            fungibilityGap.vmCount === 1 ? '' : 's'
          } in your BoM × ${fungibilityGap.pairCount} cluster pair${
            fungibilityGap.pairCount === 1 ? '' : 's'
          } have no fungibility rule — the engine will refuse them. Click to open VM fungibility and author the rules.`}
        >
          <span aria-hidden="true">⚠</span>
          <span>
            {fungibilityGap.pairCount} rule{fungibilityGap.pairCount === 1 ? '' : 's'} missing
          </span>
        </button>
      )}
      <button
        type="button"
        onClick={run}
        disabled={!canRun}
        className="btn-primary relative flex items-center gap-1.5"
        style={{
          height: 34,
          padding: '0 18px',
          fontSize: 12.5,
          letterSpacing: '0.04em',
          opacity: canRun ? 1 : 0.55,
          cursor: canRun ? 'pointer' : 'not-allowed',
        }}
        title={
          isRunning
            ? 'Simulation in progress…'
            : blockedReason ??
              (stale
                ? 'Inputs changed since the last run — re-run to refresh the results.'
                : hasResult
                ? 'Re-run the simulation with the current setup'
                : 'Pack the BoM onto your fleet and open the results')
        }
      >
        <span aria-hidden="true">{isRunning ? '⟳' : '▶'}</span>
        <span>
          {isRunning ? 'Simulating…' : hasResult ? 'Re-run' : 'Run simulation'}
        </span>
        {stale && !isRunning && (
          <span
            className="absolute rounded-full"
            style={{
              top: 5,
              right: 6,
              width: 7,
              height: 7,
              background: 'var(--accent-amber)',
              boxShadow: '0 0 6px var(--accent-amber)',
            }}
            title="Inputs changed — results may be stale"
          />
        )}
      </button>
    </div>
  );
}
