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
  check('page title is the Bubble Gauge', () =>
    document.title.includes('Bubble Gauge') || `title was "${document.title}"`);

  check('four view tabs are present', () =>
    $$('.tab').length === 4 || `found ${$$('.tab').length} tabs`);

  check('Map is the default active tab', () =>
    activeView() === 'map' || `active tab was "${activeView()}"`);

  check('ECharts canvas painted with non-zero size', () => {
    const c = $('#chart canvas');
    return (c && c.width > 0 && c.height > 0) || `canvas was ${c ? `${c.width}x${c.height}` : 'absent'}`;
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

  // ── Keyboard shortcuts: number keys 1–4 select the four views ─────────────
  check('pressing "2" selects the Radar view', () => {
    $('[data-view="map"]').click(); // start from a known view
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '2', bubbles: true }));
    return activeView() === 'radar' || `active tab was "${activeView()}" after pressing "2"`;
  });

  check('pressing "4" selects Profiles and reveals chips', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '4', bubbles: true }));
    const chips = $('#sleeveSel').querySelectorAll('.chip').length;
    return (activeView() === 'profiles' && chips > 0)
      || `active="${activeView()}" chips=${chips} after pressing "4"`;
  });

  // Leave the page on the map so screenshots after a run are predictable.
  $('[data-view="map"]').click();

  const passed = results.filter((r) => r.ok).length;
  return { passed, failed: results.length - passed, results };
})();
