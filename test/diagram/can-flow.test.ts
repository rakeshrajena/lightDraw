import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  Diagram,
  applyDiagramFlow,
  stopDiagramFlow,
  isDiagramFlowPlaying,
} from '../../src/diagram';
import { canBusHopPoints, ensureCanNetworkFlowEdges, CAN_BUS_TAP } from '../../src/diagram/canFlow';
import { findEdgeLayer, findNodeByDiagramId } from '../../src/diagram/editor/collect';
import { AnimationEngine } from '../../src/animation/Animation';
import { createTestApp, createTestContainer } from '../helpers';
import type { App } from '../../src/App';
import type { Group } from '../../src/shapes/Group';

function tinyCan(app: App) {
  return Diagram.canNetwork(
    app,
    {
      busLabel: 'CAN HS',
      ecus: [
        { id: 'ecm', label: 'ECM', address: '0x7E0' },
        { id: 'tcu', label: 'TCU', address: '0x7E1' },
        { id: 'abs', label: 'ABS', address: '0x7E2' },
      ],
    },
    { width: 640, height: 320 }
  );
}

describe('CAN bus flow animation', () => {
  let app: App;

  beforeEach(() => {
    const container = createTestContainer(640, 320);
    app = createTestApp(container, { renderer: 'html', width: 640, height: 320 });
  });

  afterEach(() => {
    AnimationEngine.stopAll();
    document.body.innerHTML = '';
  });

  it('canBusHopPoints rides the rail between ECU taps', () => {
    const from = { x: 100, y: 90 } as { x: number; y: number };
    const to = { x: 300, y: 90 } as { x: number; y: number };
    const busY = 72;
    const pts = canBusHopPoints(from as never, to as never, busY);
    expect(pts).toEqual([
      100 + 48,
      90,
      100 + 48,
      busY,
      300 + 48,
      busY,
      300 + 48,
      90,
    ]);
    expect(CAN_BUS_TAP).toBe(18);
  });

  it('ensureCanNetworkFlowEdges builds hop edges for a path', () => {
    const root = tinyCan(app);
    app.add(root);
    ensureCanNetworkFlowEdges(app, root as Group, [
      { from: 'ecm', to: 'tcu' },
      { from: 'tcu', to: 'abs' },
    ]);
    const layer = findEdgeLayer(root as Group);
    expect(layer).toBeTruthy();
    const edges = layer!.children.filter((c) => c.metadata?.canFlowEdge);
    expect(edges.length).toBe(2);
    expect(edges[0].metadata.edgeFrom).toBe('ecm');
    expect(edges[0].metadata.edgeTo).toBe('tcu');
    const pts = edges[0].metadata.edgePoints as number[];
    expect(pts.length).toBe(8);
  });

  it('applyDiagramFlow plays packets along the CAN bus path', () => {
    const root = tinyCan(app);
    app.add(root);
    applyDiagramFlow(app, root as Group, {
      enabled: true,
      mode: 'both',
      playback: 'loop',
      speed: 1,
      statusHighlight: true,
      path: ['ecm', 'tcu', 'abs'],
    });
    expect(isDiagramFlowPlaying(root as Group)).toBe(true);
    const layer = findEdgeLayer(root as Group);
    expect(layer?.children.some((c) => c.metadata?.canFlowEdge)).toBe(true);
    const ecm = findNodeByDiagramId(root as Group, 'ecm');
    expect(ecm).toBeTruthy();
    stopDiagramFlow(root as Group);
    expect(isDiagramFlowPlaying(root as Group)).toBe(false);
  });

  it('builder flow option starts CAN animation', () => {
    const root = Diagram.canNetwork(
      app,
      {
        busLabel: 'CAN',
        ecus: [
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B' },
        ],
      },
      {
        width: 640,
        height: 320,
        flow: {
          enabled: true,
          mode: 'packet',
          path: ['a', 'b'],
          statusHighlight: true,
        },
      }
    );
    app.add(root);
    expect(isDiagramFlowPlaying(root as Group)).toBe(true);
    stopDiagramFlow(root as Group);
  });
});
