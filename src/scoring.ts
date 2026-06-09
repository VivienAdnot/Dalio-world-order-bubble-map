import { RAW, SLEEVES } from './data';
import { GAUGES } from './gauges';
import { FACTOR_ORDER, type BlockScore, type Factor } from './types';

// Composite = 0.30·Valuation + 0.25·Debt + 0.20·Growth + 0.10·Leverage + 0.10·Geo + 0.05·Sentiment
export const WEIGHTS: Record<Factor, number> = {
  valuations: 0.3,
  debt: 0.25,
  growth: 0.2,
  leverage: 0.1,
  geo: 0.1,
  sentiment: 0.05,
};

/** RAW -> per-factor 0..100 scores -> weighted composite, for each sleeve. */
export function buildBlockScores(): BlockScore[] {
  return Object.entries(SLEEVES).map(([id, sleeve]) => {
    const metrics = RAW[id];
    const factors = Object.fromEntries(
      FACTOR_ORDER.map((f) => [f, GAUGES[f](metrics)]),
    ) as Record<Factor, number>;
    const composite = Math.round(
      FACTOR_ORDER.reduce((acc, f) => acc + factors[f] * WEIGHTS[f], 0),
    );
    return {
      id,
      label: sleeve.label,
      index: sleeve.index,
      members: sleeve.members,
      factors,
      composite,
    };
  });
}

/** Sort descending by composite (best = most attractive first). */
export const rankBlocks = (blocks: BlockScore[]): BlockScore[] =>
  [...blocks].sort((a, b) => b.composite - a.composite);
