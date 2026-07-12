import type { App } from '../App';
import type { Group } from '../shapes/Group';
import {
  addAccentBar,
  addCaptionPill,
  addCardChrome,
  addEmphasisRing,
  addLeftStripe,
  addTopSheen,
} from './chrome';
import { DIAGRAM, getActiveDiagram } from './theme';

let measureCtx: CanvasRenderingContext2D | null = null;

function getMeasureCtx(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null;
  if (!measureCtx) {
    const canvas = document.createElement('canvas');
    measureCtx = canvas.getContext('2d');
  }
  return measureCtx;
}

/** Measure label width using canvas text metrics (falls back to heuristic in Node). */
export function measureTextWidth(
  text: string,
  fontSize: number,
  fontWeight: string | number = '600',
  fontFamily = getActiveDiagram().fontFamily
): number {
  const ctx = getMeasureCtx();
  if (!ctx) return text.length * fontSize * 0.55;
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  return ctx.measureText(text).width;
}

export function centerTextX(
  label: string,
  boxWidth: number,
  fontSize: number = getActiveDiagram().fontSize.base,
  fontWeight: string | number = '600',
  fontFamily = getActiveDiagram().fontFamily
): number {
  const w = measureTextWidth(label, fontSize, fontWeight, fontFamily);
  return Math.max(getActiveDiagram().spacing.sm, (boxWidth - w) / 2);
}

export interface BoxStyle {
  fill?: string;
  stroke?: string;
  cornerRadius?: number;
  strokeWidth?: number;
  shadow?: typeof DIAGRAM.shadow | typeof DIAGRAM.shadowSoft | null;
  accentColor?: string;
}

const defaultBoxStyle = (): Required<Pick<BoxStyle, 'strokeWidth' | 'shadow'>> => ({
  strokeWidth: getActiveDiagram().stroke.node,
  shadow: getActiveDiagram().shadowSoft,
});

/** Labeled rounded rectangle — shared node chrome for all diagram types. */
export function createLabeledBox(
  app: App,
  label: string,
  width: number,
  height: number,
  style: BoxStyle = {},
  textOpts: { fontSize?: number; fontWeight?: string; fill?: string; y?: number } = {}
): Group {
  const { strokeWidth, shadow } = defaultBoxStyle();
  const node = app.group();
  const fontSize = textOpts.fontSize ?? getActiveDiagram().fontSize.base;
  const radius = style.cornerRadius ?? getActiveDiagram().radii.md;

  addCardChrome(app, node, {
    width,
    height,
    cornerRadius: radius,
    fill: style.fill ?? getActiveDiagram().nodeFill,
    stroke: style.stroke ?? getActiveDiagram().nodeStroke,
    strokeWidth: style.strokeWidth ?? strokeWidth,
    shadow: style.shadow !== null ? (style.shadow ?? shadow) : null,
    accentColor: style.accentColor,
  });

  node.add(
    app.text({
      text: label,
      x: centerTextX(label, width, fontSize, textOpts.fontWeight ?? '600'),
      y: textOpts.y ?? height / 2 - fontSize / 2 - 1,
      fontSize,
      fontWeight: textOpts.fontWeight ?? '600',
      fontFamily: getActiveDiagram().fontFamily,
      fill: textOpts.fill ?? getActiveDiagram().nodeText,
      listening: false,
    })
  );
  return node;
}

