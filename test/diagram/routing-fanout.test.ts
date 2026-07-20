import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Diagram } from '../../src/diagram';
import {
  fanAlongSlots,
  planEdgeFanAnchors,
  preferredExitSide,
  nearestFreePortOnSymbol,
  getCardSideAnchor,
} from '../../src/diagram/coords';
import { separateOverlappingNodes } from '../../src/diagram/helpers';
import { findEdgeLayer, findNodeByDiagramId } from '../../src/diagram/editor/collect';
import { createTestApp, createTestContainer } from '../helpers';
import type { App } from '../../src/App';
import type { Group } from '../../src/shapes/Group';
import type { Node } from '../../src/Node';

describe('diagram wire routing + fan-out', () => {
  let app: App;

  beforeEach(() => {
    const container = createTestContainer(640, 400);
    app = createTestApp(container, { renderer: 'html', width: 640, height: 400 });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('fanAlongSlots spreads ports across the side', () => {
    expect(fanAlongSlots(1)).toEqual([0.5]);
    expect(fanAlongSlots(2)).toEqual([0.2, 0.8]);
    expect(fanAlongSlots(3)[0]).toBeCloseTo(0.2);
    expect(fanAlongSlots(3)[1]).toBeCloseTo(0.5);
    expect(fanAlongSlots(3)[2]).toBeCloseTo(0.8);
  });

  it('preferredExitSide uses free left/right when targets are lateral', () => {
    expect(preferredExitSide(-120, 160)).toBe('left');
    expect(preferredExitSide(120, 160)).toBe('right');
    expect(preferredExitSide(10, 160)).toBe('bottom');
    expect(preferredExitSide(-10, -160)).toBe('top');
  });

  it('decision branches use different sides when peers sit left and right', () => {
    const root = Diagram.flowchart(
      app,
      {
        nodes: [
          { id: 'check', label: 'Even?', type: 'decision', x: 200, y: 40 },
          { id: 'even', label: 'Even', type: 'process', x: 40, y: 200 },
          { id: 'odd', label: 'Odd', type: 'process', x: 360, y: 200 },
        ],
        edges: [
          { from: 'check', to: 'even', label: 'yes' },
          { from: 'check', to: 'odd', label: 'no' },
        ],
      },
      { width: 640, height: 400 }
    );
    const from = findNodeByDiagramId(root as Group, 'check')!;
    const even = findNodeByDiagramId(root as Group, 'even')!;
    const odd = findNodeByDiagramId(root as Group, 'odd')!;
    const plan = planEdgeFanAnchors(
      [
        { key: 'yes', from, to: even },
        { key: 'no', from, to: odd },
      ],
      root as Group
    );
    expect(plan.get('yes')!.fromSide).toBe('left');
    expect(plan.get('no')!.fromSide).toBe('right');
  });

  it('decision branches leave distinct start points', () => {
    const root = Diagram.flowchart(
      app,
      {
        nodes: [
          { id: 'check', label: 'Even?', type: 'decision', x: 200, y: 40 },
          { id: 'even', label: 'Even', type: 'process', x: 80, y: 200 },
          { id: 'odd', label: 'Odd', type: 'process', x: 320, y: 200 },
        ],
        edges: [
          { from: 'check', to: 'even', label: 'yes' },
          { from: 'check', to: 'odd', label: 'no' },
        ],
      },
      { width: 640, height: 400 }
    );
    app.add(root);

    const layer = findEdgeLayer(root as Group);
    expect(layer).toBeTruthy();
    const edges = (layer as Group).children.filter((c) => c.metadata?.edgePoints);
    expect(edges.length).toBe(2);

    const a = edges[0].metadata.edgePoints as number[];
    const b = edges[1].metadata.edgePoints as number[];
    const sameStart = Math.abs(a[0] - b[0]) < 0.5 && Math.abs(a[1] - b[1]) < 0.5;
    expect(sameStart).toBe(false);
  });

  it('planEdgeFanAnchors keeps start points apart', () => {
    const root = Diagram.flowchart(
      app,
      {
        nodes: [
          { id: 'a', label: 'A', x: 200, y: 40 },
          { id: 'b', label: 'B', x: 80, y: 200 },
          { id: 'c', label: 'C', x: 320, y: 200 },
        ],
        edges: [
          { from: 'a', to: 'b' },
          { from: 'a', to: 'c' },
        ],
      },
      { width: 640, height: 400 }
    );
    const from = findNodeByDiagramId(root as Group, 'a')!;
    const b = findNodeByDiagramId(root as Group, 'b')!;
    const c = findNodeByDiagramId(root as Group, 'c')!;
    const plan = planEdgeFanAnchors(
      [
        { key: 'a->b', from, to: b },
        { key: 'a->c', from, to: c },
      ],
      root as Group
    );
    const p1 = plan.get('a->b')!;
    const p2 = plan.get('a->c')!;
    expect(Math.abs(p1.x1 - p2.x1) + Math.abs(p1.y1 - p2.y1)).toBeGreaterThan(4);
  });

  it('nearestFreePortOnSymbol avoids occupied border points', () => {
    const root = Diagram.flowchart(
      app,
      {
        nodes: [
          { id: 'a', label: 'A', x: 200, y: 40 },
          { id: 'b', label: 'B', x: 80, y: 200 },
          { id: 'c', label: 'C', x: 320, y: 200 },
        ],
        edges: [{ from: 'a', to: 'b' }],
      },
      { width: 640, height: 400 }
    );
    const from = findNodeByDiagramId(root as Group, 'a')!;
    const mid = getCardSideAnchor(from, root as Group, 'bottom', 0.5);
    const peer = getCardSideAnchor(
      findNodeByDiagramId(root as Group, 'c')!,
      root as Group,
      'center'
    );
    const free = nearestFreePortOnSymbol(from, root as Group, peer.x, peer.y, [
      { x: mid.x, y: mid.y },
    ]);
    expect(free).toBeTruthy();
    expect(Math.hypot(free!.x - mid.x, free!.y - mid.y)).toBeGreaterThan(8);
  });

  it('crowded same-side edges snap to distinct ports on the symbol', () => {
    const root = Diagram.flowchart(
      app,
      {
        nodes: [
          { id: 'hub', label: 'Hub', x: 220, y: 40 },
          { id: 'a', label: 'A', x: 100, y: 220 },
          { id: 'b', label: 'B', x: 220, y: 220 },
          { id: 'c', label: 'C', x: 340, y: 220 },
        ],
        edges: [
          { from: 'hub', to: 'a' },
          { from: 'hub', to: 'b' },
          { from: 'hub', to: 'c' },
        ],
      },
      { width: 640, height: 400 }
    );
    const hub = findNodeByDiagramId(root as Group, 'hub')!;
    const a = findNodeByDiagramId(root as Group, 'a')!;
    const b = findNodeByDiagramId(root as Group, 'b')!;
    const c = findNodeByDiagramId(root as Group, 'c')!;
    const plan = planEdgeFanAnchors(
      [
        { key: '1', from: hub, to: a },
        { key: '2', from: hub, to: b },
        { key: '3', from: hub, to: c },
      ],
      root as Group
    );
    const pts = [plan.get('1')!, plan.get('2')!, plan.get('3')!].map((p) => ({
      x: p.x1,
      y: p.y1,
    }));
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        expect(Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y)).toBeGreaterThan(6);
      }
    }
  });

  it('separateOverlappingNodes pushes stacked symbols apart', () => {
    const a = {
      x: 100,
      y: 100,
      metadata: { diagramCardWidth: 120, diagramCardHeight: 48 },
      markDirty() {},
    } as unknown as Node;
    const b = {
      x: 110,
      y: 105,
      metadata: { diagramCardWidth: 120, diagramCardHeight: 48 },
      markDirty() {},
    } as unknown as Node;
    separateOverlappingNodes([a, b], { gap: 16, iterations: 10 });
    const aw = 120;
    const ah = 48;
    const overlapX = Math.min(a.x + aw, b.x + aw) - Math.max(a.x, b.x);
    const overlapY = Math.min(a.y + ah, b.y + ah) - Math.max(a.y, b.y);
    expect(overlapX <= -16 || overlapY <= -16).toBe(true);
  });
});
