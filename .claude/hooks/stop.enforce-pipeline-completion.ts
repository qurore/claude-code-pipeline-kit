#!/usr/bin/env node
// DESCRIPTION: Stop — block stop when an in-progress pipeline run exists; force model to continue.
// PIPELINE-STATE-2026-0009: Hook 9.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { mutateManifest } from './lib/manifest.js';
import { findMostRecentlyActiveRun } from './lib/state-discovery.js';
import { nextSkillCommand, messages } from './lib/messages.js';
import { emitSignal } from './lib/signals.js';
import { isHelpRequested, printHelp } from './lib/help.js';
import {
  abortMarkerPath,
  clearAbortMarker,
  incrementStopInjections,
  isAborted,
  markStalled,
} from './lib/pipeline-sentinel.js';
import type { HookHelp, PipelineManifest } from './lib/types.js';

const HOOK = 'stop.enforce-pipeline-completion';
const DEFAULT_MAX = 8;

// BR2 fix C2: lazy resolution — call defaultStateRoot() inside main(), not at module load.
function resolveStateRoot(override?: string): string {
  return override ?? path.resolve(process.cwd(), '.claude/pipeline-state');
}

const HELP: HookHelp = {
  name: HOOK,
  description: 'Blocks the Stop event when an in-progress pipeline run exists, forcing the model to continue. Bounded retry, abort sentinel, fail-open.',
  inputs: ['stdin: HookInput JSON (unused; hook reads filesystem state)'],
  exitCodes: [{ code: 0, meaning: 'Always — fail-open' }],
  envVars: [
    { name: 'PIPELINE_ENFORCEMENT_DISABLED', effect: 'Set to 1 to disable enforcement entirely; hook becomes a no-op.' },
    { name: 'PIPELINE_MAX_STOP_INJECTIONS', effect: 'Override default cap of 8 stop injections per run.' },
  ],
  bypass: [
    'Type /abort-pipeline to cancel the active run.',
    'Touch .claude/pipeline-state/.pipeline-aborted-{run_id} to abort a specific run.',
    'Set PIPELINE_ENFORCEMENT_DISABLED=1 to disable enforcement (warns at SessionStart).',
  ],
  docsAnchor: 'enforce-completion',
  testIds: ['T9.1', 'T9.2', 'T9.3', 'T9.4', 'T9.5', 'T9.6', 'T9.7', 'T9.8', 'T9.9', 'T9.10'],
};

interface LogEntry {
  ts: string;
  run_id: string | null;
  pipeline: string | null;
  phase: string | null;
  decision: 'block' | 'skip' | 'aborted' | 'stalled' | 'env-disabled' | 'unhandled-error';
  injection_count: number | null;
  reason: string;
}

function appendLog(entry: LogEntry, stateRoot: string): void {
  try {
    if (!fs.existsSync(stateRoot)) fs.mkdirSync(stateRoot, { recursive: true });
    const line = JSON.stringify(entry) + '\n';
    fs.appendFileSync(path.join(stateRoot, '.stop-hook-log.jsonl'), line, { encoding: 'utf-8', mode: 0o644 });
  } catch {
    // Logging is best-effort; never crash the hook.
  }
}

function parseMax(raw: string | undefined): number {
  if (!raw) return DEFAULT_MAX;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MAX;
}

function nextPhaseCommand(m: PipelineManifest): string {
  return nextSkillCommand(m.pipeline, m.current_phase);
}

export interface RunDeps {
  stateRoot?: string;
  env?: NodeJS.ProcessEnv;
  now?: () => Date;
  stdoutWrite?: (chunk: string) => void;
  stderrWrite?: (chunk: string) => void;
}

