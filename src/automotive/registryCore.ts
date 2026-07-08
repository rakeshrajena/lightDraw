import type { App } from '../App';
import type { Node } from '../Node';
import type { Group } from '../shapes/Group';
import { getState, num, setState } from './helpers';
import { resolveBounds } from './layout';
import { installAutoWidgetRebuild } from './refresh';

type AutomotiveFactory = (props: Record<string, unknown>, app: App) => Node;

const registry: Record<string, AutomotiveFactory> = {};

export function registerAutomotive(type: string, factory: AutomotiveFactory): void {
  registry[type] = factory;
}

function isAutoGroup(node: Node): node is Group {
  return 'children' in node && typeof node.metadata?.autoType === 'string';
}

export function createAutomotiveFromJSON(
  type: string,
  props: Record<string, unknown>,
  app: App
): Node | null {
  const factory = registry[type];
  if (!factory) return null;
  const node = factory(props, app);
  if (node && isAutoGroup(node)) {
    const state = getState(node);
    const bounds = resolveBounds(
      { ...state, ...props },
      num(props, 'width', 160),
      num(props, 'height', 120)
    );
    if (!num(state, 'width', 0) || !num(state, 'height', 0)) {
      setState(node, { width: bounds.width, height: bounds.height });
      node.metadata.chartWidth = bounds.width;
      node.metadata.autoWidth = bounds.width;
      node.metadata.chartHeight = bounds.height;
      node.metadata.autoHeight = bounds.height;
    }
    installAutoWidgetRebuild(node, app, type);
  }
  return node;
}

export { registry };
