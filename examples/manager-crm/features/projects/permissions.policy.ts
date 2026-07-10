import { policy } from "@loom/runtime"
import type { Project } from "./model.schema.js"

export const projectsPolicy = policy({
  canRead(userId: string, project: Project) {
    return userId === project.ownerId
  },
  canWrite(userId: string, project: Project) {
    return userId === project.ownerId
  }
})
