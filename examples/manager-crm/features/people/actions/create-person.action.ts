import { action, schema, text } from "@loom/runtime"
import type { MemoryDatabase } from "@loom/sqlite"
import { PersonSchema } from "../model.schema.js"

export const CreatePersonInput = schema({
  name: text().min(1).max(120),
  title: text().max(120).optional()
})

export const createPerson = action<
  typeof CreatePersonInput._output,
  typeof PersonSchema._output,
  MemoryDatabase
>({
  name: "createPerson",
  input: CreatePersonInput,
  output: PersonSchema,
  auth: "authenticated",
  run(ctx, input) {
    const now = new Date()
    return ctx.db.insert("people", {
      id: crypto.randomUUID(),
      name: input.name,
      title: input.title,
      ownerId: ctx.user!.id,
      createdAt: now,
      updatedAt: now
    })
  }
})
