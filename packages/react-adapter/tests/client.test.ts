import { describe, expect, it, vi } from "vitest"
import { createActionClient, createQueryClient, LoomClientError } from "../src/index.js"

describe("React RPC client", () => {
  it("calls named generated action/query endpoints", async () => {
    const fetch = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => new Response(JSON.stringify({ value: "ok" }), { status: 200, headers: { "content-type": "application/json" } }))
    await expect(createActionClient<{ value: string }, { value: string }>("save", { baseUrl: "http://api", fetch })({ value: "x" })).resolves.toEqual({ value: "ok" })
    await createQueryClient("list", { baseUrl: "http://api", fetch })()
    expect(fetch.mock.calls.map((call) => call[0])).toEqual(["http://api/_loom/actions/save", "http://api/_loom/queries/list"])
  })

  it("throws structured client errors", async () => {
    const fetch = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => new Response(JSON.stringify({ error: { code: "loom3001", message: "Invalid", repair: "Fix input" } }), { status: 400 }))
    await expect(createActionClient("save", { fetch })({})).rejects.toBeInstanceOf(LoomClientError)
  })
})
