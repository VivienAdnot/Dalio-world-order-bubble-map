# Dalio-Style Bubble Gauge — Sleeves PEA

Mini-app web qui note **7 sleeves ETF géographiques Amundi PEA** sur **6 facteurs**
type *Dalio Bubble Gauge* (**100 = attractif / peu de bulle**), puis classe, colore
et visualise (carte choroplèthe, radars, barres). Pur front, sans backend ni clé API.

App live : https://vivienadnot.github.io/Dalio-world-order-bubble-map/

## Stack & commandes

- **Vite 5** + **TypeScript 5** + **ECharts 5** (seule dépendance runtime).
- Build en **fichier unique** via `vite-plugin-singlefile` (ECharts inliné, ~1,3 Mo ;
  seules les Google Fonts restent distantes, dégradation propre).

```bash
npm install
npm run dev      # serveur de dev (index.html)
npm run build    # tsc && vite build  -> dist/index.html (un seul fichier)
npm run preview
```

### Déploiement (GitHub Actions)

- `index.html` (racine) = **point d'entrée source** (référence `/src/main.ts`). C'est ce qu'on édite.
- Le bundle **n'est jamais commité** : `dist/` est gitignoré.
- À chaque push sur `main`, `.github/workflows/deploy.yml` lance `npm ci && npm run build`
  puis publie `dist/` sur GitHub Pages (build type = *workflow*, pas *branch*).
- Aucune étape manuelle, aucun bundle dans l'historique git. Même URL live.

## Architecture (flux de données)

```
data.ts      SLEEVES (pays->sleeve) + RAW (métriques brutes/sleeve)
   |
gauges.ts    lin() + 6 fonctions de score (brut -> 0..100) ; map GAUGES
   |
scoring.ts   WEIGHTS ; buildBlockScores() -> BlockScore[] ; rankBlocks()
   |
visuals.ts   builders EChartsOption purs (aucun état) + couleurs/labels
   |
main.ts      init ECharts, 4 onglets, routage par ancre #, sélecteur de sleeve
```

- `types.ts` — contrat partagé (`Factor`, `FACTOR_ORDER`, `BlockMetrics`, `Sleeve`, `BlockScore`).
- `world.geo.json` — géométrie monde, `id` = ISO3 (source johan/world.geo.json).
  HKG & SGP absents (trop petits, sans impact carte).
- Un seul canvas `#chart` ; chaque onglet recalcule l'option ECharts et appelle `setOption`.

### Surface de `visuals.ts`

- `BANDS` → vert 70–100, jaune 40–69, rouge 0–39 ; `colorOf(score)`, `FACTOR_LABELS` (FR).
- `registerWorldMap(echarts, geojson)` (copie `feature.id` → `properties.iso3`, match par ISO3).
- `buildMapOption`, `buildRadarOption` (7 sleeves superposés), `buildBarOption`,
  `buildProfileRadarOption(blocks, selected)` (radar large : sleeve sélectionné rempli
  vs moyenne des 7 en pointillés, labels d'axes colorés, badge composite).

### Onglets + routage (`main.ts`)

- Vues : `map` / `radar` / `bar` / `profils` (boutons `.tab[data-view]`).
- **Ancres d'URL** (lues au chargement et sur `hashchange`) :
  `#carte`→map, `#radar`, `#barres`(ou `#barre`)→bar, `#profils`(ou `#profil`).
- `#profils-<ticker>` ouvre Profils sur un sleeve précis (ex. `#profils-plem`, ticker en minuscules).
- Cliquer un onglet écrit l'ancre ; choisir un sleeve écrit `#profils-<id>` via `replaceState`.

## Univers : 7 sleeves (1 ETF Amundi PEA = 1 bloc)

| Ticker | Sleeve | Indice | Membres ISO3 (partition carte) |
|---|---|---|---|
| PNAS | USA | Nasdaq-100 | USA |
| PCEU | Europe | MSCI Europe | AUT BEL DNK FIN FRA DEU IRL ITA NLD NOR PRT ESP SWE CHE GBR |
| PTPXH | Japon | TOPIX | JPN |
| PAEJ | Asie-Pac ex-Japon | MSCI AC Asia Pacific ex Japan | AUS HKG NZL SGP CHN KOR TWN IDN MYS PHL THA |
| PINR | Inde | MSCI India | IND |
| PALAT | LatAm | MSCI EM Latin America | BRA MEX CHL COL PER |
| PLEM | EM-EMEA | MSCI EM EMEA | POL CZE HUN GRC TUR SAU ARE QAT KWT ZAF |

- **Inde** (PINR) découpée de PAEJ ; **Chine** reste dans PAEJ (pas de sleeve Chine).
  Pour sortir la Chine : créer `PASI { members: ['CHN'] }` et retirer `'CHN'` de PAEJ.
- EM large (PAEEM/PEMS) volontairement **non** utilisé (doublon avec les 3 sleeves EM régionaux).

## Méthode : 6 facteurs (formules exactes)

Moteur commun, borné/clampé, `invert` pour « moins = mieux » :

```
lin(v, lo, hi, invert=false):
  t = clamp((v - lo) / (hi - lo), 0, 1)
  return round((invert ? 1 - t : t) * 100)
```

| # | Facteur | Formule | Sens |
|---|---|---|---|
| 1 | valuations | `0.7·lin(fwdPE,8,30,inv) + 0.3·lin(pb,1,8,inv)` | cher = bas |
| 2 | debt | `lin(debtToGDP,40,160,inv)` | dette/PIB élevée = bas |
| 3 | growth | `0.5·lin(gdpGrowth,0,7) + 0.5·lin(epsGrowth,0,18)` | plus = mieux |
| 4 | leverage | `lin(speculation,0,1,inv)` | euphorie = bas |
| 5 | geo | `lin(geoRisk,0,1,inv)` | risque élevé = bas |
| 6 | sentiment | `lin(mom12m,-10,35)` | momentum positif (trend / Antonacci) |

**Composite** = `round(0.30·Valo + 0.25·Dette + 0.20·Croiss + 0.10·Levier + 0.10·Géo + 0.05·Sent)`.

> ⚠️ Choix de modélisation : le **Sentiment n'est PAS inversé** (forte hausse récente =
> score haut, logique trend). Pour le traiter en euphorie, repasser `invert=true` dans
> `scoreSentiment`.

