# Test coverage analysis

Standalone utility — does not invoke pipeline phases (SE, EIW, DRW).

## Usage

```
/test-coverage [optional: path or glob pattern]
```

Examples:
- `/test-coverage` — full project coverage report
- `/test-coverage src/lib/ai/` — scoped to a directory

## Protocol

### 1. Run coverage

```bash
cd <your-app> && npm run test:coverage
```

If a path argument is provided, scope the run:
```bash
cd <your-app> && npx vitest run --coverage <path>
```

### 2. Parse results

Extract per-file metrics: line, branch, function, statement coverage.

### 3. Identify gaps

Flag files that fall below the **80% minimum** threshold on any metric. Sort by severity (lowest coverage first).

### 4. Report

```
## Coverage report

### Summary
| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Lines | N% | 80% | pass/fail |
| Branches | N% | 80% | pass/fail |
| Functions | N% | 80% | pass/fail |
| Statements | N% | 80% | pass/fail |

### Files below threshold ([N] files)
| File | Lines | Branches | Functions | Statements |
|------|-------|----------|-----------|------------|
| [path] | N% | N% | N% | N% |

### Uncovered files (no test file found)
| Source file | Suggested test file |
|-------------|-------------------|
| [path] | [path.test.ts] |

### Recommended test priorities
1. [file] — [reason: lowest coverage / high complexity / critical path]
2. ...
```

### 5. Suggest next steps

For each file below threshold, briefly describe what tests are missing (e.g., "missing edge case for empty input", "no error path coverage").

### Reference files
- Skill: `.claude/skills/tdd-guide.md`
- Agent: `.claude/agents/tdd-guide.md`
