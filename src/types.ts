// Shared type contract: data.ts -> gauges.ts -> scoring.ts -> visuals.ts

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

/** RAW inputs, hand-edited in data.ts (RAW). */
export interface BlockMetrics {
  fwdPE: number;
  pb: number;
  debtToGDP: number;
  gdpGrowth: number;
  epsGrowth: number;
  speculation: number; // 0..1 (1 = max froth)
  geoRisk: number; // 0..1 (1 = max risk)
  mom12m: number; // 12-month price performance, %
}

/** Sleeve definition (1 Amundi PEA ETF = 1 block). */
export interface Sleeve {
  label: string;
  index: string;
  members: string[]; // ISO3
}

/** Scoring output -> visuals input. */
export interface BlockScore {
  id: string;
  label: string;
  index?: string;
  members: string[]; // ISO3
  factors: Record<Factor, number>; // 0..100
  composite: number; // 0..100
}
