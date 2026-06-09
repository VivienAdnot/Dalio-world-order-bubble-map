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
  geoRisk: number; // 0..1 (1 = max external geopolitical risk)
  mom12m: number; // 12-month price performance, %

  // ── Big Debt Cycle indicators (back the stage / drive the heuristic signal) ──
  debtServicePct: number; // govt interest expense, % of revenue (the debt-service FLOW)
  cbAssetsPct: number; // central-bank balance sheet, % of GDP (monetization)
  realRate: number; // real short-term policy rate, % (hard vs soft money)
  privateDebtPct: number; // private non-financial debt, % of GDP
  internalConflict: number; // 0..1 internal political polarization (1 = max)
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
  metrics: BlockMetrics; // the raw inputs (for indicator readouts)
  factors: Record<Factor, number>; // 0..100
  composite: number; // 0..100
  stage: number; // Big Debt Cycle stage, 1 (soundest) .. 5 (going broke) — editorial
  stageNote: string; // editorial rationale for the stage
  stageSignal: number; // 1..5 heuristic stage from the debt/monetary-stress indicators
}
