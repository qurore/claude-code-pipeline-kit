# EIW Stage 1: Hierarchical Task Decomposition

You are executing **EIW Stage 1: Hierarchical Task Decomposition** for the feature described by the user.

> **Project Configuration Required:** This workflow uses command variables defined in your project's `CLAUDE.md`. See `/eiw-review` for the full list.

## Progress Reporting (MANDATORY)

At stage entry, output:
```
───────────────────────────────────────────────────────
 EIW Stage 1: Hierarchical Task Decomposition
───────────────────────────────────────────────────────
```

At completion: `  ✓ Stage 1: Task hierarchy created — N Task Groups, M total tasks`

---

## Instructions

Spawn a subagent via the **Task tool** with `subagent_type: "general-purpose", model: "opus"` to design the task hierarchy. The subagent operates as a **Task Architect** persona.

### Subagent Prompt Template

Use the following prompt when spawning the subagent (fill in `$FEATURE`, `$UCAR_LAR_RESULTS` from Stage 0, and `$ACCUMULATED_FEEDBACK` if this is a restart iteration):

---

**Persona:** You are the Task Architect. You decompose complex features into hierarchical, dependency-aware task structures. You think in terms of layers (Database → API → Frontend → Integration) and ensure each task is atomic, testable, and has clear acceptance criteria.

**Feature:** $FEATURE

**Architecture Reviews (from Stage 0):**
$UCAR_LAR_RESULTS

**Accumulated Feedback from Previous Iterations (if any):**
$ACCUMULATED_FEEDBACK

**Your Task:** Create a hierarchical task structure following the EIW format.

### Requirements

1. **Organize tasks into Task Groups (TG)** — Typically: Database Layer, API Layer, Frontend Layer, Integration & Testing
2. **Each task must include:**
   - `id` (e.g., "1.1", "2.3")
   - `content` (imperative form: "Create migration file")
   - `activeForm` (present continuous: "Creating migration file")
   - `dependencies` (which tasks must complete first)
3. **Each Task Group ends with a CHECKPOINT task**
4. **If this is a restart iteration**, incorporate ALL accumulated feedback into the task design — add new tasks, modify existing ones, or restructure as needed to address previous failures
5. **Read relevant codebase files** to understand existing patterns and ensure tasks align with the actual architecture

### Output Format

```
## 【Stage 1】Hierarchical Task Decomposition

### Feature: [Name]
### Iteration: [N] of 4

### Task Structure

【Task Group 1】[Layer Name]
├── Task 1.1: [Description] (depends on: none)
├── Task 1.2: [Description] (depends on: 1.1)
├── Task 1.3: [Description] (depends on: 1.1)
└── 【TG1-CHECKPOINT】[Layer] review

【Task Group 2】[Layer Name]
├── Task 2.1: [Description] (depends on: TG1)
├── Task 2.2: [Description] (depends on: 2.1)
└── 【TG2-CHECKPOINT】[Layer] review

[Continue for all groups...]

### Feedback Integration (if restart)
| Previous Feedback | How Addressed | Task(s) |
|-------------------|---------------|---------|
| [Feedback item] | [How it's incorporated] | [Task IDs] |
```

---

### After Subagent Returns

1. Display the task structure to the user
2. Create corresponding tasks using **TaskCreate** for progress tracking
3. Stage 1 is complete — proceed to Stage 2 for implementation
