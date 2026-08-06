# AWS EC2 doc bundle — source of truth for the AWS seed

> Verbatim copies of the AWS EC2 instance-types documentation, captured
> 2026-05-27. The TypeScript seed in `src/data/awsMSeriesAnalogSeed.ts` +
> the per-region availability map in `src/data/awsRegionAvailability.ts`
> are derived from these files. If AWS updates the docs, **refresh this
> folder first, then update the TS files to match.**

## File map

| File | Source page | Used by |
| --- | --- | --- |
| `instance-regions.md` | docs.aws.amazon.com/ec2/latest/instancetypes/ec2-instance-regions.html | `awsRegionAvailability.ts` — per-region family availability sets |
| `nitro-system.md` | docs.aws.amazon.com/ec2/latest/instancetypes/ec2-nitro-instances.html | Nitro hypervisor version → bare-metal vs virtualized lookup; Mac instance enumeration |
| `general-purpose.md` | docs.aws.amazon.com/ec2/latest/instancetypes/gp.html | M / T / Mac family specs (vCPU, memory, network, EBS) |
| `compute-optimized.md` | docs.aws.amazon.com/ec2/latest/instancetypes/co.html | C family specs |
| `memory-optimized.md` | docs.aws.amazon.com/ec2/latest/instancetypes/mo.html | R / X / U / z1d family specs |
| `storage-optimized.md` | docs.aws.amazon.com/ec2/latest/instancetypes/so.html | D / H / I family specs |
| `accelerated-computing.md` | docs.aws.amazon.com/ec2/latest/instancetypes/ac.html | DL / F / G / Gr / Inf / P / Trn / VT family specs |
| `hpc.md` | docs.aws.amazon.com/ec2/latest/instancetypes/hpc.html | Hpc6a / Hpc6id / Hpc7a / Hpc7g / Hpc8a specs (constant-memory families — see `Family.sizeMems`) |
| `previous-generation.md` | docs.aws.amazon.com/ec2/latest/instancetypes/pg.html | Pre-A1/M1/C3/etc. legacy family specs |

## Where each fact lives in code

- **Family → category routing**: `src/utils/vmCategory.ts` `categorizeAwsFamily()`.
- **vCPU sizes, memory ratios, network bandwidth, EBS storage MB/s, accelerators, CPU model strings**: `FAMILIES` array in `src/data/awsMSeriesAnalogSeed.ts`. New optional fields (v2.17.4):
  - `sizeMems` — per-vCPU memory override (GiB). Required for HPC families because they ship the SAME memory on every size (e.g. every `hpc7a.*` is 768 GiB).
  - `sizeLabel` — per-size SKU suffix override. Used by Mac instances (`.metal` suffix instead of algorithmic `xlarge`).
  - `flatHourly` — flat hourly USD overriding the per-vCPU calculation. Used by Mac instances (dedicated-host pricing model).
- **Per-region availability**: `AWS_REGION_FAMILIES` in `src/data/awsRegionAvailability.ts`. One `Set<family>` per AWS region, transcribed from `instance-regions.md`.
- **Regional pricing multipliers (PAYG ratios vs us-east-1)**: `REGION_MULT` in `awsMSeriesAnalogSeed.ts`.

## Refresh workflow

1. Pull the latest version of each AWS doc page (the URLs in the table above).
2. Replace the file in this folder.
3. If a family's vCPU/memory/network spec changed → update its `FAMILIES` entry.
4. If a region added/removed a family → update `AWS_REGION_FAMILIES`.
5. Run `tsc --noEmit && vitest run` to verify nothing breaks.
6. Bump `SEED_DATA_AS_OF` in the appropriate seed file so the in-app
   disclaimer banner reflects the refresh.

## Coverage as of v2.17.4

- 178 unique AWS instance families × 39 regions = **19k+** UserVm rows in the
  generated catalog.
- All categories covered: General Purpose / Compute / Memory / Storage /
  Accelerated / HPC / Previous Generation.
- Bare-metal Mac instances (Mac1, Mac2*, Mac-m4*) included with `.metal`
  SKU labels + dedicated-host flat hourly rates.
- HPC families spec-corrected: constant memory regardless of vCPU
  (Hpc7a = 768 GiB on every size, etc.) — fixed in v2.17.4.
- GovCloud (us-gov-east-1, us-gov-west-1), China (cn-north-1, cn-northwest-1),
  and AWS European Sovereign Cloud (eusc-de-east-1) all present in the
  region-availability map AND `REGION_MULT`.