/** Flowchart node: process, terminal (pill), or decision diamond. */
export function createFlowchartNode(
  app: App,
  label: string,
  type: 'start' | 'end' | 'decision' | 'process' | string
): Group {
  const width = 132;
  const height = 46;
  const isStart = type === 'start';
  const isEnd = type === 'end';
  const isTerminal = isStart || isEnd;
  const isDecision = type === 'decision';
  const node = app.group();

  const palette = isStart
    ? getActiveDiagram().flowchartStart
    : isEnd
      ? getActiveDiagram().flowchartEnd
      : isDecision
        ? getActiveDiagram().flowchartDecision
        : getActiveDiagram().flowchartProcess;

  if (isDecision) {
    node.add(
      app.polygon({
        points: [66, 2, 130, 23, 66, 44, 2, 23],
        fill: palette.stroke,
        stroke: null,
        opacity: 0.12,
        listening: false,
      })
    );
    node.add(
      app.polygon({
        points: [66, 2, 130, 23, 66, 44, 2, 23],
        fill: palette.fill,
        stroke: palette.stroke,
        strokeWidth: getActiveDiagram().stroke.nodeEmphasis,
        shadow: getActiveDiagram().shadowElevated,
        listening: false,
      })
    );
    const fs = getActiveDiagram().fontSize.sm;
    node.add(
      app.text({
        text: label,
        x: centerTextX(label, width, fs),
        y: 23 - fs / 2 - 1,
        fontSize: fs,
        fontWeight: '600',
        fontFamily: getActiveDiagram().fontFamily,
        fill: getActiveDiagram().nodeText,
        listening: false,
      })
    );
    return node;
  }

  node.add(
    app.roundedRect({
      width,
      height,
      cornerRadius: isTerminal ? getActiveDiagram().radii.pill : getActiveDiagram().radii.md,
      fill: palette.fill,
      stroke: palette.stroke,
      strokeWidth: getActiveDiagram().stroke.nodeEmphasis,
      shadow: isTerminal ? getActiveDiagram().shadowElevated : getActiveDiagram().shadowSoft,
      listening: false,
    })
  );
  if (!isTerminal) {
    addAccentBar(app, node, width, palette.accent, 3);
    addTopSheen(app, node, width, getActiveDiagram().radii.md);
  } else {
    node.add(
      app.roundedRect({
        x: 2,
        y: 2,
        width: width - 4,
        height: height - 4,
        cornerRadius: isTerminal ? getActiveDiagram().radii.pill - 2 : getActiveDiagram().radii.md,
        fill: null,
        stroke: palette.accent,
        strokeWidth: 1,
        opacity: 0.35,
        listening: false,
      })
    );
  }
  if (isTerminal) {
    node.add(
      app.text({
        text: label.toUpperCase(),
        x: centerTextX(label, width, getActiveDiagram().fontSize.sm),
        y: height / 2 - 6,
        fontSize: getActiveDiagram().fontSize.sm,
        fontWeight: '700',
        letterSpacing: 0.06,
        fontFamily: getActiveDiagram().fontFamily,
        fill: isStart ? palette.accent : getActiveDiagram().nodeText,
        listening: false,
      })
    );
  } else {
    node.add(
      app.text({
        text: label,
        x: centerTextX(label, width),
        y: height / 2 - 6,
        fontSize: getActiveDiagram().fontSize.base,
        fontWeight: '600',
        fontFamily: getActiveDiagram().fontFamily,
        fill: getActiveDiagram().nodeText,
        listening: false,
      })
    );
  }
  return node;
}

/** UML class box with header band and monospace members. */
export function createClassNode(
  app: App,
  name: string,
  attributes: string[],
  methods: string[]
): Group {
  const width = 172;
  const lineH = 17;
  const headerH = 32;
  const bodyLines = attributes.length + methods.length;
  const height = headerH + bodyLines * lineH + (methods.length > 0 && attributes.length > 0 ? 8 : 4);
  const node = app.group();

  addCardChrome(app, node, {
    width,
    height,
    cornerRadius: getActiveDiagram().radii.md,
    fill: getActiveDiagram().classFill,
    stroke: getActiveDiagram().classStroke,
    strokeWidth: getActiveDiagram().stroke.node,
    shadow: getActiveDiagram().shadowElevated,
    accentColor: getActiveDiagram().umlInheritance,
    sheen: false,
  });
  node.add(
    app.rect({
      x: 1,
      y: 1,
      width: width - 2,
      height: headerH - 1,
      fill: getActiveDiagram().classHeaderBg,
      stroke: null,
      listening: false,
    })
  );
  addTopSheen(app, node, width, getActiveDiagram().radii.md);
  node.add(
    app.text({
      text: name,
      x: getActiveDiagram().spacing.sm,
      y: 10,
      fontSize: getActiveDiagram().fontSize.lg,
      fontWeight: 'bold',
      fontStyle: 'italic',
      fontFamily: getActiveDiagram().fontFamily,
      fill: getActiveDiagram().classHeader,
      listening: false,
    })
  );
  node.add(
    app.line({
      x: 0,
      y: headerH,
      x2: width,
      y2: 0,
      stroke: getActiveDiagram().classDivider,
      strokeWidth: getActiveDiagram().stroke.label,
      listening: false,
    })
  );

  let y = headerH + 4;
  for (const attr of attributes) {
    node.add(
      app.text({
        text: attr,
        x: getActiveDiagram().spacing.sm,
        y,
        fontSize: getActiveDiagram().fontSize.md,
        fontFamily: getActiveDiagram().fontMono,
        fill: getActiveDiagram().classBody,
        listening: false,
      })
    );
    y += lineH;
  }
  if (methods.length > 0 && attributes.length > 0) {
    node.add(
      app.line({
        x: 0,
        y: y - 2,
        x2: width,
        y2: 0,
        stroke: getActiveDiagram().classDivider,
        strokeWidth: getActiveDiagram().stroke.label,
        listening: false,
      })
    );
    y += 4;
  }
  for (const method of methods) {
    node.add(
      app.text({
        text: method,
        x: getActiveDiagram().spacing.sm,
        y,
        fontSize: getActiveDiagram().fontSize.md,
        fontFamily: getActiveDiagram().fontMono,
        fill: getActiveDiagram().classBody,
        listening: false,
      })
    );
    y += lineH;
  }
  return node;
}

