import type { App } from '../App';
import type { Node } from '../Node';
import type { EventType, LightDrawEvent } from '../types';
import { createEvent } from '../core/EventEmitter';
import { collectFocusable } from '../utils/focusOrder';

interface DragState {
  node: Node;
  startX: number;
  startY: number;
  nodeStartX: number;
  nodeStartY: number;
  payload: unknown;
  overNode: Node | null;
}

export class EventManager {
  private app: App;
  private element: HTMLElement;
  private dragState: DragState | null = null;
  private hoverNode: Node | null = null;
  private focusedNode: Node | null = null;
  private boundHandlers: Record<string, EventListener> = {};

  constructor(app: App, element: HTMLElement) {
    this.app = app;
    this.element = element;
    if (!element.hasAttribute('tabindex')) {
      element.tabIndex = 0;
    }
    element.setAttribute('role', 'application');
    this.bindEvents();
  }

  getFocusedNode(): Node | null {
    return this.focusedNode;
  }

  setFocus(node: Node | null, originalEvent?: Event): void {
    if (this.focusedNode === node) return;
    const prev = this.focusedNode;
    this.focusedNode = node;
    if (prev) {
      this.dispatchDirect(prev, 'blur', originalEvent ?? new Event('blur'), 0, 0, 0, 0);
    }
    if (node) {
      this.dispatchDirect(node, 'focus', originalEvent ?? new Event('focus'), 0, 0, 0, 0);
    }
    this.app.requestRender();
  }

  private bindEvents(): void {
    const events = [
      'click',
      'dblclick',
      'mousedown',
      'mouseup',
      'mousemove',
      'wheel',
      'touchstart',
      'touchmove',
      'touchend',
      'keydown',
      'keyup',
    ];

    for (const type of events) {
      const handler = (e: Event) => this.handleEvent(type as EventType, e);
      this.boundHandlers[type] = handler;
      // Wheel must be non-passive so chart zoom can call preventDefault (block page scroll).
      this.element.addEventListener(type, handler, {
        passive: type === 'touchmove',
      });
    }
  }

  destroy(): void {
    for (const type in this.boundHandlers) {
      this.element.removeEventListener(type, this.boundHandlers[type]);
    }
  }

  private resolveDraggableNode(node: Node | null): Node | null {
    let cur: Node | null = node;
    while (cur) {
      if (cur.draggable) return cur;
      cur = cur.parent;
    }
    return null;
  }

  /** Map world-space pointer delta into the dragged node's parent local space. */
  private dragPositionFromWorld(
    node: Node,
    startWorldX: number,
    startWorldY: number,
    worldX: number,
    worldY: number,
    nodeStartX: number,
    nodeStartY: number
  ): { x: number; y: number } {
    const parent = node.parent;
    if (!parent) {
      return {
        x: nodeStartX + (worldX - startWorldX),
        y: nodeStartY + (worldY - startWorldY),
      };
    }
    const inv = parent.getWorldMatrix().invert();
    if (!inv) {
      return {
        x: nodeStartX + (worldX - startWorldX),
        y: nodeStartY + (worldY - startWorldY),
      };
    }
    const p0 = inv.transformPoint(startWorldX, startWorldY);
    const p1 = inv.transformPoint(worldX, worldY);
    return { x: nodeStartX + (p1.x - p0.x), y: nodeStartY + (p1.y - p0.y) };
  }

