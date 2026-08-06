# Rate-refresh automation (GitHub Action)

The ingestion scripts in this folder (see `README.md`) pull cloud VM rate/spec
data into sharded JSON under `public/rates/<provider>/`. Those shards are
**tracked in git**, so they need to be refreshed periodically. The workflow at
[`.github/workflows/refresh-rates.yml`](../../.github/workflows/refresh-rates.yml)
does exactly that: it re-runs the pulls on a schedule and commits the diff back
to `main`.

## What it does

One job on `ubuntu-latest` (Node 22):

1. **Keyless pulls — always run, no secrets required:**
   - `azure-network.mjs` — Azure per-size network bandwidth (from the docs).
   - `azure-prices.mjs <regions>` — Azure rates for a bounded region set.
   - `aws-specs.mjs` — AWS specs + network (one pull covers all regions).
   - `aws-prices.mjs <regions>` — AWS rates for a bounded region set.
   - `gcp-specs.mjs` — GCP specs + network (keyless, deterministic family rules).
2. **Keyed pulls — run ONLY when their secrets are present:**
   - `azure-specs.mjs` — needs the Azure service-principal secrets (below).
   - `gcp-prices.mjs <regions>` — needs `GCP_API_KEY`.
3. **Commit + push** any changes under `public/rates/` back to `main` as
   `github-actions[bot]` with message `chore(rates): scheduled refresh [skip ci]`.
   The commit is guarded by `git diff --quiet` so an unchanged run makes **no**
   empty commit.

**The keyed steps degrade gracefully.** If the Azure or GCP secrets aren't set,
those steps are simply skipped — the job does **not** fail, and all the keyless
data (Azure rates+network, every AWS region, GCP specs+network) still refreshes.
Add the secrets only when you want Azure specs and/or GCP rates included too.

## When it runs

- **Scheduled:** weekly, **Mondays at 07:00 UTC** (`cron: '0 7 * * 1'`).
- **Manual:** anytime, via the button (below).

### Trigger it manually

1. GitHub → the repo → **Actions** tab.
2. Pick **Refresh rates** in the left-hand workflow list.
3. Click **Run workflow** (top right), choose the `main` branch, **Run workflow**.

## Manual secret setup — checklist

These secrets are **set by hand, once**, in the repo settings. They are never set
by any script here — the CI job only *reads* them. Tick each item:

- [ ] **GCP rates** — create a **`GCP_API_KEY`** (Cloud Billing Catalog). Steps below.
- [ ] **Azure specs** — create an Azure **service principal** (Reader role) and add
      **all four** secrets:
  - [ ] `AZURE_TENANT_ID`
  - [ ] `AZURE_CLIENT_ID`
  - [ ] `AZURE_CLIENT_SECRET`
  - [ ] `AZURE_SUBSCRIPTION_ID`

Until a keyed secret is set, its step is skipped and its last-good shard is kept.
The **Keyed-step staleness report** (`report-keyed-staleness.mjs`) prints a warning
+ a job-summary block once that shard passes 30 days old, naming the missing secret
and pointing back here — so a long-skipped step never rots silently.

## Optional repo secrets (for full / keyed coverage)

Add these under **Settings → Secrets and variables → Actions → New repository
secret**. Without any of them the Action still refreshes everything keyless;
only **Azure specs** and **GCP rates** need them.

### `GCP_API_KEY` — for GCP rates (`gcp-prices.mjs`)

1. Google Cloud console → create or select a project.
2. Enable the **Cloud Billing API** (public pricing needs no IAM role — just the
   API enabled).
3. **APIs & Services → Credentials → Create credentials → API key**. Restrict it
   to the Cloud Billing API.
4. Add the key value as the repo secret **`GCP_API_KEY`**.

### Azure service principal — for Azure specs (`azure-specs.mjs`)

Create a service principal with the **Reader** role (enough for the Resource
SKUs read):

```bash
az ad sp create-for-rbac --name capsim-rates --role Reader \
  --scopes /subscriptions/<SUB_ID>
```

Map the output to four repo secrets:

| `az` output field | Repo secret |
|-------------------|-------------|
| `appId`           | `AZURE_CLIENT_ID` |
| `password`        | `AZURE_CLIENT_SECRET` |
| `tenant`          | `AZURE_TENANT_ID` |
| (the `<SUB_ID>` you used above) | `AZURE_SUBSCRIPTION_ID` |

All **four** Azure secrets must be present for the Azure-specs step to run; if
any is missing the step is skipped.

## Region coverage — every region

The workflow pulls **every region** for each cloud (the rate scripts run with
**no region args = all regions**):

- **Azure** (`azure-prices.mjs`) — one paginated query across all ~70 regions;
  the script retries on 429/503 throttling with backoff so the big query
  completes.
- **AWS** (`aws-prices.mjs`) — all ~105 regions in the Price List region index.
- **GCP** (`gcp-prices.mjs`) — all ~44 regions.

To **narrow** (if a run ever gets too slow/large), pass an explicit region list
on the relevant `run:` line in `.github/workflows/refresh-rates.yml`, e.g.
`node scripts/ingest/aws-prices.mjs us-east-1 eu-west-1`. The specs/network pulls
(`aws-specs.mjs`, `gcp-specs.mjs`, `azure-network.mjs`, `azure-specs.mjs`) are
region-independent and take no region args.

## Pipeline health — manifest, integrity gate, staleness

Three steps make the refresh self-checking. They run in this order, after the
pulls and *before* the commit:

1. **Keyed-step staleness report** (`report-keyed-staleness.mjs`) — always exits
   0. Warns (annotation + job summary) when a keyed shard is >30 days old and its
   secret is absent. A report, not a gate.
2. **Build shard manifests** (`build-manifests.mjs`) — scans `public/rates/**`
   post-hoc into **`public/rates/_manifest.json`**: per-cloud spec/network/rate
   row counts, coverage percentages (processor / network), freshness stamps, and
   join health (`joined` / `ratesWithoutSpec`, mirroring the runtime join guard
   in `src/data/rates/loadRegionRates.ts`). `build-live-catalog.mjs` embeds this
   manifest into the baked catalog as `health`, which the app reads via
   `src/data/dataHealth.ts` for the FAQ **Data health** line.
3. **Validate shards** (`validate-shards.mjs`) — the integrity **gate**. Compares
   the fresh manifest against the one committed at `HEAD` (`git show
   HEAD:public/rates/_manifest.json`; first run passes) and **exits 1** on: any
   cloud's spec/network/rate rows shrinking >5%, `processorPct`/`networkPct`
   dropping >1 point, `ratesWithoutSpec` share above the per-cloud floor, or a
   schema break on the sampled spec records. It runs before the commit, so a bad
   pull fails the job and the good committed shards survive.

`public/rates/_manifest.json` is committed alongside the shards.

## Note on tracked data

`public/rates/` is tracked in git so the app can serve the shards as static
assets and the Action can commit refreshed copies. (This supersedes the
README's earlier "gitignored" note.) Don't hand-edit the shards — they're
generated; regenerate with the scripts in `README.md` or let this Action do it.
