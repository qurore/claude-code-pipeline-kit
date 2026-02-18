# SE Phase 8: Evaluation

You are executing **SE Pipeline Phase 8: Evaluation** for the feature described by the user.

> **Configuration Note:** This phase uses `$TYPE_CHECK_CMD`, `$LINT_CMD`, `$BUILD_CMD`, `$TEST_CMD`, `$TEST_COVERAGE_CMD`. Configure these in your project's CLAUDE.md.

## Phase Purpose

Conduct a comprehensive multi-perspective evaluation of the completed implementation. This phase absorbs EIW Stage 4 (Final 3-Round Review), running 3 parallel evaluation subagents for Code Quality, Requirements Compliance, and UX Architecture.

## Prerequisites

- Phase 7 Testing must be APPROVED (all quality gates passed)

## Progress Reporting (MANDATORY)

Before each sub-step, output a progress line to the terminal:

```
───────────────────────────────────────────────────────
 SE Phase 8: Evaluation | Step X: [Step Name]
───────────────────────────────────────────────────────
```

Use these step names:
- `Step A: Discussion & Ideation (Tri-Persona)`
- `Step B: Evaluation Convergence`
- `Step C: 3 Parallel Reviews (R1: Code Quality, R2: Requirements, R3: UX)`
- `Step D: Evaluation Gate`

At step completion, output: `  ✓ Phase 8 Step X complete → Proceeding to Step Y`
On rejection: `  ✗ Phase 8: REJECTED (RN) → Restart from Phase M`

---

## Sub-Step Execution Protocol

Execute all 4 sub-steps sequentially. Step C spawns **3 parallel subagents**.

---

### Step A: Discussion & Ideation (Tri-Persona Protocol)

Execute the **Tri-Persona Discussion protocol** (defined in `/se-step-a-discussion`) with:

- `$PHASE_NUMBER` = 8
- `$PHASE_NAME` = "Evaluation"
- `$PHASE_CONTEXT` = Phase 4 + Phase 5 + Phase 6 + Phase 7 Deliverables (`$PHASE_4_DELIVERABLE`, `$PHASE_5_DELIVERABLE`, `$PHASE_6_SUMMARY`, `$PHASE_7_REPORT`) + `$ACCUMULATED_FEEDBACK`
- `$DISCUSSION_TOPIC` = "What aspects of code quality, requirements compliance, and UX architecture need the closest scrutiny? Where are we most likely to have blind spots?"

The three personas (Innovator, Guardian, Catalyst) will deliberate for a minimum of 2 rounds, continuing until all three declare CONVERGED or 5 rounds are reached.

### After Step A Returns

Display the full Tri-Persona Discussion Summary to the user. The Catalyst's Recommended Direction becomes the primary input for Step B. Proceed to Step B.

---

### Step B: Critical Thinking Convergence

Spawn a subagent via the **Task tool** with `subagent_type: "general-purpose", model: "opus"`:

---

**Persona:** You are the **Evaluation Convergence Analyst**. You finalize the assessment framework and ensure each of the 3 parallel reviewers has clear, non-overlapping scope.

**Step A Output:** [Include full Step A output]

**Your Task:**

1. **Scope Assignment** — Clearly define what each of the 3 reviewers should examine. Minimize overlap.
2. **Evaluation Criteria** — For each reviewer, define the specific criteria and their weights.
3. **Pass/Fail Thresholds** — Define what constitutes PASS vs FAIL for each reviewer.

**Output Format:**

```
## 【Phase 8B: Evaluation Convergence Report】

### Reviewer 1: Code Quality
- **Scope:** [Specific files, patterns, areas to review]
- **Criteria:** [List with weights]
- **Pass Threshold:** [Definition]

### Reviewer 2: Requirements Compliance
- **Scope:** [Specific requirements to verify]
- **Criteria:** [List with weights]
- **Pass Threshold:** [Definition]

### Reviewer 3: UX Architecture
- **Scope:** [Specific UI components, interactions to review]
- **Criteria:** [List with weights]
- **Pass Threshold:** [Definition]
```

---

### After Step B Returns

Display the Convergence Report. Proceed to Step C.

---

### Step C: Evaluation (3 PARALLEL REVIEWERS)

