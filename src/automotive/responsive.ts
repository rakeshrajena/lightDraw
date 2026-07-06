import type { Node } from '../Node';
import { num } from './helpers';

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

export interface AutoWidgetResizeOptions {
  minWidth?: number;
  minHeight?: number;
  padding?: number;
  onResize: (width: number, height: number) => void;
}

/** Notify when an automotive widget container changes size (gallery / dashboards). */
export function installAutoWidgetResizeObserver(
  widgetNode: Node,
  container: HTMLElement,
  options: AutoWidgetResizeOptions
): void {
  detachAutoWidgetResizeObserver(widgetNode);

  const minW = options.minWidth ?? 72;
  const minH = options.minHeight ?? 56;
  const pad = options.padding ?? 0;

  let raf = 0;
  const ro = createResizeObserver((entries) => {
    const rect = entries[0]?.contentRect;
    if (!rect) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const w = Math.max(minW, Math.floor(rect.width - pad));
      const h = Math.max(minH, Math.floor(rect.height - pad));
      const last = widgetNode.metadata._lastAutoContainerSize as { w: number; h: number } | undefined;
      if (last && last.w === w && last.h === h) return;
      widgetNode.metadata._lastAutoContainerSize = { w, h };
      options.onResize(w, h);
    });
  });

  ro.observe(container);
  observers.set(widgetNode, ro);

  const w = Math.max(minW, Math.floor(container.clientWidth - pad));
  const h = Math.max(minH, Math.floor(container.clientHeight - pad));
  widgetNode.metadata._lastAutoContainerSize = { w, h };
  options.onResize(w, h);
}

export function detachAutoWidgetResizeObserver(widgetNode: Node): void {
  const ro = observers.get(widgetNode);
  ro?.disconnect();
  observers.delete(widgetNode);
  delete widgetNode.metadata._lastAutoContainerSize;
}

/** Patch width/height/size on an automotive group from container dimensions. */
export function fitAutoWidgetToContainer(
  widgetNode: Node,
  containerW: number,
  containerH: number,
  pad = 8
): { width: number; height: number; size: number } {
  const w = Math.max(56, Math.floor(containerW));
  const h = Math.max(44, Math.floor(containerH));
  const size = Math.max(52, Math.min(w - pad * 2, h - pad * 2));
  const state = widgetNode.metadata?.autoState as Record<string, unknown> | undefined;
  if (num(state ?? {}, 'size', 0) > 0 || 'size' in (state ?? {})) {
    return { width: w, height: h, size };
  }
  return { width: w, height: h, size };
}
