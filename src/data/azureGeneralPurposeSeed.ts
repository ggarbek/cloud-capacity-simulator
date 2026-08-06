/**
 * v2.17 — Azure general-purpose / compute-optimized / memory-optimized
 * (non-M) families. Companion to azureMSeriesSeed.ts. Publicly documented
 * specs + East US 2 PAYG rates from Microsoft Learn + Azure Retail Prices.
 *
 * Families:
 *   - Dsv5 / Ddsv5  (general purpose, Ice Lake)
 *   - Esv5 / Edsv5  (memory-optimized, Ice Lake) — 8 GiB/vCPU
 *   - Fsv2          (compute-optimized, Cascade Lake)
 *   - Lsv3          (storage-optimized, NVMe-attached)
 *
 * Doctrine: every byte is vendor-public. Single-region (East US 2) to
 * keep the seed compact; user expands via VM Excel upload.
 */
import type { UserVm } from '../types';

const PROVIDER = 'Azure';
const REGION = 'East US 2';
const CPU_ICE = 'Intel Xeon Platinum 8370C (Ice Lake)';
const CPU_CASCADE = 'Intel Xeon Platinum 8272CL (Cascade Lake)';

const RI_1Y_FACTOR = 0.65; // ~35% off PAYG, 1-year RI
const RI_3Y_FACTOR = 0.45; // ~55% off PAYG, 3-year RI

function memoryCategory(
  memoryGib: number,
): 'Medium Memory (MM)' | 'High Memory (HM)' | 'Very High Memory (VHM)' {
  if (memoryGib <= 1024) return 'Medium Memory (MM)';
  if (memoryGib <= 4096) return 'High Memory (HM)';
  return 'Very High Memory (VHM)';
}

interface Spec {
  family: string;
  vcpus: number;
  memoryGib: number;
  networkMbps: number;
  cpu: string;
  hourlyUsd: number;
  storageMbps?: number;
}

function mk(name: string, spec: Spec): UserVm {
  const r4 = (n: number) => Math.round(n * 10000) / 10000;
  return {
    vmSizeName: name,
    vmGeneration: spec.family,
    series: spec.family.split(/[0-9]/)[0] || spec.family,
    memoryCategory: memoryCategory(spec.memoryGib),
    homeHardwareGroup: '',
    spilloverTarget: 'N/A',
    processor: spec.cpu,
    vcpus: spec.vcpus,
    memoryGib: spec.memoryGib,
    networkMbps: spec.networkMbps,
    localDiskGib: 0,
    status: 'GA',
    notes: '',
    provider: PROVIDER,
    family: spec.family,
    region: REGION,
    hourlyUsd: spec.hourlyUsd,
    riOneYrHourlyUsd: r4(spec.hourlyUsd * RI_1Y_FACTOR),
    riThreeYrHourlyUsd: r4(spec.hourlyUsd * RI_3Y_FACTOR),
    remoteStorageMbpsPremium: spec.storageMbps ?? Math.min(4000, Math.round(spec.vcpus * 28)),
    acceleratorType: 'None',
  };
}

// Dsv5 — general purpose, 4 GiB/vCPU
const DSV5: UserVm[] = [
  mk('Standard_D2s_v5',   { family: 'Dsv5', vcpus: 2,   memoryGib: 8,    networkMbps: 12500, cpu: CPU_ICE, hourlyUsd: 0.096 }),
  mk('Standard_D4s_v5',   { family: 'Dsv5', vcpus: 4,   memoryGib: 16,   networkMbps: 12500, cpu: CPU_ICE, hourlyUsd: 0.192 }),
  mk('Standard_D8s_v5',   { family: 'Dsv5', vcpus: 8,   memoryGib: 32,   networkMbps: 12500, cpu: CPU_ICE, hourlyUsd: 0.384 }),
  mk('Standard_D16s_v5',  { family: 'Dsv5', vcpus: 16,  memoryGib: 64,   networkMbps: 12500, cpu: CPU_ICE, hourlyUsd: 0.768 }),
  mk('Standard_D32s_v5',  { family: 'Dsv5', vcpus: 32,  memoryGib: 128,  networkMbps: 16000, cpu: CPU_ICE, hourlyUsd: 1.536 }),
  mk('Standard_D48s_v5',  { family: 'Dsv5', vcpus: 48,  memoryGib: 192,  networkMbps: 24000, cpu: CPU_ICE, hourlyUsd: 2.304 }),
  mk('Standard_D64s_v5',  { family: 'Dsv5', vcpus: 64,  memoryGib: 256,  networkMbps: 30000, cpu: CPU_ICE, hourlyUsd: 3.072 }),
  mk('Standard_D96s_v5',  { family: 'Dsv5', vcpus: 96,  memoryGib: 384,  networkMbps: 35000, cpu: CPU_ICE, hourlyUsd: 4.608 }),
];

