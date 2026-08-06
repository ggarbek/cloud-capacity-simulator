/**
 * Parse the user-uploaded hardware template (public/hardware-template.xlsx).
 *
 * Schema source of truth = scripts/build_hardware_template.py. v2.17.33
 * format: three sheets that mirror the in-app Server Builder + CPU Builder
 * 1:1 — fields the UI captures are the fields the Excel carries.
 *
 *   - "Servers"      — one row per server (Identity + Financial)
 *   - "Server Nodes" — one row per node TYPE inside a server; joined to
 *                      Servers via Group ID. Each row = one of the up-to-4
 *                      Node Type blocks in the UI.
 *   - "CPU Library"  — one row per processor
 *
 * Layout per sheet: row 1 title, row 2 hint, row 4 column headers, row 5+
 * data. The parser locates the header row by content so extra blank rows
 * above don't break import.
 *
 * Back-compat: legacy uploads with a single "Hardware Groups" sheet (pre
 * v2.17.33) still parse via the legacy path — see parseLegacyGroupsSheet.
 */

import * as XLSX from 'xlsx';
import type {
  HardwareGroup,
  MemoryCategoryId,
  RackSlot,
  UserCpu,
} from '../types';

export interface TemplateImport {
  groups: HardwareGroup[];
  cpus: UserCpu[];
  warnings: string[];
}

const SERVER_HEADERS = [
  'Group ID',
  'Name',
  'Provider',
  'Cost per Rack (USD)',
  'Usable Life (months)',
  'Notes',
] as const;

const NODE_HEADERS = [
  'Group ID',
  'Node Type #',
  'Role',
  'Role Label',
  'Count',
  'Memory / Node (GiB)',
  'Processor',
  'Sockets / Node',
  'Cores / Socket',
  'vCPUs / Node',
  'Network Mbps / Node',
  'Local Storage MB/s / Node',
  'Remote Storage MB/s / Node',
  // Legacy single-column form. Still accepted on read; treated as the
  // REMOTE storage value. New downloads emit the split Local/Remote columns
  // above.
  'Storage MB/s / Node',
] as const;

const CPU_HEADERS = [
  'CPU Name',
  'Vendor',
  'Family',
  'Cores per Socket',
  'Hyperthreading',
] as const;

export async function parseHardwareTemplate(file: File): Promise<TemplateImport> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });

  const warnings: string[] = [];
  const cpus = parseCpuSheet(wb, warnings);

  // Prefer the new format; fall back to the legacy "Hardware Groups" sheet
  // when "Servers" / "Server Nodes" aren't present.
  let groups: HardwareGroup[];
  const hasNew = !!findSheet(wb, 'Servers') && !!findSheet(wb, 'Server Nodes');
  if (hasNew) {
    groups = parseServersAndNodes(wb, warnings, cpus);
  } else {
    groups = parseLegacyGroupsSheet(wb, warnings, cpus);
  }

  return { groups, cpus, warnings };
}

// ────────────────────────────────────────────────────────────────────────
// New format (v2.17.33) — Servers + Server Nodes
// ────────────────────────────────────────────────────────────────────────

