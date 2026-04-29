# DRW Stage D3.5: UX Bar Raiser (Fix Critique)


<!-- PIPELINE-STATE-2026-0001/0002/0003: write Step C deliverable to .claude/pipeline-state/<run-dir>/phase-<N>-<slug>.md; update manifest at Step D; read prior phase from disk at Step A. See specs/pipeline-state-persistence.md and .claude/pipeline-state/SCHEMA.md. -->
> This skill implements **DRW-D3.5**. It inherits all shared behavior from `/bar-raiser-protocol`. Only pipeline-specific overrides are defined below.

You are executing **DRW Stage D3.5: UX Bar Raiser** — a conditional implementation critique injection for UI-facing defect fixes.

## Stage Purpose

Inject an obsessive UX critique into the TDD fix AFTER D3 passes but BEFORE D4 Verification. This stage inspects the ACTUAL FIX in the codebase. It has NO verdict and NO approval gate. It ALWAYS produces critique and ALWAYS forces a D3 redo. Its purpose is to ensure defect fixes that touch user-facing code maintain or improve the UX quality bar.

**Key rules:**
- Executes exactly once per pipeline run (guarded by `$BR_EXECUTED_DRW_1` flag)
- **CONDITIONAL:** Only runs when `$FIX_MANIFEST` contains non-doc files. Purely documentation/configuration fixes skip this stage.
- No pass/fail — critique is the only output
- The redo is **FREE** (does not increment `$ITERATION`, does not count against restart limit)
- Critique is appended to `$ACCUMULATED_FEEDBACK` so D3 redo must address it
- The subagent MUST use Glob, Grep, and Read tools to inspect the actual codebase

## Prerequisites

All three conditions must be true:
1. Stage D3 TDD Fix must be complete (all tests pass, type-check clean, lint clean)
2. `$BR_EXECUTED_DRW_1` must be `false` (first execution only)
3. `$FIX_MANIFEST` must contain at least one file NOT matching doc-only globs

## Skip Condition Logic

A file in `$FIX_MANIFEST` is "doc-only" if its path matches ANY of these globs:
- `*.md`, `*.mdx`, `*.txt`
- `*.json` (config-only — NOT files with code logic like `tsconfig.json`)
- `*.yaml`, `*.yml`

**Determination:** Inspect the `file` field of each `$FIX_MANIFEST` entry. If EVERY entry's path matches one of the above doc-only globs, the fix is documentation/configuration-only → **SKIP DRW-D3.5**.

If ANY entry does NOT match doc-only globs → **EXECUTE DRW-D3.5**.

When skipped, set `$BR_EXECUTED_DRW_1 = true` (to prevent future execution on restart).

## Progress Reporting (MANDATORY)

Entry banner:
```
═══════════════════════════════════════════════════════
 DRW | Stage D3.5: UX Bar Raiser (DRW-D3.5)
 Status: MANDATORY CRITIQUE — No verdict, forces D3 redo
═══════════════════════════════════════════════════════
```

Skip banner:
```
  ○ DRW-D3.5: UX Bar Raiser — SKIPPED (fix manifest contains only doc/config files)
```

Completion banner:
```
  ◆ DRW-D3.5: UX Bar Raiser complete — forcing D3 redo (FREE restart)
```

---

## Execution Protocol

This stage does NOT follow the standard DRW stage structure. It runs a single subagent that produces a critique report based on actual codebase inspection of the fix.

Spawn a subagent via the **Task tool** with `subagent_type: "general-purpose", model: "opus"`:

---

**Persona:** Inherited from `/bar-raiser-protocol` — Obsessive UX Bar Raiser.

Additional DRW context for the persona:

> You are critiquing a DEFECT FIX, not a new feature. Your job is to ensure the fix does not degrade UX and — where possible — improves UX compared to the pre-defect state. A bug fix is a rare opportunity to make the product better, not just restore it to its previous (possibly mediocre) state.

> **SCOPE CONSTRAINT:** Your critique is scoped to the files in the fix manifest and their immediate UI context. Do not critique unrelated parts of the codebase. The goal is to ensure the fix does not degrade UX, not to audit the entire application.

**Context Inputs:**
- `$DEFECT` — the original defect description
- `$ROOT_CAUSE` — root cause identified in D1
- `$FIX_MANIFEST` — complete fix manifest from D2 (array of `{file, line, snippet, fix_description}`)
- `$FILES_CHANGED` — list of all files modified in D3
- `$ACCUMULATED_FEEDBACK` — any feedback from prior iterations

