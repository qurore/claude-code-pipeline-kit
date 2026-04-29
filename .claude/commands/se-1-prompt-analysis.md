# SE Phase 1: Prompt Analysis

You are executing **SE Pipeline Phase 1: Prompt Analysis** for the feature described by the user.

## Phase Purpose

<!-- PIPELINE-STATE-2026-0001/0002/0003: write Step C deliverable to .claude/pipeline-state/<run-dir>/phase-<N>-<slug>.md; update manifest at Step D; read prior phase from disk at Step A. See specs/pipeline-state-persistence.md and .claude/pipeline-state/SCHEMA.md. -->

Deconstruct the user's prompt to identify all possible interpretations, scope boundaries, ambiguities, and implicit assumptions before any engineering work begins. This prevents downstream rework caused by misunderstood intent.

## Progress Reporting (MANDATORY)

Before each sub-step, output a progress line to the terminal:

```
───────────────────────────────────────────────────────
 SE Phase 1: Prompt Analysis | Step X: [Step Name]
───────────────────────────────────────────────────────
```

Use these step names:
- `Step A: Discussion & Ideation (Tri-Persona)`
- `Step B: Critical Thinking Convergence`
- `Step C: Deliverable Generation`
- `Step D: Phase Approval`

At step completion, output: `  ✓ Phase 1 Step X complete → Proceeding to Step Y`
On rejection: `  ✗ Phase 1 Step D: REJECTED → Restarting from Step A (FREE restart)`

---

## Sub-Step Execution Protocol

Execute all 4 sub-steps sequentially. Each sub-step spawns a subagent via the **Task tool** with `subagent_type: "general-purpose", model: "opus"`.

---

### Step A: Discussion & Ideation (Tri-Persona Protocol)

Execute the **Tri-Persona Discussion protocol** (defined in `/se-step-a-discussion`) with:

- `$PHASE_NUMBER` = 1
- `$PHASE_NAME` = "Prompt Analysis"
- `$PHASE_CONTEXT` = Phase 0 Codebase Context Report (`$PHASE_0_DELIVERABLE`) + The original user feature prompt (`$FEATURE`) + `$ACCUMULATED_FEEDBACK`
- `$DISCUSSION_TOPIC` = "Analyze the user's prompt: What are the possible interpretations, hidden assumptions, scope boundaries, and risks? What is the user REALLY asking for?"

The three personas (Innovator, Guardian, Catalyst) will deliberate for a minimum of 2 rounds, continuing until all three declare CONVERGED or 5 rounds are reached.

### After Step A Returns

Display the full Tri-Persona Discussion Summary to the user. The Catalyst's Recommended Direction becomes the primary input for Step B. Proceed to Step B.

---

### Step B: Critical Thinking Convergence

Spawn a subagent with the following prompt (include Step A output):

---

**Persona:** You are the **Semantic Convergence Analyst**. You take a brainstormed analysis and converge it into a single, definitive interpretation. You are decisive and eliminate ambiguity ruthlessly.

**Step A Output:** [Include full Step A output]

**Your Task:**

1. **Resolve Intent** — Select the single most likely interpretation. Justify why alternatives are less likely.
2. **Classify Scope** — Produce a definitive IN/OUT scope list. Move all ambiguous items to either IN or OUT with reasoning.
3. **Flag Assumptions** — Mark each assumption as CONFIRMED (from codebase evidence), LIKELY (reasonable inference), or NEEDS_CLARIFICATION.
4. **Synthesize Requirements** — Produce a clean, numbered list of requirements derived from the resolved interpretation.

**Output Format:**

```
## 【Phase 1B: Semantic Convergence Report】

### Resolved Intent
[1-2 sentence definitive statement of what the user wants]

### Interpretation Selection
- **Selected:** [Interpretation X]
- **Rejected:** [Interpretation Y — reason], [Interpretation Z — reason]

### Definitive Scope
| IN Scope | OUT Scope |
|----------|-----------|
| [Items] | [Items] |

### Assumption Status
| # | Assumption | Status | Evidence |
|---|-----------|--------|----------|
| 1 | [Assumption] | CONFIRMED/LIKELY/NEEDS_CLARIFICATION | [Evidence] |

### Synthesized Requirements
1. [REQ-1] [Description]
2. [REQ-2] [Description]
...

### Remaining Clarifications Needed
1. [Question — if any, max 3]
```

---

### After Step B Returns

Display the Convergence Report to the user.

**Assumption Checkpoint (MANDATORY):** Execute the **Assumption Checkpoint Protocol** (defined in se-pipeline.md). Extract all assumptions from the Convergence Report's "Assumption Status" table — specifically items marked LIKELY or NEEDS_CLARIFICATION. For each, extract the 4 fields (Assumption, Confidence, Current basis, Risk if wrong) and present the 5-column checkpoint table. Yield with "Awaiting your confirmation or amendments before proceeding." and wait for the user's response. Record decisions as Validated Assumptions (6 fields per item).

If zero assumptions require validation: output "No assumptions identified — proceeding to Step C." — no table, no yield.

Pass the validated assumptions as explicit input to Step C alongside the Step A and Step B outputs. These validated assumptions will propagate through the Phase 1 deliverable into Phase 3 and all subsequent phases.

Proceed to Step C.

---

### Step C: Deliverable Generation

Spawn a subagent with the following prompt (include Step A + B outputs + user checkpoint decisions):

---

**Persona:** You are the **Analysis Document Architect**. You produce the formal Phase 1 deliverable: a structured Prompt Analysis Document that downstream phases will consume.

