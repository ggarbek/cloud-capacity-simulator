/**
 * Region geography — cross-cloud region → {country, city, lat/lon} (v2.26.0).
 *
 * The anchor for REGION EQUIVALENCY. Cloud regions are equivalent when they sit
 * in the same country (data-residency / compliance is the dominant driver) and,
 * within that, as geographically close as possible (to serve the same
 * customers). This map encodes each region's real datacenter metro so the
 * matcher in `utils/equivalence.ts` can rank by country-then-distance.
 *
 * Coordinates are the published datacenter metro (city centroid, 2-dp) — exact
 * enough for proximity ranking; country is the load-bearing field. AWS Local
 * Zones / Wavelength carry `edge: true` and inherit their parent region's
 * country unless the edge metro is in a different country (special-cased).
 *
 * Sources: each cloud's public "region/location" tables (AWS Regions &
 * Availability Zones, Azure geographies, GCP locations). Re-verify on a major
 * region launch.
 */
/** Coarse continental bucket. Mirrors `SuperGeo` in regionCoordinates.ts. */
export type SuperGeo = 'AMER' | 'EMEA' | 'APAC';

export interface RegionGeo {
  /** ISO-3166-1 alpha-2 country code — the equivalency anchor. */
  cc: string;
  /** Human country name. */
  country: string;
  /** Datacenter metro / state. */
  city: string;
  lat: number;
  lon: number;
  /** AWS Local Zone / Wavelength edge location (no cross-cloud peer). */
  edge?: boolean;
  /** Government / sovereign cloud (compares only within the same sovereign set). */
  gov?: boolean;
  /**
   * Explicit continental bucket. Stamped only where the longitude rule
   * (`superGeoFromLon`) would misclassify — the Middle East sits at ~35–55°E,
   * just under the 65°E EMEA/APAC boundary, so it would derive APAC-adjacent;
   * South Africa is far south but EMEA; Pacific islands straddle the dateline.
   * When absent the longitude fallback is correct and is used.
   */
  superGeo?: SuperGeo;
}

type Geo = Record<string, RegionGeo>;

