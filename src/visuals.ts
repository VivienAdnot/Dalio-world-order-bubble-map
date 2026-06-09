import type { EChartsOption } from 'echarts';
import { CYCLE_STAGES } from './data';
import { FACTOR_ORDER, type BlockScore, type Factor } from './types';

const STAGE_BY_NUM = new Map(CYCLE_STAGES.map((s) => [s.stage, s]));
const lastStage = CYCLE_STAGES[CYCLE_STAGES.length - 1];
export const stageColor = (stage: number): string => (STAGE_BY_NUM.get(stage) ?? lastStage).color;
export const stageName = (stage: number): string => (STAGE_BY_NUM.get(stage) ?? lastStage).name;

// Piecewise legend for stage-coloured views (map): one piece per stage.
const STAGE_PIECES = CYCLE_STAGES.map((s) => ({
  value: s.stage,
  color: s.color,
  label: `${s.stage} · ${s.name}`,
}));

// ── Colour bands ───────────────────────────────────────────────────────────
// 🟢 70–100 attractive · 🟡 40–69 moderate risk · 🔴 0–39 high risk
export interface Band {
  min: number;
  max: number;
  color: string;
  label: string;
}

export const BANDS: Band[] = [
  { min: 70, max: 100, color: '#3fb97a', label: 'Attractive' },
  { min: 40, max: 69, color: '#e8b23a', label: 'Moderate risk' },
  { min: 0, max: 39, color: '#e1495b', label: 'High risk' },
];

const NO_DATA = '#333b47'; // grey "outside PEA universe" — kept clearly lighter than the page bg (#0c0e12)

const bandOf = (score: number): Band =>
  BANDS.find((b) => score >= b.min && score <= b.max) ?? BANDS[2];

export const colorOf = (score: number): string => bandOf(score).color;

export const FACTOR_LABELS: Record<Factor, string> = {
  valuations: 'Valuation',
  debt: 'Debt',
  growth: 'Growth',
  leverage: 'Leverage/Spec.',
  geo: 'Geopolitics',
  sentiment: 'Sentiment',
};

