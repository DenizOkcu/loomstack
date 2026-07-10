import type { FrameworkError } from "./types.js"

export interface ErrorDefinition {
  title: string
  defaultMessage: string
  repair: string
  docs: string
}

export const ERROR_CATALOG = {
  loom1001: {
    title: "Feature ID does not match folder name",
    defaultMessage: "The feature manifest ID must match its folder name.",
    repair: "Rename the folder or update feature.yaml so the feature ID matches the folder name.",
    docs: "implementation-plan/docs/10-verifier-and-error-system.md"
  },
  loom1002: {
    title: "Missing or invalid feature manifest field",
    defaultMessage: "A required feature manifest field is missing or invalid.",
    repair: "Add the required field to feature.yaml using the canonical manifest shape.",
    docs: "implementation-plan/docs/03-feature-contract.md"
  },
  loom1003: {
    title: "Manifest action is not exported",
    defaultMessage: "An action declared in the manifest has no implementation.",
    repair: "Create the action file or update the manifest action name.",
    docs: "implementation-plan/docs/05-action-query-runtime.md"
  },
  loom1004: {
    title: "Exported action is missing from manifest",
    defaultMessage: "An exported action is not declared in feature.yaml.",
    repair: "Add the action name to feature.yaml or remove the action implementation.",
    docs: "implementation-plan/docs/05-action-query-runtime.md"
  },
  loom1005: {
    title: "Duplicate route path",
    defaultMessage: "Route paths must be globally unique.",
    repair: "Change one route path so every route path is globally unique.",
    docs: "implementation-plan/docs/03-feature-contract.md"
  },
  loom1006: {
    title: "Invalid feature manifest YAML",
    defaultMessage: "feature.yaml could not be parsed.",
    repair: "Fix the YAML syntax and run loom verify again.",
    docs: "implementation-plan/docs/03-feature-contract.md"
  },
  loom1007: {
    title: "Manifest query is not exported",
    defaultMessage: "A query declared in the manifest has no implementation.",
    repair: "Create the query file or update the manifest query name.",
    docs: "implementation-plan/docs/05-action-query-runtime.md"
  },
  loom1008: {
    title: "Exported query is missing from manifest",
    defaultMessage: "An exported query is not declared in feature.yaml.",
    repair: "Add the query name to feature.yaml or remove the query implementation.",
    docs: "implementation-plan/docs/05-action-query-runtime.md"
  },
  loom1009: {
    title: "Manifest view is not exported",
    defaultMessage: "A route references a view that does not exist.",
    repair: "Create the declared *.view.tsx file or update the route view in feature.yaml.",
    docs: "implementation-plan/docs/06-react-frontend-adapter.md"
  },
  loom1010: {
    title: "Manifest entity is not exported",
    defaultMessage: "An entity declared in the manifest has no schema export.",
    repair: "Export the entity from model.schema.ts or update the manifest entity name.",
    docs: "implementation-plan/docs/04-schema-and-domain-layer.md"
  },
  loom1011: {
    title: "Invalid feature name",
    defaultMessage: "Feature IDs must be kebab-case.",
    repair: "Use a lowercase kebab-case feature name such as project-notes.",
    docs: "implementation-plan/docs/03-feature-contract.md"
  },
  loom2001: {
    title: "Forbidden database import in UI file",
    defaultMessage: "Database imports are forbidden in React UI files.",
    repair: "Move database access into queries/*.query.ts or actions/*.action.ts.",
    docs: "implementation-plan/docs/10-verifier-and-error-system.md"
  },
  loom2002: {
    title: "Forbidden raw fetch in UI file",
    defaultMessage: "Raw fetch is forbidden in React UI files.",
    repair: "Use the generated loom action/query client.",
    docs: "implementation-plan/docs/10-verifier-and-error-system.md"
  },
  loom2003: {
    title: "Koa import in feature logic",
    defaultMessage: "Feature logic must be transport-independent.",
    repair: "Remove the Koa dependency and use LoomRequestContext.",
    docs: "implementation-plan/docs/10-verifier-and-error-system.md"
  },
  loom3001: {
    title: "Action input validation failed",
    defaultMessage: "Action input did not match its schema.",
    repair: "Send input matching the action input schema.",
    docs: "implementation-plan/docs/05-action-query-runtime.md"
  },
  loom3002: {
    title: "Runtime output validation failed",
    defaultMessage: "Action or query output did not match its schema.",
    repair: "Return a value matching the declared output schema.",
    docs: "implementation-plan/docs/05-action-query-runtime.md"
  },
  loom3003: {
    title: "Authentication required",
    defaultMessage: "This operation requires an authenticated user.",
    repair: "Authenticate the request before calling this operation.",
    docs: "implementation-plan/docs/05-action-query-runtime.md"
  },
  loom4040: {
    title: "Unknown action",
    defaultMessage: "The requested action is not registered.",
    repair: "Use an action declared in feature.yaml and run loom generate.",
    docs: "implementation-plan/docs/07-koa-backend-adapter.md"
  },
  loom4041: {
    title: "Unknown query",
    defaultMessage: "The requested query is not registered.",
    repair: "Use a query declared in feature.yaml and run loom generate.",
    docs: "implementation-plan/docs/07-koa-backend-adapter.md"
  },
  loom4050: {
    title: "Invalid RPC method",
    defaultMessage: "loom RPC endpoints accept only HTTP POST.",
    repair: "Send the action or query request with HTTP POST.",
    docs: "implementation-plan/docs/07-koa-backend-adapter.md"
  },
  loom4001: {
    title: "Generated file was manually modified",
    defaultMessage: "A generated file does not match its recorded hash.",
    repair: "Run loom generate or move custom logic out of the generated file.",
    docs: "implementation-plan/docs/09-code-generation.md"
  },
  loom4002: {
    title: "Generated file is stale",
    defaultMessage: "Generated output does not match current feature contracts.",
    repair: "Run loom generate.",
    docs: "implementation-plan/docs/09-code-generation.md"
  },
  loom5001: {
    title: "Missing loom config",
    defaultMessage: "No loom.config.ts was found.",
    repair: "Create loom.config.ts or run the command inside a loom project.",
    docs: "implementation-plan/docs/02-repository-structure.md"
  },
  loom5002: {
    title: "Target already exists",
    defaultMessage: "The requested target already exists.",
    repair: "Choose another name or remove the existing target first.",
    docs: "implementation-plan/docs/08-cli-specification.md"
  },
  loom5003: {
    title: "Invalid project configuration",
    defaultMessage: "loom.config.ts does not contain the required golden-path values.",
    repair: "Use React, Koa, SQLite, pnpm, and explicit featuresDir/generatedDir values.",
    docs: "implementation-plan/docs/02-repository-structure.md"
  },
  loom6001: {
    title: "Unsupported SQLite field",
    defaultMessage: "An entity field cannot be represented by the v0.1 SQLite adapter.",
    repair: "Use a supported scalar field or provide explicit persistence logic.",
    docs: "implementation-plan/docs/04-schema-and-domain-layer.md"
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
