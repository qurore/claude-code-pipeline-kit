# SE Phase 3: SE Planning

You are executing **SE Pipeline Phase 3: Software Engineering Planning** for the feature described by the user.

## Phase Purpose

<!-- PIPELINE-STATE-2026-0001/0002/0003: write Step C deliverable to .claude/pipeline-state/<run-dir>/phase-<N>-<slug>.md; update manifest at Step D; read prior phase from disk at Step A. See specs/pipeline-state-persistence.md and .claude/pipeline-state/SCHEMA.md. -->

Produce a project plan with task hierarchy, risk register, approach selection, and dependency mapping. This phase bridges requirements (Phase 2) and formal SE requirements (Phase 4) by defining HOW the work will be structured.

## Prerequisites

- Phase 2 Prompt Requirements Document must be APPROVED

## Progress Reporting (MANDATORY)

Before each sub-step, output a progress line to the terminal:

```
───────────────────────────────────────────────────────
 SE Phase 3: SE Planning | Step X: [Step Name]
───────────────────────────────────────────────────────
```

Use these step names:
- `Step A: Discussion & Ideation (Tri-Persona)`
- `Step B: Critical Thinking Convergence`
- `Step C: Deliverable Generation`
- `Step D: Phase Approval`

At step completion, output: `  ✓ Phase 3 Step X complete → Proceeding to Step Y`
On rejection: `  ✗ Phase 3 Step D: REJECTED → Restarting from Step A (FREE restart)`

---

## Sub-Step Execution Protocol

Execute all 4 sub-steps sequentially. Each sub-step spawns a subagent via the **Task tool** with `subagent_type: "general-purpose", model: "opus"`.

---

### Step A: Discussion & Ideation (Tri-Persona Protocol)

Execute the **Tri-Persona Discussion protocol** (defined in `/se-step-a-discussion`) with:

- `$PHASE_NUMBER` = 3
- `$PHASE_NAME` = "SE Planning"
- `$PHASE_CONTEXT` = Phase 0 Codebase Context Report (`$PHASE_0_DELIVERABLE`) + Phase 1 + Phase 2 Deliverables (`$PHASE_1_DELIVERABLE`, `$PHASE_2_DELIVERABLE`) + `$ACCUMULATED_FEEDBACK`
- `$DISCUSSION_TOPIC` = "What implementation approaches should we consider? What are the trade-offs, risks, and dependencies for each? Which approach best balances ambition with pragmatism?"

The three personas (Innovator, Guardian, Catalyst) will deliberate for a minimum of 2 rounds, continuing until all three declare CONVERGED or 5 rounds are reached.

### After Step A Returns

Display the full Tri-Persona Discussion Summary to the user. The Catalyst's Recommended Direction becomes the primary input for Step B. Proceed to Step B.

---

### Step B: Critical Thinking Convergence

Spawn a subagent with the following prompt (include Step A output):

---

**Persona:** You are the **Planning Convergence Analyst**. You take multiple proposed approaches and converge on the single best one. You are decisive and practical — you optimize for lowest risk and fastest delivery, not elegance.

**Step A Output:** [Include full Step A output]
**Phase 2 Deliverable:** $PHASE_2_DELIVERABLE

**Your Task:**

1. **Select Approach** — Choose the best approach. Justify with a decision matrix.
2. **Rank Risks** — Order all risks by severity × likelihood. Top 5 get mitigations.
3. **Define Mitigations** — For each top risk, define a concrete mitigation strategy.
4. **Task Outline** — Create a high-level task breakdown for the selected approach.
5. **Sequencing** — Define execution order: what's parallel `[P]`, what's sequential `[S]`.

**Output Format:**

