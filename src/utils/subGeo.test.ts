import { describe, it, expect } from 'vitest';
import { subGeoFor } from './subGeo';
import type { SuperGeo } from '../data/regionCoordinates';

function amer(country: string, lon: number) {
  return subGeoFor({ superGeo: 'AMER', country, lat: 0, lon });
}
function emea(country: string) {
  return subGeoFor({ superGeo: 'EMEA', country, lat: 0, lon: 0 });
}
function apac(country: string) {
  return subGeoFor({ superGeo: 'APAC', country, lat: 0, lon: 0 });
}

describe('subGeoFor — AMER', () => {
  it('Virginia (USA, lon ≥ -90) → US East', () => {
    expect(amer('USA', -78.39).key).toBe('US_EAST');
    expect(amer('USA', -78.39).label).toBe('US East');
  });

  it('California (USA, lon < -100) → US West', () => {
    expect(amer('USA', -122.42).key).toBe('US_WEST');
  });

  it('Iowa (USA, -100 ≤ lon < -90) → US Central', () => {
    expect(amer('USA', -93.62).key).toBe('US_CENTRAL');
  });

  it('Toronto (Canada) → Canada', () => {
    expect(amer('Canada', -79.38).key).toBe('CANADA');
  });

  it('São Paulo (Brazil) → Latin America', () => {
    expect(amer('Brazil', -46.63).key).toBe('LATAM');
    expect(amer('Mexico', -99.13).key).toBe('LATAM');
  });
});

describe('subGeoFor — EMEA', () => {
  it('London (UK) → UK & Ireland', () => {
    expect(emea('UK').key).toBe('UK_IRELAND');
    expect(emea('Ireland').key).toBe('UK_IRELAND');
  });

  it('Frankfurt (Germany) → Western Europe', () => {
    expect(emea('Germany').key).toBe('WEST_EUROPE');
    expect(emea('Netherlands').key).toBe('WEST_EUROPE');
    expect(emea('France').key).toBe('WEST_EUROPE');
  });

  it('Gävle/Oslo (Sweden/Norway) → Nordics', () => {
    expect(emea('Sweden').key).toBe('NORDICS');
    expect(emea('Norway').key).toBe('NORDICS');
  });

  it('Southern Europe', () => {
    expect(emea('Italy').key).toBe('SOUTH_EUROPE');
    expect(emea('Spain').key).toBe('SOUTH_EUROPE');
  });

  it('Central & Eastern Europe', () => {
    expect(emea('Poland').key).toBe('CEE');
  });

  it('Dubai (UAE) → Middle East', () => {
    expect(emea('UAE').key).toBe('MIDDLE_EAST');
    expect(emea('Israel').key).toBe('MIDDLE_EAST');
  });

  it('Cape Town (South Africa) → Africa', () => {
    expect(emea('South Africa').key).toBe('AFRICA');
    expect(emea('Nigeria').key).toBe('AFRICA');
  });
});

describe('subGeoFor — APAC', () => {
  it('Tokyo (Japan) → East Asia', () => {
    expect(apac('Japan').key).toBe('EAST_ASIA');
    expect(apac('South Korea').key).toBe('EAST_ASIA');
    expect(apac('Hong Kong').key).toBe('EAST_ASIA');
  });

  it('Singapore → Southeast Asia', () => {
    expect(apac('Singapore').key).toBe('SE_ASIA');
    expect(apac('Indonesia').key).toBe('SE_ASIA');
  });

  it('Mumbai (India) → South Asia', () => {
    expect(apac('India').key).toBe('SOUTH_ASIA');
  });

  it('Sydney (Australia) → Oceania', () => {
    expect(apac('Australia').key).toBe('OCEANIA');
    expect(apac('New Zealand').key).toBe('OCEANIA');
  });
});

describe('subGeoFor — fallback + robustness', () => {
  it('unknown country falls into Other (sorts last)', () => {
    const r = emea('Atlantis');
    expect(r.key).toBe('OTHER');
    expect(r.label).toBe('Other');
    expect(r.order).toBeGreaterThan(1000);
  });

  it('unknown AMER country → Other', () => {
    expect(amer('Atlantis', -50).key).toBe('OTHER');
  });

  it('empty country does not throw, → Other', () => {
    expect(() => apac('')).not.toThrow();
    expect(apac('').key).toBe('OTHER');
  });

  it('matching is case-insensitive', () => {
    expect(emea('germany').key).toBe('WEST_EUROPE');
    expect(emea('GERMANY').key).toBe('WEST_EUROPE');
    expect(amer('usa', -120).key).toBe('US_WEST');
  });

  it('US longitude boundaries (-100, -90) classify correctly', () => {
    expect(amer('USA', -100).key).toBe('US_CENTRAL'); // -100 is not < -100
    expect(amer('USA', -90).key).toBe('US_EAST'); // -90 is not < -90
    expect(amer('USA', -100.01).key).toBe('US_WEST');
  });

  it('Other order is consistent across super-geos', () => {
    const orders: number[] = (['AMER', 'EMEA', 'APAC'] as SuperGeo[]).map(
      (sg) => subGeoFor({ superGeo: sg, country: 'Nowhere', lat: 0, lon: 0 }).order,
    );
    expect(new Set(orders).size).toBe(1);
  });
});
