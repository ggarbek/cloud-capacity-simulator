/**
 * Accelerator (GPU) + confidential-compute (TEE) specs, curated per VM FAMILY.
 *
 * #141 (GPU/TEE half): the catalog only carries `acceleratorType` (a string like
 * "8 x H100") — it has NO clean GPU model / VRAM / interconnect / TEE field. So
 * the matching engine's category-DEFINING GPU + TEE traits are resolved from this
 * curated, family-keyed lookup, seeded from the same vendor-verified research that
 * backs `FAMILY_KNOWLEDGE` (deep-research S55–S57) plus stable NVIDIA hardware
 * facts (per-GPU VRAM, NVLink support — these don't change once a GPU ships).
 *
 * This module is intentionally STANDALONE (imports nothing from `equivalence` or
 * `specInsights`) so the distance kernel can import it without a cycle. It also
 * owns `familyToken` — the one normalization used by every family-keyed lookup
 * (here AND in `specInsights.FAMILY_KNOWLEDGE`).
 *
 * Coverage is additive: an unknown GPU/confidential family resolves to `null`,
 * and the engine's new terms are then INERT for it (no fabrication, graceful
 * degradation — exactly like the local-disk term when `localDiskGib` is 0). The
 * quarterly research refresh extends these maps over time.
 */

/** Normalize a family name to a lookup key: lowercase, strip Azure "-series",
 *  keep alphanumerics only. The SAME key `FAMILY_KNOWLEDGE` uses. */
export function familyToken(name: string | undefined): string {
  return (name || '')
    .toLowerCase()
    .replace(/\s*series$/i, '')
    .replace(/[^a-z0-9]/g, '');
}

export type Interconnect = 'nvswitch' | 'nvlink' | 'pcie' | 'none';

export interface GpuSpec {
  /** Accelerator model, e.g. 'H100', 'A100-80', 'L4', 'B200'. */
  model: string;
  /** Per-accelerator memory (VRAM/HBM) in GiB. */
  vramGiB: number;
  /** Ordinal capability tier (higher = more capable). Half-steps let
   *  A100-40↔A100-80 read close while H100↔L4 reads far. Calibrated, not a
   *  vendor figure — VRAM + interconnect are separate terms. */
  classRank: number;
  /** GPU-to-GPU fabric: nvswitch > nvlink > pcie/none. */
  interconnect: Interconnect;
}

export type TeeKind = 'sev-snp' | 'tdx' | 'sev';
export interface TeeSpec {
  kind: TeeKind;
  /** True when the family is a NORMAL-category SKU that merely OFFERS confidential
   *  compute as an opt-in launch flag (AWS m6a/c6a/r6a, GCP n2d/c2d/c3d/c3), as
   *  opposed to a purpose-built inherently-confidential family (Azure DC/EC series)
   *  which carries the `Confidential` category. Set on `teeCapabilityFor` results;
   *  left undefined on `teeSpecFor` (the confidential-category families). */
  optIn?: boolean;
}

// ── GPU model "class" reference (stable NVIDIA/AMD hardware facts) ────────────
// classRank is an ordinal tier; vramGiB is the per-accelerator memory.
const H100: GpuSpec = { model: 'H100', vramGiB: 80, classRank: 4.5, interconnect: 'nvswitch' };
const H200: GpuSpec = { model: 'H200', vramGiB: 141, classRank: 5, interconnect: 'nvswitch' };
const B200: GpuSpec = { model: 'B200', vramGiB: 180, classRank: 6, interconnect: 'nvswitch' };
const A100_40: GpuSpec = { model: 'A100-40', vramGiB: 40, classRank: 3, interconnect: 'nvlink' };
const A100_80: GpuSpec = { model: 'A100-80', vramGiB: 80, classRank: 3.5, interconnect: 'nvlink' };
const V100: GpuSpec = { model: 'V100', vramGiB: 16, classRank: 2.5, interconnect: 'nvlink' };
const L40S: GpuSpec = { model: 'L40S', vramGiB: 48, classRank: 2.8, interconnect: 'pcie' };
const A10G: GpuSpec = { model: 'A10G', vramGiB: 24, classRank: 2, interconnect: 'pcie' };
const L4: GpuSpec = { model: 'L4', vramGiB: 24, classRank: 1.5, interconnect: 'pcie' };
const T4: GpuSpec = { model: 'T4', vramGiB: 16, classRank: 1, interconnect: 'pcie' };
const GB200: GpuSpec = { model: 'GB200', vramGiB: 192, classRank: 6.5, interconnect: 'nvswitch' };
const MI300X: GpuSpec = { model: 'MI300X', vramGiB: 192, classRank: 4.8, interconnect: 'nvlink' };
const V620: GpuSpec = { model: 'V620', vramGiB: 32, classRank: 1.8, interconnect: 'pcie' };
const V520: GpuSpec = { model: 'V520', vramGiB: 8, classRank: 1.2, interconnect: 'pcie' };

