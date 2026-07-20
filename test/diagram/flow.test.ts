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
  createFlowStatusMap,
  nodeIdsFromHops,
  DEFAULT_FLOW_STATUS_COLORS,
  resolveFlowStatusColors,
} from '../../src/diagram';
import { AnimationEngine } from '../../src/animation/Animation';
import { findEdgeLayer } from '../../src/diagram/editor/collect';
import { createTestApp, createTestContainer } from '../helpers';
import type { App } from '../../src/App';
import type { Group } from '../../src/shapes/Group';
import type { Node } from '../../src/Node';

function statusChrome(root: Group): Node[] {
  const overlay = root.children.find((c) => c.metadata?.diagramFlowOverlay) as Group | undefined;
  if (!overlay) return [];
  return overlay.children.filter((c) => c.metadata?.flowStatusChrome);
}

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

  it('createFlowStatusMap tracks idle → active → done and reset', () => {
    const map = createFlowStatusMap();
    expect(nodeIdsFromHops([{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }])).toEqual([
      'a',
      'b',
      'c',
    ]);
    map.beginRun(['a', 'b', 'c'], ['a->b', 'b->c']);
    expect(map.snapshot()).toEqual({ a: 'active', b: 'idle', c: 'idle' });
    expect(map.edgeSnapshot()).toEqual({ 'a->b': 'idle', 'b->c': 'idle' });
    map.hopStart('a', 'b');
    expect(map.edgeSnapshot()['a->b']).toBe('active');
    map.hopArrive('a', 'b', false);
    expect(map.snapshot()).toEqual({ a: 'done', b: 'active', c: 'idle' });
    expect(map.edgeSnapshot()['a->b']).toBe('done');
    map.hopArrive('b', 'c', true);
    expect(map.snapshot()).toEqual({ a: 'done', b: 'done', c: 'done' });
    map.reset();
    expect(map.snapshot()).toEqual({});
    map.beginRun(['a', 'b', 'c']);
    expect(map.snapshot().a).toBe('active');
    map.setError('b');
    expect(map.snapshot().b).toBe('error');
    map.applyOverrides({ c: 'done' });
    expect(map.snapshot().c).toBe('done');
  });

  it('statusHighlight defaults on with paths and paints idle/active chrome', () => {
    const root = tinyFlow(app);
    app.add(root);
    applyDiagramFlow(app, root, {
      enabled: true,
      mode: 'packet',
      highlight: 'none',
      path: ['a', 'b', 'c'],
      statusColors: { active: '#ffcc00', idle: '#8899aa' },
    });
    const flow = root.metadata.diagramState as {
      flow?: {
        statusHighlight?: boolean;
        statusEdges?: boolean;
        statusColors?: { active?: string };
      };
    };
    expect(flow.flow?.statusHighlight).toBe(true);
    expect(flow.flow?.statusEdges).toBe(true);
    expect(flow.flow?.statusColors?.active).toBe('#ffcc00');
    expect(resolveFlowStatusColors(flow.flow?.statusColors).idle).toBe('#8899aa');
    expect(resolveFlowStatusColors(undefined).done).toBe(DEFAULT_FLOW_STATUS_COLORS.done);

    const chrome = statusChrome(root);
    expect(chrome.length).toBe(3);
    const byId = Object.fromEntries(
      chrome.map((c) => [c.metadata?.flowStatusNodeId as string, c.metadata?.flowStatus as string])
    );
    expect(byId).toEqual({ a: 'active', b: 'idle', c: 'idle' });
    const active = chrome.find((c) => c.metadata?.flowStatusNodeId === 'a');
    expect(active?.stroke).toBe('#ffcc00');

    const edgeLayer = findEdgeLayer(root)!;
    const firstEdge = edgeLayer.children[0] as Group;
    expect(firstEdge.metadata?.flowEdgeStatus).toBe('active');
    const stroke = getEdgeStrokePolyline(firstEdge);
    expect(stroke?.stroke).toBe('#ffcc00');
  });

  it('statusHighlight: false skips status chrome', () => {
    const root = tinyFlow(app);
    app.add(root);
    applyDiagramFlow(app, root, {
      enabled: true,
      mode: 'packet',
      highlight: 'none',
      path: ['a', 'b', 'c'],
      statusHighlight: false,
    });
    const flow = root.metadata.diagramState as { flow?: { statusHighlight?: boolean } };
    expect(flow.flow?.statusHighlight).toBe(false);
    expect(statusChrome(root).length).toBe(0);
  });

  it('statusHighlight defaults off without paths', () => {
    const root = tinyFlow(app);
    app.add(root);
    applyDiagramFlow(app, root, {
      enabled: true,
      mode: 'dash',
      highlight: 'none',
    });
    const flow = root.metadata.diagramState as { flow?: { statusHighlight?: boolean } };
    expect(flow.flow?.statusHighlight).toBe(false);
    expect(statusChrome(root).length).toBe(0);
  });

  it('missing hop marks error and pauses when nothing resolves', () => {
    const root = tinyFlow(app);
    app.add(root);
    applyDiagramFlow(app, root, {
      enabled: true,
      mode: 'packet',
      highlight: 'none',
      path: ['a', 'missing', 'c'],
    });
    const flow = root.metadata.diagramState as { flow?: { paused?: boolean } };
    expect(flow.flow?.paused).toBe(true);
    expect(isDiagramFlowPlaying(root)).toBe(false);
    const chrome = statusChrome(root);
    const err = chrome.find((c) => c.metadata?.flowStatus === 'error');
    expect(err?.metadata?.flowStatusNodeId).toBe('a');
  });

  it('missing hop in a later run does not block a valid first run', () => {
    const root = tinyFlow(app);
    app.add(root);
    applyDiagramFlow(app, root, {
      enabled: true,
      mode: 'packet',
      highlight: 'none',
      paths: [
        ['a', 'b', 'c'],
        ['a', 'missing', 'c'],
      ],
      pathGapMs: 0,
    });
    const flow = root.metadata.diagramState as { flow?: { paused?: boolean } };
    expect(flow.flow?.paused).not.toBe(true);
    expect(isDiagramFlowPlaying(root)).toBe(true);
    const chrome = statusChrome(root);
    expect(chrome.some((c) => c.metadata?.flowStatusNodeId === 'a')).toBe(true);
  });

  it('declared path never falls through to ambient packets', () => {
    const root = tinyFlow(app);
    app.add(root);
    applyDiagramFlow(app, root, {
      enabled: true,
      mode: 'packet',
      highlight: 'none',
      statusPauseOnError: false,
      path: ['a', 'missing', 'c'],
    });
    const edgeLayer = findEdgeLayer(root)!;
    const packets = edgeLayer.children.flatMap((e) =>
      (e as Group).children.filter((c) => c.metadata?.diagramFlowPacket)
    );
    expect(packets.length).toBe(0);
  });

  it('pause keeps status chrome from the last snapshot', () => {
    const root = tinyFlow(app);
    app.add(root);
    applyDiagramFlow(app, root, {
      enabled: true,
      mode: 'packet',
      highlight: 'none',
      path: ['a', 'b', 'c'],
    });
    expect(statusChrome(root).length).toBe(3);
    pauseDiagramFlow(app, root);
    expect(isDiagramFlowPlaying(root)).toBe(false);
    const chrome = statusChrome(root);
    expect(chrome.length).toBe(3);
    const byId = Object.fromEntries(
      chrome.map((c) => [c.metadata?.flowStatusNodeId as string, c.metadata?.flowStatus as string])
    );
    expect(byId.a).toBe('active');
  });

  it('statusOverrides pin node status from JSON', () => {
    const root = tinyFlow(app);
    app.add(root);
    applyDiagramFlow(app, root, {
      enabled: true,
      mode: 'packet',
      highlight: 'none',
      path: ['a', 'b', 'c'],
      statusOverrides: { c: 'error' },
    });
    const flow = root.metadata.diagramState as {
      flow?: { statusOverrides?: Record<string, string> };
    };
    expect(flow.flow?.statusOverrides?.c).toBe('error');
    const chrome = statusChrome(root);
    const pinned = chrome.find((c) => c.metadata?.flowStatusNodeId === 'c');
    expect(pinned?.metadata?.flowStatus).toBe('error');
    expect(pinned?.stroke).toBe(DEFAULT_FLOW_STATUS_COLORS.error);
  });

  it('missing-hop error wins over statusOverrides on the same node', () => {
    const root = tinyFlow(app);
    app.add(root);
    applyDiagramFlow(app, root, {
      enabled: true,
      mode: 'packet',
      highlight: 'none',
      path: ['a', 'missing', 'c'],
      statusOverrides: { a: 'done' },
    });
    const err = statusChrome(root).find((c) => c.metadata?.flowStatusNodeId === 'a');
    expect(err?.metadata?.flowStatus).toBe('error');
  });
});