  private getPointerCoords(e: Event): { x: number; y: number } {
    const rect = this.element.getBoundingClientRect();
    if ('touches' in e && (e as TouchEvent).touches.length > 0) {
      const touch = (e as TouchEvent).touches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    if ('clientX' in e) {
      return { x: (e as MouseEvent).clientX - rect.left, y: (e as MouseEvent).clientY - rect.top };
    }
    return { x: 0, y: 0 };
  }

  private handleEvent(type: EventType, originalEvent: Event): void {
    if (type === 'keydown') {
      this.handleKeydown(originalEvent as KeyboardEvent);
      return;
    }

    const { x, y } = this.getPointerCoords(originalEvent);
    const world = this.app.camera.screenToWorld(x, y);

    if (this.dragState && (type === 'mousemove' || type === 'touchmove')) {
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
        'dragmove',
        originalEvent,
        x,
        y,
        world.x,
        world.y,
        this.dragState.payload
      );

      const over = this.app.hitTest(world.x, world.y)?.node ?? null;
      if (over && over.dropTarget && over !== this.dragState.node) {
        this.dispatchBubble(over, 'dragover', originalEvent, x, y, world.x, world.y, this.dragState.payload);
        this.dragState.overNode = over;
      } else {
        this.dragState.overNode = null;
      }

      this.app.requestRender();
      return;
    }

    if (type === 'mouseup' || type === 'touchend') {
      if (this.dragState) {
        const dropTarget = this.dragState.overNode;
        this.dispatchBubble(
          this.dragState.node,
          'dragend',
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
            'drop',
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

    if (type === 'mousemove' || type === 'touchmove') {
      if (target !== this.hoverNode) {
        if (this.hoverNode) {
          this.dispatchBubble(this.hoverNode, 'mouseleave', originalEvent, x, y, world.x, world.y);
        }
        if (target) {
          this.dispatchBubble(target, 'mouseenter', originalEvent, x, y, world.x, world.y);
        }
        this.hoverNode = target;
      }
    }

    if (target) {
      if (type === 'click' || type === 'dblclick') {
        if (target.focusable) {
          this.setFocus(target, originalEvent);
        }
      }

      this.dispatchBubble(target, type, originalEvent, x, y, world.x, world.y);

      if (type === 'mousedown' || type === 'touchstart') {
        const dragNode = this.resolveDraggableNode(target);
        if (dragNode) {
          this.dragState = {
            node: dragNode,
            startX: world.x,
            startY: world.y,
            nodeStartX: dragNode.x,
            nodeStartY: dragNode.y,
            payload: dragNode.dragPayload ?? dragNode.metadata?.dragPayload,
            overNode: null,
          };
          this.dispatchBubble(
            dragNode,
            'dragstart',
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

    if (type === 'wheel') {
      const wheelEvent = originalEvent as WheelEvent;
      const hit = this.app.hitTest(world.x, world.y);
      const target = hit?.node ?? null;
      let handled = false;
      if (target) {
        const event = createEvent('wheel', target, originalEvent, x, y, world.x, world.y);
        let current: Node | null = target;
        while (current) {
          if (current.listening) {
            event.currentTarget = current;
            current.emit('wheel', event);
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

  private handleKeydown(e: KeyboardEvent): void {
    const focusable = collectFocusable(this.app.stage);

    if (e.key === 'Tab' && focusable.length > 0) {
      e.preventDefault();
      const idx = this.focusedNode ? focusable.indexOf(this.focusedNode) : -1;
      const delta = e.shiftKey ? -1 : 1;
      const next = focusable[(idx + delta + focusable.length) % focusable.length];
      this.setFocus(next, e);
      return;
    }

    if ((e.key === 'Enter' || e.key === ' ') && this.focusedNode) {
      e.preventDefault();
      this.dispatchBubble(this.focusedNode, 'click', e, 0, 0, 0, 0);
    }
  }

  /** Dispatch without bubbling (focus/blur). */
  dispatchDirect(
    node: Node,
    type: EventType,
    originalEvent: Event,
    x: number,
    y: number,
    worldX: number,
    worldY: number,
    payload?: unknown
  ): void {
    if (!node.listening) return;
    const event = createEvent(type, node, originalEvent, x, y, worldX, worldY, payload);
    event.currentTarget = node;
    node.emit(type, event);
    this.app.emit(type, { ...event, target: node });
  }

  private dispatchBubble(
    node: Node,
    type: EventType,
    originalEvent: Event,
    x: number,
    y: number,
    worldX: number,
    worldY: number,
    payload?: unknown
  ): void {
    const event = createEvent(type, node, originalEvent, x, y, worldX, worldY, payload);
    let current: Node | null = node;

    while (current) {
      if (current.listening) {
        event.currentTarget = current;
        current.emit(type, event as LightDrawEvent);
        if (event.propagationStopped) break;
      }
      current = current.parent;
    }

    if (!event.propagationStopped) {
      this.app.emit(type, { ...event, target: node });
    }
  }
}
