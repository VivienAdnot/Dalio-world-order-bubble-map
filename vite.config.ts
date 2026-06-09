import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Source entry = index.html (root, references /src/main.ts). Single-file build
// (ECharts inlined) -> dist/index.html, published to GitHub Pages by the Actions
// workflow (.github/workflows/deploy.yml). The bundle is never committed:
// `dist/` is gitignored.
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
});
