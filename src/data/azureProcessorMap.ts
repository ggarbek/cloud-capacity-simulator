// ────────────────────────────────────────────────────────────────────────
// Azure processor map — curated, SOURCE-CITED CPU silicon per Azure VM series.
//
// WHY THIS EXISTS (accuracy-first): Azure's Resource SKUs API — the feed our
// live rates/specs ingest joins on — carries NO processor string for a VM size.
// AWS publishes `physicalProcessor`; GCP publishes a family-level `cpu`; Azure
// publishes nothing. Without this, every Azure row shows a blank CPU, and the
// cross-cloud comparison silently omits the single most decision-relevant spec.
//
// So we fill the gap from a CURATED map transcribed from Microsoft Learn's
// per-series pages (learn.microsoft.com/azure/virtual-machines/sizes/*), the
// previous-generations list, and the ACU page — with a source URL PER ENTRY.
// The join tags these as `processorSource: 'curated'` and the UI shows them
// with an "(assumed)" marker + a tooltip citing the source. We NEVER fabricate:
// a family whose silicon is genuinely undocumented is OMITTED here (matching
// then falls back to the gen-unknown caveat), and dual-silicon families carry
// BOTH options in `processorOptions` ("host-dependent") rather than a false pick.
//
// KEY FORMAT: `${FAMILY}|v${n}|${variant}` where
//   FAMILY  = the leading series letter(s), uppercased (D, E, F, L, M, A, B,
//             G, DC, EC, NC, ND, NV, H, HB, HC, HX) — the feature letters that
//             follow the size digits (s/d/l/m/i/t…) are NOT part of the key,
//             because Azure ships the same silicon for Dv5 / Dsv5 / Ddv5.
//   n       = the `_v<n>` version (1 when the SKU has no `_v` suffix).
//   variant = '' (Intel), 'a' (AMD), or 'p' (Arm) — parsed from the feature
//             letters the SAME way `equivalence.archFromName` does.
//
// Verified 2026-07 against Microsoft Learn (URLs per entry). Dual-silicon pairs
// (Dv3/Ev3 = Broadwell + Skylake; Dv4 = Cascade Lake + Ice Lake; Dasv5 = Milan
// + Genoa) were confirmed on the live series pages.
// ────────────────────────────────────────────────────────────────────────

export interface AzureProcessorEntry {
  /** Combined human processor string (both options joined for dual-silicon). */
  processor: string;
  /** The individual silicon options when the family is host-dependent (two+
   *  microarchitectures). Omitted for a single-silicon family. */
  processorOptions?: string[];
  /** 'documented' when a Microsoft Learn series page states the exact silicon;
   *  'inferred' when the mapping is a reasonable read of the naming convention
   *  but the specific page wasn't individually verified. */
  confidence: 'documented' | 'inferred';
  /** Source URL backing this entry (Microsoft Learn). */
  source: string;
}

