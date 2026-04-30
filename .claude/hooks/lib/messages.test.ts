import { describe, it, expect } from 'vitest';
import { formatResumeEntry, messages, relativeTime, resumePhaseCommand } from './messages.js';

describe('relativeTime', () => {
  it('formats seconds', () => {
    const now = Date.now();
    const iso = new Date(now - 30_000).toISOString();
    expect(relativeTime(iso, now)).toMatch(/seconds ago/);
  });

  it('formats minutes', () => {
    const now = Date.now();
    const iso = new Date(now - 5 * 60_000).toISOString();
    expect(relativeTime(iso, now)).toBe('5 minutes ago');
  });

  it('formats hours', () => {
    const now = Date.now();
    const iso = new Date(now - 3 * 3600_000).toISOString();
    expect(relativeTime(iso, now)).toBe('3 hours ago');
  });

  it('formats days', () => {
    const now = Date.now();
    const iso = new Date(now - 35 * 86400_000).toISOString();
    expect(relativeTime(iso, now)).toBe('35 days ago');
  });

  it('returns unknown on invalid input', () => {
    expect(relativeTime('not-a-date')).toBe('unknown');
  });
});

describe('nextSkillCommand — BR2 fix F1 (full skill names)', () => {
  it('returns full SE phase skill name for known phases', async () => {
    const { nextSkillCommand } = await import('./messages.js');
    expect(nextSkillCommand('se', '0')).toBe('/se-0-codebase-exploration');
    expect(nextSkillCommand('se', '6')).toBe('/se-6-implementation');
    expect(nextSkillCommand('se', '5.5')).toBe('/se-5-5-bar-raiser');
    expect(nextSkillCommand('se', '9')).toBe('/se-9-approval');
  });

  it('falls back to resumePhaseCommand for unknown SE phases', async () => {
    const { nextSkillCommand } = await import('./messages.js');
    expect(nextSkillCommand('se', '99')).toBe('/se-99');
  });

  it('routes drw to /defect-fix', async () => {
    const { nextSkillCommand } = await import('./messages.js');
    expect(nextSkillCommand('drw', 'D3')).toBe('/defect-fix');
  });

  it('routes eiw stages to /eiw-stageN', async () => {
    const { nextSkillCommand } = await import('./messages.js');
    expect(nextSkillCommand('eiw', 'eiw-stage4')).toBe('/eiw-stage4');
  });
});

describe('messages.pipelineStalled, stopBlockReason, pipelineCompleted — BR2', () => {
  it('pipelineStalled mentions /abort-pipeline and the cap count', () => {
    const m = messages.pipelineStalled('run-1', '5', 8);
    expect(m).toContain('run-1');
    expect(m).toContain('phase 5');
    expect(m).toContain('8 stop injections');
    expect(m).toContain('/abort-pipeline');
  });

  it('stopBlockReason includes pipeline kind, run, phase, and counts', () => {
    const m = messages.stopBlockReason('se', 'r1', '5', 1, 4, 1, 8, '/se-5-design');
    expect(m).toContain('Pipeline se run r1');
    expect(m).toContain('phase 5 (iteration 1/4)');
    expect(m).toContain('Stop injection 1 of 8');
    expect(m).toContain('/se-5-design');
    expect(m).toContain('/abort-pipeline');
  });

  it('pipelineCompleted formats minutes/seconds duration', () => {
    expect(messages.pipelineCompleted('se', 'r1', 9, 0, 3, 65_500)).toContain('1m 5s');
    expect(messages.pipelineCompleted('se', 'r1', 9, 0, 3, 5_000)).toContain('5s');
  });
});

