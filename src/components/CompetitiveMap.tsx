/**
 * v2.14 (Phase H) — Cross-cloud region map, real-cartography edition.
 *
 * Replaces the hand-drawn SVG silhouettes with a proper world map
 * sourced from world-atlas (Natural Earth-derived TopoJSON, 110m
 * resolution). Renders via react-simple-maps + d3-geo.
 *
 * Each super-geo (AMER / EMEA / APAC) gets its own projection center
 * + scale so the continent of interest fills the viewport. Provider-
 * colored markers are placed at real metro lat/lon coordinates.
 */
import { useMemo, useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';
import worldGeo from '../data/world-countries-110m.json';
import {
  lookupRegion,
  SUPER_GEO_BOX,
  type RegionGeo,
  type SuperGeo,
} from '../data/regionCoordinates';
import { subGeoFor } from '../utils/subGeo';
import { regionGeo as resolveRegionGeo, superGeoFromLon } from '../data/regionGeo';
import type { VmProvider } from '../types';

export interface MapMark {
  provider: VmProvider;
  region: string;
  label?: string;
}

interface ProviderTone {
  fill: string;
  stroke: string;
  ring: string;
}

const PROVIDER_TONE: Record<VmProvider, ProviderTone> = {
  Azure:  { fill: '#60A5FA', stroke: '#1D4ED8', ring: 'rgba(96, 165, 250, 0.30)' },
  AWS:    { fill: '#FBBF24', stroke: '#B45309', ring: 'rgba(251, 191, 36, 0.30)' },
  GCP:    { fill: '#F87171', stroke: '#B91C1C', ring: 'rgba(248, 113, 113, 0.30)' },
  Custom: { fill: '#818CF8', stroke: '#4F46E5', ring: 'rgba(129, 140, 248, 0.30)' },
};

// ────────────────────────────────────────────────────────────────────────
// Per-super-geo projection config. center=[lon, lat], scale tuned to
// fill the viewport with the relevant continent + a little padding.
// ────────────────────────────────────────────────────────────────────────
const SUPER_GEO_PROJECTION: Record<
  SuperGeo,
  { center: [number, number]; scale: number }
> = {
  // Centered roughly over central N. America + Brazil so both N + S
  // America are comfortably visible.
  AMER: { center: [-90, 15], scale: 320 },
  // Centered over Mediterranean so Europe top + Africa middle + Middle
  // East are all in view.
  EMEA: { center: [20, 25], scale: 380 },
  // Centered over Indonesia so India left, Japan right, Australia
  // bottom are all in view.
  APAC: { center: [115, 5], scale: 320 },
};

// v2.28.x — Whole-world view. The Global tab is the default; the super-geo
// tabs are the zoom-in options. center=[lon, lat] tuned so all continents fit
// inside MAP_HEIGHT with a little vertical padding; scale 120 keeps Antarctica
// off-frame while showing every populated landmass.
const GLOBAL_PROJECTION: { center: [number, number]; scale: number } = {
  center: [10, 8],
  scale: 120,
};

/** The view the map is showing: a single super-geo (zoomed in) or the whole
 *  world. Default = GLOBAL. */
type MapView = SuperGeo | 'GLOBAL';

const MAP_HEIGHT = 440;
const MAP_WIDTH = 800;

// S53 — Fit-to-marks projection. The old per-super-geo center+scale were
// hardcoded (e.g. EMEA scale 380 @ lat 25), which clipped the tall geos —
// EMEA spans Cape Town (−34°) to the Nordics (~60°), so a fixed scale showed
// only ~−7°→50° and cut both ends off. Instead we compute the Mercator
// center+scale that frames the actual marks in view (with padding), so every
// AMER / EMEA / APAC region is always shown.
const MERC_Y = (lat: number) => {
  const c = Math.max(-85, Math.min(85, lat));
  return Math.log(Math.tan(Math.PI / 4 + (c * Math.PI) / 180 / 2));
};
function fitProjection(
  points: [number, number][],
  width: number,
  height: number,
  pad = 0.82,
  minScale = 95,
  maxScale = 650,
): { center: [number, number]; scale: number } | null {
  if (points.length === 0) return null;
  let lonMin = Infinity,
    lonMax = -Infinity,
    latMin = Infinity,
    latMax = -Infinity;
  for (const [lon, lat] of points) {
    if (lon < lonMin) lonMin = lon;
    if (lon > lonMax) lonMax = lon;
    if (lat < latMin) latMin = lat;
    if (lat > latMax) latMax = lat;
  }
  const centerLon = (lonMin + lonMax) / 2;
  const yMin = MERC_Y(latMin);
  const yMax = MERC_Y(latMax);
  const yMid = (yMin + yMax) / 2;
  const centerLat = (Math.atan(Math.sinh(yMid)) * 180) / Math.PI;
  // Floors keep a single/clustered mark from blowing the scale up to infinity.
  const lonSpanRad = Math.max(((lonMax - lonMin) * Math.PI) / 180, 0.18);
  const ySpan = Math.max(yMax - yMin, 0.18);
  const scale = Math.max(
    minScale,
    Math.min(maxScale, Math.min((width * pad) / lonSpanRad, (height * pad) / ySpan)),
  );
  return { center: [centerLon, centerLat], scale };
}

// ────────────────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────────────────
export function CompetitiveMap({
  marks,
  forcedSuperGeo,
}: {
  marks: MapMark[];
  forcedSuperGeo?: SuperGeo;
}) {
  const resolved = useMemo(() => {
    const out: { mark: MapMark; geo: RegionGeo; tone: ProviderTone }[] = [];
    for (const m of marks) {
      // Resolve via the RICH resolver (covers every catalog region), falling back
      // to the thin seed. Using the seed alone silently dropped the ~38 regions it
      // never covered, so the map + roster showed only ~27 of the ~65 real regions.
      const base = resolveRegionGeo(m.provider, m.region) ?? lookupRegion(m.provider, m.region);
      if (!base) continue;
      const geo: RegionGeo = {
        provider: m.provider as RegionGeo['provider'],
        region: m.region,
        city: base.city,
        country: base.country,
        lat: base.lat,
        lon: base.lon,
        superGeo: (base as { superGeo?: SuperGeo }).superGeo ?? superGeoFromLon(base.lon),
      };
      out.push({ mark: m, geo, tone: PROVIDER_TONE[m.provider] ?? PROVIDER_TONE.Custom });
    }
    return out;
  }, [marks]);

  const availableGeos: SuperGeo[] = useMemo(() => {
    const set = new Set<SuperGeo>();
    for (const r of resolved) set.add(r.geo.superGeo);
    return (['AMER', 'EMEA', 'APAC'] as SuperGeo[]).filter((g) => set.has(g));
  }, [resolved]);

  // v2.28.x — Default view = GLOBAL (the whole world). A passed `forcedSuperGeo`
  // still pins a single super-geo. Otherwise the user starts on Global and the
  // super-geo tabs zoom in.
  const defaultView: MapView | undefined = useMemo(() => {
    if (forcedSuperGeo) return forcedSuperGeo;
    if (resolved.length === 0) return undefined;
    return 'GLOBAL';
  }, [forcedSuperGeo, resolved.length]);

  const [selectedView, setSelectedView] = useState<MapView | undefined>(defaultView);

  // Provider visibility filter — the three Cloud legend indicators are
  // clickable, multi-select toggles. null = "all shown" (the default); a
  // non-null Set is the explicit shown subset. We always keep at least one
  // provider visible so the map never goes blank: clicking the last shown
  // one is a no-op.
  const providersPresent = useMemo<VmProvider[]>(() => {
    const order: VmProvider[] = ['Azure', 'AWS', 'GCP', 'Custom'];
    return order.filter((p) => marks.some((m) => m.provider === p));
  }, [marks]);
  const [shownProviders, setShownProviders] = useState<Set<VmProvider> | null>(null);
  // Resolve the effective shown set: null means every present provider.
  const effectiveShown = useMemo<Set<VmProvider>>(() => {
    if (!shownProviders) return new Set(providersPresent);
    // Intersect with what's actually present so a stale toggle can't blank it.
    const next = new Set([...shownProviders].filter((p) => providersPresent.includes(p)));
    return next.size > 0 ? next : new Set(providersPresent);
  }, [shownProviders, providersPresent]);
  const isProviderShown = (p: VmProvider) => effectiveShown.has(p);
  const toggleProvider = (p: VmProvider) => {
    setShownProviders((prev) => {
      const base = prev
        ? new Set([...prev].filter((q) => providersPresent.includes(q)))
        : new Set(providersPresent);
      const next = base.size > 0 ? new Set(base) : new Set(providersPresent);
      if (next.has(p)) {
        // Guard: never turn off the last visible provider.
        if (next.size <= 1) return prev;
        next.delete(p);
      } else {
        next.add(p);
      }
      return next;
    });
  };
  // A selected super-geo only stays valid while it has marks; GLOBAL is always
  // valid as long as there's any resolved mark.
  const activeView: MapView | undefined =
    selectedView === 'GLOBAL'
      ? (resolved.length > 0 ? 'GLOBAL' : undefined)
      : selectedView && availableGeos.includes(selectedView)
      ? selectedView
      : defaultView;

  if (!activeView) {
    return (
      <div
        className="glass text-[11px] text-text-muted italic"
        style={{ padding: 14, borderRadius: 'var(--radius-md)' }}
      >
        No region geo-data for the selected VMs. Add region columns to your
        VM Library uploads to populate the map.
      </div>
    );
  }

  const isGlobal = activeView === 'GLOBAL';
  // GLOBAL shows every resolved mark; a super-geo view filters to that geo.
  // Both views also honor the Cloud legend's shown-provider filter so hiding a
  // cloud drops its marks (and re-frames the fit, which derives from these).
  const marksInGeoRaw = (isGlobal
    ? resolved
    : resolved.filter((r) => r.geo.superGeo === activeView)
  ).filter((r) => effectiveShown.has(r.mark.provider));
  // v2.17 — Stagger dots that share the same lat/lon (e.g. Azure East US 2
  // + AWS us-east-1 + GCP us-east4 all at Virginia ~38°N). Group by coord
  // bucket and offset 2nd+ pins on a tiny radial pattern so each remains
  // hoverable + clickable.
  const marksInGeo = useMemo(() => {
    const buckets = new Map<string, typeof marksInGeoRaw>();
    for (const m of marksInGeoRaw) {
      // Coarse bucket key — 0.5° rounding catches "same metro" pins like
      // Virginia datacenters that publish slightly different exact coords.
      const k = `${Math.round(m.geo.lat * 2)}|${Math.round(m.geo.lon * 2)}`;
      const arr = buckets.get(k);
      if (arr) arr.push(m);
      else buckets.set(k, [m]);
    }
    const out: typeof marksInGeoRaw = [];
    for (const arr of buckets.values()) {
      if (arr.length === 1) {
        out.push(arr[0]);
        continue;
      }
      // Radial layout: 1.4° offset, evenly spaced around a circle.
      const R = 1.4;
      const n = arr.length;
      arr.forEach((entry, i) => {
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2; // start at top
        out.push({
          ...entry,
          geo: {
            ...entry.geo,
            lon: entry.geo.lon + Math.cos(angle) * R,
            lat: entry.geo.lat + Math.sin(angle) * R,
          },
        });
      });
    }
    return out;
  }, [marksInGeoRaw]);
  // S53 — Frame the projection to the marks actually in view (super-geo OR
  // global) so nothing is clipped. Falls back to the static configs only if the
  // fit can't be computed (no marks — already guarded above).
  const fitted = useMemo(
    () =>
      fitProjection(
        marksInGeo.map((m) => [m.geo.lon, m.geo.lat] as [number, number]),
        MAP_WIDTH,
        MAP_HEIGHT,
      ),
    [marksInGeo],
  );
  const projection =
    fitted ?? (isGlobal ? GLOBAL_PROJECTION : SUPER_GEO_PROJECTION[activeView]);

  // v2.15/16 — Hovered + pinned dot state. Hover sets transient label;
  // click pins persistently. v2.16: Cmd/Ctrl-click ADDS to a multi-pin
  // set instead of swapping. Plain click without modifier swaps to a
  // single pin. Clicking the SAME pin again removes it.
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [pinnedKeys, setPinnedKeys] = useState<Set<string>>(new Set());
  const keyFor = (m: { mark: MapMark }) => `${m.mark.provider}|${m.mark.region}`;
  const focusedKey = hoveredKey ?? (pinnedKeys.size > 0 ? Array.from(pinnedKeys)[0] : null);
  const focused = focusedKey
    ? marksInGeo.find((m) => keyFor(m) === focusedKey)
    : null;
  const pinnedMarks = marksInGeo.filter((m) => pinnedKeys.has(keyFor(m)));
  const togglePin = (k: string, additive: boolean) => {
    setPinnedKeys((prev) => {
      const next = new Set(prev);
      if (additive) {
        if (next.has(k)) next.delete(k);
        else next.add(k);
      } else {
        if (next.has(k) && next.size === 1) next.clear();
        else {
          next.clear();
          next.add(k);
        }
      }
      return next;
    });
  };

  return (
    <div
      className="glass overflow-hidden"
      style={{ borderRadius: 'var(--radius-md)' }}
    >
      {/* View selector — Global (whole world, default) before the per-super-geo
          zoom-in tabs. Hidden entirely when a single super-geo is forced. */}
      {!forcedSuperGeo && (
        <div
          className="flex items-center gap-2 px-3 py-2 flex-wrap"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <span className="text-[9px] tracking-[0.04em] text-text-muted">
            View
          </span>
          {/* Global tab — always present, counts every resolved mark. */}
          <button
            type="button"
            onClick={() => setSelectedView('GLOBAL')}
            className="text-[10px] tracking-[0.04em] transition-colors"
            style={{
              padding: '3px 10px',
              borderRadius: 'var(--radius-pill)',
              background: isGlobal
                ? 'rgba(129, 140, 248, 0.14)'
                : 'rgba(255,255,255,0.03)',
              color: isGlobal ? 'var(--interactive)' : 'var(--text-secondary)',
              border: `1px solid ${isGlobal ? 'var(--border-glow)' : 'rgba(255,255,255,0.10)'}`,
            }}
          >
            Global
            <span className="ml-1.5 text-text-muted normal-case tracking-normal">
              · {resolved.length}
            </span>
          </button>
          {availableGeos.map((g) => {
            const isActive = g === activeView;
            return (
              <button
                key={g}
                type="button"
                onClick={() => setSelectedView(g)}
                className="text-[10px] tracking-[0.04em] transition-colors"
                style={{
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-pill)',
                  background: isActive
                    ? 'rgba(129, 140, 248, 0.14)'
                    : 'rgba(255,255,255,0.03)',
                  color: isActive ? 'var(--interactive)' : 'var(--text-secondary)',
                  border: `1px solid ${isActive ? 'var(--border-glow)' : 'rgba(255,255,255,0.10)'}`,
                }}
              >
                {SUPER_GEO_BOX[g].label}
                <span className="ml-1.5 text-text-muted normal-case tracking-normal">
                  · {resolved.filter((r) => r.geo.superGeo === g).length}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Provider color key — the metro dots are coloured by cloud. Each
          indicator is a clickable, multi-select filter: toggling one off hides
          its marks from the map (and re-frames the fit). At least one provider
          stays visible, so clicking the last shown one is a no-op. */}
      <div
        className="flex items-center gap-3 px-3 py-1.5 flex-wrap"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <span className="text-[9px] tracking-[0.04em] text-text-muted">Cloud</span>
        {providersPresent.map((p) => {
          const tone = PROVIDER_TONE[p];
          const shown = isProviderShown(p);
          return (
            <button
              key={p}
              type="button"
              onClick={() => toggleProvider(p)}
              aria-pressed={shown}
              title={shown ? `Hide ${p} marks` : `Show ${p} marks`}
              className="flex items-center gap-1.5 text-[10px] transition-colors"
              style={{
                cursor: 'pointer',
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                background: shown ? 'rgba(255,255,255,0.05)' : 'transparent',
                border: `1px solid ${shown ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`,
                color: shown ? 'var(--text-secondary)' : 'var(--text-muted)',
                opacity: shown ? 1 : 0.5,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: shown ? tone.fill : 'transparent',
                  border: `1.5px solid ${tone.fill}`,
                  boxSizing: 'border-box',
                  display: 'inline-block',
                }}
              />
              {p}
            </button>
          );
        })}
      </div>

      {/* v2.16 (Phase J) — Map is narrower than the section card and
          centered, leaving padding on either side. The padding zone
          captures scroll/click events without dispatching them into the
          map's pan/zoom — so users can scroll past the map without
          accidentally yanking it around. */}
      <div
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(129, 140, 248, 0.04), transparent 70%), rgba(0, 0, 0, 0.20)',
          position: 'relative',
          padding: '0 48px',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: projection.scale,
            center: projection.center,
          }}
          width={MAP_WIDTH}
          height={MAP_HEIGHT}
          style={{
            width: '100%',
            maxWidth: 720,
            height: 'auto',
            display: 'block',
          }}
        >
          {/* react-simple-maps v3 dropped `disablePanning` (a v1/v2 prop the
              stale @types still declares); v3 spreads unknown props onto the
              <g>, emitting React's unknown-prop warning. Panning is enabled by
              default in v3, so omitting it keeps identical behavior. */}
          <ZoomableGroup zoom={1} maxZoom={4} minZoom={0.8}>
            <Geographies geography={worldGeo}>
              {({ geographies }) =>
                geographies.map((g) => (
                  <Geography
                    key={g.rsmKey}
                    geography={g}
                    fill="rgba(129, 140, 248, 0.04)"
                    stroke="rgba(129, 140, 248, 0.28)"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none' },
                      hover: {
                        outline: 'none',
                        fill: 'rgba(129, 140, 248, 0.08)',
                      },
                      pressed: { outline: 'none' },
                    }}
                  />
                ))
              }
            </Geographies>
            {marksInGeo.map((m) => {
              const k = keyFor(m);
              return (
                <ProviderMarker
                  key={k}
                  mark={m}
                  hovered={hoveredKey === k}
                  pinned={pinnedKeys.has(k)}
                  onHover={(on) => {
                    if (on) setHoveredKey(k);
                    else setHoveredKey((h) => (h === k ? null : h));
                  }}
                  onClick={(additive) => togglePin(k, additive)}
                />
              );
            })}
          </ZoomableGroup>
        </ComposableMap>
      </div>
      {pinnedMarks.length > 0 && (
        <div
          style={{
            borderTop: '1px solid var(--border)',
            background: 'rgba(129, 140, 248, 0.03)',
          }}
        >
          {pinnedMarks.length > 1 && (
            <div
              className="px-3 py-1.5 text-[9px] tracking-[0.04em] font-semibold flex items-center justify-between"
              style={{
                color: 'var(--interactive)',
                borderBottom: '1px solid rgba(129, 140, 248, 0.10)',
              }}
            >
              <span>★ {pinnedMarks.length} regions pinned · Cmd/Ctrl-click to add more</span>
              <button
                type="button"
                onClick={() => setPinnedKeys(new Set())}
                className="text-[9px] tracking-[0.04em] hover:text-[#FCA5A5] transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                Clear all
              </button>
            </div>
          )}
          {pinnedMarks.map((pin) => (
            <PinDetailCard
              key={keyFor(pin)}
              pinned={pin}
              onClear={() => togglePin(keyFor(pin), true)}
            />
          ))}
        </div>
      )}
      <Legend marks={marksInGeo} focusedKey={focused ? keyFor(focused) : null} />
    </div>
  );
}

