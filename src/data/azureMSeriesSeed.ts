/**
 * v2.9 (Phase B) — Azure M-Series native seed catalog.
 *
 * Sourced verbatim from Microsoft Learn's published spec pages (re-verified
 * 2026-05-31 against the live docs; see docs/azure/memory-optimized.md for the
 * captured source-of-truth tables + the Excel reference):
 *   - M-series:    learn.microsoft.com/azure/virtual-machines/sizes/memory-optimized/m-series
 *   - Mv2-series:  learn.microsoft.com/azure/virtual-machines/sizes/memory-optimized/mv2-series
 *   - Msv3 MM:     learn.microsoft.com/azure/virtual-machines/sizes/memory-optimized/msv3-mm-series
 *   - Msv3 HM:     learn.microsoft.com/azure/virtual-machines/sizes/memory-optimized/msv3-hm-series
 *   - Mdsv3 MM:    learn.microsoft.com/azure/virtual-machines/sizes/memory-optimized/mdsv3-mm-series
 *   - Mdsv3 HM:    learn.microsoft.com/azure/virtual-machines/sizes/memory-optimized/mdsv3-hm-series
 *   - Msv2 MM:     learn.microsoft.com/azure/virtual-machines/sizes/memory-optimized/msv2-mm-series
 *   - Mdsv2 MM:    learn.microsoft.com/azure/virtual-machines/sizes/memory-optimized/mdsv2-mm-series
 *   - Mbsv3:       learn.microsoft.com/azure/virtual-machines/sizes/memory-optimized/mbsv3-series
 *   - Mbdsv3:      learn.microsoft.com/azure/virtual-machines/sizes/memory-optimized/mbdsv3-series
 *   - Mdsv3 VHM:   learn.microsoft.com/azure/virtual-machines/sizes/memory-optimized/mdsv3-vhm-series
 *   - M-family index: learn.microsoft.com/azure/virtual-machines/sizes/memory-optimized/m-family
 *
 * v2.19.20 hygiene pass — COMPLETE M-family. Added Msv2-MM (7) + Mdsv2-MM (7)
 * Cascade Lake medium-memory sizes, Mbsv3 (8) + Mbdsv3 (11) storage-boosted
 * sizes, and the Mdsv3-VHM (3) 32 TB SAP HANA sizes — plus the v2.19.19
 * Mdsv3 MM/HM (12). Tiering is Microsoft's actual 3-tier model: MM ≤ 4 TiB ·
 * HM 4–16 TiB · VHM > 16 TiB. Compound slugs: MM Mv1 · MM Mv2 · MM Mv3 ·
 * HM Mv2 · HM Mv3 · VHM Mv3. 79 distinct M-family SKUs.
 *
 * ── Decoupling Doctrine note ─────────────────────────────────────────
 * Every byte in this file is vendor-published public information. The
 * doctrine's red line is INTERNAL proprietary data (real fleets, contract
 * pricing, internal SKU/generation codes, "our team's policy is X"). Azure
 * M-Series VM specs from Microsoft Learn are explicitly in the "Allowed in
 * seed" bucket of the project docs. User uploads
 * still merge/override on top — the seed is a first-run convenience, not a
 * lock-in. Delete a row from the VM Library and it stays gone.
 *
 * ── Pricing note ─────────────────────────────────────────────────────
 * Hourly rates are deliberately NOT seeded. Azure Retail Prices vary by
 * region, SKU variant (OS, software entitlement), and commitment level.
 * The user wires pricing via the VM Library upload (PAYG / 1y / 3y RI
 * columns) or — eventually — a live Retail Prices API refresh. Leaving
 * `hourlyUsd` undefined means the Finance / Insights surfaces show "—"
 * for revenue until the user provides their own rate sheet.
 */
import type { UserVm } from '../types';
import M_SERIES_RATES from './azureMSeriesSeedRates.json';

/** One region×SKU rate row in the generated live-rates JSON. */
type MSeriesRate = { payg: number; ri1y: number | null; ri3y: number | null };

// ────────────────────────────────────────────────────────────────────────
// Shared spec constants — keeps the per-size rows readable.
// ────────────────────────────────────────────────────────────────────────
const PROVIDER = 'Azure';
const FAMILY_M = 'M-series';
const REGION_DEFAULT = 'East US 2';

const CPU_HASWELL = 'Intel Xeon E7-8890 v3 (Haswell)';
const CPU_CASCADE = 'Intel Xeon Platinum 8280M (Cascade Lake)';
const CPU_CASCADE_8280 = 'Intel Xeon Platinum 8280 (Cascade Lake)';
const CPU_SKYLAKE = 'Intel Xeon Platinum 8180M (Skylake)';
const CPU_SAPPHIRE = 'Intel Xeon 4th Gen Scalable (Sapphire Rapids)';
const CPU_SAPPHIRE_8490H = 'Intel Xeon Platinum 8490H (Sapphire Rapids)';

// ────────────────────────────────────────────────────────────────────────
// Memory-class classifier — Microsoft's published MM/HM/VHM bands.
//   ≤ 1 TiB     → Medium Memory (MM)
//   1 – 4 TiB   → High Memory (HM)
//   > 4 TiB     → Very High Memory (VHM)
// Aligns with src/data/memoryCategories.json which the rest of the app reads.
// ────────────────────────────────────────────────────────────────────────
function memoryCategoryLabel(
  memoryGib: number,
): 'Medium Memory (MM)' | 'High Memory (HM)' | 'Very High Memory (VHM)' {
  // v2.19.20 — Realigned to Microsoft's ACTUAL published M-family taxonomy.
  // Microsoft DOES have three memory tiers — the catch is they're far apart:
  //   • Medium Memory (MM): Msv2/Mdsv2/Msv3/Mdsv3 "MM" + Mbsv3/Mbdsv3
  //       — 128 GiB … 4,096 GiB.
  //   • High Memory   (HM): Msv2 HM (Skylake) + Msv3/Mdsv3 "HM"
  //       — 5,696 GiB … 15,200 GiB.
  //   • Very High Memory (VHM): the Mdsv3 "VHM" series (Sapphire 8490H)
  //       — 23,088 GiB … 30,400 GiB (32 TB-class SAP HANA hosts).
  // Boundaries: MM ≤ 4 TiB; HM 4–16 TiB; VHM > 16 TiB. The 16 TiB cut keeps
  // the entire Msv3/Mdsv3 HM sub-series (tops at 15,200 GiB) in HM — it was a
  // mistake (v2.19.19) to drop VHM entirely; the real VHM band starts at the
  // 23 TB Mdsv3-VHM sizes. Compound slugs emitted: MM Mv1, MM Mv2, MM Mv3,
  // HM Mv2, HM Mv3, VHM Mv3.
  if (memoryGib > 16384) return 'Very High Memory (VHM)';
  if (memoryGib > 4096) return 'High Memory (HM)';
  return 'Medium Memory (MM)';
}

