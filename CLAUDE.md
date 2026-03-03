# Claude Code Pipeline Kit — Governance Rules

> This CLAUDE.md defines the governance rules that power the Pipeline Kit skill pipelines. Copy this file (or merge its contents) into your project's `CLAUDE.md`.

---

## Configuration: Project-Specific Commands

Before using the pipelines, define your project's build/test commands. The skill files reference these variables — replace them with your actual commands.

```
# Add these to YOUR project's CLAUDE.md:

## Build & Test Commands
- **$BUILD_CMD**: `npm run build` (or `cargo build`, `go build`, etc.)
- **$TEST_CMD**: `npm run test -- --run` (or `pytest`, `go test ./...`, etc.)
- **$LINT_CMD**: `npm run lint` (or `cargo clippy`, `golangci-lint run`, etc.)
- **$TYPE_CHECK_CMD**: `npm run type-check` (or `mypy .`, `tsc --noEmit`, etc.)
- **$COVERAGE_CMD**: `npm run test:coverage` (or `pytest --cov`, etc.)
- **$E2E_CMD**: `npm run test:e2e` (or `playwright test`, `cypress run`, etc.)
```

---

## Mandatory Opus Model for All Subagents

**ALL subagents spawned via the Task tool within ANY skill or pipeline MUST use `model: "opus"` unless a specific skill file explicitly overrides with a different model for a documented reason.**

This applies to all pipelines: SE Pipeline, EIW, DRW, PDCA, and any custom skills that spawn subagents.

**When invoking the Task tool for a subagent, ALWAYS include `model: "opus"` in the parameters:**
```
Task tool: subagent_type: "general-purpose", model: "opus"
```

> **Note:** Users who want to reduce cost can change this to `model: "sonnet"` in their project's CLAUDE.md. Opus provides the highest quality reviews but at higher cost.

---

## Playwright Screenshots Save Directory

**ALL `browser_take_screenshot` calls MUST use the `filename` parameter with a path under `.claude/screenshots/`.** Never save screenshots to the project root or any other directory. Example: `filename: ".claude/screenshots/my-screenshot.png"`. Add `.claude/screenshots/` to your `.gitignore`.

---

## Intent Classification (4-Tier System)

**Before responding to ANY user message, classify the user's intent using the following decision tree:**

### Step 1: Does the request require file modifications?

| Answer | Result |
|--------|--------|
| **NO** | **Advisory** — Respond directly. No pipeline invocation. |
| **YES** | Proceed to Step 2. |

### Step 2: Is the user reporting a bug, error, or test failure?

| Answer | Result |
|--------|--------|
| **YES** | Is it trivial? (1 file, ≤3 lines, cosmetic/syntactic only, no behavioral change) |
|         | → **YES**: **Trivial Fix** — Apply directly. No pipeline. |
|         | → **NO**: **Defect Resolution** → `/defect-fix` |
| **NO** | Proceed to Step 3. |

### Step 3: Is this a new feature, architectural change, or new artifact creation?

**"New artifact creation" includes ANY of the following:**
- Documentation creation or major documentation changes
- Skill file or workflow definition creation
- Configuration file creation or modification (non-trivial)
- Database schema changes (migrations)
- API endpoint additions or modifications
- Specification or design document creation

| Answer | Result |
|--------|--------|
| **YES** | **Full Lifecycle** → `/se-pipeline` |
| **NO** | Proceed to Step 4. |

### Step 4: Are requirements and design already defined?

| Answer | Result |
|--------|--------|
| **YES** | **Implementation** → `/eiw-review` |
| **NO** | **Full Lifecycle** → `/se-pipeline` |

### Output-Generating Sub-Classification

