# Manager CRM

This integration fixture was recreated from the published LoomStack `0.0.2` packages. The application shell came from `create-loomstack-app@0.0.2`; each feature was scaffolded with `loomstack create feature` before its authored contracts and behavior were applied.

It demonstrates three vertical slices:

- `people` — create and list owner-scoped people
- `projects` — create and list projects with status and risk
- `commitments` — create and list commitments with due dates, overdue-first ordering, and a due-soon query

Authentication is intentionally represented by the `x-user-id` request header. Runtime persistence uses `PostgresDatabase` through `DATABASE_URL`; feature tests use the deterministic `MemoryDatabase` from `@loomstack/postgres`.

## Validate from the framework repository

```bash
pnpm loomstack --cwd examples/manager-crm context --json
pnpm loomstack --cwd examples/manager-crm verify --json
pnpm exec tsc --noEmit -p examples/manager-crm/tsconfig.json
pnpm --filter manager-crm test
pnpm --filter '@manager-crm/*' build
```

## Run as a standalone generated app

```bash
cd examples/manager-crm
pnpm install
pnpm loomstack dev start --json
```

Open [http://localhost:3000](http://localhost:3000). The web app proxies `/_loomstack` requests to the Koa API on port `3001`; PostgreSQL runs in the same Docker Compose stack.

Normal source changes use hot reload. Use `pnpm loomstack dev refresh --json` only after dependency, Dockerfile, Compose, or environment changes.