// ────────────────────────────────────────────────────────────────────────
// Per-family seed arrays. Inline to keep the page text immediately
// comparable to Microsoft Learn's tables — diff-friendly for future
// updates. Every row carries full spec dimensions; missing data is left
// undefined (parser-friendly back-compat behavior).
// ────────────────────────────────────────────────────────────────────────

/** Original M-series (Haswell + Cascade Lake). MM + HM band only. */
const M_SERIES_ORIGINAL: UserVm[] = [
  mkM('Standard_M8ms', 'Mv1', 8, 218.75, {
    local: { disks: 1, gib: 256, iops: 10_000, mbps: 100 },
    remote: { disks: 8, premium: { iops: 5_000, mbps: 125 } },
    network: { nics: 4, mbps: 2_000 },
    cpu: CPU_HASWELL,
  }),
  mkM('Standard_M16ms', 'Mv1', 16, 437.5, {
    local: { disks: 1, gib: 512, iops: 20_000, mbps: 200 },
    remote: { disks: 16, premium: { iops: 10_000, mbps: 250 } },
    network: { nics: 8, mbps: 4_000 },
    cpu: CPU_HASWELL,
  }),
  mkM('Standard_M32ts', 'Mv1', 32, 192, {
    local: { disks: 1, gib: 1_024, iops: 40_000, mbps: 400 },
    remote: { disks: 32, premium: { iops: 20_000, mbps: 500 } },
    network: { nics: 8, mbps: 8_000 },
    cpu: CPU_HASWELL,
  }),
  mkM('Standard_M32ls', 'Mv1', 32, 256, {
    local: { disks: 1, gib: 1_024, iops: 40_000, mbps: 400 },
    remote: { disks: 32, premium: { iops: 20_000, mbps: 500 } },
    network: { nics: 8, mbps: 8_000 },
    cpu: CPU_HASWELL,
  }),
  mkM('Standard_M32ms', 'Mv1', 32, 875, {
    local: { disks: 1, gib: 1_024, iops: 40_000, mbps: 400 },
    remote: { disks: 32, premium: { iops: 20_000, mbps: 500 } },
    network: { nics: 8, mbps: 8_000 },
    cpu: CPU_HASWELL,
  }),
  mkM('Standard_M64s', 'Mv1', 64, 1_024, {
    local: { disks: 1, gib: 2_048, iops: 80_000, mbps: 800 },
    remote: { disks: 64, premium: { iops: 40_000, mbps: 1_000 } },
    network: { nics: 8, mbps: 16_000 },
    cpu: CPU_HASWELL,
  }),
  mkM('Standard_M64ls', 'Mv1', 64, 512, {
    local: { disks: 1, gib: 2_048, iops: 80_000, mbps: 800 },
    remote: { disks: 64, premium: { iops: 40_000, mbps: 1_000 } },
    network: { nics: 8, mbps: 16_000 },
    cpu: CPU_HASWELL,
  }),
  mkM('Standard_M64ms', 'Mv1', 64, 1_792, {
    local: { disks: 1, gib: 2_048, iops: 80_000, mbps: 800 },
    remote: { disks: 64, premium: { iops: 40_000, mbps: 1_000 } },
    network: { nics: 8, mbps: 16_000 },
    cpu: CPU_HASWELL,
  }),
  mkM('Standard_M128s', 'Mv1', 128, 2_048, {
    local: { disks: 1, gib: 4_096, iops: 160_000, mbps: 1_600 },
    remote: { disks: 64, premium: { iops: 80_000, mbps: 2_000 } },
    network: { nics: 8, mbps: 30_000 },
    cpu: CPU_CASCADE,
  }),
  mkM('Standard_M128ms', 'Mv1', 128, 3_892, {
    local: { disks: 1, gib: 4_096, iops: 160_000, mbps: 1_600 },
    remote: { disks: 64, premium: { iops: 80_000, mbps: 2_000 } },
    network: { nics: 8, mbps: 30_000 },
    cpu: CPU_CASCADE,
  }),
  mkM('Standard_M64', 'Mv1', 64, 1_024, {
    local: { disks: 1, gib: 7_168, iops: 80_000, mbps: 800 },
    remote: { disks: 64, premium: { iops: 40_000, mbps: 1_000 } },
    network: { nics: 8, mbps: 16_000 },
    cpu: CPU_HASWELL,
  }),
  mkM('Standard_M64m', 'Mv1', 64, 1_792, {
    local: { disks: 1, gib: 7_168, iops: 80_000, mbps: 800 },
    remote: { disks: 64, premium: { iops: 40_000, mbps: 1_000 } },
    network: { nics: 8, mbps: 16_000 },
    cpu: CPU_HASWELL,
  }),
  mkM('Standard_M128', 'Mv1', 128, 2_048, {
    local: { disks: 1, gib: 14_336, iops: 250_000, mbps: 1_600 },
    remote: { disks: 64, premium: { iops: 80_000, mbps: 2_000 } },
    network: { nics: 8, mbps: 32_000 },
    cpu: CPU_CASCADE,
  }),
  mkM('Standard_M128m', 'Mv1', 128, 3_892, {
    local: { disks: 1, gib: 14_336, iops: 250_000, mbps: 1_600 },
    remote: { disks: 64, premium: { iops: 80_000, mbps: 2_000 } },
    network: { nics: 8, mbps: 32_000 },
    cpu: CPU_CASCADE,
  }),
];

/** Mv2 — High-memory Skylake generation (208 / 416 vCPU). */
const M_SERIES_MV2: UserVm[] = [
  mkM('Standard_M208s_v2', 'Mv2', 208, 2_850, {
    local: { disks: 1, gib: 4_096, iops: 80_000, mbps: 800 },
    remote: { disks: 64, premium: { iops: 40_000, mbps: 1_000 } },
    network: { nics: 8, mbps: 16_000 },
    cpu: CPU_SKYLAKE,
  }),
  mkM('Standard_M208ms_v2', 'Mv2', 208, 5_700, {
    local: { disks: 1, gib: 4_096, iops: 80_000, mbps: 800 },
    remote: { disks: 64, premium: { iops: 40_000, mbps: 1_000 } },
    network: { nics: 8, mbps: 16_000 },
    cpu: CPU_SKYLAKE,
  }),
  mkM('Standard_M416s_v2', 'Mv2', 416, 5_700, {
    local: { disks: 1, gib: 8_192, iops: 250_000, mbps: 1_600 },
    remote: { disks: 64, premium: { iops: 80_000, mbps: 2_000 } },
    network: { nics: 8, mbps: 32_000 },
    cpu: CPU_SKYLAKE,
  }),
  mkM('Standard_M416s_8_v2', 'Mv2', 416, 7_600, {
    local: { disks: 1, gib: 4_096, iops: 250_000, mbps: 1_600 },
    remote: { disks: 64, premium: { iops: 80_000, mbps: 2_000 } },
    network: { nics: 8, mbps: 32_000 },
    cpu: CPU_SKYLAKE,
  }),
  mkM('Standard_M416ms_v2', 'Mv2', 416, 11_400, {
    local: { disks: 1, gib: 8_192, iops: 250_000, mbps: 1_600 },
    remote: { disks: 64, premium: { iops: 80_000, mbps: 2_000 } },
    network: { nics: 8, mbps: 32_000 },
    cpu: CPU_SKYLAKE,
  }),
];

