import * as esbuild from 'esbuild';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { gzipSync } from 'zlib';

const watch = process.argv.includes('--watch');
const VERSION = '0.6.0';

mkdirSync('dist', { recursive: true });

const banner = `/*! LightDraw.js v${VERSION} | MIT License | https://github.com/lightdraw/lightdraw.js */`;

const bundles = [
  { id: 'lightdraw.core', entry: 'src/core/index.ts', globalName: 'LightDraw' },
  { id: 'lightdraw.svg', entry: 'src/modules/svg/index.ts', globalName: 'LightDrawSvg' },
  { id: 'lightdraw.html', entry: 'src/modules/html/index.ts', globalName: 'LightDrawHtml' },
  { id: 'lightdraw.ui', entry: 'src/modules/ui/index.ts', globalName: 'LightDrawUi' },
  { id: 'lightdraw.dashboard', entry: 'src/modules/dashboard/index.ts', globalName: 'LightDrawDashboard' },
  { id: 'lightdraw.automotive', entry: 'src/modules/automotive/index.ts', globalName: 'LightDrawAutomotive' },
  { id: 'lightdraw.diagram', entry: 'src/modules/diagram/index.ts', globalName: 'LightDrawDiagram' },
  { id: 'lightdraw', entry: 'src/index.ts', globalName: 'LightDraw' },
];

const esbuildCommon = {
  bundle: true,
  sourcemap: true,
  target: ['es2020'],
  banner: { js: banner },
};

async function buildModern() {
  for (const { id, entry, globalName } of bundles) {
    await esbuild.build({
      ...esbuildCommon,
      entryPoints: [entry],
      outfile: `dist/${id}.esm.js`,
      format: 'esm',
      minify: false,
    });

    await esbuild.build({
      ...esbuildCommon,
      entryPoints: [entry],
      outfile: `dist/${id}.min.js`,
      format: 'iife',
      globalName,
      minify: true,
    });

    console.log(`Built ${id} (esm + min)`);
  }

  // Backward-compatible non-minified full bundle names
  await esbuild.build({
    ...esbuildCommon,
    entryPoints: ['src/index.ts'],
    outfile: 'dist/lightdraw.esm.js',
    format: 'esm',
    minify: false,
  });
  await esbuild.build({
    ...esbuildCommon,
    entryPoints: ['src/index.ts'],
    outfile: 'dist/lightdraw.js',
    format: 'iife',
    globalName: 'LightDraw',
    minify: false,
  });
  console.log('Built lightdraw.esm.js + lightdraw.js');
}

async function buildLegacy() {
  execSync('npx tsc -p tsconfig.legacy.json', { stdio: 'inherit' });

  for (const { id, entry, globalName } of bundles) {
    const legacyEntry = `dist/.legacy-src/${entry.replace(/^src\//, '').replace(/\.ts$/, '.js')}`;
    if (!existsSync(legacyEntry)) {
      console.warn(`Legacy entry missing: ${legacyEntry}`);
      continue;
    }
    await esbuild.build({
      entryPoints: [legacyEntry],
      outfile: `dist/${id}.legacy.js`,
      format: 'iife',
      globalName,
      bundle: true,
      minify: true,
      sourcemap: true,
      target: ['es5'],
      banner: { js: banner },
    });
    console.log(`Built ${id}.legacy.js`);
  }
}

function reportSizes() {
  const report = [
    'lightdraw.core.min.js',
    'lightdraw.svg.min.js',
    'lightdraw.html.min.js',
    'lightdraw.ui.min.js',
    'lightdraw.dashboard.min.js',
    'lightdraw.automotive.min.js',
    'lightdraw.diagram.min.js',
    'lightdraw.min.js',
    'lightdraw.legacy.js',
  ];

  for (const name of report) {
    const path = `dist/${name}`;
    if (!existsSync(path)) continue;
    const content = readFileSync(path);
    const gzip = gzipSync(content);
    console.log(
      `${name}: ${(content.length / 1024).toFixed(1)} KB minified, ${(gzip.length / 1024).toFixed(1)} KB gzip`
    );
  }
}

async function buildAll() {
  await buildModern();
  await buildLegacy();

  try {
    execSync('npx tsc --emitDeclarationOnly --declaration --outDir dist', { stdio: 'inherit' });
    console.log('Generated TypeScript declarations');
  } catch {
    console.warn('TypeScript declaration generation skipped');
  }

  const css = readFileSync('src/styles/lightdraw.css', 'utf8');
  writeFileSync('dist/lightdraw.min.css', css);
  console.log('Built dist/lightdraw.min.css');

  reportSizes();
}

if (watch) {
  const ctx = await esbuild.context({
    ...esbuildCommon,
    entryPoints: ['src/index.ts'],
    outfile: 'dist/lightdraw.min.js',
    format: 'iife',
    globalName: 'LightDraw',
    minify: true,
  });
  await ctx.watch();
  console.log('Watching for changes...');
} else {
  await buildAll();
}
