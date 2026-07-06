import type { App } from '../App';
import type { Group } from '../shapes/Group';
import type { Node } from '../Node';
import { registry } from './registryCore';
import { getState, num, setState } from './helpers';
import { resolveBounds } from './layout';

function isAutoGroup(node: Node): node is Group {
  return 'children' in node && typeof node.metadata?.autoType === 'string';
}

function syncAutoAppViewport(node: Node, width: number, height: number): void {
  const app = node.getApp() as App | null;
  if (!app || app.stage.children.length !== 1 || app.stage.children[0] !== node) return;
  const size = app.getSize();
  if (size.width !== width || size.height !== height) {
    app.resize(width, height);
  }
}

/** Attach rebuild hook so widget visuals can be regenerated from autoState. */
export function installAutoWidgetRebuild(group: Group, app: App, autoType?: string): void {
  const type = autoType ?? (group.metadata?.autoType as string | undefined);
  if (!type) return;

  const rebuild = () => {
    const factory = registry[type];
    if (!factory) return;

    const props = { ...getState(group), x: group.x, y: group.y };
    const fresh = factory(props, app);
    if (!fresh || !isAutoGroup(fresh)) return;

    for (const child of [...group.children]) {
      group.remove(child);
    }
    for (const child of [...fresh.children]) {
      fresh.remove(child);
      group.add(child);
    }

    group.metadata._parts = fresh.metadata._parts;
    group.metadata.refresh = fresh.metadata.refresh;
    group.metadata.boolRefresh = fresh.metadata.boolRefresh;
    group.metadata.textRefresh = fresh.metadata.textRefresh;
    group.metadata.linesRefresh = fresh.metadata.linesRefresh;
    group.metadata._digitalParts = fresh.metadata._digitalParts;
    group.metadata.autoState = fresh.metadata.autoState;

    const w = num(props, 'width', 0);
    const h = num(props, 'height', 0);
    if (w > 0) {
      group.metadata.chartWidth = w;
      group.metadata.autoWidth = w;
    }
    if (h > 0) {
      group.metadata.chartHeight = h;
      group.metadata.autoHeight = h;
    }

    group.metadata.autoRebuild = rebuild;
    app.requestRender();
  };

  group.metadata.autoRebuild = rebuild;
}

/** Patch widget state and rebuild layers (resize, theme, value updates). */
export function updateAutoWidgetProps(group: Node, patch: Record<string, unknown>): void {
  if (!isAutoGroup(group)) return;

  const prev = getState(group);
  const sizeKeys = ['width', 'height', 'size'] as const;
  const onlySize = Object.keys(patch).every((k) => sizeKeys.includes(k as (typeof sizeKeys)[number]));
  if (onlySize) {
    const same =
      (!('width' in patch) || num(patch, 'width', -1) === num(prev, 'width', -2)) &&
      (!('height' in patch) || num(patch, 'height', -1) === num(prev, 'height', -2)) &&
      (!('size' in patch) || num(patch, 'size', -1) === num(prev, 'size', -2));
    if (same) return;
  }

  setState(group, patch);

  const state = getState(group);
  if (('width' in patch || 'height' in patch) && (num(state, 'size', 0) > 0 || 'size' in state)) {
    const bounds = resolveBounds(state, num(state, 'width', 160), num(state, 'height', 120));
    if (bounds.dialSize !== num(state, 'size', 0)) {
      setState(group, { size: bounds.dialSize });
    }
  }

  const w = num(patch, 'width', num(state, 'width', 0));
  const h = num(patch, 'height', num(state, 'height', 0));
  if (w > 0) {
    group.metadata.chartWidth = w;
    group.metadata.autoWidth = w;
  }
  if (h > 0) {
    group.metadata.chartHeight = h;
    group.metadata.autoHeight = h;
  }

  const rebuild = group.metadata.autoRebuild as (() => void) | undefined;
  rebuild?.();

  if (w > 0 && h > 0) {
    syncAutoAppViewport(group, w, h);
  }
}
