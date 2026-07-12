import type { App } from '../App';
import type { Node } from '../Node';
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
import { getActiveUi } from './resolveCanvasTheme';
import {
  hasCustomFontSize,
  hasCustomTextColor,
  resolveNodeTypography,
} from './nodeTheme';

/** Live canvas UI palette (synced from app theme). */
function UI() {
  return getActiveUi();
}

function createGroup(
  app: App,
  type: string,
  props: Record<string, unknown>,
  extra: Record<string, unknown> = {}
): Group {
  const extraMeta = (extra.metadata as Record<string, unknown> | undefined) ?? {};
  const extraState =
    extraMeta.componentState && typeof extraMeta.componentState === 'object'
      ? (extraMeta.componentState as Record<string, unknown>)
      : {};
  const { metadata: _ignored, ...extraRest } = extra;
  const group = app.group({
    ...(props as Record<string, unknown>),
    listening: true,
    ...extraRest,
    metadata: {
      componentType: type,
      ...extraMeta,
      // Keep props (including uiTheme) then factory-specific state
      componentState: { ...props, ...extraState },
    },
  }) as Group;
  bindApp(group, app);
  return group;
}

/** Shared canvas surface chrome — consistent radius, border, shadow across UI components */
function canvasSurface(
  app: App,
  width: number,
  height: number,
  opts: { radius?: number; elevated?: boolean } = {}
) {
  return app.roundedRect({
    width,
    height,
    cornerRadius: opts.radius ?? UI().radius,
    fill: UI().surface,
    stroke: UI().border,
    strokeWidth: 1,
    shadow: opts.elevated ? UI().shadowLg : UI().shadowSm,
    listening: false,
  });
}

/** Button — hover, active, disabled states */
registerComponent('button', (props, app) => {
  const width = num(props, 'width', 128);
  const size = str(props, 'size', 'md');
  const height =
    size === 'sm' ? 32 : size === 'lg' ? 44 : num(props, 'height', UI().controlHeight);
  const customFont = hasCustomFontSize(props);
  const customText = hasCustomTextColor(props);
  const typo = resolveNodeTypography(app, props, {
    text: UI().textInverse,
    textMuted: UI().textMuted,
    fontSize: UI().fontSize,
    fontSizeSm: UI().fontSizeSm,
    fontSizeLg: UI().fontSizeLg,
  });
  const fontSize = customFont
    ? typo.fontSize
    : size === 'sm'
      ? UI().fontSizeSm
      : size === 'lg'
        ? UI().fontSizeLg
        : UI().fontSize;
  const label = str(props, 'label', 'Button');
  const disabled = bool(props, 'disabled', false);
  const variant = str(props, 'variant', 'primary');
  const hasCustomFill = Boolean(str(props, 'fill', ''));
  const fill =
    str(props, 'fill', '') ||
    (variant === 'secondary' ? UI().secondary : variant === 'ghost' ? UI().surface : variant === 'danger' ? UI().danger : UI().primary);

  const group = createGroup(app, 'button', props, {
    focusable: !disabled,
    role: 'button',
    metadata: {
      componentType: 'button',
      label,
      componentState: {
        label,
        width,
        height,
        disabled,
        fill,
        variant,
        size,
        hasCustomFill,
        hasCustomFontSize: customFont,
        hasCustomColor: customText,
        fontSize: customFont ? fontSize : undefined,
        textColor: customText ? typo.text : undefined,
        color: props.color,
        uiTheme: props.uiTheme,
      },
    },
  });
  setState(group, {
    label,
    width,
    height,
    disabled,
    fill,
    variant,
    size,
    hasCustomFill,
    hasCustomFontSize: customFont,
    hasCustomColor: customText,
    fontSize: customFont ? fontSize : undefined,
    textColor: customText ? typo.text : undefined,
    color: props.color,
    uiTheme: props.uiTheme,
  });

  const textColor = customText
    ? typo.text
    : variant === 'ghost'
      ? UI().textSecondary
      : UI().textInverse;
  const bg = app.roundedRect({
    width,
    height,
    cornerRadius: UI().radius,
    fill: disabled ? UI().borderStrong : fill,
    stroke: variant === 'ghost' ? UI().border : null,
    strokeWidth: variant === 'ghost' ? 1 : 0,
    shadow: disabled ? null : variant === 'primary' || variant === 'danger' ? UI().shadowPrimary : UI().shadowSm,
  });
  const text = app.text({
    text: label,
    fontSize,
    fontWeight: '600',
    fill: disabled ? UI().textMuted : textColor,
    // Canvas textAlign centers on x — must be mid-button, not the left edge.
    x: width / 2,
    y: (height - fontSize) / 2,
    textAlign: 'center',
  });
  group.add(bg, text);
  setParts(group, { bg, text });

  wireButtonStates(group, ({ hover, active, disabled: dis }) => {
    const parts = getParts(group);
    const ui = UI();
    const st = getState(group);
    const v = String(st.variant ?? variant);
    if (dis) {
      (parts.bg as { fill: string }).fill = ui.borderStrong;
      return group.getApp()?.requestRender();
    }
    const base = st.hasCustomFill
      ? String(st.fill ?? fill)
      : v === 'secondary'
        ? ui.secondary
        : v === 'ghost'
          ? ui.surface
          : v === 'danger'
            ? ui.danger
            : ui.primary;
    const hoverColor =
      v === 'secondary'
        ? ui.secondaryHover
        : v === 'ghost'
          ? ui.surfaceInset
          : v === 'danger'
            ? '#b91c1c'
            : ui.primaryHover;
    const activeColor =
      v === 'secondary'
        ? ui.textSecondary
        : v === 'ghost'
          ? ui.surfaceMuted
          : v === 'danger'
            ? '#991b1b'
            : ui.primaryActive;
    (parts.bg as { fill: string }).fill = active ? activeColor : hover ? hoverColor : base;
    group.getApp()?.requestRender();
  });

  return group;
});

