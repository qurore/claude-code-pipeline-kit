# Research protocol

> **Deference:** This skill supplements CLAUDE.md codebase exploration (SE Phase 0) and the intent classification decision tree. On conflict, CLAUDE.md governs. This skill does NOT replace SE Phase 0 -- it provides the investigation methodology that Phase 0 and other exploration tasks should follow.

## Purpose

A systematic multi-round investigation protocol for answering complex codebase questions. Produces evidence-backed findings with file:line citations and explicit confidence levels, ensuring investigations are focused, bounded, and reproducible.

## When to use

- Investigating unfamiliar code areas before implementation
- Root cause analysis during DRW D1 (investigation)
- Understanding cross-module dependencies for impact analysis
- SE Phase 0 codebase exploration
- Answering architectural questions that span multiple domains
- When initial code reading raises more questions than it answers

<!-- ECC-2026: search-first-merge -->
## Search-first principle

Before writing any new code, investigate whether the solution already exists. This is the foundational rule underlying every investigation protocol in this file.

| Step | Action | Tool |
|------|--------|------|
| 1 | Search for existing implementations in `src/lib/` | Grep: function/class name |
| 2 | Check if the platform provides the capability (Next.js, database client, Node.js built-ins) | Read: framework docs, existing usage |
| 3 | Search for established patterns in the codebase | Grep: pattern keywords |
| 4 | Check `.claude/skills/` and `.claude/agents/` for relevant guidance | Glob: `*.md` in `.claude/` |

**When search finds an existing solution:** Adopt it. Do not create a parallel implementation.
**When search finds a partial solution:** Extend it rather than creating a new one.
**When search finds nothing:** Proceed with the investigation protocol below.

> See also: `common.md` rule "research before implementation" and "search for existing implementations first."

## Protocol

Execute rounds sequentially. Each round narrows the investigation. Maximum 3 rounds.

### 1. Define the question

State the specific question to answer. A well-formed question is falsifiable and scoped.

| Quality | Example |
|---------|---------|
| Good | "Which modules write to the `analysis_results` table and through what code paths?" |
| Good | "What triggers the domain reconciliation stage to re-process partitions?" |
| Bad | "Understand the wiki system" |
| Bad | "How does everything work?" |

One primary question per investigation. Secondary questions emerge during rounds. If you cannot state a specific question, the investigation is premature.

### 2. Broad scan (round 1)

Cast a wide net to identify relevant files and patterns.

```
Glob: **/*wiki*synthesis*.ts          -- file name patterns
Grep: "analysis_results"                 -- keyword occurrences
Grep: "domain_partitioned"            -- feature flags or mode selectors
Read: README, index.ts, barrel files  -- entry points and exports
```

Use 3-5 search terms covering synonyms and naming variations. Read index/barrel files first -- they reveal module structure without reading internals. Record every file found with a one-line relevance note.

### 3. Narrow investigation (round 2)

Read specific files identified in the broad scan. Follow imports and dependencies.

Read high-relevance files fully, medium-relevance selectively (exports, key functions). Follow the dependency chain: caller --> callee --> data source, up to 3 hops. Track each finding as: `[file:line] finding text (confidence: high|medium|low)`.

### 4. Cross-reference (round 3 or within any round)

Verify findings by checking multiple evidence sources.

| Evidence type | Verification method |
|---------------|-------------------|
| Function behavior | Check call sites and test files |
| Data flow | Trace from source (DB/API) to consumer (UI/export) |
| Configuration | Check env vars, constants, and defaults |
| Documentation | Compare code behavior to specs and CLAUDE.md |

A finding requires 2+ independent sources to be rated high confidence. If code contradicts documentation, code is the source of truth -- note the discrepancy.

### 5. Evidence synthesis

Compile findings into a structured summary.

```
INVESTIGATION REPORT
====================
Question: [the specific question]

Findings:
1. [Finding text]
   Evidence: [file:line], [file:line]
   Confidence: high

2. [Finding text]
   Evidence: [file:line]
   Confidence: medium

Gaps:
- [What remains unknown]
- [What would require additional investigation]

Rounds completed: N/3
```

### 6. Gap identification

After synthesis, decide if another round is needed.

| Condition | Action |
|-----------|--------|
| Question answered with high confidence | Terminate |
| 3+ supporting file references found | Terminate |
| 3 rounds exhausted | Terminate with documented gaps |
| Key files identified but unread | Continue to next round |
| New sub-question emerged | Continue with refined question |

## Quality gates

| Gate | Criteria | Blocking |
|------|----------|----------|
| Question stated | Specific, falsifiable question documented before searching | Yes |
| Citations | Every finding references at least one file:line | Yes |
| Confidence | Each finding rated high/medium/low | Yes |
| Gaps documented | Unknown areas explicitly listed | Yes |
| Round limit | Maximum 3 rounds enforced | Yes |

## Common pitfalls

- **Unfocused investigation** -- "understand everything about module X" produces diffuse, low-value output. Start with a specific question; broaden only if the answer requires it.
- **Stopping at first result** -- the first file matching a grep is often a secondary reference, not the source of truth. Cross-reference before concluding.
- **Exceeding 3 rounds** -- diminishing returns set in fast. If 3 rounds do not answer the question, the question may need reformulation or the answer requires implementation.
- **Investigating without a question** -- reading code without a target is exploration, not research. Define the question first; aimless reading wastes context window.
- **Confusing code reading with understanding** -- reading a file does not mean understanding it. Trace data flow and check call sites to verify comprehension.

## Related agents

`architect`

## Related skills

`iterative-search`, `session-persistence`, `context-compaction`
