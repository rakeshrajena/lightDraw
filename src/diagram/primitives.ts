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
import { DIAGRAM } from './theme';

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
  fontFamily = DIAGRAM.fontFamily
): number {
  const ctx = getMeasureCtx();
  if (!ctx) return text.length * fontSize * 0.55;
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  return ctx.measureText(text).width;
}

export function centerTextX(
  label: string,
  boxWidth: number,
  fontSize: number = DIAGRAM.fontSize.base,
  fontWeight: string | number = '600',
  fontFamily = DIAGRAM.fontFamily
): number {
  const w = measureTextWidth(label, fontSize, fontWeight, fontFamily);
  return Math.max(DIAGRAM.spacing.sm, (boxWidth - w) / 2);
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
  strokeWidth: DIAGRAM.stroke.node,
  shadow: DIAGRAM.shadowSoft,
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
  const fontSize = textOpts.fontSize ?? DIAGRAM.fontSize.base;
  const radius = style.cornerRadius ?? DIAGRAM.radii.md;

  addCardChrome(app, node, {
    width,
    height,
    cornerRadius: radius,
    fill: style.fill ?? DIAGRAM.nodeFill,
    stroke: style.stroke ?? DIAGRAM.nodeStroke,
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
      fontFamily: DIAGRAM.fontFamily,
      fill: textOpts.fill ?? DIAGRAM.nodeText,
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
    ? DIAGRAM.flowchartStart
    : isEnd
      ? DIAGRAM.flowchartEnd
      : isDecision
        ? DIAGRAM.flowchartDecision
        : DIAGRAM.flowchartProcess;

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
        strokeWidth: DIAGRAM.stroke.nodeEmphasis,
        shadow: DIAGRAM.shadowElevated,
        listening: false,
      })
    );
    const fs = DIAGRAM.fontSize.sm;
    node.add(
      app.text({
        text: label,
        x: centerTextX(label, width, fs),
        y: 23 - fs / 2 - 1,
        fontSize: fs,
        fontWeight: '600',
        fontFamily: DIAGRAM.fontFamily,
        fill: DIAGRAM.nodeText,
        listening: false,
      })
    );
    return node;
  }

  node.add(
    app.roundedRect({
      width,
      height,
      cornerRadius: isTerminal ? DIAGRAM.radii.pill : DIAGRAM.radii.md,
      fill: palette.fill,
      stroke: palette.stroke,
      strokeWidth: DIAGRAM.stroke.nodeEmphasis,
      shadow: isTerminal ? DIAGRAM.shadowElevated : DIAGRAM.shadowSoft,
      listening: false,
    })
  );
  if (!isTerminal) {
    addAccentBar(app, node, width, palette.accent, 3);
    addTopSheen(app, node, width, DIAGRAM.radii.md);
  } else {
    node.add(
      app.roundedRect({
        x: 2,
        y: 2,
        width: width - 4,
        height: height - 4,
        cornerRadius: isTerminal ? DIAGRAM.radii.pill - 2 : DIAGRAM.radii.md,
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
        x: centerTextX(label, width, DIAGRAM.fontSize.sm),
        y: height / 2 - 6,
        fontSize: DIAGRAM.fontSize.sm,
        fontWeight: '700',
        letterSpacing: 0.06,
        fontFamily: DIAGRAM.fontFamily,
        fill: isStart ? palette.accent : DIAGRAM.nodeText,
        listening: false,
      })
    );
  } else {
    node.add(
      app.text({
        text: label,
        x: centerTextX(label, width),
        y: height / 2 - 6,
        fontSize: DIAGRAM.fontSize.base,
        fontWeight: '600',
        fontFamily: DIAGRAM.fontFamily,
        fill: DIAGRAM.nodeText,
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
    cornerRadius: DIAGRAM.radii.md,
    fill: DIAGRAM.classFill,
    stroke: DIAGRAM.classStroke,
    strokeWidth: DIAGRAM.stroke.node,
    shadow: DIAGRAM.shadowElevated,
    accentColor: DIAGRAM.umlInheritance,
    sheen: false,
  });
  node.add(
    app.rect({
      x: 1,
      y: 1,
      width: width - 2,
      height: headerH - 1,
      fill: DIAGRAM.classHeaderBg,
      stroke: null,
      listening: false,
    })
  );
  addTopSheen(app, node, width, DIAGRAM.radii.md);
  node.add(
    app.text({
      text: name,
      x: DIAGRAM.spacing.sm,
      y: 10,
      fontSize: DIAGRAM.fontSize.lg,
      fontWeight: 'bold',
      fontStyle: 'italic',
      fontFamily: DIAGRAM.fontFamily,
      fill: DIAGRAM.classHeader,
      listening: false,
    })
  );
  node.add(
    app.line({
      x: 0,
      y: headerH,
      x2: width,
      y2: 0,
      stroke: DIAGRAM.classDivider,
      strokeWidth: DIAGRAM.stroke.label,
      listening: false,
    })
  );

  let y = headerH + 4;
  for (const attr of attributes) {
    node.add(
      app.text({
        text: attr,
        x: DIAGRAM.spacing.sm,
        y,
        fontSize: DIAGRAM.fontSize.md,
        fontFamily: DIAGRAM.fontMono,
        fill: DIAGRAM.classBody,
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
        stroke: DIAGRAM.classDivider,
        strokeWidth: DIAGRAM.stroke.label,
        listening: false,
      })
    );
    y += 4;
  }
  for (const method of methods) {
    node.add(
      app.text({
        text: method,
        x: DIAGRAM.spacing.sm,
        y,
        fontSize: DIAGRAM.fontSize.md,
        fontFamily: DIAGRAM.fontMono,
        fill: DIAGRAM.classBody,
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
  router: DIAGRAM.networkRouter,
  server: DIAGRAM.networkServer,
  switch: DIAGRAM.networkSwitch,
  client: DIAGRAM.networkClient,
  default: DIAGRAM.networkDefault,
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
    cornerRadius: netType === 'server' ? DIAGRAM.radii.sm : size / 2,
    fill: style.fill,
    stroke: style.stroke,
    strokeWidth: DIAGRAM.stroke.nodeEmphasis,
    shadow: DIAGRAM.shadowElevated,
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

  const labelW = Math.max(size, measureTextWidth(label, DIAGRAM.fontSize.sm) + 16);
  const labelX = centerTextX(label, labelW, DIAGRAM.fontSize.sm);
  const tw = measureTextWidth(label, DIAGRAM.fontSize.sm);
  addCaptionPill(app, node, tw, labelX, size + DIAGRAM.spacing.xs - 2, style.stroke);
  node.add(
    app.text({
      text: label,
      x: centerTextX(label, labelW, DIAGRAM.fontSize.sm),
      y: size + DIAGRAM.spacing.xs,
      fontSize: DIAGRAM.fontSize.sm,
      fontWeight: '600',
      fontFamily: DIAGRAM.fontFamily,
      fill: DIAGRAM.nodeText,
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
  const tier = DIAGRAM.orgTier[Math.min(depth, DIAGRAM.orgTier.length - 1)];
  const width = 156;
  const height = role ? 60 : 52;
  const node = app.group();

  addCardChrome(app, node, {
    width,
    height,
    cornerRadius: DIAGRAM.radii.md,
    fill: tier.fill,
    stroke: tier.stroke,
    strokeWidth: DIAGRAM.stroke.node,
    shadow: DIAGRAM.shadowElevated,
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
      x: DIAGRAM.spacing.md,
      y: role ? 10 : 16,
      fontSize: DIAGRAM.fontSize.lg,
      fontWeight: '600',
      fontFamily: DIAGRAM.fontFamily,
      fill: DIAGRAM.nodeText,
      listening: false,
    })
  );
  if (role) {
    node.add(
      app.text({
        text: role,
        x: DIAGRAM.spacing.md,
        y: 32,
        fontSize: DIAGRAM.fontSize.sm,
        fontFamily: DIAGRAM.fontFamily,
        fill: DIAGRAM.orgRole,
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
        cornerRadius: DIAGRAM.radii.sm,
        fill: DIAGRAM.orgToggleBg,
        stroke: DIAGRAM.labelPillStroke,
        strokeWidth: DIAGRAM.stroke.label,
        listening: false,
      })
    );
    indicator = app.text({
      text: collapsed ? `+${childCount}` : '−',
      x: width - 23,
      y: 15,
      fontSize: DIAGRAM.fontSize.base,
      fontWeight: 'bold',
      fontFamily: DIAGRAM.fontFamily,
      fill: DIAGRAM.orgToggle,
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
    pending: { fill: DIAGRAM.pipelinePendingFill, stroke: DIAGRAM.pipelinePending },
    active: { fill: DIAGRAM.pipelineActiveFill, stroke: DIAGRAM.pipelineActive },
    done: { fill: DIAGRAM.pipelineDoneFill, stroke: DIAGRAM.pipelineDone },
    error: { fill: DIAGRAM.pipelineErrorFill, stroke: DIAGRAM.pipelineErrorStroke },
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
    addEmphasisRing(app, node, width, height, c.stroke, DIAGRAM.radii.md);
  }

  addCardChrome(app, node, {
    width,
    height,
    cornerRadius: DIAGRAM.radii.md,
    fill: c.fill,
    stroke: c.stroke,
    strokeWidth: DIAGRAM.stroke.node,
    shadow: status === 'active' ? DIAGRAM.shadowElevated : DIAGRAM.shadowSoft,
    sheen: false,
  });
  addLeftStripe(app, node, height, c.stroke, 4);
  const badgeW = 34;
  node.add(
    app.roundedRect({
      x: DIAGRAM.spacing.sm,
      y: height / 2 - 9,
      width: badgeW,
      height: 18,
      cornerRadius: DIAGRAM.radii.sm,
      fill: c.stroke,
      stroke: null,
      opacity: status === 'pending' ? 0.35 : 0.9,
      listening: false,
    })
  );
  node.add(
    app.text({
      text: statusLabels[status] ?? 'WAIT',
      x: DIAGRAM.spacing.sm + 5,
      y: height / 2 - 7,
      fontSize: DIAGRAM.fontSize.xs,
      fontWeight: '700',
      letterSpacing: 0.04,
      fontFamily: DIAGRAM.fontFamily,
      fill: status === 'pending' ? DIAGRAM.nodeTextMuted : '#fff',
      listening: false,
    })
  );
  node.add(
    app.text({
      text: label,
      x: DIAGRAM.spacing.sm + badgeW + 6,
      y: height / 2 - 7,
      fontSize: DIAGRAM.fontSize.base,
      fontWeight: '600',
      fontFamily: DIAGRAM.fontFamily,
      fill: DIAGRAM.nodeText,
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
        stroke: DIAGRAM.stateFinalStroke,
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
        fill: DIAGRAM.stateFinalFill,
        stroke: DIAGRAM.stateFinalStroke,
        strokeWidth: DIAGRAM.stroke.nodeEmphasis,
        shadow: DIAGRAM.shadowElevated,
        listening: false,
      })
    );
    node.add(
      app.circle({
        x: radius - 6,
        y: radius - 6,
        radius: radius - 9,
        fill: null,
        stroke: DIAGRAM.stateFinalStroke,
        strokeWidth: DIAGRAM.stroke.node,
        listening: false,
      })
    );
    if (label) {
      const fs = DIAGRAM.fontSize.sm;
      node.add(
        app.text({
          text: label,
          x: centerTextX(label, radius * 2 - 4, fs),
          y: radius * 2 - 6,
          fontSize: fs,
          fontWeight: '600',
          fontFamily: DIAGRAM.fontFamily,
          fill: DIAGRAM.stateFinalStroke,
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
      fill: DIAGRAM.stateInitialFill,
      stroke: DIAGRAM.stateInitialStroke,
      strokeWidth: DIAGRAM.stroke.nodeEmphasis,
      shadow: DIAGRAM.shadowElevated,
      sheen: false,
    });
    node.add(
      app.circle({
        x: 14,
        y: h / 2,
        radius: 6,
        fill: DIAGRAM.stateInitialStroke,
        stroke: null,
        listening: false,
      })
    );
  } else {
    const w = radius * 2 - 4;
    addCardChrome(app, node, {
      width: w,
      height: w,
      cornerRadius: DIAGRAM.radii.lg,
      fill: DIAGRAM.stateFill,
      stroke: DIAGRAM.stateStroke,
      strokeWidth: DIAGRAM.stroke.nodeEmphasis,
      shadow: DIAGRAM.shadowSoft,
      accentColor: DIAGRAM.stateStroke,
    });
  }

  const fs = DIAGRAM.fontSize.md;
  const boxW = radius * 2 - 4;
  node.add(
    app.text({
      text: label,
      x: isInitial ? 26 : centerTextX(label, boxW, fs),
      y: radius - fs / 2 - 3,
      fontSize: fs,
      fontWeight: '600',
      fontFamily: DIAGRAM.fontFamily,
      fill: DIAGRAM.nodeText,
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
  strokeWidth: number = DIAGRAM.stroke.node
): Group {
  const width = 88;
  const height = 56;
  const ecuGroup = app.group();

  addCardChrome(app, ecuGroup, {
    width,
    height,
    cornerRadius: DIAGRAM.radii.md,
    fill: DIAGRAM.nodeFill,
    stroke: color,
    strokeWidth,
    shadow: DIAGRAM.shadowElevated,
    accentColor: color,
  });
  ecuGroup.add(
    app.text({
      text: label,
      x: DIAGRAM.spacing.sm,
      y: 12,
      fontSize: DIAGRAM.fontSize.md,
      fill: DIAGRAM.nodeText,
      fontWeight: 'bold',
      fontFamily: DIAGRAM.fontFamily,
      listening: false,
    })
  );
  if (address) {
    ecuGroup.add(
      app.text({
        text: address,
        x: DIAGRAM.spacing.sm,
        y: 30,
        fontSize: DIAGRAM.fontSize.xs,
        fontFamily: DIAGRAM.fontMono,
        fill: DIAGRAM.edgeLabel,
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
      stroke: DIAGRAM.surface,
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
  accentStroke: string = DIAGRAM.edge
): Group {
  const fontSize = DIAGRAM.fontSize.sm;
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
      cornerRadius: DIAGRAM.radii.sm,
      fill: DIAGRAM.labelPillFill,
      stroke: accentStroke,
      strokeWidth: DIAGRAM.stroke.label,
      shadow: DIAGRAM.shadowSoft,
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
      fontFamily: DIAGRAM.fontFamily,
      fill: DIAGRAM.edgeLabel,
      listening: false,
    })
  );
  return g;
}
