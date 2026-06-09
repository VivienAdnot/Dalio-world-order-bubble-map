# Dalio-Style Bubble Gauge — PEA Sleeves

Mini web app that scores **7 geographic Amundi PEA ETF sleeves** on **6 factors**,
*Dalio Bubble Gauge* style (**100 = attractive / low bubble risk**), then ranks, colours
and visualises them (choropleth map, radars, bars). Pure front-end, no backend, no API key.

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
   |
gauges.ts    lin() + 6 scoring functions (raw -> 0..100) ; GAUGES map
   |
scoring.ts   WEIGHTS ; buildBlockScores() -> BlockScore[] ; rankBlocks()
   |
visuals.ts   pure EChartsOption builders (no state) + colours/labels
   |
main.ts      ECharts init, 4 tabs, hash routing, sleeve selector
```

- `types.ts` — shared contract (`Factor`, `FACTOR_ORDER`, `BlockMetrics`, `Sleeve`, `BlockScore`).
- `world.geo.json` — world geometry, `id` = ISO3 (source johan/world.geo.json).
  HKG & SGP absent (too small, no map impact).
- Single `#chart` canvas; each tab recomputes the ECharts option and calls `setOption`.

### `visuals.ts` surface

- `BANDS` → green 70–100, yellow 40–69, red 0–39 ; `colorOf(score)`, `FACTOR_LABELS`.
- `registerWorldMap(echarts, geojson)` (copies `feature.id` → `properties.iso3`, match by ISO3).
- `buildMapOption`, `buildRadarOption` (7 sleeves overlaid), `buildBarOption`,
  `buildProfileRadarOption(blocks, selected)` (large radar: selected sleeve filled
  vs the average of the 7 dashed, coloured axis labels, composite badge).

### Tabs + routing (`main.ts`)

- Views: `map` / `radar` / `bar` / `profiles` (buttons `.tab[data-view]`).
- **URL anchors** (read on load and on `hashchange`):
  `#map`, `#radar`, `#bars`(or `#bar`)→bar, `#profiles`(or `#profile`).
- `#profiles-<ticker>` opens Profiles on a specific sleeve (e.g. `#profiles-plem`, lowercase ticker).
- Clicking a tab writes the anchor; choosing a sleeve writes `#profiles-<id>` via `replaceState`.

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

**Sources & confidence**: `fwdPE` (Siblis Research, per-country P/E as of 2025-12-31,
aggregated per sleeve = proxy); `gdpGrowth` (IMF WEO Jan + Apr 2026); `debtToGDP` (IMF,
representative gross public debt); `pb`/`epsGrowth`/`mom12m` = estimates to refine;
`speculation`/`geoRisk` = **0..1, analyst judgement** (geoRisk for Gulf/EMEA raised after
the Middle East conflict, WEO Apr 2026). The 4 subjective inputs = the `lin()` bounds,
`speculation`, `geoRisk`, the sign of Sentiment. The rest is mechanical/reproducible.

## Current ranking (computed, mid-2026)

| Rank | Ticker | Composite | Colour |
|---|---|---|---|
| 1 | PLEM | 69 | 🟡 |
| 2 | PALAT | 68 | 🟡 |
| 3 | PAEJ | 65 | 🟡 |
| 4 | PCEU | 57 | 🟡 |
| 5 | PINR | 56 | 🟡 |
| 6 | PTPXH | 44 | 🟡 |
| 7 | PNAS | 36 | 🔴 |

(No sleeve ≥70 after moving Sentiment to positive-momentum; PLEM 70→69.)

## TODO / ideas

1. Replace the estimated metrics (`pb`, `epsGrowth`, `mom12m`, `speculation`, `geoRisk`)
   with a **real data loader** (API / CSV).
2. Finer GeoJSON if HK/Singapore need to show.
3. Option: mobile-first radar layout (2 columns).
4. Anti over-engineering guardrail: any scoring change stays pre-registered and justified.
