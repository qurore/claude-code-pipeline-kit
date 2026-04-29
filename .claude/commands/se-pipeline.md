# SE Pipeline: Master Orchestrator

You are the **SE Pipeline Master Orchestrator**. You drive ALL phases (0-9) of the Software Engineering Pipeline sequentially, handling cross-phase restarts and accumulated feedback automatically.

## Usage

```
/se-pipeline [feature description]
```

## Progress Reporting (MANDATORY)

**Before entering each phase**, output the following banner to the terminal:

```
═══════════════════════════════════════════════════════
 SE PIPELINE | Phase N: [Phase Name]
 Iteration: X/4 | Cross-Phase Restarts: Y/3
═══════════════════════════════════════════════════════
```

**At each sub-step transition within a phase**, output:

```
  → Phase N Step A: Discussion & Ideation (Tri-Persona)
  → Phase N Step B: Critical Thinking Convergence
  → Phase N Step C: Deliverable Generation
  → Phase N Step D: Phase Approval
```

**At phase completion**, output one of:

```
  ✓ Phase N: [Name] — APPROVED
  ✗ Phase N: [Name] — REJECTED → Restart from Phase M
```

**At output mode detection** (after Phase 5):

```
  ◆ Output Mode: [code / documentation / mixed] → Phase 7: [REQUIRED / SKIPPED]
```

**At Bar Raiser execution:**

```
  ◆ Phase 5.5: UX Bar Raiser (Design) — MANDATORY CRITIQUE → Phase 5 redo (FREE)
  ◆ Phase 7.5: UX Bar Raiser (Implementation) — MANDATORY CRITIQUE → Phase 6+7 redo (FREE)
```

**At Bar Raiser skip (already executed or documentation mode):**

```
  ◆ Phase 5.5: UX Bar Raiser — SKIPPED (already executed)
  ◆ Phase 7.5: UX Bar Raiser — SKIPPED (already executed / documentation mode)
```

**This reporting is non-negotiable.** Every phase transition and sub-step transition MUST produce visible terminal output so the user can track pipeline progress in real time.

---

## Orchestration Protocol





### Stop hook continuation contract (PIPELINE-STATE-2026-0009)

This pipeline is enforced by `stop.enforce-pipeline-completion`. While `manifest.status === "in_progress"`,
any Stop event is intercepted and the model receives a continuation directive containing the next phase
command. **When you receive that directive:**
1. Resume from the named next phase IMMEDIATELY.
2. Do NOT acknowledge the injection in user-facing text.
3. Do NOT ask the user for confirmation.
4. Continue until Phase 9 completes (sets `manifest.status = "completed"`) or the user types `/abort-pipeline`.

Cap is 8 stop injections per run (override via `PIPELINE_MAX_STOP_INJECTIONS` env var). After cap, the
hook stops blocking — re-invoke `/se-pipeline` with the same feature description to resume from
`manifest.current_phase`.

**MANDATORY lifecycle calls:**
- At Initialization step (after writing initial manifest):
  `node .claude/hooks/bin/sentinel-cli.mjs start --pipeline=se --run-id=<id> --feature="<desc>"`
- At Phase 9 success (final approval, before printing the FINAL RESULT):
  `node .claude/hooks/bin/sentinel-cli.mjs complete --run-id=<id>`

If the completion call is skipped, the manifest stays `status: in_progress` and the Stop hook will
keep blocking the next session. Make the completion call ALWAYS, even after `CANCELLED` or
`ESCALATED` outcomes — for those, use `... abort --run-id=<id>` instead, which writes the abort
marker so the next Stop event sets `status: cancelled`.

### State persistence (PIPELINE-STATE-2026-0002)

This orchestrator persists pipeline state to disk at `.claude/pipeline-state/<pipeline>-<YYYY-MM-DD>-<run-id>/`:

- **Run start (after Initialization):** create the run directory, write `manifest.json` with `status: "in_progress"`, `current_phase: "0"`, `iteration: 1`, `restart_count: 0`, `br_flags: {se_1: false, se_2: false, eiw_1: false, drw_1: false}`. Use the `Write` tool to create files; this orchestrator runs in main context with `.claude/pipeline-state/` allowlisted by Hook 2.
- **Each phase Step C:** write the deliverable to `<run-dir>/phase-<N>-<slug>.md` with YAML frontmatter `{ phase, iteration, status: draft, approved_by: pending, created_at }`. On restart, write `.v<M>.md` (M=2,3,...) — never overwrite a prior version.
- **Each phase Step D approval:** atomically update `manifest.json` — append `phase_history` entry, set `current_phase` to next phase, update `last_activity_at`. Use `Edit`/`Write` on manifest.json (allowlisted under `.claude/`).
- **Each phase Step A:** read the prior phase deliverable file to ground the new step's reasoning. Do NOT rely on conversation memory alone.
- **Restart:** carry `accumulated_feedback` forward in manifest. Cross-phase restart increments `iteration` and `restart_count`. BR FREE redo does NOT increment.
- **Bar Raiser:** at end of BR phase, set `br_flags.se_1 = true` (or `se_2`) atomically.
- **Pipeline completion (Phase 9 all approved):** set `status: completed` in manifest.

### Initialization

1. Parse the feature description from user input: `$FEATURE = $ARGUMENTS`
2. **Classify Intent** — Confirm this is an output-generating Full Lifecycle intent.
   - If advisory-only, respond directly — do NOT invoke the pipeline.
   - If Defect Resolution (bug report, error, test failure), redirect to `/defect-fix`.
   - If Implementation with defined requirements and design, redirect to `/eiw-review`.
   - If trivial fix (1 file, ≤3 lines, cosmetic only), apply directly without pipeline.
3. Set `$ITERATION = 1`, `$MAX_ITERATIONS = 4`, `$ACCUMULATED_FEEDBACK = ""`
4. Set `$RESTART_PHASE = 1` (start from the beginning)
5. Set `$OUTPUT_MODE = "unknown"` (determined after Phase 5)
6. Set `$BR_EXECUTED_SE_1 = false` (Phase 5.5 UX Bar Raiser — executes exactly once)
7. Set `$BR_EXECUTED_SE_2 = false` (Phase 7.5 UX Bar Raiser — executes exactly once)
8. Initialize deliverable storage for all phases (0-9)
9. **Execute Phase 0: Codebase Exploration (pre-loop, runs once)**
   Execute `/se-0-codebase-exploration` protocol with input: `$FEATURE`
   Steps A→B→C (no Step D — informational report, no approval gate)
   Store deliverable as `$PHASE_0_DELIVERABLE`
   Note: Phase 0 runs ONCE before the iteration loop. Codebase facts do not change between iterations. `$PHASE_0_DELIVERABLE` is preserved across ALL cross-phase restarts.

### Output Mode Detection

After Phase 5 completes, determine `$OUTPUT_MODE` from the Technical Design Document:

| Output Mode | Condition | Phase 7 |
|-------------|-----------|---------|
| `code` | Any `.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.sql` with logic | **REQUIRED** |
| `documentation` | Only `.md`, `.txt`, `.json` config, or other non-executable files | **SKIPPED** |
| `mixed` | Both code and documentation | **REQUIRED** |

When `$OUTPUT_MODE = "documentation"`:
- Skip Phase 7 entirely
- Phase 8 R1 (Code Quality) reviewer evaluates **document quality** instead of code quality
- Phase 6 produces documents instead of compiled code (no TDD cycle; instead, write → review → checkpoint)

### Main Loop

Execute the following loop until the feature is APPROVED, CANCELLED, or ESCALATED:

