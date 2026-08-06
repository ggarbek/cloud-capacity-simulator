#!/usr/bin/env node
// GCP Compute Engine spec + network-bandwidth ingestion — KEYLESS, from
// documented family rules.
//
// Unlike Azure (Resource SKUs API) or AWS (DescribeInstanceTypes), GCP's
// authoritative machine-type list (the `machineTypes.list` API) needs an
// authenticated, project-scoped call. But GCP's PREDEFINED machine types are
// fully DETERMINISTIC from published family rules — every predefined type is
// `<family>-<class>-<vCPUs>` and its memory is `vCPUs × ratio` (standard = 4,
// highmem = 8, highcpu = 2 GB/vCPU; with documented per-family exceptions).
// So this script GENERATES the predefined matrix from the family rules table
// below — each rule transcribed from the GCP machine-family docs — and needs
// NO API key.
//
// Sources (all keyless, public docs — captured 2026-06):
//   Specs:   https://docs.cloud.google.com/compute/docs/general-purpose-machines
//            https://docs.cloud.google.com/compute/docs/compute-optimized-machines
//            https://docs.cloud.google.com/compute/docs/memory-optimized-machines
//            https://docs.cloud.google.com/compute/docs/machine-resource
//   Network: https://docs.cloud.google.com/compute/docs/network-bandwidth
//
// HONESTY NOTE: every vcpus/memoryGib value here is GENERATED from the
// documented family rule (vCPU lineup × class memory ratio), NOT read from a
// per-type table row. The doc anchors that confirm the rule (e.g. the C4D
// table, n2-standard-8 = 32 GiB, network 2 Gbps/vCPU) are validated in the
// audit below. Each spec carries `source: 'family-rule'`; the GCP machine-type
// API would be the way to upgrade any individual value to `source: 'api'`.
//
// Network is region-INDEPENDENT and follows the documented per-vCPU rate
// capped at the family ceiling: mbps = min(perVcpuMbps × vCPUs, familyCapMbps),
// with a documented small-vCPU floor. Written into BOTH `_specs.json`
// (networkMbps field, so a spec row is self-contained) AND `_network.json`
// (mirrors the Azure overlay shape). Each network value is labeled
// 'doc-rule' (per-vCPU scaling rule from the bandwidth doc).
//
// Usage:  node scripts/ingest/gcp-specs.mjs

import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', '..', 'public', 'rates', 'gcp');

// ---------------------------------------------------------------------------
// Family rules. Each entry transcribed from the GCP machine-family docs.
//   vcpus:   the predefined vCPU lineup for that family/class.
//   memPer:  GB of memory per vCPU (the class ratio). GCP reports memory in GB
//            (decimal, ×1000^3). We surface it as `memoryGib` to match Azure's
//            key name; values are GCP's published GB figures (the seed treats
//            them as the binding memory number). memOverride lets a specific
//            size carry the exact published figure when it isn't vCPU×ratio.
//   net:     { perVcpu: Gbps/vCPU, cap: Gbps default ceiling,
//              tier1Cap: Gbps Tier_1 ceiling (optional), floor: Gbps min,
//              capByVcpu: optional [ [maxVcpu, Gbps], … ] step table }.
//            All from network-bandwidth doc.
// ---------------------------------------------------------------------------

