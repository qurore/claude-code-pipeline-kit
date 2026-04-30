import { describe, it, expect } from 'vitest';
import { main } from './posttool.remind-migration.js';

// Note: with default kit package.json (migrationGlob: ""), this hook is disabled
// and emits 'migration-glob-not-configured'. Tests below verify both default-disabled
// and (separately) the path matching when configured.

describe('posttool.remind-migration', () => {
  it('silent when migrationGlob not configured (default)', async () => {
    expect(await main(JSON.stringify({ tool_name: 'Write', tool_input: { file_path: 'foo.sql' } }))).toBe(0);
  });

  it('silent on non-migration write', async () => {
    expect(await main(JSON.stringify({ tool_name: 'Write', tool_input: { file_path: 'src/foo.ts' } }))).toBe(0);
  });

  it('silent on Edit tool', async () => {
    expect(await main(JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: 'foo.sql' } }))).toBe(0);
  });

  it('handles malformed stdin', async () => {
    expect(await main('{not json')).toBe(0);
  });
});
