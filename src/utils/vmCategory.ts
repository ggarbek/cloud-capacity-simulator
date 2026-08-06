/**
 * v2.17 — Cross-cloud VM category classifier.
 *
 * Maps a {provider, family, vmSizeName} → canonical `VmCategory` so the
 * Category column in the Excel template + the Category filter in the UI
 * read the same labels regardless of which cloud the row came from.
 *
 * Standard labels match Azure's pricing-page Category picker:
 *   All / General purpose / Compute optimized / Memory optimized /
 *   Storage optimized / GPU / High performance compute
 * Plus AWS's extra "Previous Generation" and "Confidential" bucket
 * (for Azure DC-series + AWS Mac-style restricted).
 *
 * Hierarchy used by the UI + Excel:
 *   Category  → e.g. "Memory Optimized"
 *   Series    → e.g. "Esv5" / "r7iz" / "n2-highmem"        (UserVm.family)
 *   Size      → e.g. "Standard_E16s_v5" / "r7iz.16xlarge"   (UserVm.vmSizeName)
 */
import type { VmCategory } from '../types';

/** AWS family categories — the seed already carries `family` matching the
 *  AWS regions-doc tab labels, so we route by family prefix. */
export function categorizeAwsFamily(family: string): VmCategory {
  const f = family.toLowerCase();
  // Previous Generation (AWS docs explicitly list these — see
  // docs/aws/previous-generation.md + aws.amazon.com/ec2/previous-generation).
  // NOTE: cc2 / cr1 / hs1 / g2 MUST be caught here BEFORE the generic
  // startsWith('c') compute rule (cc2/cr1) and the General-Purpose fallthrough
  // (g2/hs1) miscategorise them — they are all retired cluster-era families.
  if (
    f === 'a1' ||
    f === 'm1' ||
    f === 'm2' ||
    f === 'm3' ||
    f === 'm4' ||
    f === 'c1' ||
    f === 'c3' ||
    f === 'c4' ||
    f === 'cc2' ||
    f === 'cr1' ||
    f === 'r3' ||
    f === 'r4' ||
    f === 'i2' ||
    f === 'hs1' ||
    f === 't1' ||
    f === 'g2' ||
    f === 'g3' ||
    f === 'g3s' ||
    f === 'p2' ||
    f === 'p3' ||
    f === 'p3dn'
  ) {
    return 'Previous Generation';
  }
  // HPC
  if (f.startsWith('hpc')) return 'High Performance Computing';
  // Accelerated / GPU (use "GPU" per Azure convention; AWS lumps FPGA + ASIC
  // + GPU under this in their UI we map to the same bucket).
  if (
    f.startsWith('p') ||
    f.startsWith('g4') ||
    f.startsWith('g5') ||
    f.startsWith('g6') ||
    f.startsWith('g7') ||
    f.startsWith('gr6') ||
    f.startsWith('inf') ||
    f.startsWith('trn') ||
    f.startsWith('f1') ||
    f.startsWith('f2') ||
    f.startsWith('dl') ||
    f.startsWith('vt')
  ) {
    return 'GPU';
  }
  // Storage
  if (
    f.startsWith('d2') ||
    f.startsWith('d3') ||
    f.startsWith('h1') ||
    f.startsWith('i') ||
    f.startsWith('im') ||
    f.startsWith('is')
  ) {
    return 'Storage Optimized';
  }
  // Memory
  if (
    f.startsWith('r') ||
    f.startsWith('x') ||
    f.startsWith('u-') ||
    f.startsWith('u7') ||
    f === 'z1d'
  ) {
    return 'Memory Optimized';
  }
  // Compute
  if (f.startsWith('c')) return 'Compute Optimized';
  // General Purpose (default): A, M, T families
  return 'General Purpose';
}

