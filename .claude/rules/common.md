# Common rules

> Supplements CLAUDE.md. Rules here do NOT duplicate CLAUDE.md (Pipeline Governance, Intent Classification, UI Design Standards, Sentence-Case, Button Layout Stability, Text Color Hierarchy). When conflicts arise, CLAUDE.md wins.

## Development workflow

### Rule: research before implementation
**Rationale:** Proven solutions reduce risk and implementation time. Check existing codebase patterns, library docs, and package registries before writing net-new code.
**Example:** Before implementing a utility, search `src/lib/` for existing implementations. Before adding a dependency, check if the platform (Next.js, database client) already provides the capability.
> See also: `research-protocol.md` "Search-first principle" section for the full investigation protocol.

### Rule: plan before coding
**Rationale:** Complex features require decomposition before implementation. Identify dependencies, risks, and affected layers (UI, API, data model, type system, integration, state).

### Rule: TDD workflow is mandatory for non-trivial changes
**Rationale:** RED-GREEN-REFACTOR prevents confirmation bias. Write the failing test first, implement to pass, then refactor.

### Rule: code review after every implementation
**Rationale:** Self-review catches issues before they compound. Use the code-reviewer agent or checklist: CRITICAL/HIGH/MEDIUM/LOW severity.

## Coding style

### Rule: immutability by default
**Rationale:** Mutation causes hidden side effects in React rendering, state management, and concurrent operations. Always create new objects.

### Rule: many small files over few large files
**Rationale:** High cohesion, low coupling. 200-400 lines typical, 800 max per CLAUDE.md. Extract utilities from large modules. Organize by feature/domain, not by type.

### Rule: comprehensive error handling at every level
**Rationale:** Unhandled errors cascade into user-facing failures. Handle errors explicitly, provide user-friendly messages in UI code, log detailed context server-side. Never silently swallow errors.

### Rule: validate at system boundaries
**Rationale:** External data (user input, API responses, webhook payloads, LLM output) is untrusted. Validate with Zod schemas at entry points. Fail fast with clear error messages.

### Rule: no hardcoded values
**Rationale:** Use constants, config, or environment variables. Magic numbers and inline strings make code fragile and hard to update.

## Patterns

### Rule: repository pattern for data access
**Rationale:** Encapsulates storage details behind a consistent interface. Enables testing with mocks and swapping data sources.

### Rule: consistent API response envelope
**Rationale:** All API responses should include success indicator, data payload, error field, and pagination metadata when applicable.

### Rule: search for existing implementations first
**Rationale:** Before writing a new utility or pattern, search the codebase for existing implementations. Prefer adopting a proven approach over creating a duplicate.

## Security

### Rule: mandatory pre-commit security checks
**Rationale:** Catching vulnerabilities before commit is cheaper than production incidents.
**Checklist:**
- No hardcoded secrets (API keys, passwords, tokens)
- All user inputs validated
- SQL injection prevention (parameterized queries or database client)
- XSS prevention (React auto-escaping, no raw `dangerouslySetInnerHTML`)
- Authentication/authorization verified on Server Actions and API routes
- Error messages do not leak internal details

### Rule: secrets in environment variables only
**Rationale:** Source code is versioned and shared. Secrets must live in env vars or a secret manager. Validate presence at startup.

### Rule: comprehensive remediation for security issues
**Rationale:** When a vulnerability is found, search the entire codebase for similar patterns per CLAUDE.md. Partial fixes are unacceptable.

## Performance

### Rule: context window awareness
**Rationale:** Avoid large-scale operations in the last 20% of context window. Lower-sensitivity tasks (single-file edits, docs) tolerate degraded context better than multi-file refactoring.

### Rule: use build-error-resolver for build failures
**Rationale:** Build errors should be resolved with minimal diffs. Use the dedicated agent rather than attempting architectural changes to fix compilation.

## Testing

### Rule: 80% coverage minimum
**Rationale:** Per CLAUDE.md, 80% minimum across line, branch, function, statement. 90% target.

### Rule: all test types required
**Rationale:** Unit tests alone miss integration bugs. Integration tests alone miss UI issues. E2E tests alone are slow and fragile. Use all three for complete coverage.

| Change type | Tests required |
|-------------|---------------|
| Utility function | Unit |
| React component | Unit |
| API route | Unit + integration |
| Full feature | Unit + integration + E2E |
| Bug fix | Regression test |

### Rule: fix implementation, not tests
**Rationale:** When tests fail, the implementation is wrong unless the test was based on incorrect requirements. Changing tests to match broken code masks regressions.

## Git workflow

### Rule: conventional commit format
**Rationale:** Structured commit messages enable automated changelogs and clear history.
**Format:** `<type>: <description>` where type is one of: feat, fix, refactor, docs, test, chore, perf, ci.

### Rule: comprehensive PR summaries
**Rationale:** Analyze full commit history with `git diff [base-branch]...HEAD`, not just the latest commit. Include test plan with actionable TODOs.

## Agent orchestration

### Rule: use parallel execution for independent operations
**Rationale:** Independent analysis tasks (security review, performance review, type checking) should run concurrently, not sequentially.

### Rule: match agent to task
**Rationale:** Each agent has a specific purpose. Using the wrong agent produces suboptimal results.

| Task | Agent |
|------|-------|
| Architecture decisions | architect |
| New features / bug fixes | tdd-guide |
| After writing code | code-reviewer |
| Security concerns | security-reviewer |
| Build failures | build-error-resolver |

<!-- ECC-2026: additional rules from battle-tested patterns -->

### Rule: file size discipline
**Rationale:** Large files are harder to review, test, and maintain. They indicate missed decomposition opportunities.
**Thresholds:** 200-400 lines typical, 800 lines absolute max. Functions under 50 lines. React components under 200 lines JSX.

### Rule: defensive coding patterns
**Rationale:** Guard clauses and early returns reduce nesting and improve readability.
**Example:**
```typescript
// Preferred: early return
function processItem(item: Item | null) {
  if (!item) return null
  if (!item.children?.length) return item
  // ... main logic at base indentation
}
```

### Rule: dependency management
**Rationale:** Every dependency is a liability. Prefer platform capabilities (Next.js, Node.js built-ins) over third-party packages.
**Checklist:** (1) Does the platform provide this? (2) Does an existing codebase utility cover this? (3) Is the package actively maintained? (4) What is the bundle size impact?

### Rule: logging standards
**Rationale:** Structured logging enables debugging without exposing sensitive data.
**Rules:**
- No `console.log` in production code (use proper logging)
- Never log secrets, tokens, passwords, or PII
- Server-side errors: log error context (operation, user ID, route)
- Client-side: use error boundaries, not console.error
