# Design

> ✅ **SHIPPED: most of the RETIRE/RETAIN plan below is now live.**
> The v3 "executive premium" re-skin landed app-wide (not just Simple). The
> "Shipped v3 — current reality" section immediately below is the source of
> truth for what the app looks like TODAY. The detailed tables further down
> were the *intake snapshot of the inherited `advanced-v1` state + the plan*;
> they are kept as design history, and their **RETIRE** items have largely
> been executed.

---

## Shipped v3 — current reality

| Dimension | Shipped value |
|---|---|
| **Brand accent** | Indigo — `--interactive` `#818CF8` (dark) / `#4F46E5` (light). 167 brand-green literals swept. |
| **Green** | Semantic status only (`--status-good`, `--node-deployable`, `--cat-hm`). Brand ≠ status now. |
| **Surfaces** | Flat. `.glass` / `.glass-strong` + pane shells + AppHeader lost `backdrop-filter`. Neutral border + `--shadow-card`. |
| **Section headers** | `.section-h` = sentence-case ink header + bottom hairline (was neon UPPERCASE glass pill). |
| **Typography** | ~200 eyebrow labels de-uppercased; `.chip` de-shouted; "Run simulation" not "RUN SIMULATION". 0 `uppercase` utilities left. |
| **Motion** | `--ease-out` / `--ease-in-out` (bounce retired); `:active scale(0.97)`; hover gated `@media (hover:hover)`; global `prefers-reduced-motion`; selection 2px ring + 8px bloom. |
| **AI-tells** | Side-stripes, glow halos, gradient-text class, dead IBM Plex font — all removed. Impeccable detector 11 → 0 on post-run surfaces (6 residual `transition: width` data-viz, left). |
| **Type scale anchor** | `MetricCard` — hero/metric 40px 600 −0.025em → title 13px 600 → body 12–13px → caption 11px. |
| **Default theme** | Still dark default (light-primary is an open decision for the user's review). |
| **New primitives** | `MetricCard.tsx` (Distance-from-Ideal); **v2.20.0:** `AnswersPanel.tsx` (five-questions verdict strip + detail sections, incl. the interactive investment what-if + payback-vs-life rail) + `AnswersStrip.tsx` (compact, leads Advanced Insights). `SimpleApp.tsx` + `SimpleCalculatorPage.tsx` consume AnswersPanel. |
| **Default landing** | **Simple** (v2.20.0 — `defaultUi.appMode: 'simple'`; saved prefs win). The verdict strip is the first thing a fresh visitor reads after the demo click. |

**Still open (user's visual call):** light-primary canvas?
tune the exact indigo hue (one `--interactive` token edit)? the 6 residual
`transition: width` → `transform: scaleX` pass.

---

> Below: the original intake snapshot of the inherited `advanced-v1` state +
> the RETIRE/RETAIN plan. Kept as design history. **RETIRE** items above are
> shipped; read the table above for current reality.
>
> ⚠ **This section documents the INHERITED state, not the current one.**
> Sections marked **RETIRE** name patterns the re-skin dropped (now done);
> sections marked **RETAIN** name patterns that survived.

## Theme

**Current default:** dark (`--bg: #050507`, near-black). Light mode is
secondary, reached via header toggle, persists in localStorage.

**RETIRE for Simple:** Dark-first default. Simple ships light-primary
(matches "executive premium" register). Dark mode stays available via
toggle but is the secondary surface.

## Color tokens (from `src/styles/tokens.css`)

### Dark mode (default)

| Token | Value | Role |
|---|---|---|
| `--bg` | `#050507` | Page bg, near-black |
| `--bg-deep` | `#000000` | Outer canvas |
| `--surface` | `rgba(18, 22, 28, 0.28)` | Glass card translucency |
| `--glass` | `rgba(16, 20, 28, 0.20)` | Primary glass |
| `--glass-strong` | `rgba(8, 10, 14, 0.55)` | Modal / popover glass |
| `--border` | `rgba(255, 255, 255, 0.10)` | Default card edge |
| `--border-glow` | `rgba(74, 222, 128, 0.45)` | Green-tinted accent edge |
| `--interactive` | `#4ADE80` | Neon green CTA |
| `--interactive-hover` | `#22C55E` | CTA hover |
| `--interactive-pressed` | `#16A34A` | CTA active |
| `--cat-mm` | `#BBF7D0` | Memory category — small (mint) |
| `--cat-hm` | `#22C55E` | Memory category — mid (vibrant) |
| `--cat-vhm` | `#14532D` | Memory category — large (deep forest) |
| `--accent-cyan` | `#22D3EE` | Selection ring |
| `--accent-amber` | `#FBBF24` | Warnings, completeness alerts |
| `--accent-violet` | `#A78BFA` | VHM isolated nodes |
| `--text-primary` | `#F8FAFC` | Body text |
| `--text-muted` | `#94A3B8` | Secondary text |
| `--node-deployable` | `#22C55E` | Green node — empty |
| `--node-partial` | `#3B82F6` | Blue node — partial |
| `--node-full` | `#EF4444` | Red node — full |
| `--node-reserved` | `#6B7280` | Grey node — overhead |
| `--status-good` | `#22C55E` | Good signal |
| `--status-warn` | `#FBBF24` | Warning signal |
| `--status-bad` | `#EF4444` | Bad signal |

### Light mode overrides

| Token | Light value | Notes |
|---|---|---|
| `--bg` | `#FFFFFF` | Clean white page |
| `--bg-deep` | `#F1F5F9` | slate-100 outer canvas |
| `--surface` / `--glass` | `#F1F5F9` | slate-100 cards pop off white |
| `--border` | `rgba(15, 23, 42, 0.18)` | slate-900 @ 18% — visible edge |
| `--interactive` | `#15803D` | Darker green for AA contrast |
| `--text-primary` | `#0F172A` | slate-900 |
| `--text-muted` | `#334155` | slate-700 |

**Light-mode contrast was retrofitted in v2.19.46–.52** (canvas → white,
surfaces → slate-100/200, borders darkened). Held up against WCAG AA
spot-checks but the surface palette is utilitarian, not premium.

### Color rules

**RETAIN:**
- Semantic-only color (green = good, amber = warning, red = bad).
- Single accent family (no purple buttons, no orange highlights).
- Status colors never decorative.

**RETIRE for Simple:**
- Neon-saturation `#4ADE80` brand. Replace with a restrained brand hue
  (single OKLCH-defined primary; saturation ≤ 0.10 for surfaces,
  ≤ 0.18 for active states).
- Five-state multi-color node palette. Simple doesn't first-class the
  rack viz; node colors are an Advanced concern. Simple uses a single
  brand hue + tinted neutrals + the three status colors.
- The deep-forest VHM `#14532D` (4.21:1 against slate-100, borderline)
  and the mint MM `#BBF7D0` (fails 4.5:1 against white). Memory tier
  encoding will move to a typographic + position cue on Simple.

**FLAG (resolution required):**
- Seven distinct hues on one screen today (green + cyan + amber + 5
  node states). Restraint pass consolidates to ≤4 hues per screen.

## Typography

### Font families

- **Body:** Apple system font stack — `-apple-system, BlinkMacSystemFont,
  'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, ...`
- **Monospace:** SF Mono → ui-monospace → Menlo → Monaco → Consolas
- **Loaded but unused (`index.html`):** IBM Plex Sans + IBM Plex Mono
  via Google Fonts. Dead weight — referenced only in the deprecated
  `.chip` class. **RETIRE.**

### Scale

**RETIRE:** No explicit scale defined in tokens; sizes set inline at
usage. Scale-by-eyeball is anti-pattern for a premium register.

**Target scale (to land in S26 Distance-from-Ideal primitive):**

| Tier | Size | Weight | Line-height | Letter-spacing | Use |
|---|---|---|---|---|---|
| Hero metric | 56px | 600 | 1.0 | −0.03em | Distance-from-Ideal primary value |
| Metric | 40px | 600 | 1.05 | −0.025em | Profitability headlines |
| Display | 28px | 600 | 1.10 | −0.02em | Page titles |
| Title | 20px | 600 | 1.20 | −0.015em | Card headlines |
| Body | 15px | 400 | 1.5 | −0.005em | Default copy |
| Caption | 13px | 500 | 1.4 | 0 | Labels, gap callouts |
| Mono caption | 12px | 500 | 1.4 | 0 | Numeric labels |

Ratio between adjacent tiers ≥ 1.25 per impeccable.

### Letter-spacing

Current: body `-0.005em`, section pills `0.15em`, chips `0.05em`.

**RETAIN:** Negative tracking on body (per the video distillation rule).

**RETIRE:** `0.15em` tracked uppercase on section pills (see below).

## Layout

### Glass surfaces (`.glass`, `.glass-strong`)

```css
.glass {
  background: var(--glass);
  border: 1px solid var(--border);
  backdrop-filter: blur(40px) saturate(180%);
  border-radius: var(--radius-lg);  /* 18px */
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.10),
    0 8px 24px -16px rgba(0, 0, 0, 0.4);
}
```

**RETIRE for Simple.** Glassmorphism as default is on the impeccable
bans list and reads as 2024-saturation. Simple ships with a single
flat-card pattern: light slate fill, 1px slate-200 border, 14px radius,
no backdrop blur. `.glass-strong` survives only for true overlays
(modals, command menu).

### Section header pill (`.section-h`)

```css
.section-h {
  width: 100%;
  font-size: 11px; font-weight: 700;
  letter-spacing: 0.15em; text-transform: uppercase;
  color: var(--interactive);
  background: rgba(74, 222, 128, 0.10);
  border: 1px solid var(--border-glow);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  backdrop-filter: blur(20px) saturate(180%);
}
```

**RETIRE for Simple.** Tiny-uppercase tracked-eyebrow above every
section is on impeccable's bans list and currently lives on 12+
surfaces. Simple replaces with sentence-case h2 / h3 in the defined
type scale.

### Radii

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 10px | Small chips |
| `--radius-md` | 14px | Inputs, .section-h |
| `--radius-lg` | 18px | Cards, .glass |
| `--radius-xl` | 24px | Modal surfaces |
| `--radius-pill` | 999px | Buttons, inputs, badges |

**RETAIN.** "Everything rounded" carries forward.

### Spacing doctrine

- Interior padding ≥ corner radius (18px corner → 20px padding minimum).
- Inter-row spacing: `space-y-4` (16px) on stacked controls.
- Pill controls: min `px-3` horizontal.
- Section header → first control: ≥12px gap.

**RETAIN.** Spacing rhythm is sound; only the surface inside the
spacing changes.

## Motion

### Existing patterns

- Button transitions: `160ms cubic-bezier(0.4, 0, 0.2, 1)` (ease-out)
- Hover: `transform: scale(1.05)`, brightness/saturate filter, 120ms
- Selection ring: `0 0 0 2px` + `0 0 24px` glow, no transition
- `.ease-spring`: `cubic-bezier(0.34, 1.56, 0.64, 1)` for node-tile
  hover (slight overshoot)

**RETIRE:**
- `scale(1.05)` on hover everywhere. Overshoot spring on node tiles.
  Both read as "playful product" — restraint pass uses 1.02 lift +
  brightness only.
- Glow shadow on selection (`box-shadow: 0 0 24px ...`). Premium
  selection is a 2px solid outline + subtle surface lift, not a halo.

### Missing (acceptance criteria for S25+)

- **`@media (prefers-reduced-motion: reduce)` overrides** on every
  transition. Required by PRODUCT.md.
- **Staggered list reveals** for Distance-from-Ideal cards on Simple
  result page. 60ms cascade, ease-out-quart, opacity + 4px translate.
- **Skeleton state** for the Simple result page during initial
  template + engine run (~80–400ms today). Replaces blank canvas.

## Components inventory (from `src/components/`)

### Primitives (reusable)

- `GlassDropdown` — inline popover, searchable, two-level sectioning
- `GlassToggle` — Apple-style switch
- `NumberInput` — buffer-string semantics, validation on submit
- `ProgressBar` — line + end-of-fill dot, hover-preview built in
- `ResizeHandle` — left-edge handle for sidebar drag
- `ProviderPillRow` — Azure / AWS / GCP / Custom multi-select
- `AppHeader` — brand, page nav (hamburger), Save/Load menu, theme toggle
- `Sidebar` — workflow-numbered tab strip
- `RunFooter` — primary CTA + simulation orchestrator

### Surfaces (app-specific)

- **Tabs (Configure pane):** Hardware Library, Fleet Builder, VM
  Fungibility, VM BoM, VM Library
- **Visualization pane:** RackMap, FleetStatsBox, UnplaceableBreakdown,
  NodeDetailPanel, StatDetailPanel
- **Insights pane:** ProfitabilityCards, SellableCapacity section,
  Headroom Opportunity, Stranding, Defrag preview, Spillover routing
- **Pages (hamburger):** Simulator, Competitive Offering, Region
  Availability, Capacity Planning (stub)

### Composite patterns

- **Three-pane workspace** (Configure / Visualization / Insights). Each
  collapsible via header pill. Post-run state collapses Configure +
  Insights. **RETAIN for Advanced; not used on Simple.**
- **Library-style row cards.** BoM rows, HW Library entries, placed
  clusters — slim summary collapsed, full spec expanded.
  **RETAIN for Advanced.**

## Locked doctrines that bear on visuals

1. **Wrap-don't-truncate** — cards wrap and carry `title=` tooltips;
   inputs/buttons never wrap or shrink. **RETAIN.**
2. **Chip spacing** — pills min `px-2`, parent rows min `gap-x-3`.
   **RETAIN.**
3. **Bar labels are plain-English noun phrases** —
   `Mem Avail on Occupied Nodes`, not "Stranded vs occupied capacity."
   **RETAIN.**
4. **Visualization-first** post-run — canvas first, Insights opens on
   click. **RETAIN for Advanced; Simple lands on the 4-family card
   stack instead.**
5. **Header buttons never wrap** — `flex-shrink: 0` + `whitespace: nowrap`.
   **RETAIN.**
6. **Yellow-dot tab alerts** — 7px amber dot on sidebar + step badge
   flip. **RETAIN for Advanced; Simple has no per-tab alerts (no
   workflow tabs).**
7. **Three-layer completeness signal** — collapsed dot + per-field
   amber + sidebar bubble. **RETAIN for Advanced.**
8. **Summary cards, not spec sheets** — list rows show identity only;
   specs in expanded view. **RETAIN.**
9. **Distance from ideal** (the new primitive) — every metric surfaces
   current + target + gap. **Drives S26.**

## Open tensions (Option A — Re-skin)

Most of these were resolved **app-wide** in the S24 Pilot #1.x substrate
+ identity passes (commits `774d75c` → `4a10a6e`), applied to BOTH tracks
at once rather than Simple-first, because they were token/CSS-level and
propagate everywhere. Status updated 2026-06-09.

| # | Pattern | Status |
|---|---|---|
| 1 | Dark-first canvas | **OPEN** — still dark-default; light-primary is a later call (theme toggle works; ambient tint already neutralized both modes) |
| 2 | `.glass` as default | **DONE** — backdrop-blur retired on `.glass` / `.glass-strong` + pane shells; flat surfaces app-wide (Pilot #1.1) |
| 3 | `.section-h` eyebrow pill | **DONE** — neon-green uppercase tracked pill → clean ink sentence-case header with a bottom hairline (Pilot #1.2). Formal h2/h3 typed scale still pending S26 |
| 4 | Neon green CTA / brand | **DONE** — brand migrated green → indigo (`#818CF8` dark · `#4F46E5` light) across 167 sites; green reserved for semantic status only (Pilot #1.3) |
| 5 | Many hues per screen | **DONE** — brand (indigo) separated from semantic (green=good/amber=warn/red=bad); structural green/ambient/scrollbar neutralized |
| 6 | No defined type scale | **PARTIAL** — eyebrow labels de-uppercased + retracked app-wide (Pilot #1.4); the formal tiered scale (hero/metric/display/title/body/caption) still lands with the S26 Distance primitive |
| 7 | No reduced-motion fallbacks | **DONE** — global `@media (prefers-reduced-motion: reduce)` block (Pilot #1) |
| 8 | IBM Plex loaded but unused | **DONE** — web-font `<link>` removed from index.html (Pilot #1.7) |
| 9 | `scale(1.05)` hover + glow + bounce | **DONE** — hover 1.02 + gated behind hover/fine-pointer; `:active scale(0.97)` press feedback; bounce curves → ease-out; colored glow halos → neutral shadows / outlines (Pilot #1, #1.5, #1.6) |

**Net:** the inherited Blade-Runner-glass identity is retired. The app now
reads flat + indigo + sentence-case + neutral-canvas in both themes.
Remaining for the Simple-track build: light-primary decision (#1), the
formal typed scale (#6, with S26), and the net-new surfaces (4-family
summary, Distance-from-Ideal primitive). `advanced-v1` tag remains the
pre-revamp reference for diffing.
