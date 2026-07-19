/**
 * Org chart node primitives (cards, branch palette, collapse).
 */
import type { App } from '../../App';
import type { Group } from '../../shapes/Group';
import { getActiveDiagram } from '../theme';
import { centerTextX } from './measure';

export interface OrgNodeOptions {
  name: string;
  role?: string;
  /** Avatar image URL or data URI (optional) */
  image?: string;
  department?: string;
  childCount?: number;
  collapsed?: boolean;
  depth?: number;
  /** Branch grouping color (inherited by sub-branches) */
  branchStyle?: { fill: string; stroke: string; accent: string };
}

export type OrgBranchStyle = { fill: string; stroke: string; accent: string };

/** FNV-1a style seed from branch names (stable across rebuilds). */
export function hashOrgBranchSeed(names: string[]): number {
  let h = 2166136261;
  for (const name of names) {
    for (let i = 0; i < name.length; i++) {
      h ^= name.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h ^= 124;
    h = Math.imul(h, 16777619);
  }
  return (h ^ (names.length * 2654435761)) >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hslToHex(h: number, sPct: number, lPct: number): string {
  const s = Math.max(0, Math.min(100, sPct)) / 100;
  const l = Math.max(0, Math.min(100, lPct)) / 100;
  const hue = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hue < 60) [r, g, b] = [c, x, 0];
  else if (hue < 120) [r, g, b] = [x, c, 0];
  else if (hue < 180) [r, g, b] = [0, c, x];
  else if (hue < 240) [r, g, b] = [0, x, c];
  else if (hue < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

/**
 * Build N unique branch colors (no repeats).
 * Hues are spaced on the wheel then shuffled with a seeded RNG so assignment
 * feels random but stays stable for the same seed / rebuild.
 */
export function buildDistinctOrgBranchPalette(
  count: number,
  seed = 1
): OrgBranchStyle[] {
  const n = Math.max(0, Math.floor(count));
  if (n <= 0) return [];

  const base = getActiveDiagram().orgBranchPalette as readonly OrgBranchStyle[];
  // Prefer curated theme swatches first (still unique), then generate more
  if (n <= base.length) {
    const rand = mulberry32(seed);
    const idxs = Array.from({ length: base.length }, (_, i) => i);
    for (let i = idxs.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
    }
    return idxs.slice(0, n).map((i) => ({ ...base[i] }));
  }

  const rand = mulberry32(seed);
  const GOLDEN = 137.508;
  const start = rand() * 360;
  const hues = Array.from({ length: n }, (_, i) => (start + i * GOLDEN) % 360);
  for (let i = hues.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [hues[i], hues[j]] = [hues[j], hues[i]];
  }

  return hues.map((h, i) => {
    // Slight sat/light jitter so neighboring hues still read distinct on dark cards
    const satJitter = 4 * (i % 3);
    const lightJitter = 2 * (i % 2);
    return {
      fill: hslToHex(h, 42 + satJitter, 13 + lightJitter),
      stroke: hslToHex(h, 68 + satJitter, 52 + lightJitter),
      accent: hslToHex(h, 74 + satJitter, 66 + lightJitter),
    };
  });
}

/** Resolve executive vs branch/sub-branch grouping colors. */
export function resolveOrgBranchStyle(
  depth: number,
  branchIndex: number | null | undefined,
  branchPalette?: readonly OrgBranchStyle[] | null
): OrgBranchStyle {
  const d = getActiveDiagram();
  if (depth <= 0 || branchIndex == null || branchIndex < 0) {
    return { ...d.orgTier[0] };
  }
  const palette =
    branchPalette && branchPalette.length > 0
      ? branchPalette
      : (d.orgBranchPalette as readonly OrgBranchStyle[]);
  // Palette is built per chart with unique entries — never modulo-cycle
  const base = palette[Math.min(branchIndex, palette.length - 1)] ?? palette[0];
  if (depth === 1) return { ...base };
  return {
    fill: d.orgTier[Math.min(depth, d.orgTier.length - 1)]?.fill ?? base.fill,
    stroke: base.stroke,
    accent: base.accent,
  };
}

/** Count every org node under `node` (all descendants, not just direct children). */
export function countOrgDescendants(node: Group): number {
  let total = 0;
  for (const child of node.children) {
    if (!child.metadata?.orgNode) continue;
    total += 1 + countOrgDescendants(child as Group);
  }
  return total;
}

/** Draw professional minimize (−) / maximize (+) control; shows total subtree size. */
export function drawOrgCollapseGlyph(
  app: App,
  btn: Group,
  collapsed: boolean,
  count: number
): void {
  const style = collapsed
    ? getActiveDiagram().orgToggleCollapsed
    : getActiveDiagram().orgToggleExpanded;

  for (const child of [...btn.children]) {
    btn.remove(child);
    child.destroy();
  }

  const n = Math.max(0, Math.floor(count));
  const shown = n > 99 ? '99' : String(n);
  const label = collapsed ? `+${shown}` : `−${shown}`;
  const height = 20;
  const width = n > 9 ? 30 : 24;
  btn.metadata.orgCollapseCount = n;

  btn.add(
    app.roundedRect({
      x: 0,
      y: 0,
      width,
      height,
      cornerRadius: 6,
      fill: style.fill,
      stroke: style.stroke,
      strokeWidth: 1.4,
      listening: true,
    })
  );
  btn.add(
    app.roundedRect({
      x: 1,
      y: 1,
      width: width - 2,
      height: height - 2,
      cornerRadius: 5,
      fill: null,
      stroke: 'rgba(255,255,255,0.12)',
      strokeWidth: 1,
      listening: false,
    })
  );

  btn.add(
    app.text({
      text: label,
      x: n > 9 ? 3 : 4.5,
      y: 3.5,
      fontSize: n > 9 ? 9 : 10,
      fontWeight: '700',
      fontFamily: getActiveDiagram().fontFamily,
      fill: style.glyph,
      listening: false,
    })
  );
}

/** Refresh minimize/maximize button after toggle (count = total descendants). */
export function updateOrgCollapseButton(node: Group, collapsed: boolean): void {
  const btn = node.metadata?.collapseButton as Group | undefined;
  const app = node.getApp();
  if (!btn || !app) return;
  const live = countOrgDescendants(node);
  const count =
    live > 0
      ? live
      : typeof node.metadata?.descendantCount === 'number'
        ? (node.metadata.descendantCount as number)
        : ((node.metadata?.childCount as number) ?? 0);
  node.metadata.descendantCount = count;
  // Keep button flush to the card corner as width changes with digit count
  const cardW = (node.metadata?.orgCardWidth as number) ?? 138;
  const cardH = (node.metadata?.orgCardHeight as number) ?? 0;
  const btnW = count > 9 ? 30 : 24;
  btn.x = cardW - btnW - 6;
  if (cardH > 0) btn.y = cardH - 26;
  drawOrgCollapseGlyph(app, btn, collapsed, count);
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
): { node: Group; indicator?: Group } {
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
    branchStyle,
  } = opts;

  const tier =
    branchStyle ??
    getActiveDiagram().orgTier[Math.min(level, getActiveDiagram().orgTier.length - 1)];
  const hasDept = Boolean(department);
  const width = 138;
  const photoR = 26;
  const photoTop = 14;
  const textStartY = photoTop + photoR * 2 + 10;
  const height = textStartY + (title ? 18 : 0) + (hasDept ? 14 : 0) + 18;
  const node = app.group();
  node.metadata.orgCardWidth = width;
  node.metadata.orgCardHeight = height;
  node.metadata.orgBranchStroke = tier.stroke;
  node.metadata.orgBranchAccent = tier.accent;

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
  // Branch accent bar (grouping cue)
  node.add(
    app.rect({
      x: 0,
      y: 0,
      width,
      height: 3,
      fill: tier.accent,
      stroke: null,
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
      fill: tier.accent,
      stroke: getActiveDiagram().surface,
      strokeWidth: 1.25,
      listening: false,
    })
  );

  let indicator;
  if (kids > 0) {
    const btnW = kids > 9 ? 30 : 24;
    const bx = width - btnW - 6;
    const by = height - 26;
    const btn = app.group({
      x: bx,
      y: by,
      listening: true,
      zIndex: 20,
    }) as Group;
    btn.metadata.orgCollapseBtn = true;
    drawOrgCollapseGlyph(app, btn, isCollapsed, kids);
    node.add(btn);
    node.metadata.collapseButton = btn;
    indicator = btn;
  }
  return { node, indicator };
}
