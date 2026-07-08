/** Shared type definitions for LightDraw.js */

export type RendererType = 'auto' | 'canvas' | 'svg' | 'html';

export type Point = { x: number; y: number };

export type Size = { width: number; height: number };

export type Rect = Point & Size;

export type FillStyle = string | Gradient | Pattern | null;

export type StrokeStyle = string | Gradient | Pattern | null;

export interface GradientStop {
  offset: number;
  color: string;
}

export interface Gradient {
  type: 'linear' | 'radial';
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  r0?: number;
  r1?: number;
  stops: GradientStop[];
}

export interface Pattern {
  type: 'pattern';
  source: HTMLImageElement | HTMLCanvasElement | string;
  repeat: 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat';
}

export interface Shadow {
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

export interface TransformState {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  skewX: number;
  skewY: number;
  opacity: number;
}

export interface NodeOptions extends Partial<TransformState> {
  id?: string;
  name?: string;
  visible?: boolean;
  zIndex?: number;
  fill?: FillStyle;
  stroke?: StrokeStyle;
  strokeWidth?: number;
  lineCap?: CanvasLineCap;
  lineJoin?: CanvasLineJoin;
  dash?: number[];
  dashOffset?: number;
  shadow?: Shadow | null;
  clip?: boolean;
  mask?: Node | null;
  metadata?: Record<string, unknown>;
  listening?: boolean;
  draggable?: boolean;
  /** Accept drag-drop from other nodes (Phase 4). */
  dropTarget?: boolean;
  /** Payload transferred on drop (Phase 4). */
  dragPayload?: unknown;
  /** Include in keyboard tab order (Phase 4). */
  focusable?: boolean;
  tabIndex?: number;
  /** ARIA role override (Phase 4). */
  role?: string;
  ariaChecked?: boolean;
  ariaValueNow?: number;
  ariaValueMin?: number;
  ariaValueMax?: number;
  ariaLive?: 'off' | 'polite' | 'assertive';
  /** Cache subtree to offscreen bitmap when static (Phase 2). */
  cacheAsBitmap?: boolean;
  [key: string]: unknown;
}

export interface PerformanceOptions {
  /** Use grid spatial index when node count exceeds threshold. Default true. */
  spatialIndex?: boolean;
  /** Minimum nodes before spatial index activates. Default 100. */
  spatialIndexThreshold?: number;
  /** Enable dirty-region partial clears on canvas. Default true. */
  dirtyRegions?: boolean;
  /** Enable fill batching for same-style rects. Default true. */
  batchRendering?: boolean;
  /** Enable offscreen layer cache for cacheAsBitmap groups. Default true. */
  layerCache?: boolean;
}

export interface AppOptions {
  renderer?: RendererType;
  width?: number;
  height?: number;
  background?: string;
  pixelRatio?: number;
  antialias?: boolean;
  autoResize?: boolean;
  accessibility?: boolean;
  highContrast?: boolean;
  /** Optional design tokens — applied as CSS variables (no custom CSS file needed). */
  uiTheme?: import('./components/uiTheme').UiThemeInput;
  performance?: PerformanceOptions;
}

export type EventType =
  | 'click'
  | 'dblclick'
  | 'pointerdown'
  | 'pointerup'
  | 'pointermove'
  | 'pointerenter'
  | 'pointerleave'
  | 'mousedown'
  | 'mouseup'
  | 'mousemove'
  | 'mouseenter'
  | 'mouseleave'
  | 'touchstart'
  | 'touchend'
  | 'touchmove'
  | 'dragstart'
  | 'dragmove'
  | 'dragend'
  | 'dragover'
  | 'drop'
  | 'wheel'
  | 'keydown'
  | 'keyup'
  | 'focus'
  | 'blur'
  | string;

export interface LightDrawEvent {
  type: EventType;
  target: unknown;
  currentTarget?: unknown;
  originalEvent: Event;
  x: number;
  y: number;
  worldX: number;
  worldY: number;
  /** Drag-drop payload (Phase 4). */
  payload?: unknown;
  /** Component interaction value (Phase 6). */
  value?: unknown;
  /** List/table selection index (Phase 6). */
  index?: number;
  /** Selected item label (Phase 6). */
  item?: unknown;
  /** Changed field name (Phase 6). */
  field?: string;
  /** Tab/section label (Phase 6). */
  tab?: string;
  section?: string;
  row?: unknown;
  preventDefault(): void;
  stopPropagation(): void;
}

export interface AnimationOptions {
  duration?: number;
  delay?: number;
  easing?: string | EasingFn;
  repeat?: number;
  reverse?: boolean;
  loop?: boolean;
  onStart?: () => void;
  onUpdate?: (progress: number) => void;
  onComplete?: () => void;
  [key: string]: unknown;
}

export type EasingFn = (t: number) => number;

export interface SceneJSON {
  type: string;
  id?: string;
  props?: Record<string, unknown>;
  children?: SceneJSON[];
}

export interface Plugin {
  name: string;
  version?: string;
  install(LightDraw: LightDrawStatic): void;
}

export interface LightDrawStatic {
  use(plugin: Plugin): void;
  createApp(container: string | HTMLElement, options?: AppOptions): import('./App').App;
  version: string;
}

export interface HitTestResult {
  node: import('./Node').Node;
  x: number;
  y: number;
}
