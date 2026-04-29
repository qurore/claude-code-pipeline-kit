# Documentation

Welcome to the Claude Code Pipeline Kit documentation.

## Reading order for newcomers

If this is your first encounter with the kit, read in this order:

1. **[Quickstart](quickstart.md)** -- get a first pipeline running end-to-end in 5 minutes.
2. **[Architecture](architecture.md)** -- the topology of the kit and how the parts compose.
3. **[Hooks](hooks.md)** -- the 9 deterministic hooks that enforce CLAUDE.md MUST rules.
4. **[Pipelines](pipelines.md)** -- the SE / EIW / DRW / PDCA pipelines in full.
5. **[Customisation](customization.md)** -- changing the model, UI lint, custom skills, project-specific overrides.
6. **[Contributing](contributing.md)** -- repo structure, dev workflow, running tests.
7. **[Settings reference](settings-reference.md)** -- annotated walk-through of every key in `.claude/settings.json.template`.

## Quick reference (alphabetical)

| File | Purpose |
|------|---------|
| [`architecture.md`](architecture.md) | Topology, lifecycle, data-flow diagram |
| [`contributing.md`](contributing.md) | Repository structure, development workflow, test layout |
| [`customization.md`](customization.md) | Model overrides, UI lint config, migration reminder, project-specific rules |
| [`hooks.md`](hooks.md) | Per-hook reference (9 hooks) with input contracts and exit codes |
| [`pipelines.md`](pipelines.md) | SE / EIW / DRW / PDCA full stage reference |
| [`quickstart.md`](quickstart.md) | 5-minute first-pipeline walk-through |
| [`settings-reference.md`](settings-reference.md) | Annotated `.claude/settings.json.template` reference |

## Top-level documents

- [`../CLAUDE.md`](../CLAUDE.md) -- the governance template you copy into your project root.
- [`../README.md`](../README.md) -- project overview and feature summary.

## Pipeline state and PDCA archive

- [`../.claude/pipeline-state/SCHEMA.md`](../.claude/pipeline-state/SCHEMA.md) -- shape of `manifest.json` and the per-run directory.
- [`../.claude/pdca-archive/instincts.md`](../.claude/pdca-archive/instincts.md) -- format of the operational lessons archive.

## Where features live

| Topic | Read |
|-------|------|
| "How do I configure the lint hook?" | `customization.md` -> "UI lint" |
| "My install errored — how do I rebuild?" | `quickstart.md` -> "Troubleshooting" |
| "I want to add a custom skill" | `customization.md` -> "Custom skills" |
| "What does Phase 5.5 do?" | `pipelines.md` -> "SE Pipeline / Bar Raisers" |
| "How do hooks know when to fire?" | `hooks.md` -> "Lifecycle table" |
| "Why is my Edit blocked?" | `hooks.md` -> "pretool.gate-output" |
