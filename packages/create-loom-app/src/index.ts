#!/usr/bin/env node
import { createApp, GeneratorFailure } from "@loom/generator"

const name = process.argv[2]
if (!name) {
  console.error("Usage: create-loom-app <name>")
  process.exitCode = 1
} else {
  try {
    const result = createApp(process.cwd(), name)
    console.log(`Created loom app: ${result.appName}`)
    console.log(`Next: ${result.nextCommands.join(" && ")}`)
  } catch (error) {
    if (error instanceof GeneratorFailure) console.error(error.message)
    else console.error(error)
    process.exitCode = 1
  }
}
