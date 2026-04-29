# Database migrations

> **Deference:** This skill supplements CLAUDE.md "Auto-Execute database client Migrations" rule and the postgres-patterns skill. On conflict, CLAUDE.md governs.

## Purpose

Safe database migration patterns for database client PostgreSQL, ensuring schema changes are backward-compatible, RLS-complete, and auto-executed per CLAUDE.md rules.

## When to use

- Adding new tables, columns, or indexes
- Creating or modifying RLS policies
- Extending PostgreSQL enum types
- Altering schema for new features (wiki v3 DDD artifacts, bounded contexts)
- Any change to `migrations/`

## Protocol

### 1. Create the migration file

```bash
cd <your-app> && create-migration <descriptive_name>
```

Use descriptive names: `add_wiki_ubiquitous_language`, `add_gin_index_key_types`, `create_bounded_contexts_table`.

### 2. Write safe SQL

All schema changes MUST be additive and backward-compatible:

**Adding columns** (always with DEFAULT or NULL):

```sql
ALTER TABLE analysis_results
ADD COLUMN IF NOT EXISTS aggregates JSONB DEFAULT '[]'::jsonb;
```

**Creating tables** -- include `ENABLE ROW LEVEL SECURITY` and at least one `CREATE POLICY` in the same migration. Use `ON DELETE CASCADE` for FKs to parent tables like `project_wikis`.

**Creating indexes** -- use `CREATE INDEX CONCURRENTLY` for large tables. Note: concurrent index creation cannot run inside a transaction block, so use a separate migration file.

### 3. RLS policies

Every new table MUST have RLS enabled and at least one policy in the same migration:

- SELECT policy for read access (scoped to user's resources via `auth.uid()`)
- INSERT policy if users create records directly
- UPDATE/DELETE policies if users modify records directly
- Service-role operations bypass RLS -- no policy needed for server-only tables

### 4. Enum extensions

Extend existing enums safely using exception handling:

```sql
DO $$
BEGIN
  ALTER TYPE domain_category ADD VALUE IF NOT EXISTS 'external';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
```

Never modify or remove existing enum values. Add new values only.

### 5. Auto-execute

Per CLAUDE.md, immediately run the migration without asking for confirmation:

```bash
cd <your-app> && apply-migrations
```

If `db push` times out (transient infrastructure issue), retry once. If it fails again, log the error and proceed -- the migration file is committed and will apply on next successful push.

### 6. Verify

After execution, verify the migration applied using `psql "$DATABASE_URL"`: check table exists (`\d table_name`), RLS is enabled (`pg_tables.rowsecurity`), columns were added (`information_schema.columns`).

## Safety rules

| Rule | Rationale |
|------|-----------|
| Never `DROP COLUMN` without expand-contract | Removes data irreversibly; deployed code may still reference it |
| Never `ALTER TYPE` on existing columns | Requires table rewrite; use a new column and migrate data |
| Never remove enum values | Existing rows reference them; add new values only |
| Always backward-compatible | Old code must work with new schema until deployment completes |
| Always include RLS | Tables without RLS are publicly accessible via database client |
| One concern per migration | Keeps rollback scope small and diffs reviewable |

## project-specific patterns

- **analysis_results JSONB additions:** New domain-level artifacts (aggregates, sequence_diagrams, test_coverage) added as `JSONB DEFAULT '[]'::jsonb` columns.
- **Wiki-level DDD tables:** `wiki_ubiquitous_language`, `wiki_bounded_contexts`, `wiki_context_map_relationships` -- each with FK to `project_wikis(id)` and `ON DELETE CASCADE`.
- **Enum extensions:** `domain_category` extended with `'external'`, `technical_subtype` extended with `'worker'`, `'config'`, `'test'` -- all via `ADD VALUE IF NOT EXISTS`.
- **Migration naming:** Timestamps auto-prefixed by database CLI. Use snake_case descriptive suffixes.

## Quality gates

| Gate | Criteria | Blocking |
|------|----------|----------|
| Backward-compatible | No breaking changes to existing schema | Yes |
| RLS included | New tables have RLS enabled + policies | Yes |
| Auto-executed | `apply-migrations` run immediately | Yes |
| Verified | Schema change confirmed via query | Yes |
| Single concern | One logical change per migration file | Advisory |

## Common pitfalls

- **Forgetting RLS on new tables** -- a table with RLS disabled is readable/writable by any authenticated user via the database client. Always enable RLS and add policies in the same migration.
- **`DROP COLUMN` without feature flag** -- if deployed code references the column, the app crashes. Use expand-contract: add new column, migrate code, then drop old column in a later migration.
- **Enum `ADD VALUE` in transaction block** -- PostgreSQL does not allow `ADD VALUE` inside a multi-statement transaction. Use the `DO $$ ... EXCEPTION` wrapper or a dedicated migration file.
- **Timeout on large table alterations** -- adding a column with a DEFAULT to a large table rewrites the entire table. For tables > 1M rows, add the column as NULL first, then backfill in batches.
- **`CREATE INDEX CONCURRENTLY` in transaction** -- concurrent index creation cannot run inside a transaction. Use a separate migration file for concurrent indexes.
- **Missing `ON DELETE CASCADE`** -- foreign keys to `project_wikis` or `analysis_results` should cascade deletes. Without cascade, deleting a project leaves orphan records.
