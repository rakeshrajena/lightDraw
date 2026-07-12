# UI Component JSON Schema

Each component loads via `app.loadJSON({ type: '<name>', props: { ... } })` or `LightDraw.createComponentFromJSON`.

**Common props:** `x`, `y`, `width`, `height`, `visible`, `name`, `id`

**Renderers:** HTML uses native DOM + `lightdraw.css`; canvas/SVG use `definitions.ts` shapes with matching `UI` tokens.

---

## Forms (9)

### button

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string | `"Button"` | Button text |
| variant | `"primary"` \| `"secondary"` \| `"ghost"` \| `"danger"` | `"primary"` | Visual style |
| size | `"sm"` \| `"md"` \| `"lg"` | `"md"` | Height / font scale |
| disabled | boolean | `false` | Disables interaction |
| fill | string | — | Canvas-only background override |

Events: `click`, `change`

### label

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| text | string | `""` | Label text |
| fontSize | number | `12` | Font size (px) |
| fontWeight | string | `"600"` | Font weight |
| color | string | muted text | Fill color (canvas) |

### input

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string | — | Field label |
| value | string | `""` | Current value |
| placeholder | string | `""` | Placeholder |
| invalid | boolean | `false` | Error styling |
| error | string | — | Error message (HTML) |
| disabled | boolean | `false` | Disabled state |
| fullWidth | boolean | `false` | 100% width in HTML |

Events: `input`, `change`, `focus`, `blur`

### textarea

Same as **input**, plus `rows` (number, default `4`), `height` (number).

### checkbox

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string | — | Label text |
| checked | boolean | `false` | Checked state |
| disabled | boolean | `false` | Disabled state |
| size | `"sm"` \| `"md"` \| `"lg"` | `"md"` | Control scale |

Events: `change`

### toggle

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string | — | Accessible label |
| value | boolean | `false` | On/off state |
| disabled | boolean | `false` | Disabled state |
| size | `"sm"` \| `"md"` | `"md"` | Switch scale |

Events: `change`

### radio

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string | — | Label text |
| group | string | `"default"` | Radio group name |
| selected | boolean | `false` | Selected in group |
| disabled | boolean | `false` | Disabled state |

Events: `change`

### slider

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string | — | Field label |
| value | number | `50` | Current value |
| min | number | `0` | Minimum |
| max | number | `100` | Maximum |
| width | number | `200` | Track width |
| disabled | boolean | `false` | Disabled state |
| fullWidth | boolean | `false` | 100% width |

Events: `change`, `input`

### progressBar

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string | — | Label above bar |
| value | number | `0` | 0–100 progress |
| variant | `"default"` \| `"success"` \| `"warning"` \| `"danger"` | `"default"` | Bar color |
| size | `"sm"` \| `"md"` \| `"lg"` | `"md"` | Track height |
| width | number | `200` | Bar width |
| fullWidth | boolean | `false` | 100% width |

---

## Surfaces (5)

### card

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | — | Header title |
| subtitle | string | — | Subtitle under title |
| actions | string[] | — | Action chip labels (HTML) |
| elevated | boolean | `false` | Stronger shadow / hover lift |
| width | number | `280` | Card width |
| height | number | `160` | Card height |

### tabs

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| tabs | string[] | `["Tab 1","Tab 2"]` | Tab labels |
| activeTab | number | `0` | Active index |
| width | number | `300` | Tab strip width |

Events: `change`

### accordion

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| sections | `{title, content}[]` | 2 sections | Panel definitions |
| expandedIndex | number | `0` | Open section (-1 = all closed) |
| width | number | `280` | Accordion width |

Events: `change`

### toolbar

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| items | `(string \| "|")[]` | `["New","Open","Save"]` | Buttons; `"|"` = separator |
| icons | string[] | — | Optional icon prefix per button |
| width | number | — | Toolbar width |

Events: `select`

### statusBar

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| segments | string[] | `["Ready",…]` | Status segments |
| width | number | `400` | Bar width |
| primaryIndex | number | `0` | Highlighted segment |
| mono | boolean | `false` | Monospace segments |

---

## Overlays (4)

### dialog

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | `"Dialog"` | Title text |
| message | string | — | Body copy |
| open | boolean | `true` | Modal open state |
| width | number | `320` | Panel max width |
| height | number | `200` | Panel height (canvas) |
| overlayWidth | number | `800` | Backdrop width |
| overlayHeight | number | `600` | Backdrop height |

Events: `open`, `close`, `change` (confirm)

### menu

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| items | string[] | `["Item 1",…]` | Menu items |
| itemVariants | string[] | — | Per-item variant (`"danger"`) |
| triggerLabel | string | `"Actions"` | Closed-state label |
| open | boolean | `false` | Dropdown open |
| width | number | `180` | Panel width |

Events: `open`, `close`, `select`

### tooltip

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| text | string | `"Tooltip"` | Bubble text |
| anchor | string | `"Hover me"` | Trigger label |
| placement | `"top"` \| `"bottom"` \| `"right"` | `"bottom"` | Bubble position |
| delay | number | `0` | Show delay (ms) |
| visible | boolean | `false` | Bubble visible |

Events: `open`, `close`

### toast

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| message | string | `"Notification"` | Toast text |
| variant | `"success"` \| `"error"` \| `"warning"` \| `"info"` | `"success"` | Style variant |
| position | `"top-right"` \| `"bottom-right"` \| `"bottom-left"` | — | Stack position |
| dismissible | boolean | `true` | Show dismiss button |
| duration | number | `3000` | Auto-dismiss ms |
| visible | boolean | `true` | Visibility |

Events: `open`, `close`

---

## Data (2)

### table

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| columns | string[] | `["Name","Value"]` | Column headers |
| rows | string[][] | sample rows | Cell data |
| sortable | boolean | `false` | Click headers to sort |
| sortColumn | number | `-1` | Active sort column |
| sortDirection | `"asc"` \| `"desc"` | `"asc"` | Sort direction |
| stickyHeader | boolean | `true` | Sticky thead (HTML) |
| maxHeight | number | `0` | Scroll body height (HTML) |
| colWidth | number | `100` | Column width (canvas) |
| width | number | — | Table wrapper width |
| selectedRow | number | `-1` | Selected row index |

Events: `select`, `change` (sort)

Status cell values `Active`, `Pending`, `Inactive`, etc. render as badges in HTML.

### tree

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| nodes | `{label, children?}[]` | sample tree | Tree structure |
| expanded | number[] | `[0]` | Expanded parent indices |
| selectedNode | string | `""` | Selection key (`p0`, `p0.c1`) |
| width | number | `220` | Tree width |

Events: `change` (expand), `select` (leaf)

---

## Round-trip

```javascript
import { toJSON } from 'lightdraw/core';

const json = toJSON(componentNode);
// { type: 'slider', props: { value: 42, width: 180, x: 5, y: 5, ... } }

const restored = LightDraw.createComponentFromJSON(json.type, json.props, app);
```

Full scene export: `app.exportJSON()` / `app.loadJSON()`.

## Theming

See [ui-theme-guide.md](./ui-theme-guide.md) for app `uiTheme` / `setUiTheme` presets, token overrides, and high-contrast mode.

Optional **per-node** override on component props: `uiTheme` (preset name or token object). Resolve order: node `uiTheme` → app theme → defaults. See [theme-architecture.md](./theme-architecture.md).
