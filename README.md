# Dalio-world-order-bubble-map

Places the 7 geographic Amundi PEA ETF sleeves on **Ray Dalio's Big Debt Cycle**
(*How Countries Go Broke: The Big Cycle*) — a **1–5 severity stage** per sleeve
(1 Sound Money → 5 Going Broke) — while keeping a **5-factor attractiveness composite**
(0–100, *100 = attractive / low bubble risk*) **alongside** as a second lens. Visualised as
a Cycle stage-track, a choropleth map, radars, bars, and per-sleeve profiles. Pure front-end
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
| `src/data.ts` | `SLEEVES` (country→sleeve) + `RAW` (raw metrics) + `STAGES`/`CYCLE_STAGES` (editorial Big Debt Cycle stage) — **the data layer** |
| `src/gauges.ts` | `lin()` + the 6 scoring functions |
| `src/scoring.ts` | `WEIGHTS`, `buildBlockScores()`, `rankBlocks()` |
| `src/visuals.ts` | pure ECharts option builders (cycle / map / radar / bar / profile) + `stageColor`/`stageName` |
| `src/main.ts` | ECharts init, 5 tabs, URL-hash routing, sleeve selector, keyboard 1–5 |
| `src/types.ts` | shared contract |
| `src/world.geo.json` | world geometry, `id` = ISO3 (source: johan/world.geo.json) |
| `scripts/browser-checks.js` | the browser assertions — single source of truth (see below) |
| `scripts/browser-check.sh` | local runner: drives cmux's browser panel against the dev server |
| `scripts/browser-check.ci.mjs` | headless runner: same checks under Playwright Chromium |
| `.github/workflows/browser-checks.yml` | runs the headless checks on every push/PR |

See [`CLAUDE.md`](./CLAUDE.md) for the full methodology (exact factor formulas, weights,
data sources, and the current ranking).

## URL anchors

`#cycle` · `#map` · `#radar` · `#bars` · `#profiles` open a given tab; `#profiles-<ticker>`
(lowercase, e.g. `#profiles-plem`) opens the Profiles tab on a specific sleeve. Number-row
keys **1–5** switch tabs (layout-agnostic, incl. AZERTY).

## Browser checks (feedback loop)

Behaviour is verified in a **real browser**, not just by reading code. There is **one
set of assertions** and **two ways to run them** — they never disagree because both
execute the same file:

```
        scripts/browser-checks.js          ← THE checks (what to assert)
        one IIFE → { passed, failed, results }
               /                    \
              ▼                      ▼
  browser-check.sh           browser-check.ci.mjs
  drives cmux's browser      drives Playwright (headless Chromium)
  panel vs. the dev server   vs. the built dist/index.html
  → fast, you watch it       → hermetic, automated
                                     ▲
                              browser-checks.yml runs it on every push/PR
```

**Two runners, on purpose** — they target different environments, not different tests:

| Runner | Command | When | Why this one |
|---|---|---|---|
| cmux panel | `scripts/browser-check.sh` | Editing locally | Reuses the already-open cmux browser, hits the **hot-reloading dev server** (no build), returns in ~1s — the tight authoring loop. macOS + cmux only. |
| Playwright | `npm run check:ci` | Quick local pass/fail, and **CI** | Self-contained headless Chromium, no cmux/GUI needed. Builds `dist/` first, so it's the trustworthy gate. Runs automatically on every push/PR. |

```bash
npm run dev                  # in one pane
scripts/browser-check.sh     # watch it run in the cmux panel  (local loop)
# — or —
npm run build && npm run check:ci   # headless, same as CI     (the gate)
```

Both print a `✓ / ✗` report and **exit non-zero on any failure**, so either doubles as a gate.

**Adding a check:** edit `scripts/browser-checks.js` only — add a `check('name', () => …)`
that returns `true` to pass or a string describing what it saw to fail. Both runners pick
it up automatically. The loop for any change is: add the check (it goes red) → implement →
run until green → `npx tsc --noEmit`.
