# SE Phase 9: Final Approval

You are executing **SE Pipeline Phase 9: Final Approval** for the feature described by the user.

## Phase Purpose

Obtain sequential sign-off from PM, CTO, and CEO. This phase absorbs EIW Stages 5, 6, and 7. Each approver reviews the complete body of evidence from all previous phases and issues a final verdict.

## Prerequisites

- Phase 8 Evaluation must be APPROVED (all 3 reviews passed)

## Progress Reporting (MANDATORY)

Before each sub-step, output a progress line to the terminal:

```
───────────────────────────────────────────────────────
 SE Phase 9: Final Approval | Step X: [Step Name]
───────────────────────────────────────────────────────
```

Use these step names:
- `Step A: Discussion & Ideation (Tri-Persona)`
- `Step B: Final Convergence`
- `Step C: Approval Certificate Generation`
- `Step D: Sequential Approval — [PM → CTO → CEO]`

During Step D, output each approval as it happens:
```
  → Phase 9 Step D: PM Approval — [APPROVED / REJECTED]
  → Phase 9 Step D: CTO Approval — [APPROVED / REJECTED]
  → Phase 9 Step D: CEO Approval — [APPROVED / REQUIRES_PIVOT / REJECTED]
```

At completion: `  ✓ Phase 9: ALL APPROVED → PRODUCTION-READY`
On rejection: `  ✗ Phase 9: [Role] REJECTED → Restart from Phase M`

---

## Sub-Step Execution Protocol

Execute Steps A-C sequentially, then Step D runs **3 sequential approvals** (PM → CTO → CEO).

---

### Step A: Discussion & Ideation (Tri-Persona Protocol)

Execute the **Tri-Persona Discussion protocol** (defined in `/se-step-a-discussion`) with:

- `$PHASE_NUMBER` = 9
- `$PHASE_NAME` = "Final Approval"
- `$PHASE_CONTEXT` = ALL Phase Deliverables (`$PHASE_1_DELIVERABLE` through `$PHASE_8_REPORT`) + `$ACCUMULATED_FEEDBACK`
- `$DISCUSSION_TOPIC` = "Is the evidence package complete and compelling? What remaining blockers or risks could prevent approval? Are there any last-minute concerns?"

The three personas (Innovator, Guardian, Catalyst) will deliberate for a minimum of 2 rounds, continuing until all three declare CONVERGED or 5 rounds are reached.

### After Step A Returns

Display the full Tri-Persona Discussion Summary to the user. The Catalyst's Recommended Direction becomes the primary input for Step B. Proceed to Step B.

---

### Step B: Critical Thinking Convergence

Spawn a subagent via the **Task tool** with `subagent_type: "general-purpose", model: "opus"`:

---

**Persona:** You are the **Final Convergence Analyst**. You perform a last check for remaining blockers before the approval sequence begins.

**Step A Output:** [Include full Step A output]

**Your Task:**

1. **Blocker Scan** — Are there any outstanding blockers that would prevent approval?
2. **Evidence Completeness** — Is the evidence package complete for all 3 approvers?
3. **Risk Assessment** — Any new risks surfaced during implementation that weren't in Phase 3?
4. **Approval Readiness Score** — Rate readiness on a 1-10 scale.

**Output Format:**

```
## 【Phase 9B: Final Convergence Report】

### Blocker Scan
| # | Potential Blocker | Status | Resolution |
|---|------------------|--------|------------|
| 1 | [Blocker] | Resolved/Active | [Resolution] |

### Evidence Completeness
| Approver | Required Evidence | Status |
|----------|------------------|--------|
| PM | Requirements + Tests + UX Review | ✅/❌ |
| CTO | Architecture + Code Quality + Security | ✅/❌ |
| CEO | Business Value + Strategic Alignment | ✅/❌ |

### New Risks
| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| (none or list) |

### Approval Readiness Score: [N]/10
**Assessment:** [Ready for approval / Needs attention on X]
```

---

### After Step B Returns

Display the Convergence Report. If readiness score < 7, warn the user and ask if they want to proceed. Then proceed to Step C.

---

### Step C: Deliverable Generation

Spawn a subagent via the **Task tool** with `subagent_type: "general-purpose", model: "opus"`:

---

**Persona:** You are the **Approval Certificate Architect**. You draft the Final Approval Certificate that each approver will sign off on.

**Step A + B Outputs:** [Include both]

**Your Task:** Draft the **Final Approval Certificate**.

**Output Format:**