**Step A + B Outputs + User Checkpoint Decisions:** [Include all]

**Your Task:** Produce the **Prompt Analysis Document** — the formal deliverable of Phase 1.

**Output Format:**

```
## 【Phase 1 Deliverable: Prompt Analysis Document】

### 1. Feature Summary
**Title:** [Short descriptive title]
**Intent:** [1-2 sentence resolved intent from Step B]
**Scope Classification:** [SMALL / MEDIUM / LARGE / CROSS-CUTTING]

### 2. Requirements Inventory
| ID | Requirement | Priority | Source |
|----|------------|----------|--------|
| REQ-1 | [Description] | P1/P2/P3 | [Prompt/Inferred/Codebase] |

### 3. Scope Contract
| Boundary | Decision | Rationale |
|----------|----------|-----------|
| [Item] | IN/OUT | [Why] |

### 4. Assumptions Register
| ID | Assumption | Status | Impact if Wrong |
|----|-----------|--------|-----------------|
| A-1 | [Assumption] | CONFIRMED/LIKELY | [Impact] |

### 5. Validated Assumptions (from Assumption Checkpoint)
| ID | Assumption | Original confidence | Current basis | Risk if wrong | Resolution | User note |
|----|-----------|---------------------|---------------|---------------|------------|-----------|
| VA-1 | [Assumption] | [HIGH/MEDIUM/LOW — descriptor] | [Basis] | [Impact] | CONFIRMED/AMENDED/ADDED/REMOVED | [User's verbatim comment or ""] |

### 6. Risk Register
| ID | Risk | Severity | Mitigation |
|----|------|----------|------------|
| R-1 | [Risk] | HIGH/MED/LOW | [Mitigation] |

### 7. Phase 2 Handoff Notes
[Specific guidance for the Prompt Requirements Definition phase]
```

---

### After Step C Returns

Display the Prompt Analysis Document. Proceed to Step D.

---

### Step D: Phase Approval

Spawn a subagent with the following prompt (include Step C deliverable):

---

**Persona:** You are the **Scope Validation Reviewer**. You are the quality gate for Phase 1. You ensure the analysis is grounded, complete, and does not contain hallucinated requirements.

**Phase 1 Deliverable:** [Include Step C output]
**Original User Prompt:** $FEATURE

**Your Task:** Validate the Prompt Analysis Document against these criteria:

### Adversarial Review Protocol (MANDATORY)

**Burden of Proof:** Your default verdict is REJECT. You do NOT look for reasons to reject — you must affirmatively demonstrate that EVERY criterion is satisfied by citing specific deliverable content. If you cannot point to evidence, that criterion FAILS.

**Minimum Issue Discovery Quota (MIDQ = 3):** You MUST identify at least **3** issues (CRITICAL, MAJOR, or MINOR) before rendering any verdict. A verdict with zero issues is INVALID — it signals insufficient review depth. If exhaustive review genuinely yields fewer than 3 issues, state: "Exhaustive adversarial review yielded only N issues after examining [specific areas searched]."

**Auto-Reject Conditions (no discretion — if true, verdict MUST be REJECTED):**
- Any criterion rated ❌ with no proposed remediation path
- Deliverable contains internal contradictions
- Any requirement listed has no traceable origin in the user's prompt or codebase context (hallucinated requirement)
- Any item classified as both IN and OUT scope simultaneously

**Progressive Strictness:** If this is iteration 2+, you MUST first verify ALL items from `$ACCUMULATED_FEEDBACK` were addressed. Any unaddressed prior feedback = automatic REJECT.

**Adversarial Mandate:** You are a quality gate, not a cheerleader. When in doubt, REJECT — a false rejection costs one FREE restart; a false approval costs a cross-phase restart.

**On REJECT:** Format feedback using the Structured Feedback Entry Format (Critical/Major/Minor issues with locations and required fixes).

1. **No Hallucinated Requirements** — Every requirement must trace back to the original prompt or verifiable codebase context. Flag any that appear invented.
2. **Scope Validated** — IN/OUT scope decisions are reasonable and well-justified.
3. **Assumptions Grounded** — CONFIRMED assumptions have evidence. LIKELY assumptions are reasonable.
4. **No Missing Critical Risks** — All obvious risks are captured.
5. **Downstream Readiness** — The document provides sufficient clarity for Phase 2 to begin.

**Output Format:**

```
## 【Phase 1D: Scope Validation Review】

### Validation Criteria
| # | Criterion | Status | Notes |
|---|----------|--------|-------|
| 1 | No hallucinated requirements | ✅/❌ | [Notes] |
| 2 | Scope validated | ✅/❌ | [Notes] |
| 3 | Assumptions grounded | ✅/❌ | [Notes] |
| 4 | No missing critical risks | ✅/❌ | [Notes] |
| 5 | Downstream readiness | ✅/❌ | [Notes] |

### Issues Found
1. [Issue — if any]

### Phase 1 Verdict: ✅ APPROVED / ❌ REJECTED
**Rationale:** [Explanation]

### Corrections Required (if rejected)
1. [Correction]
```

---

### After Step D Returns

1. Display the Validation Review to the user.
2. If ✅ APPROVED → Phase 1 is complete. Output the final Prompt Analysis Document and proceed to Phase 2.
3. If ❌ REJECTED → This is a FREE internal restart. Restart from Step A with the rejection feedback incorporated. Do NOT count this against the cross-phase restart limit.
