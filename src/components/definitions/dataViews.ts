/**
 * UI component factories — dataViews.
 */
import { registerComponent } from '../registryCore';
import {
  bool,
  num,
  setState,
  str,
  syntheticEvent,
} from '../helpers';
import { UI, createGroup, canvasSurface } from './shared';

/** Table */
registerComponent('table', (props, app) => {
  const columns = (props.columns as string[]) ?? ['Name', 'Value'];
  const rows = (props.rows as string[][]) ?? [
    ['Row A', '1'],
    ['Row B', '2'],
  ];
  const colW = num(props, 'colWidth', 100);
  const width = num(props, 'width', colW * columns.length);
  const rowH = 36;
  const tableH = rowH * (rows.length + 1);
  const sortable = bool(props, 'sortable', false);
  const sortColumn = num(props, 'sortColumn', -1);
  const sortDirection = str(props, 'sortDirection', 'asc');
  const selectedRow = num(props, 'selectedRow', -1);
  const group = createGroup(app, 'table', props, { focusable: true, role: 'grid' });

  group.add(canvasSurface(app, width, tableH, { radius: UI().radius }));

  group.add(
    app.rect({
      width,
      height: rowH,
      fill: UI().surfaceMuted,
      stroke: null,
      listening: false,
    })
  );

  columns.forEach((col, ci) => {
    const sorted = sortable && sortColumn === ci;
    const arrow = sorted ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : sortable ? ' ⇅' : '';
    group.add(
      app.text({
        text: col.toUpperCase() + arrow,
        x: ci * colW + 14,
        y: 10,
        fontSize: UI().fontSizeSm,
        fontWeight: 'bold',
        fill: sorted ? UI().primary : UI().textMuted,
        listening: false,
      })
    );
  });

  rows.forEach((row, ri) => {
    const rowY = (ri + 1) * rowH;
    const zebra = ri % 2 === 1;
    const selected = ri === selectedRow;
    if (zebra || selected) {
      group.add(
        app.rect({
          width,
          height: rowH,
          y: rowY,
          fill: selected ? UI().primarySubtle : UI().surfaceMuted,
          opacity: selected ? 1 : 0.5,
          listening: false,
        })
      );
    }
    if (selected) {
      group.add(
        app.rect({
          width: 3,
          height: rowH,
          y: rowY,
          fill: UI().primary,
          listening: false,
        })
      );
    }
    const rowGroup = app.group({ x: 0, y: rowY, listening: true, metadata: { rowIndex: ri } });
    row.forEach((cell, ci) => {
      rowGroup.add(
        app.text({
          text: cell,
          x: ci * colW + 14,
          y: 10,
          fontSize: UI().fontSize,
          fill: selected ? UI().primary : UI().text,
          listening: false,
        })
      );
    });
    rowGroup.on('click', () => {
      setState(group, { selectedRow: ri });
      group.emit('select', syntheticEvent('select', group, { index: ri, row }));
      group.getApp()?.requestRender();
    });
    group.add(rowGroup);
  });

  setState(group, {
    columns,
    rows,
    selectedRow,
    colWidth: colW,
    width,
    sortable,
    sortColumn,
    sortDirection,
    stickyHeader: bool(props, 'stickyHeader', true),
    maxHeight: num(props, 'maxHeight', 0),
  });
  return group;
});

/** Tree View */
registerComponent('tree', (props, app) => {
  const nodes = (props.nodes as { label: string; children?: { label: string }[] }[]) ?? [
    { label: 'Root', children: [{ label: 'Child A' }, { label: 'Child B' }] },
  ];
  const expanded = new Set<number>((props.expanded as number[]) ?? [0]);
  const selectedNode = str(props, 'selectedNode', '');
  const width = num(props, 'width', 220);
  const group = createGroup(app, 'tree', props, { focusable: true, role: 'tree' });
  let y = 4;

  nodes.forEach((node, i) => {
    const parentKey = `p${i}`;
    const parentSelected = selectedNode === parentKey;
    const header = app.group({ x: 0, y, listening: true, metadata: { treeKey: parentKey } });
    if (parentSelected) {
      header.add(
        app.roundedRect({
          width,
          height: 24,
          cornerRadius: UI().radiusSm,
          fill: UI().primarySubtle,
          listening: false,
        })
      );
    }
    header.add(
      app.text({
        text: (expanded.has(i) ? '▾  ' : '▸  ') + node.label,
        fontSize: UI().fontSize,
        fontWeight: '600',
        fill: parentSelected ? UI().primary : UI().text,
        x: 8,
        y: 4,
        listening: false,
      })
    );
    header.on('click', () => {
      if (expanded.has(i)) expanded.delete(i);
      else expanded.add(i);
      setState(group, { expanded: Array.from(expanded), selectedNode: parentKey });
      group.emit('change', syntheticEvent('change', group, { value: i }));
      group.getApp()?.requestRender();
    });
    group.add(header);
    y += 26;
    if (expanded.has(i) && node.children) {
      group.add(
        app.rect({
          x: 10,
          y,
          width: 1,
          height: node.children.length * 22,
          fill: UI().border,
          listening: false,
        })
      );
      node.children.forEach((child, ci) => {
        const key = `${parentKey}.c${ci}`;
        const leafSelected = selectedNode === key;
        const leaf = app.group({ x: 18, y, listening: true, metadata: { treeKey: key } });
        if (leafSelected) {
          leaf.add(
            app.roundedRect({
              width: width - 22,
              height: 22,
              cornerRadius: UI().radiusSm,
              fill: UI().primarySubtle,
              listening: false,
            })
          );
          leaf.add(
            app.rect({
              width: 3,
              height: 22,
              fill: UI().primary,
              listening: false,
            })
          );
        }
        leaf.add(
          app.text({
            text: child.label,
            x: leafSelected ? 10 : 8,
            y: 4,
            fontSize: UI().fontSize,
            fill: leafSelected ? UI().primary : UI().textSecondary,
            listening: false,
          })
        );
        leaf.on('click', (e: { stopPropagation?: () => void }) => {
          e.stopPropagation?.();
          setState(group, { selectedNode: key });
          group.emit('select', syntheticEvent('select', group, { item: child.label, value: key }));
          group.getApp()?.requestRender();
        });
        group.add(leaf);
        y += 22;
      });
    }
  });

  setState(group, { nodes, expanded: Array.from(expanded), selectedNode, width });
  return group;
});
