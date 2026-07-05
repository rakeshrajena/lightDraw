import type { Node } from '../Node';
import { syntheticEvent } from '../components/helpers';

export type NativeSyncContext = {
  nodeElements: Map<string, HTMLElement>;
  seenIds: Set<string>;
  focusedNodeId: string | null;
  applyA11y: (node: Node, el: HTMLElement) => void;
  applyUiClasses: (node: Node, el: HTMLElement) => void;
};

function positionStyle(node: Node, width: number, height: number): string {
  return `
    position: absolute;
    left: ${node.x}px;
    top: ${node.y}px;
    width: ${width}px;
    height: ${height}px;
    opacity: ${node.opacity};
    pointer-events: ${node.listening ? 'auto' : 'none'};
  `;
}

function getState(node: Node): Record<string, unknown> {
  return (node.metadata?.componentState ?? {}) as Record<string, unknown>;
}

/** Native <button> — CSS-driven hover/active/focus */
export function syncNativeButton(node: Node, parent: HTMLElement, ctx: NativeSyncContext): void {
  const state = getState(node);
  const label = String(state.label ?? 'Button');
  const width = Number(state.width ?? 128);
  const height = Number(state.height ?? 40);
  const variant = String(state.variant ?? 'primary');
  const size = String(state.size ?? 'md');
  const disabled = Boolean(state.disabled);

  let el = ctx.nodeElements.get(node.id) as HTMLButtonElement | undefined;
  if (!el) {
    el = document.createElement('button');
    el.type = 'button';
    el.id = node.id;
    parent.appendChild(el);
    el.addEventListener('click', (e) => {
      if (getState(node).disabled) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      node.emit('click', syntheticEvent('click', node));
      node.emit('change', syntheticEvent('change', node, { value: label }));
    });
    el.addEventListener('focus', () => node.getApp()?.focusNode(node));
    ctx.nodeElements.set(node.id, el);
  } else if (el.parentElement !== parent) {
    parent.appendChild(el);
  }

  el.className = `lightdraw-btn lightdraw-btn--${variant}${size !== 'md' ? ` lightdraw-btn--${size}` : ''}`;
  el.textContent = label;
  el.disabled = disabled;
  el.style.cssText = positionStyle(node, width, height);
  ctx.applyA11y(node, el);
  ctx.applyUiClasses(node, el);
  ctx.seenIds.add(node.id);
}

/** Native checkbox with custom styled box */
export function syncNativeCheckbox(node: Node, parent: HTMLElement, ctx: NativeSyncContext): void {
  const state = getState(node);
  const label = String(state.label ?? '');
  const checked = Boolean(state.checked);

  let wrap = ctx.nodeElements.get(node.id) as HTMLLabelElement | undefined;
  if (!wrap) {
    wrap = document.createElement('label');
    wrap.id = node.id;
    wrap.className = 'lightdraw-checkbox';
    wrap.innerHTML =
      '<input type="checkbox" class="lightdraw-checkbox-input" /><span class="lightdraw-checkbox-box" aria-hidden="true"></span><span class="lightdraw-checkbox-label"></span>';
    parent.appendChild(wrap);
    const input = wrap.querySelector('input')!;
    input.addEventListener('change', () => {
      const v = input.checked;
      node.metadata.componentState = { ...getState(node), checked: v };
      node.ariaChecked = v;
      node.emit('change', syntheticEvent('change', node, { value: v }));
      node.getApp()?.requestRender();
    });
    input.addEventListener('focus', () => node.getApp()?.focusNode(node));
    ctx.nodeElements.set(node.id, wrap);
  } else if (wrap.parentElement !== parent) {
    parent.appendChild(wrap);
  }

  const input = wrap.querySelector('input') as HTMLInputElement;
  const labelEl = wrap.querySelector('.lightdraw-checkbox-label') as HTMLSpanElement;
  input.checked = checked;
  labelEl.textContent = label;
  wrap.style.cssText = positionStyle(node, Math.max(label.length * 8 + 36, 160), 24);
  ctx.applyA11y(node, wrap);
  ctx.applyUiClasses(node, wrap);
  if (node.focusable) input.tabIndex = node.id === ctx.focusedNodeId ? 0 : -1;
  ctx.seenIds.add(node.id);
}