function ProviderMarker({
  mark,
  hovered,
  pinned,
  onHover,
  onClick,
}: {
  mark: { mark: MapMark; geo: RegionGeo; tone: ProviderTone };
  hovered: boolean;
  pinned: boolean;
  onHover: (on: boolean) => void;
  /** Receives `additive` = true when Cmd/Ctrl was held (multi-pin); false for plain click. */
  onClick: (additive: boolean) => void;
}) {
  const { geo, tone } = mark;
  const title = `${mark.mark.provider} · ${geo.region} (${geo.city}, ${geo.country})`;
  const focused = hovered || pinned;
  return (
    <Marker
      coordinates={[geo.lon, geo.lat]}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={(e: React.MouseEvent) => onClick(e.metaKey || e.ctrlKey || e.shiftKey)}
      style={{
        default: { cursor: 'pointer' },
        hover: { cursor: 'pointer' },
        pressed: { cursor: 'pointer' },
      }}
    >
      <title>{title}</title>
      {/* Outer pulse rings — slightly larger when focused/pinned */}
      <circle r={focused ? 14 : 11} fill={tone.ring} opacity={focused ? 0.7 : 0.5} />
      <circle r={focused ? 9 : 7} fill={tone.ring} opacity={focused ? 0.95 : 0.8} />
      {/* Solid stroked dot */}
      <circle
        r={focused ? 5.5 : 4}
        fill={tone.fill}
        stroke={pinned ? '#FFFFFF' : tone.stroke}
        strokeWidth={pinned ? 2 : 1.5}
      />
      {/* Hover/pin label — region name floats just above the dot */}
      {focused && (
        <g>
          <rect
            x={-58}
            y={-30}
            width={116}
            height={18}
            rx={4}
            fill="rgba(8, 18, 14, 0.92)"
            stroke={tone.fill}
            strokeWidth={0.75}
          />
          <text
            x={0}
            y={-17}
            textAnchor="middle"
            fontSize={9}
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fill={tone.fill}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {mark.mark.provider} · {geo.region}
          </text>
        </g>
      )}
    </Marker>
  );
}

