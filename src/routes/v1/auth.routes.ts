import { Router } from "express"
import { z } from "zod"
import { User } from "../../models/User"
import { Session } from "../../models/Session"
import { verifyPassword } from "../../services/auth/password"
import { newSessionId, expiresAtFromNow } from "../../services/auth/session"

const router = Router()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body)

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) return res.status(401).json({ message: "Invalid credentials" })

    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) return res.status(401).json({ message: "Invalid credentials" })

    const sessionId = newSessionId()
    const ttlDays = Number(process.env.SESSION_TTL_DAYS || 14)

    await Session.create({
      userId: user._id,
      sessionId,
      expiresAt: expiresAtFromNow(ttlDays),
    })

    const cookieName = process.env.SESSION_COOKIE_NAME || "stormyops_session"
    res.cookie(cookieName, sessionId, (req as any).cookieOptions)

    return res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

router.post("/logout", async (req, res, next) => {
  try {
    const cookieName = process.env.SESSION_COOKIE_NAME || "stormyops_session"
    const sid = req.cookies?.[cookieName]
    if (sid) await Session.deleteOne({ sessionId: sid })

    res.clearCookie(cookieName, (req as any).cookieOptions)
    return res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

router.get("/me", async (req, res, next) => {
  try {
    const cookieName = process.env.SESSION_COOKIE_NAME || "stormyops_session"
    const sid = req.cookies?.[cookieName]
    if (!sid) return res.status(401).json({ message: "Not authenticated" })

    const session = await Session.findOne({ sessionId: sid })
    if (!session) return res.status(401).json({ message: "Not authenticated" })

    const user = await User.findById(session.userId).select("email role")
    if (!user) return res.status(401).json({ message: "Not authenticated" })

    return res.json({ email: user.email, role: user.role })
  } catch (err) {
    next(err)
  }
})

export default router