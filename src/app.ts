import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import authRoutes from "./routes/v1/auth.routes"
import adminRoutes from "./routes/v1/admin.routes"
import { getSessionCookieOptions } from "./config/cookies"

export function createApp() {
  const app = express()

  // IMPORTANT for Cloudflare / reverse proxy setups
  app.set("trust proxy", 1)

  // Parse JSON bodies
  app.use(express.json({ limit: "2mb" }))

  // Parse cookies
  app.use(cookieParser())

  // CORS configuration
  const allowedOrigins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean)

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true) // allow server-to-server
        if (allowedOrigins.includes(origin)) {
          return callback(null, true)
        }
        return callback(new Error("CORS blocked origin: " + origin))
      },
      credentials: true,
    })
  )

  app.use((err: any, _req: any, res: any, next: any) => {
  if (err?.message?.startsWith("CORS blocked origin")) {
    return res.status(403).json({ message: err.message })
  }
  next(err)
  })
  // Cookie Options
    app.use((req, _res, next) => {
    ;(req as any).cookieOptions = getSessionCookieOptions()
    next()
    })

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ ok: true })
  })

  // Mount auth routes
  app.use("/v1/auth", authRoutes)

  // Mount admin routes
  app.use("/v1/admin", adminRoutes)

  // Global error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  const status = err.status || 500
  const message = err.message || "Internal server error"
  if (status >= 500) console.error(err)
  res.status(status).json({ message })
})

  return app
}