// ────────────────────────────────────────────────────────────────────────
// v2.15 — Pinned-dot detail card. Renders below the map when the user
// clicks a marker. Shows full region context + a clear-pin button.
// ────────────────────────────────────────────────────────────────────────
function PinDetailCard({
  pinned,
  onClear,
}: {
  pinned: { mark: MapMark; geo: RegionGeo; tone: ProviderTone };
  onClear: () => void;
}) {
  const { geo, tone, mark } = pinned;
  return (
    <div
      style={{
        borderTop: '1px solid var(--border)',
        padding: '12px 14px',
        background: 'rgba(129, 140, 248, 0.03)',
      }}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: tone.fill,
                border: `1.5px solid ${tone.stroke}`,
                display: 'inline-block',
              }}
            />
            <span
              className="text-[10px] tracking-[0.04em] font-semibold"
              style={{ color: tone.fill }}
            >
              ★ Pinned · {mark.provider}
            </span>
          </div>
          <div
            className="font-mono font-semibold mt-0.5"
            style={{ fontSize: 14, color: 'var(--text-primary)' }}
          >
            {geo.region}
          </div>
          <div className="text-[11px] text-text-secondary mt-1">
            {geo.city}, {geo.country}
          </div>
          <div className="text-[10px] text-text-muted mt-1 font-mono">
            {geo.lat.toFixed(2)}° {geo.lat >= 0 ? 'N' : 'S'} ·{' '}
            {Math.abs(geo.lon).toFixed(2)}° {geo.lon >= 0 ? 'E' : 'W'} ·{' '}
            {geo.superGeo}
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-[10px] tracking-[0.04em] transition-colors"
          style={{
            padding: '4px 10px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            background: 'rgba(255,255,255,0.04)',
          }}
          title="Unpin this region"
        >
          ✕ Unpin
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Roster — the region list below the map, cleanly organized by super-geo
// (AMER → EMEA → APAC). Each group gets a small uppercase header with a
// count, then a tidy multi-column grid of provider-dotted region entries.
// Entries are clustered by provider within a group so colors read as
// blocks, not a rainbow jumble. Replaces the old flat flex-wrap list.
// ────────────────────────────────────────────────────────────────────────
type RosterMark = { mark: MapMark; geo: RegionGeo; tone: ProviderTone };
const ROSTER_PROVIDERS: VmProvider[] = ['Azure', 'AWS', 'GCP'];

