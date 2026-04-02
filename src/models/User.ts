// src/models/User.ts

import { Schema, model } from "mongoose"

export type UserRole = "admin" | "editor"

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "editor"], default: "admin" },
  },
  { timestamps: true }
)

export const User = model("User", UserSchema)