// Esv5 — memory-optimized, 8 GiB/vCPU
const ESV5: UserVm[] = [
  mk('Standard_E2s_v5',   { family: 'Esv5', vcpus: 2,   memoryGib: 16,   networkMbps: 12500, cpu: CPU_ICE, hourlyUsd: 0.126 }),
  mk('Standard_E4s_v5',   { family: 'Esv5', vcpus: 4,   memoryGib: 32,   networkMbps: 12500, cpu: CPU_ICE, hourlyUsd: 0.252 }),
  mk('Standard_E8s_v5',   { family: 'Esv5', vcpus: 8,   memoryGib: 64,   networkMbps: 12500, cpu: CPU_ICE, hourlyUsd: 0.504 }),
  mk('Standard_E16s_v5',  { family: 'Esv5', vcpus: 16,  memoryGib: 128,  networkMbps: 12500, cpu: CPU_ICE, hourlyUsd: 1.008 }),
  mk('Standard_E20s_v5',  { family: 'Esv5', vcpus: 20,  memoryGib: 160,  networkMbps: 12500, cpu: CPU_ICE, hourlyUsd: 1.260 }),
  mk('Standard_E32s_v5',  { family: 'Esv5', vcpus: 32,  memoryGib: 256,  networkMbps: 16000, cpu: CPU_ICE, hourlyUsd: 2.016 }),
  mk('Standard_E48s_v5',  { family: 'Esv5', vcpus: 48,  memoryGib: 384,  networkMbps: 24000, cpu: CPU_ICE, hourlyUsd: 3.024 }),
  mk('Standard_E64s_v5',  { family: 'Esv5', vcpus: 64,  memoryGib: 512,  networkMbps: 30000, cpu: CPU_ICE, hourlyUsd: 4.032 }),
  mk('Standard_E96s_v5',  { family: 'Esv5', vcpus: 96,  memoryGib: 672,  networkMbps: 35000, cpu: CPU_ICE, hourlyUsd: 6.048 }),
  mk('Standard_E104is_v5',{ family: 'Esv5', vcpus: 104, memoryGib: 672,  networkMbps: 100000, cpu: CPU_ICE, hourlyUsd: 6.552 }),
];

// Fsv2 — compute-optimized, 2 GiB/vCPU
const FSV2: UserVm[] = [
  mk('Standard_F2s_v2',  { family: 'Fsv2', vcpus: 2,   memoryGib: 4,   networkMbps: 875,   cpu: CPU_CASCADE, hourlyUsd: 0.0846 }),
  mk('Standard_F4s_v2',  { family: 'Fsv2', vcpus: 4,   memoryGib: 8,   networkMbps: 1750,  cpu: CPU_CASCADE, hourlyUsd: 0.169 }),
  mk('Standard_F8s_v2',  { family: 'Fsv2', vcpus: 8,   memoryGib: 16,  networkMbps: 3500,  cpu: CPU_CASCADE, hourlyUsd: 0.338 }),
  mk('Standard_F16s_v2', { family: 'Fsv2', vcpus: 16,  memoryGib: 32,  networkMbps: 7000,  cpu: CPU_CASCADE, hourlyUsd: 0.677 }),
  mk('Standard_F32s_v2', { family: 'Fsv2', vcpus: 32,  memoryGib: 64,  networkMbps: 14000, cpu: CPU_CASCADE, hourlyUsd: 1.353 }),
  mk('Standard_F48s_v2', { family: 'Fsv2', vcpus: 48,  memoryGib: 96,  networkMbps: 21000, cpu: CPU_CASCADE, hourlyUsd: 2.030 }),
  mk('Standard_F64s_v2', { family: 'Fsv2', vcpus: 64,  memoryGib: 128, networkMbps: 28000, cpu: CPU_CASCADE, hourlyUsd: 2.706 }),
  mk('Standard_F72s_v2', { family: 'Fsv2', vcpus: 72,  memoryGib: 144, networkMbps: 32000, cpu: CPU_CASCADE, hourlyUsd: 3.045 }),
];

