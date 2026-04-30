#!/usr/bin/env node
// DESCRIPTION: PostToolUse(Edit|Write) — warn on missing structural sections in .claude/commands/*.md.
// PIPELINE-STATE-2026-0007: Hook 5.
import { messages } from './lib/messages.js';
import { emitSignal } from './lib/signals.js';
import { isHelpRequested, printHelp } from './lib/help.js';
const HOOK = 'posttool.lint-skill';
const HELP = {
    name: HOOK,
    description: 'Warns when .claude/commands/*.md files are missing required sections.',
    inputs: ['tool_name', 'tool_input.file_path', 'tool_input.new_string', 'tool_input.content'],
    exitCodes: [{ code: 0, meaning: 'Always — warn-only hook' }],
    envVars: [],
    bypass: [],
    docsAnchor: 'skill-lint',
    testIds: ['T5.1', 'T5.2', 'T5.3'],
};
const REQUIRED_SECTIONS = ['## Purpose', '## Phase Purpose', '## Usage', '## Protocol'];
export function findMissing(content) {
    const hasH1 = /^# /m.test(content);
    const hasAnyRequired = REQUIRED_SECTIONS.some((sec) => content.includes(sec));
    const missing = [];
    if (!hasH1)
        missing.push('# H1 heading');
    if (!hasAnyRequired)
        missing.push(`one of: ${REQUIRED_SECTIONS.join(' / ')}`);
    return missing;
}
export async function main(stdinJson) {
    if (isHelpRequested(process.argv)) {
        process.stdout.write(printHelp(HELP) + '\n');
        return 0;
    }
    let input;
    try {
        input = JSON.parse(stdinJson);
    }
    catch {
        return 0;
    }
    if (input.tool_name !== 'Edit' && input.tool_name !== 'Write')
        return 0;
    const filePath = input.tool_input?.file_path;
    if (!filePath || !/\.claude\/commands\/[^/]+\.md$/.test(filePath))
        return 0;
    const content = input.tool_input?.content ?? input.tool_input?.new_string ?? '';
    if (!content)
        return 0;
    const missing = findMissing(content);
    if (missing.length > 0) {
        process.stderr.write(messages.skillLintWarning(filePath, missing) + '\n');
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
        }
        catch (err) {
            const detail = process.env.HOOK_DEBUG === '1' ? err.stack : err.message;
            emitSignal({ hook: HOOK, decision: 'warn', reason: 'unhandled-error', context: { error: String(detail) }, docsAnchor: 'skill-lint' });
            process.exit(0);
        }
    });
}
