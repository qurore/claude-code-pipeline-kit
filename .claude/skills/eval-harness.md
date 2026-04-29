# Eval harness

> **Deference:** This skill supplements CLAUDE.md pipeline quality gates. On conflict, CLAUDE.md governs. Evals do NOT replace pipeline phases -- they provide an additional quality signal.

## Purpose

Formal evaluation framework for measuring agent and feature reliability using pass@k metrics, capability/regression eval types, and structured grading. Treats evals as "unit tests for AI-assisted development."

## When to use

- Defining success criteria before implementing an AI-assisted feature
- Measuring reliability of your state-machine framework agent nodes (codebase-analysis, blueprint generation)
- Creating regression suites for prompt or model changes (`LLM_MODEL`)
- Benchmarking pipeline output quality across your LLM model versions
- Validating that a change does not degrade existing LLM-dependent behavior

## Protocol

### Phase 1: Define evals (before coding)

Create an eval definition at `.claude/evals/<feature-name>.md`:

```markdown
## Eval definition: <feature-name>

### Capability evals
1. [Description of new capability to verify]
2. [Description of new capability to verify]

### Regression evals
1. [Existing behavior that must not break]
2. [Existing behavior that must not break]

### Success metrics
- Capability: pass@3 >= 0.90
- Regression: pass^3 = 1.00
```

### Phase 2: Implement

Write code to satisfy the defined evals.

### Phase 3: Evaluate

Run each eval and record PASS/FAIL per attempt.

### Phase 4: Report

Produce a structured eval report:

```
EVAL REPORT: <feature-name>
===========================

Capability evals:
  <eval-1>:  PASS (pass@1)
  <eval-2>:  PASS (pass@2)
  Overall:   N/N passed

Regression evals:
  <eval-1>:  PASS
  <eval-2>:  PASS
  Overall:   N/N passed

Metrics:
  pass@1: X% (N/M)
  pass@3: X% (N/M)

Status: [READY FOR REVIEW / NEEDS WORK]
```

## Grader types

### 1. Code-based grader (deterministic)

Assertions using Vitest or CLI exit codes:

```bash
# Test suite passes
cd <your-app> && npm run test -- --testPathPattern="feature" && echo "PASS" || echo "FAIL"

# Build succeeds
cd <your-app> && npm run build && echo "PASS" || echo "FAIL"

# Expected output pattern exists
grep -q "export function targetFunction" src/lib/target.ts && echo "PASS" || echo "FAIL"
```

### 2. Rule-based grader (schema/regex)

Validate output structure without LLM judgment:

```typescript
// Zod schema validation as grader
const result = OutputSchema.safeParse(agentOutput)
console.log(result.success ? "PASS" : "FAIL")
```

### 3. Model-based grader (LLM-as-judge)

Use for open-ended quality assessment. Define a rubric:

```markdown
Evaluate the wiki output:
1. Does it correctly identify business domains? (1-5)
2. Are technical domains properly classified? (1-5)
3. Is the hierarchy depth appropriate (4-5 levels)? (1-5)
4. Are concrete artifacts (tables, routes, types) present? (1-5)

Score >= 16/20: PASS
```

### 4. Human grader (manual review)

Flag for manual adjudication when automated grading is insufficient:

```markdown
[HUMAN REVIEW REQUIRED]
Change: <description>
Reason: <why automated grading is insufficient>
```

## Metrics

| Metric | Formula | Use case |
|--------|---------|----------|
| pass@1 | Success on first attempt | Direct reliability |
| pass@3 | At least 1 success in 3 attempts | Practical reliability |
| pass^3 | All 3 attempts succeed | Stability for critical paths |

**Recommended thresholds:**
- Capability evals: pass@3 >= 0.90
- Regression evals: pass^3 = 1.00 for release-critical paths

## Eval storage

```
.claude/
  evals/
    <feature>.md          # Eval definition
    <feature>.log         # Run history (append-only)
```

## Quality gates

| Gate | Criteria | Blocking |
|------|----------|----------|
| Definition exists | Eval file created before implementation | Yes |
| Capability threshold | pass@3 >= 0.90 | Yes |
| Regression threshold | pass^3 = 1.00 for critical paths | Yes |
| Report produced | Structured report generated | Yes |

## Eval anti-patterns

- **Overfitting prompts to known eval examples** -- evals should test generalized capability, not memorized responses.
- **Happy-path-only measurement** -- always include edge cases, error scenarios, and boundary inputs in eval definitions.
- **Ignoring cost/latency while chasing pass rates** -- track token usage and response time alongside correctness.
- **Flaky graders in release gates** -- code-based graders preferred for blocking gates; model-based graders for advisory signals.
- **Skipping regression evals for "small" changes** -- prompt and model changes can cascade unpredictably.

## Common pitfalls

- **Not versioning evals** -- eval definitions are first-class artifacts; commit them alongside code.
- **Running evals against production APIs** -- use test/staging environments to avoid cost and data contamination.
- **Confusing evals with unit tests** -- evals measure non-deterministic AI behavior; unit tests verify deterministic logic. Both are needed.

<!-- ECC-2026: enhancement -->
## Related agents

architect, tdd-guide
