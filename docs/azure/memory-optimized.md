# Azure Memory-Optimized — M-family source of truth

> **This file is the canonical reference for Azure M-series VM sizes.** It mirrors
> the `docs/aws/` and `docs/gcp/` pattern: the markdown here is the source of
> truth, and `src/data/azureMSeriesSeed.ts` mirrors it. If the in-app catalog
> ever drifts or a mapping breaks, restore from this file (and the companion
> Excel: `public/azure-m-series-source-of-truth.xlsx`).
>
> **Captured:** 2026-05-31 from Microsoft Learn (pages dated `ms.date 2026-03-10`).
> **Re-verify** against the live docs and bump `PUBLIC_SEED_VERSION` whenever you edit.
>
> **79 distinct M-family SKUs across 11 sub-series.**

## Source pages

| Sub-series | Tier | Processor | URL |
| --- | --- | --- | --- |
| M-series (Mv1) | MM | Haswell E7-8890 v3 / Cascade Lake 8280M | https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/memory-optimized/m-series |
| Msv2 High Memory (Mv2) | MM/HM | Skylake 8180M | https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/memory-optimized/mv2-series |
| Msv2 Medium Memory | MM | Cascade Lake 8280 | https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/memory-optimized/msv2-mm-series |
| Mdsv2 Medium Memory | MM | Cascade Lake 8280 | https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/memory-optimized/mdsv2-mm-series |
| Msv3 MM | MM | Sapphire Rapids | https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/memory-optimized/msv3-mm-series |
| Mdsv3 MM | MM | Sapphire Rapids | https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/memory-optimized/mdsv3-mm-series |
| Msv3 HM | HM | Sapphire Rapids | https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/memory-optimized/msv3-hm-series |
| Mdsv3 HM | HM | Sapphire Rapids | https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/memory-optimized/mdsv3-hm-series |
| Mdsv3 VHM | VHM | Sapphire Rapids 8490H | https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/memory-optimized/mdsv3-vhm-series |
| Mbsv3 (storage-boosted) | MM | Sapphire Rapids | https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/memory-optimized/mbsv3-series |
| Mbdsv3 (storage-boosted) | MM | Sapphire Rapids | https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/memory-optimized/mbdsv3-series |
| (index) M family | — | — | https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/memory-optimized/m-family |

## Tiering model (IMPORTANT)

Azure's M-family has **three memory tiers**, but the bands are far apart — the
app derives the tier from total memory:

- **Medium Memory (MM):** ≤ 4 TiB (4,096 GiB). Mv1, Msv2/Mdsv2-MM, Msv3/Mdsv3-MM, Mbsv3/Mbdsv3.
- **High Memory (HM):** 4–16 TiB. Msv2-HM (Skylake), Msv3/Mdsv3-HM (5,696–15,200 GiB).
- **Very High Memory (VHM):** > 16 TiB. Mdsv3-VHM only (23,088 / 30,400 GiB — 32 TB-class SAP HANA hosts).

The compound family slug is `"<tier> M<gen>"`, so the M-family resolves to:
**MM Mv1 · MM Mv2 · MM Mv3 · HM Mv2 · HM Mv3 · VHM Mv3.**

> **History:** v2.19.19 briefly collapsed this to a 2-tier MM/HM model after an
> incomplete pass; that was wrong — Microsoft DOES publish a "Very High Memory"
> series (Mdsv3-VHM, 32 TB). v2.19.20 restored VHM with the correct > 16 TiB
> boundary so the entire Msv3/Mdsv3 HM sub-series (tops at 15,200 GiB) stays HM.

> **NVMe vs SCSI:** the Msv3/Mdsv3 pages list each size twice (NVMe + SCSI
> controller options) under the **same SKU name** — one catalog row each. Only
> the two 832-vCPU sizes differ (NVMe 260,000 IOPS / 8,000 MBps vs SCSI 215,000
> / 6,000). The seed stores the NVMe figures.

> **`b` (boosted) and `i` (isolated) in size names:** Mbsv3/Mbdsv3 are the
> "memory-and-storage boosted" line (much higher remote IOPS); they fall in the
> MM memory band so they slot under **MM Mv3**, distinguished by the `b` in the
> name. The Msv2/Mdsv2 `M192i*` and all Mdsv3-VHM sizes are isolated (1
> customer/host); the four `M192i*_v2` isolated sizes **retire 2027-03-31**
> (noted per-row).

---

## M-series (Mv1) — 14 sizes · MM · Haswell E7-8890 v3 / Cascade Lake 8280M

