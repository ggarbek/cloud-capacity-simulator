import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../state/AppContext';
import { vmClass, vmFamily, compareFamily, providerOf, PROVIDER_ORDER } from '../utils/vmTaxonomy';
import { categorize } from '../utils/vmCategory';
import { VM_CATEGORIES, type VmCategory } from '../types';
import { ProviderPillRow } from './ProviderPillRow';
import type { CellValue } from './FungibilityTab';
import type { CatalogEntry, HardwareGroup } from '../types';

/**
 * v2.22.3 — Fungibility board: full-catalog palette → hardware targets.
 *
 *   ┌ VMs (palette) ──────────┐   ┌ Hardware (targets) ──────────────────┐
 *   │ Cloud Provider          │   │ Hardware · N · ⚠ M without rules      │
 *   │ [Azure][AWS][GCP]…      │   │ [●2S][●8S][●…]  Reset                 │
 *   │ VM Category · 8         │   │                                       │
 *   │ [GP·3][CO·2][MO·7]…     │   │ ┌ 2S 4.19 TiB/node ────────────────┐ │
 *   │ VM Family · 3 in GP     │ → │ │ ★ Home    [D] [E]                 │ │
 *   │ [B][D][GS]  (caret→size)│   │ │ ↓ Spill 1 [F]                    │ │
 *   │                         │   │ │ ✕ Never   [GS]                   │ │
 *   └─────────────────────────┘   │ └───────────────────────────────────┘ │
 *                                 └───────────────────────────────────────┘
 *
 * THE MODEL (the user's proposal):
 *   - LEFT is the whole catalog, not just the BoM: **Cloud Provider** is the
 *     initial filter (NOT draggable), then **VM Category** and **VM Family**
 *     are the draggable payload. Expand a family for per-size fine-tune.
 *   - Dragging a Category or Family authors fungibility for ALL the VMs under
 *     it. We write at the **class level** (`vmClass`) — `vmGeneration` is the
 *     family-version (e.g. `Dsv5`), so a class like `Dsv5-MM` is unique to one
 *     family; a handful of class cells covers every size in the family via the
 *     engine's size-first / class-fallback read. Per-size drag writes the
 *     size-keyed override.
 *   - RIGHT shows EVERY hardware in the library (not just placed clusters) as
 *     a single block with explicit tier rows: ★ Home · ↓ Spill 1 · Spill 2 …
 *     · ✕ Never. Drop into a row → that row IS the tier (direct cell write).
 *
 * ENGINE CONTRACT UNCHANGED — reads resolve size-first / class-fallback; the
 * raw priority value (0 = Home, k = Spill k, 'blocked' = Never) is both what
 * we store and what we display, so matrix and board always agree.
 */

const MAX_TIER = 5;
const SIZE_RENDER_CAP = 60;

type Tier = number | 'block';

interface Server {
  id: string;
  name: string;
  maxNodeMemGib: number;
  nodeVcpus: number;
}

/** A family (or part of one) sitting at one tier on one server. `keys` are the
 *  matrix keys (class and/or size) that put it there — used for removal. */
interface LaneGroup {
  family: string;
  keys: string[];
}

function categoryOf(v: CatalogEntry): VmCategory {
  return (v.category ?? categorize(v.provider, v.family)) as VmCategory;
}

