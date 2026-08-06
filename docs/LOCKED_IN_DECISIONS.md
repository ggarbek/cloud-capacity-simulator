# Locked-in design decisions (engine spec-of-record)

> Canonical UI rule routing now lives in the project docs (the master index).
> This file preserves the full locked-in ledger text. Treat every entry as final unless the user overrides.

## UI preservation across versions — **read first**

The Phase-1 UI is the cumulative output of many sessions and explicit user decisions. **It must carry forward unchanged across every future phase unless the user explicitly approves a change.** This is non-negotiable:

- Treat every entry in §"Locked-in design decisions" below as load-bearing. If a refactor would alter visuals or interactions, surface that to the user *before* implementing.
- Mechanical refactors (renames, state-shape changes, new-phase plumbing) must leave the rendered output identical. v2.0's `state.fleet` → `state.fleets` migration is the template: structural change underneath, zero pixel-level diff above.
- When *new* visuals or interactions get locked in during a session, add them to §"Locked-in design decisions" so they survive the next refactor. That section is the canonical UI ledger.
- New phases (multi-silo, financial layer, Cloud Intel, BOM import, etc.) **add** UI; they never replace Phase-1 UI.
- If a UI change ships unlogged, a later refactor will probably undo it. Log promptly.

### Every UI critique = log + fix, never just fix

When the user gives any UI feedback (spacing, color, alignment, microcopy, hierarchy, interaction), the fix is only half the work:

1. Fix the issue in the component.
2. Verify in browser preview.
3. **Add the rule** (generalized, not the one-off) to §"Locked-in design decisions" as a tight bullet.
4. **Write/update an auto-memory file** (`feedback_ui_*.md`) with the long-form rationale and "How to apply" guidance.

Silent fixes are a regression vector. Both the in-repo doc and auto-memory must capture the learning.

---

## Locked-in design decisions

Treat these as final unless the user explicitly asks to change them. Do NOT revisit these during refactor work.

> **v3 visual supersession:** the *visual* locks below — neon-green accent, glass-everywhere, section-pill eyebrow, bounce easing — are **superseded by the v3 indigo "executive premium" substrate**. The **structural / spacing / behavioral** locks below still hold in full. When a visual rule here conflicts with v3, v3 wins.

