import type { App } from '../App';
import type { Group } from '../shapes/Group';
import { registerComponent } from './registryCore';
import {
  bindApp,
  bool,
  clamp,
  getParts,
  getState,
  num,
  setParts,
  setState,
  str,
  syntheticEvent,
} from './helpers';
import {
  scheduleAutoDismiss,
  trapFocusIn,
  wireButtonStates,
  wirePointerDrag,
  wireSelectFromList,
  wireToggle,
} from './interaction';

function createGroup(
  app: App,
  type: string,
  props: Record<string, unknown>,
  extra: Record<string, unknown> = {}
): Group {
  const group = app.group({
    ...(props as Record<string, unknown>),
    listening: true,
    metadata: {
      componentType: type,
      componentState: { ...props },
      ...((props.metadata as Record<string, unknown>) ?? {}),
    },
    ...extra,
  }) as Group;
  bindApp(group, app);
  return group;
}

/** Button — hover, active, disabled states */
registerComponent('button', (props, app) => {
  const width = num(props, 'width', 120);
  const height = num(props, 'height', 36);
  const label = str(props, 'label', 'Button');
  const disabled = bool(props, 'disabled', false);
  const fill = str(props, 'fill', '#2563eb');

  const group = createGroup(app, 'button', props, {
    focusable: !disabled,
    role: 'button',
    metadata: { componentType: 'button', label, componentState: { label, width, height, disabled, fill } },
  });
  setState(group, { label, width, height, disabled, fill });

  const bg = app.roundedRect({ width, height, cornerRadius: 6, fill, stroke: null });
  const text = app.text({
    text: label,
    fontSize: 14,
    fill: '#ffffff',
    x: width / 2 - label.length * 3.5,
    y: height / 2 - 7,
  });
  group.add(bg, text);
  setParts(group, { bg, text });

  wireButtonStates(group, ({ hover, active, disabled: dis }) => {
    const parts = getParts(group);
    const base = dis ? '#9ca3af' : fill;
    (parts.bg as { fill: string }).fill = dis ? '#9ca3af' : active ? '#1d4ed8' : hover ? '#1e40af' : base;
    group.getApp()?.requestRender();
  });

  return group;
});

registerComponent('label', (props, app) => {
  const node = app.text({
    text: str(props, 'text', ''),
    fontSize: num(props, 'fontSize', 14),
    fill: str(props, 'color', '#333'),
    ...props,
  });
  node.metadata.componentType = 'label';
  setState(node, { text: str(props, 'text', ''), fontSize: num(props, 'fontSize', 14) });
  return node;
});

registerComponent('card', (props, app) => {
  const width = num(props, 'width', 280);
  const height = num(props, 'height', 160);
  const group = createGroup(app, 'card', props);
  const bg = app.roundedRect({
    width,
    height,
    cornerRadius: 8,
    fill: '#ffffff',
    stroke: '#e5e7eb',
    strokeWidth: 1,
    shadow: { color: 'rgba(0,0,0,0.1)', blur: 8, offsetX: 0, offsetY: 2 },
  });
  group.add(bg);
  if (props.title) {
    group.add(
      app.text({
        text: props.title as string,
        fontSize: 16,
        fontWeight: 'bold',
        fill: '#111',
        x: 16,
        y: 16,
      })
    );
  }
  setState(group, { width, height, title: props.title });
  return group;
});

registerComponent('progressBar', (props, app) => {
  const width = num(props, 'width', 200);
  const height = num(props, 'height', 8);
  const value = clamp(num(props, 'value', 0), 0, 100);
  const group = createGroup(app, 'progressBar', props, {
    role: 'progressbar',
    ariaValueNow: value,
    ariaValueMin: 0,
    ariaValueMax: 100,
  });
  const track = app.roundedRect({ width, height, cornerRadius: height / 2, fill: '#e5e7eb' });
  const fillBar = app.roundedRect({
    width: (width * value) / 100,
    height,
    cornerRadius: height / 2,
    fill: str(props, 'fill', '#2563eb'),
  });
  group.add(track, fillBar);
  setParts(group, { track, fillBar });
  setState(group, { width, height, value });
  return group;
});

