# 14 — v0.1 Acceptance Criteria

loomstack v0.1 is complete when it proves the core thesis: a fullstack app can be made more reliable for coding agents through explicit contracts, generated wiring, and structured verification.

## Required CLI commands

The following must work:

```bash
loomstack create app <name>
loomstack create feature <name>
loomstack generate
loomstack verify
loomstack verify --json
loomstack verify feature <name> --json
loomstack context --json
loomstack context feature <name> --json
loomstack graph --json
loomstack affected <file> --json
loomstack explain <error-code> --json
```

## Required generated app stack

Generated app uses:

- TypeScript
- pnpm
- React + Vite
- Koa
- PostgreSQL or in-memory PostgreSQL-compatible adapter
- Vitest

## Required generated structure

Generated app includes:

```txt
apps/web
apps/api
features
shared/generated
.loomstack
AGENTS.md
CLAUDE.md
loomstack.config.ts
```

## Required feature support

loomstack must support a feature with:

- manifest
- entity schema
- at least one action
- at least one query
- at least one route-level React view
- generated Koa transport
- generated React route
- generated client
- feature tests

## Required verifier rules

Verifier must detect at least:

1. missing loomstack config
2. invalid feature manifest
3. feature ID/folder mismatch
4. duplicate route paths
5. manifest action missing implementation
6. implementation action missing from manifest
7. manifest query missing implementation
8. database import in React UI
9. raw fetch in React UI
10. stale generated file
11. manually modified generated file

## Required structured errors

Every verifier error must include:

- code
- severity
- message
- file when applicable
- repair hint

## Required context files

Generated app must contain:

```txt
.loomstack/context.json
.loomstack/graph.json
.loomstack/commands.json
.loomstack/errors.json
```

These must be valid JSON and marked as generated.

## Required agent docs

Generated app must contain:

```txt
AGENTS.md
CLAUDE.md
features/*/AGENTS.md
```

These should explain:

- stack
- architecture
- hard rules
- feature structure
- common workflows
- verification commands

## Required example app

Create `examples/manager-crm` with these features:

- people
- projects
- commitments

The app should demonstrate:

- entity schemas
- actions
- queries
- React views
- Koa execution
- generated routes
- verifier success

## Required tests

Minimum test categories:

- core types/errors
- manifest parsing
- feature scanning
- generator snapshots
- runtime action/query execution
- Koa adapter route execution
- React route generation
- verifier rules
- CLI JSON output

## Required benchmark prompts

Include benchmark prompts for at least five realistic agent tasks.

Example:

```txt
Add due dates to commitments and show overdue commitments first.
```

For each benchmark prompt, document expected affected files.

## Definition of done

v0.1 is done when this works from a clean environment:

```bash
pnpm install
pnpm test
pnpm build
pnpm loomstack create app demo-app
cd demo-app
pnpm install
pnpm loomstack create feature people
pnpm loomstack generate
pnpm loomstack verify --json
```

And the final verification result is:

```json
{
  "ok": true,
  "errors": [],
  "warnings": []
}
```

## Explicit non-goals

Do not block v0.1 on:

- production-ready auth
- production migrations
- SSR
- deployment adapters
- MCP server
- plugin system
- alternative frontend adapters
- alternative backend adapters
- public REST API generation
- sophisticated UI components
- database relation modeling beyond basic needs