function parseServersAndNodes(
  wb: XLSX.WorkBook,
  warnings: string[],
  cpus: UserCpu[],
): HardwareGroup[] {
  const serverRows = readSheet(wb, 'Servers', SERVER_HEADERS, warnings);
  const nodeRows = readSheet(wb, 'Server Nodes', NODE_HEADERS, warnings);
  if (!serverRows || !nodeRows) return [];

  const cpuByName = new Map(cpus.map((c) => [c.name.toLowerCase(), c]));

  // Group node rows by Group ID, sorted by Node Type # so the array order
  // reflects the user's intended slot order.
  const nodesByGroup = new Map<string, RackSlot[]>();
  for (const { row, rIdx } of nodeRows.dataRows) {
    const groupId = readStr(row, nodeRows.headerMap['Group ID']);
    if (!groupId) continue;
    const count = readNum(row, nodeRows.headerMap['Count']);
    const memoryGib = readNum(row, nodeRows.headerMap['Memory / Node (GiB)']);
    if (!count || count <= 0 || !memoryGib || memoryGib <= 0) {
      warnings.push(
        `Server Nodes row ${rIdx + 1} (${groupId}): Count and Memory must both be > 0 — skipped.`,
      );
      continue;
    }
    const role = readStr(row, nodeRows.headerMap['Role']).toLowerCase();
    const slot: RackSlot = {
      memoryGibPerNode: memoryGib,
      count,
    };
    if (role === 'utility') slot.isUtility = true;
    if (role === 'other') {
      const label = readStr(row, nodeRows.headerMap['Role Label']);
      if (label) slot.roleLabel = label;
    }
    const proc = readStr(row, nodeRows.headerMap['Processor']);
    if (proc) slot.processor = proc;
    const sockets = readNum(row, nodeRows.headerMap['Sockets / Node']);
    if (sockets != null) slot.socketsPerNode = sockets;
    const coresPerSocket = readNum(row, nodeRows.headerMap['Cores / Socket']);
    if (coresPerSocket != null) slot.coresPerSocket = coresPerSocket;
    const vcpus = readNum(row, nodeRows.headerMap['vCPUs / Node']);
    if (vcpus != null) slot.vcpusPerNode = vcpus;
    const net = readNum(row, nodeRows.headerMap['Network Mbps / Node']);
    if (net != null) slot.networkMbpsPerNode = net;
    // Prefer the new explicit Remote column; fall back to the legacy single
    // "Storage MB/s / Node" column (which was the remote SSD value).
    const remoteStor =
      readNum(row, nodeRows.headerMap['Remote Storage MB/s / Node']) ??
      readNum(row, nodeRows.headerMap['Storage MB/s / Node']);
    if (remoteStor != null) slot.storageThroughputMbpsPerNode = remoteStor;
    const localStor = readNum(row, nodeRows.headerMap['Local Storage MB/s / Node']);
    if (localStor != null) slot.localStorageThroughputMbpsPerNode = localStor;

    const nodeType =
      readNum(row, nodeRows.headerMap['Node Type #']) ??
      (nodesByGroup.get(groupId)?.length ?? 0) + 1;

    if (!nodesByGroup.has(groupId)) nodesByGroup.set(groupId, []);
    const arr = nodesByGroup.get(groupId)!;
    arr.push(slot);
    // Tag a stable sort key so we can reorder by Node Type # below.
    (slot as RackSlot & { __sortKey?: number }).__sortKey = nodeType;
  }
  // Sort each group's slots by node type # for predictable ordering.
  for (const arr of nodesByGroup.values()) {
    arr.sort(
      (a, b) =>
        ((a as RackSlot & { __sortKey?: number }).__sortKey ?? 0) -
        ((b as RackSlot & { __sortKey?: number }).__sortKey ?? 0),
    );
    // Clean the sort key so it doesn't leak into persisted state.
    arr.forEach((s) => delete (s as RackSlot & { __sortKey?: number }).__sortKey);
  }

  const out: HardwareGroup[] = [];
  for (const { row, rIdx } of serverRows.dataRows) {
    const id = readStr(row, serverRows.headerMap['Group ID']);
    const name = readStr(row, serverRows.headerMap['Name']);
    if (!id && !name) continue;
    if (!id) {
      warnings.push(`Servers row ${rIdx + 1}: missing Group ID — skipped.`);
      continue;
    }
    if (!name) {
      warnings.push(`Servers row ${rIdx + 1} (${id}): missing Name — skipped.`);
      continue;
    }
    const slots = nodesByGroup.get(id);
    if (!slots || slots.length === 0) {
      warnings.push(
        `Server "${name}" (${id}): no matching rows in "Server Nodes" — skipped. Add at least one node row with this Group ID.`,
      );
      continue;
    }
    // First slot acts as the "default" for the group-level fields any
    // back-compat consumer reads. Engine reads per-slot from rackComposition.
    const first = slots[0];
    const ht = first.processor
      ? (cpuByName.get(first.processor.toLowerCase())?.hyperthreading ?? true)
      : true;
    const vcpus =
      first.vcpusPerNode ??
      (first.coresPerSocket != null && first.socketsPerNode != null
        ? first.coresPerSocket * first.socketsPerNode * (ht ? 2 : 1)
        : null);
    const totalNodes = slots.reduce((a, s) => a + s.count, 0);

    out.push({
      id,
      name,
      provider: readStr(row, serverRows.headerMap['Provider']) || undefined,
      memoryCategory: deriveMemoryCategory(first.memoryGibPerNode),
      memoryGibPerNode: first.memoryGibPerNode,
      socketsPerNode: first.socketsPerNode ?? 2,
      coresPerSocket: first.coresPerSocket ?? null,
      vcpusPerNode: vcpus,
      nodesPerRack: totalNodes,
      processor: first.processor ?? '',
      rackComposition: slots,
      homeFor: [],
      spilloverFrom: [],
      isolated: false,
      notes: readStr(row, serverRows.headerMap['Notes']) || undefined,
      costPerRackUsd: readNum(row, serverRows.headerMap['Cost per Rack (USD)']) ?? undefined,
      usableLifeMonths: readNum(row, serverRows.headerMap['Usable Life (months)']) ?? undefined,
      networkMbpsPerNode: first.networkMbpsPerNode ?? undefined,
      storageThroughputMbpsPerNode: first.storageThroughputMbpsPerNode ?? undefined,
      localStorageThroughputMbpsPerNode: first.localStorageThroughputMbpsPerNode ?? undefined,
    });
  }
  // Dedupe by id, last wins.
  const seen = new Map<string, HardwareGroup>();
  for (const g of out) {
    if (seen.has(g.id)) warnings.push(`Duplicate Group ID "${g.id}" — keeping last occurrence.`);
    seen.set(g.id, g);
  }
  return Array.from(seen.values());
}

