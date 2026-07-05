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
    if (dist > this.radius)
      return false;
    let angle = Math.atan2(dy, dx);
    if (angle < 0)
      angle += Math.PI * 2;
    return angle >= this.startAngle && angle <= this.endAngle;
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
    ctx.beginPath();
    ctx.arc(
      node.radius,
      node.radius,
      node.radius,
      node.startAngle,
      node.endAngle,
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
        passive: type === "touchmove" || type === "wheel"
      });
    }
  }
  destroy() {
    for (const type in this.boundHandlers) {
      this.element.removeEventListener(type, this.boundHandlers[type]);
    }
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
      const dx = world.x - this.dragState.startX;
      const dy = world.y - this.dragState.startY;
      this.dragState.node.x = this.dragState.nodeStartX + dx;
      this.dragState.node.y = this.dragState.nodeStartY + dy;
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
        if (target.draggable) {
          this.dragState = {
            node: target,
            startX: world.x,
            startY: world.y,
            nodeStartX: target.x,
            nodeStartY: target.y,
            payload: target.dragPayload ?? target.metadata?.dragPayload,
            overNode: null
          };
          this.dispatchBubble(
            target,
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
      this.app.camera.pan(wheelEvent.deltaX / this.app.camera.zoom, wheelEvent.deltaY / this.app.camera.zoom);
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
  const group = app.group({
    ...props,
    listening: true,
    metadata: {
      widgetType: type,
      widgetState: { ...props }
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
  const group = app.group({
    ...props,
    metadata: {
      autoType: type,
      autoPart: autoPart ?? type,
      autoState: { ...props }
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
function needleAngle(value, max) {
  return Math.PI * 0.75 + clamp4(value, 0, max) / max * (Math.PI * 1.5);
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
function createNodeBox(app, label, width, height, style = {}) {
  const node = app.group();
  node.add(
    app.roundedRect({
      width,
      height,
      cornerRadius: style.cornerRadius ?? 4,
      fill: style.fill ?? "#dbeafe",
      stroke: style.stroke ?? "#2563eb",
      strokeWidth: 1
    })
  );
  node.add(
    app.text({
      text: label,
      x: Math.max(8, width / 2 - label.length * 3),
      y: height / 2 - 7,
      fontSize: 12,
      fill: "#1e40af"
    })
  );
  return node;
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
      highContrast: this.highContrast
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
var VERSION = "0.9.0";
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

// src/renderers/HTMLRenderer.ts
var HTMLRenderer = class extends Renderer {
  constructor() {
    super(...arguments);
    this.nodeElements = /* @__PURE__ */ new Map();
    this.innerContainers = /* @__PURE__ */ new Map();
    this.seenIds = /* @__PURE__ */ new Set();
  }
  init(container, options) {
    this.width = options.width;
    this.height = options.height;
    this.background = options.background;
    this.highContrast = options.highContrast ?? false;
    this.root = document.createElement("div");
    this.root.className = "lightdraw-html-root";
    this.applyRootStyles();
    container.appendChild(this.root);
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
    } else {
      this.root.classList.remove("lightdraw-high-contrast");
    }
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
  syncGroup(group, parent) {
    group.sortChildren();
    for (const child of group.children) {
      if (!child.visible)
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
  syncNativeField(node, parent, kind) {
    let el = this.nodeElements.get(node.id);
    const state = node.metadata?.componentState ?? {};
    const width = state.width ?? 200;
    const height = state.height ?? (kind === "textarea" ? 80 : 32);
    const value = state.value ?? "";
    const placeholder = state.placeholder ?? "";
    if (!el) {
      el = kind === "textarea" ? document.createElement("textarea") : document.createElement("input");
      el.id = node.id;
      el.className = `lightdraw-native-${kind}`;
      if (kind === "input")
        el.type = "text";
      parent.appendChild(el);
      el.addEventListener("input", () => {
        const v = el.value;
        node.metadata.componentState = { ...state, value: v };
        node.emit("input", syntheticEvent("input", node, { value: v }));
        node.getApp()?.requestRender();
      });
      el.addEventListener("change", () => {
        const v = el.value;
        node.metadata.componentState = { ...state, value: v };
        node.emit("change", syntheticEvent("change", node, { value: v }));
      });
      el.addEventListener("focus", () => node.getApp()?.focusNode(node));
      this.nodeElements.set(node.id, el);
    }
    this.applyA11y(node, el);
    el.style.cssText = `
      position: absolute;
      left: ${node.x}px;
      top: ${node.y}px;
      width: ${width}px;
      height: ${height}px;
      opacity: ${node.opacity};
      font: 14px system-ui, sans-serif;
      padding: 6px 8px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      pointer-events: ${node.listening ? "auto" : "none"};
    `;
    el.value = value;
    el.placeholder = placeholder;
    if (node.focusable) {
      el.tabIndex = node.id === this.focusedNodeId ? 0 : -1;
    }
    this.seenIds.add(node.id);
  }
  syncNode(node, parent) {
    const componentType = node.metadata?.componentType;
    if (componentType === "input" || componentType === "textarea") {
      this.syncNativeField(node, parent, componentType);
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
      ${extra}
    `;
    this.applyShapeStyles(node, el);
    this.seenIds.add(node.id);
    if ("children" in node) {
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
    } else if (node instanceof Path) {
      const b = node.getBounds();
      el.style.width = `${Math.max(b.width, 1)}px`;
      el.style.height = `${Math.max(b.height, 1)}px`;
      el.style.background = this.fillToCss(node.fill);
      el.style.border = node.stroke ? `${node.strokeWidth}px solid ${this.strokeToCss(node.stroke)}` : "none";
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
registerComponent("button", (props, app) => {
  const width = num(props, "width", 120);
  const height = num(props, "height", 36);
  const label = str(props, "label", "Button");
  const disabled = bool(props, "disabled", false);
  const fill = str(props, "fill", "#2563eb");
  const group = createGroup(app, "button", props, {
    focusable: !disabled,
    role: "button",
    metadata: { componentType: "button", label, componentState: { label, width, height, disabled, fill } }
  });
  setState(group, { label, width, height, disabled, fill });
  const bg = app.roundedRect({ width, height, cornerRadius: 6, fill, stroke: null });
  const text = app.text({
    text: label,
    fontSize: 14,
    fill: "#ffffff",
    x: width / 2 - label.length * 3.5,
    y: height / 2 - 7
  });
  group.add(bg, text);
  setParts(group, { bg, text });
  wireButtonStates(group, ({ hover, active, disabled: dis }) => {
    const parts = getParts(group);
    const base = dis ? "#9ca3af" : fill;
    parts.bg.fill = dis ? "#9ca3af" : active ? "#1d4ed8" : hover ? "#1e40af" : base;
    group.getApp()?.requestRender();
  });
  return group;
});
registerComponent("label", (props, app) => {
  const node = app.text({
    text: str(props, "text", ""),
    fontSize: num(props, "fontSize", 14),
    fill: str(props, "color", "#333"),
    ...props
  });
  node.metadata.componentType = "label";
  setState(node, { text: str(props, "text", ""), fontSize: num(props, "fontSize", 14) });
  return node;
});
registerComponent("card", (props, app) => {
  const width = num(props, "width", 280);
  const height = num(props, "height", 160);
  const group = createGroup(app, "card", props);
  const bg = app.roundedRect({
    width,
    height,
    cornerRadius: 8,
    fill: "#ffffff",
    stroke: "#e5e7eb",
    strokeWidth: 1,
    shadow: { color: "rgba(0,0,0,0.1)", blur: 8, offsetX: 0, offsetY: 2 }
  });
  group.add(bg);
  if (props.title) {
    group.add(
      app.text({
        text: props.title,
        fontSize: 16,
        fontWeight: "bold",
        fill: "#111",
        x: 16,
        y: 16
      })
    );
  }
  setState(group, { width, height, title: props.title });
  return group;
});
registerComponent("progressBar", (props, app) => {
  const width = num(props, "width", 200);
  const height = num(props, "height", 8);
  const value = clamp2(num(props, "value", 0), 0, 100);
  const group = createGroup(app, "progressBar", props, {
    role: "progressbar",
    ariaValueNow: value,
    ariaValueMin: 0,
    ariaValueMax: 100
  });
  const track = app.roundedRect({ width, height, cornerRadius: height / 2, fill: "#e5e7eb" });
  const fillBar = app.roundedRect({
    width: width * value / 100,
    height,
    cornerRadius: height / 2,
    fill: str(props, "fill", "#2563eb")
  });
  group.add(track, fillBar);
  setParts(group, { track, fillBar });
  setState(group, { width, height, value });
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
  const track = app.rect({ width, height: 4, y: 8, fill: "#e5e7eb", listening: false });
  const fill = app.rect({ width: 0, height: 4, y: 8, fill: "#2563eb", listening: false });
  const thumb = app.circle({ x: 0, y: 0, radius: 8, fill: "#2563eb" });
  group.add(track, fill, thumb);
  setParts(group, { track, fill, thumb });
  const updateVisual = (v) => {
    const pct = (v - min) / (max - min);
    fill.width = width * pct;
    thumb.x = width * pct - 8;
    group.ariaValueNow = v;
    group.getApp()?.requestRender();
  };
  updateVisual(value);
  setState(group, { width, min, max, value });
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
  const group = createGroup(app, "checkbox", props, {
    focusable: true,
    role: "checkbox",
    ariaChecked: checked,
    metadata: { componentType: "checkbox", label: props.label ?? "Checkbox" }
  });
  const box = app.roundedRect({
    width: 18,
    height: 18,
    cornerRadius: 3,
    fill: checked ? "#2563eb" : "#fff",
    stroke: "#9ca3af",
    strokeWidth: 1,
    listening: false
  });
  group.add(box);
  if (props.label) {
    group.add(app.text({ text: props.label, x: 26, y: 1, fontSize: 14, fill: "#333", listening: false }));
  }
  setParts(group, { box });
  setState(group, { checked, label: props.label });
  wireToggle(group, "checked", (v) => {
    box.fill = v ? "#2563eb" : "#fff";
    group.ariaChecked = v;
  });
  return group;
});
registerComponent("toggle", (props, app) => {
  const on = bool(props, "value", false);
  const group = createGroup(app, "toggle", props, {
    focusable: true,
    role: "switch",
    ariaChecked: on,
    metadata: { componentType: "toggle", label: props.label ?? "Toggle" }
  });
  const track = app.roundedRect({ width: 44, height: 24, cornerRadius: 12, fill: on ? "#2563eb" : "#d1d5db", listening: false });
  const knob = app.circle({ x: on ? 22 : 2, y: 2, radius: 10, fill: "#fff", listening: false });
  group.add(track, knob);
  setParts(group, { track, knob });
  setState(group, { value: on, label: props.label });
  wireToggle(group, "value", (v) => {
    track.fill = v ? "#2563eb" : "#d1d5db";
    knob.x = v ? 22 : 2;
    group.ariaChecked = v;
  });
  return group;
});
registerComponent("input", (props, app) => {
  const width = num(props, "width", 200);
  const height = num(props, "height", 32);
  const value = str(props, "value", "");
  const placeholder = str(props, "placeholder", "");
  const group = createGroup(app, "input", props, {
    focusable: true,
    role: "textbox",
    metadata: { componentType: "input", label: props.label ?? (placeholder || "Input") }
  });
  const bg = app.roundedRect({ width, height, cornerRadius: 4, fill: "#fff", stroke: "#d1d5db", strokeWidth: 1, listening: false });
  const text = app.text({ text: value || placeholder, fontSize: 14, fill: value ? "#111" : "#9ca3af", x: 8, y: 8, listening: false });
  group.add(bg, text);
  setParts(group, { bg, text });
  setState(group, { width, height, value, placeholder });
  return group;
});
registerComponent("textarea", (props, app) => {
  const width = num(props, "width", 240);
  const height = num(props, "height", 80);
  const value = str(props, "value", "");
  const group = createGroup(app, "textarea", props, {
    focusable: true,
    role: "textbox",
    metadata: { componentType: "textarea", multiline: true }
  });
  const bg = app.roundedRect({ width, height, cornerRadius: 4, fill: "#fff", stroke: "#d1d5db", strokeWidth: 1, listening: false });
  const text = app.text({ text: value || str(props, "placeholder", ""), fontSize: 14, fill: "#111", x: 8, y: 8, listening: false });
  group.add(bg, text);
  setParts(group, { bg, text });
  setState(group, { width, height, value, rows: num(props, "rows", 4) });
  return group;
});
registerComponent("radio", (props, app) => {
  const selected = bool(props, "selected", false);
  const groupName = str(props, "group", "default");
  const group = createGroup(app, "radio", props, {
    focusable: true,
    role: "radio",
    ariaChecked: selected,
    metadata: { componentType: "radio", group: groupName, label: props.label }
  });
  const outer = app.circle({ x: 9, y: 9, radius: 9, fill: "#fff", stroke: "#9ca3af", strokeWidth: 1, listening: false });
  const inner = app.circle({ x: 9, y: 9, radius: 5, fill: selected ? "#2563eb" : "transparent", listening: false });
  group.add(outer, inner);
  if (props.label) {
    group.add(app.text({ text: props.label, x: 26, y: 1, fontSize: 14, fill: "#333", listening: false }));
  }
  setParts(group, { outer, inner });
  setState(group, { selected, group: groupName, label: props.label });
  group.on("click", () => {
    setState(group, { selected: true });
    group.ariaChecked = true;
    inner.fill = "#2563eb";
    group.emit("change", syntheticEvent("change", group, { value: groupName, payload: groupName }));
    group.getApp()?.requestRender();
  });
  return group;
});
registerComponent("tooltip", (props, app) => {
  const text = str(props, "text", "Tooltip");
  const group = createGroup(app, "tooltip", props, { visible: bool(props, "visible", false), listening: true });
  const pad = 8;
  const tw = text.length * 7 + pad * 2;
  const bg = app.roundedRect({ width: tw, height: 28, cornerRadius: 4, fill: "#1f2937", listening: false });
  const label = app.text({ text, fontSize: 12, fill: "#fff", x: pad, y: 6, listening: false });
  group.add(bg, label);
  setState(group, { text, visible: group.visible });
  group.on("mouseenter", () => {
    group.visible = true;
    group.getApp()?.requestRender();
    group.emit("open", syntheticEvent("open", group));
  });
  group.on("mouseleave", () => {
    group.visible = false;
    group.getApp()?.requestRender();
    group.emit("close", syntheticEvent("close", group));
  });
  return group;
});
registerComponent("menu", (props, app) => {
  const items = props.items ?? ["Item 1", "Item 2", "Item 3"];
  const open = bool(props, "open", false);
  const rowH = 28;
  const width = num(props, "width", 160);
  const height = items.length * rowH + 8;
  const group = createGroup(app, "menu", props, {
    focusable: true,
    role: "menu",
    visible: open,
    metadata: { componentType: "menu", label: props.label ?? "Menu" }
  });
  const bg = app.roundedRect({ width, height, cornerRadius: 6, fill: "#fff", stroke: "#e5e7eb", strokeWidth: 1, listening: false });
  group.add(bg);
  items.forEach((item, i) => {
    group.add(app.text({ text: item, x: 12, y: 10 + i * rowH, fontSize: 14, fill: "#111", listening: false }));
  });
  setState(group, { items, open, width, selectedIndex: -1 });
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
  const overlay = app.rect({ width: num(props, "overlayWidth", 800), height: num(props, "overlayHeight", 600), fill: "rgba(0,0,0,0.4)", x: -num(props, "x", 0), y: -num(props, "y", 0), listening: true });
  const panel = app.roundedRect({ width, height, cornerRadius: 8, fill: "#fff", stroke: "#e5e7eb", strokeWidth: 1, x: 0, y: 0 });
  const titleText = app.text({ text: title, fontSize: 16, fontWeight: "bold", fill: "#111", x: 16, y: 16 });
  group.add(overlay, panel, titleText);
  setParts(group, { overlay, panel, titleText });
  setState(group, { open, title, width, height });
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
  labels.forEach((label, i) => {
    const tab = app.group({ x: i * tabW, y: 0, listening: true, focusable: true, metadata: { tabIndex: i } });
    tab.add(
      app.rect({ width: tabW, height: 32, fill: i === activeTab ? "#2563eb" : "#e5e7eb", listening: false }),
      app.text({ text: label, fontSize: 13, fill: i === activeTab ? "#fff" : "#333", x: 12, y: 8, listening: false })
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
    const y = i * 40;
    const header = app.group({ x: 0, y, listening: true, focusable: true });
    header.add(
      app.rect({ width: num(props, "width", 280), height: 36, fill: "#f3f4f6", stroke: "#e5e7eb", strokeWidth: 1, listening: false }),
      app.text({ text: sec.title, fontSize: 14, fill: "#111", x: 12, y: 10, listening: false })
    );
    header.on("click", () => {
      setState(group, { expandedIndex: i });
      group.emit("change", syntheticEvent("change", group, { value: i, section: sec.title }));
      group.getApp()?.requestRender();
    });
    group.add(header);
    if (i === expanded) {
      group.add(app.text({ text: sec.content, x: 12, y: y + 40, fontSize: 13, fill: "#555", listening: false }));
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
  const rowH = 28;
  const group = createGroup(app, "table", props, { focusable: true, role: "grid" });
  columns.forEach((col, ci) => {
    group.add(app.text({ text: col, x: ci * colW + 8, y: 4, fontSize: 13, fontWeight: "bold", fill: "#111", listening: false }));
  });
  rows.forEach((row, ri) => {
    const rowGroup = app.group({ x: 0, y: (ri + 1) * rowH, listening: true, metadata: { rowIndex: ri } });
    row.forEach((cell, ci) => {
      rowGroup.add(app.text({ text: cell, x: ci * colW + 8, y: 4, fontSize: 13, fill: "#333", listening: false }));
    });
    rowGroup.on("click", () => {
      setState(group, { selectedRow: ri });
      group.emit("select", syntheticEvent("select", group, { index: ri, row }));
      group.getApp()?.requestRender();
    });
    group.add(rowGroup);
  });
  setState(group, { columns, rows, selectedRow: -1 });
  return group;
});
registerComponent("tree", (props, app) => {
  const nodes = props.nodes ?? [
    { label: "Root", children: [{ label: "Child A" }, { label: "Child B" }] }
  ];
  const expanded = /* @__PURE__ */ new Set([0]);
  const group = createGroup(app, "tree", props, { focusable: true, role: "tree" });
  let y = 0;
  nodes.forEach((node, i) => {
    const header = app.group({ x: 0, y, listening: true });
    header.add(app.text({ text: (expanded.has(i) ? "\u25BC " : "\u25B6 ") + node.label, fontSize: 14, fill: "#111", listening: false }));
    header.on("click", () => {
      if (expanded.has(i))
        expanded.delete(i);
      else
        expanded.add(i);
      setState(group, { expanded: Array.from(expanded) });
      group.emit("change", syntheticEvent("change", group, { value: i }));
      group.getApp()?.requestRender();
    });
    group.add(header);
    y += 24;
    if (expanded.has(i) && node.children) {
      node.children.forEach((child) => {
        group.add(app.text({ text: "    " + child.label, x: 0, y, fontSize: 13, fill: "#555", listening: false }));
        y += 22;
      });
    }
  });
  setState(group, { nodes, expanded: Array.from(expanded) });
  return group;
});
registerComponent("toolbar", (props, app) => {
  const buttons = props.buttons ?? ["New", "Open", "Save"];
  const group = createGroup(app, "toolbar", props, { focusable: true, role: "toolbar" });
  let x = 0;
  buttons.forEach((label) => {
    const btn = createGroup(app, "button", { label, width: 72, height: 28 }, { x, y: 0, focusable: true, role: "button" });
    btn.add(
      app.roundedRect({ width: 72, height: 28, cornerRadius: 4, fill: "#f3f4f6", stroke: "#d1d5db", strokeWidth: 1, listening: false }),
      app.text({ text: label, fontSize: 12, fill: "#111", x: 10, y: 7, listening: false })
    );
    btn.on("click", () => {
      group.emit("select", syntheticEvent("select", group, { item: label }));
    });
    group.add(btn);
    x += 76;
  });
  setState(group, { buttons });
  return group;
});
registerComponent("toast", (props, app) => {
  const message = str(props, "message", "Notification");
  const duration = num(props, "duration", 3e3);
  const group = createGroup(app, "toast", props, {
    role: "status",
    ariaLive: "polite",
    metadata: { componentType: "toast", ariaLive: "polite" }
  });
  const tw = message.length * 7 + 24;
  group.add(
    app.roundedRect({ width: tw, height: 36, cornerRadius: 6, fill: "#1f2937", listening: false }),
    app.text({ text: message, fontSize: 13, fill: "#fff", x: 12, y: 10, listening: false })
  );
  setState(group, { message, duration });
  group.emit("open", syntheticEvent("open", group));
  scheduleAutoDismiss(group, duration, () => {
    group.visible = false;
  });
  return group;
});
registerComponent("statusBar", (props, app) => {
  const segments = props.segments ?? ["Ready", "Line 1", "UTF-8"];
  const width = num(props, "width", 400);
  const group = createGroup(app, "statusBar", props, { role: "status" });
  group.add(app.rect({ width, height: 24, fill: "#f3f4f6", stroke: "#e5e7eb", strokeWidth: 1, listening: false }));
  const segW = width / segments.length;
  segments.forEach((seg, i) => {
    group.add(app.text({ text: seg, x: i * segW + 8, y: 5, fontSize: 12, fill: "#555", listening: false }));
  });
  setState(group, { segments, width });
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

// src/dashboard/registryCore.ts
var registry2 = {};
function registerDashboard(type, factory) {
  registry2[type] = factory;
}
function createDashboardFromJSON(type, props, app) {
  const factory = registry2[type];
  return factory ? factory(props, app) : null;
}

// src/dashboard/chartPrimitives.ts
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
function defaultLayout(width, height, padding = 30) {
  return {
    plotX: padding,
    plotY: 10,
    plotWidth: width - padding - 10,
    plotHeight: height - padding - 10
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
        x2: layout.plotX + layout.plotWidth,
        y2: y,
        stroke: "#374151",
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
        x2: x,
        y2: layout.plotY + layout.plotHeight,
        stroke: "#374151",
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
      x2: layout.plotX,
      y2: layout.plotY + layout.plotHeight,
      stroke: "#9ca3af",
      strokeWidth: 1,
      listening: false
    })
  );
  group.add(
    app.line({
      x: layout.plotX,
      y: layout.plotY + layout.plotHeight,
      x2: layout.plotX + layout.plotWidth,
      y2: layout.plotY + layout.plotHeight,
      stroke: "#9ca3af",
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
        fill: "#9ca3af",
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
      app.text({ text: item.label, x: x + 16, y: ly - 1, fontSize: 11, fill: "#d1d5db", listening: false })
    );
  });
}
function nearestDataIndex(data, layout, localX) {
  const step = layout.plotWidth / Math.max(data.length - 1, 1);
  const idx = Math.round((localX - layout.plotX) / step);
  return Math.max(0, Math.min(data.length - 1, idx));
}
function wireChartInteraction(group, data, layout, tooltip, tooltipLabel) {
  group.on("mousemove", (e) => {
    const localX = e.worldX - group.x;
    const idx = nearestDataIndex(data, layout, localX);
    const pts = seriesToPoints(data, layout, dataBounds(data));
    const px = pts[idx * 2];
    const py = pts[idx * 2 + 1];
    tooltip.x = px - 20;
    tooltip.y = py - 28;
    tooltip.visible = true;
    tooltipLabel.text = String(data[idx]);
    group.emit("hover", syntheticEvent("hover", group, { index: idx, value: data[idx] }));
    group.getApp()?.requestRender();
  });
  group.on("mouseleave", () => {
    tooltip.visible = false;
    group.getApp()?.requestRender();
  });
  group.on("click", (e) => {
    const idx = nearestDataIndex(data, layout, e.worldX - group.x);
    group.emit("select", syntheticEvent("select", group, { index: idx, value: data[idx] }));
  });
}

// src/dashboard/definitions.ts
function gaugeNeedleAngle(value, max) {
  const startAngle = Math.PI * 0.75;
  const sweep = Math.PI * 1.5;
  return startAngle + value / max * sweep;
}
function buildDataChart(group, app, props, filled) {
  const width = num2(props, "width", 300);
  const height = num2(props, "height", 150);
  const data = props.data ?? [10, 30, 20, 50, 40, 60];
  const layout = defaultLayout(width, height);
  const minY = props.minY;
  const maxY = props.maxY;
  const bounds = dataBounds(
    data,
    typeof minY === "number" ? minY : void 0,
    typeof maxY === "number" ? maxY : void 0
  );
  const yTicks = computeTicks(bounds.min, bounds.max, num2(props, "tickCount", 5));
  group.add(
    app.rect({ width, height, fill: "#1f2937", stroke: "#374151", strokeWidth: 1, listening: true })
  );
  addGridLines(app, group, layout, yTicks, bounds);
  addAxes(app, group, layout, bounds, yTicks);
  const points = seriesToPoints(data, layout, bounds);
  const baselineY = layout.plotY + layout.plotHeight;
  if (filled) {
    group.add(
      app.path({
        d: areaPathFromPoints(points, baselineY),
        fill: "rgba(59, 130, 246, 0.35)",
        stroke: null,
        listening: false
      })
    );
  }
  group.add(
    app.polyline({ points, fill: null, stroke: "#3b82f6", strokeWidth: 2, listening: false })
  );
  if (props.showLegend !== false) {
    addLegend(
      app,
      group,
      [{ label: str2(props, "seriesLabel", "Series"), color: "#3b82f6" }],
      width - 90,
      8
    );
  }
  const tooltip = app.roundedRect({
    width: 40,
    height: 22,
    cornerRadius: 4,
    fill: "#111827",
    visible: false,
    listening: false
  });
  const tooltipLabel = app.text({ text: "", fontSize: 11, fill: "#fff", x: 8, y: 4, listening: false });
  group.add(tooltip, tooltipLabel);
  if (props.interactive !== false) {
    wireChartInteraction(group, data, layout, tooltip, tooltipLabel);
  }
  setState2(group, { width, height, data, filled, tickCount: num2(props, "tickCount", 5) });
}
registerDashboard("gauge", (props, app) => {
  const size = num2(props, "size", 120);
  const max = num2(props, "max", 100);
  const value = clamp3(num2(props, "value", 0), 0, max);
  const group = createWidgetGroup(app, "gauge", props, { width: size, height: size });
  const cx = size / 2;
  const r = size / 2 - 10;
  const startAngle = Math.PI * 0.75;
  const endAngle = Math.PI * 2.25;
  group.add(
    new Arc({
      x: 0,
      y: 0,
      radius: r,
      startAngle,
      endAngle,
      fill: null,
      stroke: "#e5e7eb",
      strokeWidth: 8,
      listening: false
    })
  );
  const angle = gaugeNeedleAngle(value, max);
  const needle = app.line({
    x: cx,
    y: cx,
    x2: cx + r * 0.8 * Math.cos(angle),
    y2: cx + r * 0.8 * Math.sin(angle),
    stroke: "#2563eb",
    strokeWidth: 3,
    listening: false
  });
  const valueText = app.text({
    text: String(Math.round(value)),
    x: cx - 15,
    y: cx + 10,
    fontSize: 18,
    fontWeight: "bold",
    fill: "#111",
    ariaLive: "polite",
    listening: false
  });
  group.add(needle, app.circle({ x: cx - 5, y: cx - 5, radius: 5, fill: "#2563eb", listening: false }), valueText);
  setParts2(group, { needle, valueText });
  setRefresh(group, (v) => {
    const a = gaugeNeedleAngle(v, max);
    needle.x2 = cx + r * 0.8 * Math.cos(a);
    needle.y2 = cx + r * 0.8 * Math.sin(a);
    valueText.text = String(Math.round(v));
  });
  setState2(group, { size, value, max });
  return group;
});
registerDashboard("speedometer", (props, app) => {
  const size = num2(props, "size", 200);
  const value = num2(props, "value", 0);
  const max = num2(props, "max", 180);
  const group = createWidgetGroup(app, "speedometer", props);
  const cx = size / 2;
  const r = size / 2 - 15;
  group.add(
    new Arc({
      x: cx - r,
      y: cx - r,
      radius: r,
      startAngle: Math.PI * 0.75,
      endAngle: Math.PI * 2.25,
      fill: null,
      stroke: "#374151",
      strokeWidth: 12,
      listening: false
    })
  );
  const angle = gaugeNeedleAngle(value, max);
  const needle = app.line({
    x: cx,
    y: cx,
    x2: cx + r * 0.85 * Math.cos(angle),
    y2: cx + r * 0.85 * Math.sin(angle),
    stroke: "#ef4444",
    strokeWidth: 4,
    listening: false
  });
  const speedText = app.text({
    text: `${Math.round(value)}`,
    x: cx - 20,
    y: cx + 20,
    fontSize: 24,
    fontWeight: "bold",
    fill: "#fff",
    listening: false
  });
  group.add(
    needle,
    app.circle({ x: cx - 6, y: cx - 6, radius: 6, fill: "#ef4444", listening: false }),
    speedText,
    app.text({ text: "km/h", x: cx - 15, y: cx + 45, fontSize: 12, fill: "#9ca3af", listening: false })
  );
  setRefresh(group, (v) => {
    const a = gaugeNeedleAngle(v, max);
    needle.x2 = cx + r * 0.85 * Math.cos(a);
    needle.y2 = cx + r * 0.85 * Math.sin(a);
    speedText.text = `${Math.round(v)}`;
  });
  setState2(group, { size, value, max });
  return group;
});
registerDashboard("lineChart", (props, app) => {
  const group = createWidgetGroup(app, "lineChart", props);
  buildDataChart(group, app, props, false);
  return group;
});
registerDashboard("areaChart", (props, app) => {
  const group = createWidgetGroup(app, "areaChart", props);
  buildDataChart(group, app, props, true);
  return group;
});
registerDashboard("legend", (props, app) => {
  const group = createWidgetGroup(app, "legend", props);
  const items = props.items ?? [
    { label: "Series A", color: "#3b82f6" },
    { label: "Series B", color: "#ef4444" }
  ];
  addLegend(app, group, items, 0, 0);
  setState2(group, { items });
  return group;
});
registerDashboard("barChart", (props, app) => {
  const width = num2(props, "width", 300);
  const height = num2(props, "height", 150);
  const data = props.data ?? [30, 50, 40, 70, 60];
  const group = createWidgetGroup(app, "barChart", props);
  const layout = defaultLayout(width, height);
  const bounds = dataBounds(data);
  const yTicks = computeTicks(bounds.min, bounds.max, 5);
  group.add(app.rect({ width, height, fill: "#1f2937", listening: true }));
  addGridLines(app, group, layout, yTicks, bounds);
  addAxes(app, group, layout, bounds, yTicks);
  const barWidth = layout.plotWidth / data.length - 8;
  data.forEach((val, i) => {
    const barHeight = (val - bounds.min) / (bounds.max - bounds.min || 1) * layout.plotHeight;
    group.add(
      app.rect({
        x: layout.plotX + i * (barWidth + 8),
        y: layout.plotY + layout.plotHeight - barHeight,
        width: barWidth,
        height: barHeight,
        fill: "#3b82f6",
        listening: false
      })
    );
  });
  setState2(group, { width, height, data });
  return group;
});
registerDashboard("pieChart", (props, app) => {
  const size = num2(props, "size", 150);
  const data = props.data ?? [30, 25, 20, 25];
  const colors = props.colors ?? ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b"];
  const group = createWidgetGroup(app, "pieChart", props);
  const total = data.reduce((a, b) => a + b, 0) || 1;
  const cx = size / 2;
  let startAngle = -Math.PI / 2;
  data.forEach((val, i) => {
    const sweep = val / total * Math.PI * 2;
    group.add(
      new Arc({
        x: cx - size / 2 + 10,
        y: cx - size / 2 + 10,
        radius: size / 2 - 10,
        startAngle,
        endAngle: startAngle + sweep,
        fill: colors[i % colors.length],
        stroke: "#1f2937",
        strokeWidth: 1,
        listening: false
      })
    );
    startAngle += sweep;
  });
  setState2(group, { size, data, colors });
  return group;
});
registerDashboard("thermometer", (props, app) => {
  const height = num2(props, "height", 120);
  const width = num2(props, "width", 24);
  const value = clamp3(num2(props, "value", 50), 0, 100);
  const group = createWidgetGroup(app, "thermometer", props);
  const tubeH = height - 30;
  group.add(
    app.roundedRect({
      width,
      height: tubeH,
      cornerRadius: width / 2,
      fill: "#e5e7eb",
      stroke: "#9ca3af",
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
    fill: value > 80 ? "#ef4444" : value > 50 ? "#f59e0b" : "#3b82f6",
    listening: false
  });
  group.add(
    fill,
    app.circle({ x: width / 2 - 8, y: tubeH + 2, radius: 12, fill: "#ef4444", listening: false }),
    app.text({ text: `${Math.round(value)}\xB0`, x: width + 8, y: tubeH / 2 - 8, fontSize: 12, fill: "#111", listening: false })
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
  const group = createWidgetGroup(app, "compass", props);
  const cx = size / 2;
  const r = size / 2 - 5;
  group.add(
    app.circle({ x: 0, y: 0, radius: r, fill: "#f8fafc", stroke: "#64748b", strokeWidth: 2, listening: false }),
    app.text({ text: "N", x: cx - 4, y: 4, fontSize: 10, fill: "#64748b", listening: false })
  );
  const rad = (heading - 90) * Math.PI / 180;
  const needle = app.line({
    x: cx,
    y: cx,
    x2: cx + (r - 10) * Math.cos(rad),
    y2: cx + (r - 10) * Math.sin(rad),
    stroke: "#ef4444",
    strokeWidth: 3,
    listening: false
  });
  group.add(
    needle,
    app.circle({ x: cx - 4, y: cx - 4, radius: 4, fill: "#334155", listening: false }),
    app.text({ text: `${Math.round(heading)}\xB0`, x: cx - 12, y: size - 18, fontSize: 11, fill: "#111", listening: false })
  );
  setParts2(group, { needle });
  setRefresh(group, (v) => {
    const h = (v - 90) * Math.PI / 180;
    needle.x2 = cx + (r - 10) * Math.cos(h);
    needle.y2 = cx + (r - 10) * Math.sin(h);
  });
  setState2(group, { size, heading });
  return group;
});
registerDashboard("calendar", (props, app) => {
  const width = num2(props, "width", 210);
  const cell = 28;
  const group = createWidgetGroup(app, "calendar", props);
  const year = num2(props, "year", (/* @__PURE__ */ new Date()).getFullYear());
  const month = num2(props, "month", (/* @__PURE__ */ new Date()).getMonth());
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = first.getDay();
  group.add(
    app.text({
      text: first.toLocaleString("default", { month: "long", year: "numeric" }),
      x: 4,
      y: 4,
      fontSize: 13,
      fontWeight: "bold",
      fill: "#111",
      listening: false
    })
  );
  ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].forEach((d, i) => {
    group.add(app.text({ text: d, x: i * cell + 4, y: 24, fontSize: 10, fill: "#64748b", listening: false }));
  });
  for (let day = 1; day <= daysInMonth; day++) {
    const cellIdx = startDay + day - 1;
    const col = cellIdx % 7;
    const row = Math.floor(cellIdx / 7);
    group.add(
      app.text({
        text: String(day),
        x: col * cell + 6,
        y: 40 + row * cell,
        fontSize: 11,
        fill: day === num2(props, "highlightDay", -1) ? "#2563eb" : "#111",
        listening: false
      })
    );
  }
  setState2(group, { width, year, month });
  return group;
});
registerDashboard("timeline", (props, app) => {
  const height = num2(props, "height", 160);
  const events = props.events ?? [
    { label: "Start", time: "09:00" },
    { label: "Review", time: "12:00" },
    { label: "Done", time: "17:00" }
  ];
  const group = createWidgetGroup(app, "timeline", props);
  const step = height / Math.max(events.length, 1);
  group.add(app.line({ x: 12, y: 0, x2: 12, y2: height, stroke: "#cbd5e1", strokeWidth: 2, listening: false }));
  events.forEach((ev, i) => {
    const y = i * step + 10;
    group.add(
      app.circle({ x: 8, y, radius: 6, fill: "#2563eb", listening: false }),
      app.text({ text: ev.time ?? "", x: 24, y: y - 6, fontSize: 10, fill: "#64748b", listening: false }),
      app.text({ text: ev.label, x: 24, y: y + 8, fontSize: 12, fill: "#111", listening: false })
    );
  });
  setState2(group, { height, events });
  return group;
});
registerDashboard("signalStrength", (props, app) => {
  const level = clamp3(num2(props, "value", 3), 0, 5);
  const group = createWidgetGroup(app, "signalStrength", props);
  const bars = [];
  for (let i = 0; i < 5; i++) {
    const h = 8 + i * 5;
    const bar = app.rect({
      x: i * 10,
      y: 28 - h,
      width: 7,
      height: h,
      fill: i < level ? "#22c55e" : "#d1d5db",
      cornerRadius: 1,
      listening: false
    });
    bars.push(bar);
    group.add(bar);
  }
  setParts2(group, { bars });
  setRefresh(group, (v) => {
    const lv = clamp3(Math.round(v), 0, 5);
    bars.forEach((bar, i) => {
      bar.fill = i < lv ? "#22c55e" : "#d1d5db";
    });
  });
  setState2(group, { value: level });
  return group;
});
registerDashboard("knob", (props, app) => {
  const size = num2(props, "size", 80);
  const value = clamp3(num2(props, "value", 50), 0, 100);
  const group = createWidgetGroup(app, "knob", props, { focusable: true, listening: true });
  const cx = size / 2;
  const r = size / 2 - 8;
  const angle = Math.PI * 0.75 + value / 100 * Math.PI * 1.5;
  group.add(
    app.circle({ x: 0, y: 0, radius: r, fill: "#374151", stroke: "#1f2937", strokeWidth: 2, listening: false })
  );
  const indicator = app.line({
    x: cx,
    y: cx,
    x2: cx + (r - 12) * Math.cos(angle),
    y2: cx + (r - 12) * Math.sin(angle),
    stroke: "#f59e0b",
    strokeWidth: 3,
    listening: false
  });
  const valueLabel = app.text({
    text: String(Math.round(value)),
    x: cx - 10,
    y: cx + r - 10,
    fontSize: 12,
    fill: "#fff",
    listening: false
  });
  group.add(indicator, valueLabel);
  setParts2(group, { indicator, valueLabel });
  setRefresh(group, (v) => {
    const a = Math.PI * 0.75 + clamp3(v, 0, 100) / 100 * Math.PI * 1.5;
    indicator.x2 = cx + (r - 12) * Math.cos(a);
    indicator.y2 = cx + (r - 12) * Math.sin(a);
    valueLabel.text = String(Math.round(v));
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
    group.add(app.rect({ width: height, height: width, fill: "#e5e7eb", listening: false }));
    const fillBar = app.rect({
      x: 2,
      y: width - width * value / 100 - 2,
      width: height - 4,
      height: width * value / 100,
      fill: "#2563eb",
      listening: false
    });
    group.add(fillBar);
    setRefresh(group, (v) => {
      const pct = clamp3(v, 0, 100) / 100;
      fillBar.y = width - width * pct - 2;
      fillBar.height = width * pct;
    });
  } else {
    group.add(app.rect({ width, height, fill: "#e5e7eb", listening: false }));
    const fillBar = app.rect({
      x: 0,
      y: 0,
      width: width * value / 100,
      height,
      fill: "#2563eb",
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
  const group = createWidgetGroup(app, "battery", props);
  group.add(app.rect({ width: 40, height: 20, fill: null, stroke: "#333", strokeWidth: 2, listening: false }));
  group.add(app.rect({ x: 40, y: 6, width: 4, height: 8, fill: "#333", listening: false }));
  const fill = app.rect({
    x: 2,
    y: 2,
    width: 36 * level / 100,
    height: 16,
    fill: level > 20 ? "#22c55e" : "#ef4444",
    listening: false
  });
  group.add(fill);
  setRefresh(group, (v) => {
    const lv = clamp3(v, 0, 100);
    fill.width = 36 * lv / 100;
    fill.fill = lv > 20 ? "#22c55e" : "#ef4444";
  });
  setState2(group, { value: level });
  return group;
});
registerDashboard("clock", (props, app) => {
  const size = num2(props, "size", 120);
  const group = createWidgetGroup(app, "clock", props);
  const cx = size / 2;
  const now2 = /* @__PURE__ */ new Date();
  const hours = now2.getHours() % 12;
  const minutes = now2.getMinutes();
  const seconds = now2.getSeconds();
  group.add(
    app.circle({ x: cx - cx, y: cx - cx, radius: cx, fill: "#1f2937", stroke: "#374151", strokeWidth: 2, listening: false })
  );
  const hourAngle = (hours + minutes / 60) / 12 * Math.PI * 2 - Math.PI / 2;
  const minAngle = (minutes + seconds / 60) / 60 * Math.PI * 2 - Math.PI / 2;
  const secAngle = seconds / 60 * Math.PI * 2 - Math.PI / 2;
  group.add(
    app.line({ x: cx, y: cx, x2: cx + 30 * Math.cos(hourAngle), y2: cx + 30 * Math.sin(hourAngle), stroke: "#fff", strokeWidth: 3, listening: false }),
    app.line({ x: cx, y: cx, x2: cx + 40 * Math.cos(minAngle), y2: cx + 40 * Math.sin(minAngle), stroke: "#fff", strokeWidth: 2, listening: false }),
    app.line({ x: cx, y: cx, x2: cx + 45 * Math.cos(secAngle), y2: cx + 45 * Math.sin(secAngle), stroke: "#ef4444", strokeWidth: 1, listening: false })
  );
  setState2(group, { size });
  return group;
});

// src/modules/dashboard/index.ts
var dashboardPlugin = {
  name: "lightdraw-dashboard",
  version: "1.0.0",
  install(LD) {
    registerJSONResolver((type, props, app) => createDashboardFromJSON(type, props, app));
    LD.registerDashboard = registerDashboard;
  }
};

// src/automotive/registryCore.ts
var registry3 = {};
function registerAutomotive(type, factory) {
  registry3[type] = factory;
}
function createAutomotiveFromJSON(type, props, app) {
  const factory = registry3[type];
  return factory ? factory(props, app) : null;
}

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

// src/automotive/definitions.ts
function dialGauge(app, props, autoPart, max, needleColor, format) {
  const size = num3(props, "size", 200);
  const value = num3(props, "value", 0);
  const group = createAutoGroup(app, autoPart, props, autoPart);
  const cx = size / 2;
  const r = size / 2 - 15;
  const track = new Arc({
    x: 0,
    y: 0,
    radius: r,
    startAngle: Math.PI * 0.75,
    endAngle: Math.PI * 2.25,
    fill: null,
    stroke: str3(props, "dialStroke", "#333"),
    strokeWidth: 14,
    listening: false
  });
  const angle = needleAngle(value, max);
  const needle = app.line({
    x: cx,
    y: cx,
    x2: cx + r * 0.82 * Math.cos(angle),
    y2: cx + r * 0.82 * Math.sin(angle),
    stroke: needleColor,
    strokeWidth: 4,
    listening: false
  });
  const label = app.text({
    text: format(value),
    x: cx - 25,
    y: cx + 15,
    fontSize: 24,
    fontWeight: "bold",
    fill: str3(props, "textColor", "#fff"),
    listening: false
  });
  group.add(track, needle, app.circle({ x: cx - 6, y: cx - 6, radius: 6, fill: needleColor, listening: false }), label);
  setParts3(group, { needle, label });
  setRefresh2(group, (v) => {
    const a = needleAngle(v, max);
    needle.x2 = cx + r * 0.82 * Math.cos(a);
    needle.y2 = cx + r * 0.82 * Math.sin(a);
    label.text = format(v);
  });
  setState3(group, { size, value, max });
  return group;
}
function indicatorLamp(app, type, autoPart, props, symbol) {
  const active = bool3(props, "active", false);
  const group = createAutoGroup(app, type, props, autoPart);
  const lamp = app.circle({
    radius: 12,
    x: 0,
    y: 0,
    fill: active ? "#fbbf24" : "#333",
    stroke: active ? "#fde047" : "#555",
    strokeWidth: 1,
    listening: false
  });
  const sym = app.text({
    text: symbol,
    x: symbol.length > 2 ? 2 : 6,
    y: 4,
    fontSize: 10,
    fill: active ? "#111" : "#666",
    listening: false
  });
  group.add(lamp, sym);
  setParts3(group, { lamp, sym });
  setBoolRefresh(group, (on) => {
    lamp.fill = on ? "#fbbf24" : "#333";
    lamp.stroke = on ? "#fde047" : "#555";
    sym.fill = on ? "#111" : "#666";
  });
  setState3(group, { active });
  return group;
}
registerAutomotive(
  "speedometer",
  (props, app) => dialGauge(app, props, "speedometer", num3(props, "max", 240), "#ef4444", (v) => String(Math.round(v)))
);
registerAutomotive(
  "tachometer",
  (props, app) => dialGauge(app, props, "tachometer", num3(props, "max", 8e3), "#22c55e", (v) => `${Math.round(v / 1e3)}k`)
);
registerAutomotive("engineTemp", (props, app) => {
  const size = num3(props, "size", 140);
  const value = num3(props, "value", 90);
  const max = num3(props, "max", 130);
  const group = createAutoGroup(app, "engineTemp", props, "engineTemp");
  const cx = size / 2;
  const r = size / 2 - 12;
  const zones = [
    { start: 0, end: 0.4, color: "#3b82f6" },
    { start: 0.4, end: 0.75, color: "#22c55e" },
    { start: 0.75, end: 1, color: "#ef4444" }
  ];
  const sweep = Math.PI * 1.5;
  const base = Math.PI * 0.75;
  zones.forEach((z) => {
    group.add(
      new Arc({
        x: 0,
        y: 0,
        radius: r,
        startAngle: base + z.start * sweep,
        endAngle: base + z.end * sweep,
        fill: null,
        stroke: z.color,
        strokeWidth: 8,
        listening: false
      })
    );
  });
  const angle = needleAngle(value, max);
  const needle = app.line({
    x: cx,
    y: cx,
    x2: cx + r * 0.75 * Math.cos(angle),
    y2: cx + r * 0.75 * Math.sin(angle),
    stroke: "#fff",
    strokeWidth: 3,
    listening: false
  });
  const label = app.text({ text: `${Math.round(value)}\xB0C`, x: cx - 18, y: cx + 10, fontSize: 12, fill: "#fff", listening: false });
  group.add(needle, label);
  setParts3(group, { needle, label });
  setRefresh2(group, (v) => {
    const a = needleAngle(v, max);
    needle.x2 = cx + r * 0.75 * Math.cos(a);
    needle.y2 = cx + r * 0.75 * Math.sin(a);
    label.text = `${Math.round(v)}\xB0C`;
  });
  setState3(group, { size, value, max });
  return group;
});
registerAutomotive("batteryVoltage", (props, app) => {
  const value = num3(props, "value", 12.4);
  const group = createAutoGroup(app, "batteryVoltage", props, "batteryVoltage");
  group.add(
    app.rect({ width: 36, height: 18, fill: null, stroke: "#fff", strokeWidth: 2, listening: false }),
    app.rect({ x: 36, y: 5, width: 4, height: 8, fill: "#fff", listening: false })
  );
  const label = app.text({
    text: `${value.toFixed(1)}V`,
    x: 44,
    y: 2,
    fontSize: 14,
    fill: value < 11.5 ? "#ef4444" : "#22c55e",
    listening: false
  });
  group.add(label);
  setParts3(group, { label });
  setRefresh2(group, (v) => {
    label.text = `${v.toFixed(1)}V`;
    label.fill = v < 11.5 ? "#ef4444" : "#22c55e";
  });
  setState3(group, { value });
  return group;
});
registerAutomotive("tpms", (props, app) => {
  const pressures = props.pressures ?? [32, 32, 32, 32];
  const lowThreshold = num3(props, "lowThreshold", 25);
  const group = createAutoGroup(app, "tpms", props, "tpms");
  const positions = [
    { x: 0, y: 0, label: "FL" },
    { x: 60, y: 0, label: "FR" },
    { x: 0, y: 40, label: "RL" },
    { x: 60, y: 40, label: "RR" }
  ];
  const texts = [];
  positions.forEach((pos, i) => {
    const psi = pressures[i] ?? 32;
    const low = psi < lowThreshold;
    group.add(
      app.circle({ x: pos.x + 10, y: pos.y + 10, radius: 14, fill: low ? "#450a0a" : "#1f2937", stroke: low ? "#ef4444" : "#64748b", strokeWidth: 1, listening: false }),
      app.text({ text: pos.label, x: pos.x + 4, y: pos.y + 4, fontSize: 9, fill: "#9ca3af", listening: false })
    );
    const t = app.text({ text: `${psi}`, x: pos.x + 2, y: pos.y + 22, fontSize: 11, fill: low ? "#ef4444" : "#fff", listening: false });
    texts.push(t);
    group.add(t);
  });
  group.metadata.refresh = (next) => {
    next.forEach((psi, i) => {
      const low = psi < lowThreshold;
      if (texts[i]) {
        texts[i].text = `${psi}`;
        texts[i].fill = low ? "#ef4444" : "#fff";
      }
    });
  };
  setState3(group, { pressures, lowThreshold });
  return group;
});
registerAutomotive(
  "parkingBrake",
  (props, app) => indicatorLamp(app, "parkingBrake", "parkingBrake", props, "P")
);
registerAutomotive(
  "headlights",
  (props, app) => indicatorLamp(app, "headlights", "headlights", props, "\u{1F4A1}")
);
registerAutomotive("cruiseControl", (props, app) => {
  const speed = num3(props, "speed", 0);
  const active = bool3(props, "active", speed > 0);
  const group = createAutoGroup(app, "cruiseControl", props, "cruiseControl");
  const bg = app.roundedRect({
    width: 72,
    height: 28,
    cornerRadius: 4,
    fill: active ? "#1d4ed8" : "#333",
    listening: false
  });
  const label = app.text({
    text: active ? `SET ${Math.round(speed)}` : "CRUISE",
    x: 6,
    y: 7,
    fontSize: 11,
    fill: "#fff",
    listening: false
  });
  group.add(bg, label);
  setParts3(group, { bg, label });
  setRefresh2(group, (v) => {
    const on = v > 0;
    bg.fill = on ? "#1d4ed8" : "#333";
    label.text = on ? `SET ${Math.round(v)}` : "CRUISE";
  });
  setState3(group, { speed, active });
  return group;
});
registerAutomotive("canViewer", (props, app) => {
  const signals = props.signals ?? {
    "engine.rpm": 2500,
    "vehicle.speed": 60
  };
  const group = createAutoGroup(app, "canViewer", props, "canViewer");
  const entries = Object.entries(signals).slice(0, num3(props, "maxRows", 20));
  const rowH = 16;
  group.add(
    app.rect({ width: num3(props, "width", 220), height: entries.length * rowH + 8, fill: "#111827", stroke: "#374151", strokeWidth: 1, listening: false })
  );
  const rows = [];
  entries.forEach(([key, val], i) => {
    const row = app.text({ text: `${key}: ${val}`, x: 6, y: 4 + i * rowH, fontSize: 10, fill: "#d1d5db", listening: false });
    rows.push(row);
    group.add(row);
  });
  group.metadata.refresh = (next) => {
    Object.entries(next).slice(0, rows.length).forEach(([key, val], i) => {
      if (rows[i])
        rows[i].text = `${key}: ${val}`;
    });
  };
  setState3(group, { signals });
  return group;
});
registerAutomotive("fuelGauge", (props, app) => {
  const value = clamp4(num3(props, "value", 50), 0, 100);
  const group = createAutoGroup(app, "fuelGauge", props, "fuelGauge");
  group.add(app.text({ text: "FUEL", fontSize: 10, fill: "#9ca3af", x: 0, y: 0, listening: false }));
  const track = app.rect({ y: 14, width: 100, height: 8, fill: "#333", cornerRadius: 4, listening: false });
  const fill = app.rect({ y: 14, width: value, height: 8, fill: value < 15 ? "#ef4444" : "#22c55e", cornerRadius: 4, listening: false });
  const label = app.text({ text: `${value}%`, x: 40, y: 28, fontSize: 12, fill: "#fff", listening: false });
  group.add(track, fill, label);
  setParts3(group, { fill, label });
  setRefresh2(group, (v) => {
    const lv = clamp4(v, 0, 100);
    fill.width = lv;
    fill.fill = lv < 15 ? "#ef4444" : "#22c55e";
    label.text = `${Math.round(lv)}%`;
  });
  setState3(group, { value });
  return group;
});
registerAutomotive("gearIndicator", (props, app) => {
  const gear = str3(props, "gear", "P");
  const group = createAutoGroup(app, "gearIndicator", props, "gearIndicator");
  const label = app.text({ text: gear, fontSize: 48, fontWeight: "bold", fill: "#fff", listening: false });
  group.add(label);
  setParts3(group, { label });
  setState3(group, { gear });
  return group;
});
registerAutomotive("turnIndicators", (props, app) => {
  const left = bool3(props, "left", false);
  const right = bool3(props, "right", false);
  const group = createAutoGroup(app, "turnIndicators", props, "turnIndicators");
  const leftText = app.text({ text: "\u25C0", fontSize: 24, fill: left ? "#22c55e" : "#333", listening: false });
  const rightText = app.text({ text: "\u25B6", fontSize: 24, fill: right ? "#22c55e" : "#333", x: 40, listening: false });
  group.add(leftText, rightText);
  group.metadata.refresh = (l, r) => {
    leftText.fill = l ? "#22c55e" : "#333";
    rightText.fill = r ? "#22c55e" : "#333";
  };
  setState3(group, { left, right });
  return group;
});
registerAutomotive("warningLamp", (props, app) => {
  const label = str3(props, "label", "!");
  const active = bool3(props, "active", false);
  const group = createAutoGroup(app, "warningLamp", props, "warningLamp");
  group.add(
    app.circle({ radius: 14, x: 0, y: 0, fill: active ? "#ef4444" : "#333", stroke: active ? "#fca5a5" : "#555", strokeWidth: 1, listening: false }),
    app.text({ text: label, x: label.length > 2 ? 2 : 8, y: 5, fontSize: 10, fill: active ? "#fff" : "#666", listening: false })
  );
  setState3(group, { label, active });
  return group;
});
registerAutomotive("adasStatus", (props, app) => {
  const status = str3(props, "status", "off");
  const colors = { off: "#333", standby: "#f59e0b", active: "#22c55e", fault: "#ef4444" };
  const group = createAutoGroup(app, "adasStatus", props, "adasStatus");
  group.add(
    app.rect({ width: 80, height: 24, fill: colors[status] ?? "#333", cornerRadius: 4, listening: false }),
    app.text({ text: `ADAS ${status.toUpperCase()}`, x: 8, y: 5, fontSize: 10, fill: "#fff", listening: false })
  );
  setState3(group, { status });
  return group;
});
registerAutomotive("instrumentCluster", (props, app) => {
  const theme = getTheme(str3(props, "theme", "classic"));
  const w = num3(props, "width", 800);
  const h = num3(props, "height", 400);
  const group = createAutoGroup(app, "instrumentCluster", props, "instrumentCluster", { width: w, height: h });
  group.add(app.rect({ width: w, height: h, fill: theme.background, listening: false }));
  const widgets = [
    ["speedometer", { value: props.speed ?? 0, size: 220, x: 60, y: 50, dialStroke: theme.dialStroke, textColor: theme.text }],
    ["tachometer", { value: props.rpm ?? 0, size: 220, x: 480, y: 50, dialStroke: theme.dialStroke, textColor: theme.text }],
    ["engineTemp", { value: props.engineTemp ?? 90, size: 120, x: 320, y: 60 }],
    ["fuelGauge", { value: props.fuel ?? 75, x: 60, y: 320 }],
    ["batteryVoltage", { value: props.batteryVoltage ?? 12.4, x: 180, y: 320 }],
    ["tpms", { pressures: props.tpms ?? [32, 32, 32, 32], x: 300, y: 300 }],
    ["gearIndicator", { gear: props.gear ?? "D", x: 380, y: 280 }],
    ["turnIndicators", { left: props.turnLeft ?? false, right: props.turnRight ?? false, x: 340, y: 240 }],
    ["parkingBrake", { active: props.parkingBrake ?? false, x: 520, y: 320 }],
    ["headlights", { active: props.headlights ?? false, x: 560, y: 320 }],
    ["cruiseControl", { speed: props.cruiseSpeed ?? 0, x: 620, y: 320 }],
    ["canViewer", { signals: props.signals ?? { "engine.rpm": 0, "vehicle.speed": 0 }, width: 200, x: 580, y: 50, maxRows: 8 }],
    ["warningLamp", { label: "ABS", active: props.absWarning ?? false, x: 480, y: 320 }],
    ["adasStatus", { status: props.adasStatus ?? "off", x: 680, y: 320 }]
  ];
  for (const [type, wprops] of widgets) {
    const node = createAutomotiveFromJSON(type, wprops, app);
    if (node)
      group.add(node);
  }
  group.metadata.theme = theme;
  setState3(group, { width: w, height: h, theme: str3(props, "theme", "classic"), ...props });
  return group;
});

// src/automotive/simulation.ts
function walkParts(node, fn) {
  fn(node);
  if ("children" in node) {
    for (const child of node.children) {
      walkParts(child, fn);
    }
  }
}
function applyDriveState(root, state) {
  walkParts(root, (node) => {
    const part = node.metadata?.autoPart;
    if (!part)
      return;
    if (part === "speedometer" && state.speed !== void 0) {
      setAutoValue(node, "value", state.speed);
    }
    if (part === "tachometer" && state.rpm !== void 0) {
      setAutoValue(node, "value", state.rpm);
    }
    if (part === "fuelGauge" && state.fuel !== void 0) {
      setAutoValue(node, "value", state.fuel);
    }
    if (part === "engineTemp" && state.engineTemp !== void 0) {
      setAutoValue(node, "value", state.engineTemp);
    }
    if (part === "batteryVoltage" && state.batteryVoltage !== void 0) {
      setAutoValue(node, "value", state.batteryVoltage);
    }
    if (part === "tpms" && state.tpms) {
      setState3(node, { pressures: state.tpms });
      node.metadata.refresh?.(state.tpms);
    }
    if (part === "parkingBrake" && state.parkingBrake !== void 0) {
      setState3(node, { active: state.parkingBrake });
      node.metadata.boolRefresh?.(state.parkingBrake);
    }
    if (part === "headlights" && state.headlights !== void 0) {
      setState3(node, { active: state.headlights });
      node.metadata.boolRefresh?.(state.headlights);
    }
    if (part === "cruiseControl" && state.cruiseSpeed !== void 0) {
      setState3(node, { speed: state.cruiseSpeed, active: state.cruiseSpeed > 0 });
      node.metadata.refresh?.(state.cruiseSpeed);
    }
    if (part === "gearIndicator" && state.gear !== void 0) {
      setState3(node, { gear: state.gear });
      const label = getParts2(node).label;
      if (label)
        label.text = state.gear;
    }
    if (part === "turnIndicators") {
      if (state.turnLeft !== void 0 || state.turnRight !== void 0) {
        setState3(node, { left: state.turnLeft ?? false, right: state.turnRight ?? false });
        node.metadata.refresh?.(
          state.turnLeft ?? false,
          state.turnRight ?? false
        );
      }
    }
    if (part === "canViewer" && state.signals) {
      setState3(node, { signals: state.signals });
      node.metadata.refresh?.(
        state.signals
      );
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
      tpms: [32, 31, 33, 32].map((p, j) => i > 40 && j === 2 ? 22 : p),
      parkingBrake: i < 5,
      headlights: i > 10,
      cruiseSpeed: i > 20 && i < 50 ? 65 : 0,
      gear: i < 5 ? "P" : i < 10 ? "D" : "D",
      turnLeft: i % 30 < 5,
      turnRight: i % 30 > 25,
      signals: {
        "engine.rpm": Math.round(1500 + t * 3e3),
        "vehicle.speed": Math.round(30 + t * 60),
        "battery.voltage": 12.4
      }
    });
  }
  return frames;
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
function pipelineLayout(group, gap = 40, padding = 10) {
  let x = padding;
  const y = padding;
  for (const child of group.children) {
    child.x = x;
    child.y = y;
    child.markDirty();
    x += child.getBounds().width + gap;
  }
}

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
function routeConnector(app, x1, y1, x2, y2, style = "orthogonal", obstacles = []) {
  if (style === "straight") {
    return app.line({ x: x1, y: y1, x2: x2 - x1, y2: y2 - y1, stroke: "#64748b", strokeWidth: 2 });
  }
  const points = style === "smart" ? smartOrthogonalRoute(x1, y1, x2, y2, obstacles) : (() => {
    const midY = (y1 + y2) / 2;
    return [x1, y1, x1, midY, x2, midY, x2, y2];
  })();
  return app.polyline({ points, fill: null, stroke: "#64748b", strokeWidth: 2 });
}
function getAnchor(node, targetX, targetY) {
  const b = node.getBounds();
  const cx = b.x + b.width / 2;
  const cy = b.y + b.height / 2;
  const dx = targetX - cx;
  const dy = targetY - cy;
  if (Math.abs(dx) > Math.abs(dy)) {
    return { x: dx > 0 ? b.x + b.width : b.x, y: cy };
  }
  return { x: cx, y: dy > 0 ? b.y + b.height : b.y };
}

// src/diagram/symbols.ts
var SYMBOL_SIZE = 40;
function resistor(app, x, y) {
  const g = app.group({ x, y });
  const pts = [0, 20, 8, 5, 16, 35, 24, 5, 32, 35, 40, 20];
  g.add(app.polyline({ points: pts, fill: null, stroke: "#334155", strokeWidth: 2 }));
  return g;
}
function capacitor(app, x, y) {
  const g = app.group({ x, y });
  g.add(app.line({ x: 0, y: 10, x2: 15, y2: 0, stroke: "#334155", strokeWidth: 2 }));
  g.add(app.line({ x: 18, y: 0, y2: 20, stroke: "#334155", strokeWidth: 2 }));
  g.add(app.line({ x: 22, y: 0, y2: 20, stroke: "#334155", strokeWidth: 2 }));
  g.add(app.line({ x: 25, y: 10, x2: 40, y2: 0, stroke: "#334155", strokeWidth: 2 }));
  return g;
}
function ground(app, x, y) {
  const g = app.group({ x, y });
  g.add(app.line({ x: 20, y: 0, x2: 0, y2: 10, stroke: "#334155", strokeWidth: 2 }));
  g.add(app.line({ x: 4, y: 14, x2: 32, y2: 0, stroke: "#334155", strokeWidth: 2 }));
  g.add(app.line({ x: 10, y: 18, x2: 26, y2: 0, stroke: "#334155", strokeWidth: 2 }));
  g.add(app.line({ x: 16, y: 22, x2: 20, y2: 0, stroke: "#334155", strokeWidth: 2 }));
  return g;
}
function battery(app, x, y) {
  const g = app.group({ x, y });
  g.add(app.line({ x: 12, y: 4, x2: 0, y2: 32, stroke: "#334155", strokeWidth: 2 }));
  g.add(app.line({ x: 18, y: 0, x2: 0, y2: 24, stroke: "#334155", strokeWidth: 3 }));
  g.add(app.line({ x: 24, y: 4, x2: 0, y2: 32, stroke: "#334155", strokeWidth: 2 }));
  return g;
}
function switchSymbol(app, x, y) {
  const g = app.group({ x, y });
  g.add(app.line({ x: 0, y: 10, x2: 12, y2: 0, stroke: "#334155", strokeWidth: 2 }));
  g.add(app.line({ x: 12, y: 0, x2: 8, y2: -8, stroke: "#334155", strokeWidth: 2 }));
  g.add(app.circle({ x: 12, y: 8, radius: 2, fill: "#334155" }));
  g.add(app.line({ x: 28, y: 10, x2: -16, y2: 0, stroke: "#334155", strokeWidth: 2 }));
  return g;
}
function led(app, x, y) {
  const g = app.group({ x, y });
  g.add(app.line({ x: 0, y: 10, x2: 10, y2: 0, stroke: "#334155", strokeWidth: 2 }));
  g.add(
    app.polygon({
      points: [10, 0, 30, 10, 10, 20],
      fill: "#fef08a",
      stroke: "#ca8a04",
      strokeWidth: 1
    })
  );
  g.add(app.line({ x: 30, y: 10, x2: -20, y2: 0, stroke: "#334155", strokeWidth: 2 }));
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
    g.add(app.line({ x: 0, y: 0, x2: 40, y2: 0, stroke: "#334155", strokeWidth: 2 }));
    return g;
  }
};
function createSymbol(app, type, x, y, label) {
  const factory = SYMBOL_FACTORIES[type] ?? SYMBOL_FACTORIES.resistor;
  const g = factory(app, x, y);
  g.metadata = { symbolType: type };
  if (label) {
    g.add(app.text({ text: label, x: 0, y: SYMBOL_SIZE + 4, fontSize: 10, fill: "#64748b" }));
  }
  return g;
}
function buildSchematic(app, components) {
  const group = app.group({ name: "schematic" });
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
  const nodeMap = /* @__PURE__ */ new Map();
  for (const n of nodes) {
    const width = 120;
    const height = 40;
    const nodeGroup = app.group({ x: n.x ?? 0, y: n.y ?? 0 });
    const shape = n.type === "decision" ? app.polygon({
      points: [60, 0, 120, 20, 60, 40, 0, 20],
      fill: "#dbeafe",
      stroke: "#2563eb",
      strokeWidth: 1
    }) : app.roundedRect({
      width,
      height,
      cornerRadius: n.type === "start" || n.type === "end" ? 20 : 4,
      fill: "#dbeafe",
      stroke: "#2563eb",
      strokeWidth: 1
    });
    nodeGroup.add(shape);
    nodeGroup.add(
      app.text({
        text: n.label,
        x: width / 2 - n.label.length * 3,
        y: height / 2 - 7,
        fontSize: 12,
        fill: "#1e40af"
      })
    );
    nodeGroup.metadata = { diagramId: n.id };
    nodeMap.set(n.id, nodeGroup);
    group.add(nodeGroup);
  }
  const obstacles = collectObstacles([...nodeMap.values()]);
  for (const edge of edges) {
    const fromNode = nodeMap.get(edge.from);
    const toNode = nodeMap.get(edge.to);
    if (!fromNode || !toNode)
      continue;
    const toB = toNode.getBounds();
    const anchor = getAnchor(fromNode, toB.x + toB.width / 2, toB.y + toB.height / 2);
    const toAnchor = getAnchor(toNode, anchor.x, anchor.y);
    group.add(
      routeConnector(app, anchor.x, anchor.y, toAnchor.x, toAnchor.y, "smart", obstacles)
    );
    if (edge.label) {
      group.add(
        app.text({
          text: edge.label,
          x: (anchor.x + toAnchor.x) / 2,
          y: (anchor.y + toAnchor.y) / 2 - 10,
          fontSize: 10,
          fill: "#64748b"
        })
      );
    }
  }
  return group;
}
function createStateMachine(app, data, options = {}) {
  const group = createDiagramGroup(app, "stateMachine", { ...options, data }, { name: "stateMachine" });
  const nodeMap = /* @__PURE__ */ new Map();
  const radius = 30;
  for (const s of data.states) {
    const isFinal = s.type === "final";
    const isInitial = s.type === "initial";
    const nodeGroup = app.group({ x: s.x ?? 0, y: s.y ?? 0 });
    if (isFinal) {
      nodeGroup.add(
        app.circle({
          x: radius - 6,
          y: radius - 6,
          radius: radius - 4,
          fill: "#dcfce7",
          stroke: "#16a34a",
          strokeWidth: 2
        })
      );
      nodeGroup.add(
        app.circle({
          x: radius - 6,
          y: radius - 6,
          radius: radius - 10,
          fill: null,
          stroke: "#16a34a",
          strokeWidth: 2
        })
      );
    } else {
      nodeGroup.add(
        app.roundedRect({
          width: radius * 2,
          height: radius * 2,
          cornerRadius: isInitial ? radius : 8,
          fill: isInitial ? "#fef9c3" : "#e0e7ff",
          stroke: isInitial ? "#ca8a04" : "#4f46e5",
          strokeWidth: 2
        })
      );
    }
    nodeGroup.add(
      app.text({
        text: s.label,
        x: radius - s.label.length * 3,
        y: radius - 6,
        fontSize: 11,
        fill: "#1e293b"
      })
    );
    nodeGroup.metadata = { diagramId: s.id };
    nodeMap.set(s.id, nodeGroup);
    group.add(nodeGroup);
  }
  const obstacles = collectObstacles([...nodeMap.values()]);
  for (const t of data.transitions) {
    const from = nodeMap.get(t.from);
    const to = nodeMap.get(t.to);
    if (!from || !to)
      continue;
    const toB = to.getBounds();
    const anchor = getAnchor(from, toB.x + toB.width / 2, toB.y + toB.height / 2);
    const toAnchor = getAnchor(to, anchor.x, anchor.y);
    group.add(routeConnector(app, anchor.x, anchor.y, toAnchor.x, toAnchor.y, "smart", obstacles));
    if (t.label) {
      group.add(
        app.text({
          text: t.label,
          x: (anchor.x + toAnchor.x) / 2,
          y: (anchor.y + toAnchor.y) / 2 - 8,
          fontSize: 10,
          fill: "#64748b"
        })
      );
    }
  }
  return group;
}
function createClassDiagram(app, data, options = {}) {
  const group = createDiagramGroup(app, "classDiagram", { ...options, data }, { name: "classDiagram" });
  const nodeMap = /* @__PURE__ */ new Map();
  const width = 160;
  for (const cls of data.classes) {
    const attrs = cls.attributes ?? [];
    const methods = cls.methods ?? [];
    const bodyLines = attrs.length + methods.length;
    const height = 40 + bodyLines * 16;
    const nodeGroup = app.group({ x: cls.x ?? 0, y: cls.y ?? 0 });
    nodeGroup.add(
      app.roundedRect({
        width,
        height,
        cornerRadius: 2,
        fill: "#f8fafc",
        stroke: "#334155",
        strokeWidth: 1
      })
    );
    nodeGroup.add(
      app.text({
        text: cls.name,
        x: 8,
        y: 8,
        fontSize: 13,
        fontWeight: "bold",
        fill: "#0f172a"
      })
    );
    nodeGroup.add(
      app.line({ x: 0, y: 28, x2: width, y2: 0, stroke: "#cbd5e1", strokeWidth: 1 })
    );
    let y = 34;
    for (const attr of attrs) {
      nodeGroup.add(app.text({ text: attr, x: 8, y, fontSize: 11, fill: "#475569" }));
      y += 16;
    }
    if (methods.length > 0 && attrs.length > 0) {
      nodeGroup.add(
        app.line({ x: 0, y: y - 4, x2: width, y2: 0, stroke: "#cbd5e1", strokeWidth: 1 })
      );
    }
    for (const method of methods) {
      nodeGroup.add(app.text({ text: method, x: 8, y, fontSize: 11, fill: "#475569" }));
      y += 16;
    }
    nodeGroup.metadata = { diagramId: cls.id };
    nodeMap.set(cls.id, nodeGroup);
    group.add(nodeGroup);
  }
  for (const rel of data.relations) {
    const from = nodeMap.get(rel.from);
    const to = nodeMap.get(rel.to);
    if (!from || !to)
      continue;
    const toB = to.getBounds();
    const anchor = getAnchor(from, toB.x + toB.width / 2, toB.y);
    const toAnchor = getAnchor(to, anchor.x, anchor.y);
    if (rel.type === "inheritance") {
      const midX = (anchor.x + toAnchor.x) / 2;
      group.add(
        app.polyline({
          points: [anchor.x, anchor.y, midX, anchor.y, midX, toAnchor.y, toAnchor.x, toAnchor.y],
          fill: null,
          stroke: "#334155",
          strokeWidth: 1.5
        })
      );
      group.add(
        app.polygon({
          points: [toAnchor.x, toAnchor.y, toAnchor.x - 8, toAnchor.y + 12, toAnchor.x + 8, toAnchor.y + 12],
          fill: "#f8fafc",
          stroke: "#334155",
          strokeWidth: 1.5
        })
      );
    } else {
      group.add(routeConnector(app, anchor.x, anchor.y, toAnchor.x, toAnchor.y, "orthogonal"));
    }
  }
  return group;
}
function createMindMap(app, center, branches, options = {}) {
  const group = createDiagramGroup(app, "mindMap", { ...options, center, branches }, { name: "mindMap" });
  const centerNode = createNodeBox(app, center, 100, 50, {
    fill: "#fef08a",
    stroke: "#ca8a04",
    cornerRadius: 25
  });
  group.add(centerNode);
  for (const branch of branches) {
    const branchNode = createNodeBox(app, branch.label, 90, 36, {
      fill: "#e0f2fe",
      stroke: "#0284c7"
    });
    group.add(branchNode);
    if (branch.children) {
      for (const child of branch.children) {
        const childNode = createNodeBox(app, child, 80, 30, {
          fill: "#f1f5f9",
          stroke: "#94a3b8"
        });
        branchNode.add(childNode);
      }
    }
  }
  radialLayout(group, 200, 150, 120, 180);
  return group;
}
function createNetworkDiagram(app, data, options = {}) {
  const group = createDiagramGroup(app, "networkTopology", { ...options, data }, { name: "network" });
  const { nodes, edges } = normalizeDiagramData(data);
  const nodeMap = /* @__PURE__ */ new Map();
  const colors = {
    router: { fill: "#dbeafe", stroke: "#2563eb" },
    server: { fill: "#dcfce7", stroke: "#16a34a" },
    switch: { fill: "#fef9c3", stroke: "#ca8a04" },
    client: { fill: "#f3e8ff", stroke: "#9333ea" },
    default: { fill: "#f1f5f9", stroke: "#64748b" }
  };
  for (const n of nodes) {
    const style = colors[n.type ?? "default"] ?? colors.default;
    const size = n.type === "router" ? 50 : 40;
    const nodeGroup = app.group({ x: n.x ?? 0, y: n.y ?? 0 });
    nodeGroup.add(
      app.roundedRect({
        width: size,
        height: size,
        cornerRadius: n.type === "server" ? 4 : size / 2,
        fill: style.fill,
        stroke: style.stroke,
        strokeWidth: 2
      })
    );
    nodeGroup.add(
      app.text({
        text: n.label,
        x: -10,
        y: size + 4,
        fontSize: 10,
        fill: "#334155"
      })
    );
    nodeGroup.metadata = { diagramId: n.id };
    nodeMap.set(n.id, nodeGroup);
    group.add(nodeGroup);
  }
  const obstacles = collectObstacles([...nodeMap.values()]);
  for (const edge of edges) {
    const from = nodeMap.get(edge.from);
    const to = nodeMap.get(edge.to);
    if (!from || !to)
      continue;
    const toB = to.getBounds();
    const anchor = getAnchor(from, toB.x + toB.width / 2, toB.y + toB.height / 2);
    const toAnchor = getAnchor(to, anchor.x, anchor.y);
    group.add(routeConnector(app, anchor.x, anchor.y, toAnchor.x, toAnchor.y, "smart", obstacles));
    if (edge.label) {
      group.add(
        app.text({
          text: edge.label,
          x: (anchor.x + toAnchor.x) / 2 - 10,
          y: (anchor.y + toAnchor.y) / 2,
          fontSize: 9,
          fill: "#64748b"
        })
      );
    }
  }
  return group;
}
function createOrgChart(app, root, options = {}) {
  const group = createDiagramGroup(app, "orgChart", { ...options, root }, { name: "orgChart" });
  buildOrgNode(app, group, root, 0, 0);
  layoutDiagram(group, 100, 80);
  return group;
}
function buildOrgNode(app, parent, data, x, y) {
  const node = app.group({ x, y });
  node.add(
    app.roundedRect({
      width: 140,
      height: 50,
      cornerRadius: 4,
      fill: "#f1f5f9",
      stroke: "#94a3b8",
      strokeWidth: 1
    })
  );
  node.add(app.text({ text: data.name, x: 20, y: 16, fontSize: 13, fill: "#334155" }));
  const collapsed = data.collapsed ?? false;
  node.metadata = { orgNode: true, collapsed, childCount: data.children?.length ?? 0 };
  if (data.children && data.children.length > 0) {
    const indicator = app.text({
      text: collapsed ? `+${data.children.length}` : "\u2212",
      x: 120,
      y: 16,
      fontSize: 14,
      fill: "#64748b"
    });
    node.add(indicator);
    node.metadata.collapseIndicator = indicator;
    if (!collapsed) {
      for (const child of data.children) {
        buildOrgNode(app, node, child, 0, 0);
      }
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
  const busY = 80;
  const busWidth = Math.max(400, data.ecus.length * 100);
  group.add(
    app.line({
      x: 20,
      y: busY,
      x2: busWidth,
      y2: 0,
      stroke: "#dc2626",
      strokeWidth: 4
    })
  );
  group.add(
    app.text({
      text: data.busLabel ?? "CAN Bus",
      x: busWidth / 2 - 30,
      y: busY - 20,
      fontSize: 12,
      fill: "#dc2626",
      fontWeight: "bold"
    })
  );
  const spacing = busWidth / (data.ecus.length + 1);
  for (let i = 0; i < data.ecus.length; i++) {
    const ecu = data.ecus[i];
    const x = 20 + spacing * (i + 1) - 40;
    const ecuGroup = app.group({ x, y: busY + 10 });
    ecuGroup.add(
      app.roundedRect({
        width: 80,
        height: 50,
        cornerRadius: 4,
        fill: "#1e293b",
        stroke: "#475569",
        strokeWidth: 1
      })
    );
    ecuGroup.add(
      app.text({ text: ecu.label, x: 8, y: 10, fontSize: 11, fill: "#e2e8f0", fontWeight: "bold" })
    );
    if (ecu.address) {
      ecuGroup.add(
        app.text({ text: ecu.address, x: 8, y: 28, fontSize: 9, fill: "#94a3b8" })
      );
    }
    ecuGroup.add(
      app.line({ x: 40, y: 0, x2: 0, y2: -10, stroke: "#dc2626", strokeWidth: 2 })
    );
    ecuGroup.metadata = { diagramId: ecu.id };
    group.add(ecuGroup);
  }
  return group;
}
function createPipeline(app, stages, options = {}) {
  const group = createDiagramGroup(app, "processPipeline", { ...options, stages }, { name: "pipeline" });
  const statusColors = {
    pending: { fill: "#f1f5f9", stroke: "#94a3b8" },
    active: { fill: "#dbeafe", stroke: "#2563eb" },
    done: { fill: "#dcfce7", stroke: "#16a34a" },
    error: { fill: "#fee2e2", stroke: "#dc2626" }
  };
  const stageNodes = [];
  for (const stage of stages) {
    const colors = statusColors[stage.status ?? "pending"];
    const node = createNodeBox(app, stage.label, 100, 44, colors);
    node.metadata = { diagramId: stage.id, pipelineStatus: stage.status };
    group.add(node);
    stageNodes.push(node);
  }
  pipelineLayout(group, 50, 10);
  for (let i = 0; i < stageNodes.length - 1; i++) {
    const from = stageNodes[i];
    const to = stageNodes[i + 1];
    const fb = from.getBounds();
    const tb = to.getBounds();
    group.add(
      routeConnector(
        app,
        fb.x + fb.width,
        fb.y + fb.height / 2,
        tb.x,
        tb.y + tb.height / 2,
        "straight"
      )
    );
  }
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
  toggleCollapse: toggleOrgCollapse
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
use(dashboardPlugin);
use(automotivePlugin);
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
  registerAutomotive,
  createAutomotiveFromJSON,
  applyDriveState,
  sampleDriveFrames,
  animateAutoValue,
  setAutoValue,
  Diagram
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
  VERSION,
  animate,
  animateAutoValue,
  animateLiveValue,
  applyDriveState,
  automotivePlugin,
  createApp,
  createPluginContext,
  dashboardPlugin,
  src_default as default,
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
  parallel,
  registerAutomotive,
  registerComponent,
  registerDashboard,
  registerEasing,
  registerJSONType,
  sampleDriveFrames,
  scenesEqual,
  setAutoValue,
  setLiveValue,
  svgPlugin,
  toJSON,
  uiPlugin,
  use,
  validateSceneJSON
};
//# sourceMappingURL=lightdraw.esm.js.map
