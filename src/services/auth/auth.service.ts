import { User } from "../../models/User"
import { Session } from "../../models/Session"
import { verifyPassword } from "./password"
import { newSessionId, expiresAtFromNow } from "./session"

export async function loginWithPassword(email: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user) throw Object.assign(new Error("Invalid credentials"), { status: 401 })

  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) throw Object.assign(new Error("Invalid credentials"), { status: 401 })

  const sessionId = newSessionId()
  const ttlDays = Number(process.env.SESSION_TTL_DAYS || 14)

  await Session.create({
    userId: user._id,
    sessionId,
    expiresAt: expiresAtFromNow(ttlDays),
  })

  return sessionId
}

export async function logoutSession(sessionId: string) {
  await Session.deleteOne({ sessionId })
}

export async function getMeFromSession(sessionId: string) {
  const session = await Session.findOne({ sessionId })
  if (!session) return null

  const user = await User.findById(session.userId).select("email role")
  return user
}