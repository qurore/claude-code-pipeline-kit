#!/usr/bin/env node
// PIPELINE-STATE-2026-0009: thin CLI wrapper around lib/pipeline-sentinel.
// Skills invoke this instead of inline `node -e ...`. Built once via `tsc -p .` then this file
// imports from dist/.
import { abortPipeline, advancePhase, completePipeline, getActivePipelines, startPipeline, } from '../dist/lib/pipeline-sentinel.js';
import { messages } from '../dist/lib/messages.js';
const args = process.argv.slice(2);
const cmd = args[0];
function parseFlags(rest) {
    const flags = {};
    for (const arg of rest) {
        if (!arg.startsWith('--'))
            continue;
        const [k, ...vparts] = arg.slice(2).split('=');
        flags[k] = vparts.length > 0 ? vparts.join('=') : 'true';
    }
    return flags;
}
function fail(msg, code = 1) {
    process.stderr.write(`sentinel-cli: ${msg}\n`);
    process.exit(code);
}
function require(flags, names) {
    for (const n of names) {
        if (!(n in flags))
            fail(`missing required flag --${n}`);
    }
}
function help() {
    process.stdout.write(`sentinel-cli — pipeline lifecycle helper

Usage:
  sentinel-cli start --pipeline=<se|eiw|drw> --run-id=<id> --feature="..." [--current-phase=<p>] [--output-mode=<mode>] [--max-iterations=<n>]
  sentinel-cli advance --run-id=<id> --phase=<p>
  sentinel-cli complete --run-id=<id>
  sentinel-cli abort --run-id=<id> [--reason="..."]
  sentinel-cli abort-all
  sentinel-cli list

Exit code 0 on success, 1 on error. Errors go to stderr.
`);
}
try {
    switch (cmd) {
        case undefined:
        case '--help':
        case '-h':
        case 'help':
            help();
            process.exit(0);
            break;
        case 'start': {
            const f = parseFlags(args.slice(1));
            require(f, ['pipeline', 'run-id', 'feature']);
            const opts = {
                pipeline: f.pipeline,
                runId: f['run-id'],
                feature: f.feature,
            };
            if (f['current-phase'])
                opts.currentPhase = f['current-phase'];
            if (f['output-mode'])
                opts.outputMode = f['output-mode'];
            if (f['max-iterations'])
                opts.maxIterations = Number.parseInt(f['max-iterations'], 10);
            const out = startPipeline(opts);
            // BR2 fix C1: snake_case JSON output.
            process.stdout.write(JSON.stringify({ manifest_path: out.manifestPath, run_dir: out.runDir }) + '\n');
            break;
        }
        case 'advance': {
            const f = parseFlags(args.slice(1));
            require(f, ['run-id', 'phase']);
            const m = advancePhase(f['run-id'], f.phase);
            process.stdout.write(JSON.stringify({ run_id: m.run_id, current_phase: m.current_phase }) + '\n');
            break;
        }
        case 'complete': {
            const f = parseFlags(args.slice(1));
            require(f, ['run-id']);
            const summary = completePipeline(f['run-id']);
            if (summary === null)
                fail(`run-id not found: ${f['run-id']}`);
            // BR2 fix C1: snake_case JSON output.
            process.stdout.write(JSON.stringify({
                pipeline: summary.pipeline,
                run_id: summary.runId,
                total_phases: summary.totalPhases,
                total_restarts: summary.totalRestarts,
                total_stop_injections: summary.totalStopInjections,
                duration_ms: summary.durationMs,
            }) + '\n');
            process.stderr.write(messages.pipelineCompleted(summary.pipeline, summary.runId, summary.totalPhases, summary.totalRestarts, summary.totalStopInjections, summary.durationMs) + '\n');
            break;
        }
        case 'abort': {
            const f = parseFlags(args.slice(1));
            require(f, ['run-id']);
            abortPipeline(f['run-id'], f.reason);
            process.stdout.write(JSON.stringify({ ok: true, run_id: f['run-id'] }) + '\n');
            break;
        }
        case 'abort-all': {
            const active = getActivePipelines();
            const aborted = [];
            for (const a of active) {
                abortPipeline(a.runId);
                aborted.push({
                    pipeline: a.pipeline,
                    run_id: a.runId,
                    phase: a.currentPhase,
                    iteration: `${a.iteration}/${a.maxIterations}`,
                    stop_injections: `${a.stopInjections}/8`,
                });
            }
            process.stdout.write(JSON.stringify({ aborted }) + '\n');
            break;
        }
        case 'list': {
            const f = parseFlags(args.slice(1));
            const active = getActivePipelines();
            const isTty = process.stdout.isTTY;
            const fmt = f.format ?? (isTty ? 'table' : 'json');
            if (fmt === 'table') {
                if (active.length === 0) {
                    process.stdout.write('No active pipelines.\n');
                }
                else {
                    process.stdout.write('| Pipeline | Run ID | Phase | Iteration | Stop injections |\n');
                    process.stdout.write('|----------|--------|-------|-----------|-----------------|\n');
                    for (const a of active) {
                        const ratio = a.stopInjections / 8;
                        const icon = ratio >= 0.63 ? '⚠️ ' : ratio >= 0.38 ? '🟡 ' : '🟢 ';
                        process.stdout.write(`| ${a.pipeline} | ${a.runId} | ${a.currentPhase} | ${a.iteration}/${a.maxIterations} | ${icon}${a.stopInjections}/8 |\n`);
                    }
                }
            }
            else {
                // BR2 fix C1: snake_case for JSON wire output to match manifest convention.
                const snake = active.map((a) => ({
                    pipeline: a.pipeline,
                    run_id: a.runId,
                    current_phase: a.currentPhase,
                    iteration: a.iteration,
                    max_iterations: a.maxIterations,
                    stop_injections: a.stopInjections,
                    started_at: a.startedAt,
                    last_activity_at: a.lastActivityAt,
                    run_dir: a.runDir,
                }));
                process.stdout.write(JSON.stringify(snake) + '\n');
            }
            break;
        }
        default:
            fail(`unknown command: ${cmd}. Run sentinel-cli --help for usage.`);
    }
}
catch (err) {
    fail(err && err.message ? err.message : String(err));
}
