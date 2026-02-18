# SE Phase 4: SE Requirements Definition

You are executing **SE Pipeline Phase 4: Software Engineering Requirements Definition** for the feature described by the user.

> **Configuration Note:** This phase references `$TYPE_CHECK_CMD`, `$LINT_CMD`, `$BUILD_CMD`, `$TEST_CMD`, `$TEST_COVERAGE_CMD`. Configure these in your project's CLAUDE.md.

## Phase Purpose

Produce a formal Software Requirements Specification (SRS) with functional requirements, non-functional requirements, data model entities, API contracts, and project standards compliance. This is the authoritative requirements document that Phase 5 (Design) will implement against.

## Prerequisites

- Phase 3 Project Plan must be APPROVED

## Progress Reporting (MANDATORY)

Before each sub-step, output a progress line to the terminal:

```
───────────────────────────────────────────────────────
 SE Phase 4: SE Requirements | Step X: [Step Name]
───────────────────────────────────────────────────────
```

Use these step names:
- `Step A: Discussion & Ideation (Tri-Persona)`
- `Step B: Critical Thinking Convergence`
- `Step C: Deliverable Generation`
- `Step D: Phase Approval`

At step completion, output: `  ✓ Phase 4 Step X complete → Proceeding to Step Y`
On rejection: `  ✗ Phase 4 Step D: REJECTED → Restarting from Step A (FREE restart)`

---

## Sub-Step Execution Protocol

Execute all 4 sub-steps sequentially. Each sub-step spawns a subagent via the **Task tool** with `subagent_type: "general-purpose", model: "opus"`.

---

### Step A: Discussion & Ideation (Tri-Persona Protocol)

Execute the **Tri-Persona Discussion protocol** (defined in `/se-step-a-discussion`) with:

- `$PHASE_NUMBER` = 4
- `$PHASE_NAME` = "SE Requirements Definition"
- `$PHASE_CONTEXT` = Phase 2 + Phase 3 Deliverables (`$PHASE_2_DELIVERABLE`, `$PHASE_3_DELIVERABLE`) + `$ACCUMULATED_FEEDBACK`
- `$DISCUSSION_TOPIC` = "What functional requirements, data model entities, and API contracts should we define? Are they testable, consistent, and complete?"

The three personas (Innovator, Guardian, Catalyst) will deliberate for a minimum of 2 rounds, continuing until all three declare CONVERGED or 5 rounds are reached.

### After Step A Returns

Display the full Tri-Persona Discussion Summary to the user. The Catalyst's Recommended Direction becomes the primary input for Step B. Proceed to Step B.

---

### Step B: Critical Thinking Convergence

Spawn a subagent with the following prompt (include Step A output):

---

**Persona:** You are the **SRS Convergence Analyst**. You take a brainstormed SRS and ensure consistency, testability, and elimination of vagueness. You are the "quality filter" for requirements — nothing ambiguous passes through you.

**Step A Output:** [Include full Step A output]
**Phase 2 Deliverable:** $PHASE_2_DELIVERABLE

**Your Task:**

1. **Consistency Check** — Ensure no FRs contradict each other. No data model conflicts.
2. **Testability Audit** — Every FR must have a concrete, automatable test criterion. Flag any that are vague.
3. **Eliminate Vagueness** — Replace words like "fast", "responsive", "user-friendly" with measurable metrics.
4. **API Consistency** — Ensure all endpoints follow existing project conventions (REST patterns, error formats, auth patterns).
5. **Project Standards Compliance** — Check against any UI/UX rules, coding standards, and design guidelines defined in your project's CLAUDE.md.
6. **Gap Analysis** — Identify any user stories from Phase 2 that have no corresponding FR.

**Output Format:**

```
## 【Phase 4B: SRS Convergence Report】

### Consistency Issues
| # | Issue | FRs Involved | Resolution |
|---|-------|-------------|------------|
| 1 | [Conflict] | FR-001, FR-003 | [Resolution] |

### Testability Audit
| FR ID | Status | Issue | Fix |
|-------|--------|-------|-----|
| FR-001 | ✅ Testable | — | — |
| FR-005 | ❌ Vague | "should be fast" | Changed to "response < 200ms" |

### Vagueness Eliminations
| Original | Replacement |
|----------|-------------|
| "user-friendly" | "max 3 clicks to complete" |

### Project Standards Compliance
| Rule | Status | Notes |
|------|--------|-------|
| [Standard 1] | ✅/❌ | [Notes] |
| [Standard 2] | ✅/❌ | [Notes] |
| [Standard 3] | ✅/❌ | [Notes] |

### Gap Analysis
| Story ID | FR Coverage | Status |
|----------|------------|--------|
| US-001 | FR-001, FR-002 | ✅ Covered |
| US-005 | (none) | ❌ GAP |
```

---

### After Step B Returns

Display the Convergence Report. Proceed to Step C.

---

### Step C: Deliverable Generation

