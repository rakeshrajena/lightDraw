import type { Plugin, LightDrawStatic } from '../../types';
import { registerJSONResolver } from '../../registry/jsonResolvers';
import { registerDiagram, createDiagramFromJSON } from '../../diagram/registryCore';
import { Diagram } from '../../diagram/index';

import '../../diagram/definitions';

export const diagramPlugin: Plugin = {
  name: 'lightdraw-diagram',
  version: '1.0.0',
  install(LD: LightDrawStatic) {
    registerJSONResolver((type, props, app) => createDiagramFromJSON(type, props, app));
    (LD as LightDrawStatic & { registerDiagram: typeof registerDiagram }).registerDiagram =
      registerDiagram;
    (LD as LightDrawStatic & { Diagram: typeof Diagram }).Diagram = Diagram;
  },
};

export { Diagram };
export {
  registerDiagram,
  createDiagramFromJSON,
  diagramToJSON,
  forceDirectedLayout,
  routeConnector,
} from '../../diagram/registry';
export {
  DIAGRAM,
  resolveDiagramTheme,
  getActiveDiagram,
  getDiagramTheme,
  syncActiveDiagramTheme,
  runWithDiagramTheme,
} from '../../diagram/theme';
export type { DiagramTheme } from '../../diagram/theme';
export { refreshDiagram, installDiagramRebuild } from '../../diagram/refresh';
export default diagramPlugin;
