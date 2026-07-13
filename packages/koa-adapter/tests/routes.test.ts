import type { AddressInfo } from "node:net"
import Koa from "koa"
import { describe, expect, it } from "vitest"
import { action, query, schema, text } from "@loomstack/runtime"
import { registerLoomStackRoutes } from "../src/index.js"

async function jsonBody(ctx: Koa.Context, next: Koa.Next) {
  let body = ""
  for await (const chunk of ctx.req) body += chunk.toString()
  ;(ctx.request as Koa.Request & { body?: unknown }).body = body ? JSON.parse(body) : {}
  await next()
}

describe("Koa transport", () => {
  it("executes actions/queries and returns structured unknown-operation errors", async () => {
    const echo = action({
      name: "echo",
      input: schema({ value: text() }),
      output: schema({ value: text() }),
      run: (_ctx, input) => input
    })
    const status = query({
      name: "status",
      output: schema({ value: text() }),
      run: () => ({ value: "ready" })
    })
    const app = new Koa()
    app.use(jsonBody)
    registerLoomStackRoutes(app, {
      actionRegistry: { echo },
      queryRegistry: { status },
      createRequestContext: () => ({ requestId: "req-1", db: {}, logger: {} })
    })
    const server = app.listen(0)
    const port = (server.address() as AddressInfo).port
    try {
      const actionResponse = await fetch(`http://127.0.0.1:${port}/_loomstack/actions/echo`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ value: "hello" })
      })
      expect(await actionResponse.json()).toEqual({ value: "hello" })

      const queryResponse = await fetch(`http://127.0.0.1:${port}/_loomstack/queries/status`, { method: "POST" })
      expect(await queryResponse.json()).toEqual({ value: "ready" })

      const missing = await fetch(`http://127.0.0.1:${port}/_loomstack/actions/missing`, { method: "POST" })
      expect(missing.status).toBe(404)
      expect(await missing.json()).toMatchObject({ error: { code: "loomstack4040", repair: expect.any(String) } })

      const inherited = await fetch(`http://127.0.0.1:${port}/_loomstack/actions/toString`, { method: "POST" })
      expect(inherited.status).toBe(404)
    } finally {
      server.close()
    }
  })
})
