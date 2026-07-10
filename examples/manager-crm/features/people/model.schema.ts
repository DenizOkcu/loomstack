import { entity, id, text, timestamp, userId } from "@loom/runtime"

export const PersonSchema = entity("Person", {
  id: id(),
  name: text().min(1).max(120),
  title: text().max(120).optional(),
  ownerId: userId(),
  createdAt: timestamp(),
  updatedAt: timestamp()
})

export type Person = typeof PersonSchema._output
