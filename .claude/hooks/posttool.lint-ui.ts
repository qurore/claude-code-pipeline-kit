#!/usr/bin/env node
// DESCRIPTION: PostToolUse(Edit|Write) — warn on UI design rule violations in *.tsx.
// PIPELINE-STATE-2026-0007: Hook 4.

import { messages } from './lib/messages.js';
import { emitSignal } from './lib/signals.js';
import { isHelpRequested, printHelp } from './lib/help.js';
import type { HookInput, UiLintViolation } from './lib/types.js';

const HOOK = 'posttool.lint-ui';

const HELP = {
  name: HOOK,
  description: 'Warns on title-case JSX text, text-muted-foreground on long descriptions, and button text-shift patterns.',
  inputs: ['tool_name', 'tool_input.file_path', 'tool_input.new_string', 'tool_input.content'],
  exitCodes: [{ code: 0, meaning: 'Always — warn-only hook' }],
  envVars: [],
  bypass: [],
  docsAnchor: 'ui-lint',
  testIds: ['T4.1', 'T4.2', 'T4.3', 'T4.4', 'T4.5', 'T4.6'],
};

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadBrandAllowlist(): Set<string> {
  // Default allowlist — used when package.json#claudeHooks.brandAllowlist is empty/missing.
  // Customise via package.json:
  //   "claudeHooks": { "brandAllowlist": ["GitHub", "OAuth", ...] }
  const defaults = new Set<string>([
    'GitHub', 'OAuth', 'Claude', 'Vercel',
    'PostgreSQL', 'TypeScript', 'JavaScript', 'Next.js', 'React', 'MIT',
  ]);
  try {
    const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
    const pkgPath = resolve(root, '.claude/hooks/package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { claudeHooks?: { brandAllowlist?: string[] } };
    const list = pkg.claudeHooks?.brandAllowlist;
    if (Array.isArray(list) && list.length > 0) {
      return new Set(list);
    }
  } catch {
    // Malformed/missing config → use defaults (single warning emitted via signal once at startup).
  }
  return defaults;
}

const PROPER_NOUNS = loadBrandAllowlist();


const TITLE_CASE_REGEX = />([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4})</g;
const MUTED_FOREGROUND_REGEX = /className="[^"]*text-muted-foreground[^"]*"[^>]*>([^<]{40,})</g;
const BUTTON_TEXT_SHIFT_REGEX = /<Button[^>]*>\s*\{[^}]*\bis(?:Loading|Pending|Submitting|Saving)\b[^}]*\?[^}]*"[^"]+"[^}]*:[^}]*"[^"]+"/g;

export function isWhitelisted(text: string): boolean {
  for (const noun of PROPER_NOUNS) {
    if (text === noun) return true;
    if (text.startsWith(noun) || text.endsWith(noun)) return true;
  }
  return false;
}

export function findViolations(file: string, content: string): UiLintViolation[] {
  const violations: UiLintViolation[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNo = i + 1;

    let m: RegExpExecArray | null;
    const tcRe = new RegExp(TITLE_CASE_REGEX.source, 'g');
    while ((m = tcRe.exec(line)) !== null) {
      const text = m[1];
      if (!isWhitelisted(text)) {
        violations.push({ file, line: lineNo, rule: 'title-case', snippet: m[0].slice(0, 60) });
      }
    }

    const mfRe = new RegExp(MUTED_FOREGROUND_REGEX.source, 'g');
    while ((m = mfRe.exec(line)) !== null) {
      violations.push({ file, line: lineNo, rule: 'muted-foreground-on-description', snippet: m[1].slice(0, 60) });
    }

    const btRe = new RegExp(BUTTON_TEXT_SHIFT_REGEX.source, 'g');
    if (btRe.test(line)) {
      violations.push({ file, line: lineNo, rule: 'button-text-shift', snippet: line.trim().slice(0, 60) });
    }
  }

  return violations;
}

export async function main(stdinJson: string): Promise<number> {
  if (isHelpRequested(process.argv)) {
    process.stdout.write(printHelp(HELP) + '\n');
    return 0;
  }

  let input: HookInput;
  try {
    input = JSON.parse(stdinJson) as HookInput;
  } catch {
    return 0;
  }

  if (input.tool_name !== 'Edit' && input.tool_name !== 'Write') return 0;

  const filePath = input.tool_input?.file_path;
  if (!filePath || !filePath.endsWith('.tsx')) return 0;

  const content = input.tool_input?.content ?? input.tool_input?.new_string ?? '';
  if (!content) return 0;

  const violations = findViolations(filePath, content);
  if (violations.length > 0) {
    process.stderr.write(messages.uiLintWarning(violations) + '\n');
  }
  return 0;
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
      emitSignal({ hook: HOOK, decision: 'warn', reason: 'unhandled-error', context: { error: String(detail) }, docsAnchor: 'ui-lint' });
      process.exit(0);
    }
  });
}
