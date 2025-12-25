# LPSE Tender Aggregator - Frontend (Sprint 2)

## Overview
This document describes the frontend UI/UX implementation for the LPSE Tender Aggregator dashboard. Built with Next.js 16, React 19, shadcn/ui, and Tailwind CSS v4.

## Completed Deliverables

### Pages (4/4)
- [x] **Homepage `/`** - Tender list with filters, search, pagination, and table/card view toggle
- [x] **Detail Page `/tenders/[kodeTender]`** - Full tender info with requirements tabs
- [x] **Stats Page `/stats`** - Dashboard analytics with pie/bar charts
- [x] **Layout `layout.tsx`** - Navigation header and footer

### Components (10 total)
| Component | File | Purpose |
|-----------|------|---------|
| Navigation | `components/Navigation.tsx` | Header with nav links, mobile sheet menu |
| Footer | `components/Navigation.tsx` | Footer with branding |
| StatusBadge | `components/StatusBadge.tsx` | Color-coded status indicators |
| KategoriBadge | `components/StatusBadge.tsx` | Category badges with colors |
| FilterBar | `components/FilterBar.tsx` | Search, dropdown filters, view toggle |
| TenderTable | `components/TenderTable.tsx` | Data table for desktop |
| TenderCard | `components/TenderCard.tsx` | Card grid for mobile/alternative view |
| Pagination | `components/Pagination.tsx` | Page navigation controls |
| LoadingState | `components/LoadingState.tsx` | Skeleton loaders for all views |
| EmptyState | `components/EmptyState.tsx` | Empty/error states with retry |

### Utilities
- [x] **`lib/format.ts`** - Indonesian locale formatters:
  - `formatCurrency(value, compact?)` - Rp formatting with M/Jt/Rb abbreviations
  - `formatDate(date, format?)` - Indonesian month names
  - `formatDateTime(date)` - Full date-time with WIB
  - `formatRelativeTime(date)` - "X hari yang lalu"
  - `truncateText(text, maxLength)` - Text truncation with ellipsis
  - `formatNumber(value)` - Number with thousand separators
  - `formatPercentage(value)` - Percentage formatting

## Tech Stack
- **Framework:** Next.js 16.1.1 (App Router, Server Components)
- **Language:** TypeScript
- **UI Library:** shadcn/ui (button, card, input, select, table, tabs, badge, skeleton, separator, dropdown-menu, sheet)
- **Styling:** Tailwind CSS v4
- **Charts:** Recharts
- **Icons:** Lucide React
- **Font:** Inter (via next/font)

## Test Results

### Browser Testing Checklist
| Test | Status | Notes |
|------|--------|-------|
| Homepage loads | Passed | 200 OK |
| Stats page loads | Passed | 200 OK |
| Tender detail page | Passed | 200 OK, 404 for invalid |
| Filters apply correctly | Passed | URL params update |
| Pagination works | Passed | Page navigation works |
| Search debounced | Passed | 500ms debounce |
| View toggle (table/card) | Passed | State preserved |
| Loading states show | Passed | Skeleton loaders work |
| Empty states show | Passed | Shows when no data |
| Mobile responsive | Passed | Tested 375px, 768px, 1024px |

### API Endpoints Tested
```
GET /                           200 OK
GET /stats                      200 OK
GET /tenders/[kodeTender]       200 OK (404 for invalid)
GET /api/tenders                200 OK
GET /api/stats                  200 OK
GET /?search=test&kategori=X    200 OK
GET /?page=2                    200 OK
```

### Mobile Responsive Testing
- **375px (iPhone SE):** Navigation collapses to sheet, table scrolls horizontally
- **768px (iPad):** 2-column card grid, sidebar filters stack
- **1024px (Desktop):** Full table view, 3-column card grid

## Page Details

### Homepage `/`
**Features:**
- Hero section with title and subtitle
- FilterBar with:
  - Debounced search input (500ms)
  - Kategori dropdown (6 options)
  - Status dropdown (9 options)
  - View toggle (table/card)
  - Clear filters button with count badge
- Active filters display as removable badges
- TenderTable (desktop) or TenderCardGrid (mobile/toggle)
- Pagination with page numbers
- Empty state when no results

### Detail Page `/tenders/[kodeTender]`
**Sections:**
- Breadcrumb navigation
- Hero: Nama tender, nilai pagu (large), status/kategori badges
- CTA button "Lihat Dokumen Asli" (links to url_detail)
- Info grid (8 cards): LPSE, Lokasi, Tahun, Tahap, Status, Kategori, Dibuat, Diperbarui
- Requirements tabs: Umum, Teknis, Kualifikasi, Dokumen
  - Handles array, object, and string data formats
  - Shows "Tidak ada data" for missing sections

**Edge Cases Handled:**
- 404 page for invalid kode_tender
- Graceful handling of missing tender_details
- Loading skeleton while fetching

### Stats Page `/stats`
**Widgets:**
- 4 Metric cards: Total Tenders, Total LPSE, Avg Nilai Pagu, Total Nilai (estimate)
- Kategori distribution (Pie chart)
- Status distribution (Donut chart with legend)
- Top 10 Provinsi (Horizontal bar chart)
- Recent tenders list (5 items with links)

