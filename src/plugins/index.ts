import type { Plugin, LightDrawStatic } from '../types';
import { registerJSONResolver } from '../registry/jsonResolvers';
import { registerJSONType } from '../io/json';
import { registerEasing } from '../animation/Easing';

const installedPlugins = new Set<string>();

export interface PluginContext {
  registerJSONType: typeof registerJSONType;
  registerJSONResolver: typeof registerJSONResolver;
  registerEasing: typeof registerEasing;
}

export function createPluginContext(): PluginContext {
  return {
    registerJSONType,
    registerJSONResolver,
    registerEasing,
  };
}

export function installPlugin(plugin: Plugin, LightDraw: LightDrawStatic): void {
  if (installedPlugins.has(plugin.name)) return;
  installedPlugins.add(plugin.name);
  plugin.install(LightDraw);
}

export function getInstalledPlugins(): string[] {
  return Array.from(installedPlugins);
}

/** Test hook — reset installed plugin set. */
export function clearInstalledPlugins(): void {
  installedPlugins.clear();
}
