# Quality gate

Standalone utility — does not invoke pipeline phases (SE, EIW, DRW).

## Usage

```
/quality-gate [optional: path or glob pattern]
```

Examples:
- `/quality-gate` — full project check
- `/quality-gate src/lib/ai/` — scoped to a directory
- `/quality-gate src/components/wiki/**` — scoped via glob

## Protocol

Run the following checks. If a path argument is provided, scope checks to that path where possible.

### 1. Type check
```bash
cd <your-app> && npx tsc --noEmit
```
Filter output to scoped path if provided. Record: pass/fail, error list.

### 2. Lint
```bash
cd <your-app> && npx next lint [--dir <path> if scoped]
```
Record: pass/fail, error count, warning count.

### 3. Test coverage
```bash
cd <your-app> && npm run test:coverage [-- --reporter=text <path> if scoped]
```
Record: pass/fail, coverage percentages (line, branch, function, statement).

### Thresholds

| Metric | Minimum | Target |
|--------|---------|--------|
| Line coverage | 80% | 90% |
| Branch coverage | 80% | 85% |
| Function coverage | 80% | 90% |
| Statement coverage | 80% | 90% |

## Report

```
## Quality gate: PASS / FAIL

| Check | Status | Details |
|-------|--------|---------|
| Type check | pass/fail | [N errors in M files] |
| Lint | pass/fail | [N errors, M warnings] |
| Coverage (line) | pass/fail | [N%] |
| Coverage (branch) | pass/fail | [N%] |
| Coverage (function) | pass/fail | [N%] |
| Coverage (statement) | pass/fail | [N%] |

### Failures
[List each failure with file path and description]
```

### Reference files
- Skill: `.claude/skills/coding-standards-supplement.md`
- Agent: `.claude/agents/code-reviewer.md`
