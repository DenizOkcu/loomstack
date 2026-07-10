import { array, query, schema } from "@loom/runtime"
import type { MemoryDatabase } from "@loom/sqlite"
import { CommitmentSchema } from "../model.schema.js"
import type { Commitment } from "../model.schema.js"

export const ListCommitmentsOutput = schema({ commitments: array(CommitmentSchema) })

function overdue(commitment: Commitment, now: number) {
  return !commitment.completed && commitment.dueAt.getTime() < now
}

export const listCommitments = query<undefined, typeof ListCommitmentsOutput._output, MemoryDatabase>({
  name: "listCommitments",
  output: ListCommitmentsOutput,
  auth: "authenticated",
  run(ctx) {
    const now = Date.now()
    const commitments = ctx.db.list<Commitment>("commitments", (item) => item.ownerId === ctx.user!.id)
      .sort((a, b) => Number(overdue(b, now)) - Number(overdue(a, now)) || a.dueAt.getTime() - b.dueAt.getTime())
    return { commitments }
  }
})
