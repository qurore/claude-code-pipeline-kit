import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { main, priorPhaseFor, skillPathMatchesPhase } from './pretool.gate-skill.js';

let tmpHome: string;
let originalCwd: string;

beforeEach(() => {
  tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-skill-test-'));
  originalCwd = process.cwd();
  process.chdir(tmpHome);
  fs.mkdirSync(path.join(tmpHome, '.claude/pipeline-state'), { recursive: true });
});

afterEach(() => {
  process.chdir(originalCwd);
  fs.rmSync(tmpHome, { recursive: true, force: true });
});

function makeManifest(history: any[] = []) {
  const dir = path.join(tmpHome, '.claude/pipeline-state/test-run');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({
    pipeline: 'se', run_id: 't', feature: 'f',
    started_at: '2026-04-28T00:00:00+09:00',
    last_activity_at: '2026-04-28T00:00:00+09:00',
    current_phase: '0', iteration: 1, max_iterations: 4, restart_count: 0,
    status: 'in_progress', output_mode: 'code',
    br_flags: { se_1: false, se_2: false, eiw_1: false, drw_1: false },
    phase_history: history, accumulated_feedback: [],
  }));
}

describe('priorPhaseFor', () => {
  it('SE phases: maps N → N-1', () => {
    expect(priorPhaseFor('/se-1-prompt-analysis')).toBe('/se-0-codebase-exploration');
    expect(priorPhaseFor('/se-3-planning')).toBe('/se-2');
    expect(priorPhaseFor('/se-9-approval')).toBe('/se-8');
  });

  it('EIW phases: maps stageN → stage(N-1)', () => {
    expect(priorPhaseFor('/eiw-stage1')).toBe('/eiw-stage0');
    expect(priorPhaseFor('/eiw-stage5')).toBe('/eiw-stage4');
  });

  it('DRW phases: maps DN → D(N-1)', () => {
    expect(priorPhaseFor('/D2')).toBe('/D1');
    expect(priorPhaseFor('/D5')).toBe('/D4');
  });

  it('returns null for unrecognized', () => {
    expect(priorPhaseFor('/unknown')).toBeNull();
    expect(priorPhaseFor('/se-pipeline')).toBeNull();
  });
});

describe('skillPathMatchesPhase', () => {
  it('matches SE path to numeric phase', () => {
    expect(skillPathMatchesPhase('/se-3', '3')).toBe(true);
    expect(skillPathMatchesPhase('/se-3', '4')).toBe(false);
  });

  it('matches EIW path to eiw-stageN', () => {
    expect(skillPathMatchesPhase('/eiw-stage2', 'eiw-stage2')).toBe(true);
    expect(skillPathMatchesPhase('/eiw-stage2', '2')).toBe(true);
  });

  it('matches DRW path to DN', () => {
    expect(skillPathMatchesPhase('/D3', 'D3')).toBe(true);
  });

  it('returns false for unrelated paths', () => {
    expect(skillPathMatchesPhase('/unknown', 'anything')).toBe(false);
  });
});

describe('main', () => {
  it('skips wrong tool', async () => {
    expect(await main(JSON.stringify({ tool_name: 'Edit' }))).toBe(0);
  });

  it('handles malformed stdin', async () => {
    expect(await main('{not json')).toBe(0);
  });

  it('skips when skill missing', async () => {
    expect(await main(JSON.stringify({ tool_name: 'Skill', tool_input: {} }))).toBe(0);
  });

  it('allows exempt skill', async () => {
    expect(await main(JSON.stringify({ tool_name: 'Skill', tool_input: { skill: 'se-pipeline' } }))).toBe(0);
  });

  it('allows unrecognized skill', async () => {
    expect(await main(JSON.stringify({ tool_name: 'Skill', tool_input: { skill: 'random-utility' } }))).toBe(0);
  });

  it('allows when no active manifest', async () => {
    expect(await main(JSON.stringify({ tool_name: 'Skill', tool_input: { skill: 'se-1-prompt-analysis' } }))).toBe(0);
  });

  it('blocks when prior phase missing in history', async () => {
    makeManifest([]);
    expect(await main(JSON.stringify({ tool_name: 'Skill', tool_input: { skill: 'se-3-planning' } }), tmpHome)).toBe(2);
  });

  it('allows when prior phase approved', async () => {
    makeManifest([{ phase: '2', status: 'approved', iteration: 1, started_at: '', completed_at: '', deliverable_path: 'phase-2.md', approved_by: 'self' }]);
    expect(await main(JSON.stringify({ tool_name: 'Skill', tool_input: { skill: 'se-3-planning' } }), tmpHome)).toBe(0);
  });
});
