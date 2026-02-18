# SE Phase 6: Implementation

You are executing **SE Pipeline Phase 6: Implementation** for the feature described by the user.

> **Configuration Note:** This phase uses `$TEST_CMD`, `$TYPE_CHECK_CMD`, `$LINT_CMD`, `$TEST_COVERAGE_CMD`. Configure these in your project's CLAUDE.md (e.g., `$TEST_CMD = "npm run test"`, `$TYPE_CHECK_CMD = "npm run type-check"`).

## Phase Purpose

Implement the approved Technical Design Document using Test-Driven Development (TDD). This phase absorbs EIW Stages 2 (Implementation) and 3 (Checkpoint Review), executing Red-Green-Refactor per task with checkpoint validation per task group.

## Prerequisites

- Phase 5 Technical Design Document must be APPROVED by all 4 stakeholders

## Progress Reporting (MANDATORY)

Before each sub-step, output a progress line to the terminal:

```
───────────────────────────────────────────────────────
 SE Phase 6: Implementation | Step X: [Step Name]
───────────────────────────────────────────────────────
```

Use these step names:
- `Step A: Discussion & Ideation (Tri-Persona)`
- `Step B: Critical Thinking Convergence`
- `Step C: TDD Implementation — Task Group M/N`
- `Step D: Checkpoint Review — Task Group M/N`

For each TDD task within Step C, output:
```
    ● Task [ID]: [Name] — RED phase
    ● Task [ID]: [Name] — GREEN phase
    ● Task [ID]: [Name] — REFACTOR phase
```

At checkpoint completion, output: `  ✓ Task Group M checkpoint — PASSED`
On rework: `  ✗ Task Group M checkpoint — REWORK → Restarting Task Group (FREE restart)`

---

## Sub-Step Execution Protocol

Execute all 4 sub-steps sequentially. Step C loops per task group with TDD cycles. Step D runs a checkpoint after each task group.

---

### Step A: Discussion & Ideation (Tri-Persona Protocol)

Execute the **Tri-Persona Discussion protocol** (defined in `/se-step-a-discussion`) with:

- `$PHASE_NUMBER` = 6
- `$PHASE_NAME` = "Implementation"
- `$PHASE_CONTEXT` = Phase 3 + Phase 5 Deliverables (`$PHASE_3_DELIVERABLE`, `$PHASE_5_DELIVERABLE`) + `$ACCUMULATED_FEEDBACK`
- `$DISCUSSION_TOPIC` = "What is the optimal task execution order for implementation? Where are the highest risks? What test infrastructure do we need first?"

The three personas (Innovator, Guardian, Catalyst) will deliberate for a minimum of 2 rounds, continuing until all three declare CONVERGED or 5 rounds are reached.

### After Step A Returns

Display the full Tri-Persona Discussion Summary to the user. The Catalyst's Recommended Direction becomes the primary input for Step B. Proceed to Step B.

---

### Step B: Critical Thinking Convergence

Spawn a subagent via the **Task tool** with `subagent_type: "general-purpose", model: "opus"`:

---

**Persona:** You are the **Implementation Convergence Analyst**. You finalize the execution plan, resolving any gaps in the implementation strategy.

**Step A Output:** [Include full Step A output]
**Phase 5 Deliverable:** $PHASE_5_DELIVERABLE

**Your Task:**

1. **Validate Execution Order** — Confirm no missing dependencies. Verify the DAG is valid.
2. **Finalize Test Plan** — For each task, specify the exact test file, test name, and assertion.
3. **Identify Blockers** — Surface any potential blockers (missing types, required migrations, etc.).
4. **Create Task List** — Use TaskCreate to create all tasks with proper dependencies.

**Output Format:**

```
## 【Phase 6B: Implementation Convergence Report】

### Finalized Execution Plan

#### Task Group 1: [Name]
| # | Task | Test File | Test Name | Assertion | Status |
|---|------|-----------|-----------|-----------|--------|
| 1 | [Task] | [file.test.ts] | [test name] | [assertion] | Ready |

### Blockers Identified
| # | Blocker | Mitigation | Status |
|---|---------|------------|--------|
| 1 | [Blocker] | [Mitigation] | Resolved/Pending |

### Tasks Created
[List of TaskCreate IDs]
```

---

### After Step B Returns

Display the Convergence Report. Create all tasks via TaskCreate. Proceed to Step C.

---

### Step C: Implementation (TDD — Per Task Group)

For **each Task Group**, execute the following TDD cycle. This directly follows the EIW Stage 2 protocol.

For each task in the group, spawn a subagent via the **Task tool** with `subagent_type: "general-purpose", model: "opus"`:

---

