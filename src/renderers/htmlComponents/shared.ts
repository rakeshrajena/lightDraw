/**
 * Shared helpers for native HTML component sync.
 */
import type { Node } from '../../Node';
import { syntheticEvent } from '../../components/helpers';
import type { FormModifiers } from './types';

export function positionStyle(node: Node, width: number, height: number): string {
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

export function getState(node: Node): Record<string, unknown> {
  return (node.metadata?.componentState ?? {}) as Record<string, unknown>;
}

export function modifierClasses(base: string, mods: FormModifiers, extra = ''): string {
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

export function fieldWidth(state: Record<string, unknown>, fallback: number): number | string {
  if (state.fullWidth) return '100%';
  return Number(state.width ?? fallback);
}

export function syncFieldError(wrap: HTMLElement, error?: string): void {
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

export function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatTableCell(cell: string): string {
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

export function sortTableRows(rows: string[][], col: number, dir: 'asc' | 'desc'): string[][] {
  return [...rows].sort((a, b) => {
    const av = a[col] ?? '';
    const bv = b[col] ?? '';
    const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' });
    return dir === 'asc' ? cmp : -cmp;
  });
}

export function filterTableRows(rows: string[][], query: string): string[][] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => row.some((cell) => String(cell).toLowerCase().includes(q)));
}

export function absPosition(node: Node, width?: number | string, height?: number | string): string {
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

export function bindDelegated(el: HTMLElement, handler: (e: Event) => void): void {
  if (el.dataset.ldDelegated === '1') return;
  el.dataset.ldDelegated = '1';
  el.addEventListener('click', handler);
}

export const dialogTrapHandlers = new WeakMap<HTMLElement, (e: KeyboardEvent) => void>();
export const menuOutsideHandlers = new WeakMap<HTMLElement, (e: MouseEvent) => void>();
export const tooltipDelayTimers = new Map<string, number>();

export function trapDialogFocus(host: HTMLElement): void {
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

export function releaseDialogFocus(host: HTMLElement): void {
  const existing = dialogTrapHandlers.get(host);
  if (existing) {
    host.removeEventListener('keydown', existing);
    dialogTrapHandlers.delete(host);
  }
}

export function bindMenuOutsideClose(el: HTMLElement, node: Node): void {
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

export function isDangerMenuItem(item: string, variants: string[] | undefined, index: number): boolean {
  if (variants?.[index] === 'danger') return true;
  const lower = item.toLowerCase();
  return lower === 'delete' || lower === 'remove' || lower === 'danger';
}

export function scheduleTooltipShow(node: Node, delayMs: number, show: () => void): void {
  const prev = tooltipDelayTimers.get(node.id);
  if (prev !== undefined) clearTimeout(prev);
  if (delayMs <= 0) {
    show();
    return;
  }
  const id = window.setTimeout(show, delayMs);
  tooltipDelayTimers.set(node.id, id);
}

export function cancelTooltipShow(nodeId: string): void {
  const prev = tooltipDelayTimers.get(nodeId);
  if (prev !== undefined) {
    clearTimeout(prev);
    tooltipDelayTimers.delete(nodeId);
  }
}

