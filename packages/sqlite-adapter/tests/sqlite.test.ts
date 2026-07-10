import { describe, expect, it } from "vitest"
import { MemoryDatabase, SqliteDatabase } from "../src/index.js"

describe("SQLite adapters", () => {
  it("offers deterministic in-memory CRUD for feature tests", () => {
    const db = new MemoryDatabase()
    db.insert("people", { id: "1", name: "Ada" })
    db.update<{ id: string; name: string }>("people", (row) => row.id === "1", { name: "Grace" })
    expect(db.find<{ id: string; name: string }>("people", (row) => row.id === "1")).toEqual({ id: "1", name: "Grace" })
    expect(db.remove<{ id: string }>("people", (row) => row.id === "1")).toBe(1)
  })

  it("executes SQL through Node's SQLite runtime", () => {
    const db = new SqliteDatabase()
    db.exec("CREATE TABLE people (id TEXT PRIMARY KEY, name TEXT NOT NULL)")
    db.run("INSERT INTO people VALUES (?, ?)", "1", "Ada")
    expect(db.get("SELECT * FROM people WHERE id = ?", "1")).toEqual({ id: "1", name: "Ada" })
    db.close()
  })
})
