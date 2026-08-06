/**
 * Diagnose the P0 spillover bug — load the walkthrough fixture, run runMulti,
 * print where placements are leaking. Run via:
 *   npx vite-node scripts/diagnose-spillover.mjs
 */
import { readFileSync } from 'node:fs';
import { runMulti } from '../src/components/RunFooter.tsx';
import { vmClass } from '../src/utils/vmTaxonomy.ts';
import { deployableNodes, vcpusPerNode } from '../src/types/index.ts';

const FIXTURE = 'src/test-fixtures/walkthrough-2026-06-05.json';
const raw = JSON.parse(readFileSync(FIXTURE, 'utf8'));
const d = raw.data;

// Region scope: BoM rows in fixture have no explicit region; fleets are East US 2.
// Per RunFooter.run(), state.ui.activeRegion is consulted — fixture doesn't
// persist that, so the snapshot leaves it empty. Mirror by including all
// catalog rows that match each region present in placed fleets.
const placedRegions = new Set(
  Object.values(d.fleets).map((f) => f.region).filter(Boolean),
);
// Fallback: if no region authored, pass everything.
const scopedCatalog = placedRegions.size === 0
  ? d.userVms
  : d.userVms.filter((v) => !v.region || placedRegions.has(v.region));

const vmClassByName = {};
for (const v of scopedCatalog) vmClassByName[v.vmSizeName] = vmClass(v);

const hwById = {};
for (const g of d.userHardware) hwById[g.id] = g;

// fleetList shape — runMulti accepts {id, fleet}[]
const fleetOrder = d.fleetOrder ?? Object.keys(d.fleets);
const clusters = fleetOrder
  .filter((id) => d.fleets[id])
  .map((id) => ({ id, fleet: d.fleets[id] }));

console.log('=== Fixture overview ===');
console.log('BoM rows:', d.bom.length, '· total VMs:', d.bom.reduce((s,r)=>s+r.quantity,0));
console.log('Fleets:', clusters.length);
for (const { id, fleet } of clusters) {
  const dep = deployableNodes(fleet);
  console.log(`  ${id} hw=${fleet.hardwareGroupId} zone=${fleet.zone} racks=${fleet.rackCount} nodes/rack=${fleet.nodesPerRack} mem/node=${fleet.memoryGibPerNode} vcpu/node=${vcpusPerNode(fleet)} deployable=${dep.deployable}/${dep.totalNonUtility}`);
}
console.log('Catalog rows after region scope:', scopedCatalog.length);

console.log('\n=== Run ===');
const result = runMulti(
  clusters,
  d.bom,
  d.buffer,
  d.packingMode,
  d.fungibilityOn,
  scopedCatalog,
  d.userFungibility,
  vmClassByName,
  hwById,
);

console.log('Placed:', result.vmsPlaced);
console.log('Unplaceable total:', result.vmsUnplaceable.reduce((s,u)=>s+u.count,0));
console.log('Spillover events:', result.spilloverEvents.length);

console.log('\n=== Unplaceable breakdown ===');
const byReason = {};
for (const u of result.vmsUnplaceable) {
  const key = `${u.vmSizeName} :: ${u.blockingReason}`;
  byReason[key] = (byReason[key] ?? 0) + u.count;
}
for (const [k, v] of Object.entries(byReason)) {
  console.log(`  ${v.toString().padStart(4)} × ${k}`);
}

console.log('\n=== Unplaceable details (first sample per group) ===');
const seen = new Set();
for (const u of result.vmsUnplaceable) {
  const key = `${u.vmSizeName}|${u.blockingReason}`;
  if (seen.has(key)) continue;
  seen.add(key);
  console.log(`  [${u.blockingReason}] ${u.vmSizeName} ×${u.count} — ${u.details ?? '(no details)'}`);
}

console.log('\n=== Matrix cells for each BoM SKU ===');
const seenSkus = new Set();
for (const row of d.bom) {
  if (seenSkus.has(row.vmSizeName)) continue;
  seenSkus.add(row.vmSizeName);
  const cat = scopedCatalog.find((v) => v.vmSizeName === row.vmSizeName);
  const cls = cat ? vmClass(cat) : null;
  const sizeCells = d.userFungibility[row.vmSizeName] ?? {};
  const classCells = cls ? (d.userFungibility[cls] ?? {}) : {};
  console.log(`  ${row.vmSizeName} (class=${cls}, mem=${cat?.memoryGib}, vcpu=${cat?.vcpus}, net=${cat?.networkMbps}, stor=${cat?.remoteStorageMbpsPremium})`);
  console.log(`    size-keyed cells: ${JSON.stringify(sizeCells)}`);
  console.log(`    class-keyed cells: ${JSON.stringify(classCells)}`);
  for (const { id, fleet } of clusters) {
    const sCell = sizeCells[fleet.hardwareGroupId];
    const cCell = classCells[fleet.hardwareGroupId];
    const effective = sCell !== undefined ? sCell : cCell;
    console.log(`      ${id} (${fleet.hardwareGroupId} z=${fleet.zone}): size=${sCell ?? '∅'} class=${cCell ?? '∅'} effective=${effective ?? 'UNAUTHORED'}`);
  }
}

