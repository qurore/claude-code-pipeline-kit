# SE Phase 7: Testing

You are executing **SE Pipeline Phase 7: Dedicated Testing Phase** for the feature described by the user.

> **Configuration Note:** This phase uses `$TEST_CMD`, `$TEST_COVERAGE_CMD`, `$TEST_E2E_CMD`. Configure these in your project's CLAUDE.md (e.g., `$TEST_CMD = "npm run test"`, `$TEST_COVERAGE_CMD = "npm run test:coverage"`, `$TEST_E2E_CMD = "npm run test:e2e"`).

## Phase Purpose

Execute a comprehensive testing phase beyond TDD unit tests. This includes integration testing, E2E testing, performance testing, security testing, and coverage validation. This phase ensures the implementation is production-ready from a quality perspective.

## Prerequisites

- Phase 6 Implementation must have ALL task group checkpoints PASSED

## Progress Reporting (MANDATORY)

Before each sub-step, output a progress line to the terminal:

```
───────────────────────────────────────────────────────
 SE Phase 7: Testing | Step X: [Step Name]
───────────────────────────────────────────────────────
```

Use these step names:
- `Step A: Discussion & Ideation (Tri-Persona)`
- `Step B: Test Strategy Convergence`
- `Step C: Test Execution`
- `Step D: Test Quality Gate`

At step completion, output: `  ✓ Phase 7 Step X complete → Proceeding to Step Y`
On rejection: `  ✗ Phase 7 Step D: REJECTED → [Restart target]`

---

## Sub-Step Execution Protocol

Execute all 4 sub-steps sequentially. Each sub-step spawns a subagent via the **Task tool** with `subagent_type: "general-purpose", model: "opus"`.

---

### Step A: Discussion & Ideation (Tri-Persona Protocol)

Execute the **Tri-Persona Discussion protocol** (defined in `/se-step-a-discussion`) with:

- `$PHASE_NUMBER` = 7
- `$PHASE_NAME` = "Testing"
- `$PHASE_CONTEXT` = Phase 4 + Phase 5 + Phase 6 Deliverables (`$PHASE_4_DELIVERABLE`, `$PHASE_5_DELIVERABLE`, `$PHASE_6_SUMMARY`) + `$ACCUMULATED_FEEDBACK`
- `$DISCUSSION_TOPIC` = "What are the coverage gaps, edge cases, and attack surfaces we haven't tested? Where is the implementation most likely to break under real usage?"

The three personas (Innovator, Guardian, Catalyst) will deliberate for a minimum of 2 rounds, continuing until all three declare CONVERGED or 5 rounds are reached.

### After Step A Returns

Display the full Tri-Persona Discussion Summary to the user. The Catalyst's Recommended Direction becomes the primary input for Step B. Proceed to Step B.

---

### Step B: Critical Thinking Convergence

Spawn a subagent with the following prompt (include Step A output):

---

**Persona:** You are the **Test Strategy Convergence Analyst**. You prioritize and finalize the test plan. You are practical — you focus testing effort on highest-risk areas first.

**Step A Output:** [Include full Step A output]

**Your Task:**

1. **Prioritize Test Cases** — Rank by risk x impact. HIGH priority tests are mandatory; LOW are nice-to-have.
2. **Group by Test Type** — Organize into: Unit, Integration, E2E, Security.
3. **Estimate Effort** — T-shirt size each test case.
4. **Define Pass Criteria** — Explicit criteria for Phase 7 to pass:
   - Coverage thresholds
   - Zero test failures
   - Security test pass rate

**Output Format:**

```
## 【Phase 7B: Test Strategy Convergence Report】

### Prioritized Test Plan

#### HIGH Priority (Mandatory)
| # | Test Case | Type | Effort | File |
|---|-----------|------|--------|------|
| 1 | [Test] | Unit | S | [file.test.ts] |

#### MEDIUM Priority (Should Do)
[Same format]

#### LOW Priority (Nice-to-Have)
[Same format]

### Pass Criteria
| Metric | Threshold | Current |
|--------|-----------|---------|
| Line coverage | ≥80% | [TBD] |
| Branch coverage | ≥80% | [TBD] |
| Test failures | 0 | [TBD] |
| Security tests pass | 100% | [TBD] |
```

---

### After Step B Returns

Display the Test Strategy. Proceed to Step C.

---

### Step C: Test Execution

Spawn a subagent via the **Task tool** with `subagent_type: "general-purpose", model: "opus"`:

---

**Persona:** You are the **Test Engineer**. You write and execute tests methodically. You write clean, maintainable tests that serve as documentation. You are thorough and leave no gap uncovered.

**Step B Test Plan:** [Include Step B output]
**Phase 5 Technical Design Document:** $PHASE_5_DELIVERABLE

**Your Task:**

1. **Write ALL HIGH priority tests** — Create test files, write tests, run them.
2. **Write MEDIUM priority tests** — If time allows after HIGH tests pass.
3. **Run Full Test Suite** — Execute:
   - `$TEST_CMD` (all unit/integration tests)
   - `$TEST_COVERAGE_CMD` (coverage report)
   - `$TEST_E2E_CMD` (if E2E tests were added)
