# Customisation

The kit ships sensible defaults but every gate is configurable. This document covers the most common customisation points.

## Model override (cost vs quality)

The kit defaults to `model: "opus"` for all subagent invocations. Opus produces the highest review quality but is more expensive.

### Override globally

In your project's `CLAUDE.md`, replace:

```
ALL subagents spawned via the Task tool ... MUST use `model: "opus"` ...
```

With:

```
ALL subagents spawned via the Task tool ... MUST use `model: "sonnet"` ...
```

Note: this affects all pipelines. The Bar Raiser, CEO/CTO/PTE/PM reviews, and Stage 4 parallel reviews all switch to the cheaper model.

### Override per-skill

Add a front-matter directive to the specific skill file:

```yaml
---
model: sonnet
---
```

The `pretool.enforce-opus` hook respects per-skill overrides.

### Disable enforcement entirely (escape hatch)

For migration only:

```bash
export OPUS_GUARD_DISABLED=1
```

The session emits a banner at SessionStart so the operator knows the kit is in degraded mode.

## UI lint (optional)

The `posttool.lint-ui` hook is an optional vocabulary checker for UI code. It is wired in `settings.json.template` but starts as `enabled: false`.

### Enable

Edit `.claude/hooks/config/lint-ui.json`:

```json
{
  "enabled": true,
  "whitelist": ["GitHub", "PostgreSQL", "your payment provider", "OAuth"]
}
```

### Behaviour

When enabled, the hook scans modified `.tsx` / `.jsx` / `.html` files for:

- Title-case vocabulary that should be sentence-case ("Delete Account" -> "Delete account").
- Brand whitelist violations -- terms outside the whitelist that look like proper nouns.

Warnings appear on stderr; the hook never blocks tool execution.

## Migration reminder (optional)

The `posttool.remind-migration` hook surfaces a reminder when migration files are created. It starts as `enabled: false`.

### Enable

Edit `.claude/hooks/config/migration-reminder.json`:

```json
{
  "enabled": true,
  "pathPattern": "^db/migrations/.*\\.sql$",
  "reminderText": "Migration created. Apply via: pnpm db:push (dev), then run prod migration via direct connection."
}
```

The hook prints `reminderText` to stderr after every Write that matches `pathPattern`.

## Custom skills

To add a project-specific skill:

1. Create `.claude/skills/<your-skill>.md`. Use existing skills as templates -- particularly `agent-harness.md` (the meta-skill).
2. Add the front-matter:
   ```yaml
   ---
   name: your-skill-name
   description: One-line summary visible to other agents.
   model: opus
   ---
   ```
3. Reference it from CLAUDE.md or the relevant pipeline skill.
4. Run `/checkpoint` to confirm no skill-lint warnings.

For project-specific commands (slash commands users can invoke directly), create `.claude/commands/<your-command>.md` with the same front-matter shape.

## Project-specific overrides

Many rules in CLAUDE.md are intentionally generic. Add project-specific overlays in your CLAUDE.md "Project context" section:

```markdown
## 4. Project context

# Project: Acme Corp Dashboard
# Stack: Next.js 14 + Postgres + your payment provider
# Domain: B2B SaaS / accounts receivable

## Build & Test Commands
- BUILD_CMD: `npm run build`
- TEST_CMD: `npm run test`
- ...

## Domain glossary
- Invoice -- a billable line item issued to a tenant.
- Tenant -- a paying customer org with its own subdomain.
- ...

## Project-specific rules
- All money values stored as cents (integers).
- PII fields encrypted at rest using the project KMS.
- All API routes return ApiResult<T>; never raw DB rows.
```

The kit's pipelines reference your CLAUDE.md at every stage, so project-specific rules propagate automatically.

## UI design overlay

If your project ships UI, copy the relevant section from your design system into CLAUDE.md. The kit's Bar Raisers (5.5 / 7.5 / EIW 3.5 / DRW D3.5) evaluate against the four UX dimensions:

- **FRICTION** -- can the user accomplish their task in the minimum number of steps / clicks?
- **DELIGHT_GAP** -- where could the experience be more polished, more affirming, more memorable?
- **CONSISTENCY** -- does the change match the rest of the product (typography, spacing, voice)?
- **ACCESSIBILITY** -- is the change usable by users with motor, vision, or cognitive impairments?

Add project-specific tokens (typography scale, color palette, spacing rhythm) to CLAUDE.md and the Bar Raiser will reference them when emitting critique.

## Hook source modification

If you need to modify a hook's behaviour beyond config:

```bash
cd .claude/hooks
# Edit the .ts source
pnpm test          # Confirm coverage stays >=80%
pnpm build         # Re-emit dist/
git add .          # Commit src + dist together
```

The kit treats `dist/` as a committed artifact -- consumers do not run `pnpm build` themselves unless they explicitly customise.

## Disabling hooks

To disable a hook, remove its entry from `.claude/settings.json` (NOT the template). The template is the canonical reference; your local `settings.json` is your active wiring.

To disable hooks globally for a session, remove the entire `hooks` block from `settings.json` and restart Claude Code.

## Adjusting pipeline restart limits

The default restart limits (3 cross-phase restarts for SE; 2 restarts for DRW) are encoded in the orchestrator skill files. To adjust:

1. Open `.claude/commands/se-pipeline.md` (or `eiw-review.md` / `defect-fix.md`).
2. Find the "Restart policy" section.
3. Modify the `MAX_RESTARTS` value.

Be cautious: the restart limit is the kit's mechanism for preventing infinite loops on unsolvable problems. Lower limits force earlier human escalation; higher limits permit longer agent autonomy at the risk of wasted compute.

## See also

- `docs/hooks.md` -- per-hook reference and config schema.
- `docs/settings-reference.md` -- annotated `.claude/settings.json.template`.
- `docs/pipelines.md` -- pipeline phase / stage reference.