## Design Decisions

1. **Mobile-first approach:** Components designed for 375px first, then enhanced
2. **Server Components by default:** Only `TenderList`, `StatsContent`, `FilterBar`, `Navigation` are Client Components
3. **View mode toggle:** Users can switch between table and card views (persisted in state)
4. **Debounced search:** 500ms delay to prevent excessive API calls
5. **Indonesian locale:** All currency/dates formatted for Indonesian users
6. **Color system:** Blue primary, semantic colors for status badges
7. **Accessible:** ARIA labels on buttons, keyboard navigation, focus states

## Dependencies Added

```json
{
  "lucide-react": "^0.x.x",
  "recharts": "^2.x.x",
  "clsx": "^2.x.x",
  "tailwind-merge": "^2.x.x",
  "class-variance-authority": "^0.x.x",
  "@radix-ui/react-*": "shadcn dependencies",
  "tw-animate-css": "^1.x.x"
}
```

## File Structure

```
app/
├── layout.tsx              # Root layout with Navigation & Footer
├── page.tsx                # Homepage (Server Component)
├── TenderList.tsx          # Client component for tender list
├── globals.css             # Tailwind + shadcn CSS variables
├── stats/
│   ├── page.tsx            # Stats page (Server Component)
│   ├── StatsContent.tsx    # Charts and metrics
│   └── loading.tsx         # Loading skeleton
└── tenders/
    └── [kodeTender]/
        ├── page.tsx        # Tender detail (Server Component)
        ├── loading.tsx     # Loading skeleton
        └── not-found.tsx   # 404 page

components/
├── ui/                     # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── table.tsx
│   ├── tabs.tsx
│   ├── badge.tsx
│   ├── skeleton.tsx
│   ├── separator.tsx
│   ├── dropdown-menu.tsx
│   └── sheet.tsx
├── Navigation.tsx          # Header + Footer
├── StatusBadge.tsx         # Status & Kategori badges
├── FilterBar.tsx           # Search & filter controls
├── TenderTable.tsx         # Table view
├── TenderCard.tsx          # Card view
├── Pagination.tsx          # Page controls
├── LoadingState.tsx        # Skeleton loaders
└── EmptyState.tsx          # Empty/error states

lib/
├── utils.ts                # cn() utility
├── format.ts               # Indonesian formatters
├── types.ts                # API types (from Sprint 1)
└── prisma.ts               # Prisma client (from Sprint 1)
```

## Known Limitations

1. **No client-side sorting:** Table sorting would require additional state management
2. **No persistent view mode:** View toggle resets on page refresh
3. **No dark mode toggle:** Dark mode is system preference only
4. **Charts not responsive labels:** Long labels may overlap on small screens
5. **No image optimization:** No tender images to optimize

## Handoff Instructions for ChatGPT o1 (Sprint 3)

### Performance Optimization Opportunities

1. **Data Fetching:**
   - Consider implementing React Query or SWR for client-side caching
   - Add `revalidate` options to Server Component fetches
   - Implement infinite scroll instead of pagination for mobile

2. **Bundle Size:**
   - Recharts is heavy (~300KB) - consider lighter alternatives (e.g., unovis, chart.js)
   - Lazy load stats page charts with `dynamic()` or `React.lazy()`
   - Consider code-splitting FilterBar for homepage

3. **Rendering:**
   - Add `loading.tsx` to homepage for better Suspense boundaries
   - Consider React Server Components streaming for tender list
   - Memoize expensive computations in chart data transformations

4. **Assets:**
   - Add proper Open Graph images
   - Consider adding favicon/app icons

5. **Caching Strategy:**
   - Homepage: 60s revalidate (stale-while-revalidate)
   - Stats: 5min revalidate (less frequently updated)
   - Tender detail: No cache (real-time data)

### Files to Focus On

| Priority | File | Reason |
|----------|------|--------|
| High | `app/stats/StatsContent.tsx` | Heavy charts, could lazy load |
| High | `app/TenderList.tsx` | Main data fetching, could use caching |
| Medium | `components/TenderTable.tsx` | Could virtualize for large datasets |
| Low | `components/FilterBar.tsx` | Already optimized with debounce |

### Quick Wins
1. Add `export const dynamic = 'force-dynamic'` to homepage
2. Add proper `<meta>` tags for SEO
3. Compress CSS with purge unused styles
4. Add preconnect hints for API domain

## Commands

```bash
# Development
npm run dev

# Build (production)
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## Success Criteria Met

- [x] `npm run dev` shows working dashboard
- [x] Can browse tender list, apply filters, see results
- [x] Can click tender and see detail page
- [x] Can view stats page with charts
- [x] Mobile view works (tested in DevTools)
- [x] No console errors in browser
- [x] `npm run build` succeeds
- [x] README-FRONTEND.md complete

---

**Sprint 2 Complete.** Ready for performance optimization in Sprint 3.
