/**
 * Scene / theme JSON validation module.
 * @see docs/repo-modularity.md
 */
export type {
  ValidationIssue,
  ValidationResult,
  JsonErrorLocation,
  ValidateSceneOptions,
  ValidateThemeOptions,
} from './types';
export {
  extractJsonErrorOffset,
  locateJsonError,
  formatJsonParseError,
} from './jsonLocate';
export { validateThemePack } from './theme';
export { validateSceneJSON } from './scene';
export { formatValidationErrors } from './format';
export { parseAndValidateSceneJSON } from './parse';
export {
  listKnownSceneTypes,
  formatExpectedValues,
  formatInvalidValue,
  suggestClosest,
  UI_THEME_PRESETS,
  AUTOMOTIVE_THEME_PRESETS,
  registerKnownSceneTypes,
} from '../sceneCatalog';
