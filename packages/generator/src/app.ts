import { existsSync, mkdirSync } from "node:fs"
import { join, resolve } from "node:path"
import { frameworkError } from "@loomstack/core"
import { appTemplateFiles } from "./app-template.js"
import { writeProjectFile } from "./files.js"
import { generateProject } from "./generate.js"
import { GeneratorFailure } from "./scaffold.js"

const APP_NAME = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/

export interface CreateAppResult {
  appName: string
  root: string
  createdFiles: string[]
  nextCommands: string[]
}

export function createApp(parentInput: string, appName: string): CreateAppResult {
  if (!APP_NAME.test(appName)) {
    throw new GeneratorFailure([frameworkError("loomstack5003", {
      message: `App names must be lowercase kebab-case: ${appName}.`
    })])
  }
  const parent = resolve(parentInput)
  const root = join(parent, appName)
  if (existsSync(root)) {
    throw new GeneratorFailure([frameworkError("loomstack5002", { message: `Target directory already exists: ${appName}.`, file: appName })])
  }
  mkdirSync(root, { recursive: false })
  const files = appTemplateFiles(appName)
  for (const path of Object.keys(files).sort()) writeProjectFile(root, path, files[path] ?? "", false)
  const generation = generateProject(root)
  const createdFiles = [...Object.keys(files), ...generation.generatedFiles].filter((value, index, all) => all.indexOf(value) === index).sort()
  return {
    appName,
    root,
    createdFiles,
    nextCommands: [`cd ${appName}`, "pnpm install", "pnpm dev"]
  }
}
