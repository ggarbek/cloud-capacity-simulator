/**
 * Cross-cloud equivalency engine (v2.26.0) — VM ↔ VM and region ↔ region across
 * Azure / AWS / GCP, computed from the live catalog specs (not a hand-curated
 * list). Replaces the ~21-row hand-built `equivalencySeed` with a framework.
 *
 * ── Region equivalency ──────────────────────────────────────────────────────
 * Two regions are equivalent when they serve the same customers under the same
 * rules. The dominant driver is the COUNTRY (data-residency / sovereignty law),
 * then geographic proximity within it. So the matcher ranks candidates:
 *   1. same country  (then nearest by great-circle distance — same-country
 *      regions usually serve the same metros)
 *   2. otherwise the geographically nearest region (flagged cross-border)
 * Government/sovereign regions only match other gov regions. AWS edge zones
 * (Local Zones / Wavelength) are excluded as targets — they have no peer on the
 * other clouds.
 *
 * ── VM equivalency ──────────────────────────────────────────────────────────
 * Two sizes are equivalent when they'd host the same workload: same product
 * CATEGORY (memory-opt ↔ memory-opt, etc. — a hard gate), then the closest
 * SIZE — vCPU count, memory, and the memory-per-vCPU ratio (which distinguishes
 * standard / highmem / highcpu sub-types) — with a preference for the same CPU
 * architecture (Intel ↔ Intel, AMD ↔ AMD, Arm ↔ Arm) and accelerator count.
 * Distance is a weighted blend on log-ratios so 4↔8 vCPU is penalised the same
 * as 64↔128 (proportional, not absolute).
 */
import type { CatalogEntry, VmCategory } from '../types';
import { categorize, categoryGroupPenalty, matchCategory, isBurstable } from './vmCategory';
import { regionGeo, haversineKm, type RegionGeo } from '../data/regionGeo';
import { gpuSpecFor, teeSpecFor, teeCapabilityFor, type GpuSpec, type TeeSpec, type Interconnect } from './acceleratorSpecs';

/**
 * Extra normalized-distance penalty added when a Confidential-category base is
 * matched against a capable but non-confidential-category peer (a GP family that
 * offers opt-in confidential compute). Small — the peer CAN run confidentially,
 * it just isn't a purpose-built confidential SKU — so the match stays finite and
 * reasonably high, but never reads identical to a true confidential↔confidential
 * pair. Consumed by the caveat layer (`matchCaveats`) as the documented budget.
 */
export const CONFIDENTIAL_PEER_PENALTY = 0.1;

// ── CPU architecture ─────────────────────────────────────────────────────────
export type CpuArch = 'intel' | 'amd' | 'arm' | 'other';

/** Classify the CPU architecture from the processor string (best-effort). */
export function cpuArch(processor: string | undefined): CpuArch {
  const p = (processor || '').toLowerCase();
  if (!p) return 'other';
  if (/graviton|\barm\b|ampere|altra|axion|cobalt|neoverse|tau\b|t2a/.test(p)) return 'arm';
  if (/amd|epyc|genoa|milan|\brome\b|bergamo|turin/.test(p)) return 'amd';
  if (/intel|xeon|sapphire|cascade|skylake|ice ?lake|emerald|granite|haswell|broadwell|cooper/.test(p))
    return 'intel';
  return 'other';
}

/**
 * Infer architecture from the SKU NAME when the processor string is missing
 * (Azure's live specs don't carry one). Uses each cloud's documented naming:
 *   Azure: a feature-letter `p` = Arm (Ampere/Cobalt), `a` = AMD, else Intel.
 *   AWS:   family letter `g` = Graviton/Arm, `a` = AMD, `i`/none = Intel.
 *   GCP:   family suffix `a` = Arm (Axion / T2A), `d` = AMD, else Intel.
 * Conservative: returns 'other' when the name doesn't clearly encode it.
 */
export function archFromName(provider: string | undefined, vmSizeName: string): CpuArch {
  const prov = (provider || '').toLowerCase();
  const name = vmSizeName || '';
  if (prov === 'azure') {
    // Standard_<family><size><features>_v<n> — the feature letters follow the size digits.
    const m = name.replace(/^Standard_/i, '').match(/^[A-Za-z]+\d+([a-z]*)/);
    const feat = m?.[1] ?? '';
    if (feat.includes('p')) return 'arm';
    if (feat.includes('a')) return 'amd';
    return name.match(/^Standard_/i) ? 'intel' : 'other';
  }
  if (prov === 'aws') {
    const fam = name.split('.')[0].toLowerCase(); // m7g, c7a, r8i, m5
    const m = fam.match(/^[a-z]+\d+([a-z]*)/);
    const suffix = m?.[1] ?? '';
    if (suffix.includes('g')) return 'arm';
    if (suffix.includes('a')) return 'amd';
    if (suffix.includes('i') || /^[a-z]+\d+$/.test(fam)) return 'intel';
    return 'other';
  }
  if (prov === 'gcp') {
    const fam = name.split('-')[0].toLowerCase(); // n2, n2d, c4a, t2a
    if (/[0-9]a$/.test(fam) || fam === 't2a') return 'arm';
    if (/[0-9]d$/.test(fam)) return 'amd';
    if (/^(n|c|e|m|h|z|x)\d/.test(fam)) return 'intel';
    return 'other';
  }
  return 'other';
}

