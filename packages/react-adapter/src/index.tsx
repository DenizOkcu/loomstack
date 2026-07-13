import { useCallback, useEffect, useMemo, useState } from "react"
import type { ComponentType, ReactNode } from "react"

export interface OperationReference<TOutput = unknown> {
  name: string
  readonly __output?: TOutput
}

export interface ClientOptions {
  baseUrl?: string
  fetch?: typeof globalThis.fetch
}

export class LoomStackClientError extends Error {
  constructor(readonly error: { code: string; message: string; repair?: string; details?: unknown }) {
    super(error.message)
    this.name = "LoomStackClientError"
  }
}

let defaultClientOptions: ClientOptions = {}

export function configureLoomStackClient(options: ClientOptions): void {
  defaultClientOptions = { ...options }
}

async function call<TOutput>(kind: "actions" | "queries", name: string, input: unknown, options?: ClientOptions): Promise<TOutput> {
  const merged = { ...defaultClientOptions, ...options }
  const fetchImplementation = merged.fetch ?? globalThis.fetch
  if (!fetchImplementation) throw new Error("No fetch implementation is available.")
  const response = await fetchImplementation(`${merged.baseUrl ?? ""}/_loomstack/${kind}/${encodeURIComponent(name)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input ?? {})
  })
  let payload: { error?: { code: string; message: string; repair?: string; details?: unknown } } | TOutput
  try {
    payload = await response.json() as typeof payload
  } catch {
    throw new LoomStackClientError({
      code: "loomstack3002",
      message: `loomstack RPC returned a non-JSON response (${response.status}).`,
      repair: "Ensure the request targets the generated Koa RPC endpoint."
    })
  }
  if (!response.ok || (typeof payload === "object" && payload !== null && "error" in payload && payload.error)) {
    const error = (payload as { error?: { code: string; message: string; repair?: string; details?: unknown } }).error
      ?? { code: `HTTP_${response.status}`, message: response.statusText }
    throw new LoomStackClientError(error)
  }
  return payload as TOutput
}

export function createActionClient<TInput = unknown, TOutput = unknown>(name: string, options?: ClientOptions) {
  return (input: TInput) => call<TOutput>("actions", name, input, options)
}

export function createQueryClient<TInput = unknown, TOutput = unknown>(name: string, options?: ClientOptions) {
  return (input?: TInput) => call<TOutput>("queries", name, input, options)
}

export interface QueryState<T> {
  data?: T
  error?: Error
  loading: boolean
  refetch: () => Promise<void>
}

export function useLoomStackQuery<TInput, TOutput>(reference: OperationReference<TOutput> | undefined, input?: TInput): QueryState<TOutput> {
  const serializedInput = useMemo(() => JSON.stringify(input ?? {}), [input])
  const operationName = reference?.name
  const client = useMemo(() => operationName ? createQueryClient<TInput, TOutput>(operationName) : undefined, [operationName])
  const [state, setState] = useState<{ data?: TOutput; error?: Error; loading: boolean }>({ loading: Boolean(reference) })
  const refetch = useCallback(async () => {
    if (!client) {
      setState({ loading: false })
      return
    }
    setState((current) => ({ ...current, loading: true }))
    try {
      const data = await client(JSON.parse(serializedInput) as TInput)
      setState({ data, loading: false })
    } catch (error) {
      setState({ error: error instanceof Error ? error : new Error(String(error)), loading: false })
    }
  }, [client, serializedInput])
  useEffect(() => { void refetch() }, [refetch])
  return { ...state, refetch }
}

export interface ActionState<TInput, TOutput> {
  run: (input: TInput) => Promise<TOutput>
  data?: TOutput
  error?: Error
  loading: boolean
}

export function useLoomStackAction<TInput, TOutput>(reference: OperationReference<TOutput>): ActionState<TInput, TOutput> {
  const client = useMemo(() => createActionClient<TInput, TOutput>(reference.name), [reference.name])
  const [state, setState] = useState<{ data?: TOutput; error?: Error; loading: boolean }>({ loading: false })
  const run = useCallback(async (input: TInput) => {
    setState({ loading: true })
    try {
      const data = await client(input)
      setState({ data, loading: false })
      return data
    } catch (error) {
      const resolved = error instanceof Error ? error : new Error(String(error))
      setState({ error: resolved, loading: false })
      throw resolved
    }
  }, [client])
  return { ...state, run }
}

export interface ViewDefinition<TData> {
  name: string
  query?: OperationReference<TData>
  render: (props: { data: TData; loading: boolean; error?: Error; refetch: () => Promise<void> }) => ReactNode
}

export type LoomStackView<TData> = ComponentType & { readonly loomstack: ViewDefinition<TData> }

export function view<TData = undefined>(definition: ViewDefinition<TData>): LoomStackView<TData> {
  function LoomStackViewComponent() {
    const state = useLoomStackQuery<undefined, TData>(definition.query)
    if (!definition.query) {
      return definition.render({ data: undefined as TData, loading: false, refetch: async () => undefined })
    }
    return definition.render({
      data: state.data as TData,
      loading: state.loading,
      refetch: state.refetch,
      ...(state.error ? { error: state.error } : {})
    })
  }
  Object.defineProperty(LoomStackViewComponent, "name", { value: definition.name })
  return Object.assign(LoomStackViewComponent, { loomstack: Object.freeze(definition) })
}