type NetworkType = 'router' | 'server' | 'switch' | 'client' | 'default';

const NETWORK_STYLES: Record<
  NetworkType,
  { fill: string; stroke: string; glyph: string; edge: string }
> = {
  router: getActiveDiagram().networkRouter,
  server: getActiveDiagram().networkServer,
  switch: getActiveDiagram().networkSwitch,
  client: getActiveDiagram().networkClient,
  default: getActiveDiagram().networkDefault,
};

function addNetworkGlyph(
  app: App,
  parent: Group,
  type: NetworkType,
  size: number,
  color: string
): void {
  const cx = size / 2;
  const cy = size / 2;
  if (type === 'router') {
    parent.add(
      app.line({ x: cx, y: 6, x2: 0, y2: -7, stroke: color, strokeWidth: 2, lineCap: 'round', listening: false })
    );
    parent.add(
      app.line({ x: cx - 5, y: 8, x2: 0, y2: -5, stroke: color, strokeWidth: 1.5, lineCap: 'round', listening: false })
    );
    parent.add(
      app.line({ x: cx + 5, y: 8, x2: 0, y2: -5, stroke: color, strokeWidth: 1.5, lineCap: 'round', listening: false })
    );
    parent.add(
      app.circle({ x: cx, y: cy + 2, radius: 10, fill: null, stroke: color, strokeWidth: 1.5, listening: false })
    );
  } else if (type === 'server') {
    for (let i = 0; i < 3; i++) {
      parent.add(
        app.roundedRect({
          x: cx - 13,
          y: cy - 11 + i * 9,
          width: 26,
          height: 7,
          cornerRadius: 2,
          fill: null,
          stroke: color,
          strokeWidth: 1.2,
          listening: false,
        })
      );
      parent.add(
        app.circle({ x: cx + 8, y: cy - 8 + i * 9, radius: 1.5, fill: color, listening: false })
      );
    }
  } else if (type === 'switch') {
    parent.add(
      app.roundedRect({
        x: cx - 14,
        y: cy - 6,
        width: 28,
        height: 12,
        cornerRadius: 2,
        fill: null,
        stroke: color,
        strokeWidth: 1.5,
        listening: false,
      })
    );
    for (let i = 0; i < 4; i++) {
      parent.add(
        app.circle({ x: cx - 9 + i * 6, y: cy, radius: 2, fill: color, listening: false })
      );
    }
  } else if (type === 'client') {
    parent.add(
      app.roundedRect({
        x: cx - 12,
        y: cy - 10,
        width: 24,
        height: 16,
        cornerRadius: 2,
        fill: null,
        stroke: color,
        strokeWidth: 1.5,
        listening: false,
      })
    );
    parent.add(
      app.line({
        x: cx - 6,
        y: cy + 6,
        x2: 12,
        y2: 0,
        stroke: color,
        strokeWidth: 1.5,
        lineCap: 'round',
        listening: false,
      })
    );
  } else {
    parent.add(
      app.circle({ x: cx, y: cy, radius: 12, fill: null, stroke: color, strokeWidth: 1.5, listening: false })
    );
  }
}

