/**
 * AnswersPanel — the answers result surface (v3 · executive document layout).
 *
 * The product's front door after a run, organized like an executive brief:
 *
 *   1. Key Points     — an executive summary, then the per-question verdicts.
 *   2. Deployment Results — did it fit, what's blocked, where it spilled over.
 *   3. Financials     — profitability, then the sellable headroom.
 *
 * Each section opens with a clean header + a one-line summary. The verdict
 * bullets jump to their detail. The "investment" verdict is profitability on
 * the CURRENT fleet (not a hypothetical purchase).
 *
 * Shared by the Simple track (real state) and the Simple Calculator (sandbox
 * state) so both speak identical sentences. All numbers come from the
 * canonical engine + the same pure helpers Advanced uses — never forked.
 */
import { useMemo } from 'react';
import type { AppState, ScopeSelection } from '../state/AppState';
import type { SimulatorResult } from '../types';
import type { RateType } from '../engine/insights';
import { useApp } from '../state/AppContext';
import {
  computeAnswers,
  executiveSummary,
  deploymentSummary,
  financialsSummary,
  type AnswerRow,
  type AnswerTone,
  type BlockerGroup,
} from '../utils/answers';
import { computeMetricFamilies } from '../utils/metricFamilies';
import { formatUsd, formatPct, paybackView } from '../utils/financial';
import { MetricCard } from './MetricCard';

const toneVar: Record<AnswerTone, string> = {
  good: 'var(--status-good)',
  warn: 'var(--status-warn)',
  bad: 'var(--status-bad)',
  neutral: 'var(--interactive)',
};

const verdictGlyph: Record<AnswerRow['verdict'], string> = {
  yes: '✓',
  mostly: '◑',
  no: '✕',
  attention: '!',
  info: '→',
  na: '—',
};

export interface AnswersPanelProps {
  state: AppState;
  result: SimulatorResult;
  rateType: RateType;
  /** "Where" scope — null/fleet = fleet-wide. Scopes placement, financials,
   *  and headroom to a region / zone / cluster. Blockers stay fleet-wide. */
  scope?: ScopeSelection | null;
}

