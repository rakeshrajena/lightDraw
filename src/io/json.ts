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

export function toJSON(node: Node): SceneJSON {
  if (node.metadata?.componentType) {
    return componentToJSON(node);
  }
  if (node.metadata?.widgetType) {
    return dashboardToJSON(node);
  }
  if (node.metadata?.autoType) {
    return automotiveToJSON(node);
  }
  if (node.metadata?.diagramType) {
    return diagramToJSON(node);
  }
  return node.toJSON();
}
