import { describe, expect, it } from "vitest"
import { MemoryDatabase, PostgresDatabase } from "../src/index.js"

describe("PostgreSQL adapters", () => {
  it("offers deterministic in-memory CRUD for feature tests", () => {
    const db = new MemoryDatabase()
    db.insert("people", { id: "1", name: "Ada" })
    db.update<{ id: string; name: string }>("people", (row) => row.id === "1", { name: "Grace" })
    expect(db.find<{ id: string; name: string }>("people", (row) => row.id === "1")).toEqual({ id: "1", name: "Grace" })
    expect(db.remove<{ id: string }>("people", (row) => row.id === "1")).toBe(1)
  })

  it("configures a PostgreSQL pool without connecting eagerly", async () => {
    const db = new PostgresDatabase({ connectionString: "postgresql://localhost/loomstack_test" })
    expect(db.pool.totalCount).toBe(0)
    await db.close()
  })
})
