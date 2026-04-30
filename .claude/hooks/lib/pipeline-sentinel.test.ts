// PIPELINE-STATE-2026-0009: tests for pipeline-sentinel API.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  abortMarkerPath,
  abortPipeline,
  activeMarkerPath,
  advancePhase,
  clearAbortMarker,
  completePipeline,
  getActivePipelines,
  incrementStopInjections,
  isAborted,
  markStalled,
  stalledMarkerPath,
  startPipeline,
} from './pipeline-sentinel.js';
import { readManifest } from './manifest.js';

let stateRoot: string;

beforeEach(() => {
  stateRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sentinel-test-'));
});

afterEach(() => {
  fs.rmSync(stateRoot, { recursive: true, force: true });
});

describe('startPipeline', () => {
  it('creates run directory, manifest, and active marker', () => {
    const { manifestPath, runDir } = startPipeline({
      pipeline: 'se',
      runId: 'r1',
      feature: 'test feature',
      stateRoot,
    });
    expect(fs.existsSync(manifestPath)).toBe(true);
    expect(fs.existsSync(runDir)).toBe(true);
    expect(fs.existsSync(activeMarkerPath('r1', stateRoot))).toBe(true);

    const m = readManifest(manifestPath);
    expect(m).not.toBeNull();
    expect(m!.pipeline).toBe('se');
    expect(m!.run_id).toBe('r1');
    expect(m!.status).toBe('in_progress');
    expect(m!.stop_injections).toBe(0);
    expect(m!.current_phase).toBe('0');
  });

  it('is idempotent — second call does not overwrite manifest', () => {
    startPipeline({ pipeline: 'se', runId: 'r1', feature: 'first', stateRoot });
    const first = readManifest(path.join(stateRoot, 'r1', 'manifest.json'));

    startPipeline({ pipeline: 'eiw', runId: 'r1', feature: 'second', stateRoot });
    const second = readManifest(path.join(stateRoot, 'r1', 'manifest.json'));

    expect(second!.pipeline).toBe('se');
    expect(second!.feature).toBe('first');
    expect(second!.started_at).toBe(first!.started_at);
  });

  it('honors currentPhase, outputMode, and maxIterations options', () => {
    const { manifestPath } = startPipeline({
      pipeline: 'drw',
      runId: 'r2',
      feature: 'bug fix',
      currentPhase: 'D1',
      outputMode: 'documentation',
      maxIterations: 3,
      stateRoot,
    });
    const m = readManifest(manifestPath)!;
    expect(m.current_phase).toBe('D1');
    expect(m.output_mode).toBe('documentation');
    expect(m.max_iterations).toBe(3);
  });
});

describe('advancePhase', () => {
  it('updates current_phase and last_activity_at', () => {
    const { manifestPath } = startPipeline({ pipeline: 'se', runId: 'r1', feature: 'f', stateRoot });
    const before = readManifest(manifestPath)!.last_activity_at;
    const next = advancePhase('r1', '5', stateRoot);
    expect(next.current_phase).toBe('5');
    expect(Date.parse(next.last_activity_at)).toBeGreaterThanOrEqual(Date.parse(before));
  });

  it('throws when manifest is missing', () => {
    expect(() => advancePhase('does-not-exist', '5', stateRoot)).toThrow();
  });
});

describe('completePipeline', () => {
  it('sets status=completed, removes all markers, returns summary', () => {
    startPipeline({ pipeline: 'se', runId: 'r1', feature: 'f', stateRoot });
    abortPipeline('r1', undefined, stateRoot);
    markStalled('r1', stateRoot);

    const summary = completePipeline('r1', stateRoot)!;
    expect(summary.runId).toBe('r1');
    expect(summary.pipeline).toBe('se');
    expect(summary.totalPhases).toBe(0);
    expect(summary.totalRestarts).toBe(0);
    expect(summary.totalStopInjections).toBe(0);
    expect(summary.durationMs).toBeGreaterThanOrEqual(0);

    const m = readManifest(path.join(stateRoot, 'r1', 'manifest.json'))!;
    expect(m.status).toBe('completed');
    expect(fs.existsSync(activeMarkerPath('r1', stateRoot))).toBe(false);
    expect(fs.existsSync(abortMarkerPath('r1', stateRoot))).toBe(false);
    expect(fs.existsSync(stalledMarkerPath('r1', stateRoot))).toBe(false);
  });

  it('returns null when manifest missing', () => {
    expect(completePipeline('nope', stateRoot)).toBeNull();
  });

  it('reports stop_injections in summary', () => {
    startPipeline({ pipeline: 'se', runId: 'r1', feature: 'f', stateRoot });
    incrementStopInjections('r1', stateRoot);
    incrementStopInjections('r1', stateRoot);
    incrementStopInjections('r1', stateRoot);
    const summary = completePipeline('r1', stateRoot)!;
    expect(summary.totalStopInjections).toBe(3);
  });
});

