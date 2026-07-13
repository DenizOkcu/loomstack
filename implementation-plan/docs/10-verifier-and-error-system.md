# 10 — Verifier and Error System

The verifier is the enforcement layer that makes loomstack agent-operable.

Documentation alone is insufficient. loomstack rules must be machine-checkable.

## Core rule

```txt
Every important convention should either be generated or verified.
```

## Verification command

```bash
loomstack verify
loomstack verify --json
loomstack verify feature people
loomstack verify feature people --json
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
loomstack1xxx  manifest and feature contract errors
loomstack2xxx  architecture boundary errors
loomstack3xxx  runtime contract errors
loomstack4xxx  generation errors
loomstack5xxx  CLI/project configuration errors
loomstack6xxx  database/schema generation errors
```

## Required v0.1 errors

### `loomstack1001` — Feature ID does not match folder name

Occurs when `features/people/feature.yaml` contains `id: contacts`.

Repair:

> Rename the folder or update `feature.yaml` so the feature ID matches the folder name.

### `loomstack1002` — Missing required feature manifest field

Repair:

> Add the missing field to `feature.yaml`.

### `loomstack1003` — Manifest action is not exported

Repair:

> Create the action file or update the manifest action name.

### `loomstack1004` — Exported action missing from manifest

Repair:

> Add the action name to `feature.yaml` or remove the action file.

### `loomstack1005` — Duplicate route path

Repair:

> Change one route path so every route path is globally unique.

### `loomstack2001` — Forbidden database import in UI file

Repair:

> Move database access into `queries/*.query.ts` or `actions/*.action.ts`.

### `loomstack2002` — Forbidden raw fetch in UI file

Repair:

> Use the generated loomstack action/query client.

### `loomstack2003` — Koa import in feature logic

Repair:

> Remove Koa dependency from feature code and use loomstack request context.

### `loomstack4001` — Generated file was manually modified

Repair:

> Run `loomstack generate` or move custom logic out of the generated file.

### `loomstack4002` — Generated file is stale

Repair:

> Run `loomstack generate`.

### `loomstack5001` — Missing loomstack config

Repair:

> Create `loomstack.config.ts` or run inside an loomstack project.

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
loomstack2001: Database imports are forbidden in React view files.
File: features/people/ui/people-list.view.tsx
Invalid import: @/db
Repair: Move database access into features/people/queries/list-people.query.ts and call that query from the view.
```

## JSON output requirement

Agents should never need to parse pretty terminal text.

`loomstack verify --json` must emit valid JSON only.

## Non-goals for v0.1

- proving all business logic correctness
- deep semantic validation of all TypeScript code
- automatic repairs
- lint replacement
- security scanner
