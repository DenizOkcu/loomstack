import { defineConfig } from "vitest/config"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL(".", import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      "@loom/core": `${root}packages/core/src/index.ts`,
      "@loom/runtime": `${root}packages/runtime/src/index.ts`,
      "@loom/generator": `${root}packages/generator/src/index.ts`,
      "@loom/verifier": `${root}packages/verifier/src/index.ts`,
      "@loom/react": `${root}packages/react-adapter/src/index.tsx`,
      "@loom/koa": `${root}packages/koa-adapter/src/index.ts`,
      "@loom/sqlite": `${root}packages/sqlite-adapter/src/index.ts`
    }
  },
  test: {
    include: ["packages/**/*.test.ts", "packages/**/*.test.tsx", "examples/manager-crm/features/**/*.test.ts", "examples/manager-crm/features/**/*.test.tsx"],
    coverage: { reporter: ["text", "json"] }
  }
})
