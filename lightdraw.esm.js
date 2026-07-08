/*! LightDraw.js v0.6.0 | MIT License | https://github.com/lightdraw/lightdraw.js */

// src/core/EventEmitter.ts
var EventEmitter = class {
  constructor() {
    this.listeners = /* @__PURE__ */ new Map();
  }
  on(type, handler) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, /* @__PURE__ */ new Set());
    }
    this.listeners.get(type).add(handler);
    return this;
  }
  off(type, handler) {
    if (!handler) {
      this.listeners.delete(type);
    } else {
      this.listeners.get(type)?.delete(handler);
    }
    return this;
  }
  once(type, handler) {
    const wrapper = (e) => {
      this.off(type, wrapper);
      handler(e);
    };
    return this.on(type, wrapper);
  }
  emit(type, event) {
    const handlers = this.listeners.get(type);
    if (!handlers || handlers.size === 0)
      return false;
    for (const handler of handlers) {
      handler(event);
    }
    return true;
  }
  hasListeners(type) {
    if (type)
      return (this.listeners.get(type)?.size ?? 0) > 0;
    for (const set of this.listeners.values()) {
      if (set.size > 0)
        return true;
    }
    return false;
  }
  removeAllListeners() {
    this.listeners.clear();
  }
};
function createEvent(type, target, originalEvent, x, y, worldX, worldY, payload) {
  const state = { stopped: false };
  const event = {
    type,
    target,
    currentTarget: target,
    originalEvent,
    x,
    y,
    worldX,
    worldY,
    payload,
    preventDefault() {
      originalEvent.preventDefault?.();
    },
    stopPropagation() {
      state.stopped = true;
    },
    get propagationStopped() {
      return state.stopped;
    }
  };
  return event;
}

// src/registry/renderers.ts
var factories = /* @__PURE__ */ new Map();
function registerRenderer(type, factory) {
  factories.set(type, factory);
}
function createRenderer(type) {
  const factory = factories.get(type);
  return factory ? factory() : null;
}
function hasRenderer(type) {
  return factories.has(type);
}

// src/utils/index.ts
function now() {
  return typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
}
function requestFrame(callback) {
  if (typeof requestAnimationFrame !== "undefined") {
    return requestAnimationFrame(callback);
  }
  return setTimeout(() => callback(now()), 16);
}
function cancelFrame(id) {
  if (typeof cancelAnimationFrame !== "undefined") {
    cancelAnimationFrame(id);
  } else {
    clearTimeout(id);
  }
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function degToRad(deg) {
  return deg * Math.PI / 180;
}
function radToDeg(rad) {
  return rad * 180 / Math.PI;
}
function uid(prefix = "ld") {
  return prefix + "_" + Math.random().toString(36).slice(2, 11);
}
function parseColor(color) {
  if (!color || color === "transparent") {
    return { r: 0, g: 0, b: 0, a: 0 };
  }
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
    const n = parseInt(full, 16);
    return { r: n >> 16 & 255, g: n >> 8 & 255, b: n & 255, a: 1 };
  }
  const match = color.match(/rgba?\(([^)]+)\)/);
  if (match) {
    const parts = match[1].split(",").map((s) => parseFloat(s.trim()));
    return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 };
  }
  return { r: 0, g: 0, b: 0, a: 1 };
}
function interpolateColor(from, to, t) {
  const a = parseColor(from);
  const b = parseColor(to);
  const r = Math.round(lerp(a.r, b.r, t));
  const g = Math.round(lerp(a.g, b.g, t));
  const bl = Math.round(lerp(a.b, b.b, t));
  const alpha = lerp(a.a, b.a, t);
  return alpha < 1 ? `rgba(${r},${g},${bl},${alpha})` : `rgb(${r},${g},${bl})`;
}
function resolveContainer(container) {
  if (typeof container === "string") {
    const el = document.querySelector(container);
    if (!el)
      throw new Error(`LightDraw: container "${container}" not found`);
    return el;
  }
  return container;
}
function getPixelRatio() {
  return typeof window !== "undefined" && window.devicePixelRatio ? window.devicePixelRatio : 1;
}
function merge(target, ...sources) {
  for (const source of sources) {
    if (!source)
      continue;
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }
  return target;
}
var ObjectPool = class {
  constructor(factory, reset, initialSize = 16) {
    this.pool = [];
    this.factory = factory;
    this.reset = reset;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }
  acquire() {
    return this.pool.pop() ?? this.factory();
  }
  release(obj) {
    this.reset(obj);
    this.pool.push(obj);
  }
};
var Matrix2D = class _Matrix2D {
  constructor() {
    this.a = 1;
    this.b = 0;
    this.c = 0;
    this.d = 1;
    this.e = 0;
    this.f = 0;
  }
  identity() {
    this.a = 1;
    this.b = 0;
    this.c = 0;
    this.d = 1;
    this.e = 0;
    this.f = 0;
    return this;
  }
  translate(x, y) {
    this.e += this.a * x + this.c * y;
    this.f += this.b * x + this.d * y;
    return this;
  }
  scale(sx, sy) {
    this.a *= sx;
    this.b *= sx;
    this.c *= sy;
    this.d *= sy;
    return this;
  }
  rotate(angleRad) {
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const { a, b, c, d } = this;
    this.a = a * cos + c * sin;
    this.b = b * cos + d * sin;
    this.c = c * cos - a * sin;
    this.d = d * cos - b * sin;
    return this;
  }
  skew(skewX, skewY) {
    const tanX = Math.tan(skewX);
    const tanY = Math.tan(skewY);
    const { a, b, c, d } = this;
    this.a = a + c * tanY;
    this.b = b + d * tanY;
    this.c = c + a * tanX;
    this.d = d + b * tanX;
    return this;
  }
  multiply(other) {
    const { a, b, c, d, e, f } = this;
    this.a = a * other.a + c * other.b;
    this.b = b * other.a + d * other.b;
    this.c = a * other.c + c * other.d;
    this.d = b * other.c + d * other.d;
    this.e = a * other.e + c * other.f + e;
    this.f = b * other.e + d * other.f + f;
    return this;
  }
  transformPoint(x, y) {
    return {
      x: this.a * x + this.c * y + this.e,
      y: this.b * x + this.d * y + this.f
    };
  }
  invert() {
    const inv = new _Matrix2D();
    return this.invertInto(inv);
  }
  /** Invert into an existing matrix (avoids allocation when paired with pool). */
  invertInto(out) {
    const det = this.a * this.d - this.b * this.c;
    if (Math.abs(det) < 1e-10)
      return null;
    out.a = this.d / det;
    out.b = -this.b / det;
    out.c = -this.c / det;
    out.d = this.a / det;
    out.e = (this.c * this.f - this.d * this.e) / det;
    out.f = (this.b * this.e - this.a * this.f) / det;
    return out;
  }
  copyFrom(other) {
    this.a = other.a;
    this.b = other.b;
    this.c = other.c;
    this.d = other.d;
    this.e = other.e;
    this.f = other.f;
    return this;
  }
  toCSS() {
    return `matrix(${this.a},${this.b},${this.c},${this.d},${this.e},${this.f})`;
  }
};
var matrixPool = new ObjectPool(
  () => new Matrix2D(),
  (m) => m.identity()
);
function detectBestRenderer() {
  if (typeof document === "undefined")
    return "canvas";
  try {
    const canvas = document.createElement("canvas");
    if (canvas.getContext && canvas.getContext("2d") && hasRenderer("canvas"))
      return "canvas";
  } catch {
  }
  if (typeof SVGSVGElement !== "undefined" && hasRenderer("svg"))
    return "svg";
  if (hasRenderer("html"))
    return "html";
  return "canvas";
}

// src/animation/Easing.ts
var easings = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => t * (2 - t),
  easeInOut: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => --t * t * t + 1,
  easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInQuart: (t) => t * t * t * t,
  easeOutQuart: (t) => 1 - --t * t * t * t,
  easeInOutQuart: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t,
  easeInQuint: (t) => t * t * t * t * t,
  easeOutQuint: (t) => 1 + --t * t * t * t * t,
  easeInOutQuint: (t) => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t,
  easeInExpo: (t) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
  easeOutExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutExpo: (t) => {
    if (t === 0)
      return 0;
    if (t === 1)
      return 1;
    if (t < 0.5)
      return Math.pow(2, 20 * t - 10) / 2;
    return (2 - Math.pow(2, -20 * t + 10)) / 2;
  },
  easeInCirc: (t) => 1 - Math.sqrt(1 - t * t),
  easeOutCirc: (t) => Math.sqrt(1 - --t * t),
  easeInOutCirc: (t) => t < 0.5 ? (1 - Math.sqrt(1 - 4 * t * t)) / 2 : (Math.sqrt(1 - (-2 * t + 2) * (-2 * t + 2)) + 1) / 2,
  easeInBack: (t) => {
    const c = 1.70158;
    return t * t * ((c + 1) * t - c);
  },
  easeOutBack: (t) => {
    const c = 1.70158;
    return 1 + --t * t * ((c + 1) * t + c);
  },
  easeInOutBack: (t) => {
    const c = 1.70158 * 1.525;
    return t < 0.5 ? Math.pow(2 * t, 2) * ((c + 1) * 2 * t - c) / 2 : (Math.pow(2 * t - 2, 2) * ((c + 1) * (2 * t - 2) + c) + 2) / 2;
  },
  easeInElastic: (t) => {
    if (t === 0 || t === 1)
      return t;
    return -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
  },
  easeOutElastic: (t) => {
    if (t === 0 || t === 1)
      return t;
    return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
  },
  easeInOutElastic: (t) => {
    if (t === 0 || t === 1)
      return t;
    t *= 2;
    if (t < 1)
      return -0.5 * Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
    return 0.5 * Math.pow(2, -10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI) + 1;
  },
  easeInBounce: (t) => 1 - easings.easeOutBounce(1 - t),
  easeOutBounce: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1)
      return n1 * t * t;
    if (t < 2 / d1)
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1)
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
  easeInOutBounce: (t) => t < 0.5 ? (1 - easings.easeOutBounce(1 - 2 * t)) / 2 : (1 + easings.easeOutBounce(2 * t - 1)) / 2
};
function getEasing(name) {
  if (typeof name === "function")
    return name;
  return easings[name] ?? easings.linear;
}
function registerEasing(name, fn) {
  easings[name] = fn;
}

// src/utils/pathGeometry.ts
function parsePathSegments(d) {
  const segments = [];
  let current = [];
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) ?? [];
  let i = 0;
  const readNum = () => parseFloat(tokens[i++]);
  while (i < tokens.length) {
    const cmd = tokens[i++];
    const rel = cmd === cmd.toLowerCase();
    const c = cmd.toUpperCase();
    if (c === "M") {
      if (current.length > 1)
        segments.push(current);
      cx = readNum();
      cy = readNum();
      sx = cx;
      sy = cy;
      current = [{ x: cx, y: cy }];
    } else if (c === "L") {
      const px = readNum();
      const py = readNum();
      cx = rel ? (current[current.length - 1]?.x ?? 0) + px : px;
      cy = rel ? (current[current.length - 1]?.y ?? 0) + py : py;
      current.push({ x: cx, y: cy });
    } else if (c === "H") {
      const px = readNum();
      cx = rel ? (current[current.length - 1]?.x ?? 0) + px : px;
      cy = current[current.length - 1]?.y ?? cy;
      current.push({ x: cx, y: cy });
    } else if (c === "V") {
      const py = readNum();
      cy = rel ? (current[current.length - 1]?.y ?? 0) + py : py;
      cx = current[current.length - 1]?.x ?? cx;
      current.push({ x: cx, y: cy });
    } else if (c === "Z") {
      if (current.length > 0) {
        current.push({ x: sx, y: sy });
        segments.push(current);
        current = [];
      }
      cx = sx;
      cy = sy;
    } else if (c === "C") {
      const x1 = readNum();
      const y1 = readNum();
      const x2 = readNum();
      const y2 = readNum();
      const x = readNum();
      const y = readNum();
      const p0 = current[current.length - 1] ?? { x: cx, y: cy };
      if (rel) {
        flattenCubic(
          p0,
          { x: p0.x + x1, y: p0.y + y1 },
          { x: p0.x + x2, y: p0.y + y2 },
          { x: p0.x + x, y: p0.y + y },
          current
        );
        cx = p0.x + x;
        cy = p0.y + y;
      } else {
        flattenCubic(p0, { x: x1, y: y1 }, { x: x2, y: y2 }, { x, y }, current);
        cx = x;
        cy = y;
      }
    } else if (c === "Q") {
      const x1 = readNum();
      const y1 = readNum();
      const x = readNum();
      const y = readNum();
      const p0 = current[current.length - 1] ?? { x: cx, y: cy };
      if (rel) {
        flattenQuadratic(
          p0,
          { x: p0.x + x1, y: p0.y + y1 },
          { x: p0.x + x, y: p0.y + y },
          current
        );
        cx = p0.x + x;
        cy = p0.y + y;
      } else {
        flattenQuadratic(p0, { x: x1, y: y1 }, { x, y }, current);
        cx = x;
        cy = y;
      }
    }
  }
  if (current.length > 1)
    segments.push(current);
  return segments;
}
function flattenCubic(p0, p1, p2, p3, out, steps = 8) {
  for (let t = 1; t <= steps; t++) {
    const u = t / steps;
    const u2 = u * u;
    const u3 = u2 * u;
    const mt = 1 - u;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    out.push({
      x: mt3 * p0.x + 3 * mt2 * u * p1.x + 3 * mt * u2 * p2.x + u3 * p3.x,
      y: mt3 * p0.y + 3 * mt2 * u * p1.y + 3 * mt * u2 * p2.y + u3 * p3.y
    });
  }
}
function flattenQuadratic(p0, p1, p2, out, steps = 6) {
  for (let t = 1; t <= steps; t++) {
    const u = t / steps;
    const mt = 1 - u;
    out.push({
      x: mt * mt * p0.x + 2 * mt * u * p1.x + u * u * p2.x,
      y: mt * mt * p0.y + 2 * mt * u * p1.y + u * u * p2.y
    });
  }
}
function flattenSegments(segments) {
  const pts = [];
  for (const seg of segments) {
    for (const p of seg)
      pts.push(p);
  }
  return pts;
}
function segmentLength(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}
function getPathLength(d) {
  const segments = parsePathSegments(d);
  let len = 0;
  for (const seg of segments) {
    for (let i = 0; i < seg.length - 1; i++) {
      len += segmentLength(seg[i], seg[i + 1]);
    }
  }
  return len;
}
function getPointAtLength(d, distance) {
  const segments = parsePathSegments(d);
  if (segments.length === 0 || segments.every((s) => s.length === 0)) {
    return { x: 0, y: 0, angle: 0 };
  }
  let remaining = Math.max(0, distance);
  let prev = segments[0][0] ?? { x: 0, y: 0 };
  for (const seg of segments) {
    for (let i = 0; i < seg.length - 1; i++) {
      const a = seg[i];
      const b = seg[i + 1];
      const len = segmentLength(a, b);
      if (len === 0)
        continue;
      if (remaining <= len) {
        const t = remaining / len;
        const x = lerp(a.x, b.x, t);
        const y = lerp(a.y, b.y, t);
        const angle2 = radToDeg(Math.atan2(b.y - a.y, b.x - a.x));
        return { x, y, angle: angle2 };
      }
      remaining -= len;
      prev = b;
    }
  }
  const lastSeg = segments[segments.length - 1];
  const last = lastSeg[lastSeg.length - 1] ?? prev;
  const prevPt = lastSeg.length > 1 ? lastSeg[lastSeg.length - 2] : prev;
  const angle = radToDeg(Math.atan2(last.y - prevPt.y, last.x - prevPt.x));
  return { x: last.x, y: last.y, angle };
}
function samplePath(d, samples) {
  const total = getPathLength(d);
  if (total === 0 || samples < 2) {
    const flat = flattenSegments(parsePathSegments(d));
    return flat.length > 0 ? flat : [{ x: 0, y: 0 }];
  }
  const pts = [];
  for (let i = 0; i < samples; i++) {
    const pt = getPointAtLength(d, i / (samples - 1) * total);
    pts.push({ x: pt.x, y: pt.y });
  }
  return pts;
}
function morphPath(from, to, t, samples = 32) {
  const fromPts = samplePath(from, samples);
  const toPts = samplePath(to, samples);
  const pts = [];
  for (let i = 0; i < samples; i++) {
    pts.push({
      x: lerp(fromPts[i].x, toPts[i].x, t),
      y: lerp(fromPts[i].y, toPts[i].y, t)
    });
  }
  if (pts.length === 0)
    return from;
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L${pts[i].x} ${pts[i].y}`;
  }
  return d;
}

// src/animation/Animation.ts
var nextId = 1;
var activeAnimations = [];
var rafScheduled = false;
var pendingFrameId = 0;
function isColorProp(key) {
  return key === "fill" || key === "stroke" || key === "color" || key === "background";
}
function applyProps(target, props) {
  for (const key in props) {
    target[key] = props[key];
  }
  if (typeof target.markDirty === "function") {
    target.markDirty();
  }
}
function interpolateProps(from, to, t) {
  const result = {};
  for (const key in to) {
    const a = from[key];
    const b = to[key];
    if (typeof a === "number" && typeof b === "number") {
      result[key] = lerp(a, b, t);
    } else if (typeof a === "string" && typeof b === "string" && isColorProp(key)) {
      result[key] = interpolateColor(a, b, t);
    } else {
      result[key] = t < 1 ? a : b;
    }
  }
  return result;
}
function resolveMotionPath(motionPath) {
  if (typeof motionPath === "string")
    return motionPath;
  if (motionPath && typeof motionPath === "object" && "d" in motionPath) {
    return motionPath.d;
  }
  return null;
}
function cancelPendingTick() {
  if (rafScheduled && pendingFrameId) {
    cancelFrame(pendingFrameId);
    rafScheduled = false;
    pendingFrameId = 0;
  }
}
function tick() {
  rafScheduled = false;
  pendingFrameId = 0;
  const currentTime = now();
  let needsRedraw = false;
  for (let i = activeAnimations.length - 1; i >= 0; i--) {
    const anim = activeAnimations[i];
    if (!anim.active)
      continue;
    const elapsed = currentTime - anim.startTime - anim.delay;
    if (elapsed < 0)
      continue;
    let progress = anim.duration > 0 ? elapsed / anim.duration : 1;
    if (progress >= 1) {
      if (anim.loop || anim.iteration < anim.repeat) {
        anim.iteration++;
        if (anim.reverse)
          anim.reversed = !anim.reversed;
        anim.startTime = currentTime;
        progress = 0;
      } else {
        progress = 1;
      }
    }
    const eased = anim.easing(clampProgress(progress, anim.reversed));
    const from = anim.reversed ? anim.to : anim.from;
    const to = anim.reversed ? anim.from : anim.to;
    const current = interpolateProps(from, to, eased);
    if (anim.motionPathD) {
      const pt = getPointAtLength(anim.motionPathD, eased * anim.pathLength);
      current.x = pt.x;
      current.y = pt.y;
      if ("rotation" in anim.to || "rotation" in anim.from) {
        current.rotation = pt.angle;
      }
    }
    if (anim.morphFrom && anim.morphTo) {
      current.d = morphPath(anim.morphFrom, anim.morphTo, eased);
    }
    applyProps(anim.target, current);
    anim.onUpdate?.(eased);
    needsRedraw = true;
    if (progress >= 1 && anim.iteration >= anim.repeat && !anim.loop) {
      anim.onComplete?.();
      anim.active = false;
      activeAnimations.splice(i, 1);
    }
  }
  if (activeAnimations.some((a) => a.active)) {
    scheduleTick();
  } else {
    cancelPendingTick();
  }
  if (needsRedraw) {
    AnimationEngine.onFrame?.();
  }
}
function clampProgress(t, reversed) {
  return reversed ? 1 - t : t;
}
function scheduleTick() {
  if (!rafScheduled) {
    rafScheduled = true;
    pendingFrameId = requestFrame(tick);
  }
}
var AnimationEngine = class {
  /** Test hook: whether a RAF callback is scheduled. */
  static isTickScheduled() {
    return rafScheduled;
  }
  static animate(target, options) {
    const duration = options.duration ?? 300;
    const delay = options.delay ?? 0;
    const easing = getEasing(options.easing ?? "easeOut");
    const repeat = options.repeat ?? 0;
    const reverse = options.reverse ?? false;
    const loop = options.loop ?? false;
    const from = {};
    const to = {};
    const skipKeys = /* @__PURE__ */ new Set([
      "duration",
      "delay",
      "easing",
      "repeat",
      "reverse",
      "loop",
      "onStart",
      "onUpdate",
      "onComplete",
      "motionPath",
      "morphTo"
    ]);
    for (const key in options) {
      if (skipKeys.has(key))
        continue;
      const val = options[key];
      if (typeof val === "number" || typeof val === "string") {
        from[key] = target[key];
        to[key] = val;
      }
    }
    const motionPathD = resolveMotionPath(options.motionPath);
    const pathLength = motionPathD ? getPathLength(motionPathD) : 0;
    const morphTo = options.morphTo;
    const morphFrom = morphTo && typeof target.d === "string" ? target.d : null;
    const state = {
      id: nextId++,
      target,
      from,
      to,
      startTime: now(),
      duration,
      delay,
      easing,
      repeat,
      reverse,
      loop,
      iteration: 0,
      reversed: false,
      motionPathD,
      pathLength,
      morphFrom,
      morphTo: morphTo ?? null,
      onStart: options.onStart,
      onUpdate: options.onUpdate,
      onComplete: options.onComplete,
      frameId: 0,
      active: true
    };
    options.onStart?.();
    activeAnimations.push(state);
    scheduleTick();
    return {
      stop: () => {
        state.active = false;
        const idx = activeAnimations.indexOf(state);
        if (idx >= 0)
          activeAnimations.splice(idx, 1);
        if (!activeAnimations.some((a) => a.active))
          cancelPendingTick();
      },
      pause: () => {
        state.active = false;
        if (!activeAnimations.some((a) => a.active))
          cancelPendingTick();
      },
      resume: () => {
        if (!state.active) {
          state.startTime = now() - state.duration * (state.iteration > 0 ? 1 : 0);
          state.active = true;
          scheduleTick();
        }
      }
    };
  }
  static stopAll() {
    activeAnimations.length = 0;
    cancelPendingTick();
  }
};
AnimationEngine.onFrame = null;
function animate(target, options) {
  return AnimationEngine.animate(target, options);
}

// src/Node.ts
var Node = class extends EventEmitter {
  constructor(type, options = {}) {
    super();
    this.name = "";
    this.x = 0;
    this.y = 0;
    this.rotation = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    this.skewX = 0;
    this.skewY = 0;
    this.opacity = 1;
    this.visible = true;
    this.zIndex = 0;
    this.listening = true;
    this.draggable = false;
    this.dropTarget = false;
    this.dragPayload = void 0;
    this.focusable = false;
    this.tabIndex = 0;
    this.fill = "#000000";
    this.stroke = null;
    this.strokeWidth = 1;
    this.lineCap = "butt";
    this.lineJoin = "miter";
    this.dash = [];
    this.dashOffset = 0;
    this.shadow = null;
    this.clip = false;
    this.mask = null;
    this.metadata = {};
    this.parent = null;
    this._dirty = true;
    this._worldMatrix = new Matrix2D();
    this._localMatrix = new Matrix2D();
    this.type = type;
    this.id = options.id ?? uid(type);
    this.applyOptions(options);
    AnimationEngine.onFrame = () => this.getApp()?.requestRender();
  }
  applyOptions(options) {
    if (options.name)
      this.name = options.name;
    if (options.x !== void 0)
      this.x = options.x;
    if (options.y !== void 0)
      this.y = options.y;
    if (options.rotation !== void 0)
      this.rotation = options.rotation;
    if (options.scaleX !== void 0)
      this.scaleX = options.scaleX;
    if (options.scaleY !== void 0)
      this.scaleY = options.scaleY;
    if (options.skewX !== void 0)
      this.skewX = options.skewX;
    if (options.skewY !== void 0)
      this.skewY = options.skewY;
    if (options.opacity !== void 0)
      this.opacity = options.opacity;
    if (options.visible !== void 0)
      this.visible = options.visible;
    if (options.zIndex !== void 0)
      this.zIndex = options.zIndex;
    if (options.fill !== void 0)
      this.fill = options.fill;
    if (options.stroke !== void 0)
      this.stroke = options.stroke;
    if (options.strokeWidth !== void 0)
      this.strokeWidth = options.strokeWidth;
    if (options.lineCap)
      this.lineCap = options.lineCap;
    if (options.lineJoin)
      this.lineJoin = options.lineJoin;
    if (options.dash)
      this.dash = options.dash;
    if (options.dashOffset !== void 0)
      this.dashOffset = options.dashOffset;
    if (options.shadow !== void 0)
      this.shadow = options.shadow;
    if (options.clip !== void 0)
      this.clip = options.clip;
    if (options.mask !== void 0)
      this.mask = options.mask;
    if (options.listening !== void 0)
      this.listening = options.listening;
    if (options.draggable !== void 0)
      this.draggable = options.draggable;
    if (options.dropTarget !== void 0)
      this.dropTarget = options.dropTarget;
    if (options.dragPayload !== void 0)
      this.dragPayload = options.dragPayload;
    if (options.focusable !== void 0)
      this.focusable = options.focusable;
    if (options.tabIndex !== void 0)
      this.tabIndex = options.tabIndex;
    if (options.role !== void 0)
      this.role = options.role;
    if (options.ariaChecked !== void 0)
      this.ariaChecked = options.ariaChecked;
    if (options.ariaValueNow !== void 0)
      this.ariaValueNow = options.ariaValueNow;
    if (options.ariaValueMin !== void 0)
      this.ariaValueMin = options.ariaValueMin;
    if (options.ariaValueMax !== void 0)
      this.ariaValueMax = options.ariaValueMax;
    if (options.ariaLive !== void 0)
      this.ariaLive = options.ariaLive;
    if (options.metadata)
      this.metadata = { ...options.metadata };
    merge(this, options);
    this.markDirty();
  }
  get scale() {
    return this.scaleX;
  }
  set scale(value) {
    this.scaleX = value;
    this.scaleY = value;
    this.markDirty();
  }
  /** Position helpers */
  position(x, y) {
    this.x = x;
    this.y = y;
    this.markDirty();
    return this;
  }
  move(x, y) {
    return this.position(x, y);
  }
  translate(dx, dy) {
    this.x += dx;
    this.y += dy;
    this.markDirty();
    return this;
  }
  rotate(degrees) {
    this.rotation = degrees;
    this.markDirty();
    return this;
  }
  setOpacity(value) {
    this.opacity = value;
    this.markDirty();
    return this;
  }
  hide() {
    this.visible = false;
    this.markDirty();
    return this;
  }
  show() {
    this.visible = true;
    this.markDirty();
    return this;
  }
  attr(key, value) {
    if (value === void 0) {
      return this[key];
    }
    this[key] = value;
    this.markDirty();
    return this;
  }
  animate(options) {
    return AnimationEngine.animate(this, options);
  }
  markDirty() {
    this._dirty = true;
    this.parent?.markDirty();
    this.getApp()?.markNodeDirty(this);
    this.getApp()?.requestRender();
  }
  isDirty() {
    return this._dirty;
  }
  clearDirty() {
    this._dirty = false;
  }
  getLocalMatrix() {
    if (this._dirty) {
      this._localMatrix.identity();
      this._localMatrix.translate(this.x, this.y);
      this._localMatrix.rotate(degToRad(this.rotation));
      this._localMatrix.scale(this.scaleX, this.scaleY);
      if (this.skewX || this.skewY) {
        this._localMatrix.skew(degToRad(this.skewX), degToRad(this.skewY));
      }
    }
    return this._localMatrix;
  }
  getWorldMatrix() {
    const local = this.getLocalMatrix();
    if (this.parent) {
      const parentWorld = this.parent.getWorldMatrix();
      this._worldMatrix.a = parentWorld.a;
      this._worldMatrix.b = parentWorld.b;
      this._worldMatrix.c = parentWorld.c;
      this._worldMatrix.d = parentWorld.d;
      this._worldMatrix.e = parentWorld.e;
      this._worldMatrix.f = parentWorld.f;
      this._worldMatrix.multiply(local);
    } else {
      this._worldMatrix.a = local.a;
      this._worldMatrix.b = local.b;
      this._worldMatrix.c = local.c;
      this._worldMatrix.d = local.d;
      this._worldMatrix.e = local.e;
      this._worldMatrix.f = local.f;
    }
    return this._worldMatrix;
  }
  getTransformState() {
    return {
      x: this.x,
      y: this.y,
      rotation: this.rotation,
      scaleX: this.scaleX,
      scaleY: this.scaleY,
      skewX: this.skewX,
      skewY: this.skewY,
      opacity: this.opacity
    };
  }
  getApp() {
    const direct = this._app;
    if (direct)
      return direct;
    let node = this.parent;
    while (node) {
      const app = node._app;
      if (app)
        return app;
      node = node.parent;
    }
    return null;
  }
  toJSON() {
    return {
      type: this.type,
      id: this.id,
      props: {
        x: this.x,
        y: this.y,
        rotation: this.rotation,
        scaleX: this.scaleX,
        scaleY: this.scaleY,
        opacity: this.opacity,
        visible: this.visible,
        fill: this.fill,
        stroke: this.stroke,
        strokeWidth: this.strokeWidth,
        metadata: this.metadata,
        ...this.getShapeProps()
      }
    };
  }
  getShapeProps() {
    return {};
  }
  destroy() {
    this.getApp()?.onNodeDestroyed(this);
    this.removeAllListeners();
    this.parent = null;
  }
};

// src/shapes/Group.ts
var Group = class _Group extends Node {
  constructor(options = {}) {
    super("group", options);
    this.children = [];
    /** When true, subtree is cached to offscreen bitmap when static. */
    this.cacheAsBitmap = false;
    if (options.cacheAsBitmap)
      this.cacheAsBitmap = true;
  }
  add(...nodes) {
    for (const node of nodes) {
      if (node.parent && "remove" in node.parent) {
        node.parent.remove(node);
      }
      node.parent = this;
      this.children.push(node);
      this.sortChildren();
      node.markDirty();
    }
    this.markDirty();
    return this;
  }
  remove(node) {
    const idx = this.children.indexOf(node);
    if (idx >= 0) {
      this.children.splice(idx, 1);
      node.parent = null;
      this.markDirty();
    }
    return this;
  }
  clear() {
    for (const child of this.children) {
      child.parent = null;
      child.destroy();
    }
    this.children = [];
    this.markDirty();
    return this;
  }
  getChildById(id) {
    for (const child of this.children) {
      if (child.id === id)
        return child;
      if (child instanceof _Group) {
        const found = child.getChildById(id);
        if (found)
          return found;
      }
    }
    return void 0;
  }
  sortChildren() {
    this.children.sort((a, b) => a.zIndex - b.zIndex);
  }
  containsPoint(_localX, _localY) {
    for (let i = this.children.length - 1; i >= 0; i--) {
      const child = this.children[i];
      if (!child.visible || !child.listening)
        continue;
      const wm = child.getWorldMatrix();
      const inv = wm.invert();
      if (!inv)
        continue;
      const local = inv.transformPoint(_localX + this.x, _localY + this.y);
      if (child.containsPoint(local.x - child.x, local.y - child.y))
        return true;
    }
    return false;
  }
  getBounds() {
    if (this.children.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const child of this.children) {
      const b = child.getBounds();
      const wm = child.getWorldMatrix();
      const corners = [
        wm.transformPoint(b.x, b.y),
        wm.transformPoint(b.x + b.width, b.y),
        wm.transformPoint(b.x, b.y + b.height),
        wm.transformPoint(b.x + b.width, b.y + b.height)
      ];
      for (const c of corners) {
        minX = Math.min(minX, c.x);
        minY = Math.min(minY, c.y);
        maxX = Math.max(maxX, c.x);
        maxY = Math.max(maxY, c.y);
      }
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }
  draw(ctx) {
    const renderer = ctx;
    renderer.drawGroup?.(this);
  }
  toJSON() {
    return {
      ...super.toJSON(),
      children: this.children.map((c) => c.toJSON())
    };
  }
};
var Layer = class extends Group {
  constructor(options = {}) {
    super(options);
    this.type = "layer";
  }
};

// src/renderers/Renderer.ts
var Renderer = class {
  constructor() {
    this.width = 0;
    this.height = 0;
    this.pixelRatio = 1;
    this.background = "transparent";
    this.focusedNodeId = null;
    this.highContrast = false;
    this.dirtyRegions = [];
    this.fullRedraw = true;
    this.hasRendered = false;
  }
  markDirty(x = 0, y = 0, w, h) {
    this.dirtyRegions.push({
      x,
      y,
      width: w ?? this.width,
      height: h ?? this.height
    });
    this.fullRedraw = this.dirtyRegions.length > 10;
  }
  clearDirty() {
    this.dirtyRegions = [];
    this.fullRedraw = false;
    this.hasRendered = true;
  }
  forceFullRedraw() {
    this.fullRedraw = true;
    this.dirtyRegions = [];
  }
  setRenderState(state) {
    if (state.focusedNodeId !== void 0)
      this.focusedNodeId = state.focusedNodeId;
    if (state.highContrast !== void 0)
      this.highContrast = state.highContrast;
  }
  get needsFullRedraw() {
    return this.fullRedraw || !this.hasRendered;
  }
  applyFillStyle(_ctx, fill, setFill) {
    if (!fill)
      return;
    if (typeof fill === "string") {
      setFill(fill);
    } else if (fill.type === "linear" || fill.type === "radial") {
      const g = fill;
    }
  }
  applyStrokeStyle(_ctx, stroke, setStroke) {
    if (!stroke)
      return;
    if (typeof stroke === "string") {
      setStroke(stroke);
    }
  }
  applyShadow(ctx, shadow) {
    if (shadow) {
      ctx.shadowColor = shadow.color;
      ctx.shadowBlur = shadow.blur;
      ctx.shadowOffsetX = shadow.offsetX;
      ctx.shadowOffsetY = shadow.offsetY;
    } else {
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
    }
  }
  /** Traverse and draw scene graph */
  traverse(node, drawFn) {
    if (!node.visible)
      return;
    drawFn(node);
    if ("children" in node) {
      const group = node;
      group.sortChildren?.();
      for (const child of group.children) {
        this.traverse(child, drawFn);
      }
    }
  }
};

// src/renderers/styles.ts
function isGradient(style) {
  return style !== null && typeof style === "object" && "stops" in style && "type" in style;
}
function isPattern(style) {
  return style !== null && typeof style === "object" && style.type === "pattern";
}
function gradientToCss(g) {
  const stops = g.stops.map((s) => `${s.color} ${s.offset * 100}%`).join(", ");
  if (g.type === "radial") {
    return `radial-gradient(circle at ${g.x0}px ${g.y0}px, ${stops})`;
  }
  const angle = Math.atan2(g.y1 - g.y0, g.x1 - g.x0) * (180 / Math.PI) + 90;
  return `linear-gradient(${angle}deg, ${stops})`;
}
function createSvgGradient(doc, id, g) {
  const ns = "http://www.w3.org/2000/svg";
  if (g.type === "radial") {
    const el2 = doc.createElementNS(ns, "radialGradient");
    el2.setAttribute("id", id);
    el2.setAttribute("cx", String(g.x0));
    el2.setAttribute("cy", String(g.y0));
    el2.setAttribute("r", String(g.r1 ?? 50));
    appendStops(doc, el2, g);
    return el2;
  }
  const el = doc.createElementNS(ns, "linearGradient");
  el.setAttribute("id", id);
  el.setAttribute("x1", String(g.x0));
  el.setAttribute("y1", String(g.y0));
  el.setAttribute("x2", String(g.x1));
  el.setAttribute("y2", String(g.y1));
  appendStops(doc, el, g);
  return el;
}
function appendStops(doc, gradient, g) {
  const ns = "http://www.w3.org/2000/svg";
  for (const stop of g.stops) {
    const el = doc.createElementNS(ns, "stop");
    el.setAttribute("offset", String(stop.offset));
    el.setAttribute("stop-color", stop.color);
    gradient.appendChild(el);
  }
}
function shadowToCss(shadow) {
  return `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.color}`;
}
function createSvgShadowFilter(doc, id, shadow) {
  const ns = "http://www.w3.org/2000/svg";
  const filter = doc.createElementNS(ns, "filter");
  filter.setAttribute("id", id);
  filter.setAttribute("x", "-50%");
  filter.setAttribute("y", "-50%");
  filter.setAttribute("width", "200%");
  filter.setAttribute("height", "200%");
  const blur = doc.createElementNS(ns, "feGaussianBlur");
  blur.setAttribute("in", "SourceAlpha");
  blur.setAttribute("stdDeviation", String(shadow.blur / 2));
  blur.setAttribute("result", "blur");
  const offset = doc.createElementNS(ns, "feOffset");
  offset.setAttribute("in", "blur");
  offset.setAttribute("dx", String(shadow.offsetX));
  offset.setAttribute("dy", String(shadow.offsetY));
  offset.setAttribute("result", "offsetBlur");
  const flood = doc.createElementNS(ns, "feFlood");
  flood.setAttribute("flood-color", shadow.color);
  flood.setAttribute("result", "color");
  const composite = doc.createElementNS(ns, "feComposite");
  composite.setAttribute("in", "color");
  composite.setAttribute("in2", "offsetBlur");
  composite.setAttribute("operator", "in");
  composite.setAttribute("result", "shadow");
  const merge2 = doc.createElementNS(ns, "feMerge");
  const n1 = doc.createElementNS(ns, "feMergeNode");
  n1.setAttribute("in", "shadow");
  const n2 = doc.createElementNS(ns, "feMergeNode");
  n2.setAttribute("in", "SourceGraphic");
  merge2.appendChild(n1);
  merge2.appendChild(n2);
  filter.appendChild(blur);
  filter.appendChild(offset);
  filter.appendChild(flood);
  filter.appendChild(composite);
  filter.appendChild(merge2);
  return filter;
}
function setCanvasFill(ctx, fill, patternCache) {
  if (!fill)
    return;
  if (typeof fill === "string") {
    ctx.fillStyle = fill;
  } else if (isGradient(fill)) {
    const grad = fill.type === "linear" ? ctx.createLinearGradient(fill.x0, fill.y0, fill.x1, fill.y1) : ctx.createRadialGradient(fill.x0, fill.y0, fill.r0 ?? 0, fill.x1, fill.y1, fill.r1 ?? 50);
    for (const stop of fill.stops) {
      grad.addColorStop(stop.offset, stop.color);
    }
    ctx.fillStyle = grad;
  } else if (isPattern(fill)) {
    const key = typeof fill.source === "string" ? fill.source : "canvas-pattern";
    let pattern = patternCache?.get(key);
    if (!pattern && typeof fill.source !== "string") {
      const created = ctx.createPattern(fill.source, fill.repeat);
      if (created) {
        pattern = created;
        if (patternCache)
          patternCache.set(key, pattern);
      }
    }
    if (pattern)
      ctx.fillStyle = pattern;
  }
}
function setCanvasStroke(ctx, stroke) {
  if (!stroke)
    return;
  if (typeof stroke === "string") {
    ctx.strokeStyle = stroke;
  } else if (isGradient(stroke)) {
    setCanvasFill(ctx, stroke);
    ctx.strokeStyle = ctx.fillStyle;
  }
}

// src/utils/pathHitTest.ts
function pointInPolygon(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x;
    const yi = pts[i].y;
    const xj = pts[j].x;
    const yj = pts[j].y;
    if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0)
    return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}
function pathContainsPoint(d, localX, localY, strokeWidth = 1) {
  if (typeof Path2D !== "undefined" && typeof document !== "undefined") {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext("2d");
      if (ctx && "isPointInPath" in ctx) {
        const path = new Path2D(d);
        if (ctx.isPointInPath(path, localX, localY))
          return true;
        const strokeCtx = ctx;
        if (strokeWidth > 0 && strokeCtx.isPointInStroke?.(path, localX, localY))
          return true;
      }
    } catch {
    }
  }
  const segments = parsePathSegments(d);
  const tolerance = Math.max(strokeWidth, 4);
  for (const seg of segments) {
    if (seg.length < 2)
      continue;
    const closed = seg.length > 2 && Math.hypot(seg[0].x - seg[seg.length - 1].x, seg[0].y - seg[seg.length - 1].y) < 0.01;
    if (closed && pointInPolygon(localX, localY, seg))
      return true;
    for (let i = 0; i < seg.length - 1; i++) {
      if (distToSegment(localX, localY, seg[i].x, seg[i].y, seg[i + 1].x, seg[i + 1].y) <= tolerance) {
        return true;
      }
    }
  }
  return false;
}
function pathBounds(d) {
  const segments = parsePathSegments(d);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const seg of segments) {
    for (const p of seg) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
  }
  if (!isFinite(minX))
    return { x: 0, y: 0, width: 0, height: 0 };
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

// src/shapes/index.ts
var Rect = class extends Node {
  constructor(options = {}) {
    super("rect", options);
    this.cornerRadius = 0;
    this.width = options.width ?? 100;
    this.height = options.height ?? 100;
    this.cornerRadius = options.cornerRadius ?? 0;
  }
  containsPoint(localX, localY) {
    return localX >= 0 && localY >= 0 && localX <= this.width && localY <= this.height;
  }
  getBounds() {
    return { x: 0, y: 0, width: this.width, height: this.height };
  }
  draw(ctx) {
    ctx.drawRect(this);
  }
  getShapeProps() {
    return { width: this.width, height: this.height, cornerRadius: this.cornerRadius };
  }
};
var Circle = class extends Node {
  constructor(options = {}) {
    super("circle", options);
    this.radius = options.radius ?? 50;
  }
  containsPoint(localX, localY) {
    const dx = localX - this.radius;
    const dy = localY - this.radius;
    return dx * dx + dy * dy <= this.radius * this.radius;
  }
  getBounds() {
    return { x: 0, y: 0, width: this.radius * 2, height: this.radius * 2 };
  }
  draw(ctx) {
    ctx.drawCircle(this);
  }
  getShapeProps() {
    return { radius: this.radius };
  }
};
var Ellipse = class extends Node {
  constructor(options = {}) {
    super("ellipse", options);
    this.radiusX = options.radiusX ?? 50;
    this.radiusY = options.radiusY ?? 30;
  }
  containsPoint(localX, localY) {
    const dx = (localX - this.radiusX) / this.radiusX;
    const dy = (localY - this.radiusY) / this.radiusY;
    return dx * dx + dy * dy <= 1;
  }
  getBounds() {
    return { x: 0, y: 0, width: this.radiusX * 2, height: this.radiusY * 2 };
  }
  draw(ctx) {
    ctx.drawEllipse(this);
  }
  getShapeProps() {
    return { radiusX: this.radiusX, radiusY: this.radiusY };
  }
};
var Line = class extends Node {
  constructor(options = {}) {
    super("line", options);
    this.x2 = options.x2 ?? 100;
    this.y2 = options.y2 ?? 0;
  }
  containsPoint(localX, localY) {
    const tolerance = Math.max(this.strokeWidth, 5);
    const dx = this.x2;
    const dy = this.y2;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0)
      return Math.hypot(localX, localY) <= tolerance;
    const t = clamp((localX * dx + localY * dy) / lenSq, 0, 1);
    const px = t * dx;
    const py = t * dy;
    return Math.hypot(localX - px, localY - py) <= tolerance;
  }
  getBounds() {
    return {
      x: Math.min(0, this.x2),
      y: Math.min(0, this.y2),
      width: Math.abs(this.x2),
      height: Math.abs(this.y2)
    };
  }
  draw(ctx) {
    ctx.drawLine(this);
  }
  getShapeProps() {
    return { x2: this.x2, y2: this.y2 };
  }
};
function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}
var Arc = class extends Node {
  constructor(options = {}) {
    super("arc", options);
    this.counterClockwise = false;
    this.radius = options.radius ?? 50;
    this.innerRadius = options.innerRadius ?? 0;
    this.startAngle = options.startAngle ?? 0;
    this.endAngle = options.endAngle ?? Math.PI * 1.5;
    this.counterClockwise = options.counterClockwise ?? false;
  }
  containsPoint(localX, localY) {
    const cx = this.radius;
    const cy = this.radius;
    const dx = localX - cx;
    const dy = localY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > this.radius || dist < this.innerRadius)
      return false;
    const angle = Math.atan2(dy, dx);
    const start = this.startAngle;
    const end = this.endAngle;
    if (this.counterClockwise) {
      if (start >= end)
        return angle <= start && angle >= end;
      return angle <= start || angle >= end;
    }
    if (end >= start)
      return angle >= start && angle <= end;
    return angle >= start || angle <= end;
  }
  getBounds() {
    return { x: 0, y: 0, width: this.radius * 2, height: this.radius * 2 };
  }
  draw(ctx) {
    ctx.drawArc(this);
  }
  getShapeProps() {
    return {
      radius: this.radius,
      innerRadius: this.innerRadius,
      startAngle: this.startAngle,
      endAngle: this.endAngle,
      counterClockwise: this.counterClockwise
    };
  }
};
var Polygon = class extends Node {
  constructor(options = {}) {
    super("polygon", options);
    this.points = options.points ?? [0, 0, 100, 0, 50, 80];
  }
  containsPoint(localX, localY) {
    const pts = this.points;
    let inside = false;
    for (let i = 0, j = pts.length - 2; i < pts.length; j = i, i += 2) {
      const xi = pts[i], yi = pts[i + 1];
      const xj = pts[j], yj = pts[j + 1];
      if (yi > localY !== yj > localY && localX < (xj - xi) * (localY - yi) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  }
  getBounds() {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < this.points.length; i += 2) {
      minX = Math.min(minX, this.points[i]);
      minY = Math.min(minY, this.points[i + 1]);
      maxX = Math.max(maxX, this.points[i]);
      maxY = Math.max(maxY, this.points[i + 1]);
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }
  draw(ctx) {
    ctx.drawPolygon(this);
  }
  getShapeProps() {
    return { points: [...this.points] };
  }
};
var Polyline = class extends Polygon {
  constructor(options = {}) {
    super(options);
    this.type = "polyline";
  }
  containsPoint(localX, localY) {
    const tolerance = Math.max(this.strokeWidth, 5);
    const pts = this.points;
    for (let i = 0; i < pts.length - 2; i += 2) {
      const x1 = pts[i], y1 = pts[i + 1];
      const x2 = pts[i + 2], y2 = pts[i + 3];
      const dx = x2 - x1, dy = y2 - y1;
      const lenSq = dx * dx + dy * dy;
      const t = lenSq === 0 ? 0 : clamp(((localX - x1) * dx + (localY - y1) * dy) / lenSq, 0, 1);
      const px = x1 + t * dx, py = y1 + t * dy;
      if (Math.hypot(localX - px, localY - py) <= tolerance)
        return true;
    }
    return false;
  }
  draw(ctx) {
    ctx.drawPolyline(this);
  }
};
var Path = class extends Node {
  constructor(options = {}) {
    super("path", options);
    this.d = options.d ?? "M0 0 L100 100";
  }
  containsPoint(localX, localY) {
    return pathContainsPoint(this.d, localX, localY, this.strokeWidth);
  }
  getBounds() {
    return pathBounds(this.d);
  }
  draw(ctx) {
    ctx.drawPath(this);
  }
  getShapeProps() {
    return { d: this.d };
  }
};
var Star = class extends Node {
  constructor(options = {}) {
    super("star", options);
    this.numPoints = options.numPoints ?? 5;
    this.innerRadius = options.innerRadius ?? 25;
    this.outerRadius = options.outerRadius ?? 50;
  }
  containsPoint(localX, localY) {
    const cx = this.outerRadius;
    const cy = this.outerRadius;
    return Math.hypot(localX - cx, localY - cy) <= this.outerRadius;
  }
  getBounds() {
    return { x: 0, y: 0, width: this.outerRadius * 2, height: this.outerRadius * 2 };
  }
  draw(ctx) {
    ctx.drawStar(this);
  }
  getShapeProps() {
    return {
      numPoints: this.numPoints,
      innerRadius: this.innerRadius,
      outerRadius: this.outerRadius
    };
  }
};
var TextNode = class extends Node {
  constructor(options = {}) {
    super("text", options);
    this.text = options.text ?? "";
    this.fontSize = options.fontSize ?? 16;
    this.fontFamily = options.fontFamily ?? "sans-serif";
    this.fontWeight = options.fontWeight ?? "normal";
    this.textAlign = options.textAlign ?? "left";
    this.fill = options.fill ?? "#000000";
  }
  containsPoint(localX, localY) {
    const b = this.getBounds();
    return localX >= b.x && localY >= b.y && localX <= b.x + b.width && localY <= b.y + b.height;
  }
  getBounds() {
    const w = this.text.length * this.fontSize * 0.6;
    return { x: 0, y: -this.fontSize, width: w, height: this.fontSize * 1.2 };
  }
  draw(ctx) {
    ctx.drawText(this);
  }
  getShapeProps() {
    return {
      text: this.text,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      fontWeight: this.fontWeight,
      textAlign: this.textAlign
    };
  }
};
var ImageNode = class extends Node {
  constructor(options = {}) {
    super("image", options);
    this._image = null;
    this.loaded = false;
    this.src = options.src ?? "";
    this.width = options.width ?? 100;
    this.height = options.height ?? 100;
    if (this.src)
      this.load();
  }
  load() {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this._image = img;
        this.loaded = true;
        this.markDirty();
        resolve();
      };
      img.onerror = reject;
      img.src = this.src;
    });
  }
  get image() {
    return this._image;
  }
  containsPoint(localX, localY) {
    return localX >= 0 && localY >= 0 && localX <= this.width && localY <= this.height;
  }
  getBounds() {
    return { x: 0, y: 0, width: this.width, height: this.height };
  }
  draw(ctx) {
    ctx.drawImage(this);
  }
  getShapeProps() {
    return { src: this.src, width: this.width, height: this.height };
  }
};
var Sprite = class extends ImageNode {
  constructor(options = {}) {
    super(options);
    this.currentFrame = 0;
    this.playing = false;
    this._lastTime = 0;
    this._loop = true;
    this._animControl = null;
    this._frameProxy = { frame: 0 };
    this.type = "sprite";
    this.frameWidth = options.frameWidth ?? this.width;
    this.frameHeight = options.frameHeight ?? this.height;
    this.frames = options.frames ?? 1;
    this.fps = options.fps ?? 12;
    this.playing = options.playing ?? false;
  }
  play(options) {
    if (options?.fps !== void 0)
      this.fps = options.fps;
    if (options?.loop !== void 0)
      this._loop = options.loop;
    this.stop();
    if (this.frames <= 1) {
      this.playing = true;
      return this;
    }
    this.playing = true;
    this.currentFrame = 0;
    this._frameProxy.frame = 0;
    const duration = (this.frames - 1) / this.fps * 1e3;
    this._animControl = AnimationEngine.animate(this._frameProxy, {
      frame: this.frames - 1,
      duration: Math.max(duration, 1),
      loop: this._loop,
      onUpdate: () => {
        this.currentFrame = Math.round(this._frameProxy.frame);
        this.markDirty();
      },
      onComplete: () => {
        if (!this._loop)
          this.playing = false;
      }
    });
    this.markDirty();
    return this;
  }
  stop() {
    this.playing = false;
    this._animControl?.stop();
    this._animControl = null;
    return this;
  }
  updateFrame(time) {
    if (this._animControl || !this.playing || this.frames <= 1)
      return;
    const interval = 1e3 / this.fps;
    if (time - this._lastTime >= interval) {
      this.currentFrame = (this.currentFrame + 1) % this.frames;
      this._lastTime = time;
      this.markDirty();
    }
  }
  draw(ctx) {
    ctx.drawSprite(this);
  }
  getShapeProps() {
    return {
      ...super.getShapeProps(),
      frameWidth: this.frameWidth,
      frameHeight: this.frameHeight,
      frames: this.frames,
      fps: this.fps
    };
  }
};
var RoundedRect = class extends Rect {
  constructor(options = {}) {
    super({ cornerRadius: 8, ...options });
    this.type = "roundedRect";
  }
};

// src/renderers/clipUtils.ts
function beginShapeClip(ctx, node) {
  ctx.beginPath();
  if (node instanceof Rect) {
    const r = node.cornerRadius;
    if (r > 0) {
      roundRect(ctx, 0, 0, node.width, node.height, r);
    } else {
      ctx.rect(0, 0, node.width, node.height);
    }
  } else if (node instanceof Circle) {
    ctx.arc(node.radius, node.radius, node.radius, 0, Math.PI * 2);
  } else if (node instanceof Ellipse) {
    ctx.ellipse(node.radiusX, node.radiusY, node.radiusX, node.radiusY, 0, 0, Math.PI * 2);
  } else if (node instanceof Polygon) {
    const pts = node.points;
    if (pts.length >= 4) {
      ctx.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2)
        ctx.lineTo(pts[i], pts[i + 1]);
      ctx.closePath();
    }
  } else if (node instanceof Star) {
    const pts = starPoints(node);
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2)
      ctx.lineTo(pts[i], pts[i + 1]);
    ctx.closePath();
  } else if (node instanceof Path) {
    ctx.clip(new Path2D(node.d));
    return;
  } else if (node instanceof Arc) {
    ctx.arc(
      node.radius,
      node.radius,
      node.radius,
      node.startAngle,
      node.endAngle,
      node.counterClockwise
    );
  } else if ("children" in node) {
    const g = node;
    const meta = g.metadata ?? {};
    const state = meta.autoState;
    const aw = meta.autoWidth ?? state?.width;
    const ah = meta.autoHeight ?? state?.height;
    if (typeof aw === "number" && typeof ah === "number" && aw > 0 && ah > 0) {
      ctx.rect(0, 0, aw, ah);
    } else if (g.children.length === 0) {
      ctx.rect(0, 0, 0, 0);
    } else {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const child of g.children) {
        const b = child.getBounds();
        const x0 = child.x + b.x;
        const y0 = child.y + b.y;
        minX = Math.min(minX, x0);
        minY = Math.min(minY, y0);
        maxX = Math.max(maxX, x0 + b.width);
        maxY = Math.max(maxY, y0 + b.height);
      }
      ctx.rect(minX, minY, maxX - minX, maxY - minY);
    }
  } else {
    const b = node.getBounds();
    ctx.rect(b.x, b.y, b.width, b.height);
  }
  ctx.clip();
}
function starPoints(node) {
  const pts = [];
  const cx = node.outerRadius;
  const cy = node.outerRadius;
  for (let i = 0; i < node.numPoints * 2; i++) {
    const r = i % 2 === 0 ? node.outerRadius : node.innerRadius;
    const angle = i * Math.PI / node.numPoints - Math.PI / 2;
    pts.push(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
  }
  return pts;
}
function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
function pointInMask(mask, localX, localY) {
  if (!mask)
    return true;
  return mask.containsPoint(localX - mask.x, localY - mask.y);
}

// src/performance/bounds.ts
function getWorldBounds(node, padding = 2) {
  const b = node.getBounds();
  const wm = node.getWorldMatrix();
  const corners = [
    wm.transformPoint(b.x, b.y),
    wm.transformPoint(b.x + b.width, b.y),
    wm.transformPoint(b.x, b.y + b.height),
    wm.transformPoint(b.x + b.width, b.y + b.height)
  ];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const c of corners) {
    minX = Math.min(minX, c.x);
    minY = Math.min(minY, c.y);
    maxX = Math.max(maxX, c.x);
    maxY = Math.max(maxY, c.y);
  }
  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2
  };
}
function isSubtreeDirty(node) {
  if (node.isDirty())
    return true;
  if ("children" in node) {
    for (const child of node.children) {
      if (isSubtreeDirty(child))
        return true;
    }
  }
  return false;
}
function collectHitTargets(root, out = []) {
  for (const child of root.children) {
    if (!child.visible || !child.listening)
      continue;
    if ("children" in child && child.children.length > 0) {
      collectHitTargets(child, out);
    } else {
      out.push(child);
    }
  }
  return out;
}
function countNodes(root) {
  let n = 0;
  for (const child of root.children) {
    n++;
    if ("children" in child)
      n += countNodes(child);
  }
  return n;
}

// src/performance/LayerCache.ts
var LayerCache = class {
  constructor() {
    this.entries = /* @__PURE__ */ new Map();
  }
  get(group) {
    return this.entries.get(group.id);
  }
  set(group, entry) {
    this.entries.set(group.id, entry);
  }
  invalidate(nodeId) {
    this.entries.delete(nodeId);
  }
  invalidateSubtree(group) {
    this.entries.delete(group.id);
    for (const child of group.children) {
      if ("children" in child)
        this.invalidateSubtree(child);
    }
  }
  isValid(group) {
    const entry = this.entries.get(group.id);
    if (!entry)
      return false;
    if (isSubtreeDirty(group))
      return false;
    const b = group.getBounds();
    return entry.width >= b.width && entry.height >= b.height;
  }
  clear() {
    this.entries.clear();
  }
  destroy() {
    this.clear();
  }
};

// src/performance/styleKey.ts
function paintStyleKey(node) {
  const fill = node.fill === null || node.fill === void 0 ? "" : typeof node.fill === "string" ? node.fill : JSON.stringify(node.fill);
  const stroke = node.stroke === null || node.stroke === void 0 ? "" : typeof node.stroke === "string" ? node.stroke : JSON.stringify(node.stroke);
  return `${fill}|${stroke}|${node.strokeWidth}|${node.dash.join(",")}|${node.lineCap}|${node.lineJoin}`;
}
function isBatchableRect(node) {
  return node instanceof Rect && !node.clip && !node.mask && !node.shadow && node.rotation === 0 && node.skewX === 0 && node.skewY === 0 && node.scaleX === 1 && node.scaleY === 1 && node.cornerRadius === 0 && !node.stroke;
}

// src/renderers/arcSector.ts
function arcSectorPath(cx, cy, outerR, startAngle, endAngle, innerR = 0, counterClockwise = false) {
  const sweep = counterClockwise ? 0 : 1;
  const large = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
  const ox1 = cx + outerR * Math.cos(startAngle);
  const oy1 = cy + outerR * Math.sin(startAngle);
  const ox2 = cx + outerR * Math.cos(endAngle);
  const oy2 = cy + outerR * Math.sin(endAngle);
  if (innerR > 0 && innerR < outerR) {
    const ix1 = cx + innerR * Math.cos(endAngle);
    const iy1 = cy + innerR * Math.sin(endAngle);
    const ix2 = cx + innerR * Math.cos(startAngle);
    const iy2 = cy + innerR * Math.sin(startAngle);
    const innerSweep = counterClockwise ? 1 : 0;
    return `M ${ox1} ${oy1} A ${outerR} ${outerR} 0 ${large} ${sweep} ${ox2} ${oy2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${large} ${innerSweep} ${ix2} ${iy2} Z`;
  }
  return `M ${cx} ${cy} L ${ox1} ${oy1} A ${outerR} ${outerR} 0 ${large} ${sweep} ${ox2} ${oy2} Z`;
}
function traceArcSector(ctx, cx, cy, outerR, startAngle, endAngle, innerR = 0, counterClockwise = false) {
  ctx.beginPath();
  if (innerR > 0 && innerR < outerR) {
    ctx.arc(cx, cy, outerR, startAngle, endAngle, counterClockwise);
    ctx.arc(cx, cy, innerR, endAngle, startAngle, !counterClockwise);
    ctx.closePath();
  } else {
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outerR, startAngle, endAngle, counterClockwise);
    ctx.closePath();
  }
}

// src/utils/a11y.ts
var HC_PALETTE = {
  bg: "#000000",
  fg: "#ffffff",
  accent: "#ffff00",
  border: "#ffffff",
  muted: "#cccccc"
};
function toHighContrastColor(color, kind = "fill") {
  if (!color || color === "transparent")
    return kind === "fill" ? HC_PALETTE.bg : HC_PALETTE.border;
  if (kind === "stroke")
    return HC_PALETTE.border;
  if (kind === "text")
    return HC_PALETTE.fg;
  return HC_PALETTE.accent;
}

// src/renderers/CanvasRenderer.ts
var CanvasRenderer = class extends Renderer {
  constructor() {
    super(...arguments);
    this.patternCache = /* @__PURE__ */ new Map();
    this.layerCache = new LayerCache();
    this.batchRendering = true;
    this.dirtyRegionsEnabled = true;
    this.layerCacheEnabled = true;
    /** Exposed for tests — number of clearRect calls in last render. */
    this.lastClearRectCount = 0;
    /** Exposed for tests — fill calls in last render. */
    this.lastFillCallCount = 0;
    this.drawCallCount = 0;
  }
  init(container, options) {
    this.width = options.width;
    this.height = options.height;
    this.pixelRatio = options.pixelRatio;
    this.background = options.background;
    this.highContrast = options.highContrast ?? false;
    this.canvas = document.createElement("canvas");
    this.canvas.style.display = "block";
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    container.appendChild(this.canvas);
    const ctx = this.canvas.getContext("2d");
    if (!ctx)
      throw new Error("LightDraw: Canvas 2D not supported");
    this.ctx = ctx;
    this.resize(this.width, this.height, this.pixelRatio);
  }
  resize(width, height, pixelRatio) {
    this.width = width;
    this.height = height;
    this.pixelRatio = pixelRatio;
    this.canvas.width = width * pixelRatio;
    this.canvas.height = height * pixelRatio;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    this.layerCache.clear();
    this.forceFullRedraw();
  }
  getElement() {
    return this.canvas;
  }
  render(root, cameraMatrix) {
    const ctx = this.ctx;
    this.lastClearRectCount = 0;
    this.lastFillCallCount = 0;
    this.drawCallCount = 0;
    ctx.save();
    if (this.needsFullRedraw || !this.dirtyRegionsEnabled) {
      ctx.clearRect(0, 0, this.width, this.height);
      this.lastClearRectCount = 1;
    } else {
      for (const r of this.dirtyRegions) {
        ctx.clearRect(r.x, r.y, r.width, r.height);
        this.lastClearRectCount++;
      }
    }
    if (this.background && this.background !== "transparent") {
      ctx.fillStyle = this.background;
      ctx.fillRect(0, 0, this.width, this.height);
    }
    if (cameraMatrix) {
      ctx.transform(
        cameraMatrix.a,
        cameraMatrix.b,
        cameraMatrix.c,
        cameraMatrix.d,
        cameraMatrix.e,
        cameraMatrix.f
      );
    }
    this.drawGroup(root);
    ctx.restore();
    this.clearSceneDirty(root);
    this.clearDirty();
  }
  clearSceneDirty(node) {
    node.clearDirty();
    if ("children" in node) {
      for (const child of node.children) {
        this.clearSceneDirty(child);
      }
    }
  }
  toDataURL(type = "image/png", quality) {
    return this.canvas.toDataURL(type, quality);
  }
  destroy() {
    this.layerCache.destroy();
    this.canvas.remove();
  }
  drawGroup(group) {
    group.sortChildren();
    if (this.layerCacheEnabled && group.cacheAsBitmap && !isSubtreeDirty(group) && this.layerCache.isValid(group)) {
      const entry = this.layerCache.get(group);
      this.ctx.drawImage(entry.canvas, 0, 0);
      return;
    }
    if (this.layerCacheEnabled && group.cacheAsBitmap && !isSubtreeDirty(group)) {
      this.renderGroupToCache(group);
      const entry = this.layerCache.get(group);
      if (entry) {
        this.ctx.drawImage(entry.canvas, 0, 0);
        return;
      }
    }
    if (this.batchRendering) {
      this.drawGroupBatched(group);
      return;
    }
    for (const child of group.children) {
      if (!child.visible)
        continue;
      this.drawNode(child);
    }
  }
  drawGroupBatched(group) {
    group.sortChildren();
    let batch = [];
    let batchKey = "";
    const flush = () => {
      if (batch.length === 0)
        return;
      if (batch.length > 1)
        this.drawRectBatch(batch);
      else
        this.drawNode(batch[0]);
      batch = [];
      batchKey = "";
    };
    for (const child of group.children) {
      if (!child.visible)
        continue;
      if (isBatchableRect(child)) {
        const key = paintStyleKey(child);
        if (batch.length > 0 && key !== batchKey)
          flush();
        batchKey = key;
        batch.push(child);
      } else {
        flush();
        this.drawNode(child);
      }
    }
    flush();
  }
  drawRectBatch(rects) {
    const ctx = this.ctx;
    const sample = rects[0];
    ctx.save();
    ctx.beginPath();
    for (const node of rects) {
      ctx.rect(node.x, node.y, node.width, node.height);
    }
    if (sample.fill) {
      this.setFill(ctx, sample.fill);
      ctx.fill();
      this.lastFillCallCount++;
    }
    ctx.restore();
    this.drawCallCount++;
  }
  renderGroupToCache(group) {
    const b = group.getBounds();
    const w = Math.max(Math.ceil(b.width), 1);
    const h = Math.max(Math.ceil(b.height), 1);
    let entry = this.layerCache.get(group);
    if (!entry || entry.width < w || entry.height < h) {
      const canvas = document.createElement("canvas");
      canvas.width = w * this.pixelRatio;
      canvas.height = h * this.pixelRatio;
      const ctx2 = canvas.getContext("2d");
      if (!ctx2)
        return;
      ctx2.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
      entry = { canvas, ctx: ctx2, width: w, height: h };
      this.layerCache.set(group, entry);
    }
    const { ctx } = entry;
    ctx.clearRect(0, 0, entry.width, entry.height);
    const prevCtx = this.ctx;
    this.ctx = ctx;
    try {
      if (this.batchRendering)
        this.drawGroupBatched(group);
      else {
        for (const child of group.children) {
          if (!child.visible)
            continue;
          this.drawNode(child);
        }
      }
    } finally {
      this.ctx = prevCtx;
    }
  }
  drawNode(node) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = node.opacity;
    ctx.translate(node.x, node.y);
    ctx.rotate(degToRad(node.rotation));
    ctx.scale(node.scaleX, node.scaleY);
    if (node.skewX || node.skewY) {
      ctx.transform(1, Math.tan(degToRad(node.skewY)), Math.tan(degToRad(node.skewX)), 1, 0, 0);
    }
    if (node.shadow) {
      ctx.shadowColor = node.shadow.color;
      ctx.shadowBlur = node.shadow.blur;
      ctx.shadowOffsetX = node.shadow.offsetX;
      ctx.shadowOffsetY = node.shadow.offsetY;
    }
    if (node.clip) {
      beginShapeClip(ctx, node);
    }
    if (node.mask) {
      ctx.save();
      beginShapeClip(ctx, node.mask);
    }
    node.draw(this);
    if (node.mask) {
      ctx.restore();
    }
    if ("children" in node) {
      this.drawGroup(node);
    }
    if (this.focusedNodeId === node.id) {
      this.drawFocusRing(node);
    }
    ctx.restore();
  }
  drawFocusRing(node) {
    const ctx = this.ctx;
    const b = node.getBounds();
    ctx.save();
    ctx.strokeStyle = this.highContrast ? "#ffff00" : "#2563eb";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    if (typeof ctx.strokeRect === "function") {
      ctx.strokeRect(b.x - 2, b.y - 2, b.width + 4, b.height + 4);
    } else {
      ctx.beginPath();
      ctx.rect(b.x - 2, b.y - 2, b.width + 4, b.height + 4);
      ctx.stroke();
    }
    ctx.restore();
  }
  resolveFill(fill) {
    if (!this.highContrast || !fill || typeof fill !== "string")
      return fill;
    return toHighContrastColor(fill, "fill");
  }
  resolveStroke(stroke) {
    if (!this.highContrast || !stroke || typeof stroke !== "string")
      return stroke;
    return toHighContrastColor(stroke, "stroke");
  }
  drawRect(node) {
    const ctx = this.ctx;
    const { width, height, cornerRadius } = node;
    ctx.beginPath();
    if (cornerRadius > 0) {
      this.roundRect(ctx, 0, 0, width, height, cornerRadius);
    } else {
      ctx.rect(0, 0, width, height);
    }
    this.fillAndStroke(ctx, node.fill, node.stroke, node.strokeWidth, node.dash, node.dashOffset, node.lineCap, node.lineJoin);
    this.drawCallCount++;
  }
  drawCircle(node) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(node.radius, node.radius, node.radius, 0, Math.PI * 2);
    this.fillAndStroke(ctx, node.fill, node.stroke, node.strokeWidth, node.dash, node.dashOffset, node.lineCap, node.lineJoin);
    this.drawCallCount++;
  }
  drawEllipse(node) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.ellipse(node.radiusX, node.radiusY, node.radiusX, node.radiusY, 0, 0, Math.PI * 2);
    this.fillAndStroke(ctx, node.fill, node.stroke, node.strokeWidth, node.dash, node.dashOffset, node.lineCap, node.lineJoin);
    this.drawCallCount++;
  }
  drawLine(node) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(node.x2, node.y2);
    this.applyStroke(ctx, node.stroke, node.strokeWidth, node.dash, node.dashOffset, node.lineCap, node.lineJoin);
    ctx.stroke();
    this.drawCallCount++;
  }
  drawArc(node) {
    const ctx = this.ctx;
    traceArcSector(
      ctx,
      node.radius,
      node.radius,
      node.radius,
      node.startAngle,
      node.endAngle,
      node.innerRadius,
      node.counterClockwise
    );
    this.fillAndStroke(ctx, node.fill, node.stroke, node.strokeWidth, node.dash, node.dashOffset, node.lineCap, node.lineJoin);
    this.drawCallCount++;
  }
  drawPolygon(node) {
    const ctx = this.ctx;
    const pts = node.points;
    if (pts.length < 4)
      return;
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) {
      ctx.lineTo(pts[i], pts[i + 1]);
    }
    ctx.closePath();
    this.fillAndStroke(ctx, node.fill, node.stroke, node.strokeWidth, node.dash, node.dashOffset, node.lineCap, node.lineJoin);
    this.drawCallCount++;
  }
  drawPolyline(node) {
    const ctx = this.ctx;
    const pts = node.points;
    if (pts.length < 4)
      return;
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) {
      ctx.lineTo(pts[i], pts[i + 1]);
    }
    this.applyStroke(ctx, node.stroke, node.strokeWidth, node.dash, node.dashOffset, node.lineCap, node.lineJoin);
    ctx.stroke();
    this.drawCallCount++;
  }
  drawPath(node) {
    const ctx = this.ctx;
    const path = new Path2D(node.d);
    if (node.fill) {
      this.setFill(ctx, node.fill);
      ctx.fill(path);
      this.lastFillCallCount++;
    }
    if (node.stroke) {
      this.applyStroke(ctx, node.stroke, node.strokeWidth, node.dash, node.dashOffset, node.lineCap, node.lineJoin);
      ctx.stroke(path);
    }
    this.drawCallCount++;
  }
  drawStar(node) {
    const ctx = this.ctx;
    const { numPoints, innerRadius, outerRadius } = node;
    const cx = outerRadius;
    const cy = outerRadius;
    ctx.beginPath();
    for (let i = 0; i < numPoints * 2; i++) {
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = i * Math.PI / numPoints - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0)
        ctx.moveTo(x, y);
      else
        ctx.lineTo(x, y);
    }
    ctx.closePath();
    this.fillAndStroke(ctx, node.fill, node.stroke, node.strokeWidth, node.dash, node.dashOffset, node.lineCap, node.lineJoin);
    this.drawCallCount++;
  }
  drawText(node) {
    const ctx = this.ctx;
    ctx.font = `${node.fontWeight} ${node.fontSize}px ${node.fontFamily}`;
    ctx.textAlign = node.textAlign;
    ctx.textBaseline = "top";
    if (node.fill) {
      this.setFill(ctx, node.fill);
      ctx.fillText(node.text, 0, 0);
      this.lastFillCallCount++;
    }
    if (node.stroke) {
      this.applyStroke(ctx, node.stroke, node.strokeWidth, node.dash, node.dashOffset, node.lineCap, node.lineJoin);
      ctx.strokeText(node.text, 0, 0);
    }
    this.drawCallCount++;
  }
  drawImage(node) {
    if (!node.image)
      return;
    const ctx = this.ctx;
    ctx.drawImage(node.image, 0, 0, node.width, node.height);
    this.drawCallCount++;
  }
  drawSprite(node) {
    if (!node.image)
      return;
    const ctx = this.ctx;
    const col = node.currentFrame;
    ctx.drawImage(
      node.image,
      col * node.frameWidth,
      0,
      node.frameWidth,
      node.frameHeight,
      0,
      0,
      node.width,
      node.height
    );
    this.drawCallCount++;
  }
  getLastDrawCallCount() {
    return this.drawCallCount;
  }
  roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
  fillAndStroke(ctx, fill, stroke, strokeWidth, dash, dashOffset, lineCap, lineJoin) {
    const resolvedFill = this.resolveFill(fill);
    const resolvedStroke = this.resolveStroke(stroke);
    if (resolvedFill) {
      this.setFill(ctx, resolvedFill);
      ctx.fill();
      this.lastFillCallCount++;
    }
    if (resolvedStroke) {
      this.applyStroke(ctx, resolvedStroke, strokeWidth, dash, dashOffset, lineCap, lineJoin);
      ctx.stroke();
    }
  }
  setFill(ctx, fill) {
    setCanvasFill(ctx, fill, this.patternCache);
  }
  applyStroke(ctx, stroke, strokeWidth, dash, dashOffset, lineCap, lineJoin) {
    if (!stroke)
      return;
    setCanvasStroke(ctx, stroke);
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = lineCap;
    ctx.lineJoin = lineJoin;
    if (dash.length > 0)
      ctx.setLineDash(dash);
    ctx.lineDashOffset = dashOffset;
  }
};

// src/registry/initCore.ts
if (!hasRenderer("canvas")) {
  registerRenderer("canvas", () => new CanvasRenderer());
}

// src/camera/Camera.ts
var Camera = class {
  constructor(app) {
    this.app = app;
    this.x = 0;
    this.y = 0;
    this.zoom = 1;
    this.rotation = 0;
    this.followTarget = null;
    this.viewportWidth = 0;
    this.viewportHeight = 0;
  }
  setViewport(width, height) {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }
  pan(dx, dy) {
    this.x += dx;
    this.y += dy;
    this.app.requestRender();
    return this;
  }
  setPosition(x, y) {
    this.x = x;
    this.y = y;
    this.app.requestRender();
    return this;
  }
  setZoom(zoom) {
    this.zoom = Math.max(0.01, zoom);
    this.app.requestRender();
    return this;
  }
  setRotation(degrees) {
    this.rotation = degrees;
    this.app.requestRender();
    return this;
  }
  follow(target) {
    this.followTarget = target;
    return this;
  }
  update() {
    if (this.followTarget) {
      this.x = this.followTarget.x - this.viewportWidth / (2 * this.zoom);
      this.y = this.followTarget.y - this.viewportHeight / (2 * this.zoom);
    }
  }
  /** Screen to world coordinates */
  screenToWorld(sx, sy) {
    const cx = this.viewportWidth / 2;
    const cy = this.viewportHeight / 2;
    const m = new Matrix2D();
    m.translate(cx, cy);
    m.scale(this.zoom, this.zoom);
    m.rotate(degToRad(this.rotation));
    m.translate(-this.x - cx / this.zoom, -this.y - cy / this.zoom);
    const inv = m.invert();
    return inv ? inv.transformPoint(sx, sy) : { x: sx, y: sy };
  }
  /** World to screen coordinates */
  worldToScreen(wx, wy) {
    const cx = this.viewportWidth / 2;
    const cy = this.viewportHeight / 2;
    const m = new Matrix2D();
    m.translate(cx, cy);
    m.scale(this.zoom, this.zoom);
    m.rotate(degToRad(this.rotation));
    m.translate(-this.x - cx / this.zoom, -this.y - cy / this.zoom);
    return m.transformPoint(wx, wy);
  }
  getMatrix() {
    const cx = this.viewportWidth / 2;
    const cy = this.viewportHeight / 2;
    const m = new Matrix2D();
    m.translate(cx, cy);
    m.scale(this.zoom, this.zoom);
    m.rotate(degToRad(this.rotation));
    m.translate(-this.x - cx / this.zoom, -this.y - cy / this.zoom);
    return m;
  }
};

// src/utils/focusOrder.ts
function collectFocusable(root) {
  const nodes = [];
  walk(root, nodes);
  nodes.sort((a, b) => {
    const ta = a.tabIndex ?? 0;
    const tb = b.tabIndex ?? 0;
    if (ta !== tb)
      return ta - tb;
    return 0;
  });
  return nodes;
}
function walk(node, out) {
  if ("children" in node) {
    for (const child of node.children) {
      walk(child, out);
    }
  }
  if (node.focusable && node.visible && node.listening) {
    out.push(node);
  }
}

// src/events/EventManager.ts
var EventManager = class {
  constructor(app, element) {
    this.dragState = null;
    this.hoverNode = null;
    this.focusedNode = null;
    this.boundHandlers = {};
    this.app = app;
    this.element = element;
    if (!element.hasAttribute("tabindex")) {
      element.tabIndex = 0;
    }
    element.setAttribute("role", "application");
    this.bindEvents();
  }
  getFocusedNode() {
    return this.focusedNode;
  }
  setFocus(node, originalEvent) {
    if (this.focusedNode === node)
      return;
    const prev = this.focusedNode;
    this.focusedNode = node;
    if (prev) {
      this.dispatchDirect(prev, "blur", originalEvent ?? new Event("blur"), 0, 0, 0, 0);
    }
    if (node) {
      this.dispatchDirect(node, "focus", originalEvent ?? new Event("focus"), 0, 0, 0, 0);
    }
    this.app.requestRender();
  }
  bindEvents() {
    const events = [
      "click",
      "dblclick",
      "mousedown",
      "mouseup",
      "mousemove",
      "wheel",
      "touchstart",
      "touchmove",
      "touchend",
      "keydown",
      "keyup"
    ];
    for (const type of events) {
      const handler = (e) => this.handleEvent(type, e);
      this.boundHandlers[type] = handler;
      this.element.addEventListener(type, handler, {
        passive: type === "touchmove"
      });
    }
  }
  destroy() {
    for (const type in this.boundHandlers) {
      this.element.removeEventListener(type, this.boundHandlers[type]);
    }
  }
  resolveDraggableNode(node) {
    let cur = node;
    while (cur) {
      if (cur.draggable)
        return cur;
      cur = cur.parent;
    }
    return null;
  }
  /** Map world-space pointer delta into the dragged node's parent local space. */
  dragPositionFromWorld(node, startWorldX, startWorldY, worldX, worldY, nodeStartX, nodeStartY) {
    const parent = node.parent;
    if (!parent) {
      return {
        x: nodeStartX + (worldX - startWorldX),
        y: nodeStartY + (worldY - startWorldY)
      };
    }
    const inv = parent.getWorldMatrix().invert();
    if (!inv) {
      return {
        x: nodeStartX + (worldX - startWorldX),
        y: nodeStartY + (worldY - startWorldY)
      };
    }
    const p0 = inv.transformPoint(startWorldX, startWorldY);
    const p1 = inv.transformPoint(worldX, worldY);
    return { x: nodeStartX + (p1.x - p0.x), y: nodeStartY + (p1.y - p0.y) };
  }
  getPointerCoords(e) {
    const rect = this.element.getBoundingClientRect();
    if ("touches" in e && e.touches.length > 0) {
      const touch = e.touches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    if ("clientX" in e) {
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    return { x: 0, y: 0 };
  }
  handleEvent(type, originalEvent) {
    if (type === "keydown") {
      this.handleKeydown(originalEvent);
      return;
    }
    const { x, y } = this.getPointerCoords(originalEvent);
    const world = this.app.camera.screenToWorld(x, y);
    if (this.dragState && (type === "mousemove" || type === "touchmove")) {
      const pos = this.dragPositionFromWorld(
        this.dragState.node,
        this.dragState.startX,
        this.dragState.startY,
        world.x,
        world.y,
        this.dragState.nodeStartX,
        this.dragState.nodeStartY
      );
      this.dragState.node.x = pos.x;
      this.dragState.node.y = pos.y;
      this.dispatchBubble(
        this.dragState.node,
        "dragmove",
        originalEvent,
        x,
        y,
        world.x,
        world.y,
        this.dragState.payload
      );
      const over = this.app.hitTest(world.x, world.y)?.node ?? null;
      if (over && over.dropTarget && over !== this.dragState.node) {
        this.dispatchBubble(over, "dragover", originalEvent, x, y, world.x, world.y, this.dragState.payload);
        this.dragState.overNode = over;
      } else {
        this.dragState.overNode = null;
      }
      this.app.requestRender();
      return;
    }
    if (type === "mouseup" || type === "touchend") {
      if (this.dragState) {
        const dropTarget = this.dragState.overNode;
        this.dispatchBubble(
          this.dragState.node,
          "dragend",
          originalEvent,
          x,
          y,
          world.x,
          world.y,
          this.dragState.payload
        );
        if (dropTarget && dropTarget !== this.dragState.node) {
          this.dispatchBubble(
            dropTarget,
            "drop",
            originalEvent,
            x,
            y,
            world.x,
            world.y,
            this.dragState.payload
          );
        }
        this.dragState = null;
      }
    }
    const hit = this.app.hitTest(world.x, world.y);
    const target = hit?.node ?? null;
    if (type === "mousemove" || type === "touchmove") {
      if (target !== this.hoverNode) {
        if (this.hoverNode) {
          this.dispatchBubble(this.hoverNode, "mouseleave", originalEvent, x, y, world.x, world.y);
        }
        if (target) {
          this.dispatchBubble(target, "mouseenter", originalEvent, x, y, world.x, world.y);
        }
        this.hoverNode = target;
      }
    }
    if (target) {
      if (type === "click" || type === "dblclick") {
        if (target.focusable) {
          this.setFocus(target, originalEvent);
        }
      }
      this.dispatchBubble(target, type, originalEvent, x, y, world.x, world.y);
      if (type === "mousedown" || type === "touchstart") {
        const dragNode = this.resolveDraggableNode(target);
        if (dragNode) {
          this.dragState = {
            node: dragNode,
            startX: world.x,
            startY: world.y,
            nodeStartX: dragNode.x,
            nodeStartY: dragNode.y,
            payload: dragNode.dragPayload ?? dragNode.metadata?.dragPayload,
            overNode: null
          };
          this.dispatchBubble(
            dragNode,
            "dragstart",
            originalEvent,
            x,
            y,
            world.x,
            world.y,
            this.dragState.payload
          );
        }
      }
    }
    if (type === "wheel") {
      const wheelEvent = originalEvent;
      const hit2 = this.app.hitTest(world.x, world.y);
      const target2 = hit2?.node ?? null;
      let handled = false;
      if (target2) {
        const event = createEvent("wheel", target2, originalEvent, x, y, world.x, world.y);
        let current = target2;
        while (current) {
          if (current.listening) {
            event.currentTarget = current;
            current.emit("wheel", event);
            if (event.propagationStopped) {
              handled = true;
              break;
            }
          }
          current = current.parent;
        }
      }
      if (!handled) {
        this.app.camera.pan(wheelEvent.deltaX / this.app.camera.zoom, wheelEvent.deltaY / this.app.camera.zoom);
      } else {
        wheelEvent.preventDefault();
      }
      return;
    }
  }
  handleKeydown(e) {
    const focusable = collectFocusable(this.app.stage);
    if (e.key === "Tab" && focusable.length > 0) {
      e.preventDefault();
      const idx = this.focusedNode ? focusable.indexOf(this.focusedNode) : -1;
      const delta = e.shiftKey ? -1 : 1;
      const next = focusable[(idx + delta + focusable.length) % focusable.length];
      this.setFocus(next, e);
      return;
    }
    if ((e.key === "Enter" || e.key === " ") && this.focusedNode) {
      e.preventDefault();
      this.dispatchBubble(this.focusedNode, "click", e, 0, 0, 0, 0);
    }
  }
  /** Dispatch without bubbling (focus/blur). */
  dispatchDirect(node, type, originalEvent, x, y, worldX, worldY, payload) {
    if (!node.listening)
      return;
    const event = createEvent(type, node, originalEvent, x, y, worldX, worldY, payload);
    event.currentTarget = node;
    node.emit(type, event);
    this.app.emit(type, { ...event, target: node });
  }
  dispatchBubble(node, type, originalEvent, x, y, worldX, worldY, payload) {
    const event = createEvent(type, node, originalEvent, x, y, worldX, worldY, payload);
    let current = node;
    while (current) {
      if (current.listening) {
        event.currentTarget = current;
        current.emit(type, event);
        if (event.propagationStopped)
          break;
      }
      current = current.parent;
    }
    if (!event.propagationStopped) {
      this.app.emit(type, { ...event, target: node });
    }
  }
};

// src/animation/Timeline.ts
var Timeline = class {
  constructor() {
    this.steps = [];
    this._playing = false;
    this._paused = false;
    this.currentIndex = 0;
    this.currentControl = null;
  }
  move(target, props) {
    return this.animate(target, { ...props, duration: props.duration ?? 300 });
  }
  rotate(target, degrees, duration = 300) {
    return this.animate(target, { rotation: target.rotation + degrees, duration });
  }
  scale(target, scale, duration = 300) {
    return this.animate(target, { scaleX: scale, scaleY: scale, duration });
  }
  fade(target, opacity, duration = 300) {
    return this.animate(target, { opacity, duration });
  }
  animate(target, options) {
    this.steps.push({ type: "animate", target, options });
    return this;
  }
  wait(ms) {
    this.steps.push({ type: "delay", delay: ms });
    return this;
  }
  call(fn) {
    this.steps.push({ type: "callback", fn });
    return this;
  }
  /** Run the same animation on multiple nodes with staggered start delays. */
  stagger(nodes, options, staggerMs) {
    this.steps.push({ type: "stagger", nodes, options, staggerMs });
    return this;
  }
  play() {
    if (this._playing && !this._paused)
      return this;
    this._playing = true;
    this._paused = false;
    this.runStep(this.currentIndex);
    return this;
  }
  pause() {
    this._paused = true;
    this.currentControl?.stop();
    this.currentControl = null;
    return this;
  }
  stop() {
    this._playing = false;
    this._paused = false;
    this.currentIndex = 0;
    this.currentControl?.stop();
    this.currentControl = null;
    return this;
  }
  runStep(index) {
    if (!this._playing || this._paused || index >= this.steps.length) {
      if (index >= this.steps.length) {
        this._playing = false;
        this.currentIndex = 0;
      }
      return;
    }
    this.currentIndex = index;
    const step = this.steps[index];
    if (step.type === "delay") {
      setTimeout(() => this.runStep(index + 1), step.delay ?? 0);
      return;
    }
    if (step.type === "callback") {
      step.fn?.();
      this.runStep(index + 1);
      return;
    }
    if (step.type === "stagger" && step.nodes && step.options) {
      let remaining = step.nodes.length;
      if (remaining === 0) {
        this.runStep(index + 1);
        return;
      }
      for (let i = 0; i < step.nodes.length; i++) {
        const node = step.nodes[i];
        const opts = {
          ...step.options,
          delay: (step.options.delay ?? 0) + i * (step.staggerMs ?? 0),
          onComplete: () => {
            step.options?.onComplete?.();
            remaining--;
            if (remaining === 0)
              this.runStep(index + 1);
          }
        };
        AnimationEngine.animate(node, opts);
      }
      return;
    }
    if (step.type === "animate" && step.target && step.options) {
      const opts = {
        ...step.options,
        onComplete: () => {
          step.options?.onComplete?.();
          this.runStep(index + 1);
        }
      };
      this.currentControl = AnimationEngine.animate(
        step.target,
        opts
      );
    }
  }
};
function parallel(animations) {
  return new Promise((resolve) => {
    let remaining = animations.length;
    if (remaining === 0) {
      resolve();
      return;
    }
    for (const { target, options } of animations) {
      AnimationEngine.animate(target, {
        ...options,
        onComplete: () => {
          options.onComplete?.();
          remaining--;
          if (remaining === 0)
            resolve();
        }
      });
    }
  });
}

// src/registry/jsonResolvers.ts
var resolvers = [];
function registerJSONResolver(resolver) {
  resolvers.push(resolver);
}
function resolveJSONType(type, props, app) {
  for (const resolver of resolvers) {
    const node = resolver(type, props, app);
    if (node)
      return node;
  }
  return null;
}

// src/components/helpers.ts
function clamp2(v, min, max) {
  return v < min ? min : v > max ? max : v;
}
function getState(node) {
  const state = node.metadata?.componentState;
  if (state && typeof state === "object")
    return state;
  return {};
}
function setState(node, patch) {
  node.metadata.componentState = { ...getState(node), ...patch };
}
function syntheticEvent(type, target, extra = {}) {
  const noop = () => void 0;
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
    ...extra
  };
}
function emitChange(node, value, field = "value") {
  setState(node, { [field]: value });
  node.emit("change", syntheticEvent("change", node, { value, field }));
  node.getApp()?.requestRender();
}
function componentToJSON(node) {
  const componentType = node.metadata?.componentType;
  if (!componentType)
    return node.toJSON();
  const state = getState(node);
  const json = {
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
      name: node.name || void 0,
      ...state
    }
  };
  if ("children" in node && node.children.length > 0) {
    const compound = ["tabs", "accordion", "menu", "toolbar", "table", "tree", "dialog", "statusBar"];
    if (compound.includes(componentType)) {
      json.children = node.children.map((child) => componentToJSON(child));
    }
  }
  return json;
}
function bindApp(node, app) {
  node._app = app;
  if ("children" in node) {
    for (const child of node.children) {
      bindApp(child, app);
    }
  }
}
function num(props, key, fallback) {
  const v = props[key];
  return typeof v === "number" ? v : fallback;
}
function str(props, key, fallback = "") {
  const v = props[key];
  return typeof v === "string" ? v : fallback;
}
function bool(props, key, fallback = false) {
  const v = props[key];
  return typeof v === "boolean" ? v : fallback;
}
function getParts(node) {
  const parts = node.metadata?._parts;
  return parts && typeof parts === "object" ? parts : {};
}
function setParts(node, parts) {
  node.metadata._parts = parts;
}

// src/dashboard/helpers.ts
function clamp3(v, min, max) {
  return v < min ? min : v > max ? max : v;
}
function num2(props, key, fallback) {
  const v = props[key];
  return typeof v === "number" ? v : fallback;
}
function str2(props, key, fallback = "") {
  const v = props[key];
  return typeof v === "string" ? v : fallback;
}
function bool2(props, key, fallback = false) {
  const v = props[key];
  return typeof v === "boolean" ? v : fallback;
}
function getState2(node) {
  const state = node.metadata?.widgetState;
  if (state && typeof state === "object")
    return state;
  return {};
}
function setState2(node, patch) {
  node.metadata.widgetState = { ...getState2(node), ...patch };
}
function bindApp2(node, app) {
  node._app = app;
  if ("children" in node) {
    for (const child of node.children) {
      bindApp2(child, app);
    }
  }
}
function createWidgetGroup(app, type, props, extra = {}) {
  const w = num2(props, "width", 0) || num2(props, "size", 0);
  const h = num2(props, "height", 0) || num2(props, "size", 0);
  const group = app.group({
    ...props,
    listening: true,
    ...w > 0 && h > 0 ? { clip: true } : {},
    metadata: {
      widgetType: type,
      widgetState: { ...props },
      ...w > 0 ? { chartWidth: w } : {},
      ...h > 0 ? { chartHeight: h } : {}
    },
    ...extra
  });
  bindApp2(group, app);
  setState2(group, { ...props });
  return group;
}
function setRefresh(node, fn) {
  node.metadata.refresh = fn;
}
function animateLiveValue(node, key, toValue, duration = 400) {
  const app = node.getApp();
  if (!app)
    return;
  const from = num2(getState2(node), key, 0);
  const refresh = node.metadata.refresh;
  app.animate(node, {
    duration,
    easing: "easeOutCubic",
    onUpdate: (progress) => {
      const v = from + (toValue - from) * progress;
      setState2(node, { [key]: v });
      refresh?.(v);
      app.requestRender();
    },
    onComplete: () => {
      setState2(node, { [key]: toValue });
      refresh?.(toValue);
      app.requestRender();
    }
  });
}
function setLiveValue(node, key, value) {
  setState2(node, { [key]: value });
  const refresh = node.metadata.refresh;
  refresh?.(value);
  node.getApp()?.requestRender();
}
function dashboardToJSON(node) {
  const widgetType = node.metadata?.widgetType;
  if (!widgetType)
    return node.toJSON();
  return {
    type: widgetType,
    id: node.id,
    props: {
      x: node.x,
      y: node.y,
      ...getState2(node)
    }
  };
}
function setParts2(node, parts) {
  node.metadata._parts = parts;
}

// src/automotive/helpers.ts
function clamp4(v, min, max) {
  return v < min ? min : v > max ? max : v;
}
function num3(props, key, fallback) {
  const v = props[key];
  return typeof v === "number" ? v : fallback;
}
function str3(props, key, fallback = "") {
  const v = props[key];
  return typeof v === "string" ? v : fallback;
}
function bool3(props, key, fallback = false) {
  const v = props[key];
  return typeof v === "boolean" ? v : fallback;
}
function getState3(node) {
  const state = node.metadata?.autoState;
  if (state && typeof state === "object")
    return state;
  return {};
}
function setState3(node, patch) {
  node.metadata.autoState = { ...getState3(node), ...patch };
}
function bindApp3(node, app) {
  node._app = app;
  if ("children" in node) {
    for (const child of node.children) {
      bindApp3(child, app);
    }
  }
}
function createAutoGroup(app, type, props, autoPart, extra = {}) {
  const w = num3(props, "width", 0);
  const h = num3(props, "height", 0);
  const group = app.group({
    ...props,
    ...w > 0 && h > 0 ? { clip: true } : {},
    metadata: {
      autoType: type,
      autoPart: autoPart ?? type,
      autoState: { ...props },
      ...w > 0 ? { autoWidth: w, chartWidth: w } : {},
      ...h > 0 ? { autoHeight: h, chartHeight: h } : {}
    },
    ...extra
  });
  bindApp3(group, app);
  setState3(group, { ...props });
  return group;
}
function setRefresh2(node, fn) {
  node.metadata.refresh = fn;
}
function setBoolRefresh(node, fn) {
  node.metadata.boolRefresh = fn;
}
function animateAutoValue(node, key, toValue, duration = 300) {
  const app = node.getApp();
  if (!app)
    return;
  const from = num3(getState3(node), key, 0);
  const refresh = node.metadata.refresh;
  app.animate(node, {
    duration,
    easing: "easeOutCubic",
    onUpdate: (progress) => {
      const v = from + (toValue - from) * progress;
      setState3(node, { [key]: v });
      refresh?.(v);
      app.requestRender();
    },
    onComplete: () => {
      setState3(node, { [key]: toValue });
      refresh?.(toValue);
      app.requestRender();
    }
  });
}
function setAutoValue(node, key, value) {
  setState3(node, { [key]: value });
  node.metadata.refresh?.(value);
  node.getApp()?.requestRender();
}
function setParts3(node, parts) {
  node.metadata._parts = parts;
}
function getParts2(node) {
  const parts = node.metadata?._parts;
  return parts && typeof parts === "object" ? parts : {};
}
function automotiveToJSON(node) {
  const autoType = node.metadata?.autoType;
  if (!autoType)
    return node.toJSON();
  return {
    type: autoType,
    id: node.id,
    props: { x: node.x, y: node.y, ...getState3(node) }
  };
}

// src/diagram/theme.ts
var DIAGRAM = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
  fontMono: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
  fontSize: {
    xs: 9,
    sm: 10,
    md: 11,
    base: 12,
    lg: 13,
    xl: 14
  },
  radii: {
    sm: 4,
    md: 6,
    lg: 8,
    pill: 20,
    round: 999
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24
  },
  shadow: {
    color: "rgba(0,0,0,0.35)",
    blur: 10,
    offsetX: 0,
    offsetY: 3
  },
  shadowSoft: {
    color: "rgba(0,0,0,0.22)",
    blur: 6,
    offsetX: 0,
    offsetY: 2
  },
  shadowElevated: {
    color: "rgba(0,0,0,0.42)",
    blur: 14,
    offsetX: 0,
    offsetY: 4
  },
  sheen: "rgba(255,255,255,0.08)",
  sheenStrong: "rgba(255,255,255,0.12)",
  cardInnerBorder: "rgba(255,255,255,0.05)",
  canvasBg: "#0d1322",
  surface: "#151d2e",
  surfaceElevated: "#1c2740",
  nodeFill: "#1c2740",
  nodeStroke: "#3b82f6",
  nodeText: "#f1f5f9",
  nodeTextMuted: "#94a3b8",
  /** Connector palette */
  edge: "#60a5fa",
  edgeGlow: "rgba(96,165,250,0.18)",
  edgeMuted: "#64748b",
  edgeMutedGlow: "rgba(100,116,139,0.14)",
  edgeLabel: "#e2e8f0",
  labelPillFill: "#1a2336",
  labelPillStroke: "#3b4f6b",
  /** Flowchart semantic colors */
  flowchartStart: { fill: "#14532d", stroke: "#22c55e", accent: "#4ade80" },
  flowchartEnd: { fill: "#1e1b4b", stroke: "#818cf8", accent: "#a5b4fc" },
  flowchartProcess: { fill: "#1c2740", stroke: "#3b82f6", accent: "#60a5fa" },
  flowchartDecision: { fill: "#422006", stroke: "#f59e0b", accent: "#fbbf24" },
  decisionFill: "#422006",
  decisionStroke: "#f59e0b",
  terminalFill: "#14532d",
  terminalStroke: "#22c55e",
  stateFill: "#1c2740",
  stateStroke: "#818cf8",
  stateInitialFill: "#422006",
  stateInitialStroke: "#f59e0b",
  stateFinalFill: "#14532d",
  stateFinalStroke: "#22c55e",
  classFill: "#1c2740",
  classStroke: "#475569",
  classHeaderBg: "#243044",
  classHeader: "#f1f5f9",
  classBody: "#94a3b8",
  classDivider: "#334155",
  /** UML relation edge colors */
  umlInheritance: "#f59e0b",
  umlAssociation: "#60a5fa",
  umlImplements: "#a78bfa",
  umlComposition: "#f472b6",
  networkRouter: { fill: "#1e3a5f", stroke: "#3b82f6", glyph: "#60a5fa", edge: "#60a5fa" },
  networkServer: { fill: "#14532d", stroke: "#22c55e", glyph: "#4ade80", edge: "#4ade80" },
  networkSwitch: { fill: "#422006", stroke: "#f59e0b", glyph: "#fbbf24", edge: "#fbbf24" },
  networkClient: { fill: "#3b0764", stroke: "#a855f7", glyph: "#c084fc", edge: "#c084fc" },
  networkDefault: { fill: "#1c2740", stroke: "#64748b", glyph: "#94a3b8", edge: "#94a3b8" },
  pipelineDone: "#22c55e",
  pipelineActive: "#3b82f6",
  pipelinePending: "#64748b",
  pipelinePendingFill: "#1c2740",
  pipelineActiveFill: "#1e3a5f",
  pipelineDoneFill: "#14532d",
  pipelineErrorFill: "#450a0a",
  pipelineErrorStroke: "#ef4444",
  mindCenter: { fill: "#422006", stroke: "#f59e0b", accent: "#fbbf24" },
  mindBranch: { fill: "#1e3a5f", stroke: "#0ea5e9", accent: "#38bdf8" },
  mindLeaf: { fill: "#1c2740", stroke: "#64748b", accent: "#94a3b8" },
  mindBranchPalette: [
    { fill: "#1e3a5f", stroke: "#0ea5e9", accent: "#38bdf8", glow: "rgba(14,165,233,0.22)" },
    { fill: "#1e1b4b", stroke: "#818cf8", accent: "#a5b4fc", glow: "rgba(129,140,248,0.2)" },
    { fill: "#14532d", stroke: "#22c55e", accent: "#4ade80", glow: "rgba(34,197,94,0.2)" },
    { fill: "#3b0764", stroke: "#a855f7", accent: "#c084fc", glow: "rgba(168,85,247,0.2)" }
  ],
  orgTier: [
    { fill: "#1c2740", stroke: "#3b82f6", accent: "#60a5fa" },
    { fill: "#1e293b", stroke: "#6366f1", accent: "#818cf8" },
    { fill: "#1a2332", stroke: "#64748b", accent: "#94a3b8" }
  ],
  orgToggle: "#cbd5e1",
  orgToggleBg: "#243044",
  orgRole: "#94a3b8",
  canBus: "#3b82f6",
  canBusGlow: "rgba(59,130,246,0.25)",
  canTermination: "#22c55e",
  canEcuPalette: ["#3b82f6", "#6366f1", "#0ea5e9", "#22c55e", "#a855f7"],
  schematicStroke: "#cbd5e1",
  schematicWire: "#60a5fa",
  schematicWireGlow: "rgba(96,165,250,0.2)",
  schematicFill: "#1a2336",
  schematicLedFill: "#fde047",
  schematicLedStroke: "#eab308",
  schematicLabel: "#94a3b8",
  schematicBattery: "#22c55e",
  schematicResistor: "#f59e0b",
  schematicSwitch: "#60a5fa",
  /** Stroke widths — screen defaults; use resolveStrokeWidth for print/compact */
  stroke: {
    node: 1.5,
    nodeEmphasis: 2,
    edge: 2,
    edgeThin: 1.5,
    edgeGlow: 5,
    label: 1,
    arrow: 1.25
  }
};
function resolveStrokeWidth(base, context = "screen") {
  if (context === "print")
    return Math.max(1.25, base * 0.92);
  if (context === "compact")
    return Math.max(1.25, base * 0.88);
  return base;
}
function strokeContextForCanvas(width, height) {
  const minDim = Math.min(width, height);
  if (minDim < 360)
    return "compact";
  return "screen";
}

// src/diagram/chrome.ts
function addTopSheen(app, parent, width, cornerRadius = DIAGRAM.radii.md) {
  if (cornerRadius >= DIAGRAM.radii.pill)
    return;
  const inset = Math.min(10, cornerRadius + 2);
  parent.add(
    app.line({
      x: inset,
      y: 1,
      x2: width - inset,
      y2: 1,
      stroke: DIAGRAM.sheen,
      strokeWidth: 1,
      lineCap: "round",
      listening: false
    })
  );
}
function addAccentBar(app, parent, width, color, height = 3) {
  parent.add(
    app.rect({
      x: 0,
      y: 0,
      width,
      height,
      fill: color,
      stroke: null,
      listening: false
    })
  );
}
function addLeftStripe(app, parent, height, color, width = 4) {
  parent.add(
    app.rect({
      x: 0,
      y: 0,
      width,
      height,
      fill: color,
      stroke: null,
      listening: false
    })
  );
}
function addCardChrome(app, parent, opts) {
  const radius = opts.cornerRadius ?? DIAGRAM.radii.md;
  const strokeWidth = opts.strokeWidth ?? DIAGRAM.stroke.node;
  parent.add(
    app.roundedRect({
      width: opts.width,
      height: opts.height,
      cornerRadius: radius,
      fill: opts.fill,
      stroke: opts.stroke,
      strokeWidth,
      ...opts.shadow !== null && (opts.shadow ?? DIAGRAM.shadowSoft) ? { shadow: opts.shadow ?? DIAGRAM.shadowSoft } : {},
      listening: false
    })
  );
  if (opts.accentColor) {
    addAccentBar(app, parent, opts.width, opts.accentColor, opts.accentHeight ?? 3);
  }
  if (opts.sheen !== false) {
    addTopSheen(app, parent, opts.width, radius);
  }
}
function addCaptionPill(app, parent, textWidth, x, y, accent = DIAGRAM.labelPillStroke) {
  const fontSize = DIAGRAM.fontSize.sm;
  const padX = 6;
  const pw = Math.max(textWidth + padX * 2, 24);
  const ph = fontSize + 6;
  parent.add(
    app.roundedRect({
      x: x + (textWidth - pw) / 2,
      y: y - 2,
      width: pw,
      height: ph,
      cornerRadius: DIAGRAM.radii.sm,
      fill: DIAGRAM.labelPillFill,
      stroke: accent,
      strokeWidth: DIAGRAM.stroke.label,
      opacity: 0.92,
      listening: false
    })
  );
}
function addEmphasisRing(app, parent, width, height, color, cornerRadius) {
  const radius = cornerRadius ?? DIAGRAM.radii.md;
  parent.add(
    app.roundedRect({
      x: -3,
      y: -3,
      width: width + 6,
      height: height + 6,
      cornerRadius: radius + 3,
      fill: null,
      stroke: color,
      strokeWidth: 1.5,
      opacity: 0.4,
      listening: false
    })
  );
}

// src/diagram/primitives.ts
var measureCtx = null;
function getMeasureCtx() {
  if (typeof document === "undefined")
    return null;
  if (!measureCtx) {
    const canvas = document.createElement("canvas");
    measureCtx = canvas.getContext("2d");
  }
  return measureCtx;
}
function measureTextWidth(text, fontSize, fontWeight = "600", fontFamily = DIAGRAM.fontFamily) {
  const ctx = getMeasureCtx();
  if (!ctx)
    return text.length * fontSize * 0.55;
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  return ctx.measureText(text).width;
}
function centerTextX(label, boxWidth, fontSize = DIAGRAM.fontSize.base, fontWeight = "600", fontFamily = DIAGRAM.fontFamily) {
  const w = measureTextWidth(label, fontSize, fontWeight, fontFamily);
  return Math.max(DIAGRAM.spacing.sm, (boxWidth - w) / 2);
}
var defaultBoxStyle = () => ({
  strokeWidth: DIAGRAM.stroke.node,
  shadow: DIAGRAM.shadowSoft
});
function createLabeledBox(app, label, width, height, style = {}, textOpts = {}) {
  const { strokeWidth, shadow } = defaultBoxStyle();
  const node = app.group();
  const fontSize = textOpts.fontSize ?? DIAGRAM.fontSize.base;
  const radius = style.cornerRadius ?? DIAGRAM.radii.md;
  addCardChrome(app, node, {
    width,
    height,
    cornerRadius: radius,
    fill: style.fill ?? DIAGRAM.nodeFill,
    stroke: style.stroke ?? DIAGRAM.nodeStroke,
    strokeWidth: style.strokeWidth ?? strokeWidth,
    shadow: style.shadow !== null ? style.shadow ?? shadow : null,
    accentColor: style.accentColor
  });
  node.add(
    app.text({
      text: label,
      x: centerTextX(label, width, fontSize, textOpts.fontWeight ?? "600"),
      y: textOpts.y ?? height / 2 - fontSize / 2 - 1,
      fontSize,
      fontWeight: textOpts.fontWeight ?? "600",
      fontFamily: DIAGRAM.fontFamily,
      fill: textOpts.fill ?? DIAGRAM.nodeText,
      listening: false
    })
  );
  return node;
}
function createFlowchartNode(app, label, type) {
  const width = 132;
  const height = 46;
  const isStart = type === "start";
  const isEnd = type === "end";
  const isTerminal = isStart || isEnd;
  const isDecision = type === "decision";
  const node = app.group();
  const palette = isStart ? DIAGRAM.flowchartStart : isEnd ? DIAGRAM.flowchartEnd : isDecision ? DIAGRAM.flowchartDecision : DIAGRAM.flowchartProcess;
  if (isDecision) {
    node.add(
      app.polygon({
        points: [66, 2, 130, 23, 66, 44, 2, 23],
        fill: palette.stroke,
        stroke: null,
        opacity: 0.12,
        listening: false
      })
    );
    node.add(
      app.polygon({
        points: [66, 2, 130, 23, 66, 44, 2, 23],
        fill: palette.fill,
        stroke: palette.stroke,
        strokeWidth: DIAGRAM.stroke.nodeEmphasis,
        shadow: DIAGRAM.shadowElevated,
        listening: false
      })
    );
    const fs = DIAGRAM.fontSize.sm;
    node.add(
      app.text({
        text: label,
        x: centerTextX(label, width, fs),
        y: 23 - fs / 2 - 1,
        fontSize: fs,
        fontWeight: "600",
        fontFamily: DIAGRAM.fontFamily,
        fill: DIAGRAM.nodeText,
        listening: false
      })
    );
    return node;
  }
  node.add(
    app.roundedRect({
      width,
      height,
      cornerRadius: isTerminal ? DIAGRAM.radii.pill : DIAGRAM.radii.md,
      fill: palette.fill,
      stroke: palette.stroke,
      strokeWidth: DIAGRAM.stroke.nodeEmphasis,
      shadow: isTerminal ? DIAGRAM.shadowElevated : DIAGRAM.shadowSoft,
      listening: false
    })
  );
  if (!isTerminal) {
    addAccentBar(app, node, width, palette.accent, 3);
    addTopSheen(app, node, width, DIAGRAM.radii.md);
  } else {
    node.add(
      app.roundedRect({
        x: 2,
        y: 2,
        width: width - 4,
        height: height - 4,
        cornerRadius: isTerminal ? DIAGRAM.radii.pill - 2 : DIAGRAM.radii.md,
        fill: null,
        stroke: palette.accent,
        strokeWidth: 1,
        opacity: 0.35,
        listening: false
      })
    );
  }
  if (isTerminal) {
    node.add(
      app.text({
        text: label.toUpperCase(),
        x: centerTextX(label, width, DIAGRAM.fontSize.sm),
        y: height / 2 - 6,
        fontSize: DIAGRAM.fontSize.sm,
        fontWeight: "700",
        letterSpacing: 0.06,
        fontFamily: DIAGRAM.fontFamily,
        fill: isStart ? palette.accent : DIAGRAM.nodeText,
        listening: false
      })
    );
  } else {
    node.add(
      app.text({
        text: label,
        x: centerTextX(label, width),
        y: height / 2 - 6,
        fontSize: DIAGRAM.fontSize.base,
        fontWeight: "600",
        fontFamily: DIAGRAM.fontFamily,
        fill: DIAGRAM.nodeText,
        listening: false
      })
    );
  }
  return node;
}
function createClassNode(app, name, attributes, methods) {
  const width = 172;
  const lineH = 17;
  const headerH = 32;
  const bodyLines = attributes.length + methods.length;
  const height = headerH + bodyLines * lineH + (methods.length > 0 && attributes.length > 0 ? 8 : 4);
  const node = app.group();
  addCardChrome(app, node, {
    width,
    height,
    cornerRadius: DIAGRAM.radii.md,
    fill: DIAGRAM.classFill,
    stroke: DIAGRAM.classStroke,
    strokeWidth: DIAGRAM.stroke.node,
    shadow: DIAGRAM.shadowElevated,
    accentColor: DIAGRAM.umlInheritance,
    sheen: false
  });
  node.add(
    app.rect({
      x: 1,
      y: 1,
      width: width - 2,
      height: headerH - 1,
      fill: DIAGRAM.classHeaderBg,
      stroke: null,
      listening: false
    })
  );
  addTopSheen(app, node, width, DIAGRAM.radii.md);
  node.add(
    app.text({
      text: name,
      x: DIAGRAM.spacing.sm,
      y: 10,
      fontSize: DIAGRAM.fontSize.lg,
      fontWeight: "bold",
      fontStyle: "italic",
      fontFamily: DIAGRAM.fontFamily,
      fill: DIAGRAM.classHeader,
      listening: false
    })
  );
  node.add(
    app.line({
      x: 0,
      y: headerH,
      x2: width,
      y2: 0,
      stroke: DIAGRAM.classDivider,
      strokeWidth: DIAGRAM.stroke.label,
      listening: false
    })
  );
  let y = headerH + 4;
  for (const attr of attributes) {
    node.add(
      app.text({
        text: attr,
        x: DIAGRAM.spacing.sm,
        y,
        fontSize: DIAGRAM.fontSize.md,
        fontFamily: DIAGRAM.fontMono,
        fill: DIAGRAM.classBody,
        listening: false
      })
    );
    y += lineH;
  }
  if (methods.length > 0 && attributes.length > 0) {
    node.add(
      app.line({
        x: 0,
        y: y - 2,
        x2: width,
        y2: 0,
        stroke: DIAGRAM.classDivider,
        strokeWidth: DIAGRAM.stroke.label,
        listening: false
      })
    );
    y += 4;
  }
  for (const method of methods) {
    node.add(
      app.text({
        text: method,
        x: DIAGRAM.spacing.sm,
        y,
        fontSize: DIAGRAM.fontSize.md,
        fontFamily: DIAGRAM.fontMono,
        fill: DIAGRAM.classBody,
        listening: false
      })
    );
    y += lineH;
  }
  return node;
}
var NETWORK_STYLES = {
  router: DIAGRAM.networkRouter,
  server: DIAGRAM.networkServer,
  switch: DIAGRAM.networkSwitch,
  client: DIAGRAM.networkClient,
  default: DIAGRAM.networkDefault
};
function addNetworkGlyph(app, parent, type, size, color) {
  const cx = size / 2;
  const cy = size / 2;
  if (type === "router") {
    parent.add(
      app.line({ x: cx, y: 6, x2: 0, y2: -7, stroke: color, strokeWidth: 2, lineCap: "round", listening: false })
    );
    parent.add(
      app.line({ x: cx - 5, y: 8, x2: 0, y2: -5, stroke: color, strokeWidth: 1.5, lineCap: "round", listening: false })
    );
    parent.add(
      app.line({ x: cx + 5, y: 8, x2: 0, y2: -5, stroke: color, strokeWidth: 1.5, lineCap: "round", listening: false })
    );
    parent.add(
      app.circle({ x: cx, y: cy + 2, radius: 10, fill: null, stroke: color, strokeWidth: 1.5, listening: false })
    );
  } else if (type === "server") {
    for (let i = 0; i < 3; i++) {
      parent.add(
        app.roundedRect({
          x: cx - 13,
          y: cy - 11 + i * 9,
          width: 26,
          height: 7,
          cornerRadius: 2,
          fill: null,
          stroke: color,
          strokeWidth: 1.2,
          listening: false
        })
      );
      parent.add(
        app.circle({ x: cx + 8, y: cy - 8 + i * 9, radius: 1.5, fill: color, listening: false })
      );
    }
  } else if (type === "switch") {
    parent.add(
      app.roundedRect({
        x: cx - 14,
        y: cy - 6,
        width: 28,
        height: 12,
        cornerRadius: 2,
        fill: null,
        stroke: color,
        strokeWidth: 1.5,
        listening: false
      })
    );
    for (let i = 0; i < 4; i++) {
      parent.add(
        app.circle({ x: cx - 9 + i * 6, y: cy, radius: 2, fill: color, listening: false })
      );
    }
  } else if (type === "client") {
    parent.add(
      app.roundedRect({
        x: cx - 12,
        y: cy - 10,
        width: 24,
        height: 16,
        cornerRadius: 2,
        fill: null,
        stroke: color,
        strokeWidth: 1.5,
        listening: false
      })
    );
    parent.add(
      app.line({
        x: cx - 6,
        y: cy + 6,
        x2: 12,
        y2: 0,
        stroke: color,
        strokeWidth: 1.5,
        lineCap: "round",
        listening: false
      })
    );
  } else {
    parent.add(
      app.circle({ x: cx, y: cy, radius: 12, fill: null, stroke: color, strokeWidth: 1.5, listening: false })
    );
  }
}
function createNetworkNode(app, label, type) {
  const netType = type in NETWORK_STYLES ? type : "default";
  const style = NETWORK_STYLES[netType];
  const size = netType === "router" ? 52 : 44;
  const node = app.group();
  addCardChrome(app, node, {
    width: size,
    height: size,
    cornerRadius: netType === "server" ? DIAGRAM.radii.sm : size / 2,
    fill: style.fill,
    stroke: style.stroke,
    strokeWidth: DIAGRAM.stroke.nodeEmphasis,
    shadow: DIAGRAM.shadowElevated,
    sheen: netType === "server"
  });
  node.add(
    app.circle({
      x: size / 2,
      y: size / 2,
      radius: size / 2 - 5,
      fill: null,
      stroke: style.stroke,
      strokeWidth: 1,
      opacity: 0.35,
      listening: false
    })
  );
  addNetworkGlyph(app, node, netType, size, style.glyph);
  const labelW = Math.max(size, measureTextWidth(label, DIAGRAM.fontSize.sm) + 16);
  const labelX = centerTextX(label, labelW, DIAGRAM.fontSize.sm);
  const tw = measureTextWidth(label, DIAGRAM.fontSize.sm);
  addCaptionPill(app, node, tw, labelX, size + DIAGRAM.spacing.xs - 2, style.stroke);
  node.add(
    app.text({
      text: label,
      x: centerTextX(label, labelW, DIAGRAM.fontSize.sm),
      y: size + DIAGRAM.spacing.xs,
      fontSize: DIAGRAM.fontSize.sm,
      fontWeight: "600",
      fontFamily: DIAGRAM.fontFamily,
      fill: DIAGRAM.nodeText,
      listening: false
    })
  );
  return node;
}
function createOrgNode(app, name, role, childCount = 0, collapsed = false, depth = 0) {
  const tier = DIAGRAM.orgTier[Math.min(depth, DIAGRAM.orgTier.length - 1)];
  const width = 156;
  const height = role ? 60 : 52;
  const node = app.group();
  addCardChrome(app, node, {
    width,
    height,
    cornerRadius: DIAGRAM.radii.md,
    fill: tier.fill,
    stroke: tier.stroke,
    strokeWidth: DIAGRAM.stroke.node,
    shadow: DIAGRAM.shadowElevated,
    accentColor: tier.accent
  });
  node.add(
    app.line({
      x: 3,
      y: 3,
      x2: 3,
      y2: height - 3,
      stroke: tier.accent,
      strokeWidth: 2,
      opacity: 0.5,
      lineCap: "round",
      listening: false
    })
  );
  node.add(
    app.text({
      text: name,
      x: DIAGRAM.spacing.md,
      y: role ? 10 : 16,
      fontSize: DIAGRAM.fontSize.lg,
      fontWeight: "600",
      fontFamily: DIAGRAM.fontFamily,
      fill: DIAGRAM.nodeText,
      listening: false
    })
  );
  if (role) {
    node.add(
      app.text({
        text: role,
        x: DIAGRAM.spacing.md,
        y: 32,
        fontSize: DIAGRAM.fontSize.sm,
        fontFamily: DIAGRAM.fontFamily,
        fill: DIAGRAM.orgRole,
        listening: false
      })
    );
  }
  let indicator;
  if (childCount > 0) {
    node.add(
      app.roundedRect({
        x: width - 28,
        y: 12,
        width: 20,
        height: 20,
        cornerRadius: DIAGRAM.radii.sm,
        fill: DIAGRAM.orgToggleBg,
        stroke: DIAGRAM.labelPillStroke,
        strokeWidth: DIAGRAM.stroke.label,
        listening: false
      })
    );
    indicator = app.text({
      text: collapsed ? `+${childCount}` : "\u2212",
      x: width - 23,
      y: 15,
      fontSize: DIAGRAM.fontSize.base,
      fontWeight: "bold",
      fontFamily: DIAGRAM.fontFamily,
      fill: DIAGRAM.orgToggle
    });
    node.add(indicator);
  }
  return { node, indicator };
}
function createPipelineStage(app, label, status) {
  const colors = {
    pending: { fill: DIAGRAM.pipelinePendingFill, stroke: DIAGRAM.pipelinePending },
    active: { fill: DIAGRAM.pipelineActiveFill, stroke: DIAGRAM.pipelineActive },
    done: { fill: DIAGRAM.pipelineDoneFill, stroke: DIAGRAM.pipelineDone },
    error: { fill: DIAGRAM.pipelineErrorFill, stroke: DIAGRAM.pipelineErrorStroke }
  };
  const c = colors[status] ?? colors.pending;
  const width = 118;
  const height = 50;
  const node = app.group();
  const statusLabels = {
    pending: "WAIT",
    active: "RUN",
    done: "DONE",
    error: "FAIL"
  };
  if (status === "active") {
    addEmphasisRing(app, node, width, height, c.stroke, DIAGRAM.radii.md);
  }
  addCardChrome(app, node, {
    width,
    height,
    cornerRadius: DIAGRAM.radii.md,
    fill: c.fill,
    stroke: c.stroke,
    strokeWidth: DIAGRAM.stroke.node,
    shadow: status === "active" ? DIAGRAM.shadowElevated : DIAGRAM.shadowSoft,
    sheen: false
  });
  addLeftStripe(app, node, height, c.stroke, 4);
  const badgeW = 34;
  node.add(
    app.roundedRect({
      x: DIAGRAM.spacing.sm,
      y: height / 2 - 9,
      width: badgeW,
      height: 18,
      cornerRadius: DIAGRAM.radii.sm,
      fill: c.stroke,
      stroke: null,
      opacity: status === "pending" ? 0.35 : 0.9,
      listening: false
    })
  );
  node.add(
    app.text({
      text: statusLabels[status] ?? "WAIT",
      x: DIAGRAM.spacing.sm + 5,
      y: height / 2 - 7,
      fontSize: DIAGRAM.fontSize.xs,
      fontWeight: "700",
      letterSpacing: 0.04,
      fontFamily: DIAGRAM.fontFamily,
      fill: status === "pending" ? DIAGRAM.nodeTextMuted : "#fff",
      listening: false
    })
  );
  node.add(
    app.text({
      text: label,
      x: DIAGRAM.spacing.sm + badgeW + 6,
      y: height / 2 - 7,
      fontSize: DIAGRAM.fontSize.base,
      fontWeight: "600",
      fontFamily: DIAGRAM.fontFamily,
      fill: DIAGRAM.nodeText,
      listening: false
    })
  );
  return node;
}
function createStateNode(app, label, type) {
  const radius = 32;
  const node = app.group();
  const isFinal = type === "final";
  const isInitial = type === "initial";
  if (isFinal) {
    node.add(
      app.circle({
        x: radius - 6,
        y: radius - 6,
        radius: radius + 1,
        fill: null,
        stroke: DIAGRAM.stateFinalStroke,
        strokeWidth: 1,
        opacity: 0.35,
        listening: false
      })
    );
    node.add(
      app.circle({
        x: radius - 6,
        y: radius - 6,
        radius: radius - 2,
        fill: DIAGRAM.stateFinalFill,
        stroke: DIAGRAM.stateFinalStroke,
        strokeWidth: DIAGRAM.stroke.nodeEmphasis,
        shadow: DIAGRAM.shadowElevated,
        listening: false
      })
    );
    node.add(
      app.circle({
        x: radius - 6,
        y: radius - 6,
        radius: radius - 9,
        fill: null,
        stroke: DIAGRAM.stateFinalStroke,
        strokeWidth: DIAGRAM.stroke.node,
        listening: false
      })
    );
    if (label) {
      const fs2 = DIAGRAM.fontSize.sm;
      node.add(
        app.text({
          text: label,
          x: centerTextX(label, radius * 2 - 4, fs2),
          y: radius * 2 - 6,
          fontSize: fs2,
          fontWeight: "600",
          fontFamily: DIAGRAM.fontFamily,
          fill: DIAGRAM.stateFinalStroke,
          listening: false
        })
      );
    }
    return node;
  }
  if (isInitial) {
    const w = radius * 2 - 4;
    const h = radius * 2 - 4;
    addCardChrome(app, node, {
      width: w,
      height: h,
      cornerRadius: h / 2,
      fill: DIAGRAM.stateInitialFill,
      stroke: DIAGRAM.stateInitialStroke,
      strokeWidth: DIAGRAM.stroke.nodeEmphasis,
      shadow: DIAGRAM.shadowElevated,
      sheen: false
    });
    node.add(
      app.circle({
        x: 14,
        y: h / 2,
        radius: 6,
        fill: DIAGRAM.stateInitialStroke,
        stroke: null,
        listening: false
      })
    );
  } else {
    const w = radius * 2 - 4;
    addCardChrome(app, node, {
      width: w,
      height: w,
      cornerRadius: DIAGRAM.radii.lg,
      fill: DIAGRAM.stateFill,
      stroke: DIAGRAM.stateStroke,
      strokeWidth: DIAGRAM.stroke.nodeEmphasis,
      shadow: DIAGRAM.shadowSoft,
      accentColor: DIAGRAM.stateStroke
    });
  }
  const fs = DIAGRAM.fontSize.md;
  const boxW = radius * 2 - 4;
  node.add(
    app.text({
      text: label,
      x: isInitial ? 26 : centerTextX(label, boxW, fs),
      y: radius - fs / 2 - 3,
      fontSize: fs,
      fontWeight: "600",
      fontFamily: DIAGRAM.fontFamily,
      fill: DIAGRAM.nodeText,
      listening: false
    })
  );
  return node;
}
function createCanEcuNode(app, label, address, color, strokeWidth = DIAGRAM.stroke.node) {
  const width = 88;
  const height = 56;
  const ecuGroup = app.group();
  addCardChrome(app, ecuGroup, {
    width,
    height,
    cornerRadius: DIAGRAM.radii.md,
    fill: DIAGRAM.nodeFill,
    stroke: color,
    strokeWidth,
    shadow: DIAGRAM.shadowElevated,
    accentColor: color
  });
  ecuGroup.add(
    app.text({
      text: label,
      x: DIAGRAM.spacing.sm,
      y: 12,
      fontSize: DIAGRAM.fontSize.md,
      fill: DIAGRAM.nodeText,
      fontWeight: "bold",
      fontFamily: DIAGRAM.fontFamily,
      listening: false
    })
  );
  if (address) {
    ecuGroup.add(
      app.text({
        text: address,
        x: DIAGRAM.spacing.sm,
        y: 30,
        fontSize: DIAGRAM.fontSize.xs,
        fontFamily: DIAGRAM.fontMono,
        fill: DIAGRAM.edgeLabel,
        listening: false
      })
    );
  }
  ecuGroup.add(
    app.circle({
      x: 44,
      y: 0,
      radius: 3,
      fill: color,
      stroke: DIAGRAM.surface,
      strokeWidth: 1,
      listening: false
    })
  );
  ecuGroup.add(
    app.line({
      x: 44,
      y: 0,
      x2: 0,
      y2: -14,
      stroke: color,
      strokeWidth: 2.5,
      lineCap: "round",
      listening: false
    })
  );
  return ecuGroup;
}
function createEdgeLabel(app, text, x, y, accentStroke = DIAGRAM.edge) {
  const fontSize = DIAGRAM.fontSize.sm;
  const tw = measureTextWidth(text, fontSize, "600");
  const padX = 8;
  const padY = 4;
  const pw = tw + padX * 2;
  const ph = fontSize + padY * 2;
  const g = app.group({ listening: false });
  g.add(
    app.roundedRect({
      x: x - pw / 2,
      y: y - ph / 2,
      width: pw,
      height: ph,
      cornerRadius: DIAGRAM.radii.sm,
      fill: DIAGRAM.labelPillFill,
      stroke: accentStroke,
      strokeWidth: DIAGRAM.stroke.label,
      shadow: DIAGRAM.shadowSoft,
      listening: false
    })
  );
  g.add(
    app.text({
      text,
      x: x - tw / 2,
      y: y - fontSize / 2 - 1,
      fontSize,
      fontWeight: "600",
      fontFamily: DIAGRAM.fontFamily,
      fill: DIAGRAM.edgeLabel,
      listening: false
    })
  );
  return g;
}

// src/diagram/helpers.ts
function str4(props, key, fallback = "") {
  const v = props[key];
  return typeof v === "string" ? v : fallback;
}
function getDiagramState(node) {
  const state = node.metadata?.diagramState;
  if (state && typeof state === "object")
    return state;
  return {};
}
function setDiagramState(node, patch) {
  node.metadata.diagramState = { ...getDiagramState(node), ...patch };
}
function createDiagramGroup(app, type, props, extra = {}) {
  const group = app.group({
    ...props,
    metadata: {
      diagramType: type,
      diagramState: { ...props }
    },
    ...extra
  });
  setDiagramState(group, { ...props });
  return group;
}
function diagramToJSON(node) {
  const type = str4(node.metadata, "diagramType", "diagram");
  const state = getDiagramState(node);
  return {
    type,
    props: {
      x: node.x,
      y: node.y,
      ...state
    }
  };
}
function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = s * 1664525 + 1013904223 >>> 0;
    return s / 4294967295;
  };
}
function readCanvasSize(options, fallbackW = 800, fallbackH = 500) {
  return {
    width: typeof options.width === "number" ? options.width : fallbackW,
    height: typeof options.height === "number" ? options.height : fallbackH
  };
}
function resolveGridLayout(nodeCount, canvasW, canvasH, nodeW = 130, nodeH = 80, minPadding = 16) {
  const tight = canvasW < 520 || canvasH < 360;
  const maxCols = tight ? Math.max(1, Math.floor((canvasW - minPadding * 2) / (nodeW * 0.9))) : Math.max(2, Math.ceil(Math.sqrt(nodeCount * (canvasW / Math.max(canvasH, 1)))));
  const cols = Math.max(1, Math.min(maxCols, nodeCount));
  const rows = Math.ceil(nodeCount / cols);
  const paddingX = Math.max(minPadding, Math.round(canvasW * 0.04));
  const paddingY = Math.max(minPadding, Math.round(canvasH * 0.05));
  const availW = Math.max(nodeW, canvasW - paddingX * 2);
  const availH = Math.max(nodeH, canvasH - paddingY * 2);
  const cellW = cols <= 1 ? nodeW : Math.max(nodeW * 0.72, (availW - nodeW) / Math.max(cols - 1, 1));
  const cellH = rows <= 1 ? nodeH : Math.max(nodeH * 0.72, (availH - nodeH) / Math.max(rows - 1, 1));
  return { cols, cellW, cellH, paddingX, paddingY };
}
function autoLayoutNodesResponsive(nodes, canvasW, canvasH, nodeW = 130, nodeH = 80) {
  const needs = nodes.some((n) => n.x === void 0 || n.y === void 0);
  if (!needs)
    return;
  const { cols, cellW, cellH, paddingX, paddingY } = resolveGridLayout(
    nodes.length,
    canvasW,
    canvasH,
    nodeW,
    nodeH
  );
  nodes.forEach((n, i) => {
    if (n.x === void 0)
      n.x = paddingX + i % cols * cellW;
    if (n.y === void 0)
      n.y = paddingY + Math.floor(i / cols) * cellH;
  });
}
function diagramContentBounds(group) {
  const nodes = [];
  const walk2 = (parent) => {
    for (const child of parent.children) {
      if (child.metadata?.diagramId || child.metadata?.orgNode || child.metadata?.symbolType || child.metadata?.pipelineStatus !== void 0) {
        nodes.push(child);
      }
      if ("children" in child && child.children?.length) {
        walk2(child);
      }
    }
  };
  walk2(group);
  const sources = nodes.length > 0 ? nodes : group.children.filter((c) => c.zIndex >= 0);
  if (sources.length === 0)
    return group.getBounds();
  const posInRoot = (node) => {
    let x = 0;
    let y = 0;
    let cur = node;
    while (cur && cur !== group) {
      x += cur.x;
      y += cur.y;
      cur = cur.parent;
    }
    return { x, y };
  };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const child of sources) {
    const b = child.getBounds();
    const p = posInRoot(child);
    minX = Math.min(minX, p.x + b.x);
    minY = Math.min(minY, p.y + b.y);
    maxX = Math.max(maxX, p.x + b.x + b.width);
    maxY = Math.max(maxY, p.y + b.y + b.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
function fitDiagramToBounds(group, canvasW, canvasH, padding = 20, options = {}) {
  const allowScaleUp = options.allowScaleUp ?? true;
  const maxScaleUp = options.maxScaleUp ?? 2.1;
  const b = diagramContentBounds(group);
  const contentW = Math.max(b.width, 1);
  const contentH = Math.max(b.height, 1);
  const availW = canvasW - padding * 2;
  const availH = canvasH - padding * 2;
  let scale = Math.min(availW / contentW, availH / contentH);
  if (scale > 1 && allowScaleUp)
    scale = Math.min(scale, maxScaleUp);
  else if (scale > 1)
    scale = 1;
  const offsetX = padding + (availW - contentW * scale) / 2 - b.x * scale;
  const offsetY = padding + (availH - contentH * scale) / 2 - b.y * scale;
  group.scaleX = scale;
  group.scaleY = scale;
  group.x = offsetX;
  group.y = offsetY;
  group.markDirty();
  return { scale, offsetX, offsetY };
}
function createNodeBox(app, label, width, height, style = {}) {
  return createLabeledBox(app, label, width, height, style);
}
function normalizeDiagramData(data) {
  return {
    nodes: data.nodes ?? [],
    edges: data.edges ?? []
  };
}

// src/io/json.ts
var shapeFactories = {
  rect: (p, app) => app.rect(p),
  circle: (p, app) => app.circle(p),
  ellipse: (p, app) => app.ellipse(p),
  line: (p, app) => app.line(p),
  arc: (p, app) => app.arc(p),
  polygon: (p, app) => app.polygon(p),
  polyline: (p, app) => app.polyline(p),
  path: (p, app) => app.path(p),
  star: (p, app) => app.star(p),
  roundedRect: (p, app) => app.roundedRect(p),
  text: (p, app) => app.text(p),
  image: (p, app) => app.image(p),
  sprite: (p, app) => app.sprite(p),
  group: (p, app) => app.group(p),
  layer: (p, app) => app.layer(p)
};
var customFactories = {};
function registerJSONType(type, factory) {
  customFactories[type] = factory;
}
function fromJSON(json, app) {
  const props = json.props ?? {};
  if (json.id)
    props.id = json.id;
  let node;
  const customFactory = customFactories[json.type];
  if (customFactory) {
    node = customFactory(props, app);
  } else if (shapeFactories[json.type]) {
    node = shapeFactories[json.type](props, app);
  } else {
    const resolved = resolveJSONType(json.type, props, app);
    if (resolved) {
      node = resolved;
    } else if (json.type === "dashboard" || json.children) {
      node = app.group(props);
    } else {
      node = app.group(props);
    }
  }
  if (json.children && "add" in node) {
    for (const child of json.children) {
      node.add(fromJSON(child, app));
    }
  }
  return node;
}
function toJSON(node) {
  if (node.metadata?.componentType) {
    return componentToJSON(node);
  }
  if (node.metadata?.widgetType) {
    return dashboardToJSON(node);
  }
  if (node.metadata?.autoType) {
    return automotiveToJSON(node);
  }
  if (node.metadata?.diagramType) {
    return diagramToJSON(node);
  }
  return node.toJSON();
}

// src/io/schema.ts
var SHAPE_TYPES = /* @__PURE__ */ new Set([
  "rect",
  "circle",
  "ellipse",
  "line",
  "arc",
  "polygon",
  "polyline",
  "path",
  "star",
  "roundedRect",
  "text",
  "image",
  "sprite",
  "group",
  "layer"
]);
function validateSceneJSON(json) {
  const errors = [];
  function visit(node, path) {
    if (!node || typeof node !== "object") {
      errors.push(`${path}: expected object`);
      return;
    }
    const scene = node;
    if (typeof scene.type !== "string" || scene.type.length === 0) {
      errors.push(`${path}.type: required string`);
    }
    if (scene.props !== void 0 && (typeof scene.props !== "object" || scene.props === null)) {
      errors.push(`${path}.props: must be object when present`);
    }
    if (scene.children !== void 0) {
      if (!Array.isArray(scene.children)) {
        errors.push(`${path}.children: must be array when present`);
      } else {
        scene.children.forEach((child, i) => visit(child, `${path}.children[${i}]`));
      }
    }
  }
  visit(json, "root");
  if (errors.length === 0 && json && typeof json === "object") {
    const root = json;
    if (!SHAPE_TYPES.has(root.type) && !root.type.match(/^[a-zA-Z][a-zA-Z0-9]*$/)) {
      errors.push("root.type: invalid identifier");
    }
  }
  return { valid: errors.length === 0, errors };
}

// src/io/pdf.ts
function encoder() {
  return new TextEncoder();
}
function mergeChunks(chunks) {
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const c of chunks) {
    out.set(c, o);
    o += c.length;
  }
  return out;
}
function buildPdfFromJpegPages(pages) {
  if (pages.length === 0) {
    return encoder().encode("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
  }
  const enc = encoder();
  const parts = [];
  let pos = 0;
  const offsets = [0];
  const append = (text) => {
    const b = enc.encode(text);
    parts.push(b);
    pos += b.length;
  };
  const appendBytes = (bytes) => {
    parts.push(bytes);
    pos += bytes.length;
  };
  const startObj = (id2, header) => {
    while (offsets.length <= id2)
      offsets.push(0);
    offsets[id2] = pos;
    append(`${id2} 0 obj
${header}`);
  };
  append("%PDF-1.4\n");
  const n = pages.length;
  const imgIds = [];
  const contentIds = [];
  const pageIds = [];
  let id = 1;
  for (let i = 0; i < n; i++) {
    imgIds.push(id++);
    contentIds.push(id++);
    pageIds.push(id++);
  }
  const pagesTreeId = id++;
  const catalogId = id++;
  for (let i = 0; i < n; i++) {
    const page = pages[i];
    const imgId = imgIds[i];
    startObj(
      imgId,
      `<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpeg.length} >>
stream
`
    );
    appendBytes(page.jpeg);
    append("\nendstream\nendobj\n");
    const imgName = `Im${imgId}`;
    const ops = `q ${page.width} 0 0 ${page.height} 0 0 cm /${imgName} Do Q`;
    const opsBytes = enc.encode(ops);
    const contentId = contentIds[i];
    startObj(contentId, `<< /Length ${opsBytes.length} >>
stream
`);
    appendBytes(opsBytes);
    append("\nendstream\nendobj\n");
    const pageId = pageIds[i];
    startObj(
      pageId,
      `<< /Type /Page /Parent ${pagesTreeId} 0 R /MediaBox [0 0 ${page.width} ${page.height}] /Contents ${contentId} 0 R /Resources << /XObject << /${imgName} ${imgId} 0 R >> >> >>
endobj
`
    );
  }
  const kids = pageIds.map((p) => `${p} 0 R`).join(" ");
  startObj(pagesTreeId, `<< /Type /Pages /Kids [${kids}] /Count ${n} >>
endobj
`);
  startObj(catalogId, `<< /Type /Catalog /Pages ${pagesTreeId} 0 R >>
endobj
`);
  const xrefPos = pos;
  append(`xref
0 ${catalogId + 1}
`);
  append("0000000000 65535 f \n");
  for (let i = 1; i <= catalogId; i++) {
    append(`${String(offsets[i] ?? 0).padStart(10, "0")} 00000 n 
`);
  }
  append(`trailer
<< /Size ${catalogId + 1} /Root ${catalogId} 0 R >>
`);
  append(`startxref
${xrefPos}
%%EOF
`);
  return mergeChunks(parts);
}
function pdfToDataUrl(pdf) {
  let binary = "";
  for (let i = 0; i < pdf.length; i++) {
    binary += String.fromCharCode(pdf[i]);
  }
  return `data:application/pdf;base64,${btoa(binary)}`;
}
function dataUrlToBytes(dataUrl) {
  const comma = dataUrl.indexOf(",");
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++)
    bytes[i] = binary.charCodeAt(i);
  return bytes;
}
function createMinimalJpegStub(width, height) {
  const header = encoder().encode(
    `\xFF\xD8\xFF\xE0\0JFIF\0\0\0\0\0\0`
  );
  const comment = encoder().encode(`LIGHTDRAW ${width}x${height}`);
  const eoi = new Uint8Array([255, 217]);
  const out = new Uint8Array(header.length + comment.length + eoi.length);
  out.set(header, 0);
  out.set(comment, header.length);
  out.set(eoi, header.length + comment.length);
  return out;
}

// src/renderers/SVGRenderer.ts
var SVGRenderer = class extends Renderer {
  constructor() {
    super(...arguments);
    this.nodeElements = /* @__PURE__ */ new Map();
    this.shapeElements = /* @__PURE__ */ new Map();
    this.defCounter = 0;
    this.seenIds = /* @__PURE__ */ new Set();
  }
  init(container, options) {
    this.width = options.width;
    this.height = options.height;
    this.background = options.background;
    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg.setAttribute("width", String(this.width));
    this.svg.setAttribute("height", String(this.height));
    this.svg.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
    this.svg.style.display = "block";
    this.defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    this.svg.appendChild(this.defs);
    this.sceneRoot = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this.sceneRoot.setAttribute("data-lightdraw-scene", "true");
    this.svg.appendChild(this.sceneRoot);
    if (this.background && this.background !== "transparent") {
      const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bg.setAttribute("data-lightdraw-bg", "true");
      bg.setAttribute("width", "100%");
      bg.setAttribute("height", "100%");
      bg.setAttribute("fill", this.background);
      this.svg.insertBefore(bg, this.sceneRoot);
    }
    container.appendChild(this.svg);
  }
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.svg.setAttribute("width", String(width));
    this.svg.setAttribute("height", String(height));
    this.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    this.forceFullRedraw();
  }
  getElement() {
    return this.svg;
  }
  render(root, cameraMatrix) {
    if (cameraMatrix) {
      this.sceneRoot.setAttribute("transform", cameraMatrix.toCSS());
    } else {
      this.sceneRoot.removeAttribute("transform");
    }
    this.seenIds.clear();
    this.syncGroup(root, this.sceneRoot);
    this.pruneOrphans(this.sceneRoot);
    this.clearDirty();
  }
  toDataURL(type = "image/svg+xml") {
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(this.svg);
    if (type === "image/svg+xml") {
      return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgStr)));
    }
    return svgStr;
  }
  destroy() {
    this.svg.remove();
    this.nodeElements.clear();
    this.shapeElements.clear();
  }
  syncGroup(group, parent) {
    group.sortChildren();
    for (const child of group.children) {
      if (!child.visible)
        continue;
      this.syncNode(child, parent);
    }
  }
  syncNode(node, parent) {
    let g = this.nodeElements.get(node.id);
    if (!g) {
      g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("id", node.id);
      parent.appendChild(g);
      this.nodeElements.set(node.id, g);
    } else if (g.parentNode !== parent) {
      parent.appendChild(g);
    }
    g.setAttribute("opacity", String(node.opacity));
    g.setAttribute(
      "transform",
      `translate(${node.x},${node.y}) rotate(${node.rotation}) scale(${node.scaleX},${node.scaleY})`
    );
    if (node.shadow) {
      const filterId = this.registerShadow(node.shadow, node.id);
      g.setAttribute("filter", `url(#${filterId})`);
    } else {
      g.removeAttribute("filter");
    }
    if (node.clip) {
      const clipId = this.registerClip(node, `${node.id}-clip`);
      g.setAttribute("clip-path", `url(#${clipId})`);
    } else {
      g.removeAttribute("clip-path");
    }
    if (node.mask) {
      const maskId = this.registerClip(node.mask, `${node.id}-mask`);
      g.setAttribute("mask", `url(#${maskId})`);
    } else {
      g.removeAttribute("mask");
    }
    node.draw(this);
    this.syncShapeElement(node, g);
    this.seenIds.add(node.id);
    if ("children" in node) {
      this.syncGroup(node, g);
    }
  }
  syncShapeElement(node, parent) {
    const el = this.shapeElements.get(node.id);
    if (!el) {
      const created = this.createShapeElement(node);
      if (created) {
        parent.appendChild(created);
        this.shapeElements.set(node.id, created);
      }
      return;
    }
    this.updateShapeElement(node, el);
    if (el.parentNode !== parent)
      parent.appendChild(el);
  }
  pruneOrphans(parent) {
    const toRemove = [];
    const childNodes = Array.from(parent.childNodes);
    for (const child of childNodes) {
      if (child.nodeName === "g" && child.getAttribute("id") && !this.seenIds.has(child.getAttribute("id"))) {
        toRemove.push(child);
      }
    }
    for (const el of toRemove) {
      const id = el.getAttribute("id");
      if (id) {
        this.nodeElements.delete(id);
        this.shapeElements.delete(id);
      }
      el.remove();
    }
    for (const child of Array.from(parent.childNodes)) {
      if (child.nodeName === "g" && child.getAttribute("id") && this.seenIds.has(child.getAttribute("id"))) {
        this.pruneOrphans(child);
      }
    }
  }
  registerShadow(shadow, nodeId) {
    const id = `shadow-${nodeId}-${this.defCounter++}`;
    this.defs.appendChild(createSvgShadowFilter(document, id, shadow));
    return id;
  }
  registerClip(shapeNode, prefix) {
    const id = `${prefix}-${this.defCounter++}`;
    const ns = "http://www.w3.org/2000/svg";
    const clip = document.createElementNS(ns, "clipPath");
    clip.setAttribute("id", id);
    const use2 = this.createShapeElement(shapeNode);
    if (use2) {
      use2.removeAttribute("fill");
      use2.removeAttribute("stroke");
      clip.appendChild(use2);
    }
    this.defs.appendChild(clip);
    return id;
  }
  registerGradient(fill, nodeId) {
    const id = `grad-${nodeId}-${this.defCounter++}`;
    this.defs.appendChild(createSvgGradient(document, id, fill));
    return id;
  }
  applyStyle(node, elem) {
    if (node.fill) {
      if (typeof node.fill === "string") {
        elem.setAttribute("fill", node.fill);
      } else if (isGradient(node.fill)) {
        const gid = this.registerGradient(node.fill, node.id);
        elem.setAttribute("fill", `url(#${gid})`);
      } else {
        elem.setAttribute("fill", "none");
      }
    } else {
      elem.setAttribute("fill", "none");
    }
    if (node.stroke) {
      if (typeof node.stroke === "string") {
        elem.setAttribute("stroke", node.stroke);
      } else if (isGradient(node.stroke)) {
        const gid = this.registerGradient(node.stroke, `${node.id}-s`);
        elem.setAttribute("stroke", `url(#${gid})`);
      }
      elem.setAttribute("stroke-width", String(node.strokeWidth));
    } else {
      elem.removeAttribute("stroke");
    }
    if (node.dash.length > 0) {
      elem.setAttribute("stroke-dasharray", node.dash.join(" "));
    } else {
      elem.removeAttribute("stroke-dasharray");
    }
    if (node.dashOffset !== 0) {
      elem.setAttribute("stroke-dashoffset", String(node.dashOffset));
    } else {
      elem.removeAttribute("stroke-dashoffset");
    }
  }
  createShapeElement(node) {
    const ns = "http://www.w3.org/2000/svg";
    let el = null;
    if (node instanceof Rect) {
      el = document.createElementNS(ns, "rect");
      el.setAttribute("width", String(node.width));
      el.setAttribute("height", String(node.height));
      if (node.cornerRadius)
        el.setAttribute("rx", String(node.cornerRadius));
      this.applyStyle(node, el);
    } else if (node instanceof Circle) {
      el = document.createElementNS(ns, "circle");
      el.setAttribute("cx", String(node.radius));
      el.setAttribute("cy", String(node.radius));
      el.setAttribute("r", String(node.radius));
      this.applyStyle(node, el);
    } else if (node instanceof Ellipse) {
      el = document.createElementNS(ns, "ellipse");
      el.setAttribute("cx", String(node.radiusX));
      el.setAttribute("cy", String(node.radiusY));
      el.setAttribute("rx", String(node.radiusX));
      el.setAttribute("ry", String(node.radiusY));
      this.applyStyle(node, el);
    } else if (node instanceof Line) {
      el = document.createElementNS(ns, "line");
      el.setAttribute("x1", "0");
      el.setAttribute("y1", "0");
      el.setAttribute("x2", String(node.x2));
      el.setAttribute("y2", String(node.y2));
      this.applyStyle(node, el);
    } else if (node instanceof TextNode) {
      el = document.createElementNS(ns, "text");
      el.textContent = node.text;
      el.setAttribute("font-size", String(node.fontSize));
      el.setAttribute("font-family", node.fontFamily);
      if (node.fill && typeof node.fill === "string")
        el.setAttribute("fill", node.fill);
    } else if (node instanceof Path) {
      el = document.createElementNS(ns, "path");
      el.setAttribute("d", node.d);
      this.applyStyle(node, el);
    } else if (node instanceof Polygon) {
      el = document.createElementNS(ns, "polygon");
      el.setAttribute("points", this.pointsAttr(node.points));
      this.applyStyle(node, el);
    } else if (node instanceof Polyline) {
      el = document.createElementNS(ns, "polyline");
      el.setAttribute("points", this.pointsAttr(node.points));
      this.applyStyle(node, el);
    } else if (node instanceof Star) {
      el = document.createElementNS(ns, "polygon");
      el.setAttribute("points", this.starPoints(node));
      this.applyStyle(node, el);
    } else if (node instanceof Arc) {
      el = document.createElementNS(ns, "path");
      el.setAttribute(
        "d",
        arcSectorPath(
          node.radius,
          node.radius,
          node.radius,
          node.startAngle,
          node.endAngle,
          node.innerRadius,
          node.counterClockwise
        )
      );
      this.applyStyle(node, el);
    } else if (node instanceof ImageNode) {
      el = document.createElementNS(ns, "image");
      el.setAttribute("href", node.src);
      el.setAttribute("width", String(node.width));
      el.setAttribute("height", String(node.height));
    }
    return el;
  }
  updateShapeElement(node, el) {
    if (node instanceof Rect) {
      el.setAttribute("width", String(node.width));
      el.setAttribute("height", String(node.height));
      if (node.cornerRadius)
        el.setAttribute("rx", String(node.cornerRadius));
      this.applyStyle(node, el);
    } else if (node instanceof Circle) {
      el.setAttribute("cx", String(node.radius));
      el.setAttribute("cy", String(node.radius));
      el.setAttribute("r", String(node.radius));
      this.applyStyle(node, el);
    } else if (node instanceof TextNode) {
      el.textContent = node.text;
      el.setAttribute("font-size", String(node.fontSize));
    } else if (node instanceof Path) {
      el.setAttribute("d", node.d);
      this.applyStyle(node, el);
    } else if (node instanceof Arc) {
      el.setAttribute(
        "d",
        arcSectorPath(
          node.radius,
          node.radius,
          node.radius,
          node.startAngle,
          node.endAngle,
          node.innerRadius,
          node.counterClockwise
        )
      );
      this.applyStyle(node, el);
    } else {
      this.applyStyle(node, el);
    }
  }
  pointsAttr(points) {
    const pts = [];
    for (let i = 0; i < points.length; i += 2) {
      pts.push(`${points[i]},${points[i + 1]}`);
    }
    return pts.join(" ");
  }
  starPoints(node) {
    const pts = [];
    for (let i = 0; i < node.numPoints * 2; i++) {
      const r = i % 2 === 0 ? node.outerRadius : node.innerRadius;
      const angle = i * Math.PI / node.numPoints - Math.PI / 2;
      pts.push(`${node.outerRadius + r * Math.cos(angle)},${node.outerRadius + r * Math.sin(angle)}`);
    }
    return pts.join(" ");
  }
  drawGroup(_group) {
  }
  drawRect(_node) {
  }
  drawCircle(_node) {
  }
  drawEllipse(_node) {
  }
  drawLine(_node) {
  }
  drawArc(_node) {
  }
  drawPolygon(_node) {
  }
  drawPolyline(_node) {
  }
  drawPath(_node) {
  }
  drawStar(_node) {
  }
  drawText(_node) {
  }
  drawImage(_node) {
  }
};

// src/io/snapshot.ts
function resolveExportBounds(app, region) {
  if (!region) {
    return { x: 0, y: 0, width: app.getSize().width, height: app.getSize().height };
  }
  if (isNode(region)) {
    return getWorldBounds(region);
  }
  return region;
}
function isNode(value) {
  return typeof value.getBounds === "function";
}
function snapshotToCanvas(app, options = { format: "png" }) {
  const bounds = resolveExportBounds(app, options.region);
  const pixelRatio = options.pixelRatio ?? app.getPixelRatio();
  const width = Math.max(1, Math.ceil(bounds.width));
  const height = Math.max(1, Math.ceil(bounds.height));
  const background = options.background ?? app.getBackground();
  if (app.getRenderer() instanceof CanvasRenderer && !options.region) {
    const src = app.getRenderer().getElement();
    const out = document.createElement("canvas");
    out.width = width * pixelRatio;
    out.height = height * pixelRatio;
    const ctx = out.getContext("2d");
    if (ctx) {
      ctx.drawImage(src, 0, 0);
    }
    return { canvas: out, width, height, pixelRatio };
  }
  if (app.getRenderer() instanceof CanvasRenderer && options.region) {
    const src = app.getRenderer().getElement();
    const out = document.createElement("canvas");
    out.width = width * pixelRatio;
    out.height = height * pixelRatio;
    const ctx = out.getContext("2d");
    if (ctx) {
      const sx = bounds.x * pixelRatio;
      const sy = bounds.y * pixelRatio;
      const sw = width * pixelRatio;
      const sh = height * pixelRatio;
      ctx.drawImage(src, sx, sy, sw, sh, 0, 0, sw, sh);
    }
    return { canvas: out, width, height, pixelRatio };
  }
  const container = document.createElement("div");
  const renderer = new CanvasRenderer();
  renderer.init(container, {
    width,
    height,
    pixelRatio,
    background,
    highContrast: false
  });
  const matrix = buildExportMatrix(app, bounds, width, height);
  renderer.render(app.stage, matrix);
  const canvas = renderer.getElement();
  renderer.destroy();
  return { canvas, width, height, pixelRatio };
}
function buildExportMatrix(app, bounds, width, height) {
  const base = app.camera.getMatrix();
  const m = new Matrix2D();
  m.translate(-bounds.x, -bounds.y);
  const combined = new Matrix2D();
  combined.multiply(base);
  combined.multiply(m);
  if (bounds.width !== width || bounds.height !== height) {
    const sx = width / bounds.width;
    const sy = height / bounds.height;
    const scale = new Matrix2D();
    scale.scale(sx, sy);
    combined.multiply(scale);
  }
  return combined;
}
function exportSvgDocument(app, options = { format: "svg" }) {
  const bounds = resolveExportBounds(app, options.region);
  const background = options.background ?? app.getBackground();
  if (app.getRenderer() instanceof SVGRenderer && !options.region) {
    return wrapSvgDocument(serializeSvgElement(app.getRenderer().getElement()), bounds.width, bounds.height);
  }
  const container = document.createElement("div");
  const renderer = new SVGRenderer();
  renderer.init(container, {
    width: bounds.width,
    height: bounds.height,
    pixelRatio: 1,
    background,
    highContrast: false
  });
  const matrix = buildExportMatrix(app, bounds, bounds.width, bounds.height);
  renderer.render(app.stage, matrix);
  const xml = wrapSvgDocument(serializeSvgElement(renderer.getElement()), bounds.width, bounds.height);
  renderer.destroy();
  return xml;
}
function serializeSvgElement(svg) {
  return new XMLSerializer().serializeToString(svg);
}
function wrapSvgDocument(inner, width, height) {
  const hasDeclaration = inner.trimStart().startsWith("<?xml");
  const doc = hasDeclaration ? inner : `<?xml version="1.0" encoding="UTF-8"?>
${inner}`;
  if (!doc.includes("xmlns=")) {
    return doc.replace(
      "<svg",
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"`
    );
  }
  return doc;
}

// src/io/exportTypes.ts
var EXPORT_MIME = {
  png: "image/png",
  jpeg: "image/jpeg",
  svg: "image/svg+xml",
  pdf: "application/pdf",
  json: "application/json",
  html: "text/html"
};

// src/io/export.ts
var LIGHTDRAW_CDN = "https://cdn.jsdelivr.net/npm/lightdraw/dist/lightdraw.min.js";
var LIGHTDRAW_CSS_CDN = "https://cdn.jsdelivr.net/npm/lightdraw/dist/lightdraw.min.css";
function exportApp(app, options) {
  const { format } = options;
  switch (format) {
    case "json":
      return exportJson(app, options);
    case "png":
      return exportRaster(app, options, "image/png");
    case "jpeg":
      return exportRaster(app, options, "image/jpeg", options.quality ?? 0.92);
    case "svg":
      return exportSvg(app, options);
    case "pdf":
      return exportPdf(app, options);
    case "html":
      return exportHtml(app, options);
    default:
      return exportJson(app, options);
  }
}
function exportScene(app, format, options = {}) {
  const result = exportApp(app, { ...options, format });
  return result.data;
}
function exportJson(app, options) {
  const json = app.exportJSON();
  if (options.validate) {
    const validation = validateSceneJSON(json);
    if (!validation.valid) {
      throw new Error(`JSON validation failed: ${validation.errors.join("; ")}`);
    }
  }
  return {
    format: "json",
    data: json,
    mimeType: EXPORT_MIME.json
  };
}
function exportRaster(app, options, mime, quality) {
  app.render();
  const snap = snapshotToCanvas(app, options);
  const dataUrl = mime === "image/png" ? snap.canvas.toDataURL("image/png") : snap.canvas.toDataURL("image/jpeg", quality);
  return {
    format: mime === "image/png" ? "png" : "jpeg",
    data: dataUrl,
    mimeType: mime,
    width: snap.canvas.width,
    height: snap.canvas.height
  };
}
function exportSvg(app, options) {
  app.render();
  const xml = exportSvgDocument(app, options);
  const bounds = options.region ? void 0 : { width: app.getSize().width, height: app.getSize().height };
  return {
    format: "svg",
    data: xml,
    mimeType: EXPORT_MIME.svg,
    width: bounds?.width,
    height: bounds?.height
  };
}
function exportPdf(app, options) {
  app.render();
  const pageCount = Math.max(1, options.pages ?? 1);
  const snap = snapshotToCanvas(app, options);
  const jpegUrl = snap.canvas.toDataURL("image/jpeg", options.quality ?? 0.92);
  let jpegBytes = dataUrlToBytes(jpegUrl);
  if (jpegBytes.length < 4 || jpegBytes[0] !== 255) {
    jpegBytes = createMinimalJpegStub(
      snap.width * snap.pixelRatio,
      snap.height * snap.pixelRatio
    );
  }
  const pageW = snap.width * snap.pixelRatio;
  const pageH = snap.height * snap.pixelRatio;
  const pages = Array.from({ length: pageCount }, () => ({
    jpeg: jpegBytes,
    width: pageW,
    height: pageH
  }));
  const pdf = buildPdfFromJpegPages(pages);
  return {
    format: "pdf",
    data: pdfToDataUrl(pdf),
    mimeType: EXPORT_MIME.pdf,
    width: pageW,
    height: pageH * pageCount
  };
}
function exportHtml(app, options) {
  const json = toJSON(app.stage);
  if (options.validate) {
    const validation = validateSceneJSON(json);
    if (!validation.valid) {
      throw new Error(`JSON validation failed: ${validation.errors.join("; ")}`);
    }
  }
  const { width, height } = app.getSize();
  const bg = options.background ?? app.getBackground();
  const sceneJson = JSON.stringify(json).replace(/</g, "\\u003c");
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LightDraw Export</title>
  <link rel="stylesheet" href="${LIGHTDRAW_CSS_CDN}">
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; }
    header { padding: 1rem; border-bottom: 1px solid #334155; }
    #app { margin: 1rem auto; border: 1px solid #334155; border-radius: 8px; overflow: hidden; }
  </style>
</head>
<body>
  <header><h1>LightDraw Export</h1><p>Offline scene \u2014 requires network for LightDraw script on first load.</p></header>
  <div id="app"></div>
  <script type="application/json" id="scene">${sceneJson}<\/script>
  <script src="${LIGHTDRAW_CDN}"><\/script>
  <script>
    (function () {
      var scene = JSON.parse(document.getElementById('scene').textContent);
      var app = LightDraw.createApp('#app', {
        width: ${width},
        height: ${height},
        background: ${JSON.stringify(bg)},
        renderer: 'html',
        autoResize: false,
      });
      app.loadJSON(scene);
      app.render();
    })();
  <\/script>
</body>
</html>`;
  return {
    format: "html",
    data: html,
    mimeType: EXPORT_MIME.html,
    width,
    height
  };
}
function downloadExport(result, filename) {
  const ext = result.format;
  const name = filename ?? `lightdraw-export.${ext}`;
  let blob;
  if (result.data instanceof Uint8Array) {
    blob = new Blob([new Uint8Array(result.data)], { type: result.mimeType });
  } else if (typeof result.data === "string") {
    if (result.data.startsWith("data:")) {
      const bytes = dataUrlToBytes(result.data);
      blob = new Blob([new Uint8Array(bytes)], { type: result.mimeType });
    } else {
      blob = new Blob([result.data], { type: result.mimeType });
    }
  } else {
    blob = new Blob([JSON.stringify(result.data, null, 2)], { type: result.mimeType });
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
function scenesEqual(a, b) {
  if (a.type !== b.type)
    return false;
  const propsA = a.props ?? {};
  const propsB = b.props ?? {};
  const keysA = Object.keys(propsA).filter((k) => !["id", "metadata"].includes(k));
  for (const k of keysA) {
    if (JSON.stringify(propsA[k]) !== JSON.stringify(propsB[k]))
      return false;
  }
  const chA = a.children ?? [];
  const chB = b.children ?? [];
  if (chA.length !== chB.length)
    return false;
  for (let i = 0; i < chA.length; i++) {
    if (!scenesEqual(chA[i], chB[i]))
      return false;
  }
  return true;
}

// src/plugins/index.ts
var installedPlugins = /* @__PURE__ */ new Set();
function createPluginContext() {
  return {
    registerJSONType,
    registerJSONResolver,
    registerEasing
  };
}
function installPlugin(plugin, LightDraw2) {
  if (installedPlugins.has(plugin.name))
    return;
  installedPlugins.add(plugin.name);
  plugin.install(LightDraw2);
}
function getInstalledPlugins() {
  return Array.from(installedPlugins);
}

// src/performance/SpatialIndex.ts
var SpatialIndex = class {
  constructor(cellSize = 64) {
    this.grid = /* @__PURE__ */ new Map();
    this.entries = [];
    this.stale = true;
    this.cellSize = cellSize;
  }
  markStale() {
    this.stale = true;
  }
  rebuild(root) {
    this.grid.clear();
    this.entries = collectHitTargets(root, []);
    for (const node of this.entries) {
      this.insert(node);
    }
    this.stale = false;
  }
  ensureFresh(root) {
    if (this.stale)
      this.rebuild(root);
  }
  insert(node) {
    const b = getWorldBounds(node, 0);
    for (const key of this.cellsForBounds(b)) {
      const bucket = this.grid.get(key);
      if (bucket)
        bucket.push(node);
      else
        this.grid.set(key, [node]);
    }
  }
  cellsForBounds(b) {
    const cs = this.cellSize;
    const x0 = Math.floor(b.x / cs);
    const y0 = Math.floor(b.y / cs);
    const x1 = Math.floor((b.x + b.width) / cs);
    const y1 = Math.floor((b.y + b.height) / cs);
    const keys = [];
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        keys.push(`${x},${y}`);
      }
    }
    return keys;
  }
  /** Candidates at a world point (deduped, high z-index first). */
  queryPoint(x, y) {
    const key = `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
    const bucket = this.grid.get(key);
    if (!bucket)
      return [];
    const seen = /* @__PURE__ */ new Set();
    const out = [];
    for (let i = bucket.length - 1; i >= 0; i--) {
      const node = bucket[i];
      if (seen.has(node.id))
        continue;
      seen.add(node.id);
      out.push(node);
    }
    out.sort((a, b) => b.zIndex - a.zIndex);
    return out;
  }
  get size() {
    return this.entries.length;
  }
  clear() {
    this.grid.clear();
    this.entries = [];
    this.stale = true;
  }
};

// src/components/uiTheme.ts
var UI_THEME_VAR_MAP = {
  primary: "--ld-primary",
  primaryHover: "--ld-primary-hover",
  primaryActive: "--ld-primary-active",
  primarySubtle: "--ld-primary-subtle",
  secondary: "--ld-secondary",
  secondaryHover: "--ld-secondary-hover",
  danger: "--ld-danger",
  dangerSubtle: "--ld-danger-subtle",
  success: "--ld-success",
  successSubtle: "--ld-success-subtle",
  warning: "--ld-warning",
  warningSubtle: "--ld-warning-subtle",
  surface: "--ld-surface",
  surfaceMuted: "--ld-surface-muted",
  surfaceInset: "--ld-surface-inset",
  overlay: "--ld-overlay",
  border: "--ld-border",
  borderStrong: "--ld-border-strong",
  text: "--ld-text",
  textSecondary: "--ld-text-secondary",
  textMuted: "--ld-text-muted",
  textInverse: "--ld-text-inverse",
  placeholder: "--ld-placeholder",
  radius: "--ld-radius",
  radiusSm: "--ld-radius-sm",
  radiusLg: "--ld-radius-lg",
  fontFamily: "--ld-font-family",
  controlHeight: "--ld-control-h",
  shadowMd: "--ld-shadow-md",
  statusBarBg: "--ld-statusbar-bg",
  statusBarText: "--ld-statusbar-text",
  statusBarBorder: "--ld-statusbar-border",
  tooltipBg: "--ld-tooltip-bg",
  spaceXs: "--ld-space-xs",
  spaceSm: "--ld-space-sm",
  spaceMd: "--ld-space-md",
  spaceLg: "--ld-space-lg",
  spaceXl: "--ld-space-xl",
  bpSm: "--ld-bp-sm",
  bpMd: "--ld-bp-md",
  bpLg: "--ld-bp-lg"
};
var UI_THEME_TOKEN_KEYS = Object.keys(UI_THEME_VAR_MAP);
function applyUiTheme(el, tokens) {
  if (tokens.mode) {
    el.setAttribute("data-ld-theme", tokens.mode);
  }
  for (const key of UI_THEME_TOKEN_KEYS) {
    const value = tokens[key];
    const cssVar = UI_THEME_VAR_MAP[key];
    if (value !== void 0 && value !== "") {
      el.style.setProperty(cssVar, value);
    }
  }
}
var DARK_BASE = {
  mode: "dark",
  surface: "#1e293b",
  surfaceMuted: "#0f172a",
  surfaceInset: "#334155",
  border: "#334155",
  borderStrong: "#475569",
  text: "#f1f5f9",
  textSecondary: "#cbd5e1",
  textMuted: "#94a3b8",
  textInverse: "#0f172a",
  placeholder: "#64748b",
  primarySubtle: "#1e3a5f",
  successSubtle: "#14532d",
  warningSubtle: "#422006",
  dangerSubtle: "#450a0a",
  overlay: "rgba(0, 0, 0, 0.65)",
  statusBarBg: "#0f172a",
  statusBarText: "#94a3b8",
  statusBarBorder: "#334155",
  tooltipBg: "#0f172a"
};
var UI_PRESETS = {
  /** Default light theme — uses CSS file defaults; only sets `mode: 'light'`. */
  default: { mode: "light" },
  /** Full dark palette with blue primary accent. */
  dark: {
    ...DARK_BASE,
    primary: "#3b82f6",
    primaryHover: "#2563eb",
    primaryActive: "#1d4ed8"
  },
  /** Purple brand accent — dashboards and creative tools. */
  violet: {
    primary: "#7c3aed",
    primaryHover: "#6d28d9",
    primaryActive: "#5b21b6",
    primarySubtle: "#ede9fe"
  },
  /** Green brand accent — success-oriented UIs. */
  emerald: {
    primary: "#059669",
    primaryHover: "#047857",
    primaryActive: "#065f46",
    primarySubtle: "#d1fae5"
  },
  /** Neutral slate accent — minimal corporate look. */
  slate: {
    primary: "#334155",
    primaryHover: "#1e293b",
    primaryActive: "#0f172a",
    primarySubtle: "#f1f5f9"
  },
  /** Sky-blue accent — data and analytics apps. */
  ocean: {
    primary: "#0284c7",
    primaryHover: "#0369a1",
    primaryActive: "#075985",
    primarySubtle: "#e0f2fe"
  },
  /** Rose accent — alerts and marketing surfaces. */
  rose: {
    primary: "#e11d48",
    primaryHover: "#be123c",
    primaryActive: "#9f1239",
    primarySubtle: "#ffe4e6"
  },
  /** Dark mode with violet accent (alias for dark + violet primary). */
  darkViolet: {
    ...DARK_BASE,
    primary: "#8b5cf6",
    primaryHover: "#7c3aed",
    primaryActive: "#6d28d9",
    primarySubtle: "#2e1065"
  }
};
function resolveUiTheme(input) {
  const { preset, ...overrides } = input;
  const base = preset && UI_PRESETS[preset] ? { ...UI_PRESETS[preset] } : {};
  return { ...base, ...overrides };
}

// src/App.ts
var App = class extends EventEmitter {
  constructor(container, options = {}) {
    super();
    this.eventManager = null;
    this.renderScheduled = false;
    this.renderFrameId = 0;
    this.resizeHandler = null;
    this.spatialIndex = new SpatialIndex();
    this.nodeCount = 0;
    this.highContrast = options.highContrast ?? false;
    this.uiTheme = options.uiTheme ?? {};
    this.perf = {
      spatialIndex: options.performance?.spatialIndex ?? true,
      spatialIndexThreshold: options.performance?.spatialIndexThreshold ?? 100,
      dirtyRegions: options.performance?.dirtyRegions ?? true,
      batchRendering: options.performance?.batchRendering ?? true,
      layerCache: options.performance?.layerCache ?? true
    };
    this.container = resolveContainer(container);
    this.width = options.width ?? (this.container.clientWidth || 800);
    this.height = options.height ?? (this.container.clientHeight || 600);
    this.pixelRatio = options.pixelRatio ?? getPixelRatio();
    this.background = options.background ?? "transparent";
    this.autoResize = options.autoResize ?? true;
    this.stage = new Group({ name: "stage" });
    this.stage._app = this;
    this.camera = new Camera(this);
    this.camera.setViewport(this.width, this.height);
    this.renderer = this.createRenderer(options.renderer ?? "auto");
    this.applyPerformanceOptions();
    this.renderer.init(this.container, {
      width: this.width,
      height: this.height,
      pixelRatio: this.pixelRatio,
      background: this.background,
      highContrast: this.highContrast,
      uiTheme: resolveUiTheme(this.uiTheme)
    });
    this.eventManager = new EventManager(this, this.renderer.getElement());
    if (this.autoResize && typeof window !== "undefined") {
      this.resizeHandler = () => this.handleResize();
      window.addEventListener("resize", this.resizeHandler);
    }
    this.render();
  }
  applyPerformanceOptions() {
    if (this.renderer instanceof CanvasRenderer) {
      this.renderer.dirtyRegionsEnabled = this.perf.dirtyRegions;
      this.renderer.batchRendering = this.perf.batchRendering;
      this.renderer.layerCacheEnabled = this.perf.layerCache;
    }
  }
  createRenderer(type) {
    let resolved = type === "auto" ? detectBestRenderer() : type;
    if (resolved !== "canvas" && !hasRenderer(resolved)) {
      resolved = "canvas";
    }
    const renderer = createRenderer(resolved);
    if (renderer)
      return renderer;
    const fallback = createRenderer("canvas");
    if (fallback)
      return fallback;
    throw new Error("LightDraw: no renderer registered (load lightdraw.core first)");
  }
  rect(options) {
    return this.createNode(() => new Rect(options));
  }
  circle(options) {
    return this.createNode(() => new Circle(options));
  }
  ellipse(options) {
    return this.createNode(() => new Ellipse(options));
  }
  line(options) {
    return this.createNode(() => new Line(options));
  }
  arc(options) {
    return this.createNode(() => new Arc(options));
  }
  polygon(options) {
    return this.createNode(() => new Polygon(options));
  }
  polyline(options) {
    return this.createNode(() => new Polyline(options));
  }
  path(options) {
    return this.createNode(() => new Path(options));
  }
  star(options) {
    return this.createNode(() => new Star(options));
  }
  roundedRect(options) {
    return this.createNode(() => new RoundedRect(options));
  }
  text(options) {
    return this.createNode(() => new TextNode(options));
  }
  image(options) {
    return this.createNode(() => new ImageNode(options));
  }
  sprite(options) {
    return this.createNode(() => new Sprite(options));
  }
  group(options) {
    return this.createNode(() => new Group(options));
  }
  layer(options) {
    return this.createNode(() => new Layer(options));
  }
  attachApp(node) {
    node._app = this;
    if ("children" in node) {
      for (const child of node.children) {
        this.attachApp(child);
      }
    }
  }
  createNode(factory) {
    const node = factory();
    this.attachApp(node);
    return node;
  }
  add(...nodes) {
    for (const node of nodes) {
      this.attachApp(node);
    }
    this.stage.add(...nodes);
    this.nodeCount = countNodes(this.stage);
    this.spatialIndex.markStale();
    this.renderer.forceFullRedraw();
    this.requestRender();
    return this;
  }
  /** Called from Node.markDirty — tracks dirty regions for partial canvas clears. */
  markNodeDirty(node) {
    const b = getWorldBounds(node);
    this.renderer.markDirty(b.x, b.y, b.width, b.height);
    if (node instanceof Group && node.cacheAsBitmap && this.renderer instanceof CanvasRenderer) {
      this.renderer.layerCache.invalidate(node.id);
    }
    this.spatialIndex.markStale();
  }
  /** Called from Node.destroy — purge caches and spatial index entries. */
  onNodeDestroyed(node) {
    if (this.renderer instanceof CanvasRenderer) {
      this.renderer.layerCache.invalidate(node.id);
      if ("children" in node) {
        this.renderer.layerCache.invalidateSubtree(node);
      }
    }
    this.spatialIndex.markStale();
    this.nodeCount = Math.max(0, this.nodeCount - 1);
  }
  timeline() {
    return new Timeline();
  }
  animate(node, options) {
    return AnimationEngine.animate(node, options);
  }
  getFocusedNode() {
    return this.eventManager?.getFocusedNode() ?? null;
  }
  isHighContrast() {
    return this.highContrast;
  }
  setHighContrast(enabled) {
    this.highContrast = enabled;
    this.renderer.forceFullRedraw();
    this.requestRender();
    return this;
  }
  focusNode(node) {
    this.eventManager?.setFocus(node);
    return this;
  }
  getFocusableNodes() {
    return collectFocusable(this.stage);
  }
  requestRender() {
    if (this.renderScheduled)
      return;
    this.renderScheduled = true;
    this.renderFrameId = requestFrame(() => {
      this.renderScheduled = false;
      this.render();
    });
  }
  render() {
    this.updateSprites(this.stage);
    this.camera.update();
    const focusedNodeId = this.eventManager?.getFocusedNode()?.id ?? null;
    this.renderer.setRenderState({ focusedNodeId, highContrast: this.highContrast });
    this.renderer.render(this.stage, this.camera.getMatrix());
    this.nodeCount = countNodes(this.stage);
    if (this.perf.spatialIndex && this.nodeCount >= this.perf.spatialIndexThreshold) {
      this.spatialIndex.ensureFresh(this.stage);
    }
  }
  updateSprites(group) {
    const time = typeof performance !== "undefined" ? performance.now() : Date.now();
    for (const child of group.children) {
      if (child instanceof Sprite && child.playing) {
        child.updateFrame(time);
      }
      if ("children" in child) {
        this.updateSprites(child);
      }
    }
  }
  hitTest(worldX, worldY) {
    if (this.perf.spatialIndex && this.nodeCount >= this.perf.spatialIndexThreshold) {
      this.spatialIndex.ensureFresh(this.stage);
      const hit2 = this.hitTestSpatial(worldX, worldY);
      return hit2 ? { node: hit2, x: worldX, y: worldY } : null;
    }
    const hit = this.hitTestNode(this.stage, worldX, worldY);
    return hit ? { node: hit, x: worldX, y: worldY } : null;
  }
  hitTestSpatial(worldX, worldY) {
    const candidates = this.spatialIndex.queryPoint(worldX, worldY);
    for (const child of candidates) {
      if (!child.visible || !child.listening)
        continue;
      const wm = child.getWorldMatrix();
      const inv = matrixPool.acquire();
      if (!wm.invertInto(inv)) {
        matrixPool.release(inv);
        continue;
      }
      const local = inv.transformPoint(worldX, worldY);
      matrixPool.release(inv);
      if (!pointInMask(child.mask, local.x, local.y))
        continue;
      if (child.containsPoint(local.x, local.y))
        return child;
    }
    return null;
  }
  hitTestNode(group, worldX, worldY) {
    const children = [...group.children].reverse();
    for (const child of children) {
      if (!child.visible || !child.listening)
        continue;
      if ("children" in child) {
        const nested = this.hitTestNode(child, worldX, worldY);
        if (nested)
          return nested;
      }
      const wm = child.getWorldMatrix();
      const inv = matrixPool.acquire();
      if (!wm.invertInto(inv)) {
        matrixPool.release(inv);
        continue;
      }
      const local = inv.transformPoint(worldX, worldY);
      matrixPool.release(inv);
      if (!pointInMask(child.mask, local.x, local.y))
        continue;
      if (child.containsPoint(local.x, local.y)) {
        return child;
      }
    }
    return null;
  }
  resize(width, height) {
    this.width = width ?? (this.container.clientWidth || this.width);
    this.height = height ?? (this.container.clientHeight || this.height);
    this.camera.setViewport(this.width, this.height);
    this.renderer.resize(this.width, this.height, this.pixelRatio);
    this.renderer.forceFullRedraw();
    this.spatialIndex.markStale();
    this.requestRender();
  }
  handleResize() {
    this.resize();
  }
  getSize() {
    return { width: this.width, height: this.height };
  }
  getPixelRatio() {
    return this.pixelRatio;
  }
  getBackground() {
    return this.background;
  }
  /** Active renderer instance (used by export pipeline). */
  getRenderer() {
    return this.renderer;
  }
  setBackground(color) {
    this.background = color;
    this.requestRender();
    return this;
  }
  /** Update built-in UI theme tokens (CSS variables) without custom stylesheets. */
  setUiTheme(tokens) {
    this.uiTheme = { ...this.uiTheme, ...tokens };
    const resolved = resolveUiTheme(this.uiTheme);
    const renderer = this.renderer;
    if (typeof renderer.setUiTheme === "function") {
      renderer.setUiTheme(resolved);
    }
    this.requestRender();
    return this;
  }
  loadJSON(json) {
    const data = typeof json === "string" ? JSON.parse(json) : json;
    const node = fromJSON(data, this);
    this.stage.clear();
    this.stage.add(node);
    this.nodeCount = countNodes(this.stage);
    this.spatialIndex.clear();
    this.renderer.forceFullRedraw();
    this.requestRender();
    return node;
  }
  exportJSON() {
    return toJSON(this.stage);
  }
  export(formatOrOptions) {
    if (typeof formatOrOptions === "object") {
      return exportApp(this, formatOrOptions);
    }
    return exportScene(this, formatOrOptions);
  }
  toDataURL(type = "image/png", quality) {
    return this.renderer.toDataURL(type, quality);
  }
  /** Remove all nodes from the scene (keeps the App instance). */
  clear() {
    this.stage.clear();
    this.nodeCount = 0;
    this.spatialIndex.clear();
    this.renderer.forceFullRedraw();
    this.requestRender();
    return this;
  }
  destroy() {
    if (this.renderFrameId)
      cancelFrame(this.renderFrameId);
    if (this.resizeHandler) {
      window.removeEventListener("resize", this.resizeHandler);
    }
    this.eventManager?.destroy();
    if (this.renderer instanceof CanvasRenderer) {
      this.renderer.layerCache.destroy();
    }
    this.spatialIndex.clear();
    this.renderer.destroy();
    this.stage.clear();
    this.removeAllListeners();
  }
  static use(plugin, LightDrawRef) {
    const ld = LightDrawRef ?? globalThis.__LightDraw;
    if (ld)
      installPlugin(plugin, ld);
  }
};

// src/layout/index.ts
function sumChildMainSize(group, isRow, gap) {
  let total = 0;
  for (let i = 0; i < group.children.length; i++) {
    const b = group.children[i].getBounds();
    total += (isRow ? b.width : b.height) + (i > 0 ? gap : 0);
  }
  return total;
}
function flexLayout(group, options = {}) {
  const {
    direction = "row",
    gap = 8,
    padding = 0,
    align = "start",
    justify = "start",
    wrap = false,
    width,
    height
  } = options;
  const isRow = direction === "row";
  const bounds = group.getBounds();
  const intrinsic = sumChildMainSize(group, isRow, gap);
  const containerSize = (isRow ? width : height) ?? ((isRow ? bounds.width : bounds.height) || intrinsic || 800);
  const maxMain = Math.max(containerSize - padding * 2, 0);
  const rows = [];
  let current = { items: [], mainSize: 0, crossSize: 0 };
  for (const child of group.children) {
    const b = child.getBounds();
    const main = isRow ? b.width : b.height;
    const cross = isRow ? b.height : b.width;
    if (wrap && current.items.length > 0 && current.mainSize + gap + main > maxMain) {
      rows.push(current);
      current = { items: [], mainSize: 0, crossSize: 0 };
    }
    current.items.push(child);
    current.mainSize += (current.items.length > 1 ? gap : 0) + main;
    current.crossSize = Math.max(current.crossSize, cross);
  }
  if (current.items.length > 0)
    rows.push(current);
  let crossOffset = padding;
  for (const row of rows) {
    let mainOffset = padding;
    const freeSpace = maxMain - row.mainSize;
    let extraGap = gap;
    if (justify === "center")
      mainOffset += freeSpace / 2;
    else if (justify === "end")
      mainOffset += freeSpace;
    else if (justify === "space-between" && row.items.length > 1) {
      extraGap = gap + freeSpace / (row.items.length - 1);
    } else if (justify === "space-around" && row.items.length > 0) {
      extraGap = gap + freeSpace / row.items.length;
      mainOffset += freeSpace / (row.items.length * 2);
    }
    for (const child of row.items) {
      const b = child.getBounds();
      const cross = isRow ? b.height : b.width;
      let crossPos = crossOffset;
      if (align === "center")
        crossPos += (row.crossSize - cross) / 2;
      else if (align === "end")
        crossPos += row.crossSize - cross;
      else if (align === "stretch") {
      }
      if (isRow) {
        child.x = mainOffset;
        child.y = crossPos;
        mainOffset += b.width + extraGap;
      } else {
        child.x = crossPos;
        child.y = mainOffset;
        mainOffset += b.height + extraGap;
      }
      child.markDirty();
    }
    crossOffset += row.crossSize + gap;
  }
}
function gridLayout(group, options = {}) {
  const { columns = 3, gap = 10, padding = 0 } = options;
  let x = padding;
  let y = padding;
  let col = 0;
  let rowHeight = 0;
  for (const child of group.children) {
    const b = child.getBounds();
    child.x = x;
    child.y = y;
    rowHeight = Math.max(rowHeight, b.height);
    col++;
    if (col >= columns) {
      col = 0;
      x = padding;
      y += rowHeight + gap;
      rowHeight = 0;
    } else {
      x += b.width + gap;
    }
    child.markDirty();
  }
}
function stackLayout(group, options = {}) {
  flexLayout(group, { ...options, wrap: false });
}
function flowLayout(group, options = {}) {
  gridLayout(group, { ...options, columns: options.columns ?? 4 });
}
function circularLayout(group, cx, cy, radius) {
  const n = group.children.length;
  if (n === 0)
    return;
  for (let i = 0; i < n; i++) {
    const angle = 2 * Math.PI * i / n - Math.PI / 2;
    const child = group.children[i];
    child.x = cx + radius * Math.cos(angle);
    child.y = cy + radius * Math.sin(angle);
    child.markDirty();
  }
}
function treeLayout(group, levelGap = 80, siblingGap = 40) {
  layoutTreeNode(group, 0, 0, levelGap, siblingGap);
}
function layoutTreeNode(node, x, y, levelGap, siblingGap) {
  node.x = x;
  node.y = y;
  node.markDirty();
  let childX = x;
  for (const child of node.children) {
    if ("children" in child) {
      childX = layoutTreeNode(child, childX, y + levelGap, levelGap, siblingGap);
    } else {
      child.x = childX;
      child.y = y + levelGap;
      child.markDirty();
      childX += child.getBounds().width + siblingGap;
    }
  }
  return childX;
}
function alignChildren(group, alignment) {
  const bounds = group.getBounds();
  for (const child of group.children) {
    const b = child.getBounds();
    switch (alignment) {
      case "left":
        child.x = bounds.x;
        break;
      case "center":
        child.x = bounds.x + (bounds.width - b.width) / 2;
        break;
      case "right":
        child.x = bounds.x + bounds.width - b.width;
        break;
      case "top":
        child.y = bounds.y;
        break;
      case "middle":
        child.y = bounds.y + (bounds.height - b.height) / 2;
        break;
      case "bottom":
        child.y = bounds.y + bounds.height - b.height;
        break;
    }
    child.markDirty();
  }
}
function distributeSpacing(group, axis) {
  const children = group.children;
  if (children.length < 2)
    return;
  const bounds = group.getBounds();
  const totalSize = children.reduce(
    (sum, c) => sum + (axis === "x" ? c.getBounds().width : c.getBounds().height),
    0
  );
  const gap = (axis === "x" ? bounds.width : bounds.height - totalSize) / (children.length - 1);
  let offset = axis === "x" ? bounds.x : bounds.y;
  for (const child of children) {
    if (axis === "x") {
      child.x = offset;
      offset += child.getBounds().width + gap;
    } else {
      child.y = offset;
      offset += child.getBounds().height + gap;
    }
    child.markDirty();
  }
}
var Layout = {
  grid: gridLayout,
  stack: stackLayout,
  flex: flexLayout,
  flow: flowLayout,
  circular: circularLayout,
  tree: treeLayout,
  align: alignChildren,
  distribute: distributeSpacing
};

// src/core/index.ts
var VERSION = "1.0.0";
registerRenderer("canvas", () => new CanvasRenderer());
function use(plugin) {
  installPlugin(plugin, LightDraw);
}
function createApp(container, options) {
  return new App(container, options);
}
var LightDraw = {
  version: VERSION,
  use,
  createApp,
  App,
  Node,
  Group,
  Layer,
  Rect,
  Circle,
  Ellipse,
  Line,
  Arc,
  Polygon,
  Polyline,
  Path,
  Star,
  RoundedRect,
  Text: TextNode,
  Image: ImageNode,
  Sprite,
  Camera,
  CanvasRenderer,
  Renderer,
  animate,
  AnimationEngine,
  Timeline,
  parallel,
  easings,
  getEasing,
  registerEasing,
  Layout,
  fromJSON,
  toJSON,
  registerJSONType,
  exportScene,
  exportApp,
  downloadExport,
  validateSceneJSON,
  scenesEqual,
  createPluginContext,
  getInstalledPlugins,
  Matrix2D,
  ObjectPool,
  detectBestRenderer,
  EventEmitter
};
if (typeof window !== "undefined") {
  window.LightDraw = LightDraw;
}

// src/modules/svg/index.ts
var svgPlugin = {
  name: "lightdraw-svg",
  version: "1.0.0",
  install(_LD) {
    registerRenderer("svg", () => new SVGRenderer());
  }
};

// src/renderers/htmlComponents.ts
function positionStyle(node, width, height) {
  return `
    position: absolute;
    left: ${node.x}px;
    top: ${node.y}px;
    width: ${width}px;
    height: ${height}px;
    opacity: ${node.opacity};
    pointer-events: ${node.listening ? "auto" : "none"};
  `;
}
function getState4(node) {
  return node.metadata?.componentState ?? {};
}
function modifierClasses(base, mods, extra = "") {
  const bases = base.split(" ").filter(Boolean);
  const root = bases[0] ?? base;
  const parts = [...bases];
  if (mods.size && mods.size !== "md")
    parts.push(`${root}--${mods.size}`);
  if (mods.invalid)
    parts.push(`${root}--invalid`);
  if (mods.disabled)
    parts.push(`${root}--disabled`);
  if (mods.fullWidth)
    parts.push(`${root}--full`);
  if (extra)
    parts.push(extra);
  return parts.filter(Boolean).join(" ");
}
function fieldWidth(state, fallback) {
  if (state.fullWidth)
    return "100%";
  return Number(state.width ?? fallback);
}
function syncFieldError(wrap, error) {
  let errEl = wrap.querySelector(".lightdraw-field-error");
  if (error) {
    if (!errEl) {
      errEl = document.createElement("span");
      errEl.className = "lightdraw-field-error";
      errEl.setAttribute("role", "alert");
      wrap.appendChild(errEl);
    }
    errEl.textContent = error;
  } else if (errEl) {
    errEl.remove();
  }
}
function syncNativeButton(node, parent, ctx) {
  const state = getState4(node);
  const label = String(state.label ?? "Button");
  const width = Number(state.width ?? 128);
  const height = Number(state.height ?? 40);
  const variant = String(state.variant ?? "primary");
  const size = String(state.size ?? "md");
  const disabled = Boolean(state.disabled);
  let el = ctx.nodeElements.get(node.id);
  if (!el) {
    el = document.createElement("button");
    el.type = "button";
    el.id = node.id;
    parent.appendChild(el);
    el.addEventListener("click", (e) => {
      if (getState4(node).disabled) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      node.emit("click", syntheticEvent("click", node));
      node.emit("change", syntheticEvent("change", node, { value: label }));
    });
    el.addEventListener("focus", () => node.getApp()?.focusNode(node));
    ctx.nodeElements.set(node.id, el);
  } else if (el.parentElement !== parent) {
    parent.appendChild(el);
  }
  el.className = `lightdraw-btn lightdraw-btn--${variant}${size !== "md" ? ` lightdraw-btn--${size}` : ""}`;
  el.textContent = label;
  el.disabled = disabled;
  el.setAttribute("aria-disabled", disabled ? "true" : "false");
  el.style.cssText = positionStyle(node, width, height);
  ctx.applyA11y(node, el);
  ctx.applyUiClasses(node, el);
  ctx.seenIds.add(node.id);
}
function syncNativeCheckbox(node, parent, ctx) {
  const state = getState4(node);
  const label = String(state.label ?? "");
  const checked = Boolean(state.checked);
  const disabled = Boolean(state.disabled);
  const size = String(state.size ?? "md");
  const mods = { size, disabled };
  let wrap = ctx.nodeElements.get(node.id);
  if (!wrap) {
    wrap = document.createElement("label");
    wrap.id = node.id;
    wrap.innerHTML = '<input type="checkbox" class="lightdraw-checkbox-input" /><span class="lightdraw-checkbox-box" aria-hidden="true"></span><span class="lightdraw-checkbox-label"></span>';
    parent.appendChild(wrap);
    const input2 = wrap.querySelector("input");
    input2.addEventListener("change", () => {
      if (getState4(node).disabled)
        return;
      const v = input2.checked;
      node.metadata.componentState = { ...getState4(node), checked: v };
      node.ariaChecked = v;
      node.emit("change", syntheticEvent("change", node, { value: v }));
      node.getApp()?.requestRender();
    });
    input2.addEventListener("focus", () => node.getApp()?.focusNode(node));
    ctx.nodeElements.set(node.id, wrap);
  } else if (wrap.parentElement !== parent) {
    parent.appendChild(wrap);
  }
  wrap.className = modifierClasses("lightdraw-checkbox", mods);
  const input = wrap.querySelector("input");
  const labelEl = wrap.querySelector(".lightdraw-checkbox-label");
  input.checked = checked;
  input.disabled = disabled;
  labelEl.textContent = label;
  wrap.style.cssText = positionStyle(node, Math.max(label.length * 8 + 36, 160), 24);
  ctx.applyA11y(node, wrap);
  ctx.applyUiClasses(node, wrap);
  if (node.focusable && !disabled)
    input.tabIndex = node.id === ctx.focusedNodeId ? 0 : -1;
  else
    input.removeAttribute("tabindex");
  ctx.seenIds.add(node.id);
}
function syncNativeInput(node, parent, ctx) {
  const state = getState4(node);
  const width = fieldWidth(state, 240);
  const value = String(state.value ?? "");
  const placeholder = String(state.placeholder ?? "");
  const label = String(state.label ?? "");
  const disabled = Boolean(state.disabled);
  const invalid = Boolean(state.invalid);
  const size = String(state.size ?? "md");
  const error = state.error ? String(state.error) : "";
  const mods = { size, disabled, invalid, fullWidth: Boolean(state.fullWidth), error };
  let wrap = ctx.nodeElements.get(node.id);
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.id = node.id;
    const input2 = document.createElement("input");
    input2.type = "text";
    input2.className = "lightdraw-native-input";
    wrap.appendChild(input2);
    parent.appendChild(wrap);
    input2.addEventListener("input", () => {
      if (getState4(node).disabled)
        return;
      const v = input2.value;
      node.metadata.componentState = { ...getState4(node), value: v };
      node.emit("input", syntheticEvent("input", node, { value: v }));
    });
    input2.addEventListener("change", () => {
      node.emit("change", syntheticEvent("change", node, { value: input2.value }));
    });
    input2.addEventListener("focus", () => node.getApp()?.focusNode(node));
    ctx.nodeElements.set(node.id, wrap);
  } else if (wrap.parentElement !== parent) {
    parent.appendChild(wrap);
  }
  wrap.className = modifierClasses("lightdraw-field", mods);
  const input = wrap.querySelector("input");
  if (label) {
    let labelEl = wrap.querySelector(".lightdraw-field-label");
    if (!labelEl) {
      labelEl = document.createElement("label");
      labelEl.className = "lightdraw-field-label";
      wrap.insertBefore(labelEl, input);
    }
    labelEl.textContent = label;
    labelEl.setAttribute("for", `${node.id}-input`);
    input.id = `${node.id}-input`;
  }
  input.value = value;
  input.placeholder = placeholder;
  input.disabled = disabled;
  input.setAttribute("aria-invalid", invalid ? "true" : "false");
  syncFieldError(wrap, error || (invalid ? "Invalid value" : ""));
  const fieldH = label ? error || invalid ? 88 : 70 : 40;
  wrap.style.cssText = absPosition(node, width, fieldH);
  ctx.applyA11y(node, input);
  ctx.applyUiClasses(node, wrap);
  if (node.focusable && !disabled)
    input.tabIndex = node.id === ctx.focusedNodeId ? 0 : -1;
  else
    input.removeAttribute("tabindex");
  ctx.seenIds.add(node.id);
}
function syncNativeTextarea(node, parent, ctx) {
  const state = getState4(node);
  const width = fieldWidth(state, 280);
  const height = Number(state.height ?? 88);
  const value = String(state.value ?? "");
  const placeholder = String(state.placeholder ?? "");
  const label = String(state.label ?? "");
  const disabled = Boolean(state.disabled);
  const invalid = Boolean(state.invalid);
  const size = String(state.size ?? "md");
  const error = state.error ? String(state.error) : "";
  const mods = { size, disabled, invalid, fullWidth: Boolean(state.fullWidth), error };
  let wrap = ctx.nodeElements.get(node.id);
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.id = node.id;
    const ta2 = document.createElement("textarea");
    ta2.className = "lightdraw-native-textarea";
    wrap.appendChild(ta2);
    parent.appendChild(wrap);
    ta2.addEventListener("input", () => {
      if (getState4(node).disabled)
        return;
      node.metadata.componentState = { ...getState4(node), value: ta2.value };
      node.emit("input", syntheticEvent("input", node, { value: ta2.value }));
    });
    ta2.addEventListener("change", () => {
      node.emit("change", syntheticEvent("change", node, { value: ta2.value }));
    });
    ta2.addEventListener("focus", () => node.getApp()?.focusNode(node));
    ctx.nodeElements.set(node.id, wrap);
  } else if (wrap.parentElement !== parent) {
    parent.appendChild(wrap);
  }
  wrap.className = modifierClasses("lightdraw-field lightdraw-field--textarea", mods);
  const ta = wrap.querySelector("textarea");
  if (label) {
    let labelEl = wrap.querySelector(".lightdraw-field-label");
    if (!labelEl) {
      labelEl = document.createElement("label");
      labelEl.className = "lightdraw-field-label";
      wrap.insertBefore(labelEl, ta);
    }
    labelEl.textContent = label;
  }
  ta.value = value;
  ta.placeholder = placeholder;
  ta.disabled = disabled;
  ta.setAttribute("aria-invalid", invalid ? "true" : "false");
  syncFieldError(wrap, error || (invalid ? "Invalid value" : ""));
  ta.style.height = `${height}px`;
  const errExtra = error || invalid ? 22 : 0;
  const fieldH = label ? height + 30 + errExtra : height + errExtra;
  wrap.style.cssText = absPosition(node, width, fieldH);
  ctx.applyA11y(node, ta);
  ctx.applyUiClasses(node, wrap);
  ctx.seenIds.add(node.id);
}
function syncNativeToggle(node, parent, ctx) {
  const state = getState4(node);
  const on = Boolean(state.value);
  const label = String(state.label ?? "");
  const disabled = Boolean(state.disabled);
  const size = String(state.size ?? "md");
  const mods = { size, disabled };
  let wrap = ctx.nodeElements.get(node.id);
  if (!wrap) {
    wrap = document.createElement("label");
    wrap.id = node.id;
    wrap.innerHTML = '<input type="checkbox" class="lightdraw-switch-input" role="switch" /><span class="lightdraw-switch-track" aria-hidden="true"><span class="lightdraw-switch-thumb"></span></span><span class="lightdraw-switch-label"></span>';
    parent.appendChild(wrap);
    const input2 = wrap.querySelector("input");
    input2.addEventListener("change", () => {
      if (getState4(node).disabled)
        return;
      const v = input2.checked;
      node.metadata.componentState = { ...getState4(node), value: v };
      node.ariaChecked = v;
      node.emit("change", syntheticEvent("change", node, { value: v }));
      node.getApp()?.requestRender();
    });
    input2.addEventListener("focus", () => node.getApp()?.focusNode(node));
    ctx.nodeElements.set(node.id, wrap);
  } else if (wrap.parentElement !== parent) {
    parent.appendChild(wrap);
  }
  wrap.className = modifierClasses("lightdraw-switch-wrap", mods);
  const input = wrap.querySelector("input");
  const labelEl = wrap.querySelector(".lightdraw-switch-label");
  input.checked = on;
  input.disabled = disabled;
  labelEl.textContent = label;
  wrap.style.cssText = absPosition(node, Math.max(label.length * 8 + 80, 160), 28);
  ctx.applyA11y(node, wrap);
  ctx.applyUiClasses(node, wrap);
  ctx.seenIds.add(node.id);
}
function syncNativeSlider(node, parent, ctx) {
  const state = getState4(node);
  const width = fieldWidth(state, 200);
  const min = Number(state.min ?? 0);
  const max = Number(state.max ?? 100);
  const value = Number(state.value ?? 50);
  const label = String(state.label ?? "");
  const disabled = Boolean(state.disabled);
  const size = String(state.size ?? "md");
  const pct = (value - min) / Math.max(max - min, 1) * 100;
  const mods = { size, disabled };
  let wrap = ctx.nodeElements.get(node.id);
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.id = node.id;
    wrap.innerHTML = '<div class="lightdraw-field-header"><span class="lightdraw-field-label"></span><span class="lightdraw-field-value"></span></div><input type="range" class="lightdraw-range" />';
    parent.appendChild(wrap);
    const input2 = wrap.querySelector("input");
    input2.addEventListener("input", () => {
      if (getState4(node).disabled)
        return;
      const v = Number(input2.value);
      node.metadata.componentState = { ...getState4(node), value: v };
      node.ariaValueNow = v;
      node.emit("input", syntheticEvent("input", node, { value: v }));
      node.getApp()?.requestRender();
    });
    input2.addEventListener("change", () => {
      node.emit("change", syntheticEvent("change", node, { value: Number(input2.value) }));
    });
    input2.addEventListener("focus", () => node.getApp()?.focusNode(node));
    ctx.nodeElements.set(node.id, wrap);
  } else if (wrap.parentElement !== parent) {
    parent.appendChild(wrap);
  }
  wrap.className = modifierClasses("lightdraw-field lightdraw-field--slider", mods);
  const input = wrap.querySelector("input");
  const labelEl = wrap.querySelector(".lightdraw-field-label");
  const valueEl = wrap.querySelector(".lightdraw-field-value");
  labelEl.textContent = label || "Value";
  valueEl.textContent = String(Math.round(value));
  input.min = String(min);
  input.max = String(max);
  input.value = String(value);
  input.disabled = disabled;
  node.ariaValueNow = value;
  node.ariaValueMin = min;
  node.ariaValueMax = max;
  wrap.style.cssText = `${absPosition(node, width, 52)}--ld-range-pct:${pct}%;`;
  ctx.applyA11y(node, input);
  ctx.applyUiClasses(node, wrap);
  ctx.seenIds.add(node.id);
}
function syncNativeRadio(node, parent, ctx) {
  const state = getState4(node);
  const label = String(state.label ?? "");
  const selected = Boolean(state.selected);
  const group = String(state.group ?? "default");
  const disabled = Boolean(state.disabled);
  const size = String(state.size ?? "md");
  const mods = { size, disabled };
  let wrap = ctx.nodeElements.get(node.id);
  if (!wrap) {
    wrap = document.createElement("label");
    wrap.id = node.id;
    wrap.innerHTML = '<input type="radio" class="lightdraw-radio-input" /><span class="lightdraw-radio-dot" aria-hidden="true"></span><span class="lightdraw-radio-label"></span>';
    parent.appendChild(wrap);
    const input2 = wrap.querySelector("input");
    input2.addEventListener("change", () => {
      if (getState4(node).disabled)
        return;
      node.metadata.componentState = { ...getState4(node), selected: true };
      node.ariaChecked = true;
      node.emit("change", syntheticEvent("change", node, { value: group, payload: group }));
      node.getApp()?.requestRender();
    });
    input2.addEventListener("focus", () => node.getApp()?.focusNode(node));
    ctx.nodeElements.set(node.id, wrap);
  } else if (wrap.parentElement !== parent) {
    parent.appendChild(wrap);
  }
  wrap.className = modifierClasses("lightdraw-radio", mods);
  const input = wrap.querySelector("input");
  const labelEl = wrap.querySelector(".lightdraw-radio-label");
  input.name = group;
  input.checked = selected;
  input.disabled = disabled;
  labelEl.textContent = label;
  wrap.style.cssText = positionStyle(node, Math.max(label.length * 8 + 32, 140), 22);
  ctx.applyA11y(node, wrap);
  ctx.applyUiClasses(node, wrap);
  ctx.seenIds.add(node.id);
}
function syncNativeProgress(node, parent, ctx) {
  const state = getState4(node);
  const width = fieldWidth(state, 200);
  const value = Number(state.value ?? 0);
  const label = String(state.label ?? "");
  const variant = String(state.variant ?? "default");
  const size = String(state.size ?? "md");
  const disabled = Boolean(state.disabled);
  const mods = { size, disabled };
  let el = ctx.nodeElements.get(node.id);
  if (!el) {
    el = document.createElement("div");
    el.id = node.id;
    el.innerHTML = '<div class="lightdraw-progress-header"><span class="lightdraw-progress-label"></span><span class="lightdraw-progress-value"></span></div><div class="lightdraw-progress" role="progressbar"><div class="lightdraw-progress-bar"></div></div>';
    parent.appendChild(el);
    ctx.nodeElements.set(node.id, el);
  } else if (el.parentElement !== parent) {
    parent.appendChild(el);
  }
  el.className = modifierClasses("lightdraw-progress-wrap", mods);
  const track = el.querySelector(".lightdraw-progress");
  const bar = el.querySelector(".lightdraw-progress-bar");
  const labelEl = el.querySelector(".lightdraw-progress-label");
  const valueEl = el.querySelector(".lightdraw-progress-value");
  const pct = Math.max(0, Math.min(100, value));
  bar.style.width = `${pct}%`;
  track.className = `lightdraw-progress${variant !== "default" ? ` lightdraw-progress--${variant}` : ""}`;
  el.setAttribute("role", "progressbar");
  el.setAttribute("aria-valuenow", String(pct));
  el.setAttribute("aria-valuemin", "0");
  el.setAttribute("aria-valuemax", "100");
  if (disabled)
    el.setAttribute("aria-disabled", "true");
  else
    el.removeAttribute("aria-disabled");
  const header = el.querySelector(".lightdraw-progress-header");
  if (label) {
    labelEl.textContent = label;
    valueEl.textContent = `${Math.round(pct)}%`;
    header.style.display = "flex";
  } else {
    header.style.display = "none";
  }
  const height = label ? 36 : 8;
  el.style.cssText = absPosition(node, width, height);
  ctx.applyUiClasses(node, el);
  ctx.seenIds.add(node.id);
}
function syncNativeCard(node, parent, ctx) {
  const state = getState4(node);
  const width = Number(state.width ?? 280);
  const height = Number(state.height ?? 160);
  const title = state.title;
  const subtitle = state.subtitle ? String(state.subtitle) : "";
  const actions = state.actions ?? [];
  const elevated = state.elevated !== false;
  let el = ctx.nodeElements.get(node.id);
  if (!el) {
    el = document.createElement("div");
    el.id = node.id;
    el.className = "lightdraw-card";
    parent.appendChild(el);
    ctx.nodeElements.set(node.id, el);
  } else if (el.parentElement !== parent) {
    parent.appendChild(el);
  }
  el.className = `lightdraw-card${elevated ? " lightdraw-card--elevated" : ""}`;
  let headerHtml = "";
  if (title || subtitle || actions.length) {
    const actionsHtml = actions.map((a) => `<button type="button" class="lightdraw-card-action">${escHtml(a)}</button>`).join("");
    headerHtml = `<div class="lightdraw-card-header">
      <div class="lightdraw-card-header-text">
        ${title ? `<span class="lightdraw-card-title">${escHtml(String(title))}</span>` : ""}
        ${subtitle ? `<span class="lightdraw-card-subtitle">${escHtml(subtitle)}</span>` : ""}
      </div>
      ${actions.length ? `<div class="lightdraw-card-actions">${actionsHtml}</div>` : ""}
    </div>`;
  }
  el.innerHTML = `${headerHtml}<div class="lightdraw-card-body" aria-hidden="true"></div>`;
  el.style.cssText = positionStyle(node, width, height);
  ctx.applyUiClasses(node, el);
  ctx.seenIds.add(node.id);
}
function escHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function formatTableCell(cell) {
  const lower = cell.toLowerCase();
  if (lower === "active" || lower === "done" || lower === "success") {
    return `<span class="lightdraw-badge lightdraw-badge--success">${escHtml(cell)}</span>`;
  }
  if (lower === "beta" || lower === "pending" || lower === "warning") {
    return `<span class="lightdraw-badge lightdraw-badge--warning">${escHtml(cell)}</span>`;
  }
  if (lower === "error" || lower === "failed" || lower === "inactive") {
    return `<span class="lightdraw-badge lightdraw-badge--danger">${escHtml(cell)}</span>`;
  }
  return escHtml(cell);
}
function sortTableRows(rows, col, dir) {
  return [...rows].sort((a, b) => {
    const av = a[col] ?? "";
    const bv = b[col] ?? "";
    const cmp = av.localeCompare(bv, void 0, { numeric: true, sensitivity: "base" });
    return dir === "asc" ? cmp : -cmp;
  });
}
function absPosition(node, width, height) {
  const w = width !== void 0 ? `width: ${typeof width === "number" ? `${width}px` : width};` : "";
  const h = height !== void 0 ? `height: ${typeof height === "number" ? `${height}px` : height};` : "";
  return `
    position: absolute;
    left: ${node.x}px;
    top: ${node.y}px;
    ${w}
    ${h}
    opacity: ${node.opacity};
    pointer-events: ${node.listening ? "auto" : "none"};
  `;
}
function bindDelegated(el, handler) {
  if (el.dataset.ldDelegated === "1")
    return;
  el.dataset.ldDelegated = "1";
  el.addEventListener("click", handler);
}
var dialogTrapHandlers = /* @__PURE__ */ new WeakMap();
var menuOutsideHandlers = /* @__PURE__ */ new WeakMap();
var tooltipDelayTimers = /* @__PURE__ */ new Map();
function trapDialogFocus(host) {
  const dialog = host.querySelector(".lightdraw-dialog");
  if (!dialog)
    return;
  const focusable = dialog.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusable.length === 0)
    return;
  focusable[0].focus();
  const existing = dialogTrapHandlers.get(host);
  if (existing)
    host.removeEventListener("keydown", existing);
  const handler = (e) => {
    if (e.key !== "Tab")
      return;
    const list = Array.from(focusable);
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  dialogTrapHandlers.set(host, handler);
  host.addEventListener("keydown", handler);
}
function releaseDialogFocus(host) {
  const existing = dialogTrapHandlers.get(host);
  if (existing) {
    host.removeEventListener("keydown", existing);
    dialogTrapHandlers.delete(host);
  }
}
function bindMenuOutsideClose(el, node) {
  const existing = menuOutsideHandlers.get(el);
  if (existing)
    document.removeEventListener("mousedown", existing);
  const handler = (e) => {
    const target = e.target;
    if (target instanceof globalThis.Node && el.contains(target))
      return;
    node.metadata.componentState = { ...getState4(node), open: false };
    node.visible = false;
    node.emit("close", syntheticEvent("close", node));
    node.getApp()?.requestRender();
    document.removeEventListener("mousedown", handler);
    menuOutsideHandlers.delete(el);
  };
  menuOutsideHandlers.set(el, handler);
  setTimeout(() => document.addEventListener("mousedown", handler), 0);
}
function isDangerMenuItem(item, variants, index) {
  if (variants?.[index] === "danger")
    return true;
  const lower = item.toLowerCase();
  return lower === "delete" || lower === "remove" || lower === "danger";
}
function scheduleTooltipShow(node, delayMs, show) {
  const prev = tooltipDelayTimers.get(node.id);
  if (prev !== void 0)
    clearTimeout(prev);
  if (delayMs <= 0) {
    show();
    return;
  }
  const id = window.setTimeout(show, delayMs);
  tooltipDelayTimers.set(node.id, id);
}
function cancelTooltipShow(nodeId) {
  const prev = tooltipDelayTimers.get(nodeId);
  if (prev !== void 0) {
    clearTimeout(prev);
    tooltipDelayTimers.delete(nodeId);
  }
}
function syncNativeTabs(node, parent, ctx) {
  const state = getState4(node);
  const labels = state.tabs ?? ["Tab 1", "Tab 2"];
  const activeTab = Number(state.activeTab ?? 0);
  const width = Number(state.width ?? 300);
  const tabPct = 100 / Math.max(labels.length, 1);
  let el = ctx.nodeElements.get(node.id);
  if (!el) {
    el = document.createElement("div");
    el.id = node.id;
    el.className = "lightdraw-tabs";
    el.setAttribute("role", "tablist");
    parent.appendChild(el);
    bindDelegated(el, (e) => {
      const btn = e.target.closest(".lightdraw-tabs-tab");
      if (!btn)
        return;
      const i = Number(btn.getAttribute("data-index"));
      const tabs = getState4(node).tabs ?? [];
      node.metadata.componentState = { ...getState4(node), activeTab: i };
      node.emit("change", syntheticEvent("change", node, { value: i, tab: tabs[i] }));
      node.getApp()?.requestRender();
    });
    el.addEventListener("keydown", (e) => {
      const key = e.key;
      if (key !== "ArrowLeft" && key !== "ArrowRight" && key !== "Home" && key !== "End")
        return;
      e.preventDefault();
      const tabs = getState4(node).tabs ?? [];
      const cur = Number(getState4(node).activeTab ?? 0);
      let next = cur;
      if (key === "ArrowLeft")
        next = Math.max(0, cur - 1);
      if (key === "ArrowRight")
        next = Math.min(tabs.length - 1, cur + 1);
      if (key === "Home")
        next = 0;
      if (key === "End")
        next = tabs.length - 1;
      node.metadata.componentState = { ...getState4(node), activeTab: next };
      node.emit("change", syntheticEvent("change", node, { value: next, tab: tabs[next] }));
      node.getApp()?.requestRender();
    });
    ctx.nodeElements.set(node.id, el);
  } else if (el.parentElement !== parent) {
    parent.appendChild(el);
  }
  const tabsHtml = labels.map(
    (label, i) => `<button type="button" class="lightdraw-tabs-tab${i === activeTab ? " lightdraw-tabs-tab--active" : ""}" role="tab" aria-selected="${i === activeTab}" tabindex="${i === activeTab ? 0 : -1}" data-index="${i}">${escHtml(label)}</button>`
  ).join("");
  el.innerHTML = `<div class="lightdraw-tabs-inner">${tabsHtml}<span class="lightdraw-tabs-indicator" style="width:${tabPct}%;left:${activeTab * tabPct}%"></span></div>`;
  el.style.cssText = absPosition(node, width, 40);
  ctx.applyA11y(node, el);
  ctx.applyUiClasses(node, el);
  ctx.seenIds.add(node.id);
}
function syncNativeAccordion(node, parent, ctx) {
  const state = getState4(node);
  const sections = state.sections ?? [
    { title: "Section 1", content: "Content 1" },
    { title: "Section 2", content: "Content 2" }
  ];
  const expandedIndex = Number(state.expandedIndex ?? 0);
  const width = Number(state.width ?? 280);
  let el = ctx.nodeElements.get(node.id);
  if (!el) {
    el = document.createElement("div");
    el.id = node.id;
    el.className = "lightdraw-accordion";
    parent.appendChild(el);
    bindDelegated(el, (e) => {
      const btn = e.target.closest(".lightdraw-accordion-trigger");
      if (!btn)
        return;
      const i = Number(btn.getAttribute("data-index"));
      const secs = getState4(node).sections ?? [];
      const cur = Number(getState4(node).expandedIndex ?? 0);
      const next = cur === i ? -1 : i;
      node.metadata.componentState = { ...getState4(node), expandedIndex: next };
      node.emit("change", syntheticEvent("change", node, { value: next, section: secs[i]?.title }));
      node.getApp()?.requestRender();
    });
    ctx.nodeElements.set(node.id, el);
  } else if (el.parentElement !== parent) {
    parent.appendChild(el);
  }
  el.innerHTML = sections.map((sec, i) => {
    const open = i === expandedIndex;
    return `<div class="lightdraw-accordion-item${open ? " lightdraw-accordion-item--open" : ""}">
        <button type="button" class="lightdraw-accordion-trigger" aria-expanded="${open}" data-index="${i}">
          <span class="lightdraw-accordion-chevron" aria-hidden="true"></span>
          <span>${escHtml(sec.title)}</span>
        </button>
        <div class="lightdraw-accordion-panel-wrap">
          <div class="lightdraw-accordion-panel">${escHtml(sec.content)}</div>
        </div>
      </div>`;
  }).join("");
  const openPanel = expandedIndex >= 0 ? 48 : 0;
  const estHeight = sections.length * 44 + openPanel;
  el.style.cssText = absPosition(node, width, estHeight);
  ctx.applyA11y(node, el);
  ctx.applyUiClasses(node, el);
  ctx.seenIds.add(node.id);
}
function syncNativeTable(node, parent, ctx) {
  const state = getState4(node);
  const columns = state.columns ?? ["Name", "Value"];
  const rows = state.rows ?? [["A", "1"]];
  const selectedRow = Number(state.selectedRow ?? -1);
  const colW = Number(state.colWidth ?? 100);
  const width = Number(state.width ?? colW * columns.length);
  const sortable = Boolean(state.sortable);
  const sortColumn = Number(state.sortColumn ?? -1);
  const sortDirection = String(state.sortDirection ?? "asc") === "desc" ? "desc" : "asc";
  const stickyHeader = state.stickyHeader !== false;
  const maxHeight = Number(state.maxHeight ?? 0);
  let displayRows = rows;
  if (sortColumn >= 0 && sortColumn < columns.length) {
    displayRows = sortTableRows(rows, sortColumn, sortDirection);
  }
  let el = ctx.nodeElements.get(node.id);
  if (!el) {
    el = document.createElement("div");
    el.id = node.id;
    el.className = "lightdraw-table-wrap lightdraw-table-wrap--scroll-x";
    el.setAttribute("role", "grid");
    parent.appendChild(el);
    bindDelegated(el, (e) => {
      const th = e.target.closest(".lightdraw-table-th--sortable");
      if (th) {
        const ci = Number(th.getAttribute("data-col"));
        const st = getState4(node);
        const prevCol = Number(st.sortColumn ?? -1);
        const prevDir = String(st.sortDirection ?? "asc");
        const nextDir = prevCol === ci && prevDir === "asc" ? "desc" : "asc";
        node.metadata.componentState = { ...st, sortColumn: ci, sortDirection: nextDir };
        node.emit("change", syntheticEvent("change", node, { value: ci, field: nextDir }));
        node.getApp()?.requestRender();
        return;
      }
      const row = e.target.closest(".lightdraw-table-row");
      if (!row)
        return;
      const ri = Number(row.getAttribute("data-index"));
      const tableRows = getState4(node).rows ?? [];
      node.metadata.componentState = { ...getState4(node), selectedRow: ri };
      node.emit("select", syntheticEvent("select", node, { index: ri, row: tableRows[ri] }));
      node.getApp()?.requestRender();
    });
    ctx.nodeElements.set(node.id, el);
  } else if (el.parentElement !== parent) {
    parent.appendChild(el);
  }
  const head = columns.map((c, ci) => {
    let cls = "lightdraw-table-th";
    if (sortable)
      cls += " lightdraw-table-th--sortable";
    if (sortColumn === ci) {
      cls += sortDirection === "asc" ? " lightdraw-table-th--sorted-asc" : " lightdraw-table-th--sorted-desc";
    }
    const sortIcon = sortable ? '<span class="lightdraw-table-sort-icon" aria-hidden="true"></span>' : "";
    return `<th scope="col" class="${cls}" data-col="${ci}"><span class="lightdraw-table-th-label">${escHtml(c)}</span>${sortIcon}</th>`;
  }).join("");
  const body = displayRows.map((row, ri) => {
    const sourceIndex = rows.indexOf(row);
    const dataIndex = sourceIndex >= 0 ? sourceIndex : ri;
    return `<tr class="lightdraw-table-row${dataIndex === selectedRow ? " lightdraw-table-row--selected" : ""}" data-index="${dataIndex}">${row.map((cell) => `<td>${formatTableCell(cell)}</td>`).join("")}</tr>`;
  }).join("");
  const theadAttr = stickyHeader ? ' class="lightdraw-table-head--sticky"' : "";
  const scrollStyle = maxHeight > 0 ? ` style="max-height:${maxHeight}px"` : "";
  el.className = "lightdraw-table-wrap lightdraw-table-wrap--scroll-x";
  el.innerHTML = `<div class="lightdraw-table-scroll"${scrollStyle}><table class="lightdraw-table"><thead${theadAttr}><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  const tableH = maxHeight > 0 ? maxHeight : 36 * (rows.length + 1);
  el.style.cssText = absPosition(node, width, tableH);
  ctx.applyA11y(node, el);
  ctx.applyUiClasses(node, el);
  ctx.seenIds.add(node.id);
}
function syncNativeTree(node, parent, ctx) {
  const state = getState4(node);
  const nodes = state.nodes ?? [
    { label: "Root", children: [{ label: "Child A" }, { label: "Child B" }] }
  ];
  const expanded = new Set(state.expanded ?? [0]);
  const selectedNode = String(state.selectedNode ?? "");
  let el = ctx.nodeElements.get(node.id);
  if (!el) {
    el = document.createElement("ul");
    el.id = node.id;
    el.className = "lightdraw-tree";
    el.setAttribute("role", "tree");
    parent.appendChild(el);
    bindDelegated(el, (e) => {
      const leaf = e.target.closest(".lightdraw-tree-leaf");
      if (leaf) {
        const key = leaf.getAttribute("data-key") ?? "";
        const st2 = getState4(node);
        node.metadata.componentState = { ...st2, selectedNode: key };
        node.emit("select", syntheticEvent("select", node, { item: key, value: key }));
        node.getApp()?.requestRender();
        return;
      }
      const btn = e.target.closest(".lightdraw-tree-toggle");
      if (!btn)
        return;
      const i = Number(btn.getAttribute("data-index"));
      const st = getState4(node);
      const next = new Set(st.expanded ?? [0]);
      if (next.has(i))
        next.delete(i);
      else
        next.add(i);
      node.metadata.componentState = { ...st, expanded: Array.from(next), selectedNode: `p${i}` };
      node.emit("change", syntheticEvent("change", node, { value: i }));
      node.getApp()?.requestRender();
    });
    ctx.nodeElements.set(node.id, el);
  } else if (el.parentElement !== parent) {
    parent.appendChild(el);
  }
  el.innerHTML = nodes.map((n, i) => {
    const isOpen = expanded.has(i);
    const parentKey = `p${i}`;
    const kids = isOpen && n.children?.length ? `<ul class="lightdraw-tree-children" role="group">${n.children.map((c, ci) => {
      const key = `${parentKey}.c${ci}`;
      return `<li role="none"><button type="button" class="lightdraw-tree-leaf${selectedNode === key ? " lightdraw-tree-leaf--selected" : ""}" data-key="${key}" role="treeitem">${escHtml(c.label)}</button></li>`;
    }).join("")}</ul>` : "";
    return `<li class="lightdraw-tree-node${selectedNode === parentKey ? " lightdraw-tree-node--selected" : ""}" role="none">
        <button type="button" class="lightdraw-tree-toggle" data-index="${i}" aria-label="Toggle ${escHtml(n.label)}" aria-expanded="${isOpen}">
          <span class="lightdraw-tree-chevron${isOpen ? " lightdraw-tree-chevron--open" : ""}" aria-hidden="true"></span>
          <span class="lightdraw-tree-label">${escHtml(n.label)}</span>
        </button>${kids}</li>`;
  }).join("");
  let estHeight = 8;
  nodes.forEach((n, i) => {
    estHeight += 28;
    if (expanded.has(i) && n.children)
      estHeight += n.children.length * 26;
  });
  const treeW = Number(state.width ?? 220);
  el.style.cssText = absPosition(node, treeW, estHeight);
  ctx.applyA11y(node, el);
  ctx.applyUiClasses(node, el);
  ctx.seenIds.add(node.id);
}
function syncNativeToolbar(node, parent, ctx) {
  const state = getState4(node);
  const icons = state.icons ?? [];
  const rawItems = state.items ?? state.buttons ?? ["New", "Open", "Save"];
  const items = [];
  rawItems.forEach((item, i) => {
    if (item === "|" || item === null)
      items.push({ type: "sep" });
    else
      items.push({ type: "btn", label: item, icon: icons[i] });
  });
  let el = ctx.nodeElements.get(node.id);
  if (!el) {
    el = document.createElement("div");
    el.id = node.id;
    el.className = "lightdraw-toolbar";
    el.setAttribute("role", "toolbar");
    parent.appendChild(el);
    bindDelegated(el, (e) => {
      const btn = e.target.closest(".lightdraw-toolbar-btn");
      if (!btn)
        return;
      const label = btn.getAttribute("data-label") ?? "";
      node.emit("select", syntheticEvent("select", node, { item: label }));
    });
    ctx.nodeElements.set(node.id, el);
  } else if (el.parentElement !== parent) {
    parent.appendChild(el);
  }
  let btnIndex = 0;
  el.innerHTML = items.map((item) => {
    if (item.type === "sep")
      return '<span class="lightdraw-toolbar-separator" role="separator" aria-hidden="true"></span>';
    const iconHtml = item.icon ? `<span class="lightdraw-toolbar-icon" aria-hidden="true">${escHtml(item.icon)}</span>` : "";
    const html = `<button type="button" class="lightdraw-toolbar-btn" data-index="${btnIndex}" data-label="${escHtml(item.label)}">${iconHtml}<span>${escHtml(item.label)}</span></button>`;
    btnIndex += 1;
    return html;
  }).join("");
  const width = Number(state.width ?? 0);
  el.style.cssText = absPosition(node, width > 0 ? width : "auto", "auto");
  ctx.applyA11y(node, el);
  ctx.applyUiClasses(node, el);
  ctx.seenIds.add(node.id);
}
function syncNativeToast(node, parent, ctx) {
  const state = getState4(node);
  const message = String(state.message ?? "Notification");
  const variant = String(state.variant ?? "success");
  const position = String(state.position ?? "");
  const dismissible = state.dismissible !== false;
  const icons = {
    success: "\u2713",
    error: "\u2715",
    warning: "!",
    info: "i"
  };
  let el = ctx.nodeElements.get(node.id);
  if (!el) {
    el = document.createElement("div");
    el.id = node.id;
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    parent.appendChild(el);
    el.addEventListener("click", (e) => {
      if (e.target.closest(".lightdraw-toast-dismiss")) {
        node.visible = false;
        node.emit("close", syntheticEvent("close", node));
        node.getApp()?.requestRender();
      }
    });
    ctx.nodeElements.set(node.id, el);
  } else if (el.parentElement !== parent) {
    parent.appendChild(el);
  }
  const posClass = position ? ` lightdraw-toast--${position}` : "";
  if (!node.visible) {
    el.style.display = "none";
    el.className = "lightdraw-toast";
  } else {
    const dismissHtml = dismissible ? '<button type="button" class="lightdraw-toast-dismiss" aria-label="Dismiss">\xD7</button>' : "";
    el.className = `lightdraw-toast lightdraw-toast--${variant}${posClass} lightdraw-toast--enter`;
    el.innerHTML = `<span class="lightdraw-toast-icon" aria-hidden="true">${icons[variant] ?? icons.success}</span><span class="lightdraw-toast-message">${escHtml(message)}</span>${dismissHtml}`;
    el.style.display = "flex";
  }
  let extraPos = "";
  if (position === "top-right")
    extraPos = "right:16px;top:16px;left:auto;";
  else if (position === "bottom-right")
    extraPos = "right:16px;bottom:16px;top:auto;left:auto;";
  else if (position === "bottom-left")
    extraPos = "left:16px;bottom:16px;top:auto;";
  const base = absPosition(node, "auto", 44);
  el.style.cssText = base + extraPos + (node.visible ? "display:flex;" : "display:none;");
  ctx.applyUiClasses(node, el);
  ctx.seenIds.add(node.id);
}
function syncNativeMenu(node, parent, ctx) {
  const state = getState4(node);
  const items = state.items ?? ["Item 1", "Item 2"];
  const variants = state.itemVariants ?? [];
  const triggerLabel = String(state.triggerLabel ?? "Actions");
  const open = Boolean(state.open) && node.visible;
  const width = Number(state.width ?? 180);
  let el = ctx.nodeElements.get(node.id);
  if (!el) {
    el = document.createElement("div");
    el.id = node.id;
    el.className = "lightdraw-menu";
    el.setAttribute("role", "menu");
    parent.appendChild(el);
    bindDelegated(el, (e) => {
      const st = getState4(node);
      const menuItems = st.items ?? [];
      const isOpen = Boolean(st.open) && node.visible;
      const itemBtn = e.target.closest(".lightdraw-menu-item");
      if (itemBtn) {
        e.stopPropagation();
        const i = Number(itemBtn.getAttribute("data-index"));
        node.metadata.componentState = { ...st, open: false, selectedIndex: i };
        node.visible = false;
        node.emit("select", syntheticEvent("select", node, { index: i, item: menuItems[i] }));
        node.getApp()?.requestRender();
        return;
      }
      if (!isOpen && e.target.closest(".lightdraw-menu-trigger")) {
        node.visible = true;
        node.metadata.componentState = { ...st, open: true };
        node.emit("open", syntheticEvent("open", node));
        node.getApp()?.requestRender();
      }
    });
    ctx.nodeElements.set(node.id, el);
  } else if (el.parentElement !== parent) {
    parent.appendChild(el);
  }
  if (open) {
    const panelItems = items.map(
      (item, i) => `<button type="button" class="lightdraw-menu-item${isDangerMenuItem(item, variants, i) ? " lightdraw-menu-item--danger" : ""}" role="menuitem" data-index="${i}">${escHtml(item)}</button>`
    ).join("");
    el.innerHTML = `<div class="lightdraw-menu-panel">${panelItems}</div>`;
    el.classList.add("lightdraw-menu--open");
    bindMenuOutsideClose(el, node);
  } else {
    const outside = menuOutsideHandlers.get(el);
    if (outside) {
      document.removeEventListener("mousedown", outside);
      menuOutsideHandlers.delete(el);
    }
    el.innerHTML = `<button type="button" class="lightdraw-menu-trigger">${escHtml(triggerLabel)} <span aria-hidden="true">\u25BE</span></button>`;
    el.classList.remove("lightdraw-menu--open");
  }
  const height = open ? Math.min(items.length * 36 + 8, 248) : 36;
  el.style.cssText = absPosition(node, width, height);
  ctx.applyA11y(node, el);
  ctx.applyUiClasses(node, el);
  ctx.seenIds.add(node.id);
}
function syncNativeDialog(node, parent, ctx) {
  const state = getState4(node);
  const open = Boolean(state.open) && node.visible;
  const title = String(state.title ?? "Dialog");
  const message = String(state.message ?? "Are you sure you want to continue?");
  const width = Number(state.width ?? 320);
  const overlayW = Number(state.overlayWidth ?? 800);
  const overlayH = Number(state.overlayHeight ?? 600);
  let el = ctx.nodeElements.get(node.id);
  if (!el) {
    el = document.createElement("div");
    el.id = node.id;
    el.className = "lightdraw-dialog-host";
    parent.appendChild(el);
    bindDelegated(el, (e) => {
      const st = getState4(node);
      const isOpen = Boolean(st.open) && node.visible;
      const close = () => {
        releaseDialogFocus(el);
        node.metadata.componentState = { ...getState4(node), open: false };
        node.visible = false;
        node.emit("close", syntheticEvent("close", node));
        node.getApp()?.requestRender();
      };
      if (isOpen) {
        if (e.target.classList.contains("lightdraw-dialog-overlay")) {
          close();
        } else if (e.target.closest(".lightdraw-dialog-close, .lightdraw-dialog-cancel")) {
          close();
        } else if (e.target.closest(".lightdraw-dialog-confirm")) {
          node.emit("change", syntheticEvent("change", node, { value: true }));
          close();
        }
      } else if (e.target.closest(".lightdraw-dialog-open")) {
        node.metadata.componentState = { ...getState4(node), open: true };
        node.visible = true;
        node.emit("open", syntheticEvent("open", node));
        node.getApp()?.requestRender();
      }
    });
    ctx.nodeElements.set(node.id, el);
  } else if (el.parentElement !== parent) {
    parent.appendChild(el);
  }
  if (open) {
    el.className = "lightdraw-dialog-host lightdraw-dialog-host--open";
    el.innerHTML = `<div class="lightdraw-dialog-overlay" style="width:${overlayW}px;height:${overlayH}px;left:${-node.x}px;top:${-node.y}px" role="presentation"></div>
      <div class="lightdraw-dialog-center">
        <div class="lightdraw-dialog" role="dialog" aria-modal="true" aria-labelledby="${node.id}-title" style="max-width:${width}px">
          <div class="lightdraw-dialog-header">
            <h2 class="lightdraw-dialog-title" id="${node.id}-title">${escHtml(title)}</h2>
            <button type="button" class="lightdraw-dialog-close" aria-label="Close">\xD7</button>
          </div>
          <p class="lightdraw-dialog-body">${escHtml(message)}</p>
          <div class="lightdraw-dialog-footer">
            <button type="button" class="lightdraw-btn lightdraw-btn--ghost lightdraw-dialog-cancel">Cancel</button>
            <button type="button" class="lightdraw-btn lightdraw-btn--primary lightdraw-dialog-confirm">Confirm</button>
          </div>
        </div>
      </div>`;
    requestAnimationFrame(() => trapDialogFocus(el));
  } else {
    releaseDialogFocus(el);
    el.className = "lightdraw-dialog-host";
    el.innerHTML = `<button type="button" class="lightdraw-btn lightdraw-btn--secondary lightdraw-dialog-open">Open dialog</button>`;
  }
  el.style.cssText = absPosition(node, open ? overlayW : width, open ? overlayH : 40);
  ctx.applyA11y(node, el);
  ctx.applyUiClasses(node, el);
  ctx.seenIds.add(node.id);
}
function syncNativeTooltip(node, parent, ctx) {
  const state = getState4(node);
  const text = String(state.text ?? "Tooltip");
  const anchor = String(state.anchor ?? "Hover me");
  const placement = String(state.placement ?? "bottom");
  const delay = Number(state.delay ?? 0);
  let el = ctx.nodeElements.get(node.id);
  if (!el) {
    el = document.createElement("div");
    el.id = node.id;
    el.className = "lightdraw-tooltip";
    parent.appendChild(el);
    const show = () => {
      node.visible = true;
      node.emit("open", syntheticEvent("open", node));
      node.getApp()?.requestRender();
    };
    const hide = () => {
      cancelTooltipShow(node.id);
      node.visible = false;
      node.emit("close", syntheticEvent("close", node));
      node.getApp()?.requestRender();
    };
    el.addEventListener("mouseenter", () => scheduleTooltipShow(node, delay, show));
    el.addEventListener("mouseleave", hide);
    el.addEventListener("focusin", () => scheduleTooltipShow(node, delay, show));
    el.addEventListener("focusout", hide);
    ctx.nodeElements.set(node.id, el);
  } else if (el.parentElement !== parent) {
    parent.appendChild(el);
  }
  el.className = `lightdraw-tooltip lightdraw-tooltip--${placement}`;
  el.innerHTML = `<span class="lightdraw-tooltip-anchor" tabindex="0">${escHtml(anchor)}</span>`;
  if (node.visible) {
    el.innerHTML += `<span class="lightdraw-tooltip-bubble" role="tooltip">${escHtml(text)}</span>`;
  }
  el.style.cssText = absPosition(node, "auto", "auto");
  ctx.applyA11y(node, el);
  ctx.applyUiClasses(node, el);
  ctx.seenIds.add(node.id);
}
function syncNativeStatusBar(node, parent, ctx) {
  const state = getState4(node);
  const segments = state.segments ?? ["Ready"];
  const width = Number(state.width ?? 400);
  const primaryIndex = Number(state.primaryIndex ?? 0);
  const mono = Boolean(state.mono);
  let el = ctx.nodeElements.get(node.id);
  if (!el) {
    el = document.createElement("div");
    el.id = node.id;
    el.className = "lightdraw-statusbar";
    el.setAttribute("role", "status");
    parent.appendChild(el);
    ctx.nodeElements.set(node.id, el);
  } else if (el.parentElement !== parent) {
    parent.appendChild(el);
  }
  el.className = `lightdraw-statusbar${mono ? " lightdraw-statusbar--mono" : ""}`;
  el.innerHTML = segments.map(
    (s, i) => `<span class="lightdraw-statusbar-segment${i === primaryIndex ? " lightdraw-statusbar-segment--primary" : ""}">${escHtml(s)}</span>`
  ).join("");
  el.style.cssText = absPosition(node, width, 28);
  ctx.applyA11y(node, el);
  ctx.applyUiClasses(node, el);
  ctx.seenIds.add(node.id);
}
var NATIVE_HTML_COMPONENTS = /* @__PURE__ */ new Set([
  "button",
  "checkbox",
  "toggle",
  "slider",
  "radio",
  "progressBar",
  "card",
  "tabs",
  "accordion",
  "table",
  "tree",
  "toolbar",
  "toast",
  "menu",
  "dialog",
  "tooltip",
  "statusBar"
]);

// src/renderers/HTMLRenderer.ts
var HTMLRenderer = class extends Renderer {
  constructor() {
    super(...arguments);
    this.nodeElements = /* @__PURE__ */ new Map();
    this.innerContainers = /* @__PURE__ */ new Map();
    this.seenIds = /* @__PURE__ */ new Set();
    this.uiTheme = {};
  }
  init(container, options) {
    this.width = options.width;
    this.height = options.height;
    this.background = options.background;
    this.highContrast = options.highContrast ?? false;
    this.uiTheme = options.uiTheme ?? {};
    this.root = document.createElement("div");
    this.root.className = "lightdraw-html-root";
    this.applyRootStyles();
    container.appendChild(this.root);
  }
  /** Replace programmatic theme tokens (re-applied after each layout pass). */
  setUiTheme(tokens) {
    this.uiTheme = { ...tokens };
    this.applyThemeVars();
  }
  applyThemeVars() {
    if (Object.keys(this.uiTheme).length > 0) {
      applyUiTheme(this.root, this.uiTheme);
    }
  }
  applyRootStyles() {
    this.root.style.cssText = `
      position: relative;
      width: ${this.width}px;
      height: ${this.height}px;
      overflow: hidden;
      background: ${this.highContrast ? "#000" : this.background};
    `;
    if (this.highContrast) {
      this.root.classList.add("lightdraw-high-contrast");
      this.root.setAttribute("data-ld-high-contrast", "true");
    } else {
      this.root.classList.remove("lightdraw-high-contrast");
      this.root.removeAttribute("data-ld-high-contrast");
    }
    this.applyThemeVars();
  }
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.applyRootStyles();
    this.forceFullRedraw();
  }
  getElement() {
    return this.root;
  }
  render(root, _cameraMatrix) {
    this.applyRootStyles();
    this.seenIds.clear();
    this.syncGroup(root, this.root);
    this.pruneOrphans(this.root);
    this.clearDirty();
  }
  toDataURL() {
    return "";
  }
  destroy() {
    this.nodeElements.clear();
    this.innerContainers.clear();
    this.root.remove();
  }
  shouldSyncWhenHidden(node) {
    const t = node.metadata?.componentType;
    return t === "tooltip" || t === "menu" || t === "dialog";
  }
  syncGroup(group, parent) {
    group.sortChildren();
    for (const child of group.children) {
      if (!child.visible && !this.shouldSyncWhenHidden(child))
        continue;
      this.syncNode(child, parent);
    }
  }
  resolveRole(node) {
    if (node.role)
      return node.role;
    const componentType = node.metadata?.componentType;
    const roles = {
      button: "button",
      checkbox: "checkbox",
      slider: "slider",
      toggle: "switch",
      progressBar: "progressbar",
      input: "textbox",
      textarea: "textbox",
      radio: "radio",
      menu: "menu",
      dialog: "dialog",
      tabs: "tablist",
      table: "grid",
      tree: "tree",
      toolbar: "toolbar",
      toast: "status",
      statusBar: "status"
    };
    if (componentType && roles[componentType])
      return roles[componentType];
    return "img";
  }
  applyA11y(node, el) {
    const role = this.resolveRole(node);
    el.setAttribute("role", role);
    el.setAttribute("aria-label", node.name || node.metadata?.label || node.type);
    if (node.focusable) {
      el.tabIndex = node.id === this.focusedNodeId ? 0 : -1;
    } else {
      el.removeAttribute("tabindex");
    }
    if (node.id === this.focusedNodeId) {
      el.classList.add("lightdraw-focused");
    } else {
      el.classList.remove("lightdraw-focused");
    }
    if (node.ariaChecked !== void 0) {
      el.setAttribute("aria-checked", String(node.ariaChecked));
    } else {
      el.removeAttribute("aria-checked");
    }
    if (node.ariaValueNow !== void 0) {
      el.setAttribute("aria-valuenow", String(node.ariaValueNow));
    }
    if (node.ariaValueMin !== void 0) {
      el.setAttribute("aria-valuemin", String(node.ariaValueMin));
    }
    if (node.ariaValueMax !== void 0) {
      el.setAttribute("aria-valuemax", String(node.ariaValueMax));
    }
    const live = node.ariaLive ?? node.metadata?.ariaLive;
    if (live && live !== "off") {
      el.setAttribute("aria-live", live);
    } else {
      el.removeAttribute("aria-live");
    }
  }
  nativeCtx() {
    return {
      nodeElements: this.nodeElements,
      seenIds: this.seenIds,
      focusedNodeId: this.focusedNodeId,
      applyA11y: (node, el) => this.applyA11y(node, el),
      applyUiClasses: (node, el) => this.applyUiClasses(node, el)
    };
  }
  syncNativeComponent(node, parent, type) {
    const ctx = this.nativeCtx();
    switch (type) {
      case "button":
        syncNativeButton(node, parent, ctx);
        return true;
      case "checkbox":
        syncNativeCheckbox(node, parent, ctx);
        return true;
      case "toggle":
        syncNativeToggle(node, parent, ctx);
        return true;
      case "slider":
        syncNativeSlider(node, parent, ctx);
        return true;
      case "radio":
        syncNativeRadio(node, parent, ctx);
        return true;
      case "progressBar":
        syncNativeProgress(node, parent, ctx);
        return true;
      case "card":
        syncNativeCard(node, parent, ctx);
        return true;
      case "tabs":
        syncNativeTabs(node, parent, ctx);
        return true;
      case "accordion":
        syncNativeAccordion(node, parent, ctx);
        return true;
      case "table":
        syncNativeTable(node, parent, ctx);
        return true;
      case "tree":
        syncNativeTree(node, parent, ctx);
        return true;
      case "toolbar":
        syncNativeToolbar(node, parent, ctx);
        return true;
      case "toast":
        syncNativeToast(node, parent, ctx);
        return true;
      case "menu":
        syncNativeMenu(node, parent, ctx);
        return true;
      case "dialog":
        syncNativeDialog(node, parent, ctx);
        return true;
      case "tooltip":
        syncNativeTooltip(node, parent, ctx);
        return true;
      case "statusBar":
        syncNativeStatusBar(node, parent, ctx);
        return true;
      default:
        return false;
    }
  }
  syncNode(node, parent) {
    const componentType = node.metadata?.componentType;
    if (componentType === "input") {
      syncNativeInput(node, parent, this.nativeCtx());
      return;
    }
    if (componentType === "textarea") {
      syncNativeTextarea(node, parent, this.nativeCtx());
      return;
    }
    if (componentType && NATIVE_HTML_COMPONENTS.has(componentType)) {
      if (this.syncNativeComponent(node, parent, componentType))
        return;
    }
    if (this.isVectorShape(node)) {
      this.syncVectorShape(node, parent);
      return;
    }
    let el = this.nodeElements.get(node.id);
    if (!el) {
      el = document.createElement("div");
      el.id = node.id;
      parent.appendChild(el);
      this.nodeElements.set(node.id, el);
    } else if (el.parentElement !== parent) {
      parent.appendChild(el);
    }
    this.applyA11y(node, el);
    this.applyUiClasses(node, el);
    let extra = "";
    if (node.shadow)
      extra += `box-shadow: ${shadowToCss(node.shadow)};`;
    if (node.clip)
      extra += "overflow: hidden;";
    el.style.cssText = `
      position: absolute;
      left: ${node.x}px;
      top: ${node.y}px;
      opacity: ${node.opacity};
      transform: rotate(${node.rotation}deg) scale(${node.scaleX}, ${node.scaleY});
      transform-origin: top left;
      pointer-events: ${node.listening ? "auto" : "none"};
      ${node.zIndex !== 0 ? `z-index: ${node.zIndex};` : ""}
      ${extra}
    `;
    this.applyShapeStyles(node, el);
    if (node instanceof TextNode) {
      this.applyTextBoxPosition(node, el);
    }
    this.seenIds.add(node.id);
    if ("children" in node) {
      const bounds = node.getBounds();
      const chartW = node.metadata?.chartWidth ?? node.metadata?.autoWidth;
      const chartH = node.metadata?.chartHeight ?? node.metadata?.autoHeight;
      if (node.metadata?.componentType && bounds.width > 0) {
        el.style.width = `${bounds.width}px`;
        el.style.height = `${Math.max(bounds.height, 1)}px`;
      } else if (chartW && chartW > 0) {
        el.style.height = `${Math.max(chartH ?? chartW, 1)}px`;
        el.style.width = `${chartW}px`;
      }
      let inner = this.innerContainers.get(node.id);
      if (!inner) {
        inner = document.createElement("div");
        inner.style.cssText = "position:relative;width:100%;height:100%;";
        el.appendChild(inner);
        this.innerContainers.set(node.id, inner);
      }
      this.syncGroup(node, inner);
    }
  }
  applyUiClasses(node, el) {
    const t = node.metadata?.componentType;
    if (t) {
      el.classList.add("lightdraw-ui", `lightdraw-ui--${t}`);
    }
    if (node.focusable || t === "button" || t === "checkbox" || t === "radio" || t === "toggle") {
      el.classList.add("lightdraw-interactive");
    }
  }
  isVectorShape(node) {
    return node instanceof Line || node instanceof Polyline || node instanceof Arc || node instanceof Polygon || node instanceof Path;
  }
  syncVectorShape(node, parent) {
    let svg = this.nodeElements.get(node.id);
    if (!svg || svg.tagName !== "svg") {
      svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.id = node.id;
      parent.appendChild(svg);
      this.nodeElements.set(node.id, svg);
    } else if (svg.parentElement !== parent) {
      parent.appendChild(svg);
    }
    this.seenIds.add(node.id);
    const b = node.getBounds();
    const pad = Math.max(Math.ceil(node.strokeWidth || 0), 2) + 1;
    const w = Math.max(b.width + pad * 2, 1);
    const h = Math.max(b.height + pad * 2, 1);
    svg.setAttribute("aria-hidden", "true");
    svg.style.cssText = `
      position: absolute;
      left: ${node.x + b.x - pad}px;
      top: ${node.y + b.y - pad}px;
      width: ${w}px;
      height: ${h}px;
      overflow: visible;
      pointer-events: ${node.listening ? "auto" : "none"};
      opacity: ${node.opacity};
    `;
    while (svg.firstChild)
      svg.removeChild(svg.firstChild);
    const ox = pad - b.x;
    const oy = pad - b.y;
    const strokeColor = node.stroke ? this.strokeToCss(node.stroke) : "#64748b";
    const sw = String(node.strokeWidth || 2);
    const fillColor = node.fill && node.fill !== null && node.fill !== "transparent" ? this.fillToCss(node.fill) : "none";
    if (node instanceof Line) {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", String(ox));
      line.setAttribute("y1", String(oy));
      line.setAttribute("x2", String(node.x2 + ox));
      line.setAttribute("y2", String(node.y2 + oy));
      line.setAttribute("stroke", strokeColor);
      line.setAttribute("stroke-width", sw);
      line.setAttribute("stroke-linecap", node.lineCap);
      svg.appendChild(line);
    } else if (node instanceof Polyline) {
      const pts = node.points.map((v, i) => i % 2 === 0 ? v + ox : v + oy).join(" ");
      const poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
      poly.setAttribute("points", pts);
      poly.setAttribute("stroke", strokeColor);
      poly.setAttribute("stroke-width", sw);
      poly.setAttribute("fill", fillColor);
      poly.setAttribute("stroke-linejoin", node.lineJoin);
      poly.setAttribute("stroke-linecap", node.lineCap);
      svg.appendChild(poly);
    } else if (node instanceof Polygon) {
      const pts = node.points.map((v, i) => i % 2 === 0 ? v + ox : v + oy).join(" ");
      const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      poly.setAttribute("points", pts);
      poly.setAttribute("stroke", strokeColor);
      poly.setAttribute("stroke-width", sw);
      poly.setAttribute("fill", fillColor);
      svg.appendChild(poly);
    } else if (node instanceof Arc) {
      const cx = node.radius + ox;
      const cy = node.radius + oy;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute(
        "d",
        arcSectorPath(cx, cy, node.radius, node.startAngle, node.endAngle, node.innerRadius, node.counterClockwise)
      );
      path.setAttribute("stroke", strokeColor);
      path.setAttribute("stroke-width", sw);
      path.setAttribute("fill", fillColor);
      path.setAttribute("stroke-linecap", node.lineCap);
      svg.appendChild(path);
    } else if (node instanceof Path) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", node.d);
      path.setAttribute("stroke", node.stroke ? strokeColor : "none");
      path.setAttribute("stroke-width", sw);
      path.setAttribute("fill", fillColor);
      path.setAttribute("transform", `translate(${ox}, ${oy})`);
      svg.appendChild(path);
    }
  }
  fillToCss(fill) {
    if (!fill)
      return "transparent";
    if (typeof fill === "string") {
      return this.highContrast ? toHighContrastColor(fill, "fill") : fill;
    }
    if (isGradient(fill))
      return gradientToCss(fill);
    return "transparent";
  }
  strokeToCss(stroke) {
    if (!stroke || typeof stroke !== "string")
      return "#000";
    return this.highContrast ? toHighContrastColor(stroke, "stroke") : stroke;
  }
  applyTextBoxPosition(node, el) {
    const boxW = node.metadata?.textBoxWidth;
    const centerY = node.metadata?.textBoxCenterY;
    if (boxW && boxW > 0 && node.textAlign === "center") {
      el.style.width = `${boxW}px`;
      el.style.textAlign = "center";
      el.style.left = `${node.x - boxW / 2}px`;
      if (centerY !== void 0) {
        el.style.top = `${centerY - node.fontSize / 2}px`;
        el.style.height = `${node.fontSize}px`;
        el.style.lineHeight = `${node.fontSize}px`;
      }
      el.style.zIndex = String(Math.max(node.zIndex, 902));
      return;
    }
    if (node.textAlign && node.textAlign !== "left") {
      el.style.textAlign = node.textAlign;
      const b = node.getBounds();
      el.style.width = `${Math.max(b.width, node.fontSize)}px`;
    }
  }
  applyShapeStyles(node, el) {
    if (node instanceof Rect) {
      el.style.width = `${node.width}px`;
      el.style.height = `${node.height}px`;
      el.style.background = this.fillToCss(node.fill);
      el.style.border = node.stroke ? `${node.strokeWidth}px solid ${this.strokeToCss(node.stroke)}` : "none";
      el.style.borderRadius = node.cornerRadius ? `${node.cornerRadius}px` : "";
    } else if (node instanceof Circle) {
      el.style.width = `${node.radius * 2}px`;
      el.style.height = `${node.radius * 2}px`;
      el.style.borderRadius = "50%";
      el.style.background = this.fillToCss(node.fill);
      el.style.border = node.stroke ? `${node.strokeWidth}px solid ${this.strokeToCss(node.stroke)}` : "none";
    } else if (node instanceof Ellipse) {
      el.style.width = `${node.radiusX * 2}px`;
      el.style.height = `${node.radiusY * 2}px`;
      el.style.borderRadius = "50%";
      el.style.background = this.fillToCss(node.fill);
    } else if (node instanceof TextNode) {
      el.textContent = node.text;
      el.style.font = `${node.fontWeight} ${node.fontSize}px ${node.fontFamily}`;
      el.style.color = this.fillToCss(node.fill);
      el.style.background = "transparent";
      el.style.whiteSpace = "pre";
      el.style.lineHeight = `${Math.max(node.fontSize + 2, 12)}px`;
    } else if (node instanceof Path) {
      const b = node.getBounds();
      el.style.width = `${Math.max(b.width, 1)}px`;
      el.style.height = `${Math.max(b.height, 1)}px`;
      el.style.background = "transparent";
    }
  }
  pruneOrphans(parent) {
    const toRemove = [];
    for (const child of Array.from(parent.children)) {
      if (child.id && !this.seenIds.has(child.id)) {
        toRemove.push(child);
      }
    }
    for (const el of toRemove) {
      this.nodeElements.delete(el.id);
      this.innerContainers.delete(el.id);
      el.remove();
    }
  }
  drawGroup(_group) {
  }
  drawRect(_node) {
  }
  drawCircle(_node) {
  }
  drawText(_node) {
  }
};

// src/modules/html/index.ts
var htmlPlugin = {
  name: "lightdraw-html",
  version: "1.0.0",
  install(_LD) {
    registerRenderer("html", () => new HTMLRenderer());
  }
};

// src/components/registryCore.ts
var registry = {};
function registerComponent(type, factory) {
  registry[type] = factory;
}
function createComponentFromJSON(type, props, app) {
  const factory = registry[type];
  return factory ? factory(props, app) : null;
}

// src/components/interaction.ts
function wirePointerDrag(node, onDrag, onEnd) {
  node.on("mousedown", (event) => {
    const app = node.getApp();
    if (!app)
      return;
    const el = app["renderer"].getElement();
    const move = (e) => {
      const rect = el.getBoundingClientRect();
      const me = e;
      const x = me.clientX - rect.left;
      const y = me.clientY - rect.top;
      const world = app.camera.screenToWorld(x, y);
      onDrag(world.x, world.y, event);
    };
    const up = () => {
      el.removeEventListener("mousemove", move);
      el.removeEventListener("mouseup", up);
      el.removeEventListener("mouseleave", up);
      onEnd?.();
    };
    el.addEventListener("mousemove", move);
    el.addEventListener("mouseup", up);
    el.addEventListener("mouseleave", up);
    onDrag(
      event.worldX,
      event.worldY,
      event
    );
  });
}
function wireToggle(node, field, updateVisual) {
  const toggle = () => {
    const current = Boolean(getState(node)[field]);
    const next = !current;
    setState(node, { [field]: next });
    if (field === "checked" || field === "value") {
      node.ariaChecked = next;
    }
    updateVisual(next);
    emitChange(node, next, field);
  };
  node.on("click", toggle);
}
function wireButtonStates(node, updateVisual) {
  const refresh = (hover, active) => {
    const disabled = Boolean(getState(node).disabled);
    updateVisual({ hover, active, disabled });
  };
  node.on("mouseenter", () => refresh(true, false));
  node.on("mouseleave", () => refresh(false, false));
  node.on("mousedown", () => refresh(true, true));
  node.on("mouseup", () => refresh(true, false));
  node.on("click", (e) => {
    if (getState(node).disabled) {
      e.stopPropagation();
    }
  });
  refresh(false, false);
}
function wireSelectFromList(node, items, field, updateVisual) {
  node.on("click", (event) => {
    const bounds = node.getBounds();
    const localY = event.worldY - node.y;
    const rowHeight = bounds.height / Math.max(items.length, 1);
    const index = Math.floor(localY / rowHeight);
    if (index >= 0 && index < items.length) {
      setState(node, { [field]: index, selectedIndex: index, selectedItem: items[index] });
      updateVisual(index);
      emitChange(node, items[index], field);
      node.emit("select", syntheticEvent("select", node, { index, item: items[index] }));
    }
  });
}
function scheduleAutoDismiss(node, ms, onDismiss) {
  const id = window.setTimeout(() => {
    onDismiss();
    node.emit("close", syntheticEvent("close", node));
    node.getApp()?.requestRender();
  }, ms);
  node.metadata._dismissTimer = id;
}
function trapFocusIn(group) {
  const focusables = group.children.filter((c) => c.focusable);
  if (focusables.length === 0)
    return;
  const app = group.getApp();
  app?.focusNode(focusables[0]);
}

// src/components/theme.ts
var UI = {
  primary: "#2563eb",
  primaryHover: "#1d4ed8",
  primaryActive: "#163eb8",
  primarySubtle: "#eff6ff",
  /** @deprecated Use `primarySubtle` — kept for canvas definitions compatibility */
  primaryMuted: "#eff6ff",
  secondary: "#475569",
  secondaryHover: "#334155",
  success: "#059669",
  successBg: "#ecfdf5",
  warning: "#d97706",
  danger: "#dc2626",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  surfaceInset: "#f1f5f9",
  overlay: "rgba(15, 23, 42, 0.5)",
  border: "#e2e8f0",
  borderStrong: "#cbd5e1",
  borderFocus: "#2563eb",
  text: "#0f172a",
  textSecondary: "#475569",
  textMuted: "#64748b",
  textInverse: "#ffffff",
  textPlaceholder: "#94a3b8",
  radius: 8,
  radiusSm: 6,
  radiusLg: 12,
  radiusFull: 999,
  font: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontSize: 14,
  fontSizeSm: 12,
  fontSizeLg: 16,
  controlHeight: 40,
  inputHeight: 40,
  spaceXs: 4,
  spaceSm: 8,
  spaceMd: 16,
  spaceLg: 24,
  spaceXl: 32,
  shadowSm: { color: "rgba(15, 23, 42, 0.05)", blur: 2, offsetX: 0, offsetY: 1 },
  shadowMd: { color: "rgba(15, 23, 42, 0.08)", blur: 8, offsetX: 0, offsetY: 2 },
  shadowLg: { color: "rgba(15, 23, 42, 0.12)", blur: 20, offsetX: 0, offsetY: 8 },
  shadowPrimary: { color: "rgba(37, 99, 235, 0.28)", blur: 8, offsetX: 0, offsetY: 2 }
};

// src/components/definitions.ts
function createGroup(app, type, props, extra = {}) {
  const group = app.group({
    ...props,
    listening: true,
    metadata: {
      componentType: type,
      componentState: { ...props },
      ...props.metadata ?? {}
    },
    ...extra
  });
  bindApp(group, app);
  return group;
}
function canvasSurface(app, width, height, opts = {}) {
  return app.roundedRect({
    width,
    height,
    cornerRadius: opts.radius ?? UI.radius,
    fill: UI.surface,
    stroke: UI.border,
    strokeWidth: 1,
    shadow: opts.elevated ? UI.shadowLg : UI.shadowSm,
    listening: false
  });
}
registerComponent("button", (props, app) => {
  const width = num(props, "width", 128);
  const size = str(props, "size", "md");
  const height = size === "sm" ? 32 : size === "lg" ? 44 : num(props, "height", UI.controlHeight);
  const fontSize = size === "sm" ? UI.fontSizeSm : size === "lg" ? UI.fontSizeLg : UI.fontSize;
  const label = str(props, "label", "Button");
  const disabled = bool(props, "disabled", false);
  const variant = str(props, "variant", "primary");
  const fill = str(props, "fill", "") || (variant === "secondary" ? UI.secondary : variant === "ghost" ? UI.surface : variant === "danger" ? UI.danger : UI.primary);
  const group = createGroup(app, "button", props, {
    focusable: !disabled,
    role: "button",
    metadata: { componentType: "button", label, componentState: { label, width, height, disabled, fill, variant, size } }
  });
  setState(group, { label, width, height, disabled, fill, variant, size });
  const textColor = variant === "ghost" ? UI.textSecondary : variant === "danger" ? UI.textInverse : UI.textInverse;
  const bg = app.roundedRect({
    width,
    height,
    cornerRadius: UI.radius,
    fill: disabled ? UI.borderStrong : fill,
    stroke: variant === "ghost" ? UI.border : null,
    strokeWidth: variant === "ghost" ? 1 : 0,
    shadow: disabled ? null : variant === "primary" || variant === "danger" ? UI.shadowPrimary : UI.shadowSm
  });
  const text = app.text({
    text: label,
    fontSize,
    fontWeight: "600",
    fill: disabled ? UI.textMuted : textColor,
    x: 0,
    y: (height - fontSize) / 2,
    textAlign: "center"
  });
  group.add(bg, text);
  setParts(group, { bg, text });
  wireButtonStates(group, ({ hover, active, disabled: dis }) => {
    const parts = getParts(group);
    if (dis) {
      parts.bg.fill = UI.borderStrong;
      return group.getApp()?.requestRender();
    }
    const base = fill;
    const hoverColor = variant === "secondary" ? UI.secondaryHover : variant === "ghost" ? UI.surfaceInset : variant === "danger" ? "#b91c1c" : UI.primaryHover;
    const activeColor = variant === "secondary" ? UI.textSecondary : variant === "ghost" ? UI.surfaceMuted : variant === "danger" ? "#991b1b" : UI.primaryActive;
    parts.bg.fill = active ? activeColor : hover ? hoverColor : base;
    group.getApp()?.requestRender();
  });
  return group;
});
registerComponent("label", (props, app) => {
  const node = app.text({
    text: str(props, "text", ""),
    fontSize: num(props, "fontSize", UI.fontSizeSm),
    fontWeight: str(props, "fontWeight", "600"),
    fill: str(props, "color", UI.textMuted),
    ...props
  });
  node.metadata.componentType = "label";
  setState(node, { text: str(props, "text", ""), fontSize: num(props, "fontSize", UI.fontSizeSm) });
  return node;
});
registerComponent("card", (props, app) => {
  const width = num(props, "width", 280);
  const height = num(props, "height", 160);
  const title = props.title;
  const subtitle = str(props, "subtitle", "");
  const elevated = bool(props, "elevated", false);
  const group = createGroup(app, "card", props);
  const bg = canvasSurface(app, width, height, { radius: UI.radiusLg, elevated });
  group.add(bg);
  const headerH = title || subtitle ? 40 : 0;
  if (headerH > 0) {
    group.add(
      app.roundedRect({
        width,
        height: headerH,
        cornerRadius: UI.radiusLg,
        fill: UI.surfaceMuted,
        stroke: UI.border,
        strokeWidth: 1,
        listening: false
      })
    );
    if (title) {
      group.add(
        app.text({
          text: String(title).toUpperCase(),
          fontSize: UI.fontSizeSm,
          fontWeight: "700",
          fill: UI.textMuted,
          x: 16,
          y: 12,
          listening: false
        })
      );
    }
    if (subtitle) {
      group.add(
        app.text({
          text: subtitle,
          fontSize: UI.fontSize,
          fontWeight: "500",
          fill: UI.textSecondary,
          x: 16,
          y: title ? 26 : 12,
          listening: false
        })
      );
    }
  }
  setState(group, { width, height, title: props.title, subtitle, actions: props.actions, elevated: props.elevated });
  return group;
});
registerComponent("progressBar", (props, app) => {
  const width = num(props, "width", 200);
  const size = str(props, "size", "md");
  const height = size === "lg" ? 12 : size === "sm" ? 6 : num(props, "height", 8);
  const value = clamp2(num(props, "value", 0), 0, 100);
  const variant = str(props, "variant", "default");
  const fillColor = variant === "success" ? UI.success : variant === "warning" ? UI.warning : variant === "danger" ? UI.danger : str(props, "fill", UI.primary);
  const group = createGroup(app, "progressBar", props, {
    role: "progressbar",
    ariaValueNow: value,
    ariaValueMin: 0,
    ariaValueMax: 100
  });
  const track = app.roundedRect({ width, height, cornerRadius: height / 2, fill: UI.surfaceInset, listening: false });
  const fillBar = app.roundedRect({
    width: width * value / 100,
    height,
    cornerRadius: height / 2,
    fill: fillColor,
    listening: false
  });
  group.add(track, fillBar);
  if (props.label) {
    group.add(
      app.text({
        text: props.label,
        fontSize: UI.fontSizeSm,
        fontWeight: "600",
        fill: UI.textSecondary,
        x: 0,
        y: -18,
        listening: false
      })
    );
  }
  setParts(group, { track, fillBar });
  setState(group, { width, height, value, label: props.label, variant, size, disabled: props.disabled });
  return group;
});
registerComponent("slider", (props, app) => {
  const width = num(props, "width", 200);
  const min = num(props, "min", 0);
  const max = num(props, "max", 100);
  let value = clamp2(num(props, "value", 50), min, max);
  const group = createGroup(app, "slider", props, {
    focusable: true,
    role: "slider",
    ariaValueNow: value,
    ariaValueMin: min,
    ariaValueMax: max,
    metadata: { componentType: "slider", label: props.label ?? "Slider" }
  });
  const track = app.roundedRect({ width, height: 6, y: 12, cornerRadius: 3, fill: UI.surfaceInset, listening: false });
  const fill = app.roundedRect({ width: 0, height: 6, y: 12, cornerRadius: 3, fill: UI.primary, listening: false });
  const thumb = app.circle({
    x: 0,
    y: 12,
    radius: 10,
    fill: UI.surface,
    stroke: UI.primary,
    strokeWidth: 2,
    shadow: UI.shadowMd,
    listening: false
  });
  group.add(track, fill, thumb);
  setParts(group, { track, fill, thumb });
  const updateVisual = (v) => {
    const pct = (v - min) / (max - min);
    fill.width = width * pct;
    thumb.x = width * pct - 10;
    group.ariaValueNow = v;
    group.getApp()?.requestRender();
  };
  updateVisual(value);
  setState(group, { width, min, max, value, label: props.label, disabled: props.disabled, size: props.size });
  const setValue = (worldX) => {
    const localX = clamp2(worldX - group.x, 0, width);
    const pct = localX / width;
    value = min + pct * (max - min);
    setState(group, { value });
    updateVisual(value);
  };
  wirePointerDrag(group, (wx) => setValue(wx), () => {
    group.emit("change", syntheticEvent("change", group, { value: getState(group).value }));
  });
  return group;
});
registerComponent("checkbox", (props, app) => {
  const checked = bool(props, "checked", false);
  const disabled = bool(props, "disabled", false);
  const group = createGroup(app, "checkbox", props, {
    focusable: !disabled,
    role: "checkbox",
    ariaChecked: checked,
    metadata: { componentType: "checkbox", label: props.label ?? "Checkbox" }
  });
  const box = app.roundedRect({
    width: 20,
    height: 20,
    cornerRadius: 5,
    fill: disabled ? UI.surfaceMuted : checked ? UI.primary : UI.surface,
    stroke: disabled ? UI.border : checked ? UI.primary : UI.borderStrong,
    strokeWidth: 1.5,
    shadow: checked && !disabled ? UI.shadowSm : null,
    listening: false
  });
  const mark = app.text({
    text: "\u2713",
    x: 4,
    y: 1,
    fontSize: 14,
    fontWeight: "bold",
    fill: UI.textInverse,
    visible: checked,
    listening: false
  });
  group.add(box, mark);
  if (props.label) {
    group.add(
      app.text({
        text: props.label,
        x: 30,
        y: 2,
        fontSize: UI.fontSize,
        fill: UI.textSecondary,
        listening: false
      })
    );
  }
  setParts(group, { box, mark });
  setState(group, { checked, label: props.label, disabled, size: props.size });
  if (disabled) {
    group.opacity = 0.55;
    group.listening = false;
    return group;
  }
  wireToggle(group, "checked", (v) => {
    box.fill = v ? UI.primary : UI.surface;
    box.stroke = v ? UI.primary : UI.borderStrong;
    mark.visible = v;
    group.ariaChecked = v;
  });
  return group;
});
registerComponent("toggle", (props, app) => {
  const on = bool(props, "value", false);
  const disabled = bool(props, "disabled", false);
  const group = createGroup(app, "toggle", props, {
    focusable: !disabled,
    role: "switch",
    ariaChecked: on,
    metadata: { componentType: "toggle", label: props.label ?? "Toggle" }
  });
  const track = app.roundedRect({
    width: 48,
    height: 26,
    cornerRadius: 13,
    fill: disabled ? UI.border : on ? UI.primary : UI.borderStrong,
    listening: false
  });
  const knob = app.circle({
    x: on ? 24 : 2,
    y: 3,
    radius: 10,
    fill: UI.surface,
    shadow: UI.shadowMd,
    listening: false
  });
  group.add(track, knob);
  setParts(group, { track, knob });
  setState(group, { value: on, label: props.label, disabled, size: props.size });
  if (disabled) {
    group.opacity = 0.55;
    group.listening = false;
    return group;
  }
  wireToggle(group, "value", (v) => {
    track.fill = v ? UI.primary : UI.borderStrong;
    knob.x = v ? 24 : 2;
    group.ariaChecked = v;
  });
  return group;
});
registerComponent("input", (props, app) => {
  const width = num(props, "width", 240);
  const height = num(props, "height", UI.inputHeight);
  const value = str(props, "value", "");
  const placeholder = str(props, "placeholder", "");
  const disabled = bool(props, "disabled", false);
  const invalid = bool(props, "invalid", false);
  const group = createGroup(app, "input", props, {
    focusable: !disabled,
    role: "textbox",
    metadata: { componentType: "input", label: props.label ?? (placeholder || "Input") }
  });
  const bg = app.roundedRect({
    width,
    height,
    cornerRadius: UI.radius,
    fill: disabled ? UI.surfaceMuted : UI.surface,
    stroke: invalid ? UI.danger : UI.border,
    strokeWidth: invalid ? 2 : 1,
    shadow: disabled ? null : UI.shadowSm,
    listening: false
  });
  const text = app.text({
    text: value || placeholder,
    fontSize: UI.fontSize,
    fill: value ? UI.text : UI.textPlaceholder,
    x: 12,
    y: (height - UI.fontSize) / 2,
    listening: false
  });
  group.add(bg, text);
  setParts(group, { bg, text });
  setState(group, { width, height, value, placeholder, label: props.label, disabled, invalid, error: props.error });
  if (disabled)
    group.opacity = 0.65;
  return group;
});
registerComponent("textarea", (props, app) => {
  const width = num(props, "width", 280);
  const height = num(props, "height", 96);
  const value = str(props, "value", "");
  const disabled = bool(props, "disabled", false);
  const invalid = bool(props, "invalid", false);
  const group = createGroup(app, "textarea", props, {
    focusable: !disabled,
    role: "textbox",
    metadata: { componentType: "textarea", multiline: true }
  });
  const bg = app.roundedRect({
    width,
    height,
    cornerRadius: UI.radius,
    fill: disabled ? UI.surfaceMuted : UI.surface,
    stroke: invalid ? UI.danger : UI.border,
    strokeWidth: invalid ? 2 : 1,
    shadow: disabled ? null : UI.shadowSm,
    listening: false
  });
  const text = app.text({
    text: value || str(props, "placeholder", ""),
    fontSize: UI.fontSize,
    fill: value ? UI.text : UI.textPlaceholder,
    x: 12,
    y: 12,
    listening: false
  });
  group.add(bg, text);
  setParts(group, { bg, text });
  setState(group, { width, height, value, rows: num(props, "rows", 4), label: props.label, placeholder: props.placeholder, disabled, invalid, error: props.error });
  if (disabled)
    group.opacity = 0.65;
  return group;
});
registerComponent("radio", (props, app) => {
  const selected = bool(props, "selected", false);
  const disabled = bool(props, "disabled", false);
  const groupName = str(props, "group", "default");
  const group = createGroup(app, "radio", props, {
    focusable: !disabled,
    role: "radio",
    ariaChecked: selected,
    metadata: { componentType: "radio", group: groupName, label: props.label }
  });
  const outer = app.circle({
    x: 10,
    y: 10,
    radius: 10,
    fill: disabled ? UI.surfaceMuted : UI.surface,
    stroke: disabled ? UI.border : selected ? UI.primary : UI.borderStrong,
    strokeWidth: selected ? 2 : 1.5,
    listening: false
  });
  const inner = app.circle({
    x: 10,
    y: 10,
    radius: 5,
    fill: selected ? UI.primary : "transparent",
    listening: false
  });
  group.add(outer, inner);
  if (props.label) {
    group.add(
      app.text({
        text: props.label,
        x: 28,
        y: 2,
        fontSize: UI.fontSize,
        fill: UI.textSecondary,
        listening: false
      })
    );
  }
  setParts(group, { outer, inner });
  setState(group, { selected, group: groupName, label: props.label, disabled, size: props.size });
  if (disabled) {
    group.opacity = 0.55;
    group.listening = false;
    return group;
  }
  group.on("click", () => {
    setState(group, { selected: true });
    group.ariaChecked = true;
    inner.fill = UI.primary;
    outer.stroke = UI.primary;
    group.emit("change", syntheticEvent("change", group, { value: groupName, payload: groupName }));
    group.getApp()?.requestRender();
  });
  return group;
});
registerComponent("tooltip", (props, app) => {
  const text = str(props, "text", "Tooltip");
  const anchor = str(props, "anchor", "Hover me");
  const placement = str(props, "placement", "bottom");
  const delay = num(props, "delay", 0);
  const group = createGroup(app, "tooltip", props, { visible: bool(props, "visible", false), listening: true });
  const pad = 10;
  const tw = text.length * 7 + pad * 2;
  const bubbleY = placement === "top" ? -36 : placement === "right" ? 4 : 28;
  const bubbleX = placement === "right" ? anchor.length * 7 + 12 : 0;
  const anchorText = app.text({
    text: anchor,
    fontSize: UI.fontSize,
    fill: UI.primary,
    x: 0,
    y: 4,
    listening: false
  });
  const bg = app.roundedRect({
    width: tw,
    height: 32,
    cornerRadius: UI.radiusSm,
    fill: "#1e293b",
    shadow: UI.shadowMd,
    x: bubbleX,
    y: bubbleY,
    listening: false,
    visible: group.visible
  });
  const label = app.text({
    text,
    fontSize: UI.fontSizeSm,
    fill: UI.textInverse,
    x: bubbleX + pad,
    y: bubbleY + 8,
    listening: false,
    visible: group.visible
  });
  group.add(anchorText, bg, label);
  setState(group, { text, anchor, placement, delay, visible: group.visible });
  let delayTimer;
  const show = () => {
    group.visible = true;
    bg.visible = true;
    label.visible = true;
    group.getApp()?.requestRender();
    group.emit("open", syntheticEvent("open", group));
  };
  const hide = () => {
    if (delayTimer !== void 0)
      clearTimeout(delayTimer);
    group.visible = false;
    bg.visible = false;
    label.visible = false;
    group.getApp()?.requestRender();
    group.emit("close", syntheticEvent("close", group));
  };
  group.on("mouseenter", () => {
    if (delay <= 0)
      show();
    else
      delayTimer = setTimeout(show, delay);
  });
  group.on("mouseleave", hide);
  return group;
});
registerComponent("menu", (props, app) => {
  const items = props.items ?? ["Item 1", "Item 2", "Item 3"];
  const variants = props.itemVariants ?? [];
  const open = bool(props, "open", false);
  const rowH = 32;
  const width = num(props, "width", 180);
  const height = Math.min(items.length * rowH + 12, 248);
  const group = createGroup(app, "menu", props, {
    focusable: true,
    role: "menu",
    visible: open,
    metadata: { componentType: "menu", label: props.label ?? "Menu" }
  });
  const bg = app.roundedRect({
    width,
    height,
    cornerRadius: UI.radius,
    fill: UI.surface,
    stroke: UI.border,
    strokeWidth: 1,
    shadow: UI.shadowLg,
    listening: false
  });
  group.add(bg);
  const isDanger = (item, i) => variants[i] === "danger" || ["delete", "remove", "danger"].includes(item.toLowerCase());
  items.forEach((item, i) => {
    group.add(
      app.text({
        text: item,
        x: 14,
        y: 10 + i * rowH,
        fontSize: UI.fontSize,
        fill: isDanger(item, i) ? UI.danger : UI.text,
        listening: false
      })
    );
  });
  setState(group, { items, open, width, selectedIndex: -1, triggerLabel: props.triggerLabel, itemVariants: variants });
  group.on("click", (e) => {
    if (!group.visible) {
      group.visible = true;
      setState(group, { open: true });
      group.emit("open", syntheticEvent("open", group));
    } else {
      e.stopPropagation?.();
    }
    group.getApp()?.requestRender();
  });
  wireSelectFromList(group, items, "selectedIndex", (index) => {
    group.visible = false;
    setState(group, { open: false, selectedIndex: index });
  });
  return group;
});
registerComponent("dialog", (props, app) => {
  const width = num(props, "width", 320);
  const height = num(props, "height", 200);
  const open = bool(props, "open", true);
  const title = str(props, "title", "Dialog");
  const group = createGroup(app, "dialog", props, {
    focusable: true,
    role: "dialog",
    visible: open,
    metadata: { componentType: "dialog", label: title }
  });
  const overlay = app.rect({
    width: num(props, "overlayWidth", 800),
    height: num(props, "overlayHeight", 600),
    fill: UI.overlay,
    x: -num(props, "x", 0),
    y: -num(props, "y", 0),
    listening: true
  });
  const panel = app.roundedRect({
    width,
    height,
    cornerRadius: UI.radiusLg,
    fill: UI.surface,
    stroke: UI.border,
    strokeWidth: 1,
    shadow: UI.shadowLg,
    x: 0,
    y: 0
  });
  const titleText = app.text({
    text: title,
    fontSize: UI.fontSizeLg,
    fontWeight: "bold",
    fill: UI.text,
    x: 20,
    y: 18
  });
  const divider = app.rect({
    width: width - 40,
    height: 1,
    fill: UI.border,
    x: 20,
    y: 48,
    listening: false
  });
  const bodyText = app.text({
    text: str(props, "message", "Are you sure you want to continue?"),
    fontSize: UI.fontSize,
    fill: UI.textSecondary,
    x: 20,
    y: 64,
    listening: false
  });
  group.add(overlay, panel, titleText, divider, bodyText);
  setParts(group, { overlay, panel, titleText });
  setState(group, {
    open,
    title,
    message: str(props, "message", "Are you sure you want to continue?"),
    width,
    height,
    overlayWidth: num(props, "overlayWidth", 800),
    overlayHeight: num(props, "overlayHeight", 600)
  });
  if (open)
    trapFocusIn(group);
  group.on("click", () => {
    if (!getState(group).open) {
      setState(group, { open: true });
      group.visible = true;
      trapFocusIn(group);
      group.emit("open", syntheticEvent("open", group));
      group.getApp()?.requestRender();
    }
  });
  overlay.on("click", (e) => {
    e.stopPropagation();
    setState(group, { open: false });
    group.visible = false;
    group.emit("close", syntheticEvent("close", group));
    group.getApp()?.requestRender();
  });
  return group;
});
registerComponent("tabs", (props, app) => {
  const labels = props.tabs ?? ["Tab 1", "Tab 2"];
  const activeTab = num(props, "activeTab", 0);
  const width = num(props, "width", 300);
  const tabW = width / labels.length;
  const group = createGroup(app, "tabs", props, { focusable: true, role: "tablist" });
  const tabH = 36;
  group.add(
    app.roundedRect({
      width,
      height: tabH + 4,
      cornerRadius: UI.radius,
      fill: UI.surface,
      stroke: UI.border,
      strokeWidth: 1,
      listening: false
    })
  );
  group.add(
    app.roundedRect({
      width: tabW - 8,
      height: 2,
      x: activeTab * tabW + 4,
      y: tabH + 1,
      cornerRadius: 1,
      fill: UI.primary,
      listening: false
    })
  );
  labels.forEach((label, i) => {
    const tab = app.group({ x: i * tabW + 4, y: 2, listening: true, focusable: true, metadata: { tabIndex: i } });
    const active = i === activeTab;
    tab.add(
      app.text({
        text: label,
        fontSize: UI.fontSize,
        fontWeight: active ? "600" : "500",
        fill: active ? UI.primary : UI.textMuted,
        x: (tabW - 8) / 2,
        y: 10,
        textAlign: "center",
        listening: false
      })
    );
    tab.on("click", () => {
      setState(group, { activeTab: i });
      group.emit("change", syntheticEvent("change", group, { value: i, tab: label }));
      group.getApp()?.requestRender();
    });
    group.add(tab);
  });
  setState(group, { tabs: labels, activeTab, width });
  return group;
});
registerComponent("accordion", (props, app) => {
  const sections = props.sections ?? [
    { title: "Section 1", content: "Content 1" },
    { title: "Section 2", content: "Content 2" }
  ];
  const expanded = num(props, "expandedIndex", 0);
  const group = createGroup(app, "accordion", props, { focusable: true });
  sections.forEach((sec, i) => {
    const y = i * 44;
    const header = app.group({ x: 0, y, listening: true, focusable: true });
    const isOpen = i === expanded;
    header.add(
      app.roundedRect({
        width: num(props, "width", 280),
        height: 40,
        cornerRadius: UI.radiusSm,
        fill: isOpen ? UI.primaryMuted : UI.surfaceMuted,
        stroke: UI.border,
        strokeWidth: 1,
        listening: false
      }),
      app.text({
        text: (isOpen ? "\u25BC  " : "\u25B6  ") + sec.title,
        fontSize: UI.fontSize,
        fontWeight: "600",
        fill: UI.text,
        x: 14,
        y: 11,
        listening: false
      })
    );
    header.on("click", () => {
      setState(group, { expandedIndex: i });
      group.emit("change", syntheticEvent("change", group, { value: i, section: sec.title }));
      group.getApp()?.requestRender();
    });
    group.add(header);
    if (i === expanded) {
      group.add(
        app.text({
          text: sec.content,
          x: 14,
          y: y + 46,
          fontSize: UI.fontSize,
          fill: UI.textSecondary,
          listening: false
        })
      );
    }
  });
  setState(group, { sections, expandedIndex: expanded });
  return group;
});
registerComponent("table", (props, app) => {
  const columns = props.columns ?? ["Name", "Value"];
  const rows = props.rows ?? [
    ["Row A", "1"],
    ["Row B", "2"]
  ];
  const colW = num(props, "colWidth", 100);
  const width = num(props, "width", colW * columns.length);
  const rowH = 36;
  const tableH = rowH * (rows.length + 1);
  const sortable = bool(props, "sortable", false);
  const sortColumn = num(props, "sortColumn", -1);
  const sortDirection = str(props, "sortDirection", "asc");
  const selectedRow = num(props, "selectedRow", -1);
  const group = createGroup(app, "table", props, { focusable: true, role: "grid" });
  group.add(canvasSurface(app, width, tableH, { radius: UI.radius }));
  group.add(
    app.rect({
      width,
      height: rowH,
      fill: UI.surfaceMuted,
      stroke: null,
      listening: false
    })
  );
  columns.forEach((col, ci) => {
    const sorted = sortable && sortColumn === ci;
    const arrow = sorted ? sortDirection === "asc" ? " \u25B2" : " \u25BC" : sortable ? " \u21C5" : "";
    group.add(
      app.text({
        text: col.toUpperCase() + arrow,
        x: ci * colW + 14,
        y: 10,
        fontSize: UI.fontSizeSm,
        fontWeight: "bold",
        fill: sorted ? UI.primary : UI.textMuted,
        listening: false
      })
    );
  });
  rows.forEach((row, ri) => {
    const rowY = (ri + 1) * rowH;
    const zebra = ri % 2 === 1;
    const selected = ri === selectedRow;
    if (zebra || selected) {
      group.add(
        app.rect({
          width,
          height: rowH,
          y: rowY,
          fill: selected ? UI.primarySubtle : UI.surfaceMuted,
          opacity: selected ? 1 : 0.5,
          listening: false
        })
      );
    }
    if (selected) {
      group.add(
        app.rect({
          width: 3,
          height: rowH,
          y: rowY,
          fill: UI.primary,
          listening: false
        })
      );
    }
    const rowGroup = app.group({ x: 0, y: rowY, listening: true, metadata: { rowIndex: ri } });
    row.forEach((cell, ci) => {
      rowGroup.add(
        app.text({
          text: cell,
          x: ci * colW + 14,
          y: 10,
          fontSize: UI.fontSize,
          fill: selected ? UI.primary : UI.text,
          listening: false
        })
      );
    });
    rowGroup.on("click", () => {
      setState(group, { selectedRow: ri });
      group.emit("select", syntheticEvent("select", group, { index: ri, row }));
      group.getApp()?.requestRender();
    });
    group.add(rowGroup);
  });
  setState(group, {
    columns,
    rows,
    selectedRow,
    colWidth: colW,
    width,
    sortable,
    sortColumn,
    sortDirection,
    stickyHeader: bool(props, "stickyHeader", true),
    maxHeight: num(props, "maxHeight", 0)
  });
  return group;
});
registerComponent("tree", (props, app) => {
  const nodes = props.nodes ?? [
    { label: "Root", children: [{ label: "Child A" }, { label: "Child B" }] }
  ];
  const expanded = new Set(props.expanded ?? [0]);
  const selectedNode = str(props, "selectedNode", "");
  const width = num(props, "width", 220);
  const group = createGroup(app, "tree", props, { focusable: true, role: "tree" });
  let y = 4;
  nodes.forEach((node, i) => {
    const parentKey = `p${i}`;
    const parentSelected = selectedNode === parentKey;
    const header = app.group({ x: 0, y, listening: true, metadata: { treeKey: parentKey } });
    if (parentSelected) {
      header.add(
        app.roundedRect({
          width,
          height: 24,
          cornerRadius: UI.radiusSm,
          fill: UI.primarySubtle,
          listening: false
        })
      );
    }
    header.add(
      app.text({
        text: (expanded.has(i) ? "\u25BE  " : "\u25B8  ") + node.label,
        fontSize: UI.fontSize,
        fontWeight: "600",
        fill: parentSelected ? UI.primary : UI.text,
        x: 8,
        y: 4,
        listening: false
      })
    );
    header.on("click", () => {
      if (expanded.has(i))
        expanded.delete(i);
      else
        expanded.add(i);
      setState(group, { expanded: Array.from(expanded), selectedNode: parentKey });
      group.emit("change", syntheticEvent("change", group, { value: i }));
      group.getApp()?.requestRender();
    });
    group.add(header);
    y += 26;
    if (expanded.has(i) && node.children) {
      group.add(
        app.rect({
          x: 10,
          y,
          width: 1,
          height: node.children.length * 22,
          fill: UI.border,
          listening: false
        })
      );
      node.children.forEach((child, ci) => {
        const key = `${parentKey}.c${ci}`;
        const leafSelected = selectedNode === key;
        const leaf = app.group({ x: 18, y, listening: true, metadata: { treeKey: key } });
        if (leafSelected) {
          leaf.add(
            app.roundedRect({
              width: width - 22,
              height: 22,
              cornerRadius: UI.radiusSm,
              fill: UI.primarySubtle,
              listening: false
            })
          );
          leaf.add(
            app.rect({
              width: 3,
              height: 22,
              fill: UI.primary,
              listening: false
            })
          );
        }
        leaf.add(
          app.text({
            text: child.label,
            x: leafSelected ? 10 : 8,
            y: 4,
            fontSize: UI.fontSize,
            fill: leafSelected ? UI.primary : UI.textSecondary,
            listening: false
          })
        );
        leaf.on("click", (e) => {
          e.stopPropagation?.();
          setState(group, { selectedNode: key });
          group.emit("select", syntheticEvent("select", group, { item: child.label, value: key }));
          group.getApp()?.requestRender();
        });
        group.add(leaf);
        y += 22;
      });
    }
  });
  setState(group, { nodes, expanded: Array.from(expanded), selectedNode, width });
  return group;
});
registerComponent("toolbar", (props, app) => {
  const rawItems = props.items ?? props.buttons ?? ["New", "Open", "Save"];
  const icons = props.icons ?? [];
  const group = createGroup(app, "toolbar", props, { focusable: true, role: "toolbar" });
  let x = 0;
  let iconIdx = 0;
  rawItems.forEach((item) => {
    if (item === "|" || item === null) {
      group.add(
        app.rect({
          x: x + 2,
          y: 6,
          width: 1,
          height: 20,
          fill: UI.border,
          listening: false
        })
      );
      x += 8;
      return;
    }
    const icon = icons[iconIdx] ? `${icons[iconIdx]} ` : "";
    iconIdx += 1;
    const label = item;
    const btnW = Math.max((icon + label).length * 8 + 24, 68);
    const btn = createGroup(app, "button", { label, width: btnW, height: 32, variant: "ghost" }, { x, y: 0, focusable: true, role: "button" });
    btn.add(
      app.roundedRect({
        width: btnW,
        height: 32,
        cornerRadius: UI.radiusSm,
        fill: UI.surface,
        stroke: UI.border,
        strokeWidth: 1,
        shadow: UI.shadowSm,
        listening: false
      }),
      app.text({
        text: icon + label,
        fontSize: UI.fontSizeSm,
        fontWeight: "600",
        fill: UI.textSecondary,
        x: 0,
        y: 8,
        textAlign: "center"
      })
    );
    btn.on("click", () => {
      group.emit("select", syntheticEvent("select", group, { item: label }));
    });
    group.add(btn);
    x += btnW + 4;
  });
  setState(group, { buttons: rawItems.filter((i) => i && i !== "|"), items: rawItems, icons, width: props.width });
  return group;
});
registerComponent("toast", (props, app) => {
  const message = str(props, "message", "Notification");
  const variant = str(props, "variant", "success");
  const position = str(props, "position", "");
  const dismissible = bool(props, "dismissible", true);
  const duration = num(props, "duration", 3e3);
  const fills = {
    success: "#1e293b",
    error: "#450a0a",
    warning: "#451a03",
    info: "#0c2340"
  };
  const group = createGroup(app, "toast", props, {
    role: "status",
    ariaLive: "polite",
    metadata: { componentType: "toast", ariaLive: "polite" }
  });
  const tw = Math.max(message.length * 7 + 32, 160);
  group.add(
    app.roundedRect({
      width: tw,
      height: 40,
      cornerRadius: UI.radius,
      fill: fills[variant] ?? fills.success,
      shadow: UI.shadowLg,
      listening: false
    }),
    app.text({ text: message, fontSize: UI.fontSize, fill: UI.textInverse, x: 16, y: 11, listening: false })
  );
  setState(group, { message, duration, variant, position, dismissible });
  group.emit("open", syntheticEvent("open", group));
  scheduleAutoDismiss(group, duration, () => {
    group.visible = false;
  });
  return group;
});
registerComponent("statusBar", (props, app) => {
  const segments = props.segments ?? ["Ready", "Line 1", "UTF-8"];
  const width = num(props, "width", 400);
  const height = 28;
  const primaryIndex = num(props, "primaryIndex", 0);
  const mono = bool(props, "mono", false);
  const group = createGroup(app, "statusBar", props, { role: "status" });
  group.add(
    app.rect({
      width,
      height,
      fill: "#1e293b",
      stroke: "#334155",
      strokeWidth: 1,
      listening: false
    })
  );
  const segW = width / segments.length;
  segments.forEach((seg, i) => {
    if (i === primaryIndex) {
      group.add(
        app.rect({
          x: i * segW,
          y: 0,
          width: segW,
          height,
          fill: "rgba(59, 130, 246, 0.2)",
          listening: false
        })
      );
    }
    group.add(
      app.text({
        text: seg,
        x: i * segW + 12,
        y: 6,
        fontSize: mono ? 11 : UI.fontSizeSm,
        fontFamily: mono ? "monospace" : UI.font,
        fontWeight: i === primaryIndex ? "600" : "500",
        fill: i === primaryIndex ? "#e2e8f0" : "#94a3b8",
        listening: false
      })
    );
  });
  setState(group, { segments, width, primaryIndex, mono });
  return group;
});

// src/modules/ui/index.ts
var uiPlugin = {
  name: "lightdraw-ui",
  version: "1.0.0",
  install(LD) {
    registerJSONResolver((type, props, app) => createComponentFromJSON(type, props, app));
    LD.registerComponent = registerComponent;
  }
};

// src/dashboard/charts/core/refresh.ts
function clearChartWidgetListeners(group) {
  group.off("mousemove");
  group.off("mouseleave");
  group.off("click");
  group.off("wheel");
}
function installChartRebuild(group, app, build) {
  const rebuild = () => {
    clearChartWidgetListeners(group);
    for (const child of [...group.children]) {
      group.remove(child);
    }
    build(group, app, { ...getState2(group) });
    app.requestRender();
  };
  group.metadata.chartRebuild = rebuild;
  setRefresh(group, () => rebuild());
  rebuild();
}
function installRegistryChartRebuild(group, app, factory) {
  const rebuild = () => {
    clearChartWidgetListeners(group);
    const props = { ...getState2(group), x: group.x, y: group.y };
    for (const child of [...group.children]) {
      group.remove(child);
    }
    const fresh = factory(props, app);
    for (const child of [...fresh.children]) {
      fresh.remove(child);
      group.add(child);
    }
    group.metadata._parts = fresh.metadata._parts;
    group.metadata.widgetState = fresh.metadata.widgetState;
    app.requestRender();
  };
  group.metadata.chartRebuild = rebuild;
  setRefresh(group, () => rebuild());
}
function updateChartProps(group, patch) {
  setState2(group, patch);
  const rebuild = group.metadata?.chartRebuild;
  rebuild?.();
}
function pushChartValue(group, value, maxPoints = 64) {
  const state = getState2(group);
  const data = Array.isArray(state.data) ? [...state.data] : [];
  data.push(value);
  while (data.length > maxPoints)
    data.shift();
  const patch = { data };
  if (Array.isArray(state.series) && state.series.length) {
    patch.series = state.series.map(
      (s, i) => i === 0 ? { ...s, data: [...data] } : { ...s, data: [...s.data ?? []] }
    );
  }
  updateChartProps(group, patch);
}

// src/dashboard/registryCore.ts
var registry2 = {};
function registerDashboard(type, factory) {
  registry2[type] = factory;
}
function createDashboardFromJSON(type, props, app) {
  const factory = registry2[type];
  if (!factory)
    return null;
  const node = factory(props, app);
  if (node && "children" in node && node.metadata?.widgetType && !node.metadata.chartRebuild) {
    installRegistryChartRebuild(node, app, factory);
  }
  return node;
}

// src/dashboard/charts/core/scales.ts
function linearScale(domain, range) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  return (v) => r0 + (v - d0) / span * (r1 - r0);
}
function bandWidth(count, range, gap = 0.2) {
  const step = range / Math.max(count, 1);
  return step * (1 - gap);
}
function polarToXY(cx, cy, r, angle) {
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

// src/dashboard/theme.ts
var DASHBOARD = {
  panel: "#151d2e",
  panelStroke: "#2a3654",
  face: "#0f172a",
  text: "#e2e8f0",
  textMuted: "#94a3b8",
  textDim: "#64748b",
  primary: "#3b82f6",
  secondary: "#ef4444",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  dangerDark: "#dc2626",
  inactive: "#374151",
  inactiveBar: "#475569",
  gaugeTrack: "#374151",
  gaugeNeedle: "#3b82f6",
  speedoNeedle: "#ef4444",
  chartBg: "#111827",
  chartGrid: "#334155",
  chartAxis: "#64748b",
  chartLine: "#3b82f6",
  chartArea: "rgba(59, 130, 246, 0.35)",
  chartPlot: "#0f172a",
  chartTooltipBg: "#1e293b",
  chartTooltipBorder: "#475569",
  chartCrosshair: "rgba(148, 163, 184, 0.6)",
  chartDot: "#60a5fa",
  barFill: "#3b82f6",
  compassFace: "#1c2740",
  compassRing: "#475569",
  compassHub: "#334155",
  thermometerTube: "#334155",
  thermometerBorder: "#475569",
  meterTrack: "#374151",
  meterFill: "#3b82f6",
  clockFace: "#1f2937",
  clockRing: "#374151",
  clockHand: "#e2e8f0",
  clockSecond: "#ef4444",
  batteryOutline: "#475569",
  batteryTip: "#475569",
  knobTrack: "#374151",
  knobRing: "#1f2937",
  knobIndicator: "#f59e0b",
  knobArc: "rgba(245, 158, 11, 0.25)",
  clockTick: "#64748b",
  clockTickMajor: "#94a3b8",
  clockHub: "#374151",
  signalActive: "#22c55e",
  signalInactive: "#475569",
  pieStroke: "#1f2937",
  timelineLine: "#475569",
  timelineDot: "#3b82f6",
  highlight: "#3b82f6",
  series: ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b"],
  financialUp: "#22c55e",
  financialDown: "#ef4444",
  flowLink: "rgba(59, 130, 246, 0.45)",
  heatmapLow: "#1e3a5f",
  heatmapHigh: "#60a5fa"
};

// src/dashboard/chartPrimitives.ts
function chartLocalPoint(group, worldX, worldY) {
  const inv = group.getWorldMatrix().invert();
  if (inv)
    return inv.transformPoint(worldX, worldY);
  return { x: worldX - group.x, y: worldY - group.y };
}
function computeTicks(min, max, count = 5) {
  if (count < 2)
    return [min];
  if (min === max)
    return [min, max];
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, i) => Math.round((min + i * step) * 100) / 100);
}
function dataBounds(data, minY, maxY) {
  const dataMin = data.length ? Math.min(...data) : 0;
  const dataMax = data.length ? Math.max(...data) : 1;
  const min = minY ?? Math.min(dataMin, 0);
  let max = maxY ?? dataMax;
  if (max <= min)
    max = min + 1;
  return { min, max };
}
function defaultLayout(width, height, padding = 30, legendHeight = 0) {
  const legendH = Math.max(0, legendHeight);
  return {
    plotX: padding,
    plotY: 10,
    plotWidth: Math.max(8, width - padding - 10),
    plotHeight: Math.max(8, height - padding - 10 - legendH)
  };
}
function seriesToPoints(data, layout, bounds) {
  const step = layout.plotWidth / Math.max(data.length - 1, 1);
  const range = bounds.max - bounds.min || 1;
  const points = [];
  for (let i = 0; i < data.length; i++) {
    points.push(
      layout.plotX + i * step,
      layout.plotY + layout.plotHeight - (data[i] - bounds.min) / range * layout.plotHeight
    );
  }
  return points;
}
function areaPathFromPoints(points, baselineY) {
  if (points.length < 4)
    return "";
  let d = `M ${points[0]} ${points[1]}`;
  for (let i = 2; i < points.length; i += 2) {
    d += ` L ${points[i]} ${points[i + 1]}`;
  }
  const lastX = points[points.length - 2];
  d += ` L ${lastX} ${baselineY} L ${points[0]} ${baselineY} Z`;
  return d;
}
function addGridLines(app, group, layout, yTicks, bounds, xDivisions = 4) {
  const range = bounds.max - bounds.min || 1;
  for (const tick2 of yTicks) {
    const y = layout.plotY + layout.plotHeight - (tick2 - bounds.min) / range * layout.plotHeight;
    group.add(
      app.line({
        x: layout.plotX,
        y,
        x2: layout.plotWidth,
        y2: 0,
        stroke: DASHBOARD.chartGrid,
        strokeWidth: 1,
        dash: [4, 4],
        listening: false
      })
    );
  }
  for (let i = 0; i <= xDivisions; i++) {
    const x = layout.plotX + layout.plotWidth / xDivisions * i;
    group.add(
      app.line({
        x,
        y: layout.plotY,
        x2: 0,
        y2: layout.plotHeight,
        stroke: DASHBOARD.chartGrid,
        strokeWidth: 1,
        dash: [4, 4],
        listening: false
      })
    );
  }
}
function addAxes(app, group, layout, bounds, yTicks, tickCount = 5) {
  group.add(
    app.line({
      x: layout.plotX,
      y: layout.plotY,
      x2: 0,
      y2: layout.plotHeight,
      stroke: DASHBOARD.chartAxis,
      strokeWidth: 1,
      listening: false
    })
  );
  group.add(
    app.line({
      x: layout.plotX,
      y: layout.plotY + layout.plotHeight,
      x2: layout.plotWidth,
      y2: 0,
      stroke: DASHBOARD.chartAxis,
      strokeWidth: 1,
      listening: false
    })
  );
  const range = bounds.max - bounds.min || 1;
  const ticks = yTicks.length ? yTicks : computeTicks(bounds.min, bounds.max, tickCount);
  for (const tick2 of ticks) {
    const y = layout.plotY + layout.plotHeight - (tick2 - bounds.min) / range * layout.plotHeight;
    group.add(
      app.text({
        text: String(tick2),
        x: 2,
        y: y - 6,
        fontSize: 10,
        fill: DASHBOARD.textMuted,
        listening: false
      })
    );
  }
}
function addLegend(app, group, items, x, y) {
  items.forEach((item, i) => {
    const ly = y + i * 18;
    group.add(
      app.rect({ x, y: ly, width: 12, height: 12, fill: item.color, listening: false }),
      app.text({ text: item.label, x: x + 16, y: ly - 1, fontSize: 11, fill: DASHBOARD.text, listening: false })
    );
  });
}
function nearestDataIndex(data, layout, localX) {
  return nearestPlotIndex(data.length, layout, localX);
}
function nearestPlotIndex(count, layout, localX) {
  if (count <= 0)
    return 0;
  const step = layout.plotWidth / Math.max(count - 1, 1);
  const idx = Math.round((localX - layout.plotX) / step);
  return Math.max(0, Math.min(count - 1, idx));
}
function barIndexAtX(count, layout, localX) {
  const step = layout.plotWidth / Math.max(count, 1);
  if (step <= 0)
    return 0;
  const idx = Math.floor((localX - layout.plotX) / step);
  return Math.max(0, Math.min(count - 1, idx));
}
function barGeometry(index, count, value, layout, bounds, gap = 0.2) {
  const step = layout.plotWidth / Math.max(count, 1);
  const bw = bandWidth(count, layout.plotWidth, gap);
  const range = bounds.max - bounds.min || 1;
  const height = (value - bounds.min) / range * layout.plotHeight;
  const x = layout.plotX + index * step + (step - bw) / 2;
  const y = layout.plotY + layout.plotHeight - height;
  return { x, y, width: bw, height, centerX: x + bw / 2 };
}
function barIndexAtY(count, layout, localY) {
  const slot = layout.plotHeight / Math.max(count, 1);
  if (slot <= 0)
    return 0;
  const idx = Math.floor((localY - layout.plotY) / slot);
  return Math.max(0, Math.min(count - 1, idx));
}
function stackedHorizontalBarGeometry(index, count, total, layout, bounds, gap = 0.2) {
  const slot = layout.plotHeight / Math.max(count, 1);
  const bh = bandWidth(count, layout.plotHeight, gap);
  const xScale = linearScale([bounds.min, bounds.max], [0, layout.plotWidth]);
  const x0 = layout.plotX + xScale(bounds.min);
  const x1 = layout.plotX + xScale(total);
  const y = layout.plotY + index * slot + (slot - bh) / 2;
  return { x: x0, y, width: Math.max(1, x1 - x0), height: bh, centerY: y + bh / 2 };
}
var CHART_TOOLTIP_PAD_X = 8;
var CHART_TOOLTIP_PAD_Y = 5;
var CHART_TOOLTIP_LINE_H = 13;
var CHART_TOOLTIP_MAX_W = 200;
function chartTooltipSize(label) {
  const lines2 = label.split("\n");
  const maxLen = Math.max(...lines2.map((l) => l.length), 1);
  const width = Math.min(
    CHART_TOOLTIP_MAX_W,
    Math.max(40, Math.ceil(maxLen * 6.2) + CHART_TOOLTIP_PAD_X * 2)
  );
  const height = Math.max(22, lines2.length * CHART_TOOLTIP_LINE_H + CHART_TOOLTIP_PAD_Y * 2);
  return { width, height };
}
function positionChartTooltip(tooltip, tooltipLabel, centerX, topY, label, chartBounds) {
  const trimmed = label.trim();
  if (!trimmed) {
    hideChartTooltip(tooltip, tooltipLabel);
    return;
  }
  const { width: tw, height: th } = chartTooltipSize(trimmed);
  let x = centerX - tw / 2;
  let y = topY;
  if (chartBounds) {
    x = Math.max(4, Math.min(x, chartBounds.width - tw - 4));
    y = Math.max(4, Math.min(y, chartBounds.height - th - 4));
  }
  tooltip.x = x;
  tooltip.y = y;
  tooltip.width = tw;
  tooltip.height = th;
  tooltip.visible = true;
  tooltipLabel.text = trimmed;
  tooltipLabel.textAlign = "center";
  tooltipLabel.x = x + tw / 2;
  const lines2 = trimmed.split("\n");
  const textBlockH = lines2.length * CHART_TOOLTIP_LINE_H;
  tooltipLabel.y = y + Math.max(CHART_TOOLTIP_PAD_Y, (th - textBlockH) / 2);
  tooltipLabel.visible = true;
  tooltipLabel.zIndex = Math.max(tooltipLabel.zIndex, 902);
  tooltipLabel.metadata = { ...tooltipLabel.metadata, textBoxWidth: tw, chartTooltipLabel: true };
}
function hideChartTooltip(tooltip, tooltipLabel) {
  tooltip.visible = false;
  tooltipLabel.visible = false;
}
function wireChartInteraction(group, data, layout, bounds, parts) {
  let hoverIndex = -1;
  const updateHover = (localX) => {
    const idx = nearestDataIndex(data, layout, localX);
    if (idx === hoverIndex && parts.tooltip.visible)
      return;
    hoverIndex = idx;
    const pts = seriesToPoints(data, layout, bounds);
    const px = pts[idx * 2];
    const py = pts[idx * 2 + 1];
    const val = data[idx];
    const label = String(val);
    parts.crosshair.x = px;
    parts.crosshair.y = layout.plotY;
    parts.crosshair.x2 = 0;
    parts.crosshair.y2 = layout.plotHeight;
    parts.crosshair.visible = true;
    parts.dot.x = px - 4;
    parts.dot.y = py - 4;
    parts.dot.visible = true;
    positionChartTooltip(parts.tooltip, parts.tooltipLabel, px, py - 36, label, {
      width: layout.plotX + layout.plotWidth + 10,
      height: layout.plotY + layout.plotHeight + 30
    });
    parts.crosshair.markDirty();
    parts.dot.markDirty();
    parts.tooltip.markDirty();
    parts.tooltipLabel.markDirty();
    group.markDirty();
    group.emit("hover", syntheticEvent("hover", group, { index: idx, value: val }));
    group.getApp()?.requestRender();
  };
  const clearHover = () => {
    if (hoverIndex < 0 && !parts.tooltip.visible)
      return;
    hoverIndex = -1;
    parts.crosshair.visible = false;
    parts.dot.visible = false;
    hideChartTooltip(parts.tooltip, parts.tooltipLabel);
    parts.crosshair.markDirty();
    parts.dot.markDirty();
    parts.tooltip.markDirty();
    parts.tooltipLabel.markDirty();
    group.markDirty();
    group.getApp()?.requestRender();
  };
  const localXFrom = (e) => chartLocalPoint(group, e.worldX, e.worldY).x;
  group.on("mousemove", (e) => {
    updateHover(localXFrom(e));
  });
  group.on("mouseleave", clearHover);
  parts.hitArea.on("mousemove", (e) => {
    updateHover(localXFrom(e));
  });
  parts.hitArea.on("mouseleave", clearHover);
  group.on("click", (e) => {
    const idx = nearestDataIndex(data, layout, localXFrom(e));
    group.emit("select", syntheticEvent("select", group, { index: idx, value: data[idx] }));
  });
}
function wireMultiSeriesChartInteraction(group, seriesList, layout, bounds, parts) {
  const primaryData = seriesList[0]?.data ?? [];
  const pointCount = Math.max(...seriesList.map((s) => s.data.length), 1);
  let hoverIndex = -1;
  const updateHover = (localX) => {
    const idx = nearestPlotIndex(pointCount, layout, localX);
    if (idx === hoverIndex && parts.tooltip.visible)
      return;
    hoverIndex = idx;
    const label = seriesList.map((s) => `${s.name ?? "Series"}: ${s.data[idx] ?? "\u2014"}`).join("\n");
    const anchor = primaryData.length ? primaryData : seriesList[0]?.data ?? [0];
    const pts = seriesToPoints(anchor, layout, bounds);
    const px = pts[idx * 2] ?? layout.plotX;
    const py = pts[idx * 2 + 1] ?? layout.plotY;
    parts.crosshair.x = px;
    parts.crosshair.y = layout.plotY;
    parts.crosshair.x2 = 0;
    parts.crosshair.y2 = layout.plotHeight;
    parts.crosshair.visible = true;
    parts.dot.x = px - 4;
    parts.dot.y = py - 4;
    parts.dot.visible = true;
    positionChartTooltip(parts.tooltip, parts.tooltipLabel, px, py - 36, label, {
      width: layout.plotX + layout.plotWidth + 10,
      height: layout.plotY + layout.plotHeight + 30
    });
    parts.crosshair.markDirty();
    parts.dot.markDirty();
    parts.tooltip.markDirty();
    parts.tooltipLabel.markDirty();
    group.markDirty();
    group.emit("hover", syntheticEvent("hover", group, { index: idx, series: seriesList.map((s) => s.data[idx]) }));
    group.getApp()?.requestRender();
  };
  const clearHover = () => {
    if (hoverIndex < 0 && !parts.tooltip.visible)
      return;
    hoverIndex = -1;
    parts.crosshair.visible = false;
    parts.dot.visible = false;
    hideChartTooltip(parts.tooltip, parts.tooltipLabel);
    parts.crosshair.markDirty();
    parts.dot.markDirty();
    parts.tooltip.markDirty();
    parts.tooltipLabel.markDirty();
    group.markDirty();
    group.getApp()?.requestRender();
  };
  const localXFrom = (e) => chartLocalPoint(group, e.worldX, e.worldY).x;
  group.on("mousemove", (e) => {
    updateHover(localXFrom(e));
  });
  group.on("mouseleave", clearHover);
  parts.hitArea.on("mousemove", (e) => {
    updateHover(localXFrom(e));
  });
  parts.hitArea.on("mouseleave", clearHover);
  group.on("click", (e) => {
    const idx = nearestPlotIndex(pointCount, layout, localXFrom(e));
    group.emit("select", syntheticEvent("select", group, { index: idx, series: seriesList.map((s) => s.data[idx]) }));
  });
}
function wireBarChartInteraction(group, data, layout, bounds, gap = 0.2, parts) {
  const count = data.length;
  let hoverIndex = -1;
  const updateHover = (localX) => {
    const idx = barIndexAtX(count, layout, localX);
    if (idx === hoverIndex && parts.tooltip.visible)
      return;
    hoverIndex = idx;
    const val = data[idx];
    const geo = barGeometry(idx, count, val, layout, bounds, gap);
    const label = String(val);
    parts.highlight.x = geo.x;
    parts.highlight.y = geo.y;
    const hi = parts.highlight;
    hi.width = geo.width;
    hi.height = geo.height;
    parts.highlight.visible = true;
    positionChartTooltip(parts.tooltip, parts.tooltipLabel, geo.centerX, geo.y - 32, label, {
      width: layout.plotX + layout.plotWidth + 10,
      height: layout.plotY + layout.plotHeight + 30
    });
    parts.highlight.markDirty();
    parts.tooltip.markDirty();
    parts.tooltipLabel.markDirty();
    group.markDirty();
    group.emit("hover", syntheticEvent("hover", group, { index: idx, value: val }));
    group.getApp()?.requestRender();
  };
  const clearHover = () => {
    if (hoverIndex < 0 && !parts.tooltip.visible)
      return;
    hoverIndex = -1;
    parts.highlight.visible = false;
    hideChartTooltip(parts.tooltip, parts.tooltipLabel);
    parts.highlight.markDirty();
    parts.tooltip.markDirty();
    parts.tooltipLabel.markDirty();
    group.markDirty();
    group.getApp()?.requestRender();
  };
  const localXFrom = (e) => chartLocalPoint(group, e.worldX, e.worldY).x;
  group.on("mousemove", (e) => {
    updateHover(localXFrom(e));
  });
  group.on("mouseleave", clearHover);
  parts.hitArea.on("mousemove", (e) => {
    updateHover(localXFrom(e));
  });
  parts.hitArea.on("mouseleave", clearHover);
  group.on("click", (e) => {
    const idx = barIndexAtX(count, layout, localXFrom(e));
    group.emit("select", syntheticEvent("select", group, { index: idx, value: data[idx] }));
  });
}
function stackedBarHoverLabel(seriesList, index) {
  return seriesList.map((s) => `${s.name ?? "Series"}: ${s.data[index] ?? "\u2014"}`).join("\n");
}
function wireStackedBarChartInteraction(group, seriesList, layout, bounds, totals, gap = 0.2, parts) {
  const count = totals.length;
  let hoverIndex = -1;
  const updateHover = (localX) => {
    const idx = barIndexAtX(count, layout, localX);
    if (idx === hoverIndex && parts.tooltip.visible)
      return;
    hoverIndex = idx;
    const total = totals[idx] ?? 0;
    const geo = barGeometry(idx, count, total, layout, bounds, gap);
    const label = stackedBarHoverLabel(seriesList, idx);
    parts.highlight.x = geo.x;
    parts.highlight.y = geo.y;
    const hi = parts.highlight;
    hi.width = geo.width;
    hi.height = geo.height;
    parts.highlight.visible = true;
    positionChartTooltip(parts.tooltip, parts.tooltipLabel, geo.centerX, geo.y - 32, label, {
      width: layout.plotX + layout.plotWidth + 10,
      height: layout.plotY + layout.plotHeight + 30
    });
    parts.highlight.markDirty();
    parts.tooltip.markDirty();
    parts.tooltipLabel.markDirty();
    group.markDirty();
    group.emit(
      "hover",
      syntheticEvent("hover", group, {
        index: idx,
        series: seriesList.map((s) => s.data[idx])
      })
    );
    group.getApp()?.requestRender();
  };
  const clearHover = () => {
    if (hoverIndex < 0 && !parts.tooltip.visible)
      return;
    hoverIndex = -1;
    parts.highlight.visible = false;
    hideChartTooltip(parts.tooltip, parts.tooltipLabel);
    parts.highlight.markDirty();
    parts.tooltip.markDirty();
    parts.tooltipLabel.markDirty();
    group.markDirty();
    group.getApp()?.requestRender();
  };
  const localXFrom = (e) => chartLocalPoint(group, e.worldX, e.worldY).x;
  group.on("mousemove", (e) => {
    updateHover(localXFrom(e));
  });
  group.on("mouseleave", clearHover);
  parts.hitArea.on("mousemove", (e) => {
    updateHover(localXFrom(e));
  });
  parts.hitArea.on("mouseleave", clearHover);
  group.on("click", (e) => {
    const idx = barIndexAtX(count, layout, localXFrom(e));
    group.emit(
      "select",
      syntheticEvent("select", group, {
        index: idx,
        series: seriesList.map((s) => s.data[idx])
      })
    );
  });
}
function wireStackedHorizontalBarChartInteraction(group, seriesList, layout, bounds, totals, gap = 0.2, parts) {
  const count = totals.length;
  let hoverIndex = -1;
  const updateHover = (localY) => {
    const idx = barIndexAtY(count, layout, localY);
    if (idx === hoverIndex && parts.tooltip.visible)
      return;
    hoverIndex = idx;
    const total = totals[idx] ?? 0;
    const geo = stackedHorizontalBarGeometry(idx, count, total, layout, bounds, gap);
    const label = stackedBarHoverLabel(seriesList, idx);
    parts.highlight.x = geo.x;
    parts.highlight.y = geo.y;
    const hi = parts.highlight;
    hi.width = geo.width;
    hi.height = geo.height;
    parts.highlight.visible = true;
    positionChartTooltip(parts.tooltip, parts.tooltipLabel, layout.plotX + layout.plotWidth / 2, geo.y - 32, label, {
      width: layout.plotX + layout.plotWidth + 10,
      height: layout.plotY + layout.plotHeight + 30
    });
    parts.highlight.markDirty();
    parts.tooltip.markDirty();
    parts.tooltipLabel.markDirty();
    group.markDirty();
    group.emit(
      "hover",
      syntheticEvent("hover", group, {
        index: idx,
        series: seriesList.map((s) => s.data[idx])
      })
    );
    group.getApp()?.requestRender();
  };
  const clearHover = () => {
    if (hoverIndex < 0 && !parts.tooltip.visible)
      return;
    hoverIndex = -1;
    parts.highlight.visible = false;
    hideChartTooltip(parts.tooltip, parts.tooltipLabel);
    parts.highlight.markDirty();
    parts.tooltip.markDirty();
    parts.tooltipLabel.markDirty();
    group.markDirty();
    group.getApp()?.requestRender();
  };
  const localYFrom = (e) => chartLocalPoint(group, e.worldX, e.worldY).y;
  group.on("mousemove", (e) => {
    updateHover(localYFrom(e));
  });
  group.on("mouseleave", clearHover);
  parts.hitArea.on("mousemove", (e) => {
    updateHover(localYFrom(e));
  });
  parts.hitArea.on("mouseleave", clearHover);
  group.on("click", (e) => {
    const idx = barIndexAtY(count, layout, localYFrom(e));
    group.emit(
      "select",
      syntheticEvent("select", group, {
        index: idx,
        series: seriesList.map((s) => s.data[idx])
      })
    );
  });
}

// src/primitives/dialGauge.ts
var DEFAULT_START = Math.PI * 0.75;
var DEFAULT_SWEEP = Math.PI * 1.5;
function textTopY(y, fontSize) {
  return y - fontSize * 0.5;
}
function withAlpha(color, alpha) {
  if (color.startsWith("#") && color.length === 7) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return color;
}
function buildDialGauge(app, group, style, opts) {
  const size = opts.size;
  const cx = size / 2;
  const inset = Math.max(4, Math.min(14, size * 0.1));
  const r = size / 2 - inset;
  const tickOutset = Math.max(3, size * 0.035);
  const majorLen = Math.max(5, size * 0.085);
  const minorLen = Math.max(3, size * 0.05);
  const startAngle = opts.startAngle ?? DEFAULT_START;
  const sweep = opts.sweepAngle ?? DEFAULT_SWEEP;
  const endAngle = startAngle + sweep;
  const trackW = style.trackWidth ?? Math.max(6, size * 0.055);
  const tickColor = style.tickColor ?? "#cbd5e1";
  const face = style.faceColor ?? "#0a0a0a";
  const bezel = style.bezelColor ?? style.trackColor;
  const accent = style.accentColor ?? style.needleColor;
  const format = opts.formatValue ?? ((v) => String(Math.round(v)));
  const formatTick = opts.formatTickLabel ?? ((v) => String(Math.round(v)));
  const tickCount = opts.tickCount ?? 8;
  const hubOuter = Math.max(5, size * 0.065);
  const hubInner = Math.max(2.5, size * 0.032);
  const needleW = Math.max(2, size * 0.014);
  const shadow = size >= 120 ? { color: "rgba(0,0,0,0.45)", blur: Math.min(12, size / 12), offsetX: 0, offsetY: Math.min(4, size / 30) } : void 0;
  group.add(
    app.circle({
      x: cx - r - tickOutset - 2,
      y: cx - r - tickOutset - 2,
      radius: r + tickOutset + 2,
      fill: "#050505",
      stroke: bezel,
      strokeWidth: Math.max(1.5, size * 0.018),
      shadow,
      listening: false
    }),
    app.circle({
      x: cx - r - tickOutset + 1,
      y: cx - r - tickOutset + 1,
      radius: r + tickOutset - 1,
      fill: face,
      stroke: withAlpha(bezel, 0.55),
      strokeWidth: 1,
      listening: false
    })
  );
  group.add(
    new Arc({
      x: cx - r,
      y: cx - r,
      radius: r,
      startAngle,
      endAngle,
      fill: null,
      stroke: "#1a1f2e",
      strokeWidth: trackW + 2,
      listening: false
    })
  );
  if (opts.colorZones?.length) {
    for (const zone of opts.colorZones) {
      group.add(
        new Arc({
          x: cx - r,
          y: cx - r,
          radius: r,
          startAngle: startAngle + sweep * zone.from,
          endAngle: startAngle + sweep * zone.to,
          fill: null,
          stroke: zone.color,
          strokeWidth: trackW,
          listening: false
        })
      );
    }
  } else {
    const redlineStart = opts.redlineFrom;
    if (redlineStart !== void 0 && redlineStart < 1) {
      group.add(
        new Arc({
          x: cx - r,
          y: cx - r,
          radius: r,
          startAngle: startAngle + sweep * redlineStart,
          endAngle,
          fill: null,
          stroke: style.redlineColor ?? "#ef4444",
          strokeWidth: trackW,
          listening: false
        })
      );
    }
    group.add(
      new Arc({
        x: cx - r,
        y: cx - r,
        radius: r,
        startAngle,
        endAngle: redlineStart !== void 0 ? startAngle + sweep * redlineStart : endAngle,
        fill: null,
        stroke: style.trackColor,
        strokeWidth: trackW,
        listening: false
      })
    );
  }
  const valueAngle = startAngle + opts.value / Math.max(opts.max, 1) * sweep;
  const valueArc = opts.value > 0 && size >= 96 ? new Arc({
    x: cx - r,
    y: cx - r,
    radius: r,
    startAngle,
    endAngle: valueAngle,
    fill: null,
    stroke: withAlpha(accent, 0.32),
    strokeWidth: Math.max(2, trackW * 0.38),
    listening: false
  }) : void 0;
  if (valueArc)
    group.add(valueArc);
  for (let i = 0; i <= tickCount; i++) {
    const t = i / tickCount;
    const a = startAngle + sweep * t;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const major = i % 2 === 0;
    const outer = r - tickOutset * 0.35;
    const inner = outer - (major ? majorLen : minorLen);
    const dx = (outer - inner) * cos;
    const dy = (outer - inner) * sin;
    group.add(
      app.line({
        x: cx + inner * cos,
        y: cx + inner * sin,
        x2: dx,
        y2: dy,
        stroke: major ? tickColor : withAlpha(tickColor, 0.55),
        strokeWidth: major ? Math.max(1.5, size * 0.016) : 1,
        lineCap: "round",
        listening: false
      })
    );
    if (opts.showTickLabels && major && size >= 96) {
      const labelVal = formatTick(opts.max * t);
      const lr = r - Math.max(majorLen + 6, size * 0.16);
      const lx = cx + lr * cos;
      const ly = cx + lr * sin;
      const skipTop = sin < -0.35 && Math.abs(cos) < 0.55;
      if (skipTop)
        continue;
      const labelSize = Math.max(7, size * 0.085);
      group.add(
        app.text({
          text: labelVal,
          x: lx,
          y: textTopY(ly, labelSize),
          fontSize: labelSize,
          fontWeight: "500",
          fill: style.tickLabelColor ?? style.textMuted ?? style.textColor,
          textAlign: "center",
          metadata: { textBoxWidth: Math.max(18, size * 0.22), textBoxCenterY: ly },
          listening: false
        })
      );
    }
  }
  if (opts.title && size >= 72) {
    const titleSize = Math.max(7, size * 0.068);
    const titleY = cx - r * 0.5;
    group.add(
      app.text({
        text: opts.title.toUpperCase(),
        x: cx,
        y: textTopY(titleY, titleSize),
        fontSize: titleSize,
        fontWeight: "600",
        fill: style.textMuted ?? style.tickLabelColor ?? style.textColor,
        textAlign: "center",
        metadata: { textBoxWidth: size, textBoxCenterY: titleY },
        listening: false
      })
    );
  }
  const angle = valueAngle;
  const needleLen = r * 0.76;
  const needle = app.line({
    x: cx,
    y: cx,
    x2: needleLen * Math.cos(angle),
    y2: needleLen * Math.sin(angle),
    stroke: style.needleColor,
    strokeWidth: needleW,
    lineCap: "round",
    shadow: { color: "rgba(0,0,0,0.4)", blur: 4, offsetX: 1, offsetY: 2 },
    listening: false
  });
  group.add(needle);
  group.add(
    app.circle({
      x: cx - hubOuter,
      y: cx - hubOuter,
      radius: hubOuter,
      fill: "#1f2937",
      stroke: bezel,
      strokeWidth: 1,
      listening: false
    }),
    app.circle({
      x: cx - hubInner,
      y: cx - hubInner,
      radius: hubInner,
      fill: style.needleColor,
      listening: false
    })
  );
  const valueSize = Math.max(11, size * 0.115);
  const valueY = cx + r * 0.08;
  const valueText = app.text({
    text: format(opts.value),
    x: cx,
    y: textTopY(valueY, valueSize),
    fontSize: valueSize,
    fontWeight: "bold",
    fill: style.textColor,
    textAlign: "center",
    metadata: { textBoxWidth: size, textBoxCenterY: valueY },
    ...opts.ariaLive ? { ariaLive: opts.ariaLive } : {},
    listening: false
  });
  group.add(valueText);
  let unitText;
  if (opts.unit) {
    const unitSize = Math.max(8, size * 0.072);
    const unitY = cx + r * 0.26;
    unitText = app.text({
      text: opts.unit.trim(),
      x: cx,
      y: textTopY(unitY, unitSize),
      fontSize: unitSize,
      fontWeight: "500",
      fill: style.textMuted ?? style.textColor,
      textAlign: "center",
      metadata: { textBoxWidth: size, textBoxCenterY: unitY },
      listening: false
    });
    group.add(unitText);
  }
  return { needle, valueArc, valueText, unitText };
}
function dialNeedleAngle(value, max, start = DEFAULT_START, sweep = DEFAULT_SWEEP) {
  return start + value / Math.max(max, 1) * sweep;
}
function updateDialNeedle(needle, _cx, value, max, r, start = DEFAULT_START, sweep = DEFAULT_SWEEP, counterweight, valueArc) {
  const angle = dialNeedleAngle(value, max, start, sweep);
  const len = r * 0.76;
  needle.x2 = len * Math.cos(angle);
  needle.y2 = len * Math.sin(angle);
  if (counterweight) {
    const counterLen = r * 0.11;
    counterweight.x2 = -counterLen * Math.cos(angle);
    counterweight.y2 = -counterLen * Math.sin(angle);
  }
  if (valueArc) {
    valueArc.endAngle = angle;
    valueArc.visible = value > 0;
  }
}

// src/dashboard/charts/core/interaction.ts
function isInteractive(props) {
  return props.interactive !== false;
}
function localXY(group, e) {
  return chartLocalPoint(group, e.worldX, e.worldY);
}
function chartSize(group) {
  const state = getState2(group);
  const w = num2(state, "width", 0) || num2(state, "size", 300);
  const h = num2(state, "height", 0) || num2(state, "size", 150);
  return { width: w, height: h };
}
function showTooltip(group, parts, label, centerX, topY, highlight) {
  if (!label.trim()) {
    clearTooltip(group, parts);
    return;
  }
  if (highlight && parts.highlight) {
    parts.highlight.x = highlight.x;
    parts.highlight.y = highlight.y;
    const hi = parts.highlight;
    hi.width = highlight.width;
    hi.height = highlight.height;
    parts.highlight.visible = true;
    parts.highlight.markDirty();
  }
  const bounds = chartSize(group);
  positionChartTooltip(
    parts.tooltip,
    parts.tooltipLabel,
    centerX,
    topY,
    label,
    bounds
  );
  parts.tooltip.markDirty();
  parts.tooltipLabel.markDirty();
  group.markDirty();
  group.getApp()?.requestRender();
}
function clearTooltip(group, parts) {
  if (!parts.tooltip.visible && !parts.highlight?.visible)
    return;
  hideChartTooltip(
    parts.tooltip,
    parts.tooltipLabel
  );
  if (parts.highlight)
    parts.highlight.visible = false;
  parts.tooltip.markDirty();
  parts.tooltipLabel.markDirty();
  parts.highlight?.markDirty();
  group.markDirty();
  group.getApp()?.requestRender();
}
function bindHover(group, parts, onMove) {
  let lastHoverKey = "";
  const handleMove = (e) => {
    const { x, y } = localXY(group, e);
    const hit = onMove(x, y);
    if (!hit) {
      lastHoverKey = "";
      clearTooltip(group, parts);
      return;
    }
    const key = `${hit.label}|${hit.centerX}|${hit.topY}`;
    if (key === lastHoverKey)
      return;
    lastHoverKey = key;
    showTooltip(group, parts, hit.label, hit.centerX, hit.topY, hit.highlight);
    group.emit("hover", syntheticEvent("hover", group, hit.payload ?? { value: hit.label }));
  };
  const handleClear = () => {
    lastHoverKey = "";
    clearTooltip(group, parts);
  };
  group.on("mousemove", handleMove);
  group.on("mouseleave", handleClear);
  parts.hitArea.on("mousemove", handleMove);
  parts.hitArea.on("mouseleave", handleClear);
  group.on("click", (e) => {
    const { x, y } = localXY(group, e);
    const hit = onMove(x, y);
    if (hit)
      group.emit("select", syntheticEvent("select", group, hit.payload ?? { value: hit.label }));
  });
}
function createHoverParts(app, rect, withHighlight = true) {
  const tooltip = app.roundedRect({
    width: 52,
    height: 24,
    cornerRadius: 6,
    fill: DASHBOARD.chartTooltipBg,
    stroke: DASHBOARD.chartTooltipBorder,
    strokeWidth: 1,
    visible: false,
    listening: false,
    zIndex: 900
  });
  const tooltipLabel = app.text({
    text: "",
    fontSize: 11,
    fontWeight: "bold",
    fill: DASHBOARD.text,
    textAlign: "center",
    x: 0,
    y: 0,
    visible: false,
    listening: false,
    zIndex: 901
  });
  const hitArea = app.rect({
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    fill: "rgba(0,0,0,0.001)",
    listening: true,
    zIndex: 800
  });
  const highlight = withHighlight ? app.rect({
    fill: "rgba(96,165,250,0.28)",
    stroke: DASHBOARD.chartLine,
    strokeWidth: 2,
    visible: false,
    listening: false
  }) : void 0;
  return { tooltip, tooltipLabel, hitArea, highlight };
}
function mountHover(group, app, props, rect, onMove, withHighlight = true) {
  if (!isInteractive(props))
    return;
  const parts = createHoverParts(app, rect, withHighlight);
  const nodes = parts.highlight ? [parts.highlight, parts.tooltip, parts.tooltipLabel, parts.hitArea] : [parts.tooltip, parts.tooltipLabel, parts.hitArea];
  group.add(...nodes);
  bindHover(group, parts, onMove);
  setParts2(group, parts);
}
function attachIndexXHover(app, group, props, layout, count, labelAt, highlightAt, payloadAt) {
  if (!isInteractive(props) || count <= 0)
    return;
  const slot = layout.plotWidth / Math.max(count, 1);
  mountHover(
    group,
    app,
    props,
    { x: layout.plotX, y: layout.plotY, width: layout.plotWidth, height: layout.plotHeight },
    (x) => {
      const idx = Math.max(0, Math.min(count - 1, Math.floor((x - layout.plotX) / slot)));
      const centerX = layout.plotX + slot * idx + slot / 2;
      return {
        label: labelAt(idx),
        centerX,
        topY: layout.plotY - 8,
        highlight: highlightAt?.(idx),
        payload: payloadAt ? payloadAt(idx) : { index: idx, value: labelAt(idx) }
      };
    }
  );
}
function attachIndexYHover(app, group, props, layout, count, labelAt, highlightAt) {
  if (!isInteractive(props) || count <= 0)
    return;
  const slot = layout.plotHeight / Math.max(count, 1);
  mountHover(
    group,
    app,
    props,
    { x: layout.plotX, y: layout.plotY, width: layout.plotWidth, height: layout.plotHeight },
    (_x, y) => {
      const idx = Math.max(0, Math.min(count - 1, Math.floor((y - layout.plotY) / slot)));
      const centerY = layout.plotY + slot * idx + slot / 2;
      return {
        label: labelAt(idx),
        centerX: layout.plotX + layout.plotWidth / 2,
        topY: centerY - 32,
        highlight: highlightAt?.(idx),
        payload: { index: idx, value: labelAt(idx) }
      };
    }
  );
}
function attachBandYHover(app, group, props, width, height, count, labelAt) {
  if (!isInteractive(props) || count <= 0)
    return;
  const band = height / count;
  mountHover(group, app, props, { x: 0, y: 0, width, height }, (_x, y) => {
    const idx = Math.max(0, Math.min(count - 1, Math.floor(y / band)));
    return {
      label: labelAt(idx),
      centerX: width / 2,
      topY: idx * band + 4,
      highlight: { x: 0, y: idx * band, width, height: band },
      payload: { index: idx, value: labelAt(idx) }
    };
  });
}
function attachPolarSliceHover(app, group, props, size, data, labels, innerRadius = 0) {
  if (!isInteractive(props) || !data.length)
    return;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 10;
  const total = data.reduce((a, b) => a + b, 0) || 1;
  let start = -Math.PI / 2;
  const slices = data.map((val, i) => {
    const sweep = val / total * Math.PI * 2;
    const slice = { start, end: start + sweep, val, i };
    start += sweep;
    return slice;
  });
  mountHover(
    group,
    app,
    props,
    { x: 0, y: 0, width: size, height: size },
    (x, y) => {
      const dx = x - cx;
      const dy = y - cy;
      const r = Math.hypot(dx, dy);
      if (r < innerRadius || r > outerR)
        return null;
      let angle = Math.atan2(dy, dx);
      if (angle < -Math.PI / 2)
        angle += Math.PI * 2;
      const hit = slices.find((s) => angle >= s.start && angle < s.end);
      if (!hit)
        return null;
      const mid = (hit.start + hit.end) / 2;
      const lr = (outerR + innerRadius) / 2;
      const tx = cx + lr * Math.cos(mid);
      const ty = cy + lr * Math.sin(mid);
      const name = labels?.[hit.i];
      const label = name ?? String(hit.val);
      return {
        label,
        centerX: tx,
        topY: ty - 28,
        payload: { index: hit.i, value: hit.val, label: name }
      };
    },
    false
  );
}
function attachGridHover(app, group, props, width, height, rows, cols, valueAt) {
  if (!isInteractive(props) || rows <= 0 || cols <= 0)
    return;
  const cw = width / cols;
  const ch = height / rows;
  mountHover(group, app, props, { x: 0, y: 0, width, height }, (x, y) => {
    const col = Math.max(0, Math.min(cols - 1, Math.floor(x / cw)));
    const row = Math.max(0, Math.min(rows - 1, Math.floor(y / ch)));
    const label = valueAt(row, col);
    if (!label.trim())
      return null;
    return {
      label,
      centerX: col * cw + cw / 2,
      topY: row * ch - 4,
      highlight: { x: col * cw, y: row * ch, width: cw, height: ch },
      payload: { row, col, value: valueAt(row, col) }
    };
  });
}
function attachNearestHover(app, group, props, rect, points, radius = 80) {
  if (!isInteractive(props) || !points.length)
    return;
  mountHover(group, app, props, rect, (x, y) => {
    let best = null;
    let bestD = radius * radius;
    for (const p of points) {
      const d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    if (!best)
      return null;
    const label = best.label ?? "";
    if (!label.trim())
      return null;
    return {
      label,
      centerX: best.x,
      topY: best.y - 28,
      payload: best.payload ?? { label }
    };
  }, false);
}
function attachRegionsHover(app, group, props, width, height, regions) {
  if (!isInteractive(props) || !regions.length)
    return;
  mountHover(group, app, props, { x: 0, y: 0, width, height }, (x, y) => {
    const hit = regions.find(
      (r) => x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height
    );
    if (!hit)
      return null;
    const label = hit.label ?? "";
    if (!label.trim())
      return null;
    return {
      label,
      centerX: hit.x + hit.width / 2,
      topY: hit.y - 8,
      highlight: { x: hit.x, y: hit.y, width: hit.width, height: hit.height },
      payload: hit.payload ?? { label }
    };
  });
}
function attachValueHover(app, group, props, width, height, label) {
  if (!isInteractive(props))
    return;
  mountHover(
    group,
    app,
    props,
    { x: 0, y: 0, width, height },
    () => ({
      label,
      centerX: width / 2,
      topY: height * 0.2,
      payload: { value: label }
    }),
    false
  );
}

// src/dashboard/charts/core/zoom.ts
function attachPlotWheelZoom(group, hitArea, bounds, options = {}) {
  const minSpan = options.minSpan ?? 1;
  const factor = options.factor ?? 1.12;
  const applyZoom = (direction) => {
    const state = getState2(group);
    const minY = typeof state.minY === "number" ? state.minY : bounds.min;
    const maxY = typeof state.maxY === "number" ? state.maxY : bounds.max;
    const mid = (minY + maxY) / 2;
    let half = (maxY - minY) / 2 * (direction > 0 ? factor : 1 / factor);
    half = Math.max(minSpan / 2, half);
    setState2(group, { minY: mid - half, maxY: mid + half });
    const rebuild = group.metadata?.chartRebuild;
    rebuild?.();
    group.getApp()?.requestRender();
  };
  const onWheel = (e) => {
    const we = e.originalEvent;
    const dy = we.deltaY ?? 0;
    if (dy === 0)
      return;
    e.preventDefault();
    e.stopPropagation();
    applyZoom(dy > 0 ? 1 : -1);
  };
  group.on("wheel", onWheel);
  hitArea.on("wheel", onWheel);
}

// src/dashboard/charts/core/series.ts
function parseSeries(props, fallback = [10, 30, 20, 50, 40, 60]) {
  const raw = props.series;
  if (raw?.length) {
    return raw.map((s, i) => ({
      name: s.name ?? s.label ?? `Series ${i + 1}`,
      data: s.data ?? [],
      type: s.type,
      color: s.color ?? DASHBOARD.series[i % DASHBOARD.series.length],
      yAxis: s.yAxis,
      errorY: s.errorY,
      rangeMin: s.rangeMin,
      rangeMax: s.rangeMax
    }));
  }
  const data = props.data ?? fallback;
  return [
    {
      name: typeof props.seriesLabel === "string" ? props.seriesLabel : "Series",
      data,
      color: DASHBOARD.chartLine
    }
  ];
}
function seriesPointCount(series) {
  return Math.max(...series.map((s) => s.data.length), 0);
}
function flattenSeriesData(series) {
  return series.flatMap((s) => s.data);
}
function stackSeries(series) {
  const len = seriesPointCount(series);
  const stacked = series.map(() => Array(len).fill(0));
  for (let i = 0; i < len; i++) {
    let acc = 0;
    for (let s = 0; s < series.length; s++) {
      const v = series[s].data[i] ?? 0;
      acc += v;
      stacked[s][i] = acc;
    }
  }
  return series.map((s, si) => ({
    ...s,
    data: stacked[si],
    _base: si === 0 ? Array(len).fill(0) : stacked[si - 1]
  }));
}
function normalizeBumpRanks(series) {
  const len = seriesPointCount(series);
  const result = [];
  for (let i = 0; i < len; i++) {
    const vals = series.map((s, si) => ({ si, v: s.data[i] ?? 0 }));
    vals.sort((a, b) => b.v - a.v);
    vals.forEach((entry, rank) => {
      if (!result[entry.si]) {
        result[entry.si] = { ...series[entry.si], data: [] };
      }
      result[entry.si].data[i] = rank + 1;
    });
  }
  return result;
}

// src/dashboard/charts/core/layout.ts
function buildChartContext(props, series) {
  const width = num2(props, "width", 300);
  const height = num2(props, "height", 150);
  const minimal = props.minimalAxes === true;
  const showLegend = props.showLegend !== false && !minimal;
  const padding = minimal ? 4 : 30;
  const legendRows = showLegend ? series.length : 0;
  const legendH = legendRows > 0 ? legendRows * 18 + 8 : 0;
  const layout = defaultLayout(width, height, padding, legendH);
  const minY = typeof props.minY === "number" ? props.minY : void 0;
  const maxY = typeof props.maxY === "number" ? props.maxY : void 0;
  const bounds = dataBounds(flattenSeriesData(series), minY, maxY);
  const yTicks = computeTicks(bounds.min, bounds.max, num2(props, "tickCount", 5));
  const categories = props.categories ?? Array.from({ length: Math.max(...series.map((s) => s.data.length), 1) }, (_, i) => String(i + 1));
  return { width, height, layout, bounds, yTicks, categories, series };
}

// src/dashboard/charts/core/spline.ts
function stepPoints(data, toXY) {
  const pts = [];
  for (let i = 0; i < data.length; i++) {
    const [x, y] = toXY(i, data[i]);
    if (i === 0) {
      pts.push(x, y);
    } else {
      pts.push(x, data[i - 1] !== void 0 ? toXY(i - 1, data[i - 1])[1] : y);
      pts.push(x, y);
    }
  }
  return pts;
}
function catmullRomPath(points, tension = 0.5) {
  if (points.length < 2)
    return "";
  if (points.length === 2) {
    return `M ${points[0][0]} ${points[0][1]} L ${points[1][0]} ${points[1][1]}`;
  }
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6 * tension;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6 * tension;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6 * tension;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6 * tension;
    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2[0]} ${p2[1]}`;
  }
  return d;
}
function pointsToPairs(points) {
  const pairs = [];
  for (let i = 0; i < points.length; i += 2) {
    pairs.push([points[i], points[i + 1]]);
  }
  return pairs;
}

// src/dashboard/charts/cartesian/cartesianChart.ts
function valueToY(v, layout, bounds) {
  const range = bounds.max - bounds.min || 1;
  return layout.plotY + layout.plotHeight - (v - bounds.min) / range * layout.plotHeight;
}
function addPlotChrome(app, group, ctx, props) {
  const { width, height, layout, bounds, yTicks } = ctx;
  const minimal = ctx.series.length === 0 || props.minimalAxes === true || ["sparkline"].includes(String(props.variant));
  group.add(app.rect({ width, height, fill: DASHBOARD.chartBg, listening: true }));
  group.add(
    app.rect({
      x: layout.plotX,
      y: layout.plotY,
      width: layout.plotWidth,
      height: layout.plotHeight,
      fill: DASHBOARD.chartPlot,
      stroke: null,
      listening: false
    })
  );
  if (!minimal && props.showGrid !== false) {
    addGridLines(app, group, layout, yTicks, bounds);
    addAxes(app, group, layout, bounds, yTicks);
  }
}
function addInteraction(app, group, ctx, props, primaryData, allSeries) {
  if (props.interactive === false)
    return;
  const { layout, bounds } = ctx;
  const crosshair = app.line({
    x: layout.plotX,
    y: layout.plotY,
    x2: 0,
    y2: layout.plotHeight,
    stroke: DASHBOARD.chartCrosshair,
    strokeWidth: 1,
    dash: [4, 4],
    visible: false,
    listening: false
  });
  const dot = app.circle({
    x: 0,
    y: 0,
    radius: 5,
    fill: DASHBOARD.chartDot,
    stroke: DASHBOARD.chartLine,
    strokeWidth: 2,
    visible: false,
    listening: false
  });
  const tooltip = app.roundedRect({
    width: 52,
    height: 24,
    cornerRadius: 6,
    fill: DASHBOARD.chartTooltipBg,
    stroke: DASHBOARD.chartTooltipBorder,
    strokeWidth: 1,
    visible: false,
    listening: false,
    zIndex: 900
  });
  const tooltipLabel = app.text({
    text: "",
    fontSize: 11,
    fontWeight: "bold",
    fill: DASHBOARD.text,
    textAlign: "center",
    x: 0,
    y: 0,
    visible: false,
    listening: false,
    zIndex: 901
  });
  const hitArea = app.rect({
    x: layout.plotX,
    y: layout.plotY,
    width: layout.plotWidth,
    height: layout.plotHeight,
    fill: "rgba(0,0,0,0.001)",
    listening: true,
    zIndex: 800
  });
  group.add(crosshair, dot, tooltip, tooltipLabel, hitArea);
  const seriesForHover = allSeries && allSeries.length > 1 ? allSeries : null;
  if (seriesForHover) {
    wireMultiSeriesChartInteraction(group, seriesForHover, layout, bounds, {
      tooltip,
      tooltipLabel,
      crosshair,
      dot,
      hitArea
    });
  } else {
    wireChartInteraction(group, primaryData, layout, bounds, {
      tooltip,
      tooltipLabel,
      crosshair,
      dot,
      hitArea
    });
  }
  if (props.zoomEnabled !== false && props.interactive !== false) {
    attachPlotWheelZoom(group, hitArea, bounds);
  }
  setParts2(group, { crosshair, dot, tooltip, tooltipLabel, hitArea });
}
function drawLineSeries(app, group, ctx, series, variant) {
  const { layout, bounds } = ctx;
  const color = series.color ?? DASHBOARD.chartLine;
  const toXY = (i, v) => [
    layout.plotX + layout.plotWidth / Math.max(series.data.length - 1, 1) * i,
    valueToY(v, layout, bounds)
  ];
  let points;
  if (variant === "step" || variant === "run" || variant === "control") {
    points = stepPoints(series.data, toXY);
  } else {
    points = seriesToPoints(series.data, layout, bounds);
  }
  if (variant === "area" || variant === "stackedArea" || variant === "rangeArea" || variant === "ribbon" || variant === "horizon") {
    const baselineY = layout.plotY + layout.plotHeight;
    group.add(
      app.path({
        d: areaPathFromPoints(points, baselineY),
        fill: color,
        opacity: 0.35,
        stroke: null,
        listening: false
      })
    );
  }
  if (variant === "spline") {
    const path = catmullRomPath(pointsToPairs(points));
    group.add(app.path({ d: path, fill: null, stroke: color, strokeWidth: 2.5, listening: false }));
  } else {
    group.add(
      app.polyline({
        points,
        fill: null,
        stroke: color,
        strokeWidth: 2.5,
        lineCap: "round",
        lineJoin: "round",
        listening: false
      })
    );
  }
}
function drawBarSeries(app, group, ctx, series, horizontal, stackBase) {
  const { layout, bounds } = ctx;
  const n = series.data.length;
  const gap = 0.2;
  const bars = [];
  const color = series.color ?? DASHBOARD.barFill;
  if (horizontal) {
    const bw = bandWidth(n, layout.plotHeight, gap);
    const scale = linearScale([bounds.min, bounds.max], [0, layout.plotWidth]);
    const rowStep = layout.plotHeight / n;
    series.data.forEach((val, i) => {
      const base = stackBase?.[i] ?? bounds.min;
      const x0 = scale(base);
      const x1 = scale(val);
      const y = layout.plotY + rowStep * i + (rowStep - bw) / 2;
      const bar = app.rect({
        x: layout.plotX + x0,
        y,
        width: Math.max(1, x1 - x0),
        height: bw,
        fill: color,
        listening: false
      });
      bars.push(bar);
      group.add(bar);
    });
  } else {
    const bw = bandWidth(n, layout.plotWidth, gap);
    series.data.forEach((val, i) => {
      const base = stackBase?.[i] ?? bounds.min;
      const yTop = valueToY(val, layout, bounds);
      const yBase = valueToY(base, layout, bounds);
      const x = layout.plotX + layout.plotWidth / n * i + (layout.plotWidth / n - bw) / 2;
      const bar = app.rect({
        x,
        y: Math.min(yTop, yBase),
        width: bw,
        height: Math.max(1, Math.abs(yBase - yTop)),
        fill: color,
        listening: false
      });
      bars.push(bar);
      group.add(bar);
    });
  }
  return bars;
}
function drawWaterfall(app, group, ctx, data) {
  const { layout, bounds } = ctx;
  const n = data.length;
  const bw = bandWidth(n, layout.plotWidth, 0.25);
  let running = 0;
  data.forEach((delta, i) => {
    const start = running;
    running += delta;
    const y0 = valueToY(start, layout, bounds);
    const y1 = valueToY(running, layout, bounds);
    const x = layout.plotX + layout.plotWidth / n * i + (layout.plotWidth / n - bw) / 2;
    group.add(
      app.rect({
        x,
        y: Math.min(y0, y1),
        width: bw,
        height: Math.max(1, Math.abs(y1 - y0)),
        fill: delta >= 0 ? DASHBOARD.success : DASHBOARD.danger,
        listening: false
      })
    );
  });
}
function drawPareto(app, group, ctx, data) {
  drawBarSeries(app, group, ctx, { data, color: DASHBOARD.barFill }, false);
  const sorted = [...data];
  const total = sorted.reduce((a, b) => a + b, 0) || 1;
  const cum = [];
  let acc = 0;
  for (const v of sorted) {
    acc += v;
    cum.push(acc / total * 100);
  }
  const cumBounds = { min: 0, max: 100 };
  const pts = seriesToPoints(cum, ctx.layout, cumBounds);
  group.add(
    app.polyline({
      points: pts,
      fill: null,
      stroke: DASHBOARD.warning,
      strokeWidth: 2,
      listening: false
    })
  );
}
function drawControlChart(app, group, ctx, data, limits) {
  drawLineSeries(app, group, ctx, { data, color: DASHBOARD.chartLine }, "step");
  if (!limits) {
    const mean = data.reduce((a, b) => a + b, 0) / (data.length || 1);
    const sd = Math.sqrt(data.reduce((a, b) => a + (b - mean) ** 2, 0) / (data.length || 1));
    limits = { mean, ucl: mean + 2 * sd, lcl: mean - 2 * sd };
  }
  for (const [val, label, color] of [
    [limits.mean, "\u03BC", DASHBOARD.textMuted],
    [limits.ucl, "UCL", DASHBOARD.danger],
    [limits.lcl, "LCL", DASHBOARD.danger]
  ]) {
    const y = valueToY(val, ctx.layout, ctx.bounds);
    group.add(
      app.line({
        x: ctx.layout.plotX,
        y,
        x2: ctx.layout.plotWidth,
        y2: 0,
        stroke: color,
        strokeWidth: 1,
        dash: label === "\u03BC" ? [] : [6, 4],
        listening: false
      }),
      app.text({
        text: label,
        x: ctx.layout.plotX + ctx.layout.plotWidth - 24,
        y: y - 12,
        fontSize: 9,
        fill: color,
        listening: false
      })
    );
  }
}
function drawPopulationPyramid(app, group, ctx, left, right) {
  const max = Math.max(...left, ...right, 1);
  const bounds = { min: -max, max };
  const n = Math.max(left.length, right.length);
  const bh = ctx.layout.plotHeight / n - 2;
  for (let i = 0; i < n; i++) {
    const y = ctx.layout.plotY + i * (bh + 2);
    const cx = ctx.layout.plotX + ctx.layout.plotWidth / 2;
    const lw = (left[i] ?? 0) / max * (ctx.layout.plotWidth / 2 - 4);
    const rw = (right[i] ?? 0) / max * (ctx.layout.plotWidth / 2 - 4);
    group.add(
      app.rect({ x: cx - lw, y, width: lw, height: bh, fill: DASHBOARD.primary, listening: false }),
      app.rect({ x: cx, y, width: rw, height: bh, fill: DASHBOARD.secondary, listening: false })
    );
  }
  ctx.bounds.min = bounds.min;
  ctx.bounds.max = bounds.max;
}
function drawLollipop(app, group, ctx, data) {
  const { layout, bounds } = ctx;
  const n = data.length;
  data.forEach((val, i) => {
    const x = layout.plotX + layout.plotWidth / Math.max(n - 1, 1) * i;
    const y = valueToY(val, layout, bounds);
    const y0 = layout.plotY + layout.plotHeight;
    group.add(
      app.line({ x, y: y0, x2: 0, y2: y - y0, stroke: DASHBOARD.chartLine, strokeWidth: 2, listening: false }),
      app.circle({ x: x - 4, y: y - 4, radius: 4, fill: DASHBOARD.chartDot, listening: false })
    );
  });
}
function drawDotStrip(app, group, ctx, data, strip = false) {
  const { layout, bounds } = ctx;
  data.forEach((val, i) => {
    const jitter = strip ? (i % 5 - 2) * 4 : Math.sin(i * 12.9898) * 43758.5453 % 1 * 10 - 5;
    const x = layout.plotX + layout.plotWidth / Math.max(data.length, 1) * (i + 0.5) + jitter;
    const y = valueToY(val, layout, bounds);
    group.add(app.circle({ x: x - 3, y: y - 3, radius: 3, fill: DASHBOARD.chartDot, listening: false }));
  });
}
function drawErrorBars(app, group, ctx, series) {
  const { layout, bounds } = ctx;
  const errors = series.errorY ?? series.data.map((v) => [v - 5, v + 5]);
  series.data.forEach((val, i) => {
    const x = layout.plotX + layout.plotWidth / Math.max(series.data.length - 1, 1) * i;
    const [lo, hi] = errors[i] ?? [val - 5, val + 5];
    const yLo = valueToY(lo, layout, bounds);
    const yHi = valueToY(hi, layout, bounds);
    group.add(
      app.line({ x, y: yLo, x2: 0, y2: yHi - yLo, stroke: DASHBOARD.textMuted, strokeWidth: 1, listening: false }),
      app.line({ x: x - 4, y: yLo, x2: 8, y2: 0, stroke: DASHBOARD.textMuted, strokeWidth: 1, listening: false }),
      app.line({ x: x - 4, y: yHi, x2: 8, y2: 0, stroke: DASHBOARD.textMuted, strokeWidth: 1, listening: false }),
      app.circle({ x: x - 3, y: valueToY(val, layout, bounds) - 3, radius: 3, fill: DASHBOARD.chartLine, listening: false })
    );
  });
}
function drawRangeBand(app, group, ctx, series, filled) {
  const mins = series.rangeMin ?? series.data.map((v) => v - 8);
  const maxs = series.rangeMax ?? series.data.map((v) => v + 8);
  const { layout, bounds } = ctx;
  const ptsTop = [];
  const ptsBot = [];
  for (let i = 0; i < series.data.length; i++) {
    const x = layout.plotX + layout.plotWidth / Math.max(series.data.length - 1, 1) * i;
    ptsTop.push(x, valueToY(maxs[i], layout, bounds));
    ptsBot.unshift(valueToY(mins[i], layout, bounds), x);
  }
  const all = [...ptsTop, ...ptsBot];
  if (filled) {
    let d = `M ${all[0]} ${all[1]}`;
    for (let i = 2; i < all.length; i += 2)
      d += ` L ${all[i]} ${all[i + 1]}`;
    d += " Z";
    group.add(app.path({ d, fill: DASHBOARD.chartArea, stroke: null, listening: false }));
  } else {
    group.add(
      app.polyline({ points: ptsTop, fill: null, stroke: DASHBOARD.chartLine, strokeWidth: 1.5, listening: false }),
      app.polyline({ points: ptsBot.reverse(), fill: null, stroke: DASHBOARD.chartLine, strokeWidth: 1.5, listening: false })
    );
  }
  drawLineSeries(app, group, ctx, series, "line");
}
function drawHorizon(app, group, ctx, series, bands = 4, rowLayout) {
  const layout = rowLayout ?? ctx.layout;
  const { bounds } = ctx;
  const bandH = layout.plotHeight / bands;
  const offset = (bounds.max - bounds.min) / bands;
  for (let b = 0; b < bands; b++) {
    const subBounds = { min: bounds.min + b * offset, max: bounds.min + (b + 1) * offset };
    const pts = seriesToPoints(series.data, { ...layout, plotY: layout.plotY + b * bandH, plotHeight: bandH }, subBounds);
    group.add(
      app.path({
        d: areaPathFromPoints(pts, layout.plotY + (b + 1) * bandH),
        fill: series.color ?? DASHBOARD.series[b % DASHBOARD.series.length],
        opacity: 0.55,
        stroke: null,
        listening: false
      })
    );
  }
}
function drawHorizonRows(app, group, ctx, allSeries) {
  const rowH = ctx.layout.plotHeight / allSeries.length;
  allSeries.forEach((s, si) => {
    const rowLayout = {
      ...ctx.layout,
      plotY: ctx.layout.plotY + si * rowH,
      plotHeight: Math.max(8, rowH - 2)
    };
    const rowBounds = dataBounds(s.data);
    drawHorizon(app, group, { ...ctx, bounds: rowBounds }, s, 3, rowLayout);
    group.add(
      app.text({
        text: s.name ?? `S${si + 1}`,
        x: ctx.layout.plotX - 2,
        y: rowLayout.plotY + 2,
        fontSize: 9,
        fill: DASHBOARD.textMuted,
        listening: false
      })
    );
  });
}
function buildCartesianChart(group, app, props, options) {
  const variant = options.variant;
  let series = parseSeries(props);
  const rawSeries = series.map((s) => ({
    name: s.name,
    data: [...s.data],
    color: s.color
  }));
  const mirror = props.mirrorData;
  if (variant === "stackedBar" || variant === "stackedColumn" || variant === "stackedArea") {
    series = stackSeries(series);
  }
  if (variant === "bump") {
    series = normalizeBumpRanks(series);
  }
  const ctx = buildChartContext(props, series);
  addPlotChrome(app, group, ctx, { ...props, variant });
  const horizontal = variant === "horizontalBar" || variant === "stackedBar" || variant === "populationPyramid" || props.orientation === "horizontal";
  if (variant === "waterfall") {
    drawWaterfall(app, group, ctx, series[0]?.data ?? []);
  } else if (variant === "pareto") {
    drawPareto(app, group, ctx, series[0]?.data ?? []);
  } else if (variant === "control") {
    drawControlChart(app, group, ctx, series[0]?.data ?? [], props.controlLimits);
  } else if (variant === "populationPyramid") {
    drawPopulationPyramid(app, group, ctx, series[0]?.data ?? [], mirror ?? series[1]?.data ?? []);
  } else if (variant === "lollipop") {
    drawLollipop(app, group, ctx, series[0]?.data ?? []);
  } else if (variant === "dotPlot") {
    drawDotStrip(app, group, ctx, series[0]?.data ?? [], false);
  } else if (variant === "stripPlot") {
    drawDotStrip(app, group, ctx, series[0]?.data ?? [], true);
  } else if (variant === "errorBar") {
    drawErrorBars(app, group, ctx, series[0]);
  } else if (variant === "range" || variant === "band") {
    drawRangeBand(app, group, ctx, series[0], false);
  } else if (variant === "rangeArea") {
    drawRangeBand(app, group, ctx, series[0], true);
  } else if (variant === "horizon") {
    if (series.length > 1) {
      drawHorizonRows(app, group, ctx, series);
    } else {
      drawHorizon(app, group, ctx, series[0]);
    }
  } else if (variant === "bar" || variant === "horizontalBar" || variant === "stackedBar" || variant === "stackedColumn" || variant === "combination" || variant === "mixed") {
    const stacked = variant === "stackedBar" || variant === "stackedColumn";
    series.forEach((s, si) => {
      const base = stacked ? s._base : void 0;
      const kind = variant === "mixed" || variant === "combination" ? s.type ?? (si === 0 ? "bar" : "line") : "bar";
      if (kind === "line" || kind === "area") {
        drawLineSeries(app, group, ctx, s, kind === "area" ? "area" : "line");
      } else {
        drawBarSeries(app, group, ctx, s, horizontal, base);
      }
    });
  } else if (variant === "ribbon") {
    series.forEach((s) => drawLineSeries(app, group, ctx, s, "area"));
  } else {
    series.forEach((s) => {
      drawLineSeries(app, group, ctx, s, variant === "stackedArea" ? "stackedArea" : variant);
    });
  }
  if (props.showLegend !== false && variant !== "sparkline") {
    addLegend(
      app,
      group,
      series.map((s) => ({ label: s.name ?? "Series", color: s.color ?? DASHBOARD.chartLine })),
      ctx.layout.plotX,
      ctx.layout.plotY + ctx.layout.plotHeight + 4
    );
  }
  const primaryData = series[0]?.data ?? [];
  const isStacked = variant === "stackedBar" || variant === "stackedColumn";
  const stackedMulti = isStacked && rawSeries.length > 1;
  const stackedTotals = isStacked ? series[series.length - 1]?.data ?? primaryData : primaryData;
  if (["bar", "horizontalBar", "stackedBar", "stackedColumn", "waterfall", "pareto"].includes(variant)) {
    if (horizontal) {
      const n = primaryData.length;
      if (stackedMulti) {
        const highlight = app.rect({
          fill: "rgba(96,165,250,0.28)",
          stroke: DASHBOARD.chartLine,
          strokeWidth: 2,
          visible: false,
          listening: false
        });
        const tooltip = app.roundedRect({
          width: 52,
          height: 24,
          cornerRadius: 6,
          fill: DASHBOARD.chartTooltipBg,
          stroke: DASHBOARD.chartTooltipBorder,
          strokeWidth: 1,
          visible: false,
          listening: false
        });
        const tooltipLabel = app.text({
          text: "",
          fontSize: 11,
          fontWeight: "bold",
          fill: DASHBOARD.text,
          textAlign: "center",
          x: 0,
          y: 0,
          listening: false
        });
        const hitArea = app.rect({
          x: ctx.layout.plotX,
          y: ctx.layout.plotY,
          width: ctx.layout.plotWidth,
          height: ctx.layout.plotHeight,
          fill: "rgba(0,0,0,0.001)",
          listening: true
        });
        group.add(highlight, tooltip, tooltipLabel, hitArea);
        if (props.interactive !== false) {
          wireStackedHorizontalBarChartInteraction(group, rawSeries, ctx.layout, ctx.bounds, stackedTotals, 0.2, {
            tooltip,
            tooltipLabel,
            highlight,
            hitArea
          });
        }
        setParts2(group, { highlight, tooltip, tooltipLabel, hitArea });
      } else {
        const bw = bandWidth(n, ctx.layout.plotHeight, 0.2);
        const xScale = linearScale([ctx.bounds.min, ctx.bounds.max], [0, ctx.layout.plotWidth]);
        attachIndexYHover(
          app,
          group,
          props,
          ctx.layout,
          n,
          (i) => String(primaryData[i]),
          (i) => {
            const slot = ctx.layout.plotHeight / Math.max(n, 1);
            const val = primaryData[i];
            const x0 = ctx.layout.plotX + xScale(ctx.bounds.min);
            const x1 = ctx.layout.plotX + xScale(val);
            const y = ctx.layout.plotY + slot * i + (slot - bw) / 2;
            return { x: x0, y, width: Math.max(1, x1 - x0), height: bw };
          }
        );
      }
    } else {
      const highlight = app.rect({ fill: "rgba(96,165,250,0.28)", stroke: DASHBOARD.chartLine, strokeWidth: 2, visible: false, listening: false });
      const tooltip = app.roundedRect({ width: 52, height: 24, cornerRadius: 6, fill: DASHBOARD.chartTooltipBg, stroke: DASHBOARD.chartTooltipBorder, strokeWidth: 1, visible: false, listening: false });
      const tooltipLabel = app.text({ text: "", fontSize: 11, fontWeight: "bold", fill: DASHBOARD.text, textAlign: "center", x: 0, y: 0, listening: false });
      const hitArea = app.rect({ x: ctx.layout.plotX, y: ctx.layout.plotY, width: ctx.layout.plotWidth, height: ctx.layout.plotHeight, fill: "rgba(0,0,0,0.001)", listening: true });
      group.add(highlight, tooltip, tooltipLabel, hitArea);
      if (props.interactive !== false) {
        if (stackedMulti) {
          wireStackedBarChartInteraction(group, rawSeries, ctx.layout, ctx.bounds, stackedTotals, 0.2, {
            tooltip,
            tooltipLabel,
            highlight,
            hitArea
          });
        } else {
          wireBarChartInteraction(group, primaryData, ctx.layout, ctx.bounds, 0.2, {
            tooltip,
            tooltipLabel,
            highlight,
            hitArea
          });
        }
      }
      setParts2(group, { highlight, tooltip, tooltipLabel, hitArea });
    }
  } else if (variant !== "sparkline") {
    addInteraction(app, group, ctx, props, primaryData, series.length > 1 ? series : void 0);
  }
  setState2(group, {
    width: ctx.width,
    height: ctx.height,
    data: primaryData,
    series,
    variant
  });
}
function createCartesianWidget(app, type, props, variant) {
  const group = createWidgetGroup(app, type, props);
  installChartRebuild(
    group,
    app,
    (g, a, p) => buildCartesianChart(g, a, p, { variant, widgetType: type })
  );
  return group;
}

// src/dashboard/charts/cartesian/register.ts
var CARTESIAN_TYPES = [
  { type: "lineChart", variant: "line" },
  { type: "areaChart", variant: "area" },
  { type: "barChart", variant: "bar" },
  { type: "columnChart", variant: "bar" },
  { type: "horizontalBarChart", variant: "horizontalBar" },
  { type: "stackedColumnChart", variant: "stackedColumn" },
  { type: "stackedBarChart", variant: "stackedBar" },
  { type: "stackedAreaChart", variant: "stackedArea" },
  { type: "stepChart", variant: "step" },
  { type: "splineChart", variant: "spline" },
  { type: "errorBarChart", variant: "errorBar" },
  { type: "lollipopChart", variant: "lollipop" },
  { type: "dotPlot", variant: "dotPlot" },
  { type: "stripPlot", variant: "stripPlot" },
  { type: "sparklineChart", variant: "sparkline" },
  { type: "rangeChart", variant: "range" },
  { type: "rangeAreaChart", variant: "rangeArea" },
  { type: "bandChart", variant: "band" },
  { type: "ribbonChart", variant: "ribbon" },
  { type: "combinationChart", variant: "combination" },
  { type: "mixedChart", variant: "mixed" },
  { type: "waterfallChart", variant: "waterfall" },
  { type: "paretoChart", variant: "pareto" },
  { type: "runChart", variant: "run" },
  { type: "controlChart", variant: "control" },
  { type: "populationPyramidChart", variant: "populationPyramid" },
  { type: "bumpChart", variant: "bump" },
  { type: "horizonChart", variant: "horizon" }
];
for (const { type, variant } of CARTESIAN_TYPES) {
  registerDashboard(type, (props, app) => createCartesianWidget(app, type, props, variant));
}

// src/dashboard/charts/polar/polarBase.ts
function buildPolarSlices(group, app, data, size, colors, options = {}) {
  const innerR = options.innerRadius ?? 0;
  const outerR = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;
  const total = data.reduce((a, b) => a + b, 0) || 1;
  let startAngle = -Math.PI / 2;
  data.forEach((val, i) => {
    const sweep = val / total * Math.PI * 2;
    const endAngle = startAngle + sweep;
    group.add(
      new Arc({
        x: cx - outerR,
        y: cy - outerR,
        innerRadius: innerR,
        radius: outerR,
        startAngle,
        endAngle,
        fill: colors[i % colors.length],
        stroke: DASHBOARD.pieStroke,
        strokeWidth: 1,
        listening: false
      })
    );
    if (options.showLabels !== false && sweep > 0.15) {
      const mid = (startAngle + endAngle) / 2;
      const lr = (outerR + innerR) / 2;
      const [lx, ly] = polarToXY(cx, cy, lr, mid);
      const pct = Math.round(val / total * 100);
      group.add(
        app.text({
          text: `${pct}%`,
          x: lx - 10,
          y: ly - 6,
          fontSize: 10,
          fill: DASHBOARD.text,
          listening: false
        })
      );
    }
    startAngle = endAngle;
  });
}
function buildRadarChart(group, app, props) {
  const size = num2(props, "size", 200);
  const data = props.data ?? [4, 6, 3, 7, 5];
  const labels = props.categories ?? data.map((_, i) => `A${i + 1}`);
  const cx = size / 2;
  const cy = size / 2;
  const max = Math.max(...data, 1);
  const r = size / 2 - 24;
  const n = data.length;
  for (let ring = 1; ring <= 4; ring++) {
    const rr = r * ring / 4;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 - Math.PI / 2;
      pts.push(cx + rr * Math.cos(a), cy + rr * Math.sin(a));
    }
    group.add(app.polygon({ points: pts, fill: null, stroke: DASHBOARD.chartGrid, strokeWidth: 1, listening: false }));
  }
  const dataPts = [];
  data.forEach((v, i) => {
    const a = i / n * Math.PI * 2 - Math.PI / 2;
    const dr = v / max * r;
    dataPts.push(cx + dr * Math.cos(a), cy + dr * Math.sin(a));
    group.add(
      app.text({
        text: labels[i],
        x: cx + (r + 12) * Math.cos(a) - 8,
        y: cy + (r + 12) * Math.sin(a) - 6,
        fontSize: 10,
        fill: DASHBOARD.textMuted,
        listening: false
      })
    );
  });
  dataPts.push(dataPts[0], dataPts[1]);
  group.add(
    app.polygon({
      points: dataPts,
      fill: DASHBOARD.chartArea,
      stroke: DASHBOARD.chartLine,
      strokeWidth: 2,
      listening: false
    })
  );
  attachPolarSliceHover(
    app,
    group,
    props,
    size,
    data.map(() => 1),
    labels.map((l, i) => `${l}: ${data[i]}`)
  );
  setState2(group, { size, data, labels });
}
function createPieWidget(app, type, props, innerRadius = 0) {
  const size = num2(props, "size", 150);
  const data = props.data ?? [30, 25, 20, 25];
  const colors = props.colors ?? [...DASHBOARD.series];
  const resolvedInner = typeof props.innerRadius === "number" ? props.innerRadius : innerRadius > 0 ? innerRadius : type === "doughnutChart" ? Math.round(size * 0.42) : 0;
  const group = createWidgetGroup(app, type, props);
  buildPolarSlices(group, app, data, size, colors, {
    innerRadius: resolvedInner,
    showLabels: props.showLabels !== false
  });
  const labels = props.labels ?? data.map((_, i) => `Slice ${i + 1}`);
  attachPolarSliceHover(
    app,
    group,
    props,
    size,
    data,
    labels.map((l, i) => `${l}: ${data[i]}`),
    resolvedInner
  );
  setState2(group, { size, data, colors, innerRadius: resolvedInner });
  return group;
}

// src/dashboard/charts/polar/register.ts
registerDashboard("pieChart", (props, app) => createPieWidget(app, "pieChart", props, 0));
registerDashboard("doughnutChart", (props, app) => createPieWidget(app, "doughnutChart", props));
registerDashboard("radarChart", (props, app) => {
  const group = createWidgetGroup(app, "radarChart", props);
  buildRadarChart(group, app, props);
  return group;
});
registerDashboard("spiderChart", (props, app) => {
  const group = createWidgetGroup(app, "spiderChart", props);
  buildRadarChart(group, app, props);
  return group;
});
registerDashboard("polarAreaChart", (props, app) => {
  const size = num2(props, "size", 200);
  const data = props.data ?? [3, 5, 4, 6, 2];
  const group = createWidgetGroup(app, "polarAreaChart", props);
  const cx = size / 2;
  const max = Math.max(...data, 1);
  const n = data.length;
  let start = -Math.PI / 2;
  data.forEach((v, i) => {
    const sweep = Math.PI * 2 / n;
    const r = v / max * (size / 2 - 16);
    const end = start + sweep;
    group.add(
      app.arc({
        x: cx - r,
        y: cx - r,
        radius: r,
        startAngle: start,
        endAngle: end,
        fill: DASHBOARD.series[i % DASHBOARD.series.length],
        stroke: DASHBOARD.pieStroke,
        strokeWidth: 1,
        listening: false
      })
    );
    start = end;
  });
  attachPolarSliceHover(
    app,
    group,
    props,
    size,
    data,
    data.map((v, i) => `Cat ${i + 1}: ${v}`)
  );
  setState2(group, { size, data });
  return group;
});
registerDashboard("bulletChart", (props, app) => {
  const width = num2(props, "width", 260);
  const height = num2(props, "height", 48);
  const value = clamp3(num2(props, "value", 65), 0, 100);
  const target = num2(props, "target", 80);
  const max = num2(props, "max", 100);
  const group = createWidgetGroup(app, "bulletChart", props);
  group.add(app.rect({ width, height: height * 0.5, y: height * 0.25, fill: DASHBOARD.meterTrack, listening: false }));
  group.add(
    app.rect({
      x: 0,
      y: height * 0.25,
      width: width * value / max,
      height: height * 0.5,
      fill: DASHBOARD.primary,
      listening: false
    })
  );
  const tx = width * target / max;
  group.add(
    app.line({
      x: tx,
      y: height * 0.15,
      x2: 0,
      y2: height * 0.7,
      stroke: DASHBOARD.danger,
      strokeWidth: 3,
      listening: false
    })
  );
  attachValueHover(app, group, props, width, height, `Value: ${value} / Target: ${target}`);
  setState2(group, { width, height, value, target, max });
  return group;
});
registerDashboard("funnelChart", (props, app) => {
  const width = num2(props, "width", 200);
  const height = num2(props, "height", 220);
  const data = props.data ?? [100, 72, 48, 28, 12];
  const group = createWidgetGroup(app, "funnelChart", props);
  const max = Math.max(...data, 1);
  const step = height / data.length;
  data.forEach((v, i) => {
    const w = v / max * width;
    const x = (width - w) / 2;
    group.add(
      app.polygon({
        points: [x, i * step, x + w, i * step, x + w * 0.92, (i + 1) * step, x + w * 0.08, (i + 1) * step],
        fill: DASHBOARD.series[i % DASHBOARD.series.length],
        stroke: DASHBOARD.pieStroke,
        strokeWidth: 1,
        listening: false
      }),
      app.text({
        text: String(v),
        x: width / 2 - 12,
        y: i * step + step / 2 - 6,
        fontSize: 11,
        fill: DASHBOARD.text,
        listening: false
      })
    );
  });
  attachBandYHover(app, group, props, width, height, data.length, (i) => String(data[i]));
  setState2(group, { width, height, data });
  return group;
});
registerDashboard("pyramidChart", (props, app) => {
  const width = num2(props, "width", 200);
  const height = num2(props, "height", 200);
  const data = props.data ?? [10, 20, 35, 55, 80];
  const group = createWidgetGroup(app, "pyramidChart", props);
  const max = Math.max(...data, 1);
  const step = height / data.length;
  data.forEach((v, i) => {
    const w = v / max * width;
    const x = (width - w) / 2;
    group.add(
      app.rect({
        x,
        y: i * step,
        width: w,
        height: step - 2,
        fill: DASHBOARD.series[i % DASHBOARD.series.length],
        listening: false
      })
    );
  });
  attachBandYHover(app, group, props, width, height, data.length, (i) => String(data[i]));
  setState2(group, { width, height, data });
  return group;
});
registerDashboard("coneChart", (props, app) => {
  const width = num2(props, "width", 160);
  const height = num2(props, "height", 200);
  const group = createWidgetGroup(app, "coneChart", props);
  group.add(
    app.polygon({
      points: [width / 2, 0, width, height, 0, height],
      fill: DASHBOARD.primary,
      stroke: DASHBOARD.panelStroke,
      strokeWidth: 1,
      listening: false
    })
  );
  attachValueHover(app, group, props, width, height, "Cone chart");
  setState2(group, { width, height });
  return group;
});

// src/dashboard/charts/core/stats.ts
function histogramBins(data, binCount = 10) {
  if (!data.length)
    return [];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = span / binCount;
  const bins = Array.from({ length: binCount }, (_, i) => ({
    x0: min + i * step,
    x1: min + (i + 1) * step,
    count: 0
  }));
  for (const v of data) {
    const idx = Math.min(binCount - 1, Math.floor((v - min) / step));
    bins[idx].count++;
  }
  return bins;
}
function quantile(sorted, p) {
  if (!sorted.length)
    return 0;
  const pos = (sorted.length - 1) * p;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== void 0) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}
function boxStats(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    min: sorted[0] ?? 0,
    q1: quantile(sorted, 0.25),
    median: quantile(sorted, 0.5),
    q3: quantile(sorted, 0.75),
    max: sorted[sorted.length - 1] ?? 0
  };
}
function kdeSamples(data, points, bandwidth) {
  if (!data.length)
    return points.map(() => 0);
  const n = data.length;
  const h = bandwidth ?? (1.06 * stddev(data) * Math.pow(n, -0.2) || 1);
  return points.map((x) => {
    let sum = 0;
    for (const d of data) {
      const z = (x - d) / h;
      sum += Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
    }
    return sum / (n * h);
  });
}
function stddev(data) {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const v = data.reduce((a, b) => a + (b - mean) ** 2, 0) / data.length;
  return Math.sqrt(v);
}
function normalQuantiles(n) {
  return Array.from({ length: n }, (_, i) => {
    const p = (i + 0.5) / n;
    return Math.sqrt(2) * inverseErf(2 * p - 1);
  });
}
function inverseErf(x) {
  const a = 0.147;
  const ln = Math.log(1 - x * x);
  const s = Math.sign(x);
  const t = 2 / (Math.PI * a) + ln / 2;
  return s * Math.sqrt(Math.sqrt(t * t - ln / a) - t);
}
function hexbinCenters(points, _width, _height, radius) {
  const bins = /* @__PURE__ */ new Map();
  const dx = radius * 1.5;
  const dy = radius * Math.sqrt(3);
  for (const [px, py] of points) {
    const col = Math.round(px / dx);
    const row = Math.round(py / dy);
    const cx = col * dx;
    const cy = row * dy + (col % 2 ? dy / 2 : 0);
    const key = `${col},${row}`;
    const existing = bins.get(key);
    if (existing)
      existing.count++;
    else
      bins.set(key, { x: cx, y: cy, count: 1 });
  }
  return bins;
}

// src/dashboard/charts/statistical/register.ts
function plotChrome(app, group, width, height, bounds) {
  const layout = defaultLayout(width, height);
  const yTicks = computeTicks(bounds.min, bounds.max, 5);
  group.add(app.rect({ width, height, fill: DASHBOARD.chartBg, listening: true }));
  group.add(app.rect({ x: layout.plotX, y: layout.plotY, width: layout.plotWidth, height: layout.plotHeight, fill: DASHBOARD.chartPlot, listening: false }));
  addGridLines(app, group, layout, yTicks, bounds);
  addAxes(app, group, layout, bounds, yTicks);
  return layout;
}
registerDashboard("histogram", (props, app) => {
  const width = num2(props, "width", 300);
  const height = num2(props, "height", 150);
  const data = props.data ?? [2, 3, 3, 4, 5, 5, 5, 6, 7, 8, 9, 12];
  const bins = histogramBins(data, num2(props, "binCount", 8));
  const max = Math.max(...bins.map((b) => b.count), 1);
  const group = createWidgetGroup(app, "histogram", props);
  const layout = plotChrome(app, group, width, height, { min: 0, max });
  const bw = layout.plotWidth / bins.length;
  bins.forEach((b, i) => {
    const h = b.count / max * layout.plotHeight;
    group.add(app.rect({ x: layout.plotX + i * bw, y: layout.plotY + layout.plotHeight - h, width: bw - 2, height: h, fill: DASHBOARD.barFill, listening: false }));
  });
  attachIndexXHover(
    app,
    group,
    props,
    layout,
    bins.length,
    (i) => `${bins[i].x0.toFixed(1)}\u2013${bins[i].x1.toFixed(1)}: ${bins[i].count}`,
    (i) => {
      const h = bins[i].count / max * layout.plotHeight;
      return { x: layout.plotX + i * bw, y: layout.plotY + layout.plotHeight - h, width: bw - 2, height: h };
    }
  );
  setState2(group, { width, height, data });
  return group;
});
registerDashboard("boxPlot", (props, app) => {
  const width = num2(props, "width", 300);
  const height = num2(props, "height", 150);
  const sets = Array.isArray(props.data?.[0]) ? props.data : props.data ?? [[2, 3, 4, 5, 6, 7, 8], [3, 5, 7, 9, 11]];
  const group = createWidgetGroup(app, "boxPlot", props);
  const layout = plotChrome(app, group, width, height, dataBounds(sets.flat()));
  const slot = layout.plotWidth / sets.length;
  sets.forEach((vals, i) => {
    const s = boxStats(vals);
    const cx = layout.plotX + slot * i + slot / 2;
    const scale = linearScale([s.min, s.max], [layout.plotY + layout.plotHeight, layout.plotY]);
    const yQ1 = scale(s.q1);
    const yQ3 = scale(s.q3);
    const yMed = scale(s.median);
    group.add(
      app.rect({ x: cx - 16, y: yQ3, width: 32, height: yQ1 - yQ3, fill: DASHBOARD.chartArea, stroke: DASHBOARD.chartLine, strokeWidth: 1, listening: false }),
      app.line({ x: cx - 16, y: yMed, x2: 32, y2: 0, stroke: DASHBOARD.chartLine, strokeWidth: 2, listening: false }),
      app.line({ x: cx, y: scale(s.min), x2: 0, y2: scale(s.max) - scale(s.min), stroke: DASHBOARD.textMuted, strokeWidth: 1, listening: false })
    );
  });
  attachIndexXHover(app, group, props, layout, sets.length, (i) => {
    const s = boxStats(sets[i]);
    return `med ${s.median} [${s.q1}, ${s.q3}]`;
  });
  setState2(group, { width, height, data: sets });
  return group;
});
registerDashboard("boxAndWhiskerChart", (props, app) => {
  const width = num2(props, "width", 300);
  const height = num2(props, "height", 150);
  const sets = Array.isArray(props.data?.[0]) ? props.data : props.data ?? [[2, 3, 4, 5, 6, 7, 8], [3, 5, 7, 9, 11]];
  const group = createWidgetGroup(app, "boxAndWhiskerChart", props);
  const layout = plotChrome(app, group, width, height, dataBounds(sets.flat()));
  const slot = layout.plotWidth / sets.length;
  sets.forEach((vals, i) => {
    const s = boxStats(vals);
    const cx = layout.plotX + slot * i + slot / 2;
    const scale = linearScale([s.min, s.max], [layout.plotY + layout.plotHeight, layout.plotY]);
    const yQ1 = scale(s.q1);
    const yQ3 = scale(s.q3);
    const yMed = scale(s.median);
    group.add(
      app.rect({ x: cx - 16, y: yQ3, width: 32, height: yQ1 - yQ3, fill: DASHBOARD.chartArea, stroke: DASHBOARD.chartLine, strokeWidth: 1, listening: false }),
      app.line({ x: cx - 16, y: yMed, x2: 32, y2: 0, stroke: DASHBOARD.chartLine, strokeWidth: 2, listening: false }),
      app.line({ x: cx, y: scale(s.min), x2: 0, y2: scale(s.max) - scale(s.min), stroke: DASHBOARD.textMuted, strokeWidth: 1, listening: false })
    );
  });
  attachIndexXHover(app, group, props, layout, sets.length, (i) => {
    const s = boxStats(sets[i]);
    return `med ${s.median} [${s.q1}, ${s.q3}]`;
  });
  setState2(group, { width, height, data: sets });
  return group;
});
registerDashboard("violinPlot", (props, app) => {
  const width = num2(props, "width", 300);
  const height = num2(props, "height", 150);
  const data = props.data ?? [2, 3, 3, 4, 5, 5, 6, 7, 8, 9];
  const group = createWidgetGroup(app, "violinPlot", props);
  const layout = plotChrome(app, group, width, height, dataBounds(data));
  const samples = Array.from({ length: 20 }, (_, i) => layout.plotY + layout.plotHeight / 19 * i);
  const dens = kdeSamples(data, samples.map((y) => layout.plotY + layout.plotHeight - (y - layout.plotY)));
  const maxD = Math.max(...dens, 1e-3);
  const cx = layout.plotX + layout.plotWidth / 2;
  const pts = [];
  dens.forEach((d, i) => {
    const y = layout.plotY + layout.plotHeight / dens.length * i;
    pts.push(cx - d / maxD * 40, y, cx + d / maxD * 40, y);
  });
  group.add(app.polygon({ points: pts, fill: DASHBOARD.chartArea, stroke: DASHBOARD.chartLine, strokeWidth: 1, listening: false }));
  attachIndexXHover(app, group, props, layout, 20, (i) => {
    const y = layout.plotY + layout.plotHeight / 19 * i;
    const v = layout.plotY + layout.plotHeight - (y - layout.plotY);
    return `density @ ${v.toFixed(1)}`;
  });
  setState2(group, { width, height, data });
  return group;
});
registerDashboard("densityPlot", (props, app) => {
  const width = num2(props, "width", 300);
  const height = num2(props, "height", 150);
  const data = props.data ?? [2, 3, 3, 4, 5, 5, 6, 7, 8, 9];
  const group = createWidgetGroup(app, "densityPlot", props);
  const bounds = dataBounds(data);
  const layout = plotChrome(app, group, width, height, bounds);
  const xs = Array.from({ length: 40 }, (_, i) => bounds.min + (bounds.max - bounds.min) * i / 39);
  const dens = kdeSamples(data, xs);
  const maxD = Math.max(...dens, 1e-3);
  const pts = [];
  xs.forEach((_x, i) => {
    const px = layout.plotX + layout.plotWidth * i / 39;
    const py = layout.plotY + layout.plotHeight - dens[i] / maxD * layout.plotHeight;
    pts.push(px, py);
  });
  group.add(app.polyline({ points: pts, fill: null, stroke: DASHBOARD.chartLine, strokeWidth: 2, listening: false }));
  attachIndexXHover(app, group, props, layout, xs.length, (i) => `x=${xs[i].toFixed(1)} \u03C1=${dens[i].toFixed(3)}`);
  setState2(group, { width, height, data });
  return group;
});
registerDashboard("heatmap", (props, app) => {
  const width = num2(props, "width", 240);
  const height = num2(props, "height", 160);
  const matrix = props.matrix ?? [
    [1, 3, 5, 2],
    [4, 1, 6, 3],
    [2, 5, 1, 4]
  ];
  const group = createWidgetGroup(app, "heatmap", props);
  const max = Math.max(...matrix.flat(), 1);
  const rows = matrix.length;
  const cols = matrix[0]?.length ?? 1;
  const cw = width / cols;
  const ch = height / rows;
  matrix.forEach((row, ri) => {
    row.forEach((v, ci) => {
      const t = v / max;
      const r = Math.round(59 + t * 100);
      const g = Math.round(130 - t * 80);
      const b = Math.round(246 - t * 100);
      group.add(app.rect({ x: ci * cw, y: ri * ch, width: cw - 1, height: ch - 1, fill: `rgb(${r},${g},${b})`, listening: false }));
    });
  });
  attachGridHover(app, group, props, width, height, rows, cols, (ri, ci) => String(matrix[ri][ci]));
  setState2(group, { width, height, matrix });
  return group;
});
registerDashboard("hexbinChart", (props, app) => {
  const width = num2(props, "width", 300);
  const height = num2(props, "height", 150);
  const points = props.points ?? Array.from({ length: 40 }, () => ({ x: Math.random() * 280, y: Math.random() * 130 }));
  const group = createWidgetGroup(app, "hexbinChart", props);
  group.add(app.rect({ width, height, fill: DASHBOARD.chartBg, listening: true }));
  const bins = hexbinCenters(points.map((p) => [p.x, p.y]), width, height, 12);
  const max = Math.max(...[...bins.values()].map((b) => b.count), 1);
  for (const b of bins.values()) {
    group.add(app.circle({ x: b.x - 10, y: b.y - 10, radius: 10, fill: DASHBOARD.primary, opacity: b.count / max, listening: false }));
  }
  attachNearestHover(
    app,
    group,
    props,
    { x: 0, y: 0, width, height },
    [...bins.values()].map((b) => ({ x: b.x, y: b.y, label: `count: ${b.count}` }))
  );
  setState2(group, { width, height, points });
  return group;
});
registerDashboard("contourChart", (props, app) => {
  const width = num2(props, "width", 300);
  const height = num2(props, "height", 150);
  const group = createWidgetGroup(app, "contourChart", props);
  group.add(app.rect({ width, height, fill: DASHBOARD.chartBg, listening: true }));
  for (let i = 1; i <= 5; i++) {
    const inset = i * 12;
    group.add(app.rect({ x: inset, y: inset, width: width - inset * 2, height: height - inset * 2, fill: null, stroke: DASHBOARD.chartLine, strokeWidth: 1, listening: false }));
  }
  attachGridHover(app, group, props, width, height, 5, 5, (_r, _c) => "contour");
  setState2(group, { width, height });
  return group;
});
registerDashboard("qqPlot", (props, app) => {
  const width = num2(props, "width", 300);
  const height = num2(props, "height", 150);
  const data = props.data ?? [2, 3, 3, 4, 5, 5, 6, 7, 8, 9];
  const sorted = [...data].sort((a, b) => a - b);
  const theoretical = normalQuantiles(sorted.length);
  const group = createWidgetGroup(app, "qqPlot", props);
  const bounds = dataBounds([...sorted, ...theoretical]);
  const layout = plotChrome(app, group, width, height, bounds);
  sorted.forEach((_v, i) => {
    const x = layout.plotX + layout.plotWidth * i / Math.max(sorted.length - 1, 1);
    const tx = theoretical[i];
    const range = bounds.max - bounds.min || 1;
    const py = layout.plotY + layout.plotHeight - (tx - bounds.min) / range * layout.plotHeight;
    group.add(app.circle({ x: x - 3, y: py - 3, radius: 3, fill: DASHBOARD.chartDot, listening: false }));
  });
  attachIndexXHover(app, group, props, layout, sorted.length, (i) => `obs ${sorted[i]} / q ${theoretical[i].toFixed(2)}`);
  setState2(group, { width, height, data });
  return group;
});
registerDashboard("beeswarmChart", (props, app) => {
  const width = num2(props, "width", 300);
  const height = num2(props, "height", 150);
  const data = props.data ?? [2, 3, 3, 4, 5, 5, 6, 7, 8, 9];
  const group = createWidgetGroup(app, "beeswarmChart", props);
  const layout = plotChrome(app, group, width, height, dataBounds(data));
  const cx = layout.plotX + layout.plotWidth / 2;
  const db = dataBounds(data);
  data.forEach((v, i) => {
    const y = layout.plotY + layout.plotHeight - (v - db.min) / (db.max - db.min || 1) * layout.plotHeight;
    const x = cx + (i % 7 - 3) * 8;
    group.add(app.circle({ x: x - 3, y: y - 3, radius: 4, fill: DASHBOARD.chartDot, listening: false }));
  });
  attachNearestHover(
    app,
    group,
    props,
    { x: layout.plotX, y: layout.plotY, width: layout.plotWidth, height: layout.plotHeight },
    data.map((v, i) => {
      const y = layout.plotY + layout.plotHeight - (v - db.min) / (db.max - db.min || 1) * layout.plotHeight;
      const x = cx + (i % 7 - 3) * 8;
      return { x, y, label: String(v) };
    })
  );
  setState2(group, { width, height, data });
  return group;
});
registerDashboard("ridgelinePlot", (props, app) => {
  const width = num2(props, "width", 300);
  const height = num2(props, "height", 200);
  const series = props.series ?? [[2, 3, 4, 5], [3, 5, 7, 9], [1, 2, 3, 8]];
  const group = createWidgetGroup(app, "ridgelinePlot", props);
  group.add(app.rect({ width, height, fill: DASHBOARD.chartBg, listening: true }));
  const band = height / series.length;
  series.forEach((data, si) => {
    const bounds = dataBounds(data);
    const y0 = si * band + 10;
    const pts = [];
    data.forEach((v, i) => {
      pts.push(30 + (width - 60) * (i / Math.max(data.length - 1, 1)), y0 + band - 10 - (v - bounds.min) / (bounds.max - bounds.min || 1) * (band - 20));
    });
    group.add(app.polyline({ points: pts, fill: null, stroke: DASHBOARD.series[si % DASHBOARD.series.length], strokeWidth: 2, listening: false }));
  });
  attachBandYHover(app, group, props, width, height, series.length, (i) => `series ${i + 1}`);
  setState2(group, { width, height, series });
  return group;
});
registerDashboard("parallelCoordinatesPlot", (props, app) => {
  const width = num2(props, "width", 300);
  const height = num2(props, "height", 150);
  const dimensions = props.dimensions ?? [[1, 5, 3], [2, 4, 6], [3, 2, 8]];
  const group = createWidgetGroup(app, "parallelCoordinatesPlot", props);
  group.add(app.rect({ width, height, fill: DASHBOARD.chartBg, listening: true }));
  const cols = dimensions[0]?.length ?? 3;
  const step = (width - 40) / Math.max(cols - 1, 1);
  for (let c = 0; c < cols; c++) {
    const x = 20 + c * step;
    group.add(app.line({ x, y: 20, x2: 0, y2: height - 40, stroke: DASHBOARD.chartGrid, strokeWidth: 1, listening: false }));
  }
  dimensions.forEach((row, ri) => {
    const pts = [];
    const max = Math.max(...row, 1);
    row.forEach((v, ci) => {
      pts.push(20 + ci * step, height - 20 - v / max * (height - 40));
    });
    group.add(app.polyline({ points: pts, fill: null, stroke: DASHBOARD.series[ri % DASHBOARD.series.length], strokeWidth: 1.5, listening: false }));
  });
  attachIndexXHover(
    app,
    group,
    props,
    { plotX: 20, plotY: 20, plotWidth: width - 40, plotHeight: height - 40 },
    cols,
    (i) => `dim ${i + 1}`
  );
  setState2(group, { width, height, dimensions });
  return group;
});
registerDashboard("mosaicChart", (props, app) => {
  const width = num2(props, "width", 300);
  const height = num2(props, "height", 150);
  const cells = props.cells ?? [
    { w: 0.5, h: 0.5, value: 1 },
    { w: 0.5, h: 0.5, value: 2 },
    { w: 0.3, h: 0.5, value: 3 },
    { w: 0.7, h: 0.5, value: 4 }
  ];
  const group = createWidgetGroup(app, "mosaicChart", props);
  let x = 0;
  let y = 0;
  const regions = [];
  cells.forEach((c, i) => {
    const cw = c.w * width;
    const ch = c.h * height;
    regions.push({ x, y, width: cw - 1, height: ch - 1, label: String(c.value) });
    group.add(app.rect({ x, y, width: cw - 1, height: ch - 1, fill: DASHBOARD.series[i % DASHBOARD.series.length], listening: false }));
    x += cw;
    if (x >= width - 1) {
      x = 0;
      y += ch;
    }
  });
  attachRegionsHover(app, group, props, width, height, regions);
  setState2(group, { width, height, cells });
  return group;
});
registerDashboard("marimekkoChart", (props, app) => {
  const width = num2(props, "width", 300);
  const height = num2(props, "height", 150);
  const segments = props.segments ?? [
    { widthFrac: 0.4, heightFrac: 0.6 },
    { widthFrac: 0.6, heightFrac: 0.4 },
    { widthFrac: 0.5, heightFrac: 0.5 }
  ];
  const group = createWidgetGroup(app, "marimekkoChart", props);
  let x = 0;
  const regions = [];
  segments.forEach((s, i) => {
    const w = s.widthFrac * width;
    const h = s.heightFrac * height;
    regions.push({ x, y: height - h, width: w - 1, height: h, label: `${Math.round(s.widthFrac * 100)}%` });
    group.add(app.rect({ x, y: height - h, width: w - 1, height: h, fill: DASHBOARD.series[i % DASHBOARD.series.length], listening: false }));
    x += w;
  });
  attachRegionsHover(app, group, props, width, height, regions);
  setState2(group, { width, height, segments });
  return group;
});
registerDashboard("mekkoChart", (props, app) => {
  const width = num2(props, "width", 300);
  const height = num2(props, "height", 150);
  const segments = props.segments ?? [
    { widthFrac: 0.4, heightFrac: 0.6 },
    { widthFrac: 0.6, heightFrac: 0.4 },
    { widthFrac: 0.5, heightFrac: 0.5 }
  ];
  const group = createWidgetGroup(app, "mekkoChart", props);
  let x = 0;
  const regions = [];
  segments.forEach((s, i) => {
    const w = s.widthFrac * width;
    const h = s.heightFrac * height;
    regions.push({ x, y: height - h, width: w - 1, height: h, label: `${Math.round(s.widthFrac * 100)}%` });
    group.add(app.rect({ x, y: height - h, width: w - 1, height: h, fill: DASHBOARD.series[i % DASHBOARD.series.length], listening: false }));
    x += w;
  });
  attachRegionsHover(app, group, props, width, height, regions);
  setState2(group, { width, height, segments });
  return group;
});
registerDashboard("waffleChart", (props, app) => {
  const size = num2(props, "size", 160);
  const total = num2(props, "total", 100);
  const value = num2(props, "value", 42);
  const group = createWidgetGroup(app, "waffleChart", props);
  const grid = 10;
  const cell = size / grid;
  const filled = Math.round(value / total * grid * grid);
  for (let i = 0; i < grid * grid; i++) {
    const col = i % grid;
    const row = Math.floor(i / grid);
    group.add(
      app.rect({
        x: col * cell,
        y: row * cell,
        width: cell - 2,
        height: cell - 2,
        fill: i < filled ? DASHBOARD.primary : DASHBOARD.inactive,
        cornerRadius: 2,
        listening: false
      })
    );
  }
  attachGridHover(app, group, props, size, size, grid, grid, (_r, c) => {
    const idx = _r * grid + c;
    return idx < filled ? "filled" : "empty";
  });
  setState2(group, { size, total, value });
  return group;
});
registerDashboard("calendarHeatmap", (props, app) => {
  const group = createWidgetGroup(app, "calendarHeatmap", props);
  installChartRebuild(group, app, buildCalendarHeatmap);
  return group;
});
function buildCalendarHeatmap(group, app, props) {
  const width = num2(props, "width", 280);
  const height = num2(props, "height", 120);
  const values = props.values ?? Array.from({ length: 35 }, (_, i) => i % 7 + 1);
  const max = Math.max(...values, 1);
  const cols = 7;
  const rows = Math.ceil(values.length / cols);
  const gap = 2;
  const cellW = (width - gap * (cols - 1)) / cols;
  const cellH = (height - gap * (rows - 1)) / rows;
  const cell = Math.max(4, Math.floor(Math.min(cellW, cellH)));
  const gridW = cols * cell + gap * (cols - 1);
  const gridH = rows * cell + gap * (rows - 1);
  const offsetX = Math.max(0, (width - gridW) / 2);
  const offsetY = Math.max(0, (height - gridH) / 2);
  values.forEach((v, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const t = v / max;
    group.add(
      app.rect({
        x: offsetX + col * (cell + gap),
        y: offsetY + row * (cell + gap),
        width: cell,
        height: cell,
        fill: `rgba(59,130,246,${0.2 + t * 0.8})`,
        cornerRadius: Math.min(2, cell * 0.15),
        listening: false
      })
    );
  });
  attachGridHover(app, group, props, width, height, rows, cols, (row, col) => {
    const v = values[row * cols + col];
    return v != null ? String(v) : "";
  });
  setState2(group, { width, height, values });
}
registerDashboard("stemLeafPlot", (props, app) => {
  const width = num2(props, "width", 200);
  const height = num2(props, "height", 180);
  const data = props.data ?? [12, 23, 23, 34, 45, 56, 67, 78, 89];
  const group = createWidgetGroup(app, "stemLeafPlot", props);
  const stems = /* @__PURE__ */ new Map();
  data.forEach((v) => {
    const stem = Math.floor(v / 10);
    const leaf = v % 10;
    if (!stems.has(stem))
      stems.set(stem, []);
    stems.get(stem).push(leaf);
  });
  let y = 8;
  for (const [stem, leaves] of [...stems.entries()].sort((a, b) => a[0] - b[0])) {
    group.add(
      app.text({ text: `${stem} | ${leaves.join(" ")}`, x: 8, y, fontSize: 12, fill: DASHBOARD.text, listening: false })
    );
    y += 16;
  }
  const rowCount = stems.size;
  attachBandYHover(app, group, props, width, height, rowCount, (i) => {
    const entries = [...stems.entries()].sort((a, b) => a[0] - b[0]);
    const [stem, leaves] = entries[i] ?? [0, []];
    return `${stem} | ${leaves.join(" ")}`;
  });
  setState2(group, { width, height, data });
  return group;
});
registerDashboard("scatterChart", (props, app) => {
  const width = num2(props, "width", 300);
  const height = num2(props, "height", 150);
  const points = props.points ?? [
    { x: 10, y: 20 },
    { x: 30, y: 45 },
    { x: 50, y: 35 },
    { x: 70, y: 80 },
    { x: 90, y: 60 }
  ];
  const group = createWidgetGroup(app, "scatterChart", props);
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const layout = plotChrome(app, group, width, height, { min: Math.min(...ys, 0), max: Math.max(...ys, 1) });
  const xScale = linearScale([Math.min(...xs), Math.max(...xs)], [layout.plotX, layout.plotX + layout.plotWidth]);
  const yScale = linearScale([Math.min(...ys), Math.max(...ys)], [layout.plotY + layout.plotHeight, layout.plotY]);
  points.forEach((p) => {
    group.add(app.circle({ x: xScale(p.x) - 4, y: yScale(p.y) - 4, radius: 4, fill: DASHBOARD.chartDot, listening: false }));
  });
  attachNearestHover(
    app,
    group,
    props,
    { x: layout.plotX, y: layout.plotY, width: layout.plotWidth, height: layout.plotHeight },
    points.map((p) => ({
      x: xScale(p.x),
      y: yScale(p.y),
      label: `(${p.x}, ${p.y})`
    }))
  );
  setState2(group, { width, height, points });
  return group;
});
registerDashboard("bubbleChart", (props, app) => {
  const width = num2(props, "width", 300);
  const height = num2(props, "height", 150);
  const points = props.points ?? [
    { x: 20, y: 30, size: 10 },
    { x: 50, y: 60, size: 25 },
    { x: 80, y: 40, size: 15 }
  ];
  const group = createWidgetGroup(app, "bubbleChart", props);
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const layout = plotChrome(app, group, width, height, { min: Math.min(...ys, 0), max: Math.max(...ys, 1) });
  const xScale = linearScale([Math.min(...xs), Math.max(...xs)], [layout.plotX, layout.plotX + layout.plotWidth]);
  const yScale = linearScale([Math.min(...ys), Math.max(...ys)], [layout.plotY + layout.plotHeight, layout.plotY]);
  points.forEach((p) => {
    const r = (p.size ?? 8) / 2;
    group.add(app.circle({ x: xScale(p.x) - r, y: yScale(p.y) - r, radius: r, fill: DASHBOARD.chartArea, stroke: DASHBOARD.chartLine, strokeWidth: 1, listening: false }));
  });
  attachNearestHover(
    app,
    group,
    props,
    { x: layout.plotX, y: layout.plotY, width: layout.plotWidth, height: layout.plotHeight },
    points.map((p) => ({
      x: xScale(p.x),
      y: yScale(p.y),
      label: `(${p.x}, ${p.y}) r=${p.size ?? 8}`
    }))
  );
  setState2(group, { width, height, points });
  return group;
});

// src/dashboard/charts/core/financial.ts
function toHeikinAshi(bars) {
  const out = [];
  for (const b of bars) {
    const close = (b.open + b.high + b.low + b.close) / 4;
    const open = out.length ? (out[out.length - 1].open + out[out.length - 1].close) / 2 : (b.open + b.close) / 2;
    const high = Math.max(b.high, open, close);
    const low = Math.min(b.low, open, close);
    out.push({ time: b.time, open, high, low, close, volume: b.volume });
  }
  return out;
}
function toRenko(bars, brickSize) {
  const out = [];
  if (!bars.length)
    return out;
  let price = bars[0].close;
  for (const b of bars) {
    let diff = b.close - price;
    while (Math.abs(diff) >= brickSize) {
      const dir = diff > 0 ? 1 : -1;
      const open = price;
      price += dir * brickSize;
      out.push({
        time: b.time,
        open,
        high: Math.max(open, price),
        low: Math.min(open, price),
        close: price
      });
      diff = b.close - price;
    }
  }
  return out;
}
function toKagi(bars, reversal) {
  const pts = [];
  if (!bars.length)
    return pts;
  let dir = 0;
  let price = bars[0].close;
  pts.push({ x: 0, y: price });
  for (let i = 1; i < bars.length; i++) {
    const c = bars[i].close;
    if (dir >= 0 && c >= price + reversal) {
      dir = 1;
      price = c;
      pts.push({ x: i, y: price });
    } else if (dir <= 0 && c <= price - reversal) {
      dir = -1;
      price = c;
      pts.push({ x: i, y: price });
    } else if (dir === 1 && c < price - reversal) {
      dir = -1;
      price = c;
      pts.push({ x: i, y: price });
    } else if (dir === -1 && c > price + reversal) {
      dir = 1;
      price = c;
      pts.push({ x: i, y: price });
    }
  }
  return pts;
}
function toPointAndFigure(bars, boxSize, reversal = 3) {
  const out = [];
  if (!bars.length)
    return out;
  let col = 0;
  let price = bars[0].close;
  let dir = null;
  for (const b of bars) {
    if (!dir) {
      dir = b.close >= price ? "X" : "O";
      price = b.close;
      continue;
    }
    const move = b.close - price;
    const boxes = Math.floor(Math.abs(move) / boxSize);
    if (boxes >= reversal && (dir === "X" && move < 0 || dir === "O" && move > 0)) {
      dir = dir === "X" ? "O" : "X";
      col++;
      price = b.close;
      out.push({ time: col, open: price, high: price + boxSize, low: price - boxSize, close: price });
    } else if (boxes > 0) {
      price += (move > 0 ? 1 : -1) * boxes * boxSize;
      out.push({ time: col, open: price, high: price + boxSize, low: price - boxSize, close: price });
    }
  }
  return out;
}
function volumeProfile(bars, bins = 20) {
  if (!bars.length)
    return [];
  const lows = bars.map((b) => b.low);
  const highs = bars.map((b) => b.high);
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  const step = (max - min) / bins || 1;
  const profile = Array.from({ length: bins }, (_, i) => ({
    price: min + (i + 0.5) * step,
    volume: 0
  }));
  for (const b of bars) {
    const vol = b.volume ?? 1;
    const idx = Math.min(bins - 1, Math.floor((b.close - min) / step));
    profile[idx].volume += vol;
  }
  return profile;
}
var SAMPLE_OHLC = [
  { time: "1", open: 100, high: 105, low: 98, close: 103, volume: 1200 },
  { time: "2", open: 103, high: 108, low: 101, close: 106, volume: 1500 },
  { time: "3", open: 106, high: 107, low: 99, close: 100, volume: 1800 },
  { time: "4", open: 100, high: 104, low: 97, close: 102, volume: 1100 },
  { time: "5", open: 102, high: 110, low: 101, close: 109, volume: 2e3 },
  { time: "6", open: 109, high: 112, low: 105, close: 107, volume: 1600 },
  { time: "7", open: 107, high: 109, low: 103, close: 104, volume: 1300 }
];

// src/dashboard/charts/financial/register.ts
function ohlcLabel(b) {
  return `C:${b.close} H:${b.high} L:${b.low}`;
}
function attachOhlcHover(app, group, props, layout, bars) {
  attachIndexXHover(app, group, props, layout, bars.length, (i) => ohlcLabel(bars[i]), void 0, (i) => ({
    index: i,
    bar: bars[i],
    value: bars[i].close
  }));
}
function getOhlc(props) {
  return props.data ?? SAMPLE_OHLC;
}
function plotFinancial(app, group, bars, width, height, props, style = "candle") {
  const lows = bars.map((b) => b.low);
  const highs = bars.map((b) => b.high);
  const bounds = { min: Math.min(...lows), max: Math.max(...highs) };
  const layout = defaultLayout(width, height);
  const yTicks = computeTicks(bounds.min, bounds.max, 5);
  group.add(app.rect({ width, height, fill: DASHBOARD.chartBg, listening: true }));
  group.add(app.rect({ x: layout.plotX, y: layout.plotY, width: layout.plotWidth, height: layout.plotHeight, fill: DASHBOARD.chartPlot, listening: false }));
  addGridLines(app, group, layout, yTicks, bounds);
  addAxes(app, group, layout, bounds, yTicks);
  const slot = layout.plotWidth / Math.max(bars.length, 1);
  const yScale = linearScale([bounds.min, bounds.max], [layout.plotY + layout.plotHeight, layout.plotY]);
  bars.forEach((b, i) => {
    const cx = layout.plotX + slot * i + slot / 2;
    const yH = yScale(b.high);
    const yL = yScale(b.low);
    const up = b.close >= b.open;
    const color = up ? DASHBOARD.financialUp : DASHBOARD.financialDown;
    if (style === "ohlc") {
      group.add(
        app.line({ x: cx, y: yH, x2: 0, y2: yL - yH, stroke: color, strokeWidth: 1, listening: false }),
        app.line({ x: cx - slot * 0.3, y: yScale(b.open), x2: slot * 0.3, y2: 0, stroke: color, strokeWidth: 2, listening: false }),
        app.line({ x: cx, y: yScale(b.close), x2: slot * 0.3, y2: 0, stroke: color, strokeWidth: 2, listening: false })
      );
    } else if (style === "hilo") {
      group.add(app.line({ x: cx, y: yH, x2: 0, y2: yL - yH, stroke: color, strokeWidth: 2, listening: false }));
    } else {
      const yO = yScale(b.open);
      const yC = yScale(b.close);
      const bodyTop = Math.min(yO, yC);
      const bodyH = Math.max(2, Math.abs(yC - yO));
      group.add(
        app.line({ x: cx, y: yH, x2: 0, y2: yL - yH, stroke: color, strokeWidth: 1, listening: false }),
        app.rect({ x: cx - slot * 0.25, y: bodyTop, width: slot * 0.5, height: bodyH, fill: up ? color : DASHBOARD.chartBg, stroke: color, strokeWidth: 1, listening: false })
      );
    }
  });
  attachOhlcHover(app, group, props, layout, bars);
  return layout;
}
function registerOhlcChart(type, style, transform) {
  registerDashboard(type, (props, app) => {
    const width = num2(props, "width", 300);
    const height = num2(props, "height", 150);
    let bars = getOhlc(props);
    const group = createWidgetGroup(app, type, props);
    if (transform)
      bars = transform(bars);
    plotFinancial(app, group, bars, width, height, props, style);
    setState2(group, { width, height, data: bars });
    return group;
  });
}
registerOhlcChart("candlestickChart", "candle");
registerOhlcChart("kLineChart", "candle");
registerOhlcChart("ohlcChart", "ohlc");
registerOhlcChart("highLowChart", "hilo");
registerOhlcChart("heikinAshiChart", "candle", toHeikinAshi);
registerOhlcChart("renkoChart", "candle", (b) => toRenko(b, 3));
registerOhlcChart("pointAndFigureChart", "candle", (b) => toPointAndFigure(b, 2));
registerDashboard("kagiChart", (props, app) => {
  const width = num2(props, "width", 300);
  const height = num2(props, "height", 150);
  const bars = getOhlc(props);
  const pts = toKagi(bars, num2(props, "reversal", 4));
  const group = createWidgetGroup(app, "kagiChart", props);
  const layout = defaultLayout(width, height);
  group.add(app.rect({ width, height, fill: DASHBOARD.chartBg, listening: true }));
  const ys = pts.map((p) => p.y);
  const bounds = dataBounds(ys);
  const yScale = linearScale([bounds.min, bounds.max], [layout.plotY + layout.plotHeight, layout.plotY]);
  const linePts = [];
  pts.forEach((p, i) => {
    linePts.push(layout.plotX + layout.plotWidth * i / Math.max(pts.length - 1, 1), yScale(p.y));
  });
  group.add(app.polyline({ points: linePts, fill: null, stroke: DASHBOARD.chartLine, strokeWidth: 2, listening: false }));
  attachIndexXHover(app, group, props, layout, pts.length, (i) => `price: ${pts[i].y.toFixed(2)}`);
  setState2(group, { width, height, data: bars });
  return group;
});
registerDashboard("volumeChart", (props, app) => {
  const width = num2(props, "width", 300);
  const height = num2(props, "height", 120);
  const bars = getOhlc(props);
  const group = createWidgetGroup(app, "volumeChart", props);
  const layout = defaultLayout(width, height);
  const maxVol = Math.max(...bars.map((b) => b.volume ?? 0), 1);
  const slot = layout.plotWidth / bars.length;
  group.add(app.rect({ width, height, fill: DASHBOARD.chartBg, listening: true }));
  bars.forEach((b, i) => {
    const v = b.volume ?? 0;
    const h = v / maxVol * layout.plotHeight;
    const up = b.close >= b.open;
    group.add(
      app.rect({
        x: layout.plotX + i * slot,
        y: layout.plotY + layout.plotHeight - h,
        width: slot - 2,
        height: h,
        fill: up ? DASHBOARD.financialUp : DASHBOARD.financialDown,
        listening: false
      })
    );
  });
  attachIndexXHover(app, group, props, layout, bars.length, (i) => `vol: ${bars[i].volume ?? 0}`);
  setState2(group, { width, height, data: bars });
  return group;
});
registerDashboard("candlestickVolumeChart", (props, app) => {
  const width = num2(props, "width", 300);
  const height = num2(props, "height", 220);
  const bars = getOhlc(props);
  const group = createWidgetGroup(app, "candlestickVolumeChart", props);
  plotFinancial(app, group, bars, width, height * 0.65, props, "candle");
  const volH = height * 0.3;
  const layout = defaultLayout(width, volH);
  layout.plotY = height * 0.68;
  const maxVol = Math.max(...bars.map((b) => b.volume ?? 0), 1);
  const slot = layout.plotWidth / bars.length;
  bars.forEach((b, i) => {
    const v = b.volume ?? 0;
    const h = v / maxVol * layout.plotHeight;
    group.add(
      app.rect({
        x: layout.plotX + i * slot,
        y: layout.plotY + layout.plotHeight - h,
        width: slot - 2,
        height: h,
        fill: DASHBOARD.inactiveBar,
        listening: false
      })
    );
  });
  attachIndexXHover(app, group, props, layout, bars.length, (i) => `vol: ${bars[i].volume ?? 0}`);
  setState2(group, { width, height, data: bars });
  return group;
});
registerDashboard("volumeProfileChart", (props, app) => {
  const width = num2(props, "width", 300);
  const height = num2(props, "height", 150);
  const bars = getOhlc(props);
  const profile = volumeProfile(bars, num2(props, "bins", 12));
  const group = createWidgetGroup(app, "volumeProfileChart", props);
  const layout = defaultLayout(width, height);
  const maxV = Math.max(...profile.map((p) => p.volume), 1);
  const minP = Math.min(...profile.map((p) => p.price));
  const maxP = Math.max(...profile.map((p) => p.price));
  group.add(app.rect({ width, height, fill: DASHBOARD.chartBg, listening: true }));
  profile.forEach((p) => {
    const y = layout.plotY + layout.plotHeight - (p.price - minP) / (maxP - minP || 1) * layout.plotHeight;
    const w = p.volume / maxV * layout.plotWidth * 0.4;
    group.add(app.rect({ x: layout.plotX, y: y - 4, width: w, height: 8, fill: DASHBOARD.primary, listening: false }));
  });
  attachIndexYHover(app, group, props, layout, profile.length, (i) => `price ${profile[i].price.toFixed(1)} vol ${profile[i].volume}`);
  setState2(group, { width, height, data: bars });
  return group;
});

// src/dashboard/charts/core/treemap.ts
function squarify(nodes, x, y, width, height) {
  const items = nodes.map((n) => ({ name: n.name, value: n.value ?? sumChildren(n) })).filter((n) => n.value > 0);
  const total = items.reduce((a, b) => a + b.value, 0) || 1;
  const rects = [];
  layoutRow(items, x, y, width, height, total, rects);
  return rects;
}
function sumChildren(n) {
  if (n.value != null)
    return n.value;
  if (!n.children?.length)
    return 1;
  return n.children.reduce((a, c) => a + sumChildren(c), 0);
}
function layoutRow(items, x, y, w, h, total, out) {
  if (!items.length)
    return;
  if (items.length === 1) {
    out.push({ name: items[0].name, x, y, width: w, height: h, value: items[0].value });
    return;
  }
  const horizontal = w >= h;
  const sum = items.reduce((a, b) => a + b.value, 0);
  const rowValue = items[0].value;
  const rowFrac = rowValue / sum;
  if (horizontal) {
    const rw = w * rowFrac;
    out.push({ name: items[0].name, x, y, width: rw, height: h, value: items[0].value });
    layoutRow(items.slice(1), x + rw, y, w - rw, h, total - rowValue, out);
  } else {
    const rh = h * rowFrac;
    out.push({ name: items[0].name, x, y, width: w, height: rh, value: items[0].value });
    layoutRow(items.slice(1), x, y + rh, w, h - rh, total - rowValue, out);
  }
}
function flattenHierarchy(root) {
  const out = [];
  const walk2 = (n) => {
    if (!n.children?.length)
      out.push(n);
    else
      n.children.forEach(walk2);
  };
  if (root.children?.length)
    root.children.forEach(walk2);
  else
    out.push(root);
  return out;
}

// src/dashboard/charts/hierarchical/register.ts
var SAMPLE_TREE = {
  name: "root",
  children: [
    { name: "A", value: 40 },
    { name: "B", value: 30 },
    { name: "C", value: 20 },
    { name: "D", value: 10 }
  ]
};
registerDashboard("treemap", (props, app) => {
  const width = num2(props, "width", 300);
  const height = num2(props, "height", 200);
  const root = props.data ?? SAMPLE_TREE;
  const nodes = root.children ?? [root];
  const group = createWidgetGroup(app, "treemap", props);
  const rects = squarify(nodes, 0, 0, width, height);
  const regions = rects.map((r) => ({
    x: r.x,
    y: r.y,
    width: r.width - 1,
    height: r.height - 1,
    label: `${r.name}: ${r.value ?? ""}`,
    payload: { name: r.name, value: r.value }
  }));
  rects.forEach((r, i) => {
    group.add(
      app.rect({
        x: r.x,
        y: r.y,
        width: r.width - 1,
        height: r.height - 1,
        fill: DASHBOARD.series[i % DASHBOARD.series.length],
        stroke: DASHBOARD.pieStroke,
        strokeWidth: 1,
        listening: false
      }),
      app.text({
        text: r.name,
        x: r.x + 4,
        y: r.y + 4,
        fontSize: 10,
        fill: DASHBOARD.text,
        listening: false
      })
    );
  });
  attachRegionsHover(app, group, props, width, height, regions);
  setState2(group, { width, height, data: root });
  return group;
});
registerDashboard("sunburstChart", (props, app) => {
  const size = num2(props, "size", 200);
  const root = props.data ?? SAMPLE_TREE;
  const group = createWidgetGroup(app, "sunburstChart", props);
  const cx = size / 2;
  const children = root.children ?? [root];
  const total = children.reduce((a, c) => a + (c.value ?? 1), 0);
  let angle = -Math.PI / 2;
  children.forEach((c, i) => {
    const sweep = (c.value ?? 1) / total * Math.PI * 2;
    group.add(
      new Arc({
        x: cx - size / 2 + 10,
        y: cx - size / 2 + 10,
        innerRadius: size * 0.2,
        radius: size / 2 - 10,
        startAngle: angle,
        endAngle: angle + sweep,
        fill: DASHBOARD.series[i % DASHBOARD.series.length],
        stroke: DASHBOARD.pieStroke,
        strokeWidth: 1,
        listening: false
      })
    );
    angle += sweep;
  });
  const sliceData = children.map((c) => c.value ?? 1);
  attachPolarSliceHover(
    app,
    group,
    props,
    size,
    sliceData,
    children.map((c) => `${c.name}: ${c.value ?? 1}`)
  );
  setState2(group, { size, data: root });
  return group;
});
registerDashboard("treeChart", (props, app) => {
  const width = num2(props, "width", 300);
  const height = num2(props, "height", 200);
  const root = props.data ?? {
    name: "root",
    children: [
      { name: "A", children: [{ name: "A1" }, { name: "A2" }] },
      { name: "B", children: [{ name: "B1" }] }
    ]
  };
  const group = createWidgetGroup(app, "treeChart", props);
  group.add(app.rect({ width, height, fill: DASHBOARD.chartBg, listening: true }));
  const leaves = flattenHierarchy(root);
  leaves.forEach((n, i) => {
    const x = 20 + i % 4 * 70;
    const y = 30 + Math.floor(i / 4) * 50;
    group.add(
      app.circle({ x: x - 8, y: y - 8, radius: 8, fill: DASHBOARD.primary, listening: false }),
      app.text({ text: n.name, x: x + 12, y: y - 6, fontSize: 11, fill: DASHBOARD.text, listening: false })
    );
  });
  attachNearestHover(
    app,
    group,
    props,
    { x: 0, y: 0, width, height },
    leaves.map((n, i) => {
      const x = 20 + i % 4 * 70;
      const y = 30 + Math.floor(i / 4) * 50;
      return { x, y, label: n.name ?? "node" };
    })
  );
  setState2(group, { width, height, data: root });
  return group;
});
registerDashboard("dendrogramChart", (props, app) => {
  const width = num2(props, "width", 300);
  const height = num2(props, "height", 200);
  const group = createWidgetGroup(app, "dendrogramChart", props);
  group.add(app.rect({ width, height, fill: DASHBOARD.chartBg, listening: true }));
  const nodes = ["A", "B", "C", "D", "E"];
  const step = width / nodes.length;
  nodes.forEach((n, i) => {
    const x = step * i + step / 2;
    group.add(
      app.line({ x, y: height - 30, x2: 0, y2: -80, stroke: DASHBOARD.chartGrid, strokeWidth: 1, listening: false }),
      app.text({ text: n, x: x - 6, y: height - 12, fontSize: 10, fill: DASHBOARD.text, listening: false })
    );
  });
  group.add(app.line({ x: step / 2, y: height - 110, x2: width - step, y2: 0, stroke: DASHBOARD.chartLine, strokeWidth: 2, listening: false }));
  attachIndexXHover(
    app,
    group,
    props,
    { plotX: 0, plotY: 0, plotWidth: width, plotHeight: height },
    nodes.length,
    (i) => nodes[i]
  );
  setState2(group, { width, height });
  return group;
});

// src/dashboard/charts/core/sankey.ts
function layoutSankey(nodes, links, width, height, nodeWidth = 12) {
  const cols = 3;
  const colW = width / cols;
  const inflow = /* @__PURE__ */ new Map();
  const outflow = /* @__PURE__ */ new Map();
  for (const l of links) {
    inflow.set(l.target, (inflow.get(l.target) ?? 0) + l.value);
    outflow.set(l.source, (outflow.get(l.source) ?? 0) + l.value);
  }
  const total = links.reduce((a, l) => a + l.value, 0) || 1;
  const layoutNodes = nodes.map((n, i) => {
    const col = i % cols;
    const flow = Math.max(inflow.get(n.id) ?? 0, outflow.get(n.id) ?? 0, 1);
    const h = flow / total * height * 0.8;
    return {
      id: n.id,
      label: n.label ?? n.id,
      x: col * colW + colW / 2 - nodeWidth / 2,
      y: 20 + i % 4 * (h + 10),
      width: nodeWidth,
      height: Math.max(20, h)
    };
  });
  const nodeMap = new Map(layoutNodes.map((n) => [n.id, n]));
  const layoutLinks = links.map((l) => {
    const source = nodeMap.get(l.source);
    const target = nodeMap.get(l.target);
    if (!source || !target)
      return null;
    const sx = source.x + source.width;
    const sy = source.y + source.height / 2;
    const tx = target.x;
    const ty = target.y + target.height / 2;
    const mx = (sx + tx) / 2;
    const path = `M ${sx} ${sy} C ${mx} ${sy} ${mx} ${ty} ${tx} ${ty}`;
    return { source, target, value: l.value, path };
  }).filter((l) => l != null);
  return { nodes: layoutNodes, links: layoutLinks };
}
function layoutChord(matrix, size, padAngle = 0.04) {
  const n = matrix.length;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 16;
  const innerR = outerR - 18;
  const totals = matrix.map((row) => row.reduce((a, v) => a + v, 0));
  const grand = totals.reduce((a, v) => a + v, 0) || 1;
  const tau = Math.PI * 2;
  const gap = padAngle;
  let angle = -Math.PI / 2;
  const segments = [];
  for (let i = 0; i < n; i++) {
    const sweep = totals[i] / grand * tau;
    const start = angle + gap / 2;
    const end = angle + sweep - gap / 2;
    segments.push({ index: i, startAngle: start, endAngle: end, value: totals[i] });
    angle += sweep;
  }
  const ribbons = [];
  for (let i = 0; i < n; i++) {
    const row = matrix[i];
    const outTotal = row.reduce((a, v) => a + v, 0) || 1;
    let outAcc = 0;
    for (let j = 0; j < n; j++) {
      const v = row[j];
      if (!v)
        continue;
      const segI = segments[i];
      const segJ = segments[j];
      const srcSpan = segI.endAngle - segI.startAngle;
      const tgtSpan = segJ.endAngle - segJ.startAngle;
      const sa1 = segI.startAngle + outAcc / outTotal * srcSpan;
      const ea1 = segI.startAngle + (outAcc + v) / outTotal * srcSpan;
      outAcc += v;
      const inTotal = matrix.reduce((a, r) => a + (r[j] ?? 0), 0) || 1;
      let inBefore = 0;
      for (let k = 0; k < i; k++)
        inBefore += matrix[k][j] ?? 0;
      const sa2 = segJ.startAngle + inBefore / inTotal * tgtSpan;
      const ea2 = segJ.startAngle + (inBefore + v) / inTotal * tgtSpan;
      ribbons.push({
        source: i,
        target: j,
        value: v,
        path: chordRibbonPath(cx, cy, outerR, innerR, sa1, ea1, sa2, ea2)
      });
    }
  }
  return { cx, cy, outerR, innerR, segments, ribbons };
}
function chordRibbonPath(cx, cy, outerR, _innerR, sa1, ea1, sa2, ea2) {
  const p = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [x00, y00] = p(outerR, sa1);
  const [x01, y01] = p(outerR, ea1);
  const [x10, y10] = p(outerR, sa2);
  const [x11, y11] = p(outerR, ea2);
  const large1 = Math.abs(ea1 - sa1) > Math.PI ? 1 : 0;
  const large2 = Math.abs(ea2 - sa2) > Math.PI ? 1 : 0;
  return `M ${x00} ${y00} A ${outerR} ${outerR} 0 ${large1} 1 ${x01} ${y01} Q ${cx} ${cy} ${x10} ${y10} A ${outerR} ${outerR} 0 ${large2} 1 ${x11} ${y11} Q ${cx} ${cy} ${x00} ${y00} Z`;
}

// src/dashboard/charts/core/streamLayout.ts
function layoutStreamgraph(series, width, height, pad = { left: 24, right: 24, top: 12, bottom: 12 }) {
  const n = series.length;
  if (!n)
    return [];
  const len = Math.max(...series.map((s) => s.length), 1);
  const plotW = Math.max(width - pad.left - pad.right, 8);
  const plotH = Math.max(height - pad.top - pad.bottom, 8);
  const midY = pad.top + plotH / 2;
  const totals = Array.from(
    { length: len },
    (_, i) => series.reduce((a, s) => a + (s[i] ?? 0), 0)
  );
  const maxTotal = Math.max(...totals, 1);
  const yScale = plotH / maxTotal;
  const tops = series.map(() => Array(len).fill(0));
  const bots = series.map(() => Array(len).fill(0));
  for (let i = 0; i < len; i++) {
    const totalH = totals[i] * yScale;
    let y = midY - totalH / 2;
    for (let s = 0; s < n; s++) {
      const h = (series[s][i] ?? 0) * yScale;
      bots[s][i] = y;
      tops[s][i] = y + h;
      y += h;
    }
  }
  const xAt = (i) => pad.left + plotW * i / Math.max(len - 1, 1);
  return series.map((_, si) => {
    const topPts = [];
    const botPts = [];
    for (let i = 0; i < len; i++) {
      const x = xAt(i);
      topPts.push(`${x},${tops[si][i]}`);
      botPts.unshift(`${x},${bots[si][i]}`);
    }
    const d = `M ${topPts.join(" L ")} L ${botPts.join(" L ")} Z`;
    return { path: d, index: si };
  });
}
function streamTooltipLabel(series, index, names) {
  return series.map((s, si) => `${names?.[si] ?? `S${si + 1}`}: ${s[index] ?? 0}`).join("\n");
}

// src/dashboard/charts/flow/register.ts
var SAMPLE_FLOW_NODES = [
  { id: "a", label: "Source" },
  { id: "b", label: "Process" },
  { id: "c", label: "Sink" }
];
var SAMPLE_FLOW_LINKS = [
  { source: "a", target: "b", value: 40 },
  { source: "b", target: "c", value: 35 }
];
registerDashboard("sankeyChart", (props, app) => {
  const width = num2(props, "width", 400);
  const height = num2(props, "height", 220);
  const nodes = props.nodes ?? SAMPLE_FLOW_NODES;
  const links = props.links ?? SAMPLE_FLOW_LINKS;
  const group = createWidgetGroup(app, "sankeyChart", props);
  group.add(app.rect({ width, height, fill: DASHBOARD.chartBg, listening: true }));
  const layout = layoutSankey(nodes, links, width, height);
  layout.links.forEach((l) => {
    group.add(app.path({ d: l.path, fill: null, stroke: DASHBOARD.flowLink, strokeWidth: Math.max(2, l.value / 10), listening: false }));
  });
  layout.nodes.forEach((n) => {
    group.add(
      app.rect({ x: n.x, y: n.y, width: n.width, height: n.height, fill: DASHBOARD.primary, listening: false }),
      app.text({ text: n.label, x: n.x, y: n.y - 12, fontSize: 10, fill: DASHBOARD.text, listening: false })
    );
  });
  attachRegionsHover(
    app,
    group,
    props,
    width,
    height,
    layout.nodes.map((n) => ({
      x: n.x - 10,
      y: n.y,
      width: n.width + 20,
      height: n.height,
      label: n.label,
      payload: { id: n.id, label: n.label }
    }))
  );
  setState2(group, { width, height, nodes, links });
  return group;
});
registerDashboard("chordChart", (props, app) => {
  const size = num2(props, "size", 220);
  const labels = props.labels ?? [];
  const matrix = props.matrix ?? [
    [0, 5, 3],
    [4, 0, 2],
    [1, 3, 0]
  ];
  const group = createWidgetGroup(app, "chordChart", props);
  group.add(app.rect({ width: size, height: size, fill: DASHBOARD.chartBg, listening: true }));
  const chord = layoutChord(matrix, size);
  chord.ribbons.forEach((ribbon) => {
    group.add(
      app.path({
        d: ribbon.path,
        fill: DASHBOARD.flowLink,
        opacity: 0.35 + ribbon.value / 10 * 0.15,
        stroke: null,
        listening: false
      })
    );
  });
  chord.segments.forEach((seg) => {
    group.add(
      app.path({
        d: arcSectorPath(chord.cx, chord.cy, chord.outerR, seg.startAngle, seg.endAngle, chord.innerR),
        fill: DASHBOARD.series[seg.index % DASHBOARD.series.length],
        stroke: DASHBOARD.pieStroke,
        strokeWidth: 1,
        listening: false
      })
    );
    const mid = (seg.startAngle + seg.endAngle) / 2;
    const lr = (chord.outerR + chord.innerR) / 2;
    const lx = chord.cx + lr * Math.cos(mid);
    const ly = chord.cy + lr * Math.sin(mid);
    const name = labels[seg.index] ?? `N${seg.index + 1}`;
    group.add(
      app.text({
        text: name,
        x: lx - 10,
        y: ly - 6,
        fontSize: 9,
        fill: DASHBOARD.text,
        listening: false
      })
    );
  });
  attachPolarSliceHover(
    app,
    group,
    props,
    size,
    chord.segments.map((s) => s.value),
    chord.segments.map((s, i) => labels[i] ?? `node ${i + 1}: ${s.value}`)
  );
  setState2(group, { size, matrix, labels });
  return group;
});
registerDashboard("alluvialChart", (props, app) => {
  const width = num2(props, "width", 400);
  const height = num2(props, "height", 200);
  const stages = props.stages ?? [
    ["A1", "A2"],
    ["B1", "B2", "B3"],
    ["C1", "C2"]
  ];
  const group = createWidgetGroup(app, "alluvialChart", props);
  group.add(app.rect({ width, height, fill: DASHBOARD.chartBg, listening: true }));
  const colW = width / stages.length;
  const regions = [];
  stages.forEach((col, ci) => {
    const step = height / (col.length + 1);
    col.forEach((label, ri) => {
      const x = ci * colW + 10;
      const y = step * (ri + 1);
      regions.push({ x, y, width: colW - 20, height: 24, label });
      group.add(
        app.rect({ x, y, width: colW - 20, height: 24, fill: DASHBOARD.series[ri % DASHBOARD.series.length], cornerRadius: 4, listening: false }),
        app.text({ text: label, x: x + 6, y: y + 5, fontSize: 10, fill: DASHBOARD.text, listening: false })
      );
      if (ci < stages.length - 1) {
        const nx = (ci + 1) * colW + 10;
        const ny = step * (ri + 1) + 12;
        group.add(app.path({ d: `M ${x + colW - 20} ${y + 12} C ${x + colW} ${y + 12} ${nx - 20} ${ny} ${nx} ${ny}`, fill: null, stroke: DASHBOARD.flowLink, strokeWidth: 8, listening: false }));
      }
    });
  });
  attachRegionsHover(app, group, props, width, height, regions);
  setState2(group, { width, height, stages });
  return group;
});
registerDashboard("streamgraph", (props, app) => {
  const width = num2(props, "width", 300);
  const height = num2(props, "height", 150);
  const series = props.series ?? [
    [10, 12, 8, 14, 11],
    [8, 10, 12, 9, 13],
    [6, 7, 9, 11, 8]
  ];
  const names = props.seriesNames ?? series.map((_, i) => `S${i + 1}`);
  const group = createWidgetGroup(app, "streamgraph", props);
  group.add(app.rect({ width, height, fill: DASHBOARD.chartBg, listening: true }));
  const layers = layoutStreamgraph(series, width, height);
  const len = Math.max(...series.map((s) => s.length), 1);
  layers.forEach((layer) => {
    group.add(
      app.path({
        d: layer.path,
        fill: DASHBOARD.series[layer.index % DASHBOARD.series.length],
        opacity: 0.82,
        stroke: DASHBOARD.chartBg,
        strokeWidth: 0.5,
        listening: false
      })
    );
  });
  attachIndexXHover(
    app,
    group,
    props,
    { plotX: 24, plotY: 0, plotWidth: width - 48, plotHeight: height },
    len,
    (i) => streamTooltipLabel(series, i, names)
  );
  setState2(group, { width, height, series, names });
  return group;
});

// src/diagram/layouts.ts
function forceDirectedLayout(nodes, edges, options = {}) {
  const {
    width = 600,
    height = 400,
    iterations = 100,
    seed = 42,
    repulsion = 4e3,
    attraction = 0.05,
    damping = 0.85
  } = options;
  const rand = seededRandom(seed);
  const positions = /* @__PURE__ */ new Map();
  for (const n of nodes) {
    positions.set(n.id, {
      x: n.x ?? rand() * width,
      y: n.y ?? rand() * height,
      vx: 0,
      vy: 0
    });
  }
  for (let iter = 0; iter < iterations; iter++) {
    const forces = /* @__PURE__ */ new Map();
    for (const n of nodes)
      forces.set(n.id, { fx: 0, fy: 0 });
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = positions.get(nodes[i].id);
        const b = positions.get(nodes[j].id);
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 1) {
          dx = rand() - 0.5;
          dy = rand() - 0.5;
          dist = 1;
        }
        const force = repulsion / (dist * dist);
        const fx = dx / dist * force;
        const fy = dy / dist * force;
        forces.get(nodes[i].id).fx += fx;
        forces.get(nodes[i].id).fy += fy;
        forces.get(nodes[j].id).fx -= fx;
        forces.get(nodes[j].id).fy -= fy;
      }
    }
    for (const edge of edges) {
      const a = positions.get(edge.from);
      const b = positions.get(edge.to);
      if (!a || !b)
        continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = dist * attraction;
      const fx = dx / dist * force;
      const fy = dy / dist * force;
      forces.get(edge.from).fx += fx;
      forces.get(edge.from).fy += fy;
      forces.get(edge.to).fx -= fx;
      forces.get(edge.to).fy -= fy;
    }
    const cx = width / 2;
    const cy = height / 2;
    for (const n of nodes) {
      const p = positions.get(n.id);
      const f = forces.get(n.id);
      f.fx += (cx - p.x) * 0.01;
      f.fy += (cy - p.y) * 0.01;
      p.vx = (p.vx + f.fx) * damping;
      p.vy = (p.vy + f.fy) * damping;
      p.x = Math.max(20, Math.min(width - 20, p.x + p.vx));
      p.y = Math.max(20, Math.min(height - 20, p.y + p.vy));
    }
  }
  const result = /* @__PURE__ */ new Map();
  for (const n of nodes) {
    const p = positions.get(n.id);
    result.set(n.id, { x: p.x, y: p.y });
  }
  return result;
}
function radialLayout(group, cx, cy, innerRadius, outerRadius) {
  const children = group.children;
  if (children.length === 0)
    return;
  if (children.length === 1) {
    children[0].x = cx;
    children[0].y = cy;
    children[0].markDirty();
    return;
  }
  children[0].x = cx;
  children[0].y = cy;
  children[0].markDirty();
  const outer = children.slice(1);
  const n = outer.length;
  for (let i = 0; i < n; i++) {
    const angle = 2 * Math.PI * i / n - Math.PI / 2;
    const r = n <= 4 ? innerRadius : outerRadius;
    outer[i].x = cx + r * Math.cos(angle) - outer[i].getBounds().width / 2;
    outer[i].y = cy + r * Math.sin(angle) - outer[i].getBounds().height / 2;
    outer[i].markDirty();
  }
}
function layoutDiagram(group, levelGap = 80, siblingGap = 40) {
  treeLayout(group, levelGap, siblingGap);
}
function pipelineLayout(group, gap = 40, padding = 10, canvasH) {
  const stageH = 50;
  let x = padding;
  const y = canvasH ? Math.max(padding, (canvasH - stageH) / 2) : padding;
  for (const child of group.children) {
    if (child.metadata?.diagramId === void 0 && child.metadata?.pipelineStatus === void 0) {
      continue;
    }
    child.x = x;
    child.y = y;
    child.markDirty();
    x += 118 + gap;
  }
}

// src/dashboard/charts/network/register.ts
registerDashboard("networkChart", (props, app) => {
  const width = num2(props, "width", 300);
  const height = num2(props, "height", 200);
  const nodes = props.nodes ?? [
    { id: "a", label: "A" },
    { id: "b", label: "B" },
    { id: "c", label: "C" },
    { id: "d", label: "D" }
  ];
  const edges = props.edges ?? [
    { from: "a", to: "b" },
    { from: "b", to: "c" },
    { from: "a", to: "d" },
    { from: "d", to: "c" }
  ];
  const group = createWidgetGroup(app, "networkChart", props);
  group.add(app.rect({ width, height, fill: DASHBOARD.chartBg, listening: true }));
  const positions = forceDirectedLayout(nodes, edges, { width, height, iterations: 50, seed: 7 });
  edges.forEach((e) => {
    const a = positions.get(e.from);
    const b = positions.get(e.to);
    if (!a || !b)
      return;
    group.add(app.line({ x: a.x, y: a.y, x2: b.x - a.x, y2: b.y - a.y, stroke: DASHBOARD.chartGrid, strokeWidth: 1, listening: false }));
  });
  nodes.forEach((n) => {
    const p = positions.get(n.id);
    if (!p)
      return;
    group.add(
      app.circle({ x: p.x - 10, y: p.y - 10, radius: 10, fill: DASHBOARD.primary, listening: false }),
      app.text({ text: n.label ?? n.id, x: p.x - 8, y: p.y + 16, fontSize: 9, fill: DASHBOARD.text, listening: false })
    );
  });
  attachNearestHover(
    app,
    group,
    props,
    { x: 0, y: 0, width, height },
    nodes.map((n) => {
      const p = positions.get(n.id);
      if (!p)
        return null;
      return { x: p.x, y: p.y, label: n.label ?? n.id };
    }).filter((p) => p != null)
  );
  setState2(group, { width, height, nodes, edges });
  return group;
});
registerDashboard("timeline", (props, app) => {
  const width = num2(props, "width", 320);
  const height = num2(props, "height", 120);
  const events = props.events ?? [
    { label: "Kickoff", start: 0, end: 2 },
    { label: "Build", start: 2, end: 8 },
    { label: "Launch", start: 8, end: 10 }
  ];
  const group = createWidgetGroup(app, "timeline", props);
  const max = Math.max(...events.map((e) => e.end ?? e.start ?? 0), 10);
  group.add(app.rect({ width, height, fill: DASHBOARD.chartBg, listening: true }));
  group.add(app.line({ x: 20, y: height / 2, x2: width - 40, y2: 0, stroke: DASHBOARD.timelineLine, strokeWidth: 2, listening: false }));
  events.forEach((ev, i) => {
    const start = ev.start ?? i * 2;
    const end = ev.end ?? start + 1;
    const x = 20 + start / max * (width - 60);
    const w = (end - start) / max * (width - 60);
    group.add(
      app.roundedRect({ x, y: height / 2 - 14, width: Math.max(w, 20), height: 28, cornerRadius: 4, fill: DASHBOARD.series[i % DASHBOARD.series.length], listening: false }),
      app.text({ text: ev.label, x: x + 4, y: height / 2 - 6, fontSize: 10, fill: DASHBOARD.text, listening: false })
    );
  });
  attachRegionsHover(
    app,
    group,
    props,
    width,
    height,
    events.map((ev, i) => {
      const start = ev.start ?? i * 2;
      const end = ev.end ?? start + 1;
      const x = 20 + start / max * (width - 60);
      const w = (end - start) / max * (width - 60);
      return { x, y: height / 2 - 14, width: Math.max(w, 20), height: 28, label: ev.label };
    })
  );
  setState2(group, { width, height, events });
  return group;
});
registerDashboard("ganttChart", (props, app) => {
  const width = num2(props, "width", 360);
  const height = num2(props, "height", 200);
  const tasks = props.tasks ?? [
    { label: "Design", start: 0, end: 3 },
    { label: "Develop", start: 2, end: 8 },
    { label: "Test", start: 7, end: 10 },
    { label: "Ship", start: 10, end: 12 }
  ];
  const group = createWidgetGroup(app, "ganttChart", props);
  const max = Math.max(...tasks.map((t) => t.end), 12);
  const rowH = height / tasks.length;
  group.add(app.rect({ width, height, fill: DASHBOARD.chartBg, listening: true }));
  tasks.forEach((t, i) => {
    const y = i * rowH + 8;
    const x = 80 + t.start / max * (width - 100);
    const w = (t.end - t.start) / max * (width - 100);
    group.add(
      app.text({ text: t.label, x: 4, y: y + 4, fontSize: 11, fill: DASHBOARD.text, listening: false }),
      app.roundedRect({ x, y, width: Math.max(w, 8), height: rowH - 16, cornerRadius: 3, fill: t.color ?? DASHBOARD.series[i % DASHBOARD.series.length], listening: false })
    );
  });
  attachRegionsHover(
    app,
    group,
    props,
    width,
    height,
    tasks.map((t, i) => {
      const y = i * rowH + 8;
      const x = 80 + t.start / max * (width - 100);
      const w = (t.end - t.start) / max * (width - 100);
      return { x, y, width: Math.max(w, 8), height: rowH - 16, label: `${t.label} (${t.start}-${t.end})` };
    })
  );
  setState2(group, { width, height, tasks });
  return group;
});

// src/dashboard/charts/core/projection3d.ts
function project3d(x, y, z, cx, cy, scale = 1) {
  const isoX = (x - y) * Math.cos(Math.PI / 6) * scale;
  const isoY = (x + y) * Math.sin(Math.PI / 6) * scale - z * scale;
  return [cx + isoX, cy + isoY];
}
function surfaceMeshPath(zGrid, cx, cy, cellSize = 8) {
  const paths = [];
  const rows = zGrid.length;
  const cols = zGrid[0]?.length ?? 0;
  for (let i = 0; i < rows - 1; i++) {
    for (let j = 0; j < cols - 1; j++) {
      const z00 = zGrid[i][j];
      const z10 = zGrid[i + 1][j];
      const z01 = zGrid[i][j + 1];
      const z11 = zGrid[i + 1][j + 1];
      const [x0, y0] = project3d(j, i, z00, cx, cy, cellSize);
      const [x1, y1] = project3d(j + 1, i, z01, cx, cy, cellSize);
      const [x2, y2] = project3d(j + 1, i + 1, z11, cx, cy, cellSize);
      const [x3, y3] = project3d(j, i + 1, z10, cx, cy, cellSize);
      paths.push(`M ${x0} ${y0} L ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} Z`);
    }
  }
  return paths;
}
function wireframePaths(zGrid, cx, cy, cellSize = 8) {
  const paths = [];
  const rows = zGrid.length;
  const cols = zGrid[0]?.length ?? 0;
  for (let i = 0; i < rows; i++) {
    let d = "";
    for (let j = 0; j < cols; j++) {
      const [x, y] = project3d(j, i, zGrid[i][j], cx, cy, cellSize);
      d += (j === 0 ? "M" : "L") + ` ${x} ${y}`;
    }
    paths.push(d);
  }
  for (let j = 0; j < cols; j++) {
    let d = "";
    for (let i = 0; i < rows; i++) {
      const [x, y] = project3d(j, i, zGrid[i][j], cx, cy, cellSize);
      d += (i === 0 ? "M" : "L") + ` ${x} ${y}`;
    }
    paths.push(d);
  }
  return paths;
}
function sampleZGrid(size = 8) {
  return Array.from(
    { length: size },
    (_, i) => Array.from({ length: size }, (_2, j) => Math.sin(i * 0.5) * Math.cos(j * 0.5) * 3 + 2)
  );
}

// src/dashboard/charts/core/wordLayout.ts
function wordBox(x, y, text, fontSize) {
  const w = text.length * fontSize * 0.58;
  const h = fontSize * 1.15;
  return { x, y, w, h };
}
function overlaps(a, b, pad = 3) {
  return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
}
function layoutWordCloud(words, width, height) {
  const maxVal = Math.max(...words.map((w) => w.value), 1);
  const cx = width / 2;
  const cy = height / 2;
  const sorted = [...words].sort((a, b) => b.value - a.value);
  const placed = [];
  const boxes = [];
  for (const w of sorted) {
    const fontSize = 12 + w.value / maxVal * 26;
    const estW = w.text.length * fontSize * 0.58;
    let angle = 0;
    let radius = 0;
    let found = false;
    for (let t = 0; t < 720; t++) {
      const x = cx + radius * Math.cos(angle) - estW / 2;
      const y = cy + radius * Math.sin(angle) - fontSize / 2;
      const box = wordBox(x, y, w.text, fontSize);
      const inBounds = box.x >= 4 && box.y >= 4 && box.x + box.w <= width - 4 && box.y + box.h <= height - 4;
      const clear = inBounds && !boxes.some((b) => overlaps(box, b));
      if (clear) {
        placed.push({ text: w.text, x, y, fontSize, value: w.value });
        boxes.push(box);
        found = true;
        break;
      }
      angle += 0.42;
      radius += 0.55;
    }
    if (!found) {
      const x = cx - estW / 2 + placed.length % 3 * 12;
      const y = cy - fontSize / 2 + placed.length % 5 * 8;
      placed.push({ text: w.text, x, y, fontSize, value: w.value });
      boxes.push(wordBox(x, y, w.text, fontSize));
    }
  }
  return placed;
}

// src/dashboard/charts/specialty/register.ts
registerDashboard("surfaceChart3d", (props, app) => {
  const width = num2(props, "width", 300);
  const height = num2(props, "height", 200);
  const zGrid = props.zGrid ?? sampleZGrid(8);
  const group = createWidgetGroup(app, "surfaceChart3d", props);
  group.add(app.rect({ width, height, fill: DASHBOARD.chartBg, listening: true }));
  const paths = surfaceMeshPath(zGrid, width / 2, height / 2 + 20, 6);
  paths.forEach((d, i) => {
    group.add(app.path({ d, fill: DASHBOARD.series[i % DASHBOARD.series.length], opacity: 0.6, stroke: DASHBOARD.chartGrid, strokeWidth: 0.5, listening: false }));
  });
  attachGridHover(app, group, props, width, height, zGrid.length, zGrid[0]?.length ?? 1, (r, c) => String(zGrid[r]?.[c] ?? ""));
  setState2(group, { width, height, zGrid });
  return group;
});
registerDashboard("wireframeChart3d", (props, app) => {
  const width = num2(props, "width", 300);
  const height = num2(props, "height", 200);
  const zGrid = props.zGrid ?? sampleZGrid(8);
  const group = createWidgetGroup(app, "wireframeChart3d", props);
  group.add(app.rect({ width, height, fill: DASHBOARD.chartBg, listening: true }));
  wireframePaths(zGrid, width / 2, height / 2 + 20, 6).forEach((d) => {
    group.add(app.path({ d, fill: null, stroke: DASHBOARD.chartLine, strokeWidth: 1, listening: false }));
  });
  attachGridHover(app, group, props, width, height, zGrid.length, zGrid[0]?.length ?? 1, (r, c) => String(zGrid[r]?.[c] ?? ""));
  setState2(group, { width, height, zGrid });
  return group;
});
registerDashboard("meshChart3d", (props, app) => {
  const width = num2(props, "width", 300);
  const height = num2(props, "height", 200);
  const zGrid = props.zGrid ?? sampleZGrid(6);
  const group = createWidgetGroup(app, "meshChart3d", props);
  group.add(app.rect({ width, height, fill: DASHBOARD.chartBg, listening: true }));
  surfaceMeshPath(zGrid, width / 2, height / 2 + 20, 8).forEach((d) => {
    group.add(app.path({ d, fill: DASHBOARD.chartArea, stroke: DASHBOARD.primary, strokeWidth: 1, listening: false }));
  });
  attachGridHover(app, group, props, width, height, zGrid.length, zGrid[0]?.length ?? 1, (r, c) => String(zGrid[r]?.[c] ?? ""));
  setState2(group, { width, height, zGrid });
  return group;
});
registerDashboard("vectorFieldChart", (props, app) => {
  const width = num2(props, "width", 300);
  const height = num2(props, "height", 200);
  const group = createWidgetGroup(app, "vectorFieldChart", props);
  group.add(app.rect({ width, height, fill: DASHBOARD.chartBg, listening: true }));
  const cols = 8;
  const rows = 6;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const x = 20 + j / (cols - 1) * (width - 40);
      const y = 20 + i / (rows - 1) * (height - 40);
      const angle = Math.sin(j * 0.5) * Math.cos(i * 0.5);
      const len = 12;
      group.add(
        app.line({
          x,
          y,
          x2: len * Math.cos(angle),
          y2: len * Math.sin(angle),
          stroke: DASHBOARD.chartLine,
          strokeWidth: 1.5,
          lineCap: "round",
          listening: false
        })
      );
    }
  }
  attachGridHover(app, group, props, width, height, rows, cols, () => "flow");
  setState2(group, { width, height });
  return group;
});
registerDashboard("pictogramChart", (props, app) => {
  const width = num2(props, "width", 200);
  const height = num2(props, "height", 120);
  const value = num2(props, "value", 12);
  const icon = str2(props, "icon", "\u25CF");
  const group = createWidgetGroup(app, "pictogramChart", props);
  const cols = 6;
  for (let i = 0; i < value; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    group.add(
      app.text({
        text: icon,
        x: col * 28 + 4,
        y: row * 28 + 4,
        fontSize: 18,
        fill: DASHBOARD.primary,
        listening: false
      })
    );
  }
  attachValueHover(app, group, props, width, height, `count: ${value}`);
  setState2(group, { width, height, value });
  return group;
});
registerDashboard("wordCloudChart", (props, app) => {
  const width = num2(props, "width", 320);
  const height = num2(props, "height", 200);
  const words = props.words ?? [
    { text: "data", value: 90 },
    { text: "chart", value: 70 },
    { text: "visual", value: 55 },
    { text: "lightdraw", value: 80 },
    { text: "canvas", value: 45 },
    { text: "dashboard", value: 60 }
  ];
  const group = createWidgetGroup(app, "wordCloudChart", props);
  group.add(app.rect({ width, height, fill: DASHBOARD.chartBg, listening: true }));
  const placed = layoutWordCloud(words, width, height);
  placed.forEach((w, i) => {
    group.add(
      app.text({
        text: w.text,
        x: w.x,
        y: w.y,
        fontSize: w.fontSize,
        fontWeight: i < 3 ? "700" : "400",
        fill: DASHBOARD.series[i % DASHBOARD.series.length],
        listening: false
      })
    );
  });
  attachNearestHover(
    app,
    group,
    props,
    { x: 0, y: 0, width, height },
    placed.map((w) => ({
      x: w.x + w.fontSize / 2,
      y: w.y + w.fontSize / 2,
      label: `${w.text} (${w.value ?? ""})`
    }))
  );
  setState2(group, { width, height, words });
  return group;
});

// src/dashboard/definitions.ts
registerDashboard("gauge", (props, app) => {
  const size = num2(props, "size", 120);
  const max = num2(props, "max", 100);
  const value = clamp3(num2(props, "value", 0), 0, max);
  const group = createWidgetGroup(app, "gauge", props, { width: size, height: size });
  const r = size / 2 - 14;
  const cx = size / 2;
  const parts = buildDialGauge(
    app,
    group,
    {
      trackColor: DASHBOARD.gaugeTrack,
      needleColor: DASHBOARD.gaugeNeedle,
      textColor: DASHBOARD.text,
      textMuted: DASHBOARD.textMuted,
      faceColor: DASHBOARD.face,
      bezelColor: DASHBOARD.panelStroke
    },
    { size, value, max, tickCount: 6, ariaLive: "polite" }
  );
  setParts2(group, { needle: parts.needle, valueText: parts.valueText });
  setRefresh(group, (v) => {
    updateDialNeedle(parts.needle, cx, v, max, r);
    parts.valueText.text = String(Math.round(v));
  });
  setState2(group, { size, value, max });
  return group;
});
registerDashboard("speedometer", (props, app) => {
  const size = num2(props, "size", 200);
  const value = num2(props, "value", 0);
  const max = num2(props, "max", 180);
  const group = createWidgetGroup(app, "speedometer", props);
  const r = size / 2 - 14;
  const cx = size / 2;
  const parts = buildDialGauge(
    app,
    group,
    {
      trackColor: DASHBOARD.gaugeTrack,
      needleColor: DASHBOARD.speedoNeedle,
      textColor: DASHBOARD.text,
      textMuted: DASHBOARD.textMuted,
      faceColor: DASHBOARD.face,
      bezelColor: DASHBOARD.panelStroke,
      redlineColor: DASHBOARD.dangerDark
    },
    {
      size,
      value,
      max,
      unit: str2(props, "unit", "km/h"),
      tickCount: 9,
      showTickLabels: true,
      redlineFrom: 0.78
    }
  );
  setParts2(group, { needle: parts.needle, valueText: parts.valueText });
  setRefresh(group, (v) => {
    updateDialNeedle(parts.needle, cx, v, max, r);
    parts.valueText.text = `${Math.round(v)}`;
  });
  setState2(group, { size, value, max });
  return group;
});
registerDashboard("legend", (props, app) => {
  const group = createWidgetGroup(app, "legend", props);
  const items = props.items ?? [
    { label: "Series A", color: DASHBOARD.primary },
    { label: "Series B", color: DASHBOARD.secondary }
  ];
  addLegend(app, group, items, 0, 0);
  setState2(group, { items });
  return group;
});
registerDashboard("thermometer", (props, app) => {
  const height = num2(props, "height", 120);
  const width = num2(props, "width", 24);
  const value = clamp3(num2(props, "value", 50), 0, 100);
  const group = createWidgetGroup(app, "thermometer", props);
  const tubeH = height - Math.round(width * 1.1);
  const bulbR = Math.max(8, Math.round(width * 0.48));
  const fontSize = Math.max(10, Math.round(width * 0.5));
  group.add(
    app.roundedRect({
      width,
      height: tubeH,
      cornerRadius: width / 2,
      fill: DASHBOARD.thermometerTube,
      stroke: DASHBOARD.thermometerBorder,
      strokeWidth: 1,
      listening: false
    })
  );
  const fillH = (tubeH - 4) * (value / 100);
  const fill = app.roundedRect({
    x: 2,
    y: tubeH - fillH - 2,
    width: width - 4,
    height: fillH,
    cornerRadius: (width - 4) / 2,
    fill: value > 80 ? DASHBOARD.danger : value > 50 ? DASHBOARD.warning : DASHBOARD.primary,
    listening: false
  });
  group.add(
    fill,
    app.circle({
      x: width / 2 - bulbR,
      y: tubeH - 2,
      radius: bulbR,
      fill: DASHBOARD.danger,
      listening: false
    }),
    app.text({
      text: `${Math.round(value)}\xB0`,
      x: width + 8,
      y: tubeH / 2 - fontSize / 2,
      fontSize,
      fontWeight: "600",
      fill: DASHBOARD.text,
      listening: false
    })
  );
  setParts2(group, { fill });
  setRefresh(group, (v) => {
    const fh = (tubeH - 4) * (clamp3(v, 0, 100) / 100);
    fill.y = tubeH - fh - 2;
    fill.height = fh;
  });
  setState2(group, { height, width, value });
  return group;
});
registerDashboard("compass", (props, app) => {
  const size = num2(props, "size", 100);
  const heading = num2(props, "heading", 0);
  const group = createWidgetGroup(app, "compass", props, { width: size, height: size });
  const cx = size / 2;
  const r = size / 2 - 4;
  const fontSize = Math.max(8, Math.round(size * 0.1));
  group.add(
    app.circle({
      x: cx - r,
      y: cx - r,
      radius: r,
      fill: DASHBOARD.compassFace,
      stroke: DASHBOARD.compassRing,
      strokeWidth: Math.max(1.5, size / 50),
      shadow: size >= 90 ? { color: "rgba(0,0,0,0.3)", blur: 6, offsetX: 0, offsetY: 2 } : void 0,
      listening: false
    })
  );
  ["N", "E", "S", "W"].forEach((label, i) => {
    const a = i / 4 * Math.PI * 2 - Math.PI / 2;
    const lr = r * 0.62;
    group.add(
      app.text({
        text: label,
        x: cx + lr * Math.cos(a) - fontSize / 2,
        y: cx + lr * Math.sin(a) - fontSize / 2,
        fontSize,
        fontWeight: label === "N" ? "700" : "500",
        fill: label === "N" ? DASHBOARD.text : DASHBOARD.textMuted,
        textAlign: "center",
        textBaseline: "middle",
        listening: false
      })
    );
  });
  const rad = (heading - 90) * Math.PI / 180;
  const needleLen = r * 0.55;
  const needle = app.line({
    x: cx,
    y: cx,
    x2: needleLen * Math.cos(rad),
    y2: needleLen * Math.sin(rad),
    stroke: DASHBOARD.speedoNeedle,
    strokeWidth: Math.max(2, size / 32),
    lineCap: "round",
    listening: false
  });
  group.add(
    needle,
    app.circle({
      x: cx - size * 0.05,
      y: cx - size * 0.05,
      radius: size * 0.05,
      fill: DASHBOARD.compassHub,
      stroke: DASHBOARD.compassRing,
      strokeWidth: 1,
      listening: false
    }),
    app.text({
      text: `${Math.round(heading)}\xB0`,
      x: cx,
      y: cx + r * 0.22,
      fontSize: Math.max(8, Math.round(size * 0.09)),
      fontWeight: "600",
      fill: DASHBOARD.text,
      textAlign: "center",
      textBaseline: "middle",
      listening: false
    })
  );
  setParts2(group, { needle });
  setRefresh(group, (v) => {
    const h = (v - 90) * Math.PI / 180;
    const len = r * 0.55;
    needle.x2 = len * Math.cos(h);
    needle.y2 = len * Math.sin(h);
  });
  setState2(group, { size, heading });
  return group;
});
registerDashboard("calendar", (props, app) => {
  const group = createWidgetGroup(app, "calendar", props);
  installChartRebuild(group, app, buildCalendar);
  return group;
});
function buildCalendar(group, app, props) {
  const width = num2(props, "width", 210);
  const height = num2(props, "height", 0);
  const year = num2(props, "year", (/* @__PURE__ */ new Date()).getFullYear());
  const month = num2(props, "month", (/* @__PURE__ */ new Date()).getMonth());
  const highlightDay = num2(props, "highlightDay", -1);
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = first.getDay();
  const numRows = Math.ceil((startDay + daysInMonth) / 7);
  const headerH = 36;
  const gridW = width - 8;
  const gridH = height > headerH ? height - headerH - 4 : numRows * 26;
  const cell = Math.max(14, Math.min(Math.floor(gridW / 7), Math.floor(gridH / numRows), 32));
  const contentH = headerH + numRows * cell;
  group.metadata.chartWidth = width;
  group.metadata.chartHeight = height > 0 ? height : contentH + 4;
  group.add(
    app.text({
      text: first.toLocaleString("default", { month: "long", year: "numeric" }),
      x: 4,
      y: 4,
      fontSize: Math.min(13, cell * 0.45),
      fontWeight: "bold",
      fill: DASHBOARD.text,
      listening: false
    })
  );
  ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].forEach((d, i) => {
    group.add(
      app.text({
        text: d,
        x: i * cell + 4,
        y: 22,
        fontSize: Math.max(8, cell * 0.32),
        fill: DASHBOARD.textDim,
        listening: false
      })
    );
  });
  for (let day = 1; day <= daysInMonth; day++) {
    const cellIdx = startDay + day - 1;
    const col = cellIdx % 7;
    const row = Math.floor(cellIdx / 7);
    group.add(
      app.text({
        text: String(day),
        x: col * cell + Math.max(4, cell * 0.2),
        y: headerH + row * cell,
        fontSize: Math.max(9, cell * 0.38),
        fill: day === highlightDay ? DASHBOARD.highlight : DASHBOARD.text,
        listening: false
      })
    );
  }
  setState2(group, { width, height: height > 0 ? height : contentH + 4, year, month, highlightDay, cell });
}
registerDashboard("signalStrength", (props, app) => {
  const level = clamp3(num2(props, "value", 3), 0, 5);
  const scale = num2(props, "scale", 1);
  const group = createWidgetGroup(app, "signalStrength", props);
  const barW = Math.max(5, Math.round(7 * scale));
  const gap = Math.max(2, Math.round(3 * scale));
  const maxH = Math.round(28 * scale);
  const totalW = 5 * barW + 4 * gap;
  const bars = [];
  for (let i = 0; i < 5; i++) {
    const h = Math.round((8 + i * 5) * scale);
    const bar = app.rect({
      x: i * (barW + gap),
      y: maxH - h,
      width: barW,
      height: h,
      fill: i < level ? DASHBOARD.signalActive : DASHBOARD.signalInactive,
      cornerRadius: Math.max(1, scale),
      listening: false
    });
    bars.push(bar);
    group.add(bar);
  }
  setParts2(group, { bars });
  setRefresh(group, (v) => {
    const lv = clamp3(Math.round(v), 0, 5);
    bars.forEach((bar, i) => {
      bar.fill = i < lv ? DASHBOARD.signalActive : DASHBOARD.signalInactive;
    });
  });
  setState2(group, { value: level, scale, width: totalW, height: maxH });
  return group;
});
registerDashboard("knob", (props, app) => {
  const size = num2(props, "size", 80);
  const value = clamp3(num2(props, "value", 50), 0, 100);
  const group = createWidgetGroup(app, "knob", props, { width: size, height: size, focusable: true, listening: true });
  const cx = size / 2;
  const r = size / 2 - 5;
  const start = Math.PI * 0.75;
  const sweep = Math.PI * 1.5;
  const angle = start + value / 100 * sweep;
  const arcW = Math.max(3, size * 0.07);
  const ptrR = r - arcW;
  group.add(
    app.circle({
      x: cx - r,
      y: cx - r,
      radius: r,
      fill: DASHBOARD.knobTrack,
      stroke: DASHBOARD.knobRing,
      strokeWidth: Math.max(1.5, size / 40),
      shadow: size >= 48 ? { color: "rgba(0,0,0,0.35)", blur: 5, offsetX: 0, offsetY: 2 } : void 0,
      listening: false
    })
  );
  group.add(
    new Arc({
      x: cx - r + arcW,
      y: cx - r + arcW,
      radius: r - arcW,
      startAngle: start,
      endAngle: start + sweep,
      fill: null,
      stroke: DASHBOARD.inactive,
      strokeWidth: arcW * 0.65,
      listening: false
    })
  );
  const valueArc = new Arc({
    x: cx - r + arcW,
    y: cx - r + arcW,
    radius: r - arcW,
    startAngle: start,
    endAngle: angle,
    fill: null,
    stroke: DASHBOARD.knobIndicator,
    strokeWidth: arcW,
    listening: false
  });
  group.add(valueArc);
  const ptrSize = Math.max(4, size * 0.09);
  const pointer = app.circle({
    x: cx + ptrR * Math.cos(angle) - ptrSize,
    y: cx + ptrR * Math.sin(angle) - ptrSize,
    radius: ptrSize,
    fill: DASHBOARD.knobIndicator,
    stroke: "#fff",
    strokeWidth: 1,
    listening: false
  });
  const valueLabel = app.text({
    text: String(Math.round(value)),
    x: cx,
    y: cx,
    fontSize: Math.max(10, size * 0.22),
    fontWeight: "600",
    fill: DASHBOARD.text,
    textAlign: "center",
    textBaseline: "middle",
    listening: false
  });
  group.add(pointer, valueLabel);
  setParts2(group, { valueArc, pointer, valueLabel });
  setRefresh(group, (v) => {
    const pct = clamp3(v, 0, 100) / 100;
    const a = start + pct * sweep;
    valueArc.endAngle = a;
    pointer.x = cx + ptrR * Math.cos(a) - ptrSize;
    pointer.y = cx + ptrR * Math.sin(a) - ptrSize;
    valueLabel.text = String(Math.round(clamp3(v, 0, 100)));
  });
  group.on("click", () => {
    const next = (num2(getState2(group), "value", 0) + 10) % 100;
    setLiveValue(group, "value", next);
    group.emit("change", syntheticEvent("change", group, { value: next }));
  });
  setState2(group, { size, value });
  return group;
});
registerDashboard("meter", (props, app) => {
  const width = num2(props, "width", 200);
  const height = num2(props, "height", 24);
  const value = clamp3(num2(props, "value", 60), 0, 100);
  const vertical = bool2(props, "vertical", false);
  const group = createWidgetGroup(app, "meter", props);
  if (vertical) {
    group.add(app.rect({ width: height, height: width, fill: DASHBOARD.meterTrack, listening: false }));
    const fillBar = app.rect({
      x: 2,
      y: width - width * value / 100 - 2,
      width: height - 4,
      height: width * value / 100,
      fill: DASHBOARD.meterFill,
      listening: false
    });
    group.add(fillBar);
    setRefresh(group, (v) => {
      const pct = clamp3(v, 0, 100) / 100;
      fillBar.y = width - width * pct - 2;
      fillBar.height = width * pct;
    });
  } else {
    const trackR = Math.min(4, height / 2);
    group.add(
      app.roundedRect({
        width,
        height,
        cornerRadius: trackR,
        fill: DASHBOARD.meterTrack,
        listening: false
      })
    );
    const fillBar = app.roundedRect({
      x: 0,
      y: 0,
      width: width * value / 100,
      height,
      cornerRadius: trackR,
      fill: DASHBOARD.meterFill,
      listening: false
    });
    group.add(fillBar);
    setRefresh(group, (v) => {
      fillBar.width = width * clamp3(v, 0, 100) / 100;
    });
  }
  setState2(group, { width, height, value, vertical });
  return group;
});
registerDashboard("battery", (props, app) => {
  const level = clamp3(num2(props, "value", 75), 0, 100);
  const scale = num2(props, "scale", 1);
  const bodyW = Math.round(40 * scale);
  const bodyH = Math.round(20 * scale);
  const group = createWidgetGroup(app, "battery", props);
  group.add(
    app.roundedRect({
      width: bodyW,
      height: bodyH,
      cornerRadius: Math.max(2, 3 * scale),
      fill: null,
      stroke: DASHBOARD.batteryOutline,
      strokeWidth: Math.max(1.5, 2 * scale),
      listening: false
    })
  );
  group.add(
    app.roundedRect({
      x: bodyW,
      y: bodyH * 0.3,
      width: Math.max(3, 4 * scale),
      height: bodyH * 0.4,
      cornerRadius: 1,
      fill: DASHBOARD.batteryTip,
      listening: false
    })
  );
  const inset = Math.max(2, 2 * scale);
  const fill = app.roundedRect({
    x: inset,
    y: inset,
    width: (bodyW - inset * 2) * level / 100,
    height: bodyH - inset * 2,
    cornerRadius: Math.max(1, 2 * scale),
    fill: level > 20 ? DASHBOARD.success : DASHBOARD.danger,
    listening: false
  });
  group.add(fill);
  setRefresh(group, (v) => {
    const lv = clamp3(v, 0, 100);
    fill.width = (bodyW - inset * 2) * lv / 100;
    fill.fill = lv > 20 ? DASHBOARD.success : DASHBOARD.danger;
  });
  setState2(group, { value: level, scale, width: bodyW + Math.max(3, 4 * scale), height: bodyH });
  return group;
});
registerDashboard("clock", (props, app) => {
  const size = num2(props, "size", 120);
  const live = bool2(props, "live", true);
  const showSeconds = bool2(props, "showSeconds", size >= 44);
  const group = createWidgetGroup(app, "clock", props, { width: size, height: size });
  const cx = size / 2;
  const r = size / 2 - 3;
  const pad = Math.max(2, size * 0.04);
  const hourLen = (r - pad) * 0.5;
  const minLen = (r - pad) * 0.72;
  const secLen = (r - pad) * 0.82;
  const hourW = Math.max(2, size * 0.035);
  const minW = Math.max(1.5, size * 0.025);
  const hubR = Math.max(3, size * 0.05);
  group.add(
    app.circle({
      x: cx - r,
      y: cx - r,
      radius: r,
      fill: DASHBOARD.clockFace,
      stroke: DASHBOARD.clockRing,
      strokeWidth: Math.max(1.5, size / 50),
      shadow: size >= 56 ? { color: "rgba(0,0,0,0.35)", blur: 5, offsetX: 0, offsetY: 2 } : void 0,
      listening: false
    })
  );
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2 - Math.PI / 2;
    const major = i % 3 === 0;
    const tickLen = major ? size * 0.1 : size * 0.06;
    const inner = r - tickLen;
    const outer = r - size * 0.03;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    group.add(
      app.line({
        x: cx + inner * cos,
        y: cx + inner * sin,
        x2: (outer - inner) * cos,
        y2: (outer - inner) * sin,
        stroke: major ? DASHBOARD.clockTickMajor : DASHBOARD.clockTick,
        strokeWidth: major ? Math.max(1.5, size / 40) : 1,
        lineCap: "round",
        listening: false
      })
    );
  }
  const hourHand = app.line({
    x: cx,
    y: cx,
    x2: 0,
    y2: -hourLen,
    stroke: DASHBOARD.clockHand,
    strokeWidth: hourW,
    lineCap: "round",
    listening: false
  });
  const minHand = app.line({
    x: cx,
    y: cx,
    x2: 0,
    y2: -minLen,
    stroke: DASHBOARD.clockHand,
    strokeWidth: minW,
    lineCap: "round",
    listening: false
  });
  const secHand = app.line({
    x: cx,
    y: cx,
    x2: 0,
    y2: -secLen,
    stroke: DASHBOARD.clockSecond,
    strokeWidth: Math.max(1, size * 0.015),
    lineCap: "round",
    visible: showSeconds,
    listening: false
  });
  group.add(hourHand, minHand, secHand);
  group.add(
    app.circle({
      x: cx - hubR,
      y: cx - hubR,
      radius: hubR,
      fill: DASHBOARD.clockHub,
      stroke: DASHBOARD.clockRing,
      strokeWidth: 1,
      listening: false
    }),
    app.circle({
      x: cx - hubR * 0.45,
      y: cx - hubR * 0.45,
      radius: hubR * 0.45,
      fill: DASHBOARD.clockHand,
      listening: false
    })
  );
  const updateHands = () => {
    const now2 = /* @__PURE__ */ new Date();
    const hours = now2.getHours() % 12;
    const minutes = now2.getMinutes();
    const seconds = now2.getSeconds();
    const hourAngle = (hours + minutes / 60) / 12 * Math.PI * 2 - Math.PI / 2;
    const minAngle = (minutes + seconds / 60) / 60 * Math.PI * 2 - Math.PI / 2;
    const secAngle = seconds / 60 * Math.PI * 2 - Math.PI / 2;
    hourHand.x2 = hourLen * Math.cos(hourAngle);
    hourHand.y2 = hourLen * Math.sin(hourAngle);
    minHand.x2 = minLen * Math.cos(minAngle);
    minHand.y2 = minLen * Math.sin(minAngle);
    if (showSeconds) {
      secHand.x2 = secLen * Math.cos(secAngle);
      secHand.y2 = secLen * Math.sin(secAngle);
    }
  };
  updateHands();
  setParts2(group, { hourHand, minHand, secHand });
  if (live) {
    setRefresh(group, () => updateHands());
  }
  setState2(group, { size, live, showSeconds });
  return group;
});
registerDashboard("chartPanel", (props, app) => {
  const chartType = str2(props, "chartType", "lineChart");
  const title = str2(props, "title", chartType);
  const width = num2(props, "width", 320);
  const height = num2(props, "height", 200);
  const pad = 8;
  const headerH = 26;
  const innerW = Math.max(40, width - pad * 2);
  const innerH = Math.max(32, height - headerH - pad);
  const group = createWidgetGroup(app, "chartPanel", props);
  group.add(
    app.rect({
      width,
      height,
      fill: DASHBOARD.chartBg,
      stroke: DASHBOARD.panelStroke,
      strokeWidth: 1,
      cornerRadius: 8,
      listening: false
    }),
    app.text({
      text: title,
      x: pad,
      y: 6,
      fontSize: 12,
      fontWeight: "bold",
      fill: DASHBOARD.text,
      listening: false
    })
  );
  if (props.maximizable !== false) {
    group.add(
      app.text({
        text: "\u2922",
        x: width - 22,
        y: 5,
        fontSize: 14,
        fill: DASHBOARD.textMuted,
        listening: true,
        metadata: { chartPanelAction: "maximize" }
      })
    );
  }
  const chartProps = { ...props };
  delete chartProps.chartType;
  delete chartProps.title;
  delete chartProps.width;
  delete chartProps.height;
  delete chartProps.maximizable;
  const chart = createDashboardFromJSON(
    chartType,
    {
      ...chartProps,
      width: innerW,
      height: innerH,
      x: pad,
      y: headerH,
      responsive: props.responsive !== false,
      zoomEnabled: props.zoomEnabled !== false
    },
    app
  );
  if (chart) {
    chart.x = pad;
    chart.y = headerH;
    group.add(chart);
    setParts2(group, { chart });
  }
  setState2(group, { chartType, title, width, height, innerW, innerH });
  return group;
});

// src/dashboard/charts/core/responsive.ts
function isChartAppRoot(chartNode) {
  const app = chartNode.getApp();
  if (!app)
    return false;
  return app.stage.children.length === 1 && app.stage.children[0] === chartNode;
}
function syncAppViewport(chartNode, width, height) {
  const app = chartNode.getApp();
  if (!app || !isChartAppRoot(chartNode))
    return;
  const size = app.getSize();
  if (size.width !== width || size.height !== height) {
    app.resize(width, height);
  }
}
var observers = /* @__PURE__ */ new WeakMap();
function createResizeObserver(callback) {
  if (typeof ResizeObserver !== "undefined") {
    return new ResizeObserver(callback);
  }
  return {
    observe() {
    },
    unobserve() {
    },
    disconnect() {
    }
  };
}
function installChartResizeObserver(chartNode, container, options = {}) {
  detachChartResizeObserver(chartNode);
  const minW = options.minWidth ?? 64;
  const minH = options.minHeight ?? 48;
  const pad = options.padding ?? 0;
  const watchHeight = options.watchHeight !== false;
  const syncSize = options.syncSize !== false;
  let raf = 0;
  const ro = createResizeObserver((entries) => {
    const rect = entries[0]?.contentRect;
    if (!rect)
      return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      applyChartContainerSize(chartNode, rect.width, rect.height, {
        minW,
        minH,
        pad,
        watchHeight,
        syncSize
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
    syncSize
  });
}
function detachChartResizeObserver(chartNode) {
  const ro = observers.get(chartNode);
  ro?.disconnect();
  observers.delete(chartNode);
  delete chartNode.metadata.resizeObserverAttached;
}
function applyChartContainerSize(chartNode, rawW, rawH, opts) {
  const w = Math.max(opts.minW, Math.floor(rawW - opts.pad));
  const h = Math.max(opts.minH, Math.floor(rawH - opts.pad));
  const last = chartNode.metadata._lastContainerSize;
  if (last && last.w === w && last.h === h) {
    syncAppViewport(chartNode, w, h);
    return;
  }
  syncAppViewport(chartNode, w, h);
  const state = getState2(chartNode);
  const patch = {};
  const hasWidth = num2(state, "width", 0) > 0 || "width" in state;
  const hasHeight = num2(state, "height", 0) > 0 || "height" in state;
  const hasSize = num2(state, "size", 0) > 0;
  if (hasWidth && w > 0 && w !== num2(state, "width", 0))
    patch.width = w;
  if (opts.watchHeight && hasHeight && h > 0 && h !== num2(state, "height", 0))
    patch.height = h;
  if (opts.syncSize && hasSize && !hasWidth) {
    const sz = opts.watchHeight ? Math.min(w, h) : w;
    if (sz > 0 && sz !== num2(state, "size", 0))
      patch.size = sz;
  } else if (opts.syncSize && hasSize && hasWidth && opts.watchHeight) {
    const sz = Math.min(w, h);
    if (sz > 0 && sz !== num2(state, "size", 0))
      patch.size = sz;
  }
  if (Object.keys(patch).length > 0) {
    chartNode.metadata._lastContainerSize = { w, h };
    updateChartProps(chartNode, patch);
  } else {
    chartNode.metadata._lastContainerSize = { w, h };
  }
}

// src/modules/dashboard/index.ts
var dashboardPlugin = {
  name: "lightdraw-dashboard",
  version: "1.0.0",
  install(LD) {
    registerJSONResolver((type, props, app) => createDashboardFromJSON(type, props, app));
    LD.registerDashboard = registerDashboard;
  }
};

// src/automotive/layout.ts
function resolveBounds(props, defaultWidth, defaultHeight, pad = 8) {
  const width = "width" in props && typeof props.width === "number" ? Math.max(24, props.width) : Math.max(56, num3(props, "width", defaultWidth));
  const height = "height" in props && typeof props.height === "number" ? Math.max(20, props.height) : Math.max(44, num3(props, "height", defaultHeight));
  const adaptivePad = Math.min(pad, Math.max(2, Math.round(Math.min(width, height) * 0.1)));
  const innerWidth = Math.max(16, width - adaptivePad * 2);
  const innerHeight = Math.max(12, height - adaptivePad * 2);
  const maxDial = Math.min(innerWidth, innerHeight);
  const explicit = num3(props, "size", 0);
  const dialSize = explicit > 0 ? Math.min(explicit, maxDial) : Math.max(28, maxDial);
  return { width, height, pad: adaptivePad, innerWidth, innerHeight, dialSize };
}
function isCompactBounds(bounds) {
  return bounds.innerWidth < 112 || bounds.innerHeight < 76;
}
function estimateTextWidth(text, fontSize) {
  return Math.max(fontSize, text.length * fontSize * 0.55);
}
function fitTextX(text, fontSize, boxW, pad = 0) {
  const estW = Math.min(boxW - pad * 2, estimateTextWidth(text, fontSize));
  return pad + Math.max(0, (boxW - pad * 2 - estW) / 2);
}
function fitFontSizeToWidth(text, boxW, maxSize, minSize = 6, pad = 0) {
  const available = Math.max(8, boxW - pad * 2);
  let fontSize = maxSize;
  while (fontSize > minSize && estimateTextWidth(text, fontSize) > available) {
    fontSize -= 1;
  }
  const estW = Math.min(available, estimateTextWidth(text, fontSize));
  return { fontSize, x: pad + Math.max(0, (available - estW) / 2) };
}
function textYForBaseline(y, fontSize, baseline = "middle") {
  if (baseline === "middle")
    return y - fontSize * 0.5;
  if (baseline === "bottom" || baseline === "ideographic")
    return y - fontSize;
  return y;
}
function autoCenteredText(app, text, boxW, y, options = {}) {
  const fontSize = options.fontSize ?? 12;
  const insetX = options.insetX ?? 0;
  const insetY = options.insetY ?? 0;
  const baseline = options.textBaseline ?? "middle";
  return app.text({
    text,
    x: insetX + boxW / 2,
    y: insetY + textYForBaseline(y, fontSize, baseline),
    fontSize,
    fontWeight: options.fontWeight ?? "normal",
    fill: options.fill ?? "#fff",
    fontFamily: options.fontFamily,
    textAlign: "center",
    metadata: { textBoxWidth: boxW, textBoxCenterY: insetY + y },
    listening: false
  });
}
function fluidFont(base, bounds, min = 8, max = 24) {
  const scale = Math.min(bounds.innerWidth, bounds.innerHeight) / 120;
  return Math.round(Math.min(max, Math.max(min, base * scale)));
}
function centerInBounds(bounds, contentW, contentH) {
  return {
    x: bounds.pad + Math.max(0, (bounds.innerWidth - contentW) / 2),
    y: bounds.pad + Math.max(0, (bounds.innerHeight - contentH) / 2)
  };
}
function resolveDisplay(props, fallback = "analog") {
  const mode = str3(props, "display", "").toLowerCase();
  if (mode === "digital" || mode === "lcd")
    return "digital";
  if (mode === "analog")
    return "analog";
  if (str3(props, "theme", "") === "digital" && bool3(props, "digitalGauges", false)) {
    return "digital";
  }
  return fallback;
}
function resolveClusterLayout(w, h, options = {}) {
  const tiny = w < 140 || h < 90;
  const compact = h < 200;
  const margin = Math.max(tiny ? 4 : 6, Math.min(w, h) * (tiny ? 0.014 : 0.018));
  const short = h < 240;
  const bottomBand = Math.max(short ? 22 : 26, Math.round(h * (short ? 0.12 : 0.14)));
  const bottomY = h - bottomBand - margin * 0.5;
  const topSpace = Math.max(36, bottomY - margin);
  const cx = w / 2;
  const dialSize = Math.max(compact ? 32 : 36, Math.min(w * 0.18, topSpace * (short ? 0.36 : 0.44)));
  let dialBox = dialSize + Math.max(compact ? 4 : 6, dialSize * 0.08);
  const maxDialBox = Math.max(compact ? 36 : 40, (w - margin * 3) / 2);
  if (dialBox > maxDialBox) {
    dialBox = maxDialBox;
  }
  const fittedDialSize = Math.max(compact ? 28 : 40, dialBox - Math.max(compact ? 4 : 6, dialBox * 0.08));
  const smallDial = Math.max(compact ? 22 : 28, Math.min(dialSize * 0.48, w * 0.09, topSpace * 0.2));
  const smallBox = smallDial + Math.max(compact ? 4 : 5, smallDial * 0.08);
  const gearW = Math.max(compact ? 30 : 34, w * 0.065);
  let gearH = compact ? Math.max(20, Math.min(24, h * 0.11)) : Math.max(30, Math.min(h * 0.13, topSpace * 0.2));
  const turnW = Math.max(compact ? 32 : 36, w * 0.065);
  let turnH = compact ? Math.max(11, h * 0.042) : Math.max(14, h * 0.055);
  const fuelW = Math.max(52, w * 0.13);
  const fuelH = Math.max(compact ? 22 : 26, bottomBand * 0.86);
  const batW = Math.max(44, w * 0.1);
  const batH = Math.max(16, bottomBand * 0.55);
  const tpmsW = Math.max(compact ? 64 : 68, w * 0.17);
  let tpmsH = compact ? Math.max(22, Math.min(28, h * 0.14)) : Math.max(36, Math.min(h * 0.18, topSpace * 0.26));
  let lampSize = Math.max(compact ? 14 : 18, Math.min(bottomBand * 0.75, w * 0.036));
  let cruiseW = Math.max(36, w * 0.085);
  let cruiseH = Math.max(compact ? 13 : 16, bottomBand * 0.48);
  let adasW = Math.max(40, w * 0.1);
  let adasH = Math.max(10, bottomBand * 0.4);
  const centerTop = margin + smallBox + (compact ? 2 : 4);
  const centerBottom = bottomY - (compact ? 2 : 4);
  const centerGap = compact ? 3 : 4;
  let centerNeed = gearH + turnH + tpmsH + centerGap * 2;
  const centerAvail = Math.max(24, centerBottom - centerTop);
  if (centerNeed > centerAvail) {
    const scale = centerAvail / centerNeed;
    gearH = Math.max(18, gearH * scale);
    turnH = Math.max(10, turnH * scale);
    tpmsH = Math.max(18, tpmsH * scale);
    centerNeed = gearH + turnH + tpmsH + centerGap * 2;
  }
  const centerSlack = Math.max(0, centerAvail - centerNeed);
  const gearY = centerTop + centerSlack * 0.12;
  const turnY = gearY + gearH + centerGap;
  const tpmsY = turnY + turnH + centerGap;
  const centerY = (boxH) => Math.min(bottomY + (bottomBand - boxH) / 2, h - margin - boxH);
  const leftUsed = margin + fuelW + margin * 0.35 + batW + margin;
  const rightNeeded = lampSize * 3 + cruiseW + adasW + margin * 1.4;
  const rightAvail = Math.max(40, w - leftUsed - margin - tpmsW * 0.35);
  if (rightNeeded > rightAvail) {
    const scale = rightAvail / rightNeeded;
    lampSize = Math.max(16, lampSize * scale);
    cruiseW = Math.max(36, cruiseW * scale);
    cruiseH = Math.max(14, cruiseH * scale);
    adasW = Math.max(40, adasW * scale);
    adasH = Math.max(10, adasH * scale);
  }
  let rx = w - margin;
  const placeRight = (type, rw, rh) => {
    rx -= rw;
    const x = Math.max(margin, rx);
    const slot = { type, x, y: centerY(rh), width: rw, height: rh };
    rx = x - margin * 0.28;
    return slot;
  };
  const compactRight = compact && w < 320;
  const rightSlots = compactRight ? [placeRight("cruiseControl", cruiseW, cruiseH), placeRight("adasStatus", adasW, adasH)] : [
    placeRight("adasStatus", adasW, adasH),
    placeRight("warningLamp", lampSize, lampSize),
    placeRight("cruiseControl", cruiseW, cruiseH),
    placeRight("headlights", lampSize, lampSize),
    placeRight("parkingBrake", lampSize, lampSize)
  ];
  const interGap = Math.max(6, margin * 0.45);
  const callBandW = w - margin * 2 - dialBox * 2 - interGap * 2;
  const showCall = !!options.callScreen && w >= 520 && h >= 220 && callBandW >= 120;
  const centerSlots = [];
  if (showCall) {
    const callH = Math.max(72, Math.min(h * 0.36, dialBox * 1.02, topSpace * 0.58));
    const callY = margin + Math.max(0, (dialBox - callH) * 0.42) + (compact && h < 176 ? 0 : smallBox * 0.12);
    centerSlots.push({
      type: "callScreen",
      x: margin + dialBox + interGap,
      y: callY,
      width: callBandW,
      height: callH
    });
    const bottomGearY = bottomY + (bottomBand - gearH) / 2;
    const gearX = Math.max(margin + dialBox + interGap, cx - gearW - turnW / 2 - 4);
    centerSlots.push(
      { type: "gearIndicator", x: gearX, y: bottomGearY, width: gearW, height: gearH },
      {
        type: "turnIndicators",
        x: Math.min(w - margin - dialBox - interGap - turnW, cx - turnW / 2),
        y: bottomGearY + (gearH - turnH) / 2,
        width: turnW,
        height: turnH
      }
    );
    if (h >= 340) {
      const tpmsStripH = Math.max(22, Math.min(30, tpmsH));
      const tpmsY2 = callY + callH + 6;
      if (tpmsY2 + tpmsStripH <= bottomY - 4) {
        centerSlots.push({ type: "tpms", x: cx - tpmsW / 2, y: tpmsY2, width: tpmsW, height: tpmsStripH });
      }
    }
  } else {
    centerSlots.push(
      { type: "gearIndicator", x: cx - gearW / 2, y: gearY, width: gearW, height: gearH },
      { type: "turnIndicators", x: cx - turnW / 2, y: turnY, width: turnW, height: turnH },
      { type: "tpms", x: cx - tpmsW / 2, y: tpmsY, width: tpmsW, height: tpmsH }
    );
  }
  const slots = [
    { type: "speedometer", x: margin, y: margin, width: dialBox, height: dialBox, size: fittedDialSize },
    { type: "tachometer", x: w - margin - dialBox, y: margin, width: dialBox, height: dialBox, size: fittedDialSize },
    ...compact && h < 176 || showCall ? [] : [{ type: "engineTemp", x: cx - smallBox / 2, y: margin + 3, width: smallBox, height: smallBox, size: smallDial }],
    ...centerSlots,
    { type: "fuelGauge", x: margin, y: centerY(fuelH), width: fuelW, height: fuelH },
    { type: "batteryVoltage", x: margin + fuelW + margin * 0.35, y: centerY(batH), width: batW, height: batH },
    ...rightSlots
  ];
  return slots.map((slot) => ({
    ...slot,
    x: Math.max(margin, Math.min(slot.x, w - margin - slot.width)),
    y: Math.max(margin, Math.min(slot.y, h - margin - slot.height))
  }));
}

// src/automotive/refresh.ts
function isAutoGroup(node) {
  return "children" in node && typeof node.metadata?.autoType === "string";
}
function syncAutoAppViewport(node, width, height) {
  const app = node.getApp();
  if (!app || app.stage.children.length !== 1 || app.stage.children[0] !== node)
    return;
  const size = app.getSize();
  if (size.width !== width || size.height !== height) {
    app.resize(width, height);
  }
}
function installAutoWidgetRebuild(group, app, autoType) {
  const type = autoType ?? group.metadata?.autoType;
  if (!type)
    return;
  const rebuild = () => {
    const factory = registry3[type];
    if (!factory)
      return;
    const props = { ...getState3(group), x: group.x, y: group.y };
    const fresh = factory(props, app);
    if (!fresh || !isAutoGroup(fresh))
      return;
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
    const w = num3(props, "width", 0);
    const h = num3(props, "height", 0);
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
    const renderer = app.getRenderer?.();
    if (renderer && typeof renderer.forceFullRedraw === "function") {
      renderer.forceFullRedraw();
    }
  };
  group.metadata.autoRebuild = rebuild;
}
function updateAutoWidgetProps(group, patch) {
  if (!isAutoGroup(group))
    return;
  const prev = getState3(group);
  const sizeKeys = ["width", "height", "size"];
  const onlySize = Object.keys(patch).every((k) => sizeKeys.includes(k));
  if (onlySize) {
    const same = (!("width" in patch) || num3(patch, "width", -1) === num3(prev, "width", -2)) && (!("height" in patch) || num3(patch, "height", -1) === num3(prev, "height", -2)) && (!("size" in patch) || num3(patch, "size", -1) === num3(prev, "size", -2));
    if (same)
      return;
  }
  setState3(group, patch);
  const state = getState3(group);
  if (("width" in patch || "height" in patch) && (num3(state, "size", 0) > 0 || "size" in state)) {
    const bounds = resolveBounds(state, num3(state, "width", 160), num3(state, "height", 120));
    if (bounds.dialSize !== num3(state, "size", 0)) {
      setState3(group, { size: bounds.dialSize });
    }
  }
  const w = num3(patch, "width", num3(state, "width", 0));
  const h = num3(patch, "height", num3(state, "height", 0));
  if (w > 0) {
    group.metadata.chartWidth = w;
    group.metadata.autoWidth = w;
  }
  if (h > 0) {
    group.metadata.chartHeight = h;
    group.metadata.autoHeight = h;
  }
  const rebuild = group.metadata.autoRebuild;
  rebuild?.();
  if (w > 0 && h > 0) {
    syncAutoAppViewport(group, w, h);
  }
}

// src/automotive/registryCore.ts
var registry3 = {};
function registerAutomotive(type, factory) {
  registry3[type] = factory;
}
function isAutoGroup2(node) {
  return "children" in node && typeof node.metadata?.autoType === "string";
}
function createAutomotiveFromJSON(type, props, app) {
  const factory = registry3[type];
  if (!factory)
    return null;
  const node = factory(props, app);
  if (node && isAutoGroup2(node)) {
    const state = getState3(node);
    const bounds = resolveBounds(
      { ...state, ...props },
      num3(props, "width", 160),
      num3(props, "height", 120)
    );
    if (!num3(state, "width", 0) || !num3(state, "height", 0)) {
      setState3(node, { width: bounds.width, height: bounds.height });
      node.metadata.chartWidth = bounds.width;
      node.metadata.autoWidth = bounds.width;
      node.metadata.chartHeight = bounds.height;
      node.metadata.autoHeight = bounds.height;
    }
    installAutoWidgetRebuild(node, app, type);
  }
  return node;
}

// src/automotive/catalog.ts
var DIAL_WIDGETS = [
  { kind: "dial", type: "speedometer", max: 240, format: "int", tickCount: 12, redlineFrom: 0.82 },
  { kind: "dial", type: "tachometer", max: 8e3, format: "rpm", tickCount: 8, redlineFrom: 0.75 },
  { kind: "dial", type: "turboBoostGauge", max: 30, format: "int", unit: " PSI" },
  { kind: "dial", type: "torqueMeter", max: 500, format: "int", unit: " Nm" },
  { kind: "dial", type: "horsepowerMeter", max: 600, format: "int", unit: " HP" },
  { kind: "dial", type: "engineLoad", max: 100, format: "percent" },
  { kind: "dial", type: "throttlePosition", max: 100, format: "percent" },
  { kind: "dial", type: "brakePressure", max: 200, format: "int", unit: " bar" },
  { kind: "dial", type: "steeringAngle", max: 540, format: "deg" },
  { kind: "dial", type: "yawRate", max: 45, format: "deg" },
  { kind: "dial", type: "altimeter", max: 5e3, format: "int", unit: " m" },
  { kind: "dial", type: "oilPressure", max: 100, format: "int", unit: " PSI" },
  { kind: "dial", type: "powerMeter", max: 300, format: "int", unit: " kW" },
  { kind: "dial", type: "gForceMeter", max: 2, format: "int", unit: " G" }
];
var BAR_WIDGETS = [
  { kind: "bar", type: "fuelGauge", label: "Fuel" },
  { kind: "bar", type: "batteryLevel", label: "Battery", warnBelow: 20 },
  { kind: "bar", type: "stateOfCharge", label: "SoC", warnBelow: 15 },
  { kind: "bar", type: "stateOfHealth", label: "SoH", warnBelow: 70 },
  { kind: "bar", type: "energyConsumption", label: "Energy" },
  { kind: "bar", type: "regenerativeBrakingMeter", label: "Regen" },
  { kind: "bar", type: "fanSpeed", label: "Fan" },
  { kind: "bar", type: "seatHeating", label: "Seat Heat" },
  { kind: "bar", type: "seatVentilation", label: "Seat Vent" },
  { kind: "bar", type: "volumeControl", label: "Volume" },
  { kind: "bar", type: "chargingPower", label: "Charge kW" },
  { kind: "bar", type: "suspensionHeight", label: "Ride Height" },
  { kind: "bar", type: "washerFluidLevel", label: "Washer", warnBelow: 20 },
  { kind: "bar", type: "brakeWearStatus", label: "Brake Wear", warnBelow: 25 },
  { kind: "bar", type: "brakeFluidStatus", label: "Brake Fluid", warnBelow: 25 }
];
var NUMERIC_WIDGETS = [
  { kind: "numeric", type: "odometer", title: "Odometer", unit: " km" },
  { kind: "numeric", type: "tripMeter", title: "Trip", unit: " km" },
  { kind: "numeric", type: "batteryVoltage", title: "Battery", unit: "V", decimals: 1 },
  { kind: "numeric", type: "fuelEconomy", title: "Fuel Econ", unit: " L/100" },
  { kind: "numeric", type: "averageFuelEconomy", title: "Avg Econ", unit: " L/100" },
  { kind: "numeric", type: "instantFuelEconomy", title: "Inst Econ", unit: " L/100" },
  { kind: "numeric", type: "remainingFuelRange", title: "Fuel Range", unit: " km" },
  { kind: "numeric", type: "evRemainingRange", title: "EV Range", unit: " km" },
  { kind: "numeric", type: "outsideTemperature", title: "Outside", unit: "\xB0C" },
  { kind: "numeric", type: "cabinTemperature", title: "Cabin", unit: "\xB0C" },
  { kind: "numeric", type: "oilTemperature", title: "Oil Temp", unit: "\xB0C" },
  { kind: "numeric", type: "coolantTemperature", title: "Coolant", unit: "\xB0C" },
  { kind: "numeric", type: "engineTemperature", title: "Engine", unit: "\xB0C" },
  { kind: "numeric", type: "tireTemperature", title: "Tire Temp", unit: "\xB0C" },
  { kind: "numeric", type: "eta", title: "ETA", unit: "" },
  { kind: "numeric", type: "chargingTimer", title: "Charge Timer", unit: " min" },
  { kind: "numeric", type: "performanceTimer", title: "Perf Timer", unit: " s" },
  { kind: "numeric", type: "lapTimer", title: "Lap Timer", unit: " s", decimals: 2 },
  { kind: "numeric", type: "accelerationTimer", title: "0-100", unit: " s", decimals: 1 },
  { kind: "numeric", type: "compassHeading", title: "Heading", unit: "\xB0" },
  { kind: "numeric", type: "pitchRollIndicator", title: "Pitch/Roll", unit: "\xB0" },
  { kind: "numeric", type: "airQualityIndex", title: "AQI", unit: "" },
  { kind: "numeric", type: "speedLimitRecognition", title: "Speed Limit", unit: "" },
  { kind: "numeric", type: "digitalClock", title: "Clock", unit: "" },
  { kind: "numeric", type: "dateDisplay", title: "Date", unit: "" }
];
var LAMP_WIDGETS = [
  { kind: "lamp", type: "parkingBrake", symbol: "P" },
  { kind: "lamp", type: "parkingBrakeStatus", symbol: "P" },
  { kind: "lamp", type: "headlights", symbol: "HL" },
  { kind: "lamp", type: "headlightStatus", symbol: "HL" },
  { kind: "lamp", type: "highBeamStatus", symbol: "HB" },
  { kind: "lamp", type: "fogLightStatus", symbol: "FG" },
  { kind: "lamp", type: "hazardLights", symbol: "HZ" },
  { kind: "lamp", type: "absStatus", symbol: "ABS" },
  { kind: "lamp", type: "electronicStabilityControl", symbol: "ESC" },
  { kind: "lamp", type: "tractionControl", symbol: "TC" },
  { kind: "lamp", type: "airbagStatus", symbol: "AIR" },
  { kind: "lamp", type: "seatBeltStatus", symbol: "BELT" },
  { kind: "lamp", type: "doorOpenStatus", symbol: "DOOR" },
  { kind: "lamp", type: "hoodOpenStatus", symbol: "HOOD" },
  { kind: "lamp", type: "trunkTailgateStatus", symbol: "TRK" },
  { kind: "lamp", type: "windowStatus", symbol: "WIN" },
  { kind: "lamp", type: "wiperStatus", symbol: "WIP" },
  { kind: "lamp", type: "rainSensor", symbol: "RAIN" },
  { kind: "lamp", type: "autoHoldStatus", symbol: "HOLD" },
  { kind: "lamp", type: "awdFourWdStatus", symbol: "AWD" },
  { kind: "lamp", type: "differentialLock", symbol: "DIFF" },
  { kind: "lamp", type: "trailerMode", symbol: "TOW" },
  { kind: "lamp", type: "towAssist", symbol: "TOW+" },
  { kind: "lamp", type: "laneKeepAssist", symbol: "LKA" },
  { kind: "lamp", type: "laneDepartureWarning", symbol: "LDW" },
  { kind: "lamp", type: "blindSpotMonitoring", symbol: "BSM" },
  { kind: "lamp", type: "forwardCollisionWarning", symbol: "FCW" },
  { kind: "lamp", type: "automaticEmergencyBraking", symbol: "AEB" },
  { kind: "lamp", type: "parkingAssist", symbol: "PARK" },
  { kind: "lamp", type: "driveModeIndicator", symbol: "MODE" },
  { kind: "lamp", type: "steeringWheelHeater", symbol: "STR" }
];
var BADGE_WIDGETS = [
  { kind: "badge", type: "cruiseControl", title: "Cruise" },
  { kind: "badge", type: "cruiseControlStatus", title: "Cruise" },
  { kind: "badge", type: "adaptiveCruiseControl", title: "ACC" },
  { kind: "badge", type: "adasStatus", title: "ADAS" },
  { kind: "badge", type: "chargingStatus", title: "Charging" },
  { kind: "badge", type: "bluetoothStatus", title: "Bluetooth" },
  { kind: "badge", type: "wifiStatus", title: "Wi-Fi" },
  { kind: "badge", type: "mobileNetworkSignal", title: "Mobile" },
  { kind: "badge", type: "phoneStatus", title: "Phone" },
  { kind: "badge", type: "voiceAssistant", title: "Voice" },
  { kind: "badge", type: "microphoneStatus", title: "Mic" },
  { kind: "badge", type: "usbStatus", title: "USB" },
  { kind: "badge", type: "appleCarPlay", title: "CarPlay" },
  { kind: "badge", type: "androidAuto", title: "Android Auto" },
  { kind: "badge", type: "remoteLockUnlock", title: "Remote Lock" },
  { kind: "badge", type: "remoteStart", title: "Remote Start" },
  { kind: "badge", type: "remoteClimateControl", title: "Remote HVAC" },
  { kind: "badge", type: "remoteHornLights", title: "Horn/Lights" },
  { kind: "badge", type: "suspensionMode", title: "Suspension" },
  { kind: "badge", type: "ambientLightingControl", title: "Ambient" },
  { kind: "badge", type: "driverProfile", title: "Profile" },
  { kind: "badge", type: "userLogin", title: "User" },
  { kind: "badge", type: "serviceReminder", title: "Service" },
  { kind: "badge", type: "maintenanceSchedule", title: "Maint" },
  { kind: "badge", type: "findMyVehicle", title: "Find Car" },
  { kind: "badge", type: "vehicleLocation", title: "Location" }
];
var PANEL_WIDGETS = [
  { kind: "panel", type: "climateControl", title: "Climate", rows: ["Auto", "22\xB0C", "Fan 3"] },
  { kind: "panel", type: "hvacStatus", title: "HVAC", rows: ["Mode: Auto", "Sync: On"] },
  { kind: "panel", type: "compass", title: "Compass", rows: ["N 000\xB0"] },
  { kind: "panel", type: "gpsNavigationMap", title: "Navigation", rows: ["Map preview", "Searching GPS\u2026"] },
  { kind: "panel", type: "turnByTurnNavigation", title: "Turn-by-Turn", rows: ["In 200 m", "Turn right"] },
  { kind: "panel", type: "routeGuidance", title: "Route", rows: ["12.4 km", "18 min"] },
  { kind: "panel", type: "trafficInformation", title: "Traffic", rows: ["Moderate ahead"] },
  { kind: "panel", type: "calendar", title: "Calendar", rows: ["Mon 6 Jul", "No events"] },
  { kind: "panel", type: "notificationCenter", title: "Notifications", rows: ["3 new alerts"] },
  { kind: "panel", type: "callScreen", title: "Call", rows: ["Incoming\u2026", "Swipe to answer"] },
  { kind: "panel", type: "contacts", title: "Contacts", rows: ["Recent", "Favorites"] },
  { kind: "panel", type: "messages", title: "Messages", rows: ["2 unread"] },
  { kind: "panel", type: "mediaPlayer", title: "Media", rows: ["Now playing", "Track \u2014 Artist"] },
  { kind: "panel", type: "musicControls", title: "Music", rows: ["\u23EE  \u25B6  \u23ED"] },
  { kind: "panel", type: "albumArt", title: "Album", rows: ["[ Artwork ]"] },
  { kind: "panel", type: "fmRadio", title: "Radio", rows: ["FM 98.5"] },
  { kind: "panel", type: "podcastPlayer", title: "Podcast", rows: ["Episode 12"] },
  { kind: "panel", type: "equalizer", title: "EQ", rows: ["Bass +2", "Treble 0"] },
  { kind: "panel", type: "nowPlaying", title: "Now Playing", rows: ["Song Title", "Artist"] },
  { kind: "panel", type: "navigationSearch", title: "Nav Search", rows: ["Search\u2026"] },
  { kind: "panel", type: "favoriteDestinations", title: "Favorites", rows: ["Home", "Work"] },
  { kind: "panel", type: "weatherWidget", title: "Weather", rows: ["22\xB0C Sunny"] },
  { kind: "panel", type: "sunriseSunset", title: "Sun", rows: ["Rise 06:12", "Set 19:45"] },
  { kind: "panel", type: "vehicleHealthMonitor", title: "Health", rows: ["All systems OK"] },
  { kind: "panel", type: "diagnosticTroubleCodes", title: "DTC", rows: ["No codes"] },
  { kind: "panel", type: "chargingHistory", title: "Charge History", rows: ["Last: 42 kWh"] },
  { kind: "panel", type: "chargingStationFinder", title: "Chargers", rows: ["3 nearby"] },
  { kind: "panel", type: "driveRecorder", title: "Dashcam", rows: ["Recording"] },
  { kind: "panel", type: "surroundViewCamera", title: "360\xB0 View", rows: ["Cameras active"] },
  { kind: "panel", type: "rearViewCamera", title: "Rear Cam", rows: ["Reverse view"] },
  { kind: "panel", type: "parkingSensorDisplay", title: "Parking Sensors", rows: ["FL \u25A0\u25A0\u25A0", "FR \u25A0\u25A0\u25A1"] },
  { kind: "panel", type: "cameraFeedWidget", title: "Camera", rows: ["Live feed"] },
  { kind: "panel", type: "warningAlertPanel", title: "Warnings", rows: ["No warnings"] },
  { kind: "panel", type: "sensorDashboard", title: "Sensors", rows: ["IMU OK", "GPS OK"] },
  { kind: "panel", type: "canBusSignalMonitor", title: "CAN Bus", rows: ["engine.rpm: 0", "vehicle.speed: 0"] },
  { kind: "panel", type: "vehicleCanLogger", title: "CAN Logger", rows: ["Logging\u2026"] },
  { kind: "panel", type: "customWidgetPanel", title: "Custom", rows: ["Add widgets"] },
  { kind: "panel", type: "splitScreenView", title: "Split View", rows: ["Left | Right"] },
  { kind: "panel", type: "quickSettingsPanel", title: "Quick Settings", rows: ["Wi-Fi", "BT", "HVAC"] },
  { kind: "panel", type: "vehicleAnimation", title: "Vehicle", rows: ["3D model"] },
  { kind: "panel", type: "statusIndicatorIcons", title: "Status Icons", rows: ["\u25CF \u25CF \u25CF \u25CF"] }
];
var ALL_CATALOG_WIDGETS = [
  ...DIAL_WIDGETS,
  ...BAR_WIDGETS,
  ...NUMERIC_WIDGETS,
  ...LAMP_WIDGETS,
  ...BADGE_WIDGETS,
  ...PANEL_WIDGETS
];
var WIDGET_ALIASES = {
  gearPositionIndicator: "gearIndicator",
  tirePressureMonitoring: "tpms",
  turnIndicator: "turnIndicators",
  radio: "fmRadio"
};

// src/automotive/themes.ts
var THEMES = {
  classic: {
    background: "#0a0a0a",
    dialStroke: "#444444",
    needleSpeed: "#ef4444",
    needleTach: "#22c55e",
    text: "#ffffff",
    textMuted: "#9ca3af",
    accent: "#2563eb",
    warning: "#ef4444",
    ok: "#22c55e",
    lampOn: "#fbbf24",
    lampOff: "#333333"
  },
  sport: {
    background: "#111827",
    dialStroke: "#1f2937",
    needleSpeed: "#f97316",
    needleTach: "#eab308",
    text: "#f9fafb",
    textMuted: "#6b7280",
    accent: "#dc2626",
    warning: "#dc2626",
    ok: "#84cc16",
    lampOn: "#fde047",
    lampOff: "#374151"
  },
  digital: {
    background: "#020617",
    dialStroke: "#0ea5e9",
    needleSpeed: "#38bdf8",
    needleTach: "#22d3ee",
    text: "#e0f2fe",
    textMuted: "#64748b",
    accent: "#0ea5e9",
    warning: "#f43f5e",
    ok: "#10b981",
    lampOn: "#22d3ee",
    lampOff: "#1e293b"
  }
};
function getTheme(name) {
  return THEMES[name] ?? THEMES.classic;
}

// src/automotive/primitives/digitalGauge.ts
function digitalGaugeStyle(theme) {
  const isDigital = theme.background === "#020617";
  return {
    panelFill: isDigital ? "#041018" : "#111827",
    panelStroke: theme.dialStroke,
    labelColor: theme.textMuted,
    valueColor: theme.text,
    unitColor: theme.accent,
    barTrack: theme.lampOff,
    barFill: theme.accent,
    segmentOn: theme.accent,
    segmentOff: "#1e293b"
  };
}
function formatCompactDigitalValue(value, unit, format, boxW, maxFont) {
  if (!unit)
    return format(value);
  const rounded = format(value);
  const full = unit === "RPM" ? `${rounded}${unit}` : `${rounded} ${unit}`;
  if (estimateTextWidth(full, maxFont) <= boxW)
    return full;
  if (unit === "RPM" && value >= 1e3) {
    const short = `${(value / 1e3).toFixed(1)}k`;
    if (estimateTextWidth(short, maxFont) <= boxW)
      return short;
    return rounded;
  }
  if (unit === "km/h" || unit === "mph" || unit === "\xB0C" || unit === "\xB0F") {
    return rounded;
  }
  return full;
}
function buildDigitalGauge(app, group, bounds, style, opts) {
  const w = bounds.innerWidth;
  const h = bounds.innerHeight;
  const compact = h < 72 || w < 96;
  const micro = compact && (h < 56 || w < 60);
  const format = opts.formatValue ?? ((v) => String(Math.round(v)));
  const pct = Math.min(1, Math.max(0, opts.value / Math.max(opts.max, 1)));
  const abbrev = { SPEED: "SPD", TEMPERATURE: "TMP", TEMP: "TMP" };
  const labelText = (micro ? abbrev[opts.label.toUpperCase()] ?? opts.label.slice(0, 3) : opts.label).toUpperCase();
  group.add(
    app.roundedRect({
      width: w,
      height: h,
      cornerRadius: Math.min(10, h * 0.12),
      fill: style.panelFill,
      stroke: style.panelStroke,
      strokeWidth: compact ? 1 : 1.5,
      listening: false
    })
  );
  const labelY = micro ? h * 0.2 : compact ? h * 0.22 : h * 0.18;
  const valueY = micro ? h * 0.58 : compact ? h * 0.52 : h * 0.48;
  const unitY = compact ? h * 0.78 : h * 0.68;
  if (!micro) {
    const labelSize = fluidFont(9, bounds, 6, 10);
    group.add(
      app.text({
        text: labelText,
        x: fitTextX(labelText, labelSize, w),
        y: textYForBaseline(labelY, labelSize, "middle"),
        fontSize: labelSize,
        fontWeight: "600",
        fill: style.labelColor,
        textAlign: "left",
        listening: false
      })
    );
  }
  let displayVal = format(opts.value);
  const valueMax = fluidFont(compact ? 20 : 28, bounds, micro ? 8 : 12, 36);
  if (compact && opts.unit) {
    displayVal = formatCompactDigitalValue(opts.value, opts.unit, format, w, valueMax);
  }
  const fitted = fitFontSizeToWidth(displayVal, w, valueMax, micro ? 7 : 9);
  const valueText = app.text({
    text: displayVal,
    x: fitted.x,
    y: textYForBaseline(valueY, fitted.fontSize, "middle"),
    fontSize: fitted.fontSize,
    fontWeight: "bold",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
    fill: style.valueColor,
    textAlign: "left",
    listening: false
  });
  group.add(valueText);
  if (opts.unit && !compact) {
    const unitSize = fluidFont(10, bounds, 7, 12);
    group.add(
      app.text({
        text: opts.unit,
        x: fitTextX(opts.unit, unitSize, w),
        y: textYForBaseline(unitY, unitSize, "middle"),
        fontSize: unitSize,
        fontWeight: "600",
        fill: style.unitColor,
        textAlign: "left",
        listening: false
      })
    );
  }
  let barFill;
  if (opts.showBar !== false && !compact) {
    const barH = Math.max(4, Math.round(h * 0.06));
    const barY = h - barH - Math.max(6, bounds.pad * 0.4);
    const barW = w - bounds.pad;
    const barX = bounds.pad * 0.5;
    group.add(
      app.roundedRect({
        x: barX,
        y: barY,
        width: barW,
        height: barH,
        fill: style.barTrack,
        cornerRadius: barH / 2,
        listening: false
      })
    );
    barFill = app.roundedRect({
      x: barX,
      y: barY,
      width: barW * pct,
      height: barH,
      fill: style.barFill,
      cornerRadius: barH / 2,
      listening: false
    });
    group.add(barFill);
  }
  const segments = [];
  if (opts.showSegments && !compact) {
    const count = opts.segmentCount ?? 12;
    const segW = Math.max(3, (w - bounds.pad * 2 - (count - 1) * 2) / count);
    const segH = Math.max(4, h * 0.05);
    const segY = h - segH - Math.max(8, bounds.pad * 0.5);
    const lit = Math.round(pct * count);
    for (let i = 0; i < count; i++) {
      const seg = app.roundedRect({
        x: bounds.pad * 0.5 + i * (segW + 2),
        y: segY,
        width: segW,
        height: segH,
        fill: i < lit ? style.segmentOn : style.segmentOff,
        cornerRadius: 1,
        listening: false
      });
      segments.push(seg);
      group.add(seg);
    }
  }
  return { valueText, barFill, segments, segmentOn: style.segmentOn, segmentOff: style.segmentOff };
}
function updateDigitalGauge(parts, value, max, format, barWidth, segmentCount) {
  const pct = Math.min(1, Math.max(0, value / Math.max(max, 1)));
  parts.valueText.text = format(value);
  if (parts.barFill) {
    parts.barFill.width = barWidth * pct;
  }
  if (parts.segments && segmentCount) {
    const lit = Math.round(pct * segmentCount);
    parts.segments.forEach((seg, i) => {
      seg.fill = i < lit ? parts.segmentOn : parts.segmentOff;
    });
  }
}

// src/automotive/primitives/builders.ts
var DIAL_LABELS = {
  speedometer: "Speed",
  tachometer: "RPM",
  turboBoostGauge: "Boost",
  torqueMeter: "Torque",
  horsepowerMeter: "HP",
  engineLoad: "Load",
  throttlePosition: "Throttle",
  brakePressure: "Brake",
  steeringAngle: "Steer",
  yawRate: "Yaw",
  altimeter: "Alt",
  oilPressure: "Oil",
  powerMeter: "kW",
  gForceMeter: "G",
  engineTemp: "Temp",
  engineTemperature: "Engine",
  coolantTemperature: "Coolant",
  oilTemperature: "Oil"
};
function dialLabel(type) {
  if (DIAL_LABELS[type])
    return DIAL_LABELS[type];
  const words = type.replace(/([A-Z])/g, " $1").trim().split(/\s+/);
  if (words.length <= 2)
    return words.join(" ");
  return words.map((w) => w[0]?.toUpperCase() ?? "").join("");
}
function formatValue(v, format, unit = "") {
  switch (format) {
    case "rpm":
      return `${Math.round(v / 1e3)}k`;
    case "percent":
      return `${Math.round(v)}%`;
    case "deg":
      return `${Math.round(v)}\xB0`;
    case "volt":
      return `${v.toFixed(1)}V`;
    case "psi":
      return `${Math.round(v)} PSI`;
    case "text":
      return String(v);
    default:
      return unit ? `${Math.round(v)}${unit}` : String(Math.round(v));
  }
}
function buildDialWidget(app, type, autoPart, props, options) {
  const theme = getTheme(str3(props, "theme", "classic"));
  const bounds = resolveBounds(props, 160, 160);
  const value = num3(props, "value", 0);
  const max = num3(props, "max", options.max);
  const fmt = (v) => formatValue(v, options.format);
  let display = resolveDisplay(props, "analog");
  if (display === "analog" && isCompactBounds(bounds))
    display = "digital";
  if (display === "digital") {
    const group2 = createAutoGroup(
      app,
      type,
      { ...props, width: bounds.width, height: bounds.height, display: "digital" },
      autoPart
    );
    const style = digitalGaugeStyle(theme);
    const digitalFmt = options.format === "rpm" ? (v) => String(Math.round(v)) : (v) => String(Math.round(v));
    const digitalUnit = options.format === "rpm" ? "RPM" : options.unit;
    const parts2 = buildDigitalGauge(app, group2, bounds, style, {
      label: dialLabel(autoPart),
      value,
      max,
      unit: digitalUnit,
      formatValue: digitalFmt,
      showBar: !isCompactBounds(bounds),
      showSegments: !isCompactBounds(bounds) && (autoPart === "tachometer" || options.format === "rpm"),
      segmentCount: 10
    });
    const barW = bounds.innerWidth - bounds.pad;
    setParts3(group2, { valueText: parts2.valueText });
    group2.metadata._digitalParts = parts2;
    setRefresh2(group2, (v) => {
      updateDigitalGauge(parts2, v, max, digitalFmt, barW, parts2.segments?.length);
    });
    setState3(group2, { width: bounds.width, height: bounds.height, value, max, display: "digital" });
    return group2;
  }
  const maxFit = Math.min(bounds.innerWidth, bounds.innerHeight) - 6;
  const size = Math.min(bounds.dialSize, maxFit);
  const needleColor = str3(props, "needleColor", options.needleColor ?? theme.accent);
  const group = createAutoGroup(
    app,
    type,
    { ...props, width: bounds.width, height: bounds.height, size, display: "analog" },
    autoPart
  );
  const cx = size / 2;
  const inset = Math.max(4, Math.min(12, size * 0.1));
  const r = size / 2 - inset;
  const origin = centerInBounds(bounds, size, size);
  const inner = app.group({ x: origin.x, y: origin.y, listening: false });
  group.add(inner);
  const parts = buildDialGauge(
    app,
    inner,
    {
      trackColor: theme.dialStroke,
      needleColor,
      accentColor: needleColor,
      textColor: theme.text,
      textMuted: theme.textMuted,
      faceColor: "#0a0a0a",
      bezelColor: theme.dialStroke,
      redlineColor: theme.warning,
      tickColor: theme.textMuted,
      tickLabelColor: theme.textMuted
    },
    {
      size,
      value,
      max,
      title: dialLabel(autoPart),
      formatValue: fmt,
      formatTickLabel: options.format === "rpm" ? (v) => String(Math.round(v / 1e3)) : options.format === "percent" ? (v) => String(Math.round(v)) : (v) => String(Math.round(v)),
      unit: options.unit,
      tickCount: options.tickCount ?? (size < 100 ? 5 : 10),
      showTickLabels: size >= 96,
      redlineFrom: options.redlineFrom
    }
  );
  setParts3(group, { needle: parts.needle, label: parts.valueText, inner });
  setRefresh2(group, (v) => {
    updateDialNeedle(parts.needle, cx, v, max, r, void 0, void 0, void 0, parts.valueArc);
    parts.valueText.text = fmt(v);
  });
  setState3(group, { width: bounds.width, height: bounds.height, size, value, max, display: "analog" });
  return group;
}
function buildBarWidget(app, type, autoPart, props, options) {
  const theme = getTheme(str3(props, "theme", "classic"));
  const value = clamp4(num3(props, "value", 50), 0, 100);
  const bounds = resolveBounds(props, 120, 56);
  const group = createAutoGroup(app, type, { ...props, width: bounds.width, height: bounds.height }, autoPart);
  const w = bounds.innerWidth;
  const h = bounds.innerHeight;
  const titleSize = fluidFont(9, bounds, 7, 11);
  const valueSize = fluidFont(14, bounds, 11, 18);
  const trackH = Math.max(6, Math.round(h * 0.14));
  const trackY = h - trackH - Math.max(6, bounds.pad * 0.5);
  const trackW = w - bounds.pad;
  group.add(
    app.roundedRect({
      width: w,
      height: h,
      cornerRadius: Math.min(10, h * 0.15),
      fill: "#111827",
      stroke: theme.dialStroke,
      strokeWidth: 1,
      listening: false
    }),
    app.text({
      text: options.label.toUpperCase(),
      fontSize: titleSize,
      fontWeight: "600",
      fill: theme.textMuted,
      x: bounds.pad * 0.5,
      y: bounds.pad * 0.4,
      listening: false
    })
  );
  const track = app.roundedRect({
    x: bounds.pad * 0.5,
    y: trackY,
    width: trackW,
    height: trackH,
    fill: theme.lampOff,
    cornerRadius: trackH / 2,
    listening: false
  });
  const fill = app.roundedRect({
    x: bounds.pad * 0.5,
    y: trackY,
    width: trackW * value / 100,
    height: trackH,
    fill: options.warnBelow !== void 0 && value < options.warnBelow ? theme.warning : theme.ok,
    cornerRadius: trackH / 2,
    listening: false
  });
  const label = autoCenteredText(app, `${value}${options.unit ?? "%"}`, w, h * 0.4, {
    fontSize: valueSize,
    fontWeight: "bold",
    fill: theme.text
  });
  group.add(track, fill, label);
  setParts3(group, { fill, label, track });
  setRefresh2(group, (v) => {
    const lv = clamp4(v, 0, 100);
    fill.width = trackW * lv / 100;
    fill.fill = options.warnBelow !== void 0 && lv < options.warnBelow ? theme.warning : theme.ok;
    label.text = `${Math.round(lv)}${options.unit ?? "%"}`;
  });
  setState3(group, { value, width: bounds.width, height: bounds.height });
  return group;
}
function buildNumericWidget(app, type, autoPart, props, options) {
  const theme = getTheme(str3(props, "theme", "classic"));
  const value = num3(props, "value", 0);
  const text = str3(props, "text", "");
  const bounds = resolveBounds(props, options.width ?? 128, 60);
  const group = createAutoGroup(app, type, { ...props, width: bounds.width, height: bounds.height }, autoPart);
  const dec = options.decimals ?? (options.unit === "V" ? 1 : 0);
  const isLcd = resolveDisplay(props, "analog") === "digital" || ["digitalClock", "dateDisplay", "odometer", "tripMeter", "eta", "lapTimer", "accelerationTimer"].includes(
    type
  );
  if (isLcd) {
    const style = digitalGaugeStyle(theme);
    const displayText = text || `${value.toFixed(dec)}`;
    const parts = buildDigitalGauge(app, group, bounds, style, {
      label: options.title,
      value,
      max: Math.pow(10, Math.max(3, displayText.length)) - 1,
      unit: options.unit,
      formatValue: (v) => text ? text : `${v.toFixed(dec)}`,
      showBar: false,
      showSegments: false
    });
    if (text)
      parts.valueText.text = text;
    setParts3(group, { valueText: parts.valueText });
    setRefresh2(group, (v) => {
      parts.valueText.text = `${v.toFixed(dec)}${options.unit ?? ""}`;
    });
    group.metadata.textRefresh = (t) => {
      parts.valueText.text = t;
    };
    setState3(group, { value, text, width: bounds.width, height: bounds.height, display: "digital" });
    return group;
  }
  const w = bounds.innerWidth;
  const h = bounds.innerHeight;
  const titleSize = fluidFont(8, bounds, 7, 10);
  const valueSize = fluidFont(18, bounds, 13, 22);
  group.add(
    app.roundedRect({
      width: w,
      height: h,
      cornerRadius: Math.min(10, h * 0.14),
      fill: "#111827",
      stroke: theme.dialStroke,
      strokeWidth: 1,
      listening: false
    }),
    app.text({
      text: options.title.toUpperCase(),
      x: bounds.pad * 0.5,
      y: bounds.pad * 0.35,
      fontSize: titleSize,
      fontWeight: "bold",
      fill: theme.textMuted,
      listening: false
    })
  );
  const label = autoCenteredText(
    app,
    text || `${value.toFixed(dec)}${options.unit ?? ""}`,
    w,
    h * 0.58,
    { fontSize: valueSize, fontWeight: "bold", fill: theme.text }
  );
  group.add(label);
  setParts3(group, { label });
  setRefresh2(group, (v) => {
    label.text = `${v.toFixed(dec)}${options.unit ?? ""}`;
  });
  group.metadata.textRefresh = (t) => {
    label.text = t;
  };
  setState3(group, { value, text, width: bounds.width, height: bounds.height });
  return group;
}
function buildLampWidget(app, type, autoPart, props, symbol) {
  const active = bool3(props, "active", false);
  const theme = getTheme(str3(props, "theme", "classic"));
  const bounds = resolveBounds(props, 36, 36);
  const group = createAutoGroup(app, type, { ...props, width: bounds.width, height: bounds.height }, autoPart);
  const maxR = Math.min(bounds.innerWidth, bounds.innerHeight) / 2 - 3;
  const radius = Math.max(10, Math.min(maxR, 48));
  const fontSize = fluidFont(symbol.length > 3 ? 7 : 10, bounds, 6, 12);
  const center = centerInBounds(bounds, radius * 2, radius * 2);
  const symW = radius * 2;
  const lamp = app.circle({
    radius,
    x: center.x,
    y: center.y,
    fill: active ? theme.lampOn : theme.lampOff,
    stroke: active ? "#fde047" : "#555",
    strokeWidth: 1,
    shadow: active ? { color: "rgba(251,191,36,0.5)", blur: 8, offsetX: 0, offsetY: 0 } : void 0,
    listening: false
  });
  const sym = app.text({
    text: symbol,
    x: center.x + fitTextX(symbol, fontSize, symW),
    y: center.y + radius,
    fontSize,
    fill: active ? "#111" : "#666",
    textAlign: "left",
    textBaseline: "middle",
    listening: false
  });
  group.add(lamp, sym);
  setParts3(group, { lamp, sym });
  setBoolRefresh(group, (on) => {
    lamp.fill = on ? theme.lampOn : theme.lampOff;
    lamp.stroke = on ? "#fde047" : "#555";
    sym.fill = on ? "#111" : "#666";
  });
  setState3(group, { active, width: bounds.width, height: bounds.height });
  return group;
}
function buildBadgeWidget(app, type, autoPart, props, title) {
  const status = str3(props, "status", str3(props, "text", "OFF"));
  const active = bool3(props, "active", status.toLowerCase() === "on" || status.toLowerCase() === "active");
  const theme = getTheme(str3(props, "theme", "classic"));
  const bounds = resolveBounds(props, 168, 52);
  const group = createAutoGroup(app, type, { ...props, width: bounds.width, height: bounds.height }, autoPart);
  const w = bounds.innerWidth;
  const h = bounds.innerHeight;
  const badgeH = Math.max(22, Math.round(h * 0.36));
  const colors = {
    off: "#333",
    on: theme.ok,
    active: theme.ok,
    standby: theme.warning,
    fault: theme.warning,
    error: theme.warning,
    connected: theme.ok,
    disconnected: "#333"
  };
  const key = status.toLowerCase();
  const titleSize = fluidFont(9, bounds, 7, 10);
  const titleH = titleSize + 8;
  const stackH = titleH + 6 + badgeH;
  const stackY = bounds.pad + Math.max(0, (h - stackH) / 2);
  const badgeY = stackY + titleH + 4;
  group.add(
    app.roundedRect({
      width: w,
      height: h,
      cornerRadius: Math.min(8, h * 0.12),
      fill: "#111827",
      stroke: theme.dialStroke,
      strokeWidth: 1,
      listening: false
    })
  );
  const bg = app.roundedRect({
    width: w,
    height: badgeH,
    y: badgeY,
    cornerRadius: 4,
    fill: active ? theme.ok : colors[key] ?? "#333",
    listening: false
  });
  const label = autoCenteredText(app, status.toUpperCase(), w, badgeY + badgeH / 2, {
    fontSize: fluidFont(10, bounds, 8, 12),
    fontWeight: "bold",
    fill: "#fff"
  });
  const cap = autoCenteredText(app, title.length > 18 ? title.slice(0, 17) + "\u2026" : title, w, stackY + titleH / 2, {
    fontSize: titleSize,
    fill: theme.textMuted
  });
  group.add(cap, bg, label);
  setParts3(group, { bg, label });
  group.metadata.textRefresh = (t) => {
    label.text = t.toUpperCase();
    const k = t.toLowerCase();
    bg.fill = colors[k] ?? (t ? theme.ok : "#333");
  };
  group.metadata.boolRefresh = (on) => {
    bg.fill = on ? theme.ok : "#333";
    label.text = on ? "ON" : "OFF";
  };
  setState3(group, { status, active, width: bounds.width, height: bounds.height });
  return group;
}
function buildInfoPanel(app, type, autoPart, props, title, rows = []) {
  const theme = getTheme(str3(props, "theme", "classic"));
  const lines2 = props.lines ?? rows;
  const bounds = resolveBounds(props, 200, Math.max(72, lines2.length * 18 + 32));
  const group = createAutoGroup(app, type, { ...props, width: bounds.width, height: bounds.height }, autoPart);
  const w = bounds.innerWidth;
  const h = bounds.innerHeight;
  const titleSize = fluidFont(9, bounds, 7, 11);
  const rowSize = fluidFont(10, bounds, 7, 11);
  const titleH = titleSize + 8;
  const maxRows = Math.max(1, Math.floor((h - titleH - 4) / 11));
  const visibleLines = lines2.slice(0, maxRows);
  const rowH = Math.max(11, Math.floor((h - titleH - 4) / Math.max(visibleLines.length, 1)));
  group.add(
    app.roundedRect({
      width: w,
      height: h,
      cornerRadius: Math.min(10, h * 0.1),
      fill: "#111827",
      stroke: theme.dialStroke,
      strokeWidth: 1,
      listening: false
    }),
    app.text({
      text: title.toUpperCase(),
      x: bounds.pad * 0.5,
      y: bounds.pad * 0.4,
      fontSize: titleSize,
      fontWeight: "bold",
      fill: theme.textMuted,
      listening: false
    })
  );
  const rowNodes = [];
  visibleLines.forEach((line, i) => {
    const row = app.text({
      text: line.length > 22 ? line.slice(0, 21) + "\u2026" : line,
      x: bounds.pad * 0.5,
      y: titleH + i * rowH,
      fontSize: rowSize,
      fill: theme.text,
      listening: false
    });
    rowNodes.push(row);
    group.add(row);
  });
  group.metadata.linesRefresh = (next) => {
    next.forEach((line, i) => {
      if (rowNodes[i])
        rowNodes[i].text = line;
    });
  };
  setState3(group, { lines: lines2, width: bounds.width, height: bounds.height });
  return group;
}

// src/automotive/widgets/registerCatalog.ts
var registered = /* @__PURE__ */ new Set();
function registerCatalogWidget(def) {
  if (registered.has(def.type))
    return;
  registered.add(def.type);
  switch (def.kind) {
    case "dial":
      registerAutomotive(
        def.type,
        (props, app) => buildDialWidget(app, def.type, def.type, props, {
          max: num3(props, "max", def.max ?? 100),
          format: def.format ?? "int",
          unit: def.unit,
          tickCount: def.tickCount,
          redlineFrom: def.redlineFrom
        })
      );
      break;
    case "bar":
      registerAutomotive(
        def.type,
        (props, app) => buildBarWidget(app, def.type, def.type, props, {
          label: def.label,
          unit: def.unit,
          warnBelow: def.warnBelow
        })
      );
      break;
    case "numeric":
      registerAutomotive(
        def.type,
        (props, app) => buildNumericWidget(app, def.type, def.type, props, {
          title: def.title,
          unit: def.unit,
          decimals: def.decimals
        })
      );
      break;
    case "lamp":
      registerAutomotive(
        def.type,
        (props, app) => buildLampWidget(app, def.type, def.type, props, def.symbol)
      );
      break;
    case "badge":
      registerAutomotive(def.type, (props, app) => {
        const title = str3(props, "title", def.title);
        if (def.type === "cruiseControl" || def.type === "cruiseControlStatus") {
          return buildCruiseBadge(app, def.type, props);
        }
        return buildBadgeWidget(app, def.type, def.type, props, title);
      });
      break;
    case "panel":
      registerAutomotive(
        def.type,
        (props, app) => buildInfoPanel(app, def.type, def.type, props, def.title, def.rows)
      );
      break;
  }
}
function buildCruiseBadge(app, type, props) {
  const speed = num3(props, "speed", num3(props, "value", 0));
  return buildBadgeWidget(app, type, type, { ...props, status: speed > 0 ? `SET ${Math.round(speed)}` : "OFF" }, "Cruise");
}
function registerCatalogWidgets() {
  for (const def of ALL_CATALOG_WIDGETS) {
    registerCatalogWidget(def);
  }
}
registerCatalogWidgets();

// src/automotive/widgets/custom.ts
function themedDial(app, type, props, max, format, needleKey, options = {}) {
  const theme = getTheme(str3(props, "theme", "classic"));
  return buildDialWidget(app, type, type, { ...props, needleColor: props.needleColor ?? theme[needleKey] }, {
    max: num3(props, "max", max),
    format,
    unit: options.unit,
    tickCount: options.tickCount,
    redlineFrom: options.redlineFrom,
    needleColor: theme[needleKey]
  });
}
registerAutomotive("speedometer", (props, app) => {
  const theme = getTheme(str3(props, "theme", "classic"));
  return themedDial(app, "speedometer", { ...props, needleColor: props.needleColor ?? theme.needleSpeed }, 240, "int", "needleSpeed", {
    redlineFrom: 0.82,
    tickCount: 12,
    unit: " km/h"
  });
});
registerAutomotive("tachometer", (props, app) => {
  const theme = getTheme(str3(props, "theme", "classic"));
  return themedDial(app, "tachometer", { ...props, needleColor: props.needleColor ?? theme.needleTach }, 8e3, "rpm", "needleTach", {
    redlineFrom: 0.75,
    tickCount: 8
  });
});
registerAutomotive("engineTemp", (props, app) => {
  const theme = getTheme(str3(props, "theme", "classic"));
  const bounds = resolveBounds(props, 140, 140);
  const value = num3(props, "value", 90);
  const max = num3(props, "max", 130);
  const display = resolveDisplay(props, "analog");
  const useDigital = display === "digital" || isCompactBounds(bounds);
  if (useDigital) {
    const group2 = createAutoGroup(app, "engineTemp", { ...props, width: bounds.width, height: bounds.height, display: "digital" }, "engineTemp");
    const style = digitalGaugeStyle(theme);
    const parts2 = buildDigitalGauge(app, group2, bounds, style, {
      label: "Temp",
      value,
      max,
      unit: "\xB0C",
      formatValue: (v) => String(Math.round(v)),
      showBar: true,
      showSegments: false
    });
    const barW = bounds.innerWidth - bounds.pad;
    setParts3(group2, { valueText: parts2.valueText });
    group2.metadata._digitalParts = parts2;
    setRefresh2(group2, (v) => updateDigitalGauge(parts2, v, max, (x) => String(Math.round(x)), barW));
    setState3(group2, { width: bounds.width, height: bounds.height, value, max, display: "digital" });
    return group2;
  }
  const size = Math.min(bounds.dialSize, Math.min(bounds.innerWidth, bounds.innerHeight) - 6);
  const group = createAutoGroup(app, "engineTemp", { ...props, width: bounds.width, height: bounds.height, size, display: "analog" }, "engineTemp");
  const origin = centerInBounds(bounds, size, size);
  const inner = app.group({ x: origin.x, y: origin.y, listening: false });
  group.add(inner);
  const cx = size / 2;
  const inset = Math.max(4, Math.min(12, size * 0.1));
  const r = size / 2 - inset;
  const parts = buildDialGauge(
    app,
    inner,
    {
      trackColor: theme.dialStroke,
      needleColor: theme.text,
      accentColor: theme.ok,
      textColor: theme.text,
      textMuted: theme.textMuted,
      faceColor: "#0a0a0a",
      bezelColor: theme.dialStroke,
      tickColor: theme.textMuted
    },
    {
      size,
      value,
      max,
      title: "TEMP",
      unit: "\xB0C",
      formatValue: (v) => String(Math.round(v)),
      tickCount: size < 100 ? 5 : 8,
      showTickLabels: size >= 96,
      colorZones: [
        { from: 0, to: 0.4, color: "#3b82f6" },
        { from: 0.4, to: 0.75, color: theme.ok },
        { from: 0.75, to: 1, color: theme.warning }
      ]
    }
  );
  setParts3(group, { needle: parts.needle, label: parts.valueText, inner });
  setRefresh2(group, (v) => {
    updateDialNeedle(parts.needle, cx, v, max, r, void 0, void 0, void 0, parts.valueArc);
    parts.valueText.text = `${Math.round(v)}`;
  });
  setState3(group, { width: bounds.width, height: bounds.height, size, value, max, display: "analog" });
  return group;
});
function voltageFillLevel(value) {
  return clamp4((value - 11) / (14.2 - 11), 0, 1);
}
function buildAutomotiveCalendar(app, group, bounds, theme, props) {
  const year = num3(props, "year", (/* @__PURE__ */ new Date()).getFullYear());
  const month = num3(props, "month", (/* @__PURE__ */ new Date()).getMonth());
  const now2 = /* @__PURE__ */ new Date();
  const highlightDay = "highlightDay" in props ? num3(props, "highlightDay", -1) : year === now2.getFullYear() && month === now2.getMonth() ? now2.getDate() : -1;
  const lines2 = props.lines ?? ["No events"];
  const eventLine = str3(props, "event", lines2[0] ?? "No events");
  const pad = bounds.pad;
  const panelW = bounds.innerWidth;
  const panelH = bounds.innerHeight;
  const compact = panelH < 120 || panelW < 160;
  const showEvents = panelH >= 72;
  const eventH = showEvents ? Math.max(compact ? 12 : 16, Math.round(panelH * 0.13)) : 0;
  const headerH = Math.max(compact ? 11 : 14, Math.round(panelH * 0.1));
  const weekdayH = Math.max(compact ? 9 : 11, Math.round(panelH * 0.07));
  const gridTop = headerH + weekdayH + 2;
  const gridH = Math.max(24, panelH - gridTop - (showEvents ? eventH + 4 : 0));
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = first.getDay();
  const numRows = Math.ceil((startDay + daysInMonth) / 7);
  const cell = Math.max(compact ? 9 : 12, Math.min(Math.floor(panelW / 7), Math.floor(gridH / numRows)));
  const gridW = cell * 7;
  const gridX = pad + Math.max(0, (panelW - gridW) / 2);
  group.add(
    app.roundedRect({
      x: pad,
      y: pad,
      width: panelW,
      height: panelH,
      cornerRadius: Math.min(8, panelH * 0.08),
      fill: "#111827",
      stroke: theme.dialStroke,
      strokeWidth: compact ? 1 : 1.5,
      listening: false
    })
  );
  const monthLabel = first.toLocaleString("default", {
    month: compact ? "short" : "long",
    year: "numeric"
  });
  const headerSize = fluidFont(10, bounds, compact ? 7 : 8, 12);
  group.add(
    app.text({
      text: monthLabel,
      x: pad + fitTextX(monthLabel, headerSize, panelW),
      y: pad + textYForBaseline(headerH / 2, headerSize),
      fontSize: headerSize,
      fontWeight: "bold",
      fill: theme.text,
      textAlign: "left",
      listening: false
    })
  );
  const weekdaySize = fluidFont(8, bounds, compact ? 6 : 7, 9);
  const weekdays = compact ? ["S", "M", "T", "W", "T", "F", "S"] : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  weekdays.forEach((label, i) => {
    const cx = gridX + i * cell + cell / 2;
    group.add(
      app.text({
        text: label,
        x: cx,
        y: pad + headerH + textYForBaseline(weekdayH / 2, weekdaySize),
        fontSize: weekdaySize,
        fontWeight: "600",
        fill: theme.textMuted,
        textAlign: "center",
        metadata: { textBoxWidth: cell, textBoxCenterY: pad + headerH + weekdayH / 2 },
        listening: false
      })
    );
  });
  const daySize = Math.max(compact ? 7 : 8, Math.min(11, Math.floor(cell * 0.42)));
  for (let day = 1; day <= daysInMonth; day++) {
    const cellIdx = startDay + day - 1;
    const col = cellIdx % 7;
    const row = Math.floor(cellIdx / 7);
    const cellX = gridX + col * cell;
    const cellY = pad + gridTop + row * cell;
    const isToday = day === highlightDay;
    if (isToday) {
      group.add(
        app.roundedRect({
          x: cellX + Math.max(1, cell * 0.12),
          y: cellY + Math.max(1, cell * 0.1),
          width: Math.max(6, cell * 0.76),
          height: Math.max(6, cell * 0.8),
          cornerRadius: Math.max(2, cell * 0.18),
          fill: theme.accent,
          listening: false
        })
      );
    }
    group.add(
      app.text({
        text: String(day),
        x: cellX + cell / 2,
        y: cellY + textYForBaseline(cell / 2, daySize),
        fontSize: daySize,
        fontWeight: isToday ? "bold" : "500",
        fill: isToday ? "#fff" : theme.text,
        textAlign: "center",
        metadata: { textBoxWidth: cell, textBoxCenterY: cellY + cell / 2 },
        listening: false
      })
    );
  }
  if (showEvents) {
    const eventSize = fluidFont(9, bounds, compact ? 6 : 7, 10);
    const eventText = eventLine.length > 28 ? `${eventLine.slice(0, 27)}\u2026` : eventLine;
    const eventY = pad + panelH - eventH / 2;
    group.add(
      app.text({
        text: eventText,
        x: pad + fitTextX(eventText, eventSize, panelW),
        y: textYForBaseline(eventY, eventSize),
        fontSize: eventSize,
        fill: theme.textMuted,
        textAlign: "left",
        listening: false
      })
    );
  }
}
registerAutomotive("calendar", (props, app) => {
  const theme = getTheme(str3(props, "theme", "classic"));
  const bounds = resolveBounds(props, 200, 140);
  const group = createAutoGroup(app, "calendar", { ...props, width: bounds.width, height: bounds.height }, "calendar");
  buildAutomotiveCalendar(app, group, bounds, theme, props);
  const year = num3(props, "year", (/* @__PURE__ */ new Date()).getFullYear());
  const month = num3(props, "month", (/* @__PURE__ */ new Date()).getMonth());
  const lines2 = props.lines ?? ["No events"];
  group.metadata.linesRefresh = (next) => {
    setState3(group, { lines: next });
  };
  setState3(group, {
    year,
    month,
    highlightDay: num3(props, "highlightDay", -1),
    lines: lines2,
    width: bounds.width,
    height: bounds.height
  });
  return group;
});
function callerInitials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2)
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  return (name.slice(0, 2) || "?").toUpperCase();
}
registerAutomotive("callScreen", (props, app) => {
  const theme = getTheme(str3(props, "theme", "classic"));
  const lines2 = props.lines ?? ["Incoming\u2026", "Swipe to answer"];
  const caller = str3(props, "caller", str3(props, "name", "Alex Morgan"));
  const status = str3(props, "status", "incoming").toLowerCase();
  const subtitle = str3(props, "subtitle", str3(props, "phone", "Mobile"));
  const hint = str3(props, "hint", lines2[1] ?? "Swipe to answer");
  const bounds = resolveBounds(props, 220, 130);
  const group = createAutoGroup(app, "callScreen", { ...props, width: bounds.width, height: bounds.height }, "callScreen");
  const pad = bounds.pad;
  const panelW = bounds.innerWidth;
  const panelH = bounds.innerHeight;
  const compact = panelH < 88 || panelW < 140;
  const statusLabel = status === "active" ? "ON CALL" : status === "ended" ? "CALL ENDED" : "INCOMING CALL";
  group.add(
    app.roundedRect({
      x: pad,
      y: pad,
      width: panelW,
      height: panelH,
      cornerRadius: Math.min(10, panelH * 0.1),
      fill: "#111827",
      stroke: theme.dialStroke,
      strokeWidth: compact ? 1 : 1.5,
      listening: false
    })
  );
  const statusSize = fluidFont(8, bounds, 6, 9);
  group.add(
    app.text({
      text: statusLabel,
      x: pad + fitTextX(statusLabel, statusSize, panelW),
      y: pad + textYForBaseline(compact ? 10 : 12, statusSize),
      fontSize: statusSize,
      fontWeight: "bold",
      fill: theme.textMuted,
      textAlign: "left",
      listening: false
    })
  );
  const avatarSize = Math.max(compact ? 26 : 34, Math.min(panelH * 0.36, panelW * 0.2));
  const avatarX = pad + Math.max(4, panelW * 0.03);
  const avatarY = pad + (compact ? 16 : 20);
  group.add(
    app.circle({
      x: avatarX,
      y: avatarY,
      radius: avatarSize / 2,
      fill: theme.accent,
      opacity: 0.85,
      listening: false
    })
  );
  const initials = callerInitials(caller);
  const initialsSize = Math.max(compact ? 9 : 11, Math.floor(avatarSize * 0.3));
  group.add(
    autoCenteredText(app, initials, avatarSize, avatarSize / 2, {
      fontSize: initialsSize,
      fontWeight: "bold",
      fill: "#fff",
      insetX: avatarX,
      insetY: avatarY
    })
  );
  const textX0 = avatarX + avatarSize + Math.max(6, panelW * 0.03);
  const textW = Math.max(40, pad + panelW + pad - textX0 - 4);
  const callerMax = fluidFont(14, bounds, compact ? 10 : 11, 16);
  const callerFit = fitFontSizeToWidth(caller, textW, callerMax, 8);
  const nameY = avatarY + avatarSize * 0.22;
  const nameText = app.text({
    text: caller,
    x: textX0 + callerFit.x,
    y: textYForBaseline(nameY, callerFit.fontSize),
    fontSize: callerFit.fontSize,
    fontWeight: "bold",
    fill: theme.text,
    textAlign: "left",
    listening: false
  });
  const subSize = fluidFont(9, bounds, 7, 10);
  const subText = app.text({
    text: subtitle,
    x: textX0 + fitTextX(subtitle, subSize, textW),
    y: textYForBaseline(nameY + callerFit.fontSize * 0.95, subSize),
    fontSize: subSize,
    fill: theme.textMuted,
    textAlign: "left",
    listening: false
  });
  group.add(nameText, subText);
  const btnH = Math.max(compact ? 18 : 22, Math.min(28, panelH * 0.16));
  const btnGap = Math.max(6, panelW * 0.04);
  const btnW = Math.max(compact ? 44 : 56, (panelW - btnGap) / 2);
  const btnY = pad + panelH - btnH - (compact ? 8 : 10);
  const declineX = pad + Math.max(0, (panelW - btnW * 2 - btnGap) / 2);
  const answerX = declineX + btnW + btnGap;
  group.add(
    app.roundedRect({
      x: declineX,
      y: btnY,
      width: btnW,
      height: btnH,
      cornerRadius: Math.min(8, btnH / 2),
      fill: theme.warning,
      listening: false
    }),
    app.roundedRect({
      x: answerX,
      y: btnY,
      width: btnW,
      height: btnH,
      cornerRadius: Math.min(8, btnH / 2),
      fill: theme.ok,
      listening: false
    })
  );
  const btnLabel = compact ? { decline: "End", answer: "Ans" } : { decline: "Decline", answer: "Answer" };
  const btnFont = fluidFont(9, bounds, compact ? 7 : 8, 10);
  group.add(
    autoCenteredText(app, btnLabel.decline, btnW, btnH / 2, {
      fontSize: btnFont,
      fontWeight: "bold",
      fill: "#fff",
      insetX: declineX,
      insetY: btnY
    }),
    autoCenteredText(app, btnLabel.answer, btnW, btnH / 2, {
      fontSize: btnFont,
      fontWeight: "bold",
      fill: "#fff",
      insetX: answerX,
      insetY: btnY
    })
  );
  const hintSize = fluidFont(8, bounds, 6, 9);
  const hintText = hint.length > 24 ? `${hint.slice(0, 23)}\u2026` : hint;
  const hintY = Math.max(avatarY + avatarSize + 4, btnY - hintSize - (compact ? 4 : 6));
  const hintNode = app.text({
    text: hintText,
    x: pad + fitTextX(hintText, hintSize, panelW),
    y: textYForBaseline(hintY, hintSize),
    fontSize: hintSize,
    fill: theme.textMuted,
    textAlign: "left",
    listening: false
  });
  group.add(hintNode);
  setParts3(group, { nameText, subText, hintNode });
  group.metadata.linesRefresh = (next) => {
    if (next[0])
      subText.text = next[0];
    if (next[1]) {
      const nextHint = next[1].length > 24 ? `${next[1].slice(0, 23)}\u2026` : next[1];
      hintNode.text = nextHint;
    }
  };
  group.metadata.refresh = (nextCaller, nextStatus) => {
    const fit = fitFontSizeToWidth(nextCaller, textW, callerMax, 8);
    nameText.text = nextCaller;
    nameText.fontSize = fit.fontSize;
    nameText.x = textX0 + fit.x;
    if (nextStatus)
      setState3(group, { status: nextStatus });
  };
  setState3(group, { caller, status, subtitle, hint, lines: lines2, width: bounds.width, height: bounds.height });
  return group;
});
registerAutomotive("batteryVoltage", (props, app) => {
  const value = num3(props, "value", 12.4);
  const lowThreshold = num3(props, "lowThreshold", 11.5);
  const theme = getTheme(str3(props, "theme", "classic"));
  const bounds = resolveBounds(props, 100, 36);
  const group = createAutoGroup(app, "batteryVoltage", { ...props, width: bounds.width, height: bounds.height }, "batteryVoltage");
  const pad = bounds.pad;
  const panelW = bounds.innerWidth;
  const panelH = bounds.innerHeight;
  const compact = panelW < 56 || panelH < 22;
  const low = value < lowThreshold;
  const levelColor = low ? theme.warning : theme.ok;
  group.add(
    app.roundedRect({
      x: pad,
      y: pad,
      width: panelW,
      height: panelH,
      cornerRadius: Math.min(6, panelH * 0.2),
      fill: "#111827",
      stroke: theme.dialStroke,
      strokeWidth: compact ? 1 : 1.5,
      listening: false
    })
  );
  const bodyW = Math.max(compact ? 10 : 18, Math.min(panelW * 0.28, panelH * 0.65));
  const bodyH = Math.max(compact ? 7 : 11, Math.min(panelH * 0.5, bodyW * 0.48));
  const nubW = Math.max(2, bodyW * 0.12);
  const iconX = pad + Math.max(compact ? 3 : 6, panelW * 0.05);
  const iconY = pad + (panelH - bodyH) / 2;
  const inset = Math.max(1.5, bodyW * 0.1);
  const innerFillW = Math.max(0, bodyW - inset * 2);
  group.add(
    app.roundedRect({
      x: iconX,
      y: iconY,
      width: bodyW,
      height: bodyH,
      cornerRadius: Math.min(2, bodyH * 0.2),
      fill: null,
      stroke: theme.textMuted,
      strokeWidth: compact ? 1 : 1.5,
      listening: false
    })
  );
  const fill = app.roundedRect({
    x: iconX + inset,
    y: iconY + inset,
    width: innerFillW * voltageFillLevel(value),
    height: bodyH - inset * 2,
    cornerRadius: 1,
    fill: levelColor,
    listening: false
  });
  group.add(
    fill,
    app.rect({
      x: iconX + bodyW,
      y: iconY + bodyH * 0.22,
      width: nubW,
      height: bodyH * 0.56,
      fill: theme.textMuted,
      listening: false
    })
  );
  const textGap = Math.max(3, panelW * 0.04);
  const textX0 = iconX + bodyW + nubW + textGap;
  const textW = Math.max(18, pad + panelW + pad - textX0 - (compact ? 2 : 4));
  const val = `${value.toFixed(1)}V`;
  const maxFs = fluidFont(14, bounds, compact ? 8 : 10, 16);
  const fitted = fitFontSizeToWidth(val, textW, maxFs, compact ? 7 : 8);
  const label = app.text({
    text: val,
    x: textX0 + fitted.x,
    y: pad + textYForBaseline(panelH / 2, fitted.fontSize),
    fontSize: fitted.fontSize,
    fontWeight: "bold",
    fill: levelColor,
    textAlign: "left",
    listening: false
  });
  group.add(label);
  setParts3(group, { label, fill });
  setRefresh2(group, (v) => {
    const isLow = v < lowThreshold;
    const color = isLow ? theme.warning : theme.ok;
    const next = `${v.toFixed(1)}V`;
    const nextFit = fitFontSizeToWidth(next, textW, maxFs, compact ? 7 : 8);
    label.text = next;
    label.fontSize = nextFit.fontSize;
    label.x = textX0 + nextFit.x;
    label.y = pad + textYForBaseline(panelH / 2, nextFit.fontSize);
    label.fill = color;
    fill.width = innerFillW * voltageFillLevel(v);
    fill.fill = color;
  });
  setState3(group, { value, lowThreshold, width: bounds.width, height: bounds.height });
  return group;
});
registerAutomotive("tpms", (props, app) => {
  const theme = getTheme(str3(props, "theme", "classic"));
  const pressures = props.pressures ?? [32, 32, 32, 32];
  const lowThreshold = num3(props, "lowThreshold", 25);
  const bounds = resolveBounds(props, 148, 92);
  const group = createAutoGroup(app, "tpms", { ...props, width: bounds.width, height: bounds.height }, "tpms");
  const panelW = bounds.innerWidth;
  const panelH = bounds.innerHeight;
  const compact = panelH < 48 || panelW < 88;
  const title = compact ? "TPMS" : "TIRE PRESSURE";
  const titleSize = fluidFont(compact ? 7 : 8, bounds, 6, 9);
  const titleH = Math.max(compact ? 10 : 12, Math.min(18, panelH * 0.2));
  const gap = compact ? 2 : 4;
  const rowLayout = compact && panelW >= panelH * 1.4;
  const cellW = rowLayout ? (panelW - gap * 5) / 4 : (panelW - gap * 3) / 2;
  const cellH = rowLayout ? Math.max(10, panelH - titleH - gap * 2) : Math.max(10, (panelH - titleH - gap * 3) / 2);
  const gridTop = titleH + gap;
  group.add(
    app.roundedRect({ width: panelW, height: panelH, cornerRadius: 8, fill: "#111827", stroke: theme.dialStroke, strokeWidth: 1.5, listening: false }),
    app.text({
      text: title,
      x: fitTextX(title, titleSize, panelW),
      y: compact ? 4 : 6,
      fontSize: titleSize,
      fontWeight: "bold",
      fill: theme.textMuted,
      listening: false
    })
  );
  const positions = rowLayout ? [
    { x: gap, y: gridTop, label: "FL" },
    { x: gap * 2 + cellW, y: gridTop, label: "FR" },
    { x: gap * 3 + cellW * 2, y: gridTop, label: "RL" },
    { x: gap * 4 + cellW * 3, y: gridTop, label: "RR" }
  ] : [
    { x: gap, y: gridTop, label: "FL" },
    { x: gap * 2 + cellW, y: gridTop, label: "FR" },
    { x: gap, y: gridTop + cellH + gap, label: "RL" },
    { x: gap * 2 + cellW, y: gridTop + cellH + gap, label: "RR" }
  ];
  const texts = [];
  positions.forEach((pos, i) => {
    const psi = pressures[i] ?? 32;
    const low = psi < lowThreshold;
    group.add(
      app.roundedRect({
        x: pos.x,
        y: pos.y,
        width: cellW,
        height: cellH,
        cornerRadius: 6,
        fill: low ? "#450a0a" : "#1f2937",
        stroke: low ? theme.warning : theme.dialStroke,
        strokeWidth: 1,
        listening: false
      }),
      app.text({ text: pos.label, x: pos.x + 4, y: pos.y + 3, fontSize: Math.max(7, cellH * 0.28), fontWeight: "bold", fill: theme.textMuted, listening: false })
    );
    const t = app.text({
      text: `${psi}`,
      x: pos.x + fitTextX(`${psi}`, Math.max(9, cellH * 0.38), cellW),
      y: pos.y + cellH * 0.62,
      fontSize: Math.max(9, cellH * 0.38),
      fontWeight: "bold",
      fill: low ? theme.warning : theme.text,
      textAlign: "left",
      textBaseline: "middle",
      listening: false
    });
    texts.push(t);
    group.add(t);
  });
  group.metadata.refresh = (next) => {
    next.forEach((psi, i) => {
      const low = psi < lowThreshold;
      if (texts[i]) {
        texts[i].text = `${psi}`;
        texts[i].fill = low ? theme.warning : theme.text;
      }
    });
  };
  setState3(group, { pressures, lowThreshold, width: bounds.width, height: bounds.height });
  return group;
});
registerAutomotive("fuelGauge", (props, app) => {
  const value = clamp4(num3(props, "value", 50), 0, 100);
  const theme = getTheme(str3(props, "theme", "classic"));
  const bounds = resolveBounds(props, 120, 56);
  const group = createAutoGroup(app, "fuelGauge", { ...props, width: bounds.width, height: bounds.height }, "fuelGauge");
  const w = bounds.innerWidth;
  const h = bounds.innerHeight;
  const trackH = Math.max(6, Math.round(h * 0.14));
  const trackY = h - trackH - 8;
  const trackW = w - 16;
  group.add(
    app.roundedRect({ width: w, height: h, cornerRadius: 8, fill: "#111827", stroke: theme.dialStroke, strokeWidth: 1, listening: false }),
    app.text({ text: "FUEL", fontSize: fluidFont(9, bounds, 7, 11), fontWeight: "600", fill: theme.textMuted, x: 8, y: 6, listening: false })
  );
  const fill = app.roundedRect({
    x: 8,
    y: trackY,
    width: trackW * value / 100,
    height: trackH,
    fill: value < 15 ? theme.warning : theme.ok,
    cornerRadius: trackH / 2,
    listening: false
  });
  const label = autoCenteredText(app, `${value}%`, w, h * 0.4, {
    fontSize: fluidFont(14, bounds, 10, 16),
    fontWeight: "bold",
    fill: theme.text
  });
  group.add(fill, label);
  setParts3(group, { fill, label });
  setRefresh2(group, (v) => {
    const lv = clamp4(v, 0, 100);
    fill.width = trackW * lv / 100;
    fill.fill = lv < 15 ? theme.warning : theme.ok;
    label.text = `${Math.round(lv)}%`;
  });
  setState3(group, { value, width: bounds.width, height: bounds.height });
  return group;
});
registerAutomotive("gearIndicator", (props, app) => {
  const gear = str3(props, "gear", "P");
  const theme = getTheme(str3(props, "theme", "classic"));
  const bounds = resolveBounds(props, 56, 60);
  const group = createAutoGroup(app, "gearIndicator", { ...props, width: bounds.width, height: bounds.height }, "gearIndicator");
  const w = bounds.innerWidth;
  const h = bounds.innerHeight;
  group.add(
    app.roundedRect({
      x: bounds.pad,
      y: bounds.pad,
      width: w,
      height: h,
      cornerRadius: 8,
      fill: "#111827",
      stroke: theme.dialStroke,
      strokeWidth: 2,
      listening: false
    })
  );
  const label = autoCenteredText(app, gear, w, h / 2, {
    fontSize: fluidFont(36, bounds, 18, 40),
    fontWeight: "bold",
    fill: theme.text,
    insetX: bounds.pad,
    insetY: bounds.pad
  });
  group.add(label);
  setParts3(group, { label });
  group.metadata.textRefresh = (t) => {
    label.text = t;
  };
  setState3(group, { gear, width: bounds.width, height: bounds.height });
  return group;
});
registerAutomotive("turnIndicators", (props, app) => {
  const left = bool3(props, "left", false);
  const right = bool3(props, "right", false);
  const theme = getTheme(str3(props, "theme", "classic"));
  const bounds = resolveBounds(props, 56, 28);
  const group = createAutoGroup(app, "turnIndicators", { ...props, width: bounds.width, height: bounds.height }, "turnIndicators");
  const pad = bounds.pad;
  const panelW = bounds.innerWidth;
  const panelH = bounds.innerHeight;
  const compact = panelH < 18 || panelW < 40;
  const innerPad = Math.max(compact ? 2 : 4, Math.round(Math.min(panelW, panelH) * 0.1));
  const availW = panelW - innerPad * 2;
  const gap = Math.max(compact ? 3 : 5, availW * 0.14);
  const arrowW = Math.max(compact ? 7 : 10, (availW - gap) / 2);
  const arrowH = Math.max(compact ? 5 : 8, Math.min(panelH - innerPad * 2, panelH * (compact ? 0.62 : 0.52)));
  const totalW = arrowW * 2 + gap;
  const startX = pad + innerPad + Math.max(0, (panelW - innerPad * 2 - totalW) / 2);
  const cy = pad + panelH / 2;
  const leftX = startX;
  const rightX = startX + arrowW + gap;
  const onColor = theme.lampOn;
  const offColor = theme.lampOff;
  const onStroke = "#fbbf24";
  const offStroke = theme.dialStroke;
  const arrowPoints = (x, flip) => flip ? [x, cy, x + arrowW, cy - arrowH / 2, x + arrowW, cy + arrowH / 2] : [x + arrowW, cy, x, cy - arrowH / 2, x, cy + arrowH / 2];
  const arrowStyle = (on) => ({
    fill: on ? onColor : offColor,
    stroke: on ? onStroke : offStroke,
    strokeWidth: 1,
    shadow: on ? { color: "rgba(251,191,36,0.4)", blur: compact ? 4 : 6, offsetX: 0, offsetY: 0 } : void 0,
    listening: false
  });
  group.add(
    app.roundedRect({
      x: pad,
      y: pad,
      width: panelW,
      height: panelH,
      cornerRadius: Math.min(6, panelH * 0.2),
      fill: "#111827",
      stroke: theme.dialStroke,
      strokeWidth: compact ? 1 : 1.5,
      listening: false
    })
  );
  const leftShape = app.polygon({ points: arrowPoints(leftX, false), ...arrowStyle(left) });
  const rightShape = app.polygon({ points: arrowPoints(rightX, true), ...arrowStyle(right) });
  group.add(leftShape, rightShape);
  const applyState = (l, r) => {
    leftShape.fill = l ? onColor : offColor;
    rightShape.fill = r ? onColor : offColor;
    leftShape.stroke = l ? onStroke : offStroke;
    rightShape.stroke = r ? onStroke : offStroke;
    leftShape.shadow = l ? { color: "rgba(251,191,36,0.4)", blur: compact ? 4 : 6, offsetX: 0, offsetY: 0 } : null;
    rightShape.shadow = r ? { color: "rgba(251,191,36,0.4)", blur: compact ? 4 : 6, offsetX: 0, offsetY: 0 } : null;
    leftShape.markDirty();
    rightShape.markDirty();
  };
  group.metadata.refresh = (l, r) => applyState(l, r);
  setParts3(group, { leftShape, rightShape });
  setState3(group, { left, right, width: bounds.width, height: bounds.height });
  return group;
});
registerAutomotive("parkingBrake", (props, app) => buildLampWidget(app, "parkingBrake", "parkingBrake", props, "P"));
registerAutomotive("headlights", (props, app) => buildLampWidget(app, "headlights", "headlights", props, "HL"));
registerAutomotive("cruiseControl", (props, app) => {
  const speed = num3(props, "speed", 0);
  const active = bool3(props, "active", speed > 0);
  const bounds = resolveBounds(props, 80, 32);
  const group = createAutoGroup(app, "cruiseControl", { ...props, width: bounds.width, height: bounds.height }, "cruiseControl");
  const w = bounds.innerWidth;
  const h = bounds.innerHeight;
  const bg = app.roundedRect({ width: w, height: h, cornerRadius: 4, fill: active ? "#1d4ed8" : "#333", listening: false });
  const label = autoCenteredText(app, active ? `SET ${Math.round(speed)}` : "CRUISE", w, h / 2, {
    fontSize: fluidFont(11, bounds, 8, 12),
    fontWeight: "bold",
    fill: "#fff"
  });
  group.add(bg, label);
  setParts3(group, { bg, label });
  setRefresh2(group, (v) => {
    const on = v > 0;
    bg.fill = on ? "#1d4ed8" : "#333";
    label.text = on ? `SET ${Math.round(v)}` : "CRUISE";
  });
  setState3(group, { speed, active, width: bounds.width, height: bounds.height });
  return group;
});
registerAutomotive("canViewer", (props, app) => {
  const signals = props.signals ?? { "engine.rpm": 2500, "vehicle.speed": 60 };
  const bounds = resolveBounds(props, 220, 88);
  const group = createAutoGroup(app, "canViewer", { ...props, width: bounds.width, height: bounds.height }, "canViewer");
  const entries = Object.entries(signals).slice(0, num3(props, "maxRows", 20));
  const rowH = Math.max(11, Math.floor(bounds.innerHeight / Math.max(entries.length, 1)));
  const maxRows = Math.max(1, Math.floor(bounds.innerHeight / rowH));
  const visible = entries.slice(0, maxRows);
  group.add(app.rect({ width: bounds.innerWidth, height: bounds.innerHeight, fill: "#111827", stroke: "#374151", strokeWidth: 1, listening: false }));
  const rows = [];
  visible.forEach(([key, val], i) => {
    const row = app.text({
      text: `${key}: ${val}`.slice(0, Math.max(8, Math.floor(bounds.innerWidth / 6))),
      x: 4,
      y: 2 + i * rowH,
      fontSize: Math.max(8, Math.min(10, rowH - 2)),
      fill: "#d1d5db",
      listening: false
    });
    rows.push(row);
    group.add(row);
  });
  group.metadata.refresh = (next) => {
    Object.entries(next).slice(0, rows.length).forEach(([key, val], i) => {
      if (rows[i])
        rows[i].text = `${key}: ${val}`;
    });
  };
  setState3(group, { signals, width: bounds.width, height: bounds.height });
  return group;
});
registerAutomotive("warningLamp", (props, app) => {
  const labelText = str3(props, "label", "!");
  const active = bool3(props, "active", false);
  const bounds = resolveBounds(props, 36, 36);
  const group = createAutoGroup(app, "warningLamp", { ...props, width: bounds.width, height: bounds.height }, "warningLamp");
  const radius = Math.min(bounds.innerWidth, bounds.innerHeight) / 2 - 3;
  const maxR = Math.max(12, Math.min(radius, 56));
  const center = centerInBounds(bounds, maxR * 2, maxR * 2);
  const symSize = fluidFont(10, bounds, 8, 12);
  group.add(
    app.circle({ radius: maxR, x: center.x, y: center.y, fill: active ? "#ef4444" : "#333", stroke: active ? "#fca5a5" : "#555", strokeWidth: 1, listening: false }),
    app.text({
      text: labelText,
      x: center.x + fitTextX(labelText, symSize, maxR * 2),
      y: center.y + maxR,
      fontSize: symSize,
      fill: active ? "#fff" : "#666",
      textAlign: "left",
      textBaseline: "middle",
      listening: false
    })
  );
  setState3(group, { label: labelText, active, width: bounds.width, height: bounds.height });
  return group;
});
registerAutomotive("adasStatus", (props, app) => {
  const status = str3(props, "status", "off");
  const colors = { off: "#333", standby: "#f59e0b", active: "#22c55e", fault: "#ef4444" };
  const bounds = resolveBounds(props, 96, 28);
  const group = createAutoGroup(app, "adasStatus", { ...props, width: bounds.width, height: bounds.height }, "adasStatus");
  const w = bounds.innerWidth;
  const h = bounds.innerHeight;
  const compact = w < 56;
  const label = compact ? `ADAS ${status === "off" ? "\u2014" : status[0]?.toUpperCase() ?? "?"}` : `ADAS ${status.toUpperCase()}`;
  group.add(
    app.rect({ width: w, height: h, fill: colors[status] ?? "#333", cornerRadius: 4, listening: false }),
    autoCenteredText(app, label, w, h / 2, {
      fontSize: fluidFont(10, bounds, 7, 11),
      fill: "#fff"
    })
  );
  group.metadata.textRefresh = (t) => {
    const bg = group.children[0];
    if (bg)
      bg.fill = colors[t.toLowerCase()] ?? "#333";
  };
  setState3(group, { status, width: bounds.width, height: bounds.height });
  return group;
});
function buildInstrumentCluster(props, app, type) {
  const theme = getTheme(str3(props, "theme", "classic"));
  const w = num3(props, "width", 800);
  const h = num3(props, "height", 400);
  const incomingCall = bool3(props, "incomingCall", false) || bool3(props, "showCall", false);
  const group = createAutoGroup(app, type, props, type, { width: w, height: h });
  group.add(
    app.rect({
      width: w,
      height: h,
      fill: theme.background,
      cornerRadius: Math.min(16, h * 0.04),
      stroke: theme.dialStroke,
      strokeWidth: 2,
      listening: false
    })
  );
  const themeName = str3(props, "theme", "classic");
  const isDigital = themeName === "digital";
  const gaugeDisplay = isDigital ? "digital" : "analog";
  const valueByType = {
    speedometer: { value: props.speed ?? 0, display: gaugeDisplay },
    tachometer: { value: props.rpm ?? 0, display: gaugeDisplay },
    gearIndicator: { gear: props.gear ?? "P" },
    engineTemp: { value: props.engineTemp ?? 90, display: gaugeDisplay },
    turnIndicators: { left: props.turnLeft ?? false, right: props.turnRight ?? false },
    fuelGauge: { value: props.fuel ?? 75 },
    batteryVoltage: { value: props.batteryVoltage ?? 12.4 },
    tpms: { pressures: props.tpms ?? [32, 32, 32, 32] },
    parkingBrake: { active: props.parkingBrake ?? false },
    headlights: { active: props.headlights ?? false },
    cruiseControl: { speed: props.cruiseSpeed ?? 0 },
    warningLamp: { label: "ABS", active: props.absWarning ?? false },
    adasStatus: { status: props.adasStatus ?? "off" },
    callScreen: {
      caller: str3(props, "caller", "Alex Morgan"),
      subtitle: str3(props, "subtitle", str3(props, "phone", "Mobile")),
      status: str3(props, "callStatus", str3(props, "status", "incoming")),
      hint: str3(props, "callHint", str3(props, "hint", "Swipe to answer")),
      lines: props.lines ?? ["Incoming\u2026", "Swipe to answer"]
    }
  };
  for (const slot of resolveClusterLayout(w, h, { callScreen: incomingCall })) {
    const { type: wt, size, width: slotW, height: slotH, x: slotX, y: slotY } = slot;
    const slotDigital = gaugeDisplay === "digital" || slotW < 128 || slotH < 80 || size !== void 0 && size < 96;
    const node = createAutomotiveFromJSON(
      wt,
      {
        x: 0,
        y: 0,
        width: slotW,
        height: slotH,
        ...size !== void 0 ? { size: Math.min(size, Math.min(slotW, slotH) - 4) } : {},
        ...valueByType[wt],
        theme: themeName,
        display: wt === "speedometer" || wt === "tachometer" || wt === "engineTemp" ? slotDigital ? "digital" : gaugeDisplay : void 0
      },
      app
    );
    if (node) {
      const slotWrap = app.group({
        x: slotX,
        y: slotY,
        clip: true,
        metadata: {
          autoSlot: wt,
          autoState: { width: slotW, height: slotH },
          autoWidth: slotW,
          autoHeight: slotH
        }
      });
      slotWrap.add(node);
      group.add(slotWrap);
    }
  }
  setState3(group, { width: w, height: h, theme: themeName, ...props });
  return group;
}
registerAutomotive("instrumentCluster", (props, app) => buildInstrumentCluster(props, app, "instrumentCluster"));
registerAutomotive(
  "digitalInstrumentCluster",
  (props, app) => buildInstrumentCluster({ ...props, theme: props.theme ?? "digital" }, app, "digitalInstrumentCluster")
);

// src/automotive/widgets/panelPrimitives.ts
function panelTheme(props) {
  return getTheme(str3(props, "theme", "classic"));
}
function panelBounds(props, dw = 220, dh = 130) {
  return resolveBounds(props, dw, dh);
}
function panelGroup(app, type, props, bounds) {
  return createAutoGroup(app, type, { ...props, width: bounds.width, height: bounds.height }, type);
}
function addPanelFrame(group, app, bounds, theme, compact = false) {
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  group.add(
    app.roundedRect({
      x: pad,
      y: pad,
      width: w,
      height: h,
      cornerRadius: Math.min(10, h * 0.1),
      fill: "#111827",
      stroke: theme.dialStroke,
      strokeWidth: compact ? 1 : 1.5,
      listening: false
    })
  );
}
function textAt(anchorY, fontSize) {
  return textYForBaseline(anchorY, fontSize);
}
function addPanelTitle(group, app, bounds, theme, title) {
  const { pad } = bounds;
  const size = fluidFont(8, bounds, 6, 9);
  const ty = pad + (bounds.innerHeight < 72 ? 8 : 10);
  group.add(
    app.text({
      text: title.toUpperCase(),
      x: pad + 2,
      y: textAt(ty, size),
      fontSize: size,
      fontWeight: "bold",
      fill: theme.textMuted,
      textAlign: "left",
      listening: false
    })
  );
  return ty + size + 6;
}
function addProgressBar(group, app, x, y, w, h, progress, theme) {
  const p = Math.max(0, Math.min(1, progress));
  group.add(
    app.roundedRect({
      x,
      y,
      width: w,
      height: h,
      cornerRadius: h / 2,
      fill: "#1f2937",
      listening: false
    }),
    app.roundedRect({
      x,
      y,
      width: Math.max(h, w * p),
      height: h,
      cornerRadius: h / 2,
      fill: theme.accent,
      listening: false
    })
  );
}
function addIconTile(group, app, x, y, size, icon, active, theme, label) {
  group.add(
    app.roundedRect({
      x,
      y,
      width: size,
      height: size,
      cornerRadius: Math.min(8, size * 0.22),
      fill: active ? theme.accent : "#1f2937",
      stroke: active ? theme.accent : theme.dialStroke,
      strokeWidth: 1,
      listening: false
    })
  );
  const iconSize = Math.max(7, Math.floor(size * (label ? 0.28 : 0.36)));
  const iconY = label ? size * 0.32 : size * 0.5;
  group.add(
    autoCenteredText(app, icon, size, iconY, {
      fontSize: iconSize,
      fontWeight: "bold",
      fill: active ? "#fff" : theme.textMuted,
      insetX: x,
      insetY: y
    })
  );
  if (label) {
    const labelSize = Math.max(5, Math.floor(size * 0.16));
    group.add(
      autoCenteredText(app, label, size, size * 0.76, {
        fontSize: labelSize,
        fill: active ? "#dbeafe" : theme.textMuted,
        insetX: x,
        insetY: y
      })
    );
  }
}
function addSkipPrev(group, app, x, y, size, theme) {
  group.add(
    app.roundedRect({
      x,
      y,
      width: size,
      height: size,
      cornerRadius: Math.min(8, size * 0.22),
      fill: "#1f2937",
      stroke: theme.dialStroke,
      strokeWidth: 1,
      listening: false
    }),
    app.path({
      d: `M ${x + size * 0.28} ${y + size * 0.35} L ${x + size * 0.18} ${y + size * 0.5} L ${x + size * 0.28} ${y + size * 0.65}`,
      stroke: theme.text,
      strokeWidth: 1.5,
      lineCap: "round",
      lineJoin: "round",
      listening: false
    }),
    app.path({
      d: `M ${x + size * 0.42} ${y + size * 0.35} L ${x + size * 0.32} ${y + size * 0.5} L ${x + size * 0.42} ${y + size * 0.65}`,
      stroke: theme.text,
      strokeWidth: 1.5,
      lineCap: "round",
      lineJoin: "round",
      listening: false
    })
  );
}
function addSkipNext(group, app, x, y, size, theme) {
  group.add(
    app.roundedRect({
      x,
      y,
      width: size,
      height: size,
      cornerRadius: Math.min(8, size * 0.22),
      fill: "#1f2937",
      stroke: theme.dialStroke,
      strokeWidth: 1,
      listening: false
    }),
    app.path({
      d: `M ${x + size * 0.58} ${y + size * 0.35} L ${x + size * 0.68} ${y + size * 0.5} L ${x + size * 0.58} ${y + size * 0.65}`,
      stroke: theme.text,
      strokeWidth: 1.5,
      lineCap: "round",
      lineJoin: "round",
      listening: false
    }),
    app.path({
      d: `M ${x + size * 0.72} ${y + size * 0.35} L ${x + size * 0.82} ${y + size * 0.5} L ${x + size * 0.72} ${y + size * 0.65}`,
      stroke: theme.text,
      strokeWidth: 1.5,
      lineCap: "round",
      lineJoin: "round",
      listening: false
    })
  );
}
function addTransportRow(group, app, cx, y, w, h, theme, playing = true) {
  const btn = Math.max(22, Math.min(h - 2, w * 0.14));
  const gap = Math.max(10, w * 0.06);
  const playSize = Math.min(Math.max(btn, 28), h, w * 0.18);
  const left = cx - playSize / 2 - gap - btn;
  const btnY = y + (h - btn) / 2;
  const playX = cx - playSize / 2;
  const playY = y + (h - playSize) / 2;
  addSkipPrev(group, app, left, btnY, btn, theme);
  group.add(
    app.circle({
      x: playX,
      y: playY,
      radius: playSize / 2,
      fill: theme.accent,
      listening: false
    })
  );
  if (playing) {
    const barW = Math.max(2, playSize * 0.1);
    const barH = playSize * 0.28;
    const mid = playX + playSize / 2;
    const midY = playY + playSize / 2;
    group.add(
      app.roundedRect({
        x: mid - barW - 2,
        y: midY - barH / 2,
        width: barW,
        height: barH,
        cornerRadius: 1,
        fill: "#fff",
        listening: false
      }),
      app.roundedRect({
        x: mid + 2,
        y: midY - barH / 2,
        width: barW,
        height: barH,
        cornerRadius: 1,
        fill: "#fff",
        listening: false
      })
    );
  } else {
    group.add(
      app.path({
        d: `M ${playX + playSize * 0.38} ${playY + playSize * 0.3} L ${playX + playSize * 0.38} ${playY + playSize * 0.7} L ${playX + playSize * 0.68} ${playY + playSize * 0.5} Z`,
        fill: "#fff",
        listening: false
      })
    );
  }
  addSkipNext(group, app, cx + playSize / 2 + gap, btnY, btn, theme);
}
function addAlbumPlaceholder(group, app, x, y, size, accent = "#6366f1") {
  group.add(
    app.roundedRect({
      x,
      y,
      width: size,
      height: size,
      cornerRadius: Math.min(10, size * 0.1),
      fill: accent,
      stroke: "rgba(255,255,255,0.12)",
      strokeWidth: 1,
      listening: false
    })
  );
  const note = Math.max(10, size * 0.28);
  group.add(
    autoCenteredText(app, "\u266A", size, size / 2, {
      fontSize: note,
      fontWeight: "bold",
      fill: "rgba(255,255,255,0.9)",
      insetX: x,
      insetY: y
    })
  );
}
function addMediaArtAndMeta(group, app, bounds, theme, top, title, artist, accent) {
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  const art = Math.max(40, Math.min(w * 0.32, h * 0.48, 72));
  addAlbumPlaceholder(group, app, pad, top, art, accent);
  const tx = pad + art + 10;
  const tw = w - art - 14;
  const titleSize = fluidFont(12, bounds, 9, 14);
  const titleFit = fitFontSizeToWidth(title, tw, titleSize, 8);
  group.add(
    app.text({
      text: title,
      x: tx,
      y: textAt(top + 4, titleFit.fontSize),
      fontSize: titleFit.fontSize,
      fontWeight: "bold",
      fill: theme.text,
      textAlign: "left",
      listening: false
    })
  );
  const subSize = fluidFont(9, bounds, 7, 10);
  group.add(
    app.text({
      text: artist,
      x: tx,
      y: textAt(top + titleFit.fontSize + 8, subSize),
      fontSize: subSize,
      fill: theme.textMuted,
      textAlign: "left",
      listening: false
    })
  );
  return { artSize: art, bottom: top + art };
}
function addListRow(group, app, x, y, w, h, icon, text, meta, theme, accent = false) {
  group.add(
    app.roundedRect({
      x,
      y,
      width: w,
      height: h,
      cornerRadius: 6,
      fill: "#1a2332",
      listening: false
    })
  );
  const iconBox = Math.max(18, h - 8);
  addIconTile(group, app, x + 4, y + (h - iconBox) / 2, iconBox, icon, accent, theme);
  const textX = x + iconBox + 10;
  const textW = w - iconBox - (meta ? 30 : 14);
  const row = fitLabel(app, text, textX, y + h * 0.28, textW, 9, theme, accent);
  if (accent)
    row.fill = theme.warning;
  group.add(row);
  if (meta) {
    group.add(
      app.text({
        text: meta,
        x: x + w - 26,
        y: textAt(y + h * 0.62, 8),
        fontSize: 8,
        fill: theme.textMuted,
        textAlign: "left",
        listening: false
      })
    );
  }
}
function lonLatToTile(lon, lat, zoom) {
  const n = 2 ** zoom;
  const x = Math.floor((lon + 180) / 360 * n);
  const latRad = lat * Math.PI / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return { x, y };
}
function osmTileUrl(zoom, x, y) {
  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
}
function addOsmMapLayer(group, app, x, y, w, h, theme, options = {}) {
  const lat = options.lat ?? 51.505;
  const lon = options.lon ?? -0.09;
  const zoom = options.zoom ?? 14;
  group.add(
    app.roundedRect({
      x,
      y,
      width: w,
      height: h,
      cornerRadius: Math.min(8, h * 0.12),
      fill: "#16231b",
      stroke: theme.dialStroke,
      strokeWidth: 1,
      listening: false
    })
  );
  group.add(
    app.roundedRect({
      x: x + w * 0.06,
      y: y + h * 0.1,
      width: w * 0.24,
      height: h * 0.22,
      cornerRadius: 3,
      fill: "#1f3d2e",
      listening: false
    }),
    app.roundedRect({
      x: x + w * 0.66,
      y: y + h * 0.55,
      width: w * 0.26,
      height: h * 0.2,
      cornerRadius: 3,
      fill: "#1a3350",
      listening: false
    })
  );
  const roads = [
    { d: `M ${x + 6} ${y + h * 0.52} L ${x + w - 6} ${y + h * 0.46}`, w: 3, c: "#5c6b7a" },
    { d: `M ${x + w * 0.22} ${y + 6} L ${x + w * 0.3} ${y + h - 6}`, w: 2, c: "#4a5568" },
    { d: `M ${x + w * 0.64} ${y + 6} L ${x + w * 0.56} ${y + h - 6}`, w: 2, c: "#4a5568" },
    { d: `M ${x + 6} ${y + h * 0.26} L ${x + w - 6} ${y + h * 0.3}`, w: 1.5, c: "#3d4a57" }
  ];
  for (const r of roads) {
    group.add(
      app.path({
        d: r.d,
        stroke: r.c,
        strokeWidth: r.w,
        lineCap: "round",
        listening: false
      })
    );
  }
  if (options.route !== false) {
    const routeD = `M ${x + w * 0.14} ${y + h * 0.76} Q ${x + w * 0.44} ${y + h * 0.34} ${x + w * 0.84} ${y + h * 0.2}`;
    group.add(
      app.path({
        d: routeD,
        stroke: "rgba(37,99,235,0.35)",
        strokeWidth: Math.max(5, w * 0.028),
        lineCap: "round",
        listening: false
      }),
      app.path({
        d: routeD,
        stroke: theme.accent,
        strokeWidth: Math.max(2.5, w * 0.014),
        lineCap: "round",
        listening: false
      })
    );
  }
  if (options.marker !== false) {
    const mx = x + w * 0.74;
    const my = y + h * 0.24;
    group.add(
      app.circle({
        x: mx - 5,
        y: my - 5,
        radius: 5,
        fill: theme.accent,
        stroke: "#fff",
        strokeWidth: 1.5,
        listening: false
      })
    );
  }
  if (options.useTile !== false && w >= 48 && h >= 36) {
    const tile = lonLatToTile(lon, lat, zoom);
    const img = app.image({
      x,
      y,
      width: w,
      height: h,
      src: osmTileUrl(zoom, tile.x, tile.y),
      opacity: 0.5,
      listening: false
    });
    group.add(img);
    img.load().then(() => app.requestRender()).catch(() => void 0);
  }
  group.add(
    app.text({
      text: "\xA9 OSM",
      x: x + w - 28,
      y: y + h - 11,
      fontSize: 7,
      fill: "rgba(255,255,255,0.5)",
      listening: false
    })
  );
}
function addCompassRose(group, app, cx, cy, radius, heading, theme) {
  group.add(
    app.circle({
      x: cx - radius,
      y: cy - radius,
      radius,
      fill: "#0f172a",
      stroke: theme.dialStroke,
      strokeWidth: 1.5,
      listening: false
    })
  );
  for (let deg = 0; deg < 360; deg += 30) {
    const rad2 = (deg - 90) * Math.PI / 180;
    const inner = radius * (deg % 90 === 0 ? 0.78 : 0.86);
    const outer = radius * 0.94;
    const ix = Math.cos(rad2) * inner;
    const iy = Math.sin(rad2) * inner;
    const ox = Math.cos(rad2) * outer;
    const oy = Math.sin(rad2) * outer;
    group.add(
      app.line({
        x: cx + ix,
        y: cy + iy,
        x2: ox - ix,
        y2: oy - iy,
        stroke: "#334155",
        strokeWidth: deg % 90 === 0 ? 1.5 : 0.8,
        listening: false
      })
    );
  }
  const labels = [
    { t: "N", deg: 0, c: theme.warning },
    { t: "E", deg: 90, c: theme.textMuted },
    { t: "S", deg: 180, c: theme.textMuted },
    { t: "W", deg: 270, c: theme.textMuted }
  ];
  const labelSize = Math.max(7, radius * 0.2);
  for (const { t, deg, c } of labels) {
    const rad2 = (deg - 90) * Math.PI / 180;
    const lx = cx + Math.cos(rad2) * (radius * 0.68);
    const ly = cy + Math.sin(rad2) * (radius * 0.68);
    group.add(
      app.text({
        text: t,
        x: lx,
        y: textAt(ly, labelSize),
        fontSize: labelSize,
        fontWeight: t === "N" ? "bold" : "normal",
        fill: c,
        textAlign: "center",
        listening: false
      })
    );
  }
  const needleLen = radius * 0.58;
  const rad = (heading - 90) * Math.PI / 180;
  group.add(
    app.line({
      x: cx,
      y: cy,
      x2: Math.cos(rad) * needleLen,
      y2: Math.sin(rad) * needleLen,
      stroke: theme.accent,
      strokeWidth: Math.max(2.5, radius * 0.09),
      lineCap: "round",
      listening: false
    })
  );
  group.add(
    app.circle({
      x: cx - 3,
      y: cy - 3,
      radius: 3,
      fill: theme.text,
      listening: false
    })
  );
}
function finishPanel(group, props, bounds, extra = {}) {
  setState3(group, { ...props, ...extra, width: bounds.width, height: bounds.height });
  return group;
}
function fitLabel(app, text, x, y, maxW, maxSize, theme, bold = false) {
  const fit = fitFontSizeToWidth(text, maxW, maxSize, 7);
  return app.text({
    text,
    x: x + fit.x,
    y: textAt(y, fit.fontSize),
    fontSize: fit.fontSize,
    fontWeight: bold ? "bold" : "normal",
    fill: theme.text,
    textAlign: "left",
    listening: false
  });
}
function addTurnArrow(group, app, x, y, size, theme) {
  group.add(
    app.roundedRect({
      x,
      y,
      width: size,
      height: size,
      cornerRadius: 8,
      fill: theme.accent,
      listening: false
    }),
    app.path({
      d: `M ${x + size * 0.28} ${y + size * 0.32} L ${x + size * 0.62} ${y + size * 0.5} L ${x + size * 0.28} ${y + size * 0.68} M ${x + size * 0.62} ${y + size * 0.5} L ${x + size * 0.62} ${y + size * 0.32} L ${x + size * 0.78} ${y + size * 0.5} L ${x + size * 0.62} ${y + size * 0.68}`,
      stroke: "#fff",
      strokeWidth: 2.2,
      lineCap: "round",
      lineJoin: "round",
      listening: false
    })
  );
}

// src/automotive/widgets/panels.ts
function lines(props, fallback) {
  return props.lines ?? fallback;
}
registerAutomotive("climateControl", (props, app) => {
  const theme = panelTheme(props);
  const bounds = panelBounds(props, 220, 130);
  const group = panelGroup(app, "climateControl", props, bounds);
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  const compact = h < 88 || w < 140;
  addPanelFrame(group, app, bounds, theme, compact);
  const contentY = addPanelTitle(group, app, bounds, theme, "Climate");
  const temp = str3(props, "temp", lines(props, ["Auto", "22\xB0C", "Fan 3"])[1] ?? "22\xB0C");
  const fan = num3(props, "fan", 3);
  const autoOn = str3(props, "mode", lines(props, ["Auto", "22\xB0C", "Fan 3"])[0] ?? "Auto").toLowerCase() === "auto";
  const tempSize = fluidFont(compact ? 20 : 26, bounds, 14, 30);
  const tempFit = fitFontSizeToWidth(temp, w * 0.38, tempSize, 12);
  group.add(
    app.text({
      text: temp,
      x: pad + 2,
      y: textAt(contentY + 4, tempFit.fontSize),
      fontSize: tempFit.fontSize,
      fontWeight: "bold",
      fill: theme.text,
      listening: false
    })
  );
  const iconSize = Math.max(compact ? 24 : 30, Math.min(w * 0.12, 34));
  const gap = 5;
  const iconsX = pad + Math.max(w * 0.38, w - (iconSize * 3 + gap * 2));
  const iconY = contentY + 2;
  addIconTile(group, app, iconsX, iconY, iconSize, "\u2744", true, theme);
  addIconTile(group, app, iconsX + iconSize + gap, iconY, iconSize, "\u2668", false, theme);
  addIconTile(group, app, iconsX + (iconSize + gap) * 2, iconY, iconSize, "A", autoOn, theme, autoOn ? "AUTO" : "");
  const fanBarY = iconY + iconSize + 10;
  const fanLabel = `Fan ${fan}`;
  group.add(
    app.text({
      text: fanLabel,
      x: pad + 2,
      y: textAt(fanBarY, 9),
      fontSize: fluidFont(9, bounds, 7, 10),
      fill: theme.textMuted,
      listening: false
    })
  );
  addProgressBar(group, app, pad, fanBarY + 12, w, compact ? 5 : 6, fan / 5, theme);
  return finishPanel(group, props, bounds, { temp, fan, mode: autoOn ? "auto" : "manual" });
});
registerAutomotive("quickSettingsPanel", (props, app) => {
  const theme = panelTheme(props);
  const bounds = panelBounds(props, 220, 120);
  const group = panelGroup(app, "quickSettingsPanel", props, bounds);
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  addPanelFrame(group, app, bounds, theme, true);
  const startY = addPanelTitle(group, app, bounds, theme, "Quick Settings");
  const items = props.items ?? [
    { icon: "Wi", label: "Wi-Fi", on: true },
    { icon: "BT", label: "BT", on: true },
    { icon: "AC", label: "HVAC", on: false },
    { icon: "\u2600", label: "Dim", on: true },
    { icon: "\u266A", label: "Vol", on: true },
    { icon: "\u238B", label: "Disp", on: false }
  ];
  const cols = 3;
  const rows = 2;
  const gap = 6;
  const availH = pad + h - startY;
  const tile = Math.min((w - gap * (cols - 1)) / cols, (availH - gap) / rows - 2);
  items.slice(0, 6).forEach((item, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    addIconTile(
      group,
      app,
      pad + col * (tile + gap),
      startY + row * (tile + gap),
      tile,
      item.icon,
      !!item.on,
      theme,
      tile >= 34 ? item.label : void 0
    );
  });
  return finishPanel(group, props, bounds, { items });
});
registerAutomotive("compass", (props, app) => {
  const theme = panelTheme(props);
  const bounds = panelBounds(props, 140, 140);
  const group = panelGroup(app, "compass", props, bounds);
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  addPanelFrame(group, app, bounds, theme);
  const heading = num3(props, "heading", num3(props, "value", 45));
  const radius = Math.max(22, Math.min(w, h) * 0.32);
  const cx = pad + w / 2;
  const cy = pad + h / 2 - 4;
  addCompassRose(group, app, cx, cy, radius, heading, theme);
  const label = `${["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(heading / 45) % 8]} ${String(Math.round(heading)).padStart(3, "0")}\xB0`;
  const labelSize = fluidFont(11, bounds, 8, 13);
  group.add(
    app.text({
      text: label,
      x: pad + w / 2,
      y: textAt(pad + h - 10, labelSize),
      fontSize: labelSize,
      fontWeight: "bold",
      fill: theme.text,
      textAlign: "center",
      listening: false
    })
  );
  group.metadata.refresh = (v) => setState3(group, { heading: v, value: v });
  return finishPanel(group, props, bounds, { heading, value: heading });
});
registerAutomotive("gpsNavigationMap", (props, app) => {
  const theme = panelTheme(props);
  const bounds = panelBounds(props, 240, 160);
  const group = panelGroup(app, "gpsNavigationMap", props, bounds);
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  addPanelFrame(group, app, bounds, theme);
  const contentY = addPanelTitle(group, app, bounds, theme, "Navigation");
  addOsmMapLayer(group, app, pad, contentY, w, h - (contentY - pad) - 4, theme, {
    lat: num3(props, "lat", 51.505),
    lon: num3(props, "lon", -0.09),
    zoom: num3(props, "zoom", 14),
    route: true,
    marker: true,
    useTile: bool3(props, "useOsmTiles", true)
  });
  return finishPanel(group, props, bounds);
});
registerAutomotive("navigationSearch", (props, app) => {
  const theme = panelTheme(props);
  const bounds = panelBounds(props, 220, 130);
  const group = panelGroup(app, "navigationSearch", props, bounds);
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  addPanelFrame(group, app, bounds, theme, true);
  const query = str3(props, "query", lines(props, ["Search\u2026"])[0] ?? "Search\u2026");
  const fieldH = Math.max(22, h * 0.15);
  const fieldY = pad + 10;
  group.add(
    app.roundedRect({
      x: pad,
      y: fieldY,
      width: w,
      height: fieldH,
      cornerRadius: fieldH / 2,
      fill: "#1f2937",
      stroke: theme.dialStroke,
      strokeWidth: 1,
      listening: false
    }),
    app.text({
      text: "\u2315",
      x: pad + 10,
      y: textAt(fieldY + fieldH / 2, 12),
      fontSize: 12,
      fill: theme.textMuted,
      listening: false
    })
  );
  group.add(fitLabel(app, query, pad + 28, fieldY + fieldH * 0.28, w - 36, fluidFont(10, bounds, 8, 11), theme));
  const mapY = fieldY + fieldH + 8;
  addOsmMapLayer(group, app, pad, mapY, w, pad + h - mapY - 4, theme, {
    lat: num3(props, "lat", 51.51),
    lon: num3(props, "lon", -0.12),
    zoom: 13,
    route: false,
    marker: false,
    useTile: bool3(props, "useOsmTiles", true)
  });
  return finishPanel(group, props, bounds, { query });
});
registerAutomotive("routeGuidance", (props, app) => {
  const theme = panelTheme(props);
  const bounds = panelBounds(props, 220, 130);
  const group = panelGroup(app, "routeGuidance", props, bounds);
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  const rowLines = lines(props, ["12.4 km", "18 min"]);
  const distance = str3(props, "distance", rowLines[0] ?? "12.4 km");
  const eta = str3(props, "eta", rowLines[1] ?? "18 min");
  const instruction = str3(props, "instruction", "Turn right onto Main St");
  addPanelFrame(group, app, bounds, theme);
  const mapH = Math.max(48, h * 0.4);
  addOsmMapLayer(group, app, pad, pad + 4, w, mapH, theme, {
    lat: num3(props, "lat", 51.505),
    lon: num3(props, "lon", -0.09),
    zoom: 15,
    route: true,
    marker: true,
    useTile: bool3(props, "useOsmTiles", true)
  });
  const infoY = pad + mapH + 12;
  const infoH = pad + h - infoY;
  const arrowSize = Math.min(infoH, w * 0.22);
  addTurnArrow(group, app, pad, infoY, arrowSize, theme);
  const textX = pad + arrowSize + 8;
  const textW = w - arrowSize - 12;
  group.add(
    fitLabel(app, instruction, textX, infoY + 4, textW, fluidFont(10, bounds, 8, 11), theme, true),
    app.text({
      text: `${distance} \xB7 ${eta}`,
      x: textX,
      y: textAt(infoY + infoH - 12, 9),
      fontSize: fluidFont(9, bounds, 7, 10),
      fill: theme.textMuted,
      listening: false
    })
  );
  return finishPanel(group, props, bounds, { distance, eta, instruction });
});
registerAutomotive("warningAlertPanel", (props, app) => {
  const theme = panelTheme(props);
  const bounds = panelBounds(props, 220, 120);
  const group = panelGroup(app, "warningAlertPanel", props, bounds);
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  const alerts = props.alerts ?? lines(props, ["No warnings"]);
  const hasAlert = alerts.length > 0 && alerts[0].toLowerCase() !== "no warnings";
  addPanelFrame(group, app, bounds, theme);
  const startY = addPanelTitle(group, app, bounds, theme, "Warnings");
  const rowH = Math.max(24, (pad + h - startY - 4) / Math.min(2, alerts.length));
  alerts.slice(0, 2).forEach((alert, i) => {
    addListRow(group, app, pad, startY + i * (rowH + 4), w, rowH, "\u26A0", alert, void 0, theme, hasAlert && i === 0);
  });
  return finishPanel(group, props, bounds, { alerts });
});
registerAutomotive("nowPlaying", (props, app) => {
  const theme = panelTheme(props);
  const bounds = panelBounds(props, 240, 130);
  const group = panelGroup(app, "nowPlaying", props, bounds);
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  const rowLines = lines(props, ["Song Title", "Artist"]);
  const title = str3(props, "title", rowLines[0] ?? "Song Title");
  const artist = str3(props, "artist", rowLines[1] ?? "Artist");
  const progress = num3(props, "progress", 0.42);
  addPanelFrame(group, app, bounds, theme);
  const top = addPanelTitle(group, app, bounds, theme, "Now Playing");
  addMediaArtAndMeta(group, app, bounds, theme, top, title, artist, "#7c3aed");
  const barY = pad + h - 44;
  addProgressBar(group, app, pad, barY, w, 5, progress, theme);
  addTransportRow(group, app, pad + w / 2, barY + 10, w, pad + h - barY - 12, theme);
  return finishPanel(group, props, bounds, { title, artist, progress });
});
registerAutomotive("mediaPlayer", (props, app) => {
  const theme = panelTheme(props);
  const bounds = panelBounds(props, 260, 168);
  const group = panelGroup(app, "mediaPlayer", props, bounds);
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  const rowLines = lines(props, ["Now playing", "Track \u2014 Artist"]);
  const title = str3(props, "title", rowLines[1]?.split("\u2014")[0]?.trim() ?? "Midnight Drive");
  const artist = str3(props, "artist", rowLines[1]?.split("\u2014")[1]?.trim() ?? "Neon Wave");
  const progress = num3(props, "progress", 0.36);
  addPanelFrame(group, app, bounds, theme);
  const top = addPanelTitle(group, app, bounds, theme, "Media");
  const { bottom } = addMediaArtAndMeta(group, app, bounds, theme, top, title, artist, "#db2777");
  const barY = bottom + 10;
  addProgressBar(group, app, pad, barY, w, 6, progress, theme);
  group.add(
    app.text({ text: "1:24", x: pad, y: textAt(barY - 8, 8), fontSize: 8, fill: theme.textMuted, listening: false }),
    app.text({ text: "3:42", x: pad + w - 24, y: textAt(barY - 8, 8), fontSize: 8, fill: theme.textMuted, listening: false })
  );
  addTransportRow(group, app, pad + w / 2, barY + 12, w, pad + h - barY - 14, theme);
  return finishPanel(group, props, bounds, { title, artist, progress });
});
registerAutomotive("musicControls", (props, app) => {
  const theme = panelTheme(props);
  const bounds = panelBounds(props, 180, 72);
  const group = panelGroup(app, "musicControls", props, bounds);
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  addPanelFrame(group, app, bounds, theme, true);
  addTransportRow(group, app, pad + w / 2, pad + 10, w, h - 20, theme, bool3(props, "playing", true));
  return finishPanel(group, props, bounds, { playing: bool3(props, "playing", true) });
});
registerAutomotive("albumArt", (props, app) => {
  const theme = panelTheme(props);
  const bounds = panelBounds(props, 180, 180);
  const group = panelGroup(app, "albumArt", props, bounds);
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  const rowLines = lines(props, ["[ Artwork ]"]);
  const album = str3(props, "album", rowLines[0] ?? "Night Roads");
  const artist = str3(props, "artist", "Neon Wave");
  addPanelFrame(group, app, bounds, theme);
  const art = Math.max(56, Math.min(w, h * 0.58));
  const artX = pad + (w - art) / 2;
  addAlbumPlaceholder(group, app, artX, pad + 8, art, "#4f46e5");
  const metaY = pad + 8 + art + 10;
  group.add(
    app.text({
      text: album,
      x: pad + w / 2,
      y: textAt(metaY, fluidFont(11, bounds, 9, 13)),
      fontSize: fluidFont(11, bounds, 9, 13),
      fontWeight: "bold",
      fill: theme.text,
      textAlign: "center",
      listening: false
    }),
    app.text({
      text: artist,
      x: pad + w / 2,
      y: textAt(metaY + 16, 9),
      fontSize: fluidFont(9, bounds, 7, 10),
      fill: theme.textMuted,
      textAlign: "center",
      listening: false
    })
  );
  return finishPanel(group, props, bounds, { album, artist });
});
registerAutomotive("fmRadio", (props, app) => {
  const theme = panelTheme(props);
  const bounds = panelBounds(props, 220, 120);
  const group = panelGroup(app, "fmRadio", props, bounds);
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  const station = str3(props, "station", lines(props, ["FM 98.5"])[0] ?? "FM 98.5");
  const band = str3(props, "band", station.startsWith("AM") ? "AM" : "FM");
  const freq = str3(props, "frequency", station.replace(/^(FM|AM)\s*/, "") || "98.5");
  const stationName = str3(props, "stationName", str3(props, "name", "Classic Hits"));
  const rds = str3(props, "rds", str3(props, "subtitle", "Neon Wave \u2014 Midnight Drive"));
  const stereo = bool3(props, "stereo", true);
  const presets = props.presets ?? ["88.1", "92.3", "98.5", "101.2"];
  const compact = h < 100;
  addPanelFrame(group, app, bounds, theme, compact);
  const top = addPanelTitle(group, app, bounds, theme, "Radio");
  if (stereo) {
    group.add(
      app.text({
        text: "ST",
        x: pad + w - 18,
        y: textAt(pad + 9, 7),
        fontSize: 7,
        fontWeight: "bold",
        fill: theme.ok,
        listening: false
      }),
      app.circle({
        x: pad + w - 24,
        y: pad + 9,
        radius: 2,
        fill: theme.ok,
        listening: false
      })
    );
  }
  const displayY = top + 2;
  const presetH = Math.max(compact ? 18 : 22, Math.min(28, (pad + h - top) * 0.18));
  const presetY = pad + h - presetH;
  const rdsBand = 12;
  const displayH = Math.max(compact ? 58 : 68, presetY - displayY - rdsBand - 6);
  group.add(
    app.roundedRect({
      x: pad,
      y: displayY,
      width: w,
      height: displayH,
      cornerRadius: 8,
      fill: "#0b1220",
      stroke: theme.dialStroke,
      strokeWidth: 1,
      listening: false
    })
  );
  const seek = Math.max(20, Math.min(26, displayH * 0.38));
  const seekY = displayY + (displayH - seek) / 2 - 4;
  const seekL = pad + 6;
  const seekR = pad + w - seek - 6;
  for (const [sx, path] of [
    [seekL, `M ${seekL + seek * 0.62} ${seekY + seek * 0.32} L ${seekL + seek * 0.28} ${seekY + seek / 2} L ${seekL + seek * 0.62} ${seekY + seek * 0.68}`],
    [seekR, `M ${seekR + seek * 0.38} ${seekY + seek * 0.32} L ${seekR + seek * 0.72} ${seekY + seek / 2} L ${seekR + seek * 0.38} ${seekY + seek * 0.68}`]
  ]) {
    group.add(
      app.roundedRect({
        x: sx,
        y: seekY,
        width: seek,
        height: seek,
        cornerRadius: 6,
        fill: "#1f2937",
        stroke: theme.dialStroke,
        strokeWidth: 1,
        listening: false
      }),
      app.path({
        d: path,
        stroke: theme.textMuted,
        strokeWidth: 1.8,
        lineCap: "round",
        lineJoin: "round",
        listening: false
      })
    );
  }
  const dialX = pad + w / 2;
  const freqSize = fluidFont(compact ? 22 : 28, bounds, 18, 32);
  const freqY = displayY + displayH * 0.24;
  group.add(
    app.text({
      text: freq,
      x: dialX,
      y: textAt(freqY, freqSize),
      fontSize: freqSize,
      fontWeight: "bold",
      fill: theme.text,
      textAlign: "center",
      listening: false
    }),
    app.text({
      text: band,
      x: pad + w - 20,
      y: textAt(displayY + 10, 8),
      fontSize: 8,
      fontWeight: "bold",
      fill: theme.accent,
      listening: false
    })
  );
  const nameSize = fluidFont(9, bounds, 7, 10);
  const nameFit = fitFontSizeToWidth(stationName, w - seek * 2 - 24, nameSize, 7);
  group.add(
    app.text({
      text: stationName,
      x: dialX,
      y: textAt(displayY + displayH * 0.54, nameFit.fontSize),
      fontSize: nameFit.fontSize,
      fontWeight: "bold",
      fill: theme.textMuted,
      textAlign: "center",
      listening: false
    })
  );
  const scaleY = displayY + displayH - 6;
  const scaleW = w - 24;
  const scaleX = pad + 12;
  group.add(
    app.line({
      x: scaleX,
      y: scaleY,
      x2: scaleW,
      y2: 0,
      stroke: "#334155",
      strokeWidth: 1,
      listening: false
    })
  );
  for (let i = 0; i <= 10; i++) {
    const tx = scaleX + scaleW * i / 10;
    const tall = i % 5 === 0;
    group.add(
      app.line({
        x: tx,
        y: scaleY,
        x2: 0,
        y2: tall ? -4 : -2,
        stroke: i === 6 ? theme.accent : "#475569",
        strokeWidth: tall ? 1.2 : 0.8,
        listening: false
      })
    );
  }
  const rdsSize = fluidFont(8, bounds, 6, 9);
  const rdsText = rds.length > 34 ? `${rds.slice(0, 33)}\u2026` : rds;
  group.add(
    app.text({
      text: rdsText,
      x: pad + 4,
      y: textAt(displayY + displayH + 8, rdsSize),
      fontSize: rdsSize,
      fill: theme.textMuted,
      listening: false
    })
  );
  const pGap = 4;
  const pW = (w - pGap * (presets.length - 1)) / presets.length;
  presets.forEach((p, i) => {
    const active = p === freq;
    const px = pad + i * (pW + pGap);
    group.add(
      app.roundedRect({
        x: px,
        y: presetY,
        width: pW,
        height: presetH,
        cornerRadius: 5,
        fill: active ? theme.accent : "#1f2937",
        stroke: active ? theme.accent : theme.dialStroke,
        strokeWidth: 1,
        listening: false
      }),
      app.text({
        text: p,
        x: px + pW / 2,
        y: textAt(presetY + presetH / 2, Math.max(8, Math.min(10, pW * 0.28))),
        fontSize: Math.max(8, Math.min(10, pW * 0.28)),
        fontWeight: active ? "bold" : "normal",
        fill: active ? "#fff" : theme.textMuted,
        textAlign: "center",
        listening: false
      })
    );
  });
  group.metadata.refresh = (nextFreq) => {
    setState3(group, { frequency: String(nextFreq) });
  };
  group.metadata.textRefresh = (name) => setState3(group, { stationName: name });
  return finishPanel(group, props, bounds, {
    station,
    band,
    frequency: freq,
    stationName,
    rds,
    stereo,
    presets
  });
});
registerAutomotive("podcastPlayer", (props, app) => {
  const theme = panelTheme(props);
  const bounds = panelBounds(props, 240, 130);
  const group = panelGroup(app, "podcastPlayer", props, bounds);
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  const episode = str3(props, "episode", lines(props, ["Episode 12"])[0] ?? "Episode 12");
  const show = str3(props, "show", "Tech Drive Podcast");
  const progress = num3(props, "progress", 0.58);
  addPanelFrame(group, app, bounds, theme);
  const top = addPanelTitle(group, app, bounds, theme, "Podcast");
  addMediaArtAndMeta(group, app, bounds, theme, top, show, episode, "#ea580c");
  group.add(
    app.text({
      text: "1.2\xD7",
      x: pad + w - 28,
      y: textAt(top + 4, 9),
      fontSize: 9,
      fontWeight: "bold",
      fill: theme.accent,
      listening: false
    })
  );
  const barY = pad + h - 44;
  addProgressBar(group, app, pad, barY, w, 5, progress, theme);
  addTransportRow(group, app, pad + w / 2, barY + 10, w, pad + h - barY - 12, theme);
  return finishPanel(group, props, bounds, { episode, show, progress });
});
registerAutomotive("notificationCenter", (props, app) => {
  const theme = panelTheme(props);
  const bounds = panelBounds(props, 220, 140);
  const group = panelGroup(app, "notificationCenter", props, bounds);
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  const items = props.notifications ?? [
    { icon: "\u26A0", text: "Tire pressure low \u2014 FL", time: "2m" },
    { icon: "\u266A", text: "Bluetooth connected", time: "8m" },
    { icon: "\u2601", text: "Weather alert nearby", time: "15m" }
  ];
  addPanelFrame(group, app, bounds, theme);
  const startY = addPanelTitle(group, app, bounds, theme, `Notifications (${items.length})`);
  const rowH = Math.max(28, (pad + h - startY - 4) / Math.min(3, items.length) - 4);
  items.slice(0, 3).forEach((item, i) => {
    addListRow(group, app, pad, startY + i * (rowH + 4), w, rowH, item.icon, item.text, item.time, theme, i === 0);
  });
  return finishPanel(group, props, bounds, { notifications: items });
});
registerAutomotive("rearViewCamera", (props, app) => {
  const theme = panelTheme(props);
  const bounds = panelBounds(props, 220, 140);
  const group = panelGroup(app, "rearViewCamera", props, bounds);
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  addPanelFrame(group, app, bounds, theme);
  const viewY = addPanelTitle(group, app, bounds, theme, "Rear Camera");
  const viewH = pad + h - viewY - 4;
  group.add(
    app.roundedRect({
      x: pad,
      y: viewY,
      width: w,
      height: viewH,
      cornerRadius: 8,
      fill: "#020617",
      stroke: theme.ok,
      strokeWidth: 1.5,
      listening: false
    })
  );
  const cx = pad + w / 2;
  const cy = viewY + viewH / 2 - 6;
  const camR = Math.max(18, Math.min(w, viewH) * 0.14);
  group.add(
    app.circle({
      x: cx - camR,
      y: cy - camR,
      radius: camR,
      fill: "#1e293b",
      stroke: theme.textMuted,
      strokeWidth: 1.5,
      listening: false
    }),
    app.roundedRect({
      x: cx - camR * 0.55,
      y: cy - camR * 0.35,
      width: camR * 1.1,
      height: camR * 0.7,
      cornerRadius: 4,
      fill: "#334155",
      listening: false
    }),
    app.circle({
      x: cx - camR * 0.2,
      y: cy - camR * 0.05,
      radius: camR * 0.22,
      fill: theme.accent,
      opacity: 0.8,
      listening: false
    })
  );
  const bx = pad + w * 0.18;
  const by = viewY + viewH * 0.72;
  group.add(
    app.path({
      d: `M ${bx} ${viewY + viewH - 8} L ${cx - 18} ${by} L ${cx + 18} ${by} L ${pad + w * 0.82} ${viewY + viewH - 8}`,
      stroke: theme.ok,
      strokeWidth: 2,
      listening: false
    })
  );
  group.add(
    app.text({
      text: "REVERSE",
      x: pad + w / 2,
      y: textAt(viewY + viewH - 10, 8),
      fontSize: 8,
      fontWeight: "bold",
      fill: theme.ok,
      textAlign: "center",
      listening: false
    })
  );
  return finishPanel(group, props, bounds, { active: bool3(props, "active", true) });
});
registerAutomotive("sunriseSunset", (props, app) => {
  const theme = panelTheme(props);
  const bounds = panelBounds(props, 180, 100);
  const group = panelGroup(app, "sunriseSunset", props, bounds);
  const { pad, innerWidth: w, innerHeight: h } = bounds;
  const rowLines = lines(props, ["Rise 06:12", "Set 19:45"]);
  const sunrise = str3(props, "sunrise", rowLines[0]?.replace(/^Rise\s*/, "") ?? "06:12");
  const sunset = str3(props, "sunset", rowLines[1]?.replace(/^Set\s*/, "") ?? "19:45");
  addPanelFrame(group, app, bounds, theme);
  const top = addPanelTitle(group, app, bounds, theme, "Sun");
  const horizonY = top + (pad + h - top) * 0.42;
  group.add(
    app.line({
      x: pad + 6,
      y: horizonY,
      x2: w - 12,
      y2: 0,
      stroke: theme.dialStroke,
      strokeWidth: 1,
      listening: false
    }),
    app.path({
      d: `M ${pad + 6} ${horizonY} Q ${pad + w / 2} ${top + 8} ${pad + w - 6} ${horizonY}`,
      stroke: "rgba(251,191,36,0.25)",
      strokeWidth: 1,
      listening: false
    })
  );
  const sunX = pad + w * 0.68;
  group.add(
    app.circle({
      x: sunX - 9,
      y: horizonY - 18,
      radius: 9,
      fill: "#fbbf24",
      opacity: 0.95,
      listening: false
    })
  );
  group.add(
    app.text({
      text: `\u2191 ${sunrise}`,
      x: pad + 4,
      y: textAt(pad + h - 10, 10),
      fontSize: fluidFont(10, bounds, 8, 11),
      fill: theme.text,
      listening: false
    }),
    app.text({
      text: `\u2193 ${sunset}`,
      x: pad + w - 48,
      y: textAt(pad + h - 10, 10),
      fontSize: fluidFont(10, bounds, 8, 11),
      fill: theme.textMuted,
      listening: false
    })
  );
  return finishPanel(group, props, bounds, { sunrise, sunset });
});

// src/automotive/widgets/aliases.ts
for (const [alias, canonical] of Object.entries(WIDGET_ALIASES)) {
  if (registry3[alias])
    continue;
  const factory = registry3[canonical];
  if (!factory)
    continue;
  registerAutomotive(alias, (props, app) => factory(props, app));
}

// src/automotive/simulation.ts
var VALUE_KEY = {
  speedometer: "speed",
  tachometer: "rpm",
  fuelGauge: "fuel",
  engineTemp: "engineTemp",
  batteryVoltage: "batteryVoltage",
  cruiseControl: "cruiseSpeed",
  gearIndicator: "gear"
};
function walkParts(node, fn) {
  fn(node);
  if ("children" in node) {
    for (const child of node.children) {
      walkParts(child, fn);
    }
  }
}
function applyDriveState(root, state) {
  if ("children" in root && state.incomingCall !== void 0) {
    const prev = getState3(root).incomingCall;
    if (prev !== state.incomingCall) {
      updateAutoWidgetProps(root, {
        incomingCall: state.incomingCall,
        ...state.caller !== void 0 ? { caller: state.caller } : {},
        ...state.callStatus !== void 0 ? { callStatus: state.callStatus } : {},
        ...state.subtitle !== void 0 ? { subtitle: state.subtitle } : {}
      });
    }
  }
  walkParts(root, (node) => {
    const part = node.metadata?.autoPart;
    if (!part)
      return;
    if (part === "tpms" && state.tpms) {
      setState3(node, { pressures: state.tpms });
      node.metadata.refresh?.(state.tpms);
      return;
    }
    if ((part === "canViewer" || part === "canBusSignalMonitor") && state.signals) {
      setState3(node, { signals: state.signals });
      node.metadata.refresh?.(state.signals);
      return;
    }
    if (part === "turnIndicators" && (state.turnLeft !== void 0 || state.turnRight !== void 0)) {
      const left = state.turnLeft ?? false;
      const right = state.turnRight ?? false;
      setState3(node, { left, right });
      node.metadata.refresh?.(left, right);
      return;
    }
    if (part === "callScreen") {
      if (state.caller !== void 0) {
        node.metadata.refresh?.(
          String(state.caller),
          state.callStatus !== void 0 ? String(state.callStatus) : void 0
        );
      }
      if (state.subtitle !== void 0) {
        setState3(node, { subtitle: state.subtitle });
        node.metadata.linesRefresh?.([
          String(state.callStatus ?? "incoming"),
          String(state.subtitle)
        ]);
      }
      return;
    }
    const mapped = VALUE_KEY[part] ?? part;
    const raw = state[mapped] ?? state[part];
    if (typeof raw === "number" && typeof node.metadata.refresh === "function") {
      if (part === "cruiseControl") {
        setState3(node, { speed: raw, active: raw > 0 });
      } else {
        setAutoValue(node, "value", raw);
      }
      node.metadata.refresh(raw);
      return;
    }
    if (typeof raw === "boolean") {
      setState3(node, { active: raw });
      node.metadata.boolRefresh?.(raw);
      return;
    }
    if (typeof raw === "string") {
      setState3(node, { gear: raw, status: raw, text: raw });
      node.metadata.textRefresh?.(raw);
      if (part === "gearIndicator") {
        const label = getParts2(node).label;
        if (label)
          label.text = raw;
      }
    }
  });
  root.getApp()?.requestRender();
}
function sampleDriveFrames(count = 60) {
  const frames = [];
  for (let i = 0; i < count; i++) {
    const t = i / count;
    frames.push({
      speed: Math.round(30 + Math.sin(t * Math.PI * 2) * 40 + t * 30),
      rpm: Math.round(1500 + Math.sin(t * Math.PI * 4) * 2e3 + t * 1500),
      fuel: Math.max(5, Math.round(80 - t * 40)),
      engineTemp: Math.round(70 + t * 40 + Math.sin(t * 10) * 5),
      batteryVoltage: Math.round((12.2 + Math.sin(t * 5) * 0.3) * 10) / 10,
      stateOfCharge: Math.max(10, Math.round(85 - t * 30)),
      tpms: [32, 31, 33, 32].map((p, j) => i > 40 && j === 2 ? 22 : p),
      parkingBrake: i < 5,
      headlights: i > 10,
      cruiseSpeed: i > 20 && i < 50 ? 65 : 0,
      gear: i < 5 ? "P" : "D",
      turnLeft: i % 30 < 5,
      turnRight: i % 30 > 25,
      incomingCall: i >= 35 && i < 55,
      caller: "Alex Morgan",
      callStatus: i >= 35 && i < 55 ? "incoming" : "ended",
      subtitle: "Mobile",
      adasStatus: i > 30 ? "active" : "standby",
      signals: {
        "engine.rpm": Math.round(1500 + t * 3e3),
        "vehicle.speed": Math.round(30 + t * 60),
        "battery.voltage": 12.4
      }
    });
  }
  return frames;
}

// src/automotive/responsive.ts
function createResizeObserver2(callback) {
  if (typeof ResizeObserver !== "undefined") {
    return new ResizeObserver(callback);
  }
  return {
    observe() {
    },
    unobserve() {
    },
    disconnect() {
    }
  };
}
var observers2 = /* @__PURE__ */ new WeakMap();
function readContainerSize(container) {
  let w = container.clientWidth;
  let h = container.clientHeight;
  if (w <= 0 || h <= 0) {
    const rect = container.getBoundingClientRect();
    if (w <= 0)
      w = rect.width;
    if (h <= 0)
      h = rect.height;
  }
  if (w <= 0 || h <= 0) {
    const sw = parseFloat(container.style.width);
    const sh = parseFloat(container.style.height);
    if (w <= 0 && Number.isFinite(sw) && sw > 0)
      w = sw;
    if (h <= 0 && Number.isFinite(sh) && sh > 0)
      h = sh;
  }
  return { w, h };
}
function fitAutoWidgetToContainer(widgetNode, containerW, containerH, pad = 8) {
  const state = getState3(widgetNode);
  const merged = { ...state };
  if (containerW > 0)
    merged.width = Math.max(56, Math.floor(containerW));
  if (containerH > 0)
    merged.height = Math.max(44, Math.floor(containerH));
  const bounds = resolveBounds(
    merged,
    num3(state, "width", 160),
    num3(state, "height", 120),
    pad
  );
  const patch = {};
  if (bounds.width !== num3(state, "width", 0))
    patch.width = bounds.width;
  if (bounds.height !== num3(state, "height", 0))
    patch.height = bounds.height;
  const hadSize = num3(state, "size", 0) > 0 || "size" in state;
  if (hadSize && bounds.dialSize !== num3(state, "size", 0)) {
    patch.size = bounds.dialSize;
  }
  if (Object.keys(patch).length === 0) {
    return {};
  }
  return patch;
}
function installAutoWidgetResizeObserver(widgetNode, container, options = {}) {
  detachAutoWidgetResizeObserver(widgetNode);
  const minW = options.minWidth ?? 72;
  const minH = options.minHeight ?? 56;
  const pad = options.padding ?? 0;
  const apply = (rawW, rawH) => {
    const state = getState3(widgetNode);
    const w = rawW > 0 ? Math.max(minW, Math.floor(rawW - pad)) : num3(state, "width", 0);
    const h = rawH > 0 ? Math.max(minH, Math.floor(rawH - pad)) : num3(state, "height", 0);
    if (w < 8 || h < 8)
      return;
    const last = widgetNode.metadata._lastAutoContainerSize;
    if (last && last.w === w && last.h === h)
      return;
    widgetNode.metadata._lastAutoContainerSize = { w, h };
    const patch = fitAutoWidgetToContainer(widgetNode, w, h, pad);
    if (Object.keys(patch).length === 0)
      return;
    updateAutoWidgetProps(widgetNode, patch);
    options.onResize?.(w, h);
  };
  let raf = 0;
  const ro = createResizeObserver2((entries) => {
    const rect = entries[0]?.contentRect;
    if (!rect)
      return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => apply(rect.width, rect.height));
  });
  ro.observe(container);
  observers2.set(widgetNode, ro);
  widgetNode.metadata.resizeObserverAttached = true;
  const initial = readContainerSize(container);
  apply(initial.w, initial.h);
}
function detachAutoWidgetResizeObserver(widgetNode) {
  const ro = observers2.get(widgetNode);
  ro?.disconnect();
  observers2.delete(widgetNode);
  delete widgetNode.metadata._lastAutoContainerSize;
  delete widgetNode.metadata.resizeObserverAttached;
}

// src/automotive/registry.ts
function listAutomotiveWidgets() {
  return Object.keys(registry3).sort();
}

// src/modules/automotive/index.ts
var automotivePlugin = {
  name: "lightdraw-automotive",
  version: "1.0.0",
  install(LD) {
    registerJSONResolver((type, props, app) => createAutomotiveFromJSON(type, props, app));
    LD.registerAutomotive = registerAutomotive;
  }
};

// src/diagram/router.ts
function hSegIntersectsRect(x1, x2, y, obs) {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  return y >= obs.y && y <= obs.y + obs.height && maxX >= obs.x && minX <= obs.x + obs.width;
}
function vSegIntersectsRect(y1, y2, x, obs) {
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  return x >= obs.x && x <= obs.x + obs.width && maxY >= obs.y && minY <= obs.y + obs.height;
}
function pathHitsObstacles(points, obstacles) {
  for (let i = 0; i < points.length - 2; i += 2) {
    const x1 = points[i];
    const y1 = points[i + 1];
    const x2 = points[i + 2];
    const y2 = points[i + 3];
    for (const obs of obstacles) {
      if (x1 === x2) {
        if (vSegIntersectsRect(y1, y2, x1, obs))
          return true;
      } else if (y1 === y2) {
        if (hSegIntersectsRect(x1, x2, y1, obs))
          return true;
      }
    }
  }
  return false;
}
function padObstacle(obs, pad) {
  return {
    x: obs.x - pad,
    y: obs.y - pad,
    width: obs.width + pad * 2,
    height: obs.height + pad * 2
  };
}
function smartOrthogonalRoute(x1, y1, x2, y2, obstacles) {
  const padded = obstacles.map((o) => padObstacle(o, 8));
  const candidates = [
    [x1, y1, x1, y2, x2, y2],
    [x1, y1, x2, y1, x2, y2],
    [x1, y1, x1, (y1 + y2) / 2, x2, (y1 + y2) / 2, x2, y2],
    [x1, y1, (x1 + x2) / 2, y1, (x1 + x2) / 2, y2, x2, y2]
  ];
  for (const path of candidates) {
    if (!pathHitsObstacles(path, padded))
      return path;
  }
  const minY = Math.min(y1, y2, ...padded.map((o) => o.y)) - 30;
  const maxY = Math.max(y1, y2, ...padded.map((o) => o.y + o.height)) + 30;
  const above = [x1, y1, x1, minY, x2, minY, x2, y2];
  const below = [x1, y1, x1, maxY, x2, maxY, x2, y2];
  if (!pathHitsObstacles(above, padded))
    return above;
  if (!pathHitsObstacles(below, padded))
    return below;
  return candidates[0];
}
function collectObstacles(nodes, exclude) {
  const skip = new Set(exclude ?? []);
  const result = [];
  for (const node of nodes) {
    if (skip.has(node))
      continue;
    const b = node.getBounds();
    if (b.width > 0 && b.height > 0) {
      result.push({ x: b.x, y: b.y, width: b.width, height: b.height });
    }
  }
  return result;
}
function computeRoutePoints(x1, y1, x2, y2, style = "orthogonal", obstacles = []) {
  if (style === "straight") {
    return [x1, y1, x2, y2];
  }
  if (style === "smart") {
    return smartOrthogonalRoute(x1, y1, x2, y2, obstacles);
  }
  const midY = (y1 + y2) / 2;
  return [x1, y1, x1, midY, x2, midY, x2, y2];
}
function routeConnector(app, x1, y1, x2, y2, style = "orthogonal", obstacles = [], stroke = DIAGRAM.edge) {
  const points = computeRoutePoints(x1, y1, x2, y2, style, obstacles);
  if (style === "straight" && points.length === 4) {
    return app.line({
      x: x1,
      y: y1,
      x2: x2 - x1,
      y2: y2 - y1,
      stroke,
      strokeWidth: 2,
      lineCap: "round"
    });
  }
  return app.polyline({
    points,
    fill: null,
    stroke,
    strokeWidth: 2,
    lineJoin: "round",
    lineCap: "round"
  });
}
function getAnchor(node, targetX, targetY) {
  const b = node.getBounds();
  const cx = b.x + b.width / 2;
  const cy = b.y + b.height / 2;
  const dx = targetX - cx;
  const dy = targetY - cy;
  if (dx === 0 && dy === 0)
    return { x: cx, y: b.y };
  const hw = Math.max(b.width / 2, 1);
  const hh = Math.max(b.height / 2, 1);
  const scale = Math.max(Math.abs(dx) / hw, Math.abs(dy) / hh);
  return { x: cx + dx / scale, y: cy + dy / scale };
}

// src/diagram/coords.ts
function worldToParentLocal(parent, wx, wy) {
  const wm = parent.getWorldMatrix();
  const inv = matrixPool.acquire();
  if (!wm.invertInto(inv)) {
    matrixPool.release(inv);
    return { x: wx, y: wy };
  }
  const local = inv.transformPoint(wx, wy);
  matrixPool.release(inv);
  return local;
}
function obstacleToParentLocal(parent, obs) {
  const tl = worldToParentLocal(parent, obs.x, obs.y);
  const br = worldToParentLocal(parent, obs.x + obs.width, obs.y + obs.height);
  return {
    x: Math.min(tl.x, br.x),
    y: Math.min(tl.y, br.y),
    width: Math.abs(br.x - tl.x),
    height: Math.abs(br.y - tl.y)
  };
}
function getConnectorAnchors(from, to, parent) {
  const toB = to.getBounds();
  const anchorWorld = getAnchor(from, toB.x + toB.width / 2, toB.y + toB.height / 2);
  const toAnchorWorld = getAnchor(to, anchorWorld.x, anchorWorld.y);
  const a = worldToParentLocal(parent, anchorWorld.x, anchorWorld.y);
  const b = worldToParentLocal(parent, toAnchorWorld.x, toAnchorWorld.y);
  return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
}

// src/diagram/connectors.ts
function segmentAngle(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}
function arrowHeadPoints(tipX, tipY, angle, size = 10) {
  const half = size * 0.42;
  const back = size * 0.95;
  const bx = tipX - back * Math.cos(angle);
  const by = tipY - back * Math.sin(angle);
  const lx = bx + half * Math.sin(angle);
  const ly = by - half * Math.cos(angle);
  const rx = bx - half * Math.sin(angle);
  const ry = by + half * Math.cos(angle);
  return [tipX, tipY, lx, ly, rx, ry];
}
function openArrowPoints(tipX, tipY, angle, size = 10) {
  const half = size * 0.4;
  const back = size * 0.85;
  const bx = tipX - back * Math.cos(angle);
  const by = tipY - back * Math.sin(angle);
  return [
    bx + half * Math.sin(angle),
    by - half * Math.cos(angle),
    tipX,
    tipY,
    bx - half * Math.sin(angle),
    by + half * Math.cos(angle)
  ];
}
function shortenPathEnd(points, trim) {
  if (points.length < 4 || trim <= 0)
    return points.slice();
  const copy = points.slice();
  const n = copy.length;
  const x2 = copy[n - 2];
  const y2 = copy[n - 1];
  const x1 = copy[n - 4];
  const y1 = copy[n - 3];
  const len = Math.hypot(x2 - x1, y2 - y1);
  const t = Math.min(trim / Math.max(len, 1), 0.45);
  copy[n - 2] = x2 - (x2 - x1) * t;
  copy[n - 1] = y2 - (y2 - y1) * t;
  return copy;
}
function pathMidpoint(points) {
  if (points.length < 4)
    return { x: points[0] ?? 0, y: points[1] ?? 0 };
  let total = 0;
  const segs = [];
  for (let i = 0; i < points.length - 2; i += 2) {
    const x1 = points[i];
    const y1 = points[i + 1];
    const x2 = points[i + 2];
    const y2 = points[i + 3];
    const len = Math.hypot(x2 - x1, y2 - y1);
    segs.push({ len, x1, y1, x2, y2 });
    total += len;
  }
  let half = total / 2;
  for (const s of segs) {
    if (half <= s.len) {
      const t = s.len > 0 ? half / s.len : 0;
      return { x: s.x1 + (s.x2 - s.x1) * t, y: s.y1 + (s.y2 - s.y1) * t };
    }
    half -= s.len;
  }
  const last = segs[segs.length - 1];
  return { x: last.x2, y: last.y2 };
}
function createConnector(app, x1, y1, x2, y2, options = {}) {
  const stroke = options.stroke ?? DIAGRAM.edge;
  const strokeWidth = options.strokeWidth ?? DIAGRAM.stroke.edge;
  const glowColor = options.glowColor ?? DIAGRAM.edgeGlow;
  const arrowEnd = options.arrowEnd ?? "filled";
  const arrowStart = options.arrowStart ?? "none";
  const arrowSize = 11;
  const style = options.style ?? "smart";
  const obstacles = options.obstacles ?? [];
  const points = computeRoutePoints(x1, y1, x2, y2, style, obstacles);
  const group = app.group({ listening: false });
  const trimEnd = arrowEnd !== "none" ? arrowSize * 0.7 : 0;
  const trimStart = arrowStart !== "none" ? arrowSize * 0.7 : 0;
  let display = points;
  if (trimEnd > 0)
    display = shortenPathEnd(display, trimEnd);
  if (trimStart > 0 && display.length >= 4) {
    const x0 = display[0];
    const y0 = display[1];
    const x1s = display[2];
    const y1s = display[3];
    const len = Math.hypot(x1s - x0, y1s - y0);
    const t = Math.min(trimStart / Math.max(len, 1), 0.45);
    display[0] = x0 + (x1s - x0) * t;
    display[1] = y0 + (y1s - y0) * t;
  }
  group.add(
    app.polyline({
      points: display,
      fill: null,
      stroke: glowColor,
      strokeWidth: strokeWidth + DIAGRAM.stroke.edgeGlow,
      lineJoin: "round",
      lineCap: "round",
      opacity: 0.85,
      listening: false
    })
  );
  group.add(
    app.polyline({
      points: display,
      fill: null,
      stroke,
      strokeWidth,
      lineJoin: "round",
      lineCap: "round",
      ...options.dash ? { dash: options.dash } : {},
      listening: false
    })
  );
  const endAngle = segmentAngle(
    points[points.length - 4],
    points[points.length - 3],
    points[points.length - 2],
    points[points.length - 1]
  );
  const startAngle = segmentAngle(points[0], points[1], points[2], points[3]);
  if (arrowEnd === "filled") {
    group.add(
      app.polygon({
        points: arrowHeadPoints(x2, y2, endAngle, arrowSize),
        fill: stroke,
        stroke,
        strokeWidth: DIAGRAM.stroke.arrow,
        listening: false
      })
    );
  } else if (arrowEnd === "open") {
    group.add(
      app.polyline({
        points: openArrowPoints(x2, y2, endAngle, arrowSize),
        fill: null,
        stroke,
        strokeWidth,
        lineCap: "round",
        lineJoin: "round",
        listening: false
      })
    );
  } else if (arrowEnd === "hollow") {
    group.add(
      app.polygon({
        points: arrowHeadPoints(x2, y2, endAngle, arrowSize + 2),
        fill: DIAGRAM.classFill,
        stroke,
        strokeWidth: DIAGRAM.stroke.node,
        listening: false
      })
    );
  }
  if (arrowStart === "filled") {
    group.add(
      app.polygon({
        points: arrowHeadPoints(x1, y1, startAngle + Math.PI, arrowSize),
        fill: stroke,
        stroke,
        strokeWidth: DIAGRAM.stroke.arrow,
        listening: false
      })
    );
  }
  if (options.label) {
    const mid = pathMidpoint(points);
    group.add(createEdgeLabel(app, options.label, mid.x, mid.y - 6, stroke));
  }
  if (options.edgeId)
    group.metadata.edgeId = options.edgeId;
  if (options.fromId)
    group.metadata.edgeFrom = options.fromId;
  if (options.toId)
    group.metadata.edgeTo = options.toId;
  if (options.label)
    group.metadata.edgeLabel = options.label;
  group.metadata.edgeStroke = stroke;
  group.metadata.edgeStrokeWidth = strokeWidth;
  group.metadata.edgeGlow = glowColor;
  group.metadata.edgeStyle = style;
  group.metadata.edgeArrowEnd = arrowEnd;
  group.metadata.edgeArrowStart = arrowStart;
  if (options.dash)
    group.metadata.edgeDash = options.dash;
  return group;
}
function connectNodes(app, from, to, obstacles, options = {}) {
  const parent = options.parent;
  let x1;
  let y1;
  let x2;
  let y2;
  let routeObstacles = obstacles;
  if (parent) {
    const anchors = getConnectorAnchors(from, to, parent);
    x1 = anchors.x1;
    y1 = anchors.y1;
    x2 = anchors.x2;
    y2 = anchors.y2;
    routeObstacles = obstacles.map((o) => obstacleToParentLocal(parent, o));
  } else {
    const toB = to.getBounds();
    const anchor = getAnchor(from, toB.x + toB.width / 2, toB.y + toB.height / 2);
    const toAnchor = getAnchor(to, anchor.x, anchor.y);
    x1 = anchor.x;
    y1 = anchor.y;
    x2 = toAnchor.x;
    y2 = toAnchor.y;
  }
  return createConnector(app, x1, y1, x2, y2, {
    style: "smart",
    fromId: options.fromId ?? from.metadata?.diagramId,
    toId: options.toId ?? to.metadata?.diagramId,
    edgeId: options.edgeId ?? `${options.fromId ?? from.metadata?.diagramId ?? "a"}-${options.toId ?? to.metadata?.diagramId ?? "b"}`,
    ...options,
    obstacles: routeObstacles
  });
}
function wireOrgChartConnectors(app, root) {
  let edgeLayer = root.children.find((c) => c.metadata?.diagramEdgeLayer);
  if (edgeLayer) {
    for (const child of [...edgeLayer.children]) {
      edgeLayer.remove(child);
      child.destroy();
    }
  } else {
    edgeLayer = app.group({ listening: false, zIndex: -10 });
    edgeLayer.metadata.diagramEdgeLayer = true;
    root.add(edgeLayer);
  }
  const obstacles = collectObstacles(collectOrgChartNodes(root));
  walkOrgEdgesConnect(app, root, root, edgeLayer, obstacles);
}
function collectOrgChartNodes(root) {
  const out = [];
  const walk2 = (group) => {
    for (const child of group.children) {
      if (child.metadata?.orgNode)
        out.push(child);
      if ("children" in child && child.children?.length) {
        walk2(child);
      }
    }
  };
  walk2(root);
  return out;
}
function walkOrgEdgesConnect(app, root, node, edgeLayer, obstacles) {
  const children = node.children.filter(
    (c) => c.metadata?.orgNode && c !== node.metadata?.collapseIndicator
  );
  for (const child of children) {
    if (!child.visible)
      continue;
    const fromId = node.metadata?.diagramId ?? node.metadata?.orgName;
    const toId = child.metadata?.diagramId ?? child.metadata?.orgName;
    edgeLayer.add(
      connectNodes(app, node, child, obstacles, {
        parent: root,
        style: "orthogonal",
        stroke: DIAGRAM.edge,
        glowColor: DIAGRAM.edgeGlow,
        strokeWidth: DIAGRAM.stroke.edge,
        arrowEnd: "filled",
        edgeId: `org_${fromId}_${toId}`,
        fromId,
        toId
      })
    );
    walkOrgEdgesConnect(app, root, child, edgeLayer, obstacles);
  }
}
function wireMindMapConnectors(app, group) {
  if (group.children.length < 2)
    return;
  const center = group.children[0];
  const edges = app.group({ listening: false, zIndex: -10 });
  const cB = center.getBounds();
  const cx = worldToParentLocal(group, cB.x + cB.width / 2, cB.y + cB.height / 2).x;
  const cy = worldToParentLocal(group, cB.x + cB.width / 2, cB.y + cB.height / 2).y;
  for (let i = 1; i < group.children.length; i++) {
    const branch = group.children[i];
    const branchStroke = branch.metadata?.mindBranchColor ?? DIAGRAM.mindBranch.stroke;
    const branchGlow = branch.metadata?.mindBranchGlow ?? DIAGRAM.edgeGlow;
    const bB = branch.getBounds();
    const bx = worldToParentLocal(group, bB.x + bB.width / 2, bB.y + bB.height / 2).x;
    const by = worldToParentLocal(group, bB.x + bB.width / 2, bB.y + bB.height / 2).y;
    edges.add(
      createConnector(app, cx, cy, bx, by, {
        style: "straight",
        stroke: branchStroke,
        glowColor: branchGlow,
        strokeWidth: DIAGRAM.stroke.edge,
        arrowEnd: "none"
      })
    );
    const branchGroup = branch;
    for (const leaf of branchGroup.children) {
      const lB = leaf.getBounds();
      const lx = worldToParentLocal(group, lB.x + lB.width / 2, lB.y).x;
      const ly = worldToParentLocal(group, lB.x + lB.width / 2, lB.y).y;
      const branchBottom = worldToParentLocal(group, bB.x + bB.width / 2, bB.y + bB.height).y;
      edges.add(
        createConnector(app, bx, branchBottom, lx, ly, {
          style: "orthogonal",
          stroke: branchStroke,
          glowColor: branchGlow,
          strokeWidth: DIAGRAM.stroke.edgeThin,
          arrowEnd: "filled"
        })
      );
    }
  }
  group.add(edges);
}

// src/diagram/symbols.ts
var SYMBOL_SIZE = 44;
var STROKE = DIAGRAM.schematicStroke;
var SYMBOL_ACCENTS = {
  battery: DIAGRAM.schematicBattery,
  resistor: DIAGRAM.schematicResistor,
  switch: DIAGRAM.schematicSwitch,
  led: DIAGRAM.schematicLedStroke
};
function symbolPad(app, w, h, accent) {
  const g = app.group();
  addCardChrome(app, g, {
    width: w,
    height: h,
    cornerRadius: DIAGRAM.radii.sm,
    fill: DIAGRAM.schematicFill,
    stroke: DIAGRAM.labelPillStroke,
    strokeWidth: DIAGRAM.stroke.label,
    shadow: DIAGRAM.shadowSoft,
    accentColor: accent
  });
  return g;
}
function resistor(app, x, y) {
  const g = symbolPad(app, SYMBOL_SIZE, SYMBOL_SIZE, SYMBOL_ACCENTS.resistor);
  g.x = x;
  g.y = y;
  const pts = [4, 22, 12, 8, 20, 36, 28, 8, 36, 36, 40, 22];
  g.add(app.polyline({ points: pts, fill: null, stroke: STROKE, strokeWidth: 2, lineCap: "round", listening: false }));
  return g;
}
function capacitor(app, x, y) {
  const g = symbolPad(app, SYMBOL_SIZE, SYMBOL_SIZE);
  g.x = x;
  g.y = y;
  g.add(app.line({ x: 4, y: 22, x2: 16, y2: 0, stroke: STROKE, strokeWidth: 2, lineCap: "round", listening: false }));
  g.add(app.line({ x: 18, y: 10, x2: 0, y2: 24, stroke: STROKE, strokeWidth: 2.5, listening: false }));
  g.add(app.line({ x: 24, y: 10, x2: 0, y2: 24, stroke: STROKE, strokeWidth: 2.5, listening: false }));
  g.add(app.line({ x: 26, y: 22, x2: 16, y2: 0, stroke: STROKE, strokeWidth: 2, lineCap: "round", listening: false }));
  return g;
}
function ground(app, x, y) {
  const g = symbolPad(app, SYMBOL_SIZE, SYMBOL_SIZE, DIAGRAM.edgeMuted);
  g.x = x;
  g.y = y;
  g.add(app.line({ x: 22, y: 8, x2: 0, y2: 12, stroke: STROKE, strokeWidth: 2, lineCap: "round", listening: false }));
  g.add(app.line({ x: 8, y: 24, x2: 28, y2: 0, stroke: STROKE, strokeWidth: 2, lineCap: "round", listening: false }));
  g.add(app.line({ x: 14, y: 30, x2: 20, y2: 0, stroke: STROKE, strokeWidth: 2, lineCap: "round", listening: false }));
  g.add(app.line({ x: 18, y: 36, x2: 4, y2: 0, stroke: STROKE, strokeWidth: 2, lineCap: "round", listening: false }));
  return g;
}
function battery(app, x, y) {
  const g = symbolPad(app, SYMBOL_SIZE, SYMBOL_SIZE, SYMBOL_ACCENTS.battery);
  g.x = x;
  g.y = y;
  g.add(app.line({ x: 14, y: 10, x2: 0, y2: 28, stroke: STROKE, strokeWidth: 2, lineCap: "round", listening: false }));
  g.add(app.line({ x: 22, y: 6, x2: 0, y2: 32, stroke: DIAGRAM.schematicBattery, strokeWidth: 3, lineCap: "round", listening: false }));
  g.add(app.line({ x: 30, y: 10, x2: 0, y2: 28, stroke: STROKE, strokeWidth: 2, lineCap: "round", listening: false }));
  return g;
}
function switchSymbol(app, x, y) {
  const g = symbolPad(app, SYMBOL_SIZE, SYMBOL_SIZE, SYMBOL_ACCENTS.switch);
  g.x = x;
  g.y = y;
  g.add(app.line({ x: 4, y: 22, x2: 14, y2: 0, stroke: STROKE, strokeWidth: 2, lineCap: "round", listening: false }));
  g.add(app.line({ x: 14, y: 22, x2: 4, y2: -10, stroke: DIAGRAM.schematicSwitch, strokeWidth: 2, lineCap: "round", listening: false }));
  g.add(app.circle({ x: 14, y: 22, radius: 2.5, fill: DIAGRAM.schematicSwitch, listening: false }));
  g.add(app.line({ x: 30, y: 22, x2: -12, y2: 0, stroke: STROKE, strokeWidth: 2, lineCap: "round", listening: false }));
  return g;
}
function led(app, x, y) {
  const g = symbolPad(app, SYMBOL_SIZE, SYMBOL_SIZE, SYMBOL_ACCENTS.led);
  g.x = x;
  g.y = y;
  g.add(app.line({ x: 4, y: 22, x2: 12, y2: 0, stroke: STROKE, strokeWidth: 2, lineCap: "round", listening: false }));
  g.add(
    app.polygon({
      points: [12, 14, 32, 22, 12, 30],
      fill: DIAGRAM.schematicLedFill,
      stroke: DIAGRAM.schematicLedStroke,
      strokeWidth: DIAGRAM.stroke.node,
      listening: false
    })
  );
  g.add(app.line({ x: 32, y: 22, x2: -8, y2: 0, stroke: STROKE, strokeWidth: 2, lineCap: "round", listening: false }));
  return g;
}
var SYMBOL_FACTORIES = {
  resistor,
  capacitor,
  ground,
  battery,
  switch: switchSymbol,
  led,
  wire: (app, x, y) => {
    const g = app.group({ x, y });
    g.add(
      app.line({
        x: 0,
        y: 0,
        x2: 48,
        y2: 0,
        stroke: DIAGRAM.schematicWireGlow,
        strokeWidth: 6,
        lineCap: "round",
        opacity: 0.85,
        listening: false
      })
    );
    g.add(
      app.line({
        x: 0,
        y: 0,
        x2: 48,
        y2: 0,
        stroke: DIAGRAM.schematicWire,
        strokeWidth: 2.5,
        lineCap: "round",
        listening: false
      })
    );
    return g;
  }
};
function createSymbol(app, type, x, y, label) {
  const factory = SYMBOL_FACTORIES[type] ?? SYMBOL_FACTORIES.resistor;
  const g = factory(app, x, y);
  g.metadata = { symbolType: type };
  if (label) {
    g.add(
      app.text({
        text: label,
        x: centerLabelX(label, SYMBOL_SIZE),
        y: SYMBOL_SIZE + 6,
        fontSize: DIAGRAM.fontSize.sm,
        fontWeight: "600",
        fontFamily: DIAGRAM.fontFamily,
        fill: DIAGRAM.schematicLabel,
        listening: false
      })
    );
  }
  return g;
}
function centerLabelX(label, boxWidth) {
  const approx = label.length * DIAGRAM.fontSize.sm * 0.55;
  return Math.max(0, (boxWidth - approx) / 2);
}
function wireBetween(app, x1, y1, x2, y2) {
  const g = app.group({ listening: false });
  g.add(
    app.line({
      x: x1,
      y: y1,
      x2,
      y2,
      stroke: DIAGRAM.schematicWireGlow,
      strokeWidth: 6,
      lineCap: "round",
      opacity: 0.85,
      listening: false
    })
  );
  g.add(
    app.line({
      x: x1,
      y: y1,
      x2,
      y2,
      stroke: DIAGRAM.schematicWire,
      strokeWidth: 2.5,
      lineCap: "round",
      listening: false
    })
  );
  return g;
}
function buildSchematic(app, components) {
  const group = app.group({ name: "schematic" });
  const wireLayer = app.group({ zIndex: -10, listening: false });
  const sorted = [...components].sort((a, b) => a.x - b.x);
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (a.type === "wire" || b.type === "wire")
      continue;
    const y = a.y + SYMBOL_SIZE / 2;
    const x1 = a.x + SYMBOL_SIZE;
    const x2 = b.x;
    if (x2 > x1) {
      wireLayer.add(wireBetween(app, x1, y, x2, y));
    }
  }
  group.add(wireLayer);
  for (const comp of components) {
    const sym = createSymbol(app, comp.type, comp.x, comp.y, comp.label);
    sym.metadata.diagramId = comp.id;
    if (comp.rotation)
      sym.rotation = comp.rotation;
    group.add(sym);
  }
  return group;
}

// src/diagram/definitions.ts
function createFlowchart(app, data, options = {}) {
  const group = createDiagramGroup(app, "flowchart", { ...options, data }, { name: "flowchart" });
  const { nodes, edges } = normalizeDiagramData(data);
  const canvas = readCanvasSize(options);
  const strokeCtx = strokeContextForCanvas(canvas.width, canvas.height);
  const edgeWidth = resolveStrokeWidth(DIAGRAM.stroke.edge, strokeCtx);
  autoLayoutNodesResponsive(nodes, canvas.width, canvas.height, 128, 52);
  const nodeMap = /* @__PURE__ */ new Map();
  for (const n of nodes) {
    const nodeGroup = createFlowchartNode(app, n.label, n.type ?? "process");
    nodeGroup.x = n.x ?? 0;
    nodeGroup.y = n.y ?? 0;
    nodeGroup.metadata = { diagramId: n.id };
    nodeMap.set(n.id, nodeGroup);
  }
  const edgeLayer = app.group({ zIndex: -10, listening: false });
  edgeLayer.metadata.diagramEdgeLayer = true;
  const obstacles = collectObstacles([...nodeMap.values()]);
  for (const edge of edges) {
    const fromNode = nodeMap.get(edge.from);
    const toNode = nodeMap.get(edge.to);
    if (!fromNode || !toNode)
      continue;
    edgeLayer.add(
      connectNodes(app, fromNode, toNode, obstacles, {
        parent: group,
        stroke: DIAGRAM.edge,
        glowColor: DIAGRAM.edgeGlow,
        strokeWidth: edgeWidth,
        label: edge.label
      })
    );
  }
  group.add(edgeLayer);
  for (const nodeGroup of nodeMap.values()) {
    group.add(nodeGroup);
  }
  return group;
}
function createStateMachine(app, data, options = {}) {
  const group = createDiagramGroup(app, "stateMachine", { ...options, data }, { name: "stateMachine" });
  const nodeMap = /* @__PURE__ */ new Map();
  const canvas = readCanvasSize(options);
  const strokeCtx = strokeContextForCanvas(canvas.width, canvas.height);
  const edgeWidth = resolveStrokeWidth(DIAGRAM.stroke.edge, strokeCtx);
  const layoutNodes = data.states.map((s) => ({ id: s.id, x: s.x, y: s.y }));
  autoLayoutNodesResponsive(layoutNodes, canvas.width, canvas.height, 64, 64);
  const states = data.states.map((s, i) => ({
    ...s,
    x: s.x ?? layoutNodes[i]?.x ?? 48 + i % 4 * 110,
    y: s.y ?? layoutNodes[i]?.y ?? 48 + Math.floor(i / 4) * 100
  }));
  for (const s of states) {
    const nodeGroup = createStateNode(app, s.label, s.type ?? "normal");
    nodeGroup.x = s.x ?? 0;
    nodeGroup.y = s.y ?? 0;
    nodeGroup.metadata = { diagramId: s.id };
    nodeMap.set(s.id, nodeGroup);
  }
  const edgeLayer = app.group({ zIndex: -10, listening: false });
  edgeLayer.metadata.diagramEdgeLayer = true;
  const obstacles = collectObstacles([...nodeMap.values()]);
  for (const t of data.transitions) {
    const from = nodeMap.get(t.from);
    const to = nodeMap.get(t.to);
    if (!from || !to)
      continue;
    edgeLayer.add(
      connectNodes(app, from, to, obstacles, {
        parent: group,
        stroke: DIAGRAM.edge,
        glowColor: DIAGRAM.edgeGlow,
        strokeWidth: edgeWidth,
        label: t.label
      })
    );
  }
  group.add(edgeLayer);
  for (const node of nodeMap.values()) {
    group.add(node);
  }
  return group;
}
function createClassDiagram(app, data, options = {}) {
  const group = createDiagramGroup(app, "classDiagram", { ...options, data }, { name: "classDiagram" });
  const nodeMap = /* @__PURE__ */ new Map();
  for (const cls of data.classes) {
    const nodeGroup = createClassNode(app, cls.name, cls.attributes ?? [], cls.methods ?? []);
    nodeGroup.x = cls.x ?? 0;
    nodeGroup.y = cls.y ?? 0;
    nodeGroup.metadata = { diagramId: cls.id };
    nodeMap.set(cls.id, nodeGroup);
    group.add(nodeGroup);
  }
  const edgeLayer = app.group({ zIndex: -10, listening: false });
  edgeLayer.metadata.diagramEdgeLayer = true;
  for (const rel of data.relations) {
    const from = nodeMap.get(rel.from);
    const to = nodeMap.get(rel.to);
    if (!from || !to)
      continue;
    if (rel.type === "inheritance") {
      edgeLayer.add(
        connectNodes(app, from, to, [], {
          parent: group,
          style: "orthogonal",
          stroke: DIAGRAM.umlInheritance,
          glowColor: "rgba(245,158,11,0.18)",
          arrowEnd: "hollow"
        })
      );
    } else if (rel.type === "association") {
      edgeLayer.add(
        connectNodes(app, from, to, [], {
          parent: group,
          style: "orthogonal",
          stroke: DIAGRAM.umlAssociation,
          glowColor: DIAGRAM.edgeGlow,
          arrowEnd: "open"
        })
      );
    } else if (rel.type === "composition") {
      edgeLayer.add(
        connectNodes(app, from, to, [], {
          parent: group,
          style: "orthogonal",
          stroke: DIAGRAM.umlComposition,
          glowColor: "rgba(244,114,182,0.16)",
          arrowEnd: "filled"
        })
      );
    } else {
      edgeLayer.add(
        connectNodes(app, from, to, [], {
          parent: group,
          style: "orthogonal",
          stroke: DIAGRAM.umlImplements,
          glowColor: "rgba(167,139,250,0.16)",
          dash: rel.type === "implements" ? [6, 4] : void 0,
          arrowEnd: "open"
        })
      );
    }
  }
  group.add(edgeLayer);
  return group;
}
function createMindMap(app, center, branches, options = {}) {
  const group = createDiagramGroup(app, "mindMap", { ...options, center, branches }, { name: "mindMap" });
  const canvas = readCanvasSize(options);
  const minDim = Math.min(canvas.width, canvas.height);
  const centerNode = createNodeBox(app, center, 112, 54, {
    fill: DIAGRAM.mindCenter.fill,
    stroke: DIAGRAM.mindCenter.stroke,
    cornerRadius: 27,
    accentColor: DIAGRAM.mindCenter.accent
  });
  centerNode.metadata.diagramId = "center";
  group.add(centerNode);
  branches.forEach((branch, bi) => {
    const palette = DIAGRAM.mindBranchPalette[bi % DIAGRAM.mindBranchPalette.length];
    const branchNode = createNodeBox(app, branch.label, 100, 40, {
      fill: palette.fill,
      stroke: palette.stroke,
      accentColor: palette.accent
    });
    branchNode.metadata = {
      diagramId: `branch_${bi}`,
      mindBranchColor: palette.stroke,
      mindBranchGlow: palette.glow
    };
    group.add(branchNode);
    if (branch.children) {
      branch.children.forEach((child, ci) => {
        const childNode = createNodeBox(app, child, 88, 34, {
          fill: DIAGRAM.mindLeaf.fill,
          stroke: palette.stroke,
          accentColor: palette.accent
        });
        childNode.metadata.diagramId = `branch_${bi}_leaf_${ci}`;
        childNode.x = -12 + ci * 92;
        childNode.y = 50;
        branchNode.add(childNode);
      });
    }
  });
  radialLayout(group, canvas.width / 2, canvas.height / 2, minDim * 0.2, minDim * 0.34);
  wireMindMapConnectors(app, group);
  return group;
}
function createNetworkDiagram(app, data, options = {}) {
  const group = createDiagramGroup(app, "networkTopology", { ...options, data }, { name: "network" });
  const { nodes, edges } = normalizeDiagramData(data);
  const canvas = readCanvasSize(options);
  const strokeCtx = strokeContextForCanvas(canvas.width, canvas.height);
  const edgeWidth = resolveStrokeWidth(DIAGRAM.stroke.edge, strokeCtx);
  autoLayoutNodesResponsive(nodes, canvas.width, canvas.height, 100, 72);
  const nodeMap = /* @__PURE__ */ new Map();
  for (const n of nodes) {
    const nodeGroup = createNetworkNode(app, n.label, n.type ?? "default");
    nodeGroup.x = n.x ?? 0;
    nodeGroup.y = n.y ?? 0;
    nodeGroup.metadata = { diagramId: n.id };
    nodeMap.set(n.id, nodeGroup);
    group.add(nodeGroup);
  }
  const obstacles = collectObstacles([...nodeMap.values()]);
  const edgeLayer = app.group({ zIndex: -10, listening: false });
  edgeLayer.metadata.diagramEdgeLayer = true;
  for (const edge of edges) {
    const from = nodeMap.get(edge.from);
    const to = nodeMap.get(edge.to);
    if (!from || !to)
      continue;
    edgeLayer.add(
      connectNodes(app, from, to, obstacles, {
        parent: group,
        stroke: DIAGRAM.edge,
        glowColor: DIAGRAM.edgeGlow,
        strokeWidth: edgeWidth,
        label: edge.label
      })
    );
  }
  group.add(edgeLayer);
  return group;
}
function createOrgChart(app, root, options = {}) {
  const group = createDiagramGroup(app, "orgChart", { ...options, root }, { name: "orgChart" });
  const canvas = readCanvasSize(options);
  buildOrgNode(app, group, root, 0, 0, 0);
  layoutDiagram(
    group,
    Math.max(80, Math.round(canvas.height * 0.16)),
    Math.max(56, Math.round(canvas.width * 0.11))
  );
  wireOrgChartConnectors(app, group);
  return group;
}
function buildOrgNode(app, parent, data, x, y, depth) {
  const childCount = data.children?.length ?? 0;
  const collapsed = data.collapsed ?? false;
  const { node, indicator } = createOrgNode(app, data.name, void 0, childCount, collapsed, depth);
  node.metadata.diagramId = data.name;
  node.metadata.orgName = data.name;
  node.x = x;
  node.y = y;
  node.metadata = { ...node.metadata, orgNode: true, collapsed, childCount };
  if (indicator) {
    node.metadata.collapseIndicator = indicator;
  }
  if (data.children && data.children.length > 0 && !collapsed) {
    for (const child of data.children) {
      buildOrgNode(app, node, child, 0, 0, depth + 1);
    }
  }
  parent.add(node);
  return node;
}
function toggleOrgCollapse(node) {
  if (!node.metadata?.orgNode)
    return;
  const collapsed = !node.metadata.collapsed;
  node.metadata.collapsed = collapsed;
  setDiagramState(node, { collapsed });
  const children = node.children.filter(
    (c) => c.metadata?.orgNode && c !== node.metadata.collapseIndicator
  );
  for (const child of children) {
    child.visible = !collapsed;
  }
  const indicator = node.metadata.collapseIndicator;
  if (indicator && "text" in indicator) {
    indicator.text = collapsed ? `+${node.metadata.childCount}` : "\u2212";
  }
  node.markDirty();
}
function createSchematic(app, components, options = {}) {
  const group = buildSchematic(app, components);
  group.metadata = {
    ...group.metadata,
    diagramType: "electricalSchematic",
    diagramState: { ...options, components }
  };
  return group;
}
function createCanNetwork(app, data, options = {}) {
  const group = createDiagramGroup(app, "canNetwork", { ...options, data }, { name: "canNetwork" });
  const canvas = readCanvasSize(options);
  const strokeCtx = strokeContextForCanvas(canvas.width, canvas.height);
  const nodeStroke = resolveStrokeWidth(DIAGRAM.stroke.node, strokeCtx);
  const busY = 72;
  const busWidth = Math.max(
    280,
    Math.min(canvas.width - 48, Math.max(440, data.ecus.length * 110))
  );
  const busLabel = data.busLabel ?? "CAN Bus";
  group.add(
    app.roundedRect({
      x: 14,
      y: busY - 5,
      width: busWidth + 4,
      height: 10,
      cornerRadius: 5,
      fill: DIAGRAM.canBusGlow,
      stroke: null,
      opacity: 0.6,
      listening: false
    })
  );
  group.add(
    app.roundedRect({
      x: 16,
      y: busY - 3,
      width: busWidth,
      height: 6,
      cornerRadius: 3,
      fill: DIAGRAM.canBus,
      stroke: null,
      shadow: DIAGRAM.shadowSoft,
      listening: false
    })
  );
  group.add(
    app.circle({
      x: 16,
      y: busY,
      radius: 5,
      fill: DIAGRAM.canTermination,
      stroke: DIAGRAM.surface,
      strokeWidth: 2,
      listening: false
    })
  );
  group.add(
    app.circle({
      x: 16 + busWidth,
      y: busY,
      radius: 5,
      fill: DIAGRAM.canTermination,
      stroke: DIAGRAM.surface,
      strokeWidth: 2,
      listening: false
    })
  );
  const labelW = measureTextWidth(busLabel, DIAGRAM.fontSize.base, "bold");
  group.add(
    app.text({
      text: busLabel,
      x: busWidth / 2 - labelW / 2 + 16,
      y: busY - 24,
      fontSize: DIAGRAM.fontSize.base,
      fill: DIAGRAM.edge,
      fontWeight: "bold",
      fontFamily: DIAGRAM.fontFamily,
      listening: false
    })
  );
  const spacing = busWidth / (data.ecus.length + 1);
  for (let i = 0; i < data.ecus.length; i++) {
    const ecu = data.ecus[i];
    const ecuColor = DIAGRAM.canEcuPalette[i % DIAGRAM.canEcuPalette.length];
    const x = 16 + spacing * (i + 1) - 44;
    const ecuGroup = createCanEcuNode(app, ecu.label, ecu.address, ecuColor, nodeStroke);
    ecuGroup.x = x;
    ecuGroup.y = busY + 14;
    ecuGroup.metadata = { diagramId: ecu.id };
    group.add(ecuGroup);
  }
  return group;
}
function createPipeline(app, stages, options = {}) {
  const group = createDiagramGroup(app, "processPipeline", { ...options, stages }, { name: "pipeline" });
  const canvas = readCanvasSize(options);
  const strokeCtx = strokeContextForCanvas(canvas.width, canvas.height);
  const edgeWidth = resolveStrokeWidth(DIAGRAM.stroke.edge, strokeCtx);
  const stageNodes = [];
  for (const stage of stages) {
    const node = createPipelineStage(app, stage.label, stage.status ?? "pending");
    node.metadata = { diagramId: stage.id, pipelineStatus: stage.status };
    group.add(node);
    stageNodes.push(node);
  }
  pipelineLayout(group, Math.max(8, Math.floor((canvas.width - 48) / Math.max(stages.length, 1) / 3)), 12, canvas.height);
  const edgeLayer = app.group({ zIndex: -10, listening: false });
  edgeLayer.metadata.diagramEdgeLayer = true;
  for (let i = 0; i < stageNodes.length - 1; i++) {
    edgeLayer.add(
      connectNodes(app, stageNodes[i], stageNodes[i + 1], [], {
        parent: group,
        style: "straight",
        stroke: DIAGRAM.edge,
        glowColor: DIAGRAM.edgeGlow,
        strokeWidth: edgeWidth,
        arrowEnd: "filled"
      })
    );
  }
  group.add(edgeLayer);
  return group;
}
function createDiagramFromProps(type, props, app) {
  switch (type) {
    case "flowchart":
      return createFlowchart(app, props.data, props);
    case "stateMachine":
      return createStateMachine(app, props.data, props);
    case "classDiagram":
      return createClassDiagram(app, props.data, props);
    case "mindMap":
      return createMindMap(
        app,
        props.center ?? "Topic",
        props.branches ?? [],
        props
      );
    case "networkTopology":
      return createNetworkDiagram(app, props.data, props);
    case "orgChart":
      return createOrgChart(app, props.root, props);
    case "electricalSchematic":
      return createSchematic(app, props.components ?? [], props);
    case "canNetwork":
      return createCanNetwork(app, props.data, props);
    case "processPipeline":
      return createPipeline(app, props.stages ?? [], props);
    default:
      return null;
  }
}

// src/diagram/registryCore.ts
var registry4 = {};
function registerDiagram(type, factory) {
  registry4[type] = factory;
}
function createDiagramFromJSON(type, props, app) {
  const factory = registry4[type];
  if (factory)
    return factory(props, app);
  return createDiagramFromProps(type, props, app);
}

// src/diagram/editor/collect.ts
function nodeDiagramId(node) {
  const id = node.metadata?.diagramId;
  if (id)
    return id;
  if (node.metadata?.orgNode) {
    const name = node.metadata?.orgName;
    return name ? `org:${name}` : void 0;
  }
  if (node.metadata?.pipelineStatus !== void 0) {
    return node.metadata.diagramId ?? void 0;
  }
  return void 0;
}
function isEditableDiagramNode(node) {
  return !!(node.metadata?.diagramId || node.metadata?.orgNode || node.metadata?.pipelineStatus !== void 0 || node.metadata?.symbolType);
}
function collectEditableNodes(root) {
  const out = [];
  const walk2 = (parent) => {
    for (const child of parent.children) {
      if (child.metadata?.isDiagramHitTarget)
        continue;
      if (child.metadata?.diagramEditorOverlay)
        continue;
      if (isEditableDiagramNode(child)) {
        out.push(child);
      }
      if ("children" in child && child.children?.length) {
        walk2(child);
      }
    }
  };
  walk2(root);
  return out;
}
function findEdgeLayer(root) {
  for (const child of root.children) {
    if (child.metadata?.diagramEdgeLayer)
      return child;
    if (child.zIndex === -10 && child.type === "group" && !child.metadata?.diagramId) {
      return child;
    }
  }
  return void 0;
}
function collectEdgesFromLayer(edgeLayer) {
  const edges = [];
  for (const child of edgeLayer.children) {
    const from = child.metadata?.edgeFrom;
    const to = child.metadata?.edgeTo;
    if (!from || !to)
      continue;
    edges.push({
      id: child.metadata?.edgeId ?? `${from}-${to}`,
      from,
      to,
      label: child.metadata?.edgeLabel,
      options: {
        style: child.metadata?.edgeStyle,
        stroke: child.metadata?.edgeStroke,
        strokeWidth: child.metadata?.edgeStrokeWidth,
        glowColor: child.metadata?.edgeGlow,
        arrowEnd: child.metadata?.edgeArrowEnd,
        arrowStart: child.metadata?.edgeArrowStart,
        dash: child.metadata?.edgeDash
      }
    });
  }
  return edges;
}
function findNodeByDiagramId(root, id) {
  return collectEditableNodes(root).find((n) => nodeDiagramId(n) === id);
}
function resolveEditableGroup(hit) {
  let cur = hit;
  while (cur) {
    if (isEditableDiagramNode(cur)) {
      return cur;
    }
    cur = cur.parent;
  }
  return void 0;
}

// src/diagram/editor/edgeWiring.ts
function attachEdgeHitTarget(app, edge) {
  if (edge.metadata?.edgeHitAttached)
    return;
  const poly = edge.children.find(
    (c) => c.type === "polyline" && c.metadata?.edgeHitPolyline !== true
  );
  const points = poly && "points" in poly ? poly.points ?? [] : [];
  if (points.length < 4)
    return;
  const hit = app.polyline({
    points,
    fill: null,
    stroke: "rgba(0,0,0,0.001)",
    strokeWidth: 14,
    lineJoin: "round",
    lineCap: "round",
    listening: true
  });
  hit.metadata.edgeHitPolyline = true;
  edge.add(hit);
  edge.listening = true;
  edge.metadata.edgeHitAttached = true;
}
function edgeAnchorPoint(root, from, to, end) {
  const anchors = getConnectorAnchors(from, to, root);
  if (end === "from")
    return { x: root.x + anchors.x1, y: root.y + anchors.y1 };
  return { x: root.x + anchors.x2, y: root.y + anchors.y2 };
}

// src/diagram/editor/labelEdit.ts
function showLabelEditor(app, node, onCommit) {
  const el = app["renderer"].getElement();
  const rect = el.getBoundingClientRect();
  const b = node.getBounds();
  const parent = node.parent;
  let wx = node.x + b.x;
  let wy = node.y + b.y;
  if (parent) {
    wx += parent.x;
    wy += parent.y;
  }
  const screen = app.camera.worldToScreen(wx, wy);
  const input = document.createElement("input");
  input.type = "text";
  input.value = extractLabel(node);
  Object.assign(input.style, {
    position: "fixed",
    left: `${rect.left + screen.x}px`,
    top: `${rect.top + screen.y}px`,
    minWidth: `${Math.max(80, b.width)}px`,
    padding: "4px 8px",
    fontSize: "12px",
    fontFamily: "Inter, system-ui, sans-serif",
    border: "2px solid #38bdf8",
    borderRadius: "6px",
    background: "#1e293b",
    color: "#f1f5f9",
    zIndex: "10000",
    outline: "none"
  });
  document.body.appendChild(input);
  input.focus();
  input.select();
  const commit = () => {
    const v = input.value.trim();
    if (v)
      onCommit(v);
    input.remove();
  };
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter")
      commit();
    if (e.key === "Escape")
      input.remove();
  });
  input.addEventListener("blur", commit);
}
function extractLabel(node) {
  for (const child of node.children) {
    if (child.type === "text" && "text" in child) {
      return child.text;
    }
  }
  return "";
}

// src/diagram/editor/reroute.ts
function rerouteDiagramEdges(app, root, edges) {
  const edgeLayer = findEdgeLayer(root);
  if (!edgeLayer)
    return;
  const records = edges ?? collectEdgesFromLayer(edgeLayer);
  const nodeMap = new Map(collectEditableNodes(root).map((n) => [n.metadata.diagramId, n]));
  for (const child of [...edgeLayer.children]) {
    edgeLayer.remove(child);
    child.destroy();
  }
  const obstacles = collectObstacles([...nodeMap.values()]);
  for (const edge of records) {
    const from = findNodeByDiagramId(root, edge.from) ?? nodeMap.get(edge.from);
    const to = findNodeByDiagramId(root, edge.to) ?? nodeMap.get(edge.to);
    if (!from || !to)
      continue;
    edgeLayer.add(
      connectNodes(app, from, to, obstacles, {
        parent: root,
        stroke: edge.options?.stroke ?? DIAGRAM.edge,
        glowColor: edge.options?.glowColor ?? DIAGRAM.edgeGlow,
        strokeWidth: edge.options?.strokeWidth ?? DIAGRAM.stroke.edge,
        label: edge.label,
        style: edge.options?.style ?? "smart",
        arrowEnd: edge.options?.arrowEnd ?? "filled",
        arrowStart: edge.options?.arrowStart ?? "none",
        dash: edge.options?.dash,
        edgeId: edge.id,
        fromId: edge.from,
        toId: edge.to
      })
    );
  }
  root.markDirty();
}
function syncPositionsToState(root) {
  const state = { ...root.metadata?.diagramState };
  const type = root.metadata?.diagramType;
  const nodes = collectEditableNodes(root);
  const positions = {};
  for (const n of nodes) {
    const id = n.metadata?.diagramId;
    if (!id)
      continue;
    positions[id] = { x: n.x, y: n.y, scaleX: n.scaleX, scaleY: n.scaleY };
  }
  state.editorPositions = positions;
  if (type === "flowchart" || type === "networkTopology") {
    const data = state.data;
    if (data?.nodes) {
      for (const n of data.nodes) {
        const p = positions[n.id];
        if (p) {
          n.x = p.x;
          n.y = p.y;
        }
      }
      state.data = data;
    }
  }
  if (type === "stateMachine") {
    const data = state.data;
    if (data?.states) {
      for (const s of data.states) {
        const p = positions[s.id];
        if (p) {
          s.x = p.x;
          s.y = p.y;
        }
      }
      state.data = data;
    }
  }
  if (type === "processPipeline") {
    const stages = state.stages;
    if (stages) {
      state.stages = stages.map((s) => {
        const p = positions[s.id];
        return p ? { ...s, x: p.x, y: p.y } : s;
      });
    }
  }
  root.metadata.diagramState = state;
}
function syncEdgesToState(root) {
  const edgeLayer = findEdgeLayer(root);
  if (!edgeLayer)
    return;
  const edges = collectEdgesFromLayer(edgeLayer);
  const state = { ...root.metadata?.diagramState };
  state.editorEdges = edges;
  const type = root.metadata?.diagramType;
  if (type === "flowchart" || type === "networkTopology") {
    const data = state.data;
    if (data) {
      data.edges = edges.map((e) => ({ from: e.from, to: e.to, label: e.label }));
      state.data = data;
    }
  }
  if (type === "stateMachine") {
    const data = state.data;
    if (data) {
      data.transitions = edges.map((e) => ({ from: e.from, to: e.to, label: e.label }));
      state.data = data;
    }
  }
  root.metadata.diagramState = state;
}

// src/diagram/editor/DiagramEditor.ts
var HANDLE = 8;
var DiagramEditor = class {
  constructor(app, root, options = {}) {
    this.tool = "select";
    this.selectedId = null;
    this.selectedEdgeId = null;
    this.connectFromId = null;
    this.previewLine = null;
    this.handlers = [];
    this.keyHandler = null;
    this.destroyed = false;
    this.app = app;
    this.root = root;
    this.options = { gridSize: 8, showPorts: true, ...options };
    this.tool = options.tool ?? "select";
    this.overlay = app.group({ zIndex: 1e3, listening: false });
    this.overlay.metadata.diagramEditorOverlay = true;
    app.stage.add(this.overlay);
    this.keyHandler = (e) => {
      if (e.key !== "Delete" && e.key !== "Backspace")
        return;
      if (!this.selectedEdgeId)
        return;
      e.preventDefault();
      this.deleteSelectedEdge();
    };
    window.addEventListener("keydown", this.keyHandler);
  }
  setTool(tool) {
    this.tool = tool;
    this.connectFromId = null;
    this.clearPreview();
    this.refreshOverlay();
  }
  getTool() {
    return this.tool;
  }
  selectNode(id) {
    this.selectedId = id;
    this.selectedEdgeId = null;
    this.refreshOverlay();
    this.app.requestRender();
  }
  selectEdge(id) {
    this.selectedEdgeId = id;
    this.selectedId = null;
    this.connectFromId = null;
    this.refreshOverlay();
    this.app.requestRender();
  }
  getSelectedEdgeId() {
    return this.selectedEdgeId;
  }
  getSelectedNodeId() {
    return this.selectedId;
  }
  reroute() {
    rerouteDiagramEdges(this.app, this.root);
  }
  wireNode(node) {
    const id = nodeDiagramId(node);
    if (!id)
      return;
    const onClick = (e) => {
      e.stopPropagation();
      if (this.tool === "connect") {
        if (!this.connectFromId) {
          this.connectFromId = id;
          this.selectNode(id);
        } else if (this.connectFromId !== id) {
          this.addEdge(this.connectFromId, id);
          this.connectFromId = null;
          this.selectNode(id);
        }
        return;
      }
      this.selectNode(id);
    };
    const onDblClick = (e) => {
      e.stopPropagation();
      showLabelEditor(this.app, node, (text) => {
        this.updateNodeLabel(node, text);
        this.emitChange();
        this.app.requestRender();
      });
    };
    const onDragMove = () => {
      const grid = this.options.gridSize ?? 0;
      if (grid > 0) {
        node.x = Math.round(node.x / grid) * grid;
        node.y = Math.round(node.y / grid) * grid;
      }
      rerouteDiagramEdges(this.app, this.root);
      this.refreshOverlay();
      this.app.requestRender();
    };
    const onDragEnd = () => {
      syncPositionsToState(this.root);
      this.wireEdges();
      this.emitChange();
    };
    node.on("click", onClick);
    node.on("dblclick", onDblClick);
    node.on("dragmove", onDragMove);
    node.on("dragend", onDragEnd);
    this.handlers.push(
      { node, type: "click", fn: onClick },
      { node, type: "dblclick", fn: onDblClick },
      { node, type: "dragmove", fn: onDragMove },
      { node, type: "dragend", fn: onDragEnd }
    );
  }
  wireEdges() {
    const edgeLayer = findEdgeLayer(this.root);
    if (!edgeLayer)
      return;
    for (const child of edgeLayer.children) {
      const from = child.metadata?.edgeFrom;
      const to = child.metadata?.edgeTo;
      if (!from || !to)
        continue;
      if (child.metadata?.edgeEditorWired)
        continue;
      attachEdgeHitTarget(this.app, child);
      const edgeId = child.metadata?.edgeId ?? `${from}-${to}`;
      const onClick = (e) => {
        e.stopPropagation();
        this.selectEdge(edgeId);
      };
      child.on("click", onClick);
      child.metadata.edgeEditorWired = true;
      this.handlers.push({ node: child, type: "click", fn: onClick });
    }
  }
  deleteSelectedEdge() {
    if (!this.selectedEdgeId)
      return;
    const edgeLayer = findEdgeLayer(this.root);
    if (!edgeLayer)
      return;
    const remaining = collectEdgesFromLayer(edgeLayer).filter((e) => e.id !== this.selectedEdgeId);
    rerouteDiagramEdges(this.app, this.root, remaining);
    syncEdgesToState(this.root);
    this.selectedEdgeId = null;
    this.wireEdges();
    this.refreshOverlay();
    this.emitChange();
    this.app.requestRender();
  }
  rewireEdgeEndpoint(edgeId, end, newNodeId) {
    const edgeLayer = findEdgeLayer(this.root);
    if (!edgeLayer)
      return;
    const edges = collectEdgesFromLayer(edgeLayer);
    const edge = edges.find((e) => e.id === edgeId);
    if (!edge)
      return;
    const nextFrom = end === "from" ? newNodeId : edge.from;
    const nextTo = end === "to" ? newNodeId : edge.to;
    if (nextFrom === nextTo)
      return;
    const updated = edges.map(
      (e) => e.id === edgeId ? { ...e, from: nextFrom, to: nextTo, id: `e_${nextFrom}_${nextTo}_${Date.now()}` } : e
    );
    rerouteDiagramEdges(this.app, this.root, updated);
    syncEdgesToState(this.root);
    this.selectedEdgeId = updated.find((e) => e.from === nextFrom && e.to === nextTo)?.id ?? null;
    this.wireEdges();
    this.refreshOverlay();
    this.emitChange();
    this.app.requestRender();
  }
  addEdge(from, to) {
    const edgeLayer = this.root.children.find((c) => c.metadata?.diagramEdgeLayer);
    if (!edgeLayer)
      return;
    const id = `e_${from}_${to}_${Date.now()}`;
    const fromNode = findNodeByDiagramId(this.root, from);
    const toNode = findNodeByDiagramId(this.root, to);
    if (!fromNode || !toNode)
      return;
    const obstacles = collectObstacles(collectEditableNodes(this.root));
    edgeLayer.add(
      connectNodes(this.app, fromNode, toNode, obstacles, {
        parent: this.root,
        stroke: DIAGRAM.edge,
        glowColor: DIAGRAM.edgeGlow,
        strokeWidth: DIAGRAM.stroke.edge,
        edgeId: id,
        fromId: from,
        toId: to
      })
    );
    syncEdgesToState(this.root);
    this.wireEdges();
    this.selectEdge(id);
    this.emitChange();
    this.app.requestRender();
  }
  updateNodeLabel(node, text) {
    for (const child of node.children) {
      if (child.type === "text" && "text" in child) {
        child.text = text;
        child.markDirty?.();
      }
    }
    const state = { ...this.root.metadata?.diagramState };
    const type = this.root.metadata?.diagramType;
    const id = node.metadata?.diagramId;
    if ((type === "flowchart" || type === "networkTopology") && state.data) {
      const data = state.data;
      const n = data.nodes.find((x) => x.id === id);
      if (n)
        n.label = text;
      state.data = data;
    }
    this.root.metadata.diagramState = state;
  }
  refreshOverlay() {
    this.overlay.clear();
    if (this.selectedEdgeId) {
      this.drawEdgeSelection(this.selectedEdgeId);
      return;
    }
    if (!this.selectedId)
      return;
    const node = findNodeByDiagramId(this.root, this.selectedId);
    if (!node)
      return;
    const b = node.getBounds();
    const wx = this.root.x + node.x + b.x;
    const wy = this.root.y + node.y + b.y;
    const w = b.width * node.scaleX;
    const h = b.height * node.scaleY;
    this.overlay.add(
      this.app.rect({
        x: wx - 3,
        y: wy - 3,
        width: w + 6,
        height: h + 6,
        fill: null,
        stroke: DIAGRAM.mindBranch.stroke,
        strokeWidth: 2,
        dash: [6, 4],
        listening: false
      })
    );
    if (this.tool === "select") {
      this.addResizeHandles(node, wx, wy, w, h);
    }
    if (this.tool === "connect" && this.options.showPorts) {
      this.addPorts(node, wx, wy, w, h);
    }
  }
  drawEdgeSelection(edgeId) {
    const edgeLayer = findEdgeLayer(this.root);
    if (!edgeLayer)
      return;
    const record = collectEdgesFromLayer(edgeLayer).find((e) => e.id === edgeId);
    if (!record)
      return;
    const fromNode = findNodeByDiagramId(this.root, record.from);
    const toNode = findNodeByDiagramId(this.root, record.to);
    if (!fromNode || !toNode)
      return;
    const fromPt = edgeAnchorPoint(this.root, fromNode, toNode, "from");
    const toPt = edgeAnchorPoint(this.root, fromNode, toNode, "to");
    this.overlay.add(
      this.app.line({
        x: fromPt.x,
        y: fromPt.y,
        x2: toPt.x,
        y2: toPt.y,
        stroke: DIAGRAM.mindBranch.stroke,
        strokeWidth: 3,
        dash: [8, 5],
        listening: false
      })
    );
    this.addEndpointHandle(fromPt.x, fromPt.y, "from", edgeId);
    this.addEndpointHandle(toPt.x, toPt.y, "to", edgeId);
  }
  addEndpointHandle(x, y, end, edgeId) {
    const handle = this.app.circle({
      x,
      y,
      radius: 6,
      fill: end === "to" ? DIAGRAM.edge : "#fff",
      stroke: DIAGRAM.mindBranch.stroke,
      strokeWidth: 2,
      listening: true
    });
    handle.metadata.diagramEditorOverlay = true;
    this.overlay.add(handle);
    let lastX = x;
    let lastY = y;
    wirePointerDrag(
      handle,
      (wx, wy) => {
        lastX = wx;
        lastY = wy;
        this.drawPreviewLine(x, y, wx, wy);
      },
      () => {
        this.clearPreview();
        const hit = this.app.hitTest(lastX, lastY)?.node;
        const target = resolveEditableGroup(hit);
        if (target) {
          const nodeId = nodeDiagramId(target);
          if (nodeId)
            this.rewireEdgeEndpoint(edgeId, end, nodeId);
        }
        this.app.requestRender();
      }
    );
  }
  addResizeHandles(node, x, y, w, h) {
    const corners = [
      { cx: x, cy: y },
      { cx: x + w, cy: y },
      { cx: x + w, cy: y + h },
      { cx: x, cy: y + h }
    ];
    const baseW = node.metadata.editorBaseW ?? w;
    const baseH = node.metadata.editorBaseH ?? h;
    const baseSx = node.metadata.editorBaseScaleX ?? 1;
    const baseSy = node.metadata.editorBaseScaleY ?? 1;
    for (const c of corners) {
      const handle = this.app.rect({
        x: c.cx - HANDLE / 2,
        y: c.cy - HANDLE / 2,
        width: HANDLE,
        height: HANDLE,
        fill: "#fff",
        stroke: DIAGRAM.mindBranch.stroke,
        strokeWidth: 1.5,
        listening: true,
        cornerRadius: 2
      });
      handle.metadata.diagramEditorOverlay = true;
      this.overlay.add(handle);
      wirePointerDrag(handle, (worldX, worldY) => {
        const cx = x + w / 2;
        const cy = y + h / 2;
        const halfW = Math.max(20, Math.abs(worldX - cx) * 2);
        const halfH = Math.max(16, Math.abs(worldY - cy) * 2);
        node.scaleX = Math.max(0.4, Math.min(3, halfW / baseW * baseSx));
        node.scaleY = Math.max(0.4, Math.min(3, halfH / baseH * baseSy));
        rerouteDiagramEdges(this.app, this.root);
        this.refreshOverlay();
        this.app.requestRender();
      }, () => {
        syncPositionsToState(this.root);
        this.wireEdges();
        this.emitChange();
      });
    }
  }
  addPorts(node, x, y, w, h) {
    const ports = [
      { px: x + w / 2, py: y },
      { px: x + w, py: y + h / 2 },
      { px: x + w / 2, py: y + h },
      { px: x, py: y + h / 2 }
    ];
    const fromId = nodeDiagramId(node);
    for (const p of ports) {
      const port = this.app.circle({
        x: p.px,
        y: p.py,
        radius: 5,
        fill: DIAGRAM.edge,
        stroke: "#fff",
        strokeWidth: 1.5,
        listening: true
      });
      port.metadata.diagramEditorOverlay = true;
      this.overlay.add(port);
      let lastX = p.px;
      let lastY = p.py;
      wirePointerDrag(
        port,
        (wx, wy) => {
          lastX = wx;
          lastY = wy;
          this.drawPreviewLine(p.px, p.py, wx, wy);
        },
        () => {
          this.clearPreview();
          const hit = this.app.hitTest(lastX, lastY)?.node;
          const target = resolveEditableGroup(hit);
          if (target && fromId) {
            const toId = nodeDiagramId(target);
            if (toId && toId !== fromId) {
              this.addEdge(fromId, toId);
              this.selectNode(toId);
            }
          }
          this.app.requestRender();
        }
      );
    }
  }
  drawPreviewLine(x1, y1, x2, y2) {
    this.clearPreview();
    this.previewLine = this.app.line({
      x: x1,
      y: y1,
      x2,
      y2,
      stroke: DIAGRAM.edge,
      strokeWidth: 2,
      dash: [6, 4],
      listening: false
    });
    this.previewLine.metadata.diagramEditorOverlay = true;
    this.overlay.add(this.previewLine);
    this.app.requestRender();
  }
  clearPreview() {
    if (this.previewLine) {
      this.overlay.remove(this.previewLine);
      this.previewLine.destroy();
      this.previewLine = null;
    }
  }
  emitChange() {
    this.options.onChange?.(this.root.metadata?.diagramState);
  }
  destroy() {
    if (this.destroyed)
      return;
    this.destroyed = true;
    if (this.keyHandler) {
      window.removeEventListener("keydown", this.keyHandler);
      this.keyHandler = null;
    }
    for (const h of this.handlers) {
      h.node.off(h.type, h.fn);
    }
    this.handlers = [];
    this.overlay.destroy();
    this.app.requestRender();
  }
};

// src/diagram/editor/hitTargets.ts
function attachNodeHitTarget(app, node) {
  if (node.metadata?.hitTargetAttached)
    return;
  const b = node.getBounds();
  const w = Math.max(b.width, 24);
  const h = Math.max(b.height, 24);
  const hit = app.rect({
    x: b.x,
    y: b.y,
    width: w,
    height: h,
    fill: "rgba(0,0,0,0.001)",
    stroke: null,
    listening: true
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
function ensureEditableHitTargets(app, root) {
  const walk2 = (parent) => {
    for (const child of parent.children) {
      if (isEditableDiagramNode(child)) {
        attachNodeHitTarget(app, child);
      }
      if ("children" in child && child.children?.length) {
        walk2(child);
      }
    }
  };
  walk2(root);
}
function tagEdgeLayer(root) {
  const walk2 = (parent) => {
    for (const child of parent.children) {
      if (child.zIndex === -10 && child.type === "group") {
        child.metadata.diagramEdgeLayer = true;
      }
    }
  };
  walk2(root);
}

// src/diagram/editor/index.ts
function installDiagramEditor(app, root, options = {}) {
  tagEdgeLayer(root);
  ensureEditableHitTargets(app, root);
  const editor = new DiagramEditor(app, root, options);
  for (const node of collectEditableNodes(root)) {
    editor.wireNode(node);
  }
  editor.wireEdges();
  root.metadata.diagramEditor = editor;
  return editor;
}
function uninstallDiagramEditor(root) {
  const editor = root.metadata?.diagramEditor;
  editor?.destroy();
  delete root.metadata.diagramEditor;
}

// src/diagram/index.ts
var Diagram = {
  flowchart: createFlowchart,
  stateMachine: createStateMachine,
  classDiagram: createClassDiagram,
  mindMap: createMindMap,
  network: createNetworkDiagram,
  orgChart: createOrgChart,
  schematic: createSchematic,
  canNetwork: createCanNetwork,
  pipeline: createPipeline,
  layout: layoutDiagram,
  route: routeConnector,
  forceLayout: forceDirectedLayout,
  toggleCollapse: toggleOrgCollapse,
  fitToBounds: fitDiagramToBounds,
  installEditor: installDiagramEditor,
  uninstallEditor: uninstallDiagramEditor
};

// src/modules/diagram/index.ts
var diagramPlugin = {
  name: "lightdraw-diagram",
  version: "1.0.0",
  install(LD) {
    registerJSONResolver((type, props, app) => createDiagramFromJSON(type, props, app));
    LD.registerDiagram = registerDiagram;
    LD.Diagram = Diagram;
  }
};

// src/index.ts
use(svgPlugin);
use(htmlPlugin);
use(uiPlugin);
use(automotivePlugin);
use(dashboardPlugin);
use(diagramPlugin);
var LightDrawFull = Object.assign(LightDraw, {
  SVGRenderer,
  HTMLRenderer,
  registerComponent,
  createComponentFromJSON,
  registerDashboard,
  createDashboardFromJSON,
  animateLiveValue,
  setLiveValue,
  updateChartProps,
  pushChartValue,
  installChartResizeObserver,
  detachChartResizeObserver,
  registerAutomotive,
  createAutomotiveFromJSON,
  applyDriveState,
  sampleDriveFrames,
  animateAutoValue,
  setAutoValue,
  installAutoWidgetResizeObserver,
  detachAutoWidgetResizeObserver,
  updateAutoWidgetProps,
  listAutomotiveWidgets,
  Diagram,
  applyUiTheme,
  resolveUiTheme,
  UI_PRESETS,
  UI_THEME_VAR_MAP
});
var src_default = LightDrawFull;
if (typeof window !== "undefined") {
  window.LightDraw = LightDrawFull;
}
export {
  AnimationEngine,
  App,
  Arc,
  Camera,
  CanvasRenderer,
  Circle,
  Diagram,
  Ellipse,
  EventEmitter,
  Group,
  HTMLRenderer,
  ImageNode,
  Layer,
  Layout,
  LightDrawFull as LightDraw,
  LightDrawFull,
  Line,
  Matrix2D,
  Node,
  ObjectPool,
  Path,
  Polygon,
  Polyline,
  Rect,
  Renderer,
  RoundedRect,
  SVGRenderer,
  Sprite,
  Star,
  TextNode,
  Timeline,
  UI_PRESETS,
  UI_THEME_VAR_MAP,
  VERSION,
  animate,
  animateAutoValue,
  animateLiveValue,
  applyDriveState,
  applyUiTheme,
  automotivePlugin,
  createApp,
  createAutomotiveFromJSON,
  createComponentFromJSON,
  createDashboardFromJSON,
  createPluginContext,
  dashboardPlugin,
  src_default as default,
  detachAutoWidgetResizeObserver,
  detachChartResizeObserver,
  detectBestRenderer,
  diagramPlugin,
  downloadExport,
  easings,
  exportApp,
  exportScene,
  fromJSON,
  getEasing,
  getInstalledPlugins,
  htmlPlugin,
  installAutoWidgetResizeObserver,
  installChartResizeObserver,
  listAutomotiveWidgets,
  parallel,
  pushChartValue,
  registerAutomotive,
  registerComponent,
  registerDashboard,
  registerEasing,
  registerJSONType,
  resolveUiTheme,
  sampleDriveFrames,
  scenesEqual,
  setAutoValue,
  setLiveValue,
  svgPlugin,
  toJSON,
  uiPlugin,
  updateAutoWidgetProps,
  updateChartProps,
  use,
  validateSceneJSON
};
//# sourceMappingURL=lightdraw.esm.js.map
