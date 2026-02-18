# EIW Stage 3: Task Group Checkpoint Review

You are executing **EIW Stage 3: Task Group Checkpoint Review** for a completed Task Group.

> **Project Configuration Required:** This workflow uses the following command variables that must be defined in your project's `CLAUDE.md`:
> - `$TEST_CMD` — Run all unit/integration tests (e.g., `npm run test -- --run`, `pytest`, `cargo test`)
> - `$LINT_CMD` — Run linting (e.g., `npm run lint`, `ruff check .`, `cargo clippy`)
> - `$TYPE_CHECK_CMD` — Run type checking (e.g., `npm run type-check`, `mypy .`, `tsc --noEmit`)
> - `$TEST_COVERAGE_CMD` — Run tests with coverage (e.g., `npm run test:coverage`, `pytest --cov`)

## Progress Reporting (MANDATORY)

At stage entry, output:
```
───────────────────────────────────────────────────────
 EIW Stage 3: Checkpoint Review | [Task Group Name]
───────────────────────────────────────────────────────
```

At completion: `  ✓ Stage 3 Checkpoint: PROCEED` or `  ✗ Stage 3 Checkpoint: REWORK REQUIRED → Restart from Stage 1`

---

## Instructions

Spawn a subagent via the **Task tool** with `subagent_type: "general-purpose", model: "opus"` to conduct the checkpoint review. The subagent operates as a **QA Lead** persona.

### Subagent Prompt Template

---

**Persona:** You are the QA Lead conducting a comprehensive checkpoint review for a completed Task Group. You verify technical quality, test coverage, and alignment with the architectural vision. You are thorough and do not let marginal quality pass.

**Feature:** $FEATURE
**Task Group:** $TASK_GROUP_NAME
**Tasks Completed:** $TASK_LIST_WITH_SUMMARIES
**Iteration:** $ITERATION of 4

**Your Task:** Conduct a checkpoint review covering all criteria below.

### Checkpoint Review Steps

1. **Run Aggregated Technical Verification:**
   - `$TYPE_CHECK_CMD` — Type checking / compilation
   - `$LINT_CMD` — Code quality linting
   - `$TEST_CMD` — All unit/integration tests
   - `$TEST_COVERAGE_CMD` — Coverage report (threshold: 80%)

2. **Review UCAR Alignment** — Is the Task Group's output still aligned with user-centric goals?
   - Value Clarity, Interaction Simplicity, Mental Model Alignment
   - Error Recovery, Performance Perception, Accessibility

3. **Review LAR Alignment** — Is architecture integrity maintained?
   - Data Model Integrity, API Contract Consistency, State Management Coherence
   - Error Boundary Coverage, Security Posture, Scalability, Backward Compatibility, Dependencies

### Output Format

```
## 【Task Group Checkpoint Review】$TASK_GROUP_NAME

### Completion Status
| Task | Status | Tests Written |
|------|--------|---------------|
| [Task X.1] | ✅/❌ | [count] |
| [Task X.2] | ✅/❌ | [count] |

### Aggregated Technical Verification
✅/❌ Type check: PASSED/FAILED
✅/❌ Lint: PASSED/FAILED
✅/❌ Unit Tests: PASSED (X/X) / FAILED
✅/❌ Test Coverage: X% (threshold: 80%)

### UCAR Checkpoint
| Criterion | Still Aligned? | Notes |
|-----------|----------------|-------|
[6 criteria rows]

### LAR Checkpoint
| Criterion | Still Aligned? | Notes |
|-----------|----------------|-------|
[8 criteria rows]

### Checkpoint Verdict: ✅ PROCEED / ❌ REWORK REQUIRED

**If REWORK REQUIRED:**
- **Issues Found:** [List specific issues]
- **Recommendation:** RESTART from Stage 1 with feedback
```

---

### After Subagent Returns

1. Display the checkpoint review to the user
2. If ✅ PROCEED → Move to the next Task Group (Stage 2) or Stage 4 if all groups are complete
3. If ❌ REWORK REQUIRED → **RESTART from Stage 1** with accumulated feedback per the Strict Restart Policy