Spawn a subagent with the following prompt (include Step A + B outputs):

---

**Persona:** You are the **SRS Document Architect**. You produce the formal Phase 4 deliverable: a complete Software Requirements Specification.

**Step A + B Outputs:** [Include both]
**Phase 2 + 3 Deliverables:** $PHASE_2_DELIVERABLE, $PHASE_3_DELIVERABLE

**Your Task:** Produce the **Software Requirements Specification** — the formal deliverable of Phase 4.

**Output Format:**

```
## 【Phase 4 Deliverable: Software Requirements Specification】

### 1. Document Header
**Feature:** [Title]
**Version:** 1.0
**Status:** Draft
**Traceability:** Phase 1 → Phase 2 → Phase 3 → This Document

### 2. Functional Requirements

#### 2.1 Core Requirements (P1)
| ID | Requirement | Test Criterion | Story | Priority |
|----|------------|----------------|-------|----------|
| FR-001 | [Requirement] | [Test] | US-001 | P1 |

#### 2.2 Extended Requirements (P2)
[Same format]

### 3. Non-Functional Requirements
| ID | Category | Requirement | Metric | Target | Test Method |
|----|----------|-------------|--------|--------|-------------|
| NFR-001 | [Cat] | [Req] | [Metric] | [Target] | [Method] |

### 4. Data Model

#### 4.1 Entity-Relationship Diagram
[Text-based ERD]

#### 4.2 Entity Definitions
**Entity: [Name]**
| Attribute | Type | Constraints | FK | Notes |
|-----------|------|------------|----|----- |
| [attr] | [type] | [constraints] | [ref] | [notes] |

#### 4.3 Database Migrations Required
1. [Migration description]

### 5. API Contract Specification

#### 5.1 Endpoint: [METHOD] /api/[path]
- **Description:** [What it does]
- **Authentication:** [Required/Optional]
- **Request Schema:**
  ```typescript
  interface RequestBody { ... }
  ```
- **Response Schema:**
  ```typescript
  interface ResponseBody { ... }
  ```
- **Error Responses:**
  | Code | Condition | Response |
  |------|-----------|----------|
  | 400 | [Condition] | [Response] |

### 6. State Management Specification
| Context/Hook | Provider Location | Consumers | State Shape |
|-------------|------------------|-----------|-------------|
| [Name] | [Where] | [Who uses it] | [Shape] |

### 7. Traceability Matrix
| Phase 1 REQ | Phase 2 Story | Phase 4 FR | Status |
|-------------|--------------|-----------|--------|
| REQ-1 | US-001 | FR-001, FR-002 | ✅ |

### 8. Phase 5 Handoff Notes
[Specific guidance for the Analysis & Design phase]
```

---

### After Step C Returns

Display the SRS. Proceed to Step D.

---

### Step D: Phase Approval

Spawn a subagent with the following prompt (include Step C deliverable):

---

**Persona:** You are the **SRS Validation Reviewer**. You are the quality gate for Phase 4. You ensure the SRS is complete, traceable, testable, and standards-compliant.

**Phase 4 Deliverable:** [Include Step C output]
**Phase 2 Deliverable:** $PHASE_2_DELIVERABLE
**Phase 3 Deliverable:** $PHASE_3_DELIVERABLE

**Your Task:** Validate the SRS against these criteria:

1. **Completeness** — Every P1 user story has corresponding FRs. Data model covers all entities. API contracts cover all endpoints.
2. **Traceability** — End-to-end traceability from Phase 1 REQ → Phase 2 Story → Phase 4 FR.
3. **Testability** — Every FR has a concrete, automatable test criterion.
4. **Project Standards Compliance** — All UI-facing requirements respect the project's coding and design standards.
5. **Consistency** — No contradictory requirements. Data model and API contracts align.
6. **Downstream Readiness** — The SRS provides sufficient detail for Phase 5 design.

**Output Format:**

```
## 【Phase 4D: SRS Validation Review】

### Validation Criteria
| # | Criterion | Status | Notes |
|---|----------|--------|-------|
| 1 | Completeness | ✅/❌ | [Notes] |
| 2 | Traceability | ✅/❌ | [Notes] |
| 3 | Testability | ✅/❌ | [Notes] |
| 4 | Project standards compliance | ✅/❌ | [Notes] |
| 5 | Consistency | ✅/❌ | [Notes] |
| 6 | Downstream readiness | ✅/❌ | [Notes] |

### Issues Found
1. [Issue — if any]

### Phase 4 Verdict: ✅ APPROVED / ❌ REJECTED
**Rationale:** [Explanation]

### Corrections Required (if rejected)
1. [Correction]
```

---

### After Step D Returns

1. Display the SRS Validation Review to the user.
2. If ✅ APPROVED → Phase 4 is complete. Output the final SRS and proceed to Phase 5.
3. If ❌ REJECTED → This is a FREE internal restart. Restart from Step A with the rejection feedback incorporated. Do NOT count this against the cross-phase restart limit.
