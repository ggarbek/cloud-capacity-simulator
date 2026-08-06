/**
 * v2.17.8 — GCP Compute Engine seed (region-anchored).
 *
 * Public Google Cloud pricing + machine-type data. Mirrors the official
 * regions-and-zones doc 1:1 — every (family × region) emitted is listed
 * in `docs/gcp/regions-and-machine-types.md`.
 *
 * Builder pattern matches the AWS seed (`awsMSeriesAnalogSeed.ts`):
 *   1. `FAMILIES[]` — one entry per published GCP machine series.
 *   2. `GCP_REGION_FAMILIES` (in `gcpRegionAvailability.ts`) — per-region
 *      set of family slugs.
 *   3. `buildSeed()` — region-first traversal; only emits a (family × region)
 *      row when both the family has a spec AND the region's set contains it.
 *
 * Doctrine (v2.11): all data here is vendor-public. User uploads still win.
 */
import type { UserVm, VmCategory } from '../types';
import { categorizeGcpFamily } from '../utils/vmCategory';
import { GCP_REGION_FAMILIES, GCP_ALL_REGIONS } from './gcpRegionAvailability';

const PROVIDER = 'GCP';
const CUD_1Y = 0.78; // GCP 1-year committed-use discount (≈22% off)
const CUD_3Y = 0.55; // GCP 3-year committed-use discount (≈45% off)

/** ISO stamp for the in-app disclaimer banner. Bump on every refresh. */
export const SEED_DATA_AS_OF = '2026-05-27';

// ────────────────────────────────────────────────────────────────────────
// CPU model strings — referenced by Family entries below.
// ────────────────────────────────────────────────────────────────────────
const CPU = {
  skylake: 'Intel Xeon Platinum 8175 (Skylake)',
  cascade: 'Intel Xeon Platinum 8268 (Cascade Lake)',
  ice: 'Intel Xeon Platinum 8373C (Ice Lake)',
  sapphire: 'Intel Xeon 4th Gen Scalable (Sapphire Rapids)',
  emerald: 'Intel Xeon 5th Gen Scalable (Emerald Rapids)',
  amdRome: 'AMD EPYC 7B12 (Rome)',
  amdMilan: 'AMD EPYC Milan',
  amdGenoa: 'AMD EPYC Genoa',
  amdTurin: 'AMD EPYC Turin',
  ampereAltra: 'Ampere Altra (Arm)',
  axion: 'Google Axion (Arm)',
} as const;

// ────────────────────────────────────────────────────────────────────────
// Region pricing multipliers vs us-central1 baseline.
// Public list ratios from GCP pricing pages. User overrides via Excel.
// ────────────────────────────────────────────────────────────────────────
const REGION_MULT: Record<string, number> = {
  // North America
  'us-central1': 1.0,
  'us-east1': 1.0,
  'us-east4': 1.0,
  'us-east5': 1.0,
  'us-south1': 1.04,
  'us-west1': 1.0,
  'us-west2': 1.10,
  'us-west3': 1.10,
  'us-west4': 1.04,
  'northamerica-northeast1': 1.10,
  'northamerica-northeast2': 1.10,
  'northamerica-south1': 1.10,
  // South America
  'southamerica-east1': 1.35,
  'southamerica-west1': 1.35,
  // Africa
  'africa-south1': 1.30,
  // Europe
  'europe-central2': 1.18,
  'europe-north1': 1.10,
  'europe-north2': 1.10,
  'europe-southwest1': 1.14,
  'europe-west1': 1.10,
  'europe-west2': 1.18,
  'europe-west3': 1.18,
  'europe-west4': 1.10,
  'europe-west6': 1.22,
  'europe-west8': 1.18,
  'europe-west9': 1.18,
  'europe-west10': 1.22,
  'europe-west12': 1.18,
  // Asia Pacific
  'asia-east1': 1.18,
  'asia-east2': 1.20,
  'asia-northeast1': 1.22,
  'asia-northeast2': 1.22,
  'asia-northeast3': 1.20,
  'asia-south1': 1.16,
  'asia-south2': 1.16,
  'asia-southeast1': 1.18,
  'asia-southeast2': 1.22,
  'australia-southeast1': 1.22,
  'australia-southeast2': 1.22,
  // Middle East
  'me-central1': 1.20,
  'me-central2': 1.20,
  'me-west1': 1.16,
};