// ────────────────────────────────────────────────────────────────────────
// Legacy format (pre v2.17.33) — single "Hardware Groups" sheet with the
// `2x8192+1x16384u` rack composition shorthand. Kept for back-compat with
// older user uploads. New downloads use the 3-sheet format above.
// ────────────────────────────────────────────────────────────────────────

const LEGACY_HW_HEADERS = [
  'Group ID',
  'Name',
  'Cloud Provider',
  'Rack Layout',
  'RAM per Node (GiB)',
  'Rack Composition',
  'Sockets per Node',
  'Cores per Socket',
  'Cores per Node',
  'vCPUs per Node',
  'Nodes per Rack',
  'Processor',
  'Isolated',
  'Cost per Node (USD)',
  'Cost per Rack (USD)',
  'Usable Life (months)',
  'Network Mbps per Node',
  'NICs per Node',
  'Notes',
] as const;

function parseLegacyGroupsSheet(
  wb: XLSX.WorkBook,
  warnings: string[],
  cpus: UserCpu[],
): HardwareGroup[] {
  const rows = readSheet(wb, 'Hardware Groups', LEGACY_HW_HEADERS, warnings);
  if (!rows) return [];
  const cpuByName = new Map(cpus.map((c) => [c.name.toLowerCase(), c]));
  const out: HardwareGroup[] = [];
  for (const { row, rIdx } of rows.dataRows) {
    const id = readStr(row, rows.headerMap['Group ID']);
    const name = readStr(row, rows.headerMap['Name']);
    if (!id && !name) continue;
    if (!id || !name) {
      warnings.push(`Hardware Groups row ${rIdx + 1}: needs both Group ID and Name — skipped.`);
      continue;
    }
    const layoutRaw = readStr(row, rows.headerMap['Rack Layout']).toLowerCase();
    const compositionCell = readStr(row, rows.headerMap['Rack Composition']);
    const rackComposition = parseLegacyRackComposition(compositionCell);
    let isHetero: boolean;
    if (layoutRaw.startsWith('hetero')) isHetero = true;
    else if (layoutRaw.startsWith('homo')) isHetero = false;
    else isHetero = !!rackComposition;
    if (isHetero && !rackComposition) {
      warnings.push(
        `Hardware Groups row ${rIdx + 1} (${id}): Heterogeneous layout needs "Rack Composition" — skipped.`,
      );
      continue;
    }
    const ramRaw = readNum(row, rows.headerMap['RAM per Node (GiB)']);
    const memoryGibPerNode =
      ramRaw ?? (rackComposition ? representativeMem(rackComposition) : 0);
    if (memoryGibPerNode <= 0) {
      warnings.push(
        `Hardware Groups row ${rIdx + 1} (${id}): need RAM per Node or Rack Composition — skipped.`,
      );
      continue;
    }
    const sockets = readNum(row, rows.headerMap['Sockets per Node']) ?? 0;
    const coresPerSocket = readNum(row, rows.headerMap['Cores per Socket']);
    const coresPerNodeCell = readNum(row, rows.headerMap['Cores per Node']);
    const coresPerNode =
      coresPerNodeCell ??
      (sockets && coresPerSocket != null ? sockets * coresPerSocket : null);
    const processor = readStr(row, rows.headerMap['Processor']);
    const ht = processor ? cpuByName.get(processor.toLowerCase())?.hyperthreading ?? true : true;
    const legacyVcpus = readNum(row, rows.headerMap['vCPUs per Node']);
    const vcpusPerNode =
      legacyVcpus ?? (coresPerNode != null ? coresPerNode * (ht ? 2 : 1) : null);

    out.push({
      id,
      name,
      provider: readStr(row, rows.headerMap['Cloud Provider']) || undefined,
      memoryCategory: deriveMemoryCategory(memoryGibPerNode),
      memoryGibPerNode,
      socketsPerNode: sockets,
      coresPerSocket,
      vcpusPerNode,
      nodesPerRack: readNum(row, rows.headerMap['Nodes per Rack']),
      processor,
      rackComposition,
      homeFor: [],
      spilloverFrom: [],
      isolated: parseYesNo(readStr(row, rows.headerMap['Isolated'])),
      costPerNodeUsd: readNum(row, rows.headerMap['Cost per Node (USD)']) ?? undefined,
      costPerRackUsd: readNum(row, rows.headerMap['Cost per Rack (USD)']) ?? undefined,
      usableLifeMonths: readNum(row, rows.headerMap['Usable Life (months)']) ?? undefined,
      networkMbpsPerNode: readNum(row, rows.headerMap['Network Mbps per Node']) ?? undefined,
      networkNicCount: readNum(row, rows.headerMap['NICs per Node']) ?? undefined,
      notes: readStr(row, rows.headerMap['Notes']) || undefined,
    });
  }
  const seen = new Map<string, HardwareGroup>();
  for (const g of out) {
    if (seen.has(g.id)) warnings.push(`Duplicate Group ID "${g.id}" — keeping last occurrence.`);
    seen.set(g.id, g);
  }
  return Array.from(seen.values());
}

