import { array, query, schema } from "@loom/runtime"
import type { Database } from "@loom/postgres"
import { CommitmentSchema } from "../model.schema.js"
import type { Commitment } from "../model.schema.js"

export const CommitmentsDueSoonOutput = schema({ commitments: array(CommitmentSchema) })

export const listCommitmentsDueSoon = query<undefined, typeof CommitmentsDueSoonOutput._output, Database>({
  name: "listCommitmentsDueSoon",
  output: CommitmentsDueSoonOutput,
  auth: "authenticated",
  async run(ctx) {
    const now = Date.now()
    const end = now + 7 * 24 * 60 * 60 * 1000
    const commitments = (await ctx.db.list<Commitment>("commitments", (item) =>
      item.ownerId === ctx.user!.id && !item.completed && item.dueAt.getTime() >= now && item.dueAt.getTime() <= end
    )).sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())
    return { commitments }
  }
})
