import type { BlockMetrics, Sleeve } from './types';

// ─────────────────────────────────────────────────────────────────────────
// Univers : 7 sleeves ETF géographiques Amundi PEA (1 ETF = 1 bloc).
// `members` = pays ISO3 utilisés pour partitionner la carte choroplèthe.
// Inde (PINR) découpée de PAEJ ; Chine reste dans PAEJ (pas de sleeve Chine).
// Pour sortir la Chine : créer PASI { members: ['CHN'] } et retirer 'CHN' de PAEJ.
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
  PTPXH: { label: 'Japon', index: 'Japon TOPIX', members: ['JPN'] },
  PAEJ: {
    label: 'Asie-Pac ex-Japon',
    index: 'MSCI AC Asia Pacific ex Japan',
    members: ['AUS', 'HKG', 'NZL', 'SGP', 'CHN', 'KOR', 'TWN', 'IDN', 'MYS', 'PHL', 'THA'],
  },
  PINR: { label: 'Inde', index: 'MSCI India', members: ['IND'] },
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
// Métriques brutes (mid-2026). ÉDITER ICI pour mettre à jour les scores.
//
// Sources & confiance :
//   fwdPE     Siblis Research (P/E par pays au 31/12/2025, agrégés par sleeve = proxy)
//   gdpGrowth FMI WEO (janv. + avr. 2026)
//   debtToGDP FMI (dette publique brute représentative)
//   pb / epsGrowth / mom12m  estimations à affiner
//   speculation / geoRisk    0..1, dires d'analyste (geoRisk Golfe/EMEA relevé,
//                            conflit Moyen-Orient, WEO avr. 2026)
//
// Maillons subjectifs : bornes des lin() (gauges.ts), speculation, geoRisk,
// et le signe du Sentiment (momentum positif, non inversé). Le reste est mécanique.
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
