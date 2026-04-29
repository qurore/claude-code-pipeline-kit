# SE Phase 6: Implementation

You are executing **SE Pipeline Phase 6: Implementation** for the feature described by the user.

## Phase Purpose

<!-- PIPELINE-STATE-2026-0001/0002/0003: write Step C deliverable to .claude/pipeline-state/<run-dir>/phase-<N>-<slug>.md; update manifest at Step D; read prior phase from disk at Step A. See specs/pipeline-state-persistence.md and .claude/pipeline-state/SCHEMA.md. -->

Implement the approved Technical Design Document using Test-Driven Development (TDD). This phase absorbs EIW Stages 2 (Implementation) and 3 (Checkpoint Review), executing Red-Green-Refactor per task with checkpoint validation per task group.

## Prerequisites

- Phase 5 Technical Design Document must be APPROVED by all 4 stakeholders


### ⛔ BR1 Redo Guard (Mandatory Check)

**Before executing this phase, verify the following:**

If `$BR_EXECUTED_SE_1 == true`, then Phase 5 (`/se-5-design`) MUST have been re-executed AFTER the BR1 critique was appended to `$ACCUMULATED_FEEDBACK`. Specifically:
- The `$PHASE_5_DELIVERABLE` must be a **post-BR1 version** (i.e., produced AFTER the BR1 critique, not the original pre-critique version)
- The `$ACCUMULATED_FEEDBACK` containing BR1 critique must have been provided as input to the Phase 5 redo

**If this condition is NOT met (BR1 was executed but Phase 5 was NOT redone), this is a PIPELINE VIOLATION. STOP execution and instruct the orchestrator to restart Phase 5 first.**

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
- `$PHASE_CONTEXT` = Phase 0 Codebase Context Report (`$PHASE_0_DELIVERABLE`) + Phase 3 + Phase 5 Deliverables (`$PHASE_3_DELIVERABLE`, `$PHASE_5_DELIVERABLE`) + `$ACCUMULATED_FEEDBACK`
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
2. Run the test to confirm it fails: `npm run test -- [test-file]`
3. Record the failure output.

### GREEN Phase
1. Write the MINIMUM code to make the test pass.
2. Run the test again: `npm run test -- [test-file]`
3. Confirm the test passes.

### REFACTOR Phase
1. Clean up the code while keeping tests green.
2. Run full verification:
   - `npm run type-check`
   - `npm run lint`
   - `npm run test`

3. **Layer Boundary Contract Testing (MANDATORY for multi-layer features)** — If this task spans multiple architectural layers (React → API → your state-machine framework → LLM → Database), write integration tests validating:
   - **React → API**: Event handlers correctly propagate state (explicit intent, user inputs) to API routes
   - **API → your state-machine framework**: Tool schemas match TypeScript types and SQL projections (no undefined fields)
   - **your state-machine framework → LLM**: Every prompt paired with `parseJsonFromLLM` MUST include a literal JSON example block showing exact field names from the Zod schema. "Return JSON matching FooSchema" without showing the structure is PROHIBITED — the LLM cannot guess unconventional field names (e.g., `asA`, `iWant`, `soThat`) from natural language alone. 
   - **API ← your state-machine framework**: Route handlers extract only new messages from graph results (not stale history)
   
   - **API → Database**: (a) *Query construction verification* — every database client call (`.from("table")`, `.select("columns")`, `.insert()`, `.update()`) MUST target tables and columns that exist in the actual database schema; write a test asserting the query executes without PostgREST schema errors (`relation does not exist`, `column X not found`, HTTP 400/404 from database client). When uncertain, verify table/column names against migration files in `migrations/`. (b) *Output completeness* — SQL functions and queries return all fields consumed by downstream code.
4. Fix any issues.

### Micro-Review
After each task, self-review:
1. Does the implementation match the Technical Design Document?
2. Is the code consistent with existing codebase patterns?
3. Are there any regression risks?

   - **Superseded guards:** If this task replaces or upgrades an existing capability, verify that constants, thresholds, conditionals, and routing guards that existed to protect against limitations of the old implementation have been removed or updated. A stale guard that short-circuits the new implementation is a regression.
