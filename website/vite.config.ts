import { defineConfig, type Plugin } from 'vite';
import { existsSync, createReadStream, statSync } from 'fs';
import { resolve, normalize, sep, extname } from 'path';

/** GitHub Pages project site: https://<user>.github.io/lightDraw/ */
const base = process.env.GITHUB_PAGES === 'true' ? '/lightDraw/' : '/';

const websiteRoot = resolve(__dirname);
const publicDir = resolve(websiteRoot, 'public');

/**
 * Vite's public middleware uses a cached file set that can go stale when
 * `prepare:website` rm+cp's `public/examples`. Missing HTML then SPA-falls
 * back to index.html — so demo iframes nest the whole playground (odd UI).
 * Always serve public *.html from disk when the file exists.
 */
function servePublicHtml(): Plugin {
  return {
    name: 'lightdraw-serve-public-html',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') return next();
        const raw = req.url ?? '';
        const pathname = decodeURIComponent(raw.split('?')[0] ?? '');
        if (!pathname.endsWith('.html')) return next();
        if (pathname === '/' || pathname === '/index.html') return next();
        if (pathname === '/help.html' || pathname === '/doc.html') return next();

        const rel = pathname.replace(/^\/+/, '');
        const file = normalize(resolve(publicDir, rel));
        const pubRoot = normalize(publicDir + sep);
        if (!file.startsWith(pubRoot) && file !== normalize(publicDir)) return next();
        if (!existsSync(file) || !statSync(file).isFile()) return next();
        if (extname(file) !== '.html') return next();

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        if (req.method === 'HEAD') {
          res.statusCode = 200;
          res.end();
          return;
        }
        createReadStream(file).pipe(res);
      });
    },
  };
}

export default defineConfig({
  base,
  root: websiteRoot,
  publicDir,
  plugins: [servePublicHtml()],
  server: {
    port: 5173,
    open: true,
    fs: { allow: ['..'] },
  },
  build: {
    outDir: resolve(websiteRoot, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(websiteRoot, 'index.html'),
        help: resolve(websiteRoot, 'help.html'),
        doc: resolve(websiteRoot, 'doc.html'),
      },
    },
  },
});
