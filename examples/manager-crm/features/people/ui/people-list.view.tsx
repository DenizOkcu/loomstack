import { view } from "@loomstack/react"
import type { Person } from "../model.schema.js"

export default view<{ people: Person[] }>({
  name: "PeopleListView",
  query: { name: "listPeople" },
  render({ data, loading, error }) {
    if (loading) return <main>Loading people…</main>
    if (error) return <main role="alert">{error.message}</main>
    return (
      <main>
        <h1>People</h1>
        {data.people.length === 0 ? <p>No people yet.</p> : (
          <ul>{data.people.map((person) => <li key={person.id}><strong>{person.name}</strong>{person.title ? ` — ${person.title}` : ""}</li>)}</ul>
        )}
      </main>
    )
  }
})
