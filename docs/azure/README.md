# Azure VM doc bundle — source of truth for the Azure seed

> Source-of-truth reference for Azure VM sizes, captured from Microsoft Learn.
> The TypeScript seeds in `src/data/azureMSeriesSeed.ts` (+ `azureSeed.ts`,
> `azureGeneralPurposeSeed.ts`) are derived from these files. If Microsoft
> updates the docs, **refresh this folder first, then update the TS seed to
> match** — following the runbook below.
>
> This folder did not exist before v2.19.20 (only `docs/aws/` and `docs/gcp/`
> had bundles). It was created during the Azure M-family hygiene incident.

## File map

| File | Purpose |
| --- | --- |
| `HOW-TO-VERIFY-VM-SIZES.md` | **The runbook.** Repeatable procedure for capturing ALL Azure VM sizes accurately from Microsoft Learn — read this FIRST before touching the catalog. Extensible to GCP + AWS. |
| `memory-optimized.md` | M-family per-size source of truth — every M-series SKU (79 across 11 sub-series), full specs, tiering model, source URLs, cross-cloud mapping. |

## Companion artifacts (outside this folder)

| Artifact | Role |
| --- | --- |
| `public/azure-m-series-source-of-truth.xlsx` | Break-glass Excel — generated FROM the live seed (can't drift). |
| `scripts/build_azure_m_ssot.mjs` | Regenerates the Excel via `vite-node`. Run after any M-series seed edit. |
| `src/data/azureMSeriesSeed.ts` | The seed (code source of truth). `memoryCategoryLabel` = the MM/HM/VHM tier boundary. |
| `src/utils/vmTaxonomy.ts` | `vmFamily()` compound family slug (`<tier> M<gen>`) + `AZURE_MEM_SHORT`. |
| `src/state/AppContext.tsx` | Boot migrations — seed-version additive merge + `vmcap:azureMTierVersion` re-tier. |

## Coverage status

- **M family (memory-optimized):** ✅ complete + verified 2026-05-31 — 79 SKUs, 11 sub-series.
- **General purpose / compute / storage / GPU (D, E, F, L, N families):** seeded
  (`azureSeed.ts`, `azureGeneralPurposeSeed.ts`) but **not yet re-verified** with
  the runbook. Next hygiene targets.

## Tiering (M-family) — quick reference

Azure M-family has three memory tiers; the app derives them by total memory:

```
MM  (Medium Memory)     ≤ 4 TiB
HM  (High Memory)       4–16 TiB
VHM (Very High Memory)  > 16 TiB   (Mdsv3-VHM 32 TB only)
```

Compound family slugs: `MM Mv1 · MM Mv2 · MM Mv3 · HM Mv2 · HM Mv3 · VHM Mv3`.
See `memory-optimized.md` for the full rationale and `HOW-TO-VERIFY-VM-SIZES.md`
§2 Step 4 for how tiers/generations are assigned.
