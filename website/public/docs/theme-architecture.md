# Theme architecture (library)

Internal contract for consistent, dynamic theming across UI, dashboard, automotive, and diagram.
Public entry points: **`app.applyTheme()`** / **`app.setUiTheme()`** / createApp `uiTheme` / scene JSON **`theme`**.

## Goals

1. **Consistent** — UI, dashboard, and diagram share one app-resolved token snapshot
2. **Dynamic** — config change updates live scene without full `clear()` when possible
3. **Non-breaking** — empty / unset theme keeps today’s default colors
4. **Overrides** — flat text/fontSize props beat node `uiTheme`; node beats app theme; app beats module defaults
5. **JSON-first** — one theme pack object can theme the whole app (scene root or `applyTheme`)
6. **Automotive dual system** — vehicle presets stay independent of brand UI tokens

## Theme pack (JSON)

```json
{
  "theme": {
    "preset": "dark",
    "primary": "#0ea5e9",
    "series": ["#0ea5e9", "#f43f5e", "#22c55e", "#f59e0b"],
    "dashboard": { "chartGrid": "#1e293b", "heatmapLow": "#0c4a6e" },
    "diagram": { "canvasBg": "#0b1220", "nodeStroke": "#38bdf8" }
  },
  "type": "group",
  "children": []
}
```

```javascript
app.applyTheme({
  preset: 'dark',
  primary: '#0ea5e9',
  series: ['#0ea5e9', '#f43f5e', '#22c55e', '#f59e0b'],
  dashboard: { chartGrid: '#1e293b' },
});

app.loadJSON(scene);                    // uses scene.theme if present
app.loadJSON(scene, { theme: pack });   // override / companion theme
app.exportJSON({ includeTheme: true }); // round-trip the pack
```

| Field | Effect |
|-------|--------|
| `preset` | Pack name, CSS color, **or image file path** (`./bg.png`, `/img/hero.jpg`, `assets/a.webp`) |
| brand tokens | Same keys as `UiThemeTokens` (`primary`, `surface`, …) |
| `series` | Chart series palette |
| `dashboard` | Dashboard token overrides after UI remap |
| `diagram` | Diagram top-level color overrides |
| `automotive` | Default HMI name for new widgets (`classic`\|`sport`\|`digital`) — does not retint existing |

There is **no separate light/dark mode switch** — pick a full preset (or set surface/text tokens yourself).

## Resolve order

```
component props (variant, fill, theme, series.color, …)
  → node uiTheme
  → theme pack (preset → token overrides → dashboard/diagram packs)
  → module defaults (UI / DASHBOARD / DIAGRAM)

Automotive only:
  props.theme (classic | sport | digital) → THEMES[name] → classic fallback
```

## Phases

| Phase | Status | Scope |
|-------|--------|--------|
| 0 | Done | Contract + baseline color locks |
| 1 | Done | App snapshot, getters, `themechange` event |
| 2 | Done | Canvas UI build + live refresh from resolved theme |
| 3 | Done | Dashboard `resolveDashboardTheme` + live rebuild on theme change |
| 4 | Done | Diagram `resolveDiagramTheme` + live rebuild on theme change |
| 5 | Done | Automotive presets stay primary; dual system documented |
| 6 | Done | Optional per-node `uiTheme` overrides (component → app → defaults) |
| 7 | Done | Docs hub, `demo-theme.html`, `npm run test:theme`, Playwright smoke |
| 8 | Done | App-scoped themes (WeakMap + build stack), `clearUiTheme` / `{ replace: true }`, CSS var clear |
| 9 | Done | Full canvas UI live refresh (paint + `uiRebuild` for compound widgets) |
| 10 | Done | Chart series no longer bake theme colors; heatmap/pie/legend retint live |
| 11 | Done | ThemePack JSON (`applyTheme`, scene `theme`, complete presets, dashboard/diagram packs, series[]) — no `mode` flag |

## App API (Phase 1+)

```javascript
const app = LightDraw.createApp('#app', {
  renderer: 'html',
  uiTheme: { preset: 'dark' },
});

app.getUiTheme();        // stored input config (may include preset)
app.getResolvedTheme();  // flat tokens after resolveUiTheme()

app.on('themechange', (e) => {
  // e.payload = { config, resolved }
});

// Default: shallow-merge into existing config (omitted keys stick)
app.setUiTheme({ preset: 'violet' });

// Replace entire config (drops sticky token overrides)
app.setUiTheme({ preset: 'ocean' }, { replace: true });
app.clearUiTheme(); // same as setUiTheme({}, { replace: true })
```

