import type { Node } from '../Node';
import type { SceneJSON } from '../types';

/** Supported export formats (Phase 10). */
export type ExportFormat = 'png' | 'jpeg' | 'svg' | 'pdf' | 'json' | 'html';

/** Region to crop export — node bounds or explicit rect. */
export type ExportRegion =
  | Node
  | { x: number; y: number; width: number; height: number };

/** Options for `app.export()` unified API. */
export interface ExportOptions {
  format: ExportFormat;
  /** JPEG quality 0–1. Default 0.92 */
  quality?: number;
  /** Device pixel ratio for raster exports. Default: app pixel ratio */
  pixelRatio?: number;
  /** Crop to node bounds or explicit rectangle */
  region?: ExportRegion;
  /** Override background color for export */
  background?: string;
  /** Validate JSON against scene schema on json export */
  validate?: boolean;
  /** Omit identity defaults on json/html scene payloads */
  compact?: boolean;
  /** PDF page count (multi-page diagram export) */
  pages?: number;
}

/** Result from unified export API. */
export interface ExportResult {
  format: ExportFormat;
  /** Data URL (raster/svg/pdf), XML string (svg file), JSON object, or HTML string */
  data: string | SceneJSON | Uint8Array;
  mimeType: string;
  width?: number;
  height?: number;
}

export const EXPORT_MIME: Record<ExportFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  json: 'application/json',
  html: 'text/html',
};
