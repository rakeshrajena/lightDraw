import { CanvasRenderer } from '../renderers/CanvasRenderer';
import { registerRenderer, hasRenderer } from './renderers';

if (!hasRenderer('canvas')) {
  registerRenderer('canvas', () => new CanvasRenderer());
}