export function FungibilityBoard({
  matrix,
  setMatrix,
}: {
  matrix: Record<string, Record<string, CellValue>>;
  setMatrix: (
    next:
      | Record<string, Record<string, CellValue>>
      | ((prev: Record<string, Record<string, CellValue>>) => Record<string, Record<string, CellValue>>),
  ) => void;
}) {
  const { state } = useApp();
  // selection = Set of tokens: `f:<family>` or `s:<sizeName>`
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<VmCategory | null>(null);
  const [expandedFams, setExpandedFams] = useState<Set<string>>(new Set());
  const [hwFilter, setHwFilter] = useState<Set<string>>(new Set()); // empty = all
  const lastFamilyRef = useRef<string | null>(null);

  const [drag, setDrag] = useState<{ x: number; y: number; label: string } | null>(null);
  const [hover, setHover] = useState<{ hwId: string; tier: Tier } | null>(null);
  const dragMeta = useRef<{ startX: number; startY: number; moved: boolean } | null>(null);
  // Always-current mirror of `selected` so the pointer-drag handlers (which
  // close over state at pointerdown time) can read the latest selection at
  // the moment the drag actually starts — essential for ⌘/Ctrl multi-select.
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  // ── hardware: EVERY group in the library (not just placed clusters) ──────
  const servers: Server[] = useMemo(
    () => state.userHardware.map((g) => ({ id: g.id, name: g.name, ...capacity(g) })),
    [state.userHardware],
  );
  const serverIds = useMemo(() => new Set(servers.map((s) => s.id)), [servers]);

  // ── providers present + per-provider VM counts ───────────────────────────
  const providersPresent = useMemo(() => {
    const set = new Set<string>();
    for (const v of state.userVms) set.add(providerOf(v));
    const extras = [...set].filter((p) => !(PROVIDER_ORDER as readonly string[]).includes(p)).sort();
    return [...PROVIDER_ORDER.filter((p) => set.has(p)), ...extras];
  }, [state.userVms]);
  const providerCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const v of state.userVms) {
      const p = providerOf(v);
      m[p] = (m[p] ?? 0) + 1;
    }
    return m;
  }, [state.userVms]);

  useEffect(() => {
    if (providersPresent.length === 0) return;
    if (activeProvider && providersPresent.includes(activeProvider)) return;
    setActiveProvider(providersPresent[0]);
  }, [providersPresent, activeProvider]);

  // ── catalog hierarchy for the active provider (one pass, memoized) ───────
  const cat = useMemo(() => {
    // category -> family -> { sizes:[], classes:Set }
    const byCat = new Map<VmCategory, Map<string, { sizes: string[]; classes: Set<string> }>>();
    const familyToClasses = new Map<string, Set<string>>();
    const familyToSizes = new Map<string, string[]>();
    const keyToFamily = new Map<string, string>(); // size key + class key -> family
    if (activeProvider) {
      for (const v of state.userVms) {
        if (providerOf(v) !== activeProvider) continue;
        const c = categoryOf(v);
        const fam = vmFamily(v);
        const cls = vmClass(v);
        if (!byCat.has(c)) byCat.set(c, new Map());
        const fams = byCat.get(c)!;
        if (!fams.has(fam)) fams.set(fam, { sizes: [], classes: new Set() });
        const fe = fams.get(fam)!;
        fe.sizes.push(v.vmSizeName);
        fe.classes.add(cls);
        if (!familyToClasses.has(fam)) familyToClasses.set(fam, new Set());
        familyToClasses.get(fam)!.add(cls);
        if (!familyToSizes.has(fam)) familyToSizes.set(fam, []);
        familyToSizes.get(fam)!.push(v.vmSizeName);
        keyToFamily.set(v.vmSizeName, fam);
        keyToFamily.set(cls, fam);
      }
    }
    const categories = VM_CATEGORIES.filter((c) => byCat.has(c)).map((c) => ({
      category: c,
      families: [...byCat.get(c)!.entries()]
        .map(([family, e]) => ({ family, sizeCount: e.sizes.length, sizes: e.sizes }))
        .sort((a, b) => compareFamily(a.family, b.family)),
    }));
    return { categories, familyToClasses, familyToSizes, keyToFamily };
  }, [state.userVms, activeProvider]);

  useEffect(() => {
    if (cat.categories.length === 0) return;
    if (activeCategory && cat.categories.some((c) => c.category === activeCategory)) return;
    setActiveCategory(cat.categories[0].category);
  }, [cat.categories, activeCategory]);

  const familiesInCategory = useMemo(
    () => cat.categories.find((c) => c.category === activeCategory)?.families ?? [],
    [cat.categories, activeCategory],
  );

  // ── families that have ANY rule (for the unrouted ⚠ cue) ─────────────────
  const routedFamilies = useMemo(() => {
    const s = new Set<string>();
    for (const key of Object.keys(matrix)) {
      const fam = cat.keyToFamily.get(key);
      if (!fam) continue;
      const cells = matrix[key];
      for (const hwId of Object.keys(cells)) {
        if (cells[hwId] !== undefined && cells[hwId] !== null && serverIds.has(hwId)) {
          s.add(fam);
          break;
        }
      }
    }
    return s;
  }, [matrix, cat.keyToFamily, serverIds]);

  // ── server-centric view: hwId -> tier -> family -> contributing keys ─────
  const serverView = useMemo(() => {
    const m = new Map<string, Map<string, Map<string, Set<string>>>>();
    for (const s of servers) m.set(s.id, new Map());
    for (const key of Object.keys(matrix)) {
      const fam = cat.keyToFamily.get(key);
      if (!fam) continue;
      const cells = matrix[key];
      for (const hwId of Object.keys(cells)) {
        if (!m.has(hwId)) continue;
        const v = cells[hwId];
        if (v === undefined || v === null) continue;
        const tierKey = v === 'blocked' ? 'block' : String(Math.min(Math.max(0, v as number), MAX_TIER));
        const lane = m.get(hwId)!;
        if (!lane.has(tierKey)) lane.set(tierKey, new Map());
        const fams = lane.get(tierKey)!;
        if (!fams.has(fam)) fams.set(fam, new Set());
        fams.get(fam)!.add(key);
      }
    }
    return m;
  }, [matrix, servers, cat.keyToFamily]);

  const groupsAt = (hwId: string, tier: Tier): LaneGroup[] => {
    const fams = serverView.get(hwId)?.get(tier === 'block' ? 'block' : String(tier));
    if (!fams) return [];
    return [...fams.entries()].map(([family, keys]) => ({ family, keys: [...keys] })).sort((a, b) => compareFamily(a.family, b.family));
  };
  const serverHasRules = (hwId: string) => (serverView.get(hwId)?.size ?? 0) > 0;

  // ── token → matrix keys ──────────────────────────────────────────────────
  const tokenKeys = (token: string): string[] => {
    if (token.startsWith('s:')) return [token.slice(2)];
    const fam = token.slice(2);
    return [...(cat.familyToClasses.get(fam) ?? [])];
  };

  // ── write: drop the selection into an exact tier (direct cell set) ───────
  const assignSelection = (hwId: string, tier: Tier, tokens?: Set<string>) => {
    const targets = tokens ?? selected;
    if (targets.size === 0) return;
    const value: CellValue = tier === 'block' ? 'blocked' : Math.min(tier, MAX_TIER);
    setMatrix((prev) => {
      const next = { ...prev };
      for (const token of targets) {
        for (const key of tokenKeys(token)) {
          const row = { ...(next[key] ?? prev[key] ?? {}) };
          row[hwId] = value;
          next[key] = row;
        }
      }
      return next;
    });
  };

  // Pull a family/size off one server — delete its contributing cells there.
  const removeGroup = (group: LaneGroup, hwId: string) => {
    setMatrix((prev) => {
      const next = { ...prev };
      for (const key of group.keys) {
        if (!next[key]) continue;
        const row = { ...next[key] };
        delete row[hwId];
        next[key] = row;
      }
      return next;
    });
  };

  // Move an already-placed group to a new tier by re-tiering ITS OWN keys
  // (not the family-token resolution) so it works whether the cell was
  // authored class-keyed or size-keyed. Same hardware → changes the tier in
  // place (Home ↔ Spill ↔ Never); different hardware → relocates the rule.
  const moveGroup = (group: LaneGroup, originHw: string, targetHw: string, targetTier: Tier) => {
    if (originHw === targetHw) {
      // same box: did the tier even change? (avoid a no-op undo entry)
      const v = targetTier === 'block' ? 'blocked' : Math.min(targetTier, MAX_TIER);
      const cur = matrix[group.keys[0]]?.[originHw];
      if (cur === v) return;
    }
    const value: CellValue = targetTier === 'block' ? 'blocked' : Math.min(targetTier, MAX_TIER);
    setMatrix((prev) => {
      const next = { ...prev };
      for (const key of group.keys) {
        const row = { ...(prev[key] ?? {}) };
        row[targetHw] = value;
        if (originHw !== targetHw) delete row[originHw];
        next[key] = row;
      }
      return next;
    });
  };

  // ── selection helpers ─────────────────────────────────────────────────────
  const famToken = (fam: string) => `f:${fam}`;
  const isFamSelected = (fam: string) => selected.has(famToken(fam));

  const onCategoryClick = (category: VmCategory, e: React.MouseEvent) => {
    setActiveCategory(category);
    // scope + select the whole category so it's ready to drop or narrow.
    // ⌘/Ctrl-click UNIONS this category's families into the live selection so
    // several categories can travel together.
    const fams = cat.categories.find((c) => c.category === category)?.families ?? [];
    const tokens = fams.map((f) => famToken(f.family));
    setSelected((prev) => {
      if (e.metaKey || e.ctrlKey) {
        const n = new Set(prev);
        tokens.forEach((t) => n.add(t));
        return n;
      }
      return new Set(tokens);
    });
  };

  const onFamilyClick = (fam: string, e: React.MouseEvent) => {
    const tok = famToken(fam);
    setSelected((prev) => {
      const next = new Set(prev);
      if (e.shiftKey && lastFamilyRef.current) {
        const order = familiesInCategory.map((f) => f.family);
        const a = order.indexOf(lastFamilyRef.current);
        const b = order.indexOf(fam);
        if (a >= 0 && b >= 0) {
          const [lo, hi] = a < b ? [a, b] : [b, a];
          for (let i = lo; i <= hi; i++) next.add(famToken(order[i]));
          return next;
        }
      }
      if (e.metaKey || e.ctrlKey) {
        if (next.has(tok)) next.delete(tok);
        else next.add(tok);
        return next;
      }
      return new Set([tok]); // plain click → just this family
    });
    lastFamilyRef.current = fam;
  };

  const onSizeClick = (size: string) => {
    const tok = `s:${size}`;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tok)) next.delete(tok);
      else next.add(tok);
      return next;
    });
  };

  const clearSel = () => setSelected(new Set());

  // ── pointer drag ────────────────────────────────────────────────────────
  // Generic gesture: `begin()` runs once when the drag actually STARTS (past
  // the 6px threshold) and returns the ghost label; `drop()` runs on release
  // over a tier row. Nothing mutates on pointerdown, so a ⌘/Ctrl-click that's
  // assembling a multi-selection is never clobbered.
  const startDrag = (
    e: React.PointerEvent,
    begin: () => string,
    drop: (hwId: string, tier: Tier) => void,
  ) => {
    dragMeta.current = { startX: e.clientX, startY: e.clientY, moved: false };
    // Premium drag: kill text-selection for the whole press (so dragging never
    // paints the page blue) and clear any selection that may have already
    // formed. The grabbing cursor goes on once a real drag begins. All of this
    // is restored on pointerup, click or drag alike.
    const prevUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';
    window.getSelection()?.removeAllRanges();
    const restoreBody = () => {
      document.body.style.userSelect = prevUserSelect;
      document.body.style.cursor = '';
    };
    const onMove = (ev: PointerEvent) => {
      const meta = dragMeta.current;
      if (!meta) return;
      if (!meta.moved) {
        if (Math.hypot(ev.clientX - meta.startX, ev.clientY - meta.startY) < 6) return;
        meta.moved = true;
        document.body.style.cursor = 'grabbing';
        window.getSelection()?.removeAllRanges();
        setDrag({ x: ev.clientX, y: ev.clientY, label: begin() });
      }
      setDrag((d) => (d ? { ...d, x: ev.clientX, y: ev.clientY } : d));
      const el = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
      const zone = el?.closest('[data-drop-hw]') as HTMLElement | null;
      setHover(zone ? { hwId: zone.dataset.dropHw!, tier: parseTier(zone.dataset.dropTier!) } : null);
    };
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      restoreBody();
      const meta = dragMeta.current;
      dragMeta.current = null;
      setDrag(null);
      setHover(null);
      if (!meta?.moved) return;
      const el = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
      const zone = el?.closest('[data-drop-hw]') as HTMLElement | null;
      if (zone) drop(zone.dataset.dropHw!, parseTier(zone.dataset.dropTier!));
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // Drag from the palette (category / family / size chip). If the pressed
  // chip is already part of the live selection, the WHOLE selection travels;
  // otherwise the drag is just this chip (and becomes the selection).
  const palettePointerDown = (tokens: string[], singleLabel: string) => (e: React.PointerEvent) => {
    let payload = new Set(tokens);
    startDrag(
      e,
      () => {
        const cur = selectedRef.current;
        if (cur.size > 0 && tokens.every((t) => cur.has(t))) payload = cur;
        else {
          payload = new Set(tokens);
          setSelected(payload);
        }
        return payload.size > 1 ? `${payload.size} selected` : singleLabel;
      },
      (hw, tier) => assignSelection(hw, tier, payload),
    );
  };

  // Drag an already-placed chip between tiers (and across boxes).
  const assignedPointerDown = (group: LaneGroup, originHw: string) => (e: React.PointerEvent) =>
    startDrag(e, () => group.family, (hw, tier) => moveGroup(group, originHw, hw, tier));

  if (state.userVms.length === 0 || servers.length === 0) {
    return (
      <section
        className="px-4 py-4 text-[11.5px] text-text-muted leading-relaxed"
        style={{ background: 'var(--tint-soft)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)' }}
      >
        {servers.length === 0
          ? 'The fungibility board fills in once you have hardware (Set up › Hardware library). Each server becomes a drop target.'
          : 'No VM catalog loaded yet (Set up › VM catalog).'}
      </section>
    );
  }

  const selCount = selected.size;
  const K = Math.min(Math.max(servers.length - 1, 1), MAX_TIER);
  const hwWithoutRules = servers.filter((s) => !serverHasRules(s.id)).length;
  const visibleServers = hwFilter.size === 0 ? servers : servers.filter((s) => hwFilter.has(s.id));

  // Where the selection currently sits on a given server (uniform or mixed).
  const selTierAt = (hwId: string): { kind: 'none' | 'tier' | 'block' | 'mixed'; tier?: number } => {
    let seen: string | null = null;
    let tierNum: number | undefined;
    for (const token of selected) {
      for (const key of tokenKeys(token)) {
        const v = matrix[key]?.[hwId];
        const kind = v === undefined || v === null ? 'none' : v === 'blocked' ? 'block' : `t${v}`;
        if (seen === null) {
          seen = kind;
          tierNum = typeof v === 'number' ? v : undefined;
        } else if (seen !== kind) return { kind: 'mixed' };
      }
    }
    if (seen === null) return { kind: 'none' };
    if (seen.startsWith('t')) return { kind: 'tier', tier: tierNum };
    return { kind: seen as 'none' | 'block' };
  };

  const toggleHwFilter = (id: string) =>
    setHwFilter((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const selLabel = selCount === 1 ? selected.values().next().value!.replace(/^[fs]:/, '') : `${selCount} selected`;

  return (
    <div className="flex flex-wrap" style={{ gap: 14, userSelect: 'none', WebkitUserSelect: 'none', alignItems: 'flex-start' }}>
      {/* ════ LEFT — VM palette ════ */}
      <section
        style={{
          flex: '1 1 340px',
          minWidth: 320,
          maxWidth: 460,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
          padding: '13px 14px',
          position: 'sticky',
          top: 8,
        }}
      >
        <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 12 }}>
          <span className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            VMs
          </span>
          {selCount > 0 && (
            <>
              <span className="text-[10px] font-mono" style={{ color: 'var(--interactive)' }}>
                {selLabel}
              </span>
              <button onClick={clearSel} className="text-[10px] text-text-muted hover:text-text-primary transition-colors ml-auto" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                Clear
              </button>
            </>
          )}
        </div>

        {/* Cloud Provider — initial filter, NOT draggable */}
        <div style={{ marginBottom: 12 }}>
          <span className="text-[9px] tracking-[0.04em] block" style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>
            Cloud Provider
          </span>
          <ProviderPillRow
            mode="single"
            value={activeProvider}
            onChange={(next) => {
              if (typeof next === 'string') {
                setActiveProvider(next);
                setSelected(new Set());
              }
            }}
            counts={providerCounts}
          />
        </div>

        {/* VM Category — draggable */}
        <FilterRow label="VM Category" count={cat.categories.length}>
          {cat.categories.map(({ category, families }) => (
            <DragChip
              key={category}
              label={`${category} · ${families.length}`}
              active={activeCategory === category}
              onClick={(e) => onCategoryClick(category, e)}
              onPointerDown={palettePointerDown(families.map((f) => famToken(f.family)), category)}
              title={`${category} — ${families.length} families. Click to focus (⌘/Ctrl-click to add); drag onto a server to set fungibility for every VM in this category.`}
            />
          ))}
        </FilterRow>

        {/* VM Family — draggable */}
        {activeCategory && familiesInCategory.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <FilterRow label="VM Family" suffix={`· ${familiesInCategory.length} in ${activeCategory}`}>
              {familiesInCategory.map((f) => (
                <FamilyChip
                  key={f.family}
                  family={f.family}
                  sizeCount={f.sizeCount}
                  selected={isFamSelected(f.family)}
                  unrouted={!routedFamilies.has(f.family)}
                  expanded={expandedFams.has(f.family)}
                  onToggleExpand={() =>
                    setExpandedFams((p) => {
                      const n = new Set(p);
                      if (n.has(f.family)) n.delete(f.family);
                      else n.add(f.family);
                      return n;
                    })
                  }
                  onClick={(e) => onFamilyClick(f.family, e)}
                  onPointerDown={palettePointerDown([famToken(f.family)], f.family)}
                />
              ))}
            </FilterRow>

            {familiesInCategory
              .filter((f) => expandedFams.has(f.family))
              .map((f) => (
                <div key={f.family} className="flex flex-wrap items-center" style={{ gap: 5, marginTop: 8, paddingLeft: 2 }}>
                  <span className="text-[9px] font-mono" style={{ color: 'var(--text-dim)' }}>
                    {f.family} sizes:
                  </span>
                  {f.sizes.slice(0, SIZE_RENDER_CAP).map((size) => (
                    <SizeChip
                      key={size}
                      label={size.replace(/^Standard_/, '')}
                      selected={selected.has(`s:${size}`)}
                      onClick={() => onSizeClick(size)}
                      onPointerDown={palettePointerDown([`s:${size}`], size.replace(/^Standard_/, ''))}
                    />
                  ))}
                  {f.sizes.length > SIZE_RENDER_CAP && (
                    <span className="text-[9px]" style={{ color: 'var(--text-dim)' }}>
                      +{f.sizes.length - SIZE_RENDER_CAP} more — drag the family chip to cover all
                    </span>
                  )}
                </div>
              ))}
          </div>
        )}

        {selCount > 0 && (
          <div
            className="text-[10.5px] mt-3 px-3 py-2 leading-snug"
            style={{ background: 'var(--interactive-muted)', border: '1px solid var(--border-glow)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)' }}
          >
            <strong style={{ color: 'var(--interactive)' }}>{selLabel}</strong> — drag onto a tier row of a server, or
            click the row (<strong>★ Home</strong> / <strong>↓ Spill</strong> / <strong>✕ Never</strong>).
          </div>
        )}
      </section>

      {/* ════ RIGHT — Hardware targets ════ */}
      <section style={{ flex: '999 1 460px', minWidth: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding: '11px 14px' }}>
          <FilterRow
            label="Hardware"
            count={servers.length}
            suffix={
              hwWithoutRules > 0 ? (
                <span style={{ color: 'var(--status-warn)' }}>· ⚠ {hwWithoutRules} without rules</span>
              ) : (
                <span style={{ color: 'var(--interactive)' }}>· all have rules</span>
              )
            }
          >
            {servers.map((s) => {
              const hasRules = serverHasRules(s.id);
              const on = hwFilter.size === 0 || hwFilter.has(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleHwFilter(s.id)}
                  className="inline-flex items-center gap-1.5 text-[10px] font-mono transition-all"
                  style={{
                    padding: '3px 10px',
                    background: hwFilter.has(s.id) ? 'rgba(129, 140, 248, 0.14)' : 'rgba(255,255,255,0.03)',
                    color: hwFilter.has(s.id) ? 'var(--interactive)' : on ? 'var(--text-secondary)' : 'var(--text-dim)',
                    border: `1px solid ${hwFilter.has(s.id) ? 'var(--border-glow)' : 'rgba(255,255,255,0.10)'}`,
                    borderRadius: 'var(--radius-pill)',
                    opacity: hwFilter.size === 0 || on ? 1 : 0.55,
                  }}
                  title={hasRules ? `${s.name} — has rules. Click to focus.` : `${s.name} — no rules yet. Click to focus.`}
                  aria-pressed={hwFilter.has(s.id)}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: hasRules ? 'var(--interactive)' : 'var(--status-warn)', flexShrink: 0 }} />
                  {s.name}
                </button>
              );
            })}
            {hwFilter.size > 0 && (
              <button onClick={() => setHwFilter(new Set())} className="text-[10px] tracking-[0.02em] text-text-muted hover:text-text-primary transition-colors" style={{ padding: '3px 6px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                Reset
              </button>
            )}
          </FilterRow>
        </div>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 12 }}>
          {visibleServers.map((s) => (
            <ServerBlock
              key={s.id}
              server={s}
              K={K}
              active={selCount > 0 || !!drag}
              hover={hover}
              selTier={selCount > 0 ? selTierAt(s.id) : null}
              groupsAt={(tier) => groupsAt(s.id, tier)}
              onAssign={(tier) => assignSelection(s.id, tier)}
              onRemove={(group) => removeGroup(group, s.id)}
              onChipDrag={(group, e) => assignedPointerDown(group, s.id)(e)}
            />
          ))}
        </div>
      </section>

      {drag && (
        <div
          className="fixed pointer-events-none font-semibold"
          style={{ left: drag.x + 12, top: drag.y + 12, zIndex: 100, padding: '4px 10px', borderRadius: 'var(--radius-pill)', background: 'var(--interactive)', color: '#FFFFFF', fontSize: 11, boxShadow: 'var(--shadow-elevated)' }}
        >
          {drag.label}
        </div>
      )}
    </div>
  );
}