// ── CPU microarchitecture generation ─────────────────────────────────────────
export interface CpuGen {
  /** Comparable rank WITHIN a vendor (newer = higher). */
  rank: number;
  /** Human label, e.g. "Skylake", "Cascade Lake", "Genoa". */
  label: string;
  /** Which rank scale this belongs to — only same-vendor ranks compare. */
  vendor: 'intel' | 'amd' | 'arm' | 'other';
}

/**
 * Microarchitecture generation from a processor string — so VM similarity can
 * be apples-to-apples (a Cascade Lake VM is more like another Cascade Lake than
 * a Haswell). Recognizes explicit microarch names AND Intel Xeon-SP / AMD EPYC
 * model numbers. Returns null when no generation can be read (e.g. Azure live
 * specs carry no processor) → no penalty, never fabricated.
 *
 * When a string names two gens (GCP's "Cascade Lake/Ice Lake"), the rank is the
 * MINIMUM of the matched ranks (conservative — a mixed-fleet family is only
 * guaranteed to be as new as its OLDEST silicon) and the label keeps both. This
 * is deterministic and avoids the fractional averages (n2 4.5, n1 2.5) that made
 * cross-cloud gen distance read falsely precise.
 */
export function cpuGeneration(processor: string | undefined): CpuGen | null {
  const p = (processor || '').toLowerCase();
  if (!p) return null;

  // 1) Explicit Intel microarch names (rank scale shared with the model-number
  //    fallback below). One string may name several (collect + average).
  const intelNames: [RegExp, number, string][] = [
    [/haswell/, 1, 'Haswell'],
    [/broadwell/, 2, 'Broadwell'],
    [/sky ?lake/, 3, 'Skylake'],
    [/cascade ?lake/, 4, 'Cascade Lake'],
    [/ice ?lake/, 5, 'Ice Lake'],
    [/sapphire ?rapids/, 6, 'Sapphire Rapids'],
    [/emerald ?rapids/, 7, 'Emerald Rapids'],
    [/granite ?rapids/, 8, 'Granite Rapids'],
  ];
  const intelHits = intelNames.filter(([re]) => re.test(p));
  if (intelHits.length) {
    // Conservative + deterministic: a "Cascade Lake/Ice Lake" fleet is only as
    // new as its oldest silicon → take the MIN matched rank (not the average).
    const rank = Math.min(...intelHits.map(([, r]) => r));
    return { rank, label: intelHits.map(([, , l]) => l).join('/'), vendor: 'intel' };
  }

  // 2) AMD EPYC explicit names.
  const amdNames: [RegExp, number, string][] = [
    [/naples/, 1, 'Naples'],
    [/\brome\b/, 2, 'Rome'],
    [/milan/, 3, 'Milan'],
    [/genoa/, 4, 'Genoa'],
    [/bergamo/, 4, 'Bergamo'],
    [/turin/, 5, 'Turin'],
  ];
  const amdHit = amdNames.find(([re]) => re.test(p));
  if (amdHit) return { rank: amdHit[1], label: amdHit[2], vendor: 'amd' };

  // 3) ARM — Graviton 1-4 carry an explicit number; others are a single tier.
  if (/graviton/.test(p)) {
    const g = p.match(/graviton\s*(\d)/);
    const n = g ? Number(g[1]) : 1;
    return { rank: n, label: `Graviton${g ? g[1] : ''}`.trim(), vendor: 'arm' };
  }
  if (/cobalt/.test(p)) return { rank: 3, label: 'Cobalt', vendor: 'arm' };
  if (/axion/.test(p)) return { rank: 3, label: 'Axion', vendor: 'arm' };
  if (/ampere|altra|neoverse|\barm\b/.test(p)) return { rank: 2, label: 'Ampere/Arm', vendor: 'arm' };

  // 4) Intel Xeon Scalable model number fallback ("…Platinum 8175" → Skylake).
  //    The 2nd digit of an 8xxx/6xxx/5xxx/4xxx/3xxx part is the generation:
  //    1=Skylake … 6=Granite Rapids → rank = digit + 2 to align with §1.
  const intelModel = p.match(/\b[3-8](\d)\d{2}(?!\d)/);
  if (intelModel && /intel|xeon/.test(p)) {
    const gen = Number(intelModel[1]);
    if (gen >= 1 && gen <= 6) {
      const labels = ['', 'Skylake', 'Cascade Lake', 'Ice Lake', 'Sapphire Rapids', 'Emerald Rapids', 'Granite Rapids'];
      return { rank: gen + 2, label: labels[gen], vendor: 'intel' };
    }
  }

  // 5) AMD EPYC model number fallback ("EPYC 9654" → Genoa; "7763" → Milan).
  const amdModel = p.match(/epyc\s*(\d)\d{2}(\d)/);
  if (amdModel) {
    const gen = Number(amdModel[2]);
    const labels = ['', 'Naples', 'Rome', 'Milan', 'Genoa', 'Turin'];
    if (gen >= 1 && gen <= 5) return { rank: gen, label: labels[gen], vendor: 'amd' };
  }

  return null;
}