// ────────────────────────────────────────────────────────────────────────
// Family definitions. `sizes` lists vCPU counts; memory = vcpu×memPerVcpu
// unless `sizeMems` overrides per-size.
// ────────────────────────────────────────────────────────────────────────
interface Family {
  name: string;            // lowercase machine-series slug (e.g. 'n2', 'c4a')
  display: string;         // human-readable label for the SKU suffix prefix
  cpu: string;
  memPerVcpu: number;
  basePerVcpu: number;     // $/vCPU/hr us-central1 PAYG baseline
  sizes: number[];         // vCPU counts published
  baseNet: number;         // Mbps at smallest size
  maxNet: number;          // Mbps at largest size
  storMbps?: number;       // SSD throughput MB/s (storage-optimized families)
  accelerator?: string;
  sizeMems?: Record<number, number>; // per-size GiB override
  /** Predefined-shape suffix — GCP SKUs read like `n2-standard-16`. */
  shape?: 'standard' | 'highmem' | 'highcpu' | 'megamem' | 'ultramem' | 'metal' | null;
}

// Reusable size lists.
const SIZES_E2 = [2, 4, 8, 16, 32];
const SIZES_GPU = [12, 24, 48, 96];

const FAMILIES: Family[] = [
  // ── General Purpose ─────────────────────────────────────────────────
  { name: 'e2', display: 'E2', cpu: 'Mixed (Intel + AMD)', memPerVcpu: 4, basePerVcpu: 0.027, sizes: SIZES_E2, baseNet: 1000, maxNet: 16000, shape: 'standard' },
  { name: 'n1', display: 'N1', cpu: CPU.skylake, memPerVcpu: 3.75, basePerVcpu: 0.038, sizes: [1, 2, 4, 8, 16, 32, 64, 96], baseNet: 2000, maxNet: 32000, shape: 'standard' },
  { name: 'n2', display: 'N2', cpu: CPU.cascade, memPerVcpu: 4, basePerVcpu: 0.038, sizes: [2, 4, 8, 16, 32, 48, 64, 80, 96, 128], baseNet: 4000, maxNet: 75000, shape: 'standard' },
  { name: 'n2d', display: 'N2D', cpu: CPU.amdMilan, memPerVcpu: 4, basePerVcpu: 0.033, sizes: [2, 4, 8, 16, 32, 48, 64, 80, 96, 128, 224], baseNet: 4000, maxNet: 100000, shape: 'standard' },
  { name: 'n4', display: 'N4', cpu: CPU.sapphire, memPerVcpu: 4, basePerVcpu: 0.045, sizes: [2, 4, 8, 16, 32, 48, 64, 80], baseNet: 10000, maxNet: 50000, shape: 'standard' },
  { name: 't2a', display: 'T2A', cpu: CPU.ampereAltra, memPerVcpu: 4, basePerVcpu: 0.030, sizes: [1, 2, 4, 8, 16, 32, 48], baseNet: 10000, maxNet: 32000, shape: 'standard' },
  { name: 't2d', display: 'T2D', cpu: CPU.amdMilan, memPerVcpu: 4, basePerVcpu: 0.031, sizes: [1, 2, 4, 8, 16, 32, 48, 60], baseNet: 10000, maxNet: 32000, shape: 'standard' },

  // ── Compute Optimized ───────────────────────────────────────────────
  { name: 'c2', display: 'C2', cpu: CPU.cascade, memPerVcpu: 4, basePerVcpu: 0.042, sizes: [4, 8, 16, 30, 60], baseNet: 10000, maxNet: 32000, shape: 'standard' },
  { name: 'c2d', display: 'C2D', cpu: CPU.amdMilan, memPerVcpu: 4, basePerVcpu: 0.038, sizes: [2, 4, 8, 16, 32, 56, 112], baseNet: 10000, maxNet: 100000, shape: 'standard' },
  { name: 'c3', display: 'C3', cpu: CPU.sapphire, memPerVcpu: 4, basePerVcpu: 0.046, sizes: [4, 8, 22, 44, 88, 176], baseNet: 10000, maxNet: 200000, shape: 'standard' },
  { name: 'c3d', display: 'C3D', cpu: CPU.amdGenoa, memPerVcpu: 4, basePerVcpu: 0.041, sizes: [4, 8, 16, 30, 60, 90, 180, 360], baseNet: 10000, maxNet: 200000, shape: 'standard' },
  { name: 'c4', display: 'C4', cpu: CPU.emerald, memPerVcpu: 3.75, basePerVcpu: 0.050, sizes: [2, 4, 8, 16, 32, 48, 96, 192], baseNet: 10000, maxNet: 200000, shape: 'standard' },
  { name: 'c4a', display: 'C4A', cpu: CPU.axion, memPerVcpu: 4, basePerVcpu: 0.040, sizes: [1, 2, 4, 8, 16, 32, 48, 64, 72], baseNet: 10000, maxNet: 100000, shape: 'standard' },
  { name: 'c4d', display: 'C4D', cpu: CPU.amdTurin, memPerVcpu: 4, basePerVcpu: 0.045, sizes: [2, 4, 8, 16, 32, 48, 96, 192, 384], baseNet: 10000, maxNet: 200000, shape: 'standard' },

  // ── Memory Optimized ────────────────────────────────────────────────
  { name: 'm1', display: 'M1', cpu: CPU.skylake, memPerVcpu: 14.93, basePerVcpu: 0.084, sizes: [40, 80, 160], baseNet: 10000, maxNet: 32000, shape: 'ultramem' },
  { name: 'm2', display: 'M2', cpu: CPU.cascade, memPerVcpu: 28.4, basePerVcpu: 0.155, sizes: [208, 416], baseNet: 32000, maxNet: 32000, sizeMems: { 208: 5888, 416: 11776 }, shape: 'ultramem' },
  { name: 'm3', display: 'M3', cpu: CPU.ice, memPerVcpu: 30.5, basePerVcpu: 0.165, sizes: [32, 64, 128], baseNet: 32000, maxNet: 32000, sizeMems: { 32: 976, 64: 1952, 128: 3904 }, shape: 'ultramem' },
  { name: 'm4', display: 'M4', cpu: CPU.sapphire, memPerVcpu: 25.0, basePerVcpu: 0.170, sizes: [56, 112, 224], baseNet: 50000, maxNet: 100000, sizeMems: { 56: 1488, 112: 2976, 224: 5952 }, shape: 'ultramem' },
  { name: 'x4', display: 'X4', cpu: CPU.sapphire, memPerVcpu: 34.0, basePerVcpu: 0.220, sizes: [288, 480, 960, 1920], baseNet: 100000, maxNet: 100000, sizeMems: { 288: 12000, 480: 16000, 960: 24000, 1920: 32000 }, shape: 'metal' },

  // ── Storage Optimized ───────────────────────────────────────────────
  { name: 'z3', display: 'Z3', cpu: CPU.sapphire, memPerVcpu: 8, basePerVcpu: 0.090, sizes: [8, 16, 22, 32, 44, 88, 176], baseNet: 25000, maxNet: 200000, storMbps: 12000, shape: 'highmem' },

  // ── HPC ─────────────────────────────────────────────────────────────
  { name: 'h3', display: 'H3', cpu: CPU.sapphire, memPerVcpu: 4, basePerVcpu: 0.075, sizes: [88], baseNet: 200000, maxNet: 200000, sizeMems: { 88: 352 }, shape: 'standard' },

  // ── GPU / Accelerated ───────────────────────────────────────────────
  { name: 'a2', display: 'A2', cpu: CPU.cascade, memPerVcpu: 14.4, basePerVcpu: 0.234, sizes: SIZES_GPU, baseNet: 50000, maxNet: 100000, accelerator: 'NVIDIA A100 40GB', shape: 'highmem' },
  { name: 'a3', display: 'A3', cpu: CPU.sapphire, memPerVcpu: 14.0, basePerVcpu: 0.510, sizes: [208], baseNet: 1800000, maxNet: 1800000, sizeMems: { 208: 1872 }, accelerator: 'NVIDIA H100 80GB', shape: 'highmem' },
  { name: 'a4', display: 'A4', cpu: CPU.emerald, memPerVcpu: 16.0, basePerVcpu: 0.620, sizes: [224], baseNet: 3600000, maxNet: 3600000, sizeMems: { 224: 3584 }, accelerator: 'NVIDIA Blackwell B200', shape: 'highmem' },
  { name: 'g2', display: 'G2', cpu: CPU.cascade, memPerVcpu: 4, basePerVcpu: 0.180, sizes: [4, 8, 12, 16, 24, 32, 48, 96], baseNet: 10000, maxNet: 100000, accelerator: 'NVIDIA L4', shape: 'standard' },
  { name: 'g4', display: 'G4', cpu: CPU.emerald, memPerVcpu: 8, basePerVcpu: 0.260, sizes: [96, 192, 384], baseNet: 100000, maxNet: 800000, accelerator: 'NVIDIA Blackwell B200 (inference)', shape: 'highmem' },
];

