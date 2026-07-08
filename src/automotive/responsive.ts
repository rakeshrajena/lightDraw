import type { Node } from '../Node';
import { getState, num } from './helpers';
import { resolveBounds } from './layout';
import { updateAutoWidgetProps } from './refresh';

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

const observers = new WeakMap<Node, ResizeObserver>();

function readContainerSize(container: HTMLElement): { w: number; h: number } {
  let w = container.clientWidth;
  let h = container.clientHeight;
  if (w <= 0 || h <= 0) {
    const rect = container.getBoundingClientRect();
    if (w <= 0) w = rect.width;
    if (h <= 0) h = rect.height;
  }
  if (w <= 0 || h <= 0) {
    const sw = parseFloat(container.style.width);
    const sh = parseFloat(container.style.height);
    if (w <= 0 && Number.isFinite(sw) && sw > 0) w = sw;
    if (h <= 0 && Number.isFinite(sh) && sh > 0) h = sh;
  }
  return { w, h };
}

export interface AutoWidgetResizeOptions {
  minWidth?: number;
  minHeight?: number;
  padding?: number;
  /** Optional hook after library relayout. */
  onResize?: (width: number, height: number) => void;
}

/** Compute width/height/size patch from a container element. */
export function fitAutoWidgetToContainer(
  widgetNode: Node,
  containerW: number,
  containerH: number,
  pad = 8
): Record<string, number> {
  const state = getState(widgetNode);
  const merged = { ...state };
  if (containerW > 0) merged.width = Math.max(56, Math.floor(containerW));
  if (containerH > 0) merged.height = Math.max(44, Math.floor(containerH));

  const bounds = resolveBounds(
    merged,
    num(state, 'width', 160),
    num(state, 'height', 120),
    pad
  );

  const patch: Record<string, number> = {};
  if (bounds.width !== num(state, 'width', 0)) patch.width = bounds.width;
  if (bounds.height !== num(state, 'height', 0)) patch.height = bounds.height;

  const hadSize = num(state, 'size', 0) > 0 || 'size' in state;
  if (hadSize && bounds.dialSize !== num(state, 'size', 0)) {
    patch.size = bounds.dialSize;
  }

  if (Object.keys(patch).length === 0) {
    return {};
  }

  return patch;
}

/** Keep automotive widget props in sync when a container element is resized. */
export function installAutoWidgetResizeObserver(
  widgetNode: Node,
  container: HTMLElement,
  options: AutoWidgetResizeOptions = {}
): void {
  detachAutoWidgetResizeObserver(widgetNode);

  const minW = options.minWidth ?? 72;
  const minH = options.minHeight ?? 56;
  const pad = options.padding ?? 0;

  const apply = (rawW: number, rawH: number) => {
    const state = getState(widgetNode);
    const w = rawW > 0
      ? Math.max(minW, Math.floor(rawW - pad))
      : num(state, 'width', 0);
    const h = rawH > 0
      ? Math.max(minH, Math.floor(rawH - pad))
      : num(state, 'height', 0);
    if (w < 8 || h < 8) return;

    const last = widgetNode.metadata._lastAutoContainerSize as { w: number; h: number } | undefined;
    if (last && last.w === w && last.h === h) return;

    widgetNode.metadata._lastAutoContainerSize = { w, h };
    const patch = fitAutoWidgetToContainer(widgetNode, w, h, pad);
    if (Object.keys(patch).length === 0) return;
    updateAutoWidgetProps(widgetNode, patch);
    options.onResize?.(w, h);
  };

  let raf = 0;
  const ro = createResizeObserver((entries) => {
    const rect = entries[0]?.contentRect;
    if (!rect) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => apply(rect.width, rect.height));
  });

  ro.observe(container);
  observers.set(widgetNode, ro);
  widgetNode.metadata.resizeObserverAttached = true;

  const initial = readContainerSize(container);
  apply(initial.w, initial.h);
}

export function detachAutoWidgetResizeObserver(widgetNode: Node): void {
  const ro = observers.get(widgetNode);
  ro?.disconnect();
  observers.delete(widgetNode);
  delete widgetNode.metadata._lastAutoContainerSize;
  delete widgetNode.metadata.resizeObserverAttached;
}
