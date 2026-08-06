# GCP Compute Engine — regions & available machine series

> Source: https://docs.cloud.google.com/compute/docs/regions-zones
> Captured 2026-05-27. The TypeScript seed in
> `src/data/gcpMSeriesAnalogSeed.ts` + the per-region map in
> `src/data/gcpRegionAvailability.ts` are derived from this file.
> Refresh workflow: pull the latest page → diff → patch both TS files →
> `tsc --noEmit && vitest run` → bump `SEED_DATA_AS_OF`.

## Per-region availability matrix

Format: `region` (city) → comma-separated machine-series list.

### Africa

- **africa-south1** (Johannesburg, ZA): E2, N4, N2, N2D, C4, C4A, T2D, M3

### Asia Pacific

- **asia-east1** (Changhua, TW): E2, N4, N2, N2D, N1, C4, C4A, C3, C3D, T2D, M1, M3, C2, C2D, G4, G2
- **asia-east2** (Hong Kong): E2, N4, N2, N2D, N1, C4, C3, C3D, T2D, C2, C2D
- **asia-northeast1** (Tokyo, JP): E2, N4, N2, N2D, N1, T2D, Z3, M3, M2, M1, C2, C2D, A2, A3, A4, G2
- **asia-northeast2** (Osaka, JP): E2, N4, N2, N2D, N1, C4, C3, C3D, T2D, M3, M2, M1, C2, C2D
- **asia-northeast3** (Seoul, KR): E2, N4, N2, N2D, N1, C4, C3, M3, M2, M1, C2, C2D, A2, A3, G2
- **asia-south1** (Mumbai, IN): E2, N4, N2, N2D, C4, C4A, C3, C3D, T2D, N1, M2, M1, C2, C2D, G2
- **asia-south2** (Delhi, IN): E2, N4, N2, N2D, C4, T2D, M3
- **asia-southeast1** (Singapore): E2, N4, N2, N2D, N1, C4, C4A, C3, C3D, T2D, M3, M2, M1, C2, C2D, G2
- **asia-southeast2** (Jakarta, ID): E2, N4, N2, N2D, N1, C4, C3, T2D, M3, M2, M1, C2
- **australia-southeast1** (Sydney, AU): E2, N4, N2, N2D, N1, C4, C4A, C3, C3D, T2D, M3, M2, M1, C2, C2D, A2, G2
- **australia-southeast2** (Melbourne, AU): E2, N4, N2, N2D, C4, C3, T2D, M3

### Europe

- **europe-central2** (Warsaw, PL): E2, N4, N2, N2D, C4, C3, T2D
- **europe-north1** (Hamina, FI): E2, N4, N2, N2D, N1, C4, C4A, C3, C3D, T2D, M3, M2, M1, C2, C2D, G2
- **europe-north2** (Stockholm, SE): E2, N4, N2, N2D, C4, C3, T2D, M3
- **europe-southwest1** (Madrid, ES): E2, N4, N2, N2D, C4, T2D
- **europe-west1** (St. Ghislain, BE): E2, N4, N2, N2D, N1, C4, C4A, C4D, C3, C3D, T2D, Z3, M3, M2, M1, C2, C2D, A4, A3, A2, G4, G2, H3
- **europe-west2** (London, UK): E2, N4, N2, N2D, N1, C4, C4A, C3, C3D, T2D, M3, M2, M1, C2, C2D, G2
- **europe-west3** (Frankfurt, DE): E2, N4, N2, N2D, N1, C4, C4A, C4D, C3, C3D, T2D, M3, M2, M1, C2, C2D, A2, G2
- **europe-west4** (Eemshaven, NL): E2, N4, N2, N2D, N1, C4, C4A, C4D, C3, C3D, T2D, Z3, M3, M2, M1, C2, C2D, A4, A3, A2, G4, G2, H3
- **europe-west6** (Zurich, CH): E2, N4, N2, N2D, C4, C3, T2D, M3
- **europe-west8** (Milan, IT): E2, N4, N2, N2D, C4, T2D
- **europe-west9** (Paris, FR): E2, N4, N2, N2D, C4, C3, T2D
- **europe-west10** (Berlin, DE): E2, N4, N2, N2D, C4, T2D
- **europe-west12** (Turin, IT): E2, N4, N2, N2D, C4, T2D

### Middle East

