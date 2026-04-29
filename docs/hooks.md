# Hooks reference

The kit ships 9 deterministic hooks that enforce CLAUDE.md MUST rules at fixed Claude Code lifecycle events. Hooks are TypeScript source compiled to ESM modules in `.claude/hooks/dist/` and dispatched by `.claude/hooks/hook-runner.sh`.

## Lifecycle table

| Hook | Lifecycle | Matcher | Purpose |
|------|-----------|---------|---------|
| `pretool.gate-skill` | PreToolUse | Skill | Phase-correct skill invocation (not the wrong stage) |
| `pretool.gate-output` | PreToolUse | Edit\|Write | File writes outside `.claude/` only during implementation phases |
| `pretool.enforce-opus` | PreToolUse | Task | Mandatory Opus model on subagent invocations |
| `posttool.lint-ui` | PostToolUse | Edit\|Write | Optional UI vocabulary check (sentence-case, brand whitelist) |
| `posttool.lint-skill` | PostToolUse | Edit\|Write | Skill-file lint (front-matter, structure, model field) |
| `posttool.remind-migration` | PostToolUse | Write | Optional migration reminder (project-specific path regex) |
| `session.resume` | SessionStart | -- | Detect resumable pipelines + dist freshness banner |
| `stop.flush-manifest` | Stop | -- | Persist run manifest atomically before session ends |
| `stop.enforce-pipeline-completion` | Stop | -- | Block premature stop while a pipeline is mid-flight |

## Per-hook reference

### pretool.gate-skill

**Fires:** PreToolUse(Skill).

**Behaviour:** Verifies that the requested skill is appropriate for the current pipeline phase. Reads `.claude/pipeline-state/<run-id>/manifest.json` to determine `current_phase`. Compares against the skill's declared phase (from front-matter or filename pattern). Blocks invocations that skip phases or invoke wrong-stage skills.

**Exit codes:** 0 (allow), 2 (block).

**Bypass:** None. The hook protects pipeline integrity.

---

### pretool.gate-output

**Fires:** PreToolUse(Edit\|Write).

**Behaviour:** Allows writes inside `.claude/` and `.git/` unconditionally. Outside those, allows writes only when:

1. An active pipeline is in an implementation phase (Phase 6, EIW Stage 2, DRW D3), OR
2. The trivial-fix sentinel exists at `.claude/pipeline-state/.trivial-fix-active` (atomically consumed on first allowed write), OR
3. `EDITOR_BYPASS=1` is set (escape hatch).

**Exit codes:** 0 (allow), 2 (block).

**Block message:** Surfaces the 4-tier decision tree so the operator can choose the right pipeline.

**Bypass:**

- Run a pipeline (`/se-pipeline`, `/eiw-review`, `/defect-fix`)
- Touch the sentinel for trivial fixes
- Set `EDITOR_BYPASS=1`

---

### pretool.enforce-opus

**Fires:** PreToolUse(Task).

**Behaviour:** Inspects the Task tool's `model` parameter. Allows `model: "opus"`. Blocks `model: "sonnet"`, `model: "haiku"`, missing model field, or any other value. Skill files may override per-skill via front-matter directive.

**Exit codes:** 0 (allow), 2 (block).

**Bypass:** `OPUS_GUARD_DISABLED=1` (emits SessionStart banner).

---

### posttool.lint-ui

**Fires:** PostToolUse(Edit\|Write).

**Behaviour:** Optional vocabulary linter. When enabled (`config/lint-ui.json` has `enabled: true`), scans modified `.tsx` / `.jsx` / `.html` files for:

- Title-case where sentence-case is required.
- Brand-whitelist violations (terms outside the project's vocabulary).

Default state: `enabled: false`. The hook is wired in `settings.json.template` but no-ops until you enable it. Configure the whitelist in `.claude/hooks/config/lint-ui.json`.

**Exit codes:** 0 (always; surfaces warnings on stderr).

---

### posttool.lint-skill

**Fires:** PostToolUse(Edit\|Write).

**Behaviour:** Validates skill files (`.claude/skills/*.md`, `.claude/commands/*.md`, `.claude/agents/*.md`) against the kit's authoring conventions:

- Required front-matter fields.
- Section structure (Purpose / When to use / Procedure / Output).
- `model: "opus"` directive present where applicable.

**Exit codes:** 0 (always; surfaces warnings on stderr).

---

### posttool.remind-migration

**Fires:** PostToolUse(Write).

**Behaviour:** Optional migration reminder. When enabled (`config/migration-reminder.json` has `enabled: true`), checks if the written path matches the configured regex (e.g. `^db/migrations/.*\.sql$`). On match, surfaces a reminder string to stderr.

Default state: `enabled: false`. Configure path regex and reminder text in `.claude/hooks/config/migration-reminder.json`.

**Exit codes:** 0 (always).

---

### session.resume

**Fires:** SessionStart.

**Behaviour:** Two responsibilities:

1. **Resumable pipeline detection.** Scans `.claude/pipeline-state/` for runs where `status` is `in_progress`. Surfaces a banner naming the run, current phase, and resume command.
2. **Dist freshness check.** Verifies all 9 expected `dist/<name>.js` files exist. If any are missing, surfaces a `[!] missing build artifacts (N of 9 hooks unavailable). Run: bash install.sh --rebuild-hooks` banner.

**Exit codes:** 0 (always; emits banner to stderr).

---

### stop.flush-manifest

**Fires:** Stop.

**Behaviour:** Atomically rewrites `.claude/pipeline-state/<run-id>/manifest.json` with the latest `current_phase`, `last_activity_at`, and any pending phase-history updates. Uses tempfile + rename for atomicity.

**Exit codes:** 0 (always).

---

### stop.enforce-pipeline-completion

**Fires:** Stop.

**Behaviour:** Inspects the active pipeline manifest. If a pipeline is in `status: in_progress` and the agent is attempting to stop without explicit operator override, surfaces a banner reminding to either complete the pipeline, abort it (`/abort-pipeline`), or accept the resumption.

This is INFORMATIONAL on stop hooks. The kit's design treats stop as a soft event -- pipelines resume on next session.

**Exit codes:** 0 (always).

## Configuration

The opt-in hooks read JSON config from `.claude/hooks/config/`:

- `config/lint-ui.json` -- `{ "enabled": false, "whitelist": ["GitHub", "PostgreSQL", ...] }`
- `config/migration-reminder.json` -- `{ "enabled": false, "pathPattern": "...", "reminderText": "..." }`

See `docs/customization.md` for full configuration walk-through.

## Output conventions

All hook stderr output is **ASCII-only** (printable bytes 0x20-0x7E plus LF). Forbidden in stderr:

- Unicode arrows (`->` allowed; `→` forbidden)
- Box-drawing characters
- Emoji
- Indicator glyphs other than `[!]`, `[OK]`, `[X]`

This guarantees hook output renders correctly on POSIX-locale terminals and CI logs without character encoding issues. Markdown documentation files (`.md`) are exempt and may use Unicode.

## Build and test

```bash
cd .claude/hooks
pnpm install
pnpm build         # Compiles to dist/
pnpm test          # Runs vitest with coverage
```

Coverage target: ≥80% on line, branch, function, statement.

## Troubleshooting

| Symptom | Diagnosis | Fix |
|---------|-----------|-----|
| Hook never fires | `settings.json` missing the hook entry | Re-copy `.claude/settings.json.template` |
| Hook fires but exits 0 unexpectedly | `dist/` missing -> falls back to tsx OR no-ops | `bash install.sh --rebuild-hooks` |
| Banner: `[!] missing build artifacts` | Build artifacts were not generated | `cd .claude/hooks && pnpm install && pnpm build` |
| Hook fires but blocks unexpectedly | Phase mismatch in manifest | Check `.claude/pipeline-state/<run-id>/manifest.json` -> `current_phase` |
| Want to disable enforcement temporarily | Set `EDITOR_BYPASS=1` (gate-output) or `OPUS_GUARD_DISABLED=1` (enforce-opus) | Restart session after testing |
