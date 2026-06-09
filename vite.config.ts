import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Entrée source = index.html (racine, références /src/main.ts). Build en
// fichier unique (ECharts inliné) -> dist/index.html, publié sur GitHub Pages
// par le workflow Actions (.github/workflows/deploy.yml). Le bundle n'est
// jamais commité : `dist/` est gitignoré.
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
});
