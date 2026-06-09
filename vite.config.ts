import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Source entry = app.html (références /src/main.ts). Build en fichier unique
// (ECharts inliné) -> dist/app.html, que `npm run deploy` copie en index.html
// à la racine (servi par GitHub Pages). On garde l'entrée source séparée du
// bundle publié pour qu'un rebuild ne clobber jamais le point d'entrée.
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: {
    rollupOptions: {
      input: 'app.html',
    },
  },
});
