# Refreshing the data — how-to

Recipe for refreshing the data: **where it lives**, **how each metric was obtained**, and
**how it redeploys**. The app places each sleeve on Dalio's **Big Debt Cycle** (a 1–5 stage)
and keeps a 5-factor **attractiveness composite** alongside; the methodology, current values
and exact formulas live in [`CLAUDE.md`](../CLAUDE.md).

There are **two kinds of data**, both in `src/data.ts`:

1. **`RAW`** — 13 measured/estimated metrics per sleeve (drives the composite **and** the
   heuristic stage *signal*; recomputes automatically).
2. **`STAGES`** — the **editorial** Big Debt Cycle stage (1–5) + note per sleeve. This is a
   **manual judgement**, NOT computed — it will not refresh itself when you update `RAW`.

## 1. Where the data lives

`RAW` in **`src/data.ts`**: one row per sleeve, now **13 fields** (8 original + 5 Big Debt
Cycle indicators). (`SLEEVES` only changes if the universe changes; `STAGES` is the editorial
stage — see §2b.)

```typescript
PNAS: { fwdPE: 27.0, pb: 7.0, debtToGDP: 122, gdpGrowth: 2.0, epsGrowth: 16, speculation: 0.85, geoRisk: 0.35, mom12m: 22,
        debtServicePct: 18, cbAssetsPct: 22, realRate: 1.5, privateDebtPct: 150, internalConflict: 0.75 },
```

The 0–100 scores, the composite, the ranking **and** the 1–5 stage *signal*
(`gauges.ts → cycleStressSignal`) all recompute **automatically** from `RAW` (via
`gauges.ts` + `scoring.ts`). Never touch the scores by hand. The editorial **stage** in
`STAGES` does **not** recompute — re-assess it by hand (§2b).

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
| `debtServicePct` | IMF Fiscal Monitor; national budgets | General-government **interest expense as % of revenue** (representative country). The debt-service *flow*. | Semi-annual |
| `cbAssetsPct` | Central-bank balance sheets; BIS | Central-bank total assets (or govt-bond holdings) **% of GDP** — proxy for monetization. (E.g. BoJ ≫ 100%.) | Semi-annual |
| `realRate` | Central-bank policy rate − core inflation (IMF / national) | **Real** short-term policy rate, %. Negative = soft money / suppression. | Quarterly |
| `privateDebtPct` | BIS — credit to private non-financial sector | Private (household + corporate) debt **% of GDP**, representative country. | Semi-annual |
| `internalConflict` (0..1) | Judgement — informed by polarization / political-risk indices | Internal political polarization & conflict, 0..1 (parallels `geoRisk`'s *external* read). | As events unfold |

These 5 Big Debt Cycle indicators are **sourced** (IMF Fiscal Monitor / Eurostat 2024, BIS-
via-FRED Q3-2025, central-bank balance sheets 2025–26, policy rate − latest CPI mid-2026),
using the **representative country** per sleeve (PNAS=US, PCEU=euro area, PTPXH=Japan,
PAEJ=China, PINR=India, PALAT=Brazil, PLEM=Saudi/South-Africa blend). `internalConflict`
remains a 0..1 **judgement** (no single source). They feed only the heuristic stage
*signal*, not the composite. The signal is an equal-weighted, bucketed debt/monetary-stress
proxy — it deliberately ignores valuation/speculation, so it diverges from the editorial
stage where that call rests on empire/geopolitics (USA, Europe, EM-EMEA), on financial
repression (Japan: 250% debt but ~4% debt service), or on hard money (Brazil: +10% real rate).

**Aggregation principle**: a sleeve = several countries. Keep a **representative** value
(dominant country) or a **cap-weighted blend** of the main constituents. Document the
choice in a comment in `data.ts` (already done line by line).

**Subjective links** (own them explicitly): `speculation`, `geoRisk`, and the **`lin()`
bounds** in `gauges.ts`. These bounds are a calibration — only move them with a written
justification (anti over-fitting).

## 2b. The editorial stage (`STAGES`)

`STAGES` in `data.ts` is the **authoritative** Big Debt Cycle stage (1–5) + a `note` per
sleeve. It is a **deliberate editorial judgement** from Dalio's framework — *not* derived
from `RAW`, and it does **not** auto-update. The metrics inform it; you make the call.

```typescript
PNAS: { stage: 5, note: 'Late-empire Stage 5 — ~90–95% through the Big Cycle; …' },
```

- **When to re-stage**: a regime change (bubble pops, deleveraging begins, crisis recedes),
  a large move in the indicators, or a fresh Dalio read. Not every numbers refresh.
- **Cross-check against the signal**: `cycleStressSignal` shows a `signal → stage N` on the
  Cycle view when it disagrees. A persistent, widening gap is a prompt to re-examine the
  editorial call (or to accept that the gap is the empire/geopolitics dimension the signal
  can't see). Don't tune the editorial stage just to match the signal.
- Keep the `note` in sync with the metrics it cites.

## 2c. Within-block members (`MEMBERS`)

`MEMBERS` in `data.ts` lists the key individual countries inside each **multi-country** sleeve
(PCEU, PAEJ, PALAT, PLEM — single-country sleeves have none), to surface the divergence a block
average hides (creditor vs debtor, take-off vs chronic). Each member carries:

- `debtToGDP` — IMF general-govt **gross** debt %GDP (2024–25). NB: IMF-gross differs from
  national/Maastricht figures (e.g. Australia gross 51% vs net ~19%); keep the IMF-gross basis.
- `gdpGrowth` — real %, 2025 actual (IMF WEO / national stats via Trading Economics).
  (Taiwan is national-source — not in IMF WEO; its +8.7% is an AI/chip outlier.)
- `archetype` — **editorial** one-liner (creditor / debtor / take-off / chronic / conflict…).

Refresh `debtToGDP`/`gdpGrowth` from the same IMF/BIS cadence as `RAW`; re-judge `archetype`
only on a regime shift. Members are **context** — they don't feed the composite or the signal.

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

1. Gather the up-to-date values (table in section 2 — 13 `RAW` fields).
2. Edit **`RAW`** in `src/data.ts`; update the per-line source/date comment.
3. Re-assess the editorial **`STAGES`** if a regime/indicator shift warrants it (§2b) —
   this is the one part that does not auto-update.
4. `git commit && git push` to `main` (auto-build + deploy).
5. **Sanity-check** the live app: did the ranking move plausibly? Did any `signal → stage`
   divergence open or close? Note large moves and their cause (WEO, 12-month return, etc.).
6. Record the refresh date (commit message + optionally a changelog line here).

> Guardrail: refresh the **inputs** (`RAW`), not the machinery. Changing the weights, the
> `lin()` bounds, or the Euphoria blend (incl. the momentum inversion) is a **model decision** — pre-register it
> separately.
