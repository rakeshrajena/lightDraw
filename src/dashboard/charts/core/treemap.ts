import type { HierarchyNode } from '../types';

export interface TreemapRect {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  value: number;
}

export function squarify(
  nodes: HierarchyNode[],
  x: number,
  y: number,
  width: number,
  height: number
): TreemapRect[] {
  const items = nodes
    .map((n) => ({ name: n.name, value: n.value ?? sumChildren(n) }))
    .filter((n) => n.value > 0);
  const total = items.reduce((a, b) => a + b.value, 0) || 1;
  const rects: TreemapRect[] = [];
  layoutRow(items, x, y, width, height, total, rects);
  return rects;
}

function sumChildren(n: HierarchyNode): number {
  if (n.value != null) return n.value;
  if (!n.children?.length) return 1;
  return n.children.reduce((a, c) => a + sumChildren(c), 0);
}

function layoutRow(
  items: { name: string; value: number }[],
  x: number,
  y: number,
  w: number,
  h: number,
  total: number,
  out: TreemapRect[]
): void {
  if (!items.length) return;
  if (items.length === 1) {
    out.push({ name: items[0].name, x, y, width: w, height: h, value: items[0].value });
    return;
  }
  const horizontal = w >= h;
  const sum = items.reduce((a, b) => a + b.value, 0);
  const rowValue = items[0].value;
  const rowFrac = rowValue / sum;
  if (horizontal) {
    const rw = w * rowFrac;
    out.push({ name: items[0].name, x, y, width: rw, height: h, value: items[0].value });
    layoutRow(items.slice(1), x + rw, y, w - rw, h, total - rowValue, out);
  } else {
    const rh = h * rowFrac;
    out.push({ name: items[0].name, x, y, width: w, height: rh, value: items[0].value });
    layoutRow(items.slice(1), x, y + rh, w, h - rh, total - rowValue, out);
  }
}

export function flattenHierarchy(root: HierarchyNode): HierarchyNode[] {
  const out: HierarchyNode[] = [];
  const walk = (n: HierarchyNode) => {
    if (!n.children?.length) out.push(n);
    else n.children.forEach(walk);
  };
  if (root.children?.length) root.children.forEach(walk);
  else out.push(root);
  return out;
}
