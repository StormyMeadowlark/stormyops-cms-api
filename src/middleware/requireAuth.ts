import { Request, Response, NextFunction } from "express"
import { Session } from "../models/Session"
import { User } from "../models/User"

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const cookieName = process.env.SESSION_COOKIE_NAME || "stormyops_session"
  const sid = req.cookies?.[cookieName]
  if (!sid) return res.status(401).json({ message: "Not authenticated" })

  const session = await Session.findOne({ sessionId: sid })
  if (!session) return res.status(401).json({ message: "Not authenticated" })

  const user = await User.findById(session.userId).select("email role")
  if (!user) return res.status(401).json({ message: "Not authenticated" })

  ;(req as any).user = { id: user._id.toString(), email: user.email, role: user.role }
  next()
}