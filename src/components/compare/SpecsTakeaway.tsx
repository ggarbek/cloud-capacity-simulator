// ────────────────────────────────────────────────────────────────────────
// SpecsTakeaway — executive "Key takeaway" box for the cross-cloud
// Compare → Specs page.
//
// Leads with the verdict (internal Diet/fitness-insight-card style: most important
// point first, plain language, scannable), then unpacks the per-VM (sizes mode)
// or per-product (products mode) detail. Pure derived render — it consumes the
// already-built + tested `specInsights` engine and adds no new data.
// ────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import type { CatalogEntry } from '../../types';
import {
  compareSpecs,
  compareProducts,
  unverifiedClaims,
  type VmSpecInsight,
  type ProductInsight,
  type UnverifiedClaim,
} from '../../utils/specInsights';
import { isStretch, type MatchCaveat } from '../../utils/matchCaveats';
import { Disclosure } from '../Disclosure';
import { canonicalProvider } from './specShowdownMath'; // S66-SPECS
import { providerTone } from './ui/tokens'; // S66-SPECS

// S66-SPECS — provider tint comes from the ONE shared source (ui/tokens); the
// private PROVIDER_FG/PROVIDER_LABEL copies are deleted. Non-provider names
// (products mode passes family names through here) keep the neutral fallback.
const KNOWN_PROVIDERS = new Set(['Azure', 'AWS', 'GCP']);

/** Case-insensitive provider → tint. Falls back to neutral primary text. */
function providerFg(provider: string | undefined): string {
  const p = canonicalProvider(provider);
  return KNOWN_PROVIDERS.has(p) ? providerTone(p).fg : 'var(--text-primary)';
}

/** Case-insensitive provider → display label (Azure / AWS / GCP). */
function providerLabel(provider: string | undefined): string {
  return canonicalProvider(provider);
}

// ── Props ──────────────────────────────────────────────────────────────────

export interface SpecsTakeawayProps {
  mode: 'sizes' | 'products';
  /** sizes mode — the UNIQUE selected VMs across clouds (already resolved). */
  vms?: CatalogEntry[];
  /** products mode — one entry per picked family/category, with its member VMs. */
  groups?: { kind: 'family' | 'category'; name: string; vms: CatalogEntry[] }[];
  /**
   * Render shape. `'stack'` (default) keeps the original vertical card list used
   * on the Executive Summary. `'columns'` is the educational Specs layout: one
   * box, the exec summary spanning the top, then a per-cloud column for each
   * pick side-by-side (Azure / AWS / GCP) so the offerings read as products.
   */
  layout?: 'stack' | 'columns';
  /** Section heading. Defaults to "Key takeaway" (stack) / "What you're comparing" (columns). */
  heading?: string;
  /**
   * Per-provider comparability caveats (A3) — the honest asterisks for each
   * cloud's pick vs the base (from the equivalents match). Drives the
   * "Comparison caveats" note above the unverified-claims note, and the amber
   * "closest alternative" sub-caption under a stretch/category-fallback column.
   * Keyed by the SAME provider tokens SpecsTakeaway uses (Azure/AWS/GCP, any case).
   */
  caveatsByProvider?: Partial<Record<string, MatchCaveat[]>>;
  /**
   * S65 — de-wall the educational content. In `columns` layout, `collapsed` folds
   * each per-cloud prose column behind a one-line disclosure ("About {family} on
   * {provider}") so the Specs page leads with the numeric hero, not walls of text.
   * Default `false` preserves the always-expanded columns for any other caller.
   * Ignored outside `columns` layout (the Exec Summary `stack` path is untouched).
   */
  collapsed?: boolean;
  /**
   * S65 — when the hero already shows the exec summary, hide the redundant
   * headline/keyTakeaway block inside this box. Default `false`.
   */
  hideExecSummary?: boolean;
  /** S65 — override the intro sentence above the collapsed disclosures. */
  collapsedIntro?: string;
}

// ── Shared pieces ────────────────────────────────────────────────────────────

function EmptyHint({ text }: { text: string }) {
  return (
    <div
      className="glass text-[11px] text-text-muted italic"
      style={{ padding: 16, borderRadius: 'var(--radius-md)' }}
    >
      {text}
    </div>
  );
}

