import { defineLoomStackConfig } from "@loomstack/runtime"

export default defineLoomStackConfig({
  appName: "manager-crm",
  packageManager: "pnpm",
  frontend: "react",
  backend: "koa",
  database: "postgres",
  featuresDir: "features",
  generatedDir: ".loomstack"
})