console.log('\n=== Per-cluster placement summary ===');
const clusterById = Object.fromEntries(clusters.map(c => [c.id, c]));
const byCluster = {};
for (const node of result.nodeDetail) {
  const cid = node.clusterId;
  byCluster[cid] = byCluster[cid] ?? { nodes: 0, vmsPlaced: 0, memUsed: 0, memTotal: 0 };
  byCluster[cid].nodes++;
  byCluster[cid].vmsPlaced += node.vmsPlaced.length;
  byCluster[cid].memUsed += node.memoryUsedGib;
  byCluster[cid].memTotal += node.memoryTotalGib;
}
for (const [cid, s] of Object.entries(byCluster)) {
  const f = clusterById[cid]?.fleet;
  console.log(`  ${cid} (${f?.hardwareGroupId} z=${f?.zone}): ${s.vmsPlaced} VMs / ${s.nodes} nodes / mem ${Math.round(s.memUsed)}/${s.memTotal} (${((s.memUsed/s.memTotal)*100).toFixed(1)}%)`);
}

console.log('\n=== Per-SKU per-cluster placement (drill) ===');
const skuByCluster = {};
for (const node of result.nodeDetail) {
  const cid = node.clusterId;
  skuByCluster[cid] = skuByCluster[cid] ?? {};
  for (const vm of node.vmsPlaced) {
    skuByCluster[cid][vm.vmSizeName] = (skuByCluster[cid][vm.vmSizeName] ?? 0) + 1;
  }
}
for (const [cid, counts] of Object.entries(skuByCluster)) {
  const f = clusterById[cid]?.fleet;
  console.log(`  ${cid} (${f?.hardwareGroupId} z=${f?.zone}): ${JSON.stringify(counts)}`);
}
// Totals per SKU
const totalsBySku = {};
for (const counts of Object.values(skuByCluster)) {
  for (const [sku, n] of Object.entries(counts)) totalsBySku[sku] = (totalsBySku[sku] ?? 0) + n;
}
console.log('\n=== Total placed per SKU ===');
const askedBySku = {};
for (const r of d.bom) askedBySku[r.vmSizeName] = (askedBySku[r.vmSizeName] ?? 0) + r.quantity;
for (const [sku, n] of Object.entries(totalsBySku)) {
  console.log(`  ${sku}: placed=${n}, asked=${askedBySku[sku] ?? '?'}, delta=${n - (askedBySku[sku] ?? 0)}`);
}

console.log('\n=== Theoretical max per (SKU, zone) ===');
for (const row of d.bom) {
  const cat = scopedCatalog.find((v) => v.vmSizeName === row.vmSizeName);
  if (!cat) continue;
  const zone = row.zones?.[0];
  console.log(`  ${row.vmSizeName} z=${zone} qty=${row.quantity} (mem ${cat.memoryGib}, vcpu ${cat.vcpus})`);
  for (const { id, fleet } of clusters) {
    if (zone && fleet.zone !== zone) continue;
    const sCell = d.userFungibility[row.vmSizeName]?.[fleet.hardwareGroupId];
    const cls = vmClass(cat);
    const cCell = d.userFungibility[cls]?.[fleet.hardwareGroupId];
    const eff = sCell !== undefined ? sCell : cCell;
    if (eff === undefined || eff === 'blocked') continue;
    const dep = deployableNodes(fleet);
    // dep already incorporates utility exclusion but NOT global buffer; apply
    // bufferDefault if present.
    const memPerNode = fleet.memoryGibPerNode;
    if (cat.memoryGib > memPerNode) {
      console.log(`    ${id} (${fleet.hardwareGroupId}): OVERSIZED per-node (${cat.memoryGib} > ${memPerNode})`);
      continue;
    }
    const vmsPerNode = Math.min(
      Math.floor(memPerNode / cat.memoryGib),
      Math.floor(vcpusPerNode(fleet) / cat.vcpus),
    );
    const maxVms = vmsPerNode * dep.deployable;
    console.log(`    ${id} (${fleet.hardwareGroupId}, tier=${eff}): ~${maxVms} VMs (${vmsPerNode}/node × ${dep.deployable} deployable)`);
  }
}

console.log('\n=== Per-node placement detail (f-1, first 10 nodes) ===');
const f1nodes = result.nodeDetail.filter(n => n.clusterId === 'f-1').slice(0, 12);
for (const n of f1nodes) {
  const skus = {};
  for (const vm of n.vmsPlaced) skus[vm.vmSizeName] = (skus[vm.vmSizeName] ?? 0) + 1;
  console.log(`  ${n.nodeId} state=${n.state} mem=${n.memoryUsedGib}/${n.memoryTotalGib} vcpu=${n.vcpusUsed}/${n.vcpusTotal} vms=${JSON.stringify(skus)}`);
}