// ── Big Debt Cycle track ───────────────────────────────────────────────────
// Each sleeve placed on its current stage (1 sound money … 5 going broke).
// Sleeves sharing a stage stack vertically within that column.
export function buildCycleOption(blocks: BlockScore[]): EChartsOption {
  const cats = CYCLE_STAGES.map((s) => `${s.stage} · ${s.name}`);
  const byStage = new Map<number, BlockScore[]>();
  blocks.forEach((b) => {
    const arr = byStage.get(b.stage) ?? [];
    arr.push(b);
    byStage.set(b.stage, arr);
  });
  const maxStack = Math.max(1, ...[...byStage.values()].map((a) => a.length));
  const short = (label: string) => (label === 'Asia-Pac ex-Japan' ? 'Asia-Pac' : label);

  const points = blocks.map((b) => {
    const group = byStage.get(b.stage)!;
    // Centre each stage's stack vertically; tight spacing regardless of height.
    const y = group.indexOf(b) - (group.length - 1) / 2;
    const diverges = b.stageSignal !== b.stage;
    return {
      value: [b.stage - 1, y],
      name: b.label,
      stageNote: b.stageNote,
      stageNum: b.stage,
      stageSignal: b.stageSignal,
      m: b.metrics,
      itemStyle: { color: stageColor(b.stage) },
      label: {
        show: true,
        position: 'top' as const,
        distance: 10,
        formatter:
          `{name|${short(b.label)}}\n{score|composite ${b.composite}}`
          + (diverges ? `\n{sig|signal → stage ${b.stageSignal}}` : ''),
        rich: {
          name: { color: '#e9ecf1', fontSize: 13, fontWeight: 600, lineHeight: 16 },
          score: { color: '#8a929e', fontSize: 10.5, fontFamily: 'monospace', lineHeight: 13 },
          sig: { color: '#6f7888', fontSize: 10, fontFamily: 'monospace', lineHeight: 13 },
        },
      },
    };
  });

  return {
    backgroundColor: 'transparent',
    grid: { left: 24, right: 24, top: 156, bottom: 56 },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15,18,24,.96)',
      borderColor: 'rgba(255,255,255,.08)',
      borderWidth: 1,
      textStyle: { color: '#e9ecf1' },
      extraCssText: 'max-width:340px;white-space:normal;border-radius:13px',
      formatter: (p: any) => {
        const m = p.data.m;
        const sig = p.data.stageSignal;
        const ed = p.data.stageNum;
        const indicators = [
          ['Govt debt', `${m.debtToGDP}% GDP`],
          ['Debt service', `${m.debtServicePct}% of revenue`],
          ['CB balance sheet', `${m.cbAssetsPct}% GDP`],
          ['Private debt', `${m.privateDebtPct}% GDP`],
          ['Real policy rate', `${m.realRate}%`],
          ['Internal conflict', `${Math.round(m.internalConflict * 100)}/100`],
          ['External geo-risk', `${Math.round(m.geoRisk * 100)}/100`],
        ]
          .map(
            ([k, v]) =>
              `<div style="display:flex;justify-content:space-between;gap:16px;font-size:11px;color:#838c99"><span>${k}</span><span style="color:#e9ecf1">${v}</span></div>`,
          )
          .join('');
        return (
          `<div style="min-width:230px"><b style="font-size:14px">${p.name}</b> · Stage ${ed}` +
          `<div style="font-size:10.5px;color:#5a626e;margin-bottom:8px">data signal → stage ${sig}${sig !== ed ? ' (diverges)' : ''}</div>` +
          `${indicators}<div style="font-size:10.5px;color:#8a929e;margin-top:8px;white-space:normal">${p.data.stageNote}</div></div>`
        );
      },
    },
    xAxis: {
      type: 'category',
      data: cats,
      position: 'bottom',
      axisLabel: { color: '#c7ccd4', fontSize: 12, interval: 0 },
      splitLine: { show: true, lineStyle: { color: 'rgba(255,255,255,.06)' } },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,.12)' } },
      axisTick: { show: false },
      boundaryGap: true,
    },
    // Symmetric range centres the stacks vertically with comfortable spacing.
    yAxis: { type: 'value', show: false, min: -maxStack, max: maxStack, inverse: true },
    series: [{ type: 'scatter', symbolSize: 20, data: points, z: 3 }],
  };
}

// ── Map ──────────────────────────────────────────────────────────────────
// Registers the world geometry under an ECharts map name; copies
// feature.id (ISO3) to properties.iso3 for the `nameProperty` match.
export function registerWorldMap(
  echarts: { registerMap: (name: string, geo: any) => void },
  geojson: { features: Array<{ id?: string; properties?: Record<string, unknown> }> },
  name = 'world',
): void {
  for (const f of geojson.features) {
    f.properties = f.properties ?? {};
    f.properties.iso3 = f.id;
  }
  echarts.registerMap(name, geojson);
}