/** Native text input with optional field label */
export function syncNativeInput(node: Node, parent: HTMLElement, ctx: NativeSyncContext): void {
  const state = getState(node);
  const width = Number(state.width ?? 240);
  const value = String(state.value ?? '');
  const placeholder = String(state.placeholder ?? '');
  const label = String(state.label ?? '');

  let wrap = ctx.nodeElements.get(node.id) as HTMLDivElement | undefined;
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = node.id;
    wrap.className = 'lightdraw-field';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'lightdraw-native-input';
    wrap.appendChild(input);
    parent.appendChild(wrap);
    input.addEventListener('input', () => {
      const v = input.value;
      node.metadata.componentState = { ...getState(node), value: v };
      node.emit('input', syntheticEvent('input', node, { value: v }));
    });
    input.addEventListener('change', () => {
      node.emit('change', syntheticEvent('change', node, { value: input.value }));
    });
    input.addEventListener('focus', () => node.getApp()?.focusNode(node));
    ctx.nodeElements.set(node.id, wrap);
  } else if (wrap.parentElement !== parent) {
    parent.appendChild(wrap);
  }

  const input = wrap.querySelector('input') as HTMLInputElement;
  if (label) {
    let labelEl = wrap.querySelector('.lightdraw-field-label') as HTMLLabelElement | null;
    if (!labelEl) {
      labelEl = document.createElement('label');
      labelEl.className = 'lightdraw-field-label';
      wrap.insertBefore(labelEl, input);
    }
    labelEl.textContent = label;
    labelEl.setAttribute('for', `${node.id}-input`);
    input.id = `${node.id}-input`;
  }
  input.value = value;
  input.placeholder = placeholder;
  const fieldH = label ? 70 : 40;
  wrap.style.cssText = absPosition(node, width, fieldH);
  ctx.applyA11y(node, input);
  ctx.applyUiClasses(node, wrap);
  if (node.focusable) input.tabIndex = node.id === ctx.focusedNodeId ? 0 : -1;
  ctx.seenIds.add(node.id);
}

/** Native textarea with optional field label */
export function syncNativeTextarea(node: Node, parent: HTMLElement, ctx: NativeSyncContext): void {
  const state = getState(node);
  const width = Number(state.width ?? 280);
  const height = Number(state.height ?? 88);
  const value = String(state.value ?? '');
  const placeholder = String(state.placeholder ?? '');
  const label = String(state.label ?? '');

  let wrap = ctx.nodeElements.get(node.id) as HTMLDivElement | undefined;
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = node.id;
    wrap.className = 'lightdraw-field lightdraw-field--textarea';
    const ta = document.createElement('textarea');
    ta.className = 'lightdraw-native-textarea';
    wrap.appendChild(ta);
    parent.appendChild(wrap);
    ta.addEventListener('input', () => {
      node.metadata.componentState = { ...getState(node), value: ta.value };
      node.emit('input', syntheticEvent('input', node, { value: ta.value }));
    });
    ta.addEventListener('change', () => {
      node.emit('change', syntheticEvent('change', node, { value: ta.value }));
    });
    ta.addEventListener('focus', () => node.getApp()?.focusNode(node));
    ctx.nodeElements.set(node.id, wrap);
  } else if (wrap.parentElement !== parent) {
    parent.appendChild(wrap);
  }

  const ta = wrap.querySelector('textarea') as HTMLTextAreaElement;
  if (label) {
    let labelEl = wrap.querySelector('.lightdraw-field-label') as HTMLLabelElement | null;
    if (!labelEl) {
      labelEl = document.createElement('label');
      labelEl.className = 'lightdraw-field-label';
      wrap.insertBefore(labelEl, ta);
    }
    labelEl.textContent = label;
  }
  ta.value = value;
  ta.placeholder = placeholder;
  ta.style.height = `${height}px`;
  const fieldH = label ? height + 30 : height;
  wrap.style.cssText = absPosition(node, width, fieldH);
  ctx.applyA11y(node, ta);
  ctx.applyUiClasses(node, wrap);
  ctx.seenIds.add(node.id);
}

/** Native switch (checkbox + slider CSS) */
export function syncNativeToggle(node: Node, parent: HTMLElement, ctx: NativeSyncContext): void {
  const state = getState(node);
  const on = Boolean(state.value);
  const label = String(state.label ?? '');

  let wrap = ctx.nodeElements.get(node.id) as HTMLLabelElement | undefined;
  if (!wrap) {
    wrap = document.createElement('label');
    wrap.id = node.id;
    wrap.className = 'lightdraw-switch-wrap';
    wrap.innerHTML =
      '<input type="checkbox" class="lightdraw-switch-input" role="switch" /><span class="lightdraw-switch-track" aria-hidden="true"><span class="lightdraw-switch-thumb"></span></span><span class="lightdraw-switch-label"></span>';
    parent.appendChild(wrap);
    const input = wrap.querySelector('input')!;
    input.addEventListener('change', () => {
      const v = input.checked;
      node.metadata.componentState = { ...getState(node), value: v };
      node.ariaChecked = v;
      node.emit('change', syntheticEvent('change', node, { value: v }));
      node.getApp()?.requestRender();
    });
    input.addEventListener('focus', () => node.getApp()?.focusNode(node));
    ctx.nodeElements.set(node.id, wrap);
  } else if (wrap.parentElement !== parent) {
    parent.appendChild(wrap);
  }

  const input = wrap.querySelector('input') as HTMLInputElement;
  const labelEl = wrap.querySelector('.lightdraw-switch-label') as HTMLSpanElement;
  input.checked = on;
  labelEl.textContent = label;
  wrap.style.cssText = absPosition(node, Math.max(label.length * 8 + 80, 160), 28);
  ctx.applyA11y(node, wrap);
  ctx.applyUiClasses(node, wrap);
  ctx.seenIds.add(node.id);
}

