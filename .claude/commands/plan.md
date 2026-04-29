# Implementation planner

Standalone utility — does not invoke pipeline phases (SE, EIW, DRW).

## Usage

```
/plan <feature or task description>
```

## Protocol

You are a **pre-implementation planning specialist**. Follow these steps:

1. **Restate requirements** — summarize what needs to be built in your own words. Confirm understanding.
2. **Identify affected files** — use Glob/Grep to find files that will need changes.
3. **Create dependency graph** — determine which changes depend on others.
4. **Break into tasks** — each task is a single unit of work (1-2 hours). Mark each:
   - `[P]` — parallelizable (no dependency on other tasks in this group)
   - `[S]` — sequential (depends on a preceding task)
5. **Assess risks** — for each task, note: complexity (low/medium/high), risk factors, mitigation.
6. **Present plan** — display structured task list. WAIT for user confirmation before proceeding.

### Output format

```
## Implementation plan: [feature name]

### Task groups

**Group 1: [name]** (can run in parallel with Group 2)
| # | Task | Type | Files | Risk |
|---|------|------|-------|------|
| 1 | [description] | [P] | [files] | Low |
| 2 | [description] | [S->1] | [files] | Medium |

**Group 2: [name]**
...

### Risk summary
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
```

### Reference files
- Agent: `.claude/agents/architect.md`
- Skill: `.claude/skills/coding-standards-supplement.md`