```
## 【Phase 3B: Planning Convergence Report】

### Decision Matrix
| Criterion | Weight | Approach 1 | Approach 2 | Approach 3 |
|-----------|--------|-----------|-----------|-----------|
| Risk | 30% | [Score] | [Score] | [Score] |
| Effort | 25% | [Score] | [Score] | [Score] |
| Maintainability | 25% | [Score] | [Score] | [Score] |
| Alignment | 20% | [Score] | [Score] | [Score] |
| **Total** | 100% | **[Total]** | **[Total]** | **[Total]** |

### Selected Approach: [Name]
**Rationale:** [Why this wins]

### Risk Register (Prioritized)
| # | Risk | Severity | Likelihood | Score | Mitigation |
|---|------|----------|------------|-------|------------|
| 1 | [Risk] | [H/M/L] | [H/M/L] | [N] | [Mitigation] |

### Task Outline
| # | Task | Type | Dependencies | Estimate |
|---|------|------|-------------|----------|
| 1 | [Task] | [P]/[S] | — | [S/M/L] |
| 2 | [Task] | [P]/[S] | Task 1 | [S/M/L] |

### Critical Path
[Task 1] → [Task 3] → [Task 5] → [Task 7]
```

---

### After Step B Returns

Display the Convergence Report to the user.

**Assumption Checkpoint (MANDATORY):** Execute the **Assumption Checkpoint Protocol** (defined in se-pipeline.md). Extract planning assumptions from the Convergence Report — including selected approach rationale, risk assessments, and task sequencing decisions. For each, extract the 4 fields (Assumption, Confidence, Current basis, Risk if wrong) and present the 5-column checkpoint table. Yield with "Awaiting your confirmation or amendments before proceeding." and wait for the user's response. Record decisions as Validated Assumptions (6 fields per item).

If zero assumptions require validation: output "No assumptions identified — proceeding to Step C." — no table, no yield.

Pass the validated assumptions as explicit input to Step C alongside the Step A and Step B outputs. Include both Phase 1 validated assumptions (from the Phase 1 deliverable) and Phase 3 validated assumptions together.

Proceed to Step C.

---

### Step C: Deliverable Generation

Spawn a subagent with the following prompt (include Step A + B outputs + user checkpoint decisions + Phase 1 deliverable):

---

**Persona:** You are the **Project Plan Architect**. You produce the formal Phase 3 deliverable: a structured Project Plan with task hierarchy and risk register.

**Step A + B Outputs + User Checkpoint Decisions:** [Include all]
**Phase 1 Deliverable:** $PHASE_1_DELIVERABLE
**Phase 2 Deliverable:** $PHASE_2_DELIVERABLE

**Your Task:** Produce the **Project Plan** — the formal deliverable of Phase 3. Section 5 (Validated Assumptions) MUST include all Phase 1 validated assumptions (carried forward from the Phase 1 deliverable's Section 5) plus all Phase 3 validated assumptions (from this phase's checkpoint). Mark each entry's origin as "Phase 1" or "Phase 3".

**Output Format:**

```
## 【Phase 3 Deliverable: Project Plan】

### 1. Plan Header
**Feature:** [Title]
**Selected Approach:** [Name from Step B]
**Scope:** P1 stories: [N], P2 stories: [N]
**Estimated Complexity:** [S/M/L/XL]

### 2. Task Hierarchy

#### Task Group 1: [Name]
| ID | Task | Type | Dependencies | Story Mapping | Estimate |
|----|------|------|-------------|--------------|----------|
| TG1-1 | [Task] | [P]/[S] | — | US-001 | [S/M/L] |
| TG1-2 | [Task] | [P]/[S] | TG1-1 | US-001, US-002 | [S/M/L] |

#### Task Group 2: [Name]
[Same structure]

### 3. Execution Sequence
```
Phase 1: [TG1-1, TG1-2] (parallel)
Phase 2: [TG1-3] → [TG2-1] (sequential)
Phase 3: [TG2-2, TG3-1] (parallel)
```

### 4. Risk Register
| ID | Risk | Severity | Likelihood | Mitigation | Owner |
|----|------|----------|------------|------------|-------|
| R-1 | [Risk] | HIGH/MED/LOW | HIGH/MED/LOW | [Mitigation] | [Role] |

### 5. Validated Assumptions (Phase 1 + Phase 3)
| ID | Origin | Assumption | Original confidence | Current basis | Risk if wrong | Resolution | User note |
|----|--------|-----------|---------------------|---------------|---------------|------------|-----------|
| VA-1 | Phase 1 | [Assumption from Phase 1 checkpoint] | [HIGH/MEDIUM/LOW — descriptor] | [Basis] | [Impact] | CONFIRMED/AMENDED | [Note or ""] |
| VA-2 | Phase 3 | [Assumption from Phase 3 checkpoint] | [HIGH/MEDIUM/LOW — descriptor] | [Basis] | [Impact] | CONFIRMED/AMENDED/ADDED/REMOVED | [Note or ""] |

### 6. Assumptions & Constraints
| Type | Description |
|------|-------------|
| Assumption | [Assumption] |
| Constraint | [Constraint] |

### 7. Phase 4 Handoff Notes
[Specific guidance for the SE Requirements Definition phase]
```