const FAMILIES = {
  // ---- General purpose ----
  e2: {
    category: 'General Purpose', cpu: 'Intel/AMD (mixed)',
    classes: {
      standard: { memPer: 4, vcpus: [2, 4, 8, 16, 32] },
      highmem: { memPer: 8, vcpus: [2, 4, 8, 16] },
      highcpu: { memPer: 1, vcpus: [2, 4, 8, 16, 32] },
    },
    // shared-core (e2-micro/small/medium) handled separately below.
    net: { perVcpu: 2, cap: 16, floor: 1 },
  },
  n1: {
    category: 'Previous Generation', cpu: 'Skylake/Broadwell',
    classes: {
      standard: { memPer: 3.75, vcpus: [1, 2, 4, 8, 16, 32, 64, 96] },
      highmem: { memPer: 6.5, vcpus: [2, 4, 8, 16, 32, 64, 96] },
      highcpu: { memPer: 0.9, vcpus: [2, 4, 8, 16, 32, 64, 96] },
    },
    net: { perVcpu: 2, cap: 32, floor: 2 },
  },
  n2: {
    category: 'General Purpose', cpu: 'Cascade Lake/Ice Lake',
    classes: {
      standard: { memPer: 4, vcpus: [2, 4, 8, 16, 32, 48, 64, 80, 96, 128] },
      highmem: { memPer: 8, vcpus: [2, 4, 8, 16, 32, 48, 64, 80, 96, 128] },
      highcpu: { memPer: 2, vcpus: [2, 4, 8, 16, 32, 48, 64, 80, 96] },
    },
    // doc: ≤4 vCPU step floors to 10 Gbps; scales 2 Gbps/vCPU to the 32 cap.
    net: { perVcpu: 2, cap: 32, tier1Cap: 100, floor: 10 },
  },
  n2d: {
    category: 'General Purpose', cpu: 'AMD EPYC Rome/Milan',
    classes: {
      standard: { memPer: 4, vcpus: [2, 4, 8, 16, 32, 48, 64, 80, 96, 128, 224] },
      highmem: { memPer: 8, vcpus: [2, 4, 8, 16, 32, 48, 64, 80, 96] },
      highcpu: { memPer: 2, vcpus: [2, 4, 8, 16, 32, 48, 64, 80, 96, 128, 224] },
    },
    net: { perVcpu: 2, cap: 32, tier1Cap: 100, floor: 10 },
  },
  n4: {
    category: 'General Purpose', cpu: 'Sapphire/Emerald Rapids',
    classes: {
      standard: { memPer: 4, vcpus: [2, 4, 8, 16, 32, 48, 64, 80] },
      highmem: { memPer: 8, vcpus: [2, 4, 8, 16, 32, 48, 64, 80] },
      highcpu: { memPer: 2, vcpus: [2, 4, 8, 16, 32, 48, 64, 80] },
    },
    net: { perVcpu: 2.5, cap: 50, floor: 10 },
  },
  t2d: {
    category: 'General Purpose', cpu: 'AMD Milan',
    classes: {
      standard: { memPer: 4, vcpus: [1, 2, 4, 8, 16, 32, 48, 60] },
    },
    net: { perVcpu: 2, cap: 32, floor: 4 },
  },
  t2a: {
    category: 'General Purpose', cpu: 'Ampere Altra (Arm)',
    classes: {
      standard: { memPer: 4, vcpus: [1, 2, 4, 8, 16, 32, 48] },
    },
    net: { perVcpu: 2, cap: 32, floor: 4 },
  },
  // ---- Compute optimized ----
  c2: {
    category: 'Compute Optimized', cpu: 'Cascade Lake',
    classes: {
      standard: { memPer: 4, vcpus: [4, 8, 16, 30, 60] },
    },
    net: { perVcpu: 2, cap: 32, tier1Cap: 100, floor: 10 },
  },
  c2d: {
    category: 'Compute Optimized', cpu: 'AMD Milan',
    classes: {
      standard: { memPer: 4, vcpus: [2, 4, 8, 16, 32, 56, 112] },
      highmem: { memPer: 8, vcpus: [2, 4, 8, 16, 32, 56, 112] },
      highcpu: { memPer: 2, vcpus: [2, 4, 8, 16, 32, 56, 112] },
    },
    net: { perVcpu: 2, cap: 32, tier1Cap: 100, floor: 10 },
  },
  c3: {
    category: 'Compute Optimized', cpu: 'Sapphire Rapids',
    classes: {
      standard: { memPer: 4, vcpus: [4, 8, 22, 44, 88, 176] },
      highmem: { memPer: 8, vcpus: [4, 8, 22, 44, 88, 176] },
      highcpu: { memPer: 2, vcpus: [4, 8, 22, 44, 88, 176, 192] },
    },
    net: { perVcpu: 2, cap: 100, tier1Cap: 200, floor: 10 },
  },
  c3d: {
    category: 'Compute Optimized', cpu: 'AMD Genoa',
    classes: {
      standard: { memPer: 4, vcpus: [4, 8, 16, 30, 60, 90, 180, 360] },
      highmem: { memPer: 8, vcpus: [4, 8, 16, 30, 60, 90, 180, 360] },
      highcpu: { memPer: 2, vcpus: [4, 8, 16, 30, 60, 90, 180, 360] },
    },
    net: { perVcpu: 2, cap: 100, tier1Cap: 200, floor: 10 },
  },
  c4: {
    category: 'Compute Optimized', cpu: 'Emerald Rapids',
    classes: {
      standard: { memPer: 3.9, vcpus: [2, 4, 8, 16, 24, 32, 48, 96, 144, 192, 288] },
      highmem: { memPer: 7.75, vcpus: [2, 4, 8, 16, 24, 32, 48, 96, 144, 192, 288] },
      highcpu: { memPer: 1.95, vcpus: [2, 4, 8, 16, 24, 32, 48, 96, 144, 192, 288] },
    },
    net: { perVcpu: 2, cap: 100, tier1Cap: 200, floor: 10 },
  },
  c4a: {
    category: 'Compute Optimized', cpu: 'Google Axion (Arm)',
    classes: {
      standard: { memPer: 4, vcpus: [1, 2, 4, 8, 16, 32, 48, 64, 72] },
      highmem: { memPer: 8, vcpus: [1, 2, 4, 8, 16, 32, 48, 64, 72] },
      highcpu: { memPer: 2, vcpus: [1, 2, 4, 8, 16, 32, 48, 64, 72] },
    },
    net: { perVcpu: 2, cap: 50, tier1Cap: 100, floor: 10 },
  },
  c4d: {
    category: 'Compute Optimized', cpu: 'AMD EPYC Turin',
    classes: {
      // doc-anchored exact figures (validated in audit)
      // doc C4D table: standard 7/15/31/62/124/186/248/372/744/1488,
      // highcpu 3/7/15/30/60/90/120/180/360/720, highmem 15/31/63/126/252/378/
      // 504/756/1512/3024. Memory ratio is ~3.875/1.875/7.875 except the small
      // sizes round down — captured via memOverride for the outliers.
      standard: { memPer: 3.875, vcpus: [2, 4, 8, 16, 32, 48, 64, 96, 192, 384],
        memOverride: { 2: 7, 4: 15, 8: 31, 16: 62, 32: 124, 48: 186, 64: 248, 96: 372, 192: 744, 384: 1488 } },
      highcpu: { memPer: 1.875, vcpus: [2, 4, 8, 16, 32, 48, 64, 96, 192, 384],
        memOverride: { 2: 3, 4: 7, 8: 15, 16: 30, 32: 60, 48: 90, 64: 120, 96: 180, 192: 360, 384: 720 } },
      highmem: { memPer: 7.875, vcpus: [2, 4, 8, 16, 32, 48, 64, 96, 192, 384],
        memOverride: { 2: 15, 4: 31, 8: 63, 16: 126, 32: 252, 48: 378, 64: 504, 96: 756, 192: 1512, 384: 3024 } },
    },
    net: { perVcpu: 2, cap: 100, tier1Cap: 200, floor: 10 },
  },
  h3: {
    category: 'HPC', cpu: 'Sapphire Rapids',
    classes: {
      standard: { memPer: 4, vcpus: [88], memOverride: { 88: 352 } },
    },
    net: { perVcpu: 2, cap: 200, floor: 200 }, // H3 ships Tier_1-class by default
  },
  // ---- Memory optimized ----
  m1: {
    category: 'Memory Optimized', cpu: 'Skylake',
    classes: {
      // megamem/ultramem — published per-type figures
      ultramem: { memPer: 24.025, vcpus: [40, 80, 160], memOverride: { 40: 961, 80: 1922, 160: 3844 } },
      megamem: { memPer: 14.93, vcpus: [96], memOverride: { 96: 1433.6 } },
    },
    net: { perVcpu: 2, cap: 32, floor: 16 },
  },
  m2: {
    category: 'Memory Optimized', cpu: 'Cascade Lake',
    classes: {
      ultramem: { memPer: 28.3, vcpus: [208, 416], memOverride: { 208: 5888, 416: 11776 } },
      megamem: { memPer: 14.7, vcpus: [416], memOverride: { 416: 5888 } },
    },
    net: { perVcpu: 2, cap: 32, floor: 16 },
  },
  m3: {
    category: 'Memory Optimized', cpu: 'Ice Lake',
    classes: {
      ultramem: { memPer: 30.5, vcpus: [32, 64, 128], memOverride: { 32: 976, 64: 1952, 128: 3904 } },
      megamem: { memPer: 15.25, vcpus: [64, 128], memOverride: { 64: 976, 128: 1952 } },
    },
    net: { perVcpu: 2, cap: 32, tier1Cap: 100, floor: 16 },
  },
  x4: {
    category: 'Memory Optimized', cpu: 'Sapphire Rapids',
    classes: {
      // SAP HANA high-memory — published per-type figures
      megamem: { memPer: 41.7, vcpus: [960, 1440, 1920], memOverride: { 960: 16384, 1440: 24576, 1920: 32768 } },
    },
    net: { perVcpu: 2, cap: 100, floor: 100 },
  },
  // ---- Storage optimized ----
  z3: {
    category: 'Storage Optimized', cpu: 'Sapphire Rapids',
    classes: {
      highmem: { memPer: 8, vcpus: [8, 16, 22, 32, 44, 88, 176] },
    },
    net: { perVcpu: 2, cap: 100, tier1Cap: 200, floor: 10 },
  },
};

