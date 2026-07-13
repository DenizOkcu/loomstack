import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { ERROR_CATALOG, frameworkError, scanProject } from "@loomstack/core"
import type { GeneratedFilesManifest, LoomStackProject, ScannedFeature } from "@loomstack/core"
import { GENERATED_SOURCE_MARKER, sha256, stableJson, writeProjectFile } from "./files.js"
import { GeneratorFailure } from "./scaffold.js"

function source(lines: string[]): string {
  return `${GENERATED_SOURCE_MARKER}\n\n${lines.join("\n").trimEnd()}\n`
}

function importPath(path: string): string {
  return `../../${path.replace(/\.(tsx?|jsx?)$/, ".js")}`
}

function featureRegistry(project: LoomStackProject): string {
  const entries = project.features.map((feature) =>
    `  ${JSON.stringify(feature.id)}: { id: ${JSON.stringify(feature.id)}, name: ${JSON.stringify(feature.manifest.name)}, manifestPath: ${JSON.stringify(feature.manifestPath)} }`
  )
  return source([
    "export const featureRegistry = {",
    entries.join(",\n"),
    "} as const"
  ])
}

function actionRegistry(project: LoomStackProject): string {
  const actions = project.features.flatMap((feature) => feature.actions).sort((a, b) => a.name.localeCompare(b.name))
  return source([
    ...actions.map((item) => `import { ${item.name} } from ${JSON.stringify(importPath(item.file))}`),
    actions.length ? "" : "",
    "export const actionRegistry = {",
    ...actions.map((item) => `  ${item.name},`),
    "} as const"
  ])
}

function queryRegistry(project: LoomStackProject): string {
  const queries = project.features.flatMap((feature) => feature.queries).sort((a, b) => a.name.localeCompare(b.name))
  return source([
    ...queries.map((item) => `import { ${item.name} } from ${JSON.stringify(importPath(item.file))}`),
    queries.length ? "" : "",
    "export const queryRegistry = {",
    ...queries.map((item) => `  ${item.name},`),
    "} as const"
  ])
}

function schemaRegistry(project: LoomStackProject): string {
  const schemas = project.features.flatMap((feature) => feature.manifest.entities.map((name) => ({
    name,
    file: `${feature.directory}/model.schema.ts`
  }))).sort((a, b) => a.name.localeCompare(b.name))
  return source([
    ...schemas.map((item) => `import { ${item.name}Schema } from ${JSON.stringify(importPath(item.file))}`),
    schemas.length ? "" : "",
    "export const schemaRegistry = {",
    ...schemas.map((item) => `  ${item.name}: ${item.name}Schema,`),
    "} as const"
  ])
}

function resolveView(feature: ScannedFeature, viewName: string): string | undefined {
  return feature.views.find((item) => item.name === viewName)?.file
}

function reactRoutes(project: LoomStackProject): string {
  const routes = project.features.flatMap((feature) => feature.manifest.routes.map((route) => ({ ...route, feature })))
    .sort((a, b) => a.path.localeCompare(b.path) || a.id.localeCompare(b.id))
  const missing = routes.filter((route) => !resolveView(route.feature, route.view))
  if (missing.length) {
    throw new GeneratorFailure(missing.map((route) => frameworkError("loomstack1009", {
      message: `Route ${route.id} references missing view ${route.view}.`,
      file: route.feature.manifestPath
    })))
  }
  return source([
    'import { lazy } from "react"',
    'import type { ComponentType, LazyExoticComponent } from "react"',
    "",
    "export interface LoomStackRoute {",
    "  id: string",
    "  feature: string",
    "  path: string",
    "  component: LazyExoticComponent<ComponentType>",
    "}",
    "",
    "export const routes: LoomStackRoute[] = [",
    ...routes.map((route) => {
      const file = resolveView(route.feature, route.view) ?? ""
      const relative = `../../../${file.replace(/\.(tsx?|jsx?)$/, "")}`
      return `  { id: ${JSON.stringify(route.id)}, feature: ${JSON.stringify(route.feature.id)}, path: ${JSON.stringify(route.path)}, component: lazy(() => import(${JSON.stringify(relative)})) },`
    }),
    "]"
  ])
}

