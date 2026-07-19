# Diagram wire-flow animation

Animate diagram connectors to show **direction of travel**, with optional **node highlight**, **play/pause**, and **ordered multi-path runs**.

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
    highlight: 'pulse',    // 'pulse' | 'breathe' | 'flash' | 'none'
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

| `highlight` | Behavior |
|-------------|----------|
| `pulse` | Soft ring on the active hop endpoints |
| `breathe` | Opacity pulse on active nodes |
| `flash` | Brief flash on packet arrival only |
| `none` | No node chrome |

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

Edges must exist on the diagram (`edgeFrom` / `edgeTo` on connectors). Missing hops are skipped.

Without any path, packets animate on all edges (or `activeEdges` filter).

---

## Playback controls

| API | Purpose |
|-----|---------|
| `Diagram.applyFlow(app, root, opts)` | Start / update options |
| `Diagram.pauseFlow(app, root)` | Soft pause (keeps options) |
| `Diagram.resumeFlow(app, root)` | Resume |
| `Diagram.toggleFlowPause(app, root)` | Toggle; returns whether playing |
| `Diagram.replayFlow(app, root)` | Restart from the beginning |
| `Diagram.stopFlow(root)` | Stop animations (optional `clearState`) |
| `Diagram.isFlowPlaying(root)` | Current playing state |
| `Diagram.refreshFlow(app, root)` | Re-apply from `diagramState.flow` |

`speed`: playback rate (`1` = default, `2` = 2×). `paused: true` or `speed: 0` pauses while keeping a static dash preview when enabled.

The **diagram demo** shows ▶ / ⏸ / ↻ on the canvas toolbar when Flow is on, plus sidebar Loop / Once / mode / speed.

---

## Builder coverage

`flow` on builder options is applied for:

- Flowchart · State machine · Network · Pipeline · Class diagram

Org / mind-map / schematic re-route still call `refreshFlow` when `diagramState.flow` is set.

---

## Tips

- Prefer **one packet + a defined `paths` list** for storytelling; ambient all-edge packets get noisy on large networks.
- Use `playback: 'once'` + `replayFlow` for step-through demos.
- Combine with the diagram editor: users can bend wires; flow re-binds to updated `edgePoints` after reroute.
- Low-level stroke motion without diagrams: see [Animation guide](./animation-guide.md) (`dashOffset`, `motionPath`).
