# Diagram Module JSON Schema

Load diagrams via `app.loadJSON({ type: '<diagram>', props: { ... } })` or `LightDraw.Diagram.*` helpers.

Interactive gallery: [`examples/demo-diagram.html`](../examples/demo-diagram.html) (drag, resize, **rotate**, wire bends, org collapse, live JSON dock).

## Common props

| Prop | Type | Description |
|------|------|-------------|
| uiTheme | string \| object | Optional UI preset or tokens. Wins over app `setUiTheme`. |
| width / height | number | Canvas hints used by layout and `fitToBounds`. |

## Node transforms (all editable symbols)

| Field | Type | Description |
|-------|------|-------------|
| `x` / `y` | number | Top-left position in diagram space |
| `rotation` | number | Degrees (clockwise). Applied on load; updated by the editor rotate handle |
| scale | via editor | Live `scaleX` / `scaleY` after resize (also in `diagramState.editorPositions`) |

**Wires on rotate:** connected edges drop temporary bend points and **smart-route** again to facing ports on the rotated card. You can double-click a wire afterward to add bends / reshape.

Example:

```json
{
  "type": "flowchart",
  "props": {
    "data": {
      "nodes": [
        { "id": "a", "label": "Start", "type": "start", "x": 40, "y": 40, "rotation": 15 },
        { "id": "b", "label": "Work", "x": 220, "y": 40 }
      ],
      "edges": [{ "from": "a", "to": "b" }]
    }
  }
}
```

Schematic components already supported `rotation`; flowchart, network, pipeline, state machine, and class diagrams now do as well.

## Diagram types

| Type | Helper | Key props |
|------|--------|-----------|
| flowchart | `Diagram.flowchart(app, data)` | `data.nodes`, `data.edges` |
| stateMachine | `Diagram.stateMachine(app, data)` | `data.states`, `data.transitions` |
| classDiagram | `Diagram.classDiagram(app, data)` | `data.classes`, `data.relations` |
| mindMap | `Diagram.mindMap(app, center, branches)` | `center`, `branches[]` |
| networkTopology | `Diagram.network(app, data)` | `data.nodes`, `data.edges` (rich `type` icons) |
| orgChart | `Diagram.orgChart(app, root)` | Tree of `{ name, role?, image?, department?, collapsed?, children? }` |
| electricalSchematic | `Diagram.schematic(app, components)` | `components[]` (optional `rotation`) |
| schematicSymbolCatalog | `Diagram.schematicCatalog(app, opts)` | `category?`, `columns?` |
| canNetwork | `Diagram.canNetwork(app, data)` | `data.ecus`, `data.busLabel` |
| processPipeline | `Diagram.pipeline(app, stages)` | `stages[]` with `status`, optional `type`, `rotation` |
| pipelineSymbolCatalog | `Diagram.pipelineCatalog(app, opts)` | `category?`, `columns?` |

## Interactive editor

```javascript
const org = LightDraw.Diagram.orgChart(app, root, { width: 900, height: 520 });
app.add(org);
LightDraw.Diagram.fitToBounds(org, 900, 520, 24);

const editor = LightDraw.Diagram.installEditor(app, org, {
  mode: 'arrange', // or 'edit'
  allowResize: true,
  allowRotate: true, // rotate handle above selection (15° snap; Shift = free)
  allowBendPoints: true,
  gridSize: 8,
  onChange(state) {
    // diagramState after drag / resize / rotate / rewire
  },
});

// later
LightDraw.Diagram.uninstallEditor(org);
```

**Rotate:** select a symbol → drag the circular handle above the selection. Snaps to **15°** by default; hold **Shift** for free angles. Spins around the symbol center.

| Capability | How |
|------------|-----|
| Drag nodes | Arrange/edit mode |
| Resize | 8 handles on the selection bounds (edges + corners) |
| Rotate | Handle above selection; `allowRotate` (default `true`) |
| Selection chrome | Dashed AABB + rotated card outline + ports on real mid-sides |
| Wires on rotate | Linked edges drop temporary bends and **smart-route** to facing ports |
| Wire bends | Double-click a wire → drag bend handles (after auto-route, anytime) |
| Org collapse | Click `−N` / `+N` on a card (N = total descendants) |
| Selection after collapse | Chrome cleared when a branch is minimized |