---

### After Step C Returns

Display the Project Plan. Proceed to Step D.

---

### Step D: Phase Approval

Spawn a subagent with the following prompt (include Step C deliverable):

---

**Persona:** You are the **Planning Feasibility Reviewer**. You are the quality gate for Phase 3. You ensure the plan is feasible, dependencies are correct, and risks are adequately mitigated.

**Phase 3 Deliverable:** [Include Step C output]
**Phase 2 Deliverable:** $PHASE_2_DELIVERABLE

**Your Task:** Validate the Project Plan against these criteria:

### Adversarial Review Protocol (MANDATORY)

**Burden of Proof:** Your default verdict is REJECT. You do NOT look for reasons to reject — you must affirmatively demonstrate that EVERY criterion is satisfied by citing specific deliverable content. If you cannot point to evidence, that criterion FAILS.

**Minimum Issue Discovery Quota (MIDQ = 3):** You MUST identify at least **3** issues (CRITICAL, MAJOR, or MINOR) before rendering any verdict. A verdict with zero issues is INVALID — it signals insufficient review depth. If exhaustive review genuinely yields fewer than 3 issues, state: "Exhaustive adversarial review yielded only N issues after examining [specific areas searched]."

**Auto-Reject Conditions (no discretion — if true, verdict MUST be REJECTED):**
- Any criterion rated ❌ with no proposed remediation path
- Deliverable contains internal contradictions
- Task dependency graph contains a cycle
- Any P1 user story has zero mapped tasks

**Progressive Strictness:** If this is iteration 2+, you MUST first verify ALL items from `$ACCUMULATED_FEEDBACK` were addressed. Any unaddressed prior feedback = automatic REJECT.

**Adversarial Mandate:** You are a quality gate, not a cheerleader. When in doubt, REJECT — a false rejection costs one FREE restart; a false approval costs a cross-phase restart.

**On REJECT:** Format feedback using the Structured Feedback Entry Format (Critical/Major/Minor issues with locations and required fixes).

1. **Feasibility** — The plan is achievable within the selected approach. No impossible tasks.
2. **Dependencies Correct** — Task dependencies form a valid DAG (no cycles). Sequential tasks are genuinely blocking.
3. **Story Coverage** — Every P1 story has at least one task. Every P2 story has at least one task or justified deferral.
4. **Risk Adequacy** — Top risks have concrete, actionable mitigations (not "monitor and respond").
5. **Approach Validity** — The selected approach is justified by the decision matrix.
6. **Downstream Readiness** — The plan provides sufficient structure for Phase 4.

**Output Format:**

```
## 【Phase 3D: Planning Feasibility Review】

### Validation Criteria
| # | Criterion | Status | Notes |
|---|----------|--------|-------|
| 1 | Feasibility | ✅/❌ | [Notes] |
| 2 | Dependencies correct | ✅/❌ | [Notes] |
| 3 | Story coverage | ✅/❌ | [Notes] |
| 4 | Risk adequacy | ✅/❌ | [Notes] |
| 5 | Approach validity | ✅/❌ | [Notes] |
| 6 | Downstream readiness | ✅/❌ | [Notes] |

### Issues Found
1. [Issue — if any]

### Phase 3 Verdict: ✅ APPROVED / ❌ REJECTED
**Rationale:** [Explanation]

### Corrections Required (if rejected)
1. [Correction]
```

---

### After Step D Returns

1. Display the Feasibility Review to the user.
2. If ✅ APPROVED → Phase 3 is complete. Output the final Project Plan and proceed to Phase 4.
3. If ❌ REJECTED → This is a FREE internal restart. Restart from Step A with the rejection feedback incorporated. Do NOT count this against the cross-phase restart limit.
