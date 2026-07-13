# manager-crm LoomStack memory

Read the root `AGENTS.md` before acting, then read every feature-local `AGENTS.md` in scope. Product behavior lives in `features/*`; React renders and Koa transports. Never edit generated files, use generated RPC clients, and finish with `pnpm loomstack generate --json && pnpm loomstack verify --json`.
