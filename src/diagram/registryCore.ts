import type { App } from '../App';
import type { Node } from '../Node';
import type { Group } from '../shapes/Group';
import { createDiagramFromProps } from './definitions';
import { syncActiveDiagramTheme, runWithDiagramTheme } from './theme';
import { installDiagramRebuild } from './refresh';
import { resolveEffectiveUiTokens } from '../components/nodeTheme';

type DiagramFactory = (props: Record<string, unknown>, app: App) => Node;

const registry: Record<string, DiagramFactory> = {};

export function registerDiagram(type: string, factory: DiagramFactory): void {
  registry[type] = factory;
}

export function createDiagramFromJSON(
  type: string,
  props: Record<string, unknown>,
  app: App
): Node | null {
  const theme = syncActiveDiagramTheme(resolveEffectiveUiTokens(app, props), app);

  return runWithDiagramTheme(theme, () => {
    const registered = registry[type];
    const node = registered ? registered(props, app) : createDiagramFromProps(type, props, app);
    if (!node) return null;

    if ('children' in node && node.metadata?.diagramType && !node.metadata.diagramRebuild) {
      installDiagramRebuild(node as Group, app, (p, a) => {
        const fresh = registered ? registered(p, a) : createDiagramFromProps(type, p, a);
        if (!fresh) throw new Error(`Unknown diagram type: ${type}`);
        return fresh;
      });
    }
    return node;
  });
}

export { registry };
