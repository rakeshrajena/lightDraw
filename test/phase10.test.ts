import { describe, it, expect, afterEach } from 'vitest';
import {
  exportApp,
  exportScene,
  downloadExport,
  validateSceneJSON,
  parseAndValidateSceneJSON,
  scenesEqual,
  buildPdfFromJpegPages,
  createMinimalJpegStub,
  dataUrlToBytes,
  pdfToDataUrl,
} from '../src/io/export';
import { resolveExportBounds, exportSvgDocument, snapshotToCanvas } from '../src/io/snapshot';
import { fromJSON, toJSON } from '../src/io/json';
import { createTestApp, createTestContainer, measureAverageMs } from './helpers';

describe('Phase 10 — Export Pipeline', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('PNG export matches canvas dimensions × pixelRatio', () => {
    const container = createTestContainer(640, 480);
    const app = createTestApp(container, { renderer: 'canvas', pixelRatio: 2, width: 640, height: 480 });
    app.add(app.rect({ x: 10, y: 10, width: 100, height: 80, fill: '#3b82f6' }));
    app.render();

    const result = exportApp(app, { format: 'png', pixelRatio: 2 });
    expect(result.format).toBe('png');
    expect(result.width).toBe(640 * 2);
    expect(result.height).toBe(480 * 2);
    expect(String(result.data)).toContain('data:image/png');
    app.destroy();
  });

  it('JPEG export accepts quality parameter', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    app.add(app.circle({ x: 50, y: 50, radius: 30, fill: '#ef4444' }));
    app.render();

    const result = exportApp(app, { format: 'jpeg', quality: 0.75 });
    expect(result.mimeType).toBe('image/jpeg');
    expect(String(result.data)).toContain('data:image');
    app.destroy();
  });

  it('SVG export produces valid XML', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'svg' });
    app.add(app.rect({ width: 60, height: 40, fill: '#22c55e' }));
    app.render();

    const result = exportApp(app, { format: 'svg' });
    const xml = String(result.data);
    expect(xml).toContain('<?xml');
    expect(xml).toContain('<svg');
    expect(xml).toContain('xmlns="http://www.w3.org/2000/svg"');
    app.destroy();
  });

  it('PDF export has valid header and at least one page', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    app.add(app.rect({ width: 80, height: 60, fill: '#8b5cf6' }));
    app.render();

    const result = exportApp(app, { format: 'pdf' });
    const bytes = dataUrlToBytes(String(result.data));
    const header = String.fromCharCode(...bytes.slice(0, 5));
    expect(header).toBe('%PDF-');
    expect(bytes.length).toBeGreaterThan(100);
    app.destroy();
  });

  it('PDF multi-page export (10 pages) within performance budget', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    app.add(app.rect({ width: 200, height: 100, fill: '#f59e0b' }));
    app.render();

    const ms = measureAverageMs(() => {
      exportApp(app, { format: 'pdf', pages: 10 });
    }, 3);
    expect(ms).toBeLessThan(2000);
    app.destroy();
  });

  it('HTML export is self-contained with scene JSON', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    app.add(app.text({ text: 'Export me', x: 20, y: 20, fontSize: 16, fill: '#fff' }));
    app.render();

    const result = exportApp(app, { format: 'html', validate: true });
    const html = String(result.data);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('LightDraw Export');
    expect(html).toContain('application/json');
    expect(html).toContain('loadJSON');
    expect(html).toContain('Export me');
    app.destroy();
  });

  it('JSON export validates schema when requested', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    app.add(app.rect({ width: 30, height: 30, fill: '#000' }));

    const result = exportApp(app, { format: 'json', validate: true });
    expect(result.data).toHaveProperty('type');
    const validation = validateSceneJSON(result.data);
    expect(validation.valid).toBe(true);
    app.destroy();
  });

  it('JSON validation rejects invalid scene', () => {
    const bad = validateSceneJSON({ type: '' });
    expect(bad.valid).toBe(false);
    expect(bad.errors.length).toBeGreaterThan(0);
  });

  it('export region crops to node bounds', () => {
    const container = createTestContainer(400, 300);
    const app = createTestApp(container, { renderer: 'canvas' });
    const rect = app.rect({ x: 50, y: 40, width: 120, height: 80, fill: '#06b6d4' });
    app.add(rect, app.rect({ x: 300, y: 200, width: 50, height: 50, fill: '#ccc' }));
    app.render();

    const result = exportApp(app, { format: 'png', region: rect, pixelRatio: 1 });
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
    expect(result.width!).toBeLessThan(400);
    app.destroy();
  });

  it('JSON round-trip export → import preserves scene', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    app.add(
      app.rect({ x: 5, y: 5, width: 40, height: 30, fill: '#2563eb' }),
      app.circle({ x: 80, y: 30, radius: 20, fill: '#dc2626' })
    );

    const exported = exportApp(app, { format: 'json' }).data as ReturnType<typeof toJSON>;
    const node = fromJSON(exported, app);
    const reexported = toJSON(node);
    expect(scenesEqual(exported, reexported)).toBe(true);
    app.destroy();
  });

  it('unified app.export(options) API', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    app.add(app.rect({ width: 20, height: 20, fill: '#000' }));

    const result = app.export({ format: 'png' });
    expect(result.format).toBe('png');
    expect(result.mimeType).toBe('image/png');

    const legacy = app.export('json');
    expect(legacy).toHaveProperty('type');
    app.destroy();
  });

  it('legacy exportScene supports all formats', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    app.add(app.rect({ width: 10, height: 10, fill: '#000' }));
    app.render();

    expect(exportScene(app, 'json')).toHaveProperty('type');
    expect(String(exportScene(app, 'png'))).toContain('data:image/png');
    expect(String(exportScene(app, 'jpeg', { quality: 0.8 }))).toContain('data:image');
    expect(String(exportScene(app, 'pdf'))).toContain('data:application/pdf');
    app.destroy();
  });

  it('buildPdfFromJpegPages creates valid PDF structure', () => {
    const jpeg = createMinimalJpegStub(100, 80);
    const pdf = buildPdfFromJpegPages([{ jpeg, width: 100, height: 80 }]);
    expect(String.fromCharCode(...pdf.slice(0, 5))).toBe('%PDF-');
    expect(String.fromCharCode(...pdf.slice(-5))).toContain('EOF');
  });

  it('downloadExport creates blob URL without throw', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    app.add(app.rect({ width: 10, height: 10, fill: '#000' }));
    const result = exportApp(app, { format: 'json' });
    const createUrl = URL.createObjectURL;
    const revoke = URL.revokeObjectURL;
    let created = false;
    URL.createObjectURL = () => {
      created = true;
      return 'blob:mock';
    };
    URL.revokeObjectURL = () => undefined;
    const click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function mockClick() {
      expect(this.download).toBe('test.json');
    };
    downloadExport(result, 'test.json');
    expect(created).toBe(true);
    URL.createObjectURL = createUrl;
    URL.revokeObjectURL = revoke;
    HTMLAnchorElement.prototype.click = click;
    app.destroy();
  });

  it('1920×1080 PNG export within performance budget', () => {
    const container = createTestContainer(1920, 1080);
    const app = createTestApp(container, { renderer: 'canvas', width: 1920, height: 1080 });
    app.add(app.rect({ width: 1920, height: 1080, fill: '#1e293b' }));
    app.render();

    const ms = measureAverageMs(() => {
      exportApp(app, { format: 'png', pixelRatio: 1 });
    }, 3);
    expect(ms).toBeLessThan(200);
    app.destroy();
  });

  it('snapshot and schema helpers cover edge paths', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    app.add(app.rect({ x: 10, y: 10, width: 50, height: 40, fill: '#f00' }));
    app.render();

    const bounds = resolveExportBounds(app, { x: 5, y: 5, width: 60, height: 50 });
    expect(bounds.width).toBe(60);

    const snap = snapshotToCanvas(app, {
      format: 'png',
      region: { x: 0, y: 0, width: 100, height: 80 },
      pixelRatio: 1,
    });
    expect(snap.canvas.width).toBeGreaterThan(0);

    const svgXml = exportSvgDocument(app, {
      format: 'svg',
      region: { x: 0, y: 0, width: 200, height: 150 },
    });
    expect(svgXml).toContain('<svg');

    const badParse = parseAndValidateSceneJSON('{ invalid');
    expect(badParse.validation.valid).toBe(false);

    const badScene = validateSceneJSON({
      type: 'group',
      props: null as unknown as Record<string, unknown>,
      children: 'nope' as unknown as [],
    });
    expect(badScene.valid).toBe(false);

    const nested = validateSceneJSON({
      type: 'group',
      children: [{ type: 'rect', props: { width: 10 } }],
    });
    expect(nested.valid).toBe(true);

    const pdf = buildPdfFromJpegPages([]);
    expect(String.fromCharCode(...pdf.slice(0, 5))).toBe('%PDF-');

    const dataUrl = pdfToDataUrl(createMinimalJpegStub(10, 10));
    expect(dataUrl).toContain('data:application/pdf');

    const invalidId = validateSceneJSON({ type: '!!!' });
    expect(invalidId.valid).toBe(false);

    app.destroy();
  });

  it('downloadExport handles string and object data', () => {
    const createUrl = URL.createObjectURL;
    const revoke = URL.revokeObjectURL;
    URL.createObjectURL = () => 'blob:mock';
    URL.revokeObjectURL = () => undefined;
    HTMLAnchorElement.prototype.click = () => undefined;

    downloadExport({ format: 'html', data: '<html></html>', mimeType: 'text/html' }, 'out.html');
    downloadExport({
      format: 'json',
      data: { type: 'group' },
      mimeType: 'application/json',
    });
    downloadExport({
      format: 'pdf',
      data: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
      mimeType: 'application/pdf',
    });

    URL.createObjectURL = createUrl;
    URL.revokeObjectURL = revoke;
  });

  it('JSON validate throws on invalid export', () => {
    const container = createTestContainer();
    const app = createTestApp(container);
    app.stage.metadata = { diagramType: 'broken' };
    expect(() => exportApp(app, { format: 'json', validate: true })).not.toThrow();
    app.destroy();
  });
});
