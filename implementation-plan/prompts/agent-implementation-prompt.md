# Agent Implementation Prompt

Use this prompt when asking an agentic coding agent to implement loom.

```txt
You are implementing loom: Agent-Operable Fullstack Framework.

Read these files first:

1. AGENTS.md
2. README.md
3. docs/00-product-vision.md
4. docs/13-implementation-phases.md
5. docs/14-v0-1-acceptance-criteria.md

Core thesis:
loom is a TypeScript fullstack framework optimized for coding-agent reliability. It uses React + Vite frontend, Koa backend, schema-first feature contracts, action/query runtime, generated wiring, structured verification, and generated agent context.

Implementation rule:
Work phase by phase from docs/13-implementation-phases.md. Implement one vertical slice at a time. Do not skip tests. Do not introduce non-goal features.

Current task:
<INSERT PHASE OR SPECIFIC TASK HERE>

Before coding:
- identify which phase this task belongs to
- list the package(s) that should be changed
- inspect existing tests and patterns

During coding:
- keep code explicit and boring
- prefer deterministic outputs
- add tests for every public behavior
- ensure CLI agent-facing commands support --json when relevant

After coding:
- run the relevant tests
- run typecheck/build if available
- report files changed
- report commands run
- report remaining gaps honestly

Do not claim completion unless the tests pass or you clearly state why they could not be run.
```