| Sub-Classification | Pipeline | Trigger |
|-------------------|----------|---------|
| **Trivial Fix** | None (apply directly) | 1 file, ≤3 lines, cosmetic/syntactic, no behavioral change |
| **Defect Resolution** | `/defect-fix` (DRW) | Bug report, error, test failure requiring investigation |
| **Implementation** | `/eiw-review` (EIW) | Requirements defined, design defined, implementation-only |
| **Full Lifecycle** | `/se-pipeline` (SE) | New feature, architecture change, new artifact creation, or undefined requirements |

### Classification Rules

1. If the response requires `Write`, `Edit`, `NotebookEdit`, or creating/modifying any file → **Output-Generating** → sub-classify per decision tree above
2. If the response is purely conversational → **Advisory** → No pipeline
3. If ambiguous, ask the user: "Does this require generating or modifying files, or are you looking for advice?"
4. **Generating a commit, push, or PR** from already-implemented code is NOT output-generating
5. **Bug reports are ALWAYS Defect Resolution** unless they meet ALL trivial fix criteria
6. **Error messages, stack traces, or "X is broken/failing"** → always classify as Defect Resolution first

### Classification Examples

| User Message | Classification | Pipeline |
|-------------|---------------|----------|
| "There's a typo in the README on line 5" | Trivial Fix | None |
| "Tests are failing in the auth module" | Defect Resolution | `/defect-fix` |
| "Add dark mode support" | Full Lifecycle | `/se-pipeline` |
| "Implement the login page per the design doc" | Implementation | `/eiw-review` |
| "Runtime error: Cannot read property 'id' of undefined" | Defect Resolution | `/defect-fix` |

---

## Defect Resolution Workflow (DRW)

**For defect resolution tasks, use the DRW. It provides structured investigation, comprehensive scope analysis, TDD-driven fixes, and technical review.**

### When DRW Applies

- User-reported bugs, errors, or malfunctions
- Runtime errors (e.g., validation failures, type mismatches)
- Test failures requiring investigation and code fixes
- Error patterns affecting multiple files (2+ files)
- Any defect that requires investigation before fixing

### When DRW Does NOT Apply

| Scenario | Correct Pipeline |
|----------|-----------------|
| Single typo, 1 file, ≤3 lines, cosmetic only | **Trivial Fix** — apply directly |
| Bug fix reveals missing feature requirement | **Escalate to `/se-pipeline`** |
| Bug fix reveals systemic architectural flaw | **Escalate to `/se-pipeline`** |
| Fix requires new DB tables or API endpoints | **Escalate to `/eiw-review`** |
| Fix scope exceeds 10 files | **Escalate to `/eiw-review`** |

### Invocation

| Command | Action |
|---------|--------|
| **`/defect-fix [error description]`** | Runs all 5 stages (D1→D5) with restart handling |

### Stage Overview

| Stage | Name | Persona | Gate |
|-------|------|---------|------|
| D1 | Investigation & Root Cause | Defect Analyst | Root cause identified |
| D2 | Scope Analysis | Pattern Analyst | Complete fix manifest |
| D3 | TDD Fix | Senior Developer | All tests pass |
| D4 | Verification | QA Lead | 0 failures, build passes |
| D5 | Technical Review | Code Quality Reviewer | APPROVED or REWORK |

### Restart Policy

- Maximum 2 restarts (3 total iterations); 4th attempt → human escalation
- D4/D5 failure → restart D3

---

## Software Engineering Pipeline (SE Pipeline)

**All tasks that produce file output and require full lifecycle analysis MUST follow the SE Pipeline — a 10-phase (0-9) quality gate from codebase exploration through final approval.**

### When SE Pipeline Applies

- New features requiring code generation
- Documentation creation or major changes
- Database schema changes
- API endpoint additions
- Architectural changes with undefined requirements
- Any task producing files that is NOT a defect or implementation-only

### Invocation

| Command | Action |
|---------|--------|
| **`/se-pipeline [feature]`** | Runs ALL phases (0-9) end-to-end |
| `/se-0-codebase-exploration` through `/se-9-approval` | Run individual phases |

### Phase Overview