// ── AWS ─────────────────────────────────────────────────────────────────────
const AWS_CORE: Geo = {
  'af-south-1': { cc: 'ZA', country: 'South Africa', city: 'Cape Town', lat: -33.93, lon: 18.42, superGeo: 'EMEA' },
  'ap-east-1': { cc: 'HK', country: 'Hong Kong', city: 'Hong Kong', lat: 22.32, lon: 114.17 },
  'ap-east-2': { cc: 'TW', country: 'Taiwan', city: 'Taipei', lat: 25.03, lon: 121.57 },
  'ap-northeast-1': { cc: 'JP', country: 'Japan', city: 'Tokyo', lat: 35.69, lon: 139.69 },
  'ap-northeast-2': { cc: 'KR', country: 'South Korea', city: 'Seoul', lat: 37.57, lon: 126.98 },
  'ap-northeast-3': { cc: 'JP', country: 'Japan', city: 'Osaka', lat: 34.69, lon: 135.5 },
  'ap-south-1': { cc: 'IN', country: 'India', city: 'Mumbai', lat: 19.08, lon: 72.88 },
  'ap-south-2': { cc: 'IN', country: 'India', city: 'Hyderabad', lat: 17.39, lon: 78.49 },
  'ap-southeast-1': { cc: 'SG', country: 'Singapore', city: 'Singapore', lat: 1.35, lon: 103.82 },
  'ap-southeast-2': { cc: 'AU', country: 'Australia', city: 'Sydney', lat: -33.87, lon: 151.21 },
  'ap-southeast-3': { cc: 'ID', country: 'Indonesia', city: 'Jakarta', lat: -6.21, lon: 106.85 },
  'ap-southeast-4': { cc: 'AU', country: 'Australia', city: 'Melbourne', lat: -37.81, lon: 144.96 },
  'ap-southeast-5': { cc: 'MY', country: 'Malaysia', city: 'Kuala Lumpur', lat: 3.14, lon: 101.69 },
  'ap-southeast-6': { cc: 'NZ', country: 'New Zealand', city: 'Auckland', lat: -36.85, lon: 174.76 },
  'ap-southeast-7': { cc: 'TH', country: 'Thailand', city: 'Bangkok', lat: 13.76, lon: 100.5 },
  'ca-central-1': { cc: 'CA', country: 'Canada', city: 'Montreal', lat: 45.5, lon: -73.57 },
  'ca-west-1': { cc: 'CA', country: 'Canada', city: 'Calgary', lat: 51.05, lon: -114.07 },
  'eu-central-1': { cc: 'DE', country: 'Germany', city: 'Frankfurt', lat: 50.11, lon: 8.68 },
  'eu-central-2': { cc: 'CH', country: 'Switzerland', city: 'Zurich', lat: 47.37, lon: 8.55 },
  'eu-north-1': { cc: 'SE', country: 'Sweden', city: 'Stockholm', lat: 59.33, lon: 18.06 },
  'eu-south-1': { cc: 'IT', country: 'Italy', city: 'Milan', lat: 45.46, lon: 9.19 },
  'eu-south-2': { cc: 'ES', country: 'Spain', city: 'Zaragoza', lat: 41.65, lon: -0.89 },
  'eu-west-1': { cc: 'IE', country: 'Ireland', city: 'Dublin', lat: 53.35, lon: -6.26 },
  'eu-west-2': { cc: 'GB', country: 'United Kingdom', city: 'London', lat: 51.51, lon: -0.13 },
  'eu-west-3': { cc: 'FR', country: 'France', city: 'Paris', lat: 48.86, lon: 2.35 },
  'il-central-1': { cc: 'IL', country: 'Israel', city: 'Tel Aviv', lat: 32.09, lon: 34.78, superGeo: 'EMEA' },
  'me-central-1': { cc: 'AE', country: 'United Arab Emirates', city: 'Dubai', lat: 25.2, lon: 55.27, superGeo: 'EMEA' },
  'me-south-1': { cc: 'BH', country: 'Bahrain', city: 'Manama', lat: 26.07, lon: 50.56, superGeo: 'EMEA' },
  'mx-central-1': { cc: 'MX', country: 'Mexico', city: 'Querétaro', lat: 20.59, lon: -100.39 },
  'sa-east-1': { cc: 'BR', country: 'Brazil', city: 'São Paulo', lat: -23.55, lon: -46.63 },
  'us-east-1': { cc: 'US', country: 'United States', city: 'N. Virginia', lat: 38.95, lon: -77.45 },
  'us-east-2': { cc: 'US', country: 'United States', city: 'Ohio', lat: 39.96, lon: -83.0 },
  'us-west-1': { cc: 'US', country: 'United States', city: 'N. California', lat: 37.34, lon: -121.89 },
  'us-west-2': { cc: 'US', country: 'United States', city: 'Oregon', lat: 45.84, lon: -119.7 },
  'us-gov-east-1': { cc: 'US', country: 'United States', city: 'US Gov East', lat: 38.95, lon: -77.45, gov: true },
  'us-gov-west-1': { cc: 'US', country: 'United States', city: 'US Gov West', lat: 45.6, lon: -121.2, gov: true },
};
// AWS edge metros that sit in a DIFFERENT country than their parent region.
const AWS_EDGE_FOREIGN: Geo = {
  'af-south-1-los-1': { cc: 'NG', country: 'Nigeria', city: 'Lagos', lat: 6.52, lon: 3.38, edge: true, superGeo: 'EMEA' },
  'ap-northeast-1-tpe-1': { cc: 'TW', country: 'Taiwan', city: 'Taipei', lat: 25.03, lon: 121.57, edge: true },
  'ap-southeast-1-bkk-1': { cc: 'TH', country: 'Thailand', city: 'Bangkok', lat: 13.76, lon: 100.5, edge: true },
  'ap-southeast-1-han-1': { cc: 'VN', country: 'Vietnam', city: 'Hanoi', lat: 21.03, lon: 105.85, edge: true },
  'ap-southeast-1-mnl-1': { cc: 'PH', country: 'Philippines', city: 'Manila', lat: 14.6, lon: 120.98, edge: true },
  'ap-southeast-2-akl-1': { cc: 'NZ', country: 'New Zealand', city: 'Auckland', lat: -36.85, lon: 174.76, edge: true },
  'ap-south-1-ccu-1': { cc: 'IN', country: 'India', city: 'Kolkata', lat: 22.57, lon: 88.36, edge: true },
  'ap-south-1-del-1': { cc: 'IN', country: 'India', city: 'Delhi', lat: 28.61, lon: 77.21, edge: true },
  'eu-central-1-ist-1': { cc: 'TR', country: 'Turkey', city: 'Istanbul', lat: 41.01, lon: 28.98, edge: true, superGeo: 'EMEA' },
  'eu-central-1-waw-1': { cc: 'PL', country: 'Poland', city: 'Warsaw', lat: 52.23, lon: 21.01, edge: true },
  'eu-north-1-cph-1': { cc: 'DK', country: 'Denmark', city: 'Copenhagen', lat: 55.68, lon: 12.57, edge: true },
  'eu-north-1-hel-1': { cc: 'FI', country: 'Finland', city: 'Helsinki', lat: 60.17, lon: 24.94, edge: true },
  'eu-west-3-cmn-1': { cc: 'MA', country: 'Morocco', city: 'Casablanca', lat: 33.57, lon: -7.59, edge: true, superGeo: 'EMEA' },
  'eu-west-3-wl1-cmn1': { cc: 'MA', country: 'Morocco', city: 'Casablanca', lat: 33.57, lon: -7.59, edge: true, superGeo: 'EMEA' },
  'eu-west-3-wl1-dss1': { cc: 'SN', country: 'Senegal', city: 'Dakar', lat: 14.72, lon: -17.47, edge: true, superGeo: 'EMEA' },
  'me-south-1-mct-1': { cc: 'OM', country: 'Oman', city: 'Muscat', lat: 23.59, lon: 58.41, edge: true, superGeo: 'EMEA' },
  'us-east-1-bue-1': { cc: 'AR', country: 'Argentina', city: 'Buenos Aires', lat: -34.6, lon: -58.38, edge: true },
  'us-east-1-lim-1': { cc: 'PE', country: 'Peru', city: 'Lima', lat: -12.05, lon: -77.04, edge: true },
  'us-east-1-qro-1': { cc: 'MX', country: 'Mexico', city: 'Querétaro', lat: 20.59, lon: -100.39, edge: true },
  'us-east-1-scl-1': { cc: 'CL', country: 'Chile', city: 'Santiago', lat: -33.45, lon: -70.67, edge: true },
};

