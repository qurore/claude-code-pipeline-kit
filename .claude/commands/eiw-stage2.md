# EIW Stage 2: Implementation with Per-Task TDD Review


<!-- PIPELINE-STATE-2026-0001/0002/0003: write Step C deliverable to .claude/pipeline-state/<run-dir>/phase-<N>-<slug>.md; update manifest at Step D; read prior phase from disk at Step A. See specs/pipeline-state-persistence.md and .claude/pipeline-state/SCHEMA.md. -->
You are executing **EIW Stage 2: Implementation with Per-Task Review (TDD-Enhanced)** for the current Task Group.

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
   - Run `npm run test -- --run` to verify test FAILS
   - A failing test confirms the test is valid

2. **GREEN Phase** — Write minimum code to make the test pass
   - Implement only what's needed to pass the test
   - Run `npm run test -- --run` to verify test PASSES

3. **REFACTOR Phase** — Clean up while keeping tests green
   - Improve code quality, naming, structure
   - Run `npm run test -- --run` to verify tests STILL PASS


4. **Pipeline Data Flow Integrity Testing** (MANDATORY when task involves a multi-stage pipeline or data processing flow)
   - Write at least one integration test that passes **real upstream output** (not mocked) to the stage under test, asserting the downstream result is **semantically valid** — not just structurally correct
   - **Empty collection guard**: If a stage produces or consumes a `Map`, `Array`, `Set`, or similar collection, the test MUST assert the collection is **non-empty** with expected entries after processing real input
   - **Configuration limit validation**: If the implementation uses hardcoded numeric limits (token budgets, timeouts, retry counts, batch sizes), write a test that exercises the limit boundary — confirm the limit is sufficient for representative real-world input
   - **Retry resilience**: If the implementation includes retry loops for external service calls (LLM, API, database), the retry logic MUST include exponential backoff with jitter. Write a test that verifies backoff timing increases between retries
   
   - **LLM prompt-schema contract**: Every prompt paired with `parseJsonFromLLM` MUST include a literal JSON example block with exact field names from the Zod schema. "Return JSON matching FooSchema" without showing the structure is PROHIBITED — LLMs cannot guess unconventional field names from natural language alone
   - Run the integration test: `npm run test -- [test-file]`

5. **Technical Verification** (after each task)
   - Run `npm run type-check`
   - Run `npm run lint`
   - Run tests related to changed files

6. **Micro-Review** — For each completed task, assess:
   - Does this change align with UCAR criteria?
   - Does this change maintain LAR integrity?
   - Any regressions introduced?
   - Test coverage for new code?
   
   - State action invariant testing (MANDATORY when task modifies state managed by a shared handler or persists state to database):
     - **Cross-action persistence:** For every new/modified state variable in a shared handler (e.g., API route with multiple action types), test that the variable is preserved across ALL action types — not just the primary action that writes it.
     - **Session restore fidelity:** For every state variable persisted to DB and restored on load, write a round-trip test (save → reload → verify) confirming restored UI state is behaviorally identical, including derived/synthetic elements (announcement messages, computed views, filtered lists).

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
| State Action Invariants | ✅/❌ |

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


---

## Appendix: Skill and agent references
> Added by ECC integration. These are optional reference resources — they do not modify pipeline gates or approval criteria.
**Skills:**
- `.claude/skills/tdd-guide.md` — TDD workflow: RED-GREEN-REFACTOR, coverage gates. Read at TDD cycle entry.
- `.claude/skills/coding-standards-supplement.md` — Coding standards beyond CLAUDE.md (KISS, DRY, YAGNI, naming, immutability). Read during REFACTOR phase.
- `.claude/skills/verification-loop.md` — 6-phase verification: Build→Types→Lint→Tests→Security→Diff. Read at Technical Verification step.
**Agents:**
- `.claude/agents/tdd-guide.md` — TDD specialist persona. Reference for test quality and coverage enforcement.
**Rules:**
- `.claude/rules/typescript.md` — TypeScript conventions.
- `.claude/rules/common.md` — General coding rules.
**Instincts:**
- `.claude/pdca-archive/instincts.md` — Accumulated operational lessons. Read before starting work.
