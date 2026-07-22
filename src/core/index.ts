import { App } from '../App';
import { Node } from '../Node';
import { EventEmitter } from '../core/EventEmitter';
import { Group, Layer } from '../shapes/Group';
import {
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
} from '../shapes/index';
import { Camera } from '../camera/Camera';
import { CanvasRenderer } from '../renderers/CanvasRenderer';
import { Renderer } from '../renderers/Renderer';
import { registerRenderer } from '../registry/renderers';
import { animate, AnimationEngine } from '../animation/Animation';
import { Timeline, parallel } from '../animation/Timeline';
import { easings, getEasing, registerEasing } from '../animation/Easing';
import { Layout } from '../layout/index';
import { fromJSON, toJSON, registerJSONType, compactSceneJSON } from '../io/json';
import {
  exportScene,
  exportApp,
  downloadExport,
  validateSceneJSON,
  parseAndValidateSceneJSON,
  formatJsonParseError,
  locateJsonError,
  formatValidationErrors,
  validateThemePack,
  listKnownSceneTypes,
  formatExpectedValues,
  formatInvalidValue,
  suggestClosest,
  scenesEqual,
} from '../io/export';
import type { ValidationResult, ValidationIssue, JsonErrorLocation } from '../io/schema';
import { installPlugin, createPluginContext, getInstalledPlugins } from '../plugins/index';
import type { AppOptions, Plugin, LightDrawStatic } from '../types';
import { Matrix2D, ObjectPool, detectBestRenderer } from '../utils';

export const VERSION = '1.2.1';

registerRenderer('canvas', () => new CanvasRenderer());

function use(plugin: Plugin): void {
  installPlugin(plugin, LightDraw);
}

function createApp(container: string | HTMLElement, options?: AppOptions): App {
  return new App(container, options);
}

export const LightDraw: LightDrawStatic & {
  App: typeof App;
  Node: typeof Node;
  Group: typeof Group;
  Layer: typeof Layer;
  Rect: typeof Rect;
  Circle: typeof Circle;
  Ellipse: typeof Ellipse;
  Line: typeof Line;
  Arc: typeof Arc;
  Polygon: typeof Polygon;
  Polyline: typeof Polyline;
  Path: typeof Path;
  Star: typeof Star;
  RoundedRect: typeof RoundedRect;
  Text: typeof TextNode;
  Image: typeof ImageNode;
  Sprite: typeof Sprite;
  Camera: typeof Camera;
  CanvasRenderer: typeof CanvasRenderer;
  Renderer: typeof Renderer;
  animate: typeof animate;
  AnimationEngine: typeof AnimationEngine;
  Timeline: typeof Timeline;
  parallel: typeof parallel;
  easings: typeof easings;
  getEasing: typeof getEasing;
  registerEasing: typeof registerEasing;
  Layout: typeof Layout;
  fromJSON: typeof fromJSON;
  toJSON: typeof toJSON;
  compactSceneJSON: typeof compactSceneJSON;
  registerJSONType: typeof registerJSONType;
  exportScene: typeof exportScene;
  exportApp: typeof exportApp;
  downloadExport: typeof downloadExport;
  validateSceneJSON: typeof validateSceneJSON;
  parseAndValidateSceneJSON: typeof parseAndValidateSceneJSON;
  formatJsonParseError: typeof formatJsonParseError;
  locateJsonError: typeof locateJsonError;
  formatValidationErrors: typeof formatValidationErrors;
  validateThemePack: typeof validateThemePack;
  listKnownSceneTypes: typeof listKnownSceneTypes;
  formatExpectedValues: typeof formatExpectedValues;
  formatInvalidValue: typeof formatInvalidValue;
  suggestClosest: typeof suggestClosest;
  scenesEqual: typeof scenesEqual;
  createPluginContext: typeof createPluginContext;
  getInstalledPlugins: typeof getInstalledPlugins;
  Matrix2D: typeof Matrix2D;
  ObjectPool: typeof ObjectPool;
  detectBestRenderer: typeof detectBestRenderer;
  EventEmitter: typeof EventEmitter;
} = {
  version: VERSION,
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
  Text: TextNode,
  Image: ImageNode,
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
  compactSceneJSON,
  registerJSONType,
  exportScene,
  exportApp,
  downloadExport,
  validateSceneJSON,
  parseAndValidateSceneJSON,
  formatJsonParseError,
  locateJsonError,
  formatValidationErrors,
  validateThemePack,
  listKnownSceneTypes,
  formatExpectedValues,
  formatInvalidValue,
  suggestClosest,
  scenesEqual,
  createPluginContext,
  getInstalledPlugins,
  Matrix2D,
  ObjectPool,
  detectBestRenderer,
  EventEmitter,
};

export {
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
  compactSceneJSON,
  registerJSONType,
  exportScene,
  exportApp,
  downloadExport,
  validateSceneJSON,
  parseAndValidateSceneJSON,
  formatJsonParseError,
  locateJsonError,
  formatValidationErrors,
  validateThemePack,
  listKnownSceneTypes,
  formatExpectedValues,
  formatInvalidValue,
  suggestClosest,
  scenesEqual,
  createPluginContext,
  getInstalledPlugins,
  Matrix2D,
  ObjectPool,
  detectBestRenderer,
  EventEmitter,
  use,
  createApp,
};

export type { ValidationResult, ValidationIssue, JsonErrorLocation };

export default LightDraw;

if (typeof window !== 'undefined') {
  (window as unknown as { LightDraw: typeof LightDraw }).LightDraw = LightDraw;
}
