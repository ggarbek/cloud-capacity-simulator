/**
 * Hardware tab — the v2.0 "inputs hub" for hardware data, expanded in v2.4.3
 * with search, smart facet filters, inline edit-in-place, and duplicate.
 *
 * Tool ships with NO baked-in hardware groups (per the Decoupling Doctrine).
 * The user downloads the Excel template, fills it in, and uploads it here.
 * Uploaded groups + CPUs persist to localStorage and feed the Configure tab's
 * Hardware Group / Processor dropdowns automatically.
 *
 * Layout (top to bottom):
 *   1. Download template + Upload Excel buttons (always visible)
 *   2. Hardware Groups list — search + facet pills, then cards with
 *      click-to-expand inline editor + ⎘ duplicate + ✕ delete (5s undo)
 *   3. CPU Library list — same affordances
 *   4. Empty-state guidance when the lists are empty
 */
import { useMemo, useRef, useState } from 'react';
import { useApp } from '../state/AppContext';
import { ZONES, type HardwareGroup, type UserCpu } from '../types';
import { parseHardwareTemplate } from '../utils/hardwareTemplate';
import { GlassDropdown, type DropdownOption } from './GlassDropdown';
import { SeedDisclaimerBanner } from './SeedDisclaimerBanner';
import { ServerBuilderSection } from './ServerBuilderSection';
import { CpuBuilderSection } from './CpuBuilderSection';
import { STARTER_SERVERS } from '../utils/quickStartTemplate';
import {
  hardwareIncompleteCount,
  hardwareMissingFields,
} from '../utils/hardwareCompleteness';

// ── Smart-filter facet helpers ───────────────────────────────────────────
// Facets render only when the catalog has 2+ distinct values for the trait,
// so a 3-row dev catalog doesn't bury the list under a wall of single-option
// pills. Same idiom on both sections.
function distinctNonEmpty(values: (string | undefined)[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => !!v && v.length > 0))).sort();
}

/** Bucket a hardware group's memoryGibPerNode into a coarse label. */
function memoryBand(g: HardwareGroup): string {
  const m = g.memoryGibPerNode;
  if (m <= 512) return '≤ 512 GiB';
  if (m <= 2048) return '513 GiB – 2 TiB';
  if (m <= 8192) return '2 TiB – 8 TiB';
  if (m <= 16384) return '8 TiB – 16 TiB';
  return '> 16 TiB';
}

/** Coarse CPU-family slug extracted from a CPU name — used as a facet on
 *  hardware groups (groups carry a free-text `processor` string). */
function cpuFamilyFromName(processor: string): string {
  const p = processor.toLowerCase();
  if (p.includes('sapphire rapids') || p.includes('4th gen')) return 'Sapphire Rapids';
  if (p.includes('cascade lake') || p.includes('platinum 8280')) return 'Cascade Lake';
  if (p.includes('skylake') || p.includes('8180')) return 'Skylake';
  if (p.includes('e7-8890')) return 'Haswell (E7-8890)';
  if (p.includes('genoa') || p.includes('epyc 9')) return 'AMD Genoa';
  if (p.includes('milan') || p.includes('epyc 7')) return 'AMD Milan';
  return '';
}

/** Heuristic vendor inference for CPUs — the user template doesn't yet have
 *  an explicit Vendor column on the CPU tab. Surfaced as a smart-filter
 *  facet so the user can scope to Intel / AMD without typing. */
function inferCpuVendor(cpu: UserCpu): string {
  const n = (cpu.name + ' ' + (cpu.family ?? '')).toLowerCase();
  if (n.includes('intel') || n.includes('xeon') || n.includes('cascade') || n.includes('sapphire') || n.includes('skylake') || n.includes('platinum 8') || n.includes('e7-')) return 'Intel';
  if (n.includes('amd') || n.includes('epyc') || n.includes('genoa') || n.includes('milan') || n.includes('bergamo')) return 'AMD';
  if (n.includes('ampere') || n.includes('altra')) return 'Ampere';
  return '';
}

interface PendingUndo {
  kind: 'hw' | 'cpu';
  label: string;
  // Closure that re-dispatches the right RESTORE action with original index.
  undo: () => void;
}

