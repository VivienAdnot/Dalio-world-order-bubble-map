import type { BlockMetrics, Factor } from './types';

/**
 * Common scoring engine: bounded linear rescale from [lo, hi] to [0, 100].
 * `invert` for "less = better". Convention: 100 = attractive / low bubble risk.
 *
 *   t = clamp((v - lo) / (hi - lo), 0, 1)
 *   score = round((invert ? 1 - t : t) * 100)
 *
 * The [lo, hi] bounds are the calibration (judgement).
 */
export function lin(v: number, lo: number, hi: number, invert = false): number {
  const t = Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
  return Math.round((invert ? 1 - t : t) * 100);
}

// 1. Valuation — expensive = low (P/E 70% + P/B 30%)
export const scoreValuations = (m: BlockMetrics): number =>
  Math.round(0.7 * lin(m.fwdPE, 8, 30, true) + 0.3 * lin(m.pb, 1, 8, true));

// 2. Debt — high debt/GDP = low
export const scoreDebt = (m: BlockMetrics): number => lin(m.debtToGDP, 40, 160, true);

// 3. Growth — GDP + EPS, more = better
export const scoreGrowth = (m: BlockMetrics): number =>
  Math.round(0.5 * lin(m.gdpGrowth, 0, 7) + 0.5 * lin(m.epsGrowth, 0, 18));

// 4. Leverage / Speculation — euphoria = low
export const scoreLeverage = (m: BlockMetrics): number => lin(m.speculation, 0, 1, true);

// 5. Geopolitics — high risk = low
export const scoreGeo = (m: BlockMetrics): number => lin(m.geoRisk, 0, 1, true);

// 6. Sentiment — POSITIVE momentum, NOT inverted (strong recent rise = high score,
//    trend / Antonacci logic). To treat it as euphoria, pass invert=true.
export const scoreSentiment = (m: BlockMetrics): number => lin(m.mom12m, -10, 35);

export const GAUGES: Record<Factor, (m: BlockMetrics) => number> = {
  valuations: scoreValuations,
  debt: scoreDebt,
  growth: scoreGrowth,
  leverage: scoreLeverage,
  geo: scoreGeo,
  sentiment: scoreSentiment,
};
