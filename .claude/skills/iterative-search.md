# Iterative search

> **Deference:** This skill supplements CLAUDE.md codebase exploration (SE Phase 0) and the research protocol skill. On conflict, CLAUDE.md governs. This skill provides the search refinement pattern; the research protocol provides the broader investigation methodology.

## Purpose

A pattern for progressively refining codebase searches when initial results are insufficient. Prevents wasted context window on irrelevant files by scoring relevance and adapting search terms across bounded rounds.

## When to use

- Complex search tasks where the right files are not obvious from naming
- Multi-file investigations spanning multiple directories or domains
- When the first search returns too many, too few, or wrong results
- Context gathering for any pipeline phase (SE, EIW, DRW)
- Finding all occurrences of a pattern for comprehensive error remediation (CLAUDE.md rule)

## Protocol

Execute rounds sequentially. Each round refines based on prior results. Maximum 3 rounds.

### 1. Initial query

Cast a broad net using complementary search strategies.

```
Glob: **/*wiki*section*.ts            -- file name pattern
Grep: "analysis_records"                 -- exact string in file contents
Grep: "domain_category"               -- related concept
```

**Rules:**
- Use at least 2 search strategies (Glob + Grep, or Grep with different terms).
- Document every search term used -- this prevents repeating failed queries.
- Prefer `files_with_matches` output mode first to assess volume before reading content.

### 2. Evaluate results

Score every file returned by relevance to the question.

| Score | Meaning | Action |
|-------|---------|--------|
| **High** | Directly answers the question or contains the target code | Read fully |
| **Medium** | Provides useful context (imports, types, tests) | Read selectively (exports, key functions) |
| **Low** | Tangentially related (mentions term but in unrelated context) | Skip unless no better results |
| **None** | Irrelevant (false positive from search term) | Discard |

**Rules:**
- Score before reading. Skim file paths and grep context lines to assess relevance.
- Track scores in a running list to avoid re-evaluating the same file.
- If all results score Low or None, the search terms are wrong -- proceed to refinement.

### 3. Refine query

Based on what round 1 revealed, adjust the search strategy.

| Situation | Refinement |
|-----------|------------|
| Too many results (20+) | Add specificity: narrow glob path, add second grep term |
| Too few results (0-2) | Broaden: try synonyms, check alternative naming conventions |
| Wrong domain | Search in a different directory or use a different root term |
| Found types but not implementation | Grep for the type name in non-type files |
| Found implementation but not tests | Glob for `*.test.ts` in the same directory |

**Naming convention alternatives to try:**
- camelCase vs kebab-case vs snake_case (`orderItem` vs `order-item` vs `analysis_record`)
- Singular vs plural (`section` vs `sections`)
- Abbreviations vs full names (`config` vs `configuration`)
- Domain prefixes vs bare names (`orderItemService` vs `itemService`)

### 4. Iterate

Repeat the evaluate --> refine cycle. Each round should produce measurably better results than the previous round.

**Round tracking:**

```
Round 1: 3 searches → 12 files → 2 High, 3 Medium, 7 Low
Round 2: 2 searches → 6 files  → 4 High, 2 Medium, 0 Low  (refined terms)
Round 3: 1 search  → 3 files  → 3 High                     (targeted)
```

**Rules:**
- Never repeat the exact same search term across rounds.
- Each round must use information gained from the previous round.
- If round N produces worse results than round N-1, revert to the prior strategy and terminate.

### 5. Terminate

Stop searching when any termination condition is met.

| Condition | Action |
|-----------|--------|
| 3+ high-relevance files found | Terminate -- sufficient evidence |
| Primary question answered | Terminate -- goal achieved |
| 3 rounds exhausted | Terminate -- document gaps |
| All reasonable search terms tried | Terminate -- the information may not exist in code |

## project-specific search patterns

| Target | Search strategy |
|--------|----------------|
| Wiki sections by domain | Grep `domain_path` in `analysis-pipeline/` |
| Pipeline nodes by function | Grep function name in `pipeline-nodes.ts` |
| Components by route group | Glob `app/(dashboard)/**/*.tsx` |
| Database tables | Grep table name in `migrations/` |
| API endpoints | Grep route path in `app/api/` |
| Type definitions | Grep type/interface name in `types/` and `lib/` |
| Zod schemas | Grep `Schema` suffix in source files |

## Quality gates

| Gate | Criteria | Blocking |
|------|----------|----------|
| Search terms documented | Every query recorded with round number | Yes |
| Relevance scored | Every result file scored High/Medium/Low/None | Yes |
| Round limit | Maximum 3 rounds enforced | Yes |
| Results deduplicated | No file evaluated twice across rounds | Yes |
| Refinement justified | Each round's strategy change explained by prior results | Advisory |

## Common pitfalls

- **Repeating the same search with different syntax** -- `grep "analysis_records"` and `grep 'analysis_records'` are the same query. Change the search term, not the quoting.
- **Reading entire files when grep suffices** -- use `output_mode: "content"` with context lines to check relevance before committing to a full file read.
- **Not trying alternative naming conventions** -- your project uses camelCase in TypeScript, snake_case in SQL, kebab-case in file names. Try all three before concluding something does not exist.
- **Exceeding 3 rounds** -- more rounds hit diminishing returns and consume context window. If 3 rounds do not find it, reformulate the question or ask whether the code exists.
- **Searching without a target** -- iterative search refines toward a goal. Without a clear target, refinement has no direction. Define what you are looking for before searching.

## Related skills

`research-protocol`, `context-compaction`