/** Azure family categorization — by family slug (e.g. 'Dsv5', 'Esv5', 'M-series'). */
export function categorizeAzureFamily(family: string): VmCategory {
  const f = family.toLowerCase();
  // Previous generation legacy A/D/G/F
  if (f.match(/^a\d?(_v1)?$/i) || f === 'g' || f === 'dsv2' || f === 'dv2' || f === 'fsv1') {
    return 'Previous Generation';
  }
  // Confidential
  if (f.startsWith('dc') || f.startsWith('ec')) return 'Confidential';
  // HPC
  if (f.startsWith('hb') || f.startsWith('hc') || f.startsWith('hx') || f === 'h-series') {
    return 'High Performance Computing';
  }
  // GPU / accelerated — N* GPU families (NC/ND/NV/NG/NCC) + FPGA-accelerated
  // NP/PB (Azure groups FPGA under "accelerated"; docs path is
  // /sizes/fpga-accelerated/np-series). Were falling through to General Purpose.
  if (
    f.startsWith('nc') ||
    f.startsWith('nd') ||
    f.startsWith('nv') ||
    f.startsWith('ng') ||
    f.startsWith('np') ||
    f.startsWith('pb')
  ) {
    return 'GPU';
  }
  // Storage
  if (f.startsWith('l')) return 'Storage Optimized';
  // Memory: M-series public series labels (v2.25.4 — "Msv3 Medium Memory
  // series", "M series", "Mbsv3 Medium Memory series", …), the stored family,
  // legacy bare labels, E-series, Eb-series, G-series. Matches whether fed the
  // stored `family` field or a `vmFamily()` display label.
  if (
    /memory series$/i.test(family) ||
    family === 'M series' ||
    f === 'm' ||
    f.startsWith('m-') ||
    f.startsWith('mv') ||
    f.startsWith('ms') ||
    f.startsWith('md') ||
    f.startsWith('mb') ||
    f === 'm-series' ||
    f.startsWith('e') ||
    f === 'g'
  ) {
    return 'Memory Optimized';
  }
  // Compute: F-series
  if (f.startsWith('f')) return 'Compute Optimized';
  // General Purpose: D, B, Av2, Dasv*, Dpsv*
  return 'General Purpose';
}

/** GCP family categorization — by family prefix. */
export function categorizeGcpFamily(family: string): VmCategory {
  const f = family.toLowerCase();
  // Accelerated — a2/a3/a4 (A100/H100/B200) + g2 (L4) + g4 (Blackwell inference).
  if (
    f === 'a2' ||
    f === 'a3' ||
    f === 'a4' ||
    f === 'g2' ||
    f === 'g4'
  ) {
    return 'GPU';
  }
  // HPC — h3 = HPC-optimized.
  if (f.startsWith('h3')) return 'High Performance Computing';
  // Storage — z3 = storage-optimized.
  if (f.startsWith('z3')) return 'Storage Optimized';
  // Memory — m1/m2/m3/m4 (ultramem/megamem family) + x4 (SAP HANA bare-metal)
  // + any predefined "-highmem / -megamem / -ultramem / -hypermem" SKU.
  if (
    f === 'm1' ||
    f === 'm2' ||
    f === 'm3' ||
    f === 'm4' ||
    f === 'x4' ||
    f.includes('-highmem') ||
    f.includes('-megamem') ||
    f.includes('-ultramem') ||
    f.includes('-hypermem')
  ) {
    return 'Memory Optimized';
  }
  // Compute — c2/c2d/c3/c3d/c4/c4a/c4d (-standard, -highcpu).
  if (
    f.startsWith('c2') ||
    f.startsWith('c3') ||
    f.startsWith('c4') ||
    f.includes('-highcpu')
  ) {
    return 'Compute Optimized';
  }
  // Previous gen — n1 is the legacy general-purpose family; f1-micro / g1-small
  // are the N1-series shared-core legacy types (GCP groups them under N1, which
  // GCP's own taxonomy marks as previous-generation). They surface as their own
  // `f1` / `g1` families because the SKU has no `n1-` prefix to split on.
  if (
    f === 'n1' ||
    f.startsWith('n1-') ||
    f === 'f1' ||
    f === 'g1'
  ) {
    return 'Previous Generation';
  }
  // General Purpose — e2, n2, n2d, n4, t2a, t2d.
  return 'General Purpose';
}

/** Dispatch entry-point. Provider-agnostic category for any catalog row. */
export function categorize(provider: string | undefined, family: string | undefined): VmCategory {
  if (!family) return 'Custom';
  const p = (provider ?? '').toLowerCase();
  if (p === 'aws') return categorizeAwsFamily(family);
  if (p === 'azure') return categorizeAzureFamily(family);
  if (p === 'gcp') return categorizeGcpFamily(family);
  return 'Custom';
}

