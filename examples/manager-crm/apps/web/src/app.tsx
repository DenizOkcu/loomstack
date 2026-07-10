import { Suspense } from "react"
import { routes } from "./routes.generated.js"

function matches(pattern: string, path: string) {
  const expected = pattern.split("/").filter(Boolean)
  const actual = path.split("/").filter(Boolean)
  return expected.length === actual.length && expected.every((part, index) => part.startsWith(":") || part === actual[index])
}

export function App() {
  const route = routes.find((candidate) => matches(candidate.path, window.location.pathname))
  if (!route) return <main><h1>Not found</h1></main>
  const Component = route.component
  return <Suspense fallback={<main>Loading…</main>}><Component /></Suspense>
}
