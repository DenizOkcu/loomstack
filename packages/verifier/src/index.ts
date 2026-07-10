import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { frameworkError, scanProject, toProjectPath } from "@loom/core"
import type { FrameworkError, LoomProject, ScannedFeature, VerifyResult } from "@loom/core"
import { GENERATED_SOURCE_MARKER, generatedManifest, readGeneratedManifest, renderGeneratedFiles, sha256 } from "@loom/generator"

function filesRecursively(directory: string): string[] {
  if (!existsSync(directory)) return []
  return readdirSync(directory).sort().flatMap((name) => {
    const path = join(directory, name)
    return statSync(path).isDirectory() ? filesRecursively(path) : [path]
  })
}

function belongsToScope(error: FrameworkError, feature?: string): boolean {
  if (!feature || !error.file) return true
  return error.file.startsWith(`features/${feature}/`) || error.relatedFiles?.some((file) => file.startsWith(`features/${feature}/`)) === true
}

function contractErrors(feature: ScannedFeature): FrameworkError[] {
  const errors: FrameworkError[] = []
  const actions = new Set(feature.actions.map((item) => item.name))
  const declaredActions = new Set(feature.manifest.actions)
  for (const name of [...declaredActions].sort()) {
    if (!actions.has(name)) errors.push(frameworkError("loom1003", { message: `Manifest action "${name}" is not exported.`, file: feature.manifestPath }))
  }
  for (const action of feature.actions) {
    if (!declaredActions.has(action.name)) errors.push(frameworkError("loom1004", { message: `Exported action "${action.name}" is missing from feature.yaml.`, file: action.file, relatedFiles: [feature.manifestPath] }))
  }

  const queries = new Set(feature.queries.map((item) => item.name))
  const declaredQueries = new Set(feature.manifest.queries)
  for (const name of [...declaredQueries].sort()) {
    if (!queries.has(name)) errors.push(frameworkError("loom1007", { message: `Manifest query "${name}" is not exported.`, file: feature.manifestPath }))
  }
  for (const query of feature.queries) {
    if (!declaredQueries.has(query.name)) errors.push(frameworkError("loom1008", { message: `Exported query "${query.name}" is missing from feature.yaml.`, file: query.file, relatedFiles: [feature.manifestPath] }))
  }

  const views = new Set(feature.views.map((item) => item.name))
  for (const route of feature.manifest.routes) {
    if (!views.has(route.view)) errors.push(frameworkError("loom1009", { message: `Route "${route.id}" references missing view "${route.view}".`, file: feature.manifestPath }))
  }

  const schemas = new Set(feature.schemas.map((item) => item.name))
  for (const entity of feature.manifest.entities) {
    if (!schemas.has(entity)) errors.push(frameworkError("loom1010", { message: `Manifest entity "${entity}" is not exported by model.schema.ts.`, file: feature.manifestPath }))
  }
  return errors
}

function duplicateOperationErrors(project: LoomProject): FrameworkError[] {
  const errors: FrameworkError[] = []
  for (const key of ["actions", "queries"] as const) {
    const owners = new Map<string, string>()
    for (const feature of project.features) {
      for (const item of feature[key]) {
        const owner = owners.get(item.name)
        if (owner) {
          errors.push(frameworkError(key === "actions" ? "loom1004" : "loom1008", {
            message: `Duplicate ${key.slice(0, -1)} name "${item.name}" is exported by ${owner} and ${feature.id}.`,
            file: item.file
          }))
        } else owners.set(item.name, feature.id)
      }
    }
  }
  return errors
}

