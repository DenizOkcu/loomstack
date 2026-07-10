# 10 — Verifier and Error System

The verifier is the enforcement layer that makes loom agent-operable.

Documentation alone is insufficient. loom rules must be machine-checkable.

## Core rule

```txt
Every important convention should either be generated or verified.
```

## Verification command

```bash
loom verify
loom verify --json
loom verify feature people
loom verify feature people --json
```

## Verifier output shape

```ts
export interface VerifyResult {
  ok: boolean
  errors: FrameworkError[]
  warnings: FrameworkError[]
}

export interface FrameworkError {
  code: string
  severity: "error" | "warning"
  message: string
  file?: string
  location?: {
    line?: number
    column?: number
  }
  repair: string
  relatedFiles?: string[]
  docs?: string
}
```

## Error code ranges

Use stable error ranges:

```txt
loom1xxx  manifest and feature contract errors
loom2xxx  architecture boundary errors
loom3xxx  runtime contract errors
loom4xxx  generation errors
loom5xxx  CLI/project configuration errors
loom6xxx  database/schema generation errors
```

## Required v0.1 errors

### `loom1001` — Feature ID does not match folder name

Occurs when `features/people/feature.yaml` contains `id: contacts`.

Repair:

> Rename the folder or update `feature.yaml` so the feature ID matches the folder name.

### `loom1002` — Missing required feature manifest field

Repair:

> Add the missing field to `feature.yaml`.

### `loom1003` — Manifest action is not exported

Repair:

> Create the action file or update the manifest action name.

### `loom1004` — Exported action missing from manifest

Repair:

> Add the action name to `feature.yaml` or remove the action file.

### `loom1005` — Duplicate route path

Repair:

> Change one route path so every route path is globally unique.

### `loom2001` — Forbidden database import in UI file

Repair:

> Move database access into `queries/*.query.ts` or `actions/*.action.ts`.

### `loom2002` — Forbidden raw fetch in UI file

Repair:

> Use the generated loom action/query client.

### `loom2003` — Koa import in feature logic

Repair:

> Remove Koa dependency from feature code and use loom request context.

### `loom4001` — Generated file was manually modified

Repair:

> Run `loom generate` or move custom logic out of the generated file.

### `loom4002` — Generated file is stale

Repair:

> Run `loom generate`.

### `loom5001` — Missing loom config

Repair:

> Create `loom.config.ts` or run inside an loom project.

## Rule categories

### Manifest rules

- validate YAML parse
- validate required fields
- validate feature ID matches folder
- validate route uniqueness
- validate route views exist
- validate actions/queries exist

### File structure rules

- enforce feature folder layout
- enforce file naming
- detect unexpected route-level files

### Import boundary rules

Forbidden:

```txt
features/*/ui/**/* -> db imports
features/*/ui/**/* -> Koa imports
features/*/actions/**/* -> Koa imports
features/*/queries/**/* -> Koa imports
apps/api/src/routes.generated.ts -> manual changes
```

### Generated freshness rules

- generated files contain marker
- generated file hashes match manifest
- generated files are in expected locations

### Registry rules

- action registry contains all manifest actions
- query registry contains all manifest queries
- schema registry contains all manifest entities

## Implementation strategy

Use static file scanning first.

v0.1 can avoid full TypeScript AST if needed, but AST is preferable for import analysis.

Recommended libraries:

- TypeScript compiler API or `ts-morph` for import scanning
- YAML parser for manifests
- Node crypto for hashes
- Vitest for tests

## Agent repair optimization

Every error should be actionable without reading the full docs.

Bad:

```txt
Invalid architecture.
```

Good:

```txt
loom2001: Database imports are forbidden in React view files.
File: features/people/ui/people-list.view.tsx
Invalid import: @/db
Repair: Move database access into features/people/queries/list-people.query.ts and call that query from the view.
```

## JSON output requirement

Agents should never need to parse pretty terminal text.

`loom verify --json` must emit valid JSON only.

## Non-goals for v0.1

- proving all business logic correctness
- deep semantic validation of all TypeScript code
- automatic repairs
- lint replacement
- security scanner
