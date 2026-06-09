// In-page browser checks for the Dalio bubble gauge.
// Run via the cmux browser panel: `cmux browser eval --script "$(cat scripts/browser-checks.js)"`.
// Returns { passed, failed, results:[{name, ok, detail}] } — synchronous only (no await).
//
// HOW TO USE THIS FILE IN THE FEEDBACK LOOP:
//   Each time you change behaviour, add/adjust a check() below that asserts the
//   new behaviour from the user's point of view, then run scripts/browser-check.sh
//   until everything is green. A check returns `true` to pass, or a string
//   describing what it actually saw to fail (the string is shown in the report).
(() => {
  const results = [];
  const check = (name, fn) => {
    try {
      const r = fn();
      results.push(r === true ? { name, ok: true, detail: '' } : { name, ok: false, detail: String(r) });
    } catch (e) {
      results.push({ name, ok: false, detail: String((e && e.message) || e) });
    }
  };
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const activeView = () => $('.tab.active')?.dataset.view;

  // ── Smoke: the page mounted and the chart painted ─────────────────────────
  check('page title names the Big Debt Cycle', () =>
    document.title.includes('Big Debt Cycle') || `title was "${document.title}"`);

  check('five view tabs are present (Cycle + Map/Radar/Bars/Profiles)', () =>
    $$('.tab').length === 5 || `found ${$$('.tab').length} tabs`);

  check('Cycle is the default active tab', () =>
    activeView() === 'cycle' || `active tab was "${activeView()}"`);

  check('ECharts canvas painted with non-zero size', () => {
    const c = $('#chart canvas');
    return (c && c.width > 0 && c.height > 0) || `canvas was ${c ? `${c.width}x${c.height}` : 'absent'}`;
  });

  // ── Cycle view: 7 sleeves placed on the 5-stage track ─────────────────────
  check('cycle: 7 sleeves placed across the 5 Big-Cycle stages', () => {
    $('[data-view="cycle"]').click();
    const o = window.__dalioChart.getOption();
    const stages = o.xAxis && o.xAxis[0] && o.xAxis[0].data.length;
    const pts = o.series && o.series[0] && o.series[0].data.length;
    return (stages === 5 && pts === 7) || `stages=${stages} points=${pts}`;
  });

  // ── Interaction: tabs switch the view and update the URL hash ─────────────
  check('clicking Bars activates the bar view and sets #bars', () => {
    $('[data-view="bar"]').click();
    return (activeView() === 'bar' && location.hash === '#bars')
      || `active="${activeView()}" hash="${location.hash}"`;
  });

  check('Profiles tab reveals the sleeve chip selector', () => {
    $('[data-view="profiles"]').click();
    const sel = $('#sleeveSel');
    const visible = getComputedStyle(sel).display !== 'none';
    const chips = sel.querySelectorAll('.chip').length;
    return (visible && chips > 0) || `display="${getComputedStyle(sel).display}" chips=${chips}`;
  });

  check('sleeve chips are hidden on non-Profiles views', () => {
    $('[data-view="map"]').click();
    return getComputedStyle($('#sleeveSel')).display === 'none'
      || `display="${getComputedStyle($('#sleeveSel')).display}" on map view`;
  });

  // ── Routing: a hash change drives the view (deep links / back button) ─────
  check('hash #radar routes to the radar view', () => {
    location.hash = '#radar';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    return activeView() === 'radar' || `active tab was "${activeView()}"`;
  });

  // ── Radar layout: legend must sit at the bottom, not the top ──────────────
  // The chart fills the screen (#chart is inset:0) and the page header is pinned
  // to the top — a top-anchored legend overlaps it. Legend is canvas-rendered so
  // we assert via the exposed chart instance (window.__dalioChart).
  check('radar legend is anchored to the bottom (clears the header)', () => {
    $('[data-view="radar"]').click();
    const o = window.__dalioChart && window.__dalioChart.getOption();
    const lg = o && o.legend && o.legend[0];
    if (!lg) return 'no legend on the radar option';
    return (lg.bottom != null && lg.top == null) || `legend top=${lg.top} bottom=${lg.bottom}`;
  });

  // ── Radar legend isolate: clicking a sleeve shows only that one ───────────
  const radarNames = () =>
    window.__dalioChart.getOption().legend[0].data.map((d) => (typeof d === 'string' ? d : d.name));

  check('radar: clicking a legend item isolates it (only that sleeve selected)', () => {
    $('[data-view="radar"]').click(); // fresh render → all selected
    const c = window.__dalioChart;
    const names = radarNames();
    const target = names[0];
    c.dispatchAction({ type: 'legendToggleSelect', name: target });
    const sel = c.getOption().legend[0].selected || {};
    return names.every((n) => sel[n] === (n === target)) || `selected=${JSON.stringify(sel)}`;
  });

  check('radar: clicking the isolated item again restores all sleeves', () => {
    $('[data-view="radar"]').click(); // fresh render → all selected
    const c = window.__dalioChart;
    const names = radarNames();
    c.dispatchAction({ type: 'legendToggleSelect', name: names[0] }); // isolate
    c.dispatchAction({ type: 'legendToggleSelect', name: names[0] }); // restore
    const sel = c.getOption().legend[0].selected || {};
    return names.every((n) => sel[n] === true) || `selected=${JSON.stringify(sel)}`;
  });

  // ── Bars layout: the plot area must start below the page header ───────────
  // Full-screen chart (#chart inset:0) + a top-anchored header → too small a
  // grid.top runs the first bar under the title/tabs. grid.top is px from the
  // chart (= viewport) top, directly comparable to the header's bottom edge.
  check('bars: grid starts below the header (no overlap)', () => {
    $('[data-view="bar"]').click();
    const o = window.__dalioChart.getOption();
    const gridTop = o.grid && o.grid[0] && o.grid[0].top;
    const headerBottom = document.querySelector('header').getBoundingClientRect().bottom;
    return (typeof gridTop === 'number' && gridTop >= headerBottom)
      || `grid.top=${gridTop} headerBottom=${Math.round(headerBottom)}`;
  });

  // ── Stage-coloured views: map / bars / profiles reflect the cycle stage ───
  check('map: choropleth legend has the 5 Big-Cycle stages', () => {
    $('[data-view="map"]').click();
    const vm = window.__dalioChart.getOption().visualMap;
    const pieces = vm && vm[0] && vm[0].pieces && vm[0].pieces.length;
    return pieces === 5 || `visualMap pieces=${pieces}`;
  });

  check('bars: every bar carries a stage 1–5 and a colour', () => {
    $('[data-view="bar"]').click();
    const d = window.__dalioChart.getOption().series[0].data;
    const ok = d.length === 7
      && d.every((x) => x.stage >= 1 && x.stage <= 5 && x.itemStyle && x.itemStyle.color);
    return ok || `stages=${JSON.stringify(d.map((x) => x.stage))}`;
  });

  check('profiles: stage badge shows and clears the (taller) header', () => {
    $('[data-view="profiles"]').click();
    const t = window.__dalioChart.getOption().title;
    const title = t && t[0];
    const text = (title && title.text) || '';
    const headerBottom = document.querySelector('header').getBoundingClientRect().bottom;
    if (!/Stage \d/.test(text)) return `title="${text}"`;
    return (typeof title.top === 'number' && title.top >= headerBottom)
      || `title.top=${title.top} headerBottom=${Math.round(headerBottom)}`;
  });

  // ── Keyboard shortcuts: number-row keys 1–5 select the five views ─────────
  // Must work by physical key position (e.code), not the character produced —
  // on a French AZERTY layout the top row yields "& é " ' (" unless Shift is held,
  // so a layout-agnostic shortcut keys off Digit1–Digit5. These checks simulate
  // an AZERTY press: physical Digit key, non-digit character, no Shift.
  // Mapping: 1 Cycle · 2 Map · 3 Radar · 4 Bars · 5 Profiles.
  check('physical "3" key selects Radar (AZERTY: yields """, no Shift)', () => {
    $('[data-view="cycle"]').click(); // start from a known view
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit3', key: '"', bubbles: true }));
    return activeView() === 'radar' || `active tab was "${activeView()}" after physical "3"`;
  });

  check('physical "5" key selects Profiles and reveals chips (AZERTY: yields "(")', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit5', key: '(', bubbles: true }));
    const chips = $('#sleeveSel').querySelectorAll('.chip').length;
    return (activeView() === 'profiles' && chips > 0)
      || `active="${activeView()}" chips=${chips} after physical "5"`;
  });

  // Leave the page on the cycle overview so screenshots after a run are predictable.
  $('[data-view="cycle"]').click();

  const passed = results.filter((r) => r.ok).length;
  return { passed, failed: results.length - passed, results };
})();
