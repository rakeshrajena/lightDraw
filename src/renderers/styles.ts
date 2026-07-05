import type { FillStyle, Gradient, Pattern, Shadow, StrokeStyle } from '../types';

export function isGradient(style: FillStyle | StrokeStyle): style is Gradient {
  return (
    style !== null &&
    typeof style === 'object' &&
    'stops' in style &&
    'type' in style
  );
}

export function isPattern(style: FillStyle | StrokeStyle): style is Pattern {
  return style !== null && typeof style === 'object' && (style as Pattern).type === 'pattern';
}

export function gradientToCss(g: Gradient): string {
  const stops = g.stops.map((s) => `${s.color} ${s.offset * 100}%`).join(', ');
  if (g.type === 'radial') {
    return `radial-gradient(circle at ${g.x0}px ${g.y0}px, ${stops})`;
  }
  const angle = Math.atan2(g.y1 - g.y0, g.x1 - g.x0) * (180 / Math.PI) + 90;
  return `linear-gradient(${angle}deg, ${stops})`;
}

export function createSvgGradient(
  doc: Document,
  id: string,
  g: Gradient
): SVGLinearGradientElement | SVGRadialGradientElement {
  const ns = 'http://www.w3.org/2000/svg';
  if (g.type === 'radial') {
    const el = doc.createElementNS(ns, 'radialGradient') as SVGRadialGradientElement;
    el.setAttribute('id', id);
    el.setAttribute('cx', String(g.x0));
    el.setAttribute('cy', String(g.y0));
    el.setAttribute('r', String(g.r1 ?? 50));
    appendStops(doc, el, g);
    return el;
  }
  const el = doc.createElementNS(ns, 'linearGradient') as SVGLinearGradientElement;
  el.setAttribute('id', id);
  el.setAttribute('x1', String(g.x0));
  el.setAttribute('y1', String(g.y0));
  el.setAttribute('x2', String(g.x1));
  el.setAttribute('y2', String(g.y1));
  appendStops(doc, el, g);
  return el;
}

function appendStops(doc: Document, gradient: SVGGradientElement, g: Gradient): void {
  const ns = 'http://www.w3.org/2000/svg';
  for (const stop of g.stops) {
    const el = doc.createElementNS(ns, 'stop');
    el.setAttribute('offset', String(stop.offset));
    el.setAttribute('stop-color', stop.color);
    gradient.appendChild(el);
  }
}

export function shadowToCss(shadow: Shadow): string {
  return `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.color}`;
}

export function createSvgShadowFilter(doc: Document, id: string, shadow: Shadow): SVGFilterElement {
  const ns = 'http://www.w3.org/2000/svg';
  const filter = doc.createElementNS(ns, 'filter') as SVGFilterElement;
  filter.setAttribute('id', id);
  filter.setAttribute('x', '-50%');
  filter.setAttribute('y', '-50%');
  filter.setAttribute('width', '200%');
  filter.setAttribute('height', '200%');

  const blur = doc.createElementNS(ns, 'feGaussianBlur');
  blur.setAttribute('in', 'SourceAlpha');
  blur.setAttribute('stdDeviation', String(shadow.blur / 2));
  blur.setAttribute('result', 'blur');

  const offset = doc.createElementNS(ns, 'feOffset');
  offset.setAttribute('in', 'blur');
  offset.setAttribute('dx', String(shadow.offsetX));
  offset.setAttribute('dy', String(shadow.offsetY));
  offset.setAttribute('result', 'offsetBlur');

  const flood = doc.createElementNS(ns, 'feFlood');
  flood.setAttribute('flood-color', shadow.color);
  flood.setAttribute('result', 'color');

  const composite = doc.createElementNS(ns, 'feComposite');
  composite.setAttribute('in', 'color');
  composite.setAttribute('in2', 'offsetBlur');
  composite.setAttribute('operator', 'in');
  composite.setAttribute('result', 'shadow');

  const merge = doc.createElementNS(ns, 'feMerge');
  const n1 = doc.createElementNS(ns, 'feMergeNode');
  n1.setAttribute('in', 'shadow');
  const n2 = doc.createElementNS(ns, 'feMergeNode');
  n2.setAttribute('in', 'SourceGraphic');
  merge.appendChild(n1);
  merge.appendChild(n2);

  filter.appendChild(blur);
  filter.appendChild(offset);
  filter.appendChild(flood);
  filter.appendChild(composite);
  filter.appendChild(merge);
  return filter;
}

export function setCanvasFill(
  ctx: CanvasRenderingContext2D,
  fill: FillStyle,
  patternCache?: Map<string, CanvasPattern>
): void {
  if (!fill) return;
  if (typeof fill === 'string') {
    ctx.fillStyle = fill;
  } else if (isGradient(fill)) {
    const grad =
      fill.type === 'linear'
        ? ctx.createLinearGradient(fill.x0, fill.y0, fill.x1, fill.y1)
        : ctx.createRadialGradient(fill.x0, fill.y0, fill.r0 ?? 0, fill.x1, fill.y1, fill.r1 ?? 50);
    for (const stop of fill.stops) {
      grad.addColorStop(stop.offset, stop.color);
    }
    ctx.fillStyle = grad;
  } else if (isPattern(fill)) {
    const key = typeof fill.source === 'string' ? fill.source : 'canvas-pattern';
    let pattern: CanvasPattern | undefined = patternCache?.get(key);
    if (!pattern && typeof fill.source !== 'string') {
      const created = ctx.createPattern(fill.source, fill.repeat);
      if (created) {
        pattern = created;
        if (patternCache) patternCache.set(key, pattern);
      }
    }
    if (pattern) ctx.fillStyle = pattern;
  }
}

export function setCanvasStroke(ctx: CanvasRenderingContext2D, stroke: StrokeStyle): void {
  if (!stroke) return;
  if (typeof stroke === 'string') {
    ctx.strokeStyle = stroke;
  } else if (isGradient(stroke)) {
    setCanvasFill(ctx, stroke);
    ctx.strokeStyle = ctx.fillStyle;
  }
}

export function fillStyleRef(
  style: FillStyle | StrokeStyle,
  prefix: string,
  id: string
): string {
  if (typeof style === 'string') return style;
  if (isGradient(style) || isPattern(style)) return `url(#${prefix}-${id})`;
  return 'none';
}