```
## 【Phase 9 Deliverable: Final Approval Certificate】

### Feature
**Title:** [Feature name]
**Description:** [1-2 sentences]

### Scope
- **P1 Requirements Implemented:** [N]/[N]
- **P2 Requirements Implemented:** [N]/[N]
- **Total Tests:** [N] (✅ [N] passed)
- **Coverage:** Lines [%], Branches [%]

### Quality Summary
| Dimension | Rating | Evidence |
|-----------|--------|----------|
| Code Quality | Good/Acceptable/Poor | Phase 8 R1 |
| Requirements Compliance | Good/Acceptable/Poor | Phase 8 R2 |
| UX Architecture | Good/Acceptable/Poor | Phase 8 R3 |
| Test Coverage | Good/Acceptable/Poor | Phase 7 |
| Security | Good/Acceptable/Poor | Phase 7 + R1 |

### Risk Disposition
| Risk | Status |
|------|--------|
| [Risk] | Resolved/Accepted/Mitigated |

### Outstanding Items
| Item | Impact | Remediation Plan |
|------|--------|-----------------|
| [Item] | [Impact] | [Plan] |

### Approval Signatures
| Role | Verdict | Date |
|------|---------|------|
| PM | ⏳ PENDING | — |
| CTO | ⏳ PENDING | — |
| CEO | ⏳ PENDING | — |

### Pipeline Iteration History
| # | Reached Phase | Outcome | Key Feedback |
|---|--------------|---------|--------------|
| 1 | [Phase N] | [Outcome] | [Summary] |
```

---

### After Step C Returns

Display the draft Approval Certificate. Proceed to Step D.

---

### Step D: Sequential Approval (PM → CTO → CEO)

Execute **3 sequential approvals**. Each must APPROVE before the next begins. This directly follows EIW Stages 5, 6, and 7.

#### Approval D1: PM Approval

Spawn a subagent via the **Task tool** with `subagent_type: "general-purpose", model: "opus"`:

---

**Persona:** You are the **Product Manager** giving final approval. You verify that the implementation satisfies user requirements and delivers the intended value.

**Final Approval Certificate:** [Step C output]
**Phase 2 Prompt Requirements:** $PHASE_2_DELIVERABLE
**Phase 4 SRS:** $PHASE_4_DELIVERABLE
**Phase 8 Evaluation Report:** $PHASE_8_REPORT

**Your Task:** Evaluate against these criteria:

1. **Requirement Satisfaction** — All P1 requirements implemented and tested?
2. **User Value Delivery** — Does the implementation deliver the intended user value?
3. **UX Quality** — Is the user experience acceptable?
4. **Feature Completeness** — No missing states, flows, or interactions?
5. **Acceptance Criteria** — All P1 acceptance criteria satisfied?

**Output Format:**

```
## 【Phase 9D-PM: Product Manager Approval】

### Evaluation
| # | Criterion | Status | Notes |
|---|----------|--------|-------|
| 1 | Requirement satisfaction | ✅/❌ | [Notes] |
| 2 | User value delivery | ✅/❌ | [Notes] |
| 3 | UX quality | ✅/❌ | [Notes] |
| 4 | Feature completeness | ✅/❌ | [Notes] |
| 5 | Acceptance criteria | ✅/❌ | [Notes] |

### PM Verdict: ✅ APPROVED / ❌ REJECTED
**Rationale:** [Explanation]
**Required Changes (if rejected):** [Changes]
```

---

**If PM ❌ REJECTED → Cross-phase restart to Phase 8** (counts against restart limit).

**If PM ✅ APPROVED → Proceed to CTO approval.**

---

#### Approval D2: CTO Technical Approval

Spawn a subagent via the **Task tool** with `subagent_type: "general-purpose", model: "opus"`:

---

**Persona:** You are the **CTO** giving final technical approval. You are the last line of defense against technical debt, security vulnerabilities, and architectural mistakes reaching production.

**Final Approval Certificate:** [Step C output with PM signature]
**Phase 5 Technical Design Document:** $PHASE_5_DELIVERABLE
**Phase 8 Code Quality Review (R1):** $PHASE_8_R1

**Your Task:** Evaluate against these criteria:

1. **Architecture Integrity** — Does the implementation faithfully follow the approved design?
2. **Security** — No vulnerabilities introduced? Auth/authz correct?
3. **Scalability** — Will this perform under 10x load?
4. **Tech Debt** — Acceptable level of tech debt? All documented?
5. **Production Readiness** — Error handling, monitoring, graceful degradation?
6. **Code Quality** — Clean data structures and logic?
7. **Pattern Consistency** — Follows existing codebase conventions?

**Output Format:**

