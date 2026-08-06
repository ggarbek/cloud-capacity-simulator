# Cloud rate ingestion

Offline pipeline that pulls **VM rate data per region** from the cloud providers'
public pricing APIs, normalizes each to an hourly USD rate, and writes **one
sharded JSON per region** under `public/rates/<provider>/`. The app lazy-loads
only the region(s) it's pricing against — so "all SKUs × all regions" (millions
of rows) never enters the bundle or `localStorage`.

These scripts run **on a machine with the credentials**, not in the browser:
provider keys must never ship in a client-side bundle, and CORS blocks
browser-direct calls for AWS/GCP anyway. The output is static data the app
serves like any other asset.

## Status

| Provider | Data | Source | Auth | Script | State |
|----------|------|--------|------|--------|-------|
| **Azure** | rates (PAYG/1yr/3yr) | Retail Prices API | ✅ **none** | `azure-prices.mjs` | **working** |
| **Azure** | network (Mbps) | docs on GitHub | ✅ **none** | `azure-network.mjs` | **working** |
| **Azure** | specs (vCPU/RAM/disk/GPU) | Resource SKUs API | 🔑 Azure login | `azure-specs.mjs` | **ready (needs your login)** |
| **AWS**   | rates (on-demand/1yr/3yr) | Price List **Bulk** API | ✅ **none** | `aws-prices.mjs` | **working** |
| **AWS**   | specs + network | Price List Bulk (product attrs) | ✅ **none** | `aws-specs.mjs` | **working** |
| **GCP**   | specs + network | family rules + docs | ✅ **none** | `gcp-specs.mjs` | **working** |
| **GCP**   | rates | Cloud Billing Catalog API | 🔑 API key (free) | `gcp-prices.mjs` | **ready (needs a key)** |

**Keyless coverage:** Azure rates+network, **all of AWS** (rates+specs+network),
and GCP specs+network run with **no credentials**. Only Azure specs (an `az login`)
and GCP rates (a free API key) need auth — every other field is sourced today.

### Rates vs. specs

No single source has everything. Three pulls, joined by SKU name at load time:
- **Specs** (vCPU, RAM, data-disks, GPU) — `azure-specs.mjs` (Resource SKUs API,
  authenticated) → `_specs.json`. Region-independent, so one file.
- **Network** (Mbps) — `azure-network.mjs` (docs, keyless) → `_network.json`.
  Region-independent. The one field no API exposes.
- **Rates** (PAYG/1yr/3yr) — `azure-prices.mjs` (keyless) → `<region>.json`, one
  per region.
- Loader: `_specs.json` ⨝ `_network.json` ⨝ `<region>.json` = a complete,
  fully-sourced catalog for that region, replacing the hand-transcribed
  `src/data/*Seed.ts` snapshot.

## Azure network (keyless — from the docs)

Per-size **Max Network Bandwidth (Mbps)** exists in **no** Azure API — only in
the docs. But the docs are open-source markdown on GitHub
(`MicrosoftDocs/azure-compute-docs`) with a structured network table per series,
keyed by exact SKU. This parses them — replacing the interpolated network
estimates in `src/data/*Seed.ts` with real published values.

```bash
node scripts/ingest/azure-network.mjs
```

Walks all ~151 `*-series.md` files (keyless, via the GitHub tree API + raw
files), parses the bandwidth table (handles both `Mbps` and `Mb/s` header
dialects; takes the max number per cell for base/burst pairs), and writes
`public/rates/azure/_network.json` =
`{ source, generatedAt, seriesWithoutTable: [...], mbps: { "Standard_D2s_v5": 12500, … } }`.

Coverage: ~1,008 SKUs across 124 families (validated: D2s_v5 = 12,500,
E104is_v5 = 100,000 — match the docs). The ~27 families with no structured
table (older GPU N-series, confidential DC, FPGA) are listed in
`seriesWithoutTable` and fall back to the seed estimate — **logged, never
silent**.

### Coverage, audit & gap report

```bash
node scripts/ingest/azure-network-gaps.mjs
```
Enumerates the FULL documented size universe (every "Size Name" row across all
series + their `[!INCLUDE]` spec files), captures vCPU + bandwidth per size,
audits the extracted values, and writes **`azure-network-gaps.md`** (committed).

Current: **1,066 / 1,125 sizes covered (94.8%)**. The audit reports value-range
checks (0 out-of-range), within-family vCPU→bandwidth monotonicity (2 anomalies,
both confirmed as genuine Azure-published quirks — e.g. E20s_v4 < E16s_v4), and
anchor spot-checks (6/6 exact). Four extractor bugs were found + fixed via this
audit — `Max Bandwidth` header (no "Network" word, ~16 GPU families), `Mb/s` unit
(v6/v7), `[!INCLUDE]`-hosted tables, and **bold** cells (FPGA) — each had been
silently dropping real data (coverage 90.9% → 94.8%).

The 59 remaining are **irreducible** — no bandwidth published in any Azure source.
9 families, listed size-by-size with the reason: burstable `bv1` (bursts, no fixed
ceiling), confidential `DC*` (not published), older GPU `ncv3`/`nd`/`nv` (not
published). Disposition per `azure-network-gaps.md`: keep on the seed estimate or
assign a flagged derived estimate — **never presented as measured**.

## Azure (working, keyless)

```bash
node scripts/ingest/azure-prices.mjs                     # every region (slow, ~MBs)
node scripts/ingest/azure-prices.mjs eastus2 westeurope  # just these regions
```

Source: `https://prices.azure.com/api/retail/prices` (public, no auth, OData,
1000 rows/page via `NextPageLink`). PAYG = the base Consumption compute meter
(Spot / Low Priority / Windows excluded); reservations are term-totals divided
to hourly (1yr ÷ 8760, 3yr ÷ 26280).

Output: `public/rates/azure/<region>.json` =
`{ "Standard_D4ads_v5": { "payg": 0.206, "ri1y": 0.121575, "ri3y": 0.078272 }, … }`
plus `_index.json` (region list + SKU counts + `generatedAt`).

## Azure specs (authenticated — one-time login)

Gives vCPU / RAM / data-disks / GPU for every size + its region availability.

**Account setup (once):**
1. Create a free Azure account → https://azure.microsoft.com/free (needs a card
   for identity verification; the Resource SKUs API is free to call — this won't
   incur charges).
2. Install the Azure CLI → https://aka.ms/InstallAzureCLI
   (macOS: `brew install azure-cli`).
3. `az login` — opens a browser, sign in once.

**Run:**
```bash
node scripts/ingest/azure-specs.mjs
```
Output: `public/rates/azure/_specs.json` =
`{ "Standard_D4ads_v5": { "vcpus": 4, "memoryGib": 16, "maxDataDisks": 8,
"gpus": null, "acceleratedNetworking": true, "premiumIO": true,
"regions": ["eastus2", …] }, … }` + `generatedAt`.

(For CI, skip `az login` and set `AZURE_TENANT_ID` / `AZURE_CLIENT_ID` /
`AZURE_CLIENT_SECRET` / `AZURE_SUBSCRIPTION_ID` from a service principal instead.)

## AWS — fully keyless (Price List **Bulk** API)

No IAM keys. The public Bulk API carries rates AND specs AND network performance.

```bash
node scripts/ingest/aws-prices.mjs                 # rates, per region
node scripts/ingest/aws-prices.mjs us-east-1 eu-west-1
node scripts/ingest/aws-specs.mjs                  # specs + network (one region suffices)
```

- **Rates** (`aws-prices.mjs`): region index at
  `https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonEC2/current/region_index.json`;
  per-region offer **streamed as CSV** (~270 MB, row-per-rate) — parsed line-by-line
  so memory stays flat (the ~1 GB JSON variant is avoided). Base rate = Linux /
  Shared tenancy / no pre-installed SW / Used; reservations = Standard **No-Upfront**
  1yr/3yr (already a pure hourly figure — exact, no amortization). Output:
  `public/rates/aws/<region>.json` = `{ "m7i.xlarge": { payg, ri1y, ri3y }, … }`.
  Verified: `m7i.xlarge` us-east-1 = `{0.2016, 0.13336, 0.09145}`.
- **Specs + network** (`aws-specs.mjs`): the Bulk offer's `products.<sku>.attributes`
  give `vcpu`, `memory`, `networkPerformance`, `gpu`, `storage`. To be EXTENSIVE,
  it **unions 14 regions** (commercial across every geo + GovCloud + China via the
  `cn` partition endpoint) so region-exclusive types aren't missed → **1,380 types**
  (vs 1,356 from us-east-1 alone; the +24 are newest GPU/HPC families that launch
  outside Virginia first — `g7.*`, `x8aedz.*`, `hpc7a.*`, …). `networkPerformance` →
  Mbps ("X Gigabit"→×1000, "Up to X" = ceiling, flagged). Output: `_specs.json` +
  `_network.json`. Verified: `m7i.xlarge` = 4 vCPU / 16 GiB / 12500 Mbps.
- **Coverage + audit** (`aws-coverage.mjs` → `aws-coverage.md`, committed): mirrors
  the Azure gap report. 1,380 types — **100% specs**, **95.9% numeric network**
  (574 "Up to" ceilings), 8/8 anchor spot-checks, 0 out-of-range. Network gaps
  (flag, don't fabricate — see `BACKLOG.md`): 49 legacy types textual-only
  (c1/c3/c4/d2/g2/i2/m1/m2/m3/m4/p2/r3/t1/t2/x1) + 8 `mac*.metal` with no value.

## GCP — specs+network keyless, rates need a free key

```bash
node scripts/ingest/gcp-specs.mjs                  # specs + network, KEYLESS
GCP_API_KEY=… node scripts/ingest/gcp-prices.mjs   # rates, needs the key
```

- **Specs + network** (`gcp-specs.mjs`, keyless): GCP predefined types are
  deterministic (`<family>-<class>-<vCPUs>`, memory = vCPU × class ratio), so the
  matrix is generated from documented family rules + the published per-vCPU egress
  table (`cloud.google.com/compute/docs/network-bandwidth`). 322 types / 22 families;
  GPU families (A2/A3/A4/G2/G4) + custom types excluded (non-uniform shapes — need
  the per-type API). Each row is labeled `source: 'family-rule'` / `networkSource:
  'doc-rule'`. Verified: `n2-standard-8` = 8 vCPU / 32 GiB / 16000 Mbps.
- **Rates** (`gcp-prices.mjs`): there is **no keyless GCP pricing source** (the old
  cloudpricingcalculator JSON is dead/404). The Cloud Billing Catalog API
  (`cloudbilling.googleapis.com/v1/services/6F81-5844-456A/skus`) needs a **free API
  key** — public pricing needs no IAM role. GCP prices as **component SKUs**
  (per-vCPU-hour + per-GB-RAM-hour), so the script reconstructs each machine type's
  hourly = `vCPU × core-SKU + RAM × ram-SKU`, per term. Get the key:
  1. Google Cloud console → create/select a project.
  2. Enable the **Cloud Billing API**.
  3. APIs & Services → Credentials → create an **API key** (restrict to Cloud
     Billing). `export GCP_API_KEY=…` — never commit it.

## Automation (the "set it and forget it" refresh)

The intended automation is a **GitHub Action** that runs the keyless Azure
ingest on a schedule and commits the refreshed shards (AWS/GCP join once their
secrets are added to the repo's Action secrets — safe there, never in the
bundle). A `workflow_dispatch`-only scaffold can be added when the lazy-loader
lands; until the app consumes the shards there's nothing to refresh yet.

## Wiring into the app (next phase — not yet built)

1. **Loader** `src/data/rates/loadRegionRates.ts` — `fetch('/rates/<provider>/
   <region>.json')`, cached in-memory, lazy (only the priced region(s)).
2. **Join** live rates onto `state.userVms` by SKU name at price time, so every
   `$` rollup (`regionScopedCatalog`, answers, scenario, metric families) reads
   API rates without the engine forking.
3. **Freshness UI** — show `_index.json`'s `generatedAt` ("rates as of …") per
   the seed-disclaimer pattern, plus a manual "refresh region" affordance.

The shards under `public/rates/` are **gitignored** — they're generated, not
hand-edited. Regenerate with the scripts above (or, later, CI).
