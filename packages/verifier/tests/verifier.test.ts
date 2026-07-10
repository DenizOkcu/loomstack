import { appendFileSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { beforeEach, describe, expect, it } from "vitest"
import { createApp, createFeature, generateProject } from "@loom/generator"
import { verifyProject } from "../src/index.js"

let root: string

function writeFeature() {
  createFeature(root, "people")
  const base = join(root, "features/people")
  writeFileSync(join(base, "feature.yaml"), `id: people\nname: People\nentities: [Person]\nroutes:\n  - id: people-list\n    path: /people\n    view: PeopleListView\nactions: [createPerson]\nqueries: [listPeople]\n`)
  writeFileSync(join(base, "model.schema.ts"), `import { entity } from "@loom/runtime"\nexport const PersonSchema = entity("Person", {})`)
  writeFileSync(join(base, "actions/create.action.ts"), `import { action } from "@loom/runtime"\nexport const createPerson = action({})`)
  writeFileSync(join(base, "queries/list.query.ts"), `import { query } from "@loom/runtime"\nexport const listPeople = query({})`)
  writeFileSync(join(base, "ui/list.view.tsx"), `import { view } from "@loom/react"\nexport default view({ name: "PeopleListView", render() { return null } })`)
  generateProject(root)
}

beforeEach(() => {
  const parent = mkdtempSync(join(tmpdir(), "loom-verifier-"))
  root = createApp(parent, "demo").root
})

describe("verifier", () => {
  it("accepts a generated canonical project", () => {
    writeFeature()
    expect(verifyProject(root)).toEqual({ ok: true, errors: [], warnings: [] })
  })

  it("detects UI database access and raw fetch", () => {
    writeFeature()
    writeFileSync(join(root, "features/people/ui/list.view.tsx"), `import { db } from "@/db"\nfetch("/people")\nexport default view({ name: "PeopleListView" })`)
    expect(verifyProject(root).errors.map((error) => error.code)).toEqual(expect.arrayContaining(["loom2001", "loom2002"]))
  })

  it("detects manually modified generated files", () => {
    writeFeature()
    appendFileSync(join(root, "apps/web/src/routes.generated.tsx"), "// manual edit\n")
    expect(verifyProject(root).errors).toEqual(expect.arrayContaining([expect.objectContaining({ code: "loom4001", file: "apps/web/src/routes.generated.tsx" })]))
  })

  it("distinguishes stale generated files after a contract change", () => {
    writeFeature()
    const manifest = join(root, "features/people/feature.yaml")
    writeFileSync(manifest, readFileSync(manifest, "utf8").replace("name: People", "name: Contacts"))
    expect(verifyProject(root).errors).toEqual(expect.arrayContaining([expect.objectContaining({ code: "loom4002" })]))
  })

  it("reports manifest/implementation mismatches with stable codes", () => {
    writeFeature()
    writeFileSync(join(root, "features/people/actions/create.action.ts"), `export const otherAction = action({})`)
    expect(verifyProject(root, { generated: false }).errors.map((error) => error.code)).toEqual(expect.arrayContaining(["loom1003", "loom1004"]))
  })

  it("reports a missing project config", () => {
    const empty = mkdtempSync(join(tmpdir(), "loom-empty-"))
    expect(verifyProject(empty).errors[0]).toMatchObject({ code: "loom5001" })
  })
})
