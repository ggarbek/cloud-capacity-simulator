# AWS EC2 doc-mirror — currency & known gaps

> **Last refreshed: 2026-06-23.** This file states what the `docs/aws/`
> mirror currently covers, what is known to be missing, and where the
> authoritative *runtime* data actually lives. Read it before assuming a
> missing SKU is an app bug.

## What this mirror is (and is not)

- `docs/aws/` is a **static reference copy** of the AWS EC2 instance-type
  documentation (`docs.aws.amazon.com/ec2/latest/instancetypes/…`). It is the
  **"vendor truth" cross-check** for the app's VM taxonomy
  (family → category routing, spec sanity, per-region availability).
- It is **NOT the runtime catalog.** The catalog the app actually simulates
  against is the **live catalog**, ingested separately and **baked fresh into
  every build**, then re-baked **weekly by CI** (`.github/workflows/refresh-rates.yml`,
  Mon 07:00 UTC). When the mirror and the live catalog disagree on a rate or a
  brand-new SKU, **the live catalog is authoritative** for what the app does.
- File-to-code map + refresh workflow: see `README.md` in this folder.

## Coverage (families / categories)

Mirrored across the nine source files, all current EC2 categories:

| Category | File | Notable current families present |
| --- | --- | --- |
| General Purpose | `general-purpose.md` | M5–M8 lines, **M8g/M8gd (Graviton4)**, **M9g/M9gd (Graviton5)**, M7i-flex/M8i-flex, T2–T4g, Mac1/Mac2/Mac-m4* |
| Compute Optimized | `compute-optimized.md` | C5–C8 lines incl. **C8g/C8gd/C8gn (Graviton4)**, C7i-flex/C8i-flex |
| Memory Optimized | `memory-optimized.md` | R5–R8 incl. **R8g (Graviton4)**, X1/X2/X8g/X8aedz/X8i, z1d, full **high-memory U7i/U7in line** (U7i-6tb…U7in-32tb), **U7inh-32tb** |
| Storage Optimized | `storage-optimized.md` | D2/D3/D3en, H1, I3–I8 incl. **I7i/I7ie/I8g/I8ge**, Im4gn, Is4gen |
| Accelerated Computing | `accelerated-computing.md` | G4–G7e, Gr6/Gr6f, Inf1/Inf2, **P5/P5e/P5en, P6-B200/P6-B300/P6e-GB200**, Trn1/Trn2/Trn2u, DL1/DL2q, F2, VT1 |
| HPC | `hpc.md` | Hpc6a, Hpc6id, Hpc7a, Hpc7g, Hpc8a |
| Previous Generation | `previous-generation.md` | A1, C1/C3/C4, G3, I2, M1–M4, P3/P3dn, R3/R4, T1 |
| Region availability | `instance-regions.md` | per-region family availability sets, all commercial + GovCloud + China + EU Sovereign |
| Nitro / bare-metal | `nitro-system.md` | Nitro v1–v6 network-feature lookup |

### Refreshed 2026-06-23

- **Added M9g / M9gd (AWS Graviton5, Nitro v6, arm64)** to
  `general-purpose.md` — family-list table, family-summary table, and the
  performance table (medium → 48xlarge + `metal-48xl`; 4 GiB/vCPU, single
  thread per core). Also added to the four regions that list them today in
  `instance-regions.md` (`us-east-1`, `us-east-2`, `us-west-2`, `eu-central-1`).
  *Network/EBS/instance-store sub-tables for M9g/M9gd were intentionally NOT
  fabricated — only spec values verified against the official doc were added.*
- Confirmed **no C9g / R9g (Graviton5) families exist yet** in the compute- or
  memory-optimized docs — nothing to add there.
- Confirmed the rest of the mirror is already current (M8g/C8g/R8g Graviton4,
  G6/G6e/G7e, I7i/I7ie/I8g/I8ge, U7i/U7in, Hpc8a, P5/P6 lines, X8aedz all present).

## Known source / ingest gap — `u7inh-32tb`

- **`U7inh-32tb` (u7inh-32tb.480xlarge)** is present in this mirror
  (`memory-optimized.md` family table + `instance-regions.md`), but it is a
  **documented single-SKU source/ingest gap** in the live pipeline: the live
  ingest does not currently surface a complete spec+rate row for this one
  high-memory SKU. **This is expected — not an app bug.** Do not treat its
  absence (or partial data) in the live catalog as a regression; it is tracked
  here so it is never mis-diagnosed.

## Authoritative runtime source

> The **live catalog** (ingested separately, baked into the build, refreshed
> **weekly by CI**) is the authoritative runtime source for specs + pricing —
> **not** this mirror. This folder exists only as a vendor-truth cross-check
> for taxonomy and spec sanity.
