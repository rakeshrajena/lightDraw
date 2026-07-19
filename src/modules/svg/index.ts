import type { Plugin, LightDrawStatic } from '../../types';
import { SVGRenderer } from '../../renderers/SVGRenderer';
import { registerRenderer } from '../../registry/renderers';

export const svgPlugin: Plugin = {
  name: 'lightdraw-svg',
  version: '1.1.0',
  install(_LD: LightDrawStatic) {
    registerRenderer('svg', () => new SVGRenderer());
  },
};

export { SVGRenderer };
export default svgPlugin;
