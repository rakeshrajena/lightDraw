import type { App } from '../App';
import type { Node } from '../Node';
import type { Group } from '../shapes/Group';
import type { Shadow } from '../types';
import type { UiThemeTokens } from './uiTheme';
import { UI } from './theme';
import { getParts, getState } from './helpers';
import { resolveEffectiveUiTokens } from './nodeTheme';
import { createThemeScope } from '../theme/themeScope';
import { parseCssPx, resolveFontSizeTriple } from '../theme/themeUtils';
import { colorWithAlpha } from '../utils/color';

/** Canvas UI palette — same fields as `UI`, but mutable after app theme resolve. */
export type UiCanvasTheme = {
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primarySubtle: string;
  primaryMuted: string;
  secondary: string;
  secondaryHover: string;
  success: string;
  successBg: string;
  warning: string;
  danger: string;
  surface: string;
  surfaceMuted: string;
  surfaceInset: string;
  overlay: string;
  border: string;
  borderStrong: string;
  borderFocus: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  textPlaceholder: string;
  radius: number;
  radiusSm: number;
  radiusLg: number;
  radiusFull: number;
  font: string;
  fontSize: number;
  fontSizeSm: number;
  fontSizeLg: number;
  controlHeight: number;
  inputHeight: number;
  spaceXs: number;
  spaceSm: number;
  spaceMd: number;
  spaceLg: number;
  spaceXl: number;
  shadowSm: Shadow;
  shadowMd: Shadow;
  shadowLg: Shadow;
  shadowPrimary: Shadow;
};

function cloneShadow(s: Shadow): Shadow {
  return { color: s.color, blur: s.blur, offsetX: s.offsetX, offsetY: s.offsetY };
}

/** Merge app UI tokens onto canvas defaults. Empty tokens → identical to `UI`. */
export function resolveUiCanvasTheme(tokens: Partial<UiThemeTokens> = {}): UiCanvasTheme {
  const primary = tokens.primary ?? UI.primary;
  return {
    primary,
    primaryHover: tokens.primaryHover ?? UI.primaryHover,
    primaryActive: tokens.primaryActive ?? UI.primaryActive,
    primarySubtle: tokens.primarySubtle ?? UI.primarySubtle,
    primaryMuted: tokens.primarySubtle ?? UI.primaryMuted,
    secondary: tokens.secondary ?? UI.secondary,
    secondaryHover: tokens.secondaryHover ?? UI.secondaryHover,
    success: tokens.success ?? UI.success,
    successBg: tokens.successSubtle ?? UI.successBg,
    warning: tokens.warning ?? UI.warning,
    danger: tokens.danger ?? UI.danger,
    surface: tokens.surface ?? UI.surface,
    surfaceMuted: tokens.surfaceMuted ?? UI.surfaceMuted,
    surfaceInset: tokens.surfaceInset ?? UI.surfaceInset,
    overlay: tokens.overlay ?? UI.overlay,
    border: tokens.border ?? UI.border,
    borderStrong: tokens.borderStrong ?? UI.borderStrong,
    borderFocus: tokens.primary ?? UI.borderFocus,
    text: tokens.text ?? UI.text,
    textSecondary: tokens.textSecondary ?? UI.textSecondary,
    textMuted: tokens.textMuted ?? UI.textMuted,
    textInverse: tokens.textInverse ?? UI.textInverse,
    textPlaceholder: tokens.placeholder ?? UI.textPlaceholder,
    radius: parseCssPx(tokens.radius, UI.radius),
    radiusSm: parseCssPx(tokens.radiusSm, UI.radiusSm),
    radiusLg: parseCssPx(tokens.radiusLg, UI.radiusLg),
    radiusFull: UI.radiusFull,
    font: tokens.fontFamily ?? UI.font,
    ...resolveFontSizeTriple(tokens, {
      fontSize: UI.fontSize,
      fontSizeSm: UI.fontSizeSm,
      fontSizeLg: UI.fontSizeLg,
    }),
    controlHeight: parseCssPx(tokens.controlHeight, UI.controlHeight),
    inputHeight: parseCssPx(tokens.controlHeight, UI.inputHeight),
    spaceXs: parseCssPx(tokens.spaceXs, UI.spaceXs),
    spaceSm: parseCssPx(tokens.spaceSm, UI.spaceSm),
    spaceMd: parseCssPx(tokens.spaceMd, UI.spaceMd),
    spaceLg: parseCssPx(tokens.spaceLg, UI.spaceLg),
    spaceXl: parseCssPx(tokens.spaceXl, UI.spaceXl),
    shadowSm: cloneShadow(UI.shadowSm),
    shadowMd: tokens.shadowMd
      ? { color: tokens.shadowMd, blur: UI.shadowMd.blur, offsetX: 0, offsetY: 2 }
      : cloneShadow(UI.shadowMd),
    shadowLg: cloneShadow(UI.shadowLg),
    shadowPrimary: {
      color: colorWithAlpha(primary, 0.28) ?? UI.shadowPrimary.color,
      blur: UI.shadowPrimary.blur,
      offsetX: UI.shadowPrimary.offsetX,
      offsetY: UI.shadowPrimary.offsetY,
    },
  };
}

