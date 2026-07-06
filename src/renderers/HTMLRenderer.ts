import { Renderer, type RenderContext } from './Renderer';
import type { Group } from '../shapes/Group';
import type { Node } from '../Node';
import { Rect, Circle, Ellipse, TextNode, Path, Line, Polyline, Arc, Polygon } from '../shapes/index';
import { Matrix2D } from '../utils';
import { isGradient, gradientToCss, shadowToCss } from './styles';
import { arcSectorPath } from './arcSector';
import { toHighContrastColor } from '../utils/a11y';
import { applyUiTheme, type UiThemeTokens } from '../components/uiTheme';
import {
  NATIVE_HTML_COMPONENTS,
  syncNativeAccordion,
  syncNativeButton,
  syncNativeCard,
  syncNativeCheckbox,
  syncNativeDialog,
  syncNativeInput,
  syncNativeMenu,
  syncNativeProgress,
  syncNativeRadio,
  syncNativeSlider,
  syncNativeStatusBar,
  syncNativeTable,
  syncNativeTabs,
  syncNativeTextarea,
  syncNativeToast,
  syncNativeToggle,
  syncNativeToolbar,
  syncNativeTooltip,
  syncNativeTree,
  type NativeSyncContext,
} from './htmlComponents';

/** HTML/CSS fallback renderer with incremental DOM updates. */
export class HTMLRenderer extends Renderer {
  private root!: HTMLElement;
  private nodeElements = new Map<string, HTMLElement>();
  private innerContainers = new Map<string, HTMLElement>();
  private seenIds = new Set<string>();
  private uiTheme: UiThemeTokens = {};

  init(container: HTMLElement, options: RenderContext): void {
    this.width = options.width;
    this.height = options.height;
    this.background = options.background;
    this.highContrast = options.highContrast ?? false;
    this.uiTheme = options.uiTheme ?? {};

    this.root = document.createElement('div');
    this.root.className = 'lightdraw-html-root';
    this.applyRootStyles();
    container.appendChild(this.root);
  }

  /** Replace programmatic theme tokens (re-applied after each layout pass). */
  setUiTheme(tokens: UiThemeTokens): void {
    this.uiTheme = { ...tokens };
    this.applyThemeVars();
  }

  private applyThemeVars(): void {
    if (Object.keys(this.uiTheme).length > 0) {
      applyUiTheme(this.root, this.uiTheme);
    }
  }

  private applyRootStyles(): void {
    this.root.style.cssText = `
      position: relative;
      width: ${this.width}px;
      height: ${this.height}px;
      overflow: hidden;
      background: ${this.highContrast ? '#000' : this.background};
    `;
    if (this.highContrast) {
      this.root.classList.add('lightdraw-high-contrast');
      this.root.setAttribute('data-ld-high-contrast', 'true');
    } else {
      this.root.classList.remove('lightdraw-high-contrast');
      this.root.removeAttribute('data-ld-high-contrast');
    }
    this.applyThemeVars();
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.applyRootStyles();
    this.forceFullRedraw();
  }

  getElement(): HTMLElement {
    return this.root;
  }

  render(root: Group, _cameraMatrix?: Matrix2D): void {
    this.applyRootStyles();
    this.seenIds.clear();
    this.syncGroup(root, this.root);
    this.pruneOrphans(this.root);
    this.clearDirty();
  }

  toDataURL(): string {
    return '';
  }

  destroy(): void {
    this.nodeElements.clear();
    this.innerContainers.clear();
    this.root.remove();
  }

  private shouldSyncWhenHidden(node: Node): boolean {
    const t = node.metadata?.componentType as string | undefined;
    return t === 'tooltip' || t === 'menu' || t === 'dialog';
  }

  private syncGroup(group: Group, parent: HTMLElement): void {
    group.sortChildren();
    for (const child of group.children) {
      if (!child.visible && !this.shouldSyncWhenHidden(child)) continue;
      this.syncNode(child, parent);
    }
  }

  private resolveRole(node: Node): string {
    if (node.role) return node.role;
    const componentType = node.metadata?.componentType as string | undefined;
    const roles: Record<string, string> = {
      button: 'button',
      checkbox: 'checkbox',
      slider: 'slider',
      toggle: 'switch',
      progressBar: 'progressbar',
      input: 'textbox',
      textarea: 'textbox',
      radio: 'radio',
      menu: 'menu',
      dialog: 'dialog',
      tabs: 'tablist',
      table: 'grid',
      tree: 'tree',
      toolbar: 'toolbar',
      toast: 'status',
      statusBar: 'status',
    };
    if (componentType && roles[componentType]) return roles[componentType];
    return 'img';
  }

