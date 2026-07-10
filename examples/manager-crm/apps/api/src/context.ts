import type Koa from "koa"
import { PostgresDatabase } from "@loom/postgres"

export const db = new PostgresDatabase()

export async function createRequestContext(ctx: Koa.Context) {
  const userId = ctx.get("x-user-id")
  return {
    requestId: ctx.get("x-request-id") || crypto.randomUUID(),
    ...(userId ? { user: { id: userId } } : {}),
    db,
    logger: console
  }
}
