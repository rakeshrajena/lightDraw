import { Renderer, type RenderContext } from './Renderer';
import type { Group } from '../shapes/Group';
import type { Node } from '../Node';
import {
  Rect,
  Circle,
  Ellipse,
  Line,
  Arc,
  Polygon,
  Polyline,
  Path,
  Star,
  TextNode,
  ImageNode,
} from '../shapes/index';
import { Matrix2D } from '../utils';
import { isGradient, createSvgGradient, createSvgShadowFilter } from './styles';
import { arcSectorPath } from './arcSector';

export class SVGRenderer extends Renderer {
  private svg!: SVGSVGElement;
  private defs!: SVGDefsElement;
  private sceneRoot!: SVGGElement;
  private nodeElements = new Map<string, SVGGElement>();
  private shapeElements = new Map<string, SVGElement>();
  private defCounter = 0;
  private seenIds = new Set<string>();

  init(container: HTMLElement, options: RenderContext): void {
    this.width = options.width;
    this.height = options.height;
    this.background = options.background;

    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('width', String(this.width));
    this.svg.setAttribute('height', String(this.height));
    this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
    this.svg.style.display = 'block';

    this.defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    this.svg.appendChild(this.defs);

    this.sceneRoot = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.sceneRoot.setAttribute('data-lightdraw-scene', 'true');
    this.svg.appendChild(this.sceneRoot);

    if (this.background && this.background !== 'transparent') {
      const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bg.setAttribute('data-lightdraw-bg', 'true');
      bg.setAttribute('width', '100%');
      bg.setAttribute('height', '100%');
      bg.setAttribute('fill', this.background);
      this.svg.insertBefore(bg, this.sceneRoot);
    }

    container.appendChild(this.svg);
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.svg.setAttribute('width', String(width));
    this.svg.setAttribute('height', String(height));
    this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    this.forceFullRedraw();
  }

  getElement(): SVGSVGElement {
    return this.svg;
  }

  render(root: Group, cameraMatrix?: Matrix2D): void {
    if (cameraMatrix) {
      this.sceneRoot.setAttribute('transform', cameraMatrix.toCSS());
    } else {
      this.sceneRoot.removeAttribute('transform');
    }

    this.seenIds.clear();
    this.syncGroup(root, this.sceneRoot);
    this.pruneOrphans(this.sceneRoot);
    this.clearDirty();
  }

