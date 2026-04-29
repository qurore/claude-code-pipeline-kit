# Status checkpoint

Standalone utility — does not invoke pipeline phases (SE, EIW, DRW).

## Usage

```
/checkpoint
```

Quick health check of the current codebase state.

## Protocol

Run each check **in sequence**. Do not stop on failure — run all checks and report.

### 1. Build
```bash
cd <your-app> && npm run build
```

### 2. Type check
```bash
cd <your-app> && npx tsc --noEmit
```

### 3. Lint
```bash
cd <your-app> && npm run lint
```

### 4. Tests
```bash
cd <your-app> && npm run test
```

### 5. Active pipelines
```bash
node .claude/hooks/bin/sentinel-cli.mjs list
```
Parse the JSON array. Always show the section header, even when empty.

## Report

```
## Checkpoint: [timestamp]

| Check | Status | Details |
|-------|--------|---------|
| Build | pass/fail | [summary] |
| Types | pass/fail | [N errors] |
| Lint | pass/fail | [N errors, M warnings] |
| Tests | pass/fail | [N passed, M failed] |

### Active pipelines

| Pipeline | Run ID | Phase | Iteration | Stop injections |
|----------|--------|-------|-----------|-----------------|
| se       | <id>   | 5     | 1/4       | 🟢 1/8           |
| eiw      | <id>   | eiw-stage6 | 2/4 | ⚠️ 6/8           |

Icons by ratio of stop_injections to cap (default cap = 8): 🟢 0–37%, 🟡 38–62%, ⚠️ ≥63%.
When zero in-progress runs, print: "No active pipelines."

Overall: ALL CLEAR / [N] ISSUES
```

### Next steps (on failure)

For each failed check, provide a concrete next action:
- **Build failure** — identify the breaking file and error. Suggest fix or run `/defect-fix`.
- **Type errors** — list affected files. Suggest targeted fixes.
- **Lint errors** — list auto-fixable vs manual. Suggest `npm run lint -- --fix` if applicable.
- **Test failures** — list failing test names. Suggest re-running specific tests for debugging.
