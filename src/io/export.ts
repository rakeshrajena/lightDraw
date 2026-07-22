import type { App } from '../App';
import type { SceneJSON } from '../types';
import type { Node } from '../Node';
import { exportStageJSON } from './json';
import { validateSceneJSON } from './schema';
import {
  buildPdfFromJpegPages,
  createMinimalJpegStub,
  dataUrlToBytes,
  pdfToDataUrl,
} from './pdf';
import { exportSvgDocument, snapshotToCanvas } from './snapshot';
import type { ExportFormat, ExportOptions, ExportResult } from './exportTypes';
import { EXPORT_MIME } from './exportTypes';

export type { ExportFormat, ExportOptions, ExportResult, ExportRegion } from './exportTypes';
export {
  validateSceneJSON,
  parseAndValidateSceneJSON,
  formatJsonParseError,
  locateJsonError,
  formatValidationErrors,
  validateThemePack,
  listKnownSceneTypes,
  formatExpectedValues,
  formatInvalidValue,
  suggestClosest,
  UI_THEME_PRESETS,
  AUTOMOTIVE_THEME_PRESETS,
  registerKnownSceneTypes,
} from './schema';
export type {
  ValidationResult,
  ValidationIssue,
  JsonErrorLocation,
  ValidateSceneOptions,
  ValidateThemeOptions,
} from './schema';
export { buildPdfFromJpegPages, pdfToDataUrl, dataUrlToBytes, createMinimalJpegStub } from './pdf';

const LIGHTDRAW_CDN = 'https://cdn.jsdelivr.net/npm/lightdraw/dist/lightdraw.min.js';
const LIGHTDRAW_CSS_CDN = 'https://cdn.jsdelivr.net/npm/lightdraw/dist/lightdraw.min.css';

/** Unified export API (Phase 10). */
export function exportApp(app: App, options: ExportOptions): ExportResult {
  const { format } = options;

  switch (format) {
    case 'json':
      return exportJson(app, options);
    case 'png':
      return exportRaster(app, options, 'image/png');
    case 'jpeg':
      return exportRaster(app, options, 'image/jpeg', options.quality ?? 0.92);
    case 'svg':
      return exportSvg(app, options);
    case 'pdf':
      return exportPdf(app, options);
    case 'html':
      return exportHtml(app, options);
    default:
      return exportJson(app, options);
  }
}

/** Legacy export helper — prefer `exportApp`. */
export function exportScene(
  app: App,
  format: ExportFormat,
  options: Omit<ExportOptions, 'format'> = {}
): string | SceneJSON | Uint8Array {
  const result = exportApp(app, { ...options, format });
  return result.data;
}

function exportJson(app: App, options: ExportOptions): ExportResult {
  const json = app.exportJSON({ compact: options.compact });
  if (options.validate) {
    const validation = validateSceneJSON(json);
    if (!validation.valid) {
      throw new Error(`JSON validation failed: ${validation.errors.join('; ')}`);
    }
  }
  return {
    format: 'json',
    data: json,
    mimeType: EXPORT_MIME.json,
  };
}

function exportRaster(
  app: App,
  options: ExportOptions,
  mime: 'image/png' | 'image/jpeg',
  quality?: number
): ExportResult {
  app.render();
  const snap = snapshotToCanvas(app, options);
  const dataUrl =
    mime === 'image/png'
      ? snap.canvas.toDataURL('image/png')
      : snap.canvas.toDataURL('image/jpeg', quality);

  return {
    format: mime === 'image/png' ? 'png' : 'jpeg',
    data: dataUrl,
    mimeType: mime,
    width: snap.canvas.width,
    height: snap.canvas.height,
  };
}

function exportSvg(app: App, options: ExportOptions): ExportResult {
  app.render();
  const xml = exportSvgDocument(app, options);
  const bounds = options.region
    ? undefined
    : { width: app.getSize().width, height: app.getSize().height };

  return {
    format: 'svg',
    data: xml,
    mimeType: EXPORT_MIME.svg,
    width: bounds?.width,
    height: bounds?.height,
  };
}