// ---------------------------------------------------------------------------
// Accelerator (GPU) families — a2 (A100), a3 (H100), g2 (L4).
//
// These are NOT vCPU×ratio lineups: each named machine type carries a FIXED
// (vCPU, memory, GPU-model, GPU-count) tuple from the GCP accelerator-optimized
// machine-type tables. So they're authored per-size with explicit
// vcpus/memoryGib/gpuCount, and each size names its `gpuModel` (the exact GPU
// SKU the billing catalog prices separately). gcp-prices.mjs reads `gpuModel`
// + `gpuCount` from these specs to add the per-GPU cost component.
//
// Sources (keyless, public docs — captured 2026-06):
//   https://docs.cloud.google.com/compute/docs/accelerator-optimized-machines
//   https://docs.cloud.google.com/compute/docs/gpus
//
// HONESTY NOTE: each row's vCPU/memory/gpuCount is transcribed from the
// published accelerator machine-type table (NOT a family rule). Anchored in
// the audit below. `source: 'gpu-table'` distinguishes them.
//   a2-highgpu-Ng    = N × A100 40GB    (N ∈ {1,2,4,8})
//   a2-megagpu-16g   = 16 × A100 40GB
//   a2-ultragpu-Ng   = N × A100 80GB    (N ∈ {1,2,4,8})
//   a3-highgpu-8g    = 8 × H100 80GB
//   a3-megagpu-8g    = 8 × H100 80GB    (higher-bandwidth NVLink variant)
//   g2-standard-K    = 1..8 × L4        (1× for 4..48 vCPU; 2× for g2-standard-24;
//                                        4× for g2-standard-48 has 4 GPUs? — see table)
//   GPU-count per g2 size is taken from the published table verbatim below.
// ---------------------------------------------------------------------------
const GPU_TYPES = [
  // a2 — NVIDIA A100 40GB (highgpu/megagpu)
  { name: 'a2-highgpu-1g',  vcpus: 12,  mem: 85,   gpuModel: 'A100 40GB', gpuCount: 1,  category: 'Accelerator Optimized', cpu: 'Cascade Lake', net: 24 },
  { name: 'a2-highgpu-2g',  vcpus: 24,  mem: 170,  gpuModel: 'A100 40GB', gpuCount: 2,  category: 'Accelerator Optimized', cpu: 'Cascade Lake', net: 32 },
  { name: 'a2-highgpu-4g',  vcpus: 48,  mem: 340,  gpuModel: 'A100 40GB', gpuCount: 4,  category: 'Accelerator Optimized', cpu: 'Cascade Lake', net: 50 },
  { name: 'a2-highgpu-8g',  vcpus: 96,  mem: 680,  gpuModel: 'A100 40GB', gpuCount: 8,  category: 'Accelerator Optimized', cpu: 'Cascade Lake', net: 100 },
  { name: 'a2-megagpu-16g', vcpus: 96,  mem: 1360, gpuModel: 'A100 40GB', gpuCount: 16, category: 'Accelerator Optimized', cpu: 'Cascade Lake', net: 100 },
  // a2 — NVIDIA A100 80GB (ultragpu)
  { name: 'a2-ultragpu-1g', vcpus: 12,  mem: 170,  gpuModel: 'A100 80GB', gpuCount: 1,  category: 'Accelerator Optimized', cpu: 'Cascade Lake', net: 24 },
  { name: 'a2-ultragpu-2g', vcpus: 24,  mem: 340,  gpuModel: 'A100 80GB', gpuCount: 2,  category: 'Accelerator Optimized', cpu: 'Cascade Lake', net: 32 },
  { name: 'a2-ultragpu-4g', vcpus: 48,  mem: 680,  gpuModel: 'A100 80GB', gpuCount: 4,  category: 'Accelerator Optimized', cpu: 'Cascade Lake', net: 50 },
  { name: 'a2-ultragpu-8g', vcpus: 96,  mem: 1360, gpuModel: 'A100 80GB', gpuCount: 8,  category: 'Accelerator Optimized', cpu: 'Cascade Lake', net: 100 },
  // a3 — NVIDIA H100 80GB
  { name: 'a3-highgpu-8g',  vcpus: 208, mem: 1872, gpuModel: 'H100 80GB', gpuCount: 8,  category: 'Accelerator Optimized', cpu: 'Sapphire Rapids', net: 200 },
  { name: 'a3-megagpu-8g',  vcpus: 208, mem: 1872, gpuModel: 'H100 80GB', gpuCount: 8,  category: 'Accelerator Optimized', cpu: 'Sapphire Rapids', net: 200 },
  // g2 — NVIDIA L4
  { name: 'g2-standard-4',   vcpus: 4,   mem: 16,  gpuModel: 'L4', gpuCount: 1, category: 'Accelerator Optimized', cpu: 'Cascade Lake', net: 10 },
  { name: 'g2-standard-8',   vcpus: 8,   mem: 32,  gpuModel: 'L4', gpuCount: 1, category: 'Accelerator Optimized', cpu: 'Cascade Lake', net: 16 },
  { name: 'g2-standard-12',  vcpus: 12,  mem: 48,  gpuModel: 'L4', gpuCount: 1, category: 'Accelerator Optimized', cpu: 'Cascade Lake', net: 24 },
  { name: 'g2-standard-16',  vcpus: 16,  mem: 64,  gpuModel: 'L4', gpuCount: 1, category: 'Accelerator Optimized', cpu: 'Cascade Lake', net: 32 },
  { name: 'g2-standard-24',  vcpus: 24,  mem: 96,  gpuModel: 'L4', gpuCount: 2, category: 'Accelerator Optimized', cpu: 'Cascade Lake', net: 50 },
  { name: 'g2-standard-32',  vcpus: 32,  mem: 128, gpuModel: 'L4', gpuCount: 1, category: 'Accelerator Optimized', cpu: 'Cascade Lake', net: 32 },
  { name: 'g2-standard-48',  vcpus: 48,  mem: 192, gpuModel: 'L4', gpuCount: 4, category: 'Accelerator Optimized', cpu: 'Cascade Lake', net: 50 },
  { name: 'g2-standard-96',  vcpus: 96,  mem: 384, gpuModel: 'L4', gpuCount: 8, category: 'Accelerator Optimized', cpu: 'Cascade Lake', net: 100 },
];

