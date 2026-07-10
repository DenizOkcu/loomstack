import { boolean, entity, id, text, timestamp, userId } from "@loom/runtime"

export const CommitmentSchema = entity("Commitment", {
  id: id(),
  summary: text().min(1).max(240),
  personId: id(),
  projectId: id().optional(),
  dueAt: timestamp(),
  completed: boolean(),
  ownerId: userId(),
  createdAt: timestamp(),
  updatedAt: timestamp()
})

export type Commitment = typeof CommitmentSchema._output