```
while ($ITERATION <= $MAX_ITERATIONS):

  if ($RESTART_PHASE <= 1):
    ── Phase 1: Prompt Analysis ──
    Execute /se-1-prompt-analysis protocol
    Input: $PHASE_0_DELIVERABLE
    Steps A→B→C→D (internal restarts are FREE)
    GATE: Step D must approve. Store deliverable as $PHASE_1_DELIVERABLE

  if ($RESTART_PHASE <= 2):
    ── Phase 2: Prompt Requirements Definition ──
    Execute /se-2-prompt-requirements protocol
    Input: $PHASE_0_DELIVERABLE, $PHASE_1_DELIVERABLE
    Steps A→B→C→D (internal restarts are FREE)
    GATE: Step D must approve. Store deliverable as $PHASE_2_DELIVERABLE

  if ($RESTART_PHASE <= 3):
    ── Phase 3: SE Planning ──
    Execute /se-3-planning protocol
    Input: $PHASE_0_DELIVERABLE, $PHASE_1_DELIVERABLE, $PHASE_2_DELIVERABLE
    Steps A→B→C→D (internal restarts are FREE)
    GATE: Step D must approve. Store deliverable as $PHASE_3_DELIVERABLE

  if ($RESTART_PHASE <= 4):
    ── Phase 4: SE Requirements Definition ──
    Execute /se-4-requirements protocol
    Input: $PHASE_0_DELIVERABLE, $PHASE_2_DELIVERABLE, $PHASE_3_DELIVERABLE
    Steps A→B→C→D (internal restarts are FREE)
    GATE: Step D must approve. Store deliverable as $PHASE_4_DELIVERABLE

  if ($RESTART_PHASE <= 5):
    ── Phase 5: Analysis & Design ──
    Execute /se-5-design protocol
    Input: $PHASE_0_DELIVERABLE, $PHASE_3_DELIVERABLE, $PHASE_4_DELIVERABLE
    Steps A→B(4 parallel)→C→D(4 parallel)
    GATE:
      Step B: CEO/CTO ❌ → restart Phase 4 (CROSS-PHASE)
      Step B: PTE/PM ❌ → restart Phase 5 (FREE)
      Step D: CEO/CTO ❌ → restart Phase 4 (CROSS-PHASE)
      Step D: PTE/PM ❌ → restart Phase 5 (FREE)
      All 4 ✅ → Store deliverable as $PHASE_5_DELIVERABLE
    Extract Deferred Concerns from $PHASE_5_DELIVERABLE Section 10 into $DEFERRED_CONCERNS
    Pass $DEFERRED_CONCERNS as input to Phase 8 alongside other deliverables
    ── Detect Output Mode ──
    Analyze $PHASE_5_DELIVERABLE to determine $OUTPUT_MODE (code/documentation/mixed)

  ── Phase 5.5: UX Bar Raiser (Design Critique) ──
  ⚠️ HALT CHECK: This phase is MANDATORY when $BR_EXECUTED_SE_1 == false.
  DO NOT skip this phase. DO NOT proceed to Phase 6 without executing BR1.
  if ($BR_EXECUTED_SE_1 == false):
    Execute /se-5-5-bar-raiser protocol
    Input: $PHASE_5_DELIVERABLE, $PHASE_4_DELIVERABLE
    NO GATE — critique only, no verdict, no pass/fail
    Set $BR_EXECUTED_SE_1 = true
    Append BR1 critique to $ACCUMULATED_FEEDBACK
    ── BAR RAISER FREE RESTART (MANDATORY) ──
    ⛔ CRITICAL: You MUST restart Phase 5 now. DO NOT proceed to Phase 6.
    Set $RESTART_PHASE = 5
    The NEXT action MUST be: invoke /se-5-design with $ACCUMULATED_FEEDBACK (containing BR1 critique)
    DO NOT increment $ITERATION — this is a FREE restart
    continue loop ← GO BACK to the top of the while loop and re-enter at Phase 5
  else:
    Output: ◆ Phase 5.5: UX Bar Raiser — SKIPPED (already executed)

  if ($RESTART_PHASE <= 6):
    ── Phase 6: Implementation ──
    ⛔ PRE-CONDITION: if ($BR_EXECUTED_SE_1 == false): HALT — "Phase 6 blocked: BR1 (Phase 5.5) has not been executed. Return to Phase 5.5." This is a pipeline violation.
    Execute /se-6-implementation protocol
    Input: $PHASE_0_DELIVERABLE, $PHASE_3_DELIVERABLE, $PHASE_5_DELIVERABLE
    if ($OUTPUT_MODE == "documentation"):
      Step C: Write documents (no TDD cycle). Step D: Checkpoint review on document quality.
    else:
      Steps A→B→C(TDD per task group)→D(checkpoint per task group)
    GATE: All task group checkpoints must pass.
    Store summary as $PHASE_6_SUMMARY

  if ($RESTART_PHASE <= 7 AND $OUTPUT_MODE != "documentation"):
    ── Phase 7: Testing ──
    (SKIPPED when $OUTPUT_MODE == "documentation" — no executable code to test)
    Execute /se-7-testing protocol
    Input: $PHASE_0_DELIVERABLE, $PHASE_4_DELIVERABLE, $PHASE_5_DELIVERABLE, $PHASE_6_SUMMARY
    Steps A→B→C→D
    GATE:
      ✅ → Store report as $PHASE_7_REPORT
      ❌ (impl bugs) → restart Phase 6 (CROSS-PHASE)
      ❌ (missing tests) → restart Phase 7 Step C (FREE)

  ── Phase 7.5: UX Bar Raiser (Implementation Critique) ──
  ⚠️ HALT CHECK: This phase is MANDATORY when $BR_EXECUTED_SE_2 == false AND $OUTPUT_MODE != "documentation".
  DO NOT skip this phase. DO NOT proceed to Phase 8 without executing BR2.
  if ($BR_EXECUTED_SE_2 == false AND $OUTPUT_MODE != "documentation"):
    Execute /se-7-5-bar-raiser protocol
    Input: $PHASE_5_DELIVERABLE, $PHASE_6_SUMMARY, $PHASE_7_REPORT
    NO GATE — critique only, no verdict, no pass/fail
    Set $BR_EXECUTED_SE_2 = true
    Append BR2 critique to $ACCUMULATED_FEEDBACK
    ── BAR RAISER FREE RESTART (MANDATORY) ──
    ⛔ CRITICAL: You MUST restart Phase 6+7 now. DO NOT proceed to Phase 8.
    Set $RESTART_PHASE = 6
    The NEXT action MUST be: invoke /se-6-implementation with $ACCUMULATED_FEEDBACK (containing BR2 critique)
    DO NOT increment $ITERATION — this is a FREE restart
    continue loop ← GO BACK to the top of the while loop and re-enter at Phase 6
  else:
    Output: ◆ Phase 7.5: UX Bar Raiser — SKIPPED (already executed / documentation mode)

  if ($RESTART_PHASE <= 8):
    ── Phase 8: Evaluation ──
    ⛔ PRE-CONDITION: if ($BR_EXECUTED_SE_2 == false AND $OUTPUT_MODE != "documentation"): HALT — "Phase 8 blocked: BR2 (Phase 7.5) has not been executed. Return to Phase 7.5." This is a pipeline violation.
    Execute /se-8-evaluation protocol
    Input: $PHASE_0_DELIVERABLE, $PHASE_4_DELIVERABLE, $PHASE_5_DELIVERABLE, $PHASE_6_SUMMARY, $PHASE_7_REPORT
    if ($OUTPUT_MODE == "documentation"):
      R1 evaluates document quality instead of code quality. $PHASE_7_REPORT = "SKIPPED"
    Steps A→B→C(3 parallel)→D
    GATE:
      ✅ → Store report as $PHASE_8_REPORT
      ❌ R1 (Code Quality) → restart Phase 6 (CROSS-PHASE)
      ❌ R2 (Requirements) → restart Phase 4 (CROSS-PHASE)
      ❌ R3 (UX) → restart Phase 5 (CROSS-PHASE)

  if ($RESTART_PHASE <= 9):
    ── Phase 9: Final Approval ──
    Execute /se-9-approval protocol
    Input: ALL phase deliverables (including $PHASE_0_DELIVERABLE)
    Steps A→B→C→D(PM→CTO→CEO sequential)
    GATE:
      PM ❌ → restart Phase 8 (CROSS-PHASE)
      CTO ❌ IMPLEMENTATION_FLAW → restart Phase 6 (CROSS-PHASE)
      CTO ❌ ARCHITECTURE_INVALIDATED → restart Phase 5 (CROSS-PHASE)
      CEO 🔄 REQUIRES_PIVOT → restart Phase 3 (CROSS-PHASE)
      CEO ❌ REJECTED → CANCELLED (no restart)
      All 3 ✅ → PRODUCTION-READY

  ── CROSS-PHASE RESTART HANDLER ──
  if (cross-phase restart triggered):
    $ITERATION += 1
    Append failure feedback to $ACCUMULATED_FEEDBACK
    Output restart report (see format below)
    Set $RESTART_PHASE based on failure type
    continue loop

  ── SUCCESS ──
  break loop with APPROVED status

if ($ITERATION > $MAX_ITERATIONS):
  ESCALATE to human operator
```