/**
 * GPU model name (as embedded in a vmSizeName) → spec. Azure encodes the model
 * directly in the SKU (e.g. `Standard_NC40ads_H100_v5`, `Standard_NV36ads_A10_v5`,
 * `Standard_ND..._GB200_v6`), whereas AWS/GCP keep the model in the family token
 * (p5, a3, …). Matching the underscore-delimited tokens covers the Azure
 * `nc`/`nd`/`nv` families (whose family token is just the series prefix).
 */
const MODEL_BY_NAME: Record<string, GpuSpec> = {
  gb200: GB200, b200: B200, b300: B200, h200: H200, h100: H100, mi300x: MI300X,
  a100: A100_80, l40s: L40S, v620: V620, v710: V620, a10: A10G, l4: L4, t4: T4, v100: V100,
};

/**
 * Family token → dominant GPU spec. Where a family spans two GPU memory tiers
 * (a2 = A100 40 *and* 80 GB; a3 = H100 *and*, in a3-ultra, H200), the family
 * entry keys the dominant tier and `SIZE_OVERRIDES` corrects the named variant.
 * Verified family→model mappings come from FAMILY_KNOWLEDGE (S55–S57); the
 * remaining well-known NVIDIA mappings (g5=A10G, g6=L4, g6e=L40S, p4d=A100…)
 * are stable vendor facts.
 */
const GPU_SPECS: Record<string, GpuSpec> = {
  // ── GCP ──
  a4: B200,
  a3: H100, // a3-ultra → H200 via SIZE_OVERRIDES
  a2: A100_40, // a2-ultragpu → A100-80 via SIZE_OVERRIDES
  g2: L4,
  // ── AWS ──
  p5: H100,
  p5e: H200,
  p5en: H200,
  p4d: A100_40,
  p4de: A100_80,
  p3: V100,
  p3dn: V100,
  g5: A10G,
  g6: L4,
  gr6: L4,
  g6e: L40S,
  g4dn: T4,
  g5g: T4, // Graviton + T4g
  g6f: L4, gr6f: L4, // fractional L4
  g4ad: V520, // AMD Radeon Pro V520
  p6b200: B200, // p6-b200 (Blackwell)
  p6b300: B200, // p6-b300 (Blackwell Ultra)
  // ── Azure (partial — the well-verified ones; expand via research) ──
  ndh200v5: H200,
  ndh100v5: H100,
  nch100v5: H100,
  nccadsh100v5: H100, // confidential H100 GPU
  nca100v4: A100_80,
  nda100v4: A100_40,
  ndma100v4: A100_80,
  nvadsa10v5: A10G,
};

/**
 * Resolve a GPU spec for a VM by family, with a vmSizeName override for the
 * families that span two GPU memory tiers within one family token (GCP
 * a3-ultragpu uses H200 not H100; a2-ultragpu uses A100 80GB not 40GB). Returns
 * `null` for any family not in the curated table — the engine's GPU terms then
 * stay inert (no fabrication).
 */
export function gpuSpecFor(family: string | undefined, sizeName?: string): GpuSpec | null {
  const s = (sizeName ?? '').toLowerCase();
  // Within-family GPU-memory overrides (GCP a3-ultra=H200, a2-ultra=A100-80).
  if (s.includes('a3-ultra') || s.includes('a3ultra')) return H200;
  if (s.includes('a2-ultra') || s.includes('a2ultra')) return A100_80;
  // Model embedded in the SKU name (Azure nc/nd/nv families carry it there).
  const tokens = s.split(/[_\s.-]+/);
  for (const name in MODEL_BY_NAME) if (tokens.includes(name)) return MODEL_BY_NAME[name];
  // Otherwise the family token (AWS/GCP keep the model in the family).
  return GPU_SPECS[familyToken(family)] ?? null;
}

/**
 * Family token → confidential-compute TEE kind. Keyed to the families that get
 * the dedicated `'Confidential'` category (Azure DC and EC series): SEV-SNP on
 * the AMD dca/dcad/eca/ecad lines, Intel TDX on the dce/dced/ece/eced lines. NOTE:
 * AWS m6a/c6a/r6a and GCP N2D/C2D/C3D/C3 are confidential-CAPABLE but expose it as
 * an opt-in FEATURE on a normal-category family (not an inherently-confidential
 * SKU), so they are deliberately NOT keyed here — penalizing m6a↔m7i for "TEE"
 * would be wrong. That opt-in capability channel lives in `teeCapabilityFor` /
 * `isConfidentialCapable` below, keyed separately and flagged `optIn: true`. The
 * category gate already separates the purpose-built confidential families; this
 * map only distinguishes the TEE KIND within them.
 */