/** Msv3 Medium Memory — Sapphire Rapids, no local storage. */
const M_SERIES_MSV3_MM: UserVm[] = [
  mkM('Standard_M12s_v3', 'Mv3', 12, 240, {
    remote: {
      disks: 64,
      premium: { iops: 16_250, mbps: 390 },
      ultra: { iops: 16_250, mbps: 390 },
    },
    network: { nics: 4, mbps: 4_000 },
    cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M24s_v3', 'Mv3', 24, 480, {
    remote: {
      disks: 64,
      premium: { iops: 32_500, mbps: 780 },
      ultra: { iops: 32_500, mbps: 780 },
    },
    network: { nics: 8, mbps: 8_000 },
    cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M48s_1_v3', 'Mv3', 48, 974, {
    remote: {
      disks: 64,
      premium: { iops: 65_000, mbps: 1_560 },
      ultra: { iops: 65_000, mbps: 1_560 },
    },
    network: { nics: 8, mbps: 16_000 },
    cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M96s_1_v3', 'Mv3', 96, 974, {
    remote: {
      disks: 64,
      premium: { iops: 65_000, mbps: 1_560 },
      ultra: { iops: 65_000, mbps: 1_560 },
    },
    network: { nics: 8, mbps: 16_000 },
    cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M96s_2_v3', 'Mv3', 96, 1_946, {
    remote: {
      disks: 64,
      premium: { iops: 130_000, mbps: 3_120 },
      ultra: { iops: 130_000, mbps: 3_120 },
    },
    network: { nics: 8, mbps: 30_000 },
    cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M176s_3_v3', 'Mv3', 176, 2_794, {
    remote: {
      disks: 64,
      premium: { iops: 130_000, mbps: 4_000 },
      ultra: { iops: 130_000, mbps: 4_000 },
    },
    network: { nics: 8, mbps: 40_000 },
    cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M176s_4_v3', 'Mv3', 176, 3_892, {
    remote: {
      disks: 64,
      premium: { iops: 130_000, mbps: 4_000 },
      ultra: { iops: 130_000, mbps: 4_000 },
    },
    network: { nics: 8, mbps: 40_000 },
    cpu: CPU_SAPPHIRE,
  }),
];

/** Msv3 High Memory — Sapphire Rapids, no local storage, 6–16 TiB memory. */
const M_SERIES_MSV3_HM: UserVm[] = [
  mkM('Standard_M416s_6_v3', 'Mv3', 416, 5_696, {
    remote: {
      disks: 64,
      premium: { iops: 130_000, mbps: 4_000 },
      ultra: { iops: 130_000, mbps: 4_000 },
    },
    network: { nics: 8, mbps: 40_000 },
    cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M416s_8_v3', 'Mv3', 416, 7_600, {
    remote: {
      disks: 64,
      premium: { iops: 130_000, mbps: 4_000 },
      ultra: { iops: 130_000, mbps: 4_000 },
    },
    network: { nics: 8, mbps: 40_000 },
    cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M624s_12_v3', 'Mv3', 624, 11_400, {
    remote: {
      disks: 64,
      premium: { iops: 130_000, mbps: 4_000 },
      ultra: { iops: 130_000, mbps: 4_000 },
    },
    network: { nics: 8, mbps: 40_000 },
    cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M832s_12_v3', 'Mv3', 832, 11_400, {
    remote: {
      disks: 64,
      premium: { iops: 130_000, mbps: 4_000 },
      ultra: { iops: 260_000, mbps: 8_000 },
    },
    network: { nics: 8, mbps: 100_000 },
    cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M832is_16_v3', 'Mv3', 832, 15_200, {
    remote: {
      disks: 64,
      premium: { iops: 130_000, mbps: 4_000 },
      ultra: { iops: 260_000, mbps: 8_000 },
    },
    network: { nics: 8, mbps: 100_000 },
    cpu: CPU_SAPPHIRE,
  }),
];

/**
 * Mdsv3 Medium Memory — Sapphire Rapids, WITH 400 GiB local NVMe temp disk.
 * Same compute/memory/remote/network envelope as Msv3-MM; the `d` denotes the
 * local disk. Source: learn.microsoft.com/.../memory-optimized/mdsv3-mm-series
 */
const M_SERIES_MDSV3_MM: UserVm[] = [
  mkM('Standard_M12ds_v3', 'Mv3', 12, 240, {
    local: { disks: 1, gib: 400, iops: 10_000, mbps: 100 },
    remote: { disks: 64, premium: { iops: 16_250, mbps: 390 }, ultra: { iops: 16_250, mbps: 390 } },
    network: { nics: 4, mbps: 4_000 },
    cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M24ds_v3', 'Mv3', 24, 480, {
    local: { disks: 1, gib: 400, iops: 20_000, mbps: 200 },
    remote: { disks: 64, premium: { iops: 32_500, mbps: 780 }, ultra: { iops: 32_500, mbps: 780 } },
    network: { nics: 8, mbps: 8_000 },
    cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M48ds_1_v3', 'Mv3', 48, 974, {
    local: { disks: 1, gib: 400, iops: 40_000, mbps: 400 },
    remote: { disks: 64, premium: { iops: 65_000, mbps: 1_560 }, ultra: { iops: 65_000, mbps: 1_560 } },
    network: { nics: 8, mbps: 16_000 },
    cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M96ds_1_v3', 'Mv3', 96, 974, {
    local: { disks: 1, gib: 400, iops: 40_000, mbps: 400 },
    remote: { disks: 64, premium: { iops: 65_000, mbps: 1_560 }, ultra: { iops: 65_000, mbps: 1_560 } },
    network: { nics: 8, mbps: 16_000 },
    cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M96ds_2_v3', 'Mv3', 96, 1_946, {
    local: { disks: 1, gib: 400, iops: 160_000, mbps: 1_600 },
    remote: { disks: 64, premium: { iops: 130_000, mbps: 3_120 }, ultra: { iops: 130_000, mbps: 3_120 } },
    network: { nics: 8, mbps: 30_000 },
    cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M176ds_3_v3', 'Mv3', 176, 2_794, {
    local: { disks: 1, gib: 400, iops: 160_000, mbps: 1_600 },
    remote: { disks: 64, premium: { iops: 130_000, mbps: 4_000 }, ultra: { iops: 130_000, mbps: 4_000 } },
    network: { nics: 8, mbps: 40_000 },
    cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M176ds_4_v3', 'Mv3', 176, 3_892, {
    local: { disks: 1, gib: 400, iops: 160_000, mbps: 1_600 },
    remote: { disks: 64, premium: { iops: 130_000, mbps: 4_000 }, ultra: { iops: 130_000, mbps: 4_000 } },
    network: { nics: 8, mbps: 40_000 },
    cpu: CPU_SAPPHIRE,
  }),
];

