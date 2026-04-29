# Contributing

Thanks for considering a contribution. This kit is open-source under MIT and welcomes improvements that keep it generic, vendor-neutral, and English-only.

## Repository structure

```
claude-code-pipeline-kit/
├── CLAUDE.md                   # Governance template (~450 lines)
├── README.md                   # Project overview
├── LICENSE                     # MIT
├── install.sh                  # Drop-in installer (bash 3.2 compatible)
├── package.json                # Kit metadata, build scripts
├── .gitignore                  # node_modules, log files, screenshots
├── docs/                       # 8 documentation files
├── examples/                   # Realistic settings.json + config samples
├── tests/                      # install.sh tests, brand-purity gate
└── .claude/
    ├── settings.json.template  # Strict JSON, all 9 hooks wired
    ├── skills/                 # 18 procedural workflow guides
    ├── agents/                 # 9 persona reference cards
    ├── rules/                  # 2 coding-standard files
    ├── commands/               # 40 pipeline + utility skills
    ├── hooks/
    │   ├── *.ts                # Hook source
    │   ├── lib/                # Shared library
    │   ├── bin/                # Sentinel CLI
    │   ├── scripts/            # Build, test, repair tools
    │   ├── config/             # Externalised hook config
    │   └── dist/               # Compiled output (committed)
    ├── pipeline-state/         # Per-run state (gitignored except SCHEMA.md)
    └── pdca-archive/           # Self-improvement history (gitignored except instincts.md)
```

## Development workflow

### Setup

```bash
git clone https://github.com/your-org/claude-code-pipeline-kit
cd claude-code-pipeline-kit
cd .claude/hooks
pnpm install
```

### Run hook tests

```bash
cd .claude/hooks
pnpm test           # Watch mode
pnpm test --run     # Single run
pnpm test --coverage  # Coverage report
```

Coverage gate: ≥80% on line, branch, function, statement.

### Run install-script tests

```bash
bash tests/install.test.sh
```

The test runner exercises 5 scenarios:

1. Clean install (`bash install.sh --all` from empty target).
2. Re-run no-diff (idempotent).
3. Single-tree install (`bash install.sh --skills`).
4. Node-missing graceful skip.
5. Brand-purity gate end-to-end.

### Run brand-purity gate

```bash
bash tests/no-proprietary-refs.sh
```

This greps every shipped file for proprietary tokens. The gate must return zero matches across `.claude/`, `docs/`, `tests/`, `README.md`, `CLAUDE.md`, `install.sh`, `package.json`, `.gitignore`.

### Build hooks

```bash
cd .claude/hooks
pnpm build
```

Produces `dist/<name>.js` for every `<name>.ts` source file.

## Coding conventions

The kit's own source code follows the rules in `.claude/rules/`:

- `.claude/rules/typescript.md` -- TypeScript conventions (no `any`, Zod at boundaries, discriminated unions).
- `.claude/rules/common.md` -- general workflow (TDD mandatory, file size discipline, etc.).

Use these as the contract for your contributions.

## Brand neutrality

The kit MUST remain vendor-neutral:

- No references to specific SaaS providers (database vendors, payment providers, email vendors).
- No references to specific frameworks beyond what is necessary (TypeScript / Node.js / Claude Code are OK; framework-specific advice goes in skill bodies with placeholders).
- No personal info, project names, internal company names.

The brand-purity gate (`tests/no-proprietary-refs.sh`) enforces this on every PR.

## Adding a hook

1. Author `.claude/hooks/<name>.ts` and `.claude/hooks/<name>.test.ts`.
2. Implement the hook contract (read stdin JSON, emit signals, exit 0/2).
3. Achieve ≥80% coverage on the four metrics.
4. Add the hook entry to `.claude/settings.json.template`.
5. Document the hook in `docs/hooks.md`.
6. Run the full test suite.

## Adding a skill

1. Author `.claude/skills/<name>.md` (procedural) or `.claude/commands/<name>.md` (slash command).
2. Include the standard front-matter:
   ```yaml
   ---
   name: <name>
   description: <one-line>
   model: opus
   ---
   ```
3. Use the section structure: Purpose / When to use / Procedure / Output.
4. Reference it from CLAUDE.md or the relevant pipeline skill.
5. Run `posttool.lint-skill` (which fires automatically on Edit/Write) to confirm lint passes.

## Adding a pipeline

This is non-trivial -- the kit's four pipelines (SE / EIW / DRW / PDCA) are the result of months of iteration. Before authoring a new pipeline:

1. File a discussion issue describing the gap the new pipeline fills.
2. Confirm the existing pipelines cannot cover the use case via configuration / skill addition.
3. If approved, draft the pipeline as an SE Pipeline run -- the kit eats its own dog food.

## Bash 3.2 compatibility

`install.sh` MUST run on bash 3.2.57 (macOS default; Apple has frozen bash). Forbidden idioms:

| Forbidden | Reason | Alternative |
|-----------|--------|-------------|
| `mapfile -t arr < file` | bash 4+ | `while IFS= read -r line; do arr+=("$line"); done < file` |
| `declare -A assoc` | bash 4+ | parallel index arrays or temp files |
| `${var^^}` / `${var,,}` | bash 4+ | `echo "$var" \| tr '[:lower:]' '[:upper:]'` |
| `coproc` | bash 4+ | named pipes or temp files |

Run on macOS without homebrew bash to verify before submitting a PR.

## Submitting changes

1. Open a pull request against `main`.
2. Ensure the test suite passes locally.
3. Include a clear description of what changes and why.
4. Tag PRs that touch enforcement contracts (hooks, intent classification, pipeline structure) with `breaking:` -- they require additional review.

## Release process

The kit is versioned via semver. Breaking changes (rule deletions, hook removals, pipeline restructuring) increment the major version.

## Licence

By contributing, you agree to license your contribution under MIT. The kit must remain license-clean -- no GPL / AGPL / proprietary code.