/**
 * Infer the CPU microarchitecture from an AZURE SKU NAME when the processor
 * string is absent (Azure live specs carry none, and Azure is the most common
 * base cloud — so the gen-aware distance term + the side-by-side label would
 * otherwise be permanently blank for it). Mirrors `archFromName`: the SKU's
 * series + version encode the silicon under Microsoft's documented naming.
 *
 * Ranks align with `cpuGeneration`'s per-vendor scales (Intel Haswell=1 …
 * Granite Rapids=8; AMD Naples=1 … Turin=5; Arm Altra=2, Cobalt=3) so an
 * Azure row compares apples-to-apples against an AWS/GCP row that DID carry a
 * processor string.
 *
 * Curated from Azure VM docs. Returns null whenever the series spans too many
 * microarchitectures to pin (the original M-series and the v1/v3 mainstream
 * Intel families list Broadwell→Ice Lake) — no fabrication, just no bonus.
 */
export function azureGenFromName(vmSizeName: string | undefined): CpuGen | null {
  const raw = vmSizeName || '';
  if (!/^Standard_/i.test(raw)) return null; // only Azure's canonical SKU form
  const name = raw.replace(/^Standard_/i, '');
  const verM = name.match(/_v(\d+)\b/i);
  const ver = verM ? Number(verM[1]) : 1;
  const famM = name.match(/^([A-Za-z]+)/);
  const fam = (famM?.[1] ?? '').toUpperCase();
  const arch = archFromName('azure', raw); // intel | amd | arm | other

  // Arm track: Ampere Altra (v5) → Azure Cobalt 100 (v6).
  if (arch === 'arm') {
    if (ver >= 6) return { rank: 3, label: 'Cobalt 100', vendor: 'arm' };
    if (ver === 5) return { rank: 2, label: 'Ampere Altra', vendor: 'arm' };
    return null;
  }

  // AMD track: EPYC Rome (v4) → Milan (v5) → Genoa (v6).
  if (arch === 'amd') {
    if (ver >= 6) return { rank: 4, label: 'Genoa', vendor: 'amd' };
    if (ver === 5) return { rank: 3, label: 'Milan', vendor: 'amd' };
    if (ver === 4) return { rank: 2, label: 'Rome', vendor: 'amd' };
    return null;
  }

  // Intel track. Several Intel families need series-specific handling because
  // the version digit alone is ambiguous across series.
  if (arch === 'intel') {
    // M-series (memory-optimized, always Intel): Msv3/Mdsv3/Mbsv3 = Sapphire
    // Rapids; Mv2/Msv2 = Skylake; the original M-series is too mixed to pin.
    if (fam === 'M') {
      if (ver >= 3) return { rank: 6, label: 'Sapphire Rapids', vendor: 'intel' };
      if (ver === 2) return { rank: 3, label: 'Skylake', vendor: 'intel' };
      return null;
    }
    // F-series (compute-optimized): Fsv2/Fv2 launched on Skylake/Cascade Lake —
    // NOT the Haswell/Broadwell era the Dv2 generic mapping would assign.
    if (fam === 'F') {
      // Skylake/Cascade Lake span → MIN rank (Skylake=3), matching the
      // conservative min-of-matched-ranks rule in `cpuGeneration`.
      if (ver === 2) return { rank: 3, label: 'Skylake/Cascade Lake', vendor: 'intel' };
      return null;
    }
    // Mainstream D/E/B/L/… by version: v4 Cascade Lake, v5 Ice Lake, v6 Emerald
    // Rapids, v2 Haswell/Broadwell. v3 (Broadwell→Ice Lake) and v1 are too
    // mixed to pin → null.
    if (ver >= 6) return { rank: 7, label: 'Emerald Rapids', vendor: 'intel' };
    if (ver === 5) return { rank: 5, label: 'Ice Lake', vendor: 'intel' };
    if (ver === 4) return { rank: 4, label: 'Cascade Lake', vendor: 'intel' };
    if (ver === 2) return { rank: 1.5, label: 'Haswell/Broadwell', vendor: 'intel' };
    return null;
  }

  return null;
}

