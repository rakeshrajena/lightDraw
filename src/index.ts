import {
  LightDraw,
  VERSION,
  use,
  createApp,
  App,
  Node,
  Group,
  Layer,
  Rect,
  Circle,
  Ellipse,
  Line,
  Arc,
  Polygon,
  Polyline,
  Path,
  Star,
  RoundedRect,
  TextNode,
  ImageNode,
  Sprite,
  Camera,
  CanvasRenderer,
  Renderer,
  animate,
  AnimationEngine,
  Timeline,
  parallel,
  easings,
  getEasing,
  registerEasing,
  Layout,
  fromJSON,
  toJSON,
  registerJSONType,
  exportScene,
  exportApp,
  downloadExport,
  validateSceneJSON,
  scenesEqual,
  createPluginContext,
  getInstalledPlugins,
  Matrix2D,
  ObjectPool,
  detectBestRenderer,
  EventEmitter,
} from './core/index';

import { svgPlugin, SVGRenderer } from './modules/svg';
import { htmlPlugin, HTMLRenderer } from './modules/html';
import { uiPlugin, registerComponent, createComponentFromJSON } from './modules/ui';
import { dashboardPlugin, registerDashboard, createDashboardFromJSON, animateLiveValue, setLiveValue } from './modules/dashboard';
import {
  automotivePlugin,
  registerAutomotive,
  createAutomotiveFromJSON,
  applyDriveState,
  sampleDriveFrames,
  animateAutoValue,
  setAutoValue,
} from './modules/automotive';
import { diagramPlugin, Diagram } from './modules/diagram';

export { VERSION };

use(svgPlugin);
use(htmlPlugin);
use(uiPlugin);
use(dashboardPlugin);
use(automotivePlugin);
use(diagramPlugin);

export const LightDrawFull = Object.assign(LightDraw, {
  SVGRenderer,
  HTMLRenderer,
  registerComponent,
  createComponentFromJSON,
  registerDashboard,
  createDashboardFromJSON,
  animateLiveValue,
  setLiveValue,
  registerAutomotive,
  createAutomotiveFromJSON,
  applyDriveState,
  sampleDriveFrames,
  animateAutoValue,
  setAutoValue,
  Diagram,
});

export {
  use,
  createApp,
  App,
  Node,
  Group,
  Layer,
  Rect,
  Circle,
  Ellipse,
  Line,
  Arc,
  Polygon,
  Polyline,
  Path,
  Star,
  RoundedRect,
  TextNode,
  ImageNode,
  Sprite,
  Camera,
  CanvasRenderer,
  SVGRenderer,
  HTMLRenderer,
  Renderer,
  animate,
  AnimationEngine,
  Timeline,
  parallel,
  easings,
  getEasing,
  registerEasing,
  Layout,
  Diagram,
  fromJSON,
  toJSON,
  registerJSONType,
  exportScene,
  exportApp,
  downloadExport,
  validateSceneJSON,
  scenesEqual,
  registerComponent,
  registerDashboard,
  registerAutomotive,
  applyDriveState,
  sampleDriveFrames,
  animateAutoValue,
  setAutoValue,
  animateLiveValue,
  setLiveValue,
  createPluginContext,
  getInstalledPlugins,
  Matrix2D,
  ObjectPool,
  detectBestRenderer,
  EventEmitter,
  svgPlugin,
  htmlPlugin,
  uiPlugin,
  dashboardPlugin,
  automotivePlugin,
  diagramPlugin,
};

export { LightDrawFull as LightDraw };
export default LightDrawFull;

if (typeof window !== 'undefined') {
  (window as unknown as { LightDraw: typeof LightDrawFull }).LightDraw = LightDrawFull;
}
