export interface FeatureRoute {
  id: string
  path: string
  view: string
}

export interface FeatureManifest {
  id: string
  name: string
  description?: string
  entities: string[]
  routes: FeatureRoute[]
  actions: string[]
  queries: string[]
  permissions?: Record<string, string>
}

export interface LoomProjectConfig {
  appName: string
  packageManager: "pnpm"
  frontend: "react"
  backend: "koa"
  database: "postgres"
  featuresDir: string
  generatedDir: string
}

export interface FrameworkError {
  code: string
  severity: "error" | "warning"
  message: string
  file?: string
  location?: { line?: number; column?: number }
  repair: string
  relatedFiles?: string[]
  docs?: string
}

export interface CommandResult<T = Record<string, unknown>> {
  ok: boolean
  data?: T
  errors?: FrameworkError[]
}

export interface NamedFile {
  name: string
  file: string
}

export interface ViewFile extends NamedFile {
  route?: string
}

export interface ScannedFeature {
  id: string
  directory: string
  manifestPath: string
  manifest: FeatureManifest
  schemas: NamedFile[]
  actions: NamedFile[]
  queries: NamedFile[]
  views: ViewFile[]
  tests: string[]
}

export interface FeatureGraphNode {
  id: string
  manifest: string
  entities: string[]
  actions: NamedFile[]
  queries: NamedFile[]
  views: ViewFile[]
  tests: string[]
  routes: string[]
}

export interface FeatureGraph {
  features: FeatureGraphNode[]
  dependencies: Array<{ from: string; to: string }>
}

export interface LoomProject {
  root: string
  configPath: string
  config: LoomProjectConfig
  features: ScannedFeature[]
  graph: FeatureGraph
}

export interface ScanResult {
  project?: LoomProject
  errors: FrameworkError[]
}

export interface VerifyResult {
  ok: boolean
  errors: FrameworkError[]
  warnings: FrameworkError[]
}

export interface GeneratedFileRecord {
  path: string
  sha256: string
}

export interface GeneratedFilesManifest {
  generatedBy: "loom"
  doNotEdit: true
  files: GeneratedFileRecord[]
}
