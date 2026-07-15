# create-loomstack-app

Create an agent-operable TypeScript fullstack application with React, Vite, Koa, PostgreSQL, Zod, pnpm, and Vitest.

## Quick start

**Requirements:** Node 22+, pnpm 11+, and Docker Compose.

```bash
npm create loomstack-app@latest my-app
cd my-app
pnpm install
pnpm loomstack init
```

`init` validates the project and starts the web, API, and PostgreSQL development services. Open [http://localhost:3000](http://localhost:3000) when it finishes.

Use `pnpm loomstack init --no-start` to initialize without starting Docker, or `pnpm loomstack init --skip-install` when dependencies are managed separately.

## Create your first feature

```bash
pnpm loomstack create feature people --json
pnpm loomstack context feature people --json
```

Then describe the product behavior to your coding agent:

```text
Implement the people feature. Users can create people with a name and optional
job title, list only their own people newest-first, and open the list at /people.
Read AGENTS.md first. Generate, verify, and test before finishing.
```

LoomStack gives the agent a deterministic context → edit → generate → verify → test workflow and keeps product behavior in canonical feature slices.

## What gets created

```text
apps/web/              React + Vite presentation
apps/api/              Koa RPC transport
features/              Product behavior and tests
shared/generated/      Generated registries
.loomstack/             Generated context, graph, and hashes
compose.yaml            Web, API, and PostgreSQL services
AGENTS.md               Project-specific agent instructions
```

Generated wiring is marked as do-not-edit. Schemas, policies, actions, queries, views, and tests remain authored inside `features/`.

## Common commands

| Command | Purpose |
|---|---|
| `pnpm loomstack context --json` | Inspect the project and architectural rules |
| `pnpm loomstack context feature <name> --json` | Inspect one feature before editing |
| `pnpm loomstack create feature <name> --json` | Scaffold a canonical feature |
| `pnpm loomstack affected <file> --json` | Find related authored files |
| `pnpm loomstack generate --json` | Regenerate deterministic wiring |
| `pnpm loomstack verify --json` | Verify contracts, boundaries, and generated files |
| `pnpm loomstack dev status --json` | Check development service status |
| `pnpm loomstack doctor --json` | Diagnose environment and setup problems |
| `pnpm loomstack explain <code> --json` | Get repair guidance for a stable error code |

## Creator options

```text
create-loomstack-app <name> [--cwd <directory>] [--json]
```

- `<name>` must be lowercase kebab-case.
- `--cwd` selects the parent directory.
- `--json` emits one machine-readable result document.
- Existing target directories are never overwritten.

You can also run the initializer directly:

```bash
npx create-loomstack-app@latest my-app
```

## Troubleshooting

Check the local environment:

```bash
pnpm loomstack doctor --json
```

If a command returns a `loomstack…` error code, inspect its repair contract:

```bash
pnpm loomstack explain <code> --json
```

Normal source edits use hot reload. Run `pnpm loomstack dev refresh --json` only after dependency, Dockerfile, Compose, or environment changes.

## Links

- [Documentation](https://github.com/DenizOkcu/loomstack/tree/master/docs)
- [Architecture](https://github.com/DenizOkcu/loomstack/blob/master/docs/architecture.md)
- [CLI contracts](https://github.com/DenizOkcu/loomstack/blob/master/docs/commands.md)
- [GitHub repository](https://github.com/DenizOkcu/loomstack)
- [Issue tracker](https://github.com/DenizOkcu/loomstack/issues)
