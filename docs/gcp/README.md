# GCP Compute Engine doc bundle — source of truth for the GCP seed

> Captured 2026-05-27. The TypeScript seed in
> `src/data/gcpMSeriesAnalogSeed.ts` + the per-region availability map in
> `src/data/gcpRegionAvailability.ts` are derived from these files.

## File map

| File | Source page | Used by |
| --- | --- | --- |
| `regions-and-machine-types.md` | https://docs.cloud.google.com/compute/docs/regions-zones | `gcpRegionAvailability.ts` — per-region machine-series sets + family ↔ category table |

## Where each fact lives in code

- **Family → category routing**: `src/utils/vmCategory.ts` `categorizeGcpFamily()`.
- **vCPU sizes, memory ratios, network bandwidth, accelerators, CPU model strings**: `FAMILIES` array in `src/data/gcpMSeriesAnalogSeed.ts`. Supports `sizeMems` (memory-fixed families like M-series ultramem + X4), `shape` (predefined-shape SKU suffix — `n2-standard-16`, `m3-ultramem-128`, etc.).
- **Per-region availability**: `GCP_REGION_FAMILIES` in `src/data/gcpRegionAvailability.ts`. One `Set<family>` per region, transcribed from the doc.
- **Regional pricing multipliers (PAYG ratios vs us-central1)**: `REGION_MULT` in `gcpMSeriesAnalogSeed.ts`.

## Refresh workflow

1. Pull the latest version of the GCP regions-and-zones page.
2. Replace `regions-and-machine-types.md`.
3. If a region added/removed a series → update `GCP_REGION_FAMILIES`.
4. If a new family launched → add a `FAMILIES[]` entry + update `categorizeGcpFamily`.
5. `tsc --noEmit && vitest run`.
6. Bump `SEED_DATA_AS_OF` so the in-app disclaimer banner reflects the refresh.

## Coverage as of v2.17.8

- **42 regions** × **24 active families** = **3,458 GCP rows**.
- All categories covered: General Purpose (E2, N1, N2, N2D, N4, T2D) / Compute (C2, C2D, C3, C3D, C4, C4A, C4D) / Memory (M1, M2, M3, X4) / Storage (Z3) / HPC (H3) / GPU (A2, A3, A4, G2, G4).
- T2A (Arm) + M4 (newer Sapphire Rapids memory) are speced but not yet listed in any region by the doc — they'll emit automatically the moment a region picks them up.
- All 42 published GCP regions present (Africa / APAC / Europe / Middle East / North America / South America / US).
