import fs from 'fs'

type TimingEntry = {
  count: number
  total: number
  min: number
  max: number
  samples: number[]
}

type CacheEntry = {
  hits: number
  misses: number
}

const MONITORING_ENABLED = process.env.MONITORING_ENABLED !== 'false'
const SAMPLE_SIZE = Number.parseInt(process.env.MONITORING_SAMPLE_SIZE || '500', 10)
const LOG_EVERY_MS = Number.parseInt(process.env.MONITORING_LOG_EVERY_MS || '60000', 10)
const LOG_FILE = process.env.MONITORING_LOG_FILE

const timings = new Map<string, TimingEntry>()
const cacheStats = new Map<string, CacheEntry>()
const dbQueries = new Map<string, number>()
const errors = new Map<string, number>()

let lastLogAt = 0

function recordSample(name: string, durationMs: number) {
  const entry = timings.get(name) || {
    count: 0,
    total: 0,
    min: Number.POSITIVE_INFINITY,
    max: 0,
    samples: [],
  }

  entry.count += 1
  entry.total += durationMs
  entry.min = Math.min(entry.min, durationMs)
  entry.max = Math.max(entry.max, durationMs)
  entry.samples.push(durationMs)

  if (entry.samples.length > SAMPLE_SIZE) {
    entry.samples.splice(0, entry.samples.length - SAMPLE_SIZE)
  }

  timings.set(name, entry)
}

function percentile(samples: number[], p: number) {
  if (samples.length === 0) return 0
  const sorted = [...samples].sort((a, b) => a - b)
  const idx = Math.floor((p / 100) * (sorted.length - 1))
  return sorted[idx]
}

function formatCacheEntry(entry: CacheEntry) {
  const total = entry.hits + entry.misses
  const hitRate = total > 0 ? (entry.hits / total) * 100 : 0
  return { ...entry, hitRate }
}

function maybeLog(message: string) {
  if (!LOG_FILE) return
  fs.appendFile(LOG_FILE, `${message}\n`, () => undefined)
}

export const monitoring = {
  recordTiming(name: string, durationMs: number) {
    if (!MONITORING_ENABLED) return
    recordSample(name, durationMs)
  },

  recordCacheHit(name: string) {
    if (!MONITORING_ENABLED) return
    const entry = cacheStats.get(name) || { hits: 0, misses: 0 }
    entry.hits += 1
    cacheStats.set(name, entry)
  },

  recordCacheMiss(name: string) {
    if (!MONITORING_ENABLED) return
    const entry = cacheStats.get(name) || { hits: 0, misses: 0 }
    entry.misses += 1
    cacheStats.set(name, entry)
  },

  recordDbQuery(name: string, count = 1) {
    if (!MONITORING_ENABLED) return
    dbQueries.set(name, (dbQueries.get(name) || 0) + count)
  },

  recordError(name: string) {
    if (!MONITORING_ENABLED) return
    errors.set(name, (errors.get(name) || 0) + 1)
  },

  snapshot() {
    const timingSnapshot: Record<string, unknown> = {}
    timings.forEach((entry, name) => {
      timingSnapshot[name] = {
        count: entry.count,
        avg: entry.count ? entry.total / entry.count : 0,
        min: entry.count ? entry.min : 0,
        max: entry.max,
        p50: percentile(entry.samples, 50),
        p95: percentile(entry.samples, 95),
        p99: percentile(entry.samples, 99),
      }
    })

    const cacheSnapshot: Record<string, unknown> = {}
    cacheStats.forEach((entry, name) => {
      cacheSnapshot[name] = formatCacheEntry(entry)
    })

    return {
      timings: timingSnapshot,
      cache: cacheSnapshot,
      dbQueries: Object.fromEntries(dbQueries.entries()),
      errors: Object.fromEntries(errors.entries()),
      memory: process.memoryUsage(),
    }
  },

  logIfNeeded(context: string) {
    if (!MONITORING_ENABLED) return
    const now = Date.now()
    if (now - lastLogAt < LOG_EVERY_MS) return

    lastLogAt = now
    const snapshot = monitoring.snapshot()
    const message = `[monitor] ${context} ${JSON.stringify(snapshot)}`
    console.log(message)
    maybeLog(message)
  },
}
