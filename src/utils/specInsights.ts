// ────────────────────────────────────────────────────────────────────────
// specInsights — executive "key takeaway" insight engine for the cross-cloud
// VM comparison page.
//
// Pure functions only. Given a set of VMs the user has selected to compare,
// produce: (a) per-VM nuance notes, (b) a per-VM "best for" conclusion, and
// (c) an overall executive key-takeaway that leads with the most decision-
// relevant difference. A product-mode variant summarizes a whole VM FAMILY or
// CATEGORY rather than individual sizes.
//
// Everything asserted here is GROUNDED in the spec fields we actually have
// (vcpus / memoryGib / networkMbps / processor / acceleratorType / family /
// category) plus the reused equivalence helpers. We never fabricate exact
// benchmark numbers. A small curated knowledge table enriches family prose as
// a FALLBACK that layers on the spec-derived facts and degrades gracefully.
// ────────────────────────────────────────────────────────────────────────

import type { CatalogEntry, VmCategory } from '../types';
import { genFor, archFromName, cpuArch, vmFeatures, type CpuArch, type VmFeat } from './equivalence';
import { categorize } from './vmCategory';
import { vmFamily } from './vmTaxonomy';
import { familyToken } from './acceleratorSpecs';

// ── Public types ─────────────────────────────────────────────────────────

export type NuanceKind =
  | 'generation'
  | 'architecture'
  | 'bare-metal'
  | 'network'
  | 'memory-density'
  | 'compute-density'
  | 'gpu';

export interface SpecNuance {
  kind: NuanceKind;
  /** Short chip text. */
  label: string;
  /** One-sentence explanation. */
  detail: string;
}

export interface VmSpecInsight {
  provider: string;
  vmSizeName: string;
  displayName: string;
  nuances: SpecNuance[];
  bestFor: string;
  /** The one dimension where THIS VM stands out versus the others in the same
   *  comparison (newest CPU gen, most network, memory/compute-dense, bare-metal,
   *  Arm price/perf, GPU). Set by `compareSpecs` (needs the peer set); undefined
   *  for a single VM or when nothing clearly separates it. */
  standout?: string;
  /** The one dimension where THIS VM clearly TRAILS the others (lowest network
   *  bandwidth, no local NVMe while peers have it, fewest vCPUs, least RAM). The
   *  honest counterweight to `standout` — same significance gates, unique loser
   *  only. Undefined when nothing materially separates it on the downside. */
  weakness?: string;
}

export interface SpecComparison {
  vms: VmSpecInsight[];
  /** One-line verdict. */
  headline: string;
  /** 2–4 sentence exec summary, most important difference first. */
  keyTakeaway: string;
}

export interface ProductInsight {
  name: string;
  kind: 'family' | 'category';
  whatItIs: string;
  keyPoints: string[];
  bestFor: string;
  /** The decision nuance — when to pick this family / when it's worth paying
   *  more vs a cheaper analog. Sourced from vendor docs where curated. */
  pickWhen?: string;
  /** Rough cross-cloud analogs (informed heuristic, not a vendor-stated mapping). */
  analogs?: string;
  /** Primary vendor source URL backing the curated fact, when available. */
  source?: string;
}

/**
 * A vendor performance / feature CLAIM that we could NOT independently verify.
 *
 * These are the "up to X%" figures that vendors publish in marketing — better
 * price/performance, IOPS, density, TEE overhead — that FAILED the deep-research
 * adversarial verification (the source is the vendor's own page; no independent
 * benchmark corroborates the exact number). We surface them as honest caveats so
 * a planner treats them as directional, not guaranteed. The figures may still
 * appear (hedged) in the curated prose; this is the explicit "don't bank on it"
 * disclosure..
 */
export interface UnverifiedClaim {
  /** Stable id (for keys / dedup). */
  id: string;
  /** Provider that asserts it — for tint/label. Omit for a cross-vendor rule. */
  provider?: string;
  /** The claim, paraphrased plainly (the figure the vendor markets). */
  claim: string;
  /** Why we couldn't confirm it — one line. */
  why: string;
  /** Where the vendor states it, when we have a URL. */
  source?: string;
  /** Normalized family tokens this applies to; matched against the comparison. */
  families?: string[];
  /** Cross-family rule instead of a family list (shown by relevance). */
  generalized?: 'arm' | 'newest-gen';
}

// ── Small constants ──────────────────────────────────────────────────────

/** Mbps thresholds for the network-tier nuance. */
const NET_HIGH_MBPS = 50_000; // ≥ 50 Gbps
const NET_MID_MBPS = 25_000; // ≥ 25 Gbps

/** memory-per-vCPU band edges. */
const MPV_COMPUTE_MAX = 2; // < 2 GiB/vCPU → compute-dense
const MPV_MEMORY_MIN = 6; // > 6 GiB/vCPU → memory-dense

// ── Arch labeling ───────────────────────────────────────────────────────

/** Provider-aware marketing name for an Arm part, when inferable. Returns
 *  null for non-Arm or unknown. Grounded in provider + arch only. */
function armBrand(provider: string | undefined, processor: string | undefined): string | null {
  const proc = (processor || '').toLowerCase();
  if (/graviton/.test(proc)) {
    const m = proc.match(/graviton\s*(\d)/);
    return m ? `Graviton${m[1]}` : 'Graviton';
  }
  if (/cobalt/.test(proc)) return 'Cobalt';
  if (/axion/.test(proc)) return 'Axion';
  if (/ampere|altra/.test(proc)) return 'Ampere';
  const prov = (provider || '').toLowerCase();
  if (prov === 'aws') return 'Graviton';
  if (prov === 'azure') return 'Cobalt';
  if (prov === 'gcp') return 'Axion';
  return null;
}

function archLabel(arch: CpuArch): string {
  if (arch === 'arm') return 'Arm';
  if (arch === 'amd') return 'AMD';
  if (arch === 'intel') return 'Intel';
  return 'x86';
}

/** Resolve the effective architecture for a VM (processor first, name fallback). */
function archOf(vm: CatalogEntry): CpuArch {
  let arch = cpuArch(vm.processor);
  if (arch === 'other') arch = archFromName(vm.provider, vm.vmSizeName);
  return arch;
}

// ── Bare-metal detection ─────────────────────────────────────────────────

/**
 * Detect bare-metal SKUs from the size NAME (data-driven, no per-cloud table).
 *   AWS:   `*.metal`, `*.metal-16xl`, `*.metal-48xl` (a `.metal` token).
 *   GCP:   `*-metal` machine types (a `-metal` token).
 *   Azure: no public bare-metal VM SIZES → only flagged if the literal token
 *          'metal' appears in the name.
 */
export function bareMetalFromName(provider: string, vmSizeName: string): boolean {
  const name = (vmSizeName || '').toLowerCase();
  if (!name) return false;
  const prov = (provider || '').toLowerCase();
  if (prov === 'aws') {
    // AWS uses ".metal" or ".metal-<size>" as the trailing size token.
    return /\.metal(\b|-)/.test(name);
  }
  if (prov === 'gcp') {
    return /-metal(\b|-)/.test(name);
  }
  // Azure (+ unknown providers): only the literal token.
  return /\bmetal\b/.test(name) || /[._-]metal(\b|[._-])/.test(name);
}

// ── Per-VM nuance derivation ─────────────────────────────────────────────

/**
 * Assumption marker appended to a processor/gen label when the processor string
 * was NOT vendor-published (B2). Azure's feed carries no processor, so the join
 * fills it from a curated, source-cited map ('curated') or a coarse SKU-name
 * read ('inferred'); either way the user must see it's an assumption, with a
 * tooltip naming the source. Vendor-published strings get no marker.
 */
function assumptionMarker(vm: CatalogEntry): { label: string; title: string } | null {
  const src = vm.processorSource;
  if (!src || src === 'vendor') return null;
  return {
    label: ' (assumed)',
    title:
      src === 'curated'
        ? "Not published by Azure's API — curated from Microsoft Learn per-series docs."
        : 'Inferred from the size name — Azure schedules this size across several microarchitectures, so the exact CPU varies by region and host.',
  };
}

/**
 * Host-dependent silicon phrasing from the row's PERSISTED `processorOptions`
 * (set by the join for dual-silicon families — Azure Dv3 = Broadwell + Skylake,
 * GCP n2 = Cascade Lake + Ice Lake). We read the persisted split rather than
 * re-inferring, so display and matching agree. '' when single-silicon.
 */
function hostDependentNote(vm: CatalogEntry): string {
  const opts = (vm.processorOptions ?? []).filter(Boolean);
  if (opts.length < 2) return '';
  return ` This family runs on ${opts.join(' or ')} (host-dependent) — the cloud places you on whichever its hosts provide (you don't choose), and both count as the same generation here.`;
}

function generationNuance(vm: CatalogEntry): SpecNuance | null {
  const gen = genFor(vm);
  const marker = assumptionMarker(vm);
  const hostDep = hostDependentNote(vm);
  if (!gen) {
    // No precise rank — but show the row's PERSISTED processor string (the join
    // filled Azure from the curated/inferred tiers) rather than re-inferring, so
    // the CPU is never blank. Honest "(assumed)" marker when it's non-vendor.
    const proc = (vm.processor || '').trim();
    if (!proc) return null;
    return {
      kind: 'generation',
      label: `${proc}${marker?.label ?? ''}`,
      detail:
        `Runs on ${proc}-class CPUs.` +
        (hostDep ||
          ' Azure schedules this size across a few microarchitectures, so the exact generation varies by region and host.') +
        (marker ? ` (${marker.title})` : ''),
    };
  }
  const newish = gen.rank >= 4; // Genoa / Ice Lake+ / Graviton4 era
  // A slashed gen label (e.g. GCP n2 "Cascade Lake/Ice Lake") ALSO means the
  // family spans EITHER microarchitecture. Prefer the persisted processorOptions
  // note when present; otherwise fall back to the label's own slash.
  const isSpan = gen.label.includes('/');
  const spanNote =
    hostDep ||
    (isSpan
      ? ` Note: this family runs on EITHER ${gen.label.replace('/', ' or ')} — the cloud places you on whichever its hosts provide (you don't choose), and both rank as the same generation here.`
      : '');
  return {
    kind: 'generation',
    label: `${gen.label}${marker?.label ?? ''}`,
    detail:
      (newish
        ? // Verified, vendor-general (AWS/Azure/GCP gen-over-gen): a newer family is
          // typically ~15–30% better price-performance than its predecessor.
          `Runs on a newer-generation ${gen.label} CPU — typically ~15–30% better price/performance than the prior family; default to the newest generation unless region availability blocks it.`
        : `Runs on an older-generation ${gen.label} CPU — a newer generation usually offers materially better price/performance if available.`) +
      spanNote +
      (marker ? ` (${marker.title})` : ''),
  };
}

function architectureNuance(vm: CatalogEntry): SpecNuance | null {
  const arch = archOf(vm);
  if (arch === 'arm') {
    const brand = armBrand(vm.provider, vm.processor);
    // Verified, vendor-general: Arm (Graviton/Cobalt/Axion) is typically ~20–30%
    // better price/performance for scale-out, Arm-compatible code; x86 wins for
    // legacy binaries, AVX-512, or single-thread-sensitive workloads.
    const decision =
      'typically ~20–30% better price/performance for scale-out, Arm-compatible code — choose x86 instead for legacy binaries, AVX-512, or single-thread-sensitive workloads.';
    return {
      kind: 'architecture',
      label: brand ? `Arm · ${brand}` : 'Arm',
      detail: brand
        ? `Arm-based (${brand}) — ${decision}`
        : `Arm-based architecture — ${decision}`,
    };
  }
  if (arch === 'amd') {
    return {
      kind: 'architecture',
      label: 'AMD',
      detail: 'AMD EPYC x86 — high core counts, usually a small discount versus the Intel line.',
    };
  }
  // Intel / x86 is the unremarkable baseline — no nuance chip.
  return null;
}

function bareMetalNuance(vm: CatalogEntry): SpecNuance | null {
  if (!bareMetalFromName(vm.provider || '', vm.vmSizeName)) return null;
  return {
    kind: 'bare-metal',
    label: 'Bare metal',
    detail:
      'Bare-metal SKU — no hypervisor, direct access to the physical host for license-bound or virtualization workloads.',
  };
}

function networkNuance(vm: CatalogEntry): SpecNuance | null {
  const mbps = Math.max(0, vm.networkMbps || 0);
  // "(est.)" when the Mbps came from a curated legacy-doc fallback rather than
  // the primary scrape/API — so the planner treats it as directional (B2).
  const est = vm.networkEstimated ? ' (est.)' : '';
  const estNote = vm.networkEstimated
    ? ' Estimated from Azure previous-generation docs (not the primary feed).'
    : '';
  if (mbps >= NET_HIGH_MBPS) {
    return {
      kind: 'network',
      label: `${Math.round(mbps / 1000)} Gbps network${est}`,
      detail: `High network bandwidth (~${Math.round(mbps / 1000)} Gbps) — suits distributed, data-shuffling and storage-heavy workloads.${estNote}`,
    };
  }
  if (mbps >= NET_MID_MBPS) {
    return {
      kind: 'network',
      label: `${Math.round(mbps / 1000)} Gbps network${est}`,
      detail: `Solid network bandwidth (~${Math.round(mbps / 1000)} Gbps).${estNote}`,
    };
  }
  return null;
}

function densityNuance(feat: VmFeat): SpecNuance | null {
  const mpv = feat.memPerVcpu;
  if (mpv > MPV_MEMORY_MIN) {
    return {
      kind: 'memory-density',
      label: `${mpv.toFixed(1)} GiB/vCPU`,
      detail: `Memory-dense (${mpv.toFixed(1)} GiB per vCPU) — built for memory-bound workloads like in-memory databases and analytics.`,
    };
  }
  if (mpv < MPV_COMPUTE_MAX) {
    return {
      kind: 'compute-density',
      label: `${mpv.toFixed(1)} GiB/vCPU`,
      detail: `Compute-dense (${mpv.toFixed(1)} GiB per vCPU) — built for CPU-bound, latency-sensitive and batch-compute workloads.`,
    };
  }
  return null;
}

function gpuNuance(vm: CatalogEntry, feat: VmFeat): SpecNuance | null {
  if (feat.gpus <= 0) return null;
  const accel = (vm.acceleratorType || '').trim();
  const hasName = accel && accel.toLowerCase() !== 'none';
  return {
    kind: 'gpu',
    label: feat.gpus > 1 ? `${feat.gpus}× GPU` : 'GPU',
    detail: hasName
      ? `Accelerated with ${feat.gpus}× ${accel} — for ML training/inference and other GPU-bound compute.`
      : `GPU-accelerated (${feat.gpus}×) — for ML training/inference and other GPU-bound compute.`,
  };
}