// ── helpers ────────────────────────────────────────────────────────────────

function parseTier(s: string): Tier {
  return s === 'block' ? 'block' : Number(s);
}
function tierLabel(t: Tier): string {
  return t === 'block' ? '✕ Never' : t === 0 ? '★ Home' : `↓ Spill ${t}`;
}

function FilterRow({ label, count, suffix, children }: { label: string; count?: number; suffix?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col" style={{ gap: 6 }}>
      <span className="text-[9px] tracking-[0.04em]" style={{ color: 'var(--text-secondary)' }}>
        {label}
        {(count !== undefined || suffix) && (
          <span className="normal-case tracking-normal ml-1.5" style={{ color: 'var(--text-muted)' }}>
            {count !== undefined ? `· ${count}` : ''} {suffix}
          </span>
        )}
      </span>
      <div className="flex gap-1.5 flex-wrap">{children}</div>
    </div>
  );
}

/** A draggable filter chip (VM Category). Click focuses; drag authors. */
function DragChip({
  label,
  active,
  onClick,
  onPointerDown,
  title,
}: {
  label: string;
  active: boolean;
  onClick: (e: React.MouseEvent) => void;
  onPointerDown: (e: React.PointerEvent) => void;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      onPointerDown={onPointerDown}
      className="text-[10px] font-mono transition-all"
      style={{
        padding: '3px 10px',
        background: active ? 'rgba(129, 140, 248, 0.14)' : 'rgba(255,255,255,0.03)',
        color: active ? 'var(--interactive)' : 'var(--text-secondary)',
        border: `1px solid ${active ? 'var(--border-glow)' : 'rgba(255,255,255,0.10)'}`,
        borderRadius: 'var(--radius-pill)',
        cursor: 'grab',
        touchAction: 'none',
      }}
      aria-pressed={active}
      title={title}
    >
      {label}
    </button>
  );
}