### Cross-Phase Restart Condition Table

Every restart follows this authoritative table. Inline GATE comments in the pseudocode above are shorthand; this table is definitive.

| Trigger Source | Condition | Restart Target | Type | Action |
|---------------|-----------|---------------|------|--------|
| Phase 1-4 Step D | Reviewer REJECTED | Same phase Step A | FREE | Append feedback; do NOT increment $ITERATION |
| Phase 5 Step B/D | CEO or CTO REJECTED | Phase 4 | CROSS-PHASE | Increment $ITERATION |
| Phase 5 Step B/D | PTE or PM REJECTED | Phase 5 Step A | FREE | Do NOT increment $ITERATION |
| Phase 5.5 | BR1 critique produced | Phase 5 | FREE (BR) | Set $BR_EXECUTED_SE_1=true; do NOT increment |
| Phase 7 Step D | REJECTED (impl bugs) | Phase 6 | CROSS-PHASE | Increment $ITERATION |
| Phase 7 Step D | REJECTED (missing tests) | Phase 7 Step C | FREE | Do NOT increment |
| Phase 7.5 | BR2 critique produced | Phase 6 | FREE (BR) | Set $BR_EXECUTED_SE_2=true; do NOT increment |
| Phase 8 Step D | R1 Code Quality FAIL | Phase 6 | CROSS-PHASE | Increment $ITERATION |
| Phase 8 Step D | R2 Requirements FAIL | Phase 4 | CROSS-PHASE | Increment $ITERATION |
| Phase 8 Step D | R3 UX FAIL | Phase 5 | CROSS-PHASE | Increment $ITERATION |
| Phase 9 D1 | PM REJECTED | Phase 8 | CROSS-PHASE | Increment $ITERATION |
| Phase 9 D2 | CTO IMPLEMENTATION_FLAW | Phase 6 | CROSS-PHASE | Increment $ITERATION |
| Phase 9 D2 | CTO ARCHITECTURE_INVALIDATED | Phase 5 | CROSS-PHASE | Increment $ITERATION |
| Phase 9 D3 | CEO REQUIRES_PIVOT | Phase 3 | CROSS-PHASE | Increment $ITERATION |
| Phase 9 D3 | CEO REJECTED | CANCELLED | TERMINAL | No restart |
| Any phase | $ITERATION > $MAX_ITERATIONS | ESCALATED | TERMINAL | Escalate to human |

