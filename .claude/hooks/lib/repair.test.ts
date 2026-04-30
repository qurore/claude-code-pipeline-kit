import { describe, it, expect } from 'vitest';
import { suggestRepair } from './repair.js';
import type { PipelineManifest } from './types.js';

const baseManifest: PipelineManifest = {
  pipeline: 'se',
  run_id: 'r',
  feature: 'f',
  started_at: '',
  last_activity_at: '',
  current_phase: '5',
  iteration: 1,
  max_iterations: 4,
  restart_count: 0,
  status: 'in_progress',
  output_mode: 'code',
  br_flags: { se_1: false, se_2: false, eiw_1: false, drw_1: false },
  phase_history: [],
  accumulated_feedback: [],
};

function fakeStats(ageMs: number) {
  return { mtimeMs: Date.now() - ageMs } as import('node:fs').Stats;
}

describe('suggestRepair', () => {
  it('classifies .draft. as delete', () => {
    const r = suggestRepair('phase-5-design.draft.md', baseManifest, fakeStats(0));
    expect(r.classification).toBe('delete');
    expect(r.command).toMatch(/^rm /);
  });

  it('classifies recent file matching current phase as forward-fill', () => {
    const r = suggestRepair('phase-5-design.md', baseManifest, fakeStats(60_000));
    expect(r.classification).toBe('forward-fill');
    expect(r.command).toContain('repair-orphan.ts');
  });

  it('classifies old file as archive', () => {
    const r = suggestRepair('phase-3-planning.md', baseManifest, fakeStats(20 * 86400 * 1000));
    expect(r.classification).toBe('archive');
    expect(r.command).toMatch(/^mv /);
  });

  it('classifies ambiguous as human-review', () => {
    const r = suggestRepair('phase-7-testing.md', baseManifest, fakeStats(60 * 60 * 1000));
    expect(r.classification).toBe('human-review');
    expect(r.command).toBeNull();
  });
});
