# Pipelines reference

The kit ships four pipelines: SE (full lifecycle), EIW (implementation), DRW (defect resolution), PDCA (self-improvement). All four share the same step / approval pattern, the same Bar Raiser injection model, and the same persistent state.

## Pipeline summary

| Pipeline | Skill | Stages | Use when |
|----------|-------|--------|----------|
| **SE Pipeline** | `/se-pipeline` | 12 (Phase 0-9 + 5.5 + 7.5) | New feature, architecture, undefined design |
| **EIW** | `/eiw-review` | 9 (Stage 0-7 + 3.5) | Implementation-only with defined design |
| **DRW** | `/defect-fix` | 6 (D1-D5 + D3.5) | Bug fixes requiring investigation |
| **PDCA** | `/pdca-cycle` | 4 phases | Auto-triggered after error / feedback resolution |

## SE Pipeline

The SE Pipeline is the canonical full-lifecycle workflow: from a one-line prompt to a CEO-approved feature.

### Phase reference

| Phase | Name | Skill | Step pattern | Gate |
|-------|------|-------|--------------|------|
| 0 | Codebase Exploration | `/se-0-codebase-exploration` | A Strategy / B Investigation / C Report | Informational |
| 1 | Prompt Analysis | `/se-1-prompt-analysis` | A / B / C / D | Scope validated |
| 2 | Prompt Requirements | `/se-2-prompt-requirements` | A / B / C / D | Traceable to Phase 1 |
| 3 | SE Planning | `/se-3-planning` | A / B / C / D | Feasible, dependencies correct |
| 4 | SE Requirements | `/se-4-requirements` | A / B / C / D | Complete, constitution-compliant |
| 5 | Analysis & Design | `/se-5-design` | A / B / C / D | All 4 stakeholders (CEO/CTO/PTE/PM) approve |
| 5.5 | UX Bar Raiser (Design) | `/se-5-5-bar-raiser` | -- | Mandatory critique -> forces Phase 5 redo (FREE) |
| 6 | Implementation | `/se-6-implementation` | Per-task-group | Per-task-group checkpoint |
| 7 | Testing | `/se-7-testing` | -- | Coverage ≥80%, 0 failures |
| 7.5 | UX Bar Raiser (Implementation) | `/se-7-5-bar-raiser` | -- | Mandatory critique -> forces Phase 6+7 redo (FREE) |
| 8 | Evaluation | `/se-8-evaluation` | 3 parallel rounds | Code Quality + Requirements + UX pass |
| 9 | Final Approval | `/se-9-approval` | PM -> CTO -> CEO | Sequential approval |

### Phase 5 detail

Phase 5 runs 4 stakeholder reviews in parallel (CEO / CTO / PTE / PM). Each emits a verdict (APPROVED / REWORK / REJECTED). All four must APPROVE for Phase 5 to pass.

### Bar Raisers (5.5 / 7.5)

Bar Raisers fire after Phase 5 (design approved) and after Phase 7 (testing passed). They:

- Execute exactly once per pipeline run (boolean flag).
- Emit critique across 4 dimensions: FRICTION, DELIGHT_GAP, CONSISTENCY, ACCESSIBILITY.
- Force a FREE redo of the preceding stage (Phase 5 or Phase 6+7).
- Skip when all changed files are doc-only.

### Restart policy

| Trigger | Restart from |
|---------|--------------|
| Phase 1-4 Step D rejection | Same phase (FREE — internal restart) |
| Phase 5 CEO/CTO rejection | Phase 4 |
| Phase 5 PTE/PM rejection | Phase 5 |
| Phase 5.5 BR critique | Phase 5 (FREE) |
| Phase 6 checkpoint failure | Phase 6 |
| Phase 7 test failure | Phase 6 |
| Phase 7.5 BR critique | Phase 6 (FREE) |
| Phase 8 Code Quality failure | Phase 6 |
| Phase 8 Requirements failure | Phase 4 |
| Phase 8 UX failure | Phase 5 |
| Phase 9 PM rejection | Phase 8 |
| Phase 9 CTO rejection (impl) | Phase 6 |
| Phase 9 CTO rejection (arch) | Phase 5 |
| Phase 9 CEO REQUIRES_PIVOT | Phase 3 |
| Phase 9 CEO REJECTED | **CANCELLED** |

Max 3 cross-phase restarts (4 iterations).

## EIW (Enterprise Implementation Workflow)

EIW is the lightweight implementation-only pipeline. Use when requirements and design are already defined (e.g. carried forward from a prior SE Phase 5).

| Stage | Name | Skill | Gate |
|-------|------|-------|------|
| 0 | Architecture Review | `/eiw-stage0` | UCAR (6 criteria) + LAR (8 criteria) |
| 1 | Task Decomposition | `/eiw-stage1` | Hierarchical task structure |
| 2 | Implementation (TDD) | `/eiw-stage2` | RED-GREEN-REFACTOR per task |
| 3 | Checkpoint Review | `/eiw-stage3` | Per-task-group verification |
| 3.5 | UX Bar Raiser | `/eiw-bar-raiser` | Mandatory critique -> forces Stage 2+3 redo (FREE) |
| 4 | Final 3-Round Review | `/eiw-stage4` | Code Quality + Requirements + UX (parallel) |
| 5 | PM Approval | `/eiw-stage5` | Implementation completeness |
| 6 | CTO Technical Review | `/eiw-stage6` | Architecture, security, scalability |
| 7 | CEO Strategic Approval | `/eiw-stage7` | Business value, market fit |

