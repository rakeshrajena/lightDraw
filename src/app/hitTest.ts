/**
 * App hit-testing helpers (spatial index + tree walk).
 */
import type { Group } from '../shapes/Group';
import type { Node } from '../Node';
import { pointInMask } from '../renderers/clipUtils';
import { matrixPool } from '../utils';
import type { SpatialIndex } from '../performance/SpatialIndex';

/** Hit-test using spatial index candidates. */
export function hitTestSpatial(
  spatialIndex: SpatialIndex,
  worldX: number,
  worldY: number
): Node | null {
  const candidates = spatialIndex.queryPoint(worldX, worldY);
  for (const child of candidates) {
    if (!child.visible || !child.listening) continue;
    const wm = child.getWorldMatrix();
    const inv = matrixPool.acquire();
    if (!wm.invertInto(inv)) {
      matrixPool.release(inv);
      continue;
    }
    const local = inv.transformPoint(worldX, worldY);
    matrixPool.release(inv);
    if (!pointInMask(child.mask, local.x, local.y)) continue;
    if (child.containsPoint(local.x, local.y)) return child;
  }
  return null;
}

/** Recursive hit-test walking the scene tree (front-to-back). */
export function hitTestNode(group: Group, worldX: number, worldY: number): Node | null {
  const children = [...group.children].reverse();
  for (const child of children) {
    if (!child.visible || !child.listening) continue;

    if ('children' in child) {
      const nested = hitTestNode(child as Group, worldX, worldY);
      if (nested) return nested;
    }

    const wm = child.getWorldMatrix();
    const inv = matrixPool.acquire();
    if (!wm.invertInto(inv)) {
      matrixPool.release(inv);
      continue;
    }
    const local = inv.transformPoint(worldX, worldY);
    matrixPool.release(inv);

    if (!pointInMask(child.mask, local.x, local.y)) continue;

    if (child.containsPoint(local.x, local.y)) {
      return child;
    }
  }
  return null;
}
