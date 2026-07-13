#!/usr/bin/env node
import { runCreateLoomStackApp } from "./index.js"

process.exitCode = runCreateLoomStackApp(process.argv.slice(2))
