# Claude Code Kaizen

**Structured development pipelines for Claude Code. Enterprise-grade quality gates, multi-persona reviews, and self-improving workflows.**

Kaizen (改善) means *continuous improvement*. This toolkit transforms Claude Code from a conversational AI assistant into a **governed engineering pipeline** with quality gates, persona-based reviews, and autonomous self-improvement.

---

## What's Inside

**30 skill files** organized into 6 categories:

| Category | Skills | Purpose |
|----------|--------|---------|
| **SE Pipeline** | 11 files | Full 9-phase software engineering lifecycle — from prompt analysis to CEO approval |
| **EIW** | 9 files | Enterprise Implementation Workflow — focused implementation with architecture review |
| **DRW** | 1 file | Defect Resolution Workflow — structured bug investigation and comprehensive fix |
| **PDCA** | 5 files | Self-improvement cycle — autonomous skill refinement after every error |
| **QA Patrol** | 2 files | Autonomous web and chat testing with Playwright |
| **UI Quality** | 2 files | Design compliance auditing and polished UI implementation |

Plus a **governance CLAUDE.md** with intent classification rules that automatically route tasks to the right pipeline.

---

## How It Works

### Intent Classification

When you install Kaizen, your Claude Code agent gains a 4-tier intent classification system:

```
User message
  │
  ├─ No file changes needed? ──→ Advisory (respond directly)
  │
  ├─ Bug/error report?
  │   ├─ Trivial (1 file, ≤3 lines)? ──→ Fix directly
  │   └─ Non-trivial? ──→ /defect-fix (DRW pipeline)
  │
  ├─ New feature / architecture change? ──→ /se-pipeline (full lifecycle)
  │
  └─ Implementation with defined requirements? ──→ /eiw-review (focused workflow)
```

### SE Pipeline: 9-Phase Quality Gate

The SE Pipeline takes a feature from idea to production through 9 rigorous phases:

```
Phase 1: Prompt Analysis        ─┐
Phase 2: Prompt Requirements     │  Each phase has:
Phase 3: SE Planning             │  • Tri-Persona Discussion (Innovator/Guardian/Catalyst)
Phase 4: SE Requirements         │  • Critical Thinking Convergence
Phase 5: Analysis & Design       │  • Deliverable Generation
Phase 6: Implementation (TDD)    │  • Phase Approval Gate
Phase 7: Testing                 │
Phase 8: 3-Round Evaluation     ─┘
Phase 9: Final Approval (PM → CTO → CEO)
```

**Cross-phase restart policy**: If a later phase fails, the pipeline restarts from the correct earlier phase — not from scratch. Max 3 restarts before human escalation.

### EIW: Enterprise Implementation Workflow

For when requirements are already defined and you just need implementation with quality gates:

```
Stage 0: Architecture Review (UCAR + LAR)
Stage 1: Hierarchical Task Decomposition
Stage 2-3: TDD Implementation + Checkpoint (per task group)
Stage 4: 3-Round Final Review (parallel)
Stage 5-7: PM → CTO → CEO Approval (sequential)
```

### DRW: Defect Resolution Workflow

Structured bug fixing with comprehensive scope analysis:

```
D1: Investigation & Root Cause Analysis
D2: Codebase-Wide Scope Analysis (find ALL occurrences)
D3: TDD Fix (regression test first, then fix)
D4: Full Verification
D5: Technical Review
```

### PDCA: Self-Improving Agent

After every error resolution, PDCA automatically analyzes what went wrong and upgrades the agent's skills:

```
Phase 1: Incident Analysis — What happened?
Phase 2: Root Process Attribution — Where in the pipeline should this have been caught?
Phase 3: Knowledge Synthesis — What skill modification prevents recurrence?
Phase 4: Skill Upgrade Execution — Apply the modification with traceability
```

Every modification is archived and tagged with a PDCA cycle ID for full traceability.

---

## Installation

### Quick Install (All Skills)

```bash
git clone https://github.com/qurore/claude-code-kaizen.git
cd claude-code-kaizen
./install.sh /path/to/your-project
```

### Selective Install

```bash
# Only pipeline skills (SE + EIW + DRW + PDCA)
./install.sh --pipelines /path/to/your-project

# Only SE Pipeline
./install.sh --se /path/to/your-project

# Only defect resolution + self-improvement
./install.sh --drw --pdca /path/to/your-project

# Only QA patrol tools
./install.sh --qa /path/to/your-project

# Include governance CLAUDE.md
./install.sh --claude-md /path/to/your-project

# Preview without copying
./install.sh --dry-run /path/to/your-project

# List all available skills
./install.sh --list
```

### Manual Install

Copy the skill files you want from `.claude/commands/` into your project's `.claude/commands/` directory:

