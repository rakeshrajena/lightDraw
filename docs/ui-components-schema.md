# UI Component JSON Schema (Phase 6)

Each component is loaded via `app.loadJSON({ type: '<name>', props: { ... } })` or `LightDraw.registerComponent`.

Common props on all components: `x`, `y`, `width`, `height`, `visible`, `name`.

## button

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string | `"Button"` | Button text |
| fill | string | `"#2563eb"` | Background color |
| disabled | boolean | `false` | Disables interaction |

Events: `click`, `change` (disabled state)

## slider

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | number | `50` | Current value |
| min | number | `0` | Minimum |
| max | number | `100` | Maximum |
| width | number | `200` | Track width |

Events: `change` (on drag end)

## checkbox

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| checked | boolean | `false` | Checked state |
| label | string | — | Label text |

Events: `change`

## toggle

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | boolean | `false` | On/off state |
| label | string | — | Accessible label |

Events: `change`

## input

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | string | `""` | Text value |
| placeholder | string | `""` | Placeholder |

Events: `input`, `change` (native in HTML renderer)

## textarea

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | string | `""` | Text content |
| rows | number | `4` | Row hint |

Events: `input`, `change`

## radio

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| selected | boolean | `false` | Selected in group |
| group | string | `"default"` | Radio group name |
| label | string | — | Label text |

Events: `change`

## tooltip

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| text | string | `"Tooltip"` | Tooltip content |
| visible | boolean | `false` | Initial visibility |

Events: `open`, `close`

## menu

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| items | string[] | `["Item 1",…]` | Menu items |
| open | boolean | `false` | Dropdown open |

Events: `open`, `select`, `change`

## dialog

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | `"Dialog"` | Title bar text |
| open | boolean | `true` | Modal visibility |
| overlayWidth | number | `800` | Overlay width |
| overlayHeight | number | `600` | Overlay height |

Events: `open`, `close`

## tabs

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| tabs | string[] | `["Tab 1","Tab 2"]` | Tab labels |
| activeTab | number | `0` | Active index |

Events: `change`

## accordion

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| sections | `{title,content}[]` | 2 sections | Accordion sections |
| expandedIndex | number | `0` | Open section |

Events: `change`

## table

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| columns | string[] | `["Name","Value"]` | Column headers |
| rows | string[][] | sample rows | Table data |

Events: `select`

## tree

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| nodes | `{label,children?}[]` | sample tree | Tree structure |

Events: `change`

## toolbar

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| buttons | string[] | `["New","Open","Save"]` | Button labels |

Events: `select`

## toast

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| message | string | `"Notification"` | Toast text |
| duration | number | `3000` | Auto-dismiss ms |

Events: `open`, `close`

## statusBar

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| segments | string[] | `["Ready",…]` | Status segments |
| width | number | `400` | Bar width |

## Also available

- **label** — `{ text, fontSize, color }`
- **card** — `{ title, width, height }`
- **progressBar** — `{ value, width, height, fill }`

## Round-trip

```javascript
import { toJSON } from 'lightdraw/core';
const json = toJSON(componentNode);
// json.type === 'slider', json.props.value preserved
```
