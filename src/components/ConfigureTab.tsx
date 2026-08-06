import { BomFilter } from './BomFilter';
import { BomBulkAddPanel } from './BomBulkAddPanel';
import { BomSection } from './BomSection';

// VM BoM ("VM demand") tab.
// v2.22.6 — Three stacked boxes, top to bottom:
//   1. BomFilter — ONE consolidated box: Cloud Provider (initial filter) +
//      BoM Filters (VM Category / VM Family) + Region (required, at the
//      bottom). This is the scope every surface below reads.
//   2. BomBulkAddPanel — the bulk add table (quick-add bar + grid), filtered
//      to the scope from box 1, so the user can build a BoM fast.
//   3. BomSection — the committed Bill of Materials, with per-row controls.
// The search-first BomQuickAdd + the collapsed "Browse & bulk add" disclosure
// were retired: the filter box + always-visible bulk table cover both.
export function ConfigureTab() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <BomFilter />
        <BomBulkAddPanel />
        <Divider />
        <BomSection />
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div
      className="h-px"
      style={{
        background: 'linear-gradient(90deg, transparent, var(--border-dark), transparent)',
      }}
    />
  );
}
