import type { BlockMetrics, MemberProfile, Sleeve } from './types';

// ─────────────────────────────────────────────────────────────────────────
// Universe: 7 geographic Amundi PEA ETF sleeves (1 ETF = 1 block).
// `members` = ISO3 countries used to partition the choropleth map.
// India (PINR) is split out of PAEJ; China stays in PAEJ (no China sleeve).
// To break China out: create PASI { members: ['CHN'] } and remove 'CHN' from PAEJ.
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
  PTPXH: { label: 'Japan', index: 'TOPIX', members: ['JPN'] },
  PAEJ: {
    label: 'Asia-Pac ex-Japan',
    index: 'MSCI AC Asia Pacific ex Japan',
    members: ['AUS', 'HKG', 'NZL', 'SGP', 'CHN', 'KOR', 'TWN', 'IDN', 'MYS', 'PHL', 'THA'],
  },
  PINR: { label: 'India', index: 'MSCI India', members: ['IND'] },
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
// Raw metrics (mid-2026). EDIT HERE to update the scores.
//
// Sources & confidence:
//   fwdPE     Siblis Research (per-country P/E as of 2025-12-31, aggregated per sleeve = proxy)
//   gdpGrowth IMF WEO (Jan + Apr 2026)
//   debtToGDP IMF (representative gross public debt)
//   pb / epsGrowth / mom12m  estimates to refine
//   speculation / geoRisk    0..1, analyst judgement (geoRisk for Gulf/EMEA raised,
//                            Middle East conflict, WEO Apr 2026)
//
// Subjective inputs: the lin() bounds (gauges.ts), speculation, geoRisk, and the Euphoria
// blend (momentum is INVERTED as froth, folded with speculation). The rest is mechanical.
//
// Big Debt Cycle indicators — SOURCED, representative country per sleeve
// (PNAS=US, PCEU=euro area, PTPXH=Japan, PAEJ=China, PINR=India, PALAT=Brazil,
//  PLEM=Saudi/South-Africa blend). Per-field source & vintage:
//   debtServicePct   general-govt interest ÷ revenue — IMF Fiscal Monitor / Eurostat, 2024
//   cbAssetsPct      central-bank total assets ÷ GDP — Fed/ECB/BoJ/PBoC/RBI/BCB/SAMA-SARB, 2025–26
//   realRate         policy rate − latest CPI — central banks, mid-2026
//   privateDebtPct   BIS credit to private non-financial sector ÷ GDP — BIS/FRED, Q3-2025
//   internalConflict 0..1 — JUDGEMENT (no single source; parallels geoRisk's external read)
// Caveats: US is general-government basis; China debtService excludes LGFV (understated);
// Saudi cbAssets is FX-reserve-heavy (not QE). They feed cycleStressSignal (gauges.ts).
// ─────────────────────────────────────────────────────────────────────────
export const RAW: Record<string, BlockMetrics> = {
  PNAS:  { fwdPE: 27.0, pb: 7.0, debtToGDP: 122, gdpGrowth: 2.0, epsGrowth: 16, speculation: 0.85, geoRisk: 0.35, mom12m: 22, debtServicePct: 13.2, cbAssetsPct: 22,  realRate: -0.2, privateDebtPct: 140, internalConflict: 0.75 },
  PCEU:  { fwdPE: 14.5, pb: 2.1, debtToGDP: 90,  gdpGrowth: 1.3, epsGrowth: 7,  speculation: 0.35, geoRisk: 0.40, mom12m: 12, debtServicePct: 4.1,  cbAssetsPct: 40,  realRate: -1.2, privateDebtPct: 154, internalConflict: 0.45 },
  PTPXH: { fwdPE: 15.5, pb: 1.5, debtToGDP: 250, gdpGrowth: 0.7, epsGrowth: 8,  speculation: 0.35, geoRisk: 0.30, mom12m: 13, debtServicePct: 4.0,  cbAssetsPct: 102, realRate: -0.7, privateDebtPct: 173, internalConflict: 0.25 },
  PAEJ:  { fwdPE: 16.0, pb: 1.9, debtToGDP: 65,  gdpGrowth: 4.0, epsGrowth: 12, speculation: 0.55, geoRisk: 0.60, mom12m: 18, debtServicePct: 3.7,  cbAssetsPct: 34,  realRate: 1.8,  privateDebtPct: 201, internalConflict: 0.55 },
  PINR:  { fwdPE: 23.0, pb: 3.9, debtToGDP: 83,  gdpGrowth: 6.3, epsGrowth: 14, speculation: 0.65, geoRisk: 0.40, mom12m: 6,  debtServicePct: 25.0, cbAssetsPct: 28,  realRate: 1.8,  privateDebtPct: 97,  internalConflict: 0.45 },
  PALAT: { fwdPE: 10.0, pb: 1.6, debtToGDP: 75,  gdpGrowth: 2.0, epsGrowth: 9,  speculation: 0.25, geoRisk: 0.45, mom12m: 9,  debtServicePct: 21.0, cbAssetsPct: 40,  realRate: 10.1, privateDebtPct: 91,  internalConflict: 0.55 },
  PLEM:  { fwdPE: 11.0, pb: 1.6, debtToGDP: 50,  gdpGrowth: 3.0, epsGrowth: 8,  speculation: 0.40, geoRisk: 0.75, mom12m: 10, debtServicePct: 11.4, cbAssetsPct: 34,  realRate: 2.8,  privateDebtPct: 72,  internalConflict: 0.65 },
};

