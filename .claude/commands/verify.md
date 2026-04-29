# Verification loop

Standalone utility — does not invoke pipeline phases (SE, EIW, DRW).

## Usage

```
/verify
```

Runs the full 6-phase verification loop and reports readiness.

## Protocol

Execute each phase **in sequence**. Stop on first failure unless instructed otherwise.

### Phase 1: Build
```bash
cd <your-app> && npm run build
```
Record: pass/fail, error count.

### Phase 2: Type check
```bash
cd <your-app> && npx tsc --noEmit
```
Record: pass/fail, error count, affected files.

### Phase 3: Lint
```bash
cd <your-app> && npm run lint
```
Record: pass/fail, warning count, error count.

### Phase 4: Tests
```bash
cd <your-app> && npm run test
```
Record: pass/fail, test count, failure count, coverage summary.

### Phase 5: Security scan
- Check for hardcoded secrets (API keys, tokens, passwords) in staged/changed files.
- Verify no `.env` files are staged.
- Check for `dangerouslySetInnerHTML` usage without sanitization.

### Phase 6: Diff review
- Run `git diff` to review all uncommitted changes.
- Flag any unintended modifications, debug logging, or commented-out code.

## Verdict

After all phases complete, report:

```
## Verification result: READY / NOT READY

| Phase | Status | Details |
|-------|--------|---------|
| Build | pass/fail | [summary] |
| Types | pass/fail | [summary] |
| Lint | pass/fail | [summary] |
| Tests | pass/fail | [summary] |
| Security | pass/fail | [summary] |
| Diff | pass/fail | [summary] |
```

**READY** = all phases pass. **NOT READY** = any phase fails (list remediation steps).

### Reference files
- Skill: `.claude/skills/verification-loop.md`
- Agent: `.claude/agents/build-error-resolver.md`