| Size Name | vCPUs | Memory (GiB) | Temp GiB | Net Mbps |
| --- | --- | --- | --- | --- |
| Standard_M8ms | 8 | 218.75 | 256 | 2,000 |
| Standard_M16ms | 16 | 437.5 | 512 | 4,000 |
| Standard_M32ts | 32 | 192 | 1,024 | 8,000 |
| Standard_M32ls | 32 | 256 | 1,024 | 8,000 |
| Standard_M32ms | 32 | 875 | 1,024 | 8,000 |
| Standard_M64s | 64 | 1,024 | 2,048 | 16,000 |
| Standard_M64ls | 64 | 512 | 2,048 | 16,000 |
| Standard_M64ms | 64 | 1,792 | 2,048 | 16,000 |
| Standard_M128s | 128 | 2,048 | 4,096 | 30,000 |
| Standard_M128ms | 128 | 3,892 | 4,096 | 30,000 |
| Standard_M64 | 64 | 1,024 | 7,168 | 16,000 |
| Standard_M64m | 64 | 1,792 | 7,168 | 16,000 |
| Standard_M128 | 128 | 2,048 | 14,336 | 32,000 |
| Standard_M128m | 128 | 3,892 | 14,336 | 32,000 |

## Msv2 High Memory (Mv2) — 5 sizes · Skylake 8180M

| Size Name | vCPUs | Memory (GiB) | Temp GiB | Net Mbps | Tier |
| --- | --- | --- | --- | --- | --- |
| Standard_M208s_v2 | 208 | 2,850 | 4,096 | 16,000 | MM |
| Standard_M208ms_v2 | 208 | 5,700 | 4,096 | 16,000 | HM |
| Standard_M416s_v2 | 416 | 5,700 | 8,192 | 32,000 | HM |
| Standard_M416s_8_v2 | 416 | 7,600 | 4,096 | 32,000 | HM |
| Standard_M416ms_v2 | 416 | 11,400 | 8,192 | 32,000 | HM |

## Msv2 Medium Memory — 7 sizes · MM · Cascade Lake 8280 · diskless

| Size Name | vCPUs | Memory (GiB) | Premium IOPS | Premium MBps | Net Mbps | Note |
| --- | --- | --- | --- | --- | --- | --- |
| Standard_M32ms_v2 | 32 | 875 | 20,000 | 500 | 8,000 | |
| Standard_M64s_v2 | 64 | 1,024 | 40,000 | 1,000 | 16,000 | |
| Standard_M64ms_v2 | 64 | 1,792 | 40,000 | 1,000 | 16,000 | |
| Standard_M128s_v2 | 128 | 2,048 | 80,000 | 2,000 | 30,000 | |
| Standard_M128ms_v2 | 128 | 3,892 | 80,000 | 2,000 | 30,000 | |
| Standard_M192is_v2 | 192 | 2,048 | 80,000 | 2,000 | 30,000 | isolated · retires 2027-03-31 |
| Standard_M192ims_v2 | 192 | 4,096 | 80,000 | 2,000 | 30,000 | isolated · retires 2027-03-31 |

## Mdsv2 Medium Memory — 7 sizes · MM · Cascade Lake 8280 · local disk

| Size Name | vCPUs | Memory (GiB) | Temp GiB | Premium IOPS | Premium MBps | Net Mbps | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Standard_M32dms_v2 | 32 | 875 | 1,024 | 20,000 | 500 | 8,000 | |
| Standard_M64ds_v2 | 64 | 1,024 | 2,048 | 40,000 | 1,000 | 16,000 | |
| Standard_M64dms_v2 | 64 | 1,792 | 2,048 | 40,000 | 1,000 | 16,000 | |
| Standard_M128ds_v2 | 128 | 2,048 | 4,096 | 80,000 | 2,000 | 30,000 | |
| Standard_M128dms_v2 | 128 | 3,892 | 4,096 | 80,000 | 2,000 | 30,000 | |
| Standard_M192ids_v2 | 192 | 2,048 | 4,096 | 80,000 | 2,000 | 30,000 | isolated · retires 2027-03-31 |
| Standard_M192idms_v2 | 192 | 4,096 | 4,096 | 80,000 | 2,000 | 30,000 | isolated · retires 2027-03-31 |

## Msv3 MM — 7 sizes · MM · Sapphire Rapids · diskless

| Size Name | vCPUs | Memory (GiB) | Premium IOPS | Premium MBps | Net Mbps |
| --- | --- | --- | --- | --- | --- |
| Standard_M12s_v3 | 12 | 240 | 16,250 | 390 | 4,000 |
| Standard_M24s_v3 | 24 | 480 | 32,500 | 780 | 8,000 |
| Standard_M48s_1_v3 | 48 | 974 | 65,000 | 1,560 | 16,000 |
| Standard_M96s_1_v3 | 96 | 974 | 65,000 | 1,560 | 16,000 |
| Standard_M96s_2_v3 | 96 | 1,946 | 130,000 | 3,120 | 30,000 |
| Standard_M176s_3_v3 | 176 | 2,794 | 130,000 | 4,000 | 40,000 |
| Standard_M176s_4_v3 | 176 | 3,892 | 130,000 | 4,000 | 40,000 |

