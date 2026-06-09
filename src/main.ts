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

type View = 'map' | 'radar' | 'bar' | 'profils';

registerWorldMap(echarts, worldGeo as any);

const blocks = buildBlockScores();

// Sleeve le plus attractif = sélection par défaut de l'onglet Profils.
let selected = 0;
blocks.forEach((b, i) => {
  if (b.composite > blocks[selected].composite) selected = i;
});

const chart = echarts.init(document.getElementById('chart'), undefined, { renderer: 'canvas' });

const builders: Record<View, () => echarts.EChartsOption> = {
  map: () => buildMapOption(blocks),
  radar: () => buildRadarOption(blocks),
  bar: () => buildBarOption(blocks),
  profils: () => buildProfileRadarOption(blocks, selected),
};

let view: View = 'map';

function render(): void {
  chart.clear();
  chart.setOption(builders[view]());
}

// ── Sélecteur de sleeve (chips, visible sur l'onglet Profils) ───────────────
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
    if (view === 'profils') {
      history.replaceState(null, '', hashFor());
      render();
    }
  });
  if (i === selected) chip.classList.add('on');
  sleeveSel.appendChild(chip);
});

// ── Routage par ancre d'URL ────────────────────────────────────────────────
// #carte→map · #radar→radar · #barres(|#barre)→bar · #profils(|#profil)→profils
// #profils-<ticker> ouvre Profils sur un sleeve précis (ticker en minuscules).
const VIEW_TO_HASH: Record<View, string> = {
  map: 'carte',
  radar: 'radar',
  bar: 'barres',
  profils: 'profils',
};

function hashFor(): string {
  if (view === 'profils') return `#profils-${blocks[selected].id.toLowerCase()}`;
  return `#${VIEW_TO_HASH[view]}`;
}

function parseHash(): { view: View; sleeve?: number } | null {
  const h = location.hash.replace(/^#/, '').toLowerCase();
  if (!h) return null;
  if (h === 'carte') return { view: 'map' };
  if (h === 'radar') return { view: 'radar' };
  if (h === 'barres' || h === 'barre') return { view: 'bar' };
  if (h === 'profils' || h === 'profil') return { view: 'profils' };
  const m = h.match(/^profils?-(.+)$/);
  if (m) {
    const idx = blocks.findIndex((b) => b.id.toLowerCase() === m[1]);
    return { view: 'profils', sleeve: idx >= 0 ? idx : undefined };
  }
  return null;
}

function activate(v: View, opts: { fromHash?: boolean; sleeve?: number } = {}): void {
  view = v;
  if (opts.sleeve !== undefined) setSelected(opts.sleeve);
  document.querySelectorAll('.tab').forEach((el) =>
    el.classList.toggle('active', (el as HTMLElement).dataset.view === v),
  );
  sleeveSel.style.display = v === 'profils' ? 'flex' : 'none';
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

// Vue initiale : ancre d'URL si présente, sinon la carte.
const initial = parseHash();
if (initial) activate(initial.view, { fromHash: true, sleeve: initial.sleeve });
else activate('map', { fromHash: true });
