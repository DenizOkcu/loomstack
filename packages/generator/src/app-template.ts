export function appTemplateFiles(appName: string): Record<string, string> {
  return {
    "package.json": `${JSON.stringify({
      name: appName,
      version: "0.0.4",
      private: true,
      type: "module",
      packageManager: "pnpm@11.11.0",
      scripts: {
        loomstack: "loomstack",
        dev: "loomstack dev start",
        "dev:refresh": "loomstack dev refresh",
        "dev:stop": "loomstack dev stop",
        "dev:status": "loomstack dev status",
        generate: "loomstack generate",
        verify: "loomstack verify",
        test: "vitest run --passWithNoTests",
        typecheck: "tsc --noEmit",
        build: "pnpm generate && pnpm -r --filter './apps/*' build"
      },
      devDependencies: {
        "@loomstack/cli": "^0.0.4",
        "@loomstack/react": "^0.0.4",
        "@loomstack/runtime": "^0.0.4",
        "@loomstack/postgres": "^0.0.4",
        "@types/node": "^24.0.0",
        "@types/react": "^19.0.0",
        "@types/react-dom": "^19.0.0",
        react: "^19.2.7",
        "react-dom": "^19.2.7",
        typescript: "^5.9.3",
        vitest: "^4.1.10"
      }
    }, null, 2)}\n`,
    "pnpm-workspace.yaml": "packages:\n  - apps/*\n\nallowBuilds:\n  esbuild: true\n",
    "tsconfig.json": `${JSON.stringify({
      compilerOptions: {
        target: "ES2023",
        module: "ESNext",
        moduleResolution: "Bundler",
        lib: ["ES2023", "DOM", "DOM.Iterable"],
        strict: true,
        noUncheckedIndexedAccess: true,
        exactOptionalPropertyTypes: true,
        esModuleInterop: true,
        skipLibCheck: true,
        resolveJsonModule: true,
        jsx: "react-jsx"
      },
      include: ["apps/**/*.ts", "apps/**/*.tsx", "features/**/*.ts", "features/**/*.tsx", "shared/**/*.ts", "loomstack.config.ts"]
    }, null, 2)}\n`,
    "vitest.config.ts": `import { defineConfig } from "vitest/config"\n\nexport default defineConfig({ test: { include: ["features/**/*.test.ts", "features/**/*.test.tsx"] } })\n`,
    "loomstack.config.ts": `import { defineLoomStackConfig } from "@loomstack/runtime"\n\nexport default defineLoomStackConfig({\n  appName: "${appName}",\n  packageManager: "pnpm",\n  frontend: "react",\n  backend: "koa",\n  database: "postgres",\n  featuresDir: "features",\n  generatedDir: ".loomstack"\n})\n`,
    "AGENTS.md": `# ${appName} agent instructions\n\nThis is a LoomStack app. Humans define product intent; agents implement it through explicit feature contracts.\n\n## Architecture\n\n\`\`\`text\nReact = presentation\nKoa = transport\nfeatures/* = product behavior and source of truth\ngenerated files = derived wiring, never product behavior\n\`\`\`\n\n## Command convention\n\nInvoke the project CLI as \`pnpm loomstack\`. Always use \`--json\` when available so output and repair guidance remain structured. \`loomstack init\` is the human onboarding entrypoint; it starts containers and prints agent guidance but never launches an agent. Do not invoke it from an existing agent session.\n\n## Start every task efficiently\n\n1. Read this file and any in-scope \`features/<feature>/AGENTS.md\`.\n2. Use \`pnpm loomstack doctor --json\` only when environment or setup may be relevant.\n3. Discover scope before broad file exploration:\n   - Existing feature: \`pnpm loomstack context feature <name> --json\`\n   - New or cross-feature work: \`pnpm loomstack context --json\`\n   - Dependencies or routes: \`pnpm loomstack graph --json\`\n4. Before editing an existing authored file, run \`pnpm loomstack affected <path> --json\`.\n5. Create missing features with \`pnpm loomstack create feature <kebab-case-name> --json\`; do not hand-build feature folders.\n\n## Tool selection\n\n| Need | Command |\n|---|---|\n| Validate setup | \`pnpm loomstack doctor --json\` |\n| Understand the app | \`pnpm loomstack context --json\` |\n| Understand one feature | \`pnpm loomstack context feature <name> --json\` |\n| Inspect relationships/routes | \`pnpm loomstack graph --json\` |\n| Find companion files | \`pnpm loomstack affected <authored-file> --json\` |\n| Scaffold a feature | \`pnpm loomstack create feature <name> --json\` |\n| Rebuild derived wiring | \`pnpm loomstack generate --json\` |\n| Check one feature | \`pnpm loomstack verify feature <name> --json\` |\n| Check the whole app | \`pnpm loomstack verify --json\` |\n| Understand an error | \`pnpm loomstack explain <code> --json\` |\n\nWhen a command returns an error code, run \`pnpm loomstack explain <code> --json\` and follow its repair guidance before inventing a workaround.\n\n## Development containers\n\nThe complete development app runs in Docker Compose: Vite web server, Koa API, and PostgreSQL. The source tree is bind-mounted, so normal TypeScript and React edits reload automatically.\n\n- Start before browser/API validation: \`pnpm loomstack dev start --json\`.\n- Check state when uncertain: \`pnpm loomstack dev status --json\`.\n- Use \`pnpm loomstack dev refresh --json\` after dependency, Dockerfile, Compose, or environment changes. Do not refresh for ordinary source edits; hot reload handles them.\n- Stop with \`pnpm loomstack dev stop --json\` when the user requests it or when the task explicitly requires cleanup. Do not stop containers if the user expects the app to remain available.\n- If lifecycle commands fail, run \`pnpm loomstack doctor --json\` and follow the returned repair guidance.\n\n## Canonical feature layout\n\n- \`feature.yaml\`: declared entities, routes, actions, and queries\n- \`model.schema.ts\`: domain entities and schemas\n- \`permissions.policy.ts\`: authorization policy\n- \`actions/*.action.ts\`: mutations\n- \`queries/*.query.ts\`: reads\n- \`ui/*.view.tsx\`: routes and presentation\n- \`tests/*.test.ts\`: behavior proof\n\nKeep names synchronized across the manifest and authored exports.\n\n## Hard rules\n\n- Never edit files containing \`GENERATED BY loomstack\` or JSON with \`\"generatedBy\": \"loomstack\"\`.\n- Never put database access or raw fetch in feature UI.\n- Never import Koa in feature logic.\n- Put product behavior only in canonical feature files.\n- Do not bypass verifier errors with alternate architecture.\n- Update tests for every behavior change.\n\n## Minimal implementation loop\n\n\`\`\`bash\npnpm loomstack context feature <name> --json\npnpm loomstack affected <authored-file> --json\n# Edit only relevant canonical authored files.\npnpm loomstack generate --json\npnpm loomstack verify feature <name> --json\npnpm test\n\`\`\`\n\nUse scoped verification while iterating. Finish cross-feature, routing, configuration, or generated-wiring work with \`pnpm loomstack verify --json\`, \`pnpm typecheck\`, and \`pnpm build\`. Do not repeatedly run full generation/build after every small edit.\n\n## Completion report\n\nState the behavior implemented, authored files changed, generated files refreshed, validation run, and any remaining error codes or environment requirements.\n`,
    "CLAUDE.md": `# ${appName} LoomStack memory\n\nRead the root \`AGENTS.md\` before acting, then read every feature-local \`AGENTS.md\` in scope. Product behavior lives in \`features/*\`; React renders and Koa transports. Never edit generated files, use generated RPC clients, and finish with \`pnpm loomstack generate --json && pnpm loomstack verify --json\`.\n`,
    ".gitignore": "node_modules/\ndist/\ncoverage/\n.env\n.env.local\n.DS_Store\n",
    ".dockerignore": "node_modules\n**/node_modules\ndist\n**/dist\ncoverage\n.git\n.env\n.env.local\n",
    ".env.example": "DATABASE_URL=postgresql://loomstack:loomstack@db:5432/loomstack\nPORT=3001\n",
    "Dockerfile.dev": `FROM node:22-alpine\n\nRUN corepack enable\nWORKDIR /app\n\nCOPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./\nCOPY apps/web/package.json apps/web/package.json\nCOPY apps/api/package.json apps/api/package.json\nCOPY .loomstack/local-packages .loomstack/local-packages\nRUN pnpm install --frozen-lockfile\n\nCOPY . .\n`,
    "compose.yaml": `services:\n  db:\n    image: postgres:17-alpine\n    environment:\n      POSTGRES_DB: loomstack\n      POSTGRES_USER: loomstack\n      POSTGRES_PASSWORD: loomstack\n    ports:\n      - \"5432:5432\"\n    volumes:\n      - postgres-data:/var/lib/postgresql/data\n    healthcheck:\n      test: [\"CMD-SHELL\", \"pg_isready -U loomstack -d loomstack\"]\n      interval: 2s\n      timeout: 3s\n      retries: 15\n\n  api:\n    build:\n      context: .\n      dockerfile: Dockerfile.dev\n    command: pnpm --filter './apps/api' dev\n    environment:\n      DATABASE_URL: postgresql://loomstack:loomstack@db:5432/loomstack\n      PORT: 3001\n      CI: \"true\"\n    ports:\n      - \"3001:3001\"\n    volumes:\n      - .:/app\n      - api-root-node-modules:/app/node_modules\n      - api-node-modules:/app/apps/api/node_modules\n    depends_on:\n      db:\n        condition: service_healthy\n    healthcheck:\n      test: [\"CMD\", \"node\", \"-e\", \"require('net').connect(3001, '127.0.0.1').on('connect', () => process.exit(0)).on('error', () => process.exit(1))\"]\n      interval: 2s\n      timeout: 3s\n      retries: 30\n\n  web:\n    build:\n      context: .\n      dockerfile: Dockerfile.dev\n    command: pnpm --filter './apps/web' dev --host 0.0.0.0\n    environment:\n      LOOMSTACK_API_URL: http://api:3001\n      CHOKIDAR_USEPOLLING: \"true\"\n      CI: \"true\"\n    ports:\n      - \"3000:3000\"\n    volumes:\n      - .:/app\n      - web-root-node-modules:/app/node_modules\n      - web-node-modules:/app/apps/web/node_modules\n    depends_on:\n      api:\n        condition: service_healthy\n    healthcheck:\n      test: [\"CMD\", \"node\", \"-e\", \"require('net').connect(3000, '127.0.0.1').on('connect', () => process.exit(0)).on('error', () => process.exit(1))\"]\n      interval: 2s\n      timeout: 3s\n      retries: 30\n\nvolumes:\n  postgres-data:\n  api-root-node-modules:\n  api-node-modules:\n  web-root-node-modules:\n  web-node-modules:\n`,
    ".loomstack/local-packages/.gitkeep": "",
    "features/.gitkeep": "",
    "apps/web/package.json": `${JSON.stringify({
      name: `@${appName}/web`,
      version: "0.0.4",
      private: true,
      type: "module",
      scripts: { dev: "vite", build: "vite build" },
      dependencies: {
        "@loomstack/react": "^0.0.4",
        "@loomstack/runtime": "^0.0.4",
        "@vitejs/plugin-react": "^6.0.3",
        react: "^19.2.7",
        "react-dom": "^19.2.7",
        vite: "^8.1.4"
      }
    }, null, 2)}\n`,
    "apps/web/index.html": `<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>${appName}</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>\n`,
    "apps/web/src/main.tsx": `import { StrictMode } from "react"\nimport { createRoot } from "react-dom/client"\nimport { App } from "./app.js"\n\nconst root = document.getElementById("root")\nif (!root) throw new Error("Missing #root element")\ncreateRoot(root).render(<StrictMode><App /></StrictMode>)\n`,
    "apps/web/src/app.tsx": `import { Suspense } from "react"\nimport { routes } from "./routes.generated.js"\n\nfunction matches(pattern: string, path: string) {\n  const expected = pattern.split("/").filter(Boolean)\n  const actual = path.split("/").filter(Boolean)\n  return expected.length === actual.length && expected.every((part, index) => part.startsWith(":") || part === actual[index])\n}\n\nexport function App() {\n  const route = routes.find((candidate) => matches(candidate.path, window.location.pathname))\n  if (!route) return <main><h1>Not found</h1></main>\n  const Component = route.component\n  return <Suspense fallback={<main>Loading…</main>}><Component /></Suspense>\n}\n`,
    "apps/web/vite.config.ts": `import { defineConfig } from "vite"\nimport react from "@vitejs/plugin-react"\n\nexport default defineConfig({\n  plugins: [react()],\n  server: {\n    host: "0.0.0.0",\n    port: 3000,\n    proxy: { "/_loomstack": process.env.LOOMSTACK_API_URL ?? "http://localhost:3001" }\n  }\n})\n`,
    "apps/api/package.json": `${JSON.stringify({
      name: `@${appName}/api`,
      version: "0.0.4",
      private: true,
      type: "module",
      scripts: { dev: "tsx watch src/server.ts", build: "tsup src/server.ts --format esm --clean" },
      dependencies: {
        "@loomstack/koa": "^0.0.4",
        "@loomstack/runtime": "^0.0.4",
        "@loomstack/postgres": "^0.0.4",
        koa: "^3.2.1",
        "koa-bodyparser": "^4.4.1"
      },
      devDependencies: {
        "@types/koa": "^3.0.3",
        "@types/koa-bodyparser": "^4.3.13",
        tsup: "^8.5.0",
        tsx: "^4.20.0"
      }
    }, null, 2)}\n`,
    "apps/api/src/context.ts": `import type Koa from "koa"\nimport { PostgresDatabase } from "@loomstack/postgres"\n\nexport const db = new PostgresDatabase()\n\nexport async function createRequestContext(ctx: Koa.Context) {\n  const userId = ctx.get("x-user-id")\n  return {\n    requestId: ctx.get("x-request-id") || crypto.randomUUID(),\n    ...(userId ? { user: { id: userId } } : {}),\n    db,\n    logger: console\n  }\n}\n`,
    "apps/api/src/server.ts": `import Koa from "koa"\nimport bodyParser from "koa-bodyparser"\nimport { registerGeneratedRoutes } from "./routes.generated.js"\n\nconst app = new Koa()\napp.use(bodyParser())\nregisterGeneratedRoutes(app)\n\nconst port = Number(process.env.PORT ?? 3001)\napp.listen(port, () => console.log(\`loomstack API listening on http://localhost:\${port}\`))\n`
  }
}
