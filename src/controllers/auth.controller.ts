import { Request, Response } from "express"
import { z } from "zod"
import { loginWithPassword, logoutSession, getMeFromSession } from "../services/auth/auth.service"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body)

  const sessionId = await loginWithPassword(email, password)

  const cookieName = process.env.SESSION_COOKIE_NAME || "stormyops_session"
  res.cookie(cookieName, sessionId, (req as any).cookieOptions)

  return res.json({ ok: true })
}

export async function logout(req: Request, res: Response) {
  const cookieName = process.env.SESSION_COOKIE_NAME || "stormyops_session"
  const sid = req.cookies?.[cookieName]
  if (sid) await logoutSession(sid)

  res.clearCookie(cookieName, (req as any).cookieOptions)
  return res.json({ ok: true })
}

export async function me(req: Request, res: Response) {
  const cookieName = process.env.SESSION_COOKIE_NAME || "stormyops_session"
  const sid = req.cookies?.[cookieName]

  if (!sid) {
    return res.status(401).json({ message: "Not authenticated" })
  }

  const user = await getMeFromSession(sid)

  if (!user) {
    res.clearCookie(cookieName, (req as any).cookieOptions)
    return res.status(401).json({ message: "Not authenticated" })
  }

  return res.json({ email: user.email, role: user.role })
}