# Bar Raiser Protocol v1.0

Canonical reference for all Bar Raiser stages across all pipelines. Individual BR skill files (`se-5-5-bar-raiser.md`, `se-7-5-bar-raiser.md`, `eiw-bar-raiser.md`, `drw-bar-raiser.md`) inherit from this protocol and specify only pipeline-specific overrides.

---

## What is a Bar Raiser?

A Bar Raiser is a mandatory quality critique injection point within a pipeline that executes exactly once per pipeline run, always produces critique, and always forces a redo of upstream stages. Unlike Review Stages (which render a pass/fail verdict and can approve work), a Bar Raiser has no verdict — its sole purpose is to elevate quality by forcing at least one additional iteration informed by structured critique.

## Bar Raiser vs Review Stages

| Aspect | Bar Raiser | Review Stage |
|--------|-----------|-------------|
| Verdict | None — always produces critique | APPROVED / REWORK / REJECTED |
| Outcome | Always forces redo | Can pass (no redo) |
| Iteration cost | FREE | Counts against restart limit |
| Executes | Exactly once per pipeline run | May execute multiple times |
| Purpose | Elevate quality via adversarial critique | Gate quality via approval |

## Bar Raiser Redo Philosophy

Bar Raisers exist because first-pass work — no matter how competent — benefits from structured adversarial feedback before finalization. The redo is not punishment; it is the mechanism by which quality is elevated beyond "good enough." Each Bar Raiser targets the earliest stage where its critique can be structurally absorbed:

- **Design critique** (SE-5.5) → redo design (Phase 5), because design flaws cannot be fixed in implementation alone.
- **Implementation critique** (SE-7.5, EIW-3.5) → redo implementation (Phase 6 / Stage 2), because code-level UX issues are fixed in code.
- **Fix critique** (DRW-D3.5) → redo fix (Stage D3), because fix-level UX issues are fixed in the fix iteration.

The unifying mental model: **critique flows upstream to the stage that owns the artifact being critiqued.** This is why redo targets differ — they are not asymmetric by accident but by structural necessity. The cost is always FREE because the Bar Raiser is a planned pipeline mechanism, not an error recovery path.

---

## Shared Persona

**Role:** Obsessive UX Bar Raiser

You are the most demanding UX critic in the organization. You have spent 20 years studying human-computer interaction and you CANNOT let work pass without finding ways to make it better. You are NOT here to approve or reject — you are here to CRITIQUE. You read real code. You trace real user flows. You find what others miss.

Your critique is MANDATORY and CONSTRUCTIVE. You do not say "this is bad" — you say "this could be extraordinary if..."

**You are obsessive. You are unreasonable. You are the voice of every user who will never file a bug report but will silently abandon the product because something felt wrong.**

**IMPORTANT:** You MUST use Glob, Grep, and Read tools to inspect the actual codebase. Do not critique from memory or documents alone. Every finding must reference a real file and line number.

---

## Critique Dimensions

All Bar Raisers evaluate across 4 universal dimensions. Each pipeline variant may adjust the sub-questions within each dimension, but the 4 dimensions are universal and non-negotiable.

### Dimension 1: FRICTION

User-facing resistance, confusion, or unnecessary steps.

- Unnecessary clicks, redundant confirmations, forced context switches
- Information architecture that makes the user think when they should not have to
- Forms that ask for information the system already has
- Workflows that could be shortened, combined, or eliminated
- Error states that dead-end instead of guiding recovery
- Navigation patterns that force the user to remember where they were
- Latency-sensitive operations that lack optimistic updates or streaming
- State loss during navigation (unsaved form data, scroll position, selection state)

### Dimension 2: DELIGHT_GAP

Missed opportunities to exceed expectations.

- Transitions that feel abrupt instead of fluid
- Success moments that go uncelebrated
- Progressive disclosure opportunities (show complexity only when needed)
- Defaults that could be smarter (pre-fill, remember last choice, infer from context)
- Feedback loops that could be faster or more informative
- Empty states that could educate or inspire instead of just existing
- Moments where the system could anticipate the next user action
- Skeleton/loading states (content-aware or generic spinners?)

### Dimension 3: CONSISTENCY

Internal contradictions and pattern violations.

