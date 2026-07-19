import type { Plugin, LightDrawStatic } from '../../types';
import { HTMLRenderer } from '../../renderers/HTMLRenderer';
import { registerRenderer } from '../../registry/renderers';

export const htmlPlugin: Plugin = {
  name: 'lightdraw-html',
  version: '1.1.0',
  install(_LD: LightDrawStatic) {
    registerRenderer('html', () => new HTMLRenderer());
  },
};

export { HTMLRenderer };
export default htmlPlugin;