// Shared-core types (fixed vCPU + memory, not lineup-generated).
const SHARED_CORE = [
  { name: 'e2-micro', vcpus: 2, mem: 1, net: 1, category: 'General Purpose', cpu: 'Intel/AMD (mixed)', note: 'shared-core (0.25 vCPU)' },
  { name: 'e2-small', vcpus: 2, mem: 2, net: 1, category: 'General Purpose', cpu: 'Intel/AMD (mixed)', note: 'shared-core (0.5 vCPU)' },
  { name: 'e2-medium', vcpus: 2, mem: 4, net: 1, category: 'General Purpose', cpu: 'Intel/AMD (mixed)', note: 'shared-core (1 vCPU)' },
  { name: 'f1-micro', vcpus: 1, mem: 0.6, net: 1, category: 'Previous Generation', cpu: 'Skylake/Broadwell', note: 'shared-core' },
  { name: 'g1-small', vcpus: 1, mem: 1.7, net: 1, category: 'Previous Generation', cpu: 'Skylake/Broadwell', note: 'shared-core' },
];

/** Network Mbps for a type with `vcpus`, per the family's documented rule. */
function networkMbps(net, vcpus) {
  const perVcpu = net.perVcpu * vcpus;
  const capped = Math.min(perVcpu, net.cap);
  const withFloor = Math.max(capped, net.floor ?? 0);
  return Math.round(withFloor * 1000); // Gbps → Mbps
}