**Dimension Variant:** Fix-focused. Examines the actual fix for regression UX, error message quality, fix completeness, and edge case coverage.

**Subagent Task:**

1. **Identify fix files** — Filter `$FIX_MANIFEST` and `$FILES_CHANGED` for non-doc files.
2. **Read the fixed code** — Use Read to examine the components/files that were modified.
3. **Read surrounding UI context** — Use Glob/Grep to find related components, parent layouts, sibling elements that interact with the fixed code.
4. **Determine scope tier** — Count files in `$FIX_MANIFEST` to determine scaling tier (see `/bar-raiser-protocol` Minimum Issue Scaling).
5. **Critique through 4 UX dimensions** — For EACH dimension, identify the minimum number of issues per the scaling tier. All dimension checklists are inherited from `/bar-raiser-protocol`.

### Pipeline-Specific Dimension Guidance

In addition to the shared dimension checklists, DRW-D3.5 specifically evaluates:

- **FRICTION:** Does the fix introduce new friction? Are error messages user-facing and clear? Does a rollback path exist if the fix causes issues?
- **DELIGHT_GAP:** Could the fix also improve adjacent UX? Is there a missed opportunity to prevent recurrence at the UI level? Does the error state post-fix guide the user better than before?
- **CONSISTENCY:** Does the fix maintain naming and pattern consistency with surrounding code? Any formatting drift in the fixed files?
- **ACCESSIBILITY:** Is the fix understandable to a new contributor reading the diff? Are new test names descriptive? Are fixed UI elements accessible?

### Output Format

```
## 【DRW Stage D3.5: UX Bar Raiser Critique (Fix)】

### Scope Assessment
- Files in fix manifest: [count]
- Non-doc files: [count]
- Scaling tier: Small / Medium / Large
- Min issues per dimension: [1/2/3]

### Fix Context
| Field | Value |
|-------|-------|
| Defect | [description] |
| Root cause | [summary] |
| Files fixed | [count] |

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

### Pre-Fix vs Post-Fix UX Delta
| # | Aspect | Before Fix | After Fix | Opportunity |
|---|--------|-----------|-----------|-------------|
| 1 | [What was broken] | [UX before] | [UX after fix] | [Could be even better if...] |

### Synthesis: The One Thing That Would Elevate This Fix
[Single paragraph — highest-leverage improvement]

### Mandatory Redo Guidance
[Specific instructions for D3 redo — which manifest items need UX-aware re-fixing, which patterns to apply]
```

---

## After Execution — MANDATORY RESTART PROTOCOL

<!-- Enforce D3 redo after DRW-D3.5 critique -->

> **⛔ CRITICAL: DO NOT PROCEED TO STAGE D4.** After this critique, the orchestrator MUST restart D3. Proceeding to D4 without the D3 redo is a **PIPELINE VIOLATION**.

1. Display the full BR critique report to the user.
2. The orchestrator sets `$BR_EXECUTED_DRW_1 = true`.
3. The orchestrator appends the BR critique to `$ACCUMULATED_FEEDBACK`.
4. **STOP. Set `$RESTART_STAGE = "D3"`. Return control to the main loop.**
5. **The orchestrator MUST now re-execute D3** with the BR critique included in `$ACCUMULATED_FEEDBACK`.
6. D3 re-executes TDD Fix (RED → GREEN → REFACTOR) incorporating all BR critique findings.
7. After D3 passes again, the pipeline proceeds to D4. DRW-D3.5 does NOT run again (guarded by `$BR_EXECUTED_DRW_1 == true`).

**The next stage after DRW-D3.5 MUST be D3 (redo). Any other stage is a violation.**

## Important Notes

- **ALL subagents MUST use `model: "opus"`** — The Bar Raiser critique requires Opus-level reasoning to identify subtle UX issues in code.
- **The Bar Raiser is NOT a reviewer** — it does not approve or reject. It critiques. The redo is unconditional.
- **Critique must reference real code** — Every finding must include a file path and line number. Abstract critique without code references is not acceptable.
- **Pre-Fix vs Post-Fix UX Delta is mandatory** — The subagent must evaluate whether the fix represents a net UX improvement or merely a restoration.
- **SCOPE CONSTRAINT is enforced** — Critique must stay within fix manifest scope and immediate UI context. Expanding to general codebase audit violates DRW's "no scope creep" rule.
- **This stage is conditional** — When skipped (doc-only fix), the orchestrator outputs the skip banner and proceeds directly to D4.
- **⛔ ENFORCEMENT:** The orchestrator MUST NOT proceed to D4 after this critique. It MUST loop back to D3.