## Mdsv3 MM — 7 sizes · MM · Sapphire Rapids · 400 GiB local NVMe

| Size Name | vCPUs | Memory (GiB) | Temp GiB | Premium IOPS | Premium MBps | Net Mbps |
| --- | --- | --- | --- | --- | --- | --- |
| Standard_M12ds_v3 | 12 | 240 | 400 | 16,250 | 390 | 4,000 |
| Standard_M24ds_v3 | 24 | 480 | 400 | 32,500 | 780 | 8,000 |
| Standard_M48ds_1_v3 | 48 | 974 | 400 | 65,000 | 1,560 | 16,000 |
| Standard_M96ds_1_v3 | 96 | 974 | 400 | 65,000 | 1,560 | 16,000 |
| Standard_M96ds_2_v3 | 96 | 1,946 | 400 | 130,000 | 3,120 | 30,000 |
| Standard_M176ds_3_v3 | 176 | 2,794 | 400 | 130,000 | 4,000 | 40,000 |
| Standard_M176ds_4_v3 | 176 | 3,892 | 400 | 130,000 | 4,000 | 40,000 |

## Msv3 HM — 5 sizes · HM · Sapphire Rapids · diskless

| Size Name | vCPUs | Memory (GiB) | Premium IOPS | Premium MBps | Ultra IOPS | Ultra MBps | Net Mbps |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Standard_M416s_6_v3 | 416 | 5,696 | 130,000 | 4,000 | 130,000 | 4,000 | 40,000 |
| Standard_M416s_8_v3 | 416 | 7,600 | 130,000 | 4,000 | 130,000 | 4,000 | 40,000 |
| Standard_M624s_12_v3 | 624 | 11,400 | 130,000 | 4,000 | 130,000 | 4,000 | 40,000 |
| Standard_M832s_12_v3 | 832 | 11,400 | 130,000 | 4,000 | 260,000¹ | 8,000¹ | 100,000 |
| Standard_M832is_16_v3 | 832 | 15,200 | 130,000 | 4,000 | 260,000¹ | 8,000¹ | 100,000 |

## Mdsv3 HM — 5 sizes · HM · Sapphire Rapids · 400 GiB local NVMe

| Size Name | vCPUs | Memory (GiB) | Temp GiB | Premium IOPS | Premium MBps | Ultra IOPS | Ultra MBps | Net Mbps |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Standard_M416ds_6_v3 | 416 | 5,696 | 400 | 130,000 | 4,000 | 130,000 | 4,000 | 40,000 |
| Standard_M416ds_8_v3 | 416 | 7,600 | 400 | 130,000 | 4,000 | 130,000 | 4,000 | 40,000 |
| Standard_M624ds_12_v3 | 624 | 11,400 | 400 | 130,000 | 4,000 | 130,000 | 4,000 | 40,000 |
| Standard_M832ds_12_v3 | 832 | 11,400 | 400 | 130,000 | 4,000 | 260,000¹ | 8,000¹ | 100,000 |
| Standard_M832ids_16_v3 | 832 | 15,200 | 400 | 130,000 | 4,000 | 260,000¹ | 8,000¹ | 100,000 |

¹ NVMe figures. SCSI controller option: 215,000 IOPS / 6,000 MBps for the two 832 sizes.

## Mdsv3 VHM — 3 sizes · VHM · Sapphire Rapids 8490H · 32 TB-class · isolated

| Size Name | vCPUs | Memory (GiB) | Temp GiB | Premium IOPS | Premium MBps | Ultra IOPS | Ultra MBps | Net Mbps | Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Standard_M896ixds_24_v3 | 896 | 23,088 | 4,096 | 110,000 | 8,000 | 200,000 | 8,000 | 185,000 | SMT off |
| Standard_M896ixds_32_v3 | 896 | 30,400 | 4,096 | 110,000 | 8,000 | 200,000 | 8,000 | 185,000 | MS-recommended 32 TB S/4HANA, SMT off |
| Standard_M1792ixds_32_v3 | 1,792 | 30,400 | 4,096 | 110,000 | 8,000 | 200,000 | 8,000 | 185,000 | SMT on, analytical |

## Mbsv3 (storage-boosted) — 8 sizes · MM · Sapphire Rapids · diskless · up to 650k IOPS / 10 GBps

