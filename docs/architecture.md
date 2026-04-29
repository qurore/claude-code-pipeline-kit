# Architecture

The kit is a self-contained `.claude/` directory plus a CLAUDE.md template. It does not require runtime servers, daemons, or external infrastructure.

## Topology

```
your-project/
├── CLAUDE.md                  # Governance contract (copy from kit template)
└── .claude/
    ├── settings.json          # Activates hooks (copy from .template)
    ├── skills/                # 18 procedural workflow guides
    ├── agents/                # 9 persona reference cards
    ├── rules/                 # 2 coding-standard files
    ├── commands/              # 40 pipeline + utility skills
    ├── hooks/                 # 9 deterministic enforcement hooks
    │   ├── *.ts               # Hook source
    │   ├── lib/               # Shared library
    │   ├── bin/               # Sentinel CLI binary
    │   ├── scripts/           # Build, test, repair tools
    │   ├── config/            # Externalised hook config
    │   └── dist/              # Compiled output (committed to git)
    ├── pipeline-state/        # Per-run state (gitignored except SCHEMA.md)
    │   └── SCHEMA.md
    └── pdca-archive/          # Self-improvement history (gitignored except instincts.md)
        ├── instincts.md
        └── cycles/.gitkeep
```

## Layered enforcement

The kit applies rules through three concentric layers:

1. **CLAUDE.md (declarative)** -- the source-of-truth for governance. Skills, agents, and rules reference it. Subagents read it on every Phase 0 invocation.
2. **Skills, agents, rules (procedural)** -- workflow guides, persona briefings, and coding standards that subagents read at the relevant pipeline stage.
3. **Hooks (deterministic)** -- bash + Node.js code that fires at fixed Claude Code lifecycle events and enforces hard rules independent of subagent attention.

Hooks act as the "bottom-up" enforcement: even if a subagent forgets a rule, the hook still fires. CLAUDE.md acts as the "top-down" guidance: a subagent that reads it correctly does not need the hook.

## Pipeline lifecycle

Each pipeline (SE / EIW / DRW / PDCA) runs as a sequence of stages. State lives at `.claude/pipeline-state/<run-id>/`:

```
.claude/pipeline-state/<run-id>/
├── manifest.json              # Run header: pipeline, current_phase, status, history
├── phase-0-codebase-context.md
├── phase-1-prompt-analysis.md
├── phase-2-prompt-requirements.md
├── ...
└── phase-9-approval.md
```

The `manifest.json` is the authoritative state. It survives:

- Context compaction (the JSON is small and re-readable).
- Session restart (Claude Code re-attaches at SessionStart and the `session.resume` hook surfaces the active run).
- Cross-session work (a developer can resume a pipeline started yesterday).

## Step ABCD inside each phase

Phases 1-9 (SE) and Stages 1-7 (EIW) decompose into four sub-steps:

| Step | Purpose |
|------|---------|
| **A. Discussion** | Tri-persona dialogue (proponent, skeptic, integrator) explores the problem space |
| **B. Convergence** | The agent narrows on a single proposal and surfaces dissent |
| **C. Deliverable** | The phase produces its concrete artifact (markdown, code, design doc) |
| **D. Approval** | A reviewer agent applies a per-phase rubric; pass / fail determines whether the next phase starts |

Phase 0 has 3 steps (Strategy, Investigation, Report). Bar Raisers (Phase 5.5 / 7.5 / EIW 3.5 / DRW D3.5) have no steps -- they execute exactly once per run, force a redo, and step out.

## Bar Raiser injection

Bar Raisers are mandatory UX critique injections. They:

- Execute exactly once per pipeline run (boolean flag guard).
- Have NO verdict and NO approval -- they always emit critique.
- Force a FREE redo of the preceding implementation stage (does not count against the max-restart budget).
- Skip when ALL changed files match doc-only globs.

Bar Raisers raise the UX bar by one notch by forcing the implementer to re-confront 4 dimensions: FRICTION, DELIGHT_GAP, CONSISTENCY, ACCESSIBILITY.

## Data flow

```
User message
    -> Intent classification (4-tier tree in CLAUDE.md)
    -> Pipeline orchestrator skill (e.g. /se-pipeline)
        -> Phase orchestrator (Step A -> B -> C -> D)
            -> Subagent (reads CLAUDE.md, skills, agents, rules)
                -> Tool calls (Edit, Write, Bash, Task, Skill)
                    -> Hook firing (pretool / posttool)
                    -> Manifest update (.claude/pipeline-state/<run-id>/)
```

Hooks observe and gate this flow but do not generate content themselves. They emit signals (`signal:` prefix on stderr) that other hooks (`session.resume`, `stop.flush-manifest`) consume to maintain manifest integrity.

## Failure modes and recovery

| Failure | Recovery |
|---------|----------|
| Subagent forgets a rule | Hook fires, blocks the action, surfaces remediation |
| Pipeline phase fails review | Restart from the trigger-defined phase (max 3 cross-phase restarts) |
| Bar Raiser fires | Redo the implementation stage (FREE, does not count against limit) |
| Session compacts mid-pipeline | `session.resume` hook detects the active run from manifest, surfaces a banner |
| Build artifacts (`dist/`) missing | `session.resume` hook surfaces a banner; `install.sh --rebuild-hooks` fixes |

The kit is designed so that the operator cannot lose pipeline progress through normal failure modes. Manifest integrity is the contract; hook compaction is its enforcement mechanism.
