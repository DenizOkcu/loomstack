import type Koa from "koa"
import {
  executeAction,
  executeQuery,
  LoomStackRuntimeError
} from "@loomstack/runtime"
import type {
  ActionDefinition,
  LoomStackRequestContext,
  QueryDefinition
} from "@loomstack/runtime"

type AnyAction = ActionDefinition<any, any, any>
type AnyQuery = QueryDefinition<any, any, any>

export interface LoomStackRouteOptions {
  actionRegistry: Record<string, AnyAction>
  queryRegistry: Record<string, AnyQuery>
  createRequestContext: (ctx: Koa.Context) => Promise<LoomStackRequestContext<any>> | LoomStackRequestContext<any>
}

function operationFromPath(path: string): { kind: "action" | "query"; name: string } | undefined {
  const match = path.match(/^\/_loomstack\/(actions|queries)\/([^/]+)$/)
  if (!match?.[1] || !match[2]) return undefined
  try {
    return { kind: match[1] === "actions" ? "action" : "query", name: decodeURIComponent(match[2]) }
  } catch {
    return undefined
  }
}

function unknownOperation(ctx: Koa.Context, kind: "action" | "query", name: string): void {
  ctx.status = 404
  ctx.body = {
    error: {
      code: kind === "action" ? "loomstack4040" : "loomstack4041",
      message: `Unknown ${kind}: ${name}`,
      repair: `Use a ${kind} name declared in feature.yaml and run loomstack generate.`
    }
  }
}

export function registerLoomStackRoutes(app: Koa, options: LoomStackRouteOptions): void {
  app.use(async (ctx, next) => {
    const operation = operationFromPath(ctx.path)
    if (!operation) return next()
    if (ctx.method !== "POST") {
      ctx.status = 405
      ctx.body = { error: { code: "loomstack4050", message: "loomstack RPC endpoints require POST.", repair: "Send this request with HTTP POST." } }
      return
    }

    const registry = operation.kind === "action" ? options.actionRegistry : options.queryRegistry
    const definition = Object.prototype.hasOwnProperty.call(registry, operation.name)
      ? registry[operation.name]
      : undefined
    if (!definition) {
      unknownOperation(ctx, operation.kind, operation.name)
      return
    }

    try {
      const requestContext = await options.createRequestContext(ctx)
      const body = (ctx.request as Koa.Request & { body?: unknown }).body ?? {}
      ctx.body = operation.kind === "action"
        ? await executeAction(definition as AnyAction, requestContext, body)
        : await executeQuery(definition as AnyQuery, requestContext, body)
      ctx.status = 200
    } catch (error) {
      if (error instanceof LoomStackRuntimeError) {
        ctx.status = error.status
        ctx.body = { error: error.body }
        return
      }
      ctx.status = 500
      ctx.body = {
        error: {
          code: "loomstack3002",
          message: "Unexpected operation failure.",
          repair: "Inspect API logs and ensure the operation returns its declared output schema."
        }
      }
      ctx.app.emit("error", error, ctx)
    }
  })
}