/** Compose a grounded "best for" conclusion from the derived signals. */
function bestForFrom(vm: CatalogEntry, feat: VmFeat, nuances: SpecNuance[]): string {
  const kinds = new Set(nuances.map((n) => n.kind));
  const highNet = (vm.networkMbps || 0) >= NET_MID_MBPS;
  const newGen = (() => {
    const g = genFor(vm);
    return !!g && g.rank >= 4;
  })();

  if (kinds.has('gpu')) {
    return 'ML training/inference and other GPU-accelerated compute.';
  }
  if (kinds.has('bare-metal')) {
    return 'License-bound, hypervisor or security-isolated workloads needing the whole physical host.';
  }
  if (kinds.has('memory-density')) {
    return highNet
      ? 'In-memory databases, large caches and analytics — with the bandwidth for distributed data sets.'
      : 'In-memory databases, large caches and memory-bound analytics.';
  }
  if (kinds.has('compute-density')) {
    return newGen
      ? 'Latency-sensitive web/app tiers and batch compute, on a newer-generation core.'
      : 'CPU-bound web/app tiers, gaming and batch compute.';
  }
  if (highNet) {
    return 'Network-bound and distributed workloads needing high east-west bandwidth.';
  }
  // Balanced / general purpose default.
  const arch = archOf(vm);
  if (arch === 'arm') {
    return 'General-purpose, scale-out cloud-native services at strong price/performance.';
  }
  return 'Balanced, general-purpose application and middle-tier workloads.';
}

function displayNameOf(vm: CatalogEntry): string {
  const prov = vm.provider ? `${vm.provider} ` : '';
  return `${prov}${vm.vmSizeName}`.trim();
}

export function vmSpecInsight(vm: CatalogEntry): VmSpecInsight {
  const feat = vmFeatures(vm);
  const nuances: SpecNuance[] = [];

  const gpu = gpuNuance(vm, feat);
  if (gpu) nuances.push(gpu);
  const bm = bareMetalNuance(vm);
  if (bm) nuances.push(bm);
  const density = densityNuance(feat);
  if (density) nuances.push(density);
  const arch = architectureNuance(vm);
  if (arch) nuances.push(arch);
  const gen = generationNuance(vm);
  if (gen) nuances.push(gen);
  const net = networkNuance(vm);
  if (net) nuances.push(net);

  return {
    provider: vm.provider || '',
    vmSizeName: vm.vmSizeName,
    displayName: displayNameOf(vm),
    nuances,
    bestFor: bestForFrom(vm, feat, nuances),
  };
}

// ── Cross-VM comparison synthesis ─────────────────────────────────────────

function genVendorRankLabel(vm: CatalogEntry): { vendor: string; rank: number; label: string } | null {
  const g = genFor(vm);
  if (!g) return null;
  return { vendor: g.vendor, rank: g.rank, label: g.label };
}

export function compareSpecs(vms: CatalogEntry[]): SpecComparison {
  const insights = vms.map(vmSpecInsight);

  if (vms.length === 0) {
    return {
      vms: [],
      headline: 'No VMs selected to compare.',
      keyTakeaway: 'Add VMs from two or more clouds to see how their specs differ.',
    };
  }
  if (vms.length === 1) {
    const only = insights[0];
    return {
      vms: insights,
      headline: `${only.displayName}: best for ${only.bestFor.replace(/\.$/, '')}.`,
      keyTakeaway: `${only.displayName} is ${only.nuances.map((n) => n.label).join(', ') || 'a balanced general-purpose size'}. Best for ${only.bestFor}`,
    };
  }

  const feats = vms.map(vmFeatures);
  const points: string[] = [];

  // 1) Generation gap (same vendor only — ranks compare within a vendor).
  const gens = vms.map(genVendorRankLabel);
  const byVendor = new Map<string, { vm: CatalogEntry; rank: number; label: string }[]>();
  gens.forEach((g, i) => {
    if (!g) return;
    const arr = byVendor.get(g.vendor) || [];
    arr.push({ vm: vms[i], rank: g.rank, label: g.label });
    byVendor.set(g.vendor, arr);
  });
  let genPoint: string | null = null;
  for (const arr of byVendor.values()) {
    if (arr.length < 2) continue;
    const sorted = [...arr].sort((a, b) => b.rank - a.rank);
    const top = sorted[0];
    const bot = sorted[sorted.length - 1];
    if (top.rank > bot.rank) {
      genPoint = `${top.vm.provider || 'One option'} is on a newer CPU generation (${top.label}) than ${bot.vm.provider || 'another'} (${bot.label}) here.`;
      break;
    }
  }
  if (genPoint) points.push(genPoint);

  // 2) Architecture spread (Arm vs x86).
  const archs = vms.map(archOf);
  const hasArm = archs.includes('arm');
  const hasX86 = archs.some((a) => a === 'intel' || a === 'amd');
  if (hasArm && hasX86) {
    const armVm = vms[archs.findIndex((a) => a === 'arm')];
    const brand = armBrand(armVm.provider, armVm.processor);
    points.push(
      `Architectures differ: ${armVm.provider || 'one cloud'} offers Arm${brand ? ` (${brand})` : ''} — usually ~20–30% better price/performance for scale-out, Arm-compatible code — while the rest are x86 for legacy binaries, AVX-512 and single-thread-sensitive code.`,
    );
  }

  // 3) Bare-metal availability.
  const metalVms = vms.filter((v) => bareMetalFromName(v.provider || '', v.vmSizeName));
  if (metalVms.length > 0 && metalVms.length < vms.length) {
    points.push(
      `Only ${metalVms.map((v) => v.provider || v.vmSizeName).join(', ')} exposes a bare-metal SKU for license-bound or hypervisor workloads.`,
    );
  }

  // 4) Network bandwidth spread.
  const nets = vms.map((v) => Math.max(0, v.networkMbps || 0));
  const maxNet = Math.max(...nets);
  const minNet = Math.min(...nets);
  if (maxNet > 0 && maxNet >= minNet * 1.5 && maxNet - minNet >= 10_000) {
    const topVm = vms[nets.indexOf(maxNet)];
    points.push(
      `Network bandwidth ranges from ~${Math.round(minNet / 1000)} to ~${Math.round(maxNet / 1000)} Gbps — ${topVm.provider || topVm.vmSizeName} leads for data-shuffling workloads.`,
    );
  }

  // 5) Memory-density differences.
  const mpvs = feats.map((f) => f.memPerVcpu);
  const maxMpv = Math.max(...mpvs);
  const minMpv = Math.min(...mpvs);
  if (maxMpv >= MPV_MEMORY_MIN && minMpv < MPV_COMPUTE_MAX) {
    const densest = vms[mpvs.indexOf(maxMpv)];
    const leanest = vms[mpvs.indexOf(minMpv)];
    points.push(
      `Memory profile diverges sharply: ${densest.provider || densest.vmSizeName} is memory-dense (${maxMpv.toFixed(1)} GiB/vCPU) while ${leanest.provider || leanest.vmSizeName} is compute-dense (${minMpv.toFixed(1)} GiB/vCPU) — they target different workloads.`,
    );
  } else if (maxMpv >= minMpv * 1.4 && maxMpv - minMpv >= 1) {
    const densest = vms[mpvs.indexOf(maxMpv)];
    points.push(
      `${densest.provider || densest.vmSizeName} carries the most memory per vCPU (${maxMpv.toFixed(1)} GiB) of the set.`,
    );
  }

  // Headline = lead with the single most decision-relevant difference.
  const headline =
    points[0] ||
    `These ${vms.length} sizes are closely matched on architecture, generation and memory profile.`;

  // Key takeaway = up to the top 3 points, executive tone, verdict first.
  const lead = points.length
    ? points.slice(0, 3).join(' ')
    : `The selected sizes are near-equivalent on the spec dimensions that usually drive a decision — pick on price and regional availability.`;
  const closer = (() => {
    // Add a per-VM "best at" closer when nuances cleanly separate them.
    const tags = insights
      .filter((i) => i.nuances.length)
      .map((i) => `${i.displayName} → ${i.bestFor.replace(/\.$/, '')}`);
    return tags.length ? ` In short: ${tags.join('; ')}.` : '';
  })();

  // Per-VM standout — the ONE dimension where this VM clearly leads the set, so
  // each cloud column can answer "why this one?" at a glance. Computed from the
  // same cross-VM signals as the points above; only set when there's a clear,
  // non-tied leader (ties → no standout, to avoid a meaningless badge).
  if (vms.length >= 2) {
    const gpus = feats.map((f) => f.gpus);
    const maxGpu = Math.max(...gpus);
    const disks = feats.map((f) => f.localDiskGib);
    const maxDisk = Math.max(...disks);
    // Newest CPU generation is only comparable WITHIN a vendor (Intel / AMD /
    // Arm use different rank scales). Mark a VM as the gen leader only when it
    // beats another VM OF THE SAME VENDOR — never cross-vendor.
    const isVendorGenLeader = (i: number): boolean => {
      const g = gens[i];
      if (!g) return false;
      const peers = gens.filter((p) => p && p.vendor === g.vendor) as { rank: number }[];
      return peers.length >= 2 && g.rank > Math.min(...peers.map((p) => p.rank)) && g.rank === Math.max(...peers.map((p) => p.rank));
    };
    insights.forEach((ins, i) => {
      const f = feats[i];
      const reasons: string[] = [];
      if (maxGpu > 0 && gpus[i] === maxGpu && gpus.filter((g) => g === maxGpu).length === 1)
        reasons.push(`most GPU power of the set (${gpus[i]}× accelerator)`);
      if (bareMetalFromName(vms[i].provider || '', vms[i].vmSizeName) && metalVms.length === 1)
        reasons.push('the only bare-metal option');
      if (maxDisk > 0 && disks[i] === maxDisk && disks.filter((d) => d > 0).length === 1)
        reasons.push(`the only one with local NVMe SSD (~${Math.round(maxDisk)} GiB) — fastest ephemeral storage`);
      if (isVendorGenLeader(i))
        reasons.push(`the newest CPU generation here (${gens[i]!.label})`);
      if (maxNet > 0 && nets[i] === maxNet && nets.filter((n) => n === maxNet).length === 1 && maxNet >= minNet * 1.25 && maxNet - minNet >= 5_000)
        reasons.push(`the most network bandwidth (~${Math.round(maxNet / 1000)} Gbps)`);
      if (f.memPerVcpu === maxMpv && mpvs.filter((m) => m === maxMpv).length === 1 && maxMpv >= minMpv * 1.25 && maxMpv >= MPV_MEMORY_MIN)
        reasons.push(`the most memory per vCPU (${maxMpv.toFixed(1)} GiB)`);
      else if (f.memPerVcpu === minMpv && mpvs.filter((m) => m === minMpv).length === 1 && minMpv < MPV_COMPUTE_MAX && maxMpv >= minMpv * 1.25)
        reasons.push(`the leanest memory-per-vCPU (${minMpv.toFixed(1)} GiB) — most CPU-dense`);
      if (archOf(vms[i]) === 'arm' && archs.filter((a) => a === 'arm').length === 1) {
        const brand = armBrand(vms[i].provider, vms[i].processor);
        reasons.push(`the only Arm option${brand ? ` (${brand})` : ''} — typically the best price/performance for scale-out code`);
      }
      // Lead with the first (priority-ordered) reason.
      if (reasons.length) ins.standout = reasons[0];
    });

    // Per-VM WEAKNESS — the honest counterweight to `standout`: the ONE dimension
    // where this VM clearly TRAILS the set. Same significance gates (clear, non-
    // tied loser; meaningful spread) so we never flag a trivial difference. The
    // user asked for weaknesses called out alongside strengths (e.g. "Mbdsv3 has
    // the lowest bandwidth of the three providers").
    const vcpus = feats.map((f) => f.vcpus);
    const maxVcpu = Math.max(...vcpus);
    const minVcpu = Math.min(...vcpus);
    const mems = feats.map((f) => f.memoryGib);
    const maxMem = Math.max(...mems);
    const minMem = Math.min(...mems);
    // Oldest CPU generation — comparable ONLY within a vendor (Intel/AMD/Arm rank
    // on different scales), mirroring isVendorGenLeader.
    const isVendorGenLaggard = (i: number): boolean => {
      const g = gens[i];
      if (!g) return false;
      const peers = gens.filter((p) => p && p.vendor === g.vendor) as { rank: number }[];
      return (
        peers.length >= 2 &&
        g.rank < Math.max(...peers.map((p) => p.rank)) &&
        g.rank === Math.min(...peers.map((p) => p.rank))
      );
    };
    insights.forEach((ins, i) => {
      const f = feats[i];
      const reasons: string[] = [];
      // 1) Lowest network bandwidth — the headline weakness for data-shuffling.
      if (maxNet > 0 && nets[i] === minNet && nets.filter((n) => n === minNet).length === 1 && minNet <= maxNet * 0.75 && maxNet - minNet >= 5_000)
        reasons.push(`the lowest network bandwidth here (~${Math.round(minNet / 1000)} Gbps vs ~${Math.round(maxNet / 1000)} Gbps top) — trails for data-shuffling`);
      // 2) No local NVMe while ≥1 peer ships it.
      if (f.localDiskGib === 0 && maxDisk > 0 && disks.filter((d) => d === 0).length === 1)
        reasons.push(`the only one without local NVMe SSD — peers ship ephemeral local storage`);
      // 3) Oldest CPU generation (within vendor).
      if (isVendorGenLaggard(i))
        reasons.push(`the oldest CPU generation here (${gens[i]!.label}) — a newer same-vendor gen is in the set`);
      // 4) Fewest vCPUs (only when the gap is large — these are usually size-matched).
      if (vcpus[i] === minVcpu && vcpus.filter((v) => v === minVcpu).length === 1 && minVcpu <= maxVcpu * 0.6 && maxVcpu - minVcpu >= 4)
        reasons.push(`the fewest vCPUs of the set (${minVcpu} vs ${maxVcpu})`);
      // 5) Least total memory (large gap only).
      if (mems[i] === minMem && mems.filter((m) => m === minMem).length === 1 && minMem <= maxMem * 0.6 && maxMem - minMem >= 16)
        reasons.push(`the least memory of the set (${Math.round(minMem)} vs ${Math.round(maxMem)} GiB)`);
      // Lead with the first (priority-ordered) reason. Don't restate the standout
      // dimension as a weakness — they're already distinct metrics, but skip if it
      // would duplicate the standout's leading phrase.
      if (reasons.length && reasons[0] !== ins.standout) ins.weakness = reasons[0];
    });
  }

  return {
    vms: insights,
    headline,
    keyTakeaway: `${lead}${closer}`.trim(),
  };
}

// ── Curated family knowledge (FALLBACK enrichment only) ───────────────────

interface FamilyFact {
  /** One grounded sentence on what the family is for. */
  whatItIs: string;
  /** When to pick this / when it's worth paying more vs a cheaper analog. */
  pickWhen?: string;
  /** Rough cross-cloud analogs (informed heuristic, not a vendor-stated mapping). */
  analogs?: string;
  /** Primary vendor source URL backing the fact. */
  source?: string;
}

// `familyToken` is imported from `./acceleratorSpecs` (single source of truth so
// the family lookup key stays identical for FAMILY_KNOWLEDGE and the GPU/TEE specs).

