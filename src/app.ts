import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import authRoutes from "./routes/v1/auth.routes"
import adminRoutes from "./routes/v1/admin.routes"
import { getSessionCookieOptions } from "./config/cookies"
import publicPostsRoutes from "./routes/v1/public.posts.routes"
import adminPostsRoutes from "./routes/v1/admin.posts.routes"
import healthRoutes from "./routes/v1/health.routes"
import adminMediaRoutes from "./routes/v1/admin.media.routes"
import adminMediaUploadRoutes from "./routes/v1/admin.media.upload.routes"

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

  // Health routes
  app.use("/api/v1/health", healthRoutes)

  // Mount auth routes
  app.use("/api/v1/auth", authRoutes)

  // Mount admin routes
  app.use("/api/v1/admin", adminRoutes)

  // Mount public post routes
  app.use("/api/v1/public/posts", publicPostsRoutes)

  // Mount admin post routes
  app.use("/api/v1/admin/posts", adminPostsRoutes)

  // Mount admin media routes
  app.use("/api/v1/admin/media", adminMediaRoutes)

    // Mount admin media upload routes
  app.use("/api/v1/admin/media", adminMediaUploadRoutes)
  
  // Global error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  const status = err.status || 500
  const message = err.message || "Internal server error"
  if (status >= 500) console.error(err)
  res.status(status).json({ message })
})

  return app
}