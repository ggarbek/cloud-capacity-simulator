/**
 * v2.17 — Exhaustive AWS EC2 catalog.
 *
 * Sources every family + sub-family enumerated in the AWS EC2 regions doc:
 *   https://docs.aws.amazon.com/ec2/latest/instancetypes/ec2-instance-regions.html
 *
 * Categories from AWS:
 *   • General Purpose      — A / M / T / Mac (Mac excluded — dedicated hosts)
 *   • Compute Optimized    — C
 *   • Memory Optimized     — R / X / U / z1d
 *   • Storage Optimized    — D / H / I / Im / Is
 *   • Accelerated          — DL / F / G / Gr / Inf / P / Trn / VT
 *   • HPC                  — Hpc
 *
 * Per-family region-availability is taken directly from the AWS docs — a
 * row only emits in a region where AWS actually publishes that family.
 *
 * Pricing: us-east-1 PAYG baseline derived from a per-vCPU rate scaled
 * by family category + processor generation. Real prices vary by SKU;
 * users override via Excel upload (Decoupling Doctrine §2). RI factors:
 * 1y × 0.63, 3y × 0.40 (Reserved Instance Standard, no upfront).
 *
 * SKU naming follows AWS convention: `{family}.{size}` (e.g. m7i.4xlarge,
 * x2idn.32xlarge). Sizes per family adapt to the published lineup.
 *
 * Doctrine: every byte vendor-public. User uploads override / extend.
 */
import type { UserVm, VmCategory } from '../types';
import { categorizeAwsFamily } from '../utils/vmCategory';
import { AWS_REGION_FAMILIES, AWS_ALL_REGIONS } from './awsRegionAvailability';

const PROVIDER = 'AWS';
const RI_1Y = 0.63;
const RI_3Y = 0.4;

// ────────────────────────────────────────────────────────────────────────
// CPU labels — one canonical string per processor family.
// ────────────────────────────────────────────────────────────────────────
const CPU = {
  haswell: 'Intel Xeon E5 v3 (Haswell)',
  broadwell: 'Intel Xeon E5 v4 (Broadwell)',
  skylake: 'Intel Xeon Platinum 8175M (Skylake)',
  cascade: 'Intel Xeon Platinum 8259CL (Cascade Lake)',
  cascadeZ: 'Intel Xeon Platinum 8252C (Cascade Lake, high-freq)',
  ice: 'Intel Xeon Platinum 8375C (Ice Lake)',
  iceZ: 'Intel Xeon Scalable 3rd Gen (Ice Lake, high-freq)',
  sapphire: 'Intel Xeon Platinum 8488C (Sapphire Rapids)',
  sapphireZ: 'Intel Xeon Scalable 4th Gen (Sapphire Rapids, high-freq)',
  emerald: 'Intel Xeon Scalable 5th Gen (Emerald Rapids)',
  granite: 'Intel Xeon 6 (Granite Rapids)',
  amdNaples: 'AMD EPYC 7000 (Naples)',
  amdRome: 'AMD EPYC 7R32 (Rome)',
  amdMilan: 'AMD EPYC 7R13 (Milan)',
  amdGenoa: 'AMD EPYC 9R14 (Genoa)',
  amdTurin: 'AMD EPYC Turin',
  graviton1: 'AWS Graviton (Neoverse Cosmos)',
  graviton2: 'AWS Graviton2 (Neoverse N1)',
  graviton3: 'AWS Graviton3 (Neoverse V1)',
  graviton3e: 'AWS Graviton3E (Neoverse V1)',
  graviton4: 'AWS Graviton4 (Neoverse V2)',
} as const;

// ────────────────────────────────────────────────────────────────────────
// Region availability per family — derived from the AWS docs.
// Regions are AWS region codes; "ALL_COMMERCIAL" is shorthand for the
// commercial-region superset (everything except GovCloud + China).
// ────────────────────────────────────────────────────────────────────────
const ALL_COMMERCIAL: string[] = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'af-south-1',
  'ap-east-1', 'ap-east-2', 'ap-northeast-1', 'ap-northeast-2', 'ap-northeast-3',
  'ap-south-1', 'ap-south-2',
  'ap-southeast-1', 'ap-southeast-2', 'ap-southeast-3', 'ap-southeast-4',
  'ap-southeast-5', 'ap-southeast-6', 'ap-southeast-7',
  'ca-central-1', 'ca-west-1',
  'eu-central-1', 'eu-central-2',
  'eu-north-1', 'eu-south-1', 'eu-south-2', 'eu-west-1', 'eu-west-2', 'eu-west-3',
  'il-central-1',
  'me-central-1', 'me-south-1',
  'mx-central-1',
  'sa-east-1',
];

// Region pricing multipliers vs us-east-1.
// v2.17.3 — adds GovCloud, China, and AWS European Sovereign Cloud so the
// seed covers EVERY region in the AWS EC2 instance-region doc. These are
// public list-price ratios — users override via Excel uploads.
const REGION_MULT: Record<string, number> = {
  'us-east-1': 1.0,
  'us-east-2': 1.0,
  'us-west-1': 1.06,
  'us-west-2': 1.0,
  'af-south-1': 1.18,
  'ap-east-1': 1.20,
  'ap-east-2': 1.20,
  'ap-northeast-1': 1.16,
  'ap-northeast-2': 1.14,
  'ap-northeast-3': 1.16,
  'ap-south-1': 1.04,
  'ap-south-2': 1.04,
  'ap-southeast-1': 1.12,
  'ap-southeast-2': 1.14,
  'ap-southeast-3': 1.12,
  'ap-southeast-4': 1.18,
  'ap-southeast-5': 1.16,
  'ap-southeast-6': 1.18,
  'ap-southeast-7': 1.14,
  'ca-central-1': 1.06,
  'ca-west-1': 1.06,
  'cn-north-1': 1.08, // billed via Sinnet/AWS China; rates broadly track US baseline
  'cn-northwest-1': 1.08,
  'eu-central-1': 1.12,
  'eu-central-2': 1.18,
  'eu-north-1': 1.0,
  'eu-south-1': 1.10,
  'eu-south-2': 1.10,
  'eu-west-1': 1.08,
  'eu-west-2': 1.12,
  'eu-west-3': 1.10,
  'eusc-de-east-1': 1.18, // AWS European Sovereign Cloud (Germany)
  'il-central-1': 1.14,
  'me-central-1': 1.18,
  'me-south-1': 1.16,
  'mx-central-1': 1.10,
  'sa-east-1': 1.32,
  'us-gov-east-1': 1.30, // GovCloud premium
  'us-gov-west-1': 1.30,
};

// ────────────────────────────────────────────────────────────────────────
// Family definitions — one entry per published AWS family.
// `sizes` is the list of vCPU counts the family ships at. `memPerVcpu`
// is the GiB-per-vCPU ratio; the size's memory = vCPU × ratio.
// `regions` is the explicit list of regions where AWS publishes this
// family (sourced from the docs above). When undefined the family falls
// back to ALL_COMMERCIAL.
// ────────────────────────────────────────────────────────────────────────
interface Family {
  name: string;
  category: 'gp' | 'co' | 'mo' | 'so' | 'ac' | 'hpc';
  cpu: string;
  /** Memory-to-vCPU ratio. e.g. 2 = 2 GiB per vCPU (compute-opt), 4 = general,
   *  8 = memory-opt, 16+ = X / U / high-mem. */
  memPerVcpu: number;
  /** Base $/vCPU/hr for us-east-1 PAYG. Multiplied by size + region. */
  basePerVcpu: number;
  /** vCPU sizes this family ships in. */
  sizes: number[];
  /** Network Mbps at smallest size; doubles roughly per-size up to maxNet. */
  baseNet: number;
  maxNet: number;
  /** Premium SSD/EBS throughput MB/s (uncached) at largest size. */
  storMbps?: number;
  /** Accelerator model when applicable. */
  accelerator?: string;
  /** AWS NIC count cap at the family's typical size. */
  nics?: number;
  /** Per-family region availability. Defaults to ALL_COMMERCIAL. */
  regions?: string[];
  /** v2.17.4 — Per-vCPU memory override (GiB). Used for families where
   *  memory is essentially constant across sizes (e.g. HPC7a is 768 GiB on
   *  EVERY size; HPC7g is 128 GiB on every size). When present, this map
   *  overrides `mem = vcpu × memPerVcpu`. Source-of-truth in
   *  `docs/aws/hpc.md`. */
  sizeMems?: Record<number, number>;
  /** v2.17.4 — Per-size override for the SKU suffix label. Used for
   *  bare-metal Mac families that ship as `mac1.metal`, `mac-m4max.metal`
   *  etc. rather than the algorithmic `xlarge` suffix. */
  sizeLabel?: Record<number, string>;
  /** v2.17.4 — Flat hourly USD overriding the per-vCPU calculation. Used by
   *  Mac instances which are licensed as dedicated hosts and don't follow
   *  the linear $/vCPU model. */
  flatHourly?: number;
}