registerComponent('label', (props, app) => {
  const hasCustomColor = hasCustomTextColor(props);
  const hasCustomFs = hasCustomFontSize(props);
  const typo = resolveNodeTypography(app, props, {
    text: UI().textMuted,
    textMuted: UI().textMuted,
    fontSize: UI().fontSizeSm,
    fontSizeSm: UI().fontSizeSm,
    fontSizeLg: UI().fontSizeLg,
  });
  const fontSize = hasCustomFs ? typo.fontSize : typo.fontSizeSm;
  const node = app.text({
    text: str(props, 'text', ''),
    fontSize,
    fontWeight: str(props, 'fontWeight', '600'),
    fill: hasCustomColor ? typo.text : UI().textMuted,
    ...props,
  });
  // Re-apply after spread so props.fontSize/color do not fight resolved values incorrectly
  if (!hasCustomFs) (node as { fontSize: number }).fontSize = typo.fontSizeSm;
  else (node as { fontSize: number }).fontSize = typo.fontSize;
  if (!hasCustomColor) (node as { fill: string }).fill = UI().textMuted;
  else (node as { fill: string }).fill = typo.text;
  node.metadata.componentType = 'label';
  setState(node, {
    text: str(props, 'text', ''),
    fontSize,
    color: props.color,
    textColor: props.textColor,
    uiTheme: props.uiTheme,
    demoId: props.demoId,
    hasCustomColor,
    hasCustomFontSize: hasCustomFs,
  });
  if (props.demoId != null) node.metadata.demoId = props.demoId;
  return node;
});

registerComponent('card', (props, app) => {
  const width = num(props, 'width', 280);
  const height = num(props, 'height', 160);
  const title = props.title as string | undefined;
  const subtitle = str(props, 'subtitle', '');
  const elevated = bool(props, 'elevated', false);
  const group = createGroup(app, 'card', props);
  const bg = canvasSurface(app, width, height, { radius: UI().radiusLg, elevated });
  group.add(bg);
  const headerH = title || subtitle ? 40 : 0;
  let header: ReturnType<typeof app.roundedRect> | undefined;
  let titleNode: ReturnType<typeof app.text> | undefined;
  let subtitleNode: ReturnType<typeof app.text> | undefined;
  if (headerH > 0) {
    header = app.roundedRect({
      width,
      height: headerH,
      cornerRadius: UI().radiusLg,
      fill: UI().surfaceMuted,
      stroke: UI().border,
      strokeWidth: 1,
      listening: false,
    });
    group.add(header);
    if (title) {
      titleNode = app.text({
        text: String(title).toUpperCase(),
        fontSize: UI().fontSizeSm,
        fontWeight: '700',
        fill: UI().textMuted,
        x: 16,
        y: 12,
        listening: false,
      });
      group.add(titleNode);
    }
    if (subtitle) {
      subtitleNode = app.text({
        text: subtitle,
        fontSize: UI().fontSize,
        fontWeight: '500',
        fill: UI().textSecondary,
        x: 16,
        y: title ? 26 : 12,
        listening: false,
      });
      group.add(subtitleNode);
    }
  }
  setParts(group, {
    bg,
    ...(header ? { header } : {}),
    ...(titleNode ? { title: titleNode } : {}),
    ...(subtitleNode ? { subtitle: subtitleNode } : {}),
  });
  setState(group, { width, height, title: props.title, subtitle, actions: props.actions, elevated: props.elevated });
  return group;
});

