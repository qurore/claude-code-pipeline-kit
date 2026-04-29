# Pipeline state schema

Per-run on-disk state for SE/EIW/DRW pipelines. Survives context compaction, restart loops, and cross-session resume.

## Directory layout

```
.claude/pipeline-state/
├── .gitkeep                       # ensures directory exists
├── .trivial-fix-active            # sentinel (transient) — bypass for Hook 2
├── .trivial-fix-active.consumed.<pid>.<ts>   # post-consumption marker
├── .pipeline-active-<run_id>      # debuggability marker (Hook 9; written by startPipeline)
├── .pipeline-aborted-<run_id>     # single-shot abort signal (Hook 9; consumed on next stop)
├── .pipeline-stalled-<run_id>     # cap-reached marker (Hook 9; informational)
├── .stop-hook-log.jsonl           # append-only Hook 9 decision log
└── <pipeline>-<YYYY-MM-DD>-<run-id>/
    ├── manifest.json
    ├── phase-<N>-<slug>.md
    ├── phase-<N>-<slug>.v<M>.md   # restart versions
    ├── phase-<N>-<slug>.draft.md  # in-progress drafts (excluded from orphan check)
    └── ...
```

`<pipeline>` is one of `se`, `eiw`, `drw`. `<run-id>` is a hyphen-delimited slug derived from the feature description. Versioning: a restart writes `.v2`, `.v3`, etc.; the original is preserved.

## manifest.json

Stores authoritative pipeline run state. Snake_case is intentional — see "Naming rationale" below.

```typescript
interface PipelineManifest {
  pipeline: 'se' | 'eiw' | 'drw';
  run_id: string;
  feature: string;
  started_at: string;             // ISO 8601 with offset
  last_activity_at: string;       // ISO 8601 with offset
  current_phase: string;          // e.g., "5", "5.5", "eiw-stage2", "D3"
  iteration: number;              // 1..max_iterations
  max_iterations: number;
  restart_count: number;          // cross-phase restarts (FREE redos do not count)
  status: 'in_progress' | 'completed' | 'cancelled';
  output_mode: 'code' | 'documentation' | 'configuration' | 'mixed';
  br_flags: {
    se_1: boolean;   // Phase 5.5 executed?
    se_2: boolean;   // Phase 7.5 executed?
    eiw_1: boolean;  // Stage 3.5 executed?
    drw_1: boolean;  // Stage D3.5 executed?
  };
  phase_history: PhaseHistoryEntry[];
  accumulated_feedback: AccumulatedFeedbackEntry[];
  // Hook 9 (stop.enforce-pipeline-completion): incremented on each injected continuation.
  // Defaults to 0 on read when missing (back-compat). Cap configurable via
  // PIPELINE_MAX_STOP_INJECTIONS env var, default 8.
  stop_injections?: number;
}

interface PhaseHistoryEntry {
  phase: string;                  // "0", "1", ..., "9", "5.5", "eiw-stage2", "D3"
  status: 'approved' | 'rejected' | 'in_progress';
  iteration: number;
  started_at: string;
  completed_at: string | null;
  deliverable_path: string;       // relative to run directory
  approved_by: string;            // reviewer name or "self-check"
}

interface AccumulatedFeedbackEntry {
  iteration: number;
  source: string;                 // "Phase 5 Step D / CTO"
  reviewer: string;
  verdict: 'REJECTED' | 'CRITIQUED';
  critical_issues: FeedbackIssue[];
  major_issues: FeedbackIssue[];
  minor_issues: FeedbackIssue[];
  added_at: string;
}

interface FeedbackIssue {
  description: string;
  location: string;
  required_fix: string;
}
```

### Example

```json
{
  "pipeline": "se",
  "run_id": "se-2026-04-28-foo",
  "feature": "Add foo widget",
  "started_at": "2026-04-28T00:00:00+09:00",
  "last_activity_at": "2026-04-28T00:25:00+09:00",
  "current_phase": "5",
  "iteration": 1,
  "max_iterations": 4,
  "restart_count": 0,
  "status": "in_progress",
  "output_mode": "code",
  "br_flags": { "se_1": false, "se_2": false, "eiw_1": false, "drw_1": false },
  "phase_history": [
    {
      "phase": "0",
      "status": "approved",
      "iteration": 1,
      "started_at": "2026-04-28T00:00:00+09:00",
      "completed_at": "2026-04-28T00:05:00+09:00",
      "deliverable_path": "phase-0-codebase-context.md",
      "approved_by": "self-check"
    }
  ],
  "accumulated_feedback": []
}
```

## Phase deliverable frontmatter

Each `phase-<N>-<slug>.md` has YAML frontmatter:

```yaml
---
phase: 5                       # number, "5.5", "eiw-stage2", or "D3"
iteration: 1                   # 1..max_iterations
status: draft                  # draft | approved | rejected
approved_by: self-check        # reviewer name; placeholder during draft
created_at: 2026-04-28T00:30:00+09:00
---
```

## Lifecycle

1. **Run start.** Orchestrator creates run directory, writes initial `manifest.json` with `current_phase: "0"` (or pipeline entry phase) and `status: "in_progress"`.
2. **Phase Step C.** Skill writes `phase-<N>-<slug>.md` with frontmatter `status: draft`.
3. **Phase Step D approval.** Skill atomically updates manifest: append `phase_history` entry, set `current_phase` to next, update `last_activity_at`.
4. **Restart.** On cross-phase rejection: `iteration += 1`, `restart_count += 1`, write next phase deliverables as `.v2.md`. Carry accumulated_feedback forward. On Bar Raiser critique: set `br_flags.<flag> = true`, do NOT increment iteration, FREE redo.
5. **Completion.** Phase 9 (or stage 7 / D5) approval sets `status: completed`.
6. **Archival.** Hook 7 (SessionStart) moves `status: completed` runs older than 14 days, and `status: cancelled` runs immediately, to `.claude/pdca-archive/runs/<run-id>/`.

## Bar Raiser flag semantics

Flag transitions are one-way (false → true). After a Bar Raiser executes once, its flag stays true for the rest of the run, preventing duplicate critiques across restarts.

| Flag | Set by | Triggers FREE redo of |
|------|--------|----------------------|
| `se_1` | `/se-5-5-bar-raiser` | Phase 5 |
| `se_2` | `/se-7-5-bar-raiser` | Phase 6+7 |
| `eiw_1` | `/eiw-bar-raiser` | Stage 2+3 |
| `drw_1` | `/drw-bar-raiser` | Stage D3 |

## Naming rationale (snake_case)

Manifest JSON uses **snake_case** because:
1. It is read by humans via `cat`, `jq`, `grep`. Snake_case is a common convention for human-readable JSON config files (e.g., `phase_history`, `accumulated_feedback`).
2. It mirrors `.claude/pdca-archive/index.json` precedent (`cycle_id`, `target_skill`, `improvement_tier`).
3. Treating JSON as canonical wire format and TypeScript types as direct mirrors (no camelCase facade) eliminates a serialization layer where bugs hide.

TypeScript interfaces use snake_case fields exclusively for manifest types.

## Atomicity

Manifest writes use a temp-file-plus-rename pattern with an advisory file lock:

1. Write `manifest.json.tmp.<pid>.<ts>` with new contents.
2. `renameSync` atomically replaces `manifest.json`.
3. Lock acquired via `manifest.json.lock` sentinel file (10s TTL with stale-recovery).

Concurrent processes serialize through the lock; 100-1000 parallel writes converge to a consistent final state. See `.claude/hooks/lib/manifest.test.ts` for the contract test.
