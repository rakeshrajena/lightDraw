import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  Diagram,
  applyDiagramFlow,
  stopDiagramFlow,
  pauseDiagramFlow,
  resumeDiagramFlow,
  replayDiagramFlow,
  isDiagramFlowPlaying,
  edgePointsToPathD,
  getEdgeStrokePolyline,
} from '../../src/diagram';
import { AnimationEngine } from '../../src/animation/Animation';
import { findEdgeLayer } from '../../src/diagram/editor/collect';
import { createTestApp, createTestContainer } from '../helpers';
import type { App } from '../../src/App';
import type { Group } from '../../src/shapes/Group';

function tinyFlow(app: App) {
  return Diagram.flowchart(
    app,
    {
      nodes: [
        { id: 'a', label: 'A', x: 40, y: 40 },
        { id: 'b', label: 'B', x: 220, y: 40 },
        { id: 'c', label: 'C', x: 400, y: 40 },
      ],
      edges: [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'c' },
      ],
    },
    { width: 640, height: 400 }
  );
}

describe('diagram flow animation', () => {
  let app: App;

  beforeEach(() => {
    const container = createTestContainer(640, 400);
    app = createTestApp(container, { renderer: 'html', width: 640, height: 400 });
  });

  afterEach(() => {
    AnimationEngine.stopAll();
    document.body.innerHTML = '';
  });

  it('edgePointsToPathD builds an SVG path', () => {
    expect(edgePointsToPathD([0, 0, 10, 0, 10, 20])).toBe('M 0 0 L 10 0 L 10 20');
    expect(edgePointsToPathD([1, 2])).toBe('');
  });

  it('applyFlow adds dash motion and persists options', () => {
    const root = tinyFlow(app);
    app.add(root);

    applyDiagramFlow(app, root, {
      enabled: true,
      speed: 1,
      mode: 'dash',
      highlight: 'none',
      playback: 'loop',
    });

    const state = root.metadata.diagramState as { flow?: { mode?: string; speed?: number } };
    expect(state.flow?.mode).toBe('dash');
    expect(state.flow?.speed).toBe(1);

    const edgeLayer = findEdgeLayer(root);
    expect(edgeLayer).toBeTruthy();
    const edge = edgeLayer!.children[0] as Group;
    const stroke = getEdgeStrokePolyline(edge);
    expect(stroke).toBeTruthy();
    expect(Array.isArray(stroke!.dash) && stroke!.dash!.length >= 2).toBe(true);
    expect(AnimationEngine.isTickScheduled()).toBe(true);
    expect(isDiagramFlowPlaying(root)).toBe(true);

    stopDiagramFlow(root);
    expect(root.metadata.diagramFlowRuntime).toBeUndefined();
  });

  it('paths plays multiple runs in index order', () => {
    const root = Diagram.flowchart(
      app,
      {
        nodes: [
          { id: 'a', label: 'A', x: 40, y: 40 },
          { id: 'b', label: 'B', x: 220, y: 40 },
          { id: 'c', label: 'C', x: 400, y: 40 },
          { id: 'd', label: 'D', x: 220, y: 160 },
        ],
        edges: [
          { from: 'a', to: 'b' },
          { from: 'b', to: 'c' },
          { from: 'a', to: 'd' },
          { from: 'd', to: 'c' },
        ],
      },
      { width: 640, height: 400 }
    );
    app.add(root);

    applyDiagramFlow(app, root, {
      enabled: true,
      speed: 2,
      mode: 'packet',
      highlight: 'none',
      playback: 'loop',
      paths: [
        ['a', 'b', 'c'],
        ['a', 'd', 'c'],
      ],
      pathGapMs: 0,
    });

    const flow = root.metadata.diagramState as {
      flow?: { paths?: string[][]; pathGapMs?: number };
    };
    expect(flow.flow?.paths?.length).toBe(2);
    expect(flow.flow?.pathGapMs).toBe(0);
    expect(isDiagramFlowPlaying(root)).toBe(true);

    const edgeLayer = findEdgeLayer(root)!;
    const packets = edgeLayer.children.flatMap((e) =>
      (e as Group).children.filter((c) => c.metadata?.diagramFlowPacket)
    );
    expect(packets.length).toBe(1);
  });

  it('path as string[][] is treated like paths', () => {
    const root = tinyFlow(app);
    app.add(root);
    applyDiagramFlow(app, root, {
      enabled: true,
      mode: 'packet',
      highlight: 'none',
      path: [
        ['a', 'b'],
        ['b', 'c'],
      ],
    });
    const flow = root.metadata.diagramState as { flow?: { paths?: string[][] } };
    expect(flow.flow?.paths?.length).toBe(2);
  });

  it('pathEdges alias resolves hops', () => {
    const root = tinyFlow(app);
    app.add(root);
    applyDiagramFlow(app, root, {
      enabled: true,
      mode: 'packet',
      highlight: 'none',
      edges: [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'c' },
      ],
    });
    const flow = root.metadata.diagramState as {
      flow?: { pathEdges?: Array<{ from: string; to: string }> };
    };
    expect(flow.flow?.pathEdges?.length).toBe(2);
    expect(isDiagramFlowPlaying(root)).toBe(true);
  });

  it('pause and resume toggle playing state', () => {
    const root = tinyFlow(app);
    app.add(root);
    applyDiagramFlow(app, root, { enabled: true, mode: 'dash', highlight: 'none' });
    expect(isDiagramFlowPlaying(root)).toBe(true);
    pauseDiagramFlow(app, root);
    expect(isDiagramFlowPlaying(root)).toBe(false);
    const paused = (root.metadata.diagramState as { flow?: { paused?: boolean } }).flow;
    expect(paused?.paused).toBe(true);
    resumeDiagramFlow(app, root);
    expect(isDiagramFlowPlaying(root)).toBe(true);
  });

  it('replay restarts after once', () => {
    const root = tinyFlow(app);
    app.add(root);
    applyDiagramFlow(app, root, {
      enabled: true,
      mode: 'dash',
      highlight: 'none',
      playback: 'once',
    });
    expect(isDiagramFlowPlaying(root)).toBe(true);
    pauseDiagramFlow(app, root);
    replayDiagramFlow(app, root);
    expect(isDiagramFlowPlaying(root)).toBe(true);
  });

  it('builder options.flow starts animation', () => {
    const root = Diagram.flowchart(
      app,
      {
        nodes: [
          { id: 'a', label: 'A', x: 20, y: 20 },
          { id: 'b', label: 'B', x: 200, y: 20 },
        ],
        edges: [{ from: 'a', to: 'b' }],
      },
      {
        width: 640,
        height: 400,
        flow: {
          enabled: true,
          mode: 'both',
          speed: 1,
          path: ['a', 'b'],
          highlight: 'pulse',
        },
      }
    );
    app.add(root);
    const flow = (root.metadata.diagramState as { flow?: { enabled?: boolean } }).flow;
    expect(flow?.enabled).toBe(true);
    expect(isDiagramFlowPlaying(root)).toBe(true);
  });
});
