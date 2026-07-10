import { existsSync, mkdirSync } from "node:fs"
import { join, resolve } from "node:path"
import { frameworkError, loadProjectConfig } from "@loom/core"
import type { FrameworkError } from "@loom/core"
import { writeProjectFile } from "./files.js"

const FEATURE_ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/

export class GeneratorFailure extends Error {
  constructor(readonly errors: FrameworkError[]) {
    super(errors.map((error) => `${error.code}: ${error.message}`).join("\n"))
    this.name = "GeneratorFailure"
  }
}

function titleCase(id: string) {
  return id.split("-").map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`).join(" ")
}

function camelCase(id: string) {
  return id.split("-").map((part, index) => index === 0 ? part : `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`).join("")
}

export interface GenerateResult {
  createdFiles: string[]
}

export function createFeature(rootInput: string, name: string): GenerateResult {
  const root = resolve(rootInput)
  if (!FEATURE_ID.test(name)) throw new GeneratorFailure([frameworkError("loom1011", { message: `Invalid feature name: ${name}.` })])
  const loaded = loadProjectConfig(root)
  if (!loaded.config) throw new GeneratorFailure(loaded.errors)
  const base = `${loaded.config.featuresDir}/${name}`
  if (existsSync(join(root, base))) {
    throw new GeneratorFailure([frameworkError("loom5002", { message: `Feature already exists: ${name}.`, file: base })])
  }

  const title = titleCase(name)
  const files: Record<string, string> = {
    [`${base}/feature.yaml`]: `id: ${name}\nname: ${title}\ndescription: ${title} product capability.\n\nentities: []\nroutes: []\nactions: []\nqueries: []\n`,
    [`${base}/AGENTS.md`]: `# ${title} Feature Agent Instructions\n\n## Purpose\n\n${title} product capability.\n\n## Source of truth\n\n- Manifest: \`feature.yaml\`\n- Schema: \`model.schema.ts\`\n- Permissions: \`permissions.policy.ts\`\n\n## Rules\n\n- Mutations belong in \`actions/*.action.ts\`.\n- Reads belong in \`queries/*.query.ts\`.\n- Route UI belongs in \`ui/*.view.tsx\`.\n- Never import database or Koa modules from UI.\n- Never call raw fetch from UI.\n- Update tests with every contract change.\n\n## Verify\n\n\`pnpm loom verify feature ${name} --json\`\n`,
    [`${base}/model.schema.ts`]: `import { entity } from "@loom/runtime"\n\n// Add and export manifest-declared entities here with entity().\nvoid entity\n`,
    [`${base}/permissions.policy.ts`]: `import { policy } from "@loom/runtime"\n\nexport const ${camelCase(name)}Policy = policy({})\n`
  }

  const createdFiles = Object.keys(files).sort()
  for (const path of createdFiles) writeProjectFile(root, path, files[path] ?? "", false)
  for (const directory of ["actions", "queries", "ui", "tests"]) {
    const path = `${base}/${directory}/.gitkeep`
    mkdirSync(join(root, base, directory), { recursive: true })
    writeProjectFile(root, path, "", false)
    createdFiles.push(path)
  }
  return { createdFiles: createdFiles.sort() }
}
