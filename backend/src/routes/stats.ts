import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { normalizeTenderList } from '../lib/transform.js'

export const statsRouter = Router()

statsRouter.get('/', async (req, res) => {
  const startTime = Date.now()

  try {
    const [
      totalTenders,
      totalLpse,
      avgResult,
      kategoriGroups,
      statusGroups,
      provinsiGroups,
      recentTenders
    ] = await Promise.all([
      prisma.tender.count(),
      prisma.lpse.count(),
      prisma.tender.aggregate({
        _avg: { nilai_pagu: true }
      }),
      prisma.tender.groupBy({
        by: ['kategori_pekerjaan'],
        _count: { _all: true },
        orderBy: { _count: { kategori_pekerjaan: 'desc' } },
        take: 10
      }),
      prisma.tender.groupBy({
        by: ['status_tender'],
        _count: { _all: true },
        orderBy: { _count: { status_tender: 'desc' } }
      }),
      prisma.lpse.groupBy({
        by: ['provinsi'],
        _sum: { total_tenders: true },
        orderBy: { _sum: { total_tenders: 'desc' } }
      }),
      prisma.tender.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: { lpse: true }
      })
    ])

    const duration = Date.now() - startTime
    console.log(`GET /api/stats - ${duration}ms`)

    // Transform results
    const byKategori: Record<string, number> = {}
    kategoriGroups.forEach(g => {
      if (g.kategori_pekerjaan) byKategori[g.kategori_pekerjaan] = g._count._all
    })

    const byStatus: Record<string, number> = {}
    statusGroups.forEach(g => {
      if (g.status_tender) byStatus[g.status_tender] = g._count._all
    })

    const byProvinsi: Record<string, number> = {}
    provinsiGroups.forEach(g => {
      if (g.provinsi) byProvinsi[g.provinsi] = g._sum.total_tenders || 0
    })

    res.json({
      success: true,
      data: {
        totalTenders,
        totalLpse,
        avgNilaiPagu: avgResult._avg.nilai_pagu ? Number(avgResult._avg.nilai_pagu) : 0,
        byKategori,
        byStatus,
        byProvinsi,
        recentTenders: normalizeTenderList(recentTenders as Record<string, unknown>[])
      }
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      details: process.env.NODE_ENV !== 'production'
        ? (error instanceof Error ? error.message : String(error))
        : undefined
    })
  }
})
