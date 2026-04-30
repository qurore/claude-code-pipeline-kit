#!/usr/bin/env node
// DESCRIPTION: PreToolUse(Skill) — block phase skills if prior phase deliverable not approved.
// PIPELINE-STATE-2026-0007: Hook 1.

import * as path from 'node:path';
import { findInProgressRuns } from './lib/state-discovery.js';
import { messages } from './lib/messages.js';
import { emitSignal } from './lib/signals.js';
import { isHelpRequested, printHelp } from './lib/help.js';
import type { HookInput } from './lib/types.js';

const HOOK = 'pretool.gate-skill';

const HELP = {
  name: HOOK,
  description: 'Blocks pipeline phase skills if the prior phase has not been approved.',
  inputs: ['tool_name', 'tool_input.skill'],
  exitCodes: [
    { code: 0, meaning: 'Allow (skill exempt, no active pipeline, or prior phase approved)' },
    { code: 2, meaning: 'Block (prior phase missing or not approved)' },
  ],
  envVars: [],
  bypass: ['Run the prior phase skill first', 'Cancel the active run if mistakenly started'],
  docsAnchor: 'phase-gate',
  testIds: ['T1.1', 'T1.2', 'T1.3', 'T1.4', 'T1.5', 'T1.6'],
};

const EXEMPT = new Set([
  '/se-0-codebase-exploration',
  '/se-pipeline',
  '/eiw-stage0',
  '/eiw-review',
  '/defect-fix',
  '/se-step-a-discussion',
  '/se-5-5-bar-raiser',
  '/se-7-5-bar-raiser',
  '/eiw-bar-raiser',
  '/drw-bar-raiser',
  '/bar-raiser-protocol',
  '/pdca-cycle',
  '/pdca-1-incident',
  '/pdca-2-attribution',
  '/pdca-3-synthesis',
  '/pdca-4-upgrade',
]);

export function priorPhaseFor(skillName: string): string | null {
  const m1 = skillName.match(/^\/se-([1-9])(?:-|$)/);
  if (m1) {
    const n = Number(m1[1]);
    if (n === 1) return '/se-0-codebase-exploration';
    return `/se-${n - 1}`;
  }
  const m2 = skillName.match(/^\/eiw-stage([1-7])$/);
  if (m2) {
    const n = Number(m2[1]);
    if (n === 1) return '/eiw-stage0';
    return `/eiw-stage${n - 1}`;
  }
  const m3 = skillName.match(/^\/(?:drw-)?D([2-5])$/);
  if (m3) {
    const n = Number(m3[1]);
    return `/D${n - 1}`;
  }
  return null;
}

export async function main(stdinJson: string, cwd = process.cwd()): Promise<number> {
  if (isHelpRequested(process.argv)) {
    process.stdout.write(printHelp(HELP) + '\n');
    return 0;
  }

  const stateRoot = path.resolve(cwd, '.claude/pipeline-state');

  let input: HookInput;
  try {
    input = JSON.parse(stdinJson) as HookInput;
  } catch {
    emitSignal({ hook: HOOK, decision: 'skip', reason: 'malformed-stdin', docsAnchor: 'phase-gate' });
    return 0;
  }

  if (input.tool_name !== 'Skill') {
    emitSignal({ hook: HOOK, decision: 'skip', reason: 'wrong-tool', docsAnchor: 'phase-gate' });
    return 0;
  }

  const skill = input.tool_input?.skill;
  if (!skill) {
    emitSignal({ hook: HOOK, decision: 'skip', reason: 'no-skill-field', docsAnchor: 'phase-gate' });
    return 0;
  }

  const skillPath = skill.startsWith('/') ? skill : `/${skill}`;
  if (EXEMPT.has(skillPath)) {
    emitSignal({ hook: HOOK, decision: 'allow', reason: 'exempt-skill', context: { skill: skillPath }, docsAnchor: 'phase-gate' });
    return 0;
  }

  const prior = priorPhaseFor(skillPath);
  if (!prior) {
    emitSignal({ hook: HOOK, decision: 'allow', reason: 'unrecognized-skill', context: { skill: skillPath }, docsAnchor: 'phase-gate' });
    return 0;
  }

  const runs = findInProgressRuns(stateRoot);
  if (runs.length === 0) {
    emitSignal({ hook: HOOK, decision: 'allow', reason: 'no-active-pipeline', docsAnchor: 'phase-gate' });
    return 0;
  }

  const priorPhaseId = prior.replace(/^\//, '').replace(/^se-/, '').replace(/^eiw-stage/, 'eiw-stage');
  const found = runs.some(({ manifest }) =>
    manifest.phase_history.some((h) => h.status === 'approved' && skillPathMatchesPhase(prior, h.phase))
  );

  if (found) {
    emitSignal({ hook: HOOK, decision: 'allow', reason: 'prior-approved', context: { prior_phase: priorPhaseId }, docsAnchor: 'phase-gate' });
    return 0;
  }

  emitSignal({ hook: HOOK, decision: 'block', reason: 'prior-not-approved', context: { skill: skillPath, prior: prior }, docsAnchor: 'phase-gate' });
  process.stderr.write(messages.phaseGateBlocked(skillPath.replace(/^\//, ''), prior.replace(/^\//, '')) + '\n');
  return 2;
}

export function skillPathMatchesPhase(skillPath: string, phaseId: string): boolean {
  const m1 = skillPath.match(/^\/se-([0-9]+)/);
  if (m1) return phaseId === m1[1];
  const m2 = skillPath.match(/^\/eiw-stage([0-9]+)/);
  if (m2) return phaseId === `eiw-stage${m2[1]}` || phaseId === m2[1];
  const m3 = skillPath.match(/^\/D([0-9]+)/);
  if (m3) return phaseId === `D${m3[1]}`;
  return phaseId === skillPath.replace(/^\//, '');
}

if (process.env.NODE_ENV !== 'test' && import.meta.url === `file://${process.argv[1]}`) {
  let buf = '';
  process.stdin.setEncoding('utf-8');
  process.stdin.on('data', (chunk) => { buf += chunk; });
  process.stdin.on('end', async () => {
    try {
      const code = await main(buf);
      process.exit(code);
    } catch (err) {
      const detail = process.env.HOOK_DEBUG === '1' ? (err as Error).stack : (err as Error).message;
      emitSignal({ hook: HOOK, decision: 'warn', reason: 'unhandled-error', context: { error: String(detail) }, docsAnchor: 'phase-gate' });
      process.exit(0);
    }
  });
}
