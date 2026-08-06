/**
 * Builds the Azure M-series single-source-of-truth Excel workbook from the
 * LIVE seed (`src/data/azureMSeriesSeed.ts`) so the reference file can never
 * drift from what the app actually ships.
 *
 * Run with the project's vite-node so the TS seed + its imports resolve:
 *   node_modules/.bin/vite-node scripts/build_azure_m_ssot.mjs
 *
 * Output: public/azure-m-series-source-of-truth.xlsx
 *   • Sheet "M-Series Catalog" — one row per distinct SKU (region-collapsed),
 *     every spec dimension the app stores.
 *   • Sheet "Family Roll-up" — count per compound family slug + tier.
 *   • Sheet "Sources" — the Microsoft Learn URLs + capture date.
 */
import * as XLSX from 'xlsx';
import { writeFileSync } from 'node:fs';
import { AZURE_M_SERIES_SEED, SEED_DATA_AS_OF, PUBLIC_SEED_VERSION } from '../src/data/azureMSeriesSeed.ts';
import { vmFamily, vmClass } from '../src/utils/vmTaxonomy.ts';

// Collapse the region-expanded seed to one row per SKU (specs are region-invariant).
const bySku = new Map();
for (const v of AZURE_M_SERIES_SEED) {
  if (!bySku.has(v.vmSizeName)) bySku.set(v.vmSizeName, v);
}
const skus = [...bySku.values()];

// Stable order: by compound family, then memory, then name.
const tierRank = { 'Medium Memory (MM)': 0, 'High Memory (HM)': 1, 'Very High Memory (VHM)': 2 };
skus.sort((a, b) => {
  const fa = vmFamily(a), fb = vmFamily(b);
  if (fa !== fb) return fa.localeCompare(fb);
  if (a.memoryGib !== b.memoryGib) return a.memoryGib - b.memoryGib;
  return a.vmSizeName.localeCompare(b.vmSizeName);
});

const catalogRows = skus.map((v) => ({
  'Size Name': v.vmSizeName,
  Generation: v.vmGeneration,
  Tier: v.memoryCategory,
  'Compound Family': vmFamily(v),
  'Routing Class': vmClass(v),
  vCPUs: v.vcpus,
  'Memory (GiB)': v.memoryGib,
  Processor: v.processor,
  'Local Disk (GiB)': v.localStorageGiB ?? 0,
  'Local Disks': v.localStorageDiskCount ?? 0,
  'Local IOPS': v.localStorageIopsRR ?? '',
  'Local MBps': v.localStorageMbpsRR ?? '',
  'Remote Disks': v.remoteStorageDisks ?? '',
  'Premium IOPS': v.remoteStorageIopsPremium ?? '',
  'Premium MBps': v.remoteStorageMbpsPremium ?? '',
  'Ultra IOPS': v.remoteStorageIopsUltra ?? '',
  'Ultra MBps': v.remoteStorageMbpsUltra ?? '',
  'NICs': v.networkNicCount ?? '',
  'Network Mbps': v.networkMbps ?? '',
  Status: v.status,
  'PAYG $/hr (East US 2)': v.hourlyUsd ?? '',
}));

// Family roll-up.
const familyCounts = new Map();
for (const v of skus) {
  const f = vmFamily(v);
  familyCounts.set(f, (familyCounts.get(f) ?? 0) + 1);
}
const rollupRows = [...familyCounts.entries()]
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([family, count]) => ({ 'Compound Family': family, 'SKU Count': count }));
rollupRows.push({ 'Compound Family': 'TOTAL', 'SKU Count': skus.length });

const sourceRows = [
  { Series: 'M-series (Mv1)', URL: 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/memory-optimized/m-series' },
  { Series: 'Mv2 (Msv2 High Memory)', URL: 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/memory-optimized/mv2-series' },
  { Series: 'Msv3 MM', URL: 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/memory-optimized/msv3-mm-series' },
  { Series: 'Msv3 HM', URL: 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/memory-optimized/msv3-hm-series' },
  { Series: 'Mdsv3 MM', URL: 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/memory-optimized/mdsv3-mm-series' },
  { Series: 'Mdsv3 HM', URL: 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/memory-optimized/mdsv3-hm-series' },
  { Series: '— captured —', URL: '2026-05-31 (pages dated ms.date 2026-03-10)' },
  { Series: '— seed version —', URL: PUBLIC_SEED_VERSION },
  { Series: '— pricing as of —', URL: SEED_DATA_AS_OF },
  { Series: '— tier model —', URL: 'Microsoft 2-tier: MM <= 4 TiB, HM > 4 TiB. No VHM in Azure M-series.' },
];

const wb = XLSX.utils.book_new();
const wsCat = XLSX.utils.json_to_sheet(catalogRows);
wsCat['!cols'] = Object.keys(catalogRows[0]).map((k) => ({ wch: Math.max(k.length + 1, 14) }));
XLSX.utils.book_append_sheet(wb, wsCat, 'M-Series Catalog');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rollupRows), 'Family Roll-up');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sourceRows), 'Sources');

const out = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
const path = new URL('../public/azure-m-series-source-of-truth.xlsx', import.meta.url);
writeFileSync(path, out);
console.log(`Wrote ${catalogRows.length} SKUs to public/azure-m-series-source-of-truth.xlsx`);
console.log('Families:', rollupRows.map((r) => `${r['Compound Family']}=${r['SKU Count']}`).join(' · '));
