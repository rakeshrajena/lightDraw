/** Eight resize grips: corners + mid-edges. */
export type ResizeHandleId = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se';

export interface ResizeBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const MIN_W = 28;
const MIN_H = 22;

/**
 * Resize a box from a handle while anchoring the opposite edge/corner.
 * Outward drag grows; inward drag shrinks (clamped to min size).
 */
export function applyAnchoredResize(
  start: ResizeBox,
  handle: ResizeHandleId,
  pointerX: number,
  pointerY: number,
  minW = MIN_W,
  minH = MIN_H
): ResizeBox {
  const right0 = start.x + start.width;
  const bottom0 = start.y + start.height;

  let left = start.x;
  let top = start.y;
  let right = right0;
  let bottom = bottom0;

  switch (handle) {
    case 'e':
      right = Math.max(pointerX, left + minW);
      break;
    case 'w':
      left = Math.min(pointerX, right - minW);
      break;
    case 's':
      bottom = Math.max(pointerY, top + minH);
      break;
    case 'n':
      top = Math.min(pointerY, bottom - minH);
      break;
    case 'se':
      right = Math.max(pointerX, left + minW);
      bottom = Math.max(pointerY, top + minH);
      break;
    case 'sw':
      left = Math.min(pointerX, right - minW);
      bottom = Math.max(pointerY, top + minH);
      break;
    case 'ne':
      right = Math.max(pointerX, left + minW);
      top = Math.min(pointerY, bottom - minH);
      break;
    case 'nw':
      left = Math.min(pointerX, right - minW);
      top = Math.min(pointerY, bottom - minH);
      break;
  }

  return {
    x: left,
    y: top,
    width: Math.max(minW, right - left),
    height: Math.max(minH, bottom - top),
  };
}

export const RESIZE_HANDLES: Array<{
  id: ResizeHandleId;
  /** Normalized position on the selection box (0–1). */
  u: number;
  v: number;
}> = [
  { id: 'nw', u: 0, v: 0 },
  { id: 'n', u: 0.5, v: 0 },
  { id: 'ne', u: 1, v: 0 },
  { id: 'e', u: 1, v: 0.5 },
  { id: 'se', u: 1, v: 1 },
  { id: 's', u: 0.5, v: 1 },
  { id: 'sw', u: 0, v: 1 },
  { id: 'w', u: 0, v: 0.5 },
];
