import type { Node } from '../Node';
import { Rect } from '../shapes/index';

/** Stable key for batching nodes with identical paint styles. */
export function paintStyleKey(node: Node): string {
  const fill =
    node.fill === null || node.fill === undefined
      ? ''
      : typeof node.fill === 'string'
        ? node.fill
        : JSON.stringify(node.fill);
  const stroke =
    node.stroke === null || node.stroke === undefined
      ? ''
      : typeof node.stroke === 'string'
        ? node.stroke
        : JSON.stringify(node.stroke);
  return `${fill}|${stroke}|${node.strokeWidth}|${node.dash.join(',')}|${node.lineCap}|${node.lineJoin}`;
}

/** Rect eligible for fill batching (simple transforms, no effects). */
export function isBatchableRect(node: Node): node is Rect {
  return (
    node instanceof Rect &&
    !node.clip &&
    !node.mask &&
    !node.shadow &&
    node.rotation === 0 &&
    node.skewX === 0 &&
    node.skewY === 0 &&
    node.scaleX === 1 &&
    node.scaleY === 1 &&
    node.cornerRadius === 0 &&
    !node.stroke
  );
}
