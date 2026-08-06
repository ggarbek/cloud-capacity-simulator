# File structure (source map — verify against src/ before trusting)

## File structure

```
src/
├── App.tsx                        # Layout shell — header + sidebar + canvas + side panel
├── main.tsx
├── index.css                      # Tailwind + glass classes + ambient gradients + .section-h
├── styles/tokens.css              # CSS custom properties — dark defaults + [data-theme="light"] overrides
│
├── engine/
│   ├── simulator.ts               # runSimulation(input): SimulatorResult — the heart
│   └── simulator.test.ts          # 25 acceptance tests
│
├── types/index.ts                 # All shared types (FleetSpec, BomEntry, CatalogEntry, SimulatorResult, etc.)
│
├── data/
│   # vmCatalog.json deleted in v2.1 — VMs now uploaded via VM tab
│   ├── hardwareGroups.json        # 11 groups, simplified names (Gen-A MM-Std etc.)
│   ├── cpuLibrary.json            # 7 processors (PRD §5)
│   └── memoryCategories.json      # MM/HM/VHM definitions with green color tokens
│
├── state/
│   ├── AppState.ts                # Reducer + actions + initial state + demoPreset
│   ├── AppContext.tsx             # Provider — also syncs theme to document
│   └── storage.ts                 # localStorage versioned wrappers (keys all "vmcap:")
│
└── components/
    ├── AppHeader.tsx              # Logo + bold title + nav + light/dark switch
    ├── Sidebar.tsx                # Tabs strip
    ├── ConfigureTab.tsx           # BOM / FleetForm / BufferInput / RunFooter (with dividers)
    ├── HardwareTab.tsx            # Read-only listings
    ├── BomSection.tsx             # Add-section flow, Mv-grouped rows, per-category totals
    ├── VmAutocomplete.tsx         # Thin wrapper over GlassDropdown for VM picking
    ├── FleetForm.tsx              # Custom toggle, HT toggle inside box, optional processor
    ├── BufferInput.tsx            # Flat % slider OR Fixed Node Count input
    ├── RunFooter.tsx              # RUN SIMULATION button + Packing/Fungibility toggles
    ├── SummaryBar.tsx             # The interactive Stats cards (NOT just a passive summary)
    ├── StatDetailPanel.tsx        # Right-pane content when a stat is selected
    ├── NodeDetailPanel.tsx        # Right-pane content when nodes are selected
    ├── RackMap.tsx                # Rack grid + glassy NodeTile
    ├── GlassDropdown.tsx          # Inline popover dropdown (NOT absolute — pushes content)
    ├── GlassToggle.tsx            # Reusable Apple-style switch (single size)
    ├── ProgressBar.tsx            # Reusable bar with line + end-of-fill dot (used 3+ places)
    └── ResizeHandle.tsx           # Sidebar drag handle
```

**Important:** node selection and stat selection are mutually exclusive — `NODE_TOGGLE` and `NODE_SELECT` clear `selectedStat`; `STAT_SELECT` clears `selectedNodeIds`.

---