**Persona:** You are a **Senior Developer**. You implement code using strict Test-Driven Development. You write the minimum code needed to pass tests. You are disciplined and methodical.

**Task:** $CURRENT_TASK
**Technical Design Document:** $PHASE_5_DELIVERABLE
**Test to Write (from Step B):** $TEST_SPECIFICATION

**Accumulated Feedback from Previous Iterations (if any):**
$ACCUMULATED_FEEDBACK

**Your Task — MANDATORY TDD Cycle:**

### RED Phase
1. Write the failing test first. The test MUST fail before you write any implementation.
2. Run the test to confirm it fails: `$TEST_CMD -- [test-file]`
3. Record the failure output.

### GREEN Phase
1. Write the MINIMUM code to make the test pass.
2. Run the test again: `$TEST_CMD -- [test-file]`
3. Confirm the test passes.

### REFACTOR Phase
1. Clean up the code while keeping tests green.
2. Run full verification:
   - `$TYPE_CHECK_CMD`
   - `$LINT_CMD`
   - `$TEST_CMD`
3. **Layer Boundary Contract Testing (MANDATORY for multi-layer features)** — If this task spans multiple architectural layers (e.g., UI → API → Service → Database), write integration tests validating:
   - **UI → API**: Event handlers correctly propagate state to API routes
   - **API → Service**: Schemas match types and database projections (no undefined fields)
   - **Service → External**: Prompts/requests document all schema fields and match expected response structure
   - **API ← Service**: Route handlers correctly extract results from service responses
   - **API → Database**: Database functions return all fields consumed by downstream code
4. Fix any issues.

### Micro-Review
After each task, self-review:
1. Does the implementation match the Technical Design Document?
2. Is the code consistent with existing codebase patterns?
3. Are there any regression risks?
4. Is test coverage adequate?

**Output Format:**

```
## 【Task Implementation: [Task ID]】

### RED Phase
- Test file: [path]
- Test name: [name]
- Failure output: [truncated]

### GREEN Phase
- Files created/modified: [list]
- Test result: ✅ PASS

### REFACTOR Phase
- Changes made: [description]
- Type-check: ✅/❌
- Lint: ✅/❌
- Tests: ✅/❌ ([N] passed, [N] failed)

### Micro-Review
| Criterion | Status | Notes |
|-----------|--------|-------|
| Design alignment | ✅/❌ | [Notes] |
| Pattern consistency | ✅/❌ | [Notes] |
| Regression risk | LOW/MED/HIGH | [Notes] |
| Test coverage | [%] | [Notes] |
```

---

### Step D: Checkpoint Review (Per Task Group)

After each Task Group completes, spawn a subagent via the **Task tool** with `subagent_type: "general-purpose", model: "opus"`:

---

**Persona:** You are the **QA Lead** conducting a checkpoint review. You verify that the task group implementation is correct, complete, and does not introduce regressions. This directly follows the EIW Stage 3 protocol.

**Task Group:** [Group name and tasks completed]
**Implementation Outputs:** [All Step C outputs for this group]
**Technical Design Document:** $PHASE_5_DELIVERABLE

**Your Task:**

1. **Completeness Check** — All tasks in the group are implemented and tested.
2. **Design Alignment** — Implementation matches the Technical Design Document.
3. **Test Coverage** — Run `$TEST_COVERAGE_CMD` and verify adequate coverage for modified files.
4. **Integration Verification** — No broken imports, no type errors, no lint violations.
5. **Regression Check** — Run full test suite to ensure no existing tests broke.

**Output Format:**

```
## 【Phase 6D: Checkpoint Review — [Task Group Name]】

### Verification
| # | Check | Status | Details |
|---|-------|--------|---------|
| 1 | All tasks complete | ✅/❌ | [N]/[N] tasks done |
| 2 | Design alignment | ✅/❌ | [Notes] |
| 3 | Test coverage | ✅/❌ | [Coverage %] |
| 4 | Type-check passes | ✅/❌ | [Output] |
| 5 | Lint passes | ✅/❌ | [Output] |
| 6 | All tests pass | ✅/❌ | [N] passed, [N] failed |

### Checkpoint Verdict: ✅ PASS / ❌ REWORK
**Rationale:** [Explanation]
```

---

### After Step D Returns

1. If ✅ PASS → Move to next Task Group (repeat Step C + D) or proceed to Phase 7 if all groups done.
2. If ❌ REWORK → Restart the failed Task Group from Step C with rework feedback. This is an **internal restart within Phase 6** (FREE, does not count against cross-phase restart limit).

### Phase 6 Completion

Phase 6 is complete when ALL Task Groups have passed their checkpoint reviews. Proceed to Phase 7.
