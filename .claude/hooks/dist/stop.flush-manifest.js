#!/usr/bin/env node
// DESCRIPTION: Stop — update last_activity_at on the active manifest and warn on orphaned deliverables.
// PIPELINE-STATE-2026-0007: Hook 8.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { mutateManifest } from './lib/manifest.js';
import { detectOrphans, findMostRecentlyActiveRun } from './lib/state-discovery.js';
import { suggestRepair } from './lib/repair.js';
import { messages } from './lib/messages.js';
import { emitSignal } from './lib/signals.js';
import { isHelpRequested, printHelp } from './lib/help.js';
const HOOK = 'stop.flush-manifest';
const STATE_ROOT = path.resolve(process.cwd(), '.claude/pipeline-state');
const HELP = {
    name: HOOK,
    description: 'Updates last_activity_at on the active manifest and warns on orphaned deliverable files.',
    inputs: [],
    exitCodes: [{ code: 0, meaning: 'Always — informational hook' }],
    envVars: [],
    bypass: [],
    docsAnchor: 'stop-flush',
    testIds: ['T8.1', 'T8.2', 'T8.3', 'T8.4'],
};
export async function main(now = Date.now()) {
    if (isHelpRequested(process.argv)) {
        process.stdout.write(printHelp(HELP) + '\n');
        return 0;
    }
    if (!fs.existsSync(STATE_ROOT)) {
        emitSignal({ hook: HOOK, decision: 'skip', reason: 'no-state-dir', docsAnchor: 'stop-flush' });
        return 0;
    }
    const active = findMostRecentlyActiveRun(STATE_ROOT);
    if (!active) {
        emitSignal({ hook: HOOK, decision: 'skip', reason: 'no-active-run', docsAnchor: 'stop-flush' });
        return 0;
    }
    const manifestPath = path.join(active.dir, 'manifest.json');
    try {
        mutateManifest(manifestPath, (m) => {
            m.last_activity_at = new Date(now).toISOString();
        });
        emitSignal({ hook: HOOK, decision: 'allow', reason: 'flushed', context: { run: path.basename(active.dir) }, docsAnchor: 'stop-flush' });
    }
    catch (err) {
        emitSignal({ hook: HOOK, decision: 'warn', reason: 'flush-failed', context: { error: err.message }, docsAnchor: 'stop-flush' });
    }
    const orphans = detectOrphans(active.dir, active.manifest);
    const warnings = [];
    for (const m of orphans.missingDeliverables) {
        warnings.push({ type: 'missing', path: m.expectedPath, suggestion: `re-create or remove phase_history entry for phase ${m.phase}` });
        emitSignal({ hook: HOOK, decision: 'warn', reason: 'missing-deliverable', context: { path: m.expectedPath }, docsAnchor: 'stop-flush' });
    }
    for (const orphan of orphans.orphanedFiles) {
        const fullPath = path.join(active.dir, orphan);
        try {
            const stat = fs.statSync(fullPath);
            const suggestion = suggestRepair(fullPath, active.manifest, stat, now);
            const action = suggestion.command
                ? `${suggestion.classification}: ${suggestion.command}`
                : suggestion.classification;
            warnings.push({ type: 'orphan', path: orphan, suggestion: action });
            emitSignal({ hook: HOOK, decision: 'warn', reason: 'orphan', context: { path: orphan, classification: suggestion.classification }, docsAnchor: 'stop-flush' });
        }
        catch {
            warnings.push({ type: 'orphan', path: orphan });
        }
    }
    // Sweep stale .consumed.* sentinel artifacts older than 24h
    try {
        const sweepDir = STATE_ROOT;
        if (fs.existsSync(sweepDir)) {
            for (const f of fs.readdirSync(sweepDir)) {
                if (!f.startsWith('.trivial-fix-active.consumed.'))
                    continue;
                const full = path.join(sweepDir, f);
                const stat = fs.statSync(full);
                if (now - stat.mtimeMs > 24 * 60 * 60 * 1000) {
                    fs.unlinkSync(full);
                    emitSignal({ hook: HOOK, decision: 'archive', reason: 'sweep-consumed-sentinel', context: { file: f }, docsAnchor: 'stop-flush' });
                }
            }
        }
    }
    catch {
        // Best effort cleanup.
    }
    if (warnings.length > 0) {
        process.stderr.write(messages.orphanWarning(warnings) + '\n');
    }
    return 0;
}
if (process.env.NODE_ENV !== 'test' && import.meta.url === `file://${process.argv[1]}`) {
    main().then((code) => process.exit(code), (err) => {
        const detail = process.env.HOOK_DEBUG === '1' ? err.stack : err.message;
        emitSignal({ hook: HOOK, decision: 'warn', reason: 'unhandled-error', context: { error: String(detail) }, docsAnchor: 'stop-flush' });
        process.exit(0);
    });
}