/**
 * Microarchitecture generation that prefers the processor string and falls
 * back to the SKU name for Azure (whose live specs carry no processor). One
 * place so both the distance term (`vmFeatures`) and the UI label use the same
 * inference.
 */
export function genFor(vm: { processor?: string; provider?: string; vmSizeName?: string }): CpuGen | null {
  const fromProc = cpuGeneration(vm.processor);
  if (fromProc) return fromProc;
  if ((vm.provider || '').toLowerCase() === 'azure') return azureGenFromName(vm.vmSizeName);
  return null;
}

// ── VM feature vector ────────────────────────────────────────────────────────
export interface VmFeat {
  /** The category used for the MATCHING gate — `matchCategory` (GCP `-highmem`
   *  upgraded to Memory Optimized). May differ from `displayCategory`. */
  category: VmCategory;
  /** The real vendor-label category (`categorize`), for display + the
   *  "via <Category>" cross-category transparency tag. */
  displayCategory: VmCategory;
  vcpus: number;
  memoryGib: number;
  memPerVcpu: number;
  arch: CpuArch;
  gpus: number;
  /** Network Mbps — a real differentiator between sizes that are otherwise
   *  identical on vCPU/memory (e.g. AWS m5/m7i/m8i 4xlarge are all 16 vCPU /
   *  64 GiB but ship 10 / 12.5 / 15 Gbps). 0 when the catalog has no value. */
  networkMbps: number;
  /** Local (ephemeral) disk GiB — the DEFINING dimension of Storage Optimized
   *  VMs, which are otherwise indistinguishable on vCPU/memory (an i7ie with
   *  120 TB local NVMe and a memory-optimized size can share a vCPU/RAM shape
   *  yet target completely different work). 0 when the catalog has no value. */
  localDiskGib: number;
  /** CPU microarchitecture generation, for apples-to-apples matching. null
   *  when the processor string names no known gen (e.g. Azure live specs). */
  gen: CpuGen | null;
  /** Curated GPU spec (model/VRAM/interconnect) for the DEFINING traits of a
   *  GPU family — an 8×H100 must not read identical to an 8×L4. null when the
   *  family isn't in the curated table (the GPU model/VRAM/link terms then stay
   *  inert, like gen when a side has no known gen). (#141) */
  gpuSpec: GpuSpec | null;
  /** Confidential-compute TEE kind, for the within-`Confidential`-category
   *  SEV-SNP-vs-TDX distinction. Prefers the purpose-built confidential-family
   *  spec (`teeSpecFor`), falling back to the opt-in capability of a normal-
   *  category family (`teeCapabilityFor`) so the caveat layer can see a capable
   *  GP peer. null for families with no confidential capability. (#141) */
  tee: TeeSpec | null;
  /** Burstable / shared-core service model (AWS T, Azure B, GCP shared-core E2 /
   *  f1 / g1) — a materially different machine model from a dedicated-vCPU size. */
  burstable: boolean;
}

function gpuCount(vm: CatalogEntry): number {
  const t = (vm.acceleratorType ?? '').toLowerCase();
  if (!t || t === 'none') return 0;
  const m = t.match(/(\d+)/);
  return m ? Number(m[1]) : 1;
}

// PERF (S65) — `vmFeatures` is pure in `vm` and is the hottest call in the
// ranking pass: `bestVmMatch`/`topVmMatches`/`vmDistance` recompute it for every
// candidate on every call, and `rankedFamiliesPerBase` re-scans the same
// candidate pools once per base family. Since the deduped catalog reuses stable
// object references across all those iterations, a WeakMap keyed on the VM object
// lets us derive each VM's feature vector exactly ONCE and reuse it everywhere —
// byte-identical output (same pure function), just not recomputed. The WeakMap
// never pins memory (entries GC with their VM) and is transparent to callers.
const FEATURE_CACHE = new WeakMap<CatalogEntry, VmFeat>();

export function vmFeatures(vm: CatalogEntry): VmFeat {
  const cached = FEATURE_CACHE.get(vm);
  if (cached) return cached;
  const feat = computeVmFeatures(vm);
  FEATURE_CACHE.set(vm, feat);
  return feat;
}

