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
 * disclosure.
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

// ── Arch labelling ───────────────────────────────────────────────────────

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
    whatItIs: 'AWS C7i — 7th-gen Intel (Sapphire Rapids) compute-optimized (~2 GiB/vCPU) for CPU-bound workloads.',
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
      "Azure Epsv6 — Arm memory-optimized on Azure's own Cobalt 100 (Neoverse N2) silicon, 8 GiB/vCPU; relational/large databases, analytics engines, in-memory caches.",
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
      "GCP C4A — flagship Arm general-purpose on Google's Axion (Neoverse V2): up to 72 vCPU / 576 GB, 6 TiB Titanium SSD, up to 100 Gbps; supersedes the Ampere-based T2A.",
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
  t2a: { whatItIs: 'GCP T2A — Ampere Altra (Arm) cost-optimized scale-out; superseded by Axion-based C4A.', analogs: '≈ AWS M7g · Azure Dpsv5' },
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
      'GCP Z3 — Intel (Sapphire Rapids) storage-optimized with Titanium Local SSD: up to 36 TiB local NVMe per VM (72 TiB bare-metal), ~8 GiB/vCPU up to 176 vCPU across 11 shapes; scale-out/flash-optimized databases, analytics & warehouses, search, media streaming, parallel file systems.',
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
      'Pick HBv4 when memory bandwidth and InfiniBand (NDR 400 Gb/s) drive scaling; the large 3D V-Cache L3 helps cache-sensitive solvers. Pair with the closest AWS/GCP HPC family by interconnect tier.',
    analogs: '≈ AWS Hpc7a · GCP H3',
    source: SRC.azHb,
  },
  hb: {
    whatItIs:
      'Azure HB-family — AMD EPYC HPC VMs with InfiniBand RDMA; the flagship HBv4 (Genoa-X, 3D V-Cache, ~780 GB/s DRAM, 400 Gb/s NDR InfiniBand) leads for memory-bandwidth-bound tightly-coupled jobs.',
    pickWhen:
      'Pick the HB-family for memory-bandwidth-bound HPC that needs InfiniBand; HBv4 is the current top tier, HBv3/HBv2 are prior generations.',
    analogs: '≈ AWS Hpc7a/Hpc7g · GCP H3',
    source: SRC.azHb,
  },
  hbv3: {
    whatItIs:
      'Azure HBv3 — prior-gen HPC on AMD EPYC Milan-X (7V73X, 3D V-Cache), up to 120 cores (no SMT), 200 Gbps HDR InfiniBand; the large V-Cache L3 amplifies effective memory bandwidth to ~630 GB/s for cache-sensitive CFD/weather/FEA solvers.',
    pickWhen:
      'Pick HBv3 when 3D V-Cache helps a cache-bound solver and the newer HBv4 (Genoa-X, NDR 400 Gb/s) is unavailable in your region; HBv4 is the current top tier.',
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
      'Pick N2D for AMD general-purpose; enable Confidential VM (SEV / SEV-SNP) when the workload handles regulated/sensitive data on an untrusted host. SEV-SNP on GCP is currently limited to N2D (C2D/C3D run plain SEV).',
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
      'GCP A3 — flagship GPU: up to 8× NVIDIA H100 (Hopper) per VM on Sapphire Rapids hosts with 2 TB DDR5 and 3.6 TB/s GPU-to-GPU via NVSwitch + NVLink 4.0; A3 Ultra steps up to 8× H200 (1,128 GB HBM3e) with CX-7 RoCE networking. Large-scale ML training and HPC.',
    pickWhen:
      'Pick A3 (H100, NVLink/NVSwitch) for multi-GPU training that needs fast intra-node interconnect; step to A3 Ultra (H200, more HBM3e + RoCE scale-out) when GPU memory or bandwidth is the constraint; G2/L4 is enough for inference.',
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
