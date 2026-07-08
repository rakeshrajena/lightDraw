import type { FlowLink, FlowNode } from '../types';

export interface SankeyLayoutNode {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SankeyLayoutLink {
  source: SankeyLayoutNode;
  target: SankeyLayoutNode;
  value: number;
  path: string;
}

export function layoutSankey(
  nodes: FlowNode[],
  links: FlowLink[],
  width: number,
  height: number,
  nodeWidth = 12
): { nodes: SankeyLayoutNode[]; links: SankeyLayoutLink[] } {
  const cols = 3;
  const colW = width / cols;
  const inflow = new Map<string, number>();
  const outflow = new Map<string, number>();
  for (const l of links) {
    inflow.set(l.target, (inflow.get(l.target) ?? 0) + l.value);
    outflow.set(l.source, (outflow.get(l.source) ?? 0) + l.value);
  }
  const total = links.reduce((a, l) => a + l.value, 0) || 1;
  const layoutNodes: SankeyLayoutNode[] = nodes.map((n, i) => {
    const col = i % cols;
    const flow = Math.max(inflow.get(n.id) ?? 0, outflow.get(n.id) ?? 0, 1);
    const h = (flow / total) * height * 0.8;
    return {
      id: n.id,
      label: n.label ?? n.id,
      x: col * colW + colW / 2 - nodeWidth / 2,
      y: 20 + (i % 4) * (h + 10),
      width: nodeWidth,
      height: Math.max(20, h),
    };
  });
  const nodeMap = new Map(layoutNodes.map((n) => [n.id, n]));
  const layoutLinks: SankeyLayoutLink[] = links
    .map((l) => {
      const source = nodeMap.get(l.source);
      const target = nodeMap.get(l.target);
      if (!source || !target) return null;
      const sx = source.x + source.width;
      const sy = source.y + source.height / 2;
      const tx = target.x;
      const ty = target.y + target.height / 2;
      const mx = (sx + tx) / 2;
      const path = `M ${sx} ${sy} C ${mx} ${sy} ${mx} ${ty} ${tx} ${ty}`;
      return { source, target, value: l.value, path };
    })
    .filter((l): l is SankeyLayoutLink => l != null);
  return { nodes: layoutNodes, links: layoutLinks };
}

export function chordPath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const large = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

export interface ChordSegment {
  index: number;
  startAngle: number;
  endAngle: number;
  value: number;
}

export interface ChordRibbon {
  source: number;
  target: number;
  value: number;
  path: string;
}

export interface ChordLayout {
  cx: number;
  cy: number;
  outerR: number;
  innerR: number;
  segments: ChordSegment[];
  ribbons: ChordRibbon[];
}

/** Layout a chord diagram from an adjacency matrix. */
export function layoutChord(matrix: number[][], size: number, padAngle = 0.04): ChordLayout {
  const n = matrix.length;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 16;
  const innerR = outerR - 18;
  const totals = matrix.map((row) => row.reduce((a, v) => a + v, 0));
  const grand = totals.reduce((a, v) => a + v, 0) || 1;
  const tau = Math.PI * 2;
  const gap = padAngle;

  let angle = -Math.PI / 2;
  const segments: ChordSegment[] = [];
  for (let i = 0; i < n; i++) {
    const sweep = (totals[i] / grand) * tau;
    const start = angle + gap / 2;
    const end = angle + sweep - gap / 2;
    segments.push({ index: i, startAngle: start, endAngle: end, value: totals[i] });
    angle += sweep;
  }

  const ribbons: ChordRibbon[] = [];
  for (let i = 0; i < n; i++) {
    const row = matrix[i];
    const outTotal = row.reduce((a, v) => a + v, 0) || 1;
    let outAcc = 0;
    for (let j = 0; j < n; j++) {
      const v = row[j];
      if (!v) continue;
      const segI = segments[i];
      const segJ = segments[j];
      const srcSpan = segI.endAngle - segI.startAngle;
      const tgtSpan = segJ.endAngle - segJ.startAngle;
      const sa1 = segI.startAngle + (outAcc / outTotal) * srcSpan;
      const ea1 = segI.startAngle + ((outAcc + v) / outTotal) * srcSpan;
      outAcc += v;

      const inTotal = matrix.reduce((a, r) => a + (r[j] ?? 0), 0) || 1;
      let inBefore = 0;
      for (let k = 0; k < i; k++) inBefore += matrix[k][j] ?? 0;
      const sa2 = segJ.startAngle + (inBefore / inTotal) * tgtSpan;
      const ea2 = segJ.startAngle + ((inBefore + v) / inTotal) * tgtSpan;

      ribbons.push({
        source: i,
        target: j,
        value: v,
        path: chordRibbonPath(cx, cy, outerR, innerR, sa1, ea1, sa2, ea2),
      });
    }
  }

  return { cx, cy, outerR, innerR, segments, ribbons };
}

/** Filled ribbon between two arc spans on a chord diagram. */
export function chordRibbonPath(
  cx: number,
  cy: number,
  outerR: number,
  _innerR: number,
  sa1: number,
  ea1: number,
  sa2: number,
  ea2: number
): string {
  const p = (r: number, a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  const [x00, y00] = p(outerR, sa1);
  const [x01, y01] = p(outerR, ea1);
  const [x10, y10] = p(outerR, sa2);
  const [x11, y11] = p(outerR, ea2);
  const large1 = Math.abs(ea1 - sa1) > Math.PI ? 1 : 0;
  const large2 = Math.abs(ea2 - sa2) > Math.PI ? 1 : 0;
  return `M ${x00} ${y00} A ${outerR} ${outerR} 0 ${large1} 1 ${x01} ${y01} Q ${cx} ${cy} ${x10} ${y10} A ${outerR} ${outerR} 0 ${large2} 1 ${x11} ${y11} Q ${cx} ${cy} ${x00} ${y00} Z`;
}
