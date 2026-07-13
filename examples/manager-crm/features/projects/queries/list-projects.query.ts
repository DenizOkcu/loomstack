import { array, query, schema } from "@loomstack/runtime"
import type { Database } from "@loomstack/postgres"
import { ProjectSchema } from "../model.schema.js"
import type { Project } from "../model.schema.js"

export const ListProjectsOutput = schema({ projects: array(ProjectSchema) })

export const listProjects = query<undefined, typeof ListProjectsOutput._output, Database>({
  name: "listProjects",
  output: ListProjectsOutput,
  auth: "authenticated",
  async run(ctx) {
    const projects = (await ctx.db.list<Project>("projects", (project) => project.ownerId === ctx.user!.id))
      .sort((a, b) => a.name.localeCompare(b.name))
    return { projects }
  }
})
