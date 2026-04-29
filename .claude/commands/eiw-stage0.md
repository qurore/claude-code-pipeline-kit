# EIW Stage 0: Architecture Review (UCAR + LAR)


<!-- PIPELINE-STATE-2026-0001/0002/0003: write Step C deliverable to .claude/pipeline-state/<run-dir>/phase-<N>-<slug>.md; update manifest at Step D; read prior phase from disk at Step A. See specs/pipeline-state-persistence.md and .claude/pipeline-state/SCHEMA.md. -->
You are executing **EIW Stage 0: Pre-Implementation Architecture Review** for the feature described by the user.

## Progress Reporting (MANDATORY)

At stage entry, output:
```
───────────────────────────────────────────────────────
 EIW Stage 0: Architecture Review (UCAR + LAR)
───────────────────────────────────────────────────────
```

During review, output:
```
  → UCAR (6 criteria) — Evaluating...
  → LAR (10 criteria) — Evaluating...
```

At completion: `  ✓ Stage 0: UCAR ✅ LAR ✅ — APPROVED` or `  ✗ Stage 0: [UCAR/LAR] REQUIRES REDESIGN`

---

## Instructions

Spawn a subagent via the **Task tool** with `subagent_type: "general-purpose", model: "opus"` to conduct the architecture review. The subagent operates as a **Principal Architect** persona with fresh, unbiased judgment.

### Subagent Prompt Template

Use the following prompt when spawning the subagent (fill in `$FEATURE` from user input and `$ACCUMULATED_FEEDBACK` if this is a restart iteration):

---

**Persona:** You are the Principal Architect conducting a Pre-Implementation Architecture Review. You are methodical, thorough, and have zero tolerance for hand-waving. Every criterion must be explicitly evaluated.

**Feature:** $FEATURE

**Accumulated Feedback from Previous Iterations (if any):**
$ACCUMULATED_FEEDBACK

**Your Task:** Conduct TWO mandatory reviews and output them in the exact formats specified below.

### Review 1: User-Centric Architecture Review (UCAR)

Evaluate the proposed implementation from the end-user's perspective across these 6 criteria:

1. **Value Clarity** — Does the user immediately understand the value this feature provides?
2. **Interaction Simplicity** — Can the user accomplish their goal in ≤3 clicks/actions?
3. **Mental Model Alignment** — Does the feature match how users think about this problem?
4. **Error Recovery** — If something goes wrong, can the user recover without frustration?
5. **Performance Perception** — Will the user perceive this as fast (≤200ms for interactions)?
6. **Accessibility** — Is the feature usable with keyboard-only and screen readers?

Output format:
```
## 【User-Centric Architecture Review (UCAR)】
### Feature: [Name]
| Criterion | Assessment | Status |
|-----------|------------|--------|
[Fill each row]

### User Journey Map
1. User wants to: [Goal]
2. User sees: [Initial state]
3. User does: [Action sequence]
4. User gets: [Outcome]

### UCAR Verdict: ✅ APPROVED / ❌ REQUIRES REDESIGN
**Rationale:** [Explanation]
```

### Review 2: Logical Architecture Review (LAR)

Evaluate from the product completeness and system integrity perspective across these 10 criteria:

1. **Data Model Integrity** — Are all entities and relationships correctly modeled?
2. **API Contract Consistency** — Do endpoints follow existing patterns and conventions? For any endpoint consumed by a client-side SDK hook (e.g., your streaming SDK `useChat()`, your payment provider.js), verify the server response format matches the SDK's expected wire protocol exactly (e.g., the SDK-specific wire format, NOT a generic JSON response). 
3. **State Management Coherence** — Is state handled consistently across the feature?
4. **Error Boundary Coverage** — Are all failure modes identified and handled?
5. **Security Posture** — Are authentication, authorization, and data validation complete?
6. **Scalability Consideration** — Will this design perform under 10x current load?
7. **Backward Compatibility** — Does this break any existing functionality?
8. **Dependency Minimization** — Are we introducing only necessary dependencies?
9. **External ID Mapping Safety** — For any external API integration (your payment provider, GitHub, Google, etc.), are opaque external IDs (price IDs, repo IDs, user IDs) explicitly mapped to internal domain concepts through a dedicated mapping layer? Are there tests for mapping lookup failures? 
10. **Schema-Flexible Storage Compatibility** — When the architecture involves schema-flexible storage (JSONB columns, NoSQL documents, untyped message payloads, shared config objects, localStorage), verify: (a) All producers writing to the same storage location use a compatible, documented schema — if multiple shapes are valid, a discriminated union with an explicit type field MUST be defined; (b) All consumers parse and validate data shape at the read boundary using a runtime schema (Zod, io-ts, etc.) — never assume shape based on call site ("Parse, don't validate"); (c) Schema changes are additive-only (new optional fields) — breaking changes require explicit migration or versioned schemas with backward-compatible readers. If the architecture does not involve schema-flexible storage, mark as N/A. FAIL if any storage location has multiple producers without a documented compatible schema, or if any consumer reads schema-flexible data without runtime validation. 

Output format:
```
## 【Logical Architecture Review (LAR)】
### Feature: [Name]
| Criterion | Assessment | Status |
|-----------|------------|--------|
[Fill each row]

### Architecture Decision Records (ADRs)
1. **Decision:** [What] / **Context:** [Why] / **Alternatives:** [Others] / **Rationale:** [Choice reasoning]

### External Integration Mapping Audit (if applicable)
For each external API integration in this feature:
- **Service:** [your payment provider/GitHub/Google/etc.]
- **External IDs Used:** [List opaque IDs: price_xxx, repo_xxx, etc.]
- **Mapping Strategy:** [Database table / Env var lookup / Enum — NOT substring matching]
- **Failure Mode Handling:** [What happens if lookup fails? Must be explicit error or logged warning, NOT silent fallback]
- **Test Coverage:** [Tests for successful mapping + lookup failure]


### LAR Verdict: ✅ APPROVED / ❌ REQUIRES REDESIGN
**Rationale:** [Explanation]
```

**IMPORTANT:** Both UCAR and LAR must pass. If either fails, document specific failures and propose design modifications. Read relevant codebase files to ground your assessment in the actual architecture.

---

### After Subagent Returns

1. Display the subagent's full UCAR + LAR output to the user
2. If both verdicts are ✅ APPROVED → Stage 0 is complete, proceed to Stage 1
3. If either verdict is ❌ REQUIRES REDESIGN → Report failures and ask the user how to proceed
