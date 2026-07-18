import type { App } from '../../App';
import type { Group } from '../../shapes/Group';
import { isEditableDiagramNode } from './collect';

/** Add a transparent hit area so diagram nodes receive pointer events. */
export function attachNodeHitTarget(app: App, node: Group): void {
  if (node.metadata?.hitTargetAttached) return;
  const cardW = (node.metadata?.orgCardWidth ?? node.metadata?.diagramCardWidth) as
    | number
    | undefined;
  const cardH = (node.metadata?.orgCardHeight ?? node.metadata?.diagramCardHeight) as
    | number
    | undefined;
  let hx = 0;
  let hy = 0;
  let w: number;
  let h: number;
  if (typeof cardW === 'number' && typeof cardH === 'number' && cardW > 0 && cardH > 0) {
    w = cardW;
    h = cardH;
  } else {
    // Prefer local children AABB over Group.getBounds() (world) for nested trees
    let minX = 0;
    let minY = 0;
    let maxX = 40;
    let maxY = 32;
    if (node.children.length > 0) {
      minX = Infinity;
      minY = Infinity;
      maxX = -Infinity;
      maxY = -Infinity;
      for (const child of node.children) {
        if (child.metadata?.isDiagramHitTarget) continue;
        if (child.metadata?.orgNode) continue;
        const cb = child.getBounds();
        minX = Math.min(minX, child.x + cb.x);
        minY = Math.min(minY, child.y + cb.y);
        maxX = Math.max(maxX, child.x + cb.x + cb.width);
        maxY = Math.max(maxY, child.y + cb.y + cb.height);
      }
      if (!Number.isFinite(minX)) {
        minX = 0;
        minY = 0;
        maxX = 40;
        maxY = 32;
      }
    }
    hx = minX;
    hy = minY;
    w = Math.max(maxX - minX, 24);
    h = Math.max(maxY - minY, 24);
  }
  const hit = app.rect({
    x: hx,
    y: hy,
    width: w,
    height: h,
    fill: 'rgba(0,0,0,0.001)',
    stroke: null,
    listening: true,
  });
  hit.metadata.isDiagramHitTarget = true;
  hit.metadata.hitTargetFor = node.metadata?.diagramId;
  node.add(hit);
  node.draggable = true;
  node.listening = true;
  node.metadata.hitTargetAttached = true;
  node.metadata.editorBaseScaleX = node.scaleX;
  node.metadata.editorBaseScaleY = node.scaleY;
  node.metadata.editorBaseW = w;
  node.metadata.editorBaseH = h;
}

export function ensureEditableHitTargets(app: App, root: Group): void {
  const walk = (parent: Group): void => {
    for (const child of parent.children) {
      if (isEditableDiagramNode(child)) {
        attachNodeHitTarget(app, child as Group);
      }
      if ('children' in child && (child as Group).children?.length) {
        walk(child as Group);
      }
    }
  };
  walk(root);
}

export function tagEdgeLayer(root: Group): void {
  const walk = (parent: Group): void => {
    for (const child of parent.children) {
      if (child.zIndex === -10 && child.type === 'group') {
        child.metadata.diagramEdgeLayer = true;
      }
    }
  };
  walk(root);
}
