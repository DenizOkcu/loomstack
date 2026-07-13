# Manager CRM loomstack example

A complete loomstack vertical-slice fixture with:

- `people`: create/list people with owner policy
- `projects`: create/list projects with status and risk
- `commitments`: create/list commitments, due dates, overdue-first ordering, and due-soon query

Auth is intentionally represented by the `x-user-id` request header. Persistence uses `PostgresDatabase` and reads its connection string from `DATABASE_URL`; feature tests use the deterministic `MemoryDatabase` from `@loomstack/postgres`.

## Validate

From the framework repository root:

```bash
pnpm loomstack --cwd examples/manager-crm context --json
pnpm loomstack --cwd examples/manager-crm verify --json
pnpm exec tsc --noEmit -p examples/manager-crm/tsconfig.json
pnpm --filter manager-crm test
pnpm --filter '@manager-crm/*' build
```

## Run

After framework packages are linked or published:

```bash
cd examples/manager-crm
pnpm dev
```

Web runs on port 3000 and proxies `/_loomstack` to the Koa API on port 3001.
