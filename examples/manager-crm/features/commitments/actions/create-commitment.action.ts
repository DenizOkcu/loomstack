import { action, id, schema, text, timestamp } from "@loom/runtime"
import type { MemoryDatabase } from "@loom/sqlite"
import { CommitmentSchema } from "../model.schema.js"

export const CreateCommitmentInput = schema({
  summary: text().min(1).max(240),
  personId: id(),
  projectId: id().optional(),
  dueAt: timestamp()
})

export const createCommitment = action<
  typeof CreateCommitmentInput._output,
  typeof CommitmentSchema._output,
  MemoryDatabase
>({
  name: "createCommitment",
  input: CreateCommitmentInput,
  output: CommitmentSchema,
  auth: "authenticated",
  run(ctx, input) {
    const now = new Date()
    return ctx.db.insert("commitments", {
      id: crypto.randomUUID(),
      summary: input.summary,
      personId: input.personId,
      projectId: input.projectId,
      dueAt: input.dueAt,
      completed: false,
      ownerId: ctx.user!.id,
      createdAt: now,
      updatedAt: now
    })
  }
})