4. **Generate Test Report** — Document all results.

**For each test:**
1. Create the test file (or add to existing)
2. Write the test with clear Arrange-Act-Assert structure
3. Run the test to verify it passes
4. If it fails, investigate and fix the implementation (not the test, unless the test is wrong)

**Output Format:**

```
## 【Phase 7C: Test Execution Report】

### Tests Written
| # | Test File | Test Name | Type | Status |
|---|-----------|-----------|------|--------|
| 1 | [file] | [name] | Unit | ✅/❌ |

### Test Suite Results
| Suite | Passed | Failed | Skipped | Duration |
|-------|--------|--------|---------|----------|
| Unit | [N] | [N] | [N] | [Ns] |
| Integration | [N] | [N] | [N] | [Ns] |
| E2E | [N] | [N] | [N] | [Ns] |

### Coverage Report
| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Lines | [%] | 80% | ✅/❌ |
| Branches | [%] | 80% | ✅/❌ |
| Functions | [%] | 80% | ✅/❌ |
| Statements | [%] | 80% | ✅/❌ |

### Failed Tests (if any)
| # | Test | Failure Reason | Fix Applied |
|---|------|----------------|-------------|
| 1 | [test] | [reason] | [fix] |

### Security Test Results
| # | Test Case | Result | Notes |
|---|-----------|--------|-------|
| 1 | [test] | ✅ PASS / ❌ FAIL | [notes] |
```

---

### Step C2: Visual Testing (Non-Blocking, Optional)

If browser automation tools (e.g., Playwright MCP) are available, execute visual verification for each user-facing route affected by this feature. If tools are unavailable, output `SKIPPED: Browser automation tools unavailable` and proceed — this step is NON-BLOCKING.

**Per-Route Protocol:**
1. Navigate to the target URL
2. Capture accessibility snapshot
3. Take screenshot for visual state evidence
4. Check for runtime console errors
5. Assert: no console errors, snapshot contains expected elements, screenshot captured

**Failure Classification:**
- **BUG** — Implementation defect (visual broken, console errors) → restart Phase 6
- **SPEC_CHANGE** — Design changed, test expectation outdated → update test in this phase
- **PARTIAL** — Navigate succeeded but screenshot failed → record as PARTIAL, proceed

**Visual Evidence Report (append to Step C output):**

```
### Visual Evidence
| # | Route | Snapshot | Screenshot | Console | Status |
|---|-------|----------|------------|---------|--------|
| 1 | [/path] | ✅/❌ | ✅/❌/PARTIAL | Clean/[N] errors | PASS/FAIL/PARTIAL/SKIPPED |
```

---

### After Step C Returns

Display the Test Report (including Visual Evidence if generated). Proceed to Step D.

---

### Step D: Test Quality Gate

Spawn a subagent with the following prompt (include Step C report):

---

**Persona:** You are the **Test Quality Reviewer**. You are the quality gate for Phase 7. You verify that testing is adequate for production readiness.

**Phase 7 Test Report:** [Include Step C output]
**Phase 4 SRS:** $PHASE_4_DELIVERABLE

**Your Task:** Validate test quality against these criteria:

1. **Coverage Gate** — Line coverage ≥80%, Branch coverage ≥80%, Function coverage ≥80%.
2. **Zero Failures** — All tests pass. Zero test failures.
3. **Requirement Coverage** — Every P1 FR has at least one test. Every P2 FR has at least one test.
4. **Edge Case Coverage** — HIGH priority edge cases from Step A are all tested.
5. **Security Tests** — All security test cases pass.
6. **E2E Coverage** — Happy path and primary error recovery flows are tested (if applicable).

**Output Format:**

```
## 【Phase 7D: Test Quality Review】

### Quality Gate
| # | Criterion | Status | Details |
|---|----------|--------|---------|
| 1 | Coverage ≥80% | ✅/❌ | Lines: [%], Branches: [%], Functions: [%] |
| 2 | Zero failures | ✅/❌ | [N] passed, [N] failed |
| 3 | Requirement coverage | ✅/❌ | [N]/[N] FRs tested |
| 4 | Edge case coverage | ✅/❌ | [N]/[N] HIGH cases tested |
| 5 | Security tests pass | ✅/❌ | [N]/[N] passed |
| 6 | E2E coverage | ✅/❌ | [N] scenarios tested |
| 7 | Visual evidence | ✅/SKIPPED | NON-BLOCKING: SKIPPED is a valid pass when browser automation unavailable |

### Phase 7 Verdict: ✅ APPROVED / ❌ REJECTED
**Rationale:** [Explanation]

### Corrections Required (if rejected)
1. [Correction — typically "write more tests" or "fix failing tests"]
```

---

### After Step D Returns

1. Display the Test Quality Review to the user.
2. If ✅ APPROVED → Phase 7 is complete. Proceed to Phase 8.
3. If ❌ REJECTED due to test failures or coverage gaps:
   - If tests reveal implementation bugs → **Cross-phase restart to Phase 6** (counts against restart limit)
   - If just missing tests → **Internal restart from Step C** (FREE restart) to write additional tests.
