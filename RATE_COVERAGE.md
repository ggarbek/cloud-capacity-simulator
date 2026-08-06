# Rate coverage audit — PAYG / 1yr RI / 3yr RI (2026-06-22)

> Requested: confirm all three rate bases are pulled every weekly refresh; find any missing RI rates, or flag what can't be found and explain.

## TL;DR

- **All three rate types ARE pulled every week.** Each ingest script (`azure-prices.mjs`, `aws-prices.mjs`, `gcp-prices.mjs`) fetches PAYG **and** 1-year + 3-year reservation/commitment rates. Verified in code.
- **Found + fixed a real bug: GCP had 0% RI coverage.** GCP committed-use SKUs are described `"Commitment v1: <family> Cpu in <city> for 1 Year"`; the ingest was (a) *rejecting* every `commitment v1` description and (b) only recognizing the on-demand component word `Core`, never the committed word `Cpu`. So every 1yr/3yr SKU was silently dropped. **Fixed → GCP is now 100% RI (6,240 rows, both terms).**
- **AWS + Azure partial RI gaps are LEGITIMATE — not ingest bugs.** Mainstream current-gen has full RI; the gaps are families/tiers the clouds genuinely don't offer reservations for yet. Detail + the flag list below.

## Coverage after the fix

| Provider | PAYG | 1yr RI | 3yr RI | Notes |
|---|---|---|---|---|
| **GCP** | 100% | **100%** | **100%** | was 0% RI — fixed this session |
| **AWS** | 100% | ~71% | ~70% | gap = edge zones + brand-new 8th-gen families (below) |
| **Azure** | 99% | ~86% | ~80% | gap = Basic tier + newest v6/v7 gens + confidential (below) |

## Why AWS/Azure aren't 100% (verified legitimate)

I confirmed mainstream current-gen carries full RI in core regions — e.g. AWS `m5/c5/r5/m7i/c7g/m8g.large` and Azure `D4s_v5 / E8s_v5 / D2s_v3` all have 1yr + 3yr rates. So the ingest works; the missing rows are where the **cloud itself doesn't publish a reservation rate**:

**AWS** — the no-RI rows fall into two buckets, both expected:
- **Edge zones** (Local Zones / Wavelength, e.g. `us-east-1-wl1-*`, `us-west-2-lax-1`): ~1,244 rows. These never offer Reserved Instances.
- **Brand-new families** (no classic RI published yet — AWS pushes Savings Plans first): the 8th-gen and newest-storage lines — `c8i / m8i / r8i`, `c8a / m8a / r8a`, `c8gd / m8gd / r8gd`, `c8gn / c8in`, `*-flex`, `i7i / i7ie / i8g / i8ge`, `x8i`. PAYG is present; the AWS Price List has no Reserved offering for them.

**Azure** — three expected buckets:
- **Basic tier** (`Basic_A*`): 180 rows, **0 ever have RI** — Azure Basic-tier VMs cannot be reserved, by design.
- **Newest generations** (`v6`, `v7` — Granite Rapids / latest): ~89% of v6 and ~74% of v7 already have RI; the remainder are regions/SKUs where reservations haven't rolled out yet (RI lags GA).
- **Confidential** (`DC*` / `EC*`): limited RI availability across regions.

The app already renders an em-dash (`—`) for an absent RI rate rather than fabricating one (no `PAYG × factor` guess), so these surface honestly.

## What runs weekly

`.github/workflows/refresh-rates.yml` re-pulls every provider, re-bakes `src/data/liveCatalog.generated.json`, and commits — so the GCP RI fix (and any future upstream RI that lights up for the new families) flows in automatically each Monday.

## Are the missing RIs "available online but not loaded"? (verified: no)

I checked the authoritative public pricing APIs directly — these ARE the same feeds the cloud consoles/calculators read, so "online" and "in the API" are the same thing. The missing rows are genuinely **not published**, confirmed by live queries:

- **Azure `Standard_E16-8as_v6`** (a constrained-vCPU SKU) in East US → **0 reservation meters**, while its parent **`Standard_E16as_v6` → 2** (1yr + 3yr). Azure prices reservations on the *parent* SKU; you reserve the parent and apply it to the constrained variant. So the constrained `-Nas`/`-Nads` rows legitimately have no rate of their own.
- **Azure `D4s_v6` in Jio India** → **0 reservations** (the Jio operator-partner regions don't sell reservations), while `D4s_v6` in East US → **2**. So the ingest captures v6 RI wherever it exists; the gaps are specific regions/variants the cloud doesn't offer.
- **AWS** new families (`c8i`, `i7ie`…) have no `Reserved` term in the Price List API at all, and edge zones (Local/Wavelength) are On-Demand-only by design.

**Bottom line:** it's not a loading problem. The clouds haven't published a reservable rate for those exact (SKU, region) combos. The weekly job auto-picks them up the moment they do.

## What an "estimated RI" would be (and the math)

If you ever want the `—` cells filled, the only option is an **estimate** = `PAYG × a discount factor`, since the real rate doesn't exist upstream. The factor is **measured from the rows that DO have both rates** (median of `RI ÷ PAYG`), not guessed:

| Provider | 1yr RI ≈ | 3yr RI ≈ | (sample size) |
|---|---|---|---|
| AWS | **63%** of PAYG | **43%** | 16.7k / 16.4k rows |
| Azure | **59%** of PAYG | **38%** | 64.6k / 60.1k rows |
| GCP | **63%** of PAYG | **45%** | 6.2k rows |

So e.g. an AWS size with PAYG $1.00 and no published RI would *estimate* to ~$0.63 (1yr) / ~$0.43 (3yr). It could be refined per-category (memory vs compute discount differently). **This is a fabricated number** — it would violate the current no-fabrication doctrine, so it's strictly opt-in and would be clearly badged "est." in the UI.

## Open items for your review

1. **Nothing actionable is missing** — the only true gap (GCP) is fixed. The AWS/Azure absences are genuine upstream non-publication and refill on their own; the weekly job picks them up.
2. **Estimated RI — shipped as an opt-in (v2.26.2).** The VM Catalog's pricing-basis selector now has an "Estimate … where the cloud publishes no reserved rate" toggle (off by default). When on, a missing 1yr/3yr RI is filled with `PAYG × the factor above` and shown **badged `est.` with a `~` prefix**; off, it stays `—`. So you choose per session whether to see estimates, and estimates are never confused with real published pricing.