// Vendor source URLs (primary docs that backed the verified facts below).
const SRC = {
  awsGp: 'https://docs.aws.amazon.com/ec2/latest/instancetypes/gp.html',
  awsM8g: 'https://aws.amazon.com/ec2/instance-types/m8g/',
  awsR8g: 'https://aws.amazon.com/ec2/instance-types/r8g/',
  awsP5: 'https://aws.amazon.com/ec2/instance-types/p5/',
  awsC7i: 'https://aws.amazon.com/ec2/instance-types/c7i/',
  azDasv6:
    'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/general-purpose/dasv6-series',
  azEpsv6:
    'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/memory-optimized/epsv6-series',
  azNdH200:
    'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/gpu-accelerated/nd-h200-v5-series',
  azNaming: 'https://learn.microsoft.com/en-us/azure/virtual-machines/vm-naming-conventions',
  gcpGp: 'https://docs.cloud.google.com/compute/docs/general-purpose-machines',
  // Storage-optimized + HPC (deep-research S55, vendor first-party, verified 3-0).
  awsI7i: 'https://aws.amazon.com/ec2/instance-types/i7i/',
  awsI4i: 'https://aws.amazon.com/ec2/instance-types/i4i/',
  awsI4g: 'https://aws.amazon.com/ec2/instance-types/i4g/',
  awsSo: 'https://docs.aws.amazon.com/ec2/latest/instancetypes/so.html',
  azLsv3: 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/storage-optimized/lsv3-series',
  azLasv3: 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/storage-optimized/lasv3-series',
  awsHpc7a: 'https://aws.amazon.com/ec2/instance-types/hpc7a/',
  awsHpc7g: 'https://aws.amazon.com/ec2/instance-types/hpc7g/',
  azHb: 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/high-performance-compute/hb-family',
  // Burstable + confidential (deep-research S55, vendor first-party / peer-reviewed, verified 3-0).
  awsT3: 'https://aws.amazon.com/ec2/instance-types/t3/',
  azB: 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/b-series-cpu-credit-model',
  azBpsv2: 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/general-purpose/bpsv2-series',
  azConf: 'https://learn.microsoft.com/en-us/azure/confidential-computing/virtual-machine-options',
  azConfGpu: 'https://learn.microsoft.com/en-us/azure/confidential-computing/gpu-options',
  gcpConf: 'https://docs.cloud.google.com/confidential-computing/confidential-vm/docs/supported-configurations',
  // GCP storage / HPC / accelerated + AWS confidential (deep-research S57, vendor first-party, verified 3-0).
  gcpZ3: 'https://docs.cloud.google.com/compute/docs/storage-optimized-machines',
  gcpH3: 'https://docs.cloud.google.com/compute/docs/compute-optimized-machines',
  gcpH4d: 'https://cloud.google.com/blog/products/compute/h4d-vms-now-ga',
  gcpAccel: 'https://docs.cloud.google.com/compute/docs/accelerator-optimized-machines',
  awsSevSnp: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/sev-snp.html',
  // 2026-Q4 quarterly refresh (researcher + 2 independent verifiers, vendor first-party).
  awsM8i: 'https://aws.amazon.com/ec2/instance-types/m8i/',
  awsC8i: 'https://docs.aws.amazon.com/ec2/latest/instancetypes/co.html',
  awsR8i: 'https://aws.amazon.com/ec2/instance-types/r8i/',
  awsM8a: 'https://aws.amazon.com/ec2/instance-types/m8a/',
  awsC8a: 'https://aws.amazon.com/ec2/instance-types/c8a/',
  awsR8a: 'https://aws.amazon.com/ec2/instance-types/r8a/',
  awsM9g: 'https://aws.amazon.com/ec2/instance-types/m9g/',
  awsC9g:
    'https://aws.amazon.com/blogs/aws/amazon-ec2-c9g-and-c9gd-instances-powered-by-aws-graviton5-processors-are-now-available/',
  awsX8g: 'https://aws.amazon.com/ec2/instance-types/x8g/',
  awsX8i: 'https://aws.amazon.com/ec2/instance-types/x8i/',
  awsI8g: 'https://aws.amazon.com/ec2/instance-types/i8g/',
  awsHpc8a:
    'https://aws.amazon.com/blogs/aws/amazon-ec2-hpc8a-instances-powered-by-5th-gen-amd-epyc-processors-are-now-available/',
  awsP4: 'https://aws.amazon.com/ec2/instance-types/p4/',
  awsP6: 'https://aws.amazon.com/ec2/instance-types/p6/',
  awsG6: 'https://aws.amazon.com/ec2/instance-types/g6/',
  awsG6e: 'https://aws.amazon.com/ec2/instance-types/g6e/',
  awsG7: 'https://aws.amazon.com/ec2/instance-types/g7/',
  awsG7e: 'https://aws.amazon.com/ec2/instance-types/g7e/',
  awsTrn1: 'https://aws.amazon.com/ec2/instance-types/trn1/',
  awsTrn2: 'https://aws.amazon.com/ec2/instance-types/trn2/',
  awsInf2: 'https://aws.amazon.com/ec2/instance-types/inf2/',
  azDsv7: 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/general-purpose/dsv7-series',
  azEsv7: 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/memory-optimized/esv7-series',
  azDsv6: 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/general-purpose/dsv6-series',
  azDpsv6: 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/general-purpose/dpsv6-series',
  azDasv7: 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/general-purpose/dasv7-series',
  azEasv7: 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/memory-optimized/easv7-series',
  azFasv7: 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/compute-optimized/fasv7-series',
  azHbv5: 'https://learn.microsoft.com/en-us/azure/virtual-machines/hbv5-series-overview',
  azHbv2: 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/high-performance-compute/hbv2-series',
  azHc: 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/high-performance-compute/hc-series',
  azHx: 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/high-performance-compute/hx-series',
  azLsv4: 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/storage-optimized/lsv4-series',
  azLasv4: 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/storage-optimized/lasv4-series',
  azLaosv4: 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/storage-optimized/laosv4-series',
  azLsv2: 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/lifecycle/retired-sizes-list',
  azNdGb200: 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/gpu-accelerated/nd-gb200-v6-series',
  azNdGb300: 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/gpu-accelerated/nd-gb300-v6-series',
  azNdH100: 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/gpu-accelerated/ndh100v5-series',
  azNdMi300x: 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/gpu-accelerated/ndmi300xv5-series',
  azNcH100: 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/gpu-accelerated/ncadsh100v5-series',
  azNcA100: 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/gpu-accelerated/nca100v4-series',
  azNcRtxPro:
    'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/gpu-accelerated/nc-rtxpro6000-bse-v6-series',
  azNvA10: 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/gpu-accelerated/nvadsa10v5-series',
  azNvV710: 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/gpu-accelerated/nvadsv710-v5-series',
  gcpMem: 'https://docs.cloud.google.com/compute/docs/memory-optimized-machines',
} as const;

/** Keyed by normalized family token. Strictly additive context — never used to
 *  contradict spec-derived facts. Unknown families degrade gracefully. The
 *  curated facts (whatItIs / pickWhen / analogs) are grounded in primary vendor
 *  docs (deep-research pass, 2024–2025 current-gen, source URLs in `SRC`). */
