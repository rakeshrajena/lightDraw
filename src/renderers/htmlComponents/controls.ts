/**
 * Native HTML sync — controls.
 */
import type { Node } from '../../Node';
import type { NativeSyncContext, FormModifiers } from './types';
import { syntheticEvent } from '../../components/helpers';
import {
  positionStyle,
  getState,
  modifierClasses,
  fieldWidth,
  syncFieldError,
  escHtml,
  absPosition,
} from './shared';

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