**Merge semantics:** `setUiTheme` merges by default so incremental overrides (`{ primary: '…' }`) work. Use `{ replace: true }` or `clearUiTheme()` when switching presets cleanly (avoids leftover tokens).

## Per-node overrides (Phase 6)

Optional on UI, dashboard, and diagram nodes:

```javascript
// Prefer uiTheme
{ type: 'gauge', props: { value: 72, uiTheme: 'violet' } }
{ type: 'flowchart', props: { uiTheme: { primary: '#e11d48' }, data: { ... } } }
{ type: 'button', props: { label: 'Save', uiTheme: 'rose' } }

// Flat typography (highest priority for text / size)
{ type: 'gauge', props: { value: 40, textColor: '#fbbf24', fontSize: 18 } }
{ type: 'label', props: { text: 'Hi', color: '#94a3b8', fontSize: 14 } }

// theme as UI preset name also works on dashboard/diagram (not classic/sport/digital)
{ type: 'lineChart', props: { theme: 'ocean', data: [1, 2, 3] } }
```

Resolve order: **flat `textColor`/`fontSize`/`primary` → node `uiTheme` → app `setUiTheme` → module defaults**.

`ThemePack.diagram` / `dashboard` / `series` / `automotive` persist across rebuilds (`diagramPackFromApp`, `dashboardPackFromApp`, `syncAutomotiveDefaultPreset`).

## Dual theme system (Phase 5)

| System | API | Affects |
|--------|-----|---------|
| **App brand theme** | `uiTheme` / `setUiTheme` | UI (HTML+canvas), dashboard, diagram |
| **Automotive HMI presets** | `props.theme`: `classic` \| `sport` \| `digital` | Gauges, clusters, panels |

`setUiTheme` does **not** retint automotive widgets. That keeps instrument clusters looking like vehicle HMIs even when the surrounding admin UI switches to `violet` / `emerald`.

Change automotive look explicitly:

```javascript
import { updateAutoWidgetProps, getTheme } from 'lightdraw/automotive';

updateAutoWidgetProps(cluster, { theme: 'sport' });
// or at create time:
app.loadJSON({ type: 'instrumentCluster', props: { theme: 'digital', speed: 95 } });
```

## Module ownership

| Module | Status |
|--------|--------|
| UI HTML | CSS vars via `setUiTheme` (unset vars cleared) |
| UI Canvas | App-scoped sync + build stack; paint refresh + `uiRebuild` for compound widgets |
| Dashboard | App-scoped sync + build stack; `chartRebuild` on theme change |
| Diagram | App-scoped sync + build stack; `diagramRebuild` on theme change |
| Automotive | Named color presets; `fontSize` scales typography only; `updateAutoWidgetProps({ theme })` |

Active palettes are stored per `App` (`WeakMap`) and pushed on a build stack during create/rebuild so concurrent apps / per-node `uiTheme` do not race through a process singleton.

## Compatibility rules

- Defaults with `{}` theme **must** match locked baseline tests
- Additive methods/props only — no renames of `setUiTheme`
- Prefer mutate/refresh over destroying nodes (listeners/state stay)
- Automotive named presets are independent (no soft remap from app tokens in Phase 5)

## Dynamic update flow (Phase 0–5)

```
setUiTheme(config, { replace? })
  → merge or replace app config
  → resolve tokens → store snapshot
  → syncActive*(tokens, app)   // WeakMap per App
  → HTMLRenderer.setUiTheme (CSS variables; clears unset)
  → refreshCanvasUi / refreshDashboard / refreshDiagram
  → refreshAutomotive (only when fontSize scale changes)
      (each node runs under runWith*(effectiveTheme))
  → emit themechange
  → requestRender()
  // automotive autoRebuild is NOT called
```

## Demo & CI (Phase 7)

- Live toggle: [`examples/demo-theme.html`](../examples/demo-theme.html)
- Unit suite: `npm run test:theme` (`test/theme/` + UI token tests)
- Visual smoke: Playwright loads the demo and clicks app / automotive presets

## Related

- [UI Theme Guide](./ui-theme-guide.md) — presets and tokens (public)
- [UI components schema](./ui-components-schema.md)
- [Dashboard widgets schema](./dashboard-widgets-schema.md)
- [Automotive widgets schema](./automotive-widgets-schema.md)
- [Diagram module schema](./diagram-module-schema.md)
