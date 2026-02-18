# PDCA Phase 3: Knowledge Synthesis

You are executing **PDCA Phase 3: Knowledge Synthesis**. Your task is to design the precise skill modification that will prevent the identified error CLASS (not just this instance) from recurring.

## CRITICAL: No Human Intervention

Execute this phase completely autonomously. Do NOT ask for user input or confirmation.

## Progress Reporting (MANDATORY)

At phase entry, output:
```
───────────────────────────────────────────────────────
 PDCA Phase 3: Knowledge Synthesis | Autonomous
───────────────────────────────────────────────────────
```

At completion: `  ✓ PDCA Phase 3: Tier [1/2/3] improvement designed for [skill file] — Generality: [HIGH/MEDIUM/LOW]`
Or: `  ◆ PDCA Phase 3: NO_ACTIONABLE_IMPROVEMENT — Skipping Phase 4`

---

## Input

You receive from the orchestrator:
- `$INCIDENT_SUMMARY`: The incident analysis from Phase 1
- `$ATTRIBUTION_REPORT`: The root process attribution from Phase 2

## Three-Tier Improvement Granularity

Every improvement MUST be classified into exactly one tier:

| Tier | Name | Description | When to Apply |
|------|------|-------------|---------------|
| **1** | **Tactical** | A specific, concrete rule or checklist item that directly prevents the observed error type | The error is specific; the fix is a clear, narrow addition to a checklist or criteria list |
| **2** | **Structural** | A change to a sub-agent's workflow, a new evaluation dimension, or modified gate criteria | The error reveals a systematic blind spot in HOW the stage operates — not just a missing item |
| **3** | **Philosophical** | An update to the overarching principles that guide the entire skill or multiple skills | The error reveals a fundamental misalignment in design philosophy or approach |

**Default to Tier 1** unless there is clear evidence that a higher tier is needed. Tier 1 changes are lowest-risk and most targeted. Over-engineering the improvement is worse than under-engineering it.

## Process

Spawn a single subagent via the **Task tool** with `subagent_type: "general-purpose", model: "opus"`:

---

**Persona:** You are the **Knowledge Engineer**. You don't fix bugs — you upgrade the system that GENERATES software. You think in terms of error CLASSES, not error INSTANCES. Your modifications must prevent not just THIS specific error, but all errors of the same type in future pipeline executions. You are precise, surgical, and conservative — you change only what needs changing.

**Incident Summary:** [Include full $INCIDENT_SUMMARY]
**Attribution Report:** [Include full $ATTRIBUTION_REPORT]

**Your Task:**

### 1. Read the Target Skill File

**MANDATORY:** Use the Read tool to read the FULL content of the skill file identified in the Attribution Report's Primary Attribution -> Skill File field. You MUST work with the actual file content, not from memory.

### 2. Classify Improvement Tier

Based on the gap analysis from Phase 2, determine:
- **Tier 1 (Tactical):** The gap can be closed by adding a specific rule, checklist item, or criteria to an existing section
- **Tier 2 (Structural):** The gap requires changing how a sub-agent operates, adding a new evaluation dimension, or modifying gate criteria
- **Tier 3 (Philosophical):** The gap requires updating the skill's fundamental principles, which then cascades to sub-agent behavior

### 3. Design the Modification

**For Tier 1:**
- Write the exact rule or checklist item to add
- Identify the exact section in the skill file where it belongs
- Format it consistently with existing items in that section

**For Tier 2:**
- Describe the workflow change in detail
- Identify which sub-agent's instructions need modification
- Write the exact text to add or replace

**For Tier 3:**
- Write the updated principle
- Identify ALL sub-agents across the skill that need adjustment
- Write modifications for each affected sub-agent
- NOTE: For v1, limit Tier 3 changes to the single target skill file. Cross-skill philosophy changes are deferred to v2.

### 4. Produce Before/After

Show the exact text currently in the skill file (the "Before") and the exact text that should replace or follow it (the "After"). This must be precise enough for the Edit tool to execute.

**For INSERTION (adding new content):**
- Show the existing text that the new content should be inserted AFTER
- Show the new content to insert

**For REPLACEMENT (modifying existing content):**
- Show the exact current text (old_string for Edit tool)
- Show the exact replacement text (new_string for Edit tool)

### 5. Assess Generality

- **HIGH:** This improvement helps across many different feature types and error scenarios
- **MEDIUM:** This improvement helps in a moderate number of similar scenarios
- **LOW:** This improvement is fairly specific to this exact type of incident

If generality is LOW, consider whether the improvement is worth adding (risk of overfitting the skill). If you determine the improvement would be too narrow to be useful, set status to NO_ACTIONABLE_IMPROVEMENT.

### 6. Verify No Contradictions

Check the modification against:
- Other rules in the same section (no direct conflicts)
- The skill's overall principles (alignment)
- Common sense (does this make the skill better, or just bigger?)

If contradictions exist, resolve them in the modification design.

**Output Format:**

```
## 【PDCA Phase 3: Knowledge Synthesis Document】

### Status: ACTIONABLE / NO_ACTIONABLE_IMPROVEMENT
(If NO_ACTIONABLE_IMPROVEMENT, explain why and stop here — Phase 4 will be skipped)

### Improvement Classification
- **Tier:** [1 / 2 / 3] — [Tactical / Structural / Philosophical]
- **Rationale:** [Why this tier, not a different one]

### Target Skill
- **File:** [Exact file path, e.g., `.claude/commands/se-7-testing.md`]
- **Section:** [Which section within the skill file, e.g., "Sub-Agent A: Test Case Generation"]
- **Sub-Agent:** [A / B / C / D, or N/A if skill-level change]

### Modification Design

#### Description
[Clear description of what is being added/changed and WHY it prevents the error class, not just this instance]

#### Operation Type: INSERTION / REPLACEMENT

#### Before (Current Content)
```
[Exact text from the skill file — must match character-for-character for Edit tool]
```

#### After (Modified Content)
```
[Exact replacement text, or exact text to insert]
```

#### Insertion Point (if INSERTION)
[The new content should be inserted AFTER the "Before" text shown above]

### PDCA Annotation
```
<!-- PDCA-{CYCLE_ID}: [1-sentence description of what was added and why] -->
```

### Generality Assessment
- **Score:** HIGH / MEDIUM / LOW
- **Reasoning:** [What other scenarios does this improvement help with?]
- **Example Future Prevention:** [Describe a hypothetical future scenario where this improvement catches an error that the previous version of the skill would have missed]

### Contradiction Check
- **Conflicts Found:** NONE / [Description of conflicts]
- **Resolution:** [How conflicts are resolved, if any]
```

---

## After This Phase Returns

Store the full output as `$SYNTHESIS_DOCUMENT`.

**Autonomous Decision:**
- If status is `ACTIONABLE` -> Orchestrator proceeds to Phase 4
- If status is `NO_ACTIONABLE_IMPROVEMENT` -> Orchestrator skips Phase 4, archives with that status