4. Is test coverage adequate?

5. Boundary & compliance verification:
   - **Trust boundaries:** No server action accepts client-provided data for authorization decisions (e.g., `isOAuthUser`, `isAdmin`). Auth state MUST be derived server-side from `getUser()` or equivalent.
   - **Server/client boundaries:** All functions called from `"use client"` components that use server-only APIs (`cookies()`, server database client) are in files with `"use server"` directive. No server-only imports leak into client bundles.
   - **CLAUDE.md UI compliance:** Button labels are stable across loading states (no text swap), text follows sentence-case rule, text color hierarchy is correct, no redundant UI copy.

6. Type-definition integrity & data safety:
   - **No type erasure:** Do not cast a well-typed value to `unknown`, `any`, or `Record<string, unknown>` when the existing type already provides the needed fields. Access typed properties directly.
   - **No validation list duplication:** Runtime validation arrays (e.g., allowed values lists) MUST be derived from the authoritative TypeScript type, union, or enum — not hardcoded as a separate constant that restates the same values.
   - **No SDK internal coupling:** When consuming a third-party SDK (your streaming SDK, your payment provider, database client, etc.), use the SDK's public typed API. Do NOT manually parse internal wire formats, protocol prefixes, or undocumented response structures.
   - **Atomic DB operations:** Read-then-write sequences (SELECT then UPDATE) vulnerable to concurrent access MUST use a transaction, conditional WHERE clause, or upsert. A bare SELECT followed by an unconditional UPDATE is prohibited where concurrent access is plausible.
   
   - **Timezone-safe Date construction:** `new Date(year, month, day)` creates a local-timezone midnight that shifts when serialized to UTC via `.toISOString()` or JSON stringification. For ANY Date value passed to a database query, database client RPC, or API request body, use `new Date(Date.UTC(year, month, day))` (or construct from an ISO 8601 string like `\`${year}-${month}-${day}T00:00:00Z\``). `new Date(year, month, day)` is NEVER safe for database-bound dates.
   - **Cross-layer enum synchronization:** When a TypeScript enum, union type, or Zod schema defines the allowed values for a database column guarded by a CHECK constraint or PostgreSQL ENUM type, adding or removing a value in TypeScript REQUIRES a corresponding database migration (`ALTER TABLE` or `ALTER TYPE` statements). A TypeScript-only change is incomplete and MUST be flagged.

7. Exhaustive pattern replacement sweep:
   - **When a task replaces a code pattern** (e.g., replacing `owner_id !== user.id` with `enforceProjectPermission()`, or replacing a deprecated API call with a new one), after completing the implementation, grep the ENTIRE codebase for ALL remaining instances of the old pattern.
   - Every remaining instance MUST be either: (a) fixed in this task group, or (b) explicitly documented as intentionally kept with justification (e.g., test mocks, type definitions, comments).
   - A task that replaces a pattern in 5 files while 28 files still use the old pattern is an INCOMPLETE implementation, regardless of what the design document enumerated.

8. State action invariant testing:
   - **Cross-action persistence:** For every new or modified state variable managed by a shared handler (e.g., an API route that handles multiple action types via a discriminator field), write a test for EACH action type confirming the variable is preserved. If the handler has N action branches, test state persistence across all N — not just the primary action that writes the variable.
   - **Session restore fidelity:** For every state variable persisted to the database and restored on page load (or session reconnect), write a round-trip test: save state → simulate reload (re-fetch from DB) → verify the restored UI/application state is behaviorally identical to pre-save state. This includes verifying that derived/synthetic UI elements (e.g., announcement messages, computed badges, filtered views) reconstruct correctly from the persisted data.

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
| Boundary & compliance | ✅/❌ | [Trust: ✅/❌ | Server/Client: ✅/❌ | CLAUDE.md: ✅/❌] |
| Type-definition integrity | ✅/❌ | [Erasure: ✅/❌ | Duplication: ✅/❌ | SDK coupling: ✅/❌ | Atomicity: ✅/❌ | TZ-safe dates: ✅/❌ | Enum sync: ✅/❌] |
| Pattern replacement sweep | ✅/❌/N/A | [Old pattern: `X` | Remaining: 0 | Grep confirmed: ✅/❌] |
| State action invariants | ✅/❌ | [Cross-action: ✅/❌ | Session restore: ✅/❌] |
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