  private applyA11y(node: Node, el: HTMLElement): void {
    const role = this.resolveRole(node);
    el.setAttribute('role', role);
    el.setAttribute('aria-label', node.name || (node.metadata?.label as string) || node.type);

    if (node.focusable) {
      el.tabIndex = node.id === this.focusedNodeId ? 0 : -1;
    } else {
      el.removeAttribute('tabindex');
    }

    if (node.id === this.focusedNodeId) {
      el.classList.add('lightdraw-focused');
    } else {
      el.classList.remove('lightdraw-focused');
    }

    if (node.ariaChecked !== undefined) {
      el.setAttribute('aria-checked', String(node.ariaChecked));
    } else {
      el.removeAttribute('aria-checked');
    }

    if (node.ariaValueNow !== undefined) {
      el.setAttribute('aria-valuenow', String(node.ariaValueNow));
    }
    if (node.ariaValueMin !== undefined) {
      el.setAttribute('aria-valuemin', String(node.ariaValueMin));
    }
    if (node.ariaValueMax !== undefined) {
      el.setAttribute('aria-valuemax', String(node.ariaValueMax));
    }

    const live = node.ariaLive ?? (node.metadata?.ariaLive as string | undefined);
    if (live && live !== 'off') {
      el.setAttribute('aria-live', live);
    } else {
      el.removeAttribute('aria-live');
    }
  }

  private nativeCtx(): NativeSyncContext {
    return {
      nodeElements: this.nodeElements,
      seenIds: this.seenIds,
      focusedNodeId: this.focusedNodeId,
      applyA11y: (node, el) => this.applyA11y(node, el),
      applyUiClasses: (node, el) => this.applyUiClasses(node, el),
    };
  }

  private syncNativeComponent(node: Node, parent: HTMLElement, type: string): boolean {
    const ctx = this.nativeCtx();
    switch (type) {
      case 'button':
        syncNativeButton(node, parent, ctx);
        return true;
      case 'checkbox':
        syncNativeCheckbox(node, parent, ctx);
        return true;
      case 'toggle':
        syncNativeToggle(node, parent, ctx);
        return true;
      case 'slider':
        syncNativeSlider(node, parent, ctx);
        return true;
      case 'radio':
        syncNativeRadio(node, parent, ctx);
        return true;
      case 'progressBar':
        syncNativeProgress(node, parent, ctx);
        return true;
      case 'card':
        syncNativeCard(node, parent, ctx);
        return true;
      case 'tabs':
        syncNativeTabs(node, parent, ctx);
        return true;
      case 'accordion':
        syncNativeAccordion(node, parent, ctx);
        return true;
      case 'table':
        syncNativeTable(node, parent, ctx);
        return true;
      case 'tree':
        syncNativeTree(node, parent, ctx);
        return true;
      case 'toolbar':
        syncNativeToolbar(node, parent, ctx);
        return true;
      case 'toast':
        syncNativeToast(node, parent, ctx);
        return true;
      case 'menu':
        syncNativeMenu(node, parent, ctx);
        return true;
      case 'dialog':
        syncNativeDialog(node, parent, ctx);
        return true;
      case 'tooltip':
        syncNativeTooltip(node, parent, ctx);
        return true;
      case 'statusBar':
        syncNativeStatusBar(node, parent, ctx);
        return true;
      default:
        return false;
    }
  }

