// src/jobs/queues/publish.queue.ts

import { Queue } from "bullmq"
import { bullConnection } from "../connection"

export const publishQueue = new Queue("publish-post", {
  connection: bullConnection,
})