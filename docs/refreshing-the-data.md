# Refreshing the data — how-to

Recipe for refreshing the Bubble Gauge numbers: **where the data lives**, **how each
metric was obtained**, and **how it redeploys**. The methodology, current values and exact
formulas live in [`CLAUDE.md`](../CLAUDE.md).

## 1. Where the data lives

Everything is in **`src/data.ts`**, the **`RAW`** object: one row per sleeve (ticker), 8
raw fields. This is the **only** file to touch for a numbers refresh. (`SLEEVES` only
changes if the universe changes: adding/removing an ETF or a country.)

```typescript
PNAS: { fwdPE: 27.0, pb: 7.0, debtToGDP: 122, gdpGrowth: 2.0, epsGrowth: 16, speculation: 0.85, geoRisk: 0.35, mom12m: 22 },
```

The 0–100 scores, the composite and the ranking all recompute **automatically** from these
8 fields (via `gauges.ts` + `scoring.ts`). Never touch the scores by hand.

## 2. Recipe per metric (how each was obtained)

| Field | Source | How to obtain / aggregate | Suggested cadence |
|---|---|---|---|
| `fwdPE` | Siblis Research — forward P/E per country (end-of-quarter snapshot); justETF (ETF factsheet) | Take the forward P/E of the sleeve's national indices, then a **representative / cap-weighted blend** (e.g. PCEU = CAC/DAX/FTSE; PAEJ = China/Taiwan/Korea/Australia). For single-country sleeves (PNAS, PTPXH, PINR), use the index P/E directly. | Quarterly |
| `pb` | justETF (Amundi ETF factsheet); Siblis | Take the price/book shown on the ETF's own factsheet (avoids aggregating by hand). | Quarterly |
| `debtToGDP` | IMF — DataMapper, "General government gross debt (% of GDP)" | **Representative** value for the sleeve: dominant country, or a weighting of the main countries. (Level, not trend.) | Semi-annual (WEO Apr / Oct) |
| `gdpGrowth` | IMF WEO + DataMapper, real GDP growth (current-year forecast) | Growth of the sleeve's representative region / country. | Each WEO (Jan / Apr / Jul / Oct) |
| `epsGrowth` | Analyst consensus — JPM Guide to the Markets, brokers, index factsheets | Forward (12 m) EPS growth of the index/sleeve. Order-of-magnitude is acceptable. | Quarterly |
| `mom12m` | justETF / Boursorama / TradingView | Trailing 12-month **price** return of the sleeve's ETF (PNAS, PCEU…). Read it directly, don't estimate. | Monthly |
| `speculation` (0..1) | Judgement — no database "provides" this | Map onto 0..1 from euphoria proxies: valuation vs history (percentile), margin debt, IPO volume, options/retail activity. 0 = flat, 1 = max froth. | Quarterly |
| `geoRisk` (0..1) | Judgement — informed by WEO (risk section); GPR (Geopolitical Risk) index | Map onto 0..1: active conflicts, energy/trade dependence, sanctions. (E.g. EMEA raised to 0.75 after the Middle East conflict, WEO Apr 2026.) | As events unfold |

**Aggregation principle**: a sleeve = several countries. Keep a **representative** value
(dominant country) or a **cap-weighted blend** of the main constituents. Document the
choice in a comment in `data.ts` (already done line by line).

**Subjective links** (own them explicitly): `speculation`, `geoRisk`, and the **`lin()`
bounds** in `gauges.ts`. These bounds are a calibration — only move them with a written
justification (anti over-fitting).

## 3. How it redeploys

GitHub Pages serves the **compiled** `dist/index.html` (ECharts inlined), **not**
`src/data.ts`, so the source has to be rebuilt. **This is already automatic.**

### Path A — automatic (default; editing the data = a deploy)

`.github/workflows/deploy.yml` runs on every push to `main`: it does `npm ci && npm run
build` and publishes `dist/` to Pages (build type = *workflow*, not *branch*). The bundle
is **never committed** (`dist/` is gitignored).

```bash
# 1. edit src/data.ts (the RAW object), refresh the per-line source/date comment
git add -A && git commit -m "data: refresh mid-2026" && git push
# Pages rebuilds and updates in ~1 min — nothing else to do.
```

### Path B — manual (fallback, e.g. to preview the exact built file locally)

```bash
npm run build                  # -> dist/index.html
npm run preview                # serve the built single file locally to eyeball it
```

Only commit `src/data.ts` — never the built bundle.

## 4. Refresh checklist

1. Gather the up-to-date values (table in section 2).
2. Edit **`RAW`** in `src/data.ts`; update the per-line source/date comment.
3. `git commit && git push` to `main` (auto-build + deploy).
4. **Sanity-check** the live app: did the ranking move plausibly? Note any large moves and
   their cause (e.g. WEO, 12-month return).
5. Record the refresh date (commit message + optionally a changelog line here).

> Guardrail: refresh the **inputs** (`RAW`), not the machinery. Changing the weights, the
> `lin()` bounds, or the sign of Sentiment is a **model decision** — pre-register it
> separately.