| Phase | Name | Skill | Gate |
|-------|------|-------|------|
| 0 | Codebase Exploration | `/se-0-codebase-exploration` | Informational (no approval gate) |
| 1 | Prompt Analysis | `/se-1-prompt-analysis` | Scope validated |
| 2 | Prompt Requirements | `/se-2-prompt-requirements` | Traceable to Phase 1 |
| 3 | SE Planning | `/se-3-planning` | Feasible, dependencies correct |
| 4 | SE Requirements | `/se-4-requirements` | Complete, traceable |
| 5 | Analysis & Design | `/se-5-design` | ALL 4 stakeholders approve |
| 6 | Implementation | `/se-6-implementation` | Per-task-group checkpoint |
| 7 | Testing | `/se-7-testing` | Coverage ≥80%, 0 failures |
| 8 | Evaluation | `/se-8-evaluation` | All 3 review rounds pass |
| 9 | Final Approval | `/se-9-approval` | PM → CTO → CEO approve |

**Phase 0 has 3 steps: (A) Exploration Strategy, (B) Codebase Investigation, (C) Report Generation. Phases 1-9 each have 4 sub-steps: (A) Tri-Persona Discussion, (B) Convergence, (C) Deliverable, (D) Approval.**

### Cross-Phase Restart Policy

| Trigger | Restart Phase |
|---------|--------------|
| Phase 5 CEO/CTO rejection | Phase 4 |
| Phase 7 test failure | Phase 6 |
| Phase 8 Code Quality failure | Phase 6 |
| Phase 8 Requirements failure | Phase 4 |
| Phase 9 PM rejection | Phase 8 |
| Phase 9 CTO rejection (impl flaw) | Phase 6 |
| Phase 9 CTO rejection (arch invalid) | Phase 5 |
| Phase 9 CEO REQUIRES_PIVOT | Phase 3 |
| Phase 9 CEO REJECTED | **CANCELLED** |

- Maximum 3 cross-phase restarts (4 total iterations); 5th attempt → human escalation
- Internal phase restarts (Step D → Step A within same phase) are FREE
- Phase 0 is pre-loop and preserved across all restarts

### Phase Skip Policy

| Output Type | Skipped Phases | Rationale |
|-------------|----------------|-----------|
| Code + Tests (default) | None | Full pipeline |
| Documentation only | Phase 7 (Testing) | No code to test |
| Configuration only | Phase 7 (Testing) | No testable logic |

---

## Enterprise Implementation Workflow (EIW)

**For focused implementation tasks where requirements and design are already defined, use EIW as a lightweight shortcut.**

### When EIW Applies

- New features requiring multiple files (with defined requirements)
- Database schema changes (with defined design)
- API endpoint additions (with defined contracts)
- Defect fixes escalated from DRW

### Invocation

| Command | Action |
|---------|--------|
| **`/eiw-review [feature]`** | Runs ALL 8 stages end-to-end |
| `/eiw-stage0` through `/eiw-stage7` | Run individual stages |

### Stage Overview

| Stage | Name | Skill | Gate |
|-------|------|-------|------|
| 0 | Architecture Review | `/eiw-stage0` | UCAR + LAR pass |
| 1 | Task Decomposition | `/eiw-stage1` | Task structure with dependencies |
| 2 | Implementation (TDD) | `/eiw-stage2` | Red-Green-Refactor per task |
| 3 | Checkpoint Review | `/eiw-stage3` | Per-Task-Group verification |
| 4 | Final 3-Round Review | `/eiw-stage4` | Code Quality + Requirements + UX |
| 5 | PM Approval | `/eiw-stage5` | Implementation completeness |
| 6 | CTO Technical Review | `/eiw-stage6` | Architecture, security, scalability |
| 7 | CEO Strategic Approval | `/eiw-stage7` | Business value, strategic alignment |

### Restart Policy

