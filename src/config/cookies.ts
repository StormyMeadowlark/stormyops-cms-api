// src/config/cookies.ts

export function getSessionCookieOptions() {
  const isProd = process.env.NODE_ENV === "production"

  return {
    httpOnly: true,
    secure: isProd,                 // true in production (HTTPS)
    sameSite: "lax" as const,       // works for *.stormyops.com
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 14, // 14 days
  }
}