function ExecSummary({ headline, keyTakeaway }: { headline: string; keyTakeaway: string }) {
  return (
    <div className="glass space-y-2" style={{ padding: 16, borderRadius: 'var(--radius-md)' }}>
      <div className="text-[13px] font-bold text-text-primary leading-snug">{headline}</div>
      {keyTakeaway && (
        <p className="text-[12px] text-text-secondary leading-relaxed">{keyTakeaway}</p>
      )}
    </div>
  );
}

function NuanceChip({ label, detail }: { label: string; detail: string }) {
  return (
    <span
      className="text-[10px] text-text-secondary"
      title={detail}
      style={{
        padding: '2px 8px',
        borderRadius: 'var(--radius-pill)',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid var(--border)',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

function VmCard({ insight }: { insight: VmSpecInsight }) {
  return (
    <div
      className="glass space-y-2"
      style={{ padding: 14, borderRadius: 'var(--radius-md)' }}
    >
      <div
        className="text-[12px] font-semibold"
        style={{ color: providerFg(insight.provider) }}
      >
        {insight.displayName}
      </div>
      {insight.nuances.length > 0 && (
        <div className="flex flex-wrap gap-x-2 gap-y-1.5">
          {insight.nuances.map((n, i) => (
            <NuanceChip key={`${n.kind}-${i}`} label={n.label} detail={n.detail} />
          ))}
        </div>
      )}
      <div className="text-[11px] text-text-muted italic">Best for: {insight.bestFor}</div>
    </div>
  );
}

function ProductCard({ product }: { product: ProductInsight }) {
  return (
    <div
      className="glass space-y-2"
      style={{ padding: 14, borderRadius: 'var(--radius-md)' }}
    >
      <div className="flex items-center gap-x-2 flex-wrap">
        <span
          className="text-[12px] font-semibold"
          style={{ color: providerFg(product.name) }}
        >
          {product.name}
        </span>
        <span
          className="text-[9px] tracking-[0.06em] font-semibold text-text-muted uppercase"
          style={{
            padding: '1px 6px',
            borderRadius: 'var(--radius-pill)',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border)',
          }}
        >
          {product.kind}
        </span>
      </div>
      <p className="text-[11px] text-text-secondary leading-relaxed">{product.whatItIs}</p>
      {product.keyPoints.length > 0 && (
        <ul className="space-y-1">
          {product.keyPoints.map((pt, i) => (
            <li key={i} className="text-[11px] text-text-muted leading-snug">
              <span className="text-text-secondary">•</span> {pt}
            </li>
          ))}
        </ul>
      )}
      <div className="text-[11px] text-text-muted italic">Best for: {product.bestFor}</div>
      {product.pickWhen && (
        <div
          className="text-[11px] leading-snug"
          style={{
            color: 'var(--text-secondary)',
            borderLeft: '2px solid var(--interactive)',
            paddingLeft: 8,
          }}
        >
          <span className="font-semibold" style={{ color: 'var(--interactive)' }}>
            When to pick:{' '}
          </span>
          {product.pickWhen}
        </div>
      )}
      <div className="flex items-center justify-between gap-x-2 flex-wrap">
        {product.analogs && (
          <span className="text-[10px] text-text-muted">{product.analogs}</span>
        )}
        {product.source && (
          <a
            href={product.source}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] underline underline-offset-2"
            style={{ color: 'var(--text-muted)' }}
            title="Vendor documentation"
          >
            Source ↗
          </a>
        )}
      </div>
    </div>
  );
}

// ── Columns layout (the educational Specs box) ───────────────────────────────

/** Provider eyebrow — a tinted dot + cloud name, the column's identity line.
 *  When the pick is a stretch/category-fallback (A3), an 11px amber sub-caption
 *  flags it as the closest alternative rather than a true equivalent. */
function ProviderHeader({
  provider,
  title,
  stretch = false,
}: {
  provider: string | undefined;
  title: string;
  stretch?: boolean;
}) {
  const fg = providerFg(provider);
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <span
          aria-hidden
          style={{ width: 7, height: 7, borderRadius: 999, background: fg, flexShrink: 0 }}
        />
        <span
          className="text-[10px] font-semibold uppercase"
          style={{ color: fg, letterSpacing: '0.06em' }}
        >
          {providerLabel(provider)}
        </span>
      </div>
      <div className="text-[13px] font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
        {title}
      </div>
      {stretch && (
        <div className="text-[11px] font-medium leading-snug" style={{ color: '#F59E0B' }}>
          ⚠ Closest alternative — not a true equivalent
        </div>
      )}
    </div>
  );
}

/** One cloud's VM (sizes mode), traits unpacked educationally (label + why).
 *  `hideHeader` drops the provider eyebrow when the wrapper (a disclosure) already
 *  names the cloud (S65 collapsed layout). */
function VmColumn({
  insight,
  stretch = false,
  hideHeader = false,
}: {
  insight: VmSpecInsight;
  stretch?: boolean;
  hideHeader?: boolean;
}) {
  return (
    <div className="space-y-2.5">
      {!hideHeader && (
        <ProviderHeader provider={insight.provider} title={insight.displayName} stretch={stretch} />
      )}
      {hideHeader && stretch && (
        <div className="text-[11px] font-medium leading-snug" style={{ color: '#F59E0B' }}>
          ⚠ Closest alternative — not a true equivalent
        </div>
      )}
      {insight.standout && (
        <div
          className="text-[11px] leading-snug"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '5px 9px',
          }}
        >
          <span className="font-semibold" style={{ color: 'var(--interactive)' }}>
            ★ Stands out:{' '}
          </span>
          <span style={{ color: 'var(--text-secondary)' }}>{insight.standout}</span>
        </div>
      )}
      {insight.weakness && (
        <div
          className="text-[11px] leading-snug"
          style={{
            background: 'rgba(251,191,36,0.07)',
            border: '1px solid rgba(251,191,36,0.32)',
            borderRadius: 'var(--radius-md)',
            padding: '5px 9px',
          }}
        >
          <span className="font-semibold" style={{ color: '#FBBF24' }}>
            ▼ Trails on:{' '}
          </span>
          <span style={{ color: 'var(--text-secondary)' }}>{insight.weakness}</span>
        </div>
      )}
      {insight.nuances.length > 0 ? (
        <div className="space-y-2">
          {insight.nuances.map((n, i) => (
            <div key={`${n.kind}-${i}`} className="space-y-0.5">
              <div className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                {n.label}
              </div>
              <p className="text-[11px] text-text-muted leading-snug">{n.detail}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-text-muted leading-snug">
          A balanced general-purpose size with no standout trait.
        </p>
      )}
      <div
        className="text-[11px] leading-snug"
        style={{ color: 'var(--text-secondary)', paddingTop: 2 }}
      >
        <span className="text-text-muted">Best for </span>
        {insight.bestFor.replace(/\.$/, '')}.
      </div>
    </div>
  );
}

/** One cloud's family/category (products mode) — what it is, key points, pick-rule. */
function ProductColumn({
  product,
  provider,
  stretch = false,
  hideHeader = false,
}: {
  product: ProductInsight;
  provider: string | undefined;
  stretch?: boolean;
  hideHeader?: boolean;
}) {
  return (
    <div className="space-y-2.5">
      {!hideHeader && <ProviderHeader provider={provider} title={product.name} stretch={stretch} />}
      {hideHeader && stretch && (
        <div className="text-[11px] font-medium leading-snug" style={{ color: '#F59E0B' }}>
          ⚠ Closest alternative — not a true equivalent
        </div>
      )}
      <p className="text-[11px] text-text-secondary leading-relaxed">{product.whatItIs}</p>
      {product.keyPoints.length > 0 && (
        <ul className="space-y-1">
          {product.keyPoints.map((pt, i) => (
            <li key={i} className="text-[11px] text-text-muted leading-snug flex gap-1.5">
              <span style={{ color: providerFg(provider) }}>•</span>
              <span>{pt}</span>
            </li>
          ))}
        </ul>
      )}
      {product.pickWhen && (
        <div className="text-[11px] leading-snug" style={{ color: 'var(--text-secondary)' }}>
          <span className="font-semibold" style={{ color: 'var(--interactive)' }}>
            When to pick:{' '}
          </span>
          {product.pickWhen}
        </div>
      )}
      <div className="text-[11px] leading-snug" style={{ color: 'var(--text-secondary)' }}>
        <span className="text-text-muted">Best for </span>
        {product.bestFor.replace(/\.$/, '')}.
      </div>
      {(product.analogs || product.source) && (
        <div className="flex items-center justify-between gap-x-2 flex-wrap" style={{ paddingTop: 2 }}>
          {product.analogs && <span className="text-[10px] text-text-muted">{product.analogs}</span>}
          {product.source && (
            <a
              href={product.source}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] underline underline-offset-2"
              style={{ color: 'var(--text-muted)' }}
              title="Vendor documentation"
            >
              Source ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * The one-box columns layout: exec summary across the top, a divider, then a
 * per-cloud column for each pick. Columns auto-fit (3 side-by-side when wide,
 * stacking on narrow) with no nested cards — the outer box is the only surface.
 */
function ColumnsBox({
  headline,
  keyTakeaway,
  columns,
}: {
  headline: string;
  keyTakeaway: string;
  columns: JSX.Element[];
}) {
  return (
    <div className="glass space-y-4" style={{ padding: 18, borderRadius: 'var(--radius-lg)' }}>
      <div className="space-y-1.5">
        <div className="text-[13px] font-bold text-text-primary leading-snug">{headline}</div>
        {keyTakeaway && (
          <p className="text-[12px] text-text-secondary leading-relaxed">{keyTakeaway}</p>
        )}
      </div>
      <div style={{ borderTop: '1px solid var(--border)' }} />
      <div
        style={{
          display: 'grid',
          gap: 18,
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          alignItems: 'start',
        }}
      >
        {columns}
      </div>
    </div>
  );
}

/**
 * S65 — the DE-WALLED columns box: exec summary (optional) across the top, then
 * one COLLAPSED disclosure per cloud ("About {family} on {provider}") whose body
 * is the same educational column. Keeps the depth for the curious without making
 * everyone scroll past three prose walls to reach the numbers (now in the hero).
 */
function CollapsedColumnsBox({
  headline,
  keyTakeaway,
  hideExecSummary,
  intro,
  items,
}: {
  headline: string;
  keyTakeaway: string;
  hideExecSummary: boolean;
  intro: string;
  items: { key: string; provider: string | undefined; title: string; body: JSX.Element }[];
}) {
  return (
    <div className="glass space-y-3" style={{ padding: 18, borderRadius: 'var(--radius-lg)' }}>
      {!hideExecSummary && (
        <>
          <div className="space-y-1.5">
            <div className="text-[13px] font-bold text-text-primary leading-snug">{headline}</div>
            {keyTakeaway && (
              <p className="text-[12px] text-text-secondary leading-relaxed">{keyTakeaway}</p>
            )}
          </div>
          <div style={{ borderTop: '1px solid var(--border)' }} />
        </>
      )}
      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
        {intro}
      </p>
      <div className="space-y-1.5">
        {items.map((it) => (
          <Disclosure
            key={it.key}
            title={it.title}
            subtitle={providerLabel(it.provider)}
          >
            <div style={{ paddingTop: 6 }}>{it.body}</div>
          </Disclosure>
        ))}
      </div>
    </div>
  );
}

// ── Unverified-claims caveat ─────────────────────────────────────────────────

/**
 * The honest disclosure: vendor performance/feature figures that failed our
 * independent check. A muted amber box (the app's established "warning" tone),
 * one claim per row, each attributed to its cloud and linked to where the vendor
 * states it. Renders nothing when no relevant claim exists.
 */
function UnverifiedClaimsNote({ claims }: { claims: UnverifiedClaim[] }) {
  if (claims.length === 0) return null;
  const amber = '#F59E0B';
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 'var(--radius-md)',
        background: 'rgba(245, 158, 11, 0.07)',
        border: '1px solid rgba(245, 158, 11, 0.28)',
      }}
      className="space-y-2.5"
    >
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <span
            aria-hidden
            style={{ width: 7, height: 7, borderRadius: 999, background: amber, flexShrink: 0 }}
          />
          <span
            className="text-[10px] font-semibold uppercase"
            style={{ color: amber, letterSpacing: '0.06em' }}
          >
            Vendor claims we couldn&rsquo;t independently verify
          </span>
        </div>
        <p className="text-[11px] text-text-muted leading-snug">
          These figures come from vendor marketing and didn&rsquo;t survive our independent check —
          treat them as directional, not guaranteed. Real-world deltas depend on your workload,
          region and pricing.
        </p>
      </div>
      <ul className="space-y-1.5">
        {claims.map((c) => (
          <li key={c.id} className="text-[11px] leading-snug flex gap-1.5">
            <span style={{ color: amber, flexShrink: 0 }}>•</span>
            <span className="text-text-secondary">
              {c.provider && (
                <span className="font-semibold" style={{ color: providerFg(c.provider) }}>
                  {providerLabel(c.provider)}:{' '}
                </span>
              )}
              {c.claim} <span className="text-text-muted">{c.why}</span>
              {c.source && (
                <>
                  {' '}
                  <a
                    href={c.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 whitespace-nowrap"
                    style={{ color: 'var(--text-muted)' }}
                    title="Where the vendor states this claim"
                  >
                    vendor claim ↗
                  </a>
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Comparison caveats note (A3) ─────────────────────────────────────────────

/** Case-insensitive lookup of a provider's caveats. */
function caveatsForProvider(
  map: Partial<Record<string, MatchCaveat[]>> | undefined,
  provider: string | undefined,
): MatchCaveat[] {
  if (!map) return [];
  const key = (provider || '').trim().toLowerCase();
  for (const [k, v] of Object.entries(map)) {
    if (k.trim().toLowerCase() === key) return v ?? [];
  }
  return [];
}

/** True when a provider's caveats mark it a stretch / category-fallback (not a
 *  true equivalent) — drives the amber column sub-caption. */
function isStretchProvider(
  map: Partial<Record<string, MatchCaveat[]>> | undefined,
  provider: string | undefined,
): boolean {
  return isStretch(caveatsForProvider(map, provider));
}

/**
 * "Comparison caveats" — the honest asterisks for the picks being compared
 * (mirrors UnverifiedClaimsNote's visual formula exactly: amber box, provider-
 * attributed bullets). One bullet per DISTINCT caveat (deduped by kind+provider),
 * so a burstable / cross-category / stretch pairing is never read as a true swap.
 * Renders nothing when every pick is a clean like-for-like.
 */
function MatchCaveatsNote({
  caveatsByProvider,
}: {
  caveatsByProvider?: Partial<Record<string, MatchCaveat[]>>;
}) {
  const amber = '#F59E0B';
  const rows: { key: string; provider: string; label: string; detail: string }[] = [];
  const seen = new Set<string>();
  for (const [provider, caveats] of Object.entries(caveatsByProvider ?? {})) {
    for (const c of caveats ?? []) {
      const key = `${provider.toLowerCase()}::${c.kind}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({ key, provider, label: c.label, detail: c.detail });
    }
  }
  if (rows.length === 0) return null;
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 'var(--radius-md)',
        background: 'rgba(245, 158, 11, 0.07)',
        border: '1px solid rgba(245, 158, 11, 0.28)',
      }}
      className="space-y-2.5"
    >
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <span
            aria-hidden
            style={{ width: 7, height: 7, borderRadius: 999, background: amber, flexShrink: 0 }}
          />
          <span
            className="text-[10px] font-semibold uppercase"
            style={{ color: amber, letterSpacing: '0.06em' }}
          >
            Comparison caveats
          </span>
        </div>
        <p className="text-[11px] text-text-muted leading-snug">
          These picks are the closest match on each cloud, not a guaranteed like-for-like swap —
          the notes below are where the machines differ in kind, not just in size.
        </p>
      </div>
      <ul className="space-y-1.5">
        {rows.map((r) => (
          <li key={r.key} className="text-[11px] leading-snug flex gap-1.5">
            <span style={{ color: amber, flexShrink: 0 }}>•</span>
            <span className="text-text-secondary">
              <span className="font-semibold" style={{ color: providerFg(r.provider) }}>
                {providerLabel(r.provider)}:{' '}
              </span>
              <span className="font-semibold">{r.label}</span> — {r.detail}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function SpecsTakeaway(props: SpecsTakeawayProps): JSX.Element {
  const {
    mode,
    layout = 'stack',
    heading,
    caveatsByProvider,
    collapsed = false,
    hideExecSummary = false,
    collapsedIntro,
  } = props;
  const vms = props.vms ?? [];
  const groups = props.groups ?? [];

  const sizeResult = useMemo(
    () => (mode === 'sizes' ? compareSpecs(vms) : null),
    [mode, vms],
  );
  const productResult = useMemo(
    () => (mode === 'products' ? compareProducts(groups) : null),
    [mode, groups],
  );

  const claims = useMemo(() => {
    if (mode === 'sizes') return unverifiedClaims(vms);
    const allVms = groups.flatMap((g) => g.vms);
    return unverifiedClaims(allVms, groups.map((g) => g.name));
  }, [mode, vms, groups]);

  const isColumns = layout === 'columns';
  const sectionHeading = heading ?? (isColumns ? "What you're comparing" : 'Key takeaway');

  let body: JSX.Element;

  if (mode === 'sizes') {
    if (vms.length === 0 || !sizeResult || sizeResult.vms.length === 0) {
      body = (
        <EmptyHint text="Tick at least one VM in the equivalents table to see how the picks differ." />
      );
    } else if (isColumns && collapsed) {
      body = (
        <CollapsedColumnsBox
          headline={sizeResult.headline}
          keyTakeaway={sizeResult.keyTakeaway}
          hideExecSummary={hideExecSummary}
          intro={
            collapsedIntro ??
            'The numbers are compared above. Expand a cloud for what its pick is, when to reach for it, and how it trades off.'
          }
          items={sizeResult.vms.map((insight, i) => {
            return {
              key: `${insight.provider}-${insight.vmSizeName}-${i}`,
              provider: insight.provider,
              title: `About ${insight.displayName} on ${providerLabel(insight.provider)}`,
              body: (
                <VmColumn
                  insight={insight}
                  stretch={isStretchProvider(caveatsByProvider, insight.provider)}
                  hideHeader
                />
              ),
            };
          })}
        />
      );
    } else if (isColumns) {
      body = (
        <ColumnsBox
          headline={sizeResult.headline}
          keyTakeaway={sizeResult.keyTakeaway}
          columns={sizeResult.vms.map((insight, i) => (
            <VmColumn
              key={`${insight.provider}-${insight.vmSizeName}-${i}`}
              insight={insight}
              stretch={isStretchProvider(caveatsByProvider, insight.provider)}
            />
          ))}
        />
      );
    } else {
      body = (
        <>
          <ExecSummary headline={sizeResult.headline} keyTakeaway={sizeResult.keyTakeaway} />
          <div className="space-y-2">
            {sizeResult.vms.map((insight, i) => (
              <VmCard key={`${insight.provider}-${insight.vmSizeName}-${i}`} insight={insight} />
            ))}
          </div>
        </>
      );
    }
  } else {
    if (groups.length === 0 || !productResult || productResult.products.length === 0) {
      body = <EmptyHint text="Pick a category or VM family to compare offerings." />;
    } else if (isColumns && collapsed) {
      body = (
        <CollapsedColumnsBox
          headline={productResult.headline}
          keyTakeaway={productResult.keyTakeaway}
          hideExecSummary={hideExecSummary}
          intro={
            collapsedIntro ??
            'Expand a cloud for what its offering is, its key traits, and when to reach for it.'
          }
          items={productResult.products.map((product, i) => {
            const provider = groups[i]?.vms[0]?.provider;
            return {
              key: `${product.kind}-${product.name}-${i}`,
              provider,
              title: `About ${product.name} on ${providerLabel(provider)}`,
              body: (
                <ProductColumn
                  product={product}
                  provider={provider}
                  stretch={isStretchProvider(caveatsByProvider, provider)}
                  hideHeader
                />
              ),
            };
          })}
        />
      );
    } else if (isColumns) {
      body = (
        <ColumnsBox
          headline={productResult.headline}
          keyTakeaway={productResult.keyTakeaway}
          columns={productResult.products.map((product, i) => (
            <ProductColumn
              key={`${product.kind}-${product.name}-${i}`}
              product={product}
              provider={groups[i]?.vms[0]?.provider}
              stretch={isStretchProvider(caveatsByProvider, groups[i]?.vms[0]?.provider)}
            />
          ))}
        />
      );
    } else {
      body = (
        <>
          <ExecSummary headline={productResult.headline} keyTakeaway={productResult.keyTakeaway} />
          <div className="space-y-2">
            {productResult.products.map((product, i) => (
              <ProductCard key={`${product.kind}-${product.name}-${i}`} product={product} />
            ))}
          </div>
        </>
      );
    }
  }

  return (
    <section className="space-y-2">
      <h2 className="section-h">{sectionHeading}</h2>
      {body}
      <MatchCaveatsNote caveatsByProvider={caveatsByProvider} />
      <UnverifiedClaimsNote claims={claims} />
    </section>
  );
}