registerComponent('progressBar', (props, app) => {
  const width = num(props, 'width', 200);
  const size = str(props, 'size', 'md');
  const height = size === 'lg' ? 12 : size === 'sm' ? 6 : num(props, 'height', 8);
  const value = clamp(num(props, 'value', 0), 0, 100);
  const variant = str(props, 'variant', 'default');
  const fillColor =
    variant === 'success'
      ? UI().success
      : variant === 'warning'
        ? UI().warning
        : variant === 'danger'
          ? UI().danger
          : str(props, 'fill', UI().primary);
  const group = createGroup(app, 'progressBar', props, {
    role: 'progressbar',
    ariaValueNow: value,
    ariaValueMin: 0,
    ariaValueMax: 100,
  });
  const track = app.roundedRect({ width, height, cornerRadius: height / 2, fill: UI().surfaceInset, listening: false });
  const fillBar = app.roundedRect({
    width: (width * value) / 100,
    height,
    cornerRadius: height / 2,
    fill: fillColor,
    listening: false,
  });
  group.add(track, fillBar);
  if (props.label) {
    group.add(
      app.text({
        text: props.label as string,
        fontSize: UI().fontSizeSm,
        fontWeight: '600',
        fill: UI().textSecondary,
        x: 0,
        y: -18,
        listening: false,
      })
    );
  }
  setParts(group, { track, fillBar });
  setState(group, { width, height, value, label: props.label, variant, size, disabled: props.disabled });
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

  const track = app.roundedRect({ width, height: 6, y: 12, cornerRadius: 3, fill: UI().surfaceInset, listening: false });
  const fill = app.roundedRect({ width: 0, height: 6, y: 12, cornerRadius: 3, fill: UI().primary, listening: false });
  const thumb = app.circle({
    x: 0,
    y: 12,
    radius: 10,
    fill: UI().surface,
    stroke: UI().primary,
    strokeWidth: 2,
    shadow: UI().shadowMd,
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
  setState(group, { width, min, max, value, label: props.label, disabled: props.disabled, size: props.size });

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
  const disabled = bool(props, 'disabled', false);
  const group = createGroup(app, 'checkbox', props, {
    focusable: !disabled,
    role: 'checkbox',
    ariaChecked: checked,
    metadata: { componentType: 'checkbox', label: props.label ?? 'Checkbox' },
  });

  const box = app.roundedRect({
    width: 20,
    height: 20,
    cornerRadius: 5,
    fill: disabled ? UI().surfaceMuted : checked ? UI().primary : UI().surface,
    stroke: disabled ? UI().border : checked ? UI().primary : UI().borderStrong,
    strokeWidth: 1.5,
    shadow: checked && !disabled ? UI().shadowSm : null,
    listening: false,
  });
  const mark = app.text({
    text: '✓',
    x: 4,
    y: 1,
    fontSize: 14,
    fontWeight: 'bold',
    fill: UI().textInverse,
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
        fontSize: UI().fontSize,
        fill: UI().textSecondary,
        listening: false,
      })
    );
  }
  setParts(group, { box, mark });
  setState(group, { checked, label: props.label, disabled, size: props.size });

  if (disabled) {
    group.opacity = 0.55;
    group.listening = false;
    return group;
  }

  wireToggle(group, 'checked', (v) => {
    (box as { fill: string; stroke: string }).fill = v ? UI().primary : UI().surface;
    (box as { stroke: string }).stroke = v ? UI().primary : UI().borderStrong;
    (mark as { visible: boolean }).visible = v;
    group.ariaChecked = v;
  });

  return group;
});