// ─────────────────────────────────────────────────────────────────────────
// Big Debt Cycle — Ray Dalio, "How Countries Go Broke: The Big Cycle".
// A severity gauge of where each market sits in the cycle:
//   1 Sound Money  →  2 Debt Bubble  →  3 The Top  →  4 Deleveraging  →  5 Going Broke
// The cycle is a loop: stage 5's crisis eventually recedes and resets to stage 1.
// These are EDITORIAL, hand-assigned per sleeve from Dalio's framework — they are
// NOT derived from RAW. Edit `stage`/`note` here to re-stage a sleeve.
// ─────────────────────────────────────────────────────────────────────────
export interface StageMeta {
  stage: number;
  name: string;
  blurb: string;
  color: string; // green (sound) → red (going broke)
}

export const CYCLE_STAGES: StageMeta[] = [
  { stage: 1, name: 'Sound Money',  blurb: 'Low debt, hard money, productivity-led growth.',                         color: '#2fa36b' },
  { stage: 2, name: 'Debt Bubble',  blurb: 'Cheap money; debt & investment outrun the incomes that service them.',   color: '#8bbf3c' },
  { stage: 3, name: 'The Top',      blurb: 'The bubble pops — debt, credit, markets and the economy contract.',       color: '#e8b23a' },
  { stage: 4, name: 'Deleveraging', blurb: 'Painful workout to bring debt and debt service back in line with income.', color: '#e07b2e' },
  { stage: 5, name: 'Going Broke',  blurb: 'Crisis climax: money-printing, devaluation, internal & external conflict.', color: '#e1495b' },
];