/**
 * The category to use for cross-cloud MATCHING (the gate + candidate pooling) —
 * which can differ from the DISPLAY category (`categorize`) when a vendor models
 * the same hardware *shape* under a different label.
 *
 * The one case today: GCP expresses the memory-optimized SHAPE through a
 * `-highmem` CLASS variant inside general/compute families (n2-highmem,
 * e2-highmem, c4-highmem). `categorize` is keyed on the FAMILY (`"n2"`) so it
 * buckets these as General Purpose — but a high-memory-per-vCPU machine IS the
 * peer to Azure E / AWS r. So for matching we upgrade GCP `-highmem` sizes to
 * Memory Optimized, letting the small-end gap (GCP's dedicated m-series starts
 * at 32 vCPU / ~1 TB) be filled by its true analog. This is MATCHING-ONLY — the
 * stored/display category is never re-tagged, so counts/filters/templates and
 * every non-matching surface are unaffected. Azure/AWS publish no `-highmem`
 * naming, so this is GCP-specific by construction.
 */
export function matchCategory(vm: {
  provider?: string;
  family?: string;
  vmSizeName?: string;
  category?: VmCategory;
}): VmCategory {
  if (
    (vm.provider ?? '').toLowerCase() === 'gcp' &&
    /(?:^|-)highmem(?:-|$)/i.test(vm.vmSizeName ?? '')
  ) {
    return 'Memory Optimized';
  }
  return vm.category ?? categorize(vm.provider, vm.family);
}

/**
 * True when a VM is a BURSTABLE / shared-core family — a materially different
 * SERVICE MODEL from a standard dedicated-vCPU size (baseline CPU + credit accrual
 * rather than a full core), so an equivalence between the two deserves a caveat.
 * Keyed off the vendor family token per each cloud's documented burstable line:
 *   - AWS  : T-family (t2/t3/t3a/t4g).
 *   - Azure: B-series only (b/bs/bsv2/basv2/bpsv2) — start-anchored so a normal
 *            family that merely starts with "b" in another cloud can't leak in.
 *   - GCP  : f1-micro / g1-small (legacy shared-core), plus e2-micro|small|medium
 *            (the shared-core E2 sub-sizes). e2-standard/highcpu/highmem are
 *            full-vCPU and therefore NOT burstable.
 */
export function isBurstable(vm: { provider?: string; family?: string; vmSizeName?: string }): boolean {
  const p = (vm.provider ?? '').toLowerCase();
  const fam = (vm.family ?? '').toLowerCase();
  const size = (vm.vmSizeName ?? '').toLowerCase();
  if (p === 'aws') return /^t\d/.test(fam);
  if (p === 'azure') return /^(b|bs|bsv2|basv2|bpsv2)$/.test(fam);
  if (p === 'gcp') {
    if (fam === 'f1' || fam === 'g1') return true;
    if (fam === 'e2') return /^e2-(micro|small|medium)\b/.test(size);
    return false;
  }
  return false;
}

// ── Product groups ───────────────────────────────────────────────────────────
// Beyond the category, categories cluster into broad PRODUCT GROUPS. A cross-
// category equivalent that ALSO crosses a product group (e.g. Memory-Optimized ↔
// GPU — "not even the same kind of machine") deserves a bigger similarity
// penalty than one that stays in the same group (e.g. Memory ↔ Storage, both
// data-tier; or General Purpose ↔ Compute, both general compute). Used by
// `vmDistance`'s cross-category penalty.
const CATEGORY_GROUP: Partial<Record<VmCategory, string>> = {
  'General Purpose': 'general',
  'Compute Optimized': 'general',
  'Previous Generation': 'general',
  Confidential: 'general',
  'Memory Optimized': 'data',
  'Storage Optimized': 'data',
  GPU: 'accelerated',
  'High Performance Computing': 'accelerated',
};

/** Extra normalized-distance penalty when two DIFFERENT categories also sit in
 *  different product groups (0 when same category or same group). ~0.30 ≈ a
 *  ~30-point similarity drop on the exponential matchPct curve — so a spec-
 *  identical Memory↔GPU pair reads far lower than a Memory↔Storage one. */
export const CROSS_GROUP_PENALTY = 0.3;
export function categoryGroupPenalty(a: VmCategory, b: VmCategory): number {
  if (a === b) return 0;
  // Unmapped categories (e.g. user-uploaded `Custom`) sit in their own 'other'
  // group — so Custom ↔ any known category takes the full cross-group penalty
  // (we don't know the machine kind, so treat it as a different product group).
  const ga = CATEGORY_GROUP[a] ?? 'other';
  const gb = CATEGORY_GROUP[b] ?? 'other';
  return ga === gb ? 0 : CROSS_GROUP_PENALTY;
}
