# EIW Stage 3.5: UX Bar Raiser (Implementation Critique)


<!-- PIPELINE-STATE-2026-0001/0002/0003: write Step C deliverable to .claude/pipeline-state/<run-dir>/phase-<N>-<slug>.md; update manifest at Step D; read prior phase from disk at Step A. See specs/pipeline-state-persistence.md and .claude/pipeline-state/SCHEMA.md. -->
> This skill implements **EIW-3.5**. It inherits all shared behavior from `/bar-raiser-protocol`. Only pipeline-specific overrides are defined below.

You are executing **EIW Stage 3.5: UX Bar Raiser** — a mandatory implementation critique injection.

## Stage Purpose

Inject an obsessive UX critique into the completed implementation AFTER all Task Group Stage 2+3 loops finish but BEFORE Stage 4 (Final 3-Round Review). This stage inspects the ACTUAL CODEBASE — not just documents. It has NO verdict and NO approval gate. It ALWAYS produces critique and ALWAYS forces a Stage 2+3 redo for affected task groups.

**Key rules:**
- Executes exactly once per pipeline run (guarded by `$BR_EXECUTED_EIW_1` flag)
- SKIPPED when `$OUTPUT_MODE == "documentation"` or all task group files match doc-only globs (see `/bar-raiser-protocol` Skip Conditions)
- No pass/fail — critique is the only output
- The redo is **FREE** (does not increment `$ITERATION`, does not count against restart limit)
- Critique is appended to `$ACCUMULATED_FEEDBACK` so Stage 2 redo must address it
- The subagent MUST use Glob, Grep, and Read tools to inspect the actual codebase

## Prerequisites

All three conditions must be true:
1. All Task Group Stage 2+3 loops must be complete (every group passed Stage 3 checkpoint)
2. `$BR_EXECUTED_EIW_1` must be `false` (first execution only)
3. Implementation must contain non-doc files (at least one file NOT matching doc-only globs: `*.md`, `*.mdx`, `*.txt`, `*.json` config-only, `*.yaml`, `*.yml`)

## Progress Reporting (MANDATORY)

Entry banner:
```
═══════════════════════════════════════════════════════
 EIW | Stage 3.5: UX Bar Raiser (EIW-3.5)
 Status: MANDATORY CRITIQUE — No verdict, forces Stage 2+3 redo
═══════════════════════════════════════════════════════
```

Skip banner (when conditions not met):
```
  ○ EIW-3.5: UX Bar Raiser — SKIPPED ([reason: documentation-only / all files match doc-only globs])
```

Completion banner:
```
  ◆ EIW-3.5: UX Bar Raiser complete — forcing Stage 2+3 redo (FREE restart)
```

---

## Execution Protocol

This stage does NOT follow the standard EIW stage structure. It runs a single subagent that produces a critique report based on actual codebase inspection.

Spawn a subagent via the **Task tool** with `subagent_type: "general-purpose", model: "opus"`:

---

**Persona:** Inherited from `/bar-raiser-protocol` — Obsessive UX Bar Raiser.

**Context Inputs:**
- `$FEATURE` — the feature description being implemented
- `$TASK_GROUPS_SUMMARY` — aggregated summary of all Stage 2 implementation work across all task groups
- `$STAGE_3_CHECKPOINTS` — aggregated results from all Stage 3 checkpoint reviews
- `$ACCUMULATED_FEEDBACK` — any feedback from prior iterations

**Dimension Variant:** Implementation-focused (same as SE-7.5). Examines actual code for UI states, interaction patterns, error handling UX, and code-level quality.

**Subagent Task:**

1. **Locate implementation files** — Use Glob and Grep to find all files created or modified during Stage 2 across all task groups.
2. **Read the actual code** — Use Read to examine UI components, API routes, and state management.
3. **Trace user flows** — Follow the code paths a user would trigger, from click to response.
4. **Determine scope tier** — Count modified files to determine scaling tier (see `/bar-raiser-protocol` Minimum Issue Scaling).
5. **Critique through 4 UX dimensions** — For EACH dimension, identify the minimum number of issues per the scaling tier. All dimension checklists are inherited from `/bar-raiser-protocol`.

### Pipeline-Specific Dimension Guidance

In addition to the shared dimension checklists, EIW-3.5 specifically evaluates:

