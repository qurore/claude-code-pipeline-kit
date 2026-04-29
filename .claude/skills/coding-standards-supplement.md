# Coding standards supplement

> **Deference:** This skill supplements CLAUDE.md system prompt and UI design standards. CLAUDE.md is the authoritative source for: text color hierarchy, button layout stability, sentence-case capitalization, visual aesthetic verification, the 3-level nesting rule, and spartan type safety. This file covers patterns NOT addressed there. On any conflict, CLAUDE.md governs.

## Purpose

Supplementary coding standards covering KISS/DRY/YAGNI enforcement, naming conventions, immutability patterns, error handling, and code smell detection for your codebase.

## When to use

- Writing new modules, utilities, or components
- Reviewing code for quality and maintainability
- Refactoring to improve clarity or reduce duplication
- During EIW Stage 4 code quality review or SE Phase 8 evaluation

## Protocol

### 1. KISS -- keep it simple

- Choose the simplest solution that satisfies requirements.
- Prefer platform APIs (Server Components, Server Actions, URL SearchParams) over third-party state libraries.
- If a utility function exceeds 30 lines, consider decomposition.
- If a conditional tree exceeds 3 levels deep, refactor (per CLAUDE.md 3-Level Rule).

### 2. DRY -- don't repeat yourself

- Extract shared logic into `src/lib/` utilities.
- Extract shared UI into `src/components/ui/`.
- When the same database client query pattern appears 3+ times, create a data-access helper.
- When the same Zod schema is used across routes, export from a shared types file.

### 3. YAGNI -- you aren't gonna need it

- Do not build abstractions for hypothetical future use cases.
- Do not add configuration options nobody has requested.
- Start concrete, generalize only when a second use case appears.
- Remove dead code rather than commenting it out.

### 4. Naming conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Component files | PascalCase | `WikiViewer.tsx` |
| Utility files | kebab-case | `format-date.ts` |
| Hook files | camelCase with `use` prefix | `useDebounce.ts` |
| Type files | kebab-case | `wiki-types.ts` |
| Test files | Co-located, `.test.ts(x)` suffix | `format-date.test.ts` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Env vars | UPPER_SNAKE_CASE | `LLM_MODEL` |
| Zod schemas | PascalCase + `Schema` suffix | `CreateProjectSchema` |
| TypeScript interfaces | PascalCase (no `I` prefix) | `OrderItem` |

**Function naming:** Use verb-noun pattern:
```typescript
// Correct
async function fetchOrderItems(orderId: string) { }
function calculateTokenBudget(files: string[]) { }
function isValidDomainCategory(cat: string): boolean { }

// Wrong
async function sections(id: string) { }
function budget(f: string[]) { }
```

### 5. Immutability

```typescript
// Correct: spread for objects
const updated = { ...section, name: "New name" }

// Correct: spread for arrays
const withNew = [...sections, newSection]
const without = sections.filter(s => s.id !== targetId)

// Wrong: direct mutation
section.name = "New name"
sections.push(newSection)
```

Use `as const` for literal unions and configuration objects:
```typescript
const DOMAIN_CATEGORIES = ["core", "infrastructure", "support", "external"] as const
```

### 6. Error handling

```typescript
// Correct: structured error handling in API routes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = CreateProjectSchema.parse(body)
    // ... business logic
    return NextResponse.json({ data: result })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 })
    }
    console.error("POST /api/project failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
```

**Rules:**
- Never expose stack traces or internal error details to clients.
- Always log the real error server-side with context (route, operation).
- Use `z.ZodError` check for validation errors (400), generic message for everything else (500).
- Wrap async operations in try/catch -- no unhandled promise rejections.

### 7. Async patterns

```typescript
// Correct: parallel when independent
const [wiki, project] = await Promise.all([
  fetchWiki(wikiId),
  fetchProject(projectId),
])

// Correct: sequential when dependent
const user = await getUser(userId)
const projects = await getProjectsByOrg(user.orgId)
```

## Code smell detection

| Smell | Threshold | Action |
|-------|-----------|--------|
| Long function | > 50 lines | Decompose into named helpers |
| Deep nesting | > 3 levels | Early returns or extract |
| Magic numbers | Any unexplained literal | Named constant |
| God component | > 200 lines JSX | Split into sub-components |
| Duplicate logic | 3+ occurrences | Extract utility |
| `any` type | Any usage | Replace with proper type |

## Quality gates

| Gate | Criteria | Blocking |
|------|----------|----------|
| No `any` | Zero `any` types in changed files | Yes |
| No mutation | No direct property assignment on shared objects | Yes |
| Naming | All new symbols follow conventions above | Yes |
| Dead code | No commented-out code blocks committed | Yes |
| Error handling | All async paths have try/catch | Yes |

## Common pitfalls

- **Over-abstracting early** -- resist creating a generic `DataFetcher<T>` when you have one fetch call. Wait for the second use case.
- **Importing server utilities in client components** -- `"use client"` files cannot import from `@/lib/db/server`. Use Server Components or Server Actions as the boundary.
- **Using `useEffect` for data fetching** -- prefer Server Components with `async` or Server Actions. Client-side `useEffect` fetching is a last resort.
- **Mixing Zod `.input` and `.output` types** -- schemas with `.default()` produce different types. Use `.output` for validated data and always provide explicit fallbacks.

<!-- ECC-2026: enhancement -->
## Related agents

code-reviewer, refactor-cleaner
