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
import { UI } from './theme';

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
  const width = num(props, 'width', 128);
  const height = num(props, 'height', UI.controlHeight);
  const label = str(props, 'label', 'Button');
  const disabled = bool(props, 'disabled', false);
  const variant = str(props, 'variant', 'primary');
  const fill =
    str(props, 'fill', '') ||
    (variant === 'secondary' ? UI.secondary : variant === 'ghost' ? UI.surface : UI.primary);

  const group = createGroup(app, 'button', props, {
    focusable: !disabled,
    role: 'button',
    metadata: { componentType: 'button', label, componentState: { label, width, height, disabled, fill, variant } },
  });
  setState(group, { label, width, height, disabled, fill, variant });

  const textColor = variant === 'ghost' ? UI.textSecondary : UI.textInverse;
  const bg = app.roundedRect({
    width,
    height,
    cornerRadius: UI.radius,
    fill,
    stroke: variant === 'ghost' ? UI.border : null,
    strokeWidth: variant === 'ghost' ? 1 : 0,
    shadow: variant === 'primary' ? UI.shadowPrimary : UI.shadowSm,
  });
  const text = app.text({
    text: label,
    fontSize: UI.fontSize,
    fontWeight: '600',
    fill: textColor,
    x: 0,
    y: (height - UI.fontSize) / 2,
    textAlign: 'center',
  });
  group.add(bg, text);
  setParts(group, { bg, text });

  wireButtonStates(group, ({ hover, active, disabled: dis }) => {
    const parts = getParts(group);
    if (dis) {
      (parts.bg as { fill: string }).fill = UI.borderStrong;
      return group.getApp()?.requestRender();
    }
    const base = fill;
    const hoverColor =
      variant === 'secondary' ? UI.secondaryHover : variant === 'ghost' ? UI.surfaceInset : UI.primaryHover;
    const activeColor =
      variant === 'secondary' ? UI.textSecondary : variant === 'ghost' ? UI.surfaceMuted : UI.primaryActive;
    (parts.bg as { fill: string }).fill = active ? activeColor : hover ? hoverColor : base;
    group.getApp()?.requestRender();
  });

  return group;
});

registerComponent('label', (props, app) => {
  const node = app.text({
    text: str(props, 'text', ''),
    fontSize: num(props, 'fontSize', UI.fontSizeSm),
    fontWeight: str(props, 'fontWeight', '600'),
    fill: str(props, 'color', UI.textMuted),
    ...props,
  });
  node.metadata.componentType = 'label';
  setState(node, { text: str(props, 'text', ''), fontSize: num(props, 'fontSize', UI.fontSizeSm) });
  return node;
});

