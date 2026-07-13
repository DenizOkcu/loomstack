import { action, oneOf, schema, text } from "@loomstack/runtime"
import type { Database } from "@loomstack/postgres"
import { ProjectSchema } from "../model.schema.js"

export const CreateProjectInput = schema({
  name: text().min(1).max(160),
  risk: oneOf(["low", "medium", "high"])
})

export const createProject = action<
  typeof CreateProjectInput._output,
  typeof ProjectSchema._output,
  Database
>({
  name: "createProject",
  input: CreateProjectInput,
  output: ProjectSchema,
  auth: "authenticated",
  async run(ctx, input) {
    const now = new Date()
    return await ctx.db.insert("projects", {
      id: crypto.randomUUID(),
      name: input.name,
      status: "active" as const,
      risk: input.risk,
      ownerId: ctx.user!.id,
      createdAt: now,
      updatedAt: now
    })
  }
})