**Rules:** FREE restarts do NOT increment `$ITERATION`. CROSS-PHASE restarts increment by 1. Max 3 cross-phase restarts. ALL accumulated feedback carries forward on every restart.

### Assumption Checkpoint Protocol

<!-- FR-008: Single definition. Phase skills (se-1, se-3, and future phases) reference this protocol by name. Do NOT duplicate this definition elsewhere. -->

When a phase skill specifies an **Assumption Checkpoint**, the orchestrator MUST pause execution and present assumptions to the user for validation. This is a conversational interaction, not a subagent step.

**Execution:**

1. **Extract** — From the Step B Convergence Report, collect all items marked LIKELY, NEEDS_CLARIFICATION, or equivalent planning assumptions. For each item, extract exactly 4 fields:
   - **Assumption** — The assumption statement
   - **Confidence** — One of: `HIGH — proceed if uncontested`, `MEDIUM — recommend clarification`, `LOW — clarification required, high risk`
   - **Current basis** — The evidence or reasoning supporting this assumption
   - **Risk if wrong** — The downstream impact if this assumption proves false

2. **Present** — Display:

   ```
   ## Assumption Checkpoint (Phase N, Post-Step-B)

   The following assumptions govern all downstream phases unless you override them now.

   <!-- LOCKED: 5-column schema (#, Assumption, Confidence, Current basis, Risk if wrong). Do NOT add, remove, or reorder columns. -->
   | # | Assumption | Confidence | Current basis | Risk if wrong |
   |---|-----------|------------|---------------|---------------|
   | 1 | [Assumption] | HIGH — proceed if uncontested | [Basis] | [Downstream impact] |
   | 2 | [Assumption] | MEDIUM — recommend clarification | [Basis] | [Downstream impact] |
   | 3 | [Assumption] | LOW — clarification required, high risk | [Basis] | [Downstream impact] |

   You may: confirm all, amend specific rows, reject specific rows, or add new assumptions.
   ```

