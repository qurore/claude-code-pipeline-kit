#!/usr/bin/env node
// DESCRIPTION: PreToolUse(Edit|Write) — block writes outside .claude unless implementation phase or sentinel.
// PIPELINE-STATE-2026-0007: Hook 2.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { findMostRecentlyActiveRun } from './lib/state-discovery.js';
import { messages } from './lib/messages.js';
import { emitSignal } from './lib/signals.js';
import { isHelpRequested, printHelp } from './lib/help.js';
import type { HookInput } from './lib/types.js';

const HOOK = 'pretool.gate-output';

const IMPLEMENTATION_PHASES = new Set(['6', 'eiw-stage2', 'D3']);

const HELP = {
  name: HOOK,
  description: 'Blocks file writes outside .claude/ unless an active implementation phase or trivial-fix sentinel exists.',
  inputs: ['tool_name', 'tool_input.file_path'],
  exitCodes: [
    { code: 0, meaning: 'Allow' },
    { code: 2, meaning: 'Block (no implementation phase, no sentinel, no env bypass)' },
  ],
  envVars: [{ name: 'EDITOR_BYPASS', effect: 'Set to 1 to bypass — escape hatch for hook bugs only' }],
  bypass: [
    'Run a pipeline (/se-pipeline, /eiw-review, /defect-fix)',
    'Touch .claude/pipeline-state/.trivial-fix-active for trivial fixes',
    'Set EDITOR_BYPASS=1 (escape hatch)',
  ],
  docsAnchor: 'output-gate',
  testIds: ['T2.1', 'T2.2', 'T2.3', 'T2.4', 'T2.5', 'T2.6', 'T2.7', 'T2.8', 'T2.9', 'T2.10', 'T2.11'],
};

function isInClaudeOrGit(filePath: string, cwd: string): boolean {
  const rel = path.isAbsolute(filePath) ? path.relative(cwd, filePath) : filePath;
  return rel.startsWith('.claude/') || rel.startsWith('.claude\\') || rel.startsWith('.git/') || rel.startsWith('.git\\') || rel === '.claude' || rel === '.git';
}

function isInPipelineState(filePath: string, cwd: string): boolean {
  const rel = path.isAbsolute(filePath) ? path.relative(cwd, filePath) : filePath;
  return rel.startsWith('.claude/pipeline-state');
}

export async function main(stdinJson: string, env: NodeJS.ProcessEnv = process.env, cwd = process.cwd()): Promise<number> {
  if (isHelpRequested(process.argv)) {
    process.stdout.write(printHelp(HELP) + '\n');
    return 0;
  }

  const stateRoot = path.resolve(cwd, '.claude/pipeline-state');
  const sentinel = path.join(stateRoot, '.trivial-fix-active');

  let input: HookInput;
  try {
    input = JSON.parse(stdinJson) as HookInput;
  } catch {
    emitSignal({ hook: HOOK, decision: 'skip', reason: 'malformed-stdin', docsAnchor: 'output-gate' });
    return 0;
  }

  if (input.tool_name !== 'Edit' && input.tool_name !== 'Write') {
    emitSignal({ hook: HOOK, decision: 'skip', reason: 'wrong-tool', docsAnchor: 'output-gate' });
    return 0;
  }

  const filePath = input.tool_input?.file_path;
  if (!filePath) {
    emitSignal({ hook: HOOK, decision: 'skip', reason: 'no-file-path', docsAnchor: 'output-gate' });
    return 0;
  }

  if (isInClaudeOrGit(filePath, cwd) || isInPipelineState(filePath, cwd)) {
    emitSignal({ hook: HOOK, decision: 'allow', reason: 'in-claude-or-git', context: { path: filePath }, docsAnchor: 'output-gate' });
    return 0;
  }

  if (env.EDITOR_BYPASS === '1') {
    emitSignal({ hook: HOOK, decision: 'allow', reason: 'env-bypass', docsAnchor: 'output-gate' });
    return 0;
  }

  // Sentinel claim: rename atomically. Only one concurrent process wins.
  if (fs.existsSync(sentinel)) {
    const claimedName = `${sentinel}.consumed.${process.pid}.${Date.now()}`;
    try {
      fs.renameSync(sentinel, claimedName);
      emitSignal({ hook: HOOK, decision: 'allow', reason: 'sentinel-consumed', context: { claim: path.basename(claimedName) }, docsAnchor: 'output-gate' });
      return 0;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== 'ENOENT') {
        // Unexpected: continue to standard checks.
      }
    }
  }

  if (!fs.existsSync(stateRoot)) {
    emitSignal({ hook: HOOK, decision: 'block', reason: 'no-state-dir', context: { path: filePath }, docsAnchor: 'output-gate' });
    process.stderr.write(messages.outputGateBlocked(filePath, null) + '\n');
    return 2;
  }

  const active = findMostRecentlyActiveRun(stateRoot);
  if (!active) {
    emitSignal({ hook: HOOK, decision: 'block', reason: 'no-active-pipeline', context: { path: filePath }, docsAnchor: 'output-gate' });
    process.stderr.write(messages.outputGateBlocked(filePath, null) + '\n');
    return 2;
  }

  if (IMPLEMENTATION_PHASES.has(active.manifest.current_phase)) {
    emitSignal({ hook: HOOK, decision: 'allow', reason: 'phase-allowlist', context: { current_phase: active.manifest.current_phase }, docsAnchor: 'output-gate' });
    return 0;
  }

  emitSignal({ hook: HOOK, decision: 'block', reason: 'wrong-phase', context: { current_phase: active.manifest.current_phase, path: filePath }, docsAnchor: 'output-gate' });
  process.stderr.write(messages.outputGateBlocked(filePath, active.manifest.current_phase) + '\n');
  return 2;
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
      emitSignal({ hook: HOOK, decision: 'warn', reason: 'unhandled-error', context: { error: String(detail) }, docsAnchor: 'output-gate' });
      process.exit(0);
    }
  });
}
