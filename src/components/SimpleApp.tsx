/**
 * SimpleApp — the Simple-track result surface (v3, "five questions" rebuild).
 *
 * Lands the user on ANSWERS, not a form and not a metrics grid. The five
 * questions a capacity plan turns on are answered in plain English by the
 * shared AnswersPanel:
 *
 *   1. Is this deployment supportable on current capacity?
 *   2. Where are we blocked, and why?
 *   3. How much more can we sell on this fleet?
 *   4. Does new hardware investment make sense?
 *   5. Will the investment pay off, and when?
 *
 * All numbers come from the same engine + pure helpers the Advanced track
 * uses (buildAndRunSimulation / computeAnswers / evaluateInvestment). The
 * engine is never forked. Authoring stays on Advanced; Simple is read-only
 * presentation plus a one-click demo.
 */
import { useState } from 'react';
import { useApp } from '../state/AppContext';
import { buildAndRunSimulation } from '../utils/runEngine';
import {
  fetchDemoSnapshot,
  prepareSnapshotHydrate,
  isDemoFleet,
  DEMO_SUMMARY,
} from '../utils/demoSnapshot';
import { AnswersPanel } from './AnswersPanel';

export function SimpleApp() {
  const { state, dispatch } = useApp();
  const result = state.result;
  const hasBom = state.bom.length > 0;
  const [demoError, setDemoError] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);

  const runNow = () => {
    dispatch({ type: 'RUN_START' });
    const r = buildAndRunSimulation(state);
    dispatch({ type: 'RUN_COMPLETE', result: r });
  };

  // v2.20.1 — the demo IS the walkthrough snapshot (zonal + spillover, the
  // user-blessed scenario). Fetch → hydrate → run on the merged state so the
  // user lands on a complete result in one click.
  const loadDemoAndRun = async () => {
    setDemoError(null);
    setDemoLoading(true);
    const fetched = await fetchDemoSnapshot();
    if (!fetched.ok) {
      setDemoLoading(false);
      setDemoError(fetched.error);
      return;
    }
    const patch = prepareSnapshotHydrate(fetched.snapshot, state);
    dispatch({ type: 'HYDRATE', state: patch });
    const merged = { ...state, ...patch } as typeof state;
    dispatch({ type: 'RUN_START' });
    const r = buildAndRunSimulation(merged);
    dispatch({ type: 'RUN_COMPLETE', result: r });
    setDemoLoading(false);
  };

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: 'var(--bg)' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '28px 24px 48px' }}>
        {!result ? (
          <EmptyState
            hasBom={hasBom}
            onRun={runNow}
            onDemo={loadDemoAndRun}
            onBuildOwn={() =>
              dispatch({
                type: 'UI_SET',
                ui: { appMode: 'advanced', activeSidebarTab: 'quickstart', sidebarCollapsed: false },
              })
            }
            isRunning={state.isRunning || demoLoading}
            error={demoError}
          />
        ) : (
          <Results
            onRun={runNow}
            isStale={state.isStale}
            isRunning={state.isRunning}
            onSwitchAdvanced={() =>
              dispatch({ type: 'UI_SET', ui: { appMode: 'advanced' } })
            }
          />
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Empty state — no result yet. One click to a result.
// ──────────────────────────────────────────────────────────────────────────
function EmptyState({
  hasBom,
  onRun,
  onDemo,
  onBuildOwn,
  isRunning,
  error,
}: {
  hasBom: boolean;
  onRun: () => void;
  onDemo: () => void;
  onBuildOwn: () => void;
  isRunning: boolean;
  error?: string | null;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 18,
        paddingTop: 56,
        maxWidth: 600,
        margin: '0 auto',
      }}
    >
      <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
        Five answers about your fleet
      </div>
      <div style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6, textAlign: 'left' }}>
        Will the deployment fit on current capacity? Where is it blocked, and why?
        How much more could you sell? Does new hardware make sense — and when does
        it pay off? Run a simulation and get each one answered in a sentence.
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        {hasBom && (
          <button onClick={onRun} disabled={isRunning} className="btn-primary" style={{ padding: '10px 22px', fontSize: 14 }}>
            {isRunning ? 'Simulating…' : '▶  Run simulation'}
          </button>
        )}
        <button onClick={onDemo} disabled={isRunning} className={hasBom ? 'btn-ghost' : 'btn-primary'} style={{ padding: '10px 22px', fontSize: 14 }}>
          {isRunning ? 'Loading…' : '▶  Load a demo & run'}
        </button>
        <button
          onClick={onBuildOwn}
          disabled={isRunning}
          className="btn-ghost"
          style={{ padding: '10px 22px', fontSize: 14 }}
          title="Open the guided Quick start: pick a server, where it goes, and your demand — routing and zones are authored for you."
        >
          ⚡ Build your own
        </button>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
        Demo: {DEMO_SUMMARY}.
      </div>
      {error && (
        <div style={{ fontSize: 12, color: 'var(--status-bad)', marginTop: 4 }}>
          {error}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Results — the five answers.
// ──────────────────────────────────────────────────────────────────────────
function Results({
  onRun,
  isStale,
  isRunning,
  onSwitchAdvanced,
}: {
  onRun: () => void;
  isStale: boolean;
  isRunning: boolean;
  onSwitchAdvanced: () => void;
}) {
  const { state } = useApp();
  const result = state.result!;
  const rateType = state.ui.rateType;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Fleet answers
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            The five questions a capacity plan turns on. Rates at {rateType.toUpperCase()}.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {isStale && (
            <button
              onClick={onRun}
              disabled={isRunning}
              className="btn-primary"
              style={{ padding: '7px 14px', fontSize: 13 }}
              title="Inputs changed since the last run — refresh the answers"
            >
              {isRunning ? 'Simulating…' : '↻ Re-run'}
            </button>
          )}
          <button
            onClick={onSwitchAdvanced}
            className="btn-ghost"
            style={{ padding: '7px 14px', fontSize: 13 }}
            title="Open the full Configure → Visualize → Insights workspace"
          >
            Open Advanced view  →
          </button>
        </div>
      </div>

      {isStale && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--status-warn)',
            border: '1px solid var(--status-warn)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            background: 'var(--tint-soft-2)',
          }}
        >
          Inputs changed since this run — the answers below may be out of date.
          Hit ↻ Re-run to refresh.
        </div>
      )}

      {/* S28 — "This is yours?" prompt. Soft, only while the demo fleet is
          loaded; disappears the moment the user's own data replaces it. */}
      {isDemoFleet(state) && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            background: 'var(--surface)',
          }}
        >
          These answers describe the <strong style={{ color: 'var(--text-primary)' }}>demo fleet</strong>.
          To answer them for yours: import a snapshot via <strong style={{ color: 'var(--text-primary)' }}>Save / Load</strong> in
          the header, or use <strong style={{ color: 'var(--text-primary)' }}>⚡ Quick start</strong> in the Advanced view
          (server + zones + demand in one form).
        </div>
      )}

      <AnswersPanel state={state} result={result} rateType={rateType} />
    </div>
  );
}
