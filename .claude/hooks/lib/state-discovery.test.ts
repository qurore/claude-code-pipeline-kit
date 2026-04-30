import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  archivableRuns,
  archiveRun,
  detectOrphans,
  findInProgressRuns,
  findMostRecentlyActiveRun,
  isStale,
  listRunDirs,
  manifestToResumeEntry,
} from './state-discovery.js';
import type { PipelineManifest } from './types.js';

let tmpDir: string;

function makeRun(name: string, m: Partial<PipelineManifest> = {}): { dir: string; manifestPath: string } {
  const dir = path.join(tmpDir, name);
  fs.mkdirSync(dir, { recursive: true });
  const manifestPath = path.join(dir, 'manifest.json');
  const full: PipelineManifest = {
    pipeline: 'se',
    run_id: name,
    feature: 'test',
    started_at: '2026-04-28T00:00:00+09:00',
    last_activity_at: '2026-04-28T00:00:00+09:00',
    current_phase: '6',
    iteration: 1,
    max_iterations: 4,
    restart_count: 0,
    status: 'in_progress',
    output_mode: 'code',
    br_flags: { se_1: false, se_2: false, eiw_1: false, drw_1: false },
    phase_history: [],
    accumulated_feedback: [],
    ...m,
  };
  fs.writeFileSync(manifestPath, JSON.stringify(full));
  return { dir, manifestPath };
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'state-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('listRunDirs', () => {
  it('returns empty when state root missing', () => {
    expect(listRunDirs(path.join(tmpDir, 'missing'))).toEqual([]);
  });

  it('lists run directories, ignores hidden and orphans/', () => {
    makeRun('run-a');
    makeRun('run-b');
    fs.mkdirSync(path.join(tmpDir, '.gitkeep'));
    fs.mkdirSync(path.join(tmpDir, 'orphans'));
    const dirs = listRunDirs(tmpDir).map((d) => path.basename(d));
    expect(dirs.sort()).toEqual(['run-a', 'run-b']);
  });
});

describe('findInProgressRuns', () => {
  it('returns only in_progress runs', () => {
    makeRun('a', { status: 'in_progress' });
    makeRun('b', { status: 'completed' });
    makeRun('c', { status: 'cancelled' });
    const found = findInProgressRuns(tmpDir);
    expect(found.length).toBe(1);
    expect(found[0].manifest.run_id).toBe('a');
  });
});

describe('findMostRecentlyActiveRun', () => {
  it('returns null when no in-progress runs', () => {
    expect(findMostRecentlyActiveRun(tmpDir)).toBeNull();
  });

  it('returns most recent by last_activity_at', () => {
    makeRun('older', { last_activity_at: '2026-01-01T00:00:00+09:00' });
    makeRun('newer', { last_activity_at: '2026-04-28T00:00:00+09:00' });
    const r = findMostRecentlyActiveRun(tmpDir);
    expect(r!.manifest.run_id).toBe('newer');
  });
});

describe('isStale', () => {
  it('returns true when last_activity_at older than threshold', () => {
    const m = { last_activity_at: new Date(Date.now() - 31 * 86400 * 1000).toISOString() } as PipelineManifest;
    expect(isStale(m)).toBe(true);
  });

  it('returns false within threshold', () => {
    const m = { last_activity_at: new Date(Date.now() - 1 * 86400 * 1000).toISOString() } as PipelineManifest;
    expect(isStale(m)).toBe(false);
  });

  it('returns false on invalid timestamp', () => {
    const m = { last_activity_at: 'not-a-date' } as PipelineManifest;
    expect(isStale(m)).toBe(false);
  });
});

describe('manifestToResumeEntry', () => {
  it('builds entry with stale tag when stale', () => {
    const { dir: _ } = makeRun('a', { last_activity_at: new Date(Date.now() - 31 * 86400 * 1000).toISOString() });
    const m = findInProgressRuns(tmpDir)[0].manifest;
    const entry = manifestToResumeEntry(m);
    expect(entry.is_stale).toBe(true);
  });
});

describe('detectOrphans — bidirectional invariant (NFR-011)', () => {
  it('detects missing deliverable (Direction A)', () => {
    const { dir, manifestPath } = makeRun('a');
    const m = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    m.phase_history = [{ phase: '5', status: 'approved', iteration: 1, started_at: '', completed_at: '', deliverable_path: 'phase-5-design.md', approved_by: 'self' }];
    fs.writeFileSync(manifestPath, JSON.stringify(m));
    const report = detectOrphans(dir, m);
    expect(report.missingDeliverables.length).toBe(1);
    expect(report.missingDeliverables[0].expectedPath).toBe('phase-5-design.md');
  });

  it('detects orphaned file (Direction B)', () => {
    const { dir, manifestPath } = makeRun('a');
    fs.writeFileSync(path.join(dir, 'phase-5-design.md'), '---\nphase: 5\n---\n');
    const m = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const report = detectOrphans(dir, m);
    expect(report.orphanedFiles).toContain('phase-5-design.md');
  });

  it('skips .draft. files', () => {
    const { dir, manifestPath } = makeRun('a');
    fs.writeFileSync(path.join(dir, 'phase-5-design.draft.md'), '');
    const m = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const report = detectOrphans(dir, m);
    expect(report.orphanedFiles).not.toContain('phase-5-design.draft.md');
  });
});

describe('archivableRuns', () => {
  it('archives cancelled immediately', () => {
    makeRun('cancelled-run', { status: 'cancelled' });
    const a = archivableRuns(tmpDir);
    expect(a.length).toBe(1);
    expect(a[0].reason).toBe('cancelled');
  });

  it('archives completed older than 14 days', () => {
    makeRun('old-completed', { status: 'completed', last_activity_at: new Date(Date.now() - 15 * 86400 * 1000).toISOString() });
    const a = archivableRuns(tmpDir);
    expect(a.length).toBe(1);
    expect(a[0].reason).toBe('completed-aged');
  });

  it('does not archive in_progress', () => {
    makeRun('active', { status: 'in_progress' });
    expect(archivableRuns(tmpDir)).toEqual([]);
  });
});

describe('archiveRun', () => {
  it('moves run directory to archive root', () => {
    const { dir } = makeRun('a');
    const archive = path.join(tmpDir, 'archive');
    archiveRun(dir, archive);
    expect(fs.existsSync(dir)).toBe(false);
    expect(fs.existsSync(path.join(archive, 'a'))).toBe(true);
  });

  it('handles collision by appending timestamp suffix', () => {
    const { dir: dirA } = makeRun('a');
    const archive = path.join(tmpDir, 'archive');
    fs.mkdirSync(path.join(archive, 'a'), { recursive: true });
    archiveRun(dirA, archive);
    const items = fs.readdirSync(archive);
    expect(items.some((i) => i.startsWith('a.archived-'))).toBe(true);
  });
});