export async function main(deps: RunDeps = {}): Promise<number> {
  const stateRoot = resolveStateRoot(deps.stateRoot);
  const env = deps.env ?? process.env;
  const debug = env.HOOK_DEBUG === '1';
  const now = (deps.now ?? (() => new Date()))();
  const stdoutWrite = deps.stdoutWrite ?? ((s: string) => process.stdout.write(s));
  const stderrWrite = deps.stderrWrite ?? ((s: string) => process.stderr.write(s));

  if (isHelpRequested(process.argv)) {
    stdoutWrite(printHelp(HELP) + '\n');
    return 0;
  }

  if (env.PIPELINE_ENFORCEMENT_DISABLED === '1') {
    appendLog({
      ts: now.toISOString(),
      run_id: null,
      pipeline: null,
      phase: null,
      decision: 'env-disabled',
      injection_count: null,
      reason: 'PIPELINE_ENFORCEMENT_DISABLED=1',
    }, stateRoot);
    emitSignal({ hook: HOOK, decision: 'skip', reason: 'env-disabled', docsAnchor: 'enforce-completion' });
    return 0;
  }

  if (!fs.existsSync(stateRoot)) {
    appendLog({
      ts: now.toISOString(),
      run_id: null,
      pipeline: null,
      phase: null,
      decision: 'skip',
      injection_count: null,
      reason: 'no-state-dir',
    }, stateRoot);
    emitSignal({ hook: HOOK, decision: 'skip', reason: 'no-state-dir', docsAnchor: 'enforce-completion' });
    return 0;
  }

  const active = findMostRecentlyActiveRun(stateRoot);
  if (!active) {
    appendLog({
      ts: now.toISOString(),
      run_id: null,
      pipeline: null,
      phase: null,
      decision: 'skip',
      injection_count: null,
      reason: 'no-active-run',
    }, stateRoot);
    emitSignal({ hook: HOOK, decision: 'skip', reason: 'no-active-run', docsAnchor: 'enforce-completion' });
    return 0;
  }

  const m = active.manifest;

  if (isAborted(m.run_id, stateRoot)) {
    try {
      mutateManifest(path.join(active.dir, 'manifest.json'), (mm) => {
        mm.status = 'cancelled';
        mm.last_activity_at = now.toISOString();
      });
    } catch {
      // If manifest mutation fails, still honor the abort — fail-open is preferable to looping.
    }
    clearAbortMarker(m.run_id, stateRoot);
    appendLog({
      ts: now.toISOString(),
      run_id: m.run_id,
      pipeline: m.pipeline,
      phase: m.current_phase,
      decision: 'aborted',
      injection_count: m.stop_injections ?? 0,
      reason: 'abort-marker-honored',
    }, stateRoot);
    emitSignal({ hook: HOOK, decision: 'allow', reason: 'aborted', context: { run: m.run_id }, docsAnchor: 'enforce-completion' });
    return 0;
  }

  const max = parseMax(env.PIPELINE_MAX_STOP_INJECTIONS);
  const current = m.stop_injections ?? 0;

  if (current >= max) {
    markStalled(m.run_id, stateRoot);
    stderrWrite(messages.pipelineStalled(m.run_id, m.current_phase, max) + '\n');
    appendLog({
      ts: now.toISOString(),
      run_id: m.run_id,
      pipeline: m.pipeline,
      phase: m.current_phase,
      decision: 'stalled',
      injection_count: current,
      reason: 'cap-reached',
    }, stateRoot);
    emitSignal({ hook: HOOK, decision: 'warn', reason: 'stalled', context: { run: m.run_id, count: current, max }, docsAnchor: 'enforce-completion' });
    return 0;
  }

  const next = incrementStopInjections(m.run_id, stateRoot);
  const nextCmd = nextPhaseCommand(m);
  const reason = messages.stopBlockReason(
    m.pipeline,
    m.run_id,
    m.current_phase,
    m.iteration,
    m.max_iterations,
    next,
    max,
    nextCmd,
  );

  stdoutWrite(JSON.stringify({ decision: 'block', reason }));
  appendLog({
    ts: now.toISOString(),
    run_id: m.run_id,
    pipeline: m.pipeline,
    phase: m.current_phase,
    decision: 'block',
    injection_count: next,
    reason,
  }, stateRoot);
  emitSignal({ hook: HOOK, decision: 'block', reason: 'incomplete-pipeline', context: { run: m.run_id, count: next, max }, docsAnchor: 'enforce-completion' });
  return 0;
}

if (process.env.NODE_ENV !== 'test' && import.meta.url === `file://${process.argv[1]}`) {
  // Ignore stdin payload; hook decision is filesystem-driven. Drain stdin to avoid hanging.
  process.stdin.resume();
  process.stdin.on('data', () => { /* discard */ });
  process.stdin.on('end', async () => {
    try {
      const code = await main();
      process.exit(code);
    } catch (err) {
      const detail = process.env.HOOK_DEBUG === '1' ? (err as Error).stack : (err as Error).message;
      try {
        appendLog({
          ts: new Date().toISOString(),
          run_id: null,
          pipeline: null,
          phase: null,
          decision: 'unhandled-error',
          injection_count: null,
          reason: String(detail),
        }, resolveStateRoot());
      } catch { /* already failing */ }
      emitSignal({ hook: HOOK, decision: 'warn', reason: 'unhandled-error', context: { error: String(detail) }, docsAnchor: 'enforce-completion' });
      process.exit(0);
    }
  });
  // If no stdin arrives within 50ms, run anyway (Stop hook may be invoked with empty stdin).
  setTimeout(async () => {
    try {
      const code = await main();
      process.exit(code);
    } catch (err) {
      const detail = process.env.HOOK_DEBUG === '1' ? (err as Error).stack : (err as Error).message;
      emitSignal({ hook: HOOK, decision: 'warn', reason: 'unhandled-error', context: { error: String(detail) }, docsAnchor: 'enforce-completion' });
      process.exit(0);
    }
  }, 50);
}