- **FRICTION:** Are cross-task-group interactions smooth? Does the combined implementation create friction that individual task group reviews missed?
- **DELIGHT_GAP:** Does the combined feature feel cohesive or like separately-built modules bolted together?
- **CONSISTENCY:** Are patterns consistent across task groups? Did different task groups solve similar problems differently?
- **ACCESSIBILITY:** Is the full user journey accessible, including transitions between features implemented by different task groups?

### Output Format

```
## 【EIW Stage 3.5: UX Bar Raiser Critique (Implementation)】

### Scope Assessment
- Files/artifacts reviewed: [count]
- Scaling tier: Small / Medium / Large
- Min issues per dimension: [1/2/3]

### Files Inspected
| # | File | Reason |
|---|------|--------|
| 1 | [path] | [What was examined] |

### Critique Summary
Total issues identified: [N]
Dimensions with critical findings: [list]

### FRICTION
| # | Issue | File:Line | Improvement |
|---|-------|-----------|-------------|
| 1 | [Issue found in code] | [file:line] | [Concrete code-level suggestion] |

### DELIGHT_GAP
| # | Issue | File:Line | Improvement |
|---|-------|-----------|-------------|
| 1 | [Issue found in code] | [file:line] | [Concrete code-level suggestion] |

### CONSISTENCY
| # | Issue | File:Line | Improvement |
|---|-------|-----------|-------------|
| 1 | [Issue found in code] | [file:line] | [Concrete code-level suggestion] |

### ACCESSIBILITY
| # | Issue | File:Line | Improvement |
|---|-------|-----------|-------------|
| 1 | [Issue found in code] | [file:line] | [Concrete code-level suggestion] |

### Architecture vs Implementation Delta
| # | Architecture Intent (Stage 0) | Actual Implementation | Gap |
|---|-------------------------------|----------------------|-----|
| 1 | [What Stage 0 specified] | [What code actually does] | [Discrepancy] |

### Synthesis: The One Thing That Would Transform This Implementation
[Single paragraph — highest-leverage improvement elevating from "works correctly" to "I'm proud to show this to people"]

### Mandatory Redo Guidance
[Specific instructions for Stage 2 redo — which task groups are affected, which files to modify, which patterns to fix, what tests to add]
```

---

## After Execution — MANDATORY RESTART PROTOCOL

<!-- Enforce Stage 2+3 redo after EIW-3.5 critique -->

> **⛔ CRITICAL: DO NOT PROCEED TO STAGE 4.** After this critique, the orchestrator MUST restart from Stage 2 (all task groups). Proceeding to Stage 4 without the Stage 2+3 redo is a **PIPELINE VIOLATION**.

1. Display the full BR critique report to the user.
2. The orchestrator sets `$BR_EXECUTED_EIW_1 = true`.
3. The orchestrator appends the BR critique to `$ACCUMULATED_FEEDBACK`.
4. **STOP. Set `$RESTART_STAGE = 2`. Return control to the main loop.**
5. **The orchestrator MUST now re-execute Stage 2+3 loops** (`/eiw-stage2` + `/eiw-stage3` for each task group) with the BR critique included in `$ACCUMULATED_FEEDBACK`.
6. After all Stage 2+3 loops pass again, the pipeline proceeds to Stage 4. EIW-3.5 does NOT run again (guarded by `$BR_EXECUTED_EIW_1 == true`).

**The next skill invocation after this stage MUST be `/eiw-stage2` (for the first task group). Any other skill invocation is a violation.**

## Important Notes

- **ALL subagents MUST use `model: "opus"`** — The Bar Raiser critique requires Opus-level reasoning to identify subtle UX issues in code.
- **The Bar Raiser is NOT a reviewer** — it does not approve or reject. It critiques. The redo is unconditional.
- **Critique must reference real code** — Every finding must include a file path and line number. Abstract critique without code references is not acceptable.
- **Architecture vs Implementation Delta is mandatory** — The subagent must compare Stage 0 architecture review against actual code to find gaps.
- **⛔ ENFORCEMENT:** The orchestrator MUST NOT proceed to Stage 4 after this critique. It MUST loop back to Stage 2+3. Stage 4 has a prerequisite guard that will reject execution if Stage 2+3 was not re-executed after EIW-3.5.
