# Context compaction

> **Deference:** This skill supplements CLAUDE.md context window awareness rule in `common.md` and the performance section. On conflict, CLAUDE.md governs.

## Purpose

Strategies for managing context window pressure during long pipeline runs. Covers when and how to compress accumulated information — summaries, selective re-reads, finding consolidation — to keep the most valuable context accessible.

## TL;DR

- Monitor context usage: act at 60% (proactive), emergency at 80%
- Summarize findings into structured summaries, discard raw file reads
- Prioritize: decisions > findings > evidence > raw content
- Never compact pipeline state (that is `session-persistence` territory)
- Boundary with `session-persistence`: this skill covers HOW to compress; `session-persistence` covers WHAT must survive across boundaries

## When to use vs. session-persistence

| Situation | Use context-compaction | Use session-persistence |
|-----------|----------------------|------------------------|
| Context window at 60%+ usage | Yes (proactive) | No |
| Mid-phase with accumulated findings | Yes (summarize) | No |
| Proactive window management | Yes (preemptive) | No |
| Starting a new session | No | Yes (load instincts) |
| Pipeline crosses phase boundary | No | Yes (checkpoint) |
| Resuming after context eviction | No | Yes (re-read checkpoint) |
| Pipeline restart after failure | No | Yes (recover) |

**Rule of thumb:** Context-compaction answers "how do I fit more in?" Session-persistence answers "what must survive?"

## When to use

- Context window reaches 60% capacity (proactive — estimate by counting major read/write operations)
- After reading 10+ files in a single investigation round
- During SE (Software Engineering Pipeline) Phase 6 implementation across multiple task groups
- When DRW (Defect Resolution Workflow) D2 scope analysis spans 10+ files
- After debugging sessions before continuing feature work

## Protocol

### 1. Assess context pressure

Estimate usage by counting significant operations:

| Indicator | Action |
|-----------|--------|
| 30+ tool calls in current task | Monitor — approaching threshold |
| 50+ tool calls or 10+ file reads | Act — begin compaction planning |
| Responses noticeably slower or less coherent | Emergency — compact immediately |

### 2. Prioritize retained context

When compacting, retain information in this priority order:

| Priority | Content type | Action |
|----------|-------------|--------|
| 1 (never discard) | Pipeline decisions, approvals, phase status | Keep verbatim |
| 2 (summarize) | Findings with file:line citations | Condense to structured summary, keep citations |
| 3 (keep example) | Code patterns observed | Keep 1 representative example, discard duplicates |
| 4 (discard) | Raw file contents previously read | Discard — re-read if needed |
| 5 (discard) | Failed search queries and dead-end reasoning | Discard |

### 3. Compaction techniques

| Technique | When to use | Token savings |
|-----------|-------------|---------------|
| Structured summary | Replace N file reads with 10-line summary | High (80%+) |
| Citation condensation | Keep file:line refs, discard surrounding code | Medium (50-70%) |
| Finding dedup | Merge similar findings into one entry | Low-Medium (20-40%) |
| Scope narrowing | Drop files rated Low relevance in iterative-search | Medium (50%+) |

### 4. Pipeline-specific compaction points

| Transition | Compact? | Rationale |
|-----------|----------|-----------|
| SE Phase 0 → Phase 1 | Yes | Codebase facts are in the Phase 0 deliverable file |
| SE Phase 5 → Phase 6 | Yes | Design is in the TDD; free context for implementation |
| SE Phase 6 task group boundary | Yes | Checkpoint passed; free context for next group |
| EIW Stage 2 task group boundary | Yes | Same rationale as SE Phase 6 |
| DRW D1 → D2 | Maybe | Keep if root cause context is still needed |
| DRW D3 → D4 | Maybe | Keep fix context for verification |
| Mid-implementation (any phase) | No | Losing variable names and file paths is costly |
| After failed approach | Yes | Clear dead-end reasoning before trying new approach |
| Debugging → next feature | Yes | Debug traces pollute context for unrelated work |

### 5. What survives compaction

| Persists (in context) | Lost (must re-read) |
|----------------------|---------------------|
| CLAUDE.md instructions | Intermediate reasoning and analysis |
| Memory files (`~/.claude/...`) | File contents previously read |
| Git state (commits, branches) | Tool call history and counts |
| Files on disk | Multi-step conversation context |
| Checkpoints written to files | Nuanced verbal preferences |

## Quality gates

| Gate | Criteria | Blocking |
|------|----------|----------|
| No decision loss | Pipeline decisions accessible after compaction | Yes |
| Citations preserved | All file:line references survive compaction | Yes |
| Priority order | Higher-priority context retained over lower | Yes |
| State saved if pipeline active | Session-persistence checkpoint written before compacting | Yes |

## Common pitfalls

- **Compacting mid-implementation** — losing variable names, file paths, and partial state is more expensive than the context saved
- **Not saving state before compacting** — invoke session-persistence checkpoint protocol first if a pipeline is active
- **Over-compacting** — each compaction loses nuance; prefer one strategic compact over multiple aggressive ones
- **Ignoring context pressure signals** — quality degrades silently as context fills; act at 60%, not 90%
- **Compacting without a summary** — use `/compact` with a focused message describing what to retain

## Related skills

`session-persistence`, `research-protocol`, `iterative-search`