/** Network topology node with type icon and caption below. */
export function createNetworkNode(app: App, label: string, type: string): Group {
  const netType = (type in NETWORK_STYLES ? type : 'default') as NetworkType;
  const style = NETWORK_STYLES[netType];
  const size = netType === 'router' ? 52 : 44;
  const node = app.group();

  addCardChrome(app, node, {
    width: size,
    height: size,
    cornerRadius: netType === 'server' ? getActiveDiagram().radii.sm : size / 2,
    fill: style.fill,
    stroke: style.stroke,
    strokeWidth: getActiveDiagram().stroke.nodeEmphasis,
    shadow: getActiveDiagram().shadowElevated,
    sheen: netType === 'server',
  });
  node.add(
    app.circle({
      x: size / 2,
      y: size / 2,
      radius: size / 2 - 5,
      fill: null,
      stroke: style.stroke,
      strokeWidth: 1,
      opacity: 0.35,
      listening: false,
    })
  );
  addNetworkGlyph(app, node, netType, size, style.glyph);

  const labelW = Math.max(size, measureTextWidth(label, getActiveDiagram().fontSize.sm) + 16);
  const labelX = centerTextX(label, labelW, getActiveDiagram().fontSize.sm);
  const tw = measureTextWidth(label, getActiveDiagram().fontSize.sm);
  addCaptionPill(app, node, tw, labelX, size + getActiveDiagram().spacing.xs - 2, style.stroke);
  node.add(
    app.text({
      text: label,
      x: centerTextX(label, labelW, getActiveDiagram().fontSize.sm),
      y: size + getActiveDiagram().spacing.xs,
      fontSize: getActiveDiagram().fontSize.sm,
      fontWeight: '600',
      fontFamily: getActiveDiagram().fontFamily,
      fill: getActiveDiagram().nodeText,
      listening: false,
    })
  );
  return node;
}

/** Org-chart card with optional collapse control and tier-based accent. */
export function createOrgNode(
  app: App,
  name: string,
  role?: string,
  childCount = 0,
  collapsed = false,
  depth = 0
): { node: Group; indicator?: ReturnType<App['text']> } {
  const tier = getActiveDiagram().orgTier[Math.min(depth, getActiveDiagram().orgTier.length - 1)];
  const width = 156;
  const height = role ? 60 : 52;
  const node = app.group();

  addCardChrome(app, node, {
    width,
    height,
    cornerRadius: getActiveDiagram().radii.md,
    fill: tier.fill,
    stroke: tier.stroke,
    strokeWidth: getActiveDiagram().stroke.node,
    shadow: getActiveDiagram().shadowElevated,
    accentColor: tier.accent,
  });
  node.add(
    app.line({
      x: 3,
      y: 3,
      x2: 3,
      y2: height - 3,
      stroke: tier.accent,
      strokeWidth: 2,
      opacity: 0.5,
      lineCap: 'round',
      listening: false,
    })
  );
  node.add(
    app.text({
      text: name,
      x: getActiveDiagram().spacing.md,
      y: role ? 10 : 16,
      fontSize: getActiveDiagram().fontSize.lg,
      fontWeight: '600',
      fontFamily: getActiveDiagram().fontFamily,
      fill: getActiveDiagram().nodeText,
      listening: false,
    })
  );
  if (role) {
    node.add(
      app.text({
        text: role,
        x: getActiveDiagram().spacing.md,
        y: 32,
        fontSize: getActiveDiagram().fontSize.sm,
        fontFamily: getActiveDiagram().fontFamily,
        fill: getActiveDiagram().orgRole,
        listening: false,
      })
    );
  }

  let indicator;
  if (childCount > 0) {
    node.add(
      app.roundedRect({
        x: width - 28,
        y: 12,
        width: 20,
        height: 20,
        cornerRadius: getActiveDiagram().radii.sm,
        fill: getActiveDiagram().orgToggleBg,
        stroke: getActiveDiagram().labelPillStroke,
        strokeWidth: getActiveDiagram().stroke.label,
        listening: false,
      })
    );
    indicator = app.text({
      text: collapsed ? `+${childCount}` : '−',
      x: width - 23,
      y: 15,
      fontSize: getActiveDiagram().fontSize.base,
      fontWeight: 'bold',
      fontFamily: getActiveDiagram().fontFamily,
      fill: getActiveDiagram().orgToggle,
    });
    node.add(indicator);
  }
  return { node, indicator };
}

