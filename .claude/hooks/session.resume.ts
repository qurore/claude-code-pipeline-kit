#!/usr/bin/env node
// DESCRIPTION: SessionStart — print resume banner for in-progress runs and archive completed/cancelled.
// PIPELINE-STATE-2026-0007: Hook 7.

import * as path from 'node:path';
import {
  archivableRuns,
  archiveRun,
  findInProgressRuns,
  isRecent,
  isStale,
  manifestToResumeEntry,
} from './lib/state-discovery.js';
import { messages } from './lib/messages.js';
import { emitSignal } from './lib/signals.js';
import { isHelpRequested, printHelp } from './lib/help.js';

const HOOK = 'session.resume';
const STATE_ROOT = path.resolve(process.cwd(), '.claude/pipeline-state');
const ARCHIVE_ROOT = path.resolve(process.cwd(), '.claude/pdca-archive/runs');

const HELP = {
  name: HOOK,
  description: 'Prints a resume banner for in-progress pipeline runs and archives completed/cancelled runs.',
  inputs: [],
  exitCodes: [{ code: 0, meaning: 'Always — informational hook' }],
  envVars: [
    { name: 'OPUS_GUARD_DISABLED', effect: 'If set, emits a bypass warning to remind the user' },
    { name: 'EDITOR_BYPASS', effect: 'If set, emits a bypass warning to remind the user' },
    { name: 'PIPELINE_ENFORCEMENT_DISABLED', effect: 'If set, emits a bypass warning to remind the user' },
  ],
  bypass: [],
  docsAnchor: 'session-resume',
  testIds: ['T7.1', 'T7.2', 'T7.3', 'T7.4', 'T7.5', 'T7.6', 'T7.7'],
};

export async function main(env: NodeJS.ProcessEnv = process.env, now = Date.now()): Promise<number> {
  if (isHelpRequested(process.argv)) {
    process.stdout.write(printHelp(HELP) + '\n');
    return 0;
  }

  // Archive eligible runs first (opportunistic).
  const toArchive = archivableRuns(STATE_ROOT, now);
  for (const run of toArchive) {
    try {
      archiveRun(run.runDir, ARCHIVE_ROOT);
      emitSignal({ hook: HOOK, decision: 'archive', reason: run.reason, context: { run: path.basename(run.runDir) }, docsAnchor: 'session-resume' });
    } catch (err) {
      emitSignal({ hook: HOOK, decision: 'warn', reason: 'archive-failed', context: { run: path.basename(run.runDir), error: (err as Error).message }, docsAnchor: 'session-resume' });
    }
  }

  const inProgress = findInProgressRuns(STATE_ROOT);
  const recent = inProgress.filter(({ manifest }) => isRecent(manifest, now) || isStale(manifest, now));
  const staleCount = recent.filter(({ manifest }) => isStale(manifest, now)).length;
  const entries = recent.map(({ manifest }) => manifestToResumeEntry(manifest, now));

  if (entries.length > 0) {
    process.stderr.write(messages.resumeBanner(entries, now) + '\n');
  }

  const summary = messages.archivalSummary(toArchive, staleCount);
  if (summary) {
    process.stderr.write(summary + '\n');
  }

  if (env.OPUS_GUARD_DISABLED === '1') {
    process.stderr.write(messages.bypassWarning('OPUS_GUARD_DISABLED') + '\n');
  }
  if (env.EDITOR_BYPASS === '1') {
    process.stderr.write(messages.bypassWarning('EDITOR_BYPASS') + '\n');
  }
  if (env.PIPELINE_ENFORCEMENT_DISABLED === '1') {
    process.stderr.write(messages.bypassWarning('PIPELINE_ENFORCEMENT_DISABLED') + '\n');
  }

  emitSignal({ hook: HOOK, decision: 'allow', reason: 'session-summary-printed', context: { in_progress: inProgress.length, archived: toArchive.length, stale: staleCount }, docsAnchor: 'session-resume' });
  return 0;
}

if (process.env.NODE_ENV !== 'test' && import.meta.url === `file://${process.argv[1]}`) {
  main().then(
    (code) => process.exit(code),
    (err) => {
      const detail = process.env.HOOK_DEBUG === '1' ? (err as Error).stack : (err as Error).message;
      emitSignal({ hook: HOOK, decision: 'warn', reason: 'unhandled-error', context: { error: String(detail) }, docsAnchor: 'session-resume' });
      process.exit(0);
    },
  );
}
