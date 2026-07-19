# LightDraw JSON format

**Audience:** humans and AI agents authoring / editing scenes.  
**Related:** [AI + JSON](./ai-integration-guide.md) · [API overview](./api-overview.md) · module schemas below.

Detailed prop catalogs stay in the module schemas (linked below). This guide covers the shared tree shape, export round-trip, and how to keep JSON easy as features grow.

---

## One shape for everything

Every node is:

```json
{
  "type": "lineChart",
  "props": { "data": [1, 4, 2], "x": 10, "y": 10, "width": 280, "height": 160 }
}
```

| Field | Role |
|-------|------|
| `type` | Discriminator (widget, shape, or `group` / `layer`) |
| `props` | Config for that type (never the visual chrome of a widget) |
| `children` | Scene composition only (layout groups), not button/rect internals |
| `theme` | Optional **root** theme pack (see [theme architecture](./theme-architecture.md)) |
| `id` | Optional stable id |

**Load:** `app.loadJSON(scene)` — a plain root `{ type: "group", children: [...] }` is **hoisted** onto the stage (no extra nesting).  
**Export:** `app.exportJSON()` / `toJSON(node)` — module widgets stay opaque leaves (`button`, `gauge`, `flowchart`, …).

```javascript
const scene = app.exportJSON({ includeTheme: true });
app.clear();
app.loadJSON(scene); // same authoring shape
```

Optional smaller dumps: `app.exportJSON({ compact: true })` omits identity transforms, empty arrays, and runtime metadata noise.

---

## Module schemas (do not duplicate here)

| Module | Schema |
|--------|--------|
| UI | [ui-components-schema.md](./ui-components-schema.md) |
| Dashboard | [dashboard-widgets-schema.md](./dashboard-widgets-schema.md) |
| Automotive | [automotive-widgets-schema.md](./automotive-widgets-schema.md) |
| Diagram | [diagram-module-schema.md](./diagram-module-schema.md) · [diagram-flow.md](./diagram-flow.md) |
| Theme pack | [theme-architecture.md](./theme-architecture.md) · [ui-theme-guide.md](./ui-theme-guide.md) |

Diagrams use type-specific envelopes inside `props` (`data`, `root`, `components`, `stages`, …) — see the diagram schema. Prefer one flow form when authoring: `paths: string[][]` ([wire flow](./diagram-flow.md)).

---

## Ease principles (keep as features grow)

1. **One node = `{ type, props }`** — children only for groups, never for widget chrome.  
2. **Canonical types on write** — accept aliases on load; save one official `type` name.  
3. **Omit defaults when possible** — use `compact: true` for AI / hand-edited JSON.  
4. **One meaning per key** — scene `theme` = ThemePack; prefer `uiTheme` for brand tokens; automotive `theme` = HMI preset only.  
5. **Don’t persist chrome** — no editor selection, rebuild hooks, derived-only fields.  
6. **Validate early** — `validateSceneJSON` / `parseAndValidateSceneJSON` before `loadJSON`.  
7. **Export === authoring** — never round-trip through expanded primitive trees.

---

## Naming collisions

Some short names exist in more than one module (e.g. `speedometer`). In the full bundle, resolver order is UI → automotive → dashboard → diagram. Prefer the schema’s canonical name for the module you intend, and validate after load.

---

## Validation

```javascript
import { parseAndValidateSceneJSON, scenesEqual } from 'lightdraw';

const { scene, validation } = parseAndValidateSceneJSON(raw);
if (!validation.valid) throw new Error(validation.errors.join('; '));
app.loadJSON(scene);
```

Full AI workflow: [ai-integration-guide.md](./ai-integration-guide.md).
