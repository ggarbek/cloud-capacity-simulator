/**
 * ExecBriefTradeoffs — "What you get vs what you give up" (S65 EXEC, S66 shared
 * grammar).
 *
 * The exec-altitude family/category/size story: one column per cloud (base
 * first), each with the family + category + generation line, 2–3 signature
 * traits, one honest trade-off line, and the match% + worst-caveat chip. Reads
 * the same spec intelligence the Specs page uses (`compareSpecs` → per-VM
 * standout / weakness / nuances) so the exec view and the drill-down never
 * disagree. Each column stays ≤6 short lines; wraps, no truncation. Never
 * crowns a single winner — every column is a situational story.
 *
 * S66 adds `ExecBriefBomTradeoffs`: the SAME card grammar fed by qty-weighted
 * portfolio stories (`bomTradeoffs` in execBriefMath) so VM-BoM mode renders an
 * identical section — only the data differs. Both variants share one internal
 * TradeoffCard so the grammar physically cannot diverge.
 */
import type { CatalogEntry } from '../../types';
import type { MatchCaveat } from '../../utils/matchCaveats';
import { worstCaveat } from '../../utils/matchCaveats';
import { compareSpecs } from '../../utils/specInsights';
import { categorize, matchCategory } from '../../utils/vmCategory';
import { vmFamily } from '../../utils/vmTaxonomy';
import { genFor } from '../../utils/equivalence';
import { providerTone, pctTone, fmtUsd } from './ui/tokens';
import { CaveatChip } from './ui/CaveatChip';
import type { BomCloudStory } from './execBriefMath';

/** Processor + inferred microarch generation, matching the page's `cpuLabel`. */
function cpuGenLine(vm: CatalogEntry): string {
  const proc = (vm.processor ?? '').trim();
  const g = genFor(vm);
  if (!proc) return g ? `${g.label} (inferred)` : 'CPU gen n/a';
  if (!g) return proc;
  if (proc.toLowerCase().includes(g.label.toLowerCase())) return proc;
  return `${proc} · ${g.label}`;
}

/** Category label — the vendor-facing category, flagging when the MATCH category
 *  differs (GCP -highmem shows "Memory Optimized via General Purpose"). */
function categoryLine(vm: CatalogEntry): string {
  const disp = vm.category ?? categorize(vm.provider, vm.family ?? vmFamily(vm));
  const match = matchCategory(vm);
  return match !== disp ? `${match} · via ${disp}` : disp;
}

/** The one shared column card — both variants render through this, so the
 *  tradeoffs grammar is structurally identical in Comparison and BoM modes. */
function TradeoffCard({
  provider,
  isBase,
  matchPct,
  title,
  contextLines,
  gains,
  giveUp,
  caveat,
}: {
  provider: string;
  isBase: boolean;
  matchPct: number | null;
  /** The mono headline: SKU name (comparison) or portfolio summary (BoM). */
  title: string;
  /** 1–2 muted context lines (family · category / cpu gen / totals). */
  contextLines: (string | null)[];
  gains: string[];
  giveUp: string | null;
  caveat: MatchCaveat | null;
}) {
  const t = providerTone(provider);
  return (
    <div
      className="glass"
      style={{
        padding: 14,
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${t.border}`,
        background: isBase ? t.bg : undefined,
      }}
    >
      {/* Header: provider + base tag + match%. */}
      <div className="flex items-center gap-x-2 flex-wrap mb-1">
        <span
          className="text-[9px] tracking-[0.05em] font-semibold uppercase"
          style={{ color: t.fg }}
        >
          {provider}
        </span>
        {isBase && (
          <span
            className="text-[8px] uppercase tracking-[0.06em]"
            style={{ color: 'var(--text-muted)' }}
          >
            base
          </span>
        )}
        {matchPct != null && !isBase && (
          <span className="text-[9px] font-semibold" style={{ color: pctTone(matchPct) }}>
            ≈{Math.round(matchPct)}% match
          </span>
        )}
      </div>
      <div
        className="font-mono font-semibold text-[12px] mb-1"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </div>

      {/* Context lines (family · category · generation / portfolio makeup). */}
      <div className="text-[10px] leading-snug mb-2" style={{ color: 'var(--text-secondary)' }}>
        {contextLines
          .filter((l): l is string => !!l)
          .map((l, i) => (
            <span key={i} style={i > 0 ? { color: 'var(--text-muted)' } : undefined}>
              {i > 0 && <br />}
              {l}
            </span>
          ))}
      </div>

      {/* Signature traits — up to 3. */}
      {gains.length > 0 && (
        <ul className="space-y-0.5 mb-2">
          {gains.slice(0, 3).map((tr, i) => (
            <li
              key={i}
              className="text-[10px] leading-snug"
              style={{ color: 'var(--text-secondary)' }}
            >
              + {tr}
            </li>
          ))}
        </ul>
      )}

      {/* Trade-off line (targets only). */}
      {giveUp && (
        <div className="text-[10px] leading-snug" style={{ color: 'var(--accent-amber)' }}>
          − {giveUp}
        </div>
      )}

      {/* Worst caveat chip (targets only). */}
      {caveat && (
        <div className="mt-2">
          <CaveatChip label={caveat.label} detail={caveat.detail} />
        </div>
      )}
    </div>
  );
}

function TradeoffGrid({ children }: { children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="section-h">What you get vs what you give up</h2>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(auto-fit, minmax(220px, 1fr))` }}
      >
        {children}
      </div>
    </section>
  );
}

