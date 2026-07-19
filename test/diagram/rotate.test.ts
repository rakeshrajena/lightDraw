import { describe, it, expect } from 'vitest';
import {
  normalizeDegrees,
  pointerAngleDegrees,
  rotatedCardCenter,
  setRotationAroundCenter,
  snapDegrees,
} from '../../src/diagram/editor/rotate';

describe('diagram rotate helpers', () => {
  it('normalizes and snaps degrees', () => {
    expect(normalizeDegrees(370)).toBe(10);
    expect(normalizeDegrees(-190)).toBe(170);
    expect(snapDegrees(22)).toBe(15);
    expect(snapDegrees(23)).toBe(30);
    expect(snapDegrees(7, 0)).toBe(7);
  });

  it('pointerAngleDegrees is east=0 south=90', () => {
    expect(pointerAngleDegrees(0, 0, 10, 0)).toBeCloseTo(0, 5);
    expect(pointerAngleDegrees(0, 0, 0, 10)).toBeCloseTo(90, 5);
  });

  it('setRotationAroundCenter keeps visual center fixed', () => {
    const node = { x: 100, y: 50, rotation: 0, markDirty() {} };
    const w = 80;
    const h = 40;
    const before = rotatedCardCenter(node.x, node.y, w, h, 0);
    setRotationAroundCenter(node, 90, w, h);
    const after = rotatedCardCenter(node.x, node.y, w, h, node.rotation);
    expect(after.x).toBeCloseTo(before.x, 5);
    expect(after.y).toBeCloseTo(before.y, 5);
    expect(node.rotation).toBe(90);
  });
});