const FAMILY_KNOWLEDGE: Record<string, FamilyFact> = {
  // ── AWS — general purpose ────────────────────────────────────────────────
  m7i: {
    whatItIs:
      'AWS M7i — 7th-gen Intel (Sapphire Rapids) general-purpose, 4 GiB/vCPU, up to 50 Gbps; a broad production workhorse.',
    pickWhen:
      'Pick M7i for legacy/x86-specific or single-thread-sensitive code where Arm is not viable; otherwise M7g/M8g (Graviton) is cheaper per-performance.',
    analogs: '≈ Azure Dv5/Dv6 · GCP N4/C4',
    source: SRC.awsGp,
  },
  m7a: {
    whatItIs: 'AWS M7a — 7th-gen AMD (EPYC Genoa) general-purpose; high core counts at a small discount to Intel.',
    analogs: '≈ Azure Dasv6 · GCP N2D',
    source: SRC.awsGp,
  },
  m7g: {
    whatItIs:
      'AWS M7g — 7th-gen Graviton3 (Arm) general-purpose, Linux-only, no SMT; cost-efficient scale-out services.',
    pickWhen:
      'Pick Graviton for Arm-compatible scale-out (~20–30% better price/performance); M8g (Graviton4) supersedes it with up to 30% more performance.',
    analogs: '≈ Azure Dpsv5/Dpsv6 · GCP C4A/T2A',
    source: SRC.awsGp,
  },
  m8g: {
    whatItIs:
      'AWS M8g — latest 8th-gen Graviton4 (Arm) general-purpose; app servers, microservices, gaming servers, caching fleets.',
    pickWhen:
      'The Arm price/performance default: up to 30% better performance and up to 3× the vCPUs/memory of 7th-gen M7g; choose x86 only for legacy/AVX-512 code.',
    analogs: '≈ Azure Dpsv6 (Cobalt) · GCP C4A (Axion)',
    source: SRC.awsM8g,
  },
  // ── AWS — compute ────────────────────────────────────────────────────────
  c7i: {
    whatItIs: 'AWS C7i — 7th-gen Intel (Sapphire Rapids) compute-optimized (2 GiB/vCPU) for CPU-bound workloads.',
    pickWhen: 'Newer gen than C6i (~15% better price/performance) — default to the newest unless region availability blocks it.',
    analogs: '≈ Azure F-series · GCP C3/C4',
    source: SRC.awsC7i,
  },
  c7g: {
    whatItIs: 'AWS C7g — Graviton3 (Arm) compute-optimized for CPU-bound, latency-sensitive scale-out workloads.',
    pickWhen: 'Arm price/performance for compute-bound code; C8g (Graviton4) is the newer step up.',
    analogs: '≈ Azure Dpsv5 · GCP C4A',
    source: SRC.awsGp,
  },
  c8g: {
    whatItIs: 'AWS C8g — latest Graviton4 (Arm) compute-optimized; the newest, fastest Arm compute tier.',
    analogs: '≈ Azure Dpsv6 · GCP C4A',
    source: SRC.awsGp,
  },
  // ── AWS — memory ─────────────────────────────────────────────────────────
  r7i: {
    whatItIs: 'AWS R7i — 7th-gen Intel memory-optimized (~8 GiB/vCPU) for in-memory databases and caches.',
    analogs: '≈ Azure Ev5/Ev6 · GCP M3',
    source: SRC.awsGp,
  },
  r8g: {
    whatItIs:
      'AWS R8g — latest Graviton4 (Arm) memory-optimized; databases, in-memory caches, real-time big-data analytics.',
    pickWhen:
      'Up to 30% better performance and up to 3× the vCPUs/memory of 7th-gen R7g; pick Intel/AMD r-series only for x86-locked workloads.',
    analogs: '≈ Azure Epsv6 (Cobalt Arm) · GCP M-series',
    source: SRC.awsR8g,
  },
  x2idn: {
    whatItIs: 'AWS X2idn — very-high-memory Intel instances with local NVMe, for SAP HANA and >1 TB in-memory databases.',
    pickWhen: 'Pick X2idn for in-memory DBs needing the giant RAM (>1 TB) + local NVMe; drop to R7i/R8g if you do not.',
    analogs: '≈ Azure M-series · GCP M2/M3 ultramem',
    source: SRC.awsGp,
  },
  // ── AWS — accelerated ────────────────────────────────────────────────────
  p5: {
    whatItIs:
      'AWS P5 — flagship GPU instances: up to 8× NVIDIA H100 (640 GB HBM3); LLM/diffusion training and large-scale HPC.',
    pickWhen: 'Step up to P5e/P5en (8× H200, 1128 GB HBM3e) when a bigger model needs the larger GPU-memory footprint.',
    analogs: '≈ Azure ND-H100/H200 · GCP A3',
    source: SRC.awsP5,
  },
  // ── Azure ────────────────────────────────────────────────────────────────
  d: { whatItIs: 'Azure D-series — balanced general-purpose VMs for most production workloads.', analogs: '≈ AWS M7i · GCP N4/C4' },
  dasv6: {
    whatItIs:
      'Azure Dasv6 — v6 AMD (EPYC Genoa, x86) general-purpose, 4 GiB/vCPU, up to 96 vCPU / 384 GiB; newer than v5.',
    pickWhen: 'AMD analog to the Intel Dv6 line at a small discount; default to v6 over v5 for better price/performance.',
    analogs: '≈ AWS M7a · GCP N2D',
    source: SRC.azDasv6,
  },
  e: { whatItIs: 'Azure E-series — memory-optimized general VMs (~8 GiB/vCPU) for in-memory databases and analytics.', analogs: '≈ AWS R7i/R8g · GCP M3' },
  epsv6: {
    whatItIs:
      "Azure Epsv6 — Arm memory-optimized on Azure's own Cobalt 100 (Neoverse N2) silicon, 8 GiB/vCPU up to 64 vCPU (the top E96ps_v6 is 96 vCPU / 672 GiB); relational/large databases, analytics engines, in-memory caches.",
    pickWhen: 'Arm price/performance for memory-bound scale-out; pick the Intel/AMD E-series for x86-locked databases.',
    analogs: '≈ AWS R8g (Graviton) · GCP M-series',
    source: SRC.azEpsv6,
  },
  m: { whatItIs: 'Azure M-series — the largest memory-optimized VMs, for SAP HANA and very large in-memory databases.', analogs: '≈ AWS X2idn/u-series · GCP M2/M3' },
  f: { whatItIs: 'Azure F-series — compute-optimized VMs (~2 GiB/vCPU) for CPU-bound and batch workloads.', analogs: '≈ AWS C7i/C7g · GCP C3/C4' },
  ndh200v5: {
    whatItIs:
      'Azure ND-H200-v5 — top-end AI GPU: 8× NVIDIA H200 (1128 GB), 900 GB/s NVLink, 3.2 Tb/s InfiniBand; large-scale distributed LLM training.',
    pickWhen: 'For multi-node LLM training that needs H200 memory + InfiniBand scale-out; ND-H100 if H100 capacity suffices.',
    analogs: '≈ AWS P5e/P5en · GCP A3 Ultra',
    source: SRC.azNdH200,
  },
  // ── GCP ──────────────────────────────────────────────────────────────────
  n2: { whatItIs: 'GCP N2 — balanced general-purpose (Intel/AMD) for everyday production workloads.', analogs: '≈ AWS M7i · Azure Dv5' },
  n4: {
    whatItIs: 'GCP N4 — current-gen Intel general-purpose with Titanium offloads; newer than N2.',
    pickWhen: 'Newer generation than N2 — default to N4 for better price/performance unless your region only offers N2.',
    analogs: '≈ AWS M7i · Azure Dv6',
    source: SRC.gcpGp,
  },
  c3: { whatItIs: 'GCP C3 — Intel (Sapphire Rapids) compute-optimized for CPU-bound, performance-sensitive workloads.', analogs: '≈ AWS C7i · Azure F' },
  c4: {
    whatItIs:
      'GCP C4 — flagship Intel (Granite/Emerald Rapids) general-purpose, Titanium SSD, up to 200 Gbps; high-traffic web/app, databases/caches, game servers.',
    pickWhen: 'Newer gen than C3 with Titanium offloads + up to 200 Gbps networking; default to C4 where available.',
    analogs: '≈ AWS M7i/C7i · Azure Dv6',
    source: SRC.gcpGp,
  },
  c4a: {
    whatItIs:
      "GCP C4A — flagship Arm general-purpose on Google's Axion (Neoverse V2): up to 72 vCPU / 576 GB per VM (96-vCPU bare-metal shapes since May 2026), 6 TiB Titanium SSD, 50 Gbps standard / 100 Gbps with Tier_1; a newer Arm option than the Ampere-based T2A.",
    pickWhen: 'Arm price/performance for scale-out, Arm-compatible code; pick C4 (x86) for legacy/AVX-512 or single-thread code.',
    analogs: '≈ AWS M8g/C8g (Graviton4) · Azure Dpsv6 (Cobalt)',
    source: SRC.gcpGp,
  },
  c3d: { whatItIs: 'GCP C3D — AMD (EPYC Genoa) compute-optimized; high core counts for CPU-bound workloads.', analogs: '≈ AWS C7a · Azure Fasv6' },
  c2: {
    whatItIs:
      'GCP C2 — prior-gen compute-optimized on Intel Cascade Lake (2nd-gen Xeon, up to 3.9 GHz turbo, 4 GiB/vCPU, 4–60 vCPU); HPC, AAA game servers, single-thread-sensitive + ad/media workloads.',
    pickWhen:
      'Pick C2 for compute-bound / high-clock work where C3/C4 (newer Intel gens, better price-performance) are unavailable in your region; default to C3/C4 otherwise.',
    analogs: '≈ AWS C-series · Azure F-series',
    source: SRC.gcpH3,
  },
  c2d: {
    whatItIs:
      'GCP C2D — AMD (EPYC Milan, Zen 3) compute-optimized, up to 112 vCPU, 2–8 GiB/vCPU, ~3.5 GHz boost; high-performance databases, AAA gaming, HPC (EDA, CFD), media transcoding.',
    pickWhen:
      'Pick C2D for AMD compute-bound work needing high core counts or more memory-per-vCPU than C2; the AMD counterpart to the Intel C2/C3.',
    analogs: '≈ AWS C7a · Azure Fasv6',
    source: SRC.gcpH3,
  },
  m3: { whatItIs: 'GCP M3 — memory-optimized machine type for SAP and large in-memory databases.', analogs: '≈ AWS R8g/X2idn · Azure E/M' },
  t2a: { whatItIs: 'GCP T2A — Ampere Altra (Arm) cost-optimized scale-out; Axion-based C4A/N4A are the newer GCP Arm options.', analogs: '≈ AWS M7g · Azure Dpsv5' },
  e2: {
    whatItIs:
      'GCP E2 — lowest-TCO cost-optimized general-purpose (Intel or AMD, auto-selected) using dynamic resource management (vCPUs scheduled on-demand); the small shapes e2-micro/small/medium are SHARED-CORE burstable (0.25–1.0 vCPU baseline, burst to 2). N1-class performance for less.',
    pickWhen:
      'Pick E2 for low-traffic web, microservices, small databases, dev/test, virtual desktops — steady low-to-moderate CPU at the lowest cost. Google routes gaming, HPC, and single-thread-sensitive work to N2/C2 instead (no per-core perf guarantee under dynamic management).',
    analogs: '≈ AWS T3/T4g · Azure B-series',
    source: SRC.gcpGp,
  },
  // ── Storage-optimized (S55 deep-research, vendor-verified) ─────────────────
  i7i: {
    whatItIs:
      'AWS I7i — current-gen Intel (Emerald Rapids) storage-optimized with 3rd-gen Nitro SSDs, up to 45 TB local NVMe; real-time/transactional databases, NoSQL, search.',
    pickWhen:
      'Pick I7i over the prior I4i for ~50% better real-time storage performance, lower I/O latency and >10% better price/performance. Local NVMe is ephemeral — replicate or pair with durable EBS for persistence.',
    analogs: '≈ Azure Lsv3 · GCP Z3',
    source: SRC.awsI7i,
  },
  i7ie: {
    whatItIs:
      'AWS I7ie — the densest local-NVMe instances in the cloud: up to 120 TB local NVMe (~5.2M read IOPS) on Emerald Rapids; large transactional DBs, real-time analytics, dense storage tiers.',
    pickWhen:
      'Pick I7ie when you need maximum local-NVMe density/IOPS — ~20% better price/performance and ~2× the density of I3en. Ephemeral storage, so build replication/durability above it.',
    analogs: '≈ Azure Lsv3 (lower max capacity) · GCP Z3',
    source: SRC.awsI7i,
  },
  i4i: {
    whatItIs:
      'AWS I4i — prior-gen Intel (Ice Lake) storage-optimized with AWS Nitro SSD, up to 30 TB local NVMe; transactional databases, NoSQL, search.',
    pickWhen:
      'Superseded by I7i/I7ie (newer gen, more density and price/performance); pick I4i only where the newer generation is not yet available in your region.',
    analogs: '≈ Azure Lsv3 · GCP Z3',
    source: SRC.awsI4i,
  },
  im4gn: {
    whatItIs:
      'AWS Im4gn — Graviton2 (Arm) dense storage, up to 30 TB local NVMe SSD; cost-efficient OLAP, distributed file systems, Hadoop/Spark.',
    pickWhen:
      'Arm dense storage at up to ~56% lower cost per TB than I4g — pick when storage cost-per-TB matters and the workload is Arm-compatible. Ephemeral local NVMe.',
    analogs: '≈ Azure Lasv3 · GCP Z3',
    source: SRC.awsI4g,
  },
  is4gen: {
    whatItIs:
      'AWS Is4gen — Graviton2 (Arm) density/cost-optimized dense storage (from is4gen.medium), up to 30 TB local NVMe; storage-bound, cost-sensitive workloads.',
    pickWhen:
      'The cheapest cost-per-TB Arm storage tier — pick over Im4gn when you want maximum storage per dollar with less compute.',
    analogs: '≈ Azure Lasv3 · GCP Z3',
    source: SRC.awsI4g,
  },
  i4g: {
    whatItIs:
      'AWS I4g — Graviton2 (Arm) storage-optimized, up to 15 TB local NVMe SSD; cost-efficient storage-bound services.',
    pickWhen:
      'Pick the denser Im4gn/Is4gen (up to ~56% lower $/TB) when you need more than 15 TB or the cheapest per-TB tier.',
    analogs: '≈ Azure Lasv3 · GCP Z3',
    source: SRC.awsI4g,
  },
  d3: {
    whatItIs:
      'AWS D3/D3en — dense-HDD storage (Cascade Lake), ephemeral NVMe-HDD volumes up to ~48 TB (D3) / ~336 TB (D3en); throughput-oriented big-data, distributed file systems, data lakes.',
    pickWhen:
      'Pick the dense-HDD D-family for sequential-throughput, capacity-heavy storage where IOPS do not matter; use the NVMe-SSD I-families when the workload is IOPS-bound.',
    analogs: '≈ Azure Lsv3 (SSD, not HDD) · GCP Z3',
    source: SRC.awsSo,
  },
  lsv3: {
    whatItIs:
      'Azure Lsv3 — Intel (Ice Lake) storage-optimized, 8 GiB/vCPU, one 1.92 TB local NVMe per 8 vCPU up to 19.2 TB (~3.8M IOPS); NoSQL stores like Cassandra and MongoDB.',
    pickWhen:
      'Pick Lsv3 for directly-mapped local-NVMe throughput; storage is ephemeral, so replicate for durability. Lasv3 is the AMD-EPYC equivalent.',
    analogs: '≈ AWS I7i/I4i · GCP Z3',
    source: SRC.azLsv3,
  },
  lasv3: {
    whatItIs:
      'Azure Lasv3 — AMD (EPYC) storage-optimized, 8 GiB/vCPU, one 1.92 TB local NVMe per 8 vCPU up to 19.2 TB (~3.8M IOPS); big-data, NoSQL, data warehousing.',
    pickWhen:
      'AMD counterpart to Lsv3 at similar density; ephemeral local NVMe — pair with durable storage for persistence.',
    analogs: '≈ AWS Im4gn/Is4gen · GCP Z3',
    source: SRC.azLasv3,
  },
  z3: {
    whatItIs:
      'GCP Z3 — Intel (Sapphire Rapids) storage-optimized with Titanium Local SSD: up to ~35 TiB (36,000 GiB) local NVMe per VM and ~70 TiB on the 192-vCPU bare-metal shape, ~8 GiB/vCPU up to 176 vCPU per VM; scale-out/flash-optimized databases, analytics & warehouses, search, media streaming, parallel file systems.',
    pickWhen:
      'Pick Z3 when you need dense, fast local NVMe co-located with compute for I/O-intensive scale-out databases and analytics; use a general-purpose family if your data fits on network-attached disk. Local SSD is ephemeral — replicate for durability.',
    analogs: '≈ AWS I7i/I7ie · Azure Lsv3',
    source: SRC.gcpZ3,
  },
  // ── HPC (S55 deep-research, vendor-verified) ───────────────────────────────
  hpc7a: {
    whatItIs:
      'AWS Hpc7a — AMD (EPYC Genoa) HPC, up to 192 cores, 300 Gbps EFA interconnect; tightly-coupled CFD, weather modeling, molecular dynamics.',
    pickWhen:
      'Pick Hpc7a over a general compute family when inter-node communication is the bottleneck (300 Gbps EFA vs ~25 Gbps standard VPC). HPC families are often region-scarce — check availability early.',
    analogs: '≈ Azure HBv4 · GCP H3',
    source: SRC.awsHpc7a,
  },
  hpc7g: {
    whatItIs:
      'AWS Hpc7g — Arm Graviton3E HPC with DDR5 and 200 Gbps EFA (2× the EFA bandwidth of Graviton2 compute); CFD, weather forecasting, molecular dynamics.',
    pickWhen:
      'Arm price/performance for tightly-coupled HPC (vendor claims up to ~70% better performance / ~3× price-perf vs prior Graviton); pick Hpc7a for x86/AVX-512-bound solvers.',
    analogs: '≈ Azure HBv4 · GCP H3',
    source: SRC.awsHpc7g,
  },
  hbv4: {
    whatItIs:
      'Azure HBv4 — AMD EPYC Genoa-X (3D V-Cache) HPC, up to 176 cores, ~780 GB/s DRAM bandwidth, 400 Gb/s NDR InfiniBand (RDMA); memory-bandwidth-bound CFD, weather, FEA.',
    pickWhen:
      'Pick HBv4 when memory bandwidth and InfiniBand (NDR 400 Gb/s) drive scaling; the large 3D V-Cache L3 helps cache-sensitive solvers. HBv5 (HBM3) is the newer top tier; HX doubles memory capacity on the same silicon.',
    analogs: '≈ AWS Hpc7a · GCP H3',
    source: SRC.azHb,
  },
  hb: {
    whatItIs:
      'Azure HB-family — AMD EPYC HPC VMs with InfiniBand RDMA; HBv5 (432 GB HBM3 at 6.7 TB/s, 800 Gb/s InfiniBand) now leads, ahead of HBv4 (Genoa-X, 3D V-Cache, ~780 GB/s DRAM, 400 Gb/s NDR).',
    pickWhen:
      'Pick the HB-family for memory-bandwidth-bound HPC that needs InfiniBand; HBv5 (HBM3) is the current top tier, HBv4/HBv3 are prior generations, and HBv2 retires May 31, 2027.',
    analogs: '≈ AWS Hpc7a/Hpc7g · GCP H3',
    source: SRC.azHb,
  },
  hbv3: {
    whatItIs:
      'Azure HBv3 — prior-gen HPC on AMD EPYC Milan-X (7V73X, 3D V-Cache), up to 120 cores (no SMT), 200 Gbps HDR InfiniBand; the large V-Cache L3 amplifies effective memory bandwidth to ~630 GB/s for cache-sensitive CFD/weather/FEA solvers.',
    pickWhen:
      'Pick HBv3 when 3D V-Cache helps a cache-bound solver and the newer HBv4/HBv5 are unavailable in your region.',
    analogs: '≈ AWS Hpc7a · GCP H3/H4D',
    source: SRC.azHb,
  },
  h3: {
    whatItIs:
      'GCP H3 — Intel (Sapphire Rapids) HPC: one full-host shape (h3-standard-88 = 88 vCPU / 352 GB, 4 GiB/vCPU) with SMT disabled (1 vCPU = a full physical core) and 200 Gbps networking; no Local SSD. Tightly-coupled MPI — CFD, crash safety, genomics, weather, EDA, financial modeling.',
    pickWhen:
      'Pick H3 for network-bound MPI HPC needing full dedicated cores and a 200 Gbps low-latency fabric across nodes; wrong fit if you need dense local scratch storage or fractional sizing (it ships only as the single 88-vCPU host-sized shape).',
    analogs: '≈ AWS Hpc7a/Hpc7g · Azure HBv4',
    source: SRC.gcpH3,
  },
  h4d: {
    whatItIs:
      "GCP H4D — newest-gen HPC on AMD EPYC Turin (5th-gen, 1 thread = 1 physical core), up to 192 vCPU / ~1.49 TB, with Cloud RDMA over Titanium (GCP's first CPU HPC family with RDMA, ~200 Gbps); tightly-coupled MPI HPC (CFD, weather, molecular dynamics).",
    pickWhen:
      'Pick H4D over H3 (Intel Sapphire Rapids) when you want the latest AMD HPC silicon + RDMA scale-out and your region offers it; H3 is the prior Intel gen.',
    analogs: '≈ AWS Hpc7a · Azure HBv4/HBv3',
    source: SRC.gcpH4d,
  },
  // ── Burstable / shared-core (S55 deep-research, vendor-verified) ────────────
  t3: {
    whatItIs:
      'AWS T3 — Intel burstable, CPU-credit model: earns credits below a per-size baseline (t3.micro 10%, t3.large 30%) and spends them to burst to 100%. Dev/test, low-traffic web, microservices.',
    pickWhen:
      'Cheapest for spiky / low-average CPU; backfires under sustained load — at ~100% a T3 (Unlimited mode, the default) costs ~1.5× an equivalent M5, and the t3.large breakeven is ~42.5% average CPU. Above that, move to a fixed-vCPU M-class.',
    analogs: '≈ Azure B-series · GCP E2',
    source: SRC.awsT3,
  },
  t3a: {
    whatItIs:
      'AWS T3a — AMD (EPYC) burstable; the same CPU-credit model and per-size baselines as T3 at a small discount.',
    pickWhen:
      'AMD variant of T3 — same credit-backfire rule under sustained load; pick T4g (Arm) for the cheapest burstable tier on Arm-compatible code.',
    analogs: '≈ Azure Basv2 · GCP E2',
    source: SRC.awsT3,
  },
  t4g: {
    whatItIs:
      'AWS T4g — Graviton2 (Arm) burstable; the cheapest per-credit burstable tier for Arm-compatible dev/test, low-traffic web and microservices.',
    pickWhen:
      'Arm price edge on the burstable tier; pick T3/T3a only for x86-locked code. Same credit model — sustained 100% CPU is billed at the Unlimited per-vCPU-hour rate, so size up to a fixed-vCPU class for steady load.',
    analogs: '≈ Azure Bpsv2 (Arm) · GCP E2',
    source: SRC.awsT3,
  },
  bsv2: {
    whatItIs:
      'Azure B-series (Bsv2 Intel, Basv2 AMD) — the only Azure VMs with a CPU-credit bank: accrue credits below the per-size baseline, burst to 100% while credits last, then throttle back to baseline. Dev/test, low-traffic web, build agents.',
    pickWhen:
      'Pick B-series for spiky / low-average workloads; under sustained load it throttles to baseline (it does not overage-bill like AWS Unlimited mode) — size up to a D-series if you need steady full CPU.',
    analogs: '≈ AWS T3/T3a · GCP E2',
    source: SRC.azB,
  },
  bpsv2: {
    whatItIs:
      'Azure Bpsv2 — Arm burstable on the Ampere Altra (3.0 GHz); the B-series credit-bank model on Arm. The cross-cloud Arm-burstable analog to AWS T4g.',
    pickWhen:
      'Arm price edge on the burstable tier; same throttle-to-baseline behavior under sustained load — move to a fixed-vCPU class for steady full-CPU workloads.',
    analogs: '≈ AWS T4g (Graviton2) · GCP E2',
    source: SRC.azBpsv2,
  },
  // ── Confidential compute / TEE (S55 deep-research, vendor + peer-reviewed) ──
  dcasv5: {
    whatItIs:
      'Azure DCasv5 / DCadsv5 — confidential general-purpose VMs on AMD SEV-SNP (3rd-gen EPYC): in-use memory is hardware-encrypted and shielded from the host/hypervisor, with remote attestation, no code changes. v6 (DCasv6) runs on 4th-gen EPYC.',
    pickWhen:
      'Pick confidential VMs for regulated PII/PHI or untrusted-host / multi-tenant isolation. Overhead is small for memory-bound steady state (~7% memory bandwidth, independent benchmark) but can be large for heavy network I/O (up to ~60%) — overkill for ordinary, non-sensitive workloads.',
    analogs: '≈ AWS m6a/r6a (SEV-SNP) · GCP Confidential N2D',
    source: SRC.azConf,
  },
  ecasv5: {
    whatItIs:
      'Azure ECasv5 / ECadsv5 — confidential memory-optimized VMs on AMD SEV-SNP (EC = confidential memory-optimized); hardware-encrypted in-use memory + attestation for memory-heavy regulated workloads. v6 (ECasv6) on 4th-gen EPYC.',
    pickWhen:
      'The memory-optimized confidential tier — pick for large in-memory databases handling regulated/sensitive data. Same TEE overhead profile (low for memory-bound, higher for network I/O); plain E-series if the data is not sensitive.',
    analogs: '≈ AWS r6a (SEV-SNP) · GCP Confidential N2D',
    source: SRC.azConf,
  },
  dcesv6: {
    whatItIs:
      'Azure DCesv6 / ECesv6 — confidential VMs on Intel TDX (Trust Domain Extensions); in-use memory encryption + attestation, the Intel counterpart to the AMD SEV-SNP confidential families.',
    pickWhen:
      'Pick the Intel-TDX confidential line where you need TDX specifically; representative memory overhead is ~4% (independent benchmark, lower than SEV-SNP) but network-I/O-heavy workloads still pay a large penalty.',
    analogs: '≈ GCP Confidential C3 (Intel TDX) · AWS: none (no Intel TDX — SEV-SNP / Nitro Enclaves only)',
    source: SRC.azConf,
  },
  nccadsh100v5: {
    whatItIs:
      'Azure NCCadsH100v5 — confidential GPU VM: AMD 4th-gen EPYC + SEV-SNP paired with an NVIDIA H100; the TEE spans the CPU VM and the attached GPU (encrypted PCIe, joint attestation) for secure GPU offload of sensitive data/models.',
    pickWhen:
      'Pick when AI training/inference on regulated or proprietary data must stay inside a TEE end-to-end; a standard H100 VM (NC/ND H100) is cheaper when the data is not sensitive.',
    analogs: '≈ confidential-GPU tier (no direct public AWS/GCP equivalent at parity)',
    source: SRC.azConfGpu,
  },
  n2d: {
    whatItIs:
      'GCP N2D — AMD (EPYC) general-purpose, and the basis for GCP Confidential VMs supporting both AMD SEV and SEV-SNP; balanced production workloads, with a confidential-compute option.',
    pickWhen:
      'Pick N2D for AMD general-purpose; enable Confidential VM (SEV / SEV-SNP) when the workload handles regulated/sensitive data on an untrusted host. SEV-SNP on GCP is still limited to N2D (C2D/C3D/C4D run plain SEV; Intel TDX is on C3, C4 and A3 High).',
    analogs: '≈ AWS M7a · Azure Dasv6 (and DCasv5/ECasv5 confidential)',
    source: SRC.gcpConf,
  },
  // ── AWS confidential (SEV-SNP) — S57 deep-research, vendor-verified ─────────
  // AWS surfaces confidential compute two ways: full-VM AMD SEV-SNP on select
  // sizes of the AMD m6a/c6a/r6a families, and Nitro Enclaves (a carved-out
  // sub-VM with no storage/network/SSH). EC2 does NOT offer Intel TDX.
  m6a: {
    whatItIs:
      'AWS M6a — 6th-gen AMD (EPYC Milan) general-purpose, and one of the few EC2 families supporting AMD SEV-SNP confidential computing: full-VM runtime memory encryption + integrity + signed attestation, on select sizes (m6a.large–8xlarge).',
    pickWhen:
      'Pick M6a + SEV-SNP when a whole general-purpose VM must process regulated/sensitive data shielded from the host. For app-level isolation instead, AWS Nitro Enclaves carve a no-storage/no-network sub-environment from most instances. EC2 has no Intel TDX, so SEV-SNP and Nitro Enclaves are AWS\'s confidential paths.',
    analogs: '≈ Azure DCasv5 (SEV-SNP) · GCP Confidential N2D',
    source: SRC.awsSevSnp,
  },
  c6a: {
    whatItIs:
      'AWS C6a — 6th-gen AMD (EPYC Milan) compute-optimized; one of the EC2 families supporting AMD SEV-SNP confidential computing (full-VM memory encryption + integrity + attestation) on select sizes (c6a.large–16xlarge).',
    pickWhen:
      'Pick C6a + SEV-SNP for compute-bound workloads on regulated data needing full-VM memory encryption; plain C6a/C7a when the data is not sensitive. EC2 offers no Intel TDX — SEV-SNP and Nitro Enclaves are the alternatives.',
    analogs: '≈ Azure DCasv5 (SEV-SNP) · GCP Confidential N2D',
    source: SRC.awsSevSnp,
  },
  r6a: {
    whatItIs:
      'AWS R6a — 6th-gen AMD (EPYC Milan) memory-optimized; one of the EC2 families supporting AMD SEV-SNP confidential computing on select sizes (r6a.large–4xlarge).',
    pickWhen:
      'Pick R6a + SEV-SNP for memory-heavy workloads (in-memory databases, caches) on regulated data needing full-VM encryption + attestation; plain R-series when the data is not sensitive.',
    analogs: '≈ Azure ECasv5 (SEV-SNP) · GCP Confidential N2D',
    source: SRC.awsSevSnp,
  },
  // ── GPU / accelerated — S57 deep-research, vendor-verified ──────────────────
  a3: {
    whatItIs:
      'GCP A3 — Hopper GPU family: 1, 2, 4 or 8× NVIDIA H100 per VM on Sapphire Rapids hosts with ~2.9 TB DDR5, NVLink at 450 GB/s per GPU (up to 7.2 TB/s aggregate across 8 GPUs); A3 Ultra steps up to 8× H200 (1,128 GB HBM3e) with CX-7 RoCE networking. Large-scale ML training and HPC.',
    pickWhen:
      'Pick A3 (H100, NVLink) for multi-GPU training that needs fast intra-node interconnect; step to A3 Ultra (H200, more HBM3e + RoCE scale-out) when GPU memory or bandwidth is the constraint; G2/L4 is enough for inference.',
    analogs: '≈ AWS P5/P5e · Azure ND-H100/H200 v5',
    source: SRC.gcpAccel,
  },
  a2: {
    whatItIs:
      'GCP A2 — NVIDIA A100 (Ampere): A2 Standard (a2-highgpu, A100 40 GB, 1/2/4/8 GPUs; a2-megagpu-16g for 16) and A2 Ultra (a2-ultragpu, A100 80 GB + Local SSD, up to 8). The prior GPU generation to A3.',
    pickWhen:
      'Pick A2 for smaller-model training and single-host inference; A3 (H100/H200) and A4 (B200) target large-cluster foundation-model pre-training/fine-tuning. Choose A2 Ultra (80 GB) when per-GPU memory is the limit.',
    analogs: '≈ AWS P4d/P4de · Azure ND A100 v4',
    source: SRC.gcpAccel,
  },
  g2: {
    whatItIs:
      'GCP G2 — NVIDIA L4 (Ada) inference/graphics: up to 8× L4 per VM, PCIe Gen4, no NVLink. Cost-efficient inference serving and video/graphics workloads.',
    pickWhen:
      'Pick G2 for inference and video/graphics where single-GPU-class L4 throughput is enough; step up to A3 (H100, NVLink) for large-model training or fast multi-GPU interconnect.',
    analogs: '≈ AWS G6/G6e · Azure NV-series',
    source: SRC.gcpAccel,
  },  // ── AWS 8th/9th-gen CPU — 2026-Q4 refresh, vendor-verified 3-0/2-1 ─────────
  m8i: {
    whatItIs:
      'AWS M8i — general-purpose on custom Intel Xeon 6 (Granite Rapids), 4 GiB/vCPU, SMT on, up to 384 vCPU / 1.5 TiB and 100 Gbps; M8i-flex covers large–16xlarge.',
    pickWhen:
      'Pick M8i for x86 general-purpose tiers that need Intel ISA features or sizes beyond 192 vCPU; M8i-flex when CPU is rarely saturated; M8g/M9g (Graviton) for Arm-ready code.',
    analogs: '≈ Azure Dsv7 (Granite Rapids) · GCP C4',
    source: SRC.awsM8i,
  },
  c8i: {
    whatItIs:
      'AWS C8i — compute-optimized on custom Intel Xeon 6 (Granite Rapids), 2 GiB/vCPU, SMT on, up to 384 vCPU / 768 GiB and 100 Gbps; C8i-flex covers large–16xlarge.',
    pickWhen: 'Pick C8i for CPU-bound x86 tiers with light memory needs; C8a when you want a full physical core per vCPU.',
    analogs: '≈ Azure Fasv7 / Dlsv6 · GCP C4 highcpu',
    source: SRC.awsC8i,
  },
  r8i: {
    whatItIs:
      'AWS R8i — memory-optimized on custom Intel Xeon 6 (Granite Rapids), 8 GiB/vCPU, SMT on, up to 384 vCPU / 3 TiB and 100 Gbps; includes SAP-certified sizes, and R8i-flex up to 16xlarge.',
    pickWhen:
      'Pick R8i for x86 memory-bound workloads at 8 GiB/vCPU, including the largest sizes or sustained high CPU; X8i when you need 16 GiB/vCPU.',
    analogs: '≈ Azure Esv7 · GCP C4 highmem',
    source: SRC.awsR8i,
  },
  m8a: {
    whatItIs:
      'AWS M8a — general-purpose on 5th-gen AMD EPYC (Turin) up to 4.5 GHz, 4 GiB/vCPU, SMT off (1 vCPU = 1 physical core), up to 192 vCPU / 768 GiB and 75 Gbps, no local disk.',
    pickWhen: 'Pick M8a for x86 general-purpose workloads that benefit from a full physical core per vCPU; M7a is the prior AMD gen.',
    analogs: '≈ Azure Dasv7 (Turin) · GCP C4D',
    source: SRC.awsM8a,
  },
  c8a: {
    whatItIs:
      'AWS C8a — compute-optimized on 5th-gen AMD EPYC (Turin) up to 4.5 GHz, 2 GiB/vCPU, SMT off, up to 192 vCPU / 384 GiB and 75 Gbps, no local disk.',
    pickWhen: 'Pick C8a for CPU-bound batch, ad serving, gaming and encoding on AMD with dedicated physical cores.',
    analogs: '≈ Azure Fasv7 (Turin) · GCP C4D highcpu',
    source: SRC.awsC8a,
  },
  r8a: {
    whatItIs:
      'AWS R8a — memory-optimized on 5th-gen AMD EPYC (Turin) up to 4.5 GHz, 8 GiB/vCPU, SMT off, up to 192 vCPU / 1.5 TiB and 75 Gbps, no local disk.',
    pickWhen: 'Pick R8a for SQL/NoSQL databases, in-memory caches and real-time analytics on x86 with physical-core vCPUs.',
    analogs: '≈ Azure Easv7 (Turin) · GCP C4D highmem',
    source: SRC.awsR8a,
  },
  m9g: {
    whatItIs:
      'AWS M9g — general-purpose on AWS Graviton5 (Arm), 4 GiB/vCPU, one physical core per vCPU, up to 192 vCPU / 768 GiB and 100 Gbps; M9gd adds local NVMe (3× 3.8 TB at the top size).',
    pickWhen: 'The newest Graviton general-purpose tier for Arm-ready app servers and microservices; M8g (Graviton4) where M9g is not yet in-region.',
    analogs: '≈ Azure Dpsv6 (Cobalt 100) · GCP C4A (Axion)',
    source: SRC.awsM9g,
  },
  c9g: {
    whatItIs:
      'AWS C9g — compute-optimized on AWS Graviton5 (Arm), 2 GiB/vCPU, up to 192 vCPU / 384 GiB and 100 Gbps (EFA on the largest sizes); C9gd adds local NVMe.',
    pickWhen: 'Pick C9g for Arm-ready CPU-bound work; C8g (Graviton4) where C9g is not yet in-region.',
    analogs: '≈ Azure Dplsv6 (Cobalt 100) · GCP C4A highcpu (Axion)',
    source: SRC.awsC9g,
  },
  x8g: {
    whatItIs:
      'AWS X8g — memory-intensive on AWS Graviton4 (Arm), 16 GiB/vCPU, up to 192 vCPU / 3 TiB and 50 Gbps, EBS-only.',
    pickWhen: 'Pick X8g for Arm-compatible in-memory databases, caches and EDA that need 16 GiB per vCPU.',
    analogs: '≈ Azure M-series (x86; no Arm 16:1 equivalent) · GCP M3 (x86)',
    source: SRC.awsX8g,
  },
  x8i: {
    whatItIs:
      'AWS X8i — memory-intensive on custom Intel Xeon 6, 16 GiB/vCPU, SMT on, up to 384 vCPU / 6 TiB and 100 Gbps, EBS-only; SAP HANA and large in-memory databases.',
    pickWhen: 'Pick X8i for multi-TiB in-memory x86 workloads such as SAP HANA; the u7i family for 6–32 TiB single hosts.',
    analogs: '≈ Azure M-series (Mv3) · GCP M4',
    source: SRC.awsX8i,
  },
  i8g: {
    whatItIs:
      'AWS I8g — storage-optimized on AWS Graviton4 with 3rd-gen Nitro SSDs, 8 GiB/vCPU, up to 192 vCPU / 1.5 TiB, 100 Gbps and 45 TB local NVMe (12× 3,750 GB).',
    pickWhen: 'Pick I8g for I/O-heavy databases and analytics on Arm that need low-latency local NVMe; I7i for x86. Local NVMe is ephemeral.',
    analogs: '≈ Azure Lsv4/Lasv4 · GCP Z3',
    source: SRC.awsI8g,
  },
  i8ge: {
    whatItIs:
      'AWS I8ge — storage-dense Graviton4 sibling of I8g, up to 192 vCPU / 1.5 TiB, 180 Gbps and 120 TB local NVMe (16× 7,500 GB).',
    pickWhen: 'Pick I8ge when storage capacity per instance is the binding constraint on an Arm-compatible workload; I7ie for x86.',
    analogs: '≈ Azure Laosv4 · GCP Z3 (highlssd)',
    source: SRC.awsI8g,
  },
  hpc8a: {
    whatItIs:
      'AWS Hpc8a — HPC on 5th-gen AMD EPYC (up to 4.5 GHz), a single 96xlarge size: 192 cores, 768 GiB, SMT off, 300 Gbps EFA, no local disk.',
    pickWhen: 'Pick Hpc8a for tightly-coupled MPI workloads that scale across EFA-connected clusters; Hpc7a is the prior AMD (Genoa) gen.',
    analogs: '≈ Azure HBv5/HBv4 · GCP H4D (Turin)',
    source: SRC.awsHpc8a,
  },
  // ── AWS accelerated — 2026-Q4 refresh, vendor-verified 3-0/2-1 ─────────────
  p5en: {
    whatItIs:
      'AWS P5en — 8× NVIDIA H200 (1,128 GiB HBM3e) on 900 GB/s NVSwitch, Intel Sapphire Rapids host, 3,200 Gbps EFA, 8× 3.8 TB local NVMe; LLM/diffusion training and HPC.',
    pickWhen:
      'Pick P5en over P5 (H100) when per-GPU memory is the constraint; step to P6-B200 for Blackwell.',
    analogs: '≈ Azure ND H200 v5 · GCP A3 Ultra',
    source: SRC.awsP5,
  },
  p6b200: {
    whatItIs:
      'AWS P6-B200 — 8× NVIDIA B200 (1,432 GiB HBM3e) on 5th-gen NVLink (up to 1.8 TB/s per GPU), Intel Emerald Rapids host, 3.2 Tbps EFAv4, ~30 TB local NVMe; medium-to-large-scale training and inference.',
    pickWhen:
      'Pick P6-B200 for Blackwell training/inference in a standard x86 8-GPU node; P6-B300 when you need more GPU memory and network per node.',
    analogs: '≈ Azure ND GB200 v6 (rack-scale, directional) · GCP A4',
    source: SRC.awsP6,
  },
  p6b300: {
    whatItIs:
      'AWS P6-B300 — 8× NVIDIA B300 Blackwell Ultra (2,148 GiB GPU memory), 4 TiB host memory, Intel Emerald Rapids host, 6.4 Tbps EFA; large-scale ML training and inference.',
    pickWhen:
      'Pick P6-B300 over P6-B200 when the model needs the larger per-node GPU memory and doubled EFA bandwidth.',
    analogs: '≈ Azure ND GB300 v6 (rack-scale, closest) · GCP A4X Max',
    source: SRC.awsP6,
  },
  p4d: {
    whatItIs:
      'AWS P4d/P4de — 8× NVIDIA A100 (40 GB HBM2 on P4d, 80 GB HBM2e on P4de) on 600 GB/s NVSwitch with 400 Gbps EFA; the prior GPU generation to P5.',
    pickWhen:
      'Pick P4d/P4de for existing A100-tuned training/inference pipelines that do not need Hopper or Blackwell.',
    analogs: '≈ Azure ND A100 v4 · GCP A2 / A2 Ultra',
    source: SRC.awsP4,
  },
  g6: {
    whatItIs:
      'AWS G6 — up to 8× NVIDIA L4 (24 GB each) on AMD EPYC, including fractional-GPU sizes; inference, video and graphics/virtual-workstation workloads.',
    pickWhen:
      'Pick G6 for cost-efficient inference and graphics where a single L4-class GPU is enough; G6e (L40S, 48 GB) for larger models.',
    analogs: '≈ Azure NVads A10 v5 (closest) · GCP G2 (L4)',
    source: SRC.awsG6,
  },
  g6e: {
    whatItIs:
      'AWS G6e — up to 8× NVIDIA L40S (48 GB each, 384 GB total) on AMD EPYC with up to 400 Gbps networking; LLM inference up to ~13B parameters, diffusion models, spatial/Omniverse graphics.',
    pickWhen:
      'Pick G6e when an inference model outgrows a 24 GB L4; step to G7e (RTX PRO 6000, 96 GB) for larger single-GPU models.',
    analogs: '≈ Azure NVads V710 v5 (directional) · GCP G2 (L4, smaller)',
    source: SRC.awsG6e,
  },
  g7: {
    whatItIs:
      'AWS G7 — up to 8× NVIDIA RTX PRO 4500 Blackwell Server Edition (32 GB each) on custom Intel Xeon 6 (SMT off), up to 700 Gbps EFA; AI inference, graphics and data analytics.',
    pickWhen:
      'Pick G7 for Blackwell inference/graphics at a smaller memory tier; G7e (96 GB per GPU) when the model needs more GPU memory.',
    analogs: '≈ Azure NVads A10 v5 (directional) · GCP G2 (directional)',
    source: SRC.awsG7,
  },
  g7e: {
    whatItIs:
      'AWS G7e — up to 8× NVIDIA RTX PRO 6000 Blackwell Server Edition (96 GB GDDR7 each), GPUDirect P2P over PCIe, up to 1,600 Gbps EFA; LLM, multimodal and physical-AI inference plus spatial graphics.',
    pickWhen:
      'Pick G7e when a model fits in 96 GB per GPU and PCIe peer-to-peer is enough; P-family (NVLink) for tightly-coupled multi-GPU training.',
    analogs: '≈ Azure NC RTX PRO 6000 BSE v6 · GCP G4 (RTX PRO 6000)',
    source: SRC.awsG7e,
  },
  trn1: {
    whatItIs:
      'AWS Trn1 — 16× AWS Trainium (512 GB accelerator memory) linked by NeuronLink, 800 Gbps EFA (1,600 Gbps on Trn1n); LLM and diffusion-model training on the Neuron SDK.',
    pickWhen:
      'Pick Trainium when the training stack runs on AWS Neuron; a GPU P-family is the portable CUDA choice.',
    analogs: '≈ Azure: no training-ASIC VM · GCP TPU (directional)',
    source: SRC.awsTrn1,
  },
  trn2: {
    whatItIs:
      'AWS Trn2 — 16× Trainium2 (1.5 TB HBM3, 96 GiB per chip), Intel Sapphire Rapids host, 3.2 Tbps EFAv3; Trn2 UltraServers join 64 chips over NeuronLink. Training and serving 100B to 1T+ parameter models.',
    pickWhen:
      'Pick Trn2 for very large Neuron-SDK training/inference; the EC2 instance-type table lists 8,192 GiB accelerator memory, which conflicts with the product page and Neuron docs (1.5 TB) — treat 1.5 TB as correct.',
    analogs: '≈ Azure: no training-ASIC VM · GCP TPU (directional)',
    source: SRC.awsTrn2,
  },
  inf2: {
    whatItIs:
      'AWS Inf2 — up to 12× AWS Inferentia2 (32 GB each, 384 GB total), NeuronLink on the 24xlarge/48xlarge sizes, no EFA; generative-AI inference on the Neuron SDK.',
    pickWhen:
      'Pick Inf2 for high-throughput inference on Neuron-compiled models, including models sharded across chips; G-family GPUs for CUDA portability.',
    analogs: '≈ Azure: no inference-ASIC VM · GCP TPU (directional)',
    source: SRC.awsInf2,
  },
  // ── Azure GPU — 2026-Q4 refresh, vendor-verified 3-0 ─────────────────────────
  ndgb200v6: {
    whatItIs:
      'Azure ND GB200 v6 — 4 NVIDIA Blackwell GPUs (192 GB each) + 2 Grace CPUs per VM, joined by 5th-gen NVLink into 72-GPU NVL72 racks of 18 VMs; 4× 400 Gb/s Quantum-2 InfiniBand and 16 TiB local NVMe per VM. Deep-learning training, generative AI, HPC.',
    pickWhen:
      'Pick it when training benefits from a 72-GPU NVLink domain rather than 8-GPU nodes; ND H200 v5 for Hopper.',
    analogs: '≈ AWS P6e-GB200 UltraServer · GCP A4X (GB200 NVL72)',
    source: SRC.azNdGb200,
  },
  ndgb300v6: {
    whatItIs:
      'Azure ND GB300 v6 — 4 NVIDIA Blackwell Ultra GPUs (288 GB HBM3E each) + 2 Grace CPUs per VM in GB300 NVL72 racks of 18 VMs over 5th-gen NVLink; 800 Gb/s InfiniBand per GPU, 16 TiB local NVMe per VM.',
    pickWhen:
      'Pick it for high-throughput reasoning/agentic inference or long-context models that need more HBM per GPU than GB200.',
    analogs: '≈ AWS P6e-GB300 UltraServer · GCP A4X Max (GB300 NVL72)',
    source: SRC.azNdGb300,
  },
  ndh100v5: {
    whatItIs:
      'Azure ND H100 v5 — 8× NVIDIA H100 80 GB on NVLink 4.0, 96 Sapphire Rapids cores, 1,900 GiB RAM; a dedicated 400 Gb/s Quantum-2 InfiniBand link per GPU (3.2 Tb/s per VM), 28 TiB local NVMe.',
    pickWhen:
      'Pick it for tightly-coupled multi-node Hopper training and HPC; ND H200 v5 when per-GPU memory is the constraint.',
    analogs: '≈ AWS P5 · GCP A3',
    source: SRC.azNdH100,
  },
  ndmi300xv5: {
    whatItIs:
      'Azure ND MI300X v5 — 8× AMD Instinct MI300X (192 GB each, ~1.5 TB per VM) on 4th-gen Infinity Fabric (896 GB/s aggregate), 96 Sapphire Rapids cores, 400 Gb/s InfiniBand per GPU (3.2 Tb/s per VM), 28 TiB NVMe.',
    pickWhen:
      'Pick it for large-model serving or training on ROCm/RCCL where the 192 GB per-GPU HBM lets a model fit on fewer GPUs.',
    analogs: '≈ no AWS/GCP MI300X instance (no parity); nearest by memory class AWS P5e · GCP A3 Ultra (H200)',
    source: SRC.azNdMi300x,
  },
  ncadsh100v5: {
    whatItIs:
      'Azure NCads H100 v5 — 1 or 2 NVIDIA H100 NVL PCIe GPUs (94 GB each) on 4th-gen AMD EPYC Genoa, up to 640 GiB RAM; no InfiniBand listed. Microsoft\'s current NC line for new capacity.',
    pickWhen:
      'Pick it for applied-AI training and batch inference that fit in one or two GPUs; ND-series for multi-node InfiniBand scale-out.',
    analogs: '≈ AWS P5 single-GPU size (p5.4xlarge) · GCP A3 High (1g/2g)',
    source: SRC.azNcH100,
  },
  ncadsa100v4: {
    whatItIs:
      'Azure NC A100 v4 — 1 to 4 NVIDIA A100 PCIe 80 GB on 3rd-gen AMD EPYC 7V13 (Milan), up to 880 GiB RAM; no InfiniBand listed.',
    pickWhen:
      'Pick it for existing single-node A100 workloads; Microsoft now deploys new NC capacity only as NCads H100 v5.',
    analogs: '≈ AWS P4de (8-GPU only) · GCP A2 Ultra',
    source: SRC.azNcA100,
  },
  ncrtxpro6000v6: {
    whatItIs:
      'Azure NC RTX PRO 6000 BSE v6 — NVIDIA RTX PRO 6000 Blackwell Server Edition (96 GB GDDR7) as 1/4, 1/2, 1 or 2 GPUs on Intel Granite Rapids, general-purpose and lower-memory sizes, up to 12,800 GiB NVMe.',
    pickWhen:
      'Pick it for converged AI + graphics: Omniverse/digital twins, RTX virtual workstations, rendering, and inference/RAG on mid-size models.',
    analogs: '≈ AWS G7e · GCP G4 (both RTX PRO 6000)',
    source: SRC.azNcRtxPro,
  },
  nvadsa10v5: {
    whatItIs:
      'Azure NVads A10 v5 — NVIDIA A10 partitioned from 1/6 GPU (4 GB) up to 2 full GPUs (48 GB) on AMD EPYC 74F3V (Milan), GRID license included; one workstation user or up to 25 concurrent app users per VM.',
    pickWhen:
      'Pick it for right-sized GPU virtual desktops and graphics apps where a fractional GPU is enough.',
    analogs: '≈ AWS G5/G6 (whole or fractional GPU) · GCP G2',
    source: SRC.azNvA10,
  },
  nvadsv710v5: {
    whatItIs:
      'Azure NVads V710 v5 — AMD Radeon Pro V710 partitioned from 1/6 GPU (4 GB) to a full GPU (24 GB) on AMD EPYC 9V64 F (Genoa), NVMe local storage, no GPU license fee.',
    pickWhen:
      'Pick it for cost-sensitive VDI, cloud gaming/streaming or small-model inference without NVIDIA GRID licensing.',
    analogs: '≈ AWS G4ad (AMD Radeon Pro V520) · GCP: no AMD GPU instance',
    source: SRC.azNvV710,
  },
  // ── Azure CPU / HPC / storage — 2026-Q4 refresh, vendor-verified 3-0/2-1 ────
  dsv7: {
    whatItIs:
      'Azure Dsv7 — Intel Xeon 6 6973PC (Granite Rapids) general-purpose, 3.6 GHz all-core / 4.2 GHz turbo, 2–372 vCPU at 4 GiB/vCPU (1,488 GiB max), no local disk.',
    pickWhen:
      'The newest Intel D-series; pick it for new Intel general-purpose deployments or very large single VMs, and Dsv6 where v7 is not offered in your region.',
    analogs: '≈ AWS M8i · GCP C4',
    source: SRC.azDsv7,
  },
  esv7: {
    whatItIs:
      'Azure Esv7 — Intel Xeon 6 6973PC (Granite Rapids) memory-optimized, 8 GiB/vCPU up to 192 vCPU and up to 372 vCPU / 2,832 GiB at the top size, no local disk.',
    pickWhen:
      'Pick it for SQL/NoSQL, SAP and in-memory workloads on current-gen Intel; Easv7 for the AMD equivalent.',
    analogs: '≈ AWS R8i · GCP C4 highmem',
    source: SRC.azEsv7,
  },
  dsv6: {
    whatItIs:
      'Azure Dsv6 — 5th-gen Intel Xeon Platinum 8573C (Emerald Rapids) general-purpose, 2–192 vCPU at 4 GiB/vCPU (768 GiB max), no local disk.',
    pickWhen: 'The prior Intel D generation to Dsv7; pick it where v7 is unavailable or v6 pricing fits better.',
    analogs: '≈ AWS M7i · GCP C3',
    source: SRC.azDsv6,
  },
  dpsv6: {
    whatItIs:
      'Azure Dpsv6 — Azure Cobalt 100 (Arm Neoverse N2) general-purpose at 3.4 GHz, one physical core per vCPU, 2–96 vCPU at 4 GiB/vCPU (384 GiB max), no local disk.',
    pickWhen:
      'Pick it for Arm-ready scale-out services (web/app tiers, small-to-medium databases, caches); D-series x86 for x86-locked code.',
    analogs: '≈ AWS M8g (Graviton4) · GCP C4A (Axion)',
    source: SRC.azDpsv6,
  },
  dasv7: {
    whatItIs:
      'Azure Dasv7 — 5th-gen AMD EPYC 9005 (Turin) general-purpose, up to 4.5 GHz, 2–160 vCPU at 4 GiB/vCPU (640 GiB max), no local disk.',
    pickWhen: 'The newest AMD D-series; Dasv6 (Genoa) where v7 is not yet offered in your region.',
    analogs: '≈ AWS M8a · GCP C4D',
    source: SRC.azDasv7,
  },
  easv7: {
    whatItIs:
      'Azure Easv7 — 5th-gen AMD EPYC 9005 (Turin) memory-optimized, up to 4.5 GHz, 2–160 vCPU at 8 GiB/vCPU (1,280 GiB max), no local disk.',
    pickWhen: 'Pick it for memory-intensive enterprise applications on AMD where 8 GiB/vCPU fits.',
    analogs: '≈ AWS R8a · GCP C4D highmem',
    source: SRC.azEasv7,
  },
  fasv7: {
    whatItIs:
      'Azure Fasv7 — 5th-gen AMD EPYC 9005 (Turin) compute-optimized with SMT off (1 vCPU = 1 core), 1–80 cores at 4 GiB/core, up to 4.5 GHz, no local disk.',
    pickWhen: 'Pick it for CPU-bound work that wants dedicated cores: simulation, risk analysis, game servers, rendering.',
    analogs: '≈ AWS C8a · GCP C4D highcpu',
    source: SRC.azFasv7,
  },
  hbv5: {
    whatItIs:
      'Azure HBv5 — AMD EPYC 9V64H (Zen4) with 432 GB HBM3 at 6.7 TB/s, up to 368 cores with SMT off, 800 Gb/s NDR InfiniBand (4× 200); the current top of the HB-family.',
    pickWhen:
      'Pick HBv5 for the most memory-bandwidth-bound MPI codes (CFD, weather, molecular dynamics) whose per-node footprint fits in 432 GB; HX when memory capacity, not bandwidth, is the limit.',
    analogs: '≈ AWS Hpc8a/Hpc7a (no HBM equivalent) · GCP H4D',
    source: SRC.azHbv5,
  },
  hbv2: {
    whatItIs:
      'Azure HBv2 — 120-core AMD EPYC 7V12 (Rome) HPC, SMT off, 456 GB RAM at 350 GB/s, 200 Gb/s HDR InfiniBand. Retiring May 31, 2027.',
    pickWhen:
      'Only for existing memory-bandwidth-bound jobs (CFD, FEA, reservoir) pending migration; new work should target HBv5, HBv4 or HX.',
    analogs: '≈ AWS Hpc6a · GCP H3',
    source: SRC.azHbv2,
  },
  hc: {
    whatItIs:
      'Azure HC — 44-core Intel Xeon Platinum 8168 (Skylake) HPC, no hyperthreading, 352 GB RAM (8 GB/core), AVX-512, 100 Gb/s EDR InfiniBand. Retiring May 31, 2027.',
    pickWhen:
      'Only for legacy Intel-tuned structural-analysis, molecular or chemistry jobs pending migration; Microsoft points to HBv5 or HX.',
    analogs: '≈ AWS C5n (EFA) · GCP C2',
    source: SRC.azHc,
  },
  hx: {
    whatItIs:
      'Azure HX — up to 176 AMD EPYC 9V33X (Genoa-X, 3D V-Cache) cores, SMT off, 1,408 GB RAM (2× HBv4), 780 GB/s DRAM bandwidth, 400 Gb/s NDR InfiniBand.',
    pickWhen:
      'Pick HX for memory-capacity-bound HPC such as large EDA/silicon-design runs that overflow HBv4\'s 768 GB.',
    analogs: '≈ AWS X2iedn / Hpc7a · GCP H4D highmem',
    source: SRC.azHx,
  },
  lsv4: {
    whatItIs:
      'Azure Lsv4 — 5th-gen Intel Xeon Platinum 8573C (Emerald Rapids) storage-optimized, 2–96 vCPU at 8 GiB/vCPU, 240 GB local NVMe per vCPU up to 23 TB (12× 1.92 TB).',
    pickWhen:
      'Pick it for NVMe-heavy databases and analytics (Cassandra, MongoDB, Spark, Elastic) on Intel; local NVMe is ephemeral — replicate for durability.',
    analogs: '≈ AWS I7i · GCP Z3',
    source: SRC.azLsv4,
  },
  lasv4: {
    whatItIs:
      'Azure Lasv4 — AMD EPYC 9004 (Genoa) storage-optimized, 2–96 vCPU at 8 GiB/vCPU, 240 GB local NVMe per vCPU up to 23 TB (12× 1.92 TB).',
    pickWhen: 'The AMD counterpart to Lsv4 for the same NVMe-heavy NoSQL and analytics workloads.',
    analogs: '≈ AWS I7i/I8g · GCP Z3',
    source: SRC.azLasv4,
  },
  laosv4: {
    whatItIs:
      'Azure Laosv4 — AMD EPYC 9004 (Genoa) dense-storage, 2–32 vCPU at 8 GiB/vCPU, 720 GB local NVMe per vCPU up to 23 TB at 32 vCPU.',
    pickWhen:
      'Pick it when storage per vCPU matters more than compute: caching tiers, search indexes, distributed file systems.',
    analogs: '≈ AWS I7ie/I8ge · GCP Z3 (highlssd)',
    source: SRC.azLaosv4,
  },
  lsv2: {
    whatItIs:
      'Azure Lsv2 — AMD EPYC 7551 (Naples) storage-optimized, 8 GiB/vCPU, one 1.92 TB NVMe per 8 vCPU up to 19.2 TB. Retirement announced for Nov 15, 2028; capacity-restricted since July 2026 and not deployable on new subscriptions.',
    pickWhen: 'Legacy only — plan migration of NVMe-heavy NoSQL to the v3/v4 L-series.',
    analogs: '≈ AWS I3 · GCP N2 + Local SSD',
    source: SRC.azLsv2,
  },
  // ── GCP — 2026-Q4 refresh, vendor-verified 3-0/2-1 ──────────────────────────
  c4d: {
    whatItIs:
      'GCP C4D — 5th-gen AMD EPYC (Turin) on Titanium, up to 384 vCPU / 3,024 GB DDR5, up to 12 TiB Titanium SSD and 200 Gbps (Tier_1); Hyperdisk-only block storage, AMD SEV Confidential VM available.',
    pickWhen:
      'Pick C4D for current-gen AMD general-purpose work (databases, web/game servers); C3D is the prior AMD gen, C4 the Intel counterpart.',
    analogs: '≈ AWS M8a/C8a/R8a · Azure Dasv7/Easv7',
    source: SRC.gcpGp,
  },
  n4d: {
    whatItIs:
      'GCP N4D — 5th-gen AMD EPYC (Turin) on Titanium, up to 96 vCPU / 768 GB with custom shapes and 50 Gbps standard networking; no Local SSD or Tier_1.',
    pickWhen: 'Pick N4D for cost-optimized AMD general-purpose fleets that benefit from custom vCPU:memory shapes; C4D for peak per-core performance.',
    analogs: '≈ AWS M8a · Azure Dasv7',
    source: SRC.gcpGp,
  },
  n4a: {
    whatItIs:
      'GCP N4A — Google Axion (Arm Neoverse N3), up to 64 vCPU / 512 GB with custom shapes and 50 Gbps; no Local SSD, no Confidential VM.',
    pickWhen: 'Pick N4A for cost-efficient Arm scale-out services; C4A (Axion, Neoverse V2) for higher per-core performance and larger shapes.',
    analogs: '≈ AWS M8g/M9g (Graviton) · Azure Dpsv6 (Cobalt 100)',
    source: SRC.gcpGp,
  },
  x4: {
    whatItIs:
      'GCP X4 — bare-metal Intel Sapphire Rapids, up to 1,920 vCPU with 6–32 TB RAM, Hyperdisk-only, 100 Gbps; single-node scale-up SAP HANA.',
    pickWhen: 'Pick X4 for single-node scale-up SAP HANA in the 6–32 TB range on bare metal; X5 offers up to 48 TB.',
    analogs: '≈ AWS u7i/u7in High Memory · Azure M-series (very high memory)',
    source: SRC.gcpMem,
  },
  x5: {
    whatItIs:
      'GCP X5 — bare-metal Intel Granite Rapids, 688–2,064 vCPU with 12–48 TB RAM (17.9 or 23.8 GB/vCPU by shape), Hyperdisk-only, 200 Gbps (GA September 2026).',
    pickWhen: 'Pick X5 for the largest single-node SAP HANA scale-up — its 48 TB shape is the largest GCP memory footprint.',
    analogs: '≈ AWS u7in-32tb · Azure M-series (very high memory)',
    source: SRC.gcpMem,
  },
  m4: {
    whatItIs:
      'GCP M4 — Intel Emerald Rapids memory-optimized, up to 224 vCPU / ~6 TB at up to 26.5 GB/vCPU, Hyperdisk-only, 100 Gbps.',
    pickWhen: 'Pick M4 for SAP HANA and memory-heavy OLTP/OLAP that fit in ~6 TB; X4/X5 beyond that.',
    analogs: '≈ AWS X8i · Azure M-series (Mv3 medium memory)',
    source: SRC.gcpMem,
  },
  m2: {
    whatItIs: 'GCP M2 — Intel Cascade Lake memory-optimized (megamem/ultramem/hypermem), 208–416 vCPU with 6, 9 or 12 TB.',
    pickWhen: 'Pick M2 for large (6–12 TB) SAP HANA databases; X4/X5 bare metal beyond that.',
    analogs: '≈ AWS u-6tb1/u-12tb1 · Azure M-series (Mv2)',
    source: SRC.gcpMem,
  },
  m1: {
    whatItIs: 'GCP M1 — older Intel (Skylake/Broadwell) memory-optimized, up to 160 vCPU / 3.8 TB at 14.9–24 GB/vCPU.',
    pickWhen: 'The oldest M generation; compare against M3/M4 for the same footprint.',
    analogs: '≈ AWS X1/X1e · Azure M-series (Mv1)',
    source: SRC.gcpMem,
  },
  n1: {
    whatItIs:
      'GCP N1 — first-generation general-purpose on Intel Skylake through Sandy Bridge, up to 96 vCPU / 624 GB; includes the shared-core f1/g1 types.',
    pickWhen: 'The oldest general-purpose generation; N2/N4 are its newer successors for general-purpose work.',
    analogs: '≈ AWS M5/M4 · Azure Dv3/Dv2',
    source: SRC.gcpGp,
  },
  t2d: {
    whatItIs:
      'GCP Tau T2D — 3rd-gen AMD EPYC (Milan) with SMT off (1 vCPU = 1 core), up to 60 vCPU at 4 GB/vCPU, 32 Gbps; no Local SSD, GPUs or custom shapes.',
    pickWhen: 'Pick T2D for scale-out web, microservices, transcoding and Java fleets that want whole-core vCPUs; N4D/C4D for newer AMD.',
    analogs: '≈ AWS M6a/C6a · Azure Dasv5',
    source: SRC.gcpGp,
  },
  a4: {
    whatItIs:
      'GCP A4 — 8× NVIDIA B200 (180 GB each) on Intel Emerald Rapids hosts, 14.4 TB/s aggregate NVLink, up to 3,600 Gbps RoCE networking; large-scale foundation-model training and serving.',
    pickWhen: 'Pick A4 for Blackwell training on standard x86 8-GPU nodes; A4X for a 72-GPU NVLink domain.',
    analogs: '≈ AWS P6-B200 · Azure ND GB200 v6 (rack-scale, directional)',
    source: SRC.gcpAccel,
  },
  a4x: {
    whatItIs:
      'GCP A4X — GB200 NVL72 rack-scale: 4× B200 + 2 Grace (Arm) CPUs per instance in a 72-GPU NVLink domain, up to 2,000 Gbps networking. A4X Max is the GB300 bare-metal successor.',
    pickWhen: 'Pick A4X when training/serving needs a 72-GPU NVLink domain; A4 for standard 8-GPU nodes.',
    analogs: '≈ AWS P6e-GB200 UltraServer · Azure ND GB200 v6',
    source: SRC.gcpAccel,
  },
  g4: {
    whatItIs:
      'GCP G4 — NVIDIA RTX PRO 6000 Blackwell (96 GB) from 1/8 to 8 GPUs on AMD Turin hosts, up to 384 vCPU, 12 TiB Titanium SSD, 400 Gbps; PCIe peer-to-peer, no NVLink.',
    pickWhen: 'Pick G4 for graphics, simulation, transcoding, virtual workstations and single-host inference; A-series for NVLink training.',
    analogs: '≈ AWS G7e · Azure NC RTX PRO 6000 BSE v6 (same GPU)',
    source: SRC.gcpAccel,
  },
};

