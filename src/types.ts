// Contrat de types partagé : data.ts -> gauges.ts -> scoring.ts -> visuals.ts

export type Factor =
  | 'valuations'
  | 'debt'
  | 'growth'
  | 'leverage'
  | 'geo'
  | 'sentiment';

export const FACTOR_ORDER: Factor[] = [
  'valuations',
  'debt',
  'growth',
  'leverage',
  'geo',
  'sentiment',
];

/** Entrées BRUTES, éditées à la main dans data.ts (RAW). */
export interface BlockMetrics {
  fwdPE: number;
  pb: number;
  debtToGDP: number;
  gdpGrowth: number;
  epsGrowth: number;
  speculation: number; // 0..1 (1 = froth max)
  geoRisk: number; // 0..1 (1 = risque max)
  mom12m: number; // perf prix 12 mois, %
}

/** Définition d'un sleeve (1 ETF Amundi PEA = 1 bloc). */
export interface Sleeve {
  label: string;
  index: string;
  members: string[]; // ISO3
}

/** Sortie du scoring -> entrée des visuals. */
export interface BlockScore {
  id: string;
  label: string;
  index?: string;
  members: string[]; // ISO3
  factors: Record<Factor, number>; // 0..100
  composite: number; // 0..100
}