- **me-central1** (Doha, QA): E2, N4, N2, N2D, C4, T2D
- **me-central2** (Dammam, SA): E2, N4, N2, N2D, C4, T2D
- **me-west1** (Tel Aviv, IL): E2, N4, N2, N2D, C4, C3, T2D

### North America

- **northamerica-northeast1** (Montréal, CA): E2, N4, N2, N2D, N1, C4, C4A, C3, C3D, T2D, M3, M2, M1, C2, C2D, G2
- **northamerica-northeast2** (Toronto, CA): E2, N4, N2, N2D, C4, C3, T2D
- **northamerica-south1** (Mexico City, MX): E2, N4, N2, N2D, C4, T2D

### South America

- **southamerica-east1** (São Paulo, BR): E2, N4, N2, N2D, N1, C4, C4A, C3, C3D, T2D, M3, M2, M1, C2, C2D, G2
- **southamerica-west1** (Santiago, CL): E2, N4, N2, N2D, C4, T2D

### United States

- **us-central1** (Iowa): E2, N4, N2, N2D, N1, C4, C4A, C4D, C3, C3D, T2D, Z3, M3, M2, M1, C2, C2D, A4, A3, A2, G4, G2, H3, X4
- **us-east1** (S. Carolina): E2, N4, N2, N2D, N1, C4, C4A, C4D, C3, C3D, T2D, Z3, M3, M2, M1, C2, C2D, A4, A3, A2, G4, G2, H3
- **us-east4** (N. Virginia): E2, N4, N2, N2D, C4, C3, T2D, H3, X4
- **us-east5** (Columbus, OH): E2, N4, N2, N2D, C4, C3, T2D, A2, H3
- **us-south1** (Dallas, TX): E2, N4, N2, N2D, C4, T2D
- **us-west1** (Oregon): E2, N4, N2, N2D, N1, C4, C4A, C3, C3D, T2D, M3, M2, M1, C2, C2D, G2
- **us-west2** (Los Angeles): E2, N4, N2, N2D, N1, C4, C4A, C3, C3D, T2D, M3, M2, M1, C2, C2D, G2
- **us-west3** (Salt Lake City): E2, N4, N2, N2D, C4, C3, T2D, A2
- **us-west4** (Las Vegas): E2, N4, N2, N2D, C4, C4A, C4D, C3, C3D, T2D, M3, M2, M1, C2, C2D, A4, A3, A2, G4, G2

## Machine series — category map

| Series | Category | CPU | Notes |
| --- | --- | --- | --- |
| E2 | General Purpose | Mix (Intel/AMD) | Cost-optimized, shared-core variants |
| N1 | Previous Generation | Skylake / Broadwell | Legacy GP |
| N2 | General Purpose | Cascade Lake / Ice Lake | Balanced GP |
| N2D | General Purpose | AMD EPYC Rome / Milan | AMD GP |
| N4 | General Purpose | Sapphire Rapids | Newest GP |
| T2A | General Purpose | Ampere Altra (Arm) | Arm GP — only us-central1 (limited rollout) |
| T2D | General Purpose | AMD Milan | Scale-out GP |
| C2 | Compute Optimized | Cascade Lake | High-performance compute |
| C2D | Compute Optimized | AMD Milan | AMD compute |
| C3 | Compute Optimized | Sapphire Rapids | Next-gen Intel compute |
| C3D | Compute Optimized | AMD Genoa | AMD high-perf compute |
| C4 | Compute Optimized | Emerald Rapids | Newest Intel compute |
| C4A | Compute Optimized | Google Axion (Arm) | Arm compute |
| C4D | Compute Optimized | AMD Turin | Latest AMD compute |
| M1 | Memory Optimized | Skylake | Legacy mem |
| M2 | Memory Optimized | Cascade Lake | Ultramem / megamem |
| M3 | Memory Optimized | Ice Lake | Ultramem |
| M4 | Memory Optimized | Sapphire Rapids | Newest mem (limited rollout) |
| X4 | Memory Optimized | Sapphire Rapids | High-memory SAP HANA |
| Z3 | Storage Optimized | Sapphire Rapids | Storage-dense |
| H3 | HPC | Sapphire Rapids | HPC-optimized |
| A2 | GPU | Cascade Lake | NVIDIA A100 |
| A3 | GPU | Sapphire Rapids | NVIDIA H100 |
| A4 | GPU | Emerald Rapids | NVIDIA B200 |
| G2 | GPU | Cascade Lake | NVIDIA L4 |
| G4 | GPU | Emerald Rapids | NVIDIA Blackwell B200 inference |