function boundaryErrors(project: LoomProject, scope?: string): FrameworkError[] {
  const errors: FrameworkError[] = []
  const features = scope ? project.features.filter((feature) => feature.id === scope) : project.features
  for (const feature of features) {
    const files = filesRecursively(join(project.root, feature.directory)).filter((path) => /\.(ts|tsx)$/.test(path))
    for (const absolute of files) {
      const file = toProjectPath(relative(project.root, absolute))
      const source = readFileSync(absolute, "utf8")
      const imports = [...source.matchAll(/(?:from\s*|import\s*)["']([^"']+)["']/g)].map((match) => match[1] ?? "")
      const isUi = file.includes("/ui/")
      if (isUi && imports.some((specifier) => /(^|[\/@.-])(db|database|sqlite)([\/@.-]|$)/i.test(specifier))) {
        errors.push(frameworkError("loom2001", { file }))
      }
      if (isUi && /\bfetch\s*\(/.test(source)) errors.push(frameworkError("loom2002", { file }))
      if ((file.includes("/actions/") || file.includes("/queries/") || isUi) && imports.some((specifier) => specifier === "koa" || specifier.startsWith("@koa/"))) {
        errors.push(frameworkError("loom2003", { file }))
      }
    }
  }
  return errors
}

function generatedErrors(project: LoomProject): FrameworkError[] {
  const errors: FrameworkError[] = []
  let expected: Record<string, string>
  try {
    expected = renderGeneratedFiles(project)
  } catch {
    return errors
  }
  const expectedManifest = generatedManifest(expected)
  const recorded = readGeneratedManifest(project)
  const manifestPath = `${project.config.generatedDir}/generated-files.json`
  if (!recorded || recorded.generatedBy !== "loom" || recorded.doNotEdit !== true || !Array.isArray(recorded.files)) {
    return [frameworkError("loom4002", { message: `${manifestPath} is missing or invalid.`, file: manifestPath })]
  }
  const records = new Map(recorded.files.map((item) => [item.path, item.sha256]))

  for (const [path, expectedContent] of Object.entries(expected)) {
    const absolute = join(project.root, path)
    if (!existsSync(absolute)) {
      errors.push(frameworkError("loom4002", { message: `Generated file is missing: ${path}.`, file: path }))
      continue
    }
    const actualContent = readFileSync(absolute, "utf8")
    const isSource = /\.(ts|tsx)$/.test(path)
    let marked = false
    if (isSource) marked = actualContent.startsWith(GENERATED_SOURCE_MARKER)
    else {
      try {
        const json = JSON.parse(actualContent) as { generatedBy?: string; doNotEdit?: boolean }
        marked = json.generatedBy === "loom" && json.doNotEdit === true
      } catch {
        marked = false
      }
    }
    if (!marked) {
      errors.push(frameworkError("loom4001", { message: `Generated marker is missing from ${path}.`, file: path }))
      continue
    }

    const actualHash = sha256(actualContent)
    const recordedHash = records.get(path)
    const expectedHash = sha256(expectedContent)
    if (!recordedHash) {
      errors.push(frameworkError("loom4002", { message: `${path} is not tracked in ${manifestPath}.`, file: path }))
    } else if (actualHash !== recordedHash && actualHash !== expectedHash) {
      errors.push(frameworkError("loom4001", { file: path }))
    } else if (actualHash !== expectedHash || recordedHash !== expectedHash) {
      errors.push(frameworkError("loom4002", { message: `${path} is stale.`, file: path }))
    }
  }

  const expectedPaths = new Set(expectedManifest.files.map((item) => item.path))
  for (const record of recorded.files) {
    if (!expectedPaths.has(record.path)) errors.push(frameworkError("loom4002", { message: `Generated manifest tracks obsolete file ${record.path}.`, file: manifestPath, relatedFiles: [record.path] }))
  }
  return errors
}

export interface VerifyOptions {
  feature?: string
  generated?: boolean
}

export function verifyProject(root: string, options: VerifyOptions = {}): VerifyResult {
  const scanned = scanProject(root)
  const errors = scanned.errors.filter((error) => belongsToScope(error, options.feature))
  if (!scanned.project) return { ok: false, errors, warnings: [] }

  const selected = options.feature
    ? scanned.project.features.filter((feature) => feature.id === options.feature)
    : scanned.project.features
  if (options.feature && selected.length === 0) {
    errors.push(frameworkError("loom1002", { message: `Unknown feature: ${options.feature}.`, file: `${scanned.project.config.featuresDir}/${options.feature}` }))
  }
  for (const feature of selected) errors.push(...contractErrors(feature))
  errors.push(...duplicateOperationErrors(scanned.project).filter((error) => belongsToScope(error, options.feature)))
  errors.push(...boundaryErrors(scanned.project, options.feature))
  if (options.generated !== false) errors.push(...generatedErrors(scanned.project))

  const unique = [...new Map(errors.map((error) => [`${error.code}:${error.file ?? ""}:${error.message}`, error])).values()]
    .sort((a, b) => (a.file ?? "").localeCompare(b.file ?? "") || a.code.localeCompare(b.code))
  return { ok: unique.length === 0, errors: unique, warnings: [] }
}
