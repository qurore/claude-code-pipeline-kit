import { describe, it, expect } from 'vitest';
import { findViolations, isWhitelisted, main } from './posttool.lint-ui.js';

describe('isWhitelisted', () => {
  it('matches proper nouns', () => {
    expect(isWhitelisted('GitHub')).toBe(true);
    expect(isWhitelisted('OAuth')).toBe(true);
    expect(isWhitelisted('TypeScript')).toBe(true);
  });

  it('rejects non-proper-nouns', () => {
    expect(isWhitelisted('Save All Files')).toBe(false);
  });
});

describe('findViolations', () => {
  it('detects title-case in JSX', () => {
    const v = findViolations('a.tsx', '<Button>Save All Files</Button>');
    expect(v.length).toBeGreaterThan(0);
    expect(v[0].rule).toBe('title-case');
    expect(v[0].line).toBe(1);
  });

  it('whitelists proper nouns', () => {
    const v = findViolations('a.tsx', '<h1>GitHub</h1>');
    const titleCaseViols = v.filter((x) => x.rule === 'title-case');
    expect(titleCaseViols.length).toBe(0);
  });

  it('detects muted-foreground on long text', () => {
    const v = findViolations('a.tsx', '<p className="text-muted-foreground">' + 'x'.repeat(45) + '</p>');
    expect(v.some((x) => x.rule === 'muted-foreground-on-description')).toBe(true);
  });

  it('detects button text shift', () => {
    const v = findViolations('a.tsx', '<Button>{isLoading ? "Saving..." : "Save"}</Button>');
    expect(v.some((x) => x.rule === 'button-text-shift')).toBe(true);
  });
});

describe('main', () => {
  it('skips non-tsx', async () => {
    expect(await main(JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: 'foo.ts', content: '' } }))).toBe(0);
  });

  it('skips wrong tool', async () => {
    expect(await main(JSON.stringify({ tool_name: 'Read', tool_input: { file_path: 'foo.tsx' } }))).toBe(0);
  });

  it('always exits 0 even with violations', async () => {
    expect(await main(JSON.stringify({ tool_name: 'Write', tool_input: { file_path: 'foo.tsx', content: '<Button>Save All Files</Button>' } }))).toBe(0);
  });

  it('handles malformed stdin', async () => {
    expect(await main('{not json')).toBe(0);
  });

  it('skips when file_path missing', async () => {
    expect(await main(JSON.stringify({ tool_name: 'Edit', tool_input: {} }))).toBe(0);
  });

  it('skips when content empty', async () => {
    expect(await main(JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: 'foo.tsx' } }))).toBe(0);
  });

  it('uses new_string when content missing', async () => {
    expect(await main(JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: 'foo.tsx', new_string: '<div>OK</div>' } }))).toBe(0);
  });
});