function parseLegacyRackComposition(s: string): RackSlot[] | undefined {
  if (!s) return undefined;
  const parts = s.split(/[+,]/).map((x) => x.trim()).filter(Boolean);
  const out: RackSlot[] = [];
  for (const p of parts) {
    const m = p.match(/^(\d+)\s*[x×*]\s*(\d+)\s*(u)?$/i);
    if (!m) return undefined;
    const count = Number(m[1]);
    const mem = Number(m[2]);
    const isUtility = !!m[3];
    if (count > 0 && mem > 0) {
      out.push(isUtility ? { count, memoryGibPerNode: mem, isUtility: true } : { count, memoryGibPerNode: mem });
    }
  }
  if (out.length === 0) return undefined;
  if (out.length > 4) return out.slice(0, 4);
  return out;
}

function representativeMem(comp: RackSlot[]): number {
  const workload = comp.filter((c) => !c.isUtility);
  const pool = workload.length > 0 ? workload : comp;
  return Math.min(...pool.map((c) => c.memoryGibPerNode));
}

// ────────────────────────────────────────────────────────────────────────
// CPU sheet — unchanged across formats.
// ────────────────────────────────────────────────────────────────────────

function parseCpuSheet(wb: XLSX.WorkBook, warnings: string[]): UserCpu[] {
  const rows = readSheet(wb, 'CPU Library', CPU_HEADERS, warnings);
  if (!rows) return [];
  const out: UserCpu[] = [];
  for (const { row } of rows.dataRows) {
    const name = readStr(row, rows.headerMap['CPU Name']);
    if (!name) continue;
    const vendorCell = readStr(row, rows.headerMap['Vendor']);
    const vendor =
      vendorCell || (/amd|epyc/i.test(name) ? 'AMD' : /ampere|altra/i.test(name) ? 'Ampere' : 'Intel');
    const htCell = readStr(row, rows.headerMap['Hyperthreading']);
    const hyperthreading = htCell
      ? parseYesNo(htCell)
      : vendor.toLowerCase() === 'intel';
    out.push({
      name,
      vendor,
      family: readStr(row, rows.headerMap['Family']),
      coresPerSocket: readNum(row, rows.headerMap['Cores per Socket']) ?? 0,
      hyperthreading,
    });
  }
  const seen = new Map<string, UserCpu>();
  for (const c of out) {
    if (seen.has(c.name)) warnings.push(`Duplicate CPU "${c.name}" — keeping last occurrence.`);
    seen.set(c.name, c);
  }
  return Array.from(seen.values());
}

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────

