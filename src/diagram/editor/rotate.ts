/**
 * Diagram editor — rotate helpers.
 * Node.rotation is around the local origin (top-left). These helpers keep the
 * visual center fixed when the angle changes so symbols spin in place.
 */

export function normalizeDegrees(deg: number): number {
  let d = deg % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

export function snapDegrees(deg: number, step = 15): number {
  if (step <= 0) return normalizeDegrees(deg);
  return normalizeDegrees(Math.round(deg / step) * step);
}

/** Angle in degrees from center to pointer (0° = east, 90° = south — canvas Y-down). */
export function pointerAngleDegrees(cx: number, cy: number, px: number, py: number): number {
  return (Math.atan2(py - cy, px - cx) * 180) / Math.PI;
}

/** Parent-space center of a card given top-left origin + rotation (degrees). */
export function rotatedCardCenter(
  x: number,
  y: number,
  width: number,
  height: number,
  rotationDeg: number
): { x: number; y: number } {
  const rad = (rotationDeg * Math.PI) / 180;
  const lx = width / 2;
  const ly = height / 2;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: x + lx * cos - ly * sin,
    y: y + lx * sin + ly * cos,
  };
}

/**
 * Set node.rotation while keeping the card's visual center fixed.
 * `width` / `height` are the unrotated card size including current scale.
 */
export function setRotationAroundCenter(
  node: { x: number; y: number; rotation: number; markDirty?: () => void },
  nextDeg: number,
  width: number,
  height: number
): void {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const before = rotatedCardCenter(node.x, node.y, w, h, node.rotation);
  node.rotation = normalizeDegrees(nextDeg);
  const after = rotatedCardCenter(node.x, node.y, w, h, node.rotation);
  node.x += before.x - after.x;
  node.y += before.y - after.y;
  node.markDirty?.();
}