const canvasUiScope = createThemeScope<UiCanvasTheme>(() => resolveUiCanvasTheme({}));

/** Sync App-scoped canvas palette (called from App on init / setUiTheme / create). */
export function syncActiveCanvasUiTheme(
  tokens: Partial<UiThemeTokens>,
  app?: App | null
): UiCanvasTheme {
  return canvasUiScope.sync(resolveUiCanvasTheme(tokens), app ?? undefined);
}

/**
 * Current canvas UI palette for builders.
 * Prefer calling inside a create/refresh (stack); optional `app` uses WeakMap snapshot.
 */
export function getActiveUi(app?: App | null): UiCanvasTheme {
  return canvasUiScope.getActive(app ?? undefined);
}

/** Run factory/refresh with a fixed palette on the build stack. */
export function runWithCanvasUiTheme<R>(theme: UiCanvasTheme, fn: () => R): R {
  return canvasUiScope.runWithResult(theme, fn);
}

/** Resolve palette for an app instance (does not mutate the active theme). */
export function getCanvasUiTheme(app?: App | null): UiCanvasTheme {
  if (app && typeof app.getResolvedTheme === 'function') {
    return resolveUiCanvasTheme(app.getResolvedTheme());
  }
  return resolveUiCanvasTheme({});
}

const UI_COMPONENT_TYPES = new Set([
  'button',
  'card',
  'progressBar',
  'slider',
  'checkbox',
  'toggle',
  'input',
  'textarea',
  'radio',
  'tooltip',
  'menu',
  'dialog',
  'tabs',
  'accordion',
  'table',
  'tree',
  'toolbar',
  'toast',
  'statusBar',
  'label',
]);

function setFill(node: Node | undefined, fill: string): void {
  if (!node) return;
  (node as Node & { fill: string }).fill = fill;
}

function setStroke(node: Node | undefined, stroke: string | null): void {
  if (!node) return;
  (node as Node & { stroke: string | null }).stroke = stroke;
}

function setFontSize(node: Node | undefined, size: number): void {
  if (!node || !Number.isFinite(size)) return;
  (node as Node & { fontSize: number }).fontSize = size;
}

function fontSizeForControl(ui: UiCanvasTheme, size: string): number {
  if (size === 'sm') return ui.fontSizeSm;
  if (size === 'lg') return ui.fontSizeLg;
  return ui.fontSize;
}

function buttonFill(ui: UiCanvasTheme, variant: string, customFill: string, disabled: boolean): string {
  if (disabled) return ui.borderStrong;
  if (customFill) return customFill;
  if (variant === 'secondary') return ui.secondary;
  if (variant === 'ghost') return ui.surface;
  if (variant === 'danger') return ui.danger;
  return ui.primary;
}

