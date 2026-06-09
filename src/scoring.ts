import { RAW, SLEEVES } from './data';
import { GAUGES } from './gauges';
import { FACTOR_ORDER, type BlockScore, type Factor } from './types';

// Composite = 0.30·Valo + 0.25·Dette + 0.20·Croiss + 0.10·Levier + 0.10·Géo + 0.05·Sent
export const WEIGHTS: Record<Factor, number> = {
  valuations: 0.3,
  debt: 0.25,
  growth: 0.2,
  leverage: 0.1,
  geo: 0.1,
  sentiment: 0.05,
};

/** Brut (RAW) -> scores 0..100 par facteur -> composite pondéré, pour chaque sleeve. */
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

/** Tri décroissant par composite (meilleur = attractif en tête). */
export const rankBlocks = (blocks: BlockScore[]): BlockScore[] =>
  [...blocks].sort((a, b) => b.composite - a.composite);
