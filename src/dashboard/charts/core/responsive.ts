import type { Node } from '../../../Node';
import type { App } from '../../../App';
import { getState, num } from '../../helpers';
import { updateChartProps } from './refresh';

function isChartAppRoot(chartNode: Node): boolean {
  const app = chartNode.getApp() as App | null;
  if (!app) return false;
  return app.stage.children.length === 1 && app.stage.children[0] === chartNode;
}

/** Keep the LightDraw app viewport aligned with chart container bounds (gallery / maximize). */
function syncAppViewport(chartNode: Node, width: number, height: number): void {
  const app = chartNode.getApp() as App | null;
  if (!app || !isChartAppRoot(chartNode)) return;
  const size = app.getSize();
  if (size.width !== width || size.height !== height) {
    app.resize(width, height);
  }
}

export interface ChartResizeOptions {
  minWidth?: number;
  minHeight?: number;
  padding?: number;
  /** When false, only width is synced (default true). */
  watchHeight?: boolean;
  /** Sync `size` for pie/radar widgets (default true). */
  syncSize?: boolean;
}

const observers = new WeakMap<Node, ResizeObserver>();

function createResizeObserver(callback: ResizeObserverCallback): ResizeObserver {
  if (typeof ResizeObserver !== 'undefined') {
    return new ResizeObserver(callback);
  }
  return {
    observe() {},
    unobserve() {},
    disconnect() {},
  } as ResizeObserver;
}

/** Keep chart props in sync when a container element is resized. */
export function installChartResizeObserver(
  chartNode: Node,
  container: HTMLElement,
  options: ChartResizeOptions = {}
): void {
  detachChartResizeObserver(chartNode);

  const minW = options.minWidth ?? 64;
  const minH = options.minHeight ?? 48;
  const pad = options.padding ?? 0;
  const watchHeight = options.watchHeight !== false;
  const syncSize = options.syncSize !== false;

  let raf = 0;
  const ro = createResizeObserver((entries) => {
    const rect = entries[0]?.contentRect;
    if (!rect) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      applyChartContainerSize(chartNode, rect.width, rect.height, {
        minW,
        minH,
        pad,
        watchHeight,
        syncSize,
      });
    });
  });

  ro.observe(container);
  observers.set(chartNode, ro);
  chartNode.metadata.resizeObserverAttached = true;

  applyChartContainerSize(chartNode, container.clientWidth, container.clientHeight, {
    minW,
    minH,
    pad,
    watchHeight,
    syncSize,
  });
}

export function detachChartResizeObserver(chartNode: Node): void {
  const ro = observers.get(chartNode);
  ro?.disconnect();
  observers.delete(chartNode);
  delete chartNode.metadata.resizeObserverAttached;
}

function applyChartContainerSize(
  chartNode: Node,
  rawW: number,
  rawH: number,
  opts: { minW: number; minH: number; pad: number; watchHeight: boolean; syncSize: boolean }
): void {
  const w = Math.max(opts.minW, Math.floor(rawW - opts.pad));
  const h = Math.max(opts.minH, Math.floor(rawH - opts.pad));
  const last = chartNode.metadata._lastContainerSize as { w: number; h: number } | undefined;
  if (last && last.w === w && last.h === h) {
    syncAppViewport(chartNode, w, h);
    return;
  }

  syncAppViewport(chartNode, w, h);

  const state = getState(chartNode);
  const patch: Record<string, unknown> = {};

  const hasWidth = num(state, 'width', 0) > 0 || 'width' in state;
  const hasHeight = num(state, 'height', 0) > 0 || 'height' in state;
  const hasSize = num(state, 'size', 0) > 0;

  if (hasWidth && w > 0 && w !== num(state, 'width', 0)) patch.width = w;
  if (opts.watchHeight && hasHeight && h > 0 && h !== num(state, 'height', 0)) patch.height = h;

  if (opts.syncSize && hasSize && !hasWidth) {
    const sz = opts.watchHeight ? Math.min(w, h) : w;
    if (sz > 0 && sz !== num(state, 'size', 0)) patch.size = sz;
  } else if (opts.syncSize && hasSize && hasWidth && opts.watchHeight) {
    const sz = Math.min(w, h);
    if (sz > 0 && sz !== num(state, 'size', 0)) patch.size = sz;
  }

  if (Object.keys(patch).length > 0) {
    chartNode.metadata._lastContainerSize = { w, h };
    updateChartProps(chartNode, patch);
  } else {
    chartNode.metadata._lastContainerSize = { w, h };
  }
}