// ── Unverified vendor claims (failed deep-research adversarial verification) ──
//
// Every figure here is sourced to the VENDOR's own page but could NOT be
// independently corroborated (no third-party benchmark reproduces the exact
// number; "up to X%" is workload-, region- and rate-dependent). We list them so
// the product can SAY SO in a comparison rather than silently repeating
// marketing. Family-specific entries match by `families`; generalized rules
// match by relevance (any Arm pick / any cross-generation comparison).
const UNVERIFIED_CLAIMS: UnverifiedClaim[] = [
  // ── Family-specific deltas ────────────────────────────────────────────────
  {
    id: 'i7i-perf',
    provider: 'aws',
    claim: 'I7i delivers up to ~50% better real-time storage performance and >10% better price/performance than I4i.',
    why: 'Vendor "up to" figure; no independent benchmark reproduces it and real gains are workload-dependent.',
    source: SRC.awsI7i,
    families: ['i7i'],
  },
  {
    id: 'i7ie-density',
    provider: 'aws',
    claim: 'I7ie offers ~20% better price/performance and ~2× the storage density of I3en.',
    why: 'Vendor comparison vs a prior gen; not independently benchmarked.',
    source: SRC.awsI7i,
    families: ['i7ie'],
  },
  {
    id: 'im4gn-cost',
    provider: 'aws',
    claim: 'Im4gn / Is4gen cost up to ~56% less per TB than I4g.',
    why: 'List-price-derived at one point in time; shifts with region and commitment term.',
    source: SRC.awsI4g,
    families: ['im4gn', 'is4gen'],
  },
  {
    id: 'graviton4-gen',
    provider: 'aws',
    claim: 'M8g / C8g / R8g (Graviton4) deliver up to 30% more performance and up to 3× the vCPUs/memory of the 7th-gen Graviton families.',
    why: 'Vendor "up to" gen-over-gen claim; the realized delta depends on the workload.',
    source: SRC.awsM8g,
    families: ['m8g', 'c8g', 'r8g'],
  },
  {
    id: 'hpc7g-perf',
    provider: 'aws',
    claim: 'Hpc7g claims up to ~70% better performance and ~3× the price/performance of prior-generation Graviton HPC.',
    why: 'Vendor "up to" HPC figure; not independently reproduced and benchmark-dependent.',
    source: SRC.awsHpc7g,
    families: ['hpc7g'],
  },
  {
    id: 'tee-overhead',
    provider: 'azure',
    claim: 'Confidential VMs add ~7% memory-bandwidth overhead on AMD SEV-SNP (~4% on Intel TDX), up to ~60% for network-I/O-heavy workloads.',
    why: 'From a single third-party benchmark; highly configuration- and workload-specific, not reproduced across setups.',
    source: SRC.azConf,
    families: ['dcasv5', 'ecasv5', 'dcesv6', 'nccadsh100v5'],
  },
  {
    id: 't3-breakeven',
    provider: 'aws',
    claim: 'A t3.large breaks even with a fixed-vCPU M-class at ~42.5% average CPU and costs ~1.5× an M5 at sustained 100%.',
    why: 'Derived from list pricing at one moment; the breakeven moves with region, rate and the chosen M-class.',
    source: SRC.awsT3,
    families: ['t3', 't3a', 't4g'],
  },
  // 2026-Q4 refresh — vendor "up to" figures the verifiers kept out of the facts.
  {
    id: 'aws-8i-gen',
    provider: 'aws',
    claim: 'M8i / C8i / R8i (Intel Xeon 6) claim up to 15% better price/performance and ~20% higher performance than the 7th-gen Intel families.',
    why: 'Vendor "up to" gen-over-gen claim; realized gains are workload-dependent.',
    source: SRC.awsM8i,
    families: ['m8i', 'c8i', 'r8i'],
  },
  {
    id: 'aws-8a-gen',
    provider: 'aws',
    claim: 'M8a / C8a / R8a (EPYC Turin) claim up to 30% higher performance than M7a / C7a / R7a.',
    why: 'Vendor "up to" gen-over-gen claim; not independently reproduced.',
    source: SRC.awsM8a,
    families: ['m8a', 'c8a', 'r8a'],
  },
  {
    id: 'graviton5-gen',
    provider: 'aws',
    claim: 'M9g / C9g (Graviton5) claim up to 25% better compute performance than the Graviton4 M8g / C8g.',
    why: 'Vendor "up to" gen-over-gen claim; the realized delta depends on the workload.',
    source: SRC.awsM9g,
    families: ['m9g', 'c9g'],
  },
  {
    id: 'hpc8a-perf',
    provider: 'aws',
    claim: 'Hpc8a claims up to 40% higher performance and 25% better price/performance than Hpc7a.',
    why: 'Vendor HPC benchmark figure; solver- and scale-dependent.',
    source: SRC.awsHpc8a,
    families: ['hpc8a'],
  },
  {
    id: 'i8g-perf',
    provider: 'aws',
    claim: 'I8g claims up to 65% higher real-time storage performance than I4g.',
    why: 'Vendor "up to" figure; not independently benchmarked.',
    source: SRC.awsI8g,
    families: ['i8g', 'i8ge'],
  },
  {
    id: 'trn2-priceperf',
    provider: 'aws',
    claim: 'Trn2 claims 30–40% better price/performance than the GPU-based P5e / P5en.',
    why: 'Vendor comparison at list price; depends on model, framework maturity and commitment term.',
    source: SRC.awsTrn2,
    families: ['trn2'],
  },
  {
    id: 'g7e-perf',
    provider: 'aws',
    claim: 'G7e claims up to 2.3× the inference performance of G6e.',
    why: 'Vendor "up to" figure for selected models; not independently reproduced.',
    source: SRC.awsG7e,
    families: ['g7e'],
  },
  {
    id: 'gb300-throughput',
    provider: 'azure',
    claim: 'ND GB300 v6 claims ~27% higher per-rack LLM inference throughput and ~1.5× the FP4 compute of ND GB200 v6.',
    why: 'Vendor benchmark on a specific model and configuration; not independently reproduced.',
    source: SRC.azNdGb300,
    families: ['ndgb300v6'],
  },
  {
    id: 'hbv5-bandwidth',
    provider: 'azure',
    claim: 'HBv5 claims ~9× the memory bandwidth of dual-socket Genoa servers (~7× vs Turin).',
    why: 'Vendor comparison from a Microsoft HPC blog; the verifiers could not load the post body, only its summary.',
    source: SRC.azHbv5,
    families: ['hbv5'],
  },
  {
    id: 'c4d-gen',
    provider: 'gcp',
    claim: 'C4D claims ~30% higher estimated SPECrate2017_int performance than C3D, with larger gains on selected MySQL / Redis / web benchmarks.',
    why: 'Vendor-estimated benchmark figures; workload-dependent.',
    source: SRC.gcpGp,
    families: ['c4d'],
  },
  // ── Generalized rules (the cross-cutting Arm / newest-gen caveats) ────────
  // These are SYNTHESIZED contextually per cloud in `unverifiedClaims` (naming
  // the actual family + generation, attributed to + linked to the right vendor)
  // rather than listed as static generic strings, so the disclosure says WHICH
  // family and WHICH vendor instead of a vague "the family it replaces".
];

