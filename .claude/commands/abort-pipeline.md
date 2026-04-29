# Abort pipeline

Aborts ALL in-progress pipeline runs. Use when you want to stop a pipeline mid-execution and the
Stop hook is blocking termination.

## Usage

```
/abort-pipeline
```

Standalone utility — does not invoke pipeline phases (SE, EIW, DRW, PDCA).

## Protocol

1. Run `node .claude/hooks/bin/sentinel-cli.mjs abort-all` from the project root. This writes
   `.claude/pipeline-state/.pipeline-aborted-{run_id}` for every in-progress run.
2. Parse the JSON output (`{aborted: [...]}`) and present a sentence-case summary table.
3. Tell the user the abort takes effect at the next Stop event.

## Report format

When 1+ runs aborted:

```
Aborted N active pipeline run(s):

| Pipeline | Run ID | Phase reached | Iteration | Stop injections |
|----------|--------|---------------|-----------|-----------------|
| se       | <id>   | 6             | 2/4       | 3/8             |
| eiw      | <id>   | eiw-stage4    | 1/4       | 0/8             |

Markers written to .claude/pipeline-state/.pipeline-aborted-*. Effect: the next Stop event
sets each run's manifest status to cancelled and removes the abort marker. To restart any
of these: re-invoke /se-pipeline (or /eiw-review, /defect-fix, /pdca-cycle) with your feature
description.
```

When zero in-progress runs:

```
No active pipelines to abort.
```

## Behavior

- Idempotent. Re-running `/abort-pipeline` with no in-progress runs prints the empty message.
- Does NOT mutate manifests directly. The Stop hook (`stop.enforce-pipeline-completion`)
  performs the cancellation transaction on the next Stop event.
- If the Stop hook is disabled (`PIPELINE_ENFORCEMENT_DISABLED=1`), the abort marker has
  no effect — surface this as a warning if detected via `printenv`.

## When NOT to use

- To pause a pipeline (no pause primitive — only abort or complete).
- To skip a single phase (re-invoke the phase skill instead).
- To cancel a single run when others should continue (use `node .claude/hooks/bin/sentinel-cli.mjs abort --run-id=<id>` directly).
