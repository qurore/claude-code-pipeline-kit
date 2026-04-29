# TypeScript rules

> Supplements CLAUDE.md. Rules here do NOT duplicate CLAUDE.md (Spartan Type Safety, 3-Level Rule, Server-First, no `any`). When conflicts arise, CLAUDE.md wins.

## Types and interfaces

### Rule: explicit types on public APIs
**Rationale:** Exported functions are contracts. Implicit types break consumers silently.
**Example:**
```typescript
// Wrong
export function formatUser(user) { ... }

// Correct
export function formatUser(user: User): string { ... }
```

### Rule: interface for extensible shapes, type for unions/intersections
**Rationale:** Interfaces support declaration merging and `extends`. Types are better for algebraic composition.
**Example:**
```typescript
interface UserAccount { id: string; name: string; }
type AccountCategory = 'standard' | 'premium' | 'admin' | 'system';
type AccountWithCategory = UserAccount & { category: AccountCategory };
```

### Rule: string literal unions over enums
**Rationale:** Enums generate runtime code and have quirks with reverse mapping. Literal unions are simpler and tree-shake better.
**Example:**
```typescript
// Preferred
type Status = 'draft' | 'active' | 'done';

// Acceptable only when required for interop
enum StatusEnum { Draft = 'draft', Active = 'active', Done = 'done' }
```

### Rule: use `unknown` for external input, then narrow
**Rationale:** `unknown` forces safe narrowing. `any` removes all type safety.
**Example:**
```typescript
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Unexpected error';
}
```

### Rule: no `React.FC`
**Rationale:** Adds implicit `children` prop and has known generics limitations. Use plain function with typed props.
**Example:**
```typescript
interface UserCardProps { user: User; onSelect: (id: string) => void; }
function UserCard({ user, onSelect }: UserCardProps) { ... }
```

## Project-specific type gotchas

> Replace this section with your project's recurring type pitfalls. Add one entry per gotcha. The aim: encode tribal knowledge so future contributors do not relearn the same lesson.

### Rule: <document a gotcha unique to your codebase>
**Rationale:** <why this trips people up — the missing context that the type system cannot express alone>
**Example:**
```typescript
// Wrong: <show the broken pattern>
// Correct: <show the fixed pattern>
```

### Rule: validate optional fields before use
**Rationale:** Many domain types carry optional fields (`string | undefined`). Unguarded access causes runtime errors. Always guard before dereferencing.
**Example:**
```typescript
for (const item of items) {
  if (!item.optionalField) continue;
  // Safe to use item.optionalField here
}
```

### Rule: keep Zod schema and TypeScript type aligned
**Rationale:** When the Zod schema diverges from the TypeScript type (e.g. via `.default()`), the `.input` and `.output` types differ. Always provide explicit values when constructing objects parsed by the schema.

## Immutability

### Rule: spread operator for all state updates
**Rationale:** Mutation causes hidden side effects, breaks React rendering, and makes debugging unpredictable.
**Example:**
```typescript
// Wrong
function updateUser(user: User, name: string): User {
  user.name = name;
  return user;
}

// Correct
function updateUser(user: Readonly<User>, name: string): User {
  return { ...user, name };
}
```

## Error handling

### Rule: async/await with typed catch
**Rationale:** Promise chains are harder to read. Untyped catch blocks hide error shapes.
**Example:**
```typescript
async function loadUser(userId: string): Promise<User> {
  try {
    return await fetchUser(userId);
  } catch (error: unknown) {
    logger.error('Failed to load user', error);
    throw new Error(getErrorMessage(error));
  }
}
```

### Rule: never silently swallow errors
**Rationale:** Empty catch blocks hide bugs. At minimum, log the error with context.

## Input validation

### Rule: Zod at system boundaries
**Rationale:** Schema-based validation ensures runtime safety and generates types. Use at API routes, Server Actions, webhook handlers, and LLM output parsing.
**Example:**
```typescript
const userSchema = z.object({
  email: z.string().email(),
  age: z.number().int().min(0).max(150),
});
type UserInput = z.infer<typeof userSchema>;
```

## React patterns

### Rule: complete dependency arrays in hooks
**Rationale:** Missing deps cause stale closures and subtle bugs.
**Example:**
```typescript
// Wrong
useEffect(() => { fetchData(userId); }, []);

// Correct
useEffect(() => { fetchData(userId); }, [userId]);
```

### Rule: stable keys in lists
**Rationale:** Array index as key causes incorrect reconciliation when items reorder.
**Example:**
```typescript
// Wrong
{items.map((item, i) => <ListItem key={i} item={item} />)}

// Correct
{items.map(item => <ListItem key={item.id} item={item} />)}
```

### Rule: no `console.log` in production code
**Rationale:** Use proper logging. Console statements leak info and clutter output.

## Testing

### Rule: co-locate tests with source
**Rationale:** `src/lib/foo.ts` pairs with `src/lib/foo.test.ts`. Keeps test context close to implementation.

### Rule: mock external dependencies
**Rationale:** Tests must be fast, deterministic, and credential-free. Mock all external dependencies (database, LLM provider, payment gateway, email provider, third-party APIs).

### Rule: mock LLM calls with the established pattern
**Example:**
```typescript
vi.mock("../your-llm-factory", () => ({
  createModel: () => ({ invoke: vi.fn().mockResolvedValue({ content: "..." }) })
}));
vi.mock("../your-json-helper", () => ({
  parseJsonFromLLM: vi.fn().mockResolvedValue(mockData)
}));
```

### Rule: Arrange-Act-Assert structure
**Rationale:** Consistent test structure improves readability and debugging. Each test has exactly one act and one assertion group.

<!-- ECC-2026: additional TypeScript patterns -->

### Rule: discriminated union patterns
**Rationale:** Discriminated unions enable exhaustive type checking and eliminate impossible states.
**Example:**
```typescript
type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

function handleResult(result: ApiResult<User>) {
  if (result.success) {
    // TypeScript knows result.data exists
  }
}
```

### Rule: Server Action type safety
**Rationale:** Server Actions receive untrusted input from clients. Validate with Zod before processing.
**Example:**
```typescript
"use server"
const schema = z.object({ projectId: z.string().uuid() })
export async function deleteProject(formData: FormData) {
  const { projectId } = schema.parse(Object.fromEntries(formData))
}
```

### Rule: database client typing
**Rationale:** database queries return typed results when using generated types. Use `.single()` for exactly-one results, `.maybeSingle()` for zero-or-one.
**Example:**
```typescript
// Correct: expect exactly one
const { data } = await db.from("projects").select().eq("id", id).single()
// Correct: expect zero or one
const { data } = await db.from("profiles").select().eq("user_id", userId).maybeSingle()
```

### Rule: generic constraints
**Rationale:** Unconstrained generics accept anything, defeating the purpose. Use `extends` to bound generics.
**Example:**
```typescript
// Wrong: T is unconstrained
function getId<T>(item: T): string { return (item as any).id }
// Correct: T must have id
function getId<T extends { id: string }>(item: T): string { return item.id }
```
