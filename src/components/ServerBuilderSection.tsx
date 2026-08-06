/**
 * Server Builder — single-box manual-authoring surface for the Hardware
 * Library (v2.17.24 simplification).
 *
 * Design intent (from user spec):
 *  - One outer glass box. No nested sub-cards.
 *  - Identity row (Name / Provider / Notes / Nodes per rack).
 *  - Per-node blocks (1 .. MAX_NODE_TYPES). Each block carries its own
 *    full spec — there is no shared "node defaults with overrides"
 *    pattern. Adding a node clones the same UI.
 *  - 3-way Type selector per node: Compute / Utility / Other (Other
 *    reveals a small role-label input for things like "GPU"/"Storage").
 *  - Shared Financial at the bottom: cost per node + usable life.
 *    No cost-per-rack field — financial is node-focused.
 *
 * Region, zone, and rack quantity are intentionally NOT here — they're
 * deployment-time decisions assigned in the Fleet Builder.
 *
 * Engine impact: each node block becomes one RackSlot entry. The first
 * block's specs are mirrored onto the HardwareGroup root fields so any
 * consumer that reads group-level fallback still works.
 */
import { useEffect, useRef, useState } from 'react';
import type { HardwareGroup, RackSlot, UserCpu } from '../types';
import { GlassDropdown, type DropdownOption } from './GlassDropdown';
import { NumberInput, NumberInputOptional } from './NumberInput';

type NodeRole = 'compute' | 'utility' | 'other';

interface NodeBlockInput {
  role: NodeRole;
  roleLabel: string;          // shown when role === 'other'
  count: number;
  memoryGib: number;
  processor: string;          // free-text or library-picked CPU name
  socketsPerNode: number;
  coresPerSocket: number;
  vcpusPerNode: number;
  networkMbpsPerNode: number;
  /** Local (temp / NVMe) storage throughput per node (MB/s). Spec field. */
  localStorageMbpsPerNode: number;
  /** Remote (Premium SSD) storage throughput per node (MB/s). Engine packing constraint. */
  storageMbpsPerNode: number;
}

const MAX_NODE_TYPES = 4;

// v2.17.28 — uniform input padding so text never crowds the rounded edges.
// Doctrine: interior padding ≥ corner radius. Inputs use --radius-sm
// (~10px) so 8px vertical + 12px horizontal gives proper breathing room
// without making fields cartoonishly tall.
const INPUT_STYLE: React.CSSProperties = {
  padding: '8px 12px',
  width: '100%',
};

const PROVIDER_OPTIONS: DropdownOption[] = [
  { value: 'Custom', label: 'Custom' },
  { value: 'Azure', label: 'Azure' },
  { value: 'AWS', label: 'AWS' },
  { value: 'GCP', label: 'GCP' },
  { value: 'Oracle', label: 'Oracle' },
];

