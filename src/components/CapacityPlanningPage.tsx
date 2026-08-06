/**
 * Capacity Planning page — roadmap scaffold.
 *
 * The third top-level page in the suite. Long-horizon planning is not built
 * yet, so this page is an HONEST preview: it frames what's coming and lays out
 * the three planned capabilities, without faking live data or inventing
 * numbers. It mirrors the page-header + glass-card visual language of Region
 * Availability and Competitive so it reads as a real page rather than a
 * placeholder modal.
 *
 * Presentational only — no state, no engine calls.
 */

type Capability = {
  /** Short eyebrow / index for the card. */
  tag: string;
  title: string;
  /** Two-sentence descriptive copy: what it answers + how it'll work. */
  body: string;
  /** What it would draw on, once live. Framed as inputs, not promises. */
  inputs: string;
};

const CAPABILITIES: Capability[] = [
  {
    tag: '01',
    title: 'Demand forecasting',
    body:
      'Project where VM demand is heading per region, family, and size from the trend in your committed Bill of Materials. The goal is a defensible "how much will we need, and when" baseline that planners can adjust by hand rather than a black-box guess.',
    inputs: 'Draws on: committed BoM over time · per-family growth assumptions',
  },
  {
    tag: '02',
    title: 'Exhaustion projection',
    body:
      'Estimate when each cluster runs out of sellable headroom under the forecast — the date capacity is consumed, not just the snapshot of what fits today. Surfaces the clusters that hit the wall first so procurement leads, not lags, the shortfall.',
    inputs: 'Draws on: current placement + headroom · forecasted demand curve',
  },
  {
    tag: '03',
    title: 'Headroom-versus-growth analysis',
    body:
      'Compare remaining headroom against the projected growth rate to show whether the fleet is over- or under-provisioned across the planning horizon. Turns the single "what else fits" number into a trajectory you can plan a hardware buy against.',
    inputs: 'Draws on: sellable headroom · forecast growth · usable hardware life',
  },
];

export function CapacityPlanningPage() {
  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="section-h">Capacity Planning</h1>
          <span
            className="text-[9px] tracking-[0.08em] font-semibold uppercase"
            style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
            }}
          >
            Preview · roadmap
          </span>
        </div>
        <p className="text-[11px] text-text-secondary mt-1 leading-snug max-w-3xl">
          Long-horizon planning — looking past the current run to where capacity is
          heading. This page is a preview of what's coming; the three capabilities below
          aren't live yet, so nothing here projects real numbers. Today, use{' '}
          <strong>Run Results</strong> for the current fit and{' '}
          <strong>Scenario analysis</strong> for "what else fits."
        </p>
      </div>

      <section className="space-y-3">
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}
        >
          {CAPABILITIES.map((c) => (
            <div
              key={c.tag}
              className="glass"
              style={{ padding: 18, borderRadius: 'var(--radius-lg)' }}
            >
              <div
                className="text-[10px] tracking-[0.08em] font-semibold mb-2"
                style={{ color: 'var(--interactive)' }}
              >
                {c.tag}
              </div>
              <h2
                className="text-text-primary font-bold mb-2"
                style={{ fontSize: 15, letterSpacing: '-0.01em' }}
              >
                {c.title}
              </h2>
              <p className="text-[12px] text-text-secondary leading-relaxed">{c.body}</p>
              <div
                className="text-[10px] text-text-muted mt-3 pt-3 leading-snug"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                {c.inputs}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        className="glass"
        style={{ padding: 16, borderRadius: 'var(--radius-md)' }}
      >
        <div
          className="text-[10px] tracking-[0.04em] font-semibold mb-1.5"
          style={{ color: 'var(--text-muted)' }}
        >
          Where this fits
        </div>
        <p className="text-[11px] text-text-secondary leading-relaxed max-w-3xl">
          Capacity Planning builds on the simulator's existing outputs — placement,
          sellable headroom, and the committed Bill of Materials — and projects them
          forward. It won't introduce new proprietary data; the forecasts will be derived
          from what you've already configured, with assumptions you can adjust.
        </p>
      </section>
    </div>
  );
}
