import { mkdirSync, rmSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const repositoryRoot = resolve(packageRoot, "../..")
const vendor = resolve(packageRoot, "vendor")
rmSync(vendor, { recursive: true, force: true })
mkdirSync(vendor, { recursive: true })

for (const name of ["@loomstack/runtime", "@loomstack/react", "@loomstack/koa", "@loomstack/postgres"]) {
  const result = spawnSync("pnpm", ["--filter", name, "pack", "--pack-destination", vendor], {
    cwd: repositoryRoot,
    stdio: "inherit"
  })
  if (result.status !== 0) process.exit(result.status ?? 1)
}
