import { describe, expect, it, vi } from "vitest"
import { action, executeAction, executeQuery, query, schema, text } from "../src/index.js"

const context = { requestId: "req-1", db: {}, logger: {} }

describe("action/query runtime", () => {
  it("validates action input and output", async () => {
    const run = vi.fn((_ctx, input: { name: string }) => ({ greeting: `Hello ${input.name}` }))
    const greet = action({
      name: "greet",
      input: schema({ name: text().min(1) }),
      output: schema({ greeting: text() }),
      run
    })

    await expect(executeAction(greet, context, { name: "Ada" })).resolves.toEqual({ greeting: "Hello Ada" })
    await expect(executeAction(greet, context, { name: "" })).rejects.toMatchObject({ body: { code: "loomstack3001" } })
  })

  it("validates query output", async () => {
    const broken = query({ name: "broken", output: schema({ value: text() }), run: () => ({ value: 1 as unknown as string }) })
    await expect(executeQuery(broken, context, undefined)).rejects.toMatchObject({ body: { code: "loomstack3002" } })
  })

  it("enforces authenticated operations", async () => {
    const secured = action({
      name: "secured",
      input: schema({ value: text() }),
      output: schema({ value: text() }),
      auth: "authenticated",
      run: (_ctx, input) => input
    })
    await expect(executeAction(secured, context, { value: "x" })).rejects.toMatchObject({ body: { code: "loomstack3003" } })
  })
})
