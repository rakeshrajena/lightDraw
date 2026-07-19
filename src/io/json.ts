/**
 * Scene JSON serialize / deserialize.
 * Module widgets stay as `{ type, props }` leaves — never expand into visual primitives.
 */
import type { App } from '../App';
import type { Node } from '../Node';
import type { SceneJSON } from '../types';
import { Group } from '../shapes/Group';
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
import { resolveJSONType } from '../registry/jsonResolvers';
import { componentToJSON } from '../components/helpers';
import { dashboardToJSON } from '../dashboard/helpers';
import { automotiveToJSON } from '../automotive/helpers';
import { diagramToJSON } from '../diagram/helpers';

type NodeFactory = (props: Record<string, unknown>, app: App) => Node;

const shapeFactories: Record<string, NodeFactory> = {
  rect: (p, app) => app.rect(p as ConstructorParameters<typeof Rect>[0]),
  circle: (p, app) => app.circle(p as ConstructorParameters<typeof Circle>[0]),
  ellipse: (p, app) => app.ellipse(p as ConstructorParameters<typeof Ellipse>[0]),
  line: (p, app) => app.line(p as ConstructorParameters<typeof Line>[0]),
  arc: (p, app) => app.arc(p as ConstructorParameters<typeof Arc>[0]),
  polygon: (p, app) => app.polygon(p as ConstructorParameters<typeof Polygon>[0]),
  polyline: (p, app) => app.polyline(p as ConstructorParameters<typeof Polyline>[0]),
  path: (p, app) => app.path(p as ConstructorParameters<typeof Path>[0]),
  star: (p, app) => app.star(p as ConstructorParameters<typeof Star>[0]),
  roundedRect: (p, app) => app.roundedRect(p as ConstructorParameters<typeof RoundedRect>[0]),
  text: (p, app) => app.text(p as ConstructorParameters<typeof TextNode>[0]),
  image: (p, app) => app.image(p as ConstructorParameters<typeof ImageNode>[0]),
  sprite: (p, app) => app.sprite(p as ConstructorParameters<typeof Sprite>[0]),
  group: (p, app) => app.group(p as ConstructorParameters<typeof Group>[0]),
  layer: (p, app) => app.layer(p as ConstructorParameters<typeof Group>[0]),
};

const customFactories: Record<string, NodeFactory> = {};

/** Options for module-aware scene serialization. */
export interface ToJSONOptions {
  /**
   * Drop identity transforms, empty arrays, null/undefined, and non-JSON metadata.
   * Opt-in so existing full dumps keep working.
   */
  compact?: boolean;
}

export function registerJSONType(type: string, factory: NodeFactory): void {
  customFactories[type] = factory;
}

export function fromJSON(json: SceneJSON, app: App): Node {
  const props = json.props ?? {};
  if (json.id) props.id = json.id;

  let node: Node;

  const customFactory = customFactories[json.type];
  if (customFactory) {
    node = customFactory(props, app);
  } else if (shapeFactories[json.type]) {
    node = shapeFactories[json.type](props, app);
  } else {
    const resolved = resolveJSONType(json.type, props, app);
    if (resolved) {
      node = resolved;
    } else if (json.type === 'dashboard' || json.children) {
      node = app.group(props as ConstructorParameters<typeof Group>[0]);
    } else {
      node = app.group(props as ConstructorParameters<typeof Group>[0]);
    }
  }

  if (json.children && 'add' in node) {
    for (const child of json.children) {
      (node as Group).add(fromJSON(child, app));
    }
  }

  return node;
}

function isGroupLike(node: Node): node is Group {
  return Array.isArray((node as Group).children);
}

