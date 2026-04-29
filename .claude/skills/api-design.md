# API design

> **Deference:** This skill supplements CLAUDE.md system prompt (Server-First, Key Design Decisions) and the security-review skill. On conflict, CLAUDE.md governs.

## Purpose

REST API design conventions for Next.js 15 App Router routes and Server Actions in your project, ensuring consistent response envelopes, input validation, auth enforcement, and pagination patterns.

## When to use

- Creating or modifying API routes under `app/api/`
- Designing Server Actions with `"use server"`
- Reviewing endpoint contracts for consistency
- Adding pagination or streaming to existing endpoints
- Integrating new database queries into route handlers

## Protocol

### 1. Route structure

Organize routes as `app/api/[resource]/route.ts` with named exports (`GET`, `POST`, `PATCH`, `DELETE`). Nested resources use nested folders: `app/api/wiki/[id]/sections/route.ts`.

### 2. Response envelope

Every response MUST use a consistent envelope:

```typescript
// Success
return NextResponse.json({ data: result, error: null, meta: { cursor, hasMore } })

// Error
return NextResponse.json({ data: null, error: { message, code } }, { status })
```

Never return raw database client `data` or `error` objects directly. Map them into the envelope.

### 3. Input validation

Parse and validate all inputs at route entry using Zod. Call `bodySchema.safeParse(await request.json())` and return 400 with `{ data: null, error: { message, code: "VALIDATION_ERROR" } }` on failure. Validate path params, query params, and request body separately.

### 4. Error responses

Use standard HTTP status codes consistently:

| Status | Meaning | When |
|--------|---------|------|
| 400 | Bad request | Zod validation failure, malformed JSON |
| 401 | Unauthenticated | No session or expired token |
| 403 | Forbidden | Valid session but insufficient permissions |
| 404 | Not found | Resource does not exist or user has no access |
| 409 | Conflict | Duplicate resource, optimistic lock failure |
| 500 | Server error | Unhandled exception (log details, return generic message) |

Never expose internal error details (table names, stack traces, database client error codes) to the client.

### 5. Auth check

Every protected route MUST call `auth().getUser()` at the top and return 401 if no user. For resource-level authorization, verify ownership after fetching the resource.

### 6. Pagination

Use cursor-based pagination for list endpoints. Fetch `limit + 1` rows, check `hasMore = data.length > limit`, slice to `limit`, and return `{ data: items, error: null, meta: { cursor: items.at(-1)?.created_at, hasMore } }`. Cap `limit` at 100.

### 7. Streaming for LLM responses

Use your streaming SDK `streamText({ model, messages })` and return `result.toDataStreamResponse()` for streaming LLM output.

## Quality gates

| Gate | Criteria | Blocking |
|------|----------|----------|
| Input validation | Zod schema on all request inputs | Yes |
| Auth check | `getUser()` on every protected route | Yes |
| Response envelope | `{ data, error, meta }` format on all responses | Yes |
| Status codes | Correct HTTP status for each error type | Yes |
| No data leaks | Internal errors not exposed to client | Yes |

## Common pitfalls

- **Returning raw database client errors** -- database client error messages contain table names and constraint details. Always map to a user-safe message.
- **Missing auth checks** -- every route under `(dashboard)` needs auth verification. Do not rely solely on middleware; verify in the handler.
- **Using query params for sensitive data** -- query strings are logged by proxies and browsers. Use request body for sensitive inputs.
- **Forgetting CORS headers** -- webhook endpoints and public APIs may need explicit CORS configuration in `next.config.js`.
- **Offset-based pagination** -- offset pagination degrades on large tables. Always prefer cursor-based pagination with indexed columns.
- **Inconsistent error codes** -- define error code constants (`VALIDATION_ERROR`, `UNAUTHENTICATED`, `NOT_FOUND`) and reuse across routes.