// ─────────────────────────────────────────────────────────────────────────
// Within-block divergence — key individual countries inside the multi-country
// sleeves. A "block" can't go broke; only its sovereigns can, and Dalio analyses
// them individually (creditor Germany vs debtor Italy; take-off Saudi/UAE vs
// troubled Turkey/South Africa; China's bust vs neutral high-growth Indonesia).
// debtToGDP = IMF general-govt GROSS debt %GDP (2024–25); gdpGrowth = real %,
// 2025 actual (IMF WEO / national stats via Trading Economics). archetype = editorial.
// Single-country sleeves (PNAS/PTPXH/PINR) have no members listed.
// Caveats: figures are IMF-gross basis (differs from national/Maastricht); Taiwan is
// national-source (not in IMF WEO); its +8.7% growth is an AI/chip outlier, not structural.
// ─────────────────────────────────────────────────────────────────────────
export const MEMBERS: Record<string, MemberProfile[]> = {
  PCEU: [
    { iso3: 'DEU', name: 'Germany',     debtToGDP: 64,  gdpGrowth: 0.2, archetype: 'creditor · low debt' },
    { iso3: 'NLD', name: 'Netherlands', debtToGDP: 44,  gdpGrowth: 1.9, archetype: 'creditor · low debt' },
    { iso3: 'ESP', name: 'Spain',       debtToGDP: 100, gdpGrowth: 2.8, archetype: 'recovering · high growth' },
    { iso3: 'FRA', name: 'France',      debtToGDP: 117, gdpGrowth: 0.9, archetype: 'debtor · record-high debt' },
    { iso3: 'ITA', name: 'Italy',       debtToGDP: 137, gdpGrowth: 0.5, archetype: 'debtor · high debt' },
  ],
  PAEJ: [
    { iso3: 'CHN', name: 'China',       debtToGDP: 96,  gdpGrowth: 5.0, archetype: 'debt bust + US conflict (dominant)' },
    { iso3: 'KOR', name: 'South Korea', debtToGDP: 55,  gdpGrowth: 1.0, archetype: 'slowing' },
    { iso3: 'TWN', name: 'Taiwan',      debtToGDP: 29,  gdpGrowth: 8.7, archetype: 'chip boom · conflict-exposed' },
    { iso3: 'AUS', name: 'Australia',   debtToGDP: 51,  gdpGrowth: 2.6, archetype: 'steady' },
    { iso3: 'IDN', name: 'Indonesia',   debtToGDP: 40,  gdpGrowth: 5.1, archetype: 'neutral · take-off' },
  ],
  PALAT: [
    { iso3: 'BRA', name: 'Brazil',      debtToGDP: 91,  gdpGrowth: 2.3, archetype: 'high debt · +10% real rate (dominant)' },
    { iso3: 'MEX', name: 'Mexico',      debtToGDP: 59,  gdpGrowth: 1.0, archetype: 'near-stall' },
    { iso3: 'COL', name: 'Colombia',    debtToGDP: 59,  gdpGrowth: 2.6, archetype: 'steady growth' },
    { iso3: 'CHL', name: 'Chile',       debtToGDP: 42,  gdpGrowth: 2.5, archetype: 'steady · low debt' },
  ],
  PLEM: [
    { iso3: 'SAU', name: 'Saudi Arabia', debtToGDP: 30, gdpGrowth: 4.5, archetype: 'take-off · strong balance sheet' },
    { iso3: 'ARE', name: 'UAE',          debtToGDP: 33, gdpGrowth: 5.6, archetype: 'take-off · strong balance sheet' },
    { iso3: 'POL', name: 'Poland',       debtToGDP: 60, gdpGrowth: 3.6, archetype: 'EU growth leader' },
    { iso3: 'TUR', name: 'Turkey',       debtToGDP: 27, gdpGrowth: 3.6, archetype: 'low debt, FX-denominated risk' },
    { iso3: 'ZAF', name: 'South Africa', debtToGDP: 77, gdpGrowth: 1.1, archetype: 'DM-style debt/deficit problems' },
  ],
};

export const STAGES: Record<string, { stage: number; note: string }> = {
  PNAS: {
    stage: 5,
    note: 'Late-empire Stage 5 — Dalio puts the US ~90–95% through its Big Cycle. An AI-era asset bubble (speculation 0.85, fwd P/E 27) sits atop 122% debt/GDP, with internal polarization and great-power conflict at extremes.',
  },
  PTPXH: {
    stage: 4,
    note: 'Deep in deleveraging — 250% debt/GDP, the BoJ holds bonds worth >90% of GDP to pin rates. Decades of monetization; "deleveraged" in dollar/gold terms via devaluation, but exposed to any rise in real rates.',
  },
  PINR: {
    stage: 2,
    note: 'Take-off (Stage 1→2) — shifting from sound money into an early debt-financed expansion. Strong fundamentals, 6%+ growth and geopolitically neutral; 83% debt still manageable vs its growth.',
  },
  PAEJ: {
    stage: 3,
    note: 'At the Top, bursting (Stage 3→4) — China-led: the 2021 property bubble popped and is feeding into deleveraging (real-estate + local-government debt). Intensifying US–China tech war (geoRisk 0.60).',
  },
  PCEU: {
    stage: 5,
    note: 'Weak-empire Stage 5 — high debt (90%), stagnant growth (1.3%). Unified monetary policy but no unified fiscal policy → "ugly deleveraging" risk where members (Greece/Italy/France) cannot print to service debt.',
  },
  PLEM: {
    stage: 5,
    note: 'Conflict-driven Stage 5 — debt is lower (~50%) but external geopolitical risk is extreme (geoRisk 0.75) after Middle East conflict. Fast-shifting alliances are a hallmark of the late Big Cycle.',
  },
  PALAT: {
    stage: 4,
    note: 'Chronic Stage 4–5 — persistent deficits and low investor confidence (fwd P/E 10). Recurring debt limits papered over with accounting tricks and guarantees; Brazil is Dalio\'s classic case.',
  },
};
