/**
 * Vitest global setup — canvas 2D mock for jsdom so CanvasRenderer tests run in Node.
 */

type MockCtxState = {
  fillStyle: string | CanvasGradient | CanvasPattern;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  lineCap: CanvasLineCap;
  lineJoin: CanvasLineJoin;
  globalAlpha: number;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  font: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  transform: number[];
};

function createMockContext2D(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const state: MockCtxState = {
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    globalAlpha: 1,
    shadowColor: 'transparent',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    transform: [1, 0, 0, 1, 0, 0],
  };

  const noop = () => undefined;

  const ctx = {
    canvas,
    get fillStyle() {
      return state.fillStyle;
    },
    set fillStyle(v: string | CanvasGradient | CanvasPattern) {
      state.fillStyle = v;
    },
    get strokeStyle() {
      return state.strokeStyle;
    },
    set strokeStyle(v: string | CanvasGradient | CanvasPattern) {
      state.strokeStyle = v;
    },
    get lineWidth() {
      return state.lineWidth;
    },
    set lineWidth(v: number) {
      state.lineWidth = v;
    },
    get lineCap() {
      return state.lineCap;
    },
    set lineCap(v: CanvasLineCap) {
      state.lineCap = v;
    },
    get lineJoin() {
      return state.lineJoin;
    },
    set lineJoin(v: CanvasLineJoin) {
      state.lineJoin = v;
    },
    get globalAlpha() {
      return state.globalAlpha;
    },
    set globalAlpha(v: number) {
      state.globalAlpha = v;
    },
    get shadowColor() {
      return state.shadowColor;
    },
    set shadowColor(v: string) {
      state.shadowColor = v;
    },
    get shadowBlur() {
      return state.shadowBlur;
    },
    set shadowBlur(v: number) {
      state.shadowBlur = v;
    },
    get shadowOffsetX() {
      return state.shadowOffsetX;
    },
    set shadowOffsetX(v: number) {
      state.shadowOffsetX = v;
    },
    get shadowOffsetY() {
      return state.shadowOffsetY;
    },
    set shadowOffsetY(v: number) {
      state.shadowOffsetY = v;
    },
    get font() {
      return state.font;
    },
    set font(v: string) {
      state.font = v;
    },
    get textAlign() {
      return state.textAlign;
    },
    set textAlign(v: CanvasTextAlign) {
      state.textAlign = v;
    },
    get textBaseline() {
      return state.textBaseline;
    },
    set textBaseline(v: CanvasTextBaseline) {
      state.textBaseline = v;
    },

    save: noop,
    restore: noop,
    beginPath: noop,
    closePath: noop,
    moveTo: noop,
    lineTo: noop,
    rect: noop,
    arc: noop,
    ellipse: noop,
    quadraticCurveTo: noop,
    fill: noop,
    stroke: noop,
    clip: noop,
    clearRect: noop,
    fillRect: noop,
    drawImage: noop,
    fillText: noop,
    strokeText: noop,
    setLineDash: noop,
    setTransform: noop,
    transform: noop,
    translate: noop,
    rotate: noop,
    scale: noop,

    createLinearGradient: () =>
      ({
        addColorStop: noop,
      }) as CanvasGradient,

    createRadialGradient: () =>
      ({
        addColorStop: noop,
      }) as CanvasGradient,

    measureText: (text: string) => ({ width: text.length * 8 }) as TextMetrics,
  };

  return ctx as unknown as CanvasRenderingContext2D;
}

/** Install canvas mock on the jsdom window (idempotent). */
export function installCanvasMock(): void {
  if (typeof HTMLCanvasElement === 'undefined') return;

  const proto = HTMLCanvasElement.prototype as HTMLCanvasElement & {
    __lightdrawMockCtx?: CanvasRenderingContext2D;
  };

  if (proto.__lightdrawMockCtx) return;

  const originalGetContext = proto.getContext;

  proto.getContext = function getContext(
    this: HTMLCanvasElement,
    type: string,
    _options?: unknown
  ): RenderingContext | null {
    if (type === '2d') {
      if (!this.__lightdrawMockCtx) {
        this.__lightdrawMockCtx = createMockContext2D(this);
      }
      return this.__lightdrawMockCtx;
    }
    return originalGetContext ? originalGetContext.call(this, type) : null;
  } as typeof proto.getContext;

  proto.toDataURL = function toDataURL() {
    return 'data:image/png;base64,mock';
  };

  proto.__lightdrawMockCtx = undefined;
}

installCanvasMock();

import './bootstrap';

/** Optional global gc when Node is started with --expose-gc */
export function forceGc(): void {
  const g = globalThis as typeof globalThis & { gc?: () => void };
  g.gc?.();
}

/** Current heap usage in bytes (Node.js). */
export function heapUsed(): number {
  return process.memoryUsage().heapUsed;
}

/** Default tolerance for memory regression (5%). */
export const MEMORY_TOLERANCE = 0.05;

/** Default tolerance for perf regression vs baseline (25% in CI). */
export const PERF_REGRESSION_TOLERANCE = 0.25;
