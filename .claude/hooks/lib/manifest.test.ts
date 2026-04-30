import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { mutateManifest, readManifest, withLock, writeManifestAtomic } from './manifest.js';
import type { PipelineManifest } from './types.js';

let tmpDir: string;

function sampleManifest(): PipelineManifest {
  return {
    pipeline: 'se',
    run_id: 'test-run',
    feature: 'test',
    started_at: '2026-04-28T00:00:00+09:00',
    last_activity_at: '2026-04-28T00:00:00+09:00',
    current_phase: '0',
    iteration: 1,
    max_iterations: 4,
    restart_count: 0,
    status: 'in_progress',
    output_mode: 'code',
    br_flags: { se_1: false, se_2: false, eiw_1: false, drw_1: false },
    phase_history: [],
    accumulated_feedback: [],
  };
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'manifest-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('readManifest', () => {
  it('returns null when file missing', () => {
    expect(readManifest(path.join(tmpDir, 'missing.json'))).toBeNull();
  });

  it('returns null when file is malformed JSON', () => {
    const p = path.join(tmpDir, 'bad.json');
    fs.writeFileSync(p, '{not json');
    expect(readManifest(p)).toBeNull();
  });

  it('parses valid manifest', () => {
    const p = path.join(tmpDir, 'manifest.json');
    fs.writeFileSync(p, JSON.stringify(sampleManifest()));
    const m = readManifest(p);
    expect(m).not.toBeNull();
    expect(m!.run_id).toBe('test-run');
  });
});

describe('writeManifestAtomic', () => {
  it('writes file and contents match', () => {
    const p = path.join(tmpDir, 'manifest.json');
    writeManifestAtomic(p, sampleManifest());
    const round = JSON.parse(fs.readFileSync(p, 'utf-8'));
    expect(round.run_id).toBe('test-run');
  });

  it('atomic via tmp + rename — no tmp left after success', () => {
    const p = path.join(tmpDir, 'manifest.json');
    writeManifestAtomic(p, sampleManifest());
    const files = fs.readdirSync(tmpDir);
    expect(files.filter((f) => f.includes('.tmp.'))).toEqual([]);
  });
});

describe('withLock', () => {
  it('runs the function and removes lock', () => {
    const lockPath = path.join(tmpDir, 'test.lock');
    const result = withLock(lockPath, () => 42);
    expect(result).toBe(42);
    expect(fs.existsSync(lockPath)).toBe(false);
  });

  it('recovers from stale lock (TTL expired)', () => {
    const lockPath = path.join(tmpDir, 'test.lock');
    fs.writeFileSync(lockPath, JSON.stringify({ pid: 99999, acquired_at: Date.now() - 11_000 }));
    const result = withLock(lockPath, () => 'recovered');
    expect(result).toBe('recovered');
  });

  it('removes lock after exception', () => {
    const lockPath = path.join(tmpDir, 'test.lock');
    expect(() => withLock(lockPath, () => { throw new Error('boom'); })).toThrow('boom');
    expect(fs.existsSync(lockPath)).toBe(false);
  });
});

describe('mutateManifest', () => {
  it('throws if manifest missing', () => {
    expect(() => mutateManifest(path.join(tmpDir, 'missing.json'), () => {})).toThrow();
  });

  it('applies in-place mutation (mutator returns void)', () => {
    const p = path.join(tmpDir, 'manifest.json');
    writeManifestAtomic(p, sampleManifest());
    mutateManifest(p, (m) => {
      m.iteration = 2;
    });
    expect(readManifest(p)!.iteration).toBe(2);
  });

  it('applies new-object mutation (mutator returns next)', () => {
    const p = path.join(tmpDir, 'manifest.json');
    writeManifestAtomic(p, sampleManifest());
    mutateManifest(p, (m) => ({ ...m, iteration: 3 }));
    expect(readManifest(p)!.iteration).toBe(3);
  });

  it('CTO C1 fix — return value propagated even when mutator returns new object', () => {
    const p = path.join(tmpDir, 'manifest.json');
    writeManifestAtomic(p, sampleManifest());
    const result = mutateManifest(p, (m) => ({ ...m, iteration: 99 }));
    expect(result.iteration).toBe(99);
    expect(readManifest(p)!.iteration).toBe(99);
  });
});
