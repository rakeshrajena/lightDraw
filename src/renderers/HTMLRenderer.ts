import { Renderer, type RenderContext } from './Renderer';
import type { Group } from '../shapes/Group';
import type { Node } from '../Node';
import { Rect, Circle, Ellipse, TextNode, Path } from '../shapes/index';
import { Matrix2D } from '../utils';
import { isGradient, gradientToCss, shadowToCss } from './styles';
import { toHighContrastColor } from '../utils/a11y';
import { syntheticEvent } from '../components/helpers';

/** HTML/CSS fallback renderer with incremental DOM updates. */
export class HTMLRenderer extends Renderer {
  private root!: HTMLElement;
  private nodeElements = new Map<string, HTMLElement>();
  private innerContainers = new Map<string, HTMLElement>();
  private seenIds = new Set<string>();

  init(container: HTMLElement, options: RenderContext): void {
    this.width = options.width;
    this.height = options.height;
    this.background = options.background;
    this.highContrast = options.highContrast ?? false;

    this.root = document.createElement('div');
    this.root.className = 'lightdraw-html-root';
    this.applyRootStyles();
    container.appendChild(this.root);
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
    } else {
      this.root.classList.remove('lightdraw-high-contrast');
    }
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

  private syncGroup(group: Group, parent: HTMLElement): void {
    group.sortChildren();
    for (const child of group.children) {
      if (!child.visible) continue;
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

  private syncNativeField(node: Node, parent: HTMLElement, kind: 'input' | 'textarea'): void {
    let el = this.nodeElements.get(node.id) as HTMLInputElement | HTMLTextAreaElement | undefined;
    const state = (node.metadata?.componentState ?? {}) as Record<string, unknown>;
    const width = (state.width as number) ?? 200;
    const height = (state.height as number) ?? (kind === 'textarea' ? 80 : 32);
    const value = (state.value as string) ?? '';
    const placeholder = (state.placeholder as string) ?? '';

    if (!el) {
      el = kind === 'textarea' ? document.createElement('textarea') : document.createElement('input');
      el.id = node.id;
      el.className = `lightdraw-native-${kind}`;
      if (kind === 'input') (el as HTMLInputElement).type = 'text';
      parent.appendChild(el);

      el.addEventListener('input', () => {
        const v = el!.value;
        node.metadata.componentState = { ...state, value: v };
        node.emit('input', syntheticEvent('input', node, { value: v }));
        node.getApp()?.requestRender();
      });
      el.addEventListener('change', () => {
        const v = el!.value;
        node.metadata.componentState = { ...state, value: v };
        node.emit('change', syntheticEvent('change', node, { value: v }));
      });
      el.addEventListener('focus', () => node.getApp()?.focusNode(node));
      this.nodeElements.set(node.id, el as HTMLElement);
    }

    this.applyA11y(node, el as HTMLElement);
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
      pointer-events: ${node.listening ? 'auto' : 'none'};
    `;
    el.value = value;
    el.placeholder = placeholder;
    if (node.focusable) {
      el.tabIndex = node.id === this.focusedNodeId ? 0 : -1;
    }
    this.seenIds.add(node.id);
  }

  private syncNode(node: Node, parent: HTMLElement): void {
    const componentType = node.metadata?.componentType as string | undefined;
    if (componentType === 'input' || componentType === 'textarea') {
      this.syncNativeField(node, parent, componentType);
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
      ${extra}
    `;

    this.applyShapeStyles(node, el);
    this.seenIds.add(node.id);

    if ('children' in node) {
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
    } else if (node instanceof Path) {
      const b = node.getBounds();
      el.style.width = `${Math.max(b.width, 1)}px`;
      el.style.height = `${Math.max(b.height, 1)}px`;
      el.style.background = this.fillToCss(node.fill);
      el.style.border = node.stroke
        ? `${node.strokeWidth}px solid ${this.strokeToCss(node.stroke)}`
        : 'none';
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