// ── Azure (display names) ────────────────────────────────────────────────────
const AZURE: Geo = {
  'Australia Central': { cc: 'AU', country: 'Australia', city: 'Canberra', lat: -35.28, lon: 149.13 },
  'Australia Central 2': { cc: 'AU', country: 'Australia', city: 'Canberra', lat: -35.28, lon: 149.13 },
  'Australia East': { cc: 'AU', country: 'Australia', city: 'Sydney', lat: -33.87, lon: 151.21 },
  'Australia Southeast': { cc: 'AU', country: 'Australia', city: 'Melbourne', lat: -37.81, lon: 144.96 },
  'Austria East': { cc: 'AT', country: 'Austria', city: 'Vienna', lat: 48.21, lon: 16.37 },
  'Belgium Central': { cc: 'BE', country: 'Belgium', city: 'Brussels', lat: 50.85, lon: 4.35 },
  'Brazil South': { cc: 'BR', country: 'Brazil', city: 'São Paulo', lat: -23.55, lon: -46.63 },
  'Brazil Southeast': { cc: 'BR', country: 'Brazil', city: 'Rio de Janeiro', lat: -22.91, lon: -43.17 },
  'Canada Central': { cc: 'CA', country: 'Canada', city: 'Toronto', lat: 43.65, lon: -79.38 },
  'Canada East': { cc: 'CA', country: 'Canada', city: 'Quebec City', lat: 46.81, lon: -71.21 },
  'Central India': { cc: 'IN', country: 'India', city: 'Pune', lat: 18.52, lon: 73.86 },
  // 'India Central' is a naming variant of 'Central India' (Pune) seen in the live
  // rate catalog; map it so every catalog region resolves (region-name counts
  // reconcile) even though Azure's canonical label is 'Central India'.
  'India Central': { cc: 'IN', country: 'India', city: 'Pune', lat: 18.52, lon: 73.86 },
  'Central US': { cc: 'US', country: 'United States', city: 'Iowa', lat: 41.59, lon: -93.62 },
  'Chile Central': { cc: 'CL', country: 'Chile', city: 'Santiago', lat: -33.45, lon: -70.67 },
  'Denmark East': { cc: 'DK', country: 'Denmark', city: 'Copenhagen', lat: 55.68, lon: 12.57 },
  'East Asia': { cc: 'HK', country: 'Hong Kong', city: 'Hong Kong', lat: 22.32, lon: 114.17 },
  'East US': { cc: 'US', country: 'United States', city: 'Virginia', lat: 37.37, lon: -79.16 },
  'East US 2': { cc: 'US', country: 'United States', city: 'Virginia', lat: 36.85, lon: -76.29 },
  'France Central': { cc: 'FR', country: 'France', city: 'Paris', lat: 48.86, lon: 2.35 },
  'France South': { cc: 'FR', country: 'France', city: 'Marseille', lat: 43.3, lon: 5.37 },
  'Germany North': { cc: 'DE', country: 'Germany', city: 'Berlin', lat: 52.52, lon: 13.4 },
  'Germany West Central': { cc: 'DE', country: 'Germany', city: 'Frankfurt', lat: 50.11, lon: 8.68 },
  'India South Central': { cc: 'IN', country: 'India', city: 'Hyderabad', lat: 17.39, lon: 78.49 },
  'Indonesia Central': { cc: 'ID', country: 'Indonesia', city: 'Jakarta', lat: -6.21, lon: 106.85 },
  'Israel Central': { cc: 'IL', country: 'Israel', city: 'Tel Aviv', lat: 32.09, lon: 34.78, superGeo: 'EMEA' },
  'Israel Northwest': { cc: 'IL', country: 'Israel', city: 'Haifa', lat: 32.79, lon: 34.99, superGeo: 'EMEA' },
  'Italy North': { cc: 'IT', country: 'Italy', city: 'Milan', lat: 45.46, lon: 9.19 },
  'Japan East': { cc: 'JP', country: 'Japan', city: 'Tokyo', lat: 35.69, lon: 139.69 },
  'Japan West': { cc: 'JP', country: 'Japan', city: 'Osaka', lat: 34.69, lon: 135.5 },
  'Jio India Central': { cc: 'IN', country: 'India', city: 'Nagpur', lat: 21.15, lon: 79.09 },
  'Jio India West': { cc: 'IN', country: 'India', city: 'Jamnagar', lat: 22.47, lon: 70.06 },
  'Korea Central': { cc: 'KR', country: 'South Korea', city: 'Seoul', lat: 37.57, lon: 126.98 },
  'Korea South': { cc: 'KR', country: 'South Korea', city: 'Busan', lat: 35.18, lon: 129.08 },
  'Malaysia West': { cc: 'MY', country: 'Malaysia', city: 'Kuala Lumpur', lat: 3.14, lon: 101.69 },
  'Mexico Central': { cc: 'MX', country: 'Mexico', city: 'Querétaro', lat: 20.59, lon: -100.39 },
  'New Zealand North': { cc: 'NZ', country: 'New Zealand', city: 'Auckland', lat: -36.85, lon: 174.76 },
  'North Central US': { cc: 'US', country: 'United States', city: 'Chicago', lat: 41.88, lon: -87.63 },
  'North Europe': { cc: 'IE', country: 'Ireland', city: 'Dublin', lat: 53.35, lon: -6.26 },
  'Norway East': { cc: 'NO', country: 'Norway', city: 'Oslo', lat: 59.91, lon: 10.75 },
  'Norway West': { cc: 'NO', country: 'Norway', city: 'Stavanger', lat: 58.97, lon: 5.73 },
  'Poland Central': { cc: 'PL', country: 'Poland', city: 'Warsaw', lat: 52.23, lon: 21.01 },
  'Qatar Central': { cc: 'QA', country: 'Qatar', city: 'Doha', lat: 25.29, lon: 51.53, superGeo: 'EMEA' },
  'South Africa North': { cc: 'ZA', country: 'South Africa', city: 'Johannesburg', lat: -26.2, lon: 28.05, superGeo: 'EMEA' },
  'South Africa West': { cc: 'ZA', country: 'South Africa', city: 'Cape Town', lat: -33.93, lon: 18.42, superGeo: 'EMEA' },
  'South Central US': { cc: 'US', country: 'United States', city: 'Texas', lat: 29.42, lon: -98.49 },
  'South India': { cc: 'IN', country: 'India', city: 'Chennai', lat: 13.08, lon: 80.27 },
  'Southeast Asia': { cc: 'SG', country: 'Singapore', city: 'Singapore', lat: 1.35, lon: 103.82 },
  'Spain Central': { cc: 'ES', country: 'Spain', city: 'Madrid', lat: 40.42, lon: -3.7 },
  'Sweden Central': { cc: 'SE', country: 'Sweden', city: 'Gävle', lat: 60.67, lon: 17.14 },
  'Sweden South': { cc: 'SE', country: 'Sweden', city: 'Malmö', lat: 55.6, lon: 13.0 },
  'Switzerland North': { cc: 'CH', country: 'Switzerland', city: 'Zurich', lat: 47.37, lon: 8.55 },
  'Switzerland West': { cc: 'CH', country: 'Switzerland', city: 'Geneva', lat: 46.2, lon: 6.14 },
  'UAE Central': { cc: 'AE', country: 'United Arab Emirates', city: 'Abu Dhabi', lat: 24.45, lon: 54.38, superGeo: 'EMEA' },
  'UAE North': { cc: 'AE', country: 'United Arab Emirates', city: 'Dubai', lat: 25.2, lon: 55.27, superGeo: 'EMEA' },
  'UK South': { cc: 'GB', country: 'United Kingdom', city: 'London', lat: 51.51, lon: -0.13 },
  'UK West': { cc: 'GB', country: 'United Kingdom', city: 'Cardiff', lat: 51.48, lon: -3.18 },
  'US Gov Arizona': { cc: 'US', country: 'United States', city: 'Arizona', lat: 33.45, lon: -112.07, gov: true },
  'US Gov Texas': { cc: 'US', country: 'United States', city: 'Texas', lat: 32.78, lon: -96.8, gov: true },
  'US Gov Virginia': { cc: 'US', country: 'United States', city: 'Virginia', lat: 37.37, lon: -79.16, gov: true },
  'West Central US': { cc: 'US', country: 'United States', city: 'Wyoming', lat: 41.14, lon: -104.82 },
  'West Europe': { cc: 'NL', country: 'Netherlands', city: 'Amsterdam', lat: 52.37, lon: 4.9 },
  'West India': { cc: 'IN', country: 'India', city: 'Mumbai', lat: 19.08, lon: 72.88 },
  'West US': { cc: 'US', country: 'United States', city: 'California', lat: 37.34, lon: -121.89 },
  'West US 2': { cc: 'US', country: 'United States', city: 'Washington', lat: 47.23, lon: -119.85 },
  'West US 3': { cc: 'US', country: 'United States', city: 'Phoenix', lat: 33.45, lon: -112.07 },
};