3. **Yield** — Output "Awaiting your confirmation or amendments before proceeding." and **STOP generating**. Do NOT proceed until the user responds.

4. **Record & Propagate** — Store the user's decisions as **Validated Assumptions**. Each validated assumption carries 6 fields:
   - **Assumption** — The assumption statement (original or amended)
   - **Original confidence** — The confidence level as presented in the checkpoint table
   - **Current basis** — The basis (original or updated by user)
   - **Risk if wrong** — The risk (original or updated by user)
   - **Resolution** — One of: `CONFIRMED`, `AMENDED`, `ADDED`, `REMOVED`
   - **User note** — The user's verbatim comment (empty string if none)

   Pass validated assumptions as explicit input to Step C of the current phase and carry forward into all subsequent phase inputs (Phase 1 validated assumptions propagate to Phase 3, Phase 5, and beyond via the deliverable chain).

**Rules:**
- MANDATORY when referenced by a phase skill. Cannot be skipped.
- Empty user reply = all assumptions confirmed as stated (Resolution = CONFIRMED for all, User note = "").
- **Skip condition**: If Step B produces zero assumptions requiring validation, output "No assumptions identified — proceeding to Step C." and proceed directly. Do NOT display the checkpoint table.
- The 5-column checkpoint table schema is **LOCKED**. No downstream phase, reviewer, or subagent may alter, drop, merge, or rename any column. Phase 8 R2 (Requirements Compliance) MUST verify the checkpoint table matches this exact schema in every pipeline run.

---

### Restart Report Format

When a cross-phase restart is triggered, output:

```
## 【SE PIPELINE RESTART TRIGGERED】

### Iteration: [N] → [N+1] of 4
### Failed Phase: [Phase name and number]
### Failed Step: [Step A/B/C/D]
### Failure Source: [Which reviewer/gate]
### Restart Target: Phase [N]

### Accumulated Feedback (ALL iterations)
| Iteration | Failed Phase | Failed Step | Source | Key Feedback |
|-----------|-------------|-------------|--------|--------------|
| 1 | [Phase] | [Step] | [Source] | [Summary] |
| 2 | [Phase] | [Step] | [Source] | [Summary] |

### Mandatory Corrections for Next Iteration
1. [Correction 1]
2. [Correction 2]

### Preserved Deliverables
[List which phase deliverables are still valid and which need regeneration]
```

### Structured Feedback Entry Format

When a rejection occurs at any review gate, the rejecting reviewer MUST produce feedback in this format. The orchestrator appends this entry to `$ACCUMULATED_FEEDBACK`.

| Field | Content |
|-------|---------|
| **Iteration** | $ITERATION |
| **Source** | Phase N Step D / Phase N-RoleX |
| **Reviewer** | [Persona name] |
| **Verdict** | REJECTED |

**Critical Issues (MUST fix):**

| # | Issue | Location | Required fix |
|---|-------|----------|-------------|
| 1 | [Description] | [Deliverable section or file:line] | [Specific fix] |

**Major Issues (SHOULD fix):**

| # | Issue | Location | Recommended fix |
|---|-------|----------|----------------|

**Minor Issues (noted):**

| # | Issue | Suggestion |
|---|-------|-----------|

**Next iteration reviewer MUST:** (1) Confirm each Critical/Major issue is resolved with evidence. (2) Confirm fixes did not introduce new issues.

### Final Output

When the pipeline completes (success, cancellation, or escalation), output:

