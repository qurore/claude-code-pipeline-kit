# Agent harness

> **Deference:** This skill supplements CLAUDE.md section "Skill, agent, and rule infrastructure." On conflict, CLAUDE.md governs. This skill does NOT define new pipeline gates or modify approval criteria -- it provides authoring guidance for the `.claude/` infrastructure files.

## Purpose

Guide for creating and maintaining agent personas, skill guides, command files, and rule files within the `.claude/` infrastructure. Ensures consistency across all infrastructure files and correct registration in CLAUDE.md.

## When to use

- Creating new agents, skills, commands, or rules
- Maintaining or updating existing infrastructure files
- PDCA Phase 4 (skill upgrade) when modifying target skill files
- Onboarding a new pipeline stage that requires a dedicated persona or protocol
- Reviewing infrastructure file quality during SE Phase 8 or EIW Stage 4

## Protocol

### 1. Determine file type

Each infrastructure file serves a distinct purpose. Choose the correct type before writing.

| Type | Directory | Purpose | Invocation |
|------|-----------|---------|------------|
| **Agent** | `.claude/agents/` | Persona with judgment framework and decision criteria | Referenced by subagents at pipeline stages |
| **Skill** | `.claude/skills/` | Procedural protocol with numbered steps and quality gates | Referenced by subagents during execution |
| **Command** | `.claude/commands/` | Slash-invokable workflow (pipeline stage, orchestrator) | `/command-name` via Skill tool |
| **Rule** | `.claude/rules/` | Always-on coding standards and conventions | Auto-loaded, applies globally |

**Decision tree:**
- Does it define WHO makes decisions? --> Agent
- Does it define HOW to execute a process? --> Skill
- Does it define a slash-invokable workflow? --> Command
- Does it define standards that apply to ALL code? --> Rule

### 2. Use canonical template

Each type has a canonical example to follow:

| Type | Canonical example | Required sections |
|------|------------------|-------------------|
| Agent | `.claude/agents/architect.md` | Model override, Persona, Core principles, Decision framework, Output standards, Anti-patterns, Pipeline stage mapping |
| Skill | `.claude/skills/verification-loop.md` | Deference header, Purpose, When to use, Protocol, Quality gates, Common pitfalls, Related agents/skills |
| Command | `.claude/commands/defect-fix.md` | Usage, Protocol steps |
| Rule | `.claude/rules/typescript.md` | Deference header, Rule sections with Rationale and Example |

**Key structural rules:**
- Agents start with `> **Model override:** ... model: "opus" ...` per CLAUDE.md mandate
- Skills and rules start with `> **Deference:** ... supplements CLAUDE.md [section] ...`
- All headings use sentence case
- Protocol steps are numbered, not bulleted

### 3. Add cross-references

Every infrastructure file should reference related files for discoverability.

- Agents: add "Related skills:" at the bottom listing skills this persona uses
- Skills: add "Related agents:" at the bottom listing agents that consume this skill
- Commands: reference the pipeline they belong to and predecessor/successor stages
- Rules: no cross-references needed (they apply globally)

### 4. Register in CLAUDE.md

After creating the file, add it to the appropriate table in CLAUDE.md under "Skill, agent, and rule infrastructure."

| File type | CLAUDE.md table |
|-----------|----------------|
| Skill | "Available skills" table |
| Agent | "Available agents" table |
| Rule | "Available rules" table |
| Command | Not in infrastructure tables (registered via `.claude/commands/` directory) |

### 5. Verify completeness

Run this checklist before considering the file done:

- [ ] File exists at the correct path (`.claude/{agents,skills,commands,rules}/`)
- [ ] Follows the canonical template for its type
- [ ] Deference header present (skills and rules) or model override (agents)
- [ ] No content duplicated from CLAUDE.md (reference CLAUDE.md sections instead)
- [ ] CLAUDE.md table updated with new entry
- [ ] Cross-references added to related files
- [ ] Line count within target range

## Naming conventions

| Convention | Rule | Example |
|------------|------|---------|
| Case | kebab-case | `research-protocol.md` |
| Segments | 2-3 segments maximum | `agent-harness.md`, not `agent-harness-construction-guide.md` |
| Pattern | noun or noun-noun | `verification-loop`, `coding-standards-supplement` |
| Avoid | Verbs, abbreviations, version numbers | Not `run-checks.md`, not `vl.md`, not `harness-v2.md` |

## Line targets

| Type | Target | Maximum |
|------|--------|---------|
| Agent | 80-100 | 150 |
| Skill | 80-130 | 150 |
| Command | 30-60 | 80 |
| Rule | 80-150 | 200 |

## Quality gates

| Gate | Criteria | Blocking |
|------|----------|----------|
| Template match | Follows canonical template for its file type | Yes |
| CLAUDE.md registration | Entry added to the correct infrastructure table | Yes |
| No duplication | Does not restate CLAUDE.md content (references it instead) | Yes |
| Deference header | Present and correctly scoped | Yes |
| Line count | Within target range for file type | Advisory |
| Cross-references | Related agents/skills listed | Advisory |

## Common pitfalls

- **Duplicating CLAUDE.md content** -- infrastructure files supplement CLAUDE.md, they do not repeat it. Reference the specific section instead of restating rules.
- **Missing pipeline stage mapping in agents** -- without this, subagents do not know when to invoke the persona. Every agent must map to at least one pipeline stage.
- **Creating a skill when a command is sufficient** -- skills are passive references; commands are invokable. If the file needs to be triggered via `/slash-command`, it belongs in commands.
- **Exceeding line targets** -- long files get skimmed, not read. If a skill exceeds 150 lines, it is likely covering too much scope. Split into two files.
- **Forgetting to update CLAUDE.md** -- an unregistered file is invisible to the system. The CLAUDE.md table is the discovery mechanism.

## Related agents

`architect`, `doc-updater`

## Related skills

`pipeline-hooks`
