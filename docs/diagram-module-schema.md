# Diagram Module JSON Schema (Phase 9)

Load diagrams via `app.loadJSON({ type: '<diagram>', props: { ... } })` or `LightDraw.Diagram.*` helpers.

## Common props

| Prop | Type | Description |
|------|------|-------------|
| uiTheme | string \| object | Optional Phase 6 override (UI preset or tokens). Wins over app `setUiTheme`. |

## Diagram types

| Type | Helper | Key props |
|------|--------|-----------|
| flowchart | `Diagram.flowchart(app, data)` | `data.nodes`, `data.edges` |
| stateMachine | `Diagram.stateMachine(app, data)` | `data.states`, `data.transitions` |
| classDiagram | `Diagram.classDiagram(app, data)` | `data.classes`, `data.relations` |
| mindMap | `Diagram.mindMap(app, center, branches)` | `center`, `branches[]` |
| networkTopology | `Diagram.network(app, data)` | `data.nodes`, `data.edges` |
| orgChart | `Diagram.orgChart(app, root)` | Tree of `{ name, role?, image?, department?, collapsed?, children? }` |
| electricalSchematic | `Diagram.schematic(app, components)` | `components[]` |
| canNetwork | `Diagram.canNetwork(app, data)` | `data.ecus`, `data.busLabel` |
| processPipeline | `Diagram.pipeline(app, stages)` | `stages[]` with `status` |

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

Node types: `start`, `end`, `decision`, `router`, `server`, `switch`, `client`.

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

Seeded layout produces reproducible positions for the same input.

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

## Org chart

```javascript
LightDraw.Diagram.orgChart(app, {
  name: 'Alex Rivera',
  role: 'CEO',
  department: 'Executive',
  image: 'https://example.com/alex.jpg', // optional photo URL or data URI
  children: [
    {
      name: 'Sam Chen',
      role: 'CTO',
      // image omitted → initials avatar is generated
      children: [{ name: 'Jordan Lee', role: 'Eng Lead' }],
    },
  ],
});
```

## Org chart collapse

```javascript
import { toggleOrgCollapse } from 'lightdraw/diagram';
toggleOrgCollapse(orgNode); // toggles child visibility
```

## JSON round-trip

```javascript
import { diagramToJSON, toJSON } from 'lightdraw';
const json = diagramToJSON(diagramNode);
// { type: 'processPipeline', props: { stages, x, y } }
```

## Performance targets

| Scenario | Target |
|----------|--------|
| Force layout 100 nodes | ≤ 500 ms |
| Diagram 200 nodes render | ≤ 32 ms |
| Connector route (smart) | ≤ 2 ms per edge |