export function ExecBriefTradeoffs({
  vms,
  baseProvider,
  matchPctByProvider,
  caveatsByProvider,
}: {
  vms: CatalogEntry[];
  baseProvider: string;
  matchPctByProvider: Partial<Record<string, number | null>>;
  caveatsByProvider: Partial<Record<string, MatchCaveat[]>>;
}) {
  if (vms.length === 0) return null;

  // One synthesis across the peer set — gives each VM its unique standout /
  // weakness relative to the others (the exec trade-off line).
  const comparison = compareSpecs(vms);
  const insightByKey = new Map(comparison.vms.map((i) => [`${i.provider}::${i.vmSizeName}`, i]));

  // Base column first, then the rest in their given order.
  const ordered = [
    ...vms.filter((v) => (v.provider ?? '') === baseProvider),
    ...vms.filter((v) => (v.provider ?? '') !== baseProvider),
  ];

  return (
    <TradeoffGrid>
      {ordered.map((vm) => {
        const provider = (vm.provider ?? 'Custom') as string;
        const isBase = provider === baseProvider;
        const insight = insightByKey.get(`${provider}::${vm.vmSizeName}`);
        return (
          <TradeoffCard
            key={`${provider}-${vm.vmSizeName}`}
            provider={provider}
            isBase={isBase}
            matchPct={isBase ? 100 : (matchPctByProvider[provider] ?? null)}
            title={vm.vmSizeName}
            contextLines={[
              `${vm.family ?? vmFamily(vm)} · ${categoryLine(vm)}`,
              cpuGenLine(vm),
            ]}
            gains={signatureTraits(insight)}
            giveUp={isBase ? null : (insight?.weakness ?? null)}
            caveat={isBase ? null : worstCaveat(caveatsByProvider[provider] ?? [])}
          />
        );
      })}
    </TradeoffGrid>
  );
}

/**
 * S66 — the VM-BoM variant: one qty-weighted portfolio story per cloud, in the
 * IDENTICAL card grammar. Stories come from the pure `bomTradeoffs` selector
 * (dominant families/categories, qty-weighted match, honest gains/give-up,
 * worst comparability caveat across the ported lines).
 */
export function ExecBriefBomTradeoffs({ stories }: { stories: BomCloudStory[] }) {
  if (stories.length === 0) return null;
  return (
    <TradeoffGrid>
      {stories.map((st) => (
        <TradeoffCard
          key={st.provider}
          provider={st.provider}
          isBase={st.isBase}
          matchPct={st.avgMatchPct}
          title={st.families.length > 0 ? st.families.join(' · ') : 'No matched lines'}
          contextLines={[
            st.category,
            `${st.matchedLines} of ${st.totalLines} line${st.totalLines === 1 ? '' : 's'} matched` +
              (st.monthlyTotalUsd != null
                ? ` · ${fmtUsd(st.monthlyTotalUsd)}/mo${st.anyEstimated ? ' (est.)' : ''}`
                : ' · unpriced'),
          ]}
          gains={st.gains}
          giveUp={st.giveUp}
          caveat={st.worstCaveat}
        />
      ))}
    </TradeoffGrid>
  );
}

/** Up to 3 signature traits: the standout dimension first (if any), then the
 *  VM's own nuance labels. Deduped. */
function signatureTraits(
  insight: ReturnType<typeof compareSpecs>['vms'][number] | undefined,
): string[] {
  if (!insight) return [];
  const out: string[] = [];
  const push = (s?: string) => {
    if (s && !out.includes(s)) out.push(s);
  };
  push(insight.standout);
  for (const n of insight.nuances) push(n.label);
  if (out.length === 0 && insight.bestFor) push(`Best for ${insight.bestFor.replace(/\.$/, '')}`);
  return out;
}
