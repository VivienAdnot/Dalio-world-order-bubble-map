# Dalio — the Big Debt Cycle — PEA Sleeves

Mini web app that places **7 geographic Amundi PEA ETF sleeves** on **Ray Dalio's Big Debt
Cycle** (*How Countries Go Broke: The Big Cycle*) — a 1–5 severity stage per sleeve
(1 Sound Money → 5 Going Broke). It keeps a **6-factor attractiveness composite** (0–100,
*100 = attractive / low bubble risk*) **alongside** the stage as a second lens. Views:
a Cycle stage-track, choropleth map, radars, bars, per-sleeve profiles. Pure front-end,
no backend, no API key.

Live app: https://vivienadnot.github.io/Dalio-world-order-bubble-map/

## Language convention

**English only.** All code comments and all user-facing text (HTML, ECharts labels,
tooltips, legends, sleeve labels, URL anchors) are written in English. Keep it that way
for every future change — no French in source or rendered output.

## Stack & commands

- **Vite 5** + **TypeScript 5** + **ECharts 5** (only runtime dependency).
- **Single-file** build via `vite-plugin-singlefile` (ECharts inlined, ~1.3 MB;
  only Google Fonts stay remote, with clean degradation).

```bash
npm install
npm run dev      # dev server (index.html)
npm run build    # tsc && vite build  -> dist/index.html (single file)
npm run preview
```

### Deployment (GitHub Actions)

- `index.html` (root) = **source entry point** (references `/src/main.ts`). This is what we edit.
- The bundle is **never committed**: `dist/` is gitignored.
- On every push to `main`, `.github/workflows/deploy.yml` runs `npm ci && npm run build`
  then publishes `dist/` to GitHub Pages (build type = *workflow*, not *branch*).
- No manual step, no bundle in git history. Same live URL.
- To refresh the numbers (`RAW` in `src/data.ts`): see [`docs/refreshing-the-data.md`](./docs/refreshing-the-data.md) — per-metric sources, cadence, and deploy paths.

## Architecture (data flow)

```
data.ts      SLEEVES (country->sleeve) + RAW (raw metrics/sleeve)
             + STAGES (per-sleeve cycle stage, editorial) + CYCLE_STAGES (the 5 stages)
   |
gauges.ts    lin() + 6 scoring functions (raw -> 0..100) ; GAUGES map ; cycleStressSignal()
   |
scoring.ts   WEIGHTS ; buildBlockScores() -> BlockScore[] (+ stage/stageNote) ; rankBlocks()
   |
visuals.ts   pure EChartsOption builders (no state) + colours/labels + stageColor/stageName
   |
main.ts      ECharts init, 5 tabs, hash routing, sleeve selector
```

- `types.ts` — shared contract (`Factor`, `FACTOR_ORDER`, `BlockMetrics`, `Sleeve`, `BlockScore`).
  `BlockScore` carries the composite, the editorial `stage` (1–5) + `stageNote`, the heuristic
  `stageSignal` (1–5), and the raw `metrics`.
- `world.geo.json` — world geometry, `id` = ISO3 (source johan/world.geo.json).
  HKG & SGP absent (too small, no map impact).
- Single `#chart` canvas; each tab recomputes the ECharts option and calls `setOption`.

### `visuals.ts` surface

- `BANDS` → green 70–100, yellow 40–69, red 0–39 ; `colorOf(score)` (used for the composite,
  e.g. the sleeve chips), `FACTOR_LABELS`.
- `stageColor(stage)` / `stageName(stage)` → the 5-stage green→red ramp (from `CYCLE_STAGES`).
- `registerWorldMap(echarts, geojson)` (copies `feature.id` → `properties.iso3`, match by ISO3).
- `buildCycleOption` (the stage track: 7 sleeves placed across the 5 stages),
  `buildMapOption` (choropleth coloured **by stage**, 5-piece legend; composite in tooltip),
  `buildRadarOption` (7 sleeves overlaid; legend click isolates one sleeve),
  `buildBarOption` (length = composite, colour = stage, labelled `composite · stage N`),
  `buildProfileRadarOption(blocks, selected)` (large radar: selected sleeve filled vs the
  average of the 7 dashed; headline = stage badge, composite in subtext).

### Tabs + routing (`main.ts`)

- Views: `cycle` (default) / `map` / `radar` / `bar` / `profiles` (buttons `.tab[data-view]`).
- **URL anchors** (read on load and on `hashchange`):
  `#cycle`, `#map`, `#radar`, `#bars`(or `#bar`)→bar, `#profiles`(or `#profile`).
- `#profiles-<ticker>` opens Profiles on a specific sleeve (e.g. `#profiles-plem`, lowercase ticker).
- Clicking a tab writes the anchor; choosing a sleeve writes `#profiles-<id>` via `replaceState`.
- **Keyboard**: number-row keys **1–5** select Cycle/Map/Radar/Bars/Profiles. Keyed off
  physical position (`e.code` = `Digit1`–`Digit5`) so it works on any layout (incl. AZERTY)
  without Shift.

