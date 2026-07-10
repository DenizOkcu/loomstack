import { array, query, schema } from "@loom/runtime"
import type { MemoryDatabase } from "@loom/sqlite"
import { PersonSchema } from "../model.schema.js"
import type { Person } from "../model.schema.js"

export const ListPeopleOutput = schema({ people: array(PersonSchema) })

export const listPeople = query<undefined, typeof ListPeopleOutput._output, MemoryDatabase>({
  name: "listPeople",
  output: ListPeopleOutput,
  auth: "authenticated",
  run(ctx) {
    const people = ctx.db.list<Person>("people", (person) => person.ownerId === ctx.user!.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    return { people }
  }
})
