/**
 * CmaFaqPage — the FAQ + Glossary for Cloud Market Analytics.
 *
 * Structured after a reference "Library" wiki: a top search box, then NUMBERED
 * sections ("01 // …") whose entries are click-to-expand accordion cards, plus
 * a filtered glossary at the end. Search filters questions, answers AND glossary
 * terms in real time; matching cards auto-expand. Everything is grounded in the
 * live source — the weights / formulae quote `src/utils/equivalence.ts`, the
 * penalties quote `vmCategory.ts` + `crossCloudEquivalency.ts`, and the as-of
 * date is read from `liveCatalog.ts`. Colours are CSS custom properties so it
 * themes in light + dark.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { LIVE_CATALOG_AS_OF } from '../data/liveCatalog';
import { dataHealth } from '../data/dataHealth';

// ── Real engine constants, mirrored for display ONLY (match the source) ──────
//   W from equivalence.ts (12 dims): vcpu 2.2 · mem 2.0 · mpv 1.1 · arch 0.7 ·
//     gen 0.35 · net 0.6 · disk 1.5 · gpu 3.0 · gpuModel 2.6 · gpuVram 1.8 ·
//     gpuLink 1.0 · tee 0.6 · MATCH_K = 1.157
//   CROSS_GROUP_PENALTY (vmCategory.ts) = 0.30
//   CROSS_CATEGORY_PENALTY (crossCloudEquivalency.ts) = 0.25
const WEIGHTS: { dim: string; weight: number; note: string; always: boolean }[] = [
  { dim: 'vCPU count', weight: 2.2, note: 'Proportional (log₂) — 4↔8 costs the same as 64↔128.', always: true },
  { dim: 'Memory (GiB)', weight: 2.0, note: 'Proportional (log₂) on total memory.', always: true },
  { dim: 'Memory per vCPU', weight: 1.1, note: 'The shape that separates standard / highmem / highcpu.', always: true },
  { dim: 'CPU architecture', weight: 0.7, note: 'Intel↔Intel, AMD↔AMD, Arm↔Arm. Only when both sides are known.', always: false },
  { dim: 'CPU generation', weight: 0.35, note: 'Closer microarchitectures are more apples-to-apples. Same-vendor only.', always: false },
  { dim: 'Network throughput', weight: 0.6, note: 'Separates otherwise-identical sizes. Only when both carry a value.', always: false },
  { dim: 'Local disk (GiB)', weight: 1.5, note: 'The defining axis for Storage-Optimized. Active when either side is storage-opt.', always: false },
  { dim: 'GPU count', weight: 3.0, note: 'Symmetric log₂ on (count + 1). GPU category only.', always: false },
  { dim: 'GPU model class', weight: 2.6, note: 'Capability tier (T4 … H200 … B200). So 8×H100 ≠ 8×L4. Needs curated specs both sides.', always: false },
  { dim: 'GPU VRAM', weight: 1.8, note: 'Per-accelerator memory (24 / 80 / 141 GiB), log-ratio. Needs curated specs.', always: false },
  { dim: 'GPU interconnect', weight: 1.0, note: 'PCIe < NVLink < NVSwitch, ordinal. Needs curated specs.', always: false },
  { dim: 'Confidential / TEE', weight: 0.6, note: 'SEV-SNP vs TDX, within the Confidential category. Needs a resolved TEE kind.', always: false },
];

const GLOSSARY: { term: string; def: string }[] = [
  // Setup / structure
  { term: 'Objective (mode)', def: 'The first setup choice: Compare VM sizes (apples-to-apples specific SKUs) vs Compare product offerings (categories/families head-to-head, no individual sizes).' },
  { term: 'Base cloud', def: 'The cloud you anchor on. Its picks define the rows and read 100% by definition; every other cloud is scored as an equivalent of the base. The leftmost column.' },
  { term: 'Category', def: 'The canonical cross-cloud product class — General Purpose, Compute Optimized, Memory Optimized, Storage Optimized, GPU, High Performance Computing, Confidential, plus Previous Generation and Custom. Matching is gated to the same category by default.' },
  { term: 'VM family (series)', def: 'A vendor-named line within a category (Azure Esv5, AWS r7iz, GCP n2). A family rolls up many sizes that share a silicon + shape lineage.' },
  { term: 'VM size (SKU)', def: 'A single purchasable SKU (Standard_E16s_v5, r7iz.16xlarge) with concrete vCPU / memory — the atomic unit the engine compares.' },
  // Specs / Exec
  { term: '≈% / similarity match', def: 'A 0–100 strength score for an equivalence: 100 = identical spec, lower = more different. Derived from the weighted spec distance, not a curated opinion.' },
  { term: '★ leader (Specs bar)', def: 'The cloud holding the highest value in a single Specs metric row; its bar is full-opacity and its value bold. A per-row fact, not an overall verdict.' },
  { term: '★ Stands out', def: 'The one dimension a VM clearly leads the comparison on (GPU, bare-metal, local NVMe, newest within-vendor generation, network, memory density, or Arm). Suppressed on ties.' },
  { term: '★ Best at X', def: 'A situational Executive-Summary tag for a dimension a VM actually wins (Best price / Most vCPU / Most memory / Highest network). There is no single overall winner.' },
  { term: 'Microarchitecture span', def: 'A slashed CPU label (e.g. "Cascade Lake / Ice Lake") meaning the family runs on either microarchitecture — the host decides, you don’t — and both rank as the same generation.' },
  { term: 'Coarse processor (Azure)', def: 'An approximate CPU label shown for Azure sizes whose exact generation can’t be pinned (Azure’s catalog carries no processor string); display-only, never affects matching.' },
  { term: 'Unverified vendor claim', def: 'A vendor "up to X%" marketing figure that failed independent verification; shown as an honest amber caveat, attributed and linked to the vendor’s page, not corroborated by us.' },
  { term: 'Spec delta (vs base)', def: 'A plain-language per-dimension difference between an equivalent and the base pick, with ↑ (better) / ↓ (worse) direction.' },
  // Matching engine
  { term: 'Weighted distance', def: 'The blended spec gap between two sizes: each dimension’s difference times its weight, summed over up to 12 dimensions.' },
  { term: 'Log-ratio distance', def: 'Measuring a spec gap as |log₂(a/b)| so proportional steps (4↔8, 64↔128) cost the same regardless of absolute size.' },
  { term: 'Active-weight normalization', def: 'Dividing the raw distance by the weights of only the dimensions both sides could compare, so scores stay comparable even when data (e.g. Azure’s missing processor string) is absent.' },
  { term: 'Category gate', def: 'The hard rule that two sizes must share a (match) category to match; different categories return 0%.' },
  { term: 'Match category', def: 'The effective category used for matching (e.g. GCP -highmem upgraded to Memory Optimized), which can differ from the vendor label shown in the UI.' },
  { term: 'Cross-category fallback (≠ / "via «Category»")', def: 'An opt-in mode allowing a different-category substitute at a penalty (0.25, plus 0.30 across product groups) when a cloud was scoped away from the base’s category.' },
  { term: 'Soft-penalty term', def: 'A distance term (GPU model/VRAM/interconnect, TEE) gated to its category and inert unless both sides carry curated data — it refines rather than gates.' },
  { term: 'TEE (Trusted Execution Environment)', def: 'Hardware confidential compute — AMD SEV-SNP or Intel TDX; the TEE term distinguishes the two within the Confidential category.' },
  { term: 'Best size-pair', def: 'A family’s score = the single strongest size-to-size match into the candidate pool, not a median or averaged profile.' },
  { term: 'Decay constant (k = 1.157)', def: 'The exponent in match% = 100·exp(−k·d) that converts a normalized distance to a percentage.' },
  // Region
  { term: 'Region equivalency', def: 'Two regions treated as analogs because they’re in the same country, same sovereignty class, and within 400 km of each other; lets cross-cloud peers line up on one row.' },
  { term: 'Geo-cluster', def: 'A group of regions merged by union-find (same country + gov class + ≤ 400 km). Picking any region scopes the page to its whole cluster across clouds.' },
  { term: 'REGION_CLUSTER_KM (400 km)', def: 'The maximum straight-line distance for two same-country regions to count as equivalent / cluster together.' },
  { term: 'Super-geo', def: 'One of three coarse buckets — AMER (Americas), EMEA (Europe · Middle East · Africa), APAC (Asia · Pacific) — used to group regions.' },
  { term: 'Edge region / Local Zone', def: 'AWS satellite sites (us-east-1-bos-1, …-wl1-…) attached to a parent region; excluded from region counts because they aren’t full regions and have no cross-cloud peer.' },
  { term: 'Market gap', def: 'A metro where at least one compared cloud has a region but not every compared cloud does — the unique-reach / missing-coverage signal.' },
  { term: 'Metro', def: 'A region collapsed to its datacenter city + country (N. Virginia, Sydney); the unit for overlap math, since one metro can host several regions on one cloud.' },
  // Pricing
  { term: 'PAYG', def: 'Pay-as-you-go on-demand pricing with no commitment — the published hourly rate. Always a real figure, never estimated.' },
  { term: 'Reserved / committed term (1-yr, 3-yr)', def: 'A discounted rate in exchange for a 1- or 3-year usage commitment; deeper discount for the longer term.' },
  { term: 'Bill of Materials (BoM)', def: 'Your committed VM demand — a list of {VM size, quantity, region} lines authored on the VM Demand tab.' },
  { term: 'Region auto-match (~1000 km)', def: 'On Pricing, the other clouds’ region is auto-resolved to the nearest equivalent of the base region — same country or within ~1000 km (REGION_MATCH_KM), else excluded with an alert.' },
  { term: 'Estimated rate ("est.")', def: 'A reserved rate modeled from PAYG × the provider’s measured median RI/PAYG discount when no published reserved rate exists; always badged, never overwrites a real rate.' },
  { term: 'Rate library', def: 'The per-region published PAYG / 1-yr / 3-yr rate card for a single anchor VM, sorted cheapest-region-first.' },
  // Data
  { term: 'Region-exploded catalog', def: 'One catalog row per provider × region × size (~96k rows), because pricing is per-region; deduped to ~3.2k distinct specs for matching.' },
  { term: 'As-of date', def: `The date the baked public pricing + specs were last pulled and shipped in the build. Currently as of ${LIVE_CATALOG_AS_OF}; refreshed weekly by CI.` },
];

// ── Small presentational helpers (CSS tokens only) ───────────────────────────
function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>{children}</p>;
}
function Strong({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{children}</strong>;
}
function Mono({ children }: { children: React.ReactNode }) {
  return (
    <code
      className="font-mono"
      style={{ fontSize: 12, color: 'var(--text-primary)', background: 'var(--tint-soft-2)', border: '1px solid var(--border)', borderRadius: 6, padding: '1px 6px' }}
    >
      {children}
    </code>
  );
}

function WeightsTable() {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', margin: '4px 0 12px' }}>
      <div
        className="grid"
        style={{ gridTemplateColumns: '1.4fr 0.5fr 2.1fr', fontSize: 9.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', background: 'var(--tint-soft)', padding: '8px 12px', fontWeight: 600 }}
      >
        <div>Dimension</div>
        <div style={{ textAlign: 'right' }}>Weight</div>
        <div style={{ paddingLeft: 16 }}>How it&apos;s compared</div>
      </div>
      {WEIGHTS.map((w) => (
        <div key={w.dim} className="grid" style={{ gridTemplateColumns: '1.4fr 0.5fr 2.1fr', padding: '8px 12px', borderTop: '1px solid var(--border)', alignItems: 'baseline' }}>
          <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>
            {w.dim}
            {!w.always && (
              <span className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 6 }} title="Only added when both sides carry this data.">
                opt
              </span>
            )}
          </div>
          <div className="font-mono tabular-nums" style={{ fontSize: 12, color: 'var(--interactive)', fontWeight: 600, textAlign: 'right' }}>
            {w.weight.toFixed(2)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.45, paddingLeft: 16 }}>{w.note}</div>
        </div>
      ))}
    </div>
  );
}

function FormulaAndAnchors() {
  return (
    <>
      <div
        className="font-mono"
        style={{ fontSize: 13, color: 'var(--text-primary)', background: 'var(--tint-soft-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 16px', margin: '0 0 12px', textAlign: 'center' }}
      >
        match% = round( 100 · exp( −1.157 · d ) )
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {[
          { ex: 'Identical spec', pct: '100%' },
          { ex: 'Cross-architecture only', pct: '≈87%' },
          { ex: 'One 2× size step', pct: '≈40%' },
          { ex: '8×H100 vs 8×L4', pct: '≈37%' },
        ].map((a) => (
          <div key={a.ex} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-pill)', padding: '6px 12px', fontSize: 11.5, color: 'var(--text-secondary)', background: 'var(--tint-soft)' }}>
            {a.ex}{' '}
            <span className="font-mono tabular-nums" style={{ color: 'var(--interactive)', fontWeight: 600 }}>
              {a.pct}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

/** One plain-text line per cloud from the baked shard manifest (dataHealth()).
 *  Empty (a single muted note) when the build carries no health block. */
