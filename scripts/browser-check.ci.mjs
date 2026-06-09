// Headless CI variant of the browser feedback loop.
//
// Runs the SAME assertions as the interactive cmux harness
// (scripts/browser-checks.js) under headless Chromium via Playwright, so CI
// gates on identical behaviour. There is one source of truth for the checks.
//
//   npm run build && npm run check:ci          # checks file://.../dist/index.html
//   CHECK_URL=http://localhost:5173/ npm run check:ci   # check a running server
//
// Exits non-zero if any check fails.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const target = process.env.CHECK_URL || `file://${process.cwd()}/dist/index.html`;
const suite = readFileSync(fileURLToPath(new URL('./browser-checks.js', import.meta.url)), 'utf8');

const browser = await chromium.launch();
let result;
try {
  const page = await browser.newPage();
  await page.goto(target, { waitUntil: 'load', timeout: 30000 });
  // Same mount-readiness gate as the cmux runner: wait for ECharts' canvas.
  await page.waitForSelector('#chart canvas', { timeout: 15000 });
  // eval the shared IIFE and return its { passed, failed, results } payload.
  result = await page.evaluate((src) => eval(src), suite);
} finally {
  await browser.close();
}

console.log(`\nbrowser checks (headless chromium) · ${target}`);
for (const r of result.results) {
  const mark = r.ok ? '✓' : '✗';
  console.log(`  ${mark} ${r.name}` + (!r.ok && r.detail ? `  →  ${r.detail}` : ''));
}
console.log(`\n${result.passed} passed, ${result.failed} failed`);
process.exit(result.failed === 0 ? 0 : 1);
