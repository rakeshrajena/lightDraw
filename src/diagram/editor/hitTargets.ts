import type { App } from '../../App';
import type { Group } from '../../shapes/Group';
import { isEditableDiagramNode } from './collect';

/** Add a transparent hit area so diagram nodes receive pointer events. */
export function attachNodeHitTarget(app: App, node: Group): void {
  if (node.metadata?.hitTargetAttached) return;
  const b = node.getBounds();
  const w = Math.max(b.width, 24);
  const h = Math.max(b.height, 24);
  const hit = app.rect({
    x: b.x,
    y: b.y,
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
