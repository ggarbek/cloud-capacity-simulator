/**
 * StartHerePage — the front door for each half of the suite (S68).
 *
 * A first-time visitor used to land on an authoring form with no explanation.
 * This is what they land on instead: what question this half answers, what it
 * does, what every page in the rail is for, and one button that loads a worked
 * example and jumps straight to a populated result.
 *
 * Altitude is the public README's, deliberately shallow — the depth lives in
 * the Glossary (simulator) and the FAQ (Cloud Market Analytics). Copy is
 * authored in `src/data/help.ts`, never inline here.
 *
 * Consumes the S66 `compare/ui` primitives rather than restyling them, per
 * docs/S66_CONTRACT.md. This is a new tab, not a new section on a frozen page,
 * so it sits outside that contract's page grammar.
 */
import { useEffect, useRef, useState } from 'react';
import { useApp } from '../state/AppContext';
import { useRunSimulation } from '../utils/useRunSimulation';
import { fetchDemoSnapshot, prepareSnapshotHydrate } from '../utils/demoSnapshot';
import { VerdictBand } from './compare/ui/VerdictBand';
import { START_HERE, type StartHereContent } from '../data/help';

/**
 * One click → a populated result.
 *
 * The demo snapshot hydrates with `result: null` by design (saveLoad omits
 * results so a restored fleet can't show numbers its inputs didn't produce),
 * so loading it is only half the job — the run has to follow. `run()` closes
 * over `state`, so it cannot be called in the same tick as the HYDRATE; this
 * waits for the hydrated BoM to make `canRun` true, then fires exactly once.
 * The reducer's RUN_COMPLETE owns the landing (Results overview), so this
 * never navigates by hand.
 */
function useSeeItWork(): { go: () => Promise<void>; busy: boolean; error: string | null } {
  const { state, dispatch } = useApp();
  const { run, canRun } = useRunSimulation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const armed = useRef(false);

  useEffect(() => {
    if (!armed.current || !canRun) return;
    armed.current = false;
    void run().finally(() => setBusy(false));
  }, [canRun, run]);

  const go = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const fetched = await fetchDemoSnapshot();
    if (!fetched.ok) {
      setError(fetched.error);
      setBusy(false);
      return;
    }
    armed.current = true;
    dispatch({ type: 'HYDRATE', state: prepareSnapshotHydrate(fetched.snapshot, state) });
  };

  return { go, busy, error };
}

/** The proven walkthrough baseline — the SKU the CMA pages were verified on. */
const CMA_DEMO_SKU = 'Standard_E8s_v5';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--text-dim)',
        margin: '26px 0 10px',
      }}
    >
      {children}
    </div>
  );
}

export function StartHerePage({
  kind,
  onGoDemo,
  onGoBuild,
}: {
  kind: 'simulator' | 'cma';
  /** CMA only — CompetitivePage owns its tab in local state, so it hands down
   *  the navigation rather than this page reaching for a global. */
  onGoDemo?: () => void;
  onGoBuild?: () => void;
}) {
  const { dispatch } = useApp();
  const c: StartHereContent = START_HERE[kind];
  const sim = useSeeItWork();

  const onSeeItWork = () => {
    if (kind === 'simulator') {
      void sim.go();
      return;
    }
    // CMA needs no snapshot fetch — the public catalog is seeded at boot, so a
    // baseline pick is the whole setup. Executive Summary reads it directly.
    dispatch({ type: 'UI_SET', ui: { competitiveBaseline: CMA_DEMO_SKU } });
    onGoDemo?.();
  };

  const onBuildYourOwn = () => {
    if (kind === 'simulator') {
      dispatch({ type: 'UI_SET', ui: { activeSidebarTab: 'quickstart', workspaceView: 'setup' } });
      return;
    }
    onGoBuild?.();
  };

  return (
    <div className="flex-1 overflow-y-auto" style={{ minHeight: 0, background: 'var(--bg)' }}>
      <div style={{ maxWidth: 940, margin: '0 auto', padding: '22px 24px 64px' }}>
        <VerdictBand
          tone="action"
          // The CMA shell already renders a "Start Here" page header above
          // this; the simulator surface has no such header, so only it needs
          // the eyebrow.
          eyebrow={kind === 'simulator' ? 'Start here' : undefined}
          headline={c.question}
          support={c.lede}
        />

        {/* The one action that matters. Kept immediately under the band so it
            is reachable without scrolling on a laptop viewport. */}
        <div className="flex items-center gap-3 flex-wrap" style={{ marginTop: 16 }}>
          <button
            type="button"
            onClick={onSeeItWork}
            disabled={sim.busy}
            className="btn-primary"
            style={{
              padding: '9px 18px',
              fontSize: 13.5,
              fontWeight: 600,
              cursor: sim.busy ? 'wait' : 'pointer',
              opacity: sim.busy ? 0.7 : 1,
            }}
            title={c.demoSub}
          >
            {sim.busy ? 'Loading the example…' : `▶ ${c.demoCta}`}
          </button>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 380, lineHeight: 1.45 }}>
            {c.demoSub}
          </span>
        </div>
        {sim.error && (
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--status-warn)' }}>
            {sim.error}
          </div>
        )}
        <div style={{ marginTop: 10 }}>
          <button
            type="button"
            onClick={onBuildYourOwn}
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: 'var(--interactive)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            title={c.buildSub}
          >
            {c.buildCta} →
          </button>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
            {c.buildSub}
          </span>
        </div>

        <SectionLabel>What it does</SectionLabel>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {c.does.map((d) => (
            <li
              key={d}
              className="flex items-start gap-2.5"
              style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}
            >
              <span aria-hidden="true" style={{ color: 'var(--interactive)', flexShrink: 0 }}>
                ●
              </span>
              <span>{d}</span>
            </li>
          ))}
        </ul>

        <SectionLabel>What each page is for</SectionLabel>
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            background: 'var(--surface)',
          }}
        >
          {c.pages.map((p, i) => (
            <div
              key={p.label}
              className="flex items-baseline gap-3 flex-wrap"
              style={{
                padding: '9px 14px',
                borderTop: i === 0 ? 'none' : '1px solid var(--border-dark)',
              }}
            >
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  minWidth: 148,
                  flexShrink: 0,
                }}
              >
                {p.label}
              </span>
              <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', flex: 1, minWidth: 240, lineHeight: 1.5 }}>
                {p.answers}
              </span>
            </div>
          ))}
        </div>

        {/* Provenance. Stated as an asset, not a disclaimer — the numbers are
            auditable, which is the point. */}
        <div
          style={{
            marginTop: 22,
            fontSize: 12,
            color: 'var(--text-muted)',
            lineHeight: 1.6,
          }}
        >
          Every specification and price shipped with this tool comes from published vendor
          documentation and public list pricing, dated in-app so you can check it. Your own
          hardware, VM sizes and bills of materials are uploaded, never bundled — nothing you
          load leaves your browser.
        </div>
      </div>
    </div>
  );
}
