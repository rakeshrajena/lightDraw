/**
 * Scene / theme JSON validation façade.
 * Implementation: `./schema/`
 */
export type {
  ValidationIssue,
  ValidationResult,
  JsonErrorLocation,
  ValidateSceneOptions,
  ValidateThemeOptions,
} from './schema/index';
export {
  extractJsonErrorOffset,
  locateJsonError,
  formatJsonParseError,
  validateThemePack,
  validateSceneJSON,
  formatValidationErrors,
  parseAndValidateSceneJSON,
  listKnownSceneTypes,
  formatExpectedValues,
  formatInvalidValue,
  suggestClosest,
  UI_THEME_PRESETS,
  AUTOMOTIVE_THEME_PRESETS,
  registerKnownSceneTypes,
} from './schema/index';