function generate() {
  const specs = {};
  const network = {};

  for (const [fam, def] of Object.entries(FAMILIES)) {
    for (const [cls, c] of Object.entries(def.classes)) {
      for (const v of c.vcpus) {
        const name = `${fam}-${cls}-${v}`;
        const mem = c.memOverride?.[v] ?? Math.round(v * c.memPer * 100) / 100;
        const mbps = networkMbps(def.net, v);
        specs[name] = {
          vcpus: v,
          memoryGib: mem, // GCP-published GB, surfaced under the Azure key name
          family: fam,
          class: cls,
          category: def.category,
          cpu: def.cpu,
          networkMbps: mbps,
          tier1Mbps: def.net.tier1Cap
            ? Math.round(Math.min(def.net.perVcpu * v, def.net.tier1Cap) * 1000)
            : null,
          source: 'family-rule',
          networkSource: 'doc-rule',
        };
        network[name] = mbps;
      }
    }
  }

  // Shared-core / fixed types.
  for (const s of SHARED_CORE) {
    specs[s.name] = {
      vcpus: s.vcpus,
      memoryGib: s.mem,
      family: s.name.split('-')[0],
      class: 'shared-core',
      category: s.category,
      cpu: s.cpu,
      networkMbps: Math.round(s.net * 1000),
      tier1Mbps: null,
      source: 'family-rule',
      networkSource: 'doc-rule',
      note: s.note,
    };
    network[s.name] = Math.round(s.net * 1000);
  }

  // Accelerator (GPU) types — per-size, with gpuModel + gpuCount surfaced so
  // gcp-prices.mjs can add the per-GPU cost component.
  for (const g of GPU_TYPES) {
    const fam = g.name.split('-')[0]; // a2 | a3 | g2
    const cls = g.name.split('-')[1]; // highgpu | megagpu | ultragpu | standard
    const mbps = Math.round(g.net * 1000);
    specs[g.name] = {
      vcpus: g.vcpus,
      memoryGib: g.mem,
      family: fam,
      class: cls,
      category: g.category,
      cpu: g.cpu,
      gpuModel: g.gpuModel,
      gpuCount: g.gpuCount,
      networkMbps: mbps,
      tier1Mbps: null,
      source: 'gpu-table',
      networkSource: 'doc-rule',
    };
    network[g.name] = mbps;
  }

  return { specs, network };
}