registerComponent('card', (props, app) => {
  const width = num(props, 'width', 280);
  const height = num(props, 'height', 160);
  const group = createGroup(app, 'card', props);
  const bg = app.roundedRect({
    width,
    height,
    cornerRadius: UI.radiusLg,
    fill: UI.surface,
    stroke: UI.border,
    strokeWidth: 1,
    shadow: UI.shadowMd,
  });
  group.add(bg);
  if (props.title) {
    group.add(
      app.text({
        text: props.title as string,
        fontSize: UI.fontSizeLg,
        fontWeight: 'bold',
        fill: UI.text,
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
  const track = app.roundedRect({ width, height, cornerRadius: height / 2, fill: UI.surfaceInset, listening: false });
  const fillBar = app.roundedRect({
    width: (width * value) / 100,
    height,
    cornerRadius: height / 2,
    fill: str(props, 'fill', UI.primary),
    listening: false,
  });
  group.add(track, fillBar);
  setParts(group, { track, fillBar });
  setState(group, { width, height, value, label: props.label, variant: props.variant });
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

  const track = app.roundedRect({ width, height: 6, y: 12, cornerRadius: 3, fill: UI.surfaceInset, listening: false });
  const fill = app.roundedRect({ width: 0, height: 6, y: 12, cornerRadius: 3, fill: UI.primary, listening: false });
  const thumb = app.circle({
    x: 0,
    y: 12,
    radius: 10,
    fill: UI.surface,
    stroke: UI.primary,
    strokeWidth: 2,
    shadow: UI.shadowMd,
    listening: false,
  });
  group.add(track, fill, thumb);
  setParts(group, { track, fill, thumb });

  const updateVisual = (v: number) => {
    const pct = (v - min) / (max - min);
    (fill as { width: number }).width = width * pct;
    (thumb as { x: number }).x = width * pct - 10;
    group.ariaValueNow = v;
    group.getApp()?.requestRender();
  };
  updateVisual(value);
  setState(group, { width, min, max, value, label: props.label });

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
    width: 20,
    height: 20,
    cornerRadius: 5,
    fill: checked ? UI.primary : UI.surface,
    stroke: checked ? UI.primary : UI.borderStrong,
    strokeWidth: 1.5,
    shadow: checked ? UI.shadowSm : null,
    listening: false,
  });
  const mark = app.text({
    text: '✓',
    x: 4,
    y: 1,
    fontSize: 14,
    fontWeight: 'bold',
    fill: UI.textInverse,
    visible: checked,
    listening: false,
  });
  group.add(box, mark);
  if (props.label) {
    group.add(
      app.text({
        text: props.label as string,
        x: 30,
        y: 2,
        fontSize: UI.fontSize,
        fill: UI.textSecondary,
        listening: false,
      })
    );
  }
  setParts(group, { box, mark });
  setState(group, { checked, label: props.label });

  wireToggle(group, 'checked', (v) => {
    (box as { fill: string; stroke: string }).fill = v ? UI.primary : UI.surface;
    (box as { stroke: string }).stroke = v ? UI.primary : UI.borderStrong;
    (mark as { visible: boolean }).visible = v;
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

  const track = app.roundedRect({
    width: 48,
    height: 26,
    cornerRadius: 13,
    fill: on ? UI.primary : UI.borderStrong,
    listening: false,
  });
  const knob = app.circle({
    x: on ? 24 : 2,
    y: 3,
    radius: 10,
    fill: UI.surface,
    shadow: UI.shadowMd,
    listening: false,
  });
  group.add(track, knob);
  setParts(group, { track, knob });
  setState(group, { value: on, label: props.label });

  wireToggle(group, 'value', (v) => {
    (track as { fill: string }).fill = v ? UI.primary : UI.borderStrong;
    (knob as { x: number }).x = v ? 24 : 2;
    group.ariaChecked = v;
  });

  return group;
});

/** Input — text field (native in HTML renderer) */
registerComponent('input', (props, app) => {
  const width = num(props, 'width', 240);
  const height = num(props, 'height', UI.inputHeight);
  const value = str(props, 'value', '');
  const placeholder = str(props, 'placeholder', '');
  const group = createGroup(app, 'input', props, {
    focusable: true,
    role: 'textbox',
    metadata: { componentType: 'input', label: props.label ?? (placeholder || 'Input') },
  });
  const bg = app.roundedRect({
    width,
    height,
    cornerRadius: UI.radius,
    fill: UI.surface,
    stroke: UI.border,
    strokeWidth: 1,
    shadow: UI.shadowSm,
    listening: false,
  });
  const text = app.text({
    text: value || placeholder,
    fontSize: UI.fontSize,
    fill: value ? UI.text : UI.textPlaceholder,
    x: 12,
    y: (height - UI.fontSize) / 2,
    listening: false,
  });
  group.add(bg, text);
  setParts(group, { bg, text });
  setState(group, { width, height, value, placeholder, label: props.label });
  return group;
});

/** TextArea — multiline input */
registerComponent('textarea', (props, app) => {
  const width = num(props, 'width', 280);
  const height = num(props, 'height', 96);
  const value = str(props, 'value', '');
  const group = createGroup(app, 'textarea', props, {
    focusable: true,
    role: 'textbox',
    metadata: { componentType: 'textarea', multiline: true },
  });
  const bg = app.roundedRect({
    width,
    height,
    cornerRadius: UI.radius,
    fill: UI.surface,
    stroke: UI.border,
    strokeWidth: 1,
    shadow: UI.shadowSm,
    listening: false,
  });
  const text = app.text({
    text: value || str(props, 'placeholder', ''),
    fontSize: UI.fontSize,
    fill: value ? UI.text : UI.textPlaceholder,
    x: 12,
    y: 12,
    listening: false,
  });
  group.add(bg, text);
  setParts(group, { bg, text });
  setState(group, { width, height, value, rows: num(props, 'rows', 4), label: props.label, placeholder: props.placeholder });
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

  const outer = app.circle({
    x: 10,
    y: 10,
    radius: 10,
    fill: UI.surface,
    stroke: selected ? UI.primary : UI.borderStrong,
    strokeWidth: selected ? 2 : 1.5,
    listening: false,
  });
  const inner = app.circle({
    x: 10,
    y: 10,
    radius: 5,
    fill: selected ? UI.primary : 'transparent',
    listening: false,
  });
  group.add(outer, inner);
  if (props.label) {
    group.add(
      app.text({
        text: props.label as string,
        x: 28,
        y: 2,
        fontSize: UI.fontSize,
        fill: UI.textSecondary,
        listening: false,
      })
    );
  }
  setParts(group, { outer, inner });
  setState(group, { selected, group: groupName, label: props.label });

  group.on('click', () => {
    setState(group, { selected: true });
    group.ariaChecked = true;
    (inner as { fill: string }).fill = UI.primary;
    (outer as { stroke: string }).stroke = UI.primary;
    group.emit('change', syntheticEvent('change', group, { value: groupName, payload: groupName }));
    group.getApp()?.requestRender();
  });

  return group;
});

/** Tooltip — show on hover/focus */
registerComponent('tooltip', (props, app) => {
  const text = str(props, 'text', 'Tooltip');
  const group = createGroup(app, 'tooltip', props, { visible: bool(props, 'visible', false), listening: true });
  const pad = 10;
  const tw = text.length * 7 + pad * 2;
  const bg = app.roundedRect({
    width: tw,
    height: 32,
    cornerRadius: UI.radiusSm,
    fill: '#1e293b',
    shadow: UI.shadowMd,
    listening: false,
  });
  const label = app.text({ text, fontSize: UI.fontSizeSm, fill: UI.textInverse, x: pad, y: 8, listening: false });
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
  const rowH = 32;
  const width = num(props, 'width', 180);
  const height = items.length * rowH + 12;

  const group = createGroup(app, 'menu', props, {
    focusable: true,
    role: 'menu',
    visible: open,
    metadata: { componentType: 'menu', label: props.label ?? 'Menu' },
  });

  const bg = app.roundedRect({
    width,
    height,
    cornerRadius: UI.radius,
    fill: UI.surface,
    stroke: UI.border,
    strokeWidth: 1,
    shadow: UI.shadowLg,
    listening: false,
  });
  group.add(bg);
  items.forEach((item, i) => {
    group.add(
      app.text({
        text: item,
        x: 14,
        y: 10 + i * rowH,
        fontSize: UI.fontSize,
        fill: UI.text,
        listening: false,
      })
    );
  });
  setState(group, { items, open, width, selectedIndex: -1, triggerLabel: props.triggerLabel });

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

  const overlay = app.rect({
    width: num(props, 'overlayWidth', 800),
    height: num(props, 'overlayHeight', 600),
    fill: UI.overlay,
    x: -num(props, 'x', 0),
    y: -num(props, 'y', 0),
    listening: true,
  });
  const panel = app.roundedRect({
    width,
    height,
    cornerRadius: UI.radiusLg,
    fill: UI.surface,
    stroke: UI.border,
    strokeWidth: 1,
    shadow: UI.shadowLg,
    x: 0,
    y: 0,
  });
  const titleText = app.text({
    text: title,
    fontSize: UI.fontSizeLg,
    fontWeight: 'bold',
    fill: UI.text,
    x: 20,
    y: 18,
  });
  const divider = app.rect({
    width: width - 40,
    height: 1,
    fill: UI.border,
    x: 20,
    y: 48,
    listening: false,
  });
  const bodyText = app.text({
    text: str(props, 'message', 'Are you sure you want to continue?'),
    fontSize: UI.fontSize,
    fill: UI.textSecondary,
    x: 20,
    y: 64,
    listening: false,
  });
  group.add(overlay, panel, titleText, divider, bodyText);
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
  const tabH = 36;
  group.add(
    app.roundedRect({
      width,
      height: tabH + 4,
      cornerRadius: UI.radius,
      fill: UI.surfaceInset,
      stroke: UI.border,
      strokeWidth: 1,
      listening: false,
    })
  );
  labels.forEach((label, i) => {
    const tab = app.group({ x: i * tabW + 4, y: 2, listening: true, focusable: true, metadata: { tabIndex: i } });
    const active = i === activeTab;
    tab.add(
      app.roundedRect({
        width: tabW - 8,
        height: tabH,
        cornerRadius: UI.radiusSm,
        fill: active ? UI.surface : 'transparent',
        stroke: active ? UI.border : null,
        strokeWidth: active ? 1 : 0,
        shadow: active ? UI.shadowSm : null,
        listening: false,
      }),
      app.text({
        text: label,
        fontSize: UI.fontSize,
        fontWeight: active ? '600' : '500',
        fill: active ? UI.primary : UI.textMuted,
        x: (tabW - 8) / 2,
        y: 10,
        textAlign: 'center',
        listening: false,
      })
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
    const y = i * 44;
    const header = app.group({ x: 0, y, listening: true, focusable: true });
    const isOpen = i === expanded;
    header.add(
      app.roundedRect({
        width: num(props, 'width', 280),
        height: 40,
        cornerRadius: UI.radiusSm,
        fill: isOpen ? UI.primaryMuted : UI.surfaceMuted,
        stroke: UI.border,
        strokeWidth: 1,
        listening: false,
      }),
      app.text({
        text: (isOpen ? '▼  ' : '▶  ') + sec.title,
        fontSize: UI.fontSize,
        fontWeight: '600',
        fill: UI.text,
        x: 14,
        y: 11,
        listening: false,
      })
    );
    header.on('click', () => {
      setState(group, { expandedIndex: i });
      group.emit('change', syntheticEvent('change', group, { value: i, section: sec.title }));
      group.getApp()?.requestRender();
    });
    group.add(header);
    if (i === expanded) {
      group.add(
        app.text({
          text: sec.content,
          x: 14,
          y: y + 46,
          fontSize: UI.fontSize,
          fill: UI.textSecondary,
          listening: false,
        })
      );
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
  const rowH = 36;
  const tableW = colW * columns.length;
  const tableH = rowH * (rows.length + 1);
  const group = createGroup(app, 'table', props, { focusable: true, role: 'grid' });

  group.add(
    app.roundedRect({
      width: tableW,
      height: tableH,
      cornerRadius: UI.radius,
      fill: UI.surface,
      stroke: UI.border,
      strokeWidth: 1,
      shadow: UI.shadowSm,
      listening: false,
    })
  );

  group.add(
    app.rect({
      width: tableW,
      height: rowH,
      fill: UI.surfaceMuted,
      stroke: null,
      listening: false,
    })
  );

  columns.forEach((col, ci) => {
    group.add(
      app.text({
        text: col.toUpperCase(),
        x: ci * colW + 14,
        y: 10,
        fontSize: UI.fontSizeSm,
        fontWeight: 'bold',
        fill: UI.textMuted,
        listening: false,
      })
    );
  });

  rows.forEach((row, ri) => {
    const rowY = (ri + 1) * rowH;
    if (ri % 2 === 1) {
      group.add(
        app.rect({
          width: tableW,
          height: rowH,
          y: rowY,
          fill: UI.surfaceMuted,
          opacity: 0.5,
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
          fontSize: UI.fontSize,
          fill: UI.text,
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
    header.add(app.text({ text: (expanded.has(i) ? '▼  ' : '▶  ') + node.label, fontSize: UI.fontSize, fontWeight: '600', fill: UI.text, listening: false }));
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
        group.add(
          app.text({
            text: '    ' + child.label,
            x: 8,
            y,
            fontSize: UI.fontSize,
            fill: UI.textSecondary,
            listening: false,
          })
        );
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
    const btnW = Math.max(label.length * 8 + 24, 68);
    const btn = createGroup(app, 'button', { label, width: btnW, height: 32, variant: 'ghost' }, { x, y: 0, focusable: true, role: 'button' });
    btn.add(
      app.roundedRect({
        width: btnW,
        height: 32,
        cornerRadius: UI.radiusSm,
        fill: UI.surface,
        stroke: UI.border,
        strokeWidth: 1,
        shadow: UI.shadowSm,
        listening: false,
      }),
      app.text({
        text: label,
        fontSize: UI.fontSizeSm,
        fontWeight: '600',
        fill: UI.textSecondary,
        x: 0,
        y: 8,
        textAlign: 'center',
      })
    );
    btn.on('click', () => {
      group.emit('select', syntheticEvent('select', group, { item: label }));
    });
    group.add(btn);
    x += btnW + 6;
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
  const tw = Math.max(message.length * 7 + 32, 160);
  group.add(
    app.roundedRect({
      width: tw,
      height: 40,
      cornerRadius: UI.radius,
      fill: '#1e293b',
      shadow: UI.shadowLg,
      listening: false,
    }),
    app.text({ text: message, fontSize: UI.fontSize, fill: UI.textInverse, x: 16, y: 11, listening: false })
  );
  setState(group, { message, duration, variant: props.variant ?? 'success' });
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
  const height = 28;
  const group = createGroup(app, 'statusBar', props, { role: 'status' });
  group.add(
    app.rect({
      width,
      height,
      fill: '#1e293b',
      stroke: '#334155',
      strokeWidth: 1,
      listening: false,
    })
  );
  const segW = width / segments.length;
  segments.forEach((seg, i) => {
    group.add(
      app.text({
        text: seg,
        x: i * segW + 12,
        y: 6,
        fontSize: UI.fontSizeSm,
        fill: '#94a3b8',
        listening: false,
      })
    );
  });
  setState(group, { segments, width });
  return group;
});
