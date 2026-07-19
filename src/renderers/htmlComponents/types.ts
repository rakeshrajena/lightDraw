/**
 * Native HTML component sync types.
 */
import type { Node } from '../../Node';

export type NativeSyncContext = {
  nodeElements: Map<string, HTMLElement>;
  seenIds: Set<string>;
  focusedNodeId: string | null;
  applyA11y: (node: Node, el: HTMLElement) => void;
  applyUiClasses: (node: Node, el: HTMLElement) => void;
};

export type FormModifiers = {
  size?: string;
  disabled?: boolean;
  invalid?: boolean;
  fullWidth?: boolean;
  error?: string;
};