## Données brutes actuelles (`RAW`, mid-2026)

| Ticker | fwdPE | pb | debt%PIB | gdp% | eps% | spec | geo | mom12m |
|---|---|---|---|---|---|---|---|---|
| PNAS | 27.0 | 7.0 | 122 | 2.0 | 16 | 0.85 | 0.35 | 22 |
| PCEU | 14.5 | 2.1 | 90 | 1.3 | 7 | 0.35 | 0.40 | 12 |
| PTPXH | 15.5 | 1.5 | 250 | 0.7 | 8 | 0.35 | 0.30 | 13 |
| PAEJ | 16.0 | 1.9 | 65 | 4.0 | 12 | 0.55 | 0.60 | 18 |
| PINR | 23.0 | 3.9 | 83 | 6.3 | 14 | 0.65 | 0.40 | 6 |
| PALAT | 10.0 | 1.6 | 75 | 2.0 | 9 | 0.25 | 0.45 | 9 |
| PLEM | 11.0 | 1.6 | 50 | 3.0 | 8 | 0.40 | 0.75 | 10 |

**Sources & confiance** : `fwdPE` (Siblis Research, P/E par pays au 31/12/2025, agrégés
par sleeve = proxy) ; `gdpGrowth` (FMI WEO janv.+avr. 2026) ; `debtToGDP` (FMI, dette
pub. brute représentative) ; `pb`/`epsGrowth`/`mom12m` = estimations à affiner ;
`speculation`/`geoRisk` = **0..1, dires d'analyste** (geoRisk Golfe/EMEA relevé suite au
conflit Moyen-Orient, WEO avr. 2026). Les 4 maillons subjectifs = bornes des `lin()`,
`speculation`, `geoRisk`, signe du Sentiment. Le reste est mécanique/reproductible.

## Classement courant (calculé, mid-2026)

| Rang | Ticker | Composite | Couleur |
|---|---|---|---|
| 1 | PLEM | 69 | 🟡 |
| 2 | PALAT | 68 | 🟡 |
| 3 | PAEJ | 65 | 🟡 |
| 4 | PCEU | 57 | 🟡 |
| 5 | PINR | 56 | 🟡 |
| 6 | PTPXH | 44 | 🟡 |
| 7 | PNAS | 36 | 🔴 |

(Aucun sleeve ≥70 après le passage du Sentiment en momentum-positif ; PLEM 70→69.)

## TODO / pistes

1. Remplacer les métriques estimées (`pb`, `epsGrowth`, `mom12m`, `speculation`, `geoRisk`)
   par un **loader de données réelles** (API / CSV).
2. GeoJSON plus fin si HK/Singapour doivent s'afficher.
3. Option : layout radar mobile-first (2 colonnes).
4. Garde-fou anti sur-ingénierie : toute modif du scoring reste pré-enregistrée et justifiée.
