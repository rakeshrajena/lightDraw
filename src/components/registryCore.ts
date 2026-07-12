import type { App } from '../App';
import type { Node } from '../Node';
import { Group } from '../shapes/Group';
import type { NodeOptions } from '../types';
import { syncActiveCanvasUiTheme, runWithCanvasUiTheme } from './resolveCanvasTheme';
import { resolveEffectiveUiTokens } from './nodeTheme';
import { installUiRebuild, UI_REBUILD_TYPES } from './uiRebuild';

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
  if (!factory) return null;
  const theme = syncActiveCanvasUiTheme(resolveEffectiveUiTokens(app, props), app);
  return runWithCanvasUiTheme(theme, () => {
    const node = factory(props, app);
    if (
      node &&
      'children' in node &&
      UI_REBUILD_TYPES.has(type) &&
      !node.metadata.uiRebuild
    ) {
      installUiRebuild(node as Group, app, factory);
    }
    return node;
  });
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
