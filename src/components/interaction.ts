import type { Group } from '../shapes/Group';
import type { Node } from '../Node';
import type { LightDrawEvent } from '../types';
import { emitChange, getState, setState, syntheticEvent } from './helpers';

type DragHandler = (worldX: number, worldY: number, event: LightDrawEvent) => void;

/** Attach document-level pointer tracking for slider-style drag. */
export function wirePointerDrag(
  node: Node,
  onDrag: DragHandler,
  onEnd?: () => void
): void {
  node.on('mousedown', (event: LightDrawEvent) => {
    const app = node.getApp();
    if (!app) return;
    const el = app['renderer'].getElement() as HTMLElement;

    const move = (e: Event) => {
      const rect = el.getBoundingClientRect();
      const me = e as MouseEvent;
      const x = me.clientX - rect.left;
      const y = me.clientY - rect.top;
      const world = app.camera.screenToWorld(x, y);
      onDrag(world.x, world.y, event);
    };

    const up = () => {
      el.removeEventListener('mousemove', move);
      el.removeEventListener('mouseup', up);
      el.removeEventListener('mouseleave', up);
      onEnd?.();
    };

    el.addEventListener('mousemove', move);
    el.addEventListener('mouseup', up);
    el.addEventListener('mouseleave', up);
    onDrag(
      event.worldX,
      event.worldY,
      event
    );
  });
}

export function wireToggle(
  node: Node,
  field: string,
  updateVisual: (value: boolean) => void
): void {
  const toggle = () => {
    const current = Boolean(getState(node)[field]);
    const next = !current;
    setState(node, { [field]: next });
    if (field === 'checked' || field === 'value') {
      node.ariaChecked = next;
    }
    updateVisual(next);
    emitChange(node, next, field);
  };

  node.on('click', toggle);
}

export function wireButtonStates(
  node: Node,
  updateVisual: (state: { hover: boolean; active: boolean; disabled: boolean }) => void
): void {
  const refresh = (hover: boolean, active: boolean) => {
    const disabled = Boolean(getState(node).disabled);
    updateVisual({ hover, active, disabled });
  };

  node.on('mouseenter', () => refresh(true, false));
  node.on('mouseleave', () => refresh(false, false));
  node.on('mousedown', () => refresh(true, true));
  node.on('mouseup', () => refresh(true, false));
  node.on('click', (e: LightDrawEvent) => {
    if (getState(node).disabled) {
      e.stopPropagation();
    }
  });

  refresh(false, false);
}

export function wireSelectFromList(
  node: Node,
  items: string[],
  field: string,
  updateVisual: (index: number) => void
): void {
  node.on('click', (event: LightDrawEvent) => {
    const bounds = node.getBounds();
    const localY = event.worldY - node.y;
    const rowHeight = bounds.height / Math.max(items.length, 1);
    const index = Math.floor(localY / rowHeight);
    if (index >= 0 && index < items.length) {
      setState(node, { [field]: index, selectedIndex: index, selectedItem: items[index] });
      updateVisual(index);
      emitChange(node, items[index], field);
      node.emit('select', syntheticEvent('select', node, { index, item: items[index] }));
    }
  });
}

export function scheduleAutoDismiss(node: Node, ms: number, onDismiss: () => void): void {
  const id = window.setTimeout(() => {
    onDismiss();
    node.emit('close', syntheticEvent('close', node));
    node.getApp()?.requestRender();
  }, ms);
  node.metadata._dismissTimer = id;
}

export function clearAutoDismiss(node: Node): void {
  const id = node.metadata._dismissTimer as number | undefined;
  if (id !== undefined) {
    clearTimeout(id);
    delete node.metadata._dismissTimer;
  }
}

export function trapFocusIn(group: Group): void {
  const focusables = group.children.filter((c) => c.focusable);
  if (focusables.length === 0) return;
  const app = group.getApp();
  app?.focusNode(focusables[0]);
}