export function HardwareTab() {
  const { state, dispatch } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingUndo | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  // v2.17.18 — The inline "+ Add Server" toggle was promoted to a full
  // top-level "Build a Server" section in v2.17.23 (see ServerBuilderSection).
  // No local toggle state needed here anymore.

  const hwGroups = state.userHardware;
  const cpus = state.userCpus;
  const hasAny = hwGroups.length > 0 || cpus.length > 0;

  // ── v2.4.3: search + smart-filter state (per section, local) ──────────
  const [hwSearch, setHwSearch] = useState('');
  const [hwActiveFamilies, setHwActiveFamilies] = useState<Set<string>>(new Set());
  const [hwActiveMemBands, setHwActiveMemBands] = useState<Set<string>>(new Set());
  const [cpuSearch, setCpuSearch] = useState('');
  const [cpuActiveFamilies, setCpuActiveFamilies] = useState<Set<string>>(new Set());
  const [cpuActiveVendors, setCpuActiveVendors] = useState<Set<string>>(new Set());

  // Distinct facet values — re-derived from the catalog so pills appear /
  // disappear as the user uploads / deletes rows. Only render the row if 2+
  // distinct values exist (avoids single-pill clutter).
  const hwFamiliesAvail = useMemo(
    () => distinctNonEmpty(hwGroups.map((g) => cpuFamilyFromName(g.processor))),
    [hwGroups],
  );
  const hwMemBandsAvail = useMemo(
    () => distinctNonEmpty(hwGroups.map(memoryBand)),
    [hwGroups],
  );
  const cpuFamiliesAvail = useMemo(
    () => distinctNonEmpty(cpus.map((c) => c.family)),
    [cpus],
  );
  const cpuVendorsAvail = useMemo(
    () => distinctNonEmpty(cpus.map((c) => inferCpuVendor(c))),
    [cpus],
  );

  const hwFiltered = useMemo(() => {
    const q = hwSearch.trim().toLowerCase();
    return hwGroups.filter((g) => {
      if (hwActiveFamilies.size > 0) {
        const fam = cpuFamilyFromName(g.processor);
        if (!hwActiveFamilies.has(fam)) return false;
      }
      if (hwActiveMemBands.size > 0 && !hwActiveMemBands.has(memoryBand(g))) return false;
      if (!q) return true;
      return (
        g.name.toLowerCase().includes(q) ||
        g.id.toLowerCase().includes(q) ||
        (g.processor ?? '').toLowerCase().includes(q) ||
        (g.notes ?? '').toLowerCase().includes(q)
      );
    });
  }, [hwGroups, hwSearch, hwActiveFamilies, hwActiveMemBands]);

  const cpuFiltered = useMemo(() => {
    const q = cpuSearch.trim().toLowerCase();
    return cpus.filter((c) => {
      if (cpuActiveFamilies.size > 0 && !cpuActiveFamilies.has(c.family)) return false;
      if (cpuActiveVendors.size > 0 && !cpuActiveVendors.has(inferCpuVendor(c))) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.family ?? '').toLowerCase().includes(q) ||
        inferCpuVendor(c).toLowerCase().includes(q)
      );
    });
  }, [cpus, cpuSearch, cpuActiveFamilies, cpuActiveVendors]);

  // Card the user has expanded for inline editing. Only one open at a time
  // so we don't have parallel forms in unresolved-edit limbo.
  const [openHwId, setOpenHwId] = useState<string | null>(null);
  const [openCpuName, setOpenCpuName] = useState<string | null>(null);
  // v2.17.30 — Editing happens in the Build a Server section, not in-card.
  // When set, ServerBuilderSection receives this group as `editServer` and
  // prefills + auto-opens + scrolls.
  // v2.18 — Promoted to UI state so external surfaces (FleetBuilder's ✎
  // affordance) can trigger edit mode + tab-switch in a single dispatch.
  const editingHwId = state.ui.editingHwId;
  const setEditingHwId = (id: string | null) =>
    dispatch({ type: 'UI_SET', ui: { editingHwId: id } });
  const editServer = editingHwId
    ? state.userHardware.find((g) => g.id === editingHwId) ?? null
    : null;

  // v2.17.25 — Welcome banner dismissal. Persisted in localStorage so a
  // returning user who dismissed it stays dismissed. Re-shows when:
  //   - The library is empty (returning users with content never see it)
  //   - AND the user hasn't explicitly dismissed
  const [welcomeDismissed, setWelcomeDismissed] = useState(() => {
    try {
      return localStorage.getItem('vmcap:welcomeDismissed') === '1';
    } catch {
      return false;
    }
  });
  const dismissWelcome = () => {
    setWelcomeDismissed(true);
    try { localStorage.setItem('vmcap:welcomeDismissed', '1'); } catch { /* ignore */ }
  };
  // v2.5.1 — section-level collapse for the Server Library + CPU Library.
  // Defaults to expanded; user toggles by clicking the section header. Local
  // state (not persisted) — matches the openHwId / openCpuName pattern; can
  // promote to UiState later if users want it sticky.
  const [serverSectionOpen, setServerSectionOpen] = useState(true);
  const [cpuSectionOpen, setCpuSectionOpen] = useState(true);
  // v2.19.47 — Top-level Library section header is now click-to-collapse.
  // Useful when the user is iterating on Build a Server and wants the
  // existing library out of the way.
  // v2.19.52 — Library defaults to COLLAPSED. The active authoring surfaces
  // (Build a CPU / Build a Server) live above it; the Library is the
  // already-authored set the user only opens when reviewing/editing.
  const [libraryOpen, setLibraryOpen] = useState(false);
  // v2.17.26 — Two top-level sections (CPU, Server) each grouping a
  // Builder + Library subsection. Collapsing a top section hides both
  // subsections at once, useful when you want all the screen space for
  // the other domain.
  const [cpuTopOpen, setCpuTopOpen] = useState(true);
  const [serverTopOpen, setServerTopOpen] = useState(true);

  // ─── undo toast: simple 5 s setTimeout. New deletes cancel pending undo ──
  const scheduleUndo = (u: PendingUndo) => {
    setPending(u);
    const t = window.setTimeout(() => {
      setPending((cur) => (cur === u ? null : cur));
    }, 5000);
    return () => window.clearTimeout(t);
  };

  const deleteGroup = (g: HardwareGroup) => {
    const idx = hwGroups.findIndex((x) => x.id === g.id);
    dispatch({ type: 'HARDWARE_DELETE', id: g.id });
    scheduleUndo({
      kind: 'hw',
      label: `Removed "${g.name}"`,
      undo: () => {
        dispatch({ type: 'HARDWARE_RESTORE', group: g, atIndex: idx });
        setPending(null);
      },
    });
  };

  const deleteCpu = (c: UserCpu) => {
    const idx = cpus.findIndex((x) => x.name === c.name);
    dispatch({ type: 'CPU_DELETE', name: c.name });
    scheduleUndo({
      kind: 'cpu',
      label: `Removed "${c.name}"`,
      undo: () => {
        dispatch({ type: 'CPU_RESTORE', cpu: c, atIndex: idx });
        setPending(null);
      },
    });
  };

  // Bulk-clear with confirm + undo. Snapshots the full list in the closure so
  // Undo restores the exact pre-clear order without depending on intermediate
  // state. Mirrors the per-card delete+undo pattern.
  const clearHardware = () => {
    if (hwGroups.length === 0) return;
    if (
      !window.confirm(
        `Clear all ${hwGroups.length} hardware group${hwGroups.length === 1 ? '' : 's'}? You'll have 5 seconds to undo.`,
      )
    )
      return;
    const snapshot = hwGroups;
    dispatch({ type: 'HARDWARE_SET_ALL', groups: [] });
    scheduleUndo({
      kind: 'hw',
      label: `Cleared ${snapshot.length} hardware group${snapshot.length === 1 ? '' : 's'}`,
      undo: () => {
        dispatch({ type: 'HARDWARE_SET_ALL', groups: snapshot });
        setPending(null);
      },
    });
  };

  const clearCpus = () => {
    if (cpus.length === 0) return;
    if (
      !window.confirm(
        `Clear all ${cpus.length} CPU${cpus.length === 1 ? '' : 's'}? You'll have 5 seconds to undo.`,
      )
    )
      return;
    const snapshot = cpus;
    dispatch({ type: 'CPU_SET_ALL', cpus: [] });
    scheduleUndo({
      kind: 'cpu',
      label: `Cleared ${snapshot.length} CPU${snapshot.length === 1 ? '' : 's'}`,
      undo: () => {
        dispatch({ type: 'CPU_SET_ALL', cpus: snapshot });
        setPending(null);
      },
    });
  };

  const onUpload = async (file: File) => {
    setImportMsg(null);
    try {
      const result = await parseHardwareTemplate(file);
      if (result.groups.length === 0 && result.cpus.length === 0) {
        setImportMsg('Import failed: no valid hardware groups or CPUs found in this file.');
        return;
      }
      if (
        hasAny &&
        !window.confirm(
          `Replace your current catalog with ${result.groups.length} hardware group(s) and ${result.cpus.length} CPU(s) from this file?`,
        )
      ) {
        return;
      }
      dispatch({ type: 'HARDWARE_REPLACE', groups: result.groups, cpus: result.cpus });
      const warn = result.warnings.length
        ? ` · ${result.warnings.length} warning${result.warnings.length === 1 ? '' : 's'}`
        : '';
      setImportMsg(
        `Imported ${result.groups.length} hardware group(s) and ${result.cpus.length} CPU(s)${warn}.`,
      );
      // surface warnings in console for power users
      result.warnings.forEach((w) => console.warn('[Hardware import]', w));
    } catch (err) {
      console.error('[Hardware import]', err);
      setImportMsg(
        `Import failed: ${err instanceof Error ? err.message : 'could not parse file'}`,
      );
    }
  };

  return (
    <div className="p-4 space-y-5 text-xs text-text-primary relative">
      <SeedDisclaimerBanner surface="hardware" />

      {/* ── 1. Welcome banner — first-time orientation. Dismissible.
          v2.17.33: now treats the auto-seeded "Sample Reference Server"
          as equivalent to empty — first-time users still see the banner
          even though one default server is preloaded. Vanishes once the
          user adds their own server or explicitly dismisses. */}
      {!welcomeDismissed &&
        (hwGroups.length === 0 ||
          (hwGroups.length === 1 && hwGroups[0].id === 'sample-reference-server')) && (
          <WelcomeBanner onDismiss={dismissWelcome} />
        )}

      {/* v2.19.52 — Catalog section removed. Excel template + Upload moved
          into the + Build a Server section header (passed as headerActions
          below). One-place flow: author one server inline, or grab the
          template + bulk-upload — same affordance row. The hidden file
          input + import-result toast still live here. */}
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
          e.target.value = '';
        }}
      />
      {importMsg && (
        <div
          className="text-[10px] px-2 py-1.5"
          style={{
            background: importMsg.startsWith('Import failed')
              ? 'rgba(239, 68, 68, 0.10)'
              : 'rgba(129, 140, 248, 0.10)',
            border: `1px solid ${
              importMsg.startsWith('Import failed')
                ? 'rgba(239, 68, 68, 0.4)'
                : 'var(--border-glow)'
            }`,
            color: importMsg.startsWith('Import failed') ? '#FCA5A5' : 'var(--interactive)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          {importMsg}
        </div>
      )}

      {/* ── v2.20.2 (distill) — template-first. One click adds an editable
          starter profile to the library; building from scratch is the
          step below, not the entry price. */}
      <StarterServersRow
        userHardware={state.userHardware}
        onAdd={(group) => {
          dispatch({
            type: 'HARDWARE_SET_ALL',
            groups: [...state.userHardware, group],
          });
          setImportMsg(`Added "${group.name}" — edit it like any server via ✎ in the Library.`);
        }}
      />

      {/* ── Build a Server (step 1 — the thing a simulation actually
          needs; a CPU pick inside it is optional). Also the EDIT
          surface — clicking ✎ on a Library card sets editingHwId; this
          section receives the group as editServer, prefills + opens. */}
      <ServerBuilderSection
        existingIds={state.userHardware.map((g) => g.id)}
        cpuLibrary={state.userCpus}
        stepNumber={1}
        onAdd={(group) => {
          dispatch({
            type: 'HARDWARE_SET_ALL',
            groups: [...state.userHardware, group],
          });
          setImportMsg(`Added server "${group.name}" to the library.`);
        }}
        editServer={editServer}
        onUpdate={(id, next) => {
          dispatch({ type: 'HARDWARE_UPDATE', id, next });
          setEditingHwId(null);
          setImportMsg(`Updated server "${next.name}".`);
        }}
        onCancelEdit={() => setEditingHwId(null)}
        headerActions={
          <>
            <a
              href="/hardware-template.xlsx"
              download="hardware-template.xlsx"
              className="text-[10px] font-medium tracking-[0.02em] hover:bg-white/[0.05] transition-colors"
              style={{
                padding: '4px 10px',
                color: 'var(--interactive)',
                border: '1px solid var(--border-glow)',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(129, 140, 248, 0.06)',
              }}
              title="Download the Excel bulk-import template (seeded with current sample data)"
              onClick={(e) => e.stopPropagation()}
            >
              ⤓ Template
            </a>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileRef.current?.click();
              }}
              className="text-[10px] font-medium tracking-[0.02em] hover:bg-white/[0.05] transition-colors"
              style={{
                padding: '4px 10px',
                color: 'var(--interactive)',
                border: '1px solid var(--border-glow)',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(129, 140, 248, 0.06)',
              }}
              title="Bulk-upload a filled-in Excel template"
            >
              ⤒ Upload
            </button>
          </>
        }
      />

      {/* ── Build a CPU (step 2 — optional: needed only for custom
          processors; the engine packs on sockets × cores, and ~15
          public-vendor CPUs are already in the Library). */}
      <CpuBuilderSection
        existingNames={state.userCpus.map((c) => c.name)}
        stepNumber={2}
        onAdd={(cpu) => {
          dispatch({
            type: 'CPU_SET_ALL',
            cpus: [...state.userCpus, cpu],
          });
          setImportMsg(`Added CPU "${cpu.name}" to the library.`);
        }}
      />

      {/* ── 5. Library (top-level, v2.19.33+v2.19.35). Visually-nested
          sub-sections so the user reads "Library contains Servers + CPUs"
          rather than three sibling section pills. Indented container,
          quieter sub-headers. */}
      <section>
        {/* v2.19.47 — Top-level Library header is now a button that toggles
            the entire Library section (Servers + CPUs sub-collapses) so a
            user iterating on a build can hide the existing library out of
            the way without expanding/collapsing both children individually. */}
        <h2 className="section-h flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLibraryOpen((s) => !s)}
            className="flex items-center gap-2 flex-1 text-left bg-transparent border-0 p-0 cursor-pointer"
            style={{ font: 'inherit', color: 'inherit', letterSpacing: 'inherit' }}
            aria-expanded={libraryOpen}
            aria-label={libraryOpen ? 'Collapse Library' : 'Expand Library'}
          >
            <span className="text-[10px]" style={{ color: 'var(--interactive)' }}>
              {libraryOpen ? '▾' : '▸'}
            </span>
            <span>Library</span>
            <span className="text-[10px] font-mono normal-case tracking-normal text-text-muted ml-2">
              {hwGroups.length} server{hwGroups.length === 1 ? '' : 's'} · {cpus.length} CPU{cpus.length === 1 ? '' : 's'}
            </span>
            {(() => {
              const incomplete = hardwareIncompleteCount(hwGroups);
              if (incomplete === 0) return null;
              return (
                <span
                  className="inline-flex items-center gap-1.5 normal-case tracking-normal text-[10px] ml-1"
                  style={{ color: '#FCD34D' }}
                  title={`${incomplete} server${incomplete === 1 ? '' : 's'} have missing or empty fields (spec or financial). Expand the Library and look for the amber dot on each card.`}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: '#FCD34D',
                      boxShadow: '0 0 6px rgba(251, 191, 36, 0.65)',
                      border: '1px solid rgba(251, 191, 36, 0.85)',
                      display: 'inline-block',
                    }}
                  />
                  · {incomplete} incomplete
                </span>
              );
            })()}
          </button>
        </h2>

        {libraryOpen && (
        <div
          className="mt-2 space-y-3"
          style={{
            marginLeft: 14,
            paddingLeft: 12,
            borderLeft: '1px solid rgba(129, 140, 248, 0.20)',
          }}
        >
          {/* — Servers sub-collapse — */}
          <section>
            <h3 className="flex items-center gap-2 text-[10px] tracking-[0.04em] font-semibold" style={{ color: 'var(--text-secondary)', padding: '4px 0' }}>
              <button
                type="button"
                onClick={() => setServerSectionOpen((s) => !s)}
                className="flex items-center gap-2 flex-1 text-left bg-transparent border-0 p-0 cursor-pointer"
                aria-expanded={serverSectionOpen}
                aria-label={serverSectionOpen ? 'Collapse Servers' : 'Expand Servers'}
                style={{ font: 'inherit', color: 'inherit', letterSpacing: 'inherit' }}
              >
                <span className="text-[10px]" style={{ color: 'var(--interactive)' }}>
                  {serverSectionOpen ? '▾' : '▸'}
                </span>
                <span>Servers</span>
                <span className="text-[10px] font-mono normal-case tracking-normal text-text-muted ml-2">
                  {hwFiltered.length}
                  {hwFiltered.length !== hwGroups.length ? ` of ${hwGroups.length}` : ''}
                </span>
              </button>
            </h3>

            {serverSectionOpen && (
              <div className="mt-3 space-y-2">
                {/* Search + filters only earn their space on a larger library;
                    a handful of servers reads fine as a plain list. */}
                {hwGroups.length > 6 && (
                  <div className="space-y-2">
                    <input
                      type="search"
                      value={hwSearch}
                      onChange={(e) => setHwSearch(e.target.value)}
                      placeholder="Search servers…"
                      className="glass-input w-full text-[11px]"
                      style={{ padding: '8px 12px' }}
                    />
                    <FacetRow
                      label="CPU Family"
                      values={hwFamiliesAvail}
                      active={hwActiveFamilies}
                      onToggle={(v) => toggleSetMember(setHwActiveFamilies, v)}
                      onClear={() => setHwActiveFamilies(new Set())}
                    />
                    <FacetRow
                      label="Memory / node"
                      values={hwMemBandsAvail}
                      active={hwActiveMemBands}
                      onToggle={(v) => toggleSetMember(setHwActiveMemBands, v)}
                      onClear={() => setHwActiveMemBands(new Set())}
                    />
                  </div>
                )}

                {hwGroups.length === 0 ? (
                  <EmptyHint
                    text="No servers yet. Use + Build a Server above or upload the Excel template."
                  />
                ) : hwFiltered.length === 0 ? (
                  <EmptyHint text="No servers match the current search / filters." />
                ) : (
                  <div className="space-y-1.5">
                    {hwFiltered.map((g) => (
                      <HardwareCard
                        key={g.id}
                        group={g}
                        expanded={openHwId === g.id}
                        onToggleExpand={() => setOpenHwId(openHwId === g.id ? null : g.id)}
                        onDelete={() => deleteGroup(g)}
                        onDuplicate={() => dispatch({ type: 'HARDWARE_DUPLICATE', id: g.id })}
                        onEdit={() => {
                          setEditingHwId(g.id);
                          setOpenHwId(null);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* — CPUs sub-collapse — */}
          <section>
            <h3 className="flex items-center gap-2 text-[10px] tracking-[0.04em] font-semibold" style={{ color: 'var(--text-secondary)', padding: '4px 0' }}>
              <button
                type="button"
                onClick={() => setCpuSectionOpen((s) => !s)}
                className="flex items-center gap-2 flex-1 text-left bg-transparent border-0 p-0 cursor-pointer"
                aria-expanded={cpuSectionOpen}
                aria-label={cpuSectionOpen ? 'Collapse CPUs' : 'Expand CPUs'}
                style={{ font: 'inherit', color: 'inherit', letterSpacing: 'inherit' }}
              >
                <span className="text-[10px]" style={{ color: 'var(--interactive)' }}>
                  {cpuSectionOpen ? '▾' : '▸'}
                </span>
                <span>CPUs</span>
                <span className="text-[10px] font-mono normal-case tracking-normal text-text-muted ml-2">
                  {cpuFiltered.length}
                  {cpuFiltered.length !== cpus.length ? ` of ${cpus.length}` : ''}
                </span>
              </button>
            </h3>

            {cpuSectionOpen && (
              <div className="mt-3 space-y-2">
                {cpus.length > 6 && (
                  <div className="space-y-2">
                    <input
                      type="search"
                      value={cpuSearch}
                      onChange={(e) => setCpuSearch(e.target.value)}
                      placeholder="Search CPUs…"
                      className="glass-input w-full text-[11px]"
                      style={{ padding: '8px 12px' }}
                    />
                    <FacetRow
                      label="Vendor"
                      values={cpuVendorsAvail}
                      active={cpuActiveVendors}
                      onToggle={(v) => toggleSetMember(setCpuActiveVendors, v)}
                      onClear={() => setCpuActiveVendors(new Set())}
                    />
                    <FacetRow
                      label="Family"
                      values={cpuFamiliesAvail}
                      active={cpuActiveFamilies}
                      onToggle={(v) => toggleSetMember(setCpuActiveFamilies, v)}
                      onClear={() => setCpuActiveFamilies(new Set())}
                    />
                  </div>
                )}

                {cpus.length === 0 ? (
                  <EmptyHint text="No CPUs yet. Use + Build a CPU above or upload the Excel template." />
                ) : cpuFiltered.length === 0 ? (
                  <EmptyHint text="No CPUs match the current search / filters." />
                ) : (
                  <div className="space-y-1.5">
                    {cpuFiltered.map((c) => (
                      <CpuCard
                        key={c.name}
                        cpu={c}
                        expanded={openCpuName === c.name}
                        onToggleExpand={() => setOpenCpuName(openCpuName === c.name ? null : c.name)}
                        onDelete={() => deleteCpu(c)}
                        onDuplicate={() => dispatch({ type: 'CPU_DUPLICATE', name: c.name })}
                        onSave={(next) => {
                          dispatch({ type: 'CPU_UPDATE', prevName: c.name, next });
                          setOpenCpuName(null);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
        )}
      </section>

      {/* ── 4. Undo toast (5 s) ────────────────────────────────────────── */}
      {pending && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 glass flex items-center gap-3"
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-pill)',
            boxShadow:
              '0 12px 32px rgba(0,0,0,0.45), inset 0 0 0 1px var(--border-glow)',
          }}
        >
          <span className="text-[11px] text-text-primary">{pending.label}</span>
          <button
            onClick={pending.undo}
            className="text-[11px] font-semibold"
            style={{ color: 'var(--interactive)' }}
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Subcomponents
// ────────────────────────────────────────────────────────────────────────

// ── Welcome banner — first-time orientation on the Hardware tab ────────
// Shown only when the Server Library is empty. Three numbered steps that
// teach the user the dependency chain (CPU → Server → Fleet) and point at
// the inline builders. No dismiss button — the banner self-dismisses the
// moment the user adds their first server, which is the natural signal
// they've internalized the flow.
/**
 * v2.20.2 (distill) — template-first server setup. Three ready-made
 * generic profiles (the same STARTER_SERVERS Quick start uses); one click
 * adds an editable copy to the library. Profiles already in the library
 * show as added. Building from scratch stays one section below — this is
 * the on-ramp, not a replacement.
 */
function StarterServersRow({
  userHardware,
  onAdd,
}: {
  userHardware: { id: string }[];
  onAdd: (group: (typeof STARTER_SERVERS)[number]) => void;
}) {
  const inLibrary = new Set(userHardware.map((g) => g.id));
  return (
    <section className="glass p-3" style={{ borderRadius: 'var(--radius-md)' }}>
      <div className="text-[12px] font-semibold text-text-primary">
        Start with a ready-made server
      </div>
      <div className="text-[10.5px] text-text-muted leading-snug mt-0.5">
        One click adds an editable profile to your Library. Build your own
        below when you need an exact spec.
      </div>
      <div className="mt-2.5 space-y-1.5">
        {STARTER_SERVERS.map((s) => {
          const added = inLibrary.has(s.id);
          return (
            <div key={s.id} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <span className="text-[11px] text-text-primary">{s.name}</span>
                <span className="text-[10px] text-text-muted ml-2 whitespace-nowrap">
                  {s.memoryGibPerNode >= 1024
                    ? `${s.memoryGibPerNode / 1024} TiB`
                    : `${s.memoryGibPerNode} GiB`}{' '}
                  · {s.vcpusPerNode} vCPU/node · {s.nodesPerRack}/rack
                </span>
              </div>
              <button
                type="button"
                disabled={added}
                onClick={() => onAdd(s)}
                className="text-[10px] font-medium flex-shrink-0 transition-colors"
                style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-pill)',
                  border: `1px solid ${added ? 'var(--border)' : 'var(--border-glow)'}`,
                  background: added ? 'transparent' : 'rgba(129, 140, 248, 0.10)',
                  color: added ? 'var(--status-good)' : 'var(--interactive)',
                  cursor: added ? 'default' : 'pointer',
                }}
                title={
                  added
                    ? 'Already in your Library — edit it there via ✎'
                    : `Add ${s.name} to your Library (editable afterwards)`
                }
              >
                {added ? '✓ In library' : '+ Add'}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function WelcomeBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <section>
      <div
        className="glass-strong p-4 relative"
        style={{
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-glow)',
          background: 'rgba(129, 140, 248, 0.04)',
        }}
      >
        <button
          onClick={onDismiss}
          aria-label="Dismiss welcome message"
          title="Dismiss · won't show again"
          className="absolute top-2 right-2 text-[12px] text-text-muted hover:text-text-primary transition-colors"
          style={{ padding: '4px 8px', lineHeight: 1 }}
        >
          ✕
        </button>
        <div className="text-[11px] tracking-[0.04em] font-semibold text-interactive pr-6">
          Welcome — let's build your hardware
        </div>
        <p className="text-[11px] text-text-secondary leading-relaxed mt-1.5">
          Servers built here are what Fleet builder places into racks. Grab a
          ready-made profile below for an instant start, or spec your own with{' '}
          <strong style={{ color: 'var(--interactive)' }}>+ Build a Server</strong>{' '}
          (⤓ Template / ⤒ Upload in its header is the Excel bulk path).
        </p>
      </div>
    </section>
  );
}


// ── Helper: small reusable facet pill row ──────────────────────────────
function FacetRow({
  label,
  values,
  active,
  onToggle,
  onClear,
}: {
  label: string;
  values: string[];
  active: Set<string>;
  onToggle: (v: string) => void;
  onClear: () => void;
}) {
  // Smart-filter contract: hide the row entirely until the catalog has 2+
  // distinct values for this trait. Avoids single-pill clutter.
  if (values.length < 2) return null;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] tracking-[0.04em] text-text-muted">
          {label}
          {active.size > 0 && (
            <span className="ml-1 normal-case tracking-normal">· {active.size} selected</span>
          )}
        </span>
        {active.size > 0 && (
          <button
            onClick={onClear}
            className="text-[9px] tracking-[0.02em] text-text-muted hover:text-text-primary transition-colors"
          >
            Reset
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {values.map((v) => (
          <button
            key={v}
            onClick={() => onToggle(v)}
            className="text-[10px] font-mono transition-all"
            style={{
              padding: '3px 8px',
              background: active.has(v) ? 'rgba(129, 140, 248, 0.14)' : 'rgba(255,255,255,0.03)',
              color: active.has(v) ? 'var(--interactive)' : 'var(--text-secondary)',
              border: `1px solid ${
                active.has(v) ? 'var(--border-glow)' : 'rgba(255,255,255,0.10)'
              }`,
              borderRadius: 'var(--radius-pill)',
            }}
            aria-pressed={active.has(v)}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

function toggleSetMember(
  setter: React.Dispatch<React.SetStateAction<Set<string>>>,
  v: string,
) {
  setter((prev) => {
    const next = new Set(prev);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    return next;
  });
}

// ── Hardware Card with inline edit + duplicate ─────────────────────────
function HardwareCard({
  group,
  expanded,
  onToggleExpand,
  onDelete,
  onDuplicate,
  onEdit,
}: {
  group: HardwareGroup;
  expanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  /** v2.17.30 — Edit no longer happens in-card. Clicking ✎ surfaces the
   *  server inside the Build a Server section (scroll + prefill). */
  onEdit: () => void;
}) {
  const hetero = !!group.rackComposition && group.rackComposition.length > 1;
  const memLabel = hetero
    ? group.rackComposition!
        .map(
          (c) =>
            `${c.count}× ${
              c.memoryGibPerNode >= 1024
                ? `${c.memoryGibPerNode / 1024} TiB`
                : `${c.memoryGibPerNode} GiB`
            }${c.isUtility ? ' (util)' : ''}`,
        )
        .join(' + ')
    : group.memoryGibPerNode >= 1024
    ? `${group.memoryGibPerNode / 1024} TiB`
    : `${group.memoryGibPerNode} GiB`;
  // v2.19.34 — Compact one-line collapsed card. User: "We need to be able
  // to present the library in a way that is not overwhelmingly long."
  // Default state shows just name + a terse spec summary + actions. Full
  // memory composition + CPU + financial detail moves into the expanded
  // HardwareStatsView. Single-line, no wrapping until necessary.
  const summary = (() => {
    const parts: string[] = [memLabel];
    if (group.nodesPerRack != null) parts.push(`${group.nodesPerRack}n/rack`);
    if (group.networkMbpsPerNode != null) {
      const mbps = group.networkMbpsPerNode;
      parts.push(mbps >= 1000 ? `${(mbps / 1000).toLocaleString()} Gbps` : `${mbps} Mbps`);
    }
    return parts.join(' · ');
  })();
  return (
    <div className="rounded-md glass relative">
      <button
        onClick={onToggleExpand}
        className="w-full text-left px-3 py-1.5 hover:bg-white/[0.03] transition-colors"
        style={{ borderRadius: expanded ? '0.375rem 0.375rem 0 0' : '0.375rem' }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[9px] text-text-muted flex-shrink-0">{expanded ? '▾' : '▸'}</span>
          {(() => {
            const missing = hardwareMissingFields(group);
            if (missing.length === 0) return null;
            const specCount = missing.filter((m) => m.kind === 'spec').length;
            const finCount = missing.length - specCount;
            const parts: string[] = [];
            if (specCount > 0) {
              parts.push(`Spec: ${missing.filter((m) => m.kind === 'spec').map((m) => m.label).join(', ')}`);
            }
            if (finCount > 0) {
              parts.push(`Financial: ${missing.filter((m) => m.kind === 'financial').map((m) => m.label).join(', ')}`);
            }
            return (
              <span
                title={`Incomplete — ${parts.join(' · ')}. Click ✎ to edit in Build a Server.`}
                aria-label={`Incomplete: ${parts.join('. ')}`}
                role="img"
                className="inline-block flex-shrink-0"
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#FCD34D',
                  boxShadow: '0 0 6px rgba(251, 191, 36, 0.65)',
                  border: '1px solid rgba(251, 191, 36, 0.85)',
                }}
              />
            );
          })()}
          <span
            className="text-text-primary font-medium text-[12px] truncate min-w-0"
            title={group.name}
            style={{ flex: '0 1 auto' }}
          >
            {group.name}
          </span>
          <span
            className="text-[10px] font-mono text-text-muted flex-1 min-w-0 truncate"
            title={summary}
          >
            · {summary}
            {hetero && (
              <span className="ml-1" style={{ color: 'var(--interactive)' }}>· hetero</span>
            )}
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="text-text-muted hover:text-[var(--interactive)] text-sm leading-none px-1 transition-colors"
              title={`Edit ${group.name} in the Build a Server section`}
              aria-label={`Edit ${group.name}`}
            >
              ✎
            </span>
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              className="text-text-muted hover:text-[var(--interactive)] text-sm leading-none px-1 transition-colors"
              title={`Duplicate ${group.name}`}
              aria-label={`Duplicate ${group.name}`}
            >
              ⎘
            </span>
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-text-muted hover:text-[#FCA5A5] text-sm leading-none px-1 transition-colors"
              title={`Delete ${group.name}`}
              aria-label={`Delete ${group.name}`}
            >
              ✕
            </span>
          </div>
        </div>
      </button>

      {expanded && <HardwareStatsView group={group} onEdit={onEdit} />}
    </div>
  );
}

// ── Read-only stats view for an expanded HardwareCard. v2.17.30.
// Editing happens via the ✎ icon → Build a Server section, not here.
function HardwareStatsView({
  group,
  onEdit,
}: {
  group: HardwareGroup;
  onEdit: () => void;
}) {
  const slots = group.rackComposition && group.rackComposition.length > 0
    ? group.rackComposition
    : [{ memoryGibPerNode: group.memoryGibPerNode, count: group.nodesPerRack ?? 1 }];
  const fmtMem = (g: number) =>
    g >= 1024 ? `${Math.round((g / 1024) * 10) / 10} TiB` : `${g} GiB`;
  const fmtNet = (mbps?: number) =>
    mbps == null ? '—' : mbps >= 1000 ? `${(mbps / 1000).toLocaleString()} Gbps` : `${mbps.toLocaleString()} Mbps`;
  const fmtUsd = (v?: number) =>
    v == null ? '—' : `$${v.toLocaleString()}`;

  // v2.19.52 — per-field amber pill keyed by MissingField.label, so users
  // see exactly which field needs fixing without reading the tooltip.
  const missing = hardwareMissingFields(group);
  const missingByLabel = new Map(missing.map((m) => [m.label, m]));

  return (
    <div
      className="px-3 pb-3 pt-2 space-y-3 text-[11px]"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Identity row */}
      <StatGrid>
        <Stat
          label="Provider"
          value={group.provider ?? '—'}
          missing={missingByLabel.get('Cloud provider')}
        />
        <Stat label="Group ID" value={group.id} mono />
        {group.notes && <Stat label="Notes" value={group.notes} full />}
      </StatGrid>

      {/* Rack composition */}
      <div>
        <div className="flex items-center gap-2">
          <SubLabel>Rack composition · {group.nodesPerRack ?? slots.reduce((a, s) => a + s.count, 0)} nodes</SubLabel>
          {missingByLabel.get('Nodes per rack') && <MissingChip field={missingByLabel.get('Nodes per rack')!} />}
          {missingByLabel.get('Memory per node') && <MissingChip field={missingByLabel.get('Memory per node')!} />}
          {missingByLabel.get('Sockets per node') && <MissingChip field={missingByLabel.get('Sockets per node')!} />}
          {missingByLabel.get('Cores per socket') && <MissingChip field={missingByLabel.get('Cores per socket')!} />}
        </div>
        <div className="space-y-1.5 mt-1.5">
          {slots.map((s, i) => {
            const isUtil = !!s.isUtility;
            const role = isUtil ? 'Utility' : (s.roleLabel || 'Compute');
            const roleColor = isUtil ? '#fcd34d' : s.roleLabel ? '#c4b5fd' : '#86efac';
            return (
              <div
                key={i}
                className="px-2.5 py-2"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-text-primary">Node Type {i + 1}</span>
                  <span
                    className="text-[9px] tracking-[0.02em] px-1.5 py-0.5 rounded-full"
                    style={{
                      color: roleColor,
                      border: `1px solid ${roleColor}55`,
                      background: `${roleColor}15`,
                    }}
                  >
                    {role}
                  </span>
                  <span className="text-text-muted ml-auto font-mono">
                    {s.count} × {fmtMem(s.memoryGibPerNode)}
                  </span>
                </div>
                <div className="text-[10px] text-text-muted font-mono leading-snug">
                  {[
                    s.processor || group.processor || null,
                    s.socketsPerNode != null ? `${s.socketsPerNode} sockets` : null,
                    s.coresPerSocket != null ? `${s.coresPerSocket} cores/skt` : null,
                    s.vcpusPerNode != null ? `${s.vcpusPerNode} vCPU` : null,
                    s.networkMbpsPerNode != null ? fmtNet(s.networkMbpsPerNode) : null,
                    s.storageThroughputMbpsPerNode != null ? `${s.storageThroughputMbpsPerNode.toLocaleString()} MB/s` : null,
                  ].filter(Boolean).join(' · ')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Defaults block removed v2.17.32 — per-slot specs already appear
          under each Node Type card above. Showing them again here was
          redundant noise. */}

      {/* Financial */}
      <div>
        <SubLabel>Financial</SubLabel>
        <StatGrid>
          <Stat
            label="Cost per rack"
            value={fmtUsd(group.costPerRackUsd)}
            mono
            missing={missingByLabel.get('Cost per node / rack')}
          />
          <Stat
            label="Usable life"
            value={group.usableLifeMonths != null ? `${group.usableLifeMonths} months` : '—'}
            mono
            missing={missingByLabel.get('Usable life (months)')}
          />
          <Stat
            label="Opex / node / mo"
            value={group.opexPerNodeMonthlyUsd != null ? fmtUsd(group.opexPerNodeMonthlyUsd) : '—'}
            mono
          />
        </StatGrid>
      </div>

      {/* v2.19 — Buffer / Overhead block REMOVED from the library stat card.
          Now authored per-cluster in the Fleet Builder. */}

      {/* Edit CTA — alternative entry to the ✎ icon in the header. */}
      <button
        onClick={onEdit}
        className="btn-ghost text-[11px]"
        style={{
          padding: '6px 14px',
          color: 'var(--interactive)',
          borderColor: 'var(--border-glow)',
          background: 'rgba(129, 140, 248,0.06)',
        }}
        title="Open this server in the Build a Server section to edit"
      >
        ✎ Edit in Builder
      </button>
    </div>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[9px] tracking-[0.04em] font-semibold text-text-secondary">
      {children}
    </div>
  );
}
function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-1">{children}</div>;
}
function Stat({
  label,
  value,
  mono,
  full,
  missing,
}: {
  label: string;
  value: string;
  mono?: boolean;
  full?: boolean;
  missing?: { label: string; kind: 'spec' | 'financial' };
}) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <div className="text-[9px] tracking-[0.04em] text-text-muted flex items-center gap-1">
        <span>{label}</span>
        {missing && <MissingChip field={missing} />}
      </div>
      <div className={`text-[11px] text-text-primary ${mono ? 'font-mono' : ''} mt-0.5`} title={value}>
        {value}
      </div>
    </div>
  );
}

// v2.19.52 — per-field amber callout shown next to each MissingField.label
// in HardwareStatsView. Spec-kind = full pill in the same amber as the
// header dot (#FCD34D). Financial-kind = softer asterisk + tooltip noting
// that missing financials disable Profitability / Headroom $ readouts.
function MissingChip({ field }: { field: { label: string; kind: 'spec' | 'financial' } }) {
  if (field.kind === 'financial') {
    return (
      <span
        className="text-[9px] leading-none cursor-help"
        style={{ color: '#FCD34D', opacity: 0.85 }}
        title={`Missing ${field.label} — disables profitability readouts (Revenue, GPM, payback) for this server.`}
        aria-label={`Missing ${field.label} (financial)`}
      >
        ∗
      </span>
    );
  }
  return (
    <span
      className="text-[8.5px] tracking-[0.02em] px-1.5 py-0.5 rounded-full leading-none"
      style={{
        color: '#FCD34D',
        border: '1px solid rgba(252, 211, 77, 0.55)',
        background: 'rgba(252, 211, 77, 0.10)',
      }}
      title={`Missing ${field.label} — fill in to make this server usable.`}
      aria-label={`Missing ${field.label}`}
    >
      Missing
    </span>
  );
}

function CpuCard({
  cpu,
  expanded,
  onToggleExpand,
  onDelete,
  onDuplicate,
  onSave,
}: {
  cpu: UserCpu;
  expanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onSave: (next: UserCpu) => void;
}) {
  // v2.19.34 — Compact one-line collapsed CPU card. Mirrors the HardwareCard
  // compactness pass: spec summary moves onto the same line as the name +
  // actions so a long list reads short.
  // v2.19.38 — Removed `flex-wrap` so long CPU names (e.g. "Intel Xeon
  // Platinum 8488C (Sapphire Rapids)") can no longer push the ⎘/✕ actions
  // to a second line and double the card height. The name truncates first
  // (it already has `truncate`); the spec summary + actions stay anchored
  // to the right on a single row. Vertical padding also tightened to py-1.
  const cpuSummary = `${cpu.vendor || 'Intel'} · ${cpu.family || '—'} · ${cpu.coresPerSocket}c · HT ${cpu.hyperthreading ? 'on' : 'off'}`;
  return (
    <div className="rounded-md glass">
      <button
        onClick={onToggleExpand}
        className="w-full text-left px-3 py-1 hover:bg-white/[0.03] transition-colors"
        style={{ borderRadius: expanded ? '0.375rem 0.375rem 0 0' : '0.375rem' }}
      >
        <div className="flex items-center gap-2 flex-nowrap min-w-0">
          <span className="text-[9px] text-text-muted flex-shrink-0">{expanded ? '▾' : '▸'}</span>
          <span
            className="text-text-primary text-[12px] truncate min-w-0"
            title={cpu.name}
            style={{ flex: '1 1 auto' }}
          >
            {cpu.name}
          </span>
          <span
            className="text-[10px] font-mono text-text-muted truncate flex-shrink-0"
            title={cpuSummary}
            style={{ maxWidth: '45%' }}
          >
            · {cpuSummary}
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              className="text-text-muted hover:text-[var(--interactive)] text-sm leading-none px-1 transition-colors"
              title={`Duplicate ${cpu.name}`}
              aria-label={`Duplicate ${cpu.name}`}
            >
              ⎘
            </span>
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-text-muted hover:text-[#FCA5A5] text-sm leading-none px-1 transition-colors"
              title={`Delete ${cpu.name}`}
              aria-label={`Delete ${cpu.name}`}
            >
              ✕
            </span>
          </div>
        </div>
      </button>

      {expanded && (
        <CpuEditForm source={cpu} onSave={onSave} onCancel={onToggleExpand} />
      )}
    </div>
  );
}

// ── Inline edit forms ─────────────────────────────────────────────────
function HardwareEditForm({
  source,
  cpus,
  onSave,
  onCancel,
}: {
  source: HardwareGroup;
  cpus: UserCpu[];
  onSave: (next: HardwareGroup) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<HardwareGroup>(() => ({ ...source }));

  // Processor dropdown options sourced from the CPU library — meets the user's
  // requirement that processor selection reads from `state.userCpus`.
  const cpuOptions: DropdownOption[] = cpus.map((c) => ({
    value: c.name,
    label: c.name,
    meta: `${c.coresPerSocket} c/socket · HT ${c.hyperthreading ? 'ON' : 'OFF'}`,
    group: c.family || c.vendor || 'CPU',
  }));

  const setField = <K extends keyof HardwareGroup>(k: K, v: HardwareGroup[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div className="border-t border-border/40 px-3 py-3 space-y-2 text-[11px]">
      <Field label="Name">
        <input
          value={draft.name}
          onChange={(e) => setField('name', e.target.value)}
          className="glass-input w-full text-[11px]"
          style={{ padding: '4px 8px' }}
        />
      </Field>
      <Field label="Group ID (slug)">
        <input
          value={draft.id}
          onChange={(e) => setField('id', e.target.value)}
          className="glass-input w-full text-[11px] font-mono"
          style={{ padding: '4px 8px' }}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Memory / node (GiB)">
          <input
            type="number"
            value={draft.memoryGibPerNode}
            onChange={(e) => setField('memoryGibPerNode', Number(e.target.value) || 0)}
            className="glass-input w-full text-[11px] font-mono"
            style={{ padding: '4px 8px' }}
          />
        </Field>
        <Field label="Nodes / rack">
          <input
            type="number"
            value={draft.nodesPerRack ?? ''}
            onChange={(e) =>
              setField(
                'nodesPerRack',
                e.target.value === '' ? null : Number(e.target.value),
              )
            }
            className="glass-input w-full text-[11px] font-mono"
            style={{ padding: '4px 8px' }}
          />
        </Field>
        <Field label="Sockets / node">
          <input
            type="number"
            value={draft.socketsPerNode}
            onChange={(e) => setField('socketsPerNode', Number(e.target.value) || 0)}
            className="glass-input w-full text-[11px] font-mono"
            style={{ padding: '4px 8px' }}
          />
        </Field>
        <Field label="Cores / socket">
          <input
            type="number"
            value={draft.coresPerSocket ?? ''}
            onChange={(e) =>
              setField(
                'coresPerSocket',
                e.target.value === '' ? null : Number(e.target.value),
              )
            }
            className="glass-input w-full text-[11px] font-mono"
            style={{ padding: '4px 8px' }}
          />
        </Field>
        <Field label="vCPUs / node (override)">
          <input
            type="number"
            value={draft.vcpusPerNode ?? ''}
            onChange={(e) =>
              setField(
                'vcpusPerNode',
                e.target.value === '' ? null : Number(e.target.value),
              )
            }
            className="glass-input w-full text-[11px] font-mono"
            style={{ padding: '4px 8px' }}
            placeholder="auto = cores × HT"
          />
        </Field>
        <Field label="Isolated (1 VM/node)">
          <select
            value={draft.isolated ? 'yes' : 'no'}
            onChange={(e) => setField('isolated', e.target.value === 'yes')}
            className="glass-input w-full text-[11px]"
            style={{ padding: '4px 8px' }}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </Field>
      </div>
      <Field label="Processor (pick from CPU library)">
        {cpuOptions.length > 0 ? (
          <GlassDropdown
            value={draft.processor}
            options={cpuOptions}
            onChange={(v) => setField('processor', v)}
            placeholder="Pick a CPU from the library…"
            searchable
            visibleRows={5}
          />
        ) : (
          <input
            value={draft.processor ?? ''}
            onChange={(e) => setField('processor', e.target.value)}
            className="glass-input w-full text-[11px]"
            style={{ padding: '4px 8px' }}
            placeholder="No CPUs uploaded yet — type a name or upload first"
          />
        )}
      </Field>
      {/* ── Financials (v2.5) ───────────────────────────────────────────
          All optional. Per-node wins when both are set; otherwise we derive
          per-node from rack-level for the Finance tab's calculations. */}
      <div
        className="pt-2 mt-1 border-t border-border/40 space-y-2"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="text-[9px] tracking-[0.04em] text-text-secondary">
          Financials
          <span className="text-text-muted normal-case tracking-normal ml-1">· optional</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Cost / node (USD)">
            <input
              type="number"
              value={draft.costPerNodeUsd ?? ''}
              onChange={(e) =>
                setField(
                  'costPerNodeUsd',
                  e.target.value === '' ? undefined : Number(e.target.value),
                )
              }
              className="glass-input w-full text-[11px] font-mono"
              style={{ padding: '4px 8px' }}
              placeholder="e.g. 75000"
            />
          </Field>
          <Field label="Cost / rack (USD)">
            <input
              type="number"
              value={draft.costPerRackUsd ?? ''}
              onChange={(e) =>
                setField(
                  'costPerRackUsd',
                  e.target.value === '' ? undefined : Number(e.target.value),
                )
              }
              className="glass-input w-full text-[11px] font-mono"
              style={{ padding: '4px 8px' }}
              placeholder="fallback if per-node blank"
            />
          </Field>
          <Field label="Usable life (months)">
            <input
              type="number"
              value={draft.usableLifeMonths ?? ''}
              onChange={(e) =>
                setField(
                  'usableLifeMonths',
                  e.target.value === '' ? undefined : Number(e.target.value),
                )
              }
              className="glass-input w-full text-[11px] font-mono"
              style={{ padding: '4px 8px' }}
              placeholder="60 = 5 yr (default)"
            />
          </Field>
          <Field label="Opex / node / mo (USD)">
            <input
              type="number"
              value={draft.opexPerNodeMonthlyUsd ?? ''}
              onChange={(e) =>
                setField(
                  'opexPerNodeMonthlyUsd',
                  e.target.value === '' ? undefined : Number(e.target.value),
                )
              }
              className="glass-input w-full text-[11px] font-mono"
              style={{ padding: '4px 8px' }}
              placeholder="power / cooling / support"
            />
          </Field>
        </div>
      </div>
      {/* v2.6 — Region + Zone tags. Region free-form; Zone constrained to
          Zone 1..4. Both drive the Region → Zone → HW → Cluster grouping. */}
      <div className="grid grid-cols-2 gap-2">
        <Field label="Region">
          <input
            value={draft.region ?? ''}
            onChange={(e) => setField('region', e.target.value || undefined)}
            className="glass-input w-full text-[11px]"
            style={{ padding: '4px 8px' }}
            placeholder="e.g. us-east-1"
          />
        </Field>
        <Field label="Zone (availability zone)">
          <select
            value={draft.zone ?? ''}
            onChange={(e) => setField('zone', (e.target.value as typeof draft.zone) || undefined)}
            className="glass-input w-full text-[11px]"
            style={{ padding: '4px 8px' }}
          >
            <option value="">Unassigned (no zone)</option>
            {ZONES.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {/* v2.9 (Phase B) — Network per node. Mbps is the engine's 3rd hard
          packing constraint; blank disables the network check for this HW.
          NIC count is metadata only. */}
      <div className="grid grid-cols-2 gap-2">
        <Field label="Network Mbps per Node">
          <input
            type="number"
            inputMode="numeric"
            value={draft.networkMbpsPerNode ?? ''}
            onChange={(e) =>
              setField(
                'networkMbpsPerNode',
                e.target.value === '' ? undefined : Number(e.target.value),
              )
            }
            className="glass-input w-full text-[11px]"
            style={{ padding: '4px 8px' }}
            placeholder="e.g. 100000 (100 Gbps)"
            min={0}
            title="Per-node network bandwidth cap in Mbps. The simulator rejects VMs whose published Network (Mbps) exceeds this, and consumes from this budget as VMs land. Leave blank to disable the network check for this hardware."
          />
        </Field>
        <Field label="NICs per Node">
          <input
            type="number"
            inputMode="numeric"
            value={draft.networkNicCount ?? ''}
            onChange={(e) =>
              setField(
                'networkNicCount',
                e.target.value === '' ? undefined : Number(e.target.value),
              )
            }
            className="glass-input w-full text-[11px]"
            style={{ padding: '4px 8px' }}
            placeholder="e.g. 8"
            min={0}
            title="Number of NICs per node. Metadata only — does not affect packing."
          />
        </Field>
      </div>
      {/* v2.17 — Multi-slot rack composition. Up to 3 distinct
          (count × memory) entries per HW group; each can be flagged as a
          utility node (workload allocator skips them). When the
          composition is empty / 1 slot the group renders as a uniform
          rack using `memoryGibPerNode` above. */}
      <RackCompositionEditor
        composition={draft.rackComposition}
        nodesPerRack={draft.nodesPerRack ?? 0}
        defaultMemGib={draft.memoryGibPerNode}
        onChange={(next) =>
          setDraft((d) => {
            // Empty / single uniform slot → drop the array (back-compat).
            if (!next || next.length === 0) {
              const { rackComposition: _drop, ...rest } = d;
              void _drop;
              return rest;
            }
            return { ...d, rackComposition: next };
          })
        }
      />
      <Field label="Notes (free text)">
        <input
          value={draft.notes ?? ''}
          onChange={(e) => setField('notes', e.target.value)}
          className="glass-input w-full text-[11px]"
          style={{ padding: '4px 8px' }}
        />
      </Field>
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          className="btn-ghost text-[10px]"
          style={{ padding: '4px 10px', borderColor: 'rgba(255,255,255,0.12)' }}
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(draft)}
          className="btn-ghost text-[10px]"
          style={{
            padding: '4px 12px',
            color: 'var(--interactive)',
            borderColor: 'var(--border-glow)',
            background: 'rgba(129, 140, 248, 0.10)',
          }}
          disabled={!draft.name.trim() || !draft.id.trim()}
        >
          Save
        </button>
      </div>
    </div>
  );
}

function CpuEditForm({
  source,
  onSave,
  onCancel,
}: {
  source: UserCpu;
  onSave: (next: UserCpu) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<UserCpu>(() => ({ ...source }));
  const setField = <K extends keyof UserCpu>(k: K, v: UserCpu[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div className="border-t border-border/40 px-3 py-3 space-y-2 text-[11px]">
      <Field label="CPU Name">
        <input
          value={draft.name}
          onChange={(e) => setField('name', e.target.value)}
          className="glass-input w-full text-[11px]"
          style={{ padding: '4px 8px' }}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Family">
          <input
            value={draft.family ?? ''}
            onChange={(e) => setField('family', e.target.value)}
            className="glass-input w-full text-[11px]"
            style={{ padding: '4px 8px' }}
            placeholder="Sapphire Rapids, Genoa, …"
          />
        </Field>
        <Field label="Vendor">
          <select
            value={draft.vendor ?? 'Intel'}
            onChange={(e) => setField('vendor', e.target.value)}
            className="glass-input w-full text-[11px]"
            style={{ padding: '4px 8px' }}
          >
            <option value="Intel">Intel</option>
            <option value="AMD">AMD</option>
            <option value="Ampere">Ampere</option>
            <option value="Other">Other</option>
          </select>
        </Field>
        <Field label="Cores / socket">
          <input
            type="number"
            value={draft.coresPerSocket}
            onChange={(e) => setField('coresPerSocket', Number(e.target.value) || 0)}
            className="glass-input w-full text-[11px] font-mono"
            style={{ padding: '4px 8px' }}
          />
        </Field>
        <Field label="Hyperthreading">
          <select
            value={draft.hyperthreading ? 'yes' : 'no'}
            onChange={(e) => setField('hyperthreading', e.target.value === 'yes')}
            className="glass-input w-full text-[11px]"
            style={{ padding: '4px 8px' }}
          >
            <option value="yes">Yes (2 vCPU / core)</option>
            <option value="no">No</option>
          </select>
        </Field>
      </div>
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          className="btn-ghost text-[10px]"
          style={{ padding: '4px 10px', borderColor: 'rgba(255,255,255,0.12)' }}
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(draft)}
          className="btn-ghost text-[10px]"
          style={{
            padding: '4px 12px',
            color: 'var(--interactive)',
            borderColor: 'var(--border-glow)',
            background: 'rgba(129, 140, 248, 0.10)',
          }}
          disabled={!draft.name.trim()}
        >
          Save
        </button>
      </div>
    </div>
  );
}

/**
 * v2.17 — Rack composition editor. Authors up to 3 (count × memoryGib +
 * isUtility) slots per hardware group. The sum of slot counts should
 * match `nodesPerRack`; we surface a warning chip when it doesn't, but
 * don't force the user to fix it (engine falls back to uniform `memoryGibPerNode`
 * when totals mismatch).
 */
function RackCompositionEditor({
  composition,
  nodesPerRack,
  defaultMemGib,
  onChange,
}: {
  composition?: { memoryGibPerNode: number; count: number; isUtility?: boolean }[];
  nodesPerRack: number;
  defaultMemGib: number;
  onChange: (
    next: { memoryGibPerNode: number; count: number; isUtility?: boolean }[] | undefined,
  ) => void;
}) {
  const slots = composition ?? [];
  const sumCount = slots.reduce((s, x) => s + (x.count || 0), 0);
  const mismatch = slots.length > 0 && nodesPerRack > 0 && sumCount !== nodesPerRack;

  const updateSlot = (
    idx: number,
    patch: Partial<{ memoryGibPerNode: number; count: number; isUtility: boolean }>,
  ) => {
    const next = slots.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    onChange(next);
  };
  const addSlot = () => {
    if (slots.length >= 3) return;
    onChange([...slots, { memoryGibPerNode: defaultMemGib || 0, count: 0 }]);
  };
  const removeSlot = (idx: number) => {
    const next = slots.filter((_, i) => i !== idx);
    onChange(next.length > 0 ? next : undefined);
  };

  return (
    <div
      className="space-y-2 px-3 py-2"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="text-[9px] tracking-[0.04em] text-text-muted">
          Rack composition · up to 3 node sizes
        </div>
        {mismatch && (
          <div
            className="text-[9px] font-mono"
            style={{ color: '#FCD34D' }}
            title={`Slots sum to ${sumCount}; nodes per rack is ${nodesPerRack}. Engine falls back to uniform memory above when they don't match.`}
          >
            ⚠ {sumCount}/{nodesPerRack} positions
          </div>
        )}
      </div>
      {slots.length === 0 && (
        <div className="text-[10px] italic text-text-muted">
          Uniform rack — every node uses Memory / node above. Click <strong className="text-text-secondary">+ Add node size</strong> to author a mixed-memory rack.
        </div>
      )}
      {slots.map((slot, idx) => (
        <div
          key={idx}
          className="flex items-center gap-2"
          style={{
            background: slot.isUtility
              ? 'rgba(252, 211, 77, 0.06)'
              : 'rgba(129, 140, 248, 0.04)',
            border: `1px solid ${slot.isUtility ? 'rgba(252, 211, 77, 0.25)' : 'rgba(129, 140, 248, 0.18)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '6px 8px',
          }}
        >
          <span className="text-[9px] tracking-[0.02em] text-text-muted w-10">
            Slot {idx + 1}
          </span>
          <label className="flex items-center gap-1 text-[10px] text-text-secondary">
            count
            <input
              type="number"
              min={0}
              value={slot.count}
              onChange={(e) => updateSlot(idx, { count: Number(e.target.value) || 0 })}
              className="glass-input text-[11px] font-mono w-16"
              style={{ padding: '2px 6px' }}
            />
          </label>
          <span className="text-text-muted">×</span>
          <label className="flex items-center gap-1 text-[10px] text-text-secondary flex-1">
            mem GiB
            <input
              type="number"
              min={0}
              value={slot.memoryGibPerNode}
              onChange={(e) =>
                updateSlot(idx, { memoryGibPerNode: Number(e.target.value) || 0 })
              }
              className="glass-input text-[11px] font-mono w-24"
              style={{ padding: '2px 6px' }}
            />
          </label>
          <button
            type="button"
            onClick={() => updateSlot(idx, { isUtility: !slot.isUtility })}
            className="text-[9px] font-mono tracking-[0.02em] px-2 py-0.5"
            style={{
              background: slot.isUtility
                ? 'rgba(252, 211, 77, 0.18)'
                : 'rgba(255,255,255,0.04)',
              color: slot.isUtility ? '#FCD34D' : 'var(--text-muted)',
              border: `1px solid ${slot.isUtility ? 'rgba(252, 211, 77, 0.5)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-pill)',
            }}
            title={
              slot.isUtility
                ? 'Utility node: workload allocator skips it (control plane / mgmt). Toggle off to use as a workload host.'
                : 'Workload node. Toggle on to mark as utility (reserved for control-plane / mgmt).'
            }
          >
            {slot.isUtility ? '◉ Utility' : '○ Workload'}
          </button>
          <button
            type="button"
            onClick={() => removeSlot(idx)}
            className="text-text-muted hover:text-[#FCA5A5] px-1"
            title="Remove this slot"
            aria-label="Remove slot"
          >
            ✕
          </button>
        </div>
      ))}
      {slots.length < 3 && (
        <button
          type="button"
          onClick={addSlot}
          className="text-[10px] font-mono tracking-[0.02em] px-2 py-1"
          style={{
            background: 'rgba(129, 140, 248, 0.08)',
            color: 'var(--interactive)',
            border: '1px solid rgba(129, 140, 248, 0.3)',
            borderRadius: 'var(--radius-pill)',
          }}
        >
          + Add node size {slots.length === 0 ? '' : `(${slots.length}/3)`}
        </button>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[9px] tracking-[0.04em] text-text-muted mb-1 block">
        {label}
      </span>
      {children}
    </label>
  );
}

function ClearButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="text-[10px] tracking-[0.02em] transition-colors"
      style={{
        color: '#FCA5A5',
        padding: '3px 10px',
        background: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.32)',
        borderRadius: 'var(--radius-pill)',
      }}
    >
      Clear
    </button>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div
      className="text-[11px] text-text-muted italic px-3 py-3 text-center glass"
      style={{ borderRadius: 'var(--radius-md)' }}
    >
      {text}
    </div>
  );
}