function Legend({
  marks,
  focusedKey,
}: {
  marks: RosterMark[];
  focusedKey?: string | null;
}) {
  // S53 — Each super-geo is collapsible (default open).
  const order: SuperGeo[] = ['AMER', 'EMEA', 'APAC'];
  const [openGeos, setOpenGeos] = useState<Set<SuperGeo>>(() => new Set(order));
  if (marks.length === 0) return null;

  const groups = order
    .map((g) => ({ geo: g, marks: marks.filter((m) => m.geo.superGeo === g) }))
    .filter((grp) => grp.marks.length > 0);
  const toggle = (g: SuperGeo) =>
    setOpenGeos((prev) => {
      const n = new Set(prev);
      if (n.has(g)) n.delete(g);
      else n.add(g);
      return n;
    });

  return (
    <div
      style={{
        borderTop: '1px solid var(--border)',
        padding: '10px 12px 12px',
      }}
    >
      {groups.map((grp, gi) => (
        <RosterGroup
          key={grp.geo}
          superGeo={grp.geo}
          marks={grp.marks}
          focusedKey={focusedKey}
          first={gi === 0}
          open={openGeos.has(grp.geo)}
          onToggle={() => toggle(grp.geo)}
        />
      ))}
    </div>
  );
}

function RosterGroup({
  superGeo,
  marks,
  focusedKey,
  first,
  open,
  onToggle,
}: {
  superGeo: SuperGeo;
  marks: RosterMark[];
  focusedKey?: string | null;
  first: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  // S53 — Within a super-geo, group by PROVIDER → one column per cloud (Azure /
  // AWS / GCP) so the colors read as clean blocks instead of a scattered
  // rainbow. Within a column, order by sub-region (geographic) then region name.
  const columns = useMemo(() => {
    const subOrder = (m: RosterMark) =>
      subGeoFor({ superGeo, country: m.geo.country, lat: m.geo.lat, lon: m.geo.lon }).order;
    return ROSTER_PROVIDERS.map((p) => ({
      provider: p,
      marks: marks
        .filter((m) => m.mark.provider === p)
        .sort((a, b) => subOrder(a) - subOrder(b) || a.geo.region.localeCompare(b.geo.region)),
    })).filter((c) => c.marks.length > 0);
  }, [marks, superGeo]);

  return (
    <div style={{ marginTop: first ? 0 : 12 }}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2 text-left bg-transparent border-0 p-0"
        style={{ cursor: 'pointer', marginBottom: open ? 6 : 0 }}
        aria-expanded={open}
      >
        <span className="text-[10px] text-text-muted">{open ? '▾' : '▸'}</span>
        <span
          className="text-[9px] tracking-[0.08em] text-text-muted"
          style={{ textTransform: 'uppercase', fontWeight: 600 }}
        >
          {SUPER_GEO_BOX[superGeo].label}
          <span style={{ marginLeft: 6 }}>· {marks.length}</span>
        </span>
      </button>
      {open && (
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`, gap: 12 }}
        >
          {columns.map((col) => {
            const tone = PROVIDER_TONE[col.provider];
            return (
              <div key={col.provider}>
                <div
                  className="text-[8px] tracking-[0.06em]"
                  style={{ marginBottom: 4, textTransform: 'uppercase', fontWeight: 700, color: tone.fill }}
                >
                  {col.provider}
                  <span className="text-text-muted" style={{ marginLeft: 5 }}>
                    · {col.marks.length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 10 }}>
                  {col.marks.map((m) => {
                    const k = `${m.mark.provider}|${m.mark.region}`;
                    const isFocused = focusedKey === k;
                    return (
                      <div
                        key={k}
                        className="flex items-center gap-1.5 min-w-0"
                        style={{
                          opacity: focusedKey && !isFocused ? 0.4 : 1,
                          transition: 'opacity 120ms',
                        }}
                        title={`${m.mark.provider} · ${m.geo.region} (${m.geo.city})`}
                      >
                        <span
                          style={{
                            width: 9,
                            height: 9,
                            borderRadius: 999,
                            background: m.tone.fill,
                            border: `1.5px solid ${m.tone.stroke}`,
                            flexShrink: 0,
                            display: 'inline-block',
                            boxShadow: isFocused ? `0 0 0 2px ${m.tone.ring}` : 'none',
                          }}
                        />
                        <span className="font-mono text-text-primary truncate">{m.geo.region}</span>
                        <span className="text-text-muted truncate">· {m.geo.city}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
