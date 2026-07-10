# loom — Agent-Operable Fullstack Framework Implementation Plan

loom is an **Agent-Operable Fullstack Framework**: a TypeScript fullstack framework optimized for coding-agent reliability instead of human flexibility.

The v0.1 golden path uses:

- **Frontend:** React + Vite
- **Backend:** Koa
- **Language:** TypeScript
- **Package manager:** pnpm
- **Database:** SQLite first
- **Testing:** Vitest first, Playwright later
- **Architecture:** feature-sliced, schema-first, action/query boundary
- **Agent interface:** CLI-first, MCP later

## Product thesis

Modern fullstack frameworks are flexible but ambiguous. Coding agents lose time and accuracy because they must infer where code belongs, which patterns are valid, which files are related, and how to repair errors.

loom makes applications **operable by agents** by making architecture explicit, queryable, enforceable, and repairable.

## Core promise

> Less ambiguity. Fewer wrong edits. Faster agent iteration.

A coding agent working in an loom project should always know:

- where code belongs
- what files are related
- what patterns are allowed
- what commands to run
- what errors mean
- what tests prove the change
- what context is needed before editing

## Document map

Read these files in order when implementing:

1. [`docs/00-product-vision.md`](docs/00-product-vision.md)
2. [`docs/01-architecture-overview.md`](docs/01-architecture-overview.md)
3. [`docs/02-repository-structure.md`](docs/02-repository-structure.md)
4. [`docs/03-feature-contract.md`](docs/03-feature-contract.md)
5. [`docs/04-schema-and-domain-layer.md`](docs/04-schema-and-domain-layer.md)
6. [`docs/05-action-query-runtime.md`](docs/05-action-query-runtime.md)
7. [`docs/06-react-frontend-adapter.md`](docs/06-react-frontend-adapter.md)
8. [`docs/07-koa-backend-adapter.md`](docs/07-koa-backend-adapter.md)
9. [`docs/08-cli-specification.md`](docs/08-cli-specification.md)
10. [`docs/09-code-generation.md`](docs/09-code-generation.md)
11. [`docs/10-verifier-and-error-system.md`](docs/10-verifier-and-error-system.md)
12. [`docs/11-agent-context-system.md`](docs/11-agent-context-system.md)
13. [`docs/12-testing-and-benchmarking.md`](docs/12-testing-and-benchmarking.md)
14. [`docs/13-implementation-phases.md`](docs/13-implementation-phases.md)
15. [`docs/14-v0-1-acceptance-criteria.md`](docs/14-v0-1-acceptance-criteria.md)

Agent-specific prompt files:

- [`AGENTS.md`](AGENTS.md)
- [`CLAUDE.md`](CLAUDE.md)
- [`prompts/agent-implementation-prompt.md`](prompts/agent-implementation-prompt.md)
- [`prompts/agent-code-review-prompt.md`](prompts/agent-code-review-prompt.md)

Architecture decisions:

- [`adr/0001-react-koa-golden-path.md`](adr/0001-react-koa-golden-path.md)
- [`adr/0002-feature-sliced-source-of-truth.md`](adr/0002-feature-sliced-source-of-truth.md)
- [`adr/0003-action-query-rpc-over-rest.md`](adr/0003-action-query-rpc-over-rest.md)

## Implementation rules for agents

Before editing code, an implementation agent must:

1. Read `AGENTS.md`.
2. Read `docs/13-implementation-phases.md`.
3. Pick the next incomplete phase.
4. Implement one vertical slice at a time.
5. Add tests for all framework behavior.
6. Run the verification command after every material change.
7. Update docs when a contract changes.

## v0.1 north-star demo

A user asks a coding agent:

> Add a due date field to commitments and show overdue commitments first.

In an loom app, the agent should need to inspect only the relevant feature context and should modify a predictable set of files:

```txt
features/commitments/feature.yaml
features/commitments/model.schema.ts
features/commitments/actions/create-commitment.action.ts
features/commitments/actions/update-commitment.action.ts
features/commitments/queries/list-commitments.query.ts
features/commitments/ui/commitments-list.view.tsx
features/commitments/tests/list-commitments.test.ts
```

The framework should guide the agent through:

```bash
loom context feature commitments
loom affected features/commitments/model.schema.ts
loom verify feature commitments --json
```

That is the product.
