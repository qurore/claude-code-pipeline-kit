# .claude/hooks/

Deterministic enforcement of CLAUDE.md MUST rules and per-run pipeline state persistence.

## Quick start

| Action | Command |
|--------|---------|
| Build hooks | `cd .claude/hooks && npm install && npm run build` |
| Run tests | `npm test` |
| List all hooks | `./hook-runner.sh --list` |
| See hook help | `./hook-runner.sh <hook-name> --help` |
| System status report | `npm run smoke-test` |
| Audit Mandatory Opus compliance | `npm run audit-opus` |

## What runs when

| Event | Hook | Purpose | Blocks? |
|-------|------|---------|---------|
| PreToolUse(Skill) | `pretool.gate-skill` | Phase gate; prior phase must be approved | Yes |
| PreToolUse(Edit\|Write) | `pretool.gate-output` | Output gate; needs implementation phase OR sentinel | Yes |
| PreToolUse(Task) | `pretool.enforce-opus` | model: "opus" required | Yes |
| PostToolUse(Edit\|Write) | `posttool.lint-ui` | UI rule violations on `*.tsx` | No (warn) |
| PostToolUse(Edit\|Write) | `posttool.lint-skill` | Skill file structure | No (warn) |
| PostToolUse(Write) | `posttool.remind-migration` | Migration reminder (configurable) | No |
| SessionStart | `session.resume` | In-progress runs banner + archival | No |
| Stop | `stop.flush-manifest` | last_activity_at + orphan detection | No |
| Stop | `stop.enforce-pipeline-completion` | Block stop while a pipeline is mid-run | Yes (decision: block, bounded) |

## How to bypass — decision tree

When `pretool.gate-output` blocks, choose the right path:

| Situation | Path |
|-----------|------|
| New feature, architecture, or artifact creation | `/se-pipeline` |
| Bug, error, test failure (≥2 files) | `/defect-fix` |
| Implementation with defined design | `/eiw-review` |
| Trivial 1-file ≤3-line cosmetic fix | `touch .claude/pipeline-state/.trivial-fix-active` |
| Hook bug (escape hatch — report below) | `EDITOR_BYPASS=1` |

Reference: CLAUDE.md "Intent Classification (4-Tier Decision Tree)".

When `pretool.enforce-opus` blocks: add `model: "opus"` to the Task invocation, OR set `OPUS_GUARD_DISABLED=1` for migration only (warns each session — do not leave permanently set).

## How to debug a block

1. **Read the message.** Every block message includes a `docs:` link and bypass options.
2. **Inspect signals.** Each hook emits `[<hook>] decision=... reason=... [context...]` on stderr.
3. **Run the hook manually:**
   ```bash
   echo '{"tool_name":"Edit","tool_input":{"file_path":"src/foo.ts"}}' | ./hook-runner.sh pretool.gate-output
   ```
4. **Check for stale state.** `npm run smoke-test` reports current pipeline state.

## Anchors (referenced by `docs:` in stderr signals)

