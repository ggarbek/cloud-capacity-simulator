/**
 * v2.17 — Exhaustive Azure VM catalog.
 *
 * Sources every published Azure VM series + every public Azure region.
 * Region list from the Azure region picker (~60 regions):
 *   https://azure.microsoft.com/en-us/pricing/details/virtual-machines/linux/
 *
 * Categories from Azure's pricing-page picker:
 *   All / General purpose / Compute optimized / Memory optimized /
 *   Storage optimized / GPU / High performance compute
 * Plus AWS-compatible "Previous Generation" and "Confidential" buckets.
 *
 * Each family is defined parametrically (memPerVcpu ratio, base $/vCPU,
 * size lineup, network ceiling, etc.) and expanded across every region
 * via a regional pricing multiplier. Real prices vary by SKU — users
 * override via Excel upload per the Decoupling Doctrine.
 *
 * Companion file `azureMSeriesSeed.ts` carries the *hand-curated* M-Series
 * + Mv2 + Mv3 catalog with per-SKU pricing across 6 M-Series-only regions.
 * This file picks up everything else: D / B / E / F / FX / L / N / H / G / DC.
 *
 * Doctrine: vendor-public information only. User uploads override.
 */
import type { UserVm, VmCategory } from '../types';
import { categorizeAzureFamily } from '../utils/vmCategory';

const PROVIDER = 'Azure';
const RI_1Y = 0.65;
const RI_3Y = 0.45;

// ────────────────────────────────────────────────────────────────────────
// Azure regions (~60). Multipliers approximate Azure Pricing Calculator
// regional ratios vs East US 2 baseline.
// ────────────────────────────────────────────────────────────────────────
const AZURE_REGION_MULT: Record<string, number> = {
  // United States
  'East US 2': 1.0,
  'East US': 1.0,
  'West US 2': 1.0,
  'West US 3': 1.0,
  'Central US': 1.0,
  'North Central US': 1.0,
  'South Central US': 1.0,
  'West Central US': 1.0,
  'West US': 1.05,
  // United Kingdom
  'UK South': 1.07,
  'UK West': 1.07,
  // United Arab Emirates
  'UAE Central': 1.18,
  'UAE North': 1.18,
  // Switzerland
  'Switzerland North': 1.20,
  'Switzerland West': 1.20,
  // Sweden
  'Sweden Central': 1.08,
  'Sweden South': 1.08,
  // Spain
  'Spain Central': 1.12,
  // Qatar
  'Qatar Central': 1.18,
  // Poland
  'Poland Central': 1.12,
  // Norway
  'Norway East': 1.12,
  'Norway West': 1.12,
  // New Zealand
  'New Zealand North': 1.22,
  // Mexico
  'Mexico Central': 1.10,
  // Malaysia
  'Malaysia West': 1.18,
  // Korea
  'Korea Central': 1.18,
  'Korea South': 1.18,
  // Japan
  'Japan East': 1.20,
  'Japan West': 1.20,
  // Italy
  'Italy North': 1.12,
  // Israel
  'Israel Central': 1.16,
  // Indonesia
  'Indonesia Central': 1.18,
  // India
  'Central India': 1.10,
  'South India': 1.10,
  'West India': 1.10,
  // Germany
  'Germany North': 1.12,
  'Germany West Central': 1.12,
  // France
  'France Central': 1.10,
  'France South': 1.10,
  // Europe
  'North Europe': 1.05,
  'West Europe': 1.10,
  // Denmark
  'Denmark East': 1.10,
  // Chile
  'Chile Central': 1.20,
  // Canada
  'Canada Central': 1.05,
  'Canada East': 1.05,
  // Brazil
  'Brazil South': 1.25,
  'Brazil Southeast': 1.25,
  // Belgium
  'Belgium Central': 1.10,
  // Azure Government
  'US Gov Arizona': 1.15,
  'US Gov Texas': 1.15,
  'US Gov Virginia': 1.15,
  // Austria
  'Austria East': 1.12,
  // Australia
  'Australia Central': 1.18,
  'Australia Central 2': 1.18,
  'Australia East': 1.18,
  'Australia Southeast': 1.18,
  // Asia Pacific
  'East Asia': 1.18,
  'Southeast Asia': 1.15,
  // Africa
  'South Africa North': 1.18,
  'South Africa West': 1.18,
  // v2.25.2 — real high-coverage regions the live shards carry (588–1190
  // SKUs each) that this seed previously omitted. Multipliers are the median
  // (region payg ÷ East US 2 payg) over the hundreds of D/E SKUs shared with
  // East US 2 in public/rates/azure/ — data-grounded, not guessed.
  'Jio India West': 1.03,
  'Jio India Central': 1.03,
  'Israel Northwest': 1.2,
  'India South Central': 1.04,
};
const AZURE_REGIONS = Object.keys(AZURE_REGION_MULT);