| Size Name | vCPUs | Memory (GiB) | Premium IOPS | Premium MBps | Ultra IOPS | Ultra MBps | Net Mbps |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Standard_M16bs_v3 | 16 | 128 | 44,000 | 1,000 | 64,000 | 1,000 | 8,000 |
| Standard_M32bs_v3 | 32 | 256 | 88,000 | 2,000 | 88,000 | 2,000 | 16,000 |
| Standard_M48bs_v3 | 48 | 384 | 88,000 | 2,000 | 120,000 | 2,000 | 16,000 |
| Standard_M64bs_v3 | 64 | 512 | 88,000 | 2,000 | 160,000 | 2,000 | 16,000 |
| Standard_M96bs_v3 | 96 | 768 | 260,000 | 4,000 | 260,000 | 4,000 | 25,000 |
| Standard_M128bs_v3 | 128 | 1,024 | 260,000 | 4,000 | 400,000 | 4,000 | 40,000 |
| Standard_M176bs_v3 | 176 | 1,536 | 260,000 | 6,000 | 650,000 | 6,000 | 50,000 |
| Standard_M416bs_v3 | 416 | 3,800 | 240,000 | 8,000 | 550,000 | 10,000 | 50,000 |

## Mbdsv3 (storage-boosted) — 11 sizes · MM · Sapphire Rapids · local disk

| Size Name | vCPUs | Memory (GiB) | Temp GiB | Premium IOPS | Premium MBps | Ultra IOPS | Ultra MBps | Net Mbps |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Standard_M16bds_v3 | 16 | 128 | 400 | 44,000 | 1,000 | 64,000 | 1,000 | 8,000 |
| Standard_M32bds_v3 | 32 | 256 | 400 | 88,000 | 2,000 | 88,000 | 2,000 | 16,000 |
| Standard_M48bds_v3 | 48 | 384 | 400 | 88,000 | 2,000 | 120,000 | 2,000 | 16,000 |
| Standard_M64bds_v3 | 64 | 512 | 400 | 88,000 | 2,000 | 160,000 | 2,000 | 16,000 |
| Standard_M96bds_v3 | 96 | 768 | 400 | 260,000 | 4,000 | 260,000 | 4,000 | 25,000 |
| Standard_M128bds_v3 | 128 | 1,024 | 400 | 260,000 | 4,000 | 400,000 | 4,000 | 40,000 |
| Standard_M176bds_v3 | 176 | 1,536 | 400 | 260,000 | 6,000 | 650,000 | 6,000 | 50,000 |
| Standard_M64bds_1_v3 | 64 | 1,397 | 3,000 | 130,000 | 6,000 | 160,000 | 6,000 | 20,000 |
| Standard_M96bds_2_v3 | 96 | 1,946 | 4,500 | 130,000 | 8,000 | 260,000 | 8,000 | 20,000 |
| Standard_M128bds_3_v3 | 128 | 2,794 | 6,000 | 260,000 | 8,000 | 400,000 | 10,000 | 40,000 |
| Standard_M176bds_4_v3 | 176 | 3,892 | 8,000 | 260,000 | 8,000 | 650,000 | 10,000 | 40,000 |

---

## Roll-up — 79 distinct M-family SKUs

| Compound family | # sizes | Sub-series included |
| --- | --- | --- |
| MM Mv1 | 14 | M-series |
| MM Mv2 | 15 | M208s_v2 (Skylake) + Msv2-MM (7) + Mdsv2-MM (7) |
| HM Mv2 | 4 | Msv2-HM Skylake (M208ms / M416s / M416s_8 / M416ms) |
| MM Mv3 | 33 | Msv3-MM (7) + Mdsv3-MM (7) + Mbsv3 (8) + Mbdsv3 (11) |
| HM Mv3 | 10 | Msv3-HM (5) + Mdsv3-HM (5) |
| VHM Mv3 | 3 | Mdsv3-VHM |

## Cross-cloud generation mapping (for the equivalency/competitive surfaces)

| Azure | Processor | AWS analog | GCP analog |
| --- | --- | --- | --- |
| Mv1 | Haswell / Cascade Lake | x1 / x1e / r5 | m1 |
| Mv2 (Skylake HM) | Skylake 8180M | u-1tb1 / x1e | m2 |
| Mv2 (Cascade MM) | Cascade Lake 8280 | x2idn / r6i | m2 |
| Mv3 | Sapphire Rapids (8490H for VHM) | r7iz / x2idn / u7i | m3 / m4 |

> Pricing: PAYG seeded for Mv1 / Mv2-HM / Msv3 / Mdsv3 (parity-mirrored for the
> Mdsv3 `d` variants). The Msv2/Mdsv2-MM, Mbsv3/Mbdsv3, and Mdsv3-VHM sizes ship
> WITHOUT rates (shown as "—") rather than fabricate — true up via the VM
> Library Excel upload or a Retail Prices API refresh.
