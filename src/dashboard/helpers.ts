import type { App } from '../App';
import type { Node } from '../Node';
import type { Group } from '../shapes/Group';

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
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

export function getState(node: Node): Record<string, unknown> {
  const state = node.metadata?.widgetState;
  if (state && typeof state === 'object') return state as Record<string, unknown>;
  return {};
}

export function setState(node: Node, patch: Record<string, unknown>): void {
  node.metadata.widgetState = { ...getState(node), ...patch };
}

export function bindApp(node: Node, app: App): void {
  (node as Node & { _app?: App })._app = app;
  if ('children' in node) {
    for (const child of (node as Group).children) {
      bindApp(child, app);
    }
  }
}

export function createWidgetGroup(
  app: App,
  type: string,
  props: Record<string, unknown>,
  extra: Record<string, unknown> = {}
): Group {
  const group = app.group({
    ...(props as Record<string, unknown>),
    listening: true,
    metadata: {
      widgetType: type,
      widgetState: { ...props },
    },
    ...extra,
  }) as Group;
  bindApp(group, app);
  setState(group, { ...props });
  return group;
}

export type RefreshFn = (value: number) => void;

export function setRefresh(node: Node, fn: RefreshFn): void {
  node.metadata.refresh = fn;
}

/** Animate a numeric widget value with optional refresh callback. */
export function animateLiveValue(
  node: Node,
  key: string,
  toValue: number,
  duration = 400
): void {
  const app = node.getApp();
  if (!app) return;
  const from = num(getState(node), key, 0);
  const refresh = node.metadata.refresh as RefreshFn | undefined;

  app.animate(node, {
    duration,
    easing: 'easeOutCubic',
    onUpdate: (progress: number) => {
      const v = from + (toValue - from) * progress;
      setState(node, { [key]: v });
      refresh?.(v);
      app.requestRender();
    },
    onComplete: () => {
      setState(node, { [key]: toValue });
      refresh?.(toValue);
      app.requestRender();
    },
  });
}

export function setLiveValue(node: Node, key: string, value: number): void {
  setState(node, { [key]: value });
  const refresh = node.metadata.refresh as RefreshFn | undefined;
  refresh?.(value);
  node.getApp()?.requestRender();
}

export function dashboardToJSON(node: Node): import('../types').SceneJSON {
  const widgetType = node.metadata?.widgetType as string | undefined;
  if (!widgetType) return node.toJSON();
  return {
    type: widgetType,
    id: node.id,
    props: {
      x: node.x,
      y: node.y,
      ...getState(node),
    },
  };
}

export function getParts(node: Node): Record<string, Node> {
  const parts = node.metadata?._parts;
  return parts && typeof parts === 'object' ? (parts as Record<string, Node>) : {};
}

export function setParts(node: Node, parts: Record<string, Node>): void {
  node.metadata._parts = parts;
}
