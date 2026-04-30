import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

let tmpHome: string;
let originalCwd: string;
let stderrBuf: string;
let originalWrite: typeof process.stderr.write;

function makeRun(name: string, manifest: Partial<{ status: string; current_phase: string; last_activity_at: string }>) {
  const dir = path.join(tmpHome, '.claude/pipeline-state', name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({
    pipeline: 'se', run_id: name, feature: 'f',
    started_at: '2026-04-28T00:00:00+09:00',
    last_activity_at: manifest.last_activity_at ?? '2026-04-28T00:00:00+09:00',
    current_phase: manifest.current_phase ?? '5',
    iteration: 1, max_iterations: 4, restart_count: 0,
    status: manifest.status ?? 'in_progress', output_mode: 'code',
    br_flags: { se_1: false, se_2: false, eiw_1: false, drw_1: false },
    phase_history: [], accumulated_feedback: [],
  }));
}

beforeEach(() => {
  tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'session-test-'));
  originalCwd = process.cwd();
  process.chdir(tmpHome);
  fs.mkdirSync(path.join(tmpHome, '.claude/pipeline-state'), { recursive: true });
  fs.mkdirSync(path.join(tmpHome, '.claude/pdca-archive/runs'), { recursive: true });
  stderrBuf = '';
  originalWrite = process.stderr.write.bind(process.stderr);
  process.stderr.write = ((chunk: string | Uint8Array) => {
    stderrBuf += typeof chunk === 'string' ? chunk : chunk.toString();
    return true;
  }) as typeof process.stderr.write;
});

afterEach(() => {
  process.stderr.write = originalWrite;
  process.chdir(originalCwd);
  fs.rmSync(tmpHome, { recursive: true, force: true });
});

async function runHook(env: NodeJS.ProcessEnv = {}, now = Date.now()): Promise<number> {
  vi.resetModules();
  const mod = await import('./session.resume.js');
  return mod.main(env, now);
}

describe('session.resume', () => {
  it('silent when no runs', async () => {
    const code = await runHook();
    expect(code).toBe(0);
    expect(stderrBuf.split('\n').filter((l) => l.startsWith('[run]'))).toEqual([]);
  });

  it('prints banner for in-progress run', async () => {
    makeRun('a', { status: 'in_progress' });
    await runHook();
    expect(stderrBuf).toContain('[run] se a');
  });

  it('flags stale run', async () => {
    const stale = new Date(Date.now() - 35 * 86400_000).toISOString();
    makeRun('stale-run', { status: 'in_progress', last_activity_at: stale });
    await runHook();
    expect(stderrBuf).toContain('[stale: >30d inactive]');
  });

  it('archives completed-aged run', async () => {
    const old = new Date(Date.now() - 20 * 86400_000).toISOString();
    makeRun('old-completed', { status: 'completed', last_activity_at: old });
    await runHook();
    expect(fs.existsSync(path.join(tmpHome, '.claude/pdca-archive/runs/old-completed'))).toBe(true);
  });

  it('archives cancelled immediately', async () => {
    makeRun('cancelled', { status: 'cancelled' });
    await runHook();
    expect(fs.existsSync(path.join(tmpHome, '.claude/pdca-archive/runs/cancelled'))).toBe(true);
  });

  it('warns when OPUS_GUARD_DISABLED set', async () => {
    await runHook({ OPUS_GUARD_DISABLED: '1' });
    expect(stderrBuf).toContain('OPUS_GUARD_DISABLED');
  });

  it('warns when EDITOR_BYPASS set', async () => {
    await runHook({ EDITOR_BYPASS: '1' });
    expect(stderrBuf).toContain('EDITOR_BYPASS');
  });
});
