import { describe, it, expect } from 'vitest';
import { pathThroughWaypoints, nearestPointOnPolyline, catmullRomToPoints } from '../src/diagram/pathUtils';

describe('Wire bend waypoints', () => {
  it('pathThroughWaypoints keeps endpoints and passes near bends', () => {
    const pts = pathThroughWaypoints(0, 0, [{ x: 40, y: 60 }], 100, 0, 10);
    expect(pts[0]).toBe(0);
    expect(pts[1]).toBe(0);
    expect(pts[pts.length - 2]).toBe(100);
    expect(pts[pts.length - 1]).toBe(0);
    expect(pts.length).toBeGreaterThan(6);
    let maxY = 0;
    for (let i = 1; i < pts.length; i += 2) maxY = Math.max(maxY, pts[i]);
    expect(maxY).toBeGreaterThan(30);
  });

  it('nearestPointOnPolyline projects onto a segment', () => {
    const poly = [0, 0, 100, 0, 100, 80];
    const near = nearestPointOnPolyline(poly, 50, 10);
    expect(near.x).toBeCloseTo(50, 0);
    expect(near.y).toBeCloseTo(0, 0);
    expect(near.dist).toBeLessThan(15);
  });

  it('catmullRom samples a multi-point path', () => {
    const pts = catmullRomToPoints([0, 0, 50, 40, 100, 0], 8);
    expect(pts.length).toBeGreaterThan(8);
  });
});
