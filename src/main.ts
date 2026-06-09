import * as echarts from 'echarts';
import worldGeo from './world.geo.json';
import { buildBlockScores } from './scoring';
import {
  buildBarOption,
  buildMapOption,
  buildProfileRadarOption,
  buildRadarOption,
  colorOf,
  registerWorldMap,
} from './visuals';

type View = 'map' | 'radar' | 'bar' | 'profiles';

registerWorldMap(echarts, worldGeo as any);

const blocks = buildBlockScores();

// Most attractive sleeve = default selection of the Profiles tab.
let selected = 0;
blocks.forEach((b, i) => {
  if (b.composite > blocks[selected].composite) selected = i;
});

const chart = echarts.init(document.getElementById('chart'), undefined, { renderer: 'canvas' });

// Test seam: the ECharts canvas has no DOM nodes to assert against, so expose the
// instance for the browser checks (scripts/browser-checks.js). Harmless in prod.
(window as unknown as { __dalioChart?: echarts.ECharts }).__dalioChart = chart;

const builders: Record<View, () => echarts.EChartsOption> = {
  map: () => buildMapOption(blocks),
  radar: () => buildRadarOption(blocks),
  bar: () => buildBarOption(blocks),
  profiles: () => buildProfileRadarOption(blocks, selected),
};

let view: View = 'map';

// Name of the sleeve currently isolated on the radar legend (null = show all).
let radarSolo: string | null = null;

function render(): void {
  chart.clear();
  chart.setOption(builders[view]());
  radarSolo = null; // a fresh render shows every series
}

// Radar: clicking a legend item isolates that sleeve (only it stays selected);
// clicking the already-isolated item restores all. Scoped to the radar view —
// the profiles legend keeps ECharts' default toggle.
chart.on('legendselectchanged', (params: any) => {
  if (view !== 'radar') return;
  radarSolo = radarSolo === params.name ? null : params.name;
  const selected: Record<string, boolean> = {};
  Object.keys(params.selected).forEach((name) => {
    selected[name] = radarSolo == null ? true : name === radarSolo;
  });
  chart.setOption({ legend: { selected } });
});

// ── Sleeve selector (chips, visible on the Profiles tab) ────────────────────
const sleeveSel = document.getElementById('sleeveSel') as HTMLElement;

function setSelected(i: number): void {
  selected = i;
  sleeveSel.querySelectorAll('.chip').forEach((el, n) => el.classList.toggle('on', n === i));
}

blocks.forEach((b, i) => {
  const chip = document.createElement('button');
  chip.className = 'chip';
  chip.innerHTML = `<span class="d" style="background:${colorOf(b.composite)}"></span>${b.label} · ${b.composite}`;
  chip.addEventListener('click', () => {
    setSelected(i);
    if (view === 'profiles') {
      history.replaceState(null, '', hashFor());
      render();
    }
  });
  if (i === selected) chip.classList.add('on');
  sleeveSel.appendChild(chip);
});

// ── URL-hash routing ───────────────────────────────────────────────────────
// #map→map · #radar→radar · #bars(|#bar)→bar · #profiles(|#profile)→profiles
// #profiles-<ticker> opens Profiles on a specific sleeve (lowercase ticker).
const VIEW_TO_HASH: Record<View, string> = {
  map: 'map',
  radar: 'radar',
  bar: 'bars',
  profiles: 'profiles',
};

function hashFor(): string {
  if (view === 'profiles') return `#profiles-${blocks[selected].id.toLowerCase()}`;
  return `#${VIEW_TO_HASH[view]}`;
}

function parseHash(): { view: View; sleeve?: number } | null {
  const h = location.hash.replace(/^#/, '').toLowerCase();
  if (!h) return null;
  if (h === 'map') return { view: 'map' };
  if (h === 'radar') return { view: 'radar' };
  if (h === 'bars' || h === 'bar') return { view: 'bar' };
  if (h === 'profiles' || h === 'profile') return { view: 'profiles' };
  const m = h.match(/^profiles?-(.+)$/);
  if (m) {
    const idx = blocks.findIndex((b) => b.id.toLowerCase() === m[1]);
    return { view: 'profiles', sleeve: idx >= 0 ? idx : undefined };
  }
  return null;
}

function activate(v: View, opts: { fromHash?: boolean; sleeve?: number } = {}): void {
  view = v;
  if (opts.sleeve !== undefined) setSelected(opts.sleeve);
  document.querySelectorAll('.tab').forEach((el) =>
    el.classList.toggle('active', (el as HTMLElement).dataset.view === v),
  );
  sleeveSel.style.display = v === 'profiles' ? 'flex' : 'none';
  if (!opts.fromHash) history.replaceState(null, '', hashFor());
  render();
}

document.querySelectorAll<HTMLElement>('.tab').forEach((tab) =>
  tab.addEventListener('click', () => activate(tab.dataset.view as View)),
);

window.addEventListener('hashchange', () => {
  const parsed = parseHash();
  if (parsed) activate(parsed.view, { fromHash: true, sleeve: parsed.sleeve });
});

window.addEventListener('resize', () => chart.resize());

// Keyboard shortcuts: number-row keys 1–4 jump straight to a view (Map/Radar/Bars/Profiles).
// Keyed off physical position (e.code) so it works on any layout without Shift —
// e.g. French AZERTY, where the unshifted top row yields "& é " '" rather than digits.
const CODE_TO_VIEW: Record<string, View> = {
  Digit1: 'map',
  Digit2: 'radar',
  Digit3: 'bar',
  Digit4: 'profiles',
};
window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const v = CODE_TO_VIEW[e.code];
  if (v) activate(v);
});

// Initial view: URL hash if present, otherwise the map.
const initial = parseHash();
if (initial) activate(initial.view, { fromHash: true, sleeve: initial.sleeve });
else activate('map', { fromHash: true });
