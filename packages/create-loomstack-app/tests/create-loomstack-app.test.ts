import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { runCreateLoomStackApp } from "../src/index.js"

const roots: string[] = []
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

function temporaryRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "create-loomstack-app-"))
  roots.push(root)
  return root
}

describe("create-loomstack-app", () => {
  it("creates an application through the npm binary", () => {
    const root = temporaryRoot()
    const output: string[] = []
    const code = runCreateLoomStackApp(["demo-app", "--cwd", root, "--json"], {
      stdout: (text) => output.push(text),
      stderr: (text) => output.push(text)
    })

    expect(code).toBe(0)
    expect(JSON.parse(output[0] ?? "")).toMatchObject({ ok: true, data: { appName: "demo-app" } })
  })

  it("returns a stable JSON error when the name is missing", () => {
    const output: string[] = []
    const code = runCreateLoomStackApp(["--json"], {
      stdout: (text) => output.push(text),
      stderr: (text) => output.push(text)
    })

    expect(code).toBe(1)
    expect(JSON.parse(output[0] ?? "")).toMatchObject({ ok: false, errors: [{ code: "loomstack5003" }] })
  })
})
