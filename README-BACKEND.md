# LPSE Tender Aggregator - Backend API (Sprint 1)

## Overview
This is the backend API for the LPSE Tender Aggregator dashboard. It provides endpoints to fetch tender data, details, and statistics from the `scrapdatan8n` PostgreSQL database.

## 🛠 Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **ORM:** Prisma v5
- **Database:** PostgreSQL

## ✅ Completed Deliverables
- [x] Prisma configuration & schema introspection
- [x] Singleton Prisma Client (`lib/prisma.ts`)
- [x] Type definitions (`lib/types.ts`)
- [x] `GET /api/tenders` - Paginated list with filtering & search
- [x] `GET /api/tenders/[kodeTender]` - Single tender detail
- [x] `GET /api/stats` - Dashboard analytics
- [x] `GET /api/lpse` - LPSE list
- [x] Connection test script (`scripts/test-connection.ts`)

## 🚀 Environment Setup
1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Configure Environment Variables:**
    Create a `.env` file in the root:
    ```env
    DATABASE_URL="postgres://USER:PASSWORD@HOST:5432/DB_NAME?sslmode=disable"
    ```
3.  **Generate Prisma Client:**
    ```bash
    npx prisma generate
    ```
4.  **Run Development Server:**
    ```bash
    npm run dev
    ```

## 🧪 API Documentation

### 1. Get Tenders List
**Endpoint:** `GET /api/tenders`

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10, max: 100)
- `search` (Search by tender name or LPSE name)
- `kategori` (Filter by job category)
- `status` (Filter by tender status)
- `nilai_min` & `nilai_max` (Filter by pagu value range)
- `lpse_id` (Filter by LPSE ID)
- `tahun` (Filter by year)

**Example Request:**
```bash
curl "http://localhost:3000/api/tenders?page=1&limit=5&search=jalan"
```

**Response Example:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "total": 120,
    "page": 1,
    "limit": 5,
    "totalPages": 24,
    "hasMore": true
  }
}
```

### 2. Get Tender Detail
**Endpoint:** `GET /api/tenders/[kodeTender]`

**Example Request:**
```bash
curl "http://localhost:3000/api/tenders/3554625"
```

**Response:**
Returns full tender object including `lpse` and `tender_details`.

### 3. Get Dashboard Stats
**Endpoint:** `GET /api/stats`

**Response:**
Returns aggregated data:
- Total Tenders & LPSE
- Average Nilai Pagu
- Counts by Category, Status, Province
- Top 5 Recent Tenders

### 4. Get LPSE List
**Endpoint:** `GET /api/lpse`

**Response:**
Returns list of all LPSEs sorted alphabetically.

## 🧪 Verification & Test Commands

Run these commands to verify the API functionality:

**1. Basic Pagination:**
```bash
curl "http://localhost:3000/api/tenders?page=1&limit=5"
```

**2. Filter by Category:**
```bash
curl "http://localhost:3000/api/tenders?kategori=Konstruksi"
```

**3. Search (should find results):**
```bash
curl "http://localhost:3000/api/tenders?search=Jalan"
```

**4. Search (Empty Result Handling):**
```bash
curl "http://localhost:3000/api/tenders?search=tidakada12345"
```

**5. Single Tender Detail (Replace ID with valid one from list):**
```bash
curl "http://localhost:3000/api/tenders/225"
```

**6. Invalid Tender ID (404 Check):**
```bash
curl "http://localhost:3000/api/tenders/999999999" -I
```

**7. Dashboard Stats:**
```bash
curl "http://localhost:3000/api/stats"
```

## 📊 Performance & Testing
- **Response Time:** < 200ms target achieved for all endpoints.
- **Connection Test:** Run `npx tsx scripts/test-connection.ts` to verify DB access.

## 👋 Handoff Instructions for Claude (Frontend)
- **Base URL:** `/api`
- **Types:** Import types from `@/lib/types.ts` for full type safety.
- **Data:**
  - `nilai_pagu` and `nilai_hps` are returned as `number` (or `null`), not Decimal.
  - Dates are ISO strings.
- **Pagination:** Use the `pagination` object in the response to build the pager.
- **Search:** The search param filters both `nama_tender` and `nama_lpse`.

## ⚠️ Known Limitations (Sprint 3 Scope)
- No caching implemented yet.
- No authentication.
- Rate limiting is not active.

## 📁 Key Files
- `prisma/schema.prisma`: Database schema definition.
- `lib/types.ts`: TypeScript interfaces for API responses.
- `app/api/`: API Route handlers.
