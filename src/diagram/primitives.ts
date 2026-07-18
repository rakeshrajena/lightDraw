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
import { quadraticToPoints } from './pathUtils';

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
  sheen?: boolean;
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
    sheen: style.sheen,
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
  const width = 176;
  const lineH = 17;
  const headerH = 32;
  const bodyLines = attributes.length + methods.length;
  const height = headerH + bodyLines * lineH + (methods.length > 0 && attributes.length > 0 ? 8 : 4) + 6;
  const node = app.group();
  node.metadata.diagramCardWidth = width;
  node.metadata.diagramCardHeight = height;
  const radius = getActiveDiagram().radii.md;

  addCardChrome(app, node, {
    width,
    height,
    cornerRadius: radius,
    fill: getActiveDiagram().classFill,
    stroke: getActiveDiagram().classStroke,
    strokeWidth: getActiveDiagram().stroke.node,
    shadow: getActiveDiagram().shadowSoft,
    accentColor: getActiveDiagram().umlInheritance,
    sheen: false,
  });
  // Header band inset so square corners sit inside the rounded card stroke
  node.add(
    app.rect({
      x: Math.max(2, radius * 0.35),
      y: 3,
      width: width - Math.max(4, radius * 0.7),
      height: headerH - 4,
      fill: getActiveDiagram().classHeaderBg,
      stroke: null,
      listening: false,
    })
  );
  addTopSheen(app, node, width, radius);
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

/** Professional topology glyphs (Cisco-inspired, canvas primitives). */
function addNetworkGlyph(
  app: App,
  parent: Group,
  type: NetworkType,
  size: number,
  color: string
): void {
  const cx = size / 2;
  const cy = size / 2 - (type === 'client' ? 1 : 0);
  const sw = 1.6;

  if (type === 'router') {
    // Hexagonal chassis + antenna arcs
    const r = size * 0.28;
    const hex: number[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      hex.push(cx + r * Math.cos(a), cy + 4 + r * Math.sin(a));
    }
    parent.add(
      app.polygon({
        points: hex,
        fill: null,
        stroke: color,
        strokeWidth: sw,
        listening: false,
      })
    );
    parent.add(
      app.circle({ x: cx, y: cy + 4, radius: 3.2, fill: color, stroke: null, listening: false })
    );
    for (const sign of [-1, 1] as const) {
      parent.add(
        app.polyline({
          points: quadraticToPoints(
            cx + sign * 6,
            cy - 6,
            cx + sign * 14,
            cy - 14,
            cx + sign * 4,
            cy - 18,
            6
          ),
          fill: null,
          stroke: color,
          strokeWidth: 1.4,
          lineCap: 'round',
          lineJoin: 'round',
          listening: false,
        })
      );
    }
  } else if (type === 'server') {
    // Rack chassis with drive bays + status LEDs
    parent.add(
      app.roundedRect({
        x: cx - 14,
        y: cy - 14,
        width: 28,
        height: 28,
        cornerRadius: 3,
        fill: null,
        stroke: color,
        strokeWidth: sw,
        listening: false,
      })
    );
    for (let i = 0; i < 3; i++) {
      const y = cy - 10 + i * 8;
      parent.add(
        app.roundedRect({
          x: cx - 10,
          y,
          width: 16,
          height: 5,
          cornerRadius: 1,
          fill: null,
          stroke: color,
          strokeWidth: 1.1,
          listening: false,
        })
      );
      parent.add(
        app.circle({
          x: cx + 9,
          y: y + 2.5,
          radius: 1.4,
          fill: i === 0 ? color : null,
          stroke: color,
          strokeWidth: 1,
          listening: false,
        })
      );
    }
  } else if (type === 'switch') {
    // Managed switch: body + RJ45 ports + uplink LED row
    parent.add(
      app.roundedRect({
        x: cx - 16,
        y: cy - 8,
        width: 32,
        height: 16,
        cornerRadius: 3,
        fill: null,
        stroke: color,
        strokeWidth: sw,
        listening: false,
      })
    );
    for (let i = 0; i < 6; i++) {
      parent.add(
        app.roundedRect({
          x: cx - 13 + i * 4.4,
          y: cy - 3,
          width: 3.2,
          height: 6,
          cornerRadius: 0.6,
          fill: i % 2 === 0 ? color : null,
          stroke: color,
          strokeWidth: 0.9,
          opacity: i % 2 === 0 ? 0.85 : 1,
          listening: false,
        })
      );
    }
    parent.add(
      app.line({
        x: cx - 14,
        y: cy - 11,
        x2: 28,
        y2: 0,
        stroke: color,
        strokeWidth: 1.2,
        lineCap: 'round',
        listening: false,
      })
    );
  } else if (type === 'client') {
    // Desktop monitor + stand + base
    parent.add(
      app.roundedRect({
        x: cx - 13,
        y: cy - 12,
        width: 26,
        height: 18,
        cornerRadius: 2.5,
        fill: null,
        stroke: color,
        strokeWidth: sw,
        listening: false,
      })
    );
    parent.add(
      app.roundedRect({
        x: cx - 10,
        y: cy - 9,
        width: 20,
        height: 12,
        cornerRadius: 1.5,
        fill: null,
        stroke: color,
        strokeWidth: 1,
        opacity: 0.55,
        listening: false,
      })
    );
    parent.add(
      app.line({
        x: cx,
        y: cy + 6,
        x2: 0,
        y2: 5,
        stroke: color,
        strokeWidth: sw,
        lineCap: 'round',
        listening: false,
      })
    );
    parent.add(
      app.line({
        x: cx - 7,
        y: cy + 12,
        x2: 14,
        y2: 0,
        stroke: color,
        strokeWidth: sw,
        lineCap: 'round',
        listening: false,
      })
    );
  } else {
    // Generic cloud / host
    parent.add(
      app.circle({
        x: cx - 6,
        y: cy + 2,
        radius: 7,
        fill: null,
        stroke: color,
        strokeWidth: sw,
        listening: false,
      })
    );
    parent.add(
      app.circle({
        x: cx + 5,
        y: cy + 1,
        radius: 8,
        fill: null,
        stroke: color,
        strokeWidth: sw,
        listening: false,
      })
    );
    parent.add(
      app.circle({
        x: cx,
        y: cy - 5,
        radius: 6.5,
        fill: null,
        stroke: color,
        strokeWidth: sw,
        listening: false,
      })
    );
  }
}

