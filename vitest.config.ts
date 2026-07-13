import { defineConfig } from "vitest/config"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL(".", import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      "@loomstack/core": `${root}packages/core/src/index.ts`,
      "@loomstack/runtime": `${root}packages/runtime/src/index.ts`,
      "@loomstack/generator": `${root}packages/generator/src/index.ts`,
      "@loomstack/verifier": `${root}packages/verifier/src/index.ts`,
      "@loomstack/react": `${root}packages/react-adapter/src/index.tsx`,
      "@loomstack/koa": `${root}packages/koa-adapter/src/index.ts`,
      "@loomstack/postgres": `${root}packages/postgres-adapter/src/index.ts`
    }
  },
  test: {
    include: ["packages/**/*.test.ts", "packages/**/*.test.tsx", "examples/manager-crm/features/**/*.test.ts", "examples/manager-crm/features/**/*.test.tsx"],
    coverage: { reporter: ["text", "json"] }
  }
})