```
## 【Phase 9D-CTO: CTO Technical Approval】

### Evaluation
| # | Criterion | Status | Notes |
|---|----------|--------|-------|
| 1 | Architecture integrity | ✅/❌ | [Notes] |
| 2 | Security | ✅/❌ | [Notes] |
| 3 | Scalability | ✅/❌ | [Notes] |
| 4 | Tech debt | ✅/❌ | [Notes] |
| 5 | Production readiness | ✅/❌ | [Notes] |
| 6 | Code quality | ✅/❌ | [Notes] |
| 7 | Pattern consistency | ✅/❌ | [Notes] |

### CTO Verdict: ✅ APPROVED / ❌ REJECTED
**Rejection Type (if rejected):** IMPLEMENTATION_FLAW / ARCHITECTURE_INVALIDATED
**Rationale:** [Explanation]
**Required Changes (if rejected):** [Changes]
```

---

**If CTO ❌ REJECTED (IMPLEMENTATION_FLAW) → Cross-phase restart to Phase 6.**
**If CTO ❌ REJECTED (ARCHITECTURE_INVALIDATED) → Cross-phase restart to Phase 5.**
**If CTO ✅ APPROVED → Proceed to CEO approval.**

---

#### Approval D3: CEO Strategic Approval

Spawn a subagent via the **Task tool** with `subagent_type: "general-purpose", model: "opus"`:

---

**Persona:** You are the **CEO** giving final strategic approval. You evaluate whether this feature serves the product's mission and market positioning. You are the final gate before production.

**Final Approval Certificate:** [Step C output with PM + CTO signatures]
**Phase 1 Prompt Analysis:** $PHASE_1_DELIVERABLE

**Your Task:** Evaluate against these criteria:

1. **Strategic Alignment** — Does this feature serve the product's vision and market positioning?
2. **Business Value** — Is the delivered value proportional to the development effort?
3. **Market Impact** — Does this strengthen the competitive position?
4. **User Trust** — Will this feature increase or decrease user trust?
5. **Quality Bar** — Does the quality meet the bar for a professional product?
6. **Brand Consistency** — Does the implementation reflect the product's brand values?
7. **Risk Acceptance** — Are all outstanding risks acceptable for production?

**Output Format:**

```
## 【Phase 9D-CEO: CEO Strategic Approval】

### Evaluation
| # | Criterion | Status | Notes |
|---|----------|--------|-------|
| 1 | Strategic alignment | ✅/❌ | [Notes] |
| 2 | Business value | ✅/❌ | [Notes] |
| 3 | Market impact | ✅/❌ | [Notes] |
| 4 | User trust | ✅/❌ | [Notes] |
| 5 | Quality bar | ✅/❌ | [Notes] |
| 6 | Brand consistency | ✅/❌ | [Notes] |
| 7 | Risk acceptance | ✅/❌ | [Notes] |

### CEO Verdict: ✅ APPROVED / 🔄 REQUIRES_PIVOT / ❌ REJECTED
**Rationale:** [Explanation]
**Required Changes (if pivot):** [Changes]
```

---

**If CEO ✅ APPROVED → Feature is PRODUCTION-READY. Update the Approval Certificate with all 3 signatures.**
**If CEO 🔄 REQUIRES_PIVOT → Cross-phase restart to Phase 3** (counts against restart limit).
**If CEO ❌ REJECTED → Feature is CANCELLED. No restart.**

---

### After Step D Completes (All 3 Approvals)

1. Display the completed Approval Certificate with all 3 signatures.
2. Output the **final SE Pipeline result**:

```
## 【SE PIPELINE FINAL RESULT】

### Feature: [Name]
### Total Pipeline Iterations: [N]
### Final Status: ✅ PRODUCTION-READY / ❌ CANCELLED / ⚠️ ESCALATED

### Phase Results
| Phase | Name | Status |
|-------|------|--------|
| 1 | Prompt Analysis | ✅ |
| 2 | Prompt Requirements | ✅ |
| 3 | SE Planning | ✅ |
| 4 | SE Requirements | ✅ |
| 5 | Analysis & Design | ✅ |
| 6 | Implementation | ✅ |
| 7 | Testing | ✅ |
| 8 | Evaluation | ✅ |
| 9 | Final Approval | ✅ (PM ✅ → CTO ✅ → CEO ✅) |

### Approval Signatures
| Role | Verdict | Date |
|------|---------|------|
| PM | ✅ APPROVED | [Date] |
| CTO | ✅ APPROVED | [Date] |
| CEO | ✅ APPROVED | [Date] |

>>> PRODUCTION-READY ✅
```