/** Network topology node with type icon and caption below. */
export function createNetworkNode(app: App, label: string, type: string): Group {
  const netType = (type in NETWORK_STYLES ? type : 'default') as NetworkType;
  const style = NETWORK_STYLES[netType];
  const size = netType === 'router' ? 56 : 48;
  const node = app.group();

  addCardChrome(app, node, {
    width: size,
    height: size,
    cornerRadius: netType === 'server' ? getActiveDiagram().radii.md : size / 2,
    fill: style.fill,
    stroke: style.stroke,
    strokeWidth: getActiveDiagram().stroke.nodeEmphasis,
    shadow: getActiveDiagram().shadowElevated,
    sheen: netType === 'server' || netType === 'switch',
  });
  addNetworkGlyph(app, node, netType, size, style.glyph);

  const labelW = Math.max(size + 8, measureTextWidth(label, getActiveDiagram().fontSize.sm) + 18);
  const tw = measureTextWidth(label, getActiveDiagram().fontSize.sm);
  const labelX = (size - labelW) / 2 + centerTextX(label, labelW, getActiveDiagram().fontSize.sm);
  addCaptionPill(app, node, tw, labelX, size + getActiveDiagram().spacing.xs - 2, style.stroke);
  node.add(
    app.text({
      text: label,
      x: (size - labelW) / 2 + centerTextX(label, labelW, getActiveDiagram().fontSize.sm),
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

/** Org chart card options */
export interface OrgNodeOptions {
  name: string;
  role?: string;
  /** Avatar image URL or data URI (optional) */
  image?: string;
  department?: string;
  childCount?: number;
  collapsed?: boolean;
  depth?: number;
}

/** Build a circular SVG avatar data-URI from initials (offline-safe fallback). */
export function orgInitialsAvatarDataUri(
  name: string,
  accent: string,
  fill = '#1e293b'
): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || '?';
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">` +
    `<rect width="128" height="128" fill="${fill}"/>` +
    `<circle cx="64" cy="64" r="60" fill="${accent}" opacity="0.22"/>` +
    `<text x="64" y="74" text-anchor="middle" font-family="Segoe UI, Inter, system-ui, sans-serif" ` +
    `font-size="42" font-weight="700" fill="${accent}">${initials}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Professional portrait org-chart card with optional photo. */
export function createOrgNode(
  app: App,
  nameOrOpts: string | OrgNodeOptions,
  role?: string,
  childCount = 0,
  collapsed = false,
  depth = 0
): { node: Group; indicator?: ReturnType<App['text']> } {
  const opts: OrgNodeOptions =
    typeof nameOrOpts === 'string'
      ? { name: nameOrOpts, role, childCount, collapsed, depth }
      : {
          childCount: 0,
          collapsed: false,
          depth: 0,
          ...nameOrOpts,
        };

  const {
    name,
    role: title,
    image,
    department,
    childCount: kids = 0,
    collapsed: isCollapsed = false,
    depth: level = 0,
  } = opts;

  const tier = getActiveDiagram().orgTier[Math.min(level, getActiveDiagram().orgTier.length - 1)];
  const hasDept = Boolean(department);
  const width = 138;
  const photoR = 26;
  const photoTop = 14;
  const textStartY = photoTop + photoR * 2 + 10;
  const height = textStartY + (title ? 18 : 0) + (hasDept ? 14 : 0) + 18;
  const node = app.group();
  node.metadata.orgCardWidth = width;
  node.metadata.orgCardHeight = height;

  node.add(
    app.roundedRect({
      width,
      height,
      cornerRadius: 10,
      fill: tier.fill,
      stroke: tier.stroke,
      strokeWidth: 1.5,
      shadow: getActiveDiagram().orgCardShadow,
      listening: false,
    })
  );
  node.add(
    app.roundedRect({
      x: 1,
      y: 1,
      width: width - 2,
      height: height - 2,
      cornerRadius: 9,
      fill: null,
      stroke: 'rgba(255,255,255,0.06)',
      strokeWidth: 1,
      listening: false,
    })
  );

  const photoX = (width - photoR * 2) / 2;
  const photoSrc = image?.trim() || orgInitialsAvatarDataUri(name, tier.accent, tier.fill);

  const mask = app.circle({ radius: photoR });
  node.add(
    app.image({
      src: photoSrc,
      x: photoX,
      y: photoTop,
      width: photoR * 2,
      height: photoR * 2,
      mask,
      listening: false,
    })
  );
  node.add(
    app.circle({
      x: photoX,
      y: photoTop,
      radius: photoR,
      fill: null,
      stroke: tier.accent,
      strokeWidth: 2,
      listening: false,
    })
  );

  let ty = textStartY;
  const nameFs = getActiveDiagram().fontSize.base;
  node.add(
    app.text({
      text: name,
      x: centerTextX(name, width, nameFs, '700'),
      y: ty,
      fontSize: nameFs,
      fontWeight: '700',
      fontFamily: getActiveDiagram().fontFamily,
      fill: getActiveDiagram().nodeText,
      listening: false,
    })
  );
  ty += 16;

  if (title) {
    const roleFs = getActiveDiagram().fontSize.sm;
    node.add(
      app.text({
        text: title,
        x: centerTextX(title, width, roleFs, '500'),
        y: ty,
        fontSize: roleFs,
        fontWeight: '500',
        fontFamily: getActiveDiagram().fontFamily,
        fill: getActiveDiagram().orgRole,
        listening: false,
      })
    );
    ty += 14;
  }

  if (department) {
    const deptFs = getActiveDiagram().fontSize.xs;
    node.add(
      app.text({
        text: department,
        x: centerTextX(department, width, deptFs, '500'),
        y: ty,
        fontSize: deptFs,
        fontWeight: '500',
        fontFamily: getActiveDiagram().fontFamily,
        fill: getActiveDiagram().nodeTextMuted,
        listening: false,
      })
    );
  }

  node.add(
    app.circle({
      x: width / 2 - 3.5,
      y: height - 3.5,
      radius: 3.5,
      fill: getActiveDiagram().orgEdge,
      stroke: getActiveDiagram().surface,
      strokeWidth: 1.25,
      listening: false,
    })
  );

  let indicator;
  if (kids > 0) {
    const bx = width - 22;
    const by = height - 22;
    node.add(
      app.roundedRect({
        x: bx,
        y: by,
        width: 16,
        height: 16,
        cornerRadius: 4,
        fill: getActiveDiagram().orgToggleBg,
        stroke: tier.stroke,
        strokeWidth: 1,
        listening: false,
      })
    );
    indicator = app.text({
      text: isCollapsed ? `+${kids}` : '−',
      x: bx + 3.5,
      y: by + 2,
      fontSize: getActiveDiagram().fontSize.xs,
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

/** State machine node: UML initial (filled circle), final (double ring), or rounded state. */
export function createStateNode(
  app: App,
  label: string,
  type: 'initial' | 'final' | 'normal' | string
): Group {
  const node = app.group();
  const isFinal = type === 'final';
  const isInitial = type === 'initial';

  if (isInitial) {
    // UML initial pseudostate — solid circle; card size = glyph for correct anchors
    const r = 9;
    const size = r * 2;
    node.metadata.diagramCardWidth = size;
    node.metadata.diagramCardHeight = size;
    node.add(
      app.circle({
        x: 0,
        y: 0,
        radius: r,
        fill: getActiveDiagram().stateInitialStroke,
        stroke: null,
        listening: false,
      })
    );
    return node;
  }

  if (isFinal) {
    // UML final: double ring with label centered inside (not below — keeps anchors tight)
    const radius = 20;
    const size = radius * 2;
    node.metadata.diagramCardWidth = size;
    node.metadata.diagramCardHeight = size;
    node.add(
      app.circle({
        x: 0,
        y: 0,
        radius,
        fill: getActiveDiagram().stateFinalFill,
        stroke: getActiveDiagram().stateFinalStroke,
        strokeWidth: getActiveDiagram().stroke.nodeEmphasis,
        listening: false,
      })
    );
    node.add(
      app.circle({
        x: 6,
        y: 6,
        radius: radius - 6,
        fill: null,
        stroke: getActiveDiagram().stateFinalStroke,
        strokeWidth: getActiveDiagram().stroke.nodeEmphasis,
        listening: false,
      })
    );
    if (label) {
      const fs = getActiveDiagram().fontSize.sm;
      node.add(
        app.text({
          text: label,
          x: centerTextX(label, size, fs),
          y: size / 2 - fs / 2 - 1,
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

  const w = 112;
  const h = 42;
  node.metadata.diagramCardWidth = w;
  node.metadata.diagramCardHeight = h;
  // Clean Mermaid-style pill — stroke only, no accent bar / sheen artifacts
  addCardChrome(app, node, {
    width: w,
    height: h,
    cornerRadius: getActiveDiagram().radii.pill,
    fill: getActiveDiagram().stateFill,
    stroke: getActiveDiagram().stateStroke,
    strokeWidth: getActiveDiagram().stroke.nodeEmphasis,
    shadow: null,
    sheen: false,
  });

  const fs = getActiveDiagram().fontSize.md;
  node.add(
    app.text({
      text: label,
      x: centerTextX(label, w, fs),
      y: h / 2 - fs / 2 - 1,
      fontSize: fs,
      fontWeight: '600',
      fontFamily: getActiveDiagram().fontFamily,
      fill: getActiveDiagram().nodeText,
      listening: false,
    })
  );
  return node;
}

/** CAN bus ECU card with chip glyph and bus tap. */
export function createCanEcuNode(
  app: App,
  label: string,
  address: string | undefined,
  color: string,
  strokeWidth: number = getActiveDiagram().stroke.node
): Group {
  const width = 96;
  const height = 62;
  const ecuGroup = app.group();
  ecuGroup.metadata.diagramCardWidth = width;
  ecuGroup.metadata.diagramCardHeight = height;
  ecuGroup.metadata.diagramTapPad = 22;

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

  // IC chip glyph
  ecuGroup.add(
    app.roundedRect({
      x: width - 28,
      y: 10,
      width: 16,
      height: 20,
      cornerRadius: 2,
      fill: null,
      stroke: color,
      strokeWidth: 1.2,
      opacity: 0.85,
      listening: false,
    })
  );
  for (const side of [0, 1]) {
    for (let i = 0; i < 3; i++) {
      ecuGroup.add(
        app.line({
          x: side === 0 ? width - 28 : width - 12,
          y: 13 + i * 6,
          x2: side === 0 ? -4 : 4,
          y2: 0,
          stroke: color,
          strokeWidth: 1.1,
          lineCap: 'round',
          opacity: 0.75,
          listening: false,
        })
      );
    }
  }

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
        y: 32,
        fontSize: getActiveDiagram().fontSize.xs,
        fontFamily: getActiveDiagram().fontMono,
        fill: getActiveDiagram().edgeLabel,
        listening: false,
      })
    );
  }
  // Bus tap: reaches dual-line midline when ECU.y = busY + 18 (tap to local y = -18)
  const tapLen = 18;
  ecuGroup.add(
    app.line({
      x: width / 2,
      y: 0,
      x2: 0,
      y2: -tapLen,
      stroke: color,
      strokeWidth: 2.25,
      lineCap: 'round',
      listening: false,
    })
  );
  // Bridge across CAN-H / CAN-L at the junction
  ecuGroup.add(
    app.line({
      x: width / 2,
      y: -tapLen - 4,
      x2: 0,
      y2: 8,
      stroke: color,
      strokeWidth: 2,
      lineCap: 'round',
      listening: false,
    })
  );
  ecuGroup.add(
    app.circle({
      x: width / 2 - 3.5,
      y: -tapLen - 3.5,
      radius: 3.5,
      fill: color,
      stroke: getActiveDiagram().surface,
      strokeWidth: 1.5,
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
