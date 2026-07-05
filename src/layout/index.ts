import type { Group } from '../shapes/Group';

export interface LayoutOptions {
  columns?: number;
  gap?: number;
  padding?: number;
  direction?: 'row' | 'column';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around';
  wrap?: boolean;
  /** Main-axis container size (width for row, height for column). */
  width?: number;
  height?: number;
}

function sumChildMainSize(group: Group, isRow: boolean, gap: number): number {
  let total = 0;
  for (let i = 0; i < group.children.length; i++) {
    const b = group.children[i].getBounds();
    total += (isRow ? b.width : b.height) + (i > 0 ? gap : 0);
  }
  return total;
}

/** Flex layout with wrap, align, and justify. */
export function flexLayout(group: Group, options: LayoutOptions = {}): void {
  const {
    direction = 'row',
    gap = 8,
    padding = 0,
    align = 'start',
    justify = 'start',
    wrap = false,
    width,
    height,
  } = options;

  const isRow = direction === 'row';
  const bounds = group.getBounds();
  const intrinsic = sumChildMainSize(group, isRow, gap);
  const containerSize =
    (isRow ? width : height) ??
    ((isRow ? bounds.width : bounds.height) || intrinsic || 800);
  const maxMain = Math.max(containerSize - padding * 2, 0);

  type Row = { items: typeof group.children; mainSize: number; crossSize: number };
  const rows: Row[] = [];
  let current: Row = { items: [], mainSize: 0, crossSize: 0 };

  for (const child of group.children) {
    const b = child.getBounds();
    const main = isRow ? b.width : b.height;
    const cross = isRow ? b.height : b.width;

    if (wrap && current.items.length > 0 && current.mainSize + gap + main > maxMain) {
      rows.push(current);
      current = { items: [], mainSize: 0, crossSize: 0 };
    }

    current.items.push(child);
    current.mainSize += (current.items.length > 1 ? gap : 0) + main;
    current.crossSize = Math.max(current.crossSize, cross);
  }
  if (current.items.length > 0) rows.push(current);

  let crossOffset = padding;
  for (const row of rows) {
    let mainOffset = padding;
    const freeSpace = maxMain - row.mainSize;
    let extraGap = gap;

    if (justify === 'center') mainOffset += freeSpace / 2;
    else if (justify === 'end') mainOffset += freeSpace;
    else if (justify === 'space-between' && row.items.length > 1) {
      extraGap = gap + freeSpace / (row.items.length - 1);
    } else if (justify === 'space-around' && row.items.length > 0) {
      extraGap = gap + freeSpace / row.items.length;
      mainOffset += freeSpace / (row.items.length * 2);
    }

    for (const child of row.items) {
      const b = child.getBounds();
      const cross = isRow ? b.height : b.width;
      let crossPos = crossOffset;

      if (align === 'center') crossPos += (row.crossSize - cross) / 2;
      else if (align === 'end') crossPos += row.crossSize - cross;
      else if (align === 'stretch') {
        /* stretch not applied to bounds in html fallback */
      }

      if (isRow) {
        child.x = mainOffset;
        child.y = crossPos;
        mainOffset += b.width + extraGap;
      } else {
        child.x = crossPos;
        child.y = mainOffset;
        mainOffset += b.height + extraGap;
      }
      child.markDirty();
    }

    crossOffset += row.crossSize + gap;
  }
}

/** Grid layout */
export function gridLayout(group: Group, options: LayoutOptions = {}): void {
  const { columns = 3, gap = 10, padding = 0 } = options;
  let x = padding;
  let y = padding;
  let col = 0;
  let rowHeight = 0;

  for (const child of group.children) {
    const b = child.getBounds();
    child.x = x;
    child.y = y;
    rowHeight = Math.max(rowHeight, b.height);
    col++;
    if (col >= columns) {
      col = 0;
      x = padding;
      y += rowHeight + gap;
      rowHeight = 0;
    } else {
      x += b.width + gap;
    }
    child.markDirty();
  }
}

/** Stack layout (vertical or horizontal) */
export function stackLayout(group: Group, options: LayoutOptions = {}): void {
  flexLayout(group, { ...options, wrap: false });
}

/** Flex-like layout — full flexbox implementation */
// flexLayout defined above

/** Flow layout - wrap items */
export function flowLayout(group: Group, options: LayoutOptions = {}): void {
  gridLayout(group, { ...options, columns: options.columns ?? 4 });
}

/** Circular layout */
export function circularLayout(
  group: Group,
  cx: number,
  cy: number,
  radius: number
): void {
  const n = group.children.length;
  if (n === 0) return;
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    const child = group.children[i];
    child.x = cx + radius * Math.cos(angle);
    child.y = cy + radius * Math.sin(angle);
    child.markDirty();
  }
}

/** Tree layout (simple hierarchical) */
export function treeLayout(
  group: Group,
  levelGap = 80,
  siblingGap = 40
): void {
  layoutTreeNode(group, 0, 0, levelGap, siblingGap);
}

function layoutTreeNode(
  node: Group,
  x: number,
  y: number,
  levelGap: number,
  siblingGap: number
): number {
  node.x = x;
  node.y = y;
  node.markDirty();

  let childX = x;
  for (const child of node.children) {
    if ('children' in child) {
      childX = layoutTreeNode(child as Group, childX, y + levelGap, levelGap, siblingGap);
    } else {
      child.x = childX;
      child.y = y + levelGap;
      child.markDirty();
      childX += child.getBounds().width + siblingGap;
    }
  }
  return childX;
}

/** Auto-align children */
export function alignChildren(
  group: Group,
  alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
): void {
  const bounds = group.getBounds();
  for (const child of group.children) {
    const b = child.getBounds();
    switch (alignment) {
      case 'left':
        child.x = bounds.x;
        break;
      case 'center':
        child.x = bounds.x + (bounds.width - b.width) / 2;
        break;
      case 'right':
        child.x = bounds.x + bounds.width - b.width;
        break;
      case 'top':
        child.y = bounds.y;
        break;
      case 'middle':
        child.y = bounds.y + (bounds.height - b.height) / 2;
        break;
      case 'bottom':
        child.y = bounds.y + bounds.height - b.height;
        break;
    }
    child.markDirty();
  }
}

/** Distribute spacing evenly */
export function distributeSpacing(group: Group, axis: 'x' | 'y'): void {
  const children = group.children;
  if (children.length < 2) return;

  const bounds = group.getBounds();
  const totalSize = children.reduce(
    (sum, c) => sum + (axis === 'x' ? c.getBounds().width : c.getBounds().height),
    0
  );
  const gap = (axis === 'x' ? bounds.width : bounds.height - totalSize) / (children.length - 1);
  let offset = axis === 'x' ? bounds.x : bounds.y;

  for (const child of children) {
    if (axis === 'x') {
      child.x = offset;
      offset += child.getBounds().width + gap;
    } else {
      child.y = offset;
      offset += child.getBounds().height + gap;
    }
    child.markDirty();
  }
}

export const Layout = {
  grid: gridLayout,
  stack: stackLayout,
  flex: flexLayout,
  flow: flowLayout,
  circular: circularLayout,
  tree: treeLayout,
  align: alignChildren,
  distribute: distributeSpacing,
};
