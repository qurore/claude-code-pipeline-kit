# Pipeline hooks

> **Deference:** This skill supplements CLAUDE.md Pipeline Governance section and the "Skill, agent, and rule infrastructure" section. On conflict, CLAUDE.md governs. This skill does NOT create new pipeline gates — it maps which skills and agents are consumed at each pipeline stage.

## Purpose

Maps every pipeline stage to the skills and agents it should load via the Read tool. Enables subagents to load the correct reference files at the correct time, and documents the Claude Code hooks lifecycle for extending quality automation.

## TL;DR

- Maps every pipeline stage to the skills/agents it should load via Read tool
- Covers all 4 pipelines: SE (9 phases), EIW (8 stages), DRW (5 stages), PDCA (4 phases)
- Skills are procedural HOW references; agents are persona WHO references
- Subagents read files at stage entry, not preloaded at pipeline start
- Also documents Claude Code hook lifecycle (PreToolUse, PostToolUse, Stop, etc.)

## When to use

- At the START of any pipeline stage to determine which files to Read
- When creating a new pipeline stage that needs skill/agent references
- When reviewing pipeline efficiency (are stages loading unnecessary files?)
- When writing or debugging Claude Code hooks (PreToolUse, PostToolUse, Stop)

## Pipeline stage hook map

### SE Pipeline (Software Engineering Pipeline)

| Phase | Skills to read | Agents to read |
|-------|---------------|----------------|
| 0 Codebase exploration | `research-protocol`, `iterative-search` | `architect` |
| 1 Prompt analysis | `research-protocol` | `planner` |
| 2 Prompt requirements | — | `planner` |
| 3 SE planning | — | `planner`, `architect` |
| 4 SE requirements | `api-design` | `architect` |
| 5 Analysis & design | `agentic-patterns`, `api-design` | `architect` |
| 5.5 UX bar raiser (design) | — | — (bar-raiser-protocol command) |
| 6 Implementation | `tdd-guide`, `coding-standards-supplement`, `verification-loop` | `tdd-guide`, `build-error-resolver` |
| 7 Testing | `e2e-testing`, `tdd-guide` | `tdd-guide`, `e2e-runner` |
| 7.5 UX bar raiser (impl) | — | — (bar-raiser-protocol command) |
| 8 Evaluation | `security-review`, `coding-standards-supplement` | `code-reviewer`, `security-reviewer` |
| 9 Final approval | — | — (approval personas in command files) |

### EIW (Enterprise Implementation Workflow)

| Stage | Skills to read | Agents to read |
|-------|---------------|----------------|
| 0 Architecture review | `agentic-patterns`, `api-design` | `architect` |
| 1 Task decomposition | — | `planner` |
| 2 Implementation (TDD) | `tdd-guide`, `coding-standards-supplement`, `verification-loop` | `tdd-guide`, `build-error-resolver` |
| 3 Checkpoint review | `verification-loop` | `code-reviewer` |
| 3.5 UX bar raiser | — | — (bar-raiser-protocol command) |
| 4 Final 3-round review | `security-review`, `coding-standards-supplement` | `code-reviewer`, `security-reviewer` |
| 5-7 Approvals | — | — (approval personas in command files) |

### DRW (Defect Resolution Workflow)

| Stage | Skills to read | Agents to read |
|-------|---------------|----------------|
| D1 Investigation | `research-protocol`, `iterative-search` | `architect` |
| D2 Scope analysis | `iterative-search` | `planner` |
| D3 TDD fix | `tdd-guide`, `verification-loop` | `tdd-guide`, `build-error-resolver` |
| D3.5 UX bar raiser | — | — (bar-raiser-protocol command) |
| D4 Verification | `verification-loop`, `e2e-testing` | `code-reviewer` |
| D5 Technical review | `coding-standards-supplement`, `security-review` | `code-reviewer`, `security-reviewer` |

### PDCA (Plan-Do-Check-Act)

| Phase | Skills to read | Agents to read |
|-------|---------------|----------------|
| 1 Incident analysis | `research-protocol` | — |
| 2 Root process attribution | — | — |
| 3 Knowledge synthesis | `learning-engine`, `agent-harness` | — |
| 4 Skill upgrade | `agent-harness`, `learning-engine` | `doc-updater` |

## Claude Code hook lifecycle

Claude Code hooks are event-driven automations that fire before or after tool executions.

```
User request → Claude picks tool → PreToolUse → Tool executes → PostToolUse → Stop
```

| Event | Timing | Can block? | Use case |
|-------|--------|-----------|----------|
| PreToolUse | Before tool execution | Yes (exit 2) | Validate preconditions, warn about risky operations |
| PostToolUse | After tool completion | No | Analyze output, auto-format, type-check |
| Stop | After each Claude response | No | Audit, session state persistence, cost tracking |
| SessionStart | Session begins | No | Load context, detect environment |
| SessionEnd | Session ends | No | Cleanup, lifecycle markers |
| PreCompact | Before context compaction | No | Save state before context is compressed |

### Hook input schema

```typescript
interface HookInput {
  tool_name: string;        // "Bash", "Edit", "Write", "Read", etc.
  tool_input: {
    command?: string;       // Bash: the command being run
    file_path?: string;     // Edit/Write/Read: target file
    old_string?: string;    // Edit: text being replaced
    new_string?: string;    // Edit: replacement text
    content?: string;       // Write: file content
  };
  tool_output?: {           // PostToolUse only
    output?: string;
  };
}
```

### Exit codes

| Code | Meaning | Where |
|------|---------|-------|
| 0 | Success (continue) | All events |
| 2 | Block the tool call | PreToolUse only |
| Other | Error (logged, does not block) | All events |

## Quality gates

| Gate | Criteria | Blocking |
|------|----------|----------|
| Coverage | Every pipeline stage present in the hook map | Yes |
| Consistent names | File names match CLAUDE.md tables exactly | Yes |
| No duplicates | Same skill not listed twice for same stage | Advisory |

## Common pitfalls

- **Loading all skills at session start** — read only what the current stage needs; excess context degrades quality
- **Missing agent for a review stage** — review stages (SE Phase 8, EIW Stage 4, DRW D5) always need a reviewer agent
- **Confusing hooks with pipeline phases** — hooks are lightweight, continuous automations; pipeline phases are structured, gated workflows

## Related agents

`architect`, `planner`

## Related skills

`agent-harness`, `research-protocol`, `verification-loop`