describe('resumePhaseCommand — BR 1.1 fix (no double prefix)', () => {
  it('SE phase: prefixes once', () => {
    expect(resumePhaseCommand('se', '6')).toBe('/se-6');
  });

  it('EIW phase: detects prefix and does not double-prefix', () => {
    expect(resumePhaseCommand('eiw', 'eiw-stage2')).toBe('/eiw-stage2');
  });

  it('DRW: returns /defect-fix', () => {
    expect(resumePhaseCommand('drw', 'D3')).toBe('/defect-fix');
  });

  it('DRW phase D-prefix: keeps as-is for SE/EIW', () => {
    expect(resumePhaseCommand('eiw', 'D3')).toBe('/D3');
  });
});

describe('formatResumeEntry', () => {
  it('produces well-formed banner with stale tag', () => {
    const now = Date.now();
    const out = formatResumeEntry({
      pipeline: 'eiw',
      run_id: 'eiw-2026-04-15-foo',
      current_phase: 'eiw-stage2',
      iteration: 1,
      max_iterations: 4,
      last_activity_at: new Date(now - 35 * 86400_000).toISOString(),
      is_stale: true,
    }, now);
    expect(out).toContain('[run] eiw eiw-2026-04-15-foo');
    expect(out).toContain('[stale: >30d inactive]');
    expect(out).toContain('/eiw-stage2');
    expect(out).not.toContain('eiw-eiw-stage2');
  });
});

describe('messages', () => {
  it('phaseGateBlocked is sentence case and actionable', () => {
    const m = messages.phaseGateBlocked('se-2', 'se-1');
    expect(m).toMatch(/^Phase gate:/);
    expect(m).toContain('/se-1');
  });

  it('outputGateBlocked includes 5-option decision tree', () => {
    const m = messages.outputGateBlocked('foo.ts', null);
    expect(m).toContain('(1)');
    expect(m).toContain('(2)');
    expect(m).toContain('(5)');
    expect(m).toContain('/se-pipeline');
    expect(m).toContain('.trivial-fix-active');
    expect(m).toContain('CLAUDE.md');
  });

  it('mandatoryOpusBlocked includes subagent + caller + bypass', () => {
    const m = messages.mandatoryOpusBlocked('general-purpose', 'do thing', '/se-3', 'Plan the thing');
    expect(m).toContain('subagent_type=general-purpose');
    expect(m).toContain('"do thing"');
    expect(m).toContain('/se-3');
    expect(m).toContain('Plan the thing');
    expect(m).toContain('OPUS_GUARD_DISABLED=1');
  });

  it('mandatoryOpusBlocked handles missing fields gracefully', () => {
    const m = messages.mandatoryOpusBlocked(undefined, undefined, undefined, undefined);
    expect(m).toContain('fork (no subagent_type)');
  });

  it('uiLintWarning produces file:line:rule:snippet format', () => {
    const m = messages.uiLintWarning([
      { file: 'a.tsx', line: 10, rule: 'title-case', snippet: '>Save All<' },
    ]);
    expect(m).toBe('a.tsx:10: title-case — >Save All<');
  });

  it('migrationReminder includes deployment guidance', () => {
    const msg = messages.migrationReminder();
    expect(msg).toContain('Migration');
    expect(msg).toContain('environments');
  });

  it('archivalSummary returns empty when nothing happened', () => {
    expect(messages.archivalSummary([], 0)).toBe('');
  });

  it('archivalSummary names archives and stale count', () => {
    expect(messages.archivalSummary([{ runDir: 'a', reason: 'cancelled' }], 2))
      .toContain('Archived 1 run');
    expect(messages.archivalSummary([], 3)).toContain('3 stale run(s) flagged');
  });

  it('orphanWarning includes Action with suggestion', () => {
    const m = messages.orphanWarning([{ type: 'orphan', path: 'phase-5-design.md', suggestion: 'forward-fill: foo' }]);
    expect(m).toContain('Orphaned deliverable');
    expect(m).toContain('Action: forward-fill: foo');
  });

  it('bypassWarning names env var', () => {
    expect(messages.bypassWarning('OPUS_GUARD_DISABLED')).toContain('OPUS_GUARD_DISABLED');
  });
});
