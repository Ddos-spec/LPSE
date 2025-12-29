# LPSE Backend

Express.js backend API untuk LPSE Tender.

## Environment Variables

```env
PORT=3003
NODE_ENV=production
DATABASE_URL=postgres://user:password@host:5432/database
CORS_ORIGIN=https://your-frontend.vercel.app
SEARCH_MODE=fts
```

## Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm start
```

## Docker

```bash
docker build -t lpse-backend .
docker run -p 3003:3003 --env-file .env lpse-backend
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/tenders` - List tenders with filters
- `GET /api/tenders/:kodeTender` - Get tender detail
- `GET /api/stats` - Get statistics
- `GET /api/lpse` - List LPSE

## Easypanel Deployment

1. Create new App service in your project
2. Set source to GitHub repo, path: `backend`
3. Set environment variables
4. Deploy