const FAMILY_BY_NAME: Record<string, Family> = (() => {
  const m: Record<string, Family> = {};
  for (const f of FAMILIES) m[f.name] = f;
  return m;
})();

// ────────────────────────────────────────────────────────────────────────
// SKU label conventions:
//   - `<series>-<shape>-<vcpu>`     for predefined shapes
//   - `<series>-megamem-<vcpu>-metal` for X4 SAP HANA bare-metal
//   - `<series>-<vcpu>`             when no shape suffix
// ────────────────────────────────────────────────────────────────────────
function skuName(f: Family, vcpu: number): string {
  if (f.shape === 'metal') return `${f.name}-megamem-${vcpu}-metal`;
  if (f.shape) return `${f.name}-${f.shape}-${vcpu}`;
  return `${f.name}-${vcpu}`;
}

function netAt(f: Family, vcpu: number): number {
  const maxSize = Math.max(...f.sizes);
  const minSize = Math.min(...f.sizes);
  if (maxSize === minSize) return f.maxNet;
  const t = (vcpu - minSize) / (maxSize - minSize);
  return Math.round(f.baseNet + (f.maxNet - f.baseNet) * t);
}

function storMbpsAt(f: Family, vcpu: number): number {
  if (f.storMbps === undefined) return 0;
  const maxSize = Math.max(...f.sizes);
  return Math.min(f.storMbps, Math.max(500, Math.round((vcpu / maxSize) * f.storMbps)));
}

