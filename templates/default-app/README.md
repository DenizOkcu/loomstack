# Default app template

The canonical app template is rendered by `packages/generator/src/app-template.ts`. It is intentionally code-defined so every output byte is deterministic and snapshot-testable. Generated applications use React + Vite, Koa, SQLite-compatible persistence, TypeScript, pnpm, and Vitest.
