import { policy } from "@loomstack/runtime"
import type { Person } from "./model.schema.js"

export const peoplePolicy = policy({
  canRead(userId: string, person: Person) {
    return userId === person.ownerId
  },
  canWrite(userId: string, person: Person) {
    return userId === person.ownerId
  }
})