/**
 * Mdsv3 High Memory — Sapphire Rapids, WITH 400 GiB local NVMe temp disk.
 * Same envelope as Msv3-HM plus the local disk. 6–16 TiB memory.
 * Source: learn.microsoft.com/.../memory-optimized/mdsv3-hm-series
 */
const M_SERIES_MDSV3_HM: UserVm[] = [
  mkM('Standard_M416ds_6_v3', 'Mv3', 416, 5_696, {
    local: { disks: 1, gib: 400, iops: 250_000, mbps: 1_600 },
    remote: { disks: 64, premium: { iops: 130_000, mbps: 4_000 }, ultra: { iops: 130_000, mbps: 4_000 } },
    network: { nics: 8, mbps: 40_000 },
    cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M416ds_8_v3', 'Mv3', 416, 7_600, {
    local: { disks: 1, gib: 400, iops: 250_000, mbps: 1_600 },
    remote: { disks: 64, premium: { iops: 130_000, mbps: 4_000 }, ultra: { iops: 130_000, mbps: 4_000 } },
    network: { nics: 8, mbps: 40_000 },
    cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M624ds_12_v3', 'Mv3', 624, 11_400, {
    local: { disks: 1, gib: 400, iops: 250_000, mbps: 1_600 },
    remote: { disks: 64, premium: { iops: 130_000, mbps: 4_000 }, ultra: { iops: 130_000, mbps: 4_000 } },
    network: { nics: 8, mbps: 40_000 },
    cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M832ds_12_v3', 'Mv3', 832, 11_400, {
    local: { disks: 1, gib: 400, iops: 250_000, mbps: 1_600 },
    remote: { disks: 64, premium: { iops: 130_000, mbps: 4_000 }, ultra: { iops: 260_000, mbps: 8_000 } },
    network: { nics: 8, mbps: 100_000 },
    cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M832ids_16_v3', 'Mv3', 832, 15_200, {
    local: { disks: 1, gib: 400, iops: 250_000, mbps: 1_600 },
    remote: { disks: 64, premium: { iops: 130_000, mbps: 4_000 }, ultra: { iops: 260_000, mbps: 8_000 } },
    network: { nics: 8, mbps: 100_000 },
    cpu: CPU_SAPPHIRE,
  }),
];

/**
 * Msv2 Medium Memory — Cascade Lake 8280, diskless. 875–4096 GiB.
 * The M192i* sizes are isolated and retire 2027-03-31.
 * Source: learn.microsoft.com/.../memory-optimized/msv2-mm-series
 */
const M_SERIES_MSV2_MM: UserVm[] = [
  mkM('Standard_M32ms_v2', 'Mv2', 32, 875, {
    remote: { disks: 32, premium: { iops: 20_000, mbps: 500 } },
    network: { nics: 8, mbps: 8_000 }, cpu: CPU_CASCADE_8280,
  }),
  mkM('Standard_M64s_v2', 'Mv2', 64, 1_024, {
    remote: { disks: 64, premium: { iops: 40_000, mbps: 1_000 } },
    network: { nics: 8, mbps: 16_000 }, cpu: CPU_CASCADE_8280,
  }),
  mkM('Standard_M64ms_v2', 'Mv2', 64, 1_792, {
    remote: { disks: 64, premium: { iops: 40_000, mbps: 1_000 } },
    network: { nics: 8, mbps: 16_000 }, cpu: CPU_CASCADE_8280,
  }),
  mkM('Standard_M128s_v2', 'Mv2', 128, 2_048, {
    remote: { disks: 64, premium: { iops: 80_000, mbps: 2_000 } },
    network: { nics: 8, mbps: 30_000 }, cpu: CPU_CASCADE_8280,
  }),
  mkM('Standard_M128ms_v2', 'Mv2', 128, 3_892, {
    remote: { disks: 64, premium: { iops: 80_000, mbps: 2_000 } },
    network: { nics: 8, mbps: 30_000 }, cpu: CPU_CASCADE_8280,
  }),
  mkM('Standard_M192is_v2', 'Mv2', 192, 2_048, {
    remote: { disks: 64, premium: { iops: 80_000, mbps: 2_000 }, ultra: { iops: 120_000, mbps: 2_000 } },
    network: { nics: 8, mbps: 30_000 }, cpu: CPU_CASCADE_8280,
    note: 'Isolated size — retires 2027-03-31.',
  }),
  mkM('Standard_M192ims_v2', 'Mv2', 192, 4_096, {
    remote: { disks: 64, premium: { iops: 80_000, mbps: 2_000 } },
    network: { nics: 8, mbps: 30_000 }, cpu: CPU_CASCADE_8280,
    note: 'Isolated size — retires 2027-03-31.',
  }),
];

/**
 * Mdsv2 Medium Memory — Cascade Lake 8280, WITH local temp disk. 875–4096 GiB.
 * The M192id* sizes are isolated and retire 2027-03-31.
 * Source: learn.microsoft.com/.../memory-optimized/mdsv2-mm-series
 */