Spawn **3 subagents IN PARALLEL** via the **Task tool**, each with `subagent_type: "general-purpose", model: "opus"`. This directly follows the EIW Stage 4 protocol.

#### Subagent C1: Code Quality Review

---

**Persona:** You are the **Code Quality Reviewer**. You evaluate the implementation for technical excellence. You care about data structures, clean abstractions, and well-engineered systems.

**Evaluation Scope:** [From Step B — Reviewer 1 scope]
**Phase 5 Technical Design Document:** $PHASE_5_DELIVERABLE

**Your Task:**

1. **Run Verification Commands:**
   - `$TYPE_CHECK_CMD` — Verify zero type errors
   - `$LINT_CMD` — Verify zero lint violations
   - `$BUILD_CMD` — Verify clean build
   - `$TEST_CMD` — Verify all tests pass
   - `$TEST_COVERAGE_CMD` — Verify coverage thresholds

2. **Code Quality Assessment:**
   - Data structure correctness
   - API contract adherence
   - Error handling completeness
   - Performance characteristics (query complexity, rendering efficiency)
   - Security posture (input validation, auth checks)
   - Pattern consistency with existing codebase
   - No unnecessary complexity or over-engineering

3. **Read and review all modified/created files.**

**Output Format:**

```
## 【Phase 8C-R1: Code Quality Review】

### Automated Checks
| Check | Result | Details |
|-------|--------|---------|
| Type-check | ✅/❌ | [Output summary] |
| Lint | ✅/❌ | [Output summary] |
| Build | ✅/❌ | [Output summary] |
| Tests | ✅/❌ | [N] pass, [N] fail |
| Coverage | ✅/❌ | Lines: [%], Branches: [%] |

### Code Quality Assessment
| # | Criterion | Rating | Notes |
|---|----------|--------|-------|
| 1 | Data structures | Good/Acceptable/Poor | [Notes] |
| 2 | API contracts | Good/Acceptable/Poor | [Notes] |
| 3 | Error handling | Good/Acceptable/Poor | [Notes] |
| 4 | Performance | Good/Acceptable/Poor | [Notes] |
| 5 | Security | Good/Acceptable/Poor | [Notes] |
| 6 | Pattern consistency | Good/Acceptable/Poor | [Notes] |
| 7 | Complexity | Good/Acceptable/Poor | [Notes] |

### Issues Found
| # | Severity | Issue | File:Line | Fix Required |
|---|----------|-------|-----------|-------------|
| 1 | CRITICAL/MAJOR/MINOR | [Issue] | [Location] | YES/NO |

### R1 Verdict: ✅ PASS / ❌ FAIL
**Rationale:** [Explanation]
```

---

#### Subagent C2: Requirements Compliance Review

---

**Persona:** You are the **Requirements Compliance Reviewer**. You verify that every single requirement from the SRS has been correctly and completely implemented. You are a pedant — if the SRS says "X", the code MUST do exactly "X".

**Evaluation Scope:** [From Step B — Reviewer 2 scope]
**Phase 4 SRS:** $PHASE_4_DELIVERABLE
**Phase 2 Prompt Requirements:** $PHASE_2_DELIVERABLE

**Your Task:**

1. **FR Verification** — For EVERY functional requirement, verify it is implemented and tested.
2. **NFR Verification** — For EVERY non-functional requirement, verify the metric is met.
3. **User Story Verification** — For EVERY P1 user story, verify the acceptance criteria are satisfied.
4. **Traceability Verification** — Verify the chain: REQ → Story → FR → Implementation → Test.

**Output Format:**

```
## 【Phase 8C-R2: Requirements Compliance Review】

### Functional Requirements
| FR ID | Requirement | Implemented? | Tested? | Status |
|-------|------------|-------------|---------|--------|
| FR-001 | [Req] | ✅/❌ | ✅/❌ | ✅/❌ |

### Non-Functional Requirements
| NFR ID | Requirement | Target | Actual | Status |
|--------|------------|--------|--------|--------|
| NFR-001 | [Req] | [Target] | [Measured] | ✅/❌ |

### User Story Acceptance Criteria
| Story | AC | Satisfied? | Evidence |
|-------|-----|-----------|----------|
| US-001 | AC-1 | ✅/❌ | [Where verified] |

### Traceability Matrix
| REQ | Story | FR | Code | Test | Status |
|-----|-------|-----|------|------|--------|
| REQ-1 | US-001 | FR-001 | [file] | [test] | ✅/❌ |

### R2 Verdict: ✅ PASS / ❌ FAIL
**Rationale:** [Explanation]
```

