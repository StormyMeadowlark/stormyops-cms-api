import Redis from "ioredis"

function createRedisClient() {
  const url = process.env.REDIS_URL

  if (url) {
    return new Redis(url, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    })
  }

  return new Redis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 1,
    lazyConnect: true,
  })
}

export const redisClient = createRedisClient()