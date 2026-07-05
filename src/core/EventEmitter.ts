import type { EventType, LightDrawEvent } from '../types';

type EventHandler = (event: LightDrawEvent) => void;

export class EventEmitter {
  private listeners: Map<string, Set<EventHandler>> = new Map();

  on(type: EventType, handler: EventHandler): this {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);
    return this;
  }

  off(type: EventType, handler?: EventHandler): this {
    if (!handler) {
      this.listeners.delete(type);
    } else {
      this.listeners.get(type)?.delete(handler);
    }
    return this;
  }

  once(type: EventType, handler: EventHandler): this {
    const wrapper: EventHandler = (e) => {
      this.off(type, wrapper);
      handler(e);
    };
    return this.on(type, wrapper);
  }

  emit(type: EventType, event: LightDrawEvent): boolean {
    const handlers = this.listeners.get(type);
    if (!handlers || handlers.size === 0) return false;
    for (const handler of handlers) {
      handler(event);
    }
    return true;
  }

  hasListeners(type?: EventType): boolean {
    if (type) return (this.listeners.get(type)?.size ?? 0) > 0;
    for (const set of this.listeners.values()) {
      if (set.size > 0) return true;
    }
    return false;
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}

export function createEvent(
  type: EventType,
  target: unknown,
  originalEvent: Event,
  x: number,
  y: number,
  worldX: number,
  worldY: number,
  payload?: unknown
): LightDrawEvent & { propagationStopped: boolean } {
  const state = { stopped: false };
  const event: LightDrawEvent & { propagationStopped: boolean } = {
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
    },
  };
  return event;
}
