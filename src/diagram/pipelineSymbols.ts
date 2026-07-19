/**
 * Pipeline symbol chrome — category accent plates for catalog tiles + stage glyphs.
 */
import type { App } from '../App';
import type { Group } from '../shapes/Group';
import { addAccentBar, addCardChrome } from './chrome';
import {
  drawPipelineGlyph,
  getPipelineSymbolMeta,
  resolvePipelineSymbolKind,
  PIPELINE_SYMBOL_SIZE,
  type PipelineSymbolCategory,
} from './pipelineIcons';
import { getActiveDiagram } from './theme';

const SYMBOL_SIZE = PIPELINE_SYMBOL_SIZE;
const ACCENT_H = 4;

function categoryAccent(category: PipelineSymbolCategory): string {
  const d = getActiveDiagram();
  switch (category) {
    case 'flow':
      return d.schematicSwitch;
    case 'gateway':
      return '#a78bfa';
    case 'event':
      return '#22d3ee';
    case 'io':
      return '#94a3b8';
    case 'queue':
      return '#38bdf8';
    case 'data':
      return d.schematicResistor;
    case 'notify':
      return '#fbbf24';
    case 'integration':
      return '#60a5fa';
    case 'software':
      return '#818cf8';
    case 'cicd':
      return d.schematicBattery;
    case 'security':
      return '#f87171';
    case 'people':
      return '#34d399';
    case 'governance':
      return '#c084fc';
    case 'project':
      return '#fb7185';
    case 'manufacturing':
      return '#f59e0b';
    case 'logistics':
      return '#2dd4bf';
    case 'quality':
      return '#4ade80';
    case 'industrial':
      return '#67e8f9';
    case 'cloud':
      return '#93c5fd';
    case 'ai':
      return '#e879f9';
    case 'status':
      return d.schematicLedStroke;
    case 'layout':
      return '#64748b';
    default:
      return d.edgeMuted;
  }
}

/** Standalone pipeline / process symbol tile (catalog + custom diagrams). */
export function createPipelineSymbol(
  app: App,
  type: string,
  x: number,
  y: number,
  label?: string
): Group {
  const kind = resolvePipelineSymbolKind(type);
  const meta = getPipelineSymbolMeta(kind);
  const accent = categoryAccent(meta.category);
  const wrap = app.group({ x, y });
  const radius = 4;
  const pad = app.group({ listening: false });
  pad.mask = app.roundedRect({
    width: SYMBOL_SIZE,
    height: SYMBOL_SIZE,
    cornerRadius: radius,
    listening: false,
  });
  addCardChrome(app, pad, {
    width: SYMBOL_SIZE,
    height: SYMBOL_SIZE,
    cornerRadius: radius,
    fill: getActiveDiagram().schematicFill,
    stroke: getActiveDiagram().labelPillStroke,
    strokeWidth: 1,
    shadow: null,
    sheen: false,
  });
  const topPad = ACCENT_H + 4;
  const sidePad = 6;
  const bottomPad = 6;
  const availW = SYMBOL_SIZE - sidePad * 2;
  const availH = SYMBOL_SIZE - topPad - bottomPad;
  const scale = Math.min(availW / SYMBOL_SIZE, availH / SYMBOL_SIZE) * 0.94;
  const glyphHost = app.group({
    x: (SYMBOL_SIZE - SYMBOL_SIZE * scale) / 2,
    y: topPad + (availH - SYMBOL_SIZE * scale) / 2,
    scaleX: scale,
    scaleY: scale,
    listening: false,
  });
  drawPipelineGlyph(app, glyphHost, kind);
  pad.add(glyphHost);
  wrap.add(pad);
  addAccentBar(app, wrap, SYMBOL_SIZE, accent, ACCENT_H);
  wrap.metadata = { symbolType: kind, pipelineSymbolKind: kind };
  const caption = label ?? meta.label;
  wrap.add(
    app.text({
      text: caption,
      x: centerLabelX(caption, SYMBOL_SIZE),
      y: SYMBOL_SIZE + 6,
      fontSize: getActiveDiagram().fontSize.sm,
      fontWeight: '600',
      fontFamily: getActiveDiagram().fontFamily,
      fill: getActiveDiagram().schematicLabel,
      listening: false,
    })
  );
  return wrap;
}

function centerLabelX(label: string, boxWidth: number): number {
  const approx = label.length * getActiveDiagram().fontSize.sm * 0.55;
  return (boxWidth - approx) / 2;
}

/** Draw a compact glyph into a pipeline stage card (local origin). */
export function drawPipelineStageGlyph(app: App, parent: Group, type: string, x: number, y: number, size = 22): void {
  const kind = resolvePipelineSymbolKind(type);
  const scale = size / SYMBOL_SIZE;
  const host = app.group({ x, y, scaleX: scale, scaleY: scale, listening: false });
  drawPipelineGlyph(app, host, kind);
  parent.add(host);
}

export { categoryAccent as pipelineCategoryAccent };
