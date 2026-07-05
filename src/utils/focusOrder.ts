import type { Node } from '../Node';
import type { Group } from '../shapes/Group';

/** Collect focusable, visible, listening nodes in tab order. */
export function collectFocusable(root: Group): Node[] {
  const nodes: Node[] = [];
  walk(root, nodes);
  nodes.sort((a, b) => {
    const ta = a.tabIndex ?? 0;
    const tb = b.tabIndex ?? 0;
    if (ta !== tb) return ta - tb;
    return 0;
  });
  return nodes;
}

function walk(node: Node, out: Node[]): void {
  if ('children' in node) {
    for (const child of (node as Group).children) {
      walk(child, out);
    }
  }
  if (node.focusable && node.visible && node.listening) {
    out.push(node);
  }
}
