import type { App } from '../App';
import type { Node } from '../Node';
import { Group } from '../shapes/Group';
import type { NodeOptions } from '../types';

type ComponentFactory = (props: Record<string, unknown>, app: App) => Node;

const registry: Record<string, ComponentFactory> = {};

export function registerComponent(type: string, factory: ComponentFactory): void {
  registry[type] = factory;
}

export function createComponentFromJSON(
  type: string,
  props: Record<string, unknown>,
  app: App
): Node | null {
  const factory = registry[type];
  return factory ? factory(props, app) : null;
}

/** Base UI component wrapper */
export class UIComponent extends Group {
  componentType: string;

  constructor(type: string, options: NodeOptions = {}) {
    super(options);
    this.type = 'component';
    this.componentType = type;
  }
}

export { registry };
