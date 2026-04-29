# SE Phase 4: SE Requirements Definition

You are executing **SE Pipeline Phase 4: Software Engineering Requirements Definition** for the feature described by the user.

## Phase Purpose

<!-- PIPELINE-STATE-2026-0001/0002/0003: write Step C deliverable to .claude/pipeline-state/<run-dir>/phase-<N>-<slug>.md; update manifest at Step D; read prior phase from disk at Step A. See specs/pipeline-state-persistence.md and .claude/pipeline-state/SCHEMA.md. -->

Produce a formal Software Requirements Specification (SRS) with functional requirements, non-functional requirements, data model entities, API contracts, and constitution compliance. This is the authoritative requirements document that Phase 5 (Design) will implement against.

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
- `$PHASE_CONTEXT` = Phase 0 Codebase Context Report (`$PHASE_0_DELIVERABLE`) + Phase 2 + Phase 3 Deliverables (`$PHASE_2_DELIVERABLE`, `$PHASE_3_DELIVERABLE`) + `$ACCUMULATED_FEEDBACK`
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
5. **Constitution Compliance** — Check against CLAUDE.md rules (sentence case, text hierarchy, button stability, etc.).
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

### Constitution Compliance
| Rule | Status | Notes |
|------|--------|-------|
| Sentence case | ✅/❌ | [Notes] |
| Text color hierarchy | ✅/❌ | [Notes] |
| Button stability | ✅/❌ | [Notes] |

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

### 9. Embedded Action Completeness Checklist (CONDITIONAL)

> **Applicability:** Complete this section if ANY feature in this SRS is triggered from within a host container — i.e., the action originates inside a component that has its own lifecycle separate from the feature's (chat drawer, sidebar panel, inline card, modal/dialog, popover, context menu, command palette, embedded widget). If no features match, write "N/A — no embedded actions" and proceed.

| # | Dimension | FR Required | Verification Question |
|---|-----------|-------------|----------------------|
| 1 | **Structured Persistence** | The SRS MUST specify WHERE and HOW the action's output/result is persisted (database table, JSONB column, file, etc.) independently of the host container's state. | "If the host container (chat, modal, drawer) is closed and reopened, does the action's result still exist? Where is it stored?" |
| 2 | **Session Restore** | The SRS MUST specify how the action's state is restored when the user returns — including after page reload, browser back/forward, and re-navigation to the same route. | "If the user navigates away and comes back, can they see the action's result? What query/fetch loads it?" |
| 3 | **Cross-Component Side-Effect Manifest** | The SRS MUST enumerate EVERY component outside the host container that must update when the action completes (lists, counts, badges, navigation items, status indicators). Each side-effect must have a corresponding FR with a refresh/invalidation mechanism. | "What else on the page or in the app changes when this action succeeds? Is there an FR for each?" |
| 4 | **Action Trigger Idempotency** | The SRS MUST specify what happens when the user triggers the action multiple times — including rapid double-clicks, re-triggering while a previous invocation is in progress, and re-triggering after a previous success. | "If the user clicks the action button twice quickly, what happens? If they trigger it again after it already succeeded, what happens?" |

> **Failure mode this prevents:** Features triggered from embedded contexts commonly ship with the primary action logic complete but missing persistence (result vanishes on container close), missing restore (result invisible on return visit), missing side-effects (stale data in sibling components), and missing idempotency guards (duplicate operations on re-trigger). Each dimension above MUST map to at least one FR in Section 2, or the SRS is incomplete.
```

---

### After Step C Returns

Display the SRS. Proceed to Step D.

---

### Step D: Phase Approval

Spawn a subagent with the following prompt (include Step C deliverable):

---

**Persona:** You are the **SRS Validation Reviewer**. You are the quality gate for Phase 4. You ensure the SRS is complete, traceable, testable, and constitution-compliant.

**Phase 4 Deliverable:** [Include Step C output]
**Phase 2 Deliverable:** $PHASE_2_DELIVERABLE
**Phase 3 Deliverable:** $PHASE_3_DELIVERABLE

**Your Task:** Validate the SRS against these criteria:

### Adversarial Review Protocol (MANDATORY)

**Burden of Proof:** Your default verdict is REJECT. You do NOT look for reasons to reject — you must affirmatively demonstrate that EVERY criterion is satisfied by citing specific deliverable content. If you cannot point to evidence, that criterion FAILS.

**Minimum Issue Discovery Quota (MIDQ = 3):** You MUST identify at least **3** issues (CRITICAL, MAJOR, or MINOR) before rendering any verdict. A verdict with zero issues is INVALID — it signals insufficient review depth. If exhaustive review genuinely yields fewer than 3 issues, state: "Exhaustive adversarial review yielded only N issues after examining [specific areas searched]."

**Auto-Reject Conditions (no discretion — if true, verdict MUST be REJECTED):**
- Any criterion rated ❌ with no proposed remediation path
- Deliverable contains internal contradictions
- Any FR lacks a concrete, automatable test criterion
- Any P1 user story has zero corresponding FRs and no justified exclusion

**Progressive Strictness:** If this is iteration 2+, you MUST first verify ALL items from `$ACCUMULATED_FEEDBACK` were addressed. Any unaddressed prior feedback = automatic REJECT.

**Adversarial Mandate:** You are a quality gate, not a cheerleader. When in doubt, REJECT — a false rejection costs one FREE restart; a false approval costs a cross-phase restart.

**On REJECT:** Format feedback using the Structured Feedback Entry Format (Critical/Major/Minor issues with locations and required fixes).

1. **Completeness** — Every P1 user story has corresponding FRs. Data model covers all entities. API contracts cover all endpoints.
2. **Traceability** — End-to-end traceability from Phase 1 REQ → Phase 2 Story → Phase 4 FR.
3. **Testability** — Every FR has a concrete, automatable test criterion.
4. **Constitution Compliance** — All UI-facing requirements respect CLAUDE.md rules.
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
| 4 | Constitution compliance | ✅/❌ | [Notes] |
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
