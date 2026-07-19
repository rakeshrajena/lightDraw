/**
 * Native HTML sync — dataViews.
 */
import type { Node } from '../../Node';
import type { NativeSyncContext } from './types';
import { syntheticEvent } from '../../components/helpers';
import {
  getState,
  escHtml,
  formatTableCell,
  sortTableRows,
  absPosition,
  bindDelegated,
} from './shared';

/** Data table with striped rows */
export function syncNativeTable(node: Node, parent: HTMLElement, ctx: NativeSyncContext): void {
  const state = getState(node);
  const columns = (state.columns as string[]) ?? ['Name', 'Value'];
  const rows = (state.rows as string[][]) ?? [['A', '1']];
  const selectedRow = Number(state.selectedRow ?? -1);
  const colW = Number(state.colWidth ?? 100);
  const width = Number(state.width ?? colW * columns.length);
  const sortable = Boolean(state.sortable);
  const sortColumn = Number(state.sortColumn ?? -1);
  const sortDirection = String(state.sortDirection ?? 'asc') === 'desc' ? 'desc' : 'asc';
  const stickyHeader = state.stickyHeader !== false;
  const maxHeight = Number(state.maxHeight ?? 0);

  let displayRows = rows;
  if (sortColumn >= 0 && sortColumn < columns.length) {
    displayRows = sortTableRows(rows, sortColumn, sortDirection);
  }

  let el = ctx.nodeElements.get(node.id) as HTMLDivElement | undefined;
  if (!el) {
    el = document.createElement('div');
    el.id = node.id;
    el.className = 'lightdraw-table-wrap lightdraw-table-wrap--scroll-x';
    el.setAttribute('role', 'grid');
    parent.appendChild(el);
    bindDelegated(el, (e) => {
      const th = (e.target as HTMLElement).closest('.lightdraw-table-th--sortable');
      if (th) {
        const ci = Number(th.getAttribute('data-col'));
        const st = getState(node);
        const prevCol = Number(st.sortColumn ?? -1);
        const prevDir = String(st.sortDirection ?? 'asc');
        const nextDir = prevCol === ci && prevDir === 'asc' ? 'desc' : 'asc';
        node.metadata.componentState = { ...st, sortColumn: ci, sortDirection: nextDir };
        node.emit('change', syntheticEvent('change', node, { value: ci, field: nextDir }));
        node.getApp()?.requestRender();
        return;
      }
      const row = (e.target as HTMLElement).closest('.lightdraw-table-row');
      if (!row) return;
      const ri = Number(row.getAttribute('data-index'));
      const tableRows = (getState(node).rows as string[][]) ?? [];
      node.metadata.componentState = { ...getState(node), selectedRow: ri };
      node.emit('select', syntheticEvent('select', node, { index: ri, row: tableRows[ri] }));
      node.getApp()?.requestRender();
    });
    ctx.nodeElements.set(node.id, el);
  } else if (el.parentElement !== parent) {
    parent.appendChild(el);
  }

  const head = columns
    .map((c, ci) => {
      let cls = 'lightdraw-table-th';
      if (sortable) cls += ' lightdraw-table-th--sortable';
      if (sortColumn === ci) {
        cls += sortDirection === 'asc' ? ' lightdraw-table-th--sorted-asc' : ' lightdraw-table-th--sorted-desc';
      }
      const sortIcon = sortable ? '<span class="lightdraw-table-sort-icon" aria-hidden="true"></span>' : '';
      return `<th scope="col" class="${cls}" data-col="${ci}"><span class="lightdraw-table-th-label">${escHtml(c)}</span>${sortIcon}</th>`;
    })
    .join('');
  const body = displayRows
    .map((row, ri) => {
      const sourceIndex = rows.indexOf(row);
      const dataIndex = sourceIndex >= 0 ? sourceIndex : ri;
      return `<tr class="lightdraw-table-row${dataIndex === selectedRow ? ' lightdraw-table-row--selected' : ''}" data-index="${dataIndex}">${row.map((cell) => `<td>${formatTableCell(cell)}</td>`).join('')}</tr>`;
    })
    .join('');

  const theadAttr = stickyHeader ? ' class="lightdraw-table-head--sticky"' : '';
  const scrollStyle = maxHeight > 0 ? ` style="max-height:${maxHeight}px"` : '';
  el.className = 'lightdraw-table-wrap lightdraw-table-wrap--scroll-x';
  el.innerHTML = `<div class="lightdraw-table-scroll"${scrollStyle}><table class="lightdraw-table"><thead${theadAttr}><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;

  const tableH = maxHeight > 0 ? maxHeight : 36 * (rows.length + 1);
  el.style.cssText = absPosition(node, width, tableH);
  ctx.applyA11y(node, el);
  ctx.applyUiClasses(node, el);
  ctx.seenIds.add(node.id);
}

/** Expandable tree */
export function syncNativeTree(node: Node, parent: HTMLElement, ctx: NativeSyncContext): void {
  const state = getState(node);
  const nodes = (state.nodes as { label: string; children?: { label: string }[] }[]) ?? [
    { label: 'Root', children: [{ label: 'Child A' }, { label: 'Child B' }] },
  ];
  const expanded = new Set<number>((state.expanded as number[]) ?? [0]);
  const selectedNode = String(state.selectedNode ?? '');

  let el = ctx.nodeElements.get(node.id) as HTMLUListElement | undefined;
  if (!el) {
    el = document.createElement('ul');
    el.id = node.id;
    el.className = 'lightdraw-tree';
    el.setAttribute('role', 'tree');
    parent.appendChild(el);
    bindDelegated(el, (e) => {
      const leaf = (e.target as HTMLElement).closest('.lightdraw-tree-leaf');
      if (leaf) {
        const key = leaf.getAttribute('data-key') ?? '';
        const st = getState(node);
        node.metadata.componentState = { ...st, selectedNode: key };
        node.emit('select', syntheticEvent('select', node, { item: key, value: key }));
        node.getApp()?.requestRender();
        return;
      }
      const btn = (e.target as HTMLElement).closest('.lightdraw-tree-toggle');
      if (!btn) return;
      const i = Number(btn.getAttribute('data-index'));
      const st = getState(node);
      const next = new Set<number>((st.expanded as number[]) ?? [0]);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      node.metadata.componentState = { ...st, expanded: Array.from(next), selectedNode: `p${i}` };
      node.emit('change', syntheticEvent('change', node, { value: i }));
      node.getApp()?.requestRender();
    });
    ctx.nodeElements.set(node.id, el);
  } else if (el.parentElement !== parent) {
    parent.appendChild(el);
  }

  el.innerHTML = nodes
    .map((n, i) => {
      const isOpen = expanded.has(i);
      const parentKey = `p${i}`;
      const kids =
        isOpen && n.children?.length
          ? `<ul class="lightdraw-tree-children" role="group">${n.children
              .map((c, ci) => {
                const key = `${parentKey}.c${ci}`;
                return `<li role="none"><button type="button" class="lightdraw-tree-leaf${selectedNode === key ? ' lightdraw-tree-leaf--selected' : ''}" data-key="${key}" role="treeitem">${escHtml(c.label)}</button></li>`;
              })
              .join('')}</ul>`
          : '';
      return `<li class="lightdraw-tree-node${selectedNode === parentKey ? ' lightdraw-tree-node--selected' : ''}" role="none">
        <button type="button" class="lightdraw-tree-toggle" data-index="${i}" aria-label="Toggle ${escHtml(n.label)}" aria-expanded="${isOpen}">
          <span class="lightdraw-tree-chevron${isOpen ? ' lightdraw-tree-chevron--open' : ''}" aria-hidden="true"></span>
          <span class="lightdraw-tree-label">${escHtml(n.label)}</span>
        </button>${kids}</li>`;
    })
    .join('');

  let estHeight = 8;
  nodes.forEach((n, i) => {
    estHeight += 28;
    if (expanded.has(i) && n.children) estHeight += n.children.length * 26;
  });
  const treeW = Number(state.width ?? 220);
  el.style.cssText = absPosition(node, treeW, estHeight);
  ctx.applyA11y(node, el);
  ctx.applyUiClasses(node, el);
  ctx.seenIds.add(node.id);
}