JSON `rotation` is persisted on flowchart / network / pipeline / state / class / schematic nodes via `diagramState` (and `editorPositions`).

## Wire flow animation

Animate connectors to show direction of travel, with optional motion highlight and path status tint:

```javascript
LightDraw.Diagram.applyFlow(app, chart, {
  enabled: true,
  speed: 1,              // 1 = default, higher = faster
  paused: false,
  playback: 'loop',      // or 'once'
  mode: 'both',          // 'dash' | 'packet' | 'both'
  highlight: 'pulse',    // motion chrome: 'pulse' | 'breathe' | 'flash' | 'none'
  // statusHighlight: true by default when paths are set
  // statusColors: { idle, active, done, error },
  // Ordered node path (single run):
  // path: ['start', 'check', 'process', 'end'],
  // Multiple runs in index order (run 0, then run 1, …):
  paths: [
    ['start', 'check', 'process', 'end'],
    ['start', 'check', 'end'],
  ],
  pathGapMs: 500, // pause between runs
  // Or explicit hops / multi hop-lists:
  // pathEdges: [{ from: 'start', to: 'check' }],
  // pathsEdges: [[{ from: 'a', to: 'b' }], [{ from: 'a', to: 'c' }]],
});

LightDraw.Diagram.pauseFlow(app, chart);
LightDraw.Diagram.resumeFlow(app, chart);
LightDraw.Diagram.toggleFlowPause(app, chart);
LightDraw.Diagram.replayFlow(app, chart); // restart (esp. after once)
LightDraw.Diagram.stopFlow(chart);
```

| Option | Effect |
|--------|--------|
| `playback: 'loop'` | Continuous (default); after last path run, restart at run 0 |
| `playback: 'once'` | Play all path runs in order, then auto-pauses |
| `path` | Single node-id sequence (or `string[][]` shorthand for `paths`) |
| `paths` | Multiple runs — index order, one after another |
| `pathGapMs` | Delay between runs (default 450) |
| `pathEdges` / `pathsEdges` | Same idea with `{ from, to }` hops |
| `mode: 'dash'` | Marching dashes on path edges |
| `mode: 'packet'` | Dot travels hops; flashes target on arrival |
| `highlight: 'pulse'` | Soft ring on active hop endpoints (motion chrome) |
| `statusHighlight` | Soft idle/active/done tint on path nodes (default on with paths) |
| `statusEdges` | Tint path wires with the same palette (default on with status) |
| `statusColors` | Optional `{ idle, active, done, error }` color overrides |
| `statusOverrides` | Force `{ [nodeId]: status }` after lifecycle paint |
| `statusPauseOnError` | Pause when a declared path resolves to zero playable hops (default true) |
| `paused` / canvas ▶⏸ | Soft pause in place; resume continues mid-step |

Persist under builder options / JSON: `{ flow: { enabled, playback, paths, … } }`.
Editor re-route keeps `diagramState.flow` and restarts when not paused.

**Full guide:** [diagram-flow.md](./diagram-flow.md)

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

Use `Diagram.schematic(app, components)` for wired circuits, or `Diagram.schematicCatalog(app, { category?, columns? })` for a full grid.

Discover kinds with `Diagram.listSchematicSymbols()` / `Diagram.resolveSchematicSymbol(name)`.

Legacy types (`resistor`, `capacitor`, `ground`, `battery`, `switch`, `led`, `wire`) still work. Prefer catalog ids such as `spst`, `nmos`, `opAmp`.

