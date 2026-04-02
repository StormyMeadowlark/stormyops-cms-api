// src/controllers/health.controller.ts

import { Request, Response } from "express"
import mongoose from "mongoose"
import { redisClient } from "../config/redis"

function getMongoStatus() {
  switch (mongoose.connection.readyState) {
    case 0:
      return "disconnected"
    case 1:
      return "connected"
    case 2:
      return "connecting"
    case 3:
      return "disconnecting"
    default:
      return "unknown"
  }
}

export async function liveHealth(_req: Request, res: Response) {
  return res.status(200).json({
    ok: true,
    service: "stormyops-cms-api",
    status: "live",
    timestamp: new Date().toISOString(),
  })
}

export async function readyHealth(_req: Request, res: Response) {
  const startedAt = Date.now()

  const mongoStatus = getMongoStatus()

  let redisStatus = "unknown"
  let redisError: string | null = null

  try {
    if (redisClient.status === "wait") {
      await redisClient.connect()
    }

    const pong = await redisClient.ping()
    redisStatus = pong === "PONG" ? "connected" : "unhealthy"
  } catch (err: any) {
    redisStatus = "disconnected"
    redisError = err?.message || "Redis ping failed"
  }

  const mongoOk = mongoStatus === "connected"
  const redisOk = redisStatus === "connected"
  const ok = mongoOk && redisOk

  return res.status(ok ? 200 : 503).json({
    ok,
    service: "stormyops-cms-api",
    status: ok ? "ready" : "not_ready",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    responseTimeMs: Date.now() - startedAt,
    checks: {
      api: "up",
      mongo: mongoStatus,
      redis: redisStatus,
    },
    ...(redisError ? { errors: { redis: redisError } } : {}),
  })
}