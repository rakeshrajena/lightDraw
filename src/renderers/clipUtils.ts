import type { Node } from '../Node';
import type { Group } from '../shapes/Group';
import { Rect, Circle, Ellipse, Polygon, Star, Path, Arc } from '../shapes/index';

export function beginShapeClip(ctx: CanvasRenderingContext2D, node: Node): void {
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
      for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
      ctx.closePath();
    }
  } else if (node instanceof Star) {
    const pts = starPoints(node);
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
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
  } else if ('children' in node) {
    const g = node as Group;
    if (g.children.length === 0) {
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

function starPoints(node: Star): number[] {
  const pts: number[] = [];
  const cx = node.outerRadius;
  const cy = node.outerRadius;
  for (let i = 0; i < node.numPoints * 2; i++) {
    const r = i % 2 === 0 ? node.outerRadius : node.innerRadius;
    const angle = (i * Math.PI) / node.numPoints - Math.PI / 2;
    pts.push(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
  }
  return pts;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
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

export function pointInMask(mask: Node | null, localX: number, localY: number): boolean {
  if (!mask) return true;
  return mask.containsPoint(localX - mask.x, localY - mask.y);
}