const TEE_SUPPORT: Record<string, TeeSpec> = {
  dcasv5: { kind: 'sev-snp' }, dcadsv5: { kind: 'sev-snp' },
  ecasv5: { kind: 'sev-snp' }, ecadsv5: { kind: 'sev-snp' },
  dcasv6: { kind: 'sev-snp' }, dcadsv6: { kind: 'sev-snp' },
  ecasv6: { kind: 'sev-snp' }, ecadsv6: { kind: 'sev-snp' },
  dcesv5: { kind: 'tdx' }, dcedsv5: { kind: 'tdx' },
  ecesv5: { kind: 'tdx' }, ecedsv5: { kind: 'tdx' },
  dcesv6: { kind: 'tdx' }, dcedsv6: { kind: 'tdx' },
  ecesv6: { kind: 'tdx' }, ecedsv6: { kind: 'tdx' },
};

/**
 * Resolve the TEE kind for a confidential VM, or `null`. The live catalog keys
 * confidential families by the bare series prefix (`dc`/`ec`), so the TEE KIND is
 * read from the SKU name: `Standard_{DC|EC}{n}a…` = AMD SEV-SNP, `…{n}e…` = Intel
 * TDX (the letter after the size number is the silicon vendor). Falls back to the
 * family-token map for any caller that passes the full sub-series.
 */
export function teeSpecFor(family: string | undefined, sizeName?: string): TeeSpec | null {
  const m = (sizeName ?? '').toLowerCase().match(/^standard_(?:dc|ec)\d+([ae])/);
  if (m) return { kind: m[1] === 'e' ? 'tdx' : 'sev-snp' };
  return TEE_SUPPORT[familyToken(family)] ?? null;
}

/**
 * OPT-IN confidential capability for NORMAL-category families — the ones that
 * are not inherently confidential (so `teeSpecFor` returns null for them) yet can
 * boot in a hardware-TEE on request. This is a SEPARATE channel from `teeSpecFor`
 * so the deliberate "not keyed" doctrine for the confidential distance term is
 * preserved (m6a↔m7i must not be penalized), while the caveat layer + the tee
 * feature vector can still SEE that a GP peer offers confidential compute.
 *
 * Verified against vendor docs (July 2026):
 *   - AWS m6a/c6a/r6a = AMD SEV-SNP (opt-in launch flag).
 *     https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/snp-find-instance-types.html
 *   - GCP n2d = AMD SEV + SEV-SNP; c2d = AMD SEV; c3d = AMD SEV; c3 = Intel TDX.
 *     (n2d keys the stronger SEV-SNP; c2d/c3d are plain SEV per vendor docs — the
 *      brief's "c2d/c3d = sev-snp" was corrected to vendor truth.)
 *     https://docs.cloud.google.com/confidential-computing/confidential-vm/docs/supported-configurations
 */
const TEE_CAPABILITY: Record<string, TeeSpec> = {
  // AWS — AMD SEV-SNP opt-in.
  m6a: { kind: 'sev-snp', optIn: true },
  c6a: { kind: 'sev-snp', optIn: true },
  r6a: { kind: 'sev-snp', optIn: true },
  // GCP — per supported-configurations (n2d is the only SNP; c2d/c3d are SEV).
  n2d: { kind: 'sev-snp', optIn: true },
  c2d: { kind: 'sev', optIn: true },
  c3d: { kind: 'sev', optIn: true },
  c3: { kind: 'tdx', optIn: true },
};

/**
 * Resolve the OPT-IN confidential capability for a normal-category VM family, or
 * `null`. Keyed by provider + family token (these families carry the model in the
 * family, not the SKU name). Distinct from `teeSpecFor`, which covers the
 * purpose-built confidential-category families.
 */
export function teeCapabilityFor(provider: string | undefined, family: string | undefined): TeeSpec | null {
  void provider; // capability is family-keyed; provider kept for signature stability + future clouds
  return TEE_CAPABILITY[familyToken(family)] ?? null;
}

/** True when a VM either IS a confidential-category family or OFFERS opt-in
 *  confidential compute. Used by the comparability audit + caveat layer. */
export function isConfidentialCapable(vm: { provider?: string; family?: string }): boolean {
  return teeSpecFor(vm.family) !== null || teeCapabilityFor(vm.provider, vm.family) !== null;
}
