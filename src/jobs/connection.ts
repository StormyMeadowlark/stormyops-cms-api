import type { ConnectionOptions } from "bullmq"

function getRedisConnection(): ConnectionOptions {
  const url = process.env.REDIS_URL
  if (url) {
    const u = new URL(url)
    return {
      host: u.hostname,
      port: Number(u.port || 6379),
      password: u.password ? u.password : undefined,
      maxRetriesPerRequest: null,
    }
  }

  return {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
  }
}

export const bullConnection: ConnectionOptions = getRedisConnection()