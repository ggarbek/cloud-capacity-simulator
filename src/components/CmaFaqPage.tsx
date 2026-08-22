/**
 * CmaFaqPage — the FAQ + Glossary for Cloud Market Analytics.
 *
 * Structured after a reference "Library" wiki: a top search box, then NUMBERED
 * sections ("01 // …") whose entries are click-to-expand accordion cards, plus
 * a filtered glossary at the end. Search filters questions, answers AND glossary
 * terms in real time; matching cards auto-expand. Everything is grounded in the
 * live source — the weights / formulae quote `src/utils/equivalence.ts`, the
 * penalties quote `vmCategory.ts` + `crossCloudEquivalency.ts`, and the as-of
 * date is read from `liveCatalog.ts`. Colors are CSS custom properties so it
 * themes in light + dark.
 *
 * Section ids are a CONTRACT — `start` / `specs` / `exec` / `pricing` / `region`
 * / `similarity` / `markers` / `data` / `health` are deep-linked from Start Here
 * and from the public-data pill (`focusSection`). `design` (10) is additive and
 * not deep-linked. Add sections and items freely;
 * never rename or remove an existing id. Altitude rule: explain what a thing
 * MEANS, why it matters to a decision, and how to read it — algorithm internals
 * belong in the engine's own comments, not here.
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
  { term: 'Focus (setup)', def: 'The last setup card — Compare VMs / Compare pricing / Explore regions / Executive Summary. It only decides where the Continue button lands; it changes no numbers.' },
  { term: 'Skip (setup step)', def: 'Leaves a step unfiltered rather than empty. Skipping Category or VM family means "any", which widens the candidate pool instead of blocking the comparison.' },
  { term: 'Best match (toggle)', def: 'On the Category and VM family steps: auto-picks each non-base cloud’s closest analog to your base pick and locks those pickers so the comparison can’t drift onto a worse-matching family. Switching it off returns the pickers and removes the rows it added.' },
  { term: 'Auto-fill', def: 'Picking a size, family or region on one cloud fills the other clouds’ EMPTY slots with their closest equivalent. It never overwrites something you chose yourself.' },
  { term: 'Comparison row', def: 'One line of the comparison table: row N pairs the Nth pick from every cloud, with the base cell as the reference and the others carrying a ≈% against it. Drag a cell to re-pair it, or ✕ to remove it.' },
  { term: 'Compare dock', def: 'The comparison strip that follows you across Specs, Pricing and Executive Summary. It holds the mode switch and the row/line selector, and shrinks to a corner bubble as you scroll.' },
  { term: 'Comparison mode', def: 'The dock mode in which every page answers questions about the sizes you picked in setup — one comparison row at a time.' },
  { term: 'VM BoM mode', def: 'The dock mode in which every page answers questions about your whole committed Bill of Materials, each line ported to its best-match SKU on each cloud.' },
  { term: 'VIEW ROW / VIEW LINE / All', def: 'The dock’s scope stepper. VIEW ROW picks a comparison row, VIEW LINE picks one BoM line, and All (BoM only) totals every line at once.' },
  { term: 'Anchor VM', def: 'The single base-cloud size the one-VM views point at (Pricing rate bars, Rate library, the reference tables) — the base pick on the active row.' },
  // Specs / Exec
  { term: '≈% / similarity match', def: 'A 0–100 strength score for an equivalence: 100 = identical spec, lower = more different. Derived from the weighted spec distance, not a curated opinion.' },
  { term: '★ leader (Specs bar)', def: 'The cloud holding the highest value in a single Specs metric row; its bar is full-opacity and its value bold. A per-row fact, not an overall verdict.' },
  { term: '★ Stands out', def: 'The one dimension a VM clearly leads the comparison on (GPU, bare-metal, local NVMe, newest within-vendor generation, network, memory density, or Arm). Suppressed on ties.' },
  { term: '★ Best at X', def: 'A situational Executive-Summary tag for a dimension a VM actually wins (Best price / Most vCPU / Most memory / Highest network). There is no single overall winner.' },
  { term: 'Microarchitecture span', def: 'A slashed CPU label (e.g. "Cascade Lake / Ice Lake") meaning the family runs on either microarchitecture — the host decides, you don’t — and both rank as the same generation.' },
  { term: 'Coarse processor (Azure)', def: 'An approximate CPU label shown for Azure sizes whose exact generation can’t be pinned (Azure’s catalog carries no processor string); display-only, never affects matching.' },
  { term: 'Unverified vendor claim', def: 'A vendor "up to X%" marketing figure that failed independent verification; shown as an honest amber caveat, attributed and linked to the vendor’s page, not corroborated by us.' },
  { term: 'Spec delta (vs base)', def: 'A plain-language per-dimension difference between an equivalent and the base pick, with ↑ (better) / ↓ (worse) direction.' },
  { term: 'Spec showdown', def: 'The Specs table that puts the base column first and one column per equivalent, one row per spec. The best value in each row is bolded and tinted; the base column has no delta because it is the reference.' },
  { term: 'GiB / vCPU', def: 'Memory per vCPU — the shape of the machine rather than its size. It is what separates a standard size from a high-memory or high-CPU one at the same vCPU count.' },
  { term: 'Delta vs base (±%)', def: 'The small "+25% vs base" line under a Spec-showdown cell: how much more or less of that spec you get compared with the base pick.' },
  { term: 'How we match', def: 'The short methodology strip on Specs. It states the whole pipeline in one line — same-category gate, then weighted spec distance, then a 0–100 similarity — and expands into the per-pairing detail.' },
  { term: 'Match driver chip', def: 'A chip like "memory 41%" inside How we match: roughly how much of the total spec gap between two sizes that one dimension accounts for. It tells you where a match is weak, not just that it is.' },
  { term: '▼ Trails on', def: 'The amber counterpart of ★ Stands out — the dimension a pick is clearly weakest on in this comparison. Both are per-comparison facts, not product judgements.' },
  { term: 'Best for', def: 'A one-line statement of the workload shape a family is built for (in-memory databases, batch compute, inference…). Editorial context, not a computed score.' },
  { term: 'Nuance chip', def: 'A short label on a per-cloud education column flagging something worth knowing about the family (credit-based CPU, host-dependent silicon, no local disk). The full sentence is on hover.' },
  { term: 'Comparison caveats', def: 'The amber box on Specs listing, per cloud, where the picks differ in KIND rather than in size. Read it before treating a high ≈% as a drop-in swap.' },
  { term: 'Closest alternative', def: 'The label for a pick that is the nearest thing on that cloud but not a like-for-like equivalent. It is a warning about the comparison, not about the VM.' },
  { term: 'Overall score (/100)', def: 'The number in a contender card’s "why pick this" line: an equal-weighted blend of vCPU, memory and network (each against the leader) and price (against the cheapest). A rough balance indicator, deliberately not a verdict.' },
  { term: 'Cheapest option / Cheapest total', def: 'The lowest monthly cost among the clouds that actually priced, at your commitment term. "Cheapest option" is one size in Comparison mode; "Cheapest total" is the whole BoM in VM BoM mode.' },
  { term: 'Savings vs base', def: 'Monthly dollars (and percent) you would save by moving from the base cloud to the cheapest one. It reads "—" whenever the two totals are not comparable — see suppressed savings.' },
  { term: 'Avg spec match', def: 'The mean ≈% of the compared picks against the base. In VM BoM mode it is quantity-weighted, so a 500-VM line counts more than a 2-VM line.' },
  { term: 'Regions covered', def: 'In Comparison mode, how many distinct regions the compared clouds run in. In VM BoM mode, how many distinct regions your BoM actually deploys into — the same label, two different questions.' },
  { term: 'Market posture', def: 'The Executive-Summary strip naming metros each rival serves that your base cloud does not. Counted market-wide across all sizes, so it will not match the size-scoped figure on Region availability.' },
  { term: 'Commitment savings (step-down)', def: 'The compact chart showing what each cloud’s rate steps down to at 1-year and 3-year commitment versus PAYG. It answers "is committing worth it here?" without leaving the briefing.' },
  { term: 'What you get vs what you give up', def: 'The per-cloud trade-off column: up to three signature traits you gain (+) and one thing you give up (−) relative to the base. The base column never shows a give-up line.' },
  { term: 'Assumptions footer', def: 'The amber one-liner under the briefing naming every assumption in play (estimated rates, assumed processors, stretch analogs, excluded lines). It renders nothing when the comparison is clean.' },
  { term: 'Line-port', def: 'One BoM line evaluated on one cloud. A 20-line BoM across three clouds is 60 line-ports, which is why "N of M line-ports matched" uses a bigger denominator than the line count.' },
  { term: 'Qty-weighted match', def: 'A BoM-level average ≈% in which each line counts in proportion to its VM quantity, so the score reflects your real fleet rather than your line count.' },
  { term: 'Lines matched', def: 'How many BoM lines found an in-category equivalent on every cloud in scope. Anything short of the full count means some lines are excluded from some totals.' },
  { term: 'Cost composition', def: 'The BoM view of where the money is: which lines and which clouds make up the monthly total, rather than a single headline figure.' },
  { term: 'Per-line best-at', def: 'A per-BoM-line list of which cloud prices that line lowest. Useful when the whole-BoM winner is not the winner on the lines you care most about.' },
  { term: 'Exec brief export', def: 'The Executive Summary’s "Export brief" control, which writes the same verdict, evidence, coverage and assumptions into a .pptx deck or a .docx document.' },
  // Matching engine
  { term: 'Weighted distance', def: 'The blended spec gap between two sizes: each dimension’s difference times its weight, summed over up to 12 dimensions.' },
  { term: 'Log-ratio distance', def: 'Measuring a spec gap as |log₂(a/b)| so proportional steps (4↔8, 64↔128) cost the same regardless of absolute size.' },
  { term: 'Active-weight normalization', def: 'Dividing the raw distance by the weights of only the dimensions both sides could compare, so scores stay comparable even when data (e.g. Azure’s missing processor string) is absent.' },
  { term: 'Category gate', def: 'The hard rule that two sizes must share a (match) category to match; different categories return 0%.' },
  { term: 'Match category', def: 'The effective category used for matching (e.g. GCP -highmem upgraded to Memory Optimized), which can differ from the vendor label shown in the UI.' },
  { term: 'Cross-category fallback (≠ / "via «Category»")', def: 'An opt-in mode allowing a different-category substitute when a cloud was scoped away from the base’s category. The match is marked down, and marked down further the further apart the two product classes are.' },
  { term: 'Soft-penalty term', def: 'A distance term (GPU model/VRAM/interconnect, TEE) gated to its category and inert unless both sides carry curated data — it refines rather than gates.' },
  { term: 'TEE (Trusted Execution Environment)', def: 'Hardware confidential compute — AMD SEV-SNP or Intel TDX; the TEE term distinguishes the two within the Confidential category.' },
  { term: 'Best size-pair', def: 'A family’s score = the single strongest size-to-size match into the candidate pool, not a median or averaged profile.' },
  { term: 'Decay constant (k = 1.157)', def: 'The exponent in match% = 100·exp(−k·d) that converts a normalized distance to a percentage.' },
  { term: 'Match bands (85 / 65)', def: 'How every ≈% pill is coloured: 85 and above reads green (treat as like-for-like), 65–84 amber (usable, check the deltas), below 65 red (materially different machine).' },
  { term: 'Stretch match', def: 'A caveat raised when a match scores below 40% or one side is 4× the other on vCPU or memory. It is the closest thing on that cloud, not a comparable size.' },
  { term: 'Burstable', def: 'A shared-core, credit-based size (Azure B, AWS T, GCP E2/shared) whose sustained CPU is throttled by an earned credit balance. Comparing one to a dedicated-vCPU size raises a caveat.' },
  { term: 'Bare metal', def: 'A whole physical server with no hypervisor. Matching one against a virtualized size raises a caveat because the operating model, not just the spec sheet, differs.' },
  { term: 'Match caveat', def: 'A short amber (warn) or grey (info) chip stating a specific reason a pairing is not a clean swap. The one-sentence explanation is on hover; all nine kinds are listed in section 06.' },
  { term: 'Caveat severity (warn / info)', def: 'Amber "warn" means the two machines differ in a way that can change your plan. Grey "info" means a dimension simply could not be checked. Warn caveats sort first, so the top chip is always the one that matters most.' },
  { term: 'Worst caveat', def: 'The single most important asterisk on a pairing — the highest-severity caveat, tie-broken by a fixed order. It is what a tight space (a chip row, an exported line) shows when there is only room for one.' },
  { term: 'Different category (caveat)', def: 'The analog is filed under a different product class than your base pick and was only surfaced by the cross-category fallback. Read it as "the closest thing that exists, in a different aisle."' },
  { term: 'Confidential peer (caveat)', def: 'One side is a purpose-built confidential family (Azure DC-series / EC-series); the other is a family that merely SUPPORTS confidential compute as an opt-in on capable silicon. Similar capability on paper, a different product to buy and operate.' },
  { term: 'Burstable vs standard (caveat)', def: 'One side earns CPU credits and throttles when they run out; the other holds its vCPUs outright. A high ≈% here is comparing a machine that can sustain your load with one that may not.' },
  { term: 'CPU architecture (caveat)', def: 'The two sides run different CPU architectures. Arm↔x86 is amber because it usually means a recompile or a new image; Intel↔AMD is grey because it usually does not.' },
  { term: 'GPU unverified (caveat)', def: 'One side is a GPU size with no curated accelerator entry, so model, VRAM and interconnect could not be compared. The score reflects accelerator count and machine size only.' },
  { term: 'Local disk unknown (caveat)', def: 'A Storage-Optimized size arrived with no local-disk figure, so the defining dimension of that whole category sat out of the comparison.' },
  { term: 'CPU gen unknown (caveat)', def: 'Information-only: the CPU generation could not be read on one side, so that refinement was skipped. It lowers how INFORMED the score is, not how good the match is.' },
  { term: 'Stretch match (caveat)', def: 'The caveat form of a stretch: below 40% overall, or one side roughly 4× the other on vCPU or memory. The closest thing on that cloud, not a comparable size.' },
  { term: 'Bare metal (caveat)', def: 'One side is a whole physical server and the other is virtualized. The operating model differs even where the spec sheet lines up.' },
  { term: 'SEV-SNP vs TDX', def: 'The two confidential-compute technologies the tool distinguishes: AMD SEV-SNP (Azure DCa / ECa families) and Intel TDX (DCe / ECe). Both encrypt memory from the host; they are not interchangeable if your attestation tooling targets one of them.' },
  { term: 'Confidential-capable (opt-in)', def: 'A general-purpose family that CAN run confidential compute as an option on capable silicon, as distinct from a dedicated confidential SKU. Pairing one with the other raises the Confidential peer caveat.' },
  { term: 'Equivalency seed', def: 'The shipped set of widely-accepted cross-cloud mappings used to pre-fill picks. It is a starting opinion, not vendor doctrine, and anything you author overrides it.' },
  { term: 'Equivalency template', def: 'The downloadable Excel sheet (Azure SKU · AWS SKU · GCP SKU · Notes) for hand-authoring the mappings. Re-uploading it REPLACES the whole table rather than merging into it.' },
  // Region
  { term: 'Region equivalency', def: 'Two regions treated as analogs because they’re in the same country, same sovereignty class, and within 400 km of each other; lets cross-cloud peers line up on one row.' },
  { term: 'Geo-cluster', def: 'A group of regions merged by union-find (same country + gov class + ≤ 400 km). Picking any region scopes the page to its whole cluster across clouds.' },
  { term: 'Region cluster radius (400 km)', def: 'The maximum straight-line distance for two same-country regions to count as equivalent and cluster together on one row.' },
  { term: 'Super-geo', def: 'One of three coarse buckets — AMER (Americas), EMEA (Europe · Middle East · Africa), APAC (Asia · Pacific) — used to group regions.' },
  { term: 'Edge region / Local Zone', def: 'AWS satellite sites (us-east-1-bos-1, …-wl1-…) attached to a parent region; excluded from region counts because they aren’t full regions and have no cross-cloud peer.' },
  { term: 'Market gap', def: 'A metro where at least one compared cloud has a region but not every compared cloud does — the unique-reach / missing-coverage signal.' },
  { term: 'Metro', def: 'A region collapsed to its datacenter city + country (N. Virginia, Sydney); the unit for overlap math, since one metro can host several regions on one cloud.' },
  { term: 'Government (sovereign) region', def: 'A region restricted to public-sector workloads. Gov regions only ever cluster with other gov regions, so a commercial region is never offered as their equivalent.' },
  { term: 'Overlap buckets', def: 'The three ways a metro can be held: Served by all (every selected cloud), Shared by two+ (at least two), and Exclusive (only one). Color-coded green / purple / that cloud’s own brand color.' },
  { term: 'Footprint boxes', def: 'The per-cloud Coverage breakdown into Equivalent (cities a competitor also holds), Exclusive (only this cloud) and Market gaps (cities competitors hold and this one does not).' },
  { term: 'Reconciliation line', def: 'The arithmetic printed under the overlap cards — served-by-all plus shared plus exclusive equals the base cloud’s total regions — so you can check the buckets add up rather than trust them.' },
  { term: 'Region availability matrix', def: 'The location-by-cloud grid where a cell reads "✓ N VMs" when that cloud offers something in your current filter there, and "·" when it offers nothing. One row per metro.' },
  { term: 'Availability-only row', def: 'A (region, family) the vendor publishes but the rate feed has not priced yet. It counts as available, with its price left empty — availability is answered from the vendor’s published coverage, never inferred from whether a price happened to arrive.' },
  { term: 'Published availability table', def: 'The per-region family list parsed from each vendor’s own coverage documentation. It is what the availability answers are built from, and a build-time check fails the build if it drifts from the vendor doc.' },
  { term: 'Great-circle distance', def: 'Straight-line distance across the surface of the Earth between two regions’ datacenter cities — the measure used, after country, to decide whether two regions cluster as equivalents.' },
  { term: 'Why equivalent', def: 'The rationale column on the line-by-line region equivalency table, stating in words why regions were clustered (same country, distance apart, which cloud is missing). Scan it to spot a mismatch.' },
  { term: 'Muted cloud', def: 'A cloud hidden from the Region page only. Muting is a page-local view change; your Comparison setup keeps the cloud, unlike deselecting it in setup.' },
  { term: 'Pinned region', def: 'A map marker you clicked to keep open, with its exact coordinates and super-geo below the map. Cmd/Ctrl or Shift-click pins several at once.' },
  { term: 'Scope (filter chips)', def: 'The category / family / size chips that narrow every count on the Region page. Chips of the same kind widen the scope (OR); chips of different kinds narrow it (AND).' },
  // Pricing
  { term: 'PAYG', def: 'Pay-as-you-go on-demand pricing with no commitment — the published hourly rate. Always a real figure, never estimated.' },
  { term: 'Reserved / committed term (1-yr, 3-yr)', def: 'A discounted rate in exchange for a 1- or 3-year usage commitment; deeper discount for the longer term.' },
  { term: 'Bill of Materials (BoM)', def: 'Your committed VM demand — a list of {VM size, quantity, region} lines authored on the VM Demand tab.' },
  { term: 'Region auto-match (~1000 km)', def: 'On Pricing, the other clouds’ region is auto-resolved to the nearest equivalent of the base region — same country or within ~1000 km, else excluded with an alert.' },
  { term: 'Estimated rate ("est.")', def: 'A reserved rate modeled from PAYG × the provider’s measured median RI/PAYG discount when no published reserved rate exists; always badged, never overwrites a real rate.' },
  { term: 'Rate library', def: 'The per-region published PAYG / 1-yr / 3-yr rate card for a single anchor VM, sorted cheapest-region-first.' },
  { term: 'List price', def: 'The vendor’s published rate. Everything priced here is list — no negotiated discount, enterprise agreement, spot or savings-plan pricing is applied.' },
  { term: 'Term labels', def: 'Three spellings of the same three tiers: PAYG / 1-yr / 3-yr on controls, PAYG / 1y RI / 3y RI on chips, pay-as-you-go / 1-year reserved / 3-year reserved in prose.' },
  { term: 'Run duration', def: 'How long you intend to run the VMs — the multiplier that turns an hourly rate into a total. It can be set in months or hours; switching the unit resets the value to that unit’s default.' },
  { term: 'Horizon (1 mo / 1 yr / 3 yr)', def: 'A fixed look-ahead window used by the cost tables, independent of your run duration: what the same rate accumulates to over one month, one year and three years.' },
  { term: 'Normalized unit rate', def: 'Cost restated as $/vCPU/month and $/GiB/month. When the compared sizes are not the same shape, this is the honest comparison basis — the raw monthly total is not.' },
  { term: 'Unmatched line ("no analog")', def: 'A BoM line with no in-category equivalent on a cloud. That cloud cannot price it at all, so the line is excluded from that cloud’s total.' },
  { term: 'Unpriced line', def: 'A BoM line that DID find an equivalent, but no rate resolves for that SKU, region and term. Also excluded from the total — a different failure from "no analog".' },
  { term: 'Fully priced', def: 'A cloud whose total includes every line of the BoM. A savings figure is only stated when both the base and the winner are fully priced.' },
  { term: 'Suppressed savings', def: 'The deliberate withholding of a savings number when the two totals are not comparable. The screen names the reason and lists the excluded lines instead of showing a smaller-looking figure.' },
  { term: 'Applied rate label', def: 'The small "3y RI" / "1y RI" / "PAYG" tag on a normalized or horizon figure, naming which rate tier actually produced it. When a cloud publishes no rate at your chosen term, the figure falls back to PAYG and says so rather than reading as a committed price.' },
  { term: '★ lowest', def: 'The tag on the cheapest cloud in a cost panel; the others read "+$X (Y%) more than" it. It ranks only the clouds that actually priced.' },
  // Data
  { term: 'Region-exploded catalog', def: 'One catalog row per provider × region × size (~96k rows), because pricing is per-region; deduped to ~3.2k distinct specs for matching.' },
  { term: 'As-of date', def: `The date the baked public pricing + specs were last pulled and shipped in the build. Currently as of ${LIVE_CATALOG_AS_OF}; refreshed weekly by CI.` },
  { term: '(est.) marker', def: 'Marks a figure we modeled rather than read from the vendor: a reserved rate derived from PAYG, or a network throughput taken from a curated fallback. Treat it as directional.' },
  { term: '(assumed) marker', def: 'Marks a processor filled in from a source-cited curated map or inferred from the SKU name, because the vendor publishes no processor string. Display-only; it never changes a match score.' },
  { term: '(inferred) generation', def: 'A CPU generation deduced from the SKU naming rather than read from a published processor string. Shown so you know the generation line is a deduction.' },
  { term: 'host-dependent', def: 'Marks a family scheduled across two silicon options — the cloud decides which host you land on, you do not. Both options rank as the same generation.' },
  { term: 'Shard', def: 'One cloud’s slice of the baked catalog. Each shard carries its own pull date, which is what the Data-health section reports as "days old".' },
  { term: 'Priced SKUs awaiting specs', def: 'Rate rows that arrived before their matching spec row. They are counted honestly in Data health and kept OUT of the catalog until both halves are present.' },
  { term: 'Curated processor map', def: 'The source-cited table that fills Azure’s missing processor strings by series. It is why Azure reports high processor coverage instead of 0%, and why those values carry "(assumed)".' },
  { term: 'Coverage guard', def: 'A build-time check that diffs the vendor docs against the curated region/family tables and fails the build when they drift. It runs in CI, not on screen.' },
  { term: 'Integrity gate (shard validator)', def: 'The check that runs between a fresh weekly pull and the moment it would be published. If the new data is worse than the data already shipped, the gate fails the refresh and the last known-good data stays live.' },
  { term: 'Row-shrink check', def: 'One of the integrity gates: a cloud’s spec, network or rate row count may not fall more than 5% against the previous good pull. It catches a vendor API returning a truncated set.' },
  { term: 'Coverage-drop check', def: 'One of the integrity gates: processor or network coverage may not fall more than one percentage point against the previous good pull. It catches a quiet regression in what the feed carries.' },
  { term: 'Unjoined-rate ceiling', def: 'One of the integrity gates: a cap on the share of priced SKUs still awaiting a spec. Crossing it means the two halves of the feed have drifted apart, and the refresh fails rather than shipping a half-joined catalog.' },
  { term: 'Schema check', def: 'One of the integrity gates: a sample of fresh records is checked field by field, so a vendor changing a field name fails the refresh instead of silently emptying a column.' },
  { term: 'Keyed shard', def: 'A data pull that needs a credential (Azure specs, GCP rates). When the credential is absent the refresh SKIPS that pull and keeps the last good shard, so the build never breaks — it just ages.' },
  { term: 'Staleness warning (30 days)', def: 'A warning raised when a keyed shard has gone more than 30 days without a refresh because its credential is missing. It warns, never fails — the gate is a separate thing.' },
  { term: 'Last known-good data', def: 'The data already committed and shipping. Every integrity gate is written to preserve it: a bad pull is discarded, not merged, so the worst outcome of a failed refresh is data that is old rather than data that is wrong.' },
  // Family knowledge / education
  { term: 'Family profile', def: 'The short write-up under a family: what it is, a few spec-derived key points, what it is best for, when to pick it, its cross-cloud analogs, and a link to the vendor’s own page.' },
  { term: 'When to pick', def: 'The accented line in a family profile giving the practical selection rule for that family, sourced from the vendor’s own documentation. It appears only for families that carry a curated entry.' },
  { term: 'Analogs line', def: 'The "≈ Azure … · GCP …" line in a family profile — a hand-authored, widely-accepted cross-cloud reading of that family. Editorial context; it does not feed the computed ≈% score.' },
  { term: 'Curated family entry', def: 'One of roughly sixty families with a sourced write-up attached. Families without one still get a profile derived from their own specs — they simply carry no "when to pick" line and no vendor link.' },
  // Exports
  { term: 'Export brief', def: 'The Executive Summary’s download control. It writes a .pptx deck or a .docx document, in whichever mode you are in, from the same computed values the page is displaying.' },
  { term: 'Leadership arc', def: 'The fixed seven-part order every exported brief follows — verdict, recommendation, cost story, get vs give up, evidence, coverage, risks and methodology — identical in both modes so a reader always knows where to look.' },
  { term: 'Risks & methodology page', def: 'The last part of every exported brief: every estimate, assumption, caveat, excluded line and withheld savings figure gathered in one place, so nothing the screen disclosed goes missing in the deck.' },
  // Scope of the tool
  { term: 'Client-side', def: 'Computed in your own browser. The comparison engines, the pricing math and the export generators all run locally; the app fetches only its own shipped data files.' },
  { term: 'Proof of concept', def: 'What this tool is: a demonstration of a method for quantifying and managing capacity, built on real public data. It is deliberately a decision aid, not a billing system, and never a quote.' },
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
    title: 'Getting started: setup, modes & navigation',
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
        id: 'start-where',
        q: 'Which page answers which question?',
        text: 'which page navigation rail start here setup executive summary specs pricing region availability coverage rate library faq map of the tool where do i go',
        body: (
          <>
            <P>Each page answers one question. Pick the page by the question you have:</P>
            <UL>
              <li><Strong>Start Here</Strong> — &quot;what is this half of the tool, and can I see a worked example?&quot;</li>
              <li><Strong>Comparison Setup</Strong> — &quot;what am I comparing?&quot; Everything downstream reads from here.</li>
              <li><Strong>Executive Summary</Strong> — &quot;what should I do?&quot; The verdict, in one screen, exportable.</li>
              <li><Strong>Specs</Strong> — &quot;what actually differs?&quot; The hardware evidence behind the verdict.</li>
              <li><Strong>Pricing</Strong> — &quot;what does it cost, and is committing worth it?&quot;</li>
              <li><Strong>Region availability</Strong> — &quot;where can I run it, and where can&apos;t I?&quot;</li>
              <li><Strong>Coverage</Strong> — the same footprint data read as an executive breakdown rather than a map.</li>
              <li><Strong>Rate library</Strong> — &quot;where is this one VM cheapest?&quot;</li>
              <li><Strong>FAQ &amp; Glossary</Strong> — this page.</li>
            </UL>
            <P>
              The rough order of work is <Strong>Setup → Executive Summary → Specs / Pricing / Region</Strong>:
              get the verdict first, then drill into whichever evidence you doubt.
            </P>
          </>
        ),
      },
      {
        id: 'start-modes',
        q: 'What is the difference between Comparison mode and VM BoM mode?',
        text: 'comparison mode vm bom mode dock toggle one size vs whole fleet bill of materials view row view line all scope switch',
        body: (
          <>
            <P>
              Two ways to ask the same questions, switched on the{' '}
              <Strong>compare dock</Strong> — the strip that follows you across Specs, Pricing and the
              Executive Summary.
            </P>
            <UL>
              <li>
                <Strong>Comparison</Strong> — the pages answer for the <Strong>sizes you picked in setup</Strong>,
                one comparison row at a time. Use it when you have a machine in mind
                (&quot;is there a better home for this size?&quot;).
              </li>
              <li>
                <Strong>VM BoM</Strong> — the pages answer for your <Strong>whole committed Bill of
                Materials</Strong>, every line ported to its best-match SKU on each cloud. Use it when the
                question is portfolio-scale (&quot;what would re-platforming this fleet cost?&quot;).
              </li>
            </UL>
            <P>
              The dock&apos;s stepper reads <Mono>VIEW ROW</Mono> in Comparison mode and{' '}
              <Mono>VIEW LINE</Mono> (plus <Mono>All</Mono>) in BoM mode. A mode pill is{' '}
              <Strong>greyed out</Strong> when the data behind it doesn&apos;t exist — no comparison rows, or no
              committed BoM. Switching modes resets the active row, and BoM mode is only offered when the
              objective is <em>Compare VM sizes</em>.
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
        id: 'start-bestmatch',
        q: 'What does the "Best match" toggle do, and why did my pickers lock?',
        text: 'best match toggle auto select closest analog locks pickers read only chips auto rows disappear turn off',
        body: (
          <>
            <P>
              <Strong>Best match</Strong> (on the Category and VM family steps) auto-picks each non-base
              cloud&apos;s <Strong>closest analog to your base pick</Strong> and shows it as a read-only chip with
              its ≈%. The pickers lock on purpose: with the toggle on, the tool is asserting &quot;this is the
              fairest comparison available&quot;, and letting you hand-pick a worse-matching family would quietly
              undermine every number downstream.
            </P>
            <P>
              Turn it <Strong>off</Strong> to get the dropdowns back and choose freely. Note that the comparison
              rows Best match added are tagged as automatic and are <Strong>removed when you switch it
              off</Strong> — rows you picked yourself always survive. A <Mono>⚠</Mono> on an auto chip means the
              closest analog is still a stretch; hover it for the reason.
            </P>
          </>
        ),
      },
      {
        id: 'start-autofill',
        q: 'I picked one VM and three appeared — why?',
        text: 'auto fill prefill picked one vm three appeared other clouds populated equivalency seed empty slots never overwrite region family',
        body: (
          <P>
            That is <Strong>auto-fill</Strong>. Picking a size, family or region on one cloud fills the other
            clouds&apos; <Strong>empty</Strong> slots with their closest equivalent — from the shipped equivalency
            seed first, then from a computed closest-spec match — so a comparison exists the moment you make one
            choice. It <Strong>never overwrites a pick you made yourself</Strong>: clear or change any auto-filled
            cell and your choice stands. If you would rather see nothing until you choose it, remove the filled
            cells; they will not come back unless the base pick changes.
          </P>
        ),
      },
      {
        id: 'start-rows',
        q: 'How does the comparison table decide which VMs sit on the same row?',
        text: 'comparison table rows pair nth pick each cloud zip drag re-pair remove x base cell reference numbered rows',
        body: (
          <P>
            By position: <Strong>row N pairs the Nth pick from every cloud</Strong>. The base cloud&apos;s cell is
            the reference for that row, and the other cells show their ≈% against it — so pairing determines what
            gets compared to what. If the automatic pairing lines up the wrong two machines,{' '}
            <Strong>drag a cell onto another row</Strong> to re-pair it, or use <Mono>✕</Mono> to drop it. Every
            downstream page reads the <em>active</em> row, which you choose on the dock.
          </P>
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
        id: 'specs-showdown',
        q: 'How do I read the Spec showdown table?',
        text: 'spec showdown table rows vcpu memory gib per vcpu network local nvme processor gpu dollars per month best value highlighted delta vs base rows disappear',
        body: (
          <>
            <P>
              The showdown puts the <Strong>base column first</Strong> and one column per equivalent, with one row
              per spec: <Strong>vCPU, Memory, GiB / vCPU, Network, Local NVMe, Processor, GPU</Strong> and{' '}
              <Strong>$/mo</Strong> at your commitment term. The <Strong>best value in each row</Strong> is bolded
              and tinted, and every non-base cell carries a small <Mono>+25% vs base</Mono> line — how much more
              or less of that spec you get if you switch.
            </P>
            <P>
              <Strong>GiB / vCPU</Strong> is the row people skip and shouldn&apos;t: it describes the machine&apos;s{' '}
              <em>shape</em> rather than its size, and it is what separates a standard size from a high-memory one
              at the same vCPU count. A row is <Strong>omitted entirely</Strong> when no cloud reports a value —
              so a missing GPU or $/mo row means &quot;nobody has this&quot;, not &quot;zero&quot;.
            </P>
          </>
        ),
      },
      {
        id: 'specs-howmatch',
        q: 'What is the "How we match" strip and what do the driver chips tell me?',
        text: 'how we match strip methodology three stages category gate weighted spec distance percent similarity driver chips dimension accounts for percent of the gap pairings',
        body: (
          <>
            <P>
              A short, always-visible statement of the method so a number never arrives unexplained. It states the
              whole pipeline in one line — <Strong>same-category gate → weighted spec distance → 0–100
              similarity</Strong> — and expands into one entry per pairing.
            </P>
            <P>
              The most useful part is the <Strong>driver chips</Strong>: each names a dimension and roughly what
              share of the total spec gap it accounts for (&quot;memory 41%&quot;). That turns &quot;this is a
              71% match&quot; into something actionable — if memory drives the gap and your workload is
              memory-bound, the swap is riskier than the number looks; if the gap is mostly network on a workload
              that never saturates the NIC, it matters less. The base is not listed against itself, so you see one
              fewer pairing than you have clouds.
            </P>
          </>
        ),
      },
      {
        id: 'specs-education',
        q: 'What are the per-cloud "Stands out / Trails on / Best for" columns?',
        text: 'education columns stands out trails on best for nuance chips vendor source link what you are comparing family story balanced',
        body: (
          <>
            <P>
              Under the numbers, each cloud gets a short prose column explaining <em>what</em> its pick is, rather
              than only how it measures:
            </P>
            <UL>
              <li><Strong>★ Stands out</Strong> — the one dimension this pick clearly leads on in this comparison.</li>
              <li><Strong>▼ Trails on</Strong> — its clearest weakness here. Both are comparison facts, not product judgements: the same size would stand out against different company.</li>
              <li><Strong>Best for</Strong> — the workload shape the family is built for. Editorial context, not a computed score.</li>
              <li><Strong>Nuance chips</Strong> — short flags worth knowing (credit-based CPU, host-dependent silicon, no local disk); the full sentence is on hover.</li>
              <li><Strong>Source ↗</Strong> — a link to the vendor&apos;s own documentation for the family.</li>
            </UL>
            <P>
              A balanced size with no clear lead or lag shows neither chip, and reads &quot;a balanced size with no
              standout trait&quot; — which is itself useful information.
            </P>
          </>
        ),
      },
      {
        id: 'specs-family-knowledge',
        q: 'Where does the family write-up — "When to pick", the analogs line — come from?',
        text: 'family profile knowledge curated entries sixty families when to pick analogs vendor source link editorial not scored degrades gracefully what it is key points best for',
        body: (
          <>
            <P>
              A family profile is built in two layers, and it is worth knowing which layer you are reading:
            </P>
            <UL>
              <li><Strong>Derived from the specs</Strong> — the vCPU and memory span, the memory-per-vCPU profile, the key points. These are computed from the sizes in the family and are as current as the catalog.</li>
              <li><Strong>Curated and sourced</Strong> — the opening &quot;what it is&quot; sentence, the <Strong>When to pick</Strong> line and the <Strong>≈ analogs</Strong> line. These are hand-written against the vendor&apos;s own current documentation, and the <Strong>Source ↗</Strong> link goes to the exact page they came from.</li>
            </UL>
            <P>
              Roughly <Strong>sixty families</Strong> carry a curated entry, concentrated on current-generation
              lines and on the categories where the choice is least obvious (storage, HPC, burstable,
              confidential, GPU). A family without one still gets a full profile from its own specs — it simply
              shows no &quot;When to pick&quot; line and no vendor link, which is the honest signal that nobody has
              written one yet.
            </P>
            <P>
              The curated layer is <Strong>additive only</Strong>. It never contradicts a spec-derived fact and it
              never moves a ≈% score — read it as informed editorial context to weigh against the numbers, not as
              part of them.
            </P>
          </>
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
        id: 'exec-kpis',
        q: 'What does each KPI tile mean?',
        text: 'kpi tiles cheapest option savings vs base avg spec match regions covered market gaps meaning read each tile dash',
        body: (
          <>
            <P>Five tiles, read left to right as &quot;how much, how much less, how faithful, how reachable&quot;:</P>
            <UL>
              <li><Strong>Cheapest option</Strong> — the lowest monthly cost among the clouds that actually priced, at your term. Clouds with no rate drop out of the race rather than counting as $0.</li>
              <li><Strong>Savings vs base</Strong> — dollars per month you&apos;d save by moving, plus the percent. It can read <em>Base is cheapest</em>, <em>Base unpriced</em>, or <Mono>—</Mono> when the totals aren&apos;t comparable.</li>
              <li><Strong>Avg spec match</Strong> — the mean ≈% of the compared picks against the base. Below 65% it turns amber, because a cheap option you can&apos;t actually swap into isn&apos;t a saving.</li>
              <li><Strong>Regions covered</Strong> — how many distinct regions the compared clouds run in (in BoM mode: how many regions your BoM deploys into — same label, different question).</li>
              <li><Strong>Market gaps</Strong> — metros a rival serves that your base cloud doesn&apos;t.</li>
            </UL>
            <P>
              Read the first two <em>together with</em> the third. The tiles are deliberately not summed into a
              single index: cheapest and closest are different questions and can point at different clouds.
            </P>
          </>
        ),
      },
      {
        id: 'exec-commitment',
        q: 'What is the "Commitment savings" chart?',
        text: 'commitment savings step down chart payg 1 year 3 year reserved discount worth committing lever see pricing full breakdown',
        body: (
          <P>
            One compact chart showing what each cloud&apos;s rate <Strong>steps down to</Strong> at 1-year and
            3-year commitment versus PAYG — the &quot;is committing worth it here?&quot; answer without leaving
            the briefing. The step-down is often larger than the gap between clouds, which is the point: switching
            commitment term can beat switching cloud, and it&apos;s a much smaller change to make. The full
            per-region and per-horizon breakdown lives on <Strong>Pricing</Strong>.
          </P>
        ),
      },
      {
        id: 'exec-tradeoffs',
        q: 'What is "What you get vs what you give up"?',
        text: 'what you get vs what you give up tradeoffs plus traits minus give up per cloud column base no give up line family category via',
        body: (
          <>
            <P>
              One column per cloud, base first. Each target column names up to three things you{' '}
              <Strong>gain</Strong> (<Mono>+</Mono>) and one thing you <Strong>give up</Strong> (<Mono>−</Mono>)
              relative to the base — the honest other half of a savings headline. The base column shows no
              give-up line because it is the thing being compared against.
            </P>
            <P>
              A category line reading <Mono>Memory Optimized · via General Purpose</Mono> means we{' '}
              <em>matched</em> it as Memory Optimized even though the vendor files it under General Purpose (see{' '}
              <Strong>match category</Strong> in 06). In VM BoM mode the same column summarizes the portfolio
              instead: how many lines matched, what the shape change is across them, and which lines are excluded.
            </P>
          </>
        ),
      },
      {
        id: 'exec-posture',
        q: 'What is "Market posture", and why doesn’t its gap count match the Region page?',
        text: 'market posture metros rival serves base lacks competitor only market wide all sizes differs from region availability size scoped why numbers differ',
        body: (
          <>
            <P>
              <Strong>Market posture</Strong> names the metros each rival serves that your base cloud doesn&apos;t
              — the coverage risk sitting behind a cost verdict. If the cheapest cloud is also the only one in a
              metro you need, that is a reason to move; if your base cloud is the only one there, that is a reason
              to stay.
            </P>
            <P>
              It is counted <Strong>market-wide, across all sizes</Strong> — &quot;does this cloud have a
              datacenter here at all&quot;. The gap figure on <Strong>Region availability</Strong> is{' '}
              <Strong>scoped to whatever you filtered to</Strong> — &quot;does this cloud offer <em>this
              family</em> here&quot;. The two answer different questions, so they will usually differ; the
              briefing labels its own figure &quot;market-wide, all sizes&quot; so you know which one you&apos;re
              reading.
            </P>
          </>
        ),
      },
      {
        id: 'exec-score',
        q: 'What is the "overall score /100" in a contender’s "why pick this" line?',
        text: 'overall score 100 balance indicator why pick this all rounder middle of the pack trails equal weighted vcpu memory network price not a verdict',
        body: (
          <P>
            A rough <Strong>balance indicator</Strong> for a pick that wins no single dimension. It averages four
            things equally — vCPU, memory and network (each measured against the leader in this comparison) and
            price (measured against the cheapest) — so a size that&apos;s decent at everything scores well and a
            size that&apos;s excellent at one thing and poor at three doesn&apos;t. It exists to explain{' '}
            <em>why a card has no ★ tag</em>, not to crown a winner: it ignores generation, architecture, region
            availability and every caveat, so never let it override the evidence pages.
          </P>
        ),
      },
      {
        id: 'exec-bom',
        q: 'How does the Executive Summary change in VM BoM mode?',
        text: 'exec summary bom mode whole bill of materials cheapest total lines matched qty weighted line ports cost composition per line best at',
        body: (
          <>
            <P>
              The grammar is identical; the unit becomes your whole fleet. The verdict prices the{' '}
              <Strong>whole BoM</Strong> on each cloud, and the tiles change to match:
            </P>
            <UL>
              <li><Strong>Cheapest total</Strong> — the lowest whole-BoM monthly total, not a single size.</li>
              <li><Strong>Avg spec match</Strong> — <Strong>quantity-weighted</Strong>, so a 500-VM line counts more than a 2-VM line.</li>
              <li><Strong>Lines matched</Strong> — how many lines found an equivalent on every cloud in scope. Short of the full count means some lines are excluded from some totals.</li>
              <li><Strong>Regions covered</Strong> — the distinct regions your BoM actually deploys into.</li>
            </UL>
            <P>
              Two extra sections appear: <Strong>Cost composition</Strong> (where the money actually is, by line
              and cloud) and <Strong>Per-line best-at</Strong> (which cloud prices each line lowest — useful when
              the whole-BoM winner isn&apos;t the winner on the lines you care about). A support line phrased in{' '}
              <Strong>line-ports</Strong> is counting lines × clouds, not lines.
            </P>
          </>
        ),
      },
      {
        id: 'exec-export',
        q: 'Can I export the briefing?',
        text: 'export brief slides pptx document docx download deck recommendation cost story coverage risks assumptions methodology bom brief',
        body: (
          <>
            <P>
              Yes — <Strong>Export brief</Strong> (or <Strong>Export BoM brief</Strong>) writes the same briefing
              to a <Strong>.pptx</Strong> deck or a <Strong>.docx</Strong> document: recommendation, the cost
              story, what you get vs what you give up, the size-for-size evidence, market coverage and gaps, and
              the risks / assumptions / methodology page.
            </P>
            <P>
              The caveats travel with it. The exported artifact carries the same{' '}
              <Mono>(est.)</Mono> / <Mono>(assumed)</Mono> markers, names any excluded lines, and states plainly
              when a savings figure was withheld — so the document can&apos;t claim more than the screen did.
            </P>
            <P>
              Both formats work in <Strong>both modes</Strong> — a single-comparison brief and a whole-BoM brief
              follow the same running order, only the data changes. The file is written{' '}
              <Strong>in your browser</Strong>: nothing is uploaded, no server renders it, and it works with the
              tab offline.
            </P>
          </>
        ),
      },
      {
        id: 'exec-export-arc',
        q: 'What is in the exported brief, in order?',
        text: 'export contents slide order seven parts arc verdict recommendation cost story get vs give up evidence spec differences coverage gaps risks methodology same numbers as screen cannot disagree deck docx',
        body: (
          <>
            <P>
              One fixed <Strong>seven-part arc</Strong>, in the same order every time and in both modes, so a
              reader who has seen one brief knows where to look in the next:
            </P>
            <UL>
              <li><Strong>1 · Verdict</Strong> — the one-sentence money answer, what was compared, and the date.</li>
              <li><Strong>2 · Recommendation</Strong> — adopt / stay / validate / watch, stated as a call rather than a chart.</li>
              <li><Strong>3 · The cost story</Strong> — the cost table, the comparison bars, the commitment economics, and any non-comparable disclosure.</li>
              <li><Strong>4 · What you get vs what you give up</Strong> — the per-cloud trade-offs (per-portfolio in BoM mode).</li>
              <li><Strong>5 · Evidence</Strong> — the size-for-size table and the situational best-at calls (in BoM mode, the top cost-driver lines), plus the spec deltas where there are any.</li>
              <li><Strong>6 · Coverage &amp; gaps</Strong> — regions per cloud and the metros your base cloud is missing.</li>
              <li><Strong>7 · Risks &amp; methodology</Strong> — every asterisk in one place.</li>
            </UL>
            <P>
              The reason the order is frozen matters more than the order itself: an executive artifact that
              rearranges itself per run cannot be reviewed, and the seventh part exists so the honest caveats are
              never the thing that got cut for space.
            </P>
            <P>
              Every figure in the brief is the <Strong>same computed value the page rendered</Strong>, formatted
              through the same rules — the export doesn&apos;t recalculate anything of its own. That is
              deliberate: a slide that disagrees with the screen destroys trust in both, and the only reliable way
              to prevent it is to give them one source rather than two.
            </P>
          </>
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
        text: 'run duration hours months 730 commitment term payg 1 year 3 year reserved discount hourly rate unit toggle resets naming 1y ri pay as you go',
        body: (
          <>
            <P>
              <Strong>Run duration</Strong> is how long you&apos;ll run the VMs — the multiplier that turns an
              hourly rate into a total (months convert at <Mono>730 h/month</Mono>, the standard billing month).
              You can set it in <Strong>months or hours</Strong>; switching the unit resets the value to that
              unit&apos;s default rather than converting it, so re-check the number after you flip it.
            </P>
            <P>
              <Strong>Commitment term</Strong> is the pricing tier: <Strong>PAYG</Strong> (on-demand),{' '}
              <Strong>1-yr</Strong> or <Strong>3-yr</Strong> reserved (steeper discounts for longer). Both knobs
              apply to every cloud at once so the comparison stays apples-to-apples, and the verdict flags a
              term-switch opportunity (&quot;a 3-yr RI would cut GCP ~$X&quot;) when it&apos;s material.
            </P>
            <P>
              The same three tiers are spelled three ways depending on the space available —{' '}
              <Mono>PAYG / 1-yr / 3-yr</Mono> on controls, <Mono>PAYG / 1y RI / 3y RI</Mono> on chips, and{' '}
              <em>pay-as-you-go / 1-year reserved / 3-year reserved</em> in prose. They mean the same thing.
            </P>
          </>
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
            but only if it&apos;s in the same country <Strong>or within ~1000 km</Strong>.
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
        id: 'price-suppressed',
        q: 'Why does the savings number say "—" when one cloud is clearly cheaper?',
        text: 'savings suppressed not stated no delta claimed base unpriced partially priced cheapest undercounted excluded lines honesty gate what to do fix',
        body: (
          <>
            <P>
              Because a savings figure is only honest when <Strong>both sides priced the same work</Strong>. If
              some lines are missing from one cloud&apos;s total, that cloud looks cheaper than it is — so instead
              of printing a flattering number, the tool withholds it and tells you why. Three reasons, each named
              on screen:
            </P>
            <UL>
              <li><Strong>The base has no priced lines at this term.</Strong> There is no baseline to measure against, so the cheapest priced cloud is named without a &quot;below base&quot; claim.</li>
              <li><Strong>The base total is undercounted.</Strong> Some of your lines didn&apos;t price on the base cloud, so its total is smaller than your real bill and any delta would be overstated.</li>
              <li><Strong>The winner&apos;s total is undercounted.</Strong> The cheapest cloud is missing lines, so its total isn&apos;t the full cost of running your fleet there.</li>
            </UL>
            <P>
              The <Strong>cheapest cloud is still named</Strong> — only the delta is withheld — and the excluded
              lines are listed by SKU underneath. To get the number back:{' '}
              <Strong>fix the excluded lines</Strong>. A line with <em>no analog</em> needs a wider category
              filter or an authored equivalency; a line that&apos;s <em>unpriced</em> needs a rate for that SKU,
              region and term — try PAYG, or add the rate via the VM Library. Every surface (the briefing, the
              price band, the exports) applies the same gate, so they never disagree.
            </P>
          </>
        ),
      },
      {
        id: 'price-unmatched',
        q: '"No analog" vs "unpriced" — what is the difference?',
        text: 'no analog unmatched line vs unpriced line excluded from total two different failures matched but no rate what to do',
        body: (
          <>
            <P>
              Two different failures with two different fixes, both of which exclude a line from a cloud&apos;s
              total:
            </P>
            <UL>
              <li><Strong>No analog</Strong> (unmatched) — that cloud has <em>nothing</em> in the same category to map the line to. Widen the category filter, allow the cross-category fallback, or author an equivalency for it.</li>
              <li><Strong>Unpriced</Strong> — the line <em>did</em> find an equivalent, but no rate resolves for that SKU + region + term. Try PAYG (always real where published), a different region, or upload the rate.</li>
            </UL>
            <P>
              Neither is ever filled with a zero. An excluded line is disclosed by count and by SKU so a partial
              total is never mistaken for a complete one.
            </P>
          </>
        ),
      },
      {
        id: 'price-horizons',
        q: 'What are the 1 Month / 1 Year / 3 Year columns and "−N% vs PAYG"?',
        text: 'horizon matrix one month one year three year columns totals cumulative minus percent vs payg commitment step down run duration difference',
        body: (
          <>
            <P>
              The <Strong>horizon</Strong> columns are fixed look-ahead windows — what the same rate accumulates
              to over one month, one year and three years — and they are independent of your{' '}
              <Strong>run duration</Strong>, which is your own intended runtime. Use horizons to compare clouds on
              a common yardstick; use run duration to price your actual plan.
            </P>
            <P>
              <Mono>−N% vs PAYG</Mono> under a cell is the discount that commitment term buys on that cloud, shown
              only when it&apos;s material. It is the single most useful number on the page for a workload
              you&apos;re confident about, and the single most dangerous one for a workload you aren&apos;t — a
              3-year commitment is a 3-year commitment.
            </P>
          </>
        ),
      },
      {
        id: 'price-normalized',
        q: 'What are the normalized $/vCPU/mo and $/GiB/mo rates?',
        text: 'normalized unit rate price performance dollars per vcpu per month per gib lowest wins shapes dont line up honest comparison basis when to read instead of headline price applied rate label payg fallback null divisor',
        body: (
          <>
            <P>
              Cost restated <Strong>per unit of capacity</Strong> rather than per machine, so different-sized
              options can be compared fairly. When the compared sizes are the same shape, the monthly total is the
              simpler read. When they <Strong>aren&apos;t</Strong> — one cloud&apos;s closest analog has 25% more
              memory, say — the raw total is comparing two different amounts of machine, and the page says so:{' '}
              <Strong>&quot;shapes don&apos;t line up — normalized unit rates are the honest comparison
              basis.&quot;</Strong> When you see that note, read the normalized row, not the headline.
            </P>
            <P>Read the normalized rates instead of the headline price whenever:</P>
            <UL>
              <li>The equivalents differ in <Strong>vCPU or memory</Strong> — the usual case, since the closest analog on another cloud rarely lands on the exact same shape.</li>
              <li>You are choosing between <Strong>different sizes of the same thing</Strong>, where the bigger machine is obviously more expensive and that tells you nothing.</li>
              <li>Someone has quoted you a total and you want to know whether it is cheap <em>per unit of what you actually get</em>.</li>
            </UL>
            <P>
              Each unit rate carries the <Strong>rate tier it was computed from</Strong> (<Mono>3y RI</Mono> /{' '}
              <Mono>1y RI</Mono> / <Mono>PAYG</Mono>), because a cloud with no published rate at your chosen term
              falls back to pay-as-you-go and would otherwise look expensive for the wrong reason. And a unit rate
              is left <Strong>blank</Strong> whenever the rate is missing or the vCPU / memory divisor is —
              never divided into a fabricated number.
            </P>
          </>
        ),
      },
      {
        id: 'price-reference',
        q: 'What is in "Reference tables", and why do they price only one VM in BoM mode?',
        text: 'reference tables disclosure rate bars commitment step down horizon totals full unit rates anchor vm only bom mode caveat',
        body: (
          <P>
            A collapsed drawer holding the detail behind the headline: the <Strong>rate bars</Strong>, the{' '}
            <Strong>commitment step-down</Strong>, the <Strong>horizon totals</Strong> and the full{' '}
            <Strong>unit-rate</Strong> table. In <Strong>VM BoM mode</Strong> these tables still describe the{' '}
            <Strong>anchor VM only</Strong> — one size, not the fleet — and the page states that explicitly rather
            than letting a single-SKU rate be misread as a BoM total. The whole-BoM figures are the verdict, the
            composition chart and the per-line table above it.
          </P>
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
            <P>Two regions are equivalent when all three hold:</P>
            <UL>
              <li><Strong>Same country.</Strong> Data residency dominates — Azure &quot;West Europe&quot; (Netherlands) ≠ AWS &quot;eu-west-1&quot; (Ireland).</li>
              <li><Strong>Same sovereignty class.</Strong> Government regions only cluster with other gov regions.</li>
              <li><Strong>Within 400 km</Strong> of each other by great-circle distance.</li>
            </UL>
            <P>
              A region joins a cluster if it&apos;s within 400 km of <em>any</em> member, so a chain of nearby
              sites merges into one metro group. Edge locations (AWS Local Zones / Wavelength) are skipped — they
              have no cross-cloud peer.
            </P>
            <P>
              The order of those tests is the whole opinion in this feature. <Strong>Country is tested
              first</Strong>, sovereignty class second, and only then <Strong>distance</Strong> — because for a
              capacity plan, <Strong>data residency binds harder than latency</Strong>. Two datacenters 200 km
              apart across a border are not substitutes if your data can&apos;t cross it, while two 350 km apart
              inside one country usually are. A tool that ranked purely by kilometres would confidently offer you
              regions you are not allowed to use.
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
        text: 'served by all clouds shared by two exclusive metro overlap tinted unique reach gap reconciliation line adds up buckets total',
        body: (
          <>
            <P>
              These are <Strong>metro-level</Strong> overlap (each cloud&apos;s regions collapsed to city+country,
              so Azure &quot;East US&quot; and AWS &quot;us-east-1&quot; both count as N. Virginia).{' '}
              <Strong>Served by all</Strong> = every selected cloud is present (deploy-anywhere);{' '}
              <Strong>Shared by two+</Strong> = at least two; <Strong>X exclusive</Strong> = only that one cloud —
              its unique reach, and a competitor&apos;s gap. Tinted by ownership (brand color / purple / green).
            </P>
            <P>
              Underneath, a <Strong>reconciliation line</Strong> prints the arithmetic — served-by-all + shared +
              exclusive = the base cloud&apos;s total regions — so you can check the buckets add up instead of
              taking them on trust.
            </P>
          </>
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
        id: 'reg-scope',
        q: 'How do the category / family / size filter chips combine?',
        text: 'filter chips category family size multi select within a kind or across kinds and scoped to counts reflect regions offering selection',
        body: (
          <P>
            <Strong>Within a kind they widen; across kinds they narrow.</Strong> Two category chips mean
            &quot;either category&quot;; a category chip <em>and</em> a family chip mean &quot;this category{' '}
            <em>and</em> this family&quot;. Category is canonical and cross-cloud; family and size chips belong to
            one cloud. With any chip active the tiles switch from counting <em>all</em> regions to counting only
            the regions that actually offer your selection, and the header reads <Strong>&quot;Scoped
            to…&quot;</Strong> — which is why a region count can drop sharply the moment you pick a family. That
            drop is the answer, not a bug: it&apos;s where that family is genuinely available.
          </P>
        ),
      },
      {
        id: 'reg-mute',
        q: 'What is the difference between muting a cloud here and deselecting it in setup?',
        text: 'mute cloud page local view versus deselect setup keeps base star shown muted last cloud cannot',
        body: (
          <P>
            <Strong>Muting</Strong> hides a cloud on this page only — your Comparison setup keeps it, and
            un-muting restores it instantly. <Strong>Deselecting</Strong> in setup removes the cloud from the
            whole comparison and clears its picks. Use mute to check &quot;what does this look like without
            AWS?&quot; without losing your setup. Either way you cannot remove the last visible cloud, and the
            base cloud must be one of the visible ones.
          </P>
        ),
      },
      {
        id: 'reg-map',
        q: 'How do I use the map — views, the cloud legend, and pinning?',
        text: 'map view tabs global americas emea apac cloud legend hide show markers pin region cmd ctrl shift click coordinates list roster expand all',
        body: (
          <>
            <P>
              The <Strong>View</Strong> tabs zoom between Global and a single super-geo. The{' '}
              <Strong>Cloud</Strong> legend hides or shows a cloud&apos;s markers. Clicking a marker{' '}
              <Strong>pins</Strong> it, opening a detail card with its exact coordinates and super-geo below the
              map; Cmd/Ctrl or Shift-click pins several at once, and <Strong>Clear all</Strong> releases them.
            </P>
            <P>
              Two things worth knowing. Markers that land on nearly the same spot are{' '}
              <Strong>fanned slightly apart</Strong> so each stays clickable — the pinned card always shows the
              true coordinates, so trust the card over the dot for exact position. And the{' '}
              <Strong>list</Strong> toggle is the same data as a roster of metro cards, grouped by super-geo and{' '}
              <Strong>collapsed by default</Strong> — use <Strong>Expand all</Strong> if it looks empty.
            </P>
          </>
        ),
      },
      {
        id: 'reg-footprint',
        q: 'What are the three footprint boxes (Equivalent / Exclusive / Market gaps)?',
        text: 'footprint boxes equivalent exclusive market gaps per cloud point of view partition cities color coded competitor losing city to',
        body: (
          <>
            <P>
              One box per cloud, each partitioning every city in scope from <em>that cloud&apos;s</em> point of
              view:
            </P>
            <UL>
              <li><Strong>Equivalent</Strong> — cities it holds that at least one competitor also holds. Contested ground; the dots name who else is there.</li>
              <li><Strong>Exclusive</Strong> — cities only it holds. Painted in its own brand color: its unique reach.</li>
              <li><Strong>Market gaps</Strong> — cities competitors hold and it doesn&apos;t. Painted in the <em>competitor&apos;s</em> color — the cloud you&apos;re losing that city to.</li>
            </UL>
            <P>
              These are the same three questions the scoreboard answers, but read per cloud rather than from the
              base cloud&apos;s perspective — so the numbers here and on the scoreboard tile answer different
              questions and needn&apos;t match. Counting is by <Strong>city</Strong>, so two regions of one cloud
              in one metro count once.
            </P>
          </>
        ),
      },
      {
        id: 'reg-gap-count',
        q: 'What exactly is counted in the "market gaps" tile?',
        text: 'market gaps tile counted base point of view competitor only metro not in count both competitors context reveal panel buckets',
        body: (
          <P>
            The tile counts, <Strong>from the base cloud&apos;s point of view</Strong>, metros where a competitor
            has a region and the base doesn&apos;t. Open it and the gaps are bucketed by <em>which</em> competitor
            is there. Metros that <Strong>both</Strong> competitors serve are shown for context but carry a{' '}
            <Mono>not in count</Mono> badge — they&apos;re a broader strategic gap rather than a
            single-competitor one, and the tile says so rather than quietly folding them in. Counting is by metro,
            so two competitor regions in one city are one gap.
          </P>
        ),
      },
      {
        id: 'reg-matrix',
        q: 'How do I read the region availability matrix?',
        text: 'region availability matrix rows locations super geo columns clouds check mark n vms dot empty offers nothing metros not regions',
        body: (
          <P>
            One row per <Strong>location</Strong> (a metro, not a region), grouped by super-geo, one column per
            cloud. A cell reads <Mono>✓ N VMs</Mono> when that cloud offers something matching your current filter
            there — the count is how many sizes, so it also tells you how <em>deep</em> the offering is, not just
            whether it exists. A <Mono>·</Mono> means that cloud offers nothing there under the current filter,
            which may mean no region at all, or a region without that family. The{' '}
            <Strong>Coverage</Strong> boxes tell you which.
          </P>
        ),
      },
      {
        id: 'reg-why',
        q: 'What is the "why equivalent" column, and where do government regions fit?',
        text: 'why equivalent column rationale same country km apart metros no nearby region market gap government cloud gov regions only match gov only show gaps',
        body: (
          <>
            <P>
              The line-by-line equivalency table shows its reasoning in words, so you can audit a row instead of
              trusting it: <em>&quot;Same country (Germany) — all within 32 km of each other&quot;</em>,{' '}
              <em>&quot;AWS + GCP are equivalent … Azure has no nearby region here&quot;</em>, or{' '}
              <em>&quot;Only Azure serves Norway … a market gap&quot;</em>. Filter by country, or tick{' '}
              <Strong>Only show gaps</Strong> to jump straight to the rows where the clouds don&apos;t line up.
            </P>
            <P>
              <Strong>Government regions cluster only with other government regions</Strong>, flagged in the same
              column. A sovereign region is never offered as the equivalent of a commercial one, however close it
              sits — the whole point of it is that the workload can&apos;t move there.
            </P>
          </>
        ),
      },
      {
        id: 'reg-unpriced',
        q: 'A region shows a family as available but has no price for it — which one is wrong?',
        text: 'availability decoupled from pricing family available no rate price null not in feed vendor publishes coverage docs china sovereign mac c2d c3d c4a t2d availability only row never fabricated',
        body: (
          <>
            <P>
              Neither. <Strong>Availability and pricing are answered separately, on purpose.</Strong> Whether a
              cloud offers a family in a region comes from the vendor&apos;s own published coverage
              documentation. Whether we hold a rate for it comes from the vendor&apos;s pricing feed. Those two
              sources do not always agree, and the honest answer is to report each one for what it is.
            </P>
            <P>
              So a family the vendor lists in a region but the rate feed hasn&apos;t priced still shows as{' '}
              <Strong>available there</Strong>, with its price left <Strong>empty</Strong> — never filled with a
              placeholder, never $0, and never quietly dropped. When the rate arrives on a later refresh it simply
              replaces the blank.
            </P>
            <P>
              The alternative — treating &quot;we have no price&quot; as &quot;the cloud doesn&apos;t offer
              it&quot; — is the failure mode this exists to prevent: whole families showing as available nowhere,
              and a coverage answer that was really a pricing answer wearing a disguise. If a region matters to
              you and the price is blank, that is a prompt to check the vendor&apos;s pricing page, not evidence
              that you can&apos;t deploy there.
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
              Dimensions marked <Mono>opt</Mono> only count when <em>both</em> sides carry the data, and the score
              is rescaled to the dimensions that were actually comparable. That matters for reading the number: a
              pair scored on fewer dimensions isn&apos;t penalized for the missing ones, so its percentage stays
              on the same scale — but it is also a <em>less informed</em> percentage, which is why the caveat
              chips tell you when a dimension was skipped.
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
            <P>The spec distance becomes a percentage through a calibrated decay curve:</P>
            <FormulaAndAnchors />
            <P>
              The practical consequence is that the scale is <Strong>steep near the top and gentle at the
              bottom</Strong>. Small real differences move the number a lot — one 2× size step already costs most
              of it — while everything genuinely far away lands in a low band and stays correctly ranked against
              its peers. So treat the high end as precise and the low end as ordinal: 96% vs 91% is a meaningful
              difference; 14% vs 9% just means &quot;both are the wrong machine.&quot; Only a category-gated pair
              ever reads 0%.
            </P>
          </>
        ),
      },
      {
        id: 'sim-gpu',
        q: 'How are GPUs compared?',
        text: 'gpu count model class vram interconnect nvlink nvswitch 8 h100 l4 37 percent curated accelerator specs inert gpu unverified',
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
              model/VRAM/link terms are <Strong>inert unless both sizes resolve a curated accelerator
              spec</Strong> — unknown accelerators fall back to count + size with no fabrication, and say so
              through a <Strong>GPU unverified</Strong> caveat.
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
              (0%). Matching uses an <em>effective</em> <Strong>match category</Strong>, which can differ
              from the display label: GCP <Mono>-highmem</Mono> shows as General Purpose but matches as Memory
              Optimized, so it correctly pairs with Azure E / AWS r.
            </P>
            <P>
              When a cloud was scoped to a different category than the base, the UI can <Strong>fall back</Strong>{' '}
              to the nearest thing anyway and flag it <Strong>≠ / &quot;via «Category»&quot;</Strong>. Such a match
              is deliberately marked down, and marked down <em>further</em> the further apart the two categories
              really are — so Memory↔Storage reads closer than Memory↔GPU. Read a &quot;via&quot; match as
              &quot;the closest thing that exists, in a different product class&quot;, and check the specs before
              treating it as a substitute.
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
              <li><Strong>Confidential peer</Strong> — one side is a purpose-built confidential family (Azure&apos;s <Mono>DC</Mono>- and <Mono>EC</Mono>-series), the other is a general family bridged to it because its silicon SUPPORTS confidential compute as an opt-in (SEV-SNP or TDX capable) rather than shipping as a dedicated confidential SKU. Similar capability on paper; a different thing to buy, enable and attest.</li>
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
              <Strong>09 · Data health</Strong>). We surface the gap as an honest asterisk instead of letting a
              green percentage imply an apples-to-apples swap.
            </P>
          </>
        ),
      },
      {
        id: 'sim-caveat-severity',
        q: 'Are all caveats equally serious, and what do I actually do about each one?',
        text: 'caveat severity warn info amber grey which matters most order worst caveat what to do next action arch cross recompile burstable credit stretch bare metal gpu unverified local disk unknown gen unknown different category',
        body: (
          <>
            <P>
              No — they split into two kinds, and the color tells you which. An <Strong>amber (warn)</Strong>{' '}
              caveat says the two machines <em>differ</em> in a way that can change your plan. A{' '}
              <Strong>grey (info)</Strong> caveat says a dimension simply <em>could not be checked</em> — the
              match may be perfectly fine, but the score behind it is less informed than it looks. Warns sort
              first, so the top chip is always the one that matters most, and where only one chip fits (a tight
              row, an exported line) that is the one you see.
            </P>
            <P>The practical next step differs by kind:</P>
            <UL>
              <li><Strong>Different category</Strong> — decide whether the <em>product class</em> is negotiable at all. If it isn&apos;t, this cloud has no answer for you and the comparison is market intelligence, not a plan.</li>
              <li><Strong>Confidential peer</Strong> — check whether opt-in confidential compute satisfies your control, and whether your attestation tooling accepts that technology.</li>
              <li><Strong>Stretch match</Strong> — resize. Look at the neighbouring sizes on that cloud rather than accepting the one the score picked.</li>
              <li><Strong>Burstable vs standard</Strong> — check sustained CPU, not peak. Model the credit balance under your real duty cycle before treating the cheaper side as cheaper.</li>
              <li><Strong>CPU architecture</Strong> — for Arm↔x86, budget a rebuild and an image change. For Intel↔AMD, usually just benchmark.</li>
              <li><Strong>GPU unverified</Strong> — confirm the accelerator model and VRAM on the vendor&apos;s page. This is the caveat most likely to make a match wildly wrong in either direction.</li>
              <li><Strong>Local disk unknown</Strong> — confirm the local NVMe figure; on a storage size it is the whole point of the machine.</li>
              <li><Strong>Bare metal</Strong> — check the operating model, not the specs: licensing, provisioning time and blast radius all change.</li>
              <li><Strong>CPU gen unknown</Strong> — usually nothing. Verify the generation only if it is load-bearing for your decision.</li>
            </UL>
            <P>
              A pairing can carry several at once, and that is the useful signal: one caveat is a thing to check,
              three is a comparison that has stopped being like-for-like whatever the percentage says.
            </P>
          </>
        ),
      },
    ],
  },
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'markers',
    num: '07',
    title: 'Reading the numbers: markers, bands & missing values',
    items: [
      {
        id: 'mark-pct',
        q: 'What does a 96% match mean versus a 62% one — practically?',
        text: 'how to read match percentage bands green amber red 85 65 40 stretch decision what does 62 percent mean 96 percent like for like',
        body: (
          <>
            <P>
              The color of the ≈% pill is the fastest read. Three bands, and each implies a different amount of
              work before you can act on it:
            </P>
            <UL>
              <li><Strong>85% and above (green)</Strong> — treat it as like-for-like. The sizes line up; a swap is a sizing decision, not a re-architecture. Still read the caveat chips: a 96% match can carry an Arm↔x86 flag that costs you a rebuild.</li>
              <li><Strong>65–84% (amber)</Strong> — usable, but not a drop-in. Something real differs — usually one size step, a shape change, or a generation gap. Open the driver chips to see <em>which</em> dimension, and decide whether that dimension matters to your workload.</li>
              <li><Strong>Below 65% (red)</Strong> — a materially different machine. Fine as market intelligence (&quot;this is the closest thing that cloud has&quot;), not as a migration plan.</li>
            </UL>
            <P>
              Below <Strong>40%</Strong> — or whenever one side is roughly 4× the other on vCPU or memory — the
              pick is additionally flagged a <Strong>Stretch match</Strong>. So a 62% is &quot;check this
              carefully&quot;, and a 96% is &quot;check the caveats, then proceed&quot;. Neither number says
              anything about which machine is <em>better</em>; it only says how comparable they are.
            </P>
          </>
        ),
      },
      {
        id: 'mark-est',
        q: 'What do the "(est.)" and "(assumed)" markers mean?',
        text: 'est marker assumed marker estimated rate network figure curated processor inferred host dependent directional not vendor published',
        body: (
          <>
            <P>
              Both mean &quot;we filled this in; the vendor didn&apos;t publish it.&quot; They are never applied
              silently and never overwrite a real value.
            </P>
            <UL>
              <li><Strong><Mono>(est.)</Mono></Strong> — a modeled figure. On a price, a reserved rate derived from PAYG (see 04). On a network row, a throughput taken from a curated fallback because the primary feed carried none. Treat either as <em>directional</em>: right order of magnitude, not a billing quote.</li>
              <li><Strong><Mono>(assumed)</Mono></Strong> — a processor filled in from a source-cited curated map, or inferred from the SKU name, because the vendor publishes no processor string. It is display-only and <Strong>never affects a match score</Strong>.</li>
              <li><Strong><Mono>host-dependent</Mono></Strong> — not an estimate at all. The family genuinely runs on either of two silicon options and the cloud decides which host you land on.</li>
              <li><Strong><Mono>(inferred)</Mono></Strong> on a generation — deduced from the SKU naming rather than read from a published string.</li>
            </UL>
            <P>
              If a marker changes your decision, that is the signal to verify with the vendor before committing.
              The markers exist so you know exactly which figures deserve that call.
            </P>
          </>
        ),
      },
      {
        id: 'mark-missing',
        q: 'Why is a value a dash instead of a number?',
        text: 'dash em dash missing value never zero excluded from totals no fabrication row disappears empty section',
        body: (
          <>
            <P>
              A <Mono>—</Mono> means <Strong>no value resolved</Strong>, and it is deliberately not a zero. A
              fabricated $0 would drag a total down and make an incomplete comparison look like a cheap one, so an
              unresolvable figure is left blank and any total that depends on it is either excluded or disclosed.
            </P>
            <P>
              For the same reason, whole rows and sections <Strong>disappear rather than render empty</Strong>: no
              GPU row means no compared cloud has an accelerator; no assumptions footer means there are no
              assumptions in play. Absence here is information, not an error — but if you expected a number and
              got a dash, the usual causes are a SKU with no rate in that region at that term, a spec the vendor
              feed hasn&apos;t published, or a filter that left the cloud with nothing to price.
            </P>
          </>
        ),
      },
      {
        id: 'mark-caveats',
        q: 'What is an amber caveat chip, and what is the "Assumptions" footer?',
        text: 'amber caveat chip warn info hover detail assumptions footer one liner estimated rates assumed processors stretch analogs excluded lines capped',
        body: (
          <>
            <P>
              A <Strong>caveat chip</Strong> is a short amber (or grey, for information-only) label stating one
              specific reason a pairing isn&apos;t a clean swap — &quot;Stretch match&quot;, &quot;CPU
              architecture&quot;, &quot;GPU unverified&quot;. The one-sentence explanation is on hover; all nine
              kinds are listed in <Strong>06 · &quot;When is a match a closest alternative?&quot;</Strong>.
            </P>
            <P>
              The <Strong>Assumptions footer</Strong> is the same idea at briefing altitude: a single amber line
              naming everything the verdict rests on — estimated rates, assumed processors, stretch analogs,
              excluded lines. It renders <em>nothing</em> when the comparison is clean, so an empty space there is
              a good sign. It shows the most load-bearing assumptions first and caps the list, so treat it as the
              headline rather than the complete audit — the per-cloud chips and the excluded-line lists are the
              full detail.
            </P>
          </>
        ),
      },
      {
        id: 'mark-rounding',
        q: 'Why does the same figure look slightly different on two screens?',
        text: 'rounding verdict kpi tile abbreviated 12k exact dollars tables percent whole number differ same number formatting',
        body: (
          <P>
            Because verdicts and KPI tiles are meant to be read at a glance and{' '}
            <Strong>abbreviate</Strong> (<Mono>$12k</Mono>, <Mono>$1.2M</Mono>, whole percents), while the tables
            underneath carry <Strong>exact dollars</Strong>. The underlying figure is the same one — every surface
            computes the cheapest cloud and the savings through a single shared calculation precisely so they
            can&apos;t disagree — but two totals a few hundred dollars apart can both display as{' '}
            <Mono>$12k</Mono>. When a difference is close enough to matter, read the tables, not the tiles. And
            when the cheapest-to-runner-up gap is under 8%, the verdict says so explicitly.
          </P>
        ),
      },
    ],
  },
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'data',
    num: '08',
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
        text: 'baked into the build weekly ci action cron monday as-of date offline no third party call ships priced out of the box',
        body: (
          <>
            <P>
              The joined result <Strong>ships with the app</Strong>, so the dashboard is priced out of the box:
              the only thing it ever loads is its own data files, from the same place the page came from — no
              call to a vendor API, no key, nothing to configure. A <Strong>weekly job</Strong> (Mondays 07:00
              UTC, plus a manual button) re-pulls every cloud and ships a fresh build, re-stamping the as-of date.
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
        id: 'data-gates',
        q: 'What stops a bad weekly refresh from quietly shipping worse data?',
        text: 'integrity gates validator fails the job row shrink 5 percent coverage drop one point unjoined rate ceiling schema check last known good data stale keyed shard 30 day warning truncated vendor api regression',
        body: (
          <>
            <P>
              A refresh that runs unattended every week is only trustworthy if it can{' '}
              <Strong>refuse to publish itself</Strong>. Between the fresh pull and the moment it would go live,
              the new data is compared against the data already shipping, and the job <Strong>fails</Strong>{' '}
              rather than replacing good data with worse:
            </P>
            <UL>
              <li><Strong>Row shrink</Strong> — a cloud&apos;s spec, network or rate counts may not fall more than 5% against the last good pull. This catches a vendor API returning a truncated set.</li>
              <li><Strong>Coverage drop</Strong> — processor and network coverage may not fall more than one percentage point. This catches a feed quietly carrying less than it did.</li>
              <li><Strong>Unjoined rates</Strong> — the share of priced SKUs still waiting on a spec has a ceiling. Crossing it means the two halves of the feed have drifted apart.</li>
              <li><Strong>Schema</Strong> — fresh records are checked field by field, so a vendor renaming a field fails the refresh instead of silently emptying a column.</li>
            </UL>
            <P>
              When a gate trips, <Strong>the last known-good data stays live</Strong> and someone gets told. That
              is the trade the whole pipeline is built around: <Strong>old data with a visible date beats fresh
              data that is silently wrong</Strong>, because you can reason about the first and cannot about the
              second.
            </P>
            <P>
              Two pulls need a credential (Azure specs, GCP rates). When a credential is absent the job{' '}
              <Strong>skips that pull and keeps the last good copy</Strong> rather than breaking — but that copy
              then ages, so a separate check warns once it passes <Strong>30 days</Strong>. It warns and never
              fails, because a stale shard is a thing to notice, not a reason to stop shipping. You see the
              consequence directly as the per-cloud shard age in <Strong>09 · Data health</Strong>.
            </P>
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
        id: 'data-list-price',
        q: 'Are these the prices I will actually pay?',
        text: 'list price published rate no negotiated discount enterprise agreement spot savings plan committed use credits egress support tax excluded compute only',
        body: (
          <>
            <P>
              They are <Strong>list prices</Strong> — each vendor&apos;s published rate for the SKU, region and
              term. What is <Strong>not</Strong> applied: your negotiated or enterprise-agreement discount, spot /
              preemptible pricing, savings plans and committed-use discounts beyond the standard reserved tiers,
              and any credits.
            </P>
            <P>
              The figures also cover <Strong>compute only</Strong> — no storage, egress, licensing, support tier
              or tax. So read the cross-cloud <em>gap</em> as the reliable signal and the absolute totals as a
              floor. If you hold real contract pricing, upload it: your rates override the public ones and every
              verdict recomputes against them.
            </P>
          </>
        ),
      },
      {
        id: 'data-stale',
        q: 'What should I do when a rate is missing or looks stale?',
        text: 'missing rate stale out of date what to do check as of date data health shard age try payg different region upload own rates vm library refresh',
        body: (
          <>
            <P>Work down this list — the first three cost you nothing:</P>
            <UL>
              <li><Strong>Check the as-of date</Strong> in the Public Data pill, and the per-cloud shard age in <Strong>09 · Data health</Strong>. If a cloud&apos;s shard is old, its rates are old.</li>
              <li><Strong>Try PAYG.</Strong> Pay-as-you-go is published far more completely than the reserved tiers; a missing figure is very often a missing <em>reserved</em> rate, not a missing SKU.</li>
              <li><Strong>Try another region.</Strong> Rates are per-region, and a brand-new region often prices before or after its neighbors.</li>
              <li><Strong>Upload your own rates</Strong> via the VM Library. Uploaded values override the baked catalog and are never overwritten by a refresh.</li>
            </UL>
            <P>
              For anything you are about to commit money to, confirm the figure against the vendor&apos;s own
              pricing page. This tool is built to narrow the field and show you the shape of the decision, not to
              serve as a quote.
            </P>
          </>
        ),
      },
      {
        id: 'data-template',
        q: 'Can I author the cross-cloud equivalency mappings myself?',
        text: 'equivalency template excel download upload replaces table azure sku aws sku gcp sku notes hand authored curated opinion overrides computed',
        body: (
          <P>
            Yes. Cross-cloud equivalency is an <em>opinion</em> — no vendor publishes &quot;the AWS analog of this
            Azure SKU&quot; — so the tool ships a seed of widely-accepted mappings and lets you replace it.{' '}
            <Strong>Template</Strong> downloads the current table as an Excel sheet (Azure SKU · AWS SKU · GCP SKU
            · Notes); edit it and <Strong>Upload</Strong> it back. Note that an upload{' '}
            <Strong>replaces the whole table rather than merging into it</Strong>, so start from the downloaded
            template rather than a blank sheet. Where you&apos;ve authored a mapping, your pick wins; everywhere
            else the computed best match fills in.
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
    num: '09',
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
      {
        id: 'health-guard',
        q: 'How do you know the catalog isn’t quietly missing regions or families?',
        text: 'coverage guard build time check vendor docs diff curated tables fails build ci not on screen drift silent gap detection',
        body: (
          <P>
            A <Strong>build-time guard</Strong> diffs the vendor&apos;s own published region and family
            documentation against the curated tables and <Strong>fails the build</Strong> when they drift, so a
            missing region or a family that quietly launched somewhere new is caught before the build ships rather
            than showing up as a silently short list. It runs in CI, not on screen — there is nothing here for you
            to check. Its practical meaning for you is that a &quot;— none&quot; cell should be read as a real
            coverage gap rather than as a stale table.
          </P>
        ),
      },
      {
        id: 'health-trust',
        q: 'Which numbers should I trust least?',
        text: 'trust least confidence ranking what to verify before committing reserved rates azure processors gpu specs storage local disk absolute totals gaps',
        body: (
          <>
            <P>Roughly in order, most trustworthy first:</P>
            <UL>
              <li><Strong>vCPU, memory and PAYG rates</Strong> — vendor-published on all three clouds and refreshed weekly. Safe to quote.</li>
              <li><Strong>Region presence</Strong> — published and cross-checked by the build-time guard.</li>
              <li><Strong>Network throughput</Strong> — published, but occasionally from a curated fallback; the <Mono>(est.)</Mono> marker tells you which.</li>
              <li><Strong>Reserved (1-yr / 3-yr) rates</Strong> — real where published, modeled from PAYG where not. An <Mono>est.</Mono> badge marks every modeled one.</li>
              <li><Strong>Azure processor / generation</Strong> — a curated assumption everywhere, because Azure publishes no processor string. Marked <Mono>(assumed)</Mono>, and never used to rank a match.</li>
              <li><Strong>GPU model detail and local-disk figures on newer families</Strong> — the most likely to be simply absent, which raises a &quot;GPU unverified&quot; or &quot;Local disk unknown&quot; caveat.</li>
            </UL>
            <P>
              Across all of it, the <Strong>gap between clouds</Strong> is a more reliable signal than any
              absolute total, because the same method and the same list prices are applied to every side.
            </P>
          </>
        ),
      },
    ],
  },
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'design',
    num: '10',
    title: 'Why the tool behaves this way',
    items: [
      {
        id: 'why-poc',
        q: 'What is this, exactly — and what is it not?',
        text: 'what is this proof of concept demonstration method quantifying managing capacity not a billing system not a quote not a procurement tool scope purpose why it exists',
        body: (
          <>
            <P>
              It is a <Strong>proof of concept</Strong>: a working demonstration of a method for{' '}
              <Strong>quantifying capacity and managing it</Strong>, built end-to-end on real published vendor
              data so the method can be judged on real answers rather than on a diagram.
            </P>
            <P>The method it is arguing for, in four moves:</P>
            <UL>
              <li><Strong>Make capacity comparable.</Strong> &quot;Which machine on cloud B is this machine on cloud A?&quot; is answerable from published specs, repeatably, instead of by opinion or by a table someone maintained once.</li>
              <li><Strong>Score the comparison, then say how good it is.</Strong> A number is only useful next to a statement of how much to trust it — hence the ≈%, the bands and the caveats.</li>
              <li><Strong>Scale from one machine to a fleet</Strong> without changing the question. The same grammar answers &quot;this VM&quot; and &quot;this whole bill of materials&quot;.</li>
              <li><Strong>Refuse to fabricate.</Strong> Every gap in the data shows up as a gap on screen, and every modeled figure says so.</li>
            </UL>
            <P>
              What it is <Strong>not</Strong>: a billing system, a quote, a procurement tool, or a substitute for
              your vendor&apos;s pricing page. It prices at list, covers compute only, and knows nothing about
              your contract. Use it to narrow the field and to understand the shape of a decision — then confirm
              the two or three numbers you are about to commit money against.
            </P>
          </>
        ),
      },
      {
        id: 'why-no-winner',
        q: 'Why won’t it just tell me which cloud is best?',
        text: 'no overall winner no top pick why refuses ranking weights are yours situational best at cheapest closest different questions single index',
        body: (
          <>
            <P>
              Because &quot;best&quot; is a weighting, and the weighting is <Strong>yours</Strong>. To crown a
              winner the tool would have to decide how much a dollar is worth against a gigabyte, against a
              region you need, against a rebuild you&apos;d have to fund. Any single ranked answer would be that
              hidden opinion wearing the costume of a computed fact — and it would be wrong for most readers
              while looking authoritative to all of them.
            </P>
            <P>
              So instead of a <Strong>Top pick</Strong>, contenders carry <Strong>★ Best at X</Strong> tags for
              the dimensions they actually lead — <Strong>Best price, Most vCPU, Most memory, Highest
              network</Strong> — and a card only ever gets a tag it genuinely wins. Nothing is graded on a curve
              and nothing is awarded for coming close.
            </P>
            <P>
              You will notice the same refusal elsewhere: the KPI tiles are deliberately not summed into one
              index, because cheapest and closest are different questions that routinely point at different
              clouds. Where a single balance figure does appear — the <Strong>overall score /100</Strong> — it
              exists only to explain why a card carries no ★ tag at all, and it says so.
            </P>
            <P>
              The honest verdict this tool <em>can</em> give is narrower and more useful: here is what each option
              wins on, here is what it costs, here is how comparable it really is, and here is what you give up.
              The last judgment is the one you were hired to make.
            </P>
          </>
        ),
      },
      {
        id: 'why-private',
        q: 'Does anything I type or upload leave my browser?',
        text: 'private client side no account no login no telemetry no analytics nothing uploaded bill of materials contract pricing stays local exports generated locally offline safe to paste real data',
        body: (
          <>
            <P>
              <Strong>No.</Strong> Everything runs in the browser tab: the matching engine, the pricing math, the
              region clustering and the export generators are all local code. There is{' '}
              <Strong>no account, no sign-in and no telemetry</Strong> — nothing measures what you look at or
              reports it anywhere.
            </P>
            <UL>
              <li>A <Strong>bill of materials</Strong> you author or upload stays in your browser. It is never transmitted.</li>
              <li><Strong>Contract pricing, internal SKUs and proprietary specs</Strong> you upload override the public data locally and are never shipped in the public build.</li>
              <li><Strong>Exports</Strong> are written by the page itself. No server renders your deck and no copy of it exists anywhere but your download folder.</li>
              <li>The only thing the app fetches is <Strong>its own shipped data files</Strong> — the public vendor catalog — from the same place the page was served from.</li>
            </UL>
            <P>
              The one exception, and it is opt-in and obvious: if the in-dashboard{' '}
              <Strong>Terminal assistant</Strong> is enabled, the question you type there — with the page context
              it needs to answer — is sent to a language model to be answered. Nothing else on any page does that.
            </P>
            <P>
              This is stated plainly because of what the tool is <em>for</em>. A capacity planner&apos;s real
              bill of materials is commercially sensitive, and a tool that wants it pasted in owes a
              straight answer about where it goes.
            </P>
          </>
        ),
      },
      {
        id: 'why-honesty',
        q: 'Why does it so often refuse to show a number?',
        text: 'why refuse to show number blank dash suppressed savings unpriced excluded honesty over completeness fabrication silent failure trust design principle',
        body: (
          <>
            <P>
              A blank is the most common thing you will meet here that other tools don&apos;t show you, so it is
              worth naming the rule behind all of them: <Strong>a figure appears only when it can be
              defended.</Strong> Everywhere the alternative would be a plausible-looking number, the tool shows
              the gap instead:
            </P>
            <UL>
              <li>A missing rate is a <Mono>—</Mono>, never a $0 that would drag a total down and make an incomplete comparison look cheap.</li>
              <li>A <Strong>savings figure is withheld</Strong> when the two totals aren&apos;t comparable, and the reason and the excluded lines are named in its place.</li>
              <li>An <Strong>unpriced but available</Strong> family shows as available with no price, rather than being dropped from the map.</li>
              <li>A <Strong>modeled</Strong> figure carries <Mono>(est.)</Mono>; an <Strong>inferred</Strong> one carries <Mono>(assumed)</Mono>; neither ever silently replaces a published value.</li>
              <li>A dimension that couldn&apos;t be compared raises a <Strong>caveat</Strong> instead of being scored as if it had been.</li>
            </UL>
            <P>
              The reasoning is simple enough to state in one line: <Strong>a wrong number is more expensive than
              a missing one</Strong>. A missing number sends you to the vendor&apos;s page for ten minutes. A
              fabricated one gets into a business case, survives review because it looked like all the other
              numbers, and is discovered after the commitment is signed.
            </P>
            <P>
              The cost of this choice is real and worth accepting on purpose: the screens look less complete than
              they could, and some questions come back as &quot;we can&apos;t say&quot;. That is the intended
              trade. Every blank here is a place the underlying data was genuinely absent, which makes the
              filled-in figures worth something.
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
          Region availability), both comparison modes, and the engines behind them — how a VM or region on one
          cloud maps to its closest equivalents on the others, how each match is scored, how costs are estimated,
          how to read the confidence markers, where the data comes from, and why the tool makes the calls it
          makes. Every score is computed from the published specs, not a hand-curated opinion, and every figure we
          had to model is marked as such. Search below, or browse the sections; the glossary defines every term
          you meet on screen.
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
