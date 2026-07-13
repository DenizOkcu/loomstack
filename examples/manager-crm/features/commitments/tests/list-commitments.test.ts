import { describe, expect, it } from "vitest"
import { executeAction, executeQuery } from "@loomstack/runtime"
import { MemoryDatabase } from "@loomstack/postgres"
import { createCommitment } from "../actions/create-commitment.action.js"
import { listCommitments } from "../queries/list-commitments.query.js"

describe("commitments", () => {
  it("sorts overdue commitments before future commitments", async () => {
    const context = { requestId: "1", user: { id: "owner-1" }, db: new MemoryDatabase(), logger: {} }
    await executeAction(createCommitment, context, { summary: "Future", personId: "p1", dueAt: new Date(Date.now() + 86_400_000) })
    await executeAction(createCommitment, context, { summary: "Overdue", personId: "p1", dueAt: new Date(Date.now() - 86_400_000) })
    const result = await executeQuery(listCommitments, context, undefined)
    expect(result.commitments.map((item) => item.summary)).toEqual(["Overdue", "Future"])
  })
})
