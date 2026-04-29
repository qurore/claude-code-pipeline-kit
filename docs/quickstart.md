# Quickstart

Get a first pipeline running end-to-end in 5 minutes.

## Prerequisites

- [Claude Code](https://docs.claude.com/claude-code) installed and authenticated
- Node.js 18 or newer (`node --version`)
- pnpm 8+ (preferred) or npm (fallback): `pnpm --version`
- bash 3.2 or newer (`bash --version` -- macOS ships 3.2.57; this is fine)

## Step 1 -- Install the kit into your project

From your project root:

```bash
git clone https://github.com/your-org/claude-code-pipeline-kit /tmp/kit
cd /tmp/kit
bash install.sh --all
```

The installer:

1. Copies `.claude/{skills,agents,rules,commands}/` into your project's `.claude/`.
2. Copies `.claude/hooks/` source files.
3. Compiles hooks (`pnpm install && pnpm build`) into `.claude/hooks/dist/`. This takes about 20-30 seconds.
4. Copies `.claude/pipeline-state/SCHEMA.md`.

If you already have a `.claude/` directory, the installer prompts before overwriting. Use `--force` to overwrite without prompting, or `--dry-run` to preview.

## Step 2 -- Enable the hooks

```bash
cp .claude/settings.json.template .claude/settings.json
```

This wires all 9 hooks. The two opt-in hooks (`posttool.lint-ui`, `posttool.remind-migration`) are wired but no-op until you enable them in `.claude/hooks/config/`.

## Step 3 -- Add the governance file

Copy the template into your project root if you do not already have a `CLAUDE.md`:

```bash
cp /tmp/kit/CLAUDE.md ./CLAUDE.md
```

Open `CLAUDE.md` and fill in the placeholders:

- `<YOUR PROJECT NAME>`
- `<YOUR PRODUCT DESCRIPTION>`
- `<YOUR STACK>` (e.g. Next.js + Postgres + your payment provider)
- `## Build & Test Commands` table -- replace the example commands with your project's actual commands

## Step 4 -- Restart Claude Code and run a pipeline

Close and reopen your Claude Code session so the hook settings take effect.

Then trigger any pipeline:

```
/se-pipeline Add a /health endpoint to the API
```

This kicks off the full SE Pipeline starting at Phase 0 (Codebase Exploration). You will see:

- Phase 0 (Codebase Exploration) reads your repo, produces a context summary.
- Phase 1 (Prompt Analysis) clarifies the request and confirms scope.
- Phases 2-9 proceed in turn with quality gates between them.
- Bar Raisers fire at 5.5 (after design) and 7.5 (after implementation).

If you want a lighter first run, try:

```
/checkpoint
```

This invokes the `checkpoint` utility skill -- a quick health probe (build + types + lint + tests) -- without triggering the full pipeline. It is useful for confirming the kit is wired.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Edit blocked with "no-active-pipeline" | The output gate is enforcing pipeline-only writes | Run a pipeline OR `touch .claude/pipeline-state/.trivial-fix-active` for a 1-shot trivial fix |
| `[!] missing build artifacts (N of 9 hooks unavailable)` banner | `dist/` was not generated | `bash install.sh --rebuild-hooks` |
| Hooks not firing at all | `settings.json` not enabled | Confirm `.claude/settings.json` exists; restart Claude Code |
| Mandatory Opus error on subagent | Sub-agent invocation set a non-Opus model | Add `model: "opus"` to the Task tool call, or set `OPUS_GUARD_DISABLED=1` if migrating |

## Next steps

- Read `docs/architecture.md` to understand how the parts fit together.
- Read `docs/pipelines.md` for the full pipeline reference.
- Read `docs/customization.md` to tune the kit for your project.
