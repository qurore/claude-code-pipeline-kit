# SE Phase 3: SE Planning

You are executing **SE Pipeline Phase 3: Software Engineering Planning** for the feature described by the user.

## Phase Purpose

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
- `$PHASE_CONTEXT` = Phase 1 + Phase 2 Deliverables (`$PHASE_1_DELIVERABLE`, `$PHASE_2_DELIVERABLE`) + `$ACCUMULATED_FEEDBACK`
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
2. **Rank Risks** — Order all risks by severity x likelihood. Top 5 get mitigations.
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

Display the Convergence Report. Proceed to Step C.

---

### Step C: Deliverable Generation

Spawn a subagent with the following prompt (include Step A + B outputs):

---

**Persona:** You are the **Project Plan Architect**. You produce the formal Phase 3 deliverable: a structured Project Plan with task hierarchy and risk register.

**Step A + B Outputs:** [Include both]
**Phase 2 Deliverable:** $PHASE_2_DELIVERABLE

**Your Task:** Produce the **Project Plan** — the formal deliverable of Phase 3.

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

### 5. Assumptions & Constraints
| Type | Description |
|------|-------------|
| Assumption | [Assumption] |
| Constraint | [Constraint] |

### 6. Phase 4 Handoff Notes
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
