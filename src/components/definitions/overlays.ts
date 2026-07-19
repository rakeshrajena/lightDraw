/**
 * UI component factories — overlays.
 */
import { registerComponent } from '../registryCore';
import {
  bool,
  getState,
  num,
  setParts,
  setState,
  str,
  syntheticEvent,
} from '../helpers';
import {
  scheduleAutoDismiss,
  trapFocusIn,
  wireSelectFromList,
} from '../interaction';
import { UI, createGroup } from './shared';

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