// ────────────────────────────────────────────────────────────────────────
// CPU labels — canonical processor strings used across the family table.
// ────────────────────────────────────────────────────────────────────────
const CPU = {
  haswell: 'Intel Xeon E5-2673 v3 (Haswell)',
  broadwell: 'Intel Xeon E5-2673 v4 (Broadwell)',
  skylake: 'Intel Xeon Platinum 8171M (Skylake)',
  cascade: 'Intel Xeon Platinum 8272CL (Cascade Lake)',
  cascadeL: 'Intel Xeon Platinum 8280M (Cascade Lake, large mem)',
  ice: 'Intel Xeon Platinum 8370C (Ice Lake)',
  sapphire: 'Intel Xeon 4th Gen Scalable (Sapphire Rapids)',
  emerald: 'Intel Xeon 5th Gen Scalable (Emerald Rapids)',
  amdRome: 'AMD EPYC 7452 (Rome)',
  amdMilan: 'AMD EPYC 7763v (Milan)',
  amdGenoa: 'AMD EPYC 9V33X (Genoa-X)',
  ampere: 'Ampere Altra (Neoverse N1)',
  cobalt: 'Microsoft Cobalt 100 (Neoverse N2)',
};

// ────────────────────────────────────────────────────────────────────────
// Family definitions.
// ────────────────────────────────────────────────────────────────────────
interface Family {
  /** Display family slug — also the `family` field on emitted rows + the
   *  Series column in the Excel template. */
  name: string;
  /** Pricing-page category (canonical, cross-cloud). */
  category: VmCategory;
  /** SKU prefix — e.g. 'Standard_D' produces 'Standard_D2s_v5' style names
   *  via `sizeSuffix`. */
  skuPrefix: string;
  /** Suffix applied after the vCPU number. e.g. 's_v5' → 'Standard_D2s_v5'. */
  skuSuffix: string;
  cpu: string;
  /** GiB per vCPU. */
  memPerVcpu: number;
  /** Hourly $/vCPU at East US 2. */
  basePerVcpu: number;
  sizes: number[];
  baseNet: number;
  maxNet: number;
  storMbps?: number;
  accelerator?: string;
  /** Per-family region override. Most families ship everywhere; older
   *  generations + GPU + HPC sometimes don't. */
  regions?: string[];
  /** Optional notes for the row. */
  notes?: string;
}

// Common size sets
const SIZES_SMALL = [2, 4, 8, 16];
const SIZES_STD = [2, 4, 8, 16, 32, 48, 64];
const SIZES_BIG = [2, 4, 8, 16, 32, 48, 64, 96];
const SIZES_HUGE = [2, 4, 8, 16, 32, 48, 64, 96, 128];
const SIZES_FX = [4, 12, 24, 36, 48];
const SIZES_GPU_NC = [4, 8, 16, 24, 48, 96];
const SIZES_HPC = [44, 60, 96, 120, 176];
const SIZES_B = [1, 2, 4, 8, 16, 20];
const SIZES_AV2 = [1, 2, 4, 8];

