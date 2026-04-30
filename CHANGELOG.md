# Changelog

All notable changes to the Claude Code Pipeline Kit are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-04-29

Major release: full port of the upstream `.claude/` infrastructure as a standalone OSS toolkit. Adds the deterministic hooks subsystem, per-run pipeline state persistence, Bar Raiser injection points, Trivial-Fix sentinel, the sentinel-CLI, and complete skill/agent/rule infrastructure. All proprietary references have been stripped.

### Added

- **`.claude/skills/` (18 files)** — procedural workflow guides covering TDD, verification, security review, evaluation, coding standards, learning engine, API design, E2E testing, postgres patterns, database migrations, LLM cost management, agentic patterns, research protocol, agent harness authoring, iterative search, pipeline hooks, session persistence, and context compaction.
- **`.claude/agents/` (9 files)** — persona reference cards for architect, build-error-resolver, code-reviewer, doc-updater, e2e-runner, planner, refactor-cleaner, security-reviewer, and tdd-guide. All require `model: opus`.
- **`.claude/rules/` (2 files)** — coding-standards files for TypeScript and common conventions, supplementing CLAUDE.md.
- **`.claude/hooks/` (9 hooks)** — deterministic enforcement of CLAUDE.md MUST rules:
  - `pretool.gate-skill` — Phase gate (prior phase must be approved)
  - `pretool.gate-output` — Output gate (file writes only during implementation phases or with sentinel)
  - `pretool.enforce-opus` — Mandatory `model: "opus"` on subagents
  - `posttool.lint-ui` — UI rule violations on `*.tsx` (configurable brand allowlist)
  - `posttool.lint-skill` — Skill file structural lint
  - `posttool.remind-migration` — Migration reminder (configurable path glob)
  - `session.resume` — In-progress runs banner + archival at SessionStart
  - `stop.flush-manifest` — Manifest persistence at Stop
  - `stop.enforce-pipeline-completion` — Block stop while pipeline mid-run (bounded, with abort)
- **`.claude/pipeline-state/` SCHEMA + lifecycle** — per-run on-disk state for SE/EIW/DRW pipelines that survives context compaction and session restart.
- **`.claude/hooks/bin/sentinel-cli.mjs`** — CLI for pipeline lifecycle (start/advance/complete/abort/list).
- **Bar Raiser injection points** — SE-5.5 (Design), SE-7.5 (Implementation), EIW-3.5, DRW-D3.5. Each is mandatory, single-shot per run, FREE-redo, with 4 UX dimensions (FRICTION / DELIGHT_GAP / CONSISTENCY / ACCESSIBILITY).
- **Trivial-Fix sentinel** — `.claude/pipeline-state/.trivial-fix-active` provides a single-shot bypass for Hook 2 outside an active pipeline.
- **`docs/pipeline-state-design.md`** — generalised design rationale for the pipeline state model.
- **`docs/customization.md`** — guide to brand allowlist, migration glob, model override, and custom skills/agents/rules.
- **`.claude/settings.example.json`** — hook wiring template using `$CLAUDE_PROJECT_DIR` paths.
- **`.claude/hooks/scripts/check-brand-purity.sh`** — proprietary-term grep gate (CI gate).
- **`tests/install.test.sh`** — 5-scenario smoke test for the installer.
- **Top-level `package.json`** — kit metadata (MIT, version 2.0.0).
- **Comprehensive `.gitignore`** — covers per-run state, transient sentinels, hook build artifacts, screenshots.

### Changed

- **`install.sh` rewritten** for v2.0.0:
  - 6 new component-level flags: `--skills`, `--agents`, `--rules`, `--hooks`, `--commands`, `--state`
  - Added `--no-deps` (skip hook npm install + build)
  - Idempotency via `cmp -s` byte-comparison (re-runs report "Unchanged: N files")
  - Node 20+ detection before invoking hook build
  - Preserved 6 existing flags: `--se`, `--eiw`, `--drw`, `--pdca`, `--all`, `--claude-md`, `--pdca-archive`, `--dry-run`, `--force`, `--list`, `-h/--help`
- **`.claude/hooks/package.json`** — renamed package to `claude-code-pipeline-kit-hooks`. Added `claudeHooks.brandAllowlist` and `claudeHooks.migrationGlob` config blocks. Bumped version to 2.0.0.
- **`posttool.lint-ui.ts`** — externalised the brand allowlist; reads from `package.json#claudeHooks.brandAllowlist[]` at startup with sensible defaults.
- **`posttool.remind-migration.ts`** — externalised the path glob; reads from `package.json#claudeHooks.migrationGlob` (default empty disables hook).
- **`lib/messages.ts`** — generalised migration-reminder message to be project-agnostic.
- **`README.md`** — updated component counts (33 commands - 40 commands; added skill/agent/rule sections, hook subsystem, sentinel-CLI, brand-purity policy, Node 20+ requirement).
- **`CLAUDE.md`** — extended with Bar Raiser registry, hooks subsystem, pipeline-state, Trivial-Fix sentinel, escape hatches, and skills/agents/rules infrastructure tables.
- **All commands/agents/rules/skills** — brand-stripped (no proprietary references in shipping content).
- **Node engine** — minimum Node 20 (was 18 in 1.0.0).

### Removed

- Proprietary command files: `chat-patrol.md`, `feedback-triage.md`, `site-patrol.md`, `ui-audit.md`, `ui-forge.md` (replaced by generic patterns where applicable).
- `database-reviewer.md` agent (project-specific).
- `annotate-skills.sh` script (project-specific).
- All proprietary product references in shipping content.

### Migration from 1.0.0

If you have a v1.0.0 install and want to upgrade:

1. **Remove old commands**: `rm .claude/commands/{chat-patrol,site-patrol,ui-audit,ui-forge}.md`
2. **Update CLAUDE.md** with the new sections (Bar Raisers, hooks, sentinel, escape hatches) — see kit's `CLAUDE.md` for the canonical version.
3. **Re-run install**: `./install.sh --all --force` (idempotency means safe re-run).
4. **Enable hooks**: `cp .claude/settings.example.json .claude/settings.json` and restart Claude Code.
5. **(Optional) configure**: edit `.claude/hooks/package.json#claudeHooks` to set your brand allowlist and migration glob.

## [1.0.0] - 2026-02-18

Initial release. SE/EIW/DRW/PDCA pipeline skill files (30 files) for Claude Code.
