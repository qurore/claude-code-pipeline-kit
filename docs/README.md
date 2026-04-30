# Documentation

Welcome to the Claude Code Pipeline Kit documentation.

## Reading paths

Pick the path that fits your goal. Each path is intended to be < 30 minutes end-to-end.

| Path | For | Read in this order |
|------|-----|--------------------|
| **Newcomer (5 min)** | "I want to try the kit." | `quickstart.md` -> `architecture.md` |
| **Customiser (15 min)** | "I want to bend the kit to my project." | `customization.md` -> `settings-reference.md` -> `hooks.md` |
| **Contributor (30 min)** | "I want to extend the kit." | `contributing.md` -> `hooks.md` -> `pipeline-state-design.md` -> `pipelines.md` |
| **Operator** | "I run pipelines and need the reference." | `pipelines.md` (canonical SE/EIW/DRW/PDCA reference) |

## Documentation index

| File | Purpose |
|------|---------|
| `quickstart.md` | Install and run your first pipeline in < 5 minutes. |
| `architecture.md` | Topology, lifecycle, data flow, and how hooks gate the lifecycle. |
| `pipelines.md` | Full SE / EIW / DRW / PDCA reference with restart policies. |
| `hooks.md` | Per-hook reference — events, payloads, decisions, failure modes. |
| `customization.md` | Brand allowlist, migration glob, default model override, custom skills. |
| `settings-reference.md` | Annotations for `.claude/settings.example.json`. |
| `contributing.md` | Repo structure, dev workflow, building hooks, running tests. |
| `pipeline-state-design.md` | Design rationale for the per-run state model and sentinel API. |

## Conventions

- All filenames are lowercase-kebab.
- All command examples are POSIX-shell (works in `bash` 3.2+ on macOS, `bash` 5+ on Linux).
- Code blocks targeting a specific runtime declare it (` ```ts ` for TypeScript, ` ```bash ` for shell).
- `<placeholders>` in commands are angle-bracketed.

## Where to file issues

If a docs file is wrong, missing, or out-of-date relative to the code, open an issue with the file path and a one-line summary of the gap.
