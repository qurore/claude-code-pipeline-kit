# SE Phase 0: Codebase Exploration

You are executing **SE Pipeline Phase 0: Codebase Exploration** for the feature described by the user.

## Phase Purpose

Ground all downstream pipeline phases in verified codebase facts. Phase 0 discovers WHAT EXISTS in the codebase relevant to the feature. It does NOT interpret the user's intent, propose solutions, or evaluate feasibility — those are Phase 1+ concerns.

This phase eliminates the class of errors where requirements, plans, and designs are written without knowledge of actual codebase patterns, conventions, and constraints.

## Progress Reporting (MANDATORY)

Before each sub-step, output a progress line to the terminal:

```
───────────────────────────────────────────────────────
 SE Phase 0: Codebase Exploration | Step X: [Step Name]
───────────────────────────────────────────────────────
```

Use these step names:
- `Step A: Exploration Strategy`
- `Step B: Codebase Investigation`
- `Step C: Report Generation & Self-Check`

At step completion, output: `  ✓ Phase 0 Step X complete → Proceeding to Step Y`

**Phase 0 has NO Step D.** After Step C self-check passes, the pipeline proceeds directly to Phase 1.

---

## Structural Notes

Phase 0 deviates from the standard Phase 1-9 structure:
- **No Tri-Persona Discussion** — Phase 0 is investigative, not deliberative.
- **No Step D Approval Gate** — The deliverable is a factual report, not a design proposal. Self-validation in Step C replaces external review.
- **No Subagents** — Phase 0 executes in the main agent context. Persona isolation is unnecessary for codebase scanning.
- **Runs ONCE before the iteration loop** — Codebase facts do not change between pipeline iterations. `$PHASE_0_DELIVERABLE` is preserved across all cross-phase restarts.

---

## Complexity Classification (Soft Guidelines)

Based on the feature prompt, classify exploration depth:

| Classification | Files to Read (guideline) | Characteristics |
|---------------|--------------------------|-----------------|
| **SMALL** | ~5-15 files | Single domain, minimal cross-cutting, straightforward patterns |
| **MEDIUM** | ~15-30 files | 2-3 domains, some cross-cutting concerns, moderate integration |
| **LARGE** | ~30-50 files | 4+ domains, significant cross-cutting, complex integration, high test surface |

These are soft guidelines, not hard caps. The agent should use judgment — read fewer files if the area is well-understood, more if unexpected complexity emerges.

---

## Sub-Step Execution Protocol

Execute all 3 sub-steps sequentially in the main agent context (no subagent spawning needed).

---

### Step A: Exploration Strategy

Parse the feature prompt `$FEATURE` to determine WHERE in the codebase to look.

**Protocol:**

1. **Extract feature keywords** — Identify component names, domain terms, file patterns, route patterns, API patterns, database table names mentioned or implied by the prompt.

2. **Read CLAUDE.md** — Consult the project structure section, domain model, tech stack, and any relevant architectural context to orient the investigation.

3. **Read MEMORY.md** — Check auto-memory for previously discovered patterns, gotchas, or conventions relevant to the feature's domain.

4. **Produce an Exploration Plan:**

```
## Phase 0A: Exploration Plan

### Feature Keywords
[Extracted terms, component names, domain concepts]

### Likely Affected Areas
| # | Area | Directory/Pattern | Reason |
|---|------|------------------|--------|
| 1 | [area] | [glob pattern] | [why relevant] |

### Complexity Estimate
**Classification:** SMALL / MEDIUM / LARGE
**Reasoning:** [Why this classification]

### Investigation Priorities
1. [Highest priority area — read first]
2. [Second priority]
3. [Third priority]
```

**Rules:**
- Do NOT interpret the user's intent beyond what's needed to locate relevant code
- Do NOT propose solutions or evaluate feasibility
- Focus on identifying WHERE to look, not WHAT to build

---

### Step B: Codebase Investigation

Execute the exploration plan from Step A using actual codebase tools.

**Protocol:**

1. **Execute searches** — Use Glob and Grep to find relevant files:
   - Glob for file patterns identified in Step A
   - Grep for key terms, function names, type references, API patterns
   - Prioritize: existing implementations of similar features, type definitions, route handlers, database migrations, test files

2. **Read key files** — Use Read to examine the most relevant files discovered:
   - Focus on understanding patterns, not memorizing implementation details
   - Note naming conventions, file organization, component structure
   - Identify API request/response shapes, validation patterns, error handling conventions

3. **Examine database context** — Read relevant migration files in `supabase/migrations/` to understand:
   - Table structures, column types, constraints
   - RLS policies
   - Indexes and relationships

4. **Map the blast radius** — Identify which existing files/modules would be affected by the feature:
   - Direct modifications needed
   - Integration points (imports, exports, shared types)
   - Test files that may need updates

5. **Adapt dynamically** — If investigation reveals unexpected dependencies or patterns, extend the search. If an area turns out to be irrelevant, skip it and note why.

