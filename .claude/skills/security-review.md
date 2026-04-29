# Security review

> **Deference:** This skill supplements CLAUDE.md security-related rules. On conflict, CLAUDE.md governs.

## Purpose

Comprehensive security review checklist covering OWASP Top 10 categories plus project-specific concerns (database row-level security, Server Actions, payment webhooks, LLM prompt injection).

## When to use

- Implementing or modifying authentication/authorization
- Creating or changing API routes or Server Actions
- Handling user input, file uploads, or form submissions
- Working with your payment provider billing, webhooks, or payment flows
- Integrating external APIs (GitHub, Google AI)
- Storing or transmitting sensitive data
- Any change touching `middleware.ts`, RLS policies, or auth logic

## Protocol

Review each applicable category. For each, check all verification items. Log findings as PASS/FAIL with severity (CRITICAL/HIGH/MEDIUM/LOW).

### 1. Secrets management

- [ ] No hardcoded API keys, tokens, passwords, or connection strings
- [ ] All secrets sourced from `process.env` with existence checks
- [ ] `.env.local` listed in `.gitignore`
- [ ] No secrets in git history (`git log -p --all -S 'sk-' | head`)
- [ ] Production secrets in Vercel environment variables (not committed)

### 2. Input validation (OWASP A03: Injection)

- [ ] All user input validated with Zod schemas before processing
- [ ] File uploads restricted by size, MIME type, and extension
- [ ] No direct use of user input in SQL, shell commands, or file paths
- [ ] Allowlist validation preferred over denylist
- [ ] Error messages do not leak schema/table names or stack traces

### 3. SQL injection prevention (OWASP A03)

- [ ] All database queries use the query builder (`.from().select().eq()`)
- [ ] Raw SQL (if any) uses parameterized queries (`$1`, `$2`)
- [ ] No string concatenation or template literals in SQL
- [ ] RPC functions validate parameters server-side

### 4. Authentication and authorization (OWASP A01, A07)

- [ ] All protected API routes and Server Actions call `auth().getUser()`
- [ ] Authorization checks verify user owns the resource before mutation
- [ ] `middleware.ts` protects all `(dashboard)` routes
- [ ] OAuth callback validates state parameter
- [ ] Session tokens in httpOnly cookies, not localStorage

### 5. database client Row Level Security (project-specific)

- [ ] RLS enabled on every user-facing table
- [ ] Policies use `auth.uid()` for ownership checks
- [ ] No `service_role` key used in client-side code
- [ ] Server-side admin operations use `createServiceRoleClient()` only
- [ ] New tables include RLS policies in the migration file

### 6. Server Actions security (project-specific)

- [ ] Every `"use server"` function validates auth before proceeding
- [ ] Input validated with Zod (not trusted from client)
- [ ] No sensitive data returned in action responses
- [ ] Rate limiting applied to expensive operations
- [ ] Actions do not expose internal error details

### 7. XSS prevention (OWASP A07)

- [ ] No `dangerouslySetInnerHTML` without DOMPurify sanitization
- [ ] User-provided content rendered through React (auto-escaped)
- [ ] CSP headers configured in `next.config.js`
- [ ] Wiki content and LLM output sanitized before rendering

### 8. payment webhook security (project-specific)

- [ ] Webhook signature verified with `verifyWebhookSignature()`
- [ ] Webhook endpoint does not trust request body without signature verification
- [ ] Idempotency: duplicate events handled gracefully
- [ ] Webhook secret in environment variable (`PAYMENT_WEBHOOK_SECRET`)
- [ ] No customer PII logged from webhook payloads

### 9. LLM prompt injection (project-specific)

- [ ] User-supplied text separated from system instructions
- [ ] Wiki content and feature specs sanitized before LLM prompts
- [ ] LLM output validated/parsed with Zod before use
- [ ] No execution of LLM-generated code without sandboxing
- [ ] Token limits enforced to prevent cost abuse

### 10. Dependency and infrastructure security (OWASP A06)

- [ ] `npm audit` shows no critical/high vulnerabilities
- [ ] Lock file (`package-lock.json`) committed
- [ ] No `eval()`, `new Function()`, or dynamic `require()` in production code
- [ ] HTTPS enforced in production
- [ ] CORS configured to allow only trusted origins

## Output format

```
SECURITY REVIEW
===============

1. Secrets:        [PASS/FAIL] severity
2. Input:          [PASS/FAIL] severity
3. SQL injection:  [PASS/FAIL] severity
4. Auth:           [PASS/FAIL] severity
5. database row-level security:   [PASS/FAIL] severity
6. Server Actions: [PASS/FAIL] severity
7. XSS:           [PASS/FAIL] severity
8. your payment provider:        [PASS/FAIL] severity
9. LLM injection: [PASS/FAIL] severity
10. Dependencies:  [PASS/FAIL] severity

Critical issues: N
High issues:     N
Overall:         [SECURE / REQUIRES REMEDIATION]
```

## Quality gates

| Gate | Criteria | Blocking |
|------|----------|----------|
| Zero CRITICAL | No critical-severity findings | Yes |
| Zero HIGH (auth) | No high-severity auth/RLS findings | Yes |
| Secrets clean | No hardcoded secrets | Yes |
| RLS coverage | Every new table has RLS policies | Yes |
| Webhook verified | payment webhooks verify signatures | Yes |

## Common pitfalls

- **Using `db-cli` browser client in Server Actions** -- use `createClient()` from `@/lib/db/server` which provides the server-side client with proper cookie handling.
- **Trusting `request.json()` without validation** -- always parse through a Zod schema; malformed JSON should return 400, not crash.
- **RLS "enabled but empty"** -- enabling RLS without policies denies all access, which looks correct in tests but breaks in production. Always add explicit policies.
- **Logging your payment provider event objects** -- event payloads contain customer PII. Log only event type and ID.
- **Assuming LLM output is safe HTML** -- always parse LLM JSON responses through `parseJsonFromLLM()` with a Zod schema; never render raw LLM text as HTML.

<!-- ECC-2026: enhancement -->
## Related agents

security-reviewer, code-reviewer