function computeVmFeatures(vm: CatalogEntry): VmFeat {
  const vcpus = Math.max(1, vm.vcpus || 1);
  const memoryGib = Math.max(0.5, vm.memoryGib || 0.5);
  // Prefer the processor string; fall back to the SKU naming when it's absent
  // (Azure live specs carry no processor, so Arm/AMD sizes would otherwise read
  // as 'other' and lose the same-architecture preference).
  let arch = cpuArch(vm.processor);
  if (arch === 'other') arch = archFromName(vm.provider, vm.vmSizeName);
  return {
    category: matchCategory(vm),
    displayCategory: vm.category ?? categorize(vm.provider, vm.family),
    vcpus,
    memoryGib,
    memPerVcpu: memoryGib / vcpus,
    arch,
    gpus: gpuCount(vm),
    networkMbps: Math.max(0, vm.networkMbps || 0),
    localDiskGib: Math.max(0, vm.localDiskGib || 0),
    gen: genFor(vm),
    gpuSpec: gpuSpecFor(vm.family, vm.vmSizeName),
    tee: teeSpecFor(vm.family, vm.vmSizeName) ?? teeCapabilityFor(vm.provider, vm.family),
    burstable: isBurstable(vm),
  };
}

const W = {
  vcpu: 2.2, mem: 2.0, mpv: 1.1, arch: 0.7, gpu: 3.0, net: 0.6, gen: 0.35, disk: 1.5,
  // #141 GPU defining traits — gpuModel dominates so an 8×H100 and an 8×L4
  // (identical COUNT, 3.0) still read far apart; vram + interconnect refine.
  gpuModel: 2.6, gpuVram: 1.8, gpuLink: 1.0,
  // Within-`Confidential`-category SEV-SNP↔TDX refinement (minor — the category
  // gate already separates confidential families from non-confidential ones).
  tee: 0.6,
  // Service model — burstable (shared-core, credit-based) vs standard dedicated
  // vCPU. Active only when a side is burstable; a moderate term so a T-family and
  // a same-shape standard size read as clearly different machines.
  burst: 0.5,
};
const log2 = (r: number) => Math.abs(Math.log2(r));

/** Per-dimension weighted contribution to the raw distance (all ≥ 0). */
export interface DistanceTerms {
  vcpu: number;
  mem: number;
  mpv: number;
  arch: number;
  gpu: number;
  net: number;
  gen: number;
  disk: number;
  gpuModel: number;
  gpuVram: number;
  gpuLink: number;
  tee: number;
  burst: number;
}

/**
 * The raw (un-normalized) weighted distance, the sum of the weights for the
 * dimensions that were actually COMPARABLE (both sides had the data), and the
 * per-term breakdown. Splitting this out lets us (a) normalize by active weight
 * so a comparison that's missing optional dimensions (Azure live specs carry no
 * processor/network → no gen/net term) lands on the same 0–1 scale as one that
 * has them, and (b) explain WHICH dimensions drove a score (`explainVmDistance`).
 */
