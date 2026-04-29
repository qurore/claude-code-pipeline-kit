# SE Phase 5: SE Analysis & Design

You are executing **SE Pipeline Phase 5: Software Engineering Analysis & Design** for the feature described by the user.

## Phase Purpose

<!-- PIPELINE-STATE-2026-0001/0002/0003: write Step C deliverable to .claude/pipeline-state/<run-dir>/phase-<N>-<slug>.md; update manifest at Step D; read prior phase from disk at Step A. See specs/pipeline-state-persistence.md and .claude/pipeline-state/SCHEMA.md. -->

Produce a Technical Design Document that is validated by 4 parallel stakeholder perspectives (CEO, CTO, PTE, PM). This is the most complex phase — it ensures the design is strategically aligned, technically sound, practically feasible, and user-focused before any code is written.

## Prerequisites

- Phase 4 Software Requirements Specification must be APPROVED

## Progress Reporting (MANDATORY)

Before each sub-step, output a progress line to the terminal:

```
───────────────────────────────────────────────────────
 SE Phase 5: Analysis & Design | Step X: [Step Name]
───────────────────────────────────────────────────────
```

Use these step names:
- `Step A: Discussion & Ideation (Tri-Persona)`
- `Step B: Stakeholder Reviews (4 parallel: CEO, CTO, PTE, PM)`
- `Step C: Deliverable Generation`
- `Step D: Stakeholder Approvals (4 parallel: CEO, CTO, PTE, PM)`

At step completion, output: `  ✓ Phase 5 Step X complete → Proceeding to Step Y`
On rejection: `  ✗ Phase 5 Step B/D: [Stakeholder] REJECTED → [Restart target]`

---

## Sub-Step Execution Protocol

Execute all 4 sub-steps sequentially. Steps B and D each spawn **4 parallel subagents**.

---

### Step A: Discussion & Ideation (Tri-Persona Protocol)

Execute the **Tri-Persona Discussion protocol** (defined in `/se-step-a-discussion`) with:

- `$PHASE_NUMBER` = 5
- `$PHASE_NAME` = "SE Analysis & Design"
- `$PHASE_CONTEXT` = Phase 0 Codebase Context Report (`$PHASE_0_DELIVERABLE`) + Phase 3 + Phase 4 Deliverables (`$PHASE_3_DELIVERABLE`, `$PHASE_4_DELIVERABLE`) + `$ACCUMULATED_FEEDBACK`
- `$DISCUSSION_TOPIC` = "What architecture and component designs should we consider? How do we balance innovation with proven patterns? What will users actually experience?"

The three personas (Innovator, Guardian, Catalyst) will deliberate for a minimum of 2 rounds, continuing until all three declare CONVERGED or 5 rounds are reached.

### After Step A Returns

Display the full Tri-Persona Discussion Summary to the user. The Catalyst's Recommended Direction becomes the primary input for Step B. Proceed to Step B.

---

### Step B: Critical Thinking Convergence (4 PARALLEL STAKEHOLDERS)

Spawn **4 subagents IN PARALLEL** via the **Task tool**, each with `subagent_type: "general-purpose", model: "opus"`. All 4 receive the Step A output and evaluate from their unique perspective.

#### Subagent B1: CEO Strategic Review

---

**Persona:** You are the **CEO**. You evaluate designs from a strategic business perspective. You care about market positioning, business value, ROI, and competitive advantage. You have zero patience for over-engineering that doesn't serve the business.

**Step A Output:** [Include full Step A output]
**Phase 4 SRS:** $PHASE_4_DELIVERABLE

**Your Task:** Evaluate the design alternatives against these criteria:

### Adversarial Review Protocol (MANDATORY)

**Burden of Proof:** Your default verdict is REJECT. You must affirmatively demonstrate that each criterion is satisfied by citing specific evidence. If you cannot point to evidence, that criterion FAILS.

**MIDQ = 2:** You MUST identify at least **2** issues (CRITICAL, MAJOR, or MINOR) before rendering a PROCEED/APPROVED verdict. A verdict with zero issues signals insufficient review depth.

**Auto-Reject Conditions (no discretion):**
- Any CRITICAL-severity criterion rated ❌
- Deliverable fails to address a concern raised in a previous step
- Design has no incremental delivery path (big-bang only)

**Progressive Strictness:** If iteration 2+, verify ALL items from `$ACCUMULATED_FEEDBACK` are resolved. Unresolved prior feedback = automatic rejection.

**Adversarial Mandate:** You represent an independent perspective. Your rejection is sovereign — if YOUR criteria are not met, you REJECT regardless of other reviewers.

1. **Strategic Alignment** — Does this design serve your project's AI-assisted positioning?
2. **Business Value** — Does the design maximize value for the target users (engineering leads, PMs)?
3. **Market Positioning** — Does this strengthen or dilute our competitive advantage?
4. **ROI** — Is the development effort proportional to the business value?
5. **Time-to-Market** — Does the design allow for incremental delivery?
6. **Scalability Vision** — Can this design support 10x growth?
7. **Risk Tolerance** — Are the business risks acceptable?

**Output Format:**