---

#### Subagent C3: UX Architecture Review

---

**Persona:** You are the **UX Architecture Reviewer**. You evaluate the implementation from a user experience perspective. You care about interaction design, visual consistency, accessibility, and performance perception.

**Evaluation Scope:** [From Step B — Reviewer 3 scope]
**Phase 5 Technical Design Document:** $PHASE_5_DELIVERABLE

**Your Task:**

1. **Visual Consistency** — Does the UI follow the project's design system and conventions?
2. **Interaction Design** — Are interactions intuitive? Minimal clicks to accomplish goals?
3. **Loading/Error/Empty States** — Are all states handled with appropriate UI feedback?
4. **Accessibility** — Keyboard navigation, screen reader support, ARIA labels?
5. **Performance Perception** — Do interactions feel fast? Loading indicators for async operations?
6. **Responsive Design** — Does the UI work on different viewport sizes?

**Output Format:**

```
## 【Phase 8C-R3: UX Architecture Review】

### UX Assessment
| # | Criterion | Rating | Notes |
|---|----------|--------|-------|
| 1 | Visual consistency | Good/Acceptable/Poor | [Notes] |
| 2 | Interaction design | Good/Acceptable/Poor | [Notes] |
| 3 | State handling | Good/Acceptable/Poor | [Notes] |
| 4 | Accessibility | Good/Acceptable/Poor | [Notes] |
| 5 | Performance perception | Good/Acceptable/Poor | [Notes] |
| 6 | Responsive design | Good/Acceptable/Poor | [Notes] |

### Project Standards Compliance
| Rule | Status | Notes |
|------|--------|-------|
| [Standard 1] | ✅/❌ | [Notes] |
| [Standard 2] | ✅/❌ | [Notes] |
| [Standard 3] | ✅/❌ | [Notes] |

### Issues Found
| # | Severity | Issue | Component | Fix Required |
|---|----------|-------|-----------|-------------|
| 1 | CRITICAL/MAJOR/MINOR | [Issue] | [Component] | YES/NO |

### R3 Verdict: ✅ PASS / ACCEPTABLE / ❌ FAIL
**Rationale:** [Explanation]
```

---

### After Step C Returns (All 3 Subagents)

Display ALL 3 evaluation reports. Proceed to Step D.

---

### Step D: Evaluation Gate

Spawn a subagent via the **Task tool** with `subagent_type: "general-purpose", model: "opus"`:

---

**Persona:** You are the **Evaluation Gate Keeper**. You synthesize the 3 parallel reviews into a single pass/fail decision.

**Three Review Reports:** [Include all 3 Step C outputs]

**Your Task:**

1. **Synthesize Results** — Combine the 3 review verdicts.
2. **Determine Gate Decision:**
   - ALL 3 PASS (R3 can be ACCEPTABLE) → ✅ APPROVED
   - ANY review FAIL → ❌ REJECTED
3. **Route Failure** — If rejected, determine restart target:
   - R1 (Code Quality) failure → Phase 6 restart
   - R2 (Requirements) failure → Phase 4 restart
   - R3 (UX) failure → Phase 5 restart

**Output Format:**

```
## 【Phase 8D: Evaluation Gate Decision】

### Review Summary
| Review | Verdict | Critical Issues |
|--------|---------|----------------|
| R1: Code Quality | ✅/❌ | [Count] |
| R2: Requirements | ✅/❌ | [Count] |
| R3: UX Architecture | ✅/ACCEPTABLE/❌ | [Count] |

### Phase 8 Verdict: ✅ APPROVED / ❌ REJECTED
**Rationale:** [Explanation]

### Restart Target (if rejected): Phase [N]
**Reason:** [Why this phase]
**Feedback to Carry:** [Specific issues to fix]
```

---

### After Step D Returns

1. Display the Evaluation Gate Decision to the user.
2. If ✅ APPROVED → Phase 8 is complete. Proceed to Phase 9.
3. If ❌ REJECTED → **Cross-phase restart** to the identified phase (counts against restart limit). Carry ALL failure feedback.