function DataHealthLines() {
  const rows = dataHealth();
  if (rows.length === 0) {
    return (
      <P>
        <span style={{ color: 'var(--text-muted)' }}>
          No shard manifest in this build — data-health detail is unavailable.
        </span>
      </P>
    );
  }
  const fmt = (n: number) => n.toLocaleString();
  const label = (c: string) => (c === 'aws' ? 'AWS' : c === 'gcp' ? 'GCP' : c === 'azure' ? 'Azure' : c);
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', margin: '4px 0 12px' }}>
      {rows.map((r, i) => (
        <div
          key={r.cloud}
          style={{ padding: '9px 14px', borderTop: i === 0 ? 'none' : '1px solid var(--border)', fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}
        >
          <Strong>{label(r.cloud)}</Strong>
          {' — '}shards {r.shardAgeDays} day{r.shardAgeDays === 1 ? '' : 's'} old · {fmt(r.specRows)} sizes ·
          {' '}processor {r.effectiveProcessorPct}%
          {r.effectiveProcessorPct !== r.processorPct ? ' (curated map)' : ''} · network {r.networkPct}% ·{' '}
          {fmt(r.ratesWithoutSpec)} priced SKUs awaiting specs
        </div>
      ))}
    </div>
  );
}

// ── FAQ content — sections of click-to-expand Q&A. `text` is the plain-text
// blob used for search (the JSX `body` is what renders). ──────────────────────
interface FaqItem {
  id: string;
  q: string;
  text: string;
  body: React.ReactNode;
}
interface FaqSection {
  id: string;
  num: string;
  title: string;
  items: FaqItem[];
}

/** Compact bulleted list used inside answers. */
function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul style={{ margin: '0 0 10px 0', paddingLeft: 20, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
      {children}
    </ul>
  );
}