| Category | Examples (type values) |
|----------|------------------------|
| Power | `battery`, `cell`, `dcSupply`, `acSupply`, `ground`, `earthGround`, `chassisGround`, `powerFlag`, `voltageSource`, `currentSource`, `fuse`, `circuitBreaker` |
| Passive | `resistor`, `potentiometer`, `thermistorNtc`, `capacitor`, `electrolyticCap`, `inductor`, `transformer`, `crystal`, … |
| Diodes | `diode`, `schottky`, `zener`, `tvs`, `led`, `photodiode`, `bridgeRectifier`, … |
| Transistors | `npn`, `pnp`, `nmos`, `pmos`, `njfet`, `pjfet`, `igbt`, `darlington`, … |
| Thyristors | `scr`, `triac`, `diac`, `gto`, `thyristor` |
| Logic | `notGate`, `andGate`, `nandGate`, `orGate`, `xorGate`, `schmittTrigger`, … |
| Analog ICs | `opAmp`, `ldo`, `buck`, `boost`, `dac`, `adc`, `pll`, … |
| Digital ICs | `mcu`, `fpga`, `eeprom`, `flash`, `mux`, `flipFlop`, … |
| Sensors | `tempSensor`, `hallSensor`, `accelerometer`, `pirSensor`, `microphone`, … |
| Actuators | `relay`, `dcMotor`, `stepperMotor`, `servoMotor`, `buzzer`, `lcd`, … |
| Switches | `spst`, `spdt`, `dpdt`, `pushButtonNo`, `eStop`, … |
| Connectors | `header`, `usbConnector`, `rj45`, `barrelJack`, `sma`, … |
| Comms | `uart`, `spi`, `i2c`, `canBus`, `wifi`, `lora`, `gps`, … |
| Protection / test / misc | `esdProtection`, `polyfuse`, `testPoint`, `voltmeter`, `junction`, `noConnect`, … |

JSON:

```json
{
  "type": "electricalSchematic",
  "props": {
    "components": [
      { "id": "u1", "type": "opAmp", "x": 40, "y": 40, "label": "U1" },
      { "id": "r1", "type": "resistor", "x": 140, "y": 40, "label": "R1" }
    ]
  }
}
```

Catalog JSON type: `schematicSymbolCatalog` with optional `category` and `columns`.

## Pipeline / process symbols

Use `Diagram.pipeline(app, stages)` for status pipelines. Each stage may set `type` to a catalog kind (glyph replaces the WAIT/RUN badge):

```javascript
LightDraw.Diagram.pipeline(app, [
  { id: 'a', label: 'Build', status: 'done', type: 'build' },
  { id: 'b', label: 'Deploy', status: 'active', type: 'deploy' },
  { id: 'c', label: 'Monitor', status: 'pending', type: 'monitoring' },
]);
```

Browse all ~300 kinds with `Diagram.pipelineCatalog(app, { category?, columns? })`.

Discover with `Diagram.listPipelineSymbols()` / `Diagram.resolvePipelineSymbol(name)`.

| Category | Examples |
|----------|----------|
| Flow | `start`, `end`, `process`, `task`, `workflow`, `pipeline` |
| Gateway | `decision`, `exclusiveGateway`, `parallelGateway`, `fork`, `join` |
| Event | `timer`, `message`, `error`, `trigger` |
| Data | `database`, `document`, `dataset`, `dashboard` |
| CI/CD | `build`, `deploy`, `release`, `rollback`, `production` |
| Manufacturing | `machine`, `robot`, `conveyor`, `cncMachine`, `factory` |
| Facilities | `building`, `home`, `school`, `stadium`, `shop`, `temple`, `parking` |
| Transport | `car`, `bus`, `flight`, `ship`, `bike`, `cycle`, `road` |
| Nature | `earth`, `sun`, `star`, `forest`, `solarPanel`, `map` |
| Devices | `laptop`, `gps`, `wifi`, `phoneTower`, `bluetooth`, `light` |
| Logistics | `warehouse`, `truck`, `agv`, `forklift` |
| Industrial | `plc`, `hmi`, `scada`, `sensor`, `iotDevice` |
| Cloud | `cloud`, `server`, `kubernetesCluster`, `appContainer` |
| Governance | `validation`, `verification`, `inspection`, `signOff`, `certification`, `version` |

Catalog JSON type: `pipelineSymbolCatalog` with optional `category` and `columns`.

## Performance targets

| Scenario | Target |
|----------|--------|
| Force layout 100 nodes | ≤ 500 ms |
| Diagram 200 nodes render | ≤ 32 ms |
| Connector route (smart) | ≤ 2 ms per edge |
