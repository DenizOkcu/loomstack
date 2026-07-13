# loomstack CLI contracts

## Global options

`--json` emits one valid JSON document and no decorative output. `--cwd <path>` selects a project or creation directory. `--quiet` suppresses successful human output. `--verbose` is reserved for diagnostics.

Failures return a non-zero exit code. Every framework error contains `code`, `severity`, `message`, and `repair`; file-related errors also contain `file`.

## Creation

### `loomstack create app <name>`

Creates a kebab-case app without overwriting an existing directory. JSON fields: `ok`, `appName`, `root`, `createdFiles`, `nextCommands`.

### `loomstack create feature <name>`

Creates `feature.yaml`, local `AGENTS.md`, schema/policy files, and action/query/UI/test directories. It refreshes generated output. JSON fields: `ok`, `feature`, `createdFiles`.

## Generation and verification

### `loomstack generate`

Scans all features and deterministically regenerates React routes, API client, Koa routes, four registries, four context documents, and the generated-file hash manifest.

### `loomstack verify [feature <name>]`

Checks config, YAML shape, feature ownership, route uniqueness, manifest/implementation consistency, entity/view resolution, duplicate operation names, forbidden imports, raw fetch, generated markers, hashes, and freshness.

JSON shape:

```json
{ "ok": true, "errors": [], "warnings": [] }
```

Use feature scope for repair loops; use project scope before completion.

## Context

### `loomstack context`

Returns stack, commands, feature IDs, and global architectural rules.

### `loomstack context feature <name>`

Returns the manifest, description, entities, named action/query/view files, tests, and scoped rules. This is the first command an agent should run before editing a feature.

### `loomstack graph`

Returns deterministic feature nodes and explicit dependencies. Cross-feature dependencies are empty in v0.1 because direct cross-feature imports are not part of the golden path.

### `loomstack affected <file>`

Returns the owning feature, all likely related authored contracts, and the recommended verification command. Files outside a feature conservatively affect all manifests.

### `loomstack explain <code>`

Returns the stable error title, reason, repair, and documentation reference. Code ranges are: `loomstack1xxx` manifests, `loomstack2xxx` boundaries, `loomstack3xxx` runtime, `loomstack4xxx` generation, `loomstack5xxx` project/CLI, and `loomstack6xxx` PostgreSQL schema concerns.

## Environment

### `loomstack doctor`

Checks Node 22+, pnpm, `loomstack.config.ts`, and `tsconfig.json`. It does not modify the environment.
