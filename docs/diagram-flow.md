# Diagram wire-flow animation

Animate diagram connectors to show **direction of travel**, with optional **motion highlight**, **path status tint** (idle / active / done), **play/pause**, and **ordered multi-path runs**.

Related: [Diagram module schema](./diagram-module-schema.md) · [Animation guide](./animation-guide.md) (low-level `dashOffset` / `motionPath`) · Live: [Diagram playground](https://rakeshrajena.github.io/lightDraw/#diagram)

---

## Quick start

```javascript
const chart = LightDraw.Diagram.flowchart(app, data, {
  width: 800,
  height: 480,
  flow: {
    enabled: true,
    mode: 'both',          // 'dash' | 'packet' | 'both'
    playback: 'loop',      // or 'once'
    highlight: 'pulse',    // motion chrome: 'pulse' | 'breathe' | 'flash' | 'none'
    // statusHighlight: true by default when paths are set
    // statusColors: { idle, active, done, error }  // optional overrides
    // chrome: true,           // built-in ▶⏸↻ + zoom (default on; set false to hide)
    paths: [
      ['start', 'check', 'process', 'end'],
      ['start', 'check', 'end'],
    ],
    pathGapMs: 500,
    speed: 1,
  },
});
app.add(chart);

// Or apply / control later:
LightDraw.Diagram.applyFlow(app, chart, { /* same options */ });
LightDraw.Diagram.pauseFlow(app, chart);
LightDraw.Diagram.resumeFlow(app, chart);
LightDraw.Diagram.toggleFlowPause(app, chart);
LightDraw.Diagram.replayFlow(app, chart);
LightDraw.Diagram.stopFlow(chart);
// Manual toolbar (optional — also auto when chrome is on):
// LightDraw.Diagram.installToolbar(app, chart);
// LightDraw.Diagram.uninstallToolbar(chart);
```

Options persist under `diagramState.flow` and round-trip via `Diagram.toJSON` / `fromJSON`. After the editor re-routes wires, flow restarts from saved options (unless paused / disabled).

---

## Modes

| `mode` | Behavior |
|--------|----------|
| `dash` | Marching dash pattern on path edges |
| `packet` | Dot travels along hops; flashes the target node on arrival |
| `both` | Dashes + packet (default) |

| `playback` | Behavior |
|------------|----------|
| `loop` | Continuous; after the last path run, restart at run `0` |
| `once` | Play all path runs in order, then auto-pause |

| `highlight` | Behavior (motion chrome) |
|-------------|--------------------------|
| `pulse` | Soft ring on the active hop endpoints |
| `breathe` | Opacity pulse on active nodes |
| `flash` | Brief flash on packet arrival only |
| `none` | No motion chrome |

---

## Path status tint

When a path / `paths` / `pathEdges` run is configured, nodes get a soft **status tint** by default (`statusHighlight: true`):

| Status | Default color | When |
|--------|---------------|------|
| `idle` | grey `#94a3b8` | On the current run, not yet visited |
| `active` | yellow `#eab308` | One node at a time — current step |
| `done` | green `#22c55e` | Visited; stays until the run finishes |
| `error` | red `#ef4444` | Missing hop (no matching edge) or `statusOverrides` |

Greens persist through the run (and the `pathGapMs` pause). Before the next run or loop restart, statuses **reset** (idle + first node active again). After `playback: 'once'` finishes, the final greens remain until stop / replay.

**Edges** follow the same palette when `statusEdges` is on (default with status highlight): idle muted, active amber, done green.

Status tint is **additive** with `highlight` (pulse / breathe / flash). Turn it off with `statusHighlight: false` for the previous motion-only look. Status advances with packet hops, so use `mode: 'packet'` or `'both'`.

```javascript
{
  paths: [['a', 'b', 'c']],
  statusHighlight: true, // default when paths are set
  statusEdges: true,     // default with statusHighlight
  statusColors: {
    idle: '#64748b',
    active: '#facc15',
    done: '#4ade80',
    error: '#f87171',
  },
  // Pin a node (JSON snapshot / forced error):
  statusOverrides: { c: 'error' },
  // Missing hop → red on source + pause (default):
  // statusPauseOnError: true,
}
```

Missing hops: the source node is marked `error` (takes precedence over `statusOverrides`). Skipped hops do not block other valid runs. With `statusPauseOnError` (default `true`), flow pauses only when **no** declared hops can be resolved.
---

## Paths (single + multiple runs)

**Single run** — node ids in order (consecutive pairs become hops):

```javascript
{ path: ['a', 'b', 'c'] }
```

**Multiple runs** — index order; run `i` fully, then run `i+1` after `pathGapMs`:

```javascript
{
  paths: [
    ['start', 'check', 'process', 'end'], // run 0
    ['start', 'check', 'end'],            // run 1
  ],
  pathGapMs: 500, // default 450
}
```

Shorthand: `path: [['a','b'],['a','c']]` is treated like `paths`.

**Explicit hops** (when you prefer `{ from, to }` over node lists):

```javascript
{ pathEdges: [{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }] }

// Multiple hop-lists:
{ pathsEdges: [
  [{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }],
  [{ from: 'a', to: 'd' }, { from: 'd', to: 'c' }],
] }
```

Edges must exist on the diagram (`edgeFrom` / `edgeTo` on connectors). Missing hops are **skipped**; their source node is marked `error`. If **no** hops in the declared path(s) resolve, flow pauses when `statusPauseOnError` is true (default). Valid runs still play when other hops are missing.

Without any path, packets animate on all edges (or `activeEdges` filter). Status tint stays off unless you set `statusHighlight: true` with a path. Declared paths never fall through to ambient all-edge packets.

---

## Playback controls

| API | Purpose |
|-----|---------|
| `Diagram.applyFlow(app, root, opts)` | Start / update options |
| `Diagram.pauseFlow(app, root)` | Soft pause in place (resume continues mid-step) |
| `Diagram.resumeFlow(app, root)` | Resume from paused step |
| `Diagram.toggleFlowPause(app, root)` | Toggle; returns whether playing |
| `Diagram.replayFlow(app, root)` | Restart from the beginning |
| `Diagram.stopFlow(root)` | Stop animations (optional `clearState`) |
| `Diagram.isFlowPlaying(root)` | Current playing state |
| `Diagram.refreshFlow(app, root)` | Re-apply from `diagramState.flow` |

`speed`: playback rate (`1` = default, `2` = 2×). `paused: true` or `speed: 0` pauses.

**Pause / resume:** `pauseFlow` freezes packets, dashes, and status **in place**; `resumeFlow` continues from that step (including mid-hop and between-run gaps). After `playback: 'once'` finishes, use `replayFlow` to start over. Changing mode/path via `applyFlow` still rebuilds from the start.

The **diagram demo** shows ▶ / ⏸ / ↻ on the canvas toolbar when Flow is on, plus sidebar Loop / Once / mode / speed / Status tint.

---

## Builder coverage

`flow` on builder options is applied for:

- Flowchart · State machine · Network · Pipeline · Class diagram · **CAN bus**

Org / mind-map / schematic re-route still call `refreshFlow` when `diagramState.flow` is set.

### CAN bus message flow

`Diagram.canNetwork` has no pairwise wires — ECUs share one bus. When you call `applyFlow` (or pass `flow` on the builder), LightDraw builds **virtual bus-rail hops** (ECU tap → rail → peer tap) so packets can travel:

```javascript
LightDraw.Diagram.canNetwork(app, {
  busLabel: 'CAN HS · 500 kbps',
  ecus: [
    { id: 'ecm', label: 'ECM', address: '0x7E0' },
    { id: 'tcu', label: 'TCU', address: '0x7E1' },
    { id: 'abs', label: 'ABS', address: '0x7E2' },
  ],
}, {
  width: 800,
  height: 400,
  flow: {
    enabled: true,
    mode: 'both',
    playback: 'loop',
    statusHighlight: true,
    paths: [
      ['ecm', 'tcu', 'abs'],
      ['abs', 'ecm'],
    ],
    pathGapMs: 550,
  },
});
```

Helpers (advanced): `ensureCanNetworkFlowEdges`, `canBusHopPoints` from `lightdraw/diagram`.

**Serial / USB-CAN adapters** are out of scope here — feed decoded frames as path updates later; the visual layer is ready.

---

## Tips

- Prefer **one packet + a defined `paths` list** for storytelling; ambient all-edge packets get noisy on large networks.
- Use `playback: 'once'` + `replayFlow` for step-through demos.
- Keep `statusHighlight` on (default with paths) so viewers can see progress at a glance; use `highlight: 'none'` if you only want status tint.
- Combine with the diagram editor: users can bend wires; flow re-binds to updated `edgePoints` after reroute. On **drag**, wires clear temporary bends and **smart-reconnect** to free ports on the same symbol.
- Low-level stroke motion without diagrams: see [Animation guide](./animation-guide.md) (`dashOffset`, `motionPath`).
