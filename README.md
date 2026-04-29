# Claude Code Pipeline Kit

Structured engineering pipelines for [Claude Code](https://docs.claude.com/claude-code). Multi-phase quality gates, persona-based reviews, deterministic hook enforcement, and a self-improving learning cycle -- in a single drop-in `.claude/` directory.

This kit transforms Claude Code from a conversational assistant into a governed engineering harness:

- **9 deterministic hooks** enforce CLAUDE.md MUST rules at the right tool boundary (output gating, phase gating, model enforcement, lint, migration reminder, completion enforcement).
- **4 pipelines** for the full software lifecycle: full-cycle (SE), implementation-only (EIW), defect resolution (DRW), and self-improvement (PDCA).
- **18 procedural skills + 9 agent personas + 2 rule sets** keep every stage anchored to the same standards.
- **Pipeline state persistence** survives compaction and session restart so long-running pipelines do not lose progress.
- **English-only, vendor-neutral, and license-clean (MIT).**

---

## Quickstart

```bash
git clone https://github.com/your-org/claude-code-pipeline-kit
cd claude-code-pipeline-kit
bash install.sh --all
```

What `install.sh --all` does:

1. Copies `.claude/skills/`, `.claude/agents/`, `.claude/rules/`, `.claude/commands/` into your project.
2. Compiles the 9 hooks (`npm install && npm run build`) into `.claude/hooks/dist/`.
3. Copies `.claude/pipeline-state/SCHEMA.md` so the state mechanism is documented in your repo.

Then enable the hooks by copying the settings template:

```bash
cp .claude/settings.json.template .claude/settings.json
```

Restart Claude Code. The next `/se-pipeline`, `/eiw-review`, `/defect-fix`, or `/pdca-cycle` invocation will run end-to-end with full hook enforcement.

> **First time?** Read `docs/quickstart.md` for the 5-minute walk-through.

---

## What's inside

| Component | Count | Location |
|-----------|------:|----------|
| Skills (procedural workflow guides) | 18 | `.claude/skills/` |
| Agents (persona reference cards) | 9 | `.claude/agents/` |
| Rules (coding standards) | 2 | `.claude/rules/` |
| Commands (pipeline + utility skills) | 40 | `.claude/commands/` |
| Hooks (TypeScript, compiled to `dist/`) | 9 | `.claude/hooks/` |

**Pipelines:**

- **SE Pipeline** -- Full lifecycle (Phase 0 Exploration -> Phase 9 CEO approval), 12 phases including UX Bar Raisers at 5.5 and 7.5.
- **EIW (Enterprise Implementation Workflow)** -- 8 stages for implementation-only tasks (Stage 0 Architecture Review -> Stage 7 CEO approval) with Stage 3.5 Bar Raiser.
- **DRW (Defect Resolution Workflow)** -- 6 stages for bug fixes (D1 Investigation -> D5 Technical Review) with D3.5 Bar Raiser.
- **PDCA** -- 4 phases of autonomous self-improvement (Incident -> Attribution -> Synthesis -> Upgrade) triggered automatically after every error or feedback resolution.

**Hooks (deterministic CLAUDE.md enforcement):**

| Hook | Lifecycle | What it gates |
|------|-----------|---------------|
| `pretool.gate-skill` | PreToolUse(Skill) | Phase-correct skill invocation |
| `pretool.gate-output` | PreToolUse(Edit/Write) | File writes outside `.claude/` only during implementation phases |
| `pretool.enforce-opus` | PreToolUse(Task) | Mandatory Opus model on subagents |
| `posttool.lint-ui` | PostToolUse(Edit/Write) | Optional UI vocabulary check |
| `posttool.lint-skill` | PostToolUse(Edit/Write) | Skill-file lint (front-matter, structure) |
| `posttool.remind-migration` | PostToolUse(Write) | Optional migration reminder |
| `session.resume` | SessionStart | Detect resumable pipelines + dist freshness |
| `stop.flush-manifest` | Stop | Persist run manifest atomically |
| `stop.enforce-pipeline-completion` | Stop | Block premature stop while a pipeline is mid-flight |

> Full reference: `docs/hooks.md`. Customisation: `docs/customization.md`.

---

## Architecture

The kit follows a **CLAUDE.md > skills/agents/rules > instincts** precedence model:

```
        ┌─────────────────────────────────────────┐
        │  CLAUDE.md  (governance, principles)    │
        └────────────────┬────────────────────────┘
                         │
         ┌───────────────┼───────────────┬─────────────┐
         ▼               ▼               ▼             ▼
   .claude/skills/   .claude/agents/   .claude/rules/   .claude/commands/
   (workflow)        (personas)        (style)          (pipelines)
                         │
                         ▼
               .claude/hooks/  (deterministic enforcement)
                         │
                         ▼
            .claude/pipeline-state/  (per-run state)
                         │
                         ▼
            .claude/pdca-archive/    (learning history)
```

Pipelines run through a sequence of **Step A Discussion -> Step B Convergence -> Step C Deliverable -> Step D Approval** within each phase. Bar Raisers inject between major implementation gates and force one mandatory UX redo per pipeline.

> Full overview: `docs/architecture.md`.

---

## Pipelines at a glance

### Intent classification (4-tier)

The kit installs a 4-tier decision tree into your CLAUDE.md so Claude Code automatically routes work:

| User intent | Pipeline | Trigger |
|-------------|----------|---------|
| Read-only / advice | None | Conversational |
| Trivial fix (1 file, ≤3 lines, cosmetic) | None (with sentinel) | Apply directly |
| Bug / error / test failure | `/defect-fix` (DRW) | Investigation -> scope -> TDD fix -> verification -> review |
| New feature / artifact / undefined design | `/se-pipeline` (SE) | Full 10-phase lifecycle |
| Defined design, implementation only | `/eiw-review` (EIW) | 8 stages, lighter gate set |

> Full pipeline reference: `docs/pipelines.md`.

---

## Customisation

The kit ships sensible defaults but every gate is configurable:

- **Model override** -- swap `model: "opus"` for `model: "sonnet"` to reduce cost.
- **UI lint vocabulary** -- enable `posttool.lint-ui` and add brand-specific terms.
- **Migration reminder** -- enable `posttool.remind-migration` and supply your project's migration path regex.
- **Custom skills** -- author project-specific workflow skills under `.claude/skills/`.

> Full guide: `docs/customization.md`.

---

## Documentation map

```
docs/
├── README.md            # Reading order for newcomers
├── quickstart.md        # 5-minute first run
├── architecture.md      # Topology, lifecycle, data flow
├── hooks.md             # Per-hook reference
├── pipelines.md         # SE / EIW / DRW / PDCA full reference
├── customization.md     # Model, lint, custom skills
├── contributing.md      # Repo structure, dev workflow, tests
└── settings-reference.md # Annotations for .claude/settings.json.template
```

---

## Requirements

- Claude Code (latest)
- Node.js 20+ (the hooks compile from TypeScript -> ESM)
- npm (ships with Node)
- bash 3.2+ (the install script is bash 3.2-compatible — runs on stock macOS)

---

## License

[MIT](LICENSE) -- use it commercially, modify it, redistribute it. The kit is offered as-is with no warranty.

---

## Acknowledgements

This kit is a generalised port of an internal pipeline harness used to build a production AI engineering platform. It is contributed under MIT for general use.
