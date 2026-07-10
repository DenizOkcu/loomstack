import { array, query, schema } from "@loom/runtime"
import type { MemoryDatabase } from "@loom/sqlite"
import { ProjectSchema } from "../model.schema.js"
import type { Project } from "../model.schema.js"

export const ListProjectsOutput = schema({ projects: array(ProjectSchema) })

export const listProjects = query<undefined, typeof ListProjectsOutput._output, MemoryDatabase>({
  name: "listProjects",
  output: ListProjectsOutput,
  auth: "authenticated",
  run(ctx) {
    const projects = ctx.db.list<Project>("projects", (project) => project.ownerId === ctx.user!.id)
      .sort((a, b) => a.name.localeCompare(b.name))
    return { projects }
  }
})
