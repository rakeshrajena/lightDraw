/**
 * Validation result formatting.
 */
import type { ValidationResult } from './types';

/** Join validation errors into one UI-friendly string. */
export function formatValidationErrors(result: ValidationResult): string {
  if (result.valid) return '';
  if (result.errors.length === 1) return result.errors[0];
  return (
    `${result.errors.length} validation errors:\n` +
    result.errors.map((e, i) => `  ${i + 1}. ${e}`).join('\n')
  );
}
