import { describe, it, expect } from 'vitest';
import { isHelpRequested, printHelp } from './help.js';

describe('isHelpRequested', () => {
  it('detects --help', () => {
    expect(isHelpRequested(['node', 'x.js', '--help'])).toBe(true);
  });

  it('detects -h', () => {
    expect(isHelpRequested(['node', 'x.js', '-h'])).toBe(true);
  });

  it('returns false otherwise', () => {
    expect(isHelpRequested(['node', 'x.js'])).toBe(false);
  });
});

describe('printHelp', () => {
  it('prints all 7 fields', () => {
    const out = printHelp({
      name: 'test-hook',
      description: 'a test hook',
      inputs: ['tool_name'],
      exitCodes: [{ code: 0, meaning: 'ok' }],
      envVars: [{ name: 'FOO', effect: 'does foo' }],
      bypass: ['set FOO=1'],
      docsAnchor: 'test',
      testIds: ['T1.1'],
    });
    expect(out).toContain('test-hook');
    expect(out).toContain('a test hook');
    expect(out).toContain('tool_name');
    expect(out).toContain('0: ok');
    expect(out).toContain('FOO');
    expect(out).toContain('set FOO=1');
    expect(out).toContain('README.md#test');
    expect(out).toContain('T1.1');
  });
});