export function buildMapOption(
  blocks: BlockScore[],
  opts: { mapName?: string } = {},
): EChartsOption {
  const byCountry = new Map<string, BlockScore>();
  for (const b of blocks) for (const iso3 of b.members) byCountry.set(iso3, b);

  // value = Big Debt Cycle stage (drives the choropleth colour); composite kept
  // in the payload for the tooltip (the parallel attractiveness lens).
  const data = [...byCountry.entries()].map(([iso3, b]) => ({
    name: iso3,
    value: b.stage,
    _b: { id: b.id, label: b.label, index: b.index, factors: b.factors, composite: b.composite, stage: b.stage },
  }));

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15,18,24,.96)',
      borderColor: 'rgba(255,255,255,.08)',
      borderWidth: 1,
      padding: 14,
      extraCssText: 'border-radius:13px',
      textStyle: { color: '#e9ecf1' },
      formatter: (p: any) => {
        const b = p.data?._b;
        if (!b)
          return `<b>${p.name}</b><br/><span style="color:#838c99">Outside PEA universe</span>`;
        const c = stageColor(b.stage);
        const rows = FACTOR_ORDER.map(
          (f) =>
            `<div style="display:flex;justify-content:space-between;gap:16px;font-size:11px;color:#838c99">
             <span>${FACTOR_LABELS[f]}</span><span style="color:#e9ecf1">${b.factors[f]}</span></div>`,
        ).join('');
        return `<div style="min-width:210px">
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:14px">
            <b style="font-size:15px">${b.label}</b><span style="color:${c};font-size:13px;font-weight:700">Stage ${b.stage} · ${stageName(b.stage)}</span></div>
          <div style="font-size:10.5px;color:#5a626e;margin-bottom:8px">${b.id} · ${b.index ?? ''} · composite ${b.composite}</div>${rows}</div>`;
      },
    },
    visualMap: {
      type: 'piecewise',
      left: 24,
      bottom: 28,
      orient: 'vertical',
      itemWidth: 13,
      itemHeight: 13,
      itemGap: 8,
      textStyle: { color: '#b6bdc8', fontSize: 11 },
      pieces: STAGE_PIECES,
      outOfRange: { color: NO_DATA },
      seriesIndex: 0,
    },
    series: [
      {
        type: 'map',
        map: opts.mapName ?? 'world',
        nameProperty: 'iso3',
        roam: true,
        scaleLimit: { min: 1, max: 8 },
        selectedMode: false,
        itemStyle: { areaColor: NO_DATA, borderColor: '#0b0d11', borderWidth: 0.6 },
        emphasis: {
          label: { show: false },
          // keep each country's own band colour on hover (default ECharts
          // highlight is gold, which collides with the moderate-risk yellow)
          itemStyle: { areaColor: 'inherit', borderColor: '#fff', borderWidth: 1.1 },
        },
        data,
      },
    ],
  };
}

// ── Radar (7 sleeves overlaid) ─────────────────────────────────────────────
const RADAR_PALETTE = ['#5b8def', '#3fb97a', '#e8b23a', '#e1495b', '#9b6ef3', '#27c4c4', '#e98a3a'];

export function buildRadarOption(blocks: BlockScore[]): EChartsOption {
  return {
    backgroundColor: 'transparent',
    tooltip: {},
    color: RADAR_PALETTE,
    legend: {
      data: blocks.map((b) => `${b.label} (${b.id})`),
      textStyle: { color: '#b6bdc8' },
      // Anchor to the bottom so the legend can't collide with the page header
      // (which is absolutely positioned at the top of the full-screen chart).
      bottom: 12,
      type: 'scroll',
    },
    radar: {
      // Match the profiles radar: pushed down + sized so the top vertex clears the header.
      center: ['50%', '54%'],
      radius: '62%',
      indicator: FACTOR_ORDER.map((f) => ({ name: FACTOR_LABELS[f], max: 100 })),
      axisName: { color: '#8a929e', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,.08)' } },
      splitArea: { areaStyle: { color: ['transparent', 'rgba(255,255,255,.02)'] } },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,.08)' } },
    },
    series: [
      {
        type: 'radar',
        symbolSize: 4,
        areaStyle: { opacity: 0.05 },
        data: blocks.map((b) => ({
          name: `${b.label} (${b.id})`,
          value: FACTOR_ORDER.map((f) => b.factors[f]),
        })),
      },
    ],
  };
}

// ── Composite bars ─────────────────────────────────────────────────────────
export function buildBarOption(blocks: BlockScore[]): EChartsOption {
  const sorted = [...blocks].sort((a, b) => a.composite - b.composite);
  return {
    backgroundColor: 'transparent',
    // top clears the page header (kicker + title + tabs) — the chart is
    // full-screen (#chart is inset:0), so a small top would run the first bar
    // and the 40/70 threshold labels up under the header.
    grid: { left: 128, right: 48, top: 150, bottom: 24 },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: { color: '#8a929e' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,.06)' } },
    },
    yAxis: {
      type: 'category',
      data: sorted.map((b) => `${b.label}\n${b.id}`),
      axisLabel: { color: '#c7ccd4', fontSize: 12, lineHeight: 14 },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,.12)' } },
    },
    series: [
      {
        type: 'bar',
        barWidth: '58%',
        // Bar length = attractiveness composite; colour = Big Debt Cycle stage.
        data: sorted.map((b) => ({
          value: b.composite,
          stage: b.stage,
          itemStyle: { color: stageColor(b.stage), borderRadius: [0, 4, 4, 0] },
        })),
        label: {
          show: true,
          position: 'right',
          formatter: (p: any) => `{v|${p.value}}  {s|stage ${p.data.stage}}`,
          rich: {
            v: { color: '#e9ecf1', fontWeight: 600, fontSize: 13 },
            s: { color: '#8a929e', fontSize: 11, fontFamily: 'monospace' },
          },
        },
        markLine: {
          symbol: 'none',
          silent: true,
          lineStyle: { color: 'rgba(255,255,255,.18)', type: 'dashed' },
          label: { color: '#5a626e', fontSize: 10 },
          data: [{ xAxis: 40 }, { xAxis: 70 }],
        },
      },
    ],
  };
}