  toDataURL(type = 'image/svg+xml'): string {
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(this.svg);
    if (type === 'image/svg+xml') {
      return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)));
    }
    return svgStr;
  }

  destroy(): void {
    this.svg.remove();
    this.nodeElements.clear();
    this.shapeElements.clear();
  }

  private syncGroup(group: Group, parent: SVGGElement): void {
    group.sortChildren();
    for (const child of group.children) {
      if (!child.visible) continue;
      this.syncNode(child, parent);
    }
  }

  private syncNode(node: Node, parent: SVGGElement): void {
    let g = this.nodeElements.get(node.id);
    if (!g) {
      g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('id', node.id);
      parent.appendChild(g);
      this.nodeElements.set(node.id, g);
    } else if (g.parentNode !== parent) {
      parent.appendChild(g);
    }

    g.setAttribute('opacity', String(node.opacity));
    g.setAttribute(
      'transform',
      `translate(${node.x},${node.y}) rotate(${node.rotation}) scale(${node.scaleX},${node.scaleY})`
    );

    if (node.shadow) {
      const filterId = this.registerShadow(node.shadow, node.id);
      g.setAttribute('filter', `url(#${filterId})`);
    } else {
      g.removeAttribute('filter');
    }

    if (node.clip) {
      const clipId = this.registerClip(node, `${node.id}-clip`);
      g.setAttribute('clip-path', `url(#${clipId})`);
    } else {
      g.removeAttribute('clip-path');
    }

    if (node.mask) {
      const maskId = this.registerClip(node.mask, `${node.id}-mask`);
      g.setAttribute('mask', `url(#${maskId})`);
    } else {
      g.removeAttribute('mask');
    }

    node.draw(this);
    this.syncShapeElement(node, g);
    this.seenIds.add(node.id);

    if ('children' in node) {
      this.syncGroup(node as Group, g);
    }
  }

  private syncShapeElement(node: Node, parent: SVGGElement): void {
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
    if (el.parentNode !== parent) parent.appendChild(el);
  }

  private pruneOrphans(parent: SVGGElement): void {
    const toRemove: Element[] = [];
    const childNodes = Array.from(parent.childNodes) as Element[];
    for (const child of childNodes) {
      if (child.nodeName === 'g' && child.getAttribute('id') && !this.seenIds.has(child.getAttribute('id')!)) {
        toRemove.push(child);
      }
    }
    for (const el of toRemove) {
      const id = el.getAttribute('id');
      if (id) {
        this.nodeElements.delete(id);
        this.shapeElements.delete(id);
      }
      el.remove();
    }
    for (const child of Array.from(parent.childNodes) as Element[]) {
      if (child.nodeName === 'g' && child.getAttribute('id') && this.seenIds.has(child.getAttribute('id')!)) {
        this.pruneOrphans(child as SVGGElement);
      }
    }
  }

  private registerShadow(shadow: import('../types').Shadow, nodeId: string): string {
    const id = `shadow-${nodeId}-${this.defCounter++}`;
    this.defs.appendChild(createSvgShadowFilter(document, id, shadow));
    return id;
  }

  private registerClip(shapeNode: Node, prefix: string): string {
    const id = `${prefix}-${this.defCounter++}`;
    const ns = 'http://www.w3.org/2000/svg';
    const clip = document.createElementNS(ns, 'clipPath');
    clip.setAttribute('id', id);
    const use = this.createShapeElement(shapeNode);
    if (use) {
      use.removeAttribute('fill');
      use.removeAttribute('stroke');
      clip.appendChild(use);
    }
    this.defs.appendChild(clip);
    return id;
  }

  private registerGradient(fill: import('../types').Gradient, nodeId: string): string {
    const id = `grad-${nodeId}-${this.defCounter++}`;
    this.defs.appendChild(createSvgGradient(document, id, fill));
    return id;
  }

  private applyStyle(node: Node, elem: SVGElement): void {
    if (node.fill) {
      if (typeof node.fill === 'string') {
        elem.setAttribute('fill', node.fill);
      } else if (isGradient(node.fill)) {
        const gid = this.registerGradient(node.fill, node.id);
        elem.setAttribute('fill', `url(#${gid})`);
      } else {
        elem.setAttribute('fill', 'none');
      }
    } else {
      elem.setAttribute('fill', 'none');
    }
    if (node.stroke) {
      if (typeof node.stroke === 'string') {
        elem.setAttribute('stroke', node.stroke);
      } else if (isGradient(node.stroke)) {
        const gid = this.registerGradient(node.stroke, `${node.id}-s`);
        elem.setAttribute('stroke', `url(#${gid})`);
      }
      elem.setAttribute('stroke-width', String(node.strokeWidth));
    } else {
      elem.removeAttribute('stroke');
    }
    if (node.dash.length > 0) {
      elem.setAttribute('stroke-dasharray', node.dash.join(' '));
    } else {
      elem.removeAttribute('stroke-dasharray');
    }
    if (node.dashOffset !== 0) {
      elem.setAttribute('stroke-dashoffset', String(node.dashOffset));
    } else {
      elem.removeAttribute('stroke-dashoffset');
    }
  }

  private createShapeElement(node: Node): SVGElement | null {
    const ns = 'http://www.w3.org/2000/svg';
    let el: SVGElement | null = null;

    if (node instanceof Rect) {
      el = document.createElementNS(ns, 'rect');
      el.setAttribute('width', String(node.width));
      el.setAttribute('height', String(node.height));
      if (node.cornerRadius) el.setAttribute('rx', String(node.cornerRadius));
      this.applyStyle(node, el);
    } else if (node instanceof Circle) {
      el = document.createElementNS(ns, 'circle');
      el.setAttribute('cx', String(node.radius));
      el.setAttribute('cy', String(node.radius));
      el.setAttribute('r', String(node.radius));
      this.applyStyle(node, el);
    } else if (node instanceof Ellipse) {
      el = document.createElementNS(ns, 'ellipse');
      el.setAttribute('cx', String(node.radiusX));
      el.setAttribute('cy', String(node.radiusY));
      el.setAttribute('rx', String(node.radiusX));
      el.setAttribute('ry', String(node.radiusY));
      this.applyStyle(node, el);
    } else if (node instanceof Line) {
      el = document.createElementNS(ns, 'line');
      el.setAttribute('x1', '0');
      el.setAttribute('y1', '0');
      el.setAttribute('x2', String(node.x2));
      el.setAttribute('y2', String(node.y2));
      this.applyStyle(node, el);
    } else if (node instanceof TextNode) {
      el = document.createElementNS(ns, 'text');
      el.textContent = node.text;
      el.setAttribute('font-size', String(node.fontSize));
      el.setAttribute('font-family', node.fontFamily);
      if (node.fill && typeof node.fill === 'string') el.setAttribute('fill', node.fill);
    } else if (node instanceof Path) {
      el = document.createElementNS(ns, 'path');
      el.setAttribute('d', node.d);
      this.applyStyle(node, el);
    } else if (node instanceof Polygon) {
      el = document.createElementNS(ns, 'polygon');
      el.setAttribute('points', this.pointsAttr(node.points));
      this.applyStyle(node, el);
    } else if (node instanceof Polyline) {
      el = document.createElementNS(ns, 'polyline');
      el.setAttribute('points', this.pointsAttr(node.points));
      this.applyStyle(node, el);
    } else if (node instanceof Star) {
      el = document.createElementNS(ns, 'polygon');
      el.setAttribute('points', this.starPoints(node));
      this.applyStyle(node, el);
    } else if (node instanceof Arc) {
      el = document.createElementNS(ns, 'path');
      el.setAttribute(
        'd',
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
      el = document.createElementNS(ns, 'image');
      el.setAttribute('href', node.src);
      el.setAttribute('width', String(node.width));
      el.setAttribute('height', String(node.height));
    }

    return el;
  }

  private updateShapeElement(node: Node, el: SVGElement): void {
    if (node instanceof Rect) {
      el.setAttribute('width', String(node.width));
      el.setAttribute('height', String(node.height));
      if (node.cornerRadius) el.setAttribute('rx', String(node.cornerRadius));
      this.applyStyle(node, el);
    } else if (node instanceof Circle) {
      el.setAttribute('cx', String(node.radius));
      el.setAttribute('cy', String(node.radius));
      el.setAttribute('r', String(node.radius));
      this.applyStyle(node, el);
    } else if (node instanceof TextNode) {
      el.textContent = node.text;
      el.setAttribute('font-size', String(node.fontSize));
    } else if (node instanceof Path) {
      el.setAttribute('d', node.d);
      this.applyStyle(node, el);
    } else if (node instanceof Arc) {
      el.setAttribute(
        'd',
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

  private pointsAttr(points: number[]): string {
    const pts: string[] = [];
    for (let i = 0; i < points.length; i += 2) {
      pts.push(`${points[i]},${points[i + 1]}`);
    }
    return pts.join(' ');
  }

  private starPoints(node: Star): string {
    const pts: string[] = [];
    for (let i = 0; i < node.numPoints * 2; i++) {
      const r = i % 2 === 0 ? node.outerRadius : node.innerRadius;
      const angle = (i * Math.PI) / node.numPoints - Math.PI / 2;
      pts.push(`${node.outerRadius + r * Math.cos(angle)},${node.outerRadius + r * Math.sin(angle)}`);
    }
    return pts.join(' ');
  }

  drawGroup(_group: Group): void {}
  drawRect(_node: Rect): void {}
  drawCircle(_node: Circle): void {}
  drawEllipse(_node: Ellipse): void {}
  drawLine(_node: Line): void {}
  drawArc(_node: Arc): void {}
  drawPolygon(_node: Polygon): void {}
  drawPolyline(_node: Polyline): void {}
  drawPath(_node: Path): void {}
  drawStar(_node: Star): void {}
  drawText(_node: TextNode): void {}
  drawImage(_node: ImageNode): void {}
}
