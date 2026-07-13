import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { runCli } from "../src/index.js"

function capture() {
  let stdout = ""
  let stderr = ""
  return {
    io: { stdout: (text: string) => { stdout += text }, stderr: (text: string) => { stderr += text } },
    stdout: () => stdout,
    stderr: () => stderr
  }
}

describe("CLI JSON contract", () => {
  it("creates an app and emits JSON only", async () => {
    const parent = mkdtempSync(join(tmpdir(), "loomstack-cli-"))
    const output = capture()
    expect(await runCli(["--cwd", parent, "create", "app", "demo", "--json"], output.io)).toBe(0)
    const payload = JSON.parse(output.stdout())
    expect(payload).toMatchObject({ ok: true, appName: "demo", nextCommands: ["cd demo", "pnpm install", "pnpm dev"] })
    expect(output.stderr()).toBe("")
  })

  it("returns project context and verification as stable JSON", async () => {
    const parent = mkdtempSync(join(tmpdir(), "loomstack-cli-"))
    await runCli(["--cwd", parent, "create", "app", "demo", "--quiet"], capture().io)
    const context = capture()
    expect(await runCli(["--cwd", join(parent, "demo"), "context", "--json"], context.io)).toBe(0)
    expect(JSON.parse(context.stdout())).toMatchObject({ ok: true, project: { name: "demo" }, features: [] })
    const verify = capture()
    expect(await runCli(["--cwd", join(parent, "demo"), "verify", "--json"], verify.io)).toBe(0)
    expect(JSON.parse(verify.stdout())).toEqual({ ok: true, errors: [], warnings: [] })
  })

  it("returns non-zero structured errors", async () => {
    const output = capture()
    const empty = mkdtempSync(join(tmpdir(), "loomstack-cli-"))
    expect(await runCli(["--cwd", empty, "verify", "--json"], output.io)).toBe(1)
    expect(JSON.parse(output.stdout())).toMatchObject({ ok: false, errors: [{ code: "loomstack5001" }] })
  })
})