**Rules:**
- MUST use Glob, Grep, and Read tools — do NOT rely on memory or inference alone
- For database schema, prefer migration files as the primary source. Use `psql` only when migrations are ambiguous or incomplete.
- If the feature is entirely greenfield (no existing codebase touchpoints), survey adjacent modules to identify conventions the new code must follow.

---

### Step C: Report Generation & Self-Check

Produce the `$PHASE_0_DELIVERABLE` and validate its completeness.

**Protocol:**

1. **Generate the Codebase Context Report** using the template below.
2. **Execute self-check** against the validation criteria.
3. **If self-check fails** — Return to Step B for targeted follow-up investigation, then regenerate. This is an internal retry, not a cross-phase restart.
4. **If self-check passes** — Store the report as `$PHASE_0_DELIVERABLE` and proceed to Phase 1.

**Output Format:**

```
## 【Phase 0 Deliverable: Codebase Context Report】

### 1. Feature Keywords & Search Terms
[Terms extracted from the prompt and searched in the codebase]

### 2. Relevant Files Discovered
| # | File | Relevance | Key Content |
|---|------|-----------|-------------|
| 1 | [path] | [why relevant] | [brief summary] |

### 3. Existing Patterns to Follow
| Pattern | Example File | Convention |
|---------|-------------|------------|
| [pattern name] | [file path] | [how it works — naming, structure, approach] |

### 4. Database Schema Context
| Table | Relevance | Key Columns | RLS | Notes |
|-------|-----------|-------------|-----|-------|
| [table] | [why relevant] | [important columns] | Yes/No | [constraints, indexes] |

(If no database tables are relevant, write "No database tables affected by this feature.")

### 5. Type Definitions & Interfaces
| Type/Interface | File | Key Fields | Usage Context |
|---------------|------|------------|---------------|
| [type name] | [file path] | [important fields] | [where/how used] |

### 6. API Conventions Observed
| Convention | Example Endpoint | Pattern Details |
|-----------|-----------------|-----------------|
| [convention] | [method + path] | [validation, auth, response shape] |

(If no API changes are relevant, write "No API endpoints affected by this feature.")

### 7. UI Component Patterns (if applicable)
| Component | Location | Props/State Pattern | Notes |
|-----------|----------|--------------------|-------|
| [component] | [file path] | [key patterns] | [notes] |

(If no UI changes are relevant, write "No UI components affected by this feature.")

### 8. Blast Radius Map
| Area | Files Affected | Risk Level | Notes |
|------|---------------|-----------|-------|
| [area] | [count or list] | HIGH/MED/LOW | [what could break] |

### 9. Technical Constraints & Risks
| # | Constraint | Source | Impact on Feature |
|---|-----------|--------|-------------------|
| 1 | [constraint] | [where discovered] | [how it constrains the feature] |

### 10. Codebase Delta (vs CLAUDE.md)
[Only findings NOT already documented in CLAUDE.md. Reference existing documentation for known patterns: "See CLAUDE.md > [Section Heading]"]

If all findings are already well-documented in CLAUDE.md, write: "No significant delta — CLAUDE.md accurately reflects the relevant codebase areas. Key sections: [list relevant CLAUDE.md sections]."

### 11. Greenfield Assessment (if applicable)
[If no existing implementation matches the feature, document adjacent patterns and conventions the new code should follow for consistency.]

### 12. Complexity Classification (Final)
**Classification:** SMALL / MEDIUM / LARGE
**Files discovered:** [N total relevant files]
**Files read in detail:** [M files]
**Domains affected:** [list]
**Cross-cutting concerns:** [list or "none"]

### 13. Phase 1 Handoff Notes
[What Phase 1 (Prompt Analysis) should pay special attention to, based on codebase reality. Flag any constraints that could narrow or expand the feature's scope.]
```

**Self-Check Criteria:**

| # | Criterion | Required |
|---|----------|----------|
| 1 | At least 1 relevant source file was read with the Read tool | YES |
| 2 | Complexity classification is present and justified | YES |
| 3 | No section contains only placeholder text (e.g., "TBD", "TODO") | YES |
| 4 | Delta findings reference CLAUDE.md sections where applicable | YES |
| 5 | Concrete file paths are provided (not vague descriptions like "the auth module") | YES |
| 6 | All feature-implied areas from Step A were investigated or explicitly marked as skipped with reason | YES |

If any criterion fails, return to Step B for targeted follow-up, then regenerate the report.

---

## Phase 0 Scope Boundary (CRITICAL)

| Phase 0 DOES | Phase 0 does NOT |
|-------------|-----------------|
| Discover what code exists | Interpret the user's intent |
| Identify patterns and conventions | Propose solutions or architectures |
| Map the blast radius | Evaluate feasibility |
| Read actual source files | Make design decisions |
| Surface technical constraints | Prioritize requirements |
| Classify feature complexity | Judge whether the feature is a good idea |

Phase 0 is a **reconnaissance mission**. It reports what the terrain looks like. Phase 1+ decides what to build on that terrain.
