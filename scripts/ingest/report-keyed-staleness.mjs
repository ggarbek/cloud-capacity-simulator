#!/usr/bin/env node
/**
 * report-keyed-staleness.mjs — warn (never fail) when a KEYED ingest shard has
 * gone stale because its secret is absent.
 *
 * WHY: two ingest steps need secrets — Azure specs (a service principal) and GCP
 * rates (an API key). When a secret is absent the weekly job SKIPS that step by
 * design and keeps the last-good shard, so the build never breaks. But that
 * shard then quietly ages. This script surfaces the drift: if a keyed secret is
 * absent AND its shard is older than 30 days, it prints a GitHub `::warning::`
 * annotation and appends a block to the job summary naming the secret and
 * pointing at AUTOMATION.md — so the gap is visible without ever failing the job.
 *
 * ALWAYS exits 0. It is a report, not a gate (validate-shards.mjs is the gate).
 *
 * Env read (set by refresh-rates.yml from secret presence):
 *   HAS_AZURE_SP  — 'true' when the Azure service-principal secrets are all set
 *   HAS_GCP_KEY   — 'true' when GCP_API_KEY is set
 * Falls back to the raw secret env vars if those booleans are unset (local runs).
 *
 * Run:  node scripts/ingest/report-keyed-staleness.mjs
 */
import { readFileSync, existsSync, appendFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const RATES_DIR = resolve(ROOT, 'public/rates');

const STALE_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const truthy = (v) => String(v ?? '').toLowerCase() === 'true';

// Presence of each keyed secret. Prefer the workflow-resolved booleans; fall
// back to the raw secret env vars so a local run reports sensibly too.
const hasAzureSp = process.env.HAS_AZURE_SP != null
  ? truthy(process.env.HAS_AZURE_SP)
  : !!(process.env.AZURE_TENANT_ID && process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET && process.env.AZURE_SUBSCRIPTION_ID);
const hasGcpKey = process.env.HAS_GCP_KEY != null
  ? truthy(process.env.HAS_GCP_KEY)
  : !!process.env.GCP_API_KEY;

/** Each keyed step, its shard, the secret that feeds it, and its presence flag. */
const KEYED = [
  {
    label: 'Azure specs',
    shard: resolve(RATES_DIR, 'azure', '_specs.json'),
    secret: 'AZURE_TENANT_ID / AZURE_CLIENT_ID / AZURE_CLIENT_SECRET / AZURE_SUBSCRIPTION_ID (service principal)',
    present: hasAzureSp,
  },
  {
    label: 'GCP rates',
    shard: resolve(RATES_DIR, 'gcp', '_index.json'),
    secret: 'GCP_API_KEY (Cloud Billing Catalog)',
    present: hasGcpKey,
  },
];

function shardAgeDays(path) {
  if (!existsSync(path)) return null;
  try {
    const ga = JSON.parse(readFileSync(path, 'utf8')).generatedAt;
    if (!ga) return null;
    const ms = Date.now() - new Date(ga).getTime();
    return Number.isFinite(ms) ? ms / MS_PER_DAY : null;
  } catch {
    return null;
  }
}

const warnings = [];
for (const k of KEYED) {
  if (k.present) continue; // secret present — step runs, shard stays fresh
  const age = shardAgeDays(k.shard);
  if (age == null) continue; // no shard / no stamp — nothing to warn about
  if (age > STALE_DAYS) {
    warnings.push({ ...k, ageDays: Math.round(age) });
  }
}

for (const w of warnings) {
  console.log(
    `::warning::${w.label} shard is ${w.ageDays} days old and its secret is not configured — ` +
      `add ${w.secret} to refresh it. See scripts/ingest/AUTOMATION.md.`,
  );
}

// Append a markdown block to the GitHub job summary, if running in CI.
const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (summaryPath) {
  let md = '## Keyed-step staleness\n\n';
  if (warnings.length === 0) {
    md += 'All keyed ingest shards are current (or their secrets are configured). No action needed.\n';
  } else {
    md += 'These keyed ingest steps are SKIPPED because their secret is absent, and their last-good shard has gone stale:\n\n';
    md += '| Keyed step | Shard age | Secret to configure |\n';
    md += '| --- | --- | --- |\n';
    for (const w of warnings) {
      md += `| ${w.label} | ${w.ageDays} days | \`${w.secret}\` |\n`;
    }
    md += '\nSee [scripts/ingest/AUTOMATION.md](scripts/ingest/AUTOMATION.md) for the one-time secret setup.\n';
  }
  try {
    appendFileSync(summaryPath, md + '\n');
  } catch {
    /* summary is best-effort; never fail */
  }
}

if (warnings.length) {
  console.log(`report-keyed-staleness: ${warnings.length} keyed shard(s) stale (>${STALE_DAYS}d) with no secret. Warned; not failing.`);
} else {
  console.log('report-keyed-staleness: no stale keyed shards. OK.');
}

process.exit(0);
