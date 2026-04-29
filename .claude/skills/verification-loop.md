# Verification loop

> **Deference:** This skill supplements CLAUDE.md pipeline verification. On conflict, CLAUDE.md governs. This skill does NOT replace pipeline-specific quality gates (DRW D4, EIW Stage 3, SE Phase 7).

## Purpose

A 6-phase sequential verification gate to run after completing a feature, before creating a PR, or at any checkpoint where code integrity must be confirmed.

## When to use

- After completing a feature or significant code change
- Before creating a pull request
- At DRW D4 (Verification), EIW Stage 3 (Checkpoint), SE Phase 7 (Testing)
- After refactoring across multiple files
- When switching context back to a previously modified area

## Protocol

Execute phases sequentially. If any blocking phase fails, STOP, fix, and re-run from Phase 1.

### Phase 1: Build verification

```bash
cd <your-app> && npm run build 2>&1 | tail -30
```

**Pass criteria:** Exit code 0, no compilation errors.
**Blocking:** Yes -- all subsequent phases depend on a successful build.

### Phase 2: Type check

```bash
cd <your-app> && npx tsc --noEmit 2>&1 | head -50
```

**Pass criteria:** Zero type errors.
**Blocking:** Yes.

### Phase 3: Lint check

```bash
cd <your-app> && npm run lint 2>&1 | head -50
```

**Pass criteria:** Zero errors (warnings acceptable but should be minimized).
**Blocking:** Yes for errors, no for warnings.

### Phase 4: Test suite

```bash
cd <your-app> && npm run test 2>&1 | tail -50
```

For coverage verification:
```bash
cd <your-app> && npm run test:coverage 2>&1 | tail -30
```

**Pass criteria:** All tests pass, coverage >= 80%.
**Blocking:** Yes.

### Phase 5: Security scan

Check for leaked secrets and debug artifacts:

```bash
# Hardcoded secrets (API keys, tokens)
grep -rn "sk-\|sk_live\|sk_test" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | head -10

# Hardcoded database client/your payment provider keys (not env refs)
grep -rn "eyJ\|whsec_\|pk_live\|pk_test" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | head -10

# console.log in production code (not test files)
grep -rn "console\.log" --include="*.ts" --include="*.tsx" src/ --exclude="*.test.*" 2>/dev/null | head -10

# .env files tracked by git
git ls-files | grep -E "\.env$|\.env\.local$" | head -5
```

**Pass criteria:** No hardcoded secrets. Minimal console.log (zero in Server Actions/API routes). No .env files tracked.
**Blocking:** Yes for secrets, advisory for console.log.

### Phase 6: Diff review

```bash
git diff --stat
git diff --name-only
```

Review each changed file for:
- Unintended changes (reverted formatting, stale debug code)
- Missing error handling on new async operations
- database queries without `.eq()` guards or RLS assumptions
- Server Actions missing auth checks

**Pass criteria:** All changes intentional and reviewed.
**Blocking:** Advisory.

## Output format

After all phases, produce:

```
VERIFICATION REPORT
===================

Build:     [PASS/FAIL]
Types:     [PASS/FAIL] (N errors)
Lint:      [PASS/FAIL] (N errors, M warnings)
Tests:     [PASS/FAIL] (X/Y passed, Z% coverage)
Security:  [PASS/FAIL] (N issues)
Diff:      [N files changed, +A/-R lines]

Overall:   [READY / NOT READY] for PR

Issues to fix:
1. ...
```

## Quality gates

| Gate | Criteria | Blocking |
|------|----------|----------|
| Build | Exit code 0 | Yes |
| Types | Zero errors | Yes |
| Lint | Zero errors | Yes |
| Tests | All pass, >= 80% coverage | Yes |
| Security | No hardcoded secrets | Yes |
| Diff | Manual review complete | Advisory |

## Common pitfalls

- **Running verification in the wrong directory** -- always `cd <your-app>` first; the monorepo root does not have the right scripts.
- **Ignoring type errors as "just warnings"** -- TypeScript errors are blocking. `tsc --noEmit` must exit clean.
- **Skipping Phase 5 because "it's just a UI change"** -- secrets can leak into any file. Always run the scan.
- **Treating this as a replacement for pipeline gates** -- this is a quick health check. DRW D4, EIW Stage 3, and SE Phase 7 have additional criteria beyond what this loop covers.

<!-- ECC-2026: enhancement -->
## Related agents

code-reviewer, build-error-resolver, security-reviewer
