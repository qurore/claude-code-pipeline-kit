import { describe, it, expect } from 'vitest';
import { findMissing, main } from './posttool.lint-skill.js';

describe('findMissing', () => {
  it('returns empty for proper skill file', () => {
    expect(findMissing('# Title\n\n## Purpose\n\nx')).toEqual([]);
  });

  it('flags missing H1', () => {
    expect(findMissing('## Purpose\n')).toContain('# H1 heading');
  });

  it('flags missing required section', () => {
    const missing = findMissing('# Title\n\nbody only');
    expect(missing.some((m) => m.includes('Purpose'))).toBe(true);
  });
});

describe('main', () => {
  it('skips non-skill files', async () => {
    expect(await main(JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: 'src/a.md', content: '' } }))).toBe(0);
  });

  it('skips wrong tool', async () => {
    expect(await main(JSON.stringify({ tool_name: 'Read', tool_input: { file_path: '.claude/commands/foo.md', content: '' } }))).toBe(0);
  });

  it('handles malformed stdin', async () => {
    expect(await main('{not json')).toBe(0);
  });

  it('skips when no file_path', async () => {
    expect(await main(JSON.stringify({ tool_name: 'Edit', tool_input: {} }))).toBe(0);
  });

  it('skips when no content', async () => {
    expect(await main(JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: '.claude/commands/foo.md' } }))).toBe(0);
  });

  it('exits 0 with violations (warn-only)', async () => {
    expect(await main(JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: '.claude/commands/foo.md', content: 'just text' } }))).toBe(0);
  });

  it('exits 0 with no violations on well-formed file', async () => {
    expect(await main(JSON.stringify({ tool_name: 'Write', tool_input: { file_path: '.claude/commands/foo.md', content: '# Title\n\n## Purpose\nx' } }))).toBe(0);
  });

  it('uses new_string when content is missing', async () => {
    expect(await main(JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: '.claude/commands/foo.md', new_string: '# Title\n## Usage\nx' } }))).toBe(0);
  });
});
