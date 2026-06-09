import { RAW, SLEEVES, STAGES } from './data';
import { GAUGES, cycleStressSignal } from './gauges';
import { FACTOR_ORDER, type BlockScore, type Factor } from './types';

// Composite = 0.30·Valuation + 0.25·Debt + 0.20·Growth + 0.15·Euphoria + 0.10·Geo
// (Euphoria 0.15 = the merged old Leverage 0.10 + Sentiment 0.05.)
export const WEIGHTS: Record<Factor, number> = {
  valuations: 0.3,
  debt: 0.25,
  growth: 0.2,
  euphoria: 0.15,
  geo: 0.1,
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
    const stage = STAGES[id];
    return {
      id,
      label: sleeve.label,
      index: sleeve.index,
      members: sleeve.members,
      metrics,
      factors,
      composite,
      stage: stage?.stage ?? 1,
      stageNote: stage?.note ?? '',
      stageSignal: cycleStressSignal(metrics),
    };
  });
}

/** Sort descending by composite (best = most attractive first). */
export const rankBlocks = (blocks: BlockScore[]): BlockScore[] =>
  [...blocks].sort((a, b) => b.composite - a.composite);