function vmDistanceParts(a: VmFeat, b: VmFeat): { raw: number; activeWeight: number; terms: DistanceTerms } {
  const terms: DistanceTerms = {
    vcpu: 0, mem: 0, mpv: 0, arch: 0, gpu: 0, net: 0, gen: 0, disk: 0,
    gpuModel: 0, gpuVram: 0, gpuLink: 0, tee: 0, burst: 0,
  };
  let w = 0;
  // Size core — always comparable.
  terms.vcpu = W.vcpu * log2(a.vcpus / b.vcpus); w += W.vcpu;
  terms.mem = W.mem * log2(a.memoryGib / b.memoryGib); w += W.mem;
  terms.mpv = W.mpv * log2(a.memPerVcpu / b.memPerVcpu); w += W.mpv;
  // Architecture — comparable only when BOTH sides have a known arch.
  if (a.arch !== 'other' && b.arch !== 'other') {
    if (a.arch !== b.arch) terms.arch = W.arch;
    w += W.arch;
  }
  // GPU count — comparable within the GPU category. Symmetric log-ratio on
  // (count+1) so vmDistance(a,b) === vmDistance(b,a) (the old |Δ|/max(1,aGpu)
  // form was direction-dependent — a 1↔8 pair scored differently each way).
  if (a.category === 'GPU' || b.category === 'GPU') {
    terms.gpu = W.gpu * log2((a.gpus + 1) / (b.gpus + 1));
    w += W.gpu;
  }
  // GPU DEFINING traits (#141) — the count term alone read an 8×H100 identical
  // to an 8×L4. Active within the GPU category, and INERT unless BOTH sides
  // resolved a curated spec (an unknown GPU family contributes nothing, like the
  // gen term when a side has no known gen — no fabrication). model-class is the
  // dominant axis (a tiered ordinal); VRAM a symmetric log-ratio; interconnect a
  // small ordinal (pcie < nvlink < nvswitch). All symmetric → vmDistance stays
  // direction-independent.
  if ((a.category === 'GPU' || b.category === 'GPU') && a.gpuSpec && b.gpuSpec) {
    terms.gpuModel = W.gpuModel * Math.abs(a.gpuSpec.classRank - b.gpuSpec.classRank);
    w += W.gpuModel;
    terms.gpuVram = W.gpuVram * log2(a.gpuSpec.vramGiB / b.gpuSpec.vramGiB);
    w += W.gpuVram;
    const linkRank = (i: Interconnect) => (i === 'nvswitch' ? 2 : i === 'nvlink' ? 1 : 0);
    terms.gpuLink = (W.gpuLink * Math.abs(linkRank(a.gpuSpec.interconnect) - linkRank(b.gpuSpec.interconnect))) / 2;
    w += W.gpuLink;
  }
  // Network bandwidth — differentiates sizes identical on vCPU/memory but with
  // different throughput (AWS m5/m7i/m8i 4xlarge = 10/12.5/15 Gbps). Comparable
  // only when both sides carry a value (no fabrication).
  if (a.networkMbps > 0 && b.networkMbps > 0) {
    terms.net = W.net * log2(a.networkMbps / b.networkMbps);
    w += W.net;
  }
  // CPU generation — closer microarchitectures are more apples-to-apples. Only
  // compares within the same vendor scale (cross-vendor is handled by arch).
  if (a.gen && b.gen && a.gen.vendor === b.gen.vendor) {
    terms.gen = W.gen * Math.abs(a.gen.rank - b.gen.rank);
    w += W.gen;
  }
  // Local disk — the DEFINING dimension for Storage Optimized, the way GPU count
  // is for GPU. Active whenever either side is storage-optimized (mirrors the
  // GPU term); a symmetric log-ratio on (GiB+1) so a 120 TB local-NVMe size and
  // a near-diskless one in the same gate read as far apart, and matching picks
  // the candidate whose local storage actually lines up — not just its vCPU/RAM.
  if (a.category === 'Storage Optimized' || b.category === 'Storage Optimized') {
    terms.disk = W.disk * log2((a.localDiskGib + 1) / (b.localDiskGib + 1));
    w += W.disk;
  }
  // Confidential / TEE (#141) — a MINOR within-category refinement. The
  // purpose-built confidential families (Azure DC*/EC*) already get their own
  // `Confidential` category, so the category gate does the heavy lifting; this
  // only distinguishes the TEE KIND (AMD SEV-SNP vs Intel TDX) among them.
  // Gated to the Confidential category + inert unless both sides resolved a kind
  // (so it never fires on the non-confidential catalog).
  if ((a.category === 'Confidential' || b.category === 'Confidential') && a.tee && b.tee) {
    terms.tee = a.tee.kind === b.tee.kind ? 0 : W.tee;
    w += W.tee;
  }
  // Service model — burstable (shared-core, credit-based) vs standard dedicated
  // vCPU. Active only when a side is burstable (mirrors the GPU/disk gating), so
  // it never fires on the standard↔standard catalog. Zero when both sides share
  // the model (both burstable or — via the gate — both standard).
  if (a.burstable || b.burstable) {
    terms.burst = a.burstable === b.burstable ? 0 : W.burst;
    w += W.burst;
  }
  const raw =
    terms.vcpu + terms.mem + terms.mpv + terms.arch + terms.gpu + terms.net + terms.gen + terms.disk +
    terms.gpuModel + terms.gpuVram + terms.gpuLink + terms.tee + terms.burst;
  return { raw, activeWeight: w, terms };
}

/** Optional behaviors for `vmDistance`. */
export interface VmDistanceOpts {
  /**
   * When > 0, cross-category pairs are NOT gated to Infinity; the size/arch/gen
   * distance is computed as usual and this fixed penalty (in normalized units)
   * is added, so a UI can optionally surface "near analogs in another category".
   * Default (undefined / 0) preserves the hard category gate — the locked
   * product behavior. DORMANT: no live call site passes this yet.
   */
  crossCategoryPenalty?: number;
}

/**
 * Distance between two VM sizes (lower = closer), normalized to ~0–1+ by the
 * sum of the weights for the dimensions that were actually comparable. Same
 * category is a HARD gate (Infinity) unless `opts.crossCategoryPenalty` is set.
 * Within a category it blends proportional vCPU/memory/mem-ratio distance with
 * architecture, GPU, network, CPU-generation, and (for Storage Optimized)
 * local-disk preferences.
 *
 * Normalizing by active weight (rather than summing raw) means a comparison
 * that can only see the size core (e.g. an Azure↔AWS pair where Azure carries
 * no processor, so the gen term is skipped) sits on the same scale as an
 * AWS↔GCP pair that sees every dimension — so percentages are comparable across
 * provider pairings instead of being silently deflated by missing data.
 */