const M_SERIES_MDSV2_MM: UserVm[] = [
  mkM('Standard_M32dms_v2', 'Mv2', 32, 875, {
    local: { disks: 1, gib: 1_024, iops: 40_000, mbps: 400 },
    remote: { disks: 32, premium: { iops: 20_000, mbps: 500 } },
    network: { nics: 8, mbps: 8_000 }, cpu: CPU_CASCADE_8280,
  }),
  mkM('Standard_M64ds_v2', 'Mv2', 64, 1_024, {
    local: { disks: 1, gib: 2_048, iops: 80_000, mbps: 800 },
    remote: { disks: 64, premium: { iops: 40_000, mbps: 1_000 } },
    network: { nics: 8, mbps: 16_000 }, cpu: CPU_CASCADE_8280,
  }),
  mkM('Standard_M64dms_v2', 'Mv2', 64, 1_792, {
    local: { disks: 1, gib: 2_048, iops: 80_000, mbps: 800 },
    remote: { disks: 64, premium: { iops: 40_000, mbps: 1_000 } },
    network: { nics: 8, mbps: 16_000 }, cpu: CPU_CASCADE_8280,
  }),
  mkM('Standard_M128ds_v2', 'Mv2', 128, 2_048, {
    local: { disks: 1, gib: 4_096, iops: 160_000, mbps: 1_600 },
    remote: { disks: 64, premium: { iops: 80_000, mbps: 2_000 } },
    network: { nics: 8, mbps: 30_000 }, cpu: CPU_CASCADE_8280,
  }),
  mkM('Standard_M128dms_v2', 'Mv2', 128, 3_892, {
    local: { disks: 1, gib: 4_096, iops: 160_000, mbps: 1_600 },
    remote: { disks: 64, premium: { iops: 80_000, mbps: 2_000 } },
    network: { nics: 8, mbps: 30_000 }, cpu: CPU_CASCADE_8280,
  }),
  mkM('Standard_M192ids_v2', 'Mv2', 192, 2_048, {
    local: { disks: 1, gib: 4_096, iops: 160_000, mbps: 1_600 },
    remote: { disks: 64, premium: { iops: 80_000, mbps: 2_000 } },
    network: { nics: 8, mbps: 30_000 }, cpu: CPU_CASCADE_8280,
    note: 'Isolated size — retires 2027-03-31.',
  }),
  mkM('Standard_M192idms_v2', 'Mv2', 192, 4_096, {
    local: { disks: 1, gib: 4_096, iops: 160_000, mbps: 1_600 },
    remote: { disks: 64, premium: { iops: 80_000, mbps: 2_000 } },
    network: { nics: 8, mbps: 30_000 }, cpu: CPU_CASCADE_8280,
    note: 'Isolated size — retires 2027-03-31.',
  }),
];

/**
 * Mbsv3 — "Memory-and-storage boosted" Sapphire Rapids, diskless. 128–3800 GiB,
 * up to 650k IOPS / 10 GBps remote. Medium-memory range → MM Mv3 by tier;
 * distinguished from Msv3-MM by the `b` (boosted) in the size name.
 * Source: learn.microsoft.com/.../memory-optimized/mbsv3-series
 */
const M_SERIES_MBSV3: UserVm[] = [
  mkM('Standard_M16bs_v3', 'Mv3', 16, 128, {
    remote: { disks: 64, premium: { iops: 44_000, mbps: 1_000 }, ultra: { iops: 64_000, mbps: 1_000 } },
    network: { nics: 8, mbps: 8_000 }, cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M32bs_v3', 'Mv3', 32, 256, {
    remote: { disks: 64, premium: { iops: 88_000, mbps: 2_000 }, ultra: { iops: 88_000, mbps: 2_000 } },
    network: { nics: 8, mbps: 16_000 }, cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M48bs_v3', 'Mv3', 48, 384, {
    remote: { disks: 64, premium: { iops: 88_000, mbps: 2_000 }, ultra: { iops: 120_000, mbps: 2_000 } },
    network: { nics: 8, mbps: 16_000 }, cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M64bs_v3', 'Mv3', 64, 512, {
    remote: { disks: 64, premium: { iops: 88_000, mbps: 2_000 }, ultra: { iops: 160_000, mbps: 2_000 } },
    network: { nics: 8, mbps: 16_000 }, cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M96bs_v3', 'Mv3', 96, 768, {
    remote: { disks: 64, premium: { iops: 260_000, mbps: 4_000 }, ultra: { iops: 260_000, mbps: 4_000 } },
    network: { nics: 8, mbps: 25_000 }, cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M128bs_v3', 'Mv3', 128, 1_024, {
    remote: { disks: 64, premium: { iops: 260_000, mbps: 4_000 }, ultra: { iops: 400_000, mbps: 4_000 } },
    network: { nics: 8, mbps: 40_000 }, cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M176bs_v3', 'Mv3', 176, 1_536, {
    remote: { disks: 64, premium: { iops: 260_000, mbps: 6_000 }, ultra: { iops: 650_000, mbps: 6_000 } },
    network: { nics: 8, mbps: 50_000 }, cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M416bs_v3', 'Mv3', 416, 3_800, {
    remote: { disks: 64, premium: { iops: 240_000, mbps: 8_000 }, ultra: { iops: 550_000, mbps: 10_000 } },
    network: { nics: 8, mbps: 50_000 }, cpu: CPU_SAPPHIRE,
  }),
];

/**
 * Mbdsv3 — "Memory-and-storage boosted" Sapphire Rapids, WITH local disk.
 * 128–3892 GiB. The `_N_v3` sizes carry larger local disks (3–8 TB).
 * Source: learn.microsoft.com/.../memory-optimized/mbdsv3-series
 */
const M_SERIES_MBDSV3: UserVm[] = [
  mkM('Standard_M16bds_v3', 'Mv3', 16, 128, {
    local: { disks: 1, gib: 400, iops: 10_000, mbps: 100 },
    remote: { disks: 64, premium: { iops: 44_000, mbps: 1_000 }, ultra: { iops: 64_000, mbps: 1_000 } },
    network: { nics: 8, mbps: 8_000 }, cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M32bds_v3', 'Mv3', 32, 256, {
    local: { disks: 1, gib: 400, iops: 20_000, mbps: 200 },
    remote: { disks: 64, premium: { iops: 88_000, mbps: 2_000 }, ultra: { iops: 88_000, mbps: 2_000 } },
    network: { nics: 8, mbps: 16_000 }, cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M48bds_v3', 'Mv3', 48, 384, {
    local: { disks: 1, gib: 400, iops: 40_000, mbps: 400 },
    remote: { disks: 64, premium: { iops: 88_000, mbps: 2_000 }, ultra: { iops: 120_000, mbps: 2_000 } },
    network: { nics: 8, mbps: 16_000 }, cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M64bds_v3', 'Mv3', 64, 512, {
    local: { disks: 1, gib: 400, iops: 40_000, mbps: 400 },
    remote: { disks: 64, premium: { iops: 88_000, mbps: 2_000 }, ultra: { iops: 160_000, mbps: 2_000 } },
    network: { nics: 8, mbps: 16_000 }, cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M96bds_v3', 'Mv3', 96, 768, {
    local: { disks: 1, gib: 400, iops: 40_000, mbps: 400 },
    remote: { disks: 64, premium: { iops: 260_000, mbps: 4_000 }, ultra: { iops: 260_000, mbps: 4_000 } },
    network: { nics: 8, mbps: 25_000 }, cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M128bds_v3', 'Mv3', 128, 1_024, {
    local: { disks: 1, gib: 400, iops: 160_000, mbps: 1_600 },
    remote: { disks: 64, premium: { iops: 260_000, mbps: 4_000 }, ultra: { iops: 400_000, mbps: 4_000 } },
    network: { nics: 8, mbps: 40_000 }, cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M176bds_v3', 'Mv3', 176, 1_536, {
    local: { disks: 1, gib: 400, iops: 160_000, mbps: 1_600 },
    remote: { disks: 64, premium: { iops: 260_000, mbps: 6_000 }, ultra: { iops: 650_000, mbps: 6_000 } },
    network: { nics: 8, mbps: 50_000 }, cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M64bds_1_v3', 'Mv3', 64, 1_397, {
    local: { disks: 1, gib: 3_000, iops: 40_000, mbps: 400 },
    remote: { disks: 64, premium: { iops: 130_000, mbps: 6_000 }, ultra: { iops: 160_000, mbps: 6_000 } },
    network: { nics: 8, mbps: 20_000 }, cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M96bds_2_v3', 'Mv3', 96, 1_946, {
    local: { disks: 1, gib: 4_500, iops: 40_000, mbps: 400 },
    remote: { disks: 64, premium: { iops: 130_000, mbps: 8_000 }, ultra: { iops: 260_000, mbps: 8_000 } },
    network: { nics: 8, mbps: 20_000 }, cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M128bds_3_v3', 'Mv3', 128, 2_794, {
    local: { disks: 1, gib: 6_000, iops: 160_000, mbps: 1_600 },
    remote: { disks: 64, premium: { iops: 260_000, mbps: 8_000 }, ultra: { iops: 400_000, mbps: 10_000 } },
    network: { nics: 8, mbps: 40_000 }, cpu: CPU_SAPPHIRE,
  }),
  mkM('Standard_M176bds_4_v3', 'Mv3', 176, 3_892, {
    local: { disks: 1, gib: 8_000, iops: 160_000, mbps: 1_600 },
    remote: { disks: 64, premium: { iops: 260_000, mbps: 8_000 }, ultra: { iops: 650_000, mbps: 10_000 } },
    network: { nics: 8, mbps: 40_000 }, cpu: CPU_SAPPHIRE,
  }),
];