// Per-cloud vendor doc that backs the cross-generation / Arm price-perf claim,
// so a claim shown for GCP links to GCP's doc (not AWS's).
const GEN_CLAIM_SRC: Record<string, string> = {
  aws: SRC.awsC7i,
  gcp: SRC.gcpGp,
  azure: SRC.azNaming,
};
const ARM_CLAIM_SRC: Record<string, string> = {
  aws: SRC.awsM8g,
  gcp: SRC.gcpGp,
  azure: SRC.azNaming,
};

/**
 * Best-effort name of the prior-generation family a VM replaces — AWS/GCP
 * decrement the leading generation digit (r7i → r6i, n2 → n1); Azure decrements
 * the `_vN` token. Returns null when not cleanly derivable, so the claim simply
 * omits the predecessor rather than inventing a SKU that may not exist.
 */
function priorFamilyLabel(vm: CatalogEntry): string | null {
  const prov = (vm.provider || '').toLowerCase();
  if (prov === 'azure') {
    const m = (vm.vmSizeName || '').match(/_v(\d+)\b/i);
    if (m && Number(m[1]) > 2) return `its v${Number(m[1]) - 1} predecessor`;
    return null;
  }
  const fam = (vmFamily(vm) ?? vm.family ?? '').trim();
  const dm = fam.match(/^([A-Za-z]+)(\d+)(.*)$/);
  if (dm && Number(dm[2]) > 1) return `${dm[1]}${Number(dm[2]) - 1}${dm[3]}`;
  return null;
}

