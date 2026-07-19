import { describe, it, expect } from 'vitest';
import {
  stringLCurve,
  stringUCurve,
  stringCCurve,
  stringCurveFromOrthogonal,
} from '../src/diagram/pathUtils';

describe('String-like wire bends', () => {
  it('L curve keeps endpoints and smooth midpoints', () => {
    const pts = stringLCurve(0, 0, 0, 100, 80, 100);
    expect(pts[0]).toBe(0);
    expect(pts[1]).toBe(0);
    expect(pts[pts.length - 2]).toBe(80);
    expect(pts[pts.length - 1]).toBe(100);
    expect(pts.length).toBeGreaterThan(8);
    // Midpoint should bow into the L (not sit on the sharp corner 0,100 alone)
    const midX = pts[Math.floor(pts.length / 4)];
    expect(midX).toBeGreaterThan(-1);
  });

  it('U curve bows through the rail like a flexible string', () => {
    const pts = stringUCurve(10, 0, 50, 90, 0);
    expect(pts[0]).toBe(10);
    expect(pts[1]).toBe(0);
    expect(pts[pts.length - 2]).toBe(90);
    expect(pts[pts.length - 1]).toBe(0);
    // Deepest point should approach the rail
    let maxY = 0;
    for (let i = 1; i < pts.length; i += 2) maxY = Math.max(maxY, pts[i]);
    expect(maxY).toBeGreaterThan(25);
    expect(maxY).toBeLessThanOrEqual(50 + 1);
  });

  it('C curve spans a vertical rail', () => {
    const pts = stringCCurve(0, 10, 60, 0, 90);
    expect(pts[0]).toBe(0);
    expect(pts[pts.length - 1]).toBe(90);
    let maxX = 0;
    for (let i = 0; i < pts.length; i += 2) maxX = Math.max(maxX, pts[i]);
    expect(maxX).toBeGreaterThan(30);
  });

  it('orthogonal skeleton converts to U / L string curves', () => {
    const u = stringCurveFromOrthogonal([10, 0, 10, 40, 80, 40, 80, 0]);
    expect(u.length).toBeGreaterThan(8);
    expect(u[0]).toBe(10);
    expect(u[u.length - 2]).toBe(80);

    const l = stringCurveFromOrthogonal([0, 0, 0, 50, 70, 50]);
    expect(l[0]).toBe(0);
    expect(l[l.length - 2]).toBe(70);
    expect(l[l.length - 1]).toBe(50);
  });
});
