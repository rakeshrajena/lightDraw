import { describe, it, expect, afterEach } from 'vitest';
import { existsSync } from 'fs';
import {
  createAutomotiveFromJSON,
  applyDriveState,
  sampleDriveFrames,
  automotiveToJSON,
  listAutomotiveWidgets,
  updateAutoWidgetProps,
  installAutoWidgetResizeObserver,
  detachAutoWidgetResizeObserver,
} from '../src/automotive/registry';
import { setAutoValue } from '../src/automotive/helpers';
import { getTheme, THEMES } from '../src/automotive/themes';
import { toJSON } from '../src/io/json';
import { TextNode } from '../src/shapes/index';
import { createTestApp, createTestContainer, measureAverageMs } from './helpers';

const PHASE8_WIDGETS = listAutomotiveWidgets();

describe('Phase 8 — Automotive Module', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('registers the full automotive widget catalog', () => {
    expect(PHASE8_WIDGETS.length).toBeGreaterThan(100);
    expect(PHASE8_WIDGETS).toContain('speedometer');
    expect(PHASE8_WIDGETS).toContain('digitalInstrumentCluster');
    expect(PHASE8_WIDGETS).toContain('gearPositionIndicator');
  });

  it('HTML renderer sizes clipped automotive groups from chartWidth/chartHeight', () => {
    const container = createTestContainer(240, 140);
    const app = createTestApp(container, { renderer: 'html' });
    const gauge = createAutomotiveFromJSON(
      'fuelGauge',
      { value: 65, width: 200, height: 100, x: 0, y: 0 },
      app
    )!;
    app.add(gauge);
    app.render();
    const el = container.querySelector(`#${gauge.id}`) as HTMLElement | null;
    expect(el).toBeTruthy();
    expect(parseInt(el!.style.width, 10)).toBeGreaterThan(0);
    expect(parseInt(el!.style.height, 10)).toBeGreaterThan(0);
    app.destroy();
  });

  it('updateAutoWidgetProps rebuilds widget dimensions', () => {
    const container = createTestContainer(240, 140);
    const app = createTestApp(container, { renderer: 'html', width: 240, height: 140, autoResize: false });
    const gauge = createAutomotiveFromJSON(
      'fuelGauge',
      { value: 65, width: 200, height: 100, x: 0, y: 0 },
      app
    )!;
    app.add(gauge);
    app.render();
    updateAutoWidgetProps(gauge, { width: 280, height: 120 });
    app.render();
    expect(gauge.metadata.chartWidth).toBe(280);
    expect(gauge.metadata.chartHeight).toBe(120);
    const el = container.querySelector(`#${gauge.id}`) as HTMLElement | null;
    expect(parseInt(el!.style.width, 10)).toBe(280);
    expect(parseInt(el!.style.height, 10)).toBe(120);
    app.destroy();
  });

  it('installAutoWidgetResizeObserver attaches and resizes widget', () => {
    const wrap = document.createElement('div');
    wrap.style.width = '200px';
    wrap.style.height = '120px';
    document.body.appendChild(wrap);
    const app = createTestApp(wrap, { renderer: 'html', width: 200, height: 120, autoResize: false });
    const gauge = createAutomotiveFromJSON(
      'speedometer',
      { value: 42, width: 200, height: 120, x: 0, y: 0 },
      app
    )!;
    app.add(gauge);
    app.render();
    expect(() => installAutoWidgetResizeObserver(gauge, wrap)).not.toThrow();
    expect(gauge.metadata.resizeObserverAttached).toBe(true);
    expect(gauge.metadata.chartWidth).toBe(200);
    updateAutoWidgetProps(gauge, { width: 260, height: 150 });
    expect(gauge.metadata.chartWidth).toBe(260);
    expect(gauge.metadata.chartHeight).toBe(150);
    detachAutoWidgetResizeObserver(gauge);
    app.destroy();
    wrap.remove();
  });

  for (const type of PHASE8_WIDGETS) {
    it(`${type} renders without error`, () => {
      const container = createTestContainer(260, 150);
      const app = createTestApp(container, { renderer: 'html' });
      const node = createAutomotiveFromJSON(
        type,
        { x: 0, y: 0, width: 220, height: 120, value: 42, active: true },
        app
      );
      expect(node).toBeTruthy();
      app.add(node!);
      expect(() => app.render()).not.toThrow();
      app.destroy();
    });
  }

  it('TPMS highlights low pressure in red', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const tpms = createAutomotiveFromJSON(
      'tpms',
      { pressures: [32, 32, 18, 32], lowThreshold: 25, x: 0, y: 0 },
      app
    )!;
    app.add(tpms);
    app.render();
    const texts = tpms.children.filter((c) => c instanceof TextNode && c.text.match(/^\d+$/)) as TextNode[];
    expect(texts).toHaveLength(4);
    expect(texts[2].fill).toBe('#ef4444');
    expect(texts[0].fill).toBe('#ffffff');
    app.destroy();
  });

  it('CAN viewer updates 100 signals within budget', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const signals: Record<string, number> = {};
    for (let i = 0; i < 100; i++) signals[`signal.${i}`] = i;
    const viewer = createAutomotiveFromJSON(
      'canViewer',
      { signals, maxRows: 100, width: 280, x: 0, y: 0 },
      app
    )!;
    app.add(viewer);
    app.render();
    const next: Record<string, number> = {};
    for (let i = 0; i < 100; i++) next[`signal.${i}`] = i * 2;
    const avg = measureAverageMs(() => {
      applyDriveState(viewer, { signals: next });
    }, 10);
    expect(avg).toBeLessThan(16);
    app.destroy();
  });

  it('instrument cluster builds from single JSON blob', () => {
    const container = createTestContainer(900, 500);
    const app = createTestApp(container, { renderer: 'html' });
    const cluster = createAutomotiveFromJSON(
      'instrumentCluster',
      {
        theme: 'sport',
        speed: 72,
        rpm: 3200,
        fuel: 65,
        engineTemp: 95,
        batteryVoltage: 12.6,
        tpms: [32, 31, 33, 30],
        gear: 'D',
        x: 0,
        y: 0,
      },
      app
    )!;
    app.add(cluster);
    app.render();
    expect(cluster.children.length).toBeGreaterThan(10);
    expect(cluster.metadata.autoType).toBe('instrumentCluster');
    app.destroy();
  });

  it('applyDriveState updates cluster widgets from JSON feed', () => {
    const container = createTestContainer(900, 500);
    const app = createTestApp(container, { renderer: 'html' });
    const cluster = createAutomotiveFromJSON('instrumentCluster', { speed: 0, rpm: 0, x: 0, y: 0 }, app)!;
    app.add(cluster);
    applyDriveState(cluster, {
      speed: 88,
      rpm: 4500,
      fuel: 42,
      engineTemp: 102,
      batteryVoltage: 11.2,
      tpms: [28, 30, 22, 31],
      parkingBrake: true,
      headlights: true,
      cruiseSpeed: 70,
      gear: 'D',
      turnLeft: true,
    });
    app.render();
    const findAutoPart = (parent: import('../src/shapes/Group').Group, part: string): import('../src/Node').Node | undefined => {
      for (const child of parent.children) {
        if (child.metadata?.autoPart === part) return child;
        if ('children' in child) {
          const found = findAutoPart(child as import('../src/shapes/Group').Group, part);
          if (found) return found;
        }
      }
      return undefined;
    };
    const speedo = findAutoPart(cluster as import('../src/shapes/Group').Group, 'speedometer');
    expect(speedo?.metadata.autoState?.value).toBe(88);
    app.destroy();
  });

  it('sampleDriveFrames returns animated drive sequence', () => {
    const frames = sampleDriveFrames(60);
    expect(frames).toHaveLength(60);
    expect(frames[5].speed).toBeDefined();
    expect(frames[45].tpms?.[2]).toBe(22); // low-pressure RR tire after frame 40
  });

  it('cluster themes provide distinct palettes', () => {
    expect(getTheme('classic').background).not.toBe(getTheme('digital').background);
    expect(THEMES.sport.text).toBeDefined();
  });

  it('automotive JSON round-trip preserves auto type', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const gauge = createAutomotiveFromJSON('engineTemp', { value: 88, size: 120, x: 5, y: 5 }, app)!;
    app.add(gauge);
    const json = toJSON(gauge);
    expect(json.type).toBe('engineTemp');
    expect((json.props as { value: number }).value).toBe(88);
    const direct = automotiveToJSON(gauge);
    expect(direct.type).toBe('engineTemp');
    app.destroy();
  });

  it('setAutoValue updates needle gauges immediately', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const speedo = createAutomotiveFromJSON('speedometer', { value: 0, size: 100, x: 0, y: 0 }, app)!;
    app.add(speedo);
    setAutoValue(speedo, 'value', 55);
    expect(speedo.metadata.autoState?.value).toBe(55);
    setAutoValue(speedo, 'value', 80);
    expect(speedo.metadata.autoState?.value).toBe(80);
    app.destroy();
  });

  it('full cluster live update renders within performance budget', () => {
    const container = createTestContainer(900, 500);
    const app = createTestApp(container, { renderer: 'canvas' });
    const cluster = createAutomotiveFromJSON('instrumentCluster', { x: 0, y: 0 }, app)!;
    app.add(cluster);
    app.render();
    const frames = sampleDriveFrames(20);
    const avg = measureAverageMs(() => {
      for (const frame of frames) applyDriveState(cluster, frame);
      app.render();
    }, 3);
    expect(avg).toBeLessThan(96); // v1.0 cluster chrome; headroom for coverage + full CI load
    app.destroy();
  });

  it('automotive legacy bundle exists', () => {
    expect(existsSync('dist/lightdraw.automotive.legacy.js')).toBe(true);
  });
});
