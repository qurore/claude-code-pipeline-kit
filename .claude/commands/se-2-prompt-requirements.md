# SE Phase 2: Prompt Requirements Definition

You are executing **SE Pipeline Phase 2: Prompt Requirements Definition** for the feature described by the user.

## Phase Purpose

Transform the Prompt Analysis Document (Phase 1 deliverable) into structured user stories with BDD acceptance criteria, prioritized by P1/P2/P3. This phase bridges raw analysis and formal SE requirements.

## Prerequisites

- Phase 1 Prompt Analysis Document must be APPROVED

## Progress Reporting (MANDATORY)

Before each sub-step, output a progress line to the terminal:

```
───────────────────────────────────────────────────────
 SE Phase 2: Prompt Requirements | Step X: [Step Name]
───────────────────────────────────────────────────────
```

Use these step names:
- `Step A: Discussion & Ideation (Tri-Persona)`
- `Step B: Critical Thinking Convergence`
- `Step C: Deliverable Generation`
- `Step D: Phase Approval`

At step completion, output: `  ✓ Phase 2 Step X complete → Proceeding to Step Y`
On rejection: `  ✗ Phase 2 Step D: REJECTED → Restarting from Step A (FREE restart)`

---

## Sub-Step Execution Protocol

Execute all 4 sub-steps sequentially. Each sub-step spawns a subagent via the **Task tool** with `subagent_type: "general-purpose", model: "opus"`.

---

### Step A: Discussion & Ideation (Tri-Persona Protocol)

Execute the **Tri-Persona Discussion protocol** (defined in `/se-step-a-discussion`) with:

- `$PHASE_NUMBER` = 2
- `$PHASE_NAME` = "Prompt Requirements Definition"
- `$PHASE_CONTEXT` = Phase 1 Deliverable (`$PHASE_1_DELIVERABLE`) + `$ACCUMULATED_FEEDBACK`
- `$DISCUSSION_TOPIC` = "What user stories and acceptance criteria should we derive from the Prompt Analysis? What edge cases and non-functional requirements are we missing?"

The three personas (Innovator, Guardian, Catalyst) will deliberate for a minimum of 2 rounds, continuing until all three declare CONVERGED or 5 rounds are reached.

### After Step A Returns

Display the full Tri-Persona Discussion Summary to the user. The Catalyst's Recommended Direction becomes the primary input for Step B. Proceed to Step B.

---

### Step B: Critical Thinking Convergence

Spawn a subagent with the following prompt (include Step A output):

---

**Persona:** You are the **Requirements Prioritization Analyst**. You take a brainstormed set of user stories and converge them into a clean, prioritized, deduplicated requirements set. You are ruthless about cutting P3 stories that add complexity without proportional value.

**Step A Output:** [Include full Step A output]
**Phase 1 Deliverable:** $PHASE_1_DELIVERABLE

**Your Task:**

1. **Deduplicate** — Merge overlapping stories. Eliminate redundancy.
2. **Prioritize** — Assign P1 (must-have for MVP), P2 (should-have for complete experience), P3 (nice-to-have for future iteration).
3. **BDD Standardize** — Ensure all acceptance criteria use strict Given/When/Then format.
4. **Traceability** — Map every story back to a REQ-N from Phase 1.
5. **Completeness Check** — Identify any Phase 1 requirements that have NO corresponding user story.

**Output Format:**

```
## 【Phase 2B: Requirements Convergence Report】

### Priority Summary
| Priority | Count | Stories |
|----------|-------|---------|
| P1 | [N] | US-001, US-002, ... |
| P2 | [N] | US-010, US-011, ... |
| P3 | [N] | US-020, US-021, ... |

### Merged/Removed Stories
| Original | Action | Reason |
|----------|--------|--------|
| US-XXX | Merged into US-YYY | [Overlap description] |
| US-ZZZ | Removed | [Not traceable to requirements] |

### Traceability Matrix
| REQ ID | User Stories | Coverage |
|--------|------------|----------|
| REQ-1 | US-001, US-002 | ✅ Full |
| REQ-2 | US-003 | ✅ Full |
| REQ-3 | (none) | ❌ GAP |

### Gaps Identified
1. [REQ with no story — needs story or justification for exclusion]
```

---

### After Step B Returns

Display the Convergence Report. Proceed to Step C.

---

### Step C: Deliverable Generation

Spawn a subagent with the following prompt (include Step A + B outputs):

---

**Persona:** You are the **Requirements Document Architect**. You produce the formal Phase 2 deliverable: a structured Prompt Requirements Document that downstream phases will consume.

**Step A + B Outputs:** [Include both]
**Phase 1 Deliverable:** $PHASE_1_DELIVERABLE

**Your Task:** Produce the **Prompt Requirements Document** — the formal deliverable of Phase 2.

**Mandatory Rules for Key Entities:**