/**
 * The unverified vendor claims RELEVANT to a given comparison. Family-specific
 * claims match by family token; generalized rules show when relevant (the Arm
 * rule when any pick is Arm; the newest-gen rule when there's anything to
 * compare). Family-specific entries lead; capped so the disclosure stays tight.
 */
export function unverifiedClaims(vms: CatalogEntry[], families: string[] = []): UnverifiedClaim[] {
  const tokens = new Set<string>();
  for (const v of vms) tokens.add(familyToken(v.family ?? vmFamily(v)));
  for (const f of families) tokens.add(familyToken(f));

  const specific: UnverifiedClaim[] = [];
  for (const c of UNVERIFIED_CLAIMS) {
    if (c.families && c.families.length && c.families.some((t) => tokens.has(t))) specific.push(c);
  }

  // Contextual generalized claims — one per cloud, naming the actual family +
  // generation, attributed to + linked to THAT cloud's doc (so the GCP claim
  // doesn't link to AWS, and the reader knows which family is meant).
  const general: UnverifiedClaim[] = [];
  const famOf = (v: CatalogEntry) => vmFamily(v) ?? v.family ?? v.vmSizeName;

  const armSeen = new Set<string>();
  for (const v of vms) {
    if (archOf(v) !== 'arm') continue;
    const p = (v.provider || '').toLowerCase();
    if (armSeen.has(p)) continue;
    armSeen.add(p);
    const brand = armBrand(v.provider, v.processor);
    general.push({
      id: `arm-${p}`,
      provider: p,
      generalized: 'arm',
      claim: `${famOf(v)}${brand ? ` (${brand})` : ''} is Arm-based — the vendor markets ~20–30% better price/performance than comparable x86.`,
      why: 'A vendor marketing aggregate; the real delta is workload-dependent and not reproducible as a single figure across families.',
      source: ARM_CLAIM_SRC[p] ?? SRC.awsM8g,
    });
  }

  const genSeen = new Set<string>();
  for (const v of vms) {
    const g = genFor(v);
    if (!g || g.rank < 4) continue; // only the newest-gen picks make the claim
    const p = (v.provider || '').toLowerCase();
    if (genSeen.has(p)) continue;
    genSeen.add(p);
    const prior = priorFamilyLabel(v);
    general.push({
      id: `newest-gen-${p}`,
      provider: p,
      generalized: 'newest-gen',
      claim: `${famOf(v)} is on the newest generation (${g.label})${prior ? `, replacing ${prior}` : ''} — the vendor markets the newest generation at ~15–30% better price/performance than the family it replaces.`,
      why: 'Vendor "up to" gen-over-gen claim; benchmark-, region- and rate-dependent rather than a guaranteed delta.',
      source: GEN_CLAIM_SRC[p] ?? SRC.awsC7i,
    });
  }

  return [...specific, ...general].slice(0, 6);
}