const SECTIONS: FaqSection[] = [
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'start',
    num: '01',
    title: 'Getting started: the Comparison setup',
    items: [
      {
        id: 'start-what',
        q: 'What is Cloud Market Analytics, and how do I use it?',
        text: 'overview what is cma cloud market analytics compare azure aws gcp specs pricing regions setup pages',
        body: (
          <>
            <P>
              Cloud Market Analytics (CMA) compares virtual machines and regions across{' '}
              <Strong>Azure, AWS and GCP</Strong> on real, published data. You define <em>what</em> to compare
              once in the <Strong>Comparison setup</Strong>, then read the answer across focused pages:{' '}
              <Strong>Executive Summary</Strong> (the verdict), <Strong>Specs</Strong> (hardware side-by-side),{' '}
              <Strong>Pricing</Strong> (what it costs, with Bill-of-Materials porting), and{' '}
              <Strong>Region availability / Coverage</Strong> (where each cloud runs it). The{' '}
              <Strong>Rate library</Strong> is the per-region rate card.
            </P>
            <P>
              Everything is computed from the live catalog, not a hand-curated &quot;X equals Y&quot; table, so
              it stays correct as new SKUs ship and every result is explainable.
            </P>
          </>
        ),
      },
      {
        id: 'start-steps',
        q: 'What does each setup step do?',
        text: 'setup stepper objective clouds basis category vm family size region steps order',
        body: (
          <>
            <P>The setup is a collapsing stepper; each step narrows the basis of the comparison:</P>
            <UL>
              <li><Strong>① Objective</Strong> — compare specific VM <em>sizes</em>, or product <em>offerings</em> (categories / families). Changes how the later steps behave.</li>
              <li><Strong>② Clouds &amp; basis</Strong> — which clouds (1 to deep-dive, 2–3 to compare) and which one is the <em>base</em> (the anchor).</li>
              <li><Strong>③ Category</Strong> — narrow each cloud to a VM category (General Purpose, Memory Optimized, GPU…).</li>
              <li><Strong>④ VM family</Strong> — narrow to a specific family (Azure E-series, AWS r7iz, GCP n2). The others show a ≈% match.</li>
              <li>In <em>sizes</em> mode, a <Strong>VM Size</Strong> table + a selected-VM spec sheet follow.</li>
            </UL>
            <P>
              <Strong>Region is deliberately not a setup step</Strong> — it has no bearing on a like-for-like
              basis, so it lives as a per-page filter on the pages that consume it (Pricing, Region).
            </P>
          </>
        ),
      },
      {
        id: 'start-objective',
        q: 'What is the difference between "Compare VM sizes" and "Compare product offerings"?',
        text: 'objective mode sizes vs products apples to apples offerings category family single multi select',
        body: (
          <>
            <P>
              <Strong>Compare VM sizes</Strong> is apples-to-apples: you drill to specific SKUs (e.g.{' '}
              <Mono>Standard_E16s_v5</Mono> vs <Mono>r7iz.4xlarge</Mono> vs <Mono>n2-highmem-16</Mono>) and
              compare specs, pricing and equivalents. Category and family are <Strong>multi-select</Strong>.
            </P>
            <P>
              <Strong>Compare product offerings</Strong> compares the clouds&apos; lineups, not individual
              machines — you stop at one category or one family per cloud (<Strong>single-select</Strong>), with
              no VM-size table. Use sizes when you have a concrete machine in mind; use products when surveying
              the market (&quot;what does each cloud offer in Memory-Optimized?&quot;).
            </P>
          </>
        ),
      },
      {
        id: 'start-base',
        q: 'What is the "base" cloud and why does it matter?',
        text: 'base cloud baseline anchor leftmost column match percent relative ranked re-anchor',
        body: (
          <P>
            The <Strong>base</Strong> is the cloud you anchor on. It&apos;s the leftmost column, and{' '}
            <Strong>every ≈% match on the other clouds is measured against the base&apos;s pick</Strong> — your
            base picks define the rows; the others are ranked as equivalents of them. If you deselect the base
            cloud, the tool re-anchors onto the first remaining one so views never point at an inactive cloud.
            Change it any time on the Set up page.
          </P>
        ),
      },
      {
        id: 'start-cat-fam-size',
        q: 'Category vs VM family vs VM size — what is the difference?',
        text: 'category family size hierarchy canonical cross-cloud series sku examples memory optimized esv5 r7iz',
        body: (
          <>
            <UL>
              <li><Strong>Category</Strong> — the canonical cross-cloud bucket (e.g. <em>Memory Optimized</em>); same meaning on every cloud.</li>
              <li><Strong>VM family / series</Strong> — a vendor&apos;s named line within a category (Azure <Mono>Esv5</Mono>, AWS <Mono>r7iz</Mono>, GCP <Mono>n2</Mono>).</li>
              <li><Strong>VM size</Strong> — the purchasable SKU with concrete vCPU/memory (<Mono>Standard_E16s_v5</Mono>).</li>
            </UL>
            <P>
              The canonical categories are <Strong>General Purpose, Compute Optimized, Memory Optimized,
              Storage Optimized, GPU/Accelerated, High Performance Computing, Confidential</Strong>, plus{' '}
              <Strong>Previous Generation</Strong> and a <Strong>Custom</Strong> fallback. A family is assigned to
              one by a per-cloud classifier that checks special cases (legacy, confidential, HPC, GPU) before the
              generic prefix rules.
            </P>
          </>
        ),
      },
      {
        id: 'start-no-match',
        q: 'Why might a cloud show "no match" for my pick?',
        text: 'no match zero percent category gate cloud not selected missing specs no close peer loosen filter',
        body: (
          <P>
            Usually one of: the cloud has no family in your base pick&apos;s <Strong>category</Strong> (the hard
            gate); the cloud <Strong>isn&apos;t selected</Strong>, or a region/filter left it with zero rows; a
            row is <Strong>missing vCPU or memory</Strong> so it can&apos;t be scored; or there is{' '}
            <Strong>genuinely no close peer</Strong> (the score floors at 1%). The fix is usually to confirm the
            cloud is selected and loosen or <Strong>Skip</Strong> that cloud&apos;s category/family filter.
          </P>
        ),
      },
    ],
  },
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'specs',
    num: '02',
    title: 'The Specs page',
    items: [
      {
        id: 'specs-what',
        q: 'What does the Specs page show?',
        text: 'specs consolidated panel identity header per metric bars leader cpu accelerator alternatives no region',
        body: (
          <>
            <P>
              One consolidated panel puts the base cloud&apos;s pick and its equivalents side by side. A per-cloud{' '}
              <Strong>identity header</Strong> (provider · SKU · <Mono>Base</Mono> or <Mono>≈% match</Mono>) sits
              above one <Strong>bar row per numeric spec</Strong> — Memory, vCPU, Network, NICs, Local NVMe,
              Remote disks — each drawn proportionally across the clouds with the value and a ★ on the leader.
            </P>
            <P>
              Below the bars are categorical rows: <Strong>CPU</Strong> (architecture / generation),{' '}
              <Strong>Accelerator</Strong> (only when a GPU is present), and per-cloud{' '}
              <Strong>Alternatives</Strong>. A row only appears when at least one cloud reports a value, so you
              never see an empty metric.
            </P>
          </>
        ),
      },
      {
        id: 'specs-bars',
        q: 'How do I read the per-metric bars and the ★ leader?',
        text: 'bars relative scale leader star highest value per row not overall winner read together',
        body: (
          <P>
            Each row is scaled against the <Strong>largest value in that row</Strong> — the leader fills its bar
            fully and the others fill proportionally, with the raw value to the right. The <Strong>★ leader</Strong>{' '}
            is a per-row fact, not an overall verdict: a cloud can lead Memory while trailing Network. Read the
            rows together to see the shape of each option, then let the Executive Summary turn that into a
            decision.
          </P>
        ),
      },
      {
        id: 'specs-pct',
        q: 'What is the "≈ % match" on each cloud?',
        text: 'percent match similarity to base spec distance how like for like swap matchPct',
        body: (
          <P>
            A <Strong>0–100 similarity score</Strong> for how close another cloud&apos;s pick is to the{' '}
            <Strong>base</Strong> pick (the base shows <Mono>Base</Mono>). It&apos;s the spec distance run
            through a calibrated decay curve: identical specs read 100%, and the score falls as vCPU, memory,
            shape, architecture, generation, network, storage and accelerators diverge. Read it as &quot;how
            like-for-like is this swap&quot;; the deep mechanics are in the{' '}
            <Strong>VM matching</Strong> section.
          </P>
        ),
      },
      {
        id: 'specs-standout',
        q: 'What is the "★ Stands out" chip and how is it chosen?',
        text: 'stands out chip one dimension leads gpu bare metal local nvme newest generation network memory arm ties',
        body: (
          <P>
            In the educational columns, each pick can carry a <Strong>★ Stands out</Strong> chip naming the{' '}
            <Strong>one</Strong> dimension it clearly leads on — in priority order: most GPU power, the only
            bare-metal, the only local NVMe, newest CPU generation, most network, most memory-per-vCPU (or the
            leanest), or the only Arm option. It appears only for a clear, <Strong>non-tied</Strong> leader, and
            generation is compared <Strong>within a vendor only</Strong> (Intel/AMD/Arm ranks aren&apos;t the
            same scale). A balanced size with no clear lead shows no chip.
          </P>
        ),
      },
      {
        id: 'specs-cpu',
        q: 'What does the CPU line mean, including "Cascade Lake / Ice Lake"?',
        text: 'cpu generation newer older microarchitecture either gcp n2 cascade lake ice lake azure coarse processor inferred',
        body: (
          <>
            <P>
              The CPU row names the architecture and generation. A <Strong>newer</Strong> generation is typically{' '}
              <Strong>~15–30% better price/performance</Strong> than the family it replaces, so default to the
              newest unless your region lacks it.
            </P>
            <P>
              A slashed label like GCP n2 &quot;<Mono>Cascade Lake / Ice Lake</Mono>&quot; is{' '}
              <Strong>not</Strong> a contradiction: the family runs on <Strong>either</Strong> microarchitecture
              (the host decides, you don&apos;t) and both rank as the same generation. <Strong>Azure</Strong>{' '}
              carries no processor string at all, so for sizes whose generation can&apos;t be pinned a
              deliberately <Strong>coarse, honest label</Strong> (e.g. &quot;Intel Broadwell/Skylake&quot;) is
              shown — display-only, never affecting the match rank.
            </P>
          </>
        ),
      },
      {
        id: 'specs-no-region',
        q: 'Why is there no Region on the Specs page?',
        text: 'no region specs identical worldwide availability pricing region independent',
        body: (
          <P>
            Because a VM&apos;s specs <Strong>don&apos;t depend on where it runs</Strong> — an{' '}
            <Mono>m7i.4xlarge</Mono> has the same vCPU/memory/network in Frankfurt and Virginia. Region only
            changes <Strong>availability</Strong> and <Strong>price</Strong>, which the Region and Pricing pages
            handle. Specs = the hardware; Region = where you can get it; Pricing = what it costs there.
          </P>
        ),
      },
      {
        id: 'specs-unverified',
        q: 'What is an "unverified vendor claim" callout?',
        text: 'unverified vendor claim up to x percent marketing amber honest disclosure attributed linked not benchmarked',
        body: (
          <P>
            An honest amber callout surfacing vendors&apos; &quot;up to X%&quot; marketing figures (price/perf,
            IOPS, storage density) that we <Strong>could not independently verify</Strong>. We neither repeat
            them as fact nor silently drop them: each is attributed to the right cloud, stated plainly with one
            line on <em>why</em> it&apos;s unconfirmed, and linked to the vendor&apos;s own page. They appear
            only when relevant to your comparison. Treat any figure here as a vendor&apos;s best case and
            validate against your own workload.
          </P>
        ),
      },
    ],
  },
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'exec',
    num: '03',
    title: 'The Executive Summary',
    items: [
      {
        id: 'exec-vs-specs',
        q: 'What does the Executive Summary give me that Specs doesn’t?',
        text: 'executive summary verdict first briefing key takeaway kpi hero situational best at cost headline deltas',
        body: (
          <P>
            Specs is the <em>evidence</em>; the Executive Summary is the <em>briefing</em> built on top of it —
            verdict-first, read in one glance. It leads with an engine-written <Strong>key takeaway</Strong>{' '}
            (the single most decision-relevant difference), a <Strong>KPI hero</Strong> (cheapest / most vCPU /
            most memory / most network, each naming the cloud + SKU), then <Strong>situational best-at</Strong>{' '}
            calls, a <Strong>cost headline</Strong>, and condensed <Strong>spec deltas vs base</Strong>.
          </P>
        ),
      },
      {
        id: 'exec-best-at',
        q: 'What is "situational best-at" and why isn’t there a single winner?',
        text: 'situational best at tags best price most vcpu memory network no single crowned winner workload dependent',
        body: (
          <P>
            Real sizing is situational — the cheapest VM isn&apos;t the one with the most memory — so instead of
            crowning one winner, each contender card carries <Strong>★ Best at X</Strong> tags for the
            dimensions it actually leads (<Strong>Best price, Most vCPU, Most memory, Highest network</Strong>).
            A card only gets a tag it genuinely wins, and a plain-language &quot;why pick this&quot; line
            explains its standing. Match a VM to <em>your</em> workload shape rather than someone else&apos;s
            idea of &quot;best.&quot;
          </P>
        ),
      },
      {
        id: 'exec-scope',
        q: 'What is the "This pairing" vs "All picks" toggle?',
        text: 'scope toggle this pairing row all picks roll up multiple vms verdict evidence',
        body: (
          <P>
            When you&apos;ve picked more than one VM, this toggle controls what the briefing summarizes.{' '}
            <Strong>This pairing</Strong> anchors to the one active comparison row (full evidence: verdict, KPI
            hero, best-at, cost headline, deltas). <Strong>All picks</Strong> rolls the takeaway up across every
            selected VM (a cross-set summary; the per-row evidence isn&apos;t shown). It only appears with more
            than one row to compare.
          </P>
        ),
      },
      {
        id: 'exec-deltas',
        q: 'What are the spec "deltas vs base"?',
        text: 'spec deltas vs base dimension differences up better down worse arrow per cloud',
        body: (
          <P>
            The plain-language, dimension-by-dimension differences between each equivalent and the{' '}
            <Strong>base</Strong> pick — the &quot;what changes if I switch&quot; list. An{' '}
            <Strong>↑</Strong> (interactive accent) means the equivalent is <em>better</em> on that dimension; a{' '}
            <Strong>↓</Strong> (red) means <em>worse</em>. Grouped per cloud, shown in &quot;This pairing&quot;
            scope when there are meaningful differences to report.
          </P>
        ),
      },
    ],
  },
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'pricing',
    num: '04',
    title: 'The Pricing page & Rate library',
    items: [
      {
        id: 'price-what',
        q: 'What does the Pricing page let me do?',
        text: 'pricing estimator bom porting cross cloud cost chart monthly cost quantity duration term run estimate',
        body: (
          <>
            <P>It turns your picks into dollars across the clouds, with two tools:</P>
            <UL>
              <li><Strong>Cost estimator</Strong> — prices the locked per-cloud sizes. Set a quantity on the base (others mirror it), a run duration and a commitment term, then <Strong>Run estimate</Strong> for per-cloud totals + a verdict.</li>
              <li><Strong>Port your VM demand</Strong> — re-prices your whole committed Bill of Materials (BoM) on every other cloud by mapping each line to its best-match SKU.</li>
            </UL>
            <P>
              A separate <Strong>Cross-cloud cost</Strong> section shows a 1-month / 1-year / 3-year horizon
              table + a PAYG/1y/3y rate-bar chart for the anchor VM.
            </P>
          </>
        ),
      },
      {
        id: 'price-term',
        q: 'What do "run duration" and "commitment term" mean?',
        text: 'run duration hours months 730 commitment term payg 1 year 3 year reserved discount hourly rate',
        body: (
          <P>
            <Strong>Run duration</Strong> is how long you&apos;ll run the VMs — the multiplier that turns an
            hourly rate into a total (months convert at <Mono>730 h/month</Mono>). <Strong>Commitment term</Strong>{' '}
            is the pricing tier: <Strong>PAYG</Strong> (on-demand), <Strong>1-yr</Strong> or <Strong>3-yr</Strong>{' '}
            reserved (steeper discounts for longer). Both knobs apply to every cloud at once so the comparison
            stays apples-to-apples. The verdict also flags a term-switch opportunity (&quot;a 3-yr RI would cut
            GCP ~$X&quot;) when it&apos;s material.
          </P>
        ),
      },
      {
        id: 'price-region',
        q: 'How is region handled on the Pricing page?',
        text: 'base region picker auto match nearest equivalent 1000 km no comparable region excluded dont guess',
        body: (
          <P>
            Prices vary by region, so you pick <Strong>one base region</Strong> and the other clouds{' '}
            <Strong>auto-match</Strong> the nearest equivalent — same country first, else nearest by distance,
            but only if it&apos;s in the same country <Strong>or within ~1000 km</Strong> (<Mono>REGION_MATCH_KM</Mono>).
            Beyond that the cloud is <Strong>left blank with a &quot;no comparable region — excluded&quot;</Strong>{' '}
            alert. We don&apos;t guess past 1000 km on purpose: pricing your workload against a region on another
            continent would silently compare different latency, sovereignty and cost regimes — a misleading
            number is worse than an honest omission. (In BoM mode each line uses its own committed region
            instead.)
          </P>
        ),
      },
      {
        id: 'price-bom',
        q: 'What is a Bill of Materials (BoM) and how do I price it across clouds?',
        text: 'bill of materials bom vm demand port best match sku re-platform azure to aws gcp match percent',
        body: (
          <>
            <P>
              A <Strong>BoM</Strong> is your committed VM demand — a list of <Mono>{'{size, quantity, region}'}</Mono>{' '}
              lines authored on the <Strong>VM Demand</Strong> tab. To price it across clouds, the porter maps
              every line to its <Strong>best-match equivalent SKU</Strong> on each other cloud (same-category
              gate + spec distance), carrying a <Strong>match %</Strong> per line, then sums into a per-cloud
              monthly total.
            </P>
            <P>
              The verdict reads like &quot;Re-platforming this Azure BoM to GCP saves ~$X/mo (~Y%)&quot;, and
              because equivalents are spec analogs (not identical SKUs) it flags the average spec-match
              (&quot;validate memory-critical lines&quot;) and any unmapped lines.
            </P>
          </>
        ),
      },
      {
        id: 'price-bom-region',
        q: 'In BoM mode, how is region decided, and how do I read the totals?',
        text: 'bom mode region locked per line view line all percent difference dollar delta cheapest lowest est',
        body: (
          <>
            <P>
              Region is <Strong>locked per BoM line</Strong> — each line prices at the region you committed it
              to, because a real fleet spreads SKUs across regions. So the base-region picker doesn&apos;t appear
              in BoM mode. You can scope to one line (the <Strong>VIEW LINE</Strong> pills) or pick{' '}
              <Strong>All</Strong> to total every line.
            </P>
            <P>
              The per-cloud panel shows each cloud&apos;s whole-BoM monthly total as a bar, with the cheapest
              tagged <Strong>★ lowest</Strong> and the rest showing <Strong>+$X (Y%) more than</Strong> the
              cheapest. An <Mono>est.</Mono> chip means some reserved rates were estimated; &quot;no priced
              lines&quot; means that cloud couldn&apos;t price anything in scope and is excluded.
            </P>
          </>
        ),
      },
      {
        id: 'price-estimated',
        q: 'Why is a price missing or marked "est."?',
        text: 'missing price dash never zero excluded estimated reserved rate payg median discount factor no fabrication',
        body: (
          <>
            <P>
              A <Strong>missing</Strong> price (a &quot;—&quot;, or a line excluded from a total) means no rate
              resolves for that exact SKU + region + term. The tool <Strong>never fabricates a $0</Strong> — an
              unpriceable line is excluded so a partial total is never silently inflated.
            </P>
            <P>
              An <Strong>&quot;est.&quot;</Strong> badge means a reserved (1-yr/3-yr) rate was{' '}
              <Strong>estimated from PAYG</Strong> using that provider&apos;s <em>measured median</em> reserved-to-PAYG
              discount (e.g. AWS ~0.43 for 3-yr), because no published reserved rate existed. PAYG is always real;
              estimates are always badged and never overwrite a real rate.
            </P>
          </>
        ),
      },
      {
        id: 'price-rate-library',
        q: 'What is the Rate library?',
        text: 'rate library per region published rate card anchor vm payg 1yr 3yr cheapest region sorted',
        body: (
          <P>
            The <Strong>per-region rate card</Strong> for one anchor VM. Because the catalog is joined
            provider × region × SKU, the same size has a different rate in every region — the Rate library lists
            them all with <Strong>PAYG / 1-yr / 3-yr per hour</Strong>, sorted cheapest-first and tagging the{' '}
            <Strong>CHEAPEST</Strong> region. Use it to answer &quot;where is this VM cheapest, and what does
            committing save me there?&quot; — a direct look at published rates, no quantity or matching applied.
          </P>
        ),
      },
      {
        id: 'price-cheapest',
        q: 'How does it pick the cheapest cloud and the savings %?',
        text: 'cheapest cloud savings percent gap next runner up narrow under 8 percent modeling noise ranked ascending',
        body: (
          <P>
            It sums each provider&apos;s priced lines and ranks them ascending (a fully-unpriced provider is
            dropped, not shown as $0). The cheapest is #1; the headline names it and the gap to the next. When
            the gap is <Strong>under 8%</Strong> it explicitly cautions it&apos;s &quot;within modeling
            noise — let performance, generation or ecosystem fit decide,&quot; so you don&apos;t over-rotate on a
            rounding-level difference.
          </P>
        ),
      },
    ],
  },
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'region',
    num: '05',
    title: 'Region availability, Coverage & equivalency',
    items: [
      {
        id: 'reg-what',
        q: 'What does the Region availability page show?',
        text: 'region availability where each cloud runs footprint scoreboard overlap map equivalency table not specs',
        body: (
          <P>
            Where on Earth each cloud can run what you care about. It reads as a region filter, a{' '}
            <Strong>scoreboard</Strong> of region counts + market gaps, a <Strong>metro-overlap row</Strong>{' '}
            (served by all / shared / exclusive), a <Strong>map/roster</Strong>, and an integrated{' '}
            <Strong>region-equivalency table</Strong>. It&apos;s about <Strong>availability, not specs</Strong> —
            a region either offers a family/size or it doesn&apos;t, so there&apos;s no &quot;% match&quot; here.
          </P>
        ),
      },
      {
        id: 'reg-equivalent',
        q: 'How are two regions judged "equivalent"?',
        text: 'region equivalent same country gov class within 400 km union find cluster rule data residency',
        body: (
          <>
            <P>Two regions are equivalent when all three hold (<Mono>buildRegionEquivalents</Mono>):</P>
            <UL>
              <li><Strong>Same country.</Strong> Data residency dominates — Azure &quot;West Europe&quot; (Netherlands) ≠ AWS &quot;eu-west-1&quot; (Ireland).</li>
              <li><Strong>Same sovereignty class.</Strong> Government regions only cluster with other gov regions.</li>
              <li><Strong>Within 400 km</Strong> (<Mono>REGION_CLUSTER_KM</Mono>) by great-circle distance.</li>
            </UL>
            <P>
              The clustering is <Strong>union-find with single linkage</Strong>: a region joins a cluster if
              it&apos;s within 400 km of <em>any</em> member. Edge locations (AWS Local Zones / Wavelength) are
              skipped — they have no cross-cloud peer.
            </P>
          </>
        ),
      },
      {
        id: 'reg-pick-expands',
        q: 'When I pick one cloud’s region, why do the other clouds’ equivalents appear?',
        text: 'pick region brings in equivalents geo cluster sydney australia east ap-southeast-2 australia-southeast1 deselect cloud',
        body: (
          <P>
            Because a picked region scopes to its <Strong>geo-equivalence cluster</Strong>, not just its exact
            name. Picking Azure <Strong>&quot;Australia East&quot;</Strong> (Sydney) automatically pulls in{' '}
            <Mono>ap-southeast-2</Mono> and <Mono>australia-southeast1</Mono> (both Sydney), using the same
            same-country-within-400 km rule as the equivalency table. The whole point of the page is cross-cloud
            comparison, so narrowing to &quot;Sydney&quot; should still show all three clouds there.{' '}
            <Strong>The only thing that removes a cloud is deselecting it in setup</Strong> — region picks never
            drop a cloud.
          </P>
        ),
      },
      {
        id: 'reg-scoreboard',
        q: 'What do the scoreboard tiles and "Market gaps" mean?',
        text: 'scoreboard azure aws gcp regions count across super geos market gaps reveal click edge excluded',
        body: (
          <P>
            Each tile counts the distinct regions a cloud offers <Strong>within the current scope</Strong>{' '}
            (edge locations excluded, so AWS shows ~36 real regions, not ~105). &quot;Across N super-geos&quot;
            is how many of AMER/EMEA/APAC it serves in scope. <Strong>Market gaps</Strong> = metros where at
            least one selected cloud has coverage but not <em>every</em> selected cloud does — where the clouds
            you&apos;re comparing diverge. Click a tile to reveal the exact regions.
          </P>
        ),
      },
      {
        id: 'reg-overlap',
        q: 'What do "Served by all", "Shared by two+" and "exclusive" mean?',
        text: 'served by all clouds shared by two exclusive metro overlap tinted unique reach gap',
        body: (
          <P>
            These are <Strong>metro-level</Strong> overlap (each cloud&apos;s regions collapsed to city+country,
            so Azure &quot;East US&quot; and AWS &quot;us-east-1&quot; both count as N. Virginia).{' '}
            <Strong>Served by all</Strong> = every selected cloud is present (deploy-anywhere);{' '}
            <Strong>Shared by two+</Strong> = at least two; <Strong>X exclusive</Strong> = only that one cloud —
            its unique reach, and a competitor&apos;s gap. Tinted by ownership (brand color / purple / green).
          </P>
        ),
      },
      {
        id: 'reg-super-geo',
        q: 'What is a super-geo, and why are Local Zones not counted?',
        text: 'super geo amer emea apac longitude curated middle east edge local zones wavelength not regions inflate',
        body: (
          <>
            <P>
              A <Strong>super-geo</Strong> is the coarse bucket — <Strong>AMER</Strong> (Americas),{' '}
              <Strong>EMEA</Strong> (Europe · Middle East · Africa), <Strong>APAC</Strong> (Asia · Pacific) —
              assigned by a curated override, else a longitude fallback (the Middle East and South Africa are
              hand-stamped EMEA so they don&apos;t misfile).
            </P>
            <P>
              <Strong>AWS Local Zones / Wavelength</Strong> are excluded everywhere because they&apos;re{' '}
              <Strong>edge locations, not regions</Strong> — counting them would inflate AWS from ~36 to ~105 and
              create phantom one-cloud gaps with no Azure/GCP peer.
            </P>
          </>
        ),
      },
      {
        id: 'reg-coverage-vs',
        q: 'What is the Coverage view vs Region availability?',
        text: 'coverage view executive footprint partition exclusive market gap metros editable chips availability map first',
        body: (
          <P>
            Same data, different read. <Strong>Availability</Strong> is map-first — &quot;show me where I can
            deploy this&quot; — with the scoreboard, overlap row and map. <Strong>Coverage</Strong> is
            detail-first — an executive breakdown with each cloud&apos;s Equivalent / Exclusive / Market-gap
            metros named, the region matrix, and an <em>editable</em> category/family/size box so you can
            re-scope without leaving the page.
          </P>
        ),
      },
      {
        id: 'reg-table',
        q: 'How do I read the region equivalency table?',
        text: 'region equivalency table analogous regions one row gap none binary no percent vs vm equivalency score',
        body: (
          <P>
            Each row is one geo-cluster with analogous regions lined up across clouds (Azure &quot;West
            Europe&quot; · AWS &quot;eu-west-1&quot; · GCP &quot;europe-west4&quot;). A filled cell shows that
            cloud&apos;s region(s); an empty <Strong>&quot;— none&quot;</Strong> cell is a real coverage gap.
            There&apos;s <Strong>no % score</Strong> — a region is either an equivalent or it isn&apos;t (unlike
            the <em>VM</em> equivalency table, which does score 0–100).
          </P>
        ),
      },
    ],
  },
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'similarity',
    num: '06',
    title: 'VM matching & the similarity score',
    items: [
      {
        id: 'sim-what',
        q: 'What makes two VMs a match?',
        text: 'category gate same product class then closest size weighted distance philosophy explainable live catalog',
        body: (
          <>
            <P>A match is the closest like-for-like size on another cloud, in two stages:</P>
            <UL>
              <li><Strong>Same category, hard gate.</Strong> Memory-Optimized only matches Memory-Optimized, GPU only GPU. A different category is rejected — a high spec-overlap between fundamentally different machines would be a false signal.</li>
              <li><Strong>Closest spec within that category.</Strong> A weighted distance over up to 12 dimensions picks the smallest-distance candidate.</li>
            </UL>
            <P>
              It&apos;s computed from live catalog specs, not a curated table, so it stays correct as SKUs ship
              and every match is explainable (you can see which dimensions drove the gap).
            </P>
          </>
        ),
      },
      {
        id: 'sim-how',
        q: 'What dimensions are compared, and how are they weighted?',
        text: 'weights table dimensions vcpu memory shape arch generation network disk gpu model vram interconnect tee active weight normalization log ratio',
        body: (
          <>
            <P>
              Distance is a weighted blend. Most axes use a <Strong>log-ratio</Strong> (<Mono>|log₂(a/b)|</Mono>),
              so proportional steps cost the same — 4↔8 vCPU is penalized like 64↔128. The full current weights:
            </P>
            <WeightsTable />
            <P>
              The key trick is <Strong>active-weight normalization</Strong>: the raw distance is divided by the
              sum of the weights that were <em>actually comparable</em> (both sides had the data). So an
              Azure↔AWS pair where Azure carries no processor string still lands on the same 0–1 scale as a
              fully-specced pair — percentages stay comparable instead of being deflated by missing data.
            </P>
          </>
        ),
      },
      {
        id: 'sim-pct',
        q: 'How does a distance become a percentage?',
        text: 'exponential mapping matchPct formula 1.157 floor anchors identical cross arch 2x step never flattens',
        body: (
          <>
            <P>The normalized distance <Mono>d</Mono> becomes a percentage through an exponential mapping:</P>
            <FormulaAndAnchors />
            <P>
              The constant <Mono>k = 1.157</Mono> is calibrated. It floors at 1% for any finite distance, and is
              only ever 0% for a category-gated pair. Exponential decay (not linear) was chosen so a
              perfectly-sized analog in a slightly different family doesn&apos;t collapse to a misleadingly low
              percent, and ranked runners-up stay in true order down the tail.
            </P>
          </>
        ),
      },
      {
        id: 'sim-gpu',
        q: 'How are GPUs compared?',
        text: 'gpu count model class vram interconnect nvlink nvswitch 8 h100 l4 37 percent curated specs inert acceleratorSpecs',
        body: (
          <>
            <P>On four axes, not just count:</P>
            <UL>
              <li><Strong>GPU count</Strong> (3.0) — how many accelerators.</li>
              <li><Strong>GPU model class</Strong> (2.6) — a capability tier (T4 ≈ 1 … H100 ≈ 4.5 … B200 = 6), the dominant defining axis.</li>
              <li><Strong>GPU VRAM</Strong> (1.8) — per-accelerator memory (L4 24 / H100 80 / H200 141 GiB).</li>
              <li><Strong>GPU interconnect</Strong> (1.0) — PCIe &lt; NVLink &lt; NVSwitch.</li>
            </UL>
            <P>
              Before this, GPUs matched on <em>count alone</em>, so an <Strong>8×H100 read ≈100% like an
              8×L4</Strong>. Now that pair reads <Strong>≈37%</Strong> while 8×H100 ↔ 8×H200 stays high. These
              model/VRAM/link terms are <Strong>inert unless both sizes resolve a curated spec</Strong>{' '}
              (<Mono>acceleratorSpecs.ts</Mono>, ~23 GPU families) — unknown accelerators fall back to count +
              size with no fabrication.
            </P>
          </>
        ),
      },
      {
        id: 'sim-tee-disk',
        q: 'How are confidential computing (TEE) and local disk handled?',
        text: 'confidential tee sev-snp tdx dc ec series local disk storage optimized defining nvme weight inert',
        body: (
          <>
            <P>
              <Strong>Confidential / TEE</Strong> (weight 0.6) distinguishes the trusted-execution kind within
              the Confidential category — <Strong>AMD SEV-SNP</Strong> (Azure DCa/ECa) vs <Strong>Intel TDX</Strong>{' '}
              (DCe/ECe). It&apos;s minor because the category gate already separates confidential families, and is
              inert unless both sides resolve a TEE kind.
            </P>
            <P>
              <Strong>Local disk</Strong> (weight 1.5) is the <em>defining</em> axis for Storage-Optimized — two
              storage SKUs can share a vCPU/RAM shape yet target very different work, so matching lines up local
              NVMe, not just CPU and memory. Dormant for every other category.
            </P>
          </>
        ),
      },
      {
        id: 'sim-gate',
        q: 'Why does a different category read 0%, and what is the "via «Category»" fallback?',
        text: 'category gate infinite zero match category effective highmem cross category fallback via marker penalty 0.25 0.30 product group',
        body: (
          <>
            <P>
              Same category is a <Strong>hard gate</Strong> — different categories return an infinite distance
              (0%). Matching uses an <em>effective</em> category (<Mono>matchCategory</Mono>), which can differ
              from the display label: GCP <Mono>-highmem</Mono> shows as General Purpose but matches as Memory
              Optimized, so it correctly pairs with Azure E / AWS r.
            </P>
            <P>
              When a cloud was scoped to a different category than the base, the UI can <Strong>fall back</Strong>{' '}
              at a penalty and flag it <Strong>≠ / &quot;via «Category»&quot;</Strong>. The penalty is{' '}
              <Mono>0.25</Mono> for crossing the gate, plus an extra <Mono>0.30</Mono> when the categories also
              sit in different product groups (accelerated {'{'}GPU, HPC{'}'} · data {'{'}Memory, Storage{'}'} ·
              general {'{'}the rest{'}'}). So Memory↔Storage (same group) reads closer than Memory↔GPU.
            </P>
          </>
        ),
      },
      {
        id: 'sim-arch-gen',
        q: 'How are CPU architecture (Arm vs x86) and generation factored?',
        text: 'architecture arm x86 intel amd graviton ampere axion generation skylake cascade lake genoa within vendor inferred azure naming',
        body: (
          <P>
            Two axes. <Strong>Architecture</Strong> (0.7) prefers Arm↔Arm / AMD↔AMD / Intel↔Intel; when the
            processor string is missing it&apos;s inferred from SKU naming (Azure <Mono>p</Mono>=Arm/<Mono>a</Mono>=AMD;
            AWS <Mono>g</Mono>=Graviton/<Mono>a</Mono>=AMD; GCP <Mono>a</Mono>=Arm/<Mono>d</Mono>=AMD).{' '}
            <Strong>Generation</Strong> (0.35) compares closeness on a vendor&apos;s timeline (Cascade Lake is
            more like another Cascade Lake than like Haswell), <Strong>within the same vendor only</Strong> —
            cross-vendor differences are already captured by architecture. Reads null when no generation can be
            determined; never fabricated.
          </P>
        ),
      },
      {
        id: 'sim-family',
        q: 'How are VM family matches scored?',
        text: 'family best size pair not median rolls up sizes large memory analog surfaces ranked runners up',
        body: (
          <P>
            A family rolls up many sizes, so its score uses the <Strong>best size-pair</Strong> — the single
            strongest size-to-size match into the candidate pool, not a median or an averaged profile. A
            large-memory family whose typical member is far from yours can still hold one near-perfect analog;
            scoring the best pair surfaces it, so the family answers &quot;is there really a size over here that
            lands well&quot; rather than hiding a strong match behind an average.
          </P>
        ),
      },
      {
        id: 'sim-caveats',
        q: 'When is a match a "closest alternative"?',
        text: 'caveat closest alternative stretch not true equivalent different category burstable arch cross confidential peer gpu unknown storage disk unknown gen unknown bare metal asterisk honest amber warning g4 a4 storage skus azure processors curated assumptions',
        body: (
          <>
            <P>
              A high <Strong>≈% match</Strong> means the SIZES line up — but a machine can be a near-shape match
              yet a materially different KIND of thing. When that happens the pick is flagged as a{' '}
              <Strong>closest alternative</Strong> (an amber &quot;⚠&quot; caption or chip, and a{' '}
              <Strong>Comparison caveats</Strong> note on Specs) rather than presented as a like-for-like swap.
              The caveat kinds:
            </P>
            <UL>
              <li><Strong>Different category</Strong> — the analog was surfaced via the cross-category fallback (a &quot;via «Category»&quot; match); the vendor labels it as a different product class.</li>
              <li><Strong>Stretch match</Strong> — a weak overall score, or a ≥4× vCPU/memory size gap; the closest thing on that cloud, not a like-for-like size.</li>
              <li><Strong>Confidential peer</Strong> — one side is a purpose-built confidential family, the other only OFFERS opt-in confidential compute, not a dedicated confidential SKU.</li>
              <li><Strong>Burstable vs standard</Strong> — one side is a burstable, shared-core, credit-based size; the other a standard dedicated-vCPU size.</li>
              <li><Strong>CPU architecture</Strong> — a known Arm↔x86 (or AMD↔Intel) difference; an Arm↔x86 jump likely needs a recompile / image change.</li>
              <li><Strong>GPU unverified</Strong> — a GPU size lacks a curated accelerator spec, so GPU model / VRAM / interconnect could not be compared.</li>
              <li><Strong>Local disk unknown</Strong> — a Storage-Optimized size carries no local-disk figure, so the defining dimension of the category could not be compared.</li>
              <li><Strong>CPU gen unknown</Strong> (info) — the CPU microarchitecture generation could not be read on one side, so that refinement was skipped.</li>
              <li><Strong>Bare metal</Strong> — one side is a whole-server, no-hypervisor size and the other is virtualized.</li>
            </UL>
            <P>
              The known coverage gaps that most often trigger these: newer <Strong>GPU families (g4 / a4)</Strong>{' '}
              lack curated accelerator specs; some <Strong>storage SKUs</Strong> ship without a local-disk figure
              in the feed; and <Strong>Azure processors are curated assumptions</Strong> (the Azure API publishes
              no processor string, so silicon comes from a source-cited map — see{' '}
              <Strong>08 · Data health</Strong>). We surface the gap as an honest asterisk instead of letting a
              green percentage imply an apples-to-apples swap.
            </P>
          </>
        ),
      },
    ],
  },
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'data',
    num: '07',
    title: 'Where the data comes from',
    items: [
      {
        id: 'data-source',
        q: 'Where does the data come from?',
        text: 'public vendor pricing apis azure retail prices aws price list gcp cloud billing keyless specs network rates join no contract',
        body: (
          <P>
            All specs, network and pricing come from each cloud&apos;s <Strong>public vendor APIs</Strong> — no
            internal or contract data: the keyless <Strong>Azure Retail Prices API</Strong>, the keyless{' '}
            <Strong>AWS Price List</Strong>, and the <Strong>GCP Cloud Billing Catalog</Strong> (the only one
            needing a free key). An ingestion job joins <Strong>specs ⨝ network ⨝ rates</Strong> per provider so
            every row carries its real spec, published throughput, and current per-region price.
          </P>
        ),
      },
      {
        id: 'data-refresh',
        q: 'How fresh is it, and how is it refreshed?',
        text: 'baked liveCatalog.generated.json build weekly ci action cron monday as-of date offline no runtime fetch',
        body: (
          <>
            <P>
              The joined result is <Strong>baked into the build</Strong> (<Mono>liveCatalog.generated.json</Mono>),
              so the dashboard is priced out of the box — no runtime fetch, works offline. A{' '}
              <Strong>weekly CI job</Strong> (Mondays 07:00 UTC, plus a manual button) re-pulls every cloud and
              ships a fresh build, re-stamping the as-of date.
            </P>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--tint-soft)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', margin: '0 0 4px' }}>
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Catalog as of</span>
              <span className="font-mono tabular-nums" style={{ fontSize: 13, color: 'var(--interactive)', fontWeight: 600 }}>
                {LIVE_CATALOG_AS_OF}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>— shown in the pill on every CMA page</span>
            </div>
          </>
        ),
      },
      {
        id: 'data-region-exploded',
        q: 'Is the catalog region-specific?',
        text: 'region exploded per region pricing 96000 rows availability deduped 3200 distinct specs matching',
        body: (
          <P>
            Yes. The catalog is <Strong>region-exploded</Strong> — every provider × region × size with a
            published spec and rate is its own row, ~<Strong>96,000 rows</Strong> — because pricing is
            per-region. Specs themselves are region-free, so the matching engine deduplicates to the{' '}
            <Strong>~3,200 distinct sizes</Strong> before ranking: matching compares shapes, while pricing and
            availability read the full region-exploded set.
          </P>
        ),
      },
      {
        id: 'data-upload',
        q: 'Can I use my own data?',
        text: 'public seed proprietary excel upload override edited deleted rows never reset uploads always win byo',
        body: (
          <P>
            Yes. The tool ships public vendor data pre-loaded, but anything you <Strong>upload overrides</Strong>{' '}
            it: once you upload a VM catalog (VM Library), your catalog wins over the baked seed and your edits
            are never silently overwritten by a refresh. Proprietary specs, internal SKUs, contract pricing and
            customer BoMs stay upload-only and never ship in the public build.
          </P>
        ),
      },
    ],
  },
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'health',
    num: '08',
    title: 'Data health',
    items: [
      {
        id: 'health-status',
        q: 'How healthy is the baked data right now?',
        text: 'data health status shard age days sizes specs processor network coverage priced skus awaiting specs manifest freshness per cloud live',
        body: (
          <>
            <P>
              A shard <Strong>manifest</Strong> ships inside every build (baked by the same weekly refresh),
              recording each cloud&apos;s shard age, size count, spec coverage, and how many priced SKUs are still
              awaiting a matching spec. This is the current snapshot:
            </P>
            <DataHealthLines />
            <P>
              The <Strong>processor</Strong> figure is the EFFECTIVE (runtime) coverage — what the app actually
              resolves. Azure&apos;s Resource SKUs API publishes <em>no</em> processor string, so the raw shard is
              0%; the app fills it from a source-cited <Strong>curated map</Strong> keyed by series (see{' '}
              <Strong>06 · &quot;When is a match a closest alternative?&quot;</Strong>), which is why Azure reads a
              high &quot;(curated map)&quot; percentage rather than a misleading 0%. AWS and GCP publish the string
              directly, so their figure is the vendor-published coverage.
            </P>
            <P>
              &quot;Priced SKUs awaiting specs&quot; are rate rows the feed prices but whose spec hasn&apos;t landed
              yet (mostly Azure, whose keyless rate feed runs ahead of the keyed spec pull). They are counted here,
              never faked into the catalog — a row appears only once both its spec and rate are present.
            </P>
          </>
        ),
      },
    ],
  },
];