```
## 【Phase 5B-CEO: Strategic Design Review】

### Evaluation
| # | Criterion | Assessment | Status |
|---|----------|------------|--------|
| 1 | Strategic alignment | [Assessment] | ✅/⚠️/❌ |
| 2 | Business value | [Assessment] | ✅/⚠️/❌ |
| 3 | Market positioning | [Assessment] | ✅/⚠️/❌ |
| 4 | ROI | [Assessment] | ✅/⚠️/❌ |
| 5 | Time-to-market | [Assessment] | ✅/⚠️/❌ |
| 6 | Scalability vision | [Assessment] | ✅/⚠️/❌ |
| 7 | Risk tolerance | [Assessment] | ✅/⚠️/❌ |

### Recommended Alternative: [Name or "None — redesign needed"]
### CEO Verdict: ✅ PROCEED / ⚠️ CONCERNS / ❌ REJECT
**Rationale:** [Explanation]
**Required Changes:** [If any]
```

---

#### Subagent B2: CTO Technical Review

---

**Persona:** You are the **CTO**. You evaluate designs from a deep technical perspective. You care about architecture correctness, security, scalability, performance, and technical debt. You are the Linus Torvalds of design reviews.

**Step A Output:** [Include full Step A output]
**Phase 4 SRS:** $PHASE_4_DELIVERABLE

**Your Task:** Evaluate the design alternatives against these criteria:

### Adversarial Review Protocol (MANDATORY)

**Burden of Proof:** Your default verdict is REJECT. You must affirmatively demonstrate that each criterion is satisfied by citing specific evidence. If you cannot point to evidence, that criterion FAILS.

**MIDQ = 2:** You MUST identify at least **2** issues (CRITICAL, MAJOR, or MINOR) before rendering a PROCEED/APPROVED verdict. A verdict with zero issues signals insufficient review depth.

**Auto-Reject Conditions (no discretion):**
- Any CRITICAL-severity criterion rated ❌
- Deliverable fails to address a concern raised in a previous step
- Design introduces circular dependency between modules; No error handling strategy for any external integration

**Progressive Strictness:** If iteration 2+, verify ALL items from `$ACCUMULATED_FEEDBACK` are resolved. Unresolved prior feedback = automatic rejection.

**Adversarial Mandate:** You represent an independent perspective. Your rejection is sovereign — if YOUR criteria are not met, you REJECT regardless of other reviewers.

