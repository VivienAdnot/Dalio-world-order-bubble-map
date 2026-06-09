import type { BlockMetrics, Factor } from './types';

/**
 * Moteur commun de scoring : rescale linéaire borné de [lo, hi] vers [0, 100].
 * `invert` pour « moins = mieux ». Convention : 100 = attractif / peu de bulle.
 *
 *   t = clamp((v - lo) / (hi - lo), 0, 1)
 *   score = round((invert ? 1 - t : t) * 100)
 *
 * Les bornes [lo, hi] sont la calibration (jugement).
 */
export function lin(v: number, lo: number, hi: number, invert = false): number {
  const t = Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
  return Math.round((invert ? 1 - t : t) * 100);
}

// 1. Valorisation — cher = bas (P/E 70 % + P/B 30 %)
export const scoreValuations = (m: BlockMetrics): number =>
  Math.round(0.7 * lin(m.fwdPE, 8, 30, true) + 0.3 * lin(m.pb, 1, 8, true));

// 2. Dette — dette/PIB élevée = bas
export const scoreDebt = (m: BlockMetrics): number => lin(m.debtToGDP, 40, 160, true);

// 3. Croissance — PIB + BPA, plus = mieux
export const scoreGrowth = (m: BlockMetrics): number =>
  Math.round(0.5 * lin(m.gdpGrowth, 0, 7) + 0.5 * lin(m.epsGrowth, 0, 18));

// 4. Levier / Spéculation — euphorie = bas
export const scoreLeverage = (m: BlockMetrics): number => lin(m.speculation, 0, 1, true);

// 5. Géopolitique — risque élevé = bas
export const scoreGeo = (m: BlockMetrics): number => lin(m.geoRisk, 0, 1, true);

// 6. Sentiment — momentum POSITIF, NON inversé (forte hausse récente = score haut,
//    logique trend / Antonacci). Pour le traiter en euphorie, passer invert=true.
export const scoreSentiment = (m: BlockMetrics): number => lin(m.mom12m, -10, 35);

export const GAUGES: Record<Factor, (m: BlockMetrics) => number> = {
  valuations: scoreValuations,
  debt: scoreDebt,
  growth: scoreGrowth,
  leverage: scoreLeverage,
  geo: scoreGeo,
  sentiment: scoreSentiment,
};
