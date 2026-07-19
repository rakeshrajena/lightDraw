/**
 * Dashboard data table — striped rows, optional keyword search.
 */
import type { App } from '../../App';
import type { Group } from '../../shapes/Group';
import { registerDashboard } from '../registryCore';
import {
  bool,
  createWidgetGroup,
  getState,
  num,
  setState,
  str,
} from '../helpers';
import { syntheticEvent } from '../../components/helpers';
import { getActiveDashboard } from '../theme';
import { installChartRebuild } from '../charts/core/refresh';

function asStringRows(rows: unknown): string[][] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) =>
    Array.isArray(row) ? row.map((c) => String(c ?? '')) : [String(row ?? '')]
  );
}

/** Filter rows where any cell contains the query (case-insensitive). */
export function filterTableRows(rows: string[][], query: string): string[][] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => row.some((cell) => cell.toLowerCase().includes(q)));
}

registerDashboard('dataTable', (props, app) => {
  const group = createWidgetGroup(app, 'dataTable', props, { focusable: true, role: 'grid' });
  installChartRebuild(group, app, buildDataTable);
  return group;
});

function buildDataTable(group: Group, app: App, props: Record<string, unknown>): void {
  const columns = (props.columns as string[]) ?? ['Name', 'Value'];
  const allRows = asStringRows(
    props.rows ?? [
      ['Alpha', '42'],
      ['Beta', '18'],
      ['Gamma', '27'],
    ]
  );
  const showSearch = bool(props, 'showSearch', false);
  const search = str(props, 'search', str(props, 'searchQuery', ''));
  const striped = bool(props, 'striped', true);
  const sortable = bool(props, 'sortable', false);
  const sortColumn = num(props, 'sortColumn', -1);
  const sortDirection = str(props, 'sortDirection', 'asc') === 'desc' ? 'desc' : 'asc';
  const selectedRow = num(props, 'selectedRow', -1);
  const colW = num(props, 'colWidth', 0);
  const width = num(props, 'width', Math.max(240, columns.length * 100));
  const rowH = Math.max(28, num(props, 'rowHeight', 34));
  const searchH = showSearch ? 36 : 0;
  const pad = 1;
  const theme = getActiveDashboard();
  const cellW = colW > 0 ? colW : width / Math.max(columns.length, 1);

  let rows = filterTableRows(allRows, search);
  if (sortable && sortColumn >= 0 && sortColumn < columns.length) {
    rows = [...rows].sort((a, b) => {
      const cmp = (a[sortColumn] ?? '').localeCompare(b[sortColumn] ?? '', undefined, {
        numeric: true,
        sensitivity: 'base',
      });
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }

  const tableH = searchH + rowH * (rows.length + 1);
  const height = num(props, 'height', 0) > 0 ? num(props, 'height', tableH) : tableH;
  group.metadata.chartWidth = width;
  group.metadata.chartHeight = height;

  group.add(
    app.roundedRect({
      width,
      height,
      cornerRadius: 8,
      fill: theme.chartBg,
      stroke: theme.panelStroke,
      strokeWidth: 1,
      listening: false,
    })
  );

  if (showSearch) {
    const focused = bool(props, 'searchFocused', false);
    group.add(
      app.roundedRect({
        x: 8,
        y: 6,
        width: width - 16,
        height: 24,
        cornerRadius: 6,
        fill: theme.chartPlot,
        stroke: focused ? theme.primary : theme.panelStroke,
        strokeWidth: focused ? 1.5 : 1,
        listening: true,
      })
    );
    group.add(
      app.text({
        text: search || 'Search…',
        x: 16,
        y: 10,
        fontSize: theme.fontSizeSm,
        fill: search ? theme.text : theme.textMuted,
        listening: false,
      })
    );
    const searchHit = app.rect({
      x: 8,
      y: 6,
      width: width - 16,
      height: 24,
      fill: 'rgba(0,0,0,0.001)',
      listening: true,
    });
    searchHit.on('click', () => {
      setState(group, { searchFocused: true });
      (group.metadata.chartRebuild as (() => void) | undefined)?.();
    });
    group.add(searchHit);

    if (!group.metadata._dataTableKeyBound) {
      group.metadata._dataTableKeyBound = true;
      const onKey = (e: KeyboardEvent) => {
        const st = group.metadata.widgetState as Record<string, unknown> | undefined;
        if (!st?.showSearch || !st.searchFocused) return;
        if (e.key === 'Escape') {
          setState(group, { searchFocused: false });
          (group.metadata.chartRebuild as (() => void) | undefined)?.();
          return;
        }
        if (e.key === 'Backspace') {
          e.preventDefault();
          const next = String(st.search ?? '').slice(0, -1);
          setState(group, { search: next, searchQuery: next });
          (group.metadata.chartRebuild as (() => void) | undefined)?.();
          return;
        }
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          const next = String(st.search ?? '') + e.key;
          setState(group, { search: next, searchQuery: next });
          (group.metadata.chartRebuild as (() => void) | undefined)?.();
        }
      };
      const root = typeof document !== 'undefined' ? document : null;
      root?.addEventListener('keydown', onKey);
      group.metadata._dataTableKeyHandler = onKey;
    }
  }

  const headerY = searchH;
  group.add(
    app.rect({
      x: pad,
      y: headerY,
      width: width - pad * 2,
      height: rowH,
      fill: theme.panel,
      listening: false,
    })
  );

  columns.forEach((col, ci) => {
    const sorted = sortable && sortColumn === ci;
    const arrow = sorted ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : sortable ? ' ⇅' : '';
    const th = app.group({
      x: ci * cellW,
      y: headerY,
      listening: sortable,
      metadata: { colIndex: ci },
    });
    th.add(
      app.text({
        text: col.toUpperCase() + arrow,
        x: 12,
        y: Math.max(8, (rowH - theme.fontSizeSm) / 2),
        fontSize: theme.fontSizeSm,
        fontWeight: 'bold',
        fill: sorted ? theme.primary : theme.textMuted,
        listening: false,
      })
    );
    if (sortable) {
      th.on('click', () => {
        const prev = num(getState(group), 'sortColumn', -1);
        const prevDir = str(getState(group), 'sortDirection', 'asc');
        const nextDir = prev === ci && prevDir === 'asc' ? 'desc' : 'asc';
        setState(group, { sortColumn: ci, sortDirection: nextDir });
        (group.metadata.chartRebuild as (() => void) | undefined)?.();
      });
    }
    group.add(th);
  });

  rows.forEach((row, ri) => {
    const rowY = headerY + (ri + 1) * rowH;
    const zebra = striped && ri % 2 === 1;
    const selected = ri === selectedRow;
    if (zebra || selected) {
      group.add(
        app.rect({
          x: pad,
          y: rowY,
          width: width - pad * 2,
          height: rowH,
          fill: selected ? theme.primary : theme.chartPlot,
          opacity: selected ? 0.25 : 1,
          listening: false,
        })
      );
    }
    if (selected) {
      group.add(
        app.rect({
          x: pad,
          y: rowY,
          width: 3,
          height: rowH,
          fill: theme.primary,
          listening: false,
        })
      );
    }
    const rowGroup = app.group({
      x: 0,
      y: rowY,
      listening: true,
      metadata: { rowIndex: ri },
    });
    row.forEach((cell, ci) => {
      rowGroup.add(
        app.text({
          text: cell,
          x: ci * cellW + 12,
          y: Math.max(8, (rowH - theme.fontSize) / 2),
          fontSize: theme.fontSize,
          fill: selected ? theme.primary : theme.text,
          listening: false,
        })
      );
    });
    rowGroup.on('click', () => {
      setState(group, { selectedRow: ri, searchFocused: false });
      group.emit('select', syntheticEvent('select', group, { index: ri, row }));
      (group.metadata.chartRebuild as (() => void) | undefined)?.();
    });
    group.add(rowGroup);
  });

  setState(group, {
    columns,
    rows: allRows,
    width,
    height,
    colWidth: cellW,
    rowHeight: rowH,
    striped,
    showSearch,
    search,
    searchQuery: search,
    searchFocused: bool(props, 'searchFocused', false),
    sortable,
    sortColumn,
    sortDirection,
    selectedRow,
    stickyHeader: bool(props, 'stickyHeader', true),
    maxHeight: num(props, 'maxHeight', 0),
  });
}