### Restart policy

| Trigger | Restart from |
|---------|--------------|
| Stage 3.5 BR critique | Stage 2 (FREE) |
| Stage 3-5 failure | Stage 1 |
| Stage 6 CTO rejection (arch invalidated) | **Stage 0** |
| Stage 7 CEO REQUIRES_PIVOT | Stage 1 |
| Stage 7 CEO REJECTED | **CANCELLED** |

Max 3 restarts.

## DRW (Defect Resolution Workflow)

DRW is the structured bug-fix pipeline.

| Stage | Name | Persona | Gate |
|-------|------|---------|------|
| D1 | Investigation & Root Cause | Defect Analyst | Root cause identified; no escalation triggers |
| D2 | Scope Analysis | Pattern Analyst | Complete fix manifest (file:line for every instance) |
| D3 | TDD Fix | Senior Developer | RED test -> GREEN fix -> all tests pass |
| D3.5 | UX Bar Raiser | UX Bar Raiser | Mandatory critique -> forces D3 redo (FREE) |
| D4 | Verification | QA Lead | 0 failures; build passes; 100% manifest fixed |
| D5 | Technical Review | Code Quality Reviewer | APPROVED or REWORK |

### Escalation triggers

| Stage | Condition | Escalate to |
|-------|-----------|-------------|
| D1 | Missing feature discovered | `/se-pipeline` |
| D1 | Systemic architectural flaw | `/se-pipeline` |
| D2 | 10+ files heterogeneous | `/eiw-review` |
| D2 | New DB / API needed | `/eiw-review` |

### Restart policy

D4 failure / D5 REWORK -> restart D3. D3.5 critique -> restart D3 (FREE). Max 2 restarts (3 iterations). D5 internal rework is FREE.

## PDCA (Plan-Do-Check-Act)

PDCA is the autonomous self-improvement cycle. It is **automatically invoked** after any error / feedback resolution. The cycle:

| Phase | Skill | Purpose |
|-------|-------|---------|
| 1 | `/pdca-1-incident` | Reconstruct timeline, classify incident |
| 2 | `/pdca-2-attribution` | Identify earliest prevention point in the workflow |
| 3 | `/pdca-3-synthesis` | Design skill modification (Tier 1 / 2 / 3) |
| 4 | `/pdca-4-upgrade` | Apply modification to target skill file |

### Tier classification

| Tier | Type | Example |
|------|------|---------|
| **1 Tactical** | Add a rule to a single skill | "Reject inputs longer than 100 chars" |
| **2 Structural** | Modify the workflow shape | "Insert a verification step before Stage 4" |
| **3 Philosophical** | Change a principle | "Treat all inputs as untrusted by default" |

Every modification is annotated `<!-- PDCA-YYYY-NNNN: description -->` for traceability. Archive at `.claude/pdca-archive/cycles/PDCA-YYYY-NNNN.md`.

## Step ABCD detail

Each non-bar-raiser phase decomposes into 4 sub-steps:

### A. Discussion

Tri-persona dialogue. The kit defines three personas:

- **Proponent:** advocates for the simplest path to "done". Defaults to "ship it".
- **Skeptic:** raises edge cases, hidden assumptions, and risks. Defaults to "what could go wrong".
- **Integrator:** synthesises the two, surfaces the trade-off, proposes a decision.

The Discussion step produces a 3-way exchange. No deliverable yet -- this is exploration.

### B. Convergence

The agent narrows on a single proposal. Surfaces remaining dissent (deferred concerns). Confirms the next step is unambiguous.

### C. Deliverable

Produces the phase's concrete artifact (e.g. a markdown design doc, a code change, a task decomposition). The artifact is written to `.claude/pipeline-state/<run-id>/phase-N-<slug>.md`.

### D. Approval

A reviewer agent applies the per-phase rubric. Pass / fail. Restart triggers depend on which approval failed (see "Restart policy" tables above).

Step D approvals are documented per-phase in the corresponding skill file (e.g. `/se-5-design.md` describes the 4-stakeholder review rubric).

## Pipeline state

Every run produces:

```
.claude/pipeline-state/<run-id>/
├── manifest.json
├── phase-0-codebase-context.md
├── phase-1-prompt-analysis.md
├── ...
```

The manifest is the source of truth for pipeline state. See `.claude/pipeline-state/SCHEMA.md` for the field contract.

## Aborting a pipeline

If you decide a pipeline is no longer worth completing, run:

```
/abort-pipeline
```

This:

1. Marks the manifest `status: aborted`.
2. Preserves the deliverables for archival.
3. Clears the resumable-pipeline banner from SessionStart.