const FAMILIES: Family[] = [
  // ── General Purpose ─────────────────────────────────────────────────────
  // Av2 — older A-series (Av1 retired)
  { name: 'Av2', category: 'General Purpose', skuPrefix: 'Standard_A', skuSuffix: '_v2', cpu: CPU.haswell, memPerVcpu: 2, basePerVcpu: 0.0430, sizes: SIZES_AV2, baseNet: 250, maxNet: 1000 },
  // B-series (burstable)
  { name: 'Bsv2', category: 'General Purpose', skuPrefix: 'Standard_B', skuSuffix: 's_v2', cpu: CPU.ice, memPerVcpu: 4, basePerVcpu: 0.0392, sizes: SIZES_B, baseNet: 6250, maxNet: 12500 },
  // D-series — many flavors. Latest = Dsv5/Ddsv5/Dasv5/Dadsv5/Dpsv5/Dpdsv5.
  { name: 'Dsv5', category: 'General Purpose', skuPrefix: 'Standard_D', skuSuffix: 's_v5', cpu: CPU.ice, memPerVcpu: 4, basePerVcpu: 0.048, sizes: SIZES_BIG, baseNet: 12500, maxNet: 35000 },
  { name: 'Ddsv5', category: 'General Purpose', skuPrefix: 'Standard_D', skuSuffix: 'ds_v5', cpu: CPU.ice, memPerVcpu: 4, basePerVcpu: 0.057, sizes: SIZES_BIG, baseNet: 12500, maxNet: 35000 },
  { name: 'Dasv5', category: 'General Purpose', skuPrefix: 'Standard_D', skuSuffix: 'as_v5', cpu: CPU.amdMilan, memPerVcpu: 4, basePerVcpu: 0.043, sizes: SIZES_BIG, baseNet: 12500, maxNet: 40000 },
  { name: 'Dadsv5', category: 'General Purpose', skuPrefix: 'Standard_D', skuSuffix: 'ads_v5', cpu: CPU.amdMilan, memPerVcpu: 4, basePerVcpu: 0.052, sizes: SIZES_BIG, baseNet: 12500, maxNet: 40000 },
  { name: 'Dpsv5', category: 'General Purpose', skuPrefix: 'Standard_D', skuSuffix: 'ps_v5', cpu: CPU.ampere, memPerVcpu: 4, basePerVcpu: 0.0384, sizes: SIZES_BIG, baseNet: 12500, maxNet: 40000 },
  { name: 'Dpdsv5', category: 'General Purpose', skuPrefix: 'Standard_D', skuSuffix: 'pds_v5', cpu: CPU.ampere, memPerVcpu: 4, basePerVcpu: 0.046, sizes: SIZES_BIG, baseNet: 12500, maxNet: 40000 },
  { name: 'Dplsv5', category: 'General Purpose', skuPrefix: 'Standard_D', skuSuffix: 'pls_v5', cpu: CPU.ampere, memPerVcpu: 2, basePerVcpu: 0.0307, sizes: SIZES_BIG, baseNet: 12500, maxNet: 40000 },
  { name: 'Dpldsv5', category: 'General Purpose', skuPrefix: 'Standard_D', skuSuffix: 'plds_v5', cpu: CPU.ampere, memPerVcpu: 2, basePerVcpu: 0.0369, sizes: SIZES_BIG, baseNet: 12500, maxNet: 40000 },
  { name: 'Dlsv5', category: 'General Purpose', skuPrefix: 'Standard_D', skuSuffix: 'ls_v5', cpu: CPU.ice, memPerVcpu: 2, basePerVcpu: 0.0392, sizes: SIZES_BIG, baseNet: 12500, maxNet: 35000 },
  { name: 'Dldsv5', category: 'General Purpose', skuPrefix: 'Standard_D', skuSuffix: 'lds_v5', cpu: CPU.ice, memPerVcpu: 2, basePerVcpu: 0.046, sizes: SIZES_BIG, baseNet: 12500, maxNet: 35000 },
  // Cobalt 100 (Microsoft custom Arm)
  { name: 'Dpsv6', category: 'General Purpose', skuPrefix: 'Standard_D', skuSuffix: 'ps_v6', cpu: CPU.cobalt, memPerVcpu: 4, basePerVcpu: 0.0432, sizes: SIZES_BIG, baseNet: 12500, maxNet: 50000 },
  // Older Dsv4 / Dasv4 lineage (still published in some regions)
  { name: 'Dsv4', category: 'General Purpose', skuPrefix: 'Standard_D', skuSuffix: 's_v4', cpu: CPU.cascade, memPerVcpu: 4, basePerVcpu: 0.05, sizes: SIZES_BIG, baseNet: 12500, maxNet: 30000 },
  { name: 'Dasv4', category: 'General Purpose', skuPrefix: 'Standard_D', skuSuffix: 'as_v4', cpu: CPU.amdRome, memPerVcpu: 4, basePerVcpu: 0.046, sizes: SIZES_BIG, baseNet: 12500, maxNet: 30000 },

  // ── Compute Optimized ───────────────────────────────────────────────────
  { name: 'Fsv2', category: 'Compute Optimized', skuPrefix: 'Standard_F', skuSuffix: 's_v2', cpu: CPU.cascade, memPerVcpu: 2, basePerVcpu: 0.0423, sizes: SIZES_BIG, baseNet: 875, maxNet: 32000 },
  { name: 'Fasv6', category: 'Compute Optimized', skuPrefix: 'Standard_F', skuSuffix: 'as_v6', cpu: CPU.amdGenoa, memPerVcpu: 2, basePerVcpu: 0.0455, sizes: SIZES_BIG, baseNet: 12500, maxNet: 80000 },
  { name: 'Falsv6', category: 'Compute Optimized', skuPrefix: 'Standard_F', skuSuffix: 'als_v6', cpu: CPU.amdGenoa, memPerVcpu: 1, basePerVcpu: 0.0392, sizes: SIZES_BIG, baseNet: 12500, maxNet: 80000 },
  { name: 'FX', category: 'Compute Optimized', skuPrefix: 'Standard_FX', skuSuffix: 'mds', cpu: CPU.cascade, memPerVcpu: 8, basePerVcpu: 0.092, sizes: SIZES_FX, baseNet: 8000, maxNet: 40000, notes: 'FX-series: high frequency, 4 GHz all-core' },

  // ── Memory Optimized ────────────────────────────────────────────────────
  // E-series — Esv5/Edsv5/Easv5/Eadsv5/Epsv5/Epdsv5/Ebdsv5
  { name: 'Esv5', category: 'Memory Optimized', skuPrefix: 'Standard_E', skuSuffix: 's_v5', cpu: CPU.ice, memPerVcpu: 8, basePerVcpu: 0.0630, sizes: SIZES_BIG, baseNet: 12500, maxNet: 35000 },
  { name: 'Edsv5', category: 'Memory Optimized', skuPrefix: 'Standard_E', skuSuffix: 'ds_v5', cpu: CPU.ice, memPerVcpu: 8, basePerVcpu: 0.0746, sizes: SIZES_BIG, baseNet: 12500, maxNet: 35000 },
  { name: 'Easv5', category: 'Memory Optimized', skuPrefix: 'Standard_E', skuSuffix: 'as_v5', cpu: CPU.amdMilan, memPerVcpu: 8, basePerVcpu: 0.0567, sizes: SIZES_BIG, baseNet: 12500, maxNet: 40000 },
  { name: 'Eadsv5', category: 'Memory Optimized', skuPrefix: 'Standard_E', skuSuffix: 'ads_v5', cpu: CPU.amdMilan, memPerVcpu: 8, basePerVcpu: 0.0671, sizes: SIZES_BIG, baseNet: 12500, maxNet: 40000 },
  { name: 'Epsv5', category: 'Memory Optimized', skuPrefix: 'Standard_E', skuSuffix: 'ps_v5', cpu: CPU.ampere, memPerVcpu: 8, basePerVcpu: 0.0504, sizes: SIZES_BIG, baseNet: 12500, maxNet: 40000 },
  { name: 'Epdsv5', category: 'Memory Optimized', skuPrefix: 'Standard_E', skuSuffix: 'pds_v5', cpu: CPU.ampere, memPerVcpu: 8, basePerVcpu: 0.0598, sizes: SIZES_BIG, baseNet: 12500, maxNet: 40000 },
  { name: 'Ebdsv5', category: 'Memory Optimized', skuPrefix: 'Standard_E', skuSuffix: 'bds_v5', cpu: CPU.ice, memPerVcpu: 8, basePerVcpu: 0.083, sizes: SIZES_BIG, baseNet: 12500, maxNet: 80000, storMbps: 8000 },
  // E-series previous gens
  { name: 'Esv4', category: 'Memory Optimized', skuPrefix: 'Standard_E', skuSuffix: 's_v4', cpu: CPU.cascade, memPerVcpu: 8, basePerVcpu: 0.067, sizes: SIZES_BIG, baseNet: 12500, maxNet: 30000 },
  { name: 'Easv4', category: 'Memory Optimized', skuPrefix: 'Standard_E', skuSuffix: 'as_v4', cpu: CPU.amdRome, memPerVcpu: 8, basePerVcpu: 0.060, sizes: SIZES_BIG, baseNet: 12500, maxNet: 30000 },
  // M-series — handled in azureMSeriesSeed.ts (kept separate for hand-curated pricing).
  // GS-series (legacy memory-opt) — previous gen
  { name: 'GSv1', category: 'Previous Generation', skuPrefix: 'Standard_GS', skuSuffix: '', cpu: CPU.haswell, memPerVcpu: 14, basePerVcpu: 0.0784, sizes: [2, 4, 8, 16, 32], baseNet: 2000, maxNet: 20000 },

  // ── Storage Optimized ───────────────────────────────────────────────────
  { name: 'Lsv3', category: 'Storage Optimized', skuPrefix: 'Standard_L', skuSuffix: 's_v3', cpu: CPU.ice, memPerVcpu: 8, basePerVcpu: 0.091, sizes: [8, 16, 32, 48, 64, 80], baseNet: 12500, maxNet: 32000, storMbps: 4000 },
  { name: 'Lasv3', category: 'Storage Optimized', skuPrefix: 'Standard_L', skuSuffix: 'as_v3', cpu: CPU.amdMilan, memPerVcpu: 8, basePerVcpu: 0.082, sizes: [8, 16, 32, 48, 64, 80], baseNet: 12500, maxNet: 32000, storMbps: 4000 },
  { name: 'Lsv2', category: 'Previous Generation', skuPrefix: 'Standard_L', skuSuffix: 's_v2', cpu: CPU.amdRome, memPerVcpu: 8, basePerVcpu: 0.078, sizes: [8, 16, 32, 48, 64, 80], baseNet: 4000, maxNet: 32000, storMbps: 3000 },

  // ── GPU (Accelerated) ──────────────────────────────────────────────────
  { name: 'NCasT4_v3', category: 'GPU', skuPrefix: 'Standard_NC', skuSuffix: 'as_T4_v3', cpu: CPU.amdRome, memPerVcpu: 7, basePerVcpu: 0.137, sizes: [4, 8, 16, 64], baseNet: 8000, maxNet: 32000, accelerator: 'NVIDIA T4' },
  { name: 'NCsv3', category: 'GPU', skuPrefix: 'Standard_NC', skuSuffix: 's_v3', cpu: CPU.broadwell, memPerVcpu: 14, basePerVcpu: 0.510, sizes: [6, 12, 24], baseNet: 8000, maxNet: 24000, accelerator: 'NVIDIA Tesla V100' },
  { name: 'NCadsA100v4', category: 'GPU', skuPrefix: 'Standard_NC', skuSuffix: 'ads_A100_v4', cpu: CPU.amdMilan, memPerVcpu: 9.2, basePerVcpu: 0.612, sizes: SIZES_GPU_NC, baseNet: 20000, maxNet: 80000, accelerator: 'NVIDIA A100 80GB' },
  { name: 'NCH100v5', category: 'GPU', skuPrefix: 'Standard_NC', skuSuffix: '_H100_v5', cpu: CPU.sapphire, memPerVcpu: 6.7, basePerVcpu: 1.06, sizes: [40, 80], baseNet: 50000, maxNet: 200000, accelerator: 'NVIDIA H100 NVL' },
  { name: 'NDH100v5', category: 'GPU', skuPrefix: 'Standard_ND', skuSuffix: '_H100_v5', cpu: CPU.sapphire, memPerVcpu: 11, basePerVcpu: 0.875, sizes: [96], baseNet: 400000, maxNet: 400000, accelerator: 'NVIDIA H100 (8× SXM5)' },
  { name: 'NDH200v5', category: 'GPU', skuPrefix: 'Standard_ND', skuSuffix: '_H200_v5', cpu: CPU.sapphire, memPerVcpu: 12, basePerVcpu: 1.025, sizes: [96], baseNet: 400000, maxNet: 400000, accelerator: 'NVIDIA H200 (8× SXM5)' },
  { name: 'NDMI300X_v5', category: 'GPU', skuPrefix: 'Standard_ND', skuSuffix: '_MI300X_v5', cpu: CPU.sapphire, memPerVcpu: 11.5, basePerVcpu: 0.97, sizes: [96], baseNet: 400000, maxNet: 400000, accelerator: 'AMD Instinct MI300X (8×)' },
  { name: 'NDasrA100v4', category: 'GPU', skuPrefix: 'Standard_ND', skuSuffix: 'asr_A100_v4', cpu: CPU.cascadeL, memPerVcpu: 11, basePerVcpu: 0.595, sizes: [96], baseNet: 200000, maxNet: 200000, accelerator: 'NVIDIA A100 40GB (8× SXM)' },
  { name: 'NDmA100v4', category: 'GPU', skuPrefix: 'Standard_ND', skuSuffix: 'm_A100_v4', cpu: CPU.cascadeL, memPerVcpu: 19, basePerVcpu: 0.679, sizes: [96], baseNet: 200000, maxNet: 200000, accelerator: 'NVIDIA A100 80GB (8× SXM)' },
  { name: 'NVadsA10v5', category: 'GPU', skuPrefix: 'Standard_NV', skuSuffix: 'ads_A10_v5', cpu: CPU.amdMilan, memPerVcpu: 7.8, basePerVcpu: 0.255, sizes: [6, 12, 18, 36, 72], baseNet: 12500, maxNet: 40000, accelerator: 'NVIDIA A10' },
  { name: 'NVv4', category: 'GPU', skuPrefix: 'Standard_NV', skuSuffix: '_v4', cpu: CPU.amdRome, memPerVcpu: 7, basePerVcpu: 0.265, sizes: [4, 8, 16, 32], baseNet: 8000, maxNet: 32000, accelerator: 'AMD Radeon Instinct MI25' },

  // ── High Performance Computing ──────────────────────────────────────────
  { name: 'HBv4', category: 'High Performance Computing', skuPrefix: 'Standard_HB', skuSuffix: 'rs_v4', cpu: CPU.amdGenoa, memPerVcpu: 6.6, basePerVcpu: 0.0875, sizes: SIZES_HPC, baseNet: 200000, maxNet: 400000, regions: ['East US 2', 'South Central US', 'West US 3', 'North Europe', 'West Europe', 'UK South', 'Southeast Asia'] },
  { name: 'HBv3', category: 'High Performance Computing', skuPrefix: 'Standard_HB', skuSuffix: 'rs_v3', cpu: CPU.amdMilan, memPerVcpu: 4.0, basePerVcpu: 0.0764, sizes: [16, 32, 64, 96, 120], baseNet: 200000, maxNet: 200000, regions: ['East US 2', 'South Central US', 'West US 3', 'North Europe', 'West Europe', 'UK South', 'Southeast Asia', 'Japan East'] },
  { name: 'HBv2', category: 'High Performance Computing', skuPrefix: 'Standard_HB', skuSuffix: 'rs_v2', cpu: CPU.amdRome, memPerVcpu: 4.0, basePerVcpu: 0.066, sizes: [120], baseNet: 200000, maxNet: 200000, regions: ['East US', 'South Central US', 'North Europe', 'West Europe'] },
  { name: 'HC', category: 'High Performance Computing', skuPrefix: 'Standard_HC', skuSuffix: 'rs', cpu: CPU.skylake, memPerVcpu: 8.0, basePerVcpu: 0.054, sizes: [44], baseNet: 200000, maxNet: 200000, regions: ['East US', 'South Central US', 'North Europe', 'West Europe'] },
  { name: 'HX', category: 'High Performance Computing', skuPrefix: 'Standard_HX', skuSuffix: '', cpu: CPU.amdGenoa, memPerVcpu: 16, basePerVcpu: 0.115, sizes: [176], baseNet: 400000, maxNet: 400000, regions: ['East US 2', 'South Central US', 'West Europe', 'UK South', 'Southeast Asia'] },

  // ── Confidential VMs (Azure DC-series) ─────────────────────────────────
  { name: 'DCsv3', category: 'Confidential', skuPrefix: 'Standard_DC', skuSuffix: 's_v3', cpu: CPU.ice, memPerVcpu: 8, basePerVcpu: 0.090, sizes: [2, 4, 8, 16, 24, 32, 48], baseNet: 6000, maxNet: 30000, regions: ['East US', 'East US 2', 'West US 2', 'North Europe', 'West Europe', 'UK South', 'Southeast Asia', 'Japan East', 'Canada Central', 'Australia East'] },
  { name: 'DCadsv5', category: 'Confidential', skuPrefix: 'Standard_DC', skuSuffix: 'ads_v5', cpu: CPU.amdMilan, memPerVcpu: 4, basePerVcpu: 0.060, sizes: SIZES_BIG, baseNet: 12500, maxNet: 40000, notes: 'AMD SEV-SNP confidential' },
  { name: 'ECadsv5', category: 'Confidential', skuPrefix: 'Standard_EC', skuSuffix: 'ads_v5', cpu: CPU.amdMilan, memPerVcpu: 8, basePerVcpu: 0.080, sizes: SIZES_BIG, baseNet: 12500, maxNet: 40000, notes: 'AMD SEV-SNP confidential, memory-optimized' },
];

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────
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
function nicCount(vcpu: number): number {
  if (vcpu <= 2) return 2;
  if (vcpu <= 8) return 4;
  if (vcpu <= 16) return 8;
  return 8;
}
function memCategoryLabel(
  memoryGib: number,
): 'Medium Memory (MM)' | 'High Memory (HM)' | 'Very High Memory (VHM)' {
  if (memoryGib > 4096) return 'Very High Memory (VHM)';
  if (memoryGib > 1024) return 'High Memory (HM)';
  return 'Medium Memory (MM)';
}
function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

