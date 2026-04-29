# Agentic patterns

> **Deference:** This skill supplements CLAUDE.md sections on your state-machine framework, codebase-analysis pipeline, and the your domain model. On conflict, CLAUDE.md governs. This skill does NOT replace pipeline-specific architecture review (EIW Stage 0, SE Phase 5).

## Purpose

Design patterns for building stateful multi-step AI workflows in your codebase. Covers state design, graph construction, singleton management, error recovery, token accounting, and testing.

## When to use

- Building new state-machine graphs or adding nodes to existing ones
- Extending the codebase-analysis pipeline (any of the 6 modes)
- Designing multi-agent orchestration with conditional routing
- During SE Phase 5 (design) or EIW Stage 0 (architecture review) for AI workflow features

## Protocol

### 1. State design

Define the state shape before adding any nodes. Use `Annotation.Root()` with typed reducers for every field that accumulates across nodes.

```typescript
const GraphState = Annotation.Root({
  files: Annotation<string[]>({ reducer: (a, b) => [...a, ...b], default: () => [] }),
  errors: Annotation<string[]>({ reducer: (a, b) => [...a, ...b], default: () => [] }),
  usage: Annotation<UsageData>({ reducer: mergeUsage, default: () => emptyUsage() }),
});
```

- Every state field must have a typed reducer and a default factory.
- Reducers must be pure -- no mutation. State shape is the node contract; define in `*-types.ts`.

### 2. Graph structure

Define nodes as standalone async functions, then wire them with edges and conditional edges.

```typescript
const graph = new StateGraph(GraphState)
  .addNode("discover", discoverNode)
  .addNode("reconcile", reconcileNode)
  .addEdge("discover", "reconcile")
  .addConditionalEdges("reconcile", routingFn, { retry: "discover", next: "generate" });
```

- Each node does one thing (50 lines max). Conditional edges need an explicit routing function with typed return values. Keep node implementations in `*-nodes.ts`, separate from graph wiring.

### 3. Singleton pattern

Use the `getWikiSynthesisGraph(mode)` pattern for graph instance management. Graphs are expensive to compile -- compile once, reuse the instance.

```typescript
const graphCache = new Map<string, CompiledGraph>();
export function getGraph(mode: GraphMode): CompiledGraph {
  if (!graphCache.has(mode)) graphCache.set(mode, buildGraph(mode).compile());
  return graphCache.get(mode)!;
}
```

- Never compile inside a request handler. Cache key must include all config affecting topology.

### 4. Error recovery

Wrap node execution in try/catch. Store errors in state. Add conditional edges to retry transient failures.

```typescript
async function nodeWithRecovery(state: typeof GraphState.State) {
  try {
    const result = await riskyOperation(state);
    return { data: result, errors: [] };
  } catch (error: unknown) {
    return { errors: [getErrorMessage(error)] };
  }
}
```

- Distinguish transient errors (LLM timeout, rate limit) from permanent (invalid input, schema mismatch). Retry transient failures up to 2 times via conditional edges, not inline loops. Accumulate errors in state.

### 5. Token accounting

Call `extractUsage()` after every LLM invocation. Accumulate usage in state via a merge reducer.

```typescript
const response = await model.invoke(messages);
const usage = extractUsage(response);
return { usage, content: response.content };
```

- Every LLM call must track tokens -- missing tracking causes silent budget overruns. Use `mergeUsage` reducer to accumulate across nodes. Log total usage at graph completion.

### 6. Testing

Mock LLM calls with `vi.mock("../your-llm-factory")`. Test graph transitions independently from LLM output.

```typescript
vi.mock("../your-llm-factory", () => ({
  createModel: () => ({ invoke: vi.fn().mockResolvedValue({ content: mockOutput }) }),
}));
```

- Test each node in isolation with known input state. Test conditional routing with edge-case states (empty results, errors). Test the compiled graph end-to-end with fully mocked LLM responses.

## project-specific patterns

| Pattern | Location | Purpose |
|---------|----------|---------|
| 6 graph modes | `analysis-pipeline/graph.ts` | hierarchical, legacy, incremental, codewiki, graph-partitioned, domain-partitioned |
| State schemas | `pipeline-types.ts` | Annotation-based state definitions |
| Node implementations | `pipeline-nodes.ts` | Standalone async node functions |
| System prompts | `pipeline-prompts.ts` | LLM prompt templates per stage |
| LLM invocation | `your-llm-factory.ts` + `your-json-helper.ts` | `createModel()` → `model.invoke()` → `parseJsonFromLLM()` |

## Quality gates

| Gate | Criteria | Blocking |
|------|----------|----------|
| State typed | All fields use `Annotation` with typed reducer and default | Yes |
| Usage tracked | Every `model.invoke()` followed by `extractUsage()` | Yes |
| Error paths | Every node has try/catch; errors accumulate in state | Yes |
| Singleton | Graph compiled once via cache, not per-request | Yes |
| Node isolation | Each node function testable in isolation | Yes |

## Common pitfalls

- **Mutable state in graph nodes** -- reducers receive accumulated state. Mutating it corrupts prior values. Always use spread operator to produce new objects.
- **Missing usage tracking** -- forgetting `extractUsage()` causes token leaks that are invisible until billing.
- **Graph singletons with stale configuration** -- if config changes at runtime (temperature, model), the cached graph uses the old values. Include config in the cache key.
- **Untyped state reducers** -- `Annotation<any>` defeats the purpose. Type every field; let the compiler catch mismatches between nodes.
- **Inline graph compilation** -- calling `.compile()` in a request handler adds latency per request. Compile once at module load or first access.

## Related agents

- `architect` -- system design and trade-off analysis for graph architecture decisions