/** Native range slider */
export function syncNativeSlider(node: Node, parent: HTMLElement, ctx: NativeSyncContext): void {
  const state = getState(node);
  const width = Number(state.width ?? 200);
  const min = Number(state.min ?? 0);
  const max = Number(state.max ?? 100);
  const value = Number(state.value ?? 50);
  const label = String(state.label ?? '');
  const pct = ((value - min) / Math.max(max - min, 1)) * 100;

  let wrap = ctx.nodeElements.get(node.id) as HTMLDivElement | undefined;
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = node.id;
    wrap.className = 'lightdraw-field lightdraw-field--slider';
    wrap.innerHTML =
      '<div class="lightdraw-field-header"><span class="lightdraw-field-label"></span><span class="lightdraw-field-value"></span></div><input type="range" class="lightdraw-range" />';
    parent.appendChild(wrap);
    const input = wrap.querySelector('input')!;
    input.addEventListener('input', () => {
      const v = Number(input.value);
      node.metadata.componentState = { ...getState(node), value: v };
      node.ariaValueNow = v;
      node.emit('input', syntheticEvent('input', node, { value: v }));
      node.getApp()?.requestRender();
    });
    input.addEventListener('change', () => {
      node.emit('change', syntheticEvent('change', node, { value: Number(input.value) }));
    });
    input.addEventListener('focus', () => node.getApp()?.focusNode(node));
    ctx.nodeElements.set(node.id, wrap);
  } else if (wrap.parentElement !== parent) {
    parent.appendChild(wrap);
  }

  const input = wrap.querySelector('input') as HTMLInputElement;
  const labelEl = wrap.querySelector('.lightdraw-field-label') as HTMLSpanElement;
  const valueEl = wrap.querySelector('.lightdraw-field-value') as HTMLSpanElement;
  labelEl.textContent = label || 'Value';
  valueEl.textContent = String(Math.round(value));
  input.min = String(min);
  input.max = String(max);
  input.value = String(value);
  node.ariaValueNow = value;
  node.ariaValueMin = min;
  node.ariaValueMax = max;
  wrap.style.cssText = `${absPosition(node, width, 52)}--ld-range-pct:${pct}%;`;
  ctx.applyA11y(node, input);
  ctx.applyUiClasses(node, wrap);
  ctx.seenIds.add(node.id);
}

/** Native radio */
export function syncNativeRadio(node: Node, parent: HTMLElement, ctx: NativeSyncContext): void {
  const state = getState(node);
  const label = String(state.label ?? '');
  const selected = Boolean(state.selected);
  const group = String(state.group ?? 'default');

  let wrap = ctx.nodeElements.get(node.id) as HTMLLabelElement | undefined;
  if (!wrap) {
    wrap = document.createElement('label');
    wrap.id = node.id;
    wrap.className = 'lightdraw-radio';
    wrap.innerHTML =
      '<input type="radio" class="lightdraw-radio-input" /><span class="lightdraw-radio-dot" aria-hidden="true"></span><span class="lightdraw-radio-label"></span>';
    parent.appendChild(wrap);
    const input = wrap.querySelector('input')!;
    input.addEventListener('change', () => {
      node.metadata.componentState = { ...getState(node), selected: true };
      node.ariaChecked = true;
      node.emit('change', syntheticEvent('change', node, { value: group, payload: group }));
      node.getApp()?.requestRender();
    });
    input.addEventListener('focus', () => node.getApp()?.focusNode(node));
    ctx.nodeElements.set(node.id, wrap);
  } else if (wrap.parentElement !== parent) {
    parent.appendChild(wrap);
  }

  const input = wrap.querySelector('input') as HTMLInputElement;
  const labelEl = wrap.querySelector('.lightdraw-radio-label') as HTMLSpanElement;
  input.name = group;
  input.checked = selected;
  labelEl.textContent = label;
  wrap.style.cssText = positionStyle(node, Math.max(label.length * 8 + 32, 140), 22);
  ctx.applyA11y(node, wrap);
  ctx.applyUiClasses(node, wrap);
  ctx.seenIds.add(node.id);
}