// ── Profile radar (selected sleeve vs the average of the 7) ─────────────────
const PROFILE_AXIS_COLORS = ['#5b8def', '#e98a3a', '#3fb97a', '#9b6ef3', '#e1495b', '#27c4c4'];

export function buildProfileRadarOption(blocks: BlockScore[], selected = 0): EChartsOption {
  const block = blocks[Math.max(0, Math.min(selected, blocks.length - 1))];
  const c = colorOf(block.composite);
  const avg = FACTOR_ORDER.map((f) =>
    Math.round(blocks.reduce((acc, b) => acc + b.factors[f], 0) / blocks.length),
  );

  // `nameGap` is accepted by ECharts at runtime but missing from its radar types:
  // we go through an intermediate const to avoid the excess-property check.
  const option = {
    backgroundColor: 'transparent',
    // Headline = Big Debt Cycle stage badge; composite kept alongside in the subtext.
    // top:188 clears the page header — Profiles also shows the sleeve-chip row,
    // so its header is taller than the other views.
    title: {
      right: '5%',
      top: 188,
      textAlign: 'right',
      text: `Stage ${block.stage} · ${stageName(block.stage)}`,
      subtext: `composite ${block.composite}  ·  data signal: stage ${block.stageSignal}`,
      textStyle: { color: stageColor(block.stage), fontSize: 22, fontWeight: 700, fontFamily: 'monospace' },
      subtextStyle: { color: '#838c99', fontSize: 11, fontFamily: 'monospace' },
    },
    legend: {
      bottom: 12,
      itemGap: 24,
      textStyle: { color: '#b6bdc8', fontSize: 12 },
      data: [`${block.label} (${block.id})`, 'Average of 7 sleeves'],
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15,18,24,.96)',
      borderColor: 'rgba(255,255,255,.08)',
      borderWidth: 1,
      textStyle: { color: '#e9ecf1' },
      formatter: (p: any) =>
        `<b>${p.seriesName}</b><br/>` +
        FACTOR_ORDER.map((f, i) => `${FACTOR_LABELS[f]} : ${p.value[i]}`).join('<br/>'),
    },
    radar: {
      center: ['50%', '54%'],
      radius: '62%',
      splitNumber: 4,
      indicator: FACTOR_ORDER.map((f, i) => ({
        name: FACTOR_LABELS[f],
        max: 100,
        color: PROFILE_AXIS_COLORS[i],
      })),
      axisName: { fontSize: 13, fontWeight: 500 },
      nameGap: 8,
      splitLine: { lineStyle: { color: 'rgba(255,255,255,.10)' } },
      splitArea: { areaStyle: { color: ['rgba(255,255,255,.015)', 'rgba(255,255,255,.04)'] } },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,.10)' } },
    },
    series: [
      {
        name: 'Average of 7 sleeves',
        type: 'radar',
        symbol: 'none',
        lineStyle: { color: '#9aa3b0', width: 1.5, type: 'dashed' },
        areaStyle: { opacity: 0 },
        data: [{ value: avg }],
        z: 2,
      },
      {
        name: `${block.label} (${block.id})`,
        type: 'radar',
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { color: c, width: 2.5 },
        areaStyle: { color: c, opacity: 0.24 },
        itemStyle: { color: c, borderColor: '#fff', borderWidth: 1.5, shadowBlur: 14, shadowColor: c },
        data: [{ value: FACTOR_ORDER.map((f) => block.factors[f]) }],
        z: 3,
      },
    ],
  };
  return option as EChartsOption;
}
