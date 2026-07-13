# 08 — CLI Specification

The loomstack CLI is the primary agent interface.

Every command that matters to a coding agent must support structured JSON output.

## Binary name

```bash
loomstack
```

## Global flags

```txt
--json      emit machine-readable JSON
--cwd       run against a specific project path
--quiet     reduce human output
--verbose   include extra diagnostics
```

## Command list

```bash
loomstack create app <name>
loomstack create feature <name>
loomstack generate
loomstack context
loomstack context feature <name>
loomstack graph
loomstack affected <file>
loomstack verify
loomstack verify feature <name>
loomstack explain <error-code>
loomstack doctor
```

## `loomstack create app <name>`

Creates a new loomstack app from the default template.

Example:

```bash
loomstack create app manager-crm
```

Expected output:

```txt
Created loomstack app: manager-crm
Next steps:
  cd manager-crm
  pnpm install
  pnpm dev
```

JSON output:

```json
{
  "ok": true,
  "appName": "manager-crm",
  "createdFiles": ["package.json", "loomstack.config.ts"],
  "nextCommands": ["cd manager-crm", "pnpm install", "pnpm dev"]
}
```

## `loomstack create feature <name>`

Creates a canonical feature folder.

Example:

```bash
loomstack create feature people
```

Generated files:

```txt
features/people/feature.yaml
features/people/AGENTS.md
features/people/model.schema.ts
features/people/permissions.policy.ts
features/people/actions/.gitkeep
features/people/queries/.gitkeep
features/people/ui/.gitkeep
features/people/tests/.gitkeep
```

JSON output:

```json
{
  "ok": true,
  "feature": "people",
  "createdFiles": [
    "features/people/feature.yaml",
    "features/people/AGENTS.md"
  ]
}
```

## `loomstack generate`

Regenerates all derived files.

Should generate:

- React routes
- Koa routes
- action registry
- query registry
- schema registry
- `.loomstack/context.json`
- `.loomstack/graph.json`
- `.loomstack/generated-files.json`

## `loomstack context`

Prints project-level context for agents.

Human output should be readable. JSON output should be structured.

JSON shape:

```json
{
  "project": {
    "name": "manager-crm",
    "frontend": "react",
    "backend": "koa",
    "database": "postgres"
  },
  "commands": {
    "dev": "pnpm dev",
    "verify": "pnpm loomstack verify",
    "test": "pnpm test"
  },
  "features": ["people", "projects", "commitments"],
  "rules": [
    "Business logic lives in features/*/actions or features/*/queries.",
    "React views may not import database code."
  ]
}
```

## `loomstack context feature <name>`

Prints feature-specific context.

JSON shape:

```json
{
  "feature": "people",
  "manifest": "features/people/feature.yaml",
  "entities": ["Person"],
  "actions": [
    {
      "name": "createPerson",
      "file": "features/people/actions/create-person.action.ts"
    }
  ],
  "queries": [
    {
      "name": "listPeople",
      "file": "features/people/queries/list-people.query.ts"
    }
  ],
  "views": [
    {
      "name": "PeopleListView",
      "file": "features/people/ui/people-list.view.tsx",
      "route": "/people"
    }
  ],
  "tests": ["features/people/tests/create-person.test.ts"],
  "rules": ["Do not access db from UI files."]
}
```

## `loomstack graph`

Prints the feature graph and dependency graph.

For v0.1, feature graph can be simple:

```json
{
  "features": [
    {
      "id": "people",
      "entities": ["Person"],
      "actions": ["createPerson"],
      "queries": ["listPeople"],
      "routes": ["/people"]
    }
  ],
  "dependencies": []
}
```

## `loomstack affected <file>`

Returns files likely affected by changes to a given file.

Example:

```bash
loomstack affected features/people/model.schema.ts --json
```

Output:

```json
{
  "file": "features/people/model.schema.ts",
  "feature": "people",
  "affected": [
    "features/people/feature.yaml",
    "features/people/actions/create-person.action.ts",
    "features/people/actions/update-person.action.ts",
    "features/people/queries/list-people.query.ts",
    "features/people/ui/person-form.view.tsx",
    "features/people/tests/create-person.test.ts"
  ],
  "recommendedVerification": "pnpm loomstack verify feature people"
}
```

## `loomstack verify`

Runs framework verification.

Must check:

- manifests
- file structure
- generated file freshness
- forbidden imports
- route consistency
- registry consistency
- duplicate names

JSON output:

```json
{
  "ok": false,
  "errors": [
    {
      "code": "loomstack2001",
      "severity": "error",
      "message": "Database imports are forbidden in React view files.",
      "file": "features/people/ui/people-list.view.tsx",
      "repair": "Move database access into a query file."
    }
  ]
}
```

## `loomstack verify feature <name>`

Runs verification scoped to one feature.

This is important for agent loops.

## `loomstack explain <error-code>`

Returns documentation for an error.

Example:

```bash
loomstack explain loomstack2001 --json
```

Output:

```json
{
  "code": "loomstack2001",
  "title": "Forbidden database import in UI file",
  "why": "React UI must not access persistence directly.",
  "repair": "Move database access into a query file and call the query from the view.",
  "docs": "docs/10-verifier-and-error-system.md"
}
```

## `loomstack doctor`

Checks project environment:

- Node version
- pnpm availability
- required packages installed
- TypeScript config exists
- app structure exists

## Implementation recommendations

Use a CLI library such as `commander` or `cac`.

Keep command execution functions testable without invoking a real shell.

Suggested command handler shape:

```ts
export async function runVerifyCommand(options): Promise<CommandResult> {}
```

Then the CLI renderer can decide human vs JSON output.
