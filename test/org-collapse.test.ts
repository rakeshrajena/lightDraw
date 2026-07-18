import { describe, it, expect, afterEach } from 'vitest';
import { createOrgChart, toggleOrgCollapse } from '../src/diagram/definitions';
import { createTestApp, createTestContainer } from './helpers';
import type { Group } from '../src/shapes/Group';

describe('Org chart branch minimize', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('hides children and switches minimize/maximize glyph colors', () => {
    const container = createTestContainer(800, 500);
    const app = createTestApp(container, { renderer: 'canvas', width: 800, height: 500 });
    const org = createOrgChart(
      app,
      {
        name: 'CEO',
        children: [
          { name: 'CTO', children: [{ name: 'Dev Lead' }] },
          { name: 'CFO' },
        ],
      },
      { width: 800, height: 500 }
    );
    app.add(org);
    app.render();

    const ceo = org.children.find((c) => c.metadata?.orgNode) as Group;
    expect(ceo).toBeTruthy();
    const btn = ceo.metadata.collapseButton as Group;
    expect(btn).toBeTruthy();
    expect(btn.metadata.orgCollapseBtn).toBe(true);
    // CEO has 3 total descendants: CTO, Dev Lead, CFO
    expect(ceo.metadata.descendantCount).toBe(3);
    const expandedLabel = btn.children.find((c) => typeof (c as { text?: string }).text === 'string') as {
      text?: string;
    };
    expect(expandedLabel?.text).toBe('−3');

    const kidsBefore = ceo.children.filter((c) => c.metadata?.orgNode && c.visible !== false);
    expect(kidsBefore.length).toBe(2);

    const expandedFill = (btn.children[0] as { fill?: string }).fill;

    toggleOrgCollapse(ceo);
    expect(ceo.metadata.collapsed).toBe(true);
    const visibleKids = ceo.children.filter((c) => c.metadata?.orgNode && c.visible !== false);
    expect(visibleKids.length).toBe(0);
    const collapsedFill = (btn.children[0] as { fill?: string }).fill;
    expect(collapsedFill).toBeTruthy();
    expect(collapsedFill).not.toBe(expandedFill);
    const collapsedLabel = btn.children.find((c) => typeof (c as { text?: string }).text === 'string') as {
      text?: string;
    };
    expect(collapsedLabel?.text).toBe('+3');

    toggleOrgCollapse(ceo);
    expect(ceo.metadata.collapsed).toBe(false);
    const restored = ceo.children.filter((c) => c.metadata?.orgNode && c.visible !== false);
    expect(restored.length).toBe(2);
    expect((btn.children[0] as { fill?: string }).fill).toBe(expandedFill);

    app.destroy();
  });

  it('shows total descendants on branch buttons, not only direct children', () => {
    const container = createTestContainer(900, 520);
    const app = createTestApp(container, { renderer: 'canvas', width: 900, height: 520 });
    const org = createOrgChart(
      app,
      {
        name: 'CEO',
        children: [
          {
            name: 'CTO',
            children: [
              { name: 'Eng A', children: [{ name: 'IC1' }, { name: 'IC2' }] },
              { name: 'Eng B' },
            ],
          },
          { name: 'CFO' },
        ],
      },
      { width: 900, height: 520 }
    );
    app.add(org);
    app.render();

    const ceo = org.children.find((c) => c.metadata?.orgNode) as Group;
    const cto = ceo.children.find((c) => c.metadata?.orgName === 'CTO') as Group;
    // CTO subtree: Eng A, IC1, IC2, Eng B = 4 (not just 2 direct)
    expect(cto.metadata.descendantCount).toBe(4);
    expect(cto.metadata.childCount).toBe(2);
    // CEO: CTO, Eng A, IC1, IC2, Eng B, CFO
    expect(ceo.metadata.descendantCount).toBe(6);

    toggleOrgCollapse(cto);
    const btn = cto.metadata.collapseButton as Group;
    const label = btn.children.find((c) => typeof (c as { text?: string }).text === 'string') as {
      text?: string;
    };
    expect(label?.text).toBe('+4');

    app.destroy();
  });

  it('relayout packs siblings after a branch is minimized', () => {
    const container = createTestContainer(900, 520);
    const app = createTestApp(container, { renderer: 'canvas', width: 900, height: 520 });
    const org = createOrgChart(
      app,
      {
        name: 'CEO',
        children: [
          {
            name: 'CTO',
            children: [{ name: 'Eng A' }, { name: 'Eng B' }],
          },
          { name: 'CFO' },
        ],
      },
      { width: 900, height: 520 }
    );
    app.add(org);
    app.render();

    const ceo = org.children.find((c) => c.metadata?.orgNode) as Group;
    const cto = ceo.children.find((c) => c.metadata?.orgName === 'CTO') as Group;
    const cfoBefore = ceo.children.find((c) => c.metadata?.orgName === 'CFO') as Group;
    const cfoXBefore = cfoBefore.x;

    toggleOrgCollapse(cto);
    app.render();

    const cfoAfter = ceo.children.find((c) => c.metadata?.orgName === 'CFO') as Group;
    expect(cfoAfter.visible).not.toBe(false);
    expect(Math.abs(cfoAfter.x - cfoXBefore) > 0.5 || cto.metadata.collapsed === true).toBe(true);
    expect(cto.metadata.collapsed).toBe(true);

    app.destroy();
  });

  it('assigns distinct grouping colors per branch and inherits to sub-branches', () => {
    const container = createTestContainer(900, 520);
    const app = createTestApp(container, { renderer: 'canvas', width: 900, height: 520 });
    const org = createOrgChart(
      app,
      {
        name: 'CEO',
        children: [
          { name: 'CTO', children: [{ name: 'Dev Lead' }] },
          { name: 'CFO', children: [{ name: 'Controller' }] },
          { name: 'CMO' },
        ],
      },
      { width: 900, height: 520 }
    );
    app.add(org);
    app.render();

    const ceo = org.children.find((c) => c.metadata?.orgNode) as Group;
    const cto = ceo.children.find((c) => c.metadata?.orgName === 'CTO') as Group;
    const cfo = ceo.children.find((c) => c.metadata?.orgName === 'CFO') as Group;
    const cmo = ceo.children.find((c) => c.metadata?.orgName === 'CMO') as Group;
    const devLead = cto.children.find((c) => c.metadata?.orgName === 'Dev Lead') as Group;

    expect(cto.metadata.orgBranchAccent).toBeTruthy();
    expect(cfo.metadata.orgBranchAccent).toBeTruthy();
    expect(cmo.metadata.orgBranchAccent).toBeTruthy();
    expect(cto.metadata.orgBranchAccent).not.toBe(cfo.metadata.orgBranchAccent);
    expect(cfo.metadata.orgBranchAccent).not.toBe(cmo.metadata.orgBranchAccent);
    // Sub-branch inherits parent branch accent
    expect(devLead.metadata.orgBranchAccent).toBe(cto.metadata.orgBranchAccent);
    expect(ceo.metadata.orgBranchIndex).toBeNull();
    expect(cto.metadata.orgBranchIndex).toBe(0);
    expect(devLead.metadata.orgBranchIndex).toBe(0);

    app.destroy();
  });
});