  private syncNode(node: Node, parent: HTMLElement): void {
    const componentType = node.metadata?.componentType as string | undefined;
    if (componentType === 'input') {
      syncNativeInput(node, parent, this.nativeCtx());
      return;
    }
    if (componentType === 'textarea') {
      syncNativeTextarea(node, parent, this.nativeCtx());
      return;
    }

    if (componentType && NATIVE_HTML_COMPONENTS.has(componentType)) {
      if (this.syncNativeComponent(node, parent, componentType)) return;
    }

    if (this.isVectorShape(node)) {
      this.syncVectorShape(node, parent);
      return;
    }

    let el = this.nodeElements.get(node.id);
    if (!el) {
      el = document.createElement('div');
      el.id = node.id;
      parent.appendChild(el);
      this.nodeElements.set(node.id, el);
    } else if (el.parentElement !== parent) {
      parent.appendChild(el);
    }

    this.applyA11y(node, el);
    this.applyUiClasses(node, el);

    let extra = '';
    if (node.shadow) extra += `box-shadow: ${shadowToCss(node.shadow)};`;
    if (node.clip) extra += 'overflow: hidden;';

    el.style.cssText = `
      position: absolute;
      left: ${node.x}px;
      top: ${node.y}px;
      opacity: ${node.opacity};
      transform: rotate(${node.rotation}deg) scale(${node.scaleX}, ${node.scaleY});
      transform-origin: top left;
      pointer-events: ${node.listening ? 'auto' : 'none'};
      ${node.zIndex !== 0 ? `z-index: ${node.zIndex};` : ''}
      ${extra}
    `;

    this.applyShapeStyles(node, el);
    if (node instanceof TextNode) {
      this.applyTextBoxPosition(node, el);
    }
    this.seenIds.add(node.id);

    if ('children' in node) {
      const bounds = (node as Group).getBounds();
      const chartW = (node.metadata?.chartWidth ?? node.metadata?.autoWidth) as number | undefined;
      const chartH = (node.metadata?.chartHeight ?? node.metadata?.autoHeight) as number | undefined;
      if (node.metadata?.componentType && bounds.width > 0) {
        el.style.width = `${bounds.width}px`;
        el.style.height = `${Math.max(bounds.height, 1)}px`;
      } else if (chartW && chartW > 0) {
        el.style.height = `${Math.max(chartH ?? chartW, 1)}px`;
        el.style.width = `${chartW}px`;
      }

      let inner = this.innerContainers.get(node.id);
      if (!inner) {
        inner = document.createElement('div');
        inner.style.cssText = 'position:relative;width:100%;height:100%;';
        el.appendChild(inner);
        this.innerContainers.set(node.id, inner);
      }
      this.syncGroup(node as Group, inner);
    }
  }

  private applyUiClasses(node: Node, el: HTMLElement): void {
    const t = node.metadata?.componentType as string | undefined;
    if (t) {
      el.classList.add('lightdraw-ui', `lightdraw-ui--${t}`);
    }
    if (node.focusable || t === 'button' || t === 'checkbox' || t === 'radio' || t === 'toggle') {
      el.classList.add('lightdraw-interactive');
    }
  }

  private isVectorShape(node: Node): boolean {
    return (
      node instanceof Line ||
      node instanceof Polyline ||
      node instanceof Arc ||
      node instanceof Polygon ||
      node instanceof Path
    );
  }