function apiClient(project: LoomStackProject): string {
  const actions = project.features.flatMap((feature) => feature.actions).sort((a, b) => a.name.localeCompare(b.name))
  const queries = project.features.flatMap((feature) => feature.queries).sort((a, b) => a.name.localeCompare(b.name))
  return source([
    'import { createActionClient, createQueryClient } from "@loomstack/react"',
    ...actions.map((item) => `import type { ${item.name} as _${item.name}Definition } from ${JSON.stringify(`../../../${item.file.replace(/\.(tsx?|jsx?)$/, ".js")}`)}`),
    ...queries.map((item) => `import type { ${item.name} as _${item.name}Definition } from ${JSON.stringify(`../../../${item.file.replace(/\.(tsx?|jsx?)$/, ".js")}`)}`),
    "",
    "export const api = {",
    "  actions: {",
    ...actions.map((item) => `    ${item.name}: createActionClient<Parameters<typeof _${item.name}Definition.run>[1], Awaited<ReturnType<typeof _${item.name}Definition.run>>>(${JSON.stringify(item.name)}),`),
    "  },",
    "  queries: {",
    ...queries.map((item) => `    ${item.name}: createQueryClient<Parameters<typeof _${item.name}Definition.run>[1], Awaited<ReturnType<typeof _${item.name}Definition.run>>>(${JSON.stringify(item.name)}),`),
    "  }",
    "} as const"
  ])
}

function koaRoutes(): string {
  return source([
    'import type Koa from "koa"',
    'import { registerLoomStackRoutes } from "@loomstack/koa"',
    'import { actionRegistry } from "../../../shared/generated/action-registry.generated.js"',
    'import { queryRegistry } from "../../../shared/generated/query-registry.generated.js"',
    'import { createRequestContext } from "./context.js"',
    "",
    "export function registerGeneratedRoutes(app: Koa) {",
    "  registerLoomStackRoutes(app, { actionRegistry, queryRegistry, createRequestContext })",
    "}"
  ])
}

function contextDocument(project: LoomStackProject) {
  return {
    generatedBy: "loomstack",
    doNotEdit: true,
    project: {
      name: project.config.appName,
      frontend: project.config.frontend,
      backend: project.config.backend,
      database: project.config.database,
      packageManager: project.config.packageManager
    },
    paths: { features: project.config.featuresDir, web: "apps/web", api: "apps/api" },
    commands: {
      dev: "pnpm dev",
      verify: "pnpm loomstack verify",
      test: "pnpm test",
      typecheck: "pnpm typecheck"
    },
    features: project.features.map((feature) => feature.id),
    rules: [
      { id: "feature-source-of-truth", description: "Product behavior lives in features/*.", errorCode: null },
      { id: "no-db-in-ui", description: "React UI files may not import database code.", errorCode: "loomstack2001" },
      { id: "no-fetch-in-ui", description: "React UI files may not call raw fetch.", errorCode: "loomstack2002" },
      { id: "transport-independent-features", description: "Feature logic may not import Koa.", errorCode: "loomstack2003" }
    ]
  }
}

function graphDocument(project: LoomStackProject) {
  return { generatedBy: "loomstack", doNotEdit: true, ...project.graph }
}

function commandsDocument() {
  return {
    generatedBy: "loomstack",
    doNotEdit: true,
    commands: {
      install: "pnpm install",
      dev: "pnpm dev",
      test: "pnpm test",
      typecheck: "pnpm typecheck",
      verify: "pnpm loomstack verify",
      verifyFeature: "pnpm loomstack verify feature <feature>"
    }
  }
}

function errorsDocument() {
  return {
    generatedBy: "loomstack",
    doNotEdit: true,
    errors: Object.fromEntries(Object.entries(ERROR_CATALOG).sort(([a], [b]) => a.localeCompare(b)).map(([code, definition]) => [code, {
      title: definition.title,
      repair: definition.repair,
      docs: definition.docs
    }]))
  }
}