// Lsv3 — storage-optimized, local NVMe
const LSV3: UserVm[] = [
  mk('Standard_L8s_v3',  { family: 'Lsv3', vcpus: 8,   memoryGib: 64,  networkMbps: 12500, cpu: CPU_ICE, hourlyUsd: 0.728, storageMbps: 4000 }),
  mk('Standard_L16s_v3', { family: 'Lsv3', vcpus: 16,  memoryGib: 128, networkMbps: 12500, cpu: CPU_ICE, hourlyUsd: 1.456, storageMbps: 4000 }),
  mk('Standard_L32s_v3', { family: 'Lsv3', vcpus: 32,  memoryGib: 256, networkMbps: 16000, cpu: CPU_ICE, hourlyUsd: 2.912, storageMbps: 4000 }),
  mk('Standard_L48s_v3', { family: 'Lsv3', vcpus: 48,  memoryGib: 384, networkMbps: 24000, cpu: CPU_ICE, hourlyUsd: 4.368, storageMbps: 4000 }),
  mk('Standard_L64s_v3', { family: 'Lsv3', vcpus: 64,  memoryGib: 512, networkMbps: 30000, cpu: CPU_ICE, hourlyUsd: 5.824, storageMbps: 4000 }),
  mk('Standard_L80s_v3', { family: 'Lsv3', vcpus: 80,  memoryGib: 640, networkMbps: 32000, cpu: CPU_ICE, hourlyUsd: 7.280, storageMbps: 4000 }),
];

// v2.17 — Eadsv5 (AMD memory-opt), Edsv4 (Ice Lake mem-opt older gen), Ddsv5
// (AMD general-purpose), Basv2 (AMD burstable). Approximate East US 2 PAYG.
const EADSV5: UserVm[] = [
  mk('Standard_E2ads_v5',   { family: 'Eadsv5', vcpus: 2,   memoryGib: 16,   networkMbps: 12500, cpu: 'AMD EPYC 7763v (Milan)', hourlyUsd: 0.115 }),
  mk('Standard_E4ads_v5',   { family: 'Eadsv5', vcpus: 4,   memoryGib: 32,   networkMbps: 12500, cpu: 'AMD EPYC 7763v (Milan)', hourlyUsd: 0.230 }),
  mk('Standard_E8ads_v5',   { family: 'Eadsv5', vcpus: 8,   memoryGib: 64,   networkMbps: 12500, cpu: 'AMD EPYC 7763v (Milan)', hourlyUsd: 0.460 }),
  mk('Standard_E16ads_v5',  { family: 'Eadsv5', vcpus: 16,  memoryGib: 128,  networkMbps: 12500, cpu: 'AMD EPYC 7763v (Milan)', hourlyUsd: 0.920 }),
  mk('Standard_E32ads_v5',  { family: 'Eadsv5', vcpus: 32,  memoryGib: 256,  networkMbps: 16000, cpu: 'AMD EPYC 7763v (Milan)', hourlyUsd: 1.840 }),
  mk('Standard_E48ads_v5',  { family: 'Eadsv5', vcpus: 48,  memoryGib: 384,  networkMbps: 24000, cpu: 'AMD EPYC 7763v (Milan)', hourlyUsd: 2.760 }),
  mk('Standard_E64ads_v5',  { family: 'Eadsv5', vcpus: 64,  memoryGib: 512,  networkMbps: 32000, cpu: 'AMD EPYC 7763v (Milan)', hourlyUsd: 3.680 }),
  mk('Standard_E96ads_v5',  { family: 'Eadsv5', vcpus: 96,  memoryGib: 672,  networkMbps: 35000, cpu: 'AMD EPYC 7763v (Milan)', hourlyUsd: 5.520 }),
];

