/**
 * UI definitions integrity — every built-in component remains registered.
 */
import { describe, it, expect } from 'vitest';
import { registry } from '../../src/components/registry';

/** Must stay in sync with `src/components/definitions/` registrations. */
const EXPECTED_UI_COMPONENTS = [
  'button',
  'label',
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
] as const;

describe('UI definitions structure', () => {
  it('registers every built-in component id', () => {
    const missing = EXPECTED_UI_COMPONENTS.filter((id) => !(id in registry));
    expect(missing, `missing registrations: ${missing.join(', ')}`).toEqual([]);
  });

  it('does not drop below the known built-in count', () => {
    expect(Object.keys(registry).length).toBeGreaterThanOrEqual(EXPECTED_UI_COMPONENTS.length);
  });
});