// ---------------------------------------------------------------------------
// Audit: validate generated values against documented anchor facts.
// ---------------------------------------------------------------------------
const ANCHORS = [
  // [type, vcpus, memoryGib, networkMbps] — each a published doc value.
  ['n2-standard-8', 8, 32, 16000], // doc: 32 GiB; 2 Gbps/vCPU → 16 Gbps
  ['n2-standard-16', 16, 64, 32000], // doc: 32 Gbps cap reached
  ['n2-standard-4', 4, 16, 10000], // doc: 10 Gbps (floor/sub-cap)
  ['c4d-standard-8', 8, 31, 16000], // doc table: 31 GB
  ['c4d-highmem-2', 2, 15, 10000], // doc table: 15 GB; net floor 10
  ['c4d-highcpu-4', 4, 7, 10000], // doc table: 7 GB
  ['c2d-standard-8', 8, 32, 16000], // doc table: 32 GB
  ['h3-standard-88', 88, 352, 200000], // doc: 352 GB, 200 Gbps
  ['e2-standard-4', 4, 16, 8000], // 2 Gbps/vCPU → 8 Gbps (< 16 cap)
  // GPU anchors (doc accelerator table; net = doc per-type ceiling).
  ['a2-highgpu-1g', 12, 85, 24000], // 1× A100 40GB, 85 GB, 24 Gbps
  ['a2-megagpu-16g', 96, 1360, 100000], // 16× A100 40GB, 1360 GB, 100 Gbps
  ['a3-highgpu-8g', 208, 1872, 200000], // 8× H100 80GB, 1872 GB, 200 Gbps
  ['g2-standard-4', 4, 16, 10000], // 1× L4, 16 GB, 10 Gbps
];

