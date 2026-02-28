import crypto from "crypto"

export function newSessionId() {
  return crypto.randomBytes(32).toString("hex")
}

export function expiresAtFromNow(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}