export function AnswersPanel({ state, result, rateType, scope = null }: AnswersPanelProps) {
  const { dispatch } = useApp();
  // ── The answers ─────────────────────────────────────────────────────────
  const answers = useMemo(
    () => computeAnswers(state, result, rateType, scope),
    [state, result, rateType, scope],
  );
  const families = useMemo(
    () => computeMetricFamilies(state, result, rateType, scope),
    [state, result, rateType, scope],
  );

  // Verdict bullets, executive-ordered: investment, then fit, then blockers,
  // then upside. Each jumps to its detail in the sections below.
  const strip: { row: AnswerRow; anchor: string }[] = [
    { row: answers.profitability, anchor: 'ans-invest' },
    { row: answers.supportable, anchor: 'deploy' },
    { row: answers.blockers, anchor: 'ans-blockers' },
    { row: answers.sellable, anchor: 'ans-sellable' },
  ];

  const jump = (anchor: string) =>
    document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // "What sells the gap fastest" is a MENU of independent options, biggest
  // first. Each row is the most of THAT one size you could add on its own;
  // the rows share nodes, so they're alternatives, not a sum.
  const fillShown = answers.sellable.topFill.slice(0, 5);
  const fillRest = answers.sellable.topFill.slice(5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
      {/* ══ 1 · Key Points — executive summary, then the verdict bullets ══ */}
      <Section id="ans-keypoints" title="Key Points" summary={executiveSummary(answers)}>
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '6px 0',
          }}
        >
          {strip.map(({ row, anchor }, i) => (
            <button
              key={row.id}
              onClick={() => jump(anchor)}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 14,
                width: '100%',
                textAlign: 'left',
                padding: '12px 18px',
                background: 'transparent',
                border: 'none',
                borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer',
              }}
              title="Jump to the detail"
            >
              <span
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  color: toneVar[row.tone],
                  background: 'var(--tint-soft-2)',
                  border: `1px solid ${toneVar[row.tone]}`,
                  alignSelf: 'center',
                }}
              >
                {verdictGlyph[row.verdict]}
              </span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)' }}>
                  {row.question}
                </span>
                <span
                  style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 600,
                    lineHeight: 1.4,
                    color: 'var(--text-primary)',
                    marginTop: 1,
                  }}
                >
                  {row.headline}
                </span>
              </span>
            </button>
          ))}
        </div>
      </Section>

      {/* ══ 2 · Deployment Results — fit, blockers, spillover ══ */}
      <Section
        id="deploy"
        title="Deployment Results"
        summary={deploymentSummary(answers)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={twoCol}>
            <MetricCard {...families.placement} />
            <MetricCard {...families.utilization} />
          </div>

          {/* Per-zone breakdown — deployments are usually zonal; show where the
              capacity actually lives instead of one flat pool. */}
          {answers.supportable.zones.length > 1 && (
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                By availability zone
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                Placement and memory pressure per zone — the zone that fills first
                decides whether a zonal deployment fits.
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 10,
                }}
              >
                {answers.supportable.zones.map((z) => {
                  const tone =
                    z.memPct >= 95 ? 'var(--status-warn)' : z.memPct >= 85 ? 'var(--status-good)' : 'var(--interactive)';
                  return (
                    <div
                      key={z.zone || '(unzoned)'}
                      style={{
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 12px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {z.zone || 'No zone'}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: tone, fontVariantNumeric: 'tabular-nums' }}>
                          {z.memPct.toFixed(0)}% mem
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {z.placedVms.toLocaleString()} VMs · {z.clusterCount} cluster{z.clusterCount === 1 ? '' : 's'}
                      </div>
                      <div
                        style={{
                          position: 'relative',
                          height: 5,
                          marginTop: 8,
                          borderRadius: 'var(--radius-pill)',
                          background: 'var(--tint-soft-2)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            transformOrigin: 'left',
                            transform: `scaleX(${Math.min(100, z.memPct) / 100})`,
                            background: tone,
                            opacity: 0.85,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Blockers — what couldn't be placed and why. Always fleet-wide
              (unplaceable VMs aren't attributable to a scope). */}
          <div id="ans-blockers" style={{ scrollMarginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {answers.blockers.fleetWide && answers.blockers.groups.length > 0 && (
              <div style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' }}>
                Blockers are shown fleet-wide — unplaceable VMs aren't tied to one region, zone, or cluster.
              </div>
            )}
            {answers.blockers.groups.length === 0 ? (
              <EmptyNote text="Nothing is blocked — every requested VM found a home." good />
            ) : (
              answers.blockers.groups.map((g) => <BlockerCard key={g.reason} group={g} />)
            )}
          </div>

          {/* Spillover — only when it occurs. Home hardware saturating and
              routing demand to higher tiers is the fleet working as designed,
              but a sign the home tier is at capacity. */}
          {answers.supportable.spilloverTotal > 0 && (
            <div style={{ ...card, borderLeft: '3px solid var(--status-good)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                ↻ Spillover · {answers.supportable.spilloverTotal.toLocaleString()} VMs routed off home
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Home hardware filled, so the engine routed these to the next
                fungibility tier — automatic and expected, but a sign the home
                tier is at capacity.
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                {answers.supportable.spillover.map((r) => (
                  <span
                    key={`${r.fromGroup}→${r.toGroup}`}
                    style={{
                      fontSize: 11,
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-pill)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      background: 'var(--tint-soft-2)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {r.fromGroup} → {r.toGroup} · {r.count.toLocaleString()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* ══ 3 · Financials — profitability, then the sellable headroom ══ */}
      <Section
        id="financials"
        title="Financials"
        summary={financialsSummary(answers)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Profitability */}
          <div id="ans-invest" style={{ ...twoCol, scrollMarginTop: 16 }}>
            <MetricCard {...families.profitability} />
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                Fleet financials
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                What the running demand earns vs what the hardware costs.
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '12px 16px',
                }}
              >
                <Figure label="Revenue / mo" value={formatUsd(answers.profitability.monthlyRevenue)} />
                {(() => {
                  const { monthlyCogs, monthlyDepreciation, monthlyOpex } = answers.profitability;
                  // When opex is authored, break the monthly cost into its
                  // depreciation + opex parts so the user sees why it moved.
                  const split =
                    monthlyOpex != null && monthlyOpex > 0
                      ? `${formatUsd(monthlyDepreciation)} deprec + ${formatUsd(monthlyOpex)} opex`
                      : undefined;
                  return (
                    <Figure
                      label="COGS / mo"
                      value={monthlyCogs != null ? formatUsd(monthlyCogs) : '—'}
                      sub={split}
                      title={
                        split
                          ? 'COGS = straight-line depreciation of capex + recurring operating cost (opex).'
                          : undefined
                      }
                    />
                  );
                })()}
                <Figure
                  label="Gross margin"
                  value={answers.profitability.marginPct != null ? formatPct(answers.profitability.marginPct) : '—'}
                />
                {/* Additional revenue to clear each margin marker — fixed cost,
                    so revenue must rise to it. "Met" once already past it. */}
                {(() => {
                  const g = answers.profitability.breakEvenRevenueGap;
                  const value = g == null ? '—' : g <= 0 ? 'Met' : `+${formatUsd(g)}/mo`;
                  return (
                    <Figure
                      label="Rev. to break even"
                      value={value}
                      title="Additional monthly revenue needed to reach 0% gross margin (revenue = cost)."
                    />
                  );
                })()}
                {(() => {
                  const g = answers.profitability.healthyRevenueGap;
                  const target = answers.profitability.healthyTargetPct;
                  const value = g == null ? '—' : g <= 0 ? 'Met' : `+${formatUsd(g)}/mo`;
                  return (
                    <div
                      style={{ display: 'flex', flexDirection: 'column' }}
                      title={`Additional monthly revenue needed to reach your ${target}% gross-margin target.`}
                    >
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Rev. to healthy</span>
                      <span
                        style={{
                          fontSize: 14,
                          color: 'var(--text-primary)',
                          fontVariantNumeric: 'tabular-nums',
                          cursor: 'help',
                        }}
                      >
                        {value}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <input
                          type="number"
                          min={0}
                          max={99}
                          value={target}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === '') return;
                            const n = Math.max(0, Math.min(99, Math.round(Number(v))));
                            if (Number.isFinite(n)) dispatch({ type: 'UI_SET', ui: { marginTargetPct: n } });
                          }}
                          aria-label="Margin target percent"
                          style={{
                            width: 42,
                            fontSize: 10,
                            padding: '1px 4px',
                            borderRadius: 'var(--radius-sm, 6px)',
                            border: '1px solid var(--border)',
                            background: 'var(--surface)',
                            color: 'var(--text-dim)',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        />
                        <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>% margin target</span>
                      </span>
                    </div>
                  );
                })()}
                {(() => {
                  const pv = paybackView({
                    paybackMonths: answers.profitability.paybackMonths,
                    monthlyRevenue: answers.profitability.monthlyRevenue,
                    monthlyDepreciation: answers.profitability.monthlyDepreciation,
                    monthlyOpex: answers.profitability.monthlyOpex,
                    totalCapex: answers.profitability.totalCapex,
                  });
                  return <Figure label="Payback" value={pv.value} sub={pv.note} title={pv.title} />;
                })()}
                <Figure
                  label="Total capex"
                  value={answers.profitability.totalCapex != null ? formatUsd(answers.profitability.totalCapex) : '—'}
                />
              </div>
            </div>
          </div>

          {/* Sellable headroom */}
          <div id="ans-sellable" style={{ ...twoCol, scrollMarginTop: 16 }}>
            <MetricCard {...families.headroom} />
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                What sells the gap fastest
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                Each size on its own — the most you could add if you sold only that
                one. They share nodes, so you'd pick one, not all; the biggest is
                your headroom on the left.
              </div>
              {fillShown.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  No priced sizes fit the remaining space.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <tbody>
                    {fillShown.map((r) => (
                      <tr key={r.vmSizeName} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '6px 0', color: 'var(--text-primary)' }}>
                          {r.vmSizeName.replace(/^Standard_/, '')}
                        </td>
                        <td style={{ padding: '6px 0', textAlign: 'right', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                          × {r.count.toLocaleString()}
                        </td>
                        <td style={{ padding: '6px 0', textAlign: 'right', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                          {formatUsd(r.monthlyRevenue)}/mo
                        </td>
                      </tr>
                    ))}
                    {fillRest.length > 0 && (
                      <tr style={{ borderTop: '1px solid var(--border)' }}>
                        <td colSpan={3} style={{ padding: '6px 0', color: 'var(--text-muted)' }}>
                          + {fillRest.length} more size{fillRest.length === 1 ? '' : 's'} (smaller
                          single-size fills)
                        </td>
                      </tr>
                    )}
                    <tr style={{ borderTop: '1px solid var(--border-strong, var(--border))' }}>
                      <td style={{ padding: '6px 0', color: 'var(--text-primary)', fontWeight: 600 }}>
                        Headroom (best option)
                      </td>
                      <td />
                      <td style={{ padding: '6px 0', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                        {formatUsd(answers.sellable.headroomMonthly)}/mo
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

// ── Small shared pieces ───────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  padding: '16px 18px',
};

const twoCol: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))',
  gap: 16,
};

/** An executive-document section: a clean header with a hairline rule, a
 *  one-line summary, then the content. */
function Section({
  id,
  title,
  summary,
  children,
}: {
  id: string;
  title: string;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} style={{ scrollMarginTop: 16 }}>
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 9, marginBottom: 14 }}>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: '-0.015em',
            color: 'var(--text-primary)',
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {title}
        </h2>
        {summary && (
          <p
            style={{
              fontSize: 12.5,
              color: 'var(--text-secondary)',
              marginTop: 5,
              marginBottom: 0,
              lineHeight: 1.55,
              maxWidth: '74ch',
            }}
          >
            {summary}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function EmptyNote({ text, good }: { text: string; good?: boolean }) {
  return (
    <div
      style={{
        ...card,
        fontSize: 13,
        color: good ? 'var(--status-good)' : 'var(--text-muted)',
      }}
    >
      {text}
    </div>
  );
}

function Figure({
  label,
  value,
  sub,
  title,
}: {
  label: string;
  value: string;
  sub?: string;
  title?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }} title={title}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
      <span
        style={{
          fontSize: 14,
          color: 'var(--text-primary)',
          fontVariantNumeric: 'tabular-nums',
          cursor: title ? 'help' : undefined,
        }}
      >
        {value}
      </span>
      {sub && (
        <span style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 1, lineHeight: 1.3 }}>{sub}</span>
      )}
    </div>
  );
}

/** Severity-accented card for one blocking-reason group: what it means in
 *  plain English, which sizes it hits, and what to do about it. */
function BlockerCard({ group }: { group: BlockerGroup }) {
  const sev = group.meta.severity;
  const accent =
    sev === 'user' ? 'var(--status-warn)' : sev === 'structural' ? 'var(--status-bad)' : 'var(--interactive)';
  const sevLabel =
    sev === 'user' ? 'You can fix this in the app' : sev === 'structural' ? 'Setup issue' : 'Needs hardware';
  const skus = group.skus.slice(0, 6);
  const more = group.skus.length - skus.length;
  const firstDetail = group.skus.find((s) => s.details)?.details;
  return (
    <div style={{ ...card, borderLeft: `3px solid ${accent}` }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          {group.meta.label}
        </div>
        <div style={{ fontSize: 12, color: accent, fontWeight: 600, whiteSpace: 'nowrap' }}>
          {group.count.toLocaleString()} VM{group.count === 1 ? '' : 's'} · {sevLabel}
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 4 }}>
        {group.meta.description}
      </div>
      {firstDetail && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
          e.g. {firstDetail}
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        {skus.map((s) => (
          <span
            key={s.vmSizeName}
            style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              background: 'var(--tint-soft-2)',
            }}
          >
            {s.vmSizeName.replace(/^Standard_/, '')} × {s.count.toLocaleString()}
          </span>
        ))}
        {more > 0 && (
          <span style={{ fontSize: 11, color: 'var(--text-dim)', alignSelf: 'center' }}>
            +{more} more
          </span>
        )}
      </div>
    </div>
  );
}
