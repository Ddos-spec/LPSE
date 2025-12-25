import { createClient } from 'redis'
import { CACHE_TTL_SECONDS } from '@/lib/cache-keys'

const CACHE_ENABLED = process.env.CACHE_ENABLED !== 'false'
const CACHE_WARMING = process.env.CACHE_WARMING !== 'false'
const REDIS_URL = process.env.REDIS_URL

const CACHE_NULL = '__CACHE_NULL__'

type RedisClient = ReturnType<typeof createClient>

declare global {
  // eslint-disable-next-line no-var
  var redisClient: RedisClient | undefined
  // eslint-disable-next-line no-var
  var redisClientPromise: Promise<RedisClient> | undefined
  // eslint-disable-next-line no-var
  var redisUnavailableLogged: boolean | undefined
}

async function getRedisClient() {
  if (!CACHE_ENABLED || !REDIS_URL) return null

  if (globalThis.redisClient && globalThis.redisClient.isOpen) {
    return globalThis.redisClient
  }

  if (!globalThis.redisClientPromise) {
    const client = createClient({ url: REDIS_URL })
    client.on('error', (error) => {
      if (!globalThis.redisUnavailableLogged) {
        globalThis.redisUnavailableLogged = true
        console.warn('[cache] Redis error:', error)
      }
    })

    globalThis.redisClientPromise = client.connect().then(() => {
      globalThis.redisClient = client
      globalThis.redisUnavailableLogged = false
      return client
    })
  }

  try {
    return await globalThis.redisClientPromise
  } catch (error) {
    if (!globalThis.redisUnavailableLogged) {
      globalThis.redisUnavailableLogged = true
      console.warn('[cache] Redis connection failed, caching disabled:', error)
    }
    globalThis.redisClientPromise = undefined
    return null
  }
}

export async function cacheGet<T>(key: string) {
  const client = await getRedisClient()
  if (!client) return null

  try {
    const value = await client.get(key)
    if (!value) return null
    if (value === CACHE_NULL) return null
    return JSON.parse(value) as T
  } catch (error) {
    console.warn(`[cache] Failed to read ${key}:`, error)
    return null
  }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number) {
  const client = await getRedisClient()
  if (!client) return false

  try {
    const payload =
      value === null || value === undefined ? CACHE_NULL : JSON.stringify(value)
    await client.setEx(key, ttlSeconds, payload)
    return true
  } catch (error) {
    console.warn(`[cache] Failed to write ${key}:`, error)
    return false
  }
}

export async function cacheDelete(key: string) {
  const client = await getRedisClient()
  if (!client) return false

  try {
    await client.del(key)
    return true
  } catch (error) {
    console.warn(`[cache] Failed to delete ${key}:`, error)
    return false
  }
}

export async function cacheDeleteByPrefix(prefix: string) {
  const client = await getRedisClient()
  if (!client) return 0

  let deleted = 0
  try {
    for await (const key of client.scanIterator({ MATCH: `${prefix}*`, COUNT: 100 })) {
      deleted += await client.del(key as string)
    }
  } catch (error) {
    console.warn(`[cache] Failed to delete prefix ${prefix}:`, error)
  }

  return deleted
}

type WarmTask<T> = {
  key: string
  ttlSeconds: number
  fetcher: () => Promise<T>
}

const warmedKeys = new Set<string>()

export async function warmCacheOnce<T>(task: WarmTask<T>) {
  if (!CACHE_WARMING || !CACHE_ENABLED) return
  if (warmedKeys.has(task.key)) return

  warmedKeys.add(task.key)
  try {
    const value = await task.fetcher()
    await cacheSet(task.key, value, task.ttlSeconds)
  } catch (error) {
    warmedKeys.delete(task.key)
    console.warn(`[cache] Warm failed for ${task.key}:`, error)
  }
}

export const CACHE_TTLS = CACHE_TTL_SECONDS