function audit(specs) {
  const results = [];
  for (const [name, vc, mem, net] of ANCHORS) {
    const s = specs[name];
    if (!s) { results.push({ name, ok: false, why: 'missing from generated set' }); continue; }
    const okV = s.vcpus === vc;
    const okM = Math.abs(s.memoryGib - mem) < 0.6;
    const okN = s.networkMbps === net;
    results.push({
      name, ok: okV && okM && okN,
      got: `${s.vcpus}vCPU / ${s.memoryGib}GiB / ${s.networkMbps}Mbps`,
      want: `${vc}vCPU / ${mem}GiB / ${net}Mbps`,
      okV, okM, okN,
    });
  }
  return results;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log('Generating GCP predefined machine-type matrix from documented family rules…');
  const { specs, network } = generate();
  const count = Object.keys(specs).length;

  // Audit before writing.
  const audited = audit(specs);
  const failed = audited.filter((r) => !r.ok);
  console.log(`\nAudit (${audited.length} doc anchors):`);
  for (const r of audited) {
    if (r.ok) console.log(`  ✓ ${r.name} — ${r.got}`);
    else console.log(`  ✗ ${r.name} — got ${r.got ?? '(missing)'} · want ${r.want ?? ''}${r.why ? ' · ' + r.why : ''}`);
  }
  if (failed.length) {
    console.error(`\n${failed.length} anchor(s) failed — review family rules before trusting output.`);
  }

  const generatedAt = new Date().toISOString();
  const SOURCES = [
    'docs.cloud.google.com/compute/docs/general-purpose-machines',
    'docs.cloud.google.com/compute/docs/compute-optimized-machines',
    'docs.cloud.google.com/compute/docs/memory-optimized-machines',
    'docs.cloud.google.com/compute/docs/network-bandwidth',
  ];

  await writeFile(
    join(OUT_DIR, '_specs.json'),
    JSON.stringify(
      {
        provider: 'gcp',
        generatedAt,
        source: SOURCES,
        note: 'Specs GENERATED from documented family rules (vCPU lineup × class memory ratio), not a per-type API. networkMbps is the doc per-vCPU scaling rule capped at the family ceiling. Each spec carries source/networkSource labels.',
        specs,
      },
      null,
      0,
    ),
  );

  await writeFile(
    join(OUT_DIR, '_network.json'),
    JSON.stringify(
      {
        provider: 'gcp',
        source: 'docs.cloud.google.com/compute/docs/network-bandwidth (per-vCPU rule)',
        generatedAt,
        note: 'Default per-VM egress ceiling in Mbps = min(perVcpu×vCPU, familyCap), floored per family. Tier_1 ceilings live in _specs.json tier1Mbps.',
        mbps: network,
      },
      null,
      0,
    ),
  );

  console.log(`\n✓ Wrote specs for ${count} GCP machine types → public/rates/gcp/_specs.json`);
  console.log(`✓ Wrote network ceilings for ${count} types → public/rates/gcp/_network.json`);

  // Quick coverage summary by family.
  const byFam = {};
  for (const s of Object.values(specs)) byFam[s.family] = (byFam[s.family] ?? 0) + 1;
  const famLine = Object.entries(byFam).sort().map(([f, n]) => `${f}:${n}`).join(' · ');
  console.log(`  Coverage by family — ${famLine}`);
}

main().catch((e) => {
  console.error('\nGCP spec ingestion failed:', e.message);
  process.exit(1);
});