/** Pipeline stage with left status stripe. */
export function createPipelineStage(
  app: App,
  label: string,
  status: 'pending' | 'active' | 'done' | 'error' | string
): Group {
  const colors: Record<string, { fill: string; stroke: string }> = {
    pending: { fill: getActiveDiagram().pipelinePendingFill, stroke: getActiveDiagram().pipelinePending },
    active: { fill: getActiveDiagram().pipelineActiveFill, stroke: getActiveDiagram().pipelineActive },
    done: { fill: getActiveDiagram().pipelineDoneFill, stroke: getActiveDiagram().pipelineDone },
    error: { fill: getActiveDiagram().pipelineErrorFill, stroke: getActiveDiagram().pipelineErrorStroke },
  };
  const c = colors[status] ?? colors.pending;
  const width = 118;
  const height = 50;
  const node = app.group();
  const statusLabels: Record<string, string> = {
    pending: 'WAIT',
    active: 'RUN',
    done: 'DONE',
    error: 'FAIL',
  };

  if (status === 'active') {
    addEmphasisRing(app, node, width, height, c.stroke, getActiveDiagram().radii.md);
  }

  addCardChrome(app, node, {
    width,
    height,
    cornerRadius: getActiveDiagram().radii.md,
    fill: c.fill,
    stroke: c.stroke,
    strokeWidth: getActiveDiagram().stroke.node,
    shadow: status === 'active' ? getActiveDiagram().shadowElevated : getActiveDiagram().shadowSoft,
    sheen: false,
  });
  addLeftStripe(app, node, height, c.stroke, 4);
  const badgeW = 34;
  node.add(
    app.roundedRect({
      x: getActiveDiagram().spacing.sm,
      y: height / 2 - 9,
      width: badgeW,
      height: 18,
      cornerRadius: getActiveDiagram().radii.sm,
      fill: c.stroke,
      stroke: null,
      opacity: status === 'pending' ? 0.35 : 0.9,
      listening: false,
    })
  );
  node.add(
    app.text({
      text: statusLabels[status] ?? 'WAIT',
      x: getActiveDiagram().spacing.sm + 5,
      y: height / 2 - 7,
      fontSize: getActiveDiagram().fontSize.xs,
      fontWeight: '700',
      letterSpacing: 0.04,
      fontFamily: getActiveDiagram().fontFamily,
      fill: status === 'pending' ? getActiveDiagram().nodeTextMuted : '#fff',
      listening: false,
    })
  );
  node.add(
    app.text({
      text: label,
      x: getActiveDiagram().spacing.sm + badgeW + 6,
      y: height / 2 - 7,
      fontSize: getActiveDiagram().fontSize.base,
      fontWeight: '600',
      fontFamily: getActiveDiagram().fontFamily,
      fill: getActiveDiagram().nodeText,
      listening: false,
    })
  );
  return node;
}

/** State machine node: initial, final, or normal. */
export function createStateNode(
  app: App,
  label: string,
  type: 'initial' | 'final' | 'normal' | string
): Group {
  const radius = 32;
  const node = app.group();
  const isFinal = type === 'final';
  const isInitial = type === 'initial';

  if (isFinal) {
    node.add(
      app.circle({
        x: radius - 6,
        y: radius - 6,
        radius: radius + 1,
        fill: null,
        stroke: getActiveDiagram().stateFinalStroke,
        strokeWidth: 1,
        opacity: 0.35,
        listening: false,
      })
    );
    node.add(
      app.circle({
        x: radius - 6,
        y: radius - 6,
        radius: radius - 2,
        fill: getActiveDiagram().stateFinalFill,
        stroke: getActiveDiagram().stateFinalStroke,
        strokeWidth: getActiveDiagram().stroke.nodeEmphasis,
        shadow: getActiveDiagram().shadowElevated,
        listening: false,
      })
    );
    node.add(
      app.circle({
        x: radius - 6,
        y: radius - 6,
        radius: radius - 9,
        fill: null,
        stroke: getActiveDiagram().stateFinalStroke,
        strokeWidth: getActiveDiagram().stroke.node,
        listening: false,
      })
    );
    if (label) {
      const fs = getActiveDiagram().fontSize.sm;
      node.add(
        app.text({
          text: label,
          x: centerTextX(label, radius * 2 - 4, fs),
          y: radius * 2 - 6,
          fontSize: fs,
          fontWeight: '600',
          fontFamily: getActiveDiagram().fontFamily,
          fill: getActiveDiagram().stateFinalStroke,
          listening: false,
        })
      );
    }
    return node;
  }

  if (isInitial) {
    const w = radius * 2 - 4;
    const h = radius * 2 - 4;
    addCardChrome(app, node, {
      width: w,
      height: h,
      cornerRadius: h / 2,
      fill: getActiveDiagram().stateInitialFill,
      stroke: getActiveDiagram().stateInitialStroke,
      strokeWidth: getActiveDiagram().stroke.nodeEmphasis,
      shadow: getActiveDiagram().shadowElevated,
      sheen: false,
    });
    node.add(
      app.circle({
        x: 14,
        y: h / 2,
        radius: 6,
        fill: getActiveDiagram().stateInitialStroke,
        stroke: null,
        listening: false,
      })
    );
  } else {
    const w = radius * 2 - 4;
    addCardChrome(app, node, {
      width: w,
      height: w,
      cornerRadius: getActiveDiagram().radii.lg,
      fill: getActiveDiagram().stateFill,
      stroke: getActiveDiagram().stateStroke,
      strokeWidth: getActiveDiagram().stroke.nodeEmphasis,
      shadow: getActiveDiagram().shadowSoft,
      accentColor: getActiveDiagram().stateStroke,
    });
  }

  const fs = getActiveDiagram().fontSize.md;
  const boxW = radius * 2 - 4;
  node.add(
    app.text({
      text: label,
      x: isInitial ? 26 : centerTextX(label, boxW, fs),
      y: radius - fs / 2 - 3,
      fontSize: fs,
      fontWeight: '600',
      fontFamily: getActiveDiagram().fontFamily,
      fill: getActiveDiagram().nodeText,
      listening: false,
    })
  );
  return node;
}

