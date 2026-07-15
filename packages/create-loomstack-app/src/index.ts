import { resolve } from "node:path"
import { createApp, GeneratorFailure } from "@loomstack/generator"

export interface CreateLoomStackAppIO {
  stdout: (text: string) => void
  stderr: (text: string) => void
  cwd?: () => string
}

function usage(): string {
  return "Usage: create-loomstack-app <name> [--cwd <directory>] [--json]"
}

export function runCreateLoomStackApp(
  argv: string[],
  io: CreateLoomStackAppIO = { stdout: console.log, stderr: console.error }
): number {
  if (argv.includes("--help") || argv.includes("-h")) {
    io.stdout(`${usage()}\n\nCreate a production-ready loomstack application.`)
    return 0
  }

  const json = argv.includes("--json")
  const cwdIndex = argv.indexOf("--cwd")
  const cwdValue = cwdIndex >= 0 ? argv[cwdIndex + 1] : undefined
  const positional = argv.filter((value, index) =>
    value !== "--json" &&
    value !== "--cwd" &&
    (cwdIndex < 0 || index !== cwdIndex + 1) &&
    !value.startsWith("-")
  )
  const name = positional[0]

  if (!name || (cwdIndex >= 0 && !cwdValue)) {
    const error = { code: "loomstack5003", message: usage(), repair: "Provide a lowercase kebab-case application name." }
    if (json) io.stdout(JSON.stringify({ ok: false, errors: [error] }))
    else io.stderr(`${error.message}\nRepair: ${error.repair}`)
    return 1
  }

  try {
    const result = createApp(resolve(cwdValue ?? io.cwd?.() ?? process.cwd()), name)
    if (json) io.stdout(JSON.stringify({ ok: true, data: result }))
    else {
      io.stdout(`Created loomstack app: ${result.appName}`)
      io.stdout(`Next: ${result.nextCommands.join(" && ")}`)
    }
    return 0
  } catch (error) {
    const errors = error instanceof GeneratorFailure
      ? error.errors
      : [{ code: "loomstack5003", message: error instanceof Error ? error.message : String(error), repair: "Retry with a writable target directory." }]
    if (json) io.stdout(JSON.stringify({ ok: false, errors }))
    else for (const item of errors) io.stderr(`${item.code}: ${item.message}\nRepair: ${item.repair}`)
    return 1
  }
}
