# AI Integration Guide

LightDraw scenes are **JSON-first** — ideal for LLM-generated UIs, dashboards, and HMIs.

## Scene JSON shape

```json
{
  "type": "group",
  "children": [
    {
      "type": "rect",
      "props": { "x": 10, "y": 10, "width": 100, "height": 50, "fill": "#2563eb" }
    },
    {
      "type": "lineChart",
      "props": { "data": [1, 4, 2, 8], "x": 10, "y": 80, "width": 300, "height": 160 }
    }
  ]
}
```

## Load & export

```javascript
import LightDraw from 'lightdraw';
import { validateSceneJSON, parseAndValidateSceneJSON, formatValidationErrors } from 'lightdraw/core';

const app = LightDraw.createApp('#app', { renderer: 'html' });

// From a string (parse errors include line + column + caret):
const { json, validation } = parseAndValidateSceneJSON(rawText);
if (!validation.valid) throw new Error(formatValidationErrors(validation));

// Or validate an already-parsed object (errors include JSON paths + expected values):
const { valid, errors } = validateSceneJSON(json);
// e.g. props.variant: invalid value "primry"; expected one of: "primary" | … did you mean "primary"?
if (!valid) throw new Error(errors.join('\n'));

app.loadJSON(json);
```

Parse failures look like:

```
JSON parse error at line 4, column 12: Unexpected token }
  4 |   "type": "button",
    |            ^
```

Schema / enum failures look like:

```
root.children[0].props.variant: invalid value "primry"; expected one of: "primary" | "secondary" | "ghost" | "danger" did you mean "primary"?
theme.preset: invalid value "drak"; expected one of: "default" | "dark" | … did you mean "dark"?
```

## Widget type catalogs

Point models at module schemas:

| Domain | Doc |
|--------|-----|
| UI | [ui-components-schema.md](./ui-components-schema.md) |
| Dashboard | [dashboard-widgets-schema.md](./dashboard-widgets-schema.md) |
| Automotive | [automotive-widgets-schema.md](./automotive-widgets-schema.md) |
| Diagram | [diagram-module-schema.md](./diagram-module-schema.md) |

## Prompt template (system)

```
You generate LightDraw scene JSON. Rules:
- Root is usually { "type": "group", "children": [...] }
- Each node: { "type": "<widget>", "props": { "x", "y", ... } }
- Use only types from the provided schema catalog
- Colors: hex strings (#rrggbb)
- No JavaScript, no markdown fences in the JSON output
```

## Prompt template (user)

```
Create a 800×400 dashboard with:
- lineChart for CPU % (data: [20,35,28,42,55])
- gauge for memory at 68%
- thermometer at 72°C
Use dashboard widget types from the schema.
```

## Round-trip validation

`app.exportJSON()` keeps **authoring** shapes (widgets stay `{ type, props }` leaves). See [JSON format](./json-format.md).

```javascript
import { scenesEqual } from 'lightdraw/core';

const a = app.exportJSON();
app.clear();
app.loadJSON(a);
const b = app.exportJSON();
console.log(scenesEqual(a, b)); // true for stable widgets
```

For smaller AI/hand dumps: `app.exportJSON({ compact: true })`.

## Export for offline review

```javascript
app.export({ format: 'html', validate: true }); // self-contained HTML
app.export({ format: 'json', validate: true });
```

See [export-pipeline.md](./export-pipeline.md).