// ────────────────────────────────────────────────────────────────────────
// Build
// ────────────────────────────────────────────────────────────────────────
function buildSeed(): UserVm[] {
  const out: UserVm[] = [];
  for (const f of FAMILIES) {
    const regions = f.regions ?? AZURE_REGIONS;
    const category: VmCategory = f.category ?? categorizeAzureFamily(f.name);
    for (const vcpu of f.sizes) {
      const mem = vcpu * f.memPerVcpu;
      // Azure SKU naming: most are Standard_{prefix-letter}{vcpu}{suffix}.
      // e.g. Standard_D + 2 + s_v5 = Standard_D2s_v5.
      // For the FX family the prefix carries the family letter already.
      const sku =
        f.skuPrefix.endsWith('_')
          ? `${f.skuPrefix}${vcpu}${f.skuSuffix}`
          : `${f.skuPrefix}${vcpu}${f.skuSuffix}`;
      const baseHourly = f.basePerVcpu * vcpu;
      const network = netAt(f, vcpu);
      const stor = storMbpsAt(f, vcpu);
      for (const region of regions) {
        const mult = AZURE_REGION_MULT[region];
        if (mult === undefined) continue;
        const hourly = round4(baseHourly * mult);
        out.push({
          vmSizeName: sku,
          vmGeneration: f.name,
          series: f.name,
          memoryCategory: memCategoryLabel(mem),
          homeHardwareGroup: '',
          spilloverTarget: 'N/A',
          processor: f.cpu,
          vcpus: vcpu,
          memoryGib: Math.round(mem * 100) / 100,
          networkMbps: network,
          localDiskGib: 0,
          status: 'GA',
          notes: f.notes ?? '',
          provider: PROVIDER,
          family: f.name,
          category,
          region,
          hourlyUsd: hourly,
          riOneYrHourlyUsd: round4(hourly * RI_1Y),
          riThreeYrHourlyUsd: round4(hourly * RI_3Y),
          networkNicCount: nicCount(vcpu),
          remoteStorageMbpsPremium: stor || Math.min(4000, Math.round(vcpu * 28)),
          acceleratorType: f.accelerator ?? 'None',
        });
      }
    }
  }
  return out;
}

export const AZURE_EXHAUSTIVE_SEED: UserVm[] = buildSeed();
export const AZURE_ALL_REGIONS: readonly string[] = AZURE_REGIONS;
