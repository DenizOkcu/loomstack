import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { frameworkError, scanProject, serializeFrameworkError } from "../src/index.js"

function project() {
  const root = mkdtempSync(join(tmpdir(), "loom-core-"))
  writeFileSync(join(root, "loom.config.ts"), `export default { appName: "test", packageManager: "pnpm", frontend: "react", backend: "koa", database: "sqlite", featuresDir: "features", generatedDir: ".loom" }`)
  mkdirSync(join(root, "features/people/actions"), { recursive: true })
  mkdirSync(join(root, "features/people/queries"), { recursive: true })
  mkdirSync(join(root, "features/people/ui"), { recursive: true })
  mkdirSync(join(root, "features/people/tests"), { recursive: true })
  writeFileSync(join(root, "features/people/feature.yaml"), `id: people\nname: People\nentities: [Person]\nroutes:\n  - id: people-list\n    path: /people\n    view: PeopleListView\nactions: [createPerson]\nqueries: [listPeople]\n`)
  writeFileSync(join(root, "features/people/model.schema.ts"), `export const PersonSchema = entity("Person", {})`)
  writeFileSync(join(root, "features/people/actions/create.action.ts"), `export const createPerson = action({})`)
  writeFileSync(join(root, "features/people/queries/list.query.ts"), `export const listPeople = query({})`)
  writeFileSync(join(root, "features/people/ui/list.view.tsx"), `export default view({ name: "PeopleListView", render() {} })`)
  return root
}

describe("core", () => {
  it("serializes stable repairable errors", () => {
    expect(serializeFrameworkError(frameworkError("loom2001", { file: "features/people/ui/list.view.tsx" }))).toEqual(expect.objectContaining({
      code: "loom2001",
      severity: "error",
      file: "features/people/ui/list.view.tsx",
      repair: expect.any(String)
    }))
  })

  it("scans canonical feature contracts into a graph", () => {
    const result = scanProject(project())
    expect(result.errors).toEqual([])
    expect(result.project?.graph.features[0]).toMatchObject({
      id: "people",
      entities: ["Person"],
      actions: [{ name: "createPerson", file: "features/people/actions/create.action.ts" }],
      routes: ["/people"]
    })
  })

  it("returns structured ID and duplicate route errors", () => {
    const root = project()
    writeFileSync(join(root, "features/people/feature.yaml"), `id: people\nname: People\nentities: []\nroutes:\n  - id: one\n    path: /same\n    view: View\nactions: []\nqueries: []\n`)
    mkdirSync(join(root, "features/projects"))
    writeFileSync(join(root, "features/projects/feature.yaml"), `id: projects\nname: Projects\nentities: []\nroutes:\n  - id: two\n    path: /same\n    view: View\nactions: []\nqueries: []\n`)
    mkdirSync(join(root, "features/wrong-folder"))
    writeFileSync(join(root, "features/wrong-folder/feature.yaml"), `id: contacts\nname: Contacts\nentities: []\nroutes: []\nactions: []\nqueries: []\n`)
    expect(scanProject(root).errors.map((error) => error.code)).toEqual(expect.arrayContaining(["loom1001", "loom1005"]))
  })
})
