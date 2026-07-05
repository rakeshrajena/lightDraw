import type { App } from '../App';
import type { Node } from '../Node';
import { CanvasRenderer } from '../renderers/CanvasRenderer';
import { SVGRenderer } from '../renderers/SVGRenderer';
import { getWorldBounds } from '../performance/bounds';
import type { Bounds } from '../performance/bounds';
import type { ExportOptions, ExportRegion } from './exportTypes';
import { Matrix2D } from '../utils';

export interface SnapshotResult {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  pixelRatio: number;
}

/** Resolve export region to world-space bounds. */
export function resolveExportBounds(app: App, region?: ExportRegion): Bounds {
  if (!region) {
    return { x: 0, y: 0, width: app.getSize().width, height: app.getSize().height };
  }
  if (isNode(region)) {
    return getWorldBounds(region);
  }
  return region;
}

function isNode(value: ExportRegion): value is Node {
  return typeof (value as Node).getBounds === 'function';
}

/** Render scene to offscreen canvas for raster export. */
export function snapshotToCanvas(app: App, options: ExportOptions = { format: 'png' }): SnapshotResult {
  const bounds = resolveExportBounds(app, options.region);
  const pixelRatio = options.pixelRatio ?? app.getPixelRatio();
  const width = Math.max(1, Math.ceil(bounds.width));
  const height = Math.max(1, Math.ceil(bounds.height));
  const background = options.background ?? app.getBackground();

  if (app.getRenderer() instanceof CanvasRenderer && !options.region) {
    const src = (app.getRenderer() as CanvasRenderer).getElement();
    const out = document.createElement('canvas');
    out.width = width * pixelRatio;
    out.height = height * pixelRatio;
    const ctx = out.getContext('2d');
    if (ctx) {
      ctx.drawImage(src, 0, 0);
    }
    return { canvas: out, width, height, pixelRatio };
  }

  if (app.getRenderer() instanceof CanvasRenderer && options.region) {
    const src = (app.getRenderer() as CanvasRenderer).getElement();
    const out = document.createElement('canvas');
    out.width = width * pixelRatio;
    out.height = height * pixelRatio;
    const ctx = out.getContext('2d');
    if (ctx) {
      const sx = bounds.x * pixelRatio;
      const sy = bounds.y * pixelRatio;
      const sw = width * pixelRatio;
      const sh = height * pixelRatio;
      ctx.drawImage(src, sx, sy, sw, sh, 0, 0, sw, sh);
    }
    return { canvas: out, width, height, pixelRatio };
  }

  const container = document.createElement('div');
  const renderer = new CanvasRenderer();
  renderer.init(container, {
    width,
    height,
    pixelRatio,
    background,
    highContrast: false,
  });

  const matrix = buildExportMatrix(app, bounds, width, height);
  renderer.render(app.stage, matrix);
  const canvas = renderer.getElement();
  renderer.destroy();

  return { canvas, width, height, pixelRatio };
}

/** Camera matrix adjusted to frame export bounds. */
function buildExportMatrix(app: App, bounds: Bounds, width: number, height: number): Matrix2D {
  const base = app.camera.getMatrix();
  const m = new Matrix2D();
  m.translate(-bounds.x, -bounds.y);
  const combined = new Matrix2D();
  combined.multiply(base);
  combined.multiply(m);
  if (bounds.width !== width || bounds.height !== height) {
    const sx = width / bounds.width;
    const sy = height / bounds.height;
    const scale = new Matrix2D();
    scale.scale(sx, sy);
    combined.multiply(scale);
  }
  return combined;
}

/** Serialize standalone SVG XML document. */
export function exportSvgDocument(app: App, options: ExportOptions = { format: 'svg' }): string {
  const bounds = resolveExportBounds(app, options.region);
  const background = options.background ?? app.getBackground();

  if (app.getRenderer() instanceof SVGRenderer && !options.region) {
    return wrapSvgDocument(serializeSvgElement((app.getRenderer() as SVGRenderer).getElement()), bounds.width, bounds.height);
  }

  const container = document.createElement('div');
  const renderer = new SVGRenderer();
  renderer.init(container, {
    width: bounds.width,
    height: bounds.height,
    pixelRatio: 1,
    background,
    highContrast: false,
  });
  const matrix = buildExportMatrix(app, bounds, bounds.width, bounds.height);
  renderer.render(app.stage, matrix);
  const xml = wrapSvgDocument(serializeSvgElement(renderer.getElement()), bounds.width, bounds.height);
  renderer.destroy();
  return xml;
}

function serializeSvgElement(svg: SVGSVGElement): string {
  return new XMLSerializer().serializeToString(svg);
}

function wrapSvgDocument(inner: string, width: number, height: number): string {
  const hasDeclaration = inner.trimStart().startsWith('<?xml');
  const doc = hasDeclaration
    ? inner
    : `<?xml version="1.0" encoding="UTF-8"?>\n${inner}`;
  if (!doc.includes('xmlns=')) {
    return doc.replace(
      '<svg',
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"`
    );
  }
  return doc;
}
