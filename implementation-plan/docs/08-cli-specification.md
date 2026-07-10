# 08 — CLI Specification

The loom CLI is the primary agent interface.

Every command that matters to a coding agent must support structured JSON output.

## Binary name

```bash
loom
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
loom create app <name>
loom create feature <name>
loom generate
loom context
loom context feature <name>
loom graph
loom affected <file>
loom verify
loom verify feature <name>
loom explain <error-code>
loom doctor
```

## `loom create app <name>`

Creates a new loom app from the default template.

Example:

```bash
loom create app manager-crm
```

Expected output:

```txt
Created loom app: manager-crm
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
  "createdFiles": ["package.json", "loom.config.ts"],
  "nextCommands": ["cd manager-crm", "pnpm install", "pnpm dev"]
}
```

## `loom create feature <name>`

Creates a canonical feature folder.

Example:

```bash
loom create feature people
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

## `loom generate`

Regenerates all derived files.

Should generate:

- React routes
- Koa routes
- action registry
- query registry
- schema registry
- `.loom/context.json`
- `.loom/graph.json`
- `.loom/generated-files.json`

## `loom context`

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
    "verify": "pnpm loom verify",
    "test": "pnpm test"
  },
  "features": ["people", "projects", "commitments"],
  "rules": [
    "Business logic lives in features/*/actions or features/*/queries.",
    "React views may not import database code."
  ]
}
```

## `loom context feature <name>`

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

## `loom graph`

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

## `loom affected <file>`

Returns files likely affected by changes to a given file.

Example:

```bash
loom affected features/people/model.schema.ts --json
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
  "recommendedVerification": "pnpm loom verify feature people"
}
```

## `loom verify`

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
      "code": "loom2001",
      "severity": "error",
      "message": "Database imports are forbidden in React view files.",
      "file": "features/people/ui/people-list.view.tsx",
      "repair": "Move database access into a query file."
    }
  ]
}
```

## `loom verify feature <name>`

Runs verification scoped to one feature.

This is important for agent loops.

## `loom explain <error-code>`

Returns documentation for an error.

Example:

```bash
loom explain loom2001 --json
```

Output:

```json
{
  "code": "loom2001",
  "title": "Forbidden database import in UI file",
  "why": "React UI must not access persistence directly.",
  "repair": "Move database access into a query file and call the query from the view.",
  "docs": "docs/10-verifier-and-error-system.md"
}
```

## `loom doctor`

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
