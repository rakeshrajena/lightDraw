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

type FormModifiers = {
  size?: string;
  disabled?: boolean;
  invalid?: boolean;
  fullWidth?: boolean;
  error?: string;
};

function modifierClasses(base: string, mods: FormModifiers, extra = ''): string {
  const bases = base.split(' ').filter(Boolean);
  const root = bases[0] ?? base;
  const parts = [...bases];
  if (mods.size && mods.size !== 'md') parts.push(`${root}--${mods.size}`);
  if (mods.invalid) parts.push(`${root}--invalid`);
  if (mods.disabled) parts.push(`${root}--disabled`);
  if (mods.fullWidth) parts.push(`${root}--full`);
  if (extra) parts.push(extra);
  return parts.filter(Boolean).join(' ');
}

function fieldWidth(state: Record<string, unknown>, fallback: number): number | string {
  if (state.fullWidth) return '100%';
  return Number(state.width ?? fallback);
}

function syncFieldError(wrap: HTMLElement, error?: string): void {
  let errEl = wrap.querySelector('.lightdraw-field-error') as HTMLSpanElement | null;
  if (error) {
    if (!errEl) {
      errEl = document.createElement('span');
      errEl.className = 'lightdraw-field-error';
      errEl.setAttribute('role', 'alert');
      wrap.appendChild(errEl);
    }
    errEl.textContent = error;
  } else if (errEl) {
    errEl.remove();
  }
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
  el.setAttribute('aria-disabled', disabled ? 'true' : 'false');
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
  const disabled = Boolean(state.disabled);
  const size = String(state.size ?? 'md');
  const mods: FormModifiers = { size, disabled };

  let wrap = ctx.nodeElements.get(node.id) as HTMLLabelElement | undefined;
  if (!wrap) {
    wrap = document.createElement('label');
    wrap.id = node.id;
    wrap.innerHTML =
      '<input type="checkbox" class="lightdraw-checkbox-input" /><span class="lightdraw-checkbox-box" aria-hidden="true"></span><span class="lightdraw-checkbox-label"></span>';
    parent.appendChild(wrap);
    const input = wrap.querySelector('input')!;
    input.addEventListener('change', () => {
      if (getState(node).disabled) return;
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

  wrap.className = modifierClasses('lightdraw-checkbox', mods);
  const input = wrap.querySelector('input') as HTMLInputElement;
  const labelEl = wrap.querySelector('.lightdraw-checkbox-label') as HTMLSpanElement;
  input.checked = checked;
  input.disabled = disabled;
  labelEl.textContent = label;
  wrap.style.cssText = positionStyle(node, Math.max(label.length * 8 + 36, 160), 24);
  ctx.applyA11y(node, wrap);
  ctx.applyUiClasses(node, wrap);
  if (node.focusable && !disabled) input.tabIndex = node.id === ctx.focusedNodeId ? 0 : -1;
  else input.removeAttribute('tabindex');
  ctx.seenIds.add(node.id);
}

/** Native text input with optional field label */
export function syncNativeInput(node: Node, parent: HTMLElement, ctx: NativeSyncContext): void {
  const state = getState(node);
  const width = fieldWidth(state, 240);
  const value = String(state.value ?? '');
  const placeholder = String(state.placeholder ?? '');
  const label = String(state.label ?? '');
  const disabled = Boolean(state.disabled);
  const invalid = Boolean(state.invalid);
  const size = String(state.size ?? 'md');
  const error = state.error ? String(state.error) : '';
  const mods: FormModifiers = { size, disabled, invalid, fullWidth: Boolean(state.fullWidth), error };

  let wrap = ctx.nodeElements.get(node.id) as HTMLDivElement | undefined;
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = node.id;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'lightdraw-native-input';
    wrap.appendChild(input);
    parent.appendChild(wrap);
    input.addEventListener('input', () => {
      if (getState(node).disabled) return;
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

  wrap.className = modifierClasses('lightdraw-field', mods);
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
  input.disabled = disabled;
  input.setAttribute('aria-invalid', invalid ? 'true' : 'false');
  syncFieldError(wrap, error || (invalid ? 'Invalid value' : ''));
  const fieldH = label ? (error || invalid ? 88 : 70) : 40;
  wrap.style.cssText = absPosition(node, width, fieldH);
  ctx.applyA11y(node, input);
  ctx.applyUiClasses(node, wrap);
  if (node.focusable && !disabled) input.tabIndex = node.id === ctx.focusedNodeId ? 0 : -1;
  else input.removeAttribute('tabindex');
  ctx.seenIds.add(node.id);
}

/** Native textarea with optional field label */
export function syncNativeTextarea(node: Node, parent: HTMLElement, ctx: NativeSyncContext): void {
  const state = getState(node);
  const width = fieldWidth(state, 280);
  const height = Number(state.height ?? 88);
  const value = String(state.value ?? '');
  const placeholder = String(state.placeholder ?? '');
  const label = String(state.label ?? '');
  const disabled = Boolean(state.disabled);
  const invalid = Boolean(state.invalid);
  const size = String(state.size ?? 'md');
  const error = state.error ? String(state.error) : '';
  const mods: FormModifiers = { size, disabled, invalid, fullWidth: Boolean(state.fullWidth), error };

  let wrap = ctx.nodeElements.get(node.id) as HTMLDivElement | undefined;
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = node.id;
    const ta = document.createElement('textarea');
    ta.className = 'lightdraw-native-textarea';
    wrap.appendChild(ta);
    parent.appendChild(wrap);
    ta.addEventListener('input', () => {
      if (getState(node).disabled) return;
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

  wrap.className = modifierClasses('lightdraw-field lightdraw-field--textarea', mods);
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
  ta.disabled = disabled;
  ta.setAttribute('aria-invalid', invalid ? 'true' : 'false');
  syncFieldError(wrap, error || (invalid ? 'Invalid value' : ''));
  ta.style.height = `${height}px`;
  const errExtra = error || invalid ? 22 : 0;
  const fieldH = label ? height + 30 + errExtra : height + errExtra;
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
  const disabled = Boolean(state.disabled);
  const size = String(state.size ?? 'md');
  const mods: FormModifiers = { size, disabled };

  let wrap = ctx.nodeElements.get(node.id) as HTMLLabelElement | undefined;
  if (!wrap) {
    wrap = document.createElement('label');
    wrap.id = node.id;
    wrap.innerHTML =
      '<input type="checkbox" class="lightdraw-switch-input" role="switch" /><span class="lightdraw-switch-track" aria-hidden="true"><span class="lightdraw-switch-thumb"></span></span><span class="lightdraw-switch-label"></span>';
    parent.appendChild(wrap);
    const input = wrap.querySelector('input')!;
    input.addEventListener('change', () => {
      if (getState(node).disabled) return;
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

  wrap.className = modifierClasses('lightdraw-switch-wrap', mods);
  const input = wrap.querySelector('input') as HTMLInputElement;
  const labelEl = wrap.querySelector('.lightdraw-switch-label') as HTMLSpanElement;
  input.checked = on;
  input.disabled = disabled;
  labelEl.textContent = label;
  wrap.style.cssText = absPosition(node, Math.max(label.length * 8 + 80, 160), 28);
  ctx.applyA11y(node, wrap);
  ctx.applyUiClasses(node, wrap);
  ctx.seenIds.add(node.id);
}

/** Native range slider */
export function syncNativeSlider(node: Node, parent: HTMLElement, ctx: NativeSyncContext): void {
  const state = getState(node);
  const width = fieldWidth(state, 200);
  const min = Number(state.min ?? 0);
  const max = Number(state.max ?? 100);
  const value = Number(state.value ?? 50);
  const label = String(state.label ?? '');
  const disabled = Boolean(state.disabled);
  const size = String(state.size ?? 'md');
  const pct = ((value - min) / Math.max(max - min, 1)) * 100;
  const mods: FormModifiers = { size, disabled };

  let wrap = ctx.nodeElements.get(node.id) as HTMLDivElement | undefined;
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = node.id;
    wrap.innerHTML =
      '<div class="lightdraw-field-header"><span class="lightdraw-field-label"></span><span class="lightdraw-field-value"></span></div><input type="range" class="lightdraw-range" />';
    parent.appendChild(wrap);
    const input = wrap.querySelector('input')!;
    input.addEventListener('input', () => {
      if (getState(node).disabled) return;
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

  wrap.className = modifierClasses('lightdraw-field lightdraw-field--slider', mods);
  const input = wrap.querySelector('input') as HTMLInputElement;
  const labelEl = wrap.querySelector('.lightdraw-field-label') as HTMLSpanElement;
  const valueEl = wrap.querySelector('.lightdraw-field-value') as HTMLSpanElement;
  labelEl.textContent = label || 'Value';
  valueEl.textContent = String(Math.round(value));
  input.min = String(min);
  input.max = String(max);
  input.value = String(value);
  input.disabled = disabled;
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
  const disabled = Boolean(state.disabled);
  const size = String(state.size ?? 'md');
  const mods: FormModifiers = { size, disabled };

  let wrap = ctx.nodeElements.get(node.id) as HTMLLabelElement | undefined;
  if (!wrap) {
    wrap = document.createElement('label');
    wrap.id = node.id;
    wrap.innerHTML =
      '<input type="radio" class="lightdraw-radio-input" /><span class="lightdraw-radio-dot" aria-hidden="true"></span><span class="lightdraw-radio-label"></span>';
    parent.appendChild(wrap);
    const input = wrap.querySelector('input')!;
    input.addEventListener('change', () => {
      if (getState(node).disabled) return;
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

  wrap.className = modifierClasses('lightdraw-radio', mods);
  const input = wrap.querySelector('input') as HTMLInputElement;
  const labelEl = wrap.querySelector('.lightdraw-radio-label') as HTMLSpanElement;
  input.name = group;
  input.checked = selected;
  input.disabled = disabled;
  labelEl.textContent = label;
  wrap.style.cssText = positionStyle(node, Math.max(label.length * 8 + 32, 140), 22);
  ctx.applyA11y(node, wrap);
  ctx.applyUiClasses(node, wrap);
  ctx.seenIds.add(node.id);
}

/** CSS progress bar with optional label and variant */
export function syncNativeProgress(node: Node, parent: HTMLElement, ctx: NativeSyncContext): void {
  const state = getState(node);
  const width = fieldWidth(state, 200);
  const value = Number(state.value ?? 0);
  const label = String(state.label ?? '');
  const variant = String(state.variant ?? 'default');
  const size = String(state.size ?? 'md');
  const disabled = Boolean(state.disabled);
  const mods: FormModifiers = { size, disabled };

  let el = ctx.nodeElements.get(node.id) as HTMLDivElement | undefined;
  if (!el) {
    el = document.createElement('div');
    el.id = node.id;
    el.innerHTML =
      '<div class="lightdraw-progress-header"><span class="lightdraw-progress-label"></span><span class="lightdraw-progress-value"></span></div><div class="lightdraw-progress" role="progressbar"><div class="lightdraw-progress-bar"></div></div>';
    parent.appendChild(el);
    ctx.nodeElements.set(node.id, el);
  } else if (el.parentElement !== parent) {
    parent.appendChild(el);
  }

  el.className = modifierClasses('lightdraw-progress-wrap', mods);
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
  if (disabled) el.setAttribute('aria-disabled', 'true');
  else el.removeAttribute('aria-disabled');

  const header = el.querySelector('.lightdraw-progress-header') as HTMLElement;
  if (label) {
    labelEl.textContent = label;
    valueEl.textContent = `${Math.round(pct)}%`;
    header.style.display = 'flex';
  } else {
    header.style.display = 'none';
  }

  const height = label ? 36 : 8;
  el.style.cssText = absPosition(node, width, height);
  ctx.applyUiClasses(node, el);
  ctx.seenIds.add(node.id);
}

/** Card shell — header band, subtitle, optional actions */
export function syncNativeCard(node: Node, parent: HTMLElement, ctx: NativeSyncContext): void {
  const state = getState(node);
  const width = Number(state.width ?? 280);
  const height = Number(state.height ?? 160);
  const title = state.title as string | undefined;
  const subtitle = state.subtitle ? String(state.subtitle) : '';
  const actions = (state.actions as string[]) ?? [];
  const elevated = state.elevated !== false;

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

  el.className = `lightdraw-card${elevated ? ' lightdraw-card--elevated' : ''}`;

  let headerHtml = '';
  if (title || subtitle || actions.length) {
    const actionsHtml = actions
      .map((a) => `<button type="button" class="lightdraw-card-action">${escHtml(a)}</button>`)
      .join('');
    headerHtml = `<div class="lightdraw-card-header">
      <div class="lightdraw-card-header-text">
        ${title ? `<span class="lightdraw-card-title">${escHtml(String(title))}</span>` : ''}
        ${subtitle ? `<span class="lightdraw-card-subtitle">${escHtml(subtitle)}</span>` : ''}
      </div>
      ${actions.length ? `<div class="lightdraw-card-actions">${actionsHtml}</div>` : ''}
    </div>`;
  }
  el.innerHTML = `${headerHtml}<div class="lightdraw-card-body" aria-hidden="true"></div>`;
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

function sortTableRows(rows: string[][], col: number, dir: 'asc' | 'desc'): string[][] {
  return [...rows].sort((a, b) => {
    const av = a[col] ?? '';
    const bv = b[col] ?? '';
    const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' });
    return dir === 'asc' ? cmp : -cmp;
  });
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

const dialogTrapHandlers = new WeakMap<HTMLElement, (e: KeyboardEvent) => void>();
const menuOutsideHandlers = new WeakMap<HTMLElement, (e: MouseEvent) => void>();
const tooltipDelayTimers = new Map<string, number>();

function trapDialogFocus(host: HTMLElement): void {
  const dialog = host.querySelector('.lightdraw-dialog');
  if (!dialog) return;
  const focusable = dialog.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusable.length === 0) return;
  focusable[0].focus();
  const existing = dialogTrapHandlers.get(host);
  if (existing) host.removeEventListener('keydown', existing);
  const handler = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const list = Array.from(focusable);
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  dialogTrapHandlers.set(host, handler);
  host.addEventListener('keydown', handler);
}

function releaseDialogFocus(host: HTMLElement): void {
  const existing = dialogTrapHandlers.get(host);
  if (existing) {
    host.removeEventListener('keydown', existing);
    dialogTrapHandlers.delete(host);
  }
}

function bindMenuOutsideClose(el: HTMLElement, node: Node): void {
  const existing = menuOutsideHandlers.get(el);
  if (existing) document.removeEventListener('mousedown', existing);
  const handler = (e: MouseEvent) => {
    const target = e.target;
    if (target instanceof globalThis.Node && el.contains(target)) return;
    node.metadata.componentState = { ...getState(node), open: false };
    node.visible = false;
    node.emit('close', syntheticEvent('close', node));
    node.getApp()?.requestRender();
    document.removeEventListener('mousedown', handler);
    menuOutsideHandlers.delete(el);
  };
  menuOutsideHandlers.set(el, handler);
  setTimeout(() => document.addEventListener('mousedown', handler), 0);
}

function isDangerMenuItem(item: string, variants: string[] | undefined, index: number): boolean {
  if (variants?.[index] === 'danger') return true;
  const lower = item.toLowerCase();
  return lower === 'delete' || lower === 'remove' || lower === 'danger';
}

function scheduleTooltipShow(node: Node, delayMs: number, show: () => void): void {
  const prev = tooltipDelayTimers.get(node.id);
  if (prev !== undefined) clearTimeout(prev);
  if (delayMs <= 0) {
    show();
    return;
  }
  const id = window.setTimeout(show, delayMs);
  tooltipDelayTimers.set(node.id, id);
}

function cancelTooltipShow(nodeId: string): void {
  const prev = tooltipDelayTimers.get(nodeId);
  if (prev !== undefined) {
    clearTimeout(prev);
    tooltipDelayTimers.delete(nodeId);
  }
}

/** Tab strip with sliding underline indicator */
export function syncNativeTabs(node: Node, parent: HTMLElement, ctx: NativeSyncContext): void {
  const state = getState(node);
  const labels = (state.tabs as string[]) ?? ['Tab 1', 'Tab 2'];
  const activeTab = Number(state.activeTab ?? 0);
  const width = Number(state.width ?? 300);
  const tabPct = 100 / Math.max(labels.length, 1);

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
    el.addEventListener('keydown', (e) => {
      const key = e.key;
      if (key !== 'ArrowLeft' && key !== 'ArrowRight' && key !== 'Home' && key !== 'End') return;
      e.preventDefault();
      const tabs = (getState(node).tabs as string[]) ?? [];
      const cur = Number(getState(node).activeTab ?? 0);
      let next = cur;
      if (key === 'ArrowLeft') next = Math.max(0, cur - 1);
      if (key === 'ArrowRight') next = Math.min(tabs.length - 1, cur + 1);
      if (key === 'Home') next = 0;
      if (key === 'End') next = tabs.length - 1;
      node.metadata.componentState = { ...getState(node), activeTab: next };
      node.emit('change', syntheticEvent('change', node, { value: next, tab: tabs[next] }));
      node.getApp()?.requestRender();
    });
    ctx.nodeElements.set(node.id, el);
  } else if (el.parentElement !== parent) {
    parent.appendChild(el);
  }

  const tabsHtml = labels
    .map(
      (label, i) =>
        `<button type="button" class="lightdraw-tabs-tab${i === activeTab ? ' lightdraw-tabs-tab--active' : ''}" role="tab" aria-selected="${i === activeTab}" tabindex="${i === activeTab ? 0 : -1}" data-index="${i}">${escHtml(label)}</button>`
    )
    .join('');

  el.innerHTML = `<div class="lightdraw-tabs-inner">${tabsHtml}<span class="lightdraw-tabs-indicator" style="width:${tabPct}%;left:${activeTab * tabPct}%"></span></div>`;

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
      const cur = Number(getState(node).expandedIndex ?? 0);
      const next = cur === i ? -1 : i;
      node.metadata.componentState = { ...getState(node), expandedIndex: next };
      node.emit('change', syntheticEvent('change', node, { value: next, section: secs[i]?.title }));
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
        <div class="lightdraw-accordion-panel-wrap">
          <div class="lightdraw-accordion-panel">${escHtml(sec.content)}</div>
        </div>
      </div>`;
    })
    .join('');

  const openPanel = expandedIndex >= 0 ? 48 : 0;
  const estHeight = sections.length * 44 + openPanel;
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

/** Segmented toolbar — icons, separators, wrap on narrow screens */
export function syncNativeToolbar(node: Node, parent: HTMLElement, ctx: NativeSyncContext): void {
  const state = getState(node);
  const icons = (state.icons as string[]) ?? [];
  const rawItems = (state.items as (string | null)[]) ?? (state.buttons as string[]) ?? ['New', 'Open', 'Save'];
  type ToolbarItem = { type: 'btn'; label: string; icon?: string } | { type: 'sep' };
  const items: ToolbarItem[] = [];
  rawItems.forEach((item, i) => {
    if (item === '|' || item === null) items.push({ type: 'sep' });
    else items.push({ type: 'btn', label: item, icon: icons[i] });
  });

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
      const label = btn.getAttribute('data-label') ?? '';
      node.emit('select', syntheticEvent('select', node, { item: label }));
    });
    ctx.nodeElements.set(node.id, el);
  } else if (el.parentElement !== parent) {
    parent.appendChild(el);
  }

  let btnIndex = 0;
  el.innerHTML = items
    .map((item) => {
      if (item.type === 'sep') return '<span class="lightdraw-toolbar-separator" role="separator" aria-hidden="true"></span>';
      const iconHtml = item.icon ? `<span class="lightdraw-toolbar-icon" aria-hidden="true">${escHtml(item.icon)}</span>` : '';
      const html = `<button type="button" class="lightdraw-toolbar-btn" data-index="${btnIndex}" data-label="${escHtml(item.label)}">${iconHtml}<span>${escHtml(item.label)}</span></button>`;
      btnIndex += 1;
      return html;
    })
    .join('');

  const width = Number(state.width ?? 0);
  el.style.cssText = absPosition(node, width > 0 ? width : 'auto', 'auto');
  ctx.applyA11y(node, el);
  ctx.applyUiClasses(node, el);
  ctx.seenIds.add(node.id);
}

/** Floating toast notification */
export function syncNativeToast(node: Node, parent: HTMLElement, ctx: NativeSyncContext): void {
  const state = getState(node);
  const message = String(state.message ?? 'Notification');
  const variant = String(state.variant ?? 'success');
  const position = String(state.position ?? '');
  const dismissible = state.dismissible !== false;
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
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    parent.appendChild(el);
    el.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.lightdraw-toast-dismiss')) {
        node.visible = false;
        node.emit('close', syntheticEvent('close', node));
        node.getApp()?.requestRender();
      }
    });
    ctx.nodeElements.set(node.id, el);
  } else if (el.parentElement !== parent) {
    parent.appendChild(el);
  }

  const posClass = position ? ` lightdraw-toast--${position}` : '';
  if (!node.visible) {
    el.style.display = 'none';
    el.className = 'lightdraw-toast';
  } else {
    const dismissHtml = dismissible
      ? '<button type="button" class="lightdraw-toast-dismiss" aria-label="Dismiss">×</button>'
      : '';
    el.className = `lightdraw-toast lightdraw-toast--${variant}${posClass} lightdraw-toast--enter`;
    el.innerHTML = `<span class="lightdraw-toast-icon" aria-hidden="true">${icons[variant] ?? icons.success}</span><span class="lightdraw-toast-message">${escHtml(message)}</span>${dismissHtml}`;
    el.style.display = 'flex';
  }

  let extraPos = '';
  if (position === 'top-right') extraPos = 'right:16px;top:16px;left:auto;';
  else if (position === 'bottom-right') extraPos = 'right:16px;bottom:16px;top:auto;left:auto;';
  else if (position === 'bottom-left') extraPos = 'left:16px;bottom:16px;top:auto;';

  const base = absPosition(node, 'auto', 44);
  el.style.cssText = base + extraPos + (node.visible ? 'display:flex;' : 'display:none;');
  ctx.applyUiClasses(node, el);
  ctx.seenIds.add(node.id);
}

/** Dropdown menu panel */
export function syncNativeMenu(node: Node, parent: HTMLElement, ctx: NativeSyncContext): void {
  const state = getState(node);
  const items = (state.items as string[]) ?? ['Item 1', 'Item 2'];
  const variants = (state.itemVariants as string[]) ?? [];
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
    const panelItems = items
      .map(
        (item, i) =>
          `<button type="button" class="lightdraw-menu-item${isDangerMenuItem(item, variants, i) ? ' lightdraw-menu-item--danger' : ''}" role="menuitem" data-index="${i}">${escHtml(item)}</button>`
      )
      .join('');
    el.innerHTML = `<div class="lightdraw-menu-panel">${panelItems}</div>`;
    el.classList.add('lightdraw-menu--open');
    bindMenuOutsideClose(el, node);
  } else {
    const outside = menuOutsideHandlers.get(el);
    if (outside) {
      document.removeEventListener('mousedown', outside);
      menuOutsideHandlers.delete(el);
    }
    el.innerHTML = `<button type="button" class="lightdraw-menu-trigger">${escHtml(triggerLabel)} <span aria-hidden="true">▾</span></button>`;
    el.classList.remove('lightdraw-menu--open');
  }

  const height = open ? Math.min(items.length * 36 + 8, 248) : 36;
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
        releaseDialogFocus(el!);
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
    el.className = 'lightdraw-dialog-host lightdraw-dialog-host--open';
    el.innerHTML = `<div class="lightdraw-dialog-overlay" style="width:${overlayW}px;height:${overlayH}px;left:${-node.x}px;top:${-node.y}px" role="presentation"></div>
      <div class="lightdraw-dialog-center">
        <div class="lightdraw-dialog" role="dialog" aria-modal="true" aria-labelledby="${node.id}-title" style="max-width:${width}px">
          <div class="lightdraw-dialog-header">
            <h2 class="lightdraw-dialog-title" id="${node.id}-title">${escHtml(title)}</h2>
            <button type="button" class="lightdraw-dialog-close" aria-label="Close">×</button>
          </div>
          <p class="lightdraw-dialog-body">${escHtml(message)}</p>
          <div class="lightdraw-dialog-footer">
            <button type="button" class="lightdraw-btn lightdraw-btn--ghost lightdraw-dialog-cancel">Cancel</button>
            <button type="button" class="lightdraw-btn lightdraw-btn--primary lightdraw-dialog-confirm">Confirm</button>
          </div>
        </div>
      </div>`;
    requestAnimationFrame(() => trapDialogFocus(el!));
  } else {
    releaseDialogFocus(el);
    el.className = 'lightdraw-dialog-host';
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
  const anchor = String(state.anchor ?? 'Hover me');
  const placement = String(state.placement ?? 'bottom');
  const delay = Number(state.delay ?? 0);

  let el = ctx.nodeElements.get(node.id) as HTMLDivElement | undefined;
  if (!el) {
    el = document.createElement('div');
    el.id = node.id;
    el.className = 'lightdraw-tooltip';
    parent.appendChild(el);
    const show = () => {
      node.visible = true;
      node.emit('open', syntheticEvent('open', node));
      node.getApp()?.requestRender();
    };
    const hide = () => {
      cancelTooltipShow(node.id);
      node.visible = false;
      node.emit('close', syntheticEvent('close', node));
      node.getApp()?.requestRender();
    };
    el.addEventListener('mouseenter', () => scheduleTooltipShow(node, delay, show));
    el.addEventListener('mouseleave', hide);
    el.addEventListener('focusin', () => scheduleTooltipShow(node, delay, show));
    el.addEventListener('focusout', hide);
    ctx.nodeElements.set(node.id, el);
  } else if (el.parentElement !== parent) {
    parent.appendChild(el);
  }

  el.className = `lightdraw-tooltip lightdraw-tooltip--${placement}`;
  el.innerHTML = `<span class="lightdraw-tooltip-anchor" tabindex="0">${escHtml(anchor)}</span>`;
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
  const primaryIndex = Number(state.primaryIndex ?? 0);
  const mono = Boolean(state.mono);

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

  el.className = `lightdraw-statusbar${mono ? ' lightdraw-statusbar--mono' : ''}`;
  el.innerHTML = segments
    .map(
      (s, i) =>
        `<span class="lightdraw-statusbar-segment${i === primaryIndex ? ' lightdraw-statusbar-segment--primary' : ''}">${escHtml(s)}</span>`
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