// ── Source URLs (Microsoft Learn — verified 2026-07) ──────────────────────
const S = {
  prevGen: 'https://learn.microsoft.com/azure/virtual-machines/sizes/previous-gen-sizes-list',
  acu: 'https://learn.microsoft.com/azure/virtual-machines/acu',
  // General purpose
  dv2: 'https://learn.microsoft.com/azure/virtual-machines/sizes/general-purpose/dv2-series',
  dv3: 'https://learn.microsoft.com/azure/virtual-machines/sizes/general-purpose/dv3-series',
  dv4: 'https://learn.microsoft.com/azure/virtual-machines/sizes/general-purpose/dv4-series',
  dav4: 'https://learn.microsoft.com/azure/virtual-machines/sizes/general-purpose/dav4-series',
  dv5: 'https://learn.microsoft.com/azure/virtual-machines/sizes/general-purpose/dv5-series',
  dasv5: 'https://learn.microsoft.com/azure/virtual-machines/sizes/general-purpose/dasv5-series',
  dpsv5: 'https://learn.microsoft.com/azure/virtual-machines/sizes/general-purpose/dpsv5-series',
  dv6: 'https://learn.microsoft.com/azure/virtual-machines/sizes/general-purpose/dsv6-series',
  dasv6: 'https://learn.microsoft.com/azure/virtual-machines/sizes/general-purpose/dasv6-series',
  dpsv6: 'https://learn.microsoft.com/azure/virtual-machines/sizes/general-purpose/dpsv6-series',
  bv1: 'https://learn.microsoft.com/azure/virtual-machines/sizes/general-purpose/b-series-cpu-credit-model',
  bsv2: 'https://learn.microsoft.com/azure/virtual-machines/sizes/general-purpose/bsv2-series',
  basv2: 'https://learn.microsoft.com/azure/virtual-machines/sizes/general-purpose/basv2-series',
  bpsv2: 'https://learn.microsoft.com/azure/virtual-machines/sizes/general-purpose/bpsv2-series',
  av2: 'https://learn.microsoft.com/azure/virtual-machines/sizes/general-purpose/av2-series',
  // Compute optimized
  fsv2: 'https://learn.microsoft.com/azure/virtual-machines/sizes/compute-optimized/fsv2-series',
  falsv6: 'https://learn.microsoft.com/azure/virtual-machines/sizes/compute-optimized/falsv6-series',
  // Memory optimized
  ev3: 'https://learn.microsoft.com/azure/virtual-machines/sizes/memory-optimized/ev3-series',
  ev4: 'https://learn.microsoft.com/azure/virtual-machines/sizes/memory-optimized/ev4-series',
  eav4: 'https://learn.microsoft.com/azure/virtual-machines/sizes/memory-optimized/eav4-series',
  ev5: 'https://learn.microsoft.com/azure/virtual-machines/sizes/memory-optimized/ev5-series',
  easv5: 'https://learn.microsoft.com/azure/virtual-machines/sizes/memory-optimized/easv5-series',
  epsv5: 'https://learn.microsoft.com/azure/virtual-machines/sizes/memory-optimized/epsv5-series',
  ev6: 'https://learn.microsoft.com/azure/virtual-machines/sizes/memory-optimized/esv6-series',
  easv6: 'https://learn.microsoft.com/azure/virtual-machines/sizes/memory-optimized/easv6-series',
  epsv6: 'https://learn.microsoft.com/azure/virtual-machines/sizes/memory-optimized/epsv6-series',
  gv1: 'https://learn.microsoft.com/azure/virtual-machines/sizes/previous-gen-sizes-list',
  mv1: 'https://learn.microsoft.com/azure/virtual-machines/sizes/memory-optimized/m-series',
  mv2: 'https://learn.microsoft.com/azure/virtual-machines/sizes/memory-optimized/mv2-series',
  msv3: 'https://learn.microsoft.com/azure/virtual-machines/sizes/memory-optimized/msv3-mdsv3-series',
  // Storage optimized
  lsv2: 'https://learn.microsoft.com/azure/virtual-machines/sizes/storage-optimized/lsv2-series',
  lsv3: 'https://learn.microsoft.com/azure/virtual-machines/sizes/storage-optimized/lsv3-series',
  lasv3: 'https://learn.microsoft.com/azure/virtual-machines/sizes/storage-optimized/lasv3-series',
  // Confidential
  dcasv5: 'https://learn.microsoft.com/azure/virtual-machines/sizes/general-purpose/dcasv5-dcadsv5-series',
  dcesv5: 'https://learn.microsoft.com/azure/confidential-computing/virtual-machine-options',
  ecasv5: 'https://learn.microsoft.com/azure/virtual-machines/sizes/memory-optimized/ecasv5-ecadsv5-series',
  ecesv5: 'https://learn.microsoft.com/azure/confidential-computing/virtual-machine-options',
  // HPC
  hbv3: 'https://learn.microsoft.com/azure/virtual-machines/sizes/high-performance-compute/hbv3-series',
  hbv4: 'https://learn.microsoft.com/azure/virtual-machines/sizes/high-performance-compute/hbv4-series',
  hx: 'https://learn.microsoft.com/azure/virtual-machines/sizes/high-performance-compute/hx-series',
  hcv1: 'https://learn.microsoft.com/azure/virtual-machines/sizes/high-performance-compute/hc-series',
  // GPU (N-series, only where silicon is stable)
  ncv3: 'https://learn.microsoft.com/azure/virtual-machines/sizes/gpu-accelerated/ncv3-series',
  ncasT4v3: 'https://learn.microsoft.com/azure/virtual-machines/sizes/gpu-accelerated/ncast4v3-series',
  nda100v4: 'https://learn.microsoft.com/azure/virtual-machines/sizes/gpu-accelerated/nda100v4-series',
} as const;