function nicCount(_f: Family, vcpu: number): number {
  if (vcpu <= 2) return 2;
  if (vcpu <= 8) return 4;
  if (vcpu <= 16) return 8;
  return 16;
}

function memCategoryLabel(
  memoryGib: number,
): 'Medium Memory (MM)' | 'High Memory (HM)' | 'Very High Memory (VHM)' {
  if (memoryGib > 4096) return 'Very High Memory (VHM)';
  if (memoryGib > 1024) return 'High Memory (HM)';
  return 'Medium Memory (MM)';
}

const round4 = (n: number): number => Math.round(n * 10000) / 10000;

// ────────────────────────────────────────────────────────────────────────
// Builder — region-first traversal. Mirrors `GCP_REGION_FAMILIES` 1:1.
// ────────────────────────────────────────────────────────────────────────
function buildSeed(): UserVm[] {
  const out: UserVm[] = [];
  for (const region of GCP_ALL_REGIONS) {
    const mult = REGION_MULT[region];
    if (mult === undefined) continue;
    const familySet = GCP_REGION_FAMILIES[region];
    if (!familySet) continue;
    for (const slug of familySet) {
      const f = FAMILY_BY_NAME[slug];
      if (!f) continue; // family listed in doc but no spec yet — skip silently
      const category: VmCategory = categorizeGcpFamily(f.name);
      for (const vcpu of f.sizes) {
        const mem = f.sizeMems?.[vcpu] ?? vcpu * f.memPerVcpu;
        const sku = skuName(f, vcpu);
        const baseHourly = f.basePerVcpu * vcpu;
        const network = netAt(f, vcpu);
        const stor = storMbpsAt(f, vcpu);
        const hourly = round4(baseHourly * mult);
        out.push({
          vmSizeName: sku,
          vmGeneration: f.name,
          series: f.display,
          memoryCategory: memCategoryLabel(mem),
          homeHardwareGroup: '',
          spilloverTarget: 'N/A',
          processor: f.cpu,
          vcpus: vcpu,
          memoryGib: Math.round(mem * 100) / 100,
          networkMbps: network,
          localDiskGib: 0,
          status: 'GA',
          notes: '',
          provider: PROVIDER,
          family: f.name,
          category,
          region,
          hourlyUsd: hourly,
          riOneYrHourlyUsd: round4(hourly * CUD_1Y),
          riThreeYrHourlyUsd: round4(hourly * CUD_3Y),
          networkNicCount: nicCount(f, vcpu),
          remoteStorageMbpsPremium: stor || Math.min(4000, Math.round(vcpu * 26)),
          acceleratorType: f.accelerator ?? 'None',
        });
      }
    }
  }
  return out;
}

export const GCP_M_SERIES_ANALOG_SEED: UserVm[] = buildSeed();
