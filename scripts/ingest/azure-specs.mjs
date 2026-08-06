#!/usr/bin/env node
// Azure VM spec ingestion — AUTHENTICATED, Resource SKUs API.
//
// Pulls hardware specs (vCPUs, memory, data-disk count, GPUs, accelerated
// networking) for EVERY Azure VM size, plus the regions each size is available
// in. Specs are region-INDEPENDENT (a D8s_v5 has 8 vCPU everywhere), so this
// writes ONE file — public/rates/azure/_specs.json — that the loader joins
// against the per-region rate shards (azure-prices.mjs) at price time.
//
// Together: _specs.json (specs + availability) ⨝ <region>.json (rates) =
// a complete, API-sourced catalog for any region — no hand-transcribed seed.
//
// Caveat: the SKUs API does NOT expose network throughput in Mbps (Azure
// publishes that only in docs). vCPU + memory — the dimensions that actually
// bind — come straight from the API; the network ceiling stays doc-derived.
//
// AUTH (pick one — the script tries them in order):
//   1. Azure CLI token (simplest for a local run):
//        az login            # one-time, opens a browser
//        node scripts/ingest/azure-specs.mjs
//      The script shells out to `az account get-access-token`. No secrets stored.
//   2. Service principal via env (for CI / automation):
//        AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_SUBSCRIPTION_ID
//      (from `az ad sp create-for-rbac`). Never commit these.
//
// You need a (free) Azure subscription — the SKUs API is scoped to one and is
// free to call. See scripts/ingest/README.md for account setup.

import { writeFile, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const execFileP = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', '..', 'public', 'rates', 'azure');
const MGMT = 'https://management.azure.com';
const API_VERSION = '2021-07-01';

/** Resolve a management-plane bearer token + subscription id. */
async function getAuth() {
  // 2) Service principal (client credentials) from env.
  const { AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_SUBSCRIPTION_ID } = process.env;
  if (AZURE_TENANT_ID && AZURE_CLIENT_ID && AZURE_CLIENT_SECRET && AZURE_SUBSCRIPTION_ID) {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: AZURE_CLIENT_ID,
      client_secret: AZURE_CLIENT_SECRET,
      resource: MGMT + '/',
    });
    const res = await fetch(`https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) throw new Error(`SP token failed: ${res.status}`);
    const { access_token } = await res.json();
    return { token: access_token, subscriptionId: AZURE_SUBSCRIPTION_ID };
  }

  // 1) Azure CLI token (default).
  try {
    const { stdout: tok } = await execFileP('az', [
      'account', 'get-access-token', '--resource', MGMT, '-o', 'json',
    ]);
    const { accessToken, subscription } = JSON.parse(tok);
    return { token: accessToken, subscriptionId: subscription };
  } catch {
    throw new Error(
      'No Azure credential. Run `az login` first (install: https://aka.ms/InstallAzureCLI), ' +
      'or set AZURE_TENANT_ID / AZURE_CLIENT_ID / AZURE_CLIENT_SECRET / AZURE_SUBSCRIPTION_ID.',
    );
  }
}

/** Page through the Resource SKUs list, following nextLink. */
async function fetchSkus(token, subscriptionId) {
  const items = [];
  let url = `${MGMT}/subscriptions/${subscriptionId}/providers/Microsoft.Compute/skus?api-version=${API_VERSION}`;
  let pages = 0;
  while (url) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`SKUs API ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const json = await res.json();
    items.push(...(json.value ?? []));
    url = json.nextLink ?? null;
    pages++;
    process.stdout.write(`\r  …${items.length} SKUs (${pages} pages)`);
  }
  return items;
}

const num = (caps, name) => {
  const c = caps.find((x) => x.name === name);
  const v = c ? Number(c.value) : NaN;
  return Number.isFinite(v) ? v : null;
};
const flag = (caps, name) => {
  const c = caps.find((x) => x.name === name);
  return c ? String(c.value).toLowerCase() === 'true' : null;
};

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log('Authenticating…');
  const { token, subscriptionId } = await getAuth();
  console.log(`  subscription ${subscriptionId}`);
  console.log('Fetching VM SKUs…');
  const raw = await fetchSkus(token, subscriptionId);
  console.log('');

  const specs = {};
  for (const s of raw) {
    if (s.resourceType !== 'virtualMachines') continue;
    const caps = s.capabilities ?? [];
    const vcpus = num(caps, 'vCPUs');
    const memoryGib = num(caps, 'MemoryGB');
    if (vcpus == null || memoryGib == null) continue; // unusable without the two binding dims
    // Region availability (skip locations the size is restricted in).
    const restricted = new Set(
      (s.restrictions ?? [])
        .filter((r) => r.type === 'Location')
        .flatMap((r) => r.restrictionInfo?.locations ?? r.values ?? []),
    );
    const regions = (s.locations ?? []).filter((loc) => !restricted.has(loc));
    specs[s.name] = {
      vcpus,
      memoryGib,
      maxDataDisks: num(caps, 'MaxDataDiskCount'),
      gpus: num(caps, 'GPUs'),
      acceleratedNetworking: flag(caps, 'AcceleratedNetworkingEnabled'),
      premiumIO: flag(caps, 'PremiumIO'),
      regions,
    };
  }

  const skuCount = Object.keys(specs).length;
  await writeFile(
    join(OUT_DIR, '_specs.json'),
    JSON.stringify({ provider: 'azure', generatedAt: new Date().toISOString(), specs }, null, 0),
  );
  console.log(`✓ Wrote specs for ${skuCount} VM sizes → public/rates/azure/_specs.json`);
}

main().catch((e) => {
  console.error('\nSpec ingestion failed:', e.message);
  process.exit(1);
});
