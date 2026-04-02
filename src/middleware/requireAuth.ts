// src/middleware/requireAuth.ts

import { Request, Response, NextFunction } from "express"
import { Session } from "../models/Session"
import { User } from "../models/User"

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const cookieName = process.env.SESSION_COOKIE_NAME || "stormyops_session"
  const sid = req.cookies?.[cookieName]

  if (!sid) {
    return res.status(401).json({ message: "Not authenticated" })
  }

  const now = new Date()

  const session = await Session.findOne({
    sessionId: sid,
    expiresAt: { $gt: now },
  })

  if (!session) {
    const expiredSession = await Session.findOne({ sessionId: sid }).select("_id")
    if (expiredSession) {
      await Session.deleteOne({ _id: expiredSession._id })
    }

    return res.status(401).json({ message: "Not authenticated" })
  }

  const user = await User.findById(session.userId).select("email role")

  if (!user) {
    await Session.deleteOne({ _id: session._id })
    return res.status(401).json({ message: "Not authenticated" })
  }

  ;(req as any).user = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  }

  next()
}