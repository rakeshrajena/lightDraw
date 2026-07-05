import type { App } from '../App';
import type { Node } from '../Node';
import type { Group } from '../shapes/Group';
import type { EventType, LightDrawEvent, SceneJSON } from '../types';

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export type ComponentState = Record<string, unknown>;

export function getState(node: Node): ComponentState {
  const state = node.metadata?.componentState;
  if (state && typeof state === 'object') return state as ComponentState;
  return {};
}

export function setState(node: Node, patch: ComponentState): void {
  node.metadata.componentState = { ...getState(node), ...patch };
}

/** Minimal synthetic event for component state changes (Phase 6). */
export function syntheticEvent(
  type: EventType,
  target: unknown,
  extra: Partial<LightDrawEvent> = {}
): LightDrawEvent {
  const noop = () => undefined;
  return {
    type,
    target,
    originalEvent: new Event(type),
    x: 0,
    y: 0,
    worldX: 0,
    worldY: 0,
    preventDefault: noop,
    stopPropagation: noop,
    ...extra,
  };
}

export function emitChange(node: Node, value: unknown, field = 'value'): void {
  setState(node, { [field]: value });
  node.emit('change', syntheticEvent('change', node, { value, field }));
  node.getApp()?.requestRender();
}

export function componentToJSON(node: Node): SceneJSON {
  const componentType = node.metadata?.componentType as string | undefined;
  if (!componentType) return node.toJSON();

  const state = getState(node);
  const json: SceneJSON = {
    type: componentType,
    id: node.id,
    props: {
      x: node.x,
      y: node.y,
      rotation: node.rotation,
      scaleX: node.scaleX,
      scaleY: node.scaleY,
      opacity: node.opacity,
      visible: node.visible,
      name: node.name || undefined,
      ...state,
    },
  };

  if ('children' in node && (node as Group).children.length > 0) {
    const compound = ['tabs', 'accordion', 'menu', 'toolbar', 'table', 'tree', 'dialog', 'statusBar'];
    if (compound.includes(componentType)) {
      json.children = (node as Group).children.map((child) => componentToJSON(child));
    }
  }

  return json;
}

export function bindApp(node: Node, app: App): void {
  (node as Node & { _app?: App })._app = app;
  if ('children' in node) {
    for (const child of (node as Group).children) {
      bindApp(child, app);
    }
  }
}

export function num(props: Record<string, unknown>, key: string, fallback: number): number {
  const v = props[key];
  return typeof v === 'number' ? v : fallback;
}

export function str(props: Record<string, unknown>, key: string, fallback = ''): string {
  const v = props[key];
  return typeof v === 'string' ? v : fallback;
}

export function bool(props: Record<string, unknown>, key: string, fallback = false): boolean {
  const v = props[key];
  return typeof v === 'boolean' ? v : fallback;
}

export function getParts(node: Node): Record<string, Node> {
  const parts = node.metadata?._parts;
  return parts && typeof parts === 'object' ? (parts as Record<string, Node>) : {};
}

export function setParts(node: Node, parts: Record<string, Node>): void {
  node.metadata._parts = parts;
}