/** Plain group/layer props for authoring export (no runtime metadata dump). */
function serializeGroupShell(node: Node): SceneJSON {
  const props: Record<string, unknown> = {
    x: node.x,
    y: node.y,
    rotation: node.rotation,
    scaleX: node.scaleX,
    scaleY: node.scaleY,
    opacity: node.opacity,
    visible: node.visible,
  };
  if (node.name) props.name = node.name;
  if (node.fill != null) props.fill = node.fill;
  if (node.stroke != null) props.stroke = node.stroke;
  if (typeof node.strokeWidth === 'number' && node.strokeWidth !== 0) {
    props.strokeWidth = node.strokeWidth;
  }
  if (node.listening === false) props.listening = false;
  if ((node as Group).cacheAsBitmap) props.cacheAsBitmap = true;

  const json: SceneJSON = { type: node.type, props };
  if (node.id) json.id = node.id;
  return json;
}

const COMPACT_DEFAULTS: Record<string, unknown> = {
  x: 0,
  y: 0,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  opacity: 1,
  visible: true,
  listening: true,
  cacheAsBitmap: false,
  disabled: false,
  paused: false,
  enabled: true,
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function compactValue(key: string, value: unknown): unknown {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'function') return undefined;
  if (key === 'metadata') return undefined;
  if (Object.prototype.hasOwnProperty.call(COMPACT_DEFAULTS, key) && COMPACT_DEFAULTS[key] === value) {
    return undefined;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return undefined;
    return value;
  }
  if (isPlainObject(value)) {
    const nested = compactProps(value);
    return nested && Object.keys(nested).length > 0 ? nested : undefined;
  }
  return value;
}

function compactProps(props: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    const next = compactValue(k, v);
    if (next !== undefined) out[k] = next;
  }
  return out;
}

/** Strip defaults / non-JSON noise from a SceneJSON tree (does not mutate input). */
export function compactSceneJSON(json: SceneJSON): SceneJSON {
  const out: SceneJSON = { type: json.type };
  if (json.id) out.id = json.id;
  if (json.theme) out.theme = json.theme;
  if (json.props && typeof json.props === 'object') {
    const props = compactProps(json.props as Record<string, unknown>);
    if (Object.keys(props).length > 0) out.props = props;
  }
  if (json.children?.length) {
    out.children = json.children.map(compactSceneJSON);
  }
  return out;
}

/**
 * Serialize a node for authoring / `loadJSON` round-trip.
 * UI, dashboard, automotive, and diagram roots stay opaque `{ type, props }` leaves.
 * Plain groups recurse with the same rules (fixes stage `exportJSON` expansion).
 */
export function toJSON(node: Node, options?: ToJSONOptions): SceneJSON {
  let json: SceneJSON;

  if (node.metadata?.componentType) {
    json = componentToJSON(node);
  } else if (node.metadata?.widgetType) {
    json = dashboardToJSON(node);
  } else if (node.metadata?.autoType) {
    json = automotiveToJSON(node);
  } else if (node.metadata?.diagramType) {
    json = diagramToJSON(node);
  } else if (isGroupLike(node)) {
    json = serializeGroupShell(node);
    json.children = node.children.map((child) => toJSON(child, options));
  } else {
    json = node.toJSON();
  }

  return options?.compact ? compactSceneJSON(json) : json;
}

/**
 * True when a root `group` is only a bag of children (identity transform, no module type).
 * Used by `loadJSON` to place children on the stage instead of nesting an extra group.
 */
export function isHoistableRootGroup(node: Node): node is Group {
  if (!isGroupLike(node) || node.type !== 'group') return false;
  if (
    node.metadata?.componentType ||
    node.metadata?.widgetType ||
    node.metadata?.autoType ||
    node.metadata?.diagramType
  ) {
    return false;
  }
  const rot = node.rotation || 0;
  const sx = node.scaleX ?? 1;
  const sy = node.scaleY ?? 1;
  const op = node.opacity ?? 1;
  return (
    (node.x || 0) === 0 &&
    (node.y || 0) === 0 &&
    rot === 0 &&
    sx === 1 &&
    sy === 1 &&
    op === 1 &&
    node.visible !== false
  );
}

/** Authoring-shaped export of stage contents (not the stage node itself). */
export function exportStageJSON(stage: Group, options?: ToJSONOptions): SceneJSON {
  const children = stage.children.map((child) => toJSON(child, options));
  const scene: SceneJSON = { type: 'group', children };
  return options?.compact ? compactSceneJSON(scene) : scene;
}
