import crypto from "crypto"

const COMMENTER_COOKIE_NAME = "stormyops_commenter"

export function newCommenterToken() {
  return crypto.randomBytes(32).toString("hex")
}

export function hashCommenterToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export function getOrCreateCommenterToken(req: any, res: any) {
  const existing = req.cookies?.[COMMENTER_COOKIE_NAME]

  if (existing) return existing

  const token = newCommenterToken()

  res.cookie(COMMENTER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 365,
  })

  return token
}