- `phase-gate` — Hook 1 phase gate logic
- `output-gate` — Hook 2 output gate logic
- `mandatory-opus` — Hook 3 Mandatory Opus enforcement
- `ui-lint` — Hook 4 UI rule linting
- `skill-lint` — Hook 5 skill file structural linting
- `migration-reminder` — Hook 6 migration reminder (configurable via package.json#claudeHooks.migrationGlob)
- `session-resume` — Hook 7 resume detection + archival
- `stop-flush` — Hook 8 manifest flush + orphan detection
- `enforce-completion` — Hook 9 pipeline completion enforcement
- `troubleshooting` — common patterns and fixes

## Pipeline completion enforcement (Hook 9 anchor: `enforce-completion`)

Hook 9 (`stop.enforce-pipeline-completion`) prevents the model from stopping while a pipeline run
is mid-execution. On every Stop event, it:

1. Reads the most recently active in-progress manifest via `findMostRecentlyActiveRun()`.
2. If found AND `stop_injections < MAX` (default 8), writes JSON `{"decision":"block","reason":...}`
   to stdout. Claude Code interprets this as "do not stop; resume". The reason includes the run
   id, current phase, and the next slash command to invoke.
3. If `stop_injections >= MAX`, writes `.pipeline-stalled-{run_id}` and lets the stop succeed.
4. If `.pipeline-aborted-{run_id}` exists, sets the manifest to `cancelled`, removes the marker,
   and lets the stop succeed.
5. Logs every decision to `.claude/pipeline-state/.stop-hook-log.jsonl` (append-only JSONL).

**How to opt out:** type `/abort-pipeline` (writes abort markers for all in-progress runs), or set
`PIPELINE_ENFORCEMENT_DISABLED=1`, or pre-write `.claude/pipeline-state/.pipeline-aborted-{run_id}`.

**How to override the cap:** set `PIPELINE_MAX_STOP_INJECTIONS=<n>`.

**How to inspect:** `node .claude/hooks/bin/sentinel-cli.mjs list` shows active pipelines and
their stop-injection counts. `tail .claude/pipeline-state/.stop-hook-log.jsonl` shows decisions.

**Sentinel files this hook reads/writes (under `.claude/pipeline-state/`):**
- `.pipeline-active-{run_id}` — debuggability marker (informational; written by `startPipeline`)
- `.pipeline-aborted-{run_id}` — single-shot abort signal (consumed by hook)
- `.pipeline-stalled-{run_id}` — cap-reached marker (informational; written by hook)
- `.stop-hook-log.jsonl` — append-only diagnostics

## Common failures

### My hook fired and I have no idea why

Set `HOOK_DEBUG=1` in your shell. The wrapper now echoes the hook description on every invocation, and exception handlers include full stack traces.

### Hooks are timing out in CI

Causes: cold-start adds ~80-120ms per invocation. Cumulative latency for an Edit can be ~400-600ms (gate-output + lint-ui + lint-skill). Fix: bundle hooks via `esbuild` to a single file (future optimization), or skip lint hooks in CI via `EDITOR_BYPASS=1` (last resort).

### Manifest got corrupted

```bash
# 1. Find the offending run.
jq . .claude/pipeline-state/*/manifest.json   # any errors → that's the corrupt one

# 2. Restore from a phase deliverable:
cat .claude/pipeline-state/<run>/phase-N-*.md | head -10  # check frontmatter

# 3. Rebuild manifest from on-disk deliverables (manual):
node .claude/hooks/scripts/repair-orphan.js <missing-file> --add-history

# 4. Last resort: cancel the run.
jq '.status = "cancelled"' .claude/pipeline-state/<run>/manifest.json > tmp && mv tmp .claude/pipeline-state/<run>/manifest.json
```

### Lock file leftover (manifest.json.lock)

```bash
# Locks expire after 10s. If a process crashed mid-write:
rm .claude/pipeline-state/<run>/manifest.json.lock
# OR wait — the next mutateManifest call will detect stale lock and recover.
```

### Sentinel race: two parallel sessions, one trivial fix sentinel

The sentinel uses atomic `renameSync` claim, so exactly one session bypasses. The other falls through to standard checks. If a session needs its own bypass, write a fresh sentinel: `touch .claude/pipeline-state/.trivial-fix-active`.

### Settings.json mis-registered

```bash
# Verify schema:
jq '.hooks | keys' .claude/settings.json   # should print PreToolUse, PostToolUse, etc.

# Smoke-test all hooks fire:
npm run smoke-test
```

## Troubleshooting

### Hook 2 blocked but I'm doing legitimate work

Most likely cause: no active pipeline, or current phase is not an implementation phase. Pick the right bypass from the decision tree above.

### Hook 3 blocked because I forgot `model: "opus"`

Fix the Task invocation — add `model: "opus"`. Per CLAUDE.md, this is mandatory for all subagents.

### Hook latency feels high

Run `npm run smoke-test` to measure. If p95 >500ms, ensure hooks are compiled (`npm run build`) and `dist/` exists. Hooks should NOT be invoked via `tsx` at runtime.

### Manifest looks stale or wrong

Run `npm run smoke-test` to inspect current state. If a run has `status: in_progress` but is genuinely abandoned, edit manifest to `status: cancelled` — Hook 7 will archive on next session start.

### Trivial-fix sentinel used multiple times

Sentinel is single-shot — atomically renamed to `.consumed.<pid>.<ts>` on first allowed write. Each new trivial fix needs a new sentinel: `touch .claude/pipeline-state/.trivial-fix-active`.

## Architecture

```
Claude Code session
  ↓
Tool call → PreToolUse → Tool executes → PostToolUse → Stop
              ↑                              ↑          ↑
        Hooks 1, 2, 3                  Hooks 4, 5, 6  Hook 8
                                                 SessionStart: Hook 7

All hooks → lib/ (manifest, state-discovery, messages, signals, help, repair)
                ↓
       .claude/pipeline-state/<run-id>/manifest.json + phase-N-*.md
```

## Files

| File | Purpose |
|------|---------|
| `hook-runner.sh` | Bash wrapper invoked by Claude Code; dispatches to compiled hooks |
| `pretool.gate-skill.ts` | Hook 1 |
| `pretool.gate-output.ts` | Hook 2 |
| `pretool.enforce-opus.ts` | Hook 3 |
| `posttool.lint-ui.ts` | Hook 4 |
| `posttool.lint-skill.ts` | Hook 5 |
| `posttool.remind-migration.mjs` | Hook 6 (Node ESM, no build step) |
| `session.resume.ts` | Hook 7 |
| `stop.flush-manifest.ts` | Hook 8 |
| `lib/types.ts` | Shared TypeScript types |
| `lib/manifest.ts` | Atomic read/write/mutate with advisory lock |
| `lib/state-discovery.ts` | Find runs, detect orphans, archive |
| `lib/messages.ts` | Sentence-case stderr message builders |
| `lib/signals.ts` | Structured branch-observability signals |
| `lib/help.ts` | Shared --help renderer |
| `lib/repair.ts` | Orphan repair suggester |
| `scripts/smoke-test.ts` | System status report and end-to-end smoke tests |
| `scripts/audit-mandatory-opus.sh` | Pre-deployment audit for Mandatory Opus violations |
| `scripts/repair-orphan.ts` | Runnable repair tool for orphaned deliverables |
| `vitest.config.ts` | Test configuration with 80% coverage thresholds |

See `.claude/pipeline-state/SCHEMA.md` for manifest format.
See `docs/pipeline-state-design.md` for full design rationale.
