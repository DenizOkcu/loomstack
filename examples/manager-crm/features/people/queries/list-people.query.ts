import { array, query, schema } from "@loomstack/runtime"
import type { Database } from "@loomstack/postgres"
import { PersonSchema } from "../model.schema.js"
import type { Person } from "../model.schema.js"

export const ListPeopleOutput = schema({ people: array(PersonSchema) })

export const listPeople = query<undefined, typeof ListPeopleOutput._output, Database>({
  name: "listPeople",
  output: ListPeopleOutput,
  auth: "authenticated",
  async run(ctx) {
    const people = (await ctx.db.list<Person>("people", (person) => person.ownerId === ctx.user!.id))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    return { people }
  }
})
