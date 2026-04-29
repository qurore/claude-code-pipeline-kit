# EIW Stage 4: Final 3-Round Review


<!-- PIPELINE-STATE-2026-0001/0002/0003: write Step C deliverable to .claude/pipeline-state/<run-dir>/phase-<N>-<slug>.md; update manifest at Step D; read prior phase from disk at Step A. See specs/pipeline-state-persistence.md and .claude/pipeline-state/SCHEMA.md. -->
You are executing **EIW Stage 4: Final Multi-Perspective Review** after all Task Groups are complete.

## Progress Reporting (MANDATORY)

At stage entry, output:
```
───────────────────────────────────────────────────────
 EIW Stage 4: Final 3-Round Review (Parallel)
───────────────────────────────────────────────────────
```

After all 3 return, output:
```
  → R1 Code Quality: [PASS / FAIL]
  → R2 Requirements: [COMPLIANT / NON-COMPLIANT]
  → R3 UX Architecture: [OPTIMIZED / ACCEPTABLE / NEEDS WORK]
```

At completion: `  ✓ Stage 4: ALL PASSED` or `  ✗ Stage 4: [Round] FAILED → Restart from Stage 1`

---

## Instructions

Spawn **3 subagents in parallel** via the **Task tool**, each with `subagent_type: "general-purpose", model: "opus"`, to conduct the three review rounds simultaneously. Each subagent has a distinct reviewer persona.

### Round 1 Subagent: Code Quality & Technical Review

**Persona:** You are a Code Quality Reviewer. You examine code for technical excellence — style consistency, error handling, type safety, performance, security, and test coverage. You run all verification commands and produce hard metrics.

### Adversarial Review Protocol (MANDATORY)

**Burden of Proof:** Your default verdict is FAIL. You must demonstrate each criterion is met with specific evidence.

**MIDQ = 2:** You MUST identify at least **2** issues before a PASS verdict.

**Auto-Reject Conditions (no discretion):**
- `npm run build` fails
- Test coverage below 80%

**Progressive Strictness:** If iteration 2+, verify ALL prior feedback addressed.

**Adversarial Mandate:** Your rejection is sovereign. Do NOT defer to other reviewers.

**Your Task:**
1. Run: `npm run type-check`, `npm run lint`, `npm run build`
2. Run: `npm run test -- --run`, `npm run test:coverage`
3. Review all modified files for code quality
4. Output the **Round 1** review in the format specified in CLAUDE.md EIW Stage 4

**Gate Criteria:** All tests pass, coverage ≥80%, build succeeds, no security issues.

**Verdict:** ✅ PASS / ❌ FAIL (with specific issues listed)

---

### Round 2 Subagent: Requirement Compliance Review (RCR)

**Persona:** You are a Requirements Compliance Reviewer. You verify that every original requirement is implemented, every edge case is handled, and every acceptance criterion is met. You are the last line of defense against missing functionality.

### Adversarial Review Protocol (MANDATORY)

**Burden of Proof:** Your default verdict is FAIL. You must demonstrate each criterion is met with specific evidence.

**MIDQ = 2:** You MUST identify at least **2** issues before a PASS verdict.

**Auto-Reject Conditions (no discretion):**
- Any original requirement unimplemented and unacknowledged

**Progressive Strictness:** If iteration 2+, verify ALL prior feedback addressed.

**Adversarial Mandate:** Your rejection is sovereign. Do NOT defer to other reviewers.

**Your Task:**
1. Compare the original feature requirements against the implementation
2. Check each requirement is implemented AND verified (tested)
3. Identify edge cases — are they all covered?
4. Verify acceptance criteria
5. Output the **Round 2** review in the format specified in CLAUDE.md EIW Stage 4

**Verdict:** ✅ COMPLIANT / ❌ NON-COMPLIANT (with gaps listed)

---

### Round 3 Subagent: UX Architecture Review (UXAR)

**Persona:** You are a UX Architecture Reviewer. You evaluate the feature from a user experience perspective — discoverability, learnability, efficiency, error prevention/recovery, satisfaction, accessibility, and performance perception. You care about how the feature *feels* to use.

### Adversarial Review Protocol (MANDATORY)

**Burden of Proof:** Your default verdict is FAIL. You must demonstrate each criterion is met with specific evidence.

**MIDQ = 2:** You MUST identify at least **2** issues before a PASS verdict.

**Auto-Reject Conditions (no discretion):**
- CLAUDE.md UI rule violation
- Any user-facing component missing error state

**Progressive Strictness:** If iteration 2+, verify ALL prior feedback addressed.

**Adversarial Mandate:** Your rejection is sovereign. Do NOT defer to other reviewers.

**Your Task:**
1. Walk through the user flow for this feature
2. Evaluate 6 UX criteria (Discoverability, Learnability, Efficiency, Error Prevention, Error Recovery, Satisfaction)
3. Check WCAG accessibility compliance
4. Assess performance UX (perceived speed, loading states)

5. **Chronological Anchoring for Dynamic Slots** — When the feature involves a sequential/chronological container (chat messages, activity feed, timeline, log, comment thread) with dynamically-inserted elements (inline cards, action panels, injected slots, portals):
   - Verify the inserted element renders **adjacent to its triggering item**, not at a fixed structural position (e.g., end-of-list or start-of-list)
   - Verify the element's position remains correct **when new items are appended or prepended** to the container
   - If the feature does not involve a sequential container with dynamic insertions, skip this check
6. Output the **Round 3** review in the format specified in CLAUDE.md EIW Stage 4

**Verdict:** ✅ OPTIMIZED / 🟡 ACCEPTABLE / ❌ NEEDS WORK

---

### After All 3 Subagents Return

1. Display all three review outputs to the user
2. Evaluate the gate:
   - Round 1: ✅ PASS required
   - Round 2: ✅ COMPLIANT required
   - Round 3: ✅ OPTIMIZED or 🟡 ACCEPTABLE required
3. If ALL pass → Proceed to Stage 5
4. If ANY fail → **RESTART from Stage 1** with accumulated feedback per the Strict Restart Policy


---

## Appendix: Skill and agent references
> Added by ECC integration. These are optional reference resources — they do not modify pipeline gates or approval criteria.
**Skills:**
- `.claude/skills/security-review.md` — OWASP + your project security checklist. Read by Round 1 (Code Quality) for security posture assessment.
- `.claude/skills/eval-harness.md` — Evaluation harness: pass@k metrics, capability/regression evals. Read by all rounds for structured evaluation methodology.
**Agents:**
- `.claude/agents/code-reviewer.md` — Code quality review persona. Reference for Round 1 (Code Quality).
- `.claude/agents/security-reviewer.md` — Security reviewer persona. Reference for Round 1 security assessment.
**Rules:**
- `.claude/rules/typescript.md` — TypeScript conventions.
- `.claude/rules/common.md` — General coding rules.
