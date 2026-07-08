#!/usr/bin/env node
/**
 * Capture one screenshot per diagram type for visual QA.
 * Usage: npm run build && node scripts/capture-diagram-audit.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_DIR = resolve(ROOT, 'docs/images/diagram-audit');
const W = 900;
const H = 520;
const PORT = 4178;

const TYPES = [
  'flowchart',
  'stateMachine',
  'network',
  'can',
  'pipeline',
  'mindMap',
  'uml',
  'schematic',
  'org',
];

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
<style>body{margin:0;background:#0d1322}#host{width:${W}px;height:${H}px;overflow:hidden}</style></head>
<body><div id="host"></div>
<script src="/dist/lightdraw.min.js"></script>
<script src="/scripts/diagram-audit-samples.js"></script>
<script>
  window.renderDiagram = function(type) {
    const host = document.getElementById('host');
    host.innerHTML = '';
    const app = LightDraw.createApp(host, { renderer: 'canvas', width: ${W}, height: ${H}, background: '#0d1322' });
    const fn = window.DIAGRAM_AUDIT_SAMPLES[type];
    if (!fn) return;
    const g = fn(app, ${W}, ${H});
    app.add(g);
    app.render();
    if (LightDraw.Diagram.fitToBounds) LightDraw.Diagram.fitToBounds(g, ${W}, ${H}, 24);
    app.render();
  };
</script></body></html>`
  );

  const server = staticServer(auditHtml);
  await new Promise((r) => server.listen(PORT, r));

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H } });

  for (const type of TYPES) {
    await page.goto(`http://127.0.0.1:${PORT}/`);
    await page.evaluate((t) => window.renderDiagram(t), type);
    await page.waitForTimeout(400);
    const out = resolve(OUT_DIR, `${type}.png`);
    await page.locator('#host').screenshot({ path: out });
    console.log(`  → ${out.replace(ROOT + '/', '')}`);
  }

  await browser.close();
  server.close();
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