// Common processor strings (kept DRY; documented model numbers from the pages).
const BROADWELL = 'Intel Xeon E5-2673 v4 (Broadwell)';
const SKYLAKE = 'Intel Xeon Platinum 8171M (Skylake)';
const HASWELL = 'Intel Xeon E5-2673 v3 (Haswell)';
const CASCADE = 'Intel Xeon Platinum 8272CL (Cascade Lake)';
const ICELAKE = 'Intel Xeon Platinum 8370C (Ice Lake)';
const SAPPHIRE = 'Intel Xeon Platinum 8473C (Sapphire Rapids)';
const EMERALD = 'Intel Xeon Platinum 8573C (Emerald Rapids)';
const EPYC_ROME = 'AMD EPYC 7452 (Rome)';
const EPYC_MILAN = 'AMD EPYC 7763v (Milan)';
const EPYC_GENOA = 'AMD EPYC 9004 (Genoa)';
const AMPERE = 'Ampere Altra (Arm Neoverse N1)';
const COBALT = 'Microsoft Cobalt 100 (Arm Neoverse N2)';

/** Dual-silicon helper — combined label + split options. */
function dual(a: string, b: string): Pick<AzureProcessorEntry, 'processor' | 'processorOptions'> {
  return { processor: `${a} or ${b}`, processorOptions: [a, b] };
}