1. **Explicit Cardinality** — For EVERY relationship between Key Entities, you MUST specify the cardinality type: `one-to-one`, `one-to-many`, or `many-to-many`. Do NOT leave relationships described only in prose (e.g., "a folder contains projects"). State the exact cardinality (e.g., "Folder → Project: one-to-many — a project belongs to exactly ONE folder").
2. **Metaphor Validation** — When a feature maps to a real-world metaphor with established user expectations (folders, directories, containers, inboxes, carts, playlists, albums, threads, etc.), you MUST explicitly state the metaphor, the user's expected cardinality based on that metaphor, and confirm that the specified cardinality matches. If the data model intentionally diverges from the metaphor (e.g., many-to-many tags instead of one-to-many folders), this MUST be flagged as a **Cardinality Divergence** with explicit justification.

**Output Format:**

```
## 【Phase 2 Deliverable: Prompt Requirements Document】

### 1. Document Header
**Feature:** [Title from Phase 1]
**Phase 1 Reference:** [Prompt Analysis Document version]
**Total Stories:** [N] (P1: [N], P2: [N], P3: [N])

### 2. P1 User Stories (Must-Have)

**US-001: [Title]**
- **Role:** [User role]
- **Capability:** [What they want]
- **Benefit:** [Why they want it]
- **Acceptance Criteria:**
  1. Given [context], When [action], Then [outcome]
  2. Given [context], When [action], Then [outcome]
- **Traceability:** REQ-1, REQ-2
- **Dependencies:** [US-XXX]

[Repeat for all P1 stories]

### 3. P2 User Stories (Should-Have)
[Same format as P1]

### 4. P3 User Stories (Nice-to-Have)
[Same format as P1]

### 5. Non-Functional Requirements
| ID | Category | Requirement | Acceptance Criterion |
|----|----------|-------------|---------------------|
| NFR-1 | [Category] | [Requirement] | [Measurable criterion] |

### 6. Key Entities & Relationship Cardinality
| Entity A | Relationship | Entity B | Cardinality | Metaphor | Metaphor-Aligned? |
|----------|-------------|----------|-------------|----------|-------------------|
| [Entity] | [verb phrase] | [Entity] | one-to-one / one-to-many / many-to-many | [real-world metaphor or "N/A"] | Yes / No (justification) |

**Cardinality Divergences (if any):**
1. [Entity A → Entity B is many-to-many, but the [metaphor] metaphor implies one-to-many. Justification: ...]

### 7. Traceability Matrix
| Phase 1 REQ | Phase 2 Stories | Coverage |
|-------------|----------------|----------|
| REQ-1 | US-001, US-002 | ✅ |

### 8. Phase 3 Handoff Notes
[Specific guidance for the SE Planning phase]
```

---

### After Step C Returns

Display the Prompt Requirements Document. Proceed to Step D.

---

### Step D: Phase Approval

Spawn a subagent with the following prompt (include Step C deliverable):

---

**Persona:** You are the **Requirements Completeness Reviewer**. You are the quality gate for Phase 2. You ensure requirements are complete, traceable, and properly structured.

**Phase 2 Deliverable:** [Include Step C output]
**Phase 1 Deliverable:** $PHASE_1_DELIVERABLE

**Your Task:** Validate the Prompt Requirements Document against these criteria:

1. **Traceability** — Every user story traces to at least one Phase 1 requirement. Every Phase 1 requirement has at least one story (or justified exclusion).
2. **BDD Quality** — All acceptance criteria use strict Given/When/Then format and are testable.
3. **No Gaps** — No Phase 1 requirements are unaddressed.
4. **No Scope Creep** — No stories introduce requirements beyond Phase 1 scope.
5. **Priority Consistency** — P1 stories are genuinely must-have; P3 stories are genuinely deferrable.
6. **Downstream Readiness** — The document provides sufficient clarity for Phase 3 planning.
7. **Entity Cardinality Completeness** — Every Key Entity relationship has an explicit cardinality type (one-to-one, one-to-many, many-to-many). When a feature maps to a real-world metaphor, the cardinality is validated against the user's mental model. Any divergence is flagged and justified.

**Output Format:**

```
## 【Phase 2D: Requirements Completeness Review】

### Validation Criteria
| # | Criterion | Status | Notes |
|---|----------|--------|-------|
| 1 | Full traceability | ✅/❌ | [Notes] |
| 2 | BDD quality | ✅/❌ | [Notes] |
| 3 | No gaps | ✅/❌ | [Notes] |
| 4 | No scope creep | ✅/❌ | [Notes] |
| 5 | Priority consistency | ✅/❌ | [Notes] |
| 6 | Downstream readiness | ✅/❌ | [Notes] |

### Issues Found
1. [Issue — if any]

### Phase 2 Verdict: ✅ APPROVED / ❌ REJECTED
**Rationale:** [Explanation]

### Corrections Required (if rejected)
1. [Correction]
```

---

### After Step D Returns

1. Display the Completeness Review to the user.
2. If ✅ APPROVED → Phase 2 is complete. Output the final Prompt Requirements Document and proceed to Phase 3.
3. If ❌ REJECTED → This is a FREE internal restart. Restart from Step A with the rejection feedback incorporated. Do NOT count this against the cross-phase restart limit.
