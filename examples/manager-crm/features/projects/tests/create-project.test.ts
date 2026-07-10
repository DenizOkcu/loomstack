import { describe, expect, it } from "vitest"
import { executeAction, executeQuery } from "@loom/runtime"
import { MemoryDatabase } from "@loom/sqlite"
import { createProject } from "../actions/create-project.action.js"
import { listProjects } from "../queries/list-projects.query.js"

describe("projects", () => {
  it("creates and lists projects", async () => {
    const context = { requestId: "1", user: { id: "owner-1" }, db: new MemoryDatabase(), logger: {} }
    await executeAction(createProject, context, { name: "Apollo", risk: "high" })
    const result = await executeQuery(listProjects, context, undefined)
    expect(result.projects[0]).toMatchObject({ name: "Apollo", risk: "high", status: "active" })
  })
})