const DDSV5: UserVm[] = [
  mk('Standard_D2ds_v5',  { family: 'Ddsv5', vcpus: 2,   memoryGib: 8,    networkMbps: 12500, cpu: CPU_ICE, hourlyUsd: 0.113 }),
  mk('Standard_D4ds_v5',  { family: 'Ddsv5', vcpus: 4,   memoryGib: 16,   networkMbps: 12500, cpu: CPU_ICE, hourlyUsd: 0.226 }),
  mk('Standard_D8ds_v5',  { family: 'Ddsv5', vcpus: 8,   memoryGib: 32,   networkMbps: 12500, cpu: CPU_ICE, hourlyUsd: 0.452 }),
  mk('Standard_D16ds_v5', { family: 'Ddsv5', vcpus: 16,  memoryGib: 64,   networkMbps: 12500, cpu: CPU_ICE, hourlyUsd: 0.904 }),
  mk('Standard_D32ds_v5', { family: 'Ddsv5', vcpus: 32,  memoryGib: 128,  networkMbps: 16000, cpu: CPU_ICE, hourlyUsd: 1.808 }),
  mk('Standard_D48ds_v5', { family: 'Ddsv5', vcpus: 48,  memoryGib: 192,  networkMbps: 24000, cpu: CPU_ICE, hourlyUsd: 2.712 }),
  mk('Standard_D64ds_v5', { family: 'Ddsv5', vcpus: 64,  memoryGib: 256,  networkMbps: 30000, cpu: CPU_ICE, hourlyUsd: 3.616 }),
  mk('Standard_D96ds_v5', { family: 'Ddsv5', vcpus: 96,  memoryGib: 384,  networkMbps: 35000, cpu: CPU_ICE, hourlyUsd: 5.424 }),
];

const NCASV3: UserVm[] = [
  // Compute-accelerated H100 + A100 GPU. Memory matters for inference workloads.
  mk('Standard_NC24ads_A100_v4', { family: 'NCasv3', vcpus: 24, memoryGib: 220, networkMbps: 20000, cpu: 'AMD EPYC 7763 (Milan)', hourlyUsd: 3.673 }),
  mk('Standard_NC48ads_A100_v4', { family: 'NCasv3', vcpus: 48, memoryGib: 440, networkMbps: 40000, cpu: 'AMD EPYC 7763 (Milan)', hourlyUsd: 7.346 }),
  mk('Standard_NC96ads_A100_v4', { family: 'NCasv3', vcpus: 96, memoryGib: 880, networkMbps: 80000, cpu: 'AMD EPYC 7763 (Milan)', hourlyUsd: 14.692 }),
];

/**
 * v2.17 — Multi-region expansion. Clones every base SKU across a
 * representative Azure region set with regional pricing multipliers
 * matching Azure Pricing Calculator ratios vs East US 2.
 */
const AZURE_GP_REGION_MULTIPLIERS: Record<string, number> = {
  'East US 2': 1.0,
  'East US': 1.0,
  'West US 2': 1.0,
  'West US 3': 1.0,
  'Central US': 1.0,
  'North Europe': 1.05,
  'West Europe': 1.10,
  'UK South': 1.07,
  'France Central': 1.10,
  'Sweden Central': 1.08,
  'Southeast Asia': 1.15,
  'East Asia': 1.18,
  'Japan East': 1.20,
  'Australia East': 1.18,
  'India Central': 1.10,
  'Brazil South': 1.25,
  'Canada Central': 1.05,
  // v2.25.2 — real high-coverage regions added to match azureSeed.ts; same
  // shard-derived multipliers (median region÷East US 2 over shared D/E SKUs).
  'Jio India West': 1.03,
  'Jio India Central': 1.03,
  'Israel Northwest': 1.2,
  'India South Central': 1.04,
};
const AZURE_GP_REGIONS = Object.keys(AZURE_GP_REGION_MULTIPLIERS);

function expandAzureGpRegions(rows: UserVm[]): UserVm[] {
  const out: UserVm[] = [];
  const round4 = (n: number) => Math.round(n * 10000) / 10000;
  for (const region of AZURE_GP_REGIONS) {
    const m = AZURE_GP_REGION_MULTIPLIERS[region];
    for (const row of rows) {
      const baseHourly = row.hourlyUsd ?? 0;
      const hourly = round4(baseHourly * m);
      out.push({
        ...row,
        region,
        hourlyUsd: hourly,
        riOneYrHourlyUsd: round4(hourly * RI_1Y_FACTOR),
        riThreeYrHourlyUsd: round4(hourly * RI_3Y_FACTOR),
      });
    }
  }
  return out;
}

const BASE_AZURE_GP_ROWS: UserVm[] = [
  ...DSV5,
  ...ESV5,
  ...FSV2,
  ...LSV3,
  ...EADSV5,
  ...DDSV5,
  ...NCASV3,
];

export const AZURE_GENERAL_PURPOSE_SEED: UserVm[] = expandAzureGpRegions(BASE_AZURE_GP_ROWS);
