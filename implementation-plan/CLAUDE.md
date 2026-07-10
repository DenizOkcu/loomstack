# CLAUDE.md — loom Agent Memory

loom means **Agent-Operable Fullstack Framework**.

The framework's highest priority is reducing ambiguity for coding agents. Optimize for deterministic project structure, explicit contracts, generated wiring, structured verification, and repairable errors.

## Mental model

loom app code has three zones:

```txt
React = presentation
Koa = transport/runtime
features/* = product behavior
```

Agents should usually edit `features/*`, not generated app wiring.

## Canonical feature layout

```txt
features/<feature-id>/
  feature.yaml
  AGENTS.md
  model.schema.ts
  permissions.policy.ts
  actions/*.action.ts
  queries/*.query.ts
  ui/*.view.tsx
  tests/*.test.ts
```

## Core invariant

Feature manifests, schemas, actions, queries, policies, and views are the source of truth. React routes and Koa routes are generated.

## v0.1 non-goals

- no Next.js adapter
- no Vue/Svelte support
- no Postgres support unless SQLite is done
- no MCP server until CLI context works
- no public REST API until action/query RPC works
- no plugin system
- no visual UI builder

## Preferred implementation style

- small packages
- explicit types
- no clever dynamic magic
- boring TypeScript
- stable generated output
- deterministic sorting
- snapshot tests for generated files
- strict errors with codes

## Error design

All framework errors must include:

- stable error code
- severity
- human message
- agent repair hint
- file path if applicable
- related files if known
- docs reference if applicable

Example:

```json
{
  "code": "loom2001",
  "severity": "error",
  "message": "Database imports are forbidden in React view files.",
  "file": "features/people/ui/people-list.view.tsx",
  "repair": "Move database access into a query file and call the query from the view.",
  "docs": "docs/10-verifier-and-error-system.md"
}
```
