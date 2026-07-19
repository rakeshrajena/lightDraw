/**
 * Shared network glyph primitives.
 */
import type { App } from '../../../App';
import type { Group } from '../../../shapes/Group';
import { quadraticToPoints } from '../../pathUtils';

const SW = 1.7;

export function L(
  app: App,
  parent: Group,
  x: number,
  y: number,
  dx: number,
  dy: number,
  color: string,
  sw = SW
): void {
  parent.add(
    app.line({
      x,
      y,
      x2: dx,
      y2: dy,
      stroke: color,
      strokeWidth: sw,
      lineCap: 'round',
      lineJoin: 'round',
      listening: false,
    })
  );
}

export function R(
  app: App,
  parent: Group,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  sw = SW,
  cr = 2.5,
  fill: string | null = null
): void {
  parent.add(
    app.roundedRect({
      x,
      y,
      width: w,
      height: h,
      cornerRadius: cr,
      fill,
      stroke: color,
      strokeWidth: sw,
      listening: false,
    })
  );
}

/** Circle centered at (cx, cy) — compensates for top-left circle origin. */
export function C(
  app: App,
  parent: Group,
  cx: number,
  cy: number,
  r: number,
  color: string,
  sw = SW,
  fill: string | null = null
): void {
  parent.add(
    app.circle({
      x: cx - r,
      y: cy - r,
      radius: r,
      fill,
      stroke: fill ? null : color,
      strokeWidth: fill ? 0 : sw,
      listening: false,
    })
  );
}

export function E(
  app: App,
  parent: Group,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: string,
  sw = SW
): void {
  parent.add(
    app.ellipse({
      x: cx - rx,
      y: cy - ry,
      radiusX: rx,
      radiusY: ry,
      fill: null,
      stroke: color,
      strokeWidth: sw,
      listening: false,
    })
  );
}

export function poly(
  app: App,
  parent: Group,
  points: number[],
  color: string,
  sw = SW,
  fill: string | null = null
): void {
  parent.add(
    app.polygon({ points, fill, stroke: color, strokeWidth: sw, listening: false })
  );
}

export function pline(
  app: App,
  parent: Group,
  points: number[],
  color: string,
  sw = SW
): void {
  parent.add(
    app.polyline({
      points,
      fill: null,
      stroke: color,
      strokeWidth: sw,
      lineCap: 'round',
      lineJoin: 'round',
      listening: false,
    })
  );
}

/** Continuous cloud outline (Visio-style). */
export function drawCloudShape(app: App, parent: Group, cx: number, cy: number, color: string): void {
  const bumps = [
    { x: cx - 10, y: cy + 3, r: 6.5 },
    { x: cx - 2, y: cy - 5, r: 7.5 },
    { x: cx + 9, y: cy - 2, r: 7 },
    { x: cx + 11, y: cy + 5, r: 5.5 },
    { x: cx, y: cy + 7, r: 6 },
  ];
  for (const b of bumps) C(app, parent, b.x, b.y, b.r, color, 1.55);
}

export function drawGlobe(app: App, parent: Group, cx: number, cy: number, color: string): void {
  C(app, parent, cx, cy, 13, color, 1.75);
  E(app, parent, cx, cy, 6, 13, color, 1.35);
  L(app, parent, cx - 13, cy, 26, 0, color, 1.35);
  L(app, parent, cx - 11, cy - 6, 22, 0, color, 1.15);
  L(app, parent, cx - 11, cy + 6, 22, 0, color, 1.15);
}

export function drawRouterHex(app: App, parent: Group, cx: number, cy: number, size: number, color: string): void {
  const r = size * 0.3;
  const hex: number[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    hex.push(cx + r * Math.cos(a), cy + 2 + r * Math.sin(a));
  }
  poly(app, parent, hex, color, 1.85);
  C(app, parent, cx, cy + 2, 3.4, color, 1, color);
  for (const sign of [-1, 1] as const) {
    pline(
      app,
      parent,
      quadraticToPoints(cx + sign * 5, cy - 8, cx + sign * 13, cy - 16, cx + sign * 3, cy - 19, 7),
      color,
      1.45
    );
  }
}

export function drawServerRack(app: App, parent: Group, cx: number, cy: number, color: string): void {
  R(app, parent, cx - 13, cy - 15, 26, 30, color, 1.75, 3.5);
  for (let i = 0; i < 3; i++) {
    const y = cy - 11 + i * 8.5;
    R(app, parent, cx - 9, y, 14, 5.5, color, 1.15, 1.2);
    C(app, parent, cx + 8.5, y + 2.75, 1.5, color, 1, i === 0 ? color : null);
  }
}

