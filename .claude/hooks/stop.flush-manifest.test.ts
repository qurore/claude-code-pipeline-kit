import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

let tmpHome: string;
let originalCwd: string;
let stderrBuf: string;
let originalWrite: typeof process.stderr.write;

beforeEach(() => {
  tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'stop-test-'));
  originalCwd = process.cwd();
  process.chdir(tmpHome);
  fs.mkdirSync(path.join(tmpHome, '.claude/pipeline-state'), { recursive: true });
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

function makeRun(name: string, history: any[] = []) {
  const dir = path.join(tmpHome, '.claude/pipeline-state', name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({
    pipeline: 'se', run_id: name, feature: 'f',
    started_at: '2026-04-28T00:00:00+09:00',
    last_activity_at: '2026-04-28T00:00:00+09:00',
    current_phase: '6', iteration: 1, max_iterations: 4, restart_count: 0,
    status: 'in_progress', output_mode: 'code',
    br_flags: { se_1: false, se_2: false, eiw_1: false, drw_1: false },
    phase_history: history, accumulated_feedback: [],
  }));
  return dir;
}

async function runHook(now = Date.now()): Promise<number> {
  vi.resetModules();
  const mod = await import('./stop.flush-manifest.js');
  return mod.main(now);
}

describe('stop.flush-manifest', () => {
  it('skips when no state dir', async () => {
    fs.rmSync(path.join(tmpHome, '.claude/pipeline-state'), { recursive: true });
    expect(await runHook()).toBe(0);
  });

  it('flushes last_activity_at on active run', async () => {
    makeRun('a');
    const before = JSON.parse(fs.readFileSync(path.join(tmpHome, '.claude/pipeline-state/a/manifest.json'), 'utf-8'));
    await runHook(Date.parse('2026-05-01T00:00:00+09:00'));
    const after = JSON.parse(fs.readFileSync(path.join(tmpHome, '.claude/pipeline-state/a/manifest.json'), 'utf-8'));
    expect(after.last_activity_at).not.toBe(before.last_activity_at);
  });

  it('warns about missing deliverable (Direction A)', async () => {
    makeRun('a', [{ phase: '5', status: 'approved', iteration: 1, started_at: '', completed_at: '', deliverable_path: 'phase-5-design.md', approved_by: 'self' }]);
    await runHook();
    expect(stderrBuf).toContain('Missing deliverable');
  });

  it('warns about orphan file (Direction B)', async () => {
    const dir = makeRun('a');
    fs.writeFileSync(path.join(dir, 'phase-5-design.md'), '');
    await runHook();
    expect(stderrBuf).toContain('Orphaned deliverable');
  });

  it('sweeps stale .consumed.* sentinels older than 24h', async () => {
    const stale = path.join(tmpHome, '.claude/pipeline-state', '.trivial-fix-active.consumed.123.456');
    fs.writeFileSync(stale, '');
    const oldTime = Date.now() / 1000 - 25 * 3600;
    fs.utimesSync(stale, oldTime, oldTime);
    makeRun('a');
    await runHook();
    expect(fs.existsSync(stale)).toBe(false);
  });
});