// ────────────────────────────────────────────────────────────────────────
// The map. Keyed `${FAMILY}|v${n}|${variant}`.
// ────────────────────────────────────────────────────────────────────────
export const AZURE_PROCESSOR_MAP: Record<string, AzureProcessorEntry> = {
  // ── A-series (entry level) ─────────────────────────────────────────────
  'A|v1|': { processor: 'Intel Xeon E5-2660/E5-2673 (Sandy Bridge/Haswell-class)', confidence: 'inferred', source: S.prevGen },
  'A|v2|': { processor: 'Intel Xeon E5-2673 v3 (Haswell) or E5-2673 v4 (Broadwell)', processorOptions: [HASWELL, BROADWELL], confidence: 'documented', source: S.av2 },

  // ── B-series (burstable) ───────────────────────────────────────────────
  'B|v1|': { ...dual(HASWELL, BROADWELL), confidence: 'documented', source: S.bv1 },
  'B|v2|': { ...dual(ICELAKE, SAPPHIRE), confidence: 'documented', source: S.bsv2 },
  'B|v2|a': { ...dual(EPYC_MILAN, EPYC_GENOA), confidence: 'documented', source: S.basv2 },
  'B|v2|p': { processor: AMPERE, confidence: 'documented', source: S.bpsv2 },

  // ── D-series (general purpose) ─────────────────────────────────────────
  'D|v1|': { ...dual(HASWELL, BROADWELL), confidence: 'documented', source: S.prevGen },
  'D|v2|': { ...dual(HASWELL, BROADWELL), confidence: 'documented', source: S.dv2 },
  'D|v3|': { ...dual(BROADWELL, SKYLAKE), confidence: 'documented', source: S.dv3 },
  'D|v4|': { ...dual(CASCADE, ICELAKE), confidence: 'documented', source: S.dv4 },
  'D|v4|a': { processor: EPYC_ROME, confidence: 'documented', source: S.dav4 },
  'D|v5|': { ...dual(ICELAKE, SAPPHIRE), confidence: 'documented', source: S.dv5 },
  'D|v5|a': { ...dual(EPYC_MILAN, EPYC_GENOA), confidence: 'documented', source: S.dasv5 },
  'D|v5|p': { processor: AMPERE, confidence: 'documented', source: S.dpsv5 },
  'D|v6|': { ...dual(EMERALD, SAPPHIRE), confidence: 'documented', source: S.dv6 },
  'D|v6|a': { processor: EPYC_GENOA, confidence: 'documented', source: S.dasv6 },
  'D|v6|p': { processor: COBALT, confidence: 'documented', source: S.dpsv6 },

  // ── E-series (memory optimized) ────────────────────────────────────────
  'E|v3|': { ...dual(BROADWELL, SKYLAKE), confidence: 'documented', source: S.ev3 },
  'E|v4|': { ...dual(CASCADE, ICELAKE), confidence: 'documented', source: S.ev4 },
  'E|v4|a': { processor: EPYC_ROME, confidence: 'documented', source: S.eav4 },
  'E|v5|': { ...dual(ICELAKE, SAPPHIRE), confidence: 'documented', source: S.ev5 },
  'E|v5|a': { ...dual(EPYC_MILAN, EPYC_GENOA), confidence: 'documented', source: S.easv5 },
  'E|v5|p': { processor: AMPERE, confidence: 'documented', source: S.epsv5 },
  'E|v6|': { ...dual(EMERALD, SAPPHIRE), confidence: 'documented', source: S.ev6 },
  'E|v6|a': { processor: EPYC_GENOA, confidence: 'documented', source: S.easv6 },
  'E|v6|p': { processor: COBALT, confidence: 'documented', source: S.epsv6 },

  // ── F-series (compute optimized) ───────────────────────────────────────
  'F|v1|': { processor: SKYLAKE, confidence: 'documented', source: S.prevGen },
  'F|v2|': { ...dual(SKYLAKE, CASCADE), confidence: 'documented', source: S.fsv2 },
  // Falsv6 / Famsv6 / Fasv6 (AMD Genoa); Fsv6 (Intel Emerald Rapids).
  'F|v6|': { processor: EMERALD, confidence: 'inferred', source: S.falsv6 },
  'F|v6|a': { processor: EPYC_GENOA, confidence: 'documented', source: S.falsv6 },

  // ── L-series (storage optimized) ───────────────────────────────────────
  'L|v1|': { processor: BROADWELL, confidence: 'inferred', source: S.prevGen },
  'L|v2|': { processor: EPYC_ROME, confidence: 'documented', source: S.lsv2 },
  'L|v3|': { processor: ICELAKE, confidence: 'documented', source: S.lsv3 },
  'L|v3|a': { processor: EPYC_MILAN, confidence: 'documented', source: S.lasv3 },

  // ── M-series (large memory) ────────────────────────────────────────────
  'M|v1|': { ...dual(BROADWELL, SKYLAKE), confidence: 'documented', source: S.mv1 },
  'M|v2|': { processor: SKYLAKE, confidence: 'documented', source: S.mv2 },
  'M|v3|': { processor: SAPPHIRE, confidence: 'documented', source: S.msv3 },

  // ── G-series (legacy memory/storage) ───────────────────────────────────
  'G|v1|': { processor: 'Intel Xeon E5-2698B v3 (Haswell)', confidence: 'documented', source: S.gv1 },

  // ── DC/EC-series (confidential compute) ────────────────────────────────
  // DCasv5/ECasv5 = AMD EPYC Milan with SEV-SNP; DCesv5/ECesv5 = Intel with TDX.
  'DC|v5|a': { processor: `${EPYC_MILAN} — AMD SEV-SNP`, confidence: 'documented', source: S.dcasv5 },
  'DC|v5|e': { processor: `${SAPPHIRE} — Intel TDX`, confidence: 'documented', source: S.dcesv5 },
  'EC|v5|a': { processor: `${EPYC_MILAN} — AMD SEV-SNP`, confidence: 'documented', source: S.ecasv5 },
  'EC|v5|e': { processor: `${SAPPHIRE} — Intel TDX`, confidence: 'documented', source: S.ecesv5 },

  // ── H/HB/HC/HX-series (HPC) ────────────────────────────────────────────
  'HB|v3|': { processor: 'AMD EPYC 7V73X (Milan-X, 3D V-Cache)', confidence: 'documented', source: S.hbv3 },
  'HB|v4|': { processor: 'AMD EPYC 9V33X (Genoa-X, 3D V-Cache)', confidence: 'documented', source: S.hbv4 },
  'HC|v1|': { processor: 'Intel Xeon Platinum 8168 (Skylake)', confidence: 'documented', source: S.hcv1 },
  'HX|v1|': { processor: 'AMD EPYC 9V33X (Genoa-X, 3D V-Cache)', confidence: 'documented', source: S.hx },

  // ── N-series (GPU) — only where the host CPU silicon is stable ──────────
  'NC|v3|': { processor: 'Intel Xeon E5-2690 v4 (Broadwell)', confidence: 'documented', source: S.ncv3 },
  'ND|v4|a': { processor: EPYC_ROME, confidence: 'documented', source: S.nda100v4 },
};

