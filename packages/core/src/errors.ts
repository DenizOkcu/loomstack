import type { FrameworkError } from "./types.js"

export interface ErrorDefinition {
  title: string
  defaultMessage: string
  repair: string
  docs: string
}

export const ERROR_CATALOG = {
  loomstack1001: {
    title: "Feature ID does not match folder name",
    defaultMessage: "The feature manifest ID must match its folder name.",
    repair: "Rename the folder or update feature.yaml so the feature ID matches the folder name.",
    docs: "https://github.com/DenizOkcu/loomstack/blob/master/docs/architecture.md#verification-and-errors"
  },
  loomstack1002: {
    title: "Missing or invalid feature manifest field",
    defaultMessage: "A required feature manifest field is missing or invalid.",
    repair: "Add the required field to feature.yaml using the canonical manifest shape.",
    docs: "https://github.com/DenizOkcu/loomstack/blob/master/docs/architecture.md#feature-contracts"
  },
  loomstack1003: {
    title: "Manifest action is not exported",
    defaultMessage: "An action declared in the manifest has no implementation.",
    repair: "Create the action file or update the manifest action name.",
    docs: "https://github.com/DenizOkcu/loomstack/blob/master/docs/architecture.md#actions-queries-and-policies"
  },
  loomstack1004: {
    title: "Exported action is missing from manifest",
    defaultMessage: "An exported action is not declared in feature.yaml.",
    repair: "Add the action name to feature.yaml or remove the action implementation.",
    docs: "https://github.com/DenizOkcu/loomstack/blob/master/docs/architecture.md#actions-queries-and-policies"
  },
  loomstack1005: {
    title: "Duplicate route path",
    defaultMessage: "Route paths must be globally unique.",
    repair: "Change one route path so every route path is globally unique.",
    docs: "https://github.com/DenizOkcu/loomstack/blob/master/docs/architecture.md#feature-contracts"
  },
  loomstack1006: {
    title: "Invalid feature manifest YAML",
    defaultMessage: "feature.yaml could not be parsed.",
    repair: "Fix the YAML syntax and run loomstack verify again.",
    docs: "https://github.com/DenizOkcu/loomstack/blob/master/docs/architecture.md#feature-contracts"
  },
  loomstack1007: {
    title: "Manifest query is not exported",
    defaultMessage: "A query declared in the manifest has no implementation.",
    repair: "Create the query file or update the manifest query name.",
    docs: "https://github.com/DenizOkcu/loomstack/blob/master/docs/architecture.md#actions-queries-and-policies"
  },
  loomstack1008: {
    title: "Exported query is missing from manifest",
    defaultMessage: "An exported query is not declared in feature.yaml.",
    repair: "Add the query name to feature.yaml or remove the query implementation.",
    docs: "https://github.com/DenizOkcu/loomstack/blob/master/docs/architecture.md#actions-queries-and-policies"
  },
  loomstack1009: {
    title: "Manifest view is not exported",
    defaultMessage: "A route references a view that does not exist.",
    repair: "Create the declared *.view.tsx file or update the route view in feature.yaml.",
    docs: "https://github.com/DenizOkcu/loomstack/blob/master/docs/architecture.md#react-presentation"
  },
  loomstack1010: {
    title: "Manifest entity is not exported",
    defaultMessage: "An entity declared in the manifest has no schema export.",
    repair: "Export the entity from model.schema.ts or update the manifest entity name.",
    docs: "https://github.com/DenizOkcu/loomstack/blob/master/docs/architecture.md#schemas-and-persistence"
  },
  loomstack1011: {
    title: "Invalid feature name",
    defaultMessage: "Feature IDs must be kebab-case.",
    repair: "Use a lowercase kebab-case feature name such as project-notes.",
    docs: "https://github.com/DenizOkcu/loomstack/blob/master/docs/architecture.md#feature-contracts"
  },
  loomstack2001: {
    title: "Forbidden database import in UI file",
    defaultMessage: "Database imports are forbidden in React UI files.",
    repair: "Move database access into queries/*.query.ts or actions/*.action.ts.",
    docs: "https://github.com/DenizOkcu/loomstack/blob/master/docs/architecture.md#verification-and-errors"
  },
  loomstack2002: {
    title: "Forbidden raw fetch in UI file",
    defaultMessage: "Raw fetch is forbidden in React UI files.",
    repair: "Use the generated loomstack action/query client.",
    docs: "https://github.com/DenizOkcu/loomstack/blob/master/docs/architecture.md#verification-and-errors"
  },
  loomstack2003: {
    title: "Koa import in feature logic",
    defaultMessage: "Feature logic must be transport-independent.",
    repair: "Remove the Koa dependency and use LoomStackRequestContext.",
    docs: "https://github.com/DenizOkcu/loomstack/blob/master/docs/architecture.md#verification-and-errors"
  },
  loomstack3001: {
    title: "Action input validation failed",
    defaultMessage: "Action input did not match its schema.",
    repair: "Send input matching the action input schema.",
    docs: "https://github.com/DenizOkcu/loomstack/blob/master/docs/architecture.md#actions-queries-and-policies"
  },
  loomstack3002: {
    title: "Runtime output validation failed",
    defaultMessage: "Action or query output did not match its schema.",
    repair: "Return a value matching the declared output schema.",
    docs: "https://github.com/DenizOkcu/loomstack/blob/master/docs/architecture.md#actions-queries-and-policies"
  },
  loomstack3003: {
    title: "Authentication required",
    defaultMessage: "This operation requires an authenticated user.",
    repair: "Authenticate the request before calling this operation.",
    docs: "https://github.com/DenizOkcu/loomstack/blob/master/docs/architecture.md#actions-queries-and-policies"
  },
  loomstack4040: {
    title: "Unknown action",
    defaultMessage: "The requested action is not registered.",
    repair: "Use an action declared in feature.yaml and run loomstack generate.",
    docs: "https://github.com/DenizOkcu/loomstack/blob/master/docs/architecture.md#koa-transport"
  },
  loomstack4041: {
    title: "Unknown query",
    defaultMessage: "The requested query is not registered.",
    repair: "Use a query declared in feature.yaml and run loomstack generate.",
    docs: "https://github.com/DenizOkcu/loomstack/blob/master/docs/architecture.md#koa-transport"
  },
  loomstack4050: {
    title: "Invalid RPC method",
    defaultMessage: "loomstack RPC endpoints accept only HTTP POST.",
    repair: "Send the action or query request with HTTP POST.",
    docs: "https://github.com/DenizOkcu/loomstack/blob/master/docs/architecture.md#koa-transport"
  },
  loomstack4001: {
    title: "Generated file was manually modified",
    defaultMessage: "A generated file does not match its recorded hash.",
    repair: "Run loomstack generate or move custom logic out of the generated file.",
    docs: "https://github.com/DenizOkcu/loomstack/blob/master/docs/architecture.md#generation"
  },
  loomstack4002: {
    title: "Generated file is stale",
    defaultMessage: "Generated output does not match current feature contracts.",
    repair: "Run loomstack generate.",
    docs: "https://github.com/DenizOkcu/loomstack/blob/master/docs/architecture.md#generation"
  },
  loomstack5001: {
    title: "Missing loomstack config",
    defaultMessage: "No loomstack.config.ts was found.",
    repair: "Create loomstack.config.ts or run the command inside a loomstack project.",
    docs: "https://github.com/DenizOkcu/loomstack/blob/master/docs/architecture.md#application-structure"
  },
  loomstack5002: {
    title: "Target already exists",
    defaultMessage: "The requested target already exists.",
    repair: "Choose another name or remove the existing target first.",
    docs: "https://github.com/DenizOkcu/loomstack/blob/master/docs/commands.md#creation"
  },
  loomstack5003: {
    title: "Invalid project configuration",
    defaultMessage: "loomstack.config.ts does not contain the required golden-path values.",
    repair: "Use React, Koa, PostgreSQL, pnpm, and explicit featuresDir/generatedDir values.",
    docs: "https://github.com/DenizOkcu/loomstack/blob/master/docs/architecture.md#application-structure"
  },
  loomstack6001: {
    title: "Unsupported PostgreSQL field",
    defaultMessage: "An entity field cannot be represented by the v0.1 PostgreSQL adapter.",
    repair: "Use a supported scalar field or provide explicit persistence logic.",
    docs: "https://github.com/DenizOkcu/loomstack/blob/master/docs/architecture.md#schemas-and-persistence"
  }
} as const satisfies Record<string, ErrorDefinition>

export type ErrorCode = keyof typeof ERROR_CATALOG

export function frameworkError(
  code: ErrorCode,
  options: {
    message?: string
    severity?: "error" | "warning"
    file?: string
    relatedFiles?: string[]
    location?: { line?: number; column?: number }
  } = {}
): FrameworkError {
  const definition = ERROR_CATALOG[code]
  return {
    code,
    severity: options.severity ?? "error",
    message: options.message ?? definition.defaultMessage,
    repair: definition.repair,
    docs: definition.docs,
    ...(options.file ? { file: options.file } : {}),
    ...(options.relatedFiles ? { relatedFiles: options.relatedFiles } : {}),
    ...(options.location ? { location: options.location } : {})
  }
}

export function serializeFrameworkError(error: FrameworkError): FrameworkError {
  return JSON.parse(JSON.stringify(error)) as FrameworkError
}

export function explainError(code: string) {
  const definition = ERROR_CATALOG[code as ErrorCode]
  if (!definition) return undefined
  return { code, ...definition, why: definition.defaultMessage }
}
