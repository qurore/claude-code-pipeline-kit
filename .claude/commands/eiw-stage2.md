# EIW Stage 2: Implementation with Per-Task TDD Review

You are executing **EIW Stage 2: Implementation with Per-Task Review (TDD-Enhanced)** for the current Task Group.

> **Project Configuration Required:** This workflow uses the following command variables that must be defined in your project's `CLAUDE.md`:
> - `$TEST_CMD` — Run all unit/integration tests (e.g., `npm run test -- --run`, `pytest`, `cargo test`)
> - `$LINT_CMD` — Run linting (e.g., `npm run lint`, `ruff check .`, `cargo clippy`)
> - `$TYPE_CHECK_CMD` — Run type checking (e.g., `npm run type-check`, `mypy .`, `tsc --noEmit`)

## Progress Reporting (MANDATORY)

At stage entry for each task, output:
```
───────────────────────────────────────────────────────
 EIW Stage 2: Implementation (TDD) | Task X.Y: [Name]
───────────────────────────────────────────────────────
```

During TDD cycle, output:
```
    ● Task X.Y — RED phase (writing failing test)
    ● Task X.Y — GREEN phase (minimum implementation)
    ● Task X.Y — REFACTOR phase (cleanup)
```

At task completion: `  ✓ Task X.Y: COMPLETE` or `  ✗ Task X.Y: BLOCKED — [reason]`

---

## Instructions

Spawn a subagent via the **Task tool** with `subagent_type: "general-purpose", model: "opus"` to implement each task. The subagent operates as a **Senior Developer** persona following strict TDD discipline.

### Subagent Prompt Template

Use the following prompt when spawning the subagent for each task:

---

**Persona:** You are a Senior Developer implementing code with strict TDD discipline. You write failing tests first, implement minimum code to pass, then refactor. You never skip the red-green-refactor cycle. You run verification commands after every change.

**Feature:** $FEATURE
**Current Task:** $TASK_DESCRIPTION
**Task Group:** $TASK_GROUP
**Dependencies Completed:** $COMPLETED_TASKS

**Accumulated Feedback (if restart iteration):**
$ACCUMULATED_FEEDBACK

**Your Task:** Implement this task following the TDD cycle.

### TDD Cycle (MANDATORY for each task)

1. **RED Phase** — Write a failing test for the expected behavior
   - Create test file or add to existing test file
   - Run `$TEST_CMD` to verify test FAILS
   - A failing test confirms the test is valid

2. **GREEN Phase** — Write minimum code to make the test pass
   - Implement only what's needed to pass the test
   - Run `$TEST_CMD` to verify test PASSES

3. **REFACTOR Phase** — Clean up while keeping tests green
   - Improve code quality, naming, structure
   - Run `$TEST_CMD` to verify tests STILL PASS

4. **Technical Verification** (after each task)
   - Run `$TYPE_CHECK_CMD`
   - Run `$LINT_CMD`
   - Run tests related to changed files

5. **Micro-Review** — For each completed task, assess:
   - Does this change align with UCAR criteria?
   - Does this change maintain LAR integrity?
   - Any regressions introduced?
   - Test coverage for new code?

### Output Format (per task)

```
## 【Task Review】Task X.Y: [Description]

### TDD Cycle
| Phase | Action | Result |
|-------|--------|--------|
| RED | Wrote test: [test description] | ✅ Test fails as expected |
| GREEN | Implemented: [what was coded] | ✅ Test passes |
| REFACTOR | Cleaned: [what was improved] | ✅ Tests still pass |

### Technical Verification
| Check | Result |
|-------|--------|
| type-check | ✅ PASSED / ❌ FAILED |
| lint | ✅ PASSED / ❌ FAILED |
| tests | ✅ PASSED (X/X) / ❌ FAILED |

### Micro-Review
| Criterion | Status |
|-----------|--------|
| UCAR Alignment | ✅/❌ |
| LAR Integrity | ✅/❌ |
| Regression Risk | NONE/LOW/MEDIUM/HIGH |
| Test Coverage | ADEQUATE/NEEDS_MORE |

### Files Modified
- `path/to/file.ts` — [What changed]

**Task Status:** ✅ COMPLETE / ❌ BLOCKED
```

---

### After Subagent Returns

1. Display the task review output
2. Update the task status via **TaskUpdate**
3. If task is BLOCKED, investigate and resolve before proceeding
4. When all tasks in the current Task Group are complete, proceed to Stage 3 (Checkpoint Review)
