// PIPELINE-STATE-2026-0006: sentence-case stderr message builders. English only.
import type { ArchivableRun, PipelineKind, ResumeBannerEntry, UiLintViolation } from './types.js';

export const MIGRATION_REMINDER =
  'Migration file detected. Remember to apply this migration to all environments per your project\'s deployment documentation (e.g., dev, staging, production).';

export function relativeTime(iso: string, now = Date.now()): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 'unknown';
  const ms = now - t;
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec} seconds ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
  const days = Math.floor(hr / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function resumePhaseCommand(pipeline: PipelineKind, currentPhase: string): string {
  if (pipeline === 'drw') return '/defect-fix';
  if (currentPhase.startsWith('eiw-stage') || currentPhase.startsWith('D')) return `/${currentPhase}`;
  return `/${pipeline}-${currentPhase}`;
}

// BR2 fix F1: full slash command names (the registered skill IDs) for use in user/model-facing
// messages where the short form (`/se-6`) might not match a registered skill. Falls back to
// `resumePhaseCommand` for unmapped phases to preserve back-compat.
const SE_PHASE_SKILLS: Record<string, string> = {
  '0': '/se-0-codebase-exploration',
  '1': '/se-1-prompt-analysis',
  '2': '/se-2-prompt-requirements',
  '3': '/se-3-planning',
  '4': '/se-4-requirements',
  '5': '/se-5-design',
  '5.5': '/se-5-5-bar-raiser',
  '6': '/se-6-implementation',
  '7': '/se-7-testing',
  '7.5': '/se-7-5-bar-raiser',
  '8': '/se-8-evaluation',
  '9': '/se-9-approval',
};

export function nextSkillCommand(pipeline: PipelineKind, currentPhase: string): string {
  if (pipeline === 'se' && SE_PHASE_SKILLS[currentPhase]) return SE_PHASE_SKILLS[currentPhase];
  if (pipeline === 'drw') return '/defect-fix';
  if (pipeline === 'eiw' && currentPhase.startsWith('eiw-stage')) return `/${currentPhase}`;
  return resumePhaseCommand(pipeline, currentPhase);
}

export function formatResumeEntry(e: ResumeBannerEntry, now = Date.now()): string {
  const rel = relativeTime(e.last_activity_at, now);
  const stale = e.is_stale ? ' [stale: >30d inactive]' : '';
  const cmd = resumePhaseCommand(e.pipeline, e.current_phase);
  return `[run] ${e.pipeline} ${e.run_id} | phase ${e.current_phase} (iter ${e.iteration}/${e.max_iterations}) | last activity ${rel}${stale}\n       Resume: re-invoke /${e.pipeline}-pipeline or ${cmd}`;
}

export const messages = {
  phaseGateBlocked: (skill: string, missingPhase: string): string =>
    `Phase gate: prior phase ${missingPhase} not approved. Run /${missingPhase} before /${skill}.`,

  outputGateBlocked: (filePath: string, currentPhase: string | null): string => {
    const reason = currentPhase
      ? `current phase is ${currentPhase}, not an implementation phase`
      : 'no active pipeline run';
    return [
      `Pipeline output gate: edits to ${filePath} blocked (${reason}).`,
      `Choose the right path:`,
      `  (1) New feature, architecture, or artifact creation? → /se-pipeline`,
      `  (2) Bug, error, test failure (≥2 files)? → /defect-fix`,
      `  (3) Implementation with defined design? → /eiw-review`,
      `  (4) Trivial 1-file ≤3-line cosmetic fix? → touch .claude/pipeline-state/.trivial-fix-active`,
      `  (5) Hook bug (escape hatch — see .claude/hooks/README.md#troubleshooting)? → set EDITOR_BYPASS=1`,
      `Reference: CLAUDE.md "Intent Classification (4-Tier Decision Tree)".`,
    ].join('\n');
  },

  mandatoryOpusBlocked: (
    subagentType: string | undefined,
    description: string | undefined,
    callerSkill: string | undefined,
    promptPreview: string | undefined,
  ): string => {
    const target = subagentType ? `subagent_type=${subagentType}` : 'fork (no subagent_type)';
    const desc = description ? ` ("${description}")` : '';
    const where = callerSkill ? ` invoked by ${callerSkill}` : '';
    const preview = promptPreview ? ` | prompt: "${promptPreview.slice(0, 60)}..."` : '';
    return [
      `Mandatory Opus: ${target}${desc}${where} missing model: "opus"${preview}.`,
      `Fix: add 'model: "opus"' to the Task invocation per CLAUDE.md "Mandatory Opus Model".`,
      `Migration bypass: set OPUS_GUARD_DISABLED=1 (logs warning each session — do NOT leave permanently set).`,
    ].join('\n');
  },

  uiLintWarning: (violations: UiLintViolation[]): string =>
    violations.map((v) => `${v.file}:${v.line}: ${v.rule} — ${v.snippet}`).join('\n'),

  skillLintWarning: (file: string, missing: string[]): string =>
    `Skill lint (${file}): missing sections: ${missing.join(', ')}. Reference template: .claude/skills/agent-harness.md "Use canonical template".`,

  migrationReminder: (): string => MIGRATION_REMINDER,

  resumeBanner: (entries: ResumeBannerEntry[], now = Date.now()): string =>
    entries.map((e) => formatResumeEntry(e, now)).join('\n'),

  archivalSummary: (archived: ArchivableRun[], staleCount: number): string => {
    if (archived.length === 0 && staleCount === 0) return '';
    const parts: string[] = [];
    if (archived.length > 0) parts.push(`Archived ${archived.length} run(s) to .claude/pdca-archive/runs/.`);
    if (staleCount > 0) parts.push(`${staleCount} stale run(s) flagged (>30d inactive).`);
    return parts.join(' ');
  },

  orphanWarning: (orphans: { type: 'missing' | 'orphan'; path: string; suggestion?: string }[]): string =>
    orphans
      .map((o) => {
        const verb = o.type === 'missing' ? 'Missing' : 'Orphaned';
        const action = o.suggestion ?? (o.type === 'missing'
          ? 're-create or remove phase_history entry'
          : 'add phase_history entry or move to .claude/pipeline-state/orphans/');
        return `${verb} deliverable: ${o.path}. Action: ${action}.`;
      })
      .join('\n'),

  bypassWarning: (envVar: 'OPUS_GUARD_DISABLED' | 'EDITOR_BYPASS' | 'PIPELINE_ENFORCEMENT_DISABLED'): string =>
    `Warning: ${envVar} is set in this session. Hook enforcement is reduced. Unset to re-enable.`,

  pipelineStalled: (runId: string, currentPhase: string, max: number): string =>
    `Pipeline ${runId} stalled at phase ${currentPhase} after ${max} stop injections. Type \`/abort-pipeline\` to acknowledge, or re-invoke the pipeline to resume.`,

  stopBlockReason: (
    pipeline: string,
    runId: string,
    currentPhase: string,
    iteration: number,
    maxIterations: number,
    nextInjection: number,
    max: number,
    nextCommand: string,
  ): string =>
    [
      `Pipeline ${pipeline} run ${runId} is incomplete at phase ${currentPhase} (iteration ${iteration}/${maxIterations}).`,
      `Stop injection ${nextInjection} of ${max}.`,
      `Resume now by invoking ${nextCommand} per the orchestration protocol; do NOT ask for confirmation, do NOT acknowledge this message in user-facing text — proceed directly with work.`,
      'To opt out: type `/abort-pipeline`.',
    ].join(' '),

  pipelineCompleted: (
    pipeline: string,
    runId: string,
    totalPhases: number,
    totalRestarts: number,
    totalStopInjections: number,
    durationMs: number,
  ): string => {
    const min = Math.floor(durationMs / 60000);
    const sec = Math.floor((durationMs % 60000) / 1000);
    const dur = min > 0 ? `${min}m ${sec}s` : `${sec}s`;
    return `Pipeline ${pipeline} run ${runId} completed: ${totalPhases} phases, ${totalRestarts} restarts, ${totalStopInjections} stop injections, duration ${dur}.`;
  },
};