function FamilyChip({
  family,
  sizeCount,
  selected,
  unrouted,
  expanded,
  onToggleExpand,
  onClick,
  onPointerDown,
}: {
  family: string;
  sizeCount: number;
  selected: boolean;
  unrouted: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onClick: (e: React.MouseEvent) => void;
  onPointerDown: (e: React.PointerEvent) => void;
}) {
  const border = selected ? 'var(--interactive)' : unrouted ? 'rgba(251, 191, 36, 0.5)' : 'rgba(255,255,255,0.10)';
  const bg = selected ? 'var(--interactive)' : unrouted ? 'rgba(251, 191, 36, 0.06)' : 'rgba(255,255,255,0.03)';
  return (
    <span className="inline-flex items-stretch" style={{ borderRadius: 'var(--radius-pill)', border: `1px solid ${border}`, background: bg, overflow: 'hidden' }}>
      <button
        type="button"
        data-family-chip={family}
        onClick={onClick}
        onPointerDown={onPointerDown}
        className="flex items-center gap-1 transition-colors"
        style={{ padding: '3px 5px 3px 10px', border: 'none', background: 'transparent', color: selected ? '#FFFFFF' : 'var(--text-secondary)', fontSize: 10.5, fontWeight: 600, fontFamily: 'var(--font-mono, ui-monospace)', cursor: 'grab', touchAction: 'none' }}
        title={`${family} — ${sizeCount} size${sizeCount === 1 ? '' : 's'}${unrouted ? ' · no rules yet' : ''}. Click to select; drag onto a server.`}
      >
        {family}
        <span style={{ color: selected ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', fontSize: 9, fontWeight: 400 }}>·{sizeCount}</span>
        {unrouted && <span style={{ color: selected ? '#FFFFFF' : 'var(--status-warn)', fontSize: 8.5 }}>⚠</span>}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleExpand();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="transition-colors"
        style={{ padding: '0 7px 0 4px', border: 'none', borderLeft: `1px solid ${selected ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.10)'}`, background: 'transparent', color: selected ? '#FFFFFF' : expanded ? 'var(--interactive)' : 'var(--text-muted)', fontSize: 8, cursor: 'pointer' }}
        title={expanded ? 'Hide sizes' : 'Fine-tune per size'}
        aria-expanded={expanded}
      >
        {expanded ? '▾' : '▸'}
      </button>
    </span>
  );
}

function SizeChip({ label, selected, onClick, onPointerDown }: { label: string; selected: boolean; onClick: () => void; onPointerDown: (e: React.PointerEvent) => void }) {
  return (
    <button
      type="button"
      data-vm-chip={label}
      onClick={onClick}
      onPointerDown={onPointerDown}
      className="transition-colors"
      style={{
        padding: '2px 8px',
        borderRadius: 'var(--radius-pill)',
        border: `1px solid ${selected ? 'var(--interactive)' : 'var(--border)'}`,
        background: selected ? 'var(--interactive)' : 'var(--tint-soft)',
        color: selected ? '#FFFFFF' : 'var(--text-primary)',
        fontSize: 10,
        fontFamily: 'var(--font-mono, ui-monospace)',
        cursor: 'grab',
        touchAction: 'none',
      }}
    >
      {label}
    </button>
  );
}

function ServerBlock({
  server,
  K,
  active,
  hover,
  selTier,
  groupsAt,
  onAssign,
  onRemove,
  onChipDrag,
}: {
  server: Server;
  K: number;
  active: boolean;
  hover: { hwId: string; tier: Tier } | null;
  selTier: { kind: 'none' | 'tier' | 'block' | 'mixed'; tier?: number } | null;
  groupsAt: (tier: Tier) => LaneGroup[];
  onAssign: (tier: Tier) => void;
  onRemove: (group: LaneGroup) => void;
  onChipDrag: (group: LaneGroup, e: React.PointerEvent) => void;
}) {
  const tiers: Tier[] = [0];
  for (let t = 1; t <= K; t++) tiers.push(t);
  tiers.push('block');

  let maxUsedSpill = 0;
  for (let t = 1; t <= K; t++) if (groupsAt(t).length > 0) maxUsedSpill = t;
  const hasBlocked = groupsAt('block').length > 0;

  const isSelTier = (t: Tier) =>
    !!selTier && ((t === 'block' && selTier.kind === 'block') || (typeof t === 'number' && selTier.kind === 'tier' && selTier.tier === t));

  return (
    <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding: '12px 13px', display: 'flex', flexDirection: 'column', gap: 7 }}>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="font-mono font-semibold" style={{ fontSize: 12.5, color: 'var(--text-primary)' }}>
          {server.name}
        </span>
        <span className="text-[9.5px] font-mono" style={{ color: 'var(--text-muted)' }}>
          {formatMem(server.maxNodeMemGib)}/node
        </span>
      </div>

      {tiers.map((t) => {
        const groups = groupsAt(t);
        if (!active) {
          if (t === 'block') {
            if (!hasBlocked) return null;
          } else if (t !== 0 && t > maxUsedSpill) {
            return null;
          }
        }
        return (
          <TierRow
            key={t === 'block' ? 'block' : t}
            hwId={server.id}
            tier={t}
            active={active}
            hover={hover?.hwId === server.id && hover.tier === t}
            current={isSelTier(t)}
            groups={groups}
            onAssign={() => onAssign(t)}
            onRemove={onRemove}
            onChipDrag={onChipDrag}
          />
        );
      })}
    </section>
  );
}

