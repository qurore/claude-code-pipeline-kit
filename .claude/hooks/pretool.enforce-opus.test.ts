import { describe, it, expect } from 'vitest';
import { main } from './pretool.enforce-opus.js';

describe('pretool.enforce-opus', () => {
  it('skips wrong tool', async () => {
    expect(await main(JSON.stringify({ tool_name: 'Edit' }))).toBe(0);
  });

  it('allows model: opus', async () => {
    expect(await main(JSON.stringify({ tool_name: 'Task', tool_input: { model: 'opus', subagent_type: 'general-purpose' } }))).toBe(0);
  });

  it('blocks missing model', async () => {
    expect(await main(JSON.stringify({ tool_name: 'Task', tool_input: { subagent_type: 'general-purpose' } }))).toBe(2);
  });

  it('blocks wrong model (sonnet)', async () => {
    expect(await main(JSON.stringify({ tool_name: 'Task', tool_input: { model: 'sonnet', subagent_type: 'general-purpose' } }))).toBe(2);
  });

  it('OPUS_GUARD_DISABLED=1 allows', async () => {
    expect(await main(JSON.stringify({ tool_name: 'Task', tool_input: { subagent_type: 'general-purpose' } }), { OPUS_GUARD_DISABLED: '1' } as NodeJS.ProcessEnv)).toBe(0);
  });

  it('handles malformed stdin', async () => {
    expect(await main('{not json')).toBe(0);
  });
});