// ── Parsing ────────────────────────────────────────────────────────────
// Family-letter + feature-letters + version — same convention as
// equivalence.archFromName / azureGenFromName so the key stays consistent.

/** Split an Azure SKU into { family, featureLetters, version }. Returns null
 *  for non-Azure-canonical names. Mirrors equivalence.ts parsing:
 *    Standard_<FAMILY><size digits><feature letters>_v<n>
 *  e.g. Standard_D4as_v5 → { family: 'D', feat: 'as', ver: 5 }
 *       Standard_E2_v3   → { family: 'E', feat: '',   ver: 3 }
 *       Standard_M128ms  → { family: 'M', feat: 'ms', ver: 1 }
 *       Standard_DC8as_v5→ { family: 'DC', feat: 'as', ver: 5 } */
function parseAzureSku(vmSizeName: string): { family: string; feat: string; ver: number } | null {
  const raw = vmSizeName || '';
  if (!/^Standard_/i.test(raw)) return null;
  const name = raw.replace(/^Standard_/i, '');
  // Leading letters = family; then size digits; then trailing feature letters.
  const m = name.match(/^([A-Za-z]+?)(\d+)(?:-\d+)?([a-z]*)/);
  if (!m) return null;
  const family = m[1].toUpperCase();
  const feat = (m[3] ?? '').toLowerCase();
  const verM = name.match(/_v(\d+)\b/i);
  const ver = verM ? Number(verM[1]) : 1;
  return { family, feat, ver };
}

/** Arch variant token for the map key: 'a' (AMD), 'p' (Arm), 'e' (Intel-TDX
 *  confidential), or '' (Intel default). Matches the feature-letter convention
 *  archFromName reads (the letter appears among the feature letters). Note 'p'
 *  wins over 'a' when both present (Arm SKUs never carry 'a'). For confidential
 *  DC/EC families the 'e' variant marks the Intel-TDX line (DCesv5/ECesv5). */
function variantOf(family: string, feat: string): string {
  if (feat.includes('p')) return 'p';
  if (family === 'DC' || family === 'EC') {
    if (feat.includes('a')) return 'a';
    if (feat.includes('e')) return 'e';
    return '';
  }
  if (feat.includes('a')) return 'a';
  return '';
}

/**
 * Resolve the curated processor entry for an Azure SKU, or null when the family
 * / version is not in the curated map (matching then falls back to the
 * gen-unknown caveat — never a fabricated CPU). Tries the exact
 * family|version|variant key, then a variant-less fallback for the same family
 * + version (covers Intel sizes when only a base entry exists).
 */
export function azureProcessorFor(vmSizeName: string): AzureProcessorEntry | null {
  const p = parseAzureSku(vmSizeName);
  if (!p) return null;
  const variant = variantOf(p.family, p.feat);
  const exact = AZURE_PROCESSOR_MAP[`${p.family}|v${p.ver}|${variant}`];
  if (exact) return exact;
  // Fallback: an Intel base entry for the same family+version (only when the
  // requested variant was Intel-default; never cross-arch — an AMD SKU must not
  // borrow the Intel entry).
  if (variant === '') return AZURE_PROCESSOR_MAP[`${p.family}|v${p.ver}|`] ?? null;
  return null;
}
