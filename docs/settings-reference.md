# `.claude/settings.json` reference

This document walks through every key in `.claude/settings.json.template`. The template itself is strict JSON (no `_comment` keys) so it parses cleanly with `jq .`. Use this document as the annotated companion.

## Top-level shape

```json
{
  "permissions": { "allow": [...] },
  "hooks": {
    "PreToolUse": [...],
    "PostToolUse": [...],
    "SessionStart": [...],
    "Stop": [...]
  }
}
```

The kit ships only `permissions` and `hooks`. Other Claude Code settings (e.g. `model`, `theme`) are left to the operator.

## `permissions.allow`

```json
"permissions": {
  "allow": [
    "Edit(.claude/**)",
    "Write(.claude/**)",
    "MultiEdit(.claude/**)"
  ]
}
```

**Purpose:** allows the agent to edit / write files inside `.claude/` without per-call permission prompts. The kit needs this for every pipeline operation.

**Customisation:** add `Edit(src/**)` and `Write(src/**)` if you want unattended writes to your code tree. Without these, every Edit/Write outside `.claude/` will prompt.

> Tighter alternative: leave the defaults and rely on the `pretool.gate-output` hook to gate writes. The hook's "implementation phase" check provides the same safety with finer phase awareness.

## `hooks.PreToolUse`

Three matchers, three hooks.

### Skill matcher -> `pretool.gate-skill`

```json
{
  "matcher": "Skill",
  "hooks": [
    { "type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/hook-runner.sh pretool.gate-skill", "timeout": 5 }
  ]
}
```

**Fires when:** the agent invokes a Skill tool call.

**Behaviour:** confirms the skill matches the current pipeline phase. Blocks wrong-stage invocations.

**Timeout:** 5 seconds. If the hook does not respond, Claude Code allows the action (fail-open).

**Customisation:** none required. To disable, remove the entry.

### Edit/Write matcher -> `pretool.gate-output`

```json
{
  "matcher": "Edit|Write",
  "hooks": [
    { "type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/hook-runner.sh pretool.gate-output", "timeout": 5 }
  ]
}
```

**Fires when:** the agent invokes Edit or Write.

**Behaviour:** allows writes inside `.claude/` and `.git/`; outside those, requires an active pipeline implementation phase OR the trivial-fix sentinel OR `EDITOR_BYPASS=1`.

**Customisation:** the hook reads from `.claude/pipeline-state/` to determine current phase. No config file -- the behaviour is fixed.

### Task matcher -> `pretool.enforce-opus`

```json
{
  "matcher": "Task",
  "hooks": [
    { "type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/hook-runner.sh pretool.enforce-opus", "timeout": 5 }
  ]
}
```

**Fires when:** the agent invokes the Task tool (subagent spawn).

**Behaviour:** verifies `model: "opus"` is set. Blocks otherwise unless `OPUS_GUARD_DISABLED=1`.

**Customisation:** see `docs/customization.md` "Model override".

## `hooks.PostToolUse`

Two matcher groups.

### Edit/Write matcher -> two hooks

```json
{
  "matcher": "Edit|Write",
  "hooks": [
    { "type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/hook-runner.sh posttool.lint-ui", "timeout": 5 },
    { "type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/hook-runner.sh posttool.lint-skill", "timeout": 5 }
  ]
}
```

Two hooks fire after every Edit / Write:

1. **`posttool.lint-ui`** -- optional UI vocabulary check (default `enabled: false`). See `docs/customization.md` "UI lint".
2. **`posttool.lint-skill`** -- skill-file lint. Always-on; warns about missing front-matter, structure issues.

**Customisation:** to disable lint-ui entirely, remove the entry. To configure, edit `.claude/hooks/config/lint-ui.json`.

### Write matcher -> migration reminder

```json
{
  "matcher": "Write",
  "hooks": [
    { "type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/hook-runner.sh posttool.remind-migration", "timeout": 5 }
  ]
}
```

**Fires when:** Write tool is used (excludes Edit -- only fires on file creation).

**Behaviour:** optional migration reminder (default `enabled: false`). When enabled, prints a configurable reminder to stderr if the written path matches a configured regex.

**Customisation:** see `docs/customization.md` "Migration reminder".

## `hooks.SessionStart`

```json
"SessionStart": [
  {
    "hooks": [
      { "type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/hook-runner.sh session.resume", "timeout": 10 }
    ]
  }
]
```

**Fires when:** Claude Code initializes a session.

**Behaviour:** scans for resumable pipelines and verifies hook `dist/` integrity. Surfaces banners.

**Timeout:** 10 seconds (slightly longer than tool hooks because the directory scan can take time on large `.claude/pipeline-state/`).

**Customisation:** none required.

## `hooks.Stop`

```json
"Stop": [
  {
    "hooks": [
      { "type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/hook-runner.sh stop.flush-manifest", "timeout": 10 }
    ]
  },
  {
    "hooks": [
      { "type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/hook-runner.sh stop.enforce-pipeline-completion", "timeout": 10 }
    ]
  }
]
```

**Fires when:** Claude Code session is about to terminate.

**Two hooks:**

1. **`stop.flush-manifest`** -- atomically rewrite the active pipeline's `manifest.json`.
2. **`stop.enforce-pipeline-completion`** -- surface a banner if a pipeline is mid-flight.

**Customisation:** none recommended. Removing these breaks resume-after-restart behaviour.

## Common customisations

### Add additional permission scope

```json
"permissions": {
  "allow": [
    "Edit(.claude/**)",
    "Write(.claude/**)",
    "MultiEdit(.claude/**)",
    "Edit(src/**)",
    "Write(src/**)",
    "Bash(npm:*)",
    "Bash(pnpm:*)"
  ]
}
```

### Disable a hook temporarily

Remove the corresponding entry. To re-enable, copy from `.claude/settings.json.template`.

### Increase timeouts

If your environment is slow (CI, low-memory machine), increase the `timeout` values. Note: timeouts >= 30 seconds may be capped by Claude Code.

## See also

- `docs/hooks.md` -- per-hook reference (input contract, exit codes, behaviour).
- `docs/customization.md` -- broader customisation patterns (model, lint, custom skills).
- `examples/settings.json` -- a realistic working configuration with optional hooks enabled.
