import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

let tmpHome: string;
let originalCwd: string;

beforeEach(() => {
  tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-output-test-'));
  originalCwd = process.cwd();
  process.chdir(tmpHome);
  fs.mkdirSync(path.join(tmpHome, '.claude/pipeline-state'), { recursive: true });
});

afterEach(() => {
  process.chdir(originalCwd);
  fs.rmSync(tmpHome, { recursive: true, force: true });
});

async function runHook(stdinJson: string, env: NodeJS.ProcessEnv = {}): Promise<number> {
  const mod = await import('./pretool.gate-output.js');
  return mod.main(stdinJson, env, tmpHome);
}

function makeManifest(currentPhase: string) {
  const dir = path.join(tmpHome, '.claude/pipeline-state/test-run');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({
    pipeline: 'se', run_id: 'test', feature: 'f',
    started_at: '2026-04-28T00:00:00+09:00',
    last_activity_at: '2026-04-28T00:00:00+09:00',
    current_phase: currentPhase, iteration: 1, max_iterations: 4, restart_count: 0,
    status: 'in_progress', output_mode: 'code',
    br_flags: { se_1: false, se_2: false, eiw_1: false, drw_1: false },
    phase_history: [], accumulated_feedback: [],
  }));
}

describe('pretool.gate-output', () => {
  it('skips wrong tool', async () => {
    const code = await runHook(JSON.stringify({ tool_name: 'Read', tool_input: { file_path: 'x.ts' } }));
    expect(code).toBe(0);
  });

  it('allows .claude/ writes', async () => {
    const code = await runHook(JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: '.claude/foo.md' } }));
    expect(code).toBe(0);
  });

  it('allows .git/ writes', async () => {
    const code = await runHook(JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: '.git/HEAD' } }));
    expect(code).toBe(0);
  });

  it('EDITOR_BYPASS=1 allows', async () => {
    const code = await runHook(JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: 'src/foo.ts' } }), { EDITOR_BYPASS: '1' });
    expect(code).toBe(0);
  });

  it('blocks when no manifest', async () => {
    const code = await runHook(JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: 'src/foo.ts' } }));
    expect(code).toBe(2);
  });

  it('allows during implementation phase 6', async () => {
    makeManifest('6');
    const code = await runHook(JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: 'src/foo.ts' } }));
    expect(code).toBe(0);
  });

  it('blocks during non-implementation phase', async () => {
    makeManifest('4');
    const code = await runHook(JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: 'src/foo.ts' } }));
    expect(code).toBe(2);
  });

  it('sentinel consumed allows once and removes file', async () => {
    const sentinel = path.join(tmpHome, '.claude/pipeline-state/.trivial-fix-active');
    fs.writeFileSync(sentinel, '');
    const code = await runHook(JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: 'src/foo.ts' } }));
    expect(code).toBe(0);
    expect(fs.existsSync(sentinel)).toBe(false);
    const consumed = fs.readdirSync(path.join(tmpHome, '.claude/pipeline-state')).filter((f) => f.startsWith('.trivial-fix-active.consumed.'));
    expect(consumed.length).toBe(1);
  });

  it('handles malformed stdin gracefully', async () => {
    const code = await runHook('{not json');
    expect(code).toBe(0);
  });

  it('skips when file_path missing', async () => {
    const code = await runHook(JSON.stringify({ tool_name: 'Edit', tool_input: {} }));
    expect(code).toBe(0);
  });
});