/**
 * Mdsv3 Very High Memory — Sapphire Rapids 8490H, 32 TB-class isolated SAP
 * HANA hosts. 23–30 TiB memory, 896–1792 vCPU, 4096 GiB local disk.
 * Source: learn.microsoft.com/.../memory-optimized/mdsv3-vhm-series
 */
const M_SERIES_MDSV3_VHM: UserVm[] = [
  mkM('Standard_M896ixds_24_v3', 'Mv3', 896, 23_088, {
    local: { disks: 1, gib: 4_096, iops: 0, mbps: 0 },
    remote: { disks: 64, premium: { iops: 110_000, mbps: 8_000 }, ultra: { iops: 200_000, mbps: 8_000 } },
    network: { nics: 8, mbps: 185_000 }, cpu: CPU_SAPPHIRE_8490H,
    note: 'Isolated; SAP HANA. SMT disabled (896 vCPU variant).',
  }),
  mkM('Standard_M896ixds_32_v3', 'Mv3', 896, 30_400, {
    local: { disks: 1, gib: 4_096, iops: 0, mbps: 0 },
    remote: { disks: 64, premium: { iops: 110_000, mbps: 8_000 }, ultra: { iops: 200_000, mbps: 8_000 } },
    network: { nics: 8, mbps: 185_000 }, cpu: CPU_SAPPHIRE_8490H,
    note: 'Isolated; Microsoft-recommended 32 TB S/4HANA host. SMT disabled.',
  }),
  mkM('Standard_M1792ixds_32_v3', 'Mv3', 1_792, 30_400, {
    local: { disks: 1, gib: 4_096, iops: 0, mbps: 0 },
    remote: { disks: 64, premium: { iops: 110_000, mbps: 8_000 }, ultra: { iops: 200_000, mbps: 8_000 } },
    network: { nics: 8, mbps: 185_000 }, cpu: CPU_SAPPHIRE_8490H,
    note: 'Isolated; SMT enabled (1792 vCPU) — analytical S/4HANA workloads.',
  }),
];

/** Spec-only roll-up before pricing/region expansion. */
const M_SERIES_SPECS: UserVm[] = [
  ...M_SERIES_ORIGINAL,
  ...M_SERIES_MV2,
  ...M_SERIES_MSV2_MM,
  ...M_SERIES_MDSV2_MM,
  ...M_SERIES_MSV3_MM,
  ...M_SERIES_MSV3_HM,
  ...M_SERIES_MDSV3_MM,
  ...M_SERIES_MDSV3_HM,
  ...M_SERIES_MBSV3,
  ...M_SERIES_MBDSV3,
  ...M_SERIES_MDSV3_VHM,
];

// ────────────────────────────────────────────────────────────────────────
// v2.11 (Phase E0.2) — Multi-region pricing.
//
// Public Azure pay-as-you-go list pricing for Linux Pay-As-You-Go SKUs,
// sourced from the Azure Retail Prices API + public pricing pages. East
// US 2 is the baseline; other Azure regions are scaled by the published
// regional multipliers below. RI factors match the v2.2 convention
// (1y × 0.62, 3y × 0.42) which Azure publishes on the same pages.
//
// Doctrine: this data is vendor-public per the v2.11 doctrine amendment.
// SEED_DATA_AS_OF dates the rates so users know whether to re-upload.
// ────────────────────────────────────────────────────────────────────────

/** ISO date stamp shown in the VM Library disclaimer banner. Bump on
 *  every seed refresh so users can tell rates are fresh. */
export const SEED_DATA_AS_OF = '2026-03-10';

const AZ_RI_1Y = 0.62;
const AZ_RI_3Y = 0.42;

/** PAYG hourly USD for each M-Series SKU in Azure East US 2 (Linux,
 *  Pay-As-You-Go). Public list prices from the Azure pricing pages. */