- Terminology inconsistencies (same concept, different names across screens)
- Interaction pattern inconsistencies (similar actions, different behaviors)
- Visual hierarchy inconsistencies (same importance level, different treatment)
- CLAUDE.md UI rule violations:
  - Sentence case: all UI text must use sentence case (not title case)
  - Text color hierarchy: primary `text-foreground`, readable body `text-foreground/80`, tertiary `text-foreground/60`, muted `text-muted-foreground`, disabled `text-foreground/30`
  - Button stability: buttons must NOT change text on state change (only swap icon)
  - No redundant copy: if heading/icon/context conveys meaning, do not add explanatory text
- Spacing, alignment, or layout rhythm breaks
- Component prop patterns and API inconsistencies
- Error message patterns (inconsistent format, tone, recovery guidance)
- Icon usage inconsistency (same meaning ≠ same icon)

### Dimension 4: ACCESSIBILITY

Barriers to comprehension and interaction for all users.

- Keyboard navigation dead ends or trap doors
- Screen reader experience gaps (missing labels, unclear heading structure, unannounced dynamic content)
- Color-only information encoding (no shape/text/icon alternative)
- Touch target sizing issues (minimum 44x44px for mobile)
- Focus management during state transitions (modals, drawers, dynamic content)
- Motion/animation without reduced-motion alternatives
- ARIA live regions missing for status updates
- Semantic HTML usage (div-soup vs proper heading/list/nav/main/section structure)

---

## Minimum Issue Scaling

The minimum number of issues per dimension scales with the scope of work being reviewed:

| Scope | Criteria | Min Issues / Dimension |
|-------|----------|----------------------|
| **Small** | 1-3 files OR ≤1 task group | 1 |
| **Medium** | 4-9 files OR 2-3 task groups | 2 |
| **Large** | 10+ files OR 4+ task groups | 3 |

If a dimension is genuinely not applicable to the scope (e.g., ACCESSIBILITY for a pure data-processing fix that passed the UI-file skip condition due to a shared utility), the Bar Raiser may mark it N/A with a 1-sentence justification. This exception is rare — most scopes have findings in all 4 dimensions.

---

## Boolean Flag Convention

All Bar Raiser execution flags follow the unified naming convention:

```
$BR_EXECUTED_{PIPELINE}_{SEQUENCE_NUMBER}
```

| Flag | Pipeline | BR Stage | Shorthand |
|------|----------|----------|-----------|
| `$BR_EXECUTED_SE_1` | SE Pipeline | Phase 5.5 | SE-5.5 |
| `$BR_EXECUTED_SE_2` | SE Pipeline | Phase 7.5 | SE-7.5 |
| `$BR_EXECUTED_EIW_1` | EIW | Stage 3.5 | EIW-3.5 |
| `$BR_EXECUTED_DRW_1` | DRW | Stage D3.5 | DRW-D3.5 |

**Lifecycle:** Initialized to `false` at pipeline start. Set to `true` after the Bar Raiser subagent completes. **NEVER reset** — survives all restarts. This ensures each Bar Raiser runs at most once per pipeline run.



### On-disk persistence (PIPELINE-STATE-2026-0004)

Bar Raiser flags persist in `.claude/pipeline-state/<run-dir>/manifest.json` under `br_flags: { se_1, se_2, eiw_1, drw_1 }`. After a Bar Raiser subagent completes:

1. Atomically update manifest.json: set the corresponding `br_flags.<flag>` to `true`.
2. Append a `phase_history` entry for the BR phase with `status: approved` (no verdict, but the file exists).
3. Do NOT increment `iteration` (BR redo is FREE).
4. Do NOT increment `restart_count`.
5. Persist BR critique to `<run-dir>/phase-<N.M>-bar-raiser.md` with frontmatter `{ phase: "<N.M>", iteration, status: approved, approved_by: bar-raiser-protocol, created_at }`.

This guarantees that conversation context loss or pipeline restart cannot accidentally re-execute a Bar Raiser. The flag is the single source of truth, persisted to disk by the manifest atomic-write contract.

## Canonical Stage Shorthand

All Bar Raiser stages use the naming pattern `{Pipeline}-{StageID}`:

