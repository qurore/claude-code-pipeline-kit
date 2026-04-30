#!/usr/bin/env node
// DESCRIPTION: PreToolUse(Task) — enforce CLAUDE.md "Mandatory Opus Model for All Subagents".
// PIPELINE-STATE-2026-0007: Hook 3.
import { messages } from './lib/messages.js';
import { emitSignal } from './lib/signals.js';
import { isHelpRequested, printHelp } from './lib/help.js';
const HOOK = 'pretool.enforce-opus';
const HELP = {
    name: HOOK,
    description: 'Blocks Task (Agent) tool invocations missing model: "opus".',
    inputs: ['tool_name', 'tool_input.model', 'tool_input.subagent_type', 'tool_input.description', 'tool_input.prompt'],
    exitCodes: [
        { code: 0, meaning: 'Allow (model: opus or env bypass)' },
        { code: 2, meaning: 'Block (model missing or wrong)' },
    ],
    envVars: [{ name: 'OPUS_GUARD_DISABLED', effect: 'Set to 1 to bypass — emits warning, do not leave permanently set' }],
    bypass: ['Add model: "opus" to the Task invocation', 'Set OPUS_GUARD_DISABLED=1 (warns each session)'],
    docsAnchor: 'mandatory-opus',
    testIds: ['T3.1', 'T3.2', 'T3.3', 'T3.4', 'T3.5'],
};
export async function main(stdinJson, env = process.env) {
    if (isHelpRequested(process.argv)) {
        process.stdout.write(printHelp(HELP) + '\n');
        return 0;
    }
    let input;
    try {
        input = JSON.parse(stdinJson);
    }
    catch {
        emitSignal({ hook: HOOK, decision: 'skip', reason: 'malformed-stdin', docsAnchor: 'mandatory-opus' });
        return 0;
    }
    if (input.tool_name !== 'Task') {
        emitSignal({ hook: HOOK, decision: 'skip', reason: 'wrong-tool', docsAnchor: 'mandatory-opus' });
        return 0;
    }
    if (env.OPUS_GUARD_DISABLED === '1') {
        emitSignal({ hook: HOOK, decision: 'allow', reason: 'env-bypass', docsAnchor: 'mandatory-opus' });
        process.stderr.write(messages.bypassWarning('OPUS_GUARD_DISABLED') + '\n');
        return 0;
    }
    const model = input.tool_input?.model;
    if (model === 'opus') {
        emitSignal({ hook: HOOK, decision: 'allow', reason: 'opus-set', docsAnchor: 'mandatory-opus' });
        return 0;
    }
    emitSignal({
        hook: HOOK,
        decision: 'block',
        reason: model ? 'wrong-model' : 'opus-missing',
        context: { model: model ?? 'undefined' },
        docsAnchor: 'mandatory-opus',
    });
    const callerSkill = env.CLAUDE_INVOKING_SKILL;
    process.stderr.write(messages.mandatoryOpusBlocked(input.tool_input?.subagent_type, input.tool_input?.description, callerSkill, input.tool_input?.prompt) + '\n');
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
        }
        catch (err) {
            const detail = process.env.HOOK_DEBUG === '1' ? err.stack : err.message;
            emitSignal({ hook: HOOK, decision: 'warn', reason: 'unhandled-error', context: { error: String(detail) }, docsAnchor: 'mandatory-opus' });
            process.exit(0);
        }
    });
}
