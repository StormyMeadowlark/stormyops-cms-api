import dotenv from "dotenv"
dotenv.config()

import { createApp } from "./app"

const app = createApp()
const port = process.env.PORT || 2025

app.listen(port, () => {
  console.log(`stormyops-cms-api running on port ${port}`)
})