export function renderGeneratedFiles(project: LoomStackProject): Record<string, string> {
  const generatedDir = project.config.generatedDir
  const entries: Array<[string, string]> = [
    ["apps/web/src/routes.generated.tsx", reactRoutes(project)],
    ["apps/web/src/api-client.generated.ts", apiClient(project)],
    ["apps/api/src/routes.generated.ts", koaRoutes()],
    ["shared/generated/feature-registry.generated.ts", featureRegistry(project)],
    ["shared/generated/schema-registry.generated.ts", schemaRegistry(project)],
    ["shared/generated/action-registry.generated.ts", actionRegistry(project)],
    ["shared/generated/query-registry.generated.ts", queryRegistry(project)],
    [`${generatedDir}/context.json`, stableJson(contextDocument(project))],
    [`${generatedDir}/graph.json`, stableJson(graphDocument(project))],
    [`${generatedDir}/commands.json`, stableJson(commandsDocument())],
    [`${generatedDir}/errors.json`, stableJson(errorsDocument())]
  ]
  return Object.fromEntries(entries.sort(([a], [b]) => a.localeCompare(b)))
}

export function generatedManifest(files: Record<string, string>): GeneratedFilesManifest {
  return {
    generatedBy: "loomstack",
    doNotEdit: true,
    files: Object.entries(files).map(([path, content]) => ({ path, sha256: sha256(content) })).sort((a, b) => a.path.localeCompare(b.path))
  }
}

export interface ProjectGenerationResult {
  generatedFiles: string[]
}

function generationContractErrors(project: LoomStackProject) {
  const errors = []
  const operationOwners = new Map<string, string>()
  for (const feature of project.features) {
    const actionNames = new Set(feature.actions.map((item) => item.name))
    const queryNames = new Set(feature.queries.map((item) => item.name))
    const viewNames = new Set(feature.views.map((item) => item.name))
    const schemaNames = new Set(feature.schemas.map((item) => item.name))
    for (const name of feature.manifest.actions) {
      if (!actionNames.has(name)) errors.push(frameworkError("loomstack1003", { message: `Manifest action "${name}" is not exported.`, file: feature.manifestPath }))
    }
    for (const operation of feature.actions) {
      if (!feature.manifest.actions.includes(operation.name)) errors.push(frameworkError("loomstack1004", { message: `Exported action "${operation.name}" is missing from feature.yaml.`, file: operation.file }))
    }
    for (const name of feature.manifest.queries) {
      if (!queryNames.has(name)) errors.push(frameworkError("loomstack1007", { message: `Manifest query "${name}" is not exported.`, file: feature.manifestPath }))
    }
    for (const operation of feature.queries) {
      if (!feature.manifest.queries.includes(operation.name)) errors.push(frameworkError("loomstack1008", { message: `Exported query "${operation.name}" is missing from feature.yaml.`, file: operation.file }))
    }
    for (const route of feature.manifest.routes) {
      if (!viewNames.has(route.view)) errors.push(frameworkError("loomstack1009", { message: `Route "${route.id}" references missing view "${route.view}".`, file: feature.manifestPath }))
    }
    for (const name of feature.manifest.entities) {
      if (!schemaNames.has(name)) errors.push(frameworkError("loomstack1010", { message: `Manifest entity "${name}" is not exported by model.schema.ts.`, file: feature.manifestPath }))
    }
    for (const [kind, operations] of [["action", feature.actions], ["query", feature.queries]] as const) {
      for (const operation of operations) {
        const owner = operationOwners.get(operation.name)
        if (owner) errors.push(frameworkError(kind === "action" ? "loomstack1004" : "loomstack1008", { message: `Operation "${operation.name}" is also exported by ${owner}.`, file: operation.file }))
        else operationOwners.set(operation.name, feature.id)
      }
    }
  }
  return errors
}

export function generateProject(root: string): ProjectGenerationResult {
  const result = scanProject(root)
  if (!result.project || result.errors.length > 0) throw new GeneratorFailure(result.errors)
  const contractErrors = generationContractErrors(result.project)
  if (contractErrors.length > 0) throw new GeneratorFailure(contractErrors)
  const files = renderGeneratedFiles(result.project)
  for (const [path, content] of Object.entries(files)) writeProjectFile(result.project.root, path, content)
  const manifestPath = `${result.project.config.generatedDir}/generated-files.json`
  writeProjectFile(result.project.root, manifestPath, stableJson(generatedManifest(files)))
  return { generatedFiles: [...Object.keys(files), manifestPath].sort() }
}

export function readGeneratedManifest(project: LoomStackProject): GeneratedFilesManifest | undefined {
  const path = join(project.root, project.config.generatedDir, "generated-files.json")
  if (!existsSync(path)) return undefined
  try {
    return JSON.parse(readFileSync(path, "utf8")) as GeneratedFilesManifest
  } catch {
    return undefined
  }
}
