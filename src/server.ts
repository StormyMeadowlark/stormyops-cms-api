import dotenv from "dotenv"
dotenv.config()

import { createApp } from "./app"
import { connectDb } from "./config/db"

async function start() {
  await connectDb(process.env.MONGO_URI as string)

  const app = createApp()
  const port = process.env.PORT || 2025

  app.listen(port, () => {
    console.log(`stormyops-cms-api running on port ${port}`)
  })
}

start()