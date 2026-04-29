# Pipeline state design

A 1-2 page rationale for the per-run state persistence model used by the SE / EIW / DRW pipelines. For schema details see [`.claude/pipeline-state/SCHEMA.md`](../.claude/pipeline-state/SCHEMA.md).

## Why per-run on-disk state

Long-running pipelines (SE Phase 0..9 with cross-phase restarts, EIW with multi-task-group cycles, DRW with iteration loops) produce more state than a single conversation can hold:

- Each phase emits a deliverable (~1-50K tokens) that subsequent phases consume.
- Restarts must replay prior approval history without re-deriving it.
- Bar Raiser flags must persist across iteration boundaries to enforce "exactly once" semantics.
- Stop-hook continuation requires a known terminal state per run.
- Cross-session resume requires manifest persistence beyond the conversation window.

The kit answers all four needs with a single mechanism: **a flat per-run directory with one canonical manifest plus per-phase deliverables.**

## Topology

```
.claude/pipeline-state/
├── SCHEMA.md                                # data-shape reference
├── .gitkeep                                 # ensures directory presence in checkouts
├── .trivial-fix-active                      # transient sentinel (single-shot bypass)
├── .pipeline-active-<run_id>                # debuggability marker (informational)
├── .pipeline-aborted-<run_id>               # single-shot abort signal (consumed by Hook 9)
├── .pipeline-stalled-<run_id>               # cap-reached marker (informational)
├── .stop-hook-log.jsonl                     # append-only Hook 9 decision log
└── <pipeline>-<YYYY-MM-DD>-<run-id>/
    ├── manifest.json                        # authoritative run state
    ├── phase-<N>-<slug>.md                  # phase deliverable
    ├── phase-<N>-<slug>.v<M>.md             # restart versions
    └── phase-<N>-<slug>.draft.md            # in-progress drafts
```

Each pipeline run produces exactly one directory. Names are inspectable — `ls .claude/pipeline-state/` shows all runs at a glance.

## Manifest as single source of truth

`manifest.json` is the canonical wire format. TypeScript types in `.claude/hooks/lib/types.ts` mirror the JSON 1:1 in snake_case to eliminate a serialization layer where bugs hide. Hook code reads/writes via `mutateManifest()` (file-locked atomic temp-file-plus-rename).

Snake_case is intentional — the file is read by `cat`, `jq`, and `grep` more often than by code.

## Atomicity contract

Manifest writes use a temp-file-plus-rename pattern with an advisory file lock:

1. Acquire `manifest.json.lock` sentinel (10s TTL with stale-recovery).
2. Write `manifest.json.tmp.<pid>.<ts>` with new contents.
3. `renameSync` atomically replaces `manifest.json`.
4. Release lock.

100-1000 parallel writes converge to a consistent final state. The contract test lives in `.claude/hooks/lib/manifest.test.ts`.

## Restart and Bar Raiser semantics

Cross-phase restarts increment `iteration` and `restart_count`. Bar Raiser (BR) restarts are FREE — they do NOT increment either counter. This is enforced via `br_flags` (one boolean per BR) which transitions one-way from `false` to `true` on first execution. After a BR fires once, its flag stays true for the rest of the run, preventing duplicate critiques across restarts.

## Stop-hook continuation contract

Hook 9 (`stop.enforce-pipeline-completion`) reads the most recently active in-progress manifest on every Stop event. If the manifest is `status: in_progress` and `stop_injections < MAX` (default 8), the hook writes `decision: block` to stdout, causing Claude Code to inject a continuation prompt. The hook bumps `stop_injections` and logs the decision to `.stop-hook-log.jsonl`.

This converts "the model stopped before finishing the pipeline" from a silent failure into a bounded retry loop. The MAX cap prevents infinite injections; once exceeded, the hook writes `.pipeline-stalled-<run_id>` and lets the stop succeed for human review.

## Survival across context compaction and session restart

The persistence design intentionally relies on filesystem state, not conversation memory:

- Context window pruning does NOT lose pipeline progress.
- A new session can resume by reading the manifest (Hook 7 `session.resume` shows a banner with active runs).
- The pipeline orchestrator is stateless across messages — it derives next steps purely from `manifest.json`.

## Trivial-Fix sentinel

Outside an active pipeline, `pretool.gate-output` blocks file writes by default to enforce the 4-tier intent classification rule. The Trivial-Fix sentinel (`.claude/pipeline-state/.trivial-fix-active`) provides a single-shot bypass: write the empty file, perform exactly one Edit/Write, and the hook atomically renames the sentinel to `.consumed.<pid>.<ts>` after the first allowed write.

Each new trivial fix needs a fresh sentinel. This shape ensures the bypass cannot be left "always on" by accident.

## Failure modes and recovery

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Manifest corruption | `jq . manifest.json` fails | Rebuild from on-disk deliverables; last resort `status: cancelled` |
| Stale lock file | Lock older than 10s TTL | Auto-recovered by next `mutateManifest` call |
| Orphaned deliverable (file exists, no `phase_history` entry) | Hook 8 reports at Stop | Run `node .claude/hooks/scripts/repair-orphan.js <path>` |
| Missing deliverable (history entry exists, no file) | Hook 8 reports at Stop | Restart the phase or remove the history entry |

## Where to read next

- [`.claude/pipeline-state/SCHEMA.md`](../.claude/pipeline-state/SCHEMA.md) — full TypeScript schema and field semantics
- [`hooks.md`](hooks.md) — per-hook reference for the 9 hooks that read/write state
- [`customization.md`](customization.md) — overriding `PIPELINE_MAX_STOP_INJECTIONS`, disabling Hook 9, etc.