function TierRow({
  hwId,
  tier,
  active,
  hover,
  current,
  groups,
  onAssign,
  onRemove,
  onChipDrag,
}: {
  hwId: string;
  tier: Tier;
  active: boolean;
  hover: boolean;
  current: boolean;
  groups: LaneGroup[];
  onAssign: () => void;
  onRemove: (group: LaneGroup) => void;
  onChipDrag: (group: LaneGroup, e: React.PointerEvent) => void;
}) {
  const isHome = tier === 0;
  const isBlock = tier === 'block';
  const accent = isHome ? 'var(--interactive)' : isBlock ? 'var(--status-bad)' : 'var(--text-muted)';
  const empty = groups.length === 0;
  return (
    <div
      data-drop-hw={hwId}
      data-drop-tier={isBlock ? 'block' : String(tier)}
      onClick={active ? onAssign : undefined}
      role={active ? 'button' : undefined}
      title={active ? `Set the selection to ${tierLabel(tier)} on this server` : undefined}
      style={{
        borderRadius: 'var(--radius-md)',
        border: `1px ${active ? 'dashed' : 'solid'} ${hover ? accent : current ? accent : active ? 'var(--border-glow)' : 'var(--border)'}`,
        background: hover ? (isBlock ? 'rgba(239, 68, 68, 0.08)' : 'var(--interactive-muted)') : isHome ? 'rgba(129, 140, 248, 0.05)' : isBlock ? 'rgba(239, 68, 68, 0.03)' : 'var(--tint-soft)',
        padding: '5px 8px',
        cursor: active ? 'pointer' : 'default',
        minHeight: 30,
      }}
    >
      <div className="flex items-center gap-1.5" style={{ marginBottom: empty ? 0 : 5 }}>
        <span className="text-[9.5px] font-semibold" style={{ color: accent, minWidth: 52 }}>
          {tierLabel(tier)}
        </span>
        {current && <span className="text-[8.5px]" style={{ color: accent }}>● selection here</span>}
        {active && (
          <span className="ml-auto text-[9px]" style={{ color: 'var(--interactive)' }}>
            + drop / click
          </span>
        )}
      </div>
      {!empty && (
        <div className="flex flex-wrap" style={{ gap: 4 }}>
          {groups.map((g) => (
            <AssignedChip
              key={g.family}
              label={g.family}
              tone={isHome ? 'home' : isBlock ? 'block' : 'spill'}
              onRemove={() => onRemove(g)}
              onPointerDown={(e) => onChipDrag(g, e)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AssignedChip({
  label,
  tone,
  onRemove,
  onPointerDown,
}: {
  label: string;
  tone: 'home' | 'spill' | 'block';
  onRemove: () => void;
  onPointerDown: (e: React.PointerEvent) => void;
}) {
  const color = tone === 'home' ? 'var(--interactive)' : tone === 'block' ? 'var(--status-bad)' : 'var(--text-secondary)';
  const border = tone === 'home' ? 'var(--border-glow)' : tone === 'block' ? 'rgba(239,68,68,0.4)' : 'var(--border)';
  return (
    <span
      className="inline-flex items-center"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={onPointerDown}
      style={{ borderRadius: 'var(--radius-pill)', border: `1px solid ${border}`, background: tone === 'home' ? 'var(--interactive-muted)' : 'var(--bg)', color, fontSize: 10, fontFamily: 'ui-monospace', overflow: 'hidden', cursor: 'grab', touchAction: 'none' }}
      title={`${label} — drag to another tier (Home / Spill / Never) or another server`}
    >
      <span style={{ padding: '2px 2px 2px 8px', fontWeight: 600 }}>{label}</span>
      <button
        type="button"
        onClick={onRemove}
        onPointerDown={(e) => e.stopPropagation()}
        className="transition-colors"
        style={{ border: 'none', background: 'transparent', color: 'inherit', padding: '2px 7px 2px 3px', fontSize: 9, cursor: 'pointer', opacity: 0.55 }}
        title={`Remove ${label} from this server`}
      >
        ✕
      </button>
    </span>
  );
}

function capacity(g: HardwareGroup): { maxNodeMemGib: number; nodeVcpus: number } {
  let maxNodeMemGib = g.memoryGibPerNode ?? 0;
  if (g.rackComposition && g.rackComposition.length > 0) {
    maxNodeMemGib = Math.max(...g.rackComposition.map((s) => s.memoryGibPerNode));
  }
  const nodeVcpus = g.vcpusPerNode && g.vcpusPerNode > 0 ? g.vcpusPerNode : (g.socketsPerNode ?? 0) * (g.coresPerSocket ?? 0) * 2;
  return { maxNodeMemGib, nodeVcpus };
}

function formatMem(gib: number): string {
  if (gib >= 1024) {
    const tib = gib / 1024;
    return `${Number.isInteger(tib) ? tib : tib.toFixed(tib < 10 ? 2 : 1)} TiB`;
  }
  return `${Math.round(gib)} GiB`;
}
