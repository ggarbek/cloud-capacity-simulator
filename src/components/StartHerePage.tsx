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
import {
  PROJECT_STATUS,
  START_HERE,
  TOOL_SPLIT,
  type StartHereBullet,
  type StartHereContent,
  type StartHereLink,
} from '../data/help';

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

/**
 * The depth link a bullet can carry. Inline with the prose rather than on its
 * own row, so a bullet the reader is happy with reads as one sentence and the
 * link is only noticed by someone who wanted more.
 */
function LearnMore({ link, onOpen }: { link: StartHereLink; onOpen: (target: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(link.target)}
      style={{
        display: 'inline',
        marginLeft: 6,
        padding: 0,
        border: 'none',
        background: 'transparent',
        color: 'var(--interactive)',
        font: 'inherit',
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {link.label} →
    </button>
  );
}

/**
 * The house bullet: a bold topic phrase carrying the takeaway, then the
 * explanation. Reading only the bold leads should still give the argument.
 */
function BulletText({ item, onOpen }: { item: StartHereBullet; onOpen: (target: string) => void }) {
  return (
    <span>
      <strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.lead}</strong>{' '}
      {item.body}
      {item.learnMore && <LearnMore link={item.learnMore} onOpen={onOpen} />}
    </span>
  );
}

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
  onOpenFaq,
}: {
  kind: 'simulator' | 'cma';
  /** CMA only — CompetitivePage owns its tab in local state, so it hands down
   *  the navigation rather than this page reaching for a global. */
  onGoDemo?: () => void;
  onGoBuild?: () => void;
  /** CMA only — opens the FAQ & Glossary at a section id, same helper the
   *  public-data pill uses. Simulator depth links go through the reducer
   *  instead, so this stays optional. */
  onOpenFaq?: (section: string) => void;
}) {
  const { dispatch } = useApp();
  const c: StartHereContent = START_HERE[kind];
  const sim = useSeeItWork();

  /**
   * Where a bullet's depth link lands. The two halves keep their depth in
   * different places: the simulator's Glossary is a sidebar tab reached through
   * the reducer (the same dispatch `SetupIntro` uses), while the CMA FAQ is a
   * local tab on CompetitivePage, so that one is handed down as a prop.
   */
  const openDepth = (target: string) => {
    if (kind === 'simulator') {
      dispatch({
        type: 'UI_SET',
        ui: { activeSidebarTab: 'glossary', workspaceView: 'setup', helpConcept: target },
      });
      return;
    }
    onOpenFaq?.(target);
  };

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

        {/* Project status. One line: unmissable but not a wall. The full
            statement of what this is and is not lives in the FAQ; repeating it
            here cost a third of the first screen. */}
        <div
          className="flex items-baseline gap-2 flex-wrap"
          style={{
            marginTop: 12,
            padding: '7px 11px',
            border: '1px solid var(--status-warn)',
            borderRadius: 'var(--radius-md)',
            background: 'color-mix(in srgb, var(--status-warn) 7%, transparent)',
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--status-warn)',
              whiteSpace: 'nowrap',
            }}
          >
            Proof of concept
          </span>
          <span style={{ color: 'var(--text-secondary)' }}>{PROJECT_STATUS}</span>
        </div>

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

        {/* Answered where the decision is made. A reader weighing "Build your
            own" wants to know how their fleet gets in and where it goes before
            they click, not in a footnote below the page map. */}
        <div
          style={{
            marginTop: 14,
            fontSize: 12,
            color: 'var(--text-muted)',
            lineHeight: 1.55,
            maxWidth: 640,
          }}
        >
          {c.dataNote}
        </div>

        {/* Why a planner would care, before what the tool is. The ordering is
            deliberate: the problem earns the rest of the page. */}
        <SectionLabel>The problem it solves</SectionLabel>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {c.problem.map((d) => (
            <li
              key={d.lead}
              className="flex items-start gap-2.5"
              style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 9 }}
            >
              <span aria-hidden="true" style={{ color: 'var(--text-dim)', flexShrink: 0 }}>
                ●
              </span>
              <BulletText item={d} onOpen={openDepth} />
            </li>
          ))}
        </ul>

        {/* The five named answers. Scanning the leads alone should tell a
            reader whether this tool is for them. */}
        <SectionLabel>What it answers</SectionLabel>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {c.answers.map((d) => (
            <li
              key={d.lead}
              className="flex items-start gap-2.5"
              style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 9 }}
            >
              <span aria-hidden="true" style={{ color: 'var(--interactive)', flexShrink: 0 }}>
                ●
              </span>
              <BulletText item={d} onOpen={openDepth} />
            </li>
          ))}
        </ul>

        <div
          style={{
            marginTop: 4,
            fontSize: 12.5,
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            maxWidth: 720,
          }}
        >
          {c.answersFootnote}
        </div>

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

        {/* Restored after the section reorder. Assumptions sit AFTER the page
            map on purpose: a reader needs to know what the tool does and where
            to go before the caveats on its output mean anything. */}
        <SectionLabel>Assumptions this rests on</SectionLabel>
        <ol
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            counterReset: 'assumption',
          }}
        >
          {c.assumptions.map((a, i) => (
            <li
              key={a.lead}
              className="flex items-start gap-2.5"
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                marginBottom: 9,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--text-dim)',
                  fontVariantNumeric: 'tabular-nums',
                  minWidth: 16,
                  flexShrink: 0,
                  paddingTop: 2,
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <BulletText item={a} onOpen={openDepth} />
            </li>
          ))}
        </ol>

        {/* Which half am I in? The two halves answer adjacent questions and
            are easy to confuse, so both pages render the same contrast from
            one shared constant, with the current half marked. */}
        <SectionLabel>Which half you need</SectionLabel>
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            background: 'var(--surface)',
          }}
        >
          {(['simulator', 'cma'] as const).map((k, i) => {
            const here = k === kind;
            return (
              <div
                key={k}
                style={{
                  padding: '11px 14px',
                  borderTop: i === 0 ? 'none' : '1px solid var(--border-dark)',
                  borderLeft: here ? '2px solid var(--interactive)' : '2px solid transparent',
                  background: here ? 'color-mix(in srgb, var(--interactive) 6%, transparent)' : 'transparent',
                }}
              >
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: here ? 'var(--text-primary)' : 'var(--text-secondary)',
                    marginBottom: 3,
                  }}
                >
                  {TOOL_SPLIT[k].title}
                  {here && (
                    <span style={{ color: 'var(--interactive)', fontWeight: 600, marginLeft: 8 }}>
                      you are here
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  {TOOL_SPLIT[k].when}
                </div>
              </div>
            );
          })}
        </div>

        {/* The README's other design centre, condensed. Placed after the
            substance so it reads as a standard the tool holds itself to,
            rather than as a disclaimer up front. */}
        <SectionLabel>How it stays honest</SectionLabel>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {c.honesty.map((d) => (
            <li
              key={d.lead}
              className="flex items-start gap-2.5"
              style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 9 }}
            >
              <span aria-hidden="true" style={{ color: 'var(--text-dim)', flexShrink: 0 }}>
                ●
              </span>
              <BulletText item={d} onOpen={openDepth} />
            </li>
          ))}
        </ul>

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
