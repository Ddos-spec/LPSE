# Production Deployment Guide

This guide targets Vercel + PostgreSQL + Redis, optimized for a 4GB RAM / 2 vCPU VPS or managed services.

## 1) Environment Variables

Create `.env.production` and configure:

```
NODE_ENV=production
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DB_NAME
REDIS_URL=redis://:PASSWORD@HOST:6379
CACHE_ENABLED=true
CACHE_WARMING=true
SEARCH_MODE=fts
MONITORING_ENABLED=true
MONITORING_SAMPLE_SIZE=500
MONITORING_LOG_EVERY_MS=60000
MONITORING_LOG_FILE=
NEXT_PUBLIC_API_URL=https://your-domain.com
```

## 2) Redis Configuration

- Use `allkeys-lru` eviction to avoid memory spikes.
- Ensure `maxmemory` is set for a 4GB server (ex: 256MB-512MB).
- Verify:
  - `redis-cli ping` -> `PONG`
  - App can connect via `REDIS_URL`

## 3) Database Commands

No schema changes were introduced in Sprint 3, but you should still:

```
npx prisma generate
```

If you manage migrations elsewhere, run:

```
npx prisma migrate deploy
```

## 4) Vercel Deployment Steps

1. Connect repo to Vercel.
2. Set environment variables (from `.env.production`) in Vercel project settings.
3. Use build command: `npm run build`
4. Use output: default (Next.js).
5. Deploy.

## 5) Post-Deployment Validation

```
curl -I https://your-domain.com/api/lpse
curl -I https://your-domain.com/api/stats
curl -I https://your-domain.com/api/tenders?page=1&limit=10
```

Check:
- `x-cache` header shows `MISS` then `HIT`
- Response times improve on repeated requests
- No 5xx errors in logs

## 6) Monitoring Setup

- Enable `MONITORING_ENABLED=true`
- Review logs in Vercel or VPS:
  - Look for `[monitor]` entries
  - Track p95/p99 and cache hit rates
- Optional: set `MONITORING_LOG_FILE` for file-based logs

## 7) Backup Strategy

- PostgreSQL:
  - Daily `pg_dump` to offsite storage
  - Retain at least 7 days
- Redis:
  - Treat as cache-only (rebuildable)
  - Enable AOF snapshots if using Redis for rate limiting in future

## 8) Rollback Steps

1. Set `CACHE_ENABLED=false` to disable Redis caching.
2. Set `SEARCH_MODE=contains` to disable FTS.
3. Redeploy previous build via Vercel rollback.
4. Verify endpoints and monitor error rate.
