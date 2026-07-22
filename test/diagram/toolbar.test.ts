import { describe, it, expect, afterEach } from 'vitest';
import {
  Diagram,
  applyDiagramFlow,
  stopDiagramFlow,
  installDiagramToolbar,
  uninstallDiagramToolbar,
  resolveDiagramChrome,
  isDiagramFlowPlaying,
} from '../../src/diagram';
import { createTestApp, createTestContainer } from '../helpers';
import type { App } from '../../src/App';
import type { Group } from '../../src/shapes/Group';

function tinyFlow(app: App): Group {
  return Diagram.flowchart(
    app,
    {
      nodes: [
        { id: 'a', label: 'A', type: 'start', x: 40, y: 40 },
        { id: 'b', label: 'B', type: 'end', x: 40, y: 140 },
      ],
      edges: [{ from: 'a', to: 'b' }],
    },
    {
      width: 280,
      height: 220,
      flow: {
        enabled: true,
        mode: 'both',
        paths: [['a', 'b']],
        chrome: true,
      },
    }
  );
}

describe('diagram toolbar chrome', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('resolveDiagramChrome defaults on when flow enabled', () => {
    expect(resolveDiagramChrome(undefined, true)).toEqual({
      enabled: true,
      flow: true,
      zoom: true,
    });
    expect(resolveDiagramChrome(false, true)).toEqual({
      enabled: false,
      flow: false,
      zoom: false,
    });
    expect(resolveDiagramChrome({ zoom: true, flow: false }, true)).toEqual({
      enabled: true,
      flow: false,
      zoom: true,
    });
  });

  it('applyFlow mounts play/pause/replay + zoom toolbar on the host', () => {
    const el = createTestContainer();
    el.style.position = 'relative';
    const app = createTestApp(el, { renderer: 'canvas', width: 400, height: 300 });
    const chart = tinyFlow(app);
    app.add(chart);

    const bar = el.querySelector('.ld-diagram-toolbar') as HTMLElement | null;
    expect(bar).toBeTruthy();
    expect(bar?.querySelector('button[title="Pause flow"], button[title="Play flow"]')).toBeTruthy();
    expect(bar?.querySelector('button[title="Replay flow"]')).toBeTruthy();
    expect(bar?.querySelector('.ld-zoom-label')).toBeTruthy();
    expect(isDiagramFlowPlaying(chart)).toBe(true);

    applyDiagramFlow(app, chart, { chrome: false });
    expect(el.querySelector('.ld-diagram-toolbar')).toBeNull();

    app.destroy();
  });

  it('chrome:false keeps flow animation without toolbar', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas', width: 400, height: 300 });
    const chart = Diagram.flowchart(
      app,
      {
        nodes: [
          { id: 'a', label: 'A', type: 'start', x: 40, y: 40 },
          { id: 'b', label: 'B', type: 'end', x: 40, y: 140 },
        ],
        edges: [{ from: 'a', to: 'b' }],
      },
      {
        width: 280,
        height: 220,
        flow: {
          enabled: true,
          paths: [['a', 'b']],
          chrome: false,
        },
      }
    );
    app.add(chart);
    expect(el.querySelector('.ld-diagram-toolbar')).toBeNull();
    expect(isDiagramFlowPlaying(chart)).toBe(true);
    stopDiagramFlow(chart, { clearState: true });
    app.destroy();
  });

  it('installToolbar can mount zoom-only chrome', () => {
    const el = createTestContainer();
    el.style.position = 'relative';
    const app = createTestApp(el, { renderer: 'canvas', width: 400, height: 300 });
    const chart = Diagram.flowchart(
      app,
      {
        nodes: [
          { id: 'a', label: 'A', type: 'start', x: 40, y: 40 },
          { id: 'b', label: 'B', type: 'end', x: 40, y: 140 },
        ],
        edges: [{ from: 'a', to: 'b' }],
      },
      { width: 280, height: 220 }
    );
    app.add(chart);
    installDiagramToolbar(app, chart, { flow: false, zoom: true });
    const bar = el.querySelector('.ld-diagram-toolbar');
    expect(bar?.querySelector('.ld-zoom-label')).toBeTruthy();
    expect(bar?.querySelector('button[title="Replay flow"]')).toBeFalsy();
    uninstallDiagramToolbar(chart);
    expect(el.querySelector('.ld-diagram-toolbar')).toBeNull();
    app.destroy();
  });
});
