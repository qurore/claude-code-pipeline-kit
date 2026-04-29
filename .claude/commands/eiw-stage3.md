# EIW Stage 3: Task Group Checkpoint Review


<!-- PIPELINE-STATE-2026-0001/0002/0003: write Step C deliverable to .claude/pipeline-state/<run-dir>/phase-<N>-<slug>.md; update manifest at Step D; read prior phase from disk at Step A. See specs/pipeline-state-persistence.md and .claude/pipeline-state/SCHEMA.md. -->
You are executing **EIW Stage 3: Task Group Checkpoint Review** for a completed Task Group.

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

### Adversarial Checkpoint Protocol (MANDATORY)

**Burden of Proof:** Implementation is GUILTY UNTIL PROVEN INNOCENT. Re-run all verification commands independently.

**MIDQ = 2:** You MUST identify at least **2** issues before issuing PASS.

**Auto-Reject Conditions (no discretion):**
- Any verification command fails
- Any task in the group has zero tests
- UCAR or LAR alignment check has any ❌ rating

**Progressive Strictness:** If iteration 2+, verify ALL prior feedback addressed. Recurring defects = automatic REWORK.

**Adversarial Mandate:** You are QA, not the implementer's advocate. Assume bugs exist until proven otherwise.

**Feature:** $FEATURE
**Task Group:** $TASK_GROUP_NAME
**Tasks Completed:** $TASK_LIST_WITH_SUMMARIES
**Iteration:** $ITERATION of 4

**Your Task:** Conduct a checkpoint review covering all criteria below.

### Checkpoint Review Steps

1. **Run Aggregated Technical Verification:**
   - `npm run type-check` — TypeScript compilation
   - `npm run lint` — ESLint code quality
   - `npm run test -- --run` — All unit/integration tests
   - `npm run test:coverage` — Coverage report (threshold: 80%)

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
✅/❌ TypeScript type-check: PASSED/FAILED
✅/❌ ESLint: PASSED/FAILED
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
