# 11 — Agent Context System

The agent context system is a core differentiator of loomstack.

loomstack apps should be inspectable by coding agents without requiring blind repository exploration.

## Goals

- expose project structure in machine-readable form
- expose feature-specific edit paths
- expose commands and verification steps
- expose architecture rules
- keep generated context in sync with actual app state
- reduce token usage by enabling scoped context retrieval

## Context surfaces

loomstack should generate or maintain:

```txt
AGENTS.md
CLAUDE.md
features/*/AGENTS.md
.loomstack/context.json
.loomstack/graph.json
.loomstack/commands.json
.loomstack/errors.json
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

## `.loomstack/context.json`

Project-level machine context.

Example:

```json
{
  "generatedBy": "loomstack",
  "doNotEdit": true,
  "project": {
    "name": "manager-crm",
    "frontend": "react",
    "backend": "koa",
    "database": "postgres",
    "packageManager": "pnpm"
  },
  "paths": {
    "features": "features",
    "web": "apps/web",
    "api": "apps/api"
  },
  "commands": {
    "dev": "pnpm dev",
    "verify": "pnpm loomstack verify",
    "test": "pnpm test",
    "typecheck": "pnpm typecheck"
  },
  "features": ["people", "projects", "commitments"],
  "rules": [
    {
      "id": "no-db-in-ui",
      "description": "React UI files may not import database code.",
      "errorCode": "loomstack2001"
    }
  ]
}
```

## `.loomstack/graph.json`

Feature graph.

Example:

```json
{
  "generatedBy": "loomstack",
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

## `.loomstack/commands.json`

Command registry.

```json
{
  "generatedBy": "loomstack",
  "doNotEdit": true,
  "commands": {
    "install": "pnpm install",
    "dev": "pnpm dev",
    "test": "pnpm test",
    "typecheck": "pnpm typecheck",
    "verify": "pnpm loomstack verify",
    "verifyFeature": "pnpm loomstack verify feature <feature>"
  }
}
```

## `.loomstack/errors.json`

Error catalog.

```json
{
  "generatedBy": "loomstack",
  "doNotEdit": true,
  "errors": {
    "loomstack2001": {
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
loomstack context --json
loomstack context feature people --json
loomstack graph --json
loomstack affected <file> --json
loomstack explain <error-code> --json
```

## Context freshness

The verifier should detect stale context.

Example error:

```json
{
  "code": "loomstack4002",
  "message": ".loomstack/context.json is stale.",
  "repair": "Run loomstack generate or loomstack context generate."
}
```

## Managed markdown sections

Later versions can update sections between markers:

```md
<!-- loomstack:BEGIN managed-context -->
...
<!-- loomstack:END managed-context -->
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
