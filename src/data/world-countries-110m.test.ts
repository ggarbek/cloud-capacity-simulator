/**
 * Guards the shipped world map data.
 *
 * This file was once committed in a corrupted state: a minifier had collapsed
 * single-element arrays, so a Polygon whose `arcs` should read `[[168]]` was
 * stored as the bare number `168`, and a MultiPolygon's `[[[0]],[[1]]]` as
 * `[0, 1]`. TopoJSON pins nesting depth by geometry type, so topojson-client's
 * `polygon()` called `.map()` on a number and threw. Fiji is geometry index 0,
 * so the first country took down the entire Region Availability page — and,
 * because nothing caught it, the whole Cloud Market Analytics shell with it.
 *
 * The data is repaired. These tests exist so it cannot silently regress: any
 * tool that rewrites this JSON and re-collapses the arrays fails here rather
 * than in a user's browser.
 */
import { describe, it, expect } from 'vitest';
import topo from './world-countries-110m.json';

/** TopoJSON fixes nesting depth by geometry type. */
const REQUIRED_DEPTH: Record<string, number> = {
  Polygon: 2,
  MultiPolygon: 3,
  LineString: 1,
  MultiLineString: 2,
};

function depth(value: unknown): number {
  let n = 0;
  let v = value;
  while (Array.isArray(v)) {
    n += 1;
    if (v.length === 0) return n;
    v = v[0];
  }
  return n;
}

function leaves(value: unknown, out: number[]): void {
  if (Array.isArray(value)) value.forEach((v) => leaves(v, out));
  else if (typeof value === 'number') out.push(value);
}

type Geom = { type: string; arcs?: unknown; properties?: { name?: string } };
const objects = (topo as unknown as { objects: Record<string, { geometries: Geom[] }> }).objects;
const arcTable = (topo as unknown as { arcs: unknown[] }).arcs;
const allGeometries = Object.values(objects).flatMap((o) => o.geometries);

describe('world-countries-110m.json', () => {
  it('is a Topology with the objects the map renders', () => {
    expect((topo as unknown as { type: string }).type).toBe('Topology');
    expect(Object.keys(objects)).toEqual(expect.arrayContaining(['countries', 'land']));
  });

  it('has the full country set', () => {
    expect(objects.countries.geometries).toHaveLength(177);
  });

  // The load-bearing assertion. This is the exact defect that shipped.
  it('nests every geometry arcs array to the depth its type requires', () => {
    const wrong = allGeometries
      .filter((g) => REQUIRED_DEPTH[g.type] !== undefined)
      .filter((g) => depth(g.arcs) !== REQUIRED_DEPTH[g.type])
      .map((g) => `${g.properties?.name ?? g.type}: want ${REQUIRED_DEPTH[g.type]}, got ${depth(g.arcs)}`);
    expect(wrong).toEqual([]);
  });

  it('references only arc indices that exist in the arc table', () => {
    const idx: number[] = [];
    allGeometries.forEach((g) => leaves(g.arcs, idx));
    const n = arcTable.length;
    // A negative index means "this arc, reversed" and encodes as ~i.
    expect(idx.filter((i) => i >= n || i < -n)).toEqual([]);
    expect(idx.length).toBeGreaterThan(0);
  });

  it('keeps the countries a reader will look for', () => {
    const names = objects.countries.geometries.map((g) => g.properties?.name);
    // Fiji is index 0 and was the geometry that triggered the original crash.
    expect(names).toEqual(
      expect.arrayContaining(['Fiji', 'Canada', 'Russia', 'Greenland', 'Falkland Is.']),
    );
  });
});