// Standard size schemas reused across families.
const SIZES_T = [1, 2, 4, 8]; // T-family sizes (nano..2xlarge approximated by vCPU)
const SIZES_STD = [2, 4, 8, 16, 32, 48, 64, 96]; // most modern x86 lineups
const SIZES_BIG = [2, 4, 8, 16, 32, 48, 64, 96, 128, 192]; // m7i, m8i, c7i, etc.
const SIZES_MEM = [2, 4, 8, 16, 32, 48, 64, 96, 128, 192]; // r7i etc.
const SIZES_X = [4, 8, 16, 32, 48, 64, 96, 128];
const SIZES_GRAVITON = [1, 2, 4, 8, 16, 32, 48, 64, 96, 128];
const SIZES_GPU = [4, 8, 16, 32, 48, 64, 96];
const SIZES_HPC = [16, 32, 64, 96];

const FAMILIES: Family[] = [
  // ── General Purpose ─────────────────────────────────────────────────────
  // A1 — first-gen Graviton, AMER + some others, deprecated in many regions
  { name: 'a1', category: 'gp', cpu: CPU.graviton1, memPerVcpu: 2, basePerVcpu: 0.0204, sizes: [1, 2, 4, 8, 16], baseNet: 1000, maxNet: 10000, regions: ['us-east-1', 'us-east-2', 'us-west-2', 'eu-west-1', 'eu-central-1', 'ap-south-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1'] },
  // Legacy M generations — still published in select regions
  { name: 'm1', category: 'gp', cpu: 'Intel Xeon E5-2650 (Sandy Bridge)', memPerVcpu: 3.75, basePerVcpu: 0.0440, sizes: [1, 2, 4, 8], baseNet: 500, maxNet: 1000, regions: ['us-east-1', 'us-west-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'sa-east-1', 'cn-north-1'] },
  { name: 'm2', category: 'gp', cpu: 'Intel Xeon E5-2665 (Sandy Bridge)', memPerVcpu: 8.5, basePerVcpu: 0.0850, sizes: [2, 4], baseNet: 500, maxNet: 1000, regions: ['us-east-1', 'us-west-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'sa-east-1'] },
  { name: 'm3', category: 'gp', cpu: 'Intel Xeon E5-2670 v2 (Ivy Bridge)', memPerVcpu: 3.75, basePerVcpu: 0.0466, sizes: [1, 2, 4, 8], baseNet: 1000, maxNet: 1000, regions: ['us-east-1', 'us-west-1', 'us-west-2', 'eu-west-1', 'eu-central-1', 'ap-south-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'sa-east-1', 'cn-north-1'] },
  { name: 'm4', category: 'gp', cpu: CPU.broadwell, memPerVcpu: 4, basePerVcpu: 0.05, sizes: [2, 4, 8, 16, 40, 64], baseNet: 750, maxNet: 25000 },
  { name: 'm5', category: 'gp', cpu: CPU.skylake, memPerVcpu: 4, basePerVcpu: 0.048, sizes: [2, 4, 8, 16, 24, 48, 96], baseNet: 750, maxNet: 25000 },
  { name: 'm5a', category: 'gp', cpu: 'AMD EPYC 7571 (Naples)', memPerVcpu: 4, basePerVcpu: 0.043, sizes: [2, 4, 8, 16, 24, 48, 96], baseNet: 750, maxNet: 20000 },
  { name: 'm5ad', category: 'gp', cpu: 'AMD EPYC 7571 (Naples)', memPerVcpu: 4, basePerVcpu: 0.0515, sizes: [2, 4, 8, 16, 24, 48], baseNet: 750, maxNet: 20000 },
  { name: 'm5d', category: 'gp', cpu: CPU.skylake, memPerVcpu: 4, basePerVcpu: 0.0565, sizes: [2, 4, 8, 16, 24, 48, 96], baseNet: 750, maxNet: 25000 },
  { name: 'm5dn', category: 'gp', cpu: CPU.cascade, memPerVcpu: 4, basePerVcpu: 0.0680, sizes: [2, 4, 8, 16, 24, 48, 96], baseNet: 25000, maxNet: 100000 },
  { name: 'm5n', category: 'gp', cpu: CPU.cascade, memPerVcpu: 4, basePerVcpu: 0.0595, sizes: [2, 4, 8, 16, 24, 48, 96], baseNet: 25000, maxNet: 100000 },
  { name: 'm5zn', category: 'gp', cpu: CPU.cascadeZ, memPerVcpu: 2, basePerVcpu: 0.0826, sizes: [2, 4, 8, 12], baseNet: 12500, maxNet: 100000 },
  { name: 'm6a', category: 'gp', cpu: 'AMD EPYC 7R13 (Milan)', memPerVcpu: 4, basePerVcpu: 0.0432, sizes: [2, 4, 8, 16, 24, 32, 48, 64, 96, 128, 192], baseNet: 12500, maxNet: 50000 },
  { name: 'm6g', category: 'gp', cpu: CPU.graviton2, memPerVcpu: 4, basePerVcpu: 0.0385, sizes: [1, 2, 4, 8, 16, 32, 48, 64], baseNet: 10000, maxNet: 25000 },
  { name: 'm6gd', category: 'gp', cpu: CPU.graviton2, memPerVcpu: 4, basePerVcpu: 0.0452, sizes: [1, 2, 4, 8, 16, 32, 48, 64], baseNet: 10000, maxNet: 25000 },
  { name: 'm6i', category: 'gp', cpu: CPU.ice, memPerVcpu: 4, basePerVcpu: 0.048, sizes: SIZES_BIG, baseNet: 12500, maxNet: 50000 },
  { name: 'm6id', category: 'gp', cpu: CPU.ice, memPerVcpu: 4, basePerVcpu: 0.0593, sizes: [2, 4, 8, 16, 24, 32, 48, 64, 96, 128], baseNet: 12500, maxNet: 50000 },
  { name: 'm6idn', category: 'gp', cpu: CPU.ice, memPerVcpu: 4, basePerVcpu: 0.0823, sizes: [2, 4, 8, 16, 24, 32, 48, 64, 96, 128], baseNet: 25000, maxNet: 200000 },
  { name: 'm6in', category: 'gp', cpu: CPU.ice, memPerVcpu: 4, basePerVcpu: 0.0727, sizes: [2, 4, 8, 16, 24, 32, 48, 64, 96, 128], baseNet: 25000, maxNet: 200000 },
  { name: 'm7a', category: 'gp', cpu: CPU.amdGenoa, memPerVcpu: 4, basePerVcpu: 0.0517, sizes: SIZES_BIG, baseNet: 12500, maxNet: 50000 },
  { name: 'm7g', category: 'gp', cpu: CPU.graviton3, memPerVcpu: 4, basePerVcpu: 0.0408, sizes: [1, 2, 4, 8, 16, 32, 48, 64], baseNet: 12500, maxNet: 30000 },
  { name: 'm7gd', category: 'gp', cpu: CPU.graviton3, memPerVcpu: 4, basePerVcpu: 0.0481, sizes: [1, 2, 4, 8, 16, 32, 48, 64], baseNet: 12500, maxNet: 30000 },
  { name: 'm7i', category: 'gp', cpu: CPU.sapphire, memPerVcpu: 4, basePerVcpu: 0.0504, sizes: SIZES_BIG, baseNet: 12500, maxNet: 50000 },
  { name: 'm7i-flex', category: 'gp', cpu: CPU.sapphire, memPerVcpu: 4, basePerVcpu: 0.0479, sizes: [2, 4, 8, 16], baseNet: 12500, maxNet: 12500 },
  { name: 'm8a', category: 'gp', cpu: CPU.amdTurin, memPerVcpu: 4, basePerVcpu: 0.054, sizes: SIZES_BIG, baseNet: 12500, maxNet: 50000 },
  { name: 'm8azn', category: 'gp', cpu: CPU.amdTurin, memPerVcpu: 2, basePerVcpu: 0.087, sizes: [2, 4, 8, 12], baseNet: 12500, maxNet: 100000 },
  { name: 'm8g', category: 'gp', cpu: CPU.graviton4, memPerVcpu: 4, basePerVcpu: 0.0428, sizes: [1, 2, 4, 8, 16, 24, 32, 48], baseNet: 12500, maxNet: 50000 },
  { name: 'm8gb', category: 'gp', cpu: CPU.graviton4, memPerVcpu: 4, basePerVcpu: 0.0475, sizes: [2, 4, 8, 16, 24, 32, 48], baseNet: 12500, maxNet: 50000 },
  { name: 'm8gd', category: 'gp', cpu: CPU.graviton4, memPerVcpu: 4, basePerVcpu: 0.0506, sizes: [2, 4, 8, 16, 24, 32, 48], baseNet: 12500, maxNet: 50000 },
  { name: 'm8gn', category: 'gp', cpu: CPU.graviton4, memPerVcpu: 4, basePerVcpu: 0.0648, sizes: [2, 4, 8, 16, 24, 32, 48], baseNet: 25000, maxNet: 200000 },
  { name: 'm8i', category: 'gp', cpu: CPU.granite, memPerVcpu: 4, basePerVcpu: 0.053, sizes: SIZES_BIG, baseNet: 12500, maxNet: 100000 },
  { name: 'm8id', category: 'gp', cpu: CPU.granite, memPerVcpu: 4, basePerVcpu: 0.066, sizes: SIZES_BIG, baseNet: 12500, maxNet: 100000 },
  { name: 'm8i-flex', category: 'gp', cpu: CPU.granite, memPerVcpu: 4, basePerVcpu: 0.0506, sizes: [2, 4, 8, 16], baseNet: 12500, maxNet: 12500 },
  { name: 'm8in', category: 'gp', cpu: CPU.granite, memPerVcpu: 4, basePerVcpu: 0.0793, sizes: SIZES_BIG, baseNet: 25000, maxNet: 200000 },
  { name: 'm8idn', category: 'gp', cpu: CPU.granite, memPerVcpu: 4, basePerVcpu: 0.0908, sizes: SIZES_BIG, baseNet: 25000, maxNet: 200000 },
  { name: 'm8ine', category: 'gp', cpu: CPU.granite, memPerVcpu: 4, basePerVcpu: 0.1037, sizes: SIZES_BIG, baseNet: 50000, maxNet: 400000 },
  { name: 'm8ib', category: 'gp', cpu: CPU.granite, memPerVcpu: 4, basePerVcpu: 0.060, sizes: SIZES_BIG, baseNet: 12500, maxNet: 100000, storMbps: 8000 },
  { name: 'm8idb', category: 'gp', cpu: CPU.granite, memPerVcpu: 4, basePerVcpu: 0.073, sizes: SIZES_BIG, baseNet: 12500, maxNet: 100000, storMbps: 10000 },
  // T-family (burstable)
  { name: 't1', category: 'gp', cpu: 'Intel Xeon family', memPerVcpu: 1.7, basePerVcpu: 0.020, sizes: [1], baseNet: 500, maxNet: 1000, regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'sa-east-1', 'us-west-1', 'cn-north-1'] },
  { name: 't2', category: 'gp', cpu: 'Intel Xeon family', memPerVcpu: 4, basePerVcpu: 0.0464, sizes: SIZES_T, baseNet: 500, maxNet: 1500 },
  { name: 't3', category: 'gp', cpu: CPU.skylake, memPerVcpu: 4, basePerVcpu: 0.0416, sizes: SIZES_T, baseNet: 1000, maxNet: 5000 },
  { name: 't3a', category: 'gp', cpu: 'AMD EPYC 7571 (Naples)', memPerVcpu: 4, basePerVcpu: 0.0376, sizes: SIZES_T, baseNet: 1000, maxNet: 5000 },
  { name: 't4g', category: 'gp', cpu: CPU.graviton2, memPerVcpu: 4, basePerVcpu: 0.0336, sizes: SIZES_T, baseNet: 1000, maxNet: 5000 },

  // ── Compute Optimized ───────────────────────────────────────────────────
  { name: 'c1', category: 'co', cpu: 'Intel Xeon E5410 (Harpertown)', memPerVcpu: 1.7, basePerVcpu: 0.063, sizes: [2, 8], baseNet: 500, maxNet: 1000, regions: ['us-east-1', 'us-west-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'sa-east-1'] },
  { name: 'c3', category: 'co', cpu: 'Intel Xeon E5-2680 v2 (Ivy Bridge)', memPerVcpu: 1.875, basePerVcpu: 0.0525, sizes: [2, 4, 8, 16, 32], baseNet: 1000, maxNet: 10000, regions: ['us-east-1', 'us-west-1', 'us-west-2', 'eu-west-1', 'eu-central-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'sa-east-1', 'cn-north-1'] },
  { name: 'c4', category: 'co', cpu: 'Intel Xeon E5-2666 v3 (Haswell)', memPerVcpu: 1.875, basePerVcpu: 0.05, sizes: [2, 4, 8, 16, 36], baseNet: 750, maxNet: 10000 },
  { name: 'c5', category: 'co', cpu: CPU.skylake, memPerVcpu: 2, basePerVcpu: 0.0425, sizes: [2, 4, 8, 16, 36, 48, 72, 96], baseNet: 10000, maxNet: 25000 },
  { name: 'c5a', category: 'co', cpu: 'AMD EPYC 7R32 (Rome)', memPerVcpu: 2, basePerVcpu: 0.0385, sizes: [2, 4, 8, 16, 24, 48, 96], baseNet: 10000, maxNet: 20000 },
  { name: 'c5ad', category: 'co', cpu: 'AMD EPYC 7R32 (Rome)', memPerVcpu: 2, basePerVcpu: 0.0432, sizes: [2, 4, 8, 16, 24, 48], baseNet: 10000, maxNet: 20000 },
  { name: 'c5d', category: 'co', cpu: CPU.skylake, memPerVcpu: 2, basePerVcpu: 0.048, sizes: [2, 4, 8, 16, 36, 48, 72, 96], baseNet: 10000, maxNet: 25000 },
  { name: 'c5n', category: 'co', cpu: CPU.skylake, memPerVcpu: 2.625, basePerVcpu: 0.0540, sizes: [2, 4, 8, 16, 36, 72], baseNet: 25000, maxNet: 100000 },
  { name: 'c6a', category: 'co', cpu: 'AMD EPYC 7R13 (Milan)', memPerVcpu: 2, basePerVcpu: 0.0383, sizes: [2, 4, 8, 16, 24, 32, 48, 64, 96, 128, 192], baseNet: 12500, maxNet: 50000 },
  { name: 'c6g', category: 'co', cpu: CPU.graviton2, memPerVcpu: 2, basePerVcpu: 0.034, sizes: [1, 2, 4, 8, 16, 32, 48, 64], baseNet: 10000, maxNet: 25000 },
  { name: 'c6gd', category: 'co', cpu: CPU.graviton2, memPerVcpu: 2, basePerVcpu: 0.0384, sizes: [1, 2, 4, 8, 16, 32, 48, 64], baseNet: 10000, maxNet: 25000 },
  { name: 'c6gn', category: 'co', cpu: CPU.graviton2, memPerVcpu: 2, basePerVcpu: 0.0432, sizes: [1, 2, 4, 8, 16, 32, 48, 64], baseNet: 25000, maxNet: 100000 },
  { name: 'c6i', category: 'co', cpu: CPU.ice, memPerVcpu: 2, basePerVcpu: 0.0425, sizes: SIZES_BIG, baseNet: 12500, maxNet: 50000 },
  { name: 'c6id', category: 'co', cpu: CPU.ice, memPerVcpu: 2, basePerVcpu: 0.0509, sizes: [2, 4, 8, 16, 24, 32, 48, 64, 96, 128], baseNet: 12500, maxNet: 50000 },
  { name: 'c6in', category: 'co', cpu: CPU.ice, memPerVcpu: 2, basePerVcpu: 0.0676, sizes: [2, 4, 8, 16, 24, 32, 48, 64, 96, 128], baseNet: 25000, maxNet: 200000 },
  { name: 'c7a', category: 'co', cpu: CPU.amdGenoa, memPerVcpu: 2, basePerVcpu: 0.0458, sizes: SIZES_BIG, baseNet: 12500, maxNet: 50000 },
  { name: 'c7g', category: 'co', cpu: CPU.graviton3, memPerVcpu: 2, basePerVcpu: 0.0363, sizes: [1, 2, 4, 8, 16, 32, 48, 64], baseNet: 12500, maxNet: 30000 },
  { name: 'c7gd', category: 'co', cpu: CPU.graviton3, memPerVcpu: 2, basePerVcpu: 0.0408, sizes: [1, 2, 4, 8, 16, 32, 48, 64], baseNet: 12500, maxNet: 30000 },
  { name: 'c7gn', category: 'co', cpu: CPU.graviton3, memPerVcpu: 2, basePerVcpu: 0.0577, sizes: [1, 2, 4, 8, 16, 32, 48, 64], baseNet: 25000, maxNet: 200000 },
  { name: 'c7i', category: 'co', cpu: CPU.sapphire, memPerVcpu: 2, basePerVcpu: 0.0425, sizes: SIZES_BIG, baseNet: 12500, maxNet: 50000 },
  { name: 'c7i-flex', category: 'co', cpu: CPU.sapphire, memPerVcpu: 2, basePerVcpu: 0.0404, sizes: [2, 4, 8, 16], baseNet: 12500, maxNet: 12500 },
  { name: 'c8a', category: 'co', cpu: CPU.amdTurin, memPerVcpu: 2, basePerVcpu: 0.048, sizes: SIZES_BIG, baseNet: 12500, maxNet: 50000 },
  { name: 'c8g', category: 'co', cpu: CPU.graviton4, memPerVcpu: 2, basePerVcpu: 0.038, sizes: [1, 2, 4, 8, 16, 24, 32, 48], baseNet: 12500, maxNet: 50000 },
  { name: 'c8gb', category: 'co', cpu: CPU.graviton4, memPerVcpu: 2, basePerVcpu: 0.042, sizes: [2, 4, 8, 16, 24, 32, 48], baseNet: 12500, maxNet: 50000 },
  { name: 'c8gd', category: 'co', cpu: CPU.graviton4, memPerVcpu: 2, basePerVcpu: 0.0454, sizes: [2, 4, 8, 16, 24, 32, 48], baseNet: 12500, maxNet: 50000 },
  { name: 'c8gn', category: 'co', cpu: CPU.graviton4, memPerVcpu: 2, basePerVcpu: 0.0606, sizes: [2, 4, 8, 16, 24, 32, 48], baseNet: 25000, maxNet: 200000 },
  { name: 'c8i', category: 'co', cpu: CPU.granite, memPerVcpu: 2, basePerVcpu: 0.046, sizes: SIZES_BIG, baseNet: 12500, maxNet: 100000 },
  { name: 'c8id', category: 'co', cpu: CPU.granite, memPerVcpu: 2, basePerVcpu: 0.055, sizes: SIZES_BIG, baseNet: 12500, maxNet: 100000 },
  { name: 'c8i-flex', category: 'co', cpu: CPU.granite, memPerVcpu: 2, basePerVcpu: 0.043, sizes: [2, 4, 8, 16], baseNet: 12500, maxNet: 12500 },
  { name: 'c8in', category: 'co', cpu: CPU.granite, memPerVcpu: 2, basePerVcpu: 0.069, sizes: SIZES_BIG, baseNet: 25000, maxNet: 200000 },
  { name: 'c8ine', category: 'co', cpu: CPU.granite, memPerVcpu: 2, basePerVcpu: 0.090, sizes: SIZES_BIG, baseNet: 50000, maxNet: 400000 },
  { name: 'c8ib', category: 'co', cpu: CPU.granite, memPerVcpu: 2, basePerVcpu: 0.053, sizes: SIZES_BIG, baseNet: 12500, maxNet: 100000, storMbps: 8000 },

  // ── Memory Optimized ────────────────────────────────────────────────────
  { name: 'r3', category: 'mo', cpu: 'Intel Xeon E5-2670 v2 (Ivy Bridge)', memPerVcpu: 7.625, basePerVcpu: 0.0824, sizes: [2, 4, 8, 16, 32], baseNet: 1000, maxNet: 10000, regions: ['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'eu-west-1', 'eu-central-1', 'ap-south-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2', 'sa-east-1', 'cn-north-1'] },
  { name: 'r4', category: 'mo', cpu: CPU.broadwell, memPerVcpu: 7.625, basePerVcpu: 0.0665, sizes: [2, 4, 8, 16, 32, 64], baseNet: 750, maxNet: 25000 },
  { name: 'r5', category: 'mo', cpu: CPU.skylake, memPerVcpu: 8, basePerVcpu: 0.063, sizes: [2, 4, 8, 16, 24, 48, 96], baseNet: 750, maxNet: 25000 },
  { name: 'r5a', category: 'mo', cpu: 'AMD EPYC 7571 (Naples)', memPerVcpu: 8, basePerVcpu: 0.0566, sizes: [2, 4, 8, 16, 24, 48, 96], baseNet: 750, maxNet: 20000 },
  { name: 'r5ad', category: 'mo', cpu: 'AMD EPYC 7571 (Naples)', memPerVcpu: 8, basePerVcpu: 0.0668, sizes: [2, 4, 8, 16, 24, 48], baseNet: 750, maxNet: 20000 },
  { name: 'r5b', category: 'mo', cpu: CPU.cascade, memPerVcpu: 8, basePerVcpu: 0.0744, sizes: [2, 4, 8, 16, 24, 48, 96], baseNet: 12500, maxNet: 25000 },
  { name: 'r5d', category: 'mo', cpu: CPU.skylake, memPerVcpu: 8, basePerVcpu: 0.072, sizes: [2, 4, 8, 16, 24, 48, 96], baseNet: 750, maxNet: 25000 },
  { name: 'r5dn', category: 'mo', cpu: CPU.cascade, memPerVcpu: 8, basePerVcpu: 0.0892, sizes: [2, 4, 8, 16, 24, 48, 96], baseNet: 25000, maxNet: 100000 },
  { name: 'r5n', category: 'mo', cpu: CPU.cascade, memPerVcpu: 8, basePerVcpu: 0.0794, sizes: [2, 4, 8, 16, 24, 48, 96], baseNet: 25000, maxNet: 100000 },
  { name: 'r6a', category: 'mo', cpu: 'AMD EPYC 7R13 (Milan)', memPerVcpu: 8, basePerVcpu: 0.0567, sizes: [2, 4, 8, 16, 24, 32, 48, 64, 96, 128, 192], baseNet: 12500, maxNet: 50000 },
  { name: 'r6g', category: 'mo', cpu: CPU.graviton2, memPerVcpu: 8, basePerVcpu: 0.0504, sizes: [1, 2, 4, 8, 16, 32, 48, 64], baseNet: 10000, maxNet: 25000 },
  { name: 'r6gd', category: 'mo', cpu: CPU.graviton2, memPerVcpu: 8, basePerVcpu: 0.0576, sizes: [1, 2, 4, 8, 16, 32, 48, 64], baseNet: 10000, maxNet: 25000 },
  { name: 'r6i', category: 'mo', cpu: CPU.ice, memPerVcpu: 8, basePerVcpu: 0.063, sizes: SIZES_BIG, baseNet: 12500, maxNet: 50000 },
  { name: 'r6id', category: 'mo', cpu: CPU.ice, memPerVcpu: 8, basePerVcpu: 0.0756, sizes: [2, 4, 8, 16, 24, 32, 48, 64, 96, 128], baseNet: 12500, maxNet: 50000 },
  { name: 'r6idn', category: 'mo', cpu: CPU.ice, memPerVcpu: 8, basePerVcpu: 0.1013, sizes: [2, 4, 8, 16, 24, 32, 48, 64, 96, 128], baseNet: 25000, maxNet: 200000 },
  { name: 'r6in', category: 'mo', cpu: CPU.ice, memPerVcpu: 8, basePerVcpu: 0.0892, sizes: [2, 4, 8, 16, 24, 32, 48, 64, 96, 128], baseNet: 25000, maxNet: 200000 },
  { name: 'r7a', category: 'mo', cpu: CPU.amdGenoa, memPerVcpu: 8, basePerVcpu: 0.0681, sizes: SIZES_BIG, baseNet: 12500, maxNet: 50000 },
  { name: 'r7g', category: 'mo', cpu: CPU.graviton3, memPerVcpu: 8, basePerVcpu: 0.0535, sizes: [1, 2, 4, 8, 16, 32, 48, 64], baseNet: 12500, maxNet: 30000 },
  { name: 'r7gd', category: 'mo', cpu: CPU.graviton3, memPerVcpu: 8, basePerVcpu: 0.0612, sizes: [1, 2, 4, 8, 16, 32, 48, 64], baseNet: 12500, maxNet: 30000 },
  { name: 'r7i', category: 'mo', cpu: CPU.sapphire, memPerVcpu: 8, basePerVcpu: 0.0661, sizes: SIZES_BIG, baseNet: 12500, maxNet: 50000 },
  { name: 'r7iz', category: 'mo', cpu: CPU.sapphireZ, memPerVcpu: 8, basePerVcpu: 0.0992, sizes: SIZES_MEM, baseNet: 12500, maxNet: 100000 },
  { name: 'r8a', category: 'mo', cpu: CPU.amdTurin, memPerVcpu: 8, basePerVcpu: 0.071, sizes: SIZES_BIG, baseNet: 12500, maxNet: 50000 },
  { name: 'r8g', category: 'mo', cpu: CPU.graviton4, memPerVcpu: 8, basePerVcpu: 0.056, sizes: [1, 2, 4, 8, 16, 24, 32, 48], baseNet: 12500, maxNet: 50000 },
  { name: 'r8gb', category: 'mo', cpu: CPU.graviton4, memPerVcpu: 8, basePerVcpu: 0.061, sizes: [2, 4, 8, 16, 24, 32, 48], baseNet: 12500, maxNet: 50000 },
  { name: 'r8gd', category: 'mo', cpu: CPU.graviton4, memPerVcpu: 8, basePerVcpu: 0.066, sizes: [2, 4, 8, 16, 24, 32, 48], baseNet: 12500, maxNet: 50000 },
  { name: 'r8gn', category: 'mo', cpu: CPU.graviton4, memPerVcpu: 8, basePerVcpu: 0.084, sizes: [2, 4, 8, 16, 24, 32, 48], baseNet: 25000, maxNet: 200000 },
  { name: 'r8i', category: 'mo', cpu: CPU.granite, memPerVcpu: 8, basePerVcpu: 0.069, sizes: SIZES_BIG, baseNet: 12500, maxNet: 100000 },
  { name: 'r8id', category: 'mo', cpu: CPU.granite, memPerVcpu: 8, basePerVcpu: 0.085, sizes: SIZES_BIG, baseNet: 12500, maxNet: 100000 },
  { name: 'r8i-flex', category: 'mo', cpu: CPU.granite, memPerVcpu: 8, basePerVcpu: 0.063, sizes: [2, 4, 8, 16], baseNet: 12500, maxNet: 12500 },
  { name: 'r8in', category: 'mo', cpu: CPU.granite, memPerVcpu: 8, basePerVcpu: 0.099, sizes: SIZES_BIG, baseNet: 25000, maxNet: 200000 },
  { name: 'r8idn', category: 'mo', cpu: CPU.granite, memPerVcpu: 8, basePerVcpu: 0.112, sizes: SIZES_BIG, baseNet: 25000, maxNet: 200000 },
  { name: 'r8ib', category: 'mo', cpu: CPU.granite, memPerVcpu: 8, basePerVcpu: 0.081, sizes: SIZES_BIG, baseNet: 12500, maxNet: 100000, storMbps: 8000 },
  { name: 'r8idb', category: 'mo', cpu: CPU.granite, memPerVcpu: 8, basePerVcpu: 0.095, sizes: SIZES_BIG, baseNet: 12500, maxNet: 100000, storMbps: 10000 },
  // U-series (SAP HANA — high memory)
  { name: 'u-3tb1', category: 'mo', cpu: CPU.cascade, memPerVcpu: 24.4, basePerVcpu: 0.122, sizes: [112], baseNet: 25000, maxNet: 50000 },
  { name: 'u-6tb1', category: 'mo', cpu: CPU.cascade, memPerVcpu: 27.4, basePerVcpu: 0.244, sizes: [224, 448], baseNet: 100000, maxNet: 100000 },
  { name: 'u7i-6tb', category: 'mo', cpu: CPU.sapphire, memPerVcpu: 27.4, basePerVcpu: 0.215, sizes: [224], baseNet: 100000, maxNet: 100000 },
  { name: 'u7i-8tb', category: 'mo', cpu: CPU.sapphire, memPerVcpu: 36.6, basePerVcpu: 0.276, sizes: [224], baseNet: 100000, maxNet: 100000 },
  { name: 'u7i-12tb', category: 'mo', cpu: CPU.sapphire, memPerVcpu: 54.8, basePerVcpu: 0.367, sizes: [224], baseNet: 100000, maxNet: 100000 },
  { name: 'u7in-16tb', category: 'mo', cpu: CPU.sapphire, memPerVcpu: 36.6, basePerVcpu: 0.379, sizes: [448], baseNet: 200000, maxNet: 200000 },
  { name: 'u7in-24tb', category: 'mo', cpu: CPU.sapphire, memPerVcpu: 54.8, basePerVcpu: 0.473, sizes: [448], baseNet: 200000, maxNet: 200000 },
  { name: 'u7in-32tb', category: 'mo', cpu: CPU.sapphire, memPerVcpu: 73.1, basePerVcpu: 0.566, sizes: [448], baseNet: 200000, maxNet: 200000 },
  // X-series (extreme memory)
  { name: 'x1', category: 'mo', cpu: 'Intel Xeon E7-8880 v3 (Haswell)', memPerVcpu: 15.25, basePerVcpu: 0.105, sizes: [64, 128], baseNet: 10000, maxNet: 25000 },
  { name: 'x1e', category: 'mo', cpu: 'Intel Xeon E7-8880 v3 (Haswell)', memPerVcpu: 30.5, basePerVcpu: 0.209, sizes: [4, 8, 16, 32, 64, 128], baseNet: 1000, maxNet: 25000 },
  { name: 'x2gd', category: 'mo', cpu: CPU.graviton2, memPerVcpu: 16, basePerVcpu: 0.0668, sizes: [1, 2, 4, 8, 16, 32, 48, 64], baseNet: 10000, maxNet: 25000 },
  { name: 'x2idn', category: 'mo', cpu: CPU.cascade, memPerVcpu: 16, basePerVcpu: 0.1042, sizes: [16, 24, 32], baseNet: 50000, maxNet: 100000 },
  { name: 'x2iedn', category: 'mo', cpu: CPU.cascade, memPerVcpu: 32, basePerVcpu: 0.2084, sizes: [1, 2, 4, 8, 16, 24, 32], baseNet: 12500, maxNet: 100000 },
  { name: 'x2iezn', category: 'mo', cpu: CPU.cascadeZ, memPerVcpu: 32, basePerVcpu: 0.2502, sizes: [2, 4, 6, 8, 12], baseNet: 12500, maxNet: 100000 },
  { name: 'x8g', category: 'mo', cpu: CPU.graviton4, memPerVcpu: 16, basePerVcpu: 0.105, sizes: [1, 2, 4, 8, 12, 16, 24, 48], baseNet: 12500, maxNet: 50000 },
  { name: 'x8aedz', category: 'mo', cpu: CPU.amdTurin, memPerVcpu: 32, basePerVcpu: 0.260, sizes: [4, 8, 16, 32, 48, 96], baseNet: 25000, maxNet: 100000 },
  { name: 'x8i', category: 'mo', cpu: CPU.granite, memPerVcpu: 16, basePerVcpu: 0.110, sizes: [4, 8, 16, 32, 48, 96, 128, 192], baseNet: 12500, maxNet: 100000 },
  { name: 'z1d', category: 'mo', cpu: CPU.cascadeZ, memPerVcpu: 8, basePerVcpu: 0.0744, sizes: [2, 3, 6, 12], baseNet: 10000, maxNet: 25000 },

  // ── Storage Optimized ───────────────────────────────────────────────────
  { name: 'd2', category: 'so', cpu: 'Intel Xeon E5-2676 v3 (Haswell)', memPerVcpu: 7.625, basePerVcpu: 0.165, sizes: [4, 8, 16, 36], baseNet: 1000, maxNet: 10000, storMbps: 3500 },
  { name: 'd3', category: 'so', cpu: CPU.cascade, memPerVcpu: 8, basePerVcpu: 0.0998, sizes: [4, 8, 16, 32], baseNet: 15000, maxNet: 25000, storMbps: 4500 },
  { name: 'd3en', category: 'so', cpu: CPU.cascade, memPerVcpu: 4, basePerVcpu: 0.1326, sizes: [2, 4, 8, 12], baseNet: 25000, maxNet: 75000, storMbps: 6000 },
  { name: 'h1', category: 'so', cpu: CPU.broadwell, memPerVcpu: 4, basePerVcpu: 0.117, sizes: [4, 8, 16, 32], baseNet: 10000, maxNet: 25000, storMbps: 4000 },
  { name: 'i2', category: 'so', cpu: 'Intel Xeon E5-2670 v2 (Ivy Bridge)', memPerVcpu: 7.625, basePerVcpu: 0.213, sizes: [2, 4, 8, 16, 32], baseNet: 1000, maxNet: 10000, storMbps: 4000 },
  { name: 'i3', category: 'so', cpu: CPU.broadwell, memPerVcpu: 7.625, basePerVcpu: 0.078, sizes: [2, 4, 8, 16, 32, 64], baseNet: 750, maxNet: 25000, storMbps: 4000 },
  { name: 'i3en', category: 'so', cpu: CPU.skylake, memPerVcpu: 8, basePerVcpu: 0.1130, sizes: [2, 3, 6, 12, 24, 48], baseNet: 25000, maxNet: 100000, storMbps: 6000 },
  { name: 'i4g', category: 'so', cpu: CPU.graviton2, memPerVcpu: 4, basePerVcpu: 0.0858, sizes: [1, 2, 4, 8, 16, 32, 64], baseNet: 10000, maxNet: 25000, storMbps: 8000 },
  { name: 'i4i', category: 'so', cpu: CPU.ice, memPerVcpu: 8, basePerVcpu: 0.0858, sizes: [2, 4, 8, 16, 24, 32, 64, 128], baseNet: 10000, maxNet: 75000, storMbps: 9000 },
  { name: 'i7i', category: 'so', cpu: CPU.sapphire, memPerVcpu: 6.0, basePerVcpu: 0.117, sizes: [2, 4, 8, 16, 24, 32, 48, 64], baseNet: 12500, maxNet: 100000, storMbps: 14000 },
  { name: 'i7ie', category: 'so', cpu: CPU.sapphire, memPerVcpu: 7.75, basePerVcpu: 0.139, sizes: [2, 3, 6, 12, 18, 24, 36, 48], baseNet: 25000, maxNet: 100000, storMbps: 16000 },
  { name: 'i8g', category: 'so', cpu: CPU.graviton4, memPerVcpu: 6, basePerVcpu: 0.114, sizes: [1, 2, 4, 8, 12, 16, 24, 48], baseNet: 12500, maxNet: 100000, storMbps: 14000 },
  { name: 'i8ge', category: 'so', cpu: CPU.graviton4, memPerVcpu: 8, basePerVcpu: 0.137, sizes: [2, 4, 8, 12, 24, 48], baseNet: 25000, maxNet: 100000, storMbps: 16000 },
  { name: 'im4gn', category: 'so', cpu: CPU.graviton2, memPerVcpu: 4, basePerVcpu: 0.0993, sizes: [2, 4, 8, 16, 32, 64], baseNet: 25000, maxNet: 100000, storMbps: 9000 },
  { name: 'is4gen', category: 'so', cpu: CPU.graviton2, memPerVcpu: 6, basePerVcpu: 0.1129, sizes: [2, 4, 8, 16, 32], baseNet: 10000, maxNet: 50000, storMbps: 9000 },
  { name: 'i3p', category: 'so', cpu: CPU.broadwell, memPerVcpu: 7.625, basePerVcpu: 0.082, sizes: [16], baseNet: 25000, maxNet: 25000, storMbps: 4000, regions: ['us-gov-west-1'] },

  // ── Accelerated Computing ───────────────────────────────────────────────
  { name: 'dl1', category: 'ac', cpu: CPU.cascade, memPerVcpu: 9.5, basePerVcpu: 0.413, sizes: [96], baseNet: 100000, maxNet: 400000, accelerator: 'Habana Gaudi' },
  { name: 'dl2q', category: 'ac', cpu: CPU.ice, memPerVcpu: 6, basePerVcpu: 0.42, sizes: [96], baseNet: 100000, maxNet: 100000, accelerator: 'Qualcomm AI 100' },
  { name: 'f1', category: 'ac', cpu: CPU.broadwell, memPerVcpu: 7.625, basePerVcpu: 0.206, sizes: [8, 16, 64], baseNet: 10000, maxNet: 25000, accelerator: 'Xilinx UltraScale+ VU9P' },
  { name: 'f2', category: 'ac', cpu: CPU.sapphire, memPerVcpu: 8, basePerVcpu: 0.295, sizes: [12, 48], baseNet: 12500, maxNet: 100000, accelerator: 'AMD Virtex UltraScale+ HBM' },
  { name: 'g3', category: 'ac', cpu: CPU.broadwell, memPerVcpu: 7.625, basePerVcpu: 0.190, sizes: [4, 8, 16], baseNet: 10000, maxNet: 25000, accelerator: 'NVIDIA Tesla M60' },
  { name: 'g3s', category: 'ac', cpu: CPU.broadwell, memPerVcpu: 7.625, basePerVcpu: 0.190, sizes: [4], baseNet: 10000, maxNet: 10000, accelerator: 'NVIDIA Tesla M60' },
  { name: 'g4ad', category: 'ac', cpu: CPU.amdRome, memPerVcpu: 4, basePerVcpu: 0.0973, sizes: [4, 8, 16, 32, 48], baseNet: 10000, maxNet: 25000, accelerator: 'AMD Radeon Pro V520' },
  { name: 'g4dn', category: 'ac', cpu: CPU.cascade, memPerVcpu: 4, basePerVcpu: 0.131, sizes: [4, 8, 16, 32, 48, 64, 96], baseNet: 25000, maxNet: 100000, accelerator: 'NVIDIA Tesla T4' },
  { name: 'g5', category: 'ac', cpu: CPU.amdMilan, memPerVcpu: 4, basePerVcpu: 0.252, sizes: [4, 8, 16, 24, 32, 48, 64, 96, 192], baseNet: 10000, maxNet: 100000, accelerator: 'NVIDIA A10G' },
  { name: 'g5g', category: 'ac', cpu: CPU.graviton2, memPerVcpu: 4, basePerVcpu: 0.107, sizes: [4, 8, 16, 32, 64], baseNet: 10000, maxNet: 25000, accelerator: 'NVIDIA T4G' },
  { name: 'g6', category: 'ac', cpu: CPU.sapphire, memPerVcpu: 4, basePerVcpu: 0.211, sizes: [4, 8, 16, 24, 32, 48, 64, 96, 192], baseNet: 10000, maxNet: 100000, accelerator: 'NVIDIA L4' },
  { name: 'g6e', category: 'ac', cpu: CPU.sapphire, memPerVcpu: 8, basePerVcpu: 0.452, sizes: [4, 8, 16, 24, 32, 48, 96, 192], baseNet: 25000, maxNet: 400000, accelerator: 'NVIDIA L40S' },
  { name: 'g6f', category: 'ac', cpu: CPU.sapphire, memPerVcpu: 4, basePerVcpu: 0.180, sizes: [4, 8, 16], baseNet: 10000, maxNet: 25000, accelerator: 'NVIDIA L4 (Fractional)' },
  { name: 'gr6', category: 'ac', cpu: CPU.graviton3, memPerVcpu: 8, basePerVcpu: 0.232, sizes: [4, 8, 16, 24, 48], baseNet: 12500, maxNet: 30000, accelerator: 'NVIDIA L4' },
  { name: 'gr6f', category: 'ac', cpu: CPU.graviton3, memPerVcpu: 8, basePerVcpu: 0.195, sizes: [4, 8], baseNet: 12500, maxNet: 12500, accelerator: 'NVIDIA L4 (Fractional)' },
  { name: 'g7e', category: 'ac', cpu: CPU.sapphire, memPerVcpu: 8, basePerVcpu: 0.502, sizes: [4, 8, 16, 24, 32, 48], baseNet: 25000, maxNet: 400000, accelerator: 'NVIDIA L40S Gen2' },
  { name: 'inf1', category: 'ac', cpu: CPU.skylake, memPerVcpu: 2, basePerVcpu: 0.0911, sizes: [4, 8, 16, 24], baseNet: 10000, maxNet: 100000, accelerator: 'AWS Inferentia' },
  { name: 'inf2', category: 'ac', cpu: 'AMD EPYC 7R13 (Milan)', memPerVcpu: 8, basePerVcpu: 0.190, sizes: [4, 8, 24, 48, 96, 192], baseNet: 25000, maxNet: 100000, accelerator: 'AWS Inferentia2' },
  { name: 'p2', category: 'ac', cpu: CPU.broadwell, memPerVcpu: 15.25, basePerVcpu: 0.225, sizes: [4, 16, 64], baseNet: 10000, maxNet: 25000, accelerator: 'NVIDIA Tesla K80' },
  { name: 'p3', category: 'ac', cpu: CPU.broadwell, memPerVcpu: 7.625, basePerVcpu: 0.383, sizes: [8, 32, 64], baseNet: 10000, maxNet: 25000, accelerator: 'NVIDIA Tesla V100' },
  { name: 'p3dn', category: 'ac', cpu: CPU.skylake, memPerVcpu: 8, basePerVcpu: 0.392, sizes: [96], baseNet: 100000, maxNet: 100000, accelerator: 'NVIDIA Tesla V100' },
  { name: 'p4d', category: 'ac', cpu: CPU.cascade, memPerVcpu: 12, basePerVcpu: 0.341, sizes: [96], baseNet: 400000, maxNet: 400000, accelerator: 'NVIDIA A100 40GB' },
  { name: 'p4de', category: 'ac', cpu: CPU.cascade, memPerVcpu: 12, basePerVcpu: 0.420, sizes: [96], baseNet: 400000, maxNet: 400000, accelerator: 'NVIDIA A100 80GB' },
  { name: 'p5', category: 'ac', cpu: CPU.sapphire, memPerVcpu: 16, basePerVcpu: 0.510, sizes: [192], baseNet: 3200000, maxNet: 3200000, accelerator: 'NVIDIA H100 80GB' },
  { name: 'p5e', category: 'ac', cpu: CPU.sapphire, memPerVcpu: 16, basePerVcpu: 0.510, sizes: [192], baseNet: 3200000, maxNet: 3200000, accelerator: 'NVIDIA H200 141GB' },
  { name: 'p5en', category: 'ac', cpu: CPU.sapphire, memPerVcpu: 16, basePerVcpu: 0.585, sizes: [192], baseNet: 3200000, maxNet: 3200000, accelerator: 'NVIDIA H200 141GB' },
  { name: 'p6-b200', category: 'ac', cpu: CPU.emerald, memPerVcpu: 16, basePerVcpu: 0.620, sizes: [192], baseNet: 3200000, maxNet: 3200000, accelerator: 'NVIDIA Blackwell B200' },
  { name: 'p6-b300', category: 'ac', cpu: CPU.emerald, memPerVcpu: 16, basePerVcpu: 0.700, sizes: [192], baseNet: 3200000, maxNet: 3200000, accelerator: 'NVIDIA Blackwell B300' },
  { name: 'trn1', category: 'ac', cpu: 'Intel Xeon Platinum 8488C (Sapphire Rapids, custom)', memPerVcpu: 8, basePerVcpu: 0.290, sizes: [8, 32, 128], baseNet: 25000, maxNet: 800000, accelerator: 'AWS Trainium' },
  { name: 'trn1n', category: 'ac', cpu: 'Intel Xeon Platinum 8488C (Sapphire Rapids, custom)', memPerVcpu: 8, basePerVcpu: 0.330, sizes: [32, 128], baseNet: 25000, maxNet: 1600000, accelerator: 'AWS Trainium' },
  { name: 'trn2', category: 'ac', cpu: CPU.sapphire, memPerVcpu: 16, basePerVcpu: 0.450, sizes: [192], baseNet: 3200000, maxNet: 3200000, accelerator: 'AWS Trainium2' },
  { name: 'vt1', category: 'ac', cpu: CPU.cascade, memPerVcpu: 4, basePerVcpu: 0.158, sizes: [3, 6, 24], baseNet: 25000, maxNet: 25000, accelerator: 'Xilinx Alveo U30' },

  // ── HPC ──────────────────────────────────────────────────────────────────
  // v2.17.4 — Spec-corrected from docs/aws/hpc.md. HPC families have a FIXED
  // memory regardless of vCPU count (the table shows the same GiB on every
  // row of a family), so we set `sizeMems` per size. `memPerVcpu` becomes a
  // soft fallback for any unlisted vCPU.
  // HPC SKU suffixes don't follow the standard `vcpu/4`-xlarge rule:
  // - hpc6a/hpc6id/hpc7a/hpc8a use `vcpu/2`-xlarge (e.g. hpc7a.96xlarge = 192 vCPU)
  // - hpc7g uses `vcpu/4`-xlarge (the standard convention)
  // Per-size `sizeLabel` overrides ensure the published SKU names match exactly.
  { name: 'hpc6a', category: 'hpc', cpu: 'AMD EPYC 7R13 (Milan, custom)', memPerVcpu: 4, basePerVcpu: 0.030, sizes: [96], baseNet: 100000, maxNet: 100000, sizeMems: { 96: 384 }, sizeLabel: { 96: '48xlarge' } },
  { name: 'hpc6id', category: 'hpc', cpu: CPU.ice, memPerVcpu: 16, basePerVcpu: 0.073, sizes: [64], baseNet: 200000, maxNet: 200000, sizeMems: { 64: 1024 }, sizeLabel: { 64: '32xlarge' } },
  { name: 'hpc7a', category: 'hpc', cpu: CPU.amdGenoa, memPerVcpu: 8, basePerVcpu: 0.075, sizes: [24, 48, 96, 192], baseNet: 300000, maxNet: 300000, sizeMems: { 24: 768, 48: 768, 96: 768, 192: 768 }, sizeLabel: { 24: '12xlarge', 48: '24xlarge', 96: '48xlarge', 192: '96xlarge' } },
  { name: 'hpc7g', category: 'hpc', cpu: CPU.graviton3e, memPerVcpu: 2, basePerVcpu: 0.034, sizes: [16, 32, 64], baseNet: 200000, maxNet: 200000, sizeMems: { 16: 128, 32: 128, 64: 128 } },
  { name: 'hpc8a', category: 'hpc', cpu: CPU.amdTurin, memPerVcpu: 4, basePerVcpu: 0.087, sizes: [192], baseNet: 300000, maxNet: 300000, sizeMems: { 192: 768 }, sizeLabel: { 192: '96xlarge' } },

  // ── Bare-metal Mac (Nitro v2/v5) — single .metal SKU per family ─────────
  // Specs from docs/aws/nitro-system.md + AWS Mac instance pages. Hourly
  // rates are the dedicated-host per-vCPU equivalents (24-hour min billing
  // is enforced at AWS, not modeled here).
  { name: 'mac1', category: 'gp', cpu: 'Intel Xeon W (Coffee Lake)', memPerVcpu: 2.67, basePerVcpu: 0, sizes: [12], baseNet: 10000, maxNet: 10000, sizeMems: { 12: 32 }, sizeLabel: { 12: 'metal' }, flatHourly: 1.083 },
  { name: 'mac2', category: 'gp', cpu: 'Apple M1', memPerVcpu: 2, basePerVcpu: 0, sizes: [8], baseNet: 10000, maxNet: 10000, sizeMems: { 8: 16 }, sizeLabel: { 8: 'metal' }, flatHourly: 0.6498 },
  { name: 'mac2-m1ultra', category: 'gp', cpu: 'Apple M1 Ultra', memPerVcpu: 6.4, basePerVcpu: 0, sizes: [20], baseNet: 10000, maxNet: 10000, sizeMems: { 20: 128 }, sizeLabel: { 20: 'metal' }, flatHourly: 1.4498 },
  { name: 'mac2-m2', category: 'gp', cpu: 'Apple M2', memPerVcpu: 3, basePerVcpu: 0, sizes: [8], baseNet: 10000, maxNet: 10000, sizeMems: { 8: 24 }, sizeLabel: { 8: 'metal' }, flatHourly: 0.7204 },
  { name: 'mac2-m2pro', category: 'gp', cpu: 'Apple M2 Pro', memPerVcpu: 2.67, basePerVcpu: 0, sizes: [12], baseNet: 10000, maxNet: 10000, sizeMems: { 12: 32 }, sizeLabel: { 12: 'metal' }, flatHourly: 0.8978 },
  { name: 'mac-m4', category: 'gp', cpu: 'Apple M4', memPerVcpu: 2.4, basePerVcpu: 0, sizes: [10], baseNet: 10000, maxNet: 10000, sizeMems: { 10: 24 }, sizeLabel: { 10: 'metal' }, flatHourly: 0.7204 },
  { name: 'mac-m4pro', category: 'gp', cpu: 'Apple M4 Pro', memPerVcpu: 3.43, basePerVcpu: 0, sizes: [14], baseNet: 10000, maxNet: 10000, sizeMems: { 14: 48 }, sizeLabel: { 14: 'metal' }, flatHourly: 0.9512 },
  { name: 'mac-m4max', category: 'gp', cpu: 'Apple M4 Max', memPerVcpu: 4, basePerVcpu: 0, sizes: [16], baseNet: 10000, maxNet: 10000, sizeMems: { 16: 64 }, sizeLabel: { 16: 'metal' }, flatHourly: 1.207 },

  // ── U7inh-32tb — additional U7 high-memory variant per nitro doc ────────
  { name: 'u7inh-32tb', category: 'mo', cpu: CPU.sapphire, memPerVcpu: 73.1, basePerVcpu: 0.566, sizes: [448], baseNet: 200000, maxNet: 200000 },
];

// ────────────────────────────────────────────────────────────────────────
// AWS size labels — vCPU count → label suffix. Special cases below.
// ────────────────────────────────────────────────────────────────────────
function sizeLabel(family: string, vcpu: number, override?: Record<number, string>): string {
  // v2.17.4 — Per-family explicit overrides (e.g. Mac instances → "metal").
  if (override && override[vcpu]) return override[vcpu];
  // T-family + a few others use the named scale
  if (family.startsWith('t')) {
    if (vcpu === 1) return 'micro';
    if (vcpu === 2) return 'small';
    if (vcpu === 4) return 'large';
    if (vcpu === 8) return '2xlarge';
  }
  // M1/M2/M3 legacy use general labels
  if (['m1', 'm2', 'm3'].includes(family)) {
    if (vcpu === 1) return 'small';
    if (vcpu === 2) return 'medium';
    if (vcpu === 4) return 'large';
    if (vcpu === 8) return 'xlarge';
  }
  // z1d / x1 / x1e / u-series irregular naming
  if (family === 'z1d') {
    return `${vcpu}xlarge`;
  }
  if (family.startsWith('u-') || family.startsWith('u7i') || family.startsWith('u7in')) {
    return 'metal';
  }
  if (vcpu === 2) return 'large';
  if (vcpu === 4) return 'xlarge';
  if (vcpu < 16) return `${vcpu / 4}xlarge`;
  return `${vcpu / 4}xlarge`;
}

// Network bandwidth at a given size (linear interpolation between base/max).
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
  return 15;
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
// Expand: region → family → size → UserVm rows.
//
// v2.17.3 — region-first traversal anchored on the AWS_REGION_FAMILIES table
// from `docs/aws-instance-regions.md`. A row is emitted IFF:
//   1. The region appears in the doc (REGION_MULT has a multiplier).
//   2. The family slug (lowercased) appears in AWS_REGION_FAMILIES[region].
//   3. We have a Family spec for that slug in FAMILIES.
//
// The legacy `Family.regions?: string[]` field is ignored — the doc table
// is authoritative. We keep the field on the interface for back-compat with
// any helper that might still read it, but `buildSeed` no longer uses it.
// ────────────────────────────────────────────────────────────────────────
const FAMILY_BY_NAME: Record<string, Family> = (() => {
  const m: Record<string, Family> = {};
  for (const f of FAMILIES) m[f.name.toLowerCase()] = f;
  return m;
})();

function buildSeed(): UserVm[] {
  const out: UserVm[] = [];
  for (const region of AWS_ALL_REGIONS) {
    const mult = REGION_MULT[region];
    if (mult === undefined) continue; // region missing a pricing multiplier
    const familySet = AWS_REGION_FAMILIES[region];
    if (!familySet) continue;
    for (const famSlug of familySet) {
      const f = FAMILY_BY_NAME[famSlug];
      // Doc lists some bare-metal / Mac families we haven't speced yet
      // (mac1, mac2, mac-m4*, etc.) — skip silently so the seed remains
      // exhaustive for the families we DO have specs for. The markdown
      // doc remains the source of truth for "what's possible."
      if (!f) continue;
      const category: VmCategory = categorizeAwsFamily(f.name);
      for (const vcpu of f.sizes) {
        // v2.17.4 — Honor per-size memory + label + flat-price overrides
        // so HPC (constant memory) + Mac (bare-metal .metal SKU + flat
        // dedicated-host rate) emit correct rows.
        const mem = f.sizeMems?.[vcpu] ?? vcpu * f.memPerVcpu;
        const sku = `${f.name}.${sizeLabel(f.name, vcpu, f.sizeLabel)}`;
        const baseHourly = f.flatHourly ?? f.basePerVcpu * vcpu;
        const network = netAt(f, vcpu);
        const stor = storMbpsAt(f, vcpu);
        const hourly = round4(baseHourly * mult);
        out.push({
          vmSizeName: sku,
          vmGeneration: f.name,
          series: f.name.split(/[0-9]/)[0] || f.name,
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
          riOneYrHourlyUsd: round4(hourly * RI_1Y),
          riThreeYrHourlyUsd: round4(hourly * RI_3Y),
          networkNicCount: nicCount(f, vcpu),
          remoteStorageMbpsPremium: stor || Math.min(4000, Math.round(vcpu * 26)),
          acceleratorType: f.accelerator ?? 'None',
        });
      }
    }
  }
  return out;
}

export const AWS_M_SERIES_ANALOG_SEED: UserVm[] = buildSeed();
