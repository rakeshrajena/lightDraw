#!/usr/bin/env node
/**
 * Copy dist bundles and examples into website/public for Vite playground.
 */
import { cpSync, mkdirSync, existsSync, rmSync, readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pub = resolve(root, 'website/public');

const distFiles = [
  'lightdraw.min.js',
  'lightdraw.min.css',
  'lightdraw.esm.js',
];

mkdirSync(pub, { recursive: true });

for (const f of distFiles) {
  const src = resolve(root, 'dist', f);
  if (!existsSync(src)) {
    console.error(`Missing ${src} — run npm run build first`);
    process.exit(1);
  }
  cpSync(src, resolve(pub, f));
}

const examplesOut = resolve(pub, 'examples');
// Prefer in-place sync: a full rm+cp can briefly empty the folder and leave
// Vite's public-file cache without example HTML (SPA fallback nests the site).
if (!existsSync(examplesOut)) mkdirSync(examplesOut, { recursive: true });
cpSync(resolve(root, 'examples'), examplesOut, { recursive: true });

function rewriteExampleAssetPaths(dir) {
  for (const name of readdirSync(dir)) {
    const file = resolve(dir, name);
    if (statSync(file).isDirectory()) {
      rewriteExampleAssetPaths(file);
      continue;
    }
    if (!name.endsWith('.html')) continue;
    const html = readFileSync(file, 'utf8').replace(/\.\.\/dist\//g, '../');
    writeFileSync(file, html);
  }
}
rewriteExampleAssetPaths(examplesOut);

const docsOut = resolve(pub, 'docs');
if (existsSync(docsOut)) rmSync(docsOut, { recursive: true });
cpSync(resolve(root, 'docs'), docsOut, { recursive: true });

const blogFixturesSrc = resolve(root, 'scripts/blog-fixtures');
const blogFixturesOut = resolve(pub, 'blog/fixtures');
if (existsSync(blogFixturesSrc)) {
  if (existsSync(blogFixturesOut)) rmSync(blogFixturesOut, { recursive: true });
  cpSync(blogFixturesSrc, blogFixturesOut, { recursive: true });
}

console.log('Website public assets prepared.');
