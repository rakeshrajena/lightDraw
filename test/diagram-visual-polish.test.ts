import { describe, it, expect } from 'vitest';
import {
  roundOrthogonalCorners,
  quadraticToPoints,
  quadraticPathD,
  mermaidHorizontalLink,
  mermaidOrgBusPaths,
} from '../src/diagram/pathUtils';
import { arrowHeadPoints, diamondPoints, openArrowPoints } from '../src/diagram/connectors';
import { computeRoutePoints } from '../src/diagram/router';

describe('diagram professional path polish', () => {
  it('fillets orthogonal corners without moving endpoints', () => {
    const raw = [0, 0, 0, 40, 80, 40, 80, 80];
    const rounded = roundOrthogonalCorners(raw, 10, 6);
    expect(rounded[0]).toBe(0);
    expect(rounded[1]).toBe(0);
    expect(rounded[rounded.length - 2]).toBe(80);
    expect(rounded[rounded.length - 1]).toBe(80);
    expect(rounded.length).toBeGreaterThan(raw.length);
  });

  it('skips fillets on short segments', () => {
    const raw = [0, 0, 0, 4, 4, 4];
    const rounded = roundOrthogonalCorners(raw, 10);
    expect(rounded.length).toBe(raw.length);
  });

  it('smart routes apply corner rounding', () => {
    const pts = computeRoutePoints(10, 10, 100, 80, 'orthogonal', [], 8);
    expect(pts.length).toBeGreaterThan(8);
    expect(pts[0]).toBe(10);
    expect(pts[pts.length - 1]).toBe(80);
  });

  it('quadratic helpers produce path + samples', () => {
    const d = quadraticPathD(0, 0, 50, 40, 100, 0);
    expect(d).toContain('Q');
    const pts = quadraticToPoints(0, 0, 50, 40, 100, 0, 8);
    expect(pts.length).toBe(18);
    expect(pts[0]).toBe(0);
    expect(pts[pts.length - 2]).toBe(100);
  });

  it('arrow markers stay tip-anchored', () => {
    const filled = arrowHeadPoints(100, 50, 0, 12);
    expect(filled[0]).toBe(100);
    expect(filled[1]).toBe(50);
    const open = openArrowPoints(100, 50, 0, 12);
    expect(open[2]).toBe(100);
    expect(open[3]).toBe(50);
    const diamond = diamondPoints(100, 50, 0, 12);
    expect(diamond[0]).toBe(100);
    expect(diamond.length).toBe(8);
  });

  it('mermaid horizontal links and org bus paths', () => {
    const link = mermaidHorizontalLink(0, 50, 200, 80, 12);
    expect(link[0]).toBe(0);
    expect(link[1]).toBe(50);
    expect(link[link.length - 2]).toBe(200);
    expect(link[link.length - 1]).toBe(80);
    expect(link.length).toBeGreaterThan(8);

    const bus = mermaidOrgBusPaths(100, 40, [
      { x: 40, topY: 120 },
      { x: 100, topY: 120 },
      { x: 160, topY: 120 },
    ]);
    expect(bus.stem.length).toBeGreaterThanOrEqual(4);
    expect(bus.bus.length).toBe(4);
    expect(bus.drops).toHaveLength(3);
    expect(bus.elbows).toHaveLength(3);
  });
});