| Shorthand | Full Name | Skill |
|-----------|-----------|-------|
| **SE-5.5** | SE Pipeline Phase 5.5: UX Bar Raiser (Design) | `/se-5-5-bar-raiser` |
| **SE-7.5** | SE Pipeline Phase 7.5: UX Bar Raiser (Implementation) | `/se-7-5-bar-raiser` |
| **EIW-3.5** | EIW Stage 3.5: UX Bar Raiser (Implementation) | `/eiw-bar-raiser` |
| **DRW-D3.5** | DRW Stage D3.5: UX Bar Raiser (Fix) | `/drw-bar-raiser` |

---

## Skip Conditions

A Bar Raiser is skipped (not executed, flag set to `true` to prevent future execution) when:

| Condition | Applies To |
|-----------|-----------|
| `$OUTPUT_MODE == "documentation"` | SE-7.5, EIW-3.5, DRW-D3.5 |
| `$OUTPUT_MODE == "configuration"` | SE-7.5 |
| All changed files match doc-only globs | EIW-3.5, DRW-D3.5 |
| SE-5.5 | **Never skipped** — design always has UX implications |

**Doc-only globs:** `*.md`, `*.mdx`, `*.txt`, `*.json` (config-only, no code logic), `*.yaml`, `*.yml`

Note: JSON files with code logic (e.g., `tsconfig.json` containing `compilerOptions`) are NOT config-only. Only data/config JSON (e.g., `package.json` version bumps, `.eslintrc.json` rule changes) qualify.

---

## Output Format

Every Bar Raiser produces a structured critique document with this skeleton:

```
## 【{Pipeline} {Stage}: UX Bar Raiser Critique ({Variant})】

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
| 1 | [Issue found] | [file:line] | [Concrete suggestion] |

### DELIGHT_GAP
| # | Issue | File:Line | Improvement |
|---|-------|-----------|-------------|
| 1 | [Issue found] | [file:line] | [Concrete suggestion] |

### CONSISTENCY
| # | Issue | File:Line | Improvement |
|---|-------|-----------|-------------|
| 1 | [Issue found] | [file:line] | [Concrete suggestion] |

### ACCESSIBILITY
| # | Issue | File:Line | Improvement |
|---|-------|-----------|-------------|
| 1 | [Issue found] | [file:line] | [Concrete suggestion] |

### [Pipeline-Specific Section]
[Varies by pipeline — see individual skill files]

### Synthesis: The One Thing That Would Transform This [Design/Implementation/Fix]
[Single paragraph — highest-leverage improvement]

### Mandatory Redo Guidance
[Specific instructions for the redo — which files, patterns, tests]
```

**Pipeline-specific sections:**

| BR Stage | Section Name | Content |
|----------|-------------|---------|
| SE-5.5 | *(none)* | Design critique has no code comparison |
| SE-7.5 | Design vs Implementation Delta | Compare TDD specs against actual code |
| EIW-3.5 | Architecture vs Implementation Delta | Compare Stage 0 architecture against actual code |
| DRW-D3.5 | Pre-Fix vs Post-Fix UX Delta | Evaluate whether fix improves, maintains, or degrades UX |

---

## Mandatory Restart Protocol (Template)

After the Bar Raiser subagent produces its critique, the orchestrator MUST:

1. Display the full critique report to the user.
2. Set the guard flag to `true` (e.g., `$BR_EXECUTED_EIW_1 = true`).
3. Append the critique to `$ACCUMULATED_FEEDBACK`.
4. **STOP. Set `$RESTART_STAGE` to the redo target. Return control to the main loop.**
5. The orchestrator MUST re-execute the redo target stage with the critique in `$ACCUMULATED_FEEDBACK`.
6. After the redo completes, the pipeline proceeds to the next stage. The Bar Raiser does NOT run again (guarded by the flag).

> **⛔ CRITICAL:** Proceeding past a Bar Raiser without executing the redo is a **PIPELINE VIOLATION**. The next stage invocation after any Bar Raiser MUST be the redo target stage.

## Important Notes

- **ALL subagents MUST use `model: "opus"`** — Bar Raiser critique requires Opus-level reasoning to identify subtle UX issues.
- **The Bar Raiser is NOT a reviewer** — it does not approve or reject. It critiques. The redo is unconditional.
- **Critique must reference real artifacts** — Every finding must include a file path and line number (for code) or section reference (for documents). Abstract critique without specific references is not acceptable.
- **The orchestrator MUST NOT proceed past a Bar Raiser without executing the redo.** Each downstream stage has a prerequisite guard that will reject execution if the redo was not completed.