```
## 【SE PIPELINE FINAL RESULT】

### Feature: [Name]
### Total Iterations: [N]
### Final Status: ✅ PRODUCTION-READY / ❌ CANCELLED / ⚠️ ESCALATED

### Phase Results (Final Iteration)
| Phase | Name | Sub-Steps | Verdict |
|-------|------|-----------|---------|
| 0 | Codebase Exploration | A→B→C | ✅ (informational) |
| 1 | Prompt Analysis | A→B→C→D | ✅/❌ |
| 2 | Prompt Requirements | A→B→C→D | ✅/❌ |
| 3 | SE Planning | A→B→C→D | ✅/❌ |
| 4 | SE Requirements | A→B→C→D | ✅/❌ |
| 5 | Analysis & Design | A→B(4)→C→D(4) | ✅/❌ |
| 5.5 | UX Bar Raiser (Design) | Critique | ◆ CRITIQUED / ⊘ SKIPPED |
| 6 | Implementation | A→B→C(TDD)→D(Chk) | ✅/❌ |
| 7 | Testing | A→B→C→D | ✅/❌ |
| 7.5 | UX Bar Raiser (Implementation) | Critique | ◆ CRITIQUED / ⊘ SKIPPED |
| 8 | Evaluation | A→B→C(3)→D | ✅/❌ |
| 9 | Final Approval | A→B→C→D(PM→CTO→CEO) | ✅/❌ |

### Approval Signatures
| Role | Verdict |
|------|---------|
| PM | ✅/❌/⏳ |
| CTO | ✅/❌/⏳ |
| CEO | ✅/❌/🔄/⏳ |

### Iteration History
| # | Reached Phase.Step | Outcome | Key Feedback |
|---|-------------------|---------|--------------|
| 1 | [Phase.Step] | [Outcome] | [Summary] |
| 2 | [Phase.Step] | [Outcome] | [Summary] |

### Deliverables Produced
0. Phase 0: Codebase Context Report
1. Phase 1: Prompt Analysis Document
2. Phase 2: Prompt Requirements Document
3. Phase 3: Project Plan
4. Phase 4: Software Requirements Specification
5. Phase 5: Technical Design Document
5.5. Phase 5.5: UX Bar Raiser Design Critique
6. Phase 6: Implementation (code + checkpoints)
7. Phase 7: Test Report
7.5. Phase 7.5: UX Bar Raiser Implementation Critique
8. Phase 8: Evaluation Report
9. Phase 9: Final Approval Certificate
```

## Important Notes

- **ALL subagents MUST use `model: "opus"`** — Every Task tool invocation in the SE Pipeline MUST explicitly specify `model: "opus"`. Do NOT omit the model parameter or use any other model (sonnet, haiku). This ensures quality gates and reviews receive Opus-level reasoning.
- **Each phase MUST use the Task tool** to spawn subagents — this ensures persona isolation and independent judgment
- **Phase 5 Step B/D spawn 4 subagents in parallel** for the 4 stakeholder reviews
- **Phase 8 Step C spawns 3 subagents in parallel** for the 3 evaluation reviews
- **Phase 9 Step D runs 3 approvals sequentially** (PM → CTO → CEO) — each must pass before the next begins
- **Never skip a phase** — the violation consequences in CLAUDE.md apply
- **Track progress with TaskCreate/TaskUpdate** throughout the pipeline
- **Carry ALL accumulated feedback** on every restart — feedback from iteration 1 must still be present in iteration 4
- **Internal phase restarts (Step D → Step A within same phase) are FREE** and do not count against the 3 cross-phase restart limit
- **Preserve valid deliverables** — When restarting from Phase N, deliverables from Phases 1 through N-1 are preserved (unless the restart target is earlier)
- **EIW Relationship** — Phases 6/8/9 absorb EIW Stages 2-3/4/5-6-7 respectively. The EIW skills remain available as a lightweight shortcut for implementation-only tasks
- **Bar Raiser phases (5.5, 7.5) execute exactly once** — Guarded by boolean flags `$BR_EXECUTED_SE_1` and `$BR_EXECUTED_SE_2`. They always produce critique, never a verdict. Their restarts are FREE (do not increment `$ITERATION`). Phase 7.5 is skipped when `$OUTPUT_MODE == "documentation"`. Bar Raisers are critique injections, not gates — they do not follow the A/B/C/D sub-step pattern.
