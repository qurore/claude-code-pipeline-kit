# TDD guide

> **Deference:** This skill supplements CLAUDE.md "Test-Driven Development (TDD)" section. On conflict, CLAUDE.md governs.

## Purpose

Enforce RED-GREEN-REFACTOR discipline for all non-trivial implementations, ensuring 80%+ coverage with co-located tests, proper mocking patterns, and edge-case coverage.

## When to use

- Writing new features, API routes, or components
- Fixing bugs (regression test first)
- Refactoring existing code
- Any change routed through DRW D3, EIW Stage 2, or SE Phase 6

## Protocol

### Phase 1: RED -- write failing tests first

1. Identify the unit of work (function, component, route, service).
2. Create a test file co-located with the source: `src/**/thing.test.ts(x)`.
3. Write test cases covering:
   - Happy path
   - Edge cases (null, undefined, empty, boundary values)
   - Error paths (invalid input, network failure, auth failure)
   - Concurrency/race conditions (where applicable)
4. Run tests -- they MUST fail:
   ```bash
   npm run test -- --testPathPattern="thing.test"
   ```

### Phase 2: GREEN -- minimal implementation

1. Write the minimum code to make all tests pass.
2. Do NOT add functionality beyond what tests require.
3. Run tests -- they MUST pass:
   ```bash
   npm run test -- --testPathPattern="thing.test"
   ```

### Phase 3: REFACTOR -- improve while green

1. Remove duplication, improve naming, simplify logic.
2. Run tests after every change -- they MUST stay green.
3. Do NOT change test expectations during refactor.

### Phase 4: Coverage verification

```bash
npm run test:coverage
```

Minimum thresholds: 80% line, 80% function, 80% statement, 80% branch.
Target thresholds: 90% line/function/statement, 85% branch.

## Mocking patterns (Vitest)

### database client

```typescript
vi.mock("@/lib/db/server", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    })),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }) },
  })),
}))
```

### LLM model factory

```typescript
vi.mock("../your-llm-factory", () => ({
  createModel: vi.fn(() => ({
    invoke: vi.fn().mockResolvedValue({ content: mockResponse }),
  })),
}))
```

### LLM JSON parser

```typescript
vi.mock("../your-json-helper", () => ({
  parseJsonFromLLM: vi.fn().mockReturnValue(mockParsed),
}))
```

### Next.js API route

```typescript
import { NextRequest } from "next/server"

const request = new NextRequest("http://localhost/api/endpoint", {
  method: "POST",
  body: JSON.stringify(payload),
})
const response = await POST(request)
expect(response.status).toBe(200)
```

## Test file organization

```
src/
  lib/utils/format.ts          -> format.test.ts        (unit)
  lib/ai/pipeline-nodes.ts     -> pipeline-nodes.test.ts (unit)
  app/api/wiki/[id]/route.ts   -> route.test.ts         (integration)
  components/ui/button.tsx     -> button.test.tsx        (unit)
e2e/
  codebase-analysis.spec.ts                                 (E2E, Playwright)
```

## Test structure (AAA)

```typescript
describe("calculateImpact", () => {
  it("returns affected domains for valid input", () => {
    // Arrange
    const sections = [mockSection({ name: "Auth" })]
    // Act
    const result = calculateImpact(sections, "login")
    // Assert
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe("Auth")
  })

  it("returns empty array when no matches", () => {
    const result = calculateImpact([], "login")
    expect(result).toEqual([])
  })

  it("throws on undefined input", () => {
    expect(() => calculateImpact(undefined as any, "login")).toThrow()
  })
})
```

## Quality gates

| Gate | Criteria | Blocking |
|------|----------|----------|
| RED phase | Tests exist and fail before implementation | Yes |
| GREEN phase | All tests pass | Yes |
| Coverage | >= 80% line/function/statement/branch | Yes |
| Isolation | Each test independent (no shared mutable state) | Yes |
| No skips | Zero `it.skip` or `describe.skip` in committed code | Yes |

## Common pitfalls

- **Testing implementation details** -- test behavior, not internal state. Assert on rendered output or return values, not private variables.
- **Brittle selectors in E2E** -- use `data-testid` or semantic selectors (`getByRole`), never CSS classes.
- **Shared state between tests** -- use `beforeEach` to reset; never depend on test execution order.
- **Missing `.mockResolvedValue` vs `.mockReturnValue`** -- async functions need `mockResolvedValue`.
- **Forgetting Zod `.output` vs `.input` types** -- `.default()` makes fields optional in input but present in output. Always provide fallbacks.

<!-- ECC-2026: enhancement -->
## Related agents

tdd-guide, e2e-runner, build-error-resolver
