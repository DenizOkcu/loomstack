import { view } from "@loomstack/react"
import type { Project } from "../model.schema.js"

export default view<{ projects: Project[] }>({
  name: "ProjectsListView",
  query: { name: "listProjects" },
  render({ data, loading, error }) {
    if (loading) return <main>Loading projects…</main>
    if (error) return <main role="alert">{error.message}</main>
    return (
      <main>
        <h1>Projects</h1>
        {data.projects.length === 0 ? <p>No projects yet.</p> : (
          <ul>{data.projects.map((project) => <li key={project.id}><strong>{project.name}</strong> — {project.status} · {project.risk} risk</li>)}</ul>
        )}
      </main>
    )
  }
})