/** Slider — drag thumb, emit change */
registerComponent('slider', (props, app) => {
  const width = num(props, 'width', 200);
  const min = num(props, 'min', 0);
  const max = num(props, 'max', 100);
  let value = clamp(num(props, 'value', 50), min, max);

  const group = createGroup(app, 'slider', props, {
    focusable: true,
    role: 'slider',
    ariaValueNow: value,
    ariaValueMin: min,
    ariaValueMax: max,
    metadata: { componentType: 'slider', label: props.label ?? 'Slider' },
  });

  const track = app.rect({ width, height: 4, y: 8, fill: '#e5e7eb', listening: false });
  const fill = app.rect({ width: 0, height: 4, y: 8, fill: '#2563eb', listening: false });
  const thumb = app.circle({ x: 0, y: 0, radius: 8, fill: '#2563eb' });
  group.add(track, fill, thumb);
  setParts(group, { track, fill, thumb });

  const updateVisual = (v: number) => {
    const pct = (v - min) / (max - min);
    (fill as { width: number }).width = width * pct;
    (thumb as { x: number }).x = width * pct - 8;
    group.ariaValueNow = v;
    group.getApp()?.requestRender();
  };
  updateVisual(value);
  setState(group, { width, min, max, value });

  const setValue = (worldX: number) => {
    const localX = clamp(worldX - group.x, 0, width);
    const pct = localX / width;
    value = min + pct * (max - min);
    setState(group, { value });
    updateVisual(value);
  };

  wirePointerDrag(group, (wx) => setValue(wx), () => {
    group.emit('change', syntheticEvent('change', group, { value: getState(group).value }));
  });

  return group;
});

/** Checkbox — toggle, aria-checked */
registerComponent('checkbox', (props, app) => {
  const checked = bool(props, 'checked', false);
  const group = createGroup(app, 'checkbox', props, {
    focusable: true,
    role: 'checkbox',
    ariaChecked: checked,
    metadata: { componentType: 'checkbox', label: props.label ?? 'Checkbox' },
  });

  const box = app.roundedRect({
    width: 18,
    height: 18,
    cornerRadius: 3,
    fill: checked ? '#2563eb' : '#fff',
    stroke: '#9ca3af',
    strokeWidth: 1,
    listening: false,
  });
  group.add(box);
  if (props.label) {
    group.add(app.text({ text: props.label as string, x: 26, y: 1, fontSize: 14, fill: '#333', listening: false }));
  }
  setParts(group, { box });
  setState(group, { checked, label: props.label });

  wireToggle(group, 'checked', (v) => {
    (box as { fill: string }).fill = v ? '#2563eb' : '#fff';
    group.ariaChecked = v;
  });

  return group;
});

/** Toggle switch */
registerComponent('toggle', (props, app) => {
  const on = bool(props, 'value', false);
  const group = createGroup(app, 'toggle', props, {
    focusable: true,
    role: 'switch',
    ariaChecked: on,
    metadata: { componentType: 'toggle', label: props.label ?? 'Toggle' },
  });

  const track = app.roundedRect({ width: 44, height: 24, cornerRadius: 12, fill: on ? '#2563eb' : '#d1d5db', listening: false });
  const knob = app.circle({ x: on ? 22 : 2, y: 2, radius: 10, fill: '#fff', listening: false });
  group.add(track, knob);
  setParts(group, { track, knob });
  setState(group, { value: on, label: props.label });

  wireToggle(group, 'value', (v) => {
    (track as { fill: string }).fill = v ? '#2563eb' : '#d1d5db';
    (knob as { x: number }).x = v ? 22 : 2;
    group.ariaChecked = v;
  });

  return group;
});

/** Input — text field (native in HTML renderer) */
registerComponent('input', (props, app) => {
  const width = num(props, 'width', 200);
  const height = num(props, 'height', 32);
  const value = str(props, 'value', '');
  const placeholder = str(props, 'placeholder', '');
  const group = createGroup(app, 'input', props, {
    focusable: true,
    role: 'textbox',
    metadata: { componentType: 'input', label: props.label ?? (placeholder || 'Input') },
  });
  const bg = app.roundedRect({ width, height, cornerRadius: 4, fill: '#fff', stroke: '#d1d5db', strokeWidth: 1, listening: false });
  const text = app.text({ text: value || placeholder, fontSize: 14, fill: value ? '#111' : '#9ca3af', x: 8, y: 8, listening: false });
  group.add(bg, text);
  setParts(group, { bg, text });
  setState(group, { width, height, value, placeholder });
  return group;
});