const M_SERIES_PRICES_EAST_US_2: Record<string, number> = {
  // Original M-series (Haswell + Cascade Lake)
  Standard_M8ms: 0.581,
  Standard_M16ms: 1.162,
  Standard_M32ts: 2.268,
  Standard_M32ls: 2.268,
  Standard_M32ms: 5.296,
  Standard_M64s: 5.447,
  Standard_M64ls: 4.544,
  Standard_M64ms: 10.624,
  Standard_M128s: 10.894,
  Standard_M128ms: 26.688,
  Standard_M64: 5.17,
  Standard_M64m: 9.67,
  Standard_M128: 10.34,
  Standard_M128m: 25.44,
  // Mv2 (Skylake 8180M)
  Standard_M208s_v2: 13.344,
  Standard_M208ms_v2: 26.688,
  Standard_M416s_v2: 26.688,
  Standard_M416s_8_v2: 32.026,
  Standard_M416ms_v2: 53.376,
  // Msv3-MM (Sapphire Rapids, no local storage)
  Standard_M12s_v3: 0.9905,
  Standard_M24s_v3: 1.981,
  Standard_M48s_1_v3: 3.962,
  Standard_M96s_1_v3: 5.943,
  Standard_M96s_2_v3: 7.924,
  Standard_M176s_3_v3: 11.326,
  Standard_M176s_4_v3: 13.7975,
  // Msv3-HM (Sapphire Rapids, 6-16 TiB)
  Standard_M416s_6_v3: 27.3,
  Standard_M416s_8_v3: 30.408,
  Standard_M624s_12_v3: 45.612,
  Standard_M832s_12_v3: 60.816,
  Standard_M832is_16_v3: 72.9792,
  // Mdsv3-MM (Sapphire Rapids + 400 GiB local NVMe). The `d` local-disk
  // variant carries only a small premium over the diskless Msv3 SKU; we
  // mirror the matching Msv3-MM rate as a public-parity estimate (real
  // rate trues up on user upload / Retail Prices refresh).
  Standard_M12ds_v3: 0.9905,
  Standard_M24ds_v3: 1.981,
  Standard_M48ds_1_v3: 3.962,
  Standard_M96ds_1_v3: 5.943,
  Standard_M96ds_2_v3: 7.924,
  Standard_M176ds_3_v3: 11.326,
  Standard_M176ds_4_v3: 13.7975,
  // Mdsv3-HM (Sapphire Rapids + 400 GiB local NVMe). Parity-mirrored from
  // the matching Msv3-HM rate.
  Standard_M416ds_6_v3: 27.3,
  Standard_M416ds_8_v3: 30.408,
  Standard_M624ds_12_v3: 45.612,
  Standard_M832ds_12_v3: 60.816,
  Standard_M832ids_16_v3: 72.9792,
};

// v2.25.1 — region coverage + rates are now driven by the LIVE ingested
// shards (azureMSeriesSeedRates.json, regenerated by
// scripts/ingest/build-azure-mseries-seed.mjs from public/rates/azure/).
// The old AZURE_REGION_MULTIPLIERS shipped M-Series in only six hard-coded
// regions with multiplier-guessed rates; the Azure Retail Prices ingest
// proves M-Series is published in ~52 regions and carries real PAYG / RI
// rates, so the seed now expands across the true footprint with accurate,
// non-fabricated pricing. M_SERIES_PRICES_EAST_US_2 + AZ_RI_* survive only
// as the baseline-region fallback for any curated SKU the live data misses.

/** Expand the spec-only catalog into one row per (size, region the size is
 *  actually published in), pricing from the live Azure Retail Prices shards.
 *  A curated SKU absent from the live data still ships in the baseline
 *  region at its list price so no size silently disappears. */
function expandToAllRegions(specs: UserVm[]): UserVm[] {
  const round4 = (n: number) => Math.round(n * 10000) / 10000;
  const out: UserVm[] = [];
  const emitted = new Set<string>();
  for (const [region, skuRates] of Object.entries(M_SERIES_RATES.regions)) {
    for (const spec of specs) {
      const rate = (skuRates as Record<string, MSeriesRate>)[spec.vmSizeName];
      if (!rate) continue; // size not sold in this region — accurate omission
      out.push({
        ...spec,
        region,
        hourlyUsd: rate.payg,
        riOneYrHourlyUsd: rate.ri1y ?? round4(rate.payg * AZ_RI_1Y),
        riThreeYrHourlyUsd: rate.ri3y ?? round4(rate.payg * AZ_RI_3Y),
      });
      emitted.add(spec.vmSizeName);
    }
  }
  // Fallback: any curated SKU the live shards never priced still ships in the
  // baseline region (East US 2) with its curated list price.
  const FALLBACK_REGION = 'East US 2';
  for (const spec of specs) {
    if (emitted.has(spec.vmSizeName)) continue;
    const baseHourly = M_SERIES_PRICES_EAST_US_2[spec.vmSizeName];
    out.push({
      ...spec,
      region: FALLBACK_REGION,
      hourlyUsd: baseHourly,
      riOneYrHourlyUsd: baseHourly !== undefined ? round4(baseHourly * AZ_RI_1Y) : undefined,
      riThreeYrHourlyUsd: baseHourly !== undefined ? round4(baseHourly * AZ_RI_3Y) : undefined,
    });
  }
  return out;
}

/** Full Azure M-Series seed catalog — every published size × every
 *  M-Series-available region, with real PAYG + RI pricing baked in. */
export const AZURE_M_SERIES_SEED: UserVm[] = expandToAllRegions(M_SERIES_SPECS);

/** v2.25.2 — Refresh the rate fields of Azure M-series rows from the current
 *  seed. v2.25.1 moved M-series from 6 multiplier-priced regions to ~54 with
 *  real Azure Retail Prices; the additive seed-merge ADDS the new-region rows
 *  but never updates a returning user's existing rows, so their original
 *  regions keep stale (multiplier-guessed) RI rates. For each Azure M-series
 *  row that matches a seed row by (vmSizeName, region), overwrite payg/RI with
 *  the seed's real values. Rows with no seed match (genuine user uploads in
 *  non-seed regions) and non-M rows pass through untouched. Pure + idempotent
 *  — a row already on the seed rate is returned by reference. */
export function reRateAzureMSeries(vms: UserVm[]): UserVm[] {
  const fresh = new Map<string, UserVm>();
  for (const v of AZURE_M_SERIES_SEED) fresh.set(`${v.vmSizeName}|${v.region}`, v);
  return vms.map((v) => {
    if ((v.provider ?? '') !== 'Azure') return v;
    const isMSeries =
      v.series === 'M' ||
      /^Mv\d+$/.test(v.vmGeneration ?? '') ||
      /^Standard_M\d/.test(v.vmSizeName);
    if (!isMSeries) return v;
    const f = fresh.get(`${v.vmSizeName}|${v.region}`);
    if (!f) return v; // user-uploaded row in a non-seed region — leave it
    if (
      v.hourlyUsd === f.hourlyUsd &&
      v.riOneYrHourlyUsd === f.riOneYrHourlyUsd &&
      v.riThreeYrHourlyUsd === f.riThreeYrHourlyUsd
    ) {
      return v; // already on the fresh rate
    }
    return {
      ...v,
      hourlyUsd: f.hourlyUsd,
      riOneYrHourlyUsd: f.riOneYrHourlyUsd,
      riThreeYrHourlyUsd: f.riThreeYrHourlyUsd,
    };
  });
}

// ────────────────────────────────────────────────────────────────────────
// Helper: build a UserVm row with default-filled common fields. Keeps the
// per-row tables above terse — only the fields that actually vary per size
// are explicit at the call site.
// ────────────────────────────────────────────────────────────────────────
interface SpecArgs {
  local?: { disks: number; gib: number; iops: number; mbps: number };
  remote: {
    disks: number;
    premium: { iops: number; mbps: number };
    ultra?: { iops: number; mbps: number };
  };
  network: { nics: number; mbps: number };
  cpu: string;
  /** v2.19.20 — Optional free-text note (e.g. retirement date for the
   *  isolated Msv2/Mdsv2 sizes that retire 2027-03-31). */
  note?: string;
}

