/**
 * UI component factories — navigation.
 */
import type { Node } from '../../Node';
import { registerComponent } from '../registryCore';
import {
  bool,
  num,
  setParts,
  setState,
  syntheticEvent,
} from '../helpers';
import { UI, createGroup } from './shared';

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
