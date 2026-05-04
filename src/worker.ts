// src/worker.ts

import "./config/env"

import { connectDb } from "./config/db"
import "./jobs/workers/publish.worker"

async function startWorker() {
  await connectDb(process.env.MONGO_URI as string)
  console.log("Publish worker started")
}

startWorker().catch((err) => {
  console.error("Worker startup error:", err)
  process.exit(1)
})