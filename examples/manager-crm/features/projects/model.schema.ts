import { entity, id, oneOf, text, timestamp, userId } from "@loom/runtime"

export const ProjectSchema = entity("Project", {
  id: id(),
  name: text().min(1).max(160),
  status: oneOf(["active", "archived"]),
  risk: oneOf(["low", "medium", "high"]),
  ownerId: userId(),
  createdAt: timestamp(),
  updatedAt: timestamp()
})

export type Project = typeof ProjectSchema._output
