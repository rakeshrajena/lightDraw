/**
 * Native HTML sync integrity — catalog set matches exported sync entrypoints.
 */
import { describe, it, expect } from 'vitest';
import {
  NATIVE_HTML_COMPONENTS,
  syncNativeAccordion,
  syncNativeButton,
  syncNativeCard,
  syncNativeCheckbox,
  syncNativeDialog,
  syncNativeInput,
  syncNativeMenu,
  syncNativeProgress,
  syncNativeRadio,
  syncNativeSlider,
  syncNativeStatusBar,
  syncNativeTable,
  syncNativeTabs,
  syncNativeTextarea,
  syncNativeToast,
  syncNativeToggle,
  syncNativeToolbar,
  syncNativeTooltip,
  syncNativeTree,
} from '../../src/renderers/htmlComponents';

/** Types dispatched via NATIVE_HTML_COMPONENTS in HTMLRenderer. */
const CATALOG_SYNC: Record<string, unknown> = {
  button: syncNativeButton,
  checkbox: syncNativeCheckbox,
  toggle: syncNativeToggle,
  slider: syncNativeSlider,
  radio: syncNativeRadio,
  progressBar: syncNativeProgress,
  card: syncNativeCard,
  tabs: syncNativeTabs,
  accordion: syncNativeAccordion,
  table: syncNativeTable,
  tree: syncNativeTree,
  toolbar: syncNativeToolbar,
  toast: syncNativeToast,
  menu: syncNativeMenu,
  dialog: syncNativeDialog,
  tooltip: syncNativeTooltip,
  statusBar: syncNativeStatusBar,
};

describe('HTML native components structure', () => {
  it('has a sync function for every NATIVE_HTML_COMPONENTS entry', () => {
    const missing = [...NATIVE_HTML_COMPONENTS].filter((id) => !CATALOG_SYNC[id]);
    expect(missing, `missing sync fns: ${missing.join(', ')}`).toEqual([]);
  });

  it('keeps catalog and sync map the same size', () => {
    expect(NATIVE_HTML_COMPONENTS.size).toBe(Object.keys(CATALOG_SYNC).length);
  });

  it('still exports input/textarea sync (handled outside the Set)', () => {
    expect(typeof syncNativeInput).toBe('function');
    expect(typeof syncNativeTextarea).toBe('function');
  });
});