describe('abortPipeline', () => {
  it('writes abort marker; does NOT mutate manifest', () => {
    const { manifestPath } = startPipeline({ pipeline: 'se', runId: 'r1', feature: 'f', stateRoot });
    const before = readManifest(manifestPath)!;
    abortPipeline('r1', 'user requested', stateRoot);
    expect(fs.existsSync(abortMarkerPath('r1', stateRoot))).toBe(true);
    const after = readManifest(manifestPath)!;
    expect(after.status).toBe(before.status);
    expect(after.status).toBe('in_progress');
  });
});

describe('getActivePipelines', () => {
  it('returns only in_progress runs', () => {
    startPipeline({ pipeline: 'se', runId: 'r1', feature: 'f', stateRoot });
    startPipeline({ pipeline: 'eiw', runId: 'r2', feature: 'g', stateRoot });
    completePipeline('r1', stateRoot);

    const active = getActivePipelines(stateRoot);
    expect(active).toHaveLength(1);
    expect(active[0].runId).toBe('r2');
    expect(active[0].pipeline).toBe('eiw');
  });

  it('returns empty array when state root does not exist', () => {
    const missing = path.join(stateRoot, 'gone');
    expect(getActivePipelines(missing)).toEqual([]);
  });

  it('includes stop injection counts', () => {
    startPipeline({ pipeline: 'se', runId: 'r1', feature: 'f', stateRoot });
    incrementStopInjections('r1', stateRoot);
    incrementStopInjections('r1', stateRoot);
    const active = getActivePipelines(stateRoot);
    expect(active[0].stopInjections).toBe(2);
  });
});

describe('incrementStopInjections', () => {
  it('increments persisted counter and returns new value', () => {
    startPipeline({ pipeline: 'se', runId: 'r1', feature: 'f', stateRoot });
    expect(incrementStopInjections('r1', stateRoot)).toBe(1);
    expect(incrementStopInjections('r1', stateRoot)).toBe(2);
    expect(incrementStopInjections('r1', stateRoot)).toBe(3);
    const m = readManifest(path.join(stateRoot, 'r1', 'manifest.json'))!;
    expect(m.stop_injections).toBe(3);
  });

  it('treats missing stop_injections as 0', () => {
    const { manifestPath } = startPipeline({ pipeline: 'se', runId: 'r1', feature: 'f', stateRoot });
    const m = readManifest(manifestPath)!;
    delete m.stop_injections;
    fs.writeFileSync(manifestPath, JSON.stringify(m));
    expect(incrementStopInjections('r1', stateRoot)).toBe(1);
  });
});

describe('markStalled, clearAbortMarker, isAborted', () => {
  it('markStalled is idempotent', () => {
    markStalled('r1', stateRoot);
    markStalled('r1', stateRoot);
    expect(fs.existsSync(stalledMarkerPath('r1', stateRoot))).toBe(true);
  });

  it('clearAbortMarker reflects prior existence', () => {
    expect(clearAbortMarker('r1', stateRoot)).toBe(false);
    abortPipeline('r1', undefined, stateRoot);
    expect(clearAbortMarker('r1', stateRoot)).toBe(true);
    expect(clearAbortMarker('r1', stateRoot)).toBe(false);
  });

  it('isAborted reflects abort marker presence', () => {
    expect(isAborted('r1', stateRoot)).toBe(false);
    abortPipeline('r1', undefined, stateRoot);
    expect(isAborted('r1', stateRoot)).toBe(true);
    clearAbortMarker('r1', stateRoot);
    expect(isAborted('r1', stateRoot)).toBe(false);
  });
});