```bash
mkdir -p your-project/.claude/commands
cp .claude/commands/se-*.md your-project/.claude/commands/
cp .claude/commands/defect-fix.md your-project/.claude/commands/
```

---

## Configuration

After installation, configure your project's build/test commands. The skill files use placeholder variables that need to match your project's tooling.

### Step 1: Update CLAUDE.md

Add or merge these into your project's `CLAUDE.md`:

```markdown
## Build & Test Commands
- **$BUILD_CMD**: npm run build
- **$TEST_CMD**: npm run test -- --run
- **$LINT_CMD**: npm run lint
- **$TYPE_CHECK_CMD**: npm run type-check
- **$COVERAGE_CMD**: npm run test:coverage
- **$E2E_CMD**: npm run test:e2e
```

Replace with your project's actual commands:

| Variable | Node.js | Python | Rust | Go |
|----------|---------|--------|------|----|
| `$BUILD_CMD` | `npm run build` | `python -m build` | `cargo build` | `go build ./...` |
| `$TEST_CMD` | `npm run test` | `pytest` | `cargo test` | `go test ./...` |
| `$LINT_CMD` | `npm run lint` | `ruff check .` | `cargo clippy` | `golangci-lint run` |
| `$TYPE_CHECK_CMD` | `tsc --noEmit` | `mypy .` | *(included in build)* | *(included in build)* |
| `$COVERAGE_CMD` | `npm run test:coverage` | `pytest --cov` | `cargo tarpaulin` | `go test -cover` |

### Step 2: Model Configuration (Optional)

By default, all subagents use `model: "opus"` for maximum review quality. To reduce cost, you can override this in your CLAUDE.md:

```markdown
## Kaizen Model Override
- Subagent model: sonnet (instead of opus)
```

> **Trade-off**: Opus provides significantly better multi-step reasoning and code review quality. Sonnet is faster and cheaper but may miss subtle issues in complex reviews.

---

## Usage

Once installed, use the skills as slash commands in Claude Code:

```
# Full software engineering lifecycle
/se-pipeline Add user authentication with OAuth2

# Focused implementation (requirements defined)
/eiw-review Implement the billing page per the design doc

# Bug investigation and fix
/defect-fix Runtime error: Cannot read property 'id' of undefined

# Self-improvement (usually auto-triggered)
/pdca-cycle Trigger: error_report. Error: ...

# QA testing
/site-patrol https://localhost:3000
/chat-patrol https://localhost:3000/chat

# UI quality
/ui-forge Create a settings page with profile editing
/ui-audit src/components/dashboard/projects-page.tsx
```

---

## Skill Reference

### SE Pipeline

| Skill | Phase | Purpose |
|-------|-------|---------|
| `/se-pipeline` | Orchestrator | Runs all 9 phases end-to-end |
| `/se-1-prompt-analysis` | Phase 1 | Analyze user's prompt for scope and intent |
| `/se-2-prompt-requirements` | Phase 2 | Derive user stories and acceptance criteria |
| `/se-3-planning` | Phase 3 | Plan implementation approach and dependencies |
| `/se-4-requirements` | Phase 4 | Define functional requirements and data model |
| `/se-5-design` | Phase 5 | Technical design with 4-stakeholder review |
| `/se-6-implementation` | Phase 6 | TDD implementation with checkpoint reviews |
| `/se-7-testing` | Phase 7 | Test execution and coverage verification |
| `/se-8-evaluation` | Phase 8 | 3-round parallel evaluation |
| `/se-9-approval` | Phase 9 | PM → CTO → CEO sequential approval |
| `/se-step-a-discussion` | Shared | Tri-Persona Discussion protocol |

### EIW

| Skill | Stage | Purpose |
|-------|-------|---------|
| `/eiw-review` | Orchestrator | Runs all 8 stages end-to-end |
| `/eiw-stage0` | Stage 0 | Architecture review (UCAR + LAR) |
| `/eiw-stage1` | Stage 1 | Hierarchical task decomposition |
| `/eiw-stage2` | Stage 2 | TDD implementation per task |
| `/eiw-stage3` | Stage 3 | Task group checkpoint review |
| `/eiw-stage4` | Stage 4 | 3-round parallel final review |
| `/eiw-stage5` | Stage 5 | PM approval |
| `/eiw-stage6` | Stage 6 | CTO technical review |
| `/eiw-stage7` | Stage 7 | CEO strategic approval |

### DRW

| Skill | Purpose |
|-------|---------|
| `/defect-fix` | 5-stage defect resolution (D1→D5) |

### PDCA

| Skill | Phase | Purpose |
|-------|-------|---------|
| `/pdca-cycle` | Orchestrator | Runs all 4 phases |
| `/pdca-1-incident` | Phase 1 | Incident timeline reconstruction |
| `/pdca-2-attribution` | Phase 2 | Root process attribution |
| `/pdca-3-synthesis` | Phase 3 | Knowledge synthesis and improvement design |
| `/pdca-4-upgrade` | Phase 4 | Skill file modification with traceability |

