import { describe, expect, it } from "vitest"
import { executeAction, executeQuery } from "@loomstack/runtime"
import { MemoryDatabase } from "@loomstack/postgres"
import { createPerson } from "../actions/create-person.action.js"
import { listPeople } from "../queries/list-people.query.js"
import { peoplePolicy } from "../permissions.policy.js"

describe("people", () => {
  it("creates and lists only the authenticated owner's people", async () => {
    const db = new MemoryDatabase()
    const owner = { requestId: "1", user: { id: "owner-1" }, db, logger: {} }
    await executeAction(createPerson, owner, { name: "Ada", title: "CTO" })
    const result = await executeQuery(listPeople, owner, undefined)
    expect(result.people.map((person) => person.name)).toEqual(["Ada"])
    expect(peoplePolicy.canRead("owner-1", result.people[0]!)).toBe(true)
    expect(peoplePolicy.canWrite("another-user", result.people[0]!)).toBe(false)
  })
})
