import { defineLoomConfig } from "@loom/runtime"

export default defineLoomConfig({
  appName: "manager-crm",
  packageManager: "pnpm",
  frontend: "react",
  backend: "koa",
  database: "sqlite",
  featuresDir: "features",
  generatedDir: ".loom"
})