### QA & UI

| Skill | Purpose |
|-------|---------|
| `/site-patrol` | Autonomous web exploration and bug discovery |
| `/chat-patrol` | Autonomous chat/AI interface testing |
| `/ui-forge` | Polished UI component implementation |
| `/ui-audit` | Design compliance scoring and remediation |

---

## Architecture

### Multi-Persona Reviews

The pipelines use **isolated subagent personas** for independent judgment:

| Persona | Where Used | Focus |
|---------|-----------|-------|
| **Innovator** | SE Phase 1-9 (Step A) | Creative alternatives, challenge assumptions |
| **Guardian** | SE Phase 1-9 (Step A) | Risk analysis, failure modes, proven patterns |
| **Catalyst** | SE Phase 1-9 (Step A) | Strategic synthesis, breaks deadlocks |
| **PM** | SE Phase 9, EIW Stage 5 | User value, requirements satisfaction |
| **CTO** | SE Phase 9, EIW Stage 6 | Architecture, security, scalability |
| **CEO** | SE Phase 9, EIW Stage 7 | Business value, strategic alignment |
| **QA Lead** | EIW Stage 3, DRW D4 | Test coverage, verification |
| **Defect Analyst** | DRW D1 | Root cause investigation |
| **Pattern Analyst** | DRW D2 | Codebase-wide scope analysis |

### Restart Policies

Every pipeline has a structured restart policy that ensures quality while preventing infinite loops:

- **SE Pipeline**: Max 3 cross-phase restarts. Phase-internal restarts are free.
- **EIW**: Max 3 restarts. Architecture invalidation restarts from Stage 0.
- **DRW**: Max 2 restarts. D4/D5 failure restarts from D3.
- **PDCA**: No restarts — fully autonomous, runs once.

### PDCA Archive

Self-improvement cycles are fully archived for traceability:

```
.claude/pdca-archive/
├── index.json              # Searchable cycle index
└── cycles/
    ├── PDCA-2026-0001.md   # Full cycle documentation
    ├── PDCA-2026-0002.md
    └── ...
```

Every skill modification includes a traceability comment:
```markdown
<!-- PDCA-2026-0001: Added null check for optional fields -->
```

---

## Customization

### Adding Your Own Skills

Create new `.md` files in `.claude/commands/`:

```markdown
# My Custom Skill

You are executing **My Custom Skill** for the task described by the user.

## Instructions

[Your skill definition here]
```

### Modifying Existing Skills

All skills are plain Markdown files. Edit them freely to match your team's needs:

- Adjust quality gates (e.g., lower coverage threshold from 80% to 70%)
- Remove phases you don't need (e.g., skip CEO approval)
- Add project-specific review criteria
- Change model requirements (`opus` → `sonnet` for lower cost)

### Integrating with Existing CLAUDE.md

If your project already has a `CLAUDE.md`, merge the Kaizen governance rules by adding:

1. The **Intent Classification** section (routes tasks to the right pipeline)
2. The **Build & Test Commands** section (configures the variables)
3. Any pipeline rules you want to enforce

---

## FAQ

**Q: Do I need all 30 skills?**
No. Use `./install.sh --list` to see what's available, then install only what you need. The `--se`, `--eiw`, `--drw`, `--pdca`, `--qa`, and `--ui` flags let you pick categories.

**Q: Is this expensive to run?**
The pipelines spawn multiple subagents with `model: "opus"` by default. A full SE Pipeline run (9 phases) uses significant tokens. For lighter usage, override to `model: "sonnet"` in your CLAUDE.md, or use EIW instead of SE Pipeline for implementation-focused tasks.

**Q: Can I use this with any programming language?**
Yes. The skills are language-agnostic. Configure the `$BUILD_CMD`, `$TEST_CMD`, etc. variables for your stack (Node.js, Python, Rust, Go, etc.).

**Q: What if a review keeps rejecting?**
Every pipeline has a restart limit (3 for SE/EIW, 2 for DRW). After the limit, the pipeline escalates to human intervention instead of looping forever.

**Q: How does PDCA improve the agent over time?**
After every error resolution, PDCA analyzes the incident, traces it to the earliest pipeline point where it could have been caught, designs a skill modification to prevent recurrence, and applies it. Over time, the agent's skills become increasingly refined.

---

## Contributing

Contributions are welcome. Please:

1. Fork the repository
2. Create a feature branch
3. Ensure no product-specific references leak into skill files (keep them generic)
4. Submit a pull request

Focus areas:
- New pipeline skills
- Better prompt engineering in existing skills
- Support for additional development workflows
- Documentation improvements

---

## License

[MIT](LICENSE) — Use it however you want.