| Trigger | Restart Point |
|---------|---------------|
| Stage 3 Checkpoint failure | Stage 1 |
| Stage 4 any round failure | Stage 1 |
| Stage 5 PM rejection | Stage 1 |
| Stage 6 CTO rejection (impl flaw) | Stage 1 |
| Stage 6 CTO rejection (arch invalid) | **Stage 0** |
| Stage 7 CEO REQUIRES_PIVOT | Stage 1 |
| Stage 7 CEO REJECTED | **CANCELLED** |

- Maximum 3 restarts (4 total iterations); 5th attempt → human escalation

---

## PDCA Self-Improvement Cycle (Autonomous)

**After resolving ANY user-reported error, critical feedback, or expectation mismatch, the PDCA cycle MUST be automatically invoked. This is NOT optional.**

### Trigger Conditions

Automatically invoke `/pdca-cycle` after resolving:
1. **Error Report** — User reports a bug or malfunction
2. **Expectation Mismatch** — Output doesn't match expectations
3. **Improvement Request** — Changes to previously delivered output
4. **Critical Feedback** — Quality or behavior feedback

### Protocol

1. Resolve the issue through the normal pipeline first
2. AUTOMATICALLY invoke `/pdca-cycle` with context
3. Runs fully autonomously — no human intervention
4. Present summary when complete

### Invocation Format

```
/pdca-cycle Trigger: [error_report|expectation_mismatch|improvement_request|critical_feedback]. Error: [description]. Fix: [description]. Files Changed: [list].
```

### PDCA Skills

| Skill | Purpose |
|-------|---------|
| `/pdca-cycle` | Master orchestrator |
| `/pdca-1-incident` | Phase 1: Incident Analysis |
| `/pdca-2-attribution` | Phase 2: Root Process Attribution |
| `/pdca-3-synthesis` | Phase 3: Knowledge Synthesis |
| `/pdca-4-upgrade` | Phase 4: Skill Upgrade Execution |

### Archive

- Location: `.claude/pdca-archive/`
- Every cycle archived with complete record
- Every skill modification includes PDCA cycle ID as traceability comment

---

## Comprehensive Error Remediation

**When discovering and fixing an error, you MUST search for similar errors throughout the entire codebase and fix ALL occurrences.**

### Workflow

1. **Identify the Error Pattern** — Analyze root cause, identify the pattern
2. **Search for Similar Occurrences** — Search the entire codebase
3. **Fix ALL Occurrences** — Complete every instance
4. **Verify Completeness** — Final search to confirm none remain

---

## Test-Driven Development (TDD) Enforcement

**All implementations MUST follow TDD. Writing code without tests first is prohibited for non-trivial changes.**

### TDD Workflow

```
1. RED:     Write a failing test that defines expected behavior
2. GREEN:   Write minimum code to make the test pass
3. REFACTOR: Clean up code while keeping tests green
```

### Test Coverage Requirements

| Metric | Minimum | Target |
|--------|---------|--------|
| Line Coverage | 80% | 90% |
| Branch Coverage | 80% | 85% |
| Function Coverage | 80% | 90% |

### When Tests Are Required

| Change Type | Unit Test | Integration Test | E2E Test |
|-------------|-----------|------------------|----------|
| Utility function | Required | Optional | Optional |
| UI component | Required | Optional | Optional |
| API route | Required | Required | Optional |
| Full feature | Required | Required | Required |
| Bug fix | Regression test | Optional | Optional |
| Refactoring | Existing tests must pass | - | - |

---

## Additional Skills

These skills provide standalone quality tools that can be used independently or composed with the pipelines above:

| Skill | Purpose | When to Use |
|-------|---------|-------------|
| `/ui-forge` | Polished UI implementation | When building or modifying UI components |
| `/ui-audit` | Design compliance review | When evaluating UI against design principles |
| `/site-patrol` | Autonomous web exploration & bug discovery | QA testing of deployed web applications |
| `/chat-patrol` | Autonomous chat testing & fix cycle | QA testing of chat/AI interfaces |
