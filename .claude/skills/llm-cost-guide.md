# LLM cost guide

> **Deference:** This skill supplements CLAUDE.md LLM and agentic pipeline sections. On conflict, CLAUDE.md governs.

## Purpose

Token budget management, model selection, retry strategies, and cost optimization for your project's LLM pipelines, ensuring predictable costs and efficient resource usage across codebase-analysis, blueprint generation, and chat operations.

## When to use

- Designing new your state-machine framework agents or pipeline stages
- Optimizing codebase-analysis costs for large repositories
- Selecting model tiers for different task complexities
- Monitoring and debugging token usage spikes
- Implementing retry and fallback strategies for quota errors

## Protocol

### 1. Model selection

Match model capability to task complexity:

| Task type | Model tier | your project usage |
|-----------|-----------|----------------|
| Classification, labeling, routing | Flash-lite | Domain categorization, file routing |
| Structured generation, analysis | Flash | Per-group wiki generation, impact analysis |
| Complex reasoning, design | Pro | Architecture review, blueprint synthesis |

Use the `LLM_MODEL` env var for the default model. Override per-stage only when the default is insufficient:

```typescript
const model = createModel({ temperature: 0.3 })  // uses LLM_MODEL
const classifierModel = createModel({ temperature: 0.1, model: "your-model-id" })  // explicit override
```

### 2. Token budgets

Estimate and enforce token limits before implementation:

| Pipeline stage | Input budget | Output budget | Rationale |
|----------------|-------------|---------------|-----------|
| Structural partitioning | 0 (no LLM) | 0 | Algorithm only |
| Domain discovery | ~80K per partition | ~8K per partition | File metadata + labels |
| Domain reconciliation | ~20K (label summary) | ~4K | Cross-partition merge |
| Per-group wiki generation | ~80K per group | ~16K per group | Full source analysis |
| Global assembly | ~40K (summaries) | ~8K | Merge and validate |
| DDD extraction | ~30K (assembled wiki) | ~8K | UL, BC, context map |

Set explicit `maxOutputTokens` on model invocations to prevent runaway generation:

```typescript
const model = createModel({ temperature: 0.3, maxOutputTokens: 16384 })
```

### 3. Retry strategy

Use exponential backoff with jitter for transient failures: `delay = min(1000 * 2^attempt + random(0,500), 30000)`. Max 3 retries. Only retry on quota or transient errors -- rethrow on validation or auth failures. On persistent quota errors, fall back to a smaller model tier rather than failing the pipeline.

### 4. Cost tracking

Track token usage for every LLM invocation: call `extractUsage(response)` after each `model.invoke()`, then log via the `AgentType`-based usage system. When adding new pipeline stages, register a corresponding `AgentType` value and update `AGENT_TYPE_LABELS`, `AGENT_TYPE_ICONS`, and `AGENT_TYPE_COLORS`.

### 5. Caching

Cache LLM responses for deterministic inputs to avoid redundant calls:

- **Cache key:** hash of (model name + temperature + system prompt + user prompt)
- **Cache invalidation:** when the prompt template or Zod output schema changes
- **Do not cache:** non-deterministic outputs (temperature > 0.5), user-facing chat responses, or outputs depending on real-time data
- **Storage:** in-memory for single-run pipelines, database for cross-session reuse

### 6. Output parsing

Always parse LLM output through Zod schemas:

```typescript
const result = await parseJsonFromLLM(response.content, OutputSchema, { maxRetries: 2 })
```

Budget for parsing retries in the token estimate -- each retry consumes the full input again.

## project-specific patterns

- **Default model:** `your-model-id` via `LLM_MODEL` env var. Never hardcode model names.
- **Model factory:** `createModel({ temperature: 0.3 })` from `your-llm-factory.ts`. Centralizes model instantiation.
- **JSON parsing:** `parseJsonFromLLM(content, Schema, { maxRetries: 2 })` from `your-json-helper.ts`. Handles markdown fences, partial JSON, and retry.
- **Usage extraction:** `extractUsage(response)` returns `{ inputTokens, outputTokens }`.
- **Agent types:** Defined in `AgentTypeSchema` enum in `src/lib/types/usage.ts`. Each pipeline stage maps to one agent type.
- **codebase-analysis budget:** ~80K tokens per group, modularity floor 0.2. Groups exceeding the budget are split in the repartitioning stage.

## Quality gates

| Gate | Criteria | Blocking |
|------|----------|----------|
| Token budget defined | Input/output limits set before implementation | Yes |
| Usage tracked | Every invocation logged via AgentType | Yes |
| Retry strategy | Exponential backoff with max 3 retries | Yes |
| Model env var | No hardcoded model names in production code | Yes |
| Output validated | All LLM output parsed through Zod schema | Yes |

## Common pitfalls

- **No output token limit** -- without `maxOutputTokens`, a single malformed prompt can generate unbounded output, causing cost spikes.
- **Retrying without backoff** -- hammering the API on quota errors triggers rate limiting. Always use exponential backoff with jitter.
- **Caching non-deterministic outputs** -- caching responses from high-temperature invocations returns stale creative output. Only cache deterministic (low-temperature) calls.
- **Hardcoding model names** -- always use `process.env.LLM_MODEL` or pass the model as a parameter. Hardcoded names prevent global model upgrades.
- **Ignoring parsing retry cost** -- `parseJsonFromLLM` with `maxRetries: 2` can triple the token cost for a single call. Factor retries into budget estimates.
- **Forgetting to register new agent types** -- adding a pipeline stage without updating `AgentTypeSchema`, `AGENT_TYPE_LABELS`, `AGENT_TYPE_ICONS`, and `AGENT_TYPE_COLORS` breaks the usage dashboard.
