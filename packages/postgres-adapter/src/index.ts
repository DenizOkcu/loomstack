import { Pool, type PoolConfig, type QueryResultRow } from "pg"

export type Row = Record<string, unknown>
export type Awaitable<T> = T | Promise<T>

export interface Database {
  insert<T extends Row>(table: string, row: T): Awaitable<T>
  list<T extends Row>(table: string, predicate?: (row: T) => boolean): Awaitable<T[]>
  find<T extends Row>(table: string, predicate: (row: T) => boolean): Awaitable<T | undefined>
  update<T extends Row>(table: string, predicate: (row: T) => boolean, update: Partial<T>): Awaitable<T[]>
  remove<T extends Row>(table: string, predicate: (row: T) => boolean): Awaitable<number>
  clear(): Awaitable<void>
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function tableName(table: string): string {
  if (!/^[a-z][a-z0-9_]*$/.test(table)) throw new Error(`Invalid PostgreSQL table name: ${table}`)
  return `loom_${table}`
}

export class MemoryDatabase implements Database {
  readonly #tables = new Map<string, Row[]>()

  insert<T extends Row>(table: string, row: T): T {
    const rows = this.#tables.get(table) ?? []
    rows.push(clone(row))
    this.#tables.set(table, rows)
    return clone(row)
  }

  list<T extends Row>(table: string, predicate: (row: T) => boolean = () => true): T[] {
    return (this.#tables.get(table) ?? []).filter((row) => predicate(row as T)).map((row) => clone(row) as T)
  }

  find<T extends Row>(table: string, predicate: (row: T) => boolean): T | undefined {
    const row = (this.#tables.get(table) ?? []).find((candidate) => predicate(candidate as T))
    return row ? clone(row) as T : undefined
  }

  update<T extends Row>(table: string, predicate: (row: T) => boolean, update: Partial<T>): T[] {
    const changed: T[] = []
    for (const row of this.#tables.get(table) ?? []) {
      if (predicate(row as T)) {
        Object.assign(row, clone(update))
        changed.push(clone(row) as T)
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

export class PostgresDatabase implements Database {
  readonly pool: Pool

  constructor(config: PoolConfig = {}) {
    this.pool = new Pool(Object.keys(config).length === 0
      ? { connectionString: process.env.DATABASE_URL }
      : config)
  }

  private async ensure(table: string): Promise<string> {
    const name = tableName(table)
    await this.pool.query(`CREATE TABLE IF NOT EXISTS ${name} (id text PRIMARY KEY, data jsonb NOT NULL)`)
    return name
  }

  async insert<T extends Row>(table: string, row: T): Promise<T> {
    const name = await this.ensure(table)
    const id = row.id
    if (typeof id !== "string" || id.length === 0) throw new Error("PostgreSQL rows require a string id")
    await this.pool.query(`INSERT INTO ${name} (id, data) VALUES ($1, $2::jsonb)`, [id, JSON.stringify(row)])
    return clone(row)
  }

  async list<T extends Row>(table: string, predicate: (row: T) => boolean = () => true): Promise<T[]> {
    const name = await this.ensure(table)
    const result = await this.pool.query<{ data: T }>(`SELECT data FROM ${name} ORDER BY id`)
    return result.rows.map(({ data }) => data).filter(predicate).map(clone)
  }

  async find<T extends Row>(table: string, predicate: (row: T) => boolean): Promise<T | undefined> {
    return (await this.list<T>(table)).find(predicate)
  }

  async update<T extends Row>(table: string, predicate: (row: T) => boolean, update: Partial<T>): Promise<T[]> {
    const name = await this.ensure(table)
    const rows = (await this.list<T>(table)).filter(predicate).map((row) => ({ ...row, ...clone(update) }))
    for (const row of rows) {
      await this.pool.query(`UPDATE ${name} SET data = $2::jsonb WHERE id = $1`, [row.id, JSON.stringify(row)])
    }
    return rows
  }

  async remove<T extends Row>(table: string, predicate: (row: T) => boolean): Promise<number> {
    const name = await this.ensure(table)
    const ids = (await this.list<T>(table)).filter(predicate).map((row) => row.id).filter((id): id is string => typeof id === "string")
    if (ids.length === 0) return 0
    await this.pool.query(`DELETE FROM ${name} WHERE id = ANY($1::text[])`, [ids])
    return ids.length
  }

  async clear(): Promise<void> {
    const result = await this.pool.query<{ tablename: string } & QueryResultRow>("SELECT tablename FROM pg_tables WHERE schemaname = current_schema() AND tablename LIKE 'loom_%'")
    for (const { tablename } of result.rows) await this.pool.query(`TRUNCATE TABLE ${tableName(tablename.slice(5))}`)
  }

  query<T extends QueryResultRow = QueryResultRow>(sql: string, parameters: unknown[] = []) {
    return this.pool.query<T>(sql, parameters)
  }

  async close(): Promise<void> {
    await this.pool.end()
  }
}