/** CSS progress bar with optional label and variant */
export function syncNativeProgress(node: Node, parent: HTMLElement, ctx: NativeSyncContext): void {
  const state = getState(node);
  const width = Number(state.width ?? 200);
  const value = Number(state.value ?? 0);
  const label = String(state.label ?? '');
  const variant = String(state.variant ?? 'default');

  let el = ctx.nodeElements.get(node.id) as HTMLDivElement | undefined;
  if (!el) {
    el = document.createElement('div');
    el.id = node.id;
    el.className = 'lightdraw-progress-wrap';
    el.innerHTML =
      '<div class="lightdraw-progress-header"><span class="lightdraw-progress-label"></span><span class="lightdraw-progress-value"></span></div><div class="lightdraw-progress" role="progressbar"><div class="lightdraw-progress-bar"></div></div>';
    parent.appendChild(el);
    ctx.nodeElements.set(node.id, el);
  } else if (el.parentElement !== parent) {
    parent.appendChild(el);
  }

  const track = el.querySelector('.lightdraw-progress') as HTMLDivElement;
  const bar = el.querySelector('.lightdraw-progress-bar') as HTMLDivElement;
  const labelEl = el.querySelector('.lightdraw-progress-label') as HTMLSpanElement;
  const valueEl = el.querySelector('.lightdraw-progress-value') as HTMLSpanElement;

  const pct = Math.max(0, Math.min(100, value));
  bar.style.width = `${pct}%`;
  track.className = `lightdraw-progress${variant !== 'default' ? ` lightdraw-progress--${variant}` : ''}`;

  el.setAttribute('role', 'progressbar');
  el.setAttribute('aria-valuenow', String(pct));
  el.setAttribute('aria-valuemin', '0');
  el.setAttribute('aria-valuemax', '100');

  const header = el.querySelector('.lightdraw-progress-header') as HTMLElement;
  if (label) {
    labelEl.textContent = label;
    valueEl.textContent = `${Math.round(pct)}%`;
    header.style.display = 'flex';
  } else {
    header.style.display = 'none';
  }

  const height = label ? 36 : 8;
  el.style.cssText = positionStyle(node, width, height);
  ctx.applyUiClasses(node, el);
  ctx.seenIds.add(node.id);
}