/** TextArea — multiline input */
registerComponent('textarea', (props, app) => {
  const width = num(props, 'width', 240);
  const height = num(props, 'height', 80);
  const value = str(props, 'value', '');
  const group = createGroup(app, 'textarea', props, {
    focusable: true,
    role: 'textbox',
    metadata: { componentType: 'textarea', multiline: true },
  });
  const bg = app.roundedRect({ width, height, cornerRadius: 4, fill: '#fff', stroke: '#d1d5db', strokeWidth: 1, listening: false });
  const text = app.text({ text: value || str(props, 'placeholder', ''), fontSize: 14, fill: '#111', x: 8, y: 8, listening: false });
  group.add(bg, text);
  setParts(group, { bg, text });
  setState(group, { width, height, value, rows: num(props, 'rows', 4) });
  return group;
});

/** Radio — group selection via metadata.group */
registerComponent('radio', (props, app) => {
  const selected = bool(props, 'selected', false);
  const groupName = str(props, 'group', 'default');
  const group = createGroup(app, 'radio', props, {
    focusable: true,
    role: 'radio',
    ariaChecked: selected,
    metadata: { componentType: 'radio', group: groupName, label: props.label },
  });

  const outer = app.circle({ x: 9, y: 9, radius: 9, fill: '#fff', stroke: '#9ca3af', strokeWidth: 1, listening: false });
  const inner = app.circle({ x: 9, y: 9, radius: 5, fill: selected ? '#2563eb' : 'transparent', listening: false });
  group.add(outer, inner);
  if (props.label) {
    group.add(app.text({ text: props.label as string, x: 26, y: 1, fontSize: 14, fill: '#333', listening: false }));
  }
  setParts(group, { outer, inner });
  setState(group, { selected, group: groupName, label: props.label });

  group.on('click', () => {
    setState(group, { selected: true });
    group.ariaChecked = true;
    (inner as { fill: string }).fill = '#2563eb';
    group.emit('change', syntheticEvent('change', group, { value: groupName, payload: groupName }));
    group.getApp()?.requestRender();
  });

  return group;
});

/** Tooltip — show on hover/focus */
registerComponent('tooltip', (props, app) => {
  const text = str(props, 'text', 'Tooltip');
  const group = createGroup(app, 'tooltip', props, { visible: bool(props, 'visible', false), listening: true });
  const pad = 8;
  const tw = text.length * 7 + pad * 2;
  const bg = app.roundedRect({ width: tw, height: 28, cornerRadius: 4, fill: '#1f2937', listening: false });
  const label = app.text({ text, fontSize: 12, fill: '#fff', x: pad, y: 6, listening: false });
  group.add(bg, label);
  setState(group, { text, visible: group.visible });

  group.on('mouseenter', () => {
    group.visible = true;
    group.getApp()?.requestRender();
    group.emit('open', syntheticEvent('open', group));
  });
  group.on('mouseleave', () => {
    group.visible = false;
    group.getApp()?.requestRender();
    group.emit('close', syntheticEvent('close', group));
  });

  return group;
});

/** Menu / Dropdown */
registerComponent('menu', (props, app) => {
  const items = (props.items as string[]) ?? ['Item 1', 'Item 2', 'Item 3'];
  const open = bool(props, 'open', false);
  const rowH = 28;
  const width = num(props, 'width', 160);
  const height = items.length * rowH + 8;

  const group = createGroup(app, 'menu', props, {
    focusable: true,
    role: 'menu',
    visible: open,
    metadata: { componentType: 'menu', label: props.label ?? 'Menu' },
  });

  const bg = app.roundedRect({ width, height, cornerRadius: 6, fill: '#fff', stroke: '#e5e7eb', strokeWidth: 1, listening: false });
  group.add(bg);
  items.forEach((item, i) => {
    group.add(app.text({ text: item, x: 12, y: 10 + i * rowH, fontSize: 14, fill: '#111', listening: false }));
  });
  setState(group, { items, open, width, selectedIndex: -1 });

  group.on('click', (e: { stopPropagation?: () => void }) => {
    if (!group.visible) {
      group.visible = true;
      setState(group, { open: true });
      group.emit('open', syntheticEvent('open', group));
    } else {
      e.stopPropagation?.();
    }
    group.getApp()?.requestRender();
  });

  wireSelectFromList(group, items, 'selectedIndex', (index) => {
    group.visible = false;
    setState(group, { open: false, selectedIndex: index });
  });

  return group;
});

