import { policy } from "@loomstack/runtime"
import type { Commitment } from "./model.schema.js"

export const commitmentsPolicy = policy({
  canRead(userId: string, commitment: Commitment) {
    return userId === commitment.ownerId
  },
  canWrite(userId: string, commitment: Commitment) {
    return userId === commitment.ownerId
  }
})
