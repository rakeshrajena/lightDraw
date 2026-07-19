import { describe, it, expect } from 'vitest';
import {
  createPipeline,
  createPipelineSymbolCatalog,
  createPipelineSymbol,
  listPipelineSymbols,
  listPipelineSymbolCategories,
  resolvePipelineSymbolKind,
  getPipelineSymbolMeta,
} from '../src/diagram/index';
import { createTestApp, createTestContainer } from './helpers';

describe('Pipeline process symbol catalog', () => {
  it('lists a full multi-category catalog', () => {
    const all = listPipelineSymbols();
    expect(all.length).toBeGreaterThanOrEqual(240);
    const cats = listPipelineSymbolCategories();
    expect(cats).toEqual(
      expect.arrayContaining([
        'flow',
        'gateway',
        'event',
        'data',
        'cicd',
        'manufacturing',
        'logistics',
        'industrial',
        'cloud',
        'people',
      ])
    );
    expect(listPipelineSymbols('cicd').every((m) => m.category === 'cicd')).toBe(true);
  });

  it('resolves aliases', () => {
    expect(resolvePipelineSymbolKind('db')).toBe('database');
    expect(resolvePipelineSymbolKind('k8s')).toBe('kubernetesCluster');
    expect(resolvePipelineSymbolKind('wip')).toBe('workInProgress');
    expect(resolvePipelineSymbolKind('xor_gateway')).toBe('exclusiveGateway');
    expect(getPipelineSymbolMeta('deploy').label).toMatch(/Deploy/i);
  });

  it('creates symbols for representative families without error', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    const kinds = [
      'start',
      'process',
      'exclusiveGateway',
      'timer',
      'database',
      'build',
      'deploy',
      'user',
      'robot',
      'truck',
      'plc',
      'cloud',
      'aiAgent',
      'success',
    ];
    for (const kind of kinds) {
      const sym = createPipelineSymbol(app, kind, 0, 0, kind);
      expect(sym.metadata.pipelineSymbolKind).toBe(resolvePipelineSymbolKind(kind));
      expect(sym.children.length).toBeGreaterThan(0);
    }
    app.destroy();
  });

  it('builds a pipeline with typed stages', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    const group = createPipeline(app, [
      { id: 'a', label: 'Build', status: 'done', type: 'build' },
      { id: 'b', label: 'Deploy', status: 'active', type: 'deploy' },
      { id: 'c', label: 'Monitor', status: 'pending', type: 'monitoring' },
    ]);
    expect(group.children.length).toBeGreaterThanOrEqual(3);
    const catalog = createPipelineSymbolCatalog(app, { category: 'cicd', columns: 6 });
    expect(catalog.children.length).toBe(listPipelineSymbols('cicd').length);
    app.destroy();
  });
});
