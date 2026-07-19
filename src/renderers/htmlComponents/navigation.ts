/**
 * Native HTML sync — navigation.
 */
import type { Node } from '../../Node';
import type { NativeSyncContext } from './types';
import { syntheticEvent } from '../../components/helpers';
import {
  getState,
  escHtml,
  absPosition,
  bindDelegated,
} from './shared';

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
