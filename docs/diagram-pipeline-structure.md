# Diagram symbol structure (pipeline / schematic / network)

How catalog symbols are organized under `src/diagram/`, and how to add or remove one without breaking the public API.

## Why this layout

Each family used to live in one multi-thousand-line file. They are split so humans and AI can:

- Add a symbol by editing small, obvious files
- Find resolve / alias bugs without scrolling drawers
- Keep public façades stable (`*Icons.ts` re-exports)

## Pipeline module map

```
src/diagram/
├── pipeline/                         ← data + resolve + drawers
│   ├── types.ts                      # categories, meta, PipelineGlyphFamily
│   ├── catalog.ts                    # [kind, label, category] rows
│   ├── familyMap.ts                  # kind → glyph family (+ ENV/SYSTEM marks)
│   ├── aliases.ts                    # snake_case / shortcuts → kind
│   ├── resolve.ts                    # resolve / list / getMeta
│   ├── index.ts                      # data barrel
│   └── drawers/
│       ├── drawHelpers.ts            # S, MID, addLine/Circle/Box/…
│       ├── flow.ts / data.ts / …     # domain drawers
│       ├── registry.ts               # PIPELINE_DRAWERS map + drawPipelineGlyph
│       └── index.ts
├── pipelineIcons.ts                  # thin public façade (re-exports)
├── pipelineSymbols.ts                # catalog tile chrome (accent plate)
└── index.ts                          # Diagram.* public API
```

**Pipeline data flow**

```
user input ("xor", "k8s", …)
  → aliases.ts / resolve.ts
  → canonical kind
  → familyMap.ts (kind → family)
  → drawers/registry.ts (family → draw*)
  → pipelineSymbols.ts (optional plate + label)
```

### Add a pipeline symbol

1. **`pipeline/catalog.ts`** — append `[kind, 'Label', 'category']`
2. **`pipeline/familyMap.ts`** — map `kind: 'familyName'` (reuse a family when possible)
3. **Drawer** (if new family): add `draw*` in the right `drawers/*.ts`, extend `PipelineGlyphFamily`, register in `registry.ts`
4. **`pipeline/aliases.ts`** (optional)
5. Run: `npx vitest run test/diagram/pipeline/` and `npx tsc --noEmit`

### Pipeline drawer files

| Edit here | When the glyph is about… |
|-----------|---------------------------|
| `flow.ts` | Start/end, tasks, gateways, events, arrows, workflow |
| `data.ts` | Documents, DB, queues, charts, email/chat |
| `software.ts` | Git, build/deploy, k8s, modules, pins/lanes |
| `manufacturing.ts` | Machines, warehouse, AGV, sensors, QC tests |
| `peopleGovernance.ts` | People, approval/sign-off, money, virus/bug |
| `facilities.ts` | Factory, building, school, temple, parking |
| `transport.ts` | Car, bus, flight, ship, road |
| `natureDevices.ts` | Sun/earth/forest, laptop, wifi, GPS |

## Schematic module map

```
src/diagram/
├── schematic/
│   ├── types.ts / catalog.ts / aliases.ts / resolve.ts
│   ├── drawers/
│   │   ├── helpers.ts              # leads, poly, arrowHead, theme colors
│   │   ├── passives.ts             # R / C / L / crystal / transformer
│   │   ├── semiconductors.ts       # diode / BJT / FET / thyristor
│   │   ├── logicAnalog.ts          # gates / op-amp / IC box
│   │   ├── electromechanical.ts    # switch / relay / motor / connector
│   │   ├── powerMisc.ts            # ground / battery / fuse / wire / …
│   │   └── glyph.ts                # kind → drawer switch (drawSchematicGlyph)
│   └── index.ts
└── schematicIcons.ts               # thin public façade
```

**Schematic flow:** alias → kind → `drawers/glyph.ts` switch → parametric `draw*` (e.g. `drawResistor(app, g, 'pot')`).

### Add a schematic symbol

1. **`schematic/catalog.ts`** — `[kind, 'Label', 'category']`
2. **`schematic/drawers/glyph.ts`** — `case 'kind':` calling an existing or new drawer
3. **Drawer** (if needed) in the matching domain file under `drawers/`
4. **`schematic/aliases.ts`** (optional)
5. Run: `npx vitest run test/diagram/schematic/`

## Network module map

```
src/diagram/
├── network/
│   ├── types.ts                    # NetworkIconKind, categories, style/meta
│   ├── aliases.ts / kindMeta.ts / resolve.ts
│   ├── drawers/
│   │   ├── helpers.ts              # L/R/C/E, cloud/globe/server chrome
│   │   └── glyph.ts                # kind → drawer (drawNetworkIcon)
│   └── index.ts
└── networkIcons.ts                 # thin public façade
```

**Network flow:** `slugNetworkType` → aliases / kindMeta → `drawNetworkIcon` + `networkStyleForKind`.

### Add a network icon

1. Extend **`NetworkIconKind`** in `network/types.ts`
2. Add **`NETWORK_KIND_META`** row in `kindMeta.ts`
3. Wire aliases in **`aliases.ts`**
4. Add a `case` in **`drawers/glyph.ts`** (reuse helpers when possible)
5. Run: `npx vitest run test/diagram/network/`

## Public API (do not break)

Facades `pipelineIcons.ts`, `schematicIcons.ts`, and `networkIcons.ts` re-export the modules above. Prefer importing via those façades or `Diagram.*`.

| Family | Key exports |
|--------|-------------|
| Pipeline | `listPipelineSymbols`, `resolvePipelineSymbolKind`, `drawPipelineGlyph`, `Diagram.pipelineSymbol` |
| Schematic | `listSchematicSymbols`, `resolveSchematicSymbolKind`, `drawSchematicGlyph`, `Diagram.schematicSymbol` |
| Network | `listNetworkIconKinds`, `resolveNetworkIconKind`, `drawNetworkIcon`, `Diagram.networkNode` |

## Phased roadmap

| Phase | Goal | Status |
|-------|------|--------|
| **1** | Extract catalog / family / aliases / resolve into `pipeline/` | **Done** |
| **2** | Split drawers into `pipeline/drawers/*.ts` + family→fn map | **Done** |
| **3** | Same pattern for `schematic/` and `network/` | **Done** |
| **4** | Mirror tests under `test/diagram/{pipeline,schematic,network}/` | **Done** |

## Tests

```
test/diagram/
├── pipeline/catalog.test.ts      # public API + sample glyphs
├── pipeline/structure.test.ts    # catalog ↔ familyMap ↔ drawers ↔ aliases
├── schematic/catalog.test.ts
├── schematic/structure.test.ts   # aliases + every kind draws
├── network/icons.test.ts
└── network/structure.test.ts     # kindMeta ↔ aliases
```

Run: `npm run test:diagram`

## Debugging tips

- **Wrong glyph for a name** → check that family's `aliases.ts` (pipeline also check `familyMap.ts`).
- **Missing from catalog UI** → missing catalog / kindMeta row.
- **Draw crash / blank** → pipeline: family missing from `PIPELINE_DRAWERS`; schematic/network: missing `case` in `glyph.ts`.
- **Accent color wrong** → pipeline `pipelineSymbols.ts`; network `networkStyleForKind` / theme tokens.

## Related docs

- [Diagram module schema](./diagram-module-schema.md) — JSON / API surface
- [Theme architecture](./theme-architecture.md) — diagram stroke/fill tokens
- [Contributing](../CONTRIBUTING.md) — repo layout
