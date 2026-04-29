# PostgreSQL patterns

> **Deference:** This skill supplements CLAUDE.md database schema sections and the database-migrations skill. On conflict, CLAUDE.md governs.

## Purpose

PostgreSQL and database client query patterns, indexing strategies, and performance optimization techniques for your project's data layer.

## When to use

- Writing complex queries (joins, CTEs, JSONB operations)
- Optimizing slow queries identified via EXPLAIN ANALYZE
- Designing new table schemas or indexes
- Working with analysis_results JSONB columns (owned_tables, key_types, aggregates)
- Querying hierarchical domain structures with recursive CTEs

## Protocol

### 1. Index strategy

Choose the right index type for the access pattern:

| Index type | Use case | Example |
|------------|----------|---------|
| B-tree (default) | Equality, range, sorting | `CREATE INDEX idx_sections_wiki ON analysis_results(analysis_id)` |
| GIN | JSONB containment, array membership | `CREATE INDEX idx_sections_types ON analysis_results USING gin(key_types)` |
| Partial | Filtered subsets | `CREATE INDEX idx_active ON blueprints(status) WHERE status = 'active'` |
| Composite | Multi-column lookups | `CREATE INDEX idx_wiki_parent ON analysis_results(analysis_id, parent_id)` |

Always index foreign key columns. PostgreSQL does NOT auto-index FK references.

### 2. Query optimization

Diagnose slow queries with EXPLAIN ANALYZE:

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM analysis_results WHERE analysis_id = $1 AND domain_type = 'business';
```

Check for:
- Sequential scans on tables with > 1000 rows (add an index)
- Nested loop joins without index lookups (add composite index)
- High `actual rows` vs `estimated rows` (run ANALYZE to update statistics)
- Sort operations without index support (add ordered index)

### 3. JSONB patterns

your project stores domain artifacts as JSONB. Key operators: `->>` for text extraction, `@>` for containment checks (uses GIN index), `->0` for array element access, `jsonb_array_length()` for existence checks. For frequently queried JSONB columns, add a GIN index:

```sql
CREATE INDEX idx_sections_key_types ON analysis_results USING gin(key_types jsonb_path_ops);
```

### 4. Common query patterns

**Cursor pagination** (required per api-design skill):

```sql
SELECT * FROM blueprints
WHERE created_at < $cursor
ORDER BY created_at DESC
LIMIT $limit + 1;
```

**UPSERT** (idempotent writes):

```sql
INSERT INTO wiki_ubiquitous_language (analysis_id, term, definition)
VALUES ($1, $2, $3)
ON CONFLICT (analysis_id, term)
DO UPDATE SET definition = EXCLUDED.definition;
```

**Batch insert** (for bulk domain creation):

```sql
INSERT INTO analysis_results (id, analysis_id, name, domain_type, domain_category)
SELECT * FROM unnest($1::uuid[], $2::uuid[], $3::text[], $4::text[], $5::text[]);
```

**Recursive CTE** (domain hierarchy traversal):

```sql
WITH RECURSIVE domain_tree AS (
  SELECT id, name, parent_id, 0 AS depth
  FROM analysis_results
  WHERE analysis_id = $1 AND parent_id IS NULL
  UNION ALL
  SELECT ws.id, ws.name, ws.parent_id, dt.depth + 1
  FROM analysis_results ws
  JOIN domain_tree dt ON ws.parent_id = dt.id
)
SELECT * FROM domain_tree ORDER BY depth, name;
```

### 5. Connection management

- Keep transactions short -- do not hold locks across LLM calls or external API requests
- Use database connection pooler (port 6543) for serverless functions
- Batch related writes into a single transaction when atomicity is required
- Avoid `SELECT ... FOR UPDATE` unless implementing optimistic concurrency

## project-specific patterns

- **analysis_results JSONB columns:** owned_tables, page_routes, api_endpoints, key_types, state_management, aggregates, sequence_diagrams -- all stored as JSONB arrays. Query with `@>` for containment, `->>` for scalar extraction.
- **Domain hierarchy queries:** Use recursive CTEs rooted at `parent_id IS NULL` and filtered by `analysis_id`. Include `depth` for indentation in the UI tree view.
- **Architecture diagrams:** `domain_architecture_diagrams.nodes` and `edges` are JSONB. Query specific node types with `nodes @> '[{"type": "service"}]'`.
- **Bounded context lookups:** `wiki_bounded_contexts.domains` is a JSONB array of domain names. Use `domains @> '["Auth"]'` for membership checks.

## Quality gates

| Gate | Criteria | Blocking |
|------|----------|----------|
| No seq scans | EXPLAIN shows index usage on tables > 1000 rows | Yes |
| FK indexes | Every foreign key column has a B-tree index | Yes |
| Query speed | Queries complete under 100ms for typical data volumes | Yes |
| JSONB indexed | GIN index on frequently queried JSONB columns | Advisory |
| No unbounded SELECT | Every query has a LIMIT or WHERE clause | Yes |

## Common pitfalls

- **Missing foreign key indexes** -- `analysis_results.analysis_id`, `analysis_results.parent_id`, and `domain_architecture_diagrams.analysis_result_id` must all be indexed. PostgreSQL does not create these automatically.
- **Unbounded `SELECT *`** -- always include `LIMIT` for list queries. A wiki with thousands of sections will cause memory pressure without bounds.
- **N+1 via database client** -- fetching a list then querying each item individually. Use `.select("*, children(*)")` or a single query with joins.
- **JSONB without GIN index** -- `@>` containment queries fall back to sequential scan without a GIN index. Add one before the table grows.
- **Long transactions holding locks** -- never wrap an LLM call inside a database transaction. Fetch data, release the connection, call the LLM, then write results.
- **Using `text` search on JSONB** -- `LIKE` on JSONB casts to text and bypasses indexes. Use `@>` or `jsonb_path_query` instead.
