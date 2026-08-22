/**
 * Sub-geo classifier — a SECOND level of grouping WITHIN a super-geo.
 *
 * The Region Availability roster groups cloud regions by super-geo
 * (AMER / EMEA / APAC). Inside each super-geo the entries still read as a
 * scramble, so we cluster them by *where they sit* within that super-geo (a
 * sub-region / metro band) before grouping by cloud provider.
 *
 * Hierarchy:  SuperGeo → sub-region → provider → regions.
 *
 * This classifier is intentionally DATA-DRIVEN — it keys off `country`
 * (primary) plus a longitude split for the USA. There is NO per-region
 * hardcoded enumeration, so a new region classifies automatically as long as
 * its country (or, for the USA, its longitude) is recognized. An unrecognised
 * country falls into the per-super-geo `Other` bucket (sorted last); it never
 * throws.
 *
 * `order` is a geographic-ish west→east integer so the buckets sort by
 * position, not alphabetically.
 */
import type { SuperGeo } from '../data/regionCoordinates';

export interface SubGeoBucket {
  /** Stable key, unique within a super-geo (used for React keys + grouping). */
  key: string;
  /** Human display label, e.g. "US East". */
  label: string;
  /** West→east-ish sort order within the super-geo (lower = first). */
  order: number;
}

export interface SubGeoInput {
  superGeo: SuperGeo;
  country: string;
  lat: number;
  lon: number;
}

/** Normalize a country string for matching: lowercase, trimmed. */
function norm(country: string): string {
  return (country || '').trim().toLowerCase();
}

const ANY = 9_000;

/** Per-super-geo `Other` fallback bucket (sorts last). */
function otherBucket(): SubGeoBucket {
  return { key: 'OTHER', label: 'Other', order: ANY };
}

// ────────────────────────────────────────────────────────────────────────
// AMER
// ────────────────────────────────────────────────────────────────────────
function classifyAmer(country: string, lon: number): SubGeoBucket {
  const c = norm(country);
  if (c === 'usa' || c === 'united states' || c === 'us') {
    // Longitude split across the continental US.
    if (lon < -100) return { key: 'US_WEST', label: 'US West', order: 10 };
    if (lon < -90) return { key: 'US_CENTRAL', label: 'US Central', order: 20 };
    return { key: 'US_EAST', label: 'US East', order: 30 };
  }
  if (c === 'canada') return { key: 'CANADA', label: 'Canada', order: 40 };
  // Everything else in the Americas → Latin America (Brazil, Mexico, Chile, …).
  const latam = new Set([
    'brazil', 'mexico', 'chile', 'argentina', 'colombia', 'peru',
    'venezuela', 'ecuador', 'bolivia', 'paraguay', 'uruguay',
  ]);
  if (latam.has(c)) return { key: 'LATAM', label: 'Latin America', order: 50 };
  return otherBucket();
}

// ────────────────────────────────────────────────────────────────────────
// EMEA
// ────────────────────────────────────────────────────────────────────────
const UK_IRELAND = new Set(['uk', 'united kingdom', 'ireland', 'gb', 'great britain']);
const WESTERN_EUROPE = new Set([
  'netherlands', 'france', 'germany', 'belgium', 'switzerland',
  'austria', 'luxembourg',
]);
const NORDICS = new Set(['sweden', 'norway', 'finland', 'denmark', 'iceland']);
const SOUTHERN_EUROPE = new Set(['italy', 'spain', 'portugal', 'greece', 'malta', 'cyprus']);
const CENTRAL_EASTERN_EUROPE = new Set([
  'poland', 'czechia', 'czech republic', 'hungary', 'slovakia', 'slovenia',
  'croatia', 'romania', 'bulgaria', 'serbia', 'ukraine', 'estonia',
  'latvia', 'lithuania',
]);
const MIDDLE_EAST = new Set([
  'uae', 'united arab emirates', 'israel', 'qatar', 'saudi arabia',
  'bahrain', 'kuwait', 'oman', 'jordan', 'turkey',
]);
const AFRICA = new Set([
  'south africa', 'nigeria', 'egypt', 'kenya', 'morocco', 'ghana', 'angola',
]);

function classifyEmea(country: string): SubGeoBucket {
  const c = norm(country);
  if (UK_IRELAND.has(c)) return { key: 'UK_IRELAND', label: 'UK & Ireland', order: 10 };
  if (WESTERN_EUROPE.has(c)) return { key: 'WEST_EUROPE', label: 'Western Europe', order: 20 };
  if (NORDICS.has(c)) return { key: 'NORDICS', label: 'Nordics', order: 30 };
  if (SOUTHERN_EUROPE.has(c)) return { key: 'SOUTH_EUROPE', label: 'Southern Europe', order: 40 };
  if (CENTRAL_EASTERN_EUROPE.has(c)) {
    return { key: 'CEE', label: 'Central & Eastern Europe', order: 50 };
  }
  if (MIDDLE_EAST.has(c)) return { key: 'MIDDLE_EAST', label: 'Middle East', order: 60 };
  if (AFRICA.has(c)) return { key: 'AFRICA', label: 'Africa', order: 70 };
  return otherBucket();
}

// ────────────────────────────────────────────────────────────────────────
// APAC
// ────────────────────────────────────────────────────────────────────────
const EAST_ASIA = new Set([
  'japan', 'south korea', 'korea', 'china', 'hong kong', 'taiwan', 'macau',
]);
const SOUTHEAST_ASIA = new Set([
  'singapore', 'indonesia', 'malaysia', 'thailand', 'vietnam',
  'philippines', 'cambodia', 'myanmar', 'laos', 'brunei',
]);
const SOUTH_ASIA = new Set(['india', 'pakistan', 'bangladesh', 'sri lanka', 'nepal']);
const OCEANIA = new Set(['australia', 'new zealand']);

function classifyApac(country: string): SubGeoBucket {
  const c = norm(country);
  if (EAST_ASIA.has(c)) return { key: 'EAST_ASIA', label: 'East Asia', order: 10 };
  if (SOUTHEAST_ASIA.has(c)) return { key: 'SE_ASIA', label: 'Southeast Asia', order: 20 };
  if (SOUTH_ASIA.has(c)) return { key: 'SOUTH_ASIA', label: 'South Asia', order: 30 };
  if (OCEANIA.has(c)) return { key: 'OCEANIA', label: 'Oceania', order: 40 };
  return otherBucket();
}

/**
 * Map a region to a sub-region bucket WITHIN its super-geo.
 *
 * Derives from `country` first, with a longitude split for the USA. Returns a
 * stable `{ key, label, order }`; unmatched countries fall to the per-super-geo
 * `Other` bucket (highest order). Never throws.
 */
export function subGeoFor(geo: SubGeoInput): SubGeoBucket {
  switch (geo.superGeo) {
    case 'AMER':
      return classifyAmer(geo.country, geo.lon);
    case 'EMEA':
      return classifyEmea(geo.country);
    case 'APAC':
      return classifyApac(geo.country);
    default:
      return otherBucket();
  }
}