/** Toggle switch */
registerComponent('toggle', (props, app) => {
  const on = bool(props, 'value', false);
  const disabled = bool(props, 'disabled', false);
  const group = createGroup(app, 'toggle', props, {
    focusable: !disabled,
    role: 'switch',
    ariaChecked: on,
    metadata: { componentType: 'toggle', label: props.label ?? 'Toggle' },
  });

  const track = app.roundedRect({
    width: 48,
    height: 26,
    cornerRadius: 13,
    fill: disabled ? UI().border : on ? UI().primary : UI().borderStrong,
    listening: false,
  });
  const knob = app.circle({
    x: on ? 24 : 2,
    y: 3,
    radius: 10,
    fill: UI().surface,
    shadow: UI().shadowMd,
    listening: false,
  });
  group.add(track, knob);
  setParts(group, { track, knob });
  setState(group, { value: on, label: props.label, disabled, size: props.size });

  if (disabled) {
    group.opacity = 0.55;
    group.listening = false;
    return group;
  }

  wireToggle(group, 'value', (v) => {
    (track as { fill: string }).fill = v ? UI().primary : UI().borderStrong;
    (knob as { x: number }).x = v ? 24 : 2;
    group.ariaChecked = v;
  });

  return group;
});

/** Input — text field (native in HTML renderer) */
registerComponent('input', (props, app) => {
  const width = num(props, 'width', 240);
  const height = num(props, 'height', UI().inputHeight);
  const value = str(props, 'value', '');
  const placeholder = str(props, 'placeholder', '');
  const disabled = bool(props, 'disabled', false);
  const invalid = bool(props, 'invalid', false);
  const customFont = hasCustomFontSize(props);
  const customText = hasCustomTextColor(props);
  const typo = resolveNodeTypography(app, props, {
    text: UI().text,
    textMuted: UI().textPlaceholder,
    fontSize: UI().fontSize,
    fontSizeSm: UI().fontSizeSm,
    fontSizeLg: UI().fontSizeLg,
  });
  const fontSize = customFont ? typo.fontSize : UI().fontSize;
  const group = createGroup(app, 'input', props, {
    focusable: !disabled,
    role: 'textbox',
    metadata: { componentType: 'input', label: props.label ?? (placeholder || 'Input') },
  });
  const bg = app.roundedRect({
    width,
    height,
    cornerRadius: UI().radius,
    fill: disabled ? UI().surfaceMuted : UI().surface,
    stroke: invalid ? UI().danger : UI().border,
    strokeWidth: invalid ? 2 : 1,
    shadow: disabled ? null : UI().shadowSm,
    listening: false,
  });
  const text = app.text({
    text: value || placeholder,
    fontSize,
    fill: value
      ? customText
        ? typo.text
        : UI().text
      : UI().textPlaceholder,
    x: 12,
    y: (height - fontSize) / 2,
    listening: false,
  });
  group.add(bg, text);
  setParts(group, { bg, text });
  setState(group, {
    width,
    height,
    value,
    placeholder,
    label: props.label,
    disabled,
    invalid,
    error: props.error,
    hasCustomFontSize: customFont,
    hasCustomColor: customText,
    fontSize: customFont ? fontSize : undefined,
    textColor: customText ? typo.text : undefined,
    color: props.color,
    uiTheme: props.uiTheme,
  });
  if (disabled) group.opacity = 0.65;
  return group;
});

/** TextArea — multiline input */
registerComponent('textarea', (props, app) => {
  const width = num(props, 'width', 280);
  const height = num(props, 'height', 96);
  const value = str(props, 'value', '');
  const disabled = bool(props, 'disabled', false);
  const invalid = bool(props, 'invalid', false);
  const group = createGroup(app, 'textarea', props, {
    focusable: !disabled,
    role: 'textbox',
    metadata: { componentType: 'textarea', multiline: true },
  });
  const bg = app.roundedRect({
    width,
    height,
    cornerRadius: UI().radius,
    fill: disabled ? UI().surfaceMuted : UI().surface,
    stroke: invalid ? UI().danger : UI().border,
    strokeWidth: invalid ? 2 : 1,
    shadow: disabled ? null : UI().shadowSm,
    listening: false,
  });
  const text = app.text({
    text: value || str(props, 'placeholder', ''),
    fontSize: UI().fontSize,
    fill: value ? UI().text : UI().textPlaceholder,
    x: 12,
    y: 12,
    listening: false,
  });
  group.add(bg, text);
  setParts(group, { bg, text });
  setState(group, { width, height, value, rows: num(props, 'rows', 4), label: props.label, placeholder: props.placeholder, disabled, invalid, error: props.error });
  if (disabled) group.opacity = 0.65;
  return group;
});

