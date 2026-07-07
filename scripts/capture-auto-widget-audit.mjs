#!/usr/bin/env node
/**
 * Capture one screenshot per automotive widget for visual QA.
 * Usage: npm run build && node scripts/capture-auto-widget-audit.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_DIR = resolve(ROOT, 'docs/images/auto-widget-audit');
const CARD_W = 260;
const CARD_H = 168;
const PORT = 4177;

const MIME = {
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.png': 'image/png',
};

function staticServer(auditHtml) {
  return createServer((req, res) => {
    let path = req.url?.split('?')[0] || '/';
    if (path === '/') path = '/audit-page.html';
    let file;
    if (path === '/audit-page.html') {
      file = auditHtml;
    } else {
      file = resolve(ROOT, path.replace(/^\//, ''));
    }
    if (!file.startsWith(ROOT) && file !== auditHtml) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    if (!existsSync(file)) {
      res.writeHead(404);
      res.end('Not found: ' + path);
      return;
    }
    const ext = file.slice(file.lastIndexOf('.'));
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(readFileSync(file));
  });
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const auditHtml = resolve(OUT_DIR, 'audit-page.html');
  writeFileSync(
    auditHtml,
    `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><link rel="stylesheet" href="/dist/lightdraw.min.css">
<style>
  body { margin: 0; background: #0a0a0a; }
  #host { width: ${CARD_W}px; height: ${CARD_H}px; overflow: hidden; }
</style></head>
<body><div id="host"></div>
<script src="/dist/lightdraw.min.js"></script>
<script src="/examples/demo-auto-catalog.js"></script>
<script>
  window.renderWidget = function(type) {
    const host = document.getElementById('host');
    host.innerHTML = '';
    const props = window.ldAutoProps(type, ${CARD_W}, ${CARD_H});
    const app = LightDraw.createApp(host, {
      renderer: 'canvas',
      width: ${CARD_W},
      height: ${CARD_H},
      background: '#0a0a0a',
      autoResize: false,
    });
    app.loadJSON({ type, props: { ...props, x: 0, y: 0 } });
    app.render();
    window.__auditApp = app;
  };
</script></body></html>`
  );

  const server = staticServer(auditHtml);
  await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: CARD_W + 40, height: CARD_H + 40 } });

  if (typeof window !== 'undefined') {
    /* noop for node */
  }

  await page.goto(`http://127.0.0.1:${PORT}/audit-page.html`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => typeof window.LightDraw !== 'undefined');

  const types = await page.evaluate(() => {
    if (window.LightDraw?.listAutomotiveWidgets) return window.LightDraw.listAutomotiveWidgets();
    return window.LD_AUTO_WIDGET_CATALOG || [];
  });

  const report = [];
  for (const type of types) {
    try {
      await page.evaluate((t) => window.renderWidget(t), type);
      await page.waitForTimeout(80);
      const metrics = await page.evaluate(() => {
        const canvas = document.querySelector('#host canvas');
        if (!canvas) return { ok: false, reason: 'no canvas' };
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        let edgeBg = 0;
        let content = 0;
        const sample = (x, y) => {
          const d = ctx.getImageData(x, y, 1, 1).data;
          if (d[0] === 10 && d[1] === 10 && d[2] === 10) edgeBg++;
          else content++;
        };
        for (let x = 4; x < w - 4; x += 12) {
          sample(x, 4);
          sample(x, h - 5);
        }
        for (let y = 4; y < h - 4; y += 12) {
          sample(4, y);
          sample(w - 5, y);
        }
        const center = ctx.getImageData(Math.floor(w / 2), Math.floor(h / 2), 1, 1).data;
        const centerBg = center[0] === 10 && center[1] === 10 && center[2] === 10;
        return {
          ok: true,
          content,
          edgeBg,
          empty: content < 8,
          centerBg,
          w,
          h,
        };
      });
      const out = resolve(OUT_DIR, `${type}.png`);
      await page.locator('#host').screenshot({ path: out });
      report.push({ type, ...metrics, file: `${type}.png` });
      process.stdout.write(metrics.empty ? 'E' : metrics.centerBg ? 'c' : '.');
    } catch (err) {
      report.push({ type, ok: false, reason: String(err) });
      process.stdout.write('X');
    }
  }
  console.log(`\nCaptured ${report.length} widgets → ${OUT_DIR}`);

  const issues = report.filter((r) => !r.ok || r.empty || r.centerBg);
  writeFileSync(resolve(OUT_DIR, 'report.json'), JSON.stringify({ report, issues }, null, 2));
  console.log(`Issues: ${issues.length}`);
  for (const i of issues.slice(0, 30)) {
    console.log(`  - ${i.type}: ${i.reason || (i.empty ? 'empty' : i.centerBg ? 'center empty' : 'ok')}`);
  }

  await browser.close();
  server.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
