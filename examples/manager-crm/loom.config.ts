import { defineLoomConfig } from "@loom/runtime"

export default defineLoomConfig({
  appName: "manager-crm",
  packageManager: "pnpm",
  frontend: "react",
  backend: "koa",
  database: "postgres",
  featuresDir: "features",
  generatedDir: ".loom"
})
