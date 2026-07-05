/** Utility functions with legacy browser fallbacks */

import { hasRenderer } from '../registry/renderers';

export function now(): number {
  return typeof performance !== 'undefined' && performance.now
    ? performance.now()
    : Date.now();
}

export function requestFrame(callback: FrameRequestCallback): number {
  if (typeof requestAnimationFrame !== 'undefined') {
    return requestAnimationFrame(callback);
  }
  return setTimeout(() => callback(now()), 16) as unknown as number;
}

export function cancelFrame(id: number): void {
  if (typeof cancelAnimationFrame !== 'undefined') {
    cancelAnimationFrame(id);
  } else {
    clearTimeout(id);
  }
}

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function uid(prefix = 'ld'): string {
  return prefix + '_' + Math.random().toString(36).slice(2, 11);
}

export function parseColor(color: string): { r: number; g: number; b: number; a: number } {
  if (!color || color === 'transparent') {
    return { r: 0, g: 0, b: 0, a: 0 };
  }
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const full =
      hex.length === 3
        ? hex
            .split('')
            .map((c) => c + c)
            .join('')
        : hex;
    const n = parseInt(full, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
  }
  const match = color.match(/rgba?\(([^)]+)\)/);
  if (match) {
    const parts = match[1].split(',').map((s) => parseFloat(s.trim()));
    return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 };
  }
  return { r: 0, g: 0, b: 0, a: 1 };
}

export function interpolateColor(from: string, to: string, t: number): string {
  const a = parseColor(from);
  const b = parseColor(to);
  const r = Math.round(lerp(a.r, b.r, t));
  const g = Math.round(lerp(a.g, b.g, t));
  const bl = Math.round(lerp(a.b, b.b, t));
  const alpha = lerp(a.a, b.a, t);
  return alpha < 1 ? `rgba(${r},${g},${bl},${alpha})` : `rgb(${r},${g},${bl})`;
}

export function resolveContainer(container: string | HTMLElement): HTMLElement {
  if (typeof container === 'string') {
    const el = document.querySelector(container);
    if (!el) throw new Error(`LightDraw: container "${container}" not found`);
    return el as HTMLElement;
  }
  return container;
}

export function getPixelRatio(): number {
  return typeof window !== 'undefined' && window.devicePixelRatio
    ? window.devicePixelRatio
    : 1;
}

export function merge<T extends Record<string, unknown>>(target: T, ...sources: Partial<T>[]): T {
  for (const source of sources) {
    if (!source) continue;
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        (target as Record<string, unknown>)[key] = source[key];
      }
    }
  }
  return target;
}

export function shallowEqual(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

/** Object pool for reducing GC pressure */
export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;

  constructor(factory: () => T, reset: (obj: T) => void, initialSize = 16) {
    this.factory = factory;
    this.reset = reset;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  acquire(): T {
    return this.pool.pop() ?? this.factory();
  }

  release(obj: T): void {
    this.reset(obj);
    this.pool.push(obj);
  }
}

/** 2D matrix for transforms */
export class Matrix2D {
  a = 1;
  b = 0;
  c = 0;
  d = 1;
  e = 0;
  f = 0;

  identity(): this {
    this.a = 1;
    this.b = 0;
    this.c = 0;
    this.d = 1;
    this.e = 0;
    this.f = 0;
    return this;
  }

  translate(x: number, y: number): this {
    this.e += this.a * x + this.c * y;
    this.f += this.b * x + this.d * y;
    return this;
  }

  scale(sx: number, sy: number): this {
    this.a *= sx;
    this.b *= sx;
    this.c *= sy;
    this.d *= sy;
    return this;
  }

  rotate(angleRad: number): this {
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const { a, b, c, d } = this;
    this.a = a * cos + c * sin;
    this.b = b * cos + d * sin;
    this.c = c * cos - a * sin;
    this.d = d * cos - b * sin;
    return this;
  }

  skew(skewX: number, skewY: number): this {
    const tanX = Math.tan(skewX);
    const tanY = Math.tan(skewY);
    const { a, b, c, d } = this;
    this.a = a + c * tanY;
    this.b = b + d * tanY;
    this.c = c + a * tanX;
    this.d = d + b * tanX;
    return this;
  }

  multiply(other: Matrix2D): this {
    const { a, b, c, d, e, f } = this;
    this.a = a * other.a + c * other.b;
    this.b = b * other.a + d * other.b;
    this.c = a * other.c + c * other.d;
    this.d = b * other.c + d * other.d;
    this.e = a * other.e + c * other.f + e;
    this.f = b * other.e + d * other.f + f;
    return this;
  }

  transformPoint(x: number, y: number): { x: number; y: number } {
    return {
      x: this.a * x + this.c * y + this.e,
      y: this.b * x + this.d * y + this.f,
    };
  }

  invert(): Matrix2D | null {
    const inv = new Matrix2D();
    return this.invertInto(inv);
  }

  /** Invert into an existing matrix (avoids allocation when paired with pool). */
  invertInto(out: Matrix2D): Matrix2D | null {
    const det = this.a * this.d - this.b * this.c;
    if (Math.abs(det) < 1e-10) return null;
    out.a = this.d / det;
    out.b = -this.b / det;
    out.c = -this.c / det;
    out.d = this.a / det;
    out.e = (this.c * this.f - this.d * this.e) / det;
    out.f = (this.b * this.e - this.a * this.f) / det;
    return out;
  }

  copyFrom(other: Matrix2D): this {
    this.a = other.a;
    this.b = other.b;
    this.c = other.c;
    this.d = other.d;
    this.e = other.e;
    this.f = other.f;
    return this;
  }

  toCSS(): string {
    return `matrix(${this.a},${this.b},${this.c},${this.d},${this.e},${this.f})`;
  }
}

/** Shared matrix pool for hit testing hot paths */
export const matrixPool = new ObjectPool(
  () => new Matrix2D(),
  (m) => m.identity()
);

export function detectBestRenderer(): 'canvas' | 'svg' | 'html' {
  if (typeof document === 'undefined') return 'canvas';
  try {
    const canvas = document.createElement('canvas');
    if (canvas.getContext && canvas.getContext('2d') && hasRenderer('canvas')) return 'canvas';
  } catch {
    /* jsdom and some embedded environments lack canvas */
  }
  if (typeof SVGSVGElement !== 'undefined' && hasRenderer('svg')) return 'svg';
  if (hasRenderer('html')) return 'html';
  return 'canvas';
}