## Universe: 7 sleeves (1 Amundi PEA ETF = 1 block)

| Ticker | Sleeve | Index | ISO3 members (map partition) |
|---|---|---|---|
| PNAS | USA | Nasdaq-100 | USA |
| PCEU | Europe | MSCI Europe | AUT BEL DNK FIN FRA DEU IRL ITA NLD NOR PRT ESP SWE CHE GBR |
| PTPXH | Japan | TOPIX | JPN |
| PAEJ | Asia-Pac ex-Japan | MSCI AC Asia Pacific ex Japan | AUS HKG NZL SGP CHN KOR TWN IDN MYS PHL THA |
| PINR | India | MSCI India | IND |
| PALAT | LatAm | MSCI EM Latin America | BRA MEX CHL COL PER |
| PLEM | EM-EMEA | MSCI EM EMEA | POL CZE HUN GRC TUR SAU ARE QAT KWT ZAF |

- **India** (PINR) split out of PAEJ; **China** stays in PAEJ (no China sleeve).
  To break China out: create `PASI { members: ['CHN'] }` and remove `'CHN'` from PAEJ.
- Broad EM (PAEEM/PEMS) deliberately **not** used (overlaps the 3 regional EM sleeves).

## Big Debt Cycle (stage — the editorial lens)

Reframed per Ray Dalio, *How Countries Go Broke: The Big Cycle*. Each sleeve carries a
**stage 1–5** (a severity gauge), kept **alongside** the attractiveness composite below:

| Stage | Name | Meaning |
|---|---|---|
| 1 | Sound Money | Low debt, hard money, productivity-led growth |
| 2 | Debt Bubble | Cheap money; debt & investment outrun the incomes that service them |
| 3 | The Top | The bubble pops — debt, credit, markets and the economy contract |
| 4 | Deleveraging | Painful workout to bring debt back in line with income |
| 5 | Going Broke | Crisis climax: money-printing, devaluation, internal & external conflict |

The cycle is a **loop** — stage 5's crisis eventually recedes and resets to stage 1.

Stages are **hand-assigned and editorial** (NOT derived from `RAW`), set in `data.ts`:
`STAGES` = per-sleeve `{ stage, note }`; `CYCLE_STAGES` = the 5 stage definitions + colours
(green→red). Edit `STAGES` to re-stage a sleeve. The stage drives the **Cycle** track, the
**Map/Bars** colours and the **Profiles** badge; the composite remains a parallel lens.

Current assignment: **India 2** · **Asia-Pac 3** · **Japan 4** · **LatAm 4** ·
**USA / Europe / EM-EMEA 5** (Sound Money currently empty — no major market is pristine).

### Backed by indicators + a heuristic *signal*

`RAW` carries 5 Big Debt Cycle indicators (`debtServicePct`, `cbAssetsPct`, `realRate`,
`privateDebtPct`, `internalConflict`) on top of the 8 composite metrics. `gauges.ts →
cycleStressSignal()` maps them — **equal-weighted, bucketed into 5 bands** — to a 1–5
**signal** (`BlockScore.stageSignal`), a transparent **debt/monetary-stress proxy**.

It is **not authoritative**: valuation & speculation are excluded on purpose (froth = early
bubble, not high severity), so the signal isolates the *debt-mechanics* axis and legitimately
diverges from the editorial stage where that leans on empire/geopolitics. The Cycle view flags
`signal → stage N` on divergence; Profiles shows it in the badge subtext.

| Sleeve | Editorial | Signal |
|---|---|---|
| USA | 5 | **3** |
| Europe | 5 | **3** |
| Japan | 4 | **3** |
| Asia-Pac | 3 | 3 |
| India | 2 | 2 |
| LatAm | 4 | **2** |
| EM-EMEA | 5 | **2** |

The gaps are interpretable: USA/Europe/EM-EMEA editorial-5 calls lean on empire/geopolitics
the signal can't see (their *debt* stress is mid-cycle). **Japan** (ed 4 / sig 3) is the
sharpest lesson — 250%-of-GDP debt but interest is only ~4% of revenue (financial repression
keeps it cheap to carry), so the debt-*service* axis reads lower than the deleveraging call.
**Brazil** (ed 4 / sig 2): a +10% real rate reads as hard money, not stress. Don't tune the
editorial stage to match the signal (anti over-fitting); treat a widening gap as a prompt to
re-examine.

## Method: 6 factors (exact formulas)

Common engine, bounded/clamped, `invert` for "less = better":

```
lin(v, lo, hi, invert=false):
  t = clamp((v - lo) / (hi - lo), 0, 1)
  return round((invert ? 1 - t : t) * 100)
```