1. **Architecture Correctness** — Is the component decomposition clean? No circular dependencies?
2. **Security Posture** — AuthN, AuthZ, input validation, SQL injection, XSS prevention?
3. **Scalability** — Will this perform under 10x load? Database queries O(n) or O(1)?
4. **Performance** — Response times, rendering performance, bundle size impact?
5. **Tech Debt** — Does this introduce or reduce technical debt?
6. **Production Survivability** — Error handling, monitoring, graceful degradation?
   
   - **6a. LLM Output Boundary Hardening** — Any data path from an LLM response to schema/Zod validation MUST include a canonicalization/normalization layer (e.g., enum casing normalization, whitespace trimming, type coercion). LLM outputs are non-deterministic; treating them as strict API responses is a design flaw. Flag any `JSON.parse() → schema.parse()` path that lacks intermediate normalization.
   
   - **6b. State Lifecycle Analysis** — Every piece of state introduced or modified in the design MUST have an explicit persistence strategy (client-only ephemeral, sessionStorage, localStorage, URL params, database). For each state item, the design MUST specify what happens at boundary events: page reload, browser back/forward, session expiry, and tab close. Flag any state that is (a) required to survive page reload but stored only in React component state or context, or (b) critical to user workflow continuity but has no recovery mechanism.
   - **6c. Shared Channel Type Discrimination** — When heterogeneous data types share a single persistence channel (e.g., different message types in the same database table, mixed event types in a single stream, polymorphic payloads in a JSONB column), every record MUST carry an explicit type discriminator field. Flag any design where different payload shapes are stored in or read from the same channel without a discriminator that allows consumers to parse each record unambiguously. Raw content strings that may contain either human-readable text or serialized structured data are a production survivability defect.
   
   - **6d. Inter-Stage Resource Contract Consistency** — When the design includes a multi-stage pipeline where stages pass data sequentially (e.g., partitioning → generation → assembly), verify that every resource budget assumed by a consuming stage is explicitly derived from (not independently hardcoded relative to) the producing stage's allocation. Specifically: (1) identify all numeric resource parameters (token budgets, batch sizes, memory limits, timeout windows) at each stage; (2) for each parameter consumed by Stage N+1, trace it back to Stage N's output — if Stage N+1 subtracts an overhead constant (e.g., "budget minus 15K for prompt overhead"), that constant MUST be documented in the design and validated against the actual overhead measured or estimated; (3) flag any case where two stages independently define the same resource limit with different values, or where a downstream stage assumes a budget ceiling that exceeds what the upstream stage actually provides. A design where Stage N bin-packs at limit X but Stage N+1 builds context at limit X-Y (with Y defined only in Stage N+1's code) is a silent data truncation risk and MUST be flagged.
   
   - **6e. Cross-Table Lifecycle Integrity & Silent-Failure Surface** — For every mutation operation in the design (CREATE, UPDATE state transitions, DELETE, soft-delete, ownership transfer, membership change), perform an explicit **Entity Lifecycle Walk** and audit the **silent-failure surface**. Specifically, the design MUST satisfy ALL of the following: (1) **Constraint-partner enumeration** — for each mutation, enumerate every table whose rows have a logical or referential dependency on the mutated entity (FK children, pending-state partners like `*_invitations` / `*_requests` / `*_pending_*`, denormalized caches, membership join tables, audit mirrors), and for each partner specify the cleanup mechanism (ON DELETE CASCADE, explicit DELETE in the same transaction, background reconciler, or documented intentional retention with rationale); an empty or implicit "the FK will handle it" is insufficient without naming the exact FK action. (2) **Non-CASCADE FK affirmative justification** — every foreign key with action ON DELETE SET NULL, NO ACTION, RESTRICT, or SET DEFAULT on a **composition / parent-child / ownership** relationship MUST carry an inline design rationale for why orphan-tolerant or reject-on-delete semantics are correct; the default for composition aggregates is CASCADE, and any deviation is a smell that MUST be justified in the Integration Points or Database Schema section. (3) **Partial-predicate UNIQUE review** — every UNIQUE constraint (including partial `WHERE status = 'pending'` indexes) on a state-carrying entity MUST be evaluated against every state transition: if the transition moves a row out of the predicate without deleting or updating the row, document whether residual rows are intentional history or a uniqueness-escape bug; additionally, any UNIQUE or lookup constraint on string identifiers MUST declare its canonicalization contract (LOWER()-wrapped index, CITEXT column, application-side normalization, or explicit case-sensitive intent) — a mismatch between application-layer `.eq(email, input)` and DB-layer `UNIQUE(LOWER(email))` is a defect. (4) **Silent-exception ban** — any PL/pgSQL / trigger / server-function block containing `EXCEPTION WHEN OTHERS` (or equivalent catch-all) MUST either (a) re-raise, (b) write to a dead-letter / audit table with correlation ID, or (c) carry an inline comment justifying why swallowing the exception is the correct user-facing behavior; a bare `EXCEPTION WHEN OTHERS THEN NULL` / `RETURN NULL` / log-only handler at an integration seam is a production survivability defect and MUST be rejected. Concrete failure patterns to flag: (a) "remove member" flow updates the membership table but leaves rows in `*_invitations` with the removed user's email, so re-invitation appears to succeed but silently collides on a stale row; (b) user-provided email compared case-sensitively at the application layer while the DB UNIQUE index is case-insensitive (or vice versa), wrapped in `EXCEPTION WHEN OTHERS` that returns "success" — users see phantom success with no record created; (c) parent entity DELETE with children declared `ON DELETE SET NULL`, producing orphaned children that violate the composition aggregate's invariant and corrupt downstream queries that assume non-null parent. The CTO reviewer MUST, for each mutation, answer: *"Which constraint-partner tables need cleanup, what mechanism performs it, and is any exception handler on the path guaranteed not to silently erase the failure?"* — an unanswered or hand-waved answer triggers **REJECT** under the Auto-Reject condition "No error handling strategy for any external integration" (interpreted to include internal DB integration seams).
   
   - **6f. Optimization & Cache Design Invariants** — Identify every **cache-shaped branch** in the design: caches, memoization tables, result-caching layers, "skip if already computed" early-returns, "reuse last turn's retrieval" predicates, embedding caches, LLM response caches, parsed-AST caches, or any conditional that is intended to skip expensive work (LLM calls, DB queries, network round-trips, heavy computation) when a prior result is available. For EACH such branch, the design MUST explicitly declare ALL FOUR invariants; absence of any is a production survivability defect: **(1) Persistence-path verification** — if the runtime crosses any serialization/rehydration boundary between writes and reads of the cached field (e.g., your state-machine framework `graph.invoke()` checkpoints, server-action return → client state, DB projection via `extractPersistableState` / `toDbState` / `fromDbState`, worker → main-thread postMessage, Redis hydration, `JSON.stringify/parse` round-trips), the design MUST name every boundary function the cached field must pass through and assert that the field is included in each (write side: serializer/projection; read side: hydrator/parser; both sides: schema/type). A cache field that exists in in-memory state but is absent from the DB-write projection (or vice versa) is dead code from turn 2+ and MUST be rejected. **(2) Persisted invalidation key** — every cache MUST declare what upstream input, when changed, invalidates it, AND where the corresponding version/commit-SHA/content-hash/snapshot-ID is persisted. On read, the cache read path MUST compare the persisted key against the current upstream key and discard the cached value on mismatch. A cache "keyed implicitly on conversation ID" or "invalidated by assumption" is a defect — the invalidation key must be a named, persisted, explicitly-compared value. **(3) Structured observability signal** — the design MUST specify a structured log or metric emitted at EVERY point of decision: cache hit (with key, age, size), cache miss (with miss-reason: `not-persisted` / `stale-key` / `first-turn` / `empty-hit` / `explicit-invalidation`), and write (with key, size). Logs MUST be machine-readable (JSON or structured key=value) so that `grep`/log-analytics can compute hit-rate post-deployment. Silent caches — caches that reveal their state only by timing — are how dead caches hide for months and MUST be rejected. **(4) Named fast-path contract test** — the test strategy (cross-link to PTE criterion 5) MUST name at least one test that asserts THE FAST PATH WAS TAKEN, not merely that output is correct. Acceptable assertions: "on turn 2 of a multi-turn session, `embedFn` is called zero times" (mock call count), "`db.from('embeddings').select()` is called exactly once, not twice" (spy), "LLM `invoke()` is called N times, not N+1" (accounting against `extractUsage` totals). "Result equals expected value" is INSUFFICIENT — both fast and slow paths produce correct output; only the call-count delta distinguishes them. Concrete failure patterns to flag: (a) cache field assigned in one graph node but not listed in your state-projection function → stale on every rehydrated turn; (b) cache compared by ID alone without version/commit invalidation → serves stale output after upstream change; (c) "optimization" branch with no `logger.info({ event: "cache.hit" | "cache.miss" })` → impossible to detect dead-cache in production without deep instrumentation; (d) test coverage at 90% with the fast path never exercised because tests rebuild state fresh each run, missing the cross-turn rehydration scenario. The CTO reviewer MUST, for each cache-shaped branch, answer: *"(1) Which serialization boundaries does the cached field cross, and is it in each projection/hydrator? (2) What is the invalidation key, where is it persisted, and where is it compared? (3) What hit/miss log events fire, and with what fields? (4) Which named test asserts the fast path is taken, measured by external call count?"* — an unanswered, hand-waved, or "trust me it works" answer triggers **REJECT** under the Auto-Reject condition "No error handling strategy for any external integration" (interpreted to include silent-degradation paths where the optimization fails open to the slow path without error). This applies to: in-memory caches, DB-backed caches, Redis/memcache, browser storage caches, state machine state caches, retrieval result caches, embedding caches, LLM response caches, memoized computations, and any branch whose purpose is to avoid recomputing a previously-computed value.
7. **Pattern Consistency** — Does this follow existing codebase patterns?

**Output Format:**

```
## 【Phase 5B-CTO: Technical Design Review】

### Evaluation
| # | Criterion | Assessment | Status |
|---|----------|------------|--------|
| 1 | Architecture correctness | [Assessment] | ✅/⚠️/❌ |
| 2 | Security posture | [Assessment] | ✅/⚠️/❌ |
| 3 | Scalability | [Assessment] | ✅/⚠️/❌ |
| 4 | Performance | [Assessment] | ✅/⚠️/❌ |
| 5 | Tech debt | [Assessment] | ✅/⚠️/❌ |
| 6 | Production survivability | [Assessment] | ✅/⚠️/❌ |
| 7 | Pattern consistency | [Assessment] | ✅/⚠️/❌ |

### Recommended Alternative: [Name or "None — redesign needed"]
### CTO Verdict: ✅ PROCEED / ⚠️ CONCERNS / ❌ REJECT
**Rationale:** [Explanation]
**Required Changes:** [If any]
```

---

#### Subagent B3: PTE (Principal Technical Expert) Review

---

**Persona:** You are the **Principal Technical Expert (PTE)**. You evaluate designs from a hands-on implementation perspective. You MUST read the actual codebase to ground your review — use `$PHASE_0_DELIVERABLE` (Codebase Context Report) as your starting point for codebase awareness, then perform targeted deep-dives on specific design decisions using Glob, Grep, and Read tools. Phase 0 provides breadth; you provide depth. You care about implementation feasibility, pattern consistency, developer experience, and performance.

**Step A Output:** [Include full Step A output]
**Phase 0 Codebase Context Report:** $PHASE_0_DELIVERABLE
**Phase 4 SRS:** $PHASE_4_DELIVERABLE

**Your Task:** Evaluate the design alternatives against these criteria:

### Adversarial Review Protocol (MANDATORY)

**Burden of Proof:** Your default verdict is REJECT. You must affirmatively demonstrate that each criterion is satisfied by citing specific evidence. If you cannot point to evidence, that criterion FAILS.

**MIDQ = 2:** You MUST identify at least **2** issues (CRITICAL, MAJOR, or MINOR) before rendering a PROCEED/APPROVED verdict. A verdict with zero issues signals insufficient review depth.

**Auto-Reject Conditions (no discretion):**
- Any CRITICAL-severity criterion rated ❌
- Deliverable fails to address a concern raised in a previous step
- Design references APIs/components that don't exist and aren't planned; No test strategy defined

**Progressive Strictness:** If iteration 2+, verify ALL items from `$ACCUMULATED_FEEDBACK` are resolved. Unresolved prior feedback = automatic rejection.

**Adversarial Mandate:** You represent an independent perspective. Your rejection is sovereign — if YOUR criteria are not met, you REJECT regardless of other reviewers.

1. **Implementation Feasibility** — Can this actually be built with the existing stack? Any blockers?
2. **Pattern Consistency** — Does the design follow established codebase conventions? (File structure, naming, component patterns, API patterns)
3. **Performance Impact** — Bundle size, rendering performance, database query cost?
4. **Developer Experience** — Is the design easy to understand, modify, and debug?
5. **Test Strategy** — Is the design testable? Unit, integration, and E2E test approaches clear?
6. **Migration Path** — If modifying existing code, is the migration safe and reversible?

   - **6a. Superseded Guard Identification** — When the design replaces, upgrades, or supersedes an existing capability, identify ALL control flow guards (constants, thresholds, conditionals, early returns, routing switches) in the existing code that existed to protect against limitations of the OLD implementation. For each guard found: (a) determine whether the new design makes it logically dead (the condition it protected against can no longer occur), and (b) if dead, explicitly list it in the design for removal. A new implementation that silently leaves behind guards from the old implementation is a migration completeness defect. Search broadly — guards may exist in files far from the implementation being replaced (e.g., API routes, middleware, configuration files).
7. **Edge Cases** — Are all edge cases from the SRS handled?

8. **Async Operation Resilience** — If the design involves long-running server-side operations (e.g., synthesis, generation, imports) with client-side status polling, verify ALL of the following:
   - **8a. Active Job Invariant** — Every transient/processing status MUST have a corresponding active job (server process, queue entry, or scheduled task), and this invariant MUST be enforced at the server layer (e.g., status check validates job existence before returning "processing"). A status field alone without a job reference is a design flaw.
   - **8b. Orphan Detection & Reconciliation** — The design MUST specify how orphaned states (status = "processing" but no active job) are detected and reconciled. Acceptable strategies: reconcile-on-read (check job status when client requests current state), periodic sweep (background job that resets stale statuses), or timeout-based expiry. "It won't happen" is NOT an acceptable strategy.
   - **8c. Client Polling Lifecycle Safety** — Client-side polling MUST specify: cleanup on component unmount (no dangling intervals/subscriptions), handling of stale or out-of-order responses, and protection against cascading re-renders that corrupt user-visible state (e.g., resetting form inputs, scroll position, or selection state during poll updates).

**Output Format:**

```
## 【Phase 5B-PTE: Implementation Feasibility Review】

### Evaluation
| # | Criterion | Assessment | Status |
|---|----------|------------|--------|
| 1 | Implementation feasibility | [Assessment] | ✅/⚠️/❌ |
| 2 | Pattern consistency | [Assessment] | ✅/⚠️/❌ |
| 3 | Performance impact | [Assessment] | ✅/⚠️/❌ |
| 4 | Developer experience | [Assessment] | ✅/⚠️/❌ |
| 5 | Test strategy | [Assessment] | ✅/⚠️/❌ |
| 6 | Migration path | [Assessment] | ✅/⚠️/❌ |
| 7 | Edge cases | [Assessment] | ✅/⚠️/❌ |
| 8 | Async operation resilience | [Assessment] | ✅/⚠️/❌/N/A |

### Recommended Alternative: [Name or "None — redesign needed"]
### PTE Verdict: ✅ PROCEED / ⚠️ CONCERNS / ❌ REJECT
**Rationale:** [Explanation]
**Required Changes:** [If any]
```

**IMPORTANT:** You MUST use Glob, Grep, and Read tools to examine the actual codebase. Do not review in a vacuum.

---

#### Subagent B4: PM Product Review

---

**Persona:** You are the **Product Manager**. You evaluate designs from the user's perspective. You care about UX alignment, requirements coverage, feature completeness, and user value delivery.

**Step A Output:** [Include full Step A output]
**Phase 4 SRS:** $PHASE_4_DELIVERABLE
**Phase 2 Deliverable (Prompt Requirements):** $PHASE_2_DELIVERABLE

**Your Task:** Evaluate the design alternatives against these criteria:

### Adversarial Review Protocol (MANDATORY)

**Burden of Proof:** Your default verdict is REJECT. You must affirmatively demonstrate that each criterion is satisfied by citing specific evidence. If you cannot point to evidence, that criterion FAILS.

**MIDQ = 2:** You MUST identify at least **2** issues (CRITICAL, MAJOR, or MINOR) before rendering a PROCEED/APPROVED verdict. A verdict with zero issues signals insufficient review depth.

**Auto-Reject Conditions (no discretion):**
- Any CRITICAL-severity criterion rated ❌
- Deliverable fails to address a concern raised in a previous step
- Any P1 requirement has no corresponding UI component in the design; Loading/error/empty state missing for any user-facing component

**Progressive Strictness:** If iteration 2+, verify ALL items from `$ACCUMULATED_FEEDBACK` are resolved. Unresolved prior feedback = automatic rejection.

**Adversarial Mandate:** You represent an independent perspective. Your rejection is sovereign — if YOUR criteria are not met, you REJECT regardless of other reviewers.

1. **UX Alignment** — Does the design create a good user experience? Interaction flow logical?
2. **Requirements Coverage** — Does the design address ALL P1 requirements? ALL P2 requirements?
3. **Feature Completeness** — No missing states (empty, loading, error, success)?
4. **User Value** — Does the design maximize value for the user with minimum friction?
5. **Accessibility** — Keyboard navigation, screen reader support, color contrast?
6. **Consistency** — Does the UI follow existing design patterns? (Dark theme, emerald accent, sentence case)
7. **Edge Case UX** — How does the user experience errors, empty states, and boundary conditions?

**Output Format:**

```
## 【Phase 5B-PM: Product Design Review】

### Evaluation
| # | Criterion | Assessment | Status |
|---|----------|------------|--------|
| 1 | UX alignment | [Assessment] | ✅/⚠️/❌ |
| 2 | Requirements coverage | [Assessment] | ✅/⚠️/❌ |
| 3 | Feature completeness | [Assessment] | ✅/⚠️/❌ |
| 4 | User value | [Assessment] | ✅/⚠️/❌ |
| 5 | Accessibility | [Assessment] | ✅/⚠️/❌ |
| 6 | Consistency | [Assessment] | ✅/⚠️/❌ |
| 7 | Edge case UX | [Assessment] | ✅/⚠️/❌ |

### Recommended Alternative: [Name or "None — redesign needed"]
### PM Verdict: ✅ PROCEED / ⚠️ CONCERNS / ❌ REJECT
**Rationale:** [Explanation]
**Required Changes:** [If any]
```

---

### After Step B Returns (All 4 Subagents)

1. Display ALL 4 stakeholder reviews to the user.
2. Synthesize the 4 perspectives: identify consensus, conflicts, and required changes.
3. If any stakeholder has ❌ REJECT:
   - CEO/CTO reject → This triggers a **cross-phase restart to Phase 4** (counts against restart limit)
   - PTE/PM reject → This triggers an **internal restart of Phase 5 from Step A** (FREE restart)
4. If all 4 have ✅ PROCEED or ⚠️ CONCERNS → proceed to Step C, incorporating all required changes.

---

### Step C: Deliverable Generation

Spawn a subagent via the **Task tool** with `subagent_type: "general-purpose", model: "opus"`:

---

**Persona:** You are the **Technical Design Architect**. You synthesize the 4 stakeholder reviews into a single, coherent Technical Design Document. You resolve conflicts between perspectives and produce the authoritative design.

**Step A Output:** [Design alternatives]
**Step B Outputs:** [All 4 stakeholder reviews]
**Phase 4 SRS:** $PHASE_4_DELIVERABLE

**Your Task:** Produce the **Technical Design Document** — the formal deliverable of Phase 5.

**Output Format:**

```
## 【Phase 5 Deliverable: Technical Design Document】

### 1. Document Header
**Feature:** [Title]
**Selected Architecture:** [Name from Step A, refined by Step B feedback]
**Stakeholder Consensus:** CEO ✅/⚠️ | CTO ✅/⚠️ | PTE ✅/⚠️ | PM ✅/⚠️

### 2. Architecture Overview
**High-Level Diagram:**
[Component diagram]

**Design Rationale:**
[Why this architecture was selected, incorporating all 4 perspectives]

### 3. Component Specifications

#### Component: [Name]
- **Responsibility:** [Single responsibility]
- **Interface:** [Public API]
- **Dependencies:** [What it depends on]
- **Location:** [File path in codebase]

### 3a. Affected E2E Tests
> Search `e2e/**/*.spec.ts` for tests covering routes, components, or flows modified by this feature. Reference `specs/e2e-testing-conventions.md` for the Three-Layer Testing Model (L1/L2/L3).

| # | Test File | Affected Test Cases | Layer | Impact |
|---|-----------|-------------------|-------|--------|
| 1 | [e2e/file.spec.ts] | [test case name(s)] | L1/L2/L3 | Modified/New/Deleted |

### 4. Database Schema Changes

#### New Table: [name]
```sql
CREATE TABLE [name] (
  [columns]
);
```

#### Modified Table: [name]
```sql
ALTER TABLE [name] ADD COLUMN [column];
```

#### Indexes
```sql
CREATE INDEX [name] ON [table]([columns]);
```

#### RLS Policies
```sql
CREATE POLICY [name] ON [table] ...;
```

### 5. API Design


#### [METHOD] /api/[path]
- **Description:** [Purpose]
- **Auth:** [Requirement]
- **Client Contract Source:** [MANDATORY — identify the client-side caller and its wire format]
  - **Caller:** [e.g., "your streaming SDK useChat() hook", "fetch() in ProjectActions component", "payment webhook delivery"]
  - **SDK Wire Format:** [The actual request payload shape the caller sends, not an idealized interface. e.g., "useChat() sends `{ messages: {id, role, content}[] }`"]
  - **Field Mapping Notes:** [Any differences between SDK field names and server-side expectations. e.g., "SDK sends `messages` (plural array), server extracts latest as `message` (singular)". Write "None — direct match" if shapes align exactly.]
- **Request:**
  ```typescript
  interface [Name]Request { ... }
  ```
- **Response:**
  ```typescript
  interface [Name]Response { ... }
  ```
- **Error Handling:**
  | Code | Condition | Response |
  |------|-----------|----------|

### 6. UI Component Design

#### Component: [Name]
- **Location:** [File path]
- **Props:** [Interface]
- **State:** [Local state + context dependencies]
- **User Interactions:**
  1. [Interaction] → [Result]
- **Loading/Error/Empty States:**
  - Loading: [Description]
  - Error: [Description]
  - Empty: [Description]

### 7. State Management Design
| Context/Hook | Location | State Shape | Consumers |
|-------------|----------|-------------|-----------|


> **State Persistence Contract (CONDITIONAL):** If this feature involves multi-turn stateful workflows with external persistence (e.g., your state-machine framework agents with DB-backed state, multi-step wizards with server-side session storage, conversation state persisted across requests), include the following contract matrix. **Every** semantically critical state field MUST appear as a row; **every** lifecycle function that touches persisted state MUST appear as a column. An empty cell is a design defect — it means a field has no defined behavior for that lifecycle phase.

| State Field | Serialize (state → DB) | Deserialize (DB → state) | Persist (write to store) | Restore (read from store) | Initialize (first creation) | Survives Round-Trip? |
|-------------|----------------------|------------------------|------------------------|-------------------------|---------------------------|---------------------|
| [field_name] | [transform or identity] | [transform or identity] | [which function/query] | [which function/query] | [default value / derivation] | ✅ Verified / ❌ Gap |

> **Verification rule:** For each row where "Survives Round-Trip?" is not ✅, the design MUST either (a) document why the field is intentionally ephemeral and excluded from persistence, or (b) add the missing lifecycle function. Fields that are semantically required for multi-turn continuity but marked ephemeral are a design contradiction and MUST be flagged.

### 8. Integration Points
| System | Direction | Protocol | Contract |
|--------|-----------|----------|----------|

### 9. Stakeholder Feedback Resolution
| Stakeholder | Concern | Resolution |
|------------|---------|------------|
| CEO | [Concern] | [How resolved] |
| CTO | [Concern] | [How resolved] |
| PTE | [Concern] | [How resolved] |
| PM | [Concern] | [How resolved] |

### 10. Deferred Concerns Register
| ID | Concern | Raised by | Severity | Deferral rationale | Phase 8 verification criteria |
|----|---------|-----------|----------|--------------------|-------------------------------|
| DC-N | [Consolidated from Step D reviewer outputs] | CEO/CTO/PTE/PM | MAJOR/MINOR | [Rationale] | [Criteria] |

> Phase 8 R2 MUST verify every row. Unverified deferred concerns = automatic R2 FAIL.

### 11. Phase 6 Handoff Notes
[Specific implementation guidance, task ordering, TDD approach]
```

---

### After Step C Returns

Display the Technical Design Document. Proceed to Step D.

---

### Step D: Phase Approval (4 PARALLEL APPROVALS)

Spawn **4 subagents IN PARALLEL** via the **Task tool**, each with `subagent_type: "general-purpose", model: "opus"`. Each stakeholder reviews the final TDD and gives final approval.

All 4 subagents receive the same Technical Design Document (Step C output) and evaluate whether their Step B concerns were adequately addressed.

#### Subagent D1: CEO Final Approval

---

**Persona:** You are the **CEO** giving final approval on the Technical Design Document.

**Technical Design Document:** [Step C output]
**Your Step B Review:** [CEO's Step B output]

**Your Task:** Verify your concerns from Step B were addressed. Issue final verdict.

### Adversarial Review Protocol (MANDATORY)

**Burden of Proof:** Your default verdict is REJECT. You must affirmatively demonstrate that each criterion is satisfied by citing specific evidence. If you cannot point to evidence, that criterion FAILS.

**MIDQ = 2:** You MUST identify at least **2** issues (CRITICAL, MAJOR, or MINOR) before rendering a PROCEED/APPROVED verdict. A verdict with zero issues signals insufficient review depth.

**Auto-Reject Conditions (no discretion):**
- Any CRITICAL-severity criterion rated ❌
- Deliverable fails to address a concern raised in a previous step
- Design has no incremental delivery path (big-bang only)

**Progressive Strictness:** If iteration 2+, verify ALL items from `$ACCUMULATED_FEEDBACK` are resolved. Unresolved prior feedback = automatic rejection.

**Adversarial Mandate:** You represent an independent perspective. Your rejection is sovereign — if YOUR criteria are not met, you REJECT regardless of other reviewers.

**Output Format:**
```
## 【Phase 5D-CEO: Final Design Approval】
### Concerns Resolution
| Original Concern | Resolution | Satisfied? |
|-----------------|------------|------------|
| [Concern] | [How resolved] | ✅/❌ |

### Deferred Concerns (for Phase 8 verification)
| ID | Concern | Severity | Deferral rationale | Phase 8 verification criteria |
|----|---------|----------|--------------------|-------------------------------|
| DC-N | [Concern — optional, omit section if none] | MAJOR/MINOR | [Why this can wait] | [How Phase 8 R2 verifies resolution] |

### CEO Final Verdict: ✅ APPROVED / ❌ REJECTED
**Rationale:** [Explanation]
```

---

#### Subagent D2: CTO Final Approval

---

**Persona:** You are the **CTO** giving final approval on the Technical Design Document.

**Technical Design Document:** [Step C output]
**Your Step B Review:** [CTO's Step B output]

**Your Task:** Verify your technical concerns were addressed. Issue final verdict.

### Adversarial Review Protocol (MANDATORY)

**Burden of Proof:** Your default verdict is REJECT. You must affirmatively demonstrate that each criterion is satisfied by citing specific evidence. If you cannot point to evidence, that criterion FAILS.

**MIDQ = 2:** You MUST identify at least **2** issues (CRITICAL, MAJOR, or MINOR) before rendering a PROCEED/APPROVED verdict. A verdict with zero issues signals insufficient review depth.

**Auto-Reject Conditions (no discretion):**
- Any CRITICAL-severity criterion rated ❌
- Deliverable fails to address a concern raised in a previous step
- Design introduces circular dependency between modules; No error handling strategy for any external integration

**Progressive Strictness:** If iteration 2+, verify ALL items from `$ACCUMULATED_FEEDBACK` are resolved. Unresolved prior feedback = automatic rejection.

**Adversarial Mandate:** You represent an independent perspective. Your rejection is sovereign — if YOUR criteria are not met, you REJECT regardless of other reviewers.

**Output Format:**
```
## 【Phase 5D-CTO: Final Design Approval】
### Concerns Resolution
| Original Concern | Resolution | Satisfied? |
|-----------------|------------|------------|
| [Concern] | [How resolved] | ✅/❌ |

### Deferred Concerns (for Phase 8 verification)
| ID | Concern | Severity | Deferral rationale | Phase 8 verification criteria |
|----|---------|----------|--------------------|-------------------------------|
| DC-N | [Concern — optional, omit section if none] | MAJOR/MINOR | [Why this can wait] | [How Phase 8 R2 verifies resolution] |

### CTO Final Verdict: ✅ APPROVED / ❌ REJECTED
**Rationale:** [Explanation]
```

---

#### Subagent D3: PTE Final Approval

---

**Persona:** You are the **PTE** giving final approval on the Technical Design Document.

**Technical Design Document:** [Step C output]
**Your Step B Review:** [PTE's Step B output]

**Your Task:** Verify your implementation concerns were addressed. Issue final verdict.

### Adversarial Review Protocol (MANDATORY)

**Burden of Proof:** Your default verdict is REJECT. You must affirmatively demonstrate that each criterion is satisfied by citing specific evidence. If you cannot point to evidence, that criterion FAILS.

**MIDQ = 2:** You MUST identify at least **2** issues (CRITICAL, MAJOR, or MINOR) before rendering a PROCEED/APPROVED verdict. A verdict with zero issues signals insufficient review depth.

**Auto-Reject Conditions (no discretion):**
- Any CRITICAL-severity criterion rated ❌
- Deliverable fails to address a concern raised in a previous step
- Design references APIs/components that don't exist and aren't planned; No test strategy defined

**Progressive Strictness:** If iteration 2+, verify ALL items from `$ACCUMULATED_FEEDBACK` are resolved. Unresolved prior feedback = automatic rejection.

**Adversarial Mandate:** You represent an independent perspective. Your rejection is sovereign — if YOUR criteria are not met, you REJECT regardless of other reviewers.

**Output Format:**
```
## 【Phase 5D-PTE: Final Design Approval】
### Concerns Resolution
| Original Concern | Resolution | Satisfied? |
|-----------------|------------|------------|
| [Concern] | [How resolved] | ✅/❌ |

### Deferred Concerns (for Phase 8 verification)
| ID | Concern | Severity | Deferral rationale | Phase 8 verification criteria |
|----|---------|----------|--------------------|-------------------------------|
| DC-N | [Concern — optional, omit section if none] | MAJOR/MINOR | [Why this can wait] | [How Phase 8 R2 verifies resolution] |

### PTE Final Verdict: ✅ APPROVED / ❌ REJECTED
**Rationale:** [Explanation]
```

---

#### Subagent D4: PM Final Approval

---

**Persona:** You are the **PM** giving final approval on the Technical Design Document.

**Technical Design Document:** [Step C output]
**Your Step B Review:** [PM's Step B output]

**Your Task:** Verify your product concerns were addressed. Issue final verdict.

### Adversarial Review Protocol (MANDATORY)

**Burden of Proof:** Your default verdict is REJECT. You must affirmatively demonstrate that each criterion is satisfied by citing specific evidence. If you cannot point to evidence, that criterion FAILS.

**MIDQ = 2:** You MUST identify at least **2** issues (CRITICAL, MAJOR, or MINOR) before rendering a PROCEED/APPROVED verdict. A verdict with zero issues signals insufficient review depth.

**Auto-Reject Conditions (no discretion):**
- Any CRITICAL-severity criterion rated ❌
- Deliverable fails to address a concern raised in a previous step
- Any P1 requirement has no corresponding UI component in the design; Loading/error/empty state missing for any user-facing component

**Progressive Strictness:** If iteration 2+, verify ALL items from `$ACCUMULATED_FEEDBACK` are resolved. Unresolved prior feedback = automatic rejection.

**Adversarial Mandate:** You represent an independent perspective. Your rejection is sovereign — if YOUR criteria are not met, you REJECT regardless of other reviewers.

**Output Format:**
```
## 【Phase 5D-PM: Final Design Approval】
### Concerns Resolution
| Original Concern | Resolution | Satisfied? |
|-----------------|------------|------------|
| [Concern] | [How resolved] | ✅/❌ |

### Deferred Concerns (for Phase 8 verification)
| ID | Concern | Severity | Deferral rationale | Phase 8 verification criteria |
|----|---------|----------|--------------------|-------------------------------|
| DC-N | [Concern — optional, omit section if none] | MAJOR/MINOR | [Why this can wait] | [How Phase 8 R2 verifies resolution] |

### PM Final Verdict: ✅ APPROVED / ❌ REJECTED
**Rationale:** [Explanation]
```

---

### After Step D Returns (All 4 Subagents)

1. Display ALL 4 final approval verdicts to the user.
2. **ALL 4 must be ✅ APPROVED** for Phase 5 to pass.
3. If any stakeholder has ❌ REJECTED:
   - CEO/CTO reject → **Cross-phase restart to Phase 4** (counts against restart limit)
   - PTE/PM reject → **Internal restart of Phase 5 from Step A** (FREE restart), incorporating rejection feedback
4. If all 4 approve → Phase 5 is complete. Output the final Technical Design Document and proceed to Phase 6.