function slugify(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function blankNode(): NodeBlockInput {
  return {
    role: 'compute',
    roleLabel: '',
    count: 1,
    memoryGib: 512,
    processor: '',
    socketsPerNode: 2,
    coresPerSocket: 48,
    vcpusPerNode: 96,
    networkMbpsPerNode: 50000,
    localStorageMbpsPerNode: 0,
    storageMbpsPerNode: 16000,
  };
}

export function ServerBuilderSection({
  existingIds,
  cpuLibrary,
  onAdd,
  editServer,
  onUpdate,
  onCancelEdit,
  stepNumber,
  headerActions,
}: {
  existingIds: string[];
  cpuLibrary: UserCpu[];
  onAdd: (g: HardwareGroup) => void;
  /** v2.17.30 — When set, the builder is in EDIT mode: form prefills from
   *  this group, section auto-opens, primary button becomes "Save changes",
   *  and onUpdate fires (not onAdd) with the original id preserved. */
  editServer?: HardwareGroup | null;
  onUpdate?: (id: string, next: HardwareGroup) => void;
  onCancelEdit?: () => void;
  /** v2.19.35 — Optional step badge in the header. */
  stepNumber?: number;
  /** v2.19.52 — Optional slot rendered on the right side of the section
   *  pill (e.g. Download template / Upload Excel buttons). Hosts bulk-import
   *  actions inside the same section the user is already authoring in. */
  headerActions?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const nodesStepRef = useRef<HTMLDivElement>(null);
  const financialStepRef = useRef<HTMLDivElement>(null);
  const isEditing = !!editServer;

  // Identity (library-template scope only — region/zone live on the Fleet)
  const [name, setName] = useState('');
  // Provider picks from the standard cloud set via a GlassDropdown. When
  // 'Custom' is selected, a free-text input reveals so the user can type
  // their own provider name (e.g. "On-prem", "Oracle Cloud", a customer
  // name, etc.). Typed value wins at save time.
  const [provider, setProvider] = useState('Custom');
  const [customProviderName, setCustomProviderName] = useState('');
  const [notes, setNotes] = useState('');
  // Rack size is derived — sum of all node-type counts.

  // One or more node blocks
  const [nodes, setNodes] = useState<NodeBlockInput[]>(() => [blankNode()]);

  // Rack-level financial. All nodes in a rack share the same usable life;
  // cost is captured at the rack level (simpler + more scalable than per-node).
  const [costPerRackUsd, setCostPerRackUsd] = useState<number | ''>('');
  const [usableLifeMonths, setUsableLifeMonths] = useState<number | ''>(72);
  // Recurring monthly operating cost per node (power / cooling / space /
  // support) — a cash cost added to the monthly cost so margin + payback
  // aren't depreciation-only. Optional; blank = 0 opex.
  const [opexPerNodeMonthlyUsd, setOpexPerNodeMonthlyUsd] = useState<number | ''>('');

  // v2.19 — Buffer/overhead REMOVED from the Hardware Library. It now lives
  // on the placed cluster in the Fleet Builder (per-cluster + optional per-
  // node-type override) because rack-planning sizing requires the cluster
  // shape.

  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  // v2.19.33 — Progressive (survey-style) step state. The builder walks
  // the user through Identity → Nodes → Financial; finishing a step
  // collapses it and opens the next. The user can click any prior step
  // header to revisit. Edit mode opens all three so the user can spot-
  // change any field — survey flow is for fresh authoring.
  type Step = 'identity' | 'nodes' | 'financial';
  const [step, setStep] = useState<Step>('identity');

  // v2.17.30 — Prefill state when the parent hands us a group to edit.
  // Runs whenever editServer's id changes (i.e. user picked a different
  // server to edit, or cleared edit mode). Also auto-opens the section
  // and scrolls it into view so the user sees what's loaded.
  useEffect(() => {
    if (!editServer) return;
    setOpen(true);
    setName(editServer.name);
    const standardProviders = ['Custom', 'Azure', 'AWS', 'GCP', 'Oracle'];
    if (editServer.provider && standardProviders.includes(editServer.provider)) {
      setProvider(editServer.provider);
      setCustomProviderName('');
    } else if (editServer.provider) {
      setProvider('Custom');
      setCustomProviderName(editServer.provider);
    } else {
      setProvider('Custom');
      setCustomProviderName('');
    }
    setNotes(editServer.notes ?? '');
    const comp = editServer.rackComposition && editServer.rackComposition.length > 0
      ? editServer.rackComposition
      : [{ memoryGibPerNode: editServer.memoryGibPerNode, count: editServer.nodesPerRack ?? 1 }];
    setNodes(comp.map((s) => ({
      role: s.isUtility ? 'utility' : s.roleLabel ? 'other' : 'compute',
      roleLabel: s.roleLabel ?? '',
      count: s.count,
      memoryGib: s.memoryGibPerNode,
      processor: s.processor ?? editServer.processor ?? '',
      socketsPerNode: s.socketsPerNode ?? editServer.socketsPerNode ?? 2,
      coresPerSocket: s.coresPerSocket ?? editServer.coresPerSocket ?? 0,
      vcpusPerNode: s.vcpusPerNode ?? editServer.vcpusPerNode ?? 0,
      networkMbpsPerNode: s.networkMbpsPerNode ?? editServer.networkMbpsPerNode ?? 0,
      localStorageMbpsPerNode:
        s.localStorageThroughputMbpsPerNode ?? editServer.localStorageThroughputMbpsPerNode ?? 0,
      storageMbpsPerNode: s.storageThroughputMbpsPerNode ?? editServer.storageThroughputMbpsPerNode ?? 0,
    })));
    setCostPerRackUsd(editServer.costPerRackUsd ?? '');
    setUsableLifeMonths(editServer.usableLifeMonths ?? 72);
    setOpexPerNodeMonthlyUsd(editServer.opexPerNodeMonthlyUsd ?? '');
    setError(null);
    requestAnimationFrame(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editServer?.id]);

  // ── Derived ──────────────────────────────────────────────────────────
  const countsTotal = nodes.reduce((a, n) => a + n.count, 0);
  const slug = slugify(name);
  const nameValid = name.trim().length > 0;
  // When editing, the original id is allowed to keep its slug. Collision
  // only matters against OTHER existing ids.
  const nameUnique = isEditing
    ? !existingIds.some((id) => id !== editServer!.id && id === slug)
    : !existingIds.includes(slug);
  // v2.19.33 — Per-step validity for the progressive flow.
  const identityValid = nameValid && nameUnique;
  const nodesValid =
    countsTotal > 0 &&
    nodes.length > 0 &&
    nodes.every((n) => n.memoryGib > 0 && n.count > 0);
  const financialValid = true; // financial is optional
  const canSave = identityValid && nodesValid && financialValid;

  // ── Node mutations ───────────────────────────────────────────────────
  const updateNode = (i: number, patch: Partial<NodeBlockInput>) =>
    setNodes((prev) => prev.map((n, idx) => (idx === i ? { ...n, ...patch } : n)));

  const addNode = () => {
    if (nodes.length >= MAX_NODE_TYPES) return;
    setNodes((prev) => [...prev, blankNode()]);
  };

  const removeNode = (i: number) =>
    setNodes((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)));

  // CPU pick — copy processor name + cores/socket + derived vCPUs into
  // THIS node block. Sockets stays put because it's a chassis property.
  const pickCpu = (i: number, cpu: UserCpu) => {
    const node = nodes[i];
    const ht = cpu.hyperthreading ? 2 : 1;
    updateNode(i, {
      processor: cpu.name,
      coresPerSocket: cpu.coresPerSocket,
      vcpusPerNode: node.socketsPerNode * cpu.coresPerSocket * ht,
    });
  };

  const reset = () => {
    setName('');
    setProvider('Custom');
    setCustomProviderName('');
    setNotes('');
    setNodes([blankNode()]);
    setCostPerRackUsd('');
    setUsableLifeMonths(72);
    setOpexPerNodeMonthlyUsd('');
    setError(null);
    setStep('identity');
  };

  const commit = () => {
    if (!canSave) {
      if (!nameValid) setError('Server needs a name.');
      else if (!nameUnique) setError(`Server "${name}" already exists. Pick a different name.`);
      else if (countsTotal === 0)
        setError('Add at least one node (count > 0 on a node type).');
      else setError('Each node needs memory > 0 and count > 0.');
      return;
    }
    setError(null);

    // The HardwareGroup root fields mirror the FIRST node's specs so any
    // consumer that doesn't know about per-slot overrides still sees
    // sensible defaults. The full per-node detail lives in rackComposition.
    const first = nodes[0];
    const composition: RackSlot[] = nodes.map((n) => {
      const slot: RackSlot = {
        memoryGibPerNode: n.memoryGib,
        count: n.count,
      };
      if (n.role === 'utility') slot.isUtility = true;
      if (n.role === 'other' && n.roleLabel.trim()) slot.roleLabel = n.roleLabel.trim();
      if (n.processor.trim()) slot.processor = n.processor.trim();
      slot.socketsPerNode = n.socketsPerNode;
      slot.coresPerSocket = n.coresPerSocket;
      slot.vcpusPerNode = n.vcpusPerNode;
      if (n.networkMbpsPerNode > 0) slot.networkMbpsPerNode = n.networkMbpsPerNode;
      if (n.storageMbpsPerNode > 0) slot.storageThroughputMbpsPerNode = n.storageMbpsPerNode;
      if (n.localStorageMbpsPerNode > 0)
        slot.localStorageThroughputMbpsPerNode = n.localStorageMbpsPerNode;
      return slot;
    });

    const cleanName = name.trim();
    // When editing, KEEP the original id even if the user renamed. The id
    // is what Fleet Builder references; renaming should be display-only.
    const groupId = isEditing ? editServer!.id : slug;
    const group: HardwareGroup = {
      id: groupId,
      name: cleanName,
      // Custom + typed name → save the typed value. Custom + blank → "Custom".
      // Standard pick → save as-is.
      provider:
        provider === 'Custom' && customProviderName.trim()
          ? customProviderName.trim()
          : provider || undefined,
      memoryCategory: first.memoryGib >= 24576 ? 'vhm' : first.memoryGib > 4096 ? 'hm' : 'mm',
      memoryGibPerNode: first.memoryGib,
      socketsPerNode: first.socketsPerNode,
      coresPerSocket: first.coresPerSocket,
      vcpusPerNode: first.vcpusPerNode,
      nodesPerRack: countsTotal,
      processor: first.processor.trim(),
      rackComposition: composition,
      homeFor: [],
      spilloverFrom: [],
      isolated: false,
      notes: notes.trim() || undefined,
      // Rack-level finance. costPerRackUsd is the authoritative source; the
      // group-level costPerNodeUsd is left undefined so finance helpers
      // unambiguously use the rack-level value (derived per-node = rack ÷
      // totalNodes if any consumer needs it). Usable life applies to the
      // whole rack — every node shares it.
      costPerRackUsd: costPerRackUsd === '' ? undefined : Number(costPerRackUsd),
      usableLifeMonths: usableLifeMonths === '' ? undefined : Number(usableLifeMonths),
      opexPerNodeMonthlyUsd:
        opexPerNodeMonthlyUsd === '' ? undefined : Number(opexPerNodeMonthlyUsd),
      networkMbpsPerNode: first.networkMbpsPerNode > 0 ? first.networkMbpsPerNode : undefined,
      storageThroughputMbpsPerNode: first.storageMbpsPerNode > 0 ? first.storageMbpsPerNode : undefined,
      localStorageThroughputMbpsPerNode:
        first.localStorageMbpsPerNode > 0 ? first.localStorageMbpsPerNode : undefined,
      // v2.19 — Buffer/overhead no longer on HardwareGroup; authored per
      // cluster in the Fleet Builder.
    };
    if (isEditing && onUpdate) {
      onUpdate(editServer!.id, group);
      setSavedMsg(`Updated "${cleanName}".`);
      // Don't reset — keep the form populated so the user can keep tweaking.
      // Parent typically clears editServer (which our useEffect responds to)
      // if it wants to drop edit mode.
    } else {
      onAdd(group);
      setSavedMsg(`Saved "${cleanName}" to the Server Library.`);
      reset();
      // v2.19.33 — Per user feedback: after Save, collapse the form so the
      // user immediately sees the new server in the Library below. The
      // savedMsg toast still surfaces under the collapsed header. The
      // 3.5s setTimeout below clears the message; on next open the form
      // is already reset().
      setOpen(false);
    }
    setTimeout(() => setSavedMsg(null), 3500);
  };

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <section ref={sectionRef}>
      <h2 className="section-h flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 flex-1 text-left bg-transparent border-0 p-0 cursor-pointer"
          aria-expanded={open}
          aria-label={open ? 'Collapse Server Builder' : 'Expand Server Builder'}
          style={{ font: 'inherit', color: 'inherit', letterSpacing: 'inherit' }}
        >
          <span className="text-[10px]" style={{ color: 'var(--interactive)' }}>
            {open ? '▾' : '▸'}
          </span>
          {stepNumber != null && !isEditing && (
            <span
              className="inline-flex items-center justify-center text-[10px] font-mono"
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: 'rgba(129, 140, 248, 0.22)',
                color: 'var(--interactive)',
                border: '1px solid var(--border-glow)',
                flexShrink: 0,
              }}
              aria-label={`Step ${stepNumber}`}
            >
              {stepNumber}
            </span>
          )}
          <span>{isEditing ? `✎ Editing: ${editServer!.name}` : '+ Build a Server'}</span>
        </button>
        {headerActions && (
          <div
            className="flex items-center gap-2 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {headerActions}
          </div>
        )}
      </h2>

      {!open && savedMsg && (
        <div
          className="text-[10px] mt-1 px-2 py-1.5"
          style={{
            background: 'rgba(129, 140, 248, 0.10)',
            border: '1px solid var(--border-glow)',
            color: 'var(--interactive)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          {savedMsg}
        </div>
      )}

      {open && (
        <div
          className="glass mt-2 p-3 space-y-3"
          style={{ borderRadius: 'var(--radius-md)' }}
        >
          {/* v2.19.33 — Survey-style progressive builder. Each section is a
              StepCard: header always visible (number + label + ✓ when
              complete + click to revisit), body only when this step is
              active. Finishing a step (Next →) collapses it and opens the
              next. In edit mode all three steps stay expanded so the user
              can spot-edit any field. */}
          {/* ── STEP 1 — SERVER IDENTITY ─────────────────────────────── */}
          <StepCard
            stepNumber={1}
            title="Server identity"
            complete={identityValid}
            active={isEditing || step === 'identity'}
            summary={
              identityValid
                ? `${name.trim()}${provider === 'Custom' && customProviderName.trim() ? ` · ${customProviderName.trim()}` : provider && provider !== 'Custom' ? ` · ${provider}` : ''}`
                : 'Pick a name + provider'
            }
            onActivate={() => setStep('identity')}
          >
            {/* v2.19.47 — Identity restructured into clean stacked rows:
                Row 1: Name | Provider (2-col grid)
                Row 2: Custom provider name (full width, only when Custom)
                Row 3: Notes (full width)
                Previous layout left a hanging empty cell next to Notes when
                Provider ≠ Custom — felt sloppy. */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name *">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Gen10 R740"
                    className="glass-input text-[11px]"
                    style={INPUT_STYLE}
                  />
                  {!nameUnique && name.trim() && (
                    <span className="text-[9px] text-red-300 mt-0.5">Already exists.</span>
                  )}
                </Field>
                <Field label="Provider">
                  <GlassDropdown
                    value={provider}
                    options={PROVIDER_OPTIONS}
                    onChange={setProvider}
                    placeholder="Pick a provider…"
                  />
                </Field>
              </div>
              {provider === 'Custom' && (
                <Field label="Custom provider name">
                  <input
                    type="text"
                    value={customProviderName}
                    onChange={(e) => setCustomProviderName(e.target.value)}
                    placeholder="e.g. On-prem, Lab, Edge"
                    className="glass-input text-[11px]"
                    style={INPUT_STYLE}
                  />
                </Field>
              )}
              <Field label="Notes (optional)">
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Free-form notes"
                  className="glass-input text-[11px]"
                  style={INPUT_STYLE}
                />
              </Field>
            </div>
            {!isEditing && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => {
                    setStep('nodes');
                    requestAnimationFrame(() => {
                      nodesStepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    });
                  }}
                  disabled={!identityValid}
                  className="btn-ghost text-[11px]"
                  style={{
                    padding: '5px 14px',
                    color: identityValid ? 'var(--interactive)' : 'var(--text-muted)',
                    borderColor: identityValid ? 'var(--border-glow)' : 'rgba(255,255,255,0.10)',
                    background: identityValid ? 'rgba(129, 140, 248,0.10)' : 'transparent',
                    cursor: identityValid ? 'pointer' : 'not-allowed',
                  }}
                  title={identityValid ? 'Continue to Nodes' : 'Name + unique slug required'}
                >
                  Next: Nodes →
                </button>
              </div>
            )}
          </StepCard>

          {/* ── STEP 2 — NODES ──────────────────────────────────────── */}
          <StepCard
            stepNumber={2}
            title="Nodes"
            complete={nodesValid}
            active={isEditing || step === 'nodes'}
            summary={
              nodesValid
                ? `${countsTotal} ${countsTotal === 1 ? 'node' : 'nodes'} · ${nodes.length} type${nodes.length === 1 ? '' : 's'}`
                : 'Add at least one node with memory + count'
            }
            onActivate={() => identityValid && setStep('nodes')}
            disabled={!identityValid}
            innerRef={nodesStepRef}
          >
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[10px] text-text-muted ml-auto">
                {countsTotal} {countsTotal === 1 ? 'node' : 'nodes'} in this rack
              </span>
            </div>
            <div className="space-y-3">
              {nodes.map((n, i) => (
                <NodeBlock
                  key={i}
                  index={i}
                  node={n}
                  cpuLibrary={cpuLibrary}
                  onChange={(patch) => updateNode(i, patch)}
                  onPickCpu={(cpu) => pickCpu(i, cpu)}
                  onRemove={() => removeNode(i)}
                  canRemove={nodes.length > 1}
                />
              ))}
              {nodes.length < MAX_NODE_TYPES && (
                <button
                  onClick={addNode}
                  className="text-[11px] w-full text-left"
                  style={{
                    padding: '8px 12px',
                    color: 'var(--interactive)',
                    border: '1px dashed var(--border-glow)',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(129, 140, 248,0.04)',
                  }}
                >
                  + Add another node ({nodes.length}/{MAX_NODE_TYPES})
                </button>
              )}
            </div>
            {!isEditing && (
              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setStep('identity')}
                  className="btn-ghost text-[11px]"
                  style={{
                    padding: '5px 14px',
                    color: 'var(--text-secondary)',
                    borderColor: 'rgba(255,255,255,0.12)',
                  }}
                >
                  ← Back
                </button>
                <button
                  onClick={() => {
                    setStep('financial');
                    requestAnimationFrame(() => {
                      financialStepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    });
                  }}
                  disabled={!nodesValid}
                  className="btn-ghost text-[11px]"
                  style={{
                    padding: '5px 14px',
                    color: nodesValid ? 'var(--interactive)' : 'var(--text-muted)',
                    borderColor: nodesValid ? 'var(--border-glow)' : 'rgba(255,255,255,0.10)',
                    background: nodesValid ? 'rgba(129, 140, 248,0.10)' : 'transparent',
                    cursor: nodesValid ? 'pointer' : 'not-allowed',
                  }}
                  title={nodesValid ? 'Continue to Financial' : 'Each node needs memory > 0 and count > 0'}
                >
                  Next: Financial →
                </button>
              </div>
            )}
          </StepCard>

          {/* ── STEP 3 — FINANCIAL ───────────────────────────────────── */}
          <StepCard
            stepNumber={3}
            title="Financial (optional)"
            complete={
              costPerRackUsd !== '' && usableLifeMonths !== '' && Number(usableLifeMonths) > 0
            }
            active={isEditing || step === 'financial'}
            summary={
              costPerRackUsd === ''
                ? 'No capex set — Insights $ figures will be blank for this server.'
                : `$${Number(costPerRackUsd).toLocaleString()} / rack · ${usableLifeMonths || 72} mo life`
            }
            onActivate={() => nodesValid && setStep('financial')}
            disabled={!nodesValid}
            innerRef={financialStepRef}
          >
            <div className="grid grid-cols-2 gap-2 mt-1">
              <Field label="Cost per rack (USD)">
                <NumberInputOptional value={costPerRackUsd} onChange={setCostPerRackUsd} min={0} />
              </Field>
              <Field label="Usable life (months)">
                <NumberInputOptional value={usableLifeMonths} onChange={setUsableLifeMonths} min={1} />
              </Field>
              <Field label="Opex / node / mo (USD)">
                <NumberInputOptional
                  value={opexPerNodeMonthlyUsd}
                  onChange={setOpexPerNodeMonthlyUsd}
                  min={0}
                />
              </Field>
            </div>
            {!isEditing && (
              <div className="flex justify-start pt-2">
                <button
                  onClick={() => setStep('nodes')}
                  className="btn-ghost text-[11px]"
                  style={{
                    padding: '5px 14px',
                    color: 'var(--text-secondary)',
                    borderColor: 'rgba(255,255,255,0.12)',
                  }}
                >
                  ← Back
                </button>
              </div>
            )}
          </StepCard>

          {/* v2.19 — Buffer / Overhead section REMOVED. Buffer is authored
              per cluster in the Fleet Builder where the user can see rack
              counts, utility exclusion, and per-node-type sizing in
              context. The Hardware Library is now pure template. */}

          {/* ── ERRORS / SAVE ───────────────────────────────────────── */}
          {error && (
            <div
              className="text-[10px] px-2 py-1.5"
              style={{
                background: 'rgba(239,68,68,0.10)',
                border: '1px solid rgba(239,68,68,0.4)',
                color: '#FCA5A5',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {error}
            </div>
          )}
          {savedMsg && (
            <div
              className="text-[10px] px-2 py-1.5"
              style={{
                background: 'rgba(129, 140, 248,0.10)',
                border: '1px solid var(--border-glow)',
                color: 'var(--interactive)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {savedMsg}
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick={reset}
              className="btn-ghost text-[11px]"
              style={{
                padding: '6px 14px',
                color: 'var(--text-secondary)',
                borderColor: 'rgba(255,255,255,0.12)',
              }}
            >
              Reset form
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (isEditing && onCancelEdit) onCancelEdit();
                  reset();
                  setOpen(false);
                }}
                className="btn-ghost text-[11px]"
                style={{
                  padding: '6px 14px',
                  color: 'var(--text-secondary)',
                  borderColor: 'rgba(255,255,255,0.12)',
                }}
              >
                {isEditing ? 'Cancel edit' : 'Close'}
              </button>
              <button
                onClick={commit}
                disabled={!canSave}
                className="btn-ghost text-[11px]"
                style={{
                  padding: '6px 16px',
                  color: canSave ? 'var(--interactive)' : 'var(--text-muted)',
                  borderColor: canSave ? 'var(--border-glow)' : 'rgba(255,255,255,0.10)',
                  background: canSave ? 'rgba(129, 140, 248,0.10)' : 'transparent',
                  cursor: canSave ? 'pointer' : 'not-allowed',
                }}
                title={canSave
                  ? (isEditing ? 'Save changes to this server' : 'Add this server to the library')
                  : 'Fix the warnings above first'}
              >
                {isEditing ? '✓ Save changes' : '+ Save server'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ── Small building blocks ────────────────────────────────────────────────

// v2.19.33 — Progressive step card. Header always shows the step number +
// title + ✓ (when complete). Body shows when active=true. When inactive,
// a one-line summary describes what's currently filled. Click the header
// to revisit; disabled = upstream step not complete.
function StepCard({
  stepNumber,
  title,
  complete,
  active,
  summary,
  onActivate,
  disabled,
  children,
  innerRef,
}: {
  stepNumber: number;
  title: string;
  complete: boolean;
  active: boolean;
  summary: string;
  onActivate: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  innerRef?: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div
      ref={innerRef}
      style={{
        background: active ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.015)',
        border: `1px solid ${active ? 'var(--border-glow)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-md)',
        padding: 10,
        opacity: disabled && !active ? 0.55 : 1,
      }}
    >
      <button
        type="button"
        onClick={disabled ? undefined : onActivate}
        className="w-full flex items-center gap-2 text-left bg-transparent border-0 p-0"
        style={{
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        aria-expanded={active}
        aria-disabled={disabled}
      >
        <span
          className="inline-flex items-center justify-center text-[10px] font-mono"
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: complete
              ? 'rgba(129, 140, 248, 0.22)'
              : active
              ? 'rgba(129, 140, 248, 0.10)'
              : 'rgba(255,255,255,0.05)',
            color: complete
              ? 'var(--interactive)'
              : active
              ? 'var(--interactive)'
              : 'var(--text-muted)',
            border: `1px solid ${
              complete
                ? 'var(--border-glow)'
                : active
                ? 'rgba(129, 140, 248, 0.30)'
                : 'rgba(255,255,255,0.08)'
            }`,
            flexShrink: 0,
          }}
        >
          {complete ? '✓' : stepNumber}
        </span>
        <span
          className="text-[11px] font-semibold tracking-[0.02em]"
          style={{ color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}
        >
          {title}
        </span>
        {!active && (
          <span className="text-[10px] normal-case tracking-normal text-text-muted ml-2 truncate flex-1">
            {summary}
          </span>
        )}
        {!active && (
          <span className="text-[10px] text-text-muted ml-auto">▸</span>
        )}
      </button>
      {active && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] tracking-[0.04em] font-semibold text-interactive">
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[9px] tracking-[0.04em] text-text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

// NumberInput / NumberInputOptional moved to `./NumberInput` in v2.18.6 —
// shared across Fleet Builder + Server Builder so backspace-to-empty works
// uniformly. See that file for the buffer-string pattern.

// Small hover-tooltip info icon. Native title for the description so it
// works across themes and devices without bringing in a popover lib.
function InfoTip({ text }: { text: string }) {
  return (
    <span
      title={text}
      role="img"
      aria-label={text}
      className="inline-flex items-center justify-center cursor-help"
      style={{
        width: 14,
        height: 14,
        borderRadius: '50%',
        fontSize: 9,
        fontWeight: 600,
        color: 'var(--interactive)',
        border: '1px solid var(--border-glow)',
        background: 'rgba(129, 140, 248,0.10)',
        userSelect: 'none',
      }}
    >
      i
    </span>
  );
}

// ── Per-node block ────────────────────────────────────────────────────────

function NodeBlock({
  index,
  node,
  cpuLibrary,
  onChange,
  onPickCpu,
  onRemove,
  canRemove,
}: {
  index: number;
  node: NodeBlockInput;
  cpuLibrary: UserCpu[];
  onChange: (patch: Partial<NodeBlockInput>) => void;
  onPickCpu: (cpu: UserCpu) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const accent =
    node.role === 'utility'
      ? { bg: 'rgba(252, 211, 77, 0.10)', border: 'rgba(252, 211, 77, 0.40)' }
      : node.role === 'other'
        ? { bg: 'rgba(167, 139, 250, 0.10)', border: 'rgba(167, 139, 250, 0.40)' }
        : { bg: 'rgba(129, 140, 248, 0.07)', border: 'rgba(129, 140, 248, 0.40)' };

  return (
    <div
      className="p-3"
      style={{
        background: accent.bg,
        border: `1px solid ${accent.border}`,
        borderRadius: 'var(--radius-md)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className="text-[11px] font-semibold text-text-primary">
          Node Type {index + 1}
        </span>
        <RoleToggle role={node.role} onChange={(role) => onChange({ role })} />
        <InfoTip text="Compute and Other nodes accept VM workloads. Utility nodes are reserved for control-plane / management hosts — the simulator never deploys VMs to them." />
        {canRemove && (
          <button
            onClick={onRemove}
            className="ml-auto text-[10px] tracking-[0.02em] text-text-muted hover:text-red-400 transition-colors"
            style={{ padding: '2px 6px' }}
            title="Remove this node"
          >
            ✕
          </button>
        )}
      </div>

      {/* Role label for "Other" */}
      {node.role === 'other' && (
        <div className="mb-2">
          <Field label="Role label">
            <input
              type="text"
              value={node.roleLabel}
              onChange={(e) => onChange({ roleLabel: e.target.value })}
              placeholder="e.g. GPU, Storage, Inference"
              className="glass-input text-[11px]"
              style={INPUT_STYLE}
            />
          </Field>
        </div>
      )}

      {/* Specs grid */}
      <div className="grid grid-cols-2 gap-2">
        <Field label="Processor">
          <CpuPicker
            cpuLibrary={cpuLibrary}
            value={node.processor}
            onPick={onPickCpu}
            onCustom={(text) => onChange({ processor: text })}
          />
        </Field>
        <Field label="Memory/node (GiB) *">
          <NumberInput value={node.memoryGib} onChange={(v) => onChange({ memoryGib: Math.max(1, v) })} min={1} />
        </Field>
        <Field label="Sockets/node">
          <NumberInput value={node.socketsPerNode} onChange={(v) => onChange({ socketsPerNode: Math.max(1, v) })} min={1} />
        </Field>
        <Field label="Cores/socket">
          <NumberInput value={node.coresPerSocket} onChange={(v) => onChange({ coresPerSocket: Math.max(1, v) })} min={1} />
        </Field>
        <Field label="vCPUs/node">
          <NumberInput value={node.vcpusPerNode} onChange={(v) => onChange({ vcpusPerNode: Math.max(1, v) })} min={1} />
        </Field>
        <Field label="Network Mbps/node">
          <NumberInput value={node.networkMbpsPerNode} onChange={(v) => onChange({ networkMbpsPerNode: Math.max(0, v) })} min={0} />
        </Field>
        <Field label="Local storage MB/s/node">
          <NumberInput value={node.localStorageMbpsPerNode} onChange={(v) => onChange({ localStorageMbpsPerNode: Math.max(0, v) })} min={0} />
        </Field>
        <Field label="Remote storage MB/s/node">
          <NumberInput value={node.storageMbpsPerNode} onChange={(v) => onChange({ storageMbpsPerNode: Math.max(0, v) })} min={0} />
        </Field>
        <Field label="Count of this node type per rack *">
          <NumberInput value={node.count} onChange={(v) => onChange({ count: Math.max(1, v) })} min={1} />
        </Field>
      </div>
    </div>
  );
}

// ── Type role toggle: Compute | Utility | Other ─────────────────────────

function RoleToggle({
  role,
  onChange,
}: {
  role: NodeRole;
  onChange: (role: NodeRole) => void;
}) {
  const opts: { value: NodeRole; label: string; color: string }[] = [
    { value: 'compute', label: 'Compute', color: '#86efac' },
    { value: 'utility', label: 'Utility', color: '#fcd34d' },
    { value: 'other', label: 'Other', color: '#c4b5fd' },
  ];
  return (
    <div className="inline-flex" style={{ borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
      {opts.map((o, i) => {
        const active = role === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              padding: '3px 10px',
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'none',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRight: i === opts.length - 1 ? '1px solid rgba(255,255,255,0.10)' : 'none',
              borderTopLeftRadius: i === 0 ? 'var(--radius-pill)' : 0,
              borderBottomLeftRadius: i === 0 ? 'var(--radius-pill)' : 0,
              borderTopRightRadius: i === opts.length - 1 ? 'var(--radius-pill)' : 0,
              borderBottomRightRadius: i === opts.length - 1 ? 'var(--radius-pill)' : 0,
              background: active ? `${o.color}33` : 'transparent',
              color: active ? o.color : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 120ms',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ── CPU picker — feeds Processor + cores + vCPUs from CPU Library ───────

function CpuPicker({
  cpuLibrary,
  value,
  onPick,
  onCustom,
}: {
  cpuLibrary: UserCpu[];
  value: string;
  onPick: (cpu: UserCpu) => void;
  onCustom: (text: string) => void;
}) {
  if (cpuLibrary.length === 0) {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onCustom(e.target.value)}
        placeholder="Add a CPU above, or type a name"
        className="glass-input text-[11px]"
        style={INPUT_STYLE}
      />
    );
  }
  const options: DropdownOption[] = cpuLibrary.map((c) => ({
    value: c.name,
    label: c.name,
    meta: `${c.vendor ?? ''} · ${c.family} · ${c.coresPerSocket} c/skt · HT ${c.hyperthreading ? 'ON' : 'OFF'}`,
  }));
  return (
    <GlassDropdown
      value={value}
      options={options}
      onChange={(v) => {
        if (v === '') { onCustom(''); return; }
        const cpu = cpuLibrary.find((c) => c.name === v);
        if (cpu) onPick(cpu);
      }}
      placeholder="Pick a CPU…"
      searchable
      emptyValue=""
      emptyLabel="(no selection)"
    />
  );
}