/** Dialog / Modal */
registerComponent('dialog', (props, app) => {
  const width = num(props, 'width', 320);
  const height = num(props, 'height', 200);
  const open = bool(props, 'open', true);
  const title = str(props, 'title', 'Dialog');

  const group = createGroup(app, 'dialog', props, {
    focusable: true,
    role: 'dialog',
    visible: open,
    metadata: { componentType: 'dialog', label: title },
  });

  const overlay = app.rect({ width: num(props, 'overlayWidth', 800), height: num(props, 'overlayHeight', 600), fill: 'rgba(0,0,0,0.4)', x: -num(props, 'x', 0), y: -num(props, 'y', 0), listening: true });
  const panel = app.roundedRect({ width, height, cornerRadius: 8, fill: '#fff', stroke: '#e5e7eb', strokeWidth: 1, x: 0, y: 0 });
  const titleText = app.text({ text: title, fontSize: 16, fontWeight: 'bold', fill: '#111', x: 16, y: 16 });
  group.add(overlay, panel, titleText);
  setParts(group, { overlay, panel, titleText });
  setState(group, { open, title, width, height });

  if (open) trapFocusIn(group);

  group.on('click', () => {
    if (!getState(group).open) {
      setState(group, { open: true });
      group.visible = true;
      trapFocusIn(group);
      group.emit('open', syntheticEvent('open', group));
      group.getApp()?.requestRender();
    }
  });

  overlay.on('click', (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setState(group, { open: false });
    group.visible = false;
    group.emit('close', syntheticEvent('close', group));
    group.getApp()?.requestRender();
  });

  return group;
});

/** Tabs */
registerComponent('tabs', (props, app) => {
  const labels = (props.tabs as string[]) ?? ['Tab 1', 'Tab 2'];
  const activeTab = num(props, 'activeTab', 0);
  const width = num(props, 'width', 300);
  const tabW = width / labels.length;

  const group = createGroup(app, 'tabs', props, { focusable: true, role: 'tablist' });
  labels.forEach((label, i) => {
    const tab = app.group({ x: i * tabW, y: 0, listening: true, focusable: true, metadata: { tabIndex: i } });
    tab.add(
      app.rect({ width: tabW, height: 32, fill: i === activeTab ? '#2563eb' : '#e5e7eb', listening: false }),
      app.text({ text: label, fontSize: 13, fill: i === activeTab ? '#fff' : '#333', x: 12, y: 8, listening: false })
    );
    tab.on('click', () => {
      setState(group, { activeTab: i });
      group.emit('change', syntheticEvent('change', group, { value: i, tab: label }));
      group.getApp()?.requestRender();
    });
    group.add(tab);
  });
  setState(group, { tabs: labels, activeTab, width });
  return group;
});

/** Accordion */
registerComponent('accordion', (props, app) => {
  const sections = (props.sections as { title: string; content: string }[]) ?? [
    { title: 'Section 1', content: 'Content 1' },
    { title: 'Section 2', content: 'Content 2' },
  ];
  const expanded = num(props, 'expandedIndex', 0);
  const group = createGroup(app, 'accordion', props, { focusable: true });

  sections.forEach((sec, i) => {
    const y = i * 40;
    const header = app.group({ x: 0, y, listening: true, focusable: true });
    header.add(
      app.rect({ width: num(props, 'width', 280), height: 36, fill: '#f3f4f6', stroke: '#e5e7eb', strokeWidth: 1, listening: false }),
      app.text({ text: sec.title, fontSize: 14, fill: '#111', x: 12, y: 10, listening: false })
    );
    header.on('click', () => {
      setState(group, { expandedIndex: i });
      group.emit('change', syntheticEvent('change', group, { value: i, section: sec.title }));
      group.getApp()?.requestRender();
    });
    group.add(header);
    if (i === expanded) {
      group.add(app.text({ text: sec.content, x: 12, y: y + 40, fontSize: 13, fill: '#555', listening: false }));
    }
  });
  setState(group, { sections, expandedIndex: expanded });
  return group;
});

