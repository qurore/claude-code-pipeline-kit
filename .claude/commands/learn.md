# Session observation recorder

Standalone utility — does not invoke pipeline phases (SE, EIW, DRW).

## Usage

```
/learn <category> <observation text>
```

Categories: `error-pattern`, `workflow-optimization`, `quality-gate`, `architectural-principle`, `session-insight`

Examples:
- `/learn error-pattern database row-level security policies silently return empty arrays instead of 403 errors`
- `/learn session-insight codebase-analysis timeout is usually caused by oversized partitions exceeding 100K tokens`

## Protocol

### 1. Validate input

- Confirm `<category>` is one of the 5 allowed values. If not, suggest the closest match.
- Confirm `<observation text>` is a clear, actionable statement. If vague, ask user to refine.

### 2. Generate entry ID

Format: `OBS-YYYY-NNNN` where:
- `YYYY` = current year
- `NNNN` = sequential number (read existing entries to determine next number)

Session observations use the `OBS-` prefix to distinguish from PDCA-generated instincts (`PDCA-` prefix).

### 3. Read current instinct registry

Read `.claude/pdca-archive/instincts.md` to:
- Count existing entries (both `OBS-` and `PDCA-` prefixed)
- Determine the next sequential number
- Check for duplicate or near-duplicate observations

### 4. Enforce FIFO cap

If adding this entry would exceed 50 total entries:
- Remove the oldest entry (first in the list) to make room
- Report which entry was evicted

### 5. Append entry

Add to `.claude/pdca-archive/instincts.md` in the format:
```
- [OBS-YYYY-NNNN] [category] observation text (YYYY-MM-DD)
```

### 6. Confirm

Report:
```
## Observation recorded

- **ID:** OBS-YYYY-NNNN
- **Category:** [category]
- **Text:** [observation]
- **Total entries:** N/50
```

If an entry was evicted, also report:
```
- **Evicted:** [old entry ID and text]
```

### Reference files
- Skill: `.claude/skills/learning-engine.md`
