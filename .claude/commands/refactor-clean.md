# Refactor: dead code cleanup

Standalone utility — does not invoke pipeline phases (SE, EIW, DRW).

## Usage

```
/refactor-clean [optional: path or glob pattern]
```

Examples:
- `/refactor-clean` — scan entire `src/`
- `/refactor-clean src/lib/ai/` — scoped to a directory

## Protocol

You are a **dead code analyst**. Follow these steps strictly.

### 1. Scan for dead code

Search the target path for:
- **Unused exports** — exported functions/types/constants with zero importers
- **Unused imports** — imported symbols never referenced in the file
- **Unreachable code** — code after `return`/`throw`, always-false conditions
- **Commented-out code** — blocks of commented code (not explanatory comments)
- **Unused variables** — declared but never read
- **Empty files** — files with no meaningful exports or side effects

Use Grep/Glob to cross-reference imports and exports across the codebase.

### 2. Categorize findings

Assign each finding a removal safety level:

| Level | Criteria | Action |
|-------|----------|--------|
| **SAFE** | Unused import, unused variable, commented-out code | Remove without side effects |
| **CAREFUL** | Unused export (verify no dynamic imports or re-exports) | Remove after confirmation |
| **RISKY** | Potentially unused but referenced via string literals, dynamic imports, or reflection | Flag only, do not remove |

### 3. Present findings

```
## Dead code analysis: [scope]

### SAFE removals ([N] items)
| # | File | Type | Description |
|---|------|------|-------------|
| 1 | [path] | Unused import | `import { X }` never used |

### CAREFUL removals ([N] items)
| # | File | Type | Description | Risk |
|---|------|------|-------------|------|

### RISKY (flagged only, [N] items)
| # | File | Type | Description | Reason |
|---|------|------|-------------|--------|
```

### 4. Apply removals

**WAIT for user confirmation** before applying any changes. Apply SAFE removals first, then CAREFUL if approved. Never apply RISKY removals without explicit instruction.

After applying, run type-check and lint to verify no regressions:
```bash
cd <your-app> && npx tsc --noEmit && npm run lint
```

### Reference files
- Skill: `.claude/skills/coding-standards-supplement.md`
- Agent: `.claude/agents/code-reviewer.md`