  private syncVectorShape(node: Node, parent: HTMLElement): void {
    let svg = this.nodeElements.get(node.id) as unknown as SVGSVGElement | undefined;
    if (!svg || svg.tagName !== 'svg') {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.id = node.id;
      parent.appendChild(svg);
      this.nodeElements.set(node.id, svg as unknown as HTMLElement);
    } else if (svg.parentElement !== parent) {
      parent.appendChild(svg);
    }

    this.seenIds.add(node.id);

    const b = node.getBounds();
    const pad = Math.max(Math.ceil(node.strokeWidth || 0), 2) + 1;
    const w = Math.max(b.width + pad * 2, 1);
    const h = Math.max(b.height + pad * 2, 1);

    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = `
      position: absolute;
      left: ${node.x + b.x - pad}px;
      top: ${node.y + b.y - pad}px;
      width: ${w}px;
      height: ${h}px;
      overflow: visible;
      pointer-events: ${node.listening ? 'auto' : 'none'};
      opacity: ${node.opacity};
    `;

    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const ox = pad - b.x;
    const oy = pad - b.y;
    const strokeColor = node.stroke ? this.strokeToCss(node.stroke) : '#64748b';
    const sw = String(node.strokeWidth || 2);
    const fillColor =
      node.fill && node.fill !== null && node.fill !== 'transparent'
        ? this.fillToCss(node.fill)
        : 'none';

    if (node instanceof Line) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(ox));
      line.setAttribute('y1', String(oy));
      line.setAttribute('x2', String(node.x2 + ox));
      line.setAttribute('y2', String(node.y2 + oy));
      line.setAttribute('stroke', strokeColor);
      line.setAttribute('stroke-width', sw);
      line.setAttribute('stroke-linecap', node.lineCap);
      svg.appendChild(line);
    } else if (node instanceof Polyline) {
      const pts = node.points.map((v, i) => (i % 2 === 0 ? v + ox : v + oy)).join(' ');
      const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      poly.setAttribute('points', pts);
      poly.setAttribute('stroke', strokeColor);
      poly.setAttribute('stroke-width', sw);
      poly.setAttribute('fill', fillColor);
      poly.setAttribute('stroke-linejoin', node.lineJoin);
      poly.setAttribute('stroke-linecap', node.lineCap);
      svg.appendChild(poly);
    } else if (node instanceof Polygon) {
      const pts = node.points.map((v, i) => (i % 2 === 0 ? v + ox : v + oy)).join(' ');
      const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      poly.setAttribute('points', pts);
      poly.setAttribute('stroke', strokeColor);
      poly.setAttribute('stroke-width', sw);
      poly.setAttribute('fill', fillColor);
      svg.appendChild(poly);
    } else if (node instanceof Arc) {
      const cx = node.radius + ox;
      const cy = node.radius + oy;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute(
        'd',
        arcSectorPath(cx, cy, node.radius, node.startAngle, node.endAngle, node.innerRadius, node.counterClockwise)
      );
      path.setAttribute('stroke', strokeColor);
      path.setAttribute('stroke-width', sw);
      path.setAttribute('fill', fillColor);
      path.setAttribute('stroke-linecap', node.lineCap);
      svg.appendChild(path);
    } else if (node instanceof Path) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', node.d);
      path.setAttribute('stroke', node.stroke ? strokeColor : 'none');
      path.setAttribute('stroke-width', sw);
      path.setAttribute('fill', fillColor);
      path.setAttribute('transform', `translate(${ox}, ${oy})`);
      svg.appendChild(path);
    }
  }

  private fillToCss(fill: Node['fill']): string {
    if (!fill) return 'transparent';
    if (typeof fill === 'string') {
      return this.highContrast ? toHighContrastColor(fill, 'fill') : fill;
    }
    if (isGradient(fill)) return gradientToCss(fill);
    return 'transparent';
  }

  private strokeToCss(stroke: Node['stroke']): string {
    if (!stroke || typeof stroke !== 'string') return '#000';
    return this.highContrast ? toHighContrastColor(stroke, 'stroke') : stroke;
  }

  private applyTextBoxPosition(node: TextNode, el: HTMLElement): void {
    const boxW = node.metadata?.textBoxWidth as number | undefined;
    if (boxW && boxW > 0 && node.textAlign === 'center') {
      el.style.width = `${boxW}px`;
      el.style.textAlign = 'center';
      el.style.left = `${node.x - boxW / 2}px`;
      el.style.zIndex = String(Math.max(node.zIndex, 902));
      return;
    }
    if (node.textAlign && node.textAlign !== 'left') {
      el.style.textAlign = node.textAlign;
      const b = node.getBounds();
      el.style.width = `${Math.max(b.width, node.fontSize)}px`;
    }
  }

  private applyShapeStyles(node: Node, el: HTMLElement): void {
    if (node instanceof Rect) {
      el.style.width = `${node.width}px`;
      el.style.height = `${node.height}px`;
      el.style.background = this.fillToCss(node.fill);
      el.style.border = node.stroke
        ? `${node.strokeWidth}px solid ${this.strokeToCss(node.stroke)}`
        : 'none';
      el.style.borderRadius = node.cornerRadius ? `${node.cornerRadius}px` : '';
    } else if (node instanceof Circle) {
      el.style.width = `${node.radius * 2}px`;
      el.style.height = `${node.radius * 2}px`;
      el.style.borderRadius = '50%';
      el.style.background = this.fillToCss(node.fill);
      el.style.border = node.stroke
        ? `${node.strokeWidth}px solid ${this.strokeToCss(node.stroke)}`
        : 'none';
    } else if (node instanceof Ellipse) {
      el.style.width = `${node.radiusX * 2}px`;
      el.style.height = `${node.radiusY * 2}px`;
      el.style.borderRadius = '50%';
      el.style.background = this.fillToCss(node.fill);
    } else if (node instanceof TextNode) {
      el.textContent = node.text;
      el.style.font = `${node.fontWeight} ${node.fontSize}px ${node.fontFamily}`;
      el.style.color = this.fillToCss(node.fill);
      el.style.background = 'transparent';
      el.style.whiteSpace = 'pre';
      el.style.lineHeight = `${Math.max(node.fontSize + 2, 12)}px`;
    } else if (node instanceof Path) {
      // Vector paths use SVG via syncVectorShape
      const b = node.getBounds();
      el.style.width = `${Math.max(b.width, 1)}px`;
      el.style.height = `${Math.max(b.height, 1)}px`;
      el.style.background = 'transparent';
    }
  }

  private pruneOrphans(parent: HTMLElement): void {
    const toRemove: HTMLElement[] = [];
    for (const child of Array.from(parent.children) as HTMLElement[]) {
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

  drawGroup(_group: Group): void {}
  drawRect(_node: Rect): void {}
  drawCircle(_node: Circle): void {}
  drawText(_node: TextNode): void {}
}
