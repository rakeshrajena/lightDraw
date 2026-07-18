import { describe, it, expect } from 'vitest';
import { applyAnchoredResize } from '../src/diagram/editor/resize';

describe('Anchored component resize', () => {
  const box = { x: 100, y: 80, width: 120, height: 60 };

  it('grows from the right edge, left anchored', () => {
    const next = applyAnchoredResize(box, 'e', 280, 110);
    expect(next.x).toBe(100);
    expect(next.y).toBe(80);
    expect(next.width).toBe(180);
    expect(next.height).toBe(60);
  });

  it('shrinks from the right edge inward', () => {
    const next = applyAnchoredResize(box, 'e', 160, 110);
    expect(next.x).toBe(100);
    expect(next.width).toBe(60);
    expect(next.height).toBe(60);
  });

  it('moves left edge and keeps right fixed', () => {
    const next = applyAnchoredResize(box, 'w', 60, 110);
    expect(next.x).toBe(60);
    expect(next.width).toBe(160);
    expect(next.y).toBe(80);
    expect(next.height).toBe(60);
  });

  it('grows from bottom, top anchored', () => {
    const next = applyAnchoredResize(box, 's', 160, 200);
    expect(next.y).toBe(80);
    expect(next.height).toBe(120);
    expect(next.width).toBe(120);
  });

  it('grows from top, bottom anchored', () => {
    const next = applyAnchoredResize(box, 'n', 160, 40);
    expect(next.y).toBe(40);
    expect(next.height).toBe(100);
    expect(next.x).toBe(100);
  });

  it('corner se resizes both axes from nw anchor', () => {
    const next = applyAnchoredResize(box, 'se', 250, 180);
    expect(next.x).toBe(100);
    expect(next.y).toBe(80);
    expect(next.width).toBe(150);
    expect(next.height).toBe(100);
  });

  it('corner nw resizes both axes from se anchor', () => {
    const next = applyAnchoredResize(box, 'nw', 70, 50);
    expect(next.x).toBe(70);
    expect(next.y).toBe(50);
    expect(next.width).toBe(150);
    expect(next.height).toBe(90);
  });

  it('clamps to minimum size when dragging inward too far', () => {
    const next = applyAnchoredResize(box, 'e', 105, 110, 28, 22);
    expect(next.width).toBe(28);
    expect(next.x).toBe(100);
  });
});
