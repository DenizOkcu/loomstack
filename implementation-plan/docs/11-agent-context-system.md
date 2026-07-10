# 11 — Agent Context System

The agent context system is a core differentiator of loom.

loom apps should be inspectable by coding agents without requiring blind repository exploration.

## Goals

- expose project structure in machine-readable form
- expose feature-specific edit paths
- expose commands and verification steps
- expose architecture rules
- keep generated context in sync with actual app state
- reduce token usage by enabling scoped context retrieval

## Context surfaces

loom should generate or maintain:

```txt
AGENTS.md
CLAUDE.md
features/*/AGENTS.md
.loom/context.json
.loom/graph.json
.loom/commands.json
.loom/errors.json
```

## `AGENTS.md`

Top-level agent instruction file.

Generated on app creation. Later versions may update managed sections.

Must include:

- stack
- architecture
- hard rules
- common workflows
- commands
- generated file warning
- feature structure

## `CLAUDE.md`

Claude-specific memory file.

Should largely mirror `AGENTS.md`, but can be shorter and optimized for Claude Code usage.

## Feature-local `AGENTS.md`

Feature-specific context.

Must include:

- feature purpose
- source-of-truth files
- actions
- queries
- views
- tests
- verification command
- local rules

## `.loom/context.json`

Project-level machine context.

Example:

```json
{
  "generatedBy": "loom",
  "doNotEdit": true,
  "project": {
    "name": "manager-crm",
    "frontend": "react",
    "backend": "koa",
    "database": "sqlite",
    "packageManager": "pnpm"
  },
  "paths": {
    "features": "features",
    "web": "apps/web",
    "api": "apps/api"
  },
  "commands": {
    "dev": "pnpm dev",
    "verify": "pnpm loom verify",
    "test": "pnpm test",
    "typecheck": "pnpm typecheck"
  },
  "features": ["people", "projects", "commitments"],
  "rules": [
    {
      "id": "no-db-in-ui",
      "description": "React UI files may not import database code.",
      "errorCode": "loom2001"
    }
  ]
}
```

## `.loom/graph.json`

Feature graph.

Example:

```json
{
  "generatedBy": "loom",
  "doNotEdit": true,
  "features": [
    {
      "id": "people",
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
      "tests": ["features/people/tests/create-person.test.ts"]
    }
  ],
  "dependencies": []
}
```

## `.loom/commands.json`

Command registry.

```json
{
  "generatedBy": "loom",
  "doNotEdit": true,
  "commands": {
    "install": "pnpm install",
    "dev": "pnpm dev",
    "test": "pnpm test",
    "typecheck": "pnpm typecheck",
    "verify": "pnpm loom verify",
    "verifyFeature": "pnpm loom verify feature <feature>"
  }
}
```

## `.loom/errors.json`

Error catalog.

```json
{
  "generatedBy": "loom",
  "doNotEdit": true,
  "errors": {
    "loom2001": {
      "title": "Forbidden database import in UI file",
      "repair": "Move database access into a query file.",
      "docs": "docs/10-verifier-and-error-system.md"
    }
  }
}
```

## CLI context commands

Required:

```bash
loom context --json
loom context feature people --json
loom graph --json
loom affected <file> --json
loom explain <error-code> --json
```

## Context freshness

The verifier should detect stale context.

Example error:

```json
{
  "code": "loom4002",
  "message": ".loom/context.json is stale.",
  "repair": "Run loom generate or loom context generate."
}
```

## Managed markdown sections

Later versions can update sections between markers:

```md
<!-- loom:BEGIN managed-context -->
...
<!-- loom:END managed-context -->
```

For v0.1, generate markdown files on app creation and regenerate JSON context.

## Non-goals for v0.1

- vector database memory
- semantic search
- MCP server
- IDE plugin
- automatic summarization of arbitrary code
- context compression algorithms

These can come later after the CLI context system works.
