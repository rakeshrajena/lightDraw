import type { Plugin, LightDrawStatic } from '../../types';
import { registerJSONResolver } from '../../registry/jsonResolvers';
import {
  registerComponent,
  createComponentFromJSON,
} from '../../components/registry';

export const uiPlugin: Plugin = {
  name: 'lightdraw-ui',
  version: '1.2.0',
  install(LD: LightDrawStatic) {
    registerJSONResolver((type, props, app) => createComponentFromJSON(type, props, app));
    (LD as LightDrawStatic & { registerComponent: typeof registerComponent }).registerComponent =
      registerComponent;
  },
};

export { registerComponent, createComponentFromJSON };
export { applyUiTheme, resolveUiTheme, UI_PRESETS, UI_THEME_VAR_MAP } from '../../components/uiTheme';
export type { UiThemeTokens, UiThemeInput, UiThemePreset } from '../../components/uiTheme';
export {
  resolveUiCanvasTheme,
  getCanvasUiTheme,
  getActiveUi,
  refreshCanvasUi,
  syncActiveCanvasUiTheme,
  runWithCanvasUiTheme,
} from '../../components/resolveCanvasTheme';
export type { UiCanvasTheme } from '../../components/resolveCanvasTheme';
export {
  resolveEffectiveUiTokens,
  resolveNodeTypography,
  flatTypographyFromProps,
  hasCustomTextColor,
  hasCustomFontSize,
  readNodeUiThemeProp,
  normalizeNodeUiTheme,
  hasNodeUiThemeOverride,
} from '../../components/nodeTheme';
export type { NodeUiThemeProp, NodeTypography } from '../../components/nodeTheme';
export default uiPlugin;
