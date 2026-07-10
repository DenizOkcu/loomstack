import { action, oneOf, schema, text } from "@loom/runtime"
import type { MemoryDatabase } from "@loom/sqlite"
import { ProjectSchema } from "../model.schema.js"

export const CreateProjectInput = schema({
  name: text().min(1).max(160),
  risk: oneOf(["low", "medium", "high"])
})

export const createProject = action<
  typeof CreateProjectInput._output,
  typeof ProjectSchema._output,
  MemoryDatabase
>({
  name: "createProject",
  input: CreateProjectInput,
  output: ProjectSchema,
  auth: "authenticated",
  run(ctx, input) {
    const now = new Date()
    return ctx.db.insert("projects", {
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