function refreshUiNode(node: Node, ui: UiCanvasTheme): void {
  const type = node.metadata?.componentType as string | undefined;
  if (!type || !UI_COMPONENT_TYPES.has(type)) return;

  // Compound widgets: full chrome rebuild (installed at create time)
  const rebuild = node.metadata?.uiRebuild as (() => void) | undefined;
  if (typeof rebuild === 'function') {
    rebuild();
    return;
  }

  const parts = getParts(node);
  const state = getState(node);

  if (type === 'button') {
    const variant = String(state.variant ?? 'primary');
    const disabled = Boolean(state.disabled);
    const customFill = state.hasCustomFill ? String(state.fill ?? '') : '';
    const nextFill = buttonFill(ui, variant, customFill, disabled);
    if (!state.hasCustomFill) {
      node.metadata.componentState = { ...state, fill: buttonFill(ui, variant, '', false) };
    }
    setFill(parts.bg, nextFill);
    if (parts.text) {
      const themedText = variant === 'ghost' ? ui.textSecondary : ui.textInverse;
      const textColor = state.hasCustomColor
        ? String(state.textColor ?? state.color ?? themedText)
        : themedText;
      setFill(parts.text, disabled ? ui.textMuted : textColor);
      const bw = Number(state.width);
      if (Number.isFinite(bw) && bw > 0) {
        (parts.text as { x: number }).x = bw / 2;
      }
      if (state.hasCustomFontSize) {
        const fs = Number(state.fontSize);
        if (Number.isFinite(fs)) setFontSize(parts.text, fs);
      } else {
        setFontSize(parts.text, fontSizeForControl(ui, String(state.size ?? 'md')));
      }
    }
    if (variant === 'ghost') setStroke(parts.bg, ui.border);
    return;
  }

  if (type === 'label') {
    if (!state.hasCustomColor) {
      setFill(node, ui.textMuted);
    }
    if (!state.hasCustomFontSize) {
      setFontSize(node, ui.fontSizeSm);
    }
    return;
  }

  if (type === 'toggle') {
    const on = Boolean(state.value ?? state.checked);
    const disabled = Boolean(state.disabled);
    setFill(parts.track, disabled ? ui.border : on ? ui.primary : ui.borderStrong);
    setFill(parts.knob, ui.surface);
    return;
  }

  if (type === 'checkbox') {
    const checked = Boolean(state.checked ?? state.value);
    const disabled = Boolean(state.disabled);
    setFill(parts.box, disabled ? ui.surfaceMuted : checked ? ui.primary : ui.surface);
    setStroke(parts.box, disabled ? ui.border : checked ? ui.primary : ui.borderStrong);
    return;
  }

  if (type === 'slider') {
    setFill(parts.track, ui.surfaceInset);
    setFill(parts.fill, ui.primary);
    setFill(parts.thumb, ui.surface);
    setStroke(parts.thumb, ui.primary);
    return;
  }

  if (type === 'progressBar') {
    const variant = String(state.variant ?? 'default');
    const fill =
      variant === 'success'
        ? ui.success
        : variant === 'warning'
          ? ui.warning
          : variant === 'danger'
            ? ui.danger
            : ui.primary;
    setFill(parts.track, ui.surfaceInset);
    setFill(parts.fillBar, fill);
    return;
  }

  if (type === 'card') {
    if (parts.bg) {
      setFill(parts.bg, ui.surface);
      setStroke(parts.bg, ui.border);
    }
    if (parts.header) {
      setFill(parts.header, ui.surfaceMuted);
      setStroke(parts.header, ui.border);
    }
    if (parts.title) setFill(parts.title, ui.textMuted);
    if (parts.subtitle) setFill(parts.subtitle, ui.textSecondary);
    return;
  }

  if (type === 'dialog') {
    if (parts.overlay) setFill(parts.overlay, ui.overlay);
    if (parts.panel) {
      setFill(parts.panel, ui.surface);
      setStroke(parts.panel, ui.border);
    }
    if (parts.titleText) setFill(parts.titleText, ui.text);
    return;
  }

  if (type === 'menu') {
    if (parts.bg) {
      setFill(parts.bg, ui.surface);
      setStroke(parts.bg, ui.border);
    } else if ('children' in node && (node as Group).children[0]) {
      setFill((node as Group).children[0], ui.surface);
      setStroke((node as Group).children[0], ui.border);
    }
    // Item labels (text nodes after bg)
    if ('children' in node) {
      const variants = (state.itemVariants as string[]) ?? [];
      const items = (state.items as string[]) ?? [];
      const children = (node as Group).children;
      for (let i = 1; i < children.length; i++) {
        const item = items[i - 1] ?? '';
        const danger =
          variants[i - 1] === 'danger' ||
          ['delete', 'remove', 'danger'].includes(String(item).toLowerCase());
        setFill(children[i], danger ? ui.danger : ui.text);
      }
    }
    return;
  }

  if (type === 'input' || type === 'textarea') {
    const disabled = Boolean(state.disabled);
    const invalid = Boolean(state.invalid);
    setFill(parts.bg, disabled ? ui.surfaceMuted : ui.surface);
    setStroke(parts.bg, invalid ? ui.danger : ui.border);
    if (parts.text) {
      const hasValue = Boolean(state.value);
      const themed = hasValue ? ui.text : ui.textPlaceholder;
      const textColor =
        hasValue && state.hasCustomColor
          ? String(state.textColor ?? state.color ?? themed)
          : themed;
      setFill(parts.text, textColor);
      if (state.hasCustomFontSize) {
        const fs = Number(state.fontSize);
        if (Number.isFinite(fs)) setFontSize(parts.text, fs);
      } else {
        setFontSize(parts.text, ui.fontSize);
      }
    }
    return;
  }

  if (type === 'radio') {
    const selected = Boolean(state.selected ?? state.checked);
    setStroke(parts.outer, selected ? ui.primary : ui.borderStrong);
    setFill(parts.inner, selected ? ui.primary : 'transparent');
    return;
  }

  if (type === 'tooltip') {
    if (parts.anchor) setFill(parts.anchor, ui.primary);
    if (parts.bg) setFill(parts.bg, ui.surfaceInset);
    if (parts.label) setFill(parts.label, ui.textInverse);
    return;
  }

  if (type === 'toast') {
    const variant = String(state.variant ?? 'success');
    const fills: Record<string, string> = {
      success: ui.surfaceInset,
      error: ui.surfaceInset,
      warning: ui.surfaceInset,
      info: ui.primaryMuted,
    };
    if (parts.bg) setFill(parts.bg, fills[variant] ?? fills.success);
    if (parts.text) setFill(parts.text, ui.textInverse);
    return;
  }

  if (type === 'statusBar') {
    if (parts.bg) {
      setFill(parts.bg, ui.surfaceInset);
      setStroke(parts.bg, ui.border);
    }
    if (parts.primarySeg) setFill(parts.primarySeg, ui.primaryMuted);
    const primaryIndex = numState(state, 'primaryIndex', 0);
    const segments = (state.segments as string[]) ?? [];
    for (let i = 0; i < segments.length; i++) {
      setFill(parts[`seg${i}`], i === primaryIndex ? ui.text : ui.textMuted);
    }
  }
}

function numState(state: Record<string, unknown>, key: string, fallback: number): number {
  const v = state[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

/** Walk stage and update canvas UI component part colors (per-node uiTheme wins). */
export function refreshCanvasUi(root: Node, app?: App | null): void {
  const visit = (n: Node) => {
    const state = getState(n);
    const tokens = app ? resolveEffectiveUiTokens(app, state) : {};
    const ui = resolveUiCanvasTheme(tokens);
    runWithCanvasUiTheme(ui, () => refreshUiNode(n, ui));
    if ('children' in n) {
      for (const child of (n as Group).children) visit(child);
    }
  };
  visit(root);
}
