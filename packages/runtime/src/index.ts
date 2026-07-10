import { z } from "zod"

export type Schema<T = unknown> = z.ZodType<T>
export type InferSchema<TSchema extends z.ZodType> = z.infer<TSchema>
export type InferEntity<TSchema extends z.ZodType> = z.infer<TSchema>

export type EntitySchema<TShape extends z.ZodRawShape = z.ZodRawShape> = z.ZodObject<TShape> & {
  readonly entityName: string
}

export function entity<const TShape extends z.ZodRawShape>(name: string, fields: TShape): EntitySchema<TShape> {
  if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) throw new Error(`Entity names must be PascalCase: ${name}`)
  return Object.assign(z.object(fields), { entityName: name })
}

export function schema<const TShape extends z.ZodRawShape>(fields: TShape) {
  return z.object(fields)
}

export function id() {
  return z.string().min(1)
}

export function text() {
  return z.string()
}

export function number() {
  return z.number()
}

export function boolean() {
  return z.boolean()
}

export function timestamp() {
  return z.coerce.date()
}

export function userId() {
  return z.string().min(1)
}

export function array<T extends z.ZodType>(item: T) {
  return z.array(item)
}

export function oneOf<const TValues extends readonly [string, ...string[]]>(values: TValues) {
  return z.enum(values)
}

export function optional<T extends z.ZodType>(field: T) {
  return field.optional()
}

export interface LoomUser {
  id: string
  [key: string]: unknown
}

export interface LoomLogger {
  debug?(message: string, details?: unknown): void
  info?(message: string, details?: unknown): void
  warn?(message: string, details?: unknown): void
  error?(message: string, details?: unknown): void
}

export interface LoomRequestContext<TDatabase = unknown> {
  requestId: string
  user?: LoomUser
  db: TDatabase
  logger: LoomLogger
}

export type ActionContext<TDatabase = unknown> = LoomRequestContext<TDatabase>
export type QueryContext<TDatabase = unknown> = LoomRequestContext<TDatabase>
export type AuthRequirement = "public" | "authenticated"

export interface ActionDefinition<TInput, TOutput, TDatabase = unknown> {
  readonly kind: "action"
  readonly name: string
  readonly input: Schema<TInput>
  readonly output: Schema<TOutput>
  readonly auth: AuthRequirement
  readonly run: (ctx: ActionContext<TDatabase>, input: TInput) => Promise<TOutput> | TOutput
}

export interface QueryDefinition<TInput, TOutput, TDatabase = unknown> {
  readonly kind: "query"
  readonly name: string
  readonly input?: Schema<TInput>
  readonly output: Schema<TOutput>
  readonly auth: AuthRequirement
  readonly run: (ctx: QueryContext<TDatabase>, input: TInput) => Promise<TOutput> | TOutput
}

export function action<TInput, TOutput, TDatabase = unknown>(definition: {
  name: string
  input: Schema<TInput>
  output: Schema<TOutput>
  auth?: AuthRequirement
  run: (ctx: ActionContext<TDatabase>, input: TInput) => Promise<TOutput> | TOutput
}): ActionDefinition<TInput, TOutput, TDatabase> {
  return Object.freeze({ ...definition, kind: "action" as const, auth: definition.auth ?? "public" })
}

export function query<TInput = undefined, TOutput = unknown, TDatabase = unknown>(definition: {
  name: string
  input?: Schema<TInput>
  output: Schema<TOutput>
  auth?: AuthRequirement
  run: (ctx: QueryContext<TDatabase>, input: TInput) => Promise<TOutput> | TOutput
}): QueryDefinition<TInput, TOutput, TDatabase> {
  return Object.freeze({ ...definition, kind: "query" as const, auth: definition.auth ?? "public" })
}

export interface RuntimeErrorBody {
  code: "loom3001" | "loom3002" | "loom3003"
  message: string
  operation?: string
  details?: Array<{ path: string; message: string }>
  repair: string
}

export class LoomRuntimeError extends Error {
  readonly status: number
  readonly body: RuntimeErrorBody

  constructor(status: number, body: RuntimeErrorBody) {
    super(body.message)
    this.name = "LoomRuntimeError"
    this.status = status
    this.body = body
  }
}

function validationDetails(error: z.ZodError) {
  return error.issues.map((issue) => ({ path: issue.path.map(String).join("."), message: issue.message }))
}

async function assertAuth(ctx: LoomRequestContext, auth: AuthRequirement, operation: string) {
  if (auth === "authenticated" && !ctx.user) {
    throw new LoomRuntimeError(401, {
      code: "loom3003",
      message: "Authentication is required.",
      operation,
      repair: "Authenticate the request before calling this operation."
    })
  }
}

export async function executeAction<TInput, TOutput, TDatabase>(
  definition: ActionDefinition<TInput, TOutput, TDatabase>,
  ctx: ActionContext<TDatabase>,
  rawInput: unknown
): Promise<TOutput> {
  const parsedInput = definition.input.safeParse(rawInput)
  if (!parsedInput.success) {
    throw new LoomRuntimeError(400, {
      code: "loom3001",
      message: "Action input validation failed.",
      operation: definition.name,
      details: validationDetails(parsedInput.error),
      repair: "Send input matching the action input schema."
    })
  }
  await assertAuth(ctx, definition.auth, definition.name)
  const result = await definition.run(ctx, parsedInput.data)
  const parsedOutput = definition.output.safeParse(result)
  if (!parsedOutput.success) {
    throw new LoomRuntimeError(500, {
      code: "loom3002",
      message: "Action output validation failed.",
      operation: definition.name,
      details: validationDetails(parsedOutput.error),
      repair: "Return a value matching the declared action output schema."
    })
  }
  return parsedOutput.data
}

export async function executeQuery<TInput, TOutput, TDatabase>(
  definition: QueryDefinition<TInput, TOutput, TDatabase>,
  ctx: QueryContext<TDatabase>,
  rawInput: unknown
): Promise<TOutput> {
  let input = undefined as TInput
  if (definition.input) {
    const parsedInput = definition.input.safeParse(rawInput)
    if (!parsedInput.success) {
      throw new LoomRuntimeError(400, {
        code: "loom3001",
        message: "Query input validation failed.",
        operation: definition.name,
        details: validationDetails(parsedInput.error),
        repair: "Send input matching the query input schema."
      })
    }
    input = parsedInput.data
  }
  await assertAuth(ctx, definition.auth, definition.name)
  const result = await definition.run(ctx, input)
  const parsedOutput = definition.output.safeParse(result)
  if (!parsedOutput.success) {
    throw new LoomRuntimeError(500, {
      code: "loom3002",
      message: "Query output validation failed.",
      operation: definition.name,
      details: validationDetails(parsedOutput.error),
      repair: "Return a value matching the declared query output schema."
    })
  }
  return parsedOutput.data
}

export function policy<T extends Record<string, (...args: never[]) => unknown>>(definition: T): Readonly<T> {
  return Object.freeze(definition)
}

export function view<T>(definition: T): Readonly<T> {
  return Object.freeze(definition)
}

export interface LoomConfigInput {
  appName: string
  packageManager: "pnpm"
  frontend: "react"
  backend: "koa"
  database: "postgres"
  featuresDir: string
  generatedDir: string
}

export function defineLoomConfig<const T extends LoomConfigInput>(config: T): T {
  return Object.freeze(config)
}

export const defineloomConfig = defineLoomConfig
export { z }
