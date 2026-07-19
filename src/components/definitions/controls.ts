/**
 * UI component factories — controls.
 */
import { registerComponent } from '../registryCore';
import {
  bool,
  clamp,
  getParts,
  getState,
  num,
  setParts,
  setState,
  str,
  syntheticEvent,
} from '../helpers';
import {
  wireButtonStates,
  wirePointerDrag,
  wireToggle,
} from '../interaction';
import {
  hasCustomFontSize,
  hasCustomTextColor,
  resolveNodeTypography,
} from '../nodeTheme';
import { UI, createGroup, canvasSurface } from './shared';

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
