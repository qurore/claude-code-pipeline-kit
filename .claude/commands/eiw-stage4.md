# EIW Stage 4: Final 3-Round Review

You are executing **EIW Stage 4: Final Multi-Perspective Review** after all Task Groups are complete.

> **Project Configuration Required:** This workflow uses the following command variables that must be defined in your project's `CLAUDE.md`:
> - `$TEST_CMD` — Run all unit/integration tests (e.g., `npm run test -- --run`, `pytest`, `cargo test`)
> - `$BUILD_CMD` — Build the project (e.g., `npm run build`, `cargo build --release`)
> - `$LINT_CMD` — Run linting (e.g., `npm run lint`, `ruff check .`, `cargo clippy`)
> - `$TYPE_CHECK_CMD` — Run type checking (e.g., `npm run type-check`, `mypy .`, `tsc --noEmit`)
> - `$TEST_COVERAGE_CMD` — Run tests with coverage (e.g., `npm run test:coverage`, `pytest --cov`)

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

**Your Task:**
1. Run: `$TYPE_CHECK_CMD`, `$LINT_CMD`, `$BUILD_CMD`
2. Run: `$TEST_CMD`, `$TEST_COVERAGE_CMD`
3. Review all modified files for code quality
4. Output the **Round 1** review in the format specified in CLAUDE.md EIW Stage 4

**Gate Criteria:** All tests pass, coverage ≥80%, build succeeds, no security issues.

**Verdict:** ✅ PASS / ❌ FAIL (with specific issues listed)

---

### Round 2 Subagent: Requirement Compliance Review (RCR)

**Persona:** You are a Requirements Compliance Reviewer. You verify that every original requirement is implemented, every edge case is handled, and every acceptance criterion is met. You are the last line of defense against missing functionality.

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

**Your Task:**
1. Walk through the user flow for this feature
2. Evaluate 6 UX criteria (Discoverability, Learnability, Efficiency, Error Prevention, Error Recovery, Satisfaction)
3. Check WCAG accessibility compliance
4. Assess performance UX (perceived speed, loading states)
5. Output the **Round 3** review in the format specified in CLAUDE.md EIW Stage 4

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
