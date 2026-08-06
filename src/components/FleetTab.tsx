import { FleetBuilder } from './FleetBuilder';

/**
 * v2.18 — Fleet Builder. Strictly rack planning: author regions/zones,
 * place clusters from the Hardware Library into them. No hardware editing
 * happens here — the Library is the single source of truth for specs,
 * including buffer/overhead (each HW group carries its own; the cluster
 * cards in the roster show the resulting reserved/deployable per cluster).
 * v2.21 — RunFooter retired: the Run action lives in the top bar
 * (RunControl) so it's reachable from every setup page.
 */
export function FleetTab() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <FleetBuilder />
      </div>
    </div>
  );
}