export function drawSwitchBody(app: App, parent: Group, cx: number, cy: number, color: string): void {
  R(app, parent, cx - 16, cy - 9, 32, 18, color, 1.75, 3.5);
  for (let i = 0; i < 8; i++) {
    R(
      app,
      parent,
      cx - 14 + i * 3.6,
      cy - 3,
      2.6,
      7,
      color,
      0.95,
      0.5,
      i % 2 === 0 ? color : null
    );
  }
  L(app, parent, cx - 13, cy - 12, 26, 0, color, 1.25);
  C(app, parent, cx + 12, cy - 12, 1.4, color, 1, color);
}

export function drawMonitor(app: App, parent: Group, cx: number, cy: number, color: string): void {
  R(app, parent, cx - 14, cy - 13, 28, 18, color, 1.75, 3);
  R(app, parent, cx - 11, cy - 10, 22, 12, color, 1.15, 1.5);
  L(app, parent, cx, cy + 5, 0, 5, color, 1.7);
  L(app, parent, cx - 8, cy + 11, 16, 0, color, 1.7);
}

export function drawShield(
  app: App,
  parent: Group,
  cx: number,
  cy: number,
  color: string,
  mark: 'check' | 'eye' | 'lock' | 'none' = 'check'
): void {
  poly(
    app,
    parent,
    [cx, cy - 15, cx + 12, cy - 9, cx + 11, cy + 3, cx, cy + 15, cx - 11, cy + 3, cx - 12, cy - 9],
    color,
    1.8
  );
  if (mark === 'check') {
    pline(app, parent, [cx - 5, cy + 1, cx - 1, cy + 6, cx + 7, cy - 5], color, 1.7);
  } else if (mark === 'eye') {
    E(app, parent, cx, cy, 5, 3.2, color, 1.35);
    C(app, parent, cx, cy, 1.8, color, 1, color);
  } else if (mark === 'lock') {
    R(app, parent, cx - 4, cy - 1, 8, 7, color, 1.35, 1.2);
    pline(app, parent, [cx - 3, cy - 1, cx - 3, cy - 5, cx + 3, cy - 5, cx + 3, cy - 1], color, 1.35);
  }
}

export function drawCylinder(app: App, parent: Group, cx: number, cy: number, color: string): void {
  const w = 22;
  const h = 16;
  const rx = w / 2;
  const ry = 4.5;
  E(app, parent, cx, cy - h / 2, rx, ry, color, 1.55);
  L(app, parent, cx - rx, cy - h / 2, 0, h, color, 1.55);
  L(app, parent, cx + rx, cy - h / 2, 0, h, color, 1.55);
  E(app, parent, cx, cy + h / 2, rx, ry, color, 1.55);
  E(app, parent, cx, cy - 1, rx, ry * 0.85, color, 1.15);
}

export function drawWifiArcs(app: App, parent: Group, cx: number, cy: number, color: string): void {
  C(app, parent, cx, cy + 8, 2.4, color, 1, color);
  for (const r of [7, 11, 15]) {
    pline(
      app,
      parent,
      quadraticToPoints(cx - r, cy + 4, cx, cy + 4 - r * 0.85, cx + r, cy + 4, 10),
      color,
      1.55
    );
  }
}

export function drawLoadBalancer(app: App, parent: Group, cx: number, cy: number, color: string): void {
  R(app, parent, cx - 5, cy - 13, 10, 9, color, 1.6, 2);
  L(app, parent, cx, cy - 4, 0, 5, color, 1.55);
  L(app, parent, cx - 11, cy + 2, 22, 0, color, 1.55);
  for (const ox of [-11, 0, 11]) {
    L(app, parent, cx + ox, cy + 2, 0, 8, color, 1.45);
    C(app, parent, cx + ox, cy + 12, 2.2, color, 1.2);
  }
}

export function drawZoneBox(app: App, parent: Group, cx: number, cy: number, color: string): void {
  R(app, parent, cx - 15, cy - 11, 30, 22, color, 1.55, 4);
  parent.add(
    app.roundedRect({
      x: cx - 11,
      y: cy - 7,
      width: 22,
      height: 14,
      cornerRadius: 2.5,
      fill: null,
      stroke: color,
      strokeWidth: 1.2,
      dash: [3.5, 2.5],
      listening: false,
    })
  );
}

/** Draw a standard network glyph centered in a size×size box. */