function mkM(
  vmSizeName: string,
  vmGeneration: 'Mv1' | 'Mv2' | 'Mv3',
  vcpus: number,
  memoryGib: number,
  spec: SpecArgs,
): UserVm {
  const memoryCategory = memoryCategoryLabel(memoryGib);
  return {
    vmSizeName,
    vmGeneration,
    series: 'M',
    memoryCategory,
    // No fungibility seed — user authors per the Decoupling Doctrine.
    homeHardwareGroup: '',
    spilloverTarget: 'N/A',
    processor: spec.cpu,
    vcpus,
    memoryGib,
    networkMbps: spec.network.mbps,
    localDiskGib: spec.local?.gib ?? 0,
    status: 'GA',
    notes: spec.note ?? '',
    provider: PROVIDER,
    family: FAMILY_M,
    region: REGION_DEFAULT,
    // ── Phase B spec dimensions ────────────────────────────────────────
    networkNicCount: spec.network.nics,
    localStorageDiskCount: spec.local?.disks,
    localStorageGiB: spec.local?.gib,
    localStorageIopsRR: spec.local?.iops,
    localStorageMbpsRR: spec.local?.mbps,
    remoteStorageDisks: spec.remote.disks,
    remoteStorageIopsPremium: spec.remote.premium.iops,
    remoteStorageMbpsPremium: spec.remote.premium.mbps,
    remoteStorageIopsUltra: spec.remote.ultra?.iops,
    remoteStorageMbpsUltra: spec.remote.ultra?.mbps,
    acceleratorType: 'None',
  };
}

// ────────────────────────────────────────────────────────────────────────
// Merge helper — seed wins ONLY when the user has no rows yet. Any
// existing user-uploaded entry preserves precedence: the user is the
// source of truth. Used by the AppContext bootstrap on first init.
// ────────────────────────────────────────────────────────────────────────
export function shouldSeedUserVms(currentUserVms: UserVm[]): boolean {
  return currentUserVms.length === 0;
}

export function seedUserVms(currentUserVms: UserVm[]): UserVm[] {
  if (!shouldSeedUserVms(currentUserVms)) return currentUserVms;
  return AZURE_M_SERIES_SEED.slice();
}

/** v2.11 — Combined seed (Azure + AWS + GCP). AppContext calls this on
 *  first init so the dashboard demos cross-cloud out-of-the-box. The
 *  three provider arrays live in separate files for diffability. */
import { AWS_M_SERIES_ANALOG_SEED } from './awsMSeriesAnalogSeed';
import { GCP_M_SERIES_ANALOG_SEED } from './gcpMSeriesAnalogSeed';
import { AZURE_GENERAL_PURPOSE_SEED } from './azureGeneralPurposeSeed';
import { AZURE_EXHAUSTIVE_SEED } from './azureSeed';
import { categorize } from '../utils/vmCategory';

/** Stamp every legacy seed row with its canonical VmCategory so the
 *  Excel template's Category column round-trips through user uploads. */
function withCategory(rows: UserVm[]): UserVm[] {
  return rows.map((r) => (r.category ? r : { ...r, category: categorize(r.provider, r.family) }));
}

/** Build the full public-seed catalog (Azure exhaustive + legacy + AWS + GCP),
 *  deduped by `(provider, vmSizeName, region)`. Always returns the freshest
 *  seed snapshot — does NOT consider the user's current catalog. */
function buildFullPublicSeed(): UserVm[] {
  const seen = new Set<string>();
  const out: UserVm[] = [];
  const push = (rows: UserVm[]) => {
    for (const r of rows) {
      const key = `${r.provider}|${r.vmSizeName}|${r.region}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(r);
    }
  };
  push(AZURE_EXHAUSTIVE_SEED);
  push(withCategory(AZURE_M_SERIES_SEED));
  push(withCategory(AZURE_GENERAL_PURPOSE_SEED));
  push(AWS_M_SERIES_ANALOG_SEED);
  push(withCategory(GCP_M_SERIES_ANALOG_SEED));
  return out;
}

export function seedAllPublicVms(currentUserVms: UserVm[]): UserVm[] {
  if (!shouldSeedUserVms(currentUserVms)) return currentUserVms;
  return buildFullPublicSeed();
}

/** Compact non-crypto hash (FNV-1a). Deterministic; produces a short
 *  base36 string suitable as a cache-busting version stamp. */
function fnv1aHash(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

/** v2.19.21 — Seed-catalog version stamp, auto-derived from a content hash
 *  of buildFullPublicSeed() output. ANY meaningful change to ANY seed file
 *  (new rows, removed rows, edited specs, reorders) shifts the hash, so
 *  AppContext's stale-stamp check fires and mergeSeedIntoUserVms runs on
 *  every returning user's next page load. Zero manual maintenance — no
 *  hand-bumping required when you add to the seed.
 *
 *  Format: `auto-<count>-<hash>`. Both halves are human-debuggable in
 *  DevTools (Application → Local Storage → vmcap:seedVersion).
 *
 *  Cost: one JSON.stringify + hash of the full seed on module init (~tens
 *  of ms on first import). After that, PUBLIC_SEED_VERSION is just a
 *  string constant.
 *
 *  Caveat: this auto-fires `mergeSeedIntoUserVms`, which only ADDS new
 *  (provider, vmSizeName, region) rows. For spec changes to EXISTING
 *  rows, users still need to click `↻ Refresh` in the VM Library (or ship
 *  a one-time re-stamp migration like vmcap:azureMTierVersion). */
export const PUBLIC_SEED_VERSION = ((): string => {
  const all = buildFullPublicSeed();
  return `auto-${all.length}-${fnv1aHash(JSON.stringify(all))}`;
})();

/** Additive seed merge — for use when the user has a populated catalog but
 *  the seed has new content (post-release seed expansion). Any seed row
 *  whose `(provider, vmSizeName, region)` triplet is NOT already present
 *  in the user's catalog is appended; existing rows are LEFT ALONE so user
 *  edits + uploads survive intact. */
export function mergeSeedIntoUserVms(current: UserVm[]): UserVm[] {
  const have = new Set<string>();
  for (const v of current) {
    have.add(`${v.provider}|${v.vmSizeName}|${v.region}`);
  }
  const additions: UserVm[] = [];
  for (const v of buildFullPublicSeed()) {
    const key = `${v.provider}|${v.vmSizeName}|${v.region}`;
    if (!have.has(key)) additions.push(v);
  }
  if (additions.length === 0) return current;
  return [...current, ...additions];
}
