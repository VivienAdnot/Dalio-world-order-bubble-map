# Dalio-world-order-bubble-map

Dalio-style **Bubble Gauge** for the 7 geographic Amundi PEA ETF sleeves. Each sleeve is
scored 0–100 on 6 factors (**100 = attractive / low bubble risk**), ranked, coloured, and
visualised as a choropleth map, radars, and a composite bar chart. Pure front-end
(Vite + TypeScript + ECharts), no backend, no API key.

**Live:** https://vivienadnot.github.io/Dalio-world-order-bubble-map/

## Quick start

```bash
npm install
npm run dev      # dev server (index.html)
npm run build    # tsc && vite build -> dist/index.html (single inlined file)
npm run preview
```

To update the numbers: edit **`src/data.ts`** (`RAW`) and push to `main`. A GitHub
Actions workflow builds and deploys `dist/` to Pages automatically — no built bundle
is committed. Full step-by-step in [`docs/refreshing-the-data.md`](./docs/refreshing-the-data.md)
(where each metric comes from, cadence, and the deploy paths).

## Layout

| File | Role |
|---|---|
| `index.html` | Vite source entry (edit this) |
| `.github/workflows/deploy.yml` | builds + deploys `dist/` to Pages on push to `main` |
| `src/data.ts` | `SLEEVES` (country→sleeve) + `RAW` (raw metrics) — **the data layer** |
| `src/gauges.ts` | `lin()` + the 6 scoring functions |
| `src/scoring.ts` | `WEIGHTS`, `buildBlockScores()`, `rankBlocks()` |
| `src/visuals.ts` | pure ECharts option builders (map / radar / bar / profile) |
| `src/main.ts` | ECharts init, 4 tabs, URL-hash routing, sleeve selector |
| `src/types.ts` | shared contract |
| `src/world.geo.json` | world geometry, `id` = ISO3 (source: johan/world.geo.json) |

See [`CLAUDE.md`](./CLAUDE.md) for the full methodology (exact factor formulas, weights,
data sources, and the current ranking).

## URL anchors

`#map` · `#radar` · `#bars` · `#profiles` open a given tab; `#profiles-<ticker>`
(lowercase, e.g. `#profiles-plem`) opens the Profiles tab on a specific sleeve.
