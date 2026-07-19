# Diagram Module JSON Schema

Load diagrams via `app.loadJSON({ type: '<diagram>', props: { ... } })` or `LightDraw.Diagram.*` helpers.

Interactive gallery: [`examples/demo-diagram.html`](../examples/demo-diagram.html) (drag, resize, wire bends, org collapse, live JSON dock).

## Common props

| Prop | Type | Description |
|------|------|-------------|
| uiTheme | string \| object | Optional UI preset or tokens. Wins over app `setUiTheme`. |
| width / height | number | Canvas hints used by layout and `fitToBounds`. |

## Diagram types

| Type | Helper | Key props |
|------|--------|-----------|
| flowchart | `Diagram.flowchart(app, data)` | `data.nodes`, `data.edges` |
| stateMachine | `Diagram.stateMachine(app, data)` | `data.states`, `data.transitions` |
| classDiagram | `Diagram.classDiagram(app, data)` | `data.classes`, `data.relations` |
| mindMap | `Diagram.mindMap(app, center, branches)` | `center`, `branches[]` |
| networkTopology | `Diagram.network(app, data)` | `data.nodes`, `data.edges` (rich `type` icons) |
| orgChart | `Diagram.orgChart(app, root)` | Tree of `{ name, role?, image?, department?, collapsed?, children? }` |
| electricalSchematic | `Diagram.schematic(app, components)` | `components[]` |
| canNetwork | `Diagram.canNetwork(app, data)` | `data.ecus`, `data.busLabel` |
| processPipeline | `Diagram.pipeline(app, stages)` | `stages[]` with `status` |

## Interactive editor

```javascript
const org = LightDraw.Diagram.orgChart(app, root, { width: 900, height: 520 });
app.add(org);
LightDraw.Diagram.fitToBounds(org, 900, 520, 24);

const editor = LightDraw.Diagram.installEditor(app, org, {
  mode: 'arrange', // or 'edit'
  allowResize: true,
  allowBendPoints: true,
  gridSize: 8,
  onChange(state) {
    // diagramState after drag / resize / rewire
  },
});

// later
LightDraw.Diagram.uninstallEditor(org);
```

| Capability | How |
|------------|-----|
| Drag nodes | Arrange/edit mode |
| Resize | 8 handles (edges + corners); outward/inward |
| Wire bends | Double-click a wire → drag bend handles |
| Org collapse | Click `−N` / `+N` on a card (N = total descendants) |
| Selection chrome | Cleared automatically when a branch is minimized |

## Network icons

Node `type` resolves through a large Visio/Cisco-style catalog (aliases supported):

```javascript
LightDraw.Diagram.listNetworkIcons(); // canonical kinds
LightDraw.Diagram.resolveNetworkIcon('sql_database'); // → meta + glyph id

LightDraw.Diagram.network(app, {
  nodes: [
    { id: 'fw', label: 'NGFW', type: 'ngfw', x: 200, y: 80 },
    { id: 'db', label: 'SQL', type: 'sql_database', x: 200, y: 200 },
  ],
  edges: [{ from: 'fw', to: 'db' }],
});
```

## Flowchart / network nodes

```json
{
  "type": "flowchart",
  "props": {
    "data": {
      "nodes": [
        { "id": "a", "label": "Start", "type": "start" },
        { "id": "b", "label": "Check", "type": "decision" }
      ],
      "edges": [{ "from": "a", "to": "b", "label": "next" }]
    }
  }
}
```

Flowchart node types: `start`, `end`, `decision`, …  
Network node types: see `listNetworkIcons()` (router, firewall, server, cloud, IoT, …).

## State machine

```json
{
  "type": "stateMachine",
  "props": {
    "data": {
      "states": [
        { "id": "idle", "label": "Idle", "type": "initial" },
        { "id": "done", "label": "Done", "type": "final" }
      ],
      "transitions": [{ "from": "idle", "to": "done", "label": "finish" }]
    }
  }
}
```

## Org chart

```javascript
LightDraw.Diagram.orgChart(app, {
  name: 'Alex Rivera',
  role: 'CEO',
  department: 'Executive',
  image: 'https://example.com/alex.jpg', // optional; else initials avatar
  children: [
    {
      name: 'Sam Chen',
      role: 'CTO',
      children: [{ name: 'Jordan Lee', role: 'Eng Lead' }],
    },
  ],
});
```

### Branch colors (automatic)

- Top-level children get **unique** grouping colors (seeded shuffle — stable rebuilds, no repeats for N teams).
- Sub-branches **inherit** the parent branch accent.
- Colors are **not** stored in JSON; they come from the diagram theme / generator at render time.

### Collapse / expand

```javascript
LightDraw.Diagram.toggleCollapse(orgNode);
// or Diagram.wireOrgCollapse(app, orgRoot) after build
```

The control shows total descendants (`−7` expanded / `+7` collapsed). Minimizing a branch hides the subtree, relayouts siblings, and rewires connectors.

## JSON round-trip

```javascript
const json = LightDraw.Diagram.toJSON(diagramRoot);
// { type: 'orgChart' | 'flowchart' | …, props: { … } }

const rebuilt = LightDraw.Diagram.fromJSON(json.type, json.props, app);
app.add(rebuilt);
```

Also works via the global scene API when the diagram plugin is installed:

```javascript
app.loadJSON({ type: 'flowchart', props: { data: { nodes, edges } } });
```

## Force-directed layout

```javascript
import { forceDirectedLayout, applyForceLayout } from 'lightdraw/diagram';

const positions = forceDirectedLayout(nodes, edges, {
  seed: 42,
  iterations: 100,
  width: 600,
  height: 400,
});

applyForceLayout(diagramGroup, edges, { seed: 42 });
```

## Smart connector routing

```javascript
import { routeConnector, collectObstacles } from 'lightdraw/diagram';

const obstacles = collectObstacles(nodeGroups);
const edge = routeConnector(app, x1, y1, x2, y2, 'smart', obstacles);
```

Styles: `straight`, `orthogonal`, `smart` (avoids node bounding boxes).

## Electrical symbols

| Symbol | type value |
|--------|------------|
| Resistor | `resistor` |
| Capacitor | `capacitor` |
| Ground | `ground` |
| Battery | `battery` |
| Switch | `switch` |
| LED | `led` |
| Wire | `wire` |

## Performance targets

| Scenario | Target |
|----------|--------|
| Force layout 100 nodes | ≤ 500 ms |
| Diagram 200 nodes render | ≤ 32 ms |
| Connector route (smart) | ≤ 2 ms per edge |