// ── GCP ──────────────────────────────────────────────────────────────────────
const GCP: Geo = {
  africasouth1: { cc: 'ZA', country: 'South Africa', city: 'Johannesburg', lat: -26.2, lon: 28.05, superGeo: 'EMEA' },
  asiaeast1: { cc: 'TW', country: 'Taiwan', city: 'Changhua', lat: 24.08, lon: 120.54 },
  asiaeast2: { cc: 'HK', country: 'Hong Kong', city: 'Hong Kong', lat: 22.32, lon: 114.17 },
  asianortheast1: { cc: 'JP', country: 'Japan', city: 'Tokyo', lat: 35.69, lon: 139.69 },
  asianortheast2: { cc: 'JP', country: 'Japan', city: 'Osaka', lat: 34.69, lon: 135.5 },
  asianortheast3: { cc: 'KR', country: 'South Korea', city: 'Seoul', lat: 37.57, lon: 126.98 },
  asiasouth1: { cc: 'IN', country: 'India', city: 'Mumbai', lat: 19.08, lon: 72.88 },
  asiasouth2: { cc: 'IN', country: 'India', city: 'Delhi', lat: 28.61, lon: 77.21 },
  asiasoutheast1: { cc: 'SG', country: 'Singapore', city: 'Singapore', lat: 1.35, lon: 103.82 },
  asiasoutheast2: { cc: 'ID', country: 'Indonesia', city: 'Jakarta', lat: -6.21, lon: 106.85 },
  asiasoutheast3: { cc: 'MY', country: 'Malaysia', city: 'Kuala Lumpur', lat: 3.14, lon: 101.69 },
  australiasoutheast1: { cc: 'AU', country: 'Australia', city: 'Sydney', lat: -33.87, lon: 151.21 },
  australiasoutheast2: { cc: 'AU', country: 'Australia', city: 'Melbourne', lat: -37.81, lon: 144.96 },
  europecentral2: { cc: 'PL', country: 'Poland', city: 'Warsaw', lat: 52.23, lon: 21.01 },
  europenorth1: { cc: 'FI', country: 'Finland', city: 'Hamina', lat: 60.57, lon: 27.2 },
  europenorth2: { cc: 'SE', country: 'Sweden', city: 'Stockholm', lat: 59.33, lon: 18.06 },
  europesouthwest1: { cc: 'ES', country: 'Spain', city: 'Madrid', lat: 40.42, lon: -3.7 },
  europewest1: { cc: 'BE', country: 'Belgium', city: 'St. Ghislain', lat: 50.45, lon: 3.82 },
  europewest10: { cc: 'DE', country: 'Germany', city: 'Berlin', lat: 52.52, lon: 13.4 },
  europewest12: { cc: 'IT', country: 'Italy', city: 'Turin', lat: 45.07, lon: 7.69 },
  europewest2: { cc: 'GB', country: 'United Kingdom', city: 'London', lat: 51.51, lon: -0.13 },
  europewest3: { cc: 'DE', country: 'Germany', city: 'Frankfurt', lat: 50.11, lon: 8.68 },
  europewest4: { cc: 'NL', country: 'Netherlands', city: 'Eemshaven', lat: 53.43, lon: 6.83 },
  europewest6: { cc: 'CH', country: 'Switzerland', city: 'Zurich', lat: 47.37, lon: 8.55 },
  europewest8: { cc: 'IT', country: 'Italy', city: 'Milan', lat: 45.46, lon: 9.19 },
  europewest9: { cc: 'FR', country: 'France', city: 'Paris', lat: 48.86, lon: 2.35 },
  mecentral1: { cc: 'QA', country: 'Qatar', city: 'Doha', lat: 25.29, lon: 51.53, superGeo: 'EMEA' },
  mecentral2: { cc: 'SA', country: 'Saudi Arabia', city: 'Dammam', lat: 26.43, lon: 50.1, superGeo: 'EMEA' },
  mewest1: { cc: 'IL', country: 'Israel', city: 'Tel Aviv', lat: 32.09, lon: 34.78, superGeo: 'EMEA' },
  northamericanortheast1: { cc: 'CA', country: 'Canada', city: 'Montreal', lat: 45.5, lon: -73.57 },
  northamericanortheast2: { cc: 'CA', country: 'Canada', city: 'Toronto', lat: 43.65, lon: -79.38 },
  northamericasouth1: { cc: 'MX', country: 'Mexico', city: 'Querétaro', lat: 20.59, lon: -100.39 },
  southamericaeast1: { cc: 'BR', country: 'Brazil', city: 'São Paulo', lat: -23.55, lon: -46.63 },
  southamericawest1: { cc: 'CL', country: 'Chile', city: 'Santiago', lat: -33.45, lon: -70.67 },
  uscentral1: { cc: 'US', country: 'United States', city: 'Iowa', lat: 41.26, lon: -95.86 },
  useast1: { cc: 'US', country: 'United States', city: 'South Carolina', lat: 33.84, lon: -81.16 },
  useast4: { cc: 'US', country: 'United States', city: 'N. Virginia', lat: 38.95, lon: -77.45 },
  useast5: { cc: 'US', country: 'United States', city: 'Ohio', lat: 39.96, lon: -83.0 },
  ussouth1: { cc: 'US', country: 'United States', city: 'Dallas', lat: 32.78, lon: -96.8 },
  uswest1: { cc: 'US', country: 'United States', city: 'Oregon', lat: 45.84, lon: -119.7 },
  uswest2: { cc: 'US', country: 'United States', city: 'Los Angeles', lat: 34.05, lon: -118.24 },
  uswest3: { cc: 'US', country: 'United States', city: 'Salt Lake City', lat: 40.76, lon: -111.89 },
  uswest4: { cc: 'US', country: 'United States', city: 'Las Vegas', lat: 36.17, lon: -115.14 },
  uswest8: { cc: 'US', country: 'United States', city: 'Phoenix', lat: 33.45, lon: -112.07 },
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const GCP_NORM: Geo = Object.fromEntries(Object.entries(GCP).map(([k, v]) => [norm(k), v]));

/** Strip an AWS Local Zone / Wavelength suffix → parent region slug. */
function awsParent(region: string): string {
  return region.replace(/-(wl\d|los|[a-z]{3})-?\w*\d*$/i, '').replace(/-wl\d$/i, '');
}

/**
 * Resolve any catalog region (AWS slug, Azure display name, GCP slug) → its
 * geography. AWS edge zones inherit the parent region's country unless the edge
 * metro is in a different country (special-cased in AWS_EDGE_FOREIGN).
 */
export function regionGeo(provider: string, region: string): RegionGeo | null {
  const p = (provider || '').toLowerCase();
  if (p === 'azure') return AZURE[region] ?? null;
  if (p === 'gcp') return GCP_NORM[norm(region)] ?? null;
  if (p === 'aws') {
    if (AWS_CORE[region]) return AWS_CORE[region];
    if (AWS_EDGE_FOREIGN[region]) return AWS_EDGE_FOREIGN[region];
    // Edge zone in the parent's country: inherit parent geo, flag edge.
    const parent = awsParent(region);
    const base = AWS_CORE[parent];
    if (base) return { ...base, edge: true };
    return null;
  }
  return null;
}

/**
 * True when a catalog region is an AWS Local Zone or Wavelength zone rather
 * than a full region. AWS commercial + GovCloud regions are exactly
 * `<geo>-<dir>-<n>` (e.g. `us-east-1`, `eu-west-2`, `us-gov-east-1`); Local
 * Zones add a metro segment (`us-east-1-bos-1`) and Wavelength zones carry a
 * `wl<n>` segment (`us-east-1-wl1`, `eu-west-2-wl1-lon1`). These edge locations
 * shouldn't be counted as "regions" in a footprint comparison — they have no
 * cross-cloud peer, and counting them inflates AWS to ~105 vs ~38 real regions.
 * Only AWS exposes them in the catalog; Azure/GCP always return false.
 */
export function isEdgeRegion(provider: string, region: string): boolean {
  if ((provider || '').toLowerCase() !== 'aws') return false;
  return !/^[a-z]{2}-(gov-)?[a-z]+-\d+$/.test(region);
}

/**
 * Continental bucket from longitude alone: AMER west of ~25°W, EMEA up to
 * ~65°E, APAC east of that. Correct for every current catalog region, but the
 * 65°E boundary runs close to the easternmost Middle East metros (Muscat 58°E),
 * so a curated `superGeo` on the geo entry overrides it where present.
 */
export function superGeoFromLon(lon: number): SuperGeo {
  if (lon < -25) return 'AMER';
  if (lon < 65) return 'EMEA';
  return 'APAC';
}

/**
 * Canonical super-geo for a resolved geo: prefer its curated `superGeo` (set on
 * the boundary-sensitive Middle East / Africa entries), else derive from
 * longitude. Use this instead of re-deriving the longitude rule at each call
 * site so the curated edge-case buckets are honored everywhere.
 */
export function superGeoForGeo(geo: RegionGeo): SuperGeo {
  return geo.superGeo ?? superGeoFromLon(geo.lon);
}

/** Convenience: resolve a region and return its super-geo (longitude fallback). */
export function superGeoForRegion(provider: string, region: string): SuperGeo {
  const geo = regionGeo(provider, region);
  return geo ? superGeoForGeo(geo) : superGeoFromLon(0);
}

/** Great-circle distance in km (haversine). */
export function haversineKm(a: RegionGeo, b: RegionGeo): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.min(1, Math.sqrt(h))));
}
