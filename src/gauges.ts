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

// 4. Euphoria / froth — speculation + extrapolative momentum; euphoria = LOW score.
//    For a Dalio bubble gauge, strong momentum is "extrapolating the past" (a bubble
//    warning), so it is INVERTED here. Folds the old Leverage (speculation) and Sentiment
//    (momentum) factors into one — both are froth signals; kept apart they'd double-count.
export const scoreEuphoria = (m: BlockMetrics): number =>
  Math.round(0.6 * lin(m.speculation, 0, 1, true) + 0.4 * lin(m.mom12m, -10, 35, true));

// 5. Geopolitics — high risk = low
export const scoreGeo = (m: BlockMetrics): number => lin(m.geoRisk, 0, 1, true);

/**
 * Heuristic Big Debt Cycle "signal" — a transparent, equal-weighted debt/monetary-
 * stress proxy mapped to a 1–5 stage. NOT authoritative: it deliberately isolates the
 * DEBT-MECHANICS axis (debt level + service + monetization + private debt + real rate +
 * conflict), so it legitimately diverges from the editorial stage where that call leans on
 * the empire / geopolitical dimension. Valuation & speculation are excluded on purpose
 * (high froth signals an early bubble, i.e. stage 2 — not high cycle severity).
 *
 * Each sub-score is 0..100 (higher = closer to "going broke"); the mean is bucketed into
 * 5 equal bands. Bounds are a pre-registered calibration — move them only with justification.
 */
export function cycleStressSignal(m: BlockMetrics): number {
  const subs = [
    lin(m.debtToGDP, 40, 250), // gross govt debt
    lin(m.debtServicePct, 5, 25), // interest, % of revenue
    lin(m.cbAssetsPct, 10, 120), // central-bank balance sheet, % GDP
    lin(m.privateDebtPct, 70, 210), // private debt, % GDP
    lin(m.realRate, 4, -2), // lower real rate = softer money = more stress
    m.internalConflict * 100,
    m.geoRisk * 100,
  ];
  const stress = subs.reduce((a, b) => a + b, 0) / subs.length; // 0..100
  return Math.max(1, Math.min(5, 1 + Math.floor(stress / 20)));
}

export const GAUGES: Record<Factor, (m: BlockMetrics) => number> = {
  valuations: scoreValuations,
  debt: scoreDebt,
  growth: scoreGrowth,
  euphoria: scoreEuphoria,
  geo: scoreGeo,
};
