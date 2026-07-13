import { action, id, schema, text, timestamp } from "@loomstack/runtime"
import type { Database } from "@loomstack/postgres"
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
  Database
>({
  name: "createCommitment",
  input: CreateCommitmentInput,
  output: CommitmentSchema,
  auth: "authenticated",
  async run(ctx, input) {
    const now = new Date()
    return await ctx.db.insert("commitments", {
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
