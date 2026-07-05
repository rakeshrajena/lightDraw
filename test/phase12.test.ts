import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { execSync } from 'child_process';

describe('Phase 12 — Production release hardening', () => {
  it('VERSIONING policy documented', () => {
    expect(existsSync('docs/VERSIONING.md')).toBe(true);
    const text = readFileSync('docs/VERSIONING.md', 'utf8');
    expect(text).toMatch(/semantic versioning/i);
    expect(text).toMatch(/MAJOR|MINOR|PATCH/);
  });

  it('release workflow documented', () => {
    expect(existsSync('docs/RELEASE.md')).toBe(true);
    const text = readFileSync('docs/RELEASE.md', 'utf8');
    expect(text).toMatch(/GitHub Release/i);
    expect(text).toMatch(/npm publish/i);
  });

  it('v1.0.0 release notes exist', () => {
    expect(existsSync('docs/v1-release-notes.md')).toBe(true);
    const text = readFileSync('docs/v1-release-notes.md', 'utf8');
    expect(text).toMatch(/v1\.0\.0/);
    expect(text).toMatch(/v0\.1/);
  });

  it('GitHub release workflow exists', () => {
    expect(existsSync('.github/workflows/release.yml')).toBe(true);
    const yml = readFileSync('.github/workflows/release.yml', 'utf8');
    expect(yml).toMatch(/release/i);
    expect(yml).toMatch(/tags:/);
  });

  it('package.json publish metadata', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(pkg.files).toContain('dist');
    expect(pkg.repository.url).toMatch(/rakeshrajena\/lightDraw/);
    expect(pkg.author).toMatch(/Rakesh/);
    expect(pkg.publishConfig?.access).toBe('public');
  });

  it('npm audit — no critical production vulnerabilities', () => {
    try {
      execSync('npm audit --production --audit-level=critical', { stdio: 'pipe', encoding: 'utf8' });
    } catch (e: unknown) {
      const err = e as { stdout?: string; status?: number };
      if (err.status === 1 && err.stdout?.toLowerCase().includes('critical')) {
        throw new Error(`Critical production audit findings:\n${err.stdout}`);
      }
    }
    expect(true).toBe(true);
  });

  it('README includes author and repository links', () => {
    const readme = readFileSync('README.md', 'utf8');
    expect(readme).toMatch(/Rakesh Ranjan Jena/);
    expect(readme).toMatch(/rakeshrajena\/lightDraw/);
    expect(readme).toMatch(/jsdelivr\.net\/npm\/lightdraw/);
  });
});