function exportPdf(app: App, options: ExportOptions): ExportResult {
  app.render();
  const pageCount = Math.max(1, options.pages ?? 1);
  const snap = snapshotToCanvas(app, options);
  const jpegUrl = snap.canvas.toDataURL('image/jpeg', options.quality ?? 0.92);
  let jpegBytes = dataUrlToBytes(jpegUrl);

  if (jpegBytes.length < 4 || jpegBytes[0] !== 0xff) {
    jpegBytes = createMinimalJpegStub(
      snap.width * snap.pixelRatio,
      snap.height * snap.pixelRatio
    );
  }

  const pageW = snap.width * snap.pixelRatio;
  const pageH = snap.height * snap.pixelRatio;
  const pages = Array.from({ length: pageCount }, () => ({
    jpeg: jpegBytes,
    width: pageW,
    height: pageH,
  }));

  const pdf = buildPdfFromJpegPages(pages);
  return {
    format: 'pdf',
    data: pdfToDataUrl(pdf),
    mimeType: EXPORT_MIME.pdf,
    width: pageW,
    height: pageH * pageCount,
  };
}

function exportHtml(app: App, options: ExportOptions): ExportResult {
  const json = exportStageJSON(app.stage, { compact: options.compact });
  if (options.validate) {
    const validation = validateSceneJSON(json);
    if (!validation.valid) {
      throw new Error(`JSON validation failed: ${validation.errors.join('; ')}`);
    }
  }

  const { width, height } = app.getSize();
  const bg = options.background ?? app.getBackground();
  const sceneJson = JSON.stringify(json).replace(/</g, '\\u003c');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LightDraw Export</title>
  <link rel="stylesheet" href="${LIGHTDRAW_CSS_CDN}">
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; }
    header { padding: 1rem; border-bottom: 1px solid #334155; }
    #app { margin: 1rem auto; border: 1px solid #334155; border-radius: 8px; overflow: hidden; }
  </style>
</head>
<body>
  <header><h1>LightDraw Export</h1><p>Offline scene — requires network for LightDraw script on first load.</p></header>
  <div id="app"></div>
  <script type="application/json" id="scene">${sceneJson}</script>
  <script src="${LIGHTDRAW_CDN}"></script>
  <script>
    (function () {
      var scene = JSON.parse(document.getElementById('scene').textContent);
      var app = LightDraw.createApp('#app', {
        width: ${width},
        height: ${height},
        background: ${JSON.stringify(bg)},
        renderer: 'html',
        autoResize: false,
      });
      app.loadJSON(scene);
      app.render();
    })();
  </script>
</body>
</html>`;

  return {
    format: 'html',
    data: html,
    mimeType: EXPORT_MIME.html,
    width,
    height,
  };
}

/** Trigger browser download for export result. */
export function downloadExport(result: ExportResult, filename?: string): void {
  const ext = result.format;
  const name = filename ?? `lightdraw-export.${ext}`;
  let blob: Blob;

  if (result.data instanceof Uint8Array) {
    blob = new Blob([new Uint8Array(result.data)], { type: result.mimeType });
  } else if (typeof result.data === 'string') {
    if (result.data.startsWith('data:')) {
      const bytes = dataUrlToBytes(result.data);
      blob = new Blob([new Uint8Array(bytes)], { type: result.mimeType });
    } else {
      blob = new Blob([result.data], { type: result.mimeType });
    }
  } else {
    blob = new Blob([JSON.stringify(result.data, null, 2)], { type: result.mimeType });
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/** Shallow scene comparison for round-trip tests. */
export function scenesEqual(a: SceneJSON, b: SceneJSON): boolean {
  if (a.type !== b.type) return false;
  const propsA = a.props ?? {};
  const propsB = b.props ?? {};
  const keysA = Object.keys(propsA).filter((k) => !['id', 'metadata'].includes(k));
  for (const k of keysA) {
    if (JSON.stringify(propsA[k]) !== JSON.stringify(propsB[k])) return false;
  }
  const chA = a.children ?? [];
  const chB = b.children ?? [];
  if (chA.length !== chB.length) return false;
  for (let i = 0; i < chA.length; i++) {
    if (!scenesEqual(chA[i], chB[i])) return false;
  }
  return true;
}

/** Export region helper — crop to node. */
export function exportNodeRegion(node: Node): { x: number; y: number; width: number; height: number } {
  const { x, y, width, height } = node.getBounds();
  return { x: node.x + x, y: node.y + y, width, height };
}
