# 13 — Implementation Phases

This document is the primary execution plan for implementation agents.

Implement phases in order. Each phase should leave the repository in a working state.

## Phase 0 — Repository bootstrap

### Goal

Create the framework monorepo skeleton.

### Tasks

- create pnpm workspace
- create base TypeScript config
- create package folders
- create root test config
- add lint/format if desired, but do not over-invest
- add initial `AGENTS.md` and `CLAUDE.md`

### Packages to create

```txt
packages/core
packages/runtime
packages/cli
packages/generator
packages/verifier
packages/react-adapter
packages/koa-adapter
packages/sqlite-adapter
packages/create-loom-app
```

### Acceptance criteria

- `pnpm install` succeeds
- `pnpm test` succeeds with placeholder tests
- all packages build or typecheck

## Phase 1 — Core types and errors

### Goal

Implement shared types and the framework error model.

### Tasks

- define `FeatureManifest`
- define `FeatureRoute`
- define `loomProjectConfig`
- define `FrameworkError`
- define `CommandResult`
- define error code registry
- implement JSON-safe error serialization

### Acceptance criteria

- core package exports public types
- tests cover error serialization
- error code docs exist in code or fixture

## Phase 2 — Manifest parser and project scanner

### Goal

Scan an loom project and parse feature manifests.

### Tasks

- implement project root discovery
- load `loom.config.ts` or equivalent config
- scan `features/*/feature.yaml`
- parse YAML
- validate required fields
- validate feature ID matches folder
- discover action/query/view/test files
- build initial feature graph

### Acceptance criteria

- valid fixture project scans successfully
- invalid manifest returns structured errors
- duplicate route path returns structured error

## Phase 3 — Runtime primitives

### Goal

Implement the public app authoring API.

### Tasks

- implement schema helpers backed by Zod or equivalent
- implement `entity()`
- implement `schema()`
- implement `action()`
- implement `query()`
- implement `policy()` minimal helper
- implement `view()` minimal helper
- implement `executeAction()`
- implement `executeQuery()`

### Acceptance criteria

- action validates input
- action validates output
- query validates output
- auth requirement placeholder works
- tests demonstrate runtime behavior

## Phase 4 — Feature scaffolding generator

### Goal

Implement `loom create feature <name>`.

### Tasks

- generate canonical feature folder
- generate starter `feature.yaml`
- generate feature-local `AGENTS.md`
- generate placeholder schema/policy files
- create action/query/ui/test folders
- prevent overwriting existing feature unless forced

### Acceptance criteria

- CLI creates feature files
- generated feature passes manifest validation
- tests cover file generation

## Phase 5 — App generator

### Goal

Implement `loom create app <name>`.

### Tasks

- create app template
- generate package files
- generate apps/web skeleton
- generate apps/api skeleton
- generate root `loom.config.ts`
- generate top-level `AGENTS.md` and `CLAUDE.md`
- create empty `features` folder
- create `.loom` folder

### Acceptance criteria

- created app installs successfully
- created app has expected files
- created app can run `loom verify`

## Phase 6 — Registry generation

### Goal

Generate action/query/schema/feature registries.

### Tasks

- generate `shared/generated/feature-registry.generated.ts`
- generate `shared/generated/action-registry.generated.ts`
- generate `shared/generated/query-registry.generated.ts`
- generate `shared/generated/schema-registry.generated.ts`
- add generated file markers
- add deterministic sorting
- add snapshot tests

### Acceptance criteria

- registry generation is deterministic
- snapshots pass
- generated registries compile in fixture app

## Phase 7 — React route and client generation

### Goal

Generate React route wiring and typed API client.

### Tasks

- generate `apps/web/src/routes.generated.tsx`
- generate `apps/web/src/api-client.generated.ts`
- implement minimal React adapter helpers
- forbid raw fetch in feature UI through verifier later

### Acceptance criteria

- generated routes match feature manifests
- generated client exposes actions/queries
- snapshots pass

## Phase 8 — Koa route generation

### Goal

Generate Koa transport routes for actions and queries.

### Tasks

- implement Koa adapter route registration helper
- generate `apps/api/src/routes.generated.ts`
- implement structured 404 for unknown action/query
- implement action/query execution over HTTP
- implement request context creation template

### Acceptance criteria

- Koa route generation snapshot passes
- integration test can execute an action/query through generated route
- unknown action/query returns structured error

## Phase 9 — Verifier v0.1

### Goal

Implement `loom verify` with core rules.

### Tasks

- verify project config exists
- verify manifests
- verify feature ID/folder match
- verify duplicate route paths
- verify declared actions/queries/views exist
- verify generated files have markers
- verify generated file hashes
- verify forbidden imports
- verify raw fetch in UI
- support `--json`

### Acceptance criteria

- verifier catches required v0.1 errors
- verifier returns stable JSON
- CLI exits non-zero on errors
- tests cover each rule

## Phase 10 — Context system

### Goal

Implement `loom context`, `loom graph`, `loom affected`, and generated `.loom/*.json`.

### Tasks

- generate `.loom/context.json`
- generate `.loom/graph.json`
- generate `.loom/commands.json`
- generate `.loom/errors.json`
- implement CLI context output
- implement feature-scoped context output
- implement basic affected-file logic

### Acceptance criteria

- agent can run `loom context feature people --json`
- context matches actual feature files
- stale context is detected by verifier

## Phase 11 — Example app: Manager CRM

### Goal

Create a realistic demo app.

### Features

- people
- projects
- commitments

### Required flows

- create/list people
- create/list projects
- create/list commitments
- show commitments due soon

### Acceptance criteria

- app verifies cleanly
- app demonstrates schema/action/query/view patterns
- benchmark tasks can be run against it

## Phase 12 — Benchmark harness documentation

### Goal

Prove agent-operability.

### Tasks

- create benchmark prompts
- document how to run benchmark manually
- optionally add script to collect file diffs and test results
- compare with plain React/Koa app later

### Acceptance criteria

- benchmark prompts exist
- expected edit paths are documented
- results can be recorded consistently

## Phase 13 — Polish and release v0.1

### Goal

Make the project usable by external agents and early users.

### Tasks

- improve README
- add quickstart
- add CLI help text
- add examples
- add docs for all commands
- ensure package names are consistent
- run clean install test
- tag v0.1

### Acceptance criteria

- a new user can create an app from README instructions
- generated app can create a feature
- generated app can verify
- known limitations are documented

## Implementation ordering note

Prioritize the agent context and verifier earlier than typical frameworks would. They are not extras. They are the product.