/** Radio — group selection via metadata.group */
registerComponent('radio', (props, app) => {
  const selected = bool(props, 'selected', false);
  const disabled = bool(props, 'disabled', false);
  const groupName = str(props, 'group', 'default');
  const group = createGroup(app, 'radio', props, {
    focusable: !disabled,
    role: 'radio',
    ariaChecked: selected,
    metadata: { componentType: 'radio', group: groupName, label: props.label },
  });

  // Circle nodes draw with center at (radius, radius) in local space.
  const outer = app.circle({
    x: 0,
    y: 0,
    radius: 10,
    fill: disabled ? UI().surfaceMuted : UI().surface,
    stroke: disabled ? UI().border : selected ? UI().primary : UI().borderStrong,
    strokeWidth: selected ? 2 : 1.5,
    listening: false,
  });
  const inner = app.circle({
    x: 5,
    y: 5,
    radius: 5,
    fill: selected ? UI().primary : 'transparent',
    listening: false,
  });
  group.add(outer, inner);
  if (props.label) {
    group.add(
      app.text({
        text: props.label as string,
        x: 28,
        y: 3,
        fontSize: UI().fontSize,
        fill: UI().textSecondary,
        listening: false,
      })
    );
  }
  setParts(group, { outer, inner });
  setState(group, { selected, group: groupName, label: props.label, disabled, size: props.size });

  if (disabled) {
    group.opacity = 0.55;
    group.listening = false;
    return group;
  }

  group.on('click', () => {
    setState(group, { selected: true });
    group.ariaChecked = true;
    (inner as { fill: string }).fill = UI().primary;
    (outer as { stroke: string }).stroke = UI().primary;
    group.emit('change', syntheticEvent('change', group, { value: groupName, payload: groupName }));
    group.getApp()?.requestRender();
  });

  return group;
});

/** Tooltip — show on hover/focus */
registerComponent('tooltip', (props, app) => {
  const text = str(props, 'text', 'Tooltip');
  const anchor = str(props, 'anchor', 'Hover me');
  const placement = str(props, 'placement', 'bottom');
  const delay = num(props, 'delay', 0);
  const group = createGroup(app, 'tooltip', props, { visible: bool(props, 'visible', false), listening: true });
  const pad = 10;
  const tw = text.length * 7 + pad * 2;
  const bubbleY = placement === 'top' ? -36 : placement === 'right' ? 4 : 28;
  const bubbleX = placement === 'right' ? anchor.length * 7 + 12 : 0;
  const anchorText = app.text({
    text: anchor,
    fontSize: UI().fontSize,
    fill: UI().primary,
    x: 0,
    y: 4,
    listening: false,
  });
  const bg = app.roundedRect({
    width: tw,
    height: 32,
    cornerRadius: UI().radiusSm,
    fill: '#1e293b',
    shadow: UI().shadowMd,
    x: bubbleX,
    y: bubbleY,
    listening: false,
    visible: group.visible,
  });
  const label = app.text({
    text,
    fontSize: UI().fontSizeSm,
    fill: UI().textInverse,
    x: bubbleX + pad,
    y: bubbleY + 8,
    listening: false,
    visible: group.visible,
  });
  group.add(anchorText, bg, label);
  setParts(group, { anchor: anchorText, bg, label });
  setState(group, { text, anchor, placement, delay, visible: group.visible });

  let delayTimer: ReturnType<typeof setTimeout> | undefined;
  const show = () => {
    group.visible = true;
    bg.visible = true;
    label.visible = true;
    group.getApp()?.requestRender();
    group.emit('open', syntheticEvent('open', group));
  };
  const hide = () => {
    if (delayTimer !== undefined) clearTimeout(delayTimer);
    group.visible = false;
    bg.visible = false;
    label.visible = false;
    group.getApp()?.requestRender();
    group.emit('close', syntheticEvent('close', group));
  };

  group.on('mouseenter', () => {
    if (delay <= 0) show();
    else delayTimer = setTimeout(show, delay);
  });
  group.on('mouseleave', hide);

  return group;
});

