import { defineConfig } from 'vite';
import { resolve } from 'path';

/** GitHub Pages project site: https://<user>.github.io/lightDraw/ */
const base = process.env.GITHUB_PAGES === 'true' ? '/lightDraw/' : '/';

export default defineConfig({
  base,
  root: resolve(__dirname),
  publicDir: resolve(__dirname, 'public'),
  server: {
    port: 5173,
    open: true,
    fs: { allow: ['..'] },
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        help: resolve(__dirname, 'help.html'),
        doc: resolve(__dirname, 'doc.html'),
      },
    },
  },
});
