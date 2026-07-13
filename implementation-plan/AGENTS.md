# AGENTS.md — loomstack Implementation Instructions

This repository is the implementation plan for **loomstack: Agent-Operable Fullstack Framework**.

loomstack is not a general-purpose flexible framework. It is an opinionated TypeScript fullstack framework optimized so coding agents can safely understand, modify, verify, and extend applications.

## Mandatory implementation principles

1. Prefer explicit contracts over inference.
2. Prefer one canonical pattern over multiple valid patterns.
3. Prefer generated files over manual wiring.
4. Prefer structured machine-readable output over pretty-only output.
5. Prefer framework-enforced rules over documentation-only rules.
6. Prefer repairable errors over generic errors.
7. Prefer vertical slices over large untestable abstractions.

## Golden path stack

Use this stack unless a task explicitly changes the implementation plan:

- TypeScript
- pnpm workspaces
- React + Vite frontend adapter
- Koa backend adapter
- PostgreSQL data adapter for v0.1
- Vitest
- tsx or tsup for local execution/builds

## Repository package expectations

The implementation should eventually create this monorepo shape:

```txt
packages/
  cli/
  core/
  runtime/
  verifier/
  generator/
  react-adapter/
  koa-adapter/
  postgres-adapter/
  create-loomstack-app/
examples/
  manager-crm/
templates/
  default-app/
```

## Hard rules

- Do not implement product behavior inside generated React route files.
- Do not implement product behavior inside generated Koa route files.
- Do not allow database access from React view files.
- Do not allow raw `fetch` from feature UI files.
- Do not support multiple frontend/backend frameworks in v0.1.
- Do not introduce plugin architecture in v0.1.
- Do not make generated files hand-edited.
- Do not silently ignore invalid feature manifests.
- Do not return unstructured verification errors.

## Required command behavior

Every CLI command that is useful to an agent must support `--json`.

Important commands:

```bash
loomstack create app <name>
loomstack create feature <name>
loomstack context
loomstack context feature <name>
loomstack graph
loomstack affected <file>
loomstack verify
loomstack verify feature <name>
loomstack explain <error-code>
```

## Testing expectations

Every package must include tests for public behavior.

Minimum v0.1 test categories:

- manifest parsing
- feature graph generation
- code generation
- generated file markers
- verifier rules
- structured error output
- action/query runtime
- Koa adapter route registration
- React adapter route generation
- CLI JSON output

## Output style for implementation agents

When completing a task, report:

1. What changed.
2. Files modified.
3. Tests added or updated.
4. Commands run.
5. Any remaining gaps.

Do not claim completion unless tests pass or explicitly state why they could not be run.
