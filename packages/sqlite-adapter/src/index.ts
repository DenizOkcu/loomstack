import { createRequire } from "node:module"
import type { DatabaseSync as DatabaseSyncType, SQLInputValue } from "node:sqlite"

const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite") as typeof import("node:sqlite")

export type Row = Record<string, unknown>

export class MemoryDatabase {
  readonly #tables = new Map<string, Row[]>()

  insert<T extends Row>(table: string, row: T): T {
    const rows = this.#tables.get(table) ?? []
    const copy = structuredClone(row)
    rows.push(copy)
    this.#tables.set(table, rows)
    return structuredClone(copy) as T
  }

  list<T extends Row>(table: string, predicate: (row: T) => boolean = () => true): T[] {
    return (this.#tables.get(table) ?? []).filter((row) => predicate(row as T)).map((row) => structuredClone(row) as T)
  }

  find<T extends Row>(table: string, predicate: (row: T) => boolean): T | undefined {
    const row = (this.#tables.get(table) ?? []).find((candidate) => predicate(candidate as T))
    return row ? structuredClone(row) as T : undefined
  }

  update<T extends Row>(table: string, predicate: (row: T) => boolean, update: Partial<T>): T[] {
    const rows = this.#tables.get(table) ?? []
    const changed: T[] = []
    for (const row of rows) {
      if (predicate(row as T)) {
        Object.assign(row, structuredClone(update))
        changed.push(structuredClone(row) as T)
      }
    }
    return changed
  }

  remove<T extends Row>(table: string, predicate: (row: T) => boolean): number {
    const rows = this.#tables.get(table) ?? []
    const kept = rows.filter((row) => !predicate(row as T))
    this.#tables.set(table, kept)
    return rows.length - kept.length
  }

  clear(): void {
    this.#tables.clear()
  }
}

export class SqliteDatabase {
  readonly database: DatabaseSyncType

  constructor(path = ":memory:") {
    this.database = new DatabaseSync(path)
    this.database.exec("PRAGMA foreign_keys = ON")
  }

  exec(sql: string): void {
    this.database.exec(sql)
  }

  all<T extends Row = Row>(sql: string, ...parameters: SQLInputValue[]): T[] {
    return this.database.prepare(sql).all(...parameters) as T[]
  }

  get<T extends Row = Row>(sql: string, ...parameters: SQLInputValue[]): T | undefined {
    return this.database.prepare(sql).get(...parameters) as T | undefined
  }

  run(sql: string, ...parameters: SQLInputValue[]) {
    return this.database.prepare(sql).run(...parameters)
  }

  close(): void {
    this.database.close()
  }
}
