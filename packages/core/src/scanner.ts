import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { dirname, join, relative, resolve, sep } from "node:path"
import { parse } from "yaml"
import { frameworkError } from "./errors.js"
import type {
  FeatureGraph,
  FeatureManifest,
  LoomProjectConfig,
  NamedFile,
  ScanResult,
  ScannedFeature,
  ViewFile
} from "./types.js"

const FEATURE_ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/
const DEFAULT_CONFIG: Omit<LoomProjectConfig, "appName"> = {
  packageManager: "pnpm",
  frontend: "react",
  backend: "koa",
  database: "sqlite",
  featuresDir: "features",
  generatedDir: ".loom"
}

export function toProjectPath(path: string): string {
  return path.split(sep).join("/")
}

export function discoverProjectRoot(start: string): string | undefined {
  let current = resolve(start)
  while (true) {
    if (existsSync(join(current, "loom.config.ts"))) return current
    const parent = dirname(current)
    if (parent === current) return undefined
    current = parent
  }
}

function quotedValue(source: string, key: string): string | undefined {
  const match = source.match(new RegExp(`${key}\\s*:\\s*["']([^"']+)["']`))
  return match?.[1]
}

export function loadProjectConfig(root: string): { config?: LoomProjectConfig; errors: ReturnType<typeof frameworkError>[] } {
  const configPath = join(root, "loom.config.ts")
  if (!existsSync(configPath)) {
    return { errors: [frameworkError("loom5001", { file: "loom.config.ts" })] }
  }

  const source = readFileSync(configPath, "utf8")
  const appName = quotedValue(source, "appName")
  const values = {
    packageManager: quotedValue(source, "packageManager"),
    frontend: quotedValue(source, "frontend"),
    backend: quotedValue(source, "backend"),
    database: quotedValue(source, "database"),
    featuresDir: quotedValue(source, "featuresDir"),
    generatedDir: quotedValue(source, "generatedDir")
  }

  if (!appName || values.packageManager !== DEFAULT_CONFIG.packageManager || values.frontend !== DEFAULT_CONFIG.frontend || values.backend !== DEFAULT_CONFIG.backend || values.database !== DEFAULT_CONFIG.database || values.featuresDir !== DEFAULT_CONFIG.featuresDir || values.generatedDir !== DEFAULT_CONFIG.generatedDir) {
    return { errors: [frameworkError("loom5003", { file: "loom.config.ts" })] }
  }

  return {
    config: {
      appName,
      packageManager: "pnpm",
      frontend: "react",
      backend: "koa",
      database: "sqlite",
      featuresDir: values.featuresDir,
      generatedDir: values.generatedDir
    },
    errors: []
  }
}

function filesIn(directory: string, suffix: string): string[] {
  if (!existsSync(directory)) return []
  return readdirSync(directory)
    .filter((name) => name.endsWith(suffix) && statSync(join(directory, name)).isFile())
    .sort()
    .map((name) => join(directory, name))
}

function discoverNamedFiles(root: string, directory: string, suffix: string, kind: "action" | "query"): NamedFile[] {
  const expression = new RegExp(`export\\s+const\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*${kind}\\b`)
  return filesIn(directory, suffix).flatMap((file) => {
    const match = readFileSync(file, "utf8").match(expression)
    return match?.[1] ? [{ name: match[1], file: toProjectPath(relative(root, file)) }] : []
  })
}

function discoverViews(root: string, directory: string): ViewFile[] {
  return filesIn(directory, ".view.tsx").flatMap((file) => {
    const source = readFileSync(file, "utf8")
    const loomName = source.match(/\bname\s*:\s*["']([A-Za-z_$][\w$]*)["']/)?.[1]
    const namedExport = source.match(/export\s+const\s+([A-Za-z_$][\w$]*)\s*=\s*view\s*\(/)?.[1]
    const name = loomName ?? namedExport
    return name ? [{ name, file: toProjectPath(relative(root, file)) }] : []
  })
}

function discoverSchemas(root: string, featureDirectory: string): NamedFile[] {
  const file = join(featureDirectory, "model.schema.ts")
  if (!existsSync(file)) return []
  const source = readFileSync(file, "utf8")
  return [...source.matchAll(/export\s+const\s+([A-Za-z_$][\w$]*)Schema\s*=\s*entity\s*\(\s*["']([^"']+)["']/g)]
    .map((match) => ({ name: match[2] ?? match[1] ?? "", file: toProjectPath(relative(root, file)) }))
    .filter((item) => item.name)
}

function validateManifest(value: unknown, manifestPath: string, folderName: string) {
  const errors: ReturnType<typeof frameworkError>[] = []
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { errors: [frameworkError("loom1002", { file: manifestPath })] }
  }
  const input = value as Record<string, unknown>
  const requiredStrings = ["id", "name"] as const
  for (const key of requiredStrings) {
    if (typeof input[key] !== "string" || input[key].length === 0) {
      errors.push(frameworkError("loom1002", { message: `Missing or invalid required field: ${key}.`, file: manifestPath }))
    }
  }
  for (const key of ["entities", "routes", "actions", "queries"] as const) {
    if (!Array.isArray(input[key])) {
      errors.push(frameworkError("loom1002", { message: `Missing or invalid required array: ${key}.`, file: manifestPath }))
    }
  }
  if (errors.length > 0) return { errors }

  const id = input.id as string
  if (!FEATURE_ID.test(id)) errors.push(frameworkError("loom1011", { file: manifestPath }))
  if (id !== folderName) {
    errors.push(frameworkError("loom1001", { message: `Feature ID "${id}" does not match folder "${folderName}".`, file: manifestPath }))
  }
  if (input.description !== undefined && typeof input.description !== "string") {
    errors.push(frameworkError("loom1002", { message: "description must be a string when provided.", file: manifestPath }))
  }
  if (input.permissions !== undefined && (
    !input.permissions || typeof input.permissions !== "object" || Array.isArray(input.permissions)
    || Object.values(input.permissions as Record<string, unknown>).some((value) => typeof value !== "string")
  )) {
    errors.push(frameworkError("loom1002", { message: "permissions must map string names to string requirements.", file: manifestPath }))
  }
  for (const key of ["entities", "actions", "queries"] as const) {
    const values = input[key] as unknown[]
    if (values.some((value) => typeof value !== "string" || value.length === 0) || new Set(values).size !== values.length) {
      errors.push(frameworkError("loom1002", { message: `${key} must contain unique, non-empty strings.`, file: manifestPath }))
    }
  }
  if ((input.entities as string[]).some((name) => !/^[A-Z][A-Za-z0-9]*$/.test(name))) {
    errors.push(frameworkError("loom1002", { message: "Entity names must be PascalCase identifiers.", file: manifestPath }))
  }
  for (const key of ["actions", "queries"] as const) {
    if ((input[key] as string[]).some((name) => !/^[A-Za-z_$][\w$]*$/.test(name))) {
      errors.push(frameworkError("loom1002", { message: `${key} names must be JavaScript identifiers.`, file: manifestPath }))
    }
  }

  const routes = input.routes as unknown[]
  const routeIds = new Set<string>()
  for (const route of routes) {
    if (!route || typeof route !== "object") {
      errors.push(frameworkError("loom1002", { message: "Every route must be an object with id, path, and view.", file: manifestPath }))
      continue
    }
    const candidate = route as Record<string, unknown>
    if (["id", "path", "view"].some((key) => typeof candidate[key] !== "string" || (candidate[key] as string).length === 0)) {
      errors.push(frameworkError("loom1002", { message: "Every route requires string id, path, and view fields.", file: manifestPath }))
    } else if (!(candidate.path as string).startsWith("/") || !/^[A-Za-z_$][\w$]*$/.test(candidate.view as string)) {
      errors.push(frameworkError("loom1002", { message: "Route paths must start with / and route views must be JavaScript identifiers.", file: manifestPath }))
    }
    if (typeof candidate.id === "string") {
      if (routeIds.has(candidate.id)) errors.push(frameworkError("loom1002", { message: `Duplicate route ID: ${candidate.id}.`, file: manifestPath }))
      routeIds.add(candidate.id)
    }
  }

  if (errors.length > 0) return { errors }
  return { manifest: input as unknown as FeatureManifest, errors }
}

export function scanProject(rootInput: string): ScanResult {
  const root = resolve(rootInput)
  const loaded = loadProjectConfig(root)
  if (!loaded.config) return { errors: loaded.errors }
  const config = loaded.config
  const featuresDirectory = join(root, config.featuresDir)
  const errors = [...loaded.errors]
  const features: ScannedFeature[] = []

  if (existsSync(featuresDirectory)) {
    const featureFolders = readdirSync(featuresDirectory)
      .filter((name) => statSync(join(featuresDirectory, name)).isDirectory())
      .sort()

    for (const folderName of featureFolders) {
      const directory = join(featuresDirectory, folderName)
      const absoluteManifest = join(directory, "feature.yaml")
      if (!existsSync(absoluteManifest)) continue
      const manifestPath = toProjectPath(relative(root, absoluteManifest))
      let raw: unknown
      try {
        raw = parse(readFileSync(absoluteManifest, "utf8"))
      } catch (error) {
        errors.push(frameworkError("loom1006", { message: `Invalid YAML: ${error instanceof Error ? error.message : String(error)}`, file: manifestPath }))
        continue
      }
      const validated = validateManifest(raw, manifestPath, folderName)
      errors.push(...validated.errors)
      if (!validated.manifest) continue

      const feature: ScannedFeature = {
        id: folderName,
        directory: toProjectPath(relative(root, directory)),
        manifestPath,
        manifest: validated.manifest,
        schemas: discoverSchemas(root, directory),
        actions: discoverNamedFiles(root, join(directory, "actions"), ".action.ts", "action"),
        queries: discoverNamedFiles(root, join(directory, "queries"), ".query.ts", "query"),
        views: discoverViews(root, join(directory, "ui")),
        tests: filesIn(join(directory, "tests"), ".test.ts").map((file) => toProjectPath(relative(root, file)))
      }
      feature.views = feature.views.map((view) => {
        const route = feature.manifest.routes.find((candidate) => candidate.view === view.name)?.path
        return route ? { ...view, route } : view
      })
      features.push(feature)
    }
  }

  const paths = new Map<string, string>()
  for (const feature of features) {
    for (const route of feature.manifest.routes) {
      const owner = paths.get(route.path)
      if (owner) {
        errors.push(frameworkError("loom1005", {
          message: `Route path "${route.path}" is declared by both ${owner} and ${feature.id}.`,
          file: feature.manifestPath,
          relatedFiles: [features.find((item) => item.id === owner)?.manifestPath ?? owner]
        }))
      } else paths.set(route.path, feature.id)
    }
  }

  const graph: FeatureGraph = {
    features: features.map((feature) => ({
      id: feature.id,
      manifest: feature.manifestPath,
      entities: [...feature.manifest.entities].sort(),
      actions: [...feature.actions].sort((a, b) => a.name.localeCompare(b.name)),
      queries: [...feature.queries].sort((a, b) => a.name.localeCompare(b.name)),
      views: [...feature.views].sort((a, b) => a.name.localeCompare(b.name)),
      tests: [...feature.tests].sort(),
      routes: feature.manifest.routes.map((route) => route.path).sort()
    })),
    dependencies: []
  }

  return {
    project: { root, configPath: "loom.config.ts", config, features, graph },
    errors
  }
}
