# E2E testing

> **Deference:** This skill supplements CLAUDE.md "Test-Driven Development (TDD)" section and the tdd-guide skill. On conflict, CLAUDE.md governs. This skill covers Playwright-specific patterns; unit/integration testing lives in the tdd-guide.

## Purpose

Playwright E2E testing patterns, page object conventions, and CI integration for your project's Next.js dashboard, ensuring tests are reliable, isolated, and maintainable.

## When to use

- Writing E2E tests for new pages or user flows
- Debugging flaky or timing-sensitive tests
- Setting up test authentication and data fixtures
- Verifying full user journeys (login, codebase-analysis, blueprint generation)
- At DRW D4, EIW Stage 3, or SE Phase 7 when E2E verification is required

## Protocol

### 1. Test file structure

Place all E2E tests in the `e2e/` directory at the project root:

```
e2e/
  auth.setup.ts           # shared auth fixture
  codebase-analysis.spec.ts  # feature spec
  blueprint.spec.ts       # feature spec
  fixtures/
    test-data.ts          # shared test data helpers
```

Use `test.describe` for grouping related scenarios:

```typescript
test.describe("codebase-analysis", () => {
  test("generates wiki from connected repository", async ({ page }) => { ... })
  test("shows progress during synthesis", async ({ page }) => { ... })
})
```

### 2. Auth setup

Use shared auth state via Playwright's `storageState` to avoid logging in per test. Create `e2e/auth.setup.ts` that logs in and saves state to `.auth/user.json`. Reference it in `playwright.config.ts` as a setup project with `dependencies: ["setup"]` and `use: { storageState: ".auth/user.json" }`.

### 3. Page navigation

Always wait for the page to be ready before interacting:

```typescript
await page.goto("/dashboard/projects")
await page.waitForLoadState("networkidle")
```

For SPA navigation within the dashboard, wait for the target element instead of `networkidle`:

```typescript
await page.getByRole("link", { name: "Blueprints" }).click()
await page.waitForSelector("[data-testid='blueprint-list']")
```

### 4. Selectors

Use selectors in this priority order:

| Priority | Selector | Example |
|----------|----------|---------|
| 1 | `data-testid` | `page.getByTestId("wiki-viewer")` |
| 2 | ARIA role | `page.getByRole("button", { name: "Generate" })` |
| 3 | Text content | `page.getByText("No blueprints yet")` |
| 4 | Label | `page.getByLabel("Project name")` |

Never use CSS class selectors -- they break with Tailwind changes and dark theme adjustments.

### 5. Assertions

Use Playwright's auto-waiting assertions: `toBeVisible()`, `toHaveText()`, `toHaveCount()`, `toHaveURL()`. Never use manual `waitForTimeout()` -- always wait for a specific condition.

### 6. Artifacts on failure

Configure in `playwright.config.ts`: `screenshot: "only-on-failure"`, `trace: "on-first-retry"`, `video: "retain-on-failure"`. Per CLAUDE.md, manual screenshots MUST save to `.claude/screenshots/`.

## project-specific patterns

- **Dark theme:** your project uses a dark theme. Avoid assertions on color values; assert visibility and structure instead.
- **Dashboard auth:** All `/dashboard/**` routes require auth. Use the shared `storageState` fixture.
- **Wiki viewer:** Tree nodes are expandable. Click the toggle, then assert on child visibility.
- **Chat drawer:** Opens as an overlay. Wait for the drawer container, not the page background.
- **database client test data:** Create test data via database admin client in `globalSetup`, clean up in `globalTeardown`. Never leave test records in production-adjacent databases.

## Quality gates

| Gate | Criteria | Blocking |
|------|----------|----------|
| Isolation | Each test independent, no shared mutable state | Yes |
| No hardcoded waits | Zero `waitForTimeout()` calls | Yes |
| Artifacts | Screenshot/trace on failure configured | Yes |
| CI-compatible | Tests pass in headless mode without local state | Yes |
| Selectors stable | No CSS class selectors | Yes |

## Common pitfalls

- **`waitForTimeout(3000)` for loading states** -- use `waitForSelector` or `waitForLoadState` instead. Hardcoded waits cause flakiness and slow suites.
- **Flaky network assertions** -- mock API responses with `page.route()` for deterministic tests; only test real APIs in smoke tests.
- **Shared test data across specs** -- each spec must create and clean up its own data. Parallel execution breaks shared state.
- **CSS selectors that break with theme changes** -- `".bg-emerald-500"` will break when the theme changes. Use `data-testid` or semantic roles.
- **Testing third-party OAuth in CI** -- mock the OAuth callback; do not rely on real Google/GitHub auth in automated pipelines.
