/**
 * v2.17 — Runtime VM Excel template builder.
 *
 * Generates a downloadable .xlsx workbook from the live `state.userVms`
 * catalog. Replaces the v2.1 static `public/vm-template.xlsx` that was
 * baked at build time — by reading state we guarantee the user always
 * downloads the EXHAUSTIVE catalog (every region, every family) plus
 * any user uploads they've made on top.
 *
 * Workbook layout: one tab per provider — **Azure / AWS / GCP / Custom**
 * — each sharing the parser's 23-column schema. Custom tab is always
 * present (even if empty) so users have a sanctioned slot for their own
 * SKUs without having to invent a new tab.
 *
 * Header schema is kept in lockstep with `src/utils/vmTemplate.ts`
 * `VM_HEADERS` — the same column set the parser expects.
 */
import * as XLSX from 'xlsx';
import type { UserVm } from '../types';
import { categorize } from './vmCategory';

/** Column headers — must exactly match VM_HEADERS in vmTemplate.ts.
 *
 * v2.17.2: 3-column hierarchy moved to the front — **Category → Series →
 * Size** — standardized across Azure / AWS / GCP so users can sort + filter
 * the same way regardless of cloud. `Series` = the family slug (e.g. Esv5,
 * r7iz, n2-highmem). `Size` = the concrete SKU (e.g. Standard_E16s_v5,
 * r7iz.16xlarge, n2-highmem-16). Provider stays as the 4th column for
 * cross-cloud disambiguation. */
export const VM_TEMPLATE_HEADERS = [
  'Category',
  'Series',
  'Size',
  'Provider',
  'Generation',
  'vCPUs',
  'Memory (GiB)',
  'Network (Mbps)',
  'Local Disk (GiB)',
  'NIC Count',
  'Local Disks',
  'Local IOPS (RR)',
  'Local MBps (RR)',
  'Remote Disks',
  'Premium IOPS (uncached)',
  'Premium MBps (uncached)',
  'Ultra IOPS (uncached)',
  'Ultra MBps (uncached)',
  'Accelerator',
  'Region',
  'PAYG Hourly (USD)',
  '1-yr RI Hourly (USD)',
  '3-yr RI Hourly (USD)',
  'Notes',
] as const;

const TAB_PROVIDERS = ['Azure', 'AWS', 'GCP', 'Custom'] as const;
type TabProvider = (typeof TAB_PROVIDERS)[number];

function rowFor(vm: UserVm): unknown[] {
  const category = vm.category ?? categorize(vm.provider, vm.family);
  return [
    category,
    vm.family ?? '',
    vm.vmSizeName,
    vm.provider ?? '',
    vm.vmGeneration ?? '',
    vm.vcpus,
    vm.memoryGib,
    vm.networkMbps ?? '',
    vm.localDiskGib ?? '',
    vm.networkNicCount ?? '',
    vm.localStorageDiskCount ?? '',
    vm.localStorageIopsRR ?? '',
    vm.localStorageMbpsRR ?? '',
    vm.remoteStorageDisks ?? '',
    vm.remoteStorageIopsPremium ?? '',
    vm.remoteStorageMbpsPremium ?? '',
    vm.remoteStorageIopsUltra ?? '',
    vm.remoteStorageMbpsUltra ?? '',
    vm.acceleratorType ?? '',
    vm.region ?? '',
    vm.hourlyUsd ?? '',
    vm.riOneYrHourlyUsd ?? '',
    vm.riThreeYrHourlyUsd ?? '',
    vm.notes ?? '',
  ];
}

/**
 * Build the workbook from a live VM catalog. Each provider gets its own
 * sheet sorted by (family, vmSizeName, region). The Custom tab catches
 * everything without a provider tag, or explicitly tagged Custom.
 */
export function buildVmTemplateWorkbook(vms: UserVm[]): XLSX.WorkBook {
  // Bucket by provider — anything that isn't Azure / AWS / GCP lands in Custom.
  const buckets: Record<TabProvider, UserVm[]> = {
    Azure: [],
    AWS: [],
    GCP: [],
    Custom: [],
  };
  for (const vm of vms) {
    const p = (vm.provider ?? '').trim();
    if (p === 'Azure') buckets.Azure.push(vm);
    else if (p === 'AWS') buckets.AWS.push(vm);
    else if (p === 'GCP') buckets.GCP.push(vm);
    else buckets.Custom.push(vm);
  }

  // Sort each bucket for predictable Excel output.
  const sortFn = (a: UserVm, b: UserVm): number => {
    const ca = (a.category ?? categorize(a.provider, a.family)) as string;
    const cb = (b.category ?? categorize(b.provider, b.family)) as string;
    const co = ca.localeCompare(cb);
    if (co !== 0) return co;
    const fa = (a.family ?? '').localeCompare(b.family ?? '');
    if (fa !== 0) return fa;
    const sk = a.vmSizeName.localeCompare(b.vmSizeName);
    if (sk !== 0) return sk;
    return (a.region ?? '').localeCompare(b.region ?? '');
  };
  for (const k of TAB_PROVIDERS) buckets[k].sort(sortFn);

  const wb = XLSX.utils.book_new();
  for (const provider of TAB_PROVIDERS) {
    const rows = buckets[provider];
    const titles: Record<TabProvider, string> = {
      Azure: `Azure VM Sizes — ${rows.length} rows · seeded from app state`,
      AWS: `AWS EC2 Instance Types — ${rows.length} rows · seeded from app state`,
      GCP: `GCP Compute Engine — ${rows.length} rows · seeded from app state`,
      Custom: `Custom — ${rows.length} rows · your own SKUs, free-form provider tag`,
    };
    const hint =
      provider === 'Custom'
        ? 'Add any SKU here that doesn\'t fit Azure / AWS / GCP. Provider column free-form (defaults to "Custom" when blank). Same schema as the other tabs.'
        : 'One row = one VM size in one region. Blank rows + rows missing vCPUs/Memory are skipped on import. Edit pricing/specs in place + re-upload — your edits override the seed.';
    const aoa: unknown[][] = [
      [titles[provider]],
      [hint],
      [],
      [...VM_TEMPLATE_HEADERS],
      ...rows.map(rowFor),
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    // Merge title + hint across all columns for readability.
    const lastColIdx = VM_TEMPLATE_HEADERS.length - 1;
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: lastColIdx } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: lastColIdx } },
    ];
    // Column widths — first few wider for SKU + family.
    ws['!cols'] = VM_TEMPLATE_HEADERS.map((h, i) => {
      if (i === 0) return { wch: 28 }; // VM Size Name
      if (i === 2) return { wch: 18 }; // Family
      if (i === 18) return { wch: 20 }; // Region
      if (h.includes('USD')) return { wch: 18 };
      if (h === 'Notes') return { wch: 28 };
      return { wch: Math.max(14, h.length + 2) };
    });
    // Freeze panes so the title + header row stay visible.
    ws['!freeze'] = { xSplit: 1, ySplit: 4 };
    XLSX.utils.book_append_sheet(wb, ws, provider);
  }
  return wb;
}

/** Trigger a browser download of the live VM template workbook. */
export function downloadVmTemplate(
  vms: UserVm[],
  filename = 'vm-template.xlsx',
): void {
  const wb = buildVmTemplateWorkbook(vms);
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
