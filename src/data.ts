import type { BlockMetrics, Sleeve } from './types';

// ─────────────────────────────────────────────────────────────────────────
// Universe: 7 geographic Amundi PEA ETF sleeves (1 ETF = 1 block).
// `members` = ISO3 countries used to partition the choropleth map.
// India (PINR) is split out of PAEJ; China stays in PAEJ (no China sleeve).
// To break China out: create PASI { members: ['CHN'] } and remove 'CHN' from PAEJ.
// ─────────────────────────────────────────────────────────────────────────
export const SLEEVES: Record<string, Sleeve> = {
  PNAS: { label: 'USA', index: 'Nasdaq-100', members: ['USA'] },
  PCEU: {
    label: 'Europe',
    index: 'MSCI Europe',
    members: [
      'AUT', 'BEL', 'DNK', 'FIN', 'FRA', 'DEU', 'IRL', 'ITA',
      'NLD', 'NOR', 'PRT', 'ESP', 'SWE', 'CHE', 'GBR',
    ],
  },
  PTPXH: { label: 'Japan', index: 'TOPIX', members: ['JPN'] },
  PAEJ: {
    label: 'Asia-Pac ex-Japan',
    index: 'MSCI AC Asia Pacific ex Japan',
    members: ['AUS', 'HKG', 'NZL', 'SGP', 'CHN', 'KOR', 'TWN', 'IDN', 'MYS', 'PHL', 'THA'],
  },
  PINR: { label: 'India', index: 'MSCI India', members: ['IND'] },
  PALAT: {
    label: 'LatAm',
    index: 'MSCI EM Latin America',
    members: ['BRA', 'MEX', 'CHL', 'COL', 'PER'],
  },
  PLEM: {
    label: 'EM-EMEA',
    index: 'MSCI EM EMEA',
    members: ['POL', 'CZE', 'HUN', 'GRC', 'TUR', 'SAU', 'ARE', 'QAT', 'KWT', 'ZAF'],
  },
};

// ─────────────────────────────────────────────────────────────────────────
// Raw metrics (mid-2026). EDIT HERE to update the scores.
//
// Sources & confidence:
//   fwdPE     Siblis Research (per-country P/E as of 2025-12-31, aggregated per sleeve = proxy)
//   gdpGrowth IMF WEO (Jan + Apr 2026)
//   debtToGDP IMF (representative gross public debt)
//   pb / epsGrowth / mom12m  estimates to refine
//   speculation / geoRisk    0..1, analyst judgement (geoRisk for Gulf/EMEA raised,
//                            Middle East conflict, WEO Apr 2026)
//
// Subjective inputs: the lin() bounds (gauges.ts), speculation, geoRisk,
// and the sign of Sentiment (positive momentum, not inverted). The rest is mechanical.
// ─────────────────────────────────────────────────────────────────────────
export const RAW: Record<string, BlockMetrics> = {
  PNAS:  { fwdPE: 27.0, pb: 7.0, debtToGDP: 122, gdpGrowth: 2.0, epsGrowth: 16, speculation: 0.85, geoRisk: 0.35, mom12m: 22 },
  PCEU:  { fwdPE: 14.5, pb: 2.1, debtToGDP: 90,  gdpGrowth: 1.3, epsGrowth: 7,  speculation: 0.35, geoRisk: 0.40, mom12m: 12 },
  PTPXH: { fwdPE: 15.5, pb: 1.5, debtToGDP: 250, gdpGrowth: 0.7, epsGrowth: 8,  speculation: 0.35, geoRisk: 0.30, mom12m: 13 },
  PAEJ:  { fwdPE: 16.0, pb: 1.9, debtToGDP: 65,  gdpGrowth: 4.0, epsGrowth: 12, speculation: 0.55, geoRisk: 0.60, mom12m: 18 },
  PINR:  { fwdPE: 23.0, pb: 3.9, debtToGDP: 83,  gdpGrowth: 6.3, epsGrowth: 14, speculation: 0.65, geoRisk: 0.40, mom12m: 6  },
  PALAT: { fwdPE: 10.0, pb: 1.6, debtToGDP: 75,  gdpGrowth: 2.0, epsGrowth: 9,  speculation: 0.25, geoRisk: 0.45, mom12m: 9  },
  PLEM:  { fwdPE: 11.0, pb: 1.6, debtToGDP: 50,  gdpGrowth: 3.0, epsGrowth: 8,  speculation: 0.40, geoRisk: 0.75, mom12m: 10 },
};