/** Table */
registerComponent('table', (props, app) => {
  const columns = (props.columns as string[]) ?? ['Name', 'Value'];
  const rows = (props.rows as string[][]) ?? [
    ['Row A', '1'],
    ['Row B', '2'],
  ];
  const colW = num(props, 'colWidth', 100);
  const rowH = 28;
  const group = createGroup(app, 'table', props, { focusable: true, role: 'grid' });

  columns.forEach((col, ci) => {
    group.add(app.text({ text: col, x: ci * colW + 8, y: 4, fontSize: 13, fontWeight: 'bold', fill: '#111', listening: false }));
  });

  rows.forEach((row, ri) => {
    const rowGroup = app.group({ x: 0, y: (ri + 1) * rowH, listening: true, metadata: { rowIndex: ri } });
    row.forEach((cell, ci) => {
      rowGroup.add(app.text({ text: cell, x: ci * colW + 8, y: 4, fontSize: 13, fill: '#333', listening: false }));
    });
    rowGroup.on('click', () => {
      setState(group, { selectedRow: ri });
      group.emit('select', syntheticEvent('select', group, { index: ri, row }));
      group.getApp()?.requestRender();
    });
    group.add(rowGroup);
  });

  setState(group, { columns, rows, selectedRow: -1 });
  return group;
});

/** Tree View */
registerComponent('tree', (props, app) => {
  const nodes = (props.nodes as { label: string; children?: { label: string }[] }[]) ?? [
    { label: 'Root', children: [{ label: 'Child A' }, { label: 'Child B' }] },
  ];
  const expanded = new Set<number>([0]);
  const group = createGroup(app, 'tree', props, { focusable: true, role: 'tree' });
  let y = 0;

  nodes.forEach((node, i) => {
    const header = app.group({ x: 0, y, listening: true });
    header.add(app.text({ text: (expanded.has(i) ? '▼ ' : '▶ ') + node.label, fontSize: 14, fill: '#111', listening: false }));
    header.on('click', () => {
      if (expanded.has(i)) expanded.delete(i);
      else expanded.add(i);
      setState(group, { expanded: Array.from(expanded) });
      group.emit('change', syntheticEvent('change', group, { value: i }));
      group.getApp()?.requestRender();
    });
    group.add(header);
    y += 24;
    if (expanded.has(i) && node.children) {
      node.children.forEach((child) => {
        group.add(app.text({ text: '    ' + child.label, x: 0, y, fontSize: 13, fill: '#555', listening: false }));
        y += 22;
      });
    }
  });

  setState(group, { nodes, expanded: Array.from(expanded) });
  return group;
});

/** Toolbar */
registerComponent('toolbar', (props, app) => {
  const buttons = (props.buttons as string[]) ?? ['New', 'Open', 'Save'];
  const group = createGroup(app, 'toolbar', props, { focusable: true, role: 'toolbar' });
  let x = 0;
  buttons.forEach((label) => {
    const btn = createGroup(app, 'button', { label, width: 72, height: 28 }, { x, y: 0, focusable: true, role: 'button' });
    btn.add(
      app.roundedRect({ width: 72, height: 28, cornerRadius: 4, fill: '#f3f4f6', stroke: '#d1d5db', strokeWidth: 1, listening: false }),
      app.text({ text: label, fontSize: 12, fill: '#111', x: 10, y: 7, listening: false })
    );
    btn.on('click', () => {
      group.emit('select', syntheticEvent('select', group, { item: label }));
    });
    group.add(btn);
    x += 76;
  });
  setState(group, { buttons });
  return group;
});

/** Toast / Notification */
registerComponent('toast', (props, app) => {
  const message = str(props, 'message', 'Notification');
  const duration = num(props, 'duration', 3000);
  const group = createGroup(app, 'toast', props, {
    role: 'status',
    ariaLive: 'polite',
    metadata: { componentType: 'toast', ariaLive: 'polite' },
  });
  const tw = message.length * 7 + 24;
  group.add(
    app.roundedRect({ width: tw, height: 36, cornerRadius: 6, fill: '#1f2937', listening: false }),
    app.text({ text: message, fontSize: 13, fill: '#fff', x: 12, y: 10, listening: false })
  );
  setState(group, { message, duration });
  group.emit('open', syntheticEvent('open', group));
  scheduleAutoDismiss(group, duration, () => {
    group.visible = false;
  });
  return group;
});

/** Status Bar */
registerComponent('statusBar', (props, app) => {
  const segments = (props.segments as string[]) ?? ['Ready', 'Line 1', 'UTF-8'];
  const width = num(props, 'width', 400);
  const group = createGroup(app, 'statusBar', props, { role: 'status' });
  group.add(app.rect({ width, height: 24, fill: '#f3f4f6', stroke: '#e5e7eb', strokeWidth: 1, listening: false }));
  const segW = width / segments.length;
  segments.forEach((seg, i) => {
    group.add(app.text({ text: seg, x: i * segW + 8, y: 5, fontSize: 12, fill: '#555', listening: false }));
  });
  setState(group, { segments, width });
  return group;
});