export function vmDistance(a: VmFeat, b: VmFeat, opts?: VmDistanceOpts): number {
  const crossCat = a.category !== b.category;
  const penalty = opts?.crossCategoryPenalty ?? 0;
  if (crossCat && penalty <= 0) return Infinity;
  const { raw, activeWeight } = vmDistanceParts(a, b);
  let d = activeWeight > 0 ? raw / activeWeight : raw;
  // Cross-category: the base penalty PLUS an extra penalty when the categories
  // also span different product groups (Memory ↔ GPU costs more than Memory ↔
  // Storage), so a fundamentally-different machine never reads as a close match.
  if (crossCat) d += penalty + categoryGroupPenalty(a.category, b.category);
  return d;
}

export type MatchQuality = 'exact' | 'close' | 'loose';
export function matchQuality(distance: number): MatchQuality {
  // Bands on the normalized scale — aligned with the matchPct anchors below
  // (≈85% / ≈63%).
  if (distance <= 0.15) return 'exact';
  if (distance <= 0.4) return 'close';
  return 'loose';
}

/**
 * Decay constant for matchPct. Calibrated on the NORMALIZED distance scale so:
 *   identical spec (d=0)              → 100%
 *   cross-arch only, same size (d≈.12)→ ~87%
 *   one size step / 2× same shape     → ~40% (was a misleading ~8% under the
 *                                        old linear 100−22d, which collapsed so
 *                                        fast that family/category rollups read
 *                                        as near-zero — the root of the S48
 *                                        "x1e is 28% similar but has a perfect
 *                                        size" surprises).
 * Exponential (never floors) keeps the tail strictly monotonic so ranked
 * runners-up stay correctly ordered.
 */
const MATCH_K = 1.157;

/**
 * A 0–100 "how similar" score from a (normalized) vmDistance, for showing the
 * STRENGTH of an equivalence. `100·exp(−k·d)`: identical → 100, smooth decay,
 * floored at 1 for any finite distance, 0 only for a category-gated Infinity.
 */
export function matchPct(distance: number): number {
  if (!isFinite(distance)) return 0;
  return Math.max(1, Math.min(100, Math.round(100 * Math.exp(-MATCH_K * distance))));
}

/** A human-readable breakdown of why two VMs scored what they did. */
export interface DistanceExplanation {
  pct: number;
  /** Dimensions that drove the difference, each a 0–1 share of the raw
   *  distance, biggest first. Empty when the spec is identical. */
  drivers: { dimension: string; share: number }[];
}

const TERM_LABELS: [keyof DistanceTerms, string][] = [
  ['vcpu', 'vCPU'],
  ['mem', 'memory'],
  ['mpv', 'mem/vCPU shape'],
  ['arch', 'CPU arch'],
  ['gpu', 'GPU count'],
  ['net', 'network'],
  ['gen', 'CPU gen'],
  ['disk', 'local storage'],
  ['gpuModel', 'GPU model'],
  ['gpuVram', 'GPU memory'],
  ['gpuLink', 'GPU interconnect'],
  ['tee', 'confidential/TEE'],
  ['burst', 'service model'],
];

/**
 * Explain a match: its percent plus which dimensions drove the gap. The
 * antidote to "false precision" — a UI can show ≈45% AND that it's 60% vCPU /
 * 40% memory, so the number is legible instead of mysterious.
 */
export function explainVmDistance(a: VmFeat, b: VmFeat): DistanceExplanation {
  const d = vmDistance(a, b);
  if (!isFinite(d)) return { pct: 0, drivers: [] };
  const { raw, terms } = vmDistanceParts(a, b);
  const drivers =
    raw > 1e-9
      ? TERM_LABELS.map(([k, label]) => ({ dimension: label, share: terms[k] / raw }))
          .filter((x) => x.share > 0.005)
          .sort((x, y) => y.share - x.share)
      : [];
  return { pct: matchPct(d), drivers };
}

/** One-line tooltip string: "≈45% similar · differs on vCPU 60%, memory 40%". */
export function describeMatch(a: VmFeat, b: VmFeat): string {
  const { pct, drivers } = explainVmDistance(a, b);
  if (!isFinite(vmDistance(a, b))) return 'Different category — no direct equivalent';
  if (!drivers.length) return 'Identical spec — 100% match';
  const top = drivers
    .slice(0, 3)
    .map((d) => `${d.dimension} ${Math.round(d.share * 100)}%`)
    .join(', ');
  return `≈${pct}% similar · differs on ${top}`;
}

export interface VmMatch {
  vm: CatalogEntry;
  distance: number;
  quality: MatchQuality;
}

/**
 * Best cross-cloud size match for `src` among `candidates` (already the target
 * provider's distinct specs). Returns null when no candidate is comparable.
 * `candidates` should be deduped by vmSizeName (specs are region-free).
 *
 * By default the same-category hard gate applies (different categories are
 * skipped). Pass `opts.crossCategoryPenalty > 0` to ALSO consider different-
 * category candidates at a fixed distance penalty — callers use this as a
 * FALLBACK when a cloud has been scoped to a different category than the base,
 * so its families/sizes still surface instead of blanking to "—".
 */