### Adversarial Checkpoint Protocol (MANDATORY)

**Burden of Proof:** Implementation is GUILTY UNTIL PROVEN INNOCENT. Re-run ALL verification commands independently — do not trust the implementer's self-reported results.

**MIDQ = 2:** You MUST identify at least **2** issues (CRITICAL, MAJOR, or MINOR) before issuing PASS. If exhaustive review yields fewer, state what areas you examined.

**Auto-Reject Conditions (no discretion):**
- Any verification command (type-check, lint, build, test) fails
- Any task in the group has zero tests
- Implementation deviates from Technical Design Document without documented justification

**Progressive Strictness:** If iteration 2+, verify ALL prior feedback from `$ACCUMULATED_FEEDBACK` was addressed. Recurring defects from previous checkpoints = automatic REWORK.

**Adversarial Mandate:** You are QA, not the implementer's advocate. Assume bugs exist until proven otherwise.

1. **Completeness Check** — All tasks in the group are implemented and tested.
2. **Design Alignment** — Implementation matches the Technical Design Document.
3. **Test Coverage** — Run `npm run test:coverage` and verify ≥80% for modified files.
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
| 7 | MCP visual evidence | ✅/SKIPPED | NON-BLOCKING: SKIPPED is a valid pass. See `specs/e2e-testing-conventions.md` §Graceful Degradation |

### Checkpoint Verdict: ✅ PASS / ❌ REWORK
**Rationale:** [Explanation]
```

> **Evidence Cleanup:** Before generating new evidence, delete `evidence/` from any previous iteration to ensure stateless execution. See `specs/e2e-testing-conventions.md` §Evidence Lifecycle.

---

### After Step D Returns

1. If ✅ PASS → Move to next Task Group (repeat Step C + D) or proceed to Phase 7 if all groups done.
2. If ❌ REWORK → Restart the failed Task Group from Step C with rework feedback. This is an **internal restart within Phase 6** (FREE, does not count against cross-phase restart limit).

### Phase 6 Completion

Phase 6 is complete when ALL Task Groups have passed their checkpoint reviews. Proceed to Phase 7.


---

## Appendix: Skill and agent references
> Added by ECC integration. These are optional reference resources — they do not modify pipeline gates or approval criteria.
**Skills:**
- `.claude/skills/tdd-guide.md` — TDD workflow: RED-GREEN-REFACTOR, coverage gates. Read at Step C (TDD implementation).
- `.claude/skills/verification-loop.md` — 6-phase verification: Build→Types→Lint→Tests→Security→Diff. Read at Step C Technical Verification and Step D Checkpoint.
- `.claude/skills/coding-standards-supplement.md` — Coding standards beyond CLAUDE.md (KISS, DRY, YAGNI, naming, immutability). Read during REFACTOR phase.
**Agents:**
- `.claude/agents/tdd-guide.md` — TDD specialist persona. Reference for test quality and coverage enforcement.
- `.claude/agents/architect.md` — Principal architect persona. Reference for Step A/B design decisions.
- `.claude/agents/build-error-resolver.md` — Build error specialist. Reference for build failures during Step C/D.
**Rules:**
- `.claude/rules/typescript.md` — TypeScript conventions.
- `.claude/rules/common.md` — General coding rules.
**Instincts:**
- `.claude/pdca-archive/instincts.md` — Accumulated operational lessons. Read before starting work.
