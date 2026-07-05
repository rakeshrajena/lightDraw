import type { App } from '../App';
import type { Group } from '../shapes/Group';
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
}

const defaultBoxStyle = (): Required<Pick<BoxStyle, 'strokeWidth' | 'shadow'>> => ({
  strokeWidth: 1.5,
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

  node.add(
    app.roundedRect({
      width,
      height,
      cornerRadius: style.cornerRadius ?? DIAGRAM.radii.md,
      fill: style.fill ?? DIAGRAM.nodeFill,
      stroke: style.stroke ?? DIAGRAM.nodeStroke,
      strokeWidth: style.strokeWidth ?? strokeWidth,
      ...(style.shadow !== null && (style.shadow ?? shadow)
        ? { shadow: style.shadow ?? shadow }
        : {}),
      listening: false,
    })
  );
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
  const width = 128;
  const height = 44;
  const isTerminal = type === 'start' || type === 'end';
  const isDecision = type === 'decision';
  const node = app.group();

  if (isDecision) {
    node.add(
      app.polygon({
        points: [64, 2, 126, 22, 64, 42, 2, 22],
        fill: DIAGRAM.decisionFill,
        stroke: DIAGRAM.decisionStroke,
        strokeWidth: 2,
        shadow: DIAGRAM.shadowSoft,
        listening: false,
      })
    );
    const fs = DIAGRAM.fontSize.sm;
    node.add(
      app.text({
        text: label,
        x: centerTextX(label, 128, fs),
        y: 22 - fs / 2 - 1,
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
      fill: isTerminal ? DIAGRAM.terminalFill : DIAGRAM.nodeFill,
      stroke: isTerminal ? DIAGRAM.terminalStroke : DIAGRAM.nodeStroke,
      strokeWidth: 1.5,
      shadow: DIAGRAM.shadowSoft,
      listening: false,
    })
  );
  if (isTerminal) {
    node.add(
      app.text({
        text: label.toUpperCase(),
        x: centerTextX(label, width, DIAGRAM.fontSize.sm),
        y: height / 2 - 6,
        fontSize: DIAGRAM.fontSize.sm,
        fontWeight: '700',
        letterSpacing: 0.04,
        fontFamily: DIAGRAM.fontFamily,
        fill: DIAGRAM.nodeText,
        listening: false,
      })
    );
  } else {
    node.add(
      app.text({
        text: label,
        x: centerTextX(label, width),
        y: height / 2 - 7,
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

  node.add(
    app.roundedRect({
      width,
      height,
      cornerRadius: DIAGRAM.radii.md,
      fill: DIAGRAM.classFill,
      stroke: DIAGRAM.classStroke,
      strokeWidth: 1.5,
      shadow: DIAGRAM.shadowSoft,
      listening: false,
    })
  );
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
  node.add(
    app.text({
      text: name,
      x: DIAGRAM.spacing.sm,
      y: 9,
      fontSize: DIAGRAM.fontSize.lg,
      fontWeight: 'bold',
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
      strokeWidth: 1,
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
        strokeWidth: 1,
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

const NETWORK_STYLES: Record<NetworkType, { fill: string; stroke: string; glyph: string }> = {
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

  node.add(
    app.roundedRect({
      width: size,
      height: size,
      cornerRadius: netType === 'server' ? DIAGRAM.radii.sm : size / 2,
      fill: style.fill,
      stroke: style.stroke,
      strokeWidth: 2,
      shadow: DIAGRAM.shadowSoft,
      listening: false,
    })
  );
  addNetworkGlyph(app, node, netType, size, style.glyph);

  const labelW = Math.max(size, measureTextWidth(label, DIAGRAM.fontSize.sm) + 8);
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

/** Org-chart card with optional collapse control. */
export function createOrgNode(
  app: App,
  name: string,
  role?: string,
  childCount = 0,
  collapsed = false
): { node: Group; indicator?: ReturnType<App['text']> } {
  const width = 152;
  const height = role ? 58 : 50;
  const node = app.group();

  node.add(
    app.roundedRect({
      width,
      height,
      cornerRadius: DIAGRAM.radii.md,
      fill: DIAGRAM.nodeFill,
      stroke: DIAGRAM.nodeStroke,
      strokeWidth: 1.5,
      shadow: DIAGRAM.shadowSoft,
      listening: false,
    })
  );
  node.add(
    app.line({
      x: 0,
      y: 0,
      x2: 4,
      y2: height,
      stroke: DIAGRAM.nodeStroke,
      strokeWidth: 3,
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
        strokeWidth: 1,
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
  const width = 112;
  const height = 48;
  const node = app.group();

  node.add(
    app.roundedRect({
      width,
      height,
      cornerRadius: DIAGRAM.radii.md,
      fill: c.fill,
      stroke: c.stroke,
      strokeWidth: 1.5,
      shadow: DIAGRAM.shadowSoft,
      listening: false,
    })
  );
  node.add(
    app.rect({
      x: 0,
      y: 0,
      width: 4,
      height,
      fill: c.stroke,
      stroke: null,
      listening: false,
    })
  );
  const icons: Record<string, string> = { pending: '○', active: '◉', done: '✓', error: '✕' };
  node.add(
    app.text({
      text: icons[status] ?? '○',
      x: DIAGRAM.spacing.sm,
      y: height / 2 - 8,
      fontSize: DIAGRAM.fontSize.xl,
      fill: c.stroke,
      listening: false,
    })
  );
  node.add(
    app.text({
      text: label,
      x: DIAGRAM.spacing.lg + 4,
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
        radius: radius - 2,
        fill: DIAGRAM.stateFinalFill,
        stroke: DIAGRAM.stateFinalStroke,
        strokeWidth: 2.5,
        shadow: DIAGRAM.shadowSoft,
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
        strokeWidth: 2,
        listening: false,
      })
    );
  } else {
    node.add(
      app.roundedRect({
        width: radius * 2 - 4,
        height: radius * 2 - 4,
        cornerRadius: isInitial ? radius : DIAGRAM.radii.lg,
        fill: isInitial ? DIAGRAM.stateInitialFill : DIAGRAM.stateFill,
        stroke: isInitial ? DIAGRAM.stateInitialStroke : DIAGRAM.stateStroke,
        strokeWidth: 2,
        shadow: DIAGRAM.shadowSoft,
        listening: false,
      })
    );
  }

  const fs = DIAGRAM.fontSize.md;
  node.add(
    app.text({
      text: label,
      x: centerTextX(label, radius * 2 - 4, fs),
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

/** Edge label pill for connectors. */
export function createEdgeLabel(app: App, text: string, x: number, y: number): Group {
  const fontSize = DIAGRAM.fontSize.sm;
  const tw = measureTextWidth(text, fontSize, '500');
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
      stroke: DIAGRAM.labelPillStroke,
      strokeWidth: 1,
      listening: false,
    })
  );
  g.add(
    app.text({
      text,
      x: x - tw / 2,
      y: y - fontSize / 2 - 1,
      fontSize,
      fontWeight: '500',
      fontFamily: DIAGRAM.fontFamily,
      fill: DIAGRAM.edgeLabel,
      listening: false,
    })
  );
  return g;
}
