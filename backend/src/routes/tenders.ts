import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { parseTendersQuery, normalizeTenderList } from '../lib/transform.js'
import { buildTenderWhere, searchTenderIds } from '../lib/search.js'

export const tendersRouter = Router()

// GET /api/tenders - List tenders with filters
tendersRouter.get('/', async (req, res) => {
  const startTime = Date.now()

  try {
    const query = req.query as Record<string, string | undefined>
    const { page, limit, skip, filters } = parseTendersQuery(query)

    let tenders: unknown[] = []
    let total = 0

    if (filters.search) {
      const { kodeTenders, total: searchTotal } = await searchTenderIds(filters, { skip, limit })
      total = searchTotal

      if (kodeTenders.length > 0) {
        tenders = await prisma.tender.findMany({
          where: { kode_tender: { in: kodeTenders } },
          orderBy: { created_at: 'desc' },
          include: { lpse: true },
        })
      }
    } else {
      const where = buildTenderWhere(filters)

      const [rows, count] = await Promise.all([
        prisma.tender.findMany({
          where,
          take: limit,
          skip,
          orderBy: { created_at: 'desc' },
          include: { lpse: true },
        }),
        prisma.tender.count({ where }),
      ])
      tenders = rows
      total = count
    }

    const totalPages = Math.ceil(total / limit)
    const hasMore = page < totalPages

    const safeTenders = normalizeTenderList(tenders as Record<string, unknown>[])

    const duration = Date.now() - startTime
    console.log(`GET /api/tenders - ${duration}ms - ${total} items found`)

    res.json({
      success: true,
      data: safeTenders,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasMore
      }
    })
  } catch (error) {
    console.error('Error fetching tenders:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      details: process.env.NODE_ENV !== 'production'
        ? (error instanceof Error ? error.message : String(error))
        : undefined
    })
  }
})

// GET /api/tenders/:kodeTender - Get single tender detail
tendersRouter.get('/:kodeTender', async (req, res) => {
  try {
    const { kodeTender } = req.params

    const tender = await prisma.tender.findFirst({
      where: { kode_tender: kodeTender },
      include: {
        lpse: true,
        tender_details: true,
      },
    })

    if (!tender) {
      return res.status(404).json({
        success: false,
        error: 'Tender not found'
      })
    }

    res.json({
      success: true,
      data: tender
    })
  } catch (error) {
    console.error('Error fetching tender detail:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    })
  }
})
