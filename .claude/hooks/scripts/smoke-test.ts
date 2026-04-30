#!/usr/bin/env node
// PIPELINE-STATE-2026-0007: Smoke test — system status report (BR 2.2).
// Run via `pnpm smoke-test` to confirm hook system end-to-end.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { findInProgressRuns, archivableRuns, manifestToResumeEntry, isStale } from '../lib/state-discovery.js';
import { messages, formatResumeEntry } from '../lib/messages.js';

const STATE_ROOT = path.resolve(process.cwd(), '.claude/pipeline-state');

function header(title: string): string {
  return `\n=== ${title} ===\n`;
}

function main(): void {
  const out: string[] = [];
  out.push('Pipeline state hooks — smoke test report');
  out.push(`Cwd: ${process.cwd()}`);
  out.push(`Date: ${new Date().toISOString()}`);

  out.push(header('1. Pipeline state directory'));
  if (!fs.existsSync(STATE_ROOT)) {
    out.push(`Status: missing (.claude/pipeline-state/ does not exist)`);
    out.push(`This is OK for first-run conversations. Hooks will exit 0 cleanly.`);
  } else {
    const entries = fs.readdirSync(STATE_ROOT, { withFileTypes: true });
    out.push(`Status: present`);
    out.push(`Run directories: ${entries.filter((e) => e.isDirectory() && !e.name.startsWith('.')).length}`);
    out.push(`Sentinels: ${entries.filter((e) => e.name.startsWith('.trivial-fix-active')).length}`);
  }

  out.push(header('2. In-progress runs'));
  const inProgress = findInProgressRuns(STATE_ROOT);
  if (inProgress.length === 0) {
    out.push('None.');
  } else {
    for (const { manifest } of inProgress) {
      out.push(formatResumeEntry(manifestToResumeEntry(manifest)));
    }
  }

  out.push(header('3. Archivable runs'));
  const archive = archivableRuns(STATE_ROOT);
  if (archive.length === 0) {
    out.push('None.');
  } else {
    for (const a of archive) {
      out.push(`${path.basename(a.runDir)} (${a.reason})`);
    }
  }

  out.push(header('4. Stale runs (>30d inactive)'));
  const stale = inProgress.filter(({ manifest }) => isStale(manifest));
  if (stale.length === 0) {
    out.push('None.');
  } else {
    for (const { manifest } of stale) {
      out.push(`${manifest.run_id} | ${manifest.last_activity_at}`);
    }
  }

  out.push(header('5. Hook compilation status'));
  const distDir = path.resolve(process.cwd(), '.claude/hooks/dist');
  if (!fs.existsSync(distDir)) {
    out.push(`MISSING: dist/ — run \`pnpm build\``);
  } else {
    const expected = [
      'pretool.gate-skill.js',
      'pretool.gate-output.js',
      'pretool.enforce-opus.js',
      'posttool.lint-ui.js',
      'posttool.lint-skill.js',
      'session.resume.js',
      'stop.flush-manifest.js',
    ];
    for (const e of expected) {
      const p = path.join(distDir, e);
      out.push(`  ${fs.existsSync(p) ? 'OK' : 'MISSING'}: ${e}`);
    }
    const mjs = path.resolve(process.cwd(), '.claude/hooks/posttool.remind-migration.mjs');
    out.push(`  ${fs.existsSync(mjs) ? 'OK' : 'MISSING'}: posttool.remind-migration.mjs (no build)`);
  }

  out.push(header('6. Settings registration'));
  const settingsPath = path.resolve(process.cwd(), '.claude/settings.json');
  if (!fs.existsSync(settingsPath)) {
    out.push(`MISSING: .claude/settings.json`);
  } else {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      if (!settings.hooks) {
        out.push(`PROBLEM: .claude/settings.json has no hooks key`);
      } else {
        const events = Object.keys(settings.hooks);
        out.push(`Events registered: ${events.join(', ')}`);
      }
    } catch (err) {
      out.push(`PROBLEM: ${(err as Error).message}`);
    }
  }

  out.push(header('Summary'));
  const issues: string[] = [];
  if (!fs.existsSync(distDir)) issues.push('hooks not compiled');
  if (!fs.existsSync(settingsPath)) issues.push('settings.json missing');
  if (issues.length === 0) {
    out.push('OK: hook system appears ready.');
  } else {
    out.push(`Issues: ${issues.join('; ')}`);
  }

  process.stdout.write(out.join('\n') + '\n');
}

main();
