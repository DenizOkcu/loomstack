import { view } from "@loom/react"
import type { Commitment } from "../model.schema.js"

export default view<{ commitments: Commitment[] }>({
  name: "CommitmentsListView",
  query: { name: "listCommitments" },
  render({ data, loading, error }) {
    if (loading) return <main>Loading commitments…</main>
    if (error) return <main role="alert">{error.message}</main>
    const now = Date.now()
    return (
      <main>
        <h1>Commitments</h1>
        {data.commitments.length === 0 ? <p>No commitments yet.</p> : (
          <ul>{data.commitments.map((item) => {
            const dueAt = new Date(item.dueAt)
            const overdue = !item.completed && dueAt.getTime() < now
            return <li key={item.id}><strong>{item.summary}</strong> — <time dateTime={dueAt.toISOString()}>{dueAt.toLocaleDateString()}</time>{overdue ? " · overdue" : ""}</li>
          })}</ul>
        )}
      </main>
    )
  }
})
