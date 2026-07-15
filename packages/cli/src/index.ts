#!/usr/bin/env node
import { spawnSync } from "node:child_process"
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync } from "node:fs"
import { dirname, relative, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { Command, CommanderError } from "commander"
import {
  discoverProjectRoot,
  ERROR_CATALOG,
  explainError,
  frameworkError,
  scanProject,
  toProjectPath
} from "@loomstack/core"
import type { FrameworkError, LoomStackProject, ScannedFeature } from "@loomstack/core"
import { createApp, createAppInPlace, createFeature, generateProject, GeneratorFailure } from "@loomstack/generator"
import { verifyProject } from "@loomstack/verifier"

export interface CliIO {
  stdout: (text: string) => void
  stderr: (text: string) => void
}

interface GlobalOptions {
  json?: boolean
  cwd?: string
  quiet?: boolean
  verbose?: boolean
}

function errorsFrom(error: unknown): FrameworkError[] {
  if (error instanceof GeneratorFailure) return error.errors
  return [frameworkError("loomstack5003", { message: error instanceof Error ? error.message : String(error) })]
}

function projectRoot(cwd: string): string {
  const root = discoverProjectRoot(cwd)
  if (!root) throw new GeneratorFailure([frameworkError("loomstack5001", { file: "loomstack.config.ts" })])
  return root
}

function projectOrThrow(root: string): LoomStackProject {
  const result = scanProject(root)
  if (!result.project || result.errors.length) throw new GeneratorFailure(result.errors)
  return result.project
}

function projectContext(project: LoomStackProject) {
  return {
    project: {
      name: project.config.appName,
      frontend: project.config.frontend,
      backend: project.config.backend,
      database: project.config.database,
      packageManager: project.config.packageManager
    },
    commands: { dev: "pnpm dev", verify: "pnpm loomstack verify", test: "pnpm test", typecheck: "pnpm typecheck" },
    features: project.features.map((feature) => feature.id),
    rules: [
      "Product behavior lives in features/*/actions or features/*/queries.",
      "React views may not import database code or call raw fetch.",
      "Feature logic may not import Koa.",
      "Generated files must never be edited manually."
    ]
  }
}

function featureContext(feature: ScannedFeature) {
  return {
    feature: feature.id,
    manifest: feature.manifestPath,
    description: feature.manifest.description ?? "",
    entities: feature.manifest.entities,
    actions: feature.actions,
    queries: feature.queries,
    views: feature.views,
    tests: feature.tests,
    rules: [
      "Mutations belong in actions/*.action.ts.",
      "Reads belong in queries/*.query.ts.",
      "Do not access the database or raw fetch from UI files.",
      `Verify with pnpm loomstack verify feature ${feature.id} --json.`
    ]
  }
}

function affected(project: LoomStackProject, fileInput: string) {
  const absolute = resolve(project.root, fileInput)
  const file = toProjectPath(relative(project.root, absolute))
  const feature = project.features.find((candidate) => file === candidate.directory || file.startsWith(`${candidate.directory}/`))
  if (!feature) {
    return {
      file,
      feature: null,
      affected: project.features.flatMap((candidate) => [candidate.manifestPath]),
      recommendedVerification: "pnpm loomstack verify"
    }
  }
  const authored = [
    feature.manifestPath,
    `${feature.directory}/model.schema.ts`,
    `${feature.directory}/permissions.policy.ts`,
    ...feature.actions.map((item) => item.file),
    ...feature.queries.map((item) => item.file),
    ...feature.views.map((item) => item.file),
    ...feature.tests
  ].filter((path, index, all) => path !== file && all.indexOf(path) === index).sort()
  return {
    file,
    feature: feature.id,
    affected: authored,
    recommendedVerification: `pnpm loomstack verify feature ${feature.id}`
  }
}

function provisionLocalPackages(root: string): boolean {
  const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
  const vendor = resolve(packageRoot, "vendor")
  if (!existsSync(vendor)) return false
  const tarballs = readdirSync(vendor).filter((name) => name.endsWith(".tgz")).sort()
  if (tarballs.length === 0) return false

  const local = resolve(root, ".loomstack/local-packages")
  mkdirSync(local, { recursive: true })
  for (const tarball of tarballs) cpSync(resolve(vendor, tarball), resolve(local, tarball))

  const cliTarget = resolve(local, "cli")
  mkdirSync(cliTarget, { recursive: true })
  cpSync(resolve(packageRoot, "dist"), resolve(cliTarget, "dist"), { recursive: true })
  const cliPackage = JSON.parse(readFileSync(resolve(packageRoot, "package.json"), "utf8")) as Record<string, unknown>
  delete cliPackage.devDependencies
  delete cliPackage.scripts
  writeFileSync(resolve(cliTarget, "package.json"), `${JSON.stringify(cliPackage, null, 2)}\n`)

  const overrides: Record<string, string> = {
    "@loomstack/cli": "file:.loomstack/local-packages/cli"
  }
  for (const tarball of tarballs) {
    const match = tarball.match(/^loomstack-(koa|postgres|react|runtime)-/)
    if (match?.[1]) overrides[`@loomstack/${match[1]}`] = `file:.loomstack/local-packages/${tarball}`
  }
  const workspacePath = resolve(root, "pnpm-workspace.yaml")
  const workspace = readFileSync(workspacePath, "utf8").replace(/\noverrides:\n(?: {2}.+\n)*/g, "\n")
  const overrideYaml = Object.entries(overrides).sort(([a], [b]) => a.localeCompare(b))
    .map(([name, path]) => `  "${name}": "${path}"`).join("\n")
  writeFileSync(workspacePath, `${workspace.trimEnd()}\n\noverrides:\n${overrideYaml}\n`)
  return true
}

function humanErrors(errors: FrameworkError[]): string {
  return errors.map((error) => [
    `${error.code}: ${error.message}`,
    error.file ? `  File: ${error.file}` : undefined,
    `  Repair: ${error.repair}`
  ].filter(Boolean).join("\n")).join("\n")
}

export async function runCli(argv: string[], io: CliIO = {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text)
}): Promise<number> {
  let exitCode = 0
  const program = new Command()
  program
    .name("loomstack")
    .description("Agent-operable fullstack framework")
    .version("0.0.1")
    .option("--json", "emit machine-readable JSON")
    .option("--cwd <path>", "run against a specific path")
    .option("--quiet", "suppress human success output")
    .option("--verbose", "include diagnostics")
    .exitOverride()
    .configureOutput({ writeOut: io.stdout, writeErr: io.stderr })

  function globals(): GlobalOptions {
    return program.opts<GlobalOptions>()
  }

  function cwd(): string {
    return resolve(globals().cwd ?? process.cwd())
  }

  function emit(payload: Record<string, unknown>, human: string, failure = false): void {
    if (failure) exitCode = 1
    if (globals().json) io.stdout(`${JSON.stringify(payload, null, 2)}\n`)
    else if (!globals().quiet || failure) io[failure ? "stderr" : "stdout"](`${human}\n`)
  }

  async function execute(run: () => Record<string, unknown> | Promise<Record<string, unknown>>, human: (result: Record<string, unknown>) => string): Promise<void> {
    try {
      const result = await run()
      emit({ ok: true, ...result }, human(result))
    } catch (error) {
      const errors = errorsFrom(error)
      emit({ ok: false, errors }, humanErrors(errors), true)
    }
  }

  const create = program.command("create").description("create canonical loomstack resources")
  create.command("app <name>").description("create a loomstack application").action(async (name: string) => {
    await execute(() => ({ ...createApp(cwd(), name) }), (result) => `Created loomstack app: ${result.appName as string}\nNext steps:\n  ${(result.nextCommands as string[]).join("\n  ")}`)
  })
  create.command("feature <name>").description("create a canonical feature").action(async (name: string) => {
    await execute(() => {
      const root = projectRoot(cwd())
      const result = createFeature(root, name)
      generateProject(root)
      return { feature: name, ...result }
    }, (result) => `Created feature: ${result.feature as string}`)
  })

  program.command("generate").description("regenerate all derived files").action(async () => {
    await execute(() => ({ ...generateProject(projectRoot(cwd())) }), (result) => `Generated ${(result.generatedFiles as string[]).length} files.`)
  })

  function compose(action: string, args: string[]): Record<string, unknown> {
    const root = projectRoot(cwd())
    const result = spawnSync("docker", ["compose", ...args], { cwd: root, encoding: "utf8" })
    if (result.status !== 0) {
      const detail = result.stderr.trim() || result.stdout.trim() || "Docker Compose failed to run."
      throw new GeneratorFailure([frameworkError("loomstack5003", {
        message: `${action} failed: ${detail}`,
        file: "compose.yaml"
      })])
    }
    return { action, root, output: result.stdout.trim() || null }
  }

  program.command("init")
    .description("initialize the project, start development, and print agent guidance")
    .option("--no-start", "initialize without starting containers")
    .option("--skip-install", "skip dependency installation")
    .action(async (options: { start: boolean; skipInstall?: boolean }) => {
      await execute(() => {
        const existingRoot = discoverProjectRoot(cwd())
        const created = existingRoot ? null : createAppInPlace(cwd())
        const root = existingRoot ?? created!.root
        const localPackages = provisionLocalPackages(root)

        let dependenciesInstalled = existsSync(resolve(root, "pnpm-lock.yaml"))
        if (!dependenciesInstalled && !options.skipInstall) {
          const install = spawnSync("pnpm", ["install"], { cwd: root, encoding: "utf8" })
          if (install.status !== 0) {
            const detail = install.stderr.trim() || install.stdout.trim() || "pnpm install failed."
            throw new GeneratorFailure([frameworkError("loomstack5003", {
              message: `Dependency installation failed: ${detail}`,
              file: "package.json"
            })])
          }
          dependenciesInstalled = true
        }

        const project = projectOrThrow(root)
        const started = options.start && dependenciesInstalled
          ? compose("start", ["up", "--detach", "--build", "--wait"])
          : null
        const examplePrompt = "Build a weather app where users can search for a city, view current conditions, and see a seven-day forecast. Read AGENTS.md first and use the LoomStack workflow."
        return {
          initialized: true,
          projectCreated: Boolean(created),
          project: project.config.appName,
          projectRoot: root,
          dependenciesInstalled,
          localPackages,
          containersStarted: Boolean(started),
          ...(created ? { createdFiles: created.createdFiles } : {}),
          agentGuidance: {
            instruction: "Open this directory in your preferred CLI coding agent, then describe the feature you want to build.",
            exampleCommands: ["claude", "codex", "pi"],
            examplePrompt
          }
        }
      }, (result) => {
        const guidance = result.agentGuidance as { instruction: string; exampleCommands: string[]; examplePrompt: string }
        return [
          `${result.projectCreated ? "Created" : "Initialized"} LoomStack project: ${result.project as string}`,
          `Project: ${result.projectRoot as string}`,
          `Dependencies: ${result.dependenciesInstalled ? "installed" : "skipped"}`,
          `Containers: ${result.containersStarted ? "running" : "not started"}`,
          "",
          guidance.instruction,
          `For example, start one of: ${guidance.exampleCommands.join(", ")}`,
          "",
          "Example request:",
          guidance.examplePrompt
        ].join("\n")
      })
    })

  const dev = program.command("dev").description("manage the Docker development stack")
  dev.command("start").description("build and start web, API, and database containers").action(async () => {
    await execute(() => compose("start", ["up", "--detach", "--build", "--wait"]), () => "LoomStack development containers started.")
  })
  dev.command("refresh").description("rebuild and recreate all development containers").action(async () => {
    await execute(() => compose("refresh", ["up", "--detach", "--build", "--force-recreate", "--wait"]), () => "LoomStack development containers refreshed.")
  })
  dev.command("stop").description("stop and remove development containers").action(async () => {
    await execute(() => compose("stop", ["down"]), () => "LoomStack development containers stopped.")
  })
  dev.command("status").description("show development container status").action(async () => {
    await execute(() => compose("status", ["ps"]), (result) => (result.output as string | null) ?? "No LoomStack development containers are running.")
  })

  const context = program.command("context").description("show agent-readable project context")
  context.action(async () => {
    await execute(() => projectContext(projectOrThrow(projectRoot(cwd()))), () => {
      const project = projectOrThrow(projectRoot(cwd()))
      return `loomstack project: ${project.config.appName}\nFeatures: ${project.features.map((feature) => feature.id).join(", ") || "none"}`
    })
  })
  context.command("feature <name>").description("show context for one feature").action(async (name: string) => {
    await execute(() => {
      const project = projectOrThrow(projectRoot(cwd()))
      const feature = project.features.find((candidate) => candidate.id === name)
      if (!feature) throw new GeneratorFailure([frameworkError("loomstack1002", { message: `Unknown feature: ${name}.` })])
      return featureContext(feature)
    }, (result) => `Feature: ${result.feature as string}\nManifest: ${result.manifest as string}`)
  })

  program.command("graph").description("show the feature graph").action(async () => {
    await execute(() => projectOrThrow(projectRoot(cwd())).graph as unknown as Record<string, unknown>, () => "Feature graph generated.")
  })

  program.command("affected <file>").description("show likely affected files").action(async (file: string) => {
    await execute(() => affected(projectOrThrow(projectRoot(cwd())), file), (result) => `Affected files for ${result.file as string}:\n${(result.affected as string[]).map((path) => `  ${path}`).join("\n")}`)
  })

  const verify = program.command("verify").description("verify architecture and generated contracts")
  verify.action(async () => {
    const result = verifyProject(projectRoot(cwd()))
    emit(result as unknown as Record<string, unknown>, result.ok ? "Verification passed." : humanErrors(result.errors), !result.ok)
  })
  verify.command("feature <name>").description("verify one feature").action(async (name: string) => {
    const result = verifyProject(projectRoot(cwd()), { feature: name })
    emit(result as unknown as Record<string, unknown>, result.ok ? `Feature ${name} passed verification.` : humanErrors(result.errors), !result.ok)
  })

  program.command("explain <code>").description("explain a stable loomstack error code").action(async (code: string) => {
    await execute(() => {
      const explanation = explainError(code)
      if (!explanation) throw new GeneratorFailure([frameworkError("loomstack5003", { message: `Unknown error code: ${code}.` })])
      return explanation
    }, (result) => `${result.code as string}: ${result.title as string}\n${result.why as string}\nRepair: ${result.repair as string}`)
  })

  program.command("doctor").description("check the local loomstack environment").action(async () => {
    await execute(() => {
      const root = discoverProjectRoot(cwd())
      const pnpm = spawnSync("pnpm", ["--version"], { encoding: "utf8" })
      const docker = spawnSync("docker", ["compose", "version", "--short"], { encoding: "utf8" })
      const checks = {
        node: { ok: Number(process.versions.node.split(".")[0]) >= 22, version: process.versions.node },
        pnpm: { ok: pnpm.status === 0, version: pnpm.stdout.trim() || null },
        dockerCompose: { ok: docker.status === 0, version: docker.stdout.trim() || null },
        config: { ok: Boolean(root), path: root ? toProjectPath(relative(cwd(), resolve(root, "loomstack.config.ts"))) || "loomstack.config.ts" : null },
        compose: { ok: root ? existsSync(resolve(root, "compose.yaml")) : false, path: root ? "compose.yaml" : null },
        typescript: { ok: root ? existsSync(resolve(root, "tsconfig.json")) : false }
      }
      return { healthy: Object.values(checks).every((check) => check.ok), checks }
    }, (result) => (result.healthy ? "loomstack doctor found no problems." : "loomstack doctor found environment problems."))
  })

  try {
    await program.parseAsync(argv, { from: "user" })
  } catch (error) {
    if (error instanceof CommanderError && ["commander.helpDisplayed", "commander.version"].includes(error.code)) return exitCode
    const errors = errorsFrom(error)
    emit({ ok: false, errors }, humanErrors(errors), true)
  }
  return exitCode
}

const invokedPath = process.argv[1] ? pathToFileURL(realpathSync(resolve(process.argv[1]))).href : ""
if (import.meta.url === invokedPath) {
  runCli(process.argv.slice(2)).then((code) => { process.exitCode = code }).catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}

export { ERROR_CATALOG }