/** Card shell — semantic HTML, no nested shape divs */
export function syncNativeCard(node: Node, parent: HTMLElement, ctx: NativeSyncContext): void {
  const state = getState(node);
  const width = Number(state.width ?? 280);
  const height = Number(state.height ?? 160);
  const title = state.title as string | undefined;

  let el = ctx.nodeElements.get(node.id) as HTMLDivElement | undefined;
  if (!el) {
    el = document.createElement('div');
    el.id = node.id;
    el.className = 'lightdraw-card';
    parent.appendChild(el);
    ctx.nodeElements.set(node.id, el);
  } else if (el.parentElement !== parent) {
    parent.appendChild(el);
  }

  if (title) {
    el.innerHTML = `<div class="lightdraw-card-header"><span class="lightdraw-card-title">${escHtml(title)}</span></div>`;
  } else {
    el.innerHTML = '';
  }
  el.style.cssText = positionStyle(node, width, height);
  ctx.applyUiClasses(node, el);
  ctx.seenIds.add(node.id);
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatTableCell(cell: string): string {
  const lower = cell.toLowerCase();
  if (lower === 'active' || lower === 'done' || lower === 'success') {
    return `<span class="lightdraw-badge lightdraw-badge--success">${escHtml(cell)}</span>`;
  }
  if (lower === 'beta' || lower === 'pending' || lower === 'warning') {
    return `<span class="lightdraw-badge lightdraw-badge--warning">${escHtml(cell)}</span>`;
  }
  if (lower === 'error' || lower === 'failed' || lower === 'inactive') {
    return `<span class="lightdraw-badge lightdraw-badge--danger">${escHtml(cell)}</span>`;
  }
  return escHtml(cell);
}

function absPosition(node: Node, width?: number | string, height?: number | string): string {
  const w = width !== undefined ? `width: ${typeof width === 'number' ? `${width}px` : width};` : '';
  const h = height !== undefined ? `height: ${typeof height === 'number' ? `${height}px` : height};` : '';
  return `
    position: absolute;
    left: ${node.x}px;
    top: ${node.y}px;
    ${w}
    ${h}
    opacity: ${node.opacity};
    pointer-events: ${node.listening ? 'auto' : 'none'};
  `;
}

function bindDelegated(el: HTMLElement, handler: (e: Event) => void): void {
  if (el.dataset.ldDelegated === '1') return;
  el.dataset.ldDelegated = '1';
  el.addEventListener('click', handler);
}

/** Tab strip with underline active indicator */
export function syncNativeTabs(node: Node, parent: HTMLElement, ctx: NativeSyncContext): void {
  const state = getState(node);
  const labels = (state.tabs as string[]) ?? ['Tab 1', 'Tab 2'];
  const activeTab = Number(state.activeTab ?? 0);
  const width = Number(state.width ?? 300);

  let el = ctx.nodeElements.get(node.id) as HTMLDivElement | undefined;
  if (!el) {
    el = document.createElement('div');
    el.id = node.id;
    el.className = 'lightdraw-tabs';
    el.setAttribute('role', 'tablist');
    parent.appendChild(el);
    bindDelegated(el, (e) => {
      const btn = (e.target as HTMLElement).closest('.lightdraw-tabs-tab');
      if (!btn) return;
      const i = Number(btn.getAttribute('data-index'));
      const tabs = (getState(node).tabs as string[]) ?? [];
      node.metadata.componentState = { ...getState(node), activeTab: i };
      node.emit('change', syntheticEvent('change', node, { value: i, tab: tabs[i] }));
      node.getApp()?.requestRender();
    });
    ctx.nodeElements.set(node.id, el);
  } else if (el.parentElement !== parent) {
    parent.appendChild(el);
  }

  el.innerHTML = labels
    .map(
      (label, i) =>
        `<button type="button" class="lightdraw-tabs-tab${i === activeTab ? ' lightdraw-tabs-tab--active' : ''}" role="tab" aria-selected="${i === activeTab}" data-index="${i}">${escHtml(label)}</button>`
    )
    .join('');

  el.style.cssText = absPosition(node, width, 40);
  ctx.applyA11y(node, el);
  ctx.applyUiClasses(node, el);
  ctx.seenIds.add(node.id);
}

/** Collapsible sections */
export function syncNativeAccordion(node: Node, parent: HTMLElement, ctx: NativeSyncContext): void {
  const state = getState(node);
  const sections = (state.sections as { title: string; content: string }[]) ?? [
    { title: 'Section 1', content: 'Content 1' },
    { title: 'Section 2', content: 'Content 2' },
  ];
  const expandedIndex = Number(state.expandedIndex ?? 0);
  const width = Number(state.width ?? 280);

  let el = ctx.nodeElements.get(node.id) as HTMLDivElement | undefined;
  if (!el) {
    el = document.createElement('div');
    el.id = node.id;
    el.className = 'lightdraw-accordion';
    parent.appendChild(el);
    bindDelegated(el, (e) => {
      const btn = (e.target as HTMLElement).closest('.lightdraw-accordion-trigger');
      if (!btn) return;
      const i = Number(btn.getAttribute('data-index'));
      const secs = (getState(node).sections as { title: string; content: string }[]) ?? [];
      node.metadata.componentState = { ...getState(node), expandedIndex: i };
      node.emit('change', syntheticEvent('change', node, { value: i, section: secs[i]?.title }));
      node.getApp()?.requestRender();
    });
    ctx.nodeElements.set(node.id, el);
  } else if (el.parentElement !== parent) {
    parent.appendChild(el);
  }

  el.innerHTML = sections
    .map((sec, i) => {
      const open = i === expandedIndex;
      return `<div class="lightdraw-accordion-item${open ? ' lightdraw-accordion-item--open' : ''}">
        <button type="button" class="lightdraw-accordion-trigger" aria-expanded="${open}" data-index="${i}">
          <span class="lightdraw-accordion-chevron" aria-hidden="true"></span>
          <span>${escHtml(sec.title)}</span>
        </button>
        <div class="lightdraw-accordion-panel" ${open ? '' : 'hidden'}>${escHtml(sec.content)}</div>
      </div>`;
    })
    .join('');

  const estHeight = sections.length * 44 + (expandedIndex >= 0 ? 36 : 0);
  el.style.cssText = absPosition(node, width, estHeight);
  ctx.applyA11y(node, el);
  ctx.applyUiClasses(node, el);
  ctx.seenIds.add(node.id);
}

/** Data table with striped rows */
export function syncNativeTable(node: Node, parent: HTMLElement, ctx: NativeSyncContext): void {
  const state = getState(node);
  const columns = (state.columns as string[]) ?? ['Name', 'Value'];
  const rows = (state.rows as string[][]) ?? [['A', '1']];
  const selectedRow = Number(state.selectedRow ?? -1);
  const colW = Number(state.colWidth ?? 100);
  const tableW = colW * columns.length;

  let el = ctx.nodeElements.get(node.id) as HTMLDivElement | undefined;
  if (!el) {
    el = document.createElement('div');
    el.id = node.id;
    el.className = 'lightdraw-table-wrap';
    el.setAttribute('role', 'grid');
    parent.appendChild(el);
    bindDelegated(el, (e) => {
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

  const head = columns.map((c) => `<th scope="col">${escHtml(c)}</th>`).join('');
  const body = rows
    .map(
      (row, ri) =>
        `<tr class="lightdraw-table-row${ri === selectedRow ? ' lightdraw-table-row--selected' : ''}" data-index="${ri}">${row.map((cell) => `<td>${formatTableCell(cell)}</td>`).join('')}</tr>`
    )
    .join('');

  el.innerHTML = `<table class="lightdraw-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;

  const tableH = 36 * (rows.length + 1);
  el.style.cssText = absPosition(node, tableW, tableH);
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

  let el = ctx.nodeElements.get(node.id) as HTMLUListElement | undefined;
  if (!el) {
    el = document.createElement('ul');
    el.id = node.id;
    el.className = 'lightdraw-tree';
    el.setAttribute('role', 'tree');
    parent.appendChild(el);
    bindDelegated(el, (e) => {
      const btn = (e.target as HTMLElement).closest('.lightdraw-tree-toggle');
      if (!btn) return;
      const i = Number(btn.getAttribute('data-index'));
      const st = getState(node);
      const next = new Set<number>((st.expanded as number[]) ?? [0]);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      node.metadata.componentState = { ...st, expanded: Array.from(next) };
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
      const kids =
        isOpen && n.children?.length
          ? `<ul class="lightdraw-tree-children" role="group">${n.children.map((c) => `<li class="lightdraw-tree-leaf" role="treeitem">${escHtml(c.label)}</li>`).join('')}</ul>`
          : '';
      return `<li class="lightdraw-tree-node" role="treeitem" aria-expanded="${isOpen}">
        <button type="button" class="lightdraw-tree-toggle" data-index="${i}" aria-label="Toggle ${escHtml(n.label)}">
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
  el.style.cssText = absPosition(node, 220, estHeight);
  ctx.applyA11y(node, el);
  ctx.applyUiClasses(node, el);
  ctx.seenIds.add(node.id);
}

/** Segmented toolbar */
export function syncNativeToolbar(node: Node, parent: HTMLElement, ctx: NativeSyncContext): void {
  const state = getState(node);
  const buttons = (state.buttons as string[]) ?? ['New', 'Open', 'Save'];

  let el = ctx.nodeElements.get(node.id) as HTMLDivElement | undefined;
  if (!el) {
    el = document.createElement('div');
    el.id = node.id;
    el.className = 'lightdraw-toolbar';
    el.setAttribute('role', 'toolbar');
    parent.appendChild(el);
    bindDelegated(el, (e) => {
      const btn = (e.target as HTMLElement).closest('.lightdraw-toolbar-btn');
      if (!btn) return;
      const buttons = (getState(node).buttons as string[]) ?? [];
      const idx = Array.from(el!.querySelectorAll('.lightdraw-toolbar-btn')).indexOf(btn);
      if (idx >= 0) {
        node.emit('select', syntheticEvent('select', node, { item: buttons[idx] }));
      }
    });
    ctx.nodeElements.set(node.id, el);
  } else if (el.parentElement !== parent) {
    parent.appendChild(el);
  }

  el.innerHTML = buttons
    .map((label) => `<button type="button" class="lightdraw-toolbar-btn">${escHtml(label)}</button>`)
    .join('');

  el.style.cssText = absPosition(node, 'auto', 36);
  ctx.applyA11y(node, el);
  ctx.applyUiClasses(node, el);
  ctx.seenIds.add(node.id);
}

/** Floating toast notification */
export function syncNativeToast(node: Node, parent: HTMLElement, ctx: NativeSyncContext): void {
  const state = getState(node);
  const message = String(state.message ?? 'Notification');
  const variant = String(state.variant ?? 'success');
  const icons: Record<string, string> = {
    success: '✓',
    error: '✕',
    warning: '!',
    info: 'i',
  };

  let el = ctx.nodeElements.get(node.id) as HTMLDivElement | undefined;
  if (!el) {
    el = document.createElement('div');
    el.id = node.id;
    el.className = 'lightdraw-toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    parent.appendChild(el);
    ctx.nodeElements.set(node.id, el);
  } else if (el.parentElement !== parent) {
    parent.appendChild(el);
  }

  if (!node.visible) {
    el.style.display = 'none';
  } else {
    el.style.display = 'flex';
    el.className = `lightdraw-toast lightdraw-toast--${variant}`;
    el.innerHTML = `<span class="lightdraw-toast-icon" aria-hidden="true">${icons[variant] ?? icons.success}</span><span class="lightdraw-toast-message">${escHtml(message)}</span>`;
  }

  const base = absPosition(node, 'auto', 44);
  el.style.cssText = base + (node.visible ? 'display:flex;' : 'display:none;');
  ctx.applyUiClasses(node, el);
  ctx.seenIds.add(node.id);
}

/** Dropdown menu panel */
export function syncNativeMenu(node: Node, parent: HTMLElement, ctx: NativeSyncContext): void {
  const state = getState(node);
  const items = (state.items as string[]) ?? ['Item 1', 'Item 2'];
  const triggerLabel = String(state.triggerLabel ?? 'Actions');
  const open = Boolean(state.open) && node.visible;
  const width = Number(state.width ?? 180);

  let el = ctx.nodeElements.get(node.id) as HTMLDivElement | undefined;
  if (!el) {
    el = document.createElement('div');
    el.id = node.id;
    el.className = 'lightdraw-menu';
    el.setAttribute('role', 'menu');
    parent.appendChild(el);
    bindDelegated(el, (e) => {
      const st = getState(node);
      const menuItems = (st.items as string[]) ?? [];
      const isOpen = Boolean(st.open) && node.visible;
      const itemBtn = (e.target as HTMLElement).closest('.lightdraw-menu-item');
      if (itemBtn) {
        e.stopPropagation();
        const i = Number(itemBtn.getAttribute('data-index'));
        node.metadata.componentState = { ...st, open: false, selectedIndex: i };
        node.visible = false;
        node.emit('select', syntheticEvent('select', node, { index: i, item: menuItems[i] }));
        node.getApp()?.requestRender();
        return;
      }
      if (!isOpen && (e.target as HTMLElement).closest('.lightdraw-menu-trigger')) {
        node.visible = true;
        node.metadata.componentState = { ...st, open: true };
        node.emit('open', syntheticEvent('open', node));
        node.getApp()?.requestRender();
      }
    });
    ctx.nodeElements.set(node.id, el);
  } else if (el.parentElement !== parent) {
    parent.appendChild(el);
  }

  if (open) {
    el.innerHTML = items
      .map(
        (item, i) =>
          `<button type="button" class="lightdraw-menu-item${item.toLowerCase() === 'delete' ? ' lightdraw-menu-item--danger' : ''}" role="menuitem" data-index="${i}">${escHtml(item)}</button>`
      )
      .join('');
    el.classList.add('lightdraw-menu--open');
  } else {
    el.innerHTML = `<button type="button" class="lightdraw-menu-trigger">${escHtml(triggerLabel)} <span aria-hidden="true">▾</span></button>`;
    el.classList.remove('lightdraw-menu--open');
  }

  const height = open ? items.length * 36 + 8 : 36;
  el.style.cssText = absPosition(node, width, height);
  ctx.applyA11y(node, el);
  ctx.applyUiClasses(node, el);
  ctx.seenIds.add(node.id);
}

/** Modal dialog with overlay */
export function syncNativeDialog(node: Node, parent: HTMLElement, ctx: NativeSyncContext): void {
  const state = getState(node);
  const open = Boolean(state.open) && node.visible;
  const title = String(state.title ?? 'Dialog');
  const message = String(state.message ?? 'Are you sure you want to continue?');
  const width = Number(state.width ?? 320);
  const overlayW = Number(state.overlayWidth ?? 800);
  const overlayH = Number(state.overlayHeight ?? 600);

  let el = ctx.nodeElements.get(node.id) as HTMLDivElement | undefined;
  if (!el) {
    el = document.createElement('div');
    el.id = node.id;
    el.className = 'lightdraw-dialog-host';
    parent.appendChild(el);
    bindDelegated(el, (e) => {
      const st = getState(node);
      const isOpen = Boolean(st.open) && node.visible;
      const close = () => {
        node.metadata.componentState = { ...getState(node), open: false };
        node.visible = false;
        node.emit('close', syntheticEvent('close', node));
        node.getApp()?.requestRender();
      };
      if (isOpen) {
        if ((e.target as HTMLElement).classList.contains('lightdraw-dialog-overlay')) {
          close();
        } else if ((e.target as HTMLElement).closest('.lightdraw-dialog-close, .lightdraw-dialog-cancel')) {
          close();
        } else if ((e.target as HTMLElement).closest('.lightdraw-dialog-confirm')) {
          node.emit('change', syntheticEvent('change', node, { value: true }));
          close();
        }
      } else if ((e.target as HTMLElement).closest('.lightdraw-dialog-open')) {
        node.metadata.componentState = { ...getState(node), open: true };
        node.visible = true;
        node.emit('open', syntheticEvent('open', node));
        node.getApp()?.requestRender();
      }
    });
    ctx.nodeElements.set(node.id, el);
  } else if (el.parentElement !== parent) {
    parent.appendChild(el);
  }

  if (open) {
    el.innerHTML = `<div class="lightdraw-dialog-overlay" style="left:${-node.x}px;top:${-node.y}px;width:${overlayW}px;height:${overlayH}px" role="presentation"></div>
      <div class="lightdraw-dialog" role="dialog" aria-modal="true" aria-labelledby="${node.id}-title">
        <div class="lightdraw-dialog-header">
          <h2 class="lightdraw-dialog-title" id="${node.id}-title">${escHtml(title)}</h2>
          <button type="button" class="lightdraw-dialog-close" aria-label="Close">×</button>
        </div>
        <p class="lightdraw-dialog-body">${escHtml(message)}</p>
        <div class="lightdraw-dialog-footer">
          <button type="button" class="lightdraw-btn lightdraw-btn--ghost lightdraw-dialog-cancel">Cancel</button>
          <button type="button" class="lightdraw-btn lightdraw-btn--primary lightdraw-dialog-confirm">Confirm</button>
        </div>
      </div>`;
  } else {
    el.innerHTML = `<button type="button" class="lightdraw-btn lightdraw-btn--secondary lightdraw-dialog-open">Open dialog</button>`;
  }

  el.style.cssText = absPosition(node, open ? overlayW : width, open ? overlayH : 40);
  ctx.applyA11y(node, el);
  ctx.applyUiClasses(node, el);
  ctx.seenIds.add(node.id);
}

/** Tooltip pill */
export function syncNativeTooltip(node: Node, parent: HTMLElement, ctx: NativeSyncContext): void {
  const state = getState(node);
  const text = String(state.text ?? 'Tooltip');

  let el = ctx.nodeElements.get(node.id) as HTMLDivElement | undefined;
  if (!el) {
    el = document.createElement('div');
    el.id = node.id;
    el.className = 'lightdraw-tooltip';
    parent.appendChild(el);
    el.addEventListener('mouseenter', () => {
      node.visible = true;
      node.emit('open', syntheticEvent('open', node));
      node.getApp()?.requestRender();
    });
    el.addEventListener('mouseleave', () => {
      node.visible = false;
      node.emit('close', syntheticEvent('close', node));
      node.getApp()?.requestRender();
    });
    ctx.nodeElements.set(node.id, el);
  } else if (el.parentElement !== parent) {
    parent.appendChild(el);
  }

  el.innerHTML = `<span class="lightdraw-tooltip-anchor">Hover me</span>`;
  if (node.visible) {
    el.innerHTML += `<span class="lightdraw-tooltip-bubble" role="tooltip">${escHtml(text)}</span>`;
  }

  el.style.cssText = absPosition(node, 'auto', 'auto');
  ctx.applyA11y(node, el);
  ctx.applyUiClasses(node, el);
  ctx.seenIds.add(node.id);
}

/** Editor-style status bar */
export function syncNativeStatusBar(node: Node, parent: HTMLElement, ctx: NativeSyncContext): void {
  const state = getState(node);
  const segments = (state.segments as string[]) ?? ['Ready'];
  const width = Number(state.width ?? 400);

  let el = ctx.nodeElements.get(node.id) as HTMLDivElement | undefined;
  if (!el) {
    el = document.createElement('div');
    el.id = node.id;
    el.className = 'lightdraw-statusbar';
    el.setAttribute('role', 'status');
    parent.appendChild(el);
    ctx.nodeElements.set(node.id, el);
  } else if (el.parentElement !== parent) {
    parent.appendChild(el);
  }

  el.innerHTML = segments
    .map(
      (s, i) =>
        `<span class="lightdraw-statusbar-segment${i === 0 ? ' lightdraw-statusbar-segment--primary' : ''}">${escHtml(s)}</span>`
    )
    .join('');
  el.style.cssText = absPosition(node, width, 28);
  ctx.applyA11y(node, el);
  ctx.applyUiClasses(node, el);
  ctx.seenIds.add(node.id);
}

export const NATIVE_HTML_COMPONENTS = new Set([
  'button',
  'checkbox',
  'toggle',
  'slider',
  'radio',
  'progressBar',
  'card',
  'tabs',
  'accordion',
  'table',
  'tree',
  'toolbar',
  'toast',
  'menu',
  'dialog',
  'tooltip',
  'statusBar',
]);
