import dotenv from "dotenv"
dotenv.config()

import bcrypt from "bcryptjs"
import { connectDb } from "../config/db"
import { User } from "../models/User"

async function seed() {
  await connectDb(process.env.MONGO_URI as string)

  const email = (process.env.SEED_ADMIN_EMAIL || "").toLowerCase()
  const password = process.env.SEED_ADMIN_PASSWORD || ""

  if (!email || !password) {
    throw new Error("Missing SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD in env")
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await User.updateOne(
    { email },
    { $set: { email, passwordHash, role: "admin" } },
    { upsert: true }
  )

  console.log(`Seeded admin user: ${email}`)
  process.exit(0)
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})