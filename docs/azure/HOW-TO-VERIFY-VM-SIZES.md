# HOW TO: Accurately capture ALL Azure VM sizes (the runbook)

> **Why this exists.** The VM catalog is a **native, load-bearing feature** of this
> dashboard — every simulation, cost projection, and fungibility decision is only
> as correct as the catalog behind it. A missing size or a wrong memory tier
> silently produces wrong answers. This runbook is the repeatable procedure for
> capturing a provider's VM sizes **completely and accurately** from the vendor's
> own published docs. It was written after a real incident: the Azure M-family was
> missing 36 of 79 SKUs and had an invented memory tier. Follow it exactly.
>
> Scope today: **Azure** (fully worked example below). The same method extends to
> **GCP** and **AWS** — see [§7](#7-extending-to-gcp--aws).

---

## 0. Golden rules

1. **The vendor's docs are the only source of truth.** Not memory, not training
   data, not "this looks right." Every number must trace to a fetched page.
2. **Start from the family INDEX page, never a single size page.** The index
   enumerates every sub-series. Fetching one size page (e.g. `msv3-hm-series`)
   and assuming it's the whole family is exactly how we missed Mdsv3, Msv2-MM,
   Mbsv3, and the 32 TB VHM line.
3. **Tiers come from the vendor's own sub-series names, sanity-checked by a
   numeric boundary** — never invent a tier the vendor doesn't publish, and never
   let a boundary split a sub-series the vendor treats as one.
4. **Don't fabricate.** If a spec (or price) isn't published, leave it
   `undefined` — the app renders "—". A guessed number is worse than a blank.
5. **One SKU = one catalog row.** NVMe vs SCSI controller options share a size
   name → one row. Region copies are expanded by the seed, not authored.
6. **Every change re-generates the source-of-truth artifacts** (markdown + Excel)
   and **bumps the seed version + migration** so existing users get corrected.

---

## 1. The Azure documentation map

Azure publishes VM sizes at:

```
https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/<category>/<family>
```

For each VM **family**, there is a `*-family` **index page** that lists every
sub-series with a one-line spec summary and a "View the full … page" link. THIS
is your starting point.

| Family | Category | Index page |
| --- | --- | --- |
| M (memory-optimized) | `memory-optimized` | `memory-optimized/m-family` |
| E (memory-optimized GP) | `memory-optimized` | `memory-optimized/e-family` |
| D (general purpose) | `general-purpose` | `general-purpose/d-family` |
| F (compute) | `compute-optimized` | `compute-optimized/f-family` |
| L (storage) | `storage-optimized` | `storage-optimized/l-family` |
| N (GPU) | `gpu-accelerated` | `gpu-accelerated/*` |

> The full category list is at `…/sizes/overview`. Each category page links its
> family index pages.

### Anatomy of a size page

Each sub-series page (e.g. `mdsv3-hm-series`) has:
- A **Host specifications** table (processor string, vCPU range, memory range,
  local storage, remote storage, network — the per-FAMILY envelope).
- A **Sizes in series** section with **tabs**: `Basics` (vCPU + memory),
  `Local Storage`, `Remote Storage`, `Network`, `Accelerators`.
- Some pages show **multiple tables per tab** (e.g. "… (NVMe)" and "… (SCSI)") —
  these are controller options for the SAME size names.
- A **Feature support** table + a **retirement note** if any sizes are sunsetting.

Append `?tabs=sizebasic` to land on the Basics tab. The WebFetch tool returns the
page as markdown including every table — fetch the page and extract verbatim.

---

## 2. Step-by-step procedure

### Step 1 — Enumerate every sub-series from the index page

Fetch the `*-family` index page and list EVERY sub-series it names. For Azure M
(captured 2026-05-31) that was **11**:

```
m-series (Mv1) · Msv2 High Memory (mv2-series) · Msv2 Medium Memory (msv2-mm)
Mdsv2 Medium Memory (mdsv2-mm) · Msv3 MM · Mdsv3 MM · Msv3 HM · Mdsv3 HM
Mdsv3 VHM · Mbsv3 · Mbdsv3
```

Write the list down before fetching anything else. If you skip this step you will
miss sub-series — that is the #1 failure mode.

### Step 2 — Fetch each sub-series page and extract all four spec tabs

For each sub-series, fetch the page and pull, **per size**:

| Field | From tab | UserVm field |
| --- | --- | --- |
| Size Name | Basics | `vmSizeName` |
| vCPUs | Basics | `vcpus` |
| Memory (GiB) | Basics | `memoryGib` |
| Temp/local disk GiB | Local Storage | `localStorageGiB` / `localDiskGib` |
| Local disk count | Local Storage | `localStorageDiskCount` |
| Local RR IOPS / MBps | Local Storage | `localStorageIopsRR` / `localStorageMbpsRR` |
| Max remote disks | Remote Storage | `remoteStorageDisks` |
| Max uncached Premium SSD IOPS / MBps | Remote Storage | `remoteStorageIopsPremium` / `remoteStorageMbpsPremium` |
| Max uncached Ultra/PSSDv2 IOPS / MBps | Remote Storage | `remoteStorageIopsUltra` / `remoteStorageMbpsUltra` |
| Max NICs | Network | `networkNicCount` |
| Max network Mbps | Network | `networkMbps` |
| Processor string | Host specifications | `processor` |
| Accelerator | Accelerators | `acceleratorType` (usually `None` for M) |

Capture the processor from the Host specifications row — it sets the
**generation** (see Step 4).

### Step 3 — Collapse controller variants; keep distinct SKUs

- "(NVMe)" and "(SCSI)" tables with **identical size names** → **one** catalog
  row each (same SKU). Note any spec difference (e.g. Azure M832 NVMe ultra
  260k/8000 vs SCSI 215k/6000) in the markdown; store the NVMe figure in the seed.
- A `d`/`ds` in the name (e.g. `M416ds_6_v3` vs `M416s_6_v3`) is a **different
  SKU** (local-disk variant) — separate row.
- A `b`/`bs`/`bds` (e.g. `M16bs_v3`) is the storage-**boosted** line — separate
  SKUs, different remote-IOPS envelope.
- An `i` (e.g. `M192is_v2`, `M896ixds_32_v3`) marks an **isolated** size
  (dedicated host). Include it; if the page has a retirement note, record the
  date in `notes`.

### Step 4 — Assign generation + memory tier

**Generation** (`vmGeneration`) from the processor:

| Processor | Azure gen |
| --- | --- |
| Haswell E7-8890 v3 / Cascade Lake 8280M | `Mv1` |
| Skylake 8180M | `Mv2` |
| Cascade Lake 8280 | `Mv2` |
| Sapphire Rapids (incl. 8490H) | `Mv3` |

> Note a single generation can span two processors (Mv2 = Skylake HM **and**
> Cascade Lake MM). That's expected — `processor` is per-row.

**Memory tier** — Azure's M-family publishes **three** tiers, named in the
sub-series titles ("Medium Memory", "High Memory", "Very High Memory"). Derive
the tier from total memory with boundaries that respect those names:

```
MM  (Medium Memory)     ≤ 4 TiB   (≤ 4096 GiB)
HM  (High Memory)       4–16 TiB  (4097 … 16384 GiB)
VHM (Very High Memory)  > 16 TiB  (> 16384 GiB)
```

**How the boundaries were chosen (and the two failure modes to avoid):**
- MM tops out at 3,892 GiB across all MM sub-series; HM starts at 5,696 GiB → the
  4 TiB cut is unambiguous.
- HM tops out at 15,200 GiB (Msv3/Mdsv3 HM); VHM (Mdsv3-VHM) starts at 23,088 GiB
  → the 16 TiB cut keeps the entire HM sub-series in HM.
- ❌ **Failure mode A** (`> 8 TiB → VHM`, the original bug): tears the single
  "Msv3 HM" sub-series in two, so HM Mv3 shows 2 of its 5 sizes.
- ❌ **Failure mode B** (dropping VHM entirely): loses the real 32 TB Mdsv3-VHM
  line. Both were committed and corrected — don't repeat either.

The tier label flows into `UserVm.memoryCategory`, which `vmFamily()` reads to
emit the compound family slug `"<tier> M<gen>"` (e.g. `HM Mv3`).

### Step 5 — Write the rows into the seed

Edit `src/data/azureMSeriesSeed.ts`:
- One array constant per sub-series (`M_SERIES_MSV3_HM`, `M_SERIES_MDSV3_VHM`, …),
  ordered to match the doc tables so future diffs are reviewable.
- Use the `mkM(name, gen, vcpus, memGiB, spec)` helper. `spec` carries
  `local?`, `remote`, `network`, `cpu`, and optional `note`.
- Add the array to the `M_SERIES_SPECS` roll-up.
- `memoryCategoryLabel(memoryGib)` is the SINGLE place the tier boundary lives.
- **Pricing:** only fill `M_SERIES_PRICES_EAST_US_2[...]` from a real public rate.
  No rate → omit (the row ships without `hourlyUsd`; Finance shows "—"). Parity-
  mirroring a sibling SKU's rate is acceptable ONLY when documented in a comment.

### Step 6 — Propagate to existing users (migration)

The additive seed merge (`mergeSeedIntoUserVms`) only ADDS new
`(provider, vmSizeName, region)` rows — it never edits existing rows. So a spec or
**tier** correction to an already-seeded SKU will NOT reach a returning user
unless you also migrate. Two levers:
- **Bump `PUBLIC_SEED_VERSION`** — triggers the additive merge (picks up brand-new
  SKUs) on next boot.
- **Boot re-tier migration** in `src/state/AppContext.tsx`
  (`vmcap:azureMTierVersion`) — re-derives `memoryCategory` from `memoryGib` for
  every persisted Azure M row. **Bump its TARGET** whenever the tier boundaries
  change. Safe because native VM rows are read-only (users mutate the catalog only
  via wholesale Excel upload).

### Step 7 — Regenerate the source-of-truth artifacts

```bash
# from v4/
node_modules/.bin/vite-node scripts/build_azure_m_ssot.mjs
```

This rebuilds `public/azure-m-series-source-of-truth.xlsx` **from the live seed**
(so it can't drift) and prints the family roll-up. Then update the human-readable
markdown `docs/azure/memory-optimized.md` to match (tables + roll-up + sources).

### Step 8 — Verify

- `node_modules/.bin/tsc --noEmit` — clean.
- `node_modules/.bin/vitest run` — engine/UI tests green (the engine uses a
  size-key-then-class-key fallback, so class-keyed test matrices still pass).
- In the app (clear seed state + **restart the dev server** so the reducer init
  re-reads the seed — HMR alone won't): confirm the expected per-family counts in
  the Fungibility/BoM family chips.

---

## 3. Completeness checklist (run before declaring done)

- [ ] Started from the `*-family` index page and listed every sub-series.
- [ ] Fetched every sub-series page (not just the ones named in the bug report).
- [ ] Captured all four spec tabs per size (Basics / Local / Remote / Network).
- [ ] Captured the processor → assigned the correct generation.
- [ ] Tier boundaries don't split any vendor sub-series; no invented tier.
- [ ] `d`/`b`/`i` variants treated as distinct SKUs; NVMe/SCSI collapsed to one.
- [ ] Isolated/retiring sizes carry a `notes` date.
- [ ] No fabricated specs or prices (blanks where unpublished).
- [ ] Seed roll-up count matches the docs roll-up count.
- [ ] `PUBLIC_SEED_VERSION` bumped; re-tier migration target bumped if tiers moved.
- [ ] Excel regenerated from the seed; markdown updated; both match the seed.
- [ ] tsc clean, tests green, app shows expected family counts after a clean restart.

---

## 4. The Azure M-family result (reference snapshot, 2026-05-31)

**79 distinct SKUs across 11 sub-series.** Compound families:

| Family | # | Sub-series |
| --- | --- | --- |
| MM Mv1 | 14 | M-series |
| MM Mv2 | 15 | M208s_v2 + Msv2-MM (7) + Mdsv2-MM (7) |
| HM Mv2 | 4 | Msv2-HM (Skylake) |
| MM Mv3 | 33 | Msv3-MM (7) + Mdsv3-MM (7) + Mbsv3 (8) + Mbdsv3 (11) |
| HM Mv3 | 10 | Msv3-HM (5) + Mdsv3-HM (5) |
| VHM Mv3 | 3 | Mdsv3-VHM (32 TB) |

Full per-size tables: [`memory-optimized.md`](memory-optimized.md). Excel:
`public/azure-m-series-source-of-truth.xlsx`.

---

## 5. Files involved (Azure M)

| File | Role |
| --- | --- |
| `src/data/azureMSeriesSeed.ts` | The seed (single code source). `memoryCategoryLabel` = tier boundary. |
| `docs/azure/memory-optimized.md` | Human-readable source of truth (per-size tables). |
| `public/azure-m-series-source-of-truth.xlsx` | Break-glass Excel, generated from the seed. |
| `scripts/build_azure_m_ssot.mjs` | Regenerates the Excel from the live seed. |
| `src/state/AppContext.tsx` | Boot migrations (`vmcap:azureMTierVersion`, seed-version merge). |
| `src/utils/vmTaxonomy.ts` | `vmFamily()` compound slug + `AZURE_MEM_SHORT` tier map. |

---

## 6. Known Azure gotchas (the things that bit us)

1. **Sub-series live on separate pages.** `Msv3 HM` and `Mdsv3 HM` are two pages;
   `Medium Memory` and `High Memory` are different pages from the same generation.
2. **The `mv2-series` URL is the Skylake "High Memory" page** — the Cascade Lake
   "Medium Memory" Mv2 sizes are on `msv2-mm-series` / `mdsv2-mm-series`.
3. **VHM is real but tiny + far away** (32 TB Mdsv3-VHM, 3 sizes). Easy to miss
   because it's a separate page and there are only three sizes.
4. **`Mbsv3`/`Mbdsv3` are "storage-boosted"** — same memory band as MM but very
   different remote IOPS. We file them under MM by memory; the `b` in the name is
   the only family-slug-level signal.
5. **Retirements:** the four `M192i*_v2` isolated sizes retire 2027-03-31 — kept
   with a `notes` flag because they're still deployable today.

---

## 7. Extending to GCP & AWS

The method is identical; only the doc locations + naming differ.

### GCP
- Source: `https://cloud.google.com/compute/docs/<family>` machine-series pages
  (e.g. `general-purpose`, `memory-optimized`, `compute-optimized`). The
  memory-optimized analogs to Azure M are **m1, m2, m3, m4** (and the
  `*-megamem` / `*-ultramem` / `*-hypermem` shapes).
- Project files: `docs/gcp/` (source of truth), `src/data/gcpMSeriesAnalogSeed.ts`,
  `src/data/gcpRegionAvailability.ts`.
- Tiering: GCP doesn't use MM/HM/VHM — its families ARE the generations (m1…m4).
  Keep GCP family = the machine series; do NOT force Azure's tier nomenclature on it.
- Build a `scripts/build_gcp_*_ssot.mjs` mirroring the Azure script; add
  `docs/gcp/memory-optimized.md` per-size tables + an Excel SSoT.

### AWS
- Source: `https://docs.aws.amazon.com/ec2/latest/instancetypes/` (memory-optimized
  = the `R`, `X`, `U`/`high-memory`, `z1d` families) + the EC2 instance-types
  pages. The Azure-M analogs are **x1/x1e, x2idn/x2iedn, r6i/r7i/r8i, u-*/u7i**
  (high-memory).
- Project files: `docs/aws/` (source of truth — `memory-optimized.md` exists),
  `src/data/awsMSeriesAnalogSeed.ts`, `src/data/awsRegionAvailability.ts`.
- Tiering: AWS families already encode generation + size; family = the instance
  family (`r7i`, `x2idn`, `u7i`). Don't invent tiers.
- Build `scripts/build_aws_*_ssot.mjs`; add per-size tables to `docs/aws/`.

### Cross-cloud equivalency
After each provider's catalog is accurate, reconcile the analog map in
`src/data/equivalencySeed.ts` (and the spec-based fallback) so the Competitive
page lights up clean one-to-one matches. The Azure↔AWS↔GCP generation mapping
table is maintained at the bottom of each provider's `memory-optimized.md`.

---

## 8. When to re-run this

- Quarterly, or whenever Azure/GCP/AWS announces new sizes (the MS pages carry an
  `ms.date` / `ms.update-cycle: 1095-days` in their frontmatter — check it).
- Any time a user reports a missing size or wrong mapping — start at Step 1, do
  NOT patch a single size in isolation.
- After any seed edit, Step 7 (regenerate Excel) + Step 8 (verify) are mandatory.
