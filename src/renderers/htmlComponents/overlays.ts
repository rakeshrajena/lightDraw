/**
 * Native HTML sync — overlays.
 */
import type { Node } from '../../Node';
import type { NativeSyncContext } from './types';
import { syntheticEvent } from '../../components/helpers';
import {
  getState,
  escHtml,
  absPosition,
  bindDelegated,
  menuOutsideHandlers,
  trapDialogFocus,
  releaseDialogFocus,
  bindMenuOutsideClose,
  isDangerMenuItem,
  scheduleTooltipShow,
  cancelTooltipShow,
} from './shared';

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