/**
 * Tiebreak for candidates at (essentially) equal distance. Without it, two
 * SKUs that are identical on every weighed dimension — e.g. AWS `r5.large` and
 * `r5d.large` vs a disk-less GP base (same vCPU/RAM/arch/gen; the disk term is
 * gated to Storage Optimized so it never fires for the Memory-Optimized r5*
 * pair) — resolve by raw iteration order, which differs between the equivalents
 * panel (gated pool) and `bestMatchAnalog` (full pool). That made the displayed
 * top match flip (r5.large ↔ r5d.large) the instant a base size was selected.
 * Prefer the candidate whose local disk is closest to the source's (a no-disk
 * base picks the no-disk SKU over its local-NVMe sibling), then lexical by name
 * for full determinism. Both ranking paths route through here, so they agree.
 */
const TIE_EPS = 1e-9;
function tiePref(srcFeat: VmFeat, a: CatalogEntry, b: CatalogEntry): number {
  const da = Math.abs((a.localDiskGib || 0) - srcFeat.localDiskGib);
  const db = Math.abs((b.localDiskGib || 0) - srcFeat.localDiskGib);
  if (Math.abs(da - db) > TIE_EPS) return da - db;
  return a.vmSizeName.localeCompare(b.vmSizeName);
}

export function bestVmMatch(
  src: CatalogEntry,
  candidates: CatalogEntry[],
  opts?: VmDistanceOpts,
): VmMatch | null {
  const a = vmFeatures(src);
  let best: VmMatch | null = null;
  for (const c of candidates) {
    const d = vmDistance(a, vmFeatures(c), opts);
    if (!isFinite(d)) continue;
    if (!best) {
      best = { vm: c, distance: d, quality: matchQuality(d) };
    } else if (
      d < best.distance - TIE_EPS ||
      (Math.abs(d - best.distance) <= TIE_EPS && tiePref(a, c, best.vm) < 0)
    ) {
      best = { vm: c, distance: d, quality: matchQuality(d) };
    }
  }
  return best;
}

/**
 * The top `k` closest matches for `src` among `candidates`, nearest first.
 * Same scoring as `bestVmMatch` (finite distances only); used to surface the
 * best analog PLUS a couple of greyed "suggested next best" alternatives.
 */
export function topVmMatches(
  src: CatalogEntry,
  candidates: CatalogEntry[],
  k: number,
  opts?: VmDistanceOpts,
): VmMatch[] {
  const a = vmFeatures(src);
  const scored: VmMatch[] = [];
  for (const c of candidates) {
    const d = vmDistance(a, vmFeatures(c), opts);
    if (!isFinite(d)) continue;
    scored.push({ vm: c, distance: d, quality: matchQuality(d) });
  }
  scored.sort((x, y) => {
    const dd = x.distance - y.distance;
    if (Math.abs(dd) > TIE_EPS) return dd;
    return tiePref(a, x.vm, y.vm);
  });
  return scored.slice(0, Math.max(0, k));
}

// ── Region equivalency ───────────────────────────────────────────────────────
export interface RegionRef {
  provider: string;
  region: string;
  geo: RegionGeo;
}

export interface RegionMatch {
  region: string;
  geo: RegionGeo;
  sameCountry: boolean;
  distanceKm: number;
}

/**
 * Best region match for `src` among `candidates` (one provider's regions).
 * Country first (nearest within it), else the globally nearest region flagged
 * `sameCountry: false`. Gov regions only match gov; edge zones are skipped.
 */
export function bestRegionMatch(src: RegionRef, candidates: RegionRef[]): RegionMatch | null {
  let sameCountry: RegionMatch | null = null;
  let nearest: RegionMatch | null = null;
  for (const c of candidates) {
    if (c.geo.edge) continue; // edge zones have no cross-cloud peer
    if (!!src.geo.gov !== !!c.geo.gov) continue; // gov ↔ gov only
    const km = haversineKm(src.geo, c.geo);
    const m: RegionMatch = { region: c.region, geo: c.geo, sameCountry: c.geo.cc === src.geo.cc, distanceKm: km };
    if (m.sameCountry && (!sameCountry || km < sameCountry.distanceKm)) sameCountry = m;
    if (!nearest || km < nearest.distanceKm) nearest = m;
  }
  return sameCountry ?? nearest;
}

/** Build a provider's region refs (resolving geo, dropping unmappable). */
export function regionRefs(provider: string, regions: string[]): RegionRef[] {
  const out: RegionRef[] = [];
  for (const region of regions) {
    const geo = regionGeo(provider, region);
    if (geo) out.push({ provider, region, geo });
  }
  return out;
}