const SEARCH_BLOBS = SECTIONS.flatMap((s) =>
  s.items.map((it) => ({ sectionId: s.id, id: it.id, hay: `${it.q} ${it.text}`.toLowerCase() })),
);

// ── Accordion card ───────────────────────────────────────────────────────────
function FaqCard({ item, open, onToggle }: { item: FaqItem; open: boolean; onToggle: () => void }) {
  return (
    <div
      style={{
        background: open ? 'var(--surface)' : 'var(--tint-soft)',
        border: `1px solid ${open ? 'var(--border-glow)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 text-left"
        style={{ background: 'transparent', border: 0, padding: '11px 14px', cursor: 'pointer' }}
        aria-expanded={open}
      >
        <span
          className="inline-flex items-center justify-center shrink-0"
          style={{ width: 16, height: 16, fontSize: 13, color: open ? 'var(--interactive)' : 'var(--text-muted)' }}
        >
          {open ? '−' : '+'}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: open ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
          {item.q}
        </span>
      </button>
      {open && <div style={{ padding: '0 14px 12px 33px' }}>{item.body}</div>}
    </div>
  );
}

export function CmaFaqPage({
  focusSection,
  onFocusHandled,
}: {
  /** When set (e.g. 'data' from the public-data pill), that section opens + scrolls into view on mount. */
  focusSection?: string;
  onFocusHandled?: () => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const q = query.trim().toLowerCase();
  // Item ids that match the search (empty query → all).
  const matchIds = useMemo(() => {
    if (!q) return null; // null = no filtering
    return new Set(SEARCH_BLOBS.filter((b) => b.hay.includes(q)).map((b) => b.id));
  }, [q]);
  const glossaryMatches = useMemo(() => {
    if (!q) return GLOSSARY;
    return GLOSSARY.filter((g) => `${g.term} ${g.def}`.toLowerCase().includes(q));
  }, [q]);

  // While searching, auto-expand the matching cards so answers are visible.
  const effectiveOpen = (id: string) => (matchIds ? matchIds.has(id) : open.has(id));

  // Arriving from the public-data pill: open that section's items + scroll to it.
  useEffect(() => {
    if (!focusSection) return;
    const sec = SECTIONS.find((s) => s.id === focusSection);
    if (sec) {
      setOpen((prev) => {
        const next = new Set(prev);
        sec.items.forEach((it) => next.add(it.id));
        return next;
      });
      // let the open state paint, then scroll
      const t = setTimeout(() => sectionRefs.current[focusSection]?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
      onFocusHandled?.();
      return () => clearTimeout(t);
    }
    onFocusHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSection]);

  const visibleSections = SECTIONS.map((s) => ({
    section: s,
    items: s.items.filter((it) => (matchIds ? matchIds.has(it.id) : true)),
  })).filter((s) => s.items.length > 0);
  const glossaryVisible = !q || glossaryMatches.length > 0;
  const nothing = visibleSections.length === 0 && glossaryMatches.length === 0;

  return (
    <div style={{ width: '100%', overflowY: 'auto' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '20px 24px 64px' }}>
        <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
          A complete guide to Cloud Market Analytics: every page (Setup, Specs, Executive Summary, Pricing,
          Region availability) and the engines behind them — how a VM or region on one cloud maps to its closest
          equivalents on the others, how each match is scored, how costs are estimated, and where the data comes
          from. Every score is computed from the published specs, not a hand-curated opinion. Search below, or
          browse the sections; the glossary defines every term.
        </p>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the FAQ & glossary…"
            style={{
              width: '100%',
              fontSize: 13,
              color: 'var(--text-primary)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '9px 32px 9px 12px',
              outline: 'none',
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 0, color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}
            >
              ×
            </button>
          )}
        </div>

        {nothing && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
            No matches for &quot;{query}&quot;.
          </div>
        )}

        {/* FAQ sections */}
        {visibleSections.map(({ section, items }) => (
          <section
            key={section.id}
            ref={(el) => {
              sectionRefs.current[section.id] = el;
            }}
            style={{ marginBottom: 28, scrollMarginTop: 12 }}
          >
            <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
              <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--interactive)' }}>
                {section.num}
              </span>
              <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                //
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                {section.title}
              </span>
            </div>
            <div className="space-y-1.5">
              {items.map((it) => (
                <FaqCard
                  key={it.id}
                  item={it}
                  open={effectiveOpen(it.id)}
                  onToggle={() =>
                    setOpen((prev) => {
                      const next = new Set(prev);
                      if (next.has(it.id)) next.delete(it.id);
                      else next.add(it.id);
                      return next;
                    })
                  }
                />
              ))}
            </div>
          </section>
        ))}

        {/* Glossary */}
        {glossaryVisible && (
          <section ref={(el) => { sectionRefs.current['glossary'] = el; }} style={{ scrollMarginTop: 12 }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
              <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--interactive)' }}>
                {String(SECTIONS.length + 1).padStart(2, '0')}
              </span>
              <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                //
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Glossary
              </span>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '4px 16px' }}>
              <dl style={{ margin: 0 }}>
                {glossaryMatches.map((g, i) => (
                  <div
                    key={g.term}
                    className="grid"
                    style={{ gridTemplateColumns: '180px 1fr', gap: 16, padding: '12px 0', borderTop: i === 0 ? 'none' : '1px solid var(--border)', alignItems: 'baseline' }}
                  >
                    <dt style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{g.term}</dt>
                    <dd style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: 'var(--text-secondary)' }}>{g.def}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
