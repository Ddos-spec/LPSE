# LPSE Deployment Guide (Decoupled: Vercel + VPS)

This guide deploys the frontend to Vercel and the backend API to Easypanel.

## Architecture
- Frontend (Vercel): Next.js UI only
- Backend (VPS/Easypanel): Next.js API routes, PostgreSQL, Redis
- Scraper: n8n (existing)

## Production URLs
- Frontend: https://your-app.vercel.app
- Backend API: https://lpse-backend-api.qk6yxt.easypanel.host
- Optional API domain: https://api.lpse-dashboard.yourdomain.com

## Step 1 - Deploy Backend to Easypanel
1) Create new app: "lpse-backend-api".
2) Source: connect this repo.
3) Build type: Dockerfile (uses `./Dockerfile`).
4) Expose port: `3000`.
5) Environment variables:
   DATABASE_URL=postgresql://postgres:a0bd3b3c1d54b783301f@postgres-scrapdatan8n:5432/postgres?schema=public
   REDIS_URL=redis://postgres-redis:6379
   ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:3000
   BACKEND_ONLY=true
   CACHE_ENABLED=true
   CACHE_WARMING=true
   SEARCH_MODE=fts
   MONITORING_ENABLED=true
   MONITORING_SAMPLE_SIZE=500
   MONITORING_LOG_EVERY_MS=60000
   MONITORING_LOG_FILE=
6) Deploy and wait for the app to be healthy.

Screenshots to capture:
- Easypanel app settings
- Environment variables screen
- Deployment logs

Notes:
- Internal service hosts are available via Docker network:
  - PostgreSQL: `postgres-scrapdatan8n:5432`
  - Redis: `postgres-redis:6379`
- If you prefer Easypanel Node.js app instead of Dockerfile:
  - Build command: `npm ci && npx prisma generate && npm run build`
  - Start command: `npm run start -- -H 0.0.0.0 -p 3000`

## Step 2 - Configure Backend Domain (optional)
1) Add custom domain in Easypanel: `api.lpse-dashboard.yourdomain.com`.
2) Update `ALLOWED_ORIGINS` to include the Vercel domain.
3) Update `NEXT_PUBLIC_API_URL` in Vercel to the new domain.
4) Update `vercel.json` rewrite destination to match.

## Step 3 - Deploy Frontend to Vercel
1) Push repo to GitHub.
2) Import to Vercel (framework: Next.js).
3) Set environment variables:
   NEXT_PUBLIC_API_URL=https://lpse-backend-api.qk6yxt.easypanel.host
4) Build command: `npm run build`.
5) Deploy.

## Step 4 - Production Tests
Backend:
- `curl "https://lpse-backend-api.qk6yxt.easypanel.host/api/tenders"`
- `curl "https://lpse-backend-api.qk6yxt.easypanel.host/api/stats"`
- `curl "https://lpse-backend-api.qk6yxt.easypanel.host/api/lpse"`

Frontend:
- Open `https://your-app.vercel.app`.
- Verify network calls go to the backend API domain.
- No CORS errors in the console.

## Rollback Plan
- Vercel: use "Rollback" on the previous deployment.
- Easypanel: redeploy the previous image or disable "lpse-backend-api".
- If needed, set `CACHE_ENABLED=false` and `SEARCH_MODE=contains` to reduce load.

## Reference Files
- `vercel.json` (frontend rewrites)
- `.env.production` (frontend env template)
- `Dockerfile` (backend container build)