/** CAN bus ECU card with bus tap connector. */
export function createCanEcuNode(
  app: App,
  label: string,
  address: string | undefined,
  color: string,
  strokeWidth: number = getActiveDiagram().stroke.node
): Group {
  const width = 88;
  const height = 56;
  const ecuGroup = app.group();

  addCardChrome(app, ecuGroup, {
    width,
    height,
    cornerRadius: getActiveDiagram().radii.md,
    fill: getActiveDiagram().nodeFill,
    stroke: color,
    strokeWidth,
    shadow: getActiveDiagram().shadowElevated,
    accentColor: color,
  });
  ecuGroup.add(
    app.text({
      text: label,
      x: getActiveDiagram().spacing.sm,
      y: 12,
      fontSize: getActiveDiagram().fontSize.md,
      fill: getActiveDiagram().nodeText,
      fontWeight: 'bold',
      fontFamily: getActiveDiagram().fontFamily,
      listening: false,
    })
  );
  if (address) {
    ecuGroup.add(
      app.text({
        text: address,
        x: getActiveDiagram().spacing.sm,
        y: 30,
        fontSize: getActiveDiagram().fontSize.xs,
        fontFamily: getActiveDiagram().fontMono,
        fill: getActiveDiagram().edgeLabel,
        listening: false,
      })
    );
  }
  ecuGroup.add(
    app.circle({
      x: 44,
      y: 0,
      radius: 3,
      fill: color,
      stroke: getActiveDiagram().surface,
      strokeWidth: 1,
      listening: false,
    })
  );
  ecuGroup.add(
    app.line({
      x: 44,
      y: 0,
      x2: 0,
      y2: -14,
      stroke: color,
      strokeWidth: 2.5,
      lineCap: 'round',
      listening: false,
    })
  );
  return ecuGroup;
}

/** Edge label pill for connectors. */
export function createEdgeLabel(
  app: App,
  text: string,
  x: number,
  y: number,
  accentStroke: string = getActiveDiagram().edge
): Group {
  const fontSize = getActiveDiagram().fontSize.sm;
  const tw = measureTextWidth(text, fontSize, '600');
  const padX = 8;
  const padY = 4;
  const pw = tw + padX * 2;
  const ph = fontSize + padY * 2;
  const g = app.group({ listening: false });
  g.add(
    app.roundedRect({
      x: x - pw / 2,
      y: y - ph / 2,
      width: pw,
      height: ph,
      cornerRadius: getActiveDiagram().radii.sm,
      fill: getActiveDiagram().labelPillFill,
      stroke: accentStroke,
      strokeWidth: getActiveDiagram().stroke.label,
      shadow: getActiveDiagram().shadowSoft,
      listening: false,
    })
  );
  g.add(
    app.text({
      text,
      x: x - tw / 2,
      y: y - fontSize / 2 - 1,
      fontSize,
      fontWeight: '600',
      fontFamily: getActiveDiagram().fontFamily,
      fill: getActiveDiagram().edgeLabel,
      listening: false,
    })
  );
  return g;
}