interface SheetRead {
  headerMap: Record<string, number>;
  dataRows: { row: unknown[]; rIdx: number }[];
}

function readSheet(
  wb: XLSX.WorkBook,
  name: string,
  headers: readonly string[],
  warnings: string[],
): SheetRead | null {
  const sheet = findSheet(wb, name);
  if (!sheet) {
    warnings.push(`Sheet "${name}" not found — skipped.`);
    return null;
  }
  const rows = sheetToRows(sheet);
  const headerRowIdx = findHeaderRow(rows, headers[0]);
  if (headerRowIdx < 0) {
    warnings.push(`"${name}" tab: column-header row not found (looking for "${headers[0]}").`);
    return null;
  }
  const headerMap = mapHeaders(rows[headerRowIdx], headers);
  const dataRows = rows
    .slice(headerRowIdx + 1)
    .map((row, i) => ({ row, rIdx: headerRowIdx + 1 + i }));
  return { headerMap, dataRows };
}

function findSheet(wb: XLSX.WorkBook, name: string): XLSX.WorkSheet | null {
  const exact = wb.Sheets[name];
  if (exact) return exact;
  const match = wb.SheetNames.find((n) => n.toLowerCase() === name.toLowerCase());
  return match ? wb.Sheets[match] : null;
}

function sheetToRows(sheet: XLSX.WorkSheet): unknown[][] {
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });
}

function findHeaderRow(rows: unknown[][], anchor: string): number {
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i];
    if (row.some((c) => String(c ?? '').trim().toLowerCase() === anchor.toLowerCase())) return i;
  }
  return -1;
}

function mapHeaders(headerRow: unknown[], expected: readonly string[]): Record<string, number> {
  const map: Record<string, number> = {};
  const cells = headerRow.map((c) => String(c ?? '').trim().toLowerCase());
  for (const h of expected) {
    map[h] = cells.indexOf(h.toLowerCase());
  }
  return map;
}

function readStr(row: unknown[], col: number): string {
  if (col < 0) return '';
  const v = row[col];
  if (v === undefined || v === null) return '';
  return String(v).trim();
}

function readNum(row: unknown[], col: number): number | null {
  const s = readStr(row, col);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseYesNo(s: string): boolean {
  const t = s.trim().toLowerCase();
  return t === 'yes' || t === 'y' || t === 'true' || t === '1';
}

function deriveMemoryCategory(memGib: number): MemoryCategoryId {
  if (memGib >= 24576) return 'vhm';
  if (memGib > 4096) return 'hm';
  return 'mm';
}