function categoryWhatItIs(cat: VmCategory): string {
  switch (cat) {
    case 'Memory Optimized':
      return 'Memory-optimized VMs carry a high ratio of RAM to vCPU, for in-memory databases, caches and large analytics.';
    case 'Compute Optimized':
      return 'Compute-optimized VMs carry a low ratio of RAM to vCPU, for CPU-bound, latency-sensitive and batch workloads.';
    case 'General Purpose':
      return 'General-purpose VMs balance vCPU and memory for the broad middle of production workloads.';
    case 'Storage Optimized':
      return 'Storage-optimized VMs pair high local disk throughput with balanced compute for data-intensive workloads.';
    case 'GPU':
      return 'GPU VMs add hardware accelerators for ML training/inference and other GPU-bound compute.';
    case 'High Performance Computing':
      return 'HPC VMs pair the fastest cores with high-bandwidth interconnects for tightly-coupled parallel jobs.';
    default:
      return `${cat} VMs.`;
  }
}

// ── Product-mode (family / category) insight ──────────────────────────────

function range(nums: number[]): { min: number; max: number; avg: number } {
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const avg = nums.reduce((s, n) => s + n, 0) / nums.length;
  return { min, max, avg };
}

function fmtRange(min: number, max: number, unit: string): string {
  return min === max ? `${min} ${unit}` : `${min}–${max} ${unit}`;
}

function dominant<T extends string>(values: T[]): { value: T; count: number } | null {
  if (!values.length) return null;
  const counts = new Map<T, number>();
  for (const v of values) counts.set(v, (counts.get(v) || 0) + 1);
  let best: T = values[0];
  let bestN = 0;
  for (const [v, n] of counts) {
    if (n > bestN) {
      best = v;
      bestN = n;
    }
  }
  return { value: best, count: bestN };
}

export function productInsight(
  vms: CatalogEntry[],
  kind: 'family' | 'category',
  name: string,
): ProductInsight {
  if (vms.length === 0) {
    return {
      name,
      kind,
      whatItIs: `${name} — no representative sizes available.`,
      keyPoints: [],
      bestFor: 'Add sizes to this group to derive a profile.',
    };
  }

  const feats = vms.map(vmFeatures);
  const vcpu = range(vms.map((v) => Math.max(1, v.vcpus || 1)));
  const mem = range(vms.map((v) => Math.max(0, v.memoryGib || 0)));
  const mpv = range(feats.map((f) => f.memPerVcpu));
  const cat: VmCategory = vms[0].category ?? categorize(vms[0].provider, vms[0].family ?? vmFamily(vms[0]));

  // Spec-derived "what it is" first; layer curated prose as enrichment.
  const curated = kind === 'family' ? FAMILY_KNOWLEDGE[familyToken(name)] : undefined;
  let whatItIs: string;
  if (kind === 'category') {
    whatItIs = categoryWhatItIs(cat);
  } else if (curated) {
    whatItIs = curated.whatItIs;
  } else {
    const densityWord =
      mpv.avg > MPV_MEMORY_MIN ? 'memory-dense' : mpv.avg < MPV_COMPUTE_MAX ? 'compute-dense' : 'balanced';
    whatItIs = `${name} — a ${densityWord} ${cat.toLowerCase()} family (~${mpv.avg.toFixed(1)} GiB per vCPU across its sizes).`;
  }

  // Key points (3–5 bullets), all spec-derived.
  const keyPoints: string[] = [];
  keyPoints.push(`Sizes span ${fmtRange(vcpu.min, vcpu.max, 'vCPU')} and ${fmtRange(Math.round(mem.min), Math.round(mem.max), 'GiB')} of memory.`);

  const mpvWord =
    mpv.avg > MPV_MEMORY_MIN ? 'memory-dense' : mpv.avg < MPV_COMPUTE_MAX ? 'compute-dense' : 'balanced (general-purpose)';
  keyPoints.push(`Memory profile is ${mpvWord} at ~${mpv.avg.toFixed(1)} GiB per vCPU.`);

  const domArch = dominant(feats.map((f) => f.arch));
  const domGen = dominant(vms.map((v) => genFor(v)?.label).filter((l): l is string => !!l));
  if (domArch) {
    const archTxt = archLabel(domArch.value);
    keyPoints.push(domGen ? `Predominantly ${archTxt} on the ${domGen.value} generation.` : `Predominantly ${archTxt} architecture.`);
  } else if (domGen) {
    keyPoints.push(`Predominantly the ${domGen.value} CPU generation.`);
  }

  const net = range(vms.map((v) => Math.max(0, v.networkMbps || 0)));
  if (net.max > 0) {
    const netClass = net.max >= NET_HIGH_MBPS ? 'high' : net.max >= NET_MID_MBPS ? 'moderate' : 'standard';
    keyPoints.push(`Network bandwidth is ${netClass}, up to ~${Math.round(net.max / 1000)} Gbps on the largest size.`);
  }

  const totalGpus = feats.reduce((s, f) => s + f.gpus, 0);
  if (totalGpus > 0) {
    const accel = vms.map((v) => v.acceleratorType).find((a) => a && a.toLowerCase() !== 'none');
    keyPoints.push(accel ? `Includes GPU-accelerated sizes (${accel}).` : 'Includes GPU-accelerated sizes.');
  }

  // Cap at 5.
  const trimmed = keyPoints.slice(0, 5);

  // Best-for from the dominant signals.
  let bestFor: string;
  if (totalGpus > 0) {
    bestFor = 'ML training/inference and GPU-accelerated compute.';
  } else if (mpv.avg > MPV_MEMORY_MIN) {
    bestFor = 'In-memory databases, large caches and memory-bound analytics.';
  } else if (mpv.avg < MPV_COMPUTE_MAX) {
    bestFor = 'CPU-bound web/app tiers, gaming and batch compute.';
  } else {
    bestFor = 'Balanced, general-purpose production workloads.';
  }

  return {
    name,
    kind,
    whatItIs,
    keyPoints: trimmed,
    bestFor,
    pickWhen: curated?.pickWhen,
    analogs: curated?.analogs,
    source: curated?.source,
  };
}

export function compareProducts(
  groups: { kind: 'family' | 'category'; name: string; vms: CatalogEntry[] }[],
): { products: ProductInsight[]; headline: string; keyTakeaway: string } {
  const products = groups.map((g) => productInsight(g.vms, g.kind, g.name));

  if (products.length === 0) {
    return { products: [], headline: 'No groups to compare.', keyTakeaway: 'Add a family or category to summarize.' };
  }
  if (products.length === 1) {
    const p = products[0];
    return {
      products,
      headline: `${p.name}: ${p.whatItIs}`,
      keyTakeaway: `${p.whatItIs} Best for ${p.bestFor}`,
    };
  }

  // Lead with how the groups differ in workload intent, then the decision nuance
  // ("when it's worth paying more") where we have a sourced pick-rule.
  const intents = products.map((p) => `${p.name} suits ${p.bestFor.replace(/\.$/, '')}`);
  const headline = `${products.length} groups, different sweet spots: ${products.map((p) => p.name).join(' vs ')}.`;
  const picks = products.filter((p) => p.pickWhen).map((p) => `${p.name} — ${p.pickWhen}`);
  const keyTakeaway = [
    `${intents.join('; ')}.`,
    picks.length
      ? `Worth paying more: ${picks.slice(0, 2).join(' ')}`
      : 'Match the group to the workload before comparing individual sizes on price.',
  ].join(' ');

  return { products, headline, keyTakeaway };
}
