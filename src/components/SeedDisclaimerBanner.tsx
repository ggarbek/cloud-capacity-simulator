/**
 * v2.11 (Phase E0.5) — Public seed disclaimer banner.
 *
 * Shown at the top of the VM Library and Hardware Library tabs. Tells
 * users the catalog ships pre-loaded with public vendor data as of a
 * specific date, and that they can modify rates / regions / SKUs by
 * downloading the Excel template, editing, and re-uploading.
 *
 * Doctrine v2.11 amendment: public vendor data is allowed in seed at
 * full detail. The disclaimer is the transparency layer.
 */
import { SEED_DATA_AS_OF } from '../data/azureMSeriesSeed';
import { LIVE_CATALOG_AS_OF } from '../data/liveCatalog';

export function SeedDisclaimerBanner({
  surface,
}: {
  /** Which library this banner is hosted on — drives the example copy. */
  surface: 'vm' | 'hardware';
}) {
  const isVm = surface === 'vm';
  const detail = isVm
    ? 'VM specs and pricing (Azure / AWS / GCP)'
    : 'CPU specs and hardware reference data';
  // v2.25.5 — the VM catalog ships LIVE (real per-region rates, refreshed
  // weekly with the deploy), so it carries the live pull date, not the static
  // seed date. The hardware reference data is still the static seed.
  const asOf = isVm ? LIVE_CATALOG_AS_OF : SEED_DATA_AS_OF;
  const lead = isVm
    ? 'ship live from vendor pricing APIs (refreshed weekly with the deploy)'
    : 'ship pre-loaded from vendor docs and pricing APIs';
  return (
    <div
      className="text-[11px] leading-relaxed px-3 py-2 mb-3"
      style={{
        background: 'rgba(96, 165, 250, 0.05)',
        border: '1px solid rgba(96, 165, 250, 0.22)',
        color: 'var(--text-secondary)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <div>
        <span className="font-semibold" style={{ color: '#93C5FD' }}>
          ⓘ Public vendor data ·{' '}
          <span className="font-mono">as of {asOf}</span>
        </span>
        <span className="ml-1">
          — {detail} {lead}. To modify rates, add regions, or override with
          internal SKUs, use the ⤓ Template / ⤒ Upload buttons in the section
          headers below to edit and re-upload. User uploads always win.
        </span>
      </div>
      {/* v2.11.1 — Per-provider source links so users can verify or
          refresh rates against the canonical pricing pages. */}
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 items-center">
        <span
          className="text-[9px] tracking-[0.04em]"
          style={{ color: 'var(--text-muted)' }}
        >
          Sources
        </span>
        <SourceLink
          href="https://azure.microsoft.com/en-us/pricing/details/virtual-machines/linux/"
          label="Azure VM pricing"
        />
        <SourceLink
          href="https://aws.amazon.com/ec2/pricing/on-demand/"
          label="AWS EC2 pricing"
        />
        <SourceLink
          href="https://cloud.google.com/compute/vm-instance-pricing"
          label="GCP Compute pricing"
        />
        <SourceLink
          href="https://prices.azure.com/api/retail/prices"
          label="Azure Retail Prices API"
        />
      </div>
    </div>
  );
}

function SourceLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-[10px] transition-colors hover:underline"
      style={{ color: '#93C5FD' }}
      title={href}
    >
      {label} ↗
    </a>
  );
}
