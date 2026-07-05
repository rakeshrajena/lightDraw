export {
  registerComponent,
  createComponentFromJSON,
  UIComponent,
  registry,
} from './registryCore';

export { componentToJSON } from './helpers';

/** Side-effect: register all built-in UI components (Phase 6). */
import './definitions';