/** Menu / Dropdown */
registerComponent('menu', (props, app) => {
  const items = (props.items as string[]) ?? ['Item 1', 'Item 2', 'Item 3'];
  const variants = (props.itemVariants as string[]) ?? [];
  const open = bool(props, 'open', false);
  const rowH = 32;
  const width = num(props, 'width', 180);
  const height = Math.min(items.length * rowH + 12, 248);

  const group = createGroup(app, 'menu', props, {
    focusable: true,
    role: 'menu',
    visible: open,
    metadata: { componentType: 'menu', label: props.label ?? 'Menu' },
  });

  const bg = app.roundedRect({
    width,
    height,
    cornerRadius: UI().radius,
    fill: UI().surface,
    stroke: UI().border,
    strokeWidth: 1,
    shadow: UI().shadowLg,
    listening: false,
  });
  group.add(bg);
  const isDanger = (item: string, i: number) =>
    variants[i] === 'danger' ||
    ['delete', 'remove', 'danger'].includes(item.toLowerCase());
  items.forEach((item, i) => {
    group.add(
      app.text({
        text: item,
        x: 14,
        y: 10 + i * rowH,
        fontSize: UI().fontSize,
        fill: isDanger(item, i) ? UI().danger : UI().text,
        listening: false,
      })
    );
  });
  setParts(group, { bg });
  setState(group, { items, open, width, selectedIndex: -1, triggerLabel: props.triggerLabel, itemVariants: variants });

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
    fill: UI().overlay,
    x: -num(props, 'x', 0),
    y: -num(props, 'y', 0),
    listening: true,
  });
  const panel = app.roundedRect({
    width,
    height,
    cornerRadius: UI().radiusLg,
    fill: UI().surface,
    stroke: UI().border,
    strokeWidth: 1,
    shadow: UI().shadowLg,
    x: 0,
    y: 0,
  });
  const titleText = app.text({
    text: title,
    fontSize: UI().fontSizeLg,
    fontWeight: 'bold',
    fill: UI().text,
    x: 20,
    y: 18,
  });
  const divider = app.rect({
    width: width - 40,
    height: 1,
    fill: UI().border,
    x: 20,
    y: 48,
    listening: false,
  });
  const bodyText = app.text({
    text: str(props, 'message', 'Are you sure you want to continue?'),
    fontSize: UI().fontSize,
    fill: UI().textSecondary,
    x: 20,
    y: 64,
    listening: false,
  });
  group.add(overlay, panel, titleText, divider, bodyText);
  setParts(group, { overlay, panel, titleText });
  setState(group, {
    open,
    title,
    message: str(props, 'message', 'Are you sure you want to continue?'),
    width,
    height,
    overlayWidth: num(props, 'overlayWidth', 800),
    overlayHeight: num(props, 'overlayHeight', 600),
  });

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
      cornerRadius: UI().radius,
      fill: UI().surface,
      stroke: UI().border,
      strokeWidth: 1,
      listening: false,
    })
  );
  group.add(
    app.roundedRect({
      width: tabW - 8,
      height: 2,
      x: activeTab * tabW + 4,
      y: tabH + 1,
      cornerRadius: 1,
      fill: UI().primary,
      listening: false,
    })
  );
  labels.forEach((label, i) => {
    const tab = app.group({ x: i * tabW + 4, y: 2, listening: true, focusable: true, metadata: { tabIndex: i } });
    const active = i === activeTab;
    tab.add(
      app.text({
        text: label,
        fontSize: UI().fontSize,
        fontWeight: active ? '600' : '500',
        fill: active ? UI().primary : UI().textMuted,
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
        cornerRadius: UI().radiusSm,
        fill: isOpen ? UI().primaryMuted : UI().surfaceMuted,
        stroke: UI().border,
        strokeWidth: 1,
        listening: false,
      }),
      app.text({
        text: (isOpen ? '▼  ' : '▶  ') + sec.title,
        fontSize: UI().fontSize,
        fontWeight: '600',
        fill: UI().text,
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
          fontSize: UI().fontSize,
          fill: UI().textSecondary,
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
  const width = num(props, 'width', colW * columns.length);
  const rowH = 36;
  const tableH = rowH * (rows.length + 1);
  const sortable = bool(props, 'sortable', false);
  const sortColumn = num(props, 'sortColumn', -1);
  const sortDirection = str(props, 'sortDirection', 'asc');
  const selectedRow = num(props, 'selectedRow', -1);
  const group = createGroup(app, 'table', props, { focusable: true, role: 'grid' });

  group.add(canvasSurface(app, width, tableH, { radius: UI().radius }));

  group.add(
    app.rect({
      width,
      height: rowH,
      fill: UI().surfaceMuted,
      stroke: null,
      listening: false,
    })
  );

  columns.forEach((col, ci) => {
    const sorted = sortable && sortColumn === ci;
    const arrow = sorted ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : sortable ? ' ⇅' : '';
    group.add(
      app.text({
        text: col.toUpperCase() + arrow,
        x: ci * colW + 14,
        y: 10,
        fontSize: UI().fontSizeSm,
        fontWeight: 'bold',
        fill: sorted ? UI().primary : UI().textMuted,
        listening: false,
      })
    );
  });

  rows.forEach((row, ri) => {
    const rowY = (ri + 1) * rowH;
    const zebra = ri % 2 === 1;
    const selected = ri === selectedRow;
    if (zebra || selected) {
      group.add(
        app.rect({
          width,
          height: rowH,
          y: rowY,
          fill: selected ? UI().primarySubtle : UI().surfaceMuted,
          opacity: selected ? 1 : 0.5,
          listening: false,
        })
      );
    }
    if (selected) {
      group.add(
        app.rect({
          width: 3,
          height: rowH,
          y: rowY,
          fill: UI().primary,
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
          fontSize: UI().fontSize,
          fill: selected ? UI().primary : UI().text,
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

  setState(group, {
    columns,
    rows,
    selectedRow,
    colWidth: colW,
    width,
    sortable,
    sortColumn,
    sortDirection,
    stickyHeader: bool(props, 'stickyHeader', true),
    maxHeight: num(props, 'maxHeight', 0),
  });
  return group;
});

/** Tree View */
registerComponent('tree', (props, app) => {
  const nodes = (props.nodes as { label: string; children?: { label: string }[] }[]) ?? [
    { label: 'Root', children: [{ label: 'Child A' }, { label: 'Child B' }] },
  ];
  const expanded = new Set<number>((props.expanded as number[]) ?? [0]);
  const selectedNode = str(props, 'selectedNode', '');
  const width = num(props, 'width', 220);
  const group = createGroup(app, 'tree', props, { focusable: true, role: 'tree' });
  let y = 4;

  nodes.forEach((node, i) => {
    const parentKey = `p${i}`;
    const parentSelected = selectedNode === parentKey;
    const header = app.group({ x: 0, y, listening: true, metadata: { treeKey: parentKey } });
    if (parentSelected) {
      header.add(
        app.roundedRect({
          width,
          height: 24,
          cornerRadius: UI().radiusSm,
          fill: UI().primarySubtle,
          listening: false,
        })
      );
    }
    header.add(
      app.text({
        text: (expanded.has(i) ? '▾  ' : '▸  ') + node.label,
        fontSize: UI().fontSize,
        fontWeight: '600',
        fill: parentSelected ? UI().primary : UI().text,
        x: 8,
        y: 4,
        listening: false,
      })
    );
    header.on('click', () => {
      if (expanded.has(i)) expanded.delete(i);
      else expanded.add(i);
      setState(group, { expanded: Array.from(expanded), selectedNode: parentKey });
      group.emit('change', syntheticEvent('change', group, { value: i }));
      group.getApp()?.requestRender();
    });
    group.add(header);
    y += 26;
    if (expanded.has(i) && node.children) {
      group.add(
        app.rect({
          x: 10,
          y,
          width: 1,
          height: node.children.length * 22,
          fill: UI().border,
          listening: false,
        })
      );
      node.children.forEach((child, ci) => {
        const key = `${parentKey}.c${ci}`;
        const leafSelected = selectedNode === key;
        const leaf = app.group({ x: 18, y, listening: true, metadata: { treeKey: key } });
        if (leafSelected) {
          leaf.add(
            app.roundedRect({
              width: width - 22,
              height: 22,
              cornerRadius: UI().radiusSm,
              fill: UI().primarySubtle,
              listening: false,
            })
          );
          leaf.add(
            app.rect({
              width: 3,
              height: 22,
              fill: UI().primary,
              listening: false,
            })
          );
        }
        leaf.add(
          app.text({
            text: child.label,
            x: leafSelected ? 10 : 8,
            y: 4,
            fontSize: UI().fontSize,
            fill: leafSelected ? UI().primary : UI().textSecondary,
            listening: false,
          })
        );
        leaf.on('click', (e: { stopPropagation?: () => void }) => {
          e.stopPropagation?.();
          setState(group, { selectedNode: key });
          group.emit('select', syntheticEvent('select', group, { item: child.label, value: key }));
          group.getApp()?.requestRender();
        });
        group.add(leaf);
        y += 22;
      });
    }
  });

  setState(group, { nodes, expanded: Array.from(expanded), selectedNode, width });
  return group;
});

/** Toolbar */
registerComponent('toolbar', (props, app) => {
  const rawItems = (props.items as (string | null)[]) ?? (props.buttons as string[]) ?? ['New', 'Open', 'Save'];
  const icons = (props.icons as string[]) ?? [];
  const group = createGroup(app, 'toolbar', props, { focusable: true, role: 'toolbar' });
  let x = 0;
  let iconIdx = 0;
  rawItems.forEach((item) => {
    if (item === '|' || item === null) {
      group.add(
        app.rect({
          x: x + 2,
          y: 6,
          width: 1,
          height: 20,
          fill: UI().border,
          listening: false,
        })
      );
      x += 8;
      return;
    }
    const icon = icons[iconIdx] ? `${icons[iconIdx]} ` : '';
    iconIdx += 1;
    const label = item;
    const btnW = Math.max((icon + label).length * 8 + 24, 68);
    const btn = createGroup(app, 'button', { label, width: btnW, height: 32, variant: 'ghost' }, { x, y: 0, focusable: true, role: 'button' });
    btn.add(
      app.roundedRect({
        width: btnW,
        height: 32,
        cornerRadius: UI().radiusSm,
        fill: UI().surface,
        stroke: UI().border,
        strokeWidth: 1,
        shadow: UI().shadowSm,
        listening: false,
      }),
      app.text({
        text: icon + label,
        fontSize: UI().fontSizeSm,
        fontWeight: '600',
        fill: UI().textSecondary,
        x: btnW / 2,
        y: 8,
        textAlign: 'center',
      })
    );
    btn.on('click', () => {
      group.emit('select', syntheticEvent('select', group, { item: label }));
    });
    group.add(btn);
    x += btnW + 4;
  });
  setState(group, { buttons: rawItems.filter((i) => i && i !== '|') as string[], items: rawItems, icons, width: props.width });
  return group;
});

/** Toast / Notification */
registerComponent('toast', (props, app) => {
  const message = str(props, 'message', 'Notification');
  const variant = str(props, 'variant', 'success');
  const position = str(props, 'position', '');
  const dismissible = bool(props, 'dismissible', true);
  const duration = num(props, 'duration', 3000);
  const fills: Record<string, string> = {
    success: UI().surfaceInset,
    error: UI().surfaceInset,
    warning: UI().surfaceInset,
    info: UI().primaryMuted,
  };
  const group = createGroup(app, 'toast', props, {
    role: 'status',
    ariaLive: 'polite',
    metadata: { componentType: 'toast', ariaLive: 'polite' },
  });
  const tw = Math.max(message.length * 7 + 32, 160);
  const bg = app.roundedRect({
    width: tw,
    height: 40,
    cornerRadius: UI().radius,
    fill: fills[variant] ?? fills.success,
    shadow: UI().shadowLg,
    listening: false,
  });
  const textNode = app.text({
    text: message,
    fontSize: UI().fontSize,
    fill: UI().textInverse,
    x: 16,
    y: 11,
    listening: false,
  });
  group.add(bg, textNode);
  setParts(group, { bg, text: textNode });
  setState(group, { message, duration, variant, position, dismissible });
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
  const primaryIndex = num(props, 'primaryIndex', 0);
  const mono = bool(props, 'mono', false);
  const group = createGroup(app, 'statusBar', props, { role: 'status' });
  const bg = app.rect({
    width,
    height,
    fill: UI().surfaceInset,
    stroke: UI().border,
    strokeWidth: 1,
    listening: false,
  });
  group.add(bg);
  const segW = width / segments.length;
  let primarySeg: ReturnType<typeof app.rect> | undefined;
  const texts: Node[] = [];
  segments.forEach((seg, i) => {
    if (i === primaryIndex) {
      primarySeg = app.rect({
        x: i * segW,
        y: 0,
        width: segW,
        height,
        fill: UI().primaryMuted,
        listening: false,
      });
      group.add(primarySeg);
    }
    const textNode = app.text({
      text: seg,
      x: i * segW + 12,
      y: 6,
      fontSize: mono ? 11 : UI().fontSizeSm,
      fontFamily: mono ? 'monospace' : UI().font,
      fontWeight: i === primaryIndex ? '600' : '500',
      fill: i === primaryIndex ? UI().text : UI().textMuted,
      listening: false,
    });
    group.add(textNode);
    texts.push(textNode);
  });
  setParts(group, {
    bg,
    ...(primarySeg ? { primarySeg } : {}),
    ...Object.fromEntries(texts.map((t, i) => [`seg${i}`, t])),
  });
  setState(group, { segments, width, primaryIndex, mono });
  return group;
});
