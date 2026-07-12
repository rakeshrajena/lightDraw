/**
 * Phase 4 — diagram builders follow app theme and refresh on setUiTheme.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestApp, createTestContainer } from '../helpers';
import { createDiagramFromJSON } from '../../src/diagram/registry';
import {
  DIAGRAM,
  resolveDiagramTheme,
  getActiveDiagram,
  syncActiveDiagramTheme,
} from '../../src/diagram/theme';

describe('Phase 4 — diagram theme', () => {
  beforeEach(() => {
    syncActiveDiagramTheme({});
  });

  it('empty resolveDiagramTheme matches DIAGRAM defaults', () => {
    const theme = resolveDiagramTheme();
    expect(theme.nodeStroke).toBe(DIAGRAM.nodeStroke);
    expect(theme.edge).toBe(DIAGRAM.edge);
    expect(theme.flowchartProcess.stroke).toBe(DIAGRAM.flowchartProcess.stroke);
    expect(theme.networkRouter.stroke).toBe(DIAGRAM.networkRouter.stroke);
  });

  it('diagram pack survives create/rebuild via diagramPackFromApp', () => {
    const el = createTestContainer();
    const app = createTestApp(el, {
      renderer: 'canvas',
      uiTheme: {
        preset: 'dark',
        diagram: { nodeStroke: '#f472b6', edge: '#f472b6' },
      },
    });
    const diagram = createDiagramFromJSON(
      'flowchart',
      {
        data: {
          nodes: [{ id: 'a', label: 'A', type: 'process', x: 0, y: 0 }],
          edges: [],
        },
      },
      app
    )!;
    app.add(diagram);
    expect(getActiveDiagram().nodeStroke).toBe('#f472b6');
    app.setUiTheme({ primary: '#0ea5e9' }); // rebuild — pack must stick
    expect(getActiveDiagram().nodeStroke).toBe('#f472b6');
    app.destroy();
    el.remove();
  });

  it('light UI packs keep dark diagram chrome', () => {
    const theme = resolveDiagramTheme({
      primary: '#7c3aed',
      surface: '#ffffff',
      surfaceMuted: '#f8fafc',
      surfaceInset: '#f1f5f9',
      text: '#0f172a',
    });
    expect(theme.nodeStroke).toBe('#7c3aed');
    expect(theme.canvasBg).toBe(DIAGRAM.canvasBg);
    expect(theme.nodeFill).toBe(DIAGRAM.nodeFill);
  });

  it('resolveDiagramTheme maps primary into strokes and edges', () => {
    const theme = resolveDiagramTheme({ primary: '#7c3aed' });
    expect(theme.nodeStroke).toBe('#7c3aed');
    expect(theme.edge).toBe('#7c3aed');
    expect(theme.flowchartProcess.stroke).toBe('#7c3aed');
    expect(theme.networkRouter.stroke).toBe('#7c3aed');
    expect(theme.canBus).toBe('#7c3aed');
  });

  it('networkTopology created with uiTheme uses themed edge/router colors', () => {
    const el = createTestContainer();
    const app = createTestApp(el, {
      renderer: 'canvas',
      uiTheme: { preset: 'violet' },
    });
    const diagram = createDiagramFromJSON(
      'networkTopology',
      {
        data: {
          nodes: [
            { id: 'gw', label: 'Gateway', type: 'router', x: 200, y: 40 },
            { id: 'api', label: 'API', type: 'server', x: 100, y: 160 },
          ],
          edges: [{ from: 'gw', to: 'api' }],
        },
      },
      app
    )!;
    app.add(diagram);
    expect(getActiveDiagram().edge).toBe('#7c3aed');
    expect(getActiveDiagram().networkRouter.stroke).toBe('#7c3aed');
    expect(diagram.metadata?.diagramType).toBe('networkTopology');
    expect(diagram.metadata?.diagramRebuild).toBeTypeOf('function');
    app.destroy();
    el.remove();
  });

  it('setUiTheme rebuilds diagram with new primary', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });
    const diagram = createDiagramFromJSON(
      'flowchart',
      {
        data: {
          nodes: [
            { id: 'a', label: 'Start', type: 'start', x: 40, y: 40 },
            { id: 'b', label: 'Process', type: 'process', x: 40, y: 120 },
          ],
          edges: [{ from: 'a', to: 'b' }],
        },
      },
      app
    )!;
    app.add(diagram);

    expect(getActiveDiagram().nodeStroke).toBe(DIAGRAM.nodeStroke);

    app.setUiTheme({ primary: '#e11d48' });
    expect(getActiveDiagram().edge).toBe('#e11d48');
    expect(getActiveDiagram().flowchartProcess.stroke).toBe('#e11d48');
    expect((diagram as { children: unknown[] }).children.length).toBeGreaterThan(0);
    expect(diagram.metadata?.diagramType).toBe('flowchart');

    app.destroy();
    el.remove();
  });
});