| # | Factor | Formula | Direction |
|---|---|---|---|
| 1 | valuations | `0.7·lin(fwdPE,8,30,inv) + 0.3·lin(pb,1,8,inv)` | expensive = low |
| 2 | debt | `lin(debtToGDP,40,160,inv)` | high debt/GDP = low |
| 3 | growth | `0.5·lin(gdpGrowth,0,7) + 0.5·lin(epsGrowth,0,18)` | more = better |
| 4 | leverage | `lin(speculation,0,1,inv)` | euphoria = low |
| 5 | geo | `lin(geoRisk,0,1,inv)` | high risk = low |
| 6 | sentiment | `lin(mom12m,-10,35)` | positive momentum (trend / Antonacci) |

**Composite** = `round(0.30·Valuation + 0.25·Debt + 0.20·Growth + 0.10·Leverage + 0.10·Geo + 0.05·Sentiment)`.

> ⚠️ Modelling choice: Sentiment is **NOT** inverted (strong recent rise = high
> score, trend logic). To treat it as euphoria, set `invert=true` in `scoreSentiment`.

## Current raw data (`RAW`, mid-2026)

| Ticker | fwdPE | pb | debt%GDP | gdp% | eps% | spec | geo | mom12m |
|---|---|---|---|---|---|---|---|---|
| PNAS | 27.0 | 7.0 | 122 | 2.0 | 16 | 0.85 | 0.35 | 22 |
| PCEU | 14.5 | 2.1 | 90 | 1.3 | 7 | 0.35 | 0.40 | 12 |
| PTPXH | 15.5 | 1.5 | 250 | 0.7 | 8 | 0.35 | 0.30 | 13 |
| PAEJ | 16.0 | 1.9 | 65 | 4.0 | 12 | 0.55 | 0.60 | 18 |
| PINR | 23.0 | 3.9 | 83 | 6.3 | 14 | 0.65 | 0.40 | 6 |
| PALAT | 10.0 | 1.6 | 75 | 2.0 | 9 | 0.25 | 0.45 | 9 |
| PLEM | 11.0 | 1.6 | 50 | 3.0 | 8 | 0.40 | 0.75 | 10 |

Big Debt Cycle indicators (feed `cycleStressSignal`; **sourced** — IMF Fiscal Monitor /
BIS / central banks, 2024–mid-2026; `internalConflict` is judgement. See
[`docs/refreshing-the-data.md`](docs/refreshing-the-data.md) §2):

| Ticker | basis | debtSvc% rev | cbAssets% GDP | realRate% | privDebt% GDP | intlConflict |
|---|---|---|---|---|---|---|
| PNAS | US | 13.2 | 22 | -0.2 | 140 | 0.75 |
| PCEU | euro area | 4.1 | 40 | -1.2 | 154 | 0.45 |
| PTPXH | Japan | 4.0 | 102 | -0.7 | 173 | 0.25 |
| PAEJ | China | 3.7 | 34 | 1.8 | 201 | 0.55 |
| PINR | India | 25.0 | 28 | 1.8 | 97 | 0.45 |
| PALAT | Brazil | 21.0 | 40 | 10.1 | 91 | 0.55 |
| PLEM | Saudi/S.Africa | 11.4 | 34 | 2.8 | 72 | 0.65 |

**Sources & confidence**: `fwdPE` (Siblis Research, per-country P/E as of 2025-12-31,
aggregated per sleeve = proxy); `gdpGrowth` (IMF WEO Jan + Apr 2026); `debtToGDP` (IMF,
representative gross public debt); `pb`/`epsGrowth`/`mom12m` = estimates to refine;
`speculation`/`geoRisk` = **0..1, analyst judgement** (geoRisk for Gulf/EMEA raised after
the Middle East conflict, WEO Apr 2026). The 4 subjective inputs = the `lin()` bounds,
`speculation`, `geoRisk`, the sign of Sentiment. The rest is mechanical/reproducible.

## Current ranking (computed, mid-2026)

| Rank | Ticker | Composite | Big Debt Cycle stage |
|---|---|---|---|
| 1 | PLEM | 69 | 5 · Going Broke |
| 2 | PALAT | 68 | 4 · Deleveraging |
| 3 | PAEJ | 65 | 3 · The Top |
| 4 | PCEU | 57 | 5 · Going Broke |
| 5 | PINR | 56 | 2 · Debt Bubble |
| 6 | PTPXH | 44 | 4 · Deleveraging |
| 7 | PNAS | 36 | 5 · Going Broke |

Ranked by composite (high = attractive). Note the two lenses can diverge: e.g. **PNAS/USA**
ranks last on the composite *and* sits at stage 5; **PLEM/EM-EMEA** tops the composite yet is
stage 5 (cheap, but late-cycle conflict). (No sleeve ≥70 after moving Sentiment to
positive-momentum; PLEM 70→69.)

## TODO / ideas

1. Replace the estimated metrics (`pb`, `epsGrowth`, `mom12m`, `speculation`, `geoRisk`)
   with a **real data loader** (API / CSV).
2. Finer GeoJSON if HK/Singapore need to show.
3. Option: mobile-first radar layout (2 columns).
4. Anti over-engineering guardrail: any scoring change stays pre-registered and justified.
