#!/usr/bin/env node
// DESCRIPTION: PostToolUse(Write) — remind dual-env migration when migrations/*.sql is written.
// PIPELINE-STATE-2026-0007: Hook 6 (BR2 3.1: converted from .mjs to TS for consistency).
import { messages } from './lib/messages.js';
import { emitSignal } from './lib/signals.js';
import { isHelpRequested, printHelp } from './lib/help.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
function loadMigrationGlob() {
    // Default empty → hook is disabled. Set via package.json:
    //   "claudeHooks": { "migrationGlob": "your-app/migrations/*.sql" }
    try {
        const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
        const pkgPath = resolve(root, '.claude/hooks/package.json');
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        return pkg.claudeHooks?.migrationGlob ?? '';
    }
    catch {
        return '';
    }
}
function globToRegex(glob) {
    if (!glob)
        return null;
    // Convert simple glob (*, **) to regex
    const escaped = glob
        .replace(/[.+^${}()|[\]\\]/g, '\\$&') // escape regex chars
        .replace(/\\\*\\\*/g, '___DOUBLESTAR___') // **
        .replace(/\\\*/g, '[^/]*') // *
        .replace(/___DOUBLESTAR___/g, '.*');
    return new RegExp(`^${escaped}$`);
}
const MIGRATION_GLOB = loadMigrationGlob();
const MIGRATION_REGEX = globToRegex(MIGRATION_GLOB);
const HOOK = 'posttool.remind-migration';
const HELP = {
    name: HOOK,
    description: 'Reminds about additional-environment migrations when matching files are written. Configure via package.json#claudeHooks.migrationGlob.',
    inputs: ['tool_name', 'tool_input.file_path'],
    exitCodes: [{ code: 0, meaning: 'Always — warn-only hook' }],
    envVars: [],
    bypass: [],
    docsAnchor: 'migration-reminder',
    testIds: ['T6.1', 'T6.2'],
};
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
        emitSignal({ hook: HOOK, decision: 'skip', reason: 'malformed-stdin', docsAnchor: 'migration-reminder' });
        return 0;
    }
    const filePath = input.tool_input?.file_path ?? '';
    if (!MIGRATION_REGEX) {
        emitSignal({ hook: HOOK, decision: 'skip', reason: 'migration-glob-not-configured', docsAnchor: 'migration-reminder' });
        return 0;
    }
    if (input.tool_name === 'Write' && MIGRATION_REGEX.test(filePath)) {
        emitSignal({ hook: HOOK, decision: 'warn', reason: 'migration-written', context: { path: filePath }, docsAnchor: 'migration-reminder' });
        process.stderr.write(messages.migrationReminder() + '\n');
    }
    else {
        emitSignal({ hook: HOOK, decision: 'skip', reason: 'not-migration', docsAnchor: 'migration-reminder' });
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
            emitSignal({ hook: HOOK, decision: 'warn', reason: 'unhandled-error', context: { error: String(detail) }, docsAnchor: 'migration-reminder' });
            process.exit(0);
        }
    });
}
