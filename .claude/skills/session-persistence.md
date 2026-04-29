# Session persistence

> **Deference:** This skill supplements CLAUDE.md pipeline governance and the instinct archive section. On conflict, CLAUDE.md governs. This skill does NOT create new pipeline gates — it provides techniques for maintaining state across context boundaries.

## Purpose

Techniques for maintaining critical state across long conversations and pipeline runs. Covers instinct loading, state checkpoints, and recovery patterns when context window pressure forces information to be re-read or when sessions are interrupted.

## TL;DR

- Load instincts from `.claude/pdca-archive/instincts.md` at session start
- Checkpoint pipeline state at phase boundaries (write to files, not conversation memory)
- Recovery protocol: re-read instincts + last checkpoint when resuming
- Use structured summaries, not full file re-reads, for state reconstruction
- Boundary with `context-compaction`: this skill covers WHAT to persist; `context-compaction` covers HOW to compress what you keep

## When to use vs. context-compaction

| Situation | Use session-persistence | Use context-compaction |
|-----------|------------------------|----------------------|
| Starting a new session | Yes (load instincts) | No |
| Pipeline crosses phase boundary | Yes (checkpoint) | No |
| Context window at 60%+ usage | No | Yes (compress) |
| Resuming after context eviction | Yes (re-read checkpoint) | No |
| Mid-phase with accumulated findings | No | Yes (summarize) |
| Pipeline restart after failure | Yes (recover from checkpoint) | No |
| Proactive window management | No | Yes (preemptive) |

**Rule of thumb:** Session-persistence answers "what must survive?" Context-compaction answers "how do I fit more in?"

## When to use

- Beginning any pipeline run (SE, EIW, DRW, PDCA — load operational instincts)
- Resuming work after a context window reset or new conversation
- Before long multi-phase pipeline sequences (SE Phase 5 → Phase 6 transitions)
- When switching between task groups in EIW (Enterprise Implementation Workflow) Stage 2

## Protocol

### 1. Session start: load operational instincts

Read `.claude/pdca-archive/instincts.md` and parse active instincts. Hold relevant instincts in working memory for the session's domain. If the file has 0 entries, proceed without instincts — the PDCA cycle has not yet produced learnings.

### 2. Phase boundary checkpoints

At the end of each pipeline phase, write a structured summary to the conversation or a scratch file:

```
CHECKPOINT: [Pipeline] Phase [N] — [Name]
Status: APPROVED / REJECTED
Key decisions: [1-2 sentences]
Files modified: [list]
Open issues: [list or "none"]
Next phase: [N+1]
```

This is NOT a file saved to `.claude/sessions/` — it is a lightweight marker in the conversation that survives compaction better than scattered tool call results.

### 3. Recovery protocol

When context window is reset or resuming from a new session:

1. Re-read `.claude/pdca-archive/instincts.md`
2. Re-read any checkpoint summaries in `.claude/sessions/` if they exist
3. Re-read the pipeline command file for the current phase
4. Resume from the last checkpoint state

### 4. Cross-session state persistence

For explicit session handoff (end of day, planned interruption):

| State type | Where it persists | How to access |
|-----------|------------------|---------------|
| Instincts | `.claude/pdca-archive/instincts.md` | Read at session start |
| PDCA archive | `.claude/pdca-archive/cycles/` | Read specific cycle files |
| Git state | `.git/` (commits, branches, stash) | `git log`, `git stash list` |
| Files on disk | Working tree | Read tool |
| Pipeline phase state | NOT automatically persisted | Must be manually checkpointed |

### 5. Session file format (for explicit save)

When explicitly saving a session to `.claude/sessions/`, use this template:

```markdown
# Session: YYYY-MM-DD

**Project:** your project
**Topic:** [one-line summary]

## What we are building
[1-2 paragraphs with enough context for zero-memory resume]

## What worked (with evidence)
- **[thing]** — confirmed by: [evidence]

## What did NOT work (and why)
- **[approach]** — failed because: [exact reason]

## Current state of files
| File | Status | Notes |
|------|--------|-------|
| `path/to/file` | Complete/In progress/Broken | [notes] |

## Decisions made
- **[decision]** — reason: [why]

## Pipeline state (if active)
- Pipeline: [SE/EIW/DRW/none]
- Current phase: [N]
- Iteration: [N/4]
- Bar raiser flags: [BR1: true/false, BR2: true/false]

## Exact next step
[Precise enough that resuming requires zero thinking about where to start]
```

## Quality gates

| Gate | Criteria | Blocking |
|------|----------|----------|
| Instincts loaded | `instincts.md` read at session start if non-empty | Yes |
| Checkpoint written | Summary exists at every phase boundary | Yes |
| Pipeline state captured | Pipeline phase and iteration recorded if pipeline active | Yes |
| Recovery tested | Can resume from checkpoint without re-reading all files | Advisory |

## Common pitfalls

- **Not loading instincts at session start** — instincts contain lessons from past failures; ignoring them risks repeating mistakes
- **Saving mid-pipeline without pipeline state** — next session cannot determine which phase to resume from
- **Relying on conversation memory for state** — conversation context is ephemeral; write critical state to files
- **Accumulating stale session files** — keep only the last 5-10 session files; older ones are noise

## Related skills

`context-compaction`, `learning-engine`, `pipeline-hooks`