### Visual language
- **Apple Liquid Glass × Blade Runner.** Dark green-on-black or light-on-white. SF system font.
- All surfaces use `.glass` or `.glass-strong` classes — never inline `rgba(0,0,0,X)` for panels.
- All corners rounded — `--radius-md` (14px), `--radius-lg` (18px), `--radius-pill` (999px). No square corners.
- Theme is reactive — read `state.ui.theme` from `useApp()`, never `document.documentElement.getAttribute('data-theme')` in components (that doesn't trigger re-render).
- **Section headers are glassy green pills — EVERYWHERE.** `.section-h` in [index.css](src/index.css) renders an 11px uppercase 0.15em-tracked label with `var(--interactive)` text on a `rgba(74, 222, 128, 0.10)` background, `border-glow` outline, soft glow shadow, and backdrop blur. Applied uniformly across `BILL OF MATERIALS`, `FLEET COMPOSITION`, `BUFFER / OVERHEAD`, `CLUSTER VISUALIZATION`, Hardware/VM tab section headings (v2.10), and dropdown grouping section headers (v2.16.1 `DropdownOption.section?` field). The Mv-generation sub-headers in BomSection are the visual reference. **Do not introduce a second "section header" style.** No bright/blocky/saturated variants — see the project docs.

### Spacing & padding
- **Interior padding ≥ corner radius — always.** `--radius-lg` (18px) → use `p-5` (20px) minimum on the panel. `--radius-md` (14px) → `p-4` (16px) minimum. Content must never visually crowd the curve.
- **Inter-row spacing on stacked controls inside a panel:** `space-y-4` (16px). `space-y-3` reads cramped at the standard padding scale.
- **Pill controls** (chips, inputs, readouts) use `px-3` minimum horizontally even though vertical padding is tight.
- **Section header → first control:** at least 12px gap (handled by `section-h` margin; verify when adding new sections).
- **Don't trade padding for density.** If a panel feels too tall, collapse rows or split sections — never tighten edge padding.

### Color rules
- Memory categories use a **single green family** with distinct lightness steps: MM `#BBF7D0`, HM `#22C55E`, VHM `#14532D`.
- Node states are **multi-color** and functional: empty=green, partial=blue, full=red, overhead=grey, isolated=violet.
- Selected-node glow uses the **node's own color** (not cyan).
- All accent/CTA = green (`--interactive` = `#4ADE80` dark / `#15803D` light).

### BOM behavior
- Sections (MM/HM/VHM) are added explicitly via `+ MM` / `+ HM` / `+ VHM` pills, not auto-created.
- Rows within a section are grouped by Mv1/Mv2/Mv3 sub-headers (only the gens valid for that category).
- Cores label is **"vCPU"**, never "c" or "cores".
- Per-category totals only — no grand-total footer.
- Quantity input allows backspace to empty, commits min=1 on blur.

### Fleet form
- Toggle label = "Custom Hardware Group". ON = custom (no preset HW group dropdown). OFF = preset.
- Hyperthreading toggle lives **inside** the main fleet glass box, just below the Custom toggle. Not at the bottom.
- No "Isolated" checkbox — auto-derived from `memoryCategory === 'vhm'`.
- "No processor" choice in custom mode **clears** racks / nodes-per-rack / sockets / cores / mem / throughput.

### Clusters (multi-cluster — shipped in v1.4)

- **"Cluster" is the user-facing term** for a group of nodes + racks. Internally we call them `fleets` (keyed map `state.fleets: Record<string, FleetSpec>`) or "silos" (engine routing) — in UI text always say "cluster".
- **Every cluster MUST be visually wrapped in a bordered glass box** in the rack visualization, with a banner showing the hardware-group name + node count. Single-cluster Phase 1 also gets the box.
- **Multi-cluster pack:** **horizontally first** (`flex flex-wrap`), 24 px gap, wrap to next row when out of pane width.  One zoom level applies uniformly.
- **Sidebar Hardware Group section mirrors the BOM collapsible-section pattern.** A top-level `FLEET HARDWARE` section heading (green glassy pill). Each cluster is a collapsible glass card with a green left-bordered header showing `▾ CLUSTER N · {hardwareGroupName} · {total} nodes` + ✕ remove (only when more than one cluster). Card body contains the FleetForm controls (toggles, dropdowns, num fields, readouts) all scoped to that fleet via the `fleetId` dispatch parameter.
- **`+ Add Cluster` pill** sits at the BOTTOM of the cluster list — green-bordered ghost button, mirrors BomSection's `+ MM` / `+ HM` / `+ VHM` placement. NOT in the section header.
- **Multi-cluster engine routing (`runMulti` in `RunFooter.tsx`):** for each cluster in `fleetList` order, claim BOM rows whose VM `homeHardwareGroup` matches the cluster's hardware-group (normalized via `normalizeGroupName`: "Gen-A MM-Std" ↔ "Gen-A MM" family) — first cluster wins. Each cluster runs the existing single-fleet `runSimulation` on its claimed BOM; results merged via summed counts + concatenated `nodeDetail`. Every node gets a `clusterId` tag and its `nodeId` is namespaced as `f-N:R1N3` to keep selections / stat highlights unique across clusters. Unclaimed BOM rows surface as `NO_ELIGIBLE_NODES` unplaceables. Spillover and same-HW-group load-balancing are not yet modeled.

### Right-side detail panel
- **User-resizable.** `state.ui.sidePanelWidth` (default 340, clamped 280–720, persisted in localStorage). Replace the fixed `w-[340px]` with `style={{ width }}`. A horizontal `ResizeHandle` lives on the **left edge** of the panel.

### Rack map
- Tiles show **VM count centered**, with "0" for empty (not blank).
- Row labels `N1, N2, ...` on the left; column labels `R1, R2, ...` on top. No position numbers inside tiles.
- Glassy translucent fills; alpha bumps higher in light mode (`AA/77` vs `55/33`).
- Selected node = scale 1.06 + glow ring in node color + no corner dot.
- Hover-only feedback (CSS `:hover`) — no floating tooltip, no bottom dock. The user **explicitly** removed hover preview features.
- **Zoom control is mandatory** and expressed in **percentages**. The rack banner includes a `−  [pct%]  +` glass-pill cluster (right-aligned, `ml-auto`). Stored as `state.ui.rackTilePct`, default **100%**, clamped **100–200%** in **5% steps** (`RACK_TILE_PCT_MIN/MAX/STEP` exported from `AppState.ts`). 100% = 32 px tile (`RACK_TILE_BASE_PX`); use `rackTilePxFromPct(pct)` to compute the rendered tile px. Persists via localStorage. One zoom level applies uniformly across all clusters (no per-cluster zoom).
- **VM-count font scales with tile:** `fontSize = Math.round(tilePx * 0.24)`.
- **Vertical scroll is mandatory.** When tile size or fleet size makes content exceed the viewport, the rack pane scrolls — never silently clips. See "Layout & scroll" below.
- **Cluster boxes pack horizontally first.** The cluster stack uses `flex flex-wrap` with 24 px gap — boxes sit side-by-side until they overflow pane width, then wrap to a new row. (An earlier revision specified vertical stacking; refined to horizontal-first packing.)
- **Cluster box is tight-fit but padded.** `width: fit-content` with `maxWidth: 100%` so the box wraps exactly its rack grid. Interior padding `20px 24px` (inline, not Tailwind — `px-5` doesn't generate here) so the leftmost/rightmost tiles never touch the box edge. Rack grid centered inside the box (`justify-content: center`).
- **`Cluster Visualization · N CLUSTERS`** section heading appears above the cluster stack. Use the global `.section-h` style (green glassy pill).

### Layout & scroll
- **Every scrollable region must actually scroll under overflow.** Test by forcing overflow (max tile size, many nodes selected, long BOM) and confirming `scrollHeight > clientHeight` on the scroller.
- **Many Tailwind sizing utilities are NOT generated in this project's built CSS.** Verified missing: `h-2`, `h-4`, `h-6`, `h-8`, `h-10`, `h-12`, `w-2`, `w-4`, `w-6`, `w-12`, `min-h-0`. Verified present: `h-2.5`, `h-3`, `h-3.5`, `h-5`, `h-7`, `h-full`, `w-8`, `w-10`, `w-16`, `min-w-0`. Suspected symlink/JIT-scanning issue. Symptoms: bar fills 0-px tall, columns misaligned, indicator dots invisible, flex containers ballooning past viewport. **Use inline `style={{ height: N, width: N, minHeight: 0 }}` for any sizing that must render reliably** — do not rely on Tailwind `h-N`/`w-N`/`min-*` classes here. If you must use a Tailwind class, verify it's in the built CSS first.
- Current load-bearing inline-styled layers: `App.tsx` main row + canvas column + rack-row; `RackMap` outer; `NodeDetailPanel` body; `StatDetailPanel` body. Do not strip these styles.
- Heavy aggregate displays (e.g. NodeDetailPanel's multi-select Aggregate) belong **inside the scroll body**, not in the sticky header — keeping the header thin so the body can scroll all content.

### Stats section
- Card section header is **"Stats"** (PRD calls it "Summary Bar" — we renamed at user request).
- Each card is clickable. Selecting:
  - Dims non-matching nodes on the rack map
  - Opens `StatDetailPanel` on the right with progress bars + hypothetical fits + key-values
- Includes a **Stranded vCPU** card (in addition to PRD's Stranded Memory).
- **Every stat panel that shows a quantity must render a `ProgressBar` with an explicit basis of comparison in the label.** No bare numeric readouts for capacity-style metrics.
  - "Available"/"headroom" framings: bar fills toward green; `used = available`, `total = fleet-wide basis` (not the empty-pool subtotal — that yields nonsense like "0 / 73,728 · 0.0%").
  - "Stranded"/"blocked" framings: bar uses `binding={true}` (red) with `used = stranded`, `total = occupied capacity`.
  - The basis must be stated on screen (e.g. `Memory available · vs fleet total`), not hidden in code.

### Progress bars (dashboard-wide primitive)
- The `ProgressBar` component (`src/components/ProgressBar.tsx`) is the **default visual for any quantity** in the dashboard — Stats panels, Node Detail, multi-select aggregate, anything else. No substitutes.
- Theming: green for "good" / consumption-as-progress; red via `binding={true}` for binding/stranded states.
- Always include the on-screen `used / total unit · pct%` text — never just the bar.
- **Hover-preview is built in.** Pass `preview={{ used, pct }}` and the bar:
  - Flips its readout to `base → preview / total · preview%`.
  - Renders a hatched ghost segment between baseline and preview (green hatch when decreasing = recovery; same-family hatch when increasing = consumption).
  - Slides the end-of-fill dot to the preview position.
- **Bar labels must be plain-English noun phrases** that name WHAT is measured WHERE. Canonical labels (user explicitly chose these):
  - ✅ `Mem Avail on Occupied Nodes` — for Stranded Memory, Nodes Used, Memory Util (any occupied-node memory bar)
  - ✅ `vCPU Avail on Occupied Nodes` — same for vCPU bars on occupied-node panels
  - ✅ `Memory available · vs fleet total` — Empty Nodes panel (different scope, keep this phrasing)
  - ❌ "Stranded vs occupied capacity" / "Stranded memory on occupied nodes" / "Memory consumed" (user explicitly rejected — replaced with `Avail on Occupied Nodes` phrasing)
  - **Card titles stay the same** ("Stranded Memory", "Nodes Used", "Memory Util") — only bar labels change.
- **Any list of VM sizes that implies "what if I added this?" must drive hover preview** on the relevant bar(s) — StatDetailPanel's backfill rows (emptyNodes / strandedMem / strandedVcpu) and NodeDetailPanel's "What Else Fits" rows. Decreasing previews on stranded bars; increasing previews on consumption bars.

### Node detail
- Bottleneck label is a **single word** (`VCPU`, `MEMORY`, `THROUGHPUT`, or `None`). No "vCPU exhausted first" subtitle — that was deemed redundant.
- Three resource bars (Mem / vCPU / Throughput) with line + dot, 28px vertical spacing.
- "What Else Fits" rows are hoverable — Resources bars show ghost segment + dot moves to projected position.
- Multi-select shows aggregate progress bars at top + scrollable per-node cards below.

### Dropdowns
- `GlassDropdown` is **inline** (not absolute-positioned). Opens directly below trigger, pushes content down, sidebar scroll handles overflow. Visible rows = 5, internal scroll for rest.
- Group headers in dropdown are bold uppercase green with a horizontal accent line.

### Toggles
- One size for all `GlassToggle` instances. `sm` and `md` are aliased to the same dimensions. Don't introduce new sizes.

### Persistence
- All localStorage keys prefixed `vmcap:`. Schema versioned via `{v: N, data: ...}`. Invalid/old data is silently discarded.

### Multi-page shell + top-level nav (v2.8+)
- **Three pages**: Simulator / Competitive Offering / Capacity Planning. Activated via the hamburger menu in `AppHeader`. `UiState.activePage` persisted.
- **Hamburger menu z-index = 1000** with **opaque** `var(--bg)` background. NOT translucent `--glass-strong`. Drop shadow + glow border for floating feel without transparency. 
- **Page label appears in app subtitle** (v2.8). Subtitle string no longer mentions "M-Series".

### Insights pane (v2.11+ — replaces Detail · Finance)
- Right pane is **one scrolling Insights surface**, not tabbed. Sticky top KPI strip (Revenue today / Revenue at cap / Efficiency / Stranding $/mo). Below: collapsible sections.
- **Selection-driven scope** via `UiState.scope: ScopeSelection | null`. Region / Zone / Cluster banners in RackMap are clickable to dispatch scope. Mutually exclusive with node + stat selection.
- **Insights sections collapse state** persisted via `UiState.insightsSectionsOpen: Record<string, boolean>`.

### Public-data seed pattern (v2.11+)
- `src/data/*Seed.ts` files auto-merge into their state slice on first init when empty (`shouldSeed*` + `seed*` helpers).
- User uploads/deletes ALWAYS override the seed — delete a seeded row, it stays gone.
- Every seeded surface MUST carry a `SeedDisclaimerBanner` showing "as of {SEED_DATA_AS_OF}" + source links.
- New seed = new doctrine-allowed-public-data check. If it's vendor-public docs/API content, seeding is OK. If it's internal/contract/customer data, NEVER seed.

### Competitive Offering page (v2.12+)
- Cascading filter order (locked v2.16): **Provider → VM Family → VM Size → Region** (Region LAST).
- **Per-provider region + VM picks**: `Record<provider, string | null>`. One pick per cloud, never multi-region-mash.
- **Auto-prefill twins / equivalents**: picking one auto-fills the other clouds' empty slots; never overwrites manual picks.
- **Equivalency-availability dots**: every VM in every dropdown shows tiny brand-color dots for OTHER clouds that publish an analog.
- **Page section order** (locked v2.16): KPI hero → Map → Equivalents (bar grid + full specs) → Pricing (time-horizon + rate detail) → Region matrix → Recommendation → Spec deltas. Visualization-first.
- **Recommendation framing**: NO single "Top pick". Per-contender `★ Best at X` situational tags only for dims actually won + 1-sentence "why pick this" plain-language summary.
- **Map**: react-simple-maps + world-atlas TopoJSON (`src/data/world-countries-110m.json`). Per-super-geo Mercator. Max width 720px, centered with 48px padded flex container so users can scroll past without panning. Hover label + click pin + Cmd/Ctrl-click multi-pin.

### Engine — Network as 3rd packing constraint (v2.9+)
- `BindingConstraint = MEMORY | VCPU | NETWORK | NONE`. Network is FIRST-CLASS, not "throughput metadata".
- `BlockingReason` includes `NETWORK` (cluster full) + `VM_OVERSIZED_NETWORK` (no cluster can host).
- Pre-flight rejects oversized-network VMs. `canFit()` does real sum check (memory + vCPU + network). `placeOn()` subtracts. `diagnoseBlocked()` NETWORK case.
- Back-compat: VMs/HW without network values simulate exactly like pre-v2.9 (constraint skipped). All 53 original tests pass unchanged.

### Removed UI surfaces (v2.10)
- `SummaryBar` standalone strip — stats now render INSIDE the Visualization pane.
- `Packing` + `Fungibility` toggles below Run Simulation. SMART always; fungibility-on always. Toggle removal makes the dashboard simpler without engine impact.
- Detail / Finance tabs in the right pane — replaced by Insights.

### Dropdown grouping (v2.16)
- `DropdownOption.section?` (parent, glassy `.section-h` pill) + `DropdownOption.group?` (child, subtle muted sub-heading). Two-level hierarchy for MM/HM/VHM × Mv1/Mv2/Mv3 in Azure M-Series.
- `DropdownOption.prefix?` for inline decorations (equivalency-availability